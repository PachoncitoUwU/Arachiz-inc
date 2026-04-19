import React, { useState, useEffect } from 'react';
import fetchApi from '../../services/api';
import PageHeader from '../../components/PageHeader';
import EmptyState from '../../components/EmptyState';
import { Calendar, Clock, User, AlertTriangle } from 'lucide-react';
import { useSettings } from '../../context/SettingsContext';

const DIAS = ['Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado'];
const COLORES = [
  { bg: 'bg-blue-50',   text: 'text-blue-800',   border: 'border-blue-200' },
  { bg: 'bg-green-50',  text: 'text-green-800',  border: 'border-green-200' },
  { bg: 'bg-purple-50', text: 'text-purple-800', border: 'border-purple-200' },
  { bg: 'bg-yellow-50', text: 'text-yellow-800', border: 'border-yellow-200' },
  { bg: 'bg-red-50',    text: 'text-red-800',    border: 'border-red-200' },
  { bg: 'bg-pink-50',   text: 'text-pink-800',   border: 'border-pink-200' },
];

export default function AprendizHorario() {
  const [horarios, setHorarios] = useState([]);
  const [fichaId, setFichaId] = useState(null);
  const [loading, setLoading] = useState(true);
  const [noFicha, setNoFicha] = useState(false);
  const { t } = useSettings();

  useEffect(() => {
    fetchApi('/fichas/my-fichas').then(d => {
      if (d.fichas.length === 0) { setNoFicha(true); setLoading(false); return; }
      const id = d.fichas[0].id;
      setFichaId(id);
      return fetchApi(`/horarios/ficha/${id}`);
    }).then(d => {
      if (d) setHorarios(d.horarios);
    }).catch(console.error).finally(() => setLoading(false));
  }, []);

  const byDia = DIAS.map(dia => ({
    dia,
    clases: horarios.filter(h => h.dia === dia).sort((a, b) => a.horaInicio.localeCompare(b.horaInicio))
  })).filter(d => d.clases.length > 0);

  if (loading) return (
    <div className="flex justify-center py-16">
      <div className="w-8 h-8 border-2 border-[#4285F4] border-t-transparent rounded-full animate-spin"/>
    </div>
  );

  return (
    <div className="animate-fade-in">
      <PageHeader title={t('schedule.title')} subtitle={t('schedule.subtitle')} />

      {noFicha ? (
        <div className="card border border-yellow-200 bg-yellow-50">
          <div className="flex items-center gap-3">
            <AlertTriangle size={20} className="text-yellow-600"/>
            <p className="text-sm text-yellow-800">No estás inscrito en ninguna ficha. Únete primero para ver tu horario.</p>
          </div>
        </div>
      ) : horarios.length === 0 ? (
        <div className="card">
          <EmptyState icon={<Calendar size={32}/>} title="Sin horario" description="Tu instructor aún no ha configurado el horario de la ficha." />
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {byDia.map(({ dia, clases }) => (
            <div key={dia} className="card">
              <div className="flex items-center gap-2 mb-3 pb-2 border-b border-gray-100">
                <div className="w-7 h-7 bg-green-50 rounded-lg flex items-center justify-center">
                  <Calendar size={14} className="text-[#34A853]"/>
                </div>
                <span className="font-bold text-sm text-gray-800">{dia}</span>
              </div>
              <div className="space-y-2">
                {clases.map((c, idx) => {
                  const col = COLORES[idx % COLORES.length];
                  return (
                    <div key={c.id} className={`p-2.5 rounded-xl border ${col.bg} ${col.border}`}>
                      <p className={`text-xs font-bold ${col.text}`}>{c.materia?.nombre}</p>
                      <div className="flex items-center gap-1 text-xs text-gray-500 mt-1">
                        <Clock size={11}/> {c.horaInicio} – {c.horaFin}
                      </div>
                      <div className="flex items-center gap-1 text-xs text-gray-400 mt-0.5">
                        <User size={11}/> {c.materia?.instructor?.fullName}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
