import React, { useEffect, useState, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

export default function LiveAttendanceMap({ session, ioSocket }) {
  const [attendances, setAttendances] = useState([]);
  const API_BASE = import.meta.env.VITE_SOCKET_URL || 'http://localhost:3000';

  useEffect(() => {
    if (!session) return;
    
    // Set initial attendances
    setAttendances(session.registros || []);

    if (ioSocket) {
      // Listen for real-time attendances
      const handleNuevaAsistencia = (registro) => {
        setAttendances(prev => {
          // Prevent duplicates
          if (prev.find(r => r.id === registro.id || r.aprendizId === registro.aprendizId)) {
            return prev;
          }
          return [registro, ...prev];
        });
      };

      ioSocket.on('nuevaAsistencia', handleNuevaAsistencia);
      return () => {
        ioSocket.off('nuevaAsistencia', handleNuevaAsistencia);
      };
    }
  }, [session, ioSocket]);

  if (!session) {
    return (
      <div className="bg-white dark:bg-zinc-800 p-8 rounded-3xl text-center border border-gray-100 dark:border-zinc-700 shadow-sm">
        <p className="text-gray-500 dark:text-gray-400">No hay una sesión activa en este momento.</p>
      </div>
    );
  }

  // Calculate percentages
  const totalStudents = session.materia?.ficha?.aprendices?.length || 0;
  const presentStudents = attendances.filter(a => a.presente).length;
  const percentage = totalStudents > 0 ? Math.round((presentStudents / totalStudents) * 100) : 0;

  return (
    <div className="bg-white dark:bg-zinc-800 p-6 md:p-8 rounded-3xl border border-gray-100 dark:border-zinc-700 shadow-sm relative overflow-hidden">
      {/* Background Decor */}
      <div className="absolute top-0 right-0 w-64 h-64 bg-blue-50 dark:bg-blue-900/10 rounded-full blur-3xl -mr-32 -mt-32 opacity-60"></div>
      
      <div className="relative z-10 flex flex-col md:flex-row justify-between items-start md:items-center gap-6 mb-8">
        <div>
          <h3 className="text-xl font-bold text-gray-900 dark:text-white flex items-center gap-2">
            <span className="relative flex h-3 w-3">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-3 w-3 bg-green-500"></span>
            </span>
            Asistencia en Vivo
          </h3>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
            Los estudiantes irán apareciendo aquí a medida que registren su asistencia.
          </p>
        </div>
        
        <div className="flex items-center gap-4 bg-gray-50 dark:bg-zinc-900/50 p-3 rounded-2xl border border-gray-100 dark:border-zinc-800">
          <div className="text-right">
            <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide">Progreso</p>
            <p className="text-lg font-bold text-gray-900 dark:text-white">{presentStudents} / {totalStudents}</p>
          </div>
          <div className="relative w-12 h-12 flex items-center justify-center">
            <svg className="w-full h-full -rotate-90" viewBox="0 0 36 36">
              <path
                className="text-gray-200 dark:text-gray-700"
                d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                fill="none"
                stroke="currentColor"
                strokeWidth="4"
              />
              <path
                className={`${percentage === 100 ? 'text-green-500' : 'text-blue-500'} transition-all duration-1000 ease-out`}
                strokeDasharray={`${percentage}, 100`}
                d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                fill="none"
                stroke="currentColor"
                strokeWidth="4"
              />
            </svg>
            <span className="absolute text-xs font-bold text-gray-700 dark:text-gray-300">{percentage}%</span>
          </div>
        </div>
      </div>

      <div className="relative bg-gray-50/50 dark:bg-zinc-900/30 border border-gray-100 dark:border-zinc-800 rounded-2xl p-6 min-h-[250px]">
        {attendances.length === 0 ? (
          <div className="absolute inset-0 flex flex-col items-center justify-center text-gray-400">
            <p className="text-sm font-medium">Esperando estudiantes...</p>
            <div className="mt-4 flex gap-1">
              <div className="w-2 h-2 rounded-full bg-blue-400 animate-bounce" style={{ animationDelay: '0ms' }}></div>
              <div className="w-2 h-2 rounded-full bg-blue-400 animate-bounce" style={{ animationDelay: '150ms' }}></div>
              <div className="w-2 h-2 rounded-full bg-blue-400 animate-bounce" style={{ animationDelay: '300ms' }}></div>
            </div>
          </div>
        ) : (
          <div className="flex flex-wrap gap-4 justify-center md:justify-start">
            <AnimatePresence>
              {attendances.map((registro, idx) => {
                const isLate = registro.tarde;
                const avatarUrl = registro.aprendiz?.avatarUrl 
                  ? (registro.aprendiz.avatarUrl.startsWith('http') ? registro.aprendiz.avatarUrl : `${API_BASE}${registro.aprendiz.avatarUrl}`)
                  : null;
                  
                return (
                  <motion.div
                    key={registro.id || idx}
                    initial={{ scale: 0, opacity: 0, y: 20 }}
                    animate={{ scale: 1, opacity: 1, y: 0 }}
                    transition={{ type: 'spring', stiffness: 260, damping: 20 }}
                    className="relative group"
                  >
                    <div className={`w-14 h-14 rounded-full p-1 bg-white dark:bg-zinc-800 shadow-md ${isLate ? 'shadow-orange-500/20' : 'shadow-green-500/20'}`}>
                      <div className={`w-full h-full rounded-full overflow-hidden border-2 ${isLate ? 'border-orange-400' : 'border-green-400'}`}>
                        {avatarUrl ? (
                          <img src={avatarUrl} alt={registro.aprendiz?.fullName} className="w-full h-full object-cover" />
                        ) : (
                          <div className={`w-full h-full flex items-center justify-center text-white font-bold text-sm ${isLate ? 'bg-orange-400' : 'bg-green-500'}`}>
                            {registro.aprendiz?.fullName?.charAt(0) || '?'}
                          </div>
                        )}
                      </div>
                    </div>
                    
                    {/* Tooltip on hover */}
                    <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 w-max px-3 py-1.5 bg-gray-900 text-white text-xs font-medium rounded-lg opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all z-20 shadow-lg pointer-events-none">
                      <p>{registro.aprendiz?.fullName}</p>
                      <p className={`text-[10px] mt-0.5 ${isLate ? 'text-orange-300' : 'text-green-300'}`}>
                        {new Date(registro.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })} 
                        {isLate ? ' (Tarde)' : ''} • {registro.metodo}
                      </p>
                      {/* Triangle */}
                      <div className="absolute top-full left-1/2 -translate-x-1/2 border-4 border-transparent border-t-gray-900"></div>
                    </div>
                  </motion.div>
                );
              })}
            </AnimatePresence>
          </div>
        )}
      </div>
    </div>
  );
}
