// Bairro Ideal · catálogo de peças (chão e objetos) e como cada uma é desenhada no 3D isométrico.
// Cada desenho recebe G (lápis já posicionado na câmera), b = caixa girada {X,Y,W,D} e o = a peça {t,x,y,r,c}.

export const CATEGORIAS = [
  { id: 'chao', nome: 'Chão e ruas', emoji: '🛣️', cor: '#e2e8f0' },
  { id: 'casas', nome: 'Casas', emoji: '🏠', cor: '#ffedd5' },
  { id: 'servicos', nome: 'Serviços', emoji: '🏫', cor: '#e0f2fe' },
  { id: 'natureza', nome: 'Natureza', emoji: '🌳', cor: '#dcfce7' },
  { id: 'lazer', nome: 'Lazer', emoji: '🎠', cor: '#fef9c3' },
  { id: 'pessoas', nome: 'Pessoas e veículos', emoji: '🧍', cor: '#fee2e2' },
  { id: 'problemas', nome: 'Problemas', emoji: '⚠️', cor: '#e7e5e4' },
];

export const CORES_CASA = [
  ['#fff3e0', '#e2603f'], ['#e8f7ff', '#3d7dd8'], ['#fff8d6', '#2a9d8f'], ['#ffe9f1', '#d6456b'],
  ['#efe7ff', '#7b5cd6'], ['#e9fbe9', '#e2603f'], ['#ffe2c6', '#8a5a44'], ['#f1f1f1', '#3a6b4f'],
];
export const CORES_ROUPA = ['#ff6b6b', '#4361ee', '#06d6a0', '#ffb703', '#8338ec', '#f72585', '#2a9d8f', '#fb8500'];
const PELES = ['#f1c27d', '#8d5524', '#c68642', '#e0ac69', '#5c3a21'];
const CORES_CARRO = ['#ef476f', '#118ab2', '#ffd166', '#06d6a0', '#f1f1f1', '#3a3a3a', '#8338ec'];
const CORES_PREDIO = ['#a9c7ff', '#ffcfa8', '#cdeac0', '#f6d6ff', '#ffe08a', '#d6d9e0'];

export function sombra(hex, f) {
  const n = parseInt(hex.slice(1), 16); let r = n >> 16, g = (n >> 8) & 255, b = n & 255;
  const t = f < 0 ? 0 : 255, p = Math.abs(f);
  r = Math.round((t - r) * p + r); g = Math.round((t - g) * p + g); b = Math.round((t - b) * p + b);
  return '#' + ((1 << 24) + (r << 16) + (g << 8) + b).toString(16).slice(1);
}
const h32 = (x, y, k = 0) => { let h = (x * 374761393 + y * 668265263 + k * 2246822519) | 0; h = (h ^ (h >>> 13)) * 1274126177; return ((h ^ (h >>> 16)) >>> 0) / 4294967296; };
export const ruido = h32;

// ---------------------------------------------------------------- CHÃO
// liga: tipos que se conectam (rua com rua, rio com rio...)
export const CHAOS = {
  grama: { nome: 'Grama', cats: ['chao', 'natureza'], cor: '#8fd47a', planta: '#8fd47a' },
  flores: { nome: 'Canteiro de flores', cats: ['chao', 'natureza'], cor: '#8fd47a', planta: '#b9e39b' },
  rua: { nome: 'Rua asfaltada', cats: ['chao'], cor: '#5d6577', planta: '#5d6577', liga: ['rua'] },
  calcada: { nome: 'Calçada', cats: ['chao'], cor: '#dcd6c8', planta: '#dcd6c8' },
  praca: { nome: 'Piso de praça', cats: ['chao', 'lazer'], cor: '#efe2c4', planta: '#efe2c4' },
  ciclovia: { nome: 'Ciclovia', cats: ['chao', 'lazer'], cor: '#d9534f', planta: '#e07a6f', liga: ['ciclovia'] },
  areia: { nome: 'Areia', cats: ['chao', 'natureza'], cor: '#f2dc9b', planta: '#f2dc9b' },
  agua: { nome: 'Lago / rio limpo', cats: ['chao', 'natureza'], cor: '#4fbde6', planta: '#4fbde6', liga: ['agua', 'aguasuja'], fundo: -6 },
  terra: { nome: 'Terra', cats: ['chao', 'problemas'], cor: '#bb8d5f', planta: '#bb8d5f' },
  estrada: { nome: 'Rua de terra', cats: ['chao', 'problemas'], cor: '#a8794c', planta: '#a8794c', liga: ['estrada', 'rua'] },
  seco: { nome: 'Mato seco', cats: ['chao', 'problemas'], cor: '#cbb878', planta: '#cbb878' },
  lama: { nome: 'Lama / poça', cats: ['chao', 'problemas'], cor: '#bb8d5f', planta: '#7a6146' },
  esgoto: { nome: 'Esgoto a céu aberto', cats: ['chao', 'problemas'], cor: '#a8794c', planta: '#6b7a3a', liga: ['esgoto', 'aguasuja'] },
  aguasuja: { nome: 'Água poluída', cats: ['chao', 'problemas'], cor: '#7d8c4c', planta: '#7d8c4c', liga: ['agua', 'aguasuja'], fundo: -6 },
};

