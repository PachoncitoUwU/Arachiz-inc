import { useState, useEffect, useCallback } from 'react';
import fetchApi from '../services/api';

const VAPID_PUBLIC_KEY = import.meta.env.VITE_VAPID_PUBLIC_KEY;

function urlBase64ToUint8Array(base64String) {
  const padding = '='.repeat((4 - (base64String.length % 4)) % 4);
  const base64 = (base64String + padding).replace(/-/g, '+').replace(/_/g, '/');
  const rawData = window.atob(base64);
  const outputArray = new Uint8Array(rawData.length);
  for (let i = 0; i < rawData.length; ++i) {
    outputArray[i] = rawData.charCodeAt(i);
  }
  return outputArray;
}

export function usePushNotifications() {
  const [isSupported, setIsSupported] = useState(false);
  const [subscription, setSubscription] = useState(null);
  const [permission, setPermission] = useState(Notification.permission);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if ('serviceWorker' in navigator && 'PushManager' in window) {
      setIsSupported(true);
      checkSubscription();
    }
  }, []);

  const checkSubscription = async () => {
    try {
      const registration = await navigator.serviceWorker.ready;
      const sub = await registration.pushManager.getSubscription();
      if (sub) {
        setSubscription(sub);
      }
    } catch (e) {
      console.error('Error checking subscription', e);
    }
  };

  const subscribe = useCallback(async () => {
    if (!isSupported) return null;
    
    setLoading(true);
    try {
      const permissionResult = await Notification.requestPermission();
      setPermission(permissionResult);
      
      if (permissionResult !== 'granted') {
        throw new Error('Permission not granted for Notification');
      }

      const registration = await navigator.serviceWorker.ready;
      
      // Intentar suscribirse
      const sub = await registration.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: urlBase64ToUint8Array(VAPID_PUBLIC_KEY)
      });
      
      setSubscription(sub);

      // Enviar al backend
      await fetchApi('/push/subscribe', {
        method: 'POST',
        body: JSON.stringify({ subscription: sub })
      });

      return sub;
    } catch (error) {
      console.error('Error subscribing to push:', error);
      throw error;
    } finally {
      setLoading(false);
    }
  }, [isSupported]);

  return { isSupported, permission, subscription, subscribe, loading };
}
