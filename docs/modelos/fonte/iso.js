// Motor isométrico simples (SVG) para os modelos do Bairro Ideal
const TW = 56, TH = 28, ZH = 1;

function mk(ox, oy, s = 1) {
  const P = (x, y, z = 0) => [ox + (x - y) * TW / 2 * s, oy + (x + y) * TH / 2 * s - z * ZH * s];
  const pts = (arr) => arr.map((p) => P(...p).map((n) => n.toFixed(1)).join(',')).join(' ');
  return { P, pts, s };
}
const poly = (pts, fill, extra = '') => `<polygon points="${pts}" fill="${fill}" ${extra}/>`;
function shade(hex, f) {
  const n = parseInt(hex.slice(1), 16); let r = n >> 16, g = (n >> 8) & 255, b = n & 255;
  const t = f < 0 ? 0 : 255, p = Math.abs(f);
  r = Math.round((t - r) * p + r); g = Math.round((t - g) * p + g); b = Math.round((t - b) * p + b);
  return '#' + ((1 << 24) + (r << 16) + (g << 8) + b).toString(16).slice(1);
}

function box(G, x, y, w, d, h, z0, col, o = {}) {
  const { pts } = G; let s = '';
  s += poly(pts([[x, y + d, z0], [x + w, y + d, z0], [x + w, y + d, z0 + h], [x, y + d, z0 + h]]), o.left || shade(col, -0.12));
  s += poly(pts([[x + w, y, z0], [x + w, y + d, z0], [x + w, y + d, z0 + h], [x + w, y, z0 + h]]), o.right || shade(col, -0.28));
  if (!o.noTop) s += poly(pts([[x, y, z0 + h], [x + w, y, z0 + h], [x + w, y + d, z0 + h], [x, y + d, z0 + h]]), o.top || col);
  return s;
}
// janela na face esquerda (y = y+d), u ao longo de x
function winL(G, x, y, d, u, v, ww, wh, c) {
  const Y = y + d; return poly(G.pts([[x + u, Y, v], [x + u + ww, Y, v], [x + u + ww, Y, v + wh], [x + u, Y, v + wh]]), c);
}
function winR(G, x, w, y, u, v, ww, wh, c) {
  const X = x + w; return poly(G.pts([[X, y + u, v], [X, y + u + ww, v], [X, y + u + ww, v + wh], [X, y + u, v + wh]]), c);
}

const pal = {
  grass: '#93d27c', grass2: '#86c970', road: '#5d6577', side: '#d9d4c7', water: '#5cc3e8', water2: '#8fdcf3',
  plaza: '#efe3c8', dirt: '#b98b5e', dirt2: '#a97d52', mud: '#7a6146', sewer: '#6b7a3a', dry: '#c9b77a',
};

