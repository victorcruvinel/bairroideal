// Bairro Ideal · começo de tudo: abertura, dados, rotas (#/...) e atualização do app.
import { abertura } from './abertura.js';
import { iniciar, precisaPorta, estado, aoMudar } from './dados.js';
import { cookies } from './telas/privacidade.js';
import { aviso } from './ui.js';

const app = document.getElementById('app');
let atual = null; // { sair, temMudancas }

const ROTAS = [
  [/^#?\/?$/, () => import('./telas/inicio.js')],
  [/^#\/m\/([\w-]+)$/, () => import('./telas/editor.js')],
  [/^#\/m\/([\w-]+)\/passeio$/, () => import('./telas/passeio.js')],
  [/^#\/m\/([\w-]+)\/historia$/, () => import('./telas/historia.js')],
  [/^#\/comparar(?:\/([\w-]+))?(?:\/([\w-]+))?$/, () => import('./telas/comparar.js')],
  [/^#\/pessoas$/, () => import('./telas/pessoas.js')],
  [/^#\/privacidade$/, () => import('./telas/privacidade.js')],
  [/^#\/entrar$/, () => import('./telas/entrar.js')],
  [/^#\/porta$/, () => import('./telas/porta.js')],
];

let ultimoHash = location.hash, voltando = false;
async function rotear() {
  if (voltando) { voltando = false; return; }
  const hash = location.hash || '#/';
  const livres = ['#/entrar', '#/privacidade', '#/porta'];
  if (precisaPorta() && !livres.includes(hash)) { location.replace('#/porta'); return; }
  // visitante não entra em telas de conta
  if (estado.visitante && hash === '#/pessoas') { location.replace('#/'); return; }
  if (atual && atual.temMudancas && atual.temMudancas()) {
    const ok = await atual.perguntarSaida(); if (!ok) { voltando = true; location.hash = ultimoHash; return; }
  }
  ultimoHash = hash;
  // copiar e colar: só para quem entrou com a conta (o visitante não copia)
  document.documentElement.dataset.copiar = !estado.visitante && (estado.nuvem ? !!estado.sessao : estado.editorLocal) ? 'sim' : 'nao';
  const rota = ROTAS.find(([re]) => re.test(hash)) || ROTAS[0];
  const params = hash.match(rota[0]) || [];
  if (atual && atual.sair) try { atual.sair(); } catch { /* */ }
  atual = null; app.innerHTML = ''; app.className = 'app';
  try {
    const mod = await rota[1]();
    atual = (await mod.montar(app, params.slice(1))) || null;
  } catch (e) {
    console.error(e);
    app.innerHTML = `<div class="tela" style="display:grid;place-items:center;text-align:center"><div><div style="font-size:54px">🚧</div><h2>Ops! Algo deu errado.</h2><p style="color:var(--tinta2);font-weight:700;margin:8px 0 16px">${String(e && e.message || e)}</p><a class="bt bt--sol" href="#/">Voltar ao início</a></div></div>`;
  }
}
addEventListener('hashchange', rotear);
addEventListener('beforeunload', (e) => { if (atual && atual.temMudancas && atual.temMudancas()) { e.preventDefault(); e.returnValue = ''; } });

aoMudar((ev) => {
  if (ev.tipo === 'sessao') { aviso('Sua sessão terminou. Entre de novo.', 'erro'); location.hash = '#/entrar'; }
  if (ev.tipo === 'offline') aviso('Sem internet: tudo continua sendo salvo no aparelho 📦');
  if (ev.tipo === 'online') aviso('Internet de volta! Enviando o que ficou pendente ☁️');
});

// service worker: guarda o app para abrir sem internet. Versão nova = recarrega sozinho.
if ('serviceWorker' in navigator && location.hostname !== 'localhost' && location.hostname !== '127.0.0.1') {
  const tinha = !!navigator.serviceWorker.controller; let recarregou = false;
  navigator.serviceWorker.addEventListener('controllerchange', () => { if (tinha && !recarregou && !(atual && atual.temMudancas && atual.temMudancas())) { recarregou = true; location.reload(); } });
  navigator.serviceWorker.register('/sw.js').then((r) => r.update()).catch(() => {});
}

await Promise.all([abertura(), iniciar()]);
document.documentElement.dataset.armazenamento = estado.nuvem ? 'nuvem' : 'local';
rotear();
cookies();
