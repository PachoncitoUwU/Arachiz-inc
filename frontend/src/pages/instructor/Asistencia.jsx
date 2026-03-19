import React, { useState, useEffect } from 'react';
import fetchApi from '../../services/api';
import { Play, Square, Users, CheckCircle } from 'lucide-react';

export default function InstructorAsistencia() {
  const [materias, setMaterias] = useState([]);
  const [selectedMateria, setSelectedMateria] = useState('');
  const [activeSession, setActiveSession] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadMaterias();
  }, []);

  const loadMaterias = async () => {
    try {
      const data = await fetchApi('/materias/my-materias');
      setMaterias(data.materias);
      if (data.materias.length > 0) {
        setSelectedMateria(data.materias[0].id);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const startSession = async () => {
    try {
      const data = await fetchApi('/asistencias', {
        method: 'POST',
        body: JSON.stringify({ materiaId: selectedMateria, fecha: new Date().toISOString().split('T')[0] })
      });
      setActiveSession({ ...data.asistencia, registros: [] });
    } catch (err) {
      alert(err.message);
    }
  };

  const endSession = async () => {
    try {
      await fetchApi(`/asistencias/${activeSession.id}/finalizar`, { method: 'PUT' });
      setActiveSession(null);
      alert('Sesión finalizada. Las ausencias han sido marcadas automáticamente.');
    } catch (err) {
      alert(err.message);
    }
  };

  // Simulación de "Tiempo Real" con polling
  useEffect(() => {
    let interval;
    if (activeSession) {
      interval = setInterval(async () => {
        try {
          const data = await fetchApi(`/asistencias/materia/${activeSession.materiaId}`);
          const current = data.asistencias.find(a => a.id === activeSession.id);
          if (current) setActiveSession(current);
        } catch (err) {
          console.error(err);
        }
      }, 3000);
    }
    return () => clearInterval(interval);
  }, [activeSession]);

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-gray-800">Control de Asistencia</h1>
          <p className="text-gray-500 text-sm mt-1">Inicia y monitorea sesiones en tiempo real</p>
        </div>
      </div>

      <div className="card">
        <div className="flex flex-col md:flex-row gap-4 items-end">
          <div className="flex-1">
            <label className="block text-sm font-medium text-gray-700 mb-1">Seleccionar Materia</label>
            <select 
              className="input-field" 
              value={selectedMateria} 
              onChange={e => setSelectedMateria(e.target.value)}
              disabled={!!activeSession || materias.length === 0}
            >
              <option value="">-- Selecciona --</option>
              {materias.map(m => (
                <option key={m.id} value={m.id}>{m.nombre}</option>
              ))}
            </select>
          </div>
          <div>
            {!activeSession ? (
              <button 
                onClick={startSession} 
                disabled={!selectedMateria}
                className="btn-success flex items-center gap-2 h-10 w-full md:w-auto"
              >
                <Play size={18}/> Iniciar Sesión
              </button>
            ) : (
              <button 
                onClick={endSession} 
                className="btn-danger flex items-center gap-2 h-10 w-full md:w-auto"
              >
                <Square size={18}/> Finalizar Sesión
              </button>
            )}
          </div>
        </div>
      </div>

      {activeSession && (
        <div className="card border-t-4 border-t-google-green bg-green-50/30">
          <div className="flex justify-between items-center mb-6 border-b pb-4">
            <div>
              <h2 className="text-xl font-bold text-google-green flex items-center gap-2">
                <span className="relative flex h-3 w-3">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-3 w-3 bg-google-green"></span>
                </span>
                Sesión Activa
              </h2>
              <p className="text-sm text-gray-600 mt-1">Comparte el ID de la materia para que los aprendices se unan: <strong className="text-google-blue bg-white px-2 py-1 rounded shadow-sm code select-all">{activeSession.materiaId}</strong></p>
            </div>
            <div className="text-center bg-white p-3 rounded-lg shadow-sm">
              <p className="text-xs text-gray-500 uppercase font-bold tracking-wider mb-1">Total Registrados</p>
              <p className="text-3xl font-bold text-google-blue">{activeSession.registros?.length || 0}</p>
            </div>
          </div>

          <div>
            <h3 className="text-sm font-bold text-gray-700 mb-3 uppercase tracking-wider">Aprendices Presentes</h3>
            {activeSession.registros?.length === 0 ? (
              <div className="text-center py-8 text-gray-500 bg-white rounded-lg border border-dashed">
                <Users size={32} className="mx-auto mb-2 text-gray-300" />
                <p>Esperando registros...</p>
              </div>
            ) : (
              <ul className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
                {activeSession.registros?.map((reg, idx) => (
                  <li key={idx} className="bg-white p-3 rounded-lg border border-gray-200 shadow-sm flex items-center gap-3">
                    <CheckCircle className="text-google-green" size={20} />
                    <div>
                      <p className="font-medium text-gray-800 text-sm">Aprendiz {reg.aprendizId.substring(0,6)}</p>
                      <p className="text-xs text-gray-400">{new Date(reg.timestamp || Date.now()).toLocaleTimeString()}</p>
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
