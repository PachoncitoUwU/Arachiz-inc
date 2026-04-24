import React, { useState, useEffect, useRef } from 'react';
import { QrCode, X, Camera, CheckCircle, AlertCircle } from 'lucide-react';
import jsQR from 'jsqr';
import fetchApi from '../services/api';
import { useToast } from '../context/ToastContext';

export default function QRScanner({ onClose, onSuccess }) {
  const { showToast } = useToast();
  const [scanning, setScanning] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(false);
  const videoRef = useRef(null);
  const canvasRef = useRef(null);
  const streamRef = useRef(null);
  const scanIntervalRef = useRef(null);

  useEffect(() => {
    startCamera();
    return () => {
      stopCamera();
    };
  }, []);

  const startCamera = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ 
        video: { facingMode: 'environment' } // Cámara trasera en móviles
      });
      
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        streamRef.current = stream;
        setScanning(true);
        
        // Iniciar escaneo continuo
        scanIntervalRef.current = setInterval(() => {
          scanQRCode();
        }, 500);
      }
    } catch (err) {
      console.error('Error accessing camera:', err);
      setError('No se pudo acceder a la cámara');
      showToast('Permite el acceso a la cámara', 'error');
    }
  };

  const stopCamera = () => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(track => track.stop());
    }
    if (scanIntervalRef.current) {
      clearInterval(scanIntervalRef.current);
    }
  };

  const scanQRCode = async () => {
    if (!videoRef.current || !canvasRef.current || success) return;

    const video = videoRef.current;
    const canvas = canvasRef.current;
    const context = canvas.getContext('2d');

    if (video.readyState === video.HAVE_ENOUGH_DATA) {
      canvas.width = video.videoWidth;
      canvas.height = video.videoHeight;
      context.drawImage(video, 0, 0, canvas.width, canvas.height);

      const imageData = context.getImageData(0, 0, canvas.width, canvas.height);
      
      // Usar jsQR para detectar QR
      try {
        const code = jsQR(imageData.data, imageData.width, imageData.height);
        
        if (code) {
          // Extraer el código del URL
          const url = new URL(code.data);
          const qrCode = url.searchParams.get('code');
          
          if (qrCode) {
            await validateQR(qrCode);
          }
        }
      } catch (err) {
        // Ignorar errores de parsing
      }
    }
  };

  const validateQR = async (code) => {
    if (success) return;
    
    setScanning(false);
    stopCamera();

    try {
      const data = await fetchApi('/qr/validate', {
        method: 'POST',
        body: JSON.stringify({ code })
      });

      setSuccess(true);
      showToast(data.message || 'Asistencia registrada', 'success');
      
      if (onSuccess) {
        onSuccess(data.registro);
      }

      setTimeout(() => {
        onClose();
      }, 2000);
    } catch (err) {
      setError(err.message);
      showToast(err.message, 'error');
      
      // Reintentar escaneo después de 2 segundos
      setTimeout(() => {
        setError(null);
        startCamera();
      }, 2000);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/90 flex items-center justify-center z-50">
      <div className="relative w-full h-full max-w-lg">
        {/* Header */}
        <div className="absolute top-0 left-0 right-0 z-10 p-4 bg-gradient-to-b from-black/80 to-transparent">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-[#4285F4] flex items-center justify-center">
                <QrCode size={20} className="text-white" />
              </div>
              <div>
                <h2 className="font-bold text-white">Escanear QR</h2>
                <p className="text-xs text-gray-300">Apunta al código QR</p>
              </div>
            </div>
            <button onClick={onClose} className="w-10 h-10 rounded-xl bg-white/10 hover:bg-white/20 flex items-center justify-center transition-colors">
              <X size={18} className="text-white" />
            </button>
          </div>
        </div>

        {/* Video */}
        <video 
          ref={videoRef}
          autoPlay
          playsInline
          muted
          className="w-full h-full object-cover"
        />
        
        {/* Canvas oculto para procesamiento */}
        <canvas ref={canvasRef} className="hidden" />

        {/* Overlay de escaneo */}
        {scanning && !success && !error && (
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="relative">
              {/* Marco de escaneo */}
              <div className="w-64 h-64 border-4 border-[#4285F4] rounded-2xl relative">
                {/* Esquinas animadas */}
                <div className="absolute top-0 left-0 w-8 h-8 border-t-4 border-l-4 border-white rounded-tl-2xl" />
                <div className="absolute top-0 right-0 w-8 h-8 border-t-4 border-r-4 border-white rounded-tr-2xl" />
                <div className="absolute bottom-0 left-0 w-8 h-8 border-b-4 border-l-4 border-white rounded-bl-2xl" />
                <div className="absolute bottom-0 right-0 w-8 h-8 border-b-4 border-r-4 border-white rounded-br-2xl" />
                
                {/* Línea de escaneo */}
                <div className="absolute inset-x-0 top-0 h-1 bg-[#4285F4] animate-scan" />
              </div>
              
              <p className="text-white text-center mt-4 text-sm font-medium">
                Buscando código QR...
              </p>
            </div>
          </div>
        )}

        {/* Success */}
        {success && (
          <div className="absolute inset-0 flex items-center justify-center bg-black/80">
            <div className="text-center">
              <div className="w-20 h-20 rounded-full bg-[#34A853] flex items-center justify-center mx-auto mb-4 animate-scale-in">
                <CheckCircle size={40} className="text-white" />
              </div>
              <h3 className="text-white text-xl font-bold mb-2">¡Asistencia registrada!</h3>
              <p className="text-gray-300 text-sm">Cerrando...</p>
            </div>
          </div>
        )}

        {/* Error */}
        {error && (
          <div className="absolute inset-0 flex items-center justify-center bg-black/80">
            <div className="text-center px-6">
              <div className="w-20 h-20 rounded-full bg-[#EA4335] flex items-center justify-center mx-auto mb-4">
                <AlertCircle size={40} className="text-white" />
              </div>
              <h3 className="text-white text-xl font-bold mb-2">Error</h3>
              <p className="text-gray-300 text-sm">{error}</p>
              <p className="text-gray-400 text-xs mt-2">Reintentando...</p>
            </div>
          </div>
        )}

        {/* Instructions */}
        <div className="absolute bottom-0 left-0 right-0 p-6 bg-gradient-to-t from-black/80 to-transparent">
          <div className="bg-white/10 backdrop-blur-sm rounded-xl p-4">
            <p className="text-white text-sm text-center">
              Coloca el código QR dentro del marco
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
