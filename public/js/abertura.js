// Bairro Ideal · abertura animada (toda vez que o app abre): o chão sobe pedacinho por pedacinho,
// as casas e árvores caem quicando, o sol nasce e o nome aparece letra por letra. Tocar pula.
import { lapis, caixaGirada, K, celMundo, TW, TH } from './motor.js';
import { OBJETOS, desenharChao, sombra } from './pecas.js';

function cenaAbertura() {
  const chao = {}, objs = [];
  for (let x = 0; x < 9; x++) for (let y = 0; y < 9; y++) chao[x + ',' + y] = 'grama';
  for (let i = 0; i < 9; i++) { chao['4,' + i] = 'rua'; chao[i + ',4'] = 'rua'; }
  ['6,6', '7,6', '6,7', '7,7', '8,7', '7,8'].forEach((k) => { chao[k] = 'agua'; });
  ['0,3', '1,3', '2,3', '3,3'].forEach((k) => { chao[k] = 'calcada'; }); chao['5,8'] = 'flores'; chao['8,5'] = 'flores'; chao['0,8'] = 'flores';
  const o = (t, x, y, c = 0, r = 0) => objs.push({ t, x, y, c, r });
  o('casa', 0, 2, 0); o('casa', 1, 2, 1); o('sobrado', 2, 2, 3); o('casa', 3, 2, 2); o('arvore', 0, 0); o('ipe-amarelo', 2, 0); o('casa', 1, 0, 4);
  o('escola', 5, 2); o('arvore', 7, 2, 1); o('predio', 6, 0); o('predinho', 7, 0, 1); o('ipe-rosa', 8, 1); o('poste', 5, 3);
  o('parquinho', 1, 6); o('arvore', 0, 5); o('banco', 2, 7); o('familia', 3, 6, 2); o('pinheiro', 0, 7); o('fonte', 2, 5); o('poste', 3, 5);
  o('pato', 7, 7); o('arvore', 8, 6, 2); o('pessoa', 5, 6, 4); o('arvore', 5, 5, 1); o('carro', 4, 1, 0, 1); o('onibus', 6, 4);
  return { chao, objs };
}
const ease = (t) => 1 - Math.pow(1 - t, 3);
const quica = (t) => { const n = 7.5625, d = 2.75; if (t < 1 / d) return n * t * t; if (t < 2 / d) return n * (t -= 1.5 / d) * t + .75; if (t < 2.5 / d) return n * (t -= 2.25 / d) * t + .9375; return n * (t -= 2.625 / d) * t + .984375; };
const lim = (v) => Math.max(0, Math.min(1, v));
const V = 1.6; // velocidade da abertura (1 = original, ~3,9 s; 1,6 = ~2,4 s)

