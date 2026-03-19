import React, { useEffect, useState, useContext } from 'react';
import { AuthContext } from '../../context/AuthContext';
import { Link } from 'react-router-dom';
import { Users, BookOpen, Clock, FileText, Plus, ArrowRight, Calendar } from 'lucide-react';
import fetchApi from '../../services/api';
import StatCard from '../../components/StatCard';

export default function InstructorDashboard() {
  const { user } = useContext(AuthContext);
  const [fichas, setFichas] = useState([]);
  const [materias, setMaterias] = useState([]);
  const [excusas, setExcusas] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([
      fetchApi('/fichas/my-fichas'),
      fetchApi('/materias/my-materias'),
      fetchApi('/excusas'),
    ]).then(([f, m, e]) => {
      setFichas(f.fichas);
      setMaterias(m.materias);
      setExcusas(e.excusas);
    }).catch(console.error).finally(() => setLoading(false));
  }, []);

  const pendientes = excusas.filter(e => e.estado === 'Pendiente').length;
  const totalAprendices = fichas.reduce((acc, f) => acc + (f.aprendices?.length || 0), 0);

  if (loading) return (
    <div className="flex items-center justify-center h-64">
      <div className="w-8 h-8 border-2 border-[#4285F4] border-t-transparent rounded-full animate-spin" />
    </div>
  );

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Welcome */}
      <div className="card bg-gradient-to-r from-[#4285F4] to-blue-500 text-white border-0">
        <p className="text-blue-100 text-sm font-medium">Bienvenido de vuelta</p>
        <h1 className="text-2xl font-bold mt-1">{user?.fullName || user?.email}</h1>
        <p className="text-blue-100 text-sm mt-1">Instructor · {new Date().toLocaleDateString('es-CO', { weekday: 'long', day: 'numeric', month: 'long' })}</p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard icon={<Users size={22}/>}    label="Fichas activas"   value={fichas.length}        color="blue" />
        <StatCard icon={<BookOpen size={22}/>} label="Mis materias"     value={materias.length}      color="green" />
        <StatCard icon={<Users size={22}/>}    label="Total aprendices" value={totalAprendices}      color="gray" />
        <StatCard icon={<FileText size={22}/>} label="Excusas pendientes" value={pendientes}         color={pendientes > 0 ? 'yellow' : 'gray'} />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Fichas */}
        <div className="card">
          <div className="flex items-center justify-between mb-4">
            <h2 className="font-bold text-gray-900">Mis Fichas</h2>
            <Link to="/instructor/fichas" className="text-xs text-[#4285F4] hover:underline flex items-center gap-1">
              Ver todas <ArrowRight size={12}/>
            </Link>
          </div>
          {fichas.length === 0 ? (
            <div className="text-center py-8 text-gray-400 text-sm">
              <Users size={32} className="mx-auto mb-2 opacity-30"/>
              No tienes fichas aún
            </div>
          ) : (
            <div className="space-y-2">
              {fichas.slice(0, 4).map(f => (
                <div key={f.id} className="flex items-center justify-between p-3 rounded-xl bg-gray-50 hover:bg-gray-100 transition-colors">
                  <div>
                    <p className="font-semibold text-sm text-gray-800">Ficha {f.numero}</p>
                    <p className="text-xs text-gray-400">{f.nivel} · {f.jornada}</p>
                  </div>
                  <div className="text-right">
                    <span className="badge badge-info">{f.aprendices?.length || 0} aprendices</span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Acciones rápidas */}
        <div className="card">
          <h2 className="font-bold text-gray-900 mb-4">Acciones rápidas</h2>
          <div className="grid grid-cols-2 gap-3">
            {[
              { to: '/instructor/fichas',     icon: Plus,     label: 'Nueva Ficha',      color: 'bg-blue-50 text-[#4285F4]' },
              { to: '/instructor/asistencia', icon: Clock,    label: 'Iniciar Sesión',   color: 'bg-green-50 text-[#34A853]' },
              { to: '/instructor/excusas',    icon: FileText, label: 'Ver Excusas',      color: pendientes > 0 ? 'bg-yellow-50 text-[#FBBC05]' : 'bg-gray-50 text-gray-500' },
              { to: '/instructor/horario',    icon: Calendar, label: 'Mi Horario',       color: 'bg-purple-50 text-purple-500' },
            ].map(({ to, icon: Icon, label, color }) => (
              <Link key={to} to={to}
                className="flex flex-col items-center gap-2 p-4 rounded-xl border border-gray-100 hover:shadow-soft transition-all hover:-translate-y-0.5">
                <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${color}`}>
                  <Icon size={20}/>
                </div>
                <span className="text-xs font-medium text-gray-700 text-center">{label}</span>
                {label === 'Ver Excusas' && pendientes > 0 && (
                  <span className="badge badge-pending text-xs">{pendientes} pendientes</span>
                )}
              </Link>
            ))}
          </div>
        </div>
      </div>

      {/* Materias recientes */}
      {materias.length > 0 && (
        <div className="card">
          <div className="flex items-center justify-between mb-4">
            <h2 className="font-bold text-gray-900">Mis Materias</h2>
            <Link to="/instructor/materias" className="text-xs text-[#4285F4] hover:underline flex items-center gap-1">
              Ver todas <ArrowRight size={12}/>
            </Link>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
            {materias.slice(0, 6).map(m => (
              <div key={m.id} className="p-3 rounded-xl bg-gray-50 border border-gray-100">
                <p className="font-semibold text-sm text-gray-800 truncate">{m.nombre}</p>
                <p className="text-xs text-gray-400 mt-0.5">Ficha {m.ficha?.numero}</p>
                <span className={`badge mt-2 ${m.tipo === 'Técnica' ? 'badge-info' : 'badge-gray'}`}>{m.tipo}</span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