export function desenharChao(G, X, Y, t, wx, wy, viz, s) {
  const d = CHAOS[t] || CHAOS.grama, q = [[X, Y], [X + 1, Y], [X + 1, Y + 1], [X, Y + 1]];
  const det = s > 0.45; // detalhes só quando dá para ver
  const L = (a, b, c, w = 1.5) => G.line(a, b, c, w);
  const liga = (dx, dy) => d.liga && d.liga.includes(viz(X + dx, Y + dy));
  switch (t) {
    case 'grama': G.poly(q, h32(wx, wy) < 0.22 ? '#86cc70' : '#8fd47a');
      if (det && h32(wx, wy, 3) < 0.3) { const a = .2 + h32(wx, wy, 4) * .6, b = .2 + h32(wx, wy, 5) * .6; L([X + a, Y + b, 0], [X + a, Y + b, 4], '#6fb55d', 1.4); L([X + a + .05, Y + b, 0], [X + a + .08, Y + b, 3], '#6fb55d', 1.2); }
      break;
    case 'flores': G.poly(q, '#8fd47a');
      if (det) { const cs = ['#ff6fa5', '#ffd23f', '#ffffff', '#ff8a4c', '#c77dff', '#ff4d6d']; for (let i = 0; i < 7; i++) { const a = .12 + h32(wx, wy, i) * .76, b = .12 + h32(wx, wy, i + 9) * .76; G.ell(X + a, Y + b, 1, 2.6, 2, G.c('#3e8e3a')); G.circ(X + a, Y + b, 3, 2.4, G.c(cs[(i + wx + wy) % 6 < 0 ? 0 : (i + wx + wy) % 6])); } }
      break;
    case 'rua': {
      G.poly(q, '#5d6577');
      const n = [liga(0, -1), liga(1, 0), liga(0, 1), liga(-1, 0)], k = n.filter(Boolean).length;
      if (!det) break;
      // meio-fio onde a rua acaba
      const borda = '#c9c3b4';
      if (!n[0]) L([X, Y, 0], [X + 1, Y, 0], borda, 2); if (!n[1]) L([X + 1, Y, 0], [X + 1, Y + 1, 0], borda, 2);
      if (!n[2]) L([X, Y + 1, 0], [X + 1, Y + 1, 0], borda, 2); if (!n[3]) L([X, Y, 0], [X, Y + 1, 0], borda, 2);
      if (k >= 3) { // cruzamento: faixas de pedestre
        const z = (a, b, c, e) => { for (let i = 0; i < 4; i++) { const f = .2 + i * .18; L(a(f), b(f), '#f5f5f0', 2.6); } };
        if (n[0]) z((f) => [X + f, Y + .05, 0], (f) => [X + f, Y + .2, 0]); if (n[2]) z((f) => [X + f, Y + .8, 0], (f) => [X + f, Y + .95, 0]);
        if (n[3]) z((f) => [X + .05, Y + f, 0], (f) => [X + .2, Y + f, 0]); if (n[1]) z((f) => [X + .8, Y + f, 0], (f) => [X + .95, Y + f, 0]);
      } else {
        const fx = !(n[0] || n[2]) || n[1] || n[3], fy = n[0] || n[2] || !fx; const am = '#f4e6a1';
        if (k === 2 && ((n[0] || n[2]) && (n[1] || n[3]))) { // curva
          const c = [X + .5, Y + .5, 0];
          if (n[0]) L(c, [X + .5, Y + .1, 0], am); if (n[2]) L(c, [X + .5, Y + .9, 0], am); if (n[1]) L(c, [X + .9, Y + .5, 0], am); if (n[3]) L(c, [X + .1, Y + .5, 0], am);
        } else {
          if (fx && !(n[0] || n[2])) { L([X + .08, Y + .5, 0], [X + .4, Y + .5, 0], am); L([X + .6, Y + .5, 0], [X + .92, Y + .5, 0], am); }
          if (fy && (n[0] || n[2])) { L([X + .5, Y + .08, 0], [X + .5, Y + .4, 0], am); L([X + .5, Y + .6, 0], [X + .5, Y + .92, 0], am); }
        }
      }
      break;
    }
    case 'ciclovia': {
      G.poly(q, '#cf5b52'); if (!det) break;
      const v = liga(0, -1) || liga(0, 1);
      if (v) { L([X + .5, Y + .1, 0], [X + .5, Y + .35, 0], '#fff', 1.4); L([X + .5, Y + .65, 0], [X + .5, Y + .9, 0], '#fff', 1.4); }
      else { L([X + .1, Y + .5, 0], [X + .35, Y + .5, 0], '#fff', 1.4); L([X + .65, Y + .5, 0], [X + .9, Y + .5, 0], '#fff', 1.4); }
      break;
    }
    case 'calcada': G.poly(q, '#dcd6c8'); if (det) { L([X, Y + .5, 0], [X + 1, Y + .5, 0], '#c9c2b2', .9); L([X + .5, Y, 0], [X + .5, Y + 1, 0], '#c9c2b2', .9); } break;
    case 'praca': G.poly(q, '#efe2c4'); if (det) { L([X + .33, Y, 0], [X + .33, Y + 1, 0], '#e0cfa9', .9); L([X + .66, Y, 0], [X + .66, Y + 1, 0], '#e0cfa9', .9); L([X, Y + .5, 0], [X + 1, Y + .5, 0], '#e0cfa9', .9); } break;
    case 'areia': G.poly(q, '#f2dc9b'); if (det) for (let i = 0; i < 4; i++) G.circ(X + .15 + h32(wx, wy, i) * .7, Y + .15 + h32(wx, wy, i + 5) * .7, 0, 1, G.c('#d9bf78')); break;
    case 'terra': G.poly(q, h32(wx, wy) < .35 ? '#b08355' : '#bb8d5f'); if (det) G.circ(X + .3 + h32(wx, wy, 2) * .4, Y + .3 + h32(wx, wy, 3) * .4, 0, 1.6, G.c('#8a6644')); break;
    case 'seco': G.poly(q, h32(wx, wy) < .3 ? '#bfae6c' : '#cbb878'); if (det) { const a = .3 + h32(wx, wy, 1) * .4; L([X + a, Y + .5, 0], [X + a - .05, Y + .5, 4], '#9b8a4c', 1.2); L([X + a, Y + .5, 0], [X + a + .06, Y + .5, 4], '#9b8a4c', 1.2); } break;
    case 'lama': G.poly(q, '#b5875a'); G.ell(X + .5, Y + .5, 0, 18, 7, G.c('#6e5a43')); if (det) G.ell(X + .44, Y + .46, 0, 7, 2.4, G.c('#94806a')); break;
    case 'estrada': {
      G.poly(q, '#a8794c'); if (!det) break;
      const n = [liga(0, -1), liga(1, 0), liga(0, 1), liga(-1, 0)];
      const v = n[0] || n[2], hz = n[1] || n[3];
      if (v || !hz) { L([X + .35, Y, 0], [X + .35, Y + 1, 0], '#8e6438', 2.2); L([X + .65, Y, 0], [X + .65, Y + 1, 0], '#8e6438', 2.2); }
      if (hz) { L([X, Y + .35, 0], [X + 1, Y + .35, 0], '#8e6438', 2.2); L([X, Y + .65, 0], [X + 1, Y + .65, 0], '#8e6438', 2.2); }
      if (h32(wx, wy) < .4) G.ell(X + .3 + h32(wx, wy, 2) * .4, Y + .5, 0, 6, 2.5, G.c('#7a6146'));
      break;
    }
    case 'esgoto': {
      G.poly(q, '#a8794c');
      const n = [liga(0, -1), liga(1, 0), liga(0, 1), liga(-1, 0)], c = [X + .5, Y + .5, 0];
      const k = n.filter(Boolean).length, ends = [[X + .5, Y], [X + 1, Y + .5], [X + .5, Y + 1], [X, Y + .5]];
      const traca = (cor, w) => { if (!k) { L([X + .5, Y + .1, 0], [X + .5, Y + .9, 0], cor, w); return; } n.forEach((on, i) => { if (on) L(c, [...ends[i], 0], cor, w); }); if (k === 1) { const i = n.indexOf(true); L(c, [ends[(i + 2) % 4][0] * .6 + c[0] * .4, ends[(i + 2) % 4][1] * .6 + c[1] * .4, 0], cor, w); } };
      traca('#5d6b2f', 9); traca('#7f8f43', 3.5);
      break;
    }
    case 'agua': case 'aguasuja': {
      const z = d.fundo, suja = t === 'aguasuja';
      const viz2 = (dx, dy) => d.liga.includes(viz(X + dx, Y + dy));
      G.poly([[X, Y, z], [X + 1, Y, z], [X + 1, Y + 1, z], [X, Y + 1, z]], suja ? '#76854a' : '#4fbde6');
      if (!viz2(-1, 0)) G.poly([[X, Y, 0], [X, Y + 1, 0], [X, Y + 1, z], [X, Y, z]], G.c('#9c7a52'));
      if (!viz2(0, -1)) G.poly([[X, Y, 0], [X + 1, Y, 0], [X + 1, Y, z], [X, Y, z]], G.c('#b58e62'));
      if (det) {
        const onda = suja ? '#93a35e' : '#9be3f7';
        if (h32(wx, wy) < .7) L([X + .2, Y + .35, z], [X + .48, Y + .35, z], onda, 1.6);
        if (h32(wx, wy, 2) < .7) L([X + .5, Y + .72, z], [X + .82, Y + .72, z], onda, 1.6);
        if (suja && h32(wx, wy, 7) < .5) { G.circ(X + .3, Y + .6, z, 2.2, G.c('#e9c46a')); G.circ(X + .7, Y + .3, z, 1.8, G.c('#d9d9d9')); }
      }
      break;
    }
    default: G.poly(q, d.cor);
  }
}

