import React, { useState, useEffect, useContext, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { AuthContext } from '../../context/AuthContext';
import fetchApi from '../../services/api';
import PageHeader from '../../components/PageHeader';
import EmptyState from '../../components/EmptyState';
import { useToast } from '../../context/ToastContext';
import { Users, BookOpen } from 'lucide-react';

const API_BASE = import.meta.env.VITE_SOCKET_URL || 'http://localhost:3000';

const resolveAvatar = (url) => {
  if (!url) return null;
  if (url.startsWith('data:') || url.startsWith('http') || url.startsWith('blob:')) return url;
  return `${API_BASE}${url}`;
};

const COLORES = [
  { border: '#4285F4', bg: 'bg-blue-50',   text: 'text-[#4285F4]' },
  { border: '#34A853', bg: 'bg-green-50',  text: 'text-[#34A853]' },
  { border: '#8b5cf6', bg: 'bg-purple-50', text: 'text-purple-600' },
  { border: '#FBBC05', bg: 'bg-yellow-50', text: 'text-yellow-600' },
  { border: '#EA4335', bg: 'bg-red-50',    text: 'text-[#EA4335]' },
];

function FichaCard({ ficha, color, onViewDetails }) {
  const handleCardClick = () => {
    onViewDetails(ficha.id);
  };

  return (
    <div 
      onClick={handleCardClick}
      className="card overflow-hidden transition-all duration-200 cursor-pointer hover:shadow-lg hover:scale-[1.02] active:scale-[0.98]" 
      style={{ borderTopWidth: 3, borderTopColor: color.border }}
    >
      <div className="flex items-start justify-between mb-3">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1">
            <span className="text-lg font-bold text-gray-900">Ficha {ficha.numero}</span>
          </div>
          <p className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-1">{ficha.nombre}</p>
          <p className="text-xs text-gray-400">{ficha.nivel} · {ficha.centro}</p>
          <p className="text-xs text-gray-400">{ficha.jornada}{ficha.region ? ` · ${ficha.region}` : ''}</p>
        </div>
      </div>

      <div className="grid grid-cols-3 gap-2">
        {[
          { label: 'Aprendices', value: ficha.aprendices?.length || 0 },
          { label: 'Materias', value: ficha.materias?.length || 0 },
          { label: 'Instructores', value: ficha.instructores?.length || 0 },
        ].map(s => (
          <div key={s.label} className="text-center p-2 bg-gray-50 rounded-xl">
            <p className="text-base font-bold text-gray-800">{s.value}</p>
            <p className="text-[10px] text-gray-400 uppercase font-semibold">{s.label}</p>
          </div>
        ))}
      </div>
    </div>
  );
}

export default function AprendizFichas() {
  const navigate = useNavigate();
  const { user } = useContext(AuthContext);
  const { showToast } = useToast();
  const [fichas, setFichas] = useState([]);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    try {
      setLoading(true);
      const data = await fetchApi('/fichas/my-fichas');
      setFichas(data.fichas);
    } catch (err) {
      showToast(err.message || 'Error al cargar fichas', 'error');
    } finally {
      setLoading(false);
    }
  }, [showToast]);

  useEffect(() => { load(); }, [load]);

  const handleViewDetails = (fichaId) => {
    navigate(`/aprendiz/fichas/${fichaId}`);
  };

  return (
    <div className="animate-fade-in">
      <PageHeader
        title="Mis Fichas"
        subtitle="Fichas de formación en las que estás inscrito"
      />

      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-5">
          {[1,2,3].map(i => (
            <div key={i} className="card animate-pulse">
              <div className="h-5 bg-gray-100 rounded w-1/2 mb-3"/>
              <div className="h-10 bg-gray-100 rounded-xl mb-3"/>
              <div className="grid grid-cols-3 gap-2">{[1,2,3].map(j => <div key={j} className="h-12 bg-gray-100 rounded-lg"/>)}</div>
            </div>
          ))}
        </div>
      ) : fichas.length === 0 ? (
        <div className="card">
          <EmptyState 
            icon={<Users size={32}/>} 
            title="No estás inscrito en ninguna ficha"
            description="Solicita a tu instructor el código de invitación para unirte a una ficha."
          />
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-5">
          {fichas.map((f, idx) => (
            <FichaCard 
              key={f.id} 
              ficha={f} 
              color={COLORES[idx % COLORES.length]}
              onViewDetails={handleViewDetails}
            />
          ))}
        </div>
      )}
    </div>
  );
}
