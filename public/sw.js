// In development mode, network-first to ensure live CSS and chunks are never stale
const CACHE_NAME = "plotlyx-v2";

self.addEventListener("install", (event) => {
  self.skipWaiting();
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches
      .keys()
      .then((keys) =>
        Promise.all(keys.map((key) => caches.delete(key)))
      )
      .then(() => self.clients.claim())
  );
});

self.addEventListener("fetch", (event) => {
  // Pass-through to network for dev HMR, chunks, and API
  if (
    event.request.method !== "GET" ||
    event.request.url.includes("/_next/") ||
    event.request.url.includes("/api/")
  ) {
    return;
  }

  event.respondWith(
    fetch(event.request).catch(() => caches.match(event.request))
  );
});
