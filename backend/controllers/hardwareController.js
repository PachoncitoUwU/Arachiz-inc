// Recibe eventos del ESP8266 y los emite por Socket.IO
// igual que serialService.handleData() pero via HTTP

// Cola de comandos pendientes para el ESP8266
let commandQueue = [];

// Estado de sesión activa (sincronizado con el backend)
let sessionActive = false;

exports.handleEvent = (req, res) => {
  const { type, payload } = req.body;
  const io = req.app.get('io');

  if (!type || !payload) {
    return res.status(400).json({ error: 'Faltan type o payload' });
  }

  if (type === 'nfc') {
    io.emit('arduino_read_nfc', { uid: payload });
  } else if (type === 'finger') {
    io.emit('arduino_read_finger', { id: parseInt(payload, 10) });
  } else if (type === 'enroll_success') {
    io.emit('arduino_enroll_success', { id: parseInt(payload, 10) });
  } else if (type === 'enroll_error') {
    io.emit('arduino_enroll_error', { message: payload });
  } else if (type === 'debug') {
    io.emit('arduino_debug', { message: payload });
  } else {
    return res.status(400).json({ error: 'Tipo de evento desconocido' });
  }

  res.json({ success: true });
};

let espLastSeen = 0;

// El ESP consulta esta ruta cada 2 segundos para ver si hay comandos
exports.getCommands = (req, res) => {
  espLastSeen = Date.now();
  if (commandQueue.length > 0) {
    const command = commandQueue.shift(); // saca el primero
    res.json({ command });
  } else {
    res.json({ command: null });
  }
};

exports.getStatus = (req, res) => {
  const serialService = req.app.get('serialService');
  const usbConnected = serialService ? serialService.isConnected : false;
  // ESP conectado si hizo ping en los últimos 20 segundos (el ESP hace poll cada ~2s)
  const espConnected = espLastSeen > 0 && (Date.now() - espLastSeen) < 20000;
  
  res.json({ usbConnected, espConnected });
};

// Agregar comando a la cola (llamado desde serialController y asistenciaController via serialService)
exports.queueCommand = (command) => {
  commandQueue.push(command);
  if (command === 'SESSION ON') sessionActive = true;
  if (command === 'SESSION OFF') sessionActive = false;
};

// Estado actual de sesión (para que el ESP pueda consultarlo al reconectar)
exports.getSessionStatus = (req, res) => {
  res.json({ sessionActive });
};

exports.getHardwareStatus = (req, res) => {
  try {
    const serialService = req.app.get('serialService');
    const usbConnected = serialService && typeof serialService.isConnected === 'function' ? serialService.isConnected() : false;
    res.json({ usbConnected, wifiAvailable: true });
  } catch (error) {
    res.json({ usbConnected: false, wifiAvailable: false });
  }
};
