const prisma = require('../lib/prisma');
const { enviarAPapelera, crearHistorialCambio } = require('./papeleraController');

// Crear competencia
const createCompetencia = async (req, res) => {
  const { fichaId, nombre, tipo } = req.body;
  const userId = req.user.id;
  const userType = req.user.userType;
  
  if (!fichaId || !nombre) return res.status(400).json({ error: 'Faltan datos' });
  
  try {
    const ficha = await prisma.ficha.findUnique({
      where: { id: fichaId },
      include: { instructores: true }
    });
    
    if (!ficha) {
      return res.status(404).json({ error: 'Ficha no encontrada' });
    }
    
    // Verificar permisos
    let tienePermiso = false;
    if (userType === 'instructor') {
      tienePermiso = ficha.instructores.some(i => i.instructorId === userId);
    } else if (userType === 'administrador') {
      tienePermiso = ficha.administradorId === userId;
    }
    
    if (!tienePermiso) {
      return res.status(403).json({ error: 'No tienes permiso para agregar competencias a esta ficha' });
    }
    
    const newCompetencia = await prisma.competencia.create({
      data: {
        nombre,
        tipo: tipo || 'Técnica',
        ficha: { connect: { id: fichaId } }
      },
      include: {
        ficha: { select: { id: true, numero: true, nombre: true } }
      }
    });
    
    // Registrar en historial
    await crearHistorialCambio(
      fichaId,
      userId,
      'competencia_creada',
      'competencia',
      newCompetencia.id,
      `Creó la competencia "${nombre}"`
    );
    
    res.status(201).json({ message: 'Competencia creada', competencia: newCompetencia });
  } catch (err) {
    res.status(500).json({ error: 'Error al crear competencia: ' + err.message });
  }
};

// Eliminar competencia (papelera + eliminar)
const deleteCompetencia = async (req, res) => {
  const { id } = req.params;
  const userId = req.user.id;
  const userType = req.user.userType;
  
  try {
    const competencia = await prisma.competencia.findUnique({
      where: { id },
      include: { ficha: true }
    });
    
    if (!competencia) return res.status(404).json({ error: 'Competencia no encontrada' });
    
    // Verificar permisos: líder de la ficha o administrador de la ficha
    const isLider = competencia.ficha.instructorAdminId === userId;
    const isAdmin = userType === 'administrador' && competencia.ficha.administradorId === userId;
    
    if (!isLider && !isAdmin) {
      return res.status(403).json({ error: 'No tienes permiso para eliminar esta competencia' });
    }
    
    // Enviar a papelera antes de eliminar
    await enviarAPapelera(
      'competencia',
      id,
      competencia.fichaId,
      userId,
      userType,
      `Competencia ${competencia.nombre} eliminada por ${userType}`
    );
    
    // Eliminar competencia (cascadas configuradas en prisma eliminan los resultados)
    await prisma.competencia.delete({ where: { id } });
    
    // Registrar en historial
    await crearHistorialCambio(
      competencia.fichaId,
      userId,
      'enviar_papelera',
      'competencia',
      id,
      `Envió la competencia "${competencia.nombre}" a la papelera`
    );
    
    res.json({ message: 'Competencia enviada a la papelera exitosamente' });
  } catch (err) {
    res.status(500).json({ error: 'Error al enviar competencia a papelera: ' + err.message });
  }
};

// Editar competencia
const updateCompetencia = async (req, res) => {
  const { id } = req.params;
  const { nombre, tipo } = req.body;
  const userId = req.user.id;
  const userType = req.user.userType;
  
  if (!nombre || !tipo) {
    return res.status(400).json({ error: 'Nombre y tipo son obligatorios' });
  }
  
  if (!['Técnica', 'Transversal', 'Básica'].includes(tipo)) {
    return res.status(400).json({ error: 'El tipo debe ser Técnica, Transversal o Básica' });
  }
  
  try {
    const competencia = await prisma.competencia.findUnique({
      where: { id },
      include: { ficha: true }
    });
    
    if (!competencia) {
      return res.status(404).json({ error: 'Competencia no encontrada' });
    }
    
    // Verificar permisos: líder de la ficha o administrador de la ficha
    const isLider = competencia.ficha.instructorAdminId === userId;
    const isAdmin = userType === 'administrador' && competencia.ficha.administradorId === userId;
    
    if (!isLider && !isAdmin) {
      return res.status(403).json({ error: 'No tienes permiso para editar esta competencia' });
    }
    
    const updatedCompetencia = await prisma.competencia.update({
      where: { id },
      data: { nombre, tipo },
      include: {
        ficha: { select: { numero: true } }
      }
    });
    
    // Registrar en historial
    await crearHistorialCambio(
      competencia.fichaId,
      userId,
      'competencia_actualizada',
      'competencia',
      id,
      `Actualizó la competencia "${competencia.nombre}"`
    );
    
    res.json({ message: 'Competencia actualizada', competencia: updatedCompetencia });
  } catch (err) {
    res.status(500).json({ error: 'Error al actualizar competencia: ' + err.message });
  }
};