function tile(G, x, y, t) {
  const { pts, P } = G; let s = '';
  const q = pts([[x, y], [x + 1, y], [x + 1, y + 1], [x, y + 1]]);
  const L = (a, b, c, w = 1.4, dash = '') => { const p1 = P(...a), p2 = P(...b); return `<line x1="${p1[0]}" y1="${p1[1]}" x2="${p2[0]}" y2="${p2[1]}" stroke="${c}" stroke-width="${w * G.s}" ${dash} stroke-linecap="round"/>`; };
  switch (t) {
    case 'g': s += poly(q, (x * 7 + y * 3) % 5 === 0 ? pal.grass2 : pal.grass); break;
    case 'f': s += poly(q, pal.grass);
      [[.25, .3, '#ff6fa5'], [.6, .25, '#ffd23f'], [.4, .65, '#ffffff'], [.75, .6, '#ff8a4c'], [.2, .75, '#c77dff'], [.55, .45, '#ff6fa5']].forEach(([a, b, c]) => { const p = P(x + a, y + b, 1); s += `<circle cx="${p[0]}" cy="${p[1]}" r="${2.6 * G.s}" fill="${c}"/>`; });
      break;
    case 'r': s += poly(q, pal.road) + L([x + .1, y + .5], [x + .4, y + .5], '#f4e9b0') + L([x + .6, y + .5], [x + .9, y + .5], '#f4e9b0'); break;
    case 'R': s += poly(q, pal.road) + L([x + .5, y + .1], [x + .5, y + .4], '#f4e9b0') + L([x + .5, y + .6], [x + .5, y + .9], '#f4e9b0'); break;
    case '+': s += poly(q, pal.road);
      for (let i = 0; i < 4; i++) s += L([x + .15 + i * .2, y + .08], [x + .15 + i * .2, y + .22], '#fff', 2.2);
      break;
    case 's': s += poly(q, pal.side) + L([x, y + .5], [x + 1, y + .5], '#c6c0b0', .8) + L([x + .5, y], [x + .5, y + 1], '#c6c0b0', .8); break;
    case 'p': s += poly(q, pal.plaza) + L([x + .33, y], [x + .33, y + 1], '#e0d0ae', .8) + L([x + .66, y], [x + .66, y + 1], '#e0d0ae', .8) + L([x, y + .5], [x + 1, y + .5], '#e0d0ae', .8); break;
    case 'w': s += poly(pts([[x, y, -3], [x + 1, y, -3], [x + 1, y + 1, -3], [x, y + 1, -3]]), pal.water)
      + L([x + .2, y + .35, -3], [x + .5, y + .35, -3], pal.water2, 1.6) + L([x + .45, y + .7, -3], [x + .8, y + .7, -3], pal.water2, 1.6); break;
    case 'd': s += poly(q, (x + y) % 3 === 0 ? pal.dirt2 : pal.dirt);
      { const p = P(x + .3, y + .4); s += `<circle cx="${p[0]}" cy="${p[1]}" r="${1.4 * G.s}" fill="#8a6644"/>`; } break;
    case 'm': s += poly(q, pal.dirt); { const p = P(x + .5, y + .5); s += `<ellipse cx="${p[0]}" cy="${p[1]}" rx="${14 * G.s}" ry="${6 * G.s}" fill="#6e5a43" opacity=".9"/><ellipse cx="${p[0] - 3 * G.s}" cy="${p[1] - 1 * G.s}" rx="${6 * G.s}" ry="${2 * G.s}" fill="#8f7a5f"/>`; } break;
    case 'e': s += poly(q, pal.dirt) + L([x + .5, y], [x + .5, y + 1], pal.sewer, 7) + L([x + .5, y + .1], [x + .5, y + .9], '#8a9a4a', 2); break;
    case 'y': s += poly(q, (x * 5 + y) % 4 === 0 ? '#b9a868' : pal.dry); break;
  }
  return s;
}

