/* ===========================================================
   SERVICE-WORKER.JS — V10 FINAL
   PWA seguro para app com Supabase (sem cache de dados)
=========================================================== */

const CACHE_NAME = "despesas-v10";
const FILES_TO_CACHE = [
    "/", 
    "/index.html",
    "/ui.css",
    "/app.js",
    "/auth.js",
    "/db.js",
    "/dashboard.js",
    "/debitos.js",
    "/metas.js",
    "/admin.js",
    "/manifest.json"
];

/* ===========================================================
   INSTALAÇÃO — Guarda apenas ficheiros estáticos
=========================================================== */
self.addEventListener("install", event => {
    event.waitUntil(
        caches.open(CACHE_NAME).then(cache => {
            return cache.addAll(FILES_TO_CACHE);
        })
    );
    self.skipWaiting();
});

/* ===========================================================
   ATIVAR — Limpa caches antigos
=========================================================== */
self.addEventListener("activate", event => {
    event.waitUntil(
        caches.keys().then(keys => {
            return Promise.all(
                keys.map(key => {
                    if (key !== CACHE_NAME) {
                        return caches.delete(key);
                    }
                })
            );
        })
    );
    self.clients.claim();
});

/* ===========================================================
   FETCH — 
   1) Tenta rede primeiro (para Supabase funcionar sempre)
   2) Se falhar, usa cache estático local
=========================================================== */
self.addEventListener("fetch", event => {

    const url = new URL(event.request.url);

    // nunca cachear chamadas ao Supabase (importante!)
    if (url.hostname.includes("supabase.co")) {
        return; 
    }

    event.respondWith(
        fetch(event.request)
            .then(response => response)
            .catch(() => caches.match(event.request))
    );
});
