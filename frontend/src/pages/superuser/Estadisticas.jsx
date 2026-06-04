import React, { useEffect, useState } from 'react';
import { PieChart, Pie, Cell, Tooltip, ResponsiveContainer, Legend } from 'recharts';
import { Activity, Clock } from 'lucide-react';
import PageHeader from '../../components/PageHeader';
import { superUserApi } from '../../services/superUserApi';
import { useToast } from '../../context/ToastContext';

const COLORS = ['#4285F4', '#34A853', '#FBBC05', '#EA4335', '#8A2BE2', '#FF69B4'];

export default function Estadisticas() {
  const { showToast } = useToast();
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadStats();
  }, []);

  const loadStats = async () => {
    try {
      setLoading(true);
      const data = await superUserApi.getStatistics();
      setStats(data);
    } catch (err) {
      showToast('Error cargando estadísticas', 'error');
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return <div className="p-12 text-center text-gray-500">Cargando estadísticas...</div>;
  }

  if (!stats) return null;

  // Format data for Recharts
  const userRoleData = stats.userCounts.map(item => ({
    name: item.userType.replace('_', ' ').toUpperCase(),
    value: item._count
  }));

  const excusasData = stats.excusasCounts.map(item => ({
    name: item.estado,
    value: item._count
  }));

  return (
    <div className="space-y-6">
      <PageHeader 
        title="Estadísticas y Analíticas" 
        subtitle="Métricas globales del sistema en tiempo real" 
      />

      {/* KPI Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="bg-white dark:bg-zinc-800 rounded-xl shadow-card p-6 border border-gray-100 dark:border-zinc-700 flex items-center gap-4">
          <div className="p-4 bg-blue-100 text-blue-600 dark:bg-blue-900/30 dark:text-blue-400 rounded-2xl">
            <Activity size={24} />
          </div>
          <div>
            <p className="text-sm font-medium text-gray-500 dark:text-gray-400">Usuarios Activos Hoy</p>
            <h3 className="text-2xl font-bold text-gray-900 dark:text-white">{stats.activosHoy}</h3>
          </div>
        </div>

        <div className="bg-white dark:bg-zinc-800 rounded-xl shadow-card p-6 border border-gray-100 dark:border-zinc-700 flex items-center gap-4">
          <div className="p-4 bg-green-100 text-green-600 dark:bg-green-900/30 dark:text-green-400 rounded-2xl">
            <Clock size={24} />
          </div>
          <div>
            <p className="text-sm font-medium text-gray-500 dark:text-gray-400">Asistencias Tomadas Hoy</p>
            <h3 className="text-2xl font-bold text-gray-900 dark:text-white">{stats.asistenciasHoy}</h3>
          </div>
        </div>
      </div>

      {/* Charts Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        
        {/* Roles Chart */}
        <div className="bg-white dark:bg-zinc-800 rounded-xl shadow-card p-6 border border-gray-100 dark:border-zinc-700">
          <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-6">Distribución de Usuarios por Rol</h3>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={userRoleData}
                  cx="50%"
                  cy="50%"
                  innerRadius={60}
                  outerRadius={80}
                  paddingAngle={5}
                  dataKey="value"
                >
                  {userRoleData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip 
                  contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
                />
                <Legend />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Excusas Chart */}
        <div className="bg-white dark:bg-zinc-800 rounded-xl shadow-card p-6 border border-gray-100 dark:border-zinc-700">
          <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-6">Estado Global de Excusas</h3>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={excusasData}
                  cx="50%"
                  cy="50%"
                  innerRadius={60}
                  outerRadius={80}
                  paddingAngle={5}
                  dataKey="value"
                >
                  {excusasData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={
                      entry.name === 'Pendiente' ? '#FBBC05' : 
                      entry.name === 'Aprobada' ? '#34A853' : '#EA4335'
                    } />
                  ))}
                </Pie>
                <Tooltip 
                  contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
                />
                <Legend />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>

      </div>
    </div>
  );
}
