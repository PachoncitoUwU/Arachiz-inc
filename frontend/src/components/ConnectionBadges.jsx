import React, { useState, useEffect } from 'react';
import { Wifi, Usb, Activity } from 'lucide-react';
import fetchApi from '../services/api';

/**
 * Muestra badges de conexión y rendimiento de red:
 * - Estado de Caja WiFi (ESP8266)
 * - Latencia actual de red (Ping)
 * - Estado USB solo cuando se detecte conexión física activa en escritorio
 */
export default function ConnectionBadges() {
  const [status, setStatus] = useState({ usbConnected: false, espConnected: false });
  const [ping, setPing] = useState(null);
  const [loaded, setLoaded] = useState(false);

  const fetchStatus = async () => {
    const startTime = performance.now();
    try {
      const res = await fetchApi('/hardware/status');
      const endTime = performance.now();
      setPing(Math.round(endTime - startTime));
      setStatus({ usbConnected: !!res.usbConnected, espConnected: !!res.espConnected });
    } catch {
      setPing(null);
    } finally {
      setLoaded(true);
    }
  };

  useEffect(() => {
    fetchStatus();
    const interval = setInterval(fetchStatus, 3000);
    return () => clearInterval(interval);
  }, []);

  if (!loaded) return null;

  return (
    <div className="flex items-center gap-2 flex-wrap">
      {/* Badge ESP8266 — Caja WiFi */}
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

      {/* Badge Ping de Red / Latencia al Servidor */}
      <span
        className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold border shadow-sm transition-all duration-500 bg-zinc-100 text-zinc-700 dark:bg-zinc-800 dark:text-zinc-300 border-zinc-200 dark:border-zinc-700"
        title="Tiempo de respuesta del servidor web en milisegundos"
      >
        <span
          className={`w-2 h-2 rounded-full ${
            ping !== null ? (ping < 250 ? 'bg-green-500 animate-pulse' : 'bg-yellow-500') : 'bg-red-500'
          }`}
        />
        <Activity size={12} className="text-zinc-500 dark:text-zinc-400" />
        {ping !== null ? `Ping: ${ping} ms` : 'Ping desconectado'}
      </span>

      {/* Mostrar badge USB solo cuando esté conectado localmente en escritorio */}
      {status.usbConnected && (
        <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold border shadow-sm bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400 border-green-200 dark:border-green-700">
          <span className="w-2 h-2 rounded-full bg-green-500 animate-pulse" />
          <Usb size={12} />
          USB conectado
        </span>
      )}
    </div>
  );
}
