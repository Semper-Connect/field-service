/* Caches the app to open it offline, and sends waiting reports in the
 * background where Background Sync exists (Chrome/Android). */
/* eslint-disable no-restricted-globals */
const VERSION = "{{VERSION}}";
// Filled in by controllers/app.py.
const ASSETS = "{{ASSETS}}";
const PRECACHE = "{{PRECACHE}}";
const CACHE = `technician-app-${VERSION}`;
const CACHE_PREFIX = "technician-app-";
const ODOO_ICONS = "/web/static/src/libs/fontawesome/";
// Network first, cache when offline.
const SHELL = ["/technician/", "/technician/manifest.webmanifest"];

// The store, in its load order: same list in index.html.
const STORE = [
    "db",
    "rpc",
    "jobs",
    "colleagues",
    "days",
    "catalog",
    "outbox",
    "entries",
    "drafts",
    "timer",
    "route",
    "reports",
    "index",
];

importScripts(...STORE.map((name) => `${ASSETS}/js/store/${name}.js`));

self.addEventListener("install", (event) => {
    const urls = [
        ...SHELL,
        ...PRECACHE,
        `${ODOO_ICONS}css/font-awesome.css`,
        `${ODOO_ICONS}fonts/fontawesome-webfont.woff2?v=4.7.0`,
    ];
    event.waitUntil(
        caches
            .open(CACHE)
            .then((cache) => cache.addAll(urls.map((url) => new Request(url, { cache: "reload" }))))
            .then(() => self.skipWaiting())
    );
});

self.addEventListener("activate", (event) => {
    event.waitUntil(
        caches
            .keys()
            .then((keys) =>
                Promise.all(
                    keys
                        .filter((k) => k.startsWith(CACHE_PREFIX) && k !== CACHE)
                        .map((k) => caches.delete(k))
                )
            )
            .then(() => self.clients.claim())
    );
});

async function networkFirst(request, cacheKey) {
    const cache = await caches.open(CACHE);
    try {
        const response = await fetch(request);
        if (response.ok) {
            cache.put(cacheKey, response.clone());
        }
        return response;
    } catch (error) {
        const cached = await cache.match(cacheKey);
        if (cached) {
            return cached;
        }
        throw error;
    }
}

async function cacheFirst(request) {
    const cached = await caches.match(request);
    if (cached) {
        return cached;
    }
    const response = await fetch(request);
    if (response.ok) {
        const cache = await caches.open(CACHE);
        cache.put(request, response.clone());
    }
    return response;
}

self.addEventListener("fetch", (event) => {
    const request = event.request;
    const url = new URL(request.url);
    if (request.method !== "GET" || url.origin !== self.location.origin) {
        return; // API calls go straight to the network
    }
    const shell = url.pathname === "/technician" ? "/technician/" : url.pathname;
    if (SHELL.includes(shell)) {
        event.respondWith(networkFirst(request, shell));
    } else if (
        url.pathname.startsWith("/technician/assets/") ||
        url.pathname.startsWith(ODOO_ICONS)
    ) {
        event.respondWith(cacheFirst(request));
    }
});

self.addEventListener("sync", (event) => {
    if (event.tag === "tech-outbox") {
        // Rejecting tells the browser to retry this sync later.
        event.waitUntil(
            self.TechStore.syncOutbox().then((summary) => {
                if (summary.offline && summary.remaining) {
                    throw new Error("Still offline, retry later");
                }
            })
        );
    }
});