// ---------------------------------------------------------------- OBJETOS
// solido: não dá para atravessar no passeio. f: o que conta no termômetro.
const O = {};
const def = (id, nome, cats, w, d, desenho, extra = {}) => { O[id] = { id, nome, cats, w, d, desenho, ...extra }; };

function janela(G, lado, b, u, v, uw, vh) {
  const c = G.noite ? G.luz(h32(Math.round(u * 50), Math.round(v), b.X | 0) < .7 ? '#ffe39a' : '#3b4a6b') : '#9bd7f5';
  if (lado === 'L') G.faceL(b, u, v, uw, vh, c); else G.faceR(b, u, v, uw, vh, c);
}
function casaBase(G, b, o, h, cores, opt = {}) {
  const [parede, telhado] = cores; const m = opt.m ?? .14;
  const X = b.X + m, Y = b.Y + m, W = b.W - 2 * m, D = b.D - 2 * m; const bb = { X, Y, W, D };
  G.box(X, Y, W, D, h, 0, parede);
  if (!opt.semJanelas) {
    G.faceL(bb, W * .58, 0, W * .2, Math.min(15, h * .62), G.c('#7a4b2a'));
    janela(G, 'L', bb, W * .14, h * .38, W * .24, h * .3);
    janela(G, 'R', bb, D * .3, h * .38, D * .36, h * .3);
  }
  if (telhado) G.roof(X - .05, Y - .05, W + .1, D + .1, h, opt.rh ?? 16, telhado, parede, ((o.r || 0) + G.rot) % 2 === 0);
  return bb;
}

// ---- casas
def('casa', 'Casinha', ['casas'], 1, 1, (G, b, o) => casaBase(G, b, o, 24, CORES_CASA[(o.c || 0) % CORES_CASA.length]), { cores: CORES_CASA.length, f: { familias: 4, boa: 1 }, solido: true, planta: { forma: 'telhado' } });
def('sobrado', 'Sobrado', ['casas'], 1, 1, (G, b, o) => {
  const cs = CORES_CASA[(o.c || 0) % CORES_CASA.length]; const bb = casaBase(G, b, o, 44, cs, { semJanelas: true });
  G.faceL(bb, bb.W * .58, 0, bb.W * .2, 15, G.c('#7a4b2a')); janela(G, 'L', bb, bb.W * .14, 6, bb.W * .24, 9);
  janela(G, 'L', bb, bb.W * .14, 27, bb.W * .24, 9); janela(G, 'L', bb, bb.W * .55, 27, bb.W * .24, 9);
  janela(G, 'R', bb, bb.D * .3, 8, bb.D * .36, 9); janela(G, 'R', bb, bb.D * .3, 28, bb.D * .36, 9);
  G.box(bb.X - .04, bb.Y + bb.D, bb.W * .5, .1, 2, 22, '#ffffff');
}, { cores: CORES_CASA.length, f: { familias: 5, boa: 1 }, solido: true, planta: { forma: 'telhado' } });
function predio(G, b, o, andares, m = .1) {
  const cor = CORES_PREDIO[(o.c || 0) % CORES_PREDIO.length], h = andares * 18 + 8;
  const X = b.X + m, Y = b.Y + m, W = b.W - 2 * m, D = b.D - 2 * m, bb = { X, Y, W, D };
  G.box(X, Y, W, D, h, 0, cor);
  const nx = Math.max(2, Math.round(W * 3)), ny = Math.max(2, Math.round(D * 3));
  for (let a = 0; a < andares; a++) {
    for (let i = 0; i < nx; i++) janela(G, 'L', bb, W * (i + .25) / nx, 10 + a * 18, W * .5 / nx, 9);
    for (let i = 0; i < ny; i++) janela(G, 'R', bb, D * (i + .25) / ny, 10 + a * 18, D * .5 / ny, 9);
  }
  G.faceL(bb, W * .4, 0, W * .2, 8, G.c('#4a5568'));
  G.box(X + W * .55, Y + D * .2, W * .28, D * .3, 8, h, '#d6d9e0');
}
def('predinho', 'Prédio baixo', ['casas'], 1, 1, (G, b, o) => predio(G, b, o, 3), { cores: CORES_PREDIO.length, f: { familias: 12, boa: 1 }, solido: true, planta: { forma: 'laje' } });
def('predio', 'Prédio alto', ['casas'], 1, 1, (G, b, o) => predio(G, b, o, 7), { cores: CORES_PREDIO.length, f: { familias: 28, boa: 1 }, solido: true, planta: { forma: 'laje' } });
def('condominio', 'Condomínio', ['casas'], 2, 2, (G, b, o) => { predio(G, { X: b.X, Y: b.Y, W: b.W, D: b.D }, o, 5, .18); }, { cores: CORES_PREDIO.length, f: { familias: 60, boa: 1 }, solido: true, planta: { forma: 'laje' } });
const TOLDOS = ['#e63946', '#2a9d8f', '#f4a261', '#457b9d', '#8338ec'];
def('loja', 'Lojinha', ['casas', 'servicos'], 1, 1, (G, b, o) => {
  const tol = TOLDOS[(o.c || 0) % TOLDOS.length]; const m = .14, X = b.X + m, Y = b.Y + m, W = b.W - .28, D = b.D - .28, bb = { X, Y, W, D };
  G.box(X, Y, W, D, 26, 0, '#fdf6ec'); G.faceL(bb, W * .1, 0, W * .8, 14, G.noite ? G.luz('#ffe39a') : '#bfe6f7');
  G.box(X - .02, Y + D, W + .04, .16, 3, 15, tol); G.box(X, Y, W, D, 4, 26, sombra(tol, -.1));
}, { cores: TOLDOS.length, f: { comercio: 1 }, solido: true, planta: { forma: 'laje', cor: '#e63946' } });
def('mercado', 'Mercado', ['casas', 'servicos'], 2, 1, (G, b, o) => {
  const m = .1, X = b.X + m, Y = b.Y + m, W = b.W - .2, D = b.D - .2, bb = { X, Y, W, D };
  G.box(X, Y, W, D, 30, 0, '#f8f4ee'); G.faceL(bb, W * .08, 0, W * .84, 15, G.noite ? G.luz('#ffe39a') : '#bfe6f7'); G.faceR(bb, D * .1, 0, D * .8, 15, G.noite ? G.luz('#ffe39a') : '#a9d8ee');
  G.box(X - .03, Y - .03, W + .06, D + .06, 7, 30, '#2a9d8f'); G.faceL({ X: X - .03, Y: Y - .03, W: W + .06, D: D + .06 }, W * .3, 32, W * .4, 3, '#ffffff');
}, { f: { comercio: 2 }, solido: true, planta: { forma: 'laje', cor: '#2a9d8f' } });
def('igreja', 'Igreja / templo', ['casas', 'servicos'], 1, 1, (G, b, o) => {
  const bb = casaBase(G, b, o, 30, ['#fbf3e4', '#8a5a44'], { semJanelas: true, rh: 18 });
  G.faceL(bb, bb.W * .38, 0, bb.W * .26, 18, G.c('#6b4226')); janela(G, 'R', bb, bb.D * .35, 12, bb.D * .3, 12);
  G.box(bb.X + bb.W * .6, bb.Y + bb.D * .1, .22, .22, 56, 0, '#fbf3e4');
  const p = G.P(bb.X + bb.W * .6 + .11, bb.Y + bb.D * .1 + .11, 66); G.cruz(p, '#c9a227');
}, { f: { comercio: 1 }, solido: true, planta: { forma: 'telhado' } });

