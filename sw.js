// Service worker: deja la app disponible sin conexión.
// Con internet busca siempre la versión más nueva; sin internet (o si tarda mucho) usa la copia guardada.
const V = 'finanzas-v8';
const FILES = ['./', './index.html', './styles.css', './app.js', './manifest.webmanifest',
  './icon-192.png', './icon-512.png', './apple-touch-icon.png'];

self.addEventListener('install', e => {
  e.waitUntil(caches.open(V).then(c => c.addAll(FILES.map(u => new Request(u, { cache: 'reload' })))).then(() => self.skipWaiting()));
});

self.addEventListener('activate', e => {
  e.waitUntil(
    caches.keys()
      .then(ks => Promise.all(ks.filter(k => k !== V).map(k => caches.delete(k))))
      .then(() => self.clients.claim())
  );
});

self.addEventListener('fetch', e => {
  if (e.request.method !== 'GET' || new URL(e.request.url).origin !== location.origin) return;
  e.respondWith((async () => {
    const c = await caches.open(V);
    const hit = await c.match(e.request, { ignoreSearch: true });
    const net = fetch(e.request, { cache: 'no-cache' }).then(r => { if (r.ok) c.put(e.request, r.clone()); return r; });
    net.catch(() => { });
    if (!hit) return net;
    return Promise.race([net, new Promise(res => setTimeout(() => res(hit), 3500))]).catch(() => hit);
  })());
});
