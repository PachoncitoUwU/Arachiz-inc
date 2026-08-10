const prisma = require('../lib/prisma');
const crypto = require('crypto');
const { getCurrentColombiaTime } = require('../utils/timeService');

// Tiempo de vida del QR en milisegundos (5 minutos para compensar latencia de Render)
const QR_TTL_MS = 5 * 60 * 1000;

// Fallback en memoria para cuando la DB no tenga tabla QR aún
const activeQRCodes = new Map();

// ── Helpers de persistencia ───────────────────────────────────────────────────
// Intenta guardar en DB; si falla (tabla no existe) usa el Map en memoria
async function saveQR(code, data) {
  try {
    await prisma.qrCode.create({
      data: {
        code,
        payload: JSON.stringify(data),
        expiresAt: new Date(Date.now() + QR_TTL_MS),
        used: false
      }
    });
  } catch {
    // Tabla no existe todavía → usar memoria
    activeQRCodes.set(code, { ...data, timestamp: Date.now() });
    setTimeout(() => activeQRCodes.delete(code), QR_TTL_MS);
  }
}

// Reclamo atómico del código QR: Garantiza que solo UN aprendiz puede usar el QR (Anti Race-Condition)
async function claimQR(code) {
  if (!code) return null;
  try {
    const row = await prisma.qrCode.findUnique({ where: { code } });
    if (!row || row.used || row.expiresAt < new Date()) {
      return null;
    }

    // Actualización atómica en la base de datos: solo una consulta cambiará used de false a true
    const updated = await prisma.qrCode.updateMany({
      where: {
        code,
        used: false,
        expiresAt: { gt: new Date() }
      },
      data: { used: true }
    });

    if (updated.count === 0) {
      // El QR ya fue reclamado por otro aprendiz en el mismo milisegundo
      return null;
    }

    return JSON.parse(row.payload);
  } catch {
    // Fallback memoria si la tabla no existe aún
    const data = activeQRCodes.get(code);
    if (!data || data.used) return null;
    if (Date.now() - data.timestamp > QR_TTL_MS) {
      activeQRCodes.delete(code);
      return null;
    }
    // Marcar de inmediato como usado
    data.used = true;
    activeQRCodes.set(code, data);
    return data;
  }
}

async function markUsed(code) {
  try {
    await prisma.qrCode.update({ where: { code }, data: { used: true } });
  } catch {
    activeQRCodes.delete(code);
  }
}

async function deleteQR(code) {
  try {
    await prisma.qrCode.delete({ where: { code } });
  } catch {
    activeQRCodes.delete(code);
  }
}

// ── Generar código QR ─────────────────────────────────────────────────────────
exports.generateQR = async (req, res) => {
  try {
    const { asistenciaId, eventoId } = req.body;
    const instructorId = req.user.id;

    if (eventoId) {
      const evento = await prisma.evento.findUnique({ where: { id: eventoId } });
      if (!evento || evento.estado !== 'en_curso') {
        return res.status(404).json({ error: 'Evento no encontrado o no activo' });
      }
      const code = crypto.randomBytes(16).toString('hex');
      await saveQR(code, { eventoId, instructorId });
      return res.json({ code, expiresIn: QR_TTL_MS });
    }

    // Verificar que la sesión existe y pertenece al instructor
    const session = await prisma.asistencia.findFirst({
      where: { id: asistenciaId, instructorId, activa: true }
    });

    if (!session) {
      return res.status(404).json({ error: 'Sesión no encontrada o no activa' });
    }

    const code = crypto.randomBytes(16).toString('hex');
    await saveQR(code, { asistenciaId, instructorId });

    res.json({ code, expiresIn: QR_TTL_MS });
  } catch (error) {
    console.error('Error generating QR:', error);
    res.status(500).json({ error: 'Error al generar código QR' });
  }
};

// ── Validar y registrar asistencia por QR ─────────────────────────────────────
exports.validateQR = async (req, res) => {
  try {
    const { code } = req.body;
    const aprendizId = req.user.id;

    if (req.user.userType !== 'aprendiz') {
      return res.status(403).json({ error: 'Solo aprendices pueden escanear QR' });
    }

    // Reclamo atómico: solo el primer aprendiz que escanee obtendrá el objeto; los demás recibirán null
    const qrData = await claimQR(code);

    if (!qrData) {
      return res.status(400).json({ error: 'Este código QR ya fue escaneado por otro estudiante o ha expirado.' });
    }

    // ── Flujo evento ─────────────────────────────────────────────────────────
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
      await deleteQR(code);
      return res.json({ success: true, message: 'Asistencia registrada correctamente', registro });
    }

    // ── Flujo sesión normal ───────────────────────────────────────────────────
    const session = await prisma.asistencia.findFirst({
      where: { id: qrData.asistenciaId },
      include: {
        resultado: {
          include: {
            competencia: {
              include: {
                ficha: { include: { aprendices: true } }
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

    const existing = await prisma.registroAsistencia.findFirst({
      where: { asistenciaId: qrData.asistenciaId, aprendizId }
    });

    if (existing) {
      return res.status(400).json({ error: 'Ya registraste tu asistencia' });
    }

    const colombiaTime = await getCurrentColombiaTime();

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
          select: { id: true, fullName: true, email: true }
        }
      }
    });

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

    await deleteQR(code);

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

// ── Estado del QR ─────────────────────────────────────────────────────────────
exports.getQRStatus = async (req, res) => {
  try {
    const { code } = req.params;

    // Intentar DB primero
    let timeLeft = 0;
    let used = false;
    let valid = false;

    try {
      const row = await prisma.qrCode.findUnique({ where: { code } });
      if (row && !row.used && row.expiresAt > new Date()) {
        timeLeft = Math.floor((row.expiresAt.getTime() - Date.now()) / 1000);
        used = row.used;
        valid = true;
      }
    } catch {
      // Fallback memoria
      const data = activeQRCodes.get(code);
      if (data) {
        const elapsed = Date.now() - data.timestamp;
        if (elapsed < QR_TTL_MS) {
          timeLeft = Math.floor((QR_TTL_MS - elapsed) / 1000);
          valid = true;
        }
      }
    }

    if (!valid) {
      return res.json({ valid: false, expired: true });
    }

    res.json({ valid: true, used, timeLeft });
  } catch (error) {
    console.error('Error getting QR status:', error);
    res.status(500).json({ error: 'Error al obtener estado del QR' });
  }
};