// ---- serviços
def('escola', 'Escola', ['servicos'], 2, 1, (G, b, o) => {
  const m = .1, X = b.X + m, Y = b.Y + m, W = b.W - .2, D = b.D - .2, bb = { X, Y, W, D };
  G.box(X, Y, W, D, 30, 0, '#ffd166');
  const n = Math.round(W * 2.2); for (let i = 0; i < n; i++) janela(G, 'L', bb, .1 + i * (W - .2) / n, 13, (W - .2) / n * .6, 10);
  janela(G, 'R', bb, D * .25, 13, D * .5, 10);
  G.faceL(bb, W * .45, 0, W * .12, 14, G.c('#3d5a80'));
  G.box(X - .05, Y - .05, W + .1, D + .1, 4, 30, '#ef476f');
  G.bandeira(G.P(X + W - .15, Y + .2, 34), '#06d6a0');
}, { f: { escola: 1 }, solido: true, planta: { forma: 'laje', cor: '#ffd166', emoji: '🏫' } });
def('creche', 'Creche', ['servicos'], 1, 1, (G, b, o) => {
  casaBase(G, b, o, 22, ['#ffe5ec', '#ff8fab']); G.circ(b.X + .82, b.Y + .5, 34, 4, G.c('#ffd166'));
}, { f: { escola: 1 }, solido: true, planta: { forma: 'telhado', emoji: '🧸' } });
def('posto', 'Posto de saúde', ['servicos'], 1, 1, (G, b, o) => {
  const m = .12, X = b.X + m, Y = b.Y + m, W = b.W - .24, D = b.D - .24, bb = { X, Y, W, D };
  G.box(X, Y, W, D, 28, 0, '#ffffff'); G.faceL(bb, W * .4, 0, W * .22, 14, G.c('#90e0ef')); janela(G, 'R', bb, D * .3, 12, D * .4, 9);
  G.box(X, Y, W, D, 3, 28, '#e63946'); const p = G.P(X + W / 2, Y + D / 2, 33); G.cruzSaude(p, '#e63946');
}, { f: { saude: 1 }, solido: true, planta: { forma: 'laje', cor: '#ffffff', emoji: '➕' } });
def('hospital', 'Hospital', ['servicos'], 2, 2, (G, b, o) => {
  const m = .12, X = b.X + m, Y = b.Y + m, W = b.W - .24, D = b.D - .24, bb = { X, Y, W, D };
  G.box(X, Y, W, D, 62, 0, '#f8fbff');
  for (let a = 0; a < 3; a++) for (let i = 0; i < 5; i++) { janela(G, 'L', bb, .1 + i * (W - .2) / 5, 12 + a * 17, (W - .2) / 5 * .6, 9); janela(G, 'R', bb, .1 + i * (D - .2) / 5, 12 + a * 17, (D - .2) / 5 * .6, 9); }
  G.box(X + W * .3, Y + D * .3, W * .4, D * .4, 4, 62, '#e63946'); G.cruzSaude(G.P(X + W / 2, Y + D / 2, 70), '#ffffff');
}, { f: { saude: 2 }, solido: true, planta: { forma: 'laje', cor: '#f8fbff', emoji: '🏥' } });
def('policia', 'Polícia', ['servicos'], 1, 1, (G, b, o) => {
  const m = .12, X = b.X + m, Y = b.Y + m, W = b.W - .24, D = b.D - .24, bb = { X, Y, W, D };
  G.box(X, Y, W, D, 26, 0, '#dbe7ff'); G.faceL(bb, W * .4, 0, W * .22, 14, G.c('#1d3557')); janela(G, 'R', bb, D * .3, 12, D * .4, 9);
  G.box(X - .03, Y - .03, W + .06, D + .06, 5, 26, '#1d3557'); G.circ(X + W / 2, Y + D / 2, 38, 4, G.noite ? G.luz('#4cc9f0') : '#4cc9f0');
}, { f: { seguranca: 1 }, solido: true, planta: { forma: 'laje', cor: '#1d3557', emoji: '🚓' } });
def('bombeiros', 'Bombeiros', ['servicos'], 1, 1, (G, b, o) => {
  const m = .1, X = b.X + m, Y = b.Y + m, W = b.W - .2, D = b.D - .2, bb = { X, Y, W, D };
  G.box(X, Y, W, D, 30, 0, '#e63946'); G.faceL(bb, W * .15, 0, W * .7, 20, G.c('#f1f1f1')); G.box(X, Y, W, D, 4, 30, '#b5172a');
}, { f: { seguranca: 1 }, solido: true, planta: { forma: 'laje', cor: '#e63946', emoji: '🚒' } });
def('estacao', 'Tratamento de água', ['servicos'], 2, 2, (G, b, o) => {
  G.box(b.X + .15, b.Y + .15, .7, .5, 22, 0, '#e9edf2'); janela(G, 'L', { X: b.X + .15, Y: b.Y + .15, W: .7, D: .5 }, .2, 8, .3, 8);
  [[1.2, .5], [.6, 1.3], [1.35, 1.35]].forEach(([a, c]) => { G.cilindro(b.X + a, b.Y + c, .32, 20, '#4ea8de'); G.ell(b.X + a, b.Y + c, 20, 18, 9, G.c('#90e0ef')); });
}, { f: { agua: 1 }, solido: true, planta: { forma: 'laje', cor: '#4ea8de', emoji: '💧' } });
def('caixa', "Caixa d'água", ['servicos'], 1, 1, (G, b) => { G.box(b.X + .4, b.Y + .4, .2, .2, 30, 0, '#7b8794'); G.cilindro(b.X + .5, b.Y + .5, .3, 14, '#4ea8de', 30); }, { f: { caixa: 1 }, solido: true, planta: { forma: 'circulo', cor: '#4ea8de' } });
def('coleta', 'Coleta seletiva', ['servicos'], 1, 1, (G, b) => { ['#2a9d8f', '#e9c46a', '#e76f51', '#457b9d'].forEach((c, i) => G.box(b.X + .15 + i * .18, b.Y + .4, .15, .22, 12, 0, c)); }, { f: { coleta: 1 }, planta: { forma: 'quad', cor: '#2a9d8f', emoji: '♻️' } });
def('ponto', 'Ponto de ônibus', ['servicos', 'pessoas'], 1, 1, (G, b) => {
  G.box(b.X + .2, b.Y + .62, .6, .06, 18, 0, '#cfe8ff', { left: G.c('#b8dcff') }); G.box(b.X + .15, b.Y + .4, .7, .32, 3, 20, '#457b9d'); G.box(b.X + .25, b.Y + .5, .5, .1, 5, 0, '#8d6e63');
}, { f: { transporte: 1 }, planta: { forma: 'quad', cor: '#457b9d', emoji: '🚏' } });
def('poste', 'Poste de luz', ['servicos'], 1, 1, (G, b) => {
  const a = G.P(b.X + .5, b.Y + .5, 0), t = G.P(b.X + .5, b.Y + .5, 46);
  G.linhaTela(a, t, '#4a4f5c', 2.4); G.circTela(t, 4.5, G.noite ? G.luz('#fff3b0') : '#ffe27a'); if (G.noite) G.brilho(t, 70, 'rgba(255,220,120,.35)');
}, { f: { luz: 1 }, fino: true, planta: { forma: 'ponto', cor: '#ffd166' } });

