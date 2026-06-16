import React, { useState, useEffect, useRef } from 'react';
import * as faceapi from 'face-api.js';
import { loadFaceModels, faceDistance, arrayToDescriptor } from '../utils/faceApi';
import { X, ScanFace } from 'lucide-react';
import { useToast } from '../context/ToastContext';

export default function FaceScannerModal({ open, onClose, candidates, onDetect }) {
  const videoRef = useRef(null);
  const canvasRef = useRef(null);
  const streamRef = useRef(null);
  const loopRef = useRef(null);
  const busyRef = useRef(false);
  const cooldownRef = useRef({});
  const { showToast } = useToast();
  const [ready, setReady] = useState(false);

  const THRESHOLD = 0.45;
  const COOLDOWN_MS = 3000;

  useEffect(() => {
    if (open) {
      startCamera();
    } else {
      stopCamera();
    }
    return () => stopCamera();
  }, [open]);

  const startCamera = async () => {
    try {
      setReady(false);
      await loadFaceModels();
      const stream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: 'user' } });
      streamRef.current = stream;
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
      }
    } catch (err) {
      showToast('Error al iniciar cámara: ' + err.message, 'error');
      onClose();
    }
  };

  const stopCamera = () => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(t => t.stop());
      streamRef.current = null;
    }
    if (loopRef.current) clearTimeout(loopRef.current);
    busyRef.current = false;
    setReady(false);
  };

  const drawDetections = (detections, matchResults) => {
    const video = videoRef.current;
    const canvas = canvasRef.current;
    if (!video || !canvas) return;

    const W = video.videoWidth;
    const H = video.videoHeight;
    if (canvas.width !== W || canvas.height !== H) {
      canvas.width = W;
      canvas.height = H;
    }

    const ctx = canvas.getContext('2d');
    ctx.clearRect(0, 0, W, H);
    const displaySize = { width: W, height: H };
    const resized = faceapi.resizeResults(detections, displaySize);

    ctx.save();
    ctx.translate(W, 0);
    ctx.scale(-1, 1);

    resized.forEach((det, i) => {
      const match = matchResults[i];
      let color, label;
      if (match?.recognized) {
        if (match.onCooldown) {
          color = '#4285F4'; label = `${match.name} · Registrando...`;
        } else {
          color = '#34A853'; label = `${match.name}`;
        }
      } else {
        color = '#EA4335'; label = 'Desconocido';
      }

      const { x, y, width, height } = det.detection.box;
      ctx.strokeStyle = color;
      ctx.lineWidth = 3;
      ctx.strokeRect(x, y, width, height);
      
      ctx.fillStyle = color;
      ctx.font = 'bold 16px Arial';
      ctx.fillText(label, x, y > 20 ? y - 5 : y + height + 20);
    });
    ctx.restore();
  };

  const startLoop = () => {
    if (!open) return;
    setReady(true);
    const OPTIONS = new faceapi.TinyFaceDetectorOptions({ inputSize: 160, scoreThreshold: 0.4 });
    const formattedCandidates = candidates
      .filter(a => a.faceDescriptor && a.faceDescriptor.length === 128)
      .map(a => ({ ...a, descriptor: arrayToDescriptor(a.faceDescriptor) }));

    const tick = async () => {
      if (!videoRef.current || videoRef.current.readyState < 2 || busyRef.current) {
        loopRef.current = setTimeout(tick, 100);
        return;
      }
      busyRef.current = true;
      try {
        const detections = await faceapi.detectAllFaces(videoRef.current, OPTIONS)
          .withFaceLandmarks(true)
          .withFaceDescriptors();

        const matchResults = [];
        const now = Date.now();

        for (const det of detections) {
          let best = null, bestDist = Infinity;
          for (const c of formattedCandidates) {
            const d = faceDistance(det.descriptor, c.descriptor);
            if (d < bestDist) { bestDist = d; best = c; }
          }
          if (best && bestDist < THRESHOLD) {
            const onCooldown = (now - (cooldownRef.current[best.id] || 0)) < COOLDOWN_MS;
            matchResults.push({ recognized: true, name: best.fullName, id: best.id, onCooldown });
            if (!onCooldown) {
              cooldownRef.current[best.id] = now;
              onDetect(best);
            }
          } else {
            matchResults.push({ recognized: false });
          }
        }
        drawDetections(detections, matchResults);
      } catch (e) {
        console.error(e);
      } finally {
        busyRef.current = false;
        loopRef.current = setTimeout(tick, 100);
      }
    };
    tick();
  };

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fade-in">
      <div className="bg-white dark:bg-gray-900 rounded-2xl shadow-xl w-full max-w-2xl overflow-hidden relative">
        <div className="p-4 border-b border-gray-100 dark:border-gray-800 flex justify-between items-center">
          <h3 className="font-bold text-lg flex items-center gap-2 dark:text-white">
            <ScanFace className="text-blue-500" /> Reconocimiento Facial
          </h3>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300">
            <X size={24} />
          </button>
        </div>
        <div className="p-4 relative bg-black flex justify-center items-center min-h-[400px]">
          {!ready && (
            <div className="absolute inset-0 flex flex-col items-center justify-center text-white z-10 bg-black/50">
              <div className="w-10 h-10 border-4 border-blue-500 border-t-transparent rounded-full animate-spin mb-4"></div>
              <p>Cargando modelos y cámara...</p>
            </div>
          )}
          <div className="relative inline-block">
            <video 
              ref={videoRef} 
              autoPlay 
              playsInline 
              muted 
              onPlay={startLoop}
              className="rounded-lg bg-black"
              style={{ transform: 'scaleX(-1)', maxHeight: '60vh', width: 'auto' }}
            />
            <canvas 
              ref={canvasRef} 
              className="absolute top-0 left-0 w-full h-full pointer-events-none"
            />
          </div>
        </div>
      </div>
    </div>
  );
}
