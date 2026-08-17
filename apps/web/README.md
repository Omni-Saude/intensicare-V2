# apps/web

Frontend do IntensiCare V2.

## Propósito

React 18 + Vite + TypeScript estrito, pt-BR clínico, WCAG 2.2 AA como
requisito de projeto. PREMISSA (reversível, GDEC-0015/0017; ver
`docs/06-architecture/premissas-de-construcao.md` PRE-06/PRE-07). Direção
aceita em GDEC-0016 (ADR-0021): a camada de apresentação é dona da
linguagem — melhora a comunicação e ajusta termos quando necessário, sobre
os estados clínicos originados no backend (identificador de estado é do
backend; o texto pt-BR é do frontend — ver `src/domain/linguagem.ts`).

Nenhuma alegação de efetividade clínica, conformidade regulatória ou
segurança comprovada é feita por este pacote.

## Estado atual (SPR-G7-2)

Três telas/ações sobre uma grade de leitos 100% sintética (fixtures
`SYNTH-`, `src/api/fixtures.ts`):

- **Grade de leitos** (`src/components/GradeLeitos.tsx`) — cartão por
  leito com escore NEWS2 (ilustrativo — ver aviso em `src/domain/news2.ts`),
  banda de risco (cor **+** rótulo textual, nunca só cor) e frescor do
  dado.
- **Detalhe do paciente** (`src/components/DetalhePaciente.tsx`) — escore,
  contribuição por parâmetro com explicação clínica pt-BR, insumos
  ausentes/velhos **declarados explicitamente** (nunca omitidos) e
  timestamps de origem.
- **Reconhecer alerta** (`src/components/ReconhecerAlerta.tsx`) — ação com
  confirmação em duas etapas; a máquina de estados pura que a governa
  (`src/estado/reconhecerAlertaMaquina.ts`) nunca mostra sucesso antes da
  confirmação do backend/mock (ADR-0021 F5) e nunca esconde uma falha.

### Estados obrigatórios do prompt §11

Os oito estados citados pela tarefa são visíveis e demonstráveis:
`carregando` / `vazio` / `indisponível` / `erro` / `degradado` (ver nota
abaixo) / dado envelhecendo / dado velho / avaliação não computável
(fail-closed). Os dois últimos aparecem organicamente nas fixtures
(Leito 04 = `nao_avaliada`; Leito 02/05 = insumo `envelhecendo`/
`desatualizado`). Os quatro primeiros dependem de uma falha de rede que
um cliente mock em memória não produz sozinho — por isso a grade tem um
**"Modo de demonstração"** (`src/components/ControleDemonstracao.tsx`),
explicitamente rotulado como ferramenta de revisão, nunca como
comportamento real de produção, para forçá-los. Nenhum estado é escondido
nem um dado ausente é redigido como "normal" (HAZ-0005; ver os testes P1-P9
em `src/domain/linguagem.test.ts`).

Desde o ACH-07 as SEIS famílias do §11 têm superfície de renderização:
conectividade e sessão ganharam componentes
(`src/components/AvisosDeEstado.tsx`) e há uma **galeria de estados**
(`/?estados`, apenas em desenvolvimento) que renderiza os 43 identificadores
lado a lado — a varredura de contraste mais densa da fatia.

Honestidade de capacidade: `reproduzindo` e `reconciliado` são
renderizáveis mas **não são produzidos por transporte real** — esta fatia
não tem SSE, WebSocket nem cursor de replay (ADR-0011 P4 pendente). O hook
de conectividade nunca os emite; eles existem no catálogo, não como
capacidade.

### Módulo de linguagem (ADR-0021)

`src/domain/estados.ts` declara os identificadores; `src/domain/
linguagem.ts` traduz cada um, com switch exaustivo, para texto pt-BR + tom
semântico (nunca só cor) + glifo. Nenhuma tradução aqui é ratificação de
glossário (ADR-0029 condição C2 permanece ABERTA) — é texto provisório de
fatia sintética.

### Acessibilidade (WCAG 2.2 AA de projeto)

- Elementos interativos são `<button>`/`<details>` nativos — foco de
  teclado e ativação por Enter/Espaço vêm da semântica, sem `tabIndex`/
  `onKeyDown` manuais.
- `:focus-visible` com contorno visível (`src/estilo.css`).
- Toda mensagem de estado usa `role="status"`/`aria-live="polite"` (rotina)
  ou `role="alert"`/`aria-live="assertive"` (erro/indisponível/alerta
  novo — `src/components/RegiaoAoVivoAlertas.tsx`).
- Nenhum estado depende só de cor: todo selo (`BadgeTom`) carrega texto e
  glifo.
