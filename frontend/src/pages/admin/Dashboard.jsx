import React, { useEffect, useState, useContext } from 'react';
import { AuthContext } from '../../context/AuthContext';
import { useSettings } from '../../context/SettingsContext';
import { Link } from 'react-router-dom';
import { Users, BookOpen, FileText, FolderOpen, BarChart3, Trash2 } from 'lucide-react';
import PageHeader from '../../components/PageHeader';
import StatCard from '../../components/StatCard';
import fetchApi from '../../services/api';

export default function AdminDashboard() {
  const { user } = useContext(AuthContext);
  const { t } = useSettings();
  const [stats, setStats] = useState({
    totalFichas: 0,
    totalInstructores: 0,
    totalAprendices: 0,
    totalMaterias: 0
  });
  const [fichas, setFichas] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadDashboardData();
  }, []);

  const loadDashboardData = async () => {
    try {
      setLoading(true);
      const data = await fetchApi('/admin/fichas');
      setFichas(data.fichas || []);
      
      // Calcular estadísticas
      const totalFichas = data.fichas?.length || 0;
      const totalInstructores = new Set(
        data.fichas?.flatMap(f => f.instructores?.map(i => i.instructorId) || [])
      ).size;
      const totalAprendices = data.fichas?.reduce((sum, f) => sum + (f._count?.aprendices || 0), 0) || 0;
      const totalMaterias = data.fichas?.reduce((sum, f) => sum + (f._count?.materias || 0), 0) || 0;

      setStats({
        totalFichas,
        totalInstructores,
        totalAprendices,
        totalMaterias
      });
    } catch (err) {
      console.error('Error cargando dashboard:', err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      <PageHeader
        title={`Bienvenido, ${user?.fullName || 'Administrador'}`}
        subtitle="Panel de control administrativo"
      />

      {/* Estadísticas */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          label="Fichas"
          value={stats.totalFichas}
          icon={<FolderOpen size={22} />}
          color="blue"
        />
        <StatCard
          label="Instructores"
          value={stats.totalInstructores}
          icon={<Users size={22} />}
          color="green"
        />
        <StatCard
          label="Aprendices"
          value={stats.totalAprendices}
          icon={<Users size={22} />}
          color="gray"
        />
        <StatCard
          label="Competencias"
          value={stats.totalMaterias}
          icon={<BookOpen size={22} />}
          color="yellow"
        />
      </div>

      {/* Acciones rápidas */}
      <div className="bg-white dark:bg-zinc-800  rounded-xl shadow-card p-4 md:p-6 ">
        <h2 className="text-lg font-bold text-gray-900 dark:text-white  mb-4">Acciones Rápidas</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          <Link
            to="/admin/fichas"
            className="flex items-center gap-3 p-4 bg-blue-50 hover:bg-blue-100 rounded-xl transition-colors"
          >
            <FolderOpen className="text-blue-600" size={24} />
            <div>
              <div className="font-semibold text-gray-900 dark:text-white ">Ver Fichas</div>
              <div className="text-sm text-gray-600">Gestionar fichas</div>
            </div>
          </Link>

          <Link
            to="/admin/usuarios"
            className="flex items-center gap-3 p-4 bg-green-50 hover:bg-green-100 rounded-xl transition-colors"
          >
            <Users className="text-green-600" size={24} />
            <div>
              <div className="font-semibold text-gray-900 dark:text-white ">Usuarios</div>
              <div className="text-sm text-gray-600">Instructores y aprendices</div>
            </div>
          </Link>

          <Link
            to="/admin/excusas"
            className="flex items-center gap-3 p-4 bg-purple-50 hover:bg-purple-100 rounded-xl transition-colors"
          >
            <FileText className="text-purple-600" size={24} />
            <div>
              <div className="font-semibold text-gray-900 dark:text-white ">Excusas</div>
              <div className="text-sm text-gray-600">Gestionar excusas</div>
            </div>
          </Link>

          <Link
            to="/admin/reportes"
            className="flex items-center gap-3 p-4 bg-orange-50 hover:bg-orange-100 rounded-xl transition-colors"
          >
            <BarChart3 className="text-orange-600" size={24} />
            <div>
              <div className="font-semibold text-gray-900 dark:text-white ">Reportes</div>
              <div className="text-sm text-gray-600">Exportar datos</div>
            </div>
          </Link>

          <Link
            to="/admin/papelera"
            className="flex items-center gap-3 p-4 bg-red-50 hover:bg-red-100 rounded-xl transition-colors"
          >
            <Trash2 className="text-red-600" size={24} />
            <div>
              <div className="font-semibold text-gray-900 dark:text-white ">Papelera</div>
              <div className="text-sm text-gray-600">Elementos eliminados</div>
            </div>
          </Link>
        </div>
      </div>

      {/* Lista de fichas */}
      <div className="bg-white dark:bg-zinc-800  rounded-xl shadow-card p-4 md:p-6 ">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-bold text-gray-900 dark:text-white ">Mis Fichas</h2>
          <Link
            to="/admin/fichas"
            className="text-sm text-blue-600 hover:text-blue-700 font-semibold"
          >
            Ver todas
          </Link>
        </div>

        {loading ? (
          <div className="text-center py-8 text-gray-500">Cargando...</div>
        ) : fichas.length === 0 ? (
          <div className="text-center py-8 text-gray-500">
            No tienes fichas asignadas aún
          </div>
        ) : (
          <div className="space-y-3">
            {fichas.slice(0, 5).map((ficha) => (
              <Link
                key={ficha.id}
                to={`/admin/fichas/${ficha.id}`}
                className="block p-4 bg-gray-50 hover:bg-gray-100 rounded-xl transition-colors"
              >
                <div className="flex items-center justify-between">
                  <div>
                    <div className="font-semibold text-gray-900 dark:text-white ">
                      Ficha {ficha.numero}
                    </div>
                    <div className="text-sm text-gray-600">{ficha.nombre}</div>
                  </div>
                  <div className="text-right text-sm text-gray-600">
                    <div>{ficha._count?.aprendices || 0} aprendices</div>
                    <div>{ficha._count?.materias || 0} competencias</div>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
