import React, { useEffect, useState } from 'react';
import { Users, FolderOpen, Clock, FileText, Activity } from 'lucide-react';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import PageHeader from '../../components/PageHeader';
import { superUserApi } from '../../services/superUserApi';

function StatCard({ icon: Icon, title, value, colorClass }) {
  return (
    <div className="bg-white dark:bg-zinc-800 rounded-xl shadow-card p-6 flex items-center gap-4 border border-gray-100 dark:border-zinc-700">
      <div className={`w-12 h-12 rounded-full flex items-center justify-center ${colorClass}`}>
        <Icon size={24} className="opacity-90" />
      </div>
      <div>
        <p className="text-sm font-medium text-gray-500 dark:text-gray-400">{title}</p>
        <p className="text-2xl font-bold text-gray-900 dark:text-white">{value}</p>
      </div>
    </div>
  );
}

export default function Dashboard() {
  const [data, setData] = useState({ metrics: {}, chartData: [] });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        const res = await superUserApi.getDashboard();
        setData(res);
      } catch (err) {
        console.error(err);
        setError('Error al cargar datos del dashboard.');
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-[60vh]">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#4285F4]"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-6 text-center text-red-500">
        <p>{error}</p>
      </div>
    );
  }

  const { metrics, chartData } = data;

  return (
    <div className="space-y-6">
      <PageHeader 
        title="Dashboard Omni" 
        subtitle="Centro de control absoluto de la plataforma" 
      />

      {/* Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard 
          icon={Users} 
          title="Usuarios Totales" 
          value={metrics.totalUsers} 
          colorClass="bg-blue-100 text-blue-600 dark:bg-blue-900/30 dark:text-blue-400"
        />
        <StatCard 
          icon={FolderOpen} 
          title="Fichas Activas" 
          value={metrics.totalFichas} 
          colorClass="bg-purple-100 text-purple-600 dark:bg-purple-900/30 dark:text-purple-400"
        />
        <StatCard 
          icon={Clock} 
          title="Asistencias Hoy" 
          value={metrics.totalAsistenciasHoy} 
          colorClass="bg-green-100 text-green-600 dark:bg-green-900/30 dark:text-green-400"
        />
        <StatCard 
          icon={FileText} 
          title="Excusas Pendientes" 
          value={metrics.excusasPendientes} 
          colorClass="bg-orange-100 text-orange-600 dark:bg-orange-900/30 dark:text-orange-400"
        />
      </div>

      {/* Chart */}
      <div className="bg-white dark:bg-zinc-800 rounded-xl shadow-card p-6 border border-gray-100 dark:border-zinc-700">
        <div className="flex items-center gap-2 mb-6">
          <Activity className="text-gray-400" size={20} />
          <h2 className="text-lg font-bold text-gray-900 dark:text-white">Actividad Reciente (Últimos 7 días)</h2>
        </div>
        <div className="h-72 w-full">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={chartData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
              <defs>
                <linearGradient id="colorAsistencia" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#4285F4" stopOpacity={0.3}/>
                  <stop offset="95%" stopColor="#4285F4" stopOpacity={0}/>
                </linearGradient>
              </defs>
              <XAxis dataKey="fecha" stroke="#888888" fontSize={12} tickLine={false} axisLine={false} />
              <YAxis stroke="#888888" fontSize={12} tickLine={false} axisLine={false} />
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E5E7EB" />
              <Tooltip 
                contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
              />
              <Area 
                type="monotone" 
                dataKey="asistencias" 
                stroke="#4285F4" 
                strokeWidth={3}
                fillOpacity={1} 
                fill="url(#colorAsistencia)" 
              />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  );
}
