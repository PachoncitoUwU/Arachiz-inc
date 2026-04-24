import React, { useState, useEffect } from 'react';
import { X, UserCheck, Search, CheckCircle, Loader, Grid, List, Users } from 'lucide-react';
import fetchApi from '../services/api';
import { useToast } from '../context/ToastContext';

export default function ImprovedManualAttendance({ asistenciaId, aprendices, alreadyRegistered, onClose, onRegistered }) {
  const { showToast } = useToast();
  const [searchTerm, setSearchTerm] = useState('');
  const [registering, setRegistering] = useState(new Set());
  const [registered, setRegistered] = useState(new Set());
  const [selected, setSelected] = useState(new Set());
  const [viewMode, setViewMode] = useState('grid'); // 'grid' o 'list'
  const [registeringBatch, setRegisteringBatch] = useState(false);

  // Filtrar aprendices que no están registrados
  const availableAprendices = aprendices.filter(a => !alreadyRegistered.has(a.id) && !registered.has(a.id));

  // Filtrar por búsqueda
  const filteredAprendices = availableAprendices.filter(a =>
    a.fullName.toLowerCase().includes(searchTerm.toLowerCase()) ||
    a.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
    a.document.includes(searchTerm)
  );

  // Atajos de teclado
  useEffect(() => {
    const handleKeyDown = (e) => {
      // Ctrl+A: Seleccionar todos los filtrados
      if (e.ctrlKey && e.key === 'a') {
        e.preventDefault();
        const newSelected = new Set(filteredAprendices.map(a => a.id));
        setSelected(newSelected);
        showToast(`${newSelected.size} aprendices seleccionados`, 'info');
      }
      
      // Ctrl+Enter: Registrar seleccionados
      if (e.ctrlKey && e.key === 'Enter') {
        e.preventDefault();
        if (selected.size > 0) {
          handleBatchRegister();
        }
      }
      
      // Escape: Limpiar selección
      if (e.key === 'Escape') {
        if (selected.size > 0) {
          setSelected(new Set());
          showToast('Selección limpiada', 'info');
        } else {
          onClose();
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [filteredAprendices, selected]);

  const handleRegister = async (aprendiz) => {
    setRegistering(prev => new Set([...prev, aprendiz.id]));
    
    try {
      await fetchApi('/asistencias/manual-register', {
        method: 'POST',
        body: JSON.stringify({
          asistenciaId,
          aprendizId: aprendiz.id
        })
      });

      setRegistered(prev => new Set([...prev, aprendiz.id]));
      setSelected(prev => {
        const newSet = new Set(prev);
        newSet.delete(aprendiz.id);
        return newSet;
      });
      showToast(`✓ ${aprendiz.fullName}`, 'success');
      
      if (onRegistered) {
        onRegistered(aprendiz);
      }
    } catch (error) {
      showToast(error.message, 'error');
    } finally {
      setRegistering(prev => {
        const newSet = new Set(prev);
        newSet.delete(aprendiz.id);
        return newSet;
      });
    }
  };

  const handleBatchRegister = async () => {
    if (selected.size === 0) return;
    
    setRegisteringBatch(true);
    const selectedAprendices = filteredAprendices.filter(a => selected.has(a.id));
    
    showToast(`Registrando ${selectedAprendices.length} aprendices...`, 'info');
    
    // Registrar en paralelo
    const promises = selectedAprendices.map(aprendiz =>
      fetchApi('/asistencias/manual-register', {
        method: 'POST',
        body: JSON.stringify({
          asistenciaId,
          aprendizId: aprendiz.id
        })
      }).then(() => aprendiz).catch(() => null)
    );

    const results = await Promise.all(promises);
    const successful = results.filter(Boolean);
    
    successful.forEach(aprendiz => {
      setRegistered(prev => new Set([...prev, aprendiz.id]));
      if (onRegistered) {
        onRegistered(aprendiz);
      }
    });

    setSelected(new Set());
    setRegisteringBatch(false);
    showToast(`✓ ${successful.length} aprendices registrados`, 'success');
  };

  const toggleSelect = (aprendizId) => {
    setSelected(prev => {
      const newSet = new Set(prev);
      if (newSet.has(aprendizId)) {
        newSet.delete(aprendizId);
      } else {
        newSet.add(aprendizId);
      }
      return newSet;
    });
  };

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-2 sm:p-4">
      <div className="bg-white dark:bg-gray-900 rounded-2xl shadow-2xl max-w-5xl w-full max-h-[90vh] flex flex-col animate-scale-in">
        {/* Header */}
        <div className="flex items-center justify-between p-4 sm:p-6 border-b border-gray-100 dark:border-gray-800">
          <div className="flex items-center gap-3 flex-1 min-w-0">
            <div className="w-10 h-10 rounded-xl bg-[#34A853] flex items-center justify-center flex-shrink-0">
              <UserCheck size={20} className="text-white" />
            </div>
            <div className="min-w-0">
              <h2 className="font-bold text-gray-900 dark:text-white truncate">Registro Manual Mejorado</h2>
              <p className="text-xs text-gray-400">
                {selected.size > 0 ? `${selected.size} seleccionados` : 'Selecciona aprendices para registrar'}
              </p>
            </div>
          </div>
          <button onClick={onClose} className="btn-icon hover:bg-gray-100 dark:hover:bg-gray-800 ml-2 flex-shrink-0">
            <X size={18} />
          </button>
        </div>

        {/* Search and Controls */}
        <div className="p-4 border-b border-gray-100 dark:border-gray-800 space-y-3">
          <div className="flex flex-col sm:flex-row gap-3">
            <div className="relative flex-1">
              <Search size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
              <input
                type="text"
                placeholder="Buscar por nombre, email o documento..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="input-field pl-10 w-full"
                autoFocus
              />
            </div>
            <div className="flex gap-2">
              <button
                onClick={() => setViewMode('grid')}
                className={`px-3 py-2 rounded-lg text-sm font-medium transition-all ${
                  viewMode === 'grid'
                    ? 'bg-[#4285F4] text-white'
                    : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                }`}
              >
                <Grid size={16} />
              </button>
              <button
                onClick={() => setViewMode('list')}
                className={`px-3 py-2 rounded-lg text-sm font-medium transition-all ${
                  viewMode === 'list'
                    ? 'bg-[#4285F4] text-white'
                    : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                }`}
              >
                <List size={16} />
              </button>
            </div>
          </div>

          {/* Batch Actions */}
          {selected.size > 0 && (
            <div className="flex items-center justify-between p-3 bg-blue-50 dark:bg-blue-900/20 rounded-xl">
              <span className="text-sm font-medium text-blue-700 dark:text-blue-300">
                {selected.size} aprendice{selected.size !== 1 ? 's' : ''} seleccionado{selected.size !== 1 ? 's' : ''}
              </span>
              <div className="flex gap-2">
                <button
                  onClick={() => setSelected(new Set())}
                  className="px-3 py-1.5 text-xs font-medium text-blue-600 hover:bg-blue-100 rounded-lg transition-colors"
                >
                  Limpiar
                </button>
                <button
                  onClick={handleBatchRegister}
                  disabled={registeringBatch}
                  className="px-4 py-1.5 text-xs font-medium bg-[#34A853] text-white rounded-lg hover:bg-green-600 transition-colors disabled:opacity-50 flex items-center gap-2"
                >
                  {registeringBatch ? (
                    <>
                      <Loader size={14} className="animate-spin" />
                      Registrando...
                    </>
                  ) : (
                    <>
                      <CheckCircle size={14} />
                      Registrar Seleccionados
                    </>
                  )}
                </button>
              </div>
            </div>
          )}

          {/* Keyboard Shortcuts */}
          <div className="flex flex-wrap gap-2 text-xs text-gray-500">
            <span className="px-2 py-1 bg-gray-100 dark:bg-gray-800 rounded">Ctrl+A: Seleccionar todos</span>
            <span className="px-2 py-1 bg-gray-100 dark:bg-gray-800 rounded">Ctrl+Enter: Registrar</span>
            <span className="px-2 py-1 bg-gray-100 dark:bg-gray-800 rounded">Esc: Limpiar/Cerrar</span>
          </div>
        </div>

        {/* List */}
        <div className="flex-1 overflow-y-auto p-4">
          {filteredAprendices.length === 0 ? (
            <div className="text-center py-12">
              <Users size={48} className="mx-auto text-gray-300 mb-3" />
              <p className="text-gray-500 font-medium">
                {availableAprendices.length === 0
                  ? '✓ Todos los aprendices registrados'
                  : 'No se encontraron aprendices'}
              </p>
            </div>
          ) : viewMode === 'grid' ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
              {filteredAprendices.map((aprendiz) => {
                const isRegistering = registering.has(aprendiz.id);
                const isSelected = selected.has(aprendiz.id);
                
                return (
                  <div
                    key={aprendiz.id}
                    onClick={() => toggleSelect(aprendiz.id)}
                    className={`flex flex-col items-center p-4 rounded-xl border-2 transition-all cursor-pointer ${
                      isSelected
                        ? 'border-[#4285F4] bg-blue-50 dark:bg-blue-900/20'
                        : 'border-gray-200 dark:border-gray-700 hover:border-[#34A853] hover:bg-green-50 dark:hover:bg-green-900/20'
                    } ${isRegistering ? 'opacity-50 cursor-not-allowed' : ''}`}
                  >
                    <div className="w-16 h-16 rounded-full bg-gradient-to-br from-[#34A853] to-[#0F9D58] flex items-center justify-center text-white font-bold text-lg mb-3">
                      {aprendiz.fullName.split(' ').map(n => n[0]).slice(0, 2).join('').toUpperCase()}
                    </div>
                    <p className="font-semibold text-gray-900 dark:text-white text-center mb-1">
                      {aprendiz.fullName}
                    </p>
                    <p className="text-xs text-gray-500 text-center mb-2">{aprendiz.email}</p>
                    <p className="text-xs text-gray-400">{aprendiz.document}</p>
                    
                    {isRegistering && (
                      <Loader size={16} className="text-[#34A853] animate-spin mt-2" />
                    )}
                    {isSelected && !isRegistering && (
                      <CheckCircle size={16} className="text-[#4285F4] mt-2" />
                    )}
                  </div>
                );
              })}
            </div>
          ) : (
            <div className="space-y-2">
              {filteredAprendices.map((aprendiz) => {
                const isRegistering = registering.has(aprendiz.id);
                const isSelected = selected.has(aprendiz.id);
                
                return (
                  <div
                    key={aprendiz.id}
                    onClick={() => toggleSelect(aprendiz.id)}
                    className={`flex items-center gap-3 p-3 rounded-xl border-2 transition-all cursor-pointer ${
                      isSelected
                        ? 'border-[#4285F4] bg-blue-50 dark:bg-blue-900/20'
                        : 'border-gray-200 dark:border-gray-700 hover:border-[#34A853] hover:bg-green-50 dark:hover:bg-green-900/20'
                    } ${isRegistering ? 'opacity-50 cursor-not-allowed' : ''}`}
                  >
                    <div className="w-12 h-12 rounded-full bg-gradient-to-br from-[#34A853] to-[#0F9D58] flex items-center justify-center text-white font-bold text-sm shrink-0">
                      {aprendiz.fullName.split(' ').map(n => n[0]).slice(0, 2).join('').toUpperCase()}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-semibold text-gray-900 dark:text-white truncate">
                        {aprendiz.fullName}
                      </p>
                      <p className="text-xs text-gray-500 truncate">{aprendiz.email}</p>
                      <p className="text-xs text-gray-400">{aprendiz.document}</p>
                    </div>
                    
                    {isRegistering ? (
                      <Loader size={18} className="text-[#34A853] animate-spin shrink-0" />
                    ) : isSelected ? (
                      <CheckCircle size={18} className="text-[#4285F4] shrink-0" />
                    ) : (
                      <div className="w-5 h-5 rounded-full border-2 border-gray-300 shrink-0" />
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-gray-100 dark:border-gray-800 bg-gray-50 dark:bg-gray-800/50">
          <div className="flex items-center justify-between text-sm">
            <span className="text-gray-500">
              {availableAprendices.length} pendiente{availableAprendices.length !== 1 ? 's' : ''} · {registered.size} registrado{registered.size !== 1 ? 's' : ''}
            </span>
            <button onClick={onClose} className="btn-secondary text-sm">
              Cerrar
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
