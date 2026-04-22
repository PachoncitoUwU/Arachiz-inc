const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

// RF08 - Crear sesión
const createSession = async (req, res) => {
  const { materiaId } = req.body;
  const instructorId = req.user.id;
  if (!materiaId) return res.status(400).json({ error: 'Falta la materia' });
  try {
    // Verificar que no haya sesión activa para esta materia
    const existing = await prisma.asistencia.findFirst({
      where: { materiaId, activa: true }
    });
    if (existing) return res.status(400).json({ error: 'Ya hay una sesión activa para esta materia' });

    // La fecha SIEMPRE será el día de hoy, puesta por el servidor
    const autoFecha = new Date().toISOString().split('T')[0];

    const newAsistencia = await prisma.asistencia.create({
      data: {
        fecha: autoFecha,
        materia: { connect: { id: materiaId } },
        instructor: { connect: { id: instructorId } },
        activa: true
      },
      include: {
        registros: { include: { aprendiz: { select: { fullName: true, document: true } } } },
        materia: { include: { ficha: { select: { numero: true, aprendices: { select: { id: true, fullName: true, document: true, nfcUid: true, huellas: true, faceDescriptor: true } } } } } }
      }
    });
    const io = req.app.get('io');
    const serialService = req.app.get('serialService');
    if (serialService) serialService.sendCommand('SESSION ON');

    res.status(201).json({ message: 'Sesión creada', asistencia: newAsistencia });
  } catch (err) {
    res.status(500).json({ error: 'Error al crear la sesión: ' + err.message });
  }
};

// RF24/RF55 - Sesiones por materia
const getSessionsByMateria = async (req, res) => {
  const { materiaId } = req.params;
  try {
    const list = await prisma.asistencia.findMany({
      where: { materiaId },
      include: {
        registros: {
          include: { aprendiz: { select: { fullName: true, document: true } } }
        },
        instructor: { select: { fullName: true } }
      },
      orderBy: { timestamp: 'desc' }
    });
    res.json({ asistencias: list });
  } catch (err) {
    res.status(500).json({ error: 'Error del servidor: ' + err.message });
  }
};

// RF30/RF31 - Historial del aprendiz
const getMyAttendance = async (req, res) => {
  const aprendizId = req.user.id;
  try {
    const registros = await prisma.registroAsistencia.findMany({
      where: { aprendizId },
      include: {
        asistencia: {
          include: {
            materia: { select: { nombre: true, tipo: true } }
          }
        }
      },
      orderBy: { timestamp: 'desc' }
    });
    res.json({ registros });
  } catch (err) {
    res.status(500).json({ error: 'Error: ' + err.message });
  }
};

// RF09 - Registrar asistencia
const registerAttendance = async (req, res) => {
  const { asistenciaId, metodo } = req.body;
  const targetAprendizId = req.user.id;
  try {
    const asistencia = await prisma.asistencia.findUnique({
      where: { id: asistenciaId },
      include: { materia: { include: { ficha: { include: { aprendices: true } } } } }
    });
    if (!asistencia) return res.status(404).json({ error: 'No se encontró la sesión' });
    if (!asistencia.activa) return res.status(400).json({ error: 'La sesión de asistencia ya finalizó' });

    const perteneceAFicha = asistencia.materia.ficha.aprendices.some(a => a.id === targetAprendizId);
    if (!perteneceAFicha) {
      return res.status(403).json({ error: 'No perteneces a la ficha de esta materia' });
    }

    const existing = await prisma.registroAsistencia.findUnique({
      where: { asistenciaId_aprendizId: { asistenciaId, aprendizId: targetAprendizId } }
    });
    if (existing) return res.status(400).json({ error: 'Ya registraste tu asistencia en esta sesión' });

    const registro = await prisma.registroAsistencia.create({
      data: {
        presente: true,
        metodo: metodo || 'codigo',
        asistencia: { connect: { id: asistenciaId } },
        aprendiz: { connect: { id: targetAprendizId } }
      },
      include: { aprendiz: { select: { fullName: true, document: true } } }
    });

    const io = req.app.get('io');
    if (io) {
      io.to(`session_${asistenciaId}`).emit('nuevaAsistencia', {
        aprendizId: targetAprendizId,
        fullName: registro.aprendiz.fullName,
        presente: true,
        metodo: registro.metodo,
        timestamp: registro.timestamp
      });
    }
    res.json({ message: 'Asistencia registrada', registro });
  } catch (err) {
    res.status(500).json({ error: 'Error al registrar asistencia: ' + err.message });
  }
};

