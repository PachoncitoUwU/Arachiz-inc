import React, { useEffect, useRef, useState, useCallback } from 'react';
import { loadFaceModels, detectFaceDescriptor } from '../utils/faceApi';
import { Camera, ScanLine, CheckCircle2, AlertCircle, Loader2, X } from 'lucide-react';

/**
 * Componente reutilizable de captura facial.
 *
 * Props:
 *   onDescriptor(Float32Array) — se llama cuando detecta una cara con suficiente confianza
 *   onClose() — cierra el panel
 *   label — texto de instrucción (opcional)
 *   continuousMode — si true, sigue detectando (para asistencia); si false, detecta una vez (para enrolamiento)
 *   knownDescriptors — array de { descriptor: Float32Array, userId, fullName } para modo asistencia
 *   onIdentified({ userId, fullName }) — callback para modo asistencia
 */
export default function FaceCapture({
  onDescriptor,
  onClose,
  label = 'Coloca tu cara frente a la cámara',
  continuousMode = false,
  knownDescriptors = [],
  onIdentified,
}) {
  const videoRef = useRef(null);
  const canvasRef = useRef(null);
  const streamRef = useRef(null);
  const intervalRef = useRef(null);

  const [status, setStatus] = useState('loading'); // loading | ready | detecting | detected | error
  const [message, setMessage] = useState('Cargando modelos IA...');
  const [detectedName, setDetectedName] = useState('');
  const [faceBox, setFaceBox] = useState(null); // { x, y, width, height } normalizado

  // Cargar modelos + cámara
  useEffect(() => {
    let cancelled = false;

    const init = async () => {
      try {
        setStatus('loading');
        setMessage('Cargando modelos de reconocimiento...');
        await loadFaceModels();

        if (cancelled) return;

        const stream = await navigator.mediaDevices.getUserMedia({
          video: { facingMode: 'user', width: { ideal: 640 }, height: { ideal: 480 } }
        });

        if (cancelled) {
          stream.getTracks().forEach(t => t.stop());
          return;
        }

        streamRef.current = stream;
        if (videoRef.current) {
          videoRef.current.srcObject = stream;
          await videoRef.current.play();
        }

        setStatus('ready');
        setMessage('Cámara lista — ' + label);

        // Empezar detección
        startDetection();
      } catch (err) {
        if (!cancelled) {
          setStatus('error');
          setMessage(err.name === 'NotAllowedError'
            ? 'Permiso de cámara denegado. Actívalo en el navegador.'
            : 'No se pudo acceder a la cámara: ' + err.message);
        }
      }
    };

    init();

    return () => {
      cancelled = true;
      stopAll();
    };
  }, []);

  const stopAll = () => {
    if (intervalRef.current) clearInterval(intervalRef.current);
    if (streamRef.current) streamRef.current.getTracks().forEach(t => t.stop());
    streamRef.current = null;
  };

  const startDetection = useCallback(() => {
    if (intervalRef.current) clearInterval(intervalRef.current);

    intervalRef.current = setInterval(async () => {
      if (!videoRef.current || videoRef.current.readyState < 2) return;

      setStatus('detecting');

      try {
        const descriptor = await detectFaceDescriptor(videoRef.current);

        if (!descriptor) {
          setFaceBox(null);
          setStatus('ready');
          return;
        }

        // Dibuja el bounding box aproximado en el canvas
        const vw = videoRef.current.videoWidth;
        const vh = videoRef.current.videoHeight;
        setFaceBox({ x: vw * 0.2, y: vh * 0.1, width: vw * 0.6, height: vh * 0.8 });

        if (continuousMode && knownDescriptors.length > 0) {
          // Modo asistencia: identificar quién es
          let best = null;
          let bestDist = Infinity;
          const { faceDistance } = await import('../utils/faceApi');

          for (const known of knownDescriptors) {
            const dist = faceDistance(descriptor, known.descriptor);
            if (dist < bestDist) { bestDist = dist; best = known; }
          }

          if (bestDist < 0.55 && best) {
            setDetectedName(best.fullName);
            setStatus('detected');
            onIdentified?.(best);
          } else {
            setStatus('ready');
          }
        } else {
          // Modo enrolamiento: capturar UNA vez y detener
          setStatus('detected');
          setMessage('¡Cara detectada! Guardando...');
          if (intervalRef.current) clearInterval(intervalRef.current);
          onDescriptor?.(descriptor);
        }
      } catch (e) {
        // Silenciar errores de detección durante el stream
      }
    }, continuousMode ? 1800 : 600);
  }, [continuousMode, knownDescriptors, onDescriptor, onIdentified]);

  const statusIcon = () => {
    switch (status) {
      case 'loading':   return <Loader2 size={20} className="animate-spin text-blue-400" />;
      case 'ready':     return <Camera size={20} className="text-gray-400" />;
      case 'detecting': return <ScanLine size={20} className="animate-pulse text-[#4285F4]" />;
      case 'detected':  return <CheckCircle2 size={20} className="text-[#34A853]" />;
      case 'error':     return <AlertCircle size={20} className="text-red-400" />;
      default:          return null;
    }
  };

  const statusColor = {
    loading:   'border-blue-300',
    ready:     'border-gray-300',
    detecting: 'border-[#4285F4]',
    detected:  'border-[#34A853]',
    error:     'border-red-400',
  }[status] || 'border-gray-300';

  return (
    <div className="flex flex-col items-center gap-4">
      {/* Video container */}
      <div className={`relative rounded-2xl overflow-hidden border-2 transition-colors duration-300 bg-black ${statusColor}`}
        style={{ width: '100%', maxWidth: 380, aspectRatio: '4/3' }}>

        <video
          ref={videoRef}
          muted
          playsInline
          className="w-full h-full object-cover"
          style={{ transform: 'scaleX(-1)' /* espejo natural */ }}
        />
        <canvas ref={canvasRef} className="absolute inset-0 pointer-events-none" />

        {/* Overlay del scan */}
        {status === 'detecting' && (
          <div className="absolute inset-0 pointer-events-none">
            <div className="absolute inset-0 bg-[#4285F4]/5 animate-pulse" />
            {/* Línea de escaneo */}
            <div className="absolute left-4 right-4 h-0.5 bg-[#4285F4]/60 rounded-full"
              style={{ animation: 'scanline 2s ease-in-out infinite', top: '50%' }} />
          </div>
        )}

        {/* Marco facial guía */}
        {(status === 'ready' || status === 'detecting') && (
          <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
            <div className={`w-40 h-48 border-2 rounded-full border-dashed transition-colors
              ${status === 'detecting' ? 'border-[#4285F4]' : 'border-white/40'}`} />
          </div>
        )}

        {/* Detected overlay */}
        {status === 'detected' && (
          <div className="absolute inset-0 bg-[#34A853]/10 flex items-center justify-center">
            <div className="bg-white dark:bg-zinc-800 /90 backdrop-blur rounded-2xl px-6 py-4 text-center shadow-xl">
              <CheckCircle2 size={40} className="text-[#34A853] mx-auto mb-2" />
              {continuousMode && detectedName ? (
                <p className="font-bold text-gray-900 dark:text-white  text-lg">{detectedName}</p>
              ) : (
                <p className="font-bold text-gray-900 dark:text-white ">¡Cara capturada!</p>
              )}
            </div>
          </div>
        )}

        {/* Close button */}
        {onClose && (
          <button onClick={() => { stopAll(); onClose(); }}
            className="absolute top-2 right-2 w-8 h-8 bg-black/40 hover:bg-black/60 text-white rounded-full flex items-center justify-center transition-colors">
            <X size={14} />
          </button>
        )}
      </div>

      {/* Status bar */}
      <div className="flex items-center gap-2 text-sm text-gray-600">
        {statusIcon()}
        <span className={status === 'error' ? 'text-red-500' : status === 'detected' ? 'text-[#34A853]' : ''}>
          {status === 'error' ? message : status === 'detected' && continuousMode && detectedName
            ? `Identificado: ${detectedName}`
            : message}
        </span>
      </div>

      <style>{`
        @keyframes scanline {
          0%   { top: 20%; }
          50%  { top: 80%; }
          100% { top: 20%; }
        }
      `}</style>
    </div>
  );
}
