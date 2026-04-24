import React, { useEffect, useState, useContext } from 'react';
import { AuthContext } from '../../context/AuthContext';
import { useSettings } from '../../context/SettingsContext';
import { Link } from 'react-router-dom';
import { Users, BookOpen, Clock, FileText, Plus, ArrowRight, Calendar } from 'lucide-react';
import fetchApi from '../../services/api';
import StatCard from '../../components/StatCard';

export default function InstructorDashboard() {
  const { user } = useContext(AuthContext);
  const { t, settings } = useSettings();
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
    <div className="space-y-6 animate-fade-in-up">
      {/* Welcome */}
      <div className="card-hover bg-gradient-to-r from-[#4285F4] via-blue-500 to-blue-600 text-white border-0 shadow-glow-blue animate-slide-in-left overflow-hidden relative">
        <div className="absolute top-0 right-0 w-64 h-64 bg-white/10 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2" />
        <div className="relative z-10">
          <p className="text-blue-100 text-sm font-medium animate-fade-in">{t('dashboard', 'welcome')}</p>
          <h1 className="text-3xl font-bold mt-1 animate-slide-in-left" style={{ animationDelay: '100ms' }}>{user?.fullName || user?.email}</h1>
          <p className="text-blue-100 text-sm mt-2 animate-fade-in" style={{ animationDelay: '200ms' }}>{t('dashboard', 'instructor')} · {new Date().toLocaleDateString(settings.language === 'en' ? 'en-US' : 'es-CO', { weekday: 'long', day: 'numeric', month: 'long' })}</p>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="animate-fade-in-up" style={{ animationDelay: '100ms' }}>
          <StatCard icon={<Users size={22}/>}    label={t('dashboard', 'activeGroups')}   value={fichas.length}        color="blue" />
        </div>
        <div className="animate-fade-in-up" style={{ animationDelay: '200ms' }}>
          <StatCard icon={<BookOpen size={22}/>} label={t('dashboard', 'mySubjects')}     value={materias.length}      color="green" />
        </div>
        <div className="animate-fade-in-up" style={{ animationDelay: '300ms' }}>
          <StatCard icon={<Users size={22}/>}    label={t('dashboard', 'totalStudents')} value={totalAprendices}      color="gray" />
        </div>
        <div className="animate-fade-in-up" style={{ animationDelay: '400ms' }}>
          <StatCard icon={<FileText size={22}/>} label={t('dashboard', 'pendingExcuses')} value={pendientes}         color={pendientes > 0 ? 'yellow' : 'gray'} />
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Fichas */}
        <div className="card-hover animate-slide-in-left" style={{ animationDelay: '500ms' }}>
          <div className="flex items-center justify-between mb-4">
            <h2 className="font-bold text-gray-900 dark:text-white text-lg">{t('dashboard', 'myGroups')}</h2>
            <Link to="/instructor/fichas" className="text-xs text-[#4285F4] hover:text-blue-600 hover:underline flex items-center gap-1 transition-all">
              {t('dashboard', 'seeAll')} <ArrowRight size={12} className="animate-bounce-x"/>
            </Link>
          </div>
          {fichas.length === 0 ? (
            <div className="text-center py-8 text-gray-400 text-sm animate-fade-in">
              <Users size={32} className="mx-auto mb-2 opacity-30 animate-pulse"/>
              {t('dashboard', 'noGroups')}
            </div>
          ) : (
            <div className="space-y-2">
              {fichas.slice(0, 4).map((f, idx) => (
                <div key={f.id} className="flex items-center justify-between p-3 rounded-xl bg-gradient-to-r from-gray-50 to-gray-100 dark:from-gray-800 dark:to-gray-700 hover:from-blue-50 hover:to-blue-100 dark:hover:from-blue-900/20 dark:hover:to-blue-800/20 transition-all duration-300 hover:shadow-md hover:-translate-y-0.5 animate-slide-in-right border border-transparent hover:border-blue-200 dark:hover:border-blue-700" style={{ animationDelay: `${idx * 100}ms` }}>
                  <div>
                    <p className="font-semibold text-sm text-gray-800 dark:text-gray-200">{t('dashboard', 'groupPrefix')} {f.numero}</p>
                    <p className="text-xs text-gray-400">{f.nivel} · {f.jornada}</p>
                  </div>
                  <div className="text-right">
                    <span className="badge badge-info animate-scale-in">{f.aprendices?.length || 0} {t('dashboard', 'studentsLower')}</span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Acciones rápidas */}
        <div className="card-hover animate-slide-in-right" style={{ animationDelay: '500ms' }}>
          <h2 className="font-bold text-gray-900 dark:text-white mb-4 text-lg">{t('dashboard', 'quickActions')}</h2>
          <div className="grid grid-cols-2 gap-3">
            {[
              { to: '/instructor/fichas',     icon: Plus,     label: t('dashboard', 'actionNewGroup'),      color: 'bg-blue-50 text-[#4285F4] dark:bg-blue-900/20', hoverColor: 'hover:bg-blue-100 dark:hover:bg-blue-900/30' },
              { to: '/instructor/asistencia', icon: Clock,    label: t('dashboard', 'actionStartSession'),   color: 'bg-green-50 text-[#34A853] dark:bg-green-900/20', hoverColor: 'hover:bg-green-100 dark:hover:bg-green-900/30' },
              { to: '/instructor/excusas',    icon: FileText, label: t('dashboard', 'actionViewExcuses'),      color: pendientes > 0 ? 'bg-yellow-50 text-[#FBBC05] dark:bg-yellow-900/20' : 'bg-gray-50 text-gray-500 dark:bg-gray-800', hoverColor: pendientes > 0 ? 'hover:bg-yellow-100 dark:hover:bg-yellow-900/30' : 'hover:bg-gray-100 dark:hover:bg-gray-700' },
              { to: '/instructor/horario',    icon: Calendar, label: t('dashboard', 'actionSchedule'),       color: 'bg-purple-50 text-purple-500 dark:bg-purple-900/20', hoverColor: 'hover:bg-purple-100 dark:hover:bg-purple-900/30' },
            ].map(({ to, icon: Icon, label, color, hoverColor }, idx) => (
              <Link key={to} to={to}
                className={`flex flex-col items-center gap-2 p-4 rounded-xl border border-gray-100 dark:border-gray-700 ${hoverColor} hover:shadow-lg transition-all duration-300 hover:-translate-y-1 hover:scale-105 animate-scale-in group`}
                style={{ animationDelay: `${idx * 100}ms` }}>
                <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${color} transition-all duration-300 group-hover:scale-110 group-hover:shadow-md`}>
                  <Icon size={22} className="transition-transform duration-300 group-hover:rotate-12"/>
                </div>
                <span className="text-xs font-medium text-gray-700 dark:text-gray-300 text-center">{label}</span>
                {label === t('dashboard', 'actionViewExcuses') && pendientes > 0 && (
                  <span className="badge badge-pending text-xs animate-pulse">{pendientes} {t('dashboard', 'pendingLower')}</span>
                )}
              </Link>
            ))}
          </div>
        </div>
      </div>

      {/* Materias recientes */}
      {materias.length > 0 && (
        <div className="card-hover animate-fade-in-up" style={{ animationDelay: '600ms' }}>
          <div className="flex items-center justify-between mb-4">
            <h2 className="font-bold text-gray-900 dark:text-white text-lg">{t('dashboard', 'mySubjects')}</h2>
            <Link to="/instructor/materias" className="text-xs text-[#4285F4] hover:text-blue-600 hover:underline flex items-center gap-1 transition-all">
              {t('dashboard', 'seeAll')} <ArrowRight size={12} className="animate-bounce-x"/>
            </Link>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
            {materias.slice(0, 6).map((m, idx) => (
              <div key={m.id} className="p-4 rounded-xl bg-gradient-to-br from-gray-50 to-gray-100 dark:from-gray-800 dark:to-gray-700 border border-gray-100 dark:border-gray-700 hover:shadow-lg hover:-translate-y-1 transition-all duration-300 animate-scale-in group hover:border-blue-200 dark:hover:border-blue-700" style={{ animationDelay: `${idx * 100}ms` }}>
                <p className="font-semibold text-sm text-gray-800 dark:text-gray-200 truncate group-hover:text-[#4285F4] transition-colors">{m.nombre}</p>
                <p className="text-xs text-gray-400 mt-1">{t('dashboard', 'groupPrefix')} {m.ficha?.numero}</p>
                <span className={`badge mt-2 ${m.tipo === 'Técnica' ? 'badge-info' : 'badge-gray'} animate-fade-in`}>{m.tipo}</span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
