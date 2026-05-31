import React, { useState, useEffect, useContext, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { AuthContext } from '../../context/AuthContext';
import fetchApi from '../../services/api';
import PageHeader from '../../components/PageHeader';
import Modal from '../../components/Modal';
import EmptyState from '../../components/EmptyState';
import { useToast } from '../../context/ToastContext';
import {
  Users, Plus, Copy, Check, Star
} from 'lucide-react';

const COLORES = [
  { border: '#4285F4', bg: 'bg-blue-50',   text: 'text-[#4285F4]' },
  { border: '#34A853', bg: 'bg-green-50',  text: 'text-[#34A853]' },
  { border: '#8b5cf6', bg: 'bg-purple-50', text: 'text-purple-600' },
  { border: '#FBBC05', bg: 'bg-yellow-50', text: 'text-yellow-600' },
  { border: '#EA4335', bg: 'bg-red-50',    text: 'text-[#EA4335]' },
];

// ─── FichaForm ────────────────────────────────────────────────────────────────
function FichaForm({ form, onChange, onSubmit, onCancel, saving, error }) {
  return (
    <form onSubmit={onSubmit} className="space-y-4">
      {error && <p className="text-sm text-red-500 bg-red-50 px-3 py-2 rounded-xl">{error}</p>}
      <div>
        <label className="input-label">Número de Ficha</label>
        <input required type="number" className="input-field" placeholder="3146013"
          value={form.numero} onChange={e => onChange('numero', e.target.value)}/>
      </div>
      <div>
        <label className="input-label">Nombre del Programa</label>
        <input required className="input-field" placeholder="Análisis y Desarrollo de Software"
          value={form.nombre} onChange={e => onChange('nombre', e.target.value)}/>
      </div>
      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className="input-label">Nivel</label>
          <select className="input-field" value={form.nivel} onChange={e => onChange('nivel', e.target.value)}>
            <option>Técnico</option><option>Tecnólogo</option>
          </select>
        </div>
        <div>
          <label className="input-label">Jornada</label>
          <select className="input-field" value={form.jornada} onChange={e => onChange('jornada', e.target.value)}>
            <option>Mañana</option><option>Tarde</option><option>Noche</option>
          </select>
        </div>
      </div>
      <div>
        <label className="input-label">Centro de Formación</label>
        <input required className="input-field" placeholder="CTPI Ibagué"
          value={form.centro} onChange={e => onChange('centro', e.target.value)}/>
      </div>
      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className="input-label">Región</label>
          <input required className="input-field" placeholder="Tolima"
            value={form.region} onChange={e => onChange('region', e.target.value)}/>
        </div>
        <div>
          <label className="input-label">Duración (meses)</label>
          <input required type="number" min="1" max="30" className="input-field" placeholder="24"
            value={form.duracion} onChange={e => onChange('duracion', e.target.value)}/>
          <p className="text-xs text-gray-400 mt-1">Máximo 30 meses</p>
        </div>
      </div>
      <div className="flex gap-3 pt-2">
        <button type="button" onClick={onCancel} className="btn-secondary flex-1">Cancelar</button>
        <button type="submit" disabled={saving} className="btn-primary flex-1">
          {saving ? 'Guardando...' : 'Crear Ficha'}
        </button>
      </div>
    </form>
  );
}

// ─── FichaCard — tarjeta compacta clickeable ─────────────────────────────────
function FichaCard({ ficha, currentUserId, onViewDetails, color, isPinned }) {
  const [copied, setCopied] = useState(false);

  const copyCode = (e) => {
    e.stopPropagation();
    navigator.clipboard.writeText(ficha.code);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleCardClick = () => {
    onViewDetails(ficha.id);
  };

  return (
    <div 
      onClick={handleCardClick}
      className="card overflow-hidden transition-all duration-200 cursor-pointer hover:shadow-lg hover:scale-[1.02] active:scale-[0.98]" 
      style={{ borderTopWidth: 3, borderTopColor: color.border }}
    >
      {/* Header de la card */}
      <div className="flex items-start justify-between mb-3">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1">
            <span className="text-lg font-bold text-gray-900 dark:text-white  dark:text-white">Ficha {ficha.numero}</span>
            {isPinned && (
              <Star size={16} fill="currentColor" className="text-yellow-500" />
            )}
          </div>
          <p className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-1">{ficha.nombre}</p>
          <p className="text-xs text-gray-400">{ficha.nivel} · {ficha.centro}</p>
          <p className="text-xs text-gray-400">{ficha.jornada}{ficha.region ? ` · ${ficha.region}` : ''}</p>
        </div>
      </div>

      {/* Stats rápidas */}
      <div className="grid grid-cols-3 gap-2">
        {[
          { label: 'Aprendices', value: ficha._count?.aprendices || 0 },
          { label: 'Materias', value: ficha._count?.materias || 0 },
          { label: 'Instructores', value: ficha._count?.instructores || 0 },
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

// ─── Página principal ─────────────────────────────────────────────────────────
const EMPTY_FORM = { numero: '', nombre: '', nivel: 'Tecnólogo', centro: '', jornada: 'Mañana', region: '', duracion: '' };

export default function AdminFichas() {
  const navigate = useNavigate();
  const { user } = useContext(AuthContext);
  const { showToast } = useToast();
  const [fichas, setFichas] = useState([]);
  const [loading, setLoading] = useState(true);
  const [modalCreate, setModalCreate] = useState(false);
  const [modalJoin, setModalJoin] = useState(false);
  const [form, setForm] = useState(EMPTY_FORM);
  const [joinCode, setJoinCode] = useState('');
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  
  // Estados para búsqueda y filtros
  const [searchQuery, setSearchQuery] = useState('');
  const [filterNivel, setFilterNivel] = useState('all'); // 'all' | 'Técnico' | 'Tecnólogo'

  const load = useCallback(async () => {
    try {
      setLoading(true);
      const data = await fetchApi('/admin/fichas');
      
      // Ordenar fichas: ancladas primero
      const pinnedFichas = JSON.parse(localStorage.getItem(`pinnedFichas_${user?.id}`) || '[]');
      const sorted = (data.fichas || []).sort((a, b) => {
        const aIsPinned = pinnedFichas.includes(a.id);
        const bIsPinned = pinnedFichas.includes(b.id);
        
        if (aIsPinned && !bIsPinned) return -1;
        if (!aIsPinned && bIsPinned) return 1;
        return 0;
      });
      
      setFichas(sorted);
    } catch (err) { 
      console.error(err); 
    } finally { 
      setLoading(false); 
    }
  }, [user]);

  useEffect(() => { load(); }, [load]);

  const handleField = useCallback((key, value) => {
    setForm(prev => ({ ...prev, [key]: value }));
  }, []);

  const handleCreate = async (e) => {
    e.preventDefault(); 
    setError(''); 
    setSaving(true);
    try {
      const data = await fetchApi('/admin/fichas', { 
        method: 'POST', 
        body: JSON.stringify(form) 
      });
      setModalCreate(false); 
      setForm(EMPTY_FORM);
      showToast('Ficha creada exitosamente', 'success'); 
      load();
      // Navegar al detalle de la ficha creada
      navigate(`/admin/fichas/${data.ficha.id}`);
    } catch (err) { 
      setError(err.message); 
    } finally { 
      setSaving(false); 
    }
  };

  const handleJoin = async (e) => {
    e.preventDefault(); 
    setError(''); 
    setSaving(true);
    try {
      await fetchApi(`/admin/join/${joinCode.toUpperCase()}`, { 
        method: 'POST'
      });
      setModalJoin(false); 
      setJoinCode('');
      showToast('Te uniste a la ficha exitosamente', 'success'); 
      load();
    } catch (err) { 
      setError(err.message); 
    } finally { 
      setSaving(false); 
    }
  };

  const handleViewDetails = (fichaId) => {
    navigate(`/admin/fichas/${fichaId}`);
  };

  return (
    <div className="animate-fade-in">
      <PageHeader
        title="Fichas de Formación"
        subtitle="Gestiona tus grupos académicos"
        action={
          <div className="flex gap-2">
            <button onClick={() => { setModalJoin(true); setError(''); }} className="btn-secondary">Unirse</button>
            <button onClick={() => { setModalCreate(true); setForm(EMPTY_FORM); setError(''); }} className="btn-primary flex items-center gap-2">
              <Plus size={16}/> Nueva Ficha
            </button>
          </div>
        }
      />

      {/* Búsqueda y Filtros */}
      {!loading && fichas.length > 0 && (
        <div className="card mb-5">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
            <div className="md:col-span-2">
              <input
                type="text"
                placeholder="Buscar por número, nombre o centro..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="input-field"
              />
            </div>
            <div>
              <select
                value={filterNivel}
                onChange={(e) => setFilterNivel(e.target.value)}
                className="input-field"
              >
                <option value="all">Todos los niveles</option>
                <option value="Técnico">Técnico</option>
                <option value="Tecnólogo">Tecnólogo</option>
              </select>
            </div>
          </div>
          {(searchQuery || filterNivel !== 'all') && (
            <button
              onClick={() => {
                setSearchQuery('');
                setFilterNivel('all');
              }}
              className="btn-secondary text-xs mt-3"
            >
              Limpiar filtros
            </button>
          )}
        </div>
      )}

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
            title="No tienes fichas aún"
            description="Crea tu primera ficha o únete a una existente con un código de invitación."
            action={<button onClick={() => { setModalCreate(true); setForm(EMPTY_FORM); }} className="btn-primary">Crear Ficha</button>}
          />
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-5">
          {fichas
            .filter(f => {
              // Filtro de búsqueda
              if (searchQuery) {
                const query = searchQuery.toLowerCase();
                const matchNumero = f.numero.toString().includes(query);
                const matchNombre = f.nombre?.toLowerCase().includes(query);
                const matchCentro = f.centro?.toLowerCase().includes(query);
                if (!matchNumero && !matchNombre && !matchCentro) return false;
              }
              
              // Filtro de nivel
              if (filterNivel !== 'all' && f.nivel !== filterNivel) return false;
              
              return true;
            })
            .map((f, idx) => {
            const pinnedFichas = JSON.parse(localStorage.getItem(`pinnedFichas_${user?.id}`) || '[]');
            const isPinned = pinnedFichas.includes(f.id);
            
            return (
              <FichaCard 
                key={f.id} 
                ficha={f} 
                currentUserId={user?.id}
                color={COLORES[idx % COLORES.length]}
                onViewDetails={handleViewDetails}
                isPinned={isPinned}
              />
            );
          })}
        </div>
      )}

      <Modal open={modalCreate} onClose={() => setModalCreate(false)} title="Crear Nueva Ficha">
        <FichaForm form={form} onChange={handleField} onSubmit={handleCreate}
          onCancel={() => setModalCreate(false)} saving={saving} error={error}/>
      </Modal>

      <Modal open={modalJoin} onClose={() => setModalJoin(false)} title="Unirse a una Ficha">
        <form onSubmit={handleJoin} className="space-y-4">
          {error && <p className="text-sm text-red-500 bg-red-50 px-3 py-2 rounded-lg">{error}</p>}
          <p className="text-sm text-gray-500">Ingresa el código de invitación del líder de la ficha.</p>
          <input 
            required 
            className="input-field text-center font-mono text-lg tracking-widest uppercase"
            placeholder="X7B9K2" 
            value={joinCode} 
            onChange={e => setJoinCode(e.target.value.toUpperCase())}
          />
          <div className="flex gap-3">
            <button type="button" onClick={() => setModalJoin(false)} className="btn-secondary flex-1">Cancelar</button>
            <button type="submit" disabled={saving} className="btn-primary flex-1">{saving ? 'Uniéndose...' : 'Unirse'}</button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
