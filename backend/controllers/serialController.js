exports.getPorts = async (req, res) => {
  try {
    const serialService = req.app.get('serialService');
    const ports = await serialService.listPorts();
    res.json({ ports });
  } catch (error) {
    res.status(500).json({ error: 'Error al listar puertos' });
  }
};

exports.connectPort = async (req, res) => {
  const { path } = req.body;
  if (!path) return res.status(400).json({ error: 'Ruta del puerto es requerida' });

  try {
    const serialService = req.app.get('serialService');
    const result = await serialService.connect(path);
    res.json(result);
  } catch (error) {
    res.status(500).json({ error: error.error || 'Error de conexión' });
  }
};

exports.disconnectPort = (req, res) => {
  try {
    const serialService = req.app.get('serialService');
    serialService.disconnect();
    res.json({ success: true, message: 'Desconectado' });
  } catch (error) {
    res.status(500).json({ error: 'Error al desconectar' });
  }
};

exports.startEnrollFinger = async (req, res) => {
  const { id } = req.body;
  if (!id) return res.status(400).json({ error: 'Id de usuario (entero) es requerido' });

  try {
    const serialService = req.app.get('serialService');
    // Envía el comando al Arduino para prepararse para enrolar una huella en la ranura ID
    const sent = serialService.sendCommand(`ENROLL ${id}`);
    if (sent) {
      res.json({ success: true, message: `Petición de enrolamiento enviada al Arduino para el ID ${id}` });
    } else {
      res.status(400).json({ error: 'No hay dispositivo conectado' });
    }
  } catch (error) {
     res.status(500).json({ error: 'Error al procesar petición' });
  }
};

const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

exports.bindHardware = async (req, res) => {
  const { userId, nfcUid, huellaId } = req.body;
  if (!userId) return res.status(400).json({ error: 'User ID requerido' });

  try {
    const data = {};
    if (nfcUid) data.nfcUid = nfcUid;
    if (huellaId !== undefined) data.huellaId = parseInt(huellaId, 10);

    const user = await prisma.user.update({
      where: { id: userId },
      data
    });
    res.json({ success: true, user });
  } catch (error) {
    if (error.code === 'P2002') {
      res.status(400).json({ error: 'El ID de hardware ya está asignado a otro usuario.' });
    } else {
      res.status(500).json({ error: 'Error al actualizar usuario' });
    }
  }
};
