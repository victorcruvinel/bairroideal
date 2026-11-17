// Atualização forçada (versão nova = app recarrega sozinho, sem perder a maquete) e convite para instalar no iPhone
import { createRequire } from 'node:module'; import assert from 'node:assert/strict'; import { spawn } from 'node:child_process';
const { chromium, devices } = createRequire(import.meta.url)(process.env.PW || 'playwright');
const FOTOS = process.env.FOTOS, URL0 = 'http://localhost:8092';
const srv = spawn(process.execPath, ['test/servidor.mjs', '8092'], { stdio: 'ignore' }); await new Promise((r) => setTimeout(r, 700));
const b = await chromium.launch();
try {
  // 1) versão nova publicada -> o app percebe, salva o que está aberto e recarrega
  const p = await b.newPage({ viewport: { width: 1280, height: 800 } });
  await p.addInitScript(() => { localStorage.setItem('bi:cookies', '1'); localStorage.setItem('bi:dica-editor', '1'); sessionStorage.setItem('bi:editor-local', '1'); sessionStorage.setItem('bi:instalar-visto', '1'); window.__carregou = (window.__carregou || 0) + 1; });
  await p.goto(URL0 + '/'); await p.waitForSelector('.cartao-m[data-id]'); await p.locator('.cartao-m[data-id]').first().click(); await p.waitForSelector('.ed-mapa');
  await p.click('[data-aba=sobre]'); await p.fill('.ed-aba-c [name=nome]', 'Nome antes da atualização');
  await fetch(URL0 + '/__mudar-versao');
  await p.evaluate(() => document.dispatchEvent(new Event('visibilitychange'))); // como se a pessoa voltasse para o app
  await p.waitForSelector('.carregando', { timeout: 5000 }); if (FOTOS) await p.screenshot({ path: FOTOS + '/47-atualizando.png' });
  await p.waitForNavigation({ timeout: 8000 }); await p.waitForSelector('.ed-mapa', { timeout: 15000 });
  assert.match(await p.textContent('.ed-nome b'), /Nome antes da atualização/, 'salvou antes de recarregar');
  console.log('✔ versão nova: recarregou sozinho e não perdeu o que estava sendo editado');
  // 2) iPhone: convite para instalar com o passo a passo
  const ctx = await b.newContext({ ...devices['iPhone 15'] }); const c = await ctx.newPage();
  await c.addInitScript(() => localStorage.setItem('bi:cookies', '1'));
  await c.goto(URL0 + '/'); await c.waitForSelector('.instalar', { timeout: 12000 });
  if (FOTOS) await c.screenshot({ path: FOTOS + '/48-instalar-iphone.png' });
  await c.tap('.instalar [data-i=sim]'); await c.waitForSelector('.passos-ios');
  if (FOTOS) await c.screenshot({ path: FOTOS + '/49-instalar-passos.png' });
  console.log('✔ iPhone: convite para instalar com o passo a passo');
} finally { await b.close(); srv.kill(); }
