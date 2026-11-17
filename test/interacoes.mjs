// Teste de uso real do editor com o mouse (precisa do servidor: node test/servidor.mjs 8090)
import { createRequire } from 'node:module'; import assert from 'node:assert/strict';
const { chromium } = createRequire(import.meta.url)(process.env.PW || 'playwright');
const FOTOS = process.env.FOTOS;
const b = await chromium.launch(); const p = await b.newPage({ viewport: { width: 1440, height: 900 } });
const erros = []; p.on('pageerror', (e) => erros.push(e.message));
await p.addInitScript(() => { localStorage.setItem('bi:cookies', '1'); localStorage.setItem('bi:dica-editor', '1'); localStorage.setItem('bi:exemplos', '1'); });
await p.goto('http://localhost:8090/'); await p.waitForTimeout(4500);
// nova maquete: terreno vazio
await p.click('#nova'); await p.fill('.janela [name=nome]', 'Bairro do teste'); await p.click('.janela .modelo[data-m=vazio]'); await p.click('.janela .bt--sol');
await p.waitForSelector('.ed-mapa'); await p.waitForTimeout(800);
const num = async (rotulo) => p.evaluate((r) => { const d = [...document.querySelectorAll('.nums div')].find((x) => x.textContent.includes(r)); return d ? +d.querySelector('b').textContent.replace(/\./g, '') : null; }, rotulo);
assert.equal(await num('quadradinhos'), 144, 'terreno 12x12');
// centro do mapa na tela
const box = await p.locator('.ed-mapa').boundingBox();
const cel = (x, y) => p.evaluate(([x, y]) => window.__celTela && window.__celTela(x, y), [x, y]);
assert.ok(await cel(0, 0), 'ajudante de teste existe');
// pinta uma rua: linha y=5 de x=0 a 11
await p.click('[data-cat=chao]'); await p.click('.pc[data-id=rua]');
let a = await cel(0, 5); await p.mouse.move(a[0], a[1]); await p.mouse.down();
for (let x = 1; x < 12; x++) { const c = await cel(x, 5); await p.mouse.move(c[0], c[1], { steps: 3 }); }
await p.mouse.up(); await p.waitForTimeout(300);
// casas na linha y=4
await p.click('[data-cat=casas]'); await p.click('.pc[data-id=casa]');
for (let x = 0; x < 6; x++) { const c = await cel(x, 4); await p.mouse.click(c[0], c[1]); }
await p.waitForTimeout(400);
assert.equal(await num('casas'), 6, '6 casas');
// escola 2x1 na linha y=6
await p.click('[data-cat=servicos]'); await p.click('.pc[data-id=escola]');
a = await cel(3, 6); await p.mouse.click(a[0], a[1]); await p.waitForTimeout(400);
const edu = await p.evaluate(() => document.querySelector('[data-ind=educacao] b').textContent);
assert.equal(edu, '100%', 'escola atende as casas');
// desfazer tira a escola, refazer volta
await p.click('[data-a=desfazer]'); await p.waitForTimeout(400);
assert.equal(await p.evaluate(() => document.querySelector('[data-ind=educacao] b').textContent), '0%');
await p.click('[data-a=refazer]'); await p.waitForTimeout(400);
assert.equal(await p.evaluate(() => document.querySelector('[data-ind=educacao] b').textContent), '100%');
// crescer o terreno
await p.click('[data-a=crescer]'); await p.waitForTimeout(400);
assert.equal(await num('quadradinhos'), 196, 'cresceu para 14x14');
// cortar um canto
await p.click('.ed-f[data-f=cortar]'); a = await cel(-1, -1); await p.mouse.click(a[0], a[1]); await p.waitForTimeout(300);
assert.equal(await num('quadradinhos'), 195, 'cortou 1');
// mover uma casa (ferramenta mão): arrasta a casa de (0,4) para (0,8)
await p.click('.ed-f[data-f=mao]'); a = await cel(0, 4); const d = await cel(0, 8);
await p.mouse.move(a[0], a[1] - 8); await p.mouse.down(); await p.mouse.move(d[0], d[1] - 8, { steps: 8 }); await p.mouse.up(); await p.waitForTimeout(400);
const posCasa = await p.evaluate(() => window.__objEm && window.__objEm(0, 8));
assert.equal(posCasa, 'casa', 'casa foi movida');
// planta + noite + girar não quebram
await p.click('.ed-modos [data-modo=planta]'); await p.click('[data-a=noite]'); await p.click('[data-a=girar]'); await p.waitForTimeout(300);
await p.click('.ed-modos [data-modo="3d"]'); await p.click('[data-a=noite]');
if (FOTOS) await p.screenshot({ path: FOTOS + '/09-teste-montado.png' });
// salvou sozinho
await p.waitForTimeout(1800);
assert.match(await p.textContent('.ed-salvo'), /Salvo/);
assert.deepEqual(erros, []);
console.log('✔ interações do editor ok');
await b.close();
