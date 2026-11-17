// node test/foto.mjs <caminho> <saida.png> [largura] [altura] [escala] -> tira uma foto da página (precisa do servidor rodando na 8090)
import { createRequire } from 'node:module';
const { chromium } = createRequire(import.meta.url)(process.env.PW || 'playwright');
const [, , cam, saida, w = 1440, h = 900, e = 1] = process.argv;
const b = await chromium.launch(); const p = await b.newPage({ viewport: { width: +w, height: +h }, deviceScaleFactor: +e });
p.on('pageerror', (er) => console.log('ERRO NA PÁGINA:', er.message)); p.on('console', (m) => { if (m.type() === 'error') console.log('console:', m.text()); });
await p.goto('http://localhost:8090' + cam); await p.waitForTimeout(+(process.env.ESPERA || 1500)); await p.screenshot({ path: saida }); await b.close();
