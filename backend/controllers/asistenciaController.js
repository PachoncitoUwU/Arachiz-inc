const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

const createSession = async (req, res) => {
  const { materiaId, fecha } = req.body;
  const instructorId = req.user.id;

  if (!materiaId || !fecha) return res.status(400).json({ error: 'Faltan datos' });
  
  try {
    const newAsistencia = await prisma.asistencia.create({
      data: {
        fecha,
        materia: { connect: { id: materiaId } },
        instructor: { connect: { id: instructorId } },
        activa: true
      },
      include: {
        registros: true
      }
    });

    res.status(201).json({ message: 'Sesión creada', asistencia: newAsistencia });
  } catch (err) {
    res.status(500).json({ error: 'Error al crear la sesión: ' + err.message });
  }
};

const getSessionsByMateria = async (req, res) => {
  const { materiaId } = req.params;
  
  try {
    const list = await prisma.asistencia.findMany({
      where: { materiaId },
      include: {
        registros: {
          include: {
            aprendiz: { select: { fullName: true, document: true } }
          }
        }
      },
      orderBy: { timestamp: 'desc' }
    });
    res.json({ asistencias: list });
  } catch (err) {
    res.status(500).json({ error: 'Error del servidor: ' + err.message });
  }
};

const registerAttendance = async (req, res) => {
  const { asistenciaId, presente } = req.body;
  
  // Siempre se toma el ID del token para mayor seguridad
  const targetAprendizId = req.user.id;

  try {
    const asistencia = await prisma.asistencia.findUnique({
      where: { id: asistenciaId },
      include: { materia: { include: { ficha: { include: { aprendices: true } } } } }
    });
    
    if (!asistencia) return res.status(404).json({ error: 'No se encontró la sesión' });
    if (!asistencia.activa) return res.status(400).json({ error: 'La sesión de asistencia ya finalizó' });

    // Verificar si el aprendiz pertenece a la ficha
    const perteneceAFicha = asistencia.materia.ficha.aprendices.some(a => a.id === targetAprendizId);
    if (!perteneceAFicha) {
      return res.status(403).json({ error: 'No perteneces a la ficha de esta materia' });
    }

    // RF41: Solo una asistencia por sesión (Manejado por upsert o controlando existencia)
    const existing = await prisma.registroAsistencia.findUnique({
      where: { asistenciaId_aprendizId: { asistenciaId, aprendizId: targetAprendizId } }
    });
    
    if (existing) {
      await prisma.registroAsistencia.update({
        where: { id: existing.id },
        data: { presente }
      });
    } else {
      await prisma.registroAsistencia.create({
        data: {
          presente: presente !== undefined ? presente : true,
          asistencia: { connect: { id: asistenciaId } },
          aprendiz: { connect: { id: targetAprendizId } }
        }
      });
    }

    const io = req.app.get('io');
    if (io) {
      io.to(`session_${asistenciaId}`).emit('nuevaAsistencia', {
        aprendizId: targetAprendizId,
        presente
      });
    }

    res.json({ message: 'Asistencia registrada' });
  } catch (err) {
    res.status(500).json({ error: 'Error al registrar asistencia: ' + err.message });
  }
};

const endSession = async (req, res) => {
  const { id } = req.params;
  
  try {
    const asistencia = await prisma.asistencia.findUnique({
      where: { id },
      include: {
        registros: true,
        materia: { include: { ficha: { include: { aprendices: true } } } }
      }
    });

    if (!asistencia) return res.status(404).json({ error: 'Sesión no encontrada' });

    // RF28: Cierre de sesión y RF42: Ausencias automáticas
    // 1. Obtenemos todos los aprendices inscritos en la ficha de esta materia
    const todosAprendices = asistencia.materia.ficha.aprendices;
    
    // 2. Comparamos los que están registrados
    const registradosIds = asistencia.registros.map(r => r.aprendizId);
    
    // 3. Los que no están registrados se marcan como ausentes
    const ausentes = todosAprendices.filter(a => !registradosIds.includes(a.id));
    
    if (ausentes.length > 0) {
      await prisma.registroAsistencia.createMany({
        data: ausentes.map(a => ({
          presente: false,
          asistenciaId: asistencia.id,
          aprendizId: a.id
        }))
      });
    }

    // 4. Se cierra la sesión activa
    const updatedAsistencia = await prisma.asistencia.update({
      where: { id },
      data: { activa: false },
      include: { registros: true }
    });
    
    res.json({ message: 'Sesión finalizada. Ausencias marcadas automáticamente.', asistencia: updatedAsistencia });
  } catch (err) {
    res.status(500).json({ error: 'Error al finalizar sesión: ' + err.message });
  }
};

module.exports = {
  createSession,
  getSessionsByMateria,
  registerAttendance,
  endSession
};
