/* Villa Rudolf portal — service worker (PWA, offline-first) */
// Verzi zvyš při každé změně sw.js – activate smaže staré cache,
// takže hosté se starým katalogem dostanou data hned, ne až na druhé načtení.
const CACHE = 'vr-v2';
const PRECACHE = ['./', './data/trips.json', './data/demo-guest.json'];

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE)
      .then((cache) => cache.addAll(PRECACHE))
      .then(() => self.skipWaiting())
  );
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys()
      .then((keys) => Promise.all(
        keys.filter((k) => k !== CACHE).map((k) => caches.delete(k))
      ))
      .then(() => self.clients.claim())
  );
});

self.addEventListener('fetch', (event) => {
  const req = event.request;

  // Jen GET a jen stejný origin. Cizí origin (supabase.co, api.met.no) neřešíme vůbec.
  if (req.method !== 'GET') return;
  const url = new URL(req.url);
  if (url.origin !== self.location.origin) return;

  // Navigační requesty: network-first s fallbackem na cache (deploy se nezasekne na staré verzi).
  if (req.mode === 'navigate') {
    event.respondWith(
      fetch(req)
        .then((res) => {
          const copy = res.clone();
          caches.open(CACHE).then((c) => c.put(req, copy)).catch(() => {});
          return res;
        })
        .catch(() => caches.match(req).then((m) => m || caches.match('./')))
    );
    return;
  }

  // Data soubory (./data/*): stale-while-revalidate.
  if (url.pathname.includes('/data/')) {
    event.respondWith((async () => {
      const cache = await caches.open(CACHE);
      const cached = await cache.match(req);
      const network = fetch(req).then((res) => {
        if (res.ok) cache.put(req, res.clone()); // 404/500 do cache nepatří
        return res;
      });
      // Bez waitUntil prohlížeč service worker uspí hned po odpovědi z cache
      // a dopsání nové verze se nikdy nedokončí – katalog by pak zůstal navždy starý.
      event.waitUntil(network.catch(() => {}));
      return cached || network;
    })());
    return;
  }

  // Ostatní same-origin GET: cache-first, s dopsáním do cache.
  event.respondWith(
    caches.match(req).then((cached) => {
      if (cached) return cached;
      return fetch(req).then((res) => {
        const copy = res.clone();
        caches.open(CACHE).then((c) => c.put(req, copy)).catch(() => {});
        return res;
      });
    })
  );
});
