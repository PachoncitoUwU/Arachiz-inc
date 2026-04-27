import React, { useState, useEffect } from 'react';
import fetchApi from '../../services/api';
import PageHeader from '../../components/PageHeader';
import EmptyState from '../../components/EmptyState';
import { BookOpen, User } from 'lucide-react';
import { useSettings } from '../../context/SettingsContext';

const COLORES = [
  { bg: 'bg-blue-50',   icon: 'text-[#4285F4]',  border: 'border-blue-100',   accent: '#4285F4' },
  { bg: 'bg-green-50',  icon: 'text-[#34A853]',  border: 'border-green-100',  accent: '#34A853' },
  { bg: 'bg-purple-50', icon: 'text-purple-500', border: 'border-purple-100', accent: '#8b5cf6' },
  { bg: 'bg-yellow-50', icon: 'text-[#FBBC05]',  border: 'border-yellow-100', accent: '#FBBC05' },
  { bg: 'bg-red-50',    icon: 'text-[#EA4335]',  border: 'border-red-100',    accent: '#EA4335' },
  { bg: 'bg-pink-50',   icon: 'text-pink-500',   border: 'border-pink-100',   accent: '#ec4899' },
];
export default function AprendizMaterias() {
  const [materias, setMaterias] = useState([]);
  const [loading, setLoading]   = useState(true);
  const { t } = useSettings();

  useEffect(() => {
    fetchApi('/materias/my-materias')
      .then(d => setMaterias(d.materias))
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  if (loading) return (
    <div className="flex justify-center py-16">
      <div className="w-8 h-8 border-2 border-[#4285F4] border-t-transparent rounded-full animate-spin"/>
    </div>
  );

  return (
    <div className="animate-fade-in">
      <PageHeader
        title={t('subjects.title')}
        subtitle="Estas son todas tus materias"
      />

      {materias.length === 0 ? (
        <div className="card">
          <EmptyState icon={<BookOpen size={32}/>} title={t('subjects.emptyTitle')}
            description={t('subjects.emptyDesc')} />
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {materias.map((m, idx) => {
            const col          = COLORES[idx % COLORES.length];
            const totalSesiones = m.asistencias?.length || 0;
            const misPresencias = m.asistencias?.reduce((acc, a) => {
              const reg = a.registros?.find(r => r);
              return acc + (reg?.presente ? 1 : 0);
            }, 0) || 0;
            const hasActive = m.asistencias?.some(a => a.activa);
            const pct       = totalSesiones > 0 ? Math.round((misPresencias / totalSesiones) * 100) : 0;

            return (
              <div key={m.id} className="card hover:shadow-card transition-all border-t-4"
                style={{ borderTopColor: col.accent }}>
                <div className="flex items-start justify-between mb-3">
                  <div className={`w-10 h-10 ${col.bg} rounded-xl flex items-center justify-center shrink-0`}>
                    <BookOpen size={20} className={col.icon}/>
                  </div>
                  <div className="flex gap-1">
                    <span className={`badge ${m.tipo === 'Técnica' ? 'badge-info' : 'badge-gray'}`}>{m.tipo}</span>
                    {hasActive && <span className="badge badge-success">{t('subjects.active')}</span>}
                  </div>
                </div>
                <h3 className="font-bold text-gray-900 mb-1">{m.nombre}</h3>
                <div className="flex items-center gap-1.5 text-xs text-gray-500 mb-3">
                  <User size={12}/><span>{m.instructor?.fullName}</span>
                </div>
                {totalSesiones > 0 && (
                  <div className="mb-3">
                    <div className="flex justify-between text-xs text-gray-500 mb-1">
                      <span>{t('subjects.attendance')}</span>
                      <span className="font-semibold">{pct}%</span>
                    </div>
                    <div className="h-1.5 bg-gray-100 rounded-full overflow-hidden">
                      <div className="h-full rounded-full transition-all"
                        style={{ width: `${pct}%`, backgroundColor: col.accent }}/>
                    </div>
                  </div>
                )}
                <div className="grid grid-cols-2 gap-2 pt-3 border-t border-gray-100">
                  <div className="text-center">
                    <p className="text-lg font-bold text-gray-800">{totalSesiones}</p>
                    <p className="text-xs text-gray-400">{t('subjects.sessions')}</p>
                  </div>
                  <div className="text-center">
                    <p className="text-lg font-bold" style={{ color: col.accent }}>{misPresencias}</p>
                    <p className="text-xs text-gray-400">{t('subjects.attendances')}</p>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
