// Bairro Ideal · passeio em 1ª pessoa (estilo "blocos"): andar pelas ruas da maquete como se estivesse lá dentro.
// Computador: clique para olhar com o mouse, WASD ou setas para andar, Shift corre, Espaço pula, V voa.
// Celular/iPad: joystick à esquerda para andar, arraste à direita para olhar.
import * as THREE from '../../vendor/three.module.min.js';
import { el, esc, aviso } from '../ui.js';
import { abrir } from '../dados.js';
import { OBJETOS, CORES_CASA, CORES_ROUPA } from '../pecas.js';
import { indexar, tamanho, K, desenhar, enquadrar } from '../motor.js';

const COR_CHAO = { grama: 0x8fd47a, flores: 0x8fd47a, rua: 0x4f5668, calcada: 0xd9d3c4, praca: 0xeee0c0, ciclovia: 0xcf5b52, areia: 0xf2dc9b, agua: 0x4fbde6, terra: 0xb58757, estrada: 0xa8794c, seco: 0xcbb878, lama: 0x7a6146, esgoto: 0x6b7a3a, aguasuja: 0x76854a };
const PREDIO = [0xa9c7ff, 0xffcfa8, 0xcdeac0, 0xf6d6ff, 0xffe08a, 0xd6d9e0];
const CARRO = [0xef476f, 0x118ab2, 0xffd166, 0x06d6a0, 0xf1f1f1, 0x3a3a3a, 0x8338ec];
const PELE = [0xf1c27d, 0x8d5524, 0xc68642, 0xe0ac69, 0x5c3a21];
const hex = (s) => parseInt(String(s).replace('#', ''), 16);

