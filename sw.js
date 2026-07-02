// sw.js — service worker : cache offline de l'app statique.
// Pattern (vérifié à jour, relais 2026-07-01 — MDN/web.dev) :
//   - précache du shell à l'install ;
//   - cache versionné, anciennes versions purgées à l'activation ;
//   - fetch en stale-while-revalidate (on sert le cache tout de suite, on
//     rafraîchit en arrière-plan).
//
// Mise à jour EXPLICITE (bandeau « Recharger », cf. ui.js) : à l'install on NE
// fait PLUS skipWaiting() — un nouveau SW reste donc en attente (« waiting »)
// tant que la page ne lui envoie pas le message SKIP_WAITING. C'est ce qui
// permet à l'UI de prévenir l'utilisateur avant de basculer, au lieu d'un
// changement silencieux qui n'apparaît qu'au 2e rechargement.
//
// ⚠️ CONVENTION : **bumper CACHE_VERSION à chaque déploiement** qu'on veut
// signaler. Le navigateur ne détecte une nouvelle version QUE si sw.js change
// d'octets — ce bump est donc le déclencheur du bandeau (et re-précache le shell).

const CACHE_VERSION = 'tama-v2';

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
  // Pas de skipWaiting() ici : le nouveau SW attend le feu vert de la page.
  // (À la toute première install — aucun SW actif — il s'active quand même
  //  immédiatement : l'état « waiting » n'existe que s'il y a un SW à remplacer.)
  event.waitUntil(
    caches.open(CACHE_VERSION).then((cache) => cache.addAll(PRECACHE))
  );
});

// La page (ui.js) demande la bascule quand l'utilisateur clique « Recharger ».
self.addEventListener('message', (event) => {
  if (event.data && event.data.type === 'SKIP_WAITING') self.skipWaiting();
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
