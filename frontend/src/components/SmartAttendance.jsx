import React, { useState, useEffect, useRef } from 'react';
import { 
  Smartphone, 
  Camera, 
  Fingerprint, 
  Wifi, 
  UserCheck, 
  CheckCircle2, 
  AlertTriangle,
  Loader2,
  X,
  RefreshCw,
  Settings
} from 'lucide-react';
import FacialScanner from './FacialScanner';
import QRAttendance from './QRAttendance';
import ImprovedManualAttendance from './ImprovedManualAttendance';
import SerialConnect from './SerialConnect';
import MobileNFCReader from './MobileNFCReader';
import HardwareStatus from './HardwareStatus';
import fetchApi from '../services/api';
import { useToast } from '../context/ToastContext';

/**
 * Sistema inteligente de asistencia que detecta automáticamente
 * el hardware disponible y ofrece las mejores opciones
 */
export default function SmartAttendance({ 
  asistenciaId, 
  aprendices = [], 
  alreadyRegistered = new Set(), 
  onRegistered, 
  onClose 
}) {
  const { showToast } = useToast();
  const [capabilities, setCapabilities] = useState({
    camera: false,
    nfc: false,
    serial: false,
    fingerprint: false,
    loading: true
  });
  
  const [activeMethod, setActiveMethod] = useState(null);
  const [showSettings, setShowSettings] = useState(false);
  const [serialStatus, setSerialStatus] = useState('disconnected');
  const detectionRef = useRef(false);

  // Detectar capacidades del dispositivo
  useEffect(() => {
    if (detectionRef.current) return;
    detectionRef.current = true;
    detectCapabilities();
  }, []);

  const detectCapabilities = async () => {
    const caps = {
      camera: false,
      nfc: false,
      serial: false,
      fingerprint: false,
      loading: false
    };

    try {
      // Detectar cámara
      if (navigator.mediaDevices && navigator.mediaDevices.getUserMedia) {
        try {
          const stream = await navigator.mediaDevices.getUserMedia({ video: true });
          caps.camera = true;
          stream.getTracks().forEach(track => track.stop());
        } catch (e) {
          console.log('Cámara no disponible:', e.message);
        }
      }

      // Detectar NFC (solo en dispositivos móviles modernos)
      if ('NDEFReader' in window) {
        caps.nfc = true;
      }

      // Verificar conexión serial (Arduino/sensores)
      try {
        const serialRes = await fetchApi('/serial/status');
        caps.serial = serialRes.connected || false;
        caps.fingerprint = serialRes.connected || false; // Si hay serial, asumimos que puede tener huella
        setSerialStatus(serialRes.connected ? 'connected' : 'disconnected');
      } catch (e) {
        console.log('Serial no disponible');
      }

    } catch (error) {
      console.error('Error detectando capacidades:', error);
    }

    setCapabilities(caps);
    
    // Auto-seleccionar el mejor método disponible
    autoSelectBestMethod(caps);
  };

  const autoSelectBestMethod = (caps) => {
    // Prioridad: Serial (NFC/Huella) > Facial > QR > Manual
    if (caps.serial || caps.fingerprint) {
      // Si hay hardware conectado, no auto-abrir nada, esperar a que el usuario acerque el dispositivo
      return;
    } else if (caps.camera && hasRegisteredFaces()) {
      setActiveMethod('facial');
    } else if (caps.nfc || caps.camera) {
      setActiveMethod('qr');
    } else {
      setActiveMethod('manual');
    }
  };

  const hasRegisteredFaces = () => {
    return aprendices.some(a => a.faceDescriptor?.length === 128);
  };

  const getAvailableMethods = () => {
    const methods = [];

    // Hardware NFC/Huella (máxima prioridad)
    if (capabilities.serial) {
      methods.push({
        id: 'hardware',
        name: 'Lector Hardware',
        description: 'NFC y huella dactilar',
        icon: Fingerprint,
        color: 'bg-purple-500',
        priority: 1,
        auto: true
      });
    }

    // Reconocimiento facial
    if (capabilities.camera && hasRegisteredFaces()) {
      methods.push({
        id: 'facial',
        name: 'Reconocimiento Facial',
        description: 'Detección automática por cámara',
        icon: Camera,
        color: 'bg-blue-500',
        priority: 2,
        auto: true
      });
    }

    // QR Code (móvil o cámara)
    if (capabilities.camera || capabilities.nfc) {
      methods.push({
        id: 'qr',
        name: 'Código QR',
        description: 'Escaneo con celular',
        icon: Smartphone,
        color: 'bg-yellow-500',
        priority: 3,
        auto: false
      });
    }

    // NFC móvil (si está disponible)
    if (capabilities.nfc) {
      methods.push({
        id: 'nfc-mobile',
        name: 'NFC Móvil',
        description: 'Acerca tu celular con NFC',
        icon: Wifi,
        color: 'bg-green-500',
        priority: 2,
        auto: true
      });
    }

    // Registro manual (siempre disponible)
    methods.push({
      id: 'manual',
      name: 'Registro Manual',
      description: 'Selección por lista',
      icon: UserCheck,
      color: 'bg-gray-500',
      priority: 5,
      auto: false
    });

    return methods.sort((a, b) => a.priority - b.priority);
  };

  const handleMethodSelect = (methodId) => {
    setActiveMethod(methodId);
  };

  const renderMethodCard = (method) => {
    const Icon = method.icon;
    const isActive = activeMethod === method.id;
    const isRecommended = method.priority <= 2;

    return (
      <button
        key={method.id}
        onClick={() => handleMethodSelect(method.id)}
        className={`relative p-4 rounded-xl border-2 transition-all text-left group ${
          isActive 
            ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20' 
            : 'border-gray-200 dark:border-gray-700 hover:border-gray-300 dark:hover:border-gray-600'
        }`}
      >
        {isRecommended && (
          <div className="absolute -top-2 -right-2 bg-green-500 text-white text-xs px-2 py-1 rounded-full font-semibold">
            Recomendado
          </div>
        )}
        
        <div className="flex items-start gap-3">
          <div className={`w-12 h-12 rounded-xl ${method.color} flex items-center justify-center flex-shrink-0`}>
            <Icon size={24} className="text-white" />
          </div>
          
          <div className="flex-1 min-w-0">
            <h3 className="font-semibold text-gray-900 dark:text-white group-hover:text-blue-600 dark:group-hover:text-blue-400">
              {method.name}
            </h3>
            <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
              {method.description}
            </p>
            
            {method.auto && (
              <div className="flex items-center gap-1 mt-2">
                <CheckCircle2 size={14} className="text-green-500" />
                <span className="text-xs text-green-600 dark:text-green-400 font-medium">
                  Detección automática
                </span>
              </div>
            )}
          </div>
        </div>
      </button>
    );
  };

  const renderActiveMethod = () => {
    switch (activeMethod) {
      case 'facial':
        return (
          <div className="mt-6">
            <FacialScanner
              asistenciaId={asistenciaId}
              aprendices={aprendices}
              alreadyRegistered={alreadyRegistered}
              onRegistered={onRegistered}
              onClose={() => setActiveMethod(null)}
            />
          </div>
        );
      
      case 'qr':
        return (
          <QRAttendance
            asistenciaId={asistenciaId}
            onClose={() => setActiveMethod(null)}
          />
        );
      
      case 'manual':
        return (
          <ImprovedManualAttendance
            asistenciaId={asistenciaId}
            aprendices={aprendices}
            alreadyRegistered={alreadyRegistered}
            onClose={() => setActiveMethod(null)}
            onRegistered={onRegistered}
          />
        );
      
      case 'hardware':
        return (
          <div className="mt-6 p-6 bg-purple-50 dark:bg-purple-900/20 rounded-xl border border-purple-200 dark:border-purple-800">
            <div className="text-center">
              <Fingerprint size={48} className="text-purple-500 mx-auto mb-4" />
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
                Lector Hardware Activo
              </h3>
              <p className="text-gray-600 dark:text-gray-400 mb-4">
                Acerca tu tarjeta NFC o coloca tu dedo en el sensor de huella
              </p>
              <div className="flex items-center justify-center gap-2 text-sm text-purple-600 dark:text-purple-400">
                <div className="w-2 h-2 bg-purple-500 rounded-full animate-pulse"></div>
                Esperando lectura...
              </div>
            </div>
          </div>
        );
      
      case 'nfc-mobile':
        return (
          <MobileNFCReader
            asistenciaId={asistenciaId}
            onClose={() => setActiveMethod(null)}
            onRegistered={onRegistered}
          />
        );
      
      default:
        return null;
    }
  };

  const initNFCReader = async () => {
    if ('NDEFReader' in window) {
      try {
        const ndef = new NDEFReader();
        await ndef.scan();
        showToast('Lector NFC activado. Acerca una tarjeta NFC.', 'success');
        
        ndef.addEventListener('reading', ({ message, serialNumber }) => {
          console.log('NFC detectado:', serialNumber);
          // Aquí enviarías el UID al backend para registrar asistencia
          handleNFCRead(serialNumber);
        });
      } catch (error) {
        showToast('Error activando NFC: ' + error.message, 'error');
      }
    }
  };

  const handleNFCRead = async (uid) => {
    try {
      await fetchApi('/asistencias/hardware-register', {
        method: 'POST',
        body: JSON.stringify({ asistenciaId, nfcUid: uid })
      });
      showToast('Asistencia registrada por NFC', 'success');
    } catch (error) {
      showToast(error.message, 'error');
    }
  };

  if (capabilities.loading) {
    return (
      <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50">
        <div className="bg-white dark:bg-gray-900 rounded-2xl shadow-2xl p-8 max-w-md w-full mx-4">
          <div className="text-center">
            <Loader2 size={48} className="text-blue-500 animate-spin mx-auto mb-4" />
            <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-2">
              Detectando Hardware
            </h2>
            <p className="text-gray-600 dark:text-gray-400">
              Verificando dispositivos disponibles...
            </p>
          </div>
        </div>
      </div>
    );
  }

  const availableMethods = getAvailableMethods();

  return (
    <>
      {!activeMethod ? (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white dark:bg-gray-900 rounded-2xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            {/* Header */}
            <div className="flex items-center justify-between p-6 border-b border-gray-100 dark:border-gray-800">
              <div>
                <h2 className="text-xl font-bold text-gray-900 dark:text-white">
                  Registro de Asistencia
                </h2>
                <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                  Selecciona el método más conveniente
                </p>
              </div>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => setShowSettings(!showSettings)}
                  className="btn-icon hover:bg-gray-100 dark:hover:bg-gray-800"
                  title="Configuración"
                >
                  <Settings size={18} />
                </button>
                <button
                  onClick={detectCapabilities}
                  className="btn-icon hover:bg-gray-100 dark:hover:bg-gray-800"
                  title="Redetectar hardware"
                >
                  <RefreshCw size={18} />
                </button>
                <button
                  onClick={onClose}
                  className="btn-icon hover:bg-gray-100 dark:hover:bg-gray-800"
                >
                  <X size={18} />
                </button>
              </div>
            </div>

            {/* Hardware Status */}
            {showSettings && (
              <div className="p-6 border-b border-gray-100 dark:border-gray-800 bg-gray-50 dark:bg-gray-800/50">
                <HardwareStatus onStatusChange={(newStatus) => {
                  // Actualizar capabilities basado en el estado real del hardware
                  setCapabilities({
                    camera: newStatus.camera.available && newStatus.camera.permission === 'granted',
                    nfc: newStatus.nfc.supported,
                    serial: newStatus.serial.connected,
                    fingerprint: newStatus.serial.connected,
                    loading: false
                  });
                }} />
              </div>
            )}

            {/* Methods Grid */}
            <div className="p-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {availableMethods.map(renderMethodCard)}
              </div>

              {availableMethods.length === 1 && availableMethods[0].id === 'manual' && (
                <div className="mt-6 p-4 bg-yellow-50 dark:bg-yellow-900/20 rounded-xl border border-yellow-200 dark:border-yellow-800">
                  <div className="flex items-start gap-3">
                    <AlertTriangle size={20} className="text-yellow-500 flex-shrink-0 mt-0.5" />
                    <div>
                      <h4 className="font-semibold text-yellow-800 dark:text-yellow-200">
                        Solo registro manual disponible
                      </h4>
                      <p className="text-sm text-yellow-700 dark:text-yellow-300 mt-1">
                        Para habilitar métodos automáticos, conecta hardware (NFC/huella) o 
                        permite el acceso a la cámara para reconocimiento facial.
                      </p>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      ) : (
        renderActiveMethod()
      )}
    </>
  );
}