// Objetos
const OBJ = {
  casa(G, o) {
    const { x, y, w = 1, d = 1, cor = '#fff3e0', telhado = '#e2603f' } = o; const h = o.h || 22, r = 14;
    const X = x + .12, Y = y + .12, W = w - .24, D = d - .24, ym = Y + D / 2; let s = '';
    s += box(G, X, Y, W, D, h, 0, cor);
    s += winL(G, X, Y, D, W * .55, 0, W * .2, 13, '#7a4b2a');
    s += winL(G, X, Y, D, W * .15, 7, W * .22, 8, '#8fd3f5');
    s += winR(G, X, W, Y, D * .3, 8, D * .35, 8, '#8fd3f5');
    s += poly(G.pts([[X - .05, Y + D + .05, h], [X + W + .05, Y + D + .05, h], [X + W + .05, ym, h + r], [X - .05, ym, h + r]]), telhado);
    s += poly(G.pts([[X + W, Y, h], [X + W, Y + D, h], [X + W, ym, h + r]]), shade(cor, -0.2));
    s += poly(G.pts([[X + W + .05, Y - .05, h], [X + W + .05, ym, h + r], [X - .05, ym, h + r], [X - .05, Y - .05, h]]), shade(telhado, -.15), 'opacity=".0"');
    return s;
  },
  predio(G, o) {
    const { x, y, w = 1, d = 1, cor = '#a9c7ff', andares = 5 } = o; const X = x + .1, Y = y + .1, W = w - .2, D = d - .2, h = andares * 16 + 6; let s = '';
    s += box(G, X, Y, W, D, h, 0, cor);
    for (let a = 0; a < andares; a++) for (let i = 0; i < 3; i++) {
      s += winL(G, X, Y, D, W * (.1 + i * .3), 8 + a * 16, W * .2, 8, '#eaf6ff');
      s += winR(G, X, W, Y, D * (.1 + i * .3), 8 + a * 16, D * .2, 8, '#cfe6ff');
    }
    s += box(G, X + W * .55, Y + D * .2, W * .3, D * .3, 7, h, '#d6d9e0');
    return s;
  },
  escola(G, o) {
    const { x, y } = o; const X = x + .1, Y = y + .1, W = 1.8, D = .8, h = 26; let s = '';
    s += box(G, X, Y, W, D, h, 0, '#ffd166');
    for (let i = 0; i < 4; i++) s += winL(G, X, Y, D, .1 + i * .42, 11, .25, 9, '#8fd3f5');
    s += winL(G, X, Y, D, .78, 0, .24, 13, '#3d5a80');
    s += box(G, X - .05, Y - .05, W + .1, D + .1, 3, h, '#ef476f');
    const p = G.P(X + W - .15, Y + .2, h + 3), t = G.P(X + W - .15, Y + .2, h + 30);
    s += `<line x1="${p[0]}" y1="${p[1]}" x2="${t[0]}" y2="${t[1]}" stroke="#555" stroke-width="${1.5 * G.s}"/><path d="M${t[0]},${t[1]} l${14 * G.s},${4 * G.s} l${-14 * G.s},${4 * G.s}z" fill="#06d6a0"/>`;
    return s;
  },
  arvore(G, o) {
    const { x, y, cor = '#3fa34d', tam = 1 } = o; const b = G.P(x + .5, y + .5), s0 = G.s * tam; let s = '';
    s += `<ellipse cx="${b[0]}" cy="${b[1]}" rx="${11 * s0}" ry="${5 * s0}" fill="#000" opacity=".12"/>`;
    s += `<rect x="${b[0] - 2 * s0}" y="${b[1] - 16 * s0}" width="${4 * s0}" height="${16 * s0}" fill="#8b5a2b" rx="1"/>`;
    s += `<circle cx="${b[0]}" cy="${b[1] - 24 * s0}" r="${13 * s0}" fill="${cor}"/><circle cx="${b[0] - 5 * s0}" cy="${b[1] - 28 * s0}" r="${6 * s0}" fill="${shade(cor, .25)}"/>`;
    return s;
  },
  pinheiro(G, o) {
    const { x, y } = o; const b = G.P(x + .5, y + .5), k = G.s; let s = '';
    s += `<rect x="${b[0] - 2 * k}" y="${b[1] - 10 * k}" width="${4 * k}" height="${10 * k}" fill="#7a4b2a"/>`;
    s += `<path d="M${b[0]},${b[1] - 44 * k} L${b[0] + 12 * k},${b[1] - 8 * k} L${b[0] - 12 * k},${b[1] - 8 * k}z" fill="#2e8b57"/><path d="M${b[0]},${b[1] - 44 * k} L${b[0] + 12 * k},${b[1] - 8 * k} L${b[0]},${b[1] - 8 * k}z" fill="#25704a"/>`;
    return s;
  },
  arvoreSeca(G, o) {
    const { x, y } = o; const b = G.P(x + .5, y + .5), k = G.s;
    return `<g stroke="#6b4f36" stroke-width="${2.4 * k}" stroke-linecap="round" fill="none"><path d="M${b[0]},${b[1]} v${-26 * k} M${b[0]},${b[1] - 14 * k} l${-9 * k},${-9 * k} M${b[0]},${b[1] - 20 * k} l${8 * k},${-10 * k} M${b[0] - 5 * k},${b[1] - 19 * k} l${-2 * k},${-7 * k}"/></g>`;
  },
  pessoa(G, o) {
    const { x, y, cor = '#ff6b6b', pele = '#f1c27d' } = o; const b = G.P(x, y), k = G.s;
    return `<ellipse cx="${b[0]}" cy="${b[1]}" rx="${4 * k}" ry="${1.8 * k}" fill="#000" opacity=".15"/><rect x="${b[0] - 3 * k}" y="${b[1] - 12 * k}" width="${6 * k}" height="${10 * k}" rx="${3 * k}" fill="${cor}"/><circle cx="${b[0]}" cy="${b[1] - 15 * k}" r="${3.2 * k}" fill="${pele}"/>`;
  },
  carro(G, o) {
    const { x, y, cor = '#ef476f' } = o; let s = '';
    s += box(G, x + .2, y + .32, .6, .36, 7, 1, cor) + box(G, x + .32, y + .36, .34, .28, 6, 8, '#d8f1ff');
    return s;
  },
  poste(G, o) {
    const b = G.P(o.x, o.y), k = G.s;
    return `<line x1="${b[0]}" y1="${b[1]}" x2="${b[0]}" y2="${b[1] - 34 * k}" stroke="#4a4f5c" stroke-width="${2 * k}"/><circle cx="${b[0]}" cy="${b[1] - 35 * k}" r="${4 * k}" fill="#ffe27a"/><circle cx="${b[0]}" cy="${b[1] - 35 * k}" r="${9 * k}" fill="#ffe27a" opacity=".25"/>`;
  },
  banco(G, o) { return box(G, o.x + .25, o.y + .4, .5, .2, 5, 0, '#c47a3a'); },
  pato(G, o) { const b = G.P(o.x, o.y, -3), k = G.s; return `<ellipse cx="${b[0]}" cy="${b[1]}" rx="${5 * k}" ry="${3 * k}" fill="#fff"/><circle cx="${b[0] + 4 * k}" cy="${b[1] - 3 * k}" r="${2.2 * k}" fill="#fff"/><path d="M${b[0] + 6 * k},${b[1] - 3 * k} l${3 * k},${1 * k} l${-3 * k},${1 * k}z" fill="#ffb703"/>`; },
  balanco(G, o) {
    const a = G.P(o.x + .2, o.y + .5), c = G.P(o.x + .8, o.y + .5), k = G.s;
    return `<g stroke="#e63946" stroke-width="${2 * k}" fill="none"><path d="M${a[0]},${a[1]} l${4 * k},${-26 * k} M${a[0] + 8 * k},${a[1]} l${-4 * k},${-26 * k} M${c[0]},${c[1]} l${4 * k},${-26 * k} M${c[0] + 8 * k},${c[1]} l${-4 * k},${-26 * k} M${a[0] + 4 * k},${a[1] - 26 * k} L${c[0] + 4 * k},${c[1] - 26 * k}"/></g><g stroke="#555" stroke-width="${1 * k}"><line x1="${(a[0] + c[0]) / 2}" y1="${(a[1] + c[1]) / 2 - 24 * k}" x2="${(a[0] + c[0]) / 2}" y2="${(a[1] + c[1]) / 2 - 8 * k}"/></g><rect x="${(a[0] + c[0]) / 2 - 4 * k}" y="${(a[1] + c[1]) / 2 - 8 * k}" width="${12 * k}" height="${2.5 * k}" fill="#ffb703"/>`;
  },
  barraco(G, o) {
    const { x, y, cor = '#b08968' } = o; const X = x + .15, Y = y + .15, W = .7, D = .7, h = 17; let s = '';
    s += box(G, X, Y, W, D, h, 0, cor, { left: shade(cor, -.05), right: '#8d7b68' });
    s += winL(G, X, Y, D, .4, 0, .18, 11, '#3b2f2a');
    s += winR(G, X, W, Y, .2, 7, .25, 6, '#2b2b2b');
    // remendos
    s += winL(G, X, Y, D, .05, 3, .2, 6, '#9c9c9c');
    // telhado de zinco torto
    s += poly(G.pts([[X - .1, Y + D + .1, h - 2], [X + W + .12, Y + D + .1, h + 1], [X + W + .12, Y - .1, h + 7], [X - .1, Y - .1, h + 5]]), '#9aa3a8');
    s += poly(G.pts([[X + .3, Y + D + .1, h - 1], [X + .55, Y + D + .1, h], [X + .55, Y - .1, h + 6], [X + .3, Y - .1, h + 5]]), '#b4542f');
    const c1 = G.P(X + .1, Y + D, 14), c2 = G.P(X + .25, Y + D, 8), c3 = G.P(X + .2, Y + D, 2);
    s += `<polyline points="${c1} ${c2} ${c3}" fill="none" stroke="#3b2f2a" stroke-width="${1 * G.s}"/>`;
    return s;
  },
  ruina(G, o) {
    const { x, y } = o; const X = x + .12, Y = y + .12, W = .76, D = .76; let s = '';
    s += poly(G.pts([[X, Y + D, 0], [X + W, Y + D, 0], [X + W, Y + D, 12], [X + .6, Y + D, 20], [X + .3, Y + D, 9], [X, Y + D, 15]]), '#c9b8a3');
    s += poly(G.pts([[X + W, Y, 0], [X + W, Y + D, 0], [X + W, Y + D, 12], [X + W, Y + .3, 18], [X + W, Y, 8]]), '#a8977f');
    s += winL(G, X, Y, D, .1, 3, .16, 7, '#3b2f2a');
    [[.3, .2], [.5, .5], [.2, .6]].forEach(([a, b]) => { const p = G.P(X + a, Y + b, 1); s += `<rect x="${p[0]}" y="${p[1] - 3 * G.s}" width="${5 * G.s}" height="${3 * G.s}" fill="#9b8a75"/>`; });
    return s;
  },
  lixo(G, o) {
    const b = G.P(o.x + .5, o.y + .5), k = G.s; let s = `<ellipse cx="${b[0]}" cy="${b[1]}" rx="${16 * k}" ry="${7 * k}" fill="#5b4a3a" opacity=".5"/>`;
    [['#3a3a3a', -8, -3, 7], ['#2d6a4f', 2, -5, 6], ['#e9c46a', -2, -9, 4], ['#3a3a3a', 7, -2, 6], ['#e76f51', -10, -10, 3], ['#d9d9d9', 4, -11, 3.5]].forEach(([c, dx, dy, r]) => { s += `<circle cx="${b[0] + dx * k}" cy="${b[1] + dy * k}" r="${r * k}" fill="${c}"/>`; });
    s += `<g fill="#222">${[[-6, -22], [3, -26], [9, -18]].map(([dx, dy]) => `<circle cx="${b[0] + dx * k}" cy="${b[1] + dy * k}" r="${1 * k}"/>`).join('')}</g>`;
    return s;
  },
  pneu(G, o) { const b = G.P(o.x + .5, o.y + .5), k = G.s; return `<ellipse cx="${b[0]}" cy="${b[1] - 3 * k}" rx="${7 * k}" ry="${4 * k}" fill="none" stroke="#222" stroke-width="${3 * k}"/>`; },
  caixaDagua(G, o) { let s = box(G, o.x + .35, o.y + .35, .3, .3, 26, 0, '#6c757d'); s += box(G, o.x + .25, o.y + .25, .5, .5, 10, 26, '#4ea8de'); return s; },
  fogo(G, o) { const b = G.P(o.x + .5, o.y + .5), k = G.s; return `<path d="M${b[0]},${b[1] - 18 * k} q${7 * k},${8 * k} ${3 * k},${16 * k} q${-6 * k},${2 * k} ${-8 * k},0 q${-3 * k},${-8 * k} ${5 * k},${-16 * k}z" fill="#ff7b00"/><circle cx="${b[0] - 4 * k}" cy="${b[1] - 30 * k}" r="${5 * k}" fill="#777" opacity=".5"/><circle cx="${b[0] + 2 * k}" cy="${b[1] - 40 * k}" r="${7 * k}" fill="#888" opacity=".35"/>`; },
};

