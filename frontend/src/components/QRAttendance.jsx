import React, { useState, useEffect, useRef } from 'react';
import { QrCode, X, RefreshCw, Clock } from 'lucide-react';
import { io } from 'socket.io-client';
import fetchApi from '../services/api';
import { useToast } from '../context/ToastContext';

const API_BASE = import.meta.env.VITE_SOCKET_URL || 'http://localhost:3000';

export default function QRAttendance({ asistenciaId, onClose }) {
  const { showToast } = useToast();
  const [qrCode, setQrCode] = useState(null);
  const [loading, setLoading] = useState(false);
  const [timeLeft, setTimeLeft] = useState(30);
  const timerRef = useRef(null);
  const socketRef = useRef(null);

  const generateQR = async () => {
    setLoading(true);
    try {
      const data = await fetchApi('/qr/generate', {
        method: 'POST',
        body: JSON.stringify({ asistenciaId })
      });
      
      setQrCode(data.code);
      setTimeLeft(30);
      
      // Iniciar countdown
      if (timerRef.current) clearInterval(timerRef.current);
      timerRef.current = setInterval(() => {
        setTimeLeft(prev => {
          if (prev <= 1) {
            clearInterval(timerRef.current);
            generateQR(); // Auto-regenerar
            return 30;
          }
          return prev - 1;
        });
      }, 1000);

    } catch (error) {
      showToast(error.message, 'error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    generateQR();
    
    // Conectar socket para escuchar cuando alguien escanea
    const socket = io(API_BASE);
    socket.emit('joinSession', asistenciaId);
    
    socket.on('nuevaAsistencia', (data) => {
      if (data.metodo === 'qr') {
        console.log('[QR] Código escaneado, regenerando...');
        showToast(`✓ ${data.aprendiz?.fullName} escaneó el QR`, 'success');
        // Regenerar inmediatamente
        generateQR();
      }
    });
    
    socketRef.current = socket;
    
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
      if (socketRef.current) socketRef.current.disconnect();
    };
  }, [asistenciaId]);

  // Generar URL del QR (apuntando a Vercel en producción o si se prueba localmente para celulares externos)
  const getAppOrigin = () => {
    if (typeof window === 'undefined') return 'https://arachiz.vercel.app';
    const host = window.location.hostname;
    if (host === 'localhost' || host === '127.0.0.1' || host.startsWith('192.168.')) {
      return import.meta.env.VITE_PUBLIC_APP_URL || 'https://arachiz.vercel.app';
    }
    return window.location.origin;
  };
  const qrUrl = qrCode ? `${getAppOrigin()}/scan-qr?code=${qrCode}` : '';

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-[9999] p-3 sm:p-4">
      <div className="bg-white dark:bg-zinc-800 rounded-2xl shadow-2xl max-w-xs sm:max-w-sm w-full max-h-[90vh] overflow-y-auto p-4 sm:p-5 animate-scale-in">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2.5">
            <div className="w-10 h-10 rounded-xl bg-[#4285F4] flex items-center justify-center">
              <QrCode size={20} className="text-white" />
            </div>
            <div>
              <h2 className="font-bold text-gray-900 dark:text-white text-sm sm:text-base">Registro por QR</h2>
              <p className="text-[11px] text-gray-400">1 uso por estudiante · Auto-rotación</p>
            </div>
          </div>
          <button onClick={onClose} className="btn-icon hover:bg-gray-100 dark:hover:bg-gray-800">
            <X size={18} />
          </button>
        </div>

        {loading && !qrCode ? (
          <div className="flex flex-col items-center justify-center py-8">
            <RefreshCw size={28} className="text-[#4285F4] animate-spin mb-2" />
            <p className="text-xs text-gray-500">Generando código QR...</p>
          </div>
        ) : (
          <>
            {/* QR Code Display */}
            <div className="relative bg-white dark:bg-zinc-800 p-3 rounded-2xl border-3 border-[#4285F4] mb-3 flex flex-col items-center justify-center">
              <div className="flex items-center justify-center">
                {qrCode && (
                  <img 
                    src={`https://api.qrserver.com/v1/create-qr-code/?size=350x350&ecc=M&margin=1&data=${encodeURIComponent(qrUrl)}`}
                    alt="QR Code"
                    className={`w-48 h-48 sm:w-56 sm:h-56 object-contain rounded-lg bg-white p-2 shadow-inner transition-opacity ${loading ? 'opacity-50' : 'opacity-100'}`}
                  />
                )}
              </div>
              
              {/* Loading overlay */}
              {loading && (
                <div className="absolute inset-0 flex items-center justify-center bg-white dark:bg-zinc-800 /80 rounded-2xl">
                  <RefreshCw size={32} className="text-[#4285F4] animate-spin" />
                </div>
              )}
              
              {/* Timer overlay */}
              <div className="absolute top-3 right-3 bg-[#4285F4] text-white px-3 py-1.5 rounded-lg flex items-center gap-2 shadow-lg">
                <Clock size={14} />
                <span className="font-mono font-bold text-sm">{timeLeft}s</span>
              </div>
            </div>

            {/* Instructions */}
            <div className="bg-blue-50 dark:bg-blue-900/20 rounded-xl p-4 mb-4">
              <p className="text-sm text-gray-700 dark:text-gray-300 font-medium mb-2">
                📱 Instrucciones:
              </p>
              <ol className="text-xs text-gray-600 dark:text-gray-400 space-y-1 list-decimal list-inside">
                <li>Abre Arachiz en tu celular</li>
                <li>Ve a Asistencia y toca "Escanear QR"</li>
                <li>Apunta la cámara al código</li>
                <li>Tu asistencia se registrará automáticamente</li>
              </ol>
            </div>

            {/* Regenerate button */}
            <button 
              onClick={generateQR}
              disabled={loading}
              className="w-full btn-primary flex items-center justify-center gap-2"
            >
              <RefreshCw size={16} className={loading ? 'animate-spin' : ''} />
              Generar nuevo código
            </button>

            <p className="text-xs text-center text-gray-400 mt-3">
              El código se regenera automáticamente cada 30 segundos o al ser escaneado
            </p>
          </>
        )}
      </div>
    </div>
  );
}
