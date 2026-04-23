import React, { useState, useEffect, useRef } from 'react';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell, PieChart, Pie, Legend
} from 'recharts';
import fetchApi from '../../services/api';
import PageHeader from '../../components/PageHeader';
import EmptyState from '../../components/EmptyState';
import { useToast } from '../../context/ToastContext';
import { Play, Square, Users, CheckCircle, Clock, BookOpen, BarChart2, Download, ScanFace, QrCode, Fingerprint, Wifi, RefreshCw, TrendingUp, Award, X, Camera } from 'lucide-react';
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
  const [selectedSessionDetail, setSelectedSessionDetail] = useState(null);
  const socketRef = useRef(null);

  // Estados para hardware
  const [comPort, setComPort] = useState('COM8');
  const [hardwareConnected, setHardwareConnected] = useState(false);

  // Estados para reconocimiento facial integrado
  const videoRef = useRef(null);
  const streamRef = useRef(null);
  const loopRef = useRef(null);
  const busyRef = useRef(false);
  const registeredRef = useRef(new Set());
  const cooldownRef = useRef({});
  const [faceReady, setFaceReady] = useState(false);
  const [liveMatches, setLiveMatches] = useState([]);
  const liveTimer = useRef(null);

  const THRESHOLD = 0.55;
  const COOLDOWN_MS = 5000;

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
        video: { facingMode: 'user', width: { ideal: 640 }, height: { ideal: 480 } }
      });
      streamRef.current = stream;
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        await videoRef.current.play();
      }
      setFaceReady(true);
      startFaceLoop();
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
  };

  const startFaceLoop = () => {
    const OPTIONS = new faceapi.TinyFaceDetectorOptions({ inputSize: 160, scoreThreshold: 0.4 });
    const candidates = (activeSession?.materia?.ficha?.aprendices || [])
      .filter(a => a.faceDescriptor?.length === 128)
      .map(a => ({ ...a, descriptor: arrayToDescriptor(a.faceDescriptor) }));

    const tick = async () => {
      if (!videoRef.current || videoRef.current.readyState < 2 || busyRef.current) {
        loopRef.current = setTimeout(tick, 80);
        return;
      }
      busyRef.current = true;

      try {
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
              matched.push({ 
                id: best.id, 
                name: best.fullName, 
                isNew: !alreadyDone && !onCooldown,
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
          liveTimer.current = setTimeout(() => setLiveMatches([]), 1500);

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
                  showToast(`✓ ${a.fullName} registrado`, 'success');
                });
              }
            });
          }
        }
      } catch (_) {}

      busyRef.current = false;
      loopRef.current = setTimeout(tick, 350);
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
                <div className="relative rounded-xl overflow-hidden bg-black" style={{ aspectRatio: '4/3', maxHeight: 400 }}>
                  <video 
                    ref={videoRef} 
                    muted 
                    playsInline 
                    className="w-full h-full object-cover"
                    style={{ transform: 'scaleX(-1)' }} 
                  />

                  {/* Overlay de detección */}
                  {liveMatches.length > 0 && (
                    <div className="absolute inset-0">
                      {liveMatches.map((m, i) => (
                        <div key={m.id} className="absolute" style={{
                          left: `${(m.box?.x / videoRef.current?.videoWidth) * 100}%`,
                          top: `${(m.box?.y / videoRef.current?.videoHeight) * 100}%`,
                          width: `${(m.box?.width / videoRef.current?.videoWidth) * 100}%`,
                          height: `${(m.box?.height / videoRef.current?.videoHeight) * 100}%`,
                        }}>
                          <div className={`w-full h-full border-4 rounded-lg ${m.isNew ? 'border-[#34A853]' : 'border-[#4285F4]'} animate-pulse`}>
                            <div className={`absolute -bottom-8 left-0 right-0 ${m.isNew ? 'bg-[#34A853]' : 'bg-[#4285F4]'} text-white px-2 py-1 rounded text-xs font-bold text-center`}>
                              {m.name}
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}

                  {/* Guías de esquinas */}
                  {faceReady && liveMatches.length === 0 && (
                    <>
                      <div className="absolute top-4 left-4 w-8 h-8 border-t-2 border-l-2 border-white/50 rounded-tl animate-pulse" />
                      <div className="absolute top-4 right-4 w-8 h-8 border-t-2 border-r-2 border-white/50 rounded-tr animate-pulse" />
                      <div className="absolute bottom-4 left-4 w-8 h-8 border-b-2 border-l-2 border-white/50 rounded-bl animate-pulse" />
                      <div className="absolute bottom-4 right-4 w-8 h-8 border-b-2 border-r-2 border-white/50 rounded-br animate-pulse" />
                      <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/70 to-transparent p-4">
                        <p className="text-white text-center text-sm">Posiciona tu rostro dentro del marco</p>
                      </div>
                    </>
                  )}
                </div>
              ) : (
                <div className="flex items-center justify-center bg-gray-100 dark:bg-gray-800 rounded-xl" style={{ aspectRatio: '4/3', maxHeight: 400 }}>
                  <div className="text-center">
                    <Camera size={48} className="mx-auto mb-3 text-gray-400 opacity-50" />
                    <p className="text-sm text-gray-500 dark:text-gray-400">Haz clic en "Iniciar Escáner" para comenzar</p>
                  </div>
                </div>
              )}

              {/* Botones adicionales */}
              <div className="mt-4 flex gap-2">
                <button 
                  onClick={() => setQrActive(!qrActive)}
                  className="flex-1 px-4 py-2.5 rounded-xl bg-[#FBBC05] text-white text-sm font-semibold hover:bg-yellow-600 transition-all shadow-sm flex items-center justify-center gap-2 transform hover:scale-105">
                  <QrCode size={14}/> Código QR
                </button>
                <button 
                  onClick={() => exportSession(activeSession.id, activeSession.fecha)}
                  className="flex-1 px-4 py-2.5 rounded-xl bg-[#4285F4] text-white text-sm font-semibold hover:bg-blue-600 transition-all shadow-sm flex items-center justify-center gap-2 transform hover:scale-105">
                  <Download size={14}/> Exportar
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
                  className="bg-gray-50 dark:bg-gray-800 rounded-xl p-4 transition-all duration-300 hover:shadow-md transform hover:-translate-y-0.5"
                  style={{ animation: `slideIn 0.3s ease-out ${idx * 100}ms` }}>
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
                        onClick={() => exportSession(s.id, s.fecha)} 
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
    </div>
  );
}
