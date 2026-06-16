/**
 * Minimal service worker — cache the app shell + data files for offline use.
 * Strategy: stale-while-revalidate for data, cache-first for app shell.
 */
const VERSION = "v1";
const SHELL_CACHE = `gegt-shell-${VERSION}`;
const DATA_CACHE = `gegt-data-${VERSION}`;
const SHELL_URLS = [
  "/",
  "/index.html",
  "/manifest.webmanifest",
  "/world-map.svg",
];
const DATA_URLS = [
  "/countries-core.json",
  "/countries-detail.json",
  "/wb-data.json",
  "/og-data.json",
];

self.addEventListener("install", (event) => {
  event.waitUntil(
    caches.open(SHELL_CACHE).then((cache) =>
      cache.addAll(SHELL_URLS).catch(() => {})
    )
  );
  self.skipWaiting();
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(
        keys
          .filter((k) => k !== SHELL_CACHE && k !== DATA_CACHE)
          .map((k) => caches.delete(k))
      )
    )
  );
  self.clients.claim();
});

self.addEventListener("fetch", (event) => {
  const { request } = event;
  if (request.method !== "GET") return;
  const url = new URL(request.url);
  if (url.origin !== self.location.origin) return;

  // Stale-while-revalidate for JSON data.
  if (DATA_URLS.some((path) => url.pathname.endsWith(path))) {
    event.respondWith(
      caches.open(DATA_CACHE).then(async (cache) => {
        const cached = await cache.match(request);
        const network = fetch(request)
          .then((resp) => {
            if (resp.ok) cache.put(request, resp.clone());
            return resp;
          })
          .catch(() => cached);
        return cached || network;
      })
    );
    return;
  }

  // Cache-first for app shell.
  if (SHELL_URLS.some((p) => url.pathname === p || url.pathname.endsWith(p))) {
    event.respondWith(
      caches.match(request).then((cached) => cached || fetch(request))
    );
  }
});
