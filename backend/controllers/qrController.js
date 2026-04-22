const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();
const crypto = require('crypto');

// Almacén temporal de códigos QR activos (en producción usar Redis)
const activeQRCodes = new Map();

// Generar código QR único para una sesión
exports.generateQR = async (req, res) => {
  try {
    const { asistenciaId } = req.body;
    const instructorId = req.user.id;

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

    // Verificar que el aprendiz pertenece a la ficha de la materia
    const session = await prisma.asistencia.findFirst({
      where: { id: qrData.asistenciaId },
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
      return res.status(404).json({ error: 'Sesión no encontrada' });
    }

    const isEnrolled = session.materia.ficha.aprendices.some(a => a.id === aprendizId);
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

    // Registrar asistencia
    const registro = await prisma.registroAsistencia.create({
      data: {
        asistenciaId: qrData.asistenciaId,
        aprendizId,
        presente: true,
        metodo: 'qr',
        timestamp: new Date()
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
        ...registro,
        metodo: 'qr'
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
