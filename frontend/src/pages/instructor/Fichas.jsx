import React, { useState, useEffect } from 'react';
import fetchApi from '../../services/api';
import { Users, Plus, Hash, Clock, MapPin, Layers } from 'lucide-react';

export default function InstructorFichas() {
  const [fichas, setFichas] = useState([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [loading, setLoading] = useState(true);
  const [formData, setFormData] = useState({
    numero: '', nivel: 'Tecnólogo', centro: '', jornada: 'Mañana'
  });

  const loadFichas = async () => {
    try {
      setLoading(true);
      const data = await fetchApi('/fichas/my-fichas');
      setFichas(data.fichas);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadFichas();
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      await fetchApi('/fichas', {
        method: 'POST',
        body: JSON.stringify(formData),
      });
      setIsModalOpen(false);
      setFormData({ numero: '', nivel: 'Tecnólogo', centro: '', jornada: 'Mañana' });
      loadFichas();
    } catch (err) {
      alert(err.message);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-gray-800">Gestión de Fichas</h1>
          <p className="text-gray-500 text-sm mt-1">Administra tus grupos y aprendices</p>
        </div>
        <button 
          onClick={() => setIsModalOpen(true)}
          className="btn-primary flex items-center gap-2"
        >
          <Plus size={18} /> Nueva Ficha
        </button>
      </div>

      {loading ? (
        <div className="p-8 text-center text-gray-500">Cargando fichas...</div>
      ) : fichas.length === 0 ? (
        <div className="card text-center p-12">
          <Users size={48} className="mx-auto text-gray-300 mb-4" />
          <h3 className="text-lg font-medium text-gray-800">No tienes fichas todavía</h3>
          <p className="text-gray-500 mt-2 mb-6">Crea tu primera ficha para empezar a gestionar asistencias.</p>
          <button onClick={() => setIsModalOpen(true)} className="btn-primary">Crear Ficha</button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
          {fichas.map(ficha => (
            <div key={ficha.id} className="card hover:shadow-md transition-shadow">
              <div className="flex justify-between items-start mb-4">
                <div className="bg-blue-50 text-google-blue px-3 py-1 rounded text-lg font-bold">
                  {ficha.numero}
                </div>
                <div className="text-right">
                  <span className="text-xs font-semibold bg-gray-100 text-gray-600 px-2 py-1 rounded">
                    Código: <span className="text-google-blue font-mono">{ficha.code}</span>
                  </span>
                </div>
              </div>
              
              <div className="space-y-2 mt-4 text-sm text-gray-600">
                <p className="flex items-center gap-2"><Layers size={16} className="text-gray-400"/> Nivel: {ficha.nivel}</p>
                <p className="flex items-center gap-2"><MapPin size={16} className="text-gray-400"/> Centro: {ficha.centro}</p>
                <p className="flex items-center gap-2"><Clock size={16} className="text-gray-400"/> Jornada: {ficha.jornada}</p>
                <div className="pt-3 mt-3 border-t border-gray-100 flex items-center justify-between">
                  <span className="flex items-center gap-1 text-google-blue font-medium"><Users size={16}/> {ficha.aprendices.length} Aprendices</span>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Modal Nueva Ficha */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg shadow-lg w-full max-w-md p-6">
            <h2 className="text-xl font-bold text-gray-800 mb-4">Crear Nueva Ficha</h2>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Número de Ficha</label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-gray-400"><Hash size={16}/></div>
                  <input required type="text" className="input-field pl-9" placeholder="2345678"
                    value={formData.numero} onChange={e => setFormData({...formData, numero: e.target.value})} />
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Centro de Formación</label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-gray-400"><MapPin size={16}/></div>
                  <input required type="text" className="input-field pl-9" placeholder="CTPI"
                    value={formData.centro} onChange={e => setFormData({...formData, centro: e.target.value})} />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Nivel</label>
                  <select className="input-field" value={formData.nivel} onChange={e => setFormData({...formData, nivel: e.target.value})}>
                    <option>Técnico</option>
                    <option>Tecnólogo</option>
                    <option>Especialización</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Jornada</label>
                  <select className="input-field" value={formData.jornada} onChange={e => setFormData({...formData, jornada: e.target.value})}>
                    <option>Mañana</option>
                    <option>Tarde</option>
                    <option>Noche</option>
                  </select>
                </div>
              </div>
              <div className="flex gap-3 justify-end mt-6">
                <button type="button" onClick={() => setIsModalOpen(false)} className="btn-secondary">Cancelar</button>
                <button type="submit" className="btn-primary">Guardar Ficha</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
