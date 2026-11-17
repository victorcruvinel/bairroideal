// Bairro Ideal · política de privacidade e cookies (LGPD) + aviso de cookies na primeira visita
import { el } from '../ui.js';
import { topo } from './comum.js';

export function cookies() {
  try { if (localStorage.getItem('bi:cookies')) return; } catch { return; }
  const c = el(`<div class="cookies" role="region" aria-label="Aviso de cookies"><div class="em">🍪</div>
    <p>O Bairro Ideal guarda no seu aparelho só o necessário para funcionar (suas maquetes e o login). Não usamos cookies de propaganda nem de rastreamento. <a href="#/privacidade">Ler a política</a></p>
    <button class="bt bt--sol">Entendi</button></div>`);
  c.querySelector('button').onclick = () => { try { localStorage.setItem('bi:cookies', new Date().toISOString()); } catch { /* */ } c.remove(); };
  document.body.append(c);
}

export function montar(app) {
  app.append(topo({ voltar: true }));
  const t = el(`<div class="tela"><article class="texto">
  <h1>Privacidade e cookies</h1>
  <p><small>Atualizada em 17 de novembro de 2026</small></p>
  <p>O <b>Bairro Ideal</b>, da professora <b>Elaine Freitas Muniz</b>, é um site educativo para criar maquetes de bairros. Esta página explica, em linguagem simples, quais dados o site usa e por quê, de acordo com a Lei Geral de Proteção de Dados (LGPD, Lei nº 13.709/2018).</p>
  <h2>1. Quem cuida dos seus dados</h2>
  <p>Os dados são cuidados pela equipe responsável pelo Bairro Ideal. Contato para qualquer assunto de privacidade: <b>hello@victorcruvinel.dev</b>.</p>
  <h2>2. Quais dados usamos</h2>
  <table><tr><th>Dado</th><th>Para quê</th><th>Base legal</th></tr>
  <tr><td>Nome e e-mail</td><td>Criar a conta, enviar o código de acesso e os convites</td><td>Execução do serviço que você pediu</td></tr>
  <tr><td>Maquetes e textos (história, capítulos)</td><td>Guardar e mostrar as maquetes que você cria</td><td>Execução do serviço</td></tr>
  <tr><td>Data do último acesso</td><td>Segurança da conta</td><td>Legítimo interesse</td></tr></table>
  <p>Não pedimos CPF, endereço, telefone, localização, câmera nem microfone. Não vendemos nem compartilhamos dados para propaganda.</p>
  <h2>3. Onde os dados ficam</h2>
  <ul><li><b>No seu aparelho</b>: as maquetes ficam guardadas no navegador para o app funcionar mesmo sem internet.</li>
  <li><b>Google (Planilhas e Gmail)</b>: as contas e as maquetes ficam numa planilha do Google do responsável pelo site, e os e-mails de código e convite saem pelo Gmail.</li>
  <li><b>Cloudflare</b>: hospeda o site e faz a ponte com a planilha.</li>
  <li><b>Google Fonts</b>: as letras do site vêm do Google, que recebe o endereço IP de quem abre a página.</li></ul>
  <h2>4. Cookies e armazenamento no aparelho</h2>
  <p>Usamos só armazenamento <b>essencial</b>, sem o qual o site não funciona:</p>
  <table><tr><th>Nome</th><th>O que guarda</th><th>Por quanto tempo</th></tr>
  <tr><td>bi:sessao / bi:usuario</td><td>Seu login (um código aleatório) e seu nome</td><td>30 dias ou até sair da conta</td></tr>
  <tr><td>Banco "bairroideal" (IndexedDB)</td><td>Suas maquetes, para abrir sem internet</td><td>Até você apagar a maquete ou limpar o navegador</td></tr>
  <tr><td>bi:cookies, bi:nuvem e preferências</td><td>Se você já viu este aviso e ajustes da tela</td><td>Até limpar o navegador</td></tr>
  <tr><td>Cache do app (service worker)</td><td>Os arquivos do site, para abrir mais rápido e sem internet</td><td>Até a próxima versão do site</td></tr></table>
  <p>Não há cookies de publicidade, de redes sociais nem de análise de comportamento.</p>
  <h2>5. Por quanto tempo guardamos</h2>
  <p>A conta e as maquetes ficam guardadas enquanto a conta existir. O código de acesso vale 10 minutos. Sessões vencidas são apagadas automaticamente. Se a conta for removida, as maquetes podem ser apagadas pelo administrador a pedido.</p>
  <h2>6. Seus direitos</h2>
  <p>Você pode pedir a qualquer momento: confirmação de que usamos seus dados, acesso, correção, apagamento da conta e das maquetes, e informações sobre com quem os dados são compartilhados. Basta escrever para <b>hello@victorcruvinel.dev</b>. Você também pode reclamar à ANPD (Autoridade Nacional de Proteção de Dados).</p>
  <h2>7. Segurança</h2>
  <p>O acesso é feito por código enviado ao e-mail (sem senha para vazar). Os códigos e as sessões são guardados de forma embaralhada (hash). A comunicação usa HTTPS.</p>
  <h2>8. Crianças e escolas</h2>
  <p>O app foi pensado para professores e turmas. Contas são criadas apenas por convite do administrador. Recomendamos não escrever dados pessoais de alunos nas histórias das maquetes.</p>
  <h2>9. Mudanças</h2>
  <p>Se esta política mudar, a data no topo será atualizada.</p>
  </article><div class="rodape">Bairro Ideal · por Elaine Freitas Muniz</div></div>`);
  app.append(t);
}
