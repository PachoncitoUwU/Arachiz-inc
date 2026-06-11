import React, { useState } from 'react';

export default function FichaForm({ 
  form, 
  onChange, 
  onSubmit, 
  onCancel, 
  saving, 
  error, 
  isEdit, 
  canEditNumero = false, 
  initialForm = null 
}) {
  const [showConfirmCancel, setShowConfirmCancel] = useState(false);

  // Determinar si hay cambios sin guardar
  const isDirty = initialForm 
    ? JSON.stringify(form) !== JSON.stringify(initialForm) 
    : false;

  const handleCancelClick = () => {
    if (isDirty) {
      setShowConfirmCancel(true);
    } else {
      onCancel();
    }
  };

  return (
    <div className="relative">
      {showConfirmCancel && (
        <div className="absolute inset-0 bg-white/95 dark:bg-zinc-900/95 flex flex-col items-center justify-center p-6 rounded-xl border border-gray-200 dark:border-zinc-700 z-50 animate-fade-in text-center">
          <p className="text-base font-semibold text-gray-900 dark:text-white mb-4">
            Tienes cambios sin guardar.<br />¿Estás seguro de que quieres salir?
          </p>
          <div className="flex gap-3 w-full max-w-xs">
            <button 
              type="button" 
              onClick={() => setShowConfirmCancel(false)} 
              className="btn-secondary text-sm flex-1"
            >
              Quedarme
            </button>
            <button 
              type="button" 
              onClick={onCancel} 
              className="btn-primary bg-red-600 hover:bg-red-700 border-red-600 text-white text-sm flex-1"
            >
              Salir sin guardar
            </button>
          </div>
        </div>
      )}

      <form onSubmit={onSubmit} className="space-y-4">
        {error && <p className="text-sm text-red-500 bg-red-50 px-3 py-2 rounded-xl">{error}</p>}
        <div>
          <label className="input-label">Número de Ficha</label>
          <input 
            required 
            type="number" 
            className="input-field" 
            placeholder="3146013"
            value={form.numero} 
            onChange={e => onChange('numero', e.target.value)} 
            disabled={isEdit && !canEditNumero}
          />
        </div>
        <div>
          <label className="input-label">Nombre del Programa</label>
          <input required className="input-field" placeholder="Análisis y Desarrollo de Software"
            value={form.nombre} onChange={e => onChange('nombre', e.target.value)}/>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <div>
            <label className="input-label">Nivel</label>
            <select className="input-field" value={form.nivel} onChange={e => onChange('nivel', e.target.value)}>
              <option>Técnico</option><option>Tecnólogo</option>
            </select>
          </div>
          <div>
            <label className="input-label">Jornada</label>
            <select className="input-field" value={form.jornada} onChange={e => onChange('jornada', e.target.value)}>
              <option>Mañana</option><option>Tarde</option><option>Noche</option>
            </select>
          </div>
        </div>
        <div>
          <label className="input-label">Centro de Formación</label>
          <input required className="input-field" placeholder="CTPI Ibagué"
            value={form.centro} onChange={e => onChange('centro', e.target.value)}/>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <div>
            <label className="input-label">Región</label>
            <input required className="input-field" placeholder="Tolima"
              value={form.region} onChange={e => onChange('region', e.target.value)}/>
          </div>
          <div>
            <label className="input-label">Duración (meses)</label>
            <input required type="number" min="1" max="30" className="input-field" placeholder="24"
              value={form.duracion} onChange={e => onChange('duracion', e.target.value)}/>
            <p className="text-xs text-gray-400 mt-1">Máximo 30 meses</p>
          </div>
        </div>
        
        {/* Nuevos campos de Fecha de Inicio y Fecha de Fin */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <div>
            <label className="input-label">Fecha de Inicio (opcional)</label>
            <input type="date" className="input-field" value={form.fechaInicio || ''} onChange={e => onChange('fechaInicio', e.target.value)} />
            <p className="text-xs text-gray-400 mt-1">Si no se asigna, la ficha no tendrá fecha de inicio</p>
          </div>
          <div>
            <label className="input-label">Fecha de Fin (opcional)</label>
            <input type="date" className="input-field" value={form.fechaFin || ''} onChange={e => onChange('fechaFin', e.target.value)} />
            <p className="text-xs text-gray-400 mt-1">Si no se asigna, la ficha no tendrá fecha de fin</p>
          </div>
        </div>

        <div className="flex flex-wrap gap-3 pt-2">
          <button type="button" onClick={handleCancelClick} className="btn-secondary text-sm md:text-base flex-1">Cancelar</button>
          <button type="submit" disabled={saving} className="btn-primary text-sm md:text-base flex-1">
            {saving ? 'Guardando...' : isEdit ? 'Guardar Cambios' : 'Crear Ficha'}
          </button>
        </div>
      </form>
    </div>
  );
}
