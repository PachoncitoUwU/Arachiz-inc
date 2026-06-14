import React, { useState, useEffect, useRef, useCallback } from 'react';
import { loadFaceModels, faceDistance, arrayToDescriptor } from '../utils/faceApi';
import * as faceapi from 'face-api.js';
import fetchApi from '../services/api';
import { ScanLine, CheckCircle2, Loader2, X, AlertCircle, Users } from 'lucide-react';

/**
 * FacialScanner v3
 * Fix 1: Canvas sin transform CSS — solo se voltea el ctx internamente para alinear con video espejo
 * Fix 2: Historial optimista — nombre aparece INSTANTÁNEAMENTE al detectar, sin esperar API
 * Fix 3: matchDimensions usa offsetWidth/Height (tamaño real en pantalla) en vez de videoWidth/Height
 */
export default function FacialScanner({ asistenciaId, aprendices = [], alreadyRegistered = new Set(), onRegistered, onClose }) {
  const videoRef = useRef(null);
  const canvasRef = useRef(null);
  const streamRef = useRef(null);
  const loopRef = useRef(null);
  const busyRef = useRef(false);
  const registeredRef = useRef(new Set(alreadyRegistered));
  const cooldownRef = useRef({});
  const batchQueueRef = useRef([]);
  const batchBusyRef = useRef(false);

  const [ready, setReady] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [registeredCount, setRegisteredCount] = useState(alreadyRegistered.size);
  const [facesDetected, setFacesDetected] = useState(0);
  const [history, setHistory] = useState([]);

  // Umbral de similitud (menor es más estricto, 0.50 a 0.55 es ideal para TinyFaceDetector)
  const THRESHOLD = 0.55;
  const COOLDOWN_MS = 5000;
  const OPTIONS = useRef(new faceapi.TinyFaceDetectorOptions({ inputSize: 320, scoreThreshold: 0.40 }));

  const candidates = aprendices
    .filter(a => a.faceDescriptor?.length === 128)
    .map(a => ({ ...a, descriptor: arrayToDescriptor(a.faceDescriptor) }));

  // ─── Init ──────────────────────────────────────────────────────────
  useEffect(() => {
    let cancelled = false;
    let batchInterval;
    const init = async () => {
      try {
        await loadFaceModels();
        if (cancelled) return;
        const stream = await navigator.mediaDevices.getUserMedia({
          video: { facingMode: 'user', width: { ideal: 640 }, height: { ideal: 480 } }
        });
        if (cancelled) { stream.getTracks().forEach(t => t.stop()); return; }
        streamRef.current = stream;
        if (videoRef.current) {
          videoRef.current.srcObject = stream;
          await videoRef.current.play();
        }
        setReady(true);
        startLoop();
        batchInterval = setInterval(flushBatch, 1000);
      } catch (err) {
        if (!cancelled) setErrorMsg(err.name === 'NotAllowedError' ? 'Permiso de cámara denegado' : 'Error: ' + err.message);
      }
    };
    init();
    return () => { cancelled = true; clearInterval(batchInterval); cleanup(); };
  }, []);

  const cleanup = () => {
    if (loopRef.current) clearTimeout(loopRef.current);
    if (streamRef.current) streamRef.current.getTracks().forEach(t => t.stop());
    const canvas = canvasRef.current;
    if (canvas) canvas.getContext('2d').clearRect(0, 0, canvas.width, canvas.height);
  };

  // ─── Dibujar bounding boxes ────────────────────────────────────────
  // FIX: El canvas NO tiene CSS transform. Aquí en el ctx hacemos el flip
  // para que los boxes coincidan con el video que sí está en espejo.
  const drawDetections = useCallback((detections, matchResults, videoEl) => {
    const canvas = canvasRef.current;
    if (!canvas || !videoEl) return;

    // Usar dimensiones de pantalla (lo que ve el usuario), no las del stream
    const W = videoEl.offsetWidth;
    const H = videoEl.offsetHeight;
    if (!W || !H) return;

    // Ajustar atributos del canvas al tamaño visible
    canvas.width = W;
    canvas.height = H;

    const ctx = canvas.getContext('2d');
    ctx.clearRect(0, 0, W, H);

    // Redimensionar resultados del tamaño nativo del video al tamaño mostrado
    const displaySize = { width: W, height: H };
    const resized = faceapi.resizeResults(detections, displaySize);

    // Voltear el ctx para que coincida con el espejo del video (CSS scaleX -1)
    ctx.save();
    ctx.translate(W, 0);
    ctx.scale(-1, 1);

    resized.forEach((det, i) => {
      const box = det.detection.box;
      const match = matchResults[i];

      let color, label;
      if (match?.recognized) {
        const confidence = Math.round((1 - match.distance) * 100);
        if (match.alreadyDone) {
          color = '#4285F4'; label = `${match.name} · Ya marcado`;
        } else {
          color = '#34A853'; label = `${match.name} · ${confidence}%`;
        }
      } else {
        color = '#EA4335'; label = 'Desconocido';
      }

      const { x, y, width, height } = box;
      const r = 6;

      // ── Rectángulo principal ──
      ctx.beginPath();
      ctx.moveTo(x + r, y);
      ctx.lineTo(x + width - r, y);
      ctx.quadraticCurveTo(x + width, y, x + width, y + r);
      ctx.lineTo(x + width, y + height - r);
      ctx.quadraticCurveTo(x + width, y + height, x + width - r, y + height);
      ctx.lineTo(x + r, y + height);
      ctx.quadraticCurveTo(x, y + height, x, y + height - r);
      ctx.lineTo(x, y + r);
      ctx.quadraticCurveTo(x, y, x + r, y);
      ctx.closePath();

      // Glow externo
      ctx.shadowBlur = 12;
      ctx.shadowColor = color;
      ctx.strokeStyle = color;
      ctx.lineWidth = 2.5;
      ctx.stroke();
      ctx.shadowBlur = 0;

      // Relleno interior muy tenue
      ctx.fillStyle = color + '18';
      ctx.fill();

      // ── Esquinas estilo HUD ──
      const cL = Math.min(22, width * 0.25);
      ctx.strokeStyle = color;
      ctx.lineWidth = 3;
      ctx.lineCap = 'round';
      // TL
      ctx.beginPath(); ctx.moveTo(x, y + cL); ctx.lineTo(x, y); ctx.lineTo(x + cL, y); ctx.stroke();
      // TR
      ctx.beginPath(); ctx.moveTo(x + width - cL, y); ctx.lineTo(x + width, y); ctx.lineTo(x + width, y + cL); ctx.stroke();
      // BL
      ctx.beginPath(); ctx.moveTo(x, y + height - cL); ctx.lineTo(x, y + height); ctx.lineTo(x + cL, y + height); ctx.stroke();
      // BR
      ctx.beginPath(); ctx.moveTo(x + width - cL, y + height); ctx.lineTo(x + width, y + height); ctx.lineTo(x + width, y + height - cL); ctx.stroke();

      // ── Label flotante ──
      const fs = Math.max(12, Math.min(16, width / 7));
      ctx.font = `bold ${fs}px Inter, Arial, sans-serif`;
      const tw = ctx.measureText(label).width;
      const lw = tw + 16;
      const lh = fs + 10;
      const lx = x;
      const ly = y > lh + 4 ? y - lh - 4 : y + height + 4;

      ctx.fillStyle = color;
      ctx.beginPath();
      ctx.roundRect(lx, ly, lw, lh, 4);
      ctx.fill();

      ctx.fillStyle = '#ffffff';
      ctx.fillText(label, lx + 8, ly + lh - 4);
    });

    ctx.restore();
  }, []);

  // ─── Loop de detección ─────────────────────────────────────────────
  const startLoop = () => {
    const tick = async () => {
      const video = videoRef.current;
      if (!video || video.readyState < 2 || busyRef.current) {
        loopRef.current = setTimeout(tick, 80);
        return;
      }
      busyRef.current = true;

      try {
        const detections = await faceapi
          .detectAllFaces(video, OPTIONS.current)
          .withFaceLandmarks(true)
          .withFaceDescriptors();

        setFacesDetected(detections?.length || 0);

        if (!detections || detections.length === 0) {
          const canvas = canvasRef.current;
          if (canvas) canvas.getContext('2d').clearRect(0, 0, canvas.width, canvas.height);
        } else {
          const now = Date.now();
          const matchResults = [];
          const toRegister = [];

          for (const det of detections) {
            let best = null, bestDist = Infinity;
            for (const c of candidates) {
              const d = faceDistance(det.descriptor, c.descriptor);
              if (d < bestDist) { bestDist = d; best = c; }
            }

            if (best && bestDist < THRESHOLD) {
              const alreadyDone = registeredRef.current.has(best.id);
              const onCooldown = (now - (cooldownRef.current[best.id] || 0)) < COOLDOWN_MS;
              matchResults.push({ recognized: true, name: best.fullName, distance: bestDist, id: best.id, alreadyDone: alreadyDone || onCooldown });

              if (!alreadyDone && !onCooldown) {
                cooldownRef.current[best.id] = now;
                toRegister.push(best);

                // ✅ FIX: Actualización OPTIMISTA — aparece INMEDIATAMENTE sin esperar API
                registeredRef.current.add(best.id);
                setRegisteredCount(n => n + 1);
                setHistory(prev => [{ id: best.id, name: best.fullName, ts: new Date(), pending: true }, ...prev].slice(0, 20));
                onRegistered?.(best);
              }
            } else {
              matchResults.push({ recognized: false });
            }
          }

          drawDetections(detections, matchResults, video);

          // Agregar a la cola de lotes en vez de enviar uno a uno
          if (toRegister.length > 0) {
            batchQueueRef.current.push(...toRegister);
          }
        }
      } catch (_) {}

      busyRef.current = false;
      loopRef.current = setTimeout(tick, 300);
    };

    loopRef.current = setTimeout(tick, 300);
  };

  const flushBatch = async () => {
    if (batchQueueRef.current.length === 0 || batchBusyRef.current) return;
    batchBusyRef.current = true;
    
    // Tomar el lote actual y vaciar la cola
    const batch = [...batchQueueRef.current];
    batchQueueRef.current = [];
    
    try {
      const res = await fetchApi('/asistencias/facial-batch', {
        method: 'POST',
        body: JSON.stringify({ asistenciaId, aprendizIds: batch.map(a => a.id) })
      });
      
      const okIds = new Set([...(res.registered || []), ...(res.alreadyDone || [])]);
      const failedIds = new Set(res.failed || []);
      
      if (failedIds.size > 0) {
        failedIds.forEach(id => {
          registeredRef.current.delete(id);
          delete cooldownRef.current[id];
        });
        setRegisteredCount(n => Math.max(0, n - failedIds.size));
        setHistory(prev => prev.filter(h => !failedIds.has(h.id)));
      }
      
      if (okIds.size > 0) {
        setHistory(prev => prev.map(h => okIds.has(h.id) ? { ...h, pending: false } : h));
      }
    } catch (err) {
      // Si falla todo el lote (ej. sin internet), revertir optimismo
      const failedIds = new Set(batch.map(a => a.id));
      failedIds.forEach(id => {
        registeredRef.current.delete(id);
        delete cooldownRef.current[id];
      });
      setRegisteredCount(n => Math.max(0, n - failedIds.size));
      setHistory(prev => prev.filter(h => !failedIds.has(h.id)));
    }
    
    batchBusyRef.current = false;
  };

  const totalWithFace = candidates.length;

  return (
    <div className="flex flex-col gap-3">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="w-2 h-2 rounded-full bg-[#34A853] animate-pulse" />
          <span className="font-semibold text-gray-800 dark:text-gray-200 text-sm">Escáner Facial</span>
          {ready && facesDetected > 0 && (
            <span className="flex items-center gap-1 text-xs bg-blue-50 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 px-2 py-0.5 rounded-full font-medium">
              <Users size={11} />
              {facesDetected} {facesDetected === 1 ? 'cara' : 'caras'}
            </span>
          )}
        </div>
        <div className="flex items-center gap-3">
          <span className="text-xs">
            <span className="font-bold text-[#34A853]">{registeredCount}</span>
            <span className="text-gray-400"> / {totalWithFace}</span>
          </span>
          <button onClick={() => { cleanup(); onClose(); }}
            className="w-7 h-7 flex items-center justify-center text-gray-400 hover:bg-red-50 hover:text-red-500 rounded-full transition-colors">
            <X size={15} />
          </button>
        </div>
      </div>

      {totalWithFace === 0 ? (
        <div className="bg-yellow-50 border border-yellow-200 rounded-xl p-4 text-center">
          <AlertCircle size={22} className="text-yellow-500 mx-auto mb-1" />
          <p className="text-sm font-semibold text-yellow-800">Sin caras registradas</p>
          <p className="text-xs text-yellow-600">Ve a Fichas → aprendiz → Registrar Cara</p>
        </div>
      ) : (
        <>
          {/* Contenedor de video + canvas */}
          <div className="relative rounded-xl overflow-hidden bg-black" style={{ aspectRatio: '4/3', maxHeight: 280 }}>
            {/* Video en espejo — solo para que el usuario se vea natural */}
            <video
              ref={videoRef}
              muted
              playsInline
              className="w-full h-full object-cover"
              style={{ transform: 'scaleX(-1)' }}
            />

            {/*
              Canvas SIN transform CSS.
              El espejo se maneja internamente con ctx.scale(-1,1) en drawDetections
              para que los boxes coincidan con el video espejo.
            */}
            <canvas
              ref={canvasRef}
              className="absolute inset-0 w-full h-full"
              style={{ pointerEvents: 'none' }}
            />

            {!ready && !errorMsg && (
              <div className="absolute inset-0 bg-black/70 flex flex-col items-center justify-center gap-2">
                <Loader2 size={26} className="animate-spin text-white" />
                <p className="text-white/80 text-xs">Cargando modelos de IA...</p>
              </div>
            )}

            {errorMsg && (
              <div className="absolute inset-0 bg-black/70 flex items-center justify-center p-4">
                <div className="bg-white dark:bg-zinc-800 rounded-xl p-3 text-center">
                  <AlertCircle size={22} className="text-red-500 mx-auto mb-1" />
                  <p className="text-xs text-red-700">{errorMsg}</p>
                </div>
              </div>
            )}

            {/* Guías cuando no hay cara */}
            {ready && facesDetected === 0 && (
              <>
                <div className="absolute top-3 left-3 w-6 h-6 border-t-2 border-l-2 border-white/50 rounded-tl" />
                <div className="absolute top-3 right-3 w-6 h-6 border-t-2 border-r-2 border-white/50 rounded-tr" />
                <div className="absolute bottom-3 left-3 w-6 h-6 border-b-2 border-l-2 border-white/50 rounded-bl" />
                <div className="absolute bottom-3 right-3 w-6 h-6 border-b-2 border-r-2 border-white/50 rounded-br" />
                <div className="absolute inset-0 flex items-center justify-center">
                  <p className="text-white/50 text-sm">Acércate a la cámara</p>
                </div>
              </>
            )}
          </div>

          {/* Leyenda */}
          {ready && (
            <div className="flex items-center gap-3 text-xs text-gray-500 px-1">
              <span className="flex items-center gap-1.5"><span className="w-2.5 h-2.5 rounded-sm bg-[#34A853] inline-block" />Nuevo</span>
              <span className="flex items-center gap-1.5"><span className="w-2.5 h-2.5 rounded-sm bg-[#4285F4] inline-block" />Ya marcado</span>
              <span className="flex items-center gap-1.5"><span className="w-2.5 h-2.5 rounded-sm bg-[#EA4335] inline-block" />Desconocido</span>
              <span className="ml-auto flex items-center gap-1 text-gray-400">
                <ScanLine size={11} className="text-[#4285F4]" /> ~3/seg
              </span>
            </div>
          )}

          {/* Historial — aparece instantáneamente */}
          {history.length > 0 && (
            <div className="max-h-28 overflow-y-auto rounded-xl border border-gray-100 dark:border-zinc-700 bg-gray-50 dark:bg-zinc-900">
              {history.map((h, i) => (
                <div key={h.id + i} className="flex items-center gap-2 px-3 py-1.5 border-b border-gray-100 dark:border-zinc-700 last:border-0">
                  {h.pending
                    ? <Loader2 size={11} className="text-gray-400 flex-shrink-0 animate-spin" />
                    : <CheckCircle2 size={11} className="text-[#34A853] flex-shrink-0" />
                  }
                  <span className="text-xs text-gray-700 dark:text-gray-300 flex-1 truncate">{h.name}</span>
                  <span className="text-xs text-gray-400">
                    {h.ts.toLocaleTimeString('es', { hour: '2-digit', minute: '2-digit', second: '2-digit' })}
                  </span>
                </div>
              ))}
            </div>
          )}
        </>
      )}
    </div>
  );
}
