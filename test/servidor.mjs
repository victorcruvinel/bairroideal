// Servidor de teste: entrega a pasta public e simula o Worker (/api, /sw.js, /versao.json).
// node test/servidor.mjs 8080            -> modo local (sem planilha)
// node test/servidor.mjs 8080 --planilha -> /api usa o Codigo.gs de verdade com um Google falso (test/gas-falso.mjs)
import http from 'node:http'; import fs from 'node:fs'; import path from 'node:path'; import { fileURLToPath } from 'node:url';
const raiz = path.join(path.dirname(fileURLToPath(import.meta.url)), '..', 'public');
const porta = Number(process.argv[2] || 8080), comPlanilha = process.argv.includes('--planilha');
const tipos = { '.html': 'text/html; charset=utf-8', '.js': 'text/javascript; charset=utf-8', '.css': 'text/css; charset=utf-8', '.json': 'application/json', '.webmanifest': 'application/manifest+json', '.png': 'image/png', '.svg': 'image/svg+xml', '.ico': 'image/x-icon', '.woff2': 'font/woff2' };
let gas = null;
if (comPlanilha) { const { criarGas } = await import('./gas-falso.mjs'); gas = criarGas(); }
export const servidor = http.createServer(async (req, res) => {
  const url = new URL(req.url, 'http://x');
  if (url.pathname === '/api') {
    let corpo = ''; for await (const c of req) corpo += c;
    if (!gas) { res.writeHead(503, { 'content-type': 'application/json' }); return res.end('{"ok":false,"erro":"nao_configurado"}'); }
    const r = gas.post(corpo); res.writeHead(200, { 'content-type': 'application/json' }); return res.end(r);
  }
  // só no teste: pegar o último código mandado e ver a planilha
  if (gas && url.pathname === '/__codigo') { res.writeHead(200); return res.end(gas.ultimoCodigo(url.searchParams.get('email')) || ''); }
  if (gas && url.pathname === '/__planilha') { res.writeHead(200, { 'content-type': 'application/json' }); return res.end(JSON.stringify({ maquetes: Math.max(0, gas.abas.get('Maquetes')?.getLastRow() - 1 || 0), usuarios: Math.max(0, gas.abas.get('Usuarios')?.getLastRow() - 1 || 0), emails: gas.emails.map((e) => ({ para: e.para, assunto: e.assunto.replace(/\d{6}/, '######') })) })); }
  if (url.pathname === '/versao.json') { res.writeHead(200, { 'content-type': 'application/json' }); return res.end(JSON.stringify({ versao: 'dev', nuvem: !!gas })); }
  if (url.pathname === '/sw.js') { res.writeHead(200, { 'content-type': 'text/javascript' }); return res.end("self.VERSAO='dev';importScripts('/sw-base.js');"); }
  let f = path.join(raiz, decodeURIComponent(url.pathname)); if (!f.startsWith(raiz)) { res.writeHead(403); return res.end(); }
  if (!fs.existsSync(f) || fs.statSync(f).isDirectory()) f = path.join(raiz, 'index.html');
  res.writeHead(200, { 'content-type': tipos[path.extname(f)] || 'application/octet-stream', 'cache-control': 'no-store' }); fs.createReadStream(f).pipe(res);
});
servidor.listen(porta, () => console.log(`Bairro Ideal em http://localhost:${porta}${gas ? ' (com planilha falsa)' : ''}`));
