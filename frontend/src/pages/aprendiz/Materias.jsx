import React, { useState, useEffect } from 'react';
import fetchApi from '../../services/api';
import PageHeader from '../../components/PageHeader';
import EmptyState from '../../components/EmptyState';
import MateriaInfoModal from '../../components/MateriaInfoModal';
import { BookOpen, User, EyeOff, Eye } from 'lucide-react';
import { useSettings } from '../../context/SettingsContext';
import { useToast } from '../../context/ToastContext';
import ConfirmDialog from '../../components/ConfirmDialog';

const COLORES = [
  { bg: 'bg-blue-50',   icon: 'text-[#4285F4]',  border: 'border-blue-100',   accent: '#4285F4' },
  { bg: 'bg-green-50',  icon: 'text-[#34A853]',  border: 'border-green-100',  accent: '#34A853' },
  { bg: 'bg-purple-50', icon: 'text-purple-500', border: 'border-purple-100', accent: '#8b5cf6' },
  { bg: 'bg-yellow-50', icon: 'text-[#FBBC05]',  border: 'border-yellow-100', accent: '#FBBC05' },
  { bg: 'bg-red-50',    icon: 'text-[#EA4335]',  border: 'border-red-100',    accent: '#EA4335' },
  { bg: 'bg-pink-50',   icon: 'text-pink-500',   border: 'border-pink-100',   accent: '#ec4899' },
];
export default function AprendizMaterias() {
  const [materias, setMaterias] = useState([]);
  const [materiasEvitadas, setMateriasEvitadas] = useState([]);
  const [loading, setLoading] = useState(true);
  const [confirmDialog, setConfirmDialog] = useState({ open: false, materia: null, action: null });
  const [modalMateriaInfo, setModalMateriaInfo] = useState(false);
  const [selectedMateria, setSelectedMateria] = useState(null);
  const { t } = useSettings();
  const { showToast } = useToast();

  const fetchMaterias = () => {
    Promise.all([
      fetchApi('/materias/my-materias'),
      fetchApi('/materias-evitadas/my-materias-evitadas')
    ])
      .then(([materiasRes, evitadasRes]) => {
        setMaterias(materiasRes.materias);
        setMateriasEvitadas(evitadasRes.materiasEvitadas || []);
      })
      .catch(console.error)
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    fetchMaterias();
  }, []);

  const handleEvitarMateria = async (materia) => {
    try {
      await fetchApi(`/materias-evitadas/materias/${materia.id}/evitar`, { method: 'POST' });
      showToast('Materia evitada exitosamente', 'success');
      fetchMaterias();
    } catch (error) {
      showToast(error.message || 'Error al evitar materia', 'error');
    }
  };

  const handleVolverATomarMateria = async (materia) => {
    try {
      await fetchApi(`/materias-evitadas/materias/${materia.id}/volver-a-tomar`, { method: 'DELETE' });
      showToast('Ahora puedes tomar esta materia nuevamente', 'success');
      fetchMaterias();
    } catch (error) {
      showToast(error.message || 'Error al volver a tomar materia', 'error');
    }
  };

  const openConfirmDialog = (materia, action) => {
    setConfirmDialog({ open: true, materia, action });
  };

  const closeConfirmDialog = () => {
    setConfirmDialog({ open: false, materia: null, action: null });
  };

  const confirmAction = () => {
    if (confirmDialog.action === 'evitar') {
      handleEvitarMateria(confirmDialog.materia);
    } else if (confirmDialog.action === 'volver') {
      handleVolverATomarMateria(confirmDialog.materia);
    }
    closeConfirmDialog();
  };

  const isMateriaEvitada = (materiaId) => {
    return materiasEvitadas.some(me => me.materiaId === materiaId);
  };

  const handleOpenMateriaInfo = (materia) => {
    const isEvitada = isMateriaEvitada(materia.id);
    setSelectedMateria({ ...materia, isEvitada });
    setModalMateriaInfo(true);
  };

  const handleCloseMateriaInfo = () => {
    setModalMateriaInfo(false);
    setSelectedMateria(null);
  };

  if (loading) return (
    <div className="flex justify-center py-16">
      <div className="w-8 h-8 border-2 border-[#4285F4] border-t-transparent rounded-full animate-spin"/>
    </div>
  );

  return (
    <div className="animate-fade-in">
      <PageHeader
        title={t('subjects.title')}
        subtitle="Estas son todas tus materias"
      />

      {materias.length === 0 ? (
        <div className="card">
          <EmptyState icon={<BookOpen size={32}/>} title={t('subjects.emptyTitle')}
            description={t('subjects.emptyDesc')} />
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {materias.map((m, idx) => {
            const col = COLORES[idx % COLORES.length];
            const totalSesiones = m.asistencias?.length || 0;
            const misPresencias = m.asistencias?.reduce((acc, a) => {
              const reg = a.registros?.find(r => r);
              return acc + (reg?.presente ? 1 : 0);
            }, 0) || 0;
            const hasActive = m.asistencias?.some(a => a.activa);
            const pct = totalSesiones > 0 ? Math.round((misPresencias / totalSesiones) * 100) : 0;
            const evitada = isMateriaEvitada(m.id);

            return (
              <div key={m.id} className={`card hover:shadow-card transition-all border-t-4 cursor-pointer ${evitada ? 'opacity-60' : ''}`}
                style={{ borderTopColor: col.accent }}
                onClick={() => handleOpenMateriaInfo(m)}
              >                <div className="flex items-start justify-between mb-3">
                  <div className={`w-10 h-10 ${col.bg} rounded-xl flex items-center justify-center shrink-0`}>
                    <BookOpen size={20} className={col.icon}/>
                  </div>
                  <div className="flex gap-1 flex-wrap">
                    <span className={`badge ${m.tipo === 'Técnica' ? 'badge-info' : 'badge-gray'}`}>{m.tipo}</span>
                    {hasActive && <span className="badge badge-success">{t('subjects.active')}</span>}
                    {evitada && <span className="badge badge-warning">Evitada</span>}
                  </div>
                </div>
                <h3 className="font-bold text-gray-900 dark:text-white  dark:text-white mb-1">{m.nombre}</h3>
                
                {/* Información de la ficha */}
                <div className="flex items-center gap-1.5 text-xs text-gray-500 dark:text-gray-400 mb-2 pb-2 border-b border-gray-100 dark:border-zinc-700  dark:border-gray-700">
                  <BookOpen size={12}/>
                  <span className="font-medium">Ficha {m.ficha?.numero}</span>
                  {m.ficha?.nombre && <span>· {m.ficha.nombre}</span>}
                </div>
                
                <div className="flex items-center gap-1.5 text-xs text-gray-500 dark:text-gray-400 mb-3">
                  <User size={12}/><span>{m.instructor?.fullName}</span>
                </div>
                {totalSesiones > 0 && (
                  <div className="mb-3">
                    <div className="flex justify-between text-xs text-gray-500 dark:text-gray-400 mb-1">
                      <span>{t('subjects.attendance')}</span>
                      <span className="font-semibold">{pct}%</span>
                    </div>
                    <div className="h-1.5 bg-gray-100 dark:bg-gray-700 rounded-full overflow-hidden">
                      <div className="h-full rounded-full transition-all"
                        style={{ width: `${pct}%`, backgroundColor: col.accent }}/>
                    </div>
                  </div>
                )}
                <div className="grid grid-cols-2 gap-2 pt-3 border-t border-gray-100 dark:border-zinc-700  dark:border-gray-700 mb-3">
                  <div className="text-center">
                    <p className="text-lg font-bold text-gray-800 dark:text-gray-200">{totalSesiones}</p>
                    <p className="text-xs text-gray-400">{t('subjects.sessions')}</p>
                  </div>
                  <div className="text-center">
                    <p className="text-lg font-bold" style={{ color: col.accent }}>{misPresencias}</p>
                    <p className="text-xs text-gray-400">{t('subjects.attendances')}</p>
                  </div>
                </div>
                
                {/* Botón para evitar/volver a tomar materia */}
                {evitada ? (
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      openConfirmDialog(m, 'volver');
                    }}
                    className="w-full flex items-center justify-center gap-2 px-3 py-2 bg-green-50 dark:bg-green-900/20 text-green-700 dark:text-green-400 hover:bg-green-100 dark:hover:bg-green-900/30 rounded-lg transition-colors text-sm font-medium"
                  >
                    <Eye size={16} />
                    Volver a tomar materia
                  </button>
                ) : (
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      openConfirmDialog(m, 'evitar');
                    }}
                    className="w-full flex items-center justify-center gap-2 px-3 py-2 bg-gray-50 dark:bg-gray-800 text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors text-sm font-medium"
                  >
                    <EyeOff size={16} />
                    Evitar esta materia
                  </button>
                )}
              </div>
            );
          })}
        </div>
      )}

      {/* Modal de información de materia */}
      {selectedMateria && (
        <MateriaInfoModal 
          open={modalMateriaInfo} 
          onClose={handleCloseMateriaInfo} 
          materia={selectedMateria}
          isCreatorOrAdmin={false}
          isAprendizView={true}
          isMateriaEvitada={selectedMateria.isEvitada || false}
          onUpdate={() => {
            handleCloseMateriaInfo();
            fetchMaterias();
          }}
        />
      )}

      {/* Diálogo de confirmación */}
      <ConfirmDialog
        open={confirmDialog.open}
        onClose={closeConfirmDialog}
        onConfirm={confirmAction}
        title={confirmDialog.action === 'evitar' ? '¿Evitar esta materia?' : '¿Volver a tomar esta materia?'}
        message={
          confirmDialog.action === 'evitar'
            ? `¿Estás seguro de que deseas evitar "${confirmDialog.materia?.nombre}"? No recibirás asistencia en esta materia.`
            : `¿Estás seguro de que deseas volver a tomar "${confirmDialog.materia?.nombre}"? Volverás a recibir asistencia en esta materia.`
        }
        confirmText={confirmDialog.action === 'evitar' ? 'Evitar materia' : 'Volver a tomar'}
        cancelText="Cancelar"
        danger={confirmDialog.action === 'evitar'}
      />
    </div>
  );
}
