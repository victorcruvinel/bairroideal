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
  assert.equal(r.ok, true); assert.equal(r.pessoas.length, 1, 'a conta do desenvolvedor não aparece'); assert.equal(r.enviado, true);
  assert.ok(!r.pessoas.some((p) => p.email === ADMIN), 'desenvolvedor invisível em Pessoas');
  const conv = g.emails.at(-1); assert.equal(conv.para, 'prof@escola.com'); assert.match(conv.html, /bairroideal\.victorcruvinel\.dev/);
  assert.doesNotMatch(conv.assunto + conv.html, /Victor/, 'convite do desenvolvedor não mostra o nome dele');
  assert.equal(g.chamar({ acao: 'pessoas.convidar', sessao: adm, email: 'prof@escola.com' }).erro, 'ja_existe');
  assert.equal(g.chamar({ acao: 'auth.inicio', email: 'prof@escola.com' }).nome, 'Maria Souza');
  const prof = await entrar(g, 'prof@escola.com', 'Maria Souza');
  assert.equal(g.chamar({ acao: 'eu', sessao: prof }).usuario.papel, 'membro');
  assert.equal(g.chamar({ acao: 'pessoas.convidar', sessao: prof, email: 'z@z.com' }).erro, 'proibido');
  assert.equal(g.chamar({ acao: 'pessoas.remover', sessao: adm, email: ADMIN }).erro, 'voce_mesmo');
  r = g.chamar({ acao: 'pessoas.remover', sessao: adm, email: 'prof@escola.com' }); assert.equal(r.pessoas.length, 0);
  assert.equal(g.chamar({ acao: 'eu', sessao: prof }).erro, 'sessao', 'sessão some com a pessoa');
});

test('conta do desenvolvedor invisível: outro admin não vê, não remove; maquetes dele viram "da equipe"', async () => {
  const g = criarGas(); const dev = await entrar(g, ADMIN, 'Victor Cruvinel');
  assert.equal(g.chamar({ acao: 'eu', sessao: dev }).usuario.dev, true);
  g.chamar({ acao: 'pessoas.convidar', sessao: dev, email: 'prof@escola.com', nome: 'Elaine Muniz', papel: 'admin' });
  g.chamar({ acao: 'pessoas.convidar', sessao: dev, email: 'aluna@escola.com', nome: 'Ana Lima' });
  const prof = await entrar(g, 'prof@escola.com', 'Elaine Muniz'), aluna = await entrar(g, 'aluna@escola.com', 'Ana Lima');
  const lp = g.chamar({ acao: 'pessoas.listar', sessao: prof }).pessoas; assert.deepEqual(lp.map((p) => p.email).sort(), ['aluna@escola.com', 'prof@escola.com']);
  assert.equal(g.chamar({ acao: 'pessoas.remover', sessao: prof, email: ADMIN }).erro, 'nao_achou');
  assert.equal(g.chamar({ acao: 'pessoas.papel', sessao: prof, email: ADMIN, papel: 'membro' }).erro, 'nao_achou');
  assert.equal(g.chamar({ acao: 'eu', sessao: dev }).usuario.papel, 'admin', 'continua admin');
  // a professora (admin) convida: aí o nome dela aparece normalmente
  g.chamar({ acao: 'pessoas.convidar', sessao: prof, email: 'z@escola.com', nome: 'Zé Silva' }); assert.match(g.emails.at(-1).assunto, /Elaine Muniz convidou/);
  // maquete do desenvolvedor: para os outros é "da equipe", sem nome; a aluna (não admin) pode editar
  const meta = { id: 'mdev0001', nome: 'Vila Esperança', tipo: 'ideal', atualizado: '2026-11-18T10:00:00.000Z' };
  assert.equal(g.chamar({ acao: 'salvar', sessao: dev, meta, dados: 'g:abc' }).ok, true);
  const vista = g.chamar({ acao: 'listar', sessao: aluna }).maquetes[0]; assert.equal(vista.dono, 'equipe'); assert.doesNotMatch(vista.donoNome, /Victor/);
  assert.equal(g.chamar({ acao: 'listar', sessao: dev }).maquetes[0].dono, ADMIN, 'o próprio desenvolvedor vê como dele');
  assert.equal(g.chamar({ acao: 'publico.listar' }).maquetes[0].donoNome, '', 'visitante não vê nome');
  assert.equal(g.chamar({ acao: 'salvar', sessao: aluna, meta: { ...meta, nome: 'Vila da aluna' }, dados: 'g:abcd' }).ok, true, 'aluna edita maquete da equipe');
  assert.equal(g.chamar({ acao: 'abrir', sessao: prof, id: 'mdev0001' }).maquete.meta.dono, 'equipe');
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

test('modo visitante: lista e abre só as maquetes da exposição, sem login', async () => {
  const g = criarGas(); const adm = await entrar(g, ADMIN, 'Victor Cruvinel');
  g.chamar({ acao: 'salvar', sessao: adm, meta: { id: 'mpub01', nome: 'Na exposição', publica: true }, dados: 'g:um' });
  g.chamar({ acao: 'salvar', sessao: adm, meta: { id: 'mpriv01', nome: 'Rascunho', publica: false }, dados: 'g:dois' });
  const l = g.chamar({ acao: 'publico.listar' }); assert.equal(l.ok, true); assert.deepEqual(l.maquetes.map((m) => m.id), ['mpub01']);
  assert.equal(g.chamar({ acao: 'publico.abrir', id: 'mpub01' }).maquete.dados, 'g:um');
  assert.equal(g.chamar({ acao: 'publico.abrir', id: 'mpriv01' }).erro, 'nao_achou');
  assert.equal(g.chamar({ acao: 'salvar', meta: { id: 'mpub01' }, dados: 'g:x' }).erro, 'sessao', 'visitante não salva');
  assert.equal(g.chamar({ acao: 'excluir', id: 'mpub01' }).erro, 'sessao');
  assert.equal(g.chamar({ acao: 'listar', sessao: adm }).maquetes.length, 2, 'dono vê as duas');
});

test('arte do WhatsApp: só o dono salva, todo mundo lê se estiver na exposição', async () => {
  const g = criarGas(); const adm = await entrar(g, ADMIN, 'Victor Cruvinel');
  g.chamar({ acao: 'salvar', sessao: adm, meta: { id: 'marte01', nome: 'Com arte', publica: true }, dados: 'g:um', thumb: 'data:image/jpeg;base64,AAAA' });
  assert.equal(g.chamar({ acao: 'publico.arte', id: 'marte01' }).erro, 'sem_arte');
  const arte = 'A'.repeat(120000);
  assert.equal(g.chamar({ acao: 'arte.salvar', id: 'marte01', arte }).erro, 'sessao');
  assert.equal(g.chamar({ acao: 'arte.salvar', sessao: adm, id: 'marte01', arte: '<script>' + arte }).erro, 'arte');
  assert.equal(g.chamar({ acao: 'arte.salvar', sessao: adm, id: 'marte01', arte }).ok, true);
  assert.equal(g.chamar({ acao: 'publico.arte', id: 'marte01' }).arte, arte);
  assert.equal(g.chamar({ acao: 'publico.meta', id: 'marte01' }).meta.nome, 'Com arte');
  g.chamar({ acao: 'excluir', sessao: adm, id: 'marte01' }); assert.equal(g.abas.get('Artes').getLastRow(), 1, 'arte apagada junto');
});
