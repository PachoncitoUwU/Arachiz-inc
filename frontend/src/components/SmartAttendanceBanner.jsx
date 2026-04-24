import React, { useState } from 'react';
import { Zap, X, Sparkles } from 'lucide-react';

export default function SmartAttendanceBanner({ onOpenSmart, visible = true }) {
  const [dismissed, setDismissed] = useState(false);

  if (!visible || dismissed) return null;

  return (
    <div className="bg-gradient-to-r from-purple-500 to-blue-500 text-white p-4 rounded-xl mb-4 shadow-lg md:hidden">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3 flex-1">
          <div className="w-10 h-10 bg-white/20 rounded-full flex items-center justify-center">
            <Sparkles size={20} className="text-white" />
          </div>
          <div className="flex-1 min-w-0">
            <h3 className="font-bold text-white text-sm">
              🚀 Registro Inteligente Disponible
            </h3>
            <p className="text-white/90 text-xs mt-1">
              Detecta automáticamente el mejor método de registro
            </p>
          </div>
        </div>
        
        <div className="flex items-center gap-2 ml-2">
          <button
            onClick={onOpenSmart}
            className="bg-white/20 hover:bg-white/30 text-white px-3 py-1.5 rounded-lg text-xs font-semibold transition-all active:scale-95 flex items-center gap-1"
          >
            <Zap size={14} />
            Abrir
          </button>
          <button
            onClick={() => setDismissed(true)}
            className="w-8 h-8 flex items-center justify-center text-white/70 hover:text-white hover:bg-white/20 rounded-lg transition-all"
          >
            <X size={16} />
          </button>
        </div>
      </div>
    </div>
  );
}