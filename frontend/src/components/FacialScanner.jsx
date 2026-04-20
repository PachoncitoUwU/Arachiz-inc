import React, { useState, useEffect, useRef } from 'react';
import { loadFaceModels, faceDistance, arrayToDescriptor } from '../utils/faceApi';
import * as faceapi from 'face-api.js';
import fetchApi from '../services/api';
import { ScanLine, CheckCircle2, Loader2, X, AlertCircle } from 'lucide-react';

/**
 * Escáner optimizado para VELOCIDAD:
 * - inputSize 160: ~5x más rápido que 320
 * - ciclo cada 350ms → ~3 detecciones/segundo
 * - nombre aparece instantáneamente sin esperar al servidor
 */
export default function FacialScanner({ asistenciaId, aprendices = [], alreadyRegistered = new Set(), onRegistered, onClose }) {
  const videoRef = useRef(null);
  const streamRef = useRef(null);
  const loopRef = useRef(null);
  const busyRef = useRef(false);
  const registeredRef = useRef(new Set(alreadyRegistered));
  const cooldownRef = useRef({});

  const [ready, setReady] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [registeredCount, setRegisteredCount] = useState(alreadyRegistered.size);
  const [liveMatches, setLiveMatches] = useState([]);
  const liveTimer = useRef(null);
  const [history, setHistory] = useState([]);

  const THRESHOLD = 0.55;
  const COOLDOWN_MS = 5000;

  const candidates = aprendices
    .filter(a => a.faceDescriptor?.length === 128)
    .map(a => ({ ...a, descriptor: arrayToDescriptor(a.faceDescriptor) }));

  // ─── Init ──────────────────────────────────────────────────────────
  useEffect(() => {
    let cancelled = false;
    const init = async () => {
      try {
        await loadFaceModels();
        if (cancelled) return;
        const stream = await navigator.mediaDevices.getUserMedia({
          video: { facingMode: 'user', width: { ideal: 640 }, height: { ideal: 480 } }
        });
        if (cancelled) { stream.getTracks().forEach(t => t.stop()); return; }
        streamRef.current = stream;
        if (videoRef.current) { videoRef.current.srcObject = stream; await videoRef.current.play(); }
        setReady(true);
        startLoop();
      } catch (err) {
        if (!cancelled) setErrorMsg(err.name === 'NotAllowedError' ? 'Permiso de cámara denegado' : 'Error: ' + err.message);
      }
    };
    init();
    return () => { cancelled = true; cleanup(); };
  }, []);

  const cleanup = () => {
    if (loopRef.current) clearTimeout(loopRef.current);
    if (liveTimer.current) clearTimeout(liveTimer.current);
    if (streamRef.current) streamRef.current.getTracks().forEach(t => t.stop());
  };

  // ─── Loop ultra-rápido (350ms, inputSize 160) ──────────────────────
  const startLoop = () => {
    const OPTIONS = new faceapi.TinyFaceDetectorOptions({ inputSize: 160, scoreThreshold: 0.4 });

    const tick = async () => {
      if (!videoRef.current || videoRef.current.readyState < 2 || busyRef.current) {
        loopRef.current = setTimeout(tick, 80);
        return;
      }
      busyRef.current = true;

      try {
        // Detectar TODAS las caras con modelo ultra-rápido
        const detections = await faceapi
          .detectAllFaces(videoRef.current, OPTIONS)
          .withFaceLandmarks(true)
          .withFaceDescriptors();

        if (!detections || detections.length === 0) {
          setLiveMatches([]);
        } else {
          const now = Date.now();
          const matched = [];
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
              matched.push({ id: best.id, name: best.fullName, isNew: !alreadyDone && !onCooldown });
              if (!alreadyDone && !onCooldown) {
                cooldownRef.current[best.id] = now;
                toRegister.push(best);
              }
            }
          }

          // Mostrar nombres INSTANTÁNEAMENTE
          setLiveMatches(matched);
          if (liveTimer.current) clearTimeout(liveTimer.current);
          liveTimer.current = setTimeout(() => setLiveMatches([]), 1200);

          // Registrar en BD en paralelo (background)
          if (toRegister.length > 0) {
            Promise.all(toRegister.map(save)).then(results => {
              const saved = results.filter(Boolean);
              if (saved.length > 0) {
                setRegisteredCount(n => n + saved.length);
                saved.forEach(a => {
                  registeredRef.current.add(a.id);
                  onRegistered?.(a);
                });
                setHistory(prev => [
                  ...saved.map(a => ({ id: a.id, name: a.fullName, ts: new Date() })),
                  ...prev
                ].slice(0, 20));
              }
            });
          }
        }
      } catch (_) {}

      busyRef.current = false;
      loopRef.current = setTimeout(tick, 350); // 350ms → ~3 fps de detección
    };

    loopRef.current = setTimeout(tick, 300);
  };

  const save = async (aprendiz) => {
    try {
      await fetchApi('/asistencias/facial-register', {
        method: 'POST',
        body: JSON.stringify({ asistenciaId, aprendizId: aprendiz.id })
      });
      return aprendiz;
    } catch (err) {
      if (err.message?.includes('ya registró')) registeredRef.current.add(aprendiz.id);
      return null;
    }
  };

  const totalWithFace = candidates.length;

  return (
    <div className="flex flex-col gap-3">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="w-2 h-2 rounded-full bg-[#34A853] animate-pulse" />
          <span className="font-semibold text-gray-800 text-sm">Escáner Facial</span>
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
          {/* Video */}
          <div className="relative rounded-xl overflow-hidden bg-black" style={{ aspectRatio: '4/3', maxHeight: 270 }}>
            <video ref={videoRef} muted playsInline className="w-full h-full object-cover"
              style={{ transform: 'scaleX(-1)' }} />

            {!ready && !errorMsg && (
              <div className="absolute inset-0 bg-black/70 flex items-center justify-center">
                <Loader2 size={26} className="animate-spin text-white" />
              </div>
            )}
            {errorMsg && (
              <div className="absolute inset-0 bg-black/70 flex items-center justify-center p-4">
                <div className="bg-white rounded-xl p-3 text-center">
                  <AlertCircle size={22} className="text-red-500 mx-auto mb-1" />
                  <p className="text-xs text-red-700">{errorMsg}</p>
                </div>
              </div>
            )}

            {/* Overlay nombres — instantáneo */}
            {liveMatches.length > 0 && (
              <div className="absolute inset-x-0 bottom-0 flex flex-col">
                {liveMatches.map((m, i) => (
                  <div key={m.id}
                    className={`flex items-center gap-2 px-3 py-2
                      ${m.isNew ? 'bg-[#34A853]' : 'bg-[#4285F4]/90'}
                      ${i > 0 ? 'border-t border-white/20' : ''}`}>
                    <CheckCircle2 size={16} className="text-white flex-shrink-0" />
                    <p className="text-white font-bold text-sm flex-1 truncate">{m.name}</p>
                    <span className="text-white/80 text-xs">{m.isNew ? 'Nuevo ✓' : 'Ya marcado'}</span>
                  </div>
                ))}
              </div>
            )}

            {/* Guías esquinas */}
            {ready && liveMatches.length === 0 && (
              <>
                <div className="absolute top-2 left-2 w-5 h-5 border-t-2 border-l-2 border-white/50 rounded-tl" />
                <div className="absolute top-2 right-2 w-5 h-5 border-t-2 border-r-2 border-white/50 rounded-tr" />
                <div className="absolute bottom-2 left-2 w-5 h-5 border-b-2 border-l-2 border-white/50 rounded-bl" />
                <div className="absolute bottom-2 right-2 w-5 h-5 border-b-2 border-r-2 border-white/50 rounded-br" />
              </>
            )}
          </div>

          {/* Estado */}
          <div className="flex items-center justify-between text-xs px-1">
            <div className="flex items-center gap-1 text-gray-400">
              {ready
                ? <><ScanLine size={12} className="text-[#4285F4]" /> ~3 detecciones/seg</>
                : <><Loader2 size={12} className="animate-spin" /> Iniciando...</>}
            </div>
            <span className="text-gray-400">{Math.max(0, totalWithFace - registeredCount)} pendiente(s)</span>
          </div>

          {history.length > 0 && (
            <div className="max-h-28 overflow-y-auto rounded-xl border border-gray-100 bg-gray-50">
              {history.map((h, i) => (
                <div key={h.id + i} className="flex items-center gap-2 px-3 py-1.5 border-b border-gray-100 last:border-0">
                  <CheckCircle2 size={11} className="text-[#34A853] flex-shrink-0" />
                  <span className="text-xs text-gray-700 flex-1 truncate">{h.name}</span>
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