export function cena(spec, { ox, oy, s = 1, base = '#c08a56', borda = true }) {
  const G = mk(ox, oy, s); const N = spec.chao.length, M = spec.chao[0].length; let out = '';
  if (borda) {
    out += box(G, 0, 0, M, N, 10, -10, base, { noTop: true, left: shade(base, -.05), right: shade(base, -.25) });
  }
  for (let y = 0; y < N; y++) for (let x = 0; x < M; x++) out += tile(G, x, y, spec.chao[y][x]);
  const objs = [...spec.objs].sort((a, b) => (a.x + (a.w || 1) * .5 + a.y + (a.d || 1) * .5) - (b.x + (b.w || 1) * .5 + b.y + (b.d || 1) * .5));
  for (const o of objs) out += OBJ[o.t](G, o);
  return out;
}

export const IDEAL = {
  chao: [
    'gggfgsRsggggww',
    'ggggfsRsgggwww',
    'gfgggsRsggwwwg',
    'ssssssRsssggwg',
    'rrrrrr+rrrrrrr',
    'ssssssRsssssss',
    'ggggfsRspppppp',
    'ggggfsRspppppp',
    'gfgggsRsgffgfg',
    'ggggfsRsggggfg',
  ],
  objs: [
    { t: 'casa', x: 0, y: 0, cor: '#fff3e0', telhado: '#e2603f' }, { t: 'casa', x: 2, y: 0, cor: '#e8f7ff', telhado: '#3d7dd8' },
    { t: 'casa', x: 0, y: 2, cor: '#fff8d6', telhado: '#2a9d8f' }, { t: 'casa', x: 2, y: 2, cor: '#ffe9f1', telhado: '#e2603f' },
    { t: 'arvore', x: 4, y: 0 }, { t: 'arvore', x: 1, y: 1, cor: '#55b84a', tam: .8 }, { t: 'arvore', x: 4, y: 2, cor: '#2f9e44' },
    { t: 'predio', x: 8, y: 0, cor: '#a9c7ff', andares: 6 }, { t: 'predio', x: 9, y: 1, cor: '#ffcfa8', andares: 4 },
    { t: 'arvore', x: 8, y: 2 }, { t: 'pato', x: 12.4, y: 1.5 }, { t: 'pato', x: 11.6, y: 2.5 },
    { t: 'escola', x: 0, y: 6 }, { t: 'pessoa', x: 1.2, y: 7.6, cor: '#4361ee' }, { t: 'pessoa', x: 1.6, y: 7.8, cor: '#f72585' }, { t: 'pessoa', x: 0.6, y: 7.7, cor: '#06d6a0', pele: '#8d5524' },
    { t: 'arvore', x: 3, y: 7 }, { t: 'pinheiro', x: 0, y: 8 }, { t: 'arvore', x: 2, y: 9, cor: '#55b84a' }, { t: 'pinheiro', x: 4, y: 9 },
    { t: 'balanco', x: 9, y: 6 }, { t: 'banco', x: 11, y: 7 }, { t: 'banco', x: 8, y: 7 }, { t: 'arvore', x: 13, y: 6 }, { t: 'arvore', x: 12, y: 8, cor: '#2f9e44' },
    { t: 'pessoa', x: 10.7, y: 7.3, cor: '#ffb703', pele: '#c68642' }, { t: 'pessoa', x: 9.4, y: 8.2, cor: '#8338ec' },
    { t: 'casa', x: 8, y: 9, cor: '#e8f7ff', telhado: '#e76f51' }, { t: 'arvore', x: 10, y: 9 },
    { t: 'carro', x: 3, y: 4, cor: '#ef476f' }, { t: 'carro', x: 6, y: 1, cor: '#118ab2' }, { t: 'carro', x: 10, y: 4, cor: '#ffd166' },
    { t: 'poste', x: 5.8, y: 3.9 }, { t: 'poste', x: 7.8, y: 5.1 }, { t: 'poste', x: 2.5, y: 3.9 }, { t: 'poste', x: 11, y: 5.1 },
    { t: 'pessoa', x: 4.5, y: 5.4, cor: '#e63946' }, { t: 'pessoa', x: 7.4, y: 3.6, cor: '#2a9d8f', pele: '#8d5524' },
  ],
};

