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
