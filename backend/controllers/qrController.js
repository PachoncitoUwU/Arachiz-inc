const prisma = require('../lib/prisma');
const crypto = require('crypto');
const { getCurrentColombiaTime } = require('../utils/timeService');

// Almacén temporal de códigos QR activos (en producción usar Redis)
const activeQRCodes = new Map();

// Generar código QR único para una sesión o evento
exports.generateQR = async (req, res) => {
  try {
    const { asistenciaId, eventoId } = req.body;
    const instructorId = req.user.id;

    if (eventoId) {
      const evento = await prisma.evento.findUnique({ where: { id: eventoId } });
      if (!evento || evento.estado !== 'en_curso') {
        return res.status(404).json({ error: 'Evento no encontrado o no activo' });
      }
      const code = crypto.randomBytes(32).toString('hex');
      const timestamp = Date.now();
      activeQRCodes.set(code, { eventoId, instructorId, timestamp, used: false });
      setTimeout(() => activeQRCodes.delete(code), 30000);
      return res.json({ code, expiresIn: 30000 });
    }

    // Verificar que la sesión existe y pertenece al instructor
    const session = await prisma.asistencia.findFirst({
      where: {
        id: asistenciaId,
        instructorId,
        activa: true
      }
    });

    if (!session) {
      return res.status(404).json({ error: 'Sesión no encontrada o no activa' });
    }

    // Generar código único
    const code = crypto.randomBytes(32).toString('hex');
    const timestamp = Date.now();

    // Guardar en memoria (expira en 30 segundos)
    activeQRCodes.set(code, {
      asistenciaId,
      instructorId,
      timestamp,
      used: false
    });

    // Limpiar códigos expirados
    setTimeout(() => {
      activeQRCodes.delete(code);
    }, 30000);

    res.json({ code, expiresIn: 30000 });
  } catch (error) {
    console.error('Error generating QR:', error);
    res.status(500).json({ error: 'Error al generar código QR' });
  }
};

// Validar y registrar asistencia por QR
exports.validateQR = async (req, res) => {
  try {
    const { code } = req.body;
    const aprendizId = req.user.id;

    // Verificar que el usuario es aprendiz
    if (req.user.userType !== 'aprendiz') {
      return res.status(403).json({ error: 'Solo aprendices pueden escanear QR' });
    }

    // Verificar que el código existe y es válido
    const qrData = activeQRCodes.get(code);
    
    if (!qrData) {
      return res.status(400).json({ error: 'Código QR inválido o expirado' });
    }

    if (qrData.used) {
      return res.status(400).json({ error: 'Este código ya fue usado' });
    }

    // Verificar que no haya expirado (30 segundos)
    const now = Date.now();
    if (now - qrData.timestamp > 30000) {
      activeQRCodes.delete(code);
      return res.status(400).json({ error: 'Código QR expirado' });
    }

    // Marcar como usado
    qrData.used = true;

    if (qrData.eventoId) {
      const eventoFichas = await prisma.eventoFicha.findMany({ where: { eventoId: qrData.eventoId } });
      const fichasIds = eventoFichas.map(f => f.fichaId);
      const isEnrolled = await prisma.ficha.findFirst({
        where: { id: { in: fichasIds }, aprendices: { some: { id: aprendizId } } }
      });
      if (!isEnrolled) return res.status(403).json({ error: 'No estás invitado a este evento' });

      const registro = await prisma.eventoRegistro.upsert({
        where: { eventoId_aprendizId: { eventoId: qrData.eventoId, aprendizId } },
        update: { presente: true, metodo: 'qr', timestamp: new Date() },
        create: { eventoId: qrData.eventoId, aprendizId, presente: true, metodo: 'qr' }
      });

      const user = await prisma.user.findUnique({ where: { id: aprendizId } });
      const io = req.app.get('io');
      if (io) {
        io.to(`evento_${qrData.eventoId}`).emit('nuevaAsistenciaEvento', {
          id: registro.id,
          aprendizId,
          presente: true,
          metodo: 'qr',
          timestamp: registro.timestamp,
          aprendiz: { fullName: user.fullName }
        });
      }
      activeQRCodes.delete(code);
      return res.json({ success: true, message: 'Asistencia registrada correctamente', registro });
    }

    // Verificar que el aprendiz pertenece a la ficha de la materia
    const session = await prisma.asistencia.findFirst({
      where: { id: qrData.asistenciaId },
      include: {
        resultado: {
          include: {
            competencia: {
              include: {
                ficha: {
                  include: {
                    aprendices: true
                  }
                }
              }
            }
          }
        }
      }
    });

    if (!session) {
      return res.status(404).json({ error: 'Sesión no encontrada' });
    }

    const isEnrolled = session.resultado.competencia.ficha.aprendices.some(a => a.id === aprendizId);
    if (!isEnrolled) {
      return res.status(403).json({ error: 'No estás inscrito en esta materia' });
    }

    // Verificar si ya está registrado
    const existing = await prisma.registroAsistencia.findFirst({
      where: {
        asistenciaId: qrData.asistenciaId,
        aprendizId
      }
    });

    if (existing) {
      return res.status(400).json({ error: 'Ya registraste tu asistencia' });
    }

    // Obtener hora actual de Colombia
    const colombiaTime = await getCurrentColombiaTime();

    // Registrar asistencia
    const registro = await prisma.registroAsistencia.create({
      data: {
        asistenciaId: qrData.asistenciaId,
        aprendizId,
        presente: true,
        metodo: 'qr',
        timestamp: colombiaTime
      },
      include: {
        aprendiz: {
          select: {
            id: true,
            fullName: true,
            email: true
          }
        }
      }
    });

    // Emitir evento socket
    const io = req.app.get('io');
    if (io) {
      io.to(`session_${qrData.asistenciaId}`).emit('nuevaAsistencia', {
        id: registro.id,
        aprendizId: registro.aprendizId,
        aprendiz: registro.aprendiz,
        presente: registro.presente,
        metodo: 'qr',
        timestamp: registro.timestamp
      });
    }

    // Eliminar el código usado
    activeQRCodes.delete(code);

    res.json({ 
      success: true, 
      message: 'Asistencia registrada correctamente',
      registro 
    });
  } catch (error) {
    console.error('Error validating QR:', error);
    res.status(500).json({ error: 'Error al validar código QR' });
  }
};

// Obtener estado del QR (para polling del instructor)
exports.getQRStatus = async (req, res) => {
  try {
    const { code } = req.params;
    const qrData = activeQRCodes.get(code);

    if (!qrData) {
      return res.json({ valid: false, expired: true });
    }

    const now = Date.now();
    const timeLeft = 30000 - (now - qrData.timestamp);

    if (timeLeft <= 0) {
      activeQRCodes.delete(code);
      return res.json({ valid: false, expired: true });
    }

    res.json({ 
      valid: true, 
      used: qrData.used,
      timeLeft: Math.floor(timeLeft / 1000)
    });
  } catch (error) {
    console.error('Error getting QR status:', error);
    res.status(500).json({ error: 'Error al obtener estado del QR' });
  }
};
