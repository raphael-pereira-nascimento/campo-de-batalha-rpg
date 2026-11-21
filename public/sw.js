// v10: invalida o cache da v9 para distribuir a revisão de interface de 21/11:
// rótulos dinâmicos de `poder` (golpe/cura vs. aumento de dano), elemento mágico
// Sangue no catálogo de combate e tabela Base/BR/BC/Final na ficha.
const CACHE = 'cbrpg-v10';
const PRECACHE = ['./', './index.html', './manifest.json', './icon-192.png', './icon-512.png'];

self.addEventListener('install', (e) => {
  e.waitUntil(caches.open(CACHE).then((c) => c.addAll(PRECACHE)));
  self.skipWaiting();
});

self.addEventListener('activate', (e) => {
  e.waitUntil(
    caches.keys().then((keys) => Promise.all(keys.filter((k) => k !== CACHE).map((k) => caches.delete(k)))),
  );
  self.clients.claim();
});

// Network-first com fallback ao cache — o site funciona offline no segundo acesso.
// Regra de ouro: respostas com erro (4xx/5xx) e HTML em URL de asset NUNCA vão
// para o cache, para não "envenenar" o navegador com uma versão quebrada.
self.addEventListener('fetch', (e) => {
  const req = e.request;
  if (req.method !== 'GET') return;
  const isNavigate = req.mode === 'navigate';
  e.respondWith(
    fetch(req)
      .then((res) => {
        if (res.ok && res.type === 'basic') {
          const ct = res.headers.get('content-type') || '';
          // Só guarda HTML se for uma navegação de página (a própria "casca").
          if (isNavigate || !/^text\/html/.test(ct)) {
            const clone = res.clone();
            caches.open(CACHE).then((c) => c.put(req, clone));
          }
        }
        return res;
      })
      .catch(() => caches.match(req)),
  );
});