/* Null Sec OS Ultraviolet stock service worker wrapper.
   Do not register uv.sw.js directly. It is the UV core worker implementation. */
importScripts('/uv/uv.bundle.js');
importScripts('/uv/uv.config.js');
importScripts(__uv$config.sw || '/uv/uv.sw.js');

const uv = new UVServiceWorker();

self.addEventListener('install', () => self.skipWaiting());
self.addEventListener('activate', event => event.waitUntil(self.clients.claim()));
self.addEventListener('fetch', event => {
  if (uv.route(event)) {
    event.respondWith(uv.fetch(event));
  }
});
