# Aurum Blackjack · 21

Jogo de Blackjack (21) para um jogador contra o dealer, que roda inteiramente no navegador. Tem mesa de cassino
desenhada em CSS/SVG, cartas e fichas vetoriais, animações de distribuição, sons sintetizados, estatísticas e
progresso salvos localmente.

> Entretenimento com **fichas virtuais**. Nenhum dinheiro real é usado, e não há compras nem transações.

## Requisitos

- **Node.js 20.19+ ou 22.12+** (recomendado: a versão LTS mais recente). O npm já vem junto.
- Um navegador moderno (Chrome, Edge, Firefox ou Safari atualizados).

Não há backend: toda a lógica roda no navegador, então não é preciso Python nem banco de dados.

## Como executar

O passo a passo é o mesmo nos dois sistemas: instalar o Node.js uma vez, instalar as dependências do
projeto uma vez e iniciar o servidor sempre que for jogar.

### Linux (Ubuntu, Debian, Fedora…) e WSL

**1. Instale o Node.js** (pule se `node -v` já mostrar v20.19 ou mais recente):

```bash
curl -o- https://raw.githubusercontent.com/nvm-sh/nvm/v0.40.3/install.sh | bash
source ~/.bashrc
nvm install --lts
node -v    # deve mostrar a versão instalada
```

**2. Instale as dependências** (só na primeira vez):

```bash
cd ~/projetos/blackjack-21-jogo    # ajuste para o caminho onde está o projeto
npm install
```

**3. Inicie o jogo:**

```bash
npm run dev
```

**4. Abra no navegador:** http://localhost:5173

Para parar, pressione `Ctrl + C` no terminal.

> **No WSL:** abra o endereço no navegador do Windows normalmente. Se `localhost` não funcionar, use o
> endereço da linha `Network:` mostrada pelo `npm run dev` (ex.: `http://172.x.x.x:5173`).

### Windows (PowerShell ou Prompt de Comando)

**1. Instale o Node.js** (pule se `node -v` já mostrar v20.19 ou mais recente):

```powershell
winget install OpenJS.NodeJS.LTS
```

Se preferir, baixe o instalador "LTS" em https://nodejs.org. **Depois de instalar, feche e reabra o terminal.**

```powershell
node -v    # deve mostrar a versão instalada
```

**2. Instale as dependências** (só na primeira vez):

```powershell
cd C:\caminho\para\blackjack-21-jogo
npm install
```

**3. Inicie o jogo:**

```powershell
npm run dev
```

**4. Abra no navegador:** http://localhost:5173

Para parar, pressione `Ctrl + C` no terminal.

> Se o PowerShell bloquear o `npm` com um erro sobre *execution policy*, rode uma vez
> `Set-ExecutionPolicy -Scope CurrentUser RemoteSigned` ou use o Prompt de Comando (`cmd`).

### Jogar pelo celular

Com `npm run dev` rodando, conecte o celular ao mesmo Wi-Fi do computador e abra o endereço da linha
`Network:` exibida no terminal.

### Problemas comuns

| Sintoma | Solução |
| ------- | ------- |
| `node: command not found` / `'node' não é reconhecido` | Feche e reabra o terminal após instalar o Node (no Linux, `source ~/.bashrc` também resolve). |
| `Port 5173 is in use` | O Vite usa a próxima porta livre automaticamente; abra o endereço que aparecer no terminal. |
| Erro de versão ao rodar `npm run dev` | Atualize o Node para a versão LTS mais recente. |
| Página em branco após atualizar o projeto | Pare o servidor, rode `npm install` de novo e reinicie com `npm run dev`. |

### Outros comandos

| Comando             | O que faz                                                    |
| ------------------- | ------------------------------------------------------------ |
| `npm run dev`       | Servidor de desenvolvimento com recarga automática            |
| `npm test`          | Executa os testes automatizados (Vitest)                      |
| `npm run test:watch`| Testes em modo observação                                     |
| `npm run typecheck` | Verificação de tipos TypeScript                               |
| `npm run build`     | Gera a versão de produção em `dist/`                          |
| `npm run preview`   | Serve a versão de produção em http://localhost:4173           |

## Como jogar

