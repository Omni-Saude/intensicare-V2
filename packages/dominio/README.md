# @intensicare/dominio

Modelos e tipos de domínio compartilhados do IntensiCare V2.

## Propósito

Concentra os tipos de domínio (tenant, paciente/encontro, fato clínico
canônico, alerta/item de trabalho, auditoria) reutilizados por `apps/api`,
`apps/web` e demais pacotes. Depende de `@intensicare/kernel-clinico` (via
`workspace:*`) para os tipos clínicos puros, mas não contém, ele próprio,
framework web, banco ou UI.

## Estado atual (SPR-G7-2)

Implementa o modelo conceitual mínimo da fatia vertical sintética (prompt
§9.3), alinhado aos ADRs aceitos consumidos por esta tarefa:

- **Tenancy** (`tenancy.ts`, ADR-0003 opção A): `Organization`, `CareUnit`,
  `Bed` — `Organization.id === Organization.tenantId` por construção.
- **Tempo clínico** (`time.ts`, ADR-0005 M3): `TemporalValue`, uma união
  discriminada que torna ausência de timestamp um estado explícito de
  primeira classe — nunca um campo omitido silenciosamente.
- **Identidade** (`identity.ts`, ADR-0005 M2): `PatientIdentity` (PSR) e
  `Encounter`.
- **Fato clínico canônico** (`clinical-observation.ts`, ADR-0005 M1-M9):
  `SourceEnvelope`, `Provenance`, `ClinicalObservation` — imutável, com
  correção via `correctionOf` (nunca sobrescrita).
- **Máquina de estados de alerta/item de trabalho** (`work-item.ts`,
  ADR-0009 Q1-A/Q2-A): os oito estados nucleares do prompt §11,
  `applyWorkItemCommand` (transição pura com concorrência otimista por
  `version` — conflito falha explícito, nunca last-write-wins silencioso).
- **Auditoria** (`audit-event.ts`, ADR-0009 W6): forma de `AuditEvent`.

Nenhuma regra clínica (escore, threshold) está implementada — isso
permanece com `@intensicare/kernel-clinico`. Nenhuma alegação de
efetividade clínica é feita por este pacote.

## Integração SPR-G7-2 (mudanças do integrador)

- `ObservationValue` aceita valor CODIFICADO da fonte (`sourceCode`, ex.:
  token ACVPU) além do par numérico — pelo menos uma das formas presente
  (CHECK na migração 0002 de `@intensicare/persistencia`).
- `Alert` ganhou `score?` opcional: o escore que originou o alerta fica no
  próprio fato imutável (explicável por si, sem depender de avaliação
  posterior).
- `fast-check` declarado como devDependency do próprio pacote (correção da
  aresta implícita via raiz do workspace — item 8 da integração).

## Testes

18 testes Vitest (alguns com `fast-check`, já resolvível via devDependency
de workspace-root — ver nota em `work-item.test.ts`), cobrindo: o caminho
nuclear da máquina de estados, conflito de concorrência (versão
divergente), transição ilegal, supressão com razão codificada, e as
propriedades de `TemporalValue`.

## Scripts

- `pnpm --filter @intensicare/dominio build`
- `pnpm --filter @intensicare/dominio test`
