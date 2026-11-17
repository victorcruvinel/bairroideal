// Bairro Ideal · ajudantes de tela (montar HTML, avisos, janelas)
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
// Só aparece se demorar mais que 150 ms, para não piscar. Uso: const c = carregando('Abrindo…'); ... c.fechar();
const DICAS = ['Dica: use 🪣 o balde para pintar uma área inteira de uma vez.', 'Dica: a 📏 régua mede a distância entre dois pontos com Pitágoras.',
  'Dica: no 🚶 passeio dá para pular e voar!', 'Dica: 🌙 o modo noite mostra quais ruas têm iluminação.', 'Dica: ⚖️ compare o bairro ideal com o carente lado a lado.',
  'Dica: ✨ a história automática cria os capítulos sozinha.', 'Dica: cada quadradinho mede 10 m × 10 m = 100 m².'];
const PECAS_SVG = [
  '<svg viewBox="0 0 40 40"><path d="M20 4 36 13 20 22 4 13z" fill="#ff7a59"/><path d="M4 13v13l16 9V22z" fill="#fff3e0"/><path d="M36 13v13l-16 9V22z" fill="#e8d7bd"/><rect x="9" y="22" width="5" height="8" fill="#7a4b2a" transform="skewY(30) translate(0 -5)"/></svg>',
  '<svg viewBox="0 0 40 40"><rect x="18" y="22" width="4" height="14" fill="#8b5a2b"/><circle cx="20" cy="17" r="13" fill="#52b788"/><circle cx="15" cy="12" r="5" fill="#95d5b2"/></svg>',
  '<svg viewBox="0 0 40 40"><path d="M20 2 32 8 20 14 8 8z" fill="#d6e4ff"/><path d="M8 8v26l12 6V14z" fill="#a9c7ff"/><path d="M32 8v26l-12 6V14z" fill="#7fa6e8"/><g fill="#eaf6ff"><rect x="11" y="15" width="3" height="3"/><rect x="11" y="22" width="3" height="3"/><rect x="11" y="29" width="3" height="3"/></g></svg>',
];
let carregadorAtivo = null;
export function carregando(texto = 'Carregando…', { atraso = 150 } = {}) {
  if (carregadorAtivo) { carregadorAtivo.texto(texto); carregadorAtivo.n++; return carregadorAtivo; }
  const c = el(`<div class="carregando" role="status" aria-live="polite"><div class="carregando-cx">
    <div class="carregando-pecas">${PECAS_SVG.map((s, i) => `<span style="--i:${i}">${s}<i></i></span>`).join('')}</div>
    <div class="carregando-chao"></div><b class="carregando-t">${texto}</b><div class="carregando-barra"><i></i></div>
    <small class="carregando-dica">${DICAS[Math.floor(Math.random() * DICAS.length)]}</small></div></div>`);
  let timer = setTimeout(() => { document.body.append(c); requestAnimationFrame(() => c.classList.add('on')); }, atraso);
  const troca = setInterval(() => { const d = c.querySelector('.carregando-dica'); d.classList.add('sai'); setTimeout(() => { d.textContent = DICAS[Math.floor(Math.random() * DICAS.length)]; d.classList.remove('sai'); }, 300); }, 3200);
  const api = {
    n: 1,
    texto(t) { c.querySelector('.carregando-t').textContent = t; },
    fechar() { if (--api.n > 0) return; clearTimeout(timer); clearInterval(troca); carregadorAtivo = null; c.classList.remove('on'); setTimeout(() => c.remove(), 250); },
  };
  carregadorAtivo = api; return api;
}
export async function comCarregando(texto, promessa) { const c = carregando(texto); try { return await promessa; } finally { c.fechar(); } }
