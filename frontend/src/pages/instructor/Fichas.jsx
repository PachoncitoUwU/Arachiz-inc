import React, { useState, useEffect, useContext, useCallback } from 'react';
import { AuthContext } from '../../context/AuthContext';
import fetchApi from '../../services/api';
import PageHeader from '../../components/PageHeader';
import Modal from '../../components/Modal';
import EmptyState from '../../components/EmptyState';
import { useToast } from '../../context/ToastContext';
import {
  Users, Plus, Copy, RefreshCw, ChevronDown, ChevronUp,
  UserMinus, Edit2, Check
} from 'lucide-react';

// ─── FichaForm extraído FUERA del componente padre para evitar re-mount ───────
function FichaForm({ form, onChange, onSubmit, onCancel, saving, error, isEdit }) {
  return (
    <form onSubmit={onSubmit} className="space-y-4">
      {error && <p className="text-sm text-red-500 bg-red-50 px-3 py-2 rounded-xl">{error}</p>}

      <div>
        <label className="input-label">Número de Ficha</label>
        <input
          required
          className="input-field"
          placeholder="3146013"
          value={form.numero}
          onChange={e => onChange('numero', e.target.value)}
          disabled={isEdit}
        />
      </div>

      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className="input-label">Nivel</label>
          <select className="input-field" value={form.nivel} onChange={e => onChange('nivel', e.target.value)}>
            <option>Técnico</option>
            <option>Tecnólogo</option>
            <option>Especialización</option>
          </select>
        </div>
        <div>
          <label className="input-label">Jornada</label>
          <select className="input-field" value={form.jornada} onChange={e => onChange('jornada', e.target.value)}>
            <option>Mañana</option>
            <option>Tarde</option>
            <option>Noche</option>
          </select>
        </div>
      </div>

      <div>
        <label className="input-label">Centro de Formación</label>
        <input
          required
          className="input-field"
          placeholder="CTPI Ibagué"
          value={form.centro}
          onChange={e => onChange('centro', e.target.value)}
        />
      </div>

      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className="input-label">Región</label>
          <input
            className="input-field"
            placeholder="Tolima"
            value={form.region}
            onChange={e => onChange('region', e.target.value)}
          />
        </div>
        <div>
          <label className="input-label">Duración (meses)</label>
          <input
            type="number"
            className="input-field"
            placeholder="24"
            value={form.duracion}
            onChange={e => onChange('duracion', e.target.value)}
          />
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

// ─── FichaCard ────────────────────────────────────────────────────────────────
function FichaCard({ ficha, currentUserId, onRegenerate, onEdit, onRemoveAprendiz }) {
  const [expanded, setExpanded] = useState(false);
  const [copied, setCopied] = useState(false);
  const isAdmin = ficha.instructorAdminId === currentUserId;

  const copyCode = () => {
    navigator.clipboard.writeText(ficha.code);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="card hover:shadow-card hover:-translate-y-0.5 transition-all duration-200">
      <div className="flex items-start justify-between mb-3">
        <div>
          <div className="flex items-center gap-2">
            <span className="text-lg font-bold text-gray-900">Ficha {ficha.numero}</span>
            {isAdmin && <span className="badge badge-info">Admin</span>}
          </div>
          <p className="text-xs text-gray-400 mt-0.5">{ficha.nivel} · {ficha.centro} · {ficha.jornada}</p>
          {ficha.region && <p className="text-xs text-gray-400">{ficha.region}{ficha.duracion ? ` · ${ficha.duracion} meses` : ''}</p>}
        </div>
        {isAdmin && (
          <button onClick={() => onEdit(ficha)} className="btn-icon text-gray-400 hover:bg-gray-100">
            <Edit2 size={15} />
          </button>
        )}
      </div>

      {/* Código */}
      <div className="flex items-center gap-2 p-2.5 bg-gray-50 rounded-xl mb-3">
        <span className="text-xs text-gray-500 font-medium">Código:</span>
        <span className="font-mono font-bold text-[#4285F4] tracking-widest text-sm flex-1 select-all">{ficha.code}</span>
        <button onClick={copyCode} className="btn-icon text-gray-400 hover:bg-white hover:shadow-sm" title="Copiar">
          {copied ? <Check size={15} className="text-[#34A853]" /> : <Copy size={15} />}
        </button>
        {isAdmin && (
          <button onClick={() => onRegenerate(ficha.id)} className="btn-icon text-gray-400 hover:bg-white hover:shadow-sm" title="Regenerar">
            <RefreshCw size={15} />
          </button>
        )}
      </div>

      {/* Stats */}
      <div className="grid grid-cols-3 gap-2 mb-3">
        {[
          { label: 'Aprendices', value: ficha.aprendices?.length || 0 },
          { label: 'Instructores', value: ficha.instructores?.length || 0 },
          { label: 'Materias', value: ficha.materias?.length || 0 },
        ].map(s => (
          <div key={s.label} className="text-center p-2 bg-gray-50 rounded-lg">
            <p className="text-lg font-bold text-gray-800">{s.value}</p>
            <p className="text-xs text-gray-400">{s.label}</p>
          </div>
        ))}
      </div>

      <button
        onClick={() => setExpanded(!expanded)}
        className="w-full flex items-center justify-between text-xs text-gray-500 hover:text-gray-700 py-1 transition-colors"
      >
        <span>Ver aprendices</span>
        {expanded ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
      </button>

      {expanded && (
        <div className="mt-2 space-y-1 max-h-48 overflow-y-auto">
          {ficha.aprendices?.length === 0 ? (
            <p className="text-xs text-gray-400 text-center py-3">Sin aprendices aún</p>
          ) : ficha.aprendices?.map(a => (
            <div key={a.id} className="flex items-center justify-between px-2 py-1.5 rounded-lg hover:bg-gray-50">
              <div>
                <p className="text-xs font-medium text-gray-700">{a.fullName}</p>
                <p className="text-xs text-gray-400">{a.document}</p>
              </div>
              {isAdmin && (
                <button onClick={() => onRemoveAprendiz(ficha.id, a.id)}
                  className="btn-icon text-red-400 hover:bg-red-50 w-7 h-7">
                  <UserMinus size={13} />
                </button>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

// ─── Página principal ─────────────────────────────────────────────────────────
const EMPTY_FORM = { numero: '', nivel: 'Tecnólogo', centro: '', jornada: 'Mañana', region: '', duracion: '' };

export default function InstructorFichas() {
  const { user } = useContext(AuthContext);
  const { showToast } = useToast();
  const [fichas, setFichas] = useState([]);
  const [loading, setLoading] = useState(true);
  const [modalCreate, setModalCreate] = useState(false);
  const [modalJoin, setModalJoin] = useState(false);
  const [editFicha, setEditFicha] = useState(null);
  const [form, setForm] = useState(EMPTY_FORM);
  const [joinCode, setJoinCode] = useState('');
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  const load = useCallback(async () => {
    try {
      setLoading(true);
      const data = await fetchApi('/fichas/my-fichas');
      setFichas(data.fichas);
    } catch (err) { console.error(err); }
    finally { setLoading(false); }
  }, []);

  useEffect(() => { load(); }, [load]);

  // Handler de campo individual — evita recrear el objeto form completo
  const handleField = useCallback((key, value) => {
    setForm(prev => ({ ...prev, [key]: value }));
  }, []);

  const handleCreate = async (e) => {
    e.preventDefault();
    setError(''); setSaving(true);
    try {
      await fetchApi('/fichas', { method: 'POST', body: JSON.stringify(form) });
      setModalCreate(false);
      setForm(EMPTY_FORM);
      showToast('Ficha creada exitosamente', 'success');
      load();
    } catch (err) { setError(err.message); }
    finally { setSaving(false); }
  };

  const handleEdit = async (e) => {
    e.preventDefault();
    setError(''); setSaving(true);
    try {
      await fetchApi(`/fichas/${editFicha.id}`, { method: 'PUT', body: JSON.stringify(form) });
      setEditFicha(null);
      showToast('Ficha actualizada', 'success');
      load();
    } catch (err) { setError(err.message); }
    finally { setSaving(false); }
  };

  const openEdit = (ficha) => {
    setForm({ numero: ficha.numero, nivel: ficha.nivel, centro: ficha.centro, jornada: ficha.jornada, region: ficha.region || '', duracion: ficha.duracion || '' });
    setEditFicha(ficha);
    setError('');
  };

  const handleJoin = async (e) => {
    e.preventDefault();
    setError(''); setSaving(true);
    try {
      await fetchApi('/fichas/join', { method: 'POST', body: JSON.stringify({ code: joinCode }) });
      setModalJoin(false);
      setJoinCode('');
      showToast('Te uniste a la ficha exitosamente', 'success');
      load();
    } catch (err) { setError(err.message); }
    finally { setSaving(false); }
  };

  const handleRegenerate = async (id) => {
    if (!confirm('¿Regenerar el código? El anterior dejará de funcionar.')) return;
    try {
      await fetchApi(`/fichas/${id}/regenerate-code`, { method: 'POST' });
      showToast('Código regenerado', 'success');
      load();
    } catch (err) { showToast(err.message, 'error'); }
  };

  const handleRemoveAprendiz = async (fichaId, aprendizId) => {
    if (!confirm('¿Eliminar este aprendiz de la ficha?')) return;
    try {
      await fetchApi(`/fichas/${fichaId}/aprendices/${aprendizId}`, { method: 'DELETE' });
      showToast('Aprendiz eliminado', 'success');
      load();
    } catch (err) { showToast(err.message, 'error'); }
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
              <Plus size={16} /> Nueva Ficha
            </button>
          </div>
        }
      />

      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-5">
          {[1, 2, 3].map(i => (
            <div key={i} className="card animate-pulse">
              <div className="h-5 bg-gray-100 rounded w-1/2 mb-3" />
              <div className="h-10 bg-gray-100 rounded-xl mb-3" />
              <div className="grid grid-cols-3 gap-2">
                {[1,2,3].map(j => <div key={j} className="h-12 bg-gray-100 rounded-lg"/>)}
              </div>
            </div>
          ))}
        </div>
      ) : fichas.length === 0 ? (
        <div className="card">
          <EmptyState
            icon={<Users size={32} />}
            title="No tienes fichas aún"
            description="Crea tu primera ficha o únete a una existente con un código de invitación."
            action={<button onClick={() => { setModalCreate(true); setForm(EMPTY_FORM); }} className="btn-primary">Crear Ficha</button>}
          />
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-5">
          {fichas.map(f => (
            <FichaCard key={f.id} ficha={f} currentUserId={user?.id}
              onRegenerate={handleRegenerate} onEdit={openEdit} onRemoveAprendiz={handleRemoveAprendiz} />
          ))}
        </div>
      )}

      {/* Modal Crear */}
      <Modal open={modalCreate} onClose={() => setModalCreate(false)} title="Crear Nueva Ficha">
        <FichaForm
          form={form} onChange={handleField} onSubmit={handleCreate}
          onCancel={() => setModalCreate(false)} saving={saving} error={error} isEdit={false}
        />
      </Modal>

      {/* Modal Editar */}
      <Modal open={!!editFicha} onClose={() => setEditFicha(null)} title="Editar Ficha">
        <FichaForm
          form={form} onChange={handleField} onSubmit={handleEdit}
          onCancel={() => setEditFicha(null)} saving={saving} error={error} isEdit={true}
        />
      </Modal>

      {/* Modal Unirse */}
      <Modal open={modalJoin} onClose={() => setModalJoin(false)} title="Unirse a una Ficha">
        <form onSubmit={handleJoin} className="space-y-4">
          {error && <p className="text-sm text-red-500 bg-red-50 px-3 py-2 rounded-lg">{error}</p>}
          <p className="text-sm text-gray-500">Ingresa el código de invitación proporcionado por el administrador de la ficha.</p>
          <input required className="input-field text-center font-mono text-lg tracking-widest uppercase"
            placeholder="X7B9K2" value={joinCode}
            onChange={e => setJoinCode(e.target.value.toUpperCase())} />
          <div className="flex gap-3">
            <button type="button" onClick={() => setModalJoin(false)} className="btn-secondary flex-1">Cancelar</button>
            <button type="submit" disabled={saving} className="btn-primary flex-1">{saving ? 'Uniéndose...' : 'Unirse'}</button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