export async function montar(app, [id]) {
  const m = await abrir(id); if (!m) { location.hash = '#/'; return; }
  const ix = indexar(m);
  app.classList.add('app--cheio');
  const t = el(`<div class="pas">
    <canvas class="pas-3d"></canvas>
    <div class="pas-topo"><button class="redondo" data-p="sair" title="Voltar">‹</button><div class="pas-nome"><b>${esc(m.nome)}</b><small>🚶 Passeio</small></div>
      <div class="pas-acoes"><button class="redondo" data-p="noite" title="Dia / noite">🌙</button><button class="redondo" data-p="voar" title="Voar (V)">🕊️</button></div></div>
    <canvas class="pas-mini" width="180" height="180"></canvas>
    <div class="pas-ajuda"><b>Clique para olhar com o mouse</b><span>W A S D ou setas: andar · Shift: correr · Espaço: pular · V: voar · Esc: soltar o mouse</span></div>
    <div class="pas-joy" aria-hidden="true"><i></i></div>
    <button class="pas-pulo" data-p="pular" aria-label="Pular">⤒</button>
    <div class="pas-mira"></div>
  </div>`);
  app.append(t);
  const cv = t.querySelector('.pas-3d');
  const toque = matchMedia('(pointer: coarse)').matches; t.classList.toggle('toque', toque);

  // ------------------------------------------------ cena
  let renderer;
  try { renderer = new THREE.WebGLRenderer({ canvas: cv, antialias: true }); }
  catch { t.querySelector('.pas-ajuda').innerHTML = '<b>Este aparelho não conseguiu abrir o 3D 😢</b><span>Tente em outro navegador.</span>'; return; }
  renderer.setPixelRatio(Math.min(1.5, devicePixelRatio || 1));
  const poucos = ix.chao.size < 3000; renderer.shadowMap.enabled = poucos; renderer.shadowMap.type = THREE.PCFSoftShadowMap;
  const cena = new THREE.Scene(); const ceuDia = new THREE.Color(0x8fd8ff), ceuNoite = new THREE.Color(0x0f1733);
  cena.background = ceuDia.clone(); cena.fog = new THREE.Fog(ceuDia.clone(), 18, 60);
  const camera = new THREE.PerspectiveCamera(70, 1, 0.05, 200);
  const hemi = new THREE.HemisphereLight(0xffffff, 0x8fbf7a, 1.15); cena.add(hemi);
  const sol = new THREE.DirectionalLight(0xfff4e0, 1.6); sol.position.set(30, 50, 20); cena.add(sol);
  const { x0, y0, x1, y1 } = ix.lim; const cx = (x0 + x1) / 2, cz = (y0 + y1) / 2, raio = Math.max(x1 - x0, y1 - y0);
  if (poucos) { sol.castShadow = true; sol.shadow.mapSize.set(2048, 2048); const c = sol.shadow.camera; c.left = c.bottom = -raio * .8 - 4; c.right = c.top = raio * .8 + 4; c.far = 200; sol.target.position.set(cx, 0, cz); sol.position.set(cx + 20, 40, cz + 14); cena.add(sol.target); }

  // materiais reaproveitados
  const mats = new Map();
  const mat = (cor, extra = {}) => { const k = cor + JSON.stringify(extra); if (!mats.has(k)) mats.set(k, new THREE.MeshLambertMaterial({ color: cor, ...extra })); return mats.get(k); };
  const geoCaixa = new THREE.BoxGeometry(1, 1, 1);
  // textura de janelas para prédios
  const texJanelas = (() => { const c = document.createElement('canvas'); c.width = c.height = 64; const g = c.getContext('2d'); g.fillStyle = '#fff'; g.fillRect(0, 0, 64, 64); g.fillStyle = '#6aa9d8'; g.fillRect(10, 18, 18, 22); g.fillRect(36, 18, 18, 22); const tx = new THREE.CanvasTexture(c); tx.wrapS = tx.wrapT = THREE.RepeatWrapping; tx.magFilter = THREE.NearestFilter; tx.colorSpace = THREE.SRGBColorSpace; return tx; })();
  const janelasMats = []; // trocam de cor à noite
  const luzes = []; // brilhos dos postes

  function caixa(grupo, w, h, d, x, y, z, cor, o = {}) {
    const mm = new THREE.Mesh(geoCaixa, o.mat || mat(cor, o.extra)); mm.scale.set(w, h, d); mm.position.set(x, y + h / 2, z);
    if (poucos && !o.semSombra) { mm.castShadow = true; mm.receiveShadow = true; } grupo.add(mm); return mm;
  }
  function telhado(grupo, w, d, h, y, cor, alongX) {
    const sh = new THREE.Shape(); const a = alongX ? d : w; sh.moveTo(-a / 2 - .05, 0); sh.lineTo(a / 2 + .05, 0); sh.lineTo(0, h); sh.closePath();
    const g = new THREE.ExtrudeGeometry(sh, { depth: (alongX ? w : d) + .1, bevelEnabled: false }); g.translate(0, 0, -((alongX ? w : d) + .1) / 2);
    const mm = new THREE.Mesh(g, mat(cor)); mm.position.y = y; if (alongX) mm.rotation.y = Math.PI / 2; if (poucos) mm.castShadow = true; grupo.add(mm);
  }
  function predioBloco(grupo, w, d, andares, cor) {
    const h = andares * .55 + .1; const tx = texJanelas.clone(); tx.needsUpdate = true; tx.repeat.set(Math.max(1, Math.round(w * 2)), andares);
    const mt = new THREE.MeshLambertMaterial({ color: cor, map: tx }); janelasMats.push(mt);
    const mm = caixa(grupo, w, h, d, 0, 0, 0, cor, { mat: mt }); void mm; caixa(grupo, w + .04, .06, d + .04, 0, h, 0, 0xd6d9e0);
    return h;
  }
  function boneco(grupo, x, z, roupa, pele, e = 1) {
    const g = new THREE.Group(); g.position.set(x, 0, z); g.scale.setScalar(e);
    caixa(g, .07, .18, .07, -.045, 0, 0, 0x3a3f58); caixa(g, .07, .18, .07, .045, 0, 0, 0x3a3f58);
    caixa(g, .2, .2, .11, 0, .18, 0, roupa); caixa(g, .14, .14, .14, 0, .38, 0, pele);
    g.userData.bob = Math.random() * 6; grupo.add(g); pessoas.push(g); return g;
  }
  const pessoas = [], fogos = [];

  // modelo 3D de cada peça (centro da peça em 0,0)
  function modelo(o) {
    const g = new THREE.Group(); const [w, d] = tamanho(o); const p = OBJETOS[o.t]; const c = o.c || 0; const along = ((o.r || 0) % 2 === 0);
    const casa = (alt, cores, porta = true) => { const [pa, te] = cores.map(hex); caixa(g, w - .28, alt, d - .28, 0, 0, 0, pa); telhado(g, w - .2, d - .2, .32, alt, te, along); if (porta) { caixa(g, .16, .3, .02, .08, 0, (d - .28) / 2 + .005, 0x7a4b2a); caixa(g, .16, .14, .02, -.16, .26, (d - .28) / 2 + .005, 0x9bd7f5); } };
    switch (o.t) {
      case 'casa': casa(.55, CORES_CASA[c % CORES_CASA.length]); break;
      case 'sobrado': casa(1.0, CORES_CASA[c % CORES_CASA.length]); caixa(g, .16, .14, .02, .16, .6, (d - .28) / 2 + .005, 0x9bd7f5); break;
      case 'creche': casa(.5, ['#ffe5ec', '#ff8fab']); break;
      case 'igreja': casa(.7, ['#fbf3e4', '#8a5a44']); caixa(g, .22, 1.5, .22, .22, 0, -.15, 0xfbf3e4); caixa(g, .04, .25, .04, .22, 1.5, -.15, 0xc9a227); caixa(g, .16, .04, .04, .22, 1.62, -.15, 0xc9a227); break;
      case 'predinho': predioBloco(g, w - .2, d - .2, 3, PREDIO[c % 6]); break;
      case 'predio': predioBloco(g, w - .2, d - .2, 7, PREDIO[c % 6]); break;
      case 'condominio': predioBloco(g, w - .35, d - .35, 5, PREDIO[c % 6]); break;
      case 'hospital': predioBloco(g, w - .25, d - .25, 4, 0xf8fbff); caixa(g, .5, .04, .5, 0, 2.35, 0, 0xe63946); break;
      case 'escola': { const h = predioBloco(g, w - .2, d - .2, 1.3, 0xffd166); caixa(g, w - .1, .1, d - .1, 0, h, 0, 0xef476f); caixa(g, .02, .7, .02, w / 2 - .25, h, -.2, 0x555555); caixa(g, .25, .14, .01, w / 2 - .12, h + .55, -.2, 0x06d6a0); break; }
      case 'posto': { const h = predioBloco(g, w - .24, d - .24, 1.2, 0xffffff); caixa(g, w - .2, .06, d - .2, 0, h, 0, 0xe63946); caixa(g, .3, .08, .09, 0, h + .06, 0, 0xe63946); caixa(g, .09, .08, .3, 0, h + .06, 0, 0xe63946); break; }
      case 'policia': { const h = predioBloco(g, w - .24, d - .24, 1.1, 0xdbe7ff); caixa(g, w - .2, .1, d - .2, 0, h, 0, 0x1d3557); break; }
      case 'bombeiros': { const h = predioBloco(g, w - .2, d - .2, 1.3, 0xe63946); caixa(g, .5, .4, .02, 0, 0, (d - .2) / 2 + .01, 0xf1f1f1); void h; break; }
      case 'loja': { const h = predioBloco(g, w - .28, d - .28, 1.1, 0xfdf6ec); caixa(g, w - .24, .05, .2, 0, .38, (d - .28) / 2 + .08, hex(['#e63946', '#2a9d8f', '#f4a261', '#457b9d', '#8338ec'][c % 5])); void h; break; }
      case 'mercado': { const h = predioBloco(g, w - .2, d - .2, 1.3, 0xf8f4ee); caixa(g, w - .14, .15, d - .14, 0, h, 0, 0x2a9d8f); break; }
      case 'estacao': caixa(g, .7, .5, .5, -.45, 0, -.55, 0xe9edf2); [[.25, .1], [-.4, .35], [.4, .4]].forEach(([a, b]) => { const cil = new THREE.Mesh(new THREE.CylinderGeometry(.32, .32, .45, 20), mat(0x4ea8de)); cil.position.set(a, .225, b); g.add(cil); }); break;
      case 'caixa': caixa(g, .08, .7, .08, 0, 0, 0, 0x7b8794); { const cil = new THREE.Mesh(new THREE.CylinderGeometry(.28, .28, .3, 16), mat(0x4ea8de)); cil.position.y = .85; g.add(cil); } break;
      case 'coleta': [0x2a9d8f, 0xe9c46a, 0xe76f51, 0x457b9d].forEach((cor, i) => caixa(g, .15, .28, .2, -.27 + i * .18, 0, 0, cor)); break;
      case 'ponto': caixa(g, .6, .5, .04, 0, 0, .1, 0xcfe8ff, { extra: { transparent: true, opacity: .6 } }); caixa(g, .7, .04, .32, 0, .5, 0, 0x457b9d); caixa(g, .5, .1, .1, 0, .15, 0, 0x8d6e63); break;
      case 'poste': { caixa(g, .04, 1.05, .04, 0, 0, 0, 0x4a4f5c); const l = new THREE.Mesh(new THREE.SphereGeometry(.07, 10, 8), new THREE.MeshBasicMaterial({ color: 0xffe27a })); l.position.y = 1.08; g.add(l); luzes.push(l); break; }
      case 'arvore': case 'ipe-rosa': case 'ipe-amarelo': { const cor = { arvore: 0x3fa34d, 'ipe-rosa': 0xff8fab, 'ipe-amarelo': 0xffd23f }[o.t]; const e = 1 + (c % 3) * .12; caixa(g, .1, .45 * e, .1, 0, 0, 0, 0x8b5a2b); caixa(g, .55 * e, .45 * e, .55 * e, 0, .4 * e, 0, cor); caixa(g, .3 * e, .25 * e, .3 * e, 0, .82 * e, 0, cor); break; }
      case 'pinheiro': caixa(g, .1, .3, .1, 0, 0, 0, 0x7a4b2a); [[.6, .25], [.44, .5], [.28, .75], [.14, .95]].forEach(([s, y]) => caixa(g, s, .25, s, 0, y, 0, 0x2e8b57)); break;
      case 'palmeira': caixa(g, .08, 1.0, .08, 0, 0, 0, 0x9c6b3c); for (let i = 0; i < 4; i++) { const f = caixa(g, .55, .03, .12, 0, 1, 0, 0x2d9c4a); f.rotation.y = i * Math.PI / 4; f.rotation.z = -.25; } break;
      case 'arbusto': caixa(g, .35, .25, .35, -.1, 0, 0, 0x4caf50); caixa(g, .3, .22, .3, .15, 0, .1, 0x43a047); break;
      case 'horta': caixa(g, .8, .08, .8, 0, 0, 0, 0x7a5230); for (let i = 0; i < 3; i++) for (let j = 0; j < 3; j++) caixa(g, .1, .1, .1, -.25 + i * .25, .08, -.25 + j * .25, j === 1 ? 0xe63946 : 0x5cb85c); break;
      case 'pedra': caixa(g, .25, .15, .2, -.08, 0, 0, 0xa0a4a8); caixa(g, .16, .1, .16, .14, 0, .1, 0xb8bcc0); break;
      case 'banco': caixa(g, .56, .06, .18, 0, .14, 0, 0xc47a3a); caixa(g, .56, .14, .04, 0, .2, -.08, 0xa5612a); caixa(g, .04, .14, .14, -.24, 0, 0, 0x555555); caixa(g, .04, .14, .14, .24, 0, 0, 0x555555); break;
      case 'parquinho': [-.3, .3].forEach((x) => { caixa(g, .04, .7, .04, x, 0, -.12, 0xe63946); caixa(g, .04, .7, .04, x, 0, .12, 0xe63946); }); caixa(g, .64, .04, .04, 0, .7, 0, 0xe63946); caixa(g, .16, .03, .1, 0, .22, 0, 0xffb703); break;
      case 'escorregador': caixa(g, .25, .55, .25, -.2, 0, 0, 0xffb703); { const r = caixa(g, .6, .04, .2, .15, .27, 0, 0x219ebc); r.rotation.z = -.7; } break;
      case 'fonte': { const b = new THREE.Mesh(new THREE.CylinderGeometry(.4, .42, .15, 20), mat(0xcfd4da)); b.position.y = .075; g.add(b); const a = new THREE.Mesh(new THREE.CylinderGeometry(.34, .34, .02, 20), mat(0x7fd3f2)); a.position.y = .15; g.add(a); caixa(g, .08, .45, .08, 0, 0, 0, 0xcfd4da); break; }
      case 'mesa': caixa(g, .5, .04, .4, 0, .25, 0, 0xb07040); caixa(g, .08, .25, .08, 0, 0, 0, 0x8a5a30); caixa(g, .5, .04, .1, 0, .14, -.3, 0xb07040); caixa(g, .5, .04, .1, 0, .14, .3, 0xb07040); break;
      case 'quadra': caixa(g, w - .2, .02, d - .2, 0, 0, 0, 0x3a86ff, { semSombra: true }); caixa(g, .04, .7, .04, -(w / 2) + .25, 0, 0, 0xeeeeee); caixa(g, .04, .7, .04, w / 2 - .25, 0, 0, 0xeeeeee); caixa(g, .02, .021, d - .3, 0, 0, 0, 0xffffff); break;
      case 'campo': caixa(g, w - .2, .02, d - .2, 0, 0, 0, 0x4caf50, { semSombra: true }); caixa(g, .03, .021, d - .3, 0, 0, 0, 0xffffff); [-(w / 2) + .2, w / 2 - .2].forEach((x) => { caixa(g, .04, .4, .04, x, 0, -.35, 0xffffff); caixa(g, .04, .4, .04, x, 0, .35, 0xffffff); caixa(g, .04, .04, .74, x, .4, 0, 0xffffff); }); break;
      case 'pessoa': boneco(g, 0, 0, hex(CORES_ROUPA[c % 8]), PELE[c % 5]); break;
      case 'familia': boneco(g, -.15, -.05, hex(CORES_ROUPA[c % 8]), PELE[c % 5]); boneco(g, .15, -.1, hex(CORES_ROUPA[(c + 3) % 8]), PELE[(c + 1) % 5]); boneco(g, 0, .18, hex(CORES_ROUPA[(c + 5) % 8]), PELE[c % 5], .65); break;
      case 'crianca': boneco(g, -.15, 0, hex(CORES_ROUPA[(c + 1) % 8]), PELE[(c + 2) % 5], .65); boneco(g, .15, 0, hex(CORES_ROUPA[(c + 4) % 8]), PELE[c % 5], .65); break;
      case 'bicicleta': caixa(g, .5, .04, .03, 0, .2, 0, 0xe63946); boneco(g, 0, 0, 0x06d6a0, 0xc68642, .8).position.y = .12; break;
      case 'cachorro': caixa(g, .28, .12, .1, 0, .08, 0, 0xc68642); caixa(g, .1, .1, .1, .17, .16, 0, 0xa0522d); break;
      case 'gato': caixa(g, .2, .09, .08, 0, .06, 0, 0x6c757d); caixa(g, .09, .09, .09, .13, .12, 0, 0x6c757d); break;
      case 'pato': [[-.15, -.1], [.15, .15]].forEach(([x, z]) => { caixa(g, .16, .08, .1, x, -.06, z, 0xffffff); caixa(g, .07, .07, .07, x + .08, .02, z, 0xffffff); }); break;
      case 'carro': case 'abandonado': case 'onibus': case 'caminhao': {
        const comp = o.t === 'onibus' ? .9 : .66, larg = o.t === 'onibus' ? .38 : .34, alt = o.t === 'onibus' ? .42 : .18;
        const cor = o.t === 'carro' ? CARRO[c % CARRO.length] : o.t === 'onibus' ? 0xffb703 : o.t === 'caminhao' ? 0x2a9d8f : 0x8d7b68;
        const corpo = new THREE.Group(); caixa(corpo, comp, alt, larg, 0, .06, 0, cor); if (o.t !== 'onibus') caixa(corpo, comp * .5, .14, larg * .9, -.04, .06 + alt, 0, o.t === 'abandonado' ? 0x5c5c5c : 0xd8f1ff);
        [[-1, -1], [-1, 1], [1, -1], [1, 1]].forEach(([a, b]) => caixa(corpo, .12, .12, .05, a * comp * .32, 0, b * larg * .5, 0x222222));
        corpo.rotation.y = along ? 0 : Math.PI / 2; g.add(corpo); break;
      }
      case 'barraco': { const cor = hex(['#b08968', '#a3b18a', '#c9a27e', '#8d99ae', '#b5838d', '#9c6644'][c % 6]); caixa(g, .66, .48, .66, 0, 0, 0, cor); caixa(g, .16, .3, .02, .1, 0, .34, 0x3b2f2a); const tt = caixa(g, .82, .03, .82, 0, .5, 0, 0x9aa3a8); tt.rotation.z = .12; caixa(g, .2, .031, .82, .1, .52, 0, 0xb4542f).rotation.z = .12; break; }
      case 'ruina': caixa(g, .7, .3, .06, 0, 0, .33, 0xc9b8a3); caixa(g, .06, .45, .7, .33, 0, 0, 0xa8977f); caixa(g, .3, .55, .06, -.2, 0, .33, 0xc9b8a3); [[0, 0], [-.1, -.2], [.15, -.1]].forEach(([x, z]) => caixa(g, .14, .08, .1, x, 0, z, 0x9b8a75)); break;
      case 'lixo': [[0x3a3a3a, -.12, 0, .16], [0x2d6a4f, .1, .08, .14], [0xe9c46a, 0, -.12, .1], [0xd9d9d9, .15, -.1, .08], [0xe76f51, -.15, .14, .08]].forEach(([cor, x, z, s]) => caixa(g, s, s, s, x, 0, z, cor)); break;
      case 'entulho': [[.3, -.1, 0xa8a29e], [.2, .15, 0xc2b8a3], [.25, .05, 0x8d8478]].forEach(([s, x, cor], i) => caixa(g, s, s * .6, s * .7, x, 0, (i - 1) * .15, cor)); break;
      case 'pneu': [[-.12, 0], [.12, .05]].forEach(([x, z]) => { const p2 = new THREE.Mesh(new THREE.TorusGeometry(.12, .05, 8, 16), mat(0x222222)); p2.rotation.x = Math.PI / 2; p2.position.set(x, .05, z); g.add(p2); }); break;
      case 'arvoreseca': caixa(g, .08, .8, .08, 0, 0, 0, 0x6b4f36); { const a = caixa(g, .05, .4, .05, -.12, .45, 0, 0x6b4f36); a.rotation.z = .7; const b = caixa(g, .05, .35, .05, .12, .55, 0, 0x6b4f36); b.rotation.z = -.7; } break;
      case 'fogo': { const f = new THREE.Mesh(new THREE.ConeGeometry(.16, .45, 8), new THREE.MeshBasicMaterial({ color: 0xff7b00 })); f.position.y = .22; g.add(f); fogos.push(f); caixa(g, .3, .06, .3, 0, 0, 0, 0x3b2f2a); break; }
      case 'postequebrado': { const p2 = caixa(g, .04, .8, .04, 0, 0, 0, 0x4a4f5c); p2.rotation.z = .35; break; }
      case 'fiacao': caixa(g, .05, 1.1, .05, -.2, 0, 0, 0x6b4f36); for (let i = 0; i < 4; i++) { const f = caixa(g, .7, .01, .01, .15, .9 - i * .07, -.2 + i * .12, 0x222222); f.rotation.z = -.4; } break;
      case 'rato': [[-.1, 0], [.12, .1]].forEach(([x, z]) => caixa(g, .1, .05, .05, x, 0, z, 0x6d6875)); break;
      case 'buraco': { const b = new THREE.Mesh(new THREE.CircleGeometry(.3, 16), mat(0x2f2f35)); b.rotation.x = -Math.PI / 2; b.position.y = .012; g.add(b); break; }
      default: caixa(g, .4, .4, .4, 0, 0, 0, 0x999999);
    }
    g.position.set(o.x + w / 2, 0, o.y + d / 2);
    void p; return g;
  }

  // chão: uma InstancedMesh por tipo
  const porTipo = new Map(); for (const [k, tp] of ix.chao) { if (!porTipo.has(tp)) porTipo.set(tp, []); porTipo.get(tp).push(k); }
  const mtx = new THREE.Matrix4();
  for (const [tp, ks] of porTipo) {
    const agua = tp === 'agua' || tp === 'aguasuja';
    const mm = new THREE.InstancedMesh(geoCaixa, mat(COR_CHAO[tp] || 0x8fd47a, agua ? { transparent: true, opacity: .9 } : {}), ks.length);
    ks.forEach((k, i) => { const x = Math.floor(k / 100000) - 50000, y = (k % 100000) - 50000; mtx.makeScale(1, agua ? .25 : .3, 1); mtx.setPosition(x + .5, agua ? -.2 : -.15, y + .5); mm.setMatrixAt(i, mtx); });
    if (poucos) mm.receiveShadow = true; cena.add(mm);
    if (tp === 'agua' || tp === 'aguasuja') { const fundo = new THREE.InstancedMesh(geoCaixa, mat(0x8a6a4a), ks.length); ks.forEach((k, i) => { const x = Math.floor(k / 100000) - 50000, y = (k % 100000) - 50000; mtx.makeScale(1, .3, 1); mtx.setPosition(x + .5, -.5, y + .5); fundo.setMatrixAt(i, mtx); }); cena.add(fundo); }
  }
  // faixas das ruas e flores
  const faixas = [], flores = [];
  for (const [k, tp] of ix.chao) {
    const x = Math.floor(k / 100000) - 50000, y = (k % 100000) - 50000;
    if (tp === 'rua') { const h = ix.chao.get(K(x - 1, y)) === 'rua' || ix.chao.get(K(x + 1, y)) === 'rua', v = ix.chao.get(K(x, y - 1)) === 'rua' || ix.chao.get(K(x, y + 1)) === 'rua'; if (h !== v || (!h && !v)) faixas.push([x + .5, y + .5, v && !h]); }
    if (tp === 'flores') for (let i = 0; i < 5; i++) flores.push([x + .15 + ((i * 37 + x * 13) % 70) / 100, y + .15 + ((i * 53 + y * 7) % 70) / 100, [0xff6fa5, 0xffd23f, 0xffffff, 0xff8a4c, 0xc77dff][i]]);
  }
  if (faixas.length) { const mm = new THREE.InstancedMesh(geoCaixa, mat(0xf4e6a1), faixas.length); faixas.forEach(([x, z, v], i) => { mtx.makeScale(v ? .05 : .35, .01, v ? .35 : .05); mtx.setPosition(x, .005, z); mm.setMatrixAt(i, mtx); }); cena.add(mm); }
  if (flores.length) { const mm = new THREE.InstancedMesh(geoCaixa, new THREE.MeshLambertMaterial(), flores.length); flores.forEach(([x, z, cor], i) => { mtx.makeScale(.07, .07, .07); mtx.setPosition(x, .04, z); mm.setMatrixAt(i, mtx); mm.setColorAt(i, new THREE.Color(cor)); }); cena.add(mm); }
  // peças
  for (const o of m.objs || []) if (OBJETOS[o.t]) cena.add(modelo(o));
  // nuvens de blocos
  const nuvens = new THREE.Group(); for (let i = 0; i < 14; i++) { const n = new THREE.Group(); for (let j = 0; j < 4; j++) caixa(n, 2 + Math.random() * 2, .5, 1.4 + Math.random(), j * 1.3, 0, (j % 2) * .6, 0xffffff, { semSombra: true, extra: { transparent: true, opacity: .92 } }); n.position.set(cx + (Math.random() - .5) * raio * 3, 9 + Math.random() * 3, cz + (Math.random() - .5) * raio * 3); nuvens.add(n); } cena.add(nuvens);

  // ------------------------------------------------ jogador
  const livre = (x, y) => { const k = K(Math.floor(x), Math.floor(y)); const ch = ix.chao.get(k); if (!ch || ch === 'agua' || ch === 'aguasuja') return false; const o = ix.ocup.get(k); return !(o && OBJETOS[o.t].solido); };
  let inicio = null; let melhor = Infinity;
  for (const [k, tp] of ix.chao) { const x = Math.floor(k / 100000) - 50000, y = (k % 100000) - 50000; if (!livre(x + .5, y + .5)) continue; const d = Math.hypot(x - cx, y - cz) - (tp === 'rua' || tp === 'calcada' ? 3 : 0); if (d < melhor) { melhor = d; inicio = [x + .5, y + .5]; } }
  // prefere começar no meio de uma rua, olhando ao longo dela
  let giro0 = null; melhor = Infinity;
  for (const [k, tp] of ix.chao) {
    if (tp !== 'rua' && tp !== 'estrada') continue; const x = Math.floor(k / 100000) - 50000, y = (k % 100000) - 50000; if (!livre(x + .5, y + .5)) continue;
    const h = ix.chao.get(K(x + 1, y)) === tp && ix.chao.get(K(x - 1, y)) === tp, v = ix.chao.get(K(x, y + 1)) === tp && ix.chao.get(K(x, y - 1)) === tp; if (h === v) continue;
    const d = Math.hypot(x + .5 - cx, y + .5 - cz); if (d < melhor) { melhor = d; inicio = [x + .5, y + .5]; giro0 = h ? (x + .5 < cx ? -Math.PI / 2 : Math.PI / 2) : (y + .5 < cz ? Math.PI : 0); }
  }
  if (!inicio) inicio = [cx, cz];
  const eu = { x: inicio[0], z: inicio[1], y: 0, vy: 0, giro: giro0 ?? (Math.atan2(-(cx - inicio[0]), -(cz - inicio[1])) || 0), olhar: -0.08, voar: false };
  const OLHO = .38, teclas = new Set(); let joy = { x: 0, y: 0 };

  // ------------------------------------------------ controles
  const ajuda = t.querySelector('.pas-ajuda');
  cv.addEventListener('click', () => { if (!toque && document.pointerLockElement !== cv) cv.requestPointerLock?.(); });
  const mudouTrava = () => { ajuda.classList.toggle('esconde', document.pointerLockElement === cv); };
  document.addEventListener('pointerlockchange', mudouTrava);
  const mouse = (e) => { if (document.pointerLockElement !== cv) return; eu.giro -= e.movementX * .0025; eu.olhar = Math.max(-1.4, Math.min(1.4, eu.olhar - e.movementY * .0025)); };
  document.addEventListener('mousemove', mouse);
  const td = (e) => { const k = e.key.toLowerCase(); if (e.target.closest && e.target.closest('input,textarea')) return; teclas.add(k); if (k === ' ') { e.preventDefault(); pular(); } if (k === 'v') alternarVoo(); if (k.startsWith('arrow')) e.preventDefault(); };
  const tu = (e) => teclas.delete(e.key.toLowerCase());
  document.addEventListener('keydown', td); document.addEventListener('keyup', tu);
  function pular() { if (eu.voar) return; if (eu.y <= .001) eu.vy = 3.2; }
  function alternarVoo() { eu.voar = !eu.voar; t.querySelector('[data-p=voar]').classList.toggle('on', eu.voar); if (eu.voar) { eu.y = Math.max(eu.y, 2.5); aviso('🕊️ Voando! W/S andam, Espaço sobe, Shift desce. V para pousar.', 'ok', 3000); } }
  // toque: joystick à esquerda e olhar à direita
  const joyEl = t.querySelector('.pas-joy'), bola = joyEl.querySelector('i'); let joyId = null, olharId = null, ultimo = null, joyCentro = null;
  cv.addEventListener('pointerdown', (e) => {
    if (!toque && e.pointerType === 'mouse') { ultimo = [e.clientX, e.clientY]; olharId = e.pointerId; return; }
    if (e.clientX < innerWidth * .45 && joyId == null) { joyId = e.pointerId; joyCentro = [e.clientX, e.clientY]; joyEl.style.left = e.clientX + 'px'; joyEl.style.top = e.clientY + 'px'; joyEl.classList.add('on'); }
    else if (olharId == null) { olharId = e.pointerId; ultimo = [e.clientX, e.clientY]; }
  });
  cv.addEventListener('pointermove', (e) => {
    if (e.pointerId === joyId) { const dx = e.clientX - joyCentro[0], dy = e.clientY - joyCentro[1], dd = Math.min(50, Math.hypot(dx, dy)), a = Math.atan2(dy, dx); joy = { x: Math.cos(a) * dd / 50, y: Math.sin(a) * dd / 50 }; bola.style.transform = `translate(${Math.cos(a) * dd}px, ${Math.sin(a) * dd}px)`; }
    if (e.pointerId === olharId && ultimo && document.pointerLockElement !== cv) { eu.giro -= (e.clientX - ultimo[0]) * .005; eu.olhar = Math.max(-1.4, Math.min(1.4, eu.olhar - (e.clientY - ultimo[1]) * .005)); ultimo = [e.clientX, e.clientY]; }
  });
  const fim = (e) => { if (e.pointerId === joyId) { joyId = null; joy = { x: 0, y: 0 }; bola.style.transform = ''; joyEl.classList.remove('on'); } if (e.pointerId === olharId) { olharId = null; ultimo = null; } };
  cv.addEventListener('pointerup', fim); cv.addEventListener('pointercancel', fim);
  let noite = false;
  t.addEventListener('click', (e) => {
    const a = e.target.closest('[data-p]')?.dataset.p; if (!a) return;
    if (a === 'sair') { history.length > 1 ? history.back() : (location.hash = '#/m/' + m.id); }
    if (a === 'voar') alternarVoo(); if (a === 'pular') { if (eu.voar) eu.y += .8; else pular(); }
    if (a === 'noite') { noite = !noite; e.target.closest('button').textContent = noite ? '☀️' : '🌙'; trocarNoite(); }
  });
  function trocarNoite() {
    const c = noite ? ceuNoite : ceuDia; cena.background.copy(c); cena.fog.color.copy(c);
    hemi.intensity = noite ? .35 : 1.15; sol.intensity = noite ? .15 : 1.6; janelasMats.forEach((mt) => { mt.emissive = new THREE.Color(noite ? 0x4a3a10 : 0x000000); });
    luzes.forEach((l) => { l.material.color.set(noite ? 0xfff3b0 : 0xffe27a); l.scale.setScalar(noite ? 1.8 : 1); });
    luzesNoite.forEach((l) => { l.visible = noite; });
  }
  // algumas luzes de verdade perto dos postes (só as mais perto do centro, para não pesar)
  const luzesNoite = luzes.slice().sort((a, b) => a.parent.position.distanceTo(new THREE.Vector3(cx, 0, cz)) - b.parent.position.distanceTo(new THREE.Vector3(cx, 0, cz))).slice(0, 12).map((l) => { const p = new THREE.PointLight(0xffd27a, 2.2, 4, 1.4); p.position.copy(l.parent.position); p.position.y = 1; p.visible = false; cena.add(p); return p; });

  // ------------------------------------------------ minimapa
  const mini = t.querySelector('.pas-mini'), mctx = mini.getContext('2d');
  const fundoMini = document.createElement('canvas'); fundoMini.width = fundoMini.height = 180;
  const camMini = enquadrar(ix, 180, 180, 0, true, .92); desenhar(fundoMini.getContext('2d'), ix, camMini, 180, 180, { planta: true });
  const TPm = 36 * camMini.z;
  function desenharMini() {
    mctx.clearRect(0, 0, 180, 180); mctx.drawImage(fundoMini, 0, 0);
    const px = 90 + (eu.x - camMini.x) * TPm, py = 90 + (eu.z - camMini.y) * TPm;
    mctx.save(); mctx.translate(px, py); mctx.rotate(-eu.giro + Math.PI); mctx.fillStyle = '#ff7a59'; mctx.strokeStyle = '#fff'; mctx.lineWidth = 2;
    mctx.beginPath(); mctx.moveTo(0, -9); mctx.lineTo(6, 6); mctx.lineTo(0, 3); mctx.lineTo(-6, 6); mctx.closePath(); mctx.fill(); mctx.stroke(); mctx.restore();
  }

  // ------------------------------------------------ laço
  function medir() { const w = innerWidth, h = innerHeight; renderer.setSize(w, h, false); camera.aspect = w / h; camera.updateProjectionMatrix(); }
  medir(); addEventListener('resize', medir);
  let vivo = true, antes = performance.now(), tMini = 0;
  function quadro(agora) {
    if (!vivo) return; const dt = Math.min(.05, (agora - antes) / 1000); antes = agora;
    let f = 0, l = 0;
    if (teclas.has('w') || teclas.has('arrowup')) f += 1; if (teclas.has('s') || teclas.has('arrowdown')) f -= 1;
    if (teclas.has('a')) l -= 1; if (teclas.has('d')) l += 1;
    if (teclas.has('arrowleft')) eu.giro += 2 * dt; if (teclas.has('arrowright')) eu.giro -= 2 * dt;
    f -= joy.y; l += joy.x;
    const vel = (teclas.has('shift') && !eu.voar ? 4.4 : eu.voar ? 5 : 2.3) * dt;
    const sx = -Math.sin(eu.giro), sz = -Math.cos(eu.giro);
    let nx = eu.x + (sx * f - sz * l) * vel, nz = eu.z + (sz * f + sx * l) * vel;
    if (eu.voar) { eu.x = nx; eu.z = nz; if (teclas.has(' ')) eu.y += 3 * dt; if (teclas.has('shift')) eu.y = Math.max(0, eu.y - 3 * dt); }
    else {
      const folga = .15; const ok = (x, z) => livre(x + folga, z + folga) && livre(x - folga, z - folga) && livre(x + folga, z - folga) && livre(x - folga, z + folga);
      if (ok(nx, eu.z)) eu.x = nx; if (ok(eu.x, nz)) eu.z = nz;
      eu.vy -= 9 * dt; eu.y = Math.max(0, eu.y + eu.vy * dt); if (eu.y === 0) eu.vy = 0;
    }
    camera.position.set(eu.x, eu.y + OLHO + (f || l ? Math.sin(agora / 110) * .012 : 0), eu.z);
    camera.rotation.set(0, 0, 0, 'YXZ'); camera.rotation.order = 'YXZ'; camera.rotation.y = eu.giro; camera.rotation.x = eu.olhar;
    pessoas.forEach((p) => { p.position.y = Math.abs(Math.sin(agora / 300 + p.userData.bob)) * .03; });
    fogos.forEach((x, i) => { x.scale.set(1 + Math.sin(agora / 80 + i) * .15, 1 + Math.cos(agora / 70 + i) * .2, 1 + Math.sin(agora / 90 + i) * .15); });
    nuvens.position.x = Math.sin(agora / 20000) * 6;
    renderer.render(cena, camera);
    if (agora - tMini > 100) { desenharMini(); tMini = agora; }
    requestAnimationFrame(quadro);
  }
  requestAnimationFrame(quadro);
  if (toque) ajuda.innerHTML = '<b>Use o dedo para passear</b><span>Lado esquerdo: andar · lado direito: olhar em volta</span>';
  setTimeout(() => ajuda.classList.add('some'), toque ? 5000 : 9000);
  return {
    sair: () => {
      vivo = false; document.removeEventListener('keydown', td); document.removeEventListener('keyup', tu); document.removeEventListener('pointerlockchange', mudouTrava); document.removeEventListener('mousemove', mouse);
      removeEventListener('resize', medir); if (document.pointerLockElement) document.exitPointerLock(); renderer.dispose();
    },
  };
}
