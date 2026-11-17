// Bairro Ideal · Cloudflare Worker
// Entrega o site (pasta public) e faz a ponte POST /api -> Apps Script (planilha do Google).
import { APPS_SCRIPT_URL } from './config.js';

const json = (obj, status = 200) => new Response(JSON.stringify(obj), {
  status, headers: { 'content-type': 'application/json; charset=utf-8', 'cache-control': 'no-store' },
});

export function destino(env) { return (env && env.APPS_SCRIPT_URL) || APPS_SCRIPT_URL || ''; }

export async function api(req, env) {
  if (req.method !== 'POST') return json({ ok: false, erro: 'metodo' }, 405);
  const url = destino(env);
  if (!url) return json({ ok: false, erro: 'nao_configurado' }, 503);
  const corpo = await req.text();
  if (corpo.length > 8_000_000) return json({ ok: false, erro: 'grande_demais' }, 413);
  let dados;
  try { dados = JSON.parse(corpo); } catch { return json({ ok: false, erro: 'json' }, 400); }
  if (!dados || typeof dados !== 'object' || Array.isArray(dados)) return json({ ok: false, erro: 'json' }, 400);
  // senha combinada entre o Worker e o Apps Script (segredo BAIRRO_TOKEN). Quem chamar o Apps Script direto não entra.
  delete dados.token;
  if (env && env.BAIRRO_TOKEN) dados.token = env.BAIRRO_TOKEN;
  let r;
  try {
    r = await fetch(url, { method: 'POST', body: JSON.stringify(dados), headers: { 'content-type': 'text/plain;charset=utf-8' }, redirect: 'follow' });
  } catch { return json({ ok: false, erro: 'sem_conexao' }, 502); }
  const texto = await r.text();
  try { JSON.parse(texto); } catch { return json({ ok: false, erro: 'apps_script', status: r.status }, 502); }
  return new Response(texto, { headers: { 'content-type': 'application/json; charset=utf-8', 'cache-control': 'no-store' } });
}

// Versão = id da publicação no Cloudflare. Muda a cada deploy e obriga o app a se atualizar.
export function versao(env) {
  const id = env && env.CF_VERSION_METADATA && env.CF_VERSION_METADATA.id;
  return id ? String(id).replace(/-/g, '').slice(0, 12) : 'dev';
}

export function sw(env) {
  const v = versao(env);
  return new Response(`// Bairro Ideal · service worker (versão ${v})\nself.VERSAO = ${JSON.stringify(v)};\nimportScripts('/sw-base.js');\n`, {
    headers: { 'content-type': 'text/javascript; charset=utf-8', 'cache-control': 'no-cache, no-store, must-revalidate' },
  });
}

// ------------------------------------------------ links compartilhados (/v/ID) com arte própria no WhatsApp
async function appsScript(env, dados, ms = 6000) {
  const url = destino(env); if (!url) return null;
  const corpo = { ...dados }; if (env && env.BAIRRO_TOKEN) corpo.token = env.BAIRRO_TOKEN;
  try {
    const r = await fetch(url, { method: 'POST', body: JSON.stringify(corpo), headers: { 'content-type': 'text/plain;charset=utf-8' }, redirect: 'follow', signal: AbortSignal.timeout(ms) });
    return await r.json();
  } catch { return null; }
}
const escHtml = (t) => String(t).replace(/[&<>"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));
export function personalizar(html, { titulo, descricao, imagem, url }) {
  const troca = (re, valor) => { html = html.replace(re, (m0, a, b) => a + escHtml(valor) + b); };
  troca(/(<title>)[^<]*(<\/title>)/, titulo);
  troca(/(<meta property="og:title" content=")[^"]*(")/, titulo);
  troca(/(<meta property="og:description" content=")[^"]*(")/, descricao); troca(/(<meta name="description" content=")[^"]*(")/, descricao);
  troca(/(<meta property="og:url" content=")[^"]*(")/, url);
  troca(/(<meta property="og:image" content=")[^"]*(")/, imagem); troca(/(<meta name="twitter:image" content=")[^"]*(")/, imagem);
  return html;
}
const TIPO = { ideal: '🌳 Bairro ideal', carente: '🏚️ Bairro carente', livre: '✏️ Maquete livre' };
export async function paginaMaquete(req, env, id) {
  const url = new URL(req.url);
  const base = await env.ASSETS.fetch(new Request(new URL('/', url), req)); let html = await base.text();
  const r = await appsScript(env, { acao: 'publico.meta', id });
  if (r && r.ok) {
    const m = r.meta, nota = m.nota == null ? '' : ` · nota ${String(m.nota).replace('.', ',')}`;
    html = personalizar(html, {
      titulo: `${m.nome} · Bairro Ideal`, url: `${url.origin}/v/${id}`,
      descricao: `${TIPO[m.tipo] || 'Maquete'}${nota}${m.cidade ? ' · ' + m.cidade : ''}. Toque para ver a maquete em 3D, passear por dentro e conhecer a história. Bairro Ideal · por Elaine Freitas Muniz`,
      imagem: `${url.origin}/og/${id}.jpg?v=${encodeURIComponent(m.atualizado || '')}`,
    });
  }
  return new Response(html, { headers: { 'content-type': 'text/html; charset=utf-8', 'cache-control': 'no-cache' } });
}
export async function imagemMaquete(req, env, id, ctx) {
  const cache = typeof caches !== 'undefined' ? caches.default : null; const chave = new Request(req.url);
  if (cache) { const c = await cache.match(chave); if (c) return c; }
  const r = await appsScript(env, { acao: 'publico.arte', id }, 8000);
  let b64 = r && r.ok ? r.arte : r && r.thumb && r.thumb.startsWith('data:image/jpeg;base64,') ? r.thumb.split(',')[1] : null;
  if (!b64) return Response.redirect(new URL('/img/compartilhar.png', req.url).toString(), 302);
  const bin = atob(b64), bytes = new Uint8Array(bin.length); for (let i = 0; i < bin.length; i++) bytes[i] = bin.charCodeAt(i);
  const resp = new Response(bytes, { headers: { 'content-type': 'image/jpeg', 'cache-control': 'public, max-age=3600' } });
  if (cache && ctx) ctx.waitUntil(cache.put(chave, resp.clone()));
  return resp;
}

export default {
  async fetch(req, env, ctx) {
    const url = new URL(req.url);
    const v = url.pathname.match(/^\/v\/([\w-]{4,40})\/?$/); if (v) return paginaMaquete(req, env, v[1]);
    const og = url.pathname.match(/^\/og\/([\w-]{4,40})\.jpg$/); if (og) return imagemMaquete(req, env, og[1], ctx);
    if (url.pathname === '/api') return api(req, env);
    if (url.pathname === '/sw.js') return sw(env);
    if (url.pathname === '/versao.json') return json({ versao: versao(env), nuvem: !!destino(env) });
    const r = await env.ASSETS.fetch(req);
    if (r.status === 404 && req.method === 'GET' && !url.pathname.includes('.')) {
      return env.ASSETS.fetch(new Request(new URL('/', url), req)); // qualquer caminho sem arquivo abre o app
    }
    return r;
  },
};
