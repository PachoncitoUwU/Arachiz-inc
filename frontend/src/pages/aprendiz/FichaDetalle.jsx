import React, { useState, useEffect, useContext } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { AuthContext } from '../../context/AuthContext';
import fetchApi from '../../services/api';
import { useToast } from '../../context/ToastContext';
import MateriaInfoModal from '../../components/MateriaInfoModal';
import {
  ArrowLeft, Users, BookOpen, Star
} from 'lucide-react';

const API_BASE = import.meta.env.VITE_SOCKET_URL || 'http://localhost:3000';

const resolveAvatar = (url) => {
  if (!url) return null;
  if (url.startsWith('data:') || url.startsWith('http') || url.startsWith('blob:')) return url;
  return `${API_BASE}${url}`;
};

export default function AprendizFichaDetalle() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user } = useContext(AuthContext);
  const { showToast } = useToast();
  
  const [ficha, setFicha] = useState(null);
  const [loading, setLoading] = useState(true);
  const [modalMateriaInfo, setModalMateriaInfo] = useState(false);
  const [selectedMateria, setSelectedMateria] = useState(null);
  const [materiasEvitadas, setMateriasEvitadas] = useState([]);
  
  // Estados para pestañas y búsqueda
  const [activeTab, setActiveTab] = useState('aprendices');
  const [searchQuery, setSearchQuery] = useState('');
  const [filterTipo, setFilterTipo] = useState('all');
  const [filterInstructor, setFilterInstructor] = useState('all');
  
  // Estado para fichas ancladas
  const [isPinned, setIsPinned] = useState(false);

  useEffect(() => {
    loadFicha();
    loadMateriasEvitadas();
  }, [id]);
  
  useEffect(() => {
    // Cargar estado de anclado desde localStorage
    if (ficha && user) {
      const pinnedFichas = JSON.parse(localStorage.getItem(`pinnedFichas_${user.id}`) || '[]');
      setIsPinned(pinnedFichas.includes(ficha.id));
    }
  }, [ficha, user]);

  const loadFicha = async () => {
    try {
      setLoading(true);
      const data = await fetchApi(`/fichas/${id}`);
      setFicha(data.ficha);
    } catch (err) {
      showToast(err.message || 'Error al cargar la ficha', 'error');
      navigate('/aprendiz/fichas');
    } finally {
      setLoading(false);
    }
  };

  const loadMateriasEvitadas = async () => {
    try {
      const data = await fetchApi('/materias-evitadas/my-materias-evitadas');
      setMateriasEvitadas(data.materiasEvitadas.map(me => me.materiaId));
    } catch (err) {
      console.error('Error al cargar materias evitadas:', err);
    }
  };

  const handleOpenMateriaInfo = (materia) => {
    setSelectedMateria(materia);
    setModalMateriaInfo(true);
  };

  const handleCloseMateriaInfo = () => {
    setModalMateriaInfo(false);
    setSelectedMateria(null);
  };
  
  const togglePin = () => {
    const pinnedFichas = JSON.parse(localStorage.getItem(`pinnedFichas_${user.id}`) || '[]');
    let newPinnedFichas;
    
    if (isPinned) {
      // Desanclar
      newPinnedFichas = pinnedFichas.filter(fichaId => fichaId !== ficha.id);
      showToast('Ficha desanclada', 'success');
    } else {
      // Anclar
      newPinnedFichas = [...pinnedFichas, ficha.id];
      showToast('Ficha anclada', 'success');
    }
    
    localStorage.setItem(`pinnedFichas_${user.id}`, JSON.stringify(newPinnedFichas));
    setIsPinned(!isPinned);
  };

  if (loading) {
    return (
      <div className="animate-fade-in">
        <div className="flex items-center gap-3 mb-6">
          <button onClick={() => navigate('/aprendiz/fichas')} className="btn-icon text-gray-400 hover:bg-gray-100">
            <ArrowLeft size={20} />
          </button>
          <div className="space-y-2">
            <div className="h-8 bg-gray-200 dark:bg-gray-700 rounded w-48 animate-pulse" />
            <div className="h-4 bg-gray-100 dark:bg-gray-800 rounded w-32 animate-pulse" />
          </div>
        </div>
        
        <div className="grid grid-cols-3 gap-4 mb-6">
          {[1, 2, 3].map(i => (
            <div key={i} className="card animate-pulse">
              <div className="h-16 bg-gray-100 dark:bg-gray-800 rounded" />
            </div>
          ))}
        </div>

        <div className="card animate-pulse mb-6">
          <div className="h-6 bg-gray-200 dark:bg-gray-700 rounded w-1/3 mb-4" />
          <div className="space-y-3">
            <div className="h-12 bg-gray-100 dark:bg-gray-800 rounded" />
            <div className="h-12 bg-gray-100 dark:bg-gray-800 rounded" />
          </div>
        </div>

        <div className="card animate-pulse mb-6">
          <div className="h-10 bg-gray-100 dark:bg-gray-800 rounded w-1/2 mb-4" />
          <div className="space-y-3">
            <div className="h-16 bg-gray-100 dark:bg-gray-800 rounded" />
            <div className="h-16 bg-gray-100 dark:bg-gray-800 rounded" />
          </div>
        </div>

        <div className="card animate-pulse">
          <div className="h-6 bg-gray-200 dark:bg-gray-700 rounded w-1/4 mb-4" />
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
            {[1, 2, 3].map(i => (
              <div key={i} className="h-16 bg-gray-100 dark:bg-gray-800 rounded-xl" />
            ))}
          </div>
        </div>
      </div>
    );
  }

  if (!ficha) return null;

  const COLOR = '#4285F4';

  // Filtrar aprendices (solo nombre)
  const filteredAprendices = (ficha.aprendices || []).filter(aprendiz => {
    if (!searchQuery) return true;
    const query = searchQuery.toLowerCase();
    return aprendiz.fullName.toLowerCase().includes(query);
  }).sort((a, b) => a.fullName.localeCompare(b.fullName));

  // Filtrar materias
  const filteredMaterias = (ficha.materias || []).filter(materia => {
    let matches = true;
    
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      matches = matches && materia.nombre.toLowerCase().includes(query);
    }
    
    if (filterTipo !== 'all') {
      matches = matches && materia.tipo === filterTipo;
    }
    
    if (filterInstructor !== 'all') {
      matches = matches && materia.instructorId === filterInstructor;
    }
    
    return matches;
  });

  const uniqueInstructors = [...new Set((ficha.materias || []).map(m => m.instructorId))]
    .map(id => {
      const materia = ficha.materias.find(m => m.instructorId === id);
      return {
        id,
        name: materia?.instructor?.fullName || 'Desconocido'
      };
    });

  return (
    <div className="animate-fade-in">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <button 
            onClick={() => navigate('/aprendiz/fichas')} 
            className="btn-icon text-gray-400 hover:bg-gray-100"
            title="Volver a fichas"
          >
            <ArrowLeft size={20} />
          </button>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Ficha {ficha.numero}</h1>
              <button
                onClick={togglePin}
                className={`p-1.5 rounded-lg transition-all ${
                  isPinned 
                    ? 'text-yellow-500 hover:text-yellow-600 hover:bg-yellow-50 dark:hover:bg-yellow-900/20' 
                    : 'text-gray-400 hover:text-yellow-500 hover:bg-gray-100 dark:hover:bg-gray-800'
                }`}
                title={isPinned ? 'Desanclar ficha' : 'Anclar ficha'}
              >
                <Star size={20} fill={isPinned ? 'currentColor' : 'none'} />
              </button>
            </div>
            <p className="text-sm text-gray-500 dark:text-gray-400 mt-0.5">
              {ficha.nombre || ficha.nivel}
            </p>
          </div>
        </div>
      </div>

      {/* Estadísticas */}
      <div className="grid grid-cols-3 gap-4 mb-6">
        <div className="card">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs text-gray-500 dark:text-gray-400 font-semibold uppercase tracking-wide mb-1">
                Instructores
              </p>
              <p className="text-2xl font-bold text-purple-600 dark:text-purple-400">
                {ficha.instructores?.length || 0}
              </p>
            </div>
            <div className="w-12 h-12 rounded-xl bg-purple-50 dark:bg-purple-900/20 flex items-center justify-center">
              <Users size={24} className="text-purple-600 dark:text-purple-400" />
            </div>
          </div>
        </div>

        <div className="card">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs text-gray-500 dark:text-gray-400 font-semibold uppercase tracking-wide mb-1">
                Aprendices
              </p>
              <p className="text-2xl font-bold text-[#4285F4]">
                {ficha.aprendices?.length || 0}
              </p>
            </div>
            <div className="w-12 h-12 rounded-xl bg-blue-50 dark:bg-blue-900/20 flex items-center justify-center">
              <Users size={24} className="text-[#4285F4]" />
            </div>
          </div>
        </div>

        <div className="card">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs text-gray-500 dark:text-gray-400 font-semibold uppercase tracking-wide mb-1">
                Materias
              </p>
              <p className="text-2xl font-bold text-[#34A853]">
                {ficha.materias?.length || 0}
              </p>
            </div>
            <div className="w-12 h-12 rounded-xl bg-green-50 dark:bg-green-900/20 flex items-center justify-center">
              <BookOpen size={24} className="text-[#34A853]" />
            </div>
          </div>
        </div>
      </div>

      {/* Información General */}
      <div className="card mb-6">
        <h2 className="text-lg font-bold text-gray-900 dark:text-white mb-4">Información General</h2>
        
        <div className="grid grid-cols-3 gap-3">
          <div className="p-2.5 bg-gray-50 dark:bg-gray-800 rounded-lg">
            <p className="text-xs text-gray-500 dark:text-gray-400 font-semibold mb-0.5">Número</p>
            <p className="text-sm font-bold text-gray-900 dark:text-gray-100">{ficha.numero}</p>
          </div>
          <div className="p-2.5 bg-gray-50 dark:bg-gray-800 rounded-lg">
            <p className="text-xs text-gray-500 dark:text-gray-400 font-semibold mb-0.5">Nivel</p>
            <p className="text-sm font-bold text-gray-900 dark:text-gray-100">{ficha.nivel}</p>
          </div>
          <div className="p-2.5 bg-gray-50 dark:bg-gray-800 rounded-lg">
            <p className="text-xs text-gray-500 dark:text-gray-400 font-semibold mb-0.5">Jornada</p>
            <p className="text-sm font-bold text-gray-900 dark:text-gray-100">{ficha.jornada}</p>
          </div>
          <div className="p-2.5 bg-gray-50 dark:bg-gray-800 rounded-lg col-span-3">
            <p className="text-xs text-gray-500 dark:text-gray-400 font-semibold mb-0.5">Programa</p>
            <p className="text-sm font-bold text-gray-900 dark:text-gray-100">{ficha.nombre || 'Sin nombre'}</p>
          </div>
          <div className="p-2.5 bg-gray-50 dark:bg-gray-800 rounded-lg col-span-2">
            <p className="text-xs text-gray-500 dark:text-gray-400 font-semibold mb-0.5">Centro</p>
            <p className="text-sm font-bold text-gray-900 dark:text-gray-100">{ficha.centro}</p>
          </div>
          <div className="p-2.5 bg-gray-50 dark:bg-gray-800 rounded-lg">
            <p className="text-xs text-gray-500 dark:text-gray-400 font-semibold mb-0.5">Duración</p>
            <p className="text-sm font-bold text-gray-900 dark:text-gray-100">
              {ficha.duracion ? `${ficha.duracion}m` : 'N/A'}
            </p>
          </div>
          {ficha.region && (
            <div className="p-2.5 bg-gray-50 dark:bg-gray-800 rounded-lg col-span-3">
              <p className="text-xs text-gray-500 dark:text-gray-400 font-semibold mb-0.5">Región</p>
              <p className="text-sm font-bold text-gray-900 dark:text-gray-100">{ficha.region}</p>
            </div>
          )}
        </div>
      </div>

      {/* Pestañas: Aprendices y Materias */}
      <div className="card mb-6">
        <div className="flex items-center justify-between border-b border-gray-200 dark:border-gray-700 mb-4">
          <div className="flex gap-1">
            <button
              onClick={() => {
                setActiveTab('aprendices');
                setSearchQuery('');
                setFilterTipo('all');
                setFilterInstructor('all');
              }}
              className={`px-4 py-2.5 text-sm font-medium transition-colors relative ${
                activeTab === 'aprendices'
                  ? 'text-[#4285F4]'
                  : 'text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-300'
              }`}
            >
              <div className="flex items-center gap-2">
                <Users size={16} />
                Aprendices ({ficha.aprendices?.length || 0})
              </div>
              {activeTab === 'aprendices' && (
                <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-[#4285F4]" />
              )}
            </button>
            
            <button
              onClick={() => {
                setActiveTab('materias');
                setSearchQuery('');
                setFilterTipo('all');
                setFilterInstructor('all');
              }}
              className={`px-4 py-2.5 text-sm font-medium transition-colors relative ${
                activeTab === 'materias'
                  ? 'text-[#34A853]'
                  : 'text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-300'
              }`}
            >
              <div className="flex items-center gap-2">
                <BookOpen size={16} />
                Materias ({ficha.materias?.length || 0})
              </div>
              {activeTab === 'materias' && (
                <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-[#34A853]" />
              )}
            </button>
          </div>
        </div>

        {/* Contenido de Aprendices */}
        {activeTab === 'aprendices' && (
          <>
            <div className="mb-4">
              <input
                type="text"
                placeholder="Buscar por nombre..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="input-field"
              />
            </div>

            {filteredAprendices.length === 0 ? (
              <div className="text-center py-8">
                <Users size={32} className="text-gray-300 mx-auto mb-2" />
                <p className="text-sm text-gray-400">
                  {searchQuery ? 'No se encontraron aprendices' : 'Sin aprendices inscritos aún'}
                </p>
              </div>
            ) : (
              <div className="space-y-2 max-h-96 overflow-y-auto">
                {filteredAprendices.map(aprendiz => {
                  const avatarSrc = resolveAvatar(aprendiz.avatarUrl);
                  return (
                    <div 
                      key={aprendiz.id} 
                      className="flex items-center gap-3 p-3 rounded-xl hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors border border-gray-100 dark:border-gray-700"
                    >
                      {avatarSrc ? (
                        <img 
                          src={avatarSrc} 
                          className="w-10 h-10 rounded-xl object-cover" 
                          alt={aprendiz.fullName} 
                        />
                      ) : (
                        <div 
                          className="w-10 h-10 rounded-xl flex items-center justify-center text-sm font-bold text-white"
                          style={{ backgroundColor: COLOR }}
                        >
                          {aprendiz.fullName.split(' ').map(n => n[0]).slice(0, 2).join('').toUpperCase()}
                        </div>
                      )}
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-gray-800 dark:text-gray-200 truncate">{aprendiz.fullName}</p>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </>
        )}

        {/* Contenido de Materias */}
        {activeTab === 'materias' && (
          <>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-3 mb-4">
              <input
                type="text"
                placeholder="Buscar por nombre..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="input-field"
              />
              
              <select
                value={filterTipo}
                onChange={(e) => setFilterTipo(e.target.value)}
                className="input-field"
              >
                <option value="all">Todos los tipos</option>
                <option value="Técnica">Técnica</option>
                <option value="Transversal">Transversal</option>
              </select>

              <select
                value={filterInstructor}
                onChange={(e) => setFilterInstructor(e.target.value)}
                className="input-field"
              >
                <option value="all">Todos los instructores</option>
                {uniqueInstructors.map(inst => (
                  <option key={inst.id} value={inst.id}>{inst.name}</option>
                ))}
              </select>
            </div>

            {filteredMaterias.length === 0 ? (
              <div className="text-center py-8">
                <BookOpen size={32} className="text-gray-300 mx-auto mb-2" />
                <p className="text-sm text-gray-400">
                  {searchQuery || filterTipo !== 'all' || filterInstructor !== 'all' 
                    ? 'No se encontraron materias con esos filtros' 
                    : 'Sin materias asignadas aún'}
                </p>
              </div>
            ) : (
              <div className="space-y-2 max-h-96 overflow-y-auto">
                {filteredMaterias.map(materia => {
                  const isEvitada = materiasEvitadas.includes(materia.id);
                  return (
                    <div 
                      key={materia.id} 
                      className={`flex items-center justify-between p-3 rounded-xl hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors border cursor-pointer ${
                        isEvitada 
                          ? 'border-red-200 dark:border-red-800 opacity-60' 
                          : 'border-gray-100 dark:border-gray-700'
                      }`}
                      onClick={() => handleOpenMateriaInfo(materia)}
                    >
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <p className="text-sm font-medium text-gray-800 dark:text-gray-200 truncate">{materia.nombre}</p>
                          {isEvitada && (
                            <span className="badge bg-red-100 text-red-600 dark:bg-red-900/30 dark:text-red-400 text-xs">
                              Evitada
                            </span>
                          )}
                        </div>
                        <p className="text-xs text-gray-400">{materia.tipo}</p>
                      </div>
                      <div className="text-right">
                        <p className="text-xs text-gray-500 dark:text-gray-400">Instructor</p>
                        <p className="text-sm font-medium text-gray-700 dark:text-gray-300 truncate max-w-[150px]">
                          {materia.instructor?.fullName}
                        </p>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </>
        )}
      </div>

      {/* Instructores */}
      <div className="card">
        <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-4">
          Instructores ({ficha.instructores?.length || 0})
        </h3>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
          {ficha.instructores?.map(fi => {
            const avatarSrc = resolveAvatar(fi.instructor.avatarUrl);
            const isAdminInstructor = fi.role === 'admin';
            
            return (
              <div 
                key={fi.id} 
                className="flex items-center gap-3 p-3 rounded-xl bg-gray-50 dark:bg-gray-800 border border-gray-100 dark:border-gray-700"
              >
                {avatarSrc ? (
                  <img 
                    src={avatarSrc} 
                    className="w-10 h-10 rounded-xl object-cover" 
                    alt={fi.instructor.fullName} 
                  />
                ) : (
                  <div 
                    className="w-10 h-10 rounded-xl flex items-center justify-center text-sm font-bold text-white"
                    style={{ backgroundColor: COLOR }}
                  >
                    {fi.instructor.fullName.split(' ').map(n => n[0]).slice(0, 2).join('').toUpperCase()}
                  </div>
                )}
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-gray-800 dark:text-gray-200 truncate">
                    {fi.instructor.fullName}
                  </p>
                </div>
                {isAdminInstructor && (
                  <span className="badge badge-info shrink-0 text-xs">Admin</span>
                )}
              </div>
            );
          })}
        </div>
      </div>

      {/* Modal de información de materia (simplificado para aprendiz) */}
      {selectedMateria && (
        <MateriaInfoModal 
          open={modalMateriaInfo} 
          onClose={handleCloseMateriaInfo} 
          materia={selectedMateria}
          isCreatorOrAdmin={false}
          isAprendizView={true}
        />
      )}
    </div>
  );
}
