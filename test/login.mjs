// Teste do login por código + nuvem + convite (servidor com planilha falsa na 8091)
import { createRequire } from 'node:module'; import assert from 'node:assert/strict'; import { spawn } from 'node:child_process';
const { chromium } = createRequire(import.meta.url)(process.env.PW || 'playwright');
const FOTOS = process.env.FOTOS; const URL0 = 'http://localhost:8091';
const srv = spawn(process.execPath, ['test/servidor.mjs', '8091', '--planilha'], { stdio: 'ignore' }); await new Promise((r) => setTimeout(r, 700));
const b = await chromium.launch(); const p = await b.newPage({ viewport: { width: 1440, height: 900 } });
const erros = []; p.on('pageerror', (e) => erros.push(e.message));
try {
  await p.addInitScript(() => { localStorage.setItem('bi:cookies', '1'); localStorage.setItem('bi:dica-editor', '1'); });
  await p.goto(URL0 + '/'); await p.waitForTimeout(4500);
  assert.equal(await p.evaluate(() => location.hash), '#/porta', 'sem login aparece a porta de entrada');
  await p.click('[data-p=entrar]'); await p.waitForSelector('[name=email]');
  if (FOTOS) await p.screenshot({ path: FOTOS + '/15-entrar.png' });
  await p.fill('[name=email]', 'naoconvidado@x.com'); await p.click('.entrar-cx .bt--sol'); await p.waitForTimeout(400);
  assert.match(await p.textContent('.erro-msg'), /ainda não foi convidado/);
  await p.fill('[name=email]', 'hello@victorcruvinel.dev'); await p.click('.entrar-cx .bt--sol'); await p.waitForSelector('.codigo');
  const cod = await (await fetch(URL0 + '/__codigo?email=hello@victorcruvinel.dev')).text(); assert.match(cod, /^\d{6}$/);
  await p.fill('[name=nome]', 'Victor Cruvinel'); await p.locator('.codigo input').first().focus(); await p.keyboard.type(cod);
  if (FOTOS) await p.screenshot({ path: FOTOS + '/16-codigo.png' });
  await p.click('.entrar-cx .bt--sol'); await p.waitForTimeout(2500);
  assert.equal(await p.evaluate(() => location.hash), '#/', 'entrou');
  assert.match(await p.textContent('.heroi h1'), /Victor/);
  await p.waitForTimeout(2500);
  let pl = await (await fetch(URL0 + '/__planilha')).json(); assert.equal(pl.maquetes, 2, 'exemplos foram para a nuvem');
  // convidar
  await p.evaluate(() => { location.hash = '#/pessoas'; }); await p.waitForSelector('.pessoa');
  await p.fill('.convite [name=email]', 'professora@escola.com'); await p.fill('.convite [name=nome]', 'Ana Paula'); await p.click('.convite .bt--verde'); await p.waitForTimeout(800);
  assert.equal(await p.locator('.pessoa').count(), 2);
  pl = await (await fetch(URL0 + '/__planilha')).json(); assert.ok(pl.emails.some((e) => e.para === 'professora@escola.com' && /convidou/.test(e.assunto)));
  if (FOTOS) await p.screenshot({ path: FOTOS + '/17-pessoas.png' });
  // editar uma maquete e conferir que sobe
  await p.evaluate(() => { location.hash = '#/'; }); await p.waitForSelector('.cartao-m[data-id]'); await p.locator('.cartao-m[data-id]').first().click(); await p.waitForSelector('.ed-mapa');
  await p.click('[data-aba=sobre]'); await p.fill('.ed-aba-c [name=nome]', 'Vila Nova Esperança'); await p.waitForTimeout(500); await p.click('[data-a=salvar]'); await p.waitForTimeout(3000);
  assert.match(await p.textContent('.ed-salvo'), /nuvem/);
  // sair
  await p.evaluate(() => { location.hash = '#/'; }); await p.waitForSelector('.avatar'); await p.click('.avatar'); await p.click('.janela .bt--perigo'); await p.waitForTimeout(800);
  assert.equal(await p.evaluate(() => location.hash), '#/porta');
  // visitante: vê a exposição sem login, abre a maquete e não consegue editar
  await p.click('[data-p=visitar]'); await p.waitForSelector('.cartao-expo');
  assert.equal(await p.locator('.cartao-expo').count(), 2);
  if (FOTOS) await p.screenshot({ path: FOTOS + '/23-visitante-nuvem.png' });
  await p.locator('.cartao-expo').first().click(); await p.waitForSelector('.ed-mapa');
  assert.equal(await p.locator('.ed.so-ver').count(), 1, 'sem ferramentas de edição');
  assert.equal(await p.locator('.ed-doca:visible').count(), 0);
  assert.deepEqual(erros, []);
  console.log('✔ login, nuvem e convites ok');
} finally { await b.close(); srv.kill(); }
