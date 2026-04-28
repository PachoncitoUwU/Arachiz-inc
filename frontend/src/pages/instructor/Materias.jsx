import React, { useState, useEffect, useContext } from 'react';
import { AuthContext } from '../../context/AuthContext';
import { useSettings } from '../../context/SettingsContext';
import fetchApi from '../../services/api';
import PageHeader from '../../components/PageHeader';
import Modal from '../../components/Modal';
import MateriaInfoModal from '../../components/MateriaInfoModal';
import ConfirmModal from '../../components/ConfirmModal';
import EmptyState from '../../components/EmptyState';
import { useToast } from '../../context/ToastContext';
import { BookOpen, Plus } from 'lucide-react';

const COLORES_FICHA = [
  { bg: 'bg-blue-50',   icon: 'text-[#4285F4]',  card: 'bg-blue-50/60 border-blue-100',   accent: '#4285F4' },
  { bg: 'bg-green-50',  icon: 'text-[#34A853]',  card: 'bg-green-50/60 border-green-100', accent: '#34A853' },
  { bg: 'bg-purple-50', icon: 'text-purple-500', card: 'bg-purple-50/60 border-purple-100', accent: '#8b5cf6' },
  { bg: 'bg-yellow-50', icon: 'text-[#FBBC05]',  card: 'bg-yellow-50/60 border-yellow-100', accent: '#FBBC05' },
  { bg: 'bg-red-50',    icon: 'text-[#EA4335]',  card: 'bg-red-50/60 border-red-100',     accent: '#EA4335' },
];

export default function InstructorMaterias() {
  const { user } = useContext(AuthContext);
  const { t } = useSettings();
  const { showToast } = useToast();
  const [materias, setMaterias] = useState([]);
  const [fichas, setFichas] = useState([]);
  const [loading, setLoading] = useState(true);
  const [modal, setModal] = useState(false);
  const [form, setForm] = useState({ fichaId: '', nombre: '', tipo: 'Técnica' });
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [selectedMateria, setSelectedMateria] = useState(null);
  const [infoModalOpen, setInfoModalOpen] = useState(false);
  const [confirmModal, setConfirmModal] = useState({ isOpen: false, materiaId: null });

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
    setConfirmModal({ isOpen: true, materiaId: id });
  };

  const confirmDelete = async () => {
    try {
      await fetchApi(`/materias/${confirmModal.materiaId}`, { method: 'DELETE' });
      showToast('Materia enviada a la papelera', 'success');
      setInfoModalOpen(false);
      setSelectedMateria(null);
      load();
    } catch (err) { showToast(err.message, 'error'); }
  };

  const handleMateriaClick = (materia, ficha) => {
    setSelectedMateria({ ...materia, ficha });
    setInfoModalOpen(true);
  };

  const handleCloseInfoModal = () => {
    setInfoModalOpen(false);
    setSelectedMateria(null);
  };

  const handleUpdateMateria = () => {
    load();
  };

  const handleDeleteMateria = () => {
    if (selectedMateria) {
      handleDelete(selectedMateria.id);
    }
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
        title={t('subjects.title')}
        subtitle={t('subjects.subtitle').replace('{count}', materias.length)}
        action={
          fichas.length > 0 && (
            <button onClick={() => { setModal(true); setError(''); }} className="btn-primary flex items-center gap-2">
              <Plus size={16}/> {t('Action', 'Nueva Materia')}
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
            title={t('subjects.emptyTitle')}
            description={t('subjects.emptyDesc')}
            action={fichas.length > 0
              ? <button onClick={() => setModal(true)} className="btn-primary">{t('Action', 'Crear Materia')}</button>
              : <p className="text-sm text-gray-400">Primero crea una ficha</p>
            }
          />
        </div>
      ) : (
        <div className="space-y-6">
          {byFicha.map(({ ficha, materias: mats }, fichaIdx) => {
            const col = COLORES_FICHA[fichaIdx % COLORES_FICHA.length];
            return (
            <div key={ficha.id} className="card" style={{ borderTopWidth: 3, borderTopColor: col.accent }}>
              <div className="flex items-center gap-2 mb-4 pb-3 border-b border-gray-100">
                <div className={`w-8 h-8 ${col.bg} rounded-lg flex items-center justify-center`}>
                  <BookOpen size={16} className={col.icon}/>
                </div>
                <div>
                  <p className="font-bold text-gray-900 text-sm">Ficha {ficha.numero}</p>
                  <p className="text-xs text-gray-400">{ficha.nivel} · {ficha.jornada}</p>
                </div>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                {mats.map((m, mIdx) => {
                  const mCol = COLORES_FICHA[mIdx % COLORES_FICHA.length];
                  const isOwner = m.instructorId === user?.id;
                  const isLider = ficha.instructorAdminId === user?.id;
                  const canEdit = isOwner || isLider;
                  const hasActive = m.asistencias?.some(a => a.activa);
                  return (
                    <div 
                      key={m.id} 
                      onClick={() => handleMateriaClick(m, ficha)}
                      className={`p-3 rounded-xl border hover:shadow-soft transition-all cursor-pointer ${mCol.card}`}
                    >
                      <div className="flex items-start justify-between">
                        <div className="flex-1 min-w-0">
                          <p className="font-semibold text-sm text-gray-800 truncate">{m.nombre}</p>
                          <p className="text-xs text-gray-400 mt-0.5">{m.instructor?.fullName}</p>
                        </div>
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
          );})}
        </div>
      )}

      <Modal open={modal} onClose={() => setModal(false)} title="Nueva Materia">
        <form onSubmit={handleCreate} className="space-y-4">
          {error && <p className="text-sm text-red-500 bg-red-50 px-3 py-2 rounded-lg">{error}</p>}
          <div>
            <label className="input-label">Ficha</label>
            <select required className="input-field" value={form.fichaId}
              onChange={e => setForm({...form, fichaId: e.target.value})}>
              {fichas.map(f => <option key={f.id} value={f.id}>Ficha {f.numero} – {f.nombre}</option>)}
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

      <MateriaInfoModal
        open={infoModalOpen}
        onClose={handleCloseInfoModal}
        materia={selectedMateria}
        isCreatorOrAdmin={
          selectedMateria && user && 
          (selectedMateria.instructorId === user.id || 
           selectedMateria.ficha?.instructorAdminId === user.id)
        }
        onUpdate={handleUpdateMateria}
        onDelete={handleDeleteMateria}
      />

      <ConfirmModal
        isOpen={confirmModal.isOpen}
        onClose={() => setConfirmModal({ isOpen: false, materiaId: null })}
        onConfirm={confirmDelete}
        title="¿Enviar materia a papelera?"
        message="¿Enviar esta materia a la papelera? Podrá ser recuperada desde la sección de papelera."
        confirmText="Enviar a Papelera"
        cancelText="Cancelar"
        variant="danger"
      />
    </div>
  );
}
