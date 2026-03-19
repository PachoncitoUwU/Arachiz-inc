import React, { useState, useEffect } from 'react';
import {
  DndContext, DragOverlay, closestCenter, PointerSensor, useSensor, useSensors
} from '@dnd-kit/core';
import { useDraggable, useDroppable } from '@dnd-kit/core';
import fetchApi from '../../services/api';
import PageHeader from '../../components/PageHeader';
import Modal from '../../components/Modal';
import EmptyState from '../../components/EmptyState';
import { useToast } from '../../context/ToastContext';
import { Calendar, Plus, Trash2, Clock, GripVertical } from 'lucide-react';

const DIAS = ['Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado'];

// ─── Bloque draggable ─────────────────────────────────────────────────────────
function HorarioBloque({ horario, onDelete, isDragging }) {
  const { attributes, listeners, setNodeRef, transform } = useDraggable({ id: horario.id });

  const style = transform ? {
    transform: `translate3d(${transform.x}px, ${transform.y}px, 0)`,
    zIndex: 50,
    opacity: isDragging ? 0.4 : 1,
  } : {};

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={`group flex items-start justify-between p-2.5 bg-blue-50 dark:bg-blue-900/20 rounded-xl border border-blue-100 dark:border-blue-800 transition-all ${
        isDragging ? 'opacity-40' : 'hover:shadow-soft hover:-translate-y-0.5'
      }`}
    >
      <div className="flex items-start gap-2 flex-1 min-w-0">
        <button
          {...listeners}
          {...attributes}
          className="mt-0.5 text-gray-300 hover:text-gray-500 cursor-grab active:cursor-grabbing shrink-0"
        >
          <GripVertical size={14} />
        </button>
        <div className="min-w-0">
          <p className="text-xs font-bold text-gray-800 dark:text-gray-200 truncate">{horario.materia?.nombre}</p>
          <p className="text-xs text-gray-500 flex items-center gap-1 mt-0.5">
            <Clock size={10} /> {horario.horaInicio} – {horario.horaFin}
          </p>
          <p className="text-xs text-gray-400 truncate">{horario.materia?.instructor?.fullName}</p>
        </div>
      </div>
      <button
        onClick={() => onDelete(horario.id)}
        className="btn-icon w-6 h-6 text-red-400 hover:bg-red-100 dark:hover:bg-red-900/30 opacity-0 group-hover:opacity-100 transition-opacity shrink-0"
      >
        <Trash2 size={12} />
      </button>
    </div>
  );
}

