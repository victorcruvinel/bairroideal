// Testes do worker/index.js (ponte com o Apps Script)
import { test } from 'node:test'; import assert from 'node:assert/strict';
import worker, { api, versao, personalizar, paginaMaquete, imagemMaquete } from '../worker/index.js';
import fs from 'node:fs';

test('sem link do Apps Script: modo local', async () => {
  const r = await api(new Request('https://x/api', { method: 'POST', body: '{}' }), {}); assert.equal(r.status, 503);
  const v = await worker.fetch(new Request('https://x/versao.json'), {}); assert.deepEqual(await v.json(), { versao: 'dev', nuvem: false });
});
test('manda o token e não deixa o navegador escolher o token', async () => {
  let enviado; globalThis.fetch = async (_u, o) => { enviado = JSON.parse(o.body); return new Response('{"ok":true}'); };
  const r = await api(new Request('https://x/api', { method: 'POST', body: JSON.stringify({ acao: 'eu', token: 'hacker' }) }), { APPS_SCRIPT_URL: 'https://script/exec', BAIRRO_TOKEN: 'certo' });
  assert.equal(r.status, 200); assert.equal(enviado.token, 'certo'); assert.equal(enviado.acao, 'eu');
});
test('rejeita GET, JSON quebrado e resposta estranha do Google', async () => {
  const env = { APPS_SCRIPT_URL: 'https://script/exec' };
  assert.equal((await api(new Request('https://x/api'), env)).status, 405);
  assert.equal((await api(new Request('https://x/api', { method: 'POST', body: 'oi' }), env)).status, 400);
  globalThis.fetch = async () => new Response('<html>erro</html>');
  assert.equal((await api(new Request('https://x/api', { method: 'POST', body: '{}' }), env)).status, 502);
});
test('versão vem do deploy e o sw.js carrega o sw-base', async () => {
  assert.equal(versao({ CF_VERSION_METADATA: { id: 'abcd-1234-ef56-7890' } }), 'abcd1234ef56');
  const r = await worker.fetch(new Request('https://x/sw.js'), { CF_VERSION_METADATA: { id: '1111-2222' } });
  assert.match(await r.text(), /importScripts\('\/sw-base\.js'\)/);
});

test('link /v/ID: o WhatsApp vê o nome da maquete e a arte dela', async () => {
  const html = fs.readFileSync(new URL('../public/index.html', import.meta.url), 'utf8');
  const env = { APPS_SCRIPT_URL: 'https://script/exec', BAIRRO_TOKEN: 't', ASSETS: { fetch: async () => new Response(html) } };
  let pedido; globalThis.fetch = async (_u, o) => { pedido = JSON.parse(o.body); return new Response(JSON.stringify({ ok: true, meta: { nome: 'Vila "Esperança"', tipo: 'ideal', nota: 9.7, cidade: 'Uberlândia - MG', atualizado: '2026-11-17' } })); };
  const r = await paginaMaquete(new Request('https://bairroideal.victorcruvinel.dev/v/mabc123'), env, 'mabc123'); const t = await r.text();
  assert.equal(pedido.acao, 'publico.meta'); assert.equal(pedido.token, 't');
  assert.match(t, /<title>Vila &quot;Esperança&quot; · Bairro Ideal<\/title>/);
  assert.match(t, /og:image" content="https:\/\/bairroideal\.victorcruvinel\.dev\/og\/mabc123\.jpg\?v=2026-11-17"/);
  assert.match(t, /nota 9,7/); assert.match(t, /og:url" content="https:\/\/bairroideal\.victorcruvinel\.dev\/v\/mabc123"/);
  // a imagem vem da planilha (base64 -> jpeg)
  globalThis.fetch = async () => new Response(JSON.stringify({ ok: true, arte: btoa('JPEGDADOS') }));
  const img = await imagemMaquete(new Request('https://x/og/mabc123.jpg'), env, 'mabc123'); assert.equal(img.headers.get('content-type'), 'image/jpeg'); assert.equal(await img.text(), 'JPEGDADOS');
  // sem arte e sem foto: usa a arte geral
  globalThis.fetch = async () => new Response(JSON.stringify({ ok: false, erro: 'nao_achou' }));
  const sem = await imagemMaquete(new Request('https://x/og/mabc123.jpg'), env, 'mabc123'); assert.equal(sem.status, 302);
  // maquete fora da exposição: página normal do site
  const n = await paginaMaquete(new Request('https://x/v/mabc123'), env, 'mabc123'); assert.match(await n.text(), /<title>Bairro Ideal/);
});
