import { useState, useEffect } from 'react';

// Llave pública generada (VAPID_PUBLIC_KEY)
const publicVapidKey = import.meta.env.VITE_VAPID_PUBLIC_KEY || 'BPpzguTP5_tLNvvJIjwD2-ZN8PJH9YdjEbamT1XwbUyNFPzYH2cATXUMzk9wwVml3gJRiXlsb8s9lkw4h66THBM';

function urlBase64ToUint8Array(base64String) {
  const padding = '='.repeat((4 - base64String.length % 4) % 4);
  const base64 = (base64String + padding)
    .replace(/\-/g, '+')
    .replace(/_/g, '/');

  const rawData = window.atob(base64);
  const outputArray = new Uint8Array(rawData.length);

  for (let i = 0; i < rawData.length; ++i) {
    outputArray[i] = rawData.charCodeAt(i);
  }
  return outputArray;
}

export function usePushNotifications() {
  const [isSubscribed, setIsSubscribed] = useState(false);
  const [permission, setPermission] = useState(Notification.permission);
  const [error, setError] = useState(null);

  useEffect(() => {
    checkSubscription();
  }, []);

  const checkSubscription = async () => {
    if (!('serviceWorker' in navigator) || !('PushManager' in window)) return;
    try {
      const registration = await navigator.serviceWorker.ready;
      const subscription = await registration.pushManager.getSubscription();
      setIsSubscribed(!!subscription);
    } catch (err) {
      console.error('Error verificando suscripción:', err);
    }
  };

  const subscribeUser = async () => {
    if (!('serviceWorker' in navigator) || !('PushManager' in window)) {
      setError('Notificaciones Push no soportadas');
      return false;
    }

    try {
      const p = await Notification.requestPermission();
      setPermission(p);
      if (p !== 'granted') {
        throw new Error('Permiso de notificaciones denegado');
      }

      const registration = await navigator.serviceWorker.ready;
      
      const subscription = await registration.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: urlBase64ToUint8Array(publicVapidKey)
      });

      // Enviar al backend
      const token = localStorage.getItem('token');
      const API_BASE = import.meta.env.VITE_API_URL || 'http://localhost:3000/api';
      
      await fetch(`${API_BASE}/push/subscribe`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ subscription })
      });

      setIsSubscribed(true);
      return true;
    } catch (err) {
      console.error('Error suscribiendo al push:', err);
      setError(err.message);
      return false;
    }
  };

  return { isSubscribed, permission, error, subscribeUser };
}
