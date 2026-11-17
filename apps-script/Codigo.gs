/**
 * Bairro Ideal · Apps Script (banco de dados na planilha do Google)
 * --------------------------------------------------------------------------
 * Como usar (passo a passo completo no README do projeto):
 *  1. Crie uma planilha no Google Drive. Menu Extensões > Apps Script.
 *  2. Apague o que estiver lá e cole este arquivo inteiro. Salve.
 *  3. Na engrenagem (Configurações do projeto) > Propriedades do script, crie:
 *       BAIRRO_TOKEN = (o mesmo token colocado no Cloudflare)
 *  4. Escolha a função "configurar" lá em cima e clique em Executar (autorize o acesso).
 *  5. Implantar > Nova implantação > Tipo: App da Web
 *       Executar como: Eu  ·  Quem pode acessar: Qualquer pessoa
 *     Copie o link que termina em /exec e coloque no Cloudflare (variável APPS_SCRIPT_URL).
 *
 * Abas criadas sozinhas: Usuarios, Sessoes, Maquetes, Dados, Registro.
 * Os e-mails não usam emoji (alguns leitores de e-mail estragam).
 */

var ADMIN_EMAIL = 'hello@victorcruvinel.dev';     // primeira conta (administrador)
var REMETENTE = 'noreply@victorcruvinel.dev';      // usado se existir como "alias" no Gmail; senão sai do seu e-mail
var NOME_APP = 'Bairro Ideal';
var APP_URL = 'https://bairroideal.victorcruvinel.dev';
var DIAS_SESSAO = 30;
var TAM_PARTE = 45000;                              // uma célula aceita até 50 mil letras

var ABAS = {
  Usuarios: ['email', 'nome', 'papel', 'criado', 'ultimoAcesso', 'convidadoPor'],
  Sessoes: ['token', 'email', 'expira'],
  Maquetes: ['id', 'nome', 'tipo', 'cidade', 'dono', 'donoNome', 'criado', 'atualizado', 'nota', 'pecas', 'area', 'thumb', 'partes', 'publica'],
  Dados: ['id', 'partes', 'dados (em pedaços nas colunas seguintes)'],
  Registro: ['quando', 'para', 'assunto', 'enviado'],
};

// ------------------------------------------------------------------ configurar (rode uma vez)
function configurar() {
  Object.keys(ABAS).forEach(function (n) { aba_(n); });
  var tk = PropertiesService.getScriptProperties().getProperty('BAIRRO_TOKEN');
  var msg = 'Pronto! Abas criadas.\n' +
    (tk ? 'Token BAIRRO_TOKEN encontrado.' : 'ATENÇÃO: crie a propriedade BAIRRO_TOKEN (engrenagem > Propriedades do script).') +
    '\nE-mail do administrador: ' + ADMIN_EMAIL +
    '\nRemetente: ' + (temAlias_() ? REMETENTE : Session.getEffectiveUser().getEmail() + ' (o alias ' + REMETENTE + ' não foi encontrado nesta conta)');
  Logger.log(msg);
  return msg;
}
// rode para conferir se o Gmail está liberado (manda um e-mail de teste para você)
function testarEmail() {
  var para = Session.getEffectiveUser().getEmail();
  var ok = enviarEmail_(para, NOME_APP + ': teste de e-mail', moldura_('Tudo certo!', '<p>Se você recebeu este e-mail, o ' + NOME_APP + ' já consegue mandar códigos de acesso e convites.</p>'));
  Logger.log(ok ? 'E-mail enviado para ' + para : 'Não consegui enviar.');
}

// ------------------------------------------------------------------ entrada
function doGet() { return saida_({ ok: true, app: NOME_APP, versao: 1 }); }

function doPost(e) {
  var d;
  try { d = JSON.parse(e && e.postData && e.postData.contents || '{}'); } catch (x) { return saida_({ ok: false, erro: 'json' }); }
  var tk = PropertiesService.getScriptProperties().getProperty('BAIRRO_TOKEN');
  if (tk && d.token !== tk) return saida_({ ok: false, erro: 'token' });
  try { return saida_(rotear_(d)); }
  catch (x) { return saida_({ ok: false, erro: 'servidor', detalhe: String(x && x.message || x).slice(0, 200) }); }
}

