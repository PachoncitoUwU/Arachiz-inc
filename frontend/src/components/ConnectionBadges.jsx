import React, { useState, useEffect } from 'react';
import { Wifi, Usb } from 'lucide-react';
import fetchApi from '../services/api';

/**
 * Muestra badges de conexión de hardware:
 * - Verde "Caja WiFi" cuando el ESP8266 está conectado por WiFi
 * - Verde "Conectado USB" cuando el Arduino está conectado por puerto COM
 * Solo se renderiza algo si al menos una conexión está activa.
 */
export default function ConnectionBadges() {
  const [status, setStatus] = useState({ usbConnected: false, espConnected: false });

  const fetchStatus = async () => {
    try {
      const res = await fetchApi('/hardware/status');
      setStatus({ usbConnected: res.usbConnected, espConnected: res.espConnected });
    } catch {
      // Si falla (sin backend local, etc.) no mostrar nada
      setStatus({ usbConnected: false, espConnected: false });
    }
  };

  useEffect(() => {
    fetchStatus();
    // Polling cada 5 segundos — el ESP hace poll cada ~2s, así lo detectamos rápido
    const interval = setInterval(fetchStatus, 5000);
    return () => clearInterval(interval);
  }, []);

  if (!status.usbConnected && !status.espConnected) return null;

  return (
    <div className="flex items-center gap-2 flex-wrap">
      {status.espConnected && (
        <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400 border border-green-200 dark:border-green-700 shadow-sm">
          <span className="w-2 h-2 rounded-full bg-green-500 animate-pulse" />
          <Wifi size={12} />
          Caja conectada por WiFi
        </span>
      )}
      {status.usbConnected && (
        <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400 border border-green-200 dark:border-green-700 shadow-sm">
          <span className="w-2 h-2 rounded-full bg-green-500 animate-pulse" />
          <Usb size={12} />
          Conectado por USB
        </span>
      )}
    </div>
  );
}
