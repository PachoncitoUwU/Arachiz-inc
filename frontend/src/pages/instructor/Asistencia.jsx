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
  const [comPort, setComPort] = useState('');
  const [hardwareConnected, setHardwareConnected] = useState(false);
  const [connecting, setConnecting] = useState(false);
  const [availablePorts, setAvailablePorts] = useState([]);

  // Estados para registro manual
  const [registering, setRegistering] = useState(new Set());

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
  const [lastDetectedName, setLastDetectedName] = useState('');
  const [detectionCount, setDetectionCount] = useState(0);
  const liveTimer = useRef(null);

  // Estados para QR
  const [qrCode, setQrCode] = useState(null);
  const [qrTimeLeft, setQrTimeLeft] = useState(30);
  const qrTimerRef = useRef(null);

  const THRESHOLD = 0.45; // Más sensible para mejor detección
  const COOLDOWN_MS = 2000; // Reducido a 2 segundos

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
        video: { 
          facingMode: 'user', 
          width: { ideal: 1920 }, 
          height: { ideal: 1080 },
          frameRate: { ideal: 30 }
        }
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
    const OPTIONS = new faceapi.TinyFaceDetectorOptions({ inputSize: 160, scoreThreshold: 0.4 }); // Balance entre velocidad y precisión
    const candidates = (activeSession?.materia?.ficha?.aprendices || [])
      .filter(a => a.faceDescriptor?.length === 128)
      .map(a => ({ ...a, descriptor: arrayToDescriptor(a.faceDescriptor) }));

    const tick = async () => {
      if (!videoRef.current || videoRef.current.readyState < 2 || busyRef.current) {
        loopRef.current = setTimeout(tick, 50);
        return;
      }
      busyRef.current = true;

      try {
        const detections = await faceapi
          .detectAllFaces(videoRef.current, OPTIONS)
          .withFaceLandmarks(true)
          .withFaceDescriptors();

        setDetectionCount(prev => prev + 1);

        if (detections && detections.length > 0) {
          const now = Date.now();
          const toRegister = [];
          let detectedName = '';

          for (const det of detections) {
            let best = null, bestDist = Infinity;
            for (const c of candidates) {
              const d = faceDistance(det.descriptor, c.descriptor);
              if (d < bestDist) { bestDist = d; best = c; }
            }
            if (best && bestDist < THRESHOLD) {
              detectedName = best.fullName;
              setLastDetectedName(detectedName);
              
              const alreadyDone = registeredRef.current.has(best.id);
              const onCooldown = (now - (cooldownRef.current[best.id] || 0)) < COOLDOWN_MS;
              
              if (!alreadyDone && !onCooldown) {
                cooldownRef.current[best.id] = now;
                toRegister.push(best);
              }
            }
          }

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
                  showToast(`✅ ${a.fullName}`, 'success');
                });
              }
            });
          }
        } else {
          setLastDetectedName('');
        }
      } catch (_) {}

      busyRef.current = false;
      loopRef.current = setTimeout(tick, 100); // Más rápido: 10 fps
    };

    loopRef.current = setTimeout(tick, 100);
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

  // ─── Funciones de Hardware ────────────────────────────────────────────────
  const loadAvailablePorts = async () => {
    try {
      const data = await fetchApi('/serial/ports');
      setAvailablePorts(data.ports || []);
      // Si hay puertos disponibles y no hay uno seleccionado, seleccionar el primero
      if (data.ports && data.ports.length > 0 && !comPort) {
        setComPort(data.ports[0].path);
      }
    } catch (error) {
      console.error('Error loading ports:', error);
      showToast('Error al cargar puertos COM', 'error');
    }
  };

  const connectHardware = async () => {
    if (!comPort) {
      showToast('Selecciona un puerto COM primero', 'error');
      return;
    }
    
    setConnecting(true);
    try {
      await fetchApi('/serial/connect', {
        method: 'POST',
        body: JSON.stringify({ path: comPort })
      });
      setHardwareConnected(true);
      showToast(`✅ Conectado a ${comPort}`, 'success');
    } catch (error) {
      showToast(`Error de conexión: ${error.message}`, 'error');
      setHardwareConnected(false);
    } finally {
      setConnecting(false);
    }
  };

  const disconnectHardware = async () => {
    try {
      await fetchApi('/serial/disconnect', { method: 'POST' });
      setHardwareConnected(false);
      showToast('Hardware desconectado', 'info');
    } catch (error) {
      showToast(`Error al desconectar: ${error.message}`, 'error');
    }
  };

  const toggleHardware = () => {
    if (hardwareConnected) {
      disconnectHardware();
    } else {
      connectHardware();
    }
  };

  // Cargar puertos al montar el componente y cuando se activa una sesión
  useEffect(() => {
    loadAvailablePorts();
  }, []);

  useEffect(() => {
    if (activeSession) {
      loadAvailablePorts(); // Recargar puertos cuando se inicia sesión
    }
  }, [activeSession]);
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
      
      showToast('Código QR generado', 'success');
    } catch (error) {
      showToast(error.message, 'error');
      setQrActive(false);
    }
  };

  const toggleQR = () => {
    if (!qrActive) {
      setQrActive(true);
      generateQR();
    } else {
      setQrActive(false);
      if (qrTimerRef.current) clearInterval(qrTimerRef.current);
      setQrCode(null);
    }
  };

  // ─── Registro Manual ───────────────────────────────────────────────────────
  const registerManualStudent = async (aprendizId) => {
    // Prevenir múltiples clicks
    if (registering.has(aprendizId)) {
      return;
    }

    // Prevenir registros duplicados
    if (activeSession.registros?.some(r => r.aprendizId === aprendizId)) {
      showToast('Este estudiante ya está registrado', 'error');
      return;
    }

    // Marcar como registrando inmediatamente
    setRegistering(prev => new Set([...prev, aprendizId]));

    try {
      const aprendiz = activeSession.materia?.ficha?.aprendices?.find(a => a.id === aprendizId);
      
      // Crear ID único para el registro temporal
      const tempId = `temp-manual-${aprendizId}-${Date.now()}`;
      
      // Actualizar UI inmediatamente (optimistic update)
      const tempRegistro = {
        id: tempId,
        aprendizId: aprendizId,
        aprendiz: { fullName: aprendiz?.fullName },
        presente: true,
        metodo: 'manual',
        timestamp: new Date().toISOString()
      };

      setActiveSession(prev => ({
        ...prev,
        registros: [...(prev.registros || []), tempRegistro]
      }));

      showToast(`✅ ${aprendiz?.fullName} registrado`, 'success');

      // Enviar al servidor
      await fetchApi('/asistencias/manual-register', {
        method: 'POST',
        body: JSON.stringify({ 
          asistenciaId: activeSession.id, 
          aprendizId: aprendizId 
        })
      });

      // Si llegamos aquí, el registro fue exitoso en el servidor
      // Actualizar el registro temporal con datos reales del servidor
      setActiveSession(prev => ({
        ...prev,
        registros: prev.registros?.map(r => 
          r.id === tempId 
            ? { ...r, id: `manual-${aprendizId}-${Date.now()}` } // ID más permanente
            : r
        ) || []
      }));

    } catch (err) {
      // Revertir la UI si falla el servidor
      setActiveSession(prev => ({
        ...prev,
        registros: prev.registros?.filter(r => r.id !== `temp-manual-${aprendizId}-${Date.now()}`) || []
      }));
      showToast(`Error: ${err.message}`, 'error');
    } finally {
      // Siempre remover del estado de registrando
      setTimeout(() => {
        setRegistering(prev => {
          const newSet = new Set(prev);
          newSet.delete(aprendizId);
          return newSet;
        });
      }, 500); // Pequeño delay para evitar doble click
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
              Selecciona una Materia
            </label>
            <select 
              className="w-full px-4 py-3 rounded-xl border-2 border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-900 dark:text-white text-sm font-medium focus:outline-none focus:ring-2 focus:ring-[#34A853] focus:border-[#34A853] transition-all"
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
                className="px-8 py-3 rounded-xl bg-gradient-to-r from-green-500 to-emerald-600 hover:from-green-600 hover:to-emerald-700 text-white text-sm font-bold shadow-lg hover:shadow-xl transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2 transform hover:scale-105">
                <Play size={18}/> {starting ? 'Iniciando...' : 'Iniciar Sesión'}
              </button>
            ) : (
              <button 
                onClick={endSession} 
                className="px-8 py-3 rounded-xl bg-gradient-to-r from-red-500 to-rose-600 hover:from-red-600 hover:to-rose-700 text-white text-sm font-bold shadow-lg hover:shadow-xl transition-all flex items-center gap-2 transform hover:scale-105">
                <Square size={18}/> Finalizar Sesión
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Vista cuando NO hay sesión activa */}
      {!activeSession && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <div className="card dark:bg-gray-900 dark:border-gray-800 text-center p-8 hover:shadow-xl transition-all">
            <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-blue-500 to-blue-600 flex items-center justify-center mx-auto mb-4 shadow-lg">
              <Camera size={32} className="text-white" />
            </div>
            <h3 className="font-bold text-gray-900 dark:text-white mb-2">Reconocimiento Facial</h3>
            <p className="text-sm text-gray-500 dark:text-gray-400">Detecta automáticamente con IA</p>
          </div>

          <div className="card dark:bg-gray-900 dark:border-gray-800 text-center p-8 hover:shadow-xl transition-all">
            <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-yellow-500 to-orange-500 flex items-center justify-center mx-auto mb-4 shadow-lg">
              <QrCode size={32} className="text-white" />
            </div>
            <h3 className="font-bold text-gray-900 dark:text-white mb-2">Código QR</h3>
            <p className="text-sm text-gray-500 dark:text-gray-400">Escanea desde el celular</p>
          </div>

          <div className="card dark:bg-gray-900 dark:border-gray-800 text-center p-8 hover:shadow-xl transition-all">
            <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-green-500 to-emerald-600 flex items-center justify-center mx-auto mb-4 shadow-lg">
              <Fingerprint size={32} className="text-white" />
            </div>
            <h3 className="font-bold text-gray-900 dark:text-white mb-2">Huella Digital</h3>
            <p className="text-sm text-gray-500 dark:text-gray-400">Sensor biométrico rápido</p>
          </div>

          <div className="card dark:bg-gray-900 dark:border-gray-800 text-center p-8 hover:shadow-xl transition-all">
            <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center mx-auto mb-4 shadow-lg">
              <UserPlus size={32} className="text-white" />
            </div>
            <h3 className="font-bold text-gray-900 dark:text-white mb-2">Registro Manual</h3>
            <p className="text-sm text-gray-500 dark:text-gray-400">Marca manualmente si es necesario</p>
          </div>
        </div>
      )}

      {activeSession && (
        <>
          {/* Lector de Huella y NFC */}
          <div className="card dark:bg-gray-900 dark:border-gray-800 transition-all duration-300">
            <div className="flex items-center gap-2 mb-3">
              <Fingerprint size={18} className="text-[#4285F4]" />
              <h3 className="text-sm font-semibold text-gray-700 dark:text-gray-300">Lector de Huella y NFC</h3>
            </div>
            <div className="flex flex-col sm:flex-row gap-3 items-end">
              <div className="flex-1">
                <label className="block text-xs font-semibold text-gray-500 dark:text-gray-400 mb-1">Puerto COM</label>
                <select 
                  className="w-full px-4 py-2.5 rounded-xl border-2 border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-900 dark:text-white text-sm font-medium focus:outline-none focus:ring-2 focus:ring-[#4285F4] focus:border-[#4285F4] transition-all"
                  value={comPort}
                  onChange={e => setComPort(e.target.value)}
                  disabled={hardwareConnected || connecting}>
                  <option value="">Seleccionar puerto...</option>
                  {availablePorts.length === 0 ? (
                    <option value="" disabled>No hay puertos disponibles</option>
                  ) : (
                    availablePorts.map(port => (
                      <option key={port.path} value={port.path}>
                        {port.path} - {port.manufacturer || 'Desconocido'}
                      </option>
                    ))
                  )}
                </select>
              </div>
              <div className="flex gap-2">
                <button 
                  onClick={loadAvailablePorts}
                  disabled={connecting}
                  className="px-3 py-2.5 rounded-xl bg-gray-500 hover:bg-gray-600 text-white text-sm font-semibold transition-all shadow-md flex items-center gap-2 disabled:opacity-50"
                  title="Actualizar lista de puertos">
                  <RefreshCw size={14} className={connecting ? 'animate-spin' : ''} />
                </button>
                <button 
                  onClick={toggleHardware}
                  disabled={connecting || !comPort}
                  className={`px-5 py-2.5 rounded-xl text-white text-sm font-semibold transition-all shadow-md flex items-center gap-2 transform hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed ${
                    hardwareConnected 
                      ? 'bg-gradient-to-r from-red-500 to-rose-600 hover:from-red-600 hover:to-rose-700' 
                      : 'bg-gradient-to-r from-blue-500 to-indigo-600 hover:from-blue-600 hover:to-indigo-700'
                  }`}>
                  {connecting ? (
                    <><RefreshCw size={14} className="animate-spin"/> Conectando...</>
                  ) : hardwareConnected ? (
                    <><X size={14}/> Desconectar</>
                  ) : (
                    <><Wifi size={14}/> Conectar</>
                  )}
                </button>
              </div>
            </div>
            {hardwareConnected && (
              <div className="mt-3 flex items-center gap-2 text-xs text-[#34A853] bg-green-50 dark:bg-green-900/20 px-3 py-2 rounded-lg animate-fade-in">
                <Wifi size={12} />
                <span>Hardware conectado en {comPort} - Listo para recibir datos</span>
              </div>
            )}
            {!hardwareConnected && availablePorts.length === 0 && (
              <div className="mt-3 flex items-center gap-2 text-xs text-yellow-600 bg-yellow-50 dark:bg-yellow-900/20 px-3 py-2 rounded-lg">
                <RefreshCw size={12} />
                <span>No se encontraron puertos COM. Conecta el hardware y actualiza la lista.</span>
              </div>
            )}
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
            <div className="bg-white dark:bg-gray-800 rounded-2xl p-5 border-l-4 border-l-gray-400 shadow-sm hover:shadow-md transition-all">
              <div className="flex items-center justify-between mb-3">
                <div className="w-12 h-12 rounded-xl bg-gray-100 dark:bg-gray-700 flex items-center justify-center">
                  <Users size={24} className="text-gray-600 dark:text-gray-400" />
                </div>
              </div>
              <p className="text-3xl font-bold text-gray-900 dark:text-white mb-1">{totalAprendices}</p>
              <p className="text-sm text-gray-500 dark:text-gray-400">Total</p>
            </div>

            <div className="bg-white dark:bg-gray-800 rounded-2xl p-5 border-l-4 border-l-green-500 shadow-sm hover:shadow-md transition-all">
              <div className="flex items-center justify-between mb-3">
                <div className="w-12 h-12 rounded-xl bg-green-100 dark:bg-green-900/30 flex items-center justify-center">
                  <CheckCircle size={24} className="text-green-600 dark:text-green-400" />
                </div>
              </div>
              <p className="text-3xl font-bold text-green-600 dark:text-green-400 mb-1">{presentes}</p>
              <p className="text-sm text-gray-500 dark:text-gray-400">Presentes</p>
            </div>

            <div className="bg-white dark:bg-gray-800 rounded-2xl p-5 border-l-4 border-l-yellow-500 shadow-sm hover:shadow-md transition-all">
              <div className="flex items-center justify-between mb-3">
                <div className="w-12 h-12 rounded-xl bg-yellow-100 dark:bg-yellow-900/30 flex items-center justify-center">
                  <Clock size={24} className="text-yellow-600 dark:text-yellow-400" />
                </div>
              </div>
              <p className="text-3xl font-bold text-yellow-600 dark:text-yellow-400 mb-1">{pendientes}</p>
              <p className="text-sm text-gray-500 dark:text-gray-400">Ausentes</p>
            </div>

            <div className="bg-white dark:bg-gray-800 rounded-2xl p-5 border-l-4 border-l-blue-500 shadow-sm hover:shadow-md transition-all">
              <div className="flex items-center justify-between mb-3">
                <div className="w-12 h-12 rounded-xl bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center">
                  <TrendingUp size={24} className="text-blue-600 dark:text-blue-400" />
                </div>
              </div>
              <p className="text-3xl font-bold text-blue-600 dark:text-blue-400 mb-1">{porcentajeCompletado}%</p>
              <p className="text-sm text-gray-500 dark:text-gray-400">Completado</p>
            </div>
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
                <div className="relative rounded-2xl overflow-hidden bg-black shadow-2xl" style={{ aspectRatio: '16/9', maxHeight: 450 }}>
                  <video 
                    ref={videoRef} 
                    muted 
                    playsInline 
                    className="w-full h-full object-cover"
                    style={{ transform: 'scaleX(-1)' }} 
                  />

                  {/* Nombre detectado */}
                  {lastDetectedName && (
                    <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/90 via-black/60 to-transparent p-6">
                      <div className="flex items-center justify-center gap-3">
                        <div className="w-12 h-12 rounded-full bg-gradient-to-br from-green-400 to-emerald-600 flex items-center justify-center text-white font-bold text-xl shadow-lg animate-pulse">
                          {lastDetectedName.charAt(0)}
                        </div>
                        <div>
                          <p className="text-white font-bold text-xl">{lastDetectedName}</p>
                          <p className="text-green-400 text-sm">✓ Detectado</p>
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Indicador de estado */}
                  <div className="absolute top-4 right-4 flex items-center gap-2 bg-red-600/90 backdrop-blur-sm px-3 py-1.5 rounded-full shadow-lg">
                    <div className="w-2 h-2 rounded-full bg-white animate-pulse" />
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

              {/* Botones de métodos de registro - Horizontal */}
              <div className="mt-4 grid grid-cols-2 gap-3">
                <button 
                  onClick={toggleQR}
                  className={`px-4 py-3 rounded-xl text-white text-sm font-semibold transition-all shadow-md flex items-center justify-center gap-2 transform hover:scale-105 ${
                    qrActive 
                      ? 'bg-gradient-to-r from-orange-500 to-red-500 hover:from-orange-600 hover:to-red-600' 
                      : 'bg-gradient-to-r from-yellow-500 to-orange-500 hover:from-yellow-600 hover:to-orange-600'
                  }`}>
                  <QrCode size={18}/> {qrActive ? 'Ocultar QR' : 'Código QR'}
                </button>
                <button 
                  onClick={() => setManualRegisterOpen(true)}
                  className="px-4 py-3 rounded-xl bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600 text-white text-sm font-semibold transition-all shadow-md flex items-center justify-center gap-2 transform hover:scale-105">
                  <UserPlus size={18}/> Registro Manual
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

      {/* Historial de Sesiones - Mejorado */}
      {!activeSession && closedSessions.length > 0 && (
        <div className="card dark:bg-gray-900 dark:border-gray-800 transition-all duration-300">
          <div className="flex items-center justify-between mb-4">
            <h2 className="font-bold text-gray-900 dark:text-white text-lg">Historial de Sesiones</h2>
            <span className="text-xs text-gray-500">{closedSessions.length} sesiones</span>
          </div>
          
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

      {/* Modal Registro Manual - Lista Clickeable */}
      {manualRegisterOpen && activeSession && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4 animate-fade-in">
          <div className="bg-white dark:bg-gray-900 rounded-2xl shadow-2xl max-w-2xl w-full max-h-[80vh] overflow-hidden animate-scale-in">
            <div className="flex items-center justify-between p-6 border-b border-gray-200 dark:border-gray-700">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center shadow-lg">
                  <UserPlus size={24} className="text-white" />
                </div>
                <div>
                  <h2 className="font-bold text-gray-900 dark:text-white">Registro Manual de Asistencia</h2>
                  <p className="text-xs text-gray-400">Haz clic en un estudiante para registrar su asistencia</p>
                </div>
              </div>
              <button onClick={() => setManualRegisterOpen(false)} className="btn-icon hover:bg-gray-100 dark:hover:bg-gray-800">
                <X size={18} />
              </button>
            </div>

            <div className="p-6">
              {(() => {
                const pendingStudents = activeSession.materia?.ficha?.aprendices
                  ?.filter(a => !activeSession.registros?.some(r => r.aprendizId === a.id))
                  .sort((a, b) => a.fullName.localeCompare(b.fullName)) || [];

                if (pendingStudents.length === 0) {
                  return (
                    <div className="text-center py-12">
                      <CheckCircle size={48} className="mx-auto mb-4 text-[#34A853] opacity-50" />
                      <p className="text-lg font-semibold text-gray-700 dark:text-gray-300 mb-2">¡Todos registrados!</p>
                      <p className="text-sm text-gray-500">Todos los estudiantes ya tienen su asistencia marcada</p>
                    </div>
                  );
                }

                return (
                  <>
                    <div className="mb-4 flex items-center justify-between">
                      <p className="text-sm text-gray-600 dark:text-gray-400">
                        {pendingStudents.length} estudiante{pendingStudents.length !== 1 ? 's' : ''} pendiente{pendingStudents.length !== 1 ? 's' : ''}
                      </p>
                      <div className="flex items-center gap-2 text-xs text-gray-500">
                        <Clock size={12} />
                        <span>Click para registrar</span>
                      </div>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 max-h-96 overflow-y-auto custom-scrollbar">
                      {pendingStudents.map((student, i) => {
                        const isRegistering = registering.has(student.id);
                        return (
                          <button
                            key={student.id}
                            onClick={() => !isRegistering && registerManualStudent(student.id)}
                            disabled={isRegistering}
                            className={`flex items-center gap-3 p-4 rounded-xl border-2 transition-all transform text-left ${
                              isRegistering 
                                ? 'bg-green-100 dark:bg-green-900/30 border-green-300 dark:border-green-700 cursor-not-allowed opacity-75 scale-95'
                                : 'bg-gray-50 dark:bg-gray-800 hover:bg-purple-50 dark:hover:bg-purple-900/20 border-transparent hover:border-purple-200 dark:hover:border-purple-700 hover:scale-105 active:scale-95'
                            }`}
                            style={{ 
                              animation: `slideIn 0.3s ease-out ${i * 50}ms`,
                              pointerEvents: isRegistering ? 'none' : 'auto'
                            }}>
                            <div className={`w-12 h-12 rounded-full flex items-center justify-center text-white font-bold text-lg shadow-md transition-all ${
                              isRegistering 
                                ? 'bg-gradient-to-br from-green-400 to-emerald-500 animate-pulse'
                                : 'bg-gradient-to-br from-purple-400 to-pink-500'
                            }`}>
                              {isRegistering ? (
                                <CheckCircle size={20} />
                              ) : (
                                student.fullName.charAt(0).toUpperCase()
                              )}
                            </div>
                            <div className="flex-1 min-w-0">
                              <p className="text-sm font-semibold text-gray-800 dark:text-gray-200 truncate">
                                {student.fullName}
                              </p>
                              <p className="text-xs text-gray-500 dark:text-gray-400">
                                {isRegistering ? '✓ Registrando...' : (student.email || 'Clic para registrar')}
                              </p>
                            </div>
                            {isRegistering ? (
                              <div className="flex items-center gap-1">
                                <RefreshCw size={16} className="text-green-500 animate-spin" />
                                <CheckCircle size={16} className="text-green-500" />
                              </div>
                            ) : (
                              <UserPlus size={18} className="text-purple-500 opacity-60 group-hover:opacity-100 transition-opacity" />
                            )}
                          </button>
                        );
                      })}
                    </div>
                  </>
                );
              })()}
            </div>
          </div>
        </div>
      )}

      {/* Modal Detalle de Sesión con GRÁFICAS */}
      {selectedSessionDetail && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4 animate-fade-in" onClick={() => setSelectedSessionDetail(null)}>
          <div className="bg-white dark:bg-gray-900 rounded-2xl shadow-2xl max-w-6xl w-full max-h-[95vh] overflow-y-auto animate-scale-in" onClick={e => e.stopPropagation()}>
            <div className="sticky top-0 bg-white dark:bg-gray-900 border-b border-gray-200 dark:border-gray-700 p-6 z-10">
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="font-bold text-gray-900 dark:text-white text-2xl">Análisis Detallado de Sesión</h2>
                  <p className="text-sm text-gray-400">{selectedSessionDetail.fecha} • {selectedSessionDetail.materia?.nombre} • Ficha {selectedSessionDetail.materia?.ficha?.numero}</p>
                </div>
                <button onClick={() => setSelectedSessionDetail(null)} className="btn-icon hover:bg-gray-100 dark:hover:bg-gray-800">
                  <X size={20} />
                </button>
              </div>
            </div>

            <div className="p-6">{/* Contenido del modal */}

            {/* Estadísticas principales */}
            <div className="grid grid-cols-4 gap-4 mb-6">
              {[
                { 
                  label: 'Total Estudiantes', 
                  value: selectedSessionDetail.registros?.length || 0, 
                  color: 'blue', 
                  icon: Users,
                  bg: 'from-blue-500 to-blue-600'
                },
                { 
                  label: 'Presentes', 
                  value: selectedSessionDetail.registros?.filter(r => r.presente).length || 0, 
                  color: 'green', 
                  icon: CheckCircle,
                  bg: 'from-green-500 to-emerald-600'
                },
                { 
                  label: 'Ausentes', 
                  value: selectedSessionDetail.registros?.filter(r => !r.presente).length || 0, 
                  color: 'red', 
                  icon: X,
                  bg: 'from-red-500 to-rose-600'
                },
                { 
                  label: 'Asistencia', 
                  value: `${Math.round(((selectedSessionDetail.registros?.filter(r => r.presente).length || 0) / (selectedSessionDetail.registros?.length || 1)) * 100)}%`, 
                  color: 'purple', 
                  icon: TrendingUp,
                  bg: 'from-purple-500 to-pink-600'
                },
              ].map(stat => (
                <div key={stat.label} className={`bg-gradient-to-br ${stat.bg} rounded-xl p-4 text-white shadow-lg transform hover:scale-105 transition-all`}>
                  <div className="flex items-center justify-between mb-2">
                    <stat.icon size={24} className="opacity-80" />
                    <div className="w-10 h-10 bg-white/20 rounded-lg flex items-center justify-center">
                      <stat.icon size={20} />
                    </div>
                  </div>
                  <p className="text-3xl font-bold mb-1">{stat.value}</p>
                  <p className="text-xs opacity-90">{stat.label}</p>
                </div>
              ))}
            </div>

            {/* Gráficas */}
            <div className="grid grid-cols-2 gap-6 mb-6">
              {/* Gráfica de Torta */}
              <div className="card dark:bg-gray-800">
                <h3 className="font-semibold text-gray-900 dark:text-white mb-4">Distribución de Asistencia</h3>
                <ResponsiveContainer width="100%" height={250}>
                  <PieChart>
                    <Pie 
                      data={[
                        { name: 'Presentes', value: selectedSessionDetail.registros?.filter(r => r.presente).length || 0, color: '#34A853' },
                        { name: 'Ausentes', value: selectedSessionDetail.registros?.filter(r => !r.presente).length || 0, color: '#EA4335' },
                      ]}
                      cx="50%" 
                      cy="50%" 
                      innerRadius={60} 
                      outerRadius={90}
                      paddingAngle={5} 
                      dataKey="value"
                      label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                    >
                      {[
                        { name: 'Presentes', value: selectedSessionDetail.registros?.filter(r => r.presente).length || 0, color: '#34A853' },
                        { name: 'Ausentes', value: selectedSessionDetail.registros?.filter(r => !r.presente).length || 0, color: '#EA4335' },
                      ].map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.color} />
                      ))}
                    </Pie>
                    <Tooltip />
                  </PieChart>
                </ResponsiveContainer>
              </div>

              {/* Gráfica de Métodos de Registro */}
              <div className="card dark:bg-gray-800">
                <h3 className="font-semibold text-gray-900 dark:text-white mb-4">Métodos de Registro</h3>
                <ResponsiveContainer width="100%" height={250}>
                  <BarChart 
                    data={(() => {
                      const metodos = {};
                      selectedSessionDetail.registros?.filter(r => r.presente).forEach(r => {
                        const metodo = r.metodo || 'manual';
                        metodos[metodo] = (metodos[metodo] || 0) + 1;
                      });
                      return Object.entries(metodos).map(([name, value]) => ({ 
                        name: name.charAt(0).toUpperCase() + name.slice(1), 
                        value,
                        fill: name === 'facial' ? '#4285F4' : name === 'qr' ? '#FBBC05' : name === 'nfc' ? '#34A853' : '#9333EA'
                      }));
                    })()}
                  >
                    <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                    <XAxis dataKey="name" tick={{ fontSize: 12 }} />
                    <YAxis tick={{ fontSize: 12 }} />
                    <Tooltip />
                    <Bar dataKey="value" radius={[8, 8, 0, 0]}>
                      {(() => {
                        const metodos = {};
                        selectedSessionDetail.registros?.filter(r => r.presente).forEach(r => {
                          const metodo = r.metodo || 'manual';
                          metodos[metodo] = (metodos[metodo] || 0) + 1;
                        });
                        return Object.entries(metodos).map(([name, value], index) => (
                          <Cell key={`cell-${index}`} fill={name === 'facial' ? '#4285F4' : name === 'qr' ? '#FBBC05' : name === 'nfc' ? '#34A853' : '#9333EA'} />
                        ));
                      })()}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>

            {/* Gráfica de Línea de Tiempo */}
            <div className="card dark:bg-gray-800 mb-6">
              <h3 className="font-semibold text-gray-900 dark:text-white mb-4">Línea de Tiempo de Registros</h3>
              <ResponsiveContainer width="100%" height={200}>
                <LineChart 
                  data={(() => {
                    const registrosPorMinuto = {};
                    selectedSessionDetail.registros?.filter(r => r.presente).forEach(r => {
                      const time = new Date(r.timestamp).toLocaleTimeString('es', { hour: '2-digit', minute: '2-digit' });
                      registrosPorMinuto[time] = (registrosPorMinuto[time] || 0) + 1;
                    });
                    return Object.entries(registrosPorMinuto).map(([time, count]) => ({ time, count }));
                  })()}
                >
                  <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                  <XAxis dataKey="time" tick={{ fontSize: 11 }} />
                  <YAxis tick={{ fontSize: 11 }} />
                  <Tooltip />
                  <Line type="monotone" dataKey="count" stroke="#4285F4" strokeWidth={3} dot={{ fill: '#4285F4', r: 5 }} />
                </LineChart>
              </ResponsiveContainer>
            </div>

            {/* Listas de estudiantes */}
            <div className="grid grid-cols-2 gap-6">
              <div>
                <h3 className="font-semibold text-gray-900 dark:text-white mb-3 flex items-center gap-2">
                  <div className="w-8 h-8 rounded-lg bg-green-100 dark:bg-green-900/20 flex items-center justify-center">
                    <CheckCircle size={16} className="text-[#34A853]" />
                  </div>
                  Presentes ({selectedSessionDetail.registros?.filter(r => r.presente).length || 0})
                </h3>
                <div className="space-y-2 max-h-96 overflow-y-auto custom-scrollbar">
                  {selectedSessionDetail.registros?.filter(r => r.presente).map((reg, i) => (
                    <div key={i} className="bg-green-50 dark:bg-green-900/20 rounded-lg p-3 flex items-center gap-3 hover:shadow-md transition-all">
                      <div className="w-10 h-10 rounded-full bg-gradient-to-br from-green-500 to-emerald-600 flex items-center justify-center text-white font-bold text-sm shadow-md">
                        {reg.aprendiz?.fullName?.charAt(0) || 'A'}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-semibold text-gray-800 dark:text-gray-200 truncate">
                          {reg.aprendiz?.fullName || 'Aprendiz'}
                        </p>
                        <div className="flex items-center gap-2 text-xs text-gray-500">
                          <span className="px-2 py-0.5 rounded-full bg-green-100 dark:bg-green-800 text-green-700 dark:text-green-300 font-medium">
                            {reg.metodo || 'manual'}
                          </span>
                          <span>{new Date(reg.timestamp).toLocaleTimeString('es', { hour: '2-digit', minute: '2-digit' })}</span>
                        </div>
                      </div>
                      <CheckCircle size={18} className="text-[#34A853]" />
                    </div>
                  ))}
                </div>
              </div>

              <div>
                <h3 className="font-semibold text-gray-900 dark:text-white mb-3 flex items-center gap-2">
                  <div className="w-8 h-8 rounded-lg bg-red-100 dark:bg-red-900/20 flex items-center justify-center">
                    <X size={16} className="text-[#EA4335]" />
                  </div>
                  Ausentes ({selectedSessionDetail.registros?.filter(r => !r.presente).length || 0})
                </h3>
                <div className="space-y-2 max-h-96 overflow-y-auto custom-scrollbar">
                  {selectedSessionDetail.registros?.filter(r => !r.presente).map((reg, i) => (
                    <div key={i} className="bg-red-50 dark:bg-red-900/20 rounded-lg p-3 flex items-center gap-3 hover:shadow-md transition-all">
                      <div className="w-10 h-10 rounded-full bg-gradient-to-br from-red-500 to-rose-600 flex items-center justify-center text-white font-bold text-sm shadow-md">
                        {reg.aprendiz?.fullName?.charAt(0) || 'A'}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-semibold text-gray-800 dark:text-gray-200 truncate">
                          {reg.aprendiz?.fullName || 'Aprendiz'}
                        </p>
                        <p className="text-xs text-gray-500">Sin registro</p>
                      </div>
                      <X size={18} className="text-[#EA4335]" />
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* Botón de exportar */}
            <div className="mt-6 flex justify-end">
              <button 
                onClick={() => exportSession(selectedSessionDetail.id, selectedSessionDetail.fecha)}
                className="btn-primary flex items-center gap-2">
                <Download size={16} />
                Exportar Sesión Completa
              </button>
            </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
