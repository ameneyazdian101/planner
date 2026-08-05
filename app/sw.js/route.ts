// Served from the app router (instead of public/sw.js) so the script's
// content changes on every deploy — the browser only re-installs a service
// worker when its bytes differ, and app code changes alone don't touch a
// static sw.js file.
const BUILD_ID = process.env.VERCEL_GIT_COMMIT_SHA ?? "dev";

function serviceWorkerScript(buildId: string) {
  return `// build: ${buildId}
const CACHE_NAME = "planner-shell-${buildId}";
const OFFLINE_URL = "/offline";
const PRECACHE_URLS = [OFFLINE_URL, "/manifest.webmanifest"];

self.addEventListener("install", (event) => {
  event.waitUntil(caches.open(CACHE_NAME).then((cache) => cache.addAll(PRECACHE_URLS)));
});

// Wait for the page to ask before taking over, instead of skipping the wait
// unconditionally — that would activate mid-session and could drop whatever
// the user was typing when the page reloads to pick up the new version.
self.addEventListener("message", (event) => {
  if (event.data?.type === "SKIP_WAITING") self.skipWaiting();
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches
      .keys()
      .then((keys) => Promise.all(keys.filter((key) => key !== CACHE_NAME).map((key) => caches.delete(key))))
      .then(() => self.clients.claim())
  );
});

self.addEventListener("push", (event) => {
  if (!event.data) return;
  let payload;
  try {
    payload = event.data.json();
  } catch {
    payload = { title: "پلنر", body: event.data.text() };
  }

  event.waitUntil(
    Promise.all([
      self.registration.showNotification(payload.title || "پلنر", {
        body: payload.body,
        icon: "/icon-192.png",
        badge: "/icon-192.png",
        tag: payload.tag || "planner-push",
        data: { url: payload.url || "/dashboard" },
      }),
      self.clients.matchAll({ type: "window", includeUncontrolled: true }).then((clientsList) => {
        for (const client of clientsList) client.postMessage({ type: "reminder-fired" });
      }),
    ])
  );
});

self.addEventListener("notificationclick", (event) => {
  event.notification.close();
  const url = event.notification.data?.url || "/dashboard";

  event.waitUntil(
    self.clients.matchAll({ type: "window", includeUncontrolled: true }).then((clientsList) => {
      for (const client of clientsList) {
        if (client.url.includes(url) && "focus" in client) return client.focus();
      }
      return self.clients.openWindow ? self.clients.openWindow(url) : undefined;
    })
  );
});

self.addEventListener("fetch", (event) => {
  const { request } = event;
  if (request.method !== "GET") return;

  const url = new URL(request.url);
  if (url.origin !== self.location.origin) return;
  if (url.pathname.startsWith("/api/")) return;

  // Navigation requests: network-first, fall back to a generic offline page.
  // We deliberately don't cache the HTML itself, since it's per-user data
  // (tasks/goals/habits) and stale cached HTML could show the wrong content.
  if (request.mode === "navigate") {
    event.respondWith(
      fetch(request).catch(() => caches.match(OFFLINE_URL).then((res) => res ?? Response.error()))
    );
    return;
  }

  // Static assets (hashed, immutable): cache-first.
  // Note: /icon* routes are excluded — they're generated on demand and can
  // change content at the same URL across deploys, unlike hashed _next/static files.
  if (url.pathname.startsWith("/_next/static/")) {
    event.respondWith(
      caches.match(request).then(
        (cached) =>
          cached ??
          fetch(request).then((res) => {
            const copy = res.clone();
            caches.open(CACHE_NAME).then((cache) => cache.put(request, copy));
            return res;
          })
      )
    );
  }
});
`;
}

export function GET() {
  return new Response(serviceWorkerScript(BUILD_ID), {
    headers: {
      "Content-Type": "application/javascript; charset=utf-8",
      "Cache-Control": "no-store",
    },
  });
}
