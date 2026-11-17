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
    distEscola = { media, mediana: meio, maior: vals[vals.length - 1], menor: vals[0], n: vals.length, soma: vals.reduce((x, y) => x + y, 0) };
    exemplo = ds[ds.length - 1]; // a casa mais longe
  }
  const notas = Object.values(a.v).filter((v) => v != null);
  return {
    n, area, km2, hectares: area / 1e4, bordas, perimetro: bordas * LADO, largura: largura * LADO, altura: altura * LADO, retangulo: largura * altura * LADO * LADO,
    ocupacao: largura * altura ? n / (largura * altura) : 0, cols: largura, lins: altura, familias: a.contagem.familias, uso, moradores, densidade: km2 ? moradores / km2 : 0, verdeM2, verdePorHab: moradores ? verdeM2 / moradores : null,
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

// ---------------- as lousas: ideia → passos → resultado → prova real
export const fracaoExata = (p, q) => { const g = mdc(p, q) || 1; return [p / g, q / g, g]; };
const nomeFracao = (t) => ({ '1/2': 'metade', '1/3': 'um terço', '2/3': 'dois terços', '1/4': 'um quarto', '3/4': 'três quartos', '1/5': 'um quinto', '1/10': 'um décimo' }[t] || '');
const lousa = (emoji, titulo, ideia, passos, resultado, extra = '') => `<div class="lousa"><h4>${emoji} ${titulo}</h4><p class="ideia">${ideia}</p>
  <ol class="passos">${passos.map((x) => `<li class="f">${x}</li>`).join('')}</ol>${resultado ? `<div class="res">= ${resultado}</div>` : ''}${extra}</div>`;
const prova = (txt, ok = true) => `<p class="prova">${ok ? '✅' : 'ℹ️'} <b>${ok ? 'Prova real:' : 'Observação:'}</b> ${txt}</p>`;

export function htmlMatematica(M, a) {
  const f0 = (v) => fmt(v), out = [];
  out.push(lousa('📏', 'Área: o tamanho do chão', 'Área é quanto chão o bairro ocupa. Cada quadradinho mede 10 m de cada lado.',
    ['1 quadradinho = 10 m × 10 m = 100 m²', `O bairro tem ${f0(M.n)} quadradinhos`, `A = ${f0(M.n)} × 100 m²`], `<b>${f0(M.area)} m²</b>`,
    `<small>Como 1 hectare = 10.000 m², são ${fmt(M.hectares, 2)} hectares (cerca de ${fmt(M.area / 7140, 1)} campos de futebol oficiais).</small>`));
  const ret = M.ocupacao === 1, pr = 2 * (M.cols + M.lins);
  out.push(lousa('🔲', 'Perímetro: a volta toda', 'Perímetro é o contorno do terreno, como se você desse a volta inteira por fora.',
    [`Contamos os lados dos quadradinhos que ficam na borda: ${f0(M.bordas)} lados`, 'Cada lado mede 10 m', `P = ${f0(M.bordas)} × 10 m`], `<b>${f0(M.perimetro)} m</b>`,
    ret ? prova(`o terreno é um retângulo de ${M.cols} × ${M.lins} quadradinhos, então P = 2 × (${M.cols} + ${M.lins}) × 10 = ${f0(pr * 10)} m. Deu igual!`, pr === M.bordas)
      : prova(`o terreno não é um retângulo (ocupa ${fmt(M.ocupacao * 100)}% do retângulo de ${M.cols} × ${M.lins} em volta), por isso contamos lado por lado.`, false)));
  const gs = GRUPOS.filter((x) => M.uso[x.id]); let ac = 0;
  const pizza = gs.map((x) => { const de = ac; ac += M.uso[x.id] / M.n * 360; return `${x.cor} ${de}deg ${ac}deg`; }).join(',');
  const linhas = gs.map((x) => { const q = M.uso[x.id], [n, d, g] = fracaoExata(q, M.n), ap = fracao(q / M.n), nm = nomeFracao(ap);
    return `<li><i style="background:${x.cor}"></i><span>${x.emoji} ${x.nome}</span><b>${q}/${M.n}${g > 1 ? ` = ${n}/${d}` : ''} ≈ ${ap}${nm ? ` (${nm})` : ''} · ${fmt(q / M.n * 100)}%</b></li>`; }).join('');
  out.push(`<div class="lousa"><h4>🥧 Frações: de que é feito o bairro</h4><p class="ideia">Fração é uma parte do todo. O todo são os ${f0(M.n)} quadradinhos do terreno.</p>
    <div class="pizza" style="background:conic-gradient(${pizza})"></div><ul class="uso">${linhas}</ul>
    <ol class="passos"><li class="f">Parte ÷ todo = fração</li><li class="f">Fração × 100 = porcentagem</li></ol>
    ${prova(`somando as partes: ${gs.map((x) => M.uso[x.id]).join(' + ')} = ${gs.reduce((s2, x) => s2 + M.uso[x.id], 0)} = o todo (${M.n}). E as porcentagens dão 100%.`, gs.reduce((s2, x) => s2 + M.uso[x.id], 0) === M.n)}</div>`);
  if (M.moradores) {
    out.push(lousa('👨‍👩‍👧', 'Moradores e densidade', 'Densidade mostra quantas pessoas vivem em cada pedaço de chão. Quanto maior, mais apertado.',
      [`Famílias nas casas e prédios: ${f0(M.familias)}`, `Moradores ≈ ${f0(M.familias)} × 3,2 (média de pessoas por família) ≈ ${f0(M.moradores)}`, `Área em km²: ${f0(M.area)} ÷ 1.000.000 = ${fmt(M.km2, 3)} km²`, `d = moradores ÷ área = ${f0(M.moradores)} ÷ ${fmt(M.km2, 3)}`],
      `<b>${f0(M.densidade)} habitantes por km²</b>`, `<small>Em média, ${fmt(M.moradores / M.n, 1)} pessoas por quadradinho de 100 m².</small>`));
    const v = M.uso.verde + M.uso.lazer;
    out.push(lousa('🌳', 'Verde para cada morador', 'Dividimos a área verde (grama, flores e praças) entre todos os moradores.',
      [`Quadradinhos verdes e de praça: ${f0(v)}`, `Área verde = ${f0(v)} × 100 = ${f0(M.verdeM2)} m²`, `${f0(M.verdeM2)} ÷ ${f0(M.moradores)} moradores`], `<b>${fmt(M.verdePorHab, 1)} m² por pessoa</b>`,
      prova(`uma referência muito usada é ter pelo menos 12 m² de verde por habitante: ${M.verdePorHab >= 12 ? 'este bairro passa! 🎉' : `faltam ${fmt(12 - M.verdePorHab, 1)} m² por pessoa.`}`, M.verdePorHab >= 12)));
  }
  if (M.distEscola) {
    const d = M.distEscola, ex = M.exemplo, dx = Math.abs(ex.e[0] - ex.c[0]), dy = Math.abs(ex.e[1] - ex.c[1]);
    out.push(lousa('🏫', 'Distância até a escola (média e mediana)', 'Medimos, em linha reta, a distância de cada casa até a escola mais perto.',
      [`Casas medidas: ${d.n}`, `Soma de todas as distâncias: ${f0(d.soma)} m`, `Média = soma ÷ quantidade = ${f0(d.soma)} ÷ ${d.n} ≈ ${f0(d.media)} m`, `Mediana (o valor do meio, com as distâncias em ordem) ≈ ${f0(d.mediana)} m`],
      `<b>em média ${f0(d.media)} m até a escola</b>`,
      `<div class="pitagoras"><b>📐 Pitágoras na casa mais longe</b><ol class="passos"><li class="f">Catetos: Δx = ${fmt(dx, 1)} e Δy = ${fmt(dy, 1)} quadradinhos</li><li class="f">d² = Δx² + Δy² = ${fmt(dx * dx, 2)} + ${fmt(dy * dy, 2)} = ${fmt(dx * dx + dy * dy, 2)}</li><li class="f">d = √${fmt(dx * dx + dy * dy, 2)} ≈ ${fmt(ex.d, 2)} quadradinhos × 10 = <b>${f0(ex.d * LADO)} m</b></li></ol>
      <svg viewBox="0 0 120 70" class="tri"><path d="M10 60 H${10 + Math.min(100, dx * 9)} V${60 - Math.min(50, dy * 9)} Z" fill="rgba(255,209,102,.18)" stroke="#ffd166" stroke-width="2"/><text x="${10 + Math.min(100, dx * 9) / 2}" y="69" fill="#cfe3d4" font-size="8" text-anchor="middle">Δx</text><text x="${14 + Math.min(100, dx * 9)}" y="${60 - Math.min(50, dy * 9) / 2}" fill="#cfe3d4" font-size="8">Δy</text><text x="${10 + Math.min(100, dx * 9) / 2 - 6}" y="${60 - Math.min(50, dy * 9) / 2 - 4}" fill="#ffd166" font-size="9">d</text></svg></div>`));
  }
  if (M.notas.length && a.nota != null) out.push(lousa('🧮', 'A nota do bairro é uma média', `As ${M.notas.length} notas do termômetro (de 0 a 100) são somadas e divididas pela quantidade.`,
    [`Soma: ${M.notas.join(' + ')} = ${f0(M.somaNotas)}`, `Média: ${f0(M.somaNotas)} ÷ ${M.notas.length} ≈ ${fmt(M.somaNotas / M.notas.length, 1)}`, `Para virar nota de 0 a 10: ${fmt(M.somaNotas / M.notas.length, 1)} ÷ 10`], `<b>${String(a.nota).replace('.', ',')}</b>`));
  out.push(lousa('📐', 'Escala da maquete', 'Escala é quantas vezes o desenho é menor que o tamanho de verdade.',
    ['1 quadradinho = 10 m = 1.000 cm de verdade', 'Numa maquete de papel, 1 quadradinho = 1 cm', '1 cm no papel representa 1.000 cm de verdade'], '<b>escala 1 : 1.000</b>',
    `<small>Este terreno (${M.cols} × ${M.lins} quadradinhos) caberia num papel de ${M.cols} cm × ${M.lins} cm.</small>`));
  // desafios para a aula
  const ds = [];
  ds.push([`A escola atende as casas até 10 quadradinhos (100 m) de distância. Qual é a área desse círculo?`, `A = π × r² = 3,14 × 100² ≈ <b>31.416 m²</b> (o raio é 100 m).`]);
  if (ret) { const nova = (M.cols + 2) * (M.lins + 2); ds.push([`Se apertarmos o botão “Crescer” (1 quadradinho a mais em cada lado), quantos m² o terreno ganha?`, `Fica ${M.cols + 2} × ${M.lins + 2} = ${f0(nova)} quadradinhos. Ganha ${f0(nova)} − ${f0(M.n)} = ${f0(nova - M.n)} quadradinhos × 100 = <b>${f0((nova - M.n) * 100)} m²</b>.`]); }
  if (M.arvores) ds.push([`Se cada árvore dá sombra em 1 quadradinho, que porcentagem do terreno fica na sombra?`, `${M.arvores} ÷ ${M.n} × 100 ≈ <b>${fmt(M.arvores / M.n * 100, 1)}%</b>.`]);
  if (M.moradores) ds.push([`Se cada morador produz 1 kg de lixo por dia, quantos kg o bairro produz em uma semana?`, `${f0(M.moradores)} × 1 kg × 7 dias = <b>${f0(M.moradores * 7)} kg</b> (≈ ${fmt(M.moradores * 7 / 1000, 1)} toneladas).`]);
  out.push(`<div class="lousa lousa--desafio"><h4>🎲 Desafios para a turma</h4><p class="ideia">Perguntas feitas com os números desta maquete. Toque para ver a resposta.</p>
    ${ds.map(([q, r], i) => `<details class="desafio"><summary><span>${i + 1}</span>${q}</summary><p class="f">${r}</p></details>`).join('')}</div>`);
  return out.join('');
}
