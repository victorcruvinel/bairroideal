// Tutorial: aparece sozinho na 1ª vez (início e editor), "Pular" fecha e não volta, o ❓ abre de novo (servidor na 8090)
import { createRequire } from 'node:module'; import assert from 'node:assert/strict';
const { chromium, devices } = createRequire(import.meta.url)(process.env.PW || 'playwright');
const FOTOS = process.env.FOTOS;
const b = await chromium.launch(); const erros = [];
for (const [nome, opc] of [['pc', { viewport: { width: 1440, height: 900 } }], ['cel', { ...devices['iPhone 15'] }]]) {
  const ctx = await b.newContext(opc); const p = await ctx.newPage(); p.on('pageerror', (e) => erros.push(e.message));
  await p.addInitScript(() => { localStorage.setItem('bi:cookies', '1'); sessionStorage.setItem('bi:editor-local', '1'); sessionStorage.setItem('bi:instalar-visto', '1'); });
  await p.goto('http://localhost:8090/'); await p.waitForSelector('.tut', { timeout: 12000 });
  const passos = async () => (await p.textContent('.tut-n')).match(/de (\d+)/)[1];
  assert.match(await p.textContent('.tut-t'), /Bem-vindo/);
  // anda até o passo da "Nova maquete" e confere o destaque em volta do botão
  await p.click('.tut [data-t=prox]'); await p.waitForTimeout(400);
  assert.match(await p.textContent('.tut-t'), /Criar uma maquete/);
  const furo = await p.locator('.tut-furo').boundingBox(), bt = await p.locator('#nova2').boundingBox();
  assert.ok(Math.abs(furo.x + 8 - bt.x) < 3 && Math.abs(furo.y + 8 - bt.y) < 3, 'o destaque fica em volta do botão');
  if (FOTOS) await p.screenshot({ path: `${FOTOS}/95-tutorial-inicio-${nome}.png` });
  console.log(`  ${nome}: tutorial do início com ${await passos()} passos`);
  // vai até o fim
  for (let i = 0; i < 20 && await p.isVisible('.tut'); i++) { await p.click('.tut [data-t=prox]'); await p.waitForTimeout(150); }
  assert.ok(!(await p.isVisible('.tut')), 'terminou');
  // editor: aparece sozinho; Pular fecha
  await p.locator('.cartao-m[data-id]').first().click(); await p.waitForSelector('.tut', { timeout: 8000 });
  await p.click('.tut [data-t=prox]'); await p.waitForTimeout(400); assert.match(await p.textContent('.tut-t'), /Tocar/);
  if (FOTOS) await p.screenshot({ path: `${FOTOS}/96-tutorial-editor-${nome}.png` });
  for (let i = 0; i < 2; i++) { await p.click('.tut [data-t=prox]'); await p.waitForTimeout(350); }
  if (FOTOS) await p.screenshot({ path: `${FOTOS}/97-tutorial-colocar-${nome}.png` });
  console.log(`  ${nome}: tutorial do editor com ${await passos()} passos`);
  await p.click('.tut [data-t=pular]'); await p.waitForTimeout(400); assert.ok(!(await p.isVisible('.tut')), 'pulou');
  // não aparece de novo sozinho, mas o ❓ abre
  await p.evaluate(() => { location.hash = '#/'; }); await p.waitForSelector('.cartao-m[data-id]'); await p.locator('.cartao-m[data-id]').first().click(); await p.waitForSelector('.ed-mapa'); await p.waitForTimeout(1200);
  assert.ok(!(await p.isVisible('.tut')), 'não abre sozinho de novo');
  await p.click('[data-a=ajuda]'); await p.waitForFunction(() => /editor/.test(document.querySelector('.tut-t')?.textContent || ''), null, { timeout: 5000 });
  await p.keyboard.press('Escape'); await p.waitForTimeout(400);
  await ctx.close();
}
assert.deepEqual(erros, []);
console.log('✔ tutorial: aparece na 1ª vez, Pular fecha, ❓ abre de novo (computador e celular)');
await b.close();