// Obtener competencias de una ficha
const getCompetenciasByFicha = async (req, res) => {
  const { fichaId } = req.params;
  try {
    const competencias = await prisma.competencia.findMany({
      where: { fichaId },
      include: {
        ficha: { select: { numero: true } },
        resultados: {
          include: {
            instructor: { select: { id: true, fullName: true } },
            horarios: true,
            asistencias: {
              where: { activa: true },
              select: { id: true, activa: true }
            }
          }
        }
      }
    });
    res.json({ competencias });
  } catch (err) {
    res.status(500).json({ error: 'Error al obtener competencias: ' + err.message });
  }
};

// Obtener competencias del usuario (para instructores y aprendices)
const getUserCompetencias = async (req, res) => {
  const userId = req.user.id;
  const userType = req.user.userType;
  try {
    if (userType === 'instructor') {
      // Devuelve TODAS las competencias de las fichas del instructor (no solo donde tiene resultados a cargo)
      const fichasInstructor = await prisma.fichaInstructor.findMany({
        where: { instructorId: userId },
        select: { fichaId: true }
      });

      const fichaIds = fichasInstructor.map(fi => fi.fichaId);

      if (fichaIds.length === 0) return res.json({ competencias: [] });

      const misCompetencias = await prisma.competencia.findMany({
        where: { fichaId: { in: fichaIds } },
        include: {
          ficha: { select: { numero: true, id: true, nombre: true, nivel: true, jornada: true, instructorAdminId: true } },
          resultados: {
            include: {
              instructor: { select: { id: true, fullName: true } },
              horarios: true,
              asistencias: {
                where: { activa: true },
                select: { id: true, activa: true }
              },
              _count: { select: { asistencias: true } }
            }
          }
        }
      });
      return res.json({ competencias: misCompetencias });
    } else {
      // Para aprendices: obtener competencias de sus fichas, excluyendo los resultados evitados
      const misFichas = await prisma.ficha.findMany({
        where: { aprendices: { some: { id: userId } } },
        select: { id: true }
      });
      
      if (misFichas.length === 0) return res.json({ competencias: [] });
      
      const fichaIds = misFichas.map(f => f.id);
      
      // Obtener resultados evitados por el aprendiz
      const resultadosEvitados = await prisma.resultadoEvitado.findMany({
        where: { aprendizId: userId },
        select: { resultadoId: true }
      });
      
      const resultadosEvitadosIds = resultadosEvitados.map(re => re.resultadoId);
      
      // Obtener competencias de las fichas del aprendiz
      const misCompetencias = await prisma.competencia.findMany({
        where: { fichaId: { in: fichaIds } },
        include: {
          ficha: { select: { numero: true, id: true, nombre: true } },
          resultados: {
            where: {
              id: { notIn: resultadosEvitadosIds }
            },
            include: {
              instructor: { select: { fullName: true } },
              horarios: true,
              asistencias: {
                include: {
                  registros: {
                    where: { aprendizId: userId },
                    select: { presente: true }
                  }
                }
              }
            }
          }
        }
      });
      
      return res.json({ competencias: misCompetencias });
    }
  } catch (err) {
    res.status(500).json({ error: 'Error del servidor: ' + err.message });
  }
};

module.exports = {
  createCompetencia,
  deleteCompetencia,
  updateCompetencia,
  getCompetenciasByFicha,
  getUserCompetencias
};
