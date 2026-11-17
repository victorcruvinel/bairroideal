// Gera os ícones PNG e a imagem de compartilhar a partir do desenho do app. node test/gerar-imagens.mjs (servidor na 8090)
import { createRequire } from 'node:module'; import fs from 'node:fs';
const { chromium } = createRequire(import.meta.url)(process.env.PW || 'playwright');
const b = await chromium.launch(); const p = await b.newPage();
const svg = fs.readFileSync(new URL('../public/img/icone.svg', import.meta.url), 'utf8');
for (const [n, s, pad] of [['icone-192', 192, 0], ['icone-512', 512, 0], ['icone-180', 180, 0], ['icone-maskable', 512, 70]]) {
  await p.setViewportSize({ width: s, height: s });
  await p.setContent(`<body style="margin:0;background:#1f6f50"><div style="width:${s}px;height:${s}px;display:grid;place-items:center">${svg.replace('<svg ', `<svg width="${s - pad * 2}" height="${s - pad * 2}" `).replace('rx="16"', pad ? 'rx="0"' : 'rx="16"')}</div></body>`);
  await p.screenshot({ path: `public/img/${n}.png`, omitBackground: !pad });
}
await p.setViewportSize({ width: 1200, height: 630 });
await p.goto('http://localhost:8090/vazio'); await p.waitForTimeout(300);
await p.setContent(`<html><head><link href="https://fonts.googleapis.com/css2?family=Fredoka:wght@600;700&display=swap" rel="stylesheet"></head><body style="margin:0;width:1200px;height:630px;background:linear-gradient(180deg,#5ec8f8,#dff4ff);font-family:Fredoka;position:relative;overflow:hidden">
<canvas id="c" width="1200" height="630" style="position:absolute;inset:0"></canvas>
<div style="position:absolute;left:60px;top:70px;color:#fff;text-shadow:0 5px 0 #1f6f50"><div style="font-size:92px;font-weight:700">Bairro Ideal</div><div style="font-size:34px;color:#14513a;text-shadow:none;margin-top:6px">Monte maquetes de bairros em 3D</div><div style="font-size:26px;color:#fff;text-shadow:0 2px 0 #1f6f50;margin-top:14px">por Elaine Freitas Muniz</div></div></body></html>`);
await p.addScriptTag({ type: 'module', content: `import {indexar,desenhar,enquadrar} from 'http://localhost:8090/js/motor.js'; import {bairroIdeal} from 'http://localhost:8090/js/modelos.js';
const c=document.getElementById('c'),ctx=c.getContext('2d'),ix=indexar(bairroIdeal()); ctx.translate(380,150); desenhar(ctx,ix,enquadrar(ix,820,480,0,false,.98),820,480,{}); window.ok=1;` });
await p.waitForFunction(() => window.ok); await p.waitForTimeout(600); await p.screenshot({ path: 'public/img/compartilhar.png' });
await b.close(); console.log('imagens geradas');
