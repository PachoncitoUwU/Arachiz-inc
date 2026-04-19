const CACHE_NAME = 'arachiz-cache-v1';
const urlsToCache = [
  '/',
  '/index.html',
  '/manifest.json',
  '/mi-logo.png',
  '/ArachizLogoPNG.png'
];

self.addEventListener('install', event => {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then(cache => {
        return cache.addAll(urlsToCache);
      })
  );
});

self.addEventListener('fetch', event => {
  event.respondWith(
    caches.match(event.request)
      .then(response => {
        if (response) {
          return response; // Cache hit
        }
        return fetch(event.request);
      })
  );
});
