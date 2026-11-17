// Bairro Ideal · maquetes prontas para começar (geradas por código, sempre iguais)
import { ruido } from './pecas.js';

export const novoId = () => 'm' + Date.now().toString(36) + Math.random().toString(36).slice(2, 7);

function base(nome, tipo) {
  const agora = new Date().toISOString();
  return { id: novoId(), nome, tipo, cidade: '', historia: '', chao: {}, objs: [], capitulos: [], criado: agora, atualizado: agora, v: 1 };
}
function preencher(m, x0, y0, x1, y1, t) { for (let x = x0; x <= x1; x++) for (let y = y0; y <= y1; y++) m.chao[x + ',' + y] = t; }
const ob = (m, t, x, y, extra = {}) => m.objs.push({ id: 'o' + m.objs.length.toString(36) + Math.random().toString(36).slice(2, 6), t, x, y, r: 0, c: 0, ...extra });

export function terrenoVazio(w = 12, h = 12) { const m = base('Terreno novo', 'livre'); preencher(m, 0, 0, w - 1, h - 1, 'grama'); return m; }

export function umaRua() {
  const m = base('Minha rua', 'livre'); preencher(m, 0, 0, 29, 6, 'grama');
  preencher(m, 0, 3, 29, 3, 'rua'); preencher(m, 0, 2, 29, 2, 'calcada'); preencher(m, 0, 4, 29, 4, 'calcada');
  for (let x = 0; x < 30; x += 2) { ob(m, x % 6 === 0 ? 'sobrado' : 'casa', x, 1, { c: (x / 2) % 8 }); ob(m, 'casa', x + 1, 5, { c: (x / 2 + 3) % 8, r: 0 }); }
  for (let x = 1; x < 30; x += 4) ob(m, 'arvore', x, 1); for (let x = 3; x < 30; x += 6) ob(m, 'poste', x, 2);
  return m;
}

// coloca postes ao lado das ruas, um a cada 3 quadradinhos, onde estiver livre
function postesNasRuas(m) {
  const ocupado = new Set(); m.objs.forEach((o) => { const w = o.t === 'escola' || o.t === 'mercado' ? 2 : ['hospital', 'estacao', 'condominio', 'quadra'].includes(o.t) ? 2 : o.t === 'campo' ? 3 : 1, d = ['hospital', 'estacao', 'condominio', 'quadra', 'campo'].includes(o.t) ? 2 : 1; for (let i = 0; i < w; i++) for (let j = 0; j < d; j++) ocupado.add((o.x + i) + ',' + (o.y + j)); });
  for (const k of Object.keys(m.chao)) {
    if (m.chao[k] !== 'rua') continue; const [x, y] = k.split(',').map(Number); if ((x + y) % 3) continue;
    for (const [dx, dy] of [[0, -1], [1, 0], [0, 1], [-1, 0]]) { const c = (x + dx) + ',' + (y + dy); if (m.chao[c] && m.chao[c] !== 'rua' && m.chao[c] !== 'agua' && !ocupado.has(c)) { ocupado.add(c); ob(m, 'poste', x + dx, y + dy); break; } }
  }
}