export function abertura() {
  const caixa = document.getElementById('abertura'); if (!caixa) return Promise.resolve();
  const curta = matchMedia('(prefers-reduced-motion: reduce)').matches;
  return new Promise((pronto) => {
    const cv = caixa.querySelector('canvas'), ctx = cv.getContext('2d');
    const m = cenaAbertura(); const chao = new Map(Object.entries(m.chao).map(([k, t]) => { const [x, y] = k.split(',').map(Number); return [K(x, y), t]; }));
    const tiles = [...chao].map(([k, t]) => ({ x: Math.floor(k / 100000) - 50000, y: (k % 100000) - 50000, t })).sort((a, b) => a.x + a.y - (b.x + b.y));
    const objs = m.objs.map((o, i) => ({ o, b: caixaGirada(0, o), atraso: 0.75 + i * 0.045 })).sort((a, b) => (a.b.X + a.b.Y + (a.b.W + a.b.D) / 2) - (b.b.X + b.b.Y + (b.b.W + b.b.D) / 2));
    const nuvens = [[.12, .16, 1], [.72, .1, 1.3], [.48, .24, .8], [.88, .3, 1.1]];
    let W = 0, H = 0, fim = false; const t0 = performance.now();
    const medir = () => { const d = Math.min(2, devicePixelRatio || 1); W = innerWidth; H = innerHeight; cv.width = W * d; cv.height = H * d; ctx.setTransform(d, 0, 0, d, 0, 0); };
    medir(); addEventListener('resize', medir);
    caixa.querySelectorAll('.abertura-nome span').forEach((s, i) => { s.style.animationDelay = (curta ? 0 : (1.55 + i * .06) / V) + 's'; });
    for (const [sel, atraso] of [['.abertura-sub', 2.1], ['.abertura-por', 1.95]]) { const x = caixa.querySelector(sel); if (x) x.style.animationDelay = (curta ? 0 : atraso / V) + 's'; }
    caixa.classList.add('anima');

    function quadro(agora) {
      if (fim) return; const t = curta ? 9 : (agora - t0) / 1000 * V;
      ctx.clearRect(0, 0, W, H);
      // sol nascendo
      const sx = W * .8, sy = H * .2 + (1 - ease(lim(t / 1.6))) * H * .25;
      const g = ctx.createRadialGradient(sx, sy, 0, sx, sy, 120); g.addColorStop(0, 'rgba(255,214,90,.55)'); g.addColorStop(1, 'rgba(255,214,90,0)');
      ctx.fillStyle = g; ctx.beginPath(); ctx.arc(sx, sy, 120, 0, 7); ctx.fill(); ctx.fillStyle = '#ffc93c'; ctx.beginPath(); ctx.arc(sx, sy, 44, 0, 7); ctx.fill();
      // nuvens passando
      for (const [nx, ny, e] of nuvens) {
        const x = ((nx * W + t * 18 * e) % (W + 200)) - 100, y = ny * H; ctx.fillStyle = 'rgba(255,255,255,.92)';
        [[0, 0, 26], [26, -10, 30], [56, 0, 24], [28, 8, 26]].forEach(([dx, dy, r]) => { ctx.beginPath(); ctx.arc(x + dx * e, y + dy * e, r * e, 0, 7); ctx.fill(); });
      }
      // ilha
      const z = Math.min(W * .62 / (9 * TW), H * .5 / (9 * TH + 80)) * 1.0;
      const cam = { x: 4.5, y: 4.5 - .4, z, rot: 0 };
      const G = lapis(ctx, cam, W, H * .86, {});
      const viz = (X, Y) => { const [x, y] = celMundo(0, X, Y); return chao.get(K(x, y)); };
      for (const tl of tiles) {
        const d = Math.hypot(tl.x - 4, tl.y - 4); const p = lim((t - d * .07) / .45); if (p <= 0) continue; const e = ease(p);
        ctx.save(); ctx.globalAlpha = e; ctx.translate(0, (1 - e) * 60);
        if (!viz(tl.x, tl.y + 1)) G.poly([[tl.x, tl.y + 1, 0], [tl.x + 1, tl.y + 1, 0], [tl.x + 1, tl.y + 1, -22], [tl.x, tl.y + 1, -22]], '#b07a48');
        if (!viz(tl.x + 1, tl.y)) G.poly([[tl.x + 1, tl.y, 0], [tl.x + 1, tl.y + 1, 0], [tl.x + 1, tl.y + 1, -22], [tl.x + 1, tl.y, -22]], sombra('#b07a48', -.25));
        desenharChao(G, tl.x, tl.y, tl.t, tl.x, tl.y, viz, z); ctx.restore();
      }
      for (const it of objs) {
        const p = lim((t - it.atraso) / .7); if (p <= 0) continue;
        ctx.save(); ctx.globalAlpha = lim(p * 3); ctx.translate(0, -(1 - quica(p)) * 140 * z); OBJETOS[it.o.t].desenho(G, it.b, it.o); ctx.restore();
      }
      if (t < 4.2) requestAnimationFrame(quadro);
    }
    requestAnimationFrame(quadro);
    const terminar = () => {
      if (fim) return; fim = true; caixa.classList.add('sai'); removeEventListener('resize', medir);
      setTimeout(() => { caixa.remove(); }, 650); pronto();
    };
    caixa.addEventListener('click', terminar);
    setTimeout(terminar, curta ? 900 : Math.round(3900 / V));
  });
}
