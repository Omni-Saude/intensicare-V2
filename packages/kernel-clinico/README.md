# @intensicare/kernel-clinico

Núcleo clínico determinístico do IntensiCare V2.

## Propósito

Este pacote concentra as regras e os tipos clínicos puros — sem I/O, sem
rede, sem banco de dados, **sem nenhuma dependência de runtime** e **sem
relógio interno** (todo tempo entra por parâmetro). A intenção arquitetural
(PREMISSA reversível, GDEC-0015/0017; ver
`docs/06-architecture/premissas-de-construcao.md` PRE-02) é manter o núcleo
clínico testável de forma isolada, determinística e auditável, independente
de framework web, banco ou biblioteca de UI.

## Estado atual (SPR-G7-2)

Avaliador **NEWS2 determinístico** conforme `RULE-NEWS2 0.2.0`
(`docs/05-clinical-safety/rule-releases/news2/specification.md`), com:

- **Cinco estados de avaliação explícitos** (`valid | partial | not_evaluated
  | stale | invalid`) e precedência P-a da ADR-0008; `partial` é inalcançável
  para NEWS2 (decisão N-8 — permanente) e `stale` realiza-se em tempo de
  leitura via `reassessNews2AtReadTime` (spec §5.3).
- **Política de insumo ausente classe 1** (ADR-0026): qualquer parâmetro
  obrigatório ausente/velho ⇒ total `not_evaluated` com razão por parâmetro;
  **nenhum caminho** coage ausência a 0/normal/silêncio (HAZ-0005, INV-A);
  parâmetro vermelho presente escala isoladamente (INV-B, flag
  `redParameter`).
- **Gate etário/populacional fail-closed** (ADR-0027 A27-1): ≥18
  produto-wide; idade desconhecida nunca presume adulto; gravidez documentada
  ⇒ fora de população; sem documentação ⇒ pontua com anotação obrigatória
  "gravidez não verificada" (N-2).
- **Governança da Escala 2 de SpO2** (spec §3): somente ordem clínica
  documentada seleciona a Escala 2; ausência ⇒ Escala 1 (RCP Rec 27);
  atribuições contraditórias ⇒ SpO2 `invalid`; ordem >7 dias gera anotação de
  reconfirmação não bloqueante (N-6).
- **Arredondamento de chart com empate para a banda mais anormal** (N-7) e
  **duplicatas conflitantes com tolerância de dispositivo** (N-10).
- **93 vetores de referência** transcritos de
  `docs/05-clinical-safety/rule-releases/news2/reference-vectors.md` para
  `test/vetores-news2.json` (com proveniência) e executados red/green, mais
  testes de propriedade (fast-check): determinismo, sonda de insumo ausente,
  limites de banda contra oráculo independente, monotonicidade da SpO2 e
  bordas de janela/expiração.

A aprovação dos vetores serve à autoria red/green (TDD) — **não é evidência
clínica**; a autoria independente dos vetores permanece pendente (disciplina
do §0 do documento de vetores). Nenhuma alegação de efetividade clínica,
conformidade regulatória ou segurança comprovada é feita por este pacote.

## Premissas registradas nesta fatia (reversíveis)

- PREMISSA (reversível, GDEC-0015/0017): nenhuma conversão de unidade é implementada nesta fatia — unidade fora da UCUM normativa do insumo ⇒ `invalid` (`unmappable_unit`), fail-closed; conversões (ex.: °F→°C) exigiriam conteúdo clínico próprio.
- PREMISSA (reversível, GDEC-0015/0017): entre observações seriadas do mesmo parâmetro, vale o tempo clínico mais recente; "mesmo tempo clínico" (spec §2.3) é operacionalizado como `effectiveTime` idêntico.
- PREMISSA (reversível, GDEC-0015/0017): a checagem de integridade (implausível/inmapeável) aplica-se a TODAS as observações apresentadas do parâmetro, não só à mais recente — falha-alto; insumo ofensor nunca é descartado para viabilizar a avaliação.
- PREMISSA (reversível, GDEC-0015/0017): no desempate do "pior valor" dentro da tolerância (N-10), empate de banda resolve por (pontuação desc, valor asc) — determinístico; a spec não define desempate intra-banda.
- PREMISSA (reversível, GDEC-0015/0017): observação com tempo clínico futuro em relação à avaliação tem idade tratada como 0 (dentro da janela); a spec não define o caso — sinalizar para arbitragem clínica.
- PREMISSA (reversível, GDEC-0015/0017): tokens ACVPU aceitos apenas em maiúscula exata ({A,C,V,P,U}); qualquer outra grafia ⇒ `invalid` (`unmappable_code`), fail-closed.
- PREMISSA (reversível, GDEC-0015/0017): no meio-passo exato com bandas de pontuação IGUAL, arredonda-se para o limite superior — determinístico e sem efeito clínico (mesma pontuação).
- PREMISSA (reversível, GDEC-0015/0017): estado de sedação ausente no insumo de consciência NÃO gateia a avaliação nesta fatia; é anotado como "não informado" (N-4 pede anotação obrigatória; o gate por RASS é matéria da ADR-0028, fora desta fatia).

