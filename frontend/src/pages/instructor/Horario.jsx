import React, { useState, useEffect, useContext } from 'react';
import {
  DndContext, DragOverlay, closestCenter, PointerSensor, useSensor, useSensors
} from '@dnd-kit/core';
import { useDraggable, useDroppable } from '@dnd-kit/core';
import fetchApi from '../../services/api';
import { AuthContext } from '../../context/AuthContext';
import PageHeader from '../../components/PageHeader';
import Modal from '../../components/Modal';
import EmptyState from '../../components/EmptyState';
import { useToast } from '../../context/ToastContext';
import { Calendar, Plus, Trash2, Clock, Edit2, GripVertical, CheckCircle2 } from 'lucide-react';

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
function HorarioBloque({ horario, onDelete, onEdit, isDragging, color }) {
  const { attributes, listeners, setNodeRef, transform } = useDraggable({ 
    id: horario.id,
    data: { type: 'horario', horario }
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
      className={`group relative p-2.5 rounded-xl border cursor-grab active:cursor-grabbing transition-all select-none ${
        isDragging ? 'opacity-30' : 'hover:shadow-md hover:-translate-y-0.5'
      } ${color.bg} ${color.border}`}
    >
      <div className="pr-14">
        <p className={`text-xs font-bold truncate ${color.text}`}>{horario.materia?.nombre}</p>
        <p className="text-xs text-gray-500 dark:text-gray-400 flex items-center gap-1 mt-0.5">
          <Clock size={10} /> {horario.horaInicio} – {horario.horaFin}
        </p>
        <p className="text-xs text-gray-400 dark:text-gray-500 truncate mt-0.5">Ficha {horario.materia?.ficha?.numero}</p>
      </div>
      <div className="absolute top-1.5 right-1.5 flex gap-0.5 opacity-0 group-hover:opacity-100 transition-opacity">
        <button
          onPointerDown={e => e.stopPropagation()}
          onClick={e => { e.stopPropagation(); onEdit(horario); }}
          className="w-5 h-5 flex items-center justify-center rounded-lg text-blue-500 hover:bg-blue-100 dark:hover:bg-blue-900/30"
          title="Editar horario"
        >
          <Edit2 size={11} />
        </button>
        <button
          onPointerDown={e => e.stopPropagation()}
          onClick={e => { e.stopPropagation(); onDelete(horario.id); }}
          className="w-5 h-5 flex items-center justify-center rounded-lg text-red-400 hover:bg-red-100 dark:hover:bg-red-900/30"
          title="Eliminar"
        >
          <Trash2 size={11} />
        </button>
      </div>
    </div>
  );
}

// ─── Columna droppable ────────────────────────────────────────────────────────
function DiaColumna({ dia, clases, onDelete, onEdit, activeId }) {
  const { setNodeRef, isOver } = useDroppable({ id: dia });

  return (
    <div
      ref={setNodeRef}
      className={`card dark:bg-gray-900 dark:border-gray-800 transition-all min-h-[160px] ${
        isOver ? 'ring-2 ring-[#4285F4] ring-offset-1 bg-blue-50/50 dark:bg-blue-900/10' : ''
      }`}
    >
      <div className="flex items-center gap-2 mb-3 pb-2 border-b border-gray-100 dark:border-gray-800">
        <div className="w-7 h-7 bg-blue-50 dark:bg-blue-900/30 rounded-lg flex items-center justify-center">
          <Calendar size={14} className="text-[#4285F4]" />
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
              onDelete={onDelete}
              onEdit={onEdit}
              isDragging={activeId === c.id}
              color={COLORES[getColorForMateria(c.materiaId || c.materia?.id || c.materia?.nombre)]}
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

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 8 } })
  );

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    setLoading(true);
    try {
      const [m, h] = await Promise.all([
        fetchApi('/materias/my-materias'),
        fetchApi('/horarios/my-horarios')
      ]);
      setMaterias(m.materias || []);
      setHorarios(h.horarios || []);
    } catch (err) {
      showToast(err.message || 'Error al cargar datos', 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id) => {
    if (!confirm('¿Eliminar esta clase del horario?')) return;
    try {
      await fetchApi(`/horarios/${id}`, { method: 'DELETE' });
      setHorarios(prev => prev.filter(h => h.id !== id));
      showToast('Clase eliminada', 'success');
    } catch (err) { 
      showToast(err.message, 'error'); 
    }
  };

  const handleOpenEdit = (horario) => {
    setFormEdit({
      id: horario.id,
      dia: horario.dia,
      horaInicio: horario.horaInicio,
      horaFin: horario.horaFin
    });
    setModalEdit(true);
    setError('');
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

  const byDia = DIAS.map(dia => ({
    dia,
    clases: horarios.filter(h => h.dia === dia).sort((a, b) => a.horaInicio.localeCompare(b.horaInicio))
  }));

  // Identificar qué materias ya tienen horarios
  const materiasConHorario = new Set(horarios.map(h => h.materiaId));

  return (
    <div className="animate-fade-in">
      <PageHeader
        title="Horario Semanal"
        subtitle="Arrastra tus materias al calendario para crear horarios"
      />

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
              Tus Materias ({materias.length})
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
                onDelete={handleDelete}
                onEdit={handleOpenEdit}
                activeId={activeId} 
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
    </div>
  );
}
