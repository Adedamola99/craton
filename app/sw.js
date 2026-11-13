/* Craton service worker: precache the app shell, cache fonts on first use.
   When you change any file, bump CACHE (craton-v2, v3...) so installed phones update. */
const CACHE = 'craton-v5';
const SHELL = [
  "./",
  "index.html",
  "manifest.webmanifest",
  "css/tailwind.css",
  "css/craton.css",
  "lib/react.production.min.js",
  "lib/react-dom.production.min.js",
  "lib/htm.umd.js",
  "lib/three.min.js",
  "lib/OrbitControls.js",
  "icons/icon-192.png",
  "icons/icon-512.png",
  "js/01-core.js",
  "js/02-block-engine.js",
  "js/03-ui.js",
  "js/04-block.js",
  "js/05-stereonet.js",
  "js/06-field.js",
  "js/10-atlas-models-a.js",
  "js/11-atlas-models-b.js",
  "js/12-atlas-models-c.js",
  "js/13-atlas-library.js",
  "js/19-nigeria-geo.js",
  "js/20-craton.js",
  "js/25-sync.js",
  "js/26-classroom.js",
  "js/30-app.js"
];
self.addEventListener('install', e => { e.waitUntil(caches.open(CACHE).then(c => c.addAll(SHELL)).then(() => self.skipWaiting())); });
self.addEventListener('activate', e => { e.waitUntil(caches.keys().then(ks => Promise.all(ks.filter(k => k !== CACHE).map(k => caches.delete(k)))).then(() => self.clients.claim())); });
self.addEventListener('fetch', e => {
  const req = e.request; if (req.method !== 'GET') return;
  const url = new URL(req.url);
  if (url.origin === location.origin) {
    e.respondWith(caches.match(req, { ignoreSearch: true }).then(hit => hit || fetch(req).then(res => { const copy = res.clone(); caches.open(CACHE).then(c => c.put(req, copy)); return res; }).catch(() => caches.match('index.html'))));
  } else if (/fonts\.(googleapis|gstatic)\.com$/.test(url.hostname)) {
    e.respondWith(caches.open(CACHE).then(c => c.match(req).then(hit => { const net = fetch(req).then(res => { c.put(req, res.clone()); return res; }).catch(() => hit); return hit || net; })));
  }
});
