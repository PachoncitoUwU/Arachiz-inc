import React, { useState, useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import fetchApi from '../../services/api';
import PageHeader from '../../components/PageHeader';
import EmptyState from '../../components/EmptyState';
import QRScanner from '../../components/QRScanner';
import { LogIn, CheckCircle, XCircle, Clock, QrCode, Search, FilterX } from 'lucide-react';

export default function AprendizAsistencia() {
  const location = useLocation();
  const [fichas, setFichas] = useState([]);
  const [historial, setHistorial] = useState([]);
  const [joinCode, setJoinCode] = useState('');
  const [loading, setLoading] = useState(true);
  const [joining, setJoining] = useState(false);
  const [error, setError] = useState('');
  const [qrScannerOpen, setQrScannerOpen] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [selectedRegistro, setSelectedRegistro] = useState(null);
  
  const [searchOpen, setSearchOpen] = useState(false);
  const [filterDate, setFilterDate] = useState('');
  const [filterCompetencia, setFilterCompetencia] = useState('');
  const [filterResultado, setFilterResultado] = useState('');
  const [filterMetodo, setFilterMetodo] = useState('');

  const ITEMS_PER_PAGE = 25;

  useEffect(() => {
    // Si viene desde el escaneo de QR, abrir el scanner
    if (location.state?.openQRScanner) {
      setQrScannerOpen(true);
    }
  }, [location]);

  const loadData = async () => {
    try {
      setLoading(true);
      const [f, h] = await Promise.all([
        fetchApi('/fichas/my-fichas'),
        fetchApi('/asistencias/my-history'),
      ]);
      setFichas(f.fichas);
      setHistorial(h.registros);
    } catch (err) { console.error(err); }
    finally { setLoading(false); }
  };

  useEffect(() => { loadData(); }, []);

  const handleJoin = async (e) => {
    e.preventDefault();
    setError(''); setJoining(true);
    try {
      await fetchApi('/fichas/join', { method: 'POST', body: JSON.stringify({ code: joinCode }) });
      setJoinCode('');
      loadData();
    } catch (err) { setError(err.message); }
    finally { setJoining(false); }
  };

  const hasFicha = fichas.length > 0;

  const uniqueCompetencias = [...new Set(historial.map(r => r.asistencia?.resultado?.competencia?.nombre).filter(Boolean))];
  const uniqueResultados = [...new Set(historial.map(r => r.asistencia?.resultado?.nombre).filter(Boolean))];

  const filteredHistorial = historial.filter(r => {
    let match = true;
    if (filterDate && r.asistencia?.fecha !== filterDate) match = false;
    if (filterCompetencia && r.asistencia?.resultado?.competencia?.nombre !== filterCompetencia) match = false;
    if (filterResultado && r.asistencia?.resultado?.nombre !== filterResultado) match = false;
    if (filterMetodo && r.metodo !== filterMetodo) match = false;
    return match;
  });

  const totalPages = Math.ceil(filteredHistorial.length / ITEMS_PER_PAGE);
  const currentHistorial = filteredHistorial.slice(
    (currentPage - 1) * ITEMS_PER_PAGE,
    currentPage * ITEMS_PER_PAGE
  );

  useEffect(() => {
    setCurrentPage(1);
  }, [filterDate, filterCompetencia, filterResultado, filterMetodo]);

  if (loading) return (
    <div className="flex justify-center py-16">
      <div className="w-8 h-8 border-2 border-[#34A853] border-t-transparent rounded-full animate-spin"/>
    </div>
  );

  return (
    <div className="animate-fade-in space-y-5">
      <PageHeader title="Mis Asistencias" subtitle="Historial de asistencia registrada" />

      {/* Sin ficha */}
      {!hasFicha ? (
        <div className="card max-w-md mx-auto">
          <div className="text-center mb-6">
            <div className="w-16 h-16 bg-blue-50 rounded-2xl flex items-center justify-center mx-auto mb-4">
              <LogIn size={28} className="text-[#4285F4]"/>
            </div>
            <h2 className="text-lg font-bold text-gray-900 dark:text-white ">Unirse a una Ficha</h2>
            <p className="text-sm text-gray-500 mt-1">Ingresa el código de invitación de tu instructor.</p>
          </div>
          {error && <p className="text-sm text-red-500 bg-red-50 px-3 py-2 rounded-lg mb-3">{error}</p>}
          <form onSubmit={handleJoin} className="space-y-3">
            <input required className="input-field text-center font-mono text-xl tracking-widest uppercase"
              placeholder="X7B9K2" value={joinCode}
              onChange={e => setJoinCode(e.target.value.toUpperCase())} />
            <button type="submit" disabled={joining} className="btn-primary text-sm md:text-base  w-full">
              {joining ? 'Uniéndose...' : 'Vincularme a esta ficha'}
            </button>
          </form>
        </div>
      ) : (
          <>
          {/* QR Scan Button */}
          {hasFicha && (
            <>
              <div className="flex items-center justify-between mb-4">
                <button
                  onClick={() => setQrScannerOpen(true)}
                  className="flex items-center gap-2 px-4 py-2 rounded-xl bg-[#FBBC05] text-white text-sm font-semibold hover:bg-yellow-600 transition-all shadow-sm"
                >
                  <QrCode size={16} /> Escanear QR
                </button>
                <button
                  onClick={() => setSearchOpen(!searchOpen)}
                  className={`p-2 rounded-xl border transition-all ${searchOpen ? 'bg-blue-50 border-blue-200 text-blue-600 dark:bg-blue-900/30 dark:border-blue-800' : 'bg-white border-gray-200 text-gray-600 hover:bg-gray-50 dark:bg-zinc-900 dark:border-zinc-700 dark:text-gray-300'}`}
                >
                  <Search size={20} />
                </button>
              </div>

              {searchOpen && (
                <div className="mb-4 p-4 rounded-xl bg-white dark:bg-zinc-900 border border-gray-100 dark:border-zinc-800 shadow-sm animate-fade-in grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-3">
                  <div>
                    <label className="block text-xs font-semibold text-gray-500 mb-1">Fecha</label>
                    <input type="date" value={filterDate} onChange={e => setFilterDate(e.target.value)} className="w-full input-field text-sm p-2" />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-gray-500 mb-1">Competencia</label>
                    <select value={filterCompetencia} onChange={e => setFilterCompetencia(e.target.value)} className="w-full input-field text-sm p-2">
                      <option value="">Todas</option>
                      {uniqueCompetencias.map(c => <option key={c} value={c}>{c}</option>)}
                    </select>
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-gray-500 mb-1">Resultado</label>
                    <select value={filterResultado} onChange={e => setFilterResultado(e.target.value)} className="w-full input-field text-sm p-2">
                      <option value="">Todos</option>
                      {uniqueResultados.map(c => <option key={c} value={c}>{c}</option>)}
                    </select>
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-gray-500 mb-1">Método</label>
                    <div className="flex gap-2">
                      <select value={filterMetodo} onChange={e => setFilterMetodo(e.target.value)} className="w-full input-field text-sm p-2">
                        <option value="">Todos</option>
                        <option value="qr">QR</option>
                        <option value="nfc">NFC</option>
                        <option value="huella">Huella</option>
                        <option value="facial">Facial</option>
                        <option value="manual">Manual</option>
                      </select>
                      {(filterDate || filterCompetencia || filterResultado || filterMetodo) && (
                        <button onClick={() => { setFilterDate(''); setFilterCompetencia(''); setFilterResultado(''); setFilterMetodo(''); }} className="p-2 bg-red-50 text-red-500 rounded-lg hover:bg-red-100 dark:bg-red-900/30 dark:hover:bg-red-900/50" title="Limpiar filtros">
                          <FilterX size={18} />
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              )}
              {/* Historial */}
              {filteredHistorial.length === 0 ? (
                <EmptyState icon={<Clock size={28} />} title="Sin registros" description="Aún no tienes asistencias registradas." />
              ) : (
                <div className="space-y-2">
                  {currentHistorial.map(r => (
                    <div key={r.id} onClick={() => setSelectedRegistro(r)} className="cursor-pointer flex items-center justify-between p-3 rounded-xl bg-gray-50 dark:bg-zinc-800/50 border border-gray-100 dark:border-zinc-700 hover:shadow-md hover:border-[#4285F4]/30 dark:hover:border-[#4285F4]/50 transition-all">
                      <div className="flex items-center gap-3">
                        {r.presente ? (
                          <CheckCircle size={20} className="text-[#34A853] shrink-0" />
                        ) : (
                          <XCircle size={20} className="text-[#EA4335] shrink-0" />
                        )}
                        <div>
                          <p className="text-sm font-semibold text-gray-800 dark:text-gray-100">{r.asistencia?.resultado?.nombre || r.asistencia?.materia?.nombre}</p>
                          <p className="text-xs text-gray-500 mt-0.5">
                            {r.asistencia?.fecha} · Registrado por {(
                              r.metodo === 'nfc' ? 'Lector NFC' :
                              r.metodo === 'huella' ? 'Lector Dactilar' :
                              r.metodo === 'facial' ? '🎭 Reconocimiento Facial' :
                              r.metodo === 'qr' ? '📱 Código QR' :
                              r.metodo === 'manual' ? '✍️ Registro Manual' :
                              'Instructor'
                            )}
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        {r.presente && r.tarde && (
                          <span className="px-2.5 py-1 rounded-full bg-yellow-100 dark:bg-yellow-900/30 text-yellow-700 dark:text-yellow-400 text-xs font-bold border border-yellow-200 dark:border-yellow-800/50">
                            Tarde
                          </span>
                        )}
                        <span className={`badge ${r.presente ? 'badge-success' : 'badge-danger'}`}>{r.presente ? 'Presente' : 'Ausente'}</span>
                      </div>
                    </div>
                  ))}
                  
                  {/* Paginación */}
                  {totalPages > 1 && (
                    <div className="flex justify-center items-center gap-4 pt-6 pb-2">
                      <button
                        onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                        disabled={currentPage === 1}
                        className="px-4 py-2 rounded-xl bg-gray-100 dark:bg-zinc-800/50 text-gray-700 dark:text-gray-300 disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-200 dark:hover:bg-zinc-700 transition-colors text-sm font-semibold shadow-sm"
                      >
                        Anterior
                      </button>
                      <span className="text-sm text-gray-600 dark:text-gray-400 font-medium bg-white dark:bg-zinc-900 px-3 py-1 rounded-lg border border-gray-100 dark:border-zinc-800 shadow-sm">
                        Página {currentPage} de {totalPages}
                      </span>
                      <button
                        onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                        disabled={currentPage === totalPages}
                        className="px-4 py-2 rounded-xl bg-gray-100 dark:bg-zinc-800/50 text-gray-700 dark:text-gray-300 disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-200 dark:hover:bg-zinc-700 transition-colors text-sm font-semibold shadow-sm"
                      >
                        Siguiente
                      </button>
                    </div>
                  )}
                </div>
              )}
            </>
          )}
        </>
      )}

      {/* Modal QR Scanner */}
      {qrScannerOpen && (
        <QRScanner 
          onClose={() => setQrScannerOpen(false)}
          onSuccess={(registro) => {
            loadData(); // Recargar historial
          }}
        />
      )}

      {/* Modal Detalle de Registro */}
      {selectedRegistro && (
        <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4 bg-black/60 animate-fade-in backdrop-blur-sm">
          <div className="bg-white dark:bg-zinc-900 rounded-2xl shadow-xl w-full max-w-md overflow-hidden animate-scale-in">
            <div className="p-4 border-b border-gray-100 dark:border-zinc-800 flex justify-between items-center bg-gray-50 dark:bg-zinc-800/50">
              <h3 className="font-bold text-gray-800 dark:text-white flex items-center gap-2">
                <Clock size={18} className="text-[#4285F4]"/>
                Detalle de Asistencia
              </h3>
              <button onClick={() => setSelectedRegistro(null)} className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300">
                <XCircle size={24} />
              </button>
            </div>
            <div className="p-5 space-y-4">
              <div>
                <p className="text-xs text-gray-500 uppercase tracking-wider font-semibold mb-1">
                  {selectedRegistro.presente ? 'Fecha del registro' : 'Fecha de la sesión'}
                </p>
                <p className="text-sm font-medium text-gray-900 dark:text-gray-100">
                  {selectedRegistro.asistencia?.fecha}
                  {selectedRegistro.presente && selectedRegistro.timestamp && ` a las ${new Date(selectedRegistro.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}`}
                </p>
              </div>
              <div>
                <p className="text-xs text-gray-500 uppercase tracking-wider font-semibold mb-1">Competencia</p>
                <p className="text-sm font-medium text-gray-900 dark:text-gray-100">{selectedRegistro.asistencia?.resultado?.competencia?.nombre || 'No asignada'}</p>
              </div>
              <div>
                <p className="text-xs text-gray-500 uppercase tracking-wider font-semibold mb-1">Resultado de Aprendizaje</p>
                <p className="text-sm font-medium text-gray-900 dark:text-gray-100">{selectedRegistro.asistencia?.resultado?.nombre || 'No asignado'}</p>
              </div>
              {selectedRegistro.presente && (
                <div>
                  <p className="text-xs text-gray-500 uppercase tracking-wider font-semibold mb-1">Método de registro</p>
                  <p className="text-sm font-medium text-gray-900 dark:text-gray-100 capitalize">
                    {selectedRegistro.metodo === 'nfc' ? 'Lector NFC' :
                     selectedRegistro.metodo === 'huella' ? 'Lector Dactilar' :
                     selectedRegistro.metodo === 'facial' ? 'Reconocimiento Facial' :
                     selectedRegistro.metodo === 'qr' ? 'Código QR' :
                     selectedRegistro.metodo === 'manual' ? 'Registro Manual' :
                     selectedRegistro.metodo}
                  </p>
                </div>
              )}
              <div className="pt-3 mt-2 border-t border-gray-100 dark:border-zinc-800 flex items-center justify-between">
                <span className="text-sm font-semibold text-gray-700 dark:text-gray-300">Estado</span>
                <div className="flex items-center gap-2">
                  {selectedRegistro.presente && selectedRegistro.tarde && (
                    <span className="px-2.5 py-1 rounded-full bg-yellow-100 dark:bg-yellow-900/30 text-yellow-700 dark:text-yellow-400 text-xs font-bold border border-yellow-200 dark:border-yellow-800/50">
                      Tarde
                    </span>
                  )}
                  <span className={`badge ${selectedRegistro.presente ? 'badge-success' : 'badge-danger'}`}>{selectedRegistro.presente ? 'Presente' : 'Ausente'}</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
