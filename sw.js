// Service Worker – Promemoria Rifiuti
const CACHE_NAME = 'rifiuti-v1';
const ASSETS = [
  '/',
  '/index.html',
  '/manifest.json',
];

// ── INSTALL: pre-cache static assets ────────────────────────────────────────
self.addEventListener('install', event => {
  event.waitUntil(
    caches.open(CACHE_NAME).then(cache => cache.addAll(ASSETS))
  );
  self.skipWaiting();
});

// ── ACTIVATE: remove old caches ──────────────────────────────────────────────
self.addEventListener('activate', event => {
  event.waitUntil(
    caches.keys().then(keys =>
      Promise.all(keys.filter(k => k !== CACHE_NAME).map(k => caches.delete(k)))
    )
  );
  self.clients.claim();
});

// ── FETCH: serve from cache, fall back to network ────────────────────────────
self.addEventListener('fetch', event => {
  if (event.request.method !== 'GET') return;
  event.respondWith(
    caches.match(event.request).then(cached => cached || fetch(event.request))
  );
});

// ── PUSH notifications (from server, optional) ───────────────────────────────
self.addEventListener('push', event => {
  const data = event.data ? event.data.json() : {};
  const title = data.title || '🗑️ Rifiuti domani!';
  const options = {
    body: data.body || 'Controlla quali rifiuti portare fuori domani.',
    icon: '/icons/icon-192.png',
    badge: '/icons/icon-192.png',
    tag: 'rifiuti-reminder',
    renotify: true,
    actions: [
      { action: 'open', title: 'Apri app' },
      { action: 'dismiss', title: 'Ignora' },
    ],
  };
  event.waitUntil(self.registration.showNotification(title, options));
});

// ── NOTIFICATION CLICK ───────────────────────────────────────────────────────
self.addEventListener('notificationclick', event => {
  event.notification.close();
  if (event.action === 'dismiss') return;
  event.waitUntil(
    clients.matchAll({ type: 'window', includeUncontrolled: true }).then(list => {
      for (const client of list) {
        if (client.url.includes(self.location.origin)) {
          return client.focus();
        }
      }
      return clients.openWindow('/');
    })
  );
});

// ── PERIODIC BACKGROUND SYNC (experimental) ─────────────────────────────────
self.addEventListener('periodicsync', event => {
  if (event.tag === 'rifiuti-daily') {
    event.waitUntil(checkAndNotify());
  }
});

async function checkAndNotify() {
  // Read saved schedule and notif-time from all clients
  const allClients = await clients.matchAll();
  // Fallback: just skip – the main-thread timer handles it
}
