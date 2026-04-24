import React, { useState, useEffect } from 'react';
import { Wifi, CheckCircle2, AlertCircle, X, Smartphone } from 'lucide-react';
import fetchApi from '../services/api';
import { useToast } from '../context/ToastContext';

export default function MobileNFCReader({ asistenciaId, onClose, onRegistered }) {
  const { showToast } = useToast();
  const [nfcSupported, setNfcSupported] = useState(false);
  const [nfcEnabled, setNfcEnabled] = useState(false);
  const [scanning, setScanning] = useState(false);
  const [lastRead, setLastRead] = useState(null);

  useEffect(() => {
    checkNFCSupport();
  }, []);

  const checkNFCSupport = () => {
    if ('NDEFReader' in window) {
      setNfcSupported(true);
      showToast('NFC disponible en este dispositivo', 'success');
    } else {
      setNfcSupported(false);
      showToast('NFC no disponible en este navegador', 'error');
    }
  };

  const startNFCReading = async () => {
    if (!nfcSupported) {
      showToast('NFC no soportado en este dispositivo', 'error');
      return;
    }

    try {
      setScanning(true);
      const ndef = new NDEFReader();
      
      // Solicitar permisos
      await ndef.scan();
      setNfcEnabled(true);
      showToast('Lector NFC activado. Acerca una tarjeta NFC.', 'success');

      // Escuchar lecturas NFC
      ndef.addEventListener('reading', async ({ message, serialNumber }) => {
        console.log('NFC leído:', serialNumber);
        setLastRead(serialNumber);
        
        try {
          // Enviar al backend para registrar asistencia
          const response = await fetchApi('/asistencias/hardware-register', {
            method: 'POST',
            body: JSON.stringify({ 
              asistenciaId, 
              nfcUid: serialNumber 
            })
          });

          if (response.success) {
            showToast(`✓ Asistencia registrada: ${response.aprendiz?.fullName}`, 'success');
            if (onRegistered && response.aprendiz) {
              onRegistered(response.aprendiz);
            }
          }
        } catch (error) {
          showToast(error.message, 'error');
        }
      });

      ndef.addEventListener('readingerror', () => {
        showToast('Error leyendo tarjeta NFC', 'error');
      });

    } catch (error) {
      setScanning(false);
      if (error.name === 'NotAllowedError') {
        showToast('Permisos NFC denegados', 'error');
      } else if (error.name === 'NotSupportedError') {
        showToast('NFC no soportado', 'error');
      } else {
        showToast('Error activando NFC: ' + error.message, 'error');
      }
    }
  };

  const stopNFCReading = () => {
    setScanning(false);
    setNfcEnabled(false);
    showToast('Lector NFC desactivado', 'info');
  };

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-2 sm:p-4">
      <div className="bg-white dark:bg-gray-900 rounded-2xl shadow-2xl max-w-md w-full p-4 sm:p-6 animate-scale-in mx-2">
        {/* Header */}
        <div className="flex items-center justify-between mb-4 sm:mb-6">
          <div className="flex items-center gap-3 flex-1 min-w-0">
            <div className="w-8 h-8 sm:w-10 sm:h-10 rounded-xl bg-green-500 flex items-center justify-center flex-shrink-0">
              <Wifi size={16} className="text-white sm:w-5 sm:h-5" />
            </div>
            <div className="min-w-0">
              <h2 className="font-bold text-gray-900 dark:text-white text-base sm:text-lg truncate">NFC Móvil</h2>
              <p className="text-xs text-gray-400">Lector NFC del navegador</p>
            </div>
          </div>
          <button onClick={onClose} className="btn-icon hover:bg-gray-100 dark:hover:bg-gray-800 w-8 h-8 sm:w-10 sm:h-10 ml-2">
            <X size={16} className="sm:w-[18px] sm:h-[18px]" />
          </button>
        </div>

        {/* Content */}
        <div className="space-y-4">
          {!nfcSupported ? (
            <div className="text-center py-6 sm:py-8">
              <AlertCircle size={40} className="text-red-500 mx-auto mb-4 sm:w-12 sm:h-12" />
              <h3 className="font-semibold text-gray-900 dark:text-white mb-2 text-base sm:text-lg">
                NFC No Disponible
              </h3>
              <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">
                Tu navegador o dispositivo no soporta NFC Web API.
              </p>
              <div className="bg-blue-50 dark:bg-blue-900/20 rounded-lg p-3 sm:p-4 text-left">
                <p className="text-sm text-blue-800 dark:text-blue-200 font-medium mb-2">
                  Alternativas:
                </p>
                <ul className="text-xs text-blue-700 dark:text-blue-300 space-y-1">
                  <li>• Usa Chrome en Android</li>
                  <li>• Conecta un lector NFC USB</li>
                  <li>• Usa el código QR</li>
                </ul>
              </div>
            </div>
          ) : (
            <div className="text-center">
              {!nfcEnabled ? (
                <>
                  <Smartphone size={48} className="text-green-500 mx-auto mb-4 sm:w-16 sm:h-16" />
                  <h3 className="font-semibold text-gray-900 dark:text-white mb-2 text-base sm:text-lg">
                    Activar Lector NFC
                  </h3>
                  <p className="text-sm text-gray-600 dark:text-gray-400 mb-4 sm:mb-6">
                    Habilita el lector NFC para detectar tarjetas automáticamente.
                  </p>
                  <button
                    onClick={startNFCReading}
                    disabled={scanning}
                    className="btn-primary w-full flex items-center justify-center gap-2 py-3"
                  >
                    <Wifi size={16} />
                    {scanning ? 'Activando...' : 'Activar NFC'}
                  </button>
                </>
              ) : (
                <>
                  <div className="relative mb-4 sm:mb-6">
                    <div className="w-20 h-20 sm:w-24 sm:h-24 bg-green-100 dark:bg-green-900/20 rounded-full flex items-center justify-center mx-auto">
                      <Wifi size={32} className="text-green-500 sm:w-10 sm:h-10" />
                    </div>
                    <div className="absolute inset-0 rounded-full border-4 border-green-500 animate-ping opacity-30"></div>
                  </div>
                  
                  <h3 className="font-semibold text-gray-900 dark:text-white mb-2 text-base sm:text-lg">
                    Lector NFC Activo
                  </h3>
                  <p className="text-sm text-gray-600 dark:text-gray-400 mb-4 sm:mb-6">
                    Acerca una tarjeta NFC al dispositivo para registrar asistencia.
                  </p>

                  {lastRead && (
                    <div className="bg-green-50 dark:bg-green-900/20 rounded-lg p-3 mb-4">
                      <div className="flex items-center gap-2 justify-center">
                        <CheckCircle2 size={16} className="text-green-500" />
                        <span className="text-sm text-green-700 dark:text-green-300 font-medium">
                          Última lectura: {lastRead}
                        </span>
                      </div>
                    </div>
                  )}

                  <button
                    onClick={stopNFCReading}
                    className="btn-secondary w-full py-3"
                  >
                    Desactivar NFC
                  </button>
                </>
              )}
            </div>
          )}
        </div>

        {/* Instructions */}
        <div className="mt-4 sm:mt-6 bg-gray-50 dark:bg-gray-800 rounded-lg p-3 sm:p-4">
          <h4 className="font-medium text-gray-900 dark:text-white mb-2 text-sm">
            Instrucciones:
          </h4>
          <ol className="text-xs text-gray-600 dark:text-gray-400 space-y-1 list-decimal list-inside">
            <li>Asegúrate de que NFC esté habilitado en tu dispositivo</li>
            <li>Haz clic en "Activar NFC" y permite los permisos</li>
            <li>Acerca la tarjeta NFC al dispositivo</li>
            <li>La asistencia se registrará automáticamente</li>
          </ol>
        </div>
      </div>
    </div>
  );
}