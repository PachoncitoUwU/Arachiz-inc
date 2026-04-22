import React, { useState, useEffect, useContext, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { AuthContext } from '../../context/AuthContext';
import fetchApi from '../../services/api';
import PageHeader from '../../components/PageHeader';
import Modal from '../../components/Modal';
import EmptyState from '../../components/EmptyState';
import EnrollModal from '../../components/EnrollModal';
import { useToast } from '../../context/ToastContext';
import {
  Users, Plus, Copy, Check
} from 'lucide-react';

const API_BASE = import.meta.env.VITE_SOCKET_URL || 'http://localhost:3000';

// Helper para resolver cualquier tipo de avatarUrl
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

// ─── FichaForm ────────────────────────────────────────────────────────────────
function FichaForm({ form, onChange, onSubmit, onCancel, saving, error, isEdit }) {
  return (
    <form onSubmit={onSubmit} className="space-y-4">
      {error && <p className="text-sm text-red-500 bg-red-50 px-3 py-2 rounded-xl">{error}</p>}
      <div>
        <label className="input-label">Número de Ficha</label>
        <input required type="number" className="input-field" placeholder="3146013"
          value={form.numero} onChange={e => onChange('numero', e.target.value)} disabled={isEdit}/>
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
          {saving ? 'Guardando...' : isEdit ? 'Guardar Cambios' : 'Crear Ficha'}
        </button>
      </div>
    </form>
  );
}

// ─── FichaCard — tarjeta compacta clickeable ─────────────────────────────────
function FichaCard({ ficha, currentUserId, onViewDetails, color }) {
  const [copied, setCopied] = useState(false);
  const isAdmin = ficha.instructorAdminId === currentUserId;

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
            <span className="text-lg font-bold text-gray-900">Ficha {ficha.numero}</span>
            {isAdmin && <span className="badge badge-info">Admin</span>}
          </div>
          <p className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-1">{ficha.nombre}</p>
          <p className="text-xs text-gray-400">{ficha.nivel} · {ficha.centro}</p>
          <p className="text-xs text-gray-400">{ficha.jornada}{ficha.region ? ` · ${ficha.region}` : ''}</p>
        </div>
      </div>

      {/* Código de invitación */}
      <div className={`flex items-center gap-2 p-2.5 ${color.bg} rounded-xl mb-3`}>
        <span className="text-xs text-gray-500 font-semibold uppercase tracking-wide">Código:</span>
        <span className={`font-mono font-bold ${color.text} tracking-widest text-sm flex-1 select-all`}>
          {ficha.code}
        </span>
        <button onClick={copyCode} className="btn-icon text-gray-400 hover:bg-white/60 w-7 h-7" title="Copiar código">
          {copied ? <Check size={14} className="text-[#34A853]"/> : <Copy size={14}/>}
        </button>
      </div>

      {/* Stats rápidas */}
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

// ─── Página principal ─────────────────────────────────────────────────────────
const EMPTY_FORM = { numero: '', nombre: '', nivel: 'Tecnólogo', centro: '', jornada: 'Mañana', region: '', duracion: '' };

export default function InstructorFichas() {
  const navigate = useNavigate();
  const { user } = useContext(AuthContext);
  const { showToast } = useToast();
  const [fichas, setFichas]       = useState([]);
  const [loading, setLoading]     = useState(true);
  const [modalCreate, setModalCreate] = useState(false);
  const [modalJoin, setModalJoin] = useState(false);
  const [editFicha, setEditFicha] = useState(null);
  const [form, setForm]           = useState(EMPTY_FORM);
  const [joinCode, setJoinCode]   = useState('');
  const [saving, setSaving]       = useState(false);
  const [error, setError]         = useState('');

  const load = useCallback(async () => {
    try {
      setLoading(true);
      const data = await fetchApi('/fichas/my-fichas');
      setFichas(data.fichas);
    } catch (err) { console.error(err); }
    finally { setLoading(false); }
  }, []);

  useEffect(() => { load(); }, [load]);

  const handleField = useCallback((key, value) => {
    setForm(prev => ({ ...prev, [key]: value }));
  }, []);

  const handleCreate = async (e) => {
    e.preventDefault(); setError(''); setSaving(true);
    try {
      await fetchApi('/fichas', { method: 'POST', body: JSON.stringify(form) });
      setModalCreate(false); setForm(EMPTY_FORM);
      showToast('Ficha creada exitosamente', 'success'); load();
    } catch (err) { setError(err.message); }
    finally { setSaving(false); }
  };

  const handleEdit = async (e) => {
    e.preventDefault(); setError(''); setSaving(true);
    try {
      await fetchApi(`/fichas/${editFicha.id}`, { method: 'PUT', body: JSON.stringify(form) });
      setEditFicha(null); showToast('Ficha actualizada', 'success'); load();
    } catch (err) { setError(err.message); }
    finally { setSaving(false); }
  };

  const openEdit = (ficha) => {
    setForm({ 
      numero: ficha.numero, 
      nombre: ficha.nombre,
      nivel: ficha.nivel, 
      centro: ficha.centro, 
      jornada: ficha.jornada, 
      region: ficha.region || '', 
      duracion: ficha.duracion || '' 
    });
    setEditFicha(ficha); setError('');
  };

  const handleJoin = async (e) => {
    e.preventDefault(); setError(''); setSaving(true);
    try {
      await fetchApi('/fichas/join', { method: 'POST', body: JSON.stringify({ code: joinCode }) });
      setModalJoin(false); setJoinCode('');
      showToast('Te uniste a la ficha exitosamente', 'success'); load();
    } catch (err) { setError(err.message); }
    finally { setSaving(false); }
  };

  const handleRegenerate = async (id) => {
    if (!confirm('¿Regenerar el código? El anterior dejará de funcionar.')) return;
    try {
      await fetchApi(`/fichas/${id}/regenerate-code`, { method: 'POST' });
      showToast('Código regenerado', 'success'); load();
    } catch (err) { showToast(err.message, 'error'); }
  };

  const handleViewDetails = (fichaId) => {
    navigate(`/instructor/fichas/${fichaId}`);
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
          <EmptyState icon={<Users size={32}/>} title="No tienes fichas aún"
            description="Crea tu primera ficha o únete a una existente con un código de invitación."
            action={<button onClick={() => { setModalCreate(true); setForm(EMPTY_FORM); }} className="btn-primary">Crear Ficha</button>}
          />
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-5">
          {fichas.map((f, idx) => (
            <FichaCard 
              key={f.id} 
              ficha={f} 
              currentUserId={user?.id}
              color={COLORES[idx % COLORES.length]}
              onViewDetails={handleViewDetails}
            />
          ))}
        </div>
      )}

      <Modal open={modalCreate} onClose={() => setModalCreate(false)} title="Crear Nueva Ficha">
        <FichaForm form={form} onChange={handleField} onSubmit={handleCreate}
          onCancel={() => setModalCreate(false)} saving={saving} error={error} isEdit={false}/>
      </Modal>

      <Modal open={!!editFicha} onClose={() => setEditFicha(null)} title="Editar Ficha">
        <FichaForm form={form} onChange={handleField} onSubmit={handleEdit}
          onCancel={() => setEditFicha(null)} saving={saving} error={error} isEdit={true}/>
      </Modal>

      <Modal open={modalJoin} onClose={() => setModalJoin(false)} title="Unirse a una Ficha">
        <form onSubmit={handleJoin} className="space-y-4">
          {error && <p className="text-sm text-red-500 bg-red-50 px-3 py-2 rounded-lg">{error}</p>}
          <p className="text-sm text-gray-500">Ingresa el código de invitación del administrador de la ficha.</p>
          <input required className="input-field text-center font-mono text-lg tracking-widest uppercase"
            placeholder="X7B9K2" value={joinCode} onChange={e => setJoinCode(e.target.value.toUpperCase())}/>
          <div className="flex gap-3">
            <button type="button" onClick={() => setModalJoin(false)} className="btn-secondary flex-1">Cancelar</button>
            <button type="submit" disabled={saving} className="btn-primary flex-1">{saving ? 'Uniéndose...' : 'Unirse'}</button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