function rotear_(d) {
  var acao = String(d.acao || '');
  if (acao === 'auth.inicio') return authInicio_(d);
  if (acao === 'auth.codigo') return comTrava_(function () { return authCodigo_(d); });
  if (acao === 'auth.confirmar') return comTrava_(function () { return authConfirmar_(d); });
  // modo visitante: só ler as maquetes que estão na exposição (sem login)
  if (acao === 'publico.listar') return { ok: true, maquetes: listarMaquetes_().filter(function (m) { return m.publica; }) };
  if (acao === 'publico.abrir') { var rp = acharMaquete_(d.id); if (!rp || String(rp.publica) === 'nao') return { ok: false, erro: 'nao_achou' }; return abrirMaquete_(d.id); }
  var u = usuarioDaSessao_(d.sessao);
  if (!u) return { ok: false, erro: 'sessao' };
  switch (acao) {
    case 'eu': return { ok: true, usuario: publico_(u) };
    case 'sair': return comTrava_(function () { apagarSessao_(d.sessao); return { ok: true }; });
    case 'listar': return { ok: true, maquetes: listarMaquetes_() };
    case 'abrir': return abrirMaquete_(d.id);
    case 'salvar': return comTrava_(function () { return salvarMaquete_(d, u); });
    case 'excluir': return comTrava_(function () { return excluirMaquete_(d.id, u); });
    case 'pessoas.listar': return u.papel === 'admin' ? { ok: true, pessoas: listarPessoas_() } : { ok: false, erro: 'proibido' };
    case 'pessoas.convidar': return u.papel === 'admin' ? comTrava_(function () { return convidar_(d, u); }) : { ok: false, erro: 'proibido' };
    case 'pessoas.remover': return u.papel === 'admin' ? comTrava_(function () { return removerPessoa_(d.email, u); }) : { ok: false, erro: 'proibido' };
    case 'pessoas.papel': return u.papel === 'admin' ? comTrava_(function () { return mudarPapel_(d.email, d.papel, u); }) : { ok: false, erro: 'proibido' };
    case 'pessoas.reenviar': return u.papel === 'admin' ? reenviarConvite_(d.email, u) : { ok: false, erro: 'proibido' };
  }
  return { ok: false, erro: 'acao' };
}

function comTrava_(fn) { var t = LockService.getScriptLock(); t.waitLock(25000); try { return fn(); } finally { t.releaseLock(); } }
function saida_(obj) { return ContentService.createTextOutput(JSON.stringify(obj)).setMimeType(ContentService.MimeType.JSON); }

// ------------------------------------------------------------------ planilha
function aba_(nome) {
  var ss = SpreadsheetApp.getActiveSpreadsheet(); var sh = ss.getSheetByName(nome);
  if (!sh) { sh = ss.insertSheet(nome); sh.getRange(1, 1, 1, ABAS[nome].length).setValues([ABAS[nome]]).setFontWeight('bold'); sh.setFrozenRows(1); }
  return sh;
}
function linhas_(nome) {
  var sh = aba_(nome), n = sh.getLastRow(); if (n < 2) return [];
  var cab = ABAS[nome], vals = sh.getRange(2, 1, n - 1, cab.length).getValues();
  return vals.map(function (r, i) { var o = { _linha: i + 2 }; cab.forEach(function (c, j) { o[c] = r[j]; }); return o; });
}
function paraLinha_(nome, o) { return ABAS[nome].map(function (c) { return o[c] == null ? '' : o[c]; }); }
function gravarLinha_(nome, linha, o) { aba_(nome).getRange(linha, 1, 1, ABAS[nome].length).setValues([paraLinha_(nome, o)]); }
function iso_(v) { return v instanceof Date ? v.toISOString() : String(v || ''); }
function txt_(v, max) { return String(v == null ? '' : v).replace(/^[=+\-@]/, "'$&").slice(0, max || 200); } // nada vira fórmula

