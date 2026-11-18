// Bairro Ideal · editor da maquete: mapa 3D/planta, barra de peças (embaixo), ferramentas (esquerda),
// painel com termômetro, metas, sobre o bairro e capítulos da história (direita).
import { el, esc, janela, aviso, balao, confete, confirmar, num } from '../ui.js';
import { abrir, salvar, aoMudar, estado, podeEditar, ehMinha, duplicar, sairVisitante } from '../dados.js';
import { indexar, desenhar, celulaEm, deltaMundo, enquadrar, miniatura, caixaGirada, lapis, K, tamanho, girar, TW, TH, TP } from '../motor.js';
import { calcular, medir as medirReta, coord, fmt, LADO, htmlMatematica } from '../matematica.js';
import { CATEGORIAS, TODAS, OBJETOS, CHAOS, SINONIMOS, peca } from '../pecas.js';
import { analisar, dicas, INDICADORES } from '../termometro.js';
import { chipTipo, TIPOS, notaTxt, corNota, prepararParaSalvar } from './comum.js';
import { historiaAutomatica } from './historia.js';
import { tutorial, TUTORIAL_EDITOR } from '../tutorial.js';

// [id, emoji, nome, dica comprida (computador), dica curta (celular)]
const FERRAMENTAS = [
  ['tocar', '👆', 'Tocar', 'Toque numa peça para ver o que dá para fazer com ela. Arraste para andar pelo mapa; dois dedos ou a rodinha aproximam', '👆 Toque numa peça · arraste para andar'],
  ['colocar', '✏️', 'Colocar', 'Escolha uma peça embaixo e toque no mapa. Chão (grama, rua…) pinta o quadradinho tocado; arraste para pintar vários', '✏️ Escolha uma peça e toque no mapa'],
  ['mao', '✋', 'Mover', 'Arraste uma peça para mudar de lugar, ou arraste o chão para andar pelo mapa', '✋ Arraste uma peça para mudar de lugar'],
  ['apagar', '🧽', 'Apagar', 'Toque numa peça para tirar. Tocando no chão pintado, ele volta a ser grama', '🧽 Toque numa peça para tirar'],
  ['terreno', '📐', 'Terreno', 'Use as setas para aumentar (＋) ou diminuir (－) o terreno. Arraste no mapa para escolher só uma parte e fazer um L', '📐 Use as setas ＋ e －'],
];
// seta curva (desfazer); o refazer é a mesma seta espelhada pelo CSS
const ICONE_VOLTAR = '<svg viewBox="0 0 24 24" width="22" height="22" aria-hidden="true"><path d="M9 14 4 9l5-5" fill="none" stroke="currentColor" stroke-width="2.6" stroke-linecap="round" stroke-linejoin="round"/><path d="M4 9h10.5a5.5 5.5 0 0 1 0 11H11" fill="none" stroke="currentColor" stroke-width="2.6" stroke-linecap="round" stroke-linejoin="round"/></svg>';
const CHAVE_RASCUNHO = (id) => 'bi:rascunho:' + id;
const quando = (t) => new Date(t).toLocaleString('pt-BR', { day: '2-digit', month: '2-digit', hour: '2-digit', minute: '2-digit' }).replace(',', ' às');
// o que dá para mostrar ou esconder no mapa (menu 👁️ Ver)
const CAMADAS = [['grade', '▦', 'Grade', 'Linhas em volta de cada quadradinho'], ['regua', '📏', 'Régua', 'Mede a distância entre dois pontos'], ['eixos', '📊', 'Plano cartesiano', 'Eixos x e y com os números'], ['noite', '🌙', 'Noite', 'Mostra onde tem iluminação']];
const sem = (s) => s.normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase();

