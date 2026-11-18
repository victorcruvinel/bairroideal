// Bairro Ideal · motor de desenho (canvas). Vista 3D isométrica que gira de 90 em 90 graus,
// planta vista de cima, modo noite e mapas de qualquer tamanho (só desenha o que aparece na tela).
import { CHAOS, OBJETOS, desenharChao, sombra, ruido } from './pecas.js';

export const TW = 64, TH = 32, TP = 36; // largura e altura do losango; lado do quadrado na planta

// ---------- chaves e giro
export const K = (x, y) => (x + 50000) * 100000 + (y + 50000);
export const KX = (k) => Math.floor(k / 100000) - 50000;
export const KY = (k) => (k % 100000) - 50000;
export function girar(k, x, y) { for (let i = 0; i < ((k % 4) + 4) % 4; i++) [x, y] = [-y, x]; return [x, y]; }
export const celGirada = (k, x, y) => girar(k, x + .5, y + .5).map((v) => Math.floor(v));
export const celMundo = (k, X, Y) => girar(4 - k, X + .5, Y + .5).map((v) => Math.floor(v));
export function caixaGirada(k, o) {
  const p = OBJETOS[o.t]; const w = (o.r || 0) % 2 ? p.d : p.w, d = (o.r || 0) % 2 ? p.w : p.d;
  const a = girar(k, o.x, o.y), b = girar(k, o.x + w, o.y + d);
  return { X: Math.min(a[0], b[0]), Y: Math.min(a[1], b[1]), W: Math.abs(a[0] - b[0]), D: Math.abs(a[1] - b[1]) };
}
export function tamanho(o) { const p = OBJETOS[o.t]; return (o.r || 0) % 2 ? [p.d, p.w] : [p.w, p.d]; }

// ---------- índice do mapa (refeito quando a maquete muda)
export function indexar(m) {
  const chao = new Map(), ocup = new Map();
  for (const [k, t] of Object.entries(m.chao || {})) { const [x, y] = k.split(',').map(Number); chao.set(K(x, y), t); }
  for (const o of m.objs || []) {
    if (!OBJETOS[o.t]) continue; const [w, d] = tamanho(o);
    for (let i = 0; i < w; i++) for (let j = 0; j < d; j++) ocup.set(K(o.x + i, o.y + j), o);
  }
  let x0 = Infinity, y0 = Infinity, x1 = -Infinity, y1 = -Infinity;
  for (const k of chao.keys()) { const x = KX(k), y = KY(k); if (x < x0) x0 = x; if (y < y0) y0 = y; if (x > x1) x1 = x; if (y > y1) y1 = y; }
  if (!chao.size) { x0 = y0 = 0; x1 = y1 = 0; }
  return { m, chao, ocup, lim: { x0, y0, x1: x1 + 1, y1: y1 + 1 }, ordem: {} };
}
function ordemTiles(ix, rot) {
  if (ix.ordem[rot]) return ix.ordem[rot];
  const arr = [];
  for (const [k, t] of ix.chao) { const x = KX(k), y = KY(k); const [X, Y] = celGirada(rot, x, y); arr.push({ X, Y, x, y, t }); }
  arr.sort((a, b) => (a.X + a.Y) - (b.X + b.Y) || a.X - b.X);
  return (ix.ordem[rot] = arr);
}

// ---------- cores da noite
const NOITE = [20, 28, 64];
function misturar(hex, alvo, p) {
  const n = parseInt(hex.slice(1), 16); const r = n >> 16, g = (n >> 8) & 255, b = n & 255;
  const f = (a, c) => Math.round(a + (c - a) * p);
  return '#' + ((1 << 24) + (f(r, alvo[0]) << 16) + (f(g, alvo[1]) << 8) + f(b, alvo[2])).toString(16).slice(1);
}
const cacheNoite = new Map(), saidas = new Set(), luzes = new Set();
function tingir(c, noite) {
  if (!noite || !c || c[0] !== '#' || c.length !== 7 || saidas.has(c) || luzes.has(c)) return c;
  let r = cacheNoite.get(c); if (!r) { r = misturar(c, NOITE, .58); cacheNoite.set(c, r); saidas.add(r); } return r;
}

