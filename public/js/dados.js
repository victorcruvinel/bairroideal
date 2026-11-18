// Bairro Ideal · onde as maquetes ficam guardadas.
// Sempre no aparelho (IndexedDB, funciona sem internet). Com a planilha ligada e a pessoa logada,
// também vão para a nuvem (Apps Script), comprimidas. O que não subiu fica "pendente" e sobe depois.
import { novoId } from './modelos.js';

const CHAVE_SESSAO = 'bi:sessao';
export const estado = { nuvem: false, versao: 'dev', usuario: null, sessao: null, online: navigator.onLine, visitante: false, editorLocal: false };
const lembrar = (k, v) => { try { if (v) sessionStorage.setItem(k, '1'); else sessionStorage.removeItem(k); } catch { /* */ } };
const lembrado = (k) => { try { return sessionStorage.getItem(k) === '1'; } catch { return false; } };
const ouvintes = new Set();
export const aoMudar = (fn) => { ouvintes.add(fn); return () => ouvintes.delete(fn); };
const avisar = (ev) => ouvintes.forEach((f) => { try { f(ev); } catch { /* */ } });

// ---------------- IndexedDB
let banco;
function abrirBanco() {
  if (banco) return banco;
  banco = new Promise((ok, erro) => {
    const r = indexedDB.open('bairroideal', 1);
    r.onupgradeneeded = () => { const s = r.result.createObjectStore('maquetes', { keyPath: 'id' }); s.createIndex('conta', 'conta'); };
    r.onsuccess = () => ok(r.result); r.onerror = () => erro(r.error);
  });
  return banco;
}
async function loja(modo) { const db = await abrirBanco(); return db.transaction('maquetes', modo).objectStore('maquetes'); }
const pedir = (r) => new Promise((ok, erro) => { r.onsuccess = () => ok(r.result); r.onerror = () => erro(r.error); });
const conta = () => (estado.usuario ? estado.usuario.email : 'local');

async function localTodas() { const s = await loja('readonly'); return (await pedir(s.getAll())).filter((m) => m.conta === conta() || (m.conta === 'local' && !estado.usuario)); }
async function localUma(id) { const s = await loja('readonly'); return pedir(s.get(id)); }
async function localPor(m) { const s = await loja('readwrite'); return pedir(s.put(m)); }
async function localTira(id) { const s = await loja('readwrite'); return pedir(s.delete(id)); }

// ---------------- compressão (gzip + base64)
export async function comprimir(txt) {
  if (typeof CompressionStream === 'undefined') return 'j:' + txt;
  const s = new Blob([txt]).stream().pipeThrough(new CompressionStream('gzip'));
  const buf = new Uint8Array(await new Response(s).arrayBuffer()); let bin = '';
  for (let i = 0; i < buf.length; i += 0x8000) bin += String.fromCharCode.apply(null, buf.subarray(i, i + 0x8000));
  return 'g:' + btoa(bin);
}
export async function descomprimir(txt) {
  if (!txt) return null; if (txt.startsWith('j:')) return txt.slice(2); if (!txt.startsWith('g:')) return txt;
  const bin = atob(txt.slice(2)), buf = new Uint8Array(bin.length); for (let i = 0; i < bin.length; i++) buf[i] = bin.charCodeAt(i);
  const s = new Blob([buf]).stream().pipeThrough(new DecompressionStream('gzip')); return new Response(s).text();
}

// ---------------- API (Worker -> Apps Script)
// tempo: depois disso desiste (internet lenta ou planilha engasgada não podem travar o app para sempre)
export async function api(acao, dados = {}, { tempo = 25000 } = {}) {
  let r; const ctl = typeof AbortController !== 'undefined' ? new AbortController() : null; const relogio = setTimeout(() => ctl?.abort(), tempo);
  try {
    r = await fetch('/api', { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify({ acao, sessao: estado.sessao, ...dados }), signal: ctl?.signal });
  } catch (e) { clearTimeout(relogio); return { ok: false, erro: e && e.name === 'AbortError' ? 'demorou' : 'sem_internet' }; }
  let j; try { j = await r.json(); } catch { clearTimeout(relogio); return { ok: false, erro: ctl?.signal.aborted ? 'demorou' : 'resposta' }; }
  clearTimeout(relogio);
  if (!j.ok && j.erro === 'sessao') { sairLocal(); avisar({ tipo: 'sessao' }); }
  return j;
}

