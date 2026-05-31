import React from 'react';
import { AlertTriangle, X } from 'lucide-react';

export default function ConfirmDialog({ open, onClose, onConfirm, title, message, confirmText = "Confirmar", cancelText = "Cancelar", danger = false }) {
  if (!open) return null;

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-[9999] p-4 animate-fade-in">
      <div className="bg-white dark:bg-zinc-800  dark:bg-gray-900 rounded-2xl shadow-2xl max-w-md w-full animate-scale-in border border-gray-100 dark:border-zinc-700  dark:border-gray-800">
        <div className="p-4 md:p-6 ">
          <div className="flex items-start gap-4">
            <div className={`w-12 h-12 rounded-xl flex items-center justify-center shrink-0 ${danger ? 'bg-red-100 dark:bg-red-900/20' : 'bg-blue-100 dark:bg-blue-900/20'}`}>
              <AlertTriangle size={24} className={danger ? 'text-red-600 dark:text-red-400' : 'text-blue-600 dark:text-blue-400'} />
            </div>
            <div className="flex-1">
              <h3 className="text-lg font-bold text-gray-900 dark:text-white  dark:text-white mb-2">{title}</h3>
              <p className="text-sm text-gray-600 dark:text-gray-400">{message}</p>
            </div>
            <button onClick={onClose} className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 transition-colors">
              <X size={20} />
            </button>
          </div>
        </div>
        <div className="flex flex-wrap gap-3  p-4 md:p-6  pt-0">
          <button 
            onClick={onClose}
            className="flex-1 px-4 py-2.5 rounded-xl border-2 border-gray-200 dark:border-zinc-700  dark:border-gray-700 text-gray-700 dark:text-gray-300 font-semibold hover:bg-gray-50 dark:hover:bg-gray-800 transition-all">
            {cancelText}
          </button>
          <button 
            onClick={() => { onConfirm(); onClose(); }}
            className={`flex-1 px-4 py-2.5 rounded-xl font-semibold transition-all shadow-md ${
              danger 
                ? 'bg-red-500 hover:bg-red-600 text-white hover:shadow-red-500/50' 
                : 'bg-blue-500 hover:bg-blue-600 text-white hover:shadow-blue-500/50'
            }`}>
            {confirmText}
          </button>
        </div>
      </div>
    </div>
  );
}