// ---- natureza
const arvoreR = (cor) => (G, b, o) => {
  const k = 1 + ((o.c || 0) % 3) * .12, x = b.X + .5, y = b.Y + .5;
  G.ell(x, y, 0, 12 * k, 5.5 * k, 'rgba(0,0,0,.13)');
  G.box(x - .04, y - .04, .08, .08, 18 * k, 0, '#8b5a2b');
  G.circ(x, y, 28 * k, 15 * k, G.c(cor)); G.circ(x - .08, y - .08, 33 * k, 7 * k, G.c(sombra(cor, .25)));
};
def('arvore', 'Árvore', ['natureza'], 1, 1, arvoreR('#3fa34d'), { cores: 3, f: { arvore: 1 }, planta: { forma: 'copa', cor: '#3fa34d' } });
def('ipe-rosa', 'Ipê rosa', ['natureza'], 1, 1, arvoreR('#ff8fab'), { cores: 3, f: { arvore: 1 }, planta: { forma: 'copa', cor: '#ff8fab' } });
def('ipe-amarelo', 'Ipê amarelo', ['natureza'], 1, 1, arvoreR('#ffd23f'), { cores: 3, f: { arvore: 1 }, planta: { forma: 'copa', cor: '#ffd23f' } });
def('pinheiro', 'Pinheiro', ['natureza'], 1, 1, (G, b) => {
  const x = b.X + .5, y = b.Y + .5; G.ell(x, y, 0, 10, 4.5, 'rgba(0,0,0,.13)'); G.box(x - .04, y - .04, .08, .08, 12, 0, '#7a4b2a');
  G.cone(x, y, 10, 50, 14, '#2e8b57');
}, { f: { arvore: 1 }, planta: { forma: 'copa', cor: '#2e8b57' } });
def('palmeira', 'Palmeira', ['natureza'], 1, 1, (G, b) => {
  const x = b.X + .5, y = b.Y + .5, a = G.P(x, y, 0), t = G.P(x, y, 44); G.linhaTela(a, t, '#9c6b3c', 4 * G.s / G.s);
  G.folhas(t, '#2d9c4a');
}, { f: { arvore: 1 }, planta: { forma: 'copa', cor: '#2d9c4a' } });
def('arbusto', 'Arbusto', ['natureza'], 1, 1, (G, b) => { [[.35, .4], [.6, .55], [.45, .65]].forEach(([u, v]) => G.circ(b.X + u, b.Y + v, 7, 8, G.c('#4caf50'))); }, { f: { verde: 1 }, planta: { forma: 'copa', cor: '#4caf50' } });
def('horta', 'Horta', ['natureza'], 1, 1, (G, b) => {
  G.box(b.X + .1, b.Y + .1, .8, .8, 4, 0, '#7a5230');
  for (let i = 0; i < 3; i++) for (let j = 0; j < 3; j++) G.circ(b.X + .25 + i * .25, b.Y + .25 + j * .25, 7, 4, G.c(j === 1 ? '#e63946' : '#5cb85c'));
}, { f: { verde: 1 }, planta: { forma: 'quad', cor: '#5cb85c', emoji: '🥬' } });
def('pedra', 'Pedras', ['natureza'], 1, 1, (G, b) => { G.circ(b.X + .4, b.Y + .5, 4, 7, G.c('#a0a4a8')); G.circ(b.X + .6, b.Y + .4, 3, 5, G.c('#b8bcc0')); }, { planta: { forma: 'circulo', cor: '#a0a4a8' } });

