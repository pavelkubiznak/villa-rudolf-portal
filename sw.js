/* Villa Rudolf portal — service worker (PWA, offline-first)
 * Strategie: navigace network-first (cache pod jedním klíčem './', bez query – ?t= se do cache nedostane),
 * app.js/track.js a forecast.json network-first (nová logika se projeví hned, bez zvednutí CACHE),
 * ostatní ./data/* stale-while-revalidate, zbytek same-origin (fonty, ikony, manifest) cache-first. Do cache jde jen res.ok && res.type === 'basic' – chybové
 * a cizí (opaque) odpovědi se neukládají. */
// Verzi zvyš při každé změně sw.js – activate smaže staré cache,
// takže hosté se starým katalogem dostanou data hned, ne až na druhé načtení.
const CACHE = 'vr-v5';
const PRECACHE = ['./', './app.js', './track.js', './data/trips.json', './data/demo-guest.json'];

// jen úspěšná same-origin odpověď patří do cache (žádné 404/503, žádné opaque)
const cacheable = (res) => res && res.ok && res.type === 'basic';

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

  // Jen GET a jen stejný origin. Cizí origin (Umami) neřešíme vůbec.
  if (req.method !== 'GET') return;
  const url = new URL(req.url);
  if (url.origin !== self.location.origin) return;

  // Navigační requesty: network-first s fallbackem na cache (deploy se nezasekne na staré verzi).
  // Ukládá se pod klíč './' bez query/hash – jedna kopie stránky, token z URL se nikdy necachuje.
  if (req.mode === 'navigate') {
    event.respondWith(
      fetch(req)
        .then((res) => {
          // přesměrovanou odpověď (GH Pages /x → /x/) Chrome z cache pro navigaci odmítne – neukládat
          if (cacheable(res) && !res.redirected) { const copy = res.clone(); caches.open(CACHE).then((c) => c.put('./', copy)).catch(() => {}); }
          return res;
        })
        .catch(() => caches.match('./').then((m) => m || Response.error()))
    );
    return;
  }

  // Počasí: network-first. Stale-while-revalidate by hostovi, který průvodce otevře jednou denně,
  // vždy ukázal předpověď z minulé návštěvy (soubor se generuje 2× denně). Offline → cache.
  if (url.pathname.endsWith('/data/forecast.json')) {
    event.respondWith(
      fetch(req).then((res) => {
        if (cacheable(res)) { const copy = res.clone(); caches.open(CACHE).then((c) => c.put(req, copy)).catch(() => {}); }
        return res;
      }).catch(() => caches.match(req).then((m) => m || Response.error()))
    );
    return;
  }

  // Ostatní data (./data/*, katalog a demo host): stale-while-revalidate.
  if (url.pathname.includes('/data/')) {
    event.respondWith((async () => {
      const cache = await caches.open(CACHE);
      const cached = await cache.match(req);
      const network = fetch(req).then((res) => {
        if (cacheable(res)) cache.put(req, res.clone()); // 404/500 do cache nepatří
        return res;
      });
      // Bez waitUntil prohlížeč service worker uspí hned po odpovědi z cache
      // a dopsání nové verze se nikdy nedokončí – katalog by pak zůstal navždy starý.
      event.waitUntil(network.catch(() => {}));
      return cached || network;
    })());
    return;
  }

  // app.js / track.js: network-first jako stránka – jinak by host s nainstalovanou PWA dostal nový
  // index.html a starý JS z cache, dokud by někdo nezvedl CACHE. Offline → poslední kopie.
  if (/\/(app|track)\.js$/.test(url.pathname)) {
    event.respondWith(
      fetch(req).then((res) => {
        if (cacheable(res)) { const copy = res.clone(); caches.open(CACHE).then((c) => c.put(req, copy)).catch(() => {}); }
        return res;
      }).catch(() => caches.match(req).then((m) => m || Response.error()))
    );
    return;
  }

  // Ostatní same-origin GET (fonty, ikony, manifest): cache-first, s dopsáním do cache.
  // Pád sítě bez kopie v cache → Response.error() (síťová chyba), ne neošetřená výjimka v respondWith.
  event.respondWith(
    caches.match(req).then((cached) => {
      if (cached) return cached;
      return fetch(req).then((res) => {
        if (cacheable(res)) { const copy = res.clone(); caches.open(CACHE).then((c) => c.put(req, copy)).catch(() => {}); }
        return res;
      }).catch(() => Response.error());
    })
  );
});
