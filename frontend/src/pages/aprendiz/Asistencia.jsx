import React, { useState, useEffect } from 'react';
import fetchApi from '../../services/api';
import { QrCode, LogIn, ClipboardCheck } from 'lucide-react';

export default function AprendizAsistencia() {
  const [fichas, setFichas] = useState([]);
  const [joinCode, setJoinCode] = useState('');
  const [sessionCode, setSessionCode] = useState('');
  const [loading, setLoading] = useState(true);

  const loadData = async () => {
    try {
      setLoading(true);
      const fichasData = await fetchApi(`/fichas/my-fichas`);
      setFichas(fichasData.fichas);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleJoinFicha = async (e) => {
    e.preventDefault();
    try {
      await fetchApi('/fichas/join', {
        method: 'POST',
        body: JSON.stringify({ code: joinCode })
      });
      alert('Te has unido a la ficha exitosamente.');
      loadData();
    } catch (err) {
      alert(err.message);
    }
  };

  const handleRegisterAsistencia = async (e) => {
    e.preventDefault();
    try {
      // Find session ID based on code/materia (For MVP we assume the code entered is the active session's materiaId for simplicity, or session ID)
      // Usually, the instructor shows the `materiaId` or `asistenciaId`. Let's assume the sessionCode is the `asistenciaId` or `materiaId`.
      // Getting active sessions for all my materias is complex in MVP, so let's simplify: 
      // User types the Materia ID shared by instructor, we hit an endpoint.
      // Wait, let's just use the Materia ID. The endpoint requires `asistenciaId`.
      // Let's first search sessions by materiaId to find the active one.
      
      const materiaSessions = await fetchApi(`/asistencias/materia/${sessionCode}`);
      const activeSession = materiaSessions.asistencias.find(a => a.activa);
      
      if (!activeSession) {
        throw new Error('No hay una sesión activa para este código.');
      }

      await fetchApi('/asistencias/registrar', {
        method: 'POST',
        body: JSON.stringify({ asistenciaId: activeSession.id, presente: true })
      });
      
      alert('Asistencia registrada correctamente.');
      setSessionCode('');
    } catch (err) {
      alert(err.message || 'Error al registrar asistencia.');
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-800">Asistencia y Ficha</h1>
        <p className="text-gray-500 text-sm mt-1">Regístrate en tu ficha académica y marca tu asistencia</p>
      </div>

      {loading ? (
        <div className="p-8">Cargando...</div>
      ) : fichas.length === 0 ? (
        <div className="card max-w-xl mx-auto border-t-4 border-t-google-blue">
          <div className="text-center mb-6">
            <div className="bg-blue-50 text-google-blue w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4">
              <LogIn size={32} />
            </div>
            <h2 className="text-xl font-bold text-gray-800">Unirse a una Ficha</h2>
            <p className="text-sm text-gray-500 mt-2">
              Ingresa el código proporcionado por tu instructor. Solo puedes pertenecer a una ficha al tiempo.
            </p>
          </div>
          <form onSubmit={handleJoinFicha} className="space-y-4">
            <div>
              <input 
                type="text" 
                required 
                className="input-field text-center font-mono text-lg tracking-widest uppercase"
                placeholder="X7B9K2"
                value={joinCode}
                onChange={e => setJoinCode(e.target.value.toUpperCase())}
              />
            </div>
            <button type="submit" className="btn-primary w-full">Vincularme a esta ficha</button>
          </form>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="card">
            <h2 className="text-lg font-bold text-gray-800 mb-4 border-b pb-2 flex items-center gap-2">
              <QrCode size={20} className="text-google-blue"/> Registrar Asistencia
            </h2>
            <p className="text-sm text-gray-600 mb-4">Ingresa el código de asistencia emitido por el instructor para registrar tu presencia en la sesión actual.</p>
            
            <form onSubmit={handleRegisterAsistencia} className="space-y-4">
               <div>
                  <input 
                    type="text" 
                    required 
                    className="input-field font-mono text-center tracking-wider"
                    placeholder="Código de Sesión / Materia"
                    value={sessionCode}
                    onChange={e => setSessionCode(e.target.value)}
                  />
               </div>
               <button type="submit" className="btn-success w-full flex justify-center items-center gap-2">
                  <ClipboardCheck size={18}/> Marcar Asistencia
               </button>
            </form>
          </div>
          
          <div className="card">
            <h2 className="text-lg font-bold text-gray-800 mb-4 border-b pb-2">Mi Historial</h2>
            <div className="flex flex-col items-center justify-center p-6 text-gray-500 border border-dashed rounded bg-gray-50">
               <p className="text-sm">El historial detallado estará disponible próximamente.</p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
