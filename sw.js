/* ==========================================================================
   AI CLUB — Service Worker
   Caches static assets for offline/repeat-visit speed. Never caches the
   live AI assistant calls (Netlify function / old Vercel API route) or any
   non-GET request — those must always hit the network.
   Bump CACHE_VERSION whenever you change core static files so visitors get
   the new versions instead of a stale cached copy.
   ========================================================================== */

const CACHE_VERSION = "v6";
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

  // Network-first: always try to get the live version. cache: "reload"
  // forces this past the browser's own HTTP disk cache too — not just our
  // Cache Storage layer above — so a stale conditionally-cached response
  // can't slip through either. Only fall back to Cache Storage if the
  // request actually fails (visitor is offline); it exists purely as an
  // offline safety net, never as the default serving path.
  event.respondWith(
    fetch(req, { cache: "reload" })
      .then((networkRes) => {
        if (networkRes && networkRes.status === 200){
          const copy = networkRes.clone();
          caches.open(CACHE_NAME).then((cache) => cache.put(req, copy));
        }
        return networkRes;
      })
      .catch(() => caches.match(req))
  );
});
