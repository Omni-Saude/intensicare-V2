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

## Teste de mutação (§14 do orquestrador; pendência PRE-08)

O kernel é o único componente de segurança clínica do produto, então a
cobertura de linha não basta: o que interessa é se a suíte **detecta** uma
alteração no comportamento da regra. A análise de mutação (Stryker, runner
vitest do próprio pacote) mede exatamente isso.

**Como rodar** (nenhuma instalação permanente; nada entra no `pnpm-lock.yaml`):

```bash
pnpm --filter @intensicare/kernel-clinico test:mutacao
```

O script resolve `@stryker-mutator/core`, `@stryker-mutator/vitest-runner` e
`typescript@5` por `pnpm dlx`. O `typescript@5` é obrigatório: o
pré-processador de `tsconfig` do Stryker usa a API `parseConfigFileTextToJson`,
ausente no TypeScript 7 do workspace. Configuração em `stryker.config.json`
(alvos: `src/news2.ts` e `src/types.ts`); relatório JSON em
`reports/mutation/mutation.json` (ignorado pelo git, como `.stryker-tmp/`).

**Resultado obtido** (1.076 mutantes; limiar de quebra configurado em 90%):

| Arquivo | Score inicial | Score final | Mortos | Sobreviventes | Sem cobertura | Timeouts | Erros |
| --- | --- | --- | --- | --- | --- | --- | --- |
| `src/news2.ts` | 65,73% | **93,07%** | 994 | 63 | 11 | 0 | 0 |
| `src/types.ts` | 100% | **100%** | 8 | 0 | 0 | 0 | 0 |
| total | 65,99% | **93,12%** | 1.002 | 63 | 11 | 0 | 0 |

A subida de 65,99% para 93,12% (292 mutantes a mais mortos) veio de
`test/news2.mutacao.test.ts` — 95 testes novos, **nenhuma** alteração no
código de produção; a suíte passou de 130 para 225 testes.

**Baseline do RULE-SOFA 0.2.0 (ORQ-8, 2026-09-19; integrado ao ORQ-4 pousado)** — alvos
ampliados para `src/sofa.ts` e `src/unidades/exames.ts` (limiar de quebra 90%
INALTERADO; rodar com `inPlace` porque o sandbox do Stryker não resolve
`../../vitest.shared.js`, fora do diretório do pacote):

| Arquivo | Score final | Mortos | Sobreviventes | Sem cobertura | Timeouts |
| --- | --- | --- | --- | --- | --- |
| `src/sofa.ts` | **86,92%** (88,88% dos cobertos) | 1.422 | 178 | 36 | 0 |
| `src/unidades/exames.ts` | **100%** | 74 | 0 | 0 | 0 |
| total do pacote | **89,67%** | 2.516 | 246 | 52 | 0 |

O total do pacote fica 0,33 p.p. ABAIXO do break 90 — registro honesto, sem
afrouxar o limiar: o excedente de sobreviventes é de sofa.ts e é classe de
EQUIVALÊNCIA (guardas estruturalmente sempre verdadeiras — `??` sobre campos
não anuláveis após validação anterior; retornos defensivos inalcançáveis do
§5.2 (`pior/escolhida/maisRecente === undefined`); comparadores de desempate
cujo valor resultante é idêntico; tokens de estado internos do gate de
sedação cujo `else` é o próprio comportamento testável). A caça (7 ondas,
~250 testes novos em `test/sofa.mutacao.test.ts` + ondas em
`test/sofa.unidade.test.ts`, ZERO alteração de valor clínico) subiu sofa.ts
de 58,61% para 86,92% e EXIGIU correções reais: separação de falhas de FiO2
(unmappable vs implausible vs quarentena vs tempo ausente), quarentena de
agente vasoativo e comparação de cortes em precisão cheia (o EPS criava zona
morta de 1e-9 junto a cada corte — spec §4.0). Nenhum sobrevivente revelou
divergência entre o kernel e a spec RULE-SOFA 0.2.0: as seis tabelas de banda
foram reconferidas contra specification.md §4/logic.yaml, e os desfechos dos
38 vetores CRV ativos executam verdes no kernel E no rule-bundle. Nenhum
sobrevivente revelou divergência entre o kernel e a spec `RULE-NEWS2 0.2.0`:
as cinco tabelas de banda foram reconferidas linha a linha contra a spec
§4.1/§3.3 e estão corretas, assim como os textos obrigatórios do §7.

