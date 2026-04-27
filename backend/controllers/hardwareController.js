// Recibe eventos del ESP8266 y los emite por Socket.IO
// igual que serialService.handleData() pero via HTTP

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
