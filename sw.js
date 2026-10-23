// Network-first service worker: always fresh when online, fully playable offline at the gate.
const CACHE = "gate-games-v9";
// Everything the game needs to run offline. Add new modules here.
const ASSETS = [
  "./", "./index.html", "./manifest.webmanifest", "./icon.svg", "./css/styles.css",
  "./js/main.js", "./js/util.js", "./js/save.js", "./js/audio.js", "./js/economy.js", "./js/state.js",
  "./js/shell.js", "./js/generator.js", "./js/packing.js", "./js/boarding-logic.js", "./js/custom-bag.js",
  "./js/builder.js", "./js/data/trivia-rounds.js",
  "./js/modes/pack.js", "./js/modes/trivia.js", "./js/modes/boarding.js", "./js/progress.js",
  "./js/art.js", "./js/theme.js", "./js/data/airports.js"
];

self.addEventListener("install", (event) => {
  event.waitUntil(caches.open(CACHE).then((cache) => cache.addAll(ASSETS)));
  self.skipWaiting();
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches.keys().then((keys) => Promise.all(keys.filter((k) => k !== CACHE).map((k) => caches.delete(k))))
  );
  self.clients.claim();
});

self.addEventListener("fetch", (event) => {
  if (event.request.method !== "GET") return;
  event.respondWith(
    fetch(event.request)
      .then((response) => {
        // Only cache good same-origin responses, so a 404 or server error never replaces a working copy
        if (response.ok && response.type === "basic") {
          const copy = response.clone();
          caches.open(CACHE).then((cache) => cache.put(event.request, copy));
        }
        return response;
      })
      .catch(() => caches.match(event.request).then((hit) => hit || caches.match("./index.html")))
  );
});
