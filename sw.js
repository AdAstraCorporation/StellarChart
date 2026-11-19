// Service worker del menú y de la Carta Estelar (las credenciales tienen el suyo en credenciales/sw.js).
// Red primero: con conexión se usa lo publicado y se refresca la copia; sin conexión, la copia guardada.
const VERSION = "dev";
const CACHE = `carta-astral-${VERSION}`;
const ARCHIVOS = ["./", "index.html", "manifest.webmanifest", "carta/", "carta/index.html", "icons/favicon.png", "icons/icon-192.png", "icons/icon-512.png"];
self.addEventListener("install", (e) => { e.waitUntil(caches.open(CACHE).then((c) => c.addAll(ARCHIVOS)).then(() => self.skipWaiting())); });
self.addEventListener("activate", (e) => { e.waitUntil(caches.keys().then((ks) => Promise.all(ks.filter((k) => k.startsWith("carta-astral-") && k !== CACHE).map((k) => caches.delete(k)))).then(() => self.clients.claim())); });
self.addEventListener("fetch", (e) => {
  const u = new URL(e.request.url);
  if (e.request.method !== "GET" || u.origin !== location.origin || u.pathname.includes("/credenciales/")) return;
  e.respondWith(fetch(e.request).then((r) => { if (r.ok) { const copia = r.clone(); caches.open(CACHE).then((c) => c.put(e.request, copia)); } return r; }).catch(() => caches.match(e.request, { ignoreSearch: true })));
});