**Sobreviventes residuais (74) — classificação nominal.** Nenhum é matável
pela API pública; todos foram inspecionados um a um:

1. **Fronteira de epsilon ou de empate (11).** Trocas de `<`/`>` por `<=`/`>=`
   em comparações contra `X ± 1e-9` (`roundToChartUnits` L224/228/233;
   tolerância de conflito L386; faixa plausível L501; atualidade L515/522 e
   L1078/1080) e o empate do insumo mais antigo (L1076). Matá-los exigiria um
   insumo que caísse EXATAMENTE sobre o epsilon — inalcançável, porque idades
   vêm de diferenças inteiras de milissegundos; um teste de ruído de ponto
   flutuante não teria significado clínico.
2. **Guarda estruturalmente sempre verdadeira/falsa (25).** Operandos de
   `&&`/`||` que os tipos já garantem: `expectedUnit !== undefined` (L486) e
   `range !== undefined` (L501), definidos para os cinco parâmetros numéricos;
   `age.kind === "verified"` (L795), depois do retorno de `unknown`;
   `input.pregnancy === "not_documented"` (L719), depois do gate;
   `parameter === "o2_status"` (L534), depois do retorno dos codificados; e as
   guardas de `status`/`totalScore`/`riskTier` em L640/675/715/752/959/963/981,
   que só recebem combinações coerentes por construção.
3. **Código defensivo comprovadamente inalcançável (16).** Ramo de soma
   parcial L697–701 (exigiria `status === "valid"` com pontuação nula —
   impossível, pois isso implica `o2_status` em falha, que já derruba o
   agregado); `return "__unmappable__"` (L539); `case "spo2"` e `default:` de
   `bandScoreForChartUnit` (L576/584, sombreados pelas métricas próprias da
   SpO2); e os fallbacks de texto `"—"`, `"sem horário"`,
   `"horário não informado"`, `"condição não especificada"` e `?? ""`
   (L892/964/968/973/981).
4. **Reescrita sem efeito observável (20).** `Date.parse` de `null`/`undefined`
   já devolve `NaN` (L241); o retorno antecipado de `roundToChartUnits` (L224)
   coincide com o caminho longo; `?? []` em `spo2ScaleAssignments` (L621) e
   `.sort()` de escalas (L622) são reabsorvidos por `?? "scale1"` (L625/634);
   `?.` em `observationUsed` (L860/879), nunca nulo nos ramos válidos;
   `.trim()` (L966), com unidade sempre não vazia; `?? "nao_informado"` (L724),
   que recai no mesmo rótulo; e `a + b` no desempate (L561), inócuo porque os
   candidatos já chegam em ordem crescente.
5. **Parâmetro morto em `buildNonScoringRecord` (2).** O argumento
   `_annotations` (L604/617) não é lido pela função. **Pendência de limpeza**
   — não corrigida aqui porque alterar `src/` estava fora do escopo desta
   tarefa; nenhum efeito clínico.

## Scripts

- `pnpm --filter @intensicare/kernel-clinico build` — compila para `dist/`.
- `pnpm --filter @intensicare/kernel-clinico test -- --run` — roda os testes
  (225: 93 vetores CRV + contagem + propriedades + unitários + duplicatas
  temporais + morte de mutantes + fundação).
- `pnpm --filter @intensicare/kernel-clinico test:mutacao` — análise de
  mutação (ver seção acima).

## Dependências de runtime

Nenhuma (`dependencies: {}`), por decisão de arquitetura. Não adicione uma
dependência de runtime a este pacote sem atualizar a premissa PRE-02.
`fast-check` e `vitest` são devDependencies do workspace raiz, usadas apenas
em teste.
