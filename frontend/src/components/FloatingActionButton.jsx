import React from 'react';
import { Zap } from 'lucide-react';

export default function FloatingActionButton({ onClick, visible = true }) {
  if (!visible) return null;

  return (
    <button
      onClick={onClick}
      className="fixed bottom-6 right-6 z-40 w-14 h-14 bg-gradient-to-r from-purple-500 to-blue-500 hover:from-purple-600 hover:to-blue-600 text-white rounded-full shadow-lg hover:shadow-xl transition-all duration-300 flex items-center justify-center active:scale-95 md:hidden"
      title="Registro Inteligente"
    >
      <Zap size={24} className="text-white" />
      
      {/* Pulse animation */}
      <div className="absolute inset-0 rounded-full bg-gradient-to-r from-purple-500 to-blue-500 animate-ping opacity-20"></div>
    </button>
  );
}