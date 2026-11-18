// Bairro Ideal · tutorial (passo a passo): escurece a tela, destaca um botão de cada vez e explica com um balão.
// Aparece sozinho na 1ª vez (cada tutorial uma vez por aparelho) e pode ser aberto de novo pelo botão ❓.
// Uso: tutorial('editor', [{ alvo: '.seletor' | () => elemento, emoji, titulo, texto }], { forcar: true })
import { el } from './ui.js';

const chave = (nome) => 'bi:tutorial-' + nome;
export function jaViu(nome) { try { return localStorage.getItem(chave(nome)) === '1'; } catch { return false; } }
function marcar(nome) { try { localStorage.setItem(chave(nome), '1'); } catch { /* */ } }

let aberto = null;
export function tutorial(nome, passosTodos, { forcar = false } = {}) {
  if (aberto || (!forcar && jaViu(nome))) return Promise.resolve(false);
  const achar = (p) => { if (!p.alvo) return null; const e = typeof p.alvo === 'function' ? p.alvo() : document.querySelector(p.alvo); if (!e) return null; const r = e.getBoundingClientRect(); return r.width && r.height ? e : null; };
  // só os passos cujo botão está na tela agora (no celular alguns botões ficam em outro lugar)
  const passos = passosTodos.filter((p) => !p.alvo || achar(p));
  if (!passos.length) return Promise.resolve(false);
  return new Promise((pronto) => {
    const t = el(`<div class="tut" role="dialog" aria-modal="true" aria-label="Como usar o Bairro Ideal">
      <div class="tut-furo"></div>
      <div class="tut-balao" role="document"><div class="tut-topo"><span class="tut-n"></span><button class="tut-pular" data-t="pular">Pular tutorial ✕</button></div>
        <div class="tut-emoji"></div><h3 class="tut-t"></h3><p class="tut-p"></p>
        <div class="tut-pontos"></div>
        <div class="tut-bts"><button class="bt bt--leve" data-t="voltar">‹ Voltar</button><button class="bt bt--sol" data-t="prox">Próximo ›</button></div></div></div>`);
    document.body.append(t); aberto = t;
    const furo = t.querySelector('.tut-furo'), balao = t.querySelector('.tut-balao');
    let i = 0;
    function mostrar() {
      const p = passos[i], alvo = achar(p);
      t.querySelector('.tut-n').textContent = `${i + 1} de ${passos.length}`;
      t.querySelector('.tut-emoji').textContent = p.emoji || '';
      t.querySelector('.tut-t').textContent = p.titulo;
      t.querySelector('.tut-p').innerHTML = p.texto;
      t.querySelector('.tut-pontos').innerHTML = passos.map((_, k) => `<i class="${k === i ? 'on' : ''}"></i>`).join('');
      t.querySelector('[data-t=voltar]').style.visibility = i ? 'visible' : 'hidden';
      t.querySelector('[data-t=prox]').textContent = i === passos.length - 1 ? 'Começar! 🎉' : 'Próximo ›';
      balao.classList.remove('entra'); void balao.offsetWidth; balao.classList.add('entra');
      posicionar(alvo);
    }
    function posicionar(alvo) {
      const W = innerWidth, H = innerHeight, celular = W <= 600;
      if (!alvo) { furo.classList.add('sem'); t.classList.add('meio'); balao.style.left = ''; balao.style.top = ''; return; }
      furo.classList.remove('sem'); t.classList.remove('meio');
      const r = alvo.getBoundingClientRect(), f = 8;
      Object.assign(furo.style, { left: r.left - f + 'px', top: r.top - f + 'px', width: r.width + f * 2 + 'px', height: r.height + f * 2 + 'px' });
      const bw = balao.offsetWidth, bh = balao.offsetHeight;
      const cabeEmbaixo = r.bottom + f + 14 + bh < H - 8, cabeEmCima = r.top - f - 14 - bh > 8;
      let top = cabeEmbaixo ? r.bottom + f + 14 : cabeEmCima ? r.top - f - 14 - bh : Math.max(8, (H - bh) / 2);
      // do lado, se não couber nem em cima nem embaixo (ex.: barra de ferramentas do lado esquerdo)
      let left = celular ? (W - bw) / 2 : r.left + r.width / 2 - bw / 2;
      if (!cabeEmbaixo && !cabeEmCima && !celular) { left = r.right + f + 14 + bw < W ? r.right + f + 14 : r.left - f - 14 - bw; top = r.top + r.height / 2 - bh / 2; }
      balao.style.left = Math.max(8, Math.min(W - bw - 8, left)) + 'px'; balao.style.top = Math.max(8, Math.min(H - bh - 8, top)) + 'px';
    }
    function fechar(terminou) { marcar(nome); removeEventListener('resize', reposicionar); document.removeEventListener('keydown', tecla, true); t.classList.add('sai'); setTimeout(() => t.remove(), 220); aberto = null; pronto(terminou); }
    const reposicionar = () => posicionar(achar(passos[i]));
    const tecla = (e) => { if (e.key === 'Escape') { e.stopPropagation(); fechar(false); } else if (e.key === 'ArrowRight' || e.key === 'Enter') { e.preventDefault(); e.stopPropagation(); avancar(); } else if (e.key === 'ArrowLeft' && i) { e.stopPropagation(); i--; mostrar(); } };
    const avancar = () => { if (i < passos.length - 1) { i++; mostrar(); } else fechar(true); };
    t.addEventListener('click', (e) => {
      const a = e.target.closest('[data-t]')?.dataset.t; if (!a) return;
      if (a === 'pular') fechar(false); if (a === 'voltar' && i) { i--; mostrar(); } if (a === 'prox') avancar();
    });
    addEventListener('resize', reposicionar); document.addEventListener('keydown', tecla, true);
    requestAnimationFrame(() => { t.classList.add('on'); mostrar(); });
  });
}

