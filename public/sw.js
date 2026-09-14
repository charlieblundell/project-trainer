/*
 * Service worker for the installed app: lets it open and run a workout with
 * no signal.
 *
 * - Pages: network first, so a new deploy reaches people as soon as they have
 *   a connection. With none, or a connection too weak to answer within a few
 *   seconds, the copy kept on the phone is shown instead. The main screens are
 *   kept ahead of time, so even one never opened before works offline.
 * - The app's code and styles (/_next/static): kept once fetched. Their names
 *   change every build, so a kept copy is never stale.
 * - Icons, manifest and other files: shown from the phone, refreshed behind.
 * - Never touched: the API, analytics, the sign-in callback (its address
 *   carries one-time codes), other sites, and anything but GET. Personal data
 *   never passes through here; pages are the same for everyone and fill in
 *   on the phone.
 */

const VERSION = "v2";
const PAGES = `trainer-pages-${VERSION}`;
const ASSETS = `trainer-assets-${VERSION}`;
const OFFLINE_URL = "/offline";

/** Every signed-in screen, so any of them opens offline on a fresh install. */
const SHELL = [
  "/home",
  "/train",
  "/train/complete",
  "/plan",
  "/plan/edit",
  "/plan/why",
  "/progress",
  "/coach",
  "/settings",
  "/evidence",
  OFFLINE_URL,
];

/** How long a page load waits on the network before showing the kept copy. */
const NETWORK_PATIENCE_MS = 4000;
/** Kept code and files beyond this are trimmed, oldest first. */
const MAX_ASSETS = 500;
/** How often, at most, the kept screens are refreshed to the current deploy. */
const SHELL_REFRESH_MS = 60 * 60 * 1000;

const NEVER = [/^\/api\//, /^\/ingest(\/|$)/, /^\/auth\//, /^\/sw\.js$/];

let lastShellRefresh = 0;

function isStaticAsset(url) {
  return url.pathname.startsWith("/_next/static/");
}

/** The code and style files a page's HTML names, so they can be kept with it. */
function assetsIn(html) {
  const found = new Set();
  for (const match of html.matchAll(/\/_next\/static\/[^"'\s)\\]+/g)) found.add(match[0]);
  return [...found];
}

async function trimAssets() {
  const cache = await caches.open(ASSETS);
  const keys = await cache.keys();
  const excess = keys.length - MAX_ASSETS;
  for (let i = 0; i < excess; i++) await cache.delete(keys[i]);
}

/** Keeps a fresh copy of a page and everything its HTML loads. */
async function keepPage(path) {
  const response = await fetch(new Request(path, { cache: "reload", credentials: "same-origin" }));
  if (!response.ok || response.redirected) return;
  const pages = await caches.open(PAGES);
  await pages.put(path, response.clone());

  const assets = await caches.open(ASSETS);
  const html = await response.text();
  await Promise.allSettled(
    assetsIn(html).map(async (asset) => {
      if (await assets.match(asset)) {
        // Already kept; move it to the newest end so trimming takes older builds first.
        const kept = await assets.match(asset);
        await assets.delete(asset);
        await assets.put(asset, kept);
        return;
      }
      const res = await fetch(asset);
      if (res.ok) await assets.put(asset, res);
    })
  );
}

async function refreshShell() {
  lastShellRefresh = Date.now();
  await Promise.allSettled(SHELL.map(keepPage));
  await trimAssets();
}

self.addEventListener("install", (event) => {
  event.waitUntil(
    (async () => {
      // The offline page first: whatever else fails, that one has to be there.
      const pages = await caches.open(PAGES);
      await pages.add(new Request(OFFLINE_URL, { cache: "reload" }));
      await refreshShell();
    })()
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
      await Promise.all(keys.filter((key) => key !== PAGES && key !== ASSETS).map((key) => caches.delete(key)));
      await self.clients.claim();
    })()
  );
});

function timeout(ms) {
  return new Promise((resolve) => setTimeout(() => resolve(null), ms));
}

async function handleNavigation(event, url) {
  const path = url.pathname;
  const pages = await caches.open(PAGES);
  const kept = await pages.match(path);

  const network = (async () => {
    const preloaded = await event.preloadResponse;
    const response = preloaded || (await fetch(event.request));
    if (response.ok && !response.redirected && response.type === "basic") {
      await pages.put(path, response.clone());
    }
    return response;
  })();

  // Once online again, bring the kept screens up to the current deploy.
  event.waitUntil(
    network
      .then(() => (Date.now() - lastShellRefresh > SHELL_REFRESH_MS ? refreshShell() : undefined))
      .catch(() => {})
  );

  try {
    // With a kept copy, don't leave someone staring at a blank screen on a weak
    // signal; without one, the network is the only hope, so wait for it.
    const response = kept ? await Promise.race([network, timeout(NETWORK_PATIENCE_MS)]) : await network;
    if (response) return response;
    return kept;
  } catch {
    return kept || (await pages.match(OFFLINE_URL)) || Response.error();
  }
}

async function handleStaticAsset(request) {
  const cache = await caches.open(ASSETS);
  const kept = await cache.match(request);
  if (kept) return kept;
  const response = await fetch(request);
  if (response.ok) {
    await cache.put(request, response.clone());
  }
  return response;
}

async function handleOtherFile(event) {
  const cache = await caches.open(ASSETS);
  const kept = await cache.match(event.request);
  const fresh = fetch(event.request)
    .then(async (response) => {
      if (response.ok && response.type === "basic") await cache.put(event.request, response.clone());
      return response;
    })
    .catch(() => null);
  if (kept) {
    event.waitUntil(fresh);
    return kept;
  }
  return (await fresh) || Response.error();
}

self.addEventListener("fetch", (event) => {
  const { request } = event;
  if (request.method !== "GET") return;

  const url = new URL(request.url);
  if (url.origin !== self.location.origin) return;
  if (NEVER.some((pattern) => pattern.test(url.pathname))) return;

  if (request.mode === "navigate") {
    event.respondWith(handleNavigation(event, url));
    return;
  }
  // In-app navigations fetch page data with an RSC header. Left to the
  // network: offline they fail, the app falls back to a full page load, and
  // that load is answered from the kept copy above.
  if (request.headers.get("RSC")) return;

  if (isStaticAsset(url)) {
    event.respondWith(handleStaticAsset(request));
    return;
  }
  event.respondWith(handleOtherFile(event));
});