// RFXX - Registrar asistencia con Hardware (Instructor)
const registerHardwareAttendance = async (req, res) => {
  const { asistenciaId, nfcUid, huellaId } = req.body;
  if (!asistenciaId) return res.status(400).json({ error: 'Falta asistenciaId' });

  try {
    const whereClauses = [];
    if (nfcUid) whereClauses.push({ nfcUid });
    if (huellaId !== undefined) whereClauses.push({ huellas: { has: parseInt(huellaId, 10) } });

    if (whereClauses.length === 0) {
      return res.status(400).json({ error: 'Se requiere nfcUid o huellaId' });
    }

    const aprendiz = await prisma.user.findFirst({ where: { OR: whereClauses } });
    if (!aprendiz) return res.status(404).json({ error: 'Usuario no encontrado para este hardware' });

    const asistencia = await prisma.asistencia.findUnique({
      where: { id: asistenciaId },
      include: { materia: { include: { ficha: { include: { aprendices: true } } } } }
    });
    if (!asistencia || !asistencia.activa) return res.status(400).json({ error: 'Sesión inactiva o no encontrada' });

    const perteneceAFicha = asistencia.materia.ficha.aprendices.some(a => a.id === aprendiz.id);
    if (!perteneceAFicha) return res.status(403).json({ error: 'Aprendiz no pertenece a esta ficha' });

    const existing = await prisma.registroAsistencia.findUnique({
      where: { asistenciaId_aprendizId: { asistenciaId, aprendizId: aprendiz.id } }
    });

    if (existing) {
       // Si ya existía pero era false, no lo pisamos aquí. Si solo queríamos mostrar un check, retornamos.
       return res.status(400).json({ error: 'Ya registró su asistencia previamente' });
    }

    const registro = await prisma.registroAsistencia.create({
      data: {
        presente: true,
        metodo: nfcUid ? 'nfc' : 'huella',
        asistencia: { connect: { id: asistenciaId } },
        aprendiz: { connect: { id: aprendiz.id } }
      },
      include: { aprendiz: { select: { fullName: true, document: true } } }
    });

    const io = req.app.get('io');
    if (io) {
      io.to(`session_${asistenciaId}`).emit('nuevaAsistencia', {
        aprendizId: aprendiz.id,
        fullName: registro.aprendiz.fullName,
        presente: true,
        metodo: registro.metodo,
        timestamp: registro.timestamp
      });
    }

    res.json({ message: 'Asistencia de hardware registrada', registro });
  } catch (err) {
    res.status(500).json({ error: 'Error al procesar hardware: ' + err.message });
  }
};


// RF28/RF42 - Finalizar sesión
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
    if (!asistencia.activa) return res.status(400).json({ error: 'La sesión ya fue cerrada' });

    const todosAprendices = asistencia.materia.ficha.aprendices;
    const registradosIds = asistencia.registros.map(r => r.aprendizId);
    const ausentes = todosAprendices.filter(a => !registradosIds.includes(a.id));

    if (ausentes.length > 0) {
      await prisma.registroAsistencia.createMany({
        data: ausentes.map(a => ({
          presente: false,
          metodo: 'automatico',
          asistenciaId: asistencia.id,
          aprendizId: a.id
        }))
      });
    }

    const updatedAsistencia = await prisma.asistencia.update({
      where: { id },
      data: { activa: false },
      include: {
        registros: { include: { aprendiz: { select: { fullName: true, document: true } } } }
      }
    });

    const io = req.app.get('io');
    const serialService = req.app.get('serialService');
    if (serialService) serialService.sendCommand('SESSION OFF');
    if (io) io.to(`session_${id}`).emit('sessionClosed', { id });

    res.json({ message: 'Sesión finalizada. Ausencias marcadas automáticamente.', asistencia: updatedAsistencia });
  } catch (err) {
    res.status(500).json({ error: 'Error al finalizar sesión: ' + err.message });
  }
};

// RF39/RF50 - Sesión activa de una materia
const getActiveSession = async (req, res) => {
  const { materiaId } = req.params;
  try {
    const session = await prisma.asistencia.findFirst({
      where: { materiaId, activa: true },
      include: {
        registros: { include: { aprendiz: { select: { id: true, fullName: true, document: true } } } },
        materia: {
          include: {
            ficha: {
              include: { aprendices: { select: { id: true, fullName: true, document: true, nfcUid: true, huellas: true, faceDescriptor: true } } }
            },
            instructor: { select: { fullName: true } }
          }
        }
      }
    });
    res.json({ session: session || null });
  } catch (err) {
    res.status(500).json({ error: 'Error: ' + err.message });
  }
};

// Buscar sesión activa por ID de sesión directamente (para aprendices)
const getSessionById = async (req, res) => {
  const { id } = req.params;
  try {
    const session = await prisma.asistencia.findUnique({
      where: { id },
      include: {
        registros: { include: { aprendiz: { select: { id: true, fullName: true, document: true } } } },
        materia: {
          include: {
            ficha: {
              include: { aprendices: { select: { id: true, fullName: true, document: true, nfcUid: true, huellas: true, faceDescriptor: true } } }
            },
            instructor: { select: { fullName: true } }
          }
        }
      }
    });
    if (!session) return res.status(404).json({ error: 'Sesión no encontrada' });
    res.json({ session });
  } catch (err) {
    res.status(500).json({ error: 'Error: ' + err.message });
  }
};

