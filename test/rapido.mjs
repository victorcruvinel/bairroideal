// Abrir tem que ser rápido mesmo com a nuvem lenta (a planilha do Google às vezes leva 3 s ou mais).
// Servidor com planilha falsa que demora 3 s em cada resposta (porta 8096).
import { createRequire } from 'node:module'; import assert from 'node:assert/strict'; import { spawn } from 'node:child_process';
const { chromium, devices } = createRequire(import.meta.url)(process.env.PW || 'playwright');
const URL0 = 'http://localhost:8096', EMAIL = 'hello@victorcruvinel.dev';
const srv = spawn(process.execPath, ['test/servidor.mjs', '8096', '--planilha', '--lento=3000'], { stdio: 'ignore' }); await new Promise((r) => setTimeout(r, 700));
const b = await chromium.launch(); const erros = [];
try {
  const ctx = await b.newContext({ ...devices['iPad (gen 7) landscape'] }); const p = await ctx.newPage(); p.on('pageerror', (e) => erros.push(e.message));
  await p.addInitScript(() => { localStorage.setItem('bi:cookies', '1'); localStorage.setItem('bi:tutorial-inicio', '1'); localStorage.setItem('bi:tutorial-editor', '1'); sessionStorage.setItem('bi:instalar-visto', '1'); });
  // entrar (aqui pode demorar: é a primeira vez)
  await p.goto(URL0 + '/'); await p.waitForSelector('[data-p=entrar]', { timeout: 20000 });
  await p.tap('[data-p=entrar]'); await p.fill('[name=email]', EMAIL); await p.tap('.entrar-cx .bt--sol'); await p.waitForSelector('.codigo', { timeout: 15000 });
  const cod = await (await fetch(URL0 + '/__codigo?email=' + EMAIL)).text(); const cx = p.locator('.codigo input'); for (let i = 0; i < 6; i++) await cx.nth(i).fill(cod[i]);
  await p.waitForTimeout(300); await p.fill('[name=nome]', 'Victor Cruvinel'); await p.tap('.entrar-cx .bt--sol');
  await p.waitForSelector('.cartao-m[data-id]', { timeout: 30000 });
  await p.waitForFunction(() => /Sincronizado/.test(document.querySelector('.nuvem-st')?.textContent || ''), null, { timeout: 30000 });
  // abrir maquete (já está no aparelho): não pode esperar a nuvem
  for (const n of ['Vila Esperança', 'Morro Seco']) {
    const t0 = Date.now(); await p.locator('.cartao-m[data-id]', { hasText: n }).tap(); await p.waitForSelector('.ed-mapa'); await p.waitForFunction(() => !document.querySelector('.carregando'));
    const ms = Date.now() - t0; console.log(`  abrir ${n}: ${ms} ms (nuvem demorando 3000 ms)`); assert.ok(ms < 1500, `abriu rápido (${ms} ms)`);
    const t1 = Date.now(); await p.evaluate(() => { location.hash = '#/'; }); await p.waitForSelector('.cartao-m[data-id]'); await p.waitForFunction(() => !document.querySelector('.carregando'));
    const ms2 = Date.now() - t1; console.log(`  voltar ao início: ${ms2} ms`); assert.ok(ms2 < 1500, `início rápido (${ms2} ms)`);
  }
  // criar, colocar uma peça, salvar, sair e abrir de novo: tudo rápido e a peça continua lá
  let t3 = Date.now(); await p.tap('#nova2'); await p.fill('.janela [name=nome]', 'Rua da Professora'); await p.tap('.janela .modelo[data-m=vazio]'); await p.tap('.janela .bt--sol');
  await p.waitForSelector('.ed-mapa'); await p.waitForFunction(() => !document.querySelector('.carregando')); console.log(`  criar maquete nova: ${Date.now() - t3} ms`); assert.ok(Date.now() - t3 < 2000, 'criou rápido');
  await p.tap('.ed-f[data-f=colocar]'); await p.tap('[data-cat=casas]'); await p.tap('.pc[data-id=casa]'); await p.waitForTimeout(150);
  const c = await p.evaluate(() => window.__celTela(5, 5)); await p.touchscreen.tap(c[0], c[1] + 56); await p.waitForSelector('.ed-confirma:not(.esconde)'); await p.tap('.ed-confirma [data-c=ok]'); await p.waitForTimeout(200);
  assert.equal(await p.evaluate(() => window.__pecas()), 1, 'colocou a casa');
  t3 = Date.now(); await p.tap('[data-a=salvar]'); await p.waitForFunction(() => document.querySelector('.ed-salvo').dataset.e !== 'mudou' && document.querySelector('.ed-salvo').dataset.e !== 'salvando');
  console.log(`  salvar: ${Date.now() - t3} ms`); assert.ok(Date.now() - t3 < 800, 'salvar não espera a nuvem');
  await p.evaluate(() => { location.hash = '#/'; }); await p.waitForSelector('#minhas .cartao-m:has-text("Rua da Professora")'); assert.ok(!(await p.isVisible('.janela-sair')), 'saiu sem perguntar (estava salvo)');
  t3 = Date.now(); await p.locator('.cartao-m[data-id]', { hasText: 'Rua da Professora' }).tap(); await p.waitForSelector('.ed-mapa'); await p.waitForFunction(() => !document.querySelector('.carregando'));
  console.log(`  abrir de novo: ${Date.now() - t3} ms`); assert.equal(await p.evaluate(() => window.__pecas()), 1, 'a casa continua lá');
  await p.waitForFunction(() => /Sincronizado/.test(document.querySelector('.nuvem-st')?.textContent || '') || /nuvem/.test(document.querySelector('.ed-salvo')?.textContent || ''), null, { timeout: 20000 });
  await p.evaluate(() => { location.hash = '#/'; }); await p.waitForSelector('#minhas .cartao-m[data-id]');
  await p.waitForFunction(() => /Sincronizado/.test(document.querySelector('.nuvem-st')?.textContent || ''), null, { timeout: 30000 });
  const pl = await (await fetch(URL0 + '/__planilha')).json(); assert.equal(pl.maquetes, 3, 'a maquete nova chegou na nuvem');
  // fechar e abrir o app de novo: a lista aparece sem esperar a nuvem
  const t2 = Date.now(); await p.reload(); await p.waitForSelector('#minhas .cartao-m[data-id]', { timeout: 15000 });
  await p.evaluate(() => document.querySelector('.abertura')?.click()); // pula a abertura animada
  const ms3 = Date.now() - t2; console.log(`  abrir o app de novo até aparecer a lista: ${ms3} ms`);
  assert.deepEqual(erros, []);
  console.log('✔ rápido: abrir maquete e voltar ao início não esperam a nuvem lenta');
} finally { await b.close(); srv.kill(); }
