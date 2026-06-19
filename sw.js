// ════════════════════════════════════════════════════════════════
// SERVICE WORKER — Carnet de Chorale (PWA)
// Stratégie volontairement prudente : ne met en cache QUE les
// ressources de même origine (la page HTML, manifest.json, icônes).
// Les polices Google et tout autre appel externe passent directement
// au réseau, SANS interception, par simplicité et fiabilité.
// ════════════════════════════════════════════════════════════════

const SHELL_CACHE = 'chorale-shell-v1';
const RUNTIME_CACHE = 'chorale-runtime-v1';

// Ressources connues à mettre en cache dès l'installation.
// (Le nom du fichier HTML principal n'est volontairement pas codé en dur
// ici : il sera mis en cache automatiquement à la première navigation
// réussie, via la stratégie "network-first" ci-dessous.)
const STATIC_ASSETS = [
  './manifest.json',
  './icon-192.png',
  './icon-512.png',
];

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(SHELL_CACHE)
      .then((cache) => cache.addAll(STATIC_ASSETS))
      .catch(() => { /* best-effort : ignore si un asset est introuvable */ })
  );
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(
        keys
          .filter((k) => k !== SHELL_CACHE && k !== RUNTIME_CACHE)
          .map((k) => caches.delete(k))
      )
    )
  );
  self.clients.claim();
});

self.addEventListener('fetch', (event) => {
  const req = event.request;
  const url = new URL(req.url);

  // On ne touche qu'aux requêtes GET de même origine. Tout le reste
  // (polices, CDN) continue normalement, sans interception.
  if (req.method !== 'GET' || url.origin !== self.location.origin) return;

  // Navigation (la page de l'application elle-même) : réseau en priorité,
  // avec repli sur le cache si hors-ligne (et mise à jour du cache à chaque
  // chargement réussi, pour que la version hors-ligne reste à jour).
  if (req.mode === 'navigate') {
    event.respondWith(
      fetch(req)
        .then((res) => {
          const copy = res.clone();
          caches.open(RUNTIME_CACHE).then((cache) => cache.put(req, copy));
          return res;
        })
        .catch(() =>
          caches.match(req).then((cached) => cached || caches.match('./'))
        )
    );
    return;
  }

  // Autres ressources de même origine (manifest, icônes) : cache en
  // priorité pour la rapidité, avec repli réseau et mise en cache du résultat.
  event.respondWith(
    caches.match(req).then((cached) => {
      if (cached) return cached;
      return fetch(req)
        .then((res) => {
          if (res && res.status === 200) {
            const copy = res.clone();
            caches.open(RUNTIME_CACHE).then((cache) => cache.put(req, copy));
          }
          return res;
        })
        .catch(() => cached);
    })
  );
});
