import React, { useState, useEffect } from 'react';
import fetchApi from '../../services/api';
import PageHeader from '../../components/PageHeader';
import Modal from '../../components/Modal';
import EmptyState from '../../components/EmptyState';
import { Calendar, Plus, Trash2, Clock } from 'lucide-react';

const DIAS = ['Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado'];

export default function InstructorHorario() {
  const [fichas, setFichas] = useState([]);
  const [selectedFicha, setSelectedFicha] = useState('');
  const [horarios, setHorarios] = useState([]);
  const [materias, setMaterias] = useState([]);
  const [loading, setLoading] = useState(false);
  const [modal, setModal] = useState(false);
  const [form, setForm] = useState({ dia: 'Lunes', horaInicio: '08:00', horaFin: '10:00', materiaId: '' });
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

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

  const handleCreate = async (e) => {
    e.preventDefault();
    setError(''); setSaving(true);
    try {
      await fetchApi('/horarios', { method: 'POST', body: JSON.stringify({ ...form, fichaId: selectedFicha }) });
      setModal(false);
      const h = await fetchApi(`/horarios/ficha/${selectedFicha}`);
      setHorarios(h.horarios);
    } catch (err) { setError(err.message); }
    finally { setSaving(false); }
  };

  const handleDelete = async (id) => {
    if (!confirm('¿Eliminar esta clase del horario?')) return;
    try {
      await fetchApi(`/horarios/${id}`, { method: 'DELETE' });
      setHorarios(prev => prev.filter(h => h.id !== id));
    } catch (err) { alert(err.message); }
  };

  const byDia = DIAS.map(dia => ({
    dia,
    clases: horarios.filter(h => h.dia === dia).sort((a, b) => a.horaInicio.localeCompare(b.horaInicio))
  }));

  const fichaActual = fichas.find(f => f.id === selectedFicha);

  return (
    <div className="animate-fade-in">
      <PageHeader
        title="Horario Semanal"
        subtitle="Organiza las clases por día y hora"
        action={
          selectedFicha && materias.length > 0 && (
            <button onClick={() => { setModal(true); setError(''); }} className="btn-primary flex items-center gap-2">
              <Plus size={16}/> Agregar Clase
            </button>
          )
        }
      />

      {/* Selector de ficha */}
      {fichas.length > 1 && (
        <div className="mb-5">
          <label className="input-label">Ficha</label>
          <select className="input-field max-w-xs" value={selectedFicha} onChange={e => setSelectedFicha(e.target.value)}>
            {fichas.map(f => <option key={f.id} value={f.id}>Ficha {f.numero} – {f.nivel}</option>)}
          </select>
        </div>
      )}

      {fichas.length === 0 ? (
        <div className="card">
          <EmptyState icon={<Calendar size={32}/>} title="No tienes fichas" description="Crea una ficha primero para gestionar horarios." />
        </div>
      ) : loading ? (
        <div className="flex justify-center py-16">
          <div className="w-8 h-8 border-2 border-[#4285F4] border-t-transparent rounded-full animate-spin"/>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {byDia.map(({ dia, clases }) => (
            <div key={dia} className="card">
              <div className="flex items-center gap-2 mb-3 pb-2 border-b border-gray-100">
                <div className="w-7 h-7 bg-blue-50 rounded-lg flex items-center justify-center">
                  <Calendar size={14} className="text-[#4285F4]"/>
                </div>
                <span className="font-bold text-sm text-gray-800">{dia}</span>
                <span className="ml-auto badge badge-gray">{clases.length}</span>
              </div>
              {clases.length === 0 ? (
                <p className="text-xs text-gray-400 text-center py-4">Sin clases</p>
              ) : (
                <div className="space-y-2">
                  {clases.map(c => (
                    <div key={c.id} className="flex items-start justify-between p-2.5 bg-blue-50 rounded-xl">
                      <div>
                        <p className="text-xs font-semibold text-gray-800">{c.materia?.nombre}</p>
                        <p className="text-xs text-gray-500 flex items-center gap-1 mt-0.5">
                          <Clock size={11}/> {c.horaInicio} – {c.horaFin}
                        </p>
                        <p className="text-xs text-gray-400">{c.materia?.instructor?.fullName}</p>
                      </div>
                      <button onClick={() => handleDelete(c.id)}
                        className="btn-icon w-6 h-6 text-red-400 hover:bg-red-100 shrink-0">
                        <Trash2 size={12}/>
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      <Modal open={modal} onClose={() => setModal(false)} title="Agregar Clase al Horario">
        <form onSubmit={handleCreate} className="space-y-4">
          {error && <p className="text-sm text-red-500 bg-red-50 px-3 py-2 rounded-lg">{error}</p>}
          <div>
            <label className="input-label">Materia</label>
            <select required className="input-field" value={form.materiaId}
              onChange={e => setForm({...form, materiaId: e.target.value})}>
              {materias.map(m => <option key={m.id} value={m.id}>{m.nombre}</option>)}
            </select>
          </div>
          <div>
            <label className="input-label">Día</label>
            <select className="input-field" value={form.dia} onChange={e => setForm({...form, dia: e.target.value})}>
              {DIAS.map(d => <option key={d}>{d}</option>)}
            </select>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="input-label">Hora Inicio</label>
              <input type="time" required className="input-field" value={form.horaInicio}
                onChange={e => setForm({...form, horaInicio: e.target.value})} />
            </div>
            <div>
              <label className="input-label">Hora Fin</label>
              <input type="time" required className="input-field" value={form.horaFin}
                onChange={e => setForm({...form, horaFin: e.target.value})} />
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