// ---- lazer
def('banco', 'Banco de praça', ['lazer'], 1, 1, (G, b) => { G.box(b.X + .22, b.Y + .42, .56, .18, 6, 0, '#c47a3a'); G.box(b.X + .22, b.Y + .42, .56, .04, 12, 0, '#a5612a'); }, { f: { lazer: .5 }, planta: { forma: 'quad', cor: '#c47a3a' } });
def('parquinho', 'Balanço', ['lazer'], 1, 1, (G, b) => {
  const a = G.P(b.X + .2, b.Y + .5, 0), c = G.P(b.X + .8, b.Y + .5, 0), k = G.s;
  G.trave(a, c, k);
}, { f: { lazer: 1 }, planta: { forma: 'quad', cor: '#e63946', emoji: '🎠' } });
def('escorregador', 'Escorregador', ['lazer'], 1, 1, (G, b) => {
  G.box(b.X + .2, b.Y + .3, .25, .25, 22, 0, '#ffb703'); G.poly([[b.X + .45, b.Y + .32, 22], [b.X + .9, b.Y + .32, 0], [b.X + .9, b.Y + .52, 0], [b.X + .45, b.Y + .52, 22]], G.c('#219ebc'));
}, { f: { lazer: 1 }, planta: { forma: 'quad', cor: '#219ebc', emoji: '🛝' } });
def('fonte', 'Fonte', ['lazer'], 1, 1, (G, b) => {
  G.cilindro(b.X + .5, b.Y + .5, .4, 6, '#cfd4da'); G.ell(b.X + .5, b.Y + .5, 6, 22, 11, G.c('#7fd3f2')); G.cilindro(b.X + .5, b.Y + .5, .07, 18, '#cfd4da', 6); G.circ(b.X + .5, b.Y + .5, 26, 5, G.c('#bdeeff'));
}, { f: { lazer: 1 }, planta: { forma: 'circulo', cor: '#7fd3f2' } });
def('mesa', 'Mesa de piquenique', ['lazer'], 1, 1, (G, b) => { G.box(b.X + .25, b.Y + .3, .5, .4, 3, 9, '#b07040'); G.box(b.X + .45, b.Y + .45, .1, .1, 9, 0, '#8a5a30'); G.box(b.X + .25, b.Y + .18, .5, .08, 5, 0, '#b07040'); G.box(b.X + .25, b.Y + .76, .5, .08, 5, 0, '#b07040'); }, { f: { lazer: .5 }, planta: { forma: 'quad', cor: '#b07040' } });
def('quadra', 'Quadra de esportes', ['lazer'], 2, 2, (G, b) => {
  const X = b.X + .1, Y = b.Y + .1, W = b.W - .2, D = b.D - .2;
  G.poly([[X, Y, 1], [X + W, Y, 1], [X + W, Y + D, 1], [X, Y + D, 1]], G.c('#3a86ff'));
  G.poly([[X + .1, Y + .1, 1], [X + W - .1, Y + .1, 1], [X + W - .1, Y + D - .1, 1], [X + .1, Y + D - .1, 1]], null, '#ffffff');
  G.line([X + W / 2, Y + .1, 1], [X + W / 2, Y + D - .1, 1], '#ffffff', 1.5); G.ell(X + W / 2, Y + D / 2, 1, 14, 7, null, '#ffffff');
  G.box(X + .15, Y + D / 2 - .05, .05, .1, 26, 0, '#e5e5e5'); G.box(X + W - .2, Y + D / 2 - .05, .05, .1, 26, 0, '#e5e5e5');
}, { f: { lazer: 2 }, chato: true, planta: { forma: 'quad', cor: '#3a86ff', emoji: '🏀' } });
def('campo', 'Campo de futebol', ['lazer'], 3, 2, (G, b) => {
  const X = b.X + .1, Y = b.Y + .1, W = b.W - .2, D = b.D - .2;
  G.poly([[X, Y, 1], [X + W, Y, 1], [X + W, Y + D, 1], [X, Y + D, 1]], G.c('#4caf50'));
  for (let i = 0; i < 6; i++) if (i % 2) { const a = W > D; G.poly(a ? [[X + i * W / 6, Y, 1], [X + (i + 1) * W / 6, Y, 1], [X + (i + 1) * W / 6, Y + D, 1], [X + i * W / 6, Y + D, 1]] : [[X, Y + i * D / 6, 1], [X + W, Y + i * D / 6, 1], [X + W, Y + (i + 1) * D / 6, 1], [X, Y + (i + 1) * D / 6, 1]], G.c('#43a047')); }
  G.poly([[X + .1, Y + .1, 1], [X + W - .1, Y + .1, 1], [X + W - .1, Y + D - .1, 1], [X + .1, Y + D - .1, 1]], null, '#ffffff');
  if (W > D) G.line([X + W / 2, Y + .1, 1], [X + W / 2, Y + D - .1, 1], '#fff', 1.5); else G.line([X + .1, Y + D / 2, 1], [X + W - .1, Y + D / 2, 1], '#fff', 1.5);
  G.ell(X + W / 2, Y + D / 2, 1, 16, 8, null, '#ffffff');
}, { f: { lazer: 3 }, chato: true, planta: { forma: 'quad', cor: '#4caf50', emoji: '⚽' } });

