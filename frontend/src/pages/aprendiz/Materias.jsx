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
  
  // Estados para Vista A / Vista B
  const [currentView, setCurrentView] = useState('competencias');
  const [selectedCompetenciaView, setSelectedCompetenciaView] = useState(null);
  const [competenciasBrutas, setCompetenciasBrutas] = useState([]);

  const { t } = useSettings();
  const { showToast } = useToast();

  const fetchMaterias = () => {
    Promise.all([
      fetchApi('/competencias/my-competencias'),
      fetchApi('/resultados-evitados/my-resultados-evitados')
    ])
      .then(([competenciasRes, evitadasRes]) => {
        const list = [];
        const evitadas = evitadasRes.resultadosEvitados || [];

        // 1. Add active outcomes
        if (competenciasRes.competencias) {
          competenciasRes.competencias.forEach(comp => {
            if (comp.resultados) {
              comp.resultados.forEach(res => {
                list.push({
                  id: res.id,
                  nombre: `${comp.nombre} – ${res.nombre}`,
                  tipo: comp.tipo,
                  ficha: comp.ficha,
                  instructor: res.instructor,
                  horarios: res.horarios,
                  asistencias: res.asistencias,
                  competenciaId: comp.id,
                  isEvitada: false
                });
              });
            }
          });
        }

        // 2. Add avoided outcomes
        evitadas.forEach(re => {
          if (re.resultado) {
            const res = re.resultado;
            const comp = res.competencia;
            list.push({
              id: res.id,
              nombre: `${comp?.nombre || ''} – ${res.nombre}`,
              tipo: comp?.tipo || 'Técnica',
              ficha: comp?.ficha,
              instructor: res.instructor,
              horarios: res.horarios || [],
              asistencias: [],
              competenciaId: comp?.id,
              isEvitada: true
            });
          }
        });

        // Guardamos las competencias originales para la Vista A
        setCompetenciasBrutas(competenciasRes.competencias || []);

        setMaterias(list);
        setMateriasEvitadas(evitadas);
      })
      .catch(console.error)
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    fetchMaterias();
  }, []);

  const handleEvitarMateria = async (materia) => {
    try {
      await fetchApi(`/resultados-evitados/resultados/${materia.id}/evitar`, { method: 'POST' });
      showToast('Resultado evitado exitosamente', 'success');
      fetchMaterias();
    } catch (error) {
      showToast(error.message || 'Error al evitar resultado', 'error');
    }
  };

  const handleVolverATomarMateria = async (materia) => {
    try {
      await fetchApi(`/resultados-evitados/resultados/${materia.id}/volver-a-tomar`, { method: 'DELETE' });
      showToast('Ahora puedes tomar este resultado nuevamente', 'success');
      fetchMaterias();
    } catch (error) {
      showToast(error.message || 'Error al volver a tomar resultado', 'error');
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

  const isMateriaEvitada = (resultadoId) => {
    return materiasEvitadas.some(re => re.resultadoId === resultadoId);
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
        subtitle="Estos son todos tus resultados de aprendizaje"
      />

      {competenciasBrutas.length === 0 ? (
        <div className="card">
          <EmptyState icon={<BookOpen size={32}/>} title={t('subjects.emptyTitle')}
            description={t('subjects.emptyDesc')} />
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
          
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {materias.filter(m => m.competenciaId === selectedCompetenciaView.id).map((m, idx) => {
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
                >
                  <div className="flex items-start justify-between mb-3">
                    <div className={`w-10 h-10 ${col.bg} rounded-xl flex items-center justify-center shrink-0`}>
                      <BookOpen size={20} className={col.icon}/>
                    </div>
                    <div className="flex flex-wrap gap-1">
                      <span className={`badge ${m.tipo === 'Técnica' ? 'badge-info' : m.tipo === 'Básica' ? 'badge-purple' : 'badge-gray'}`}>{m.tipo}</span>
                      {hasActive && <span className="badge badge-success">{t('subjects.active')}</span>}
                      {evitada && <span className="badge badge-warning">Evitado</span>}
                    </div>
                  </div>
                  <h3 className="font-bold text-gray-900 dark:text-white mb-1">{m.nombre.split(' – ')[1] || m.nombre}</h3>
                  
                  {/* Información del Instructor */}
                  <div className="flex items-center gap-1.5 text-xs text-gray-500 dark:text-gray-400 mb-3 pb-2 border-b border-gray-100 dark:border-zinc-700">
                    <User size={12}/>
                    <span>{m.instructor?.fullName || 'Sin instructor asignado'}</span>
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
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 pt-3 border-t border-gray-100 dark:border-zinc-700 mb-3">
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
                      Volver a tomar resultado
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
                      Evitar este resultado
                    </button>
                  )}
                </div>
              );
            })}
            
            {materias.filter(m => m.competenciaId === selectedCompetenciaView.id).length === 0 && (
              <div className="col-span-full p-8 text-center text-gray-500 bg-gray-50 dark:bg-zinc-800/50 rounded-xl">
                Esta competencia aún no tiene resultados de aprendizaje asignados.
              </div>
            )}
          </div>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 animate-fade-in">
          {competenciasBrutas.map((comp, idx) => {
            const col = COLORES[idx % COLORES.length];
            return (
              <div key={comp.id} className="p-4 rounded-xl border border-gray-100 dark:border-zinc-700 bg-white dark:bg-zinc-900 hover:shadow-soft transition-all">
                <div className="flex items-start justify-between mb-3">
                  <div className={`w-10 h-10 ${col.bg} rounded-xl flex items-center justify-center shrink-0`}>
                    <BookOpen size={20} className={col.icon}/>
                  </div>
                  <span className={`badge ${comp.tipo === 'Técnica' ? 'badge-info' : comp.tipo === 'Básica' ? 'badge-purple' : 'badge-gray'}`}>{comp.tipo}</span>
                </div>
                
                <div className="flex items-start justify-between">
                  <div className="flex-1 pr-4">
                    <h3 className="font-bold text-gray-900 dark:text-white mb-2">{comp.nombre}</h3>
                  </div>
                  <div className="flex-shrink-0">
                    <button 
                      onClick={(e) => { e.stopPropagation(); setSelectedCompetenciaView(comp); setCurrentView('resultados'); }}
                      className="text-xs font-semibold text-blue-600 bg-blue-50 dark:bg-blue-900/20 dark:text-blue-400 hover:bg-blue-100 dark:hover:bg-blue-900/40 px-3 py-1.5 rounded-lg transition-colors whitespace-nowrap"
                    >
                      Ver resultados de aprendizaje ({comp.resultados?.length || 0})
                    </button>
                  </div>
                </div>
                
                <div className="flex items-center gap-1.5 text-xs text-gray-500 dark:text-gray-400 mt-2">
                  <BookOpen size={12}/>
                  <span className="font-medium">Ficha {comp.ficha?.numero}</span>
                  {comp.ficha?.nombre && <span className="truncate">· {comp.ficha.nombre}</span>}
                </div>
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
        title={confirmDialog.action === 'evitar' ? '¿Evitar este resultado?' : '¿Volver a tomar este resultado?'}
        message={
          confirmDialog.action === 'evitar'
            ? `¿Estás seguro de que deseas evitar "${confirmDialog.materia?.nombre}"? No recibirás asistencia en este resultado.`
            : `¿Estás seguro de que deseas volver a tomar "${confirmDialog.materia?.nombre}"? Volverás a recibir asistencia en este resultado.`
        }
        confirmText={confirmDialog.action === 'evitar' ? 'Evitar resultado' : 'Volver a tomar'}
        cancelText="Cancelar"
        danger={confirmDialog.action === 'evitar'}
      />
    </div>
  );
}
