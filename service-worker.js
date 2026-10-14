
const CACHE_NAME = "our-family-v2";

const FILES_TO_CACHE = [
  "./",
  "./index.html",
  "./manifest.json"
];

self.addEventListener("install", event => {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then(cache => cache.addAll(FILES_TO_CACHE))
  );

  self.skipWaiting();
});

self.addEventListener("activate", event => {
  event.waitUntil(
    caches.keys().then(keys =>
      Promise.all(
        keys
          .filter(key => key !== CACHE_NAME)
          .map(key => caches.delete(key))
      )
    )
  );

  event.waitUntil(self.clients.claim());
});

// Keep the existing network-first caching behavior.
self.addEventListener("fetch", event => {
  if (event.request.method !== "GET") return;

  event.respondWith(
    fetch(event.request)
      .catch(() => caches.match(event.request))
  );
});

// Display notifications received from the push service.
self.addEventListener("push", event => {
  let payload = {};

  try {
    if (event.data) {
      payload = event.data.json();
    }
  } catch {
    payload = {
      title: "Our Family 🩷",
      body: event.data ? event.data.text() : "A new family update is available."
    };
  }

  const title = payload.title || "Our Family 🩷";

  const options = {
    body: payload.body || "A new family update has been shared.",
    icon: "./Design%20ohne%20Titel%20(1).png",
    badge: "./Design%20ohne%20Titel%20(1).png",
    data: {
      url: payload.url || "./"
    },
    tag: "family-update",
    renotify: false
  };

  event.waitUntil(
    self.registration.showNotification(title, options)
  );
});

// Open Family Journal when the notification is tapped.
self.addEventListener("notificationclick", event => {
  event.notification.close();

  const targetUrl = new URL(
    event.notification.data?.url || "./",
    self.location.origin
  );

  // Only allow links to this site's origin.
  if (targetUrl.origin !== self.location.origin) return;

  event.waitUntil(
    self.clients.matchAll({
      type: "window",
      includeUncontrolled: true
    }).then(async clients => {
      for (const client of clients) {
        if ("focus" in client) {
          if ("navigate" in client) {
            await client.navigate(targetUrl.href);
          }
          return client.focus();
        }
      }

      return self.clients.openWindow(targetUrl.href);
    })
  );
});