// ---------- lápis
export function lapis(ctx, cam, W, H, opt = {}) {
  const s = cam.z, rot = cam.rot || 0, noite = !!opt.noite, planta = !!opt.planta;
  const [CX, CY] = girar(rot, cam.x, cam.y);
  let P;
  if (planta) { const ox = W / 2 - CX * TP * s, oy = H / 2 - CY * TP * s; P = (x, y) => [ox + x * TP * s, oy + y * TP * s]; }
  else { const ox = W / 2 - (CX - CY) * TW / 2 * s, oy = H / 2 - (CX + CY) * TH / 2 * s; P = (x, y, z = 0) => [ox + (x - y) * TW / 2 * s, oy + (x + y) * TH / 2 * s - z * s]; }
  const c = (cor) => tingir(cor, noite);
  const G = {
    ctx, P, s, rot, noite, planta, c,
    luz(cor) { luzes.add(cor); return cor; },
    poly(pts, fill, stroke, lw = 1.3) {
      ctx.beginPath(); pts.forEach((p, i) => { const q = P(p[0], p[1], p[2] || 0); i ? ctx.lineTo(q[0], q[1]) : ctx.moveTo(q[0], q[1]); }); ctx.closePath();
      if (fill) { ctx.fillStyle = c(fill); ctx.fill(); }
      if (stroke) { ctx.strokeStyle = c(stroke); ctx.lineWidth = lw * s; ctx.stroke(); }
    },
    line(a, b, cor, w = 1.4) { const p = P(...a), q = P(...b); ctx.beginPath(); ctx.moveTo(p[0], p[1]); ctx.lineTo(q[0], q[1]); ctx.strokeStyle = c(cor); ctx.lineWidth = w * s; ctx.lineCap = 'round'; ctx.stroke(); },
    linhaTela(p, q, cor, w = 1.4) { ctx.beginPath(); ctx.moveTo(p[0], p[1]); ctx.lineTo(q[0], q[1]); ctx.strokeStyle = c(cor); ctx.lineWidth = w * s; ctx.lineCap = 'round'; ctx.stroke(); },
    curvaTela(p, q, cor, w = 1) { ctx.beginPath(); ctx.moveTo(p[0], p[1]); ctx.quadraticCurveTo((p[0] + q[0]) / 2, Math.max(p[1], q[1]) + 8 * s, q[0], q[1]); ctx.strokeStyle = c(cor); ctx.lineWidth = w * s; ctx.stroke(); },
    circ(x, y, z, r, fill) { const p = P(x, y, z); ctx.beginPath(); ctx.arc(p[0], p[1], Math.max(.3, r * s), 0, 7); ctx.fillStyle = c(fill); ctx.fill(); },
    circTela(p, r, fill) { ctx.beginPath(); ctx.arc(p[0], p[1], Math.max(.3, r * s), 0, 7); ctx.fillStyle = c(fill); ctx.fill(); },
    ell(x, y, z, rx, ry, fill, stroke, alpha = 1, lw = 1.3) {
      const p = P(x, y, z); ctx.save(); ctx.globalAlpha *= alpha; ctx.beginPath(); ctx.ellipse(p[0], p[1], Math.max(.3, rx * s), Math.max(.3, ry * s), 0, 0, 7);
      if (fill) { ctx.fillStyle = c(fill); ctx.fill(); } if (stroke) { ctx.strokeStyle = c(stroke); ctx.lineWidth = lw * s; ctx.stroke(); } ctx.restore();
    },
    box(X, Y, W, D, h, z0, cor, o = {}) {
      G.poly([[X, Y + D, z0], [X + W, Y + D, z0], [X + W, Y + D, z0 + h], [X, Y + D, z0 + h]], o.left || sombra(cor, -0.1));
      G.poly([[X + W, Y, z0], [X + W, Y + D, z0], [X + W, Y + D, z0 + h], [X + W, Y, z0 + h]], o.right || sombra(cor, -0.26));
      if (!o.noTop) G.poly([[X, Y, z0 + h], [X + W, Y, z0 + h], [X + W, Y + D, z0 + h], [X, Y + D, z0 + h]], o.top || cor);
    },
    faceL(b, u, v, uw, vh, cor) { const Y = b.Y + b.D; G.poly([[b.X + u, Y, v], [b.X + u + uw, Y, v], [b.X + u + uw, Y, v + vh], [b.X + u, Y, v + vh]], cor); },
    faceR(b, u, v, uw, vh, cor) { const X = b.X + b.W; G.poly([[X, b.Y + u, v], [X, b.Y + u + uw, v], [X, b.Y + u + uw, v + vh], [X, b.Y + u, v + vh]], cor); },
    roof(X, Y, W, D, h, rh, cor, parede, aoLongoX) {
      if (aoLongoX) {
        const ym = Y + D / 2;
        G.poly([[X, Y, h], [X + W, Y, h], [X + W, ym, h + rh], [X, ym, h + rh]], sombra(cor, -.18));
        G.poly([[X, Y + D, h], [X + W, Y + D, h], [X + W, ym, h + rh], [X, ym, h + rh]], cor);
        G.poly([[X + W, Y, h], [X + W, Y + D, h], [X + W, ym, h + rh]], sombra(parede, -.22));
      } else {
        const xm = X + W / 2;
        G.poly([[X, Y, h], [X, Y + D, h], [xm, Y + D, h + rh], [xm, Y, h + rh]], sombra(cor, -.05));
        G.poly([[X, Y + D, h], [xm, Y + D, h + rh], [X + W, Y + D, h]], sombra(parede, -.08));
        G.poly([[X + W, Y, h], [X + W, Y + D, h], [xm, Y + D, h + rh], [xm, Y, h + rh]], sombra(cor, -.25));
      }
    },
    cilindro(x, y, r, h, cor, z0 = 0) {
      const p = P(x, y, z0), t = P(x, y, z0 + h), rx = r * TW / 2 * s * 1.0, ry = rx / 2;
      ctx.beginPath(); ctx.ellipse(p[0], p[1], rx, ry, 0, 0, Math.PI); ctx.lineTo(t[0] - rx, t[1]); ctx.ellipse(t[0], t[1], rx, ry, 0, Math.PI, 0, true); ctx.closePath();
      const g = ctx.createLinearGradient(p[0] - rx, 0, p[0] + rx, 0); g.addColorStop(0, c(sombra(cor, -.05))); g.addColorStop(1, c(sombra(cor, -.32)));
      ctx.fillStyle = g; ctx.fill(); ctx.beginPath(); ctx.ellipse(t[0], t[1], rx, ry, 0, 0, 7); ctx.fillStyle = c(sombra(cor, .15)); ctx.fill();
    },
    cone(x, y, z0, h, r, cor) {
      const b = P(x, y, z0), t = P(x, y, z0 + h);
      ctx.beginPath(); ctx.moveTo(t[0], t[1]); ctx.lineTo(b[0] + r * s, b[1]); ctx.lineTo(b[0] - r * s, b[1]); ctx.closePath(); ctx.fillStyle = c(cor); ctx.fill();
      ctx.beginPath(); ctx.moveTo(t[0], t[1]); ctx.lineTo(b[0] + r * s, b[1]); ctx.lineTo(b[0], b[1] + 2 * s); ctx.closePath(); ctx.fillStyle = c(sombra(cor, -.2)); ctx.fill();
    },
    cruz(p, cor) { G.linhaTela([p[0], p[1] - 8 * s], [p[0], p[1] + 6 * s], cor, 2.2); G.linhaTela([p[0] - 4 * s, p[1] - 3 * s], [p[0] + 4 * s, p[1] - 3 * s], cor, 2.2); },
    cruzSaude(p, cor) { ctx.fillStyle = c(cor); ctx.fillRect(p[0] - 1.8 * s, p[1] - 6 * s, 3.6 * s, 12 * s); ctx.fillRect(p[0] - 6 * s, p[1] - 1.8 * s, 12 * s, 3.6 * s); },
    bandeira(p, cor) { G.linhaTela(p, [p[0], p[1] - 26 * s], '#555', 1.5); ctx.beginPath(); ctx.moveTo(p[0], p[1] - 26 * s); ctx.lineTo(p[0] + 14 * s, p[1] - 22 * s); ctx.lineTo(p[0], p[1] - 18 * s); ctx.closePath(); ctx.fillStyle = c(cor); ctx.fill(); },
    brilho(p, r, cor) { const g = ctx.createRadialGradient(p[0], p[1], 0, p[0], p[1], r * s); g.addColorStop(0, cor); g.addColorStop(1, 'rgba(255,220,120,0)'); ctx.save(); ctx.globalCompositeOperation = 'lighter'; ctx.fillStyle = g; ctx.beginPath(); ctx.arc(p[0], p[1], r * s, 0, 7); ctx.fill(); ctx.restore(); },
    folhas(t, cor) { for (let i = 0; i < 6; i++) { const a = i / 6 * Math.PI * 2; ctx.beginPath(); ctx.ellipse(t[0] + Math.cos(a) * 9 * s, t[1] + Math.sin(a) * 4 * s + 3 * s, 11 * s, 3.4 * s, a, 0, 7); ctx.fillStyle = c(i % 2 ? cor : sombra(cor, -.15)); ctx.fill(); } },
    trave(a, b, k) {
      ctx.strokeStyle = c('#e63946'); ctx.lineWidth = 2 * k; ctx.beginPath();
      [a, b].forEach((p) => { ctx.moveTo(p[0] - 4 * k, p[1]); ctx.lineTo(p[0], p[1] - 28 * k); ctx.lineTo(p[0] + 4 * k, p[1]); }); ctx.moveTo(a[0], a[1] - 28 * k); ctx.lineTo(b[0], b[1] - 28 * k); ctx.stroke();
      const m = [(a[0] + b[0]) / 2, (a[1] + b[1]) / 2]; ctx.strokeStyle = c('#555'); ctx.lineWidth = 1 * k; ctx.beginPath(); ctx.moveTo(m[0] - 5 * k, m[1] - 27 * k); ctx.lineTo(m[0] - 5 * k, m[1] - 9 * k); ctx.moveTo(m[0] + 5 * k, m[1] - 27 * k); ctx.lineTo(m[0] + 5 * k, m[1] - 9 * k); ctx.stroke();
      ctx.fillStyle = c('#ffb703'); ctx.fillRect(m[0] - 6 * k, m[1] - 9 * k, 12 * k, 2.5 * k);
    },
    boneco(x, y, roupa, pele, e = 1, z0 = 0) {
      const b = P(x, y, z0), k = s * e; ctx.fillStyle = 'rgba(0,0,0,.15)'; ctx.beginPath(); ctx.ellipse(b[0], b[1], 4.5 * k, 2 * k, 0, 0, 7); ctx.fill();
      ctx.fillStyle = c(sombra(roupa, -.35)); ctx.fillRect(b[0] - 2.6 * k, b[1] - 6 * k, 2.2 * k, 6 * k); ctx.fillRect(b[0] + .4 * k, b[1] - 6 * k, 2.2 * k, 6 * k);
      ctx.fillStyle = c(roupa); ctx.beginPath(); ctx.roundRect(b[0] - 3.4 * k, b[1] - 15 * k, 6.8 * k, 10 * k, 3 * k); ctx.fill();
      ctx.fillStyle = c(pele); ctx.beginPath(); ctx.arc(b[0], b[1] - 18.5 * k, 3.6 * k, 0, 7); ctx.fill();
    },
    pato(x, y) { const b = P(x, y, -5); ctx.fillStyle = c('#ffffff'); ctx.beginPath(); ctx.ellipse(b[0], b[1], 5 * s, 3 * s, 0, 0, 7); ctx.fill(); ctx.beginPath(); ctx.arc(b[0] + 4 * s, b[1] - 3 * s, 2.3 * s, 0, 7); ctx.fill(); ctx.fillStyle = c('#ffb703'); ctx.beginPath(); ctx.moveTo(b[0] + 6 * s, b[1] - 3.5 * s); ctx.lineTo(b[0] + 9 * s, b[1] - 2.5 * s); ctx.lineTo(b[0] + 6 * s, b[1] - 1.5 * s); ctx.fill(); },
    galhos(p, k) { ctx.strokeStyle = c('#6b4f36'); ctx.lineWidth = 2.6 * k; ctx.lineCap = 'round'; ctx.beginPath(); ctx.moveTo(p[0], p[1]); ctx.lineTo(p[0], p[1] - 30 * k); ctx.moveTo(p[0], p[1] - 16 * k); ctx.lineTo(p[0] - 10 * k, p[1] - 26 * k); ctx.moveTo(p[0], p[1] - 22 * k); ctx.lineTo(p[0] + 9 * k, p[1] - 33 * k); ctx.moveTo(p[0] - 6 * k, p[1] - 22 * k); ctx.lineTo(p[0] - 8 * k, p[1] - 30 * k); ctx.stroke(); },
    fogo(p) {
      ctx.fillStyle = 'rgba(110,110,110,.45)'; [[-4, -32, 6], [3, -44, 8], [-2, -58, 10]].forEach(([dx, dy, r]) => { ctx.beginPath(); ctx.arc(p[0] + dx * s, p[1] + dy * s, r * s, 0, 7); ctx.fill(); });
      ctx.fillStyle = G.luz('#ff7b00'); ctx.beginPath(); ctx.moveTo(p[0], p[1] - 20 * s); ctx.quadraticCurveTo(p[0] + 9 * s, p[1] - 8 * s, p[0] + 4 * s, p[1]); ctx.lineTo(p[0] - 5 * s, p[1]); ctx.quadraticCurveTo(p[0] - 8 * s, p[1] - 9 * s, p[0], p[1] - 20 * s); ctx.fill();
      ctx.fillStyle = G.luz('#ffd166'); ctx.beginPath(); ctx.ellipse(p[0], p[1] - 4 * s, 3 * s, 5 * s, 0, 0, 7); ctx.fill();
      if (noite) G.brilho([p[0], p[1] - 8 * s], 50, 'rgba(255,140,40,.45)');
    },
  };
  return G;
}

