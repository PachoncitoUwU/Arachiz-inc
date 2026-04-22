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
        setTimeout(() => {
          generateQR();
        }, 500);
      }
    });
    
    socketRef.current = socket;
    
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
      if (socketRef.current) socketRef.current.disconnect();
    };
  }, [asistenciaId]);

  // Generar URL del QR
  const qrUrl = qrCode ? `${window.location.origin}/scan-qr?code=${qrCode}` : '';

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-white dark:bg-gray-900 rounded-2xl shadow-2xl max-w-md w-full p-6 animate-scale-in">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-[#4285F4] flex items-center justify-center">
              <QrCode size={20} className="text-white" />
            </div>
            <div>
              <h2 className="font-bold text-gray-900 dark:text-white">Registro por QR</h2>
              <p className="text-xs text-gray-400">Escanea para registrar asistencia</p>
            </div>
          </div>
          <button onClick={onClose} className="btn-icon hover:bg-gray-100 dark:hover:bg-gray-800">
            <X size={18} />
          </button>
        </div>

        {loading && !qrCode ? (
          <div className="flex flex-col items-center justify-center py-12">
            <RefreshCw size={32} className="text-[#4285F4] animate-spin mb-3" />
            <p className="text-sm text-gray-500">Generando código QR...</p>
          </div>
        ) : (
          <>
            {/* QR Code Display */}
            <div className="relative bg-white p-6 rounded-2xl border-4 border-[#4285F4] mb-4">
              <div className="flex items-center justify-center">
                {qrCode && (
                  <img 
                    src={`https://api.qrserver.com/v1/create-qr-code/?size=250x250&data=${encodeURIComponent(qrUrl)}`}
                    alt="QR Code"
                    className={`w-64 h-64 transition-opacity ${loading ? 'opacity-50' : 'opacity-100'}`}
                  />
                )}
              </div>
              
              {/* Loading overlay */}
              {loading && (
                <div className="absolute inset-0 flex items-center justify-center bg-white/80 rounded-2xl">
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
