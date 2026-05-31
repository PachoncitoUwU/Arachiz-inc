import React, { useEffect, useState } from 'react';
import { Users, Search, GraduationCap, UserCheck, X, FolderOpen } from 'lucide-react';
import PageHeader from '../../components/PageHeader';
import EmptyState from '../../components/EmptyState';
import Modal from '../../components/Modal';
import fetchApi from '../../services/api';

export default function AdminUsuarios() {
  const [tab, setTab] = useState('instructores'); // 'instructores' | 'aprendices'
  const [instructores, setInstructores] = useState([]);
  const [aprendices, setAprendices] = useState([]);
  const [fichas, setFichas] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterFicha, setFilterFicha] = useState('all');
  
  // Modal de fichas del aprendiz
  const [modalFichasAprendiz, setModalFichasAprendiz] = useState(false);
  const [selectedAprendiz, setSelectedAprendiz] = useState(null);
  const [fichasAprendiz, setFichasAprendiz] = useState([]);
  const [loadingFichas, setLoadingFichas] = useState(false);
  
  // Modal de fichas del instructor
  const [modalFichasInstructor, setModalFichasInstructor] = useState(false);
  const [selectedInstructor, setSelectedInstructor] = useState(null);
  const [fichasInstructor, setFichasInstructor] = useState([]);
  const [loadingFichasInstructor, setLoadingFichasInstructor] = useState(false);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      setLoading(true);
      const [dataInstructores, dataAprendices, dataFichas] = await Promise.all([
        fetchApi('/admin/instructores'),
        fetchApi('/admin/aprendices'),
        fetchApi('/admin/fichas')
      ]);
      
      // Eliminar instructores duplicados usando Map
      const instructoresMap = new Map();
      (dataInstructores.instructores || []).forEach(item => {
        const instructor = item.instructor;
        if (!instructoresMap.has(instructor.id)) {
          instructoresMap.set(instructor.id, {
            ...instructor,
            fichas: [item.ficha]
          });
        } else {
          // Agregar ficha al instructor existente
          instructoresMap.get(instructor.id).fichas.push(item.ficha);
        }
      });
      
      const instructoresUnicos = Array.from(instructoresMap.values());
      
      // Cargar fichas de cada aprendiz para poder filtrar
      const aprendicesConFichas = await Promise.all(
        (dataAprendices.aprendices || []).map(async (aprendiz) => {
          try {
            const fichasData = await fetchApi(`/admin/aprendices/${aprendiz.id}/fichas`);
            return {
              ...aprendiz,
              fichasIds: (fichasData.fichas || []).map(f => f.id)
            };
          } catch (err) {
            return {
              ...aprendiz,
              fichasIds: []
            };
          }
        })
      );
      
      setInstructores(instructoresUnicos);
      setAprendices(aprendicesConFichas);
      setFichas(dataFichas.fichas || []);
    } catch (err) {
      console.error('Error cargando datos:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleOpenFichasAprendiz = async (aprendiz) => {
    setSelectedAprendiz(aprendiz);
    setModalFichasAprendiz(true);
    setLoadingFichas(true);
    
    try {
      const data = await fetchApi(`/admin/aprendices/${aprendiz.id}/fichas`);
      setFichasAprendiz(data.fichas || []);
    } catch (err) {
      console.error('Error cargando fichas del aprendiz:', err);
      setFichasAprendiz([]);
    } finally {
      setLoadingFichas(false);
    }
  };

  const handleCloseFichasAprendiz = () => {
    setModalFichasAprendiz(false);
    setSelectedAprendiz(null);
    setFichasAprendiz([]);
  };

  const handleOpenFichasInstructor = async (instructor) => {
    setSelectedInstructor(instructor);
    setModalFichasInstructor(true);
    setLoadingFichasInstructor(true);
    
    try {
      const data = await fetchApi(`/admin/instructores/${instructor.id}/fichas`);
      setFichasInstructor(data.fichas || []);
    } catch (err) {
      console.error('Error cargando fichas del instructor:', err);
      setFichasInstructor([]);
    } finally {
      setLoadingFichasInstructor(false);
    }
  };

  const handleCloseFichasInstructor = () => {
    setModalFichasInstructor(false);
    setSelectedInstructor(null);
    setFichasInstructor([]);
  };

  const handleClearFilters = () => {
    setSearchTerm('');
    setFilterFicha('all');
  };

  const currentList = tab === 'instructores' ? instructores : aprendices;
  const filteredList = currentList.filter(item => {
    const user = tab === 'instructores' ? item : item;
    
    // Filtro de búsqueda
    const matchesSearch = !searchTerm || (
      user.fullName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      user.email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      user.document?.toLowerCase().includes(searchTerm.toLowerCase())
    );
    
    // Filtro de ficha
    let matchesFicha = true;
    if (filterFicha !== 'all') {
      if (tab === 'instructores') {
        // Verificar si el instructor está en la ficha seleccionada
        matchesFicha = item.fichas && item.fichas.some(f => f.id === filterFicha);
      } else {
        // Para aprendices, verificar si está en la ficha seleccionada
        matchesFicha = item.fichasIds && item.fichasIds.includes(filterFicha);
      }
    }
    
    return matchesSearch && matchesFicha;
  });

  const hasActiveFilters = searchTerm !== '' || filterFicha !== 'all';

  return (
    <div className="space-y-6">
      <PageHeader
        title="Usuarios"
        subtitle="Gestión de instructores y aprendices"
      />

      {/* Tabs */}
      <div className="bg-white dark:bg-zinc-800  rounded-xl shadow-card p-1">
        <div className="grid grid-cols-2 gap-1">
          <button
            onClick={() => {
              setTab('instructores');
              handleClearFilters();
            }}
            className={`py-3 rounded-lg font-semibold transition-all ${
              tab === 'instructores'
                ? 'bg-blue-50 text-blue-600'
                : 'text-gray-600 hover:bg-gray-50'
            }`}
          >
            <div className="flex items-center justify-center gap-2">
              <UserCheck size={18} />
              <span>Instructores ({instructores.length})</span>
            </div>
          </button>
          <button
            onClick={() => {
              setTab('aprendices');
              handleClearFilters();
            }}
            className={`py-3 rounded-lg font-semibold transition-all ${
              tab === 'aprendices'
                ? 'bg-green-50 text-green-600'
                : 'text-gray-600 hover:bg-gray-50'
            }`}
          >
            <div className="flex items-center justify-center gap-2">
              <GraduationCap size={18} />
              <span>Aprendices ({aprendices.length})</span>
            </div>
          </button>
        </div>
      </div>

      {/* Filtros */}
      <div className="bg-white dark:bg-zinc-800  rounded-xl shadow-card p-4">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
          {/* Buscador */}
          <div className="relative md:col-span-2">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={20} />
            <input
              type="text"
              placeholder="Buscar por nombre, email o documento..."
              className="w-full pl-10 pr-4 py-2 border border-gray-200 dark:border-zinc-700  rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>

          {/* Filtro por ficha */}
          <select
            value={filterFicha}
            onChange={(e) => setFilterFicha(e.target.value)}
            className="px-4 py-2 border border-gray-200 dark:border-zinc-700  rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="all">Todas las fichas</option>
            {fichas.map(ficha => (
              <option key={ficha.id} value={ficha.id}>
                Ficha {ficha.numero}
              </option>
            ))}
          </select>

          {/* Botón limpiar filtros */}
          {hasActiveFilters && (
            <button
              onClick={handleClearFilters}
              className="btn-secondary flex items-center justify-center gap-2"
            >
              <X size={16} />
              Limpiar filtros
            </button>
          )}
        </div>
      </div>

      {/* Lista de usuarios */}
      {loading ? (
        <div className="text-center py-12 text-gray-500">Cargando usuarios...</div>
      ) : filteredList.length === 0 ? (
        <EmptyState
          icon={<Users size={48} className="text-gray-400" />}
          title={`Sin ${tab}`}
          description={hasActiveFilters ? "No se encontraron usuarios con esos filtros" : `No hay ${tab} registrados`}
        />
      ) : (
        <div className="bg-white dark:bg-zinc-800  rounded-xl shadow-card overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50 border-b border-gray-200 dark:border-zinc-700 ">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase">Usuario</th>
                  <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase">Email</th>
                  <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase">Documento</th>
                  <th className="px-6 py-3 text-center text-xs font-semibold text-gray-600 uppercase">Acciones</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {filteredList.map((item) => {
                  const user = tab === 'instructores' ? item : item;
                  return (
                    <tr key={user.id} className="hover:bg-gray-50">
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-3">
                          {user.avatarUrl ? (
                            <img src={user.avatarUrl} alt="" className="w-10 h-10 rounded-full object-cover" />
                          ) : (
                            <div className={`w-10 h-10 rounded-full ${tab === 'instructores' ? 'bg-blue-100 text-blue-600' : 'bg-green-100 text-green-600'} flex items-center justify-center font-bold`}>
                              {user.fullName?.charAt(0) || '?'}
                            </div>
                          )}
                          <div>
                            <div className="font-semibold text-gray-900 dark:text-white ">{user.fullName}</div>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-600">{user.email}</td>
                      <td className="px-6 py-4 text-sm text-gray-600">{user.document}</td>
                      <td className="px-6 py-4 text-center">
                        <button
                          onClick={() => tab === 'instructores' ? handleOpenFichasInstructor(user) : handleOpenFichasAprendiz(user)}
                          className="btn-secondary text-sm"
                        >
                          Ver Fichas
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Modal de fichas del aprendiz */}
      {selectedAprendiz && (
        <Modal 
          open={modalFichasAprendiz} 
          onClose={handleCloseFichasAprendiz} 
          title={`Fichas de ${selectedAprendiz.fullName}`}
        >
          {loadingFichas ? (
            <div className="text-center py-8 text-gray-500">Cargando fichas...</div>
          ) : fichasAprendiz.length === 0 ? (
            <div className="text-center py-8">
              <FolderOpen size={32} className="text-gray-300 mx-auto mb-2" />
              <p className="text-sm text-gray-400">Este aprendiz no está inscrito en ninguna ficha</p>
            </div>
          ) : (
            <div className="space-y-2">
              {fichasAprendiz.map(ficha => (
                <div 
                  key={ficha.id} 
                  className="p-4 bg-gray-50 dark:bg-gray-800 rounded-xl border border-gray-100 dark:border-zinc-700  dark:border-gray-700"
                >
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="font-semibold text-gray-900 dark:text-white  dark:text-white">Ficha {ficha.numero}</p>
                      <p className="text-sm text-gray-600 dark:text-gray-400">{ficha.nombre}</p>
                      <p className="text-xs text-gray-500 dark:text-gray-500 mt-1">
                        {ficha.nivel} · {ficha.centro}
                      </p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </Modal>
      )}

      {/* Modal de fichas del instructor */}
      {selectedInstructor && (
        <Modal 
          open={modalFichasInstructor} 
          onClose={handleCloseFichasInstructor} 
          title={`Fichas de ${selectedInstructor.fullName}`}
        >
          {loadingFichasInstructor ? (
            <div className="text-center py-8 text-gray-500">Cargando fichas...</div>
          ) : fichasInstructor.length === 0 ? (
            <div className="text-center py-8">
              <FolderOpen size={32} className="text-gray-300 mx-auto mb-2" />
              <p className="text-sm text-gray-400">Este instructor no está asignado a ninguna ficha</p>
            </div>
          ) : (
            <div className="space-y-2">
              {fichasInstructor.map(ficha => {
                const isLider = ficha.instructorAdminId === selectedInstructor.id;
                
                return (
                  <div 
                    key={ficha.id} 
                    className="p-4 bg-gray-50 dark:bg-gray-800 rounded-xl border border-gray-100 dark:border-zinc-700  dark:border-gray-700"
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex-1">
                        <div className="flex items-center gap-2">
                          <p className="font-semibold text-gray-900 dark:text-white  dark:text-white">Ficha {ficha.numero}</p>
                          {isLider && (
                            <span className="px-2 py-0.5 bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400 rounded-full text-xs font-semibold">
                              Líder
                            </span>
                          )}
                        </div>
                        <p className="text-sm text-gray-600 dark:text-gray-400">{ficha.nombre}</p>
                        <p className="text-xs text-gray-500 dark:text-gray-500 mt-1">
                          {ficha.nivel} · {ficha.centro}
                        </p>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </Modal>
      )}
    </div>
  );
}
