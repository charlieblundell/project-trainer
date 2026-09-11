/*
 * Service worker for the installed app.
 *
 * Deliberately tiny. It exists for two reasons: Chrome only shows its install
 * prompt to sites whose service worker handles page loads, and an installed
 * app should show a proper page when there's no signal rather than the
 * browser's own error. It never caches the app, its data or its code, so
 * every deploy reaches people immediately and nothing can go stale.
 */

const CACHE = "trainer-offline-v1";
const OFFLINE_URL = "/offline";

self.addEventListener("install", (event) => {
  event.waitUntil(
    caches.open(CACHE).then((cache) => cache.add(new Request(OFFLINE_URL, { cache: "reload" })))
  );
  self.skipWaiting();
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    (async () => {
      // Navigation preload lets page loads start before the worker has woken
      // up, so having a service worker doesn't make the app slower to open.
      if (self.registration.navigationPreload) {
        await self.registration.navigationPreload.enable();
      }
      const keys = await caches.keys();
      await Promise.all(keys.filter((key) => key !== CACHE).map((key) => caches.delete(key)));
      await self.clients.claim();
    })()
  );
});

self.addEventListener("fetch", (event) => {
  // Only full page loads. Data, API calls and assets go straight to the network.
  if (event.request.mode !== "navigate") return;

  event.respondWith(
    (async () => {
      try {
        const preloaded = await event.preloadResponse;
        if (preloaded) return preloaded;
        return await fetch(event.request);
      } catch {
        const offline = await caches.match(OFFLINE_URL);
        return offline || Response.error();
      }
    })()
  );
});
