// Bairro Ideal · editor da maquete: mapa 3D/planta, barra de peças (embaixo), ferramentas (esquerda),
// painel com termômetro, metas, sobre o bairro e capítulos da história (direita).
import { el, esc, janela, aviso, balao, confete, confirmar, num } from '../ui.js';
import { abrir, salvar, aoMudar, estado, podeEditar, ehMinha, duplicar } from '../dados.js';
import { indexar, desenhar, celulaEm, deltaMundo, enquadrar, miniatura, caixaGirada, lapis, K, tamanho, TW, TH, TP } from '../motor.js';
import { CATEGORIAS, TODAS, OBJETOS, CHAOS, SINONIMOS, peca } from '../pecas.js';
import { analisar, dicas, INDICADORES } from '../termometro.js';
import { chipTipo, TIPOS, notaTxt, corNota, prepararParaSalvar } from './comum.js';
import { historiaAutomatica } from './historia.js';

const FERRAMENTAS = [
  ['colocar', '✏️', 'Colocar', 'Toque numa peça embaixo e depois no mapa'],
  ['mao', '✋', 'Mover', 'Arraste uma peça para mudar de lugar, ou arraste o chão para andar pelo mapa'],
  ['apagar', '🧽', 'Apagar', 'Toque nas peças para tirar (o chão fica)'],
  ['aumentar', '🟩', 'Aumentar', 'Pinte onde não tem chão para aumentar o terreno'],
  ['cortar', '✂️', 'Cortar', 'Pinte para cortar pedaços do terreno'],
  ['balde', '🪣', 'Balde', 'Toque para pintar uma área inteira do mesmo chão'],
];
const sem = (s) => s.normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase();

