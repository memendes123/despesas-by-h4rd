/* ===========================================================
   SERVICE-WORKER.JS — V12 FINAL (CORRIGIDO PARA GITHUB PAGES)
   PWA seguro para app com Supabase (sem cache de dados dinâmicos)
=========================================================== */

const CACHE_NAME = "despesas-v12";

/*  
    ⚠ IMPORTANTE PARA GITHUB PAGES:
    Tudo deve ser relativo (sem / no início).
*/
const FILES_TO_CACHE = [
    "./",
    "./index.html",
    "./ui.css",
    "./app.js",
    "./auth.js",
    "./db.js",
    "./dashboard.js",
    "./debitos.js",
    "./metas.js",
    "./admin.js",
    "./manifest.json"
];

/* ===========================================================
   INSTALAÇÃO — Apenas ficheiros estáticos
=========================================================== */
self.addEventListener("install", event => {
    event.waitUntil(
        caches.open(CACHE_NAME).then(cache => cache.addAll(FILES_TO_CACHE))
    );
    self.skipWaiting();
});

/* ===========================================================
   ATIVAR — Remover caches antigos
=========================================================== */
self.addEventListener("activate", event => {
    event.waitUntil(
        caches.keys().then(keys => {
            return Promise.all(
                keys
                    .filter(key => key !== CACHE_NAME)
                    .map(oldKey => caches.delete(oldKey))
            );
        })
    );
    self.clients.claim();
});

/* ===========================================================
   FETCH
   - Supabase → nunca cachear
   - Ficheiros estáticos → cache fallback
=========================================================== */
self.addEventListener("fetch", event => {

    const url = new URL(event.request.url);

    // ⚠ Evitar cache de chamadas dinâmicas do Supabase
    if (url.hostname.includes("supabase.co")) {
        return; 
    }

    // ⚠ Evitar cache de resultados JSON / APIs (caso existam)
    if (event.request.headers.get("accept")?.includes("application/json")) {
        return fetch(event.request);
    }

    event.respondWith(
        fetch(event.request)
            .then(response => response)
            .catch(() => caches.match(event.request))
    );
});
