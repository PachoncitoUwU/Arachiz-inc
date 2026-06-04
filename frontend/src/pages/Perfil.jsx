import React, { useEffect, useState, useContext } from 'react';
import { AuthContext } from '../context/AuthContext';
import PageHeader from '../components/PageHeader';
import { Award, Target, Flame, Activity, Clock } from 'lucide-react';

const API_BASE = import.meta.env.VITE_API_URL || 'http://localhost:3000/api';

export default function Perfil() {
  const { user } = useContext(AuthContext);
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchStats = async () => {
      try {
        const res = await fetch(`${API_BASE}/profile/stats`, {
          headers: { Authorization: `Bearer ${localStorage.getItem('token')}` }
        });
        const data = await res.json();
        setStats(data);
      } catch (err) {
        console.error('Error fetching stats:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchStats();
  }, []);

  if (loading) {
    return (
      <div className="flex h-64 items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-[#4285F4] border-t-transparent" />
      </div>
    );
  }

  const isAprendiz = user?.userType === 'aprendiz';

  return (
    <div className="animate-fade-in space-y-6 max-w-4xl mx-auto">
      <PageHeader title="Mi Perfil" subtitle="Tus estadísticas y progreso en Arachiz" />

      {/* Tarjeta principal de perfil */}
      <div className="bg-white dark:bg-zinc-800 rounded-3xl p-6 md:p-8 shadow-sm border border-gray-100 dark:border-zinc-700 flex flex-col md:flex-row items-center md:items-start gap-6">
        <div className="relative">
          <div className="w-24 h-24 md:w-32 md:h-32 rounded-full overflow-hidden bg-gray-100 shadow-inner">
            {stats?.avatarUrl ? (
              <img src={stats.avatarUrl} alt={stats.fullName} className="w-full h-full object-cover" />
            ) : (
              <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-blue-500 to-blue-600 text-white text-3xl font-bold">
                {stats?.fullName?.charAt(0) || user?.email?.charAt(0) || '?'}
              </div>
            )}
          </div>
          {stats?.rachaAsistencia >= 3 && (
            <div className="absolute -bottom-2 -right-2 bg-gradient-to-r from-orange-400 to-red-500 text-white text-xs font-bold px-3 py-1 rounded-full shadow-lg border-2 border-white dark:border-zinc-800 flex items-center gap-1 animate-bounce">
              <Flame size={12} />
              {stats.rachaAsistencia}
            </div>
          )}
        </div>

        <div className="flex-1 text-center md:text-left">
          <h1 className="text-2xl md:text-3xl font-bold text-gray-900 dark:text-white">{stats?.fullName || 'Usuario'}</h1>
          <p className="text-gray-500 dark:text-gray-400 font-medium capitalize mt-1">{stats?.userType || 'Rol Desconocido'}</p>
          <div className="mt-4 flex flex-wrap justify-center md:justify-start gap-2">
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-blue-50 dark:bg-blue-900/30 text-blue-700 dark:text-blue-400 text-sm font-semibold">
              <Award size={14} />
              Nivel: Novato
            </span>
            {isAprendiz && (
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-green-50 dark:bg-green-900/30 text-green-700 dark:text-green-400 text-sm font-semibold">
                <Target size={14} />
                Asistencia Perfecta
              </span>
            )}
          </div>
        </div>
      </div>

      {/* Grid de Estadísticas */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {/* Racha */}
        <div className="bg-gradient-to-br from-orange-50 to-red-50 dark:from-orange-900/20 dark:to-red-900/20 p-6 rounded-3xl border border-orange-100 dark:border-orange-500/20 flex flex-col items-center justify-center text-center group transition-transform hover:scale-105">
          <div className="w-12 h-12 bg-white dark:bg-zinc-800 rounded-full shadow-sm flex items-center justify-center mb-3 group-hover:scale-110 transition-transform">
            <Flame className="text-orange-500" size={24} />
          </div>
          <p className="text-3xl font-black text-orange-600 dark:text-orange-400">{stats?.rachaAsistencia || 0}</p>
          <p className="text-sm font-semibold text-orange-800/60 dark:text-orange-300/60 mt-1 uppercase tracking-wide">Racha Actual</p>
        </div>

        {/* Total Asistencias */}
        <div className="bg-gradient-to-br from-blue-50 to-indigo-50 dark:from-blue-900/20 dark:to-indigo-900/20 p-6 rounded-3xl border border-blue-100 dark:border-blue-500/20 flex flex-col items-center justify-center text-center group transition-transform hover:scale-105">
          <div className="w-12 h-12 bg-white dark:bg-zinc-800 rounded-full shadow-sm flex items-center justify-center mb-3 group-hover:scale-110 transition-transform">
            <Activity className="text-blue-500" size={24} />
          </div>
          <p className="text-3xl font-black text-blue-600 dark:text-blue-400">{stats?.totalAsistencias || 0}</p>
          <p className="text-sm font-semibold text-blue-800/60 dark:text-blue-300/60 mt-1 uppercase tracking-wide">
            {isAprendiz ? 'Asistencias' : 'Clases Registradas'}
          </p>
        </div>

        {/* Horas */}
        <div className="bg-gradient-to-br from-emerald-50 to-teal-50 dark:from-emerald-900/20 dark:to-teal-900/20 p-6 rounded-3xl border border-emerald-100 dark:border-emerald-500/20 flex flex-col items-center justify-center text-center group transition-transform hover:scale-105">
          <div className="w-12 h-12 bg-white dark:bg-zinc-800 rounded-full shadow-sm flex items-center justify-center mb-3 group-hover:scale-110 transition-transform">
            <Clock className="text-emerald-500" size={24} />
          </div>
          <p className="text-3xl font-black text-emerald-600 dark:text-emerald-400">
            {Math.floor((stats?.totalAsistencias || 0) * 1.5)}h
          </p>
          <p className="text-sm font-semibold text-emerald-800/60 dark:text-emerald-300/60 mt-1 uppercase tracking-wide">
            Horas Totales
          </p>
        </div>
      </div>
    </div>
  );
}
