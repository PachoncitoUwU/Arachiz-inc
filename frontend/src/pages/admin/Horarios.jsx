import React, { useState, useEffect } from 'react';
import fetchApi from '../../services/api';
import PageHeader from '../../components/PageHeader';
import EmptyState from '../../components/EmptyState';
import Modal from '../../components/Modal';
import ConfirmModal from '../../components/ConfirmModal';
import { useToast } from '../../context/ToastContext';
import { Calendar, Clock, Edit2, AlertTriangle, Search, Users, BookOpen, Plus, Trash2, Check, X } from 'lucide-react';

const DIAS = ['Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado'];

const COLORES = [
  { bg: 'bg-blue-50 dark:bg-blue-900/20',   border: 'border-blue-200 dark:border-blue-700',   text: 'text-blue-800 dark:text-blue-300' },
  { bg: 'bg-green-50 dark:bg-green-900/20',  border: 'border-green-200 dark:border-green-700',  text: 'text-green-800 dark:text-green-300' },
  { bg: 'bg-purple-50 dark:bg-purple-900/20', border: 'border-purple-200 dark:border-purple-700', text: 'text-purple-800 dark:text-purple-300' },
  { bg: 'bg-yellow-50 dark:bg-yellow-900/20', border: 'border-yellow-200 dark:border-yellow-700', text: 'text-yellow-800 dark:text-yellow-300' },
  { bg: 'bg-red-50 dark:bg-red-900/20',    border: 'border-red-200 dark:border-red-700',    text: 'text-red-800 dark:text-red-300' },
  { bg: 'bg-pink-50 dark:bg-pink-900/20',   border: 'border-pink-200 dark:border-pink-700',   text: 'text-pink-800 dark:text-pink-300' },
];

const getColorForMateria = (str) => {
  if (!str) return 0;
  let hash = 0;
  for (let i = 0; i < str.length; i++) hash = str.charCodeAt(i) + ((hash << 5) - hash);
  return Math.abs(hash) % COLORES.length;
};

