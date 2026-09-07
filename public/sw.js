importScripts("/controller/controller.sw.js");

self.addEventListener("activate", (event) => {
  event.waitUntil(self.clients.claim());
});

async function handleRequest(event) {
  if ($scramjetController.shouldRoute(event)) {
    return $scramjetController.route(event);
  }
  return fetch(event.request);
}

self.addEventListener("fetch", (event) => {
  event.respondWith(handleRequest(event));
});
