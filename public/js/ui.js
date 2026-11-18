// Bairro Ideal · ajudantes de tela (montar HTML, avisos, janelas)
import { lapis, caixaGirada, K } from './motor.js';
import { OBJETOS, desenharChao, sombra } from './pecas.js';
export const $ = (s, el = document) => el.querySelector(s);
export const $$ = (s, el = document) => [...el.querySelectorAll(s)];
export const esc = (s) => String(s ?? '').replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
export function el(html) { const t = document.createElement('template'); t.innerHTML = html.trim(); return t.content.firstElementChild; }

let avisos;
export function aviso(texto, tipo = 'ok', ms = 2600) {
  if (!avisos) { avisos = el('<div class="avisos" aria-live="polite"></div>'); document.body.append(avisos); }
  const a = el(`<div class="aviso aviso--${tipo}">${texto}</div>`); avisos.append(a);
  while (avisos.children.length > 3) avisos.firstElementChild.remove();
  setTimeout(() => { a.classList.add('sai'); setTimeout(() => a.remove(), 400); }, ms);
}

// balãozinho que sobe de um ponto da tela (+5 natureza)
export function balao(x, y, texto, cor = '#1f6f50') {
  const b = el(`<div class="balao-pt" style="left:${x}px;top:${y}px;--c:${cor}">${texto}</div>`); document.body.append(b); setTimeout(() => b.remove(), 1700);
}

// janela (modal). botoes: [{texto, classe, valor}] -> Promise com o valor escolhido
export function janela({ titulo = '', corpo = '', botoes = [{ texto: 'OK', classe: 'bt--sol', valor: true }], classe = '', fechar = true, aoAbrir } = {}) {
  return new Promise((ok) => {
    const fundo = el(`<div class="janela-fundo"><div class="janela ${classe}" role="dialog" aria-modal="true">
      ${fechar ? '<button class="janela-x" aria-label="Fechar">✕</button>' : ''}
      ${titulo ? `<h2 class="janela-t">${titulo}</h2>` : ''}<div class="janela-c"></div>
      <div class="janela-b">${botoes.map((b, i) => `<button class="bt ${b.classe || ''}" data-i="${i}">${b.texto}</button>`).join('')}</div></div></div>`);
    const c = fundo.querySelector('.janela-c'); if (typeof corpo === 'string') c.innerHTML = corpo; else c.append(corpo);
    const sair = (v) => { fundo.classList.add('sai'); document.removeEventListener('keydown', tecla); setTimeout(() => fundo.remove(), 200); ok(v); };
    const tecla = (e) => { if (e.key === 'Escape' && fechar) sair(null); };
    fundo.addEventListener('click', (e) => { const b = e.target.closest('[data-i]'); if (b) { const bt = botoes[+b.dataset.i]; sair(typeof bt.valor === 'function' ? bt.valor(fundo) : bt.valor); } else if (fechar && (e.target === fundo || e.target.closest('.janela-x'))) sair(null); });
    document.addEventListener('keydown', tecla); document.body.append(fundo);
    requestAnimationFrame(() => fundo.classList.add('on')); aoAbrir && aoAbrir(fundo, sair);
  });
}
export const confirmar = (titulo, texto, sim = 'Sim', classe = 'bt--perigo') => janela({ titulo, corpo: `<p>${texto}</p>`, botoes: [{ texto: 'Cancelar', valor: false }, { texto: sim, classe, valor: true }] });

export function confete(x = innerWidth / 2, y = innerHeight / 3) {
  const cores = ['#ffc93c', '#ff7a59', '#52b788', '#4cc9f0', '#9b8afb', '#ff6fa5'];
  for (let i = 0; i < 40; i++) {
    const p = el(`<i class="confete" style="left:${x}px;top:${y}px;background:${cores[i % 6]};--dx:${(Math.random() - .5) * 520}px;--dy:${-Math.random() * 260 - 60}px;--r:${Math.random() * 720}deg"></i>`);
    document.body.append(p); setTimeout(() => p.remove(), 1600);
  }
}
export const dataBonita = (iso) => {
  if (!iso) return ''; const d = new Date(iso), h = new Date(); const dias = Math.floor((new Date(h.toDateString()) - new Date(d.toDateString())) / 864e5);
  if (dias === 0) return 'hoje, ' + d.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' }); if (dias === 1) return 'ontem';
  if (dias < 7) return `há ${dias} dias`; return d.toLocaleDateString('pt-BR');
};
export const num = (n) => Number(n || 0).toLocaleString('pt-BR');

