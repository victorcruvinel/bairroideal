// tira fotos do editor: abre o app, entra na primeira maquete e faz algumas coisas
import { createRequire } from 'node:module';
const { chromium } = createRequire(import.meta.url)(process.env.PW || 'playwright');
const [, , saida, w = 1440, h = 900, extra = ''] = process.argv;
const b = await chromium.launch(); const p = await b.newPage({ viewport: { width: +w, height: +h }, deviceScaleFactor: 1, hasTouch: +w < 800, isMobile: +w < 800 });
p.on('pageerror', (er) => console.log('ERRO NA PÁGINA:', er.message)); p.on('console', (m) => { if (m.type() === 'error') console.log('console:', m.text()); });
await p.addInitScript(() => { localStorage.setItem('bi:cookies', '1'); localStorage.setItem('bi:dica-editor', '1'); });
await p.goto('http://localhost:8090/'); await p.waitForTimeout(4600);
await p.locator('.cartao-m[data-id]').nth(+(process.env.N || 0)).click(); await p.waitForSelector('.ed-mapa'); await p.waitForTimeout(900);
if (extra) await p.evaluate(`(() => { ${extra} })()`); await p.waitForTimeout(600);
await p.screenshot({ path: saida }); await b.close();
