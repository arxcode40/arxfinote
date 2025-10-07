const CACHE = "arx-finote-v1";
const FILES = [
    "/arxfinote/",
    "/arxfinote/index.html",
    "/arxfinote/index.min.css",
    "/arxfinote/index.min.js",
    "/arxfinote/manifest.json",
    "/arxfinote/icon-192.png",
    "/arxfinote/icon-512.png",
    "https://cdn.jsdelivr.net/npm/bootstrap/dist/css/bootstrap.min.css",
    "https://cdn.jsdelivr.net/npm/bootstrap-icons/font/bootstrap-icons.min.css",
    "https://cdn.jsdelivr.net/npm/aos/dist/aos.min.css",
    "https://cdn.jsdelivr.net/npm/bootstrap/dist/js/bootstrap.bundle.min.js",
    "https://cdn.jsdelivr.net/npm/aos/dist/aos.min.js",
    "https://cdn.jsdelivr.net/npm/alpinejs/dist/cdn.min.js",
    "https://cdn.jsdelivr.net/npm/@alpinejs/mask/dist/cdn.min.js",
    "https://cdn.jsdelivr.net/npm/idb/build/umd.min.js",
    "https://cdn.jsdelivr.net/npm/dayjs/dayjs.min.js",
    "https://cdn.jsdelivr.net/npm/dayjs/locale/id.js",
    "https://cdn.jsdelivr.net/npm/downloadjs/download.min.js",
];

self.addEventListener("install", (e) => {
    e.waitUntil(caches.open(CACHE).then((cache) => cache.addAll(FILES)));
});

self.addEventListener("fetch", (e) => {
    e.respondWith(
        caches.match(e.request).then((res) => res || fetch(e.request))
    );
});
