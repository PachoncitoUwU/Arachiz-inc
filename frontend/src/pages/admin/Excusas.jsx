import React, { useState, useEffect } from 'react';
import fetchApi from '../../services/api';
import PageHeader from '../../components/PageHeader';
import EmptyState from '../../components/EmptyState';
import Modal from '../../components/Modal';
import { useToast } from '../../context/ToastContext';
import { 
  FileText, Clock, CheckCircle, XCircle, Paperclip, Calendar, 
  Search, Filter, TrendingUp, Users, BookOpen, BarChart3 
} from 'lucide-react';

const STATUS_MAP = {
  Pendiente: { badge: 'badge-pending', icon: Clock, color: 'text-yellow-600' },
  Aprobada: { badge: 'badge-success', icon: CheckCircle, color: 'text-green-600' },
  Rechazada: { badge: 'badge-danger', icon: XCircle, color: 'text-red-600' },
};

export default function AdminExcusas() {
  const { showToast } = useToast();
  
  // Estados principales
  const [vistaActual, setVistaActual] = useState('lista'); // 'lista' | 'estadisticas'
  const [excusas, setExcusas] = useState([]);
  const [loading, setLoading] = useState(true);
  const [modalDetalle, setModalDetalle] = useState(null);
  
  // Estados para filtros
  const [fichas, setFichas] = useState([]);
  const [instructores, setInstructores] = useState([]);
  const [materias, setMaterias] = useState([]);
  const [aprendices, setAprendices] = useState([]);
  
  const [filtroEstado, setFiltroEstado] = useState('Todas');
  const [filtroFicha, setFiltroFicha] = useState('all');
  const [filtroInstructor, setFiltroInstructor] = useState('all');
  const [filtroMateria, setFiltroMateria] = useState('all');
  const [filtroAprendiz, setFiltroAprendiz] = useState('all');
  const [busquedaAprendiz, setBusquedaAprendiz] = useState('');
  const [filtroFechaDesde, setFiltroFechaDesde] = useState('');
  const [filtroFechaHasta, setFiltroFechaHasta] = useState('');
  
  // Estados para estadísticas
  const [estadisticas, setEstadisticas] = useState(null);
  const [loadingEstadisticas, setLoadingEstadisticas] = useState(false);
  const [filtroEstadisticas, setFiltroEstadisticas] = useState({
    fichaId: 'all',
    aprendizId: 'all',
    instructorId: 'all',
    materiaId: 'all'
  });

  // Helper para parsear JSON de forma segura
  const safeJSONParse = (str, fallback = []) => {
    try {
      return JSON.parse(str);
    } catch {
      return fallback;
    }
  };

  // Helper para formatear fecha (Colombia timezone)
  const formatearFecha = (fecha) => {
    const date = new Date(fecha + 'T00:00:00-05:00'); // Colombia UTC-5
    return date.toLocaleDateString('es-CO', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
      timeZone: 'America/Bogota'
    });
  };

  // Helper para formatear fecha y hora (Colombia timezone)
  const formatearFechaHora = (fecha) => {
    const date = new Date(fecha);
    return date.toLocaleString('es-CO', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
      timeZone: 'America/Bogota'
    });
  };

  useEffect(() => {
    loadFichas();
    loadInstructores();
    loadExcusas();
  }, []);

  useEffect(() => {
    loadExcusas();
  }, [filtroEstado, filtroFicha, filtroInstructor, filtroMateria, filtroAprendiz, filtroFechaDesde, filtroFechaHasta]);

  useEffect(() => {
    if (vistaActual === 'estadisticas') {
      loadEstadisticas();
    }
  }, [vistaActual, filtroEstadisticas]);

  const loadFichas = async () => {
    try {
      const data = await fetchApi('/admin/fichas');
      setFichas(data.fichas || []);
    } catch (err) {
      console.error('Error cargando fichas:', err);
    }
  };

  const loadInstructores = async () => {
    try {
      const data = await fetchApi('/admin/instructores');
      
      // Eliminar duplicados
      const instructoresMap = new Map();
      (data.instructores || []).forEach(item => {
        if (!instructoresMap.has(item.instructor.id)) {
          instructoresMap.set(item.instructor.id, item.instructor);
        }
      });
      
      setInstructores(Array.from(instructoresMap.values()));
    } catch (err) {
      console.error('Error cargando instructores:', err);
    }
  };

  const loadExcusas = async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams();
      
      if (filtroEstado !== 'Todas') params.append('estado', filtroEstado);
      if (filtroFicha !== 'all') params.append('fichaId', filtroFicha);
      if (filtroInstructor !== 'all') params.append('instructorId', filtroInstructor);
      if (filtroMateria !== 'all') params.append('materiaId', filtroMateria);
      if (filtroAprendiz !== 'all') params.append('aprendizId', filtroAprendiz);
      if (filtroFechaDesde) params.append('fechaDesde', filtroFechaDesde);
      if (filtroFechaHasta) params.append('fechaHasta', filtroFechaHasta);
      
      const data = await fetchApi(`/admin/excusas?${params.toString()}`);
      setExcusas(data.excusas || []);
      
      // Extraer materias y aprendices únicos para los filtros
      const materiasUnicas = new Map();
      const aprendicesUnicos = new Map();
      
      (data.excusas || []).forEach(excusa => {
        if (!materiasUnicas.has(excusa.materia.id)) {
          materiasUnicas.set(excusa.materia.id, excusa.materia);
        }
        if (!aprendicesUnicos.has(excusa.aprendiz.id)) {
          aprendicesUnicos.set(excusa.aprendiz.id, excusa.aprendiz);
        }
      });
      
      setMaterias(Array.from(materiasUnicas.values()));
      setAprendices(Array.from(aprendicesUnicos.values()));
    } catch (err) {
      showToast(err.message || 'Error al cargar excusas', 'error');
    } finally {
      setLoading(false);
    }
  };

  const loadEstadisticas = async () => {
    try {
      setLoadingEstadisticas(true);
      const params = new URLSearchParams();
      
      if (filtroEstadisticas.fichaId !== 'all') params.append('fichaId', filtroEstadisticas.fichaId);
      if (filtroEstadisticas.aprendizId !== 'all') params.append('aprendizId', filtroEstadisticas.aprendizId);
      if (filtroEstadisticas.instructorId !== 'all') params.append('instructorId', filtroEstadisticas.instructorId);
      if (filtroEstadisticas.materiaId !== 'all') params.append('materiaId', filtroEstadisticas.materiaId);
      
      const data = await fetchApi(`/admin/excusas/estadisticas?${params.toString()}`);
      setEstadisticas(data);
    } catch (err) {
      showToast(err.message || 'Error al cargar estadísticas', 'error');
    } finally {
      setLoadingEstadisticas(false);
    }
  };

  const limpiarFiltros = () => {
    setFiltroEstado('Todas');
    setFiltroFicha('all');
    setFiltroInstructor('all');
    setFiltroMateria('all');
    setFiltroAprendiz('all');
    setBusquedaAprendiz('');
    setFiltroFechaDesde('');
    setFiltroFechaHasta('');
  };

  const limpiarFiltrosEstadisticas = () => {
    setFiltroEstadisticas({
      fichaId: 'all',
      aprendizId: 'all',
      instructorId: 'all',
      materiaId: 'all'
    });
  };

  // Filtrar aprendices por búsqueda
  const aprendicesFiltrados = aprendices.filter(a => 
    a.fullName.toLowerCase().includes(busquedaAprendiz.toLowerCase())
  );

  return (
    <div className="animate-fade-in">
      <PageHeader
        title="Gestión de Excusas"
        subtitle="Consulta y supervisa todas las excusas de tus fichas"
      />

      {/* Toggle entre Lista y Estadísticas */}
      <div className="card mb-5">
        <div className="flex gap-2">
          <button
            onClick={() => setVistaActual('lista')}
            className={`btn-secondary flex-1 flex items-center justify-center gap-2 ${
              vistaActual === 'lista' ? 'bg-red-100 dark:bg-red-900/30 text-red-600 dark:text-red-400 border-red-300 dark:border-red-700' : ''
            }`}
          >
            <FileText size={16} />
            Lista de Excusas
          </button>
          <button
            onClick={() => setVistaActual('estadisticas')}
            className={`btn-secondary flex-1 flex items-center justify-center gap-2 ${
              vistaActual === 'estadisticas' ? 'bg-red-100 dark:bg-red-900/30 text-red-600 dark:text-red-400 border-red-300 dark:border-red-700' : ''
            }`}
          >
            <BarChart3 size={16} />
            Estadísticas
          </button>
        </div>
      </div>

      {/* VISTA DE LISTA */}
      {vistaActual === 'lista' && (
        <>
          {/* Filtros */}
          <div className="card mb-5">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-sm font-semibold text-gray-700 dark:text-gray-300 uppercase tracking-wide flex items-center gap-2">
                <Filter size={16} />
                Filtros
              </h3>
              <button
                onClick={limpiarFiltros}
                className="text-xs text-red-600 dark:text-red-400 hover:underline"
              >
                Limpiar filtros
              </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-3">
              {/* Estado */}
              <div>
                <label className="input-label">Estado</label>
                <select
                  value={filtroEstado}
                  onChange={(e) => setFiltroEstado(e.target.value)}
                  className="input-field"
                >
                  <option value="Todas">Todas</option>
                  <option value="Pendiente">Pendientes</option>
                  <option value="Aprobada">Aprobadas</option>
                  <option value="Rechazada">Rechazadas</option>
                </select>
              </div>

              {/* Ficha */}
              <div>
                <label className="input-label">Ficha</label>
                <select
                  value={filtroFicha}
                  onChange={(e) => setFiltroFicha(e.target.value)}
                  className="input-field"
                >
                  <option value="all">Todas las fichas</option>
                  {fichas.map(f => (
                    <option key={f.id} value={f.id}>
                      Ficha {f.numero} - {f.nombre}
                    </option>
                  ))}
                </select>
              </div>

              {/* Instructor */}
              <div>
                <label className="input-label">Instructor</label>
                <select
                  value={filtroInstructor}
                  onChange={(e) => setFiltroInstructor(e.target.value)}
                  className="input-field"
                >
                  <option value="all">Todos los instructores</option>
                  {instructores.map(i => (
                    <option key={i.id} value={i.id}>
                      {i.fullName}
                    </option>
                  ))}
                </select>
              </div>

              {/* Materia */}
              <div>
                <label className="input-label">Materia</label>
                <select
                  value={filtroMateria}
                  onChange={(e) => setFiltroMateria(e.target.value)}
                  className="input-field"
                >
                  <option value="all">Todas las materias</option>
                  {materias.map(m => (
                    <option key={m.id} value={m.id}>
                      {m.nombre}
                    </option>
                  ))}
                </select>
              </div>

              {/* Aprendiz */}
              <div>
                <label className="input-label">Aprendiz</label>
                <div className="relative">
                  <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                  <input
                    type="text"
                    placeholder="Buscar aprendiz..."
                    value={busquedaAprendiz}
                    onChange={(e) => setBusquedaAprendiz(e.target.value)}
                    className="input-field pl-10"
                  />
                </div>
                {busquedaAprendiz && (
                  <select
                    value={filtroAprendiz}
                    onChange={(e) => setFiltroAprendiz(e.target.value)}
                    className="input-field mt-2"
                  >
                    <option value="all">Todos</option>
                    {aprendicesFiltrados.map(a => (
                      <option key={a.id} value={a.id}>
                        {a.fullName}
                      </option>
                    ))}
                  </select>
                )}
              </div>

              {/* Fecha desde */}
              <div>
                <label className="input-label">Fecha desde</label>
                <input
                  type="date"
                  value={filtroFechaDesde}
                  onChange={(e) => setFiltroFechaDesde(e.target.value)}
                  className="input-field"
                />
              </div>

              {/* Fecha hasta */}
              <div>
                <label className="input-label">Fecha hasta</label>
                <input
                  type="date"
                  value={filtroFechaHasta}
                  onChange={(e) => setFiltroFechaHasta(e.target.value)}
                  className="input-field"
                />
              </div>
            </div>
          </div>

          {/* Resumen rápido */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-5">
            <div className="card bg-gradient-to-br from-yellow-50 to-yellow-100 dark:from-yellow-900/20 dark:to-yellow-800/20 border-yellow-200 dark:border-yellow-700">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 bg-yellow-100 dark:bg-yellow-900/40 rounded-xl flex items-center justify-center">
                  <Clock size={24} className="text-yellow-600 dark:text-yellow-400" />
                </div>
                <div>
                  <p className="text-2xl font-bold text-gray-900 dark:text-gray-100">
                    {excusas.filter(e => e.estado === 'Pendiente').length}
                  </p>
                  <p className="text-xs text-gray-600 dark:text-gray-400">Pendientes</p>
                </div>
              </div>
            </div>

            <div className="card bg-gradient-to-br from-green-50 to-green-100 dark:from-green-900/20 dark:to-green-800/20 border-green-200 dark:border-green-700">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 bg-green-100 dark:bg-green-900/40 rounded-xl flex items-center justify-center">
                  <CheckCircle size={24} className="text-green-600 dark:text-green-400" />
                </div>
                <div>
                  <p className="text-2xl font-bold text-gray-900 dark:text-gray-100">
                    {excusas.filter(e => e.estado === 'Aprobada').length}
                  </p>
                  <p className="text-xs text-gray-600 dark:text-gray-400">Aprobadas</p>
                </div>
              </div>
            </div>

            <div className="card bg-gradient-to-br from-red-50 to-red-100 dark:from-red-900/20 dark:to-red-800/20 border-red-200 dark:border-red-700">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 bg-red-100 dark:bg-red-900/40 rounded-xl flex items-center justify-center">
                  <XCircle size={24} className="text-red-600 dark:text-red-400" />
                </div>
                <div>
                  <p className="text-2xl font-bold text-gray-900 dark:text-gray-100">
                    {excusas.filter(e => e.estado === 'Rechazada').length}
                  </p>
                  <p className="text-xs text-gray-600 dark:text-gray-400">Rechazadas</p>
                </div>
              </div>
            </div>

            <div className="card bg-gradient-to-br from-blue-50 to-blue-100 dark:from-blue-900/20 dark:to-blue-800/20 border-blue-200 dark:border-blue-700">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 bg-blue-100 dark:bg-blue-900/40 rounded-xl flex items-center justify-center">
                  <FileText size={24} className="text-blue-600 dark:text-blue-400" />
                </div>
                <div>
                  <p className="text-2xl font-bold text-gray-900 dark:text-gray-100">
                    {excusas.length}
                  </p>
                  <p className="text-xs text-gray-600 dark:text-gray-400">Total</p>
                </div>
              </div>
            </div>
          </div>

          {/* Lista de excusas */}
          {loading ? (
            <div className="card animate-pulse">
              <div className="h-64 bg-gray-100 dark:bg-gray-800 rounded-xl" />
            </div>
          ) : excusas.length === 0 ? (
            <div className="card">
              <EmptyState
                icon={<FileText size={32} />}
                title="No hay excusas"
                description="No se encontraron excusas con los filtros aplicados"
              />
            </div>
          ) : (
            <div className="card overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-gray-50 dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700">
                    <tr>
                      <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 dark:text-gray-400 uppercase tracking-wider">
                        Aprendiz
                      </th>
                      <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 dark:text-gray-400 uppercase tracking-wider">
                        Ficha
                      </th>
                      <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 dark:text-gray-400 uppercase tracking-wider">
                        Materia
                      </th>
                      <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 dark:text-gray-400 uppercase tracking-wider">
                        Instructor
                      </th>
                      <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 dark:text-gray-400 uppercase tracking-wider">
                        Fechas
                      </th>
                      <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 dark:text-gray-400 uppercase tracking-wider">
                        Estado
                      </th>
                      <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 dark:text-gray-400 uppercase tracking-wider">
                        Enviada
                      </th>
                      <th className="px-4 py-3 text-center text-xs font-semibold text-gray-600 dark:text-gray-400 uppercase tracking-wider">
                        Acciones
                      </th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
                    {excusas.map((excusa) => {
                      const StatusIcon = STATUS_MAP[excusa.estado].icon;
                      const fechas = safeJSONParse(excusa.fechas);
                      
                      return (
                        <tr 
                          key={excusa.id}
                          className="hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors"
                        >
                          <td className="px-4 py-3">
                            <div className="flex items-center gap-2">
                              <div className="w-8 h-8 bg-green-100 dark:bg-green-900/30 rounded-full flex items-center justify-center flex-shrink-0">
                                <span className="text-xs font-bold text-green-600 dark:text-green-400">
                                  {excusa.aprendiz.fullName.charAt(0).toUpperCase()}
                                </span>
                              </div>
                              <div className="min-w-0">
                                <p className="text-sm font-medium text-gray-900 dark:text-gray-100 truncate">
                                  {excusa.aprendiz.fullName}
                                </p>
                                <p className="text-xs text-gray-500 dark:text-gray-400">
                                  {excusa.aprendiz.document}
                                </p>
                              </div>
                            </div>
                          </td>
                          <td className="px-4 py-3">
                            <p className="text-sm text-gray-900 dark:text-gray-100">
                              Ficha {excusa.materia.ficha.numero}
                            </p>
                            <p className="text-xs text-gray-500 dark:text-gray-400 truncate max-w-[150px]">
                              {excusa.materia.ficha.nombre}
                            </p>
                          </td>
                          <td className="px-4 py-3">
                            <p className="text-sm font-medium text-gray-900 dark:text-gray-100">
                              {excusa.materia.nombre}
                            </p>
                          </td>
                          <td className="px-4 py-3">
                            <p className="text-sm text-gray-900 dark:text-gray-100">
                              {excusa.materia.instructor.fullName}
                            </p>
                          </td>
                          <td className="px-4 py-3">
                            <p className="text-sm text-gray-900 dark:text-gray-100">
                              {fechas.length} día{fechas.length !== 1 ? 's' : ''}
                            </p>
                            <p className="text-xs text-gray-500 dark:text-gray-400">
                              {formatearFecha(fechas[0])}
                              {fechas.length > 1 && ` - ${formatearFecha(fechas[fechas.length - 1])}`}
                            </p>
                          </td>
                          <td className="px-4 py-3">
                            <span className={`badge ${STATUS_MAP[excusa.estado].badge} flex items-center gap-1 w-fit`}>
                              <StatusIcon size={12} />
                              {excusa.estado}
                            </span>
                          </td>
                          <td className="px-4 py-3">
                            <p className="text-xs text-gray-500 dark:text-gray-400">
                              {formatearFecha(excusa.createdAt)}
                            </p>
                          </td>
                          <td className="px-4 py-3 text-center">
                            <button
                              onClick={() => setModalDetalle(excusa)}
                              className="text-sm text-red-600 dark:text-red-400 hover:underline"
                            >
                              Ver detalle
                            </button>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </>
      )}

      {/* VISTA DE ESTADÍSTICAS */}
      {vistaActual === 'estadisticas' && (
        <>
          {/* Filtros de estadísticas */}
          <div className="card mb-5">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-sm font-semibold text-gray-700 dark:text-gray-300 uppercase tracking-wide flex items-center gap-2">
                <Filter size={16} />
                Filtrar Estadísticas
              </h3>
              <button
                onClick={limpiarFiltrosEstadisticas}
                className="text-xs text-red-600 dark:text-red-400 hover:underline"
              >
                Ver todo
              </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-3">
              <div>
                <label className="input-label">Ficha</label>
                <select
                  value={filtroEstadisticas.fichaId}
                  onChange={(e) => setFiltroEstadisticas(p => ({ ...p, fichaId: e.target.value }))}
                  className="input-field"
                >
                  <option value="all">Todas las fichas</option>
                  {fichas.map(f => (
                    <option key={f.id} value={f.id}>
                      Ficha {f.numero} - {f.nombre}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="input-label">Instructor</label>
                <select
                  value={filtroEstadisticas.instructorId}
                  onChange={(e) => setFiltroEstadisticas(p => ({ ...p, instructorId: e.target.value }))}
                  className="input-field"
                >
                  <option value="all">Todos los instructores</option>
                  {instructores.map(i => (
                    <option key={i.id} value={i.id}>
                      {i.fullName}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="input-label">Materia</label>
                <select
                  value={filtroEstadisticas.materiaId}
                  onChange={(e) => setFiltroEstadisticas(p => ({ ...p, materiaId: e.target.value }))}
                  className="input-field"
                >
                  <option value="all">Todas las materias</option>
                  {materias.map(m => (
                    <option key={m.id} value={m.id}>
                      {m.nombre}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="input-label">Aprendiz</label>
                <select
                  value={filtroEstadisticas.aprendizId}
                  onChange={(e) => setFiltroEstadisticas(p => ({ ...p, aprendizId: e.target.value }))}
                  className="input-field"
                >
                  <option value="all">Todos los aprendices</option>
                  {aprendices.map(a => (
                    <option key={a.id} value={a.id}>
                      {a.fullName}
                    </option>
                  ))}
                </select>
              </div>
            </div>
          </div>

          {loadingEstadisticas ? (
            <div className="card animate-pulse">
              <div className="h-96 bg-gray-100 dark:bg-gray-800 rounded-xl" />
            </div>
          ) : estadisticas ? (
            <>
              {/* Resumen general */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4 mb-5">
                <div className="card bg-gradient-to-br from-blue-50 to-blue-100 dark:from-blue-900/20 dark:to-blue-800/20 border-blue-200 dark:border-blue-700">
                  <div className="text-center">
                    <p className="text-3xl font-bold text-blue-600 dark:text-blue-400">
                      {estadisticas.total}
                    </p>
                    <p className="text-xs text-gray-600 dark:text-gray-400 mt-1">Total Excusas</p>
                  </div>
                </div>

                <div className="card bg-gradient-to-br from-yellow-50 to-yellow-100 dark:from-yellow-900/20 dark:to-yellow-800/20 border-yellow-200 dark:border-yellow-700">
                  <div className="text-center">
                    <p className="text-3xl font-bold text-yellow-600 dark:text-yellow-400">
                      {estadisticas.pendientes}
                    </p>
                    <p className="text-xs text-gray-600 dark:text-gray-400 mt-1">Pendientes</p>
                  </div>
                </div>

                <div className="card bg-gradient-to-br from-green-50 to-green-100 dark:from-green-900/20 dark:to-green-800/20 border-green-200 dark:border-green-700">
                  <div className="text-center">
                    <p className="text-3xl font-bold text-green-600 dark:text-green-400">
                      {estadisticas.aprobadas}
                    </p>
                    <p className="text-xs text-gray-600 dark:text-gray-400 mt-1">Aprobadas</p>
                  </div>
                </div>

                <div className="card bg-gradient-to-br from-red-50 to-red-100 dark:from-red-900/20 dark:to-red-800/20 border-red-200 dark:border-red-700">
                  <div className="text-center">
                    <p className="text-3xl font-bold text-red-600 dark:text-red-400">
                      {estadisticas.rechazadas}
                    </p>
                    <p className="text-xs text-gray-600 dark:text-gray-400 mt-1">Rechazadas</p>
                  </div>
                </div>

                <div className="card bg-gradient-to-br from-purple-50 to-purple-100 dark:from-purple-900/20 dark:to-purple-800/20 border-purple-200 dark:border-purple-700">
                  <div className="text-center">
                    <p className="text-3xl font-bold text-purple-600 dark:text-purple-400">
                      {estadisticas.porcentajeAprobacion}%
                    </p>
                    <p className="text-xs text-gray-600 dark:text-gray-400 mt-1">Aprobación</p>
                  </div>
                </div>
              </div>

              {/* Gráficos y tops */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-5 mb-5">
                {/* Top Aprendices */}
                <div className="card">
                  <h3 className="text-sm font-semibold text-gray-700 dark:text-gray-300 uppercase tracking-wide mb-4 flex items-center gap-2">
                    <Users size={16} />
                    Top 5 Aprendices con Más Excusas
                  </h3>
                  {estadisticas.topAprendices.length === 0 ? (
                    <p className="text-sm text-gray-500 dark:text-gray-400 text-center py-8">
                      No hay datos disponibles
                    </p>
                  ) : (
                    <div className="space-y-3">
                      {estadisticas.topAprendices.map((aprendiz, idx) => (
                        <div key={aprendiz.id} className="flex items-center gap-3 p-3 bg-gray-50 dark:bg-gray-800 rounded-xl">
                          <div className="w-8 h-8 bg-green-100 dark:bg-green-900/30 rounded-full flex items-center justify-center flex-shrink-0">
                            <span className="text-sm font-bold text-green-600 dark:text-green-400">
                              {idx + 1}
                            </span>
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="text-sm font-medium text-gray-900 dark:text-gray-100 truncate">
                              {aprendiz.nombre}
                            </p>
                            <div className="flex gap-2 text-xs text-gray-500 dark:text-gray-400 mt-1">
                              <span className="text-green-600 dark:text-green-400">✓ {aprendiz.aprobadas}</span>
                              <span className="text-red-600 dark:text-red-400">✗ {aprendiz.rechazadas}</span>
                              <span className="text-yellow-600 dark:text-yellow-400">⏱ {aprendiz.pendientes}</span>
                            </div>
                          </div>
                          <div className="text-right">
                            <p className="text-lg font-bold text-gray-900 dark:text-gray-100">
                              {aprendiz.total}
                            </p>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                {/* Top Materias */}
                <div className="card">
                  <h3 className="text-sm font-semibold text-gray-700 dark:text-gray-300 uppercase tracking-wide mb-4 flex items-center gap-2">
                    <BookOpen size={16} />
                    Top 5 Materias con Más Excusas
                  </h3>
                  {estadisticas.topMaterias.length === 0 ? (
                    <p className="text-sm text-gray-500 dark:text-gray-400 text-center py-8">
                      No hay datos disponibles
                    </p>
                  ) : (
                    <div className="space-y-3">
                      {estadisticas.topMaterias.map((materia, idx) => (
                        <div key={materia.id} className="flex items-center gap-3 p-3 bg-gray-50 dark:bg-gray-800 rounded-xl">
                          <div className="w-8 h-8 bg-blue-100 dark:bg-blue-900/30 rounded-full flex items-center justify-center flex-shrink-0">
                            <span className="text-sm font-bold text-blue-600 dark:text-blue-400">
                              {idx + 1}
                            </span>
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="text-sm font-medium text-gray-900 dark:text-gray-100 truncate">
                              {materia.nombre}
                            </p>
                            <div className="flex gap-2 text-xs text-gray-500 dark:text-gray-400 mt-1">
                              <span className="text-green-600 dark:text-green-400">✓ {materia.aprobadas}</span>
                              <span className="text-red-600 dark:text-red-400">✗ {materia.rechazadas}</span>
                              <span className="text-yellow-600 dark:text-yellow-400">⏱ {materia.pendientes}</span>
                            </div>
                          </div>
                          <div className="text-right">
                            <p className="text-lg font-bold text-gray-900 dark:text-gray-100">
                              {materia.total}
                            </p>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>

              {/* Top Instructores */}
              <div className="card mb-5">
                <h3 className="text-sm font-semibold text-gray-700 dark:text-gray-300 uppercase tracking-wide mb-4 flex items-center gap-2">
                  <TrendingUp size={16} />
                  Top 5 Instructores con Más Excusas Recibidas
                </h3>
                {estadisticas.topInstructores.length === 0 ? (
                  <p className="text-sm text-gray-500 dark:text-gray-400 text-center py-8">
                    No hay datos disponibles
                  </p>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-3">
                    {estadisticas.topInstructores.map((instructor, idx) => (
                      <div key={instructor.id} className="p-4 bg-gray-50 dark:bg-gray-800 rounded-xl text-center">
                        <div className="w-12 h-12 bg-blue-100 dark:bg-blue-900/30 rounded-full flex items-center justify-center mx-auto mb-2">
                          <span className="text-lg font-bold text-blue-600 dark:text-blue-400">
                            {idx + 1}
                          </span>
                        </div>
                        <p className="text-sm font-medium text-gray-900 dark:text-gray-100 truncate">
                          {instructor.nombre}
                        </p>
                        <p className="text-2xl font-bold text-gray-900 dark:text-gray-100 mt-2">
                          {instructor.total}
                        </p>
                        <div className="flex justify-center gap-2 text-xs text-gray-500 dark:text-gray-400 mt-2">
                          <span className="text-green-600 dark:text-green-400">✓ {instructor.aprobadas}</span>
                          <span className="text-red-600 dark:text-red-400">✗ {instructor.rechazadas}</span>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Excusas por mes */}
              <div className="card">
                <h3 className="text-sm font-semibold text-gray-700 dark:text-gray-300 uppercase tracking-wide mb-4 flex items-center gap-2">
                  <Calendar size={16} />
                  Excusas por Mes (Últimos 6 Meses)
                </h3>
                <div className="space-y-3">
                  {estadisticas.excusasPorMes.map((mes) => (
                    <div key={mes.mes} className="p-3 bg-gray-50 dark:bg-gray-800 rounded-xl">
                      <div className="flex items-center justify-between mb-2">
                        <p className="text-sm font-medium text-gray-900 dark:text-gray-100">
                          {mes.mes}
                        </p>
                        <p className="text-sm font-bold text-gray-900 dark:text-gray-100">
                          {mes.total} excusas
                        </p>
                      </div>
                      <div className="flex gap-2">
                        <div className="flex-1 h-2 bg-green-200 dark:bg-green-900/30 rounded-full overflow-hidden">
                          <div 
                            className="h-full bg-green-500 dark:bg-green-600"
                            style={{ width: `${mes.total > 0 ? (mes.aprobadas / mes.total) * 100 : 0}%` }}
                          />
                        </div>
                        <div className="flex-1 h-2 bg-red-200 dark:bg-red-900/30 rounded-full overflow-hidden">
                          <div 
                            className="h-full bg-red-500 dark:bg-red-600"
                            style={{ width: `${mes.total > 0 ? (mes.rechazadas / mes.total) * 100 : 0}%` }}
                          />
                        </div>
                        <div className="flex-1 h-2 bg-yellow-200 dark:bg-yellow-900/30 rounded-full overflow-hidden">
                          <div 
                            className="h-full bg-yellow-500 dark:bg-yellow-600"
                            style={{ width: `${mes.total > 0 ? (mes.pendientes / mes.total) * 100 : 0}%` }}
                          />
                        </div>
                      </div>
                      <div className="flex gap-4 text-xs text-gray-500 dark:text-gray-400 mt-2">
                        <span className="text-green-600 dark:text-green-400">Aprobadas: {mes.aprobadas}</span>
                        <span className="text-red-600 dark:text-red-400">Rechazadas: {mes.rechazadas}</span>
                        <span className="text-yellow-600 dark:text-yellow-400">Pendientes: {mes.pendientes}</span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </>
          ) : null}
        </>
      )}

      {/* Modal de detalle */}
      {modalDetalle && (
        <Modal
          open={!!modalDetalle}
          onClose={() => setModalDetalle(null)}
          title="Detalle de Excusa"
        >
          <div className="space-y-4">
            {/* Aprendiz */}
            <div className="p-3 bg-green-50 dark:bg-green-900/20 rounded-xl">
              <p className="text-xs text-gray-500 dark:text-gray-400 font-semibold uppercase tracking-wide mb-1">
                Aprendiz
              </p>
              <div className="flex items-center gap-2">
                <div className="w-10 h-10 bg-green-100 dark:bg-green-900/30 rounded-full flex items-center justify-center">
                  <span className="text-sm font-bold text-green-600 dark:text-green-400">
                    {modalDetalle.aprendiz.fullName.charAt(0).toUpperCase()}
                  </span>
                </div>
                <div>
                  <p className="text-sm font-bold text-gray-900 dark:text-gray-100">
                    {modalDetalle.aprendiz.fullName}
                  </p>
                  <p className="text-xs text-gray-500 dark:text-gray-400">
                    {modalDetalle.aprendiz.document}
                  </p>
                </div>
              </div>
            </div>

            {/* Ficha y Materia */}
            <div className="grid grid-cols-2 gap-3">
              <div className="p-3 bg-gray-50 dark:bg-gray-800 rounded-xl">
                <p className="text-xs text-gray-500 dark:text-gray-400 font-semibold uppercase tracking-wide mb-1">
                  Ficha
                </p>
                <p className="text-sm font-bold text-gray-900 dark:text-gray-100">
                  Ficha {modalDetalle.materia.ficha.numero}
                </p>
                <p className="text-xs text-gray-500 dark:text-gray-400">
                  {modalDetalle.materia.ficha.nombre}
                </p>
              </div>

              <div className="p-3 bg-gray-50 dark:bg-gray-800 rounded-xl">
                <p className="text-xs text-gray-500 dark:text-gray-400 font-semibold uppercase tracking-wide mb-1">
                  Materia
                </p>
                <p className="text-sm font-bold text-gray-900 dark:text-gray-100">
                  {modalDetalle.materia.nombre}
                </p>
                <p className="text-xs text-gray-500 dark:text-gray-400">
                  {modalDetalle.materia.instructor.fullName}
                </p>
              </div>
            </div>

            {/* Fechas justificadas */}
            <div>
              <p className="text-xs text-gray-500 dark:text-gray-400 font-semibold uppercase tracking-wide mb-2">
                Fechas Justificadas
              </p>
              <div className="flex flex-wrap gap-2">
                {safeJSONParse(modalDetalle.fechas).map((fecha, idx) => (
                  <span key={idx} className="badge badge-gray">
                    {formatearFecha(fecha)}
                  </span>
                ))}
              </div>
            </div>

            {/* Motivo */}
            <div>
              <p className="text-xs text-gray-500 dark:text-gray-400 font-semibold uppercase tracking-wide mb-2">
                Motivo
              </p>
              <p className="text-sm text-gray-900 dark:text-gray-100 whitespace-pre-wrap">
                {modalDetalle.motivo}
              </p>
            </div>

            {/* Archivos */}
            {modalDetalle.archivosUrls && safeJSONParse(modalDetalle.archivosUrls).length > 0 && (
              <div>
                <p className="text-xs text-gray-500 dark:text-gray-400 font-semibold uppercase tracking-wide mb-2">
                  Archivos Adjuntos
                </p>
                <div className="space-y-2">
                  {safeJSONParse(modalDetalle.archivosUrls).map((url, idx) => (
                    <a
                      key={idx}
                      href={url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center gap-2 p-2 bg-gray-50 dark:bg-gray-800 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
                    >
                      <Paperclip size={16} className="text-gray-400" />
                      <span className="text-sm text-blue-600 dark:text-blue-400 hover:underline">
                        Archivo {idx + 1}
                      </span>
                    </a>
                  ))}
                </div>
              </div>
            )}

            {/* Estado y respuesta */}
            <div className="p-3 bg-gray-50 dark:bg-gray-800 rounded-xl">
              <div className="flex items-center justify-between mb-2">
                <p className="text-xs text-gray-500 dark:text-gray-400 font-semibold uppercase tracking-wide">
                  Estado
                </p>
                <span className={`badge ${STATUS_MAP[modalDetalle.estado].badge}`}>
                  {modalDetalle.estado}
                </span>
              </div>
              
              {modalDetalle.respuesta && (
                <>
                  <p className="text-xs text-gray-500 dark:text-gray-400 font-semibold uppercase tracking-wide mb-1 mt-3">
                    Respuesta del Instructor
                  </p>
                  <p className="text-sm text-gray-900 dark:text-gray-100 whitespace-pre-wrap">
                    {modalDetalle.respuesta}
                  </p>
                  {modalDetalle.respondedAt && (
                    <p className="text-xs text-gray-400 dark:text-gray-500 mt-2">
                      Respondida el {formatearFechaHora(modalDetalle.respondedAt)}
                    </p>
                  )}
                </>
              )}
            </div>

            {/* Fechas */}
            <div className="grid grid-cols-2 gap-3 text-xs text-gray-500 dark:text-gray-400">
              <div>
                <p className="font-semibold">Enviada:</p>
                <p>{formatearFechaHora(modalDetalle.createdAt)}</p>
              </div>
              {modalDetalle.updatedAt !== modalDetalle.createdAt && (
                <div>
                  <p className="font-semibold">Actualizada:</p>
                  <p>{formatearFechaHora(modalDetalle.updatedAt)}</p>
                </div>
              )}
            </div>

            <div className="pt-2">
              <button
                onClick={() => setModalDetalle(null)}
                className="btn-secondary w-full"
              >
                Cerrar
              </button>
            </div>
          </div>
        </Modal>
      )}
    </div>
  );
}
