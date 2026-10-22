/* NurtureTrack service worker: makes the site and tracker work offline.
   Pages: network first, fall back to the cached copy.
   Hashed build assets (/_astro/) and images: cache first. */
const VERSION = 'nt-v1';
const BASE = '/nursing-tracker-public/';
const PRECACHE = [BASE, `${BASE}app/`, `${BASE}zh-hant/app/`, `${BASE}zh-hans/app/`, `${BASE}ja/app/`, `${BASE}favicon.svg`, `${BASE}manifest.webmanifest`];

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

self.addEventListener('fetch', event => {
  const request = event.request;
  const url = new URL(request.url);
  if (request.method !== 'GET' || url.origin !== self.location.origin || !url.pathname.startsWith(BASE)) return;

  const isAsset = url.pathname.includes('/_astro/') || /\.(png|svg|webmanifest|woff2?)$/.test(url.pathname);
  if (isAsset) {
    event.respondWith(
      caches.match(request).then(cached => cached || fetch(request).then(response => {
        if (response.ok) caches.open(VERSION).then(cache => cache.put(request, response.clone()));
        return response;
      }))
    );
    return;
  }

  if (request.mode === 'navigate' || request.headers.get('accept')?.includes('text/html')) {
    event.respondWith(
      fetch(request)
        .then(response => {
          if (response.ok) caches.open(VERSION).then(cache => cache.put(request, response.clone()));
          return response;
        })
        .catch(() => caches.match(request).then(cached => cached || caches.match(`${BASE}app/`)))
    );
  }
});
