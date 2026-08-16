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
- `GET /v1/eventos/stream` — replay de backlog por cursor (ver pendência
  abaixo).
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

### Pendências desta fatia

- Geração automática de tipos a partir do `openapi.yaml` (hoje escritos à
  mão) não está configurada.
- `GET /v1/eventos/stream` implementa apenas replay de backlog por cursor
  (ADR-0011 P4), fechando a conexão após o catch-up — push contínuo em
  conexão aberta com autorização por push (ADR-0011 P3/P5/P6) não está
  implementado (ver `x-pendencias` no próprio `openapi.yaml`).
- ADR-0012 (versionamento de API, modelo de erro, idempotência, paginação,
  política de compatibilidade) segue `not-started`; este contrato lê as
  convenções já aceitas em ADR-0009/ADR-0011 mais o prompt §12.1, mas não
  substitui aquela decisão.

## Scripts

- `pnpm --filter @intensicare/contratos build`
- `pnpm --filter @intensicare/contratos test`
