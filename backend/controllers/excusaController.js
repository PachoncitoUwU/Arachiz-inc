const prisma = require('../lib/prisma');
const { uploadToSupabase, isSupabaseConfigured } = require('../utils/supabaseStorage');

// Crear excusa
const createExcusa = async (req, res) => {
  const { fechas, motivo, materiaId } = req.body;
  const aprendizId = req.user.id;

  if (!fechas || !motivo || !materiaId) {
    return res.status(400).json({ error: 'Faltan datos obligatorios' });
  }

  try {
    // Parse fechas
    const fechasArray = typeof fechas === 'string' ? JSON.parse(fechas) : fechas;
    
    if (!Array.isArray(fechasArray) || fechasArray.length === 0) {
      return res.status(400).json({ error: 'Debes seleccionar al menos una fecha' });
    }

    // Verificar que el aprendiz está inscrito en la ficha de la materia
    const materia = await prisma.materia.findUnique({
      where: { id: materiaId },
      include: { 
        ficha: { 
          include: { 
            aprendices: { where: { id: aprendizId } }
          }
        },
        horarios: true
      }
    });

    if (!materia) {
      return res.status(404).json({ error: 'Materia no encontrada' });
    }

    if (materia.ficha.aprendices.length === 0) {
      return res.status(403).json({ error: 'No estás inscrito en esta ficha' });
    }

    // Verificar que no esté evitando esta materia
    const materiaEvitada = await prisma.materiaEvitada.findUnique({
      where: {
        aprendizId_materiaId: {
          aprendizId,
          materiaId
        }
      }
    });

    if (materiaEvitada) {
      return res.status(400).json({ error: 'No puedes enviar excusas para materias que evitas' });
    }

    // Validar todas las fechas
    const hoy = new Date();
    hoy.setHours(23, 59, 59, 999);

    for (const fechaStr of fechasArray) {
      const fechaExcusa = new Date(fechaStr + 'T00:00:00');
      
      if (fechaExcusa > hoy) {
        return res.status(400).json({ error: 'No puedes enviar excusas para fechas futuras' });
      }

      // Validar que la fecha corresponda a un día con clase según el horario
      const diaSemana = ['Domingo', 'Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado'][fechaExcusa.getDay()];
      const tieneClase = materia.horarios.some(h => h.dia === diaSemana);

      if (!tieneClase) {
        return res.status(400).json({ error: `No hay clases de ${materia.nombre} los días ${diaSemana}` });
      }
    }

    // Subir archivos si existen
    let archivosUrls = [];
    if (req.files && req.files.length > 0) {
      if (!isSupabaseConfigured) {
        return res.status(500).json({ error: 'Configuración de almacenamiento no disponible' });
      }
      
      for (const file of req.files) {
        const url = await uploadToSupabase(file.buffer, file.originalname, 'excusas');
        archivosUrls.push(url);
      }
    }

    // Crear la excusa
    const excusa = await prisma.excusa.create({
      data: {
        fechas: JSON.stringify(fechasArray),
        motivo,
        archivosUrls: archivosUrls.length > 0 ? JSON.stringify(archivosUrls) : null,
        aprendizId,
        materiaId
      },
      include: {
        materia: { 
          select: { 
            nombre: true,
            ficha: { select: { numero: true, nombre: true } }
          } 
        },
        aprendiz: { select: { fullName: true, document: true } }
      }
    });

    res.status(201).json({ message: 'Excusa enviada correctamente', excusa });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Error al enviar excusa: ' + err.message });
  }
};

// Obtener excusas del aprendiz
const getMyExcusas = async (req, res) => {
  const aprendizId = req.user.id;
  const { estado } = req.query;

  try {
    const where = { aprendizId };

    if (estado && estado !== 'Todas') {
      where.estado = estado;
    }

    const excusas = await prisma.excusa.findMany({
      where,
      include: {
        materia: {
          select: {
            nombre: true,
            ficha: { select: { numero: true, nombre: true } }
          }
        }
      },
      orderBy: { createdAt: 'desc' }
    });

    res.json({ excusas });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Error al obtener excusas: ' + err.message });
  }
};

// Obtener excusas de las materias del instructor
const getExcusasInstructor = async (req, res) => {
  const instructorId = req.user.id;
  const { estado } = req.query;

  try {
    // Obtener todas las materias del instructor
    const materias = await prisma.materia.findMany({
      where: { instructorId },
      select: { id: true }
    });

    const materiasIds = materias.map(m => m.id);

    const where = { materiaId: { in: materiasIds } };

    if (estado && estado !== 'Todas') {
      where.estado = estado;
    }

    const excusas = await prisma.excusa.findMany({
      where,
      include: {
        aprendiz: {
          select: { fullName: true, document: true }
        },
        materia: {
          select: {
            nombre: true,
            ficha: { select: { numero: true, nombre: true } }
          }
        }
      },
      orderBy: { createdAt: 'desc' }
    });

    res.json({ excusas });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Error al obtener excusas: ' + err.message });
  }
};

