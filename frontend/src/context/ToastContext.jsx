import React, { createContext, useContext, useState, useCallback } from 'react';
import { CheckCircle, XCircle, AlertCircle, X } from 'lucide-react';

const ToastContext = createContext();

export const useToast = () => useContext(ToastContext);

const ICONS = {
  success: <CheckCircle size={18} className="text-[#34A853]" />,
  error:   <XCircle size={18} className="text-[#EA4335]" />,
  warning: <AlertCircle size={18} className="text-[#FBBC05]" />,
  info:    <AlertCircle size={18} className="text-[#4285F4]" />,
};

const BG = {
  success: 'border-l-[#34A853]',
  error:   'border-l-[#EA4335]',
  warning: 'border-l-[#FBBC05]',
  info:    'border-l-[#4285F4]',
};

function Toast({ id, message, type, onRemove }) {
  return (
    <div className={`flex items-center gap-3 bg-white rounded-xl shadow-card border border-gray-100 border-l-4 ${BG[type]} px-4 py-3 min-w-[280px] max-w-sm animate-fade-in`}>
      {ICONS[type]}
      <p className="text-sm font-medium text-gray-800 flex-1">{message}</p>
      <button onClick={() => onRemove(id)} className="text-gray-400 hover:text-gray-600 shrink-0">
        <X size={14} />
      </button>
    </div>
  );
}

export function ToastProvider({ children }) {
  const [toasts, setToasts] = useState([]);

  const showToast = useCallback((message, type = 'info', duration = 3500) => {
    const id = Date.now();
    setToasts(prev => [...prev, { id, message, type }]);
    setTimeout(() => setToasts(prev => prev.filter(t => t.id !== id)), duration);
  }, []);

  const removeToast = useCallback((id) => {
    setToasts(prev => prev.filter(t => t.id !== id));
  }, []);

  return (
    <ToastContext.Provider value={{ showToast }}>
      {children}
      <div className="fixed bottom-5 right-5 z-[100] flex flex-col gap-2">
        {toasts.map(t => (
          <Toast key={t.id} {...t} onRemove={removeToast} />
        ))}
      </div>
    </ToastContext.Provider>
  );
}
