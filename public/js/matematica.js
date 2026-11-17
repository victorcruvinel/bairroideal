// Bairro Ideal · a matemática da maquete (para a professora de matemática 😉)
// Cada quadradinho = 10 m × 10 m = 100 m². No plano cartesiano o eixo y cresce para cima (y = −linha).
import { OBJETOS } from './pecas.js';

export const LADO = 10; // metros por quadradinho
const n2 = (v, c = 0) => Number(v || 0).toLocaleString('pt-BR', { minimumFractionDigits: c, maximumFractionDigits: c });
export const fmt = n2;
const mdc = (a, b) => (b ? mdc(b, a % b) : a);

// fração simples que mais se aproxima (denominador até 12)
export function fracao(p) {
  if (p <= 0) return '0'; if (p >= 1) return '1'; if (p < 1 / 24) return 'menos de 1/12'; if (p > 23 / 24) return 'quase 1';
  let melhor = [1, 1], erro = 9;
  for (let d = 2; d <= 12; d++) { const n = Math.round(p * d); if (!n) continue; const e = Math.abs(p - n / d); if (e < erro - 1e-9) { erro = e; const g = mdc(n, d); melhor = [n / g, d / g]; } }
  return `${melhor[0]}/${melhor[1]}`;
}

export const GRUPOS = [
  { id: 'construcoes', nome: 'Construções', cor: '#ff9f68', emoji: '🏠' },
  { id: 'verde', nome: 'Verde', cor: '#52b788', emoji: '🌳' },
  { id: 'ruas', nome: 'Ruas e calçadas', cor: '#7d8597', emoji: '🛣️' },
  { id: 'agua', nome: 'Água', cor: '#4cc9f0', emoji: '💧' },
  { id: 'lazer', nome: 'Praças e lazer', cor: '#ffc93c', emoji: '🎈' },
  { id: 'terra', nome: 'Terra, mato seco e esgoto', cor: '#b58757', emoji: '🟫' },
];
const GRUPO_CHAO = { grama: 'verde', flores: 'verde', areia: 'verde', rua: 'ruas', calcada: 'ruas', ciclovia: 'ruas', estrada: 'ruas', praca: 'lazer', agua: 'agua', aguasuja: 'agua', terra: 'terra', seco: 'terra', lama: 'terra', esgoto: 'terra' };

export function calcular(m, a) {
  const chao = m.chao || {}, ks = Object.keys(chao), n = ks.length;
  const tem = (x, y) => chao[x + ',' + y] != null;
  // perímetro: bordas do terreno que não encostam em outro quadradinho
  let bordas = 0, x0 = Infinity, y0 = Infinity, x1 = -Infinity, y1 = -Infinity;
  for (const k of ks) { const [x, y] = k.split(',').map(Number); if (!tem(x + 1, y)) bordas++; if (!tem(x - 1, y)) bordas++; if (!tem(x, y + 1)) bordas++; if (!tem(x, y - 1)) bordas++; x0 = Math.min(x0, x); y0 = Math.min(y0, y); x1 = Math.max(x1, x); y1 = Math.max(y1, y); }
  const largura = n ? (x1 - x0 + 1) : 0, altura = n ? (y1 - y0 + 1) : 0;
  // uso do solo: quadradinho com construção conta como construção, senão vale o chão
  const ocupado = new Map();
  for (const o of m.objs || []) { const p = OBJETOS[o.t]; if (!p) continue; const w = (o.r || 0) % 2 ? p.d : p.w, d = (o.r || 0) % 2 ? p.w : p.d; for (let i = 0; i < w; i++) for (let j = 0; j < d; j++) ocupado.set((o.x + i) + ',' + (o.y + j), o); }
  const uso = Object.fromEntries(GRUPOS.map((g) => [g.id, 0]));
  for (const k of ks) { const o = ocupado.get(k); const p = o && OBJETOS[o.t]; if (p && (p.f?.familias || p.solido) && !p.f?.lazer) uso.construcoes++; else if (p && p.f?.lazer) uso.lazer++; else uso[GRUPO_CHAO[chao[k]] || 'verde']++; }
  const area = n * LADO * LADO, moradores = a.contagem.moradores, km2 = area / 1e6;
  const verdeM2 = (uso.verde + uso.lazer) * LADO * LADO;
  // distância de cada casa até a escola mais perto (em linha reta, do centro ao centro)
  const centro = (o) => { const p = OBJETOS[o.t]; const w = (o.r || 0) % 2 ? p.d : p.w, d = (o.r || 0) % 2 ? p.w : p.d; return [o.x + w / 2, o.y + d / 2]; };
  const casas = (m.objs || []).filter((o) => OBJETOS[o.t]?.f?.familias), escolas = (m.objs || []).filter((o) => OBJETOS[o.t]?.f?.escola);
  let distEscola = null, exemplo = null;
  if (casas.length && escolas.length) {
    const ds = casas.map((c) => { const [cx, cy] = centro(c); let best = null; for (const e of escolas) { const [ex, ey] = centro(e); const d = Math.hypot(ex - cx, ey - cy); if (!best || d < best.d) best = { d, c: [cx, cy], e: [ex, ey] }; } return best; }).sort((p, q) => p.d - q.d);
    const vals = ds.map((x) => x.d * LADO); const media = vals.reduce((s, v) => s + v, 0) / vals.length;
    const meio = vals.length % 2 ? vals[(vals.length - 1) / 2] : (vals[vals.length / 2 - 1] + vals[vals.length / 2]) / 2;
    distEscola = { media, mediana: meio, maior: vals[vals.length - 1], menor: vals[0], n: vals.length };
    exemplo = ds[ds.length - 1]; // a casa mais longe
  }
  const notas = Object.values(a.v).filter((v) => v != null);
  return {
    n, area, km2, hectares: area / 1e4, bordas, perimetro: bordas * LADO, largura: largura * LADO, altura: altura * LADO, retangulo: largura * altura * LADO * LADO,
    ocupacao: largura * altura ? n / (largura * altura) : 0, uso, moradores, densidade: km2 ? moradores / km2 : 0, verdeM2, verdePorHab: moradores ? verdeM2 / moradores : null,
    ruasM: (a.contagem.ruas + a.contagem.ruasTerra) * LADO, arvores: a.contagem.arvores, arvorePorMorador: a.contagem.arvores ? moradores / a.contagem.arvores : null,
    distEscola, exemplo, notas, somaNotas: notas.reduce((s, v) => s + v, 0), escalaCm: [largura, altura],
  };
}

// régua: dois quadradinhos A e B (coordenadas do mundo) -> contas
export function medir(A, B) {
  const dx = B.x - A.x, dy = -(B.y - A.y); // y para cima
  const d = Math.hypot(dx, dy), passos = Math.abs(dx) + Math.abs(dy);
  const ang = dx === 0 && dy === 0 ? 0 : Math.atan2(dy, dx) * 180 / Math.PI;
  return { dx, dy, d, metros: d * LADO, aPe: passos * LADO, ang, inclinacao: dx ? dy / dx : null };
}
export const coord = (c) => `(${c.x}, ${-c.y || 0})`;
