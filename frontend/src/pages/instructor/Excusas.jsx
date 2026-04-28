import React, { useState, useEffect } from 'react';
import fetchApi from '../../services/api';
import PageHeader from '../../components/PageHeader';
import EmptyState from '../../components/EmptyState';
import Modal from '../../components/Modal';
import ConfirmDialog from '../../components/ConfirmDialog';
import { useToast } from '../../context/ToastContext';
import { FileText, Check, X, Clock, CheckCircle, XCircle, Paperclip, Edit2, Calendar, Settings, Plus, Trash2, GripVertical } from 'lucide-react';

const DEFAULT_RESPUESTAS_RAPIDAS = [
  'Excusa aprobada. Por favor, ponte al día con las actividades pendientes.',
  'Excusa aprobada. Recuerda solicitar las guías a tus compañeros.',
  'Excusa rechazada. El motivo no constituye una justificación válida.',
  'Excusa rechazada. Se requiere documentación de respaldo.',
  'Excusa aprobada. Lamento lo sucedido. Ponte al día con las clases.',
];

const STATUS_MAP = {
  Pendiente: { badge: 'badge-pending', icon: Clock },
  Aprobada: { badge: 'badge-success', icon: CheckCircle },
  Rechazada: { badge: 'badge-danger', icon: XCircle },
};

