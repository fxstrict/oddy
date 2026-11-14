// Service worker: offline-first. Build injects VERSION and PRECACHE (see scripts/build.mjs).
// In dev (placeholders still present) it uses network-first so edits show immediately.
const VERSION = '__VERSION__';
const PRECACHE = /*__PRECACHE__*/[];
const DEV = VERSION.startsWith('__');
const CACHE = `kq-${VERSION}`;

self.addEventListener('install', (event) => {
  // A new version waits until the player taps "Update" in the game (it then sends SKIP_WAITING).
  // In dev there is nothing to ask, so take over immediately.
  event.waitUntil(
    caches.open(CACHE).then((cache) => cache.addAll(PRECACHE)).then(() => (DEV ? self.skipWaiting() : undefined)),
  );
});

self.addEventListener('message', (event) => {
  if (event.data && event.data.type === 'SKIP_WAITING') self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches
      .keys()
      .then((keys) => Promise.all(keys.filter((k) => k.startsWith('kq-') && k !== CACHE).map((k) => caches.delete(k))))
      .then(() => self.clients.claim()),
  );
});

self.addEventListener('fetch', (event) => {
  const { request } = event;
  if (request.method !== 'GET') return;
  const url = new URL(request.url);
  if (url.origin !== self.location.origin) return;
  // version.json must always come from the network (it is how the game learns a new version exists).
  if (url.pathname.endsWith('/version.json')) return;

  if (DEV) {
    event.respondWith(fetch(request).catch(() => caches.match(request)));
    return;
  }

  event.respondWith(
    caches.match(request, { ignoreSearch: true }).then((hit) => {
      if (hit) return hit;
      return fetch(request)
        .then((res) => {
          if (res.ok) {
            const copy = res.clone();
            caches.open(CACHE).then((c) => c.put(request, copy));
          }
          return res;
        })
        .catch(() => (request.mode === 'navigate' ? caches.match('index.html') : Response.error()));
    }),
  );
});
