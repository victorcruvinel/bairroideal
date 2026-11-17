// Bairro Ideal · entrar só com código no e-mail (sem senha). Primeiro acesso pede nome e sobrenome.
import { el, esc, aviso } from '../ui.js';
import { api, estado, guardarUsuario } from '../dados.js';
import { indexar, desenhar, enquadrar } from '../motor.js';
import { bairroIdeal } from '../modelos.js';

const ERROS = {
  email: 'Esse e-mail não parece certo. Confira e tente de novo.',
  nao_convidado: 'Esse e-mail ainda não foi convidado. Peça um convite para quem administra o Bairro Ideal.',
  espere: 'Acabamos de mandar um código. Espere uns segundos antes de pedir outro.',
  muitos: 'Foram pedidos muitos códigos. Tente de novo daqui a 1 hora.',
  envio: 'Não consegui mandar o e-mail agora. Tente de novo em instantes.',
  expirou: 'O código venceu ou teve tentativas demais. Peça um novo.',
  nome: 'Escreva seu nome e sobrenome.',
  sem_internet: 'Sem internet. Conecte e tente de novo.',
  token: 'O site e a planilha não estão combinando o token. Confira o BAIRRO_TOKEN nos dois lugares.',
};
const erroTxt = (r) => (r.erro === 'codigo' ? `Código errado. ${r.restam === 1 ? 'Resta 1 tentativa.' : `Restam ${r.restam} tentativas.`}` : ERROS[r.erro] || 'Algo deu errado (' + esc(r.erro || '?') + '). Tente de novo.');

export function montar(app) {
  const t = el(`<div class="entrar">
    <div class="entrar-arte"><canvas></canvas><div class="frase">Monte, compare e conte a história dos bairros. 🏘️</div></div>
    <div class="entrar-lado"><div class="entrar-cx"></div></div></div>`);
  app.append(t);
  // desenho do bairro ao lado
  const cv = t.querySelector('canvas'), ix = indexar(bairroIdeal());
  const pintar = () => { const r = cv.getBoundingClientRect(), d = Math.min(2, devicePixelRatio || 1); cv.width = r.width * d; cv.height = r.height * d; const ctx = cv.getContext('2d'); ctx.setTransform(d, 0, 0, d, 0, 0); desenhar(ctx, ix, enquadrar(ix, r.width, r.height * .8, 0, false, .95), r.width, r.height * .85, {}); };
  requestAnimationFrame(pintar); addEventListener('resize', pintar);
  const cx = t.querySelector('.entrar-cx');
  let email = '', estadoConta = 'codigo', nomeSugerido = '';

  if (!estado.nuvem) {
    cx.innerHTML = `<img src="/img/icone.svg" alt="" width="64" height="64"><h1>Modo local</h1><p>A planilha ainda não está ligada, então não precisa entrar: tudo fica salvo neste aparelho.</p><a class="bt bt--sol bt--gde" href="#/">Começar</a>`;
    return { sair: () => removeEventListener('resize', pintar) };
  }
  passoEmail();

  function passoEmail(msg = '') {
    cx.innerHTML = `<img src="/img/icone.svg" alt="" width="64" height="64"><h1>Entrar</h1>
      <p>Digite seu e-mail. Vamos mandar um código de 6 números, sem senha.</p>
      <form class="entrar-f" style="display:grid;gap:14px" novalidate><label class="campo">E-mail<input type="email" name="email" autocomplete="email" inputmode="email" required value="${esc(email)}" placeholder="voce@email.com"></label>
      <div class="erro-msg">${msg}</div><button class="bt bt--sol bt--gde">Receber código ✉️</button></form>
      <p style="font-size:13px">Ao entrar você concorda com a <a href="#/privacidade">política de privacidade</a>.</p>`;
    const f = cx.querySelector('form'), inp = f.email; setTimeout(() => inp.focus(), 50);
    f.onsubmit = async (e) => {
      e.preventDefault(); email = inp.value.trim().toLowerCase(); const b = f.querySelector('button'); b.disabled = true; b.textContent = 'Enviando…';
      const r = await api('auth.codigo', { email });
      if (!r.ok) { b.disabled = false; b.textContent = 'Receber código ✉️'; f.querySelector('.erro-msg').textContent = erroTxt(r); if (r.erro === 'espere') passoCodigo(); return; }
      estadoConta = r.estado; nomeSugerido = r.nome || ''; passoCodigo();
    };
  }
  function passoCodigo(msg = '') {
    const novo = estadoConta === 'novo';
    cx.innerHTML = `<div style="font-size:48px">📬</div><h1>Confira seu e-mail</h1>
      <p>Mandamos um código para <b>${esc(email)}</b>. Pode levar um minutinho (olhe também o spam).</p>
      <form style="display:grid;gap:14px" novalidate>
        <div class="codigo">${Array.from({ length: 6 }, (_, i) => `<input inputmode="numeric" maxlength="1" aria-label="Número ${i + 1}" ${i === 0 ? 'autocomplete="one-time-code"' : 'autocomplete="off"'}>`).join('')}</div>
        ${novo ? `<label class="campo">Seu nome e sobrenome<input name="nome" autocomplete="name" maxlength="80" value="${esc(nomeSugerido)}" placeholder="Ex.: Maria Souza"></label>` : ''}
        <div class="erro-msg">${msg}</div><button class="bt bt--sol bt--gde">${novo ? 'Criar minha conta 🎉' : 'Entrar'}</button>
        <button type="button" class="bt bt--leve" data-v>‹ Usar outro e-mail</button></form>`;
    const caixas = [...cx.querySelectorAll('.codigo input')], f = cx.querySelector('form');
    setTimeout(() => caixas[0].focus(), 50);
    caixas.forEach((c, i) => {
      c.addEventListener('input', () => {
        const d = c.value.replace(/\D/g, ''); if (d.length > 1) { d.split('').slice(0, 6 - i).forEach((n, k) => { caixas[i + k].value = n; }); caixas[Math.min(5, i + d.length)].focus(); }
        else { c.value = d; if (d && i < 5) caixas[i + 1].focus(); }
        if (caixas.every((x) => x.value) && !novo) f.requestSubmit();
      });
      c.addEventListener('keydown', (e) => { if (e.key === 'Backspace' && !c.value && i) caixas[i - 1].focus(); });
    });
    cx.querySelector('[data-v]').onclick = () => passoEmail();
    f.onsubmit = async (e) => {
      e.preventDefault(); const codigo = caixas.map((x) => x.value).join(''); if (codigo.length < 6) { f.querySelector('.erro-msg').textContent = 'Digite os 6 números.'; return; }
      const b = f.querySelector('.bt--sol'); b.disabled = true;
      const r = await api('auth.confirmar', { email, codigo, nome: f.nome ? f.nome.value : '' });
      b.disabled = false;
      if (!r.ok) { if (r.erro === 'expirou') return passoEmail(erroTxt(r)); f.querySelector('.erro-msg').textContent = erroTxt(r); if (r.erro === 'codigo') { caixas.forEach((x) => { x.value = ''; }); caixas[0].focus(); } return; }
      guardarUsuario(r.usuario, r.sessao); aviso(`Bem-vindo(a), ${esc(r.usuario.nome.split(' ')[0])}! 🎉`); location.hash = '#/';
    };
  }
  return { sair: () => removeEventListener('resize', pintar) };
}
