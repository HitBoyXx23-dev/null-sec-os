importScripts("/vendor/controller/controller.sw.js");

async function handleRequest(event) {
  if ($scramjetController.shouldRoute(event)) {
    return $scramjetController.route(event);
  }
  return fetch(event.request);
}

self.addEventListener("install", () => {
  self.skipWaiting();
});

self.addEventListener("activate", (event) => {
  event.waitUntil(self.clients.claim());
});

self.addEventListener("fetch", (event) => {
  event.respondWith(handleRequest(event));
});