// Buscar CUALQUIER sesión activa del instructor en el momento
const getMyActiveAnySession = async (req, res) => {
  try {
    const session = await prisma.asistencia.findFirst({
      where: { instructorId: req.user.id, activa: true },
      include: {
        registros: { include: { aprendiz: { select: { id: true, fullName: true, document: true } } } },
        materia: {
          include: {
            ficha: {
              include: { aprendices: { select: { id: true, fullName: true, document: true, nfcUid: true, huellas: true, faceDescriptor: true } } }
            },
            instructor: { select: { fullName: true } }
          }
        }
      }
    });
    res.json({ session: session || null });
  } catch (err) {
    res.status(500).json({ error: 'Error: ' + err.message });
  }
};

// Registrar asistencia por reconocimiento facial (instructor)
// El instructor ya identificó al aprendiz en el frontend
const registerFacialAttendance = async (req, res) => {
  const { asistenciaId, aprendizId } = req.body;
  if (!asistenciaId || !aprendizId) {
    return res.status(400).json({ error: 'Faltan asistenciaId o aprendizId' });
  }

  try {
    const asistencia = await prisma.asistencia.findUnique({
      where: { id: asistenciaId },
      include: { materia: { include: { ficha: { include: { aprendices: true } } } } }
    });
    if (!asistencia || !asistencia.activa) {
      return res.status(400).json({ error: 'Sesión inactiva o no encontrada' });
    }

    const perteneceAFicha = asistencia.materia.ficha.aprendices.some(a => a.id === aprendizId);
    if (!perteneceAFicha) {
      return res.status(403).json({ error: 'Aprendiz no pertenece a esta ficha' });
    }

    const existing = await prisma.registroAsistencia.findUnique({
      where: { asistenciaId_aprendizId: { asistenciaId, aprendizId } }
    });
    if (existing) {
      return res.status(400).json({ error: 'Este aprendiz ya registró asistencia' });
    }

    const registro = await prisma.registroAsistencia.create({
      data: {
        presente: true,
        metodo: 'facial',
        asistencia: { connect: { id: asistenciaId } },
        aprendiz: { connect: { id: aprendizId } }
      },
      include: { aprendiz: { select: { fullName: true, document: true } } }
    });

    const io = req.app.get('io');
    if (io) {
      io.to(`session_${asistenciaId}`).emit('nuevaAsistencia', {
        aprendizId,
        fullName: registro.aprendiz.fullName,
        presente: true,
        metodo: 'facial',
        timestamp: registro.timestamp
      });
    }

    res.json({ message: 'Asistencia facial registrada', registro });
  } catch (err) {
    res.status(500).json({ error: 'Error: ' + err.message });
  }
};

// Registro manual por instructor
const registerManualAttendance = async (req, res) => {
  const { asistenciaId, aprendizId } = req.body;
  const instructorId = req.user.id;

  if (!asistenciaId || !aprendizId) {
    return res.status(400).json({ error: 'Faltan datos requeridos' });
  }

  try {
    // Verificar que la sesión existe, está activa y pertenece al instructor
    const session = await prisma.asistencia.findFirst({
      where: {
        id: asistenciaId,
        instructorId,
        activa: true
      },
      include: {
        materia: {
          include: {
            ficha: {
              include: {
                aprendices: true
              }
            }
          }
        }
      }
    });

    if (!session) {
      return res.status(404).json({ error: 'Sesión no encontrada o no activa' });
    }

    // Verificar que el aprendiz pertenece a la ficha
    const isEnrolled = session.materia.ficha.aprendices.some(a => a.id === aprendizId);
    if (!isEnrolled) {
      return res.status(403).json({ error: 'El aprendiz no pertenece a esta ficha' });
    }

    // Verificar si ya está registrado
    const existing = await prisma.registroAsistencia.findFirst({
      where: {
        asistenciaId,
        aprendizId
      }
    });

    if (existing) {
      return res.status(400).json({ error: 'El aprendiz ya está registrado' });
    }

    // Registrar asistencia
    const registro = await prisma.registroAsistencia.create({
      data: {
        presente: true,
        metodo: 'manual',
        asistencia: { connect: { id: asistenciaId } },
        aprendiz: { connect: { id: aprendizId } }
      },
      include: { 
        aprendiz: { 
          select: { 
            id: true,
            fullName: true, 
            document: true,
            email: true
          } 
        } 
      }
    });

    // Emitir evento socket
    const io = req.app.get('io');
    if (io) {
      io.to(`session_${asistenciaId}`).emit('nuevaAsistencia', {
        id: registro.id,
        aprendizId: registro.aprendizId,
        aprendiz: registro.aprendiz,
        presente: true,
        metodo: 'manual',
        timestamp: registro.timestamp
      });
    }

    res.json({ message: 'Asistencia registrada manualmente', registro });
  } catch (err) {
    console.error('Error en registro manual:', err);
    res.status(500).json({ error: 'Error: ' + err.message });
  }
};

module.exports = { createSession, getSessionsByMateria, getMyAttendance, registerAttendance, registerHardwareAttendance, endSession, getActiveSession, getSessionById, getMyActiveAnySession, registerFacialAttendance, registerManualAttendance };

