import React, { useEffect, useState } from 'react';
import { BarChart3, AlertTriangle, CheckCircle, Target } from 'lucide-react';
import fetchApi from '../services/api';
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip } from 'recharts';

export default function InstructorStats() {
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchApi('/stats/instructor')
      .then(res => {
        setStats(res);
      })
      .catch(err => console.error('Error loading stats:', err))
      .finally(() => setLoading(false));
  }, []);

  if (loading) {
    return (
      <div className="card animate-pulse">
        <div className="h-6 w-1/3 bg-gray-200 dark:bg-gray-700 rounded mb-4"></div>
        <div className="h-32 bg-gray-100 dark:bg-gray-800 rounded"></div>
      </div>
    );
  }

  if (!stats) return null;

  const { porcentajeAsistencia, estudiantesEnRiesgo, totalMaterias } = stats;

  const pieData = [
    { name: 'Asistencia', value: porcentajeAsistencia, color: '#34A853' },
    { name: 'Ausencia', value: 100 - porcentajeAsistencia, color: '#EA4335' }
  ];

  return (
    <div className="card-hover mt-6">
      <div className="flex items-center gap-2 mb-6 border-b border-gray-100 dark:border-zinc-700 pb-3">
        <div className="w-10 h-10 rounded-xl bg-indigo-50 dark:bg-indigo-900/20 flex items-center justify-center text-indigo-500">
          <BarChart3 size={20} />
        </div>
        <div>
          <h2 className="text-lg font-bold text-gray-900 dark:text-white">Estadísticas Avanzadas</h2>
          <p className="text-xs text-gray-500 dark:text-gray-400">Rendimiento en tus {totalMaterias} materias</p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Gráfico de Tasa de Asistencia General */}
        <div className="flex flex-col items-center justify-center bg-gray-50 dark:bg-zinc-800/50 p-4 rounded-2xl border border-gray-100 dark:border-zinc-700">
          <p className="text-sm font-semibold text-gray-600 dark:text-gray-300 mb-2">Tasa de Asistencia</p>
          <div className="w-full h-32 relative">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={pieData}
                  cx="50%"
                  cy="50%"
                  innerRadius={40}
                  outerRadius={55}
                  paddingAngle={5}
                  dataKey="value"
                  stroke="none"
                >
                  {pieData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip 
                  contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
                  formatter={(value) => [`${value}%`]} 
                />
              </PieChart>
            </ResponsiveContainer>
            <div className="absolute inset-0 flex items-center justify-center">
              <span className="text-lg font-bold text-gray-900 dark:text-white">{porcentajeAsistencia}%</span>
            </div>
          </div>
        </div>

        {/* Riesgo de Deserción Alerta */}
        <div className="md:col-span-2">
          <div className="flex items-center justify-between mb-3">
            <p className="text-sm font-semibold text-gray-600 dark:text-gray-300 flex items-center gap-2">
              <Target size={16} className="text-orange-500" />
              Riesgo de Deserción
            </p>
            <span className={`text-xs font-bold px-2.5 py-1 rounded-full ${estudiantesEnRiesgo.length > 0 ? 'bg-red-100 text-red-600 dark:bg-red-900/30' : 'bg-green-100 text-green-600 dark:bg-green-900/30'}`}>
              {estudiantesEnRiesgo.length} Aprendices
            </span>
          </div>

          {estudiantesEnRiesgo.length === 0 ? (
            <div className="bg-green-50 dark:bg-green-900/10 border border-green-100 dark:border-green-800/30 p-4 rounded-xl flex items-center gap-3">
              <CheckCircle size={24} className="text-green-500" />
              <div>
                <p className="font-semibold text-green-800 dark:text-green-400">Todo en orden</p>
                <p className="text-xs text-green-600/80 dark:text-green-500">Ningún estudiante ha superado el límite de fallas.</p>
              </div>
            </div>
          ) : (
            <div className="space-y-2 max-h-36 overflow-y-auto custom-scrollbar pr-2">
              {estudiantesEnRiesgo.map((est, idx) => (
                <div key={`${est.id}-${idx}`} className="flex items-center justify-between bg-white dark:bg-zinc-800 p-3 rounded-xl border border-red-100 dark:border-red-900/30 shadow-sm">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-full bg-red-50 dark:bg-red-900/20 flex items-center justify-center">
                      <AlertTriangle size={14} className="text-red-500" />
                    </div>
                    <div>
                      <p className="text-sm font-semibold text-gray-900 dark:text-gray-100 truncate w-32 md:w-48">{est.fullName}</p>
                      <p className="text-xs text-gray-500">{est.materia}</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <span className={`text-xs font-bold px-2 py-0.5 rounded-md ${est.riesgo === 'Crítico' ? 'bg-red-500 text-white' : 'bg-orange-100 text-orange-600 dark:bg-orange-900/30'}`}>
                      {est.faltas} Faltas
                    </span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
