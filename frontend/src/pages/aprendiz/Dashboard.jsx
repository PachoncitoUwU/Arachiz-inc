import React, { useEffect, useState, useContext } from 'react';
import { AuthContext } from '../../context/AuthContext';
import { BookOpen, Clock, AlertTriangle } from 'lucide-react';
import fetchApi from '../../services/api';
import { Link } from 'react-router-dom';

export default function AprendizDashboard() {
  const { user } = useContext(AuthContext);
  const [fichas, setFichas] = useState([]);
  const [materias, setMaterias] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadDashboardData = async () => {
      try {
        const [fichasData, materiasData] = await Promise.all([
          fetchApi(`/fichas/my-fichas`),
          fetchApi(`/materias/my-materias`)
        ]);
        setFichas(fichasData.fichas);
        setMaterias(materiasData.materias);
      } catch (err) {
        console.error('Error loading dashboard data', err);
      } finally {
        setLoading(false);
      }
    };
    loadDashboardData();
  }, [user.id]);

  if (loading) return <div className="p-8">Cargando dashboard...</div>;

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold text-gray-800">Hola, {user.email}</h1>
      </div>

      {fichas.length === 0 ? (
        <div className="bg-yellow-50 border border-yellow-200 text-yellow-800 p-4 rounded-lg flex items-start gap-4 shadow-sm">
          <AlertTriangle className="text-yellow-600 shrink-0 mt-0.5" size={24}/>
          <div>
            <h3 className="font-bold text-lg">No estás inscrito en ninguna ficha</h3>
            <p className="mt-1 text-sm">Pídele el código de invitación a tu instructor para unirte a una ficha.</p>
            <Link to="/aprendiz/asistencia" className="inline-block mt-3 bg-yellow-600 text-white px-4 py-2 rounded text-sm font-medium hover:bg-yellow-700 transition">
              Unirse a una Ficha
            </Link>
          </div>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="card border-t-4 border-t-google-blue">
            <h2 className="text-lg font-bold text-gray-800 mb-2">Mi Ficha Actual</h2>
            <div className="mt-4 space-y-2">
              <p className="flex justify-between border-b pb-2">
                <span className="text-gray-500">Número:</span> 
                <span className="font-medium text-gray-800">{fichas[0].numero}</span>
              </p>
              <p className="flex justify-between border-b pb-2">
                <span className="text-gray-500">Programa:</span> 
                <span className="font-medium text-gray-800">{fichas[0].nivel}</span>
              </p>
              <p className="flex justify-between pb-2">
                <span className="text-gray-500">Jornada:</span> 
                <span className="font-medium text-gray-800">{fichas[0].jornada}</span>
              </p>
            </div>
          </div>

          <div className="card border-t-4 border-t-google-green">
             <h2 className="text-lg font-bold text-gray-800 mb-2">Mis Materias</h2>
             {materias.length === 0 ? (
               <p className="text-gray-500 text-sm mt-4">Aún no hay materias registradas en tu ficha.</p>
             ) : (
               <ul className="mt-4 space-y-3">
                 {materias.map(mat => (
                   <li key={mat.id} className="flex items-center gap-3">
                     <BookOpen size={18} className="text-google-green" />
                     <span className="text-sm font-medium text-gray-700">{mat.nombre}</span>
                   </li>
                 ))}
               </ul>
             )}
          </div>
        </div>
      )}

      <div className="card">
        <h2 className="text-lg font-bold text-gray-800 mb-4 border-b pb-2 flex items-center gap-2">
          <Clock size={20} className="text-google-yellow"/> Accesos Rápidos
        </h2>
        <div className="flex gap-4">
          <Link to="/aprendiz/asistencia" className="btn-primary">Registrar Asistencia</Link>
          <Link to="/aprendiz/excusas" className="btn-secondary">Enviar Excusa</Link>
        </div>
      </div>
    </div>
  );
}