const noiteOu = (opt, dia, noite) => (opt.noite ? noite : dia);
// ---------- desenho completo
// opt: { noite, planta, fantasma:{t|chao, x, y, r, c, ok}, selecionado: obj, marcas:[{x,y,cor}], fundo }
export function desenhar(ctx, ix, cam, W, H, opt = {}) {
  const G = lapis(ctx, cam, W, H, opt), rot = cam.rot || 0, s = cam.z;
  const viz = (X, Y) => { const [x, y] = celMundo(rot, X, Y); return ix.chao.get(K(x, y)); };
  const tiles = ordemTiles(ix, rot);
  const dentro = opt.planta
    ? (X, Y) => { const p = G.P(X, Y); return p[0] > -TP * s * 3 && p[0] < W + TP * s && p[1] > -TP * s * 3 && p[1] < H + TP * s; }
    : (X, Y) => { const p = G.P(X, Y); return p[0] > -TW * s * 1.5 && p[0] < W + TW * s * .5 && p[1] > -TH * s * 2 && p[1] < H + 120 * s; };
  const desenhados = [];
  if (opt.planta) desenharPlanta(G, ix, tiles, viz, dentro, opt);
  else {
    const borda = '#b07a48';
    for (const tl of tiles) {
      if (!dentro(tl.X, tl.Y)) continue;
      const { X, Y } = tl;
      if (!viz(X, Y + 1)) G.poly([[X, Y + 1, 0], [X + 1, Y + 1, 0], [X + 1, Y + 1, -12], [X, Y + 1, -12]], sombra(borda, -.02));
      if (!viz(X + 1, Y)) G.poly([[X + 1, Y, 0], [X + 1, Y + 1, 0], [X + 1, Y + 1, -12], [X + 1, Y, -12]], sombra(borda, -.25));
      desenharChao(G, X, Y, tl.t, tl.x, tl.y, viz, s);
    }
    // grade: risquinhos brancos em volta de cada quadradinho (opt.grade)
    if (opt.grade && s > .18) {
      ctx.save(); ctx.strokeStyle = noiteOu(opt, 'rgba(255,255,255,.55)', 'rgba(170,190,255,.35)'); ctx.lineWidth = Math.max(.6, 1.1 * s); ctx.beginPath();
      for (const tl of tiles) { if (!dentro(tl.X, tl.Y)) continue; const a = G.P(tl.X, tl.Y), b = G.P(tl.X + 1, tl.Y), c = G.P(tl.X + 1, tl.Y + 1), d = G.P(tl.X, tl.Y + 1); ctx.moveTo(a[0], a[1]); ctx.lineTo(b[0], b[1]); ctx.lineTo(c[0], c[1]); ctx.lineTo(d[0], d[1]); ctx.closePath(); }
      ctx.stroke(); ctx.restore();
    }
    // marcas no chão (pincel, área selecionada)
    for (const mk of opt.marcas || []) {
      const [X, Y] = celGirada(rot, mk.x, mk.y);
      G.ctx.save(); G.ctx.globalAlpha = .5; G.poly([[X, Y], [X + 1, Y], [X + 1, Y + 1], [X, Y + 1]], mk.cor || '#ffffff', mk.borda || '#ffffff', 1.5); G.ctx.restore();
    }
    // objetos (de trás para a frente)
    const lista = [];
    for (const o of ix.m.objs || []) {
      const p = OBJETOS[o.t]; if (!p) continue;
      const b = caixaGirada(rot, o); if (!dentro(b.X + b.W / 2, b.Y + b.D / 2)) continue;
      lista.push({ o, b, k: b.X + b.Y + (b.W + b.D) / 2 + (p.chato ? -50 : 0) });
    }
    if (opt.fantasma && opt.fantasma.t && OBJETOS[opt.fantasma.t]) { const f = opt.fantasma; const b = caixaGirada(rot, f); lista.push({ o: f, b, k: b.X + b.Y + (b.W + b.D) / 2, fantasma: true }); }
    lista.sort((a, b) => a.k - b.k);
    for (const it of lista) {
      const { o, b } = it, p = OBJETOS[o.t];
      if (it.fantasma) {
        ctx.save(); ctx.globalAlpha = .35; G.poly([[b.X, b.Y], [b.X + b.W, b.Y], [b.X + b.W, b.Y + b.D], [b.X, b.Y + b.D]], o.ok ? '#3ddc84' : '#ff4d4d'); ctx.globalAlpha = o.ok ? .75 : .4; p.desenho(G, b, o); ctx.restore(); continue;
      }
      if (opt.selecionado === o) { ctx.save(); G.poly([[b.X, b.Y], [b.X + b.W, b.Y], [b.X + b.W, b.Y + b.D], [b.X, b.Y + b.D]], 'rgba(255,201,60,.45)', '#ffb703', 2.5); ctx.restore(); }
      if (opt.destaque && opt.destaque.has(o)) { G.ell(b.X + b.W / 2, b.Y + b.D / 2, 0, 30 * b.W, 15 * b.D, 'rgba(255,255,255,.55)', '#ffffff', 1, 2.5); }
      p.desenho(G, b, o);
      const a = G.P(b.X, b.Y + b.D), c = G.P(b.X + b.W, b.Y), fr = G.P(b.X + b.W, b.Y + b.D), tp = G.P(b.X, b.Y, p.chato ? 6 : p.fino ? 40 : 60);
      desenhados.push({ o, x0: a[0], x1: c[0], y0: tp[1], y1: fr[1] });
    }
    if (opt.noite) {
      ctx.save(); ctx.globalCompositeOperation = 'multiply'; ctx.fillStyle = 'rgba(70,80,140,.18)'; ctx.fillRect(0, 0, W, H); ctx.restore();
    }
  }
  // fantasma de chão (pincel)
  return { G, desenhados };
}

