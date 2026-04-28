import React, { useState, useEffect } from 'react';
import { AlertTriangle, X } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import fetchApi from '../services/api';

export default function ConflictosAlert({ userType, onDismiss }) {
  const navigate = useNavigate();
  const [conflictos, setConflictos] = useState([]);
  const [loading, setLoading] = useState(true);
  const [dismissed, setDismissed] = useState(false);

  useEffect(() => {
    if (userType === 'instructor') {
      loadConflictos();
    }
  }, [userType]);

  const loadConflictos = async () => {
    try {
      const data = await fetchApi('/horarios/conflictos');
      setConflictos(data.conflictos || []);
    } catch (err) {
      console.error('Error cargando conflictos:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleGoToHorario = () => {
    navigate('/instructor/horario');
  };

  const handleDismiss = () => {
    setDismissed(true);
    if (onDismiss) {
      onDismiss(conflictos);
    }
  };

  if (loading || conflictos.length === 0 || dismissed || userType !== 'instructor') {
    return null;
  }

  // Agrupar conflictos por día
  const diasConConflicto = [...new Set(conflictos.map(c => c.dia))];

  return (
    <div className="card mb-5 bg-red-50 dark:bg-red-900/20 border-l-4 border-red-500 animate-fade-in">
      <div className="flex items-center gap-3">
        <AlertTriangle size={18} className="text-red-500 shrink-0" />
        
        <div className="flex-1 min-w-0">
          <p className="text-sm font-semibold text-red-900 dark:text-red-100">
            {conflictos.length} conflicto(s) en: {diasConConflicto.join(', ')}
          </p>
          <p className="text-xs text-red-600 dark:text-red-400 mt-0.5">
            Generados por el administrador. Revisa tu horario.
          </p>
        </div>

        <button
          onClick={handleGoToHorario}
          className="btn-secondary text-xs px-3 py-1.5 bg-red-500 hover:bg-red-600 text-white border-red-600"
        >
          Resolver
        </button>
        
        <button 
          onClick={handleDismiss}
          className="btn-icon text-red-400 hover:text-red-600 dark:hover:text-red-300"
        >
          <X size={16} />
        </button>
      </div>
    </div>
  );
}
