import React, { useState, useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import fetchApi from '../../services/api';
import PageHeader from '../../components/PageHeader';
import EmptyState from '../../components/EmptyState';
import QRScanner from '../../components/QRScanner';
import { LogIn, CheckCircle, XCircle, Clock, QrCode } from 'lucide-react';

export default function AprendizAsistencia() {
  const location = useLocation();
  const [fichas, setFichas] = useState([]);
  const [historial, setHistorial] = useState([]);
  const [joinCode, setJoinCode] = useState('');
  const [loading, setLoading] = useState(true);
  const [joining, setJoining] = useState(false);
  const [error, setError] = useState('');
  const [qrScannerOpen, setQrScannerOpen] = useState(false);

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

  if (loading) return (
    <div className="flex justify-center py-16">
      <div className="w-8 h-8 border-2 border-[#34A853] border-t-transparent rounded-full animate-spin"/>
    </div>
  );

  return (
    <div className="animate-fade-in space-y-5">
      <PageHeader title="Mis Asistencias" subtitle="Historial de asistencia registrada por el hardware" />

      {/* Sin ficha */}
      {!hasFicha ? (
        <div className="card max-w-md mx-auto">
          <div className="text-center mb-6">
            <div className="w-16 h-16 bg-blue-50 rounded-2xl flex items-center justify-center mx-auto mb-4">
              <LogIn size={28} className="text-[#4285F4]"/>
            </div>
            <h2 className="text-lg font-bold text-gray-900">Unirse a una Ficha</h2>
            <p className="text-sm text-gray-500 mt-1">Ingresa el código de invitación de tu instructor.</p>
          </div>
          {error && <p className="text-sm text-red-500 bg-red-50 px-3 py-2 rounded-lg mb-3">{error}</p>}
          <form onSubmit={handleJoin} className="space-y-3">
            <input required className="input-field text-center font-mono text-xl tracking-widest uppercase"
              placeholder="X7B9K2" value={joinCode}
              onChange={e => setJoinCode(e.target.value.toUpperCase())} />
            <button type="submit" disabled={joining} className="btn-primary w-full">
              {joining ? 'Uniéndose...' : 'Vincularme a esta ficha'}
            </button>
          </form>
        </div>
      ) : (
        <div className="card max-w-4xl mx-auto">
          <div className="flex items-center justify-between mb-4">
            <h2 className="font-bold text-gray-900">Historial Reciente</h2>
            <button 
              onClick={() => setQrScannerOpen(true)}
              className="flex items-center gap-2 px-4 py-2 rounded-xl bg-[#FBBC05] text-white text-sm font-semibold hover:bg-yellow-600 transition-all shadow-sm">
              <QrCode size={16}/> Escanear QR
            </button>
          </div>
          {historial.length === 0 ? (
            <EmptyState icon={<Clock size={28}/>} title="Sin registros" description="Aún no tienes asistencias registradas." />
          ) : (
            <div className="space-y-2 max-h-[600px] overflow-y-auto pr-2">
              {historial.map(r => (
                <div key={r.id} className="flex items-center justify-between p-3 rounded-xl bg-gray-50 border border-gray-100/60 hover:shadow-sm transition-all">
                  <div className="flex items-center gap-3">
                    {r.presente
                      ? <CheckCircle size={20} className="text-[#34A853] shrink-0"/>
                      : <XCircle size={20} className="text-[#EA4335] shrink-0"/>
                    }
                    <div>
                      <p className="text-sm font-semibold text-gray-800">{r.asistencia?.materia?.nombre}</p>
                       <p className="text-xs text-gray-500 mt-0.5">
                         {r.asistencia?.fecha} · Registrado por {
                           r.metodo === 'nfc' ? 'Lector NFC' :
                           r.metodo === 'huella' ? 'Lector Dactilar' :
                           r.metodo === 'facial' ? '🎭 Reconocimiento Facial' :
                           r.metodo === 'qr' ? '📱 Código QR' :
                           r.metodo === 'manual' ? '✍️ Registro Manual' :
                           'Instructor'
                         }
                       </p>
                    </div>
                  </div>
                  <span className={`badge ${r.presente ? 'badge-success' : 'badge-danger'}`}>
                    {r.presente ? 'Presente' : 'Ausente'}
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>
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
    </div>
  );
}
