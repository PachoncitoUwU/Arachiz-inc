import React, { useState, useEffect, useContext } from 'react';
import {
  DndContext, DragOverlay, closestCenter, PointerSensor, useSensor, useSensors
} from '@dnd-kit/core';
import { useDraggable, useDroppable } from '@dnd-kit/core';
import fetchApi from '../../services/api';
import { AuthContext } from '../../context/AuthContext';
import PageHeader from '../../components/PageHeader';
import Modal from '../../components/Modal';
import ConfirmModal from '../../components/ConfirmModal';
import EmptyState from '../../components/EmptyState';
import { useToast } from '../../context/ToastContext';
import { Calendar, Plus, Trash2, Clock, Edit2, GripVertical, CheckCircle2, Check, AlertTriangle } from 'lucide-react';
import ConflictosAlert from '../../components/ConflictosAlert';

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

// ─── Materia draggable (desde la lista de arriba) ────────────────────────────
function MateriaDisponible({ materia, enHorario, color }) {
  const { attributes, listeners, setNodeRef, transform, isDragging } = useDraggable({ 
    id: `materia-${materia.id}`,
    data: { type: 'materia', materia }
  });

  const style = transform ? {
    transform: `translate3d(${transform.x}px, ${transform.y}px, 0)`,
    zIndex: 50,
  } : {};

  return (
    <div
      ref={setNodeRef}
      style={style}
      {...listeners}
      {...attributes}
      className={`relative p-3 rounded-xl border-2 transition-all select-none ${
        isDragging ? 'opacity-0' : 'hover:shadow-md'
      } ${enHorario ? 'border-green-300 dark:border-green-700' : 'border-gray-200 dark:border-gray-700'} ${color.bg} cursor-grab active:cursor-grabbing`}
    >
      <div className="flex items-start gap-2">
        <GripVertical size={16} className="text-gray-400 mt-0.5 flex-shrink-0" />
        <div className="flex-1 min-w-0">
          <p className={`text-sm font-bold truncate ${color.text}`}>{materia.nombre}</p>
          <p className="text-xs text-gray-500 dark:text-gray-400 truncate">Ficha {materia.ficha?.numero} - {materia.ficha?.nombre}</p>
        </div>
        {enHorario && (
          <CheckCircle2 size={16} className="text-green-500 flex-shrink-0" />
        )}
      </div>
    </div>
  );
}