// ------------------------------------------------------------------ maquetes
function metaDe_(r) {
  return { id: String(r.id), nome: String(r.nome), tipo: String(r.tipo || 'livre'), cidade: String(r.cidade || ''), dono: String(r.dono), donoNome: String(r.donoNome || ''),
    criado: iso_(r.criado), atualizado: iso_(r.atualizado), nota: r.nota === '' || r.nota == null ? null : Number(r.nota), pecas: Number(r.pecas || 0), area: Number(r.area || 0), thumb: String(r.thumb || ''), publica: String(r.publica) !== 'nao' };
}
function listarMaquetes_() { return linhas_('Maquetes').map(metaDe_); }
function acharMaquete_(id) { id = String(id || ''); return linhas_('Maquetes').filter(function (r) { return String(r.id) === id; })[0] || null; }

function lerDados_(id) {
  var sh = aba_('Dados'), n = sh.getLastRow(); if (n < 2) return null;
  var ids = sh.getRange(2, 1, n - 1, 1).getValues();
  for (var i = 0; i < ids.length; i++) if (String(ids[i][0]) === id) {
    var partes = Number(sh.getRange(i + 2, 2).getValue()) || 0; if (!partes) return '';
    return sh.getRange(i + 2, 3, 1, partes).getValues()[0].map(function (p) { return String(p).slice(1); }).join('');
  }
  return null;
}
function gravarDados_(id, texto) {
  var sh = aba_('Dados'), partes = [];
  for (var i = 0; i < texto.length; i += TAM_PARTE) partes.push('x' + texto.slice(i, i + TAM_PARTE)); // o "x" impede o Google de mexer no texto
  if (sh.getMaxColumns() < partes.length + 2) sh.insertColumnsAfter(sh.getMaxColumns(), partes.length + 2 - sh.getMaxColumns());
  var n = sh.getLastRow(), linha = 0;
  if (n >= 2) { var ids = sh.getRange(2, 1, n - 1, 1).getValues(); for (var j = 0; j < ids.length; j++) if (String(ids[j][0]) === id) { linha = j + 2; break; } }
  if (!linha) linha = Math.max(n, 1) + 1;
  else { var antes = Number(sh.getRange(linha, 2).getValue()) || 0; if (antes > partes.length) sh.getRange(linha, 3 + partes.length, 1, antes - partes.length).clearContent(); }
  sh.getRange(linha, 1, 1, partes.length + 2).setValues([[id, partes.length].concat(partes)]);
  return partes.length;
}
function apagarDados_(id) {
  var sh = aba_('Dados'), n = sh.getLastRow(); if (n < 2) return;
  var ids = sh.getRange(2, 1, n - 1, 1).getValues();
  for (var j = ids.length - 1; j >= 0; j--) if (String(ids[j][0]) === id) sh.deleteRow(j + 2);
}

function abrirMaquete_(id) {
  var r = acharMaquete_(id); if (!r) return { ok: false, erro: 'nao_achou' };
  var dados = lerDados_(String(r.id)); if (dados == null) return { ok: false, erro: 'sem_dados' };
  return { ok: true, maquete: { meta: metaDe_(r), dados: dados } };
}
function salvarMaquete_(d, u) {
  var m = d.meta || {}, id = String(m.id || '');
  if (!/^[\w-]{4,40}$/.test(id)) return { ok: false, erro: 'id' };
  if (typeof d.dados !== 'string' || d.dados.length < 2) return { ok: false, erro: 'dados' };
  if (d.dados.length > 6000000) return { ok: false, erro: 'grande_demais' };
  var r = acharMaquete_(id);
  if (r && normEmail_(r.dono) !== u.email && u.papel !== 'admin') return { ok: false, erro: 'proibido' };
  var agora = new Date().toISOString();
  var thumb = String(d.thumb || ''); if (thumb.length > 48000 || thumb.indexOf('data:image/') !== 0) thumb = '';
  var partes = gravarDados_(id, d.dados);
  var o = {
    id: id, nome: txt_(m.nome || 'Sem nome', 80), tipo: ['ideal', 'carente', 'livre'].indexOf(m.tipo) >= 0 ? m.tipo : 'livre', cidade: txt_(m.cidade, 80),
    dono: r ? r.dono : u.email, donoNome: r ? r.donoNome : u.nome, criado: r ? iso_(r.criado) : (m.criado || agora), atualizado: String(m.atualizado || agora),
    nota: m.nota == null ? '' : Number(m.nota), pecas: Number(m.pecas || 0), area: Number(m.area || 0), thumb: thumb, partes: partes, publica: m.publica === false ? 'nao' : 'sim',
  };
  if (r) gravarLinha_('Maquetes', r._linha, o); else aba_('Maquetes').appendRow(paraLinha_('Maquetes', o));
  return { ok: true, atualizado: o.atualizado };
}
function excluirMaquete_(id, u) {
  var r = acharMaquete_(id); if (!r) return { ok: false, erro: 'nao_achou' };
  if (normEmail_(r.dono) !== u.email && u.papel !== 'admin') return { ok: false, erro: 'proibido' };
  aba_('Maquetes').deleteRow(r._linha); apagarDados_(String(r.id)); return { ok: true };
}

