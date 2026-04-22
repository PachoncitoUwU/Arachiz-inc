import React, { useState } from 'react';
import { X, UserCheck, Search, CheckCircle } from 'lucide-react';
import fetchApi from '../services/api';
import { useToast } from '../context/ToastContext';

export default function ManualAttendance({ asistenciaId, aprendices, alreadyRegistered, onClose, onRegistered }) {
  const { showToast } = useToast();
  const [searchTerm, setSearchTerm] = useState('');
  const [registering, setRegistering] = useState(null);

  // Filtrar aprendices que no están registrados
  const availableAprendices = aprendices.filter(a => !alreadyRegistered.has(a.id));

  // Filtrar por búsqueda
  const filteredAprendices = availableAprendices.filter(a =>
    a.fullName.toLowerCase().includes(searchTerm.toLowerCase()) ||
    a.email.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleRegister = async (aprendiz) => {
    setRegistering(aprendiz.id);
    try {
      await fetchApi('/asistencias/manual-register', {
        method: 'POST',
        body: JSON.stringify({
          asistenciaId,
          aprendizId: aprendiz.id
        })
      });

      showToast(`✓ ${aprendiz.fullName} registrado manualmente`, 'success');
      
      if (onRegistered) {
        onRegistered(aprendiz);
      }
    } catch (error) {
      showToast(error.message, 'error');
    } finally {
      setRegistering(null);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-white dark:bg-gray-900 rounded-2xl shadow-2xl max-w-2xl w-full max-h-[80vh] flex flex-col animate-scale-in">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-100 dark:border-gray-800">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-[#34A853] flex items-center justify-center">
              <UserCheck size={20} className="text-white" />
            </div>
            <div>
              <h2 className="font-bold text-gray-900 dark:text-white">Registro Manual</h2>
              <p className="text-xs text-gray-400">Selecciona un aprendiz para registrar</p>
            </div>
          </div>
          <button onClick={onClose} className="btn-icon hover:bg-gray-100 dark:hover:bg-gray-800">
            <X size={18} />
          </button>
        </div>

        {/* Search */}
        <div className="p-4 border-b border-gray-100 dark:border-gray-800">
          <div className="relative">
            <Search size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
            <input
              type="text"
              placeholder="Buscar por nombre o email..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="input-field pl-10"
              autoFocus
            />
          </div>
        </div>

        {/* List */}
        <div className="flex-1 overflow-y-auto p-4">
          {filteredAprendices.length === 0 ? (
            <div className="text-center py-12">
              <UserCheck size={48} className="mx-auto text-gray-300 mb-3" />
              <p className="text-gray-500 font-medium">
                {availableAprendices.length === 0
                  ? 'Todos los aprendices ya están registrados'
                  : 'No se encontraron aprendices'}
              </p>
            </div>
          ) : (
            <div className="space-y-2">
              {filteredAprendices.map((aprendiz) => (
                <button
                  key={aprendiz.id}
                  onClick={() => handleRegister(aprendiz)}
                  disabled={registering === aprendiz.id}
                  className="w-full flex items-center justify-between p-4 rounded-xl border-2 border-gray-200 dark:border-gray-700 hover:border-[#34A853] hover:bg-green-50 dark:hover:bg-green-900/20 transition-all disabled:opacity-50 disabled:cursor-not-allowed group"
                >
                  <div className="flex items-center gap-3 text-left">
                    <div className="w-10 h-10 rounded-full bg-gradient-to-br from-[#34A853] to-[#0F9D58] flex items-center justify-center text-white font-bold text-sm">
                      {aprendiz.fullName.split(' ').map(n => n[0]).slice(0, 2).join('').toUpperCase()}
                    </div>
                    <div>
                      <p className="font-semibold text-gray-900 dark:text-white">
                        {aprendiz.fullName}
                      </p>
                      <p className="text-xs text-gray-500">{aprendiz.email}</p>
                    </div>
                  </div>
                  
                  {registering === aprendiz.id ? (
                    <div className="w-6 h-6 border-2 border-[#34A853] border-t-transparent rounded-full animate-spin" />
                  ) : (
                    <CheckCircle size={20} className="text-gray-300 group-hover:text-[#34A853] transition-colors" />
                  )}
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-gray-100 dark:border-gray-800 bg-gray-50 dark:bg-gray-800/50">
          <div className="flex items-center justify-between text-sm">
            <span className="text-gray-500">
              {availableAprendices.length} aprendiz{availableAprendices.length !== 1 ? 'es' : ''} pendiente{availableAprendices.length !== 1 ? 's' : ''}
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
