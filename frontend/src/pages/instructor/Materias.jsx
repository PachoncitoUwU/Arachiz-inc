import React, { useState, useEffect, useContext } from 'react';
import { AuthContext } from '../../context/AuthContext';
import fetchApi from '../../services/api';
import PageHeader from '../../components/PageHeader';
import Modal from '../../components/Modal';
import EmptyState from '../../components/EmptyState';
import { useToast } from '../../context/ToastContext';
import { BookOpen, Plus, Trash2, FileText } from 'lucide-react';

export default function InstructorMaterias() {
  const { user } = useContext(AuthContext);
  const { showToast } = useToast();
  const [materias, setMaterias] = useState([]);
  const [fichas, setFichas] = useState([]);
  const [loading, setLoading] = useState(true);
  const [modal, setModal] = useState(false);
  const [form, setForm] = useState({ fichaId: '', nombre: '', tipo: 'Técnica' });
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  const load = async () => {
    try {
      setLoading(true);
      const [m, f] = await Promise.all([
        fetchApi('/materias/my-materias'),
        fetchApi('/fichas/my-fichas'),
      ]);
      setMaterias(m.materias);
      setFichas(f.fichas);
      if (f.fichas.length > 0) setForm(prev => ({ ...prev, fichaId: f.fichas[0].id }));
    } catch (err) { console.error(err); }
    finally { setLoading(false); }
  };

  useEffect(() => { load(); }, []);

  const handleCreate = async (e) => {
    e.preventDefault();
    setError(''); setSaving(true);
    try {
      await fetchApi('/materias', { method: 'POST', body: JSON.stringify(form) });
      setModal(false);
      showToast('Materia creada exitosamente', 'success');
      load();
    } catch (err) { setError(err.message); }
    finally { setSaving(false); }
  };

  const handleDelete = async (id) => {
    if (!confirm('¿Eliminar esta materia? Se eliminarán también sus sesiones de asistencia.')) return;
    try {
      await fetchApi(`/materias/${id}`, { method: 'DELETE' });
      showToast('Materia eliminada', 'success');
      load();
    } catch (err) { showToast(err.message, 'error'); }
  };

  // Agrupar por ficha
  const byFicha = fichas.map(f => ({
    ficha: f,
    materias: materias.filter(m => m.fichaId === f.id)
  })).filter(g => g.materias.length > 0);

  const myMaterias = materias.filter(m => m.instructorId === user?.id);

  return (
    <div className="animate-fade-in">
      <PageHeader
        title="Materias"
        subtitle={`${materias.length} materia${materias.length !== 1 ? 's' : ''} en total`}
        action={
          fichas.length > 0 && (
            <button onClick={() => { setModal(true); setError(''); }} className="btn-primary flex items-center gap-2">
              <Plus size={16}/> Nueva Materia
            </button>
          )
        }
      />

      {loading ? (
        <div className="flex justify-center py-16">
          <div className="w-8 h-8 border-2 border-[#4285F4] border-t-transparent rounded-full animate-spin"/>
        </div>
      ) : materias.length === 0 ? (
        <div className="card">
          <EmptyState
            icon={<BookOpen size={32}/>}
            title="No hay materias aún"
            description="Crea materias dentro de tus fichas de formación."
            action={fichas.length > 0
              ? <button onClick={() => setModal(true)} className="btn-primary">Crear Materia</button>
              : <p className="text-sm text-gray-400">Primero crea una ficha</p>
            }
          />
        </div>
      ) : (
        <div className="space-y-6">
          {byFicha.map(({ ficha, materias: mats }) => (
            <div key={ficha.id} className="card">
              <div className="flex items-center gap-2 mb-4 pb-3 border-b border-gray-100">
                <div className="w-8 h-8 bg-blue-50 rounded-lg flex items-center justify-center">
                  <BookOpen size={16} className="text-[#4285F4]"/>
                </div>
                <div>
                  <p className="font-bold text-gray-900 text-sm">Ficha {ficha.numero}</p>
                  <p className="text-xs text-gray-400">{ficha.nivel} · {ficha.jornada}</p>
                </div>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                {mats.map(m => {
                  const isOwner = m.instructorId === user?.id;
                  const isAdmin = ficha.instructorAdminId === user?.id;
                  const canDelete = isOwner || isAdmin;
                  const hasActive = m.asistencias?.some(a => a.activa);
                  return (
                    <div key={m.id} className="p-3 rounded-xl border border-gray-100 bg-gray-50 hover:bg-white hover:shadow-soft transition-all">
                      <div className="flex items-start justify-between">
                        <div className="flex-1 min-w-0">
                          <p className="font-semibold text-sm text-gray-800 truncate">{m.nombre}</p>
                          <p className="text-xs text-gray-400 mt-0.5">{m.instructor?.fullName}</p>
                        </div>
                        {canDelete && (
                          <button onClick={() => handleDelete(m.id)}
                            className="btn-icon w-7 h-7 text-red-400 hover:bg-red-50 shrink-0">
                            <Trash2 size={13}/>
                          </button>
                        )}
                      </div>
                      <div className="flex items-center gap-2 mt-2">
                        <span className={`badge ${m.tipo === 'Técnica' ? 'badge-info' : 'badge-gray'}`}>{m.tipo}</span>
                        {hasActive && <span className="badge badge-success">Sesión activa</span>}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          ))}
        </div>
      )}

      <Modal open={modal} onClose={() => setModal(false)} title="Nueva Materia">
        <form onSubmit={handleCreate} className="space-y-4">
          {error && <p className="text-sm text-red-500 bg-red-50 px-3 py-2 rounded-lg">{error}</p>}
          <div>
            <label className="input-label">Ficha</label>
            <select required className="input-field" value={form.fichaId}
              onChange={e => setForm({...form, fichaId: e.target.value})}>
              {fichas.map(f => <option key={f.id} value={f.id}>Ficha {f.numero} – {f.nivel}</option>)}
            </select>
          </div>
          <div>
            <label className="input-label">Nombre de la Materia</label>
            <input required className="input-field" placeholder="Programación Orientada a Objetos"
              value={form.nombre} onChange={e => setForm({...form, nombre: e.target.value})} />
          </div>
          <div>
            <label className="input-label">Tipo</label>
            <select className="input-field" value={form.tipo} onChange={e => setForm({...form, tipo: e.target.value})}>
              <option>Técnica</option><option>Transversal</option>
            </select>
          </div>
          <div className="flex gap-3 pt-2">
            <button type="button" onClick={() => setModal(false)} className="btn-secondary flex-1">Cancelar</button>
            <button type="submit" disabled={saving} className="btn-primary flex-1">{saving ? 'Creando...' : 'Crear Materia'}</button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
