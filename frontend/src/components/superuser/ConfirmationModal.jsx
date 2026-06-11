import React, { useState } from 'react';
import { AlertTriangle } from 'lucide-react';
import Modal from '../Modal';

export default function ConfirmationModal({ 
  isOpen, 
  onClose, 
  onConfirm, 
  title, 
  message, 
  confirmText 
}) {
  const [inputText, setInputText] = useState('');

  const isMatch = inputText === confirmText;

  const handleConfirm = () => {
    if (isMatch) {
      onConfirm();
      setInputText('');
    }
  };

  const handleClose = () => {
    setInputText('');
    onClose();
  };

  return (
    <Modal open={isOpen} onClose={handleClose} title={title}>
      <div className="space-y-4">
        <div className="bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400 p-4 rounded-xl flex items-start gap-3">
          <AlertTriangle className="shrink-0 mt-0.5" size={20} />
          <p className="text-sm">{message}</p>
        </div>

        <div className="space-y-2">
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
            Escribe <strong>{confirmText}</strong> para confirmar:
          </label>
          <input
            type="text"
            className="w-full px-4 py-2 border border-gray-300 dark:border-zinc-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-500 bg-white dark:bg-zinc-800 text-gray-900 dark:text-white"
            value={inputText}
            onChange={(e) => setInputText(e.target.value)}
            placeholder={confirmText}
            autoComplete="off"
          />
        </div>

        <div className="flex justify-end gap-3 pt-4">
          <button
            onClick={handleClose}
            className="px-4 py-2 text-sm font-semibold text-gray-600 hover:bg-gray-100 dark:text-gray-300 dark:hover:bg-zinc-700 rounded-xl transition-colors"
          >
            Cancelar
          </button>
          <button
            onClick={handleConfirm}
            disabled={!isMatch}
            className={`px-4 py-2 text-sm font-semibold text-white rounded-xl transition-colors ${
              isMatch ? 'bg-red-600 hover:bg-red-700' : 'bg-red-300 cursor-not-allowed dark:bg-red-900/50'
            }`}
          >
            Confirmar Acción
          </button>
        </div>
      </div>
    </Modal>
  );
}