// ─── Bloque draggable en el calendario ───────────────────────────────────────
function HorarioBloque({ horario, onEdit, isDragging, color, modoEditar, modoEliminar, isSelected, onToggleSelect }) {
  const { attributes, listeners, setNodeRef, transform } = useDraggable({ 
    id: horario.id,
    data: { type: 'horario', horario },
    disabled: modoEditar || modoEliminar // Deshabilitar drag cuando está en modo editar o eliminar
  });

  const style = transform ? {
    transform: `translate3d(${transform.x}px, ${transform.y}px, 0)`,
    zIndex: 50,
  } : {};

  const handleClick = (e) => {
    e.stopPropagation();
    if (modoEditar) {
      onEdit(horario);
    } else if (modoEliminar) {
      onToggleSelect(horario.id);
    }
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      {...(modoEditar || modoEliminar ? {} : listeners)}
      {...(modoEditar || modoEliminar ? {} : attributes)}
      onClick={handleClick}
      className={`group relative p-2.5 rounded-xl border transition-all select-none ${
        isDragging ? 'opacity-30' : 'hover:shadow-md hover:-translate-y-0.5'
      } ${
        modoEditar ? 'cursor-pointer hover:ring-2 hover:ring-blue-400' : 
        modoEliminar ? 'cursor-pointer' : 
        'cursor-grab active:cursor-grabbing'
      } ${
        isSelected ? 'ring-2 ring-red-400 bg-red-50 dark:bg-red-900/20' : `${color.bg} ${color.border}`
      }`}
    >
      <div className={modoEliminar ? 'pr-8' : ''}>
        <p className={`text-xs font-bold truncate ${color.text}`}>{horario.materia?.nombre}</p>
        <p className="text-xs text-gray-500 dark:text-gray-400 flex items-center gap-1 mt-0.5">
          <Clock size={10} /> {horario.horaInicio} – {horario.horaFin}
        </p>
        <p className="text-xs text-gray-400 dark:text-gray-500 truncate mt-0.5">Ficha {horario.materia?.ficha?.numero}</p>
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
}

// ─── Columna droppable ────────────────────────────────────────────────────────
function DiaColumna({ dia, clases, onEdit, activeId, modoEditar, modoEliminar, horariosSeleccionados, onToggleSelect, tieneConflicto }) {
  const { setNodeRef, isOver } = useDroppable({ id: dia });

  return (
    <div
      ref={setNodeRef}
      className={`card dark:bg-gray-900 dark:border-gray-800 transition-all min-h-[160px] ${
        isOver ? 'ring-2 ring-[#4285F4] ring-offset-1 bg-blue-50/50 dark:bg-blue-900/10' : ''
      } ${tieneConflicto ? 'border-2 border-red-400 dark:border-red-600' : ''}`}
    >
      <div className="flex items-center gap-2 mb-3 pb-2 border-b border-gray-100 dark:border-gray-800">
        <div className={`w-7 h-7 ${tieneConflicto ? 'bg-red-100 dark:bg-red-900/40' : 'bg-blue-50 dark:bg-blue-900/30'} rounded-lg flex items-center justify-center`}>
          {tieneConflicto ? (
            <AlertTriangle size={14} className="text-red-500" />
          ) : (
            <Calendar size={14} className="text-[#4285F4]" />
          )}
        </div>
        <span className="font-bold text-sm text-gray-800 dark:text-gray-200">{dia}</span>
        <span className="ml-auto badge badge-gray">{clases.length}</span>
      </div>

      {clases.length === 0 ? (
        <div className={`flex items-center justify-center h-16 rounded-xl border-2 border-dashed transition-colors ${
          isOver ? 'border-[#4285F4] bg-blue-50 dark:bg-blue-900/10' : 'border-gray-200 dark:border-gray-700'
        }`}>
          <p className="text-xs text-gray-400">Arrastra aquí</p>
        </div>
      ) : (
        <div className="space-y-2">
          {clases.map((c) => (
            <HorarioBloque
              key={c.id}
              horario={c}
              onEdit={onEdit}
              isDragging={activeId === c.id}
              color={COLORES[getColorForMateria(c.materiaId || c.materia?.id || c.materia?.nombre)]}
              modoEditar={modoEditar}
              modoEliminar={modoEliminar}
              isSelected={horariosSeleccionados.includes(c.id)}
              onToggleSelect={onToggleSelect}
            />
          ))}
        </div>
      )}
    </div>
  );
}

// ─── Página principal ─────────────────────────────────────────────────────────
export default function InstructorHorario() {
  const { showToast } = useToast();
  const { user } = useContext(AuthContext);
  const [materias, setMaterias] = useState([]);
  const [fichas, setFichas] = useState([]);
  const [selectedFichaId, setSelectedFichaId] = useState('all');
  const [horarios, setHorarios] = useState([]);
  const [loading, setLoading] = useState(false);
  const [modalEdit, setModalEdit] = useState(false);
  const [formEdit, setFormEdit] = useState({ id: '', dia: 'Lunes', horaInicio: '08:00', horaFin: '10:00' });
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [activeId, setActiveId] = useState(null);
  const [modalAddMateria, setModalAddMateria] = useState(false);
  const [materiaToAdd, setMateriaToAdd] = useState(null);
  const [diaToAdd, setDiaToAdd] = useState('');
  const [formAddMateria, setFormAddMateria] = useState({ horaInicio: '', horaFin: '' });
  const [modoEditar, setModoEditar] = useState(false);
  const [modoEliminar, setModoEliminar] = useState(false);
  const [horariosSeleccionados, setHorariosSeleccionados] = useState([]);
  const [confirmModal, setConfirmModal] = useState({ isOpen: false, count: 0 });
  const [conflictos, setConflictos] = useState([]);
  const [diasConConflicto, setDiasConConflicto] = useState([]);

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 8 } })
  );

  useEffect(() => {
    loadData();
    loadConflictos();
  }, []);

  const loadConflictos = async () => {
    try {
      const data = await fetchApi('/horarios/conflictos');
      const conflictosData = data.conflictos || [];
      setConflictos(conflictosData);
      // Extraer días con conflictos
      const dias = [...new Set(conflictosData.map(c => c.dia))];
      setDiasConConflicto(dias);
    } catch (err) {
      console.error('Error cargando conflictos:', err);
    }
  };

  const handleConflictoDismissed = (conflictosActuales) => {
    // Mantener los días con conflictos aunque se cierre la alerta
    const dias = [...new Set(conflictosActuales.map(c => c.dia))];
    setDiasConConflicto(dias);
  };

  const loadData = async () => {
    setLoading(true);
    try {
      const [m, h, f] = await Promise.all([
        fetchApi('/materias/my-materias'),
        fetchApi('/horarios/my-horarios'),
        fetchApi('/fichas/my-fichas')
      ]);
      setMaterias(m.materias || []);
      setHorarios(h.horarios || []);
      setFichas(f.fichas || []);
    } catch (err) {
      showToast(err.message || 'Error al cargar datos', 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleOpenEdit = (horario) => {
    if (!modoEditar) return; // Solo editar si el modo está activo
    setFormEdit({
      id: horario.id,
      dia: horario.dia,
      horaInicio: horario.horaInicio,
      horaFin: horario.horaFin
    });
    setModalEdit(true);
    setError('');
  };

  const toggleSeleccionHorario = (horarioId) => {
    if (!modoEliminar) return; // Solo seleccionar si el modo está activo
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

    setConfirmModal({ isOpen: true, count: horariosSeleccionados.length });
  };

  const confirmEliminarSeleccionados = async () => {
    try {
      await Promise.all(
        horariosSeleccionados.map(id => fetchApi(`/horarios/${id}`, { method: 'DELETE' }))
      );
      setHorarios(prev => prev.filter(h => !horariosSeleccionados.includes(h.id)));
      setHorariosSeleccionados([]);
      setModoEliminar(false);
      showToast(`${confirmModal.count} clase(s) enviada(s) a la papelera`, 'success');
    } catch (err) {
      showToast(err.message, 'error');
    }
  };

  const cancelarModoEliminar = () => {
    setModoEliminar(false);
    setHorariosSeleccionados([]);
  };

  const handleUpdateHorario = async (e) => {
    e.preventDefault();
    setError('');
    setSaving(true);
    try {
      const response = await fetchApi(`/horarios/${formEdit.id}`, {
        method: 'PUT',
        body: JSON.stringify({
          dia: formEdit.dia,
          horaInicio: formEdit.horaInicio,
          horaFin: formEdit.horaFin
        })
      });
      setHorarios(prev => prev.map(h => h.id === formEdit.id ? response.horario : h));
      setModalEdit(false);
      showToast('Horario actualizado', 'success');
      loadData(); // Recargar para obtener datos actualizados
    } catch (err) {
      setError(err.message);
    } finally {
      setSaving(false);
    }
  };

  const handleAddMateriaToCalendar = async (e) => {
    e.preventDefault();
    setError('');
    setSaving(true);
    try {
      const response = await fetchApi('/horarios', {
        method: 'POST',
        body: JSON.stringify({
          fichaId: materiaToAdd.fichaId,
          materiaId: materiaToAdd.id,
          dia: diaToAdd,
          horaInicio: formAddMateria.horaInicio,
          horaFin: formAddMateria.horaFin
        })
      });
      setHorarios(prev => [...prev, response.horario]);
      setModalAddMateria(false);
      setMateriaToAdd(null);
      setDiaToAdd('');
      setFormAddMateria({ horaInicio: '', horaFin: '' });
      showToast(`Clase agregada a ${diaToAdd}`, 'success');
    } catch (err) {
      setError(err.message);
    } finally {
      setSaving(false);
    }
  };

  // ─── Drag & Drop handlers ──────────────────────────────────────────────────
  const handleDragStart = ({ active }) => {
    setActiveId(active.id);
  };

  const handleDragEnd = async ({ active, over }) => {
    setActiveId(null);
    
    // Si no hay destino válido, no hacer nada (la materia vuelve a su lugar)
    if (!over) return;

    const activeData = active.data.current;
    const isDraggingMateria = activeData?.type === 'materia';
    const isDraggingHorario = activeData?.type === 'horario';

    // Si es una materia nueva, abrir modal para agregar horario
    if (isDraggingMateria && DIAS.includes(over.id)) {
      const materia = activeData.materia;
      const dia = over.id;
      
      setMateriaToAdd(materia);
      setDiaToAdd(dia);
      setFormAddMateria({ horaInicio: '', horaFin: '' });
      setModalAddMateria(true);
      setError('');
      return;
    }

    // Si es un horario existente, mover a otro día
    if (isDraggingHorario && DIAS.includes(over.id)) {
      const horario = horarios.find(h => h.id === active.id);
      const newDia = over.id;

      if (!horario || horario.dia === newDia) return;

      // Optimistic update
      setHorarios(prev => prev.map(h => h.id === active.id ? { ...h, dia: newDia } : h));

      try {
        await fetchApi(`/horarios/${active.id}`, {
          method: 'PUT',
          body: JSON.stringify({ dia: newDia })
        });
        showToast(`Clase movida a ${newDia}`, 'success');
      } catch (err) {
        showToast(err.message, 'error');
        loadData(); // Revertir si falla
      }
    }
  };

  const activeItem = activeId?.startsWith('materia-') 
    ? materias.find(m => `materia-${m.id}` === activeId)
    : horarios.find(h => h.id === activeId);

  // Filtrar materias y horarios por ficha seleccionada
  const filteredMaterias = selectedFichaId === 'all' 
    ? materias 
    : materias.filter(m => m.fichaId === selectedFichaId);
  
  const filteredHorarios = selectedFichaId === 'all' 
    ? horarios 
    : horarios.filter(h => h.materia?.fichaId === selectedFichaId);

  const byDia = DIAS.map(dia => ({
    dia,
    clases: filteredHorarios.filter(h => h.dia === dia).sort((a, b) => a.horaInicio.localeCompare(b.horaInicio))
  }));

  // Identificar qué materias ya tienen horarios
  const materiasConHorario = new Set(filteredHorarios.map(h => h.materiaId));

  return (
    <div className="animate-fade-in">
      <PageHeader
        title="Horario Semanal"
        subtitle={
          modoEditar ? "Haz click en una clase para editar sus horas" :
          modoEliminar ? `${horariosSeleccionados.length} clase(s) seleccionada(s)` :
          "Arrastra tus materias al calendario para crear horarios"
        }
      />

      {/* Alerta de conflictos */}
      <ConflictosAlert userType={user?.userType} onDismiss={handleConflictoDismissed} />

      {/* Botones de modo */}
      {!loading && materias.length > 0 && horarios.length > 0 && (
        <div className="flex flex-wrap gap-3 mb-6">
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

          {/* Selector de ficha */}
          {fichas.length > 1 && (
            <select 
              value={selectedFichaId} 
              onChange={(e) => setSelectedFichaId(e.target.value)}
              className="input-field max-w-xs ml-auto"
            >
              <option value="all">Todas las fichas</option>
              {fichas.map(f => (
                <option key={f.id} value={f.id}>
                  Ficha {f.numero} - {f.nombre}
                </option>
              ))}
            </select>
          )}
        </div>
      )}

      {loading ? (
        <div className="space-y-6">
          <div className="card animate-pulse">
            <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-1/4 mb-4" />
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
              {[1, 2, 3, 4].map(i => (
                <div key={i} className="h-20 bg-gray-100 dark:bg-gray-800 rounded-xl" />
              ))}
            </div>
          </div>
        </div>
      ) : materias.length === 0 ? (
        <div className="card">
          <EmptyState 
            icon={<Calendar size={32}/>} 
            title="No tienes materias asignadas" 
            description="Crea materias en tus fichas para poder gestionar horarios." 
          />
        </div>
      ) : (
        <DndContext
          sensors={sensors}
          collisionDetection={closestCenter}
          onDragStart={handleDragStart}
          onDragEnd={handleDragEnd}
        >
          {/* Sección de materias disponibles */}
          <div className="card mb-6">
            <h3 className="text-sm font-semibold text-gray-700 dark:text-gray-300 uppercase tracking-wide mb-3 flex items-center gap-2">
              <GripVertical size={16} className="text-gray-400" />
              Tienes {materias.length} {materias.length === 1 ? 'materia' : 'materias'} a cargo
            </h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
              {materias.map(materia => (
                <MateriaDisponible
                  key={materia.id}
                  materia={materia}
                  enHorario={materiasConHorario.has(materia.id)}
                  color={COLORES[getColorForMateria(materia.id || materia.nombre)]}
                />
              ))}
            </div>
            <p className="text-xs text-gray-400 dark:text-gray-500 mt-3 flex items-center gap-1">
              <CheckCircle2 size={12} className="text-green-500" />
              Las materias con check ya están en el horario
            </p>
          </div>

          {/* Calendario semanal */}
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-4">
            {byDia.map(({ dia, clases }) => (
              <DiaColumna 
                key={dia} 
                dia={dia} 
                clases={clases} 
                onEdit={handleOpenEdit}
                activeId={activeId}
                modoEditar={modoEditar}
                modoEliminar={modoEliminar}
                horariosSeleccionados={horariosSeleccionados}
                onToggleSelect={toggleSeleccionHorario}
                tieneConflicto={diasConConflicto.includes(dia)}
              />
            ))}
          </div>

          <DragOverlay>
            {activeItem && (
              <div className="p-3 bg-white dark:bg-gray-800 rounded-xl shadow-card border-2 border-blue-300 dark:border-blue-600 opacity-95 rotate-2">
                <p className="text-sm font-bold text-gray-800 dark:text-gray-200">
                  {activeItem.nombre || activeItem.materia?.nombre}
                </p>
                {activeItem.horaInicio && (
                  <p className="text-xs text-gray-500 dark:text-gray-400">
                    {activeItem.horaInicio} – {activeItem.horaFin}
                  </p>
                )}
              </div>
            )}
          </DragOverlay>
        </DndContext>
      )}

      {/* Modal para editar horario */}
      <Modal open={modalEdit} onClose={() => setModalEdit(false)} title="Editar Horario">
        <form onSubmit={handleUpdateHorario} className="space-y-4">
          {error && <p className="text-sm text-red-500 bg-red-50 dark:bg-red-900/20 px-3 py-2 rounded-xl">{error}</p>}
          
          <div>
            <label className="input-label">Día</label>
            <select 
              className="input-field" 
              value={formEdit.dia}
              onChange={e => setFormEdit(p => ({ ...p, dia: e.target.value }))}
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
                value={formEdit.horaInicio}
                onChange={e => setFormEdit(p => ({ ...p, horaInicio: e.target.value }))} 
              />
            </div>
            <div>
              <label className="input-label">Hora Fin</label>
              <input 
                type="time" 
                required 
                className="input-field" 
                value={formEdit.horaFin}
                onChange={e => setFormEdit(p => ({ ...p, horaFin: e.target.value }))} 
              />
            </div>
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

      {/* Modal para agregar materia al calendario */}
      <Modal open={modalAddMateria} onClose={() => setModalAddMateria(false)} title="Agregar Clase al Horario">
        <form onSubmit={handleAddMateriaToCalendar} className="space-y-4">
          {error && <p className="text-sm text-red-500 bg-red-50 dark:bg-red-900/20 px-3 py-2 rounded-xl">{error}</p>}
          
          {materiaToAdd && (
            <div className="p-3 bg-blue-50 dark:bg-blue-900/20 rounded-xl">
              <p className="text-xs text-gray-500 dark:text-gray-400 font-semibold uppercase tracking-wide mb-1">Materia</p>
              <p className="text-sm font-bold text-gray-900 dark:text-gray-100">{materiaToAdd.nombre}</p>
              <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">Ficha {materiaToAdd.ficha?.numero} - {materiaToAdd.ficha?.nombre}</p>
            </div>
          )}

          <div>
            <label className="input-label">Día</label>
            <input 
              type="text" 
              className="input-field bg-gray-50 dark:bg-gray-800" 
              value={diaToAdd} 
              disabled 
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="input-label">Hora Inicio</label>
              <input 
                type="time" 
                required 
                className="input-field" 
                value={formAddMateria.horaInicio}
                onChange={e => setFormAddMateria(p => ({ ...p, horaInicio: e.target.value }))} 
                placeholder="08:00"
              />
            </div>
            <div>
              <label className="input-label">Hora Fin</label>
              <input 
                type="time" 
                required 
                className="input-field" 
                value={formAddMateria.horaFin}
                onChange={e => setFormAddMateria(p => ({ ...p, horaFin: e.target.value }))} 
                placeholder="10:00"
              />
            </div>
          </div>

          <div className="flex gap-3 pt-2">
            <button type="button" onClick={() => setModalAddMateria(false)} className="btn-secondary flex-1">
              Cancelar
            </button>
            <button type="submit" disabled={saving} className="btn-primary flex-1">
              {saving ? 'Agregando...' : 'Agregar Clase'}
            </button>
          </div>
        </form>
      </Modal>

      <ConfirmModal
        isOpen={confirmModal.isOpen}
        onClose={() => setConfirmModal({ isOpen: false, count: 0 })}
        onConfirm={confirmEliminarSeleccionados}
        title="¿Enviar clases a papelera?"
        message={`¿Enviar ${confirmModal.count} clase(s) a la papelera? Podrán ser recuperadas desde la sección de papelera.`}
        confirmText="Eliminar"
        cancelText="Cancelar"
        variant="danger"
      />
    </div>
  );
}