function desenharPlanta(G, ix, tiles, viz, dentro, opt) {
  const { ctx, s } = G; const T = TP * s;
  for (const tl of tiles) {
    if (!dentro(tl.X, tl.Y)) continue;
    const d = CHAOS[tl.t] || CHAOS.grama, p = G.P(tl.X, tl.Y);
    ctx.fillStyle = G.c(tl.t === 'grama' && ruido(tl.x, tl.y) < .22 ? '#86cc70' : d.planta); ctx.fillRect(p[0], p[1], T + .6, T + .6);
    if (T > 14) {
      if (tl.t === 'rua') {
        const n = [viz(tl.X, tl.Y - 1) === 'rua', viz(tl.X + 1, tl.Y) === 'rua', viz(tl.X, tl.Y + 1) === 'rua', viz(tl.X - 1, tl.Y) === 'rua'];
        ctx.strokeStyle = G.c('#f4e6a1'); ctx.lineWidth = 1.6 * s; ctx.setLineDash([4 * s, 4 * s]); ctx.beginPath();
        const c = [p[0] + T / 2, p[1] + T / 2]; const k = n.filter(Boolean).length;
        if (k < 3) { if (n[0]) { ctx.moveTo(c[0], c[1]); ctx.lineTo(c[0], p[1]); } if (n[2]) { ctx.moveTo(c[0], c[1]); ctx.lineTo(c[0], p[1] + T); } if (n[1]) { ctx.moveTo(c[0], c[1]); ctx.lineTo(p[0] + T, c[1]); } if (n[3]) { ctx.moveTo(c[0], c[1]); ctx.lineTo(p[0], c[1]); } if (!k) { ctx.moveTo(p[0], c[1]); ctx.lineTo(p[0] + T, c[1]); } }
        ctx.stroke(); ctx.setLineDash([]);
      } else if (tl.t === 'flores') {
        ['#ff6fa5', '#ffd23f', '#fff', '#c77dff'].forEach((cor, i) => { ctx.fillStyle = G.c(cor); ctx.beginPath(); ctx.arc(p[0] + T * (.2 + ruido(tl.x, tl.y, i) * .6), p[1] + T * (.2 + ruido(tl.x, tl.y, i + 7) * .6), 2.2 * s, 0, 7); ctx.fill(); });
      } else if (tl.t === 'esgoto') { ctx.fillStyle = G.c('#5d6b2f'); ctx.fillRect(p[0] + T * .35, p[1], T * .3, T); }
    }
  }
  if (T > 6) { ctx.strokeStyle = opt.grade ? 'rgba(20,81,58,.32)' : 'rgba(0,0,0,.06)'; ctx.lineWidth = opt.grade ? 1.2 : 1; ctx.beginPath(); for (const tl of tiles) { if (!dentro(tl.X, tl.Y)) continue; const p = G.P(tl.X, tl.Y); ctx.rect(p[0], p[1], T, T); } ctx.stroke(); }
  for (const mk of opt.marcas || []) { const [X, Y] = celGirada(G.rot, mk.x, mk.y); const p = G.P(X, Y); ctx.fillStyle = 'rgba(255,255,255,.5)'; ctx.fillRect(p[0], p[1], T, T); }
  const objs = [...(ix.m.objs || [])]; if (opt.fantasma && opt.fantasma.t) objs.push({ ...opt.fantasma, _f: true });
  for (const o of objs) {
    const pc = OBJETOS[o.t]; if (!pc) continue; const b = caixaGirada(G.rot, o); if (!dentro(b.X, b.Y)) continue;
    const p = G.P(b.X, b.Y), w = b.W * T, h = b.D * T, pl = pc.planta || {};
    ctx.save(); if (o._f) ctx.globalAlpha = o.ok ? .7 : .35;
    const cor = pl.cor || '#999';
    const m = T * .1;
    switch (pl.forma) {
      case 'telhado': {
        const cs = pc.cores ? (o.t === 'barraco' ? null : null) : null; void cs;
        const tel = o.t === 'casa' || o.t === 'sobrado' ? ['#e2603f', '#3d7dd8', '#2a9d8f', '#d6456b', '#7b5cd6', '#e2603f', '#8a5a44', '#3a6b4f'][(o.c || 0) % 8] : o.t === 'creche' ? '#ff8fab' : o.t === 'igreja' ? '#8a5a44' : cor;
        ctx.fillStyle = G.c(tel); ctx.fillRect(p[0] + m, p[1] + m, w - 2 * m, h - 2 * m);
        ctx.fillStyle = 'rgba(0,0,0,.18)'; ((o.r || 0) + G.rot) % 2 === 0 ? ctx.fillRect(p[0] + m, p[1] + h / 2, w - 2 * m, h / 2 - m) : ctx.fillRect(p[0] + w / 2, p[1] + m, w / 2 - m, h - 2 * m);
        break;
      }
      case 'laje': ctx.fillStyle = G.c(o.t.startsWith('pred') || o.t === 'condominio' ? ['#a9c7ff', '#ffcfa8', '#cdeac0', '#f6d6ff', '#ffe08a', '#d6d9e0'][(o.c || 0) % 6] : cor); ctx.strokeStyle = 'rgba(0,0,0,.25)'; ctx.lineWidth = 1.5; ctx.beginPath(); ctx.roundRect(p[0] + m, p[1] + m, w - 2 * m, h - 2 * m, 3 * s); ctx.fill(); ctx.stroke(); break;
      case 'copa': ctx.fillStyle = 'rgba(0,0,0,.15)'; ctx.beginPath(); ctx.arc(p[0] + w / 2 + 2 * s, p[1] + h / 2 + 2 * s, T * .36, 0, 7); ctx.fill(); ctx.fillStyle = G.c(cor); ctx.beginPath(); ctx.arc(p[0] + w / 2, p[1] + h / 2, T * .36, 0, 7); ctx.fill(); break;
      case 'circulo': ctx.fillStyle = G.c(cor); ctx.beginPath(); ctx.arc(p[0] + w / 2, p[1] + h / 2, Math.min(w, h) * .32, 0, 7); ctx.fill(); break;
      case 'carro': { const al = ((o.r || 0) + G.rot) % 2 === 0; ctx.fillStyle = G.c(o.t === 'carro' ? ['#ef476f', '#118ab2', '#ffd166', '#06d6a0', '#f1f1f1', '#3a3a3a', '#8338ec'][(o.c || 0) % 7] : cor); ctx.beginPath(); al ? ctx.roundRect(p[0] + w * .15, p[1] + h * .32, w * .7, h * .36, 3 * s) : ctx.roundRect(p[0] + w * .32, p[1] + h * .15, w * .36, h * .7, 3 * s); ctx.fill(); break; }
      case 'ponto': ctx.fillStyle = G.c(o.t === 'pessoa' || o.t === 'familia' || o.t === 'crianca' ? ['#ff6b6b', '#4361ee', '#06d6a0', '#ffb703', '#8338ec', '#f72585', '#2a9d8f', '#fb8500'][(o.c || 0) % 8] : cor); ctx.beginPath(); ctx.arc(p[0] + w / 2, p[1] + h / 2, Math.max(1.5, T * .14), 0, 7); ctx.fill(); break;
      default: ctx.fillStyle = G.c(cor); ctx.beginPath(); ctx.roundRect(p[0] + m * 1.5, p[1] + m * 1.5, w - 3 * m, h - 3 * m, 3 * s); ctx.fill();
    }
    if (pl.emoji && T > 18) { ctx.font = `${Math.min(w, h) * .45}px "Noto Color Emoji",sans-serif`; ctx.textAlign = 'center'; ctx.textBaseline = 'middle'; ctx.fillText(pl.emoji, p[0] + w / 2, p[1] + h / 2 + 1); }
    if (opt.selecionado === o) { ctx.strokeStyle = '#ffb703'; ctx.lineWidth = 3; ctx.strokeRect(p[0] + 1, p[1] + 1, w - 2, h - 2); }
    if (o._f) { ctx.strokeStyle = o.ok ? '#3ddc84' : '#ff4d4d'; ctx.lineWidth = 2.5; ctx.strokeRect(p[0] + 1, p[1] + 1, w - 2, h - 2); }
    ctx.restore();
  }
  if (opt.noite) { ctx.save(); ctx.fillStyle = 'rgba(20,28,64,.25)'; ctx.fillRect(0, 0, 9999, 9999); ctx.restore(); }
}