export default function InstructorExcusas() {
  const { showToast } = useToast();
  const [excusas, setExcusas] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selected, setSelected] = useState(null);
  const [respuesta, setRespuesta] = useState('');
  const [saving, setSaving] = useState(false);
  const [confirmAction, setConfirmAction] = useState(null);
  const [editMode, setEditMode] = useState(false);
  const [editEstado, setEditEstado] = useState('');
  
  // Respuestas rápidas personalizadas
  const [respuestasRapidas, setRespuestasRapidas] = useState([]);
  const [respuestasOriginales, setRespuestasOriginales] = useState([]); // Para comparar cambios
  const [modalRespuestas, setModalRespuestas] = useState(false);
  const [editandoRespuesta, setEditandoRespuesta] = useState(null);
  const [nuevaRespuesta, setNuevaRespuesta] = useState('');
  const [draggedIndex, setDraggedIndex] = useState(null);
  const [confirmRestaurar, setConfirmRestaurar] = useState(false);
  const [guardandoRespuestas, setGuardandoRespuestas] = useState(false);
  const [confirmSalir, setConfirmSalir] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(false);
  
  // Filtros
  const [filtroEstado, setFiltroEstado] = useState('Todas');
  const [filtroNombre, setFiltroNombre] = useState('');
  const [filtroMateria, setFiltroMateria] = useState('Todas');
  const [filtroFechaDesde, setFiltroFechaDesde] = useState('');
  const [filtroFechaHasta, setFiltroFechaHasta] = useState('');

  // Helper para parsear JSON de forma segura
  const safeJSONParse = (str, fallback = []) => {
    try {
      return JSON.parse(str);
    } catch {
      return fallback;
    }
  };

  // Helper para truncar texto largo
  const truncarTexto = (texto, maxLength = 80) => {
    if (texto.length <= maxLength) return texto;
    return texto.substring(0, maxLength) + '...';
  };

  // Cargar respuestas rápidas desde la API
  useEffect(() => {
    loadRespuestasRapidas();
  }, []);

  const loadRespuestasRapidas = async () => {
    try {
      const data = await fetchApi('/respuestas-rapidas');
      if (data.respuestas && data.respuestas.length > 0) {
        const textos = data.respuestas.map(r => r.texto);
        setRespuestasRapidas(textos);
        setRespuestasOriginales(textos); // Guardar copia original
      } else {
        // Si no tiene respuestas, crear las por defecto
        await restaurarDefecto();
      }
    } catch (err) {
      console.error('Error al cargar respuestas rápidas:', err);
      // Si hay error, usar las por defecto localmente
      setRespuestasRapidas(DEFAULT_RESPUESTAS_RAPIDAS);
      setRespuestasOriginales(DEFAULT_RESPUESTAS_RAPIDAS);
    }
  };

  const agregarRespuesta = () => {
    if (!nuevaRespuesta.trim()) {
      showToast('Escribe un mensaje antes de agregar', 'warning');
      return;
    }
    
    setRespuestasRapidas([...respuestasRapidas, nuevaRespuesta.trim()]);
    setNuevaRespuesta('');
  };

  const eliminarRespuesta = (index) => {
    const nuevas = respuestasRapidas.filter((_, i) => i !== index);
    setRespuestasRapidas(nuevas);
    if (editandoRespuesta === index) {
      setEditandoRespuesta(null);
    }
  };

  const actualizarRespuesta = (index, texto) => {
    const nuevas = [...respuestasRapidas];
    nuevas[index] = texto;
    setRespuestasRapidas(nuevas);
    setEditandoRespuesta(null);
  };

  const moverRespuesta = (fromIndex, toIndex) => {
    const nuevas = [...respuestasRapidas];
    const [removed] = nuevas.splice(fromIndex, 1);
    nuevas.splice(toIndex, 0, removed);
    setRespuestasRapidas(nuevas);
  };

  const handleDragStart = (index) => {
    setDraggedIndex(index);
  };

  const handleDragOver = (e, index) => {
    e.preventDefault();
    if (draggedIndex === null || draggedIndex === index) return;
    moverRespuesta(draggedIndex, index);
    setDraggedIndex(index);
  };

  const handleDragEnd = () => {
    setDraggedIndex(null);
  };

  const restaurarDefecto = async () => {
    try {
      await fetchApi('/respuestas-rapidas/restaurar', {
        method: 'POST'
      });
      setConfirmRestaurar(false);
      await loadRespuestasRapidas();
      showToast('Respuestas rápidas restauradas', 'success');
    } catch (err) {
      showToast('Error al restaurar respuestas: ' + err.message, 'error');
    }
  };

  const guardarCambiosRespuestas = async () => {
    setGuardandoRespuestas(true);
    try {
      // Obtener respuestas actuales de la API para tener los IDs
      const data = await fetchApi('/respuestas-rapidas');
      const respuestasDB = data.respuestas;
      
      // Estrategia simple: eliminar todas y recrear
      // Esto evita problemas de sincronización y es más confiable
      
      // 1. Eliminar todas las respuestas existentes
      for (const respuesta of respuestasDB) {
        await fetchApi(`/respuestas-rapidas/${respuesta.id}`, { method: 'DELETE' });
      }
      
      // 2. Crear todas las respuestas actuales con el orden correcto
      for (let i = 0; i < respuestasRapidas.length; i++) {
        await fetchApi('/respuestas-rapidas', {
          method: 'POST',
          body: JSON.stringify({ texto: respuestasRapidas[i] })
        });
      }
      
      await loadRespuestasRapidas();
      setModalRespuestas(false);
      setEditandoRespuesta(null);
      showToast('Cambios guardados correctamente', 'success');
    } catch (err) {
      showToast('Error al guardar cambios: ' + err.message, 'error');
    } finally {
      setGuardandoRespuestas(false);
    }
  };

  const cancelarCambiosRespuestas = () => {
    setRespuestasRapidas([...respuestasOriginales]);
    setModalRespuestas(false);
    setEditandoRespuesta(null);
    setNuevaRespuesta('');
    setConfirmSalir(false);
  };

  const intentarCerrarModal = () => {
    if (hayCambiosPendientes()) {
      setConfirmSalir(true);
    } else {
      cancelarCambiosRespuestas();
    }
  };

  const confirmarSalirSinGuardar = () => {
    setConfirmSalir(false);
    cancelarCambiosRespuestas();
  };

  const hayCambiosPendientes = () => {
    if (respuestasRapidas.length !== respuestasOriginales.length) return true;
    return respuestasRapidas.some((r, i) => r !== respuestasOriginales[i]);
  };

  useEffect(() => {
    loadExcusas();
  }, [filtroEstado, filtroNombre, filtroMateria, filtroFechaDesde, filtroFechaHasta]);

  const loadExcusas = async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams();
      if (filtroEstado !== 'Todas') params.append('estado', filtroEstado);
      
      const d = await fetchApi(`/excusas?${params.toString()}`);
      setExcusas(d.excusas);
    } catch (err) {
      console.error(err);
      showToast(err.message, 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleUpdate = async (id, estado) => {
    setSaving(true);
    try {
      await fetchApi(`/excusas/${id}/estado`, {
        method: 'PUT',
        body: JSON.stringify({ estado, respuesta: respuesta || '' })
      });
      setSelected(null);
      setRespuesta('');
      setEditMode(false);
      setEditEstado('');
      showToast(`Excusa ${estado.toLowerCase()} correctamente`, estado === 'Aprobada' ? 'success' : 'warning');
      loadExcusas();
    } catch (err) {
      showToast(err.message, 'error');
    } finally {
      setSaving(false);
    }
  };

  const openConfirmAction = (estado) => {
    setConfirmAction({ estado, id: selected.id });
  };

  const confirmUpdate = () => {
    if (confirmAction) {
      handleUpdate(confirmAction.id, confirmAction.estado);
      setConfirmAction(null);
    }
  };

  const openEditMode = () => {
    setEditMode(true);
    setEditEstado(selected.estado);
    setRespuesta(selected.respuesta || '');
  };

  const handleDeleteExcusa = async () => {
    try {
      setSaving(true);
      await fetchApi(`/excusas/${selected.id}`, { method: 'DELETE' });
      showToast('Excusa enviada a la papelera', 'success');
      setSelected(null);
      setConfirmDelete(false);
      loadExcusas();
    } catch (err) {
      showToast(err.message || 'Error al eliminar excusa', 'error');
    } finally {
      setSaving(false);
    }
  };

  const limpiarFiltros = () => {
    setFiltroEstado('Todas');
    setFiltroNombre('');
    setFiltroMateria('Todas');
    setFiltroFechaDesde('');
    setFiltroFechaHasta('');
  };

  // Obtener lista única de materias
  const materiasUnicas = [...new Set(excusas.map(e => e.materia.nombre))];

  // Filtrar excusas localmente
  const excusasFiltradas = excusas.filter(excusa => {
    if (filtroNombre && !excusa.aprendiz.fullName.toLowerCase().includes(filtroNombre.toLowerCase())) return false;
    if (filtroMateria !== 'Todas' && excusa.materia.nombre !== filtroMateria) return false;
    if (filtroFechaDesde) {
      const fechaExcusa = new Date(excusa.createdAt);
      const fechaDesde = new Date(filtroFechaDesde + 'T00:00:00');
      if (fechaExcusa < fechaDesde) return false;
    }
    if (filtroFechaHasta) {
      const fechaExcusa = new Date(excusa.createdAt);
      const fechaHasta = new Date(filtroFechaHasta + 'T23:59:59');
      if (fechaExcusa > fechaHasta) return false;
    }
    return true;
  });

  const counts = {
    Todas: excusasFiltradas.length,
    Pendiente: excusasFiltradas.filter(e => e.estado === 'Pendiente').length,
    Aprobada: excusasFiltradas.filter(e => e.estado === 'Aprobada').length,
    Rechazada: excusasFiltradas.filter(e => e.estado === 'Rechazada').length,
  };

  return (
    <div className="animate-fade-in space-y-5">
      <PageHeader title="Evaluación de Excusas" subtitle="Revisa y responde las excusas de tus aprendices" />

      {/* Filtros de estado */}
      <div className="flex gap-2 flex-wrap items-center">
        {Object.entries(counts).map(([key, count]) => (
          <button key={key} onClick={() => setFiltroEstado(key)}
            className={`px-4 py-2 rounded-xl text-sm font-medium transition-all ${
              filtroEstado === key
                ? 'bg-[#4285F4] text-white shadow-sm'
                : 'bg-white border border-gray-200 text-gray-600 hover:bg-gray-50'
            }`}>
            {key} <span className="ml-1 opacity-70">({count})</span>
          </button>
        ))}
      </div>

      {/* Filtros adicionales */}
      <div className="card">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
          <div>
            <label className="input-label">Buscar por nombre</label>
            <input type="text" className="input-field" placeholder="Nombre del aprendiz..."
              value={filtroNombre} onChange={e => setFiltroNombre(e.target.value)} />
          </div>
          <div>
            <label className="input-label">Materia</label>
            <select className="input-field" value={filtroMateria} onChange={e => setFiltroMateria(e.target.value)}>
              <option value="Todas">Todas</option>
              {materiasUnicas.map((m, i) => (
                <option key={i} value={m}>{m}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="input-label">Enviada desde</label>
            <input type="date" className="input-field" value={filtroFechaDesde} 
              onChange={e => setFiltroFechaDesde(e.target.value)} />
          </div>
          <div>
            <label className="input-label">Enviada hasta</label>
            <input type="date" className="input-field" value={filtroFechaHasta} 
              onChange={e => setFiltroFechaHasta(e.target.value)} />
          </div>
        </div>
        <div className="mt-3">
          <button onClick={limpiarFiltros} className="btn-secondary">
            Limpiar Todos los Filtros
          </button>
        </div>
      </div>

      {/* Lista de excusas */}
      {loading ? (
        <div className="flex justify-center py-16">
          <div className="w-8 h-8 border-2 border-[#4285F4] border-t-transparent rounded-full animate-spin"/>
        </div>
      ) : excusasFiltradas.length === 0 ? (
        <div className="card">
          <EmptyState icon={<FileText size={32}/>} title="Sin excusas" 
            description="No hay excusas que coincidan con los filtros." />
        </div>
      ) : (
        <div className="space-y-3">
          {excusasFiltradas.map(excusa => {
            const { badge, icon: Icon } = STATUS_MAP[excusa.estado] || STATUS_MAP.Pendiente;
            const fechasArray = safeJSONParse(excusa.fechas, []);
            return (
              <div key={excusa.id} 
                onClick={() => { setSelected(excusa); setRespuesta(''); setEditMode(false); }}
                className="card hover:shadow-lg hover:scale-[1.01] transition-all cursor-pointer">
                <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1 flex-wrap">
                      <span className="font-bold text-gray-900">{excusa.aprendiz.fullName}</span>
                      <span className="text-gray-400 text-xs">{excusa.aprendiz.document}</span>
                      <span className={badge}><Icon size={12}/> {excusa.estado}</span>
                    </div>
                    <p className="text-sm font-medium text-gray-700">{excusa.materia.nombre}</p>
                    <p className="text-xs text-gray-500">Ficha {excusa.materia.ficha.numero}</p>
                    <p className="text-sm text-gray-500 mt-1">
                      Fechas: {fechasArray.map(f => new Date(f + 'T00:00:00').toLocaleDateString('es-CO')).join(', ')}
                    </p>
                    <p className="text-sm text-gray-600 mt-1 line-clamp-2">{excusa.motivo}</p>
                    <div className="flex items-center gap-3 mt-2 text-xs text-gray-400">
                      <span>Enviada: {excusa.createdAt ? new Date(excusa.createdAt).toLocaleDateString('es-CO') : 'N/A'}</span>
                    </div>
                    {excusa.respuesta && (
                      <div className="mt-2 p-2.5 bg-gray-50 rounded-lg border-l-2 border-[#4285F4]">
                        <p className="text-xs text-gray-500 font-medium mb-0.5">Respuesta del instructor:</p>
                        <p className="text-xs text-gray-700">{excusa.respuesta}</p>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Modal responder/ver detalle */}
      <Modal open={!!selected} onClose={() => { setSelected(null); setEditMode(false); }} 
        title={editMode ? "Editar Respuesta" : "Detalle de Excusa"} maxWidth="max-w-3xl">
        {selected && (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Columna izquierda: Detalles de la excusa */}
            <div className="lg:col-span-2 space-y-4">
              {/* Información del aprendiz */}
              <div className="p-4 bg-gradient-to-r from-blue-50 to-blue-100 rounded-xl border border-blue-200">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <p className="text-lg font-bold text-gray-900">{selected.aprendiz.fullName}</p>
                    <p className="text-sm text-gray-600 mt-0.5">Documento: {selected.aprendiz.document}</p>
                  </div>
                  {(() => { 
                    const { badge, icon: Icon } = STATUS_MAP[selected.estado]; 
                    return <span className={badge}><Icon size={12}/>{selected.estado}</span>; 
                  })()}
                </div>
              </div>

              {/* Información de la materia y ficha */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="p-3 bg-gray-50 rounded-lg">
                  <p className="text-xs text-gray-500 font-medium mb-1">Materia</p>
                  <p className="text-sm font-semibold text-gray-900">{selected.materia.nombre}</p>
                </div>
                <div className="p-3 bg-gray-50 rounded-lg">
                  <p className="text-xs text-gray-500 font-medium mb-1">Ficha</p>
                  <p className="text-sm font-semibold text-gray-900">
                    {selected.materia.ficha.numero} - {selected.materia.ficha.nombre}
                  </p>
                </div>
              </div>

              {/* Fechas de falta */}
              <div className="p-3 bg-gray-50 rounded-lg">
                <p className="text-xs text-gray-500 font-medium mb-2">Fechas de falta:</p>
                <div className="flex flex-wrap gap-1">
                  {safeJSONParse(selected.fechas, []).map((f, i) => (
                    <span key={i} className="badge badge-gray">
                      {new Date(f + 'T00:00:00').toLocaleDateString('es-CO')}
                    </span>
                  ))}
                </div>
              </div>

              {/* Motivo */}
              <div className="p-4 bg-white border-2 border-gray-200 rounded-lg">
                <p className="text-xs text-gray-500 font-medium mb-2">Motivo de la excusa:</p>
                <p className="text-sm text-gray-800 leading-relaxed">{selected.motivo}</p>
              </div>

              {/* Archivos adjuntos */}
              {selected.archivosUrls && safeJSONParse(selected.archivosUrls, []).length > 0 && (
                <div className="p-3 bg-gray-50 rounded-lg">
                  <p className="text-xs text-gray-500 font-medium mb-2">Archivos adjuntos:</p>
                  <div className="space-y-1">
                    {safeJSONParse(selected.archivosUrls, []).map((url, i) => (
                      <a key={i} href={url} target="_blank" rel="noreferrer"
                        className="flex items-center gap-2 text-sm text-[#4285F4] hover:underline">
                        <Paperclip size={14}/> Archivo {i + 1}
                      </a>
                    ))}
                  </div>
                </div>
              )}

              {/* Fecha de envío */}
              <div className="text-xs text-gray-400 space-y-0.5 p-2 bg-gray-50 rounded">
                <p>📅 Enviada: {selected.createdAt ? `${new Date(selected.createdAt).toLocaleDateString('es-CO')} a las ${new Date(selected.createdAt).toLocaleTimeString('es-CO', { hour: '2-digit', minute: '2-digit' })}` : 'N/A'}</p>
                {selected.respondedAt && <p>✅ Respondida: {new Date(selected.respondedAt).toLocaleDateString('es-CO')} a las {new Date(selected.respondedAt).toLocaleTimeString('es-CO', { hour: '2-digit', minute: '2-digit' })}</p>}
              </div>

              {/* Modo edición o respuesta existente */}
              {editMode ? (
                <>
                  <div>
                    <label className="input-label">Estado</label>
                    <select className="input-field" value={editEstado} onChange={e => setEditEstado(e.target.value)}>
                      <option value="Pendiente">Pendiente</option>
                      <option value="Aprobada">Aprobada</option>
                      <option value="Rechazada">Rechazada</option>
                    </select>
                  </div>

                  <div>
                    <div className="flex items-center justify-between mb-2">
                      <label className="input-label mb-0">Respuesta rápida (opcional)</label>
                      <button type="button" onClick={() => setModalRespuestas(true)}
                        className="text-xs text-[#4285F4] hover:underline flex items-center gap-1">
                        <Settings size={12}/> Editar respuestas
                      </button>
                    </div>
                    <select className="input-field" 
                      onChange={e => e.target.value && setRespuesta(e.target.value)}
                      value="">
                      <option value="">Selecciona una respuesta rápida...</option>
                      {respuestasRapidas.map((r, i) => (
                        <option key={i} value={r}>{truncarTexto(r)}</option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="input-label">Comentario personalizado (opcional)</label>
                    <textarea rows={3} className="input-field resize-none"
                      placeholder="Escribe un comentario para el aprendiz..."
                      value={respuesta} onChange={e => setRespuesta(e.target.value)} />
                  </div>

                  <div className="flex gap-3">
                    <button onClick={() => setEditMode(false)} className="btn-secondary flex-1">
                      Cancelar
                    </button>
                    <button onClick={() => openConfirmAction(editEstado)} disabled={saving}
                      className="btn-primary flex-1">
                      <Check size={16}/> Guardar Cambios
                    </button>
                  </div>
                </>
              ) : (
                <>
                  {selected.respuesta && (
                    <div className="p-4 bg-blue-50 rounded-xl border-l-4 border-[#4285F4]">
                      <p className="text-xs font-semibold text-gray-500 mb-2">Respuesta del instructor:</p>
                      <p className="text-sm text-gray-800 leading-relaxed">{selected.respuesta}</p>
                    </div>
                  )}

                  {selected.estado === 'Pendiente' ? (
                    <>
                      <div>
                        <div className="flex items-center justify-between mb-2">
                          <label className="input-label mb-0">Respuesta rápida (opcional)</label>
                          <button type="button" onClick={() => setModalRespuestas(true)}
                            className="text-xs text-[#4285F4] hover:underline flex items-center gap-1">
                            <Settings size={12}/> Editar respuestas
                          </button>
                        </div>
                        <select className="input-field" 
                          onChange={e => e.target.value && setRespuesta(e.target.value)}
                          value="">
                          <option value="">Selecciona una respuesta rápida...</option>
                          {respuestasRapidas.map((r, i) => (
                            <option key={i} value={r}>{truncarTexto(r)}</option>
                          ))}
                        </select>
                      </div>

                      <div>
                        <label className="input-label">Comentario personalizado (opcional)</label>
                        <textarea rows={3} className="input-field resize-none"
                          placeholder="Escribe un comentario para el aprendiz..."
                          value={respuesta} onChange={e => setRespuesta(e.target.value)} />
                      </div>

                      <div className="flex gap-3">
                        <button onClick={() => openConfirmAction('Rechazada')} disabled={saving}
                          className="btn-danger flex-1">
                          <X size={16}/> Rechazar
                        </button>
                        <button onClick={() => openConfirmAction('Aprobada')} disabled={saving}
                          className="btn-success flex-1">
                          <Check size={16}/> Aprobar
                        </button>
                      </div>
                      <button 
                        onClick={() => setConfirmDelete(true)} 
                        disabled={saving}
                        className="btn-secondary w-full flex items-center justify-center gap-2 text-red-600 hover:bg-red-50 border-red-200 mt-2"
                      >
                        <Trash2 size={16}/> Enviar a Papelera
                      </button>
                    </>
                  ) : (
                    <button onClick={openEditMode} className="btn-primary w-full flex items-center justify-center gap-2">
                      <Edit2 size={16}/> Editar Respuesta
                    </button>
                  )}
                </>
              )}
            </div>

            {/* Columna derecha: Calendario */}
            <div className="lg:block hidden">
              <div className="card bg-gradient-to-br from-blue-50 to-indigo-50 sticky top-4">
                <h3 className="font-semibold text-gray-900 mb-3 flex items-center gap-2">
                  <Calendar size={16}/> Fechas de Falta
                </h3>
                {(() => {
                  const fechasExcusa = safeJSONParse(selected.fechas, []);
                  if (fechasExcusa.length === 0) return <p className="text-sm text-gray-500">No hay fechas registradas</p>;
                  
                  // Ordenar fechas cronológicamente
                  const fechasOrdenadas = [...fechasExcusa].sort((a, b) => new Date(a) - new Date(b));
                  
                  // Agrupar por mes
                  const fechasPorMes = {};
                  fechasOrdenadas.forEach(fecha => {
                    const date = new Date(fecha + 'T00:00:00');
                    const mesAño = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
                    if (!fechasPorMes[mesAño]) {
                      fechasPorMes[mesAño] = [];
                    }
                    fechasPorMes[mesAño].push(fecha);
                  });
                  
                  const nombresMeses = ['Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio', 'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'];
                  const nombresDias = ['Domingo', 'Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado'];
                  
                  return (
                    <div className="space-y-4 max-h-96 overflow-y-auto pr-2">
                      {Object.entries(fechasPorMes).map(([mesAño, fechas]) => {
                        const [año, mes] = mesAño.split('-');
                        const nombreMes = nombresMeses[parseInt(mes) - 1];
                        
                        return (
                          <div key={mesAño} className="bg-white rounded-lg p-3">
                            <p className="font-bold text-gray-900 mb-2">{nombreMes} {año}</p>
                            <div className="space-y-1">
                              {fechas.map((fecha, i) => {
                                const date = new Date(fecha + 'T00:00:00');
                                const dia = date.getDate();
                                const diaSemana = nombresDias[date.getDay()];
                                
                                return (
                                  <div key={i} className="flex items-center gap-2 p-2 bg-red-50 rounded-lg">
                                    <div className="w-10 h-10 bg-red-500 text-white rounded-lg flex items-center justify-center font-bold">
                                      {dia}
                                    </div>
                                    <div className="flex-1">
                                      <p className="text-sm font-medium text-gray-900">{diaSemana}</p>
                                      <p className="text-xs text-gray-500">{date.toLocaleDateString('es-CO')}</p>
                                    </div>
                                  </div>
                                );
                              })}
                            </div>
                          </div>
                        );
                      })}
                      
                      <div className="p-2 bg-white rounded-lg">
                        <p className="text-xs text-gray-600 flex items-center gap-2">
                          <span className="w-3 h-3 bg-red-500 rounded"></span>
                          Total: {fechasExcusa.length} día{fechasExcusa.length !== 1 ? 's' : ''} de falta
                        </p>
                      </div>
                    </div>
                  );
                })()}
              </div>
            </div>
          </div>
        )}
      </Modal>

      {/* Confirmación de acción */}
      <ConfirmDialog
        open={!!confirmAction}
        onClose={() => setConfirmAction(null)}
        onConfirm={confirmUpdate}
        title={`¿${confirmAction?.estado === 'Aprobada' ? 'Aprobar' : 'Rechazar'} excusa?`}
        message={`¿Estás seguro de que quieres ${confirmAction?.estado === 'Aprobada' ? 'aprobar' : 'rechazar'} esta excusa?`}
        confirmText={confirmAction?.estado === 'Aprobada' ? 'Sí, aprobar' : 'Sí, rechazar'}
        cancelText="Cancelar"
        type={confirmAction?.estado === 'Aprobada' ? 'info' : 'danger'}
      />

      {/* Confirmación eliminar excusa */}
      <ConfirmDialog
        open={confirmDelete}
        onClose={() => setConfirmDelete(false)}
        onConfirm={handleDeleteExcusa}
        title="¿Enviar excusa a papelera?"
        message="Esta excusa será enviada a la papelera y podrá ser recuperada desde la sección de papelera."
        confirmText="Enviar a Papelera"
        cancelText="Cancelar"
        type="danger"
      />

      {/* Modal gestión de respuestas rápidas */}
      <Modal open={modalRespuestas} onClose={intentarCerrarModal} 
        title="Gestionar Respuestas Rápidas" maxWidth="max-w-2xl">
        <div className="space-y-4">
          {/* Agregar nueva respuesta */}
          <div className="p-4 bg-gray-50 rounded-xl">
            <label className="input-label">Nueva respuesta rápida</label>
            <div className="flex gap-2">
              <input 
                type="text" 
                className="input-field flex-1" 
                placeholder="Escribe una nueva respuesta rápida..."
                value={nuevaRespuesta}
                onChange={e => setNuevaRespuesta(e.target.value)}
                onKeyPress={e => e.key === 'Enter' && agregarRespuesta()}
              />
              <button onClick={agregarRespuesta} className="btn-primary flex items-center gap-2">
                <Plus size={16}/> Agregar
              </button>
            </div>
          </div>

          {/* Lista de respuestas */}
          <div className="space-y-2">
            <p className="text-sm font-medium text-gray-700">Respuestas guardadas ({respuestasRapidas.length})</p>
            {respuestasRapidas.length === 0 ? (
              <div className="p-8 text-center text-gray-500">
                <p className="text-sm">No hay respuestas rápidas guardadas</p>
              </div>
            ) : (
              <div className="space-y-2 max-h-96 overflow-y-auto pr-2">
                {respuestasRapidas.map((respuesta, index) => (
                  <div 
                    key={index}
                    draggable
                    onDragStart={() => handleDragStart(index)}
                    onDragOver={(e) => handleDragOver(e, index)}
                    onDragEnd={handleDragEnd}
                    className={`p-3 bg-white border-2 rounded-lg transition-all ${
                      draggedIndex === index ? 'border-[#4285F4] shadow-lg' : 'border-gray-200'
                    }`}
                  >
                    {editandoRespuesta === index ? (
                      <div className="space-y-2">
                        <textarea 
                          className="input-field resize-none" 
                          rows={3}
                          value={respuesta}
                          onChange={e => {
                            const nuevas = [...respuestasRapidas];
                            nuevas[index] = e.target.value;
                            setRespuestasRapidas(nuevas);
                          }}
                        />
                        <div className="flex gap-2">
                          <button 
                            onClick={() => actualizarRespuesta(index, respuesta)}
                            className="btn-primary flex-1"
                          >
                            <Check size={14}/> Confirmar
                          </button>
                          <button 
                            onClick={() => setEditandoRespuesta(null)}
                            className="btn-secondary flex-1"
                          >
                            Cancelar
                          </button>
                        </div>
                      </div>
                    ) : (
                      <div className="flex items-start gap-3">
                        <button 
                          className="cursor-move text-gray-400 hover:text-gray-600 mt-1 flex-shrink-0"
                          title="Arrastra para reordenar"
                        >
                          <GripVertical size={16}/>
                        </button>
                        <p className="flex-1 text-sm text-gray-700 break-words overflow-hidden">{respuesta}</p>
                        <div className="flex gap-1 flex-shrink-0">
                          <button 
                            onClick={() => setEditandoRespuesta(index)}
                            className="btn-icon text-blue-400 hover:bg-blue-50"
                            title="Editar"
                          >
                            <Edit2 size={14}/>
                          </button>
                          <button 
                            onClick={() => eliminarRespuesta(index)}
                            className="btn-icon text-red-400 hover:bg-red-50"
                            title="Eliminar"
                          >
                            <Trash2 size={14}/>
                          </button>
                        </div>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Botones de acción */}
          <div className="pt-4 border-t border-gray-200 space-y-3">
            <div className="flex gap-3">
              <button 
                onClick={intentarCerrarModal} 
                className="btn-secondary flex-1"
                disabled={guardandoRespuestas}
              >
                Cancelar
              </button>
              <button 
                onClick={guardarCambiosRespuestas} 
                className="btn-primary flex-1"
                disabled={guardandoRespuestas || !hayCambiosPendientes()}
              >
                {guardandoRespuestas ? (
                  <>
                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"/>
                    Guardando...
                  </>
                ) : (
                  <>
                    <Check size={16}/> Guardar Cambios
                  </>
                )}
              </button>
            </div>
            
            <button 
              onClick={() => setConfirmRestaurar(true)} 
              className="btn-secondary w-full"
              disabled={guardandoRespuestas}
            >
              Restaurar Respuestas por Defecto
            </button>
          </div>
        </div>
      </Modal>

      {/* Confirmación restaurar respuestas por defecto */}
      <ConfirmDialog
        open={confirmRestaurar}
        onClose={() => setConfirmRestaurar(false)}
        onConfirm={restaurarDefecto}
        title="¿Restaurar respuestas por defecto?"
        message="Esto eliminará todas tus respuestas personalizadas y las reemplazará con las respuestas predeterminadas del sistema."
        confirmText="Sí, restaurar"
        cancelText="Cancelar"
        type="warning"
      />

      {/* Confirmación salir sin guardar */}
      <ConfirmDialog
        open={confirmSalir}
        onClose={() => setConfirmSalir(false)}
        onConfirm={confirmarSalirSinGuardar}
        title="¿Salir sin guardar?"
        message="Tienes cambios sin guardar. Si sales ahora, perderás todos los cambios realizados."
        confirmText="Sí, salir sin guardar"
        cancelText="Continuar editando"
        type="warning"
      />
    </div>
  );
}
