import React, { useEffect, useState, useContext } from 'react';
import { AuthContext } from '../../context/AuthContext';
import { Users, BookOpen, Clock, FileText } from 'lucide-react';
import fetchApi from '../../services/api';
import { Link } from 'react-router-dom';

export default function InstructorDashboard() {
  const { user } = useContext(AuthContext);
  const [fichas, setFichas] = useState([]);
  const [materias, setMaterias] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadDashboardData = async () => {
      try {
        const [fichasData, materiasData] = await Promise.all([
          fetchApi('/fichas/my-fichas'),
          fetchApi('/materias/my-materias')
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
  }, []);

  if (loading) return <div className="p-8">Cargando dashboard...</div>;

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold text-gray-800">Hola, {user.email}</h1>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="card flex items-center p-6 border-l-4 border-google-blue">
          <div className="p-3 rounded-full bg-blue-100 text-google-blue mr-4">
            <Users size={24} />
          </div>
          <div>
            <p className="text-sm text-gray-500 font-medium">Mis Fichas</p>
            <p className="text-2xl font-bold text-gray-800">{fichas.length}</p>
          </div>
        </div>

        <div className="card flex items-center p-6 border-l-4 border-google-green">
          <div className="p-3 rounded-full bg-green-100 text-google-green mr-4">
            <BookOpen size={24} />
          </div>
          <div>
            <p className="text-sm text-gray-500 font-medium">Mis Materias</p>
            <p className="text-2xl font-bold text-gray-800">{materias.length}</p>
          </div>
        </div>

        <div className="card flex items-center p-6 border-l-4 border-google-yellow">
          <div className="p-3 rounded-full bg-yellow-100 text-google-yellow mr-4">
            <Clock size={24} />
          </div>
          <div>
            <p className="text-sm text-gray-500 font-medium">Asistencias Hoy</p>
            <p className="text-2xl font-bold text-gray-800">--</p>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="card">
          <h2 className="text-lg font-bold text-gray-800 mb-4 border-b pb-2">Fichas Activas</h2>
          {fichas.length === 0 ? (
            <p className="text-gray-500 text-sm">No tienes fichas asignadas.</p>
          ) : (
            <ul className="space-y-3">
              {fichas.map(ficha => (
                <li key={ficha.id} className="flex justify-between items-center p-3 hover:bg-gray-50 rounded border border-gray-100">
                  <div>
                    <p className="font-medium text-gray-800">Ficha {ficha.numero}</p>
                    <p className="text-xs text-gray-500">{ficha.nivel} - {ficha.jornada}</p>
                  </div>
                  <span className="text-xs font-semibold bg-gray-100 text-gray-600 px-2 py-1 rounded">
                    Código: {ficha.code}
                  </span>
                </li>
              ))}
            </ul>
          )}
          <div className="mt-4 pt-4 border-t border-gray-100 text-center">
             <Link to="/instructor/fichas" className="text-sm text-google-blue hover:underline">Gestionar Fichas</Link>
          </div>
        </div>

        <div className="card">
          <h2 className="text-lg font-bold text-gray-800 mb-4 border-b pb-2">Accesos Rápidos</h2>
          <div className="grid grid-cols-2 gap-3">
             <Link to="/instructor/asistencia" className="flex flex-col items-center justify-center p-4 border border-gray-200 rounded hover:bg-blue-50 hover:border-google-blue transition-colors text-gray-700 hover:text-google-blue">
                <Clock size={24} className="mb-2" />
                <span className="text-sm font-medium">Iniciar Asistencia</span>
             </Link>
             <Link to="/instructor/fichas" className="flex flex-col items-center justify-center p-4 border border-gray-200 rounded hover:bg-green-50 hover:border-google-green transition-colors text-gray-700 hover:text-google-green">
                <Users size={24} className="mb-2" />
                <span className="text-sm font-medium">Nueva Ficha</span>
             </Link>
             <Link to="/instructor/excusas" className="flex flex-col items-center justify-center p-4 border border-gray-200 rounded hover:bg-yellow-50 hover:border-google-yellow transition-colors text-gray-700 hover:text-google-yellow">
                <FileText size={24} className="mb-2" />
                <span className="text-sm font-medium">Revisar Excusas</span>
             </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
