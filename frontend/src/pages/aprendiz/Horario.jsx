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
  const [fichas, setFichas] = useState([]);
  const [selectedFichaId, setSelectedFichaId] = useState('all');
  const [loading, setLoading] = useState(true);
  const [noFicha, setNoFicha] = useState(false);
  const { t } = useSettings();

  useEffect(() => {
    const loadData = async () => {
      try {
        setLoading(true);
        const data = await fetchApi('/fichas/my-fichas');
        
        if (data.fichas.length === 0) {
          setNoFicha(true);
          setLoading(false);
          return;
        }
        
        setFichas(data.fichas);
        
        // Cargar horarios de todas las fichas
        const horariosPromises = data.fichas.map(f => 
          fetchApi(`/horarios/ficha/${f.id}`).then(d => ({
            fichaId: f.id,
            fichaNumero: f.numero,
            horarios: d.horarios
          }))
        );
        
        const allHorarios = await Promise.all(horariosPromises);
        const combinedHorarios = allHorarios.flatMap(h => 
          h.horarios.map(horario => ({
            ...horario,
            fichaId: h.fichaId,
            fichaNumero: h.fichaNumero
          }))
        );
        
        setHorarios(combinedHorarios);
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    
    loadData();
  }, []);

  // Filtrar horarios por ficha seleccionada
  const filteredHorarios = selectedFichaId === 'all' 
    ? horarios 
    : horarios.filter(h => h.fichaId === selectedFichaId);

  const byDia = DIAS.map(dia => ({
    dia,
    clases: filteredHorarios.filter(h => h.dia === dia).sort((a, b) => a.horaInicio.localeCompare(b.horaInicio))
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
      ) : (
        <>
          {/* Selector de ficha */}
          {fichas.length > 1 && (
            <div className="mb-4">
              <select 
                value={selectedFichaId} 
                onChange={(e) => setSelectedFichaId(e.target.value)}
                className="input-field max-w-xs"
              >
                <option value="all">Todas las fichas</option>
                {fichas.map(f => (
                  <option key={f.id} value={f.id}>
                    Ficha {f.numero} - {f.nombre}
                  </option>
                ))}
              </select>
            </div>
          )}

          {filteredHorarios.length === 0 ? (
            <div className="card">
              <EmptyState 
                icon={<Calendar size={32}/>} 
                title="Sin horario" 
                description={
                  selectedFichaId === 'all' 
                    ? "Tus instructores aún no han configurado horarios." 
                    : "Esta ficha aún no tiene horarios configurados."
                } 
              />
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
                          {fichas.length > 1 && selectedFichaId === 'all' && (
                            <p className="text-[10px] text-gray-400 mt-0.5">Ficha {c.fichaNumero}</p>
                          )}
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
        </>
      )}
    </div>
  );
}
