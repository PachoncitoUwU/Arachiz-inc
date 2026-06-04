import React from 'react';
import Modal from '../Modal';

export default function LogDetailModal({ open, onClose, log }) {
  if (!open || !log) return null;

  return (
    <Modal open={open} onClose={onClose} title="Detalle de Auditoría">
      <div className="space-y-6">
        <div className="bg-gray-50 dark:bg-zinc-800 p-4 rounded-xl border border-gray-100 dark:border-zinc-700 grid grid-cols-2 gap-4">
          <div>
            <p className="text-xs text-gray-500 uppercase tracking-wider font-semibold">Acción</p>
            <p className="text-sm font-medium text-gray-900 dark:text-white capitalize">{log.accion.replace('_', ' ')}</p>
          </div>
          <div>
            <p className="text-xs text-gray-500 uppercase tracking-wider font-semibold">Fecha</p>
            <p className="text-sm font-medium text-gray-900 dark:text-white">{new Date(log.fechaHora).toLocaleString()}</p>
          </div>
          <div>
            <p className="text-xs text-gray-500 uppercase tracking-wider font-semibold">Autor (Super Usuario)</p>
            <p className="text-sm font-medium text-gray-900 dark:text-white">{log.superUser?.fullName || 'Sistema'}</p>
          </div>
          <div>
            <p className="text-xs text-gray-500 uppercase tracking-wider font-semibold">Entidad Afectada</p>
            <p className="text-sm font-medium text-gray-900 dark:text-white">
              {log.entidad} {log.entidadId ? `(ID: ${log.entidadId})` : ''}
            </p>
          </div>
          <div className="col-span-2">
            <p className="text-xs text-gray-500 uppercase tracking-wider font-semibold">Descripción</p>
            <p className="text-sm text-gray-900 dark:text-white">{log.descripcion}</p>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-2">
            <h4 className="text-sm font-semibold text-red-600 dark:text-red-400">Datos Anteriores</h4>
            <div className="bg-gray-50 dark:bg-zinc-900 p-3 rounded-lg border border-red-100 dark:border-red-900/30 overflow-x-auto">
              <pre className="text-xs text-gray-700 dark:text-gray-300 font-mono">
                {JSON.stringify(log.datosAnteriores, null, 2)}
              </pre>
            </div>
          </div>
          <div className="space-y-2">
            <h4 className="text-sm font-semibold text-green-600 dark:text-green-400">Datos Nuevos</h4>
            <div className="bg-gray-50 dark:bg-zinc-900 p-3 rounded-lg border border-green-100 dark:border-green-900/30 overflow-x-auto">
              <pre className="text-xs text-gray-700 dark:text-gray-300 font-mono">
                {JSON.stringify(log.datosNuevos, null, 2)}
              </pre>
            </div>
          </div>
        </div>
      </div>
    </Modal>
  );
}
