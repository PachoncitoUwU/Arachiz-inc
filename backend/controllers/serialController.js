exports.getPorts = async (req, res) => {
  try {
    const serialService = req.app.get('serialService');
    const ports = await serialService.listPorts();
    res.json({ ports });
  } catch (error) {
    res.status(500).json({ error: 'Error al listar puertos' });
  }
};

exports.getStatus = async (req, res) => {
  try {
    const serialService = req.app.get('serialService');
    if (serialService && !serialService.isConnected) {
      await serialService.autoConnect();
    }
    res.json({ connected: serialService ? serialService.isConnected : false });
  } catch (error) {
    res.status(500).json({ error: 'Error al obtener estado' });
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
  const { id, mode } = req.body; // mode puede ser 'usb' o 'wifi'
  if (!id) return res.status(400).json({ error: 'Id de usuario (entero) es requerido' });

  try {
    if (mode === 'wifi') {
      // Agregar comando a la cola para que el ESP lo consulte
      const hardwareController = require('./hardwareController');
      hardwareController.queueCommand(`ENROLL ${id}`);
      res.json({ success: true, message: `Comando de enrolamiento enviado a la cola WiFi para ID ${id}` });
    } else {
      // Modo USB tradicional
      const serialService = req.app.get('serialService');
      const sent = serialService.sendCommand(`ENROLL ${id}`);
      if (sent) {
        res.json({ success: true, message: `Petición de enrolamiento enviada al Arduino para el ID ${id}` });
      } else {
        res.status(400).json({ error: 'No hay dispositivo conectado' });
      }
    }
  } catch (error) {
     res.status(500).json({ error: 'Error al procesar petición' });
  }
};

exports.clearFingerprints = async (req, res) => {
  try {
    const serialService = req.app.get('serialService');
    const sent = serialService.sendCommand('CLEAR_DB');
    if (sent) {
      res.json({ success: true, message: 'Base de datos del sensor borrada correctamente' });
    } else {
      res.status(400).json({ error: 'No hay dispositivo conectado' });
    }
  } catch (error) {
    res.status(500).json({ error: 'Error al procesar petición' });
  }
};

const prisma = require('../lib/prisma');

exports.bindHardware = async (req, res) => {
  const { userId, nfcUid, huellaId } = req.body;
  if (!userId) return res.status(400).json({ error: 'User ID requerido' });

  try {
    const data = {};
    if (nfcUid) {
      const existingUser = await prisma.user.findFirst({
        where: { nfcUid, id: { not: userId } }
      });
      if (existingUser) {
        return res.status(400).json({ error: 'Este chip NFC ya está registrado con otro usuario.' });
      }
      data.nfcUid = nfcUid;
    }

    let user;
    if (huellaId !== undefined) {
      const pId = parseInt(huellaId, 10);
      user = await prisma.user.update({
        where: { id: userId },
        data: {
          ...data,
          huellas: { push: pId }
        }
      });
    } else {
      user = await prisma.user.update({
        where: { id: userId },
        data
      });
    }

    res.json({ success: true, user });
  } catch (error) {
    if (error.code === 'P2002') {
      res.status(400).json({ error: 'El ID de hardware ya está asignado a otro usuario.' });
    } else {
      res.status(500).json({ error: 'Error al actualizar usuario' });
    }
  }
};

exports.deleteFinger = async (req, res) => {
  const { userId, huellaId } = req.body;
  if (!userId || huellaId === undefined) return res.status(400).json({ error: 'userId y huellaId son requeridos' });

  try {
    const user = await prisma.user.findUnique({ where: { id: userId } });
    if (!user) return res.status(404).json({ error: 'Usuario no encontrado' });

    const updatedHuellas = user.huellas.filter(id => id !== parseInt(huellaId, 10));

    await prisma.user.update({
      where: { id: userId },
      data: { huellas: { set: updatedHuellas } }
    });

    const serialService = req.app.get('serialService');
    if (serialService && serialService.isConnected) {
      // Modo USB: enviar directo
      serialService.sendCommand(`DELETE_FINGER ${huellaId}`);
    } else {
      // Modo WiFi: encolar para que el ESP lo recoja
      const hardwareController = require('./hardwareController');
      hardwareController.queueCommand(`DELETE_FINGER ${huellaId}`);
    }

    res.json({ success: true, message: `Huella ${huellaId} eliminada` });
  } catch (error) {
    res.status(500).json({ error: 'Error al eliminar huella' });
  }
};

exports.nextFingerId = async (req, res) => {
  try {
    const usersWithFingers = await prisma.user.findMany({ select: { huellas: true } });
    const usedIds = new Set();
    usersWithFingers.forEach(u => u.huellas.forEach(id => usedIds.add(id)));
    
    let nextId = 1;
    while(usedIds.has(nextId) && nextId <= 127) {
      nextId++;
    }
    
    if (nextId > 127) return res.status(400).json({ error: 'No hay capacidad para más huellas.' });
    res.json({ success: true, nextId });
  } catch (error) {
    res.status(500).json({ error: 'Error al buscar siguiente ID' });
  }
};

exports.simulateEvent = (req, res) => {
  const { type, payload } = req.body;
  const io = req.app.get('io');
  if (!io) return res.status(500).json({ error: 'Socket no inicializado' });

  if (type === 'nfc') {
    io.emit('arduino_read_nfc', { uid: payload }); // simula pasar tarjeta
  } else if (type === 'finger') {
    io.emit('arduino_read_finger', { id: parseInt(payload, 10) }); // simula poner huella
  } else if (type === 'enroll_success') {
    io.emit('arduino_enroll_success', { id: parseInt(payload, 10) }); // simula crear huella
  }

  res.json({ success: true, message: `Simulación enviada exitosamente: ${type}` });
};

exports.testBuzzer = async (req, res) => {
  try {
    const serialService = req.app.get('serialService');
    const hardwareController = require('./hardwareController');
    
    if (serialService && !serialService.isConnected) {
      await serialService.autoConnect();
    }

    if (serialService && serialService.isConnected) {
      serialService.sendCommand('TEST_BUZZER');
    } else {
      hardwareController.queueCommand('TEST_BUZZER');
    }
    res.json({ success: true, message: 'Comando de prueba de audio enviado' });
  } catch (error) {
    res.status(500).json({ error: 'Error enviando prueba de audio' });
  }
};

exports.setTestMode = async (req, res) => {
  const { active } = req.body;
  try {
    const command = active ? 'TEST_MODE_ON' : 'TEST_MODE_OFF';
    const serialService = req.app.get('serialService');
    const hardwareController = require('./hardwareController');

    if (serialService && !serialService.isConnected) {
      await serialService.autoConnect();
    }

    if (serialService && serialService.isConnected) {
      serialService.sendCommand(command);
    } else {
      hardwareController.queueCommand(command);
    }
    res.json({ success: true, message: `Modo test ${active ? 'activado' : 'desactivado'}` });
  } catch (error) {
    res.status(500).json({ error: 'Error cambiando modo de prueba' });
  }
};
