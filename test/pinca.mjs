// Pinça no mapa do editor (iPad): dois dedos afastando = zoom maior, e não coloca peça sem querer (servidor na 8090)
import { createRequire } from 'node:module'; import assert from 'node:assert/strict';
const { chromium, devices } = createRequire(import.meta.url)(process.env.PW || 'playwright');
const FOTOS = process.env.FOTOS;
const b = await chromium.launch(); const ctx = await b.newContext({ ...devices['iPad Pro 11 landscape'] }); const p = await ctx.newPage();
const erros = []; p.on('pageerror', (e) => erros.push(e.message));
await p.addInitScript(() => { localStorage.setItem('bi:cookies', '1'); localStorage.setItem('bi:tutorial-inicio', '1'); localStorage.setItem('bi:tutorial-editor', '1'); localStorage.setItem('bi:dica-editor', '1'); sessionStorage.setItem('bi:editor-local', '1'); sessionStorage.setItem('bi:instalar-visto', '1'); });
await p.goto('http://localhost:8090/'); await p.waitForSelector('.cartao-m[data-id]'); await p.locator('.cartao-m[data-id]').first().tap(); await p.waitForSelector('.ed-mapa'); await p.waitForTimeout(900);
const cdp = await ctx.newCDPSession(p); const toque = (t, pts) => cdp.send('Input.dispatchTouchEvent', { type: t, touchPoints: pts.map(([x, y], i) => ({ x, y, id: i })) });
const z0 = await p.evaluate(() => window.__zoom()), n0 = await p.evaluate(() => window.__pecas());
const cx = 500, cy = 380;
await toque('touchStart', [[cx - 40, cy]]); await toque('touchStart', [[cx - 40, cy], [cx + 40, cy]]);
for (let i = 1; i <= 10; i++) { await toque('touchMove', [[cx - 40 - i * 12, cy], [cx + 40 + i * 12, cy]]); await p.waitForTimeout(16); }
await toque('touchEnd', []); await p.waitForTimeout(300);
const z1 = await p.evaluate(() => window.__zoom()), n1 = await p.evaluate(() => window.__pecas());
assert.ok(z1 > z0 * 1.8, `zoom aumentou (${z0.toFixed(2)} -> ${z1.toFixed(2)})`); assert.equal(n1, n0, 'nenhuma peça colocada sem querer');
// fechar a pinça diminui
await toque('touchStart', [[cx - 160, cy], [cx + 160, cy]]); for (let i = 1; i <= 8; i++) { await toque('touchMove', [[cx - 160 + i * 15, cy], [cx + 160 - i * 15, cy]]); await p.waitForTimeout(16); } await toque('touchEnd', []);
const z2 = await p.evaluate(() => window.__zoom()); assert.ok(z2 < z1, 'zoom diminuiu');
// ao abrir o editor vem o modo Tocar: tocar no mapa NÃO coloca nada
const t = await p.evaluate(() => { for (let y = 6; y < 17; y++) for (let x = 0; x < 20; x++) if (window.__chao(x, y) === 'grama' && !window.__objEm(x, y)) { const c = window.__celTela(x, y); if (c[0] > 120 && c[0] < 900 && c[1] > 150 && c[1] < 560) return c; } return null; });
assert.ok(await p.evaluate(() => document.querySelector('.ed').classList.contains('ferr-tocar')), 'abre no modo Tocar');
await p.touchscreen.tap(t[0], t[1]); await p.waitForTimeout(400);
assert.equal(await p.evaluate(() => window.__pecas()), n0, 'no modo Tocar o toque não coloca peça');
// escolhendo uma peça: deslizar o dedo NÃO espalha casinhas; aparece a peça transparente e só entra no ✓
await p.tap('[data-cat=casas]'); await p.tap('.pc[data-id=casa]'); await p.waitForTimeout(200);
await toque('touchStart', [[t[0], t[1] + 56]]); for (let i = 1; i <= 12; i++) { await toque('touchMove', [[t[0] + i * 9, t[1] + 56 + i * 4]]); await p.waitForTimeout(16); } await toque('touchEnd', []); await p.waitForTimeout(400);
assert.equal(await p.evaluate(() => window.__pecas()), n0, 'deslizar com a casinha escolhida não coloca nada');
assert.ok(await p.isVisible('.ed-confirma'), 'aparecem os botões ✕ 🔄 ✓');
if (FOTOS) await p.screenshot({ path: FOTOS + '/90-peca-transparente.png' });
await p.tap('.ed-confirma [data-c=ok]'); await p.waitForTimeout(400);
assert.equal(await p.evaluate(() => window.__pecas()), n0 + 1, 'no ✓ a casa entra (uma só)');
assert.ok(!(await p.isVisible('.ed-confirma')), 'botões somem depois de colocar');
// em cima de outra peça: pergunta (substituir / pôr ao lado)
await p.touchscreen.tap(t[0] + 12 * 9, t[1] + 56 + 12 * 4); await p.waitForTimeout(400); // mesmo lugar (a peça fica 56 px acima do dedo)
assert.match(await p.textContent('.ed-confirma [data-c=ok]'), /Ocupado/);
await p.tap('.ed-confirma [data-c=ok]'); await p.waitForSelector('.janela-sair');
if (FOTOS) await p.screenshot({ path: FOTOS + '/91-ja-tem-peca.png' });
await p.locator('.janela-sair .bt', { hasText: 'Pôr ao lado' }).tap(); await p.waitForTimeout(500);
assert.equal(await p.evaluate(() => window.__pecas()), n0 + 2, 'pôs ao lado');
if (FOTOS) { await p.tap('.ed-f[data-f=terreno]'); await p.waitForTimeout(600); await p.screenshot({ path: FOTOS + '/51-terreno-ipad.png' }); }
assert.deepEqual(erros, []); console.log(`✔ pinça no iPad: zoom ${z0.toFixed(2)} → ${z1.toFixed(2)} → ${z2.toFixed(2)}, sem colocar peça sem querer`);
await b.close();
