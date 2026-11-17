// Bairro Ideal · modo história (apresentação): a câmera voa por cada capítulo e a coruja conta a história.
// Também cria uma história automática a partir do que existe na maquete.
import { el, esc } from '../ui.js';
import { abrir } from '../dados.js';
import { indexar, desenhar, enquadrar, tamanho, deltaMundo } from '../motor.js';
import { OBJETOS } from '../pecas.js';
import { analisar, dicas } from '../termometro.js';
import { notaTxt, corNota, TIPOS } from './comum.js';
import { calcular, fmt, fracao } from '../matematica.js';

export const CORUJA = `<svg viewBox="0 0 80 80" aria-hidden="true"><ellipse cx="40" cy="48" rx="26" ry="28" fill="#8a6a4a"/><ellipse cx="40" cy="56" rx="17" ry="19" fill="#f3dfc1"/>
<path d="M16 26 24 12 30 26zM64 26 56 12 50 26z" fill="#8a6a4a"/><circle cx="29" cy="36" r="11" fill="#fff"/><circle cx="51" cy="36" r="11" fill="#fff"/>
<circle cx="31" cy="37" r="5.5" fill="#2b2a33"/><circle cx="49" cy="37" r="5.5" fill="#2b2a33"/><circle cx="32.5" cy="35" r="1.8" fill="#fff"/><circle cx="50.5" cy="35" r="1.8" fill="#fff"/>
<path d="M36 45h8l-4 6z" fill="#ffb703"/><path d="M22 58q-8 6-6 16M58 58q8 6 6 16" stroke="#6b4f36" stroke-width="5" fill="none" stroke-linecap="round"/>
<path d="M18 22q22-14 44 0" stroke="#1f6f50" stroke-width="5" fill="none"/><rect x="31" y="9" width="18" height="9" rx="2" fill="#1f6f50"/><path d="M49 14l8 6" stroke="#ffc93c" stroke-width="2"/></svg>`;

const focoEm = (o, z = 1.55) => { const [w, d] = tamanho(o); return { x: o.x + w / 2, y: o.y + d / 2, z, rot: 0 }; };
const meio = (lista) => lista[Math.floor(lista.length / 2)];

