// sw.js — service worker : cache offline de l'app statique.
// Pattern (vérifié à jour, relais 2026-07-01 — MDN/web.dev) :
//   - précache du shell à l'install ;
//   - cache versionné, anciennes versions purgées à l'activation ;
//   - fetch en stale-while-revalidate (on sert le cache tout de suite, on
//     rafraîchit en arrière-plan) → les mises à jour arrivent au rechargement
//     suivant, sans étape de build ni bump manuel obligatoire.
// Bumper CACHE_VERSION force un re-précache complet (utile si on veut être sûr).

const CACHE_VERSION = 'tama-v1';

const PRECACHE = [
  './',
  './index.html',
  './manifest.webmanifest',
  './src/constants.js',
  './src/tama.js',
  './src/store.js',
  './src/assets.js',
  './src/game.js',
  './src/ui.js',
  './assets/manifest.json',
  './assets/icons/icon-192.png',
  './assets/icons/icon-512.png',
  './assets/icons/icon-maskable-512.png',
];

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_VERSION)
      .then((cache) => cache.addAll(PRECACHE))
      .then(() => self.skipWaiting())
  );
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys()
      .then((keys) => Promise.all(keys.filter((k) => k !== CACHE_VERSION).map((k) => caches.delete(k))))
      .then(() => self.clients.claim())
  );
});

self.addEventListener('fetch', (event) => {
  const { request } = event;
  if (request.method !== 'GET' || new URL(request.url).origin !== self.location.origin) return;

  event.respondWith(
    caches.open(CACHE_VERSION).then(async (cache) => {
      const cached = await cache.match(request);
      const refresh = fetch(request)
        .then((res) => {
          if (res.ok) cache.put(request, res.clone());
          return res;
        })
        .catch(() => cached); // hors-ligne : on reste sur le cache
      return cached ?? refresh;
    })
  );
});