// ---------- tela -> célula do mundo
export function celulaEm(cam, W, H, sx, sy, planta) {
  const s = cam.z, rot = cam.rot || 0; const [CX, CY] = girar(rot, cam.x, cam.y);
  let X, Y;
  if (planta) { X = (sx - W / 2) / (TP * s) + CX; Y = (sy - H / 2) / (TP * s) + CY; }
  else { const a = (sx - W / 2) / (TW / 2 * s) + (CX - CY), b = (sy - H / 2) / (TH / 2 * s) + (CX + CY); X = (a + b) / 2; Y = (b - a) / 2; }
  const [x, y] = celMundo(rot, Math.floor(X), Math.floor(Y)); return { x, y };
}
// arrastar a tela: quanto o centro da câmera anda no mundo
export function deltaMundo(cam, dx, dy, planta) {
  const s = cam.z; let dX, dY;
  if (planta) { dX = dx / (TP * s); dY = dy / (TP * s); }
  else { const a = dx / (TW / 2 * s), b = dy / (TH / 2 * s); dX = (a + b) / 2; dY = (b - a) / 2; }
  return girar(4 - (cam.rot || 0), dX, dY);
}
// câmera que mostra o mapa inteiro
export function enquadrar(ix, W, H, rot = 0, planta = false, folga = 0.86) {
  const { x0, y0, x1, y1 } = ix.lim; const cx = (x0 + x1) / 2, cy = (y0 + y1) / 2;
  const cs = [[x0, y0], [x1, y0], [x1, y1], [x0, y1]].map(([x, y]) => girar(rot, x, y));
  let w, h;
  if (planta) { const xs = cs.map((c) => c[0]), ys = cs.map((c) => c[1]); w = (Math.max(...xs) - Math.min(...xs)) * TP; h = (Math.max(...ys) - Math.min(...ys)) * TP; }
  else { const u = cs.map(([X, Y]) => (X - Y) * TW / 2), v = cs.map(([X, Y]) => (X + Y) * TH / 2); w = Math.max(...u) - Math.min(...u); h = Math.max(...v) - Math.min(...v) + 90; }
  const z = Math.max(.08, Math.min(2.6, Math.min(W * folga / Math.max(w, 1), H * folga / Math.max(h, 1))));
  return { x: cx, y: cy + (planta ? 0 : -0.6 / z * 0), z, rot };
}

