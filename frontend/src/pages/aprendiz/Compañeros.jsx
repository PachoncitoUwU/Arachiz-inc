import React, { useState, useEffect } from 'react';
import { Users, Search, Mail, Phone, MapPin, Award, Calendar, User } from 'lucide-react';
import fetchApi from '../../services/api';
import PageHeader from '../../components/PageHeader';
import EmptyState from '../../components/EmptyState';

export default function Compañeros() {
  const [fichas, setFichas] = useState([]);
  const [compañeros, setCompañeros] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [loading, setLoading] = useState(true);
  const [viewMode, setViewMode] = useState('grid'); // 'grid' o 'list'

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      setLoading(true);
      const { fichas } = await fetchApi('/fichas/my-fichas');
      setFichas(fichas);
      
      // Obtener todos los aprendices de mis fichas
      if (fichas.length > 0) {
        const allCompañeros = [];
        for (const ficha of fichas) {
          if (ficha.aprendices) {
            allCompañeros.push(...ficha.aprendices.map(a => ({ ...a, fichaNumero: ficha.numero, fichaNombre: ficha.nombre })));
          }
        }
        setCompañeros(allCompañeros);
      }
    } catch (err) {
      console.error('Error cargando compañeros:', err);
    } finally {
      setLoading(false);
    }
  };

  const filteredCompañeros = compañeros.filter(c =>
    c.fullName.toLowerCase().includes(searchTerm.toLowerCase()) ||
    c.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
    c.document.includes(searchTerm)
  );

  if (loading) {
    return (
      <div className="flex justify-center py-16">
        <div className="w-8 h-8 border-2 border-[#34A853] border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (fichas.length === 0) {
    return (
      <div className="animate-fade-in space-y-5">
        <PageHeader title="Mis Compañeros" subtitle="Conoce a tus compañeros de ficha" />
        <EmptyState
          icon={<Users size={48} />}
          title="No estás en ninguna ficha"
          description="Únete a una ficha para ver a tus compañeros"
        />
      </div>
    );
  }

  return (
    <div className="animate-fade-in space-y-5">
      <PageHeader title="Mis Compañeros" subtitle={`${compañeros.length} aprendices en tus fichas`} />

      {/* Barra de búsqueda y filtros */}
      <div className="card">
        <div className="flex flex-col sm:flex-row gap-3 items-center justify-between">
          <div className="relative flex-1 w-full">
            <Search size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
            <input
              type="text"
              placeholder="Buscar por nombre, email o documento..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="input-field pl-10 w-full"
            />
          </div>
          <div className="flex gap-2">
            <button
              onClick={() => setViewMode('grid')}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${
                viewMode === 'grid'
                  ? 'bg-[#4285F4] text-white'
                  : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
              }`}
            >
              Cuadrícula
            </button>
            <button
              onClick={() => setViewMode('list')}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${
                viewMode === 'list'
                  ? 'bg-[#4285F4] text-white'
                  : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
              }`}
            >
              Lista
            </button>
          </div>
        </div>
      </div>

      {/* Vista de compañeros */}
      {filteredCompañeros.length === 0 ? (
        <EmptyState
          icon={<Search size={48} />}
          title="No se encontraron compañeros"
          description="Intenta con otro término de búsqueda"
        />
      ) : viewMode === 'grid' ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {filteredCompañeros.map((compañero) => (
            <div
              key={compañero.id}
              className="card hover:shadow-lg transition-all group cursor-pointer"
            >
              <div className="flex flex-col items-center text-center">
                {compañero.avatarUrl ? (
                  <img
                    src={
                      compañero.avatarUrl.startsWith('http') || compañero.avatarUrl.startsWith('data:')
                        ? compañero.avatarUrl
                        : `${import.meta.env.VITE_SOCKET_URL || 'http://localhost:3000'}${compañero.avatarUrl}`
                    }
                    alt={compañero.fullName}
                    className="w-20 h-20 rounded-full object-cover mb-3 border-4 border-gray-100 group-hover:border-[#4285F4] transition-all"
                  />
                ) : (
                  <div className="w-20 h-20 rounded-full bg-gradient-to-br from-[#4285F4] to-[#34A853] flex items-center justify-center text-white font-bold text-2xl mb-3 group-hover:scale-110 transition-transform">
                    {compañero.fullName.split(' ').map(n => n[0]).slice(0, 2).join('').toUpperCase()}
                  </div>
                )}
                
                <h3 className="font-bold text-gray-900 mb-1 group-hover:text-[#4285F4] transition-colors">
                  {compañero.fullName}
                </h3>
                
                <div className="flex items-center gap-1 text-xs text-gray-500 mb-2">
                  <Award size={12} />
                  <span>Ficha {compañero.fichaNumero}</span>
                </div>

                <div className="w-full space-y-2 mt-3 pt-3 border-t border-gray-100">
                  <div className="flex items-center gap-2 text-xs text-gray-600">
                    <Mail size={12} className="text-gray-400 flex-shrink-0" />
                    <span className="truncate">{compañero.email}</span>
                  </div>
                  <div className="flex items-center gap-2 text-xs text-gray-600">
                    <User size={12} className="text-gray-400 flex-shrink-0" />
                    <span>{compañero.document}</span>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="card">
          <div className="space-y-2">
            {filteredCompañeros.map((compañero) => (
              <div
                key={compañero.id}
                className="flex items-center gap-4 p-4 rounded-xl bg-gray-50 hover:bg-gray-100 transition-all group cursor-pointer"
              >
                {compañero.avatarUrl ? (
                  <img
                    src={
                      compañero.avatarUrl.startsWith('http') || compañero.avatarUrl.startsWith('data:')
                        ? compañero.avatarUrl
                        : `${import.meta.env.VITE_SOCKET_URL || 'http://localhost:3000'}${compañero.avatarUrl}`
                    }
                    alt={compañero.fullName}
                    className="w-14 h-14 rounded-full object-cover border-2 border-gray-200 group-hover:border-[#4285F4] transition-all flex-shrink-0"
                  />
                ) : (
                  <div className="w-14 h-14 rounded-full bg-gradient-to-br from-[#4285F4] to-[#34A853] flex items-center justify-center text-white font-bold text-lg flex-shrink-0 group-hover:scale-110 transition-transform">
                    {compañero.fullName.split(' ').map(n => n[0]).slice(0, 2).join('').toUpperCase()}
                  </div>
                )}

                <div className="flex-1 min-w-0">
                  <h3 className="font-bold text-gray-900 group-hover:text-[#4285F4] transition-colors">
                    {compañero.fullName}
                  </h3>
                  <div className="flex flex-wrap gap-3 mt-1">
                    <div className="flex items-center gap-1 text-xs text-gray-500">
                      <Award size={12} />
                      <span>Ficha {compañero.fichaNumero}</span>
                    </div>
                    <div className="flex items-center gap-1 text-xs text-gray-500">
                      <Mail size={12} />
                      <span className="truncate">{compañero.email}</span>
                    </div>
                    <div className="flex items-center gap-1 text-xs text-gray-500">
                      <User size={12} />
                      <span>{compañero.document}</span>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
