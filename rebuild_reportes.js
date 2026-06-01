const fs = require('fs');
const path = 'C:\\Users\\LENOVO\\Documents\\Arachiz-inc\\frontend\\src\\pages\\admin\\Reportes.jsx';

const content = `import React, { useEffect, useState } from 'react';
import { BarChart3, Download, FileText, Users, BookOpen, Calendar, Filter, TrendingUp, PieChart, ChevronDown, ChevronUp, CheckCircle2, XCircle, Search, Clock, Loader2 } from 'lucide-react';
import PageHeader from '../../components/PageHeader';
import EmptyState from '../../components/EmptyState';
import Modal from '../../components/Modal';
import { useToast } from '../../context/ToastContext';
import fetchApi from '../../services/api';

export default function AdminReportes() {
  const { showToast } = useToast();
  const [fichas, setFichas] = useState([]);
  const [loading, setLoading] = useState(true);
  const [downloading, setDownloading] = useState(null);
  const [vistaActual, setVistaActual] = useState('reportes'); // 'reportes' | 'sesiones'
  
  // Estados para modal de reporte de materia
  const [modalMateria, setModalMateria] = useState(false);
  const [fichaSeleccionada, setFichaSeleccionada] = useState(null);
  const [materias, setMaterias] = useState([]);
  const [materiaSeleccionada, setMateriaSeleccionada] = useState('');
  const [fechaDesde, setFechaDesde] = useState('');
  const [fechaHasta, setFechaHasta] = useState('');
  
  // Estados para sesiones (reemplaza estadísticas)
  const [fichaSeleccionadaVista, setFichaSeleccionadaVista] = useState('');
  const [materiasVista, setMateriasVista] = useState([]);
  const [loadingMateriasVista, setLoadingMateriasVista] = useState(false);
  const [errorMateriasVista, setErrorMateriasVista] = useState(false);
  const [materiaSeleccionadaVista, setMateriaSeleccionadaVista] = useState('');
  const [sesiones, setSesiones] = useState([]);
  const [loadingSesiones, setLoadingSesiones] = useState(false);
  const [filtroFechaDesde, setFiltroFechaDesde] = useState('');
  const [filtroFechaHasta, setFiltroFechaHasta] = useState('');
  const [sesionExpandida, setSesionExpandida] = useState(null);

  useEffect(() => {
    loadFichas();
  }, []);

  useEffect(() => {
    if (vistaActual === 'sesiones' && materiaSeleccionadaVista) {
      loadSesiones();
    }
  }, [vistaActual, materiaSeleccionadaVista, filtroFechaDesde, filtroFechaHasta]);

  const loadFichas = async () => {
    try {
      setLoading(true);
      const data = await fetchApi('/admin/fichas');
      setFichas(data.fichas || []);
    } catch (err) {
      console.error('Error cargando fichas:', err);
      showToast('Error cargando fichas', 'error');
    } finally {
      setLoading(false);
    }
  };

  const loadSesiones = async () => {
    if (!materiaSeleccionadaVista) return;
    try {
      setLoadingSesiones(true);
      const params = new URLSearchParams();
      if (filtroFechaDesde) params.append('fechaDesde', filtroFechaDesde);
      if (filtroFechaHasta) params.append('fechaHasta', filtroFechaHasta);
      
      const data = await fetchApi(\`/admin/reportes/sesiones/\${materiaSeleccionadaVista}?\${params.toString()}\`);
      setSesiones(data.sesiones || []);
    } catch (err) {
      console.error('Error cargando sesiones:', err);
      showToast('Error cargando sesiones', 'error');
    } finally {
      setLoadingSesiones(false);
    }
  };

  const handleFichaVistaChange = async (e) => {
    const fichaId = e.target.value;
    setFichaSeleccionadaVista(fichaId);
    setMateriaSeleccionadaVista('');
    setSesiones([]);
    if (!fichaId) {
      setMateriasVista([]);
      setErrorMateriasVista(false);
      return;
    }
    try {
      setLoadingMateriasVista(true);
      setErrorMateriasVista(false);
      const data = await fetchApi(\`/admin/fichas/\${fichaId}\`);
      setMateriasVista(data.ficha?.materias || []);
    } catch (err) {
      setErrorMateriasVista(true);
      showToast('Error cargando materias', 'error');
    } finally {
      setLoadingMateriasVista(false);
    }
  };

  const handleDownloadReporteSesionIndividual = async (sesionId, materiaNombre, fecha) => {
    try {
      setDownloading(\`sesion-\${sesionId}\`);
      showToast('Generando reporte de sesión...', 'info');
      
      const response = await fetch(\`\${import.meta.env.VITE_API_URL || 'http://localhost:3000/api'}/admin/reportes/sesion/\${sesionId}/excel\`, {
        headers: {
          'Authorization': \`Bearer \${localStorage.getItem('token')}\`
        }
      });

      if (!response.ok) throw new Error('Error al generar reporte');

      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = \`Sesion_\${materiaNombre}_\${new Date(fecha).toISOString().split('T')[0]}.xlsx\`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);

      showToast('Reporte descargado exitosamente', 'success');
    } catch (err) {
      showToast('Error descargando reporte', 'error');
    } finally {
      setDownloading(null);
    }
  };

  const handleDownloadReporteFicha = async (fichaId) => {
    try {
      setDownloading(\`ficha-\${fichaId}\`);
      showToast('Generando reporte de ficha...', 'info');
      
      const response = await fetch(\`\${import.meta.env.VITE_API_URL || 'http://localhost:3000/api'}/admin/reportes/ficha/\${fichaId}\`, {
        headers: {
          'Authorization': \`Bearer \${localStorage.getItem('token')}\`
        }
      });

      if (!response.ok) {
        throw new Error('Error al generar reporte');
      }

      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = \`Ficha_\${fichaId}_\${Date.now()}.xlsx\`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);

      showToast('Reporte descargado exitosamente', 'success');
    } catch (err) {
      showToast('Error descargando reporte', 'error');
    } finally {
      setDownloading(null);
    }
  };

  const handleOpenModalMateria = async (ficha) => {
    try {
      setFichaSeleccionada(ficha);
      const data = await fetchApi(\`/admin/fichas/\${ficha.id}\`);
      setMaterias(data.ficha?.materias || []);
      setModalMateria(true);
      setMateriaSeleccionada('');
      setFechaDesde('');
      setFechaHasta('');
    } catch (err) {
      showToast('Error cargando materias', 'error');
    }
  };

  const handleDownloadReporteMateria = async () => {
    if (!materiaSeleccionada) {
      showToast('Selecciona una materia', 'warning');
      return;
    }

    try {
      setDownloading(\`materia-\${materiaSeleccionada}\`);
      showToast('Generando reporte de asistencias...', 'info');
      
      const params = new URLSearchParams();
      if (fechaDesde) params.append('fechaDesde', fechaDesde);
      if (fechaHasta) params.append('fechaHasta', fechaHasta);

      const response = await fetch(
        \`\${import.meta.env.VITE_API_URL || 'http://localhost:3000/api'}/admin/reportes/materia/\${materiaSeleccionada}?\${params.toString()}\`,
        {
          headers: {
            'Authorization': \`Bearer \${localStorage.getItem('token')}\`
          }
        }
      );

      if (!response.ok) {
        throw new Error('Error al generar reporte');
      }

      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = \`Asistencias_\${Date.now()}.xlsx\`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);

      showToast('Reporte descargado exitosamente', 'success');
      setModalMateria(false);
    } catch (err) {
      showToast('Error descargando reporte', 'error');
    } finally {
      setDownloading(null);
    }
  };

  const handleDownloadReporteConsolidado = async () => {
    try {
      setDownloading('consolidado');
      showToast('Generando reporte consolidado...', 'info');
      
      const response = await fetch(\`\${import.meta.env.VITE_API_URL || 'http://localhost:3000/api'}/admin/reportes/consolidado\`, {
        headers: {
          'Authorization': \`Bearer \${localStorage.getItem('token')}\`
        }
      });

      if (!response.ok) {
        throw new Error('Error al generar reporte');
      }

      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = \`Reporte_Consolidado_\${Date.now()}.xlsx\`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);

      showToast('Reporte consolidado descargado exitosamente', 'success');
    } catch (err) {
      showToast('Error descargando reporte consolidado', 'error');
    } finally {
      setDownloading(null);
    }
  };

  return (
    <div className="animate-fade-in">
      <PageHeader
        title="Reportes y Estadísticas"
        subtitle={vistaActual === 'reportes' ? "Genera y descarga reportes en formato Excel" : "Ver sesiones de asistencia detalladas"}
        action={
          vistaActual === 'reportes' ? (
            <button
              onClick={handleDownloadReporteConsolidado}
              disabled={downloading === 'consolidado' || fichas.length === 0}
              className="btn-primary text-sm md:text-base  flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <Download size={18} />
              <span>{downloading === 'consolidado' ? 'Generando...' : 'Reporte Consolidado'}</span>
            </button>
          ) : (
            <button
              onClick={loadSesiones}
              disabled={loadingSesiones || !materiaSeleccionadaVista}
              className="btn-secondary text-sm md:text-base  flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <Search size={18} />
              <span>{loadingSesiones ? 'Buscando...' : 'Buscar Sesiones'}</span>
            </button>
          )
        }
      />

      {/* Toggle entre Reportes y Estadísticas */}
      <div className="card mb-5">
        <div className="flex flex-wrap gap-2 ">
          <button
            onClick={() => setVistaActual('reportes')}
            className={\`btn-secondary flex-1 flex items-center justify-center gap-2 \${
              vistaActual === 'reportes' ? 'bg-red-100 dark:bg-red-900/30 text-red-600 dark:text-red-400 border-red-300 dark:border-red-700' : ''
            }\`}
          >
            <Download size={16} />
            Descargar Reportes
          </button>
          <button
            onClick={() => setVistaActual('sesiones')}
            className={\`btn-secondary flex-1 flex items-center justify-center gap-2 \${
              vistaActual === 'sesiones' ? 'bg-red-100 dark:bg-red-900/30 text-red-600 dark:text-red-400 border-red-300 dark:border-red-700' : ''
            }\`}
          >
            <Calendar size={16} />
            Ver Sesiones Detalladas
          </button>
        </div>
      </div>

      {/* VISTA DE REPORTES */}
      {vistaActual === 'reportes' && (
        <>
          {/* Estadísticas generales */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-5">
            <div className="card bg-gradient-to-br from-red-50 to-red-100 dark:from-red-900/20 dark:to-red-800/20 border-red-200 dark:border-red-700">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 bg-red-100 dark:bg-red-900/40 rounded-xl flex items-center justify-center">
                  <FileText className="text-red-600 dark:text-red-400" size={24} />
                </div>
                <div>
                  <div className="text-xl md:text-2xl  font-bold text-gray-900 dark:text-white  dark:text-gray-100">{fichas.length}</div>
                  <div className="text-sm text-gray-600 dark:text-gray-400">Fichas Totales</div>
                </div>
              </div>
            </div>

            <div className="card bg-gradient-to-br from-green-50 to-green-100 dark:from-green-900/20 dark:to-green-800/20 border-green-200 dark:border-green-700">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 bg-green-100 dark:bg-green-900/40 rounded-xl flex items-center justify-center">
                  <Users className="text-green-600 dark:text-green-400" size={24} />
                </div>
                <div>
                  <div className="text-xl md:text-2xl  font-bold text-gray-900 dark:text-white  dark:text-gray-100">
                    {fichas.reduce((sum, f) => sum + (f._count?.aprendices || 0), 0)}
                  </div>
                  <div className="text-sm text-gray-600 dark:text-gray-400">Aprendices Totales</div>
                </div>
              </div>
            </div>

            <div className="card bg-gradient-to-br from-purple-50 to-purple-100 dark:from-purple-900/20 dark:to-purple-800/20 border-purple-200 dark:border-purple-700">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 bg-purple-100 dark:bg-purple-900/40 rounded-xl flex items-center justify-center">
                  <BookOpen className="text-purple-600 dark:text-purple-400" size={24} />
                </div>
                <div>
                  <div className="text-xl md:text-2xl  font-bold text-gray-900 dark:text-white  dark:text-gray-100">
                    {fichas.reduce((sum, f) => sum + (f._count?.materias || 0), 0)}
                  </div>
                  <div className="text-sm text-gray-600 dark:text-gray-400">Materias Totales</div>
                </div>
              </div>
            </div>
          </div>

          {/* Lista de reportes por ficha */}
          {loading ? (
            <div className="card animate-pulse">
              <div className="h-64 bg-gray-100 dark:bg-gray-800 rounded-xl" />
            </div>
          ) : fichas.length === 0 ? (
            <div className="card">
              <EmptyState
                icon={<BarChart3 size={48} />}
                title="Sin reportes"
                description="No tienes fichas para generar reportes"
              />
            </div>
          ) : (
            <div className="card">
              <div className="p-4 md:p-6  border-b border-gray-200 dark:border-zinc-700  dark:border-gray-700">
                <h3 className="text-lg font-bold text-gray-900 dark:text-white  dark:text-gray-100">Reportes por Ficha</h3>
                <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">Descarga reportes individuales de cada ficha</p>
              </div>
              <div className="divide-y divide-gray-200 dark:divide-gray-700">
                {fichas.map((ficha) => (
                  <div key={ficha.id} className="p-4 md:p-6  hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors">
                    <div className="flex items-center justify-between">
                      <div className="flex-1">
                        <h4 className="font-bold text-gray-900 dark:text-white  dark:text-gray-100">Ficha {ficha.numero}</h4>
                        <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">{ficha.nombre}</p>
                        <div className="flex items-center gap-4 mt-2 text-sm text-gray-500 dark:text-gray-400">
                          <span className="flex items-center gap-1">
                            <Users size={14} />
                            {ficha._count?.aprendices || 0} aprendices
                          </span>
                          <span className="flex items-center gap-1">
                            <BookOpen size={14} />
                            {ficha._count?.materias || 0} materias
                          </span>
                        </div>
                      </div>
                      <div className="flex flex-wrap gap-2 ">
                        <button
                          onClick={() => handleDownloadReporteFicha(ficha.id)}
                          disabled={downloading === \`ficha-\${ficha.id}\`}
                          className="btn-secondary text-sm md:text-base  flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
                          title="Descargar información general de la ficha"
                        >
                          <FileText size={16} />
                          <span>{downloading === \`ficha-\${ficha.id}\` ? 'Generando...' : 'Info Ficha'}</span>
                        </button>
                        <button
                          onClick={() => handleOpenModalMateria(ficha)}
                          className="btn-primary text-sm md:text-base  flex items-center gap-2"
                          title="Descargar asistencias de una materia"
                        >
                          <Calendar size={16} />
                          <span>Asistencias</span>
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </>
      )}

      {/* VISTA DE SESIONES */}
      {vistaActual === 'sesiones' && (
        <div className="space-y-5">
          {/* Filtros */}
          <div className="card p-4 md:p-6">
            <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
              <Filter size={20} /> Filtros de Búsqueda
            </h3>
            
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              <div>
                <label className="input-label">Ficha</label>
                <select
                  value={fichaSeleccionadaVista}
                  onChange={handleFichaVistaChange}
                  className="input-field"
                >
                  <option value="">Seleccione una ficha...</option>
                  {fichas.map(f => (
                    <option key={f.id} value={f.id}>
                      {f.numero} - {f.nombre.substring(0, 30)}...
                    </option>
                  ))}
                </select>
              </div>

              <div className="relative">
                <label className="input-label">Materia</label>
                <div className="relative">
                  <select
                    value={materiaSeleccionadaVista}
                    onChange={(e) => {
                      setMateriaSeleccionadaVista(e.target.value);
                      setSesiones([]);
                    }}
                    disabled={!fichaSeleccionadaVista || loadingMateriasVista || errorMateriasVista || materiasVista.length === 0}
                    className={\`input-field \${loadingMateriasVista ? 'pl-10' : ''} \${errorMateriasVista ? 'border-red-500' : ''}\`}
                  >
                    {loadingMateriasVista ? (
                      <option value="">Cargando materias...</option>
                    ) : errorMateriasVista ? (
                      <option value="">Error al cargar materias</option>
                    ) : (
                      <>
                        <option value="">Seleccione una materia...</option>
                        {materiasVista.map(m => (
                          <option key={m.id} value={m.id}>
                            {m.nombre} - {m.instructor?.fullName || 'Sin asignar'}
                          </option>
                        ))}
                      </>
                    )}
                  </select>
                  {loadingMateriasVista && (
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-red-500">
                      <Loader2 size={18} className="animate-spin" />
                    </div>
                  )}
                </div>
                {errorMateriasVista && (
                  <p className="mt-1 text-sm text-red-500">Intenta seleccionar la ficha nuevamente.</p>
                )}
              </div>

              <div>
                <label className="input-label">Fecha Desde</label>
                <input
                  type="date"
                  value={filtroFechaDesde}
                  onChange={e => setFiltroFechaDesde(e.target.value)}
                  className="input-field"
                />
              </div>

              <div>
                <label className="input-label">Fecha Hasta</label>
                <input
                  type="date"
                  value={filtroFechaHasta}
                  onChange={e => setFiltroFechaHasta(e.target.value)}
                  className="input-field"
                />
              </div>
            </div>
            
          </div>

          {/* Resultados de Sesiones */}
          {materiaSeleccionadaVista && (
            <div className="card">
              <div className="p-4 md:p-6 border-b border-gray-200 dark:border-zinc-700 flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                  <h3 className="text-lg font-bold text-gray-900 dark:text-white flex items-center gap-2">
                    <Calendar size={20} /> 
                    Sesiones Encontradas ({sesiones.length})
                  </h3>
                  <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                    Listado de sesiones de asistencia registradas
                  </p>
                </div>
                
                {sesiones.length > 0 && (
                  <button
                    onClick={async () => {
                      try {
                        setDownloading(\`materia-\${materiaSeleccionadaVista}\`);
                        showToast('Generando reporte de asistencias...', 'info');
                        const params = new URLSearchParams();
                        if (filtroFechaDesde) params.append('fechaDesde', filtroFechaDesde);
                        if (filtroFechaHasta) params.append('fechaHasta', filtroFechaHasta);
                        const response = await fetch(
                          \`\${import.meta.env.VITE_API_URL || 'http://localhost:3000/api'}/admin/reportes/materia/\${materiaSeleccionadaVista}?\${params.toString()}\`,
                          { headers: { 'Authorization': \`Bearer \${localStorage.getItem('token')}\` } }
                        );
                        if (!response.ok) throw new Error('Error al generar reporte');
                        const blob = await response.blob();
                        const url = window.URL.createObjectURL(blob);
                        const a = document.createElement('a');
                        a.href = url;
                        a.download = \`Asistencias_\${Date.now()}.xlsx\`;
                        document.body.appendChild(a);
                        a.click();
                        window.URL.revokeObjectURL(url);
                        document.body.removeChild(a);
                        showToast('Reporte descargado exitosamente', 'success');
                      } catch (err) {
                        showToast('Error descargando reporte', 'error');
                      } finally {
                        setDownloading(null);
                      }
                    }}
                    disabled={downloading === \`materia-\${materiaSeleccionadaVista}\`}
                    className="btn-secondary text-sm flex items-center gap-2"
                  >
                    <Download size={16} />
                    {downloading === \`materia-\${materiaSeleccionadaVista}\` ? 'Generando...' : 'Descargar Materia Completa'}
                  </button>
                )}
              </div>

              <div className="p-4 md:p-6">
                {loadingSesiones ? (
                  <div className="animate-pulse space-y-4">
                    {[1, 2, 3].map(i => (
                      <div key={i} className="h-16 bg-gray-100 dark:bg-gray-800 rounded-xl" />
                    ))}
                  </div>
                ) : sesiones.length === 0 ? (
                  <EmptyState
                    icon={<Calendar size={48} />}
                    title="No se encontraron sesiones"
                    description="Ajusta los filtros o selecciona otra materia"
                  />
                ) : (
                  <div className="space-y-4">
                    {sesiones.map(sesion => (
                      <div key={sesion.id} className="border border-gray-200 dark:border-zinc-700 rounded-xl overflow-hidden">
                        {/* Cabecera Sesión */}
                        <div 
                          className="p-4 bg-gray-50 dark:bg-gray-800/50 flex flex-col md:flex-row md:items-center justify-between gap-4 cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
                          onClick={() => setSesionExpandida(sesionExpandida === sesion.id ? null : sesion.id)}
                        >
                          <div className="flex items-center gap-4">
                            <div className="w-10 h-10 rounded-full bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center text-blue-600 dark:text-blue-400">
                              <Clock size={20} />
                            </div>
                            <div>
                              <p className="font-bold text-gray-900 dark:text-white">
                                {new Date(sesion.fecha).toLocaleString('es-CO', { dateStyle: 'long', timeStyle: 'short' })}
                              </p>
                              <p className="text-sm text-gray-600 dark:text-gray-400">
                                Instructor: {sesion.instructor}
                              </p>
                            </div>
                          </div>

                          <div className="flex items-center gap-6">
                            <div className="text-right">
                              <p className="text-sm text-gray-500 dark:text-gray-400">Asistencia</p>
                              <p className="font-bold text-gray-900 dark:text-white">
                                {sesion.totalPresentes} / {sesion.totalEsperados} ({sesion.porcentajeAsistencia}%)
                              </p>
                            </div>
                            
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                const materiaObj = materiasVista.find(m => m.id === materiaSeleccionadaVista);
                                handleDownloadReporteSesionIndividual(sesion.id, materiaObj?.nombre || 'Materia', sesion.fecha);
                              }}
                              disabled={downloading === \`sesion-\${sesion.id}\`}
                              className="p-2 hover:bg-gray-200 dark:hover:bg-gray-700 rounded-lg text-gray-500 transition-colors"
                              title="Descargar Sesión Individual"
                            >
                              <FileText size={18} />
                            </button>
                            
                            <div className="text-gray-400">
                              {sesionExpandida === sesion.id ? <ChevronUp size={20} /> : <ChevronDown size={20} />}
                            </div>
                          </div>
                        </div>

                        {/* Detalle Aprendices (Expandible) */}
                        {sesionExpandida === sesion.id && (
                          <div className="p-4 border-t border-gray-200 dark:border-zinc-700 bg-white dark:bg-gray-900">
                            <h4 className="font-semibold text-gray-900 dark:text-white mb-3">Detalle de Aprendices</h4>
                            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
                              {sesion.aprendices.map(aprendiz => (
                                <div key={aprendiz.id} className="flex items-center justify-between p-2 rounded-lg border border-gray-100 dark:border-gray-800">
                                  <div className="flex flex-col min-w-0">
                                    <span className="text-sm font-medium text-gray-900 dark:text-white truncate">
                                      {aprendiz.nombre}
                                    </span>
                                    <span className="text-xs text-gray-500">{aprendiz.documento}</span>
                                  </div>
                                  <div className="ml-2 flex-shrink-0">
                                    {aprendiz.presente ? (
                                      <CheckCircle2 size={18} className="text-green-500" />
                                    ) : (
                                      <XCircle size={18} className="text-red-500" />
                                    )}
                                  </div>
                                </div>
                              ))}
                            </div>
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      )}

      {/* Modal para reporte de materia */}
      <Modal
        open={modalMateria}
        onClose={() => setModalMateria(false)}
        title={\`Reporte de Asistencias - Ficha \${fichaSeleccionada?.numero}\`}
      >
        <div className="space-y-4">
          <p className="text-sm text-gray-600 dark:text-gray-400">
            Selecciona una materia y opcionalmente un rango de fechas para generar el reporte de asistencias.
          </p>

          <div>
            <label className="input-label">Materia *</label>
            <select
              value={materiaSeleccionada}
              onChange={(e) => setMateriaSeleccionada(e.target.value)}
              className="input-field"
            >
              <option value="">Seleccionar materia...</option>
              {materias.map((materia) => (
                <option key={materia.id} value={materia.id}>
                  {materia.nombre} - {materia.instructor?.fullName || 'Sin asignar'}
                </option>
              ))}
            </select>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="input-label">Desde (Opcional)</label>
              <input
                type="date"
                value={fechaDesde}
                onChange={(e) => setFechaDesde(e.target.value)}
                className="input-field"
              />
            </div>
            <div>
              <label className="input-label">Hasta (Opcional)</label>
              <input
                type="date"
                value={fechaHasta}
                onChange={(e) => setFechaHasta(e.target.value)}
                className="input-field"
              />
            </div>
          </div>

          <div className="flex justify-end gap-3 mt-6">
            <button
              onClick={() => setModalMateria(false)}
              className="btn-secondary"
            >
              Cancelar
            </button>
            <button
              onClick={handleDownloadReporteMateria}
              disabled={!materiaSeleccionada || downloading === \`materia-\${materiaSeleccionada}\`}
              className="btn-primary flex items-center gap-2"
            >
              <Download size={18} />
              <span>{downloading === \`materia-\${materiaSeleccionada}\` ? 'Generando...' : 'Descargar Reporte'}</span>
            </button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
`;
fs.writeFileSync(path, content, 'utf8');
console.log('Successfully rebuilt Reportes.jsx');
