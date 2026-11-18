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

## Rodada 6 (18/11)
- Carregando novo (`carregando()` em ui.js): mini-maquete 3×3 desenhada com o motor de verdade (lapis + OBJETOS), chão sobe, peças caem quicando, 3 cenas que se revezam; pontinhos verde/sol/coral; dicas atualizadas (sem balde).
- 📐 Terreno em todos os aparelhos: ao entrar/sair o mapa se reenquadra deixando folga para as setas (`areaUtil` com margem); até 1180 px de largura o painel lateral some no modo Terreno (mapa maior no iPad); a câmera se afasta sozinha se o terreno crescer para fora (`seguirTerreno`). No celular: dica curta, sem botões noite/régua/x-y no Terreno. iPhone SE: botões da direita menores.

## Rodada 7 (18/11): ícone, editor com Tocar, celular
- Ícone novo (`img/icone.svg`, 512): céu, sol, nuvem, ilha centralizada com rua, casinha e árvores. PNGs gerados por `node test/gerar-imagens.mjs` (192/512 arredondados, 180 reto para o iPhone, maskable com desenho menor). A logo do site usa o mesmo SVG.
- Editor abre no **👆 Tocar** (sem peça escolhida): tocar seleciona, arrastar anda, pinça aproxima. Ferramentas: Tocar, Colocar, Mover, Apagar, Terreno (teclas 1-5). Sair do Colocar tira a peça escolhida. Colocar sem peça: aviso "Escolha uma peça".
- Menu **👁️ Ver** (botão na coluna da direita) com chaves: Grade (`opt.grade` no motor; tecla G; guardada em `bi:editor`), Régua, Plano cartesiano, Noite. Bolinha mostra quantas estão ligadas.
- Janelinha da peça com nomes: Girar, Cor, Mover, Usar, Apagar, Fechar. Nunca sobe por cima da barra de cima.
- Celular (≤760): barra de ferramentas embaixo (como app); gaveta de peças só no Colocar/Terreno; escolher peça encolhe a gaveta (`doca-mini`, botão "trocar ▴"); peça tocada vira cartão embaixo; avisos aparecem em cima; uma dica por vez.
- `protecao.js`: o bloqueio de toque duplo não vale mais para botões/canvas (engolia o 2º toque rápido). Botões com `touch-action: manipulation`.
- `.ed { overflow: clip }`: o editor não rola mais (no iPad o painel escondido aparecia).

## Rodada 8 (18/11): salvar de verdade, desfazer/refazer, menu do cartão
- **Salvar**: o editor NÃO salva mais sozinho na maquete. Cada mudança vira rascunho no aparelho (`localStorage` `bi:rascunho:<id>`, 0,7 s depois); a maquete/nuvem só muda no botão **💾 Salvar** (topo, fica amarelo pulsando quando falta salvar; Ctrl+S).
- Sair com mudanças (‹, início, Passear, História, Comparar…): janela "Você ainda não salvou" com 💾 Salvar / 📝 Guardar rascunho / 🗑️ Descartar (confirma); ✕ = continuar editando (`perguntarSaida` no editor, chamado pelo router).
- Abrir maquete com rascunho: pergunta "Continuar o rascunho" ou "Abrir a versão salva" (avisa se a versão salva é mais nova).
- Atualização forçada do app: guarda rascunho sem perguntar (`guardarRascunho`), e ele aparece ao reabrir.
- Desfazer/refazer: ícones SVG (seta curva) num botão duplo `.ed-hist`; no celular aparecem os dois. Compartilhar no celular foi para a aba Sobre (📊).
- Menu ⋯ do cartão (inicio.js): mede a altura, abre para cima se não couber, nunca sai da tela; no celular (≤600) vira gaveta de baixo com fundo escuro.

