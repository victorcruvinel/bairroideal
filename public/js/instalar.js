// Bairro Ideal · convite para instalar o app (toda vez que a pessoa acessa pelo navegador).
// Android/Chrome/Edge: botão que abre o instalador. iPhone/iPad (Safari): passo a passo do "Adicionar à Tela de Início".
import { el, janela } from './ui.js';

let pedido = null; // evento beforeinstallprompt guardado
const instalado = () => matchMedia('(display-mode: standalone)').matches || navigator.standalone === true;
const ehIOS = () => /iPad|iPhone|iPod/.test(navigator.userAgent) || (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1);
export const podeInstalar = () => !instalado() && (!!pedido || ehIOS());

addEventListener('beforeinstallprompt', (e) => { e.preventDefault(); pedido = e; document.dispatchEvent(new Event('bi:instalavel')); });
addEventListener('appinstalled', () => { pedido = null; document.querySelector('.instalar')?.remove(); });

const SETA_IOS = '<svg viewBox="0 0 24 24" width="22" height="22" style="vertical-align:-5px"><path d="M12 3v12M7 8l5-5 5 5" stroke="#1a73e8" stroke-width="2.2" fill="none" stroke-linecap="round"/><path d="M5 11v9h14v-9" stroke="#1a73e8" stroke-width="2.2" fill="none" stroke-linejoin="round"/></svg>';
export async function pedirInstalacao() {
  if (pedido) { pedido.prompt(); const r = await pedido.userChoice.catch(() => null); pedido = null; return r && r.outcome === 'accepted'; }
  if (ehIOS()) {
    await janela({ titulo: '📲 Instalar no iPhone / iPad', corpo: `<ol class="passos-ios">
      <li><span>1</span><div>No Safari, toque no botão <b>Compartilhar</b> ${SETA_IOS} (embaixo no iPhone, em cima no iPad).</div></li>
      <li><span>2</span><div>Role a lista e toque em <b>Adicionar à Tela de Início</b> ➕</div></li>
      <li><span>3</span><div>Toque em <b>Adicionar</b>. Pronto! O Bairro Ideal vira um app na sua tela 🏘️</div></li></ol>
      <p style="font-size:13px">Precisa ser pelo <b>Safari</b>. No Chrome do iPhone, abra este site no Safari antes.</p>`, botoes: [{ texto: 'Entendi 👍', classe: 'bt--sol', valor: true }] });
  }
  return false;
}

function mostrar() {
  if (!podeInstalar() || document.querySelector('.instalar')) return;
  try { if (sessionStorage.getItem('bi:instalar-visto')) return; sessionStorage.setItem('bi:instalar-visto', '1'); } catch { /* */ }
  const c = el(`<div class="instalar" role="dialog" aria-label="Instalar o app"><img src="/img/icone-192.png" alt="" width="54" height="54">
    <div><b>Instale o Bairro Ideal</b><small>Abre mais rápido, em tela cheia e funciona até sem internet.</small></div>
    <div class="instalar-b"><button class="bt bt--leve" data-i="nao">Agora não</button><button class="bt bt--sol" data-i="sim">📲 ${pedido ? 'Instalar' : 'Como instalar'}</button></div></div>`);
  c.addEventListener('click', async (e) => { const a = e.target.closest('[data-i]')?.dataset.i; if (!a) return; c.classList.add('sai'); setTimeout(() => c.remove(), 300); if (a === 'sim') pedirInstalacao(); });
  document.body.append(c);
}
// espera o aviso de cookies sumir e aparece só na porta de entrada ou na tela inicial
export function iniciarInstalar() {
  if (instalado()) return;
  const tentar = () => {
    if (document.querySelector('.cookies') || document.querySelector('.carregando') || document.querySelector('.janela-fundo')) return setTimeout(tentar, 1200);
    if (!/^#?\/?$|^#\/porta$/.test(location.hash)) return setTimeout(tentar, 1500);
    mostrar();
  };
  setTimeout(tentar, 1800);
  document.addEventListener('bi:instalavel', () => setTimeout(tentar, 800));
}
