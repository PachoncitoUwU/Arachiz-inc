const CACHE_NAME = 'arachiz-cache-v2'; // Incrementado para forzar actualización
const urlsToCache = [
  '/',
  '/index.html'
  // Removidos archivos que pueden no existir
];

self.addEventListener('install', event => {
  // Forzar activación inmediata
  self.skipWaiting();
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then(cache => {
        return cache.addAll(urlsToCache).catch(err => {
          console.warn('Error caching files:', err);
          return Promise.resolve();
        });
      })
  );
});

self.addEventListener('activate', event => {
  // Limpiar caches antiguos
  event.waitUntil(
    caches.keys().then(cacheNames => {
      return Promise.all(
        cacheNames.map(cacheName => {
          if (cacheName !== CACHE_NAME) {
            return caches.delete(cacheName);
          }
        })
      );
    })
  );
  return self.clients.claim();
});

self.addEventListener('fetch', event => {
  // No cachear peticiones a la API
  if (event.request.url.includes('/api/') || event.request.url.includes('/auth/')) {
    return event.respondWith(fetch(event.request));
  }

  event.respondWith(
    caches.match(event.request)
      .then(response => {
        if (response) {
          return response; // Cache hit
        }
        return fetch(event.request).catch(err => {
          console.warn('Fetch failed:', err);
          // Si falla el fetch, intentar devolver algo del cache
          return caches.match('/index.html');
        });
      })
  );
});
