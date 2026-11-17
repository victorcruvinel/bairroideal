// Testes do apps-script/Codigo.gs com o Google de mentira
import { test } from 'node:test'; import assert from 'node:assert/strict';
import { criarGas } from './gas-falso.mjs';
const ADMIN = 'hello@victorcruvinel.dev';

async function entrar(g, email, nome) {
  let r = g.chamar({ acao: 'auth.codigo', email }); assert.equal(r.ok, true, JSON.stringify(r));
  r = g.chamar({ acao: 'auth.confirmar', email, codigo: g.ultimoCodigo(email), nome }); assert.equal(r.ok, true, JSON.stringify(r));
  return r.sessao;
}

test('primeiro acesso: só o administrador, com nome e sobrenome', async () => {
  const g = criarGas(); g.ctx.configurar();
  assert.equal(g.chamar({ acao: 'auth.inicio', email: 'outra@x.com' }).erro, 'nao_convidado');
  assert.equal(g.chamar({ acao: 'auth.inicio', email: 'HELLO@victorcruvinel.dev ' }).estado, 'novo');
  g.chamar({ acao: 'auth.codigo', email: ADMIN });
  const cod = g.ultimoCodigo(ADMIN); assert.match(cod, /^\d{6}$/);
  assert.equal(g.emails.at(-1).de, 'noreply@victorcruvinel.dev', 'sai pelo alias');
  assert.equal(g.chamar({ acao: 'auth.confirmar', email: ADMIN, codigo: '000000', nome: 'Victor Cruvinel' }).erro, 'codigo');
  assert.equal(g.chamar({ acao: 'auth.confirmar', email: ADMIN, codigo: cod, nome: 'Victor' }).erro, 'nome');
  const r = g.chamar({ acao: 'auth.confirmar', email: ADMIN, codigo: cod, nome: 'Victor Cruvinel' });
  assert.equal(r.ok, true); assert.equal(r.usuario.papel, 'admin'); assert.ok(r.sessao.length > 40);
  assert.equal(g.chamar({ acao: 'eu', sessao: r.sessao }).usuario.nome, 'Victor Cruvinel');
  // segunda vez: sem nome
  assert.equal(g.chamar({ acao: 'auth.inicio', email: ADMIN }).estado, 'codigo');
});

test('limites: espera entre códigos, 5 tentativas, sessão inválida', async () => {
  const g = criarGas();
  assert.equal(g.chamar({ acao: 'auth.codigo', email: ADMIN }).ok, true);
  assert.equal(g.chamar({ acao: 'auth.codigo', email: ADMIN }).erro, 'espere');
  for (let i = 0; i < 4; i++) assert.equal(g.chamar({ acao: 'auth.confirmar', email: ADMIN, codigo: '111111' }).erro, 'codigo');
  assert.equal(g.chamar({ acao: 'auth.confirmar', email: ADMIN, codigo: '111111' }).erro, 'expirou');
  assert.equal(g.chamar({ acao: 'listar', sessao: 'x'.repeat(64) }).erro, 'sessao');
  assert.equal(g.chamar({ acao: 'listar' }).erro, 'sessao');
});

test('token do Cloudflare: sem o token certo, nada entra', () => {
  const g = criarGas({ token: 'segredo123' });
  assert.equal(g.chamar({ acao: 'auth.inicio', email: ADMIN }).erro, 'token');
  assert.equal(g.chamar({ acao: 'auth.inicio', email: ADMIN, token: 'errado' }).erro, 'token');
  assert.equal(g.chamar({ acao: 'auth.inicio', email: ADMIN, token: 'segredo123' }).ok, true);
});

