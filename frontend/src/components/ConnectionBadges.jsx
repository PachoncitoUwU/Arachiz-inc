import React, { useState, useEffect } from 'react';
import { Bluetooth, Usb } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { bleService } from '../services/bleService';
import { useAuth } from '../context/AuthContext';
import fetchApi from '../services/api';

/**
 * Muestra el estado de la conexión inalámbrica con la Caja Arachiz (ESP32) vía Bluetooth BLE
 * y ofrece navegación rápida a Configuración cuando está desconectada.
 */
export default function ConnectionBadges() {
  const navigate = useNavigate();
  const { user } = useAuth() || {};
  const [bleConnected, setBleConnected] = useState(bleService.isConnected);
  const [usbConnected, setUsbConnected] = useState(false);

  useEffect(() => {
    // Suscribirse al estado de Bluetooth BLE
    const unsubscribe = bleService.subscribe((data) => {
      if (data.type === 'STATUS') {
        setBleConnected(data.payload === 'CONNECTED');
      } else {
        setBleConnected(bleService.isConnected);
      }
    });

    // Opcional: comprobar silenciosamente el estado USB (para modo escritorio/local)
    const checkUsb = () => {
      fetchApi('/hardware/status')
        .then((res) => setUsbConnected(!!res?.usbConnected))
        .catch(() => setUsbConnected(false));
    };
    checkUsb();
    const interval = setInterval(checkUsb, 10000);

    return () => {
      unsubscribe();
      clearInterval(interval);
    };
  }, []);

  const configPath = user?.userType === 'administrador' ? '/admin/configuracion' : '/instructor/configuracion';

  return (
    <div className="flex items-center gap-2 flex-wrap">
      {/* Estado Bluetooth BLE */}
      {bleConnected ? (
        <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold border shadow-sm bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400 border-blue-200 dark:border-blue-700">
          <span className="w-2 h-2 rounded-full bg-blue-500 animate-pulse" />
          <Bluetooth size={13} className="text-blue-600 dark:text-blue-400" />
          Caja conectada al Bluetooth
        </span>
      ) : (
        <>
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold border shadow-sm bg-red-50 text-red-600 dark:bg-red-950/40 dark:text-red-400 border-red-200 dark:border-red-800">
            <span className="w-2 h-2 rounded-full bg-red-500" />
            <Bluetooth size={13} />
            Caja desconectada del bluetooth
          </span>
          {(user?.userType === 'instructor' || user?.userType === 'administrador') && (
            <button
              onClick={() => navigate(configPath)}
              className="text-xs font-bold text-blue-600 dark:text-blue-400 hover:bg-blue-100 dark:hover:bg-blue-900/50 transition-all px-2.5 py-1 rounded-full border border-blue-200 dark:border-blue-800 bg-blue-50 dark:bg-blue-950 shadow-sm flex items-center gap-1"
              title="Ir a Configuración para emparejar la caja por Bluetooth"
            >
              Conectar en Configuración →
            </button>
          )}
        </>
      )}

      {/* Mostrar badge USB solo si hay una conexión por cable al puerto COM detectada localmente */}
      {usbConnected && (
        <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold border shadow-sm bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400 border-green-200 dark:border-green-700">
          <span className="w-2 h-2 rounded-full bg-green-500 animate-pulse" />
          <Usb size={12} />
          USB conectado
        </span>
      )}
    </div>
  );
}
