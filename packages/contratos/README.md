# @intensicare/contratos

Contratos de API do IntensiCare V2.

## Propósito

Fonte única dos contratos de API (contract-first, OpenAPI 3.1), erros no
formato `application/problem+json` (RFC 9457) em pt-BR, idempotência de
escrita por cabeçalho `Idempotency-Key` e concorrência otimista por
cabeçalho `If-Match`, compartilhadas entre `apps/api`, `apps/web` e demais
pacotes.

## Estado atual (SPR-G7-2)

Primeira fatia de contrato real. `openapi.yaml` (OpenAPI 3.1, descrições em
pt-BR) cobre:

- `POST /v1/ingestao/observacoes` — envelope sintético com
  `Idempotency-Key`; validação e quarentena de observações inválidas
  (nunca descarte silencioso).
- `GET /v1/projecoes/grade-leitos` — projeção de leitura reconstruível por
  leito (escore, banda, frescor, status de avaliação) escopada ao tenant
  do chamador (ADR-0011).
- `GET /v1/pacientes/{pacienteRef}/avaliacoes` — histórico de avaliações
  com explicação por parâmetro.
- `POST /v1/alertas/{id}/reconhecer` — reconhecimento de alerta com
  concorrência segura via `If-Match` (ADR-0009 W3, Q2-A aceita).
- `GET /v1/eventos/stream` — fluxo SSE contínuo autorizado (ver
  `asyncapi.yaml` e a seção "Canal de eventos" abaixo).
- `GET /v1/healthz`.

`src/index.ts` declara, à mão, os tipos TypeScript coerentes com o YAML —
**nenhum gerador automático os produziu nesta fatia** (pendência
registrada). O pacote continua com **zero dependências de runtime**: os
tipos são apenas TypeScript; a validação `zod` concreta vive em
`apps/api`.

### Integração SPR-G7-2 e correções da revisão única

- A avaliação por trás do contrato agora é o kernel NEWS2 REAL: os sete
  parâmetros do NEWS2 entram pela ingestão (`FluxoO2` deriva ar/oxigênio;
  `NivelConsciencia` é token ACVPU via `codigo`), `StatusAvaliacao`
  espelha os cinco estados da ADR-0008 e `ResultadoAvaliacao` carrega
  motivos/anotações/explicação/versão de regra.
- Correção 3 (baixa) da revisão única: `parcial` documentado no
  `openapi.yaml` (descrição de `StatusAvaliacao` + entrada em
  `x-pendencias`) como RESERVADO a classes futuras de escore (ADR-0026,
  classes 2+) e INALCANÇÁVEL para NEWS2 (N-8/GDEC-0007) — a API integrada
  jamais o produz para NEWS2 (garantia + teste em `apps/api`).
- Correção 4 (baixa): a semântica de idempotência com hash do corpo
  (422 em replay divergente) está documentada na operação de ingestão.

## Canal de eventos — `asyncapi.yaml` (AsyncAPI 3.0)

`asyncapi.yaml` é o contrato do plano de assinatura, par do `openapi.yaml`
(plano de requisição/resposta). Ele descreve o canal `/v1/eventos/stream`
com quatro mensagens: o evento de dados (`EventoFluxo`) e três de plano de
controle — pulsação, estado de conexão e instrução de reconciliação.

`src/asyncapi.ts` é a fonte única, em TypeScript, do vocabulário que aquele
documento descreve (tipos de evento, estados de conexão, motivos de
encerramento, ações de reconciliação, nomes de evento SSE, nome do cookie
de ticket). `EventoFluxo["tipo"]` deriva de `TIPOS_EVENTO_FLUXO` — o enum
não é redigitado em dois lugares.

Garantias que o contrato declara (ADR-0011, aceito em GDEC-0008, Opção A):

- a conexão **permanece aberta** após o catch-up (P1/P3);
- cada entrega é reautorizada **no momento da entrega**, não só na abertura
  (P3; ADR-0016 §4.1);
- o cliente retoma por cursor durável e o servidor **declara** até onde o
  cursor é retomável; lacuna vira instrução explícita de reconciliação por
  polling (P4);
- filas por conexão são limitadas e o excesso **desconecta explicitamente**
  com instrução — nunca descarte silencioso com conexão de aparência
  saudável (P5);
- estado de conexão faz parte do contrato (P6);
- o polling server-authoritative é o caminho de verdade de recuperação; o
  push é otimização de latência sobre ele (P8).

O contrato de cliente está declarado como dado em
`CONTRATO_CLIENTE_EVENTOS` — o frontend implementa aqueles sete passos.

### O que o servidor ANUNCIA na abertura

O primeiro quadro da assinatura (`estado-conexao: replaying`) carrega dois
campos **opcionais** que fecham lacunas medidas no consumo de push do
navegador — não são melhorias especulativas:

