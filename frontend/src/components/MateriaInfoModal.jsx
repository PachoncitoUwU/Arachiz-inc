import React, { useState } from 'react';
import Modal from './Modal';
import fetchApi from '../services/api';
import { BookOpen, User, Clock, Edit2, Trash2, Loader } from 'lucide-react';

export default function MateriaInfoModal({ 
  open, 
  onClose, 
  materia, 
  isCreatorOrAdmin,
  onUpdate,
  onDelete 
}) {
  const [isEditing, setIsEditing] = useState(false);
  const [formData, setFormData] = useState({
    nombre: materia?.nombre || '',
    tipo: materia?.tipo || 'Técnica'
  });
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [error, setError] = useState('');

  if (!materia) return null;

  const handleEdit = () => {
    setFormData({
      nombre: materia.nombre,
      tipo: materia.tipo
    });
    setIsEditing(true);
    setError('');
  };

  const handleCancelEdit = () => {
    setIsEditing(false);
    setFormData({
      nombre: materia.nombre,
      tipo: materia.tipo
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

      await fetchApi(`/materias/${materia.id}`, {
        method: 'PUT',
        body: JSON.stringify(formData)
      });

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
    if (!confirm(`¿Estás seguro de eliminar la materia "${materia.nombre}"? Esta acción no se puede deshacer.`)) {
      return;
    }

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
                    <Loader size={16} className="animate-spin" />
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
              <div className="p-4 bg-gray-50 dark:bg-gray-800 rounded-xl">
                <div className="flex items-center gap-2 mb-2">
                  <User size={16} className="text-gray-500" />
                  <p className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wide">
                    Instructor
                  </p>
                </div>
                <p className="text-base font-medium text-gray-900 dark:text-gray-100">
                  {materia.instructor?.fullName || 'No asignado'}
                </p>
              </div>

              {/* Ficha */}
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
            {isCreatorOrAdmin && (
              <div className="flex gap-3 pt-4 border-t border-gray-100 dark:border-gray-700">
                <button 
                  onClick={handleEdit}
                  className="btn-secondary flex-1 flex items-center justify-center gap-2"
                  disabled={deleting}
                >
                  <Edit2 size={16} />
                  Editar
                </button>
                <button 
                  onClick={handleDelete}
                  disabled={deleting}
                  className="btn-secondary flex-1 flex items-center justify-center gap-2 text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 border-red-200"
                >
                  {deleting ? (
                    <>
                      <Loader size={16} className="animate-spin" />
                      Eliminando...
                    </>
                  ) : (
                    <>
                      <Trash2 size={16} />
                      Eliminar
                    </>
                  )}
                </button>
              </div>
            )}
          </>
        )}
      </div>
    </Modal>
  );
}
