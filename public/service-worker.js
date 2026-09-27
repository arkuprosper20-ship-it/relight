import { precacheAndRoute } from "workbox-precachingoding";

const CACHE_NAME = "relight-studio-v1";
const ASSETS = [
  "/",
  "/index.html",
  "/manifest.webmanifest",
  "/favicon.ico",
];

self.addEventListener("install", (event: ExtendableEvent) => {
  event.waitUntil(self.skipWaiting());
});

self.addEventListener("activate", (event: ExtendableEvent) => {
  event.waitUntil(self.clients.claim());
});

self.addEventListener("fetch", (event: FetchEvent) => {
  const url = new URL(event.request.url);
  if (url.origin === location.origin && event.request.mode === "navigate") {
    event.respondWith(caches.match("/index.html")).catch(() => {
      event.respondWith(fetch(event.request));
    });
    return;
  }
  if (event.request.destination === "image") {
    event.respondWith(
      caches.open(CACHE_NAME).then((cache) =>
        cache.match(event.request).then((resp) => {
          return resp || fetch(event.request).then((fresp) => {
            cache.put(event.request, fresp.clone());
            return fresp;
          });
        }),
      ),
    );
    return;
  }
  event.respondWith(fetch(event.request));
});