// ------------------------------------------------ carregando (bonito e responsivo)
// Uma mini-maquete de verdade (as mesmas peças do jogo) se montando sozinha: o chão sobe, as peças caem
// quicando e, a cada volta, aparece um bairrinho diferente. Só aparece se demorar mais que 150 ms, para não piscar.
// Uso: const c = carregando('Abrindo…'); ... c.fechar();
const DICAS = ['Dica: use 📐 Terreno e as setas ＋ para aumentar o bairro.', 'Dica: a 📏 régua mede a distância entre dois pontos com Pitágoras.',
  'Dica: no 🚶 passeio dá para pular e voar!', 'Dica: 🌙 o modo noite mostra quais ruas têm iluminação.', 'Dica: ⚖️ compare o bairro ideal com o carente lado a lado.',
  'Dica: ✨ a história automática cria os capítulos sozinha.', 'Dica: cada quadradinho mede 10 m × 10 m = 100 m².', 'Dica: arraste no 📐 Terreno para fazer um bairro em L.'];
const CENAS = [ // 3 × 3 quadradinhos; a coluna do meio é rua
  { chao: { '1,0': 'rua', '1,1': 'rua', '1,2': 'rua', '2,2': 'flores' }, objs: [['casa', 0, 0, 0], ['arvore', 2, 0], ['predinho', 0, 2, 1], ['ipe-amarelo', 2, 1], ['carro', 1, 1, 2]] },
  { chao: { '1,0': 'rua', '1,1': 'rua', '1,2': 'rua', '0,2': 'calcada' }, objs: [['sobrado', 0, 0, 3], ['ipe-rosa', 2, 0], ['parquinho', 2, 2], ['familia', 0, 2, 2], ['onibus', 1, 1]] },
  { chao: { '1,0': 'rua', '1,1': 'rua', '1,2': 'rua', '2,1': 'flores' }, objs: [['loja', 0, 0, 1], ['pinheiro', 2, 0], ['casa', 0, 2, 4], ['fonte', 2, 2], ['bicicleta', 1, 1]] },
];
const suave = (t) => 1 - Math.pow(1 - t, 3);
const quicar = (t) => { const n = 7.5625, d = 2.75; if (t < 1 / d) return n * t * t; if (t < 2 / d) return n * (t -= 1.5 / d) * t + .75; if (t < 2.5 / d) return n * (t -= 2.25 / d) * t + .9375; return n * (t -= 2.625 / d) * t + .984375; };
const entre = (v) => Math.max(0, Math.min(1, v));
function animarObra(cv) {
  const ctx = cv.getContext('2d'), CW = 220, CH = 170, d = Math.min(2, devicePixelRatio || 1);
  cv.width = CW * d; cv.height = CH * d; ctx.setTransform(d, 0, 0, d, 0, 0);
  const calma = matchMedia('(prefers-reduced-motion: reduce)').matches, T = 3.6, t0 = performance.now();
  let raf = 0, vivo = true;
  const cenas = CENAS.map((c) => {
    const chao = new Map(); for (let x = 0; x < 3; x++) for (let y = 0; y < 3; y++) chao.set(K(x, y), c.chao[x + ',' + y] || 'grama');
    const objs = c.objs.filter(([t]) => OBJETOS[t]).map(([t, x, y, cor = 0], i) => { const o = { t, x, y, c: cor, r: 0 }; return { o, b: caixaGirada(0, o), i }; })
      .sort((a, b) => (a.b.X + a.b.Y) - (b.b.X + b.b.Y));
    return { chao, objs };
  });
  let n = Math.floor(Math.random() * cenas.length);
  function quadro(agora) {
    if (!vivo) return;
    const total = Math.max(0, (agora - t0) / 1000), volta = Math.floor(total / T), t = calma ? 2.2 : total % T, cena = cenas[(n + volta) % cenas.length];
    ctx.clearRect(0, 0, CW, CH);
    // céu redondinho, sol e nuvem
    const ceu = ctx.createLinearGradient(0, 8, 0, 150); ceu.addColorStop(0, '#bfe9ff'); ceu.addColorStop(1, '#eaf8ff');
    ctx.fillStyle = ceu; ctx.beginPath(); ctx.arc(CW / 2, 86, 78, 0, 7); ctx.fill();
    const sy = 46 + Math.sin(total * 1.3) * 3; ctx.fillStyle = 'rgba(255,201,60,.28)'; ctx.beginPath(); ctx.arc(156, sy, 22, 0, 7); ctx.fill();
    ctx.fillStyle = '#ffc93c'; ctx.beginPath(); ctx.arc(156, sy, 14, 0, 7); ctx.fill();
    const nx = 52 + ((total * 9) % 40) - 20; ctx.fillStyle = 'rgba(255,255,255,.95)';
    [[0, 0, 9], [10, -4, 11], [21, 0, 8]].forEach(([dx, dy, r]) => { ctx.beginPath(); ctx.arc(nx + dx, 44 + dy, r, 0, 7); ctx.fill(); });
    // a ilha some no fim da volta e volta montando outra
    const sai = entre((t - (T - .45)) / .45), boia = Math.sin(total * 2.2) * 2.5, z = .74;
    ctx.save(); ctx.globalAlpha = 1 - sai; ctx.translate(0, boia + sai * 14);
    ctx.fillStyle = 'rgba(43,42,51,.10)'; ctx.beginPath(); ctx.ellipse(CW / 2, 150 - boia, 74 * (1 - sai * .3), 9, 0, 0, 7); ctx.fill();
    const G = lapis(ctx, { x: 1.5, y: 1.5, z, rot: 0 }, CW, CH * 1.36, {});
    const viz = (x, y) => cena.chao.get(K(x, y));
    const tiles = [...cena.chao].map(([k, tp]) => ({ x: Math.floor(k / 100000) - 50000, y: (k % 100000) - 50000, tp })).sort((a, b) => a.x + a.y - (b.x + b.y));
    for (const tl of tiles) {
      const p = entre((t - (tl.x + tl.y) * .07) / .38); if (p <= 0) continue; const e = suave(p);
      ctx.save(); ctx.globalAlpha *= e; ctx.translate(0, (1 - e) * 26);
      if (!viz(tl.x, tl.y + 1)) G.poly([[tl.x, tl.y + 1, 0], [tl.x + 1, tl.y + 1, 0], [tl.x + 1, tl.y + 1, -20], [tl.x, tl.y + 1, -20]], '#b07a48');
      if (!viz(tl.x + 1, tl.y)) G.poly([[tl.x + 1, tl.y, 0], [tl.x + 1, tl.y + 1, 0], [tl.x + 1, tl.y + 1, -20], [tl.x + 1, tl.y, -20]], sombra('#b07a48', -.25));
      desenharChao(G, tl.x, tl.y, tl.tp, tl.x, tl.y, viz, z); ctx.restore();
    }
    for (const it of cena.objs) {
      const p = entre((t - .55 - it.i * .24) / .62); if (p <= 0) continue;
      ctx.save(); ctx.globalAlpha *= entre(p * 2.5); ctx.translate(0, -(1 - quicar(p)) * 55 * z);
      OBJETOS[it.o.t].desenho(G, it.b, it.o); ctx.restore();
    }
    ctx.restore();
    raf = requestAnimationFrame(quadro);
  }
  raf = requestAnimationFrame(quadro);
  return () => { vivo = false; cancelAnimationFrame(raf); };
}
let carregadorAtivo = null;
export function carregando(texto = 'Carregando…', { atraso = 150 } = {}) {
  if (carregadorAtivo) { carregadorAtivo.texto(texto); carregadorAtivo.n++; return carregadorAtivo; }
  const c = el(`<div class="carregando" role="status" aria-live="polite"><div class="carregando-cx">
    <canvas class="carregando-obra" width="220" height="170" aria-hidden="true"></canvas>
    <b class="carregando-t">${esc(texto)}</b><div class="carregando-pontos" aria-hidden="true"><i></i><i></i><i></i></div>
    <small class="carregando-dica">${DICAS[Math.floor(Math.random() * DICAS.length)]}</small></div></div>`);
  let parar = () => {};
  const timer = setTimeout(() => { document.body.append(c); try { parar = animarObra(c.querySelector('canvas')); } catch { /* sem canvas: fica só o texto */ } requestAnimationFrame(() => c.classList.add('on')); }, atraso);
  const troca = setInterval(() => { const d = c.querySelector('.carregando-dica'); d.classList.add('sai'); setTimeout(() => { d.textContent = DICAS[Math.floor(Math.random() * DICAS.length)]; d.classList.remove('sai'); }, 300); }, 3600);
  const api = {
    n: 1,
    texto(t) { c.querySelector('.carregando-t').textContent = t; },
    fechar() { if (--api.n > 0) return; clearTimeout(timer); clearInterval(troca); carregadorAtivo = null; c.classList.remove('on'); setTimeout(() => { parar(); c.remove(); }, 250); },
  };
  carregadorAtivo = api; return api;
}
export async function comCarregando(texto, promessa) { const c = carregando(texto); try { return await promessa; } finally { c.fechar(); } }
