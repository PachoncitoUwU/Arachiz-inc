import React, { useState, useEffect } from 'react';
import Modal from './Modal';
import ConfirmDialog from './ConfirmDialog';
import fetchApi from '../services/api';
import { BookOpen, Loader, AlertCircle } from 'lucide-react';

export default function MateriasEvitadasModal({ 
  open, 
  onClose, 
  aprendiz, 
  fichaId,
  materias,
  onUpdate 
}) {
  const [resultadosEvitadosIds, setResultadosEvitadosIds] = useState([]);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [hasChanges, setHasChanges] = useState(false);
  const [showConfirmClose, setShowConfirmClose] = useState(false);
  const [initialMateriasEvitadas, setInitialMateriasEvitadas] = useState([]);

  // Flatten results from competencies passed in materias prop
  const flatResultados = [];
  (materias || []).forEach(comp => {
    if (comp.resultados && comp.resultados.length > 0) {
      comp.resultados.forEach(res => {
        flatResultados.push({
          id: res.id,
          nombre: `${comp.nombre} – ${res.nombre}`,
          tipo: comp.tipo,
          instructor: res.instructor
        });
      });
    } else {
      // Fallback
      flatResultados.push({
        id: comp.id,
        nombre: comp.nombre,
        tipo: comp.tipo || 'Técnica',
        instructor: comp.instructor
      });
    }
  });

  useEffect(() => {
    if (open && aprendiz) {
      loadMateriasEvitadas();
    }
  }, [open, aprendiz]);

  useEffect(() => {
    // Detectar cambios comparando con el estado inicial
    const changed = JSON.stringify(resultadosEvitadosIds.sort()) !== JSON.stringify(initialMateriasEvitadas.sort());
    setHasChanges(changed);
  }, [resultadosEvitadosIds, initialMateriasEvitadas]);

  const loadMateriasEvitadas = async () => {
    try {
      setLoading(true);
      setError('');
      
      if (aprendiz.resultadosEvitados) {
        const ids = aprendiz.resultadosEvitados.map(re => re.resultadoId);
        setResultadosEvitadosIds(ids);
        setInitialMateriasEvitadas(ids);
      } else {
        setResultadosEvitadosIds([]);
        setInitialMateriasEvitadas([]);
      }
      setHasChanges(false);
    } catch (err) {
      setError(err.message || 'Error al cargar resultados evitados');
    } finally {
      setLoading(false);
    }
  };

  const handleToggleMateria = (resultadoId) => {
    setResultadosEvitadosIds(prev => {
      if (prev.includes(resultadoId)) {
        return prev.filter(id => id !== resultadoId);
      } else {
        return [...prev, resultadoId];
      }
    });
  };

  const handleClose = () => {
    if (hasChanges) {
      setShowConfirmClose(true);
    } else {
      onClose();
    }
  };

  const confirmClose = () => {
    setShowConfirmClose(false);
    onClose();
  };

  const handleSave = async () => {
    try {
      setSaving(true);
      setError('');

      // Validar que al menos un resultado de aprendizaje quede activo
      if (resultadosEvitadosIds.length >= flatResultados.length) {
        setError('El aprendiz debe participar en al menos un resultado de aprendizaje');
        return;
      }

      await fetchApi(`/resultados-evitados/fichas/${fichaId}/aprendices/${aprendiz.id}/resultados-evitados`, {
        method: 'PUT',
        body: JSON.stringify({ resultadosEvitadosIds })
      });

      if (onUpdate) {
        onUpdate();
      }
      onClose();
    } catch (err) {
      setError(err.message || 'Error al guardar resultados evitados');
    } finally {
      setSaving(false);
    }
  };

  if (!aprendiz) return null;

  const materiasActivas = flatResultados.length - resultadosEvitadosIds.length;

  return (
    <>
      <Modal open={open} onClose={handleClose} title="Gestionar Materias Evitadas" maxWidth="max-w-lg">
        <div className="space-y-4 max-h-[70vh] overflow-y-auto pr-2">
          {/* Info del aprendiz */}
          <div className="p-3 bg-blue-50 dark:bg-blue-900/20 rounded-xl">
            <p className="text-sm text-gray-600 dark:text-gray-400">
              Configurando materias para
            </p>
            <p className="text-base font-bold text-gray-900 dark:text-white  dark:text-gray-100">
              {aprendiz.fullName}
            </p>
          </div>

          {error && (
            <div className="p-3 bg-red-50 dark:bg-red-900/20 rounded-xl flex items-start gap-2">
              <AlertCircle size={16} className="text-red-500 mt-0.5 flex-shrink-0" />
              <p className="text-sm text-red-600 dark:text-red-400">{error}</p>
            </div>
          )}

          {/* Instrucciones */}
          <div className="p-3 bg-gray-50 dark:bg-gray-800 rounded-xl">
            <p className="text-sm text-gray-600 dark:text-gray-400">
              Marca las materias que el aprendiz <strong>NO</strong> cursará. 
              Las materias no marcadas son aquellas en las que el aprendiz participará normalmente.
            </p>
            <p className="text-xs text-gray-500 dark:text-gray-500 mt-2">
              Materias activas: <strong className="text-[#34A853]">{materiasActivas}</strong> de {flatResultados.length}
            </p>
          </div>

          {/* Lista de materias */}
          {loading ? (
            <div className="flex items-center justify-center py-8">
              <Loader size={24} className="animate-spin text-[#4285F4]" />
            </div>
          ) : (
            <div className="space-y-2">
              {flatResultados.map(materia => {
                const isEvitada = resultadosEvitadosIds.includes(materia.id);
                return (
                  <label 
                    key={materia.id}
                    className={`flex items-center gap-3 p-3 rounded-xl border-2 cursor-pointer transition-all ${
                      isEvitada 
                        ? 'border-red-200 bg-red-50 dark:bg-red-900/20' 
                        : 'border-green-200 bg-green-50 dark:bg-green-900/20'
                    }`}
                  >
                    <input
                      type="checkbox"
                      checked={isEvitada}
                      onChange={() => handleToggleMateria(materia.id)}
                      className="w-5 h-5 rounded border-gray-300 text-[#4285F4] focus:ring-[#4285F4] cursor-pointer"
                    />
                    <div className="flex-1">
                      <div className="flex items-center gap-2">
                        <BookOpen size={16} className={isEvitada ? 'text-red-500' : 'text-green-600'} />
                        <p className="text-sm font-medium text-gray-800 dark:text-gray-200">
                          {materia.nombre}
                        </p>
                      </div>
                      <p className="text-xs text-gray-500 dark:text-gray-400 ml-6">
                        {materia.tipo} {materia.instructor ? `· ${materia.instructor.fullName}` : ''}
                      </p>
                    </div>
                    <span className={`text-xs font-semibold px-2 py-1 rounded ${
                      isEvitada 
                        ? 'bg-red-100 text-red-600 dark:bg-red-900/40 dark:text-red-400' 
                        : 'bg-green-100 text-green-600 dark:bg-green-900/40 dark:text-green-400'
                    }`}>
                      {isEvitada ? 'Evitada' : 'Activa'}
                    </span>
                  </label>
                );
              })}
            </div>
          )}

          {/* Botones */}
          <div className="flex flex-wrap gap-3  pt-2">
            <button 
              type="button" 
              onClick={handleClose} 
              className="btn-secondary flex-1"
              disabled={saving}
            >
              Cancelar
            </button>
            <button 
              type="button" 
              onClick={handleSave} 
              disabled={saving || loading}
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
        </div>
      </Modal>

      {/* Modal de confirmación para cerrar con cambios sin guardar */}
      <ConfirmDialog
        open={showConfirmClose}
        onClose={() => setShowConfirmClose(false)}
        onConfirm={confirmClose}
        title="¿Descartar cambios?"
        message="Tienes cambios sin guardar. ¿Estás seguro de que deseas cerrar sin guardar?"
        confirmText="Descartar"
        cancelText="Continuar editando"
        danger={true}
      />
    </>
  );
}
