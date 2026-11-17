// Bairro Ideal · tela inicial: minhas maquetes, maquetes da equipe e modelos prontos
import { el, esc, janela, confirmar, aviso, dataBonita, num } from '../ui.js';
import { listar, abrir, excluir, duplicar, salvar, estado, ehMinha } from '../dados.js';
import { MODELOS } from '../modelos.js';
import { topo, chipTipo, corNota, notaTxt, novaMaquete, prepararParaSalvar } from './comum.js';

export async function montar(app) {
  app.append(topo());
  const tela = el(`<div class="tela"><div class="larg">
    <div class="ola"><div><h1>Olá${estado.usuario ? ', ' + esc(estado.usuario.nome.split(' ')[0]) : ''}! 👋</h1><p>Monte bairros, compare e conte a história de cada um.</p></div>
      <div style="margin-left:auto;display:flex;gap:10px;flex-wrap:wrap"><a class="bt" href="#/comparar">⚖️ Comparar bairros</a>${estado.usuario?.papel === 'admin' ? '<a class="bt" href="#/pessoas">👥 Pessoas</a>' : ''}</div></div>
    <div class="grade-m" id="minhas"><div class="vazio-lista" style="grid-column:1/-1">Carregando suas maquetes…</div></div>
    <h2 class="secao-t">🧩 Começar com um modelo pronto</h2>
    <div class="modelos">${MODELOS.map((x) => `<button class="modelo" data-m="${x.id}"><span class="em">${x.emoji}</span><span><b>${x.nome}</b><small>${x.desc}</small></span></button>`).join('')}</div>
    <div id="equipe"></div>
    <div class="dica-cx" style="margin-top:22px">💡 Dica: use <b>Duplicar</b> numa maquete para transformar o bairro ideal no carente (ou o contrário) e depois <b>Comparar</b> os dois lado a lado.</div>
    <div class="rodape">Bairro Ideal · projeto acadêmico de Victor Soares Cruvinel · <a href="#/privacidade">Privacidade e cookies</a></div>
  </div></div>`);
  app.append(tela);
  tela.querySelectorAll('.modelo').forEach((b) => { b.onclick = async () => { const m = await novaMaquete(b.dataset.m); if (m) location.hash = '#/m/' + m.id; }; });

  const cartao = (m, minha) => `<div class="cartao-m" role="button" tabindex="0" data-id="${m.id}">
      <div class="th">${m.thumb ? `<img src="${m.thumb}" alt="">` : '<span class="vazio">🗺️</span>'}</div>
      ${m.pendente ? '<span class="pend">⏳ esperando internet</span>' : ''}
      <button class="mais" data-menu="${m.id}" aria-label="Opções">⋯</button>
      <div class="info"><b>${esc(m.nome)}</b>
        <small>${minha ? '' : '👤 ' + esc(m.donoNome || m.dono) + ' · '}${dataBonita(m.atualizado)} · ${num(m.pecas)} peças</small>
        <div class="linha">${chipTipo(m.tipo)}<span class="nota" style="color:${corNota(m.nota)}" title="Nota do bairro">${notaTxt(m.nota)}</span></div></div></div>`;

  let lista;
  async function carregar() {
    lista = await listar();
    // primeira vez: já deixa os dois bairros de exemplo prontos para mexer
    let primeira = false; try { primeira = !localStorage.getItem('bi:exemplos'); } catch { /* */ }
    if (primeira && !lista.minhas.length) {
      try { localStorage.setItem('bi:exemplos', '1'); } catch { /* */ }
      for (const id of ['carente', 'ideal']) await salvar(prepararParaSalvar(MODELOS.find((x) => x.id === id).criar()));
      lista = await listar();
    }
    const g = tela.querySelector('#minhas');
    g.innerHTML = `<button class="cartao-m cartao-novo" id="nova"><b>＋</b>Nova maquete<small>do zero ou de um modelo pronto</small></button>` + lista.minhas.map((m) => cartao(m, true)).join('');
    g.querySelector('#nova').onclick = async () => { const m = await novaMaquete(); if (m) location.hash = '#/m/' + m.id; };
    const eq = tela.querySelector('#equipe');
    eq.innerHTML = lista.equipe.length ? `<h2 class="secao-t">👥 Maquetes da equipe <small>${lista.equipe.length}</small></h2><div class="grade-m">${lista.equipe.map((m) => cartao(m, false)).join('')}</div>` : '';
  }
  await carregar();

  tela.addEventListener('click', async (e) => {
    const mb = e.target.closest('[data-menu]');
    if (mb) { e.stopPropagation(); menu(mb); return; }
    const c = e.target.closest('.cartao-m[data-id]'); if (c) location.hash = '#/m/' + c.dataset.id;
  });
  tela.addEventListener('keydown', (e) => { if (e.key === 'Enter' && e.target.matches('.cartao-m[data-id]')) location.hash = '#/m/' + e.target.dataset.id; });

  async function menu(botao) {
    document.querySelector('.menu-flut')?.remove();
    const id = botao.dataset.menu, resumo = [...lista.minhas, ...lista.equipe].find((m) => m.id === id); const minha = ehMinha(resumo);
    const r = botao.getBoundingClientRect();
    const mn = el(`<div class="menu-flut" style="top:${Math.min(r.bottom + 6, innerHeight - 330)}px;left:${Math.max(8, Math.min(r.right - 220, innerWidth - 230))}px">
      <button data-a="abrir">✏️ ${minha ? 'Abrir e editar' : 'Abrir'}</button><button data-a="historia">📖 Apresentar história</button><button data-a="passeio">🚶 Passear dentro</button>
      <button data-a="comparar">⚖️ Comparar com…</button><button data-a="duplicar">📄 Duplicar</button>
      ${minha ? '<button data-a="renomear">🏷️ Renomear</button><button data-a="excluir" class="perigo">🗑️ Apagar</button>' : ''}</div>`);
    document.body.append(mn);
    const fecha = (ev) => { if (!mn.contains(ev.target)) { mn.remove(); document.removeEventListener('pointerdown', fecha); } };
    setTimeout(() => document.addEventListener('pointerdown', fecha));
    mn.onclick = async (ev) => {
      const a = ev.target.closest('[data-a]')?.dataset.a; if (!a) return; mn.remove();
      if (a === 'abrir') location.hash = '#/m/' + id;
      if (a === 'historia') location.hash = '#/m/' + id + '/historia';
      if (a === 'passeio') location.hash = '#/m/' + id + '/passeio';
      if (a === 'comparar') location.hash = '#/comparar/' + id;
      if (a === 'duplicar') { const m = await abrir(id); if (!m) return aviso('Não consegui abrir essa maquete agora.', 'erro'); const c = await duplicar(m); aviso('Cópia criada: ' + esc(c.nome)); carregar(); }
      if (a === 'renomear') {
        const nome = await janela({ titulo: '🏷️ Renomear', corpo: `<label class="campo">Nome<input name="n" maxlength="60" value="${esc(resumo.nome)}"></label>`, botoes: [{ texto: 'Cancelar', valor: null }, { texto: 'Salvar', classe: 'bt--sol', valor: (f) => f.querySelector('[name=n]').value.trim() }] });
        if (nome) { const m = await abrir(id); m.nome = nome; await salvar(prepararParaSalvar(m)); carregar(); }
      }
      if (a === 'excluir' && await confirmar('Apagar maquete?', `A maquete <b>${esc(resumo.nome)}</b> será apagada para sempre.`, 'Apagar')) {
        await excluir(id); aviso('Maquete apagada.'); carregar();
      }
    };
  }
}
