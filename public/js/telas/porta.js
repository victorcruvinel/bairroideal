// Bairro Ideal · porta de entrada (depois da abertura): entrar com a conta ou visitar a exposição
import { el } from '../ui.js';
import { estado, virarVisitante, editarLocal } from '../dados.js';
import { indexar, desenhar, enquadrar } from '../motor.js';
import { bairroIdeal, bairroCarente } from '../modelos.js';

export function montar(app) {
  app.classList.add('app--cheio');
  const t = el(`<div class="porta">
    <canvas></canvas>
    <div class="porta-cx">
      <div class="porta-logo"><img src="/img/icone.svg" alt="" width="72" height="72"><div><h1>Bairro Ideal</h1><p class="porta-por">por Elaine Freitas Muniz</p><p>Maquetes de bairros em 3D</p></div></div>
      <div class="porta-op">
        <button class="porta-bt porta-bt--visita" data-p="visitar"><span class="em">👀</span><b>Visitar a exposição</b><small>Veja os bairros em 3D, na planta, passeie por dentro e assista às histórias. Não precisa de conta.</small><i>Entrar como visitante ›</i></button>
        <button class="porta-bt porta-bt--conta" data-p="entrar"><span class="em">🔑</span><b>Entrar com a conta</b><small>Para quem cria: montar e editar maquetes, escrever as histórias e organizar a exposição.</small><i>${estado.nuvem ? 'Entrar com código no e-mail ›' : 'Criar e editar ›'}</i></button>
      </div>
      <p class="porta-rod">Bairro Ideal · por Elaine Freitas Muniz · <a href="#/privacidade">Privacidade e cookies</a></p>
    </div></div>`);
  app.append(t);
  // dois bairros de fundo, um de cada lado (ideal × carente)
  const cv = t.querySelector('canvas'), A = indexar(bairroIdeal()), B = indexar(bairroCarente());
  const pintar = () => {
    const d = Math.min(2, devicePixelRatio || 1), W = innerWidth, H = innerHeight; cv.width = W * d; cv.height = H * d; const ctx = cv.getContext('2d'); ctx.setTransform(d, 0, 0, d, 0, 0);
    if (W < 760) { const topo = Math.min(150, H * .19), alt = H * .43 - topo; ctx.save(); ctx.translate(0, topo); desenhar(ctx, A, enquadrar(A, W, alt, 0, false, .95), W, alt, {}); ctx.restore(); return; }
    const w = W * .42, h = H * .6;
    ctx.save(); ctx.translate(-w * .12, H - h * .92); desenhar(ctx, A, enquadrar(A, w, h, 0, false, .95), w, h, {}); ctx.restore();
    ctx.save(); ctx.translate(W - w * .88, H - h * .92); desenhar(ctx, B, enquadrar(B, w, h, 1, false, .95), w, h, {}); ctx.restore();
  };
  requestAnimationFrame(pintar); addEventListener('resize', pintar);
  t.addEventListener('click', (e) => {
    const p = e.target.closest('[data-p]')?.dataset.p; if (!p) return;
    if (p === 'visitar') { virarVisitante(); location.hash = '#/'; }
    if (p === 'entrar') { if (estado.nuvem) location.hash = '#/entrar'; else { editarLocal(); location.hash = '#/'; } }
  });
  return { sair: () => removeEventListener('resize', pintar) };
}
