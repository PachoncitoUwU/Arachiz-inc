import React, { useState, useEffect, useRef } from 'react';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell, PieChart, Pie, Legend, LineChart, Line
} from 'recharts';
import fetchApi from '../../services/api';
import PageHeader from '../../components/PageHeader';
import EmptyState from '../../components/EmptyState';
import { useToast } from '../../context/ToastContext';
import { Play, Square, Users, CheckCircle, Clock, BookOpen, BarChart2, Download, ScanFace, QrCode, Fingerprint, Wifi, RefreshCw, TrendingUp, Award, X, Camera, UserPlus, Zap, Activity, Eye, EyeOff } from 'lucide-react';
import { io } from 'socket.io-client';
import { loadFaceModels, faceDistance, arrayToDescriptor } from '../../utils/faceApi';
import * as faceapi from 'face-api.js';

const API_BASE = import.meta.env.VITE_SOCKET_URL || 'http://localhost:3000';

// ─── Timer ────────────────────────────────────────────────────────────────────
function Timer({ startTime }) {
  const [elapsed, setElapsed] = useState(0);
  useEffect(() => {
    const start = new Date(startTime).getTime();
    const iv = setInterval(() => setElapsed(Math.floor((Date.now() - start) / 1000)), 1000);
    return () => clearInterval(iv);
  }, [startTime]);
  const h = Math.floor(elapsed / 3600);
  const m = Math.floor((elapsed % 3600) / 60);
  const s = elapsed % 60;
  return <span className="font-mono tabular-nums">{h > 0 ? `${h}:` : ''}{String(m).padStart(2,'0')}:{String(s).padStart(2,'0')}</span>;
}

// ─── Tooltip personalizado ────────────────────────────────────────────────────
function CustomTooltip({ active, payload, label }) {
  if (!active || !payload?.length) return null;
  return (
    <div className="bg-white dark:bg-gray-800 rounded-xl shadow-card border border-gray-100 dark:border-gray-700 px-3 py-2 text-xs">
      <p className="font-bold text-gray-700 dark:text-gray-200 mb-1">{label}</p>
      {payload.map((p, i) => (
        <p key={i} style={{ color: p.color }}>{p.name}: <strong>{p.value}</strong></p>
      ))}
    </div>
  );
}

