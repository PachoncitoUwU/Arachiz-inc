import React, { useState, useEffect } from 'react';
import { BarChart3, Download, FileText, Calendar, Filter, RefreshCw, Table } from 'lucide-react';
import fetchApi from '../../services/api';
import { useToast } from '../../context/ToastContext';
import PageHeader from '../../components/PageHeader';

const API_BASE = import.meta.env.VITE_SOCKET_URL || 'http://localhost:3000';

export default function InstructorReportes() {
  const { showToast } = useToast();
  const [materias, setMaterias] = useState([]);
  const [selectedMateria, setSelectedMateria] = useState('');
  const [fechaDesde, setFechaDesde] = useState('');
  const [fechaHasta, setFechaHasta] = useState('');
  const [loading, setLoading] = useState(true);
  const [exporting, setExporting] = useState('');

  useEffect(() => {
    fetchApi('/materias/my-materias')
      .then(d => {
        setMaterias(d.materias || []);
        if (d.materias?.length > 0) setSelectedMateria(d.materias[0].id);
      })
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  const exportar = async (tipo) => {
    if (!selectedMateria) {
      showToast('Selecciona una materia primero', 'error');
      return;
    }

    setExporting(tipo);
    try {
      const token = localStorage.getItem('token');
      let url = '';
      let filename = '';

      if (tipo === 'rango') {
        const params = new URLSearchParams();
        if (fechaDesde) params.append('desde', fechaDesde);
        if (fechaHasta) params.append('hasta', fechaHasta);
        url = `${API_BASE}/api/export/materia/${selectedMateria}/rango?${params}`;
        filename = `Asistencia_Rango_${fechaDesde || 'inicio'}_${fechaHasta || 'hoy'}.csv`;
      } else if (tipo === 'consolidado') {
        url = `${API_BASE}/api/export/materia/${selectedMateria}/consolidado`;
        const nombreMateria = materias.find(m => m.id === selectedMateria)?.nombre || 'Materia';
        filename = `Consolidado_${nombreMateria}.xlsx`;
      }

      const res = await fetch(url, {
        headers: { Authorization: `Bearer ${token}` }
      });

      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error || 'Error al exportar');
      }

      const blob = await res.blob();
      const blobUrl = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = blobUrl;
      a.download = filename;
      a.click();
      URL.revokeObjectURL(blobUrl);
      showToast(`✅ ${tipo === 'consolidado' ? 'Reporte Consolidado' : 'Reporte por Rango'} descargado`, 'success');
    } catch (err) {
      showToast(err.message, 'error');
    } finally {
      setExporting('');
    }
  };

  return (
    <div className="animate-fade-in-up space-y-6">
      <PageHeader title="Reportes" subtitle="Exporta datos de asistencia en Excel y CSV" />

      {/* Configuración */}
      <div className="card-hover dark:bg-gray-900 dark:border-gray-800">
        <div className="flex items-center gap-3 mb-6">
          <div className="w-10 h-10 rounded-xl bg-blue-50 dark:bg-blue-900/20 flex items-center justify-center">
            <Filter size={20} className="text-blue-500" />
          </div>
          <div>
            <h2 className="font-bold text-gray-900 dark:text-white">Configurar Reporte</h2>
            <p className="text-xs text-gray-500">Selecciona materia y rango de fechas</p>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
          <div>
            <label className="block text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wide mb-2">
              Materia
            </label>
            <select
              value={selectedMateria}
              onChange={e => setSelectedMateria(e.target.value)}
              className="w-full px-4 py-3 rounded-xl border-2 border-gray-200 dark:border-zinc-700 bg-white dark:bg-zinc-800 text-gray-900 dark:text-white text-sm font-medium focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all"
            >
              {loading ? (
                <option>Cargando...</option>
              ) : materias.length === 0 ? (
                <option>Sin materias disponibles</option>
              ) : (
                materias.map(m => (
                  <option key={m.id} value={m.id}>{m.nombre} – Ficha {m.ficha?.numero}</option>
                ))
              )}
            </select>
          </div>

          <div>
            <label className="block text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wide mb-2 flex items-center gap-1">
              <Calendar size={12} /> Desde
            </label>
            <input
              type="date"
              value={fechaDesde}
              onChange={e => setFechaDesde(e.target.value)}
              className="w-full px-4 py-3 rounded-xl border-2 border-gray-200 dark:border-zinc-700 bg-white dark:bg-zinc-800 text-gray-900 dark:text-white text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wide mb-2 flex items-center gap-1">
              <Calendar size={12} /> Hasta
            </label>
            <input
              type="date"
              value={fechaHasta}
              onChange={e => setFechaHasta(e.target.value)}
              className="w-full px-4 py-3 rounded-xl border-2 border-gray-200 dark:border-zinc-700 bg-white dark:bg-zinc-800 text-gray-900 dark:text-white text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all"
            />
          </div>
        </div>

        <button
          onClick={() => { setFechaDesde(''); setFechaHasta(''); }}
          className="text-xs text-gray-500 hover:text-gray-700 dark:hover:text-gray-300 flex items-center gap-1 transition-colors"
        >
          <RefreshCw size={12} /> Limpiar fechas
        </button>
      </div>

      {/* Tipos de reportes */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">

        {/* Reporte por rango */}
        <div className="card-hover dark:bg-gray-900 dark:border-gray-800 group hover:border-blue-200 dark:hover:border-blue-700 transition-all">
          <div className="flex items-start gap-4 mb-4">
            <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-blue-500 to-blue-600 flex items-center justify-center shadow-lg group-hover:scale-110 transition-transform">
              <FileText size={24} className="text-white" />
            </div>
            <div>
              <h3 className="font-bold text-gray-900 dark:text-white text-lg">Reporte por Rango</h3>
              <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                Exporta asistencias sesión por sesión en un rango de fechas. Formato CSV, compatible con Excel.
              </p>
            </div>
          </div>

          <ul className="space-y-2 mb-6">
            {['Fecha de cada sesión', 'Estado: Presente / Ausente / Tarde', 'Hora de ingreso', 'Método de registro'].map(item => (
              <li key={item} className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400">
                <span className="w-5 h-5 rounded-full bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center flex-shrink-0">
                  <span className="w-1.5 h-1.5 rounded-full bg-blue-500"></span>
                </span>
                {item}
              </li>
            ))}
          </ul>

          <button
            onClick={() => exportar('rango')}
            disabled={exporting === 'rango' || !selectedMateria}
            className="w-full py-3 px-4 rounded-xl bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 text-white font-semibold text-sm flex items-center justify-center gap-2 transition-all shadow-md hover:shadow-lg hover:shadow-blue-500/30 disabled:opacity-50 disabled:cursor-not-allowed transform active:scale-95"
          >
            {exporting === 'rango' ? (
              <RefreshCw size={16} className="animate-spin" />
            ) : (
              <Download size={16} />
            )}
            {exporting === 'rango' ? 'Exportando...' : 'Exportar CSV'}
          </button>
        </div>

        {/* Reporte consolidado */}
        <div className="card-hover dark:bg-gray-900 dark:border-gray-800 group hover:border-green-200 dark:hover:border-green-700 transition-all">
          <div className="flex items-start gap-4 mb-4">
            <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-green-500 to-emerald-600 flex items-center justify-center shadow-lg group-hover:scale-110 transition-transform">
              <Table size={24} className="text-white" />
            </div>
            <div>
              <h3 className="font-bold text-gray-900 dark:text-white text-lg">Reporte Consolidado</h3>
              <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                Vista general de asistencia por estudiante con % de presencia. Una columna por sesión. Ideal para revisiones.
              </p>
            </div>
          </div>

          <ul className="space-y-2 mb-6">
            {['Una fila por estudiante', 'Una columna por sesión (✓ / ✗ / T)', '% de asistencia con color (rojo/amarillo/verde)', 'Total de tardanzas'].map(item => (
              <li key={item} className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400">
                <span className="w-5 h-5 rounded-full bg-green-100 dark:bg-green-900/30 flex items-center justify-center flex-shrink-0">
                  <span className="w-1.5 h-1.5 rounded-full bg-green-500"></span>
                </span>
                {item}
              </li>
            ))}
          </ul>

          <button
            onClick={() => exportar('consolidado')}
            disabled={exporting === 'consolidado' || !selectedMateria}
            className="w-full py-3 px-4 rounded-xl bg-gradient-to-r from-green-500 to-emerald-600 hover:from-green-600 hover:to-emerald-700 text-white font-semibold text-sm flex items-center justify-center gap-2 transition-all shadow-md hover:shadow-lg hover:shadow-green-500/30 disabled:opacity-50 disabled:cursor-not-allowed transform active:scale-95"
          >
            {exporting === 'consolidado' ? (
              <RefreshCw size={16} className="animate-spin" />
            ) : (
              <Download size={16} />
            )}
            {exporting === 'consolidado' ? 'Generando...' : 'Exportar Excel'}
          </button>
        </div>
      </div>

      {/* Nota informativa */}
      <div className="bg-amber-50 dark:bg-amber-900/10 border border-amber-200 dark:border-amber-800/30 rounded-2xl p-4 flex gap-3">
        <BarChart3 size={20} className="text-amber-500 flex-shrink-0 mt-0.5" />
        <div>
          <p className="text-sm font-semibold text-amber-800 dark:text-amber-400">Consejo</p>
          <p className="text-xs text-amber-700/80 dark:text-amber-500 mt-1">
            El <strong>Reporte Consolidado</strong> incluye todas las sesiones cerradas de la materia seleccionada, sin importar el rango de fechas. Para exportar un período específico, usa el <strong>Reporte por Rango</strong>.
          </p>
        </div>
      </div>
    </div>
  );
}