## Rodada 9 (18/11): tela inicial
- Seção "Começar com um modelo pronto" saiu da tela inicial: os modelos aparecem na janela de **Nova maquete**.
- Menu ⋯ do cartão: fica preso embaixo do botão (absoluto dentro de `.larg`, rola junto com a `.tela`); se não couber, a `.tela` desce sozinha até ele aparecer inteiro (se a página acabar antes, ganha um espaço extra `.menu-espaco` que some ao fechar). Medida com `offsetHeight` (a animação começa menor).

## Rodada 10 (18/11): sincronização entre aparelhos
- Selo do topo (comum.js) agora é real: **Sincronizado** (verde), **Sincronizando…** (azul piscando), **N esperando para enviar** / **Sem internet · N para enviar** (amarelo). Vem de `estadoSinc()` + evento `sinc` em dados.js.
- Regra nova (dados.js): cada maquete local guarda `nuvemEm` = versão da nuvem que ela tem. Se a nuvem tiver outra e aqui não houver nada pendente, baixa (`daNuvem`). Não depende do relógio nem do formato de data da planilha. `atualizado` local vem de dentro dos dados (carimbo de quem salvou).
- `sincronizar()`: envia pendentes, lista a nuvem, baixa o que mudou, apaga o que foi apagado em outro aparelho (só se já esteve na nuvem e não tem nada pendente). Roda ao abrir, ao voltar ao app (visibilitychange), quando a internet volta, a cada 40 s e 20 s depois de uma falha.
- Evento `nuvem-mudou` ({ids}): o início recarrega a lista; o editor aberto troca pela versão nova se não tiver mudanças (senão avisa).
- Teste novo: `node test/dois-aparelhos.mjs` (porta 8094, planilha falsa; computador + iPad na mesma conta: nome, peças, sem internet, apagar). Se um teste com servidor ficar travado, `pkill -f "servidor.mjs 809"`.

## Rodada 11 (18/11): conta do desenvolvedor invisível
- `ADMIN_EMAIL` (hello@victorcruvinel.dev) = conta do **desenvolvedor**, invisível para os outros (`ehDev_` no Codigo.gs, `VENDO_` = quem pede): não aparece em Pessoas (`listarPessoas_` filtra), não pode ser removida nem perder o admin (`nao_achou`), convite que ela manda chega como "Você foi convidado(a) para o Bairro Ideal" (sem nome) e `convidadoPor` fica vazio.
- Maquetes dela aparecem para os outros com `dono: 'equipe'` e `donoNome: 'Equipe Bairro Ideal'` (visitante: vazio). São **da equipe**: entram em "Minhas maquetes" de quem entra (`minhaOuEquipe` em dados.js) e qualquer pessoa da conta pode editar/apagar (servidor libera `ehDev_(r.dono)`).
- `eu` devolve `dev: true` para ela; a tela Pessoas mostra o aviso "Sua conta é invisível".
- Convite com 2 cartões: 🎨 Usuário(a) (faz tudo nas maquetes, não cria contas) e ⭐ Administrador(a) (também convida/cria contas).
- Apps Script atualizado pelo Victor em 18/11 (Codigo.gs da Rodada 11 colado + nova versão implantada).

## Rodada 12 (18/11): carregando que travava e voo com limites
- Carregando infinito (Victor: terreno vazio → modo 3D no iPad): não reproduziu aqui (local, nuvem falsa, iPad, iPhone); a causa provável é pedido à nuvem sem limite de tempo. Agora `api()` tem tempo máximo (25 s, AbortController → erro `demorou`); `abrir()` com cópia no aparelho espera a nuvem só 6 s e abre a cópia; o router mostra "A internet está lenta…" aos 8 s e, aos 30 s, a tela de erro com **🔄 Tentar de novo**.
- Voo (passeio.js): só por cima de quadradinhos que existem (`sobreMaquete`, folga 0,3; desliza na beira, aviso "beira da maquete"); teto de **36** de altura (era 16; Victor pediu +20 em 18/11; aviso "Altura máxima"); a neblina se afasta com a altura e as nuvens somem acima de ~9–15 (senão tampam o bairro); ao pousar em prédio/água/fora vai para o lugar livre mais perto (`lugarParaPousar`).
- Teste novo: `node test/voo.mjs` (servidor 8090): terreno vazio abre no passeio; voa 6 s para fora e continua dentro; sobe até o teto; pousa e anda.

