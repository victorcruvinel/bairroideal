// Bairro Ideal · tela inicial: minhas maquetes, maquetes da equipe e modelos prontos
import { el, esc, janela, confirmar, aviso, dataBonita, num } from '../ui.js';
import { listar, abrir, excluir, duplicar, salvar, estado, ehMinha, aoMudar } from '../dados.js';
import { MODELOS } from '../modelos.js';
import { tutorial, TUTORIAL_INICIO } from '../tutorial.js';
import { topo, chipTipo, corNota, notaTxt, novaMaquete, prepararParaSalvar } from './comum.js';

export async function montar(app) {
  if (estado.visitante) return exposicao(app);
  app.append(topo());
  const tela = el(`<div class="tela"><div class="larg">
    <section class="heroi"><div class="heroi-nuvens"></div>
      <h1>Olá${estado.usuario ? ', ' + esc(estado.usuario.nome.split(' ')[0]) : ''}! 👋</h1><p>Monte bairros, compare e conte a história de cada um.</p>
      <div class="heroi-nums" id="nums"></div>
      <div class="heroi-bts"><button class="bt bt--sol bt--gde" id="nova2">＋ Nova maquete</button><a class="bt bt--gde" href="#/comparar">⚖️ Comparar</a><button class="bt bt--gde" id="tour2">▶ Apresentar todas</button><button class="bt bt--gde" id="expo2">📤 Compartilhar a exposição</button>${estado.usuario?.papel === 'admin' ? '<a class="bt bt--gde" href="#/pessoas">👥 Pessoas</a>' : ''}<button class="bt bt--gde esconde" id="inst2">📲 Instalar o app</button><button class="bt bt--gde" id="ajuda2">❓ Como usar</button></div>
    </section>
    <h2 class="secao-t">🗺️ Minhas maquetes</h2>
    <div class="grade-m" id="minhas"><div class="vazio-lista" style="grid-column:1/-1">Carregando suas maquetes…</div></div>
    <div id="equipe"></div>
    <div class="dica-cx" style="margin-top:22px">💡 Dica: use <b>Duplicar</b> numa maquete para transformar o bairro ideal no carente (ou o contrário) e depois <b>Comparar</b> os dois lado a lado.</div>
    <div class="rodape">Bairro Ideal · por Elaine Freitas Muniz · <a href="#/privacidade">Privacidade e cookies</a></div>
  </div></div>`);
  app.append(tela);

  const cartao = (m, minha) => `<div class="cartao-m" role="button" tabindex="0" data-id="${m.id}">
      <div class="th">${m.thumb ? `<img src="${m.thumb}" alt="">` : '<span class="vazio">🗺️</span>'}</div>
      ${m.pendente ? `<span class="pend">${navigator.onLine ? '⏳ enviando…' : '⏳ esperando internet'}</span>` : ''}
      <button class="mais" data-menu="${m.id}" aria-label="Opções">⋯</button>
      <div class="info"><b>${esc(m.nome)}</b>
        <small>${minha ? '' : '👤 ' + esc(m.donoNome || m.dono) + ' · '}${dataBonita(m.atualizado)} · ${num(m.pecas)} peças</small>
        <div class="linha">${chipTipo(m.tipo)}<span class="nota" style="color:${corNota(m.nota)}" title="Nota do bairro">${notaTxt(m.nota)}</span></div></div></div>`;

  let lista;
  // desenha com o que já tem (rápido); a lista completa (nuvem + equipe) chega por trás e redesenha
  function desenharLista() {
    if (!tela.isConnected || document.querySelector('.menu-flut')) return;
    const g = tela.querySelector('#minhas');
    g.innerHTML = `<button class="cartao-m cartao-novo" id="nova"><b>＋</b>Nova maquete<small>do zero ou de um modelo pronto</small></button>` + lista.minhas.map((m) => cartao(m, true)).join('');
    g.querySelector('#nova').onclick = async () => { const m = await novaMaquete(); if (m) location.hash = '#/m/' + m.id; };
    const notas = lista.minhas.map((m) => m.nota).filter((n) => n != null), media = notas.length ? notas.reduce((a, b) => a + b, 0) / notas.length : null;
    tela.querySelector('#nums').innerHTML = `<span><b>${lista.minhas.length}</b>${lista.minhas.length === 1 ? 'maquete' : 'maquetes'}</span><span><b>${lista.minhas.filter((m) => m.publica !== false).length}</b>na exposição</span><span><b>${media == null ? '–' : notaTxt(Math.round(media * 10) / 10)}</b>nota média</span><span><b>${num(lista.minhas.reduce((a, m) => a + (m.pecas || 0), 0))}</b>peças usadas</span>`;
    tela.querySelector('#tour2').disabled = !lista.minhas.length;
    const eq = tela.querySelector('#equipe');
    eq.innerHTML = lista.equipe.length ? `<h2 class="secao-t">👥 Maquetes da equipe <small>${lista.equipe.length}</small></h2><div class="grade-m">${lista.equipe.map((m) => cartao(m, false)).join('')}</div>` : '';
  }
  async function carregar() {
    lista = await listar();
    // primeira vez: já deixa os dois bairros de exemplo prontos para mexer
    let primeira = false; try { primeira = !localStorage.getItem('bi:exemplos'); } catch { /* */ }
    if (primeira && !lista.minhas.length) {
      try { localStorage.setItem('bi:exemplos', '1'); } catch { /* */ }
      for (const id of ['carente', 'ideal']) await salvar(prepararParaSalvar(MODELOS.find((x) => x.id === id).criar()));
      lista = await listar();
    }
    desenharLista();
  }
  tela.querySelector('#nova2').onclick = async () => { const m = await novaMaquete(); if (m) location.hash = '#/m/' + m.id; };
  tela.querySelector('#tour2').onclick = () => { const ids = lista.minhas.map((m) => m.id); if (!ids.length) return; try { sessionStorage.setItem('bi:tour', JSON.stringify(ids)); } catch { /* */ } location.hash = '#/m/' + ids[0] + '/historia'; };
  tela.querySelector('#expo2').onclick = async () => (await import('../compartilhar.js')).compartilharSite();
  ligarInstalar(tela.querySelector('#inst2'));
  // abre na hora com as maquetes do aparelho; sem nenhuma no aparelho (1º acesso), espera a lista completa
  const doAparelho = await listar({ soAparelho: true });
  if (doAparelho.minhas.length) { lista = doAparelho; desenharLista(); carregar(); } else await carregar();
  tela.querySelector('#ajuda2').onclick = () => tutorial('inicio', TUTORIAL_INICIO, { forcar: true });
  setTimeout(() => { if (tela.isConnected && !document.querySelector('.janela-fundo, .instalar')) tutorial('inicio', TUTORIAL_INICIO); }, 600); // 1ª vez: mostra sozinho
  // mudou algo em outro aparelho: a lista se atualiza sozinha (menos com o menu ⋯ aberto)
  let recarregar = null; const depois = () => { clearTimeout(recarregar); recarregar = setTimeout(() => { if (tela.isConnected && !document.querySelector('.menu-flut')) carregar(); }, 400); };
  const desligaNuvem = aoMudar((ev) => {
    if (!tela.isConnected) { desligaNuvem(); return; }
    if (ev.tipo === 'nuvem-mudou' || (ev.tipo === 'salvo' && ev.nuvem)) depois(); // chegou do outro aparelho, ou terminou de subir (tira o "esperando internet")
  });

  tela.addEventListener('click', async (e) => {
    const mb = e.target.closest('[data-menu]');
    if (mb) { e.stopPropagation(); menu(mb); return; }
    const c = e.target.closest('.cartao-m[data-id]'); if (c) location.hash = '#/m/' + c.dataset.id;
  });
  tela.addEventListener('keydown', (e) => { if (e.key === 'Enter' && e.target.matches('.cartao-m[data-id]')) location.hash = '#/m/' + e.target.dataset.id; });

  async function menu(botao) {
    document.querySelector('.menu-flut')?.remove(); document.querySelector('.menu-fundo')?.remove();
    const id = botao.dataset.menu, resumo = [...lista.minhas, ...lista.equipe].find((m) => m.id === id); const minha = ehMinha(resumo);
    // o menu fica "preso" embaixo do botão e rola junto com a tela; se não couber, a tela desce até ele aparecer inteiro
    const larg = tela.querySelector('.larg'), base = larg.getBoundingClientRect(), r = botao.getBoundingClientRect();
    const mn = el(`<div class="menu-flut menu-anc" role="menu">
      <button data-a="abrir">✏️ ${minha ? 'Abrir e editar' : 'Abrir'}</button><button data-a="historia">📖 Apresentar história</button><button data-a="passeio">🚶 Passear dentro</button>
      <button data-a="compartilhar">📤 Compartilhar (WhatsApp / QR)</button><button data-a="comparar">⚖️ Comparar com…</button><button data-a="duplicar">📄 Duplicar</button>
      ${minha ? '<button data-a="renomear">🏷️ Renomear</button><button data-a="excluir" class="perigo">🗑️ Apagar</button>' : ''}</div>`);
    larg.append(mn);
    const w = mn.offsetWidth, esq = Math.max(8 - base.left, Math.min(r.right - w - base.left, innerWidth - w - 8 - base.left));
    mn.style.top = (r.bottom - base.top + 6) + 'px'; mn.style.left = esq + 'px';
    // quanto falta para o menu aparecer inteiro; se a página acaba antes, ganha um espaço extra embaixo (some ao fechar)
    let espaco = null;
    const topoLarg = larg.getBoundingClientRect().top - tela.getBoundingClientRect().top + tela.scrollTop;
    const precisa = topoLarg + mn.offsetTop + mn.offsetHeight + 14 - (tela.scrollTop + tela.clientHeight);
    if (precisa > 0) {
      const sobra = tela.scrollHeight - (tela.scrollTop + tela.clientHeight);
      if (sobra < precisa) { espaco = el(`<div class="menu-espaco" style="height:${Math.ceil(precisa - sobra)}px"></div>`); larg.append(espaco); }
      tela.scrollBy({ top: precisa, behavior: matchMedia('(prefers-reduced-motion: reduce)').matches ? 'auto' : 'smooth' });
    }
    const fechar = () => { mn.remove(); espaco?.remove(); document.removeEventListener('pointerdown', fecha); };
    const fecha = (ev) => { if (!mn.contains(ev.target)) fechar(); };
    setTimeout(() => document.addEventListener('pointerdown', fecha));
    mn.onclick = async (ev) => {
      const a = ev.target.closest('[data-a]')?.dataset.a; if (!a) return; fechar();
      if (a === 'abrir') location.hash = '#/m/' + id;
      if (a === 'historia') location.hash = '#/m/' + id + '/historia';
      if (a === 'passeio') location.hash = '#/m/' + id + '/passeio';
      if (a === 'comparar') location.hash = '#/comparar/' + id;
      if (a === 'compartilhar') { const m = await abrir(id); if (m) { const { compartilhar } = await import('../compartilhar.js'); compartilhar(m, carregar); } }
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

// ------------------------------------------------ visitante: exposição de maquetes (só olhar)
async function exposicao(app) {
  app.append(topo());
  const tela = el(`<div class="tela"><div class="larg">
    <section class="heroi heroi--expo"><div class="heroi-nuvens"></div>
      <h1>🏛️ Exposição de maquetes</h1><p>Toque num bairro para ver em 3D, na planta, passear por dentro e conhecer a história.</p>
      <div class="heroi-bts"><button class="bt bt--sol bt--gde" id="tour">▶ Apresentar todos</button><a class="bt bt--gde" href="#/comparar">⚖️ Comparar</a><button class="bt bt--gde" id="expo2">📤 Compartilhar</button><button class="bt bt--gde esconde" id="inst2">📲 Instalar o app</button></div>
    </section>
    <div class="grade-m" id="expo"><div class="vazio-lista" style="grid-column:1/-1">Carregando a exposição…</div></div>
    <div class="dica-cx" style="margin-top:22px">👀 Você está no <b>modo visitante</b>: dá para ver tudo, mas não dá para mudar nada. Quem tem conta pode tocar em <b>🔑 Entrar</b> para editar.</div>
    <div class="rodape">Bairro Ideal · por Elaine Freitas Muniz · <a href="#/privacidade">Privacidade e cookies</a></div>
  </div></div>`);
  app.append(tela);
  // sem planilha, na 1ª vez: já deixa os dois bairros de exemplo na exposição
  let primeira = false; try { primeira = !localStorage.getItem('bi:exemplos'); } catch { /* */ }
  if (!estado.nuvem && primeira) {
    try { localStorage.setItem('bi:exemplos', '1'); } catch { /* */ }
    estado.visitante = false; for (const id of ['carente', 'ideal']) await salvar(prepararParaSalvar(MODELOS.find((x) => x.id === id).criar())); estado.visitante = true;
  }
  const { equipe } = await listar(); const g = tela.querySelector('#expo');
  g.innerHTML = equipe.length ? equipe.map((m) => `<div class="cartao-m cartao-expo" role="button" tabindex="0" data-id="${m.id}">
      <div class="th">${m.thumb ? `<img src="${m.thumb}" alt="">` : '<span class="vazio">🗺️</span>'}</div>
      <div class="info"><b>${esc(m.nome)}</b><small>${m.cidade ? '📍 ' + esc(m.cidade) + ' · ' : ''}${num(m.pecas)} peças${m.donoNome ? ' · por ' + esc(m.donoNome.split(' ')[0]) : ''}</small>
      <div class="linha">${chipTipo(m.tipo)}<span class="nota" style="color:${corNota(m.nota)}">${notaTxt(m.nota)}</span></div>
      <div class="expo-b"><button class="bt" data-v="ver">🧊 Ver</button><button class="bt" data-v="comp" title="Compartilhar">📤</button><button class="bt" data-v="historia">📖 História</button><button class="bt" data-v="passeio">🚶 Passear</button></div></div></div>`).join('')
    : `<div class="vazio-lista" style="grid-column:1/-1">Ainda não há maquetes na exposição${navigator.onLine ? '' : ' (e o aparelho está sem internet)'}.</div>`;
  tela.querySelector('#tour').disabled = !equipe.length;
  tela.querySelector('#expo2').onclick = async () => (await import('../compartilhar.js')).compartilharSite();
  ligarInstalar(tela.querySelector('#inst2'));
  tela.querySelector('#tour').onclick = () => { try { sessionStorage.setItem('bi:tour', JSON.stringify(equipe.map((m) => m.id))); } catch { /* */ } location.hash = '#/m/' + equipe[0].id + '/historia'; };
  g.addEventListener('click', (e) => {
    const c = e.target.closest('[data-id]'); if (!c) return; const v = e.target.closest('[data-v]')?.dataset.v || 'ver';
    if (v === 'comp') { abrir(c.dataset.id).then(async (m) => { if (m) (await import('../compartilhar.js')).compartilhar(m); }); return; }
    try { sessionStorage.removeItem('bi:tour'); } catch { /* */ }
    location.hash = '#/m/' + c.dataset.id + (v === 'ver' ? '' : '/' + v);
  });
}

// botão "Instalar o app" aparece quando o aparelho deixa instalar
async function ligarInstalar(b) {
  const { podeInstalar, pedirInstalacao } = await import('../instalar.js');
  const ver = () => b.classList.toggle('esconde', !podeInstalar()); ver(); document.addEventListener('bi:instalavel', ver);
  b.onclick = async () => { await pedirInstalacao(); ver(); };
}