## Proposta para ratificação clínica — janela de sobreposição temporal por parâmetro

**PROPOSAL — VALIDATION REQUIRED (nenhuma janela é decidida aqui).** A
premissa vigente ("mesmo tempo clínico" = `effectiveTime` idêntico, spec
§2.3) tem uma consequência demonstrada em
`test/news2.duplicatas-temporais.test.ts`: duas leituras do mesmo parâmetro
separadas por 1 segundo NUNCA são tratadas como simultâneas — a mais
recente vence sozinha, mesmo com divergência muito além da tolerância de
dispositivo (ex.: FC 135 seguida de FC 70 um segundo depois pontua 0, sem
`conflicting_sources`). Proposta nomeada para ratificação clínica futura:

- **Nome:** *janela de sobreposição temporal por parâmetro*.
- **Forma:** um intervalo `overlapWindowSeconds[param]` por parâmetro;
  observações do mesmo parâmetro cujos `effectiveTime` distem menos que a
  janela seriam tratadas como o MESMO instante clínico para fins de
  deduplicação/conflito (N-10) — divergência além da tolerância dentro da
  janela viraria `conflicting_sources` (fail-closed), e dentro da
  tolerância o pior valor pontuaria com registro.
- **O que a ratificação deve decidir:** se a janela existe; os valores por
  parâmetro (ex.: monitores contínuos vs. aferições manuais têm cadências
  distintas); e a interação com correções (`correctionOf`).
- **Status:** VALIDATION REQUIRED — a decisão é clínica, não de
  engenharia; até lá a premissa vigente permanece e está sinalizada nos
  testes. Encaminhar junto ao item de ratificação de semântica de status
  já aberto em
  `docs/05-clinical-safety/rule-releases/news2/reference-vectors.md` §1.

## Uso

```ts
import { evaluateNews2 } from "@intensicare/kernel-clinico";

const registro = evaluateNews2({
  evaluationTime: "2026-08-16T12:00:00.000Z", // todo tempo vem por parâmetro
  age: { kind: "verified", years: 45 },
  pregnancy: "not_documented",
  observations: [/* observações com valor, unidade UCUM, tempos e proveniência */],
});
// registro.status ∈ {valid, partial, not_evaluated, stale, invalid}
// registro.totalScore só existe sob status "valid" (HAZ-0005)
```

## Correções da revisão única SPR-G7-2 aplicadas neste pacote

- Item 2 (média): premissa de duplicatas (`effectiveTime` idêntico)
  MANTIDA; (a) testes novos demonstram o comportamento com timestamps
  próximos-porém-distintos (`test/news2.duplicatas-temporais.test.ts`);
  (b) proposta nomeada de "janela de sobreposição temporal por parâmetro"
  registrada acima para RATIFICAÇÃO CLÍNICA (VALIDATION REQUIRED — nenhuma
  janela decidida); (c) as duas razões fora da spec
  (`missing_clinical_time:<param>`, `unspecified_condition`) foram
  anexadas ao item de ratificação de semântica de status já aberto no §1
  de `docs/05-clinical-safety/rule-releases/news2/reference-vectors.md`
  (vetores e vereditos inalterados).

## Scripts

- `pnpm --filter @intensicare/kernel-clinico build` — compila para `dist/`.
- `pnpm --filter @intensicare/kernel-clinico test -- --run` — roda os testes
  (130: 93 vetores CRV + contagem + propriedades + unitários + duplicatas
  temporais + fundação).

## Dependências de runtime

Nenhuma (`dependencies: {}`), por decisão de arquitetura. Não adicione uma
dependência de runtime a este pacote sem atualizar a premissa PRE-02.
`fast-check` e `vitest` são devDependencies do workspace raiz, usadas apenas
em teste.
