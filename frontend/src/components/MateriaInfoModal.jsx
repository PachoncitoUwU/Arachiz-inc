import React, { useState } from 'react';
import Modal from './Modal';
import ConfirmDialog from './ConfirmDialog';
import fetchApi from '../services/api';
import { BookOpen, User, Clock, Edit2, Trash2, Loader, UserPlus, UserMinus } from 'lucide-react';

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
  isAprendizView = false
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
  const [error, setError] = useState('');
  const [confirmDialog, setConfirmDialog] = useState({ 
    open: false, 
    action: null,
    type: null // 'delete', 'take', 'leave'
  });

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
      setError('El nombre de la materia es obligatorio');
      return;
    }

    try {
      setSaving(true);
      setError('');

      const updatedMateria = await fetchApi(`/materias/${materia.id}`, {
        method: 'PUT',
        body: JSON.stringify(formData)
      });

      // Actualizar el objeto materia localmente
      Object.assign(materia, updatedMateria.materia);

      setIsEditing(false);
      if (onUpdate) {
        onUpdate();
      }
    } catch (err) {
      setError(err.message || 'Error al actualizar la materia');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    setConfirmDialog({
      open: true,
      action: async () => {
        try {
          setDeleting(true);
          setError('');

          await fetchApi(`/materias/${materia.id}`, {
            method: 'DELETE'
          });

          if (onDelete) {
            onDelete();
          }
          onClose();
        } catch (err) {
          setError(err.message || 'Error al eliminar la materia');
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

          await fetchApi(`/materias/${materia.id}/tomar`, {
            method: 'PUT'
          });

          // Actualizar el objeto materia localmente
          materia.instructorId = currentUserId;
          materia.instructor = { id: currentUserId, fullName: 'Tú' }; // Se actualizará con la respuesta real

          if (onUpdate) {
            onUpdate();
          }
          onClose();
        } catch (err) {
          setError(err.message || 'Error al tomar la materia');
          setTakingMateria(false);
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

          await fetchApi(`/materias/${materia.id}/dejar`, {
            method: 'PUT'
          });

          // Actualizar el objeto materia localmente
          materia.instructorId = null;
          materia.instructor = null;

          if (onUpdate) {
            onUpdate();
          }
          onClose();
        } catch (err) {
          setError(err.message || 'Error al dejar la materia');
          setLeavingMateria(false);
        }
      },
      type: 'leave'
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
      <Modal open={open} onClose={onClose} title="Información de la Materia" maxWidth="max-w-2xl">
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
              <label className="input-label">Nombre de la Materia</label>
              <input 
                required 
                className="input-field" 
                placeholder="Programación Orientada a Objetos"
                value={formData.nombre} 
                onChange={e => setFormData(prev => ({ ...prev, nombre: e.target.value }))}
                disabled={saving}
              />
            </div>

            <div>
              <label className="input-label">Tipo de Materia</label>
              <select 
                className="input-field" 
                value={formData.tipo} 
                onChange={e => setFormData(prev => ({ ...prev, tipo: e.target.value }))}
                disabled={saving}
              >
                <option>Técnica</option>
                <option>Transversal</option>
              </select>
            </div>

            {/* Solo admin puede cambiar instructor */}
            {isAdmin && (
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
                  Solo el administrador puede cambiar el instructor de una materia
                </p>
              </div>
            )}

            <div className="flex gap-3 pt-2">
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
              <div className="p-4 bg-gradient-to-r from-blue-50 to-blue-100 dark:from-blue-900/20 dark:to-blue-800/20 rounded-xl border border-blue-200 dark:border-blue-800">
                <div className="flex items-start gap-3">
                  <div className="w-12 h-12 rounded-xl bg-[#4285F4] flex items-center justify-center flex-shrink-0">
                    <BookOpen size={24} className="text-white" />
                  </div>
                  <div className="flex-1">
                    <h3 className="text-xl font-bold text-gray-900 dark:text-gray-100 mb-1">
                      {materia.nombre}
                    </h3>
                    <span className="inline-block px-3 py-1 bg-blue-100 dark:bg-blue-900/40 text-blue-700 dark:text-blue-300 text-xs font-semibold rounded-full">
                      {materia.tipo}
                    </span>
                  </div>
                </div>
              </div>

              {/* Instructor */}
              <div className={`p-4 rounded-xl ${!materia.instructor ? 'bg-orange-50 dark:bg-orange-900/20 border border-orange-200 dark:border-orange-800' : 'bg-gray-50 dark:bg-gray-800'}`}>
                <div className="flex items-center gap-2 mb-2">
                  <User size={16} className={!materia.instructor ? "text-orange-500" : "text-gray-500"} />
                  <p className={`text-xs font-semibold uppercase tracking-wide ${!materia.instructor ? 'text-orange-500 dark:text-orange-400' : 'text-gray-500 dark:text-gray-400'}`}>
                    Instructor
                  </p>
                </div>
                <p className={`text-base font-medium ${!materia.instructor ? 'text-orange-700 dark:text-orange-300' : 'text-gray-900 dark:text-gray-100'}`}>
                  {materia.instructor?.fullName || 'Sin instructor a cargo'}
                </p>
              </div>

              {/* Ficha - Solo visible para instructores */}
              {!isAprendizView && (
                <div className="p-4 bg-gray-50 dark:bg-gray-800 rounded-xl">
                  <div className="flex items-center gap-2 mb-2">
                    <BookOpen size={16} className="text-gray-500" />
                    <p className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wide">
                      Ficha
                    </p>
                  </div>
                  <p className="text-base font-medium text-gray-900 dark:text-gray-100">
                    {materia.ficha?.numero || 'No asignada'}
                  </p>
                </div>
              )}

              {/* Horarios */}
              <div className="p-4 bg-gray-50 dark:bg-gray-800 rounded-xl">
                <div className="flex items-center gap-2 mb-2">
                  <Clock size={16} className="text-gray-500" />
                  <p className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wide">
                    Horarios
                  </p>
                </div>
                <p className="text-sm text-gray-700 dark:text-gray-300">
                  {horariosTexto}
                </p>
              </div>
            </div>

            {/* Botones de acción */}
            {(isCreatorOrAdmin || (!isAprendizView && currentUserId)) && (
              <div className="space-y-3 pt-4 border-t border-gray-100 dark:border-gray-700">
                {/* Botones para instructores (tomar/dejar materia) */}
                {!isAprendizView && currentUserId && !isAdmin && (
                  <div className="flex gap-3">
                    {!materia.instructor ? (
                      <button 
                        onClick={handleTakeMateria}
                        disabled={takingMateria}
                        className="btn-primary flex-1 flex items-center justify-center gap-2"
                      >
                        {takingMateria ? (
                          <>
                            <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                            Tomando...
                          </>
                        ) : (
                          <>
                            <UserPlus size={16} />
                            Tomar a Cargo
                          </>
                        )}
                      </button>
                    ) : materia.instructorId === currentUserId ? (
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
                            Dejar Materia
                          </>
                        )}
                      </button>
                    ) : null}
                  </div>
                )}

                {/* Botones de edición/eliminación para creadores y admins */}
                {isCreatorOrAdmin && (
                  <div className="flex gap-3">
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
        confirmDialog.type === 'take' ? "Tomar Materia" :
        confirmDialog.type === 'leave' ? "Dejar Materia" :
        "Eliminar Materia"
      }
      message={
        confirmDialog.type === 'take' ? `¿Estás seguro de tomar a cargo la materia "${materia.nombre}"?` :
        confirmDialog.type === 'leave' ? `¿Estás seguro de dejar de estar a cargo de la materia "${materia.nombre}"?` :
        `¿Estás seguro de eliminar la materia "${materia.nombre}"? Esta acción no se puede deshacer.`
      }
      confirmText={
        confirmDialog.type === 'take' ? "Tomar" :
        confirmDialog.type === 'leave' ? "Dejar" :
        "Eliminar"
      }
      cancelText="Cancelar"
      danger={confirmDialog.type === 'delete'}
    />
  </>
  );
}
