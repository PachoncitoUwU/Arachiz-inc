import React, { useState, useEffect, useRef } from 'react';
import { CreditCard, Fingerprint, Volume2, CheckCircle2, AlertCircle, RefreshCcw, XCircle, Wrench, Loader2, Bluetooth } from 'lucide-react';
import { socket } from '../services/socket';
import fetchApi from '../services/api';
import { useToast } from '../context/ToastContext';
import { bleService } from '../services/bleService';

export default function HardwareDiagnostic() {
  const { showToast } = useToast();
  const [activeTest, setActiveTest] = useState(null); // 'nfc' | 'finger' | 'buzzer' | null
  const [nfcResult, setNfcResult] = useState(null); // true (éxito) | null
  const [fingerResult, setFingerResult] = useState(null); // true (éxito) | null
  const [buzzerState, setBuzzerState] = useState('idle'); // 'idle' | 'asked' | 'success'
  const [loading, setLoading] = useState(false);
  const [bleLoading, setBleLoading] = useState(false);
  const [bleConnected, setBleConnected] = useState(bleService.isConnected);
  const activeTestRef = useRef(null);
  const [socketConnected, setSocketConnected] = useState(socket.connected);

  // Escuchar notificaciones del servicio Bluetooth BLE
  useEffect(() => {
    const unsubscribe = bleService.subscribe((data) => {
      if (data.type === 'STATUS') {
        setBleConnected(data.payload === 'CONNECTED');
      } else if (data.type === 'RFID') {
        setNfcResult(true);
        showToast(`¡NFC detectado por Bluetooth! ID: ${data.payload}`, 'success');
        stopTestMode();
      } else if (data.type === 'FINGERPRINT') {
        setFingerResult(true);
        showToast(`¡Huella detectada por Bluetooth! ID: ${data.payload}`, 'success');
        stopTestMode();
      }
    });

    return () => unsubscribe();
  }, []);

  const handleToggleBle = async () => {
    try {
      setBleLoading(true);
      if (bleConnected) {
        await bleService.disconnect();
        showToast('Bluetooth BLE desconectado', 'info');
      } else {
        await bleService.connect();
        showToast('¡Caja Arachiz emparejada por Bluetooth!', 'success');
      }
    } catch (err) {
      showToast(err.message || 'Error al conectar por Bluetooth', 'error');
    } finally {
      setBleLoading(false);
    }
  };

  // Monitorear y forzar conexión del socket
  useEffect(() => {
    const onConnect = () => {
      console.log('[HardwareDiagnostic] WebSocket Conectado, ID:', socket.id);
      setSocketConnected(true);
    };
    const onDisconnect = () => {
      console.log('[HardwareDiagnostic] WebSocket Desconectado');
      setSocketConnected(false);
    };

    socket.on('connect', onConnect);
    socket.on('disconnect', onDisconnect);

    if (socket.connected) {
      setSocketConnected(true);
    } else {
      console.log('[HardwareDiagnostic] Intentando conectar socket manualmente...');
      socket.connect();
    }

    return () => {
      socket.off('connect', onConnect);
      socket.off('disconnect', onDisconnect);
    };
  }, []);

  // Manejadores de eventos por WebSockets
  useEffect(() => {
    const handleNfcRead = (data) => {
      console.log('[HardwareDiagnostic] NFC Evento Recibido:', data);
      setNfcResult(true);
      showToast('¡Lector NFC funciona correctamente!', 'success');
      stopTestMode();
    };

    const handleFingerRead = (data) => {
      console.log('[HardwareDiagnostic] Huella Evento Recibido:', data);
      setFingerResult(true);
      showToast('¡Lector de huella funciona correctamente!', 'success');
      stopTestMode();
    };

    socket.on('arduino_read_nfc', handleNfcRead);
    socket.on('arduino_read_finger', handleFingerRead);

    return () => {
      socket.off('arduino_read_nfc', handleNfcRead);
      socket.off('arduino_read_finger', handleFingerRead);
    };
  }, []);

  const startTestMode = async (testType) => {
    try {
      setLoading(true);
      activeTestRef.current = testType;
      setActiveTest(testType);
      
      if (bleConnected) {
        console.log(`[HardwareDiagnostic] [BLE] Activando modo diagnóstico ${testType.toUpperCase()}`);
        await bleService.sendCommand('TEST_MODE_ON');
        showToast(`Modo diagnóstico ${testType.toUpperCase()} activo por Bluetooth BLE`, 'info');
        if (testType === 'nfc') setNfcResult(null);
        if (testType === 'finger') setFingerResult(null);
        return;
      }

      console.log(`[HardwareDiagnostic] [USB] Activando modo diagnóstico ${testType.toUpperCase()} vía HTTP/Serial`);
      await fetchApi('/serial/test/mode', {
        method: 'POST',
        body: JSON.stringify({ active: true })
      });
      if (testType === 'nfc') setNfcResult(null);
      if (testType === 'finger') setFingerResult(null);
    } catch (err) {
      showToast(err.message || 'Error iniciando modo diagnóstico', 'error');
      activeTestRef.current = null;
      setActiveTest(null);
    } finally {
      setLoading(false);
    }
  };

  const stopTestMode = async () => {
    activeTestRef.current = null;
    setActiveTest(null);
    try {
      if (bleConnected) {
        console.log('[HardwareDiagnostic] [BLE] Desactivando modo diagnóstico');
        await bleService.sendCommand('TEST_MODE_OFF');
        return;
      }
      console.log('[HardwareDiagnostic] [USB] Desactivando modo diagnóstico vía HTTP/Serial');
      await fetchApi('/serial/test/mode', {
        method: 'POST',
        body: JSON.stringify({ active: false })
      });
    } catch (err) {
      console.error('[HardwareDiagnostic] Error al detener modo test:', err);
    }
  };

  const handleTestBuzzer = async () => {
    try {
      setLoading(true);
      if (bleConnected) {
        console.log('[HardwareDiagnostic] [BLE] Enviando comando TEST_BUZZER por Bluetooth BLE');
        await bleService.sendCommand('TEST_BUZZER');
        showToast('¡Comando de sonido emitido por Bluetooth BLE!', 'info');
        setBuzzerState('asked');
        setActiveTest('buzzer');
        return;
      }
      console.log('[HardwareDiagnostic] [USB] Enviando comando TEST_BUZZER vía HTTP/Serial');
      await fetchApi('/serial/test/buzzer', { method: 'POST' });
      setBuzzerState('asked');
      setActiveTest('buzzer');
    } catch (err) {
      showToast(err.message || 'Error al emitir sonido', 'error');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="card bg-white dark:bg-zinc-800 border border-gray-200 dark:border-zinc-700 shadow-sm mt-4 p-5 rounded-2xl transition-all duration-300">
      <div className="flex items-center gap-3 mb-4 pb-3 border-b border-gray-100 dark:border-zinc-700">
        <div className="w-8 h-8 bg-purple-50 dark:bg-purple-900/30 rounded-lg flex items-center justify-center">
          <Wrench size={18} className="text-purple-600 dark:text-purple-400" />
        </div>
        <div className="flex-1">
          <div className="flex items-center gap-2">
            <h2 className="font-bold text-gray-900 dark:text-white text-base">
              Prueba Diagnóstica de Hardware
            </h2>
            <span className={`text-[10px] px-2 py-0.5 rounded-full font-bold ${socketConnected ? 'bg-green-100 text-green-700 dark:bg-green-950 dark:text-green-300' : 'bg-red-100 text-red-700 dark:bg-red-950 dark:text-red-300'}`}>
              {socketConnected ? 'Sincronizado' : 'Desconectado'}
            </span>
          </div>
          <p className="text-xs text-gray-500 dark:text-gray-400">
            Prueba física de sensores de tarjeta, huella y altavoz sin consultar la base de datos.
          </p>
        </div>
      </div>

      {/* BANNER BLUETOOTH BLE (ESP32) */}
      <div className="mb-5 p-3.5 rounded-xl border border-blue-100 dark:border-blue-900/40 bg-blue-50/40 dark:bg-blue-950/20 flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <div className={`w-3 h-3 rounded-full ${bleConnected ? 'bg-blue-500 animate-pulse' : 'bg-gray-400'}`} />
          <div>
            <h3 className="text-sm font-semibold text-gray-900 dark:text-white flex items-center gap-1.5">
              <Bluetooth size={16} className="text-blue-500" />
              Canal Inalámbrico Bluetooth BLE (ESP32)
            </h3>
            <p className="text-xs text-gray-500 dark:text-gray-400">
              {bleConnected ? 'Conectado a la Caja Arachiz vía Bluetooth BLE' : 'Empareja tu portátil o móvil con un clic sin routers WiFi.'}
            </p>
          </div>
        </div>
        <button
          onClick={handleToggleBle}
          disabled={bleLoading}
          className={`px-3.5 py-1.5 text-xs font-bold rounded-xl transition-all shadow-sm flex items-center gap-1.5 ${
            bleConnected
              ? 'bg-red-50 text-red-600 hover:bg-red-100 dark:bg-red-950/50 dark:text-red-300'
              : 'bg-blue-600 hover:bg-blue-700 text-white shadow-blue-500/20'
          }`}
        >
          {bleLoading ? <Loader2 size={14} className="animate-spin" /> : <Bluetooth size={14} />}
          {bleConnected ? 'Desconectar BLE' : 'Conectar por Bluetooth (ESP32)'}
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {/* 💳 TARJETA 1: PRUEBA NFC */}
        <div className="p-4 rounded-xl border border-gray-100 dark:border-zinc-700 bg-gray-50/50 dark:bg-zinc-900/50 flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-2">
              <span className="font-semibold text-sm text-gray-800 dark:text-gray-200 flex items-center gap-2">
                <CreditCard size={18} className="text-blue-500" />
                Lector NFC
              </span>
              {nfcResult && (
                <span className="text-xs font-bold text-green-600 bg-green-100 dark:bg-green-900/30 px-2 py-0.5 rounded-full flex items-center gap-1">
                  <CheckCircle2 size={12} /> Funciona
                </span>
              )}
            </div>
            <p className="text-xs text-gray-500 dark:text-gray-400 mb-3">
              Detecta si la antena NFC lee tarjetas o llaveros.
            </p>
          </div>

          {activeTest === 'nfc' ? (
            <div className="space-y-2">
              <div className="p-3 bg-blue-50 dark:bg-blue-900/30 rounded-lg text-center animate-pulse border border-blue-200 dark:border-blue-800">
                <p className="text-xs font-medium text-blue-700 dark:text-blue-300 flex items-center justify-center gap-1.5">
                  <Loader2 size={14} className="animate-spin" />
                  Acerca cualquier tarjeta NFC...
                </p>
              </div>
              <button
                onClick={stopTestMode}
                className="w-full py-1.5 text-xs font-semibold text-red-600 dark:text-red-400 bg-red-50 dark:bg-red-900/20 hover:bg-red-100 dark:hover:bg-red-900/40 rounded-lg transition-colors flex items-center justify-center gap-1"
              >
                <XCircle size={14} />
                Cancelar Detector
              </button>
            </div>
          ) : (
            <div>
              {nfcResult && (
                <div className="mb-2 p-2 bg-green-50 dark:bg-green-900/20 text-green-700 dark:text-green-300 text-xs font-semibold rounded-lg text-center">
                  ✅ Lector NFC Funciona Correctamente
                </div>
              )}
              <button
                onClick={() => startTestMode('nfc')}
                disabled={loading || activeTest !== null}
                className="btn btn-primary w-full py-2 text-xs flex items-center justify-center gap-1.5"
              >
                <CreditCard size={14} />
                Escanear NFC
              </button>
            </div>
          )}
        </div>

        {/* 👆 TARJETA 2: PRUEBA HUELLA */}
        <div className="p-4 rounded-xl border border-gray-100 dark:border-zinc-700 bg-gray-50/50 dark:bg-zinc-900/50 flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-2">
              <span className="font-semibold text-sm text-gray-800 dark:text-gray-200 flex items-center gap-2">
                <Fingerprint size={18} className="text-purple-500" />
                Lector de Huella
              </span>
              {fingerResult && (
                <span className="text-xs font-bold text-green-600 bg-green-100 dark:bg-green-900/30 px-2 py-0.5 rounded-full flex items-center gap-1">
                  <CheckCircle2 size={12} /> Funciona
                </span>
              )}
            </div>
            <p className="text-xs text-gray-500 dark:text-gray-400 mb-3">
              Detecta si la óptica de cristal azul captura dedos.
            </p>
          </div>

          {activeTest === 'finger' ? (
            <div className="space-y-2">
              <div className="p-3 bg-purple-50 dark:bg-purple-900/30 rounded-lg text-center animate-pulse border border-purple-200 dark:border-purple-800">
                <p className="text-xs font-medium text-purple-700 dark:text-purple-300 flex items-center justify-center gap-1.5">
                  <Loader2 size={14} className="animate-spin" />
                  Coloca cualquier dedo en el lector...
                </p>
              </div>
              <button
                onClick={stopTestMode}
                className="w-full py-1.5 text-xs font-semibold text-red-600 dark:text-red-400 bg-red-50 dark:bg-red-900/20 hover:bg-red-100 dark:hover:bg-red-900/40 rounded-lg transition-colors flex items-center justify-center gap-1"
              >
                <XCircle size={14} />
                Cancelar Detector
              </button>
            </div>
          ) : (
            <div>
              {fingerResult && (
                <div className="mb-2 p-2 bg-green-50 dark:bg-green-900/20 text-green-700 dark:text-green-300 text-xs font-semibold rounded-lg text-center">
                  ✅ Lector de Huella Funciona Correctamente
                </div>
              )}
              <button
                onClick={() => startTestMode('finger')}
                disabled={loading || activeTest !== null}
                className="btn bg-purple-600 text-white hover:bg-purple-700 w-full py-2 text-xs flex items-center justify-center gap-1.5 border-0"
              >
                <Fingerprint size={14} />
                Escanear Huella
              </button>
            </div>
          )}
        </div>

        {/* 🔊 TARJETA 3: PRUEBA ALTAVOZ / BUZZER */}
        <div className="p-4 rounded-xl border border-gray-100 dark:border-zinc-700 bg-gray-50/50 dark:bg-zinc-900/50 flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-2">
              <span className="font-semibold text-sm text-gray-800 dark:text-gray-200 flex items-center gap-2">
                <Volume2 size={18} className="text-amber-500" />
                Altavoz / Buzzer
              </span>
              {buzzerState === 'success' && (
                <span className="text-xs font-bold text-green-600 bg-green-100 dark:bg-green-900/30 px-2 py-0.5 rounded-full flex items-center gap-1">
                  <CheckCircle2 size={12} /> Funciona
                </span>
              )}
            </div>
            <p className="text-xs text-gray-500 dark:text-gray-400 mb-3">
              Prueba la emisión de tonos y sonidos de notificación.
            </p>
          </div>

          {activeTest === 'buzzer' && buzzerState === 'asked' ? (
            <div className="space-y-2">
              <p className="text-xs font-semibold text-gray-800 dark:text-gray-200 text-center">
                ¿Escuchaste el sonido del altavoz?
              </p>
              <div className="grid grid-cols-1 gap-1.5">
                <button
                  onClick={() => {
                    setBuzzerState('success');
                    setActiveTest(null);
                    showToast('Altavoz verificado correctamente', 'success');
                  }}
                  className="w-full py-1.5 text-xs font-semibold bg-green-600 text-white hover:bg-green-700 rounded-lg transition-colors flex items-center justify-center gap-1"
                >
                  <CheckCircle2 size={13} />
                  Sí, sonó correctamente
                </button>

                <button
                  onClick={handleTestBuzzer}
                  className="w-full py-1.5 text-xs font-semibold bg-amber-100 dark:bg-amber-900/30 text-amber-800 dark:text-amber-300 hover:bg-amber-200 rounded-lg transition-colors flex items-center justify-center gap-1"
                >
                  <RefreshCcw size={13} />
                  Repetir Sonido
                </button>

                <button
                  onClick={() => {
                    setBuzzerState('idle');
                    setActiveTest(null);
                  }}
                  className="w-full py-1.5 text-xs font-semibold bg-gray-200 dark:bg-zinc-700 text-gray-700 dark:text-gray-300 hover:bg-gray-300 rounded-lg transition-colors flex items-center justify-center gap-1"
                >
                  <XCircle size={13} />
                  Cancelar
                </button>
              </div>
            </div>
          ) : (
            <div>
              {buzzerState === 'success' && (
                <div className="mb-2 p-2 bg-green-50 dark:bg-green-900/20 text-green-700 dark:text-green-300 text-xs font-semibold rounded-lg text-center">
                  ✅ Altavoz Funciona Correctamente
                </div>
              )}
              <button
                onClick={handleTestBuzzer}
                disabled={loading || activeTest !== null}
                className="btn bg-amber-500 text-white hover:bg-amber-600 w-full py-2 text-xs flex items-center justify-center gap-1.5 border-0"
              >
                <Volume2 size={14} />
                Probar Audio
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
