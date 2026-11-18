// Dois aparelhos na mesma conta (computador e iPad): o que é salvo em um aparece no outro (planilha falsa na 8094)
import { createRequire } from 'node:module'; import assert from 'node:assert/strict'; import { spawn } from 'node:child_process';
const { chromium, devices } = createRequire(import.meta.url)(process.env.PW || 'playwright');
const FOTOS = process.env.FOTOS; const URL0 = 'http://localhost:8094'; const EMAIL = 'hello@victorcruvinel.dev';
const srv = spawn(process.execPath, ['test/servidor.mjs', '8094', '--planilha'], { stdio: 'ignore' }); await new Promise((r) => setTimeout(r, 700));
const b = await chromium.launch(); const erros = [];
// o 2º aparelho entra com a mesma conta (o servidor só manda outro código depois de 40 s, então usamos a sessão já aberta)
async function aparelho(opcoes, sessao) {
  const ctx = await b.newContext(opcoes); const p = await ctx.newPage(); p.on('pageerror', (e) => erros.push(e.message));
  await p.addInitScript((ss) => { localStorage.setItem('bi:cookies', '1'); localStorage.setItem('bi:tutorial-inicio', '1'); localStorage.setItem('bi:tutorial-editor', '1'); localStorage.setItem('bi:dica-editor', '1'); sessionStorage.setItem('bi:instalar-visto', '1'); if (ss && !localStorage.getItem('bi:sessao')) { localStorage.setItem('bi:sessao', ss.s); localStorage.setItem('bi:usuario', ss.u); } }, sessao || null);
  await p.goto(URL0 + '/');
  if (sessao) { await p.waitForSelector('.cartao-m[data-id]', { timeout: 15000 }); return { ctx, p }; } await p.waitForSelector('[data-p=entrar]', { timeout: 15000 });
  await p.click('[data-p=entrar]'); await p.fill('[name=email]', EMAIL); await p.click('.entrar-cx .bt--sol'); await p.waitForSelector('.codigo');
  const cod = await (await fetch(URL0 + '/__codigo?email=' + EMAIL)).text();
  const caixas = p.locator('.codigo input'); if (await caixas.count() >= 6) { for (let i = 0; i < 6; i++) await caixas.nth(i).fill(cod[i]); } else { await caixas.first().fill(cod); } await p.waitForTimeout(400);
  if (await p.isVisible('[name=nome]')) { await p.fill('[name=nome]', 'Victor Cruvinel'); await p.click('.entrar-cx .bt--sol'); } // 1º acesso pede o nome
  // conta que já existe: entra sozinho quando os 6 números ficam completos
  await p.waitForSelector('.cartao-m[data-id]', { timeout: 15000 }); return { ctx, p };
}
const selo = (p) => p.textContent('.topo .nuvem-st');
const nomes = (p) => p.$$eval('#minhas .cartao-m[data-id] h3, #minhas .cartao-m[data-id] .nome, #minhas .cartao-m[data-id] b', (xs) => xs.map((x) => x.textContent.trim()).join(' | '));
const sincronizar = (p) => p.evaluate(() => document.dispatchEvent(new Event('visibilitychange'))); // como voltar para o app
const esperarSelo = (p, re) => p.waitForFunction((r) => new RegExp(r).test(document.querySelector('.topo .nuvem-st')?.textContent || ''), re.source, { timeout: 10000 });
try {
  const A = await aparelho({ viewport: { width: 1280, height: 800 } });
  await esperarSelo(A.p, /^Sincronizado$/);
  const sessaoA = await A.p.evaluate(() => ({ s: localStorage.getItem('bi:sessao'), u: localStorage.getItem('bi:usuario') }));
  const B = await aparelho({ ...devices['iPad (gen 7) landscape'] }, sessaoA);
  await esperarSelo(B.p, /^Sincronizado$/);
  assert.equal(await B.p.locator('#minhas .cartao-m[data-id]').count(), 2, 'o iPad recebeu as 2 maquetes (e não criou exemplos repetidos)');
  // 1) muda o nome no computador e salva
  await A.p.locator('.cartao-m[data-id]', { hasText: 'Vila Esperança' }).click(); await A.p.waitForSelector('.ed-mapa');
  await A.p.click('[data-aba=sobre]'); await A.p.fill('.ed-aba-c [name=nome]', 'Vila Sincronizada'); await A.p.waitForTimeout(500);
  await A.p.click('[data-a=salvar]'); await A.p.waitForFunction(() => /nuvem/.test(document.querySelector('.ed-salvo').textContent), null, { timeout: 8000 });
  // o iPad, na tela inicial, recebe sozinho
  await sincronizar(B.p); await B.p.waitForSelector('#minhas .cartao-m:has-text("Vila Sincronizada")', { timeout: 10000 });
  await esperarSelo(B.p, /^Sincronizado$/);
  if (FOTOS) await B.p.screenshot({ path: FOTOS + '/70-ipad-recebeu.png' });
  // 2) no iPad: abre, apaga peças e salva; o computador (com o editor aberto e sem mudanças) atualiza sozinho
  await B.p.locator('.cartao-m[data-id]', { hasText: 'Vila Sincronizada' }).click(); await B.p.waitForSelector('.ed-mapa'); await B.p.waitForTimeout(800);
  assert.match(await B.p.textContent('.ed-nome b'), /Vila Sincronizada/);
  const antes = await B.p.evaluate(() => window.__pecas());
  await B.p.tap('.ed-f[data-f=apagar]');
  const alvos = await B.p.evaluate(() => { const r = []; for (let y = 0; y < 20 && r.length < 3; y++) for (let x = 0; x < 20 && r.length < 3; x++) if (window.__objEm(x, y)) { const c = window.__celTela(x, y); if (c && c[0] > 150 && c[0] < innerWidth - 450 && c[1] > 160 && c[1] < innerHeight - 260) r.push(c); } return r; });
  for (const c of alvos) { await B.p.touchscreen.tap(c[0], c[1]); await B.p.waitForTimeout(250); }
  const depois = await B.p.evaluate(() => window.__pecas()); assert.ok(depois < antes, `apagou peças no iPad (${antes} -> ${depois})`);
  await B.p.tap('[data-a=salvar]'); await B.p.waitForFunction(() => /nuvem/.test(document.querySelector('.ed-salvo').textContent), null, { timeout: 8000 });
  await A.p.waitForTimeout(300); await sincronizar(A.p);
  await A.p.waitForFunction((n) => window.__pecas() === n, depois, { timeout: 10000 });
  if (FOTOS) await A.p.screenshot({ path: FOTOS + '/71-computador-atualizou.png' });
  // 3) sem internet no iPad: salva, fica esperando, e sobe quando a internet volta
  await B.p.evaluate(() => { location.hash = '#/'; }); await B.p.waitForSelector('.cartao-m[data-id]');
  await B.ctx.setOffline(true); await B.p.evaluate(() => dispatchEvent(new Event('offline')));
  await esperarSelo(B.p, /Sem internet/);
  await B.p.locator('.cartao-m[data-id]', { hasText: 'Morro Seco' }).click(); await B.p.waitForSelector('.ed-mapa');
  await B.p.evaluate(() => { if (!document.querySelector('.ed.com-painel')) document.querySelector('[data-a=painel]').click(); }); await B.p.waitForTimeout(400);
  await B.p.click('[data-aba=sobre]'); await B.p.fill('.ed-aba-c [name=nome]', 'Morro Seco sem internet'); await B.p.waitForTimeout(500);
  await B.p.click('[data-a=salvar]'); await B.p.waitForTimeout(400);
  await B.p.evaluate(() => { location.hash = '#/'; }); await B.p.waitForSelector('.cartao-m[data-id]');
  await esperarSelo(B.p, /Sem internet · 1 para enviar/);
  if (FOTOS) await B.p.screenshot({ path: FOTOS + '/72-ipad-sem-internet.png' });
  await B.ctx.setOffline(false); await B.p.evaluate(() => dispatchEvent(new Event('online')));
  await esperarSelo(B.p, /^Sincronizado$/);
  await A.p.evaluate(() => { location.hash = '#/'; }); await A.p.waitForSelector('.cartao-m[data-id]'); await sincronizar(A.p);
  await A.p.waitForSelector('#minhas .cartao-m:has-text("Morro Seco sem internet")', { timeout: 10000 });
  // 4) apagar no computador some do iPad
  await A.p.locator('.cartao-m[data-id]', { hasText: 'Morro Seco sem internet' }).locator('[data-menu]').click();
  await A.p.click('.menu-flut [data-a=excluir]'); await A.p.click('.janela .bt--perigo'); await A.p.waitForTimeout(600);
  await sincronizar(B.p); await B.p.waitForFunction(() => !document.querySelector('#minhas').textContent.includes('Morro Seco'), null, { timeout: 10000 });
  assert.equal(await B.p.locator('#minhas .cartao-m[data-id]').count(), 1, 'apagada no computador, sumiu do iPad');
  if (FOTOS) await A.p.screenshot({ path: FOTOS + '/73-computador-sincronizado.png' });
  assert.deepEqual(erros, []);
  console.log('✔ dois aparelhos: nome, peças, sem internet e apagar chegaram no outro; selo mostra "Sincronizado"');
} catch (e) { for (const c of b.contexts()) for (const pg of c.pages()) await pg.screenshot({ path: '/tmp/claude-0/-home-user-bairroideal/953d552e-5b59-5b4a-9f2c-44eca38a0255/scratchpad/erro-' + b.contexts().indexOf(c) + '.png' }).catch(() => {}); console.log('erros da página:', erros); throw e; } finally { await b.close(); srv.kill(); }
