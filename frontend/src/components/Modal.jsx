import React, { useEffect } from 'react';
import { X } from 'lucide-react';

export default function Modal({ open, onClose, title, children, maxWidth = 'max-w-md' }) {
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
        zIndex: 9999
      }}
      onClick={onClose}
    >
      <div 
        className={`bg-white dark:bg-zinc-800 rounded-2xl shadow-xl w-full ${maxWidth} relative border border-gray-100 dark:border-zinc-700`}
        style={{
          maxHeight: '90vh',
          display: 'flex',
          flexDirection: 'column',
          margin: '20px'
        }}
        onClick={e => e.stopPropagation()}
      >
        <div 
          className="flex items-center justify-between px-6 py-4 border-b border-gray-100 dark:border-zinc-700  dark:border-zinc-700 bg-white dark:bg-zinc-800  dark:bg-zinc-800"
          style={{
            position: 'sticky',
            top: 0,
            zIndex: 10,
            borderTopLeftRadius: '16px',
            borderTopRightRadius: '16px'
          }}
        >
          <h2 className="text-lg font-bold text-gray-900 dark:text-white  dark:text-white mb-0">{title}</h2>
          <button onClick={onClose} className="btn-icon text-gray-400 dark:text-gray-500 hover:bg-gray-100 dark:hover:bg-zinc-700">
            <X size={18} />
          </button>
        </div>
        <div 
          className="px-6 py-4"
          style={{
            overflowY: 'auto',
            flex: 1
          }}
        >
          {children}
        </div>
      </div>
    </div>
  );
}