export async function iniciar() {
  try { estado.sessao = localStorage.getItem(CHAVE_SESSAO); estado.usuario = JSON.parse(localStorage.getItem('bi:usuario') || 'null'); } catch { /* */ }
  try {
    const r = await fetch('/versao.json', { cache: 'no-store' }); const j = await r.json(); estado.nuvem = !!j.nuvem; estado.versao = j.versao;
    try { localStorage.setItem('bi:nuvem', estado.nuvem ? '1' : '0'); } catch { /* */ }
  } catch { try { estado.nuvem = localStorage.getItem('bi:nuvem') === '1'; } catch { /* */ } }
  // confere a conta na nuvem: se já temos os dados guardados, confere POR TRÁS (o app abre na hora)
  if (estado.nuvem && estado.sessao && navigator.onLine) {
    const conferir = api('eu').then((r) => { if (r.ok) guardarUsuario(r.usuario); else if (r.erro === 'sessao') sairLocal(); });
    if (!estado.usuario) await conferir;
  }
  if (!estado.nuvem) { estado.usuario = null; estado.sessao = null; }
  estado.visitante = lembrado('bi:visitante') && !estado.sessao; estado.editorLocal = lembrado('bi:editor-local');
  addEventListener('online', () => { estado.online = true; avisar({ tipo: 'online' }); sincronizar(); });
  addEventListener('offline', () => { estado.online = false; avisar({ tipo: 'offline' }); mudouSinc(); });
  document.addEventListener('visibilitychange', () => { if (document.visibilityState === 'visible') sincronizar(); });
  setInterval(() => { if (document.visibilityState === 'visible') sincronizar(); }, 40000);
  await contarPendentes(); sincronizar();
  return estado;
}
// porta de entrada: aparece enquanto a pessoa não escolheu entrar (conta) ou visitar
export const precisaPorta = () => !estado.visitante && (estado.nuvem ? !estado.sessao : !estado.editorLocal);
export function virarVisitante() { estado.visitante = true; lembrar('bi:visitante', true); }
export function sairVisitante() { estado.visitante = false; lembrar('bi:visitante', false); }
export function editarLocal() { estado.editorLocal = true; estado.visitante = false; lembrar('bi:editor-local', true); lembrar('bi:visitante', false); }
export function guardarUsuario(u, sessao) {
  estado.usuario = u; if (sessao) sairVisitante(); if (sessao) estado.sessao = sessao;
  try { localStorage.setItem('bi:usuario', JSON.stringify(u)); if (sessao) localStorage.setItem(CHAVE_SESSAO, sessao); } catch { /* */ }
}
function sairLocal() { estado.editorLocal = false; lembrar('bi:editor-local', false); estado.sessao = null; estado.usuario = null; try { localStorage.removeItem(CHAVE_SESSAO); localStorage.removeItem('bi:usuario'); } catch { /* */ } }
export async function sair() { if (estado.sessao) await api('sair'); sairLocal(); }

// ---------------- maquetes
const resumo = (m) => ({ id: m.id, nome: m.nome, tipo: m.tipo, cidade: m.cidade || '', atualizado: m.atualizado, criado: m.criado, thumb: m.thumb || '', nota: m.nota ?? null, publica: m.publica !== false, pecas: (m.objs || []).length, area: Object.keys(m.chao || {}).length, dono: m.dono || conta(), donoNome: m.donoNome || '' });

// lista: as minhas (aparelho + nuvem) e as da equipe (só nuvem)
export async function listar({ soAparelho = false } = {}) {
  if (estado.visitante) return listarVisitante();
  const locais = await localTodas();
  if (soAparelho) return { minhas: locais.map((m) => ({ ...resumo(m), pendente: !!m.pendente, local: true })).sort((a, b) => String(b.atualizado).localeCompare(String(a.atualizado))), equipe: [], soAparelho: true }; const mapa = new Map(locais.map((m) => [m.id, { ...resumo(m), pendente: !!m.pendente, nuvemEm: m.nuvemEm, local: true }]));
  let equipe = [];
  if (estado.nuvem && estado.sessao && navigator.onLine) {
    const r = await api('listar');
    if (r.ok) for (const s of r.maquetes) {
      if (minhaOuEquipe(s.dono)) { const l = mapa.get(s.id); if (!l || mudouNaNuvem(l, s)) mapa.set(s.id, { ...s, nuvem: true, local: !!l }); else l.nuvem = true; }
      else equipe.push({ ...s, nuvem: true });
    }
    // apagada em outro aparelho: já esteve na nuvem, não tem nada para enviar e sumiu da lista
    if (r.ok) { const naNuvem = new Set(r.maquetes.map((x) => x.id)); for (const l of locais) if (l.nuvemEm && !l.pendente && !naNuvem.has(l.id)) { mapa.delete(l.id); localTira(l.id); } }
  }
  const ordem = (a, b) => String(b.atualizado).localeCompare(String(a.atualizado));
  return { minhas: [...mapa.values()].sort(ordem), equipe: equipe.sort(ordem) };
}