export function bairroIdeal() {
  const m = base('Vila Esperança', 'ideal');
  m.cidade = 'Uberlândia - MG';
  m.historia = 'A Vila Esperança é um bairro planejado. Todas as ruas são asfaltadas e iluminadas, a água chega tratada em todas as casas e o lixo é recolhido três vezes por semana. As crianças estudam perto de casa e no fim da tarde as famílias se encontram na praça do lago.';
  preencher(m, 0, 0, 19, 16, 'grama');
  preencher(m, 0, 5, 19, 5, 'rua'); preencher(m, 0, 11, 19, 11, 'rua'); preencher(m, 6, 0, 6, 16, 'rua'); preencher(m, 13, 0, 13, 16, 'rua');
  // quadra A: casas
  for (let x = 0; x < 6; x++) ob(m, x % 3 === 2 ? 'sobrado' : 'casa', x, 4, { c: x });
  ob(m, 'arvore', 0, 2); ob(m, 'ipe-amarelo', 2, 1); ob(m, 'arvore', 4, 2, { c: 1 }); ob(m, 'casa', 1, 0, { c: 6 }); ob(m, 'casa', 4, 0, { c: 7 });
  preencher(m, 0, 3, 5, 3, 'calcada'); [1, 3, 5].forEach((x) => { m.chao[x + ',2'] = 'flores'; });
  // quadra B: escola, creche e quadra de esportes
  ob(m, 'escola', 7, 4); ob(m, 'creche', 10, 4); ob(m, 'quadra', 8, 1); ob(m, 'arvore', 11, 1); ob(m, 'ipe-rosa', 12, 2); ob(m, 'crianca', 7, 2, { c: 2 }); ob(m, 'crianca', 11, 3, { c: 5 });
  ob(m, 'arvore', 7, 0); ob(m, 'bicicleta', 12, 4);
  // quadra C: prédios e comércio
  ob(m, 'predio', 14, 4); ob(m, 'predinho', 15, 4, { c: 1 }); ob(m, 'loja', 16, 4); ob(m, 'loja', 17, 4, { c: 1 }); ob(m, 'mercado', 18, 3);
  ob(m, 'condominio', 14, 1, { c: 2 }); ob(m, 'arvore', 16, 1); ob(m, 'pinheiro', 17, 0); ob(m, 'arvore', 19, 1); ob(m, 'pessoa', 16, 2, { c: 3 });
  // quadra D: praça com lago
  preencher(m, 0, 6, 5, 10, 'praca'); preencher(m, 1, 7, 3, 9, 'agua'); m.chao['4,9'] = 'agua';
  ob(m, 'pato', 2, 8); ob(m, 'fonte', 5, 6); ob(m, 'parquinho', 4, 7); ob(m, 'escorregador', 5, 8); ob(m, 'banco', 0, 6); ob(m, 'banco', 0, 10);
  ob(m, 'arvore', 0, 8); ob(m, 'ipe-rosa', 2, 10); ob(m, 'familia', 4, 10, { c: 1 }); ob(m, 'mesa', 5, 10); ob(m, 'arvore', 3, 6, { c: 2 });
  // quadra E: saúde e casas
  ob(m, 'posto', 7, 6); ob(m, 'igreja', 12, 6); ob(m, 'arvore', 9, 7); ob(m, 'arvore', 11, 8, { c: 1 }); ob(m, 'banco', 10, 7);
  for (let x = 7; x <= 12; x++) ob(m, x === 9 ? 'sobrado' : 'casa', x, 10, { c: x + 2 });
  ob(m, 'pessoa', 8, 8, { c: 1 }); ob(m, 'cachorro', 10, 9);
  // quadra F: campo e água tratada
  ob(m, 'campo', 14, 7); ob(m, 'estacao', 18, 9); ob(m, 'arvore', 17, 6); ob(m, 'arvore', 19, 6, { c: 2 }); ob(m, 'pessoa', 15, 9, { c: 4 }); ob(m, 'pessoa', 16, 10, { c: 6 });
  // quadras de baixo
  for (let x = 0; x < 6; x++) ob(m, 'casa', x, 12, { c: x + 3 });
  ob(m, 'horta', 1, 14); ob(m, 'coleta', 3, 14); ob(m, 'arvore', 5, 15); ob(m, 'arvore', 0, 16, { c: 1 }); m.chao['2,15'] = 'flores'; m.chao['4,16'] = 'flores';
  ob(m, 'ponto', 7, 12); for (let x = 8; x <= 12; x++) ob(m, x % 2 ? 'casa' : 'sobrado', x, 12, { c: x });
  ob(m, 'hospital', 8, 14); ob(m, 'arvore', 11, 14); ob(m, 'arvore', 12, 16, { c: 2 }); ob(m, 'policia', 7, 16);
  ob(m, 'predinho', 14, 12, { c: 3 }); ob(m, 'predinho', 15, 12, { c: 4 }); ob(m, 'bombeiros', 16, 12); ob(m, 'loja', 17, 12, { c: 3 }); ob(m, 'casa', 18, 12, { c: 4 }); ob(m, 'casa', 19, 12, { c: 1 });
  ob(m, 'palmeira', 15, 15); ob(m, 'arvore', 17, 14); ob(m, 'arvore', 19, 15, { c: 1 }); m.chao['18,16'] = 'flores'; m.chao['14,16'] = 'flores';
  // postes, carros, ônibus, caminhão de lixo
  postesNasRuas(m);
  ob(m, 'carro', 3, 5, { c: 0 }); ob(m, 'carro', 6, 2, { c: 1, r: 1 }); ob(m, 'carro', 16, 11, { c: 2 }); ob(m, 'onibus', 13, 8, { r: 1 }); ob(m, 'caminhao', 9, 11); ob(m, 'carro', 6, 14, { c: 4, r: 1 });
  return m;
}

