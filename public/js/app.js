// Bairro Ideal · começo de tudo: abertura, dados, rotas (#/...) e atualização do app.
import { abertura } from './abertura.js';
import { iniciar, precisaPorta, estado, aoMudar, virarVisitante } from './dados.js';
import { cookies } from './telas/privacidade.js';
import { aviso, carregando } from './ui.js';
import { iniciarAtualizacoes, aoAtualizar } from './atualizar.js';
import { iniciarInstalar } from './instalar.js';

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
  const NOMES = { 'editor.js': 'Abrindo a maquete…', 'passeio.js': 'Montando o bairro em 3D…', 'historia.js': 'Preparando a história…', 'comparar.js': 'Juntando os dois bairros…' };
  const c = carregando('Carregando…');
  try {
    const mod = await rota[1]();
    const nome = Object.keys(NOMES).find((n) => String(rota[1]).includes(n)); if (nome) c.texto(NOMES[nome]);
    atual = (await mod.montar(app, params.slice(1))) || null;
  } catch (e) {
    console.error(e);
    app.innerHTML = `<div class="tela" style="display:grid;place-items:center;text-align:center"><div><div style="font-size:54px">🚧</div><h2>Ops! Algo deu errado.</h2><p style="color:var(--tinta2);font-weight:700;margin:8px 0 16px">${String(e && e.message || e)}</p><a class="bt bt--sol" href="#/">Voltar ao início</a></div></div>`;
  } finally { c.fechar(); }
}
addEventListener('hashchange', rotear);
addEventListener('beforeunload', (e) => { if (atual && atual.temMudancas && atual.temMudancas()) { e.preventDefault(); e.returnValue = ''; } });

aoMudar((ev) => {
  if (ev.tipo === 'sessao') { aviso('Sua sessão terminou. Entre de novo.', 'erro'); location.hash = '#/entrar'; }
  if (ev.tipo === 'offline') aviso('Sem internet: tudo continua sendo salvo no aparelho 📦');
  if (ev.tipo === 'online') aviso('Internet de volta! Enviando o que ficou pendente ☁️');
});

// atualização forçada (service worker por versão + conferência a cada minuto). Antes de recarregar, salva a maquete aberta.
iniciarAtualizacoes();
// na atualização não dá para perguntar: o editor guarda um rascunho, que aparece quando a maquete abrir de novo
aoAtualizar(async () => { if (atual && atual.temMudancas && atual.temMudancas()) { if (atual.guardarRascunho) atual.guardarRascunho(); else if (atual.perguntarSaida) await atual.perguntarSaida(); } });

await Promise.all([abertura(), iniciar()]);
// link compartilhado /v/ID: abre a maquete (quem não entrou vira visitante)
const linkV = location.pathname.match(/^\/v\/([\w-]{4,40})\/?$/);
if (linkV) { if (precisaPorta()) virarVisitante(); history.replaceState(null, '', '/#/m/' + linkV[1]); }
document.documentElement.dataset.armazenamento = estado.nuvem ? 'nuvem' : 'local';
rotear();
cookies();
iniciarInstalar();