export async function montar(app, [id]) {
  const m = await abrir(id);
  if (!m) { app.innerHTML = `<div class="tela" style="display:grid;place-items:center;text-align:center"><div><div style="font-size:54px">🔍</div><h2>Maquete não encontrada</h2><p style="color:var(--tinta2);font-weight:700;margin:8px 0 16px">Ela pode ter sido apagada ou ainda não chegou neste aparelho.</p><a class="bt bt--sol" href="#/">Voltar ao início</a></div></div>`; return; }
  m.chao = m.chao || {}; m.objs = m.objs || []; m.capitulos = m.capitulos || [];
  const edita = podeEditar(m);
  let pref = {}; try { pref = JSON.parse(localStorage.getItem('bi:editor') || '{}'); } catch { /* */ }

  const S = {
    ferr: edita ? 'colocar' : 'mao', peca: edita ? 'casa' : null, cor: 0, rot: 0, pincel: 1, cat: pref.cat || 'casas', busca: '',
    planta: false, noite: false, sel: null, hover: null, cam: null, painel: pref.painel ?? innerWidth > 980, aba: pref.aba || 'termo',
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
        ${edita ? '<button class="redondo" data-a="desfazer" title="Desfazer (Ctrl+Z)">↶</button><button class="redondo" data-a="refazer" title="Refazer">↷</button>' : ''}
        <span class="ed-salvo" title="Tudo é salvo sozinho">✓ Salvo</span>
        <button class="redondo ed-bt-painel" data-a="painel" title="Informações do bairro">📊</button>
      </div>
    </header>
    ${edita ? '' : `<div class="ed-faixa">👀 Maquete de <b>${esc(m.donoNome || m.dono || 'outra pessoa')}</b>. Você pode ver, passear e apresentar. <button class="bt bt--sol" data-a="duplicar">📄 Fazer uma cópia para editar</button></div>`}
    <div class="ed-dica"></div>
    <div class="ed-ferr" role="toolbar" aria-label="Ferramentas">
      ${FERRAMENTAS.map(([f, e, n]) => `<button class="ed-f" data-f="${f}" title="${n}"><span>${e}</span><small>${n}</small></button>`).join('')}
      <hr><div class="ed-pincel" title="Tamanho do pincel">${[1, 2, 3].map((p) => `<button data-p="${p}" title="Pincel ${p === 1 ? 'pequeno' : p === 2 ? 'médio' : 'grande'}"><i style="width:${4 + p * 4}px;height:${4 + p * 4}px"></i></button>`).join('')}</div>
      <hr><button class="ed-f" data-a="crescer" title="Crescer o terreno uma volta"><span>⤢</span><small>Crescer</small></button>
    </div>
    <div class="ed-vista">
      <button class="redondo" data-a="girar" title="Girar a vista (Q / E)">↻</button>
      <button class="redondo" data-a="mais" title="Aproximar">＋</button><button class="redondo" data-a="menos" title="Afastar">－</button>
      <button class="redondo" data-a="tudo" title="Ver o mapa inteiro">⌖</button><button class="redondo" data-a="noite" title="Dia / noite (N)">🌙</button>
    </div>
    <div class="ed-sel esconde"></div>
    <section class="ed-doca">
      <div class="ed-doca-top">
        <div class="ed-cats">${CATEGORIAS.map((c) => `<button data-cat="${c.id}"><span style="background:${c.cor}">${c.emoji}</span>${c.nome}</button>`).join('')}</div>
        <label class="ed-busca"><span>🔍</span><input type="search" placeholder="Procurar peça…" aria-label="Procurar peça"></label>
      </div>
      <div class="ed-opc"></div>
      <div class="ed-pecas" role="listbox" aria-label="Peças"></div>
    </section>
    <aside class="ed-painel" aria-label="Sobre o bairro">
      <div class="ed-abas"><button data-aba="termo"><span>🌡️</span>Termômetro</button><button data-aba="metas"><span>🎯</span>Metas</button><button data-aba="sobre"><span>📝</span>Sobre</button><button data-aba="caps"><span>📖</span>Capítulos</button></div>
      <div class="ed-aba-c"></div>
    </aside>
  </div>`);
  app.append(ed);
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
    const p = S.painel && innerWidth > 980 ? 340 : 0, doca = (edita ? $('.ed-doca').offsetHeight : 0) || 0;
    if (celular()) { const f = edita ? $('.ed-ferr').offsetHeight + 8 : 0; return { x: 8, y: 104, w: W - 60, h: H - 104 - doca - f - 16 }; }
    return { x: edita ? 86 : 20, y: 70, w: W - p - (edita ? 150 : 90), h: H - doca - 90 };
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
    const opt = { noite: S.noite, planta: S.planta, selecionado: S.sel, marcas: marcasPincel() };
    const f = fantasma(); if (f) opt.fantasma = f;
    const r = desenhar(ctx, ix, S.cam, W, H, opt); ultimosDesenhados = r.desenhados;
    if (S.sel) posicionarSel();
  }
  function estrelas() { ctx.fillStyle = 'rgba(255,255,255,.75)'; for (let i = 0; i < 70; i++) { const x = (i * 197.3) % W, y = (i * 71.9) % (H * .6); ctx.fillRect(x, y, 1.6, 1.6); } }
  new ResizeObserver(medir).observe(cv);

  // ------------------------------------------------ peças e regras de lugar
  const pecaAtual = () => (S.peca ? peca(S.peca) : null);
  const celsPincel = (c) => { const r = S.pincel - 1, out = []; for (let i = -r; i <= r; i++) for (let j = -r; j <= r; j++) if (i * i + j * j <= r * r + r) out.push([c.x + i, c.y + j]); return out; };
  function marcasPincel() {
    if (!S.hover || !edita || S.arrastandoMapa) return [];
    const p = pecaAtual();
    if (['aumentar', 'cortar', 'apagar'].includes(S.ferr) || (S.ferr === 'colocar' && p && p.tipo === 'chao')) {
      const cor = S.ferr === 'cortar' ? '#ff4d4d' : S.ferr === 'apagar' ? '#ffb703' : S.ferr === 'aumentar' ? '#3ddc84' : '#ffffff';
      return celsPincel(S.hover).map(([x, y]) => ({ x, y, cor }));
    }
    if (S.ferr === 'balde') return [{ x: S.hover.x, y: S.hover.y, cor: '#4cc9f0' }];
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
    if (!edita || !S.hover || S.arrastandoMapa) return null;
    if (S.mover) { const o = S.mover.o; return { t: o.t, x: S.hover.x - S.mover.dx, y: S.hover.y - S.mover.dy, r: o.r, c: o.c, ok: cabe(o.t, S.hover.x - S.mover.dx, S.hover.y - S.mover.dy, o.r || 0, o) }; }
    const p = pecaAtual(); if (S.ferr !== 'colocar' || !p || p.tipo !== 'obj') return null;
    const [w, d] = tamanho({ t: p.id, r: S.rot });
    const x = S.hover.x - Math.floor((w - 1) / 2), y = S.hover.y - Math.floor((d - 1) / 2);
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

  // ------------------------------------------------ salvar (sozinho, 1,2 s depois da última mudança)
  const selo = $('.ed-salvo');
  function mudou() {
    pendente = true; selo.textContent = '✏️ Editando…'; selo.className = 'ed-salvo';
    clearTimeout(salvarTimer); salvarTimer = setTimeout(gravar, 1200); reanalisar();
  }
  async function gravar() {
    clearTimeout(salvarTimer); if (!pendente || !edita) return; if (salvando) { salvarTimer = setTimeout(gravar, 400); return; }
    salvando = true; pendente = false; selo.textContent = '💾 Salvando…';
    try { await salvar(prepararParaSalvar(m)); selo.textContent = estado.nuvem && estado.sessao ? (navigator.onLine ? '☁️ Enviando…' : '📦 Salvo no aparelho') : '✓ Salvo'; }
    catch (e) { selo.textContent = '⚠️ Não salvou'; selo.className = 'ed-salvo erro'; pendente = true; console.error(e); }
    salvando = false;
  }
  const desligarDados = aoMudar((ev) => {
    if (ev.id !== m.id) return;
    if (ev.tipo === 'salvo' && ev.nuvem && !pendente) { selo.textContent = '☁️ Salvo na nuvem'; selo.className = 'ed-salvo'; }
    if (ev.tipo === 'erro_nuvem') { selo.textContent = '📦 Salvo no aparelho'; selo.title = 'Vai para a nuvem quando a internet voltar'; }
  });

  // ------------------------------------------------ ações no mapa
  function pintarChao(c, t) {
    let mud = false;
    for (const [x, y] of celsPincel(c)) {
      const k = x + ',' + y;
      if (S.ferr === 'aumentar') { if (!m.chao[k]) { m.chao[k] = 'grama'; mud = true; } continue; }
      if (S.ferr === 'cortar') { if (m.chao[k]) { delete m.chao[k]; mud = true; } continue; }
      if (m.chao[k] !== t) { m.chao[k] = t; mud = true; }
    }
    if (S.ferr === 'cortar' && mud) { const fora = (o) => { const [w, d] = tamanho(o); for (let i = 0; i < w; i++) for (let j = 0; j < d; j++) if (!m.chao[(o.x + i) + ',' + (o.y + j)]) return true; return false; }; m.objs = m.objs.filter((o) => !fora(o)); }
    if (mud) { ix = indexar(m); pedir(); }
  }
  function apagarEm(c) {
    const alvo = new Set(); for (const [x, y] of celsPincel(c)) { const o = ix.ocup.get(K(x, y)); if (o) alvo.add(o); }
    if (!alvo.size) return; m.objs = m.objs.filter((o) => !alvo.has(o)); if (alvo.has(S.sel)) { S.sel = null; esconderSel(); } ix = indexar(m); pedir();
  }
  function balde(c, t) {
    const k0 = c.x + ',' + c.y, de = m.chao[k0]; if (!de || de === t) return;
    const fila = [[c.x, c.y]], visto = new Set([k0]); let n = 0;
    while (fila.length && n < 30000) { const [x, y] = fila.pop(); m.chao[x + ',' + y] = t; n++; for (const [dx, dy] of [[1, 0], [-1, 0], [0, 1], [0, -1]]) { const k = (x + dx) + ',' + (y + dy); if (!visto.has(k) && m.chao[k] === de) { visto.add(k); fila.push([x + dx, y + dy]); } } }
    ix = indexar(m); pedir();
  }
  function crescer() {
    comecarMudanca(); const novos = [];
    for (const k of Object.keys(m.chao)) { const [x, y] = k.split(',').map(Number); for (const [dx, dy] of [[1, 0], [-1, 0], [0, 1], [0, -1], [1, 1], [-1, -1], [1, -1], [-1, 1]]) { const n = (x + dx) + ',' + (y + dy); if (!m.chao[n]) novos.push(n); } }
    novos.forEach((n) => { m.chao[n] = 'grama'; }); ix = indexar(m); terminarMudanca(); pedir();
    aviso(`Terreno cresceu! Agora tem ${num(Object.keys(m.chao).length)} quadradinhos 🟩`);
  }
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
    if (ponteiros.size === 2) { if (gesto && gesto.tipo !== 'mapa') { terminarMudanca(); } gesto = { tipo: 'mapa', dois: true, ultimo: centro() }; S.arrastandoMapa = true; return; }
    if (ponteiros.size > 2) return;
    const [x, y] = pos(e), c = cel(x, y); S.hover = c;
    const pan = e.button === 1 || e.button === 2 || espaco || !edita;
    if (pan) { gesto = { tipo: 'mapa', ultimo: [x, y], ini: [x, y] }; return; }
    const p = pecaAtual();
    if (S.ferr === 'mao') {
      const o = objetoEm(x, y);
      gesto = o ? { tipo: 'talvez-mover', o, ini: [x, y], c } : { tipo: 'mapa', ultimo: [x, y], ini: [x, y], tocar: true };
      return;
    }
    if (S.ferr === 'colocar' && (!p)) { gesto = { tipo: 'mapa', ultimo: [x, y], ini: [x, y], tocar: true }; return; }
    comecarMudanca();
    if (S.ferr === 'colocar' && p.tipo === 'obj') { const ok = colocarObjeto(c); gesto = { tipo: 'colocar', ult: c.x + ',' + c.y, ini: [x, y], pos: [x, y], colocou: ok }; if (ok) feedbackLocal(x, y); return; }
    if (S.ferr === 'balde') { balde(c, p && p.tipo === 'chao' ? p.id : 'grama'); gesto = { tipo: 'nada' }; return; }
    if (S.ferr === 'apagar') { apagarEm(c); gesto = { tipo: 'apagar', ult: c.x + ',' + c.y }; return; }
    pintarChao(c, p && p.tipo === 'chao' ? p.id : 'grama'); gesto = { tipo: 'pintar', ult: c.x + ',' + c.y, t: p && p.tipo === 'chao' ? p.id : 'grama' };
  });
  const centro = () => { const ps = [...ponteiros.values()]; return [(ps[0][0] + ps[1][0]) / 2, (ps[0][1] + ps[1][1]) / 2]; };
  cv.addEventListener('pointermove', (e) => {
    const [x, y] = pos(e);
    if (ponteiros.has(e.pointerId)) ponteiros.set(e.pointerId, [x, y]);
    if (gesto && gesto.dois && ponteiros.size >= 2) { const c = centro(); arrastar(c[0] - gesto.ultimo[0], c[1] - gesto.ultimo[1]); gesto.ultimo = c; return; }
    const c = cel(x, y), mudouCel = !S.hover || S.hover.x !== c.x || S.hover.y !== c.y; S.hover = c;
    if (!gesto) { if (mudouCel) pedir(); cv.style.cursor = cursor(); return; }
    const k = c.x + ',' + c.y;
    switch (gesto.tipo) {
      case 'mapa': if (gesto.tocar && Math.hypot(x - gesto.ini[0], y - gesto.ini[1]) > 6) gesto.tocar = false; arrastar(x - gesto.ultimo[0], y - gesto.ultimo[1]); gesto.ultimo = [x, y]; S.arrastandoMapa = !gesto.tocar; break;
      case 'talvez-mover': if (Math.hypot(x - gesto.ini[0], y - gesto.ini[1]) > 6) { comecarMudanca(); S.mover = { o: gesto.o, dx: gesto.c.x - gesto.o.x, dy: gesto.c.y - gesto.o.y }; esconderSel(); gesto = { tipo: 'mover' }; pedir(); } break;
      case 'mover': if (mudouCel) pedir(); break;
      case 'colocar': if (k !== gesto.ult) { gesto.ult = k; const p = pecaAtual(); if (p && OBJETOS[p.id].w === 1 && OBJETOS[p.id].d === 1 && colocarObjeto(c)) gesto.colocou = true; } gesto.pos = [x, y]; break;
      case 'pintar': if (k !== gesto.ult) { gesto.ult = k; pintarChao(c, gesto.t); } break;
      case 'apagar': if (k !== gesto.ult) { gesto.ult = k; apagarEm(c); } break;
      default: if (mudouCel) pedir();
    }
  });
  const soltar = (e) => {
    ponteiros.delete(e.pointerId);
    if (gesto && gesto.dois) { if (!ponteiros.size) { gesto = null; S.arrastandoMapa = false; } return; }
    if (!gesto) return; const g = gesto; gesto = null; S.arrastandoMapa = false;
    if (g.tipo === 'talvez-mover') selecionar(g.o);
    else if (g.tipo === 'mapa' && g.tocar) { const [x, y] = pos(e); const o = objetoEm(x, y); if (o) selecionar(o); else { S.sel = null; esconderSel(); } }
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
    e.preventDefault(); if (e.ctrlKey) return; // pinça do trackpad: desligada
    const [x, y] = pos(e); const mouse = e.deltaMode === 1 || (e.deltaX === 0 && Math.abs(e.deltaY) >= 50 && Number.isInteger(e.deltaY));
    if (mouse) zoom(e.deltaY < 0 ? 1.15 : 1 / 1.15, x, y); else arrastar(-e.deltaX, -e.deltaY);
  }, { passive: false });
  const cursor = () => (!edita || S.ferr === 'mao' || (S.ferr === 'colocar' && !S.peca) ? 'grab' : S.ferr === 'balde' ? 'cell' : 'crosshair');

  // teclado
  const tecla = (e) => {
    if (e.target.closest('input, textarea')) return; const k = e.key.toLowerCase();
    if (k === ' ') { espaco = true; cv.style.cursor = 'grab'; e.preventDefault(); return; }
    if ((e.metaKey || e.ctrlKey) && k === 'z') { e.preventDefault(); e.shiftKey ? voltar(refazer, desfazer) : voltar(desfazer, refazer); return; }
    if ((e.metaKey || e.ctrlKey) && k === 'y') { e.preventDefault(); voltar(refazer, desfazer); return; }
    if (e.metaKey || e.ctrlKey || e.altKey) return;
    if (k === 'r') { if (S.sel) girarSel(); else { S.rot = (S.rot + 1) % 4; pedir(); } }
    else if (k === 'q' || k === 'e') girarVista(k === 'e' ? 1 : 3);
    else if (k === 'n') alternarNoite();
    else if (k === '+' || k === '=') zoom(1.2); else if (k === '-') zoom(1 / 1.2);
    else if ((k === 'delete' || k === 'backspace') && S.sel) apagarSel();
    else if (k === 'escape') { S.sel = null; esconderSel(); S.peca = null; desenharPecas(); pedir(); }
    else if (k.startsWith('arrow')) { const v = { arrowup: [0, 60], arrowdown: [0, -60], arrowleft: [60, 0], arrowright: [-60, 0] }[k]; arrastar(...v); e.preventDefault(); }
    else if (/^[1-6]$/.test(k) && edita) escolherFerr(FERRAMENTAS[+k - 1][0]);
  };
  const solta = (e) => { if (e.key === ' ') { espaco = false; cv.style.cursor = cursor(); } };
  document.addEventListener('keydown', tecla); document.addEventListener('keyup', solta);

  // ------------------------------------------------ peça selecionada (janelinha em cima dela)
  const selBox = $('.ed-sel');
  function selecionar(o) {
    S.sel = o; const p = OBJETOS[o.t];
    selBox.innerHTML = `<b>${p.nome}</b>${edita ? `<button data-s="girar" title="Girar (R)">🔄</button>${p.cores ? '<button data-s="cor" title="Trocar a cor">🎨</button>' : ''}<button data-s="copiar" title="Usar esta peça">✏️</button><button data-s="apagar" title="Apagar (Delete)">🗑️</button>` : ''}<button data-s="fechar" title="Fechar">✕</button>`;
    selBox.classList.remove('esconde'); posicionarSel(); pedir();
  }
  function posicionarSel() {
    if (!S.sel) return; const b = caixaGirada(S.cam.rot, S.sel); const G = lapis(ctx, S.cam, W, H, { planta: S.planta });
    const p = S.planta ? G.P(b.X + b.W / 2, b.Y) : G.P(b.X + b.W / 2, b.Y + b.D / 2, OBJETOS[S.sel.t].chato ? 10 : OBJETOS[S.sel.t].fino ? 50 : 70);
    selBox.style.left = Math.max(80, Math.min(W - 120, p[0])) + 'px'; selBox.style.top = Math.max(76, p[1] - 12) + 'px';
  }
  function esconderSel() { selBox.classList.add('esconde'); }
  function girarSel() { const o = S.sel; if (!o || !edita) return; comecarMudanca(); const r = ((o.r || 0) + 1) % 4; if (cabe(o.t, o.x, o.y, r, o)) { o.r = r; ix = indexar(m); } else aviso('Não dá para girar aqui: falta espaço', 'erro', 1600); terminarMudanca(); pedir(); }
  function apagarSel() { if (!S.sel || !edita) return; comecarMudanca(); m.objs = m.objs.filter((o) => o !== S.sel); S.sel = null; esconderSel(); ix = indexar(m); terminarMudanca(); pedir(); }
  selBox.addEventListener('click', (e) => {
    const a = e.target.closest('[data-s]')?.dataset.s; const o = S.sel; if (!a || !o) return;
    if (a === 'girar') girarSel();
    if (a === 'cor') { comecarMudanca(); o.c = ((o.c || 0) + 1) % OBJETOS[o.t].cores; terminarMudanca(); pedir(); }
    if (a === 'copiar') { S.peca = o.t; S.cor = o.c || 0; S.rot = o.r || 0; escolherFerr('colocar'); S.cat = OBJETOS[o.t].cats[0]; desenharCats(); desenharPecas(); S.sel = null; esconderSel(); }
    if (a === 'apagar') apagarSel();
    if (a === 'fechar') { S.sel = null; esconderSel(); pedir(); }
  });

  // ------------------------------------------------ ferramentas e vista
  const dica = $('.ed-dica');
  function escolherFerr(f) {
    S.ferr = f; ed.querySelectorAll('.ed-f[data-f]').forEach((b) => b.classList.toggle('on', b.dataset.f === f));
    const d = FERRAMENTAS.find((x) => x[0] === f); dica.innerHTML = `<b>${d[1]} ${d[2]}</b> · ${d[3]}`; cv.style.cursor = cursor();
    ed.querySelector('.ed-pincel').classList.toggle('apagado', !['colocar', 'apagar', 'aumentar', 'cortar'].includes(f)); pedir();
  }
  function girarVista(passo = 1) { const rot = ((S.cam.rot || 0) + passo) % 4; S.cam = { ...S.cam, rot }; if (S.sel) posicionarSel(); pedir(); }
  function alternarNoite() { S.noite = !S.noite; ed.classList.toggle('noite', S.noite); ed.querySelector('[data-a=noite]').classList.toggle('on', S.noite); ed.querySelector('[data-a=noite]').textContent = S.noite ? '☀️' : '🌙'; pedir(); }
  function trocarVista(planta) {
    if (S.planta === planta) return; const z = S.cam.z * (planta ? TW / TP / 1.6 : TP * 1.6 / TW); S.planta = planta; S.cam = { ...S.cam, z };
    ed.querySelectorAll('.ed-modos [data-modo]').forEach((b) => b.classList.toggle('on', b.dataset.modo === (planta ? 'planta' : '3d'))); ed.classList.toggle('planta', planta); enquadrarTudo(false);
  }
  ed.addEventListener('click', async (e) => {
    const f = e.target.closest('.ed-f[data-f]'); if (f) { escolherFerr(f.dataset.f); return; }
    const pc = e.target.closest('[data-p]'); if (pc) { S.pincel = +pc.dataset.p; ed.querySelectorAll('[data-p]').forEach((b) => b.classList.toggle('on', b === pc)); pedir(); return; }
    const md = e.target.closest('.ed-modos [data-modo]');
    if (md) {
      const v = md.dataset.modo; if (v === '3d' || v === 'planta') return trocarVista(v === 'planta');
      await gravar(); if (v === 'comparar') location.hash = '#/comparar/' + m.id; else location.hash = '#/m/' + m.id + '/' + v; return;
    }
    const a = e.target.closest('[data-a]')?.dataset.a; if (!a) return;
    if (a === 'desfazer') voltar(desfazer, refazer); if (a === 'refazer') voltar(refazer, desfazer);
    if (a === 'girar') girarVista(1); if (a === 'mais') zoom(1.25); if (a === 'menos') zoom(1 / 1.25); if (a === 'tudo') enquadrarTudo(); if (a === 'noite') alternarNoite();
    if (a === 'crescer') crescer();
    if (a === 'painel') { S.painel = !S.painel; ed.classList.toggle('com-painel', S.painel); guardarPref(); if (S.painel) desenharAba(); }
    if (a === 'duplicar') { const c = await duplicar(m, m.nome + ' (minha cópia)'); aviso('Cópia criada! Agora é sua 😊'); location.hash = '#/m/' + c.id; }
  });
  $('.ed-nome').onclick = () => { S.painel = true; ed.classList.add('com-painel'); S.aba = 'sobre'; desenharAba(); setTimeout(() => ed.querySelector('[name=nome]')?.focus(), 50); };
  const guardarPref = () => { try { localStorage.setItem('bi:editor', JSON.stringify({ cat: S.cat, painel: S.painel, aba: S.aba })); } catch { /* */ } };

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
    const p = pecaAtual(); if (!p || !edita) { opc.innerHTML = ''; return; }
    const cores = p.tipo === 'obj' && p.cores ? p.cores : 0;
    opc.innerHTML = `<span class="ed-opc-n">${p.tipo === 'chao' ? '🖌️' : '✏️'} <b>${p.nome}</b></span>
      ${cores ? `<span class="ed-cores">${Array.from({ length: cores }, (_, i) => `<button data-cor="${i}" class="${i === S.cor ? 'on' : ''}" title="Cor ${i + 1}"><img src="${miniatura(p.id, i, 44)}" alt=""></button>`).join('')}</span>` : ''}
      ${p.tipo === 'obj' ? `<button class="bt bt--leve" data-girar>🔄 Girar <small>(R)</small></button>` : `<span class="ed-opc-d">Arraste no mapa para pintar · use o <b>🪣 balde</b> para áreas grandes</span>`}`;
  }
  cats.addEventListener('click', (e) => { const b = e.target.closest('[data-cat]'); if (!b) return; S.cat = b.dataset.cat; S.busca = ''; busca.value = ''; desenharCats(); desenharPecas(); pecasEl.scrollLeft = 0; guardarPref(); });
  busca.addEventListener('input', () => { S.busca = busca.value.trim(); desenharCats(); desenharPecas(); });
  pecasEl.addEventListener('click', (e) => {
    const b = e.target.closest('.pc'); if (!b) return;
    if (S.peca === b.dataset.id && S.ferr === 'colocar') { S.peca = null; } else { S.peca = b.dataset.id; S.cor = 0; }
    if (!['colocar', 'balde'].includes(S.ferr) || (S.ferr === 'balde' && peca(S.peca)?.tipo !== 'chao')) escolherFerr('colocar');
    S.sel = null; esconderSel(); desenharPecas(); pedir();
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
      abaC.innerHTML = `<label class="campo">Nome do bairro<input name="nome" maxlength="60" value="${esc(m.nome)}" ${edita ? '' : 'disabled'}></label>
        <div class="campo">Tipo de bairro<div class="tipos">${Object.entries(TIPOS).map(([k, [e, n]]) => `<button data-tipo="${k}" class="${m.tipo === k ? 'on' : ''}" ${edita ? '' : 'disabled'}>${e} ${n}</button>`).join('')}</div></div>
        <label class="campo">Cidade (opcional)<input name="cidade" maxlength="60" value="${esc(m.cidade || '')}" placeholder="Ex.: Uberlândia - MG" ${edita ? '' : 'disabled'}></label>
        <label class="campo">A história do bairro<textarea name="historia" maxlength="6000" rows="9" placeholder="Como o bairro nasceu? Quem mora aqui? O que tem de bom e o que precisa melhorar?" ${edita ? '' : 'disabled'}>${esc(m.historia || '')}</textarea></label>
        <p class="ed-p">📏 Terreno com <b>${num(c.area)}</b> quadradinhos e <b>${num(c.pecas)}</b> peças. Para aumentar, use <b>🟩 Aumentar</b> ou <b>⤢ Crescer</b>; para recortar, <b>✂️ Cortar</b>.</p>`;
      abaC.oninput = (e) => {
        const n = e.target.name; if (!['nome', 'cidade', 'historia'].includes(n)) return; m[n] = e.target.value;
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
    abaC.oninput = null; abaC.onclick = (e) => { const b = e.target.closest('[data-ind]'); if (b) { const i = INDICADORES.find((x) => x.id === b.dataset.ind); aviso(`${i.emoji} <b>${i.nome}</b>: ${esc(i.explica)}`, 'ok', 5000); } };
  }
  let textoTimer; function mudouTexto() { clearTimeout(textoTimer); textoTimer = setTimeout(() => { pendente = true; selo.textContent = '✏️ Editando…'; clearTimeout(salvarTimer); salvarTimer = setTimeout(gravar, 1200); }, 300); }

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

  // ------------------------------------------------ começo
  escolherFerr(S.ferr); ed.querySelector(`[data-p="${S.pincel}"]`).classList.add('on');
  desenharCats(); desenharPecas(); botoesHist(); desenharAba(); notaTopo();
  medir();
  // pequena dica na primeira vez
  try { if (edita && !localStorage.getItem('bi:dica-editor')) { localStorage.setItem('bi:dica-editor', '1'); setTimeout(() => aviso('👇 Escolha uma peça embaixo e toque no mapa para colocar', 'ok', 4500), 600); } } catch { /* */ }

  return {
    temMudancas: () => pendente || salvando,
    perguntarSaida: async () => { await gravar(); return true; },
    sair: () => { gravar(); desligarDados(); document.body.classList.remove('no-editor'); document.removeEventListener('keydown', tecla); document.removeEventListener('keyup', solta); },
  };
}