// miniatura de uma peça (para a barra de peças)
const cacheMini = new Map();
export function miniatura(id, c = 0, tam = 88) {
  const chave = id + ':' + c + ':' + tam; if (cacheMini.has(chave)) return cacheMini.get(chave);
  const cv = document.createElement('canvas'); const dpr = 2; cv.width = cv.height = tam * dpr;
  const ctx = cv.getContext('2d'); ctx.scale(dpr, dpr);
  const o = OBJETOS[id]; const w = o ? o.w : 1, d = o ? o.d : 1;
  const chao = {}; const base = CHAOS[id] ? id : (o && o.agua ? 'agua' : o && o.cats.includes('problemas') ? 'terra' : ['carro', 'onibus', 'caminhao', 'abandonado', 'buraco'].includes(id) ? 'rua' : 'grama');
  for (let i = 0; i < w; i++) for (let j = 0; j < d; j++) chao[i + ',' + j] = base;
  const m = { chao, objs: o ? [{ t: id, x: 0, y: 0, c }] : [] };
  const ix = indexar(m); const z = 1.05 / Math.max(w, d) * (tam / 88);
  const altura = o && !o.chato ? (o.fino ? 20 : 26) : 4;
  const cam = { x: w / 2, y: d / 2, z, rot: 0 };
  ctx.translate(0, altura * z * .55 + 6);
  desenhar(ctx, ix, cam, tam, tam, {});
  const url = cv.toDataURL(); cacheMini.set(chave, url); return url;
}
