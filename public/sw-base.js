// Bairro Ideal · service worker: guarda o app no aparelho para abrir sem internet.
// O /sw.js é montado pelo Worker com a versão do deploy (self.VERSAO). Versão nova = cache novo,
// o service worker novo assume na hora (skipWaiting + claim) e apaga os caches antigos.
const CACHE = 'bairroideal-' + (self.VERSAO || 'dev');
const ESSENCIAIS = ['/', '/css/app.css', '/manifest.webmanifest', '/img/icone.svg', '/img/icone-192.png',
  '/js/app.js', '/js/protecao.js', '/js/abertura.js', '/js/dados.js', '/js/ui.js', '/js/tutorial.js', '/js/motor.js', '/js/pecas.js', '/js/modelos.js', '/js/termometro.js',
  '/js/matematica.js', '/js/atualizar.js', '/js/instalar.js', '/js/compartilhar.js',
  '/js/telas/comum.js', '/js/telas/porta.js', '/js/telas/inicio.js', '/js/telas/editor.js', '/js/telas/historia.js', '/js/telas/comparar.js',
  '/js/telas/passeio.js', '/js/telas/privacidade.js', '/js/telas/entrar.js', '/js/telas/pessoas.js', '/vendor/three.module.min.js', '/vendor/qrcode.js'];

// O Safari recusa resposta "redirecionada" vinda do service worker (o Cloudflare redireciona /index.html -> /).
// Então toda resposta que veio de um redirecionamento vira uma resposta nova e limpa.
async function limpa(r) {
  if (!r || !r.redirected) return r;
  const corpo = await r.blob(); return new Response(corpo, { status: r.status, statusText: r.statusText, headers: r.headers });
}

self.addEventListener('install', (e) => {
  // cache: 'reload' = baixa do servidor, nunca do cache HTTP velho do navegador
  e.waitUntil(caches.open(CACHE).then((c) => Promise.all(ESSENCIAIS.map(async (u) => {
    const r = await fetch(new Request(u, { cache: 'reload' })); if (r.ok) await c.put(u, await limpa(r));
  }))).then(() => self.skipWaiting()));
});
self.addEventListener('activate', (e) => {
  e.waitUntil(caches.keys().then((ks) => Promise.all(ks.filter((k) => k.startsWith('bairroideal-') && k !== CACHE && k !== CACHE + '-fontes').map((k) => caches.delete(k)))).then(() => self.clients.claim()));
});
self.addEventListener('message', (e) => { if (e.data === 'pular-espera') self.skipWaiting(); });
self.addEventListener('fetch', (e) => {
  const req = e.request; if (req.method !== 'GET') return;
  const url = new URL(req.url);
  if (url.pathname === '/api' || url.pathname === '/versao.json' || url.pathname === '/sw.js' || url.pathname.startsWith('/og/')) return; // sempre da internet
  if (url.hostname.endsWith('googleapis.com') || url.hostname.endsWith('gstatic.com')) {
    e.respondWith(caches.open(CACHE + '-fontes').then(async (c) => { const r = await c.match(req); if (r) return r; try { const n = await fetch(req); if (n.ok || n.type === 'opaque') c.put(req, n.clone()); return n; } catch { return new Response('', { status: 504 }); } }));
    return;
  }
  if (url.origin !== location.origin) return;
  // páginas: tenta a internet primeiro (pega sempre a versão nova); sem internet, usa a guardada
  if (req.mode === 'navigate') {
    // não dá para mudar opções de um pedido de navegação: pede de novo só pelo endereço, sem cache
    e.respondWith((async () => {
      try {
        const r = await limpa(await fetch(url.href, { cache: 'no-store', credentials: 'same-origin' }));
        if (r.ok && url.pathname === '/') { const cp = r.clone(); caches.open(CACHE).then((c) => c.put('/', cp)); }
        return r;
      } catch { return (await caches.match('/')) || new Response('Sem internet e o app ainda não foi guardado neste aparelho.', { status: 503, headers: { 'content-type': 'text/plain; charset=utf-8' } }); }
    })());
    return;
  }
  e.respondWith((async () => {
    const r = await caches.match(req, { ignoreSearch: true }); if (r) return limpa(r);
    const n = await limpa(await fetch(url.href, { cache: 'no-cache', credentials: 'same-origin' }));
    if (n.ok) { const cp = n.clone(); caches.open(CACHE).then((c) => c.put(req, cp)); }
    return n;
  })());
});