export async function montar(app, [id]) {
  const m = await abrir(id);
  if (!m) { app.innerHTML = `<div class="tela" style="display:grid;place-items:center;text-align:center"><div><div style="font-size:54px">🔍</div><h2>Maquete não encontrada</h2><p style="color:var(--tinta2);font-weight:700;margin:8px 0 16px">Ela pode ter sido apagada ou ainda não chegou neste aparelho.</p><a class="bt bt--sol" href="#/">Voltar ao início</a></div></div>`; return; }
  m.chao = m.chao || {}; m.objs = m.objs || []; m.capitulos = m.capitulos || [];
  const edita = podeEditar(m);
  let pref = {}; try { pref = JSON.parse(localStorage.getItem('bi:editor') || '{}'); } catch { /* */ }

  const S = {
    ferr: 'tocar', peca: null, grade: !!pref.grade, cor: 0, rot: 0, area: null, cat: pref.cat || 'casas', busca: '',
    planta: false, noite: false, eixos: false, regua: { on: false, a: null, b: null }, sel: null, hover: null, cam: null, painel: pref.painel ?? innerWidth > 980, aba: pref.aba || 'termo',
  };
  let ix = indexar(m), sujo = false, quadroPedido = false, analise = analisar(m), desfazer = [], refazer = [], salvarTimer = null, salvando = false, pendente = false;

  app.classList.add('app--editor'); document.body.classList.add('no-editor');
  const ed = el(`<div class="ed ${S.painel ? 'com-painel' : ''} ${edita ? '' : 'so-ver'}">
    <canvas class="ed-mapa" aria-label="Mapa da maquete"></canvas>
    <header class="ed-topo">
      <a class="redondo" href="#/" aria-label="Voltar para o início">‹</a>
      <button class="ed-nome" title="Mudar o nome"><b>${esc(m.nome)}</b>${chipTipo(m.tipo)}</button>
      <nav class="ed-modos" aria-label="Modos de ver">
        <button data-modo="3d" class="on">🧊 <span>3D</span></button><button data-modo="planta">🗺️ <span>Planta</span></button>
        <button data-modo="passeio">🚶 <span>Passear</span></button><button data-modo="historia">📖 <span>História</span></button><button data-modo="comparar">⚖️ <span>Comparar</span></button>
      </nav>
      <div class="ed-acoes">
        ${edita ? `<div class="ed-hist" role="group" aria-label="Desfazer e refazer"><button data-a="desfazer" title="Desfazer (Ctrl+Z)" aria-label="Desfazer">${ICONE_VOLTAR}</button><button data-a="refazer" title="Refazer (Ctrl+Y)" aria-label="Refazer">${ICONE_VOLTAR}</button></div>
        <button class="ed-salvo" data-a="salvar" title="Salvar (Ctrl+S)"><span class="ed-salvo-i">✓</span><span class="ed-salvo-t">Salvo</span></button>` : ''}
        <button class="redondo" data-a="compartilhar" title="Compartilhar (WhatsApp e QR Code)">📤</button>
        <button class="redondo ed-bt-painel" data-a="painel" title="Informações do bairro">📊</button>
      </div>
    </header>
    ${edita ? '' : estado.visitante ? `<div class="ed-faixa">👀 <span><b>Modo visitante</b>: olhe à vontade, gire, veja a planta, a matemática e a história.</span> <button class="bt bt--verde" data-a="entrar">🔑 Entrar para editar</button></div>` : `<div class="ed-faixa">👀 Maquete de <b>${esc(m.donoNome || m.dono || 'outra pessoa')}</b>. Você pode ver, passear e apresentar. <button class="bt bt--sol" data-a="duplicar">📄 Fazer uma cópia para editar</button></div>`}
    <div class="ed-dica"></div>
    <div class="ed-ferr" role="toolbar" aria-label="Ferramentas">
      ${FERRAMENTAS.map(([f, e, n]) => `<button class="ed-f" data-f="${f}" title="${n}"><span>${e}</span><small>${n}</small></button>`).join('')}
      
    </div>
    <div class="ed-vista">
      <button class="redondo" data-a="girar" title="Girar a vista (Q / E)">↻</button>
      <button class="redondo" data-a="mais" title="Aproximar">＋</button><button class="redondo" data-a="menos" title="Afastar">－</button>
      <button class="redondo" data-a="tudo" title="Ver o mapa inteiro">⌖</button>
      <button class="redondo ed-bt-ajuda" data-a="ajuda" title="Como usar o editor">❓</button>
      <button class="redondo ed-bt-ver" data-a="ver" title="Mostrar no mapa: grade, régua, plano cartesiano, noite" aria-expanded="false">👁️<b class="ed-ver-n esconde"></b></button>
    </div>
    <div class="ed-ver esconde" role="menu" aria-label="Mostrar no mapa"><h4>👁️ Mostrar no mapa</h4>
      ${CAMADAS.map(([id, e, n, d]) => `<button class="ed-ver-i" data-a="${id}" role="menuitemcheckbox" aria-checked="false"><span class="ed-ver-e">${e}</span><span class="ed-ver-t"><b>${n}</b><small>${d}</small></span><i class="chave"></i></button>`).join('')}
    </div>
    <div class="ed-sel esconde"></div>
    <div class="ed-confirma esconde" role="group" aria-label="Colocar a peça"><button data-c="cancelar" title="Cancelar">✕</button><button data-c="girar" title="Girar (R)">🔄</button><button data-c="ok" class="ed-confirma-ok">✓ Colocar</button></div>
    <div class="ed-setas esconde">${[['N', 'para cima no mapa'], ['L', 'para a direita no mapa'], ['S', 'para baixo no mapa'], ['O', 'para a esquerda no mapa']].map(([d, t]) => `<div class="ed-seta" data-lado="${d}"><button class="ed-seta-mais" data-seta="${d}" data-op="mais" title="Aumentar ${t}"><i>➜</i><b>＋</b></button><button class="ed-seta-menos" data-seta="${d}" data-op="menos" title="Diminuir ${t}">－</button></div>`).join('')}</div>
    <div class="ed-regua lousa esconde"></div>
    <section class="ed-doca">
      <div class="ed-doca-top">
        <div class="ed-cats">${CATEGORIAS.map((c) => `<button data-cat="${c.id}"><span style="background:${c.cor}">${c.emoji}</span>${c.nome}</button>`).join('')}</div>
        <label class="ed-busca"><span>🔍</span><input type="search" placeholder="Procurar peça…" aria-label="Procurar peça"></label>
        <button class="ed-doca-enc" data-a="encolher" title="Esconder as peças">▾</button>
      </div>
      <div class="ed-opc"></div>
      <div class="ed-pecas" role="listbox" aria-label="Peças"></div>
      <div class="ed-terreno"></div>
    </section>
    <aside class="ed-painel" aria-label="Sobre o bairro">
      <div class="ed-abas"><button data-aba="termo"><span>🌡️</span>Termômetro</button><button data-aba="metas"><span>🎯</span>Metas</button><button data-aba="sobre"><span>📝</span>Sobre</button><button data-aba="caps"><span>📖</span>Capítulos</button><button data-aba="mat"><span>📐</span>Matemática</button></div>
      <div class="ed-aba-c"></div>
    </aside>
  </div>`);
  app.append(ed);
  ed.addEventListener('scroll', () => { if (ed.scrollTop || ed.scrollLeft) { ed.scrollTop = 0; ed.scrollLeft = 0; } }); // Safari antigo sem overflow: clip
  const $ = (s) => ed.querySelector(s), cv = $('.ed-mapa'), ctx = cv.getContext('2d');
  let W = 0, H = 0;

  // ------------------------------------------------ desenho
  function medir() {
    const r = cv.getBoundingClientRect(), d = Math.min(2, devicePixelRatio || 1); W = r.width; H = r.height;
    ed.style.setProperty('--doca', ($('.ed-doca').offsetHeight || 0) + 'px'); document.body.style.setProperty('--doca-g', (($('.ed-doca').offsetHeight || 0) + (celular() ? 80 : 30)) + 'px');
    cv.width = Math.round(W * d); cv.height = Math.round(H * d); ctx.setTransform(d, 0, 0, d, 0, 0);
    if (!S.cam) enquadrarTudo(false); pedir();
  }
  const celular = () => innerWidth <= 760;
  const areaUtil = () => { // pedaço da tela que não fica atrás do painel, das ferramentas e da doca
    const ter = S.ferr === 'terreno' && edita; // no modo Terreno sobra espaço em volta para as setas
    const p = S.painel && innerWidth > 980 && !(ter && innerWidth <= 1180) ? 340 : 0, doca = (edita ? $('.ed-doca').offsetHeight : 0) || 0;
    let a;
    if (celular()) { const f = edita ? $('.ed-ferr').offsetHeight + 8 : 0; a = { x: 8, y: 104, w: W - (ter ? 60 : 16), h: H - 104 - doca - f - 16 }; } // no celular o mapa pode passar por baixo dos botões da direita
    else a = { x: edita ? 86 : 20, y: 70, w: W - p - (edita ? 150 : 90), h: H - doca - 90 };
    if (ter) { const mx = celular() ? 14 : 64, my = celular() ? 44 : 56; a = { x: a.x + mx, y: a.y + my, w: a.w - 2 * mx, h: a.h - 2 * my }; }
    return a;
  };
  function enquadrarTudo(anima = true) {
    const a = areaUtil(); const c = enquadrar(ix, Math.max(200, a.w), Math.max(200, a.h), S.cam?.rot || 0, S.planta, .92);
    // centraliza a área útil (descontando painel e doca)
    const off = deltaMundo(c, (W / 2 - (a.x + a.w / 2)), (H / 2 - (a.y + a.h / 2)) - (S.planta ? 0 : 20), S.planta);
    const alvo = { ...c, x: c.x + off[0], y: c.y + off[1] };
    if (anima && S.cam) animar(alvo); else { S.cam = alvo; pedir(); }
  }
  let anim = null;
  function animar(alvo, ms = 320) {
    const de = { ...S.cam }, t0 = performance.now(); anim = alvo;
    const passo = (t) => { if (anim !== alvo) return; const p = Math.min(1, (t - t0) / ms), e = 1 - Math.pow(1 - p, 3);
      S.cam = { x: de.x + (alvo.x - de.x) * e, y: de.y + (alvo.y - de.y) * e, z: de.z + (alvo.z - de.z) * e, rot: alvo.rot }; pedir(true); if (p < 1) requestAnimationFrame(passo); else anim = null; };
    requestAnimationFrame(passo);
  }
  function pedir(agora) { if (agora) return quadro(); if (quadroPedido) return; quadroPedido = true; requestAnimationFrame(() => { quadroPedido = false; quadro(); }); }
  let ultimosDesenhados = [];
  function quadro() {
    if (sujo) { ix = indexar(m); sujo = false; }
    ctx.clearRect(0, 0, W, H);
    if (S.noite) { const g = ctx.createLinearGradient(0, 0, 0, H); g.addColorStop(0, '#0f1733'); g.addColorStop(1, '#27325e'); ctx.fillStyle = g; ctx.fillRect(0, 0, W, H); estrelas(); }
    const opt = { noite: S.noite, planta: S.planta, selecionado: S.sel, marcas: marcasPincel(), grade: S.grade };
    const f = fantasma(); if (f) opt.fantasma = f;
    const r = desenhar(ctx, ix, S.cam, W, H, opt); ultimosDesenhados = r.desenhados;
    if (S.eixos) desenharEixos(); if (S.regua.on) desenharRegua(); posicionarSetas();
    if (S.sel) posicionarSel();
    posicionarConfirma();
  }
  // ponto do mundo (centro do quadradinho x,y) na tela
  function noTela(x, y, z = 0) { const G = lapis(ctx, S.cam, W, H, { planta: S.planta }); const [X, Y] = girar(S.cam.rot || 0, x + .5, y + .5); return G.P(X, Y, z); }
  function rotulo(txt, p, fundo = '#2b2a33', cor = '#fff', tam = 12) {
    ctx.font = `800 ${tam}px Nunito, sans-serif`; const w = ctx.measureText(txt).width + 12, h = tam + 8;
    ctx.fillStyle = fundo; ctx.beginPath(); ctx.roundRect(p[0] - w / 2, p[1] - h / 2, w, h, h / 2); ctx.fill(); ctx.fillStyle = cor; ctx.textAlign = 'center'; ctx.textBaseline = 'middle'; ctx.fillText(txt, p[0], p[1] + .5);
  }
  function seta(a, b, cor, lw = 2.5) {
    ctx.strokeStyle = cor; ctx.fillStyle = cor; ctx.lineWidth = lw; ctx.beginPath(); ctx.moveTo(a[0], a[1]); ctx.lineTo(b[0], b[1]); ctx.stroke();
    const ang = Math.atan2(b[1] - a[1], b[0] - a[0]); ctx.beginPath(); ctx.moveTo(b[0], b[1]); ctx.lineTo(b[0] - 11 * Math.cos(ang - .4), b[1] - 11 * Math.sin(ang - .4)); ctx.lineTo(b[0] - 11 * Math.cos(ang + .4), b[1] - 11 * Math.sin(ang + .4)); ctx.closePath(); ctx.fill();
  }
  function desenharEixos() {
    const { x0, y0, x1, y1 } = ix.lim; const passo = S.cam.z * (S.planta ? TP : TW / 2) > 20 ? 1 : S.cam.z * (S.planta ? TP : TW / 2) > 8 ? 5 : 10;
    const cor = S.noite ? '#ffe39a' : '#1d3557';
    ctx.save(); ctx.globalAlpha = .9;
    seta(noTela(Math.min(x0, 0) - 1, 0), noTela(Math.max(x1, 0) + 1, 0), cor); seta(noTela(0, Math.max(y1, 0) + 1), noTela(0, Math.min(y0, 0) - 2), cor);
    for (let x = Math.min(x0, 0); x <= Math.max(x1, 0); x++) if (x && x % passo === 0) rotulo(String(x), noTela(x, 0), '#fff', '#1d3557', 11);
    for (let y = Math.min(y0, 0); y <= Math.max(y1, 0); y++) if (y && y % passo === 0) rotulo(String(-y), noTela(0, y), '#fff', '#1d3557', 11);
    rotulo('O (0, 0)', noTela(0, 0), '#1d3557'); rotulo('x', noTela(Math.max(x1, 0) + 1.6, 0), cor, '#fff', 13); rotulo('y', noTela(0, Math.min(y0, 0) - 2.6), cor, '#fff', 13);
    ctx.restore();
  }
  function desenharRegua() {
    const { a } = S.regua; const b = S.regua.b || (a ? S.hover : null); if (!a) return;
    const z = S.planta ? 0 : 4, pa = noTela(a.x, a.y, z);
    ctx.save();
    if (b && (b.x !== a.x || b.y !== a.y)) {
      const pb = noTela(b.x, b.y, z), pc = noTela(b.x, a.y, z);
      ctx.setLineDash([6, 5]); ctx.strokeStyle = 'rgba(29,53,87,.7)'; ctx.lineWidth = 2; ctx.beginPath(); ctx.moveTo(pa[0], pa[1]); ctx.lineTo(pc[0], pc[1]); ctx.lineTo(pb[0], pb[1]); ctx.stroke(); ctx.setLineDash([]);
      ctx.strokeStyle = '#ff7a59'; ctx.lineWidth = 4; ctx.lineCap = 'round'; ctx.beginPath(); ctx.moveTo(pa[0], pa[1]); ctx.lineTo(pb[0], pb[1]); ctx.stroke();
      const r = medirReta(a, b); rotulo(`${fmt(r.metros, 1)} m`, [(pa[0] + pb[0]) / 2, (pa[1] + pb[1]) / 2 - 14], '#ff7a59');
      if (r.dx) rotulo(`Δx = ${Math.abs(r.dx)}`, [(pa[0] + pc[0]) / 2, (pa[1] + pc[1]) / 2 + 12], '#fff', '#1d3557', 11);
      if (r.dy) rotulo(`Δy = ${Math.abs(r.dy)}`, [(pc[0] + pb[0]) / 2, (pc[1] + pb[1]) / 2 + 12], '#fff', '#1d3557', 11);
      ctx.fillStyle = '#ff7a59'; ctx.beginPath(); ctx.arc(pb[0], pb[1], 7, 0, 7); ctx.fill(); rotulo('B ' + coord(b), [pb[0], pb[1] - 22], '#2b2a33');
    }
    ctx.fillStyle = '#1f6f50'; ctx.beginPath(); ctx.arc(pa[0], pa[1], 7, 0, 7); ctx.fill(); rotulo('A ' + coord(a), [pa[0], pa[1] - 22], '#1f6f50');
    ctx.restore();
  }
  const reguaEl = $('.ed-regua');
  function atualizarRegua() {
    const { on, a, b } = S.regua; ed.querySelector('[data-a=regua]').classList.toggle('on', on); ed.classList.toggle('com-regua', on);
    if (!on) { reguaEl.classList.add('esconde'); return; } reguaEl.classList.remove('esconde');
    if (!a) { reguaEl.innerHTML = '<h4>📏 Régua</h4><p>Toque no ponto <b>A</b> e depois no ponto <b>B</b>.</p><button data-r="fechar">✕</button>'; return; }
    if (!b) { reguaEl.innerHTML = `<h4>📏 Régua</h4><p>A = ${coord(a)}. Agora toque no ponto <b>B</b>.</p><button data-r="fechar">✕</button>`; return; }
    const r = medirReta(a, b);
    reguaEl.innerHTML = `<h4>📏 Distância de A até B</h4><button data-r="fechar">✕</button>
      <p class="ideia">A ${coord(a)} e B ${coord(b)} formam um triângulo retângulo: os catetos são Δx e Δy, a reta laranja é a hipotenusa.</p>
      <ol class="passos"><li class="f">Δx = ${b.x} − ${a.x} = ${r.dx} · Δy = ${-b.y || 0} − ${-a.y || 0} = ${r.dy}</li>
      <li class="f">d² = Δx² + Δy² = ${r.dx * r.dx} + ${r.dy * r.dy} = ${r.dx * r.dx + r.dy * r.dy}</li>
      <li class="f">d = √${r.dx * r.dx + r.dy * r.dy} ≈ ${fmt(r.d, 2)} quadradinhos</li>
      <li class="f">${fmt(r.d, 2)} × ${LADO} m ≈ <b>${fmt(r.metros, 1)} m</b> em linha reta</li></ol>
      <p class="prova">🚶 <b>A pé pelas quadras</b> (sem cortar caminho): (|Δx| + |Δy|) × 10 = <b>${fmt(r.aPe)} m</b>. A linha reta é sempre o caminho mais curto!</p>
      <small>${r.inclinacao == null ? 'Reta vertical: Δx = 0, então não dá para dividir por Δx.' : `Inclinação: m = Δy ÷ Δx = ${r.dy} ÷ ${r.dx} ≈ ${fmt(r.inclinacao, 2)} · ângulo ≈ ${fmt(r.ang, 1)}°`}</small>`;
  }
  reguaEl.addEventListener('click', (e) => { if (e.target.closest('[data-r=fechar]')) { S.regua = { on: false, a: null, b: null }; atualizarRegua(); atualizarVer(); pedir(); } });
  function estrelas() { ctx.fillStyle = 'rgba(255,255,255,.75)'; for (let i = 0; i < 70; i++) { const x = (i * 197.3) % W, y = (i * 71.9) % (H * .6); ctx.fillRect(x, y, 1.6, 1.6); } }
  new ResizeObserver(medir).observe(cv);

  // ------------------------------------------------ peças e regras de lugar
  const pecaAtual = () => (S.peca ? peca(S.peca) : null);
  const celsPincel = (c) => [[c.x, c.y]];
  // parte do terreno escolhida no modo Terreno (sem escolha = terreno todo)
  const areaAtual = () => S.area || { x0: ix.lim.x0, y0: ix.lim.y0, x1: ix.lim.x1 - 1, y1: ix.lim.y1 - 1 };
  function marcasPincel() {
    if (!edita || S.arrastandoMapa) return [];
    if (S.ferr === 'terreno') {
      if (!S.area) return []; const { x0, y0, x1, y1 } = S.area; if ((x1 - x0 + 1) * (y1 - y0 + 1) > 6000) return [];
      const out = []; for (let x = x0; x <= x1; x++) for (let y = y0; y <= y1; y++) out.push({ x, y, cor: '#4cc9f0', borda: '#1d7fb3' }); return out;
    }
    if (!S.hover) return [];
    const p = pecaAtual();
    if (S.ferr === 'apagar') return [{ x: S.hover.x, y: S.hover.y, cor: '#ffb703' }];
    if (S.ferr === 'colocar' && p && p.tipo === 'chao') return [{ x: S.hover.x, y: S.hover.y, cor: '#ffffff' }];
    return [];
  }
  function cabe(t, x, y, r, ignorar) {
    const p = OBJETOS[t]; if (!p) return false; const w = r % 2 ? p.d : p.w, d = r % 2 ? p.w : p.d;
    for (let i = 0; i < w; i++) for (let j = 0; j < d; j++) {
      const k = K(x + i, y + j), ch = ix.chao.get(k); if (!ch) return false;
      const oc = ix.ocup.get(k); if (oc && oc !== ignorar) return false;
      const naAgua = ch === 'agua' || ch === 'aguasuja'; if (p.agua ? !naAgua : naAgua) return false;
    }
    return true;
  }
  function fantasma() {
    if (!edita) return null;
    if (S.mira && S.ferr === 'colocar') return fantasmaEm(S.mira);
    if (!S.hover || S.arrastandoMapa) return null;
    if (S.mover) { const o = S.mover.o; return { t: o.t, x: S.hover.x - S.mover.dx, y: S.hover.y - S.mover.dy, r: o.r, c: o.c, ok: cabe(o.t, S.hover.x - S.mover.dx, S.hover.y - S.mover.dy, o.r || 0, o) }; }
    if (toqueSemMouse) return null; // no toque a peça transparente só aparece quando o dedo encosta
    return fantasmaEm(S.hover);
  }
  function fantasmaEm(alvo) {
    const p = pecaAtual(); if (S.ferr !== 'colocar' || !p || p.tipo !== 'obj' || !alvo) return null;
    const [w, d] = tamanho({ t: p.id, r: S.rot });
    const x = alvo.x - Math.floor((w - 1) / 2), y = alvo.y - Math.floor((d - 1) / 2);
    return { t: p.id, x, y, r: S.rot, c: S.cor, ok: cabe(p.id, x, y, S.rot) };
  }
  const novoObj = (t, x, y, r, c) => ({ id: 'o' + Date.now().toString(36) + Math.random().toString(36).slice(2, 6), t, x, y, r, c });

  // ------------------------------------------------ histórico (desfazer/refazer)
  const foto = () => JSON.stringify({ chao: m.chao, objs: m.objs });
  let antes = null;
  function comecarMudanca() { if (!antes) antes = foto(); }
  function terminarMudanca() {
    if (!antes) return; const agora = foto(); if (agora !== antes) { desfazer.push(antes); if (desfazer.length > 60) desfazer.shift(); refazer = []; mudou(); }
    antes = null; botoesHist();
  }
  function voltar(de, para) {
    if (!de.length) return; para.push(foto()); const f = JSON.parse(de.pop()); m.chao = f.chao; m.objs = f.objs; S.sel = null; sujo = true; mudou(); botoesHist(); esconderSel(); pedir();
  }
  function botoesHist() { const a = ed.querySelector('[data-a=desfazer]'), b = ed.querySelector('[data-a=refazer]'); if (a) a.disabled = !desfazer.length; if (b) b.disabled = !refazer.length; }

  // ------------------------------------------------ salvar
  // Cada mudança vira um RASCUNHO guardado sozinho no aparelho (nada se perde, nem se a bateria acabar).
  // A maquete de verdade (e a nuvem) só muda quando ela toca em 💾 Salvar. Ao sair com mudanças, o app pergunta.
  const selo = $('.ed-salvo');
  function mostrarSelo(estadoSelo, texto) {
    if (!selo) return; selo.dataset.e = estadoSelo;
    const icones = { salvo: '✓', mudou: '💾', salvando: '⏳', nuvem: '☁️', aparelho: '📦', erro: '⚠️' };
    selo.querySelector('.ed-salvo-i').textContent = icones[estadoSelo] || '✓'; selo.querySelector('.ed-salvo-t').textContent = texto;
    selo.title = estadoSelo === 'mudou' ? 'Tem mudanças que ainda não foram salvas. Toque para salvar (Ctrl+S)' : estadoSelo === 'aparelho' ? 'Salvo no aparelho; vai para a nuvem quando a internet voltar' : 'Salvar (Ctrl+S)';
  }
  function mudou() {
    pendente = true; mostrarSelo('mudou', 'Salvar'); reanalisar();
    clearTimeout(salvarTimer); salvarTimer = setTimeout(guardarRascunho, 700);
  }
  function guardarRascunho() {
    clearTimeout(salvarTimer); if (!edita || !pendente) return;
    try { localStorage.setItem(CHAVE_RASCUNHO(m.id), JSON.stringify({ quando: Date.now(), base: m.atualizado || null, m })); } catch (e) { console.warn('rascunho não coube', e); }
  }
  const apagarRascunho = () => { try { localStorage.removeItem(CHAVE_RASCUNHO(m.id)); } catch { /* */ } };
  function juntarTexto() { if (textoPendente) { clearTimeout(textoTimer); textoPendente = false; pendente = true; } }
  async function gravar() {
    juntarTexto(); clearTimeout(salvarTimer); if (!pendente || !edita) return true; if (salvando) { await new Promise((r) => setTimeout(r, 300)); return gravar(); }
    salvando = true; pendente = false; mostrarSelo('salvando', 'Salvando…');
    try {
      await salvar(prepararParaSalvar(m)); apagarRascunho();
      if (estado.nuvem && estado.sessao) mostrarSelo(navigator.onLine ? 'nuvem' : 'aparelho', navigator.onLine ? 'Enviando…' : 'No aparelho'); else mostrarSelo('salvo', 'Salvo');
      return true;
    } catch (e) { mostrarSelo('erro', 'Não salvou'); pendente = true; guardarRascunho(); console.error(e); aviso('⚠️ Não consegui salvar agora. Suas mudanças ficaram no rascunho.', 'erro', 3500); return false; }
    finally { salvando = false; }
  }
  // janela ao sair com mudanças: Salvar / Guardar rascunho / Descartar / Continuar editando
  async function perguntarSaida() {
    juntarTexto(); if (!pendente || !edita) return true;
    document.querySelectorAll('.avisos .aviso').forEach((x) => x.remove()); // nada por cima da janela
    const r = await janela({ titulo: '💾 Você ainda não salvou', classe: 'janela-sair',
      corpo: `<p class="sair-p">As mudanças em <b>${esc(m.nome)}</b> ainda não foram salvas. O que você quer fazer?</p>
        <ul class="sair-l"><li><b>💾 Salvar</b> guarda tudo na maquete${estado.nuvem && estado.sessao ? ' e na nuvem' : ''}.</li><li><b>📝 Rascunho</b> guarda só neste aparelho, para continuar depois.</li><li><b>🗑️ Descartar</b> volta para a última versão salva.</li></ul>`,
      botoes: [{ texto: '🗑️ Descartar', classe: 'bt--perigo-leve', valor: 'descartar' }, { texto: '📝 Guardar rascunho', classe: 'bt--leve', valor: 'rascunho' }, { texto: '💾 Salvar', classe: 'bt--sol', valor: 'salvar' }] });
    if (r === 'salvar') return gravar();
    if (r === 'rascunho') { guardarRascunho(); pendente = false; aviso('📝 Rascunho guardado neste aparelho. Ele aparece quando você abrir a maquete de novo.', 'ok', 3200); return true; }
    if (r === 'descartar') { if (!(await confirmar('Descartar as mudanças?', 'Tudo o que você mudou desde o último <b>Salvar</b> vai sumir.', 'Descartar'))) return false; apagarRascunho(); pendente = false; return true; }
    return false; // fechou a janela = continua editando
  }
  async function trocarPelaDaNuvem() {
    if (!edita) return;
    if (pendente || textoPendente) { aviso('☁️ Esta maquete foi salva em outro aparelho. Se você salvar aqui, a sua versão fica valendo.', 'ok', 5000); return; }
    const nova = await abrir(m.id); if (!nova) return;
    for (const k of Object.keys(m)) if (!(k in nova)) delete m[k];
    Object.assign(m, nova); ix = indexar(m); S.sel = null; esconderSel(); desfazer = []; refazer = []; botoesHist();
    ed.querySelector('.ed-nome b').textContent = m.nome; analise = analisar(m); desenharAba(); notaTopo(); pedir();
    mostrarSelo('nuvem', 'Salvo na nuvem'); aviso('☁️ Atualizei com o que foi salvo no outro aparelho', 'ok', 3000);
  }
  const desligarDados = aoMudar((ev) => {
    if (ev.tipo === 'nuvem-mudou') { if (ev.ids.includes(m.id)) trocarPelaDaNuvem(); return; } // salvaram esta maquete em outro aparelho
    if (ev.id !== m.id) return;
    if (ev.tipo === 'salvo' && ev.nuvem && !pendente) mostrarSelo('nuvem', 'Salvo na nuvem');
    if (ev.tipo === 'erro_nuvem' && !pendente) mostrarSelo('aparelho', 'No aparelho');

  });

  // ------------------------------------------------ ações no mapa
  function pintarChao(c, t) {
    const k = c.x + ',' + c.y; if (!m.chao[k] || m.chao[k] === t) return;
    m.chao[k] = t; ix = indexar(m); pedir();
  }
  function apagarEm(c) {
    const o = ix.ocup.get(K(c.x, c.y));
    if (o) { m.objs = m.objs.filter((x) => x !== o); if (o === S.sel) { S.sel = null; esconderSel(); } }
    else { const k = c.x + ',' + c.y; if (!m.chao[k] || m.chao[k] === 'grama') return; m.chao[k] = 'grama'; }
    ix = indexar(m); pedir();
  }
  const tiraForaDoChao = () => { const fora = (o) => { const [w, d] = tamanho(o); for (let i = 0; i < w; i++) for (let j = 0; j < d; j++) if (!m.chao[(o.x + i) + ',' + (o.y + j)]) return true; return false; }; const antes = m.objs.length; m.objs = m.objs.filter((o) => !fora(o)); return antes - m.objs.length; };
  // setas do terreno: cada linha (ou coluna) da parte escolhida ganha/perde 1 quadradinho na ponta daquele lado
  const LADOS = { N: [0, -1], S: [0, 1], L: [1, 0], O: [-1, 0] };
  function mudarTerreno(lado, mais) {
    const [dx, dy] = LADOS[lado], ar = areaAtual(), horiz = dx !== 0;
    const linhas = new Map(); // linha -> lista de posições que existem
    for (const k of Object.keys(m.chao)) {
      const [x, y] = k.split(',').map(Number); if (x < ar.x0 || x > ar.x1 || y < ar.y0 || y > ar.y1) continue;
      const l = horiz ? y : x, v = horiz ? x : y; if (!linhas.has(l)) linhas.set(l, []); linhas.get(l).push(v);
    }
    if (!linhas.size) { aviso('Escolha uma parte que tenha chão 🙂', 'erro'); return; }
    const total = Object.keys(m.chao).length;
    if (!mais && total - linhas.size < 1) { aviso('O terreno precisa ter pelo menos 1 quadradinho', 'erro'); return; }
    comecarMudanca(); let n = 0;
    for (const [l, vs] of linhas) {
      const ponta = (horiz ? dx : dy) > 0 ? Math.max(...vs) : Math.min(...vs), sinal = (horiz ? dx : dy);
      if (mais) { const v = ponta + sinal, k = horiz ? v + ',' + l : l + ',' + v; if (!m.chao[k]) { m.chao[k] = 'grama'; n++; } }
      else if (vs.length > 1 || !S.area) { const k = horiz ? ponta + ',' + l : l + ',' + ponta; delete m.chao[k]; n++; }
    }
    const caiu = mais ? 0 : tiraForaDoChao();
    if (S.area) { // a parte escolhida acompanha a mudança
      const d = mais ? 1 : -1;
      if (lado === 'L') S.area.x1 = Math.max(S.area.x0, S.area.x1 + d); if (lado === 'O') S.area.x0 = Math.min(S.area.x1, S.area.x0 - d);
      if (lado === 'S') S.area.y1 = Math.max(S.area.y0, S.area.y1 + d); if (lado === 'N') S.area.y0 = Math.min(S.area.y1, S.area.y0 - d);
    }
    ix = indexar(m); terminarMudanca(); pedir(); desenharTerreno(); seguirTerreno();
    if (caiu) aviso(`${caiu} ${caiu === 1 ? 'peça saiu' : 'peças saíram'} junto com o chão (dá para desfazer ↶)`, 'ok', 2600);
    void n;
  }
  function crescer() {
    comecarMudanca(); const novos = [];
    for (const k of Object.keys(m.chao)) { const [x, y] = k.split(',').map(Number); for (const [dx, dy] of [[1, 0], [-1, 0], [0, 1], [0, -1], [1, 1], [-1, -1], [1, -1], [-1, 1]]) { const n = (x + dx) + ',' + (y + dy); if (!m.chao[n]) novos.push(n); } }
    novos.forEach((n) => { m.chao[n] = 'grama'; }); ix = indexar(m); S.area = null; terminarMudanca(); pedir(); desenharTerreno(); seguirTerreno();
  }
  // se o terreno cresceu para fora da tela (e as setas iam ficar escondidas), a câmera se afasta para mostrar tudo
  function seguirTerreno() {
    const a = areaUtil(), G = lapis(ctx, S.cam, W, H, { planta: S.planta }), rot = S.cam.rot || 0, { x0, y0, x1, y1 } = ix.lim;
    const fora = [[x0, y0], [x1 + 1, y0], [x1 + 1, y1 + 1], [x0, y1 + 1]].some(([x, y]) => { const [X, Y] = girar(rot, x, y); const [px, py] = G.P(X, Y); return px < a.x || px > a.x + a.w || py < a.y - 40 || py > a.y + a.h; });
    if (fora) enquadrarTudo();
  }
  // ------------------------------------------------ colocar peça (como nos jogos de construção):
  // a peça aparece transparente, a pessoa ajeita e confirma; se o lugar estiver ocupado, pergunta o que fazer
  let toqueSemMouse = false;
  const miraEm = (x, y, toque) => cel(x, toque ? y - 56 : y); // no toque a peça fica um pouco acima do dedo (o dedo não tampa)
  const confEl = $('.ed-confirma');
  function mostrarConfirma() { const f = fantasma(); if (!f) { esconderConfirma(); return; } const ok = confEl.querySelector('[data-c=ok]'); ok.textContent = f.ok ? '✓ Colocar' : '⚠️ Ocupado'; ok.classList.toggle('ruim', !f.ok); confEl.classList.remove('esconde'); posicionarConfirma(); }
  function esconderConfirma() { confEl.classList.add('esconde'); }
  function posicionarConfirma() {
    if (confEl.classList.contains('esconde')) return; const f = fantasma(); if (!f) { esconderConfirma(); return; }
    const b = caixaGirada(S.cam.rot, f), G = lapis(ctx, S.cam, W, H, { planta: S.planta });
    const p = S.planta ? G.P(b.X + b.W / 2, b.Y + b.D) : G.P(b.X + b.W / 2, b.Y + b.D / 2, 0);
    confEl.style.left = Math.max(110, Math.min(W - 110, p[0])) + 'px'; confEl.style.top = Math.max(150, Math.min(H - 60, p[1] + 26 * Math.max(.6, S.cam.z))) + 'px';
  }
  const mostrarConfirmaSeAberta = () => { if (!confEl.classList.contains('esconde')) mostrarConfirma(); };
  function cancelarMira() { S.mira = null; esconderConfirma(); pedir(); }
  function porPeca(f) {
    comecarMudanca(); const o = novoObj(f.t, f.x, f.y, f.r, f.c); m.objs.push(o); ix = indexar(m); terminarMudanca(); pedir();
    const p = OBJETOS[o.t]; if (p.cores && ['pessoa', 'familia', 'crianca', 'carro', 'casa', 'barraco'].includes(o.t)) { S.cor = (S.cor + 1) % p.cores; desenharOpcoes(); }
    const G = lapis(ctx, S.cam, W, H, { planta: S.planta }), b = caixaGirada(S.cam.rot, o), q = G.P(b.X + b.W / 2, b.Y + b.D / 2, 30); feedbackLocal(q[0], q[1]);
    return o;
  }
  async function tentarColocar() {
    const f = fantasma(); if (!f) return;
    if (f.ok) { porPeca(f); cancelarMira(); return; }
    // lugar ruim: descobre o porquê
    const p = OBJETOS[f.t], [w, d] = tamanho({ t: f.t, r: f.r }), ocup = new Set(); let semChao = false, aguaErrada = false;
    for (let i = 0; i < w; i++) for (let j = 0; j < d; j++) {
      const k = K(f.x + i, f.y + j), ch = ix.chao.get(k); if (!ch) { semChao = true; continue; }
      const naAgua = ch === 'agua' || ch === 'aguasuja'; if (p.agua ? !naAgua : naAgua) aguaErrada = true;
      const oc = ix.ocup.get(k); if (oc) ocup.add(oc);
    }
    const nomes = [...new Set([...ocup].map((o) => OBJETOS[o.t]?.nome || 'peça'))].join(', ');
    const podeTrocar = ocup.size && !semChao && !aguaErrada;
    const motivo = semChao ? 'Esse lugar fica <b>fora do terreno</b>.' : aguaErrada ? (p.agua ? 'Essa peça precisa ficar <b>na água</b>.' : 'Essa peça <b>não pode ficar na água</b>.') : `Neste lugar já tem: <b>${esc(nomes)}</b>.`;
    const r = await janela({ titulo: podeTrocar ? '🏠 Já tem uma peça aqui' : '🙈 Não cabe aqui', classe: 'janela-sair',
      corpo: `<p class="sair-p">${motivo} O que você quer fazer com <b>${esc(p.nome)}</b>?</p>`,
      botoes: [{ texto: 'Cancelar', classe: 'bt--leve', valor: null }, { texto: '↔️ Pôr ao lado', classe: podeTrocar ? '' : 'bt--sol', valor: 'lado' }, ...(podeTrocar ? [{ texto: '🔁 Substituir', classe: 'bt--sol', valor: 'trocar' }] : [])] });
    if (!r && !toqueSemMouse) { cancelarMira(); return; } // mouse: cancelou, some a peça transparente (no toque ela fica para ajeitar)
    if (r === 'trocar') {
      comecarMudanca(); m.objs = m.objs.filter((o) => !ocup.has(o)); ix = indexar(m); terminarMudanca();
      porPeca({ ...f, ok: true }); cancelarMira(); aviso(`🔁 Troquei ${nomes} por ${p.nome}`, 'ok', 2200);
    } else if (r === 'lado') {
      const lugar = lugarLivrePerto(f);
      if (!lugar) { aviso('Não achei um lugar livre perto 😕', 'erro', 2200); return; }
      porPeca({ ...f, x: lugar[0], y: lugar[1], ok: true }); cancelarMira(); aviso('↔️ Coloquei do lado', 'ok', 1800);
    }
  }
  function lugarLivrePerto(f) {
    let melhor = null, d0 = Infinity;
    for (let raio = 1; raio <= 14 && !melhor; raio++) for (let dx = -raio; dx <= raio; dx++) for (let dy = -raio; dy <= raio; dy++) {
      if (Math.max(Math.abs(dx), Math.abs(dy)) !== raio) continue;
      if (cabe(f.t, f.x + dx, f.y + dy, f.r)) { const d = Math.hypot(dx, dy); if (d < d0) { d0 = d; melhor = [f.x + dx, f.y + dy]; } }
    }
    return melhor;
  }
  confEl.addEventListener('click', (e) => {
    const a = e.target.closest('[data-c]')?.dataset.c; if (!a) return;
    if (a === 'cancelar') cancelarMira();
    if (a === 'girar') { S.rot = (S.rot + 1) % 4; pedir(); mostrarConfirma(); }
    if (a === 'ok') tentarColocar();
  });
  function colocarObjeto(c) {
    const f = fantasma(); if (!f) return false;
    if (!f.ok) { const oc = ix.ocup.get(K(c.x, c.y)); if (oc) selecionar(oc); return false; }
    const o = novoObj(f.t, f.x, f.y, f.r, f.c); m.objs.push(o); ix = indexar(m); pedir();
    const p = OBJETOS[o.t]; if (p.cores && ['pessoa', 'familia', 'crianca', 'carro', 'casa', 'barraco'].includes(o.t)) { S.cor = (S.cor + 1) % p.cores; desenharOpcoes(); }
    return true;
  }

  // ------------------------------------------------ toque / mouse
  const ponteiros = new Map(); let gesto = null; let espaco = false;
  const pos = (e) => { const r = cv.getBoundingClientRect(); return [e.clientX - r.left, e.clientY - r.top]; };
  const cel = (x, y) => celulaEm(S.cam, W, H, x, y, S.planta);
  function objetoEm(x, y) {
    const c = cel(x, y), o = ix.ocup.get(K(c.x, c.y)); if (o) return o;
    if (S.planta) return null;
    for (let i = ultimosDesenhados.length - 1; i >= 0; i--) { const d = ultimosDesenhados[i]; if (x >= d.x0 && x <= d.x1 && y >= d.y0 && y <= d.y1 && !OBJETOS[d.o.t].chato) return d.o; }
    return null;
  }
  cv.addEventListener('pointerdown', (e) => {
    cv.setPointerCapture(e.pointerId); ponteiros.set(e.pointerId, pos(e));
    tipos.set(e.pointerId, e.pointerType);
    if (ponteiros.size === 2) {
      if (gesto && gesto.tipo === 'espera') clearTimeout(gesto.t); // era o começo de uma pinça: não coloca nada
      else if (gesto && gesto.tipo !== 'mapa') terminarMudanca();
      gesto = { tipo: 'mapa', dois: true, ultimo: centro(), dist: distDedos() }; S.arrastandoMapa = true; esconderSel(); return;
    }
    if (ponteiros.size > 2) return;
    const [x, y] = pos(e), c = cel(x, y); S.hover = c; toqueSemMouse = e.pointerType === 'touch'; tocandoAgora = e.pointerType === 'touch';
    if (S.regua.on && e.button === 0 && !espaco) {
      if (!ix.chao.has(K(c.x, c.y))) { gesto = { tipo: 'mapa', ultimo: [x, y], ini: [x, y] }; return; }
      if (!S.regua.a || S.regua.b) S.regua = { on: true, a: c, b: null }; else S.regua.b = c;
      atualizarRegua(); pedir(); gesto = { tipo: 'nada' }; return;
    }
    const pan = e.button === 1 || e.button === 2 || espaco || !edita;
    if (pan) { gesto = { tipo: 'mapa', ultimo: [x, y], ini: [x, y] }; return; }
    // no toque, espera um instante: se vier um segundo dedo é pinça (zoom), não é para colocar peça
    if (e.pointerType === 'touch') { gesto = { tipo: 'espera', x, y, c, t: setTimeout(() => { if (gesto && gesto.tipo === 'espera') rodarEspera(); }, 110) }; return; }
    acaoInicial(x, y, c);
  });
  let tocandoAgora = false;
  function rodarEspera() { const g = gesto; clearTimeout(g.t); gesto = null; acaoInicial(g.x, g.y, g.c); }
  function acaoInicial(x, y, c) {
    const p = pecaAtual();
    if (S.ferr === 'terreno') { gesto = { tipo: 'area', a: c, ini: [x, y] }; S.area = { x0: c.x, y0: c.y, x1: c.x, y1: c.y }; desenharTerreno(); pedir(); return; }
    if (S.ferr === 'tocar') { gesto = { tipo: 'mapa', ultimo: [x, y], ini: [x, y], tocar: true }; return; }
    if (S.ferr === 'mao') {
      const o = objetoEm(x, y);
      gesto = o ? { tipo: 'talvez-mover', o, ini: [x, y], c } : { tipo: 'mapa', ultimo: [x, y], ini: [x, y], tocar: true };
      return;
    }
    if (S.ferr === 'colocar' && (!p)) { gesto = { tipo: 'mapa', ultimo: [x, y], ini: [x, y], tocar: true, semPeca: true }; return; }
    // peça (casa, prédio…): primeiro aparece transparente; o toque não coloca nada sozinho
    if (S.ferr === 'colocar' && p.tipo === 'obj') { S.sel = null; esconderSel(); esconderConfirma(); S.mira = miraEm(x, y, tocandoAgora); gesto = { tipo: 'posicionar', toque: tocandoAgora }; pedir(); return; }
    comecarMudanca();
    if (S.ferr === 'apagar') { apagarEm(c); gesto = { tipo: 'apagar', ult: c.x + ',' + c.y }; return; }
    pintarChao(c, p.id); gesto = { tipo: 'pintar', ult: c.x + ',' + c.y, t: p.id };
  }
  const tipos = new Map();
  const distDedos = () => { const ps = [...ponteiros.values()]; return Math.hypot(ps[0][0] - ps[1][0], ps[0][1] - ps[1][1]) || 1; };
  const centro = () => { const ps = [...ponteiros.values()]; return [(ps[0][0] + ps[1][0]) / 2, (ps[0][1] + ps[1][1]) / 2]; };
  cv.addEventListener('pointermove', (e) => {
    const [x, y] = pos(e);
    if (ponteiros.has(e.pointerId)) ponteiros.set(e.pointerId, [x, y]);
    if (gesto && gesto.dois && ponteiros.size >= 2) { // pinça: aproxima/afasta e anda com dois dedos
      const c = centro(), d = distDedos(); if (gesto.dist) zoom(d / gesto.dist, c[0], c[1]); gesto.dist = d;
      arrastar(c[0] - gesto.ultimo[0], c[1] - gesto.ultimo[1]); gesto.ultimo = c; return;
    }
    if (gesto && gesto.tipo === 'espera') { if (Math.hypot(x - gesto.x, y - gesto.y) < 4) return; rodarEspera(); }
    const c = cel(x, y), mudouCel = !S.hover || S.hover.x !== c.x || S.hover.y !== c.y; S.hover = c;
    if (!gesto) { if (e.pointerType === 'mouse') toqueSemMouse = false; if (mudouCel) pedir(); cv.style.cursor = cursor(); return; }
    const k = c.x + ',' + c.y;
    switch (gesto.tipo) {
      case 'mapa': if (gesto.tocar && Math.hypot(x - gesto.ini[0], y - gesto.ini[1]) > 6) gesto.tocar = false; arrastar(x - gesto.ultimo[0], y - gesto.ultimo[1]); gesto.ultimo = [x, y]; S.arrastandoMapa = !gesto.tocar; break;
      case 'talvez-mover': if (Math.hypot(x - gesto.ini[0], y - gesto.ini[1]) > 6) { comecarMudanca(); S.mover = { o: gesto.o, dx: gesto.c.x - gesto.o.x, dy: gesto.c.y - gesto.o.y }; esconderSel(); gesto = { tipo: 'mover' }; pedir(); } break;
      case 'mover': if (mudouCel) pedir(); break;
      case 'posicionar': { const nm = miraEm(x, y, gesto.toque); if (!S.mira || nm.x !== S.mira.x || nm.y !== S.mira.y) { S.mira = nm; pedir(); } break; }
      case 'colocar': if (k !== gesto.ult) { gesto.ult = k; const p = pecaAtual(); if (p && OBJETOS[p.id].w === 1 && OBJETOS[p.id].d === 1 && colocarObjeto(c)) gesto.colocou = true; } gesto.pos = [x, y]; break;
      case 'pintar': if (k !== gesto.ult) { gesto.ult = k; pintarChao(c, gesto.t); } break;
      case 'apagar': if (k !== gesto.ult) { gesto.ult = k; apagarEm(c); } break;
      case 'area': { const a2 = gesto.a; S.area = { x0: Math.min(a2.x, c.x), y0: Math.min(a2.y, c.y), x1: Math.max(a2.x, c.x), y1: Math.max(a2.y, c.y) }; if (mudouCel) { desenharTerreno(); pedir(); } break; }
      default: if (mudouCel) pedir();
    }
  });
  const soltar = (e) => {
    ponteiros.delete(e.pointerId); tipos.delete(e.pointerId);
    if (gesto && gesto.tipo === 'espera') rodarEspera();
    if (gesto && gesto.dois) { if (!ponteiros.size) { gesto = null; S.arrastandoMapa = false; if (S.mira) mostrarConfirma(); } return; }
    if (!gesto) return; const g = gesto; gesto = null; S.arrastandoMapa = false;
    if (g.tipo === 'posicionar') { if (g.toque) mostrarConfirma(); else tentarColocar(); pedir(); return; } // toque: espera o ✓ · mouse: soltou, colocou
    if (g.tipo === 'talvez-mover') selecionar(g.o);
    else if (g.tipo === 'mapa' && g.tocar) {
      const [x, y] = pos(e); const o = objetoEm(x, y);
      if (g.semPeca && !o) { aviso('👇 Escolha uma peça primeiro', 'ok', 1800); ed.classList.remove('doca-mini'); medirDoca(); }
      if (o) selecionar(o); else { S.sel = null; esconderSel(); }
    }
    else if (g.tipo === 'mover' && S.mover) {
      const f = fantasma(); if (f && f.ok) { S.mover.o.x = f.x; S.mover.o.y = f.y; ix = indexar(m); }
      else aviso('Não cabe aí 🙈', 'erro', 1500);
      const o = S.mover.o; S.mover = null; terminarMudanca(); selecionar(o);
    } else terminarMudanca();
    pedir();
  };
  cv.addEventListener('pointerup', soltar); cv.addEventListener('pointercancel', soltar);
  cv.addEventListener('pointerleave', () => { if (!gesto) { S.hover = null; pedir(); } });
  function arrastar(dx, dy) { const d = deltaMundo(S.cam, -dx, -dy, S.planta); S.cam = { ...S.cam, x: S.cam.x + d[0], y: S.cam.y + d[1] }; anim = null; if (S.sel) posicionarSel(); pedir(); }
  function zoom(f, x = W / 2, y = H / 2) {
    const antes = cel(x, y); void antes; const z = Math.max(.12, Math.min(3.2, S.cam.z * f));
    // mantém o ponto embaixo do cursor no mesmo lugar
    const d1 = deltaMundo(S.cam, x - W / 2, y - H / 2, S.planta); const c2 = { ...S.cam, z }; const d2 = deltaMundo(c2, x - W / 2, y - H / 2, S.planta);
    S.cam = { ...c2, x: S.cam.x + d1[0] - d2[0], y: S.cam.y + d1[1] - d2[1] }; anim = null; pedir();
  }
  cv.addEventListener('wheel', (e) => {
    e.preventDefault(); const [x, y] = pos(e);
    if (e.ctrlKey) { zoom(Math.exp(-e.deltaY * .012), x, y); return; } // pinça do trackpad (Chrome, Firefox, Edge) const mouse = e.deltaMode === 1 || (e.deltaX === 0 && Math.abs(e.deltaY) >= 50 && Number.isInteger(e.deltaY));
    if (mouse) zoom(e.deltaY < 0 ? 1.15 : 1 / 1.15, x, y); else arrastar(-e.deltaX, -e.deltaY);
  }, { passive: false });
  // pinça do trackpad no Safari do Mac (e iPad com trackpad): eventos "gesture"
  let escalaG = 1; const temToque = () => [...tipos.values()].includes('touch');
  cv.addEventListener('gesturestart', (e) => { e.preventDefault(); escalaG = e.scale || 1; });
  cv.addEventListener('gesturechange', (e) => { e.preventDefault(); if (temToque()) return; const r = cv.getBoundingClientRect(); zoom((e.scale || 1) / escalaG, e.clientX - r.left, e.clientY - r.top); escalaG = e.scale || 1; });
  const cursor = () => (!edita || S.ferr === 'tocar' || S.ferr === 'mao' || (S.ferr === 'colocar' && !S.peca) ? 'grab' : 'crosshair');

  // teclado
  const tecla = (e) => {
    if (e.target.closest('input, textarea')) return; const k = e.key.toLowerCase();
    if (k === ' ') { espaco = true; cv.style.cursor = 'grab'; e.preventDefault(); return; }
    if ((e.metaKey || e.ctrlKey) && k === 'z') { e.preventDefault(); e.shiftKey ? voltar(refazer, desfazer) : voltar(desfazer, refazer); return; }
    if ((e.metaKey || e.ctrlKey) && k === 's') { e.preventDefault(); if (pendente && edita) gravar().then((ok) => ok && aviso('💾 Salvo!')); return; }
    if ((e.metaKey || e.ctrlKey) && k === 'y') { e.preventDefault(); voltar(refazer, desfazer); return; }
    if (e.metaKey || e.ctrlKey || e.altKey) return;
    if (k === 'r') { if (S.sel) girarSel(); else { S.rot = (S.rot + 1) % 4; pedir(); mostrarConfirmaSeAberta(); } }
    else if (k === 'enter' && !confEl.classList.contains('esconde')) tentarColocar();
    else if (k === 'q' || k === 'e') girarVista(k === 'e' ? 1 : 3);
    else if (k === 'n') alternarNoite();
    else if (k === 'm') ed.querySelector('[data-a=regua]').click(); else if (k === 'g') ed.querySelector('[data-a=grade]').click();
    else if (k === '+' || k === '=') zoom(1.2); else if (k === '-') zoom(1 / 1.2);
    else if ((k === 'delete' || k === 'backspace') && S.sel) apagarSel();
    else if (k === 'escape') { S.sel = null; esconderSel(); fecharVer(); S.mira = null; esconderConfirma(); if (edita) escolherFerr('tocar'); pedir(); }
    else if (k.startsWith('arrow')) { const v = { arrowup: [0, 60], arrowdown: [0, -60], arrowleft: [60, 0], arrowright: [-60, 0] }[k]; arrastar(...v); e.preventDefault(); }
    else if (/^[1-5]$/.test(k) && edita) escolherFerr(FERRAMENTAS[+k - 1][0]);
  };
  const solta = (e) => { if (e.key === ' ') { espaco = false; cv.style.cursor = cursor(); } };
  document.addEventListener('keydown', tecla); document.addEventListener('keyup', solta);

  // ------------------------------------------------ peça selecionada (janelinha em cima dela)
  const selBox = $('.ed-sel');
  function selecionar(o) {
    S.sel = o; const p = OBJETOS[o.t];
    const bt = (s2, e, n, t) => `<button data-s="${s2}" title="${t}"><span>${e}</span><small>${n}</small></button>`;
    selBox.innerHTML = `<b class="ed-sel-n"><img src="${miniatura(o.t, o.c || 0, 44)}" alt="">${p.nome}</b><div class="ed-sel-bts">${edita ? bt('girar', '🔄', 'Girar', 'Girar (R)') + (p.cores ? bt('cor', '🎨', 'Cor', 'Trocar a cor') : '') + bt('mover', '✋', 'Mover', 'Arrastar para outro lugar') + bt('copiar', '✏️', 'Usar', 'Colocar mais desta peça') + bt('apagar', '🗑️', 'Apagar', 'Apagar (Delete)') : ''}${bt('fechar', '✕', 'Fechar', 'Fechar')}</div>`;
    selBox.classList.remove('esconde'); ed.classList.add('com-sel'); posicionarSel(); pedir();
  }
  function posicionarSel() {
    if (!S.sel) return; const b = caixaGirada(S.cam.rot, S.sel); const G = lapis(ctx, S.cam, W, H, { planta: S.planta });
    const p = S.planta ? G.P(b.X + b.W / 2, b.Y) : G.P(b.X + b.W / 2, b.Y + b.D / 2, OBJETOS[S.sel.t].chato ? 10 : OBJETOS[S.sel.t].fino ? 50 : 70);
    selBox.style.left = Math.max(170, Math.min(W - 170, p[0])) + 'px'; selBox.style.top = Math.max(150, p[1] - 12) + 'px'; // nunca por cima da barra de cima
  }
  function esconderSel() { selBox.classList.add('esconde'); ed.classList.remove('com-sel'); }
  function girarSel() { const o = S.sel; if (!o || !edita) return; comecarMudanca(); const r = ((o.r || 0) + 1) % 4; if (cabe(o.t, o.x, o.y, r, o)) { o.r = r; ix = indexar(m); } else aviso('Não dá para girar aqui: falta espaço', 'erro', 1600); terminarMudanca(); pedir(); }
  function apagarSel() { if (!S.sel || !edita) return; comecarMudanca(); m.objs = m.objs.filter((o) => o !== S.sel); S.sel = null; esconderSel(); ix = indexar(m); terminarMudanca(); pedir(); }
  selBox.addEventListener('click', (e) => {
    const a = e.target.closest('[data-s]')?.dataset.s; const o = S.sel; if (!a || !o) return;
    if (a === 'girar') girarSel();
    if (a === 'cor') { comecarMudanca(); o.c = ((o.c || 0) + 1) % OBJETOS[o.t].cores; terminarMudanca(); selecionar(o); }
    if (a === 'mover') { escolherFerr('mao'); selecionar(o); aviso('✋ Agora arraste a peça para outro lugar', 'ok', 2200); }
    if (a === 'copiar') { escolherFerr('colocar'); S.peca = o.t; S.cor = o.c || 0; S.rot = o.r || 0; S.cat = OBJETOS[o.t].cats[0]; desenharCats(); desenharPecas(); S.sel = null; esconderSel(); }
    if (a === 'apagar') apagarSel();
    if (a === 'fechar') { S.sel = null; esconderSel(); pedir(); }
  });

  // ------------------------------------------------ ferramentas e vista
  const dica = $('.ed-dica');
  let ferrIniciada = false, avisoFerr = null;
  function escolherFerr(f) {
    const mudou = S.ferr !== f; S.ferr = f; ed.querySelectorAll('.ed-f[data-f]').forEach((b) => { b.classList.toggle('on', b.dataset.f === f); b.setAttribute('aria-pressed', b.dataset.f === f); });
    FERRAMENTAS.forEach(([id]) => ed.classList.toggle('ferr-' + id, id === f));
    if (f !== 'colocar') { S.mira = null; esconderConfirma(); }
    if (f !== 'colocar' && S.peca) { S.peca = null; desenharPecas(); } // fora do Colocar nenhuma peça fica escolhida: tocar no mapa não coloca nada
    if (f === 'colocar' && !S.peca) ed.classList.remove('doca-mini');
    const d = FERRAMENTAS.find((x) => x[0] === f); dica.innerHTML = `<b>${d[1]} ${d[2]}</b> · ${d[3]}`; cv.style.cursor = cursor();
    if (celular() && mudou && ferrIniciada && f !== 'terreno') { avisoFerr?.remove(); avisoFerr = aviso(d[4], 'ok', 1700); } // só uma dica por vez
    ferrIniciada = true; if (celular()) requestAnimationFrame(medirDoca);
    const antes = ed.classList.contains('modo-terreno');
    ed.classList.toggle('modo-terreno', f === 'terreno'); if (f !== 'terreno') S.area = null; desenharTerreno(); pedir();
    // entrou ou saiu do Terreno: a doca e o painel mudam de tamanho, então o mapa se ajusta de novo
    if (antes !== (f === 'terreno') && S.cam) requestAnimationFrame(() => { medirDoca(); enquadrarTudo(); });
  }
  const medirDoca = () => {
    const h = $('.ed-doca').offsetHeight || 0, t = celular() ? ($('.ed-ferr').offsetHeight || 0) : 0; ed.style.setProperty('--doca', h + 'px'); ed.style.setProperty('--abas', t + 'px');
    document.body.style.setProperty('--doca-g', (h + t + (celular() ? 20 : 30)) + 'px');
  };
  // menu 👁️ Ver: grade, régua, plano cartesiano e noite, cada um com uma chave liga/desliga
  const verEl = $('.ed-ver');
  function atualizarVer() {
    const on = { grade: S.grade, regua: S.regua.on, eixos: S.eixos, noite: S.noite }; let n = 0;
    verEl.querySelectorAll('.ed-ver-i').forEach((b) => { const v = !!on[b.dataset.a]; b.classList.toggle('on', v); b.setAttribute('aria-checked', v); if (v) n++; });
    const nb = $('.ed-ver-n'); nb.textContent = n; nb.classList.toggle('esconde', !n); $('.ed-bt-ver').classList.toggle('on', !verEl.classList.contains('esconde'));
  }
  function fecharVer() { verEl.classList.add('esconde'); $('.ed-bt-ver').setAttribute('aria-expanded', 'false'); atualizarVer(); }
  document.addEventListener('pointerdown', (e) => { if (!verEl.classList.contains('esconde') && !e.target.closest('.ed-ver, .ed-bt-ver')) fecharVer(); }, true);
  function girarVista(passo = 1) { const rot = ((S.cam.rot || 0) + passo) % 4; S.cam = { ...S.cam, rot }; if (S.sel) posicionarSel(); pedir(); }
  function alternarNoite() { S.noite = !S.noite; ed.classList.toggle('noite', S.noite); atualizarVer(); pedir(); }
  function trocarVista(planta) {
    if (S.planta === planta) return; const z = S.cam.z * (planta ? TW / TP / 1.6 : TP * 1.6 / TW); S.planta = planta; S.cam = { ...S.cam, z };
    ed.querySelectorAll('.ed-modos [data-modo]').forEach((b) => b.classList.toggle('on', b.dataset.modo === (planta ? 'planta' : '3d'))); ed.classList.toggle('planta', planta); enquadrarTudo(false);
  }
  ed.addEventListener('click', async (e) => {
    const f = e.target.closest('.ed-f[data-f]'); if (f) { escolherFerr(f.dataset.f); return; }
    const st = e.target.closest('[data-seta]'); if (st) { mudarTerreno(st.dataset.seta, st.dataset.op === 'mais'); return; }
    const tr = e.target.closest('[data-terreno]'); if (tr) { const a2 = tr.dataset.terreno; if (a2 === 'todo') { S.area = null; desenharTerreno(); pedir(); } if (a2 === 'volta') crescer(); if (a2 === 'pronto') escolherFerr('tocar'); return; }
    const md = e.target.closest('.ed-modos [data-modo]');
    if (md) {
      const v = md.dataset.modo; if (v === '3d' || v === 'planta') return trocarVista(v === 'planta');
      if (v === 'comparar') location.hash = '#/comparar/' + m.id; else location.hash = '#/m/' + m.id + '/' + v; return;
    }
    const a = e.target.closest('[data-a]')?.dataset.a; if (!a) return;
    if (a === 'desfazer') voltar(desfazer, refazer); if (a === 'refazer') voltar(refazer, desfazer);
    if (a === 'girar') girarVista(1); if (a === 'mais') zoom(1.25); if (a === 'menos') zoom(1 / 1.25); if (a === 'tudo') enquadrarTudo(); if (a === 'noite') alternarNoite();
    if (a === 'crescer') crescer();
    if (a === 'salvar') { if (!pendente) aviso('✓ Já está tudo salvo'); else if (await gravar()) aviso('💾 Salvo!'); }
    if (a === 'compartilhar') { if (pendente && !(await gravar())) return; /* compartilha a versão salva */ const { compartilhar } = await import('../compartilhar.js'); compartilhar(m, () => { if (S.aba === 'sobre') desenharAba(); }); }
    if (a === 'ver') { const abrir = verEl.classList.contains('esconde'); verEl.classList.toggle('esconde', !abrir); $('.ed-bt-ver').setAttribute('aria-expanded', abrir); atualizarVer(); }
    if (a === 'ajuda') { fecharVer(); tutorial('editor', TUTORIAL_EDITOR, { forcar: true }); }
    if (a === 'grade') { S.grade = !S.grade; guardarPref(); atualizarVer(); pedir(); }
    if (a === 'encolher') { ed.classList.toggle('doca-mini'); requestAnimationFrame(medirDoca); }
    if (a === 'regua') { S.regua = S.regua.on ? { on: false, a: null, b: null } : { on: true, a: null, b: null }; S.sel = null; esconderSel(); atualizarRegua(); atualizarVer(); pedir(); if (celular()) fecharVer(); }
    if (a === 'eixos') { S.eixos = !S.eixos; atualizarVer(); ed.classList.toggle('com-eixos', S.eixos); if (S.eixos) aviso('📊 Plano cartesiano: cada quadradinho é um ponto (x, y). O eixo y cresce para cima.', 'ok', 3500); pedir(); }
    if (a === 'painel' && S.ferr === 'terreno' && innerWidth <= 1180) { escolherFerr('tocar'); S.painel = true; ed.classList.add('com-painel'); desenharAba(); return; }
    if (a === 'painel') { S.painel = !S.painel; ed.classList.toggle('com-painel', S.painel); guardarPref(); if (S.painel) desenharAba(); }
    if (a === 'entrar') { sairVisitante(); location.hash = estado.nuvem ? '#/entrar' : '#/porta'; return; }
    if (a === 'duplicar') { const c = await duplicar(m, m.nome + ' (minha cópia)'); aviso('Cópia criada! Agora é sua 😊'); location.hash = '#/m/' + c.id; }
  });
  $('.ed-nome').onclick = () => { S.painel = true; ed.classList.add('com-painel'); S.aba = 'sobre'; desenharAba(); setTimeout(() => ed.querySelector('[name=nome]')?.focus(), 50); };
  const guardarPref = () => { try { localStorage.setItem('bi:editor', JSON.stringify({ cat: S.cat, painel: S.painel, aba: S.aba, grade: S.grade })); } catch { /* */ } };

  // ------------------------------------------------ doca de peças
  const cats = $('.ed-cats'), pecasEl = $('.ed-pecas'), opc = $('.ed-opc'), busca = $('.ed-busca input');
  function desenharCats() { cats.querySelectorAll('[data-cat]').forEach((b) => b.classList.toggle('on', !S.busca && b.dataset.cat === S.cat)); }
  function listaPecas() {
    if (S.busca) { const q = sem(S.busca); return TODAS.filter((p) => sem(p.nome + ' ' + (SINONIMOS[p.id] || '') + ' ' + p.id).includes(q)); }
    const l = TODAS.filter((p) => p.cats.includes(S.cat)); return S.cat === 'chao' ? l : [...l.filter((p) => p.tipo === 'obj'), ...l.filter((p) => p.tipo === 'chao')];
  }
  function desenharPecas() {
    const l = listaPecas();
    pecasEl.innerHTML = l.length ? l.map((p) => `<button class="pc ${S.peca === p.id ? 'on' : ''}" data-id="${p.id}" role="option" aria-selected="${S.peca === p.id}" title="${p.nome}"><img src="${miniatura(p.id, S.peca === p.id ? S.cor : 0)}" alt=""><i>${p.nome}</i>${p.tipo === 'obj' && (p.w > 1 || p.d > 1) ? `<em>${p.w}×${p.d}</em>` : ''}</button>`).join('') : '<p class="ed-nada">Nenhuma peça com esse nome 🤔</p>';
    desenharOpcoes();
  }
  function desenharOpcoes() {
    const p = pecaAtual(); ed.classList.toggle('tem-peca', !!(p && edita)); if (!p || !edita) { opc.innerHTML = ''; return; }
    const cores = p.tipo === 'obj' && p.cores ? p.cores : 0;
    opc.innerHTML = `<button class="ed-opc-n" data-a="encolher" title="Trocar de peça"><img src="${miniatura(p.id, S.cor, 44)}" alt=""><b>${p.nome}</b><small>trocar ▴</small></button>
      ${cores ? `<span class="ed-cores">${Array.from({ length: cores }, (_, i) => `<button data-cor="${i}" class="${i === S.cor ? 'on' : ''}" title="Cor ${i + 1}"><img src="${miniatura(p.id, i, 44)}" alt=""></button>`).join('')}</span>` : ''}
      ${p.tipo === 'obj' ? `<button class="bt bt--leve" data-girar>🔄 Girar <small>(R)</small></button>` : `<span class="ed-opc-d">Toque num quadradinho para pintar · arraste para pintar vários</span>`}`;
  }
  cats.addEventListener('click', (e) => { const b = e.target.closest('[data-cat]'); if (!b) return; S.cat = b.dataset.cat; S.busca = ''; busca.value = ''; desenharCats(); desenharPecas(); pecasEl.scrollLeft = 0; guardarPref(); });
  busca.addEventListener('input', () => { S.busca = busca.value.trim(); desenharCats(); desenharPecas(); });
  pecasEl.addEventListener('click', (e) => {
    const b = e.target.closest('.pc'); if (!b) return;
    if (S.peca === b.dataset.id && S.ferr === 'colocar') { S.peca = null; } else { S.peca = b.dataset.id; S.cor = 0; }
    S.mira = null; esconderConfirma();
    if (S.ferr !== 'colocar') escolherFerr('colocar');
    if (S.peca) { avisoFerr?.remove(); avisoFerr = null; } // já escolheu: a dica "escolha uma peça" some
    S.sel = null; esconderSel(); desenharPecas(); pedir();
    if (celular() && S.peca) { ed.classList.add('doca-mini'); requestAnimationFrame(medirDoca); } // no celular a gaveta encolhe para mostrar o mapa
  });
  opc.addEventListener('click', (e) => {
    const c = e.target.closest('[data-cor]'); if (c) { S.cor = +c.dataset.cor; desenharOpcoes(); const card = pecasEl.querySelector(`.pc[data-id="${S.peca}"] img`); if (card) card.src = miniatura(S.peca, S.cor); pedir(); }
    if (e.target.closest('[data-girar]')) { S.rot = (S.rot + 1) % 4; pedir(); }
  });

  // ------------------------------------------------ painel (termômetro, metas, sobre, capítulos)
  const abaC = $('.ed-aba-c');
  ed.querySelector('.ed-abas').addEventListener('click', (e) => { const b = e.target.closest('[data-aba]'); if (b) { S.aba = b.dataset.aba; desenharAba(); guardarPref(); } });
  const estrelas5 = (n) => { const e = n == null ? 0 : Math.round(n / 2); return '★★★★★'.slice(0, e) + '<span>' + '★★★★★'.slice(e) + '</span>'; };
  function desenharAba() {
    ed.querySelectorAll('[data-aba]').forEach((b) => b.classList.toggle('on', b.dataset.aba === S.aba));
    const a = analise, c = a.contagem;
    if (S.aba === 'termo') {
      abaC.innerHTML = `<div class="nota-cx"><div><small>Nota do bairro</small><b style="color:${corNota(a.nota)}">${notaTxt(a.nota)}</b></div><div class="estrelas">${estrelas5(a.nota)}</div></div>
        ${a.nota == null ? '<p class="ed-p">Coloque casas para o bairro ganhar nota 🏠</p>' : ''}
        <div class="termo">${INDICADORES.map((i) => { const v = a.v[i.id]; return `<button class="termo-l" data-ind="${i.id}" title="${esc(i.explica)}"><span>${i.emoji} ${i.nome}</span><b>${v == null ? '–' : v + '%'}</b><div class="barra"><i style="width:${v ?? 0}%;background:${i.cor}"></i></div></button>`; }).join('')}</div>
        <div class="nums">${[['🏠', c.casas, 'casas'], ['🏢', c.predios, 'prédios'], ['🏚️', c.barracos, 'barracos'], ['🌳', c.arvores, 'árvores'], ['👨‍👩‍👧', c.moradores, 'moradores*'], ['🟩', c.area, 'quadradinhos']].map(([e, n, t]) => `<div><b>${num(n)}</b>${e} ${t}</div>`).join('')}</div>
        <p class="ed-p" style="font-size:12px">* estimativa: cerca de 3 pessoas por família. Cada quadradinho ≈ 10 m × 10 m (área total ≈ ${num(c.area * 100)} m²).</p>
        ${a.problemas.length ? `<h4 class="ed-h">⚠️ Problemas encontrados</h4><ul class="probs">${a.problemas.map((p) => `<li>${esc(p)}</li>`).join('')}</ul>` : ''}
        ${dicas(a).length ? `<h4 class="ed-h">💡 Para melhorar</h4><ul class="dicas">${dicas(a).map((d) => `<li>${esc(d)}</li>`).join('')}</ul>` : ''}`;
    } else if (S.aba === 'metas') {
      const feitas = a.metas.filter((x) => x.ok).length;
      abaC.innerHTML = `<div class="nota-cx"><div><small>Metas cumpridas</small><b style="color:var(--verde)">${feitas}<span style="font-size:22px;color:var(--apagado)"> de ${a.metas.length}</span></b></div><div class="trofeu">${feitas === a.metas.length ? '🏆' : '🎯'}</div></div>
        <div class="barra gde"><i style="width:${feitas / a.metas.length * 100}%;background:linear-gradient(90deg,#52b788,#ffc93c)"></i></div>
        <ul class="metas">${a.metas.map((x) => `<li class="${x.ok ? 'ok' : ''}"><i>${x.ok ? '✓' : ''}</i>${esc(x.texto)}${x.prog != null && !x.ok ? ` <small>(${Math.round(x.prog * 10)}/10)</small>` : ''}</li>`).join('')}</ul>
        <p class="ed-p">As metas mostram o que um <b>bairro ideal</b> precisa ter. No bairro carente, elas ajudam a explicar o que está faltando.</p>`;
    } else if (S.aba === 'sobre') {
      abaC.innerHTML = `<button class="bt bt--verde ed-compart" data-a="compartilhar">📤 Compartilhar esta maquete</button>
        <label class="campo">Nome do bairro<input name="nome" maxlength="60" value="${esc(m.nome)}" ${edita ? '' : 'disabled'}></label>
        <div class="campo">Tipo de bairro<div class="tipos">${Object.entries(TIPOS).map(([k, [e, n]]) => `<button data-tipo="${k}" class="${m.tipo === k ? 'on' : ''}" ${edita ? '' : 'disabled'}>${e} ${n}</button>`).join('')}</div></div>
        <label class="campo">Cidade (opcional)<input name="cidade" maxlength="60" value="${esc(m.cidade || '')}" placeholder="Ex.: Uberlândia - MG" ${edita ? '' : 'disabled'}></label>
        <label class="campo">A história do bairro<textarea name="historia" maxlength="6000" rows="9" placeholder="Como o bairro nasceu? Quem mora aqui? O que tem de bom e o que precisa melhorar?" ${edita ? '' : 'disabled'}>${esc(m.historia || '')}</textarea></label>
        <label class="ed-pub"><input type="checkbox" name="publica" ${m.publica !== false ? 'checked' : ''} ${edita ? '' : 'disabled'}><span><b>🏛️ Mostrar na exposição</b><small>Visitantes (sem conta) podem ver esta maquete.</small></span></label>
        <p class="ed-p">📏 Terreno com <b>${num(c.area)}</b> quadradinhos e <b>${num(c.pecas)}</b> peças. Para aumentar ou diminuir, use a ferramenta <b>📐 Terreno</b> (setas).</p>`;
      abaC.oninput = (e) => {
        const n = e.target.name; if (n === 'publica') { m.publica = e.target.checked; mudouTexto(); aviso(m.publica ? '🏛️ Agora aparece na exposição' : '🔒 Saiu da exposição'); return; }
        if (!['nome', 'cidade', 'historia'].includes(n)) return; m[n] = e.target.value;
        if (n === 'nome') ed.querySelector('.ed-nome b').textContent = m.nome || 'Sem nome'; mudouTexto();
      };
      abaC.querySelectorAll('[data-tipo]').forEach((b) => { b.onclick = () => { m.tipo = b.dataset.tipo; ed.querySelector('.ed-nome').innerHTML = `<b>${esc(m.nome)}</b>${chipTipo(m.tipo)}`; desenharAba(); mudouTexto(); }; });
      return;
    } else if (S.aba === 'caps') {
      abaC.innerHTML = `<p class="ed-p">Os capítulos viram o <b>modo história</b>: a câmera passeia pelo bairro e o texto aparece em cada parada.</p>
        <div class="caps">${m.capitulos.map((cp, i) => `<div class="cap" data-i="${i}"><div class="cap-n">${i + 1}</div><div class="cap-c">
          <input data-c="titulo" value="${esc(cp.titulo)}" placeholder="Título" maxlength="80" ${edita ? '' : 'disabled'}><textarea data-c="texto" rows="3" maxlength="1500" placeholder="O que acontece aqui?" ${edita ? '' : 'disabled'}>${esc(cp.texto)}</textarea>
          <div class="cap-b">${edita ? `<button data-cap="vista" title="Guardar a vista que está na tela agora">📷 ${cp.cam ? 'Trocar vista' : 'Usar a vista atual'}</button><button data-cap="ver" title="Ir para a vista deste capítulo" ${cp.cam ? '' : 'disabled'}>👁️</button><button data-cap="sobe" ${i ? '' : 'disabled'}>▲</button><button data-cap="desce" ${i < m.capitulos.length - 1 ? '' : 'disabled'}>▼</button><button data-cap="tira">🗑️</button>` : `<button data-cap="ver" ${cp.cam ? '' : 'disabled'}>👁️ Ver</button>`}</div></div></div>`).join('') || '<div class="vazio-lista">Ainda não tem capítulos.</div>'}</div>
        ${edita ? `<div class="caps-b"><button class="bt bt--verde" data-cap="novo">＋ Novo capítulo com a vista atual</button><button class="bt" data-cap="auto">✨ Criar história automática</button></div>` : ''}
        <a class="bt bt--sol bt--gde" style="width:100%;margin-top:10px" href="#/m/${m.id}/historia">▶ Apresentar a história</a>`;
      abaC.oninput = (e) => { const c = e.target.closest('[data-i]'), k = e.target.dataset.c; if (!c || !k) return; m.capitulos[+c.dataset.i][k] = e.target.value; mudouTexto(); };
      abaC.onclick = async (e) => {
        const b = e.target.closest('[data-cap]'); if (!b) return; const a = b.dataset.cap, i = +(b.closest('[data-i]')?.dataset.i ?? -1);
        const vistaAtual = () => ({ ...S.cam, noite: S.noite, planta: S.planta });
        if (a === 'novo') { m.capitulos.push({ titulo: 'Capítulo ' + (m.capitulos.length + 1), texto: '', cam: vistaAtual() }); }
        if (a === 'auto') { if (m.capitulos.length && !(await confirmar('Criar história automática?', 'Os capítulos de agora serão trocados por uma história criada a partir do que existe na maquete.', 'Criar', 'bt--sol'))) return; m.capitulos = historiaAutomatica(m, analise); aviso('História criada! ✨ Você pode editar os textos.'); }
        if (a === 'vista') { m.capitulos[i].cam = vistaAtual(); aviso('Vista guardada 📷'); }
        if (a === 'ver') { const cam = m.capitulos[i].cam; if (cam) { if (!!cam.planta !== S.planta) trocarVista(!!cam.planta); if (!!cam.noite !== S.noite) alternarNoite(); animar({ x: cam.x, y: cam.y, z: cam.z, rot: cam.rot }, 600); } return; }
        if (a === 'sobe') [m.capitulos[i - 1], m.capitulos[i]] = [m.capitulos[i], m.capitulos[i - 1]];
        if (a === 'desce') [m.capitulos[i + 1], m.capitulos[i]] = [m.capitulos[i], m.capitulos[i + 1]];
        if (a === 'tira') m.capitulos.splice(i, 1);
        mudouTexto(); desenharAba();
      };
      return;
    }
    if (S.aba === 'mat') { abaC.innerHTML = abaMatematica(); abaC.oninput = null; abaC.onclick = (e) => { if (e.target.closest('[data-mat=regua]') && !S.regua.on) ed.querySelector('[data-a=regua]').click(); if (e.target.closest('[data-mat=eixos]') && !S.eixos) ed.querySelector('[data-a=eixos]').click(); }; return; }
    abaC.oninput = null; abaC.onclick = (e) => { const b = e.target.closest('[data-ind]'); if (b) { const i = INDICADORES.find((x) => x.id === b.dataset.ind); aviso(`${i.emoji} <b>${i.nome}</b>: ${esc(i.explica)}`, 'ok', 5000); } };
  }
  function abaMatematica() {
    return `<p class="ed-p">✏️ Cada quadradinho mede <b>10 m × 10 m</b>. Todas as contas usam os números <b>desta maquete</b> e mudam sozinhas quando ela muda.</p>
      ${htmlMatematica(calcular(m, analise), analise)}
      <div class="caps-b"><button class="bt" data-mat="regua">📏 Medir com a régua</button><button class="bt" data-mat="eixos">📊 Mostrar o plano cartesiano</button></div>`;
  }
  let textoTimer, textoPendente = false; function mudouTexto() { textoPendente = true; clearTimeout(textoTimer); textoTimer = setTimeout(() => { textoPendente = false; mudou(); }, 300); }

  // ------------------------------------------------ termômetro ao vivo + balõezinhos
  let ultimoToque = null, analiseTimer;
  function feedbackLocal(x, y) { const r = cv.getBoundingClientRect(); ultimoToque = [r.left + x, r.top + y]; }
  function reanalisar() {
    clearTimeout(analiseTimer);
    analiseTimer = setTimeout(() => {
      const velha = analise; analise = analisar(m);
      if (ultimoToque) {
        let dy = 0;
        for (const i of INDICADORES) { const a = velha.v[i.id], b = analise.v[i.id]; if (a == null || b == null) continue; const d = b - a; if (Math.abs(d) >= 2) { balao(ultimoToque[0], ultimoToque[1] - dy, `${d > 0 ? '+' : ''}${d} ${i.emoji} ${i.nome}`, d > 0 ? '#1f6f50' : '#e5484d'); dy += 34; if (dy > 100) break; } }
        ultimoToque = null;
      }
      for (const mt of analise.metas) { const v = velha.metas.find((x) => x.id === mt.id); if (mt.ok && v && !v.ok) { aviso('🎉 Meta cumprida: ' + esc(mt.texto), 'meta', 3500); confete(); } }
      if (S.painel) desenharAba(); notaTopo();
    }, 150);
  }
  function notaTopo() { const b = ed.querySelector('.ed-bt-painel'); b.innerHTML = analise.nota == null ? '📊' : `<span style="color:${corNota(analise.nota)};font-family:var(--titulo);font-size:16px">${notaTxt(analise.nota)}</span>`; b.title = 'Nota do bairro e informações'; }

  // ajudantes para os testes automáticos (posição de um quadradinho na tela)
  window.__celTela = (x, y) => { const G = lapis(ctx, S.cam, W, H, { planta: S.planta }); const [X, Y] = [x, y]; const r = cv.getBoundingClientRect(); const pt = S.planta ? G.P(X + .5, Y + .5) : G.P(X + .5, Y + .5); return S.cam.rot ? null : [r.left + pt[0], r.top + pt[1]]; };
  window.__objEm = (x, y) => ix.ocup.get(K(x, y))?.t || null;
  window.__chao = (x, y) => m.chao[x + ',' + y] || null;
  window.__zoom = () => S.cam.z; window.__pecas = () => m.objs.length;

  // ------------------------------------------------ modo Terreno: painel com medidas e setas em volta da parte escolhida
  const terrEl = $('.ed-terreno'), setasEl = $('.ed-setas');
  function desenharTerreno() {
    const on = S.ferr === 'terreno' && edita; setasEl.classList.toggle('esconde', !on); if (!on) return;
    const n = ix.chao.size, L = ix.lim.x1 - ix.lim.x0, A = ix.lim.y1 - ix.lim.y0, ar = S.area;
    terrEl.innerHTML = `<div class="ter-medidas"><b>📐 Terreno</b><span>${n} quadradinhos × 100 m² = <b>${num(n * 100)} m²</b></span><span>cabe num retângulo de ${L} × ${A} (${num(L * 10)} m × ${num(A * 10)} m)</span>
      ${ar ? `<span class="ter-parte">🟦 Parte escolhida: ${ar.x1 - ar.x0 + 1} × ${ar.y1 - ar.y0 + 1} quadradinhos</span>` : ''}</div>
      <p class="ter-dica"><span class="ter-longa">Toque nas <b>setas ➜ ＋</b> em volta do terreno para aumentar daquele lado, e no <b>－</b> para diminuir.<br>Para fazer um <b>L</b>: arraste no mapa para escolher só uma parte (fica azul) e use a seta.</span><span class="ter-curta"><b>➜ ＋</b> aumenta · <b>－</b> diminui · arraste no mapa para escolher uma parte e fazer um <b>L</b></span></p>
      <div class="ter-bts"><button class="bt" data-terreno="todo" ${ar ? '' : 'disabled'}>🟩 Terreno todo</button><button class="bt" data-terreno="volta">⤢ Crescer em volta</button><button class="bt bt--verde" data-terreno="pronto">✅ Pronto</button></div>`;
    posicionarSetas();
  }
  function posicionarSetas() {
    if (setasEl.classList.contains('esconde')) return;
    const ar = areaAtual(), G = lapis(ctx, S.cam, W, H, { planta: S.planta }), rot = S.cam.rot || 0;
    const tela = (x, y) => { const [X, Y] = girar(rot, x, y); return G.P(X, Y); };
    const mx = (ar.x0 + ar.x1 + 1) / 2, my = (ar.y0 + ar.y1 + 1) / 2, c = tela(mx, my);
    const pontos = { N: [mx, ar.y0], S: [mx, ar.y1 + 1], O: [ar.x0, my], L: [ar.x1 + 1, my] };
    for (const [lado, [px, py]] of Object.entries(pontos)) {
      const [dx, dy] = LADOS[lado], borda = tela(px, py), fora = tela(px + dx * 1.2, py + dy * 1.2);
      let ang = Math.atan2(fora[1] - borda[1], fora[0] - borda[0]); const dist = Math.hypot(fora[0] - borda[0], fora[1] - borda[1]);
      const k = Math.max(46, Math.min(80, dist)) / (dist || 1);
      const x = Math.max(40, Math.min(W - 40, borda[0] + (fora[0] - borda[0]) * k)), y = Math.max(90, Math.min(H - 40, borda[1] + (fora[1] - borda[1]) * k));
      const el = setasEl.querySelector(`[data-lado="${lado}"]`); el.style.left = x + 'px'; el.style.top = y + 'px';
      el.querySelector('i').style.transform = `rotate(${ang}rad)`; void c;
    }
  }

  // ------------------------------------------------ começo
  escolherFerr(S.ferr); atualizarVer();
  // rascunho guardado neste aparelho: pergunta se quer continuar de onde parou
  async function perguntarRascunho() {
    if (!edita) return; let r = null; try { r = JSON.parse(localStorage.getItem(CHAVE_RASCUNHO(m.id)) || 'null'); } catch { /* */ }
    if (!r || !r.m) return;
    const maisNova = r.base && m.atualizado && m.atualizado > r.base;
    const v = await janela({ titulo: '📝 Você tem um rascunho', classe: 'janela-sair', fechar: false,
      corpo: `<p class="sair-p">Encontrei mudanças em <b>${esc(m.nome)}</b> que não foram salvas (rascunho de <b>${quando(r.quando)}</b>).</p>${maisNova ? '<p class="sair-p" style="color:var(--perigo)">⚠️ Depois desse rascunho a maquete foi salva de novo (talvez em outro aparelho).</p>' : ''}`,
      botoes: [{ texto: 'Abrir a versão salva', classe: 'bt--leve', valor: 'salva' }, { texto: '📝 Continuar o rascunho', classe: 'bt--sol', valor: 'rascunho' }] });
    if (v !== 'rascunho') { apagarRascunho(); return; }
    const { id: _i, atualizado: _a, conta: _c, dono: _d, pendente: _p, ...dados } = r.m; void _i; void _a; void _c; void _d; void _p;
    Object.assign(m, dados); ix = indexar(m); S.sel = null; esconderSel();
    ed.querySelector('.ed-nome b').textContent = m.nome; desfazer = []; refazer = []; botoesHist();
    mudou(); desenharAba(); notaTopo(); enquadrarTudo(); aviso('📝 Rascunho aberto. Não esqueça de 💾 Salvar!', 'ok', 3000);
  }
  // 1ª vez no editor: tutorial (depois da pergunta do rascunho, se houver)
  setTimeout(async () => { await perguntarRascunho(); if (edita && ed.isConnected) tutorial('editor', TUTORIAL_EDITOR); }, 450);
  desenharCats(); desenharPecas(); botoesHist(); desenharAba(); notaTopo();
  medir();

  return {
    temMudancas: () => edita && (pendente || salvando || textoPendente),
    perguntarSaida,
    guardarRascunho: () => { juntarTexto(); guardarRascunho(); }, // atualização do app: guarda sem perguntar
    sair: () => { juntarTexto(); if (pendente) guardarRascunho(); desligarDados(); document.body.classList.remove('no-editor'); document.removeEventListener('keydown', tecla); document.removeEventListener('keyup', solta); },
  };
}
