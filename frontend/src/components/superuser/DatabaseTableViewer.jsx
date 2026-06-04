import React, { useEffect, useState } from 'react';
import { superUserApi } from '../../services/superUserApi';
import { useToast } from '../../context/ToastContext';
import { ChevronLeft, ChevronRight, FileSpreadsheet } from 'lucide-react';

export default function DatabaseTableViewer({ tableName }) {
  const { showToast } = useToast();
  const [data, setData] = useState([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [limit] = useState(25);
  const [loading, setLoading] = useState(false);
  const [columns, setColumns] = useState([]);

  useEffect(() => {
    setPage(1);
    loadData(1);
  }, [tableName]);

  useEffect(() => {
    loadData(page);
  }, [page]);

  const loadData = async (p) => {
    if (!tableName) return;
    try {
      setLoading(true);
      const res = await superUserApi.getTableData(tableName, p, limit);
      setData(res.data || []);
      setTotal(res.total || 0);
      
      if (res.data && res.data.length > 0) {
        setColumns(Object.keys(res.data[0]));
      } else {
        setColumns([]);
      }
    } catch (err) {
      showToast(`Error cargando tabla ${tableName}`, 'error');
      setData([]);
      setColumns([]);
    } finally {
      setLoading(false);
    }
  };

  const handleExport = async () => {
    try {
      showToast('Generando archivo Excel...', 'info');
      const blob = await superUserApi.exportTableToExcel(tableName);
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `${tableName}_export.xlsx`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
      showToast('Exportación completada', 'success');
    } catch (err) {
      showToast('Error exportando Excel', 'error');
    }
  };

  const renderCellValue = (value) => {
    if (value === null || value === undefined) return <span className="text-gray-400 italic">null</span>;
    if (typeof value === 'boolean') return value ? '✅ Sí' : '❌ No';
    if (typeof value === 'object') return <span className="text-xs text-blue-500 font-mono">{'{} object'}</span>;
    return String(value);
  };

  const totalPages = Math.ceil(total / limit) || 1;

  if (!tableName) {
    return (
      <div className="flex items-center justify-center h-full text-gray-500 bg-white dark:bg-zinc-800 rounded-xl border border-dashed border-gray-300 dark:border-zinc-700">
        Selecciona una tabla del menú lateral
      </div>
    );
  }

  return (
    <div className="bg-white dark:bg-zinc-800 rounded-xl shadow-card border border-gray-100 dark:border-zinc-700 flex flex-col h-full overflow-hidden">
      {/* Table Header */}
      <div className="px-6 py-4 border-b border-gray-100 dark:border-zinc-700 flex justify-between items-center bg-gray-50 dark:bg-zinc-900/50">
        <div>
          <h3 className="font-bold text-gray-900 dark:text-white capitalize text-lg">{tableName}</h3>
          <p className="text-sm text-gray-500">{total} registros totales</p>
        </div>
        <button onClick={handleExport} className="btn-secondary flex items-center gap-2 border-green-200 text-green-700 hover:bg-green-50 dark:border-green-900 dark:text-green-400 dark:hover:bg-green-900/30">
          <FileSpreadsheet size={16} /> Exportar Excel
        </button>
      </div>

      {/* Table Content */}
      <div className="flex-1 overflow-auto relative">
        {loading && (
          <div className="absolute inset-0 bg-white/50 dark:bg-zinc-800/50 flex items-center justify-center z-10">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
          </div>
        )}
        
        {data.length === 0 && !loading ? (
          <div className="p-12 text-center text-gray-500">La tabla está vacía.</div>
        ) : (
          <table className="w-full text-left text-sm border-collapse min-w-max">
            <thead className="bg-white dark:bg-zinc-800 sticky top-0 z-20 shadow-sm">
              <tr>
                {columns.map(col => (
                  <th key={col} className="px-4 py-3 font-semibold text-gray-600 dark:text-gray-300 border-b border-gray-200 dark:border-zinc-700 bg-gray-50 dark:bg-zinc-900/80">
                    {col}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100 dark:divide-zinc-700">
              {data.map((row, idx) => (
                <tr key={row.id || idx} className="hover:bg-gray-50 dark:hover:bg-zinc-800/50">
                  {columns.map(col => (
                    <td key={col} className="px-4 py-2 max-w-[200px] truncate text-gray-700 dark:text-gray-300" title={String(row[col])}>
                      {renderCellValue(row[col])}
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {/* Pagination */}
      <div className="px-6 py-3 border-t border-gray-100 dark:border-zinc-700 flex justify-between items-center bg-gray-50 dark:bg-zinc-900/50">
        <span className="text-sm text-gray-500">
          Página {page} de {totalPages}
        </span>
        <div className="flex gap-2">
          <button 
            disabled={page === 1}
            onClick={() => setPage(p => p - 1)}
            className="p-1.5 rounded bg-white border border-gray-200 text-gray-600 disabled:opacity-50 hover:bg-gray-50 dark:bg-zinc-800 dark:border-zinc-700 dark:text-gray-300 dark:hover:bg-zinc-700"
          >
            <ChevronLeft size={18} />
          </button>
          <button 
            disabled={page === totalPages || totalPages === 0}
            onClick={() => setPage(p => p + 1)}
            className="p-1.5 rounded bg-white border border-gray-200 text-gray-600 disabled:opacity-50 hover:bg-gray-50 dark:bg-zinc-800 dark:border-zinc-700 dark:text-gray-300 dark:hover:bg-zinc-700"
          >
            <ChevronRight size={18} />
          </button>
        </div>
      </div>
    </div>
  );
}
