import React, { useState, useEffect } from 'react';
import { Wifi, Usb } from 'lucide-react';
import fetchApi from '../services/api';

/**
 * Muestra badges de conexión de hardware:
 * - Verde animado: ESP8266 (WiFi/NFC/Huella) conectado
 * - Verde animado: Arduino conectado por USB/COM
 * - Rojo: desconectado (siempre visible para que el instructor sepa el estado)
 *
 * Hace polling al backend cada 3s para detección rápida.
 */
export default function ConnectionBadges() {
  const [status, setStatus] = useState({ usbConnected: false, espConnected: false });
  const [loaded, setLoaded] = useState(false);

  const fetchStatus = async () => {
    try {
      const res = await fetchApi('/hardware/status');
      setStatus({ usbConnected: !!res.usbConnected, espConnected: !!res.espConnected });
    } catch {
      // Si falla el fetch, dejar el estado anterior (no ocultar)
    } finally {
      setLoaded(true);
    }
  };

  useEffect(() => {
    fetchStatus();
    // Polling cada 3 segundos — el ESP hace poll cada ~800ms, así lo detectamos rápido
    const interval = setInterval(fetchStatus, 3000);
    return () => clearInterval(interval);
  }, []);

  // No renderizar nada hasta tener la primera respuesta
  if (!loaded) return null;

  return (
    <div className="flex items-center gap-2 flex-wrap">
      {/* Badge ESP8266 — NFC y Huella Digital vía WiFi */}
      <span
        className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold border shadow-sm transition-all duration-500 ${
          status.espConnected
            ? 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400 border-green-200 dark:border-green-700'
            : 'bg-red-50 text-red-500 dark:bg-red-900/20 dark:text-red-400 border-red-200 dark:border-red-800'
        }`}
      >
        <span
          className={`w-2 h-2 rounded-full ${
            status.espConnected ? 'bg-green-500 animate-pulse' : 'bg-red-400'
          }`}
        />
        <Wifi size={12} />
        {status.espConnected ? 'Caja WiFi online' : 'Caja WiFi offline'}
      </span>

      {/* Badge Arduino USB */}
      <span
        className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold border shadow-sm transition-all duration-500 ${
          status.usbConnected
            ? 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400 border-green-200 dark:border-green-700'
            : 'bg-red-50 text-red-500 dark:bg-red-900/20 dark:text-red-400 border-red-200 dark:border-red-800'
        }`}
      >
        <span
          className={`w-2 h-2 rounded-full ${
            status.usbConnected ? 'bg-green-500 animate-pulse' : 'bg-red-400'
          }`}
        />
        <Usb size={12} />
        {status.usbConnected ? 'USB conectado' : 'USB offline'}
      </span>
    </div>
  );
}
