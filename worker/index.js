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

export default {
  async fetch(req, env) {
    const url = new URL(req.url);
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
