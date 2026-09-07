importScripts("/vendor/controller/controller.sw.js");

const BLOCK_HOSTS = [
  "doubleclick.net",
  "googleadservices.com",
  "googlesyndication.com",
  "adservice.google.com",
  "securepubads.g.doubleclick.net"
];

const BLOCK_HINTS = [
  "/pagead/",
  "/adsystem/",
  "/pcs/activeview",
  "/ptracking",
  "googleads.g.doubleclick.net"
];

function decodedRequestText(url) {
  try {
    return decodeURIComponent(url).toLowerCase();
  } catch {
    return String(url).toLowerCase();
  }
}

function shouldBlockAdLikeRequest(request) {
  if (request.destination === "document" || request.destination === "iframe") return false;
  const text = decodedRequestText(request.url);
  return BLOCK_HOSTS.some(h => text.includes(h)) || BLOCK_HINTS.some(h => text.includes(h));
}

self.addEventListener("activate", (event) => {
  event.waitUntil(self.clients.claim());
});

async function handleRequest(event) {
  if (shouldBlockAdLikeRequest(event.request)) {
    return new Response("", {
      status: 204,
      headers: {
        "Cache-Control": "no-store",
        "X-Null-Sec-Shield": "blocked"
      }
    });
  }

  if ($scramjetController.shouldRoute(event)) {
    return $scramjetController.route(event);
  }
  return fetch(event.request);
}

self.addEventListener("fetch", (event) => {
  event.respondWith(handleRequest(event));
});