export default function InstructorAsistencia() {
  const { showToast } = useToast();
  const [materias, setMaterias] = useState([]);
  const [selectedMateria, setSelectedMateria] = useState('');
  const [activeSession, setActiveSession] = useState(null);
  const [sessions, setSessions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [starting, setStarting] = useState(false);
  const [selectedFecha, setSelectedFecha] = useState(() => new Date().toISOString().split('T')[0]);
  const [facialScannerActive, setFacialScannerActive] = useState(false);
  const [qrActive, setQrActive] = useState(false);
  const [manualRegisterOpen, setManualRegisterOpen] = useState(false);
  const [selectedSessionDetail, setSelectedSessionDetail] = useState(null);
  const socketRef = useRef(null);

  // Estados para hardware
  const [comPort, setComPort] = useState('COM8');
  const [hardwareConnected, setHardwareConnected] = useState(false);

  // Estados para reconocimiento facial integrado
  const videoRef = useRef(null);
  const canvasRef = useRef(null);
  const streamRef = useRef(null);
  const loopRef = useRef(null);
  const busyRef = useRef(false);
  const registeredRef = useRef(new Set());
  const cooldownRef = useRef({});
  const [faceReady, setFaceReady] = useState(false);
  const [liveMatches, setLiveMatches] = useState([]);
  const [detectionCount, setDetectionCount] = useState(0);
  const liveTimer = useRef(null);

  // Estados para QR
  const [qrCode, setQrCode] = useState(null);
  const [qrTimeLeft, setQrTimeLeft] = useState(30);
  const qrTimerRef = useRef(null);

  const THRESHOLD = 0.50; // Más sensible
  const COOLDOWN_MS = 3000; // Reducido a 3 segundos

  useEffect(() => {
    fetchApi('/asistencias/my-active-any').then(activeData => {
      let activeSet = false;
      if (activeData.session) {
        setSelectedMateria(activeData.session.materiaId);
        setActiveSession(activeData.session);
        connectSocket(activeData.session.id);
        activeSet = true;
      }
      fetchApi('/materias/my-materias').then(d => {
        setMaterias(d.materias);
        if (d.materias.length > 0 && !activeSet && !selectedMateria) {
          setSelectedMateria(d.materias[0].id);
        }
      }).catch(console.error).finally(() => setLoading(false));
    });
  }, []);

  useEffect(() => {
    if (!selectedMateria) return;
    loadSessions();
    // Si ya recuperamos we don't duplicate
    if (!activeSession || activeSession.materiaId !== selectedMateria) {
      checkActiveSession();
    }
  }, [selectedMateria]);

  const loadSessions = async () => {
    try {
      const d = await fetchApi(`/asistencias/materia/${selectedMateria}`);
      setSessions(d.asistencias);
    } catch {}
  };

  const checkActiveSession = async () => {
    try {
      const d = await fetchApi(`/asistencias/materia/${selectedMateria}/active`);
      if (d.session) { setActiveSession(d.session); connectSocket(d.session.id); }
      else setActiveSession(null);
    } catch {}
  };

  const connectSocket = (sessionId) => {
    if (socketRef.current) socketRef.current.disconnect();
    const socket = io(API_BASE);
    console.log('[Socket] Conectando a sesión:', sessionId);
    socket.emit('joinSession', sessionId);
    
    socket.on('connect', () => {
      console.log('[Socket] Conectado, ID:', socket.id);
    });
    
    socket.on('nuevaAsistencia', (data) => {
      console.log('[Socket] Nueva asistencia recibida:', data);
      setActiveSession(prev => {
        if (!prev) return prev;
        if (prev.registros?.some(r => r.aprendizId === data.aprendizId)) {
          console.log('[Socket] Registro duplicado, ignorando');
          return prev;
        }
        showToast(`✓ ${data.aprendiz?.fullName || 'Aprendiz'} registrado`, 'success');
        return { ...prev, registros: [...(prev.registros || []), { ...data, id: data.id || Date.now() }] };
      });
    });

    socket.on('arduino_read_nfc', async (data) => {
      if (!sessionId) return;
      setActiveSession(prev => {
        if (!prev) return prev;
        const student = prev.materia?.ficha?.aprendices?.find(a => a.nfcUid === data.uid);
        if (student) {
          if (prev.registros?.some(r => r.aprendizId === student.id)) return prev;
          showToast(`Registrando asistencia de ${student.fullName}...`, 'success');
          return {
            ...prev,
            registros: [...(prev.registros || []), {
              id: 'temp-' + Date.now(),
              aprendizId: student.id,
              aprendiz: student,
              presente: true,
              metodo: 'nfc',
              timestamp: new Date().toISOString()
            }]
          };
        }
        return prev;
      });

      try {
        await fetchApi('/asistencias/hardware-register', {
          method: 'POST',
          body: JSON.stringify({ asistenciaId: sessionId, nfcUid: data.uid })
        });
      } catch (err) {
        showToast(err.message, 'error');
        // Opcional: Podríamos revertir la UI si falla en BD. Por simplicidad, se deja.
      }
    });

    socket.on('arduino_read_finger', async (data) => {
      if (!sessionId) return;
      setActiveSession(prev => {
        if (!prev) return prev;
        const student = prev.materia?.ficha?.aprendices?.find(a => a.huellas?.includes(data.id));
        if (student) {
          if (prev.registros?.some(r => r.aprendizId === student.id)) return prev;
          showToast(`Registrando asistencia de ${student.fullName}...`, 'success');
          return {
            ...prev,
            registros: [...(prev.registros || []), {
              id: 'temp-' + Date.now(),
              aprendizId: student.id,
              aprendiz: student,
              presente: true,
              metodo: 'huella',
              timestamp: new Date().toISOString()
            }]
          };
        }
        return prev;
      });

      try {
        await fetchApi('/asistencias/hardware-register', {
          method: 'POST',
          body: JSON.stringify({ asistenciaId: sessionId, huellaId: data.id })
        });
      } catch (err) {
        showToast(err.message, 'error');
      }
    });

    socket.on('sessionClosed', () => { setActiveSession(null); loadSessions(); });
    socketRef.current = socket;
  };

  useEffect(() => () => socketRef.current?.disconnect(), []);

  const startSession = async () => {
    setStarting(true);
    try {
      const d = await fetchApi('/asistencias', {
        method: 'POST',
        // Backend ya genera su propia fecha inquebrantable
        body: JSON.stringify({ materiaId: selectedMateria })
      });
      setActiveSession({ ...d.asistencia, registros: [] });
      connectSocket(d.asistencia.id);
      showToast('Sesión iniciada', 'success');
    } catch (err) { showToast(err.message, 'error'); }
    finally { setStarting(false); }
  };

  const endSession = async () => {
    try {
      await fetchApi(`/asistencias/${activeSession.id}/finalizar`, { method: 'PUT' });
      socketRef.current?.disconnect();
      stopFacialScanner();
      setActiveSession(null);
      loadSessions();
      showToast('Sesión finalizada correctamente', 'success');
    } catch (err) { showToast(err.message, 'error'); }
  };

  const exportSession = async (sessionId, fecha) => {
    try {
      const token = localStorage.getItem('token');
      const res = await fetch(`${API_BASE}/api/export/session/${sessionId}/asistencia`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error || 'Error al exportar');
      }
      const blob = await res.blob();
      const url  = URL.createObjectURL(blob);
      const a    = document.createElement('a');
      a.href     = url;
      a.download = `Arachiz_Asistencia_${fecha}.csv`;
      a.click();
      URL.revokeObjectURL(url);
    } catch (err) {
      showToast(err.message, 'error');
    }
  };

  // ─── Datos para gráficas ───────────────────────────────────────────────────
  const closedSessions = sessions.filter(s => !s.activa);

  const barData = closedSessions.slice(0, 8).reverse().map((s, i) => ({
    name: s.fecha,
    Presentes: s.registros?.filter(r => r.presente).length || 0,
    Ausentes: s.registros?.filter(r => !r.presente).length || 0,
  }));

  const totalPresentes = closedSessions.reduce((acc, s) => acc + (s.registros?.filter(r => r.presente).length || 0), 0);
  const totalAusentes  = closedSessions.reduce((acc, s) => acc + (s.registros?.filter(r => !r.presente).length || 0), 0);
  const pieData = [
    { name: 'Presentes', value: totalPresentes, color: '#34A853' },
    { name: 'Ausentes',  value: totalAusentes,  color: '#EA4335' },
  ];

  const totalAprendices = activeSession?.materia?.ficha?.aprendices?.length || 0;
  const presentes = activeSession?.registros?.filter(r => r.presente !== false).length || 0;
  const pendientes = totalAprendices - presentes;
  const porcentajeCompletado = totalAprendices > 0 ? Math.round((presentes / totalAprendices) * 100) : 0;

  // ─── Funciones de reconocimiento facial integrado ─────────────────────────
  const startFacialScanner = async () => {
    if (facialScannerActive) {
      stopFacialScanner();
      return;
    }
    
    setFacialScannerActive(true);
    registeredRef.current = new Set((activeSession.registros || []).map(r => r.aprendizId));
    
    try {
      await loadFaceModels();
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: 'user', width: { ideal: 1280 }, height: { ideal: 720 } }
      });
      streamRef.current = stream;
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        await videoRef.current.play();
      }
      setFaceReady(true);
      startFaceLoop();
      showToast('🎥 Reconocimiento facial activado', 'success');
    } catch (err) {
      showToast('Error al iniciar cámara: ' + err.message, 'error');
      setFacialScannerActive(false);
    }
  };

  const stopFacialScanner = () => {
    if (loopRef.current) clearTimeout(loopRef.current);
    if (liveTimer.current) clearTimeout(liveTimer.current);
    if (streamRef.current) streamRef.current.getTracks().forEach(t => t.stop());
    setFacialScannerActive(false);
    setFaceReady(false);
    setLiveMatches([]);
    setDetectionCount(0);
  };

  const startFaceLoop = () => {
    const OPTIONS = new faceapi.TinyFaceDetectorOptions({ inputSize: 224, scoreThreshold: 0.5 });
    const candidates = (activeSession?.materia?.ficha?.aprendices || [])
      .filter(a => a.faceDescriptor?.length === 128)
      .map(a => ({ ...a, descriptor: arrayToDescriptor(a.faceDescriptor) }));

    const tick = async () => {
      if (!videoRef.current || videoRef.current.readyState < 2 || busyRef.current) {
        loopRef.current = setTimeout(tick, 100);
        return;
      }
      busyRef.current = true;

      try {
        const detections = await faceapi
          .detectAllFaces(videoRef.current, OPTIONS)
          .withFaceLandmarks(true)
          .withFaceDescriptors();

        setDetectionCount(prev => prev + 1);

        if (!detections || detections.length === 0) {
          setLiveMatches([]);
        } else {
          const now = Date.now();
          const matched = [];
          const toRegister = [];

          // Dibujar en canvas
          if (canvasRef.current && videoRef.current) {
            const displaySize = { 
              width: videoRef.current.offsetWidth, 
              height: videoRef.current.offsetHeight 
            };
            faceapi.matchDimensions(canvasRef.current, displaySize);
            const resizedDetections = faceapi.resizeResults(detections, displaySize);
            const ctx = canvasRef.current.getContext('2d');
            ctx.clearRect(0, 0, canvasRef.current.width, canvasRef.current.height);
          }

          for (const det of detections) {
            let best = null, bestDist = Infinity;
            for (const c of candidates) {
              const d = faceDistance(det.descriptor, c.descriptor);
              if (d < bestDist) { bestDist = d; best = c; }
            }
            if (best && bestDist < THRESHOLD) {
              const alreadyDone = registeredRef.current.has(best.id);
              const onCooldown = (now - (cooldownRef.current[best.id] || 0)) < COOLDOWN_MS;
              matched.push({ 
                id: best.id, 
                name: best.fullName, 
                isNew: !alreadyDone && !onCooldown,
                confidence: Math.round((1 - bestDist) * 100),
                box: det.detection.box
              });
              if (!alreadyDone && !onCooldown) {
                cooldownRef.current[best.id] = now;
                toRegister.push(best);
              }
            }
          }

          setLiveMatches(matched);
          if (liveTimer.current) clearTimeout(liveTimer.current);
          liveTimer.current = setTimeout(() => setLiveMatches([]), 2000);

          if (toRegister.length > 0) {
            Promise.all(toRegister.map(saveFacialAttendance)).then(results => {
              const saved = results.filter(Boolean);
              if (saved.length > 0) {
                saved.forEach(a => {
                  registeredRef.current.add(a.id);
                  setActiveSession(prev => {
                    if (!prev) return prev;
                    if (prev.registros?.some(r => r.aprendizId === a.id)) return prev;
                    return {
                      ...prev,
                      registros: [...(prev.registros || []), {
                        id: 'facial-' + Date.now(),
                        aprendizId: a.id,
                        aprendiz: { fullName: a.fullName },
                        presente: true,
                        metodo: 'facial',
                        timestamp: new Date().toISOString()
                      }]
                    };
                  });
                  showToast(`✅ ${a.fullName} registrado por reconocimiento facial`, 'success');
                });
              }
            });
          }
        }
      } catch (_) {}

      busyRef.current = false;
      loopRef.current = setTimeout(tick, 200); // Más rápido
    };

    loopRef.current = setTimeout(tick, 300);
  };

  const saveFacialAttendance = async (aprendiz) => {
    try {
      await fetchApi('/asistencias/facial-register', {
        method: 'POST',
        body: JSON.stringify({ asistenciaId: activeSession.id, aprendizId: aprendiz.id })
      });
      return aprendiz;
    } catch (err) {
      if (err.message?.includes('ya registró')) registeredRef.current.add(aprendiz.id);
      return null;
    }
  };

  // ─── Funciones de QR ───────────────────────────────────────────────────────
  const generateQR = async () => {
    try {
      const data = await fetchApi('/qr/generate', {
        method: 'POST',
        body: JSON.stringify({ asistenciaId: activeSession.id })
      });
      
      setQrCode(data.code);
      setQrTimeLeft(30);
      
      if (qrTimerRef.current) clearInterval(qrTimerRef.current);
      qrTimerRef.current = setInterval(() => {
        setQrTimeLeft(prev => {
          if (prev <= 1) {
            clearInterval(qrTimerRef.current);
            generateQR();
            return 30;
          }
          return prev - 1;
        });
      }, 1000);
    } catch (error) {
      showToast(error.message, 'error');
    }
  };

  const toggleQR = () => {
    if (!qrActive) {
      setQrActive(true);
      generateQR();
    } else {
      setQrActive(false);
      if (qrTimerRef.current) clearInterval(qrTimerRef.current);
    }
  };

  // ─── Registro Manual ───────────────────────────────────────────────────────
  const [selectedAprendiz, setSelectedAprendiz] = useState('');
  
  const registerManual = async () => {
    if (!selectedAprendiz) return;
    try {
      await fetchApi('/asistencias/manual-register', {
        method: 'POST',
        body: JSON.stringify({ 
          asistenciaId: activeSession.id, 
          aprendizId: selectedAprendiz 
        })
      });
      
      const aprendiz = activeSession.materia?.ficha?.aprendices?.find(a => a.id === selectedAprendiz);
      setActiveSession(prev => ({
        ...prev,
        registros: [...(prev.registros || []), {
          id: 'manual-' + Date.now(),
          aprendizId: selectedAprendiz,
          aprendiz: { fullName: aprendiz?.fullName },
          presente: true,
          metodo: 'manual',
          timestamp: new Date().toISOString()
        }]
      }));
      
      showToast(`✅ ${aprendiz?.fullName} registrado manualmente`, 'success');
      setManualRegisterOpen(false);
      setSelectedAprendiz('');
    } catch (err) {
      showToast(err.message, 'error');
    }
  };

  return (
    <div className="animate-fade-in space-y-5">
      <PageHeader title="Asistencia" subtitle={activeSession ? "Sesión activa" : "Control de asistencia"} />

      {/* Selector de materia y botón */}
      <div className="card dark:bg-gray-900 dark:border-gray-800 transition-all duration-300 hover:shadow-lg">
        <div className="flex flex-col sm:flex-row gap-4 items-end">
          <div className="flex-1">
            <label className="block text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wide mb-2">
              Materia
            </label>
            <select 
              className="w-full px-4 py-3 rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-900 dark:text-white text-sm focus:outline-none focus:ring-2 focus:ring-[#4285F4] transition-all"
              value={selectedMateria}
              onChange={e => setSelectedMateria(e.target.value)}
              disabled={!!activeSession || materias.length === 0}>
              {materias.length === 0
                ? <option>Sin materias disponibles</option>
                : materias.map(m => <option key={m.id} value={m.id}>{m.nombre} – Ficha {m.ficha?.numero}</option>)
              }
            </select>
          </div>
          <div>
            {!activeSession ? (
              <button 
                onClick={startSession} 
                disabled={!selectedMateria || starting} 
                className="px-6 py-3 rounded-xl bg-[#34A853] text-white text-sm font-semibold hover:bg-green-600 transition-all shadow-sm disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2 transform hover:scale-105">
                <Play size={16}/> {starting ? 'Iniciando...' : 'Iniciar Sesión'}
              </button>
            ) : (
              <button 
                onClick={endSession} 
                className="px-6 py-3 rounded-xl bg-[#EA4335] text-white text-sm font-semibold hover:bg-red-600 transition-all shadow-sm flex items-center gap-2 transform hover:scale-105">
                <Square size={16}/> Finalizar Sesión
              </button>
            )}
          </div>
        </div>
      </div>

      {activeSession && (
        <>
          {/* Estadísticas principales */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
            {[
              { label: 'Total', value: totalAprendices, icon: Users, color: 'gray', bg: 'bg-gray-50', border: 'border-l-gray-400', text: 'text-gray-700' },
              { label: 'Presentes', value: presentes, icon: CheckCircle, color: 'green', bg: 'bg-green-50', border: 'border-l-[#34A853]', text: 'text-[#34A853]' },
              { label: 'Ausentes', value: pendientes, icon: Clock, color: 'yellow', bg: 'bg-yellow-50', border: 'border-l-[#FBBC05]', text: 'text-[#FBBC05]' },
              { label: 'Completado', value: `${porcentajeCompletado}%`, icon: TrendingUp, color: 'blue', bg: 'bg-blue-50', border: 'border-l-[#4285F4]', text: 'text-[#4285F4]' },
            ].map((stat, i) => (
              <div key={stat.label} 
                className={`card-sm ${stat.bg} dark:bg-${stat.color}-900/20 text-center border-l-4 ${stat.border} transition-all duration-300 hover:shadow-md transform hover:-translate-y-1`}
                style={{ animationDelay: `${i * 100}ms` }}>
                <div className="flex items-center justify-center gap-2 mb-1">
                  <stat.icon size={16} className={stat.text} />
                </div>
                <p className={`text-3xl font-bold ${stat.text} dark:text-gray-300`}>{stat.value}</p>
                <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">{stat.label}</p>
              </div>
            ))}
          </div>

          {/* Layout principal: Reconocimiento facial + Registrados */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
            {/* Reconocimiento Facial - 2 columnas */}
            <div className="lg:col-span-2 card dark:bg-gray-900 dark:border-gray-800 transition-all duration-300">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-2">
                  <Camera size={18} className="text-[#4285F4]" />
                  <h3 className="text-sm font-semibold text-gray-700 dark:text-gray-300">Reconocimiento Facial</h3>
                </div>
                <button 
                  onClick={startFacialScanner}
                  className={`px-4 py-2 rounded-xl text-white text-sm font-semibold transition-all shadow-sm flex items-center gap-2 transform hover:scale-105 ${
                    facialScannerActive 
                      ? 'bg-[#EA4335] hover:bg-red-600' 
                      : 'bg-[#34A853] hover:bg-green-600'
                  }`}>
                  {facialScannerActive ? <><X size={14}/> Detener</> : <><ScanFace size={14}/> Iniciar Escáner</>}
                </button>
              </div>

              {facialScannerActive ? (
                <div className="relative rounded-2xl overflow-hidden bg-gradient-to-br from-gray-900 to-black shadow-2xl" style={{ aspectRatio: '16/9', maxHeight: 450 }}>
                  <video 
                    ref={videoRef} 
                    muted 
                    playsInline 
                    className="w-full h-full object-cover"
                    style={{ transform: 'scaleX(-1)' }} 
                  />
                  <canvas 
                    ref={canvasRef}
                    className="absolute inset-0 w-full h-full"
                    style={{ transform: 'scaleX(-1)' }}
                  />

                  {/* Overlay de detección mejorado */}
                  {liveMatches.length > 0 && liveMatches.map((m, i) => (
                    <div 
                      key={m.id} 
                      className="absolute animate-fade-in"
                      style={{
                        left: '50%',
                        top: '50%',
                        transform: 'translate(-50%, -50%)',
                      }}>
                      <div className={`relative p-6 rounded-2xl backdrop-blur-md ${
                        m.isNew 
                          ? 'bg-gradient-to-br from-green-500/90 to-emerald-600/90 shadow-lg shadow-green-500/50' 
                          : 'bg-gradient-to-br from-blue-500/90 to-indigo-600/90 shadow-lg shadow-blue-500/50'
                      } animate-scale-in`}>
                        <div className="flex items-center gap-4">
                          <div className={`w-16 h-16 rounded-full flex items-center justify-center text-white font-bold text-2xl ${
                            m.isNew ? 'bg-white/20' : 'bg-white/20'
                          } animate-pulse`}>
                            {m.name.charAt(0).toUpperCase()}
                          </div>
                          <div>
                            <p className="text-white font-bold text-xl mb-1">{m.name}</p>
                            <div className="flex items-center gap-2">
                              <div className="flex items-center gap-1">
                                <Activity size={14} className="text-white/80" />
                                <span className="text-white/90 text-sm font-medium">{m.confidence}% confianza</span>
                              </div>
                              {m.isNew && (
                                <span className="px-2 py-0.5 rounded-full bg-white/30 text-white text-xs font-bold flex items-center gap-1">
                                  <Zap size={10} /> NUEVO
                                </span>
                              )}
                            </div>
                          </div>
                          <CheckCircle size={32} className="text-white animate-bounce" />
                        </div>
                      </div>
                    </div>
                  ))}

                  {/* Guías de esquinas animadas */}
                  {faceReady && liveMatches.length === 0 && (
                    <>
                      {[
                        { pos: 'top-6 left-6', corners: 'border-t-4 border-l-4', round: 'rounded-tl-2xl' },
                        { pos: 'top-6 right-6', corners: 'border-t-4 border-r-4', round: 'rounded-tr-2xl' },
                        { pos: 'bottom-6 left-6', corners: 'border-b-4 border-l-4', round: 'rounded-bl-2xl' },
                        { pos: 'bottom-6 right-6', corners: 'border-b-4 border-r-4', round: 'rounded-br-2xl' },
                      ].map((guide, i) => (
                        <div 
                          key={i}
                          className={`absolute ${guide.pos} w-12 h-12 ${guide.corners} ${guide.round} border-cyan-400 animate-pulse`}
                          style={{ animationDelay: `${i * 150}ms` }}
                        />
                      ))}
                      <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/80 via-black/40 to-transparent p-6">
                        <div className="flex items-center justify-center gap-3 text-white">
                          <Eye size={20} className="animate-pulse" />
                          <p className="text-sm font-medium">Buscando rostros... {detectionCount} detecciones</p>
                        </div>
                      </div>
                    </>
                  )}

                  {/* Indicador de estado */}
                  <div className="absolute top-4 right-4 flex items-center gap-2 bg-black/60 backdrop-blur-sm px-4 py-2 rounded-full">
                    <div className="w-2 h-2 rounded-full bg-red-500 animate-pulse" />
                    <span className="text-white text-xs font-semibold">EN VIVO</span>
                  </div>
                </div>
              ) : (
                <div className="flex items-center justify-center bg-gradient-to-br from-gray-100 to-gray-200 dark:from-gray-800 dark:to-gray-900 rounded-2xl border-2 border-dashed border-gray-300 dark:border-gray-700" style={{ aspectRatio: '16/9', maxHeight: 450 }}>
                  <div className="text-center">
                    <div className="relative inline-block mb-4">
                      <Camera size={64} className="text-gray-400 opacity-50" />
                      <div className="absolute -top-1 -right-1 w-6 h-6 bg-[#34A853] rounded-full flex items-center justify-center">
                        <Play size={14} className="text-white ml-0.5" />
                      </div>
                    </div>
                    <p className="text-sm font-medium text-gray-600 dark:text-gray-400 mb-1">Reconocimiento Facial Desactivado</p>
                    <p className="text-xs text-gray-500 dark:text-gray-500">Haz clic en "Iniciar Escáner" para comenzar</p>
                  </div>
                </div>
              )}

              {/* Botones de acción */}
              <div className="mt-4 grid grid-cols-2 gap-3">
                <button 
                  onClick={toggleQR}
                  className={`px-4 py-3 rounded-xl text-white text-sm font-semibold transition-all shadow-sm flex items-center justify-center gap-2 transform hover:scale-105 ${
                    qrActive 
                      ? 'bg-gradient-to-r from-yellow-500 to-orange-500 hover:from-yellow-600 hover:to-orange-600' 
                      : 'bg-gradient-to-r from-[#FBBC05] to-yellow-500 hover:from-yellow-500 hover:to-yellow-600'
                  }`}>
                  <QrCode size={16}/> {qrActive ? 'Ocultar QR' : 'Mostrar QR'}
                </button>
                <button 
                  onClick={() => setManualRegisterOpen(true)}
                  className="px-4 py-3 rounded-xl bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600 text-white text-sm font-semibold transition-all shadow-sm flex items-center justify-center gap-2 transform hover:scale-105">
                  <UserPlus size={16}/> Registro Manual
                </button>
              </div>
            </div>

            {/* Registrados - 1 columna */}
            <div className="card dark:bg-gray-900 dark:border-gray-800 transition-all duration-300">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-sm font-semibold text-[#34A853]">✓ Registrados</h3>
                <span className="px-3 py-1 rounded-full bg-[#34A853] text-white text-xs font-bold">{presentes}</span>
              </div>
              {presentes === 0 ? (
                <div className="text-center py-12 text-gray-400 border-2 border-dashed border-gray-200 dark:border-gray-700 rounded-xl">
                  <Users size={32} className="mx-auto mb-2 opacity-30"/>
                  <p className="text-sm">Esperando registros...</p>
                </div>
              ) : (
                <div className="space-y-2 max-h-[500px] overflow-y-auto pr-2 custom-scrollbar">
                  {activeSession.registros?.filter(r => r.presente !== false).map((reg, i) => (
                    <div 
                      key={reg.id || i} 
                      className="flex items-center gap-3 p-3 bg-green-50 dark:bg-green-900/20 rounded-xl border border-green-100 dark:border-green-800 transition-all duration-300 hover:shadow-md transform hover:-translate-y-0.5"
                      style={{ animation: `slideIn 0.3s ease-out ${i * 50}ms` }}>
                      <div className="w-10 h-10 rounded-full bg-[#34A853] flex items-center justify-center text-white font-bold text-sm shadow-md">
                        {(reg.aprendiz?.fullName || reg.fullName || 'A').charAt(0).toUpperCase()}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-semibold text-gray-800 dark:text-gray-200 truncate">
                          {reg.aprendiz?.fullName || reg.fullName || 'Aprendiz'}
                        </p>
                        <p className="text-xs text-gray-500 dark:text-gray-400">
                          {reg.metodo || 'manual'} • {new Date(reg.timestamp).toLocaleTimeString('es', { hour: '2-digit', minute: '2-digit' })}
                        </p>
                      </div>
                      <CheckCircle size={18} className="text-[#34A853] shrink-0"/>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </>
      )}

      {/* Historial de Sesiones - Simplificado */}
      {closedSessions.length > 0 && (
        <div className="card dark:bg-gray-900 dark:border-gray-800 transition-all duration-300">
          <h2 className="font-bold text-gray-900 dark:text-white mb-4">Historial de Sesiones</h2>
          
          <div className="space-y-3">
            {closedSessions.slice(0, 5).map((s, idx) => {
              const p = s.registros?.filter(r => r.presente).length || 0;
              const t = s.registros?.length || 0;
              const pct = t > 0 ? Math.round((p / t) * 100) : 0;
              
              return (
                <div 
                  key={s.id} 
                  className="bg-gray-50 dark:bg-gray-800 rounded-xl p-4 transition-all duration-300 hover:shadow-md transform hover:-translate-y-0.5 cursor-pointer"
                  style={{ animation: `slideIn 0.3s ease-out ${idx * 100}ms` }}
                  onClick={() => setSelectedSessionDetail(s)}>
                  <div className="flex items-center justify-between mb-3">
                    <div>
                      <p className="text-sm font-semibold text-gray-800 dark:text-gray-200">{s.fecha}</p>
                      <p className="text-xs text-gray-400">{s.materia?.nombre}</p>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className={`px-3 py-1 rounded-full text-xs font-semibold ${
                        pct >= 90 ? 'bg-green-100 text-[#34A853]' :
                        pct >= 70 ? 'bg-yellow-100 text-[#FBBC05]' :
                        'bg-red-100 text-[#EA4335]'
                      }`}>
                        {pct}%
                      </span>
                      <button 
                        onClick={(e) => { e.stopPropagation(); exportSession(s.id, s.fecha); }} 
                        className="p-2 hover:bg-gray-200 dark:hover:bg-gray-700 rounded-lg transition-all transform hover:scale-110" 
                        title="Exportar">
                        <Download size={14} className="text-[#34A853]"/>
                      </button>
                    </div>
                  </div>
                  
                  <div className="flex items-center gap-4 text-xs mb-2">
                    <span className="text-gray-600 dark:text-gray-400">
                      <strong className="text-gray-800 dark:text-gray-200">{p}</strong> presentes
                    </span>
                    <span className="text-gray-600 dark:text-gray-400">
                      <strong className="text-gray-800 dark:text-gray-200">{t - p}</strong> ausentes
                    </span>
                  </div>

                  <div className="w-full h-2 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
                    <div 
                      className="h-full bg-[#34A853] rounded-full transition-all duration-500"
                      style={{ width: `${pct}%` }}
                    />
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Modal QR */}
      {qrActive && activeSession && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4 animate-fade-in">
          <div className="bg-white dark:bg-gray-900 rounded-2xl shadow-2xl max-w-md w-full p-6 animate-scale-in">
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-[#FBBC05] to-yellow-600 flex items-center justify-center shadow-lg">
                  <QrCode size={24} className="text-white" />
                </div>
                <div>
                  <h2 className="font-bold text-gray-900 dark:text-white">Código QR</h2>
                  <p className="text-xs text-gray-400">Escanea para registrar</p>
                </div>
              </div>
              <button onClick={() => setQrActive(false)} className="btn-icon hover:bg-gray-100 dark:hover:bg-gray-800">
                <X size={18} />
              </button>
            </div>

            {qrCode && (
              <>
                <div className="relative bg-white p-6 rounded-2xl border-4 border-[#FBBC05] mb-4 shadow-lg">
                  <img 
                    src={`https://api.qrserver.com/v1/create-qr-code/?size=300x300&data=${encodeURIComponent(`${window.location.origin}/scan-qr?code=${qrCode}`)}`}
                    alt="QR Code"
                    className="w-full h-auto"
                  />
                  <div className="absolute top-3 right-3 bg-[#FBBC05] text-white px-3 py-1.5 rounded-lg flex items-center gap-2 shadow-lg animate-pulse">
                    <Clock size={14} />
                    <span className="font-mono font-bold text-sm">{qrTimeLeft}s</span>
                  </div>
                </div>

                <div className="bg-yellow-50 dark:bg-yellow-900/20 rounded-xl p-4 mb-4">
                  <p className="text-sm text-gray-700 dark:text-gray-300 font-medium mb-2">
                    📱 Instrucciones:
                  </p>
                  <ol className="text-xs text-gray-600 dark:text-gray-400 space-y-1 list-decimal list-inside">
                    <li>Abre Arachiz en tu celular</li>
                    <li>Ve a Asistencia → "Escanear QR"</li>
                    <li>Apunta la cámara al código</li>
                  </ol>
                </div>

                <button 
                  onClick={generateQR}
                  className="w-full btn-primary flex items-center justify-center gap-2">
                  <RefreshCw size={16} />
                  Generar nuevo código
                </button>
              </>
            )}
          </div>
        </div>
      )}

      {/* Modal Registro Manual */}
      {manualRegisterOpen && activeSession && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4 animate-fade-in">
          <div className="bg-white dark:bg-gray-900 rounded-2xl shadow-2xl max-w-md w-full p-6 animate-scale-in">
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center shadow-lg">
                  <UserPlus size={24} className="text-white" />
                </div>
                <div>
                  <h2 className="font-bold text-gray-900 dark:text-white">Registro Manual</h2>
                  <p className="text-xs text-gray-400">Selecciona un aprendiz</p>
                </div>
              </div>
              <button onClick={() => setManualRegisterOpen(false)} className="btn-icon hover:bg-gray-100 dark:hover:bg-gray-800">
                <X size={18} />
              </button>
            </div>

            <div className="mb-4">
              <label className="input-label">Aprendiz</label>
              <select 
                className="input-field"
                value={selectedAprendiz}
                onChange={e => setSelectedAprendiz(e.target.value)}>
                <option value="">Selecciona un aprendiz...</option>
                {activeSession.materia?.ficha?.aprendices
                  ?.filter(a => !activeSession.registros?.some(r => r.aprendizId === a.id))
                  .map(a => (
                    <option key={a.id} value={a.id}>{a.fullName}</option>
                  ))}
              </select>
            </div>

            <button 
              onClick={registerManual}
              disabled={!selectedAprendiz}
              className="w-full btn-primary flex items-center justify-center gap-2">
              <CheckCircle size={16} />
              Registrar Asistencia
            </button>
          </div>
        </div>
      )}

      {/* Modal Detalle de Sesión */}
      {selectedSessionDetail && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4 animate-fade-in" onClick={() => setSelectedSessionDetail(null)}>
          <div className="bg-white dark:bg-gray-900 rounded-2xl shadow-2xl max-w-4xl w-full p-6 animate-scale-in max-h-[90vh] overflow-y-auto" onClick={e => e.stopPropagation()}>
            <div className="flex items-center justify-between mb-6">
              <div>
                <h2 className="font-bold text-gray-900 dark:text-white text-xl">Detalle de Sesión</h2>
                <p className="text-sm text-gray-400">{selectedSessionDetail.fecha} • {selectedSessionDetail.materia?.nombre}</p>
              </div>
              <button onClick={() => setSelectedSessionDetail(null)} className="btn-icon hover:bg-gray-100 dark:hover:bg-gray-800">
                <X size={20} />
              </button>
            </div>

            {/* Estadísticas */}
            <div className="grid grid-cols-3 gap-4 mb-6">
              {[
                { label: 'Total', value: selectedSessionDetail.registros?.length || 0, color: 'gray', icon: Users },
                { label: 'Presentes', value: selectedSessionDetail.registros?.filter(r => r.presente).length || 0, color: 'green', icon: CheckCircle },
                { label: 'Ausentes', value: selectedSessionDetail.registros?.filter(r => !r.presente).length || 0, color: 'red', icon: X },
              ].map(stat => (
                <div key={stat.label} className={`bg-${stat.color}-50 dark:bg-${stat.color}-900/20 rounded-xl p-4 text-center`}>
                  <stat.icon size={24} className={`mx-auto mb-2 text-${stat.color}-600`} />
                  <p className={`text-2xl font-bold text-${stat.color}-600`}>{stat.value}</p>
                  <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">{stat.label}</p>
                </div>
              ))}
            </div>

            {/* Listas */}
            <div className="grid grid-cols-2 gap-4">
              <div>
                <h3 className="font-semibold text-gray-900 dark:text-white mb-3 flex items-center gap-2">
                  <CheckCircle size={16} className="text-[#34A853]" />
                  Presentes ({selectedSessionDetail.registros?.filter(r => r.presente).length || 0})
                </h3>
                <div className="space-y-2 max-h-96 overflow-y-auto custom-scrollbar">
                  {selectedSessionDetail.registros?.filter(r => r.presente).map((reg, i) => (
                    <div key={i} className="bg-green-50 dark:bg-green-900/20 rounded-lg p-3 flex items-center gap-3">
                      <div className="w-8 h-8 rounded-full bg-[#34A853] flex items-center justify-center text-white font-bold text-xs">
                        {reg.aprendiz?.fullName?.charAt(0) || 'A'}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-gray-800 dark:text-gray-200 truncate">
                          {reg.aprendiz?.fullName || 'Aprendiz'}
                        </p>
                        <p className="text-xs text-gray-500">{reg.metodo || 'manual'}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              <div>
                <h3 className="font-semibold text-gray-900 dark:text-white mb-3 flex items-center gap-2">
                  <X size={16} className="text-[#EA4335]" />
                  Ausentes ({selectedSessionDetail.registros?.filter(r => !r.presente).length || 0})
                </h3>
                <div className="space-y-2 max-h-96 overflow-y-auto custom-scrollbar">
                  {selectedSessionDetail.registros?.filter(r => !r.presente).map((reg, i) => (
                    <div key={i} className="bg-red-50 dark:bg-red-900/20 rounded-lg p-3 flex items-center gap-3">
                      <div className="w-8 h-8 rounded-full bg-[#EA4335] flex items-center justify-center text-white font-bold text-xs">
                        {reg.aprendiz?.fullName?.charAt(0) || 'A'}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-gray-800 dark:text-gray-200 truncate">
                          {reg.aprendiz?.fullName || 'Aprendiz'}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
