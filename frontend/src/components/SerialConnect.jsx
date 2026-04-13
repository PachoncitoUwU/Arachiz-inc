import React, { useState, useEffect } from 'react';
import { Usb, RefreshCcw, CheckCircle2, AlertCircle } from 'lucide-react';
import fetchApi from '../services/api';

export default function SerialConnect() {
  const [ports, setPorts] = useState([]);
  const [selectedPort, setSelectedPort] = useState('');
  const [status, setStatus] = useState('disconnected'); // disconnected, connected, error, loading
  const [message, setMessage] = useState('');

  const loadPorts = async () => {
    try {
      const res = await fetchApi('/serial/ports');
      setPorts(res.ports || []);
      if (res.ports && res.ports.length > 0 && !selectedPort) {
         setSelectedPort(res.ports[0].path);
      }
    } catch (err) {
      console.error(err);
    }
  };

  useEffect(() => {
    loadPorts();
  }, []);

  const handleConnect = async () => {
    if (!selectedPort) return;
    setStatus('loading');
    try {
      const res = await fetchApi('/serial/connect', {
        method: 'POST',
        body: JSON.stringify({ path: selectedPort })
      });
      if (res.success) {
        setStatus('connected');
        setMessage(`Conectado a ${selectedPort}`);
      } else {
        setStatus('error');
        setMessage(res.error || 'Error de conexión');
      }
    } catch (err) {
      setStatus('error');
      setMessage(err.message || 'Error al conectar');
    }
  };

  const handleDisconnect = async () => {
    setStatus('loading');
    try {
      await fetchApi('/serial/disconnect', { method: 'POST' });
      setStatus('disconnected');
       setMessage('');
    } catch (err) {
      console.error(err);
      setStatus('error');
    }
  };

  return (
    <div className="card bg-gray-50 border border-gray-200 shadow-sm mt-4">
      <div className="flex items-center justify-between mb-3">
        <h2 className="font-bold text-gray-800 flex items-center gap-2">
          <Usb size={20} className="text-[#4285F4]" />
          Lector de Huella y NFC
        </h2>
        {status === 'connected' && (
          <span className="flex items-center gap-1 text-xs font-semibold text-green-600 bg-green-100 px-2 py-1 rounded-full">
            <CheckCircle2 size={12} /> Conectado
          </span>
        )}
        {status === 'error' && (
          <span className="flex items-center gap-1 text-xs font-semibold text-red-600 bg-red-100 px-2 py-1 rounded-full">
             <AlertCircle size={12} /> Error
          </span>
        )}
      </div>

      <div className="flex flex-col sm:flex-row items-center gap-3">
        <div className="flex-1 w-full flex items-center gap-2">
          <select 
            className="input flex-1 py-2" 
            value={selectedPort} 
             onChange={(e) => setSelectedPort(e.target.value)}
            disabled={status === 'connected' || status === 'loading'}
          >
            <option value="">Selecciona un puerto COM...</option>
            {ports.map((p) => (
              <option key={p.path} value={p.path}>
                {p.path} {p.manufacturer ? `- ${p.manufacturer}` : ''}
              </option>
            ))}
          </select>
          
          <button 
             onClick={loadPorts} 
            className="p-2 text-gray-500 hover:text-[#4285F4] hover:bg-blue-50 rounded-lg transition-colors border border-gray-200 bg-white"
             title="Refrescar Puertos"
             disabled={status === 'connected'}
          >
            <RefreshCcw size={18} />
          </button>
        </div>

        <div className="w-full sm:w-auto">
           {status !== 'connected' ? (
             <button 
                onClick={handleConnect} 
                className="btn btn-primary w-full whitespace-nowrap py-2"
                disabled={!selectedPort || status === 'loading'}
             >
                {status === 'loading' ? 'Conectando...' : 'Vincular Lector'}
             </button>
           ) : (
             <button 
                onClick={handleDisconnect} 
                className="btn bg-gray-200 text-gray-700 hover:bg-gray-300 w-full whitespace-nowrap py-2 border-0"
             >
                Desconectar
             </button>
           )}
        </div>
      </div>
      {message && status === 'error' && (
         <p className="text-red-500 text-xs mt-2 font-medium">{message}</p>
      )}
    </div>
  );
}