1. **Aposte**: clique nas fichas (5, 25, 100, 500, 1K) para montar a aposta no círculo. Use *Desfazer*,
   *Limpar*, *Repetir* (aposta anterior) ou *x2*.
2. **Distribuir**: as cartas saem do shoe, uma por vez, nesta ordem: jogador, dealer, jogador e a carta fechada do dealer.
3. **Jogue**: *Pedir* (Hit), *Parar* (Stand), *Dobrar* (Double Down) ou *Dividir* (Split). Ações inválidas
   ficam desabilitadas.
4. O dealer revela a carta fechada e compra automaticamente. O resultado é exibido e o saldo atualizado.
5. **Nova rodada** ou **Repetir aposta** (repete o valor e já distribui).

Se o saldo ficar abaixo da aposta mínima, o jogo oferece uma recarga gratuita de 1.000 fichas virtuais.

### Atalhos de teclado

| Tecla              | Ação                                   |
| ------------------ | -------------------------------------- |
| `1`–`5`            | Adicionar ficha (5, 25, 100, 500, 1K)  |
| `U` / `Backspace`  | Desfazer última ficha                  |
| `C`                | Limpar aposta                          |
| `R`                | Repetir aposta (e distribuir, após o resultado) |
| `X`                | Dobrar a aposta antes de distribuir    |
| `Enter` / `Espaço` | Distribuir · Nova rodada               |
| `H` `S` `D` `P`    | Pedir · Parar · Dobrar · Dividir       |
| `M`                | Ligar/desligar som                     |
| `T` · `?`          | Estatísticas · Regras                  |
| `Esc`              | Fechar painel                          |

## Regras implementadas

- Shoe de **6 baralhos** (312 cartas), embaralhado com Fisher–Yates usando `crypto.getRandomValues`.
  Há uma carta de corte em ~75%: ao atingi-la, o shoe é reembaralhado antes da próxima rodada.
- O **Ás** vale 1 ou 11, o que for melhor. Figuras valem 10.
- O **dealer compra até 17 e para em todos os 17, inclusive 17 suave (S17)**. A regra aparece impressa na mesa.
- **Blackjack natural** (Ás + carta de valor 10 nas duas primeiras cartas) paga **3:2**. Vitória comum
  paga **1:1**. Empate devolve a aposta. Estouro perde, mesmo que o dealer também estoure.
- **Peek**: com Ás ou 10 à mostra, o dealer verifica se tem Blackjack. Se tiver, a rodada termina na hora
  e só a aposta original é perdida.
- **Double Down**: em quaisquer duas primeiras cartas. A aposta dobra, a mão recebe exatamente uma carta e para.
- **Split**: pares da mesma carta (ex.: 8-8, K-K), até 4 mãos, cada uma com aposta igual à original.
  Pode dobrar após dividir (DAS).
- **Ases divididos** recebem uma única carta cada, sem nova divisão. 21 depois de dividir paga 1:1, não 3:2.
- A mão para automaticamente ao chegar a 21.
- Não há seguro (insurance) nem rendição (surrender).
- Limites: aposta mínima 5, máxima 5.000. Saldo inicial 1.000.

Todas essas regras ficam em `src/engine/rules.ts` (`DEFAULT_RULES`) e são configuráveis. Também existem
variantes já implementadas e testadas: H17, sem peek (estilo europeu), split por valor e sem DAS.

## Arquitetura

```
src/
├── engine/            Lógica pura do Blackjack (sem React, 100% testável)
│   ├── types.ts       Carta, naipe, valor, RNG
│   ├── rules.ts       Regras da mesa (configuráveis)
│   ├── hand.ts        Cálculo de mãos (Ás 1/11, soft/hard, blackjack, estouro)
│   ├── shoe.ts        Shoe, embaralhamento, corte, shoe "empilhado" para testes
│   ├── chips.ts       Denominações e decomposição de valores em fichas
│   ├── game.ts        Máquina de estados da rodada (apostas, ações, dealer, pagamentos)
│   └── *.test.ts      Testes
├── state/
│   ├── useBlackjack.ts   Controlador: executa o motor passo a passo com pausas para animação,
│   │                     com trava contra ações simultâneas
│   ├── stats.ts          Estatísticas e histórico (puro, testado)
│   ├── settings.ts       Configurações (som, volume, velocidade)
│   ├── storage.ts        Persistência em localStorage com validação
│   └── usePersistence.ts Hooks de configurações/estatísticas
├── audio/SoundEngine.ts  Sons sintetizados via Web Audio API (sem arquivos de áudio)
├── animation/            Voo das cartas/fichas (Web Animations API) e contexto de velocidade
├── hooks/                Número animado, dimensionamento responsivo da mesa
├── components/           UI: mesa, cartas, fichas, controles, HUD, painéis
└── styles/               CSS por área (base, mesa, cartas, fichas, controles, painéis, efeitos)
```

