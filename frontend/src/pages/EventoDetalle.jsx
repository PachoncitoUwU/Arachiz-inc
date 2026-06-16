import React, { useState, useEffect, useContext, useRef } from 'react';
import { AuthContext } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import { ArrowLeft, Users, Calendar, CheckCircle2, XCircle, Search, Ticket } from 'lucide-react';
import fetchApi from '../services/api';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000/api';

export default function EventoDetalle({ eventoId, onBack }) {
  const { token } = useContext(AuthContext);
  const { showToast } = useToast();

  const [evento, setEvento] = useState(null);
  const [aprendices, setAprendices] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  
  // Para el escáner (emulación teclado o lector serial)
  const inputRef = useRef(null);
  const [scanInput, setScanInput] = useState('');

  useEffect(() => {
    loadEvento();
  }, [eventoId]);

  useEffect(() => {
    // Mantener foco en el input oculto para el escáner
    const focusTimer = setInterval(() => {
      if (inputRef.current && document.activeElement !== inputRef.current) {
        if (!document.activeElement?.tagName.match(/INPUT|TEXTAREA|SELECT/i)) {
          inputRef.current.focus();
        }
      }
    }, 1000);
    return () => clearInterval(focusTimer);
  }, []);

  const loadEvento = async () => {
    try {
      setLoading(true);
      const res = await fetchApi(`/eventos/${eventoId}`);
      setEvento(res.evento);
      setAprendices(res.aprendices || []);
    } catch (err) {
      showToast('Error al cargar detalle del evento', 'error');
      onBack();
    } finally {
      setLoading(false);
    }
  };

  const handleManualToggle = async (aprendizId, currentStatus) => {
    try {
      const res = await fetchApi(`/eventos/${eventoId}/asistencia`, {
        method: 'POST',
        body: JSON.stringify({
          aprendizId,
          presente: !currentStatus,
          metodo: 'manual'
        })
      });

      const updatedReg = res.registro;
      
      setAprendices(prev => prev.map(ap => 
        ap.id === aprendizId ? { 
          ...ap, 
          presente: updatedReg.presente, 
          metodo: updatedReg.metodo, 
          timestamp: updatedReg.timestamp 
        } : ap
      ));

      if (updatedReg.presente) {
        showToast(`${res.aprendiz.fullName} marcado como PRESENTE`, 'success');
      }
    } catch (err) {
      showToast(err.message || 'Error al actualizar asistencia', 'error');
    }
  };

  const handleScanSubmit = async (e) => {
    e.preventDefault();
    if (!scanInput.trim()) return;

    const value = scanInput.trim();
    setScanInput(''); // limpiar para el siguiente scan

    try {
      // Determinar si es documento (solo números) o NFC UID (hex)
      const isDocument = /^\d+$/.test(value);
      const body = isDocument ? { document: value } : { nfcUid: value };
      body.presente = true;
      body.metodo = isDocument ? 'qr' : 'nfc'; // Si leemos el doc con pistola es "qr" (código de barras), sino nfc

      const res = await fetchApi(`/eventos/${eventoId}/asistencia`, {
        method: 'POST',
        body: JSON.stringify(body)
      });

      const updatedReg = res.registro;
      const apId = res.aprendiz.id;

      setAprendices(prev => prev.map(ap => 
        ap.id === apId ? { 
          ...ap, 
          presente: updatedReg.presente, 
          metodo: updatedReg.metodo, 
          timestamp: updatedReg.timestamp 
        } : ap
      ));

      showToast(`¡Asistencia de ${res.aprendiz.fullName} registrada!`, 'success');
    } catch (err) {
      showToast(err.message || 'Error al escanear', 'error');
    }
  };

  const filteredAprendices = aprendices.filter(ap => 
    ap.fullName.toLowerCase().includes(searchTerm.toLowerCase()) || 
    ap.document.includes(searchTerm) ||
    ap.fichaNumero.includes(searchTerm)
  );

  const presentesCount = aprendices.filter(a => a.presente).length;

  if (loading || !evento) {
    return (
      <div className="p-4 max-w-5xl mx-auto flex justify-center items-center h-64">
        <div className="w-8 h-8 border-4 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  return (
    <div className="p-4 md:p-8 max-w-5xl mx-auto animate-fade-in space-y-6">
      
      {/* Botón Volver y Título */}
      <div className="flex items-center gap-4">
        <button onClick={onBack} className="p-2 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg transition-colors">
          <ArrowLeft size={24} className="text-gray-600 dark:text-gray-300" />
        </button>
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">{evento.nombre}</h1>
          <p className="text-sm text-gray-500 dark:text-gray-400 flex items-center gap-2">
            <Calendar size={14} /> {new Date(evento.fechaHora).toLocaleString()}
          </p>
        </div>
      </div>

      {/* Input oculto para escaner de barras/RFID emulando teclado */}
      <form onSubmit={handleScanSubmit} className="absolute opacity-0 pointer-events-none">
        <input 
          ref={inputRef}
          type="text" 
          value={scanInput} 
          onChange={e => setScanInput(e.target.value)} 
          autoFocus
        />
      </form>

      {/* Stats y Buscador */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="card bg-gradient-to-br from-blue-500 to-indigo-600 text-white flex items-center justify-between">
          <div>
            <p className="text-blue-100 text-sm">Total Invitados</p>
            <p className="text-3xl font-bold">{aprendices.length}</p>
          </div>
          <Users size={32} className="opacity-50" />
        </div>
        <div className="card bg-gradient-to-br from-emerald-500 to-teal-600 text-white flex items-center justify-between">
          <div>
            <p className="text-emerald-100 text-sm">Presentes</p>
            <p className="text-3xl font-bold">{presentesCount}</p>
          </div>
          <CheckCircle2 size={32} className="opacity-50" />
        </div>
        <div className="card flex flex-col justify-center gap-2 relative">
          <Search size={18} className="absolute left-6 text-gray-400" />
          <input
            type="text"
            placeholder="Buscar aprendiz..."
            value={searchTerm}
            onChange={e => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-2 bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>
      </div>

      {/* Lista de Aprendices */}
      <div className="card overflow-hidden p-0">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-gray-50 dark:bg-gray-800/50 border-b border-gray-100 dark:border-gray-800">
                <th className="px-6 py-4 text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase">Aprendiz</th>
                <th className="px-6 py-4 text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase">Documento</th>
                <th className="px-6 py-4 text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase">Ficha</th>
                <th className="px-6 py-4 text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase">Hora Registro</th>
                <th className="px-6 py-4 text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase text-right">Asistencia</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100 dark:divide-gray-800">
              {filteredAprendices.map((ap) => (
                <tr key={ap.id} className="hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors">
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-full bg-blue-100 dark:bg-blue-900/50 flex items-center justify-center text-blue-600 font-bold text-xs shrink-0">
                        {ap.fullName.charAt(0)}
                      </div>
                      <span className="font-medium text-gray-900 dark:text-gray-100 truncate max-w-[200px]">
                        {ap.fullName}
                      </span>
                    </div>
                  </td>
                  <td className="px-6 py-4 text-sm text-gray-500 dark:text-gray-400">
                    {ap.document}
                  </td>
                  <td className="px-6 py-4">
                    <span className="inline-flex px-2 py-1 text-xs font-medium bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-300 rounded-md">
                      {ap.fichaNumero}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-sm text-gray-500 dark:text-gray-400">
                    {ap.presente && ap.timestamp 
                      ? new Date(ap.timestamp).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})
                      : '-'}
                  </td>
                  <td className="px-6 py-4 text-right">
                    <button
                      onClick={() => handleManualToggle(ap.id, ap.presente)}
                      className={`inline-flex items-center justify-center w-10 h-10 rounded-xl transition-all ${
                        ap.presente 
                          ? 'bg-emerald-100 text-emerald-600 hover:bg-emerald-200 dark:bg-emerald-900/30 dark:text-emerald-400 dark:hover:bg-emerald-900/50'
                          : 'bg-red-100 text-red-600 hover:bg-red-200 dark:bg-red-900/30 dark:text-red-400 dark:hover:bg-red-900/50'
                      }`}
                      title={ap.presente ? 'Marcar como ausente' : 'Marcar como presente'}
                    >
                      {ap.presente ? <CheckCircle2 size={20} /> : <XCircle size={20} />}
                    </button>
                  </td>
                </tr>
              ))}
              {filteredAprendices.length === 0 && (
                <tr>
                  <td colSpan={5} className="px-6 py-12 text-center text-gray-500">
                    No se encontraron aprendices con ese criterio de búsqueda.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

    </div>
  );
}