test('convidar pessoas, e só o admin convida', async () => {
  const g = criarGas(); const adm = await entrar(g, ADMIN, 'Victor Cruvinel');
  let r = g.chamar({ acao: 'pessoas.convidar', sessao: adm, email: 'Prof@Escola.com', nome: 'Maria Souza' });
  assert.equal(r.ok, true); assert.equal(r.pessoas.length, 2); assert.equal(r.enviado, true);
  const conv = g.emails.at(-1); assert.equal(conv.para, 'prof@escola.com'); assert.match(conv.html, /bairroideal\.victorcruvinel\.dev/);
  assert.equal(g.chamar({ acao: 'pessoas.convidar', sessao: adm, email: 'prof@escola.com' }).erro, 'ja_existe');
  assert.equal(g.chamar({ acao: 'auth.inicio', email: 'prof@escola.com' }).nome, 'Maria Souza');
  const prof = await entrar(g, 'prof@escola.com', 'Maria Souza');
  assert.equal(g.chamar({ acao: 'eu', sessao: prof }).usuario.papel, 'membro');
  assert.equal(g.chamar({ acao: 'pessoas.convidar', sessao: prof, email: 'z@z.com' }).erro, 'proibido');
  assert.equal(g.chamar({ acao: 'pessoas.remover', sessao: adm, email: ADMIN }).erro, 'voce_mesmo');
  r = g.chamar({ acao: 'pessoas.remover', sessao: adm, email: 'prof@escola.com' }); assert.equal(r.pessoas.length, 1);
  assert.equal(g.chamar({ acao: 'eu', sessao: prof }).erro, 'sessao', 'sessão some com a pessoa');
});

test('maquetes grandes: salvar em pedaços, listar, abrir, permissões e apagar', async () => {
  const g = criarGas(); const adm = await entrar(g, ADMIN, 'Victor Cruvinel');
  g.chamar({ acao: 'pessoas.convidar', sessao: adm, email: 'prof@escola.com', nome: 'Maria Souza' }); const prof = await entrar(g, 'prof@escola.com', 'Maria Souza');
  const grande = 'g:' + 'A+/='.repeat(60000); // 240 mil letras = 6 pedaços
  const meta = { id: 'mteste01', nome: '=Vila Teste', tipo: 'ideal', nota: 9.2, pecas: 120, area: 340, atualizado: '2026-11-17T10:00:00.000Z' };
  let r = g.chamar({ acao: 'salvar', sessao: prof, meta, dados: grande, thumb: 'data:image/jpeg;base64,abc' }); assert.equal(r.ok, true, JSON.stringify(r));
  const l = g.chamar({ acao: 'listar', sessao: adm }).maquetes; assert.equal(l.length, 1); assert.equal(l[0].dono, 'prof@escola.com'); assert.equal(l[0].donoNome, 'Maria Souza');
  assert.equal(l[0].nome, "'=Vila Teste", 'nome não vira fórmula'); assert.equal(l[0].nota, 9.2);
  r = g.chamar({ acao: 'abrir', sessao: adm, id: 'mteste01' }); assert.equal(r.maquete.dados, grande, 'volta igualzinho');
  // salvar menor depois apaga os pedaços que sobraram
  r = g.chamar({ acao: 'salvar', sessao: prof, meta: { ...meta, nome: 'Vila' }, dados: 'g:curtinho' }); assert.equal(r.ok, true);
  assert.equal(g.chamar({ acao: 'abrir', sessao: prof, id: 'mteste01' }).maquete.dados, 'g:curtinho');
  // outra pessoa não pode mexer; o admin pode
  g.chamar({ acao: 'pessoas.convidar', sessao: adm, email: 'aluno@escola.com', nome: 'João Lima' }); const aluno = await entrar(g, 'aluno@escola.com', 'João Lima');
  assert.equal(g.chamar({ acao: 'salvar', sessao: aluno, meta, dados: 'g:x1' }).erro, 'proibido');
  assert.equal(g.chamar({ acao: 'excluir', sessao: aluno, id: 'mteste01' }).erro, 'proibido');
  assert.equal(g.chamar({ acao: 'salvar', sessao: adm, meta, dados: 'g:do admin' }).ok, true);
  assert.equal(g.chamar({ acao: 'listar', sessao: aluno }).maquetes[0].dono, 'prof@escola.com', 'dono continua o mesmo');
  assert.equal(g.chamar({ acao: 'excluir', sessao: prof, id: 'mteste01' }).ok, true);
  assert.equal(g.chamar({ acao: 'listar', sessao: prof }).maquetes.length, 0);
  assert.equal(g.abas.get('Dados').getLastRow(), 1, 'dados apagados');
  assert.equal(g.chamar({ acao: 'salvar', sessao: prof, meta: { id: '../x' }, dados: 'g:a' }).erro, 'id');
});

test('sem o alias, o e-mail sai da conta do dono; e-mails sem emoji de 4 bytes', async () => {
  const g = criarGas(); g.semAlias(); await entrar(g, ADMIN, 'Victor Cruvinel');
  assert.equal(g.emails.at(-1).de, 'dono@gmail.com');
  assert.equal(g.ctx.configurar().includes('não foi encontrado'), true);
});
