import React, { useState, useEffect, useRef } from 'react';
import Modal from './Modal';
import ConfirmModal from './ConfirmModal';
import FaceCapture from './FaceCapture';
import ConfirmDialog from './ConfirmDialog';
import { socket } from '../services/socket';
import fetchApi from '../services/api';
import { useToast } from '../context/ToastContext';
import { Fingerprint, CreditCard, CheckCircle2, AlertCircle, Loader2, ScanFace, Trash2 } from 'lucide-react';
import { descriptorToArray } from '../utils/faceApi';

export default function EnrollModal({ open, onClose, aprendiz, onUpdate }) {
  const { showToast } = useToast();
  const [mode, setMode] = useState(null);
  const [status, setStatus] = useState('idle');
  const [message, setMessage] = useState('');
  const [hasFace, setHasFace] = useState(false);
  const [confirmDialog, setConfirmDialog] = useState({ open: false, action: null, data: null });
  const [deleting, setDeleting] = useState(false);
  const [connectionMode, setConnectionMode] = useState('usb'); // 'usb' | 'wifi'
  const modeRef = useRef(null); // ref para evitar closure stale en socket listeners

  // Reiniciar estado
  useEffect(() => {
    if (open) {
      setMode(null);
      modeRef.current = null;
      setStatus('idle');
      setMessage('');
      // Comprobar si ya tiene descriptor facial (length > 0)
      setHasFace(aprendiz?.faceDescriptor && aprendiz.faceDescriptor.length === 128);
      // Detectar si hay conexión USB activa
      fetchApi('/serial/status')
        .then(res => setConnectionMode(res.connected ? 'usb' : 'wifi'))
        .catch(() => setConnectionMode('wifi'));
    }
  }, [open, aprendiz]);

  useEffect(() => {
    if (!open) return;

    const onNfc = async (data) => {
      if (modeRef.current !== 'nfc') return;
      try {
        setStatus('waiting');
        await fetchApi('/serial/bind', {
          method: 'PUT',
          body: JSON.stringify({ userId: aprendiz.id, nfcUid: data.uid })
        });
        showToast(`NFC vinculado: ${data.uid}`, 'success');
        modeRef.current = null;
        setMode(null);
        setStatus('idle');
        if (onUpdate) onUpdate();
      } catch (err) {
        showToast(err.message || 'Error al vincular NFC', 'error');
        modeRef.current = null;
        setMode(null);
        setStatus('idle');
      }
    };

    const onFingerSuccess = async (data) => {
      if (modeRef.current !== 'fingerprint') return;
      try {
        await fetchApi('/serial/bind', {
          method: 'PUT',
          body: JSON.stringify({ userId: aprendiz.id, huellaId: data.id })
        });
        showToast(`Huella ID ${data.id} vinculada exitosamente`, 'success');
        if (!aprendiz.huellas) aprendiz.huellas = [];
        aprendiz.huellas.push(data.id);
        modeRef.current = null;
        setMode(null);
        setStatus('idle');
        if (onUpdate) onUpdate();
      } catch (err) {
        showToast(err.message || 'Error al guardar huella en la BD', 'error');
        modeRef.current = null;
        setMode(null);
        setStatus('idle');
      }
    };

    const onFingerError = (data) => {
      if (modeRef.current !== 'fingerprint') return;
      showToast(data.message || 'Error al registrar huella', 'error');
      modeRef.current = null;
      setMode(null);
      setStatus('idle');
    };

    socket.on('arduino_read_nfc', onNfc);
    socket.on('arduino_enroll_success', onFingerSuccess);
    socket.on('arduino_enroll_error', onFingerError);

    return () => {
      socket.off('arduino_read_nfc', onNfc);
      socket.off('arduino_enroll_success', onFingerSuccess);
      socket.off('arduino_enroll_error', onFingerError);
    };
  }, [open, aprendiz]); // quitamos mode y status de las deps para evitar recrear listeners

  const startNfc = () => {
    modeRef.current = 'nfc';
    setMode('nfc');
    setStatus('waiting');
    setMessage('Acerca la tarjeta o llavero NFC al lector...');
  };

  const startFingerprint = async () => {
    modeRef.current = 'fingerprint';
    setMode('fingerprint');
    setStatus('waiting');
    const modeLabel = connectionMode === 'wifi' ? 'WiFi (ESP8266)' : 'USB';
    setMessage(`Sigue las instrucciones del lector — se harán 2 capturas [${modeLabel}]`);
    try {
      const { nextId } = await fetchApi('/serial/next-finger-id');
      await fetchApi('/serial/enroll/finger', {
        method: 'POST',
        body: JSON.stringify({ id: nextId, mode: connectionMode })
      });
    } catch (err) {
      showToast(err.message || 'Error al iniciar enrolamiento', 'error');
      modeRef.current = null;
      setMode(null);
      setStatus('idle');
    }
  };

  const startFace = () => {
    modeRef.current = 'face';
    setMode('face');
    setStatus('waiting');
    setMessage('');
  };

  const handleFaceDescriptor = async (descriptor) => {
    try {
      const descriptorArr = descriptorToArray(descriptor);
      await fetchApi(`/auth/face-descriptor-for/${aprendiz.id}`, {
        method: 'POST',
        body: JSON.stringify({ descriptor: descriptorArr })
      });
      showToast(`Reconocimiento facial registrado para ${aprendiz.fullName}`, 'success');
      setHasFace(true);
      setMode(null);
      setStatus('idle');
      if (onUpdate) onUpdate();
    } catch (err) {
      showToast(err.message || 'Error al guardar descriptor facial', 'error');
      setMode(null);
      setStatus('idle');
    }
  };

  const removeFingerprint = async (id) => {
    setConfirmDialog({
      open: true,
      action: async () => {
        try {
          setDeleting(true);
          await fetchApi('/serial/finger', {
            method: 'DELETE',
            body: JSON.stringify({ userId: aprendiz.id, huellaId: id })
          });
          aprendiz.huellas = aprendiz.huellas.filter(h => h !== id);
          showToast(`Huella ${id} eliminada correctamente`, 'success');
          if (onUpdate) onUpdate();
        } catch(err) {
          showToast(err.message || 'Error al eliminar huella', 'error');
        } finally {
          setDeleting(false);
        }
      },
      data: { id }
    });
  };

  const deleteFaceDescriptor = async () => {
    setConfirmDialog({
      open: true,
      action: async () => {
        try {
          setDeleting(true);
          await fetchApi(`/auth/face-descriptor-for/${aprendiz.id}`, { method: 'DELETE' });
          setHasFace(false);
          aprendiz.faceDescriptor = null;
          showToast('Reconocimiento facial eliminado correctamente', 'success');
          if (onUpdate) onUpdate();
        } catch (err) {
          showToast(err.message || 'Error al eliminar reconocimiento facial', 'error');
        } finally {
          setDeleting(false);
        }
      },
      data: null
    });
  };

  const deleteNfc = async () => {
    setConfirmDialog({
      open: true,
      action: async () => {
        try {
          setDeleting(true);
          // Necesitamos obtener el fichaId del aprendiz
          // Asumiendo que el aprendiz tiene una propiedad fichaId o lo obtenemos del contexto
          const fichaId = aprendiz.fichaId || aprendiz.ficha?.id;
          
          if (!fichaId) {
            showToast('No se pudo determinar la ficha del aprendiz', 'error');
            return;
          }

          await fetchApi(`/admin/fichas/${fichaId}/aprendices/${aprendiz.id}/nfc`, {
            method: 'DELETE'
          });
          
          aprendiz.nfcUid = null;
          showToast('NFC eliminado correctamente', 'success');
          if (onUpdate) onUpdate();
        } catch (err) {
          showToast(err.message || 'Error al eliminar NFC', 'error');
        } finally {
          setDeleting(false);
        }
      },
      data: { type: 'nfc' }
    });
  };

  return (
    <>
      <Modal open={open} onClose={onClose} title="Credenciales Biométricas" maxWidth="max-w-2xl">
      <div className="space-y-4 text-center pb-2">
        {aprendiz && (
          <div className="mb-4 pb-4 border-b border-gray-100 dark:border-zinc-700">
            <p className="text-gray-600">
              Asignando credenciales a <br/>
              <strong className="text-gray-900 dark:text-white">{aprendiz.fullName}</strong>
            </p>
            <div className="flex items-center justify-center gap-2 mt-2">
              <span className={`inline-flex items-center gap-1 text-xs font-semibold px-2 py-1 rounded-full ${
                connectionMode === 'usb'
                  ? 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300'
                  : 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-300'
              }`}>
                <span className={`w-1.5 h-1.5 rounded-full ${connectionMode === 'usb' ? 'bg-blue-500' : 'bg-green-500'}`} />
                {connectionMode === 'usb' ? '🔌 Lector USB conectado' : '📡 Modo WiFi (ESP8266)'}
              </span>
            </div>
          </div>
        )}

        {/* Estado idle: mostrar info y botones */}
        {status === 'idle' && (
          <>
            {/* Resumen de credenciales actuales */}
            <div className="text-left mb-4 px-2 space-y-2">
              {/* NFC */}
              <div className="flex justify-between items-center bg-gray-50 dark:bg-gray-800 p-2 rounded text-sm">
                <span className="text-gray-600 dark:text-gray-300">NFC: <strong>{aprendiz?.nfcUid || 'Ninguno'}</strong></span>
                {aprendiz?.nfcUid && (
                  <button 
                    onClick={deleteNfc}
                    disabled={deleting}
                    className="text-red-500 hover:text-red-700 text-xs font-bold px-2 py-1 bg-red-50 dark:bg-red-900/20 rounded hover:bg-red-100 transition-colors flex items-center gap-1"
                  >
                    {deleting ? <Loader2 size={11} className="animate-spin" /> : <Trash2 size={11} />}
                    Eliminar
                  </button>
                )}
              </div>

              {/* Huellas */}
              <div className="flex flex-col gap-2 bg-gray-50 dark:bg-gray-800 p-2 rounded text-sm">
                <span className="text-gray-600 dark:text-gray-300">
                  Huellas: {aprendiz?.huellas?.length > 0 ? '' : <strong>No registradas</strong>}
                </span>
                {aprendiz?.huellas?.length > 0 && aprendiz.huellas.map(hId => (
                  <div key={hId} className="flex justify-between items-center bg-white dark:bg-zinc-800  dark:bg-gray-700 px-3 py-1 border border-gray-200 dark:border-zinc-700  dark:border-gray-600 rounded">
                    <span className="font-mono text-purple-600 dark:text-purple-400">ID: {hId}</span>
                    <button 
                      onClick={() => removeFingerprint(hId)} 
                      disabled={deleting}
                      className="text-red-500 hover:text-red-700 text-xs font-bold px-2 py-1 bg-red-50 dark:bg-red-900/20 rounded hover:bg-red-100 transition-colors flex items-center gap-1"
                    >
                      {deleting ? <Loader2 size={11} className="animate-spin" /> : <Trash2 size={11} />}
                      Eliminar
                    </button>
                  </div>
                ))}
              </div>

              {/* Cara */}
              <div className="flex justify-between items-center bg-gray-50 dark:bg-gray-800 p-2 rounded text-sm">
                <span className="text-gray-600 dark:text-gray-300">
                  Cara: <strong>{hasFace ? '✓ Registrada' : 'No registrada'}</strong>
                </span>
                {hasFace && (
                  <button 
                    onClick={deleteFaceDescriptor}
                    disabled={deleting}
                    className="text-red-500 hover:text-red-700 text-xs font-bold px-2 py-1 bg-red-50 rounded flex items-center gap-1"
                  >
                    {deleting ? <Loader2 size={11} className="animate-spin" /> : <Trash2 size={11} />}
                    Eliminar
                  </button>
                )}
              </div>
            </div>

            {/* Botones de registro */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3  gap-3">
              <button onClick={startNfc}
                className="flex flex-col items-center gap-2 p-4 rounded-2xl border-2 border-gray-100 dark:border-zinc-700  dark:border-gray-700 hover:border-[#4285F4] hover:bg-blue-50/50 transition-all group">
                <div className="w-10 h-10 rounded-full bg-blue-100 text-[#4285F4] flex items-center justify-center group-hover:scale-110 transition-transform">
                  <CreditCard size={20} />
                </div>
                <span className="font-semibold text-gray-700 dark:text-gray-200 text-xs">Tarjeta NFC</span>
              </button>

              <button onClick={startFingerprint}
                className="flex flex-col items-center gap-2 p-4 rounded-2xl border-2 border-gray-100 dark:border-zinc-700  dark:border-gray-700 hover:border-purple-500 hover:bg-purple-50/50 transition-all group">
                <div className="w-10 h-10 rounded-full bg-purple-100 text-purple-500 flex items-center justify-center group-hover:scale-110 transition-transform">
                  <Fingerprint size={20} />
                </div>
                <span className="font-semibold text-gray-700 dark:text-gray-200 text-xs">Añadir Huella</span>
              </button>

              <button onClick={startFace}
                className="flex flex-col items-center gap-2 p-4 rounded-2xl border-2 border-gray-100 dark:border-zinc-700  dark:border-gray-700 hover:border-[#34A853] hover:bg-green-50/50 transition-all group">
                <div className={`w-10 h-10 rounded-full ${hasFace ? 'bg-green-200 text-[#34A853]' : 'bg-green-100 text-[#34A853]'} flex items-center justify-center group-hover:scale-110 transition-transform`}>
                  <ScanFace size={20} />
                </div>
                <span className="font-semibold text-gray-700 dark:text-gray-200 text-xs">
                  {hasFace ? 'Re-registrar Cara' : 'Registrar Cara'}
                </span>
              </button>
            </div>
          </>
        )}

        {/* Modo cámara facial */}
        {mode === 'face' && status === 'waiting' && (
          <div className="text-left">
            <p className="text-sm text-gray-500 mb-3 text-center">
              Coloca la cara de <strong>{aprendiz?.fullName}</strong> frente a la cámara
            </p>
            <FaceCapture
              label={`Capturando cara de ${aprendiz?.fullName}`}
              continuousMode={false}
              onDescriptor={handleFaceDescriptor}
              onClose={() => { setMode(null); setStatus('idle'); }}
            />
          </div>
        )}

        {/* Esperando hardware */}
        {status === 'waiting' && mode !== 'face' && (
          <div className="py-8 flex flex-col items-center justify-center animate-fade-in">
            <div className="relative mb-6">
              {mode === 'nfc' ? <CreditCard size={48} className="text-[#4285F4] animate-pulse" /> : <Fingerprint size={48} className="text-purple-500 animate-pulse" />}
              <div className="absolute -inset-4 bg-blue-500/20 rounded-full animate-ping" />
            </div>
            <p className="text-lg font-medium text-gray-800 dark:text-gray-200 animate-pulse">{message}</p>
            {mode === 'fingerprint' && (
              <p className="text-xs text-gray-400 mt-3 max-w-xs text-center">
                El lector pedirá el dedo <strong>2 veces</strong>.<br/>
                Captura 1 → retira → captura 2
              </p>
            )}
            <p className="text-sm text-gray-400 mt-2">Esperando respuesta del Arduino...</p>
          </div>
        )}
      </div>
    </Modal>
    
    <ConfirmDialog
      open={confirmDialog.open}
      onClose={() => setConfirmDialog({ open: false, action: null, data: null })}
      onConfirm={confirmDialog.action}
      title={
        confirmDialog.data?.id ? "Eliminar Huella" : 
        confirmDialog.data?.type === 'nfc' ? "Eliminar NFC" :
        "Eliminar Reconocimiento Facial"
      }
      message={
        confirmDialog.data?.id 
          ? `¿Estás seguro de eliminar la huella ${confirmDialog.data.id}? Esta acción no se puede deshacer.`
          : confirmDialog.data?.type === 'nfc'
          ? "¿Eliminar el NFC de este aprendiz? Esta acción no se puede deshacer."
          : "¿Eliminar el reconocimiento facial de este aprendiz? Esta acción no se puede deshacer."
      }
      confirmText="Eliminar"
      cancelText="Cancelar"
      danger={true}
    />
  </>
  );
}
