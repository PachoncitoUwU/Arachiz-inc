const CACHE_NAME = 'arachiz-cache-v4';
const STATIC_CACHE = 'arachiz-static-v4';
const API_CACHE = 'arachiz-api-v2';

const STATIC_URLS = [
  '/',
  '/index.html',
  '/mi-logo.png',
  '/mi-logo-white.png',
  '/ArachizLogoPNG.png'
];

// ===================================
// INSTALL — Cache estáticos
// ===================================
self.addEventListener('install', event => {
  self.skipWaiting();
  event.waitUntil(
    caches.open(STATIC_CACHE)
      .then(cache => cache.addAll(STATIC_URLS).catch(() => {}))
  );
});

// ===================================
// ACTIVATE — Limpiar caches viejos
// ===================================
self.addEventListener('activate', event => {
  const currentCaches = [CACHE_NAME, STATIC_CACHE, API_CACHE];
  event.waitUntil(
    caches.keys().then(cacheNames =>
      Promise.all(
        cacheNames
          .filter(name => !currentCaches.includes(name))
          .map(name => caches.delete(name))
      )
    )
  );
  return self.clients.claim();
});

// ===================================
// FETCH — Estrategia inteligente
// ===================================
self.addEventListener('fetch', event => {
  const { request } = event;
  const url = new URL(request.url);

  // Solo manejar GET requests
  if (request.method !== 'GET') return;

  // Ignorar extensiones de Chrome, etc
  if (!url.protocol.startsWith('http')) return;

  // ── API requests: Network-first, fallback a cache ──
  if (url.pathname.startsWith('/api/')) {
    event.respondWith(networkFirstWithCache(request, API_CACHE));
    return;
  }

  // ── Assets JS/CSS: Network-first para evitar chunks de React desactualizados ──
  // Las imágenes y fuentes sí pueden ir Cache-first
  if (isJsOrCss(url.pathname)) {
    event.respondWith(networkFirstWithCache(request, STATIC_CACHE));
    return;
  }

  // ── Imágenes y fuentes: Cache-first ──
  if (isStaticMedia(url.pathname)) {
    event.respondWith(cacheFirstWithNetwork(request, STATIC_CACHE));
    return;
  }

  // ── Todo lo demás: Network-first ──
  event.respondWith(networkFirstWithCache(request, CACHE_NAME));
});

// ── Helpers de estrategias ──

function isJsOrCss(pathname) {
  return /\.(js|css)$/i.test(pathname);
}

function isStaticMedia(pathname) {
  return /\.(png|jpg|jpeg|gif|svg|ico|woff|woff2|ttf|eot)$/i.test(pathname);
}

async function networkFirstWithCache(request, cacheName) {
  try {
    const response = await fetch(request);
    if (response.ok) {
      const cache = await caches.open(cacheName);
      cache.put(request, response.clone());
    }
    return response;
  } catch (err) {
    const cached = await caches.match(request);
    if (cached) return cached;
    // Si es una navegación HTML, devolver el index para que React Router maneje
    if (request.headers.get('accept')?.includes('text/html')) {
      return caches.match('/index.html');
    }
    throw err;
  }
}

async function cacheFirstWithNetwork(request, cacheName) {
  const cached = await caches.match(request);
  if (cached) return cached;

  try {
    const response = await fetch(request);
    if (response.ok) {
      const cache = await caches.open(cacheName);
      cache.put(request, response.clone());
    }
    return response;
  } catch (err) {
    // Fallback silencioso
    return new Response('', { status: 408, statusText: 'Offline' });
  }
}

// ===================================
// PUSH NOTIFICATIONS
// ===================================
self.addEventListener('push', event => {
  let data = { title: 'Arachiz', body: 'Tienes una nueva notificación' };
  
  if (event.data) {
    try {
      data = event.data.json();
    } catch (e) {
      data.body = event.data.text();
    }
  }

  const options = {
    body: data.body,
    icon: data.icon || '/mi-logo.png',
    badge: '/mi-logo-white.png',
    data: data.url || '/',
    vibrate: [100, 50, 100],
    actions: data.actions || [],
    tag: data.tag || 'arachiz-notification',
    renotify: true
  };

  event.waitUntil(
    self.registration.showNotification(data.title, options)
  );
});

self.addEventListener('notificationclick', event => {
  event.notification.close();
  const urlToOpen = event.notification.data || '/';
  
  event.waitUntil(
    clients.matchAll({ type: 'window', includeUncontrolled: true }).then(windowClients => {
      for (let client of windowClients) {
        if (client.url.includes(urlToOpen) && 'focus' in client) {
          return client.focus();
        }
      }
      if (clients.openWindow) {
        return clients.openWindow(urlToOpen);
      }
    })
  );
});

// ===================================
// BACKGROUND SYNC (para cuando vuelva la conexión)
// ===================================
self.addEventListener('sync', event => {
  if (event.tag === 'sync-attendance') {
    event.waitUntil(syncPendingAttendance());
  }
});

async function syncPendingAttendance() {
  // Futuro: sincronizar asistencias registradas offline
  // Por ahora es un placeholder para la infraestructura
  console.log('[SW] Background sync triggered');
}