- `intervaloPulsacaoMs` (também em `MensagemPulsacao`). Este contrato afirma
  que "a ausência de pulsação dentro do intervalo anunciado é o sinal de que
  a conexão morreu", e até então **nenhum campo carregava o intervalo**: ele
  só existia em `LimitesConexao`, do lado do servidor. Entre a abertura e a
  primeira pulsação o cliente não tinha referência para armar vigia algum, e
  uma conexão meio-aberta nessa janela ficava indistinguível de uma saudável
  (HAZ-0025; SAF-0025).
- `reconexao` (`PoliticaReconexao`, a mesma estrutura da instrução). Antes, a
  política só viajava no **encerramento**; uma queda de transporte anterior à
  primeira instrução deixava o cliente sem política, e um cliente conforme
  não inventa backoff próprio — o push simplesmente parava.

Ambos são acréscimos **compatíveis** (`x-politica-evolucao`): um consumidor
que não os receba continua conforme. Os números continuam sendo configuração
do servidor e `VALIDATION REQUIRED` (ADR-0011 §3 D6) — não são SLO, alvo de
latência nem limiar clínico.

### Rotas publicadas

`CAMINHO_TICKET_EVENTOS` e `CAMINHO_FLUXO_EVENTOS` são exportados por
`src/asyncapi.ts`. A fronteira de módulo permite `apps/web -> SOMENTE
contratos`, então o frontend não pode importar as rotas de
`apps/api/src/eventos/stream.ts` — sem publicá-las aqui, todo consumidor de
navegador é obrigado a redigitá-las. `apps/api` consome as mesmas constantes
(`CAMINHO_STREAM`/`CAMINHO_TICKET` são re-exportações), e o teste do pacote
prova que `CAMINHO_FLUXO_EVENTOS` é exatamente o `address` do canal no
`asyncapi.yaml` e que ambos são rotas do `openapi.yaml`.

### Validação (gate bloqueante)

`node scripts/check_contratos.mjs` valida `openapi.yaml` **e**
`asyncapi.yaml` e falha (exit 1) em: documento inválido, chave YAML
duplicada, `$ref` que não resolve, mensagem sem payload, credencial em
query string, e qualquer divergência entre o contrato TypeScript, o
AsyncAPI e o catálogo `docs/09-api-events-and-mcp/catalogo-de-eventos.md`
(mais o mapa `OUTBOX_TO_CONTRACT_EVENT` de `apps/api/src/db.ts`). O
`asyncapi.test.ts` exercita o gate nos dois sentidos: aprova os documentos
reais e reprova doze mutações distintas.

## Pendências desta fatia

- Geração automática de tipos a partir do `openapi.yaml` (hoje escritos à
  mão) não está configurada.
- O envelope de evento no fio ainda **não** tem os campos de ADR-0010 B8
  que a tabela `outbox_events` não grava: chave de idempotência, versão de
  esquema, tempos separados (fato × emissão × publicação) e
  correlação/causalidade. O gap está declarado em `x-pendencias` do
  `asyncapi.yaml` e catalogado no catálogo §6 — não é fechado aqui porque
  fechá-lo é mudança de esquema de persistência.
- O enum de eventos de `WorkItem` continua aberto (catálogo §2.3:
  `outboxEventType` é string livre do chamador). Nenhum nome foi inventado.
- A validação do `asyncapi.yaml` é **estrutural e de coerência**, não
  contra o JSON Schema oficial da AsyncAPI 3.0 — nenhuma dependência JS
  nova foi instalada nesta entrega.
- Limites de fila, intervalo de pulsação e política de backoff seguem
  `VALIDATION REQUIRED` (ADR-0011 P5/§3 D6): são configuração injetada, não
  constante decidida no código.
- ADR-0012 (versionamento de API, modelo de erro, idempotência, paginação,
  política de compatibilidade) está `accepted` (direção `GDEC-0016`, minuta
  redigida 2026-08-16, ciclo 6) — **corrigido nesta reconciliação (ACH-09,
  2026-08-17)**; este item descrevia `ADR-0012` como `not-started`, o que
  deixou de ser verdade (`docs/06-architecture/adrs/adr-index.md` §3). Este
  contrato foi escrito lendo as convenções já aceitas em ADR-0009/ADR-0011
  mais o prompt §12.1; a reconciliação entre este `openapi.yaml` e a
  minuta formal de ADR-0012 (já redigida) não foi verificada nesta rodada
  — permanece pendência, agora por outro motivo que não a inexistência da
  minuta.

## Scripts

- `pnpm --filter @intensicare/contratos build`
- `pnpm --filter @intensicare/contratos test`
- `node scripts/check_contratos.mjs` (gate de contratos)
