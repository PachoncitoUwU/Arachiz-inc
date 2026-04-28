import React, { useEffect, useState } from 'react';
import { BarChart3, Download, FileText, Users, BookOpen, Calendar, Filter, TrendingUp, PieChart } from 'lucide-react';
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
  const [vistaActual, setVistaActual] = useState('reportes'); // 'reportes' | 'estadisticas'
  
  // Estados para modal de reporte de materia
  const [modalMateria, setModalMateria] = useState(false);
  const [fichaSeleccionada, setFichaSeleccionada] = useState(null);
  const [materias, setMaterias] = useState([]);
  const [materiaSeleccionada, setMateriaSeleccionada] = useState('');
  const [fechaDesde, setFechaDesde] = useState('');
  const [fechaHasta, setFechaHasta] = useState('');
  
  // Estados para estadísticas
  const [estadisticas, setEstadisticas] = useState(null);
  const [loadingEstadisticas, setLoadingEstadisticas] = useState(false);

  useEffect(() => {
    loadFichas();
  }, []);

  useEffect(() => {
    if (vistaActual === 'estadisticas') {
      loadEstadisticas();
    }
  }, [vistaActual]);

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

  const loadEstadisticas = async () => {
    try {
      setLoadingEstadisticas(true);
      const data = await fetchApi('/admin/reportes/estadisticas');
      setEstadisticas(data);
    } catch (err) {
      console.error('Error cargando estadísticas:', err);
      showToast('Error cargando estadísticas', 'error');
    } finally {
      setLoadingEstadisticas(false);
    }
  };

  const handleDownloadReporteFicha = async (fichaId) => {
    try {
      setDownloading(`ficha-${fichaId}`);
      showToast('Generando reporte de ficha...', 'info');
      
      const response = await fetch(`${import.meta.env.VITE_API_URL || 'http://localhost:3000/api'}/admin/reportes/ficha/${fichaId}`, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      });

      if (!response.ok) {
        throw new Error('Error al generar reporte');
      }

      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `Ficha_${fichaId}_${Date.now()}.xlsx`;
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
      const data = await fetchApi(`/admin/fichas/${ficha.id}`);
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
      setDownloading(`materia-${materiaSeleccionada}`);
      showToast('Generando reporte de asistencias...', 'info');
      
      const params = new URLSearchParams();
      if (fechaDesde) params.append('fechaDesde', fechaDesde);
      if (fechaHasta) params.append('fechaHasta', fechaHasta);

      const response = await fetch(
        `${import.meta.env.VITE_API_URL || 'http://localhost:3000/api'}/admin/reportes/materia/${materiaSeleccionada}?${params.toString()}`,
        {
          headers: {
            'Authorization': `Bearer ${localStorage.getItem('token')}`
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
      a.download = `Asistencias_${Date.now()}.xlsx`;
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
      
      const response = await fetch(`${import.meta.env.VITE_API_URL || 'http://localhost:3000/api'}/admin/reportes/consolidado`, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      });

      if (!response.ok) {
        throw new Error('Error al generar reporte');
      }

      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `Reporte_Consolidado_${Date.now()}.xlsx`;
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
        subtitle={vistaActual === 'reportes' ? "Genera y descarga reportes en formato Excel" : "Analiza tendencias y estadísticas de asistencia"}
        action={
          vistaActual === 'reportes' ? (
            <button
              onClick={handleDownloadReporteConsolidado}
              disabled={downloading === 'consolidado' || fichas.length === 0}
              className="btn-primary flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <Download size={18} />
              <span>{downloading === 'consolidado' ? 'Generando...' : 'Reporte Consolidado'}</span>
            </button>
          ) : (
            <button
              onClick={loadEstadisticas}
              disabled={loadingEstadisticas}
              className="btn-secondary flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <TrendingUp size={18} />
              <span>{loadingEstadisticas ? 'Actualizando...' : 'Actualizar Datos'}</span>
            </button>
          )
        }
      />

      {/* Toggle entre Reportes y Estadísticas */}
      <div className="card mb-5">
        <div className="flex gap-2">
          <button
            onClick={() => setVistaActual('reportes')}
            className={`btn-secondary flex-1 flex items-center justify-center gap-2 ${
              vistaActual === 'reportes' ? 'bg-red-100 dark:bg-red-900/30 text-red-600 dark:text-red-400 border-red-300 dark:border-red-700' : ''
            }`}
          >
            <Download size={16} />
            Descargar Reportes
          </button>
          <button
            onClick={() => setVistaActual('estadisticas')}
            className={`btn-secondary flex-1 flex items-center justify-center gap-2 ${
              vistaActual === 'estadisticas' ? 'bg-red-100 dark:bg-red-900/30 text-red-600 dark:text-red-400 border-red-300 dark:border-red-700' : ''
            }`}
          >
            <PieChart size={16} />
            Ver Estadísticas
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
                  <div className="text-2xl font-bold text-gray-900 dark:text-gray-100">{fichas.length}</div>
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
                  <div className="text-2xl font-bold text-gray-900 dark:text-gray-100">
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
                  <div className="text-2xl font-bold text-gray-900 dark:text-gray-100">
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
              <div className="p-6 border-b border-gray-200 dark:border-gray-700">
                <h3 className="text-lg font-bold text-gray-900 dark:text-gray-100">Reportes por Ficha</h3>
                <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">Descarga reportes individuales de cada ficha</p>
              </div>
              <div className="divide-y divide-gray-200 dark:divide-gray-700">
                {fichas.map((ficha) => (
                  <div key={ficha.id} className="p-6 hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors">
                    <div className="flex items-center justify-between">
                      <div className="flex-1">
                        <h4 className="font-bold text-gray-900 dark:text-gray-100">Ficha {ficha.numero}</h4>
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
                      <div className="flex gap-2">
                        <button
                          onClick={() => handleDownloadReporteFicha(ficha.id)}
                          disabled={downloading === `ficha-${ficha.id}`}
                          className="btn-secondary flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
                          title="Descargar información general de la ficha"
                        >
                          <FileText size={16} />
                          <span>{downloading === `ficha-${ficha.id}` ? 'Generando...' : 'Info Ficha'}</span>
                        </button>
                        <button
                          onClick={() => handleOpenModalMateria(ficha)}
                          className="btn-primary flex items-center gap-2"
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

      {/* VISTA DE ESTADÍSTICAS */}
      {vistaActual === 'estadisticas' && (
        <>
          {loadingEstadisticas ? (
            <div className="card animate-pulse">
              <div className="h-96 bg-gray-100 dark:bg-gray-800 rounded-xl" />
            </div>
          ) : estadisticas ? (
            <>
              {/* Comparativa de Fichas */}
              <div className="card mb-5">
                <div className="p-6 border-b border-gray-200 dark:border-gray-700">
                  <h3 className="text-lg font-bold text-gray-900 dark:text-gray-100 flex items-center gap-2">
                    <BarChart3 size={20} />
                    Comparativa de Fichas por Asistencia
                  </h3>
                  <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">Porcentaje de asistencia promedio por ficha</p>
                </div>
                <div className="p-6">
                  {estadisticas.comparativaFichas.length === 0 ? (
                    <p className="text-center text-gray-500 dark:text-gray-400 py-8">No hay datos de asistencia disponibles</p>
                  ) : (
                    <div className="space-y-4">
                      {estadisticas.comparativaFichas.map((ficha) => (
                        <div key={ficha.numero} className="flex items-center gap-4">
                          <div className="w-24 text-sm font-medium text-gray-900 dark:text-gray-100">
                            Ficha {ficha.numero}
                          </div>
                          <div className="flex-1">
                            <div className="flex items-center justify-between mb-1">
                              <span className="text-sm text-gray-600 dark:text-gray-400 truncate max-w-[200px]">
                                {ficha.nombre}
                              </span>
                              <span className="text-sm font-bold text-gray-900 dark:text-gray-100">
                                {ficha.porcentajeAsistencia}%
                              </span>
                            </div>
                            <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-3">
                              <div
                                className={`h-3 rounded-full transition-all ${
                                  ficha.porcentajeAsistencia >= 80 ? 'bg-green-500' :
                                  ficha.porcentajeAsistencia >= 60 ? 'bg-yellow-500' : 'bg-red-500'
                                }`}
                                style={{ width: `${Math.min(ficha.porcentajeAsistencia, 100)}%` }}
                              />
                            </div>
                          </div>
                          <div className="text-xs text-gray-500 dark:text-gray-400">
                            {ficha.totalAprendices} aprendices
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>

              {/* Tendencias de Asistencia */}
              <div className="card mb-5">
                <div className="p-6 border-b border-gray-200 dark:border-gray-700">
                  <h3 className="text-lg font-bold text-gray-900 dark:text-gray-100 flex items-center gap-2">
                    <TrendingUp size={20} />
                    Tendencias de Asistencia (Últimos 6 Meses)
                  </h3>
                  <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">Evolución del porcentaje de asistencia mensual</p>
                </div>
                <div className="p-6">
                  {estadisticas.tendenciasAsistencia.length === 0 ? (
                    <p className="text-center text-gray-500 dark:text-gray-400 py-8">No hay datos de tendencias disponibles</p>
                  ) : (
                    <div className="space-y-4">
                      {estadisticas.tendenciasAsistencia.map((mes, idx) => (
                        <div key={mes.mes} className="flex items-center gap-4">
                          <div className="w-20 text-sm font-medium text-gray-900 dark:text-gray-100">
                            {mes.mes}
                          </div>
                          <div className="flex-1">
                            <div className="flex items-center justify-between mb-1">
                              <span className="text-sm text-gray-600 dark:text-gray-400">
                                {mes.totalAsistencias} asistencias promedio
                              </span>
                              <span className="text-sm font-bold text-gray-900 dark:text-gray-100">
                                {mes.porcentajeAsistencia}%
                              </span>
                            </div>
                            <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
                              <div
                                className="h-2 bg-blue-500 rounded-full transition-all"
                                style={{ width: `${Math.min(mes.porcentajeAsistencia, 100)}%` }}
                              />
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>

              {/* Grid de estadísticas */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-5 mb-5">
                {/* Top Materias */}
                <div className="card">
                  <div className="p-6 border-b border-gray-200 dark:border-gray-700">
                    <h3 className="text-lg font-bold text-gray-900 dark:text-gray-100 flex items-center gap-2">
                      <BookOpen size={20} />
                      Top 5 Materias por Asistencia
                    </h3>
                  </div>
                  <div className="p-6">
                    {estadisticas.materiasStats.length === 0 ? (
                      <p className="text-center text-gray-500 dark:text-gray-400 py-8">No hay datos disponibles</p>
                    ) : (
                      <div className="space-y-3">
                        {estadisticas.materiasStats.slice(0, 5).map((materia, idx) => (
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
                              <p className="text-xs text-gray-500 dark:text-gray-400">
                                {materia.instructor} • Ficha {materia.fichaNumero}
                              </p>
                            </div>
                            <div className="text-right">
                              <p className="text-lg font-bold text-green-600 dark:text-green-400">
                                {materia.porcentajeAsistencia}%
                              </p>
                              <p className="text-xs text-gray-500 dark:text-gray-400">
                                {materia.totalAsistencias} sesiones
                              </p>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </div>

                {/* Aprendices en Riesgo */}
                <div className="card">
                  <div className="p-6 border-b border-gray-200 dark:border-gray-700">
                    <h3 className="text-lg font-bold text-gray-900 dark:text-gray-100 flex items-center gap-2">
                      <Users size={20} />
                      Aprendices en Riesgo (&lt;70%)
                    </h3>
                  </div>
                  <div className="p-6">
                    {estadisticas.aprendicesRiesgo.length === 0 ? (
                      <div className="text-center py-8">
                        <div className="w-16 h-16 bg-green-100 dark:bg-green-900/30 rounded-full flex items-center justify-center mx-auto mb-3">
                          <Users size={32} className="text-green-600 dark:text-green-400" />
                        </div>
                        <p className="text-sm text-green-600 dark:text-green-400 font-medium">
                          ¡Excelente! No hay aprendices en riesgo
                        </p>
                        <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                          Todos tienen más del 70% de asistencia
                        </p>
                      </div>
                    ) : (
                      <div className="space-y-3 max-h-80 overflow-y-auto">
                        {estadisticas.aprendicesRiesgo.map((aprendiz) => (
                          <div key={aprendiz.id} className="flex items-center gap-3 p-3 bg-red-50 dark:bg-red-900/20 rounded-xl border border-red-200 dark:border-red-800">
                            <div className="w-8 h-8 bg-red-100 dark:bg-red-900/30 rounded-full flex items-center justify-center flex-shrink-0">
                              <span className="text-sm font-bold text-red-600 dark:text-red-400">
                                !
                              </span>
                            </div>
                            <div className="flex-1 min-w-0">
                              <p className="text-sm font-medium text-gray-900 dark:text-gray-100 truncate">
                                {aprendiz.nombre}
                              </p>
                              <p className="text-xs text-gray-500 dark:text-gray-400">
                                Ficha {aprendiz.fichaNumero} • {aprendiz.totalPresentes}/{aprendiz.totalAsistencias}
                              </p>
                            </div>
                            <div className="text-right">
                              <p className="text-lg font-bold text-red-600 dark:text-red-400">
                                {aprendiz.porcentajeAsistencia}%
                              </p>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              </div>

              {/* Resumen de Fichas */}
              <div className="card">
                <div className="p-6 border-b border-gray-200 dark:border-gray-700">
                  <h3 className="text-lg font-bold text-gray-900 dark:text-gray-100 flex items-center gap-2">
                    <FileText size={20} />
                    Resumen Detallado por Ficha
                  </h3>
                </div>
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead className="bg-gray-50 dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700">
                      <tr>
                        <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 dark:text-gray-400 uppercase tracking-wider">
                          Ficha
                        </th>
                        <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 dark:text-gray-400 uppercase tracking-wider">
                          Nombre
                        </th>
                        <th className="px-4 py-3 text-center text-xs font-semibold text-gray-600 dark:text-gray-400 uppercase tracking-wider">
                          Aprendices
                        </th>
                        <th className="px-4 py-3 text-center text-xs font-semibold text-gray-600 dark:text-gray-400 uppercase tracking-wider">
                          Materias
                        </th>
                        <th className="px-4 py-3 text-center text-xs font-semibold text-gray-600 dark:text-gray-400 uppercase tracking-wider">
                          Asistencias
                        </th>
                        <th className="px-4 py-3 text-center text-xs font-semibold text-gray-600 dark:text-gray-400 uppercase tracking-wider">
                          % Asistencia
                        </th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
                      {estadisticas.fichasStats.map((ficha) => (
                        <tr key={ficha.id} className="hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors">
                          <td className="px-4 py-3">
                            <span className="font-medium text-gray-900 dark:text-gray-100">
                              {ficha.numero}
                            </span>
                          </td>
                          <td className="px-4 py-3">
                            <span className="text-sm text-gray-900 dark:text-gray-100 truncate max-w-[200px] block">
                              {ficha.nombre}
                            </span>
                          </td>
                          <td className="px-4 py-3 text-center">
                            <span className="text-sm text-gray-900 dark:text-gray-100">
                              {ficha.totalAprendices}
                            </span>
                          </td>
                          <td className="px-4 py-3 text-center">
                            <span className="text-sm text-gray-900 dark:text-gray-100">
                              {ficha.totalMaterias}
                            </span>
                          </td>
                          <td className="px-4 py-3 text-center">
                            <span className="text-sm text-gray-900 dark:text-gray-100">
                              {ficha.totalAsistencias}
                            </span>
                          </td>
                          <td className="px-4 py-3 text-center">
                            <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                              ficha.porcentajeAsistencia >= 80 
                                ? 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400'
                                : ficha.porcentajeAsistencia >= 60
                                ? 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400'
                                : 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400'
                            }`}>
                              {ficha.porcentajeAsistencia}%
                            </span>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </>
          ) : (
            <div className="card">
              <EmptyState
                icon={<PieChart size={48} />}
                title="No hay estadísticas"
                description="No se pudieron cargar las estadísticas"
              />
            </div>
          )}
        </>
      )}

      {/* Modal para reporte de materia */}
      <Modal
        open={modalMateria}
        onClose={() => setModalMateria(false)}
        title={`Reporte de Asistencias - Ficha ${fichaSeleccionada?.numero}`}
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
                  {materia.nombre} - {materia.instructor.fullName}
                </option>
              ))}
            </select>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="input-label">Fecha Desde (opcional)</label>
              <input
                type="date"
                value={fechaDesde}
                onChange={(e) => setFechaDesde(e.target.value)}
                className="input-field"
              />
            </div>
            <div>
              <label className="input-label">Fecha Hasta (opcional)</label>
              <input
                type="date"
                value={fechaHasta}
                onChange={(e) => setFechaHasta(e.target.value)}
                className="input-field"
              />
            </div>
          </div>

          <div className="p-3 bg-blue-50 dark:bg-blue-900/20 rounded-xl border border-blue-200 dark:border-blue-700">
            <p className="text-xs text-blue-800 dark:text-blue-300">
              💡 Si no seleccionas fechas, se incluirán todas las asistencias de la materia.
            </p>
          </div>

          <div className="flex gap-3 pt-2">
            <button
              onClick={() => setModalMateria(false)}
              className="btn-secondary flex-1"
            >
              Cancelar
            </button>
            <button
              onClick={handleDownloadReporteMateria}
              disabled={!materiaSeleccionada || downloading === `materia-${materiaSeleccionada}`}
              className="btn-primary flex-1 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {downloading === `materia-${materiaSeleccionada}` ? 'Generando...' : 'Descargar'}
            </button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