// ------------------------------------------------------------------ contas (login só com código no e-mail)
function normEmail_(e) { return String(e || '').trim().toLowerCase(); }
function emailValido_(e) { return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(e) && e.length <= 120; }
function sha256_(t) { return Utilities.computeDigest(Utilities.DigestAlgorithm.SHA_256, t, Utilities.Charset.UTF_8).map(function (b) { return ('0' + (b & 255).toString(16)).slice(-2); }).join(''); }
function aleatorio_() { return (Utilities.getUuid() + Utilities.getUuid()).replace(/-/g, ''); }
function usuario_(email) { email = normEmail_(email); return linhas_('Usuarios').filter(function (r) { return normEmail_(r.email) === email; })[0] || null; }
function publico_(u) { return { email: normEmail_(u.email), nome: String(u.nome || ''), papel: String(u.papel || 'membro') }; }

function authInicio_(d) {
  var email = normEmail_(d.email); if (!emailValido_(email)) return { ok: false, erro: 'email' };
  var u = usuario_(email);
  if (!u) { if (!linhas_('Usuarios').length && email === normEmail_(ADMIN_EMAIL)) return { ok: true, estado: 'novo', nome: '' }; return { ok: false, erro: 'nao_convidado' }; }
  return { ok: true, estado: u.ultimoAcesso ? 'codigo' : 'novo', nome: u.ultimoAcesso ? '' : String(u.nome || '') };
}
function authCodigo_(d) {
  var email = normEmail_(d.email), ini = authInicio_(d); if (!ini.ok) return ini;
  var cache = CacheService.getScriptCache();
  if (cache.get('espera_' + email)) return { ok: false, erro: 'espere' };
  var naHora = Number(cache.get('hora_' + email) || 0); if (naHora >= 8) return { ok: false, erro: 'muitos' };
  var codigo = String(Math.floor(100000 + Math.random() * 900000));
  var ok = enviarEmail_(email, 'Seu código do ' + NOME_APP + ': ' + codigo, moldura_('Seu código de acesso',
    '<p style="margin:0 0 14px">Use este código para entrar no ' + NOME_APP + '. Ele vale por 10 minutos.</p>' +
    '<p style="margin:0 0 18px;font-size:36px;font-weight:800;letter-spacing:10px;color:#1f6f50">' + codigo + '</p>' +
    '<p style="margin:0;color:#7a6f5c;font-size:13px">Se não foi você que pediu, é só ignorar este e-mail.</p>'), true);
  if (!ok) return { ok: false, erro: 'envio' };
  cache.put('cod_' + email, JSON.stringify({ h: sha256_(codigo + '|' + email), t: 0, estado: ini.estado }), 600);
  cache.put('espera_' + email, '1', 40); cache.put('hora_' + email, String(naHora + 1), 3600);
  return { ok: true, estado: ini.estado, nome: ini.nome || '' };
}
function authConfirmar_(d) {
  var email = normEmail_(d.email), cache = CacheService.getScriptCache(), g = cache.get('cod_' + email);
  if (!g) return { ok: false, erro: 'expirou' };
  var c = JSON.parse(g);
  if (sha256_(String(d.codigo || '').replace(/\D/g, '') + '|' + email) !== c.h) {
    c.t++; if (c.t >= 5) { cache.remove('cod_' + email); return { ok: false, erro: 'expirou' }; }
    cache.put('cod_' + email, JSON.stringify(c), 600); return { ok: false, erro: 'codigo', restam: 5 - c.t };
  }
  var u = usuario_(email), agora = new Date().toISOString();
  if (c.estado === 'novo') {
    var nome = String(d.nome || '').trim().replace(/\s+/g, ' ').slice(0, 80);
    if (nome.length < 3 || nome.indexOf(' ') < 0) return { ok: false, erro: 'nome' };
    if (u) { u.nome = txt_(nome, 80); u.ultimoAcesso = agora; u.criado = iso_(u.criado); gravarLinha_('Usuarios', u._linha, u); }
    else {
      if (linhas_('Usuarios').length || email !== normEmail_(ADMIN_EMAIL)) return { ok: false, erro: 'nao_convidado' };
      aba_('Usuarios').appendRow(paraLinha_('Usuarios', { email: email, nome: txt_(nome, 80), papel: 'admin', criado: agora, ultimoAcesso: agora, convidadoPor: '' }));
    }
    u = usuario_(email);
  } else if (u) { aba_('Usuarios').getRange(u._linha, ABAS.Usuarios.indexOf('ultimoAcesso') + 1).setValue(agora); }
  if (!u) return { ok: false, erro: 'nao_convidado' };
  cache.remove('cod_' + email); cache.remove('hora_' + email);
  var token = aleatorio_(), sh = aba_('Sessoes'), agoraMs = Date.now();
  linhas_('Sessoes').filter(function (s) { return new Date(s.expira).getTime() < agoraMs; }).reverse().forEach(function (s) { sh.deleteRow(s._linha); });
  sh.appendRow(paraLinha_('Sessoes', { token: sha256_(token), email: email, expira: new Date(agoraMs + DIAS_SESSAO * 864e5).toISOString() }));
  return { ok: true, sessao: token, usuario: publico_(u) };
}
function usuarioDaSessao_(token) {
  if (!token || String(token).length < 20) return null;
  var h = sha256_(String(token)), s = linhas_('Sessoes').filter(function (x) { return x.token === h; })[0];
  if (!s || new Date(s.expira).getTime() < Date.now()) return null;
  var u = usuario_(s.email); if (!u) return null;
  return { email: normEmail_(u.email), nome: String(u.nome || ''), papel: String(u.papel || 'membro') };
}
function apagarSessao_(token) {
  var h = sha256_(String(token || '')), sh = aba_('Sessoes');
  linhas_('Sessoes').filter(function (x) { return x.token === h; }).reverse().forEach(function (x) { sh.deleteRow(x._linha); });
}

