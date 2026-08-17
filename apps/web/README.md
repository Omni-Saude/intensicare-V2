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

O tipo `EstadoConectividade` (`src/domain/estados.ts`) já declara
`degradado` para não inventar semântica depois, mas esta fatia não
implementa uma tela de conectividade dedicada (sem SSE/push nesta fatia —
ver pendências).

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
  conferidas manualmente para contraste ≥ 4.5:1 — **validação automatizada
  (ex.: axe-core) não foi executada nesta fatia** (ver pendências).

## Scripts

- `pnpm --filter @intensicare/web dev` — sobe o Vite em modo desenvolvimento.
- `pnpm --filter @intensicare/web build` — checa tipos (`tsc --noEmit`) e
  gera o build de produção (`vite build`).
- `pnpm --filter @intensicare/web test` — roda os testes (vitest).
- `pnpm --filter @intensicare/web typecheck` — só checagem de tipos.

## Testes (estado real, SPR-G7-2 pós-integração)

77 testes, 7 arquivos, todos verdes (`pnpm --filter @intensicare/web test -- --run`):

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

### Pendência de teste conhecida

`@testing-library/react`, `@testing-library/user-event` e `jsdom` **não
estão instalados** nesta fatia (fora do escopo desta tarefa rodar
`pnpm add`). Os testes de componente usam `react-dom/server`
`renderToStaticMarkup` (roda em Node puro, sem DOM) — cobre a marcação
estática (texto pt-BR, `role`/`aria-*`, presença de `<button>`) mas
**não** executa `useEffect` nem simula clique/teclado. Por isso:

- `GradeLeitos`/`DetalhePaciente`/`App` só têm o estado inicial
  ("carregando") coberto por teste de render — os estados pós-busca
  (`pronto`, `vazio`, etc.) são cobertos indiretamente via
  `clienteMock.test.ts` (dados) e `linguagem.test.ts` (texto), não como
  DOM renderizado.
- O fluxo de clique real de "Reconhecer alerta" é coberto pela máquina de
  estados pura (`reconhecerAlertaMaquina.test.ts`), não por um clique
  simulado em DOM.
- Nenhuma auditoria de acessibilidade automatizada (axe-core ou
  equivalente) foi executada.

Instalar `@testing-library/react` + `jsdom` (+ `@testing-library/
user-event`, `@testing-library/jest-dom`) e migrar `render.test.tsx` para
testes de interação real fica como pendência explícita desta fatia.

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
- `App.tsx` — o cliente padrão é o HTTP real; o mock permanece para
  testes de componente e via `?mock` na URL (explícito, nunca fallback
  silencioso).
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
