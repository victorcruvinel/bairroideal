// Testes do worker/index.js (ponte com o Apps Script)
import { test } from 'node:test'; import assert from 'node:assert/strict';
import worker, { api, versao } from '../worker/index.js';

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
