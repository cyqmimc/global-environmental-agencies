/**
 * Minimal service worker.
 *
 * - Navigation requests (HTML) → network-first with cache fallback.
 *   index.html points to hashed asset URLs, so we can never serve a stale
 *   shell or returning users will load the previous deploy's bundle forever.
 * - JSON data files → stale-while-revalidate (fast offline, refreshes in bg).
 * - Static map SVG → cache-first.
 */
const VERSION = "v2";
const SHELL_CACHE = `gegt-shell-${VERSION}`;
const DATA_CACHE = `gegt-data-${VERSION}`;
const STATIC_ASSETS = ["/world-map.svg", "/manifest.webmanifest"];
const DATA_URLS = [
  "/countries-core.json",
  "/countries-detail.json",
  "/wb-data.json",
  "/og-data.json",
];

self.addEventListener("install", (event) => {
  event.waitUntil(
    caches.open(SHELL_CACHE).then((cache) =>
      cache.addAll(STATIC_ASSETS).catch(() => {})
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

  // Navigation / HTML → network first, fallback to cache. Prevents pinning
  // /index.html to an old hashed-bundle deploy.
  if (request.mode === "navigate" || request.destination === "document") {
    event.respondWith(
      fetch(request)
        .then((resp) => {
          const copy = resp.clone();
          caches.open(SHELL_CACHE).then((c) => c.put(request, copy));
          return resp;
        })
        .catch(() => caches.match(request).then((c) => c || caches.match("/")))
    );
    return;
  }

  // JSON data → stale-while-revalidate.
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

  // Static SVG / manifest → cache-first.
  if (STATIC_ASSETS.some((p) => url.pathname.endsWith(p))) {
    event.respondWith(
      caches.match(request).then((cached) => cached || fetch(request))
    );
  }
});
