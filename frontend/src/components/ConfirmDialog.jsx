import React, { useEffect } from 'react';
import { X, AlertTriangle } from 'lucide-react';

export default function ConfirmDialog({ open, onClose, onConfirm, title, message, confirmText = 'Confirmar', cancelText = 'Cancelar', type = 'warning' }) {
  useEffect(() => {
    if (open) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = 'unset';
    }
    return () => {
      document.body.style.overflow = 'unset';
    };
  }, [open]);

  if (!open) return null;
  
  const colors = {
    warning: 'text-yellow-600 bg-yellow-50',
    danger: 'text-red-600 bg-red-50',
    info: 'text-blue-600 bg-blue-50'
  };

  return (
    <div 
      style={{
        position: 'fixed',
        top: 0,
        left: 0,
        width: '100vw',
        height: '100vh',
        backgroundColor: 'rgba(0, 0, 0, 0.5)',
        backdropFilter: 'blur(4px)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '16px',
        zIndex: 9999
      }}
      onClick={onClose}
    >
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-md p-6 relative" onClick={e => e.stopPropagation()}>
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-bold text-gray-900">{title}</h2>
          <button onClick={onClose} className="btn-icon text-gray-400 hover:bg-gray-100">
            <X size={18} />
          </button>
        </div>
        <div className="space-y-4">
          <div className={`flex items-center gap-3 p-3 rounded-lg ${colors[type]}`}>
            <AlertTriangle size={24} />
            <p className="text-sm font-medium">{message}</p>
          </div>
          <div className="flex gap-3">
            <button onClick={onClose} className="btn-secondary flex-1">
              {cancelText}
            </button>
            <button onClick={() => { onConfirm(); onClose(); }} className="btn-primary flex-1">
              {confirmText}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
