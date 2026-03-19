import React, { useState, useEffect } from 'react';
import fetchApi from '../../services/api';
import { Send, Clock, CheckCircle, XCircle } from 'lucide-react';

export default function AprendizExcusas() {
  const [excusas, setExcusas] = useState([]);
  const [loading, setLoading] = useState(true);
  const [formData, setFormData] = useState({ tipo: 'Incapacidad Médica', descripcion: '', fecha: '' });

  const loadExcusas = async () => {
    try {
      setLoading(true);
      const data = await fetchApi('/excusas/my-excusas');
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

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      await fetchApi('/excusas', {
        method: 'POST',
        body: JSON.stringify(formData)
      });
      alert('Excusa enviada exitosamente.');
      setFormData({ tipo: 'Incapacidad Médica', descripcion: '', fecha: '' });
      loadExcusas();
    } catch (err) {
      alert(err.message);
    }
  };

  const getStatusIcon = (estado) => {
    switch(estado) {
      case 'Pendiente': return <Clock size={16} className="text-google-yellow" />;
      case 'Aprobada': return <CheckCircle size={16} className="text-google-green" />;
      case 'Rechazada': return <XCircle size={16} className="text-google-red" />;
      default: return null;
    }
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-800">Enviar Excusa</h1>
          <p className="text-gray-500 text-sm mt-1">Justifica tus inasistencias enviando el soporte requerido</p>
        </div>

        <div className="card border-t-4 border-t-google-blue">
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Tipo de Excusa</label>
              <select 
                required 
                className="input-field"
                value={formData.tipo}
                onChange={e => setFormData({...formData, tipo: e.target.value})}
              >
                <option>Incapacidad Médica</option>
                <option>Calamidad Doméstica</option>
                <option>Problemas de Conectividad</option>
                <option>Motivos Laborales</option>
                <option>Otro</option>
              </select>
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Fecha de Inasistencia</label>
              <input 
                type="date" 
                required 
                className="input-field"
                value={formData.fecha}
                onChange={e => setFormData({...formData, fecha: e.target.value})}
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Descripción y Motivo</label>
              <textarea 
                required 
                rows="4"
                className="input-field resize-none"
                placeholder="Explica brevemente la razón de tu inasistencia..."
                value={formData.descripcion}
                onChange={e => setFormData({...formData, descripcion: e.target.value})}
              ></textarea>
            </div>

            <button type="submit" className="btn-primary w-full flex justify-center items-center gap-2 mt-2">
              <Send size={18} /> Enviar a Instructor
            </button>
          </form>
        </div>
      </div>

      <div className="space-y-6">
        <div>
           <h2 className="text-xl font-bold text-gray-800">Estado de Excusas</h2>
           <p className="text-gray-500 text-sm mt-1">Historial y respuesta del instructor</p>
        </div>

        {loading ? (
          <div className="text-center p-8 text-gray-500">Cargando...</div>
        ) : excusas.length === 0 ? (
          <div className="bg-gray-50 border border-dashed rounded-lg p-8 text-center text-gray-500">
             No has enviado ninguna excusa.
          </div>
        ) : (
          <div className="space-y-4">
            {excusas.map(excusa => (
              <div key={excusa.id} className="bg-white border rounded shadow-sm p-4">
                <div className="flex justify-between items-start mb-2">
                  <h3 className="font-bold text-gray-800">{excusa.tipo}</h3>
                  <span className={`flex items-center gap-1 text-xs font-medium px-2 py-1 rounded-full border bg-opacity-10
                    ${excusa.estado === 'Pendiente' ? 'text-yellow-700 bg-yellow-100 border-yellow-200' : 
                      excusa.estado === 'Aprobada' ? 'text-green-700 bg-green-100 border-green-200' : 
                      'text-red-700 bg-red-100 border-red-200'}`}>
                    {getStatusIcon(excusa.estado)}
                    {excusa.estado}
                  </span>
                </div>
                <p className="text-sm text-gray-600 mb-3">{excusa.descripcion}</p>
                <div className="text-xs text-gray-400 mb-2">Para inasistencia el: <strong className="text-gray-500">{excusa.fecha}</strong></div>
                
                {excusa.respuesta && (
                  <div className="mt-3 bg-gray-50 p-3 rounded text-sm text-gray-700 border-l-2 border-google-blue">
                    <strong>Respuesta instructor:</strong><br/>
                    {excusa.respuesta}
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
