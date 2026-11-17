# 🏘️ Bairro Ideal

Aplicativo para montar **maquetes de bairros em 3D**, como um joguinho: ruas, casas, prédios, escola, posto de saúde, praça, lago, árvores, pessoas… e também os problemas de um **bairro carente** (barracos, lixo, esgoto a céu aberto, rua de terra). Dá para comparar os dois lado a lado e contar a história de cada bairro.

Bairro Ideal · **por Elaine Freitas Muniz**. Site: **https://bairroideal.victorcruvinel.dev**

## O que o app faz
- **Porta de entrada** depois da abertura: **👀 Visitar a exposição** (sem conta, só olhar) ou **🔑 Entrar com a conta** (criar e editar).
- **Modo visitante**: vê todas as maquetes marcadas como "Mostrar na exposição" (3D, planta, passeio, história, comparar, termômetro e matemática), sem conseguir editar. **▶ Apresentar todos** passa a história de um bairro depois do outro. As maquetes vistas ficam guardadas para apresentar sem internet.
- **Matemática** (aba 📐): área, perímetro, frações do uso do solo (com gráfico de pizza), densidade demográfica, verde por morador, distância até a escola (média, mediana e Pitágoras), a nota como média, escala da maquete. **📏 Régua** mede a reta entre dois pontos (Δx, Δy, √(Δx²+Δy²), caminho a pé, inclinação e ângulo) e **x y** mostra o plano cartesiano.
- **Abertura animada** toda vez que abre (o bairro se monta sozinho).
- **Editor**: barra de peças embaixo (mais de 65 peças em 7 categorias), ferramentas (colocar, mover, apagar, aumentar e cortar o terreno, balde, crescer), pincel de 3 tamanhos, girar, desfazer/refazer, cores diferentes para cada peça.
- **Mapa do tamanho que quiser**: o terreno cresce para qualquer lado e pode ser recortado em qualquer formato.
- **Vistas**: 3D isométrico que gira, **planta** vista de cima, **modo noite** (postes e janelas acesas) e **passeio em 1ª pessoa** estilo blocos (WASD + mouse, joystick no celular, voar).
- **Termômetro do bairro**: 9 notas calculadas pela posição das peças (natureza, moradia, água e esgoto, educação, saúde, lazer, ruas, iluminação, limpeza), nota de 0 a 10, **metas**, **problemas encontrados** e dicas. Balõezinhos mostram o que melhorou a cada peça.
- **Modo história (apresentação)**: capítulos com a câmera voando pelo bairro e uma coruja narradora. Pode ler em voz alta. Se não houver capítulos, o app cria uma história automática.
- **Comparar**: lado a lado ou com cortina deslizante, mais a tabela de diferenças.
- **Contas**: login só com **código no e-mail**. O primeiro acesso é do administrador (hello@victorcruvinel.dev), que convida as outras pessoas na tela **Pessoas**.
- **Funciona sem internet** (tudo é salvo no aparelho e sobe para a planilha quando a internet volta).
- **Proteção**: sem botão direito e sem zoom de pinça. Copiar e colar só para quem entrou com a conta (visitante não copia). **Política de privacidade e cookies** (LGPD) em `#/privacidade`.

Sem a planilha ligada, o site funciona em **modo local**: não pede login e guarda as maquetes só no aparelho.

---

## Passo a passo para colocar no ar

### 1) Cloudflare (o site)
1. No painel do Cloudflare: **Workers e Pages → Criar → Importar um repositório** e escolha `victorcruvinel/bairroideal`.
2. Branch de produção: **`main`**. Comando de build: deixe vazio. Comando de deploy: `npx wrangler deploy`.
3. O endereço **bairroideal.victorcruvinel.dev** já está no `wrangler.jsonc` e é ligado sozinho no primeiro deploy.

### 2) Planilha + Apps Script (o banco de dados)
1. Crie uma planilha nova no Google Drive (por exemplo, "Bairro Ideal - banco").
2. Menu **Extensões → Apps Script**. Apague o que estiver lá e cole o arquivo [`apps-script/Codigo.gs`](apps-script/Codigo.gs) inteiro. Salve (💾).
3. Clique na **engrenagem (Configurações do projeto)** → **Propriedades do script** → **Adicionar propriedade**:
   - Propriedade: `BAIRRO_TOKEN`
   - Valor: *o token que o Claude te mandou no chat* (não fica no GitHub)
4. Volte ao editor, escolha a função **`configurar`** no menu de cima e clique em **Executar**. Autorize o acesso (Avançado → Acessar projeto).
5. (Opcional) Rode **`testarEmail`** para receber um e-mail de teste.
6. **Implantar → Nova implantação → engrenagem → App da Web**:
   - Executar como: **Eu**
   - Quem pode acessar: **Qualquer pessoa**
   - Clique em **Implantar** e copie o link que termina em **`/exec`**.

> Os e-mails saem de **noreply@victorcruvinel.dev** se esse endereço existir como "alias" no seu Gmail (Configurações do Gmail → Contas → Enviar e-mail como). Se não existir, saem do seu próprio e-mail.

### 3) Ligar o site na planilha
No Cloudflare: **Workers e Pages → bairroideal → Configurações → Variáveis e segredos**:
- `APPS_SCRIPT_URL` (tipo **Texto**) = o link `/exec` do passo 2.6
- `BAIRRO_TOKEN` (tipo **Segredo**) = o mesmo token do passo 2.3

Salve e implante de novo, se o painel pedir.

### 4) Primeiro acesso
Abra o site, digite **hello@victorcruvinel.dev**, receba o código, escreva nome e sobrenome. Pronto, você é o administrador. Para convidar alguém: ícone da sua conta → **Pessoas** → digite o e-mail → **Enviar convite**.

### Quando mudar o Codigo.gs
Cole o novo código, salve e vá em **Implantar → Gerenciar implantações → lápis (editar) → Versão: Nova versão → Implantar**. Assim o link `/exec` continua o mesmo.

---

## Para quem programa
```
npm test                       # testes do Codigo.gs (com um Google de mentira), do Worker, do termômetro e do CSS
node test/servidor.mjs 8090    # abre o app em http://localhost:8090 (modo local)
node test/servidor.mjs 8090 --planilha   # com o Codigo.gs rodando num Google de mentira
node test/interacoes.mjs       # usa o editor com o mouse (servidor na 8090)
node test/login.mjs            # login por código, nuvem e convites (sobe o servidor sozinho na 8091)
node test/gerar-imagens.mjs    # refaz os ícones e a imagem de compartilhar
```
Pastas: `public/` (site), `public/js/telas/` (cada tela), `worker/` (Cloudflare), `apps-script/` (planilha), `test/`, `docs/modelos/` (os modelos visuais aprovados).
