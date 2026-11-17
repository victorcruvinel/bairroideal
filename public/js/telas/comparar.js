// Bairro Ideal · comparar duas maquetes: lado a lado ou com cortina deslizante, notas e tabela de diferenças
import { el, esc, num } from '../ui.js';
import { listar, abrir } from '../dados.js';
import { indexar, desenhar, enquadrar } from '../motor.js';
import { analisar, INDICADORES } from '../termometro.js';
import { topo, chipTipo, notaTxt, corNota } from './comum.js';

const LINHAS = [['🏠', 'Casas boas', 'casas'], ['🏢', 'Prédios', 'predios'], ['🏚️', 'Barracos', 'barracos', true], ['🌳', 'Árvores', 'arvores'], ['👨‍👩‍👧', 'Moradores (estimativa)', 'moradores', null],
  ['🏫', 'Escolas e creches', 'escolas'], ['➕', 'Postos e hospitais', 'saude'], ['💡', 'Postes de luz', 'postes'], ['🗑️', 'Montes de lixo', 'lixo', true], ['🤢', 'Esgoto a céu aberto', 'esgoto', true], ['🟫', 'Ruas de terra', 'ruasTerra', true], ['🟩', 'Tamanho (quadradinhos)', 'area', null]];

export async function montar(app, [ida, idb]) {
  app.append(topo({ voltar: true, titulo: 'Comparar' }));
  const lista = await listar(); const todas = [...lista.minhas, ...lista.equipe];
  if (todas.length < 2) {
    app.append(el(`<div class="tela"><div class="larg"><div class="vazio-lista" style="margin-top:30px">Você precisa de pelo menos duas maquetes para comparar. <a href="#/">Criar outra</a></div></div></div>`)); return;
  }
  const porTipo = (t) => todas.find((m) => m.tipo === t);
  ida = ida && todas.some((m) => m.id === ida) ? ida : (porTipo('ideal') || todas[0]).id;
  idb = idb && todas.some((m) => m.id === idb) && idb !== ida ? idb : ((todas.find((m) => m.id !== ida && m.tipo === 'carente') || todas.find((m) => m.id !== ida)).id);
  const opcoes = (sel) => todas.map((m) => `<option value="${m.id}" ${m.id === sel ? 'selected' : ''}>${esc(m.nome)}${m.tipo === 'ideal' ? ' 🌳' : m.tipo === 'carente' ? ' 🏚️' : ''}</option>`).join('');
  const t = el(`<div class="tela"><div class="larg cmp">
    <div class="cmp-barra">
      <select class="cmp-sel" data-l="a" aria-label="Primeira maquete">${opcoes(ida)}</select>
      <button class="redondo" data-c="trocar" title="Trocar de lado">⇄</button>
      <select class="cmp-sel" data-l="b" aria-label="Segunda maquete">${opcoes(idb)}</select>
      <div class="cmp-modos"><button data-modo="lado" class="on">◧ Lado a lado</button><button data-modo="cortina">↔ Cortina</button></div>
      <button class="redondo" data-c="girar" title="Girar">↻</button><button class="redondo" data-c="noite" title="Dia / noite">🌙</button>
    </div>
    <div class="cmp-vistas"></div>
    <div class="cmp-tab"></div>
    <div class="rodape">Bairro Ideal · projeto acadêmico de Victor Soares Cruvinel</div>
  </div></div>`);
  app.append(t);
  let A, B, aA, aB, modo = 'lado', rot = 0, noite = false, corte = .5;
  const vistas = t.querySelector('.cmp-vistas'), tab = t.querySelector('.cmp-tab');

  async function carregar() {
    [A, B] = await Promise.all([abrir(ida), abrir(idb)]);
    if (!A || !B) { vistas.innerHTML = '<div class="vazio-lista">Não consegui abrir uma das maquetes agora. Tente de novo com internet.</div>'; return; }
    aA = analisar(A); aB = analisar(B); history.replaceState(null, '', `#/comparar/${ida}/${idb}`); montarVistas(); montarTabela();
  }
  const cartao = (m, a, lado) => `<div class="cmp-lado" data-lado="${lado}"><header>${chipTipo(m.tipo)}<b>${esc(m.nome)}</b><span class="cmp-nota" style="color:${corNota(a.nota)}">${notaTxt(a.nota)}<small>nota</small></span></header>
    <canvas></canvas><div class="cmp-hist">${esc((m.historia || 'Sem história escrita.').slice(0, 180))}${(m.historia || '').length > 180 ? '…' : ''} <a href="#/m/${m.id}/historia">📖 ver história</a></div></div>`;
  function montarVistas() {
    if (modo === 'lado') vistas.innerHTML = `<div class="cmp-dois">${cartao(A, aA, 'a')}<div class="cmp-vs">VS</div>${cartao(B, aB, 'b')}</div>`;
    else vistas.innerHTML = `<div class="cmp-cortina"><header><span>${chipTipo(A.tipo)} <b>${esc(A.nome)}</b> <i style="color:${corNota(aA.nota)}">${notaTxt(aA.nota)}</i></span><span><i style="color:${corNota(aB.nota)}">${notaTxt(aB.nota)}</i> <b>${esc(B.nome)}</b> ${chipTipo(B.tipo)}</span></header><canvas></canvas><div class="cmp-puxador" style="left:${corte * 100}%"><i>↔</i></div></div>`;
    desenharVistas();
    if (modo === 'cortina') ligarCortina();
  }
  function pintar(cv, m, larg, alt, clip) {
    const d = Math.min(2, devicePixelRatio || 1); if (cv.width !== Math.round(larg * d)) { cv.width = Math.round(larg * d); cv.height = Math.round(alt * d); }
    const ctx = cv.getContext('2d'); ctx.setTransform(d, 0, 0, d, 0, 0);
    if (!clip) ctx.clearRect(0, 0, larg, alt);
    const ix = indexar(m); const cam = enquadrar(ix, larg, alt, rot, false, .9);
    ctx.save(); if (clip) { ctx.beginPath(); ctx.rect(clip[0], 0, clip[1] - clip[0], alt); ctx.clip(); ctx.clearRect(clip[0], 0, clip[1] - clip[0], alt); }
    if (noite) { const g = ctx.createLinearGradient(0, 0, 0, alt); g.addColorStop(0, '#0f1733'); g.addColorStop(1, '#27325e'); ctx.fillStyle = g; ctx.fillRect(0, 0, larg, alt); }
    desenhar(ctx, ix, cam, larg, alt, { noite }); ctx.restore();
  }
  function desenharVistas() {
    if (!A) return;
    if (modo === 'lado') vistas.querySelectorAll('.cmp-lado').forEach((c) => { const cv = c.querySelector('canvas'); const r = cv.getBoundingClientRect(); pintar(cv, c.dataset.lado === 'a' ? A : B, r.width, r.height); });
    else { const cv = vistas.querySelector('canvas'); const r = cv.getBoundingClientRect(); const x = r.width * corte; pintar(cv, A, r.width, r.height, [0, x]); pintar(cv, B, r.width, r.height, [x, r.width]); }
  }
  function ligarCortina() {
    const cx = vistas.querySelector('.cmp-cortina'), pux = cx.querySelector('.cmp-puxador'); let arr = false;
    const mover = (e) => { const r = cx.getBoundingClientRect(); corte = Math.max(.02, Math.min(.98, (e.clientX - r.left) / r.width)); pux.style.left = corte * 100 + '%'; desenharVistas(); };
    cx.addEventListener('pointerdown', (e) => { arr = true; cx.setPointerCapture(e.pointerId); mover(e); });
    cx.addEventListener('pointermove', (e) => { if (arr) mover(e); }); cx.addEventListener('pointerup', () => { arr = false; });
  }
  function montarTabela() {
    const barra = (v, cor) => `<div class="barra"><i style="width:${v ?? 0}%;background:${cor}"></i></div>`;
    const melhor = (a, b, menos) => (a == null || b == null || a === b ? 0 : (menos ? a < b : a > b) ? 1 : 2);
    tab.innerHTML = `<h2 class="secao-t">📊 Termômetro lado a lado</h2>
      <div class="cmp-grade cmp-cab"><span></span><b>${esc(A.nome)}</b><b>${esc(B.nome)}</b></div>
      ${INDICADORES.map((i) => { const a = aA.v[i.id], b = aB.v[i.id], w = melhor(a, b); return `<div class="cmp-grade"><span>${i.emoji} ${i.nome}</span>
        <div class="${w === 1 ? 'ganha' : ''}"><em>${a == null ? '–' : a + '%'}</em>${barra(a, '#52b788')}</div><div class="${w === 2 ? 'ganha' : ''}"><em>${b == null ? '–' : b + '%'}</em>${barra(b, '#ff7a59')}</div></div>`; }).join('')}
      <h2 class="secao-t">🔢 O que tem em cada um</h2>
      <div class="cmp-nums">${LINHAS.map(([e, n, k, menos]) => { const a = aA.contagem[k], b = aB.contagem[k], w = menos === null ? 0 : melhor(a, b, menos); return `<div class="cmp-grade"><span>${e} ${n}</span><b class="${w === 1 ? 'ganha' : ''}">${num(a)}</b><b class="${w === 2 ? 'ganha' : ''}">${num(b)}</b></div>`; }).join('')}</div>
      <div class="cmp-probs"><div><h3>⚠️ Problemas em ${esc(A.nome)}</h3>${aA.problemas.length ? `<ul class="probs">${aA.problemas.map((p) => `<li>${esc(p)}</li>`).join('')}</ul>` : '<p class="ed-p">Nenhum problema encontrado 🎉</p>'}</div>
      <div><h3>⚠️ Problemas em ${esc(B.nome)}</h3>${aB.problemas.length ? `<ul class="probs">${aB.problemas.map((p) => `<li>${esc(p)}</li>`).join('')}</ul>` : '<p class="ed-p">Nenhum problema encontrado 🎉</p>'}</div></div>`;
  }
  t.addEventListener('change', (e) => { const s = e.target.closest('.cmp-sel'); if (!s) return; if (s.dataset.l === 'a') ida = s.value; else idb = s.value; carregar(); });
  t.addEventListener('click', (e) => {
    const md = e.target.closest('.cmp-modos [data-modo]'); if (md) { modo = md.dataset.modo; t.querySelectorAll('.cmp-modos button').forEach((b) => b.classList.toggle('on', b === md)); montarVistas(); return; }
    const c = e.target.closest('[data-c]')?.dataset.c;
    if (c === 'trocar') { [ida, idb] = [idb, ida]; t.querySelector('[data-l=a]').value = ida; t.querySelector('[data-l=b]').value = idb; carregar(); }
    if (c === 'girar') { rot = (rot + 1) % 4; desenharVistas(); }
    if (c === 'noite') { noite = !noite; e.target.closest('button').textContent = noite ? '☀️' : '🌙'; desenharVistas(); }
  });
  const rs = () => desenharVistas(); addEventListener('resize', rs);
  await carregar();
  return { sair: () => removeEventListener('resize', rs) };
}
