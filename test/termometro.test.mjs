// O termômetro precisa dar nota alta para o bairro ideal e baixa para o carente
import { test } from 'node:test'; import assert from 'node:assert/strict';
import { bairroIdeal, bairroCarente, terrenoVazio, umaRua } from '../public/js/modelos.js';
import { analisar } from '../public/js/termometro.js';
import { OBJETOS, CHAOS } from '../public/js/pecas.js';

test('bairro ideal tem nota alta e quase todas as metas', () => { const a = analisar(bairroIdeal()); assert.ok(a.nota >= 9, String(a.nota)); assert.ok(a.metas.filter((m) => m.ok).length >= 8); assert.equal(a.problemas.length, 0); });
test('bairro carente tem nota baixa e lista os problemas', () => { const a = analisar(bairroCarente()); assert.ok(a.nota < 2, String(a.nota)); assert.ok(a.problemas.some((p) => p.includes('esgoto'))); assert.ok(a.problemas.some((p) => p.includes('escola'))); });
test('terreno vazio não tem nota (sem casas)', () => { assert.equal(analisar(terrenoVazio()).nota, null); });
test('escola longe não conta', () => {
  const m = umaRua(); const sem = analisar(m).v.educacao; m.objs.push({ id: 'e', t: 'escola', x: 14, y: 0, r: 0, c: 0 }); m.objs = m.objs.filter((o) => !(o.y === 0 && o.x >= 14 && o.x <= 15) || o.id === 'e');
  const com = analisar(m).v.educacao; assert.equal(sem, 0); assert.ok(com > 40 && com < 100, String(com));
});
test('toda peça tem nome, categoria e desenho', () => {
  for (const [id, p] of Object.entries(OBJETOS)) { assert.ok(p.nome && p.cats.length && typeof p.desenho === 'function' && p.w >= 1 && p.d >= 1, id); }
  for (const [id, c] of Object.entries(CHAOS)) assert.ok(c.nome && c.cats.length, id);
  assert.ok(Object.keys(OBJETOS).length + Object.keys(CHAOS).length >= 65, 'repertório grande');
});
