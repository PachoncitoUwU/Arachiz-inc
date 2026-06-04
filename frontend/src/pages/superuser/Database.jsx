import React, { useEffect, useState } from 'react';
import { Database as DatabaseIcon, Table as TableIcon } from 'lucide-react';
import PageHeader from '../../components/PageHeader';
import { superUserApi } from '../../services/superUserApi';
import DatabaseTableViewer from '../../components/superuser/DatabaseTableViewer';

export default function Database() {
  const [tables, setTables] = useState([]);
  const [selectedTable, setSelectedTable] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadTables();
  }, []);

  const loadTables = async () => {
    try {
      const data = await superUserApi.getAllTables();
      setTables(data);
      if (data.length > 0) setSelectedTable(data[0]);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="h-[calc(100vh-80px)] flex flex-col space-y-4">
      <div className="shrink-0">
        <PageHeader 
          title="Explorador de Base de Datos" 
          subtitle="Acceso directo de lectura y exportación a todas las tablas del sistema" 
        />
      </div>

      <div className="flex-1 flex flex-col md:flex-row gap-6 min-h-0 pb-4">
        {/* Left Sidebar: Tables List */}
        <div className="w-full md:w-64 shrink-0 flex flex-col bg-white dark:bg-zinc-800 rounded-xl shadow-card border border-gray-100 dark:border-zinc-700 overflow-hidden">
          <div className="p-4 border-b border-gray-100 dark:border-zinc-700 bg-gray-50 dark:bg-zinc-900/50 flex items-center gap-2">
            <DatabaseIcon size={18} className="text-gray-500" />
            <h3 className="font-semibold text-gray-700 dark:text-gray-200">Tablas Prisma</h3>
          </div>
          <div className="flex-1 overflow-y-auto p-2 space-y-1">
            {loading ? (
              <div className="p-4 text-center text-sm text-gray-500">Cargando tablas...</div>
            ) : (
              tables.map(table => (
                <button
                  key={table}
                  onClick={() => setSelectedTable(table)}
                  className={`w-full text-left px-3 py-2 rounded-lg text-sm flex items-center gap-2 transition-colors ${
                    selectedTable === table 
                      ? 'bg-blue-50 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400 font-medium' 
                      : 'text-gray-600 hover:bg-gray-50 dark:text-gray-400 dark:hover:bg-zinc-700/50'
                  }`}
                >
                  <TableIcon size={16} className={selectedTable === table ? 'text-blue-500' : 'text-gray-400'} />
                  {table}
                </button>
              ))
            )}
          </div>
        </div>

        {/* Right Content: Table Viewer */}
        <div className="flex-1 min-w-0">
          <DatabaseTableViewer tableName={selectedTable} />
        </div>
      </div>
    </div>
  );
}
