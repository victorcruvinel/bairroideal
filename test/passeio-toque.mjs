// Passeio no iPad e no iPhone com o dedo: joystick anda, arrastar à direita olha em volta (servidor na 8090)
import { createRequire } from 'node:module'; import assert from 'node:assert/strict';
const { chromium, devices } = createRequire(import.meta.url)(process.env.PW || 'playwright');
const FOTOS = process.env.FOTOS;
const b = await chromium.launch({ args: ['--use-gl=swiftshader', '--enable-webgl', '--ignore-gpu-blocklist'] });
for (const [nome, aparelho] of [['ipad', devices['iPad Pro 11 landscape']], ['iphone', devices['iPhone 15']]]) {
  const ctx = await b.newContext({ ...aparelho }); const p = await ctx.newPage();
  const erros = []; p.on('pageerror', (e) => erros.push(e.message));
  await p.addInitScript(() => { localStorage.setItem('bi:cookies', '1'); localStorage.setItem('bi:tutorial-inicio', '1'); localStorage.setItem('bi:tutorial-editor', '1'); sessionStorage.setItem('bi:visitante', '1'); });
  await p.goto('http://localhost:8090/'); await p.waitForSelector('.cartao-expo', { timeout: 15000 });
  assert.equal(await p.evaluate(() => document.documentElement.dataset.copiar), 'nao', 'visitante não copia');
  const id = await p.locator('.cartao-expo').first().getAttribute('data-id');
  await p.evaluate((id) => { location.hash = '#/m/' + id + '/passeio'; }, id); await p.waitForSelector('.pas.toque'); await p.waitForTimeout(1500);
  assert.ok(await p.locator('.pas-joy').isVisible(), 'joystick aparece'); assert.ok(await p.locator('[data-p=pular]').isVisible(), 'botão pular aparece');
  const cdp = await ctx.newCDPSession(p);
  const toque = async (tipo, pts) => cdp.send('Input.dispatchTouchEvent', { type: tipo, touchPoints: pts.map(([x, y], i) => ({ x, y, id: i })) });
  const vp = p.viewportSize(); const antes = await p.evaluate(() => ({ ...window.__eu }));
  // joystick: dedo no canto esquerdo, arrasta para cima (andar para a frente) por 1,2 s
  const jx = 140, jy = vp.height - 110;
  await toque('touchStart', [[jx, jy]]); for (let i = 1; i <= 6; i++) { await toque('touchMove', [[jx, jy - i * 8]]); await p.waitForTimeout(30); }
  await p.waitForTimeout(1200);
  if (FOTOS) await p.screenshot({ path: `${FOTOS}/31-passeio-${nome}.png` });
  await toque('touchEnd', []);
  const depois = await p.evaluate(() => ({ ...window.__eu }));
  const andou = Math.hypot(depois.x - antes.x, depois.z - antes.z); assert.ok(andou > 1, `${nome}: andou ${andou.toFixed(2)}`);
  // olhar: arrasta na direita
  const g0 = depois.giro; await toque('touchStart', [[vp.width * .75, vp.height * .4]]); for (let i = 1; i <= 5; i++) await toque('touchMove', [[vp.width * .75 - i * 20, vp.height * .4]]); await toque('touchEnd', []);
  const g1 = await p.evaluate(() => window.__eu.giro); assert.ok(Math.abs(g1 - g0) > .2, `${nome}: virou`);
  // dois dedos: andando com o joystick E apertando pular ao mesmo tempo
  const bp = await p.locator('[data-p=pular]').boundingBox(); const px = bp.x + bp.width / 2, py = bp.y + bp.height / 2;
  const a0 = await p.evaluate(() => ({ ...window.__eu }));
  await toque('touchStart', [[jx, jy]]); for (let i = 1; i <= 5; i++) await toque('touchMove', [[jx, jy - i * 9]]);
  await p.waitForTimeout(300);
  await toque('touchStart', [[jx, jy - 45], [px, py]]);
  let maisAlto = 0; for (let i = 0; i < 12; i++) { await p.waitForTimeout(40); maisAlto = Math.max(maisAlto, await p.evaluate(() => window.__eu.y)); }
  await toque('touchEnd', [[jx, jy - 45]]); await p.waitForTimeout(500); await toque('touchEnd', []);
  const a1 = await p.evaluate(() => ({ ...window.__eu }));
  assert.ok(maisAlto > .1, `${nome}: pulou andando (altura ${maisAlto.toFixed(2)})`); assert.ok(Math.hypot(a1.x - a0.x, a1.z - a0.z) > .5, `${nome}: continuou andando durante o pulo`);
  console.log(`  ↳ pulou ${maisAlto.toFixed(2)} enquanto andava ${Math.hypot(a1.x - a0.x, a1.z - a0.z).toFixed(1)} quadradinhos`);
  // voar e descer
  await p.tap('[data-p=voar]'); assert.ok(await p.locator('[data-p=descer]').isVisible(), 'aparece descer ao voar');
  assert.deepEqual(erros, []); console.log(`✔ passeio no ${nome}: andou ${andou.toFixed(1)} quadradinhos e virou a câmera`);
  await ctx.close();
}
// quem entrou (modo local) pode copiar
const p2 = await b.newPage(); await p2.addInitScript(() => { localStorage.setItem('bi:cookies', '1'); localStorage.setItem('bi:tutorial-inicio', '1'); localStorage.setItem('bi:tutorial-editor', '1'); sessionStorage.setItem('bi:editor-local', '1'); });
await p2.goto('http://localhost:8090/'); await p2.waitForSelector('.cartao-m[data-id]'); assert.equal(await p2.evaluate(() => document.documentElement.dataset.copiar), 'sim', 'com conta copia');
console.log('✔ copiar: liberado com conta, bloqueado para visitante');
await b.close();