**Como as animações convivem com a lógica:** o motor (`engine/game.ts`) é uma máquina de estados pura.
As decisões do jogador são chamadas explícitas (`hit`, `stand`, `double`, `split`). Tudo o que a mesa faz
sozinha (distribuir, revelar, o dealer comprar, liquidar) acontece **um passo atômico por vez** via
`advance()`. O controlador aplica cada passo, salva o estado e espera um intervalo proporcional à velocidade
escolhida. As animações apenas reagem ao estado renderizado e nunca o alteram. Enquanto uma sequência roda,
o controlador fica travado: cliques e teclas recebidos nesse intervalo são **rejeitados** (não enfileirados),
o que impede apostas duplicadas e inconsistências de saldo.

**Persistência:** o estado completo da partida (inclusive o shoe), as estatísticas, o histórico e as
configurações ficam no `localStorage`. Se a página for recarregada no meio de uma rodada, a rodada continua
de onde parou.

### Estendendo o jogo

- **Novas regras/variantes:** adicione um campo em `Rules` e trate-o em `game.ts`, com teste em `game.test.ts`.
  A função `createStackedShoe([...])` permite montar qualquer sequência de cartas para testar cenários exatos.
- **Novas ações** (ex.: seguro, rendição): crie uma transição `canX`/`x` em `game.ts`, exponha em
  `useBlackjack.ts` e adicione o botão em `components/controls/Controls.tsx`.
- **Novos sons:** adicione um nome em `SoundName` e a síntese em `SoundEngine.play`.

## Testes

`npm test` executa 56 testes em 5 arquivos, cobrindo:

- valores de mão com Ases (soft/hard, múltiplos Ases), blackjack natural, estouro;
- shoe completo de 6 baralhos, embaralhamento sem viés, reembaralhamento na carta de corte;
- apostas (limites, mínimo, desfazer, repetir, recarga);
- pagamentos 3:2, 1:1, empate, blackjack contra blackjack, peek do dealer e variante sem peek;
- comportamento do dealer (S17, H17, 17 duro com Ás, compra até 17);
- Double Down (vitória, estouro, restrições de cartas e saldo);
- Split (DAS, Ases divididos, sem nova divisão de Ases, até 4 mãos, split por valor, saldo insuficiente);
- simulação aleatória de 3.000 rodadas, verificando que o saldo nunca fica negativo e sempre bate
  com a soma dos resultados;
- estatísticas, histórico, validação de dados salvos e dimensionamento da mesa.

## Verificação feita durante o desenvolvimento

Além dos testes unitários, a aplicação foi executada em um Chromium headless (Playwright), com capturas de
tela em 1440×900, 1366×768, 1280×720, celular em pé (390×844) e celular deitado (844×390). Foram verificados
de forma automatizada:

- cliques triplos síncronos em "Distribuir" iniciam só uma rodada;
- teclas pressionadas durante animações são ignoradas;
- recarregar a página no meio da distribuição retoma e conclui a rodada;
- 12 rodadas jogadas pela interface com saldo consistente a cada rodada;
- recarga de fichas, persistência de configurações e ausência de erros no console.

**Limitação:** os sons foram verificados apenas quanto à ausência de erros. A qualidade do áudio não pôde
ser ouvida no ambiente de desenvolvimento, então vale ajustar volume e timbres ao gosto em
`src/audio/SoundEngine.ts`.

---

## Agradecimentos

Desenvolvido com o apoio moral de **Pedro "Sorriso" Henrique** 😄