export const CARENTE = {
  chao: [
    'yydyddedydyymm',
    'ydyyddedyddymm',
    'yyyydded yddym'.replace(' ', 'd'),
    'ddddddeddddyyy',
    'dddmddedddmddd',
    'ddddddeddddddd',
    'yyyyddedyyyyyy',
    'ydyyddedyydyyy',
    'yyyyddedyyyyyd',
    'yydyddedydyyyy',
  ],
  objs: [
    { t: 'barraco', x: 0, y: 0, cor: '#b08968' }, { t: 'ruina', x: 2, y: 0 }, { t: 'barraco', x: 0, y: 2, cor: '#a3b18a' }, { t: 'barraco', x: 2, y: 2, cor: '#c9a27e' },
    { t: 'arvoreSeca', x: 4, y: 1 }, { t: 'lixo', x: 4, y: 3 }, { t: 'lixo', x: 8, y: 2 }, { t: 'pneu', x: 9, y: 3 },
    { t: 'ruina', x: 8, y: 0 }, { t: 'barraco', x: 10, y: 0, cor: '#8d99ae' }, { t: 'caixaDagua', x: 11, y: 2 },
    { t: 'barraco', x: 0, y: 6, cor: '#b5838d' }, { t: 'barraco', x: 2, y: 6, cor: '#a5a58d' }, { t: 'ruina', x: 0, y: 8 },
    { t: 'lixo', x: 3, y: 8 }, { t: 'arvoreSeca', x: 4, y: 7 }, { t: 'fogo', x: 9, y: 7 }, { t: 'lixo', x: 11, y: 8 },
    { t: 'barraco', x: 12, y: 6, cor: '#9c6644' }, { t: 'barraco', x: 10, y: 9, cor: '#7f5539' }, { t: 'pneu', x: 12, y: 9 },
    { t: 'pessoa', x: 5.3, y: 3.6, cor: '#6c757d', pele: '#8d5524' }, { t: 'pessoa', x: 8.6, y: 5.5, cor: '#9d8189' }, { t: 'pessoa', x: 7.8, y: 6.5, cor: '#495057', pele: '#c68642' },
    { t: 'arvoreSeca', x: 13, y: 4 }, { t: 'barraco', x: 1, y: 1, cor: '#bc8a5f' }, { t: 'barraco', x: 3, y: 0, cor: '#99a88c' }, { t: 'barraco', x: 1, y: 7, cor: '#ad8a64' }, { t: 'barraco', x: 3, y: 6, cor: '#9a8c98' }, { t: 'barraco', x: 9, y: 1, cor: '#a68a64' }, { t: 'ruina', x: 12, y: 0 }, { t: 'lixo', x: 6, y: 4 }, { t: 'pessoa', x: 3.4, y: 5.4, cor: '#adb5bd' },
  ],
};

// Miniatura de uma peça (para a paleta)
export function peca(t, o = {}, chao = 'g') {
  const G = mk(50, 40, 1.1); let s = tile(G, 0, 0, chao);
  if (t) s += OBJ[t](G, { x: 0, y: 0, ...(t === 'pessoa' || t === 'poste' ? { x: .5, y: .5 } : {}), ...(t === 'pato' ? { x: .5, y: .6 } : {}), ...o });
  return `<svg viewBox="0 -30 100 100" width="100%" height="100%">${s}</svg>`;
}
