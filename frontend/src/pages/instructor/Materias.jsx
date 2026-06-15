import React, { useState, useEffect, useContext } from 'react';
import { AuthContext } from '../../context/AuthContext';
import { useSettings } from '../../context/SettingsContext';
import fetchApi from '../../services/api';
import PageHeader from '../../components/PageHeader';
import Modal from '../../components/Modal';
import MateriaInfoModal from '../../components/MateriaInfoModal';
import ConfirmDialog from '../../components/ConfirmDialog';
import EmptyState from '../../components/EmptyState';
import { useToast } from '../../context/ToastContext';
import { BookOpen, Plus, Edit2, Trash2 } from 'lucide-react';

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
  const [competencias, setCompetencias] = useState([]);
  const [fichas, setFichas] = useState([]);
  const [loading, setLoading] = useState(true);
  const [modal, setModal] = useState(false);
  const [form, setForm] = useState({ fichaId: '', nombre: '', tipo: 'Técnica' });
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [selectedMateria, setSelectedMateria] = useState(null);
  const [infoModalOpen, setInfoModalOpen] = useState(false);
  const [confirmDialog, setConfirmDialog] = useState({ open: false, action: null, title: 'Confirmar', message: '¿Estás seguro?', danger: true, confirmText: 'Confirmar' });

  // Nuevo estado para Resultados de Aprendizaje
  const [modalResultado, setModalResultado] = useState({ open: false, competenciaId: null, resultadoId: null, nombre: '', modo: 'crear' });
  const [currentView, setCurrentView] = useState('competencias');
  const [selectedCompetenciaView, setSelectedCompetenciaView] = useState(null);
  const [savingResultado, setSavingResultado] = useState(false);
  const [errorResultado, setErrorResultado] = useState('');

  const load = async () => {
    try {
      setLoading(true);
      const [m, f] = await Promise.all([
        fetchApi('/competencias/my-competencias'),
        fetchApi('/fichas/my-fichas'),
      ]);
      setCompetencias(m.competencias || []);
      setFichas(f.fichas);
      if (f.fichas.length > 0) setForm(prev => ({ ...prev, fichaId: f.fichas[0].id }));
    } catch (err) { console.error(err); }
    finally { setLoading(false); }
  };

  useEffect(() => { 
    load(); 
    window.onVerResultadosGlob = (comp) => {
      setSelectedCompetenciaView(comp);
      setCurrentView('resultados');
    };
    return () => {
      delete window.onVerResultadosGlob;
    };
  }, []);

  const handleCreate = async (e) => {
    e.preventDefault();
    setError(''); setSaving(true);
    try {
      await fetchApi('/competencias', { method: 'POST', body: JSON.stringify(form) });
      setModal(false);
      showToast('Competencia creada exitosamente', 'success');
      load();
    } catch (err) { setError(err.message); }
    finally { setSaving(false); }
  };

  const handleDelete = async (id) => {
    setConfirmDialog({
      open: true,
      title: "Eliminar Competencia",
      message: "¿Eliminar esta competencia? Se eliminarán también sus resultados de aprendizaje y sesiones de asistencia.",
      confirmText: "Eliminar",
      danger: true,
      action: async () => {
        try {
          await fetchApi(`/competencias/${id}`, { method: 'DELETE' });
          showToast('Competencia eliminada', 'success');
          setInfoModalOpen(false);
          setSelectedMateria(null);
          load();
        } catch (err) { showToast(err.message, 'error'); }
      }
    });
  };

  const handleCreateOrEditResultado = async (e) => {
    e.preventDefault();
    setErrorResultado(''); setSavingResultado(true);
    try {
      if (modalResultado.modo === 'crear') {
        await fetchApi('/resultados', { method: 'POST', body: JSON.stringify({ competenciaId: modalResultado.competenciaId, nombre: modalResultado.nombre }) });
        showToast('Resultado de aprendizaje creado', 'success');
      } else {
        await fetchApi(`/resultados/${modalResultado.resultadoId}`, { method: 'PUT', body: JSON.stringify({ nombre: modalResultado.nombre }) });
        showToast('Resultado de aprendizaje actualizado', 'success');
      }
      setModalResultado({ open: false, competenciaId: null, resultadoId: null, nombre: '', modo: 'crear' });
      const res = await fetchApi('/competencias/my-competencias');
      const comps = res.competencias || [];
      setCompetencias(comps);
      // Refrescar sub-vista si está abierta
      if (currentView === 'resultados' && selectedCompetenciaView) {
        const updatedComp = comps.find(c => c.id === selectedCompetenciaView.id);
        if (updatedComp) setSelectedCompetenciaView(updatedComp);
      }
    } catch (err) { setErrorResultado(err.message); }
    finally { setSavingResultado(false); }
  };

  const handleDeleteResultado = async (id) => {
    setConfirmDialog({
      open: true,
      title: "Eliminar Resultado",
      message: "¿Eliminar este resultado de aprendizaje? Se eliminarán también sus sesiones de asistencia asociadas.",
      confirmText: "Eliminar",
      danger: true,
      action: async () => {
        try {
          await fetchApi(`/resultados/${id}`, { method: 'DELETE' });
          showToast('Resultado eliminado', 'success');
          load();
        } catch (err) { showToast(err.message, 'error'); }
      }
    });
  };

  const handleTomarCargo = async (id) => {
    try {
      await fetchApi(`/resultados/${id}/tomar`, { method: 'PUT' });
      showToast('Ahora estás a cargo de este resultado', 'success');
      load();
    } catch (err) { showToast(err.message, 'error'); }
  };

  const handleDejarCargo = async (id) => {
    setConfirmDialog({
      open: true,
      title: "Dejar Cargo",
      message: "¿Estás seguro de dejar el cargo de este resultado?",
      confirmText: "Dejar Cargo",
      danger: true,
      action: async () => {
        try {
          await fetchApi(`/resultados/${id}/dejar`, { method: 'PUT' });
          showToast('Has dejado el cargo del resultado', 'success');
          load();
        } catch (err) { showToast(err.message, 'error'); }
      }
    });
  };

  const handleMateriaClick = (materia, ficha) => {
    setSelectedMateria({ ...materia, ficha: ficha || materia.ficha });
    setInfoModalOpen(true);
  };

  const handleCloseInfoModal = () => {
    setInfoModalOpen(false);
    setSelectedMateria(null);
  };

  const handleUpdateMateria = async () => {
    try {
      const res = await fetchApi('/competencias/my-competencias');
      const comps = res.competencias || [];
      setCompetencias(comps);
      if (currentView === 'resultados' && selectedCompetenciaView) {
        const updated = comps.find(c => c.id === selectedCompetenciaView.id);
        if (updated) setSelectedCompetenciaView(updated);
      }
      const fichasRes = await fetchApi('/fichas/my-fichas');
      setFichas(fichasRes.fichas || []);
    } catch (err) { console.error(err); }
  };

  const handleDeleteMateria = () => {
    if (selectedMateria) {
      handleDelete(selectedMateria.id);
    }
  };

  // Agrupar por ficha
  const byFichaMap = new Map();
  competencias.forEach(c => {
    const fichaId = c.fichaId || c.ficha?.id;
    if (!fichaId) return;
    if (!byFichaMap.has(fichaId)) {
      const fichaCompleta = fichas.find(f => f.id === fichaId) || c.ficha || { id: fichaId, numero: '?', nombre: '' };
      byFichaMap.set(fichaId, { ficha: fichaCompleta, competencias: [] });
    }
    byFichaMap.get(fichaId).competencias.push(c);
  });
  const byFicha = Array.from(byFichaMap.values());
  const myMaterias = competencias;

  return (
    <div className="animate-fade-in">
      <PageHeader
        title={t('subjects.title')}
        subtitle={t('subjects.subtitle').replace('{count}', competencias.length)}
        action={
          fichas.length > 0 && (
            <button onClick={() => { setModal(true); setError(''); }} className="btn-primary text-sm md:text-base  flex items-center gap-2">
              <Plus size={16}/> {t('Action', 'Nueva Competencia')}
            </button>
          )
        }
      />

      {loading ? (
        <div className="flex justify-center py-16">
          <div className="w-8 h-8 border-2 border-[#4285F4] border-t-transparent rounded-full animate-spin"/>
        </div>
      ) : competencias.length === 0 ? (
        <div className="card">
          <EmptyState
            icon={<BookOpen size={32}/>}
            title={t('subjects.emptyTitle')}
            description="No tienes competencias asignadas. Crea una nueva competencia o pide a tu líder que te asigne resultados de aprendizaje."
            action={fichas.length > 0
              ? <button onClick={() => setModal(true)} className="btn-primary text-sm md:text-base ">{t('Action', 'Crear Competencia')}</button>
              : <p className="text-sm text-gray-400">Primero crea una ficha</p>
            }
          />
        </div>
      ) : currentView === 'resultados' && selectedCompetenciaView ? (
        <div className="space-y-4 animate-fade-in">
          <div className="flex items-center gap-3 mb-6">
            <button onClick={() => { setCurrentView('competencias'); setSelectedCompetenciaView(null); }} className="p-2 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg text-gray-500 font-medium flex items-center gap-2">
              ← Volver
            </button>
            <div>
              <p className="text-xs text-gray-500 uppercase tracking-wider font-semibold">Competencia</p>
              <h2 className="text-xl font-bold text-gray-900 dark:text-white">{selectedCompetenciaView.nombre}</h2>
            </div>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {selectedCompetenciaView.resultados?.map(r => (
              <div 
                key={r.id} 
                onClick={() => handleMateriaClick({...r, competencia: selectedCompetenciaView, competenciaId: selectedCompetenciaView.id}, selectedCompetenciaView.ficha || fichas.find(f => f.id === selectedCompetenciaView.fichaId))} 
                className="p-4 rounded-xl border border-gray-100 dark:border-zinc-700 bg-white dark:bg-zinc-900 hover:shadow-md cursor-pointer transition-all flex items-center justify-between gap-4"
              >
                <p className="font-bold text-gray-800 dark:text-gray-100 flex-1 min-w-0 truncate">{r.nombre}</p>
                <p className={`text-sm font-medium flex-shrink-0 ${r.instructor ? 'text-gray-600 dark:text-gray-400' : 'text-orange-500'}`}>
                  {r.instructor ? r.instructor.fullName : 'Sin instructor asignado'}
                </p>
              </div>
            ))}
            {(!selectedCompetenciaView.resultados || selectedCompetenciaView.resultados.length === 0) && (
              <div className="col-span-full p-8 text-center text-gray-500 bg-gray-50 dark:bg-zinc-800/50 rounded-xl">
                Esta competencia aún no tiene resultados de aprendizaje asignados.
              </div>
            )}
          </div>
          {/* Botón crear resultado */}
          <button
            onClick={() => setModalResultado({ open: true, competenciaId: selectedCompetenciaView.id, resultadoId: null, nombre: '', modo: 'crear' })}
            className="mt-4 btn-primary text-sm flex items-center gap-2"
          >
            <Plus size={14} /> Agregar Resultado de Aprendizaje
          </button>
        </div>
      ) : (
        <div className="space-y-6">
          {byFicha.map(({ ficha, competencias: comps }, fichaIdx) => {
            const col = COLORES_FICHA[fichaIdx % COLORES_FICHA.length];
            return (
            <div key={ficha.id} className="card" style={{ borderTopWidth: 3, borderTopColor: col.accent }}>
              <div className="flex items-center gap-2 mb-4 pb-3 border-b border-gray-100 dark:border-zinc-700 ">
                <div className={`w-8 h-8 ${col.bg} rounded-lg flex items-center justify-center`}>
                  <BookOpen size={16} className={col.icon}/>
                </div>
                <div>
                  <p className="font-bold text-gray-900 dark:text-white  text-sm">Ficha {ficha.numero}</p>
                  <p className="text-xs text-gray-400">{ficha.nivel} · {ficha.jornada}</p>
                </div>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                {comps.map((m, mIdx) => {
                  const mCol = COLORES_FICHA[mIdx % COLORES_FICHA.length];
                  const isOwner = m.resultados?.some(r => r.instructorId === user?.id);
                  const isLider = ficha.instructorAdminId === user?.id;
                  const canEdit = isOwner || isLider;
                  const hasActive = m.resultados?.some(r => r.asistencias?.some(a => a.activa));
                  return (
                    <div 
                      key={m.id} 
                      onClick={() => handleMateriaClick(m, ficha)}
                      className={`p-3 rounded-xl border hover:shadow-soft transition-all cursor-pointer ${mCol.card}`}
                    >
                      <div className="flex items-start justify-between">
                        <div className="flex-1 min-w-0 pr-4">
                          <p className="font-semibold text-sm text-gray-800 truncate">{m.nombre}</p>
                          
                          {/* Información de la ficha */}
                          <div className="flex items-center gap-1 text-xs text-gray-500 mt-1">
                            <BookOpen size={10}/>
                            <span className="font-medium">Ficha {ficha.numero}</span>
                            {ficha.nombre && <span className="truncate">· {ficha.nombre}</span>}
                          </div>
                        </div>
                        <div className="flex-shrink-0">
                          <button 
                            onClick={(e) => { e.stopPropagation(); setSelectedCompetenciaView(m); setCurrentView('resultados'); }}
                            className="text-xs font-semibold text-blue-600 bg-blue-50 dark:bg-blue-900/20 dark:text-blue-400 hover:bg-blue-100 dark:hover:bg-blue-900/40 px-3 py-1.5 rounded-lg transition-colors whitespace-nowrap"
                          >
                            Ver resultados de aprendizaje ({m.resultados?.length || 0})
                          </button>
                        </div>
                      </div>
                      <div className="flex items-center gap-2 mt-2">
                        <span className={`badge ${m.tipo === 'Técnica' ? 'badge-info' : m.tipo === 'Básica' ? 'badge-purple' : 'badge-gray'}`}>{m.tipo}</span>
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

      <Modal open={modal} onClose={() => setModal(false)} title="Nueva Competencia">
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
            <label className="input-label">Nombre de la Competencia</label>
            <input required className="input-field" placeholder="Programación Orientada a Objetos"
              value={form.nombre} onChange={e => setForm({...form, nombre: e.target.value})} />
          </div>
          <div>
            <label className="input-label">Tipo</label>
            <select className="input-field" value={form.tipo} onChange={e => setForm({...form, tipo: e.target.value})}>
              <option>Técnica</option><option>Transversal</option><option>Básica</option>
            </select>
          </div>
          <div className="flex flex-wrap gap-3  pt-2">
            <button type="button" onClick={() => setModal(false)} className="btn-secondary text-sm md:text-base  flex-1">Cancelar</button>
            <button type="submit" disabled={saving} className="btn-primary text-sm md:text-base  flex-1">{saving ? 'Creando...' : 'Crear Competencia'}</button>
          </div>
        </form>
      </Modal>

      <MateriaInfoModal
        open={infoModalOpen}
        onClose={handleCloseInfoModal}
        materia={selectedMateria}
        isCreatorOrAdmin={
          selectedMateria && user && 
          (selectedMateria.resultados?.some(r => r.instructorId === user.id) || 
           selectedMateria.ficha?.instructorAdminId === user.id)
        }
        currentUserId={user?.id}
        onUpdate={handleUpdateMateria}
        onDelete={handleDeleteMateria}
      />

      <Modal open={modalResultado.open} onClose={() => setModalResultado(prev => ({ ...prev, open: false }))} title={modalResultado.modo === 'crear' ? 'Nuevo Resultado' : 'Editar Resultado'}>
        <form onSubmit={handleCreateOrEditResultado} className="space-y-4">
          {errorResultado && <p className="text-sm text-red-500 bg-red-50 px-3 py-2 rounded-lg">{errorResultado}</p>}
          <div>
            <label className="input-label">Nombre del Resultado</label>
            <input required className="input-field" placeholder="Escribe el nombre aquí..."
              value={modalResultado.nombre} onChange={e => setModalResultado({...modalResultado, nombre: e.target.value})} />
          </div>
          <div className="flex flex-wrap gap-3  pt-2">
            <button type="button" onClick={() => setModalResultado(prev => ({ ...prev, open: false }))} className="btn-secondary text-sm md:text-base  flex-1">Cancelar</button>
            <button type="submit" disabled={savingResultado} className="btn-primary text-sm md:text-base  flex-1">{savingResultado ? 'Guardando...' : 'Guardar Resultado'}</button>
          </div>
        </form>
      </Modal>

      <ConfirmDialog
        open={confirmDialog.open}
        onClose={() => setConfirmDialog({ ...confirmDialog, open: false, action: null })}
        onConfirm={confirmDialog.action}
        title={confirmDialog.title}
        message={confirmDialog.message}
        confirmText={confirmDialog.confirmText}
        cancelText="Cancelar"
        danger={confirmDialog.danger}
      />
    </div>
  );
}
