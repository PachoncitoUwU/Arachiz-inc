const { SerialPort } = require('serialport');
const { ReadlineParser } = require('@serialport/parser-readline');
const prisma = require('../lib/prisma');

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

  // Intenta autoconectarse al puerto donde esté el Arduino
  async autoConnect() {
    if (this.isConnected) return true;
    try {
      const ports = await this.listPorts();
      if (!ports || ports.length === 0) return false;

      // Buscar puertos que coincidan con Arduino, CH340, FTDI o cualquier COM activo
      const candidate = ports.find(p => {
        const m = (p.manufacturer || '').toLowerCase();
        const f = (p.friendlyName || '').toLowerCase();
        const pnp = (p.pnpId || '').toLowerCase();
        return m.includes('arduino') || m.includes('ch340') || m.includes('ftdi') ||
               f.includes('arduino') || f.includes('ch340') || pnp.includes('usb');
      }) || ports[0]; // Si hay algún puerto COM disponible, tomar el primero

      if (candidate && candidate.path) {
        console.log(`[SerialService] Autoconectando a puerto: ${candidate.path}`);
        await this.connect(candidate.path);
        return true;
      }
    } catch (err) {
      console.log('[SerialService] Error en autoconexión:', err.message);
    }
    return false;
  }

  // Conectar a un puerto específico
  async connect(path, baudRate = 9600) {
    if (this.port) {
      try {
        this.port.close();
      } catch (e) {}
      this.port = null;
      this.isConnected = false;
    }

    return new Promise((resolve, reject) => {
      try {
        this.port = new SerialPort({ path, baudRate });
        this.parser = this.port.pipe(new ReadlineParser({ delimiter: '\r\n' }));

        this.port.on('open', () => {
          console.log(`Puerto serie abierto exitosamente en ${path}`);
          this.isConnected = true;
          this.io.emit('serial_status', { status: 'connected', path });
          
          // Esperar 2 segundos a que termine de iniciar el Arduino tras el reset
          setTimeout(async () => {
            try {
              const activeSession = await prisma.asistencia.findFirst({
                where: { activa: true }
              });
              if (activeSession) {
                console.log('[SerialService] Detectada sesión activa en BD. Sincronizando Arduino: SESSION ON');
                this.sendCommand('SESSION ON');
              } else {
                console.log('[SerialService] Sincronizando Arduino: SESSION OFF');
                this.sendCommand('SESSION OFF');
              }
            } catch (err) {
              console.error('[SerialService] Error al sincronizar sesión activa:', err.message);
            }
          }, 2000);

          resolve({ success: true, message: `Conectado a ${path}` });
        });

        this.port.on('error', (err) => {
          console.error(`[SerialPort Error] ${path}:`, err.message);
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
      const raw = data.split('READ_FINGER:')[1].trim();
      const id = raw === 'TEST_OK' ? 9999 : (parseInt(raw, 10) || 0);
      this.io.emit('arduino_read_finger', { id });
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
