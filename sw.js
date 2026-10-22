/* NurtureTrack service worker: makes the site and tracker work offline.
   Pages: network first, fall back to the cached copy.
   Build assets (/_astro/) and images: cache first.
   VERSION and ASSETS are filled in at build time (see astro.config.mjs), so every
   deploy installs a fresh worker and clears the old cache. */
const VERSION = 'nt-38b32c0d4637';
const ASSETS = ["/nursing-tracker-public/_astro/AppRoot.SjIJGwMZ.js","/nursing-tracker-public/_astro/AppRoot.fwLowSIg.js","/nursing-tracker-public/_astro/AppRoot.rcdwUWK3.css","/nursing-tracker-public/_astro/FormulaCalculator.DxuCdSJs.js","/nursing-tracker-public/_astro/GrowthCalculator.lnCmhQXt.js","/nursing-tracker-public/_astro/Health.DmlrzEcC.js","/nursing-tracker-public/_astro/LineChart.SMGwob7u.js","/nursing-tracker-public/_astro/Trends.DUDKcuor.js","/nursing-tracker-public/_astro/client.CMYRkaU9.js","/nursing-tracker-public/_astro/en.B-EAl5dN.js","/nursing-tracker-public/_astro/en.C1N4K7pf.js","/nursing-tracker-public/_astro/index.4e3w-3EH.css","/nursing-tracker-public/_astro/index.C04HNRlV.js","/nursing-tracker-public/_astro/index.bH_rUlI6.js","/nursing-tracker-public/_astro/ja.B4rvbHJX.js","/nursing-tracker-public/_astro/ja.CzdvSGnE.js","/nursing-tracker-public/_astro/percentile.NZ5X2_NW.js","/nursing-tracker-public/_astro/utils.BVFadLqp.js","/nursing-tracker-public/_astro/who.BeM7ob7y.js","/nursing-tracker-public/_astro/zh-hans.MaUA0F0P.js","/nursing-tracker-public/_astro/zh-hans.P5bYDqrK.js","/nursing-tracker-public/_astro/zh-hant.CAf6gcLU.js","/nursing-tracker-public/_astro/zh-hant.v7utXzJu.js"];
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