export default function AdminHorarios() {
  const { showToast } = useToast();
  
  // Estados principales
  const [viewMode, setViewMode] = useState('ficha'); // 'ficha' | 'instructor'
  const [loading, setLoading] = useState(false);
  
  // Estados para fichas
  const [fichas, setFichas] = useState([]);
  const [searchFicha, setSearchFicha] = useState('');
  const [selectedFicha, setSelectedFicha] = useState(null);
  
  // Estados para instructores
  const [instructores, setInstructores] = useState([]);
  const [searchInstructor, setSearchInstructor] = useState('');
  const [filterFichaId, setFilterFichaId] = useState('all');
  const [filterMateriaId, setFilterMateriaId] = useState('all');
  const [selectedInstructor, setSelectedInstructor] = useState(null);
  
  // Estados para horarios
  const [horarios, setHorarios] = useState([]);
  const [materias, setMaterias] = useState([]); // Materias disponibles para agregar
  
  // Estados para edición
  const [modoEditar, setModoEditar] = useState(false);
  const [modalEdit, setModalEdit] = useState(false);
  const [formEdit, setFormEdit] = useState({ id: '', dia: 'Lunes', horaInicio: '08:00', horaFin: '10:00', materiaId: '' });
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  
  // Estados para eliminar
  const [modoEliminar, setModoEliminar] = useState(false);
  const [horariosSeleccionados, setHorariosSeleccionados] = useState([]);
  const [confirmEliminar, setConfirmEliminar] = useState({ isOpen: false, count: 0 });
  
  // Estados para crear materia
  const [modalCrearMateria, setModalCrearMateria] = useState(false);
  const [formCrearMateria, setFormCrearMateria] = useState({
    nombre: '',
    tipo: 'Técnica',
    instructorId: '',
    fichaId: '',
    dia: 'Lunes',
    horaInicio: '',
    horaFin: ''
  });
  const [confirmDescartarCrear, setConfirmDescartarCrear] = useState(false);
  
  // Estados para agregar materia existente
  const [modalAgregarMateria, setModalAgregarMateria] = useState(false);
  const [formAgregarMateria, setFormAgregarMateria] = useState({
    materiaId: '',
    dia: 'Lunes',
    horaInicio: '',
    horaFin: ''
  });
  const [confirmDescartarAgregar, setConfirmDescartarAgregar] = useState(false);
  
  // Estados para conflictos
  const [conflictos, setConflictos] = useState([]);

  useEffect(() => {
    loadFichas();
    loadInstructores();
  }, []);

  const loadFichas = async () => {
    try {
      const data = await fetchApi('/admin/fichas');
      setFichas(data.fichas || []);
    } catch (err) {
      showToast(err.message || 'Error al cargar fichas', 'error');
    }
  };

  const loadInstructores = async () => {
    try {
      const data = await fetchApi('/admin/instructores');
      
      // Eliminar duplicados usando Map
      const instructoresMap = new Map();
      (data.instructores || []).forEach(item => {
        if (!instructoresMap.has(item.instructor.id)) {
          instructoresMap.set(item.instructor.id, {
            ...item.instructor,
            fichas: [item.ficha]
          });
        } else {
          const existing = instructoresMap.get(item.instructor.id);
          existing.fichas.push(item.ficha);
        }
      });
      
      setInstructores(Array.from(instructoresMap.values()));
    } catch (err) {
      showToast(err.message || 'Error al cargar instructores', 'error');
    }
  };

  const handleSelectFicha = async (ficha) => {
    setSelectedFicha(ficha);
    setSelectedInstructor(null);
    setModoEditar(false);
    setLoading(true);
    
    try {
      const data = await fetchApi(`/horarios/ficha/${ficha.id}`);
      setHorarios(data.horarios || []);
      
      // Cargar materias de la ficha para poder agregar
      const fichaDetalle = await fetchApi(`/admin/fichas/${ficha.id}`);
      setMaterias(fichaDetalle.ficha?.materias || []);
    } catch (err) {
      showToast(err.message || 'Error al cargar horario', 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleSelectInstructor = async (instructor) => {
    setSelectedInstructor(instructor);
    setSelectedFicha(null);
    setModoEditar(false);
    setLoading(true);
    
    try {
      // Cargar horarios del instructor usando endpoint de admin
      const horariosData = await fetchApi(`/admin/instructores/${instructor.id}/horarios`);
      setHorarios(horariosData.horarios || []);
      
      // Cargar materias del instructor usando endpoint de admin
      const materiasData = await fetchApi(`/admin/instructores/${instructor.id}/materias`);
      setMaterias(materiasData.materias || []);
      
      // Cargar conflictos del instructor
      const conflictosData = await fetchApi(`/admin/instructores/${instructor.id}/conflictos`);
      setConflictos(conflictosData.conflictos || []);
    } catch (err) {
      showToast(err.message || 'Error al cargar horario', 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleOpenEdit = (horario) => {
    if (!modoEditar) return;
    setFormEdit({
      id: horario.id,
      dia: horario.dia,
      horaInicio: horario.horaInicio,
      horaFin: horario.horaFin,
      materiaId: horario.materiaId
    });
    setModalEdit(true);
    setError('');
  };

  const handleUpdateHorario = async (e) => {
    e.preventDefault();
    setError('');
    setSaving(true);
    
    try {
      const response = await fetchApi(`/horarios/admin/${formEdit.id}`, {
        method: 'PUT',
        body: JSON.stringify({
          dia: formEdit.dia,
          horaInicio: formEdit.horaInicio,
          horaFin: formEdit.horaFin
        })
      });
      
      setHorarios(prev => prev.map(h => h.id === formEdit.id ? response.horario : h));
      setModalEdit(false);
      
      if (response.conflictos) {
        showToast(`Horario actualizado. ${response.conflictos.message}`, 'warning');
        // Recargar conflictos si estamos viendo un instructor
        if (selectedInstructor) {
          const conflictosData = await fetchApi(`/admin/instructores/${selectedInstructor.id}/conflictos`);
          setConflictos(conflictosData.conflictos || []);
        }
      } else {
        showToast('Horario actualizado', 'success');
      }
    } catch (err) {
      setError(err.message);
    } finally {
      setSaving(false);
    }
  };

  // Funciones para eliminar
  const toggleSeleccionHorario = (horarioId) => {
    if (!modoEliminar) return;
    setHorariosSeleccionados(prev => 
      prev.includes(horarioId) 
        ? prev.filter(id => id !== horarioId)
        : [...prev, horarioId]
    );
  };

  const handleEliminarSeleccionados = async () => {
    if (horariosSeleccionados.length === 0) {
      showToast('Selecciona al menos una clase para enviar a papelera', 'error');
      return;
    }
    setConfirmEliminar({ isOpen: true, count: horariosSeleccionados.length });
  };

  const confirmEliminarHorarios = async () => {
    try {
      await Promise.all(
        horariosSeleccionados.map(id => fetchApi(`/horarios/${id}`, { method: 'DELETE' }))
      );
      
      // Recargar horarios según la vista actual en lugar de filtrar del estado
      if (vista === 'ficha' && fichaSeleccionada) {
        const data = await fetchApi(`/horarios/ficha/${fichaSeleccionada.id}`);
        setHorarios(data.horarios || []);
      } else if (vista === 'instructor' && instructorSeleccionado) {
        const horariosData = await fetchApi(`/admin/instructores/${instructorSeleccionado.id}/horarios`);
        setHorarios(horariosData.horarios || []);
      }
      
      setHorariosSeleccionados([]);
      setModoEliminar(false);
      setConfirmEliminar({ isOpen: false, count: 0 });
      showToast(`${horariosSeleccionados.length} clase(s) enviada(s) a la papelera`, 'success');
    } catch (err) {
      showToast(err.message, 'error');
    }
  };

  const cancelarModoEliminar = () => {
    setModoEliminar(false);
    setHorariosSeleccionados([]);
  };

  // Funciones para crear materia
  const handleOpenCrearMateria = () => {
    setFormCrearMateria({
      nombre: '',
      tipo: 'Técnica',
      instructorId: selectedInstructor?.id || '',
      fichaId: selectedInstructor?.fichas?.[0]?.id || selectedFicha?.id || '',
      dia: 'Lunes',
      horaInicio: '',
      horaFin: ''
    });
    setModalCrearMateria(true);
    setError('');
  };

  const handleCloseCrearMateria = () => {
    const hasContent = formCrearMateria.nombre || formCrearMateria.horaInicio || formCrearMateria.horaFin || formCrearMateria.fichaId;
    if (hasContent) {
      setConfirmDescartarCrear(true);
    } else {
      setModalCrearMateria(false);
    }
  };

  const handleCrearMateria = async (e) => {
    e.preventDefault();
    setError('');
    setSaving(true);

    try {
      // Validar conflictos en el horario visible
      const conflictoVisible = horarios.find(h => {
        if (h.dia !== formCrearMateria.dia) return false;
        const inicio = formCrearMateria.horaInicio;
        const fin = formCrearMateria.horaFin;
        return (
          (h.horaInicio <= inicio && h.horaFin > inicio) ||
          (h.horaInicio < fin && h.horaFin >= fin) ||
          (h.horaInicio >= inicio && h.horaFin <= fin)
        );
      });

      if (conflictoVisible) {
        setError(`Ya hay una clase en ese horario: ${conflictoVisible.materia.nombre} (${conflictoVisible.horaInicio} - ${conflictoVisible.horaFin})`);
        setSaving(false);
        return;
      }

      // Validar que se haya seleccionado una ficha
      const fichaId = formCrearMateria.fichaId || selectedFicha?.id;
      if (!fichaId) {
        setError('Debes seleccionar una ficha');
        setSaving(false);
        return;
      }

      // Crear materia
      const materiaResponse = await fetchApi('/materias', {
        method: 'POST',
        body: JSON.stringify({
          nombre: formCrearMateria.nombre,
          tipo: formCrearMateria.tipo,
          fichaId: fichaId,
          instructorId: formCrearMateria.instructorId
        })
      });

      // Crear horario
      const horarioResponse = await fetchApi('/horarios', {
        method: 'POST',
        body: JSON.stringify({
          fichaId: fichaId,
          materiaId: materiaResponse.materia.id,
          dia: formCrearMateria.dia,
          horaInicio: formCrearMateria.horaInicio,
          horaFin: formCrearMateria.horaFin
        })
      });

      setHorarios(prev => [...prev, horarioResponse.horario]);
      setMaterias(prev => [...prev, materiaResponse.materia]);
      setModalCrearMateria(false);
      showToast('Materia y horario creados exitosamente', 'success');
    } catch (err) {
      setError(err.message);
    } finally {
      setSaving(false);
    }
  };

  // Funciones para agregar materia existente
  const handleOpenAgregarMateria = () => {
    setFormAgregarMateria({
      materiaId: '',
      dia: 'Lunes',
      horaInicio: '',
      horaFin: ''
    });
    setModalAgregarMateria(true);
    setError('');
  };

  const handleCloseAgregarMateria = () => {
    const hasContent = formAgregarMateria.materiaId || formAgregarMateria.horaInicio || formAgregarMateria.horaFin;
    if (hasContent) {
      setConfirmDescartarAgregar(true);
    } else {
      setModalAgregarMateria(false);
    }
  };

  const handleAgregarMateria = async (e) => {
    e.preventDefault();
    setError('');
    setSaving(true);

    try {
      // Validar conflictos en el horario visible
      const conflictoVisible = horarios.find(h => {
        if (h.dia !== formAgregarMateria.dia) return false;
        const inicio = formAgregarMateria.horaInicio;
        const fin = formAgregarMateria.horaFin;
        return (
          (h.horaInicio <= inicio && h.horaFin > inicio) ||
          (h.horaInicio < fin && h.horaFin >= fin) ||
          (h.horaInicio >= inicio && h.horaFin <= fin)
        );
      });

      if (conflictoVisible) {
        setError(`Ya hay una clase en ese horario: ${conflictoVisible.materia.nombre} (${conflictoVisible.horaInicio} - ${conflictoVisible.horaFin})`);
        setSaving(false);
        return;
      }

      // Crear horario
      const horarioResponse = await fetchApi('/horarios', {
        method: 'POST',
        body: JSON.stringify({
          fichaId: selectedFicha?.id || selectedInstructor?.fichas[0]?.id,
          materiaId: formAgregarMateria.materiaId,
          dia: formAgregarMateria.dia,
          horaInicio: formAgregarMateria.horaInicio,
          horaFin: formAgregarMateria.horaFin
        })
      });

      setHorarios(prev => [...prev, horarioResponse.horario]);
      setModalAgregarMateria(false);
      showToast('Horario agregado exitosamente', 'success');
    } catch (err) {
      setError(err.message);
    } finally {
      setSaving(false);
    }
  };

  // Filtrar fichas
  const filteredFichas = fichas.filter(f => {
    if (!searchFicha) return true;
    const query = searchFicha.toLowerCase();
    return f.numero.toString().includes(query) || f.nombre?.toLowerCase().includes(query);
  });

  // Filtrar instructores
  const filteredInstructores = instructores.filter(i => {
    // Filtro de búsqueda por nombre
    if (searchInstructor) {
      const query = searchInstructor.toLowerCase();
      if (!i.fullName?.toLowerCase().includes(query)) return false;
    }
    
    // Filtro por ficha
    if (filterFichaId !== 'all') {
      if (!i.fichas.some(f => f.id === filterFichaId)) return false;
    }
    
    // Filtro por materia
    if (filterMateriaId !== 'all') {
      // Necesitaríamos cargar las materias del instructor para este filtro
      // Por ahora lo dejamos como placeholder
    }
    
    return true;
  });

  // Agrupar horarios por día
  const horariosPorDia = DIAS.map(dia => ({
    dia,
    clases: horarios.filter(h => h.dia === dia).sort((a, b) => a.horaInicio.localeCompare(b.horaInicio))
  }));

  return (
    <div className="animate-fade-in">
      <PageHeader
        title="Gestión de Horarios"
        subtitle={
          modoEditar 
            ? "Haz click en una clase para editar sus horas" 
            : "Consulta y edita los horarios de fichas e instructores"
        }
      />

      {/* Toggle entre Ficha e Instructor */}
      <div className="card mb-5">
        <div className="flex gap-2">
          <button
            onClick={() => {
              setViewMode('ficha');
              setSelectedFicha(null);
              setSelectedInstructor(null);
              setHorarios([]);
              setModoEditar(false);
            }}
            className={`btn-secondary flex-1 flex items-center justify-center gap-2 ${
              viewMode === 'ficha' ? 'bg-red-100 dark:bg-red-900/30 text-red-600 dark:text-red-400 border-red-300 dark:border-red-700' : ''
            }`}
          >
            <Users size={16} />
            Ver por Ficha
          </button>
          <button
            onClick={() => {
              setViewMode('instructor');
              setSelectedFicha(null);
              setSelectedInstructor(null);
              setHorarios([]);
              setModoEditar(false);
            }}
            className={`btn-secondary flex-1 flex items-center justify-center gap-2 ${
              viewMode === 'instructor' ? 'bg-red-100 dark:bg-red-900/30 text-red-600 dark:text-red-400 border-red-300 dark:border-red-700' : ''
            }`}
          >
            <BookOpen size={16} />
            Ver por Instructor
          </button>
        </div>
      </div>

      {/* Sección de búsqueda y filtros */}
      {viewMode === 'ficha' ? (
        <div className="card mb-5">
          <h3 className="text-sm font-semibold text-gray-700 dark:text-gray-300 uppercase tracking-wide mb-3 flex items-center gap-2">
            <Search size={16} />
            Buscar Ficha
          </h3>
          <input
            type="text"
            placeholder="Buscar por número o nombre de ficha..."
            value={searchFicha}
            onChange={(e) => setSearchFicha(e.target.value)}
            className="input-field"
          />
        </div>
      ) : (
        <div className="card mb-5">
          <h3 className="text-sm font-semibold text-gray-700 dark:text-gray-300 uppercase tracking-wide mb-3 flex items-center gap-2">
            <Search size={16} />
            Buscar Instructor
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            <input
              type="text"
              placeholder="Buscar por nombre..."
              value={searchInstructor}
              onChange={(e) => setSearchInstructor(e.target.value)}
              className="input-field"
            />
            <select
              value={filterFichaId}
              onChange={(e) => setFilterFichaId(e.target.value)}
              className="input-field"
            >
              <option value="all">Todas las fichas</option>
              {fichas.map(f => (
                <option key={f.id} value={f.id}>Ficha {f.numero} - {f.nombre}</option>
              ))}
            </select>
          </div>
        </div>
      )}

      {/* Grid de fichas o instructores */}
      {!selectedFicha && !selectedInstructor && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mb-5">
          {viewMode === 'ficha' ? (
            filteredFichas.length === 0 ? (
              <div className="col-span-full">
                <EmptyState
                  icon={<Users size={32} />}
                  title="No se encontraron fichas"
                  description="No hay fichas que coincidan con tu búsqueda"
                />
              </div>
            ) : (
              filteredFichas.map((ficha, idx) => (
                <div
                  key={ficha.id}
                  onClick={() => handleSelectFicha(ficha)}
                  className="card cursor-pointer hover:shadow-lg hover:scale-[1.02] transition-all"
                  style={{ borderTopWidth: 3, borderTopColor: '#EA4335' }}
                >
                  <div className="flex items-start justify-between mb-2">
                    <div className="flex-1">
                      <h3 className="text-lg font-bold text-gray-900 dark:text-gray-100">
                        Ficha {ficha.numero}
                      </h3>
                      <p className="text-sm text-gray-600 dark:text-gray-400">{ficha.nombre}</p>
                      <p className="text-xs text-gray-400 dark:text-gray-500 mt-1">
                        {ficha.nivel} · {ficha.jornada}
                      </p>
                    </div>
                  </div>
                  <div className="grid grid-cols-3 gap-2 mt-3">
                    <div className="text-center p-2 bg-gray-50 dark:bg-gray-800 rounded-lg">
                      <p className="text-base font-bold text-gray-800 dark:text-gray-200">
                        {ficha._count?.instructores || 0}
                      </p>
                      <p className="text-[10px] text-gray-400 uppercase font-semibold">Instructores</p>
                    </div>
                    <div className="text-center p-2 bg-gray-50 dark:bg-gray-800 rounded-lg">
                      <p className="text-base font-bold text-gray-800 dark:text-gray-200">
                        {ficha._count?.materias || 0}
                      </p>
                      <p className="text-[10px] text-gray-400 uppercase font-semibold">Materias</p>
                    </div>
                    <div className="text-center p-2 bg-gray-50 dark:bg-gray-800 rounded-lg">
                      <p className="text-base font-bold text-gray-800 dark:text-gray-200">
                        {ficha._count?.aprendices || 0}
                      </p>
                      <p className="text-[10px] text-gray-400 uppercase font-semibold">Aprendices</p>
                    </div>
                  </div>
                </div>
              ))
            )
          ) : (
            filteredInstructores.length === 0 ? (
              <div className="col-span-full">
                <EmptyState
                  icon={<BookOpen size={32} />}
                  title="No se encontraron instructores"
                  description="No hay instructores que coincidan con tu búsqueda"
                />
              </div>
            ) : (
              filteredInstructores.map((instructor) => (
                <div
                  key={instructor.id}
                  onClick={() => handleSelectInstructor(instructor)}
                  className="card cursor-pointer hover:shadow-lg hover:scale-[1.02] transition-all"
                  style={{ borderTopWidth: 3, borderTopColor: '#4285F4' }}
                >
                  <div className="flex items-start gap-3 mb-3">
                    <div className="w-12 h-12 bg-blue-100 dark:bg-blue-900/30 rounded-full flex items-center justify-center flex-shrink-0">
                      <span className="text-lg font-bold text-blue-600 dark:text-blue-400">
                        {instructor.fullName?.charAt(0).toUpperCase()}
                      </span>
                    </div>
                    <div className="flex-1 min-w-0">
                      <h3 className="text-base font-bold text-gray-900 dark:text-gray-100 truncate">
                        {instructor.fullName}
                      </h3>
                      <p className="text-xs text-gray-500 dark:text-gray-400 truncate">{instructor.email}</p>
                    </div>
                  </div>
                  <div className="space-y-1">
                    <p className="text-xs text-gray-500 dark:text-gray-400 font-semibold">
                      Fichas ({instructor.fichas?.length || 0}):
                    </p>
                    {instructor.fichas?.slice(0, 2).map(f => (
                      <p key={f.id} className="text-xs text-gray-600 dark:text-gray-300 truncate">
                        • Ficha {f.numero} - {f.nombre}
                      </p>
                    ))}
                    {instructor.fichas?.length > 2 && (
                      <p className="text-xs text-gray-400">
                        +{instructor.fichas.length - 2} más
                      </p>
                    )}
                  </div>
                </div>
              ))
            )
          )}
        </div>
      )}

      {/* Información de la selección actual */}
      {(selectedFicha || selectedInstructor) && (
        <>
          <div className="card mb-5">
            <div className="flex items-start justify-between">
              <div className="flex-1">
                <h3 className="text-lg font-bold text-gray-900 dark:text-gray-100 mb-1">
                  {selectedFicha ? `Ficha ${selectedFicha.numero} - ${selectedFicha.nombre}` : selectedInstructor?.fullName}
                </h3>
                <p className="text-sm text-gray-500 dark:text-gray-400">
                  {selectedFicha ? `${selectedFicha.nivel} · ${selectedFicha.jornada}` : selectedInstructor?.email}
                </p>
              </div>
              <div className="flex gap-2">
                <button
                  onClick={() => {
                    setSelectedFicha(null);
                    setSelectedInstructor(null);
                    setHorarios([]);
                    setModoEditar(false);
                    setModoEliminar(false);
                    setConflictos([]);
                  }}
                  className="btn-secondary"
                >
                  Volver
                </button>
                {horarios.length > 0 && (
                  <>
                    <button
                      onClick={() => {
                        setModoEditar(!modoEditar);
                        setModoEliminar(false);
                        setHorariosSeleccionados([]);
                      }}
                      className={`btn-secondary flex items-center gap-2 ${
                        modoEditar ? 'bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 border-blue-300 dark:border-blue-700' : ''
                      }`}
                    >
                      <Edit2 size={16} />
                      {modoEditar ? 'Salir de Edición' : 'Modo Editar'}
                    </button>
                    
                    <button
                      onClick={() => {
                        if (modoEliminar) {
                          cancelarModoEliminar();
                        } else {
                          setModoEliminar(true);
                          setModoEditar(false);
                        }
                      }}
                      className={`btn-secondary flex items-center gap-2 ${
                        modoEliminar ? 'bg-red-100 dark:bg-red-900/30 text-red-600 dark:text-red-400 border-red-300 dark:border-red-700' : ''
                      }`}
                    >
                      <Trash2 size={16} />
                      {modoEliminar ? 'Cancelar' : 'Enviar a Papelera'}
                    </button>

                    {modoEliminar && horariosSeleccionados.length > 0 && (
                      <button
                        onClick={handleEliminarSeleccionados}
                        className="btn-primary bg-red-500 hover:bg-red-600 flex items-center gap-2"
                      >
                        <Trash2 size={16} />
                        Enviar a Papelera ({horariosSeleccionados.length})
                      </button>
                    )}
                  </>
                )}
                
                <button
                  onClick={handleOpenCrearMateria}
                  className="btn-primary flex items-center gap-2"
                >
                  <Plus size={16} />
                  Crear Materia
                </button>
                
                <button
                  onClick={handleOpenAgregarMateria}
                  className="btn-secondary flex items-center gap-2"
                >
                  <Plus size={16} />
                  Agregar Existente
                </button>
              </div>
            </div>
          </div>

          {/* Alerta de conflictos */}
          {selectedInstructor && conflictos.length > 0 && (
            <div className="card mb-5 bg-red-50 dark:bg-red-900/20 border-2 border-red-300 dark:border-red-700">
              <div className="flex items-start gap-3">
                <div className="w-10 h-10 bg-red-100 dark:bg-red-900/40 rounded-xl flex items-center justify-center shrink-0">
                  <AlertTriangle size={20} className="text-red-500" />
                </div>
                <div className="flex-1">
                  <h3 className="text-sm font-bold text-red-900 dark:text-red-100 mb-2">
                    ⚠️ Este instructor tiene {conflictos.length} conflicto(s) de horario
                  </h3>
                  <div className="space-y-2">
                    {conflictos.map(c => (
                      <div key={c.id} className="p-2 bg-white dark:bg-gray-800 rounded-lg border border-red-200 dark:border-red-800">
                        <div className="flex items-center gap-2 text-xs font-semibold text-red-800 dark:text-red-200">
                          <Calendar size={14} />
                          <span>{c.dia}</span>
                        </div>
                        <p className="text-xs text-red-600 dark:text-red-400 mt-1">
                          {c.descripcion}
                        </p>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Calendario de horarios */}
          {loading ? (
            <div className="card animate-pulse">
              <div className="h-64 bg-gray-100 dark:bg-gray-800 rounded-xl" />
            </div>
          ) : horarios.length === 0 ? (
            <div className="card">
              <EmptyState
                icon={<Calendar size={32} />}
                title="No hay horarios registrados"
                description={
                  selectedFicha 
                    ? "Esta ficha aún no tiene horarios asignados" 
                    : "Este instructor aún no tiene horarios asignados"
                }
              />
            </div>
          ) : (
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-4">
              {horariosPorDia.map(({ dia, clases }) => (
                <div key={dia} className="card dark:bg-gray-900 dark:border-gray-800 min-h-[160px]">
                  <div className="flex items-center gap-2 mb-3 pb-2 border-b border-gray-100 dark:border-gray-800">
                    <div className="w-7 h-7 bg-red-50 dark:bg-red-900/30 rounded-lg flex items-center justify-center">
                      <Calendar size={14} className="text-[#EA4335]" />
                    </div>
                    <span className="font-bold text-sm text-gray-800 dark:text-gray-200">{dia}</span>
                    <span className="ml-auto badge badge-gray">{clases.length}</span>
                  </div>

                  {clases.length === 0 ? (
                    <div className="flex items-center justify-center h-16 rounded-xl border-2 border-dashed border-gray-200 dark:border-gray-700">
                      <p className="text-xs text-gray-400">Sin clases</p>
                    </div>
                  ) : (
                    <div className="space-y-2">
                      {clases.map((c) => {
                        const color = COLORES[getColorForMateria(c.materiaId || c.materia?.id || c.materia?.nombre)];
                        const isSelected = horariosSeleccionados.includes(c.id);
                        return (
                          <div
                            key={c.id}
                            onClick={() => modoEditar ? handleOpenEdit(c) : modoEliminar ? toggleSeleccionHorario(c.id) : null}
                            className={`relative p-2.5 rounded-xl border transition-all ${
                              modoEditar || modoEliminar ? 'cursor-pointer hover:shadow-md' : ''
                            } ${
                              modoEditar ? 'hover:ring-2 hover:ring-blue-400' : ''
                            } ${
                              isSelected ? 'ring-2 ring-red-400 bg-red-50 dark:bg-red-900/20' : `${color.bg} ${color.border}`
                            }`}
                          >
                            <div className={modoEliminar ? 'pr-8' : ''}>
                              <p className={`text-xs font-bold truncate ${color.text}`}>
                                {c.materia?.nombre}
                              </p>
                              <p className="text-xs text-gray-500 dark:text-gray-400 flex items-center gap-1 mt-0.5">
                                <Clock size={10} /> {c.horaInicio} – {c.horaFin}
                              </p>
                              {selectedFicha && (
                                <p className="text-xs text-gray-400 dark:text-gray-500 truncate mt-0.5">
                                  {c.materia?.instructor?.fullName}
                                </p>
                              )}
                              {selectedInstructor && (
                                <p className="text-xs text-gray-400 dark:text-gray-500 truncate mt-0.5">
                                  Ficha {c.materia?.ficha?.numero}
                                </p>
                              )}
                            </div>
                            
                            {modoEliminar && (
                              <div className="absolute top-2 right-2">
                                <div className={`w-5 h-5 rounded border-2 flex items-center justify-center ${
                                  isSelected 
                                    ? 'bg-red-500 border-red-500' 
                                    : 'border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800'
                                }`}>
                                  {isSelected && <Check size={12} className="text-white" />}
                                </div>
                              </div>
                            )}
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </>
      )}

      {/* Modal para editar horario */}
      <Modal open={modalEdit} onClose={() => setModalEdit(false)} title="Editar Horario">
        <form onSubmit={handleUpdateHorario} className="space-y-4">
          {error && (
            <p className="text-sm text-red-500 bg-red-50 dark:bg-red-900/20 px-3 py-2 rounded-xl">
              {error}
            </p>
          )}

          <div className="p-3 bg-blue-50 dark:bg-blue-900/20 rounded-xl">
            <p className="text-xs text-gray-500 dark:text-gray-400 font-semibold uppercase tracking-wide mb-1">
              Materia
            </p>
            <p className="text-sm font-bold text-gray-900 dark:text-gray-100">
              {horarios.find(h => h.id === formEdit.id)?.materia?.nombre}
            </p>
          </div>

          <div>
            <label className="input-label">Día</label>
            <select
              className="input-field"
              value={formEdit.dia}
              onChange={(e) => setFormEdit((p) => ({ ...p, dia: e.target.value }))}
            >
              {DIAS.map((d) => (
                <option key={d}>{d}</option>
              ))}
            </select>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="input-label">Hora Inicio</label>
              <input
                type="time"
                required
                className="input-field"
                value={formEdit.horaInicio}
                onChange={(e) => setFormEdit((p) => ({ ...p, horaInicio: e.target.value }))}
              />
            </div>
            <div>
              <label className="input-label">Hora Fin</label>
              <input
                type="time"
                required
                className="input-field"
                value={formEdit.horaFin}
                onChange={(e) => setFormEdit((p) => ({ ...p, horaFin: e.target.value }))}
              />
            </div>
          </div>

          <div className="p-3 bg-yellow-50 dark:bg-yellow-900/20 rounded-xl border border-yellow-200 dark:border-yellow-700">
            <p className="text-xs text-yellow-800 dark:text-yellow-300">
              ⚠️ Si este cambio genera conflictos de horario, se notificará al instructor para que los resuelva.
            </p>
          </div>

          <div className="flex gap-3 pt-2">
            <button type="button" onClick={() => setModalEdit(false)} className="btn-secondary flex-1">
              Cancelar
            </button>
            <button type="submit" disabled={saving} className="btn-primary flex-1">
              {saving ? 'Guardando...' : 'Guardar Cambios'}
            </button>
          </div>
        </form>
      </Modal>

      {/* Modal para crear materia */}
      <Modal open={modalCrearMateria} onClose={handleCloseCrearMateria} title="Crear Nueva Materia">
        <form onSubmit={handleCrearMateria} className="space-y-4">
          {error && (
            <p className="text-sm text-red-500 bg-red-50 dark:bg-red-900/20 px-3 py-2 rounded-xl">
              {error}
            </p>
          )}

          <div>
            <label className="input-label">Nombre de la Materia</label>
            <input
              type="text"
              required
              className="input-field"
              placeholder="Ej: Matemáticas"
              value={formCrearMateria.nombre}
              onChange={(e) => setFormCrearMateria(p => ({ ...p, nombre: e.target.value }))}
            />
          </div>

          <div>
            <label className="input-label">Tipo</label>
            <select
              className="input-field"
              value={formCrearMateria.tipo}
              onChange={(e) => setFormCrearMateria(p => ({ ...p, tipo: e.target.value }))}
            >
              <option>Técnica</option>
              <option>Transversal</option>
            </select>
          </div>

          {viewMode === 'ficha' && (
            <div>
              <label className="input-label">Instructor a Cargo</label>
              <select
                required
                className="input-field"
                value={formCrearMateria.instructorId}
                onChange={(e) => setFormCrearMateria(p => ({ ...p, instructorId: e.target.value }))}
              >
                <option value="">Seleccionar instructor...</option>
                {materias
                  .map(m => m.instructor)
                  .filter((inst, idx, arr) => arr.findIndex(i => i.id === inst.id) === idx)
                  .map(instructor => (
                    <option key={instructor.id} value={instructor.id}>
                      {instructor.fullName}
                    </option>
                  ))}
              </select>
            </div>
          )}

          {viewMode === 'instructor' && (
            <>
              <div className="p-3 bg-blue-50 dark:bg-blue-900/20 rounded-xl">
                <p className="text-xs text-gray-500 dark:text-gray-400 font-semibold uppercase tracking-wide mb-1">
                  Instructor a Cargo
                </p>
                <p className="text-sm font-bold text-gray-900 dark:text-gray-100">
                  {selectedInstructor?.fullName}
                </p>
              </div>
              
              <div>
                <label className="input-label">Ficha</label>
                <select
                  required
                  className="input-field"
                  value={formCrearMateria.fichaId || ''}
                  onChange={(e) => setFormCrearMateria(p => ({ ...p, fichaId: e.target.value }))}
                >
                  <option value="">Seleccionar ficha...</option>
                  {selectedInstructor?.fichas?.map(ficha => (
                    <option key={ficha.id} value={ficha.id}>
                      Ficha {ficha.numero} - {ficha.nombre}
                    </option>
                  ))}
                </select>
              </div>
            </>
          )}

          <div>
            <label className="input-label">Día</label>
            <select
              className="input-field"
              value={formCrearMateria.dia}
              onChange={(e) => setFormCrearMateria(p => ({ ...p, dia: e.target.value }))}
            >
              {DIAS.map(d => <option key={d}>{d}</option>)}
            </select>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="input-label">Hora Inicio</label>
              <input
                type="time"
                required
                className="input-field"
                value={formCrearMateria.horaInicio}
                onChange={(e) => setFormCrearMateria(p => ({ ...p, horaInicio: e.target.value }))}
              />
            </div>
            <div>
              <label className="input-label">Hora Fin</label>
              <input
                type="time"
                required
                className="input-field"
                value={formCrearMateria.horaFin}
                onChange={(e) => setFormCrearMateria(p => ({ ...p, horaFin: e.target.value }))}
              />
            </div>
          </div>

          <div className="flex gap-3 pt-2">
            <button type="button" onClick={handleCloseCrearMateria} className="btn-secondary flex-1">
              Cancelar
            </button>
            <button type="submit" disabled={saving} className="btn-primary flex-1">
              {saving ? 'Creando...' : 'Crear Materia'}
            </button>
          </div>
        </form>
      </Modal>

      {/* Modal para agregar materia existente */}
      <Modal open={modalAgregarMateria} onClose={handleCloseAgregarMateria} title="Agregar Materia al Horario">
        <form onSubmit={handleAgregarMateria} className="space-y-4">
          {error && (
            <p className="text-sm text-red-500 bg-red-50 dark:bg-red-900/20 px-3 py-2 rounded-xl">
              {error}
            </p>
          )}

          <div>
            <label className="input-label">Materia</label>
            <select
              required
              className="input-field"
              value={formAgregarMateria.materiaId}
              onChange={(e) => setFormAgregarMateria(p => ({ ...p, materiaId: e.target.value }))}
            >
              <option value="">Seleccionar materia...</option>
              {materias.map(m => (
                <option key={m.id} value={m.id}>
                  {m.nombre} {viewMode === 'ficha' ? `(${m.instructor?.fullName})` : ''}
                </option>
              ))}
            </select>
            {viewMode === 'ficha' && (
              <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                Se muestran todas las materias de esta ficha
              </p>
            )}
          </div>

          <div>
            <label className="input-label">Día</label>
            <select
              className="input-field"
              value={formAgregarMateria.dia}
              onChange={(e) => setFormAgregarMateria(p => ({ ...p, dia: e.target.value }))}
            >
              {DIAS.map(d => <option key={d}>{d}</option>)}
            </select>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="input-label">Hora Inicio</label>
              <input
                type="time"
                required
                className="input-field"
                value={formAgregarMateria.horaInicio}
                onChange={(e) => setFormAgregarMateria(p => ({ ...p, horaInicio: e.target.value }))}
              />
            </div>
            <div>
              <label className="input-label">Hora Fin</label>
              <input
                type="time"
                required
                className="input-field"
                value={formAgregarMateria.horaFin}
                onChange={(e) => setFormAgregarMateria(p => ({ ...p, horaFin: e.target.value }))}
              />
            </div>
          </div>

          <div className="flex gap-3 pt-2">
            <button type="button" onClick={handleCloseAgregarMateria} className="btn-secondary flex-1">
              Cancelar
            </button>
            <button type="submit" disabled={saving} className="btn-primary flex-1">
              {saving ? 'Agregando...' : 'Agregar al Horario'}
            </button>
          </div>
        </form>
      </Modal>

      {/* Modal de confirmación para eliminar */}
      <ConfirmModal
        isOpen={confirmEliminar.isOpen}
        onClose={() => setConfirmEliminar({ isOpen: false, count: 0 })}
        onConfirm={confirmEliminarHorarios}
        title="¿Enviar clases a papelera?"
        message={`¿Estás seguro de enviar ${confirmEliminar.count} clase(s) a la papelera? Podrán ser recuperadas desde la sección de papelera.`}
        confirmText="Enviar a Papelera"
        cancelText="Cancelar"
        variant="danger"
      />

      {/* Modal de confirmación para descartar cambios (crear) */}
      <ConfirmModal
        isOpen={confirmDescartarCrear}
        onClose={() => setConfirmDescartarCrear(false)}
        onConfirm={() => {
          setConfirmDescartarCrear(false);
          setModalCrearMateria(false);
        }}
        title="¿Descartar cambios?"
        message="Tienes cambios sin guardar. ¿Deseas descartarlos?"
        confirmText="Descartar"
        cancelText="Seguir Editando"
        variant="danger"
      />

      {/* Modal de confirmación para descartar cambios (agregar) */}
      <ConfirmModal
        isOpen={confirmDescartarAgregar}
        onClose={() => setConfirmDescartarAgregar(false)}
        onConfirm={() => {
          setConfirmDescartarAgregar(false);
          setModalAgregarMateria(false);
        }}
        title="¿Descartar cambios?"
        message="Tienes cambios sin guardar. ¿Deseas descartarlos?"
        confirmText="Descartar"
        cancelText="Seguir Editando"
        variant="danger"
      />
    </div>
  );
}
