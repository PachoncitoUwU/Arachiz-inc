import React, { useEffect, useState } from 'react';
import { FileText, Eye } from 'lucide-react';
import PageHeader from '../../components/PageHeader';
import { superUserApi } from '../../services/superUserApi';
import { useToast } from '../../context/ToastContext';
import LogDetailModal from '../../components/superuser/LogDetailModal';

export default function Logs() {
  const { showToast } = useToast();
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(true);
  
  const [selectedLog, setSelectedLog] = useState(null);
  const [showModal, setShowModal] = useState(false);

  useEffect(() => {
    loadLogs();
  }, []);

  const loadLogs = async () => {
    try {
      setLoading(true);
      const data = await superUserApi.getLogs();
      setLogs(data);
    } catch (err) {
      showToast('Error cargando logs de auditoría', 'error');
    } finally {
      setLoading(false);
    }
  };

  const openLog = (log) => {
    setSelectedLog(log);
    setShowModal(true);
  };

  return (
    <div className="space-y-6">
      <PageHeader 
        title="Logs de Auditoría" 
        subtitle="Registro inmutable de todas las acciones críticas realizadas por Super Usuarios" 
      />

      <div className="bg-white dark:bg-zinc-800 rounded-xl shadow-card border border-gray-100 dark:border-zinc-700 overflow-hidden">
        <div className="p-4 border-b border-gray-100 dark:border-zinc-700 bg-gray-50 dark:bg-zinc-900/50 flex items-center gap-2">
          <FileText size={18} className="text-gray-500" />
          <h3 className="font-semibold text-gray-700 dark:text-gray-200">Últimos 500 eventos</h3>
        </div>
        
        {loading ? (
          <div className="p-12 text-center text-gray-500">Cargando logs...</div>
        ) : logs.length === 0 ? (
          <div className="p-12 text-center text-gray-500">No hay registros de auditoría.</div>
        ) : (
          <div className="overflow-x-auto min-h-[300px] max-h-[600px] overflow-y-auto">
            <table className="w-full text-left text-sm border-collapse">
              <thead className="bg-white dark:bg-zinc-800 sticky top-0 z-10 shadow-sm">
                <tr>
                  <th className="px-6 py-3 font-semibold text-gray-600 dark:text-gray-300">Fecha</th>
                  <th className="px-6 py-3 font-semibold text-gray-600 dark:text-gray-300">Super Usuario</th>
                  <th className="px-6 py-3 font-semibold text-gray-600 dark:text-gray-300">Acción</th>
                  <th className="px-6 py-3 font-semibold text-gray-600 dark:text-gray-300">Entidad</th>
                  <th className="px-6 py-3 font-semibold text-gray-600 dark:text-gray-300">Descripción</th>
                  <th className="px-6 py-3 font-semibold text-gray-600 dark:text-gray-300 text-center">Diff</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100 dark:divide-zinc-700">
                {logs.map(log => (
                  <tr key={log.id} className="hover:bg-gray-50 dark:hover:bg-zinc-800/50 transition-colors">
                    <td className="px-6 py-3 text-gray-500 dark:text-gray-400 whitespace-nowrap">
                      {new Date(log.fechaHora).toLocaleString()}
                    </td>
                    <td className="px-6 py-3 font-medium text-gray-900 dark:text-white">
                      {log.superUser?.fullName || 'Sistema'}
                    </td>
                    <td className="px-6 py-3">
                      <span className="bg-gray-100 dark:bg-zinc-700 px-2 py-1 rounded text-xs font-mono capitalize">
                        {log.accion.replace('_', ' ')}
                      </span>
                    </td>
                    <td className="px-6 py-3 text-gray-700 dark:text-gray-300">
                      {log.entidad} {log.entidadId && <span className="text-gray-400">({log.entidadId.slice(0,8)}...)</span>}
                    </td>
                    <td className="px-6 py-3 text-gray-600 dark:text-gray-400 truncate max-w-xs" title={log.descripcion}>
                      {log.descripcion}
                    </td>
                    <td className="px-6 py-3 text-center">
                      <button 
                        onClick={() => openLog(log)}
                        className="p-1.5 bg-blue-50 text-blue-600 hover:bg-blue-100 dark:bg-blue-900/30 dark:text-blue-400 dark:hover:bg-blue-900/50 rounded inline-flex items-center gap-1 transition-colors"
                      >
                        <Eye size={14} /> <span className="text-xs font-medium">Ver</span>
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      <LogDetailModal 
        open={showModal} 
        onClose={() => setShowModal(false)} 
        log={selectedLog} 
      />
    </div>
  );
}
