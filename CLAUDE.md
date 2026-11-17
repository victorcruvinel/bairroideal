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

## Infra
- Cloudflare Workers: `wrangler.jsonc` (nome `bairroideal`, domínio bairroideal.victorcruvinel.dev). `worker/index.js` entrega `public/`, faz `/api` → Apps Script, monta `/sw.js` com a versão do deploy. Sem `APPS_SCRIPT_URL` = modo local (sem login).
- Branch de trabalho: `claude/bairro-ideal-mockup-app-6j87sk`.

## Testes
`npm test` (Node puro) · `node test/interacoes.mjs` e `node test/login.mjs` (Playwright; o primeiro precisa de `node test/servidor.mjs 8090`).
