import React, { useEffect, useState, useCallback } from 'react';
import {
  ClipboardList, Filter, Search, ChevronLeft, ChevronRight,
  User, Calendar, Tag, FileText, RefreshCw
} from 'lucide-react';
import PageHeader from '../../components/PageHeader';
import EmptyState from '../../components/EmptyState';
import fetchApi from '../../services/api';

const PAGE_SIZE = 50;

// Mapa de colores por tipo de entidad
const ENTIDAD_COLOR = {
  ficha:      'bg-blue-100 text-blue-700',
  materia:    'bg-purple-100 text-purple-700',
  aprendiz:   'bg-green-100 text-green-700',
  instructor: 'bg-yellow-100 text-yellow-700',
  excusa:     'bg-red-100 text-red-700',
  horario:    'bg-orange-100 text-orange-700',
  Ficha:      'bg-blue-100 text-blue-700',
  Materia:    'bg-purple-100 text-purple-700',
};

// Mapa de colores por tipo de evento
const EVENTO_COLOR = {
  crear:                  'bg-emerald-100 text-emerald-700',
  CREACION_IMPORTACION:   'bg-emerald-100 text-emerald-700',
  IMPORTACION_CREAR:      'bg-emerald-100 text-emerald-700',
  IMPORTACION_MATERIA:    'bg-emerald-100 text-emerald-700',
  IMPORTACION_UNIR:       'bg-teal-100 text-teal-700',
  actualizar:             'bg-sky-100 text-sky-700',
  cambio_lider:           'bg-sky-100 text-sky-700',
  cambio_instructor:      'bg-sky-100 text-sky-700',
  regenerar_codigo:       'bg-sky-100 text-sky-700',
  unirse:                 'bg-indigo-100 text-indigo-700',
  enviar_papelera:        'bg-orange-100 text-orange-700',
  quitar_lider:           'bg-orange-100 text-orange-700',
  eliminar:               'bg-red-100 text-red-700',
};

function getBadgeColor(map, key, fallback = 'bg-gray-100 text-gray-600') {
  return map[key] || fallback;
}

function formatFecha(fecha) {
  return new Date(fecha).toLocaleString('es-CO', {
    year: 'numeric', month: 'short', day: 'numeric',
    hour: '2-digit', minute: '2-digit'
  });
}

