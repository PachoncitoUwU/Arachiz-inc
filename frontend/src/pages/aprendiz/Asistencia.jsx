import React, { useState, useEffect, useRef } from 'react';
import fetchApi from '../../services/api';
import PageHeader from '../../components/PageHeader';
import EmptyState from '../../components/EmptyState';
import { ClipboardCheck, LogIn, CheckCircle, XCircle, Clock, Users } from 'lucide-react';
import { io } from 'socket.io-client';

const API_BASE = import.meta.env.VITE_API_URL?.replace('/api', '') || 'http://localhost:3000';

export default function AprendizAsistencia() {
  const [fichas, setFichas] = useState([]);
  const [historial, setHistorial] = useState([]);
  const [joinCode, setJoinCode] = useState('');
  const [sessionId, setSessionId] = useState('');
  const [activeSession, setActiveSession] = useState(null);
  const [loading, setLoading] = useState(true);
  const [joining, setJoining] = useState(false);
  const [registering, setRegistering] = useState(false);
  const [registered, setRegistered] = useState(false);
  const [error, setError] = useState('');
  const socketRef = useRef(null);

  const loadData = async () => {
    try {
      setLoading(true);
      const [f, h] = await Promise.all([
        fetchApi('/fichas/my-fichas'),
        fetchApi('/asistencias/my-history'),
      ]);
      setFichas(f.fichas);
      setHistorial(h.registros);
    } catch (err) { console.error(err); }
    finally { setLoading(false); }
  };

  useEffect(() => { loadData(); }, []);

  const handleJoin = async (e) => {
    e.preventDefault();
    setError(''); setJoining(true);
    try {
      await fetchApi('/fichas/join', { method: 'POST', body: JSON.stringify({ code: joinCode }) });
      setJoinCode('');
      loadData();
    } catch (err) { setError(err.message); }
    finally { setJoining(false); }
  };

  const handleCheckSession = async (e) => {
    e.preventDefault();
    setError('');
    try {
      // El aprendiz ingresa el ID de sesión que el instructor comparte
      const d = await fetchApi(`/asistencias/${sessionId.trim()}`);
      if (!d?.session) {
        setError('No se encontró la sesión.');
        return;
      }
      if (!d.session.activa) {
        setError('Esta sesión ya finalizó.');
        return;
      }
      setActiveSession(d.session);
      connectSocket(d.session.id);
    } catch (err) { setError(err.message || 'Sesión no encontrada.'); }
  };

  const connectSocket = (sid) => {
    if (socketRef.current) socketRef.current.disconnect();
    const socket = io(API_BASE);
    socket.emit('joinSession', sid);
    socket.on('nuevaAsistencia', (data) => {
      setActiveSession(prev => {
        if (!prev) return prev;
        const exists = prev.registros?.some(r => r.aprendizId === data.aprendizId);
        if (exists) return prev;
        return { ...prev, registros: [...(prev.registros || []), data] };
      });
    });
    socket.on('sessionClosed', () => {
      setActiveSession(null);
      setRegistered(false);
      loadData();
    });
    socketRef.current = socket;
  };

  useEffect(() => () => socketRef.current?.disconnect(), []);

  const handleRegister = async () => {
    if (!activeSession) return;
    setError(''); setRegistering(true);
    try {
      await fetchApi('/asistencias/registrar', {
        method: 'POST',
        body: JSON.stringify({ asistenciaId: activeSession.id, metodo: 'codigo' })
      });
      setRegistered(true);
      loadData();
    } catch (err) { setError(err.message); }
    finally { setRegistering(false); }
  };

  const hasFicha = fichas.length > 0;
  const presentes = activeSession?.registros?.filter(r => r.presente !== false).length || 0;
  const total = activeSession?.materia?.ficha?.aprendices?.length || 0;

  if (loading) return (
    <div className="flex justify-center py-16">
      <div className="w-8 h-8 border-2 border-[#34A853] border-t-transparent rounded-full animate-spin"/>
    </div>
  );

  return (
    <div className="animate-fade-in space-y-5">
      <PageHeader title="Asistencia" subtitle="Regístrate en sesiones activas" />

      {/* Sin ficha */}
      {!hasFicha ? (
        <div className="card max-w-md mx-auto">
          <div className="text-center mb-6">
            <div className="w-16 h-16 bg-blue-50 rounded-2xl flex items-center justify-center mx-auto mb-4">
              <LogIn size={28} className="text-[#4285F4]"/>
            </div>
            <h2 className="text-lg font-bold text-gray-900">Unirse a una Ficha</h2>
            <p className="text-sm text-gray-500 mt-1">Ingresa el código de invitación de tu instructor.</p>
          </div>
          {error && <p className="text-sm text-red-500 bg-red-50 px-3 py-2 rounded-lg mb-3">{error}</p>}
          <form onSubmit={handleJoin} className="space-y-3">
            <input required className="input-field text-center font-mono text-xl tracking-widest uppercase"
              placeholder="X7B9K2" value={joinCode}
              onChange={e => setJoinCode(e.target.value.toUpperCase())} />
            <button type="submit" disabled={joining} className="btn-primary w-full">
              {joining ? 'Uniéndose...' : 'Vincularme a esta ficha'}
            </button>
          </form>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
          {/* Registrar asistencia */}
          <div className="card">
            <h2 className="font-bold text-gray-900 mb-4 flex items-center gap-2">
              <ClipboardCheck size={18} className="text-[#34A853]"/> Registrar Asistencia
            </h2>

            {!activeSession ? (
              <>
                <p className="text-sm text-gray-500 mb-4">Ingresa el ID de sesión que te compartió el instructor.</p>
                {error && <p className="text-sm text-red-500 bg-red-50 px-3 py-2 rounded-lg mb-3">{error}</p>}
                <form onSubmit={handleCheckSession} className="space-y-3">
                  <input required className="input-field font-mono text-sm"
                    placeholder="ID de sesión (ej: clxyz123...)"
                    value={sessionId} onChange={e => setSessionId(e.target.value)} />
                  <button type="submit" className="btn-success w-full">Buscar Sesión</button>
                </form>
              </>
            ) : (
              <div className="space-y-4">
                <div className="p-3 bg-green-50 rounded-xl border border-green-100">
                  <div className="flex items-center gap-2 mb-1">
                    <span className="relative flex h-2.5 w-2.5">
                      <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-[#34A853] opacity-75"/>
                      <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-[#34A853]"/>
                    </span>
                    <span className="text-sm font-bold text-[#34A853]">Sesión Activa</span>
                  </div>
                  <p className="text-sm font-semibold text-gray-800">{activeSession.materia?.nombre}</p>
                  <p className="text-xs text-gray-500">Ficha {activeSession.materia?.ficha?.numero} · {activeSession.materia?.instructor?.fullName}</p>
                  <div className="flex items-center gap-3 mt-2 text-xs text-gray-500">
                    <span className="flex items-center gap-1"><Users size={12}/> {presentes}/{total} presentes</span>
                  </div>
                </div>

                {error && <p className="text-sm text-red-500 bg-red-50 px-3 py-2 rounded-lg">{error}</p>}

                {registered ? (
                  <div className="flex items-center gap-3 p-3 bg-green-50 rounded-xl">
                    <CheckCircle size={20} className="text-[#34A853]"/>
                    <p className="text-sm font-semibold text-[#34A853]">¡Asistencia registrada correctamente!</p>
                  </div>
                ) : (
                  <button onClick={handleRegister} disabled={registering} className="btn-success w-full">
                    {registering ? 'Registrando...' : '✓ Marcar mi Asistencia'}
                  </button>
                )}

                <button onClick={() => { setActiveSession(null); setRegistered(false); setError(''); }}
                  className="btn-ghost w-full text-sm">
                  Salir de la sesión
                </button>

                {/* Lista de compañeros */}
                {activeSession.registros?.length > 0 && (
                  <div>
                    <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2">Compañeros presentes</p>
                    <div className="space-y-1 max-h-40 overflow-y-auto">
                      {activeSession.registros.filter(r => r.presente !== false).map((r, i) => (
                        <div key={i} className="flex items-center gap-2 px-2 py-1.5 rounded-lg bg-gray-50">
                          <CheckCircle size={13} className="text-[#34A853]"/>
                          <span className="text-xs text-gray-700">{r.aprendiz?.fullName || r.fullName || 'Aprendiz'}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Historial */}
          <div className="card">
            <h2 className="font-bold text-gray-900 mb-4">Historial de Asistencias</h2>
            {historial.length === 0 ? (
              <EmptyState icon={<Clock size={28}/>} title="Sin registros" description="Aún no tienes asistencias registradas." />
            ) : (
              <div className="space-y-2 max-h-96 overflow-y-auto">
                {historial.map(r => (
                  <div key={r.id} className="flex items-center justify-between p-2.5 rounded-xl bg-gray-50">
                    <div className="flex items-center gap-2.5">
                      {r.presente
                        ? <CheckCircle size={15} className="text-[#34A853] shrink-0"/>
                        : <XCircle size={15} className="text-[#EA4335] shrink-0"/>
                      }
                      <div>
                        <p className="text-xs font-semibold text-gray-800">{r.asistencia?.materia?.nombre}</p>
                        <p className="text-xs text-gray-400">{r.asistencia?.fecha} · {r.metodo}</p>
                      </div>
                    </div>
                    <span className={`badge ${r.presente ? 'badge-success' : 'badge-danger'}`}>
                      {r.presente ? 'Presente' : 'Ausente'}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