## Rodada 13 (18/11): colocar peça como jogo de construção + tutorial
- **Colocar peça (obj)**: tocar/arrastar NÃO coloca mais sozinho. Aparece a peça transparente (`S.mira`, `fantasmaEm`), no toque 56 px acima do dedo (`miraEm`). Toque: ao soltar aparece a barrinha `.ed-confirma` (✕ / 🔄 / ✓ Colocar); só coloca no ✓ (Enter também). Mouse: a peça segue o mouse e soltar coloca uma (`tentarColocar`). Chão (grama, rua…) continua pintando ao arrastar.
- **Lugar ocupado / fora do terreno / água**: janela "Já tem uma peça aqui" com Cancelar · ↔️ Pôr ao lado (`lugarLivrePerto`, até 14 quadradinhos) · 🔁 Substituir (só quando é peça em cima).
- **Tutorial** (`js/tutorial.js`): passo a passo com fundo escuro, destaque amarelo no botão e balão (Pular / Voltar / Próximo, Esc e setas). `TUTORIAL_INICIO` (8 passos) e `TUTORIAL_EDITOR` (12 passos); aparecem sozinhos 1 vez por aparelho (`bi:tutorial-inicio`, `bi:tutorial-editor`); botões **❓ Como usar** (início) e **❓** (coluna da direita do editor) abrem de novo. Passos cujo botão não está na tela são pulados. A dica antiga `bi:dica-editor` saiu.
- Testes: todos os testes de navegador marcam os tutoriais como vistos no `addInitScript`. Novo: `node test/tutorial.mjs` (8090). `pinca.mjs` agora testa deslizar sem colocar, o ✓, e "Pôr ao lado".

## Rodada 14 (18/11): abrir rápido (aparelho primeiro)
- Lentidão ao abrir maquete = esperar a planilha do Google (2–5 s por pedido). Agora **o aparelho vem primeiro**: `abrir()` devolve na hora a cópia do IndexedDB e chama `sincronizar()` por trás (se a nuvem mudou, `nuvem-mudou` atualiza a tela). Só espera a nuvem quando não há cópia no aparelho.
- Início: desenha na hora com `listar({ soAparelho: true })` e completa com a lista da nuvem por trás (`desenharLista`). Abrir o app: a conferência da conta (`eu`) é por trás quando já há usuário guardado.
- Medido com a nuvem demorando 3 s: abrir maquete 0,1–0,2 s; voltar ao início < 0,05 s. Passeio 3D ~1,3 s (montar a cena).
- `test/servidor.mjs` aceita `--lento=3000` (nuvem lenta). Teste novo: `node test/rapido.mjs` (porta 8096).

## Rodada 15 (18/11): revisão completa de abrir e salvar
- App abre sem esperar a internet: `/versao.json` com limite de 3 s (usa o último valor guardado); conta (`eu`) conferida por trás; service worker: página da internet só se chegar em 2,5 s, senão a guardada (a nova fica para a próxima).
- Abertura animada mais curta: `V = 1.6` em abertura.js (~2,4 s; continua pulável).
- Toda maquete aberta fica guardada no aparelho (também as da equipe e, no modo visitante, as da exposição) e abre na hora; a nuvem confere por trás (`sincronizar` para as minhas, `conferirUma` para as de outros/visitante) e avisa `nuvem-mudou` se mudou.
- Exposição (visitante): mostra na hora as já vistas neste aparelho e completa com a nuvem por trás.
- Admin que edita maquete de outra pessoa: a cópia local não duplica em "Minhas" (vai para "equipe").
- Salvar: se ela mexer enquanto salva, o botão continua "Salvar" e o rascunho guarda o que mudou depois.
- Medido (nuvem demorando 3 s): abrir maquete 0,1–0,2 s · voltar ao início < 0,05 s · criar maquete 0,6 s · salvar 0,07 s · abrir o app ~2,9 s (com a animação). `test/rapido.mjs` cobre criar → colocar → salvar → sair → abrir e confere que chegou na nuvem.