- Cores dos tons semânticos (`.badge-tom--*`) foram escolhidas e
  conferidas manualmente para contraste ≥ 4.5:1, e desde o ACH-07 também
  **verificadas por axe-core em navegador real** (`e2e/acessibilidade.spec.ts`).
- A matriz explícita de critérios WCAG — o que a automação cobre × o que
  **exige uma pessoa usuária de tecnologia assistiva** — vive em
  `src/a11y/matrizAcessibilidade.ts`, como código testado, não como prosa.

> **NADA AQUI DECLARA ACESSIBILIDADE VALIDADA.** Automação encontra uma
> fração conhecida das barreiras reais. A validação com leitor de tela,
> ampliação e teclado, feita por pessoas que dependem dessas tecnologias, é
> dependência humana e permanece **NÃO EXECUTADA** (ADR-0021 F7, SPR-G4-5,
> MG-G4). O critério 2.4.11 (foco não obscurecido) também segue **não
> executado** — sem teste dedicado.

## Scripts

- `pnpm --filter @intensicare/web dev` — sobe o Vite em modo desenvolvimento.
- `pnpm --filter @intensicare/web build` — checa tipos (`tsc --noEmit`) e
  gera o build de produção (`vite build`).
- `pnpm --filter @intensicare/web test` — roda os testes (vitest).
- `pnpm --filter @intensicare/web typecheck` — só checagem de tipos.
- `pnpm --filter @intensicare/web test:e2e` — suíte de navegador (Playwright).
- `pnpm --filter @intensicare/web test:e2e:instalar` — baixa o navegador (uma vez).

## Testes (estado real, SPR-G7-2 pós-integração)

163 testes, 14 arquivos, todos verdes
(`pnpm --filter @intensicare/web test -- --run`). A linha de base do ciclo 6
era 77 em 7 arquivos; o ACH-07 acrescentou 86 sem remover nenhum. Além dos
listados abaixo, o ACH-07 acrescentou `perfil.test.ts`, `api/guardas.test.ts`,
`estado/recursoRemoto.test.ts`, `estado/conectividade.test.ts`,
`build/guardaArtefatoSintetico.test.ts`, `components/resiliencia.test.tsx` e
`a11y/acessibilidade.test.tsx`:

- `src/api/clienteHttp.test.ts` — mapeamentos puros contrato→UI do
  cliente HTTP real (status ADR-0008, bandas, parâmetros, frescor
  fail-closed, entrada de grade).
- `src/domain/news2.test.ts` — tabela de pontos ilustrativa (função pura).
- `src/domain/linguagem.test.ts` — cobertura total de todo identificador
  de estado declarado, mais testes dedicados à lista de ambiguidade
  proibida P1/P5/P6/P7/P8 (ADR-0029).
- `src/estado/reconhecerAlertaMaquina.test.ts` — máquina de estados pura
  da confirmação de "Reconhecer alerta" (ADR-0021 F5: falha nunca vira
  sucesso silencioso).
- `src/api/clienteMock.test.ts` — cliente mock: grade, detalhe,
  reconhecer alerta (idempotência), fail-closed (HAZ-0005), marcador
  `SYNTH-`.
- `src/components/render.test.tsx` — smoke tests de todos os componentes
  via `react-dom/server` `renderToStaticMarkup` (ver pendência abaixo).
- `src/index.test.ts` — esqueleto original (SPR-G7-1), preservado intacto.

### Suíte de navegador e interação real (ACH-07)

`jsdom`, `@testing-library/react`, `@testing-library/user-event`,
`axe-core`, `@playwright/test` e `@axe-core/playwright` foram instalados no
ACH-07. A limitação anterior — testes que não executavam `useEffect`, e
portanto não conseguiam alcançar o defeito de rejeição de rede — deixou de
existir:

- `src/components/resiliencia.test.tsx` monta os componentes de verdade e
  prova o teste de aceite do ACH-07 (rejeição ⇒ erro acionável; desmontagem
  ⇒ `AbortSignal` abortado; falha de recarga ⇒ dado anterior rotulado).
- `src/a11y/acessibilidade.test.tsx` roda axe-core em jsdom, mais teclado,
  foco e live regions.
- `e2e/` roda Playwright em navegador real: axe com `color-contrast`
  ligado, alvos de toque, reflow a 320 CSS px e `prefers-reduced-motion`.

**Estado da execução do E2E:** 22 verdes, 0 falhas, 0 bloqueados (3 execuções
consecutivas). A sessão de desenvolvimento é obtida em runtime de
`POST /v1/dev/sessao` (`src/api/sessaoDesenvolvimento.ts`), guardada apenas em
memória, renovada antes de expirar e re-obtida no 401.

