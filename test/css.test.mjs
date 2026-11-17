// Confere se todas as chaves { } do CSS estão fechadas (um "}" faltando estraga o resto do arquivo)
import { test } from 'node:test'; import assert from 'node:assert/strict'; import fs from 'node:fs';
test('chaves do app.css equilibradas', () => {
  const css = fs.readFileSync(new URL('../public/css/app.css', import.meta.url), 'utf8').replace(/\/\*[\s\S]*?\*\//g, '');
  let n = 0; for (const c of css) { if (c === '{') n++; if (c === '}') n--; assert.ok(n >= 0, 'fechou chave a mais'); } assert.equal(n, 0);
});
