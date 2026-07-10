const CACHE_NAME = "time-since-v2";
const STATIC_ASSETS = ["/icon.svg"];

self.addEventListener("install", (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => cache.addAll(STATIC_ASSETS)),
  );
  self.skipWaiting();
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches
      .keys()
      .then((keys) =>
        Promise.all(
          keys
            .filter((key) => key !== CACHE_NAME)
            .map((key) => caches.delete(key)),
        ),
      ),
  );
  self.clients.claim();
});

self.addEventListener("fetch", (event) => {
  if (event.request.method !== "GET") return;

  // Never intercept navigations — caching redirected HTML causes ERR_FAILED.
  if (event.request.mode === "navigate") return;

  const url = new URL(event.request.url);
  if (url.origin !== self.location.origin) return;

  // Network-first for API calls
  if (url.pathname.startsWith("/api/")) {
    event.respondWith(
      fetch(event.request).catch(() =>
        caches.match(event.request).then(
          (r) =>
            r ||
            new Response('{"error":"Offline"}', {
              status: 503,
              headers: { "Content-Type": "application/json" },
            }),
        ),
      ),
    );
    return;
  }

  // Cache-first only for same-origin static assets we explicitly manage
  if (STATIC_ASSETS.includes(url.pathname)) {
    event.respondWith(
      caches.match(event.request).then(
        (cached) =>
          cached ||
          fetch(event.request).then((response) => {
            if (response.ok) {
              const clone = response.clone();
              caches
                .open(CACHE_NAME)
                .then((cache) => cache.put(event.request, clone));
            }
            return response;
          }),
      ),
    );
  }
});

// Push notification handler
self.addEventListener("push", (event) => {
  const data = event.data?.json() || {
    title: "Time Since",
    body: "You have a milestone notification!",
  };

  event.waitUntil(
    self.registration.showNotification(data.title, {
      body: data.body,
      icon: "/icon.svg",
      badge: "/icon.svg",
      tag: data.tag || "timer-notification",
    }),
  );
});

self.addEventListener("notificationclick", (event) => {
  event.notification.close();
  event.waitUntil(
    self.clients.matchAll({ type: "window" }).then((clients) => {
      if (clients.length > 0) {
        return clients[0].focus();
      }
      return self.clients.openWindow("/");
    }),
  );
});
