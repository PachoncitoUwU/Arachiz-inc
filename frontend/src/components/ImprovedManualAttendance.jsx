import React, { useState, useEffect, useRef } from 'react';
import { 
  X, 
  UserCheck, 
  Search, 
  CheckCircle, 
  Loader, 
  Users,
  Filter,
  SortAsc,
  Grid,
  List,
  Zap
} from 'lucide-react';
import fetchApi from '../services/api';
import { useToast } from '../context/ToastContext';

export default function ImprovedManualAttendance({ 
  asistenciaId, 
  aprendices, 
  alreadyRegistered, 
  onClose, 
  onRegistered 
}) {
  const { showToast } = useToast();
  const [searchTerm, setSearchTerm] = useState('');
  const [registering, setRegistering] = useState(new Set());
  const [registered, setRegistered] = useState(new Set());
  const [viewMode, setViewMode] = useState('grid'); // 'grid' | 'list'
  const [sortBy, setSortBy] = useState('name'); // 'name' | 'recent'
  const [selectedIds, setSelectedIds] = useState(new Set());
  const [bulkRegistering, setBulkRegistering] = useState(false);
  const searchInputRef = useRef(null);

  // Auto-focus en el buscador
  useEffect(() => {
    searchInputRef.current?.focus();
  }, []);

  // Filtrar aprendices disponibles
  const availableAprendices = aprendices.filter(a => 
    !alreadyRegistered.has(a.id) && !registered.has(a.id)
  );

  // Aplicar filtros y ordenamiento
  const filteredAprendices = availableAprendices
    .filter(a =>
      a.fullName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      a.email.toLowerCase().includes(searchTerm.toLowerCase())
    )
    .sort((a, b) => {
      if (sortBy === 'name') {
        return a.fullName.localeCompare(b.fullName);
      }
      return 0; // Por ahora solo ordenamiento por nombre
    });

  // Registro individual
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

  // Registro masivo
  const handleBulkRegister = async () => {
    if (selectedIds.size === 0) return;
    
    setBulkRegistering(true);
    const selectedAprendices = filteredAprendices.filter(a => selectedIds.has(a.id));
    
    try {
      // Registrar todos en paralelo
      const promises = selectedAprendices.map(aprendiz =>
        fetchApi('/asistencias/manual-register', {
          method: 'POST',
          body: JSON.stringify({
            asistenciaId,
            aprendizId: aprendiz.id
          })
        }).then(() => aprendiz).catch(err => ({ error: err.message, aprendiz }))
      );

      const results = await Promise.all(promises);
      
      let successCount = 0;
      results.forEach(result => {
        if (!result.error) {
          setRegistered(prev => new Set([...prev, result.id]));
          if (onRegistered) onRegistered(result);
          successCount++;
        }
      });

      showToast(`✓ ${successCount} aprendices registrados`, 'success');
      setSelectedIds(new Set());
      
    } catch (error) {
      showToast('Error en registro masivo', 'error');
    } finally {
      setBulkRegistering(false);
    }
  };

  // Toggle selección
  const toggleSelection = (aprendizId) => {
    setSelectedIds(prev => {
      const newSet = new Set(prev);
      if (newSet.has(aprendizId)) {
        newSet.delete(aprendizId);
      } else {
        newSet.add(aprendizId);
      }
      return newSet;
    });
  };

  // Seleccionar todos los filtrados
  const selectAllFiltered = () => {
    const allIds = new Set(filteredAprendices.map(a => a.id));
    setSelectedIds(allIds);
  };

  // Limpiar selección
  const clearSelection = () => {
    setSelectedIds(new Set());
  };

  // Atajos de teclado
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.ctrlKey || e.metaKey) {
        if (e.key === 'a') {
          e.preventDefault();
          selectAllFiltered();
        } else if (e.key === 'Enter') {
          e.preventDefault();
          if (selectedIds.size > 0) {
            handleBulkRegister();
          }
        }
      }
      if (e.key === 'Escape') {
        clearSelection();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [selectedIds, filteredAprendices]);

  const renderAprendizCard = (aprendiz) => {
    const isRegistering = registering.has(aprendiz.id);
    const isSelected = selectedIds.has(aprendiz.id);
    
    return (
      <div
        key={aprendiz.id}
        className={`relative group transition-all duration-200 ${
          isSelected 
            ? 'ring-2 ring-blue-500 bg-blue-50 dark:bg-blue-900/20' 
            : 'hover:shadow-md hover:scale-[1.02]'
        }`}
      >
        <button
          onClick={() => handleRegister(aprendiz)}
          disabled={isRegistering}
          className="w-full flex items-center gap-3 p-4 rounded-xl border-2 border-gray-200 dark:border-gray-700 hover:border-green-500 hover:bg-green-50 dark:hover:bg-green-900/20 transition-all disabled:opacity-50 disabled:cursor-not-allowed text-left bg-white dark:bg-gray-800"
        >
          {/* Avatar */}
          <div className="relative">
            <div className="w-12 h-12 rounded-full bg-gradient-to-br from-green-500 to-green-600 flex items-center justify-center text-white font-bold text-sm shrink-0">
              {aprendiz.fullName.split(' ').map(n => n[0]).slice(0, 2).join('').toUpperCase()}
            </div>
            
            {/* Checkbox para selección múltiple */}
            <button
              onClick={(e) => {
                e.stopPropagation();
                toggleSelection(aprendiz.id);
              }}
              className={`absolute -top-1 -right-1 w-5 h-5 rounded-full border-2 flex items-center justify-center transition-all ${
                isSelected
                  ? 'bg-blue-500 border-blue-500 text-white'
                  : 'bg-white border-gray-300 hover:border-blue-400'
              }`}
            >
              {isSelected && <CheckCircle size={12} />}
            </button>
          </div>
          
          {/* Info */}
          <div className="flex-1 min-w-0">
            <p className="font-semibold text-gray-900 dark:text-white truncate">
              {aprendiz.fullName}
            </p>
            <p className="text-sm text-gray-500 truncate">{aprendiz.email}</p>
          </div>
          
          {/* Status */}
          {isRegistering ? (
            <Loader size={20} className="text-green-500 animate-spin shrink-0" />
          ) : (
            <CheckCircle size={20} className="text-gray-300 group-hover:text-green-500 transition-colors shrink-0" />
          )}
        </button>
      </div>
    );
  };

  const renderAprendizList = (aprendiz) => {
    const isRegistering = registering.has(aprendiz.id);
    const isSelected = selectedIds.has(aprendiz.id);
    
    return (
      <div
        key={aprendiz.id}
        className={`flex items-center gap-3 p-3 rounded-lg border transition-all ${
          isSelected 
            ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20' 
            : 'border-gray-200 dark:border-gray-700 hover:border-green-500 hover:bg-green-50 dark:hover:bg-green-900/20'
        }`}
      >
        {/* Checkbox */}
        <button
          onClick={() => toggleSelection(aprendiz.id)}
          className={`w-5 h-5 rounded border-2 flex items-center justify-center transition-all ${
            isSelected
              ? 'bg-blue-500 border-blue-500 text-white'
              : 'border-gray-300 hover:border-blue-400'
          }`}
        >
          {isSelected && <CheckCircle size={12} />}
        </button>
        
        {/* Avatar */}
        <div className="w-10 h-10 rounded-full bg-gradient-to-br from-green-500 to-green-600 flex items-center justify-center text-white font-bold text-xs shrink-0">
          {aprendiz.fullName.split(' ').map(n => n[0]).slice(0, 2).join('').toUpperCase()}
        </div>
        
        {/* Info */}
        <div className="flex-1 min-w-0">
          <p className="font-medium text-gray-900 dark:text-white truncate text-sm">
            {aprendiz.fullName}
          </p>
          <p className="text-xs text-gray-500 truncate">{aprendiz.email}</p>
        </div>
        
        {/* Quick register button */}
        <button
          onClick={() => handleRegister(aprendiz)}
          disabled={isRegistering}
          className="p-2 rounded-lg bg-green-500 hover:bg-green-600 text-white transition-colors disabled:opacity-50"
          title="Registro rápido"
        >
          {isRegistering ? (
            <Loader size={16} className="animate-spin" />
          ) : (
            <CheckCircle size={16} />
          )}
        </button>
      </div>
    );
  };

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-white dark:bg-gray-900 rounded-2xl shadow-2xl max-w-4xl w-full max-h-[90vh] flex flex-col animate-scale-in">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-100 dark:border-gray-800">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-green-500 flex items-center justify-center">
              <UserCheck size={20} className="text-white" />
            </div>
            <div>
              <h2 className="font-bold text-gray-900 dark:text-white">Registro Manual Mejorado</h2>
              <p className="text-xs text-gray-400">
                {availableAprendices.length} pendientes • {selectedIds.size} seleccionados
              </p>
            </div>
          </div>
          <button onClick={onClose} className="btn-icon hover:bg-gray-100 dark:hover:bg-gray-800">
            <X size={18} />
          </button>
        </div>

        {/* Controls */}
        <div className="p-4 border-b border-gray-100 dark:border-gray-800 space-y-3">
          {/* Search and filters */}
          <div className="flex flex-col sm:flex-row gap-3">
            <div className="relative flex-1">
              <Search size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
              <input
                ref={searchInputRef}
                type="text"
                placeholder="Buscar por nombre o email... (Ctrl+A para seleccionar todos)"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="input-field pl-10 pr-4"
              />
            </div>
            
            <div className="flex items-center gap-2">
              {/* View mode toggle */}
              <div className="flex rounded-lg border border-gray-200 dark:border-gray-700 overflow-hidden">
                <button
                  onClick={() => setViewMode('grid')}
                  className={`p-2 transition-colors ${
                    viewMode === 'grid' 
                      ? 'bg-blue-500 text-white' 
                      : 'bg-white dark:bg-gray-800 text-gray-600 hover:bg-gray-50'
                  }`}
                  title="Vista en cuadrícula"
                >
                  <Grid size={16} />
                </button>
                <button
                  onClick={() => setViewMode('list')}
                  className={`p-2 transition-colors ${
                    viewMode === 'list' 
                      ? 'bg-blue-500 text-white' 
                      : 'bg-white dark:bg-gray-800 text-gray-600 hover:bg-gray-50'
                  }`}
                  title="Vista en lista"
                >
                  <List size={16} />
                </button>
              </div>
            </div>
          </div>

          {/* Bulk actions */}
          {selectedIds.size > 0 && (
            <div className="flex items-center justify-between p-3 bg-blue-50 dark:bg-blue-900/20 rounded-lg border border-blue-200 dark:border-blue-800">
              <div className="flex items-center gap-2">
                <Zap size={16} className="text-blue-500" />
                <span className="text-sm font-medium text-blue-700 dark:text-blue-300">
                  {selectedIds.size} aprendices seleccionados
                </span>
              </div>
              <div className="flex items-center gap-2">
                <button
                  onClick={clearSelection}
                  className="text-sm text-blue-600 hover:text-blue-800 dark:text-blue-400"
                >
                  Limpiar
                </button>
                <button
                  onClick={handleBulkRegister}
                  disabled={bulkRegistering}
                  className="btn-primary text-sm flex items-center gap-2"
                >
                  {bulkRegistering ? (
                    <Loader size={14} className="animate-spin" />
                  ) : (
                    <CheckCircle size={14} />
                  )}
                  Registrar Seleccionados
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-4">
          {filteredAprendices.length === 0 ? (
            <div className="text-center py-12">
              <Users size={48} className="mx-auto text-gray-300 mb-3" />
              <p className="text-gray-500 font-medium">
                {availableAprendices.length === 0
                  ? '✓ Todos los aprendices registrados'
                  : 'No se encontraron aprendices'}
              </p>
              {searchTerm && (
                <button
                  onClick={() => setSearchTerm('')}
                  className="text-blue-500 hover:text-blue-600 text-sm mt-2"
                >
                  Limpiar búsqueda
                </button>
              )}
            </div>
          ) : (
            <div className={
              viewMode === 'grid' 
                ? 'grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3'
                : 'space-y-2'
            }>
              {filteredAprendices.map(aprendiz => 
                viewMode === 'grid' 
                  ? renderAprendizCard(aprendiz)
                  : renderAprendizList(aprendiz)
              )}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-gray-100 dark:border-gray-800 bg-gray-50 dark:bg-gray-800/50">
          <div className="flex items-center justify-between text-sm">
            <div className="text-gray-500">
              <span className="font-medium">{availableAprendices.length}</span> pendientes • 
              <span className="font-medium text-green-600 ml-1">{registered.size}</span> registrados
            </div>
            <div className="flex items-center gap-3">
              <div className="text-xs text-gray-400">
                Ctrl+A: Seleccionar todos • Ctrl+Enter: Registrar seleccionados
              </div>
              <button onClick={onClose} className="btn-secondary text-sm">
                Cerrar
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}