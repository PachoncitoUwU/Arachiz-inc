import React, { useState } from 'react';
import Modal from './Modal';
import ConfirmDialog from './ConfirmDialog';
import fetchApi from '../services/api';
import { BookOpen, User, Clock, Edit2, Trash2, Loader, UserPlus, UserMinus, EyeOff, Eye, UserCheck, Download, Calendar, BarChart } from 'lucide-react';
import { useToast } from '../context/ToastContext';

export default function MateriaInfoModal({ 
  open, 
  onClose, 
  materia, 
  isCreatorOrAdmin,
  isAdmin = false,
  instructores = [],
  currentUserId = null,
  onUpdate,
  onDelete,
  isAprendizView = false,
  isMateriaEvitada = false,
  canTakeMateria = false
}) {
  const [isEditing, setIsEditing] = useState(false);
  const [formData, setFormData] = useState({
    nombre: materia?.nombre || '',
    tipo: materia?.tipo || 'Técnica',
    instructorId: materia?.instructorId || ''
  });
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [takingMateria, setTakingMateria] = useState(false);
  const [leavingMateria, setLeavingMateria] = useState(false);
  const [evitandoMateria, setEvitandoMateria] = useState(false);
  const [volviendoATomarMateria, setVolviendoATomarMateria] = useState(false);
  const [error, setError] = useState('');
  const [confirmDialog, setConfirmDialog] = useState({ 
    open: false, 
    action: null,
    type: null // 'delete', 'take', 'leave', 'evitar', 'volver', 'res_tomar', 'res_dejar', 'res_eliminar'
  });

  const { showToast } = useToast();
  const [downloading, setDownloading] = useState(false);
  const [showReporteFechas, setShowReporteFechas] = useState(false);
  const [fechaDesde, setFechaDesde] = useState('');
  const [fechaHasta, setFechaHasta] = useState('');

  // Estado para gestión inline de resultados
  const [editingResultadoId, setEditingResultadoId] = useState(null);
  const [editResultadoNombre, setEditResultadoNombre] = useState('');
  const [isCreatingResultado, setIsCreatingResultado] = useState(false);
  const [newResultadoNombre, setNewResultadoNombre] = useState('');
  const [savingResultado, setSavingResultado] = useState(false);

  if (!materia) return null;

  const handleEdit = () => {
    setFormData({
      nombre: materia.nombre,
      tipo: materia.tipo,
      instructorId: materia.instructorId || ''
    });
    setIsEditing(true);
    setError('');
  };

  const handleCancelEdit = () => {
    setIsEditing(false);
    setFormData({
      nombre: materia.nombre,
      tipo: materia.tipo,
      instructorId: materia.instructorId || ''
    });
    setError('');
  };

  const handleSave = async (e) => {
    e.preventDefault();
    
    if (!formData.nombre.trim()) {
      setError('El nombre es obligatorio');
      return;
    }

    try {
      setSaving(true);
      setError('');

      const isResultado = materia.competenciaId !== undefined;
      const endpoint = isResultado ? `/resultados/${materia.id}` : `/competencias/${materia.id}`;
      const response = await fetchApi(endpoint, {
        method: 'PUT',
        body: JSON.stringify(formData)
      });

      // El backend devuelve { resultado } para resultados y { competencia } para competencias
      let updatedData = response.resultado || response.competencia || response.materia;
      if (isAdmin && isResultado && formData.instructorId !== undefined) {
        const asignarRes = await fetchApi(`/resultados/${materia.id}/asignar-instructor`, {
          method: 'PUT',
          body: JSON.stringify({ instructorId: formData.instructorId })
        });
        const asignadoData = asignarRes.resultado || asignarRes;
        if (asignadoData) updatedData = { ...updatedData, ...asignadoData };
      }

      if (updatedData) {
        Object.assign(materia, updatedData);
      }

      setIsEditing(false);
      
      // Mostrar advertencia si hay conflictos
      if (response.conflictos) {
        setError(`⚠️ Actualización con conflictos: ${response.conflictos.message}`);
        setTimeout(() => {
          if (onUpdate) onUpdate();
          onClose();
        }, 2000);
      } else {
        if (onUpdate) await onUpdate();
        onClose();
      }
    } catch (err) {
      setError(err.message || 'Error al actualizar');
    } finally {
      setSaving(false);
    }
  };

  const handleSaveResultadoEdit = async (id) => {
    if (!editResultadoNombre.trim()) return;
    try {
      setSavingResultado(true);
      setError('');
      await fetchApi(`/resultados/${id}`, { method: 'PUT', body: JSON.stringify({ nombre: editResultadoNombre }) });
      setEditingResultadoId(null);
      if (onUpdate) await onUpdate();
    } catch (err) { setError(err.message); }
    finally { setSavingResultado(false); }
  };

  const handleCreateResultado = async (e) => {
    e.preventDefault();
    if (!newResultadoNombre.trim()) return;
    try {
      setSavingResultado(true);
      setError('');
      await fetchApi('/resultados', { method: 'POST', body: JSON.stringify({ competenciaId: materia.id, nombre: newResultadoNombre }) });
      setIsCreatingResultado(false);
      setNewResultadoNombre('');
      if (onUpdate) await onUpdate();
    } catch (err) { setError(err.message); }
    finally { setSavingResultado(false); }
  };

  const handleAccionResultado = (tipo, id) => {
    setConfirmDialog({
      open: true,
      type: `res_${tipo}`,
      action: async () => {
        try {
          setError('');
          if (tipo === 'tomar') await fetchApi(`/resultados/${id}/tomar`, { method: 'PUT' });
          if (tipo === 'dejar') await fetchApi(`/resultados/${id}/dejar`, { method: 'PUT' });
          if (tipo === 'eliminar') await fetchApi(`/resultados/${id}`, { method: 'DELETE' });
          if (onUpdate) await onUpdate();
        } catch (err) { setError(err.message); }
      }
    });
  };

  const handleDelete = async () => {
    setConfirmDialog({
      open: true,
      action: async () => {
        try {
          setDeleting(true);
          setError('');

          const isResultado = materia.competenciaId !== undefined;
          const endpoint = isResultado ? `/resultados/${materia.id}` : `/competencias/${materia.id}`;
          await fetchApi(endpoint, {
            method: 'DELETE'
          });

          if (onDelete) {
            await onDelete();
          }
          onClose();
        } catch (err) {
          setError(err.message || 'Error al eliminar');
          setDeleting(false);
        }
      },
      type: 'delete'
    });
  };

  const handleTakeMateria = async () => {
    setConfirmDialog({
      open: true,
      action: async () => {
        try {
          setTakingMateria(true);
          setError('');

          const response = await fetchApi(`/resultados/${materia.id}/tomar`, {
            method: 'PUT'
          });

          // Actualizar el objeto materia localmente
          materia.instructorId = currentUserId;
          materia.instructor = response.materia?.instructor || { id: currentUserId, fullName: 'Tú' };

          // Mostrar advertencia si hay conflictos
          if (response.conflictos) {
            setError(`⚠️ ${response.conflictos.message}`);
            setTakingMateria(false);
            setConfirmDialog({ open: false, action: null, type: null });
            // Mantener el modal abierto para que vean la advertencia
            setTimeout(() => {
              if (onUpdate) {
                onUpdate();
              }
            }, 3000);
          } else {
            if (onUpdate) {
              await onUpdate();
            }
            onClose();
          }
        } catch (err) {
          // Mostrar error detallado si hay conflictos
          const errorMsg = err.message || 'Error al tomar a cargo';
          setError(errorMsg);
          setTakingMateria(false);
          setConfirmDialog({ open: false, action: null, type: null });
        }
      },
      type: 'take'
    });
  };

  const handleLeaveMateria = async () => {
    setConfirmDialog({
      open: true,
      action: async () => {
        try {
          setLeavingMateria(true);
          setError('');

          await fetchApi(`/resultados/${materia.id}/dejar`, {
            method: 'PUT'
          });

          // Actualizar el objeto materia localmente
          materia.instructorId = null;
          materia.instructor = null;

          if (onUpdate) {
            await onUpdate();
          }
          onClose();
        } catch (err) {
          setError(err.message || 'Error al dejar el cargo');
          setLeavingMateria(false);
          setConfirmDialog({ open: false, action: null, type: null });
        }
      },
      type: 'leave'
    });
  };

  const handleDownloadReport = async (type) => {
    try {
      setDownloading(true);
      setError('');
      
      let url = '';
      let filename = '';
      
      const API_BASE = import.meta.env.VITE_API_URL || 'http://localhost:3000/api';
      
      if (materia.competenciaId === undefined) {
        // Es competencia
        url = `${API_BASE}/export/competencia/${materia.id}/consolidado`;
        filename = `Reporte_Competencia_${materia.nombre.substring(0,20)}_${new Date().toISOString().split('T')[0]}.xlsx`;
      } else {
        // Es resultado
        if (type === 'consolidado') {
          url = `${API_BASE}/export/resultado/${materia.id}/consolidado`;
          filename = `Consolidado_${materia.nombre.substring(0,20)}_${new Date().toISOString().split('T')[0]}.xlsx`;
        } else if (type === 'rango') {
          const params = new URLSearchParams();
          if (fechaDesde) params.append('desde', fechaDesde);
          if (fechaHasta) params.append('hasta', fechaHasta);
          url = `${API_BASE}/export/resultado/${materia.id}/rango?${params.toString()}`;
          filename = `Asistencia_${materia.nombre.substring(0,20)}_${fechaDesde || 'inicio'}_${fechaHasta || 'fin'}.csv`;
        }
      }

      showToast('Generando reporte...', 'info');
      
      const response = await fetch(url, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error || 'Error al generar reporte');
      }

      const blob = await response.blob();
      const objectUrl = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = objectUrl;
      
      // Try to get filename from content-disposition
      const disposition = response.headers.get('content-disposition');
      if (disposition && disposition.indexOf('attachment') !== -1) {
        const filenameRegex = /filename[^;=\n]*=((['"]).*?\2|[^;\n]*)/;
        const matches = filenameRegex.exec(disposition);
        if (matches != null && matches[1]) { 
          filename = matches[1].replace(/['"]/g, '');
        }
      }
      
      a.download = filename;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(objectUrl);
      document.body.removeChild(a);

      showToast('Reporte descargado exitosamente', 'success');
      setShowReporteFechas(false);
    } catch (err) {
      setError(err.message || 'Error descargando reporte');
      showToast('Error descargando reporte', 'error');
    } finally {
      setDownloading(false);
    }
  };

  const handleEvitarMateria = async () => {
    setConfirmDialog({
      open: true,
      action: async () => {
        try {
          setEvitandoMateria(true);
          setError('');

          const isResultado = materia.competenciaId !== undefined;
          const endpoint = isResultado 
            ? `/resultados-evitados/resultados/${materia.id}/evitar` 
            : `/resultados-evitados/competencias/${materia.id}/evitar-completa`;
          await fetchApi(endpoint, {
            method: 'POST'
          });

          if (onUpdate) {
            await onUpdate();
          }
          onClose();
        } catch (err) {
          setError(err.message || 'Error al evitar');
          setEvitandoMateria(false);
        }
      },
      type: 'evitar'
    });
  };

  const handleVolverATomarMateria = async () => {
    setConfirmDialog({
      open: true,
      action: async () => {
        try {
          setVolviendoATomarMateria(true);
          setError('');

          await fetchApi(`/resultados-evitados/resultados/${materia.id}/volver-a-tomar`, {
            method: 'DELETE'
          });

          if (onUpdate) {
            await onUpdate();
          }
          onClose();
        } catch (err) {
          setError(err.message || 'Error al volver a tomar');
          setVolviendoATomarMateria(false);
        }
      },
      type: 'volver'
    });
  };

  // Formatear horarios
  const horariosAgrupados = materia.horarios?.reduce((acc, horario) => {
    if (!acc[horario.dia]) {
      acc[horario.dia] = [];
    }
    acc[horario.dia].push(`${horario.horaInicio} - ${horario.horaFin}`);
    return acc;
  }, {});

  const horariosTexto = horariosAgrupados 
    ? Object.entries(horariosAgrupados).map(([dia, horas]) => `${dia} ${horas.join(', ')}`).join(', ')
    : 'Sin horarios asignados';

  return (
    <>
      <Modal open={open} onClose={onClose} title={materia?.competenciaId !== undefined ? "Información del Resultado" : "Información de la Competencia"} maxWidth="max-w-2xl">
      <div className="space-y-4 max-h-[70vh] overflow-y-auto pr-2">
        {error && (
          <div className="p-3 bg-red-50 dark:bg-red-900/20 rounded-xl">
            <p className="text-sm text-red-600 dark:text-red-400">{error}</p>
          </div>
        )}

        {isEditing ? (
          /* Modo Edición */
          <form onSubmit={handleSave} className="space-y-4">
            <div>
              <label className="input-label">Nombre</label>
              <input 
                required 
                className="input-field" 
                placeholder="Programación Orientada a Objetos"
                value={formData.nombre} 
                onChange={e => setFormData(prev => ({ ...prev, nombre: e.target.value }))}
                disabled={saving}
              />
            </div>

            {materia.competenciaId === undefined && (
              <div>
                <label className="input-label">Tipo</label>
                <select 
                  className="input-field" 
                  value={formData.tipo} 
                  onChange={e => setFormData(prev => ({ ...prev, tipo: e.target.value }))}
                  disabled={saving}
                >
                  <option>Técnica</option>
                  <option>Transversal</option>
                  <option>Básica</option>
                </select>
              </div>
            )}

            {/* Solo admin puede cambiar instructor — solo en resultados, no en competencias */}
            {isAdmin && materia.competenciaId !== undefined && (
              <div>
                <label className="input-label">Instructor a Cargo</label>
                <select 
                  className="input-field" 
                  value={formData.instructorId} 
                  onChange={e => setFormData(prev => ({ ...prev, instructorId: e.target.value }))}
                  disabled={saving}
                >
                  <option value="">Sin instructor asignado</option>
                  {instructores.map(inst => (
                    <option key={inst.id} value={inst.id}>
                      {inst.fullName}
                    </option>
                  ))}
                </select>
                <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                  Solo el administrador puede cambiar el instructor asignado
                </p>
              </div>
            )}

            <div className="flex flex-wrap gap-3  pt-2">
              <button 
                type="button" 
                onClick={handleCancelEdit} 
                className="btn-secondary flex-1"
                disabled={saving}
              >
                Cancelar
              </button>
              <button 
                type="submit" 
                disabled={saving}
                className="btn-primary flex-1 flex items-center justify-center gap-2"
              >
                {saving ? (
                  <>
                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    Guardando...
                  </>
                ) : (
                  'Guardar Cambios'
                )}
              </button>
            </div>
          </form>
        ) : (
          /* Modo Visualización */
          <>
            {/* Información de la materia */}
            <div className="space-y-3">
              {/* Nombre y Tipo */}
              {materia.competenciaId === undefined ? (
                <div className="p-4 bg-gradient-to-r from-blue-50 to-blue-100 dark:from-blue-900/20 dark:to-blue-800/20 rounded-xl border border-blue-200 dark:border-blue-800">
                  <div className="flex items-start gap-3">
                    <div className="w-12 h-12 rounded-xl bg-[#4285F4] flex items-center justify-center flex-shrink-0">
                      <BookOpen size={24} className="text-white" />
                    </div>
                    <div className="flex-1">
                      <h3 className="text-xl font-bold text-gray-900 dark:text-white dark:text-gray-100 mb-1">
                        {materia.nombre}
                      </h3>
                      <span className="inline-block px-3 py-1 bg-blue-100 dark:bg-blue-900/40 text-blue-700 dark:text-blue-300 text-xs font-semibold rounded-full">
                        {materia.tipo}
                      </span>
                    </div>
                  </div>
                </div>
              ) : (
                <div>
                  <h3 className="text-xl font-bold text-gray-900 dark:text-white dark:text-gray-100">
                    {materia.nombre}
                  </h3>
                </div>
              )}

              {/* Instructor (Solo para Resultados de Aprendizaje) */}
              {materia.competenciaId !== undefined && (
                <div className={`p-4 rounded-xl ${!materia.instructor ? 'bg-orange-50 dark:bg-orange-900/20 border border-orange-200 dark:border-orange-800' : 'bg-gray-50 dark:bg-gray-800'}`}>
                  <div className="flex items-center gap-2 mb-2">
                    <User size={16} className={!materia.instructor ? "text-orange-500" : "text-gray-500"} />
                    <p className={`text-xs font-semibold uppercase tracking-wide ${!materia.instructor ? 'text-orange-500 dark:text-orange-400' : 'text-gray-500 dark:text-gray-400'}`}>
                      Instructor a cargo
                    </p>
                  </div>
                  <p className={`text-base font-medium ${!materia.instructor ? 'text-orange-700 dark:text-orange-300' : 'text-gray-900 dark:text-gray-100'}`}>
                    {materia.instructor?.fullName || 'Sin instructor a cargo'}
                  </p>
                </div>
              )}

              {/* Competencia padre (Solo para Resultados) */}
              {materia.competenciaId !== undefined && (
                <div className="p-4 bg-gray-50 dark:bg-gray-800 rounded-xl">
                  <div className="flex items-center gap-2 mb-2">
                    <BookOpen size={16} className="text-gray-500" />
                    <p className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wide">
                      Pertenece a Competencia
                    </p>
                  </div>
                  <p className="text-base font-medium text-gray-900 dark:text-white  dark:text-gray-100">
                    {materia.competencia?.nombre || 'Desconocida'}
                  </p>
                </div>
              )}



              {/* Horarios (Solo para Resultados) */}
              {materia.competenciaId !== undefined && (
                <div className={`p-4 rounded-xl ${(!materia.horarios || materia.horarios.length === 0) ? 'bg-orange-50 dark:bg-orange-900/20 border border-orange-200 dark:border-orange-800' : 'bg-gray-50 dark:bg-gray-800'}`}>
                  <div className="flex items-center gap-2 mb-2">
                    <Clock size={16} className={(!materia.horarios || materia.horarios.length === 0) ? 'text-orange-500' : 'text-gray-500'} />
                    <p className={`text-xs font-semibold uppercase tracking-wide ${(!materia.horarios || materia.horarios.length === 0) ? 'text-orange-500 dark:text-orange-400' : 'text-gray-500 dark:text-gray-400'}`}>
                      Horarios
                    </p>
                  </div>
                  <p className={`text-sm ${(!materia.horarios || materia.horarios.length === 0) ? 'text-orange-700 dark:text-orange-300' : 'text-gray-700 dark:text-gray-300'}`}>
                    {horariosTexto}
                  </p>
                </div>
              )}

              {/* Resultados de Aprendizaje (Solo si es Competencia) */}
              {materia.competenciaId === undefined && (
                <div className="p-4 bg-gray-50 dark:bg-gray-800 rounded-xl">
                  <div className="flex items-center gap-2 mb-3">
                    <BookOpen size={16} className="text-gray-500" />
                    <p className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wide">
                      Resultados de Aprendizaje ({materia.resultados?.length || 0})
                    </p>
                  </div>
                  {materia.resultados?.length > 0 ? (
                    <ul className="list-disc pl-5 space-y-1">
                      {materia.resultados.map(r => (
                        <li key={r.id} className="text-sm font-medium text-gray-900 dark:text-gray-100">{r.nombre}</li>
                      ))}
                    </ul>
                  ) : (
                    <p className="text-sm text-gray-500 italic">No hay resultados registrados</p>
                  )}
                </div>
              )}
            </div>

            {/* Botones de acción */}
            {(isCreatorOrAdmin || (!isAprendizView && currentUserId) || isAprendizView) && (
              <div className="space-y-3 pt-4 border-t border-gray-100 dark:border-zinc-700  dark:border-gray-700">
                {/* Botones de reporte para instructores y admins */}
                {(!isAprendizView) && (
                  <div className="flex flex-wrap gap-3">
                    {materia.competenciaId === undefined ? (
                      <button 
                        onClick={() => handleDownloadReport('consolidado')}
                        disabled={downloading}
                        className="btn-secondary flex-1 flex items-center justify-center gap-2 text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-900/20 border-blue-200 dark:border-blue-800"
                      >
                        {downloading ? (
                          <Loader className="w-4 h-4 animate-spin" />
                        ) : (
                          <Download size={16} />
                        )}
                        Descargar Reporte
                      </button>
                    ) : (
                      <div className="w-full space-y-2">
                        {!showReporteFechas ? (
                          <div className="flex gap-2">
                            <button 
                              onClick={() => handleDownloadReport('consolidado')}
                              disabled={downloading}
                              className="btn-secondary flex-1 flex items-center justify-center gap-2 text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-900/20 border-blue-200 dark:border-blue-800"
                            >
                              {downloading ? <Loader className="w-4 h-4 animate-spin" /> : <BarChart size={16} />} Consolidado
                            </button>
                            <button 
                              onClick={() => setShowReporteFechas(true)}
                              className="btn-secondary flex-1 flex items-center justify-center gap-2 text-green-600 hover:bg-green-50 dark:hover:bg-green-900/20 border-green-200 dark:border-green-800"
                            >
                              <Calendar size={16} /> Por Fechas
                            </button>
                          </div>
                        ) : (
                          <div className="p-3 bg-gray-50 dark:bg-gray-800 rounded-lg space-y-3">
                            <p className="text-sm font-semibold text-gray-700 dark:text-gray-300">Descargar reporte por fechas:</p>
                            <div className="flex items-center gap-2">
                              <input 
                                type="date" 
                                value={fechaDesde} 
                                onChange={(e) => setFechaDesde(e.target.value)}
                                className="input-field py-1.5 text-sm"
                              />
                              <span className="text-gray-500 text-sm">a</span>
                              <input 
                                type="date" 
                                value={fechaHasta} 
                                onChange={(e) => setFechaHasta(e.target.value)}
                                className="input-field py-1.5 text-sm"
                              />
                            </div>
                            <div className="flex gap-2">
                              <button 
                                onClick={() => handleDownloadReport('rango')}
                                disabled={downloading}
                                className="btn-primary flex-1 flex items-center justify-center gap-2 py-1.5 text-sm bg-green-600 hover:bg-green-700"
                              >
                                {downloading ? <Loader className="w-4 h-4 animate-spin" /> : <Download size={14} />}
                                Descargar CSV
                              </button>
                              <button 
                                onClick={() => setShowReporteFechas(false)}
                                className="btn-secondary px-3 py-1.5 text-sm"
                              >
                                Cancelar
                              </button>
                            </div>
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                )}

                {/* Botones para aprendices (evitar/volver a tomar materia) */}
                {isAprendizView && (
                  <div className="flex flex-wrap gap-3 ">
                    {isMateriaEvitada ? (
                      <button 
                        onClick={handleVolverATomarMateria}
                        disabled={volviendoATomarMateria}
                        className="btn-primary flex-1 flex items-center justify-center gap-2 bg-green-600 hover:bg-green-700"
                      >
                        {volviendoATomarMateria ? (
                          <>
                            <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                            Procesando...
                          </>
                        ) : (
                          <>
                            <Eye size={16} />
                            Volver a tomar resultado
                          </>
                        )}
                      </button>
                    ) : (
                      <button 
                        onClick={handleEvitarMateria}
                        disabled={evitandoMateria}
                        className="btn-secondary flex-1 flex items-center justify-center gap-2 text-gray-700 hover:bg-gray-100 dark:hover:bg-gray-700"
                      >
                        {evitandoMateria ? (
                          <>
                            <div className="w-4 h-4 border-2 border-gray-600 border-t-transparent rounded-full animate-spin" />
                            Procesando...
                          </>
                        ) : (
                          <>
                            <EyeOff size={16} />
                            Evitar este resultado
                          </>
                        )}
                      </button>
                    )}
                  </div>
                )}

                {/* Botones para instructores (tomar/dejar materia) */}
                {canTakeMateria && materia.competenciaId !== undefined && (
                  <div className="flex flex-wrap gap-3 ">
                    {!materia.instructor ? (
                      <button 
                        onClick={handleTakeMateria}
                        disabled={takingMateria}
                        className="btn-primary flex-1 flex items-center justify-center gap-2"
                      >
                        {takingMateria ? (
                          <>
                            <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                            Procesando...
                          </>
                        ) : (
                          <>
                            <UserCheck size={16} />
                            Tomar a cargo
                          </>
                        )}
                      </button>
                    ) : (materia.instructorId === currentUserId) ? (
                      <button 
                        onClick={handleLeaveMateria}
                        disabled={leavingMateria}
                        className="btn-secondary flex-1 flex items-center justify-center gap-2 text-orange-600 hover:bg-orange-50 dark:hover:bg-orange-900/20 border-orange-200"
                      >
                        {leavingMateria ? (
                          <>
                            <div className="w-4 h-4 border-2 border-orange-600 border-t-transparent rounded-full animate-spin" />
                            Dejando...
                          </>
                        ) : (
                          <>
                            <UserMinus size={16} />
                            Dejar Cargo
                          </>
                        )}
                      </button>
                    ) : null}
                  </div>
                )}

                {/* Botones de edición/eliminación para creadores y admins */}
                {isCreatorOrAdmin && (
                  <div className="flex flex-wrap gap-3 ">
                    <button 
                      onClick={handleEdit}
                      className="btn-secondary flex-1 flex items-center justify-center gap-2"
                      disabled={deleting || takingMateria || leavingMateria}
                    >
                      <Edit2 size={16} />
                      Editar
                    </button>
                    <button 
                      onClick={handleDelete}
                      disabled={deleting || takingMateria || leavingMateria}
                      className="btn-secondary flex-1 flex items-center justify-center gap-2 text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 border-red-200"
                    >
                      {deleting ? (
                        <>
                          <div className="w-4 h-4 border-2 border-red-600 border-t-transparent rounded-full animate-spin" />
                          Eliminando...
                        </>
                      ) : (
                        <>
                          <Trash2 size={16} />
                          Enviar a Papelera
                        </>
                      )}
                    </button>
                  </div>
                )}
              </div>
            )}
          </>
        )}
      </div>
    </Modal>

    <ConfirmDialog
      open={confirmDialog.open}
      onClose={() => setConfirmDialog({ open: false, action: null, type: null })}
      onConfirm={confirmDialog.action}
      title={
        confirmDialog.type === 'res_tomar' ? "Tomar Cargo de Resultado" :
        confirmDialog.type === 'res_dejar' ? "Dejar Cargo de Resultado" :
        confirmDialog.type === 'res_eliminar' ? "Eliminar Resultado" :
        confirmDialog.type === 'take' ? "Tomar Cargo" :
        confirmDialog.type === 'leave' ? "Dejar Cargo" :
        confirmDialog.type === 'evitar' ? "Evitar Resultado" :
        confirmDialog.type === 'volver' ? "Volver a Tomar Resultado" :
        (materia.competenciaId !== undefined ? "Eliminar Resultado" : "Eliminar Competencia")
      }
      message={
        confirmDialog.type === 'res_tomar' ? "¿Estás seguro de tomar cargo de este resultado?" :
        confirmDialog.type === 'res_dejar' ? "¿Estás seguro de dejar el cargo de este resultado?" :
        confirmDialog.type === 'res_eliminar' ? "¿Estás seguro de eliminar este resultado?" :
        confirmDialog.type === 'take' ? `¿Estás seguro de tomar a cargo "${materia.nombre}"?` :
        confirmDialog.type === 'leave' ? `¿Estás seguro de dejar de estar a cargo de "${materia.nombre}"?` :
        confirmDialog.type === 'evitar' ? `¿Estás seguro de que deseas evitar "${materia.nombre}"? No recibirás asistencia.` :
        confirmDialog.type === 'volver' ? `¿Estás seguro de que deseas volver a tomar "${materia.nombre}"? Volverás a recibir asistencia.` :
        `¿Estás seguro de eliminar "${materia.nombre}"? Esta acción no se puede deshacer.`
      }
      confirmText={
        confirmDialog.type === 'res_tomar' ? "Tomar" :
        confirmDialog.type === 'res_dejar' ? "Dejar" :
        confirmDialog.type === 'res_eliminar' ? "Eliminar" :
        confirmDialog.type === 'take' ? "Tomar" :
        confirmDialog.type === 'leave' ? "Dejar" :
        confirmDialog.type === 'evitar' ? "Evitar" :
        confirmDialog.type === 'volver' ? "Volver a tomar" :
        "Eliminar"
      }
      cancelText="Cancelar"
      danger={confirmDialog.type === 'delete' || confirmDialog.type === 'evitar' || confirmDialog.type === 'res_dejar' || confirmDialog.type === 'res_eliminar'}
    />
  </>
  );
}