export function historiaAutomatica(m, a = analisar(m)) {
  const objs = (m.objs || []).filter((o) => OBJETOS[o.t]); const c = a.contagem; const ideal = (a.nota ?? 0) >= 6.5;
  const caps = [];
  const resumo = `${m.nome} tem ${c.casas + c.predios + c.barracos} construções onde moram cerca de ${c.moradores} pessoas${m.cidade ? `, em ${m.cidade}` : ''}.`;
  caps.push({ titulo: `Conheça ${m.nome}`, texto: (m.historia ? m.historia.slice(0, 420) + (m.historia.length > 420 ? '…' : '') : resumo), cam: null });
  const de = (pred) => objs.filter((o) => pred(OBJETOS[o.t], o));
  const escolas = de((p) => p.f?.escola), saude = de((p) => p.f?.saude), lazer = de((p) => p.f?.lazer >= 1), casas = de((p) => p.f?.familias), ruins = de((p) => p.f?.ruim), lixo = de((p) => p.f?.lixo);
  if (casas.length) caps.push({ titulo: 'Onde as pessoas moram', texto: c.barracos > c.casas ? `A maioria das famílias vive em barracos (${c.barracos}) feitos com o que tinha à mão, muitos sem reboco e sem segurança.` : `São ${c.casas} casas e ${c.predios} prédios. ${c.barracos ? `Ainda existem ${c.barracos} famílias em barracos.` : 'Todas as famílias têm uma casa segura.'}`, cam: focoEm(meio(casas)) });
  if (escolas.length) caps.push({ titulo: 'A escola', texto: a.v.educacao >= 90 ? 'Todas as crianças estudam perto de casa e podem ir a pé para a escola.' : `A escola atende parte do bairro, mas ${100 - a.v.educacao}% das famílias moram longe dela.`, cam: focoEm(escolas[0]) });
  else if (casas.length) caps.push({ titulo: 'Sem escola por perto', texto: 'Não existe escola no bairro. As crianças precisam andar muito ou pegar condução para estudar.', cam: focoEm(meio(casas), 1.2) });
  if (saude.length) caps.push({ titulo: 'Cuidando da saúde', texto: a.v.saude >= 90 ? 'O posto de saúde fica perto de todas as casas.' : 'Existe atendimento de saúde, mas não chega perto de todo mundo.', cam: focoEm(saude[0]) });
  if (lazer.length) caps.push({ titulo: 'Lazer e convivência', texto: 'Praças, parquinhos e quadras são lugares para brincar, praticar esporte e conversar com os vizinhos.', cam: focoEm(lazer[0]) });
  const agua = Object.entries(m.chao || {}).filter(([, t]) => t === 'agua');
  if (agua.length) { const [k] = meio(agua); const [x, y] = k.split(',').map(Number); caps.push({ titulo: 'Natureza', texto: `${c.arvores} árvores e água limpa deixam o bairro mais fresco e bonito.`, cam: { x: x + .5, y: y + .5, z: 1.4, rot: 0 } }); }
  if (a.problemas.length) {
    const alvo = lixo[0] || ruins[0] || objs[0];
    caps.push({ titulo: ideal ? 'O que ainda falta' : 'Os problemas do bairro', texto: 'Encontramos: ' + a.problemas.slice(0, 5).map((p) => p.replace(/^\S+\s/, '')).join(', ') + '.', cam: alvo ? focoEm(alvo, 1.5) : null });
  }
  if (c.ruas + c.ruasTerra) caps.push({ titulo: 'À noite', texto: a.v.iluminacao >= 80 ? 'Os postes iluminam as ruas e as pessoas andam com mais segurança.' : `Só ${a.v.iluminacao ?? 0}% das ruas têm luz. À noite fica escuro e perigoso andar na rua.`, cam: { ...(casas.length ? focoEm(meio(casas), 1.1) : { x: 0, y: 0, z: 1 }), noite: true } });
  const M = calcular(m, a);
  if (M.n) caps.push({ titulo: 'O bairro em números 🔢', texto: `Área: ${fmt(M.n)} quadradinhos × 100 m² = ${fmt(M.area)} m². Perímetro: ${fmt(M.perimetro)} m. ${M.moradores ? `Densidade: ${fmt(M.moradores)} moradores ÷ ${fmt(M.km2, 3)} km² ≈ ${fmt(M.densidade)} habitantes por km². ` : ''}Cerca de ${fracao((M.uso.verde + M.uso.lazer) / M.n)} do terreno é verde ou praça${M.verdePorHab != null ? ` (${fmt(M.verdePorHab, 1)} m² por morador)` : ''}.`, cam: null });
  const ds = dicas(a);
  caps.push({ titulo: `Nota do bairro: ${notaTxt(a.nota)}`, texto: (ideal ? 'Este bairro cuida bem de quem mora nele.' : 'Este bairro precisa de muita ajuda.') + (ds.length ? ' Para melhorar: ' + ds.slice(0, 3).join(' ') : ' Todas as metas foram cumpridas! 🏆'), cam: null, final: true });
  return caps;
}