async function listarVisitante() {
  const s = await loja('readonly'); const tudo = await pedir(s.getAll());
  const ordem = (a, b) => String(b.atualizado).localeCompare(String(a.atualizado));
  if (!estado.nuvem) return { minhas: [], equipe: tudo.filter((m) => m.conta === 'local' && m.publica !== false).map(resumo).sort(ordem) };
  const guardadas = tudo.filter((m) => m.conta === 'visitante');
  if (navigator.onLine) { const r = await api('publico.listar'); if (r.ok) return { minhas: [], equipe: r.maquetes.sort(ordem) }; }
  return { minhas: [], equipe: guardadas.map(resumo).sort(ordem) }; // sem internet: as que já foram vistas
}
async function abrirVisitante(id) {
  const l = await localUma(id);
  if (!estado.nuvem) return l && l.publica !== false ? l : null;
  if (navigator.onLine) {
    const r = await api('publico.abrir', { id });
    if (r.ok) { const m = { ...JSON.parse(await descomprimir(r.maquete.dados)), ...r.maquete.meta, conta: 'visitante' }; if (!l || l.conta === 'visitante') await localPor(m); return m; }
  }
  return l || null;
}

export async function abrir(id) {
  if (estado.visitante) return abrirVisitante(id);
  const l = await localUma(id);
  // tem cópia no aparelho: abre NA HORA e confere a nuvem por trás (se mudou em outro aparelho, a tela se atualiza sozinha)
  if (l) { if (estado.nuvem && estado.sessao) setTimeout(() => sincronizar(), 300); return l; }
  // não tem cópia (ex.: primeira vez neste aparelho): aí precisa esperar a nuvem
  if (estado.nuvem && estado.sessao && navigator.onLine) {
    const r = await api('abrir', { id });
    if (r.ok && r.maquete) return daNuvem(r.maquete);
  }
  return l || null;
}

// ---------------- sincronização entre aparelhos
// Regra: cada aparelho lembra qual versão da nuvem ele tem (nuvemEm). Se a nuvem tiver outra e aqui não houver
// nada esperando para subir, baixa a da nuvem. Não depende do relógio de cada aparelho nem do formato da planilha.
// "equipe" = maquete da conta invisível do desenvolvedor: todo mundo da conta pode mexer
const minhaOuEquipe = (dono) => dono === conta() || dono === 'equipe';
const mudouNaNuvem = (l, s) => !l.pendente && (l.nuvemEm ? String(s.atualizado) !== String(l.nuvemEm) : String(s.atualizado) > String(l.atualizado || ''));
async function daNuvem(mq) {
  const dados = JSON.parse(await descomprimir(mq.dados));
  // "atualizado" de dentro dos dados é o carimbo de quem salvou (igual em todos os aparelhos); o da planilha pode vir em outro formato
  const m = { ...dados, ...mq.meta, atualizado: dados.atualizado || mq.meta.atualizado, conta: minhaOuEquipe(mq.meta.dono) ? conta() : 'equipe:' + mq.meta.dono };
  delete m.dados; m.pendente = false; m.nuvemEm = mq.meta.atualizado; if (m.conta === conta()) await localPor(m); return m;
}
const sinc = { trabalhando: 0, pendentes: 0, erro: false, ultima: null };
export const estadoSinc = () => ({ ...sinc, online: navigator.onLine, ligado: !!(estado.nuvem && estado.sessao && !estado.visitante) });
function mudouSinc() { avisar({ tipo: 'sinc', ...estadoSinc() }); }
async function contarPendentes() { try { sinc.pendentes = (await localTodas()).filter((m) => m.pendente).length; } catch { /* */ } }
async function trabalho(fn) { sinc.trabalhando++; mudouSinc(); try { return await fn(); } finally { sinc.trabalhando--; await contarPendentes(); mudouSinc(); } }
let novaTentativa = null;
function tentarDeNovo() { clearTimeout(novaTentativa); novaTentativa = setTimeout(() => sincronizar(), 20000); }
let sincronizando = null;
export function sincronizar() {
  if (!estadoSinc().ligado || !navigator.onLine) { mudouSinc(); return Promise.resolve(); }
  if (sincronizando) return sincronizando;
  sincronizando = trabalho(async () => {
    await enviarPendentes(); await filaEnvio;
    const r = await api('listar'); if (!r.ok) { sinc.erro = true; tentarDeNovo(); return; }
    const locais = new Map((await localTodas()).map((m) => [m.id, m])), naNuvem = new Set(), mudaram = [];
    for (const s of r.maquetes) {
      if (!minhaOuEquipe(s.dono)) continue; naNuvem.add(s.id); const l = locais.get(s.id);
      if (!l || mudouNaNuvem(l, s)) { const a = await api('abrir', { id: s.id }); if (a.ok && a.maquete) { const n = await daNuvem(a.maquete); if (!l || n.atualizado !== l.atualizado) mudaram.push(s.id); } }
    }
    for (const l of locais.values()) if (l.nuvemEm && !l.pendente && !naNuvem.has(l.id)) { await localTira(l.id); mudaram.push(l.id); }
    await contarPendentes(); sinc.erro = sinc.erro && sinc.pendentes > 0; sinc.ultima = Date.now();
    if (mudaram.length) avisar({ tipo: 'nuvem-mudou', ids: mudaram });
  }).finally(() => { sincronizando = null; });
  return sincronizando;
}