export default function AdminAuditoria() {
  const [historial, setHistorial] = useState([]);
  const [total, setTotal] = useState(0);
  const [fichas, setFichas] = useState([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(0);

  // Filtros
  const [fichaFiltro, setFichaFiltro] = useState('');
  const [entidadFiltro, setEntidadFiltro] = useState('');
  const [busqueda, setBusqueda] = useState('');
  const [busquedaInput, setBusquedaInput] = useState('');

  const totalPages = Math.max(1, Math.ceil(total / PAGE_SIZE));

  const cargarHistorial = useCallback(async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams({
        limit: PAGE_SIZE,
        offset: page * PAGE_SIZE,
        ...(fichaFiltro  && { fichaId: fichaFiltro }),
        ...(entidadFiltro && { entidad: entidadFiltro }),
        ...(busqueda      && { busqueda }),
      });
      const data = await fetchApi(`/admin/historial?${params}`);
      setHistorial(data.historial || []);
      setTotal(data.total || 0);
      if (data.fichas?.length) setFichas(data.fichas);
    } catch (err) {
      console.error('Error cargando auditoría:', err);
    } finally {
      setLoading(false);
    }
  }, [page, fichaFiltro, entidadFiltro, busqueda]);

  useEffect(() => {
    cargarHistorial();
  }, [cargarHistorial]);

  // Resetear página al cambiar filtros
  useEffect(() => { setPage(0); }, [fichaFiltro, entidadFiltro, busqueda]);

  const handleBuscar = (e) => {
    e.preventDefault();
    setBusqueda(busquedaInput);
  };

  const entidadesDisponibles = [
    '', 'ficha', 'materia', 'instructor', 'aprendiz', 'excusa', 'horario', 'Ficha', 'Materia'
  ];

  return (
    <div className="space-y-6">
      <PageHeader
        title="Auditoría"
        subtitle={`Registro de todos los cambios en tus fichas — ${total} evento${total !== 1 ? 's' : ''} en total`}
      />

      {/* Filtros */}
      <div className="bg-white dark:bg-zinc-800 rounded-xl shadow-card p-4 space-y-3">
        <div className="flex flex-wrap items-center gap-3">
          <Filter size={18} className="text-gray-400 shrink-0" />

          {/* Filtro por ficha */}
          <select
            value={fichaFiltro}
            onChange={(e) => setFichaFiltro(e.target.value)}
            className="px-3 py-2 border border-gray-300 dark:border-zinc-600 rounded-lg text-sm bg-white dark:bg-zinc-700 dark:text-white focus:ring-2 focus:ring-blue-500"
          >
            <option value="">Todas las fichas</option>
            {fichas.map(f => (
              <option key={f.id} value={f.id}>{f.numero} — {f.nombre}</option>
            ))}
          </select>

          {/* Filtro por entidad */}
          <select
            value={entidadFiltro}
            onChange={(e) => setEntidadFiltro(e.target.value)}
            className="px-3 py-2 border border-gray-300 dark:border-zinc-600 rounded-lg text-sm bg-white dark:bg-zinc-700 dark:text-white focus:ring-2 focus:ring-blue-500"
          >
            <option value="">Todas las entidades</option>
            {[...new Set(entidadesDisponibles)].filter(Boolean).map(e => (
              <option key={e} value={e}>{e.charAt(0).toUpperCase() + e.slice(1)}</option>
            ))}
          </select>

          {/* Búsqueda por descripción */}
          <form onSubmit={handleBuscar} className="flex items-center gap-2 ml-auto">
            <div className="relative">
              <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
              <input
                type="text"
                placeholder="Buscar en descripción..."
                value={busquedaInput}
                onChange={(e) => setBusquedaInput(e.target.value)}
                className="pl-9 pr-3 py-2 border border-gray-300 dark:border-zinc-600 rounded-lg text-sm bg-white dark:bg-zinc-700 dark:text-white focus:ring-2 focus:ring-blue-500 w-56"
              />
            </div>
            <button
              type="submit"
              className="px-3 py-2 bg-blue-600 text-white rounded-lg text-sm hover:bg-blue-700 transition-colors"
            >
              Buscar
            </button>
            {busqueda && (
              <button
                type="button"
                onClick={() => { setBusqueda(''); setBusquedaInput(''); }}
                className="px-3 py-2 text-gray-600 hover:bg-gray-100 dark:hover:bg-zinc-700 rounded-lg text-sm transition-colors"
              >
                Limpiar
              </button>
            )}
          </form>

          {/* Botón refrescar */}
          <button
            onClick={cargarHistorial}
            className="p-2 text-gray-500 hover:bg-gray-100 dark:hover:bg-zinc-700 rounded-lg transition-colors"
            title="Refrescar"
          >
            <RefreshCw size={16} />
          </button>
        </div>
      </div>

      {/* Tabla */}
      {loading ? (
        <div className="flex items-center justify-center py-16 text-gray-400 gap-3">
          <div className="w-6 h-6 border-2 border-blue-500 border-t-transparent rounded-full animate-spin" />
          Cargando auditoría...
        </div>
      ) : historial.length === 0 ? (
        <EmptyState
          icon={<ClipboardList size={48} className="text-gray-400" />}
          title="Sin eventos registrados"
          description="Aquí aparecerán todos los cambios realizados en tus fichas"
        />
      ) : (
        <>
          <div className="bg-white dark:bg-zinc-800 rounded-xl shadow-card overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="bg-gray-50 dark:bg-zinc-700/50 border-b border-gray-200 dark:border-zinc-700">
                  <tr>
                    <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">
                      <span className="flex items-center gap-1"><Calendar size={12} /> Fecha</span>
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">
                      <span className="flex items-center gap-1"><Tag size={12} /> Evento</span>
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Entidad</th>
                    <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">
                      <span className="flex items-center gap-1"><FileText size={12} /> Descripción</span>
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Ficha</th>
                    <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">
                      <span className="flex items-center gap-1"><User size={12} /> Realizado por</span>
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100 dark:divide-zinc-700">
                  {historial.map((evento) => (
                    <tr key={evento.id} className="hover:bg-gray-50 dark:hover:bg-zinc-700/40 transition-colors">
                      <td className="px-4 py-3 text-gray-500 dark:text-gray-400 whitespace-nowrap text-xs">
                        {formatFecha(evento.fechaHora)}
                      </td>
                      <td className="px-4 py-3 whitespace-nowrap">
                        <span className={`px-2 py-0.5 rounded-full text-xs font-semibold ${getBadgeColor(EVENTO_COLOR, evento.tipoEvento)}`}>
                          {evento.tipoEvento}
                        </span>
                      </td>
                      <td className="px-4 py-3 whitespace-nowrap">
                        <span className={`px-2 py-0.5 rounded-full text-xs font-semibold ${getBadgeColor(ENTIDAD_COLOR, evento.entidad)}`}>
                          {evento.entidad}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-gray-700 dark:text-gray-300 max-w-xs">
                        <p className="truncate" title={evento.descripcion}>{evento.descripcion}</p>
                      </td>
                      <td className="px-4 py-3 text-gray-500 dark:text-gray-400 whitespace-nowrap text-xs">
                        {evento.ficha ? `${evento.ficha.numero}` : '—'}
                      </td>
                      <td className="px-4 py-3 whitespace-nowrap">
                        <div className="flex items-center gap-2">
                          <div className="w-6 h-6 rounded-full bg-blue-100 dark:bg-blue-900 flex items-center justify-center shrink-0">
                            <span className="text-xs font-bold text-blue-600 dark:text-blue-300">
                              {evento.usuario?.fullName?.charAt(0)?.toUpperCase() || '?'}
                            </span>
                          </div>
                          <div className="min-w-0">
                            <p className="text-sm font-medium text-gray-900 dark:text-white truncate">
                              {evento.usuario?.fullName || 'Usuario eliminado'}
                            </p>
                            <p className="text-xs text-gray-400 truncate">{evento.usuario?.userType || ''}</p>
                          </div>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* Paginación */}
          {totalPages > 1 && (
            <div className="flex items-center justify-between px-1">
              <p className="text-sm text-gray-500 dark:text-gray-400">
                Mostrando {page * PAGE_SIZE + 1}–{Math.min((page + 1) * PAGE_SIZE, total)} de {total}
              </p>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => setPage(p => Math.max(0, p - 1))}
                  disabled={page === 0}
                  className="p-2 rounded-lg border border-gray-300 dark:border-zinc-600 hover:bg-gray-50 dark:hover:bg-zinc-700 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
                >
                  <ChevronLeft size={16} />
                </button>
                <span className="text-sm text-gray-600 dark:text-gray-400 min-w-[80px] text-center">
                  Página {page + 1} de {totalPages}
                </span>
                <button
                  onClick={() => setPage(p => Math.min(totalPages - 1, p + 1))}
                  disabled={page >= totalPages - 1}
                  className="p-2 rounded-lg border border-gray-300 dark:border-zinc-600 hover:bg-gray-50 dark:hover:bg-zinc-700 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
                >
                  <ChevronRight size={16} />
                </button>
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
}
