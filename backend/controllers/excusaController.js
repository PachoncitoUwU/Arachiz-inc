const prisma = require('../lib/prisma');
const { uploadToSupabase, isSupabaseConfigured } = require('../utils/supabaseStorage');

// Crear excusa
const createExcusa = async (req, res) => {
  const { fechas, motivo, resultadoId } = req.body;
  const aprendizId = req.user.id;

  if (!fechas || !motivo || !resultadoId) {
    return res.status(400).json({ error: 'Faltan datos obligatorios' });
  }

  try {
    // Parse fechas
    const fechasArray = typeof fechas === 'string' ? JSON.parse(fechas) : fechas;
    
    if (!Array.isArray(fechasArray) || fechasArray.length === 0) {
      return res.status(400).json({ error: 'Debes seleccionar al menos una fecha' });
    }

    // Verificar que el aprendiz está inscrito en la ficha del resultado
    const resultado = await prisma.resultadoAprendizaje.findUnique({
      where: { id: resultadoId },
      include: { 
        competencia: { 
          include: { 
            ficha: { 
              include: { 
                aprendices: { where: { id: aprendizId } }
              }
            }
          }
        },
        horarios: true
      }
    });

    if (!resultado) {
      return res.status(404).json({ error: 'Resultado de aprendizaje no encontrado' });
    }

    if (resultado.competencia.ficha.aprendices.length === 0) {
      return res.status(403).json({ error: 'No estás inscrito en esta ficha' });
    }

    // Verificar que no esté evitando este resultado
    const resultadoEvitado = await prisma.resultadoEvitado.findUnique({
      where: {
        aprendizId_resultadoId: {
          aprendizId,
          resultadoId
        }
      }
    });

    if (resultadoEvitado) {
      return res.status(400).json({ error: 'No puedes enviar excusas para resultados de aprendizaje que evitas' });
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
      const tieneClase = resultado.horarios.some(h => h.dia === diaSemana);

      if (!tieneClase) {
        return res.status(400).json({ error: `No hay clases de ${resultado.nombre} los días ${diaSemana}` });
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
        resultadoId
      },
      include: {
        resultado: { 
          select: { 
            nombre: true,
            competencia: {
              select: {
                nombre: true,
                ficha: { select: { numero: true, nombre: true } }
              }
            }
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
        resultado: {
          select: {
            nombre: true,
            competencia: {
              select: {
                nombre: true,
                ficha: { select: { numero: true, nombre: true } }
              }
            }
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

// Obtener excusas de los resultados a cargo del instructor
const getExcusasInstructor = async (req, res) => {
  const instructorId = req.user.id;
  const { estado } = req.query;

  try {
    // Obtener todos los resultados del instructor
    const resultados = await prisma.resultadoAprendizaje.findMany({
      where: { instructorId },
      select: { id: true }
    });

    const resultadosIds = resultados.map(r => r.id);

    const where = { resultadoId: { in: resultadosIds } };

    if (estado && estado !== 'Todas') {
      where.estado = estado;
    }

    const excusas = await prisma.excusa.findMany({
      where,
      include: {
        aprendiz: {
          select: { fullName: true, document: true }
        },
        resultado: {
          select: {
            nombre: true,
            competencia: {
              select: {
                nombre: true,
                ficha: { select: { numero: true, nombre: true } }
              }
            }
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

// Actualizar estado de excusa (aprobar/rechazar)
const updateExcusaEstado = async (req, res) => {
  const { id } = req.params;
  const { estado, respuesta } = req.body;
  const instructorId = req.user.id;

  if (!['Aprobada', 'Rechazada', 'Pendiente'].includes(estado)) {
    return res.status(400).json({ error: 'Estado inválido' });
  }

  try {
    // Verificar que la excusa pertenece a un resultado a cargo del instructor
    const excusa = await prisma.excusa.findUnique({
      where: { id },
      include: {
        resultado: { select: { instructorId: true } }
      }
    });

    if (!excusa) {
      return res.status(404).json({ error: 'Excusa no encontrada' });
    }

    if (excusa.resultado.instructorId !== instructorId) {
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
        resultado: { select: { nombre: true } }
      }
    });

    res.json({ message: 'Excusa actualizada correctamente', excusa: excusaActualizada });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Error al actualizar excusa: ' + err.message });
  }
};

// Obtener resultados del aprendiz con horarios (filtrando evitados)
const getResultadosConHorarios = async (req, res) => {
  const aprendizId = req.user.id;

  try {
    // Obtener todas las fichas del aprendiz
    const fichas = await prisma.ficha.findMany({
      where: {
        aprendices: { some: { id: aprendizId } }
      },
      include: {
        competencias: {
          include: {
            resultados: {
              include: {
                horarios: true
              }
            }
          }
        }
      }
    });

    // Filtrar resultados evitados
    const resultadosEvitados = await prisma.resultadoEvitado.findMany({
      where: { aprendizId },
      select: { resultadoId: true }
    });

    const resultadosEvitadosIds = resultadosEvitados.map(re => re.resultadoId);

    const resultados = [];
    fichas.forEach(ficha => {
      ficha.competencias.forEach(competencia => {
        competencia.resultados.forEach(resultado => {
          if (!resultadosEvitadosIds.includes(resultado.id)) {
            resultados.push({
              id: resultado.id,
              nombre: `${competencia.nombre} - ${resultado.nombre}`,
              ficha: { numero: ficha.numero, nombre: ficha.nombre },
              horarios: resultado.horarios
            });
          }
        });
      });
    });

    res.json({ resultados });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Error al obtener resultados: ' + err.message });
  }
};

// Eliminar excusa (enviar a papelera)
const deleteExcusa = async (req, res) => {
  const { id } = req.params;
  const userId = req.user.id;
  const userType = req.user.userType;
  
  try {
    const excusa = await prisma.excusa.findUnique({
      where: { id },
      include: {
        resultado: {
          include: {
            competencia: {
              include: {
                ficha: true
              }
            },
            instructor: { select: { fullName: true } }
          }
        },
        aprendiz: { select: { fullName: true } }
      }
    });
    
    if (!excusa) {
      return res.status(404).json({ error: 'Excusa no encontrada' });
    }
    
    // Verificar permisos
    const isInstructor = excusa.resultado.instructorId === userId;
    const isAdmin = userType === 'administrador' && excusa.resultado.competencia.ficha.administradorId === userId;
    
    if (!isInstructor && !isAdmin) {
      return res.status(403).json({ error: 'No tienes permiso para eliminar esta excusa' });
    }
    
    // Enviar a papelera
    await enviarAPapelera(
      'excusa',
      id,
      excusa.resultado.competencia.fichaId,
      userId,
      userType,
      `Excusa de ${excusa.aprendiz.fullName} eliminada`
    );
    
    // Eliminar excusa
    await prisma.excusa.delete({ where: { id } });
    
    // Registrar en historial
    await crearHistorialCambio(
      excusa.resultado.competencia.fichaId,
      userId,
      'enviar_papelera',
      'excusa',
      id,
      `Envió la excusa de ${excusa.aprendiz.fullName} a la papelera`
    );
    
    res.json({ message: 'Excusa enviada a la papelera exitosamente' });
  } catch (err) {
    res.status(500).json({ error: 'Error al eliminar excusa: ' + err.message });
  }
};

module.exports = {
  createExcusa,
  getMyExcusas,
  getExcusasInstructor,
  updateExcusaEstado,
  updateExcusa,
  deleteExcusa,
  getResultadosConHorarios
};
