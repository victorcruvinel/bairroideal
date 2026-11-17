// Contas da aba Matemática e da régua
import { test } from 'node:test'; import assert from 'node:assert/strict';
import { calcular, medir, fracao } from '../public/js/matematica.js';
import { analisar } from '../public/js/termometro.js';
import { terrenoVazio, bairroIdeal } from '../public/js/modelos.js';

test('área e perímetro de um terreno 12 × 12', () => {
  const m = terrenoVazio(); const M = calcular(m, analisar(m));
  assert.equal(M.n, 144); assert.equal(M.area, 14400); assert.equal(M.perimetro, 480); assert.equal(M.ocupacao, 1);
});
test('perímetro muda quando corta um canto em L', () => {
  const m = terrenoVazio(2, 2); delete m.chao['1,1']; const M = calcular(m, analisar(m));
  assert.equal(M.n, 3); assert.equal(M.perimetro, 80); assert.equal(M.retangulo, 400);
});
test('régua: triângulo 3-4-5 e caminho a pé', () => {
  const r = medir({ x: 0, y: 0 }, { x: 3, y: -4 }); assert.equal(r.dx, 3); assert.equal(r.dy, 4); assert.equal(r.d, 5); assert.equal(r.metros, 50); assert.equal(r.aPe, 70);
});
test('frações simples', () => { assert.equal(fracao(.5), '1/2'); assert.equal(fracao(.25), '1/4'); assert.equal(fracao(.66), '2/3'); assert.equal(fracao(.01), 'menos de 1/12'); });
test('bairro ideal: uso do solo soma o terreno todo e tem distância até a escola', () => {
  const m = bairroIdeal(); const M = calcular(m, analisar(m));
  assert.equal(Object.values(M.uso).reduce((a, b) => a + b, 0), M.n); assert.ok(M.distEscola.media > 0 && M.distEscola.maior >= M.distEscola.media);
});
