import React, { useState, useEffect, useRef } from 'react';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell, PieChart, Pie, Legend
} from 'recharts';
import fetchApi from '../../services/api';
import PageHeader from '../../components/PageHeader';
import EmptyState from '../../components/EmptyState';
import Modal from '../../components/Modal';
import FacialScanner from '../../components/FacialScanner';
import QRAttendance from '../../components/QRAttendance';
import ManualAttendance from '../../components/ManualAttendance';
import { useToast } from '../../context/ToastContext';
import { Play, Square, Users, CheckCircle, Clock, BookOpen, BarChart2, Download, ScanFace, QrCode, UserCheck } from 'lucide-react';
import { io } from 'socket.io-client';

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
  const [selectedFecha, setSelectedFecha] = useState(() => new Date().toISOString().split('T')[0]); // Se deja internamente si es necesario, pero se oculta o elimina
  const [tab, setTab] = useState('sesion'); // 'sesion' | 'estadisticas'
  const [facialScannerOpen, setFacialScannerOpen] = useState(false);
  const [qrModalOpen, setQrModalOpen] = useState(false);
  const [manualModalOpen, setManualModalOpen] = useState(false);
  const socketRef = useRef(null);

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
    if (!confirm('¿Finalizar la sesión? Los aprendices sin registro serán marcados como ausentes.')) return;
    try {
      await fetchApi(`/asistencias/${activeSession.id}/finalizar`, { method: 'PUT' });
      socketRef.current?.disconnect();
      setActiveSession(null);
      loadSessions();
      showToast('Sesión finalizada. Ausencias marcadas automáticamente.', 'success');
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

  return (
    <div className="animate-fade-in space-y-5">
      <PageHeader title="Control de Asistencia" subtitle="Inicia sesiones y visualiza estadísticas" />

      {/* Tabs */}
      <div className="flex gap-1 p-1 bg-gray-100 dark:bg-gray-800 rounded-xl w-fit">
        {[
          { id: 'sesion', label: 'Sesión', icon: Clock },
          { id: 'estadisticas', label: 'Estadísticas', icon: BarChart2 },
        ].map(({ id, label, icon: Icon }) => (
          <button key={id} onClick={() => setTab(id)}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all ${
              tab === id
                ? 'bg-white dark:bg-gray-700 shadow-sm text-gray-900 dark:text-white'
                : 'text-gray-500 hover:text-gray-700 dark:hover:text-gray-300'
            }`}>
            <Icon size={15}/> {label}
          </button>
        ))}
      </div>

      {tab === 'sesion' && (
        <>
          {/* Selector de materia */}
          <div className="card dark:bg-gray-900 dark:border-gray-800">
            <div className="flex flex-col sm:flex-row gap-4 items-end">
              <div className="flex-1">
                <label className="input-label">Materia</label>
                <select className="input-field dark:bg-gray-800 dark:border-gray-700 dark:text-white"
                  value={selectedMateria}
                  onChange={e => setSelectedMateria(e.target.value)}
                  disabled={!!activeSession || materias.length === 0}>
                  {materias.length === 0
                    ? <option>Sin materias disponibles</option>
                    : materias.map(m => <option key={m.id} value={m.id}>{m.nombre} – Ficha {m.ficha?.numero}</option>)
                  }
                </select>
              </div>
              <div className="w-full sm:w-40" style={{display: 'none'}}>
                {/* Se eliminó visualmente el selector de fecha para forzar el uso del día actual */}
              </div>
              <div>
                {!activeSession ? (
                  <button onClick={startSession} disabled={!selectedMateria || starting} className="btn-success flex items-center gap-2">
                    <Play size={16}/> {starting ? 'Iniciando...' : 'Iniciar Sesión'}
                  </button>
                ) : (
                  <div className="flex items-center gap-2">
                    <button onClick={() => setManualModalOpen(true)}
                      className="flex items-center gap-2 px-4 py-2 rounded-xl bg-[#34A853] text-white text-sm font-semibold hover:bg-green-600 transition-all shadow-sm">
                      <UserCheck size={16}/> Registro Manual
                    </button>
                    <button onClick={() => setQrModalOpen(true)}
                      className="flex items-center gap-2 px-4 py-2 rounded-xl bg-[#FBBC05] text-white text-sm font-semibold hover:bg-yellow-600 transition-all shadow-sm">
                      <QrCode size={16}/> Código QR
                    </button>
                    <button onClick={() => setFacialScannerOpen(true)}
                      className="flex items-center gap-2 px-4 py-2 rounded-xl bg-[#4285F4] text-white text-sm font-semibold hover:bg-blue-600 transition-all shadow-sm">
                      <ScanFace size={16}/> Escáner Facial
                    </button>
                    <button onClick={endSession} className="btn-danger flex items-center gap-2">
                      <Square size={16}/> Finalizar Sesión
                    </button>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Sesión activa */}
          {activeSession && (
            <div className="card border-l-4 border-l-[#34A853] dark:bg-gray-900 dark:border-gray-800">
              <div className="flex flex-wrap items-center justify-between gap-4 mb-5">
                <div className="flex items-center gap-3">
                  <span className="relative flex h-3 w-3">
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-[#34A853] opacity-75"/>
                    <span className="relative inline-flex rounded-full h-3 w-3 bg-[#34A853]"/>
                  </span>
                  <div>
                    <p className="font-bold text-gray-900 dark:text-white">{activeSession.materia?.nombre}</p>
                    <p className="text-xs text-gray-400">Ficha {activeSession.materia?.ficha?.numero}</p>
                  </div>
                </div>
                <div className="flex items-center gap-2 text-sm text-gray-500 dark:text-gray-400 bg-gray-50 dark:bg-gray-800 px-3 py-1.5 rounded-xl">
                  <button onClick={() => exportSession(activeSession.id, activeSession.fecha)} className="btn-icon text-[#34A853] hover:bg-green-50 mr-2" title="Exportar Sesión">
                    <Download size={15}/>
                  </button>
                  <Clock size={14}/> <Timer startTime={activeSession.timestamp} />
                </div>
              </div>

              <div className="grid grid-cols-3 gap-3 mb-5">
                {[
                  { label: 'Total', value: totalAprendices, cls: 'bg-gray-50 dark:bg-gray-800 text-gray-700 dark:text-gray-300' },
                  { label: 'Presentes', value: presentes, cls: 'bg-green-50 dark:bg-green-900/20 text-[#34A853]' },
                  { label: 'Pendientes', value: pendientes, cls: 'bg-yellow-50 dark:bg-yellow-900/20 text-[#FBBC05]' },
                ].map(s => (
                  <div key={s.label} className={`${s.cls} rounded-xl p-3 text-center transition-all`}>
                    <p className="text-2xl font-bold tabular-nums">{s.value}</p>
                    <p className="text-xs font-medium mt-0.5">{s.label}</p>
                  </div>
                ))}
              </div>

              <h3 className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wide mb-3">Aprendices registrados</h3>
              {presentes === 0 ? (
                <div className="text-center py-8 text-gray-400 border-2 border-dashed border-gray-200 dark:border-gray-700 rounded-xl">
                  <Users size={28} className="mx-auto mb-2 opacity-30"/>
                  <p className="text-sm">Esperando registros...</p>
                </div>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 max-h-64 overflow-y-auto">
                  {activeSession.registros?.filter(r => r.presente !== false).map((reg, i) => (
                    <div key={reg.id || i} className="flex items-center gap-3 p-2.5 bg-green-50 dark:bg-green-900/20 rounded-xl">
                      <CheckCircle size={16} className="text-[#34A853] shrink-0"/>
                      <div className="min-w-0">
                        <p className="text-xs font-semibold text-gray-800 dark:text-gray-200 truncate">
                          {reg.aprendiz?.fullName || reg.fullName || 'Aprendiz'}
                        </p>
                        <p className="text-xs text-gray-400">
                          {reg.metodo === 'nfc' ? 'NFC' :
                           reg.metodo === 'huella' ? 'Huella' :
                           reg.metodo === 'facial' ? 'Facial' :
                           reg.metodo === 'qr' ? 'QR' :
                           reg.metodo === 'manual' ? 'Manual' :
                           'Código'}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* Historial reciente */}
          {closedSessions.length > 0 && (
            <div className="card dark:bg-gray-900 dark:border-gray-800">
              <h2 className="font-bold text-gray-900 dark:text-white mb-4">Sesiones Anteriores</h2>
              <div className="space-y-2">
                {closedSessions.slice(0, 5).map(s => {
                  const p = s.registros?.filter(r => r.presente).length || 0;
                  const t = s.registros?.length || 0;
                  const pct = t > 0 ? Math.round((p / t) * 100) : 0;
                  return (
                    <div key={s.id} className="flex items-center justify-between p-3 rounded-xl bg-gray-50 dark:bg-gray-800">
                      <div>
                        <p className="text-sm font-medium text-gray-800 dark:text-gray-200">{s.fecha}</p>
                        <p className="text-xs text-gray-400">{s.instructor?.fullName}</p>
                      </div>
                      <div className="flex items-center gap-3">
                        <button onClick={() => exportSession(s.id, s.fecha)} className="btn-icon text-[#34A853] hover:bg-green-50" title="Exportar Sesión">
                          <Download size={15}/>
                        </button>
                        <div className="w-24 h-1.5 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
                          <div className="h-full bg-[#34A853] rounded-full transition-all" style={{ width: `${pct}%` }}/>
                        </div>
                        <span className="text-sm font-bold text-gray-700 dark:text-gray-300 tabular-nums w-12 text-right">{p}/{t}</span>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {!loading && materias.length === 0 && (
            <div className="card dark:bg-gray-900">
              <EmptyState icon={<BookOpen size={32}/>} title="Sin materias" description="Crea materias en tus fichas para iniciar sesiones." />
            </div>
          )}
        </>
      )}

      {tab === 'estadisticas' && (
        <div className="space-y-5">
          {closedSessions.length === 0 ? (
            <div className="card dark:bg-gray-900">
              <EmptyState icon={<BarChart2 size={32}/>} title="Sin datos aún" description="Inicia y finaliza sesiones para ver estadísticas." />
            </div>
          ) : (
            <>
              {/* Resumen */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                {[
                  { label: 'Sesiones', value: closedSessions.length, color: 'text-[#4285F4]', bg: 'bg-blue-50 dark:bg-blue-900/20' },
                  { label: 'Total Presentes', value: totalPresentes, color: 'text-[#34A853]', bg: 'bg-green-50 dark:bg-green-900/20' },
                  { label: 'Total Ausentes', value: totalAusentes, color: 'text-[#EA4335]', bg: 'bg-red-50 dark:bg-red-900/20' },
                  { label: '% Asistencia', value: `${totalPresentes + totalAusentes > 0 ? Math.round((totalPresentes / (totalPresentes + totalAusentes)) * 100) : 0}%`, color: 'text-[#FBBC05]', bg: 'bg-yellow-50 dark:bg-yellow-900/20' },
                ].map(s => (
                  <div key={s.label} className={`card-sm ${s.bg} text-center dark:border-gray-800`}>
                    <p className={`text-2xl font-bold ${s.color}`}>{s.value}</p>
                    <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">{s.label}</p>
                  </div>
                ))}
              </div>

              {/* Gráfica de barras */}
              {barData.length > 0 && (
                <div className="card dark:bg-gray-900 dark:border-gray-800">
                  <h2 className="font-bold text-gray-900 dark:text-white mb-4">Asistencia por Sesión</h2>
                  <ResponsiveContainer width="100%" height={220}>
                    <BarChart data={barData} margin={{ top: 5, right: 10, left: -20, bottom: 5 }}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                      <XAxis dataKey="name" tick={{ fontSize: 10, fill: '#9ca3af' }} />
                      <YAxis tick={{ fontSize: 10, fill: '#9ca3af' }} />
                      <Tooltip content={<CustomTooltip />} />
                      <Bar dataKey="Presentes" fill="#34A853" radius={[4,4,0,0]} />
                      <Bar dataKey="Ausentes"  fill="#EA4335" radius={[4,4,0,0]} />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              )}

              {/* Gráfica de torta */}
              {(totalPresentes + totalAusentes) > 0 && (
                <div className="card dark:bg-gray-900 dark:border-gray-800">
                  <h2 className="font-bold text-gray-900 dark:text-white mb-4">Distribución General</h2>
                  <ResponsiveContainer width="100%" height={200}>
                    <PieChart>
                      <Pie data={pieData} cx="50%" cy="50%" innerRadius={55} outerRadius={80}
                        paddingAngle={3} dataKey="value">
                        {pieData.map((entry, i) => (
                          <Cell key={i} fill={entry.color} />
                        ))}
                      </Pie>
                      <Tooltip content={<CustomTooltip />} />
                      <Legend iconType="circle" iconSize={10}
                        formatter={(value) => <span className="text-xs text-gray-600 dark:text-gray-400">{value}</span>} />
                    </PieChart>
                  </ResponsiveContainer>
                </div>
              )}
            </>
          )}
        </div>
      )}
      {/* Modal Escáner Facial */}
      <Modal open={facialScannerOpen} onClose={() => setFacialScannerOpen(false)} title="Registro por Reconocimiento Facial">
        {activeSession && (
          <FacialScanner
            asistenciaId={activeSession.id}
            fichaId={activeSession.materia?.ficha?.id}
            aprendices={activeSession.materia?.ficha?.aprendices || []}
            alreadyRegistered={new Set((activeSession.registros || []).map(r => r.aprendizId))}
            onRegistered={(aprendiz) => {
              showToast(`✓ ${aprendiz.fullName} marcado como presente`, 'success');
              setActiveSession(prev => {
                if (!prev) return prev;
                if (prev.registros?.some(r => r.aprendizId === aprendiz.id)) return prev;
                return {
                  ...prev,
                  registros: [...(prev.registros || []), {
                    id: 'facial-' + Date.now(),
                    aprendizId: aprendiz.id,
                    aprendiz: { fullName: aprendiz.fullName },
                    presente: true,
                    metodo: 'facial',
                    timestamp: new Date().toISOString()
                  }]
                };
              });
            }}
            onClose={() => setFacialScannerOpen(false)}
          />
        )}
      </Modal>

      {/* Modal QR */}
      {qrModalOpen && activeSession && (
        <QRAttendance 
          asistenciaId={activeSession.id}
          onClose={() => setQrModalOpen(false)}
        />
      )}

      {/* Modal Registro Manual */}
      {manualModalOpen && activeSession && (
        <ManualAttendance
          asistenciaId={activeSession.id}
          aprendices={activeSession.materia?.ficha?.aprendices || []}
          alreadyRegistered={new Set((activeSession.registros || []).map(r => r.aprendizId))}
          onClose={() => setManualModalOpen(false)}
          onRegistered={(aprendiz) => {
            setActiveSession(prev => {
              if (!prev) return prev;
              if (prev.registros?.some(r => r.aprendizId === aprendiz.id)) return prev;
              return {
                ...prev,
                registros: [...(prev.registros || []), {
                  id: 'manual-' + Date.now(),
                  aprendizId: aprendiz.id,
                  aprendiz: { fullName: aprendiz.fullName },
                  presente: true,
                  metodo: 'manual',
                  timestamp: new Date().toISOString()
                }]
              };
            });
          }}
        />
      )}
    </div>
  );
}
