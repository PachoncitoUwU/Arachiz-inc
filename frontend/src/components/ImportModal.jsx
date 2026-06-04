import React, { useState, useRef } from 'react';
import { UploadCloud, X, FileText, Download, Loader } from 'lucide-react';
import fetchApi from '../services/api';

export default function ImportModal({ isOpen, onClose, type, fichaId, onSuccess }) {
  const [file, setFile] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [result, setResult] = useState(null);
  const fileInputRef = useRef(null);

  if (!isOpen) return null;

  const title = type === 'aprendices' ? 'Importar Aprendices' : 'Importar Materias';
  const downloadUrl = `/import/plantilla/${type}`;
  const uploadUrl = `/import/ficha/${fichaId}/${type}`;

  const handleFileChange = (e) => {
    const selected = e.target.files[0];
    if (selected && (selected.name.endsWith('.csv') || selected.name.endsWith('.xlsx'))) {
      setFile(selected);
      setError('');
      setResult(null);
    } else {
      setFile(null);
      setError('Por favor selecciona un archivo .csv o .xlsx');
    }
  };

  const handleDrop = (e) => {
    e.preventDefault();
    const dropped = e.dataTransfer.files[0];
    if (dropped && (dropped.name.endsWith('.csv') || dropped.name.endsWith('.xlsx'))) {
      setFile(dropped);
      setError('');
      setResult(null);
    } else {
      setError('Solo se permiten archivos .csv o .xlsx');
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!file) return setError('Selecciona un archivo');
    setLoading(true);
    setError('');
    
    try {
      const formData = new FormData();
      formData.append('file', file);
      
      const token = localStorage.getItem('token');
      const API_BASE = import.meta.env.VITE_SOCKET_URL || 'http://localhost:3000';
      
      const response = await fetch(`${API_BASE}/api${uploadUrl}`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`
        },
        body: formData
      });
      
      const data = await response.json();
      
      if (!response.ok) throw new Error(data.error || 'Error al importar');
      
      setResult(data.resultados);
      if (onSuccess) onSuccess();
      
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const downloadPlantilla = async () => {
    try {
      const token = localStorage.getItem('token');
      const API_BASE = import.meta.env.VITE_SOCKET_URL || 'http://localhost:3000';
      const response = await fetch(`${API_BASE}/api${downloadUrl}`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (!response.ok) throw new Error('Error al descargar');
      const blob = await response.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `Plantilla_${type}.xlsx`;
      a.click();
      URL.revokeObjectURL(url);
    } catch (err) {
      setError('No se pudo descargar la plantilla');
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fade-in">
      <div className="bg-white dark:bg-zinc-800 rounded-2xl shadow-xl w-full max-w-lg border border-gray-100 dark:border-zinc-700 overflow-hidden flex flex-col max-h-[90vh]">
        <div className="flex items-center justify-between p-4 border-b border-gray-100 dark:border-zinc-700">
          <h3 className="text-lg font-bold text-gray-900 dark:text-white">{title}</h3>
          <button onClick={onClose} className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 dark:hover:bg-zinc-700 rounded-full transition-colors">
            <X size={20} />
          </button>
        </div>

        <div className="p-6 overflow-y-auto">
          {!result ? (
            <>
              <div className="mb-6 flex justify-between items-center bg-blue-50 dark:bg-blue-900/20 p-4 rounded-xl border border-blue-100 dark:border-blue-800">
                <div className="text-sm text-blue-800 dark:text-blue-300">
                  <p className="font-semibold mb-1">Paso 1: Descarga la plantilla</p>
                  <p className="text-xs opacity-80">Llena la información respetando las columnas sugeridas.</p>
                </div>
                <button type="button" onClick={downloadPlantilla} className="btn-secondary text-sm flex items-center gap-2 whitespace-nowrap">
                  <Download size={14}/> Plantilla
                </button>
              </div>

              <div className="mb-4">
                <p className="font-semibold text-sm text-gray-900 dark:text-white mb-2">Paso 2: Sube el archivo completado</p>
                <div 
                  className={`border-2 border-dashed rounded-xl p-8 text-center transition-colors ${file ? 'border-[#34A853] bg-green-50 dark:bg-green-900/10' : 'border-gray-300 dark:border-zinc-600 hover:border-[#4285F4] hover:bg-blue-50 dark:hover:bg-zinc-700'}`}
                  onDragOver={(e) => e.preventDefault()}
                  onDrop={handleDrop}
                  onClick={() => fileInputRef.current?.click()}
                >
                  <input type="file" ref={fileInputRef} className="hidden" accept=".csv, .xlsx" onChange={handleFileChange} />
                  {file ? (
                    <div className="flex flex-col items-center gap-2 text-[#34A853]">
                      <FileText size={32} />
                      <span className="font-semibold text-sm">{file.name}</span>
                      <span className="text-xs text-gray-500">{(file.size / 1024).toFixed(1)} KB</span>
                    </div>
                  ) : (
                    <div className="flex flex-col items-center gap-2 text-gray-500 dark:text-gray-400 cursor-pointer">
                      <UploadCloud size={32} className="text-gray-400" />
                      <span className="text-sm font-medium">Haz clic o arrastra tu archivo aquí</span>
                      <span className="text-xs opacity-70">Soporta .xlsx y .csv</span>
                    </div>
                  )}
                </div>
              </div>

              {error && (
                <div className="p-3 text-sm text-red-600 bg-red-50 dark:bg-red-900/20 border border-red-100 dark:border-red-800 rounded-lg">
                  {error}
                </div>
              )}
            </>
          ) : (
            <div className="space-y-4">
              <div className="text-center p-4 bg-green-50 dark:bg-green-900/20 border border-green-100 dark:border-green-800 rounded-xl">
                <h4 className="font-bold text-green-700 dark:text-green-400 mb-2">¡Importación finalizada!</h4>
                <div className="flex justify-center gap-4 text-sm text-green-800 dark:text-green-300">
                  <div className="text-center">
                    <span className="block text-2xl font-black">{result.creados}</span> Creados
                  </div>
                  {result.unidos !== undefined && (
                    <div className="text-center">
                      <span className="block text-2xl font-black">{result.unidos}</span> Unidos
                    </div>
                  )}
                  <div className="text-center">
                    <span className="block text-2xl font-black text-red-500">{result.errores.length}</span> Errores
                  </div>
                </div>
              </div>

              {result.errores.length > 0 && (
                <div className="mt-4">
                  <p className="font-semibold text-sm text-gray-900 dark:text-white mb-2">Detalle de errores:</p>
                  <div className="max-h-40 overflow-y-auto bg-gray-50 dark:bg-zinc-900 p-3 rounded-lg border border-gray-200 dark:border-zinc-700 text-xs font-mono text-red-600 dark:text-red-400 space-y-1">
                    {result.errores.map((err, i) => (
                      <div key={i}>• {err}</div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}
        </div>

        <div className="p-4 border-t border-gray-100 dark:border-zinc-700 flex justify-end gap-3 bg-gray-50 dark:bg-zinc-800/50">
          <button type="button" onClick={onClose} className="px-4 py-2 text-sm font-medium text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-zinc-700 rounded-xl transition-colors">
            {result ? 'Cerrar' : 'Cancelar'}
          </button>
          {!result && (
            <button type="button" onClick={handleSubmit} disabled={!file || loading} className="btn-primary text-sm flex items-center gap-2">
              {loading && <Loader size={16} className="animate-spin" />}
              {loading ? 'Importando...' : 'Iniciar Importación'}
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
