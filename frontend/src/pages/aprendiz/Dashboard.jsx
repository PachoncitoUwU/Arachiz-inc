import React, { useEffect, useState, useContext } from 'react';
import { AuthContext } from '../../context/AuthContext';
import { Link } from 'react-router-dom';
import { BookOpen, Clock, FileText, AlertTriangle, ArrowRight, CheckCircle, XCircle } from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell } from 'recharts';
import fetchApi from '../../services/api';
import StatCard from '../../components/StatCard';

function CustomTooltip({ active, payload, label }) {
  if (!active || !payload?.length) return null;
  return (
    <div className="bg-white dark:bg-gray-800 rounded-xl shadow-card border border-gray-100 px-3 py-2 text-xs">
      <p className="font-bold text-gray-700 dark:text-gray-200 mb-1">{label}</p>
      {payload.map((p, i) => (
        <p key={i} style={{ color: p.color }}>{p.name}: <strong>{p.value}</strong></p>
      ))}
    </div>
  );
}

export default function AprendizDashboard() {
  const { user } = useContext(AuthContext);
  const [fichas, setFichas] = useState([]);
  const [materias, setMaterias] = useState([]);
  const [historial, setHistorial] = useState([]);
  const [excusas, setExcusas] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([
      fetchApi('/fichas/my-fichas'),
      fetchApi('/materias/my-materias'),
      fetchApi('/asistencias/my-history'),
      fetchApi('/excusas/my-excusas'),
    ]).then(([f, m, h, e]) => {
      setFichas(f.fichas);
      setMaterias(m.materias);
      setHistorial(h.registros);
      setExcusas(e.excusas);
    }).catch(console.error).finally(() => setLoading(false));
  }, []);

  const presentes  = historial.filter(r => r.presente).length;
  const ausentes   = historial.filter(r => !r.presente).length;
  const pendientes = excusas.filter(e => e.estado === 'Pendiente').length;
  const ficha      = fichas[0];

  // Gráfica por materia
  const chartData = materias.map(m => {
    const misRegistros = historial.filter(r => r.asistencia?.materia?.nombre === m.nombre);
    return {
      name: m.nombre.length > 12 ? m.nombre.substring(0, 12) + '…' : m.nombre,
      Presentes: misRegistros.filter(r => r.presente).length,
      Ausentes:  misRegistros.filter(r => !r.presente).length,
    };
  }).filter(d => d.Presentes + d.Ausentes > 0);

  if (loading) return (
    <div className="flex items-center justify-center h-64">
      <div className="w-8 h-8 border-2 border-[#34A853] border-t-transparent rounded-full animate-spin"/>
    </div>
  );

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Welcome */}
      <div className="card bg-gradient-to-r from-[#34A853] to-green-500 text-white border-0 shadow-card">
        <p className="text-green-100 text-sm font-medium">Bienvenido de vuelta</p>
        <h1 className="text-2xl font-bold mt-1">{user?.fullName || user?.email}</h1>
        <p className="text-green-100 text-sm mt-1">
          Aprendiz · {new Date().toLocaleDateString('es-CO', { weekday: 'long', day: 'numeric', month: 'long' })}
        </p>
      </div>

      {!ficha ? (
        <div className="card border border-yellow-200 bg-yellow-50 dark:bg-yellow-900/10 dark:border-yellow-800">
          <div className="flex items-start gap-4">
            <div className="w-10 h-10 bg-yellow-100 dark:bg-yellow-900/30 rounded-xl flex items-center justify-center shrink-0">
              <AlertTriangle size={20} className="text-yellow-600"/>
            </div>
            <div>
              <h3 className="font-bold text-yellow-800 dark:text-yellow-400">No estás inscrito en ninguna ficha</h3>
              <p className="text-sm text-yellow-700 dark:text-yellow-500 mt-1">Pídele el código de invitación a tu instructor para unirte.</p>
              <Link to="/aprendiz/asistencia" className="inline-block mt-3 btn-warning text-sm">
                Unirse a una Ficha
              </Link>
            </div>
          </div>
        </div>
      ) : (
        <>
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            <StatCard icon={<BookOpen size={22}/>}    label="Materias"           value={materias.length}  color="blue" />
            <StatCard icon={<CheckCircle size={22}/>} label="Asistencias"        value={presentes}        color="green" />
            <StatCard icon={<XCircle size={22}/>}     label="Ausencias"          value={ausentes}         color="red" />
            <StatCard icon={<FileText size={22}/>}    label="Excusas pendientes" value={pendientes}       color={pendientes > 0 ? 'yellow' : 'gray'} />
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Mi ficha */}
            <div className="card dark:bg-gray-900 dark:border-gray-800">
              <h2 className="font-bold text-gray-900 dark:text-white mb-4">Mi Ficha</h2>
              <div className="space-y-2">
                {[
                  { label: 'Número', value: ficha.numero },
                  { label: 'Nivel', value: ficha.nivel },
                  { label: 'Centro', value: ficha.centro },
                  { label: 'Jornada', value: ficha.jornada },
                ].map(({ label, value }) => (
                  <div key={label} className="flex justify-between items-center py-2 border-b border-gray-50 dark:border-gray-800 last:border-0">
                    <span className="text-sm text-gray-500 dark:text-gray-400">{label}</span>
                    <span className="text-sm font-semibold text-gray-800 dark:text-gray-200">{value}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Acciones rápidas */}
            <div className="card dark:bg-gray-900 dark:border-gray-800">
              <h2 className="font-bold text-gray-900 dark:text-white mb-4">Acciones rápidas</h2>
              <div className="grid grid-cols-2 gap-3">
                {[
                  { to: '/aprendiz/asistencia', icon: Clock,    label: 'Registrar Asistencia', color: 'bg-green-50 dark:bg-green-900/20 text-[#34A853]' },
                  { to: '/aprendiz/horario',    icon: Clock,    label: 'Ver Horario',          color: 'bg-blue-50 dark:bg-blue-900/20 text-[#4285F4]' },
                  { to: '/aprendiz/excusas',    icon: FileText, label: 'Enviar Excusa',        color: 'bg-yellow-50 dark:bg-yellow-900/20 text-[#FBBC05]' },
                  { to: '/aprendiz/materias',   icon: BookOpen, label: 'Mis Materias',         color: 'bg-purple-50 dark:bg-purple-900/20 text-purple-500' },
                ].map(({ to, icon: Icon, label, color }) => (
                  <Link key={to} to={to}
                    className="flex flex-col items-center gap-2 p-4 rounded-xl border border-gray-100 dark:border-gray-800 hover:shadow-soft hover:-translate-y-0.5 transition-all">
                    <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${color}`}>
                      <Icon size={20}/>
                    </div>
                    <span className="text-xs font-medium text-gray-700 dark:text-gray-300 text-center">{label}</span>
                  </Link>
                ))}
              </div>
            </div>
          </div>

          {/* Gráfica de asistencia por materia */}
          {chartData.length > 0 && (
            <div className="card dark:bg-gray-900 dark:border-gray-800">
              <h2 className="font-bold text-gray-900 dark:text-white mb-4">Asistencia por Materia</h2>
              <ResponsiveContainer width="100%" height={200}>
                <BarChart data={chartData} margin={{ top: 5, right: 10, left: -20, bottom: 5 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                  <XAxis dataKey="name" tick={{ fontSize: 10, fill: '#9ca3af' }} />
                  <YAxis tick={{ fontSize: 10, fill: '#9ca3af' }} />
                  <Tooltip content={<CustomTooltip />} />
                  <Bar dataKey="Presentes" fill="#34A853" radius={[4,4,0,0]} />
                  <Bar dataKey="Ausentes"  fill="#EA4335" radius={[4,4,0,0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          )}

          {/* Asistencias recientes */}
          {historial.length > 0 && (
            <div className="card dark:bg-gray-900 dark:border-gray-800">
              <div className="flex items-center justify-between mb-4">
                <h2 className="font-bold text-gray-900 dark:text-white">Asistencias Recientes</h2>
                <Link to="/aprendiz/asistencia" className="text-xs text-[#4285F4] hover:underline flex items-center gap-1">
                  Ver historial <ArrowRight size={12}/>
                </Link>
              </div>
              <div className="space-y-2">
                {historial.slice(0, 5).map(r => (
                  <div key={r.id} className="flex items-center justify-between p-3 rounded-xl bg-gray-50 dark:bg-gray-800">
                    <div className="flex items-center gap-3">
                      {r.presente
                        ? <CheckCircle size={16} className="text-[#34A853] shrink-0"/>
                        : <XCircle size={16} className="text-[#EA4335] shrink-0"/>
                      }
                      <div>
                        <p className="text-sm font-medium text-gray-800 dark:text-gray-200">{r.asistencia?.materia?.nombre}</p>
                        <p className="text-xs text-gray-400">{r.asistencia?.fecha} · {r.metodo}</p>
                      </div>
                    </div>
                    <span className={`badge ${r.presente ? 'badge-success' : 'badge-danger'}`}>
                      {r.presente ? 'Presente' : 'Ausente'}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
}