Inventário de rede verificado: as ÚNICAS chamadas a `/v1/` são
`POST /v1/dev/sessao` (sem `Authorization` — é o endpoint que emite o bearer)
e `GET /v1/projecoes/grade-leitos` (com `Bearer`). Nenhuma requisição anônima
de dado, e nenhum identificador de sessão em query string.

Reproduzir:

```
pnpm --filter @intensicare/web test:e2e:instalar   # uma vez, baixa o navegador
pnpm --filter @intensicare/web test:e2e
```

## Integração real (SPR-G7-2, integrador)

A INTEGRAÇÃO PENDENTE anterior foi resolvida: `apps/web` agora declara
`@intensicare/contratos` como dependência de workspace e tem um cliente
HTTP REAL do contrato:

- `src/api/clienteHttp.ts` — implementa a porta `ClienteApiIntensiCare`
  com `fetch` contra `apps/api` (`/v1/*`), usando os tipos de
  `@intensicare/contratos`; os mapeamentos contrato→UI são funções puras
  testadas (`clienteHttp.test.ts`) e nunca inventam normalidade
  (HAZ-0005). Concorrência otimista de ponta a ponta: o `If-Match` enviado
  vem da versão vista na projeção.
- `src/api/tipos.ts` — `ProblemaLocal`/`CABECALHO_IDEMPOTENCIA` agora são
  re-exports do contrato real (espelhos locais removidos).
- `App.tsx` — desde o ACH-07, `App` RECEBE cliente e sessão por injeção; a
  escolha (perfil, `?mock`, sessão) vive em `src/api/resolverCliente.ts` e
  roda em `main.tsx` antes de montar a árvore. `?mock` e a sessão sintética
  **só existem em desenvolvimento**: fora dele a guarda LANÇA
  (`src/perfil.ts`), o dublê é removido do pacote por `import()` dinâmico
  sob `import.meta.env.DEV`, e o build de produção FALHA se um marcador
  sintético chegar ao pacote emitido (`src/build/guardaArtefatoSintetico.ts`).
- `src/api/sessao.ts` — porta de sessão. O cliente HTTP não conhece
  credencial alguma: a constante `TOKEN_DEV` foi REMOVIDA. Sem provedor que
  forneça credencial, o cliente recusa com estado `proibido` visível, em vez
  de emitir requisição anônima ou cair para um dublê.
- `vite.config.ts` — o fluxo dev aponta para a API local: proxy de
  `/v1/*` para `http://localhost:3000` (suba a API com
  `pnpm --filter @intensicare/api dev`).
- `src/domain/clinico.ts`/`src/domain/news2.ts` — a tabela ilustrativa
  local segue existindo APENAS para o mock; a avaliação real vem da API
  (kernel `RULE-NEWS2 0.2.0`). O detalhe do paciente exibe as
  contribuições reais retornadas pelo contrato.

### Requisito do banner permanente (correção 1 da revisão única SPR-G7-2)

`src/components/BannerContexto.tsx` exibe, além de "CONSULTIVO — dados
100% sintéticos", o rótulo vinculante **"registro limitado a esta
instituição"**. Origem do requisito: HAZ-0046 (hazard OPEN, S4 — leitura
da tela como "o registro do paciente" em vez de "o registro do paciente
NESTA instituição"); ADR-0004 §6.2 (requisito da ata AQ-1 — "obrigação de
segurança clínica, não preferência de UX"); EC-R1.d de
`docs/11-security-privacy-compliance/evidencia-carater-consultivo.md`.
O banner é permanente em toda tela que exibe escore/alerta (o `App`
renderiza-o acima de qualquer tela) e há teste de renderização dedicado.
A exibição NÃO fecha HAZ-0046 — a reclassificação é do fluxo do hazard
log.

## Outras pendências registradas

- Sem biblioteca de rotas (nenhuma navegação por URL) — a troca entre
  grade e detalhe é só estado de React (`App.tsx`). Suficiente para as
  duas telas desta fatia; uma URL por leito (deep link) fica para depois.
- Sem SSE/tempo real (ADR-0011 é política, não implementação nesta
  fatia) — a "Região ao vivo" de alertas novos reage a mudanças de estado
  local (busca inicial, reconhecimento), não a push do servidor.
- Mutação (Stryker) não configurada — mesma pendência já registrada para
  o restante do monorepo.
- Vocabulário pt-BR desta fatia é provisório (ADR-0029 condição C2 segue
  ABERTA) — sujeito a revisão clínica nomeada antes de qualquer exposição
  fora de ambiente sintético.

## Dependências de runtime

- `react`, `react-dom` — biblioteca de UI.
- `@intensicare/contratos` (workspace) — tipos do contrato real consumidos
  pelo cliente HTTP.

## Dependências de build

- `vite`, `@vitejs/plugin-react` — bundler e transformação JSX/Fast Refresh.
