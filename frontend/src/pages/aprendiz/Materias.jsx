import React, { useState, useEffect } from 'react';
import fetchApi from '../../services/api';
import PageHeader from '../../components/PageHeader';
import EmptyState from '../../components/EmptyState';
import { BookOpen, CheckCircle, User, AlertTriangle } from 'lucide-react';

export default function AprendizMaterias() {
  const [materias, setMaterias] = useState([]);
  const [loading, setLoading] = useState(true);

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
        title="Mis Materias"
        subtitle={`${materias.length} materia${materias.length !== 1 ? 's' : ''} en tu ficha`}
      />

      {materias.length === 0 ? (
        <div className="card">
          <EmptyState
            icon={<BookOpen size={32}/>}
            title="Sin materias"
            description="Aún no hay materias registradas en tu ficha. Consulta con tu instructor."
          />
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {materias.map(m => {
            const totalSesiones = m.asistencias?.length || 0;
            const misPresencias = m.asistencias?.reduce((acc, a) => {
              const reg = a.registros?.find(r => r);
              return acc + (reg?.presente ? 1 : 0);
            }, 0) || 0;
            const hasActive = m.asistencias?.some(a => a.activa);

            return (
              <div key={m.id} className="card hover:shadow-card transition-all">
                <div className="flex items-start justify-between mb-3">
                  <div className="w-10 h-10 bg-blue-50 rounded-xl flex items-center justify-center shrink-0">
                    <BookOpen size={20} className="text-[#4285F4]"/>
                  </div>
                  <div className="flex gap-1">
                    <span className={`badge ${m.tipo === 'Técnica' ? 'badge-info' : 'badge-gray'}`}>{m.tipo}</span>
                    {hasActive && <span className="badge badge-success">Activa</span>}
                  </div>
                </div>
                <h3 className="font-bold text-gray-900 mb-1">{m.nombre}</h3>
                <div className="flex items-center gap-1.5 text-xs text-gray-500 mb-3">
                  <User size={12}/>
                  <span>{m.instructor?.fullName}</span>
                </div>
                <div className="grid grid-cols-2 gap-2 pt-3 border-t border-gray-100">
                  <div className="text-center">
                    <p className="text-lg font-bold text-gray-800">{totalSesiones}</p>
                    <p className="text-xs text-gray-400">Sesiones</p>
                  </div>
                  <div className="text-center">
                    <p className="text-lg font-bold text-[#34A853]">{misPresencias}</p>
                    <p className="text-xs text-gray-400">Asistencias</p>
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
