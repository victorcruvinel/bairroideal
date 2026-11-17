// Bairro Ideal · termômetro do bairro: lê as peças da maquete e calcula as notas, as metas e os problemas.
// Tudo por distância: uma casa "tem escola" se existe uma escola a até 10 quadradinhos dela, e assim por diante.
import { OBJETOS } from './pecas.js';

export const INDICADORES = [
  { id: 'natureza', nome: 'Natureza', emoji: '🌳', cor: '#52b788', explica: 'Árvores, flores, lagos e jardins para o tamanho do bairro.' },
  { id: 'moradia', nome: 'Moradia', emoji: '🏠', cor: '#ff9f68', explica: 'Famílias em casas seguras (barraco e casa caindo baixam a nota).' },
  { id: 'agua', nome: 'Água e esgoto', emoji: '💧', cor: '#4cc9f0', explica: "Casas perto da estação de tratamento (25 quadradinhos) ou de uma caixa d'água (5). Esgoto a céu aberto perto das casas baixa a nota." },
  { id: 'educacao', nome: 'Educação', emoji: '🏫', cor: '#9b8afb', explica: 'Casas com escola ou creche a até 10 quadradinhos.' },
  { id: 'saude', nome: 'Saúde', emoji: '➕', cor: '#ef476f', explica: 'Casas com posto de saúde ou hospital a até 12 quadradinhos.' },
  { id: 'lazer', nome: 'Lazer', emoji: '🎈', cor: '#ffc93c', explica: 'Casas com praça, parquinho, quadra ou campo a até 7 quadradinhos.' },
  { id: 'mobilidade', nome: 'Ruas e transporte', emoji: '🛣️', cor: '#7d8597', explica: 'Casas com rua asfaltada na porta (rua de terra vale menos). Ponto de ônibus ajuda.' },
  { id: 'iluminacao', nome: 'Iluminação', emoji: '💡', cor: '#f9c74f', explica: 'Pedaços de rua com um poste a até 3 quadradinhos.' },
  { id: 'limpeza', nome: 'Limpeza', emoji: '🧹', cor: '#a78bfa', explica: 'Lixo, entulho, pneus, ratos e esgoto baixam a nota. Coleta seletiva ajuda.' },
];

function carimbar(set, x, y, w, d, r) {
  for (let i = x - r; i < x + w + r; i++) for (let j = y - r; j < y + d + r; j++) {
    const dx = i < x ? x - i : i >= x + w ? i - (x + w - 1) : 0, dy = j < y ? y - j : j >= y + d ? j - (y + d - 1) : 0;
    if (dx * dx + dy * dy <= r * r) set.add(i * 100003 + j);
  }
}
const K = (x, y) => x * 100003 + y;
const clamp = (v) => Math.max(0, Math.min(100, Math.round(v)));

