import React, { useState, useEffect, useContext, useRef } from 'react';
import { AuthContext } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import { ArrowLeft, Users, Calendar, CheckCircle2, XCircle, Search, Ticket, Download, QrCode, ScanFace, FileText, Copy, Plus } from 'lucide-react';
import fetchApi from '../services/api';
import Modal from '../components/Modal';
import ConfirmDialog from '../components/ConfirmDialog';
import FaceScannerModal from '../components/FaceScannerModal';
import { io } from 'socket.io-client';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000/api';
const SOCKET_URL = import.meta.env.VITE_SOCKET_URL || 'http://localhost:3000';

export default function EventoDetalle({ eventoId, onBack }) {
  const { token, user } = useContext(AuthContext);
  const { showToast } = useToast();

  const [evento, setEvento] = useState(null);
  const [aprendices, setAprendices] = useState([]);
  const [instructores, setInstructores] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [activeTab, setActiveTab] = useState('aprendices');
  
  // Para herramientas avanzadas
  const [showQrModal, setShowQrModal] = useState(false);
  const [qrCode, setQrCode] = useState(null);
  const [qrTimeLeft, setQrTimeLeft] = useState(30);
  const qrTimerRef = useRef(null);
  const [showFaceModal, setShowFaceModal] = useState(false);
  const socketRef = useRef(null);

  // Para invitar fichas y ver código
  const [copiedCode, setCopiedCode] = useState(false);
  const [showInvitarModal, setShowInvitarModal] = useState(false);
  const [misFichas, setMisFichas] = useState([]);
  const [selectedFichas, setSelectedFichas] = useState([]);
  const [fichaSearchTerm, setFichaSearchTerm] = useState('');
  const [fichaNivelFilter, setFichaNivelFilter] = useState('');
  const [invitandoFichas, setInvitandoFichas] = useState(false);

  // Para el escáner (emulación teclado o lector serial)
  const inputRef = useRef(null);
  const [scanInput, setScanInput] = useState('');

  // Para confirmar finalizar
  const [showConfirmFinalizar, setShowConfirmFinalizar] = useState(false);

  useEffect(() => {
    loadEvento();
    return () => {
      if (socketRef.current) socketRef.current.disconnect();
      if (qrTimerRef.current) clearInterval(qrTimerRef.current);
    };
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
      setInstructores(res.instructores || []);
      
      if (res.evento?.estado === 'en_curso' && !socketRef.current) {
        connectSocket();
      }
    } catch (err) {
      showToast('Error al cargar detalle del evento', 'error');
      onBack();
    } finally {
      setLoading(false);
    }
  };

  const handleManualToggle = async (aprendizId, currentStatus) => {
    if (evento?.estado !== 'en_curso') {
      return showToast('La sesión no está activa', 'warning');
    }
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
    if (evento?.estado !== 'en_curso') {
      setScanInput('');
      return showToast('La sesión no está activa', 'warning');
    }

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
    ap.fichaNumero?.includes(searchTerm)
  );

  const filteredInstructores = instructores.filter(inst => 
    inst.fullName.toLowerCase().includes(searchTerm.toLowerCase()) || 
    inst.document.includes(searchTerm) ||
    inst.fichaNumero?.includes(searchTerm)
  );

  const connectSocket = () => {
    socketRef.current = io(SOCKET_URL);
    socketRef.current.emit('joinEvento', eventoId); // The backend needs to support this or just broadcast to room
    // The backend uses io.to(`evento_${qrData.eventoId}`).emit
    // Let's manually join room via an endpoint or the backend handles it.
    // Wait, backend doesn't have joinEvento. I can just join manually if I add it, 
    // or I'll just poll every 10s if the socket isn't specifically supported.
    // Actually, I can just rely on the API polling or update manually since we only need real-time for QR.
    // To make it simple, I'll poll while QR is open.
  };

  useEffect(() => {
    let pollInterval;
    if (evento?.estado === 'en_curso' && (showQrModal || showFaceModal)) {
      pollInterval = setInterval(loadEvento, 5000);
    }
    return () => clearInterval(pollInterval);
  }, [evento, showQrModal, showFaceModal]);

  const generateQrCode = async () => {
    try {
      const res = await fetchApi('/qr/generate', {
        method: 'POST',
        body: JSON.stringify({ eventoId })
      });
      setQrCode(res.code);
      setQrTimeLeft(30);
      if (qrTimerRef.current) clearInterval(qrTimerRef.current);
      qrTimerRef.current = setInterval(() => {
        setQrTimeLeft(prev => {
          if (prev <= 1) {
            generateQrCode();
            return 30;
          }
          return prev - 1;
        });
      }, 1000);
    } catch (err) {
      showToast('Error generando QR: ' + err.message, 'error');
      setShowQrModal(false);
    }
  };

  const handleOpenQr = () => {
    setShowQrModal(true);
    generateQrCode();
  };

  const handleCloseQr = () => {
    setShowQrModal(false);
    setQrCode(null);
    if (qrTimerRef.current) clearInterval(qrTimerRef.current);
  };

  const handleFaceDetection = async (candidate) => {
    try {
      const res = await fetchApi(`/eventos/${eventoId}/asistencia`, {
        method: 'POST',
        body: JSON.stringify({ aprendizId: candidate.id, presente: true, metodo: 'facial' })
      });
      const updatedReg = res.registro;
      setAprendices(prev => prev.map(ap => 
        ap.id === candidate.id ? { 
          ...ap, 
          presente: updatedReg.presente, 
          metodo: updatedReg.metodo, 
          timestamp: updatedReg.timestamp 
        } : ap
      ));
      showToast(`Reconocido: ${candidate.fullName}`, 'success');
    } catch (err) {
      // Ignorar si ya está marcado
    }
  };

  const handleIniciar = async () => {
    try {
      setLoading(true);
      await fetchApi(`/eventos/${eventoId}/iniciar`, { method: 'POST' });
      showToast('Sesión de asistencia iniciada', 'success');
      loadEvento();
    } catch (err) {
      showToast(err.message, 'error');
      setLoading(false);
    }
  };

  const handleFinalizar = () => {
    setShowConfirmFinalizar(true);
  };

  const confirmarFinalizar = async () => {
    setShowConfirmFinalizar(false);
    try {
      setLoading(true);
      await fetchApi(`/eventos/${eventoId}/finalizar`, { method: 'POST' });
      showToast('Evento finalizado', 'success');
      // Actualizamos el estado local directamente para que la UI reaccione inmediatamente
      setEvento(prev => ({ ...prev, estado: 'finalizado' }));
      setLoading(false);
    } catch (err) {
      showToast(err.message, 'error');
      setLoading(false);
    }
  };

  const handleDescargarReporte = async () => {
    try {
      const response = await fetch(`${API_URL}/eventos/${eventoId}/reporte`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (!response.ok) throw new Error('Error al generar reporte');
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `Reporte_Evento_${evento.codigoInvitacion}.xlsx`);
      document.body.appendChild(link);
      link.click();
      link.remove();
    } catch (err) {
      showToast('Error al descargar reporte', 'error');
    }
  };

  const copyEventCode = () => {
    if (evento?.codigoInvitacion) {
      navigator.clipboard.writeText(evento.codigoInvitacion);
      setCopiedCode(true);
      showToast('Código copiado al portapapeles', 'success');
      setTimeout(() => setCopiedCode(false), 2000);
    }
  };

  const handleOpenInvitarModal = async () => {
    try {
      setInvitandoFichas(true);
      const endpoint = user.userType === 'administrador' ? '/admin/fichas' : '/fichas/my-fichas';
      const res = await fetchApi(endpoint);
      setMisFichas(res.fichas || []);
      setSelectedFichas([]);
      setFichaSearchTerm('');
      setFichaNivelFilter('');
      setShowInvitarModal(true);
    } catch (err) {
      showToast('Error al cargar fichas disponibles', 'error');
    } finally {
      setInvitandoFichas(false);
    }
  };

  const toggleSelectFicha = (fichaId) => {
    setSelectedFichas(prev => 
      prev.includes(fichaId) ? prev.filter(id => id !== fichaId) : [...prev, fichaId]
    );
  };

  const handleInvitarFichas = async () => {
    if (selectedFichas.length === 0) return;
    try {
      setInvitandoFichas(true);
      await fetchApi('/eventos/unir', {
        method: 'POST',
        body: JSON.stringify({
          codigoInvitacion: evento.codigoInvitacion,
          fichasIds: selectedFichas
        })
      });
      showToast('Fichas invitadas exitosamente', 'success');
      setShowInvitarModal(false);
      loadEvento();
    } catch (err) {
      showToast(err.message, 'error');
    } finally {
      setInvitandoFichas(false);
    }
  };

  const filteredMisFichas = misFichas.filter(f => {
    const matchesSearch = f.numero.toString().includes(fichaSearchTerm) || f.nombre.toLowerCase().includes(fichaSearchTerm.toLowerCase());
    const matchesNivel = fichaNivelFilter === '' || f.nivel === fichaNivelFilter;
    // Exclude fichas that are already in the event
    const alreadyInEvent = evento?.fichas?.some(evFicha => evFicha.fichaId === f.id);
    return matchesSearch && matchesNivel && !alreadyInEvent;
  });

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
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <button onClick={onBack} className="p-2 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg transition-colors">
            <ArrowLeft size={24} className="text-gray-600 dark:text-gray-300" />
          </button>
          <div>
            <div className="flex items-center gap-3">
              <h1 className="text-2xl font-bold text-gray-900 dark:text-white">{evento.nombre}</h1>
              <span className={`px-3 py-1 rounded-full text-xs font-semibold ${
                evento.estado === 'programado' ? 'bg-blue-100 text-blue-700 dark:bg-blue-900/50 dark:text-blue-300' :
                evento.estado === 'en_curso' ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/50 dark:text-emerald-300' :
                'bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-300'
              }`}>
                {evento.estado === 'programado' ? 'Programado' :
                 evento.estado === 'en_curso' ? 'En Curso' : 'Finalizado'}
              </span>
            </div>
            <div className="flex flex-col gap-1 mt-2">
              <p className="text-sm text-gray-500 dark:text-gray-400 flex items-center gap-2">
                <Calendar size={14} /> {new Date(evento.fechaHora).toLocaleString()}
              </p>
              {(user?.userType === 'administrador' || user?.id === evento.creadorId) && evento.codigoInvitacion && (
                <div className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-300">
                  <span className="font-medium">Código del Evento:</span>
                  <code className="bg-gray-100 dark:bg-gray-800 px-2 py-0.5 rounded text-blue-600 dark:text-blue-400 font-mono tracking-wider">
                    {evento.codigoInvitacion}
                  </code>
                  <button 
                    onClick={copyEventCode}
                    className="p-1 hover:bg-gray-100 dark:hover:bg-gray-800 rounded transition-colors text-gray-400 hover:text-gray-600 dark:hover:text-gray-200"
                    title="Copiar código"
                  >
                    {copiedCode ? <CheckCircle2 size={14} className="text-emerald-500" /> : <Copy size={14} />}
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2 flex-wrap justify-end">
          {(user?.userType === 'administrador' || user?.id === evento.creadorId) && evento.estado === 'programado' && (
            <>
              <button onClick={handleOpenInvitarModal} className="btn-secondary flex items-center gap-2 border-indigo-200 text-indigo-600 hover:bg-indigo-50 dark:border-indigo-900/50 dark:text-indigo-400 dark:hover:bg-indigo-900/20">
                <Plus size={18} />
                <span className="hidden sm:inline">Invitar Fichas</span>
              </button>
              <button onClick={handleIniciar} className="btn-primary flex items-center gap-2">
                <CheckCircle2 size={18} />
                Abrir Sesión
              </button>
            </>
          )}
          {evento.estado === 'en_curso' && user?.userType === 'instructor' && (
            <>
              <button onClick={() => setShowFaceModal(true)} className="btn-secondary text-blue-600 border-blue-200 hover:bg-blue-50 flex items-center gap-2">
                <ScanFace size={18} />
                <span className="hidden sm:inline">Reconocimiento Facial</span>
              </button>
              <button onClick={handleOpenQr} className="btn-secondary text-indigo-600 border-indigo-200 hover:bg-indigo-50 flex items-center gap-2">
                <QrCode size={18} />
                <span className="hidden sm:inline">Mostrar QR</span>
              </button>
            </>
          )}
          {(user?.userType === 'administrador' || user?.id === evento.creadorId) && evento.estado === 'en_curso' && (
            <button onClick={handleFinalizar} className="btn-secondary text-red-600 border-red-200 hover:bg-red-50 flex items-center gap-2">
              <XCircle size={18} />
              <span className="hidden sm:inline">Finalizar Evento</span>
            </button>
          )}
          <button 
            onClick={handleDescargarReporte}
            className="btn-secondary flex items-center gap-2"
            title="Descargar Reporte en Excel"
          >
            <Download size={18} />
            <span className="hidden sm:inline">Exportar</span>
          </button>
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

      {/* Tabs */}
      <div className="flex space-x-1 bg-gray-100 dark:bg-gray-800 p-1 rounded-xl">
        <button
          onClick={() => setActiveTab('aprendices')}
          className={`flex-1 py-2 text-sm font-medium rounded-lg transition-all ${
            activeTab === 'aprendices'
              ? 'bg-white dark:bg-gray-900 text-blue-600 dark:text-blue-400 shadow'
              : 'text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-300'
          }`}
        >
          <div className="flex items-center justify-center gap-2">
            <Users size={16} /> Aprendices Invitados
          </div>
        </button>
        <button
          onClick={() => setActiveTab('instructores')}
          className={`flex-1 py-2 text-sm font-medium rounded-lg transition-all ${
            activeTab === 'instructores'
              ? 'bg-white dark:bg-gray-900 text-blue-600 dark:text-blue-400 shadow'
              : 'text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-300'
          }`}
        >
          <div className="flex items-center justify-center gap-2">
            <FileText size={16} /> Instructores
          </div>
        </button>
      </div>

      {/* Stats y Buscador */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="card bg-gradient-to-br from-blue-500 to-indigo-600 text-white flex items-center justify-between">
          <div>
            <p className="text-blue-100 text-sm">Total Invitados</p>
            <p className="text-3xl font-bold">{activeTab === 'aprendices' ? aprendices.length : instructores.length}</p>
          </div>
          <Users size={32} className="opacity-50" />
        </div>
        <div className="card bg-gradient-to-br from-emerald-500 to-teal-600 text-white flex items-center justify-between">
          <div>
            <p className="text-emerald-100 text-sm">Presentes</p>
            <p className="text-3xl font-bold">{activeTab === 'aprendices' ? presentesCount : 'N/A'}</p>
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

      {/* Lista */}
      <div className="card overflow-hidden p-0">
        <div className="overflow-x-auto">
          {activeTab === 'aprendices' ? (
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
                    {evento.estado === 'en_curso' && user?.userType === 'instructor' ? (
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
                    ) : (
                      <span className={`inline-flex items-center justify-center w-10 h-10 rounded-xl ${
                          ap.presente 
                            ? 'bg-emerald-50 text-emerald-500 dark:bg-emerald-900/10 dark:text-emerald-500/50'
                            : 'bg-gray-50 text-gray-400 dark:bg-gray-900/30 dark:text-gray-500'
                      }`}>
                        {ap.presente ? <CheckCircle2 size={20} /> : <XCircle size={20} />}
                      </span>
                    )}
                  </td>
                </tr>
              ))}
              {filteredAprendices.length === 0 && (
                <tr>
                  <td colSpan={5} className="px-6 py-12 text-center text-gray-500">
                    No se encontraron aprendices.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
          ) : (
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-gray-50 dark:bg-gray-800/50 border-b border-gray-100 dark:border-gray-800">
                  <th className="px-6 py-4 text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase">Instructor</th>
                  <th className="px-6 py-4 text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase">Documento</th>
                  <th className="px-6 py-4 text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase">Ficha</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100 dark:divide-gray-800">
                {filteredInstructores.map((inst) => (
                  <tr key={inst.id} className="hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors">
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-full bg-indigo-100 dark:bg-indigo-900/50 flex items-center justify-center text-indigo-600 font-bold text-xs shrink-0">
                          {inst.fullName.charAt(0)}
                        </div>
                        <span className="font-medium text-gray-900 dark:text-gray-100 truncate max-w-[200px]">
                          {inst.fullName}
                        </span>
                      </div>
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-500 dark:text-gray-400">
                      {inst.document}
                    </td>
                    <td className="px-6 py-4">
                      <span className="inline-flex px-2 py-1 text-xs font-medium bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-300 rounded-md">
                        {inst.fichaNumero}
                      </span>
                    </td>
                  </tr>
                ))}
                {filteredInstructores.length === 0 && (
                  <tr>
                    <td colSpan={3} className="px-6 py-12 text-center text-gray-500">
                      No se encontraron instructores.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          )}
        </div>
      </div>

      {/* QR Modal */}
      <Modal open={showQrModal} onClose={handleCloseQr} title="Código QR de Asistencia" maxWidth="max-w-md">
        <div className="flex flex-col items-center justify-center py-4">
          <p className="text-gray-600 dark:text-gray-300 mb-6 text-center">
            Pide a los aprendices que escaneen este código desde la app.
          </p>
          {qrCode ? (
            <div className="bg-white p-4 rounded-2xl shadow-lg border border-gray-100 dark:border-gray-800 relative">
              <img 
                src={`https://api.qrserver.com/v1/create-qr-code/?size=300x300&data=${encodeURIComponent(`${window.location.origin}/scan-qr?code=${qrCode}`)}`}
                alt="QR Code"
                className="w-64 h-64"
              />
              <div className="absolute -bottom-4 left-1/2 -translate-x-1/2 bg-blue-500 text-white text-xs font-bold px-3 py-1 rounded-full shadow">
                Se actualiza en {qrTimeLeft}s
              </div>
            </div>
          ) : (
            <div className="w-64 h-64 bg-gray-100 dark:bg-gray-800 rounded-2xl flex items-center justify-center animate-pulse">
              <QrCode size={48} className="text-gray-300 dark:text-gray-600" />
            </div>
          )}
        </div>
      </Modal>

      {/* Face Scanner Modal */}
      <FaceScannerModal 
        open={showFaceModal} 
        onClose={() => setShowFaceModal(false)}
        candidates={aprendices}
        onDetect={handleFaceDetection}
      />

      {/* Modal para Invitar Fichas */}
      <Modal open={showInvitarModal} onClose={() => setShowInvitarModal(false)} title="Invitar más Fichas">
        <div className="space-y-4">
          <div className="flex gap-2">
            <div className="flex-1 relative">
              <Search size={18} className="absolute left-3 top-2.5 text-gray-400" />
              <input 
                type="text" 
                placeholder="Buscar por número o nombre..." 
                value={fichaSearchTerm}
                onChange={e => setFichaSearchTerm(e.target.value)}
                className="w-full pl-9 pr-3 py-2 border rounded-lg dark:bg-gray-800 dark:border-gray-700 focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
            <select 
              value={fichaNivelFilter}
              onChange={e => setFichaNivelFilter(e.target.value)}
              className="border rounded-lg px-3 py-2 dark:bg-gray-800 dark:border-gray-700 focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="">Todos los niveles</option>
              <option value="Técnico">Técnico</option>
              <option value="Tecnólogo">Tecnólogo</option>
              <option value="Operario">Operario</option>
              <option value="Especialización">Especialización</option>
            </select>
          </div>
          
          <div className="max-h-60 overflow-y-auto border border-gray-200 dark:border-gray-700 rounded-lg p-2 space-y-2">
            {filteredMisFichas.length === 0 ? (
              <p className="text-center text-gray-500 py-4 text-sm">No se encontraron fichas disponibles.</p>
            ) : (
              filteredMisFichas.map(f => (
                <label key={f.id} className="flex items-center gap-3 p-2 hover:bg-gray-50 dark:hover:bg-gray-800/50 rounded-lg cursor-pointer transition-colors">
                  <input 
                    type="checkbox" 
                    checked={selectedFichas.includes(f.id)}
                    onChange={() => toggleSelectFicha(f.id)}
                    className="w-4 h-4 text-blue-600 rounded border-gray-300 focus:ring-blue-500"
                  />
                  <div>
                    <p className="font-semibold text-gray-900 dark:text-gray-100">{f.numero} - {f.nivel}</p>
                    <p className="text-xs text-gray-500 dark:text-gray-400 line-clamp-1">{f.nombre}</p>
                  </div>
                </label>
              ))
            )}
          </div>
          
          <div className="flex justify-end gap-2 pt-2">
            <button onClick={() => setShowInvitarModal(false)} className="btn-secondary">Cancelar</button>
            <button 
              onClick={handleInvitarFichas} 
              disabled={selectedFichas.length === 0 || invitandoFichas}
              className="btn-primary disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {invitandoFichas ? 'Añadiendo...' : `Añadir ${selectedFichas.length} ficha(s)`}
            </button>
          </div>
        </div>
      </Modal>

      <ConfirmDialog
        open={showConfirmFinalizar}
        onClose={() => setShowConfirmFinalizar(false)}
        onConfirm={confirmarFinalizar}
        title="Finalizar Evento"
        message="¿Estás seguro de finalizar el evento? Ya no se podrá registrar más asistencia."
        confirmText="Finalizar"
        cancelText="Cancelar"
        danger={true}
      />

    </div>
  );
}
