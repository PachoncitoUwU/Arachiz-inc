import React, { useState, useEffect } from 'react';
import { 
  Fingerprint, 
  Wifi, 
  Camera, 
  Smartphone,
  CheckCircle2, 
  XCircle, 
  AlertTriangle,
  RefreshCw,
  Settings
} from 'lucide-react';
import fetchApi from '../services/api';

export default function HardwareStatus({ compact = false, onStatusChange }) {
  const [status, setStatus] = useState({
    serial: { connected: false, ports: [] },
    camera: { available: false, permission: 'unknown' },
    nfc: { supported: false, available: false },
    loading: true
  });

  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => {
    checkHardwareStatus();
  }, []);

  const checkHardwareStatus = async () => {
    setRefreshing(true);
    const newStatus = {
      serial: { connected: false, ports: [] },
      camera: { available: false, permission: 'unknown' },
      nfc: { supported: false, available: false },
      loading: false
    };

    try {
      // Verificar conexión serial
      try {
        const serialRes = await fetchApi('/serial/status');
        newStatus.serial.connected = serialRes.connected || false;
        
        const portsRes = await fetchApi('/serial/ports');
        newStatus.serial.ports = portsRes.ports || [];
      } catch (e) {
        console.log('Serial no disponible');
      }

      // Verificar cámara
      if (navigator.mediaDevices && navigator.mediaDevices.getUserMedia) {
        try {
          const stream = await navigator.mediaDevices.getUserMedia({ video: true });
          newStatus.camera.available = true;
          newStatus.camera.permission = 'granted';
          stream.getTracks().forEach(track => track.stop());
        } catch (e) {
          newStatus.camera.available = false;
          newStatus.camera.permission = e.name === 'NotAllowedError' ? 'denied' : 'prompt';
        }
      }

      // Verificar NFC
      if ('NDEFReader' in window) {
        newStatus.nfc.supported = true;
        // No podemos verificar permisos sin activar el lector
        newStatus.nfc.available = true;
      }

    } catch (error) {
      console.error('Error verificando hardware:', error);
    }

    setStatus(newStatus);
    setRefreshing(false);
    
    if (onStatusChange) {
      onStatusChange(newStatus);
    }
  };

  const getStatusIcon = (isAvailable, isConnected = null) => {
    if (isConnected !== null) {
      return isConnected ? (
        <CheckCircle2 size={16} className="text-green-500" />
      ) : (
        <XCircle size={16} className="text-red-500" />
      );
    }
    
    return isAvailable ? (
      <CheckCircle2 size={16} className="text-green-500" />
    ) : (
      <XCircle size={16} className="text-gray-400" />
    );
  };

  const getStatusText = (device) => {
    switch (device) {
      case 'serial':
        return status.serial.connected ? 'Conectado' : 'Desconectado';
      case 'camera':
        if (!status.camera.available) return 'No disponible';
        return status.camera.permission === 'granted' ? 'Disponible' : 'Sin permisos';
      case 'nfc':
        return status.nfc.supported ? 'Soportado' : 'No soportado';
      default:
        return 'Desconocido';
    }
  };

  const devices = [
    {
      id: 'serial',
      name: 'Lector NFC/Huella',
      icon: Fingerprint,
      available: status.serial.connected,
      description: `${status.serial.ports.length} puertos disponibles`
    },
    {
      id: 'camera',
      name: 'Cámara',
      icon: Camera,
      available: status.camera.available && status.camera.permission === 'granted',
      description: status.camera.permission === 'denied' ? 'Permisos denegados' : 'Para reconocimiento facial'
    },
    {
      id: 'nfc',
      name: 'NFC Móvil',
      icon: Wifi,
      available: status.nfc.supported,
      description: 'Web NFC API'
    }
  ];

  if (compact) {
    return (
      <div className="space-y-3">
        <h3 className="font-semibold text-gray-900 dark:text-white text-sm">
          Estado del Hardware
        </h3>
        
        {/* Mobile-optimized hardware status */}
        <div className="grid grid-cols-1 gap-2">
          {devices.map(device => {
            const Icon = device.icon;
            return (
              <div
                key={device.id}
                className={`flex items-center justify-between p-3 rounded-lg border transition-all ${
                  device.available 
                    ? 'bg-green-50 border-green-200 dark:bg-green-900/20 dark:border-green-800'
                    : 'bg-gray-50 border-gray-200 dark:bg-gray-800 dark:border-gray-700'
                }`}
              >
                <div className="flex items-center gap-3">
                  <Icon size={16} className={device.available ? 'text-green-600' : 'text-gray-400'} />
                  <div>
                    <p className="font-medium text-gray-900 dark:text-white text-sm">
                      {device.name}
                    </p>
                    <p className="text-xs text-gray-500 dark:text-gray-400">
                      {device.description}
                    </p>
                  </div>
                </div>
                
                <div className="flex items-center gap-2">
                  {getStatusIcon(device.available)}
                  <span className={`text-xs font-medium ${
                    device.available 
                      ? 'text-green-600 dark:text-green-400' 
                      : 'text-gray-500 dark:text-gray-400'
                  }`}>
                    {getStatusText(device.id)}
                  </span>
                </div>
              </div>
            );
          })}
        </div>
        
        <button
          onClick={checkHardwareStatus}
          disabled={refreshing}
          className="w-full btn-secondary text-sm flex items-center justify-center gap-2"
        >
          <RefreshCw size={14} className={refreshing ? 'animate-spin' : ''} />
          Actualizar Estado
        </button>
      </div>
    );
  }

  return (
    <div className="bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-700 p-4">
      <div className="flex items-center justify-between mb-4">
        <h3 className="font-semibold text-gray-900 dark:text-white flex items-center gap-2">
          <Settings size={18} />
          Estado del Hardware
        </h3>
        <button
          onClick={checkHardwareStatus}
          disabled={refreshing}
          className="btn-icon hover:bg-gray-100 dark:hover:bg-gray-800"
          title="Actualizar estado"
        >
          <RefreshCw size={16} className={refreshing ? 'animate-spin' : ''} />
        </button>
      </div>

      <div className="space-y-3">
        {devices.map(device => {
          const Icon = device.icon;
          return (
            <div key={device.id} className="flex items-center justify-between p-3 rounded-lg bg-gray-50 dark:bg-gray-800">
              <div className="flex items-center gap-3">
                <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${
                  device.available 
                    ? 'bg-green-100 dark:bg-green-900/20' 
                    : 'bg-gray-100 dark:bg-gray-700'
                }`}>
                  <Icon size={16} className={device.available ? 'text-green-600' : 'text-gray-400'} />
                </div>
                <div>
                  <p className="font-medium text-gray-900 dark:text-white text-sm">
                    {device.name}
                  </p>
                  <p className="text-xs text-gray-500 dark:text-gray-400">
                    {device.description}
                  </p>
                </div>
              </div>
              
              <div className="flex items-center gap-2">
                {getStatusIcon(device.available)}
                <span className={`text-xs font-medium ${
                  device.available 
                    ? 'text-green-600 dark:text-green-400' 
                    : 'text-gray-500 dark:text-gray-400'
                }`}>
                  {getStatusText(device.id)}
                </span>
              </div>
            </div>
          );
        })}
      </div>

      {/* Recomendaciones */}
      {!status.serial.connected && !status.camera.available && (
        <div className="mt-4 p-3 bg-yellow-50 dark:bg-yellow-900/20 rounded-lg border border-yellow-200 dark:border-yellow-800">
          <div className="flex items-start gap-2">
            <AlertTriangle size={16} className="text-yellow-500 flex-shrink-0 mt-0.5" />
            <div>
              <p className="text-sm font-medium text-yellow-800 dark:text-yellow-200">
                Hardware limitado
              </p>
              <p className="text-xs text-yellow-700 dark:text-yellow-300 mt-1">
                Para mejor experiencia, conecta un lector NFC/huella o permite acceso a la cámara.
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}