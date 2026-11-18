// Voo no passeio: não sai da maquete, tem teto de altura e pousa num lugar livre (servidor na 8090)
// Também confere que a maquete de terreno vazio abre no passeio (não fica presa no carregando).
import { createRequire } from 'node:module'; import assert from 'node:assert/strict';
const { chromium } = createRequire(import.meta.url)(process.env.PW || 'playwright');
const FOTOS = process.env.FOTOS;
const b = await chromium.launch(); const p = await b.newPage({ viewport: { width: 1280, height: 800 } });
const erros = []; p.on('pageerror', (e) => erros.push(e.message));
await p.addInitScript(() => { localStorage.setItem('bi:cookies', '1'); localStorage.setItem('bi:dica-editor', '1'); localStorage.setItem('bi:exemplos', '1'); sessionStorage.setItem('bi:editor-local', '1'); sessionStorage.setItem('bi:instalar-visto', '1'); });
await p.goto('http://localhost:8090/'); await p.waitForTimeout(4500);
await p.click('#nova'); await p.fill('.janela [name=nome]', 'Terreno do voo'); await p.click('.janela .modelo[data-m=vazio]'); await p.click('.janela .bt--sol');
await p.waitForSelector('.ed-mapa'); await p.click('.ed-modos [data-modo=passeio]');
await p.waitForSelector('.pas-3d', { timeout: 10000 }); await p.waitForFunction(() => window.__eu, null, { timeout: 10000 });
assert.ok(!(await p.isVisible('.carregando')), 'terreno vazio abriu no passeio');
const eu = () => p.evaluate(() => ({ x: window.__eu.x, z: window.__eu.z, y: window.__eu.y, voar: window.__eu.voar }));
// voar e ir reto para fora da maquete por 6 segundos
await p.keyboard.press('v'); await p.waitForTimeout(300); assert.equal((await eu()).voar, true);
await p.evaluate(() => { window.__eu.giro = Math.PI / 4; }); // olhando para o canto
await p.keyboard.down('w'); await p.waitForTimeout(6000); await p.keyboard.up('w');
let e = await eu();
assert.ok(e.x > 0 && e.x < 12 && e.z > 0 && e.z < 12, `continua em cima da maquete 12×12 (x=${e.x.toFixed(2)}, z=${e.z.toFixed(2)})`);
// subir muito: para no teto
await p.keyboard.down(' '); await p.waitForTimeout(7000); await p.keyboard.up(' ');
e = await eu(); assert.ok(e.y <= 16.001 && e.y > 14, `parou no teto (altura ${e.y.toFixed(2)})`);
if (FOTOS) await p.screenshot({ path: FOTOS + '/80-voo-teto.png' });
// pousar: cai em lugar livre dentro da maquete
await p.keyboard.press('v'); await p.waitForTimeout(3500);
e = await eu(); assert.equal(e.voar, false); assert.ok(e.y < .01, 'pousou no chão');
assert.ok(e.x > 0 && e.x < 12 && e.z > 0 && e.z < 12, 'pousou dentro da maquete');
// andar depois de pousar funciona (não ficou preso)
const antes = await eu(); await p.evaluate(() => { window.__eu.giro += Math.PI; }); await p.keyboard.down('w'); await p.waitForTimeout(800); await p.keyboard.up('w');
const depois = await eu(); assert.ok(Math.hypot(depois.x - antes.x, depois.z - antes.z) > .3, 'consegue andar depois de pousar');
assert.deepEqual(erros, []);
console.log('✔ voo: não sai da maquete, teto de 16, pousa e anda; terreno vazio abre no passeio');
await b.close();