// ------------------------------------------------------------------ pessoas (só o administrador)
function listarPessoas_() {
  return linhas_('Usuarios').map(function (u) { return { email: normEmail_(u.email), nome: String(u.nome || ''), papel: String(u.papel || 'membro'), criado: iso_(u.criado), ultimoAcesso: iso_(u.ultimoAcesso), convidadoPor: String(u.convidadoPor || '') }; });
}
function convidar_(d, admin) {
  var email = normEmail_(d.email); if (!emailValido_(email)) return { ok: false, erro: 'email' };
  if (usuario_(email)) return { ok: false, erro: 'ja_existe' };
  var nome = txt_(String(d.nome || '').trim().replace(/\s+/g, ' '), 80);
  aba_('Usuarios').appendRow(paraLinha_('Usuarios', { email: email, nome: nome, papel: d.papel === 'admin' ? 'admin' : 'membro', criado: new Date().toISOString(), ultimoAcesso: '', convidadoPor: admin.email }));
  var enviado = emailConvite_(email, nome, admin);
  return { ok: true, enviado: enviado, pessoas: listarPessoas_() };
}
function emailConvite_(email, nome, admin) {
  return enviarEmail_(email, admin.nome + ' convidou você para o ' + NOME_APP, moldura_('Você foi convidado(a)!',
    '<p style="margin:0 0 12px">Olá' + (nome ? ', ' + esc_(nome.split(' ')[0]) : '') + '! <b>' + esc_(admin.nome) + '</b> convidou você para montar maquetes de bairros no ' + NOME_APP + '.</p>' +
    '<p style="margin:0 0 18px">Para entrar, abra o link abaixo, digite este e-mail (' + esc_(email) + ') e use o código que vamos mandar. Não precisa de senha.</p>' +
    '<p style="margin:0 0 8px"><a href="' + APP_URL + '/#/entrar" style="display:inline-block;background:#ffc93c;color:#2b2a33;padding:12px 22px;border-radius:12px;font-weight:800;text-decoration:none">Abrir o ' + NOME_APP + '</a></p>'));
}
function reenviarConvite_(email, admin) { var u = usuario_(email); if (!u) return { ok: false, erro: 'nao_achou' }; return { ok: emailConvite_(normEmail_(u.email), String(u.nome || ''), admin) }; }
function removerPessoa_(email, admin) {
  email = normEmail_(email); if (email === admin.email) return { ok: false, erro: 'voce_mesmo' };
  var u = usuario_(email); if (!u) return { ok: false, erro: 'nao_achou' };
  aba_('Usuarios').deleteRow(u._linha);
  var sh = aba_('Sessoes'); linhas_('Sessoes').filter(function (s) { return normEmail_(s.email) === email; }).reverse().forEach(function (s) { sh.deleteRow(s._linha); });
  return { ok: true, pessoas: listarPessoas_() };
}
function mudarPapel_(email, papel, admin) {
  email = normEmail_(email); if (email === admin.email) return { ok: false, erro: 'voce_mesmo' };
  var u = usuario_(email); if (!u) return { ok: false, erro: 'nao_achou' };
  aba_('Usuarios').getRange(u._linha, ABAS.Usuarios.indexOf('papel') + 1).setValue(papel === 'admin' ? 'admin' : 'membro');
  return { ok: true, pessoas: listarPessoas_() };
}

