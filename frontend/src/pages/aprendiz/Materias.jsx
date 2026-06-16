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

const COLORES_FICHA = [
  { bg: 'bg-blue-50',   icon: 'text-[#4285F4]',  card: 'bg-blue-50/60 border-blue-100',   accent: '#4285F4' },
  { bg: 'bg-green-50',  icon: 'text-[#34A853]',  card: 'bg-green-50/60 border-green-100', accent: '#34A853' },
  { bg: 'bg-purple-50', icon: 'text-purple-500', card: 'bg-purple-50/60 border-purple-100', accent: '#8b5cf6' },
  { bg: 'bg-yellow-50', icon: 'text-[#FBBC05]',  card: 'bg-yellow-50/60 border-yellow-100', accent: '#FBBC05' },
  { bg: 'bg-red-50',    icon: 'text-[#EA4335]',  card: 'bg-red-50/60 border-red-100',     accent: '#EA4335' },
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

        // Filter out avoided outcomes
        const evitadosIds = new Set(evitadas.map(re => re.resultadoId));

        // 1. Add active outcomes
        if (competenciasRes.competencias) {
          competenciasRes.competencias.forEach(comp => {
            if (comp.resultados) {
              comp.resultados = comp.resultados.filter(res => !evitadosIds.has(res.id));
              comp.resultados.forEach(res => {
                list.push({
                  id: res.id,
                  nombre: `${comp.nombre} – ${res.nombre}`,
                  tipo: comp.tipo,
                  ficha: comp.ficha,
                  competencia: comp,
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

        // We no longer push avoided outcomes to the list, per user request.

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

  // Agrupar por ficha
  const byFichaMap = new Map();
  competenciasBrutas.forEach(c => {
    const fichaId = c.fichaId || c.ficha?.id;
    if (!fichaId) return;
    if (!byFichaMap.has(fichaId)) {
      byFichaMap.set(fichaId, { ficha: c.ficha || { id: fichaId, numero: '?', nombre: '' }, competencias: [] });
    }
    byFichaMap.get(fichaId).competencias.push(c);
  });
  const byFicha = Array.from(byFichaMap.values());

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
                <div key={m.id} className="p-4 bg-white dark:bg-zinc-900 rounded-xl border border-gray-100 dark:border-zinc-700 hover:shadow-md transition-all border-t-4 cursor-pointer"
                  style={{ borderTopColor: col.accent }}
                  onClick={() => handleOpenMateriaInfo(m)}
                >
                  <div className="flex items-start justify-between mb-2">
                    <div className={`w-8 h-8 ${col.bg} rounded-lg flex items-center justify-center shrink-0`}>
                      <BookOpen size={16} className={col.icon}/>
                    </div>
                    <div className="flex flex-wrap gap-1">
                      {hasActive && <span className="badge badge-success text-[10px] py-0.5 px-1.5">{t('subjects.active')}</span>}
                    </div>
                  </div>
                  <h3 className="font-bold text-sm text-gray-900 dark:text-white mb-1 leading-tight">{m.nombre.split(' – ')[1] || m.nombre}</h3>
                  
                  {/* Información del Instructor */}
                  <div className="flex items-center gap-1.5 text-xs text-gray-500 dark:text-gray-400 mb-2 pb-2 border-b border-gray-100 dark:border-zinc-700">
                    <User size={12}/>
                    <span className="truncate">{m.instructor?.fullName || 'Sin instructor'}</span>
                  </div>
                  
                  {totalSesiones > 0 && (
                    <div className="mb-2">
                      <div className="flex justify-between text-[10px] text-gray-500 dark:text-gray-400 mb-1">
                        <span>{t('subjects.attendance')}</span>
                        <span className="font-semibold">{pct}%</span>
                      </div>
                      <div className="h-1 bg-gray-100 dark:bg-gray-700 rounded-full overflow-hidden">
                        <div className="h-full rounded-full transition-all"
                          style={{ width: `${pct}%`, backgroundColor: col.accent }}/>
                      </div>
                    </div>
                  )}
                  <div className="grid grid-cols-2 gap-2 pt-2 mb-2 border-t border-gray-100 dark:border-zinc-700">
                    <div className="text-center">
                      <p className="text-sm font-bold text-gray-800 dark:text-gray-200 leading-none">{totalSesiones}</p>
                      <p className="text-[10px] text-gray-400 mt-0.5">{t('subjects.sessions')}</p>
                    </div>
                    <div className="text-center">
                      <p className="text-sm font-bold leading-none" style={{ color: col.accent }}>{misPresencias}</p>
                      <p className="text-[10px] text-gray-400 mt-0.5">{t('subjects.attendances')}</p>
                    </div>
                  </div>
                  
                  {/* Botón para evitar materia */}
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      openConfirmDialog(m, 'evitar');
                    }}
                    className="w-full flex items-center justify-center gap-1.5 px-2 py-1.5 bg-gray-50 dark:bg-gray-800 text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors text-xs font-medium"
                  >
                    <EyeOff size={14} />
                    Evitar resultado
                  </button>
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
        <div className="space-y-6 animate-fade-in">
          {byFicha.map(({ ficha, competencias: comps }, fichaIdx) => {
            const col = COLORES_FICHA[fichaIdx % COLORES_FICHA.length];
            return (
            <div key={ficha.id} className="card" style={{ borderTopWidth: 3, borderTopColor: col.accent }}>
              <div className="flex items-center gap-2 mb-4 pb-3 border-b border-gray-100 dark:border-zinc-700">
                <div className={`w-8 h-8 ${col.bg} rounded-lg flex items-center justify-center`}>
                  <BookOpen size={16} className={col.icon}/>
                </div>
                <div>
                  <p className="font-bold text-gray-900 dark:text-white text-sm">Ficha {ficha.numero}</p>
                  <p className="text-xs text-gray-400">{ficha.nivel} · {ficha.jornada}</p>
                </div>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                {comps.map((m, mIdx) => {
                  const mCol = COLORES_FICHA[mIdx % COLORES_FICHA.length];
                  const hasActive = m.resultados?.some(r => r.asistencias?.some(a => a.activa));
                  return (
                    <div 
                      key={m.id} 
                      className={`p-3 rounded-xl border hover:shadow-soft transition-all ${mCol.card}`}
                    >
                      <div className="flex items-start justify-between">
                        <div className="flex-1 min-w-0 pr-4">
                          <p className="font-semibold text-sm text-gray-800 truncate">{m.nombre}</p>
                        </div>
                        <div className="flex-shrink-0">
                          <button 
                            onClick={(e) => { e.stopPropagation(); setSelectedCompetenciaView(m); setCurrentView('resultados'); }}
                            className="text-xs font-semibold text-blue-600 bg-blue-50 dark:bg-blue-900/20 dark:text-blue-400 hover:bg-blue-100 dark:hover:bg-blue-900/40 px-3 py-1.5 rounded-lg transition-colors whitespace-nowrap"
                          >
                            Ver resultados ({m.resultados?.length || 0})
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