// Actualizar estado de excusa (aprobar/rechazar) - Ahora permite editar después
const updateExcusaEstado = async (req, res) => {
  const { id } = req.params;
  const { estado, respuesta } = req.body;
  const instructorId = req.user.id;

  if (!['Aprobada', 'Rechazada', 'Pendiente'].includes(estado)) {
    return res.status(400).json({ error: 'Estado inválido' });
  }

  try {
    // Verificar que la excusa pertenece a una materia del instructor
    const excusa = await prisma.excusa.findUnique({
      where: { id },
      include: {
        materia: { select: { instructorId: true } }
      }
    });

    if (!excusa) {
      return res.status(404).json({ error: 'Excusa no encontrada' });
    }

    if (excusa.materia.instructorId !== instructorId) {
      return res.status(403).json({ error: 'No tienes permiso para responder esta excusa' });
    }

    // Actualizar la excusa
    const excusaActualizada = await prisma.excusa.update({
      where: { id },
      data: {
        estado,
        respuesta: respuesta || null,
        respondedAt: estado !== 'Pendiente' ? new Date() : null
      }
    });

    res.json({ message: `Excusa ${estado.toLowerCase()} correctamente`, excusa: excusaActualizada });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Error al actualizar excusa: ' + err.message });
  }
};

// Editar excusa pendiente
const updateExcusa = async (req, res) => {
  const { id } = req.params;
  const { motivo, fechas } = req.body;
  const aprendizId = req.user.id;

  try {
    const excusa = await prisma.excusa.findUnique({
      where: { id }
    });

    if (!excusa) {
      return res.status(404).json({ error: 'Excusa no encontrada' });
    }

    if (excusa.aprendizId !== aprendizId) {
      return res.status(403).json({ error: 'No tienes permiso para editar esta excusa' });
    }

    if (excusa.estado !== 'Pendiente') {
      return res.status(400).json({ error: 'Solo puedes editar excusas pendientes' });
    }

    // Subir nuevos archivos si existen
    let archivosUrls = excusa.archivosUrls ? JSON.parse(excusa.archivosUrls) : [];
    if (req.files && req.files.length > 0) {
      if (!isSupabaseConfigured) {
        return res.status(500).json({ error: 'Configuración de almacenamiento no disponible' });
      }
      
      archivosUrls = [];
      for (const file of req.files) {
        const url = await uploadToSupabase(file.buffer, file.originalname, 'excusas');
        archivosUrls.push(url);
      }
    }

    const excusaActualizada = await prisma.excusa.update({
      where: { id },
      data: {
        motivo: motivo || excusa.motivo,
        fechas: fechas || excusa.fechas,
        archivosUrls: archivosUrls.length > 0 ? JSON.stringify(archivosUrls) : null,
        updatedAt: new Date()
      },
      include: {
        materia: { select: { nombre: true } }
      }
    });

    res.json({ message: 'Excusa actualizada correctamente', excusa: excusaActualizada });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Error al actualizar excusa: ' + err.message });
  }
};

// Obtener materias del aprendiz con horarios
const getMateriasConHorarios = async (req, res) => {
  const aprendizId = req.user.id;

  try {
    // Obtener todas las fichas del aprendiz
    const fichas = await prisma.ficha.findMany({
      where: {
        aprendices: { some: { id: aprendizId } }
      },
      include: {
        materias: {
          include: {
            horarios: true
          }
        }
      }
    });

    // Filtrar materias que no está evitando
    const materiasEvitadas = await prisma.materiaEvitada.findMany({
      where: { aprendizId },
      select: { materiaId: true }
    });

    const materiasEvitadasIds = materiasEvitadas.map(me => me.materiaId);

    const materias = [];
    fichas.forEach(ficha => {
      ficha.materias.forEach(materia => {
        if (!materiasEvitadasIds.includes(materia.id)) {
          materias.push({
            id: materia.id,
            nombre: materia.nombre,
            ficha: { numero: ficha.numero, nombre: ficha.nombre },
            horarios: materia.horarios
          });
        }
      });
    });

    res.json({ materias });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Error al obtener materias: ' + err.message });
  }
};

module.exports = {
  createExcusa,
  getMyExcusas,
  getExcusasInstructor,
  updateExcusaEstado,
  updateExcusa,
  getMateriasConHorarios
};
