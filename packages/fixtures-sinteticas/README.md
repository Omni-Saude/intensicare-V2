# @intensicare/fixtures-sinteticas

Geração de dados 100% sintéticos para desenvolvimento e teste do
IntensiCare V2.

## Propósito

PREMISSA (reversível, GDEC-0014/0015/0017): dados sintéticos são o default
vinculante de desenvolvimento (ver
`docs/14-devsecops-and-delivery/politica-dados-sinteticos.md`). Este pacote
concentra as funções que geram identificadores e cenários sintéticos, todos
marcados com o prefixo `SYNTH-`, para uso em `apps/api`, `apps/web` e nos
testes dos demais pacotes.

## Estado atual (SPR-G7-2)

- `synthetic-identifiers.ts` (antes em `index.ts`, sem mudança de
  comportamento): `generateSyntheticPsr()` e `generateSyntheticTenantId()`.
- `scenario.ts`: `buildG7SyntheticScenario()` — o cenário SYNTH completo da
  fatia G7, determinístico (mesma saída a cada chamada):
  - 1 organização, 1 UTI, exatamente 4 leitos;
  - 2 pacientes sintéticos, `SYNTH-P001` (estável) e `SYNTH-P002`
    (deterioração progressiva em três instantes — FR/FC sobem, SpO2/PAS
    caem; último instante cruza didaticamente uma faixa de alto risco
    comum — **nenhum escore clínico é calculado por este pacote**, ver
    premissa em `scenario.ts`);
  - um caso de insumo ausente (`missingInputCase`): SpO2 de SYNTH-P002 não
    chega da fonte num quarto instante, com os demais sinais (piores)
    presentes — cenário didático do caminho degradado que DOM-0004/HAZ-0005
    proíbem tratar como normal/zero/no-fire silencioso.

## Integração SPR-G7-2 (PENDÊNCIA anterior resolvida)

A PENDÊNCIA registrada na fatia anterior foi resolvida pelo integrador:
este pacote agora declara `@intensicare/dominio` e
`@intensicare/persistencia` como dependências (`pnpm-lock.yaml`
atualizado) e ganhou `loadIntoDatabase(db)` (`src/load.ts`), que semeia o
cenário G7 num banco real usando os repositórios reais — fato clínico +
evento de outbox na MESMA transação (ADR-0010 B1), RLS ativa. `apps/api`
usa esta função para semear o banco de dev/teste. Os tipos `Synthetic*`
de `scenario.ts` permanecem locais DE PROPÓSITO (forma declarativa e
serializável do cenário); a tradução para os tipos do domínio acontece só
em `load.ts` — ver comentário lá.

## Regra dura

Nenhuma função deste pacote pode gerar ou aceitar CPF formatado, PHI ou um
identificador `amh:psr:v1:<uuid>` real — o gate
`scripts/check_forbidden_content.py` reprova qualquer um desses padrões em
código-fonte sob `packages/` e `apps/`.

## Scripts

- `pnpm --filter @intensicare/fixtures-sinteticas build`
- `pnpm --filter @intensicare/fixtures-sinteticas test`
