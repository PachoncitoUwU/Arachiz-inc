import React, { useState, useEffect } from 'react';
import Modal from './Modal';
import { socket } from '../services/socket';
import fetchApi from '../services/api';
import { Fingerprint, CreditCard, CheckCircle2, AlertCircle, Loader2 } from 'lucide-react';

export default function EnrollModal({ open, onClose, aprendiz }) {
  const [mode, setMode] = useState(null); // 'nfc', 'fingerprint', or null
  const [status, setStatus] = useState('idle'); // idle, waiting, success, error
  const [message, setMessage] = useState('');

  // Reiniciar estado
  useEffect(() => {
    if (open) {
      setMode(null);
      setStatus('idle');
      setMessage('');
    }
  }, [open]);

  useEffect(() => {
    if (!open) return;

    const onNfc = async (data) => {
      if (mode !== 'nfc' || status === 'success') return;
      try {
        setStatus('waiting');
        await fetchApi('/serial/bind', {
          method: 'PUT',
          body: JSON.stringify({ userId: aprendiz.id, nfcUid: data.uid })
        });
        setStatus('success');
        setMessage(`NFC vinculado: ${data.uid}`);
      } catch (err) {
        setStatus('error');
        setMessage(err.message || 'Error al vincular NFC');
      }
    };

    const onFingerSuccess = async (data) => {
      if (mode !== 'fingerprint' || status === 'success') return;
      try {
        await fetchApi('/serial/bind', {
          method: 'PUT',
          body: JSON.stringify({ userId: aprendiz.id, huellaId: data.id })
        });
        setStatus('success');
        setMessage(`Huella ID ${data.id} vinculada exitosamente`);
        if (!aprendiz.huellas) aprendiz.huellas = [];
        aprendiz.huellas.push(data.id);
      } catch (err) {
        setStatus('error');
        setMessage(err.message || 'Error al guardar huella en la BD');
      }
    };

    const onFingerError = (data) => {
      if (mode !== 'fingerprint') return;
      setStatus('error');
      setMessage(data.message || 'Error al registrar huella');
    };

    socket.on('arduino_read_nfc', onNfc);
    socket.on('arduino_enroll_success', onFingerSuccess);
    socket.on('arduino_enroll_error', onFingerError);

    return () => {
      socket.off('arduino_read_nfc', onNfc);
      socket.off('arduino_enroll_success', onFingerSuccess);
      socket.off('arduino_enroll_error', onFingerError);
    };
  }, [open, mode, status, aprendiz]);

  const startNfc = () => {
    setMode('nfc');
    setStatus('waiting');
    setMessage('Acerca la tarjeta o llavero NFC al lector...');
  };

  const startFingerprint = async () => {
    setMode('fingerprint');
    setStatus('waiting');
    setMessage('Sigue las instrucciones del lector de huella...');
    try {
      const { nextId } = await fetchApi('/serial/next-finger-id');
      await fetchApi('/serial/enroll/finger', {
        method: 'POST',
        body: JSON.stringify({ id: nextId })
      });
    } catch (err) {
      setStatus('error');
      setMessage(err.message || 'Error al iniciar enrolamiento');
    }
  };

  const removeFingerprint = async (id) => {
    if (!confirm(`¿Estás seguro de eliminar la huella ${id}? Se borrará de la BD y del sensor.`)) return;
    try {
      await fetchApi('/serial/finger', {
        method: 'DELETE',
        body: JSON.stringify({ userId: aprendiz.id, huellaId: id })
      });
      aprendiz.huellas = aprendiz.huellas.filter(h => h !== id);
      setStatus('idle'); // forzar re-render
      setMessage('');
    } catch(err) {
      alert(err.message);
    }
  };

  return (
    <Modal open={open} onClose={onClose} title="Vincular Lector">
      <div className="space-y-4 text-center pb-2">
        {aprendiz && (
          <p className="text-gray-600 mb-4 pb-4 border-b border-gray-100">
            Asignando credenciales a <br/>
            <strong className="text-gray-900">{aprendiz.fullName}</strong>
          </p>
        )}

        {status === 'idle' && (
          <div className="text-left mb-4 px-2">
             <div className="flex justify-between items-center bg-gray-50 dark:bg-gray-800 p-2 rounded text-sm mb-2">
                <span className="text-gray-600 dark:text-gray-300">NFC: <strong>{aprendiz?.nfcUid || 'Ninguno'}</strong></span>
             </div>
             {aprendiz?.huellas?.length > 0 && (
                <div className="flex flex-col gap-2 bg-gray-50 dark:bg-gray-800 p-2 rounded text-sm">
                   <span className="text-gray-600 dark:text-gray-300">Huellas guardadas:</span>
                   {aprendiz.huellas.map(hId => (
                     <div key={hId} className="flex justify-between items-center bg-white dark:bg-gray-700 px-3 py-1 border border-gray-200 dark:border-gray-600 rounded">
                        <span className="font-mono text-purple-600 dark:text-purple-400">ID: {hId}</span>
                        <button onClick={() => removeFingerprint(hId)} className="text-red-500 hover:text-red-700 text-xs font-bold px-2 py-1 bg-red-50 dark:bg-red-900/20 rounded">Eliminar</button>
                     </div>
                   ))}
                </div>
             )}
          </div>
        )}

        {status === 'idle' && (
          <div className="grid grid-cols-2 gap-4">
            <button 
              onClick={startNfc}
              className="flex flex-col items-center gap-3 p-6 rounded-2xl border-2 border-gray-100 dark:border-gray-700 hover:border-[#4285F4] dark:hover:border-[#4285F4] hover:bg-blue-50/50 dark:hover:bg-blue-900/20 transition-all group"
            >
              <div className="w-12 h-12 rounded-full bg-blue-100 dark:bg-blue-900/50 text-[#4285F4] flex items-center justify-center group-hover:scale-110 transition-transform">
                <CreditCard size={24} />
              </div>
              <span className="font-semibold text-gray-700 dark:text-gray-200">Tarjeta NFC</span>
            </button>

            <button 
              onClick={startFingerprint}
              className="flex flex-col items-center gap-3 p-6 rounded-2xl border-2 border-gray-100 dark:border-gray-700 hover:border-purple-500 dark:hover:border-purple-500 hover:bg-purple-50/50 dark:hover:bg-purple-900/20 transition-all group"
            >
              <div className="w-12 h-12 rounded-full bg-purple-100 dark:bg-purple-900/50 text-purple-500 flex items-center justify-center group-hover:scale-110 transition-transform">
                <Fingerprint size={24} />
              </div>
              <span className="font-semibold text-gray-700 dark:text-gray-200">Añadir Huella</span>
            </button>
          </div>
        )}

        {status === 'waiting' && (
          <div className="py-8 flex flex-col items-center justify-center animate-fade-in">
            <div className="relative mb-6">
              {mode === 'nfc' ? <CreditCard size={48} className="text-[#4285F4] animate-pulse" /> : <Fingerprint size={48} className="text-purple-500 animate-pulse" />}
              <div className="absolute -inset-4 bg-blue-500/20 rounded-full animate-ping" />
            </div>
            <p className="text-lg font-medium text-gray-800 animate-pulse">{message}</p>
            <p className="text-sm text-gray-400 mt-2">Esperando respuesta del Arduino...</p>
          </div>
        )}

        {status === 'success' && (
          <div className="py-6 flex flex-col items-center justify-center">
            <CheckCircle2 size={56} className="text-green-500 mb-4" />
            <h3 className="text-xl font-bold text-gray-900 mb-2">¡Asignación Exitosa!</h3>
            <p className="text-green-600 bg-green-50 px-4 py-2 rounded-lg">{message}</p>
          </div>
        )}

        {status === 'error' && (
          <div className="py-6 flex flex-col items-center justify-center">
            <AlertCircle size={56} className="text-red-500 mb-4" />
            <h3 className="text-xl font-bold text-gray-900 mb-2">Se produjo un error</h3>
            <p className="text-red-600 bg-red-50 px-4 py-2 rounded-lg">{message}</p>
            <button onClick={() => setStatus('idle')} className="btn-secondary mt-6 border-red-200 text-red-600 hover:bg-red-50">Intenta de Nuevo</button>
          </div>
        )}

        {status === 'success' && (
          <button onClick={onClose} className="btn-primary w-full mt-4">Continuar</button>
        )}
      </div>
    </Modal>
  );
}