let filaEnvio = Promise.resolve();
export async function salvar(m, { enviar = true } = {}) {
  if (estado.visitante) throw new Error('Visitante não salva');
  m.atualizado = new Date().toISOString(); m.conta = conta(); m.dono = m.dono || conta(); if (estado.usuario) m.donoNome = m.donoNome || estado.usuario.nome;
  m.pendente = !!(estado.nuvem && estado.sessao); await localPor(m); avisar({ tipo: 'salvo', id: m.id, nuvem: false });
  await contarPendentes(); mudouSinc();
  if (enviar && m.pendente) filaEnvio = filaEnvio.then(() => trabalho(() => enviarUma(m.id)));
  return m;
}
async function enviarUma(id) {
  if (!navigator.onLine || !estado.sessao) return false;
  try { return await enviarUmaJa(id); } catch (e) { console.error(e); sinc.erro = true; tentarDeNovo(); return false; }
}
async function enviarUmaJa(id) {
  const m = await localUma(id); if (!m || !m.pendente) return true;
  const { thumb, pendente, conta: _c, ...resto } = m; void pendente; void _c;
  const dados = await comprimir(JSON.stringify(resto));
  const r = await api('salvar', { meta: resumo(m), thumb: thumb || '', dados });
  if (r.ok) {
    const atual = await localUma(id); if (atual && atual.atualizado === m.atualizado) { atual.pendente = false; atual.nuvemEm = r.atualizado || m.atualizado; await localPor(atual); }
    sinc.erro = false; sinc.ultima = Date.now(); avisar({ tipo: 'salvo', id, nuvem: true }); return true;
  }
  sinc.erro = true; tentarDeNovo(); avisar({ tipo: 'erro_nuvem', id, erro: r.erro }); return false;
}
export async function enviarPendentes() {
  if (!estado.nuvem || !estado.sessao || !navigator.onLine) return;
  for (const m of await localTodas()) if (m.pendente) filaEnvio = filaEnvio.then(() => trabalho(() => enviarUma(m.id)));
  return filaEnvio;
}
export async function excluir(id) {
  await localTira(id);
  if (estado.nuvem && estado.sessao) { const r = await api('excluir', { id }); return r.ok || r.erro === 'nao_achou'; }
  return true;
}
export async function duplicar(m, nome) {
  const c = JSON.parse(JSON.stringify(m)); c.id = novoId(); c.nome = nome || m.nome + ' (cópia)'; c.criado = new Date().toISOString(); c.dono = conta(); c.donoNome = estado.usuario?.nome || '';
  await salvar(c); return c;
}
export const ehMinha = (m) => !estado.visitante && (!estado.usuario || !m.dono || m.dono === conta() || m.dono === 'local' || m.dono === 'equipe');
export const podeEditar = (m) => !estado.visitante && (ehMinha(m) || estado.usuario?.papel === 'admin');