// ---- pessoas e veículos
def('pessoa', 'Pessoa', ['pessoas'], 1, 1, (G, b, o) => {
  const c = o.c || 0, pos = [[.5, .5]]; pos.forEach(([u, v]) => G.boneco(b.X + u, b.Y + v, CORES_ROUPA[c % CORES_ROUPA.length], PELES[c % PELES.length], 1));
}, { cores: CORES_ROUPA.length, f: { pessoa: 1 }, fino: true, planta: { forma: 'ponto', cor: '#ff6b6b' } });
def('familia', 'Família', ['pessoas'], 1, 1, (G, b, o) => {
  const c = o.c || 0; G.boneco(b.X + .35, b.Y + .45, CORES_ROUPA[c % 8], PELES[c % 5], 1); G.boneco(b.X + .62, b.Y + .4, CORES_ROUPA[(c + 3) % 8], PELES[(c + 1) % 5], 1); G.boneco(b.X + .5, b.Y + .65, CORES_ROUPA[(c + 5) % 8], PELES[c % 5], .7);
}, { cores: CORES_ROUPA.length, f: { pessoa: 3 }, fino: true, planta: { forma: 'ponto', cor: '#4361ee' } });
def('crianca', 'Crianças brincando', ['pessoas', 'lazer'], 1, 1, (G, b, o) => {
  const c = o.c || 0; G.boneco(b.X + .35, b.Y + .5, CORES_ROUPA[(c + 1) % 8], PELES[(c + 2) % 5], .7); G.boneco(b.X + .65, b.Y + .5, CORES_ROUPA[(c + 4) % 8], PELES[c % 5], .7); G.circ(b.X + .5, b.Y + .7, 3, 3, G.c('#ffffff'));
}, { cores: CORES_ROUPA.length, f: { pessoa: 2 }, fino: true, planta: { forma: 'ponto', cor: '#ffb703' } });
def('cachorro', 'Cachorro', ['pessoas'], 1, 1, (G, b) => { G.box(b.X + .4, b.Y + .45, .22, .1, 6, 3, '#c68642'); G.box(b.X + .58, b.Y + .45, .1, .1, 6, 7, '#a0522d'); }, { f: { animal: 1 }, fino: true, planta: { forma: 'ponto', cor: '#c68642' } });
def('gato', 'Gato', ['pessoas'], 1, 1, (G, b) => { G.box(b.X + .42, b.Y + .46, .16, .08, 5, 2, '#6c757d'); G.circ(b.X + .6, b.Y + .5, 9, 3, G.c('#6c757d')); }, { f: { animal: 1 }, fino: true, planta: { forma: 'ponto', cor: '#6c757d' } });
def('pato', 'Patinhos', ['pessoas', 'natureza'], 1, 1, (G, b) => { [[.35, .4], [.62, .6]].forEach(([u, v]) => G.pato(b.X + u, b.Y + v)); }, { f: { animal: 1 }, fino: true, agua: true, planta: { forma: 'ponto', cor: '#ffffff' } });
def('carro', 'Carro', ['pessoas'], 1, 1, (G, b, o) => {
  const cor = CORES_CARRO[(o.c || 0) % CORES_CARRO.length], al = ((o.r || 0) + G.rot) % 2 === 0;
  if (al) { G.box(b.X + .18, b.Y + .32, .64, .36, 8, 2, cor); G.box(b.X + .32, b.Y + .36, .34, .28, 7, 10, G.noite ? G.luz('#ffe39a') : '#d8f1ff'); }
  else { G.box(b.X + .32, b.Y + .18, .36, .64, 8, 2, cor); G.box(b.X + .36, b.Y + .32, .28, .34, 7, 10, G.noite ? G.luz('#ffe39a') : '#d8f1ff'); }
}, { cores: CORES_CARRO.length, f: { veiculo: 1 }, fino: true, planta: { forma: 'carro' } });
def('onibus', 'Ônibus', ['pessoas'], 1, 1, (G, b, o) => {
  const al = ((o.r || 0) + G.rot) % 2 === 0, bb = al ? { X: b.X + .05, Y: b.Y + .3, W: .9, D: .4 } : { X: b.X + .3, Y: b.Y + .05, W: .4, D: .9 };
  G.box(bb.X, bb.Y, bb.W, bb.D, 22, 2, '#ffb703'); for (let i = 0; i < 4; i++) { if (al) janela(G, 'L', bb, .08 + i * .2, 12, .14, 8); else janela(G, 'R', bb, .08 + i * .2, 12, .14, 8); }
}, { f: { transporte: 1, veiculo: 1 }, fino: true, planta: { forma: 'carro', cor: '#ffb703' } });
def('bicicleta', 'Bicicleta', ['pessoas', 'lazer'], 1, 1, (G, b) => { G.ell(b.X + .38, b.Y + .5, 5, 5, 5, null, '#333'); G.ell(b.X + .62, b.Y + .5, 5, 5, 5, null, '#333'); G.line([b.X + .38, b.Y + .5, 5], [b.X + .62, b.Y + .5, 5], '#e63946', 2); G.boneco(b.X + .5, b.Y + .5, '#06d6a0', '#c68642', .8, 6); }, { f: { transporte: .5 }, fino: true, planta: { forma: 'ponto', cor: '#e63946' } });
def('caminhao', 'Caminhão de lixo', ['pessoas', 'servicos'], 1, 1, (G, b, o) => {
  const al = ((o.r || 0) + G.rot) % 2 === 0;
  if (al) { G.box(b.X + .1, b.Y + .3, .55, .4, 20, 2, '#2a9d8f'); G.box(b.X + .65, b.Y + .32, .25, .36, 14, 2, '#f1f1f1'); }
  else { G.box(b.X + .3, b.Y + .1, .4, .55, 20, 2, '#2a9d8f'); G.box(b.X + .32, b.Y + .65, .36, .25, 14, 2, '#f1f1f1'); }
}, { f: { coleta: 1, veiculo: 1 }, fino: true, planta: { forma: 'carro', cor: '#2a9d8f' } });

