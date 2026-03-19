import React, { useState, useEffect, useRef } from 'react';
import fetchApi from '../../services/api';
import PageHeader from '../../components/PageHeader';
import EmptyState from '../../components/EmptyState';
import { Play, Square, Users, CheckCircle, XCircle, Clock, BookOpen } from 'lucide-react';
import { io } from 'socket.io-client';

const API_BASE = import.meta.env.VITE_API_URL?.replace('/api', '') || 'http://localhost:3000';

function Timer({ startTime }) {
  const [elapsed, setElapsed] = useState(0);
  useEffect(() => {
    const start = new Date(startTime).getTime();
    const interval = setInterval(() => setElapsed(Math.floor((Date.now() - start) / 1000)), 1000);
    return () => clearInterval(interval);
  }, [startTime]);
  const h = Math.floor(elapsed / 3600);
  const m = Math.floor((elapsed % 3600) / 60);
  const s = elapsed % 60;
  return <span className="font-mono">{h > 0 ? `${h}:` : ''}{String(m).padStart(2,'0')}:{String(s).padStart(2,'0')}</span>;
}

export default function InstructorAsistencia() {
  const [materias, setMaterias] = useState([]);
  const [selectedMateria, setSelectedMateria] = useState('');
  const [activeSession, setActiveSession] = useState(null);
  const [sessions, setSessions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [starting, setStarting] = useState(false);
  const socketRef = useRef(null);

  useEffect(() => {
    fetchApi('/materias/my-materias').then(d => {
      setMaterias(d.materias);
      if (d.materias.length > 0) setSelectedMateria(d.materias[0].id);
    }).catch(console.error).finally(() => setLoading(false));
  }, []);

  useEffect(() => {
    if (!selectedMateria) return;
    loadSessions();
    checkActiveSession();
  }, [selectedMateria]);

  const loadSessions = async () => {
    try {
      const d = await fetchApi(`/asistencias/materia/${selectedMateria}`);
      setSessions(d.asistencias.filter(a => !a.activa).slice(0, 5));
    } catch {}
  };

  const checkActiveSession = async () => {
    try {
      const d = await fetchApi(`/asistencias/materia/${selectedMateria}/active`);
      if (d.session) {
        setActiveSession(d.session);
        connectSocket(d.session.id);
      } else {
        setActiveSession(null);
      }
    } catch {}
  };

  const connectSocket = (sessionId) => {
    if (socketRef.current) socketRef.current.disconnect();
    const socket = io(API_BASE);
    socket.emit('joinSession', sessionId);
    socket.on('nuevaAsistencia', (data) => {
      setActiveSession(prev => {
        if (!prev) return prev;
        const exists = prev.registros?.some(r => r.aprendizId === data.aprendizId);
        if (exists) return prev;
        return { ...prev, registros: [...(prev.registros || []), { ...data, id: Date.now() }] };
      });
    });
    socket.on('sessionClosed', () => {
      setActiveSession(null);
      loadSessions();
    });
    socketRef.current = socket;
  };

  useEffect(() => () => socketRef.current?.disconnect(), []);

  const startSession = async () => {
    setStarting(true);
    try {
      const d = await fetchApi('/asistencias', {
        method: 'POST',
        body: JSON.stringify({ materiaId: selectedMateria, fecha: new Date().toISOString().split('T')[0] })
      });
      setActiveSession({ ...d.asistencia, registros: [] });
      connectSocket(d.asistencia.id);
    } catch (err) { alert(err.message); }
    finally { setStarting(false); }
  };

  const endSession = async () => {
    if (!confirm('¿Finalizar la sesión? Los aprendices sin registro serán marcados como ausentes.')) return;
    try {
      await fetchApi(`/asistencias/${activeSession.id}/finalizar`, { method: 'PUT' });
      socketRef.current?.disconnect();
      setActiveSession(null);
      loadSessions();
    } catch (err) { alert(err.message); }
  };

  const totalAprendices = activeSession?.materia?.ficha?.aprendices?.length || 0;
  const presentes = activeSession?.registros?.filter(r => r.presente !== false).length || 0;
  const pendientes = totalAprendices - presentes;

  const materiaActual = materias.find(m => m.id === selectedMateria);

  return (
    <div className="animate-fade-in space-y-5">
      <PageHeader title="Control de Asistencia" subtitle="Inicia y monitorea sesiones en tiempo real" />

      {/* Selector */}
      <div className="card">
        <div className="flex flex-col sm:flex-row gap-4 items-end">
          <div className="flex-1">
            <label className="input-label">Materia</label>
            <select className="input-field" value={selectedMateria}
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
              <button onClick={startSession} disabled={!selectedMateria || starting}
                className="btn-success flex items-center gap-2">
                <Play size={16}/> {starting ? 'Iniciando...' : 'Iniciar Sesión'}
              </button>
            ) : (
              <button onClick={endSession} className="btn-danger flex items-center gap-2">
                <Square size={16}/> Finalizar Sesión
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Sesión activa */}
      {activeSession && (
        <div className="card border-l-4 border-l-[#34A853]">
          <div className="flex flex-wrap items-center justify-between gap-4 mb-5">
            <div className="flex items-center gap-3">
              <span className="relative flex h-3 w-3">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-[#34A853] opacity-75"/>
                <span className="relative inline-flex rounded-full h-3 w-3 bg-[#34A853]"/>
              </span>
              <div>
                <p className="font-bold text-gray-900">{activeSession.materia?.nombre}</p>
                <p className="text-xs text-gray-400">Ficha {activeSession.materia?.ficha?.numero} · {activeSession.materia?.instructor?.fullName}</p>
              </div>
            </div>
            <div className="flex items-center gap-2 text-sm text-gray-500">
              <Clock size={14}/>
              <Timer startTime={activeSession.timestamp} />
            </div>
          </div>

          {/* Contadores */}
          <div className="grid grid-cols-3 gap-3 mb-5">
            {[
              { label: 'Total', value: totalAprendices, color: 'bg-gray-50 text-gray-700' },
              { label: 'Presentes', value: presentes, color: 'bg-green-50 text-[#34A853]' },
              { label: 'Pendientes', value: pendientes, color: 'bg-yellow-50 text-[#FBBC05]' },
            ].map(s => (
              <div key={s.label} className={`${s.color} rounded-xl p-3 text-center`}>
                <p className="text-2xl font-bold">{s.value}</p>
                <p className="text-xs font-medium mt-0.5">{s.label}</p>
              </div>
            ))}
          </div>

          {/* ID de sesión para compartir */}
          <div className="bg-blue-50 rounded-xl p-3 mb-4">
            <p className="text-xs text-gray-500 mb-1">ID de sesión (comparte con aprendices):</p>
            <p className="font-mono text-sm font-bold text-[#4285F4] select-all break-all">{activeSession.id}</p>
          </div>

          {/* Lista de registros */}
          <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-3">Aprendices registrados</h3>
          {presentes === 0 ? (
            <div className="text-center py-8 text-gray-400 border border-dashed rounded-xl">
              <Users size={28} className="mx-auto mb-2 opacity-30"/>
              <p className="text-sm">Esperando registros...</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 max-h-64 overflow-y-auto">
              {activeSession.registros?.filter(r => r.presente !== false).map((reg, i) => (
                <div key={reg.id || i} className="flex items-center gap-3 p-2.5 bg-green-50 rounded-xl">
                  <CheckCircle size={16} className="text-[#34A853] shrink-0"/>
                  <div className="min-w-0">
                    <p className="text-xs font-semibold text-gray-800 truncate">{reg.aprendiz?.fullName || reg.fullName || 'Aprendiz'}</p>
                    <p className="text-xs text-gray-400">{reg.metodo || 'codigo'}</p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Historial de sesiones */}
      {sessions.length > 0 && (
        <div className="card">
          <h2 className="font-bold text-gray-900 mb-4">Sesiones Anteriores</h2>
          <div className="space-y-2">
            {sessions.map(s => {
              const presentes = s.registros?.filter(r => r.presente).length || 0;
              const total = s.registros?.length || 0;
              return (
                <div key={s.id} className="flex items-center justify-between p-3 rounded-xl bg-gray-50">
                  <div>
                    <p className="text-sm font-medium text-gray-800">{s.fecha}</p>
                    <p className="text-xs text-gray-400">{s.instructor?.fullName}</p>
                  </div>
                  <div className="text-right">
                    <p className="text-sm font-bold text-gray-800">{presentes}/{total}</p>
                    <p className="text-xs text-gray-400">presentes</p>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {!loading && materias.length === 0 && (
        <div className="card">
          <EmptyState icon={<BookOpen size={32}/>} title="Sin materias" description="Crea materias en tus fichas para iniciar sesiones de asistencia." />
        </div>
      )}
    </div>
  );
}
