const PREFIX = '/uvproxy/';

function decodeTarget(pathname) {
  const raw = pathname.slice(PREFIX.length);
  if (!raw) return null;
  try {
    const b64 = raw.replace(/-/g, '+').replace(/_/g, '/');
    const padded = b64 + '='.repeat((4 - b64.length % 4) % 4);
    return decodeURIComponent(escape(atob(padded)));
  } catch {
    try { return decodeURIComponent(raw); } catch { return null; }
  }
}

self.addEventListener('install', event => self.skipWaiting());
self.addEventListener('activate', event => event.waitUntil(self.clients.claim()));

self.addEventListener('fetch', event => {
  const url = new URL(event.request.url);
  if (url.origin !== self.location.origin || !url.pathname.startsWith(PREFIX)) return;
  const target = decodeTarget(url.pathname);
  if (!target) {
    event.respondWith(new Response('Null Proxy: invalid encoded URL', { status: 400 }));
    return;
  }
  const relay = '/api/proxy?url=' + encodeURIComponent(target);
  event.respondWith(fetch(relay, {
    method: 'GET',
    headers: { 'X-Null-Proxy': 'service-worker' },
    cache: 'no-store'
  }));
});
