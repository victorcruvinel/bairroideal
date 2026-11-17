// Proteção: sem botão direito, sem copiar/colar, sem atalhos de salvar/imprimir/código-fonte
// e sem zoom de pinça (celular, iPad e trackpad). O zoom continua só pelo menu do navegador.
// Quem entrou com a conta (data-copiar="sim" no <html>) pode copiar, recortar e colar.
// O visitante continua sem copiar nada.
const digitavel = (el) => !!(el && el.closest && el.closest('input, textarea, [contenteditable="true"]'));
const legivel = (el) => !!(el && el.closest && el.closest('.texto, .lousa, .hist-txt, .probs, .dicas, .cmp-tab'));
const liberado = () => document.documentElement.dataset.copiar === 'sim';

document.addEventListener('contextmenu', (e) => { if (liberado() && (digitavel(e.target) || legivel(e.target))) return; e.preventDefault(); });
['copy', 'cut', 'paste'].forEach((t) => document.addEventListener(t, (e) => { if (!liberado()) e.preventDefault(); }));
document.addEventListener('selectstart', (e) => { if (digitavel(e.target) || (liberado() && legivel(e.target))) return; e.preventDefault(); });
document.addEventListener('dragstart', (e) => { if (!e.target.closest || !e.target.closest('[draggable="true"]')) e.preventDefault(); });

document.addEventListener('keydown', (e) => {
  const k = (e.key || '').toLowerCase(), mod = e.metaKey || e.ctrlKey;
  if (k === 'f12' || (mod && (e.shiftKey || e.altKey) && ['i', 'j', 'c', 'u'].includes(k))) { e.preventDefault(); return; }
  if (!mod) return;
  if (['s', 'u', 'p'].includes(k)) { e.preventDefault(); return; }
  if (['c', 'v', 'x'].includes(k)) { if (!liberado()) e.preventDefault(); return; }
  if (k === 'a' && !digitavel(document.activeElement)) e.preventDefault();
}, true);

// pinça: Safari (gesture*), dois dedos na tela e Ctrl + rodinha (é o que a pinça do trackpad manda)
['gesturestart', 'gesturechange', 'gestureend'].forEach((t) => document.addEventListener(t, (e) => e.preventDefault(), { passive: false }));
document.addEventListener('touchmove', (e) => { if (e.touches && e.touches.length > 1) e.preventDefault(); }, { passive: false });
document.addEventListener('wheel', (e) => { if (e.ctrlKey) e.preventDefault(); }, { passive: false });
// toque duplo não dá zoom
let ultimoToque = 0;
document.addEventListener('touchend', (e) => { const t = Date.now(); if (t - ultimoToque < 320 && !digitavel(e.target)) e.preventDefault(); ultimoToque = t; }, { passive: false });
