// Bairro Ideal · pedaços usados em várias telas (topo, foto da maquete, nova maquete)
import { el, esc, janela, aviso } from '../ui.js';
import { estado, sair, salvar } from '../dados.js';
import { indexar, desenhar, enquadrar } from '../motor.js';
import { analisar } from '../termometro.js';
import { MODELOS } from '../modelos.js';

export const TIPOS = { ideal: ['🌳', 'Bairro ideal', 'chip--ideal'], carente: ['🏚️', 'Bairro carente', 'chip--carente'], livre: ['✏️', 'Livre', 'chip--livre'] };
export const chipTipo = (t) => { const [e, n, c] = TIPOS[t] || TIPOS.livre; return `<span class="chip ${c}">${e} ${n}</span>`; };
export const corNota = (n) => n == null ? 'var(--apagado)' : n >= 7 ? '#2f9e44' : n >= 4.5 ? '#e8a400' : '#e5484d';
export const notaTxt = (n) => n == null ? '–' : n.toLocaleString('pt-BR', { minimumFractionDigits: 1, maximumFractionDigits: 1 });

export function topo({ voltar = false, titulo = '' } = {}) {
  const u = estado.usuario;
  const t = el(`<header class="topo">
    ${voltar ? '<a class="redondo" href="#/" aria-label="Voltar">‹</a>' : ''}
    <a class="logo" href="#/"><img src="/img/icone.svg" alt="">${titulo ? esc(titulo) : 'Bairro Ideal'}</a>
    <div class="topo-dir">
      <span class="nuvem-st ${estado.nuvem && estado.sessao ? '' : 'off'}"><i></i>${estado.nuvem && estado.sessao ? 'Salvando na nuvem' : 'Salvo neste aparelho'}</span>
      ${u ? `<button class="avatar" title="${esc(u.nome)}">${esc((u.nome || u.email).split(' ').map((p) => p[0]).slice(0, 2).join('').toUpperCase())}</button>` : ''}
    </div></header>`);
  const av = t.querySelector('.avatar');
  if (av) av.onclick = async () => {
    const r = await janela({ titulo: esc(u.nome), corpo: `<p>${esc(u.email)}<br>${u.papel === 'admin' ? '⭐ Administrador(a): pode convidar pessoas.' : 'Conta convidada.'}</p>`, botoes: [
      ...(u.papel === 'admin' ? [{ texto: '👥 Pessoas', valor: 'pessoas' }] : []), { texto: '🔒 Privacidade', valor: 'priv' }, { texto: 'Sair da conta', classe: 'bt--perigo', valor: 'sair' }] });
    if (r === 'pessoas') location.hash = '#/pessoas'; if (r === 'priv') location.hash = '#/privacidade';
    if (r === 'sair') { await sair(); aviso('Até logo! 👋'); location.hash = '#/entrar'; }
  };
  return t;
}

// foto pequena da maquete (vai para a lista e para a nuvem)
export function fotografar(m, w = 400, h = 250) {
  const cv = document.createElement('canvas'); cv.width = w; cv.height = h; const ctx = cv.getContext('2d');
  const g = ctx.createLinearGradient(0, 0, 0, h); g.addColorStop(0, '#dff4ff'); g.addColorStop(1, '#fbf6ec'); ctx.fillStyle = g; ctx.fillRect(0, 0, w, h);
  const ix = indexar(m); if (ix.chao.size) desenhar(ctx, ix, enquadrar(ix, w, h, 0, false, .9), w, h, {});
  try { return cv.toDataURL('image/jpeg', .78); } catch { return ''; }
}
export function prepararParaSalvar(m) { const a = analisar(m); m.nota = a.nota; m.thumb = fotografar(m); return m; }

export async function novaMaquete(modeloInicial = 'ideal') {
  const corpo = el(`<div style="display:grid;gap:14px">
    <label class="campo">Nome da maquete<input name="nome" maxlength="60" placeholder="Ex.: Vila Esperança"></label>
    <div><div class="campo" style="margin-bottom:8px">Começar com…</div><div class="modelos">${MODELOS.map((x) => `<button class="modelo" data-m="${x.id}"><span class="em">${x.emoji}</span><span><b>${x.nome}</b><small>${x.desc}</small></span></button>`).join('')}</div></div></div>`);
  let escolhido = modeloInicial;
  const marcar = () => corpo.querySelectorAll('.modelo').forEach((b) => { const on = b.dataset.m === escolhido; b.style.borderColor = on ? 'var(--verde)' : ''; b.style.boxShadow = on ? '0 0 0 3px rgba(31,111,80,.2)' : ''; });
  corpo.addEventListener('click', (e) => { const b = e.target.closest('.modelo'); if (b) { escolhido = b.dataset.m; marcar(); } }); marcar();
  const r = await janela({ titulo: '✨ Nova maquete', corpo, classe: 'janela--larga', botoes: [{ texto: 'Cancelar', valor: null }, { texto: 'Criar maquete', classe: 'bt--sol bt--gde', valor: () => ({ nome: corpo.querySelector('[name=nome]').value.trim(), modelo: escolhido }) }],
    aoAbrir: (f) => setTimeout(() => f.querySelector('[name=nome]').focus(), 80) });
  if (!r) return null;
  const mod = MODELOS.find((x) => x.id === r.modelo) || MODELOS[0]; const m = mod.criar();
  if (r.nome) m.nome = r.nome;
  await salvar(prepararParaSalvar(m)); return m;
}
