import React, { useState, useEffect } from 'react';
import fetchApi from '../../services/api';
import { FileText, Check, X, AlertCircle } from 'lucide-react';

export default function InstructorExcusas() {
  const [excusas, setExcusas] = useState([]);
  const [loading, setLoading] = useState(true);

  const loadExcusas = async () => {
    try {
      setLoading(true);
      const data = await fetchApi('/excusas');
      setExcusas(data.excusas);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadExcusas();
  }, []);

  const handleUpdateStatus = async (id, estado) => {
    try {
      await fetchApi(`/excusas/${id}/estado`, {
        method: 'PUT',
        body: JSON.stringify({ estado, respuesta: 'Revisado por instructor.' })
      });
      loadExcusas();
    } catch (err) {
      alert(err.message);
    }
  };

  const getStatusColor = (estado) => {
    switch (estado) {
      case 'Aprobada': return 'bg-green-100 text-google-green border-green-200';
      case 'Rechazada': return 'bg-red-100 text-google-red border-red-200';
      default: return 'bg-yellow-100 text-google-yellow border-yellow-200';
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-800">Evaluación de Excusas</h1>
        <p className="text-gray-500 text-sm mt-1">Revisa y responde las excusas de inasistencias</p>
      </div>

      {loading ? (
        <div className="p-8 text-center text-gray-500">Cargando excusas...</div>
      ) : excusas.length === 0 ? (
        <div className="card text-center p-12">
          <FileText size={48} className="mx-auto text-gray-300 mb-4" />
          <h3 className="text-lg font-medium text-gray-800">No hay excusas registradas</h3>
          <p className="text-gray-500 mt-2">Los aprendices no han enviado excusas aún.</p>
        </div>
      ) : (
        <div className="space-y-4">
          {excusas.map(excusa => (
            <div key={excusa.id} className="card hover:shadow-md transition-shadow">
              <div className="flex flex-col md:flex-row justify-between md:items-start gap-4">
                <div className="flex-1">
                  <div className="flex items-center gap-3 mb-2">
                    <span className="font-bold text-lg text-gray-800">{excusa.tipo}</span>
                    <span className={`px-2 py-1 text-xs font-bold rounded border ${getStatusColor(excusa.estado)}`}>
                      {excusa.estado}
                    </span>
                  </div>
                  <p className="text-gray-600 text-sm mb-3">{excusa.descripcion}</p>
                  <div className="text-xs text-gray-400 flex items-center gap-4">
                    <span>Fecha de Inasistencia: <strong className="text-gray-600">{excusa.fecha}</strong></span>
                    <span>Enviado: {new Date(excusa.createdAt).toLocaleDateString()}</span>
                  </div>
                </div>
                
                {excusa.estado === 'Pendiente' && (
                  <div className="flex gap-2">
                    <button 
                      onClick={() => handleUpdateStatus(excusa.id, 'Aprobada')}
                      className="btn-success aspect-square p-2 !rounded-full flex items-center justify-center"
                      title="Aprobar"
                    >
                      <Check size={20} />
                    </button>
                    <button 
                      onClick={() => handleUpdateStatus(excusa.id, 'Rechazada')}
                      className="btn-danger aspect-square p-2 !rounded-full flex items-center justify-center"
                      title="Rechazar"
                    >
                      <X size={20} />
                    </button>
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
