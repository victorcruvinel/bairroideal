// Bairro Ideal · pessoas (só administrador): convidar por e-mail, mudar papel, remover
import { el, esc, aviso, confirmar, dataBonita } from '../ui.js';
import { api, estado } from '../dados.js';
import { topo } from './comum.js';

export async function montar(app) {
  app.append(topo({ voltar: true, titulo: 'Pessoas' }));
  const t = el(`<div class="tela"><div class="larg" style="max-width:860px">
    <div class="ola"><div><h1>👥 Pessoas</h1><p>Quem pode entrar no Bairro Ideal. O acesso é só com código no e-mail.</p></div></div>
    <form class="convite"><h3>✉️ Convidar alguém</h3>
      <div class="convite-l"><label class="campo">E-mail<input type="email" name="email" required placeholder="professora@escola.com"></label><label class="campo">Nome (opcional)<input name="nome" maxlength="80" placeholder="Maria Souza"></label>
</div>
      <div class="papeis" role="radiogroup" aria-label="O que a pessoa pode fazer">
        <label class="papel-op"><input type="radio" name="papel" value="membro" checked><span class="papel-e">🎨</span><span><b>Usuário(a)</b><small>Faz tudo nas maquetes (criar, editar, apresentar, compartilhar). <b>Não</b> cria contas.</small></span></label>
        <label class="papel-op"><input type="radio" name="papel" value="admin"><span class="papel-e">⭐</span><span><b>Administrador(a)</b><small>Tudo isso <b>e também</b> convida pessoas e cria contas.</small></span></label>
      </div>
      <div class="erro-msg"></div><button class="bt bt--verde">Enviar convite</button></form>
    ${estado.usuario?.dev ? '<div class="dica-cx dev-aviso">🕶️ <b>Sua conta é invisível.</b> Ela não aparece nesta lista, nem como dono das maquetes, nem nos convites (o e-mail chega como “Você foi convidado(a) para o Bairro Ideal”). As maquetes desta conta aparecem para todo mundo como <b>da equipe</b>, e qualquer pessoa da conta pode editá-las.</div>' : ''}
    <div class="lista-p"><div class="vazio-lista">Carregando…</div></div>
  </div></div>`);
  app.append(t);
  if (!estado.usuario || estado.usuario.papel !== 'admin') { t.querySelector('.larg').innerHTML = '<div class="vazio-lista" style="margin-top:30px">Só quem administra pode ver esta tela.</div>'; return; }
  const lista = t.querySelector('.lista-p');
  const desenhar = (ps) => {
    if (!ps.length) { lista.innerHTML = '<div class="vazio-lista">Ninguém convidado ainda. Convide a professora aqui em cima 👆</div>'; return; }
    lista.innerHTML = ps.map((p) => `<div class="pessoa" data-e="${esc(p.email)}"><div class="avatar" style="background:${p.papel === 'admin' ? 'var(--verde)' : 'var(--coral)'}">${esc((p.nome || p.email).split(' ').map((x) => x[0]).slice(0, 2).join('').toUpperCase())}</div>
      <div class="pessoa-i"><b>${esc(p.nome || '(ainda sem nome)')}${p.email === estado.usuario.email ? ' <small>(você)</small>' : ''}</b><small>${esc(p.email)}</small>
      <small>${p.papel === 'admin' ? '⭐ Administrador(a): faz tudo e cria contas' : '🎨 Usuário(a): faz tudo, menos criar contas'} · ${p.ultimoAcesso ? 'último acesso ' + dataBonita(p.ultimoAcesso) : '✉️ convite enviado, ainda não entrou'}</small></div>
      ${p.email === estado.usuario.email ? '' : `<div class="pessoa-b">${p.ultimoAcesso ? '' : '<button class="bt" data-a="reenviar">Reenviar</button>'}<button class="bt" data-a="papel">${p.papel === 'admin' ? 'Tirar admin' : 'Tornar admin'}</button><button class="bt bt--leve" data-a="remover" title="Remover">🗑️</button></div>`}</div>`).join('');
  };
  const r = await api('pessoas.listar'); if (r.ok) desenhar(r.pessoas); else lista.innerHTML = '<div class="vazio-lista">Não consegui carregar a lista agora.</div>';
  const f = t.querySelector('.convite');
  f.onsubmit = async (e) => {
    e.preventDefault(); const b = f.querySelector('button'); b.disabled = true; f.querySelector('.erro-msg').textContent = '';
    const r2 = await api('pessoas.convidar', { email: f.email.value.trim(), nome: f.nome.value.trim(), papel: f.papel.value }); b.disabled = false;
    if (!r2.ok) { f.querySelector('.erro-msg').textContent = { email: 'E-mail inválido.', ja_existe: 'Essa pessoa já está na lista.' }[r2.erro] || 'Não deu certo (' + r2.erro + ').'; return; }
    aviso(r2.enviado ? 'Convite enviado! ✉️' : 'Pessoa adicionada, mas o e-mail não saiu. Use "Reenviar".', r2.enviado ? 'ok' : 'erro'); f.reset(); desenhar(r2.pessoas);
  };
  lista.addEventListener('click', async (e) => {
    const b = e.target.closest('[data-a]'); if (!b) return; const email = b.closest('[data-e]').dataset.e, a = b.dataset.a;
    if (a === 'reenviar') { const x = await api('pessoas.reenviar', { email }); aviso(x.ok ? 'Convite reenviado ✉️' : 'Não consegui reenviar.', x.ok ? 'ok' : 'erro'); }
    if (a === 'papel') { const x = await api('pessoas.papel', { email, papel: b.textContent.startsWith('Tornar') ? 'admin' : 'membro' }); if (x.ok) desenhar(x.pessoas); }
    if (a === 'remover' && await confirmar('Remover pessoa?', `<b>${esc(email)}</b> não vai mais conseguir entrar. As maquetes dela continuam guardadas.`, 'Remover')) { const x = await api('pessoas.remover', { email }); if (x.ok) { desenhar(x.pessoas); aviso('Pessoa removida.'); } }
  });
}
