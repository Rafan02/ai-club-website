/* ==========================================================================
   AI CLUB — Service Worker
   Caches static assets for offline/repeat-visit speed. Never caches the
   live AI assistant calls (Netlify function / old Vercel API route) or any
   non-GET request — those must always hit the network.
   Bump CACHE_VERSION whenever you change core static files so visitors get
   the new versions instead of a stale cached copy.
   ========================================================================== */

const CACHE_VERSION = "v2";
const CACHE_NAME = "aiclub-" + CACHE_VERSION;

const PRECACHE_URLS = [
  "/",
  "/index.html",
  "/css/style.css",
  "/js/data.js",
  "/js/main.js",
  "/js/particles.js",
  "/js/cursor.js",
  "/js/sphere.js",
  "/assets/logo.png",
  "/assets/logo-favicon.png",
  "/manifest.json"
];

// Never cache or intercept these — always go straight to the network.
function isBypassed(url){
  return (
    url.pathname.startsWith("/.netlify/functions/") ||
    url.pathname.startsWith("/api/") ||
    url.pathname.startsWith("/admin")
  );
}

self.addEventListener("install", (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then((cache) => cache.addAll(PRECACHE_URLS))
      .then(() => self.skipWaiting())
  );
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches.keys().then((names) =>
      Promise.all(
        names
          .filter((name) => name !== CACHE_NAME)
          .map((name) => caches.delete(name))
      )
    ).then(() => self.clients.claim())
  );
});

self.addEventListener("fetch", (event) => {
  const req = event.request;
  const url = new URL(req.url);

  // Only handle same-origin GET requests; let everything else (API calls,
  // POSTs, cross-origin) pass straight through untouched.
  if (req.method !== "GET" || url.origin !== self.location.origin || isBypassed(url)){
    return;
  }

  // Stale-while-revalidate: serve from cache instantly if we have it, but
  // always fetch a fresh copy in the background to keep the cache current.
  event.respondWith(
    caches.match(req).then((cached) => {
      const fetchPromise = fetch(req)
        .then((networkRes) => {
          if (networkRes && networkRes.status === 200){
            const copy = networkRes.clone();
            caches.open(CACHE_NAME).then((cache) => cache.put(req, copy));
          }
          return networkRes;
        })
        .catch(() => cached); // offline — fall back to cache if we have it

      return cached || fetchPromise;
    })
  );
});
