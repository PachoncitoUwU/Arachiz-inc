// Web Bluetooth BLE Service para Caja Arachiz ESP32
const SERVICE_UUID = '6e400001-b5a3-f393-e0a9-e50e24dcca9e';
const RX_CHARACTERISTIC_UUID = '6e400002-b5a3-f393-e0a9-e50e24dcca9e';
const TX_CHARACTERISTIC_UUID = '6e400003-b5a3-f393-e0a9-e50e24dcca9e';

class BLEService {
  constructor() {
    this.device = null;
    this.server = null;
    this.rxCharacteristic = null;
    this.txCharacteristic = null;
    this.listeners = new Set();
    this.isConnected = false;
  }

  isSupported() {
    return typeof window !== 'undefined' && 'bluetooth' in navigator;
  }

  async connect() {
    if (!this.isSupported()) {
      throw new Error('Tu navegador no soporta Web Bluetooth API. Usa Google Chrome o Edge.');
    }

    try {
      this.device = await navigator.bluetooth.requestDevice({
        filters: [{ namePrefix: 'ARACHIZ' }],
        optionalServices: [SERVICE_UUID]
      });

      this.device.addEventListener('gattserverdisconnected', () => this.handleDisconnect());

      this.server = await this.device.gatt.connect();
      const service = await this.server.getPrimaryService(SERVICE_UUID);

      this.txCharacteristic = await service.getCharacteristic(TX_CHARACTERISTIC_UUID);
      this.rxCharacteristic = await service.getCharacteristic(RX_CHARACTERISTIC_UUID);

      await this.txCharacteristic.startNotifications();
      this.txCharacteristic.addEventListener('characteristicvaluechanged', (e) => this.handleDataReceived(e));

      this.isConnected = true;
      this.notifyListeners({ type: 'STATUS', payload: 'CONNECTED' });
      return true;
    } catch (err) {
      console.error('[BLEService] Error de conexión:', err);
      this.isConnected = false;
      throw err;
    }
  }

  handleDisconnect() {
    console.log('[BLEService] Dispositivo desconectado');
    this.isConnected = false;
    this.device = null;
    this.server = null;
    this.txCharacteristic = null;
    this.rxCharacteristic = null;
    this.notifyListeners({ type: 'STATUS', payload: 'DISCONNECTED' });
  }

  async disconnect() {
    if (this.device && this.device.gatt.connected) {
      this.device.gatt.disconnect();
    }
    this.handleDisconnect();
  }

  async sendCommand(command) {
    if (!this.isConnected || !this.rxCharacteristic) {
      throw new Error('No hay conexión Bluetooth activa con la Caja Arachiz.');
    }
    const encoder = new TextEncoder();
    await this.rxCharacteristic.writeValue(encoder.encode(command + '\n'));
  }

  handleDataReceived(event) {
    const decoder = new TextDecoder('utf-8');
    const rawData = decoder.decode(event.target.value).trim();
    if (!rawData) return;

    console.log('[BLE Received]:', rawData);

    if (rawData.startsWith('READ:')) {
      const content = rawData.substring(5);
      const [type, value] = content.split('|');
      this.notifyListeners({ type, payload: value });
    } else {
      this.notifyListeners({ type: 'RAW', payload: rawData });
    }
  }

  subscribe(callback) {
    this.listeners.add(callback);
    return () => this.listeners.delete(callback);
  }

  notifyListeners(data) {
    this.listeners.forEach((callback) => callback(data));
  }
}

export const bleService = new BLEService();