// ─── Columna droppable ────────────────────────────────────────────────────────
function DiaColumna({ dia, clases, onDelete, activeId }) {
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
          {clases.map(c => (
            <HorarioBloque
              key={c.id}
              horario={c}
              onDelete={onDelete}
              isDragging={activeId === c.id}
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
  const [fichas, setFichas] = useState([]);
  const [selectedFicha, setSelectedFicha] = useState('');
  const [horarios, setHorarios] = useState([]);
  const [materias, setMaterias] = useState([]);
  const [loading, setLoading] = useState(false);
  const [modal, setModal] = useState(false);
  const [form, setForm] = useState({ dia: 'Lunes', horaInicio: '08:00', horaFin: '10:00', materiaId: '' });
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [activeId, setActiveId] = useState(null);

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 8 } })
  );

  useEffect(() => {
    fetchApi('/fichas/my-fichas').then(d => {
      setFichas(d.fichas);
      if (d.fichas.length > 0) setSelectedFicha(d.fichas[0].id);
    }).catch(console.error);
  }, []);

  useEffect(() => {
    if (!selectedFicha) return;
    setLoading(true);
    Promise.all([
      fetchApi(`/horarios/ficha/${selectedFicha}`),
      fetchApi(`/materias/ficha/${selectedFicha}`)
    ]).then(([h, m]) => {
      setHorarios(h.horarios);
      setMaterias(m.materias);
      if (m.materias.length > 0) setForm(prev => ({ ...prev, materiaId: m.materias[0].id }));
    }).catch(console.error).finally(() => setLoading(false));
  }, [selectedFicha]);

  const reloadHorarios = async () => {
    const h = await fetchApi(`/horarios/ficha/${selectedFicha}`);
    setHorarios(h.horarios);
  };

  const handleCreate = async (e) => {
    e.preventDefault();
    setError(''); setSaving(true);
    try {
      await fetchApi('/horarios', { method: 'POST', body: JSON.stringify({ ...form, fichaId: selectedFicha }) });
      setModal(false);
      showToast('Clase agregada al horario', 'success');
      reloadHorarios();
    } catch (err) { setError(err.message); }
    finally { setSaving(false); }
  };

  const handleDelete = async (id) => {
    try {
      await fetchApi(`/horarios/${id}`, { method: 'DELETE' });
      setHorarios(prev => prev.filter(h => h.id !== id));
      showToast('Clase eliminada', 'success');
    } catch (err) { showToast(err.message, 'error'); }
  };

  // ─── Drag & Drop handlers ──────────────────────────────────────────────────
  const handleDragStart = ({ active }) => setActiveId(active.id);

  const handleDragEnd = async ({ active, over }) => {
    setActiveId(null);
    if (!over || active.id === over.id) return;

    const horario = horarios.find(h => h.id === active.id);
    const newDia = over.id; // over.id es el nombre del día (droppable)

    if (!horario || !DIAS.includes(newDia) || horario.dia === newDia) return;

    // Optimistic update
    setHorarios(prev => prev.map(h => h.id === active.id ? { ...h, dia: newDia } : h));

    try {
      // Llamamos al endpoint de actualización de horario
      await fetchApi(`/horarios/${active.id}`, {
        method: 'PUT',
        body: JSON.stringify({ dia: newDia })
      });
      showToast(`Clase movida a ${newDia}`, 'success');
    } catch (err) {
      // Revertir si falla
      showToast('Error al mover la clase', 'error');
      reloadHorarios();
    }
  };

  const activeHorario = horarios.find(h => h.id === activeId);

  const byDia = DIAS.map(dia => ({
    dia,
    clases: horarios.filter(h => h.dia === dia).sort((a, b) => a.horaInicio.localeCompare(b.horaInicio))
  }));

  return (
    <div className="animate-fade-in">
      <PageHeader
        title="Horario Semanal"
        subtitle="Arrastra las clases entre días para reorganizar"
        action={
          selectedFicha && materias.length > 0 && (
            <button onClick={() => { setModal(true); setError(''); }} className="btn-primary flex items-center gap-2">
              <Plus size={16} /> Agregar Clase
            </button>
          )
        }
      />

      {fichas.length > 1 && (
        <div className="mb-5">
          <label className="input-label">Ficha</label>
          <select className="input-field max-w-xs dark:bg-gray-800 dark:border-gray-700 dark:text-white"
            value={selectedFicha} onChange={e => setSelectedFicha(e.target.value)}>
            {fichas.map(f => <option key={f.id} value={f.id}>Ficha {f.numero} – {f.nivel}</option>)}
          </select>
        </div>
      )}

      {fichas.length === 0 ? (
        <div className="card"><EmptyState icon={<Calendar size={32}/>} title="No tienes fichas" description="Crea una ficha primero." /></div>
      ) : loading ? (
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-4">
          {DIAS.map(d => (
            <div key={d} className="card animate-pulse">
              <div className="h-4 bg-gray-100 rounded w-2/3 mb-3"/>
              <div className="h-16 bg-gray-100 rounded-xl"/>
            </div>
          ))}
        </div>
      ) : (
        <DndContext
          sensors={sensors}
          collisionDetection={closestCenter}
          onDragStart={handleDragStart}
          onDragEnd={handleDragEnd}
        >
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-4">
            {byDia.map(({ dia, clases }) => (
              <DiaColumna key={dia} dia={dia} clases={clases} onDelete={handleDelete} activeId={activeId} />
            ))}
          </div>

          <DragOverlay>
            {activeHorario && (
              <div className="p-2.5 bg-white rounded-xl shadow-card border border-blue-200 opacity-95 rotate-2">
                <p className="text-xs font-bold text-gray-800">{activeHorario.materia?.nombre}</p>
                <p className="text-xs text-gray-500">{activeHorario.horaInicio} – {activeHorario.horaFin}</p>
              </div>
            )}
          </DragOverlay>
        </DndContext>
      )}

      <Modal open={modal} onClose={() => setModal(false)} title="Agregar Clase al Horario">
        <form onSubmit={handleCreate} className="space-y-4">
          {error && <p className="text-sm text-red-500 bg-red-50 px-3 py-2 rounded-lg">{error}</p>}
          <div>
            <label className="input-label">Materia</label>
            <select required className="input-field" value={form.materiaId}
              onChange={e => setForm(p => ({ ...p, materiaId: e.target.value }))}>
              {materias.map(m => <option key={m.id} value={m.id}>{m.nombre}</option>)}
            </select>
          </div>
          <div>
            <label className="input-label">Día</label>
            <select className="input-field" value={form.dia}
              onChange={e => setForm(p => ({ ...p, dia: e.target.value }))}>
              {DIAS.map(d => <option key={d}>{d}</option>)}
            </select>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="input-label">Hora Inicio</label>
              <input type="time" required className="input-field" value={form.horaInicio}
                onChange={e => setForm(p => ({ ...p, horaInicio: e.target.value }))} />
            </div>
            <div>
              <label className="input-label">Hora Fin</label>
              <input type="time" required className="input-field" value={form.horaFin}
                onChange={e => setForm(p => ({ ...p, horaFin: e.target.value }))} />
            </div>
          </div>
          <div className="flex gap-3 pt-2">
            <button type="button" onClick={() => setModal(false)} className="btn-secondary flex-1">Cancelar</button>
            <button type="submit" disabled={saving} className="btn-primary flex-1">{saving ? 'Guardando...' : 'Agregar'}</button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
