import React, { useEffect, useRef, useState, useCallback } from 'react';
import { loadFaceModels, detectFaceWithBox } from '../utils/faceApi';
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
  const stabilityRef = useRef(0);

  const [status, setStatus] = useState('loading'); // loading | ready | detecting | detected | error
  const [message, setMessage] = useState('Cargando modelos IA...');
  const [detectedName, setDetectedName] = useState('');
  const [faceBox, setFaceBox] = useState(null); // { x, y, width, height }
  const [isCentered, setIsCentered] = useState(false);

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
        const result = await detectFaceWithBox(videoRef.current);

        if (!result) {
          setFaceBox(null);
          setIsCentered(false);
          stabilityRef.current = 0;
          setMessage(continuousMode ? 'Buscando rostros...' : 'No se detecta rostro. Sitúate frente a la cámara.');
          setStatus('ready');
          return;
        }

        const { descriptor, box } = result;
        const vw = videoRef.current.videoWidth;
        const vh = videoRef.current.videoHeight;
        
        // Espejado en eje X (video transform scaleX(-1)), invertimos la caja visualmente:
        const visualX = vw - box.x - box.width;
        setFaceBox({ x: visualX, y: box.y, width: box.width, height: box.height });

        if (continuousMode) {
          // Modo asistencia: identificar quién es
          if (knownDescriptors.length > 0) {
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
            setStatus('ready');
          }
        } else {
          // Modo enrolamiento: Validar encuadre y estabilidad
          // La caja debe ocupar al menos el 15% del ancho del video (antes 25%, era muy estricto)
          const isBoxBigEnough = box.width > vw * 0.15; 
          const centerX = box.x + box.width / 2;
          const centerY = box.y + box.height / 2;
          // El centro de la cara debe estar en una zona más amplia (40% central en vez de 30%)
          const isBoxCentered = 
            centerX > vw * 0.25 && centerX < vw * 0.75 &&
            centerY > vh * 0.2 && centerY < vh * 0.8;

          if (isBoxBigEnough && isBoxCentered) {
            setIsCentered(true);
            stabilityRef.current += 1;
            setMessage(`Mantente estable... (${stabilityRef.current}/2)`);
            
            if (stabilityRef.current >= 2) {
              setStatus('detected');
              setMessage('¡Rostro perfecto! Guardando...');
              if (intervalRef.current) clearInterval(intervalRef.current);
              onDescriptor?.(descriptor);
            }
          } else {
            setIsCentered(false);
            stabilityRef.current = 0;
            setMessage(
              !isBoxBigEnough ? 'Acércate un poco más a la cámara.' : 'Centra tu rostro en el círculo.'
            );
          }
        }
      } catch (e) {
        // Silenciar errores de detección durante el stream
      }
    }, continuousMode ? 1800 : 500); // 500ms es rápido para capturar los 3 frames estables pronto
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
      <div className={`relative rounded-3xl overflow-hidden border-4 transition-colors duration-500 bg-black shadow-[0_10px_40px_-15px_rgba(0,0,0,0.5)] ${
          status === 'detected' ? 'border-[#34A853]' : 
          !continuousMode && isCentered ? 'border-[#4285F4]' : 'border-gray-800'
        }`}
        style={{ width: '100%', maxWidth: 500, aspectRatio: 'auto', minHeight: 350 }}>

        <video
          ref={videoRef}
          muted
          playsInline
          className="absolute inset-0 w-full h-full object-cover"
          style={{ transform: 'scaleX(-1)' /* espejo natural */ }}
        />
        <canvas ref={canvasRef} className="hidden" />

        {/* MÁSCARA CIRCULAR DESENFOCADA (blur exterior) - Ideal para el registro */}
        {(!continuousMode && status !== 'detected' && status !== 'loading') && (
          <div 
            className="absolute inset-0 pointer-events-none z-10"
            style={{
              backdropFilter: 'blur(10px)',
              WebkitBackdropFilter: 'blur(10px)',
              backgroundColor: 'rgba(0, 0, 0, 0.45)',
              maskImage: 'radial-gradient(circle at center, transparent 30%, black 35%)',
              WebkitMaskImage: 'radial-gradient(circle at center, transparent 30%, black 35%)'
            }}
          />
        )}

        {/* Guía Circular Central (Solo enrolamiento o si no está detectado) */}
        {(!continuousMode && status !== 'detected') && (
          <div className="absolute inset-0 flex items-center justify-center pointer-events-none z-20">
            <div className={`rounded-full border-4 transition-all duration-500 ${
              isCentered ? 'border-[#4285F4] scale-105 shadow-[0_0_20px_#4285F4]' : 'border-white/30 border-dashed scale-100'
            }`} style={{ width: '60%', aspectRatio: '1/1' }} />
          </div>
        )}

        {/* Caja de Rostro Detectado (Para el modo asistencia) */}
        {(continuousMode && faceBox && status !== 'detected') && (
          <div className="absolute border-2 border-[#4285F4]/60 rounded-lg pointer-events-none transition-all duration-150 z-20"
               style={{
                 left: `${(faceBox.x / videoRef.current.videoWidth) * 100}%`,
                 top: `${(faceBox.y / videoRef.current.videoHeight) * 100}%`,
                 width: `${(faceBox.width / videoRef.current.videoWidth) * 100}%`,
                 height: `${(faceBox.height / videoRef.current.videoHeight) * 100}%`
               }}
          />
        )}

        {/* Overlay del scan - Animación futurista */}
        {status === 'detecting' && (
          <div className="absolute inset-0 pointer-events-none z-30">
            <div className="absolute inset-0 bg-[#4285F4]/5 animate-pulse" />
            <div className="absolute left-0 right-0 h-1 bg-[#4285F4]/80 shadow-[0_0_15px_#4285F4]"
              style={{ animation: 'scanline 2s ease-in-out infinite', top: '50%' }} />
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
      <div className={`flex items-center gap-3 px-6 py-3 rounded-full text-sm font-bold shadow-md transition-colors ${
        status === 'error' ? 'bg-red-50 text-red-600' : 
        status === 'detected' ? 'bg-green-50 text-[#34A853]' : 
        isCentered && !continuousMode ? 'bg-blue-50 text-[#4285F4]' : 'bg-gray-100 text-gray-600'
      }`}>
        {statusIcon()}
        <span>
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
