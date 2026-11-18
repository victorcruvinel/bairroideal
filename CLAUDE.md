# CLAUDE.md · Bairro Ideal

Projeto do **Victor Soares Cruvinel** (sozinho). Fale sempre em **português do Brasil**, linguagem simples (ele não é programador experiente). Mac antigo (sem `gh`), Firefox no Mac, Safari no iPhone 15, iPad.
Pedido original: app para a professora dele montar **maquetes de bairros** (ideal × carente), "literalmente um joguinho", bonito e intuitivo. Ele quer **fotos de tudo** enquanto o código é feito.

## Decisões
- Visual: fusão dos modelos A (caderno: papel pontilhado, Fredoka + Nunito, verde #1f6f50, sol #ffc93c, coral #ff7a59) e B (jogo: barra de peças embaixo, botões gordinhos, desafios). Referências em `docs/modelos/`. NÃO copiar o visual do Achei!/Mostratec.
- Mapa sem limite: `m.chao` é um dicionário "x,y" → tipo (esparso). Terreno cresce/corta em qualquer formato.
- Motor próprio em canvas 2D (`public/js/motor.js`): isométrico que gira 90°, planta, noite; só desenha o que aparece. Peças em `pecas.js` (desenho + efeitos `f` para o termômetro). Passeio 1ª pessoa com three.js (`public/vendor/three.module.min.js`, r170, sem CDN).
- Termômetro (`termometro.js`) por distância (escola 10, saúde 12, lazer 7, estação de água 25, caixa d'água 5, postes 3).
- Dados: IndexedDB no aparelho (sempre) + nuvem (Apps Script) quando logado; maquete vai comprimida (gzip+base64) e a planilha guarda em pedaços de 45 mil letras (aba Dados). Fila de pendentes sobe quando a internet volta.
- Login: só código no e-mail (6 números, 10 min, 5 tentativas, 8/hora). 1º acesso só `ADMIN_EMAIL` = hello@victorcruvinel.dev (vira admin). Convites na tela Pessoas (admin). Sessão 30 dias (hash).
- Token Worker ↔ Apps Script: `BAIRRO_TOKEN` (segredo no Cloudflare + propriedade do script). O valor NUNCA vai para o repositório.
- E-mails: alias noreply@victorcruvinel.dev se existir; sem emoji de 4 bytes.
- Proteção (`protecao.js`): sem botão direito, copiar/colar, atalhos de salvar/imprimir/código-fonte, sem pinça; zoom só pelo navegador.
- Privacidade e cookies: `#/privacidade` + aviso na 1ª visita.
- Abertura animada sempre que o app abre (`abertura.js`), dá para pular.

## Rodada 2 (17/11 à noite)
- **Porta de entrada** (`telas/porta.js`, rota `#/porta`) depois da abertura: Visitar × Entrar. Contas só o Victor/admin cria; a professora só entra.
- **Visitante** (`estado.visitante`, sessionStorage `bi:visitante`): Apps Script `publico.listar` / `publico.abrir` sem login, só maquetes com `publica` ≠ 'nao' (checkbox "Mostrar na exposição" na aba Sobre). Editor abre em modo só ver (`.so-ver`). Cache no IndexedDB com `conta: 'visitante'` para apresentar offline. "Apresentar todos" = sessionStorage `bi:tour` no modo história.
- Sem planilha (modo local): "Entrar" = `editarLocal()` (sessionStorage `bi:editor-local`).
- **Matemática** (`matematica.js`): aba 📐 em estilo lousa (fonte Caveat), régua (tecla M), plano cartesiano (y cresce para cima: y = −linha), linha "Em números" no Comparar e capítulo "O bairro em números" na história automática.

## Rodada 3
- O site é um **presente para a professora**: nome do Victor fora do site. Marca: "Bairro Ideal" + embaixo "por Elaine Freitas Muniz" (abertura, porta, topo, entrar, história, rodapés, e-mails).
- Copiar/colar: liberado só com conta (`data-copiar="sim"` no `<html>`, definido no router); visitante bloqueado.
- Passeio: controles de toque sempre que a tela aceita toque (joystick fixo, correr, pular/subir, descer ao voar). Teste: `node test/passeio-toque.mjs` (iPad e iPhone com toque simulado).

## Rodada 4
- Instalar: `js/instalar.js` (beforeinstallprompt + passo a passo iOS), 1 vez por sessão na porta/início; botão "Instalar o app" no herói.
- Atualização forçada: `js/atualizar.js` confere `/versao.json` (no-store) ao abrir, a cada 60 s e ao voltar ao app; se mudou: salva (perguntarSaida), apaga caches, recarrega. `sw-base.js`: navegação pela rede primeiro, arquivos com cache por versão (`cache: 'reload'` na instalação). `_headers` com no-cache em js/css.
- Compartilhar: `js/compartilhar.js` (arte 1200×630 no canvas, QR com `vendor/qrcode.js`, WhatsApp, tela cheia). Worker: `/v/ID` = index.html com og:tags da maquete (Apps Script `publico.meta`), `/og/ID.jpg` = arte (aba Artes, `publico.arte`; salva por `arte.salvar`), cache 1 h. Maquete precisa estar na exposição.
- Carregando: `carregando()` em ui.js (aparece após 150 ms), usado no router.
- Passeio: velocidade com aceleração/freio, pulo andando (segurar = pula de novo), botões por pointerdown (multitoque), olhar suave com o dedo.
- Matemática: `htmlMatematica()` em matematica.js: ideia → passos → resultado → prova real; desafios com resposta.

## Rodada 5 (17-18/11): editor simplificado
- Ferramentas agora são só 4: ✏️ Colocar, ✋ Mover, 🧽 Apagar, 📐 Terreno. Tirados: tesoura (Cortar), Aumentar, Balde, bolinhas de tamanho do pincel e botão Crescer.
- Colocar com chão (grama, rua…): tocar pinta 1 quadradinho; arrastar pinta vários. Apagar: tira a peça; no chão pintado, volta a ser grama.
- 📐 Terreno: setas ➜＋ (aumentar) e － (diminuir) em volta do terreno (`mudarTerreno` em editor.js). Arrastar no mapa escolhe uma parte (azul) para fazer L. Painel na doca com medidas em m² e botões "Terreno todo", "Crescer em volta", "Pronto".
- Pinça (zoom) LIGADA no mapa do editor: dois dedos (pointer events), trackpad (wheel com ctrlKey) e Safari do Mac (gesturechange). No resto do app a pinça continua bloqueada (protecao.js). No toque, a ação espera 110 ms para não colocar peça sem querer quando é pinça.
- Exposição: botões do cartão não cortam mais.
- Service worker corrigido (18/11): nunca entrega resposta redirecionada (o Cloudflare redireciona /index.html → /; o Safari dava "Response served by service worker has redirections"). Quem tinha a versão quebrada precisou limpar os dados do site uma vez.
- Testes novos: `node test/pinca.mjs` (iPad), `node test/service-worker.mjs`; `test/interacoes.mjs` testa as setas do terreno e o L.

## PENDENTE (próxima sessão começa aqui)
Última publicação: 7f20b20 (18/11) = painel do Terreno arrumado no iPad em pé (dica embaixo, sem coluna fininha). Todos os testes passaram (npm test 24, interacoes, pinca, passeio-toque, login, atualizar-instalar, service-worker). Fotos do Terreno (computador, iPad, celular, L) já mandadas.
1. Conferir se o build do Cloudflare do 7f20b20 deu "success" (nesta sessão a rede bloqueou o site e não havia ferramenta para ver os checks; pedir ao Victor olhar no painel).
2. Conferir com o Victor no iPad: pinça no mapa, setas do terreno, fazer um L. Ajustar o que ele pedir.
3. (Ideia) No iPad em pé o mapa fica pequeno no modo Terreno (sobra espaço em cima); dá para aproximar mais.
4. (Opcional) O e-mail de contato da política de privacidade ainda é hello@victorcruvinel.dev; ele pode querer trocar.

## Infra
- Cloudflare Workers: `wrangler.jsonc` (nome `bairroideal`, domínio bairroideal.victorcruvinel.dev). `worker/index.js` entrega `public/`, faz `/api` → Apps Script, monta `/sw.js` com a versão do deploy. Sem `APPS_SCRIPT_URL` = modo local (sem login).
- Cloudflare Builds (17/11): o painel usa `npx wrangler preview` (precisa de wrangler novo; fixado 4.164.0). Produção: branch `main`, comando `npx wrangler deploy`.
- Branch de trabalho: `claude/bairro-ideal-mockup-app-6j87sk`. **Publicar sempre também na `main`** (autorizado pelo Victor em 17/11; o Cloudflare publica a partir da `main`).

## Testes
- `npm test` (Node puro: Codigo.gs com Google falso, Worker, termômetro, matemática, CSS).
- Playwright (Chromium já instalado no ambiente; use `PW=$(npm root -g)/playwright`). Precisam de `node test/servidor.mjs 8090` rodando: `interacoes.mjs`, `passeio-toque.mjs`, `pinca.mjs`.
- Sobem o próprio servidor: `login.mjs` (8091, com planilha falsa), `atualizar-instalar.mjs` (8092), `service-worker.mjs` (8093).
- Rodar SEMPRE antes de publicar.

## Como começar uma sessão nova (para não trabalhar em versão velha)
1. `git fetch origin` e trabalhar em cima de `origin/main` (é a versão publicada e mais nova). Se o branch de trabalho estiver atrás, `git merge origin/main`.
2. Publicar: push no branch de trabalho **e** `git push origin HEAD:main`. Conferir o build do Cloudflare.
3. Site: https://bairroideal.victorcruvinel.dev · Repositório: victorcruvinel/bairroideal · Painel do Cloudflare: Workers & Pages → bairroideal (produção = `main`, deploy = `npx wrangler deploy`).
4. Mandar fotos (prints) de tudo que mudar. Falar português simples.