// ---------------- os dois tutoriais do app
export const TUTORIAL_INICIO = [
  { emoji: '👋', titulo: 'Bem-vindo(a) ao Bairro Ideal!', texto: 'Aqui você monta <b>maquetes de bairros em 3D</b>, compara o bairro ideal com o bairro carente e conta a história de cada um. Vou mostrar rapidinho como funciona.' },
  { alvo: '#nova2', emoji: '＋', titulo: 'Criar uma maquete', texto: 'Toque em <b>Nova maquete</b>, escreva o nome e escolha como começar: <b>bairro ideal</b>, <b>bairro carente</b>, <b>terreno vazio</b> (só grama) ou <b>uma rua</b>.' },
  { alvo: '#minhas .cartao-m[data-id]', emoji: '🗺️', titulo: 'Suas maquetes', texto: 'Toque numa maquete para <b>abrir e editar</b>. O número colorido é a <b>nota do bairro</b> (de 0 a 10).' },
  { alvo: '#minhas [data-menu]', emoji: '⋯', titulo: 'Mais opções', texto: 'Aqui ficam: <b>apresentar a história</b>, <b>passear dentro</b> em 3D, <b>compartilhar</b> no WhatsApp, <b>duplicar</b>, <b>renomear</b> e <b>apagar</b>.' },
  { alvo: '.heroi a[href="#/comparar"]', emoji: '⚖️', titulo: 'Comparar', texto: 'Coloca <b>dois bairros lado a lado</b>, ótimo para mostrar a diferença entre o ideal e o carente.' },
  { alvo: '#tour2', emoji: '▶', titulo: 'Apresentar todas', texto: 'Modo apresentação: mostra a história de todas as maquetes, uma depois da outra. Perfeito para a sala de aula.' },
  { alvo: '.topo .nuvem-st', emoji: '☁️', titulo: 'Tudo salvo?', texto: 'Aqui aparece <b>Sincronizado</b> quando tudo já está na nuvem, e você abre as mesmas maquetes no celular, no iPad e no computador.' },
  { alvo: '#ajuda2', emoji: '❓', titulo: 'Quer ver de novo?', texto: 'Este passo a passo fica aqui no <b>Como usar</b>. Dentro de uma maquete também tem um ❓ que explica o editor.' },
];
export const TUTORIAL_EDITOR = [
  { emoji: '🧱', titulo: 'Este é o editor', texto: 'É aqui que você monta o bairro. Vou mostrar para que serve cada botão. Leva menos de um minuto!' },
  { alvo: '.ed-f[data-f=tocar]', emoji: '👆', titulo: 'Tocar', texto: 'Para olhar sem mudar nada: <b>arraste</b> para andar pelo mapa, use <b>dois dedos</b> para aproximar e <b>toque numa peça</b> para ver as opções (girar, cor, mover, apagar).' },
  { alvo: '.ed-f[data-f=colocar]', emoji: '✏️', titulo: 'Colocar', texto: 'Escolha uma peça e toque no mapa: ela aparece <b>transparente</b>. Arraste para ajeitar, use 🔄 para girar e toque em <b>✓ Colocar</b>. Se já tiver uma peça no lugar, eu pergunto se é para <b>substituir</b> ou <b>pôr ao lado</b>.<br><small>Chão (grama, rua…): arraste para pintar vários quadradinhos.</small>' },
  { alvo: '.ed-f[data-f=mao]', emoji: '✋', titulo: 'Mover', texto: 'Arraste uma peça para <b>outro lugar</b>.' },
  { alvo: '.ed-f[data-f=apagar]', emoji: '🧽', titulo: 'Apagar', texto: 'Toque numa peça para <b>tirar</b>. No chão pintado, ele volta a ser grama.' },
  { alvo: '.ed-f[data-f=terreno]', emoji: '📐', titulo: 'Terreno', texto: 'Use as <b>setas ＋ e －</b> para aumentar ou diminuir o bairro. Dá até para fazer um terreno em <b>L</b>.' },
  { alvo: '.ed-hist', emoji: '↶', titulo: 'Desfazer e refazer', texto: 'Errou? Toque na seta para <b>desfazer</b>. A outra seta <b>refaz</b>.' },
  { alvo: '.ed-salvo', emoji: '💾', titulo: 'Salvar', texto: 'Quando ficar <b>amarelo</b>, tem mudança para salvar. Se você sair sem salvar, eu pergunto antes (dá para guardar como rascunho).' },
  { alvo: '.ed-modos', emoji: '🧊', titulo: 'Jeitos de ver', texto: '<b>3D</b>, <b>Planta</b> (vista de cima), <b>Passear</b> (andar e voar dentro do bairro), <b>História</b> e <b>Comparar</b>.' },
  { alvo: '.ed-bt-ver', emoji: '👁️', titulo: 'Ver', texto: 'Liga e desliga a <b>grade</b>, a <b>régua</b>, o <b>plano cartesiano</b> e a <b>noite</b>.' },
  { alvo: '.ed-bt-painel', emoji: '📊', titulo: 'Nota do bairro', texto: 'O <b>termômetro</b> mostra o que falta no bairro (escola, saúde, lazer, água…), as <b>metas</b>, a <b>história</b> e a <b>matemática</b>.' },
  { alvo: '[data-a=ajuda]', emoji: '❓', titulo: 'Ajuda', texto: 'Quer ver este passo a passo de novo? É só tocar aqui. Bom trabalho! 🏡' },
];
