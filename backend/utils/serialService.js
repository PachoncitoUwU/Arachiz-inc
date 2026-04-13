const { SerialPort } = require('serialport');
const { ReadlineParser } = require('@serialport/parser-readline');

class SerialService {
  constructor(io) {
    this.io = io;
    this.port = null;
    this.parser = null;
    this.isConnected = false;
  }

  // Lista todos los puertos disponibles
  async listPorts() {
    try {
      const ports = await SerialPort.list();
      return ports;
    } catch (error) {
      console.error('Error al listar puertos serie:', error);
      return [];
    }
  }

  // Conectar a un puerto específico
  async connect(path, baudRate = 9600) {
    if (this.isConnected) {
      this.disconnect();
    }

    return new Promise((resolve, reject) => {
      try {
        this.port = new SerialPort({ path, baudRate });
        this.parser = this.port.pipe(new ReadlineParser({ delimiter: '\r\n' }));

        this.port.on('open', () => {
          console.log(`Puerto serie abierto en ${path}`);
          this.isConnected = true;
          this.io.emit('serial_status', { status: 'connected', path });
          resolve({ success: true, message: `Conectado a ${path}` });
        });

        this.port.on('error', (err) => {
          console.error('Error en puerto serie:', err.message);
          this.isConnected = false;
          this.io.emit('serial_status', { status: 'error', message: err.message });
          reject({ success: false, error: err.message });
        });

        this.port.on('close', () => {
          console.log('Puerto serie cerrado');
          this.isConnected = false;
          this.io.emit('serial_status', { status: 'disconnected' });
        });

        // Manejar datos entrantes desde el Arduino
        this.parser.on('data', (data) => this.handleData(data));
      } catch (error) {
        reject({ success: false, error: error.message });
      }
    });
  }

  disconnect() {
    if (this.port && this.isConnected) {
      this.port.close();
      this.isConnected = false;
    }
  }

  // Enviar comando al Arduino
  sendCommand(command) {
    if (this.port && this.isConnected) {
      this.port.write(`${command}\n`, (err) => {
        if (err) {
          console.error('Error al enviar comando al Arduino:', err.message);
        } else {
          console.log(`Comando enviado al Arduino: ${command}`);
        }
      });
      return true;
    }
    return false;
  }

  // Procesar lo que escupe el Arduino
  handleData(data) {
    console.log('Arduino dice:', data);
    // El Arduino enviará cadenas como:
    // "READ_NFC: AC BE 12 34"
    // "READ_FINGER: 5"
    // "ENROLL_SUCCESS: 6"
    // "ENROLL_ERROR: Ya existe"

    if (data.startsWith('READ_NFC:')) {
      const uid = data.split('READ_NFC:')[1].trim();
      this.io.emit('arduino_read_nfc', { uid });
    } 
    else if (data.startsWith('READ_FINGER:')) {
      const id = data.split('READ_FINGER:')[1].trim();
      this.io.emit('arduino_read_finger', { id: parseInt(id, 10) });
    }
    else if (data.startsWith('ENROLL_SUCCESS:')) {
      const id = data.split('ENROLL_SUCCESS:')[1].trim();
      this.io.emit('arduino_enroll_success', { id: parseInt(id, 10) });
    }
    else if (data.startsWith('ENROLL_ERROR:')) {
      const errorMsg = data.split('ENROLL_ERROR:')[1].trim();
      this.io.emit('arduino_enroll_error', { message: errorMsg });
    }
    else if (data.startsWith('DEBUG:')) {
      // Para mensajes informativos en la interfaz de React
       const msg = data.split('DEBUG:')[1].trim();
       this.io.emit('arduino_debug', { message: msg });
    }
  }
}

module.exports = SerialService;
