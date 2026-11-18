// Service worker de verdade: abre, recarrega (página vem pelo service worker), funciona sem internet.
// O servidor de teste redireciona /index.html -> / como o Cloudflare; nada pode chegar "redirecionado".
import { createRequire } from 'node:module'; import assert from 'node:assert/strict'; import { spawn } from 'node:child_process';
const { chromium } = createRequire(import.meta.url)(process.env.PW || 'playwright');
const URL0 = 'http://localhost:8093';
const srv = spawn(process.execPath, ['test/servidor.mjs', '8093'], { stdio: 'ignore' }); await new Promise((r) => setTimeout(r, 700));
const b = await chromium.launch(); const ctx = await b.newContext(); const p = await ctx.newPage();
const erros = []; p.on('pageerror', (e) => erros.push(e.message));
try {
  await p.addInitScript(() => { localStorage.setItem('bi:sw-teste', '1'); localStorage.setItem('bi:cookies', '1'); localStorage.setItem('bi:tutorial-inicio', '1'); localStorage.setItem('bi:tutorial-editor', '1'); sessionStorage.setItem('bi:visitante', '1'); });
  await p.goto(URL0 + '/'); await p.waitForSelector('.cartao-expo', { timeout: 15000 });
  await p.waitForFunction(() => navigator.serviceWorker.controller, null, { timeout: 15000 }).catch(() => {});
  await p.reload(); await p.waitForFunction(() => !!navigator.serviceWorker.controller, null, { timeout: 15000 });
  await p.waitForSelector('.cartao-expo', { timeout: 15000 });
  console.log('✔ página aberta através do service worker');
  // abrir /index.html (o Cloudflare redireciona) também funciona
  await p.goto(URL0 + '/index.html'); await p.waitForSelector('.cartao-expo', { timeout: 15000 });
  console.log('✔ /index.html redirecionado: abre normal');
  // sem internet
  await ctx.setOffline(true); await p.reload(); await p.waitForSelector('.cartao-expo', { timeout: 15000 });
  console.log('✔ sem internet: abre do que foi guardado');
  await ctx.setOffline(false);
  assert.deepEqual(erros, []);
} finally { await b.close(); srv.kill(); }