export function analisar(m) {
  const chao = m.chao || {}; const objs = (m.objs || []).filter((o) => OBJETOS[o.t]);
  const area = Object.keys(chao).length;
  const cont = {}; for (const t of Object.values(chao)) cont[t] = (cont[t] || 0) + 1;
  const soma = (f) => objs.reduce((a, o) => a + (OBJETOS[o.t].f?.[f] || 0), 0);
  const conta = (id) => objs.filter((o) => o.t === id).length;
  const tam = (o) => { const p = OBJETOS[o.t]; return (o.r || 0) % 2 ? [p.d, p.w] : [p.w, p.d]; };

  const casas = objs.filter((o) => OBJETOS[o.t].f?.familias);
  const boas = casas.filter((o) => OBJETOS[o.t].f.boa), ruins = casas.filter((o) => OBJETOS[o.t].f.ruim);
  const familias = casas.reduce((a, o) => a + OBJETOS[o.t].f.familias, 0);
  const famRuins = ruins.reduce((a, o) => a + OBJETOS[o.t].f.familias, 0);

  const cobertura = (tag, raio) => { const s = new Set(); for (const o of objs) if (OBJETOS[o.t].f?.[tag]) { const [w, d] = tam(o); carimbar(s, o.x, o.y, w, d, raio); } return s; };
  const pctCasas = (set) => { if (!casas.length) return null; let ok = 0; for (const o of casas) { const [w, d] = tam(o); let dentro = false; for (let i = 0; i < w && !dentro; i++) for (let j = 0; j < d; j++) if (set.has(K(o.x + i, o.y + j))) { dentro = true; break; } if (dentro) ok += OBJETOS[o.t].f.familias; } return ok / familias * 100; };

  // água: estação (14) ou caixa d'água (4); esgoto e água suja a até 2 quadradinhos estragam
  const agua = cobertura('agua', 25); for (const o of objs) if (OBJETOS[o.t].f?.caixa) carimbar(agua, o.x, o.y, 1, 1, 5);
  const sujo = new Set(); for (const [k, t] of Object.entries(chao)) if (t === 'esgoto' || t === 'aguasuja') { const [x, y] = k.split(',').map(Number); carimbar(sujo, x, y, 1, 1, 2); }
  const pAgua = pctCasas(agua), pSujo = pctCasas(sujo) || 0;
  // ruas: na porta = até 2 quadradinhos
  const asfalto = new Set(), terra = new Set();
  for (const [k, t] of Object.entries(chao)) { const [x, y] = k.split(',').map(Number); if (t === 'rua') carimbar(asfalto, x, y, 1, 1, 2); else if (t === 'estrada') carimbar(terra, x, y, 1, 1, 2); }
  const pAsf = pctCasas(asfalto), pTerra = pctCasas(new Set([...terra].filter((k) => !asfalto.has(k))));
  const temPonto = soma('transporte') > 0;
  // iluminação: postes que funcionam
  const luz = new Set(); for (const o of objs) if (OBJETOS[o.t].f?.luz) carimbar(luz, o.x, o.y, 1, 1, 3);
  let ruas = 0, ruasLuz = 0; for (const [k, t] of Object.entries(chao)) if (t === 'rua' || t === 'estrada') { ruas++; const [x, y] = k.split(',').map(Number); if (luz.has(K(x, y))) ruasLuz++; }
  // natureza
  const arvores = soma('arvore'), verde = arvores + soma('verde') * .5 + (cont.flores || 0) * .5 + (cont.agua || 0) * .3 + (cont.grama || 0) * .04 + soma('lazer') * .2;
  const ruimVerde = soma('seca') * 1.5 + soma('fogo') * 3 + (cont.seco || 0) * .08 + (cont.aguasuja || 0) * .3;
  // limpeza
  const sujeira = soma('lixo') + (cont.esgoto || 0) * .5 + (cont.aguasuja || 0) * .4 + (cont.lama || 0) * .15 + soma('buraco') * .3;
  const coleta = soma('coleta');

  const v = {
    natureza: area ? clamp((verde - ruimVerde) / Math.max(2, area * .12) * 100) : null,
    moradia: casas.length ? clamp((familias - famRuins) / familias * 100) : null,
    agua: casas.length ? clamp((pAgua ?? 0) * (1 - .7 * pSujo / 100)) : null,
    educacao: casas.length ? clamp(pctCasas(cobertura('escola', 10))) : null,
    saude: casas.length ? clamp(pctCasas(cobertura('saude', 12))) : null,
    lazer: casas.length ? clamp(pctCasas(cobertura('lazer', 7))) : null,
    mobilidade: casas.length ? clamp((pAsf ?? 0) + (pTerra ?? 0) * .35 + (temPonto ? 8 : 0)) : null,
    iluminacao: ruas ? clamp(ruasLuz / ruas * 100) : null,
    limpeza: area ? clamp(100 - sujeira / Math.max(1, area * .05) * 100 + (sujeira ? coleta * 5 : 0)) : null,
  };
  const validos = Object.values(v).filter((x) => x != null);
  const nota = validos.length && casas.length ? Math.round(validos.reduce((a, b) => a + b, 0) / validos.length) / 10 : null;

  const contagem = {
    casas: boas.filter((o) => ['casa', 'sobrado'].includes(o.t)).length, predios: objs.filter((o) => ['predio', 'predinho', 'condominio'].includes(o.t)).length,
    barracos: ruins.length, arvores: Math.round(arvores), pessoas: soma('pessoa'), familias, moradores: Math.round(familias * 3.2),
    escolas: conta('escola') + conta('creche'), saude: conta('posto') + conta('hospital'), postes: conta('poste'), lixo: Math.round(soma('lixo')),
    area, pecas: objs.length, ruas: cont.rua || 0, ruasTerra: cont.estrada || 0, esgoto: cont.esgoto || 0,
  };

  const metas = [
    { id: 'arvores', texto: 'Plantar 10 árvores', ok: arvores >= 10, prog: Math.min(1, arvores / 10) },
    { id: 'escola', texto: 'Escola perto de todas as casas', ok: v.educacao >= 90 },
    { id: 'saude', texto: 'Posto de saúde perto de todas as casas', ok: v.saude >= 90 },
    { id: 'agua', texto: 'Água tratada em todas as casas', ok: v.agua >= 90 },
    { id: 'asfalto', texto: 'Rua asfaltada na porta de todas as casas', ok: v.mobilidade >= 90 },
    { id: 'luz', texto: 'Ruas iluminadas à noite', ok: v.iluminacao >= 90 },
    { id: 'lazer', texto: 'Praça ou parquinho perto das casas', ok: v.lazer >= 80 },
    { id: 'limpo', texto: 'Nenhum lixo na rua', ok: (v.limpeza ?? 0) >= 95 },
    { id: 'moradia', texto: 'Todas as famílias em casas seguras', ok: v.moradia === 100 },
  ];
  if (!casas.length) metas.unshift({ id: 'casas', texto: 'Construir as primeiras casas', ok: false });

  const problemas = [];
  const p = (n, um, varios, emoji) => { if (n > 0) problemas.push(`${emoji} ${n} ${n === 1 ? um : varios}`); };
  p(ruins.filter((o) => o.t === 'barraco').length, 'barraco', 'barracos', '🏚️'); p(conta('ruina'), 'casa caindo', 'casas caindo', '⚠️');
  p(Math.round(soma('lixo') - conta('pneu') * .5), 'monte de lixo', 'montes de lixo', '🗑️'); p(cont.esgoto || 0, 'trecho de esgoto a céu aberto', 'trechos de esgoto a céu aberto', '🤢');
  p(cont.aguasuja || 0, 'pedaço de água poluída', 'pedaços de água poluída', '🛢️'); p(cont.estrada || 0, 'pedaço de rua de terra', 'pedaços de rua de terra', '🟫');
  p(conta('pneu'), 'lugar com pneus (risco de dengue)', 'lugares com pneus (risco de dengue)', '🦟'); p(conta('postequebrado'), 'poste quebrado', 'postes quebrados', '🔦');
  p(conta('fiacao'), 'gato de luz (fios perigosos)', 'gatos de luz (fios perigosos)', '⚡'); p(conta('fogo'), 'queimada', 'queimadas', '🔥'); p(conta('rato'), 'lugar com ratos', 'lugares com ratos', '🐀');
  if (casas.length) {
    if (!contagem.escolas) problemas.push('🏫 Nenhuma escola no bairro'); if (!contagem.saude) problemas.push('➕ Nenhum posto de saúde no bairro');
    if (!soma('agua') && !soma('caixa')) problemas.push('💧 Sem água tratada');
  }
  return { v, nota, contagem, metas, problemas, casas: casas.length };
}

// o que falta para melhorar (frases curtas para o painel)
export function dicas(a) {
  const d = [], v = a.v;
  if (!a.casas) return ['Comece colocando algumas casas 🏠'];
  if (v.educacao < 90) d.push('Coloque uma escola mais perto das casas.');
  if (v.saude < 90) d.push('Falta um posto de saúde perto das casas.');
  if (v.agua < 90) d.push('Coloque uma estação de tratamento de água ou caixas d\'água.');
  if (v.mobilidade < 90) d.push('Asfalte as ruas que passam na porta das casas.');
  if (v.iluminacao != null && v.iluminacao < 90) d.push('Coloque postes de luz nas ruas.');
  if (v.lazer < 80) d.push('Uma praça ou parquinho deixaria o bairro mais feliz.');
  if (v.natureza < 70) d.push('Plante mais árvores e flores.');
  if (v.limpeza < 95) d.push('Tire o lixo das ruas e coloque coleta seletiva.');
  if (v.moradia < 100) d.push('Troque barracos por casas seguras.');
  return d;
}