export async function montar(app, [id]) {
  const m = await abrir(id); if (!m) { location.hash = '#/'; return; }
  const a = analisar(m); const caps = (m.capitulos && m.capitulos.length ? m.capitulos : historiaAutomatica(m, a));
  app.classList.add('app--cheio');
  // "Apresentar todos": uma lista de bairros que passam um depois do outro
  let tour = null; try { tour = JSON.parse(sessionStorage.getItem('bi:tour') || 'null'); } catch { /* */ }
  const pos = tour ? tour.indexOf(m.id) : -1; const proxId = pos >= 0 && pos < tour.length - 1 ? tour[pos + 1] : null;
  const irProximo = () => { try { sessionStorage.setItem('bi:tour-auto', auto ? '1' : ''); } catch { /* */ } location.hash = '#/m/' + proxId + '/historia'; };
  const t = el(`<div class="hist">
    <canvas></canvas>
    <div class="hist-topo"><div class="hist-prog">${caps.map((_, i) => `<i data-i="${i}"></i>`).join('')}</div>
      <div class="hist-acoes"><button class="redondo" data-h="voz" title="Ler em voz alta">🔇</button><button class="redondo" data-h="play" title="Passar sozinho">▶</button><button class="redondo" data-h="sair" title="Sair (Esc)">✕</button></div></div>
    <div class="hist-nome"><b>${esc(m.nome)}</b> ${TIPOS[m.tipo] ? `<span>${TIPOS[m.tipo][0]} ${TIPOS[m.tipo][1]}</span>` : ''}${pos >= 0 ? `<span>🏛️ Bairro ${pos + 1} de ${tour.length}</span>` : ''}</div>
    <button class="hist-seta esq" data-h="ant" aria-label="Anterior">‹</button><button class="hist-seta dir" data-h="prox" aria-label="Próximo">›</button>
    <div class="hist-por">Bairro Ideal · por Elaine Freitas Muniz</div>
    <div class="hist-leg"><div class="hist-coruja">${CORUJA}</div><div class="hist-txt"><small></small><h2></h2><p></p></div></div>
  </div>`);
  app.append(t);
  const cv = t.querySelector('canvas'), ctx = cv.getContext('2d'), ix = indexar(m);
  let W = 0, H = 0, i = 0, cam = null, alvo = null, de = null, t0 = 0, noite = false, planta = false, auto = false, voz = false, timer = null, vivo = true;
  const medir = () => { const d = Math.min(2, devicePixelRatio || 1); W = innerWidth; H = innerHeight; cv.width = W * d; cv.height = H * d; ctx.setTransform(d, 0, 0, d, 0, 0); };
  medir(); addEventListener('resize', medir);
  const geral = () => { const c = enquadrar(ix, W, H * .72, 0, false, .9); const off = deltaMundo(c, 0, H * .12, false); return { ...c, x: c.x + off[0], y: c.y + off[1] }; };

  function ir(n) {
    i = Math.max(0, Math.min(caps.length - 1, n)); const cp = caps[i];
    const c = cp.cam ? { x: cp.cam.x, y: cp.cam.y, z: cp.cam.z, rot: cp.cam.rot || 0 } : geral();
    if (cp.cam && !cp.cam.planta) { const off = deltaMundo(c, 0, H * .14, false); c.x += off[0]; c.y += off[1]; }
    de = cam ? { ...cam } : { ...c, z: c.z * .6 }; alvo = c; t0 = performance.now(); noite = !!cp.cam?.noite; planta = !!cp.cam?.planta;
    if (de.rot !== alvo.rot) de.rot = alvo.rot;
    const leg = t.querySelector('.hist-leg'); leg.classList.remove('on'); void leg.offsetWidth; leg.classList.add('on');
    t.querySelector('.hist-txt small').textContent = `Capítulo ${i + 1} de ${caps.length}`;
    t.querySelector('.hist-txt h2').textContent = cp.titulo || ''; t.querySelector('.hist-txt p').textContent = cp.texto || '';
    t.querySelectorAll('.hist-prog i').forEach((x, k) => { x.classList.toggle('on', k === i); x.classList.toggle('feito', k < i); });
    t.querySelector('.esq').disabled = i === 0; t.querySelector('.dir').disabled = i === caps.length - 1 && !proxId;
    t.querySelector('.dir').title = i === caps.length - 1 && proxId ? 'Próximo bairro' : 'Próximo';
    t.classList.toggle('noite', noite);
    falar(); programar();
  }
  function falar() {
    if (!('speechSynthesis' in window)) return; speechSynthesis.cancel(); if (!voz) return;
    const u = new SpeechSynthesisUtterance(`${caps[i].titulo}. ${caps[i].texto}`); u.lang = 'pt-BR'; u.rate = 1;
    const v = speechSynthesis.getVoices().find((x) => x.lang && x.lang.toLowerCase().startsWith('pt')); if (v) u.voice = v;
    u.onend = () => { if (auto && vivo) timer = setTimeout(() => (i < caps.length - 1 ? ir(i + 1) : proxId ? irProximo() : alternarAuto(false)), 1200); };
    speechSynthesis.speak(u);
  }
  function programar() { clearTimeout(timer); if (!auto || voz) return; const ms = 3500 + (caps[i].texto || '').length * 45; timer = setTimeout(() => (i < caps.length - 1 ? ir(i + 1) : proxId ? irProximo() : alternarAuto(false)), ms); }
  function alternarAuto(v = !auto) { auto = v; t.querySelector('[data-h=play]').textContent = auto ? '⏸' : '▶'; t.querySelector('[data-h=play]').classList.toggle('on', auto); if (auto && !voz) programar(); else if (!auto) clearTimeout(timer); if (auto && voz) falar(); }

  function quadro(agora) {
    if (!vivo) return;
    const p = Math.min(1, (agora - t0) / 1400), e = p < .5 ? 4 * p * p * p : 1 - Math.pow(-2 * p + 2, 3) / 2;
    const deriva = Math.max(0, (agora - t0 - 1400) / 1000) * .006; // zoom bem lento enquanto lê
    cam = { x: de.x + (alvo.x - de.x) * e, y: de.y + (alvo.y - de.y) * e, z: (de.z + (alvo.z - de.z) * e) * (1 + Math.min(.12, deriva)), rot: alvo.rot };
    ctx.clearRect(0, 0, W, H);
    if (noite) { const g = ctx.createLinearGradient(0, 0, 0, H); g.addColorStop(0, '#0f1733'); g.addColorStop(1, '#2a3566'); ctx.fillStyle = g; ctx.fillRect(0, 0, W, H); ctx.fillStyle = 'rgba(255,255,255,.7)'; for (let k = 0; k < 90; k++) ctx.fillRect((k * 197.3) % W, (k * 71.9) % (H * .6), 1.6, 1.6); }
    desenhar(ctx, ix, cam, W, H, { noite, planta });
    requestAnimationFrame(quadro);
  }
  t.addEventListener('click', (e) => {
    const h = e.target.closest('[data-h]')?.dataset.h; const pi = e.target.closest('.hist-prog i');
    if (pi) return ir(+pi.dataset.i);
    if (h === 'ant') ir(i - 1); if (h === 'prox') { if (i === caps.length - 1 && proxId) return irProximo(); ir(i + 1); } if (h === 'play') alternarAuto();
    if (h === 'voz') { voz = !voz; e.target.closest('button').textContent = voz ? '🔊' : '🔇'; e.target.closest('button').classList.toggle('on', voz); falar(); if (!voz) programar(); }
    if (h === 'sair') { try { sessionStorage.removeItem('bi:tour'); } catch { /* */ } location.hash = pos >= 0 ? '#/' : '#/m/' + m.id; return; }
    if (h === 'sairVelho') history.length > 1 ? history.back() : (location.hash = '#/m/' + m.id);
  });
  const tecla = (e) => { if (e.key === 'ArrowRight' || e.key === ' ' || e.key === 'PageDown') { e.preventDefault(); if (i === caps.length - 1 && proxId) irProximo(); else ir(i + 1); } if (e.key === 'ArrowLeft' || e.key === 'PageUp') ir(i - 1); if (e.key === 'Escape') location.hash = '#/m/' + m.id; };
  document.addEventListener('keydown', tecla);
  // deslizar o dedo para os lados troca de capítulo
  let x0 = null; t.addEventListener('pointerdown', (e) => { x0 = e.clientX; }); t.addEventListener('pointerup', (e) => { if (x0 != null && Math.abs(e.clientX - x0) > 60) ir(i + (e.clientX < x0 ? 1 : -1)); x0 = null; });
  ir(0); requestAnimationFrame(quadro);
  try { if (pos > 0 && sessionStorage.getItem('bi:tour-auto') === '1') alternarAuto(true); } catch { /* */ }
  void corNota;
  return { sair: () => { vivo = false; clearTimeout(timer); if ('speechSynthesis' in window) speechSynthesis.cancel(); document.removeEventListener('keydown', tecla); removeEventListener('resize', medir); } };
}