export function bairroCarente() {
  const m = base('Morro Seco', 'carente');
  m.cidade = 'Uberlândia - MG';
  m.historia = 'O Morro Seco cresceu sem planejamento. As ruas são de terra e viram lama quando chove, o esgoto corre a céu aberto e o lixo não é recolhido. A escola e o posto de saúde mais perto ficam longe, e à noite quase não há iluminação.';
  for (let x = 0; x < 20; x++) for (let y = 0; y < 17; y++) m.chao[x + ',' + y] = ruido(x, y, 11) < .45 ? 'seco' : 'terra';
  preencher(m, 0, 8, 19, 8, 'estrada'); preencher(m, 7, 0, 7, 16, 'estrada');
  for (let y = 0; y < 17; y++) if (y !== 8) m.chao['13,' + y] = 'esgoto';
  m.chao['13,8'] = 'esgoto'; preencher(m, 14, 14, 16, 16, 'aguasuja'); m.chao['17,16'] = 'aguasuja';
  [[3, 9], [9, 8], [10, 5], [2, 12], [15, 8], [5, 3]].forEach(([x, y]) => { m.chao[x + ',' + y] = 'lama'; });
  const cheio = new Set(); const pode = (x, y) => !cheio.has(x + ',' + y) && !['estrada', 'esgoto', 'aguasuja'].includes(m.chao[x + ',' + y]);
  const por = (t, x, y, e = {}) => { if (!pode(x, y)) return; cheio.add(x + ',' + y); ob(m, t, x, y, e); };
  for (let x = 0; x < 20; x++) for (let y = 0; y < 17; y++) {
    const r = ruido(x, y, 5);
    if (r < .19) por('barraco', x, y, { c: Math.floor(ruido(x, y, 6) * 6) });
    else if (r < .23) por('ruina', x, y);
  }
  [[4, 7], [9, 2], [11, 10], [2, 15], [16, 6], [18, 12], [6, 13], [8, 9], [12, 3]].forEach(([x, y]) => por('lixo', x, y));
  [[5, 10], [10, 14], [17, 2]].forEach(([x, y]) => por('pneu', x, y)); [[3, 4], [15, 11]].forEach(([x, y]) => por('entulho', x, y));
  [[1, 6], [11, 1], [19, 9], [6, 16]].forEach(([x, y]) => por('arvoreseca', x, y)); por('fogo', 17, 9); por('abandonado', 10, 7);
  [[6, 7], [14, 9], [8, 12]].forEach(([x, y]) => por('postequebrado', x, y)); por('fiacao', 6, 4); por('rato', 12, 12); por('rato', 4, 9);
  [[8, 7, 0], [6, 9, 3], [12, 8, 6], [8, 14, 1], [3, 8, 4]].forEach(([x, y, c]) => por('pessoa', x, y, { c }));
  por('caixa', 9, 4); por('cachorro', 11, 9);
  return m;
}

export const MODELOS = [
  { id: 'ideal', nome: 'Bairro ideal', emoji: '🌳', desc: 'Pronto, com escola, praça e lago', criar: bairroIdeal },
  { id: 'carente', nome: 'Bairro carente', emoji: '🏚️', desc: 'Pronto, com os problemas para discutir', criar: bairroCarente },
  { id: 'vazio', nome: 'Terreno vazio', emoji: '🟩', desc: 'Grama 12 × 12 para montar do zero', criar: () => terrenoVazio() },
  { id: 'rua', nome: 'Uma rua', emoji: '🛣️', desc: 'Rua comprida com casas dos dois lados', criar: umaRua },
];