// ---- problemas
const BARRACO = ['#b08968', '#a3b18a', '#c9a27e', '#8d99ae', '#b5838d', '#9c6644'];
def('barraco', 'Barraco', ['problemas', 'casas'], 1, 1, (G, b, o) => {
  const cor = BARRACO[(o.c || 0) % BARRACO.length], X = b.X + .16, Y = b.Y + .16, W = .68, D = .68, h = 19, bb = { X, Y, W, D };
  G.box(X, Y, W, D, h, 0, cor, { right: G.c(sombra(cor, -.3)) });
  G.faceL(bb, .4, 0, .17, 12, G.c('#3b2f2a')); G.faceR(bb, .2, 8, .24, 6, G.c('#2b2b2b')); G.faceL(bb, .05, 3, .2, 6, G.c('#9c9c9c'));
  G.poly([[X - .1, Y + D + .1, h - 2], [X + W + .12, Y + D + .1, h + 1], [X + W + .12, Y - .1, h + 7], [X - .1, Y - .1, h + 5]], G.c('#9aa3a8'));
  G.poly([[X + .3, Y + D + .1, h - 1], [X + .55, Y + D + .1, h], [X + .55, Y - .1, h + 6], [X + .3, Y - .1, h + 5]], G.c('#b4542f'));
  G.line([X + .1, Y + D, 15], [X + .25, Y + D, 8], '#3b2f2a', 1); G.line([X + .25, Y + D, 8], [X + .2, Y + D, 2], '#3b2f2a', 1);
}, { cores: BARRACO.length, f: { familias: 5, ruim: 1 }, solido: true, planta: { forma: 'telhado', cor: '#9aa3a8' } });
def('ruina', 'Casa caindo', ['problemas', 'casas'], 1, 1, (G, b) => {
  const X = b.X + .12, Y = b.Y + .12, W = .76, D = .76;
  G.poly([[X, Y + D, 0], [X + W, Y + D, 0], [X + W, Y + D, 13], [X + .6, Y + D, 22], [X + .3, Y + D, 10], [X, Y + D, 17]], G.c('#c9b8a3'));
  G.poly([[X + W, Y, 0], [X + W, Y + D, 0], [X + W, Y + D, 13], [X + W, Y + .3, 20], [X + W, Y, 9]], G.c('#a8977f'));
  G.faceL({ X, Y, W, D }, .1, 3, .16, 7, G.c('#3b2f2a'));
  [[.3, .2], [.5, .5], [.2, .6]].forEach(([u, v]) => G.box(X + u, Y + v, .12, .08, 3, 0, '#9b8a75'));
}, { f: { familias: 3, ruim: 1, risco: 1 }, solido: true, planta: { forma: 'quad', cor: '#a8977f', emoji: '🏚️' } });
def('lixo', 'Lixo na rua', ['problemas'], 1, 1, (G, b) => {
  const x = b.X + .5, y = b.Y + .5; G.ell(x, y, 0, 16, 7, G.c('#5b4a3a'), null, .5);
  [['#3a3a3a', -.15, .05, 7], ['#2d6a4f', .08, -.1, 6], ['#e9c46a', -.05, -.05, 4, 6], ['#3a3a3a', .15, .1, 6], ['#e76f51', -.2, -.15, 3, 5], ['#d9d9d9', .1, -.2, 3.5, 6]].forEach(([c, dx, dy, r, z = 3]) => G.circ(x + dx, y + dy, z + r * .5, r, G.c(c)));
  if (!G.noite) [[-6, -24], [3, -28], [9, -20]].forEach(([dx, dy]) => { const p = G.P(x, y, 0); G.circTela([p[0] + dx * G.s, p[1] + dy * G.s], 1.1, '#222'); });
}, { f: { lixo: 1 }, fino: true, planta: { forma: 'circulo', cor: '#5b4a3a', emoji: '🗑️' } });
def('entulho', 'Entulho', ['problemas'], 1, 1, (G, b) => { [[.3, .4, '#a8a29e'], [.5, .5, '#c2b8a3'], [.6, .3, '#8d8478'], [.4, .62, '#b4542f']].forEach(([u, v, c]) => G.box(b.X + u, b.Y + v, .18, .14, 6 + u * 10, 0, c)); }, { f: { lixo: .7 }, planta: { forma: 'quad', cor: '#a8a29e' } });
def('pneu', 'Pneus velhos', ['problemas'], 1, 1, (G, b) => { G.ell(b.X + .4, b.Y + .5, 3, 8, 4, null, '#222', 1, 3); G.ell(b.X + .62, b.Y + .45, 3, 7, 3.5, null, '#222', 1, 3); G.ell(b.X + .5, b.Y + .5, 8, 8, 4, null, '#2b2b2b', 1, 3); }, { f: { lixo: .5, dengue: 1 }, fino: true, planta: { forma: 'ponto', cor: '#222' } });
def('arvoreseca', 'Árvore seca', ['problemas', 'natureza'], 1, 1, (G, b) => {
  const p = G.P(b.X + .5, b.Y + .5, 0), k = G.s; G.galhos(p, k);
}, { f: { seca: 1 }, fino: true, planta: { forma: 'ponto', cor: '#6b4f36' } });
def('fogo', 'Fogo / fumaça', ['problemas'], 1, 1, (G, b) => { G.fogo(G.P(b.X + .5, b.Y + .5, 0)); }, { f: { lixo: 1, fogo: 1 }, fino: true, planta: { forma: 'circulo', cor: '#ff7b00', emoji: '🔥' } });
def('postequebrado', 'Poste quebrado', ['problemas'], 1, 1, (G, b) => { const a = G.P(b.X + .5, b.Y + .5, 0), t = G.P(b.X + .5, b.Y + .5, 28); G.linhaTela(a, t, '#4a4f5c', 2.4); G.linhaTela(t, [t[0] + 14 * G.s, t[1] + 10 * G.s], '#4a4f5c', 2.4); G.circTela([t[0] + 15 * G.s, t[1] + 11 * G.s], 3.5, '#555'); }, { f: { escuro: 1 }, fino: true, planta: { forma: 'ponto', cor: '#555' } });
def('abandonado', 'Carro abandonado', ['problemas'], 1, 1, (G, b) => { G.box(b.X + .18, b.Y + .32, .64, .36, 7, 0, '#8d7b68'); G.box(b.X + .32, b.Y + .36, .3, .28, 5, 7, '#5c5c5c'); G.circ(b.X + .3, b.Y + .5, 12, 3, G.c('#b4542f')); }, { f: { lixo: .7 }, fino: true, planta: { forma: 'carro', cor: '#8d7b68' } });
def('rato', 'Ratos', ['problemas'], 1, 1, (G, b) => { [[.4, .5], [.6, .4]].forEach(([u, v]) => { G.ell(b.X + u, b.Y + v, 3, 5, 3, G.c('#6d6875')); G.line([b.X + u - .05, b.Y + v, 2], [b.X + u - .15, b.Y + v + .05, 1], '#6d6875', 1); }); }, { f: { lixo: .5 }, fino: true, planta: { forma: 'ponto', cor: '#6d6875' } });
def('buraco', 'Buraco na rua', ['problemas'], 1, 1, (G, b) => { G.ell(b.X + .5, b.Y + .5, 0, 14, 6, G.c('#2f2f35')); G.ell(b.X + .52, b.Y + .52, 0, 8, 3, G.c('#6e5a43')); }, { f: { buraco: 1 }, chato: true, planta: { forma: 'circulo', cor: '#2f2f35' } });
def('fiacao', 'Gato de luz (fios)', ['problemas'], 1, 1, (G, b) => {
  const a = G.P(b.X + .3, b.Y + .5, 0), t = G.P(b.X + .3, b.Y + .5, 40); G.linhaTela(a, t, '#6b4f36', 2.6);
  for (let i = 0; i < 4; i++) { const e = G.P(b.X + .9, b.Y + .1 + i * .25, 14 + i * 3); G.curvaTela(t, e, '#222', 1); }
}, { f: { risco: 1, escuro: .5 }, fino: true, planta: { forma: 'ponto', cor: '#222' } });

export const OBJETOS = O;
export const TODAS = [
  ...Object.entries(CHAOS).map(([id, d]) => ({ id, tipo: 'chao', ...d })),
  ...Object.values(O).map((d) => ({ ...d, tipo: 'obj' })),
];
export const peca = (id) => O[id] ? { ...O[id], tipo: 'obj' } : CHAOS[id] ? { id, tipo: 'chao', ...CHAOS[id] } : null;

// Palavras extras para a busca de peças
export const SINONIMOS = {
  casa: 'moradia lar residencia', predio: 'apartamento edificio', escola: 'colegio estudo educacao', posto: 'saude medico ubs',
  hospital: 'saude medico', arvore: 'planta verde mata', agua: 'lago rio represa', rua: 'asfalto avenida pista',
  estrada: 'chao de terra sem asfalto', esgoto: 'vala valeta sujeira', lixo: 'sujeira entulho', barraco: 'favela pobre',
  pessoa: 'gente morador', parquinho: 'brinquedo crianca balanço', quadra: 'esporte basquete volei', campo: 'futebol bola',
  caixa: 'agua tratada', estacao: 'agua tratada saneamento', coleta: 'reciclagem lixeira',
};
