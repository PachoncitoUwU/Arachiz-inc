import React, { useState, useEffect, useContext } from 'react';
import { AuthContext } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import { Ticket, Plus, UserPlus, Calendar, Clock, ChevronRight, Download, Users, Search } from 'lucide-react';
import Modal from '../components/Modal';
import fetchApi from '../services/api';
import EventoDetalle from './EventoDetalle';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000/api';

export default function EventosManager() {
  const { user, token } = useContext(AuthContext);
  const { showToast } = useToast();

  const [eventos, setEventos] = useState([]);
  const [fichasPropias, setFichasPropias] = useState([]);
  const [loading, setLoading] = useState(true);

  // Modales
  const [showCrearModal, setShowCrearModal] = useState(false);
  const [showUnirModal, setShowUnirModal] = useState(false);
  const [eventoSeleccionado, setEventoSeleccionado] = useState(null);

  // Form states
  const [nombre, setNombre] = useState('');
  const [descripcion, setDescripcion] = useState('');
  const [fechaHora, setFechaHora] = useState('');
  const [fichasIds, setFichasIds] = useState([]);

  const [codigoInvitacion, setCodigoInvitacion] = useState('');
  const [fichasAUnir, setFichasAUnir] = useState([]);
  
  // Estados para búsqueda y filtro
  const [searchTerm, setSearchTerm] = useState('');
  const [nivelFilter, setNivelFilter] = useState('');

  const fichasFiltradas = fichasPropias.filter(f => {
    const searchMatch = (f.numero + ' ' + f.nombre).toLowerCase().includes(searchTerm.toLowerCase());
    const nivelMatch = nivelFilter ? f.nivel?.toLowerCase().includes(nivelFilter.toLowerCase()) : true;
    return searchMatch && nivelMatch;
  });

  const toggleFichaSelection = (id, selectedIds, setSelectedIds) => {
    if (selectedIds.includes(id)) {
      setSelectedIds(selectedIds.filter(fId => fId !== id));
    } else {
      setSelectedIds([...selectedIds, id]);
    }
  };

  useEffect(() => {
    loadEventos();
    loadFichasPropias();
  }, []);

  const loadEventos = async () => {
    try {
      setLoading(true);
      const res = await fetchApi(`/eventos?role=${user.userType}`);
      setEventos(res.eventos || []);
    } catch (err) {
      showToast('Error al cargar eventos', 'error');
    } finally {
      setLoading(false);
    }
  };

  const loadFichasPropias = async () => {
    try {
      const endpoint = user.userType === 'admin' ? '/admin/fichas' : '/fichas/my-fichas';
      const res = await fetchApi(endpoint);
      setFichasPropias(res.fichas || res || []);
    } catch (err) {
      console.error('Error al cargar fichas propias', err);
    }
  };

  const handleCrearEvento = async (e) => {
    e.preventDefault();
    if (!nombre || !fechaHora) {
      showToast('Nombre y Fecha son obligatorios', 'error');
      return;
    }
    try {
      await fetchApi('/eventos', {
        method: 'POST',
        body: JSON.stringify({
          nombre,
          descripcion,
          fechaHora,
          fichasIds
        })
      });
      showToast('Evento creado exitosamente', 'success');
      setShowCrearModal(false);
      resetForms();
      loadEventos();
    } catch (err) {
      showToast(err.message || 'Error al crear evento', 'error');
    }
  };

  const handleUnirFicha = async (e) => {
    e.preventDefault();
    if (!codigoInvitacion || fichasAUnir.length === 0) {
      showToast('Ingresa el código y selecciona al menos una ficha', 'error');
      return;
    }
    try {
      await fetchApi('/eventos/unir', {
        method: 'POST',
        body: JSON.stringify({
          codigoInvitacion,
          fichasIds: fichasAUnir
        })
      });
      showToast('Fichas unidas al evento', 'success');
      setShowUnirModal(false);
      resetForms();
      loadEventos();
    } catch (err) {
      showToast(err.message || 'Error al unir fichas', 'error');
    }
  };

  const resetForms = () => {
    setNombre(''); setDescripcion(''); setFechaHora(''); setFichasIds([]);
    setCodigoInvitacion('');
    setFichasAUnir([]);
    setSearchTerm('');
    setNivelFilter('');
  };

  const handleDescargarReporte = async (e, id, codigo) => {
    e.stopPropagation();
    try {
      const response = await fetch(`${API_URL}/eventos/${id}/reporte`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (!response.ok) throw new Error('Error al generar reporte');
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `Reporte_Evento_${codigo}.xlsx`);
      document.body.appendChild(link);
      link.click();
      link.remove();
    } catch (err) {
      showToast('Error al descargar reporte', 'error');
    }
  };

  if (eventoSeleccionado) {
    return (
      <EventoDetalle 
        eventoId={eventoSeleccionado} 
        onBack={() => {
          setEventoSeleccionado(null);
          loadEventos();
        }} 
      />
    );
  }

  return (
    <div className="p-4 md:p-8 max-w-7xl mx-auto animate-fade-in space-y-6">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white flex items-center gap-2">
            <Ticket className="text-blue-500" />
            Gestión de Eventos
          </h1>
          <p className="text-gray-500 dark:text-gray-400">
            Crea eventos especiales e invita a múltiples fichas
          </p>
        </div>
        <div className="flex gap-2 w-full md:w-auto">
          <button onClick={() => setShowUnirModal(true)} className="btn-secondary flex-1 md:flex-none flex items-center justify-center gap-2">
            <UserPlus size={18} /> <span className="hidden sm:inline">Unir Ficha</span>
          </button>
          <button onClick={() => setShowCrearModal(true)} className="btn-primary flex-1 md:flex-none flex items-center justify-center gap-2">
            <Plus size={18} /> <span className="hidden sm:inline">Nuevo Evento</span>
          </button>
        </div>
      </div>

      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {[1,2,3].map(i => <div key={i} className="h-40 bg-gray-200 dark:bg-gray-800 rounded-xl animate-pulse"/>)}
        </div>
      ) : eventos.length === 0 ? (
        <div className="card text-center py-12">
          <Ticket size={48} className="mx-auto text-gray-300 dark:text-gray-600 mb-4" />
          <h3 className="text-lg font-medium text-gray-900 dark:text-white">No hay eventos activos</h3>
          <p className="text-gray-500 dark:text-gray-400">Crea un nuevo evento o únete a uno mediante un código.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {eventos.map(ev => (
            <div 
              key={ev.id} 
              onClick={() => setEventoSeleccionado(ev.id)}
              className="card hover:border-blue-500 dark:hover:border-blue-500 cursor-pointer transition-all flex flex-col group"
            >
              <div className="flex justify-between items-start mb-4">
                <div className="flex flex-col gap-1 max-w-[70%]">
                  <h3 className="text-lg font-bold text-gray-900 dark:text-white truncate" title={ev.nombre}>
                    {ev.nombre}
                  </h3>
                  <span className={`w-max px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider ${
                    ev.estado === 'programado' ? 'bg-blue-100 text-blue-700 dark:bg-blue-900/50 dark:text-blue-300' :
                    ev.estado === 'en_curso' ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/50 dark:text-emerald-300' :
                    'bg-gray-200 text-gray-600 dark:bg-gray-800 dark:text-gray-400'
                  }`}>
                    {ev.estado === 'programado' ? 'Programado' : ev.estado === 'en_curso' ? 'En Curso' : 'Finalizado'}
                  </span>
                </div>
                <span className="bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 text-xs px-2 py-1 rounded-full font-medium shrink-0">
                  Código: {ev.codigoInvitacion}
                </span>
              </div>
              
              <div className="space-y-2 text-sm text-gray-600 dark:text-gray-300 flex-1">
                <div className="flex items-center gap-2">
                  <Calendar size={14} className="text-gray-400" />
                  {new Date(ev.fechaHora).toLocaleDateString()}
                </div>
                <div className="flex items-center gap-2">
                  <Clock size={14} className="text-gray-400" />
                  {new Date(ev.fechaHora).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}
                </div>
                <div className="flex items-center gap-2">
                  <Users size={14} className="text-gray-400" />
                  {ev.fichas.length} Fichas participando
                </div>
              </div>

              <div className="mt-4 pt-4 border-t border-gray-100 dark:border-gray-800 flex justify-between items-center">
                <button 
                  onClick={(e) => handleDescargarReporte(e, ev.id, ev.codigoInvitacion)}
                  className="p-2 text-gray-400 hover:text-blue-500 hover:bg-blue-50 dark:hover:bg-blue-900/20 rounded-lg transition-colors"
                  title="Descargar Reporte"
                >
                  <Download size={18} />
                </button>
                <div className="flex items-center gap-1 text-sm font-medium text-blue-500 group-hover:translate-x-1 transition-transform">
                  Ver asistencia <ChevronRight size={16} />
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Modal Crear */}
      <Modal open={showCrearModal} onClose={() => setShowCrearModal(false)} title="Crear Nuevo Evento">
        <form onSubmit={handleCrearEvento} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Nombre del Evento *</label>
            <input type="text" value={nombre} onChange={e=>setNombre(e.target.value)} className="input-field" required />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Descripción</label>
            <textarea value={descripcion} onChange={e=>setDescripcion(e.target.value)} className="input-field" rows="2" />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Fecha y Hora *</label>
            <input type="datetime-local" value={fechaHora} onChange={e=>setFechaHora(e.target.value)} className="input-field" required />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Invitar Fichas (Opcional)</label>
            <div className="space-y-2">
              <div className="flex gap-2">
                <div className="relative flex-1">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={16} />
                  <input type="text" placeholder="Buscar ficha..." value={searchTerm} onChange={e=>setSearchTerm(e.target.value)} className="input-field pl-9 py-2" />
                </div>
                <select value={nivelFilter} onChange={e=>setNivelFilter(e.target.value)} className="input-field py-2 w-32">
                  <option value="">Todos</option>
                  <option value="tecnologo">Tecnólogo</option>
                  <option value="tecnico">Técnico</option>
                </select>
              </div>
              <div className="max-h-48 overflow-y-auto border border-gray-200 dark:border-gray-700 rounded-lg p-2 space-y-1">
                {fichasFiltradas.length === 0 && <p className="text-sm text-gray-500 text-center py-2">No se encontraron fichas</p>}
                {fichasFiltradas.map(f => (
                  <label key={f.id} className="flex items-center gap-3 p-2 hover:bg-gray-50 dark:hover:bg-gray-800 rounded-lg cursor-pointer">
                    <input 
                      type="checkbox" 
                      checked={fichasIds.includes(f.id)}
                      onChange={() => toggleFichaSelection(f.id, fichasIds, setFichasIds)} 
                      className="rounded border-gray-300 text-blue-600 focus:ring-blue-500" 
                    />
                    <div>
                      <p className="text-sm font-medium text-gray-900 dark:text-white">Ficha {f.numero}</p>
                      <p className="text-xs text-gray-500">{f.nombre} • {f.nivel}</p>
                    </div>
                  </label>
                ))}
              </div>
            </div>
            <p className="text-xs text-gray-500 mt-1">{fichasIds.length} fichas seleccionadas.</p>
          </div>
          <div className="flex justify-end gap-2 mt-6">
            <button type="button" onClick={() => setShowCrearModal(false)} className="btn-secondary">Cancelar</button>
            <button type="submit" className="btn-primary">Crear Evento</button>
          </div>
        </form>
      </Modal>

      {/* Modal Unir */}
      <Modal open={showUnirModal} onClose={() => setShowUnirModal(false)} title="Unir Fichas a un Evento">
        <form onSubmit={handleUnirFicha} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Código de Invitación *</label>
            <input type="text" value={codigoInvitacion} onChange={e=>setCodigoInvitacion(e.target.value.toUpperCase())} className="input-field uppercase" placeholder="Ej. A1B2C3" required />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Mis Fichas a unir *</label>
            <div className="space-y-2">
              <div className="flex gap-2">
                <div className="relative flex-1">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={16} />
                  <input type="text" placeholder="Buscar ficha..." value={searchTerm} onChange={e=>setSearchTerm(e.target.value)} className="input-field pl-9 py-2" />
                </div>
                <select value={nivelFilter} onChange={e=>setNivelFilter(e.target.value)} className="input-field py-2 w-32">
                  <option value="">Todos</option>
                  <option value="tecnologo">Tecnólogo</option>
                  <option value="tecnico">Técnico</option>
                </select>
              </div>
              <div className="max-h-48 overflow-y-auto border border-gray-200 dark:border-gray-700 rounded-lg p-2 space-y-1">
                {fichasFiltradas.length === 0 && <p className="text-sm text-gray-500 text-center py-2">No se encontraron fichas</p>}
                {fichasFiltradas.map(f => (
                  <label key={f.id} className="flex items-center gap-3 p-2 hover:bg-gray-50 dark:hover:bg-gray-800 rounded-lg cursor-pointer">
                    <input 
                      type="checkbox" 
                      checked={fichasAUnir.includes(f.id)}
                      onChange={() => toggleFichaSelection(f.id, fichasAUnir, setFichasAUnir)} 
                      className="rounded border-gray-300 text-blue-600 focus:ring-blue-500" 
                    />
                    <div>
                      <p className="text-sm font-medium text-gray-900 dark:text-white">Ficha {f.numero}</p>
                      <p className="text-xs text-gray-500">{f.nombre} • {f.nivel}</p>
                    </div>
                  </label>
                ))}
              </div>
            </div>
            <p className="text-xs text-gray-500 mt-1">{fichasAUnir.length} fichas seleccionadas.</p>
          </div>
          <div className="flex justify-end gap-2 mt-6">
            <button type="button" onClick={() => setShowUnirModal(false)} className="btn-secondary">Cancelar</button>
            <button type="submit" className="btn-primary">Unir al Evento</button>
          </div>
        </form>
      </Modal>

    </div>
  );
}