## PENDENTE (próxima sessão começa aqui)
Última publicação: Rodada 15 + teto do voo 36 (na `main` e no branch de trabalho). Victor disse em 18/11 de manhã: "ficou perfeito". Apps Script já atualizado pelo Victor. Todos os testes passaram (npm test 25, interacoes, pinca, passeio-toque, login, atualizar-instalar, service-worker, dois-aparelhos, voo, tutorial, rapido).
1. Conferir com o Victor se o build do Cloudflare de 3235b58 deu "success" (nesta sessão a rede bloqueava o site e não havia ferramenta para ver os checks).
2. Perguntar se abrir ficou rápido no iPad. Perguntar o que ele achou do jeito novo de colocar peça (✓) e do tutorial. Perguntar se o carregando do 3D voltou a travar (se sim, pedir print e o que estava fazendo). Conferir com ele no site de verdade: Pessoas sem a conta dele (aviso "Sua conta é invisível"); selo "Sincronizado" no topo; editar no iPad + Salvar e ver chegar no iPhone.
3. Quando ele convidar a professora: ver se o e-mail chegou sem o nome dele e se ela vê as maquetes de exemplo como "da equipe" e consegue editar.
4. (Opcional) O e-mail de contato da política de privacidade ainda é hello@victorcruvinel.dev.
5. Lembrete: mudanças no `apps-script/Codigo.gs` só valem depois que o Victor cola o código no Apps Script e implanta nova versão (README "Quando mudar o Codigo.gs"). Mandar o arquivo para ele (também como .txt).

## Infra
- Cloudflare Workers: `wrangler.jsonc` (nome `bairroideal`, domínio bairroideal.victorcruvinel.dev). `worker/index.js` entrega `public/`, faz `/api` → Apps Script, monta `/sw.js` com a versão do deploy. Sem `APPS_SCRIPT_URL` = modo local (sem login).
- Cloudflare Builds (17/11): o painel usa `npx wrangler preview` (precisa de wrangler novo; fixado 4.164.0). Produção: branch `main`, comando `npx wrangler deploy`.
- Branch de trabalho: `claude/sleepy-maxwell-6v3ph9` (antes: `claude/bairro-ideal-mockup-app-6j87sk`). **Publicar sempre também na `main`** (autorizado pelo Victor em 17/11; o Cloudflare publica a partir da `main`).

## Testes
- `npm test` (Node puro: Codigo.gs com Google falso, Worker, termômetro, matemática, CSS).
- Playwright (Chromium já instalado no ambiente; use `PW=$(npm root -g)/playwright`). Precisam de `node test/servidor.mjs 8090` rodando: `interacoes.mjs`, `passeio-toque.mjs`, `pinca.mjs`, `voo.mjs`, `tutorial.mjs`. Cuidado: `pkill -f "servidor.mjs 809"` também derruba o 8090.
- Sobem o próprio servidor: `login.mjs` (8091, com planilha falsa), `atualizar-instalar.mjs` (8092), `service-worker.mjs` (8093), `dois-aparelhos.mjs` (8094, planilha falsa), `rapido.mjs` (8096, planilha falsa lenta).
- Rodar SEMPRE antes de publicar.

## Como começar uma sessão nova (para não trabalhar em versão velha)
1. `git fetch origin` e trabalhar em cima de `origin/main` (é a versão publicada e mais nova). Se o branch de trabalho estiver atrás, `git merge origin/main`.
2. Publicar: push no branch de trabalho **e** `git push origin HEAD:main`. Conferir o build do Cloudflare.
3. Site: https://bairroideal.victorcruvinel.dev · Repositório: victorcruvinel/bairroideal · Painel do Cloudflare: Workers & Pages → bairroideal (produção = `main`, deploy = `npx wrangler deploy`).
4. Mandar fotos (prints) de tudo que mudar. Falar português simples.
