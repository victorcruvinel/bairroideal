// Bairro Ideal · service worker: guarda o app no aparelho para abrir sem internet.
// O /sw.js é montado pelo Worker com a versão do deploy (self.VERSAO); versão nova = cache novo.
const CACHE = 'bairroideal-' + (self.VERSAO || 'dev');
const ESSENCIAIS = ['/', '/index.html', '/css/app.css', '/js/app.js', '/js/protecao.js', '/js/abertura.js', '/js/dados.js', '/js/ui.js', '/js/motor.js', '/js/pecas.js',
  '/js/modelos.js', '/js/termometro.js', '/js/telas/comum.js', '/js/telas/inicio.js', '/js/telas/editor.js', '/js/telas/historia.js', '/js/telas/comparar.js',
  '/js/telas/passeio.js', '/js/telas/privacidade.js', '/js/telas/entrar.js', '/js/telas/pessoas.js', '/vendor/three.module.min.js', '/img/icone.svg', '/manifest.webmanifest'];

self.addEventListener('install', (e) => { e.waitUntil(caches.open(CACHE).then((c) => c.addAll(ESSENCIAIS)).then(() => self.skipWaiting())); });
self.addEventListener('activate', (e) => {
  e.waitUntil(caches.keys().then((ks) => Promise.all(ks.filter((k) => k.startsWith('bairroideal-') && k !== CACHE).map((k) => caches.delete(k)))).then(() => self.clients.claim()));
});
self.addEventListener('fetch', (e) => {
  const req = e.request; if (req.method !== 'GET') return;
  const url = new URL(req.url);
  if (url.pathname === '/api' || url.pathname === '/versao.json' || url.pathname === '/sw.js') return; // sempre da internet
  // fontes do Google: guarda depois da 1ª vez
  if (url.hostname.endsWith('googleapis.com') || url.hostname.endsWith('gstatic.com')) {
    e.respondWith(caches.open(CACHE + '-fontes').then(async (c) => { const r = await c.match(req); if (r) return r; try { const n = await fetch(req); if (n.ok || n.type === 'opaque') c.put(req, n.clone()); return n; } catch { return new Response('', { status: 504 }); } }));
    return;
  }
  if (url.origin !== location.origin) return;
  // páginas: o app é uma página só
  if (req.mode === 'navigate') { e.respondWith(caches.match('/index.html').then((r) => r || fetch(req))); return; }
  e.respondWith(caches.match(req).then((r) => r || fetch(req).then((n) => { if (n.ok) { const cp = n.clone(); caches.open(CACHE).then((c) => c.put(req, cp)); } return n; })));
});
