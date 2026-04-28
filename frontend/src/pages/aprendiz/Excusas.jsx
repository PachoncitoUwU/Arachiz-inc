import React, { useState, useEffect } from 'react';
import fetchApi from '../../services/api';
import PageHeader from '../../components/PageHeader';
import EmptyState from '../../components/EmptyState';
import Modal from '../../components/Modal';
import ConfirmDialog from '../../components/ConfirmDialog';
import { useToast } from '../../context/ToastContext';
import { Send, Clock, CheckCircle, XCircle, Paperclip, Edit2, FileText, X, Calendar, Plus, Trash2 } from 'lucide-react';

const STATUS_MAP = {
  Pendiente: { badge: 'badge-pending', icon: Clock },
  Aprobada: { badge: 'badge-success', icon: CheckCircle },
  Rechazada: { badge: 'badge-danger', icon: XCircle },
};

export default function AprendizExcusas() {
  const { showToast } = useToast();
  const [excusas, setExcusas] = useState([]);
  const [materias, setMaterias] = useState([]);
  const [loading, setLoading] = useState(true);
  const [modalNueva, setModalNueva] = useState(false);
  const [modalEditar, setModalEditar] = useState(null);
  const [modalDetalle, setModalDetalle] = useState(null);
  const [modalHorario, setModalHorario] = useState(false);
  const [form, setForm] = useState({ fechas: [''], motivo: '', materiaId: '' });
  const [archivos, setArchivos] = useState([]);
  const [saving, setSaving] = useState(false);
  const [errorModal, setErrorModal] = useState('');
  const [confirmClose, setConfirmClose] = useState(false);
  
  // Filtros
  const [filtroEstado, setFiltroEstado] = useState('Todas');
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

  // Helper para obtener el día de la semana en español
  const getDiaSemana = (fecha) => {
    const dias = ['Domingo', 'Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado'];
    const date = new Date(fecha + 'T00:00:00');
    return dias[date.getDay()];
  };

  // Helper para validar si una fecha tiene clase
  const validarFechaConClase = (fecha, horarios) => {
    if (!horarios || horarios.length === 0) return true; // Si no hay horarios, permitir cualquier fecha
    const diaSemana = getDiaSemana(fecha);
    return horarios.some(h => h.dia === diaSemana);
  };

  useEffect(() => {
    loadExcusas();
    loadMaterias();
  }, []);

  const loadExcusas = async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams();
      if (filtroEstado !== 'Todas') params.append('estado', filtroEstado);
      
      const d = await fetchApi(`/excusas/my-excusas?${params.toString()}`);
      setExcusas(d.excusas);
    } catch (err) {
      console.error(err);
      showToast(err.message, 'error');
    } finally {
      setLoading(false);
    }
  };

  const loadMaterias = async () => {
    try {
      const d = await fetchApi('/excusas/materias-con-horarios');
      setMaterias(d.materias);
    } catch (err) {
      console.error(err);
    }
  };

  useEffect(() => {
    loadExcusas();
  }, [filtroEstado, filtroMateria, filtroFechaDesde, filtroFechaHasta]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setErrorModal('');
    setSaving(true);

    try {
      const fechasValidas = form.fechas.filter(f => f.trim());
      
      if (fechasValidas.length === 0) {
        throw new Error('Debes seleccionar al menos una fecha');
      }

      if (!form.motivo || !form.materiaId) {
        throw new Error('Por favor completa todos los campos obligatorios');
      }

      // Validar que las fechas tengan clase
      const materiaSeleccionada = materias.find(m => m.id === form.materiaId);
      if (materiaSeleccionada && materiaSeleccionada.horarios) {
        for (const fecha of fechasValidas) {
          if (!validarFechaConClase(fecha, materiaSeleccionada.horarios)) {
            const diaSemana = getDiaSemana(fecha);
            throw new Error(`La fecha ${new Date(fecha + 'T00:00:00').toLocaleDateString('es-CO')} (${diaSemana}) no tiene clase de ${materiaSeleccionada.nombre}`);
          }
        }
      }

      // Validar archivos
      for (const archivo of archivos) {
        if (archivo.size > 20 * 1024 * 1024) {
          throw new Error(`El archivo ${archivo.name} excede el tamaño máximo de 20MB`);
        }
        const ext = archivo.name.split('.').pop().toLowerCase();
        if (!['pdf', 'jpg', 'jpeg', 'png'].includes(ext)) {
          throw new Error(`El archivo ${archivo.name} no es un formato permitido (solo PDF, JPG, PNG)`);
        }
      }

      const body = new FormData();
      body.append('fechas', JSON.stringify(fechasValidas));
      body.append('motivo', form.motivo);
      body.append('materiaId', form.materiaId);
      archivos.forEach(archivo => body.append('archivos', archivo));

      await fetchApi('/excusas', { method: 'POST', body });
      
      showToast('Excusa enviada correctamente', 'success');
      setModalNueva(false);
      setForm({ fechas: [''], motivo: '', materiaId: '' });
      setArchivos([]);
      loadExcusas();
    } catch (err) {
      setErrorModal(err.message);
      showToast(err.message, 'error');
    } finally {
      setSaving(false);
    }
  };

  const handleEdit = async (e) => {
    e.preventDefault();
    setErrorModal('');
    setSaving(true);

    try {
      const fechasValidas = form.fechas.filter(f => f.trim());
      
      if (fechasValidas.length === 0) {
        throw new Error('Debes seleccionar al menos una fecha');
      }

      // Validar que las fechas tengan clase
      const materiaExcusa = materias.find(m => m.id === modalEditar.materiaId);
      if (materiaExcusa && materiaExcusa.horarios) {
        for (const fecha of fechasValidas) {
          if (!validarFechaConClase(fecha, materiaExcusa.horarios)) {
            const diaSemana = getDiaSemana(fecha);
            throw new Error(`La fecha ${new Date(fecha + 'T00:00:00').toLocaleDateString('es-CO')} (${diaSemana}) no tiene clase de ${materiaExcusa.nombre}`);
          }
        }
      }

      const body = new FormData();
      body.append('motivo', form.motivo);
      body.append('fechas', JSON.stringify(fechasValidas));
      archivos.forEach(archivo => body.append('archivos', archivo));

      await fetchApi(`/excusas/${modalEditar.id}`, { method: 'PUT', body });
      
      showToast('Excusa actualizada correctamente', 'success');
      setModalEditar(null);
      setModalDetalle(null);
      setForm({ fechas: [''], motivo: '', materiaId: '' });
      setArchivos([]);
      loadExcusas();
    } catch (err) {
      setErrorModal(err.message);
      showToast(err.message, 'error');
    } finally {
      setSaving(false);
    }
  };

  const openEditModal = (excusa) => {
    setModalDetalle(null);
    setModalEditar(excusa);
    setForm({ motivo: excusa.motivo, fechas: safeJSONParse(excusa.fechas, ['']), materiaId: excusa.materiaId });
    setArchivos([]);
    setErrorModal('');
  };

  const handleCloseModal = () => {
    const hasContent = form.motivo || form.materiaId || archivos.length > 0 || form.fechas.some(f => f);
    if (hasContent) {
      setConfirmClose(true);
    } else {
      setModalNueva(false);
      setForm({ fechas: [''], motivo: '', materiaId: '' });
      setArchivos([]);
    }
  };

  const confirmCloseModal = () => {
    setModalNueva(false);
    setConfirmClose(false);
    setForm({ fechas: [''], motivo: '', materiaId: '' });
    setArchivos([]);
  };

  const addFecha = () => setForm(prev => ({ ...prev, fechas: [...prev.fechas, ''] }));
  const removeFecha = (i) => setForm(prev => ({ ...prev, fechas: prev.fechas.filter((_, idx) => idx !== i) }));
  const updateFecha = (i, val) => setForm(prev => {
    const fechas = [...prev.fechas];
    fechas[i] = val;
    return { ...prev, fechas };
  });

  const handleFileChange = (e) => {
    const files = Array.from(e.target.files);
    const validFiles = [];
    
    for (const file of files) {
      if (file.size > 20 * 1024 * 1024) {
        setErrorModal(`El archivo ${file.name} excede el tamaño máximo de 20MB`);
        continue;
      }
      const ext = file.name.split('.').pop().toLowerCase();
      if (!['pdf', 'jpg', 'jpeg', 'png'].includes(ext)) {
        setErrorModal(`El archivo ${file.name} no es un formato permitido`);
        continue;
      }
      validFiles.push(file);
    }
    
    setArchivos(prev => [...prev, ...validFiles]);
  };

  const removeArchivo = (index) => {
    setArchivos(prev => prev.filter((_, i) => i !== index));
  };

  const limpiarFiltros = () => {
    setFiltroEstado('Todas');
    setFiltroMateria('Todas');
    setFiltroFechaDesde('');
    setFiltroFechaHasta('');
  };

  // Filtrar excusas localmente
  const excusasFiltradas = excusas.filter(excusa => {
    if (filtroMateria !== 'Todas' && excusa.materiaId !== filtroMateria) return false;
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
    total: excusasFiltradas.length,
    pendientes: excusasFiltradas.filter(e => e.estado === 'Pendiente').length,
    aprobadas: excusasFiltradas.filter(e => e.estado === 'Aprobada').length,
    rechazadas: excusasFiltradas.filter(e => e.estado === 'Rechazada').length,
  };

  const maxDate = new Date().toISOString().split('T')[0];
  const materiaSeleccionada = materias.find(m => m.id === form.materiaId);

  return (
    <div className="animate-fade-in space-y-5">
      <PageHeader
        title="Mis Excusas"
        subtitle="Justifica tus inasistencias y consulta el estado de tus excusas"
        action={
          <button onClick={() => { setModalNueva(true); setErrorModal(''); setForm({ fechas: [''], motivo: '', materiaId: '' }); setArchivos([]); }} 
            className="btn-primary flex items-center gap-2">
            <Send size={16}/> Nueva Excusa
          </button>
        }
      />

      {/* Resumen */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {[
          { label: 'Total', value: counts.total, cls: 'bg-gray-50 text-gray-700' },
          { label: 'Pendientes', value: counts.pendientes, cls: 'bg-yellow-50 text-yellow-700' },
          { label: 'Aprobadas', value: counts.aprobadas, cls: 'bg-green-50 text-[#34A853]' },
          { label: 'Rechazadas', value: counts.rechazadas, cls: 'bg-red-50 text-[#EA4335]' },
        ].map(s => (
          <div key={s.label} className={`card-sm text-center ${s.cls}`}>
            <p className="text-2xl font-bold">{s.value}</p>
            <p className="text-xs font-medium mt-0.5">{s.label}</p>
          </div>
        ))}
      </div>

      {/* Filtros */}
      <div className="card">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
          <div>
            <label className="input-label">Estado</label>
            <select className="input-field" value={filtroEstado} onChange={e => setFiltroEstado(e.target.value)}>
              <option>Todas</option>
              <option>Pendiente</option>
              <option>Aprobada</option>
              <option>Rechazada</option>
            </select>
          </div>
          <div>
            <label className="input-label">Materia</label>
            <select className="input-field" value={filtroMateria} onChange={e => setFiltroMateria(e.target.value)}>
              <option value="Todas">Todas</option>
              {materias.map(m => (
                <option key={m.id} value={m.id}>{m.nombre}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="input-label">Desde</label>
            <input type="date" className="input-field" value={filtroFechaDesde} 
              onChange={e => setFiltroFechaDesde(e.target.value)} />
          </div>
          <div>
            <label className="input-label">Hasta</label>
            <input type="date" className="input-field" value={filtroFechaHasta} 
              onChange={e => setFiltroFechaHasta(e.target.value)} />
          </div>
        </div>
        <div className="mt-3">
          <button onClick={limpiarFiltros} className="btn-secondary">
            Limpiar Filtros
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
          <EmptyState
            icon={<FileText size={32}/>}
            title="Sin excusas"
            description="No has enviado ninguna excusa aún"
            action={<button onClick={() => setModalNueva(true)} className="btn-primary">Enviar Excusa</button>}
          />
        </div>
      ) : (
        <div className="space-y-3">
          {excusasFiltradas.map(excusa => {
            const { badge, icon: Icon } = STATUS_MAP[excusa.estado];
            const fechasArray = safeJSONParse(excusa.fechas, []);
            return (
              <div key={excusa.id} 
                onClick={() => setModalDetalle(excusa)}
                className="card hover:shadow-lg hover:scale-[1.01] transition-all cursor-pointer">
                <div className="flex items-start justify-between gap-4">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1 flex-wrap">
                      <span className="font-bold text-gray-900">{excusa.materia.nombre}</span>
                      <span className="text-xs text-gray-400">Ficha {excusa.materia.ficha.numero}</span>
                      <span className={badge}><Icon size={12}/> {excusa.estado}</span>
                    </div>
                    <p className="text-sm text-gray-500">
                      Fechas: {fechasArray.map(f => new Date(f + 'T00:00:00').toLocaleDateString('es-CO')).join(', ')}
                    </p>
                    <p className="text-sm text-gray-600 mt-1 line-clamp-2">{excusa.motivo}</p>
                    <p className="text-xs text-gray-400 mt-2">
                      Enviada: {excusa.createdAt ? new Date(excusa.createdAt).toLocaleDateString('es-CO') : 'N/A'}
                      {excusa.respondedAt && ` · Respondida: ${new Date(excusa.respondedAt).toLocaleDateString('es-CO')}`}
                    </p>
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

      {/* Modal nueva excusa */}
      <Modal open={modalNueva} onClose={handleCloseModal} title="Enviar Excusa" maxWidth="max-w-4xl">
        <form onSubmit={handleSubmit} className="space-y-4">
          {errorModal && <p className="text-sm text-red-500 bg-red-50 px-3 py-2 rounded-lg">{errorModal}</p>}
          
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
            {/* Formulario principal */}
            <div className="lg:col-span-2 space-y-4">
              <div>
                <label className="input-label">Materia *</label>
                <select required className="input-field" value={form.materiaId}
                  onChange={e => setForm({...form, materiaId: e.target.value})}>
                  <option value="">Selecciona una materia</option>
                  {materias.map(m => (
                    <option key={m.id} value={m.id}>{m.nombre} - Ficha {m.ficha.numero}</option>
                  ))}
                </select>
              </div>

              <div>
                <div className="flex items-center justify-between mb-2">
                  <label className="input-label mb-0">Fechas de las faltas *</label>
                  <button type="button" onClick={addFecha}
                    className="text-xs text-[#4285F4] hover:underline flex items-center gap-1">
                    <Plus size={12}/> Agregar fecha
                  </button>
                </div>
                <div className="space-y-2">
                  {form.fechas.map((f, i) => (
                    <div key={i} className="flex gap-2">
                      <input type="date" required className="input-field flex-1" max={maxDate}
                        value={f} onChange={e => updateFecha(i, e.target.value)} />
                      {form.fechas.length > 1 && (
                        <button type="button" onClick={() => removeFecha(i)}
                          className="btn-icon text-red-400 hover:bg-red-50">
                          <Trash2 size={14}/>
                        </button>
                      )}
                    </div>
                  ))}
                </div>
                <p className="text-xs text-gray-500 mt-1">Solo puedes seleccionar fechas pasadas o el día actual</p>
              </div>

              <div>
                <label className="input-label">Motivo de la falta *</label>
                <textarea required rows={4} className="input-field resize-none"
                  placeholder="Describa detalladamente el motivo de su ausencia..."
                  value={form.motivo} onChange={e => setForm({...form, motivo: e.target.value})} />
              </div>

              <div>
                <label className="input-label">Archivos adjuntos (opcional)</label>
                <p className="text-xs text-gray-500 mb-2">Solo se permiten imágenes (JPG, PNG) y documentos PDF. Máximo 20MB por archivo.</p>
                <input
                  type="file"
                  multiple
                  accept=".pdf,.jpg,.jpeg,.png"
                  className="input-field"
                  onChange={handleFileChange}
                />
                {archivos.length > 0 && (
                  <div className="mt-2 space-y-2">
                    {archivos.map((archivo, i) => (
                      <div key={i} className="flex items-center justify-between p-2 bg-gray-50 rounded-lg">
                        <div className="flex items-center gap-2">
                          <Paperclip size={14} className="text-gray-400"/>
                          <span className="text-sm text-gray-700">{archivo.name}</span>
                          <span className="text-xs text-gray-400">({(archivo.size / 1024).toFixed(2)} KB)</span>
                        </div>
                        <button type="button" onClick={() => removeArchivo(i)}
                          className="text-red-400 hover:text-red-600">
                          <X size={16}/>
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>

            {/* Horario */}
            <div className="lg:block hidden">
              <div className="card bg-gray-50 sticky top-4">
                <h3 className="font-semibold text-gray-900 mb-3 flex items-center gap-2">
                  <Calendar size={16}/> Horario de la Materia
                </h3>
                {materiaSeleccionada ? (
                  materiaSeleccionada.horarios.length > 0 ? (
                    <div className="space-y-2">
                      {materiaSeleccionada.horarios.map((h, i) => (
                        <div key={i} className="p-2 bg-white rounded-lg">
                          <p className="text-sm font-medium text-gray-900">{h.dia}</p>
                          <p className="text-xs text-gray-500">{h.horaInicio} - {h.horaFin}</p>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p className="text-sm text-gray-500">No hay horarios configurados</p>
                  )
                ) : (
                  <p className="text-sm text-gray-500">Selecciona una materia para ver su horario</p>
                )}
              </div>
            </div>

            {/* Botón ver horario en móvil */}
            <div className="lg:hidden">
              <button type="button" onClick={() => setModalHorario(true)}
                className="btn-secondary w-full flex items-center justify-center gap-2">
                <Calendar size={16}/> Ver Horario
              </button>
            </div>
          </div>

          <div className="flex gap-3 pt-2">
            <button type="button" onClick={handleCloseModal} className="btn-secondary flex-1">
              Cancelar
            </button>
            <button type="submit" disabled={saving} className="btn-primary flex-1" style={{ backgroundColor: '#39A900' }}>
              <Send size={14}/> {saving ? 'Enviando...' : 'Enviar Excusa'}
            </button>
          </div>
        </form>
      </Modal>

      {/* Modal horario móvil */}
      <Modal open={modalHorario} onClose={() => setModalHorario(false)} title="Horario de la Materia" maxWidth="max-w-md">
        {materiaSeleccionada ? (
          materiaSeleccionada.horarios.length > 0 ? (
            <div className="space-y-2">
              {materiaSeleccionada.horarios.map((h, i) => (
                <div key={i} className="p-3 bg-gray-50 rounded-lg">
                  <p className="text-sm font-medium text-gray-900">{h.dia}</p>
                  <p className="text-xs text-gray-500">{h.horaInicio} - {h.horaFin}</p>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-sm text-gray-500">No hay horarios configurados</p>
          )
        ) : (
          <p className="text-sm text-gray-500">Selecciona una materia primero</p>
        )}
      </Modal>

      {/* Modal editar excusa */}
      <Modal open={!!modalEditar} onClose={() => setModalEditar(null)} title="Editar Excusa" maxWidth="max-w-4xl">
        {modalEditar && (
          <form onSubmit={handleEdit} className="space-y-4">
            {errorModal && <p className="text-sm text-red-500 bg-red-50 px-3 py-2 rounded-lg">{errorModal}</p>}
            
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
              {/* Formulario principal */}
              <div className="lg:col-span-2 space-y-4">
                <div className="p-3 bg-gray-50 rounded-xl">
                  <p className="text-sm font-semibold text-gray-800">{modalEditar.materia.nombre}</p>
                </div>

                <div>
                  <div className="flex items-center justify-between mb-2">
                    <label className="input-label mb-0">Fechas de las faltas *</label>
                    <button type="button" onClick={addFecha}
                      className="text-xs text-[#4285F4] hover:underline flex items-center gap-1">
                      <Plus size={12}/> Agregar fecha
                    </button>
                  </div>
                  <div className="space-y-2">
                    {form.fechas.map((f, i) => (
                      <div key={i} className="flex gap-2">
                        <input type="date" required className="input-field flex-1" max={maxDate}
                          value={f} onChange={e => updateFecha(i, e.target.value)} />
                        {form.fechas.length > 1 && (
                          <button type="button" onClick={() => removeFecha(i)}
                            className="btn-icon text-red-400 hover:bg-red-50">
                            <Trash2 size={14}/>
                          </button>
                        )}
                      </div>
                    ))}
                  </div>
                  <p className="text-xs text-gray-500 mt-1">Solo puedes seleccionar fechas con clase de esta materia</p>
                </div>

                <div>
                  <label className="input-label">Motivo de la falta *</label>
                  <textarea required rows={4} className="input-field resize-none"
                    placeholder="Describa detalladamente el motivo de su ausencia..."
                    value={form.motivo} onChange={e => setForm({...form, motivo: e.target.value})} />
                </div>

                <div>
                  <label className="input-label">Cambiar archivos adjuntos (opcional)</label>
                  <p className="text-xs text-gray-500 mb-2">Solo se permiten imágenes (JPG, PNG) y documentos PDF. Máximo 20MB por archivo.</p>
                  <input type="file" multiple accept=".pdf,.jpg,.jpeg,.png" className="input-field"
                    onChange={handleFileChange} />
                  {modalEditar.archivosUrls && safeJSONParse(modalEditar.archivosUrls, []).length > 0 && archivos.length === 0 && (
                    <p className="text-xs text-gray-500 mt-1">
                      Archivos actuales: {safeJSONParse(modalEditar.archivosUrls, []).length} archivo(s)
                    </p>
                  )}
                  {archivos.length > 0 && (
                    <div className="mt-2 space-y-2">
                      {archivos.map((archivo, i) => (
                        <div key={i} className="flex items-center justify-between p-2 bg-gray-50 rounded-lg">
                          <div className="flex items-center gap-2">
                            <Paperclip size={14} className="text-gray-400"/>
                            <span className="text-sm text-gray-700">{archivo.name}</span>
                          </div>
                          <button type="button" onClick={() => removeArchivo(i)}
                            className="text-red-400 hover:text-red-600">
                            <X size={16}/>
                          </button>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>

              {/* Horario */}
              <div className="lg:block hidden">
                <div className="card bg-gray-50 sticky top-4">
                  <h3 className="font-semibold text-gray-900 mb-3 flex items-center gap-2">
                    <Calendar size={16}/> Horario de la Materia
                  </h3>
                  {(() => {
                    const materiaExcusa = materias.find(m => m.id === modalEditar.materiaId);
                    return materiaExcusa ? (
                      materiaExcusa.horarios && materiaExcusa.horarios.length > 0 ? (
                        <div className="space-y-2">
                          {materiaExcusa.horarios.map((h, i) => (
                            <div key={i} className="p-2 bg-white rounded-lg">
                              <p className="text-sm font-medium text-gray-900">{h.dia}</p>
                              <p className="text-xs text-gray-500">{h.horaInicio} - {h.horaFin}</p>
                            </div>
                          ))}
                        </div>
                      ) : (
                        <p className="text-sm text-gray-500">No hay horarios configurados</p>
                      )
                    ) : (
                      <p className="text-sm text-gray-500">Cargando horario...</p>
                    );
                  })()}
                </div>
              </div>

              {/* Botón ver horario en móvil */}
              <div className="lg:hidden">
                <button type="button" onClick={() => setModalHorario(true)}
                  className="btn-secondary w-full flex items-center justify-center gap-2">
                  <Calendar size={16}/> Ver Horario
                </button>
              </div>
            </div>

            <div className="flex gap-3 pt-2">
              <button type="button" onClick={() => setModalEditar(null)} className="btn-secondary flex-1">
                Cancelar
              </button>
              <button type="submit" disabled={saving} className="btn-primary flex-1">
                <Edit2 size={14}/> {saving ? 'Guardando...' : 'Guardar Cambios'}
              </button>
            </div>
          </form>
        )}
      </Modal>

      {/* Modal detalle */}
      <Modal open={!!modalDetalle} onClose={() => setModalDetalle(null)} title="Detalle de Excusa">
        {modalDetalle && (
          <div className="space-y-4">
            <div className="flex items-center gap-2">
              <span className="font-bold text-gray-900">{modalDetalle.materia.nombre}</span>
              {(() => { 
                const { badge, icon: Icon } = STATUS_MAP[modalDetalle.estado]; 
                return <span className={badge}><Icon size={12}/>{modalDetalle.estado}</span>; 
              })()}
            </div>
            
            <div>
              <p className="text-xs font-semibold text-gray-500 mb-1">Fechas de falta:</p>
              <div className="flex flex-wrap gap-1">
                {safeJSONParse(modalDetalle.fechas, []).map((f, i) => (
                  <span key={i} className="badge badge-gray">
                    {new Date(f + 'T00:00:00').toLocaleDateString('es-CO')}
                  </span>
                ))}
              </div>
            </div>
            
            <div>
              <p className="text-xs font-semibold text-gray-500 mb-1">Motivo:</p>
              <p className="text-sm text-gray-700">{modalDetalle.motivo}</p>
            </div>
            
            {modalDetalle.archivosUrls && safeJSONParse(modalDetalle.archivosUrls, []).length > 0 && (
              <div>
                <p className="text-xs font-semibold text-gray-500 mb-2">Archivos adjuntos:</p>
                <div className="space-y-1">
                  {safeJSONParse(modalDetalle.archivosUrls, []).map((url, i) => (
                    <a key={i} href={url} target="_blank" rel="noreferrer"
                      className="flex items-center gap-2 text-sm text-[#4285F4] hover:underline">
                      <Paperclip size={14}/> Archivo {i + 1}
                    </a>
                  ))}
                </div>
              </div>
            )}
            
            <div className="text-xs text-gray-400 space-y-0.5">
              <p>Enviada: {modalDetalle.createdAt ? new Date(modalDetalle.createdAt).toLocaleDateString('es-CO') : 'N/A'}</p>
              {modalDetalle.respondedAt && <p>Respondida: {new Date(modalDetalle.respondedAt).toLocaleDateString('es-CO')}</p>}
            </div>
            
            {modalDetalle.respuesta && (
              <div className="p-3 bg-gray-50 rounded-xl border-l-2 border-[#4285F4]">
                <p className="text-xs font-semibold text-gray-500 mb-1">Respuesta del instructor:</p>
                <p className="text-sm text-gray-700">{modalDetalle.respuesta}</p>
              </div>
            )}

            {modalDetalle.estado === 'Pendiente' && (
              <button onClick={() => openEditModal(modalDetalle)} 
                className="btn-primary w-full flex items-center justify-center gap-2">
                <Edit2 size={16}/> Editar Excusa
              </button>
            )}
          </div>
        )}
      </Modal>

      {/* Confirmación cerrar modal */}
      <ConfirmDialog
        open={confirmClose}
        onClose={() => setConfirmClose(false)}
        onConfirm={confirmCloseModal}
        title="¿Descartar cambios?"
        message="Tienes contenido sin guardar. ¿Estás seguro de que quieres salir?"
        confirmText="Sí, descartar"
        cancelText="No, continuar editando"
        type="warning"
      />
    </div>
  );
}