// ------------------------------------------------------------------ e-mail
function temAlias_() { try { return GmailApp.getAliases().map(normEmail_).indexOf(normEmail_(REMETENTE)) >= 0; } catch (x) { return false; } }
function enviarEmail_(para, assunto, html, semRegistro) {
  var ok = true;
  try {
    var opc = { htmlBody: html, name: NOME_APP };
    if (temAlias_()) opc.from = REMETENTE;
    GmailApp.sendEmail(para, assunto, html.replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').trim(), opc);
  } catch (x) { ok = false; }
  if (!semRegistro || !ok) try { aba_('Registro').appendRow([new Date().toISOString(), para, assunto.replace(/\d{6}/, '******'), ok ? 'sim' : 'não']); } catch (x) { /* */ }
  return ok;
}
function esc_(s) { return String(s == null ? '' : s).replace(/[&<>"]/g, function (c) { return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]; }); }
function moldura_(titulo, corpo) {
  return '<div style="background:#f6efe2;padding:28px 12px;font-family:Arial,Helvetica,sans-serif;color:#2b2a33">' +
    '<div style="max-width:480px;margin:0 auto;background:#fffaf1;border:2px solid #e6dcc8;border-radius:20px;overflow:hidden">' +
    '<div style="background:#1f6f50;color:#fff;padding:16px 22px;font-size:20px;font-weight:800">' + NOME_APP + '</div>' +
    '<div style="padding:22px"><h1 style="margin:0 0 12px;font-size:22px">' + titulo + '</h1>' + corpo + '</div></div>' +
    '<p style="text-align:center;color:#9a907e;font-size:12px;margin:14px 0 0">' + NOME_APP + ' · por Elaine Freitas Muniz</p></div>';
}
