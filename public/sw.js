/* NurtureTrack service worker: makes the site and tracker work offline.
   Pages: network first, fall back to the cached copy.
   Build assets (/_astro/) and images: cache first.
   VERSION and ASSETS are filled in at build time (see astro.config.mjs), so every
   deploy installs a fresh worker and clears the old cache. */
const VERSION = 'nt-dev';
const ASSETS = [];
const BASE = '/nursing-tracker-public/';
const LOCALES = ['zh-hant', 'zh-hans', 'ja'];
const APP_PAGES = [`${BASE}app/`, ...LOCALES.map(locale => `${BASE}${locale}/app/`)];
const PRECACHE = [BASE, ...APP_PAGES, `${BASE}favicon.svg`, `${BASE}manifest.webmanifest`, ...ASSETS];

self.addEventListener('install', event => {
  event.waitUntil(caches.open(VERSION).then(cache => cache.addAll(PRECACHE)).then(() => self.skipWaiting()));
});

self.addEventListener('activate', event => {
  event.waitUntil(
    caches.keys()
      .then(keys => Promise.all(keys.filter(key => key !== VERSION).map(key => caches.delete(key))))
      .then(() => self.clients.claim())
  );
});

/** Save a copy of a good response. The copy must be made before the page reads the body. */
const remember = (event, request, response) => {
  if (!response || !response.ok || response.type !== 'basic') return;
  const copy = response.clone();
  event.waitUntil(caches.open(VERSION).then(cache => cache.put(request, copy)).catch(() => {}));
};

/** Offline page for a path: the tracker in the same language. */
const offlineFallback = pathname => {
  const locale = LOCALES.find(code => pathname.startsWith(`${BASE}${code}/`));
  return caches.match(locale ? `${BASE}${locale}/app/` : `${BASE}app/`).then(cached => cached || caches.match(`${BASE}app/`));
};

self.addEventListener('fetch', event => {
  const request = event.request;
  const url = new URL(request.url);
  if (request.method !== 'GET' || url.origin !== self.location.origin || !url.pathname.startsWith(BASE)) return;

  const isAsset = url.pathname.includes('/_astro/') || /\.(png|svg|woff2?)$/.test(url.pathname);
  if (isAsset) {
    event.respondWith(
      caches.match(request).then(cached => cached || fetch(request).then(response => {
        remember(event, request, response);
        return response;
      }))
    );
    return;
  }

  const isPage = request.mode === 'navigate' || (request.headers.get('accept') || '').includes('text/html');
  event.respondWith(
    fetch(request)
      .then(response => {
        remember(event, request, response);
        return response;
      })
      .catch(() => caches.match(request, { ignoreSearch: true }).then(cached => cached || (isPage ? offlineFallback(url.pathname) : Response.error())))
  );
});
