---
id: LEGREV-DQPC-UNITS
title: Revisão legada — normalizador de unidades da V1, verify_units.py, e o corpus de design units-registry.md
label: PROPOSAL
status: PROPOSAL — AWAITING NAMED CLINICAL REVIEW (reviewer: rodaquino-OMNI)
statement: >
  Revisão forense source-verified do runtime de unidades canônicas da V1
  (`services/units_normalizer.py`), do script de verificação de unidade em
  tempo de build (`scripts/verify_units.py`), e do documento de design de
  registro de unidades voltado para o futuro da própria equipe legada
  (`docs/plan/clinical/units-registry.md`), com uma auditoria
  fator-de-conversão-por-fator-de-conversão contra UCUM/fontes publicadas e
  uma análise de lacuna explícita entre o que o documento de design
  especifica e o que o serviço em runtime de fato implementa. Os riscos de
  conversão de unidade FiO2 (~100x) e bilirrubina (~17x) nomeados no pacote
  de tarefa são respondidos diretamente em §3.
provenance:
  source_repo: intensicare (legado V1, READ-ONLY)
  path_or_url: src/intensicare/services/units_normalizer.py; scripts/verify_units.py; docs/plan/clinical/units-registry.md
  commit_sha_or_version: 1dc1ea6cc83f1e01ca7b7ee70a511f3dbc47cd79 (HEAD no pin; SHA-256 por arquivo em §0)
  section_or_lines: citado por achado como path:linhas
  date_collected: 2026-08-15
  last_updated: 2026-08-15
  collector: rodaquino-OMNI (revisor forense de qualidade-de-dados/cálculo-fisiológico legado, ciclo 1 Tarefa 1, wave 1b)
  transformation: >
    traduzido EN→pt-BR, tranche 3, GDEC-0008 item 8 (lido a partir da fonte;
    fatores de conversão checados independentemente contra o conhecimento
    deste revisor sobre UCUM e conversões de referência padrão de química
    clínica — documentos externos NÃO foram reobtidos neste ambiente, então
    toda comparação publicada abaixo carrega VALIDATION REQUIRED para
    re-verificação contra a fonte impressa antes do uso)
  confidence: alta (citações de código, checagens aritméticas) / média (comparações com fonte clínica)
  owner: UNASSIGNED — VALIDATION REQUIRED
  validation_status: VALIDATION REQUIRED
links:
  hazards: [HAZ-0005, HAZ-0006, HAZ-0032]
  adrs: []
  pr: null
supersedes: null
superseded_by: null
---

> Traduzido EN→pt-BR em 2026-08-16 (GDEC-0008 item 8, tranche 3); original EN preservado no histórico git.

# Superfície de normalização de unidades da V1 — revisão forense

> **PROPOSAL — AWAITING NAMED CLINICAL REVIEW (reviewer: rodaquino-OMNI).**
> Nada aqui é uma decisão de importação. Conforme
> `docs/00-governance/legacy-import-policy.md` §1, o padrão é **não
> copiar**; todo veredito abaixo é apenas uma proposta de classificação sob
> §4.

## 0. Fontes e integridade

Caminhos relativos a `/Users/familia/intensicare/`. OBSERVED 2026-08-15
(este revisor re-hasheou cada arquivo com `shasum -a 256` e comparou contra
`docs/archive/legacy-provenance/legacy-pin-cycle-1.md` / o `inventory.md`
do ciclo-1): todos os três correspondem.

```text
1f95ec99c03f4d1e17548fb33e2f4d08431f1801b050765d77d6fa3bcc0f80c4  src/intensicare/services/units_normalizer.py
80513917eaf841f139aa8859b8f42f6f0fc2ce6a3e51a0b37154b4a6ebce4c7d  scripts/verify_units.py (rt)
c8e4fccbb04e003763ade67fba0ba753b05a1e56ee97747cb98b8981efb6d8a7  docs/plan/clinical/units-registry.md (rt)
345583406893937287376f34c6e7d71a32091130af7e8918c5ee891dc092b863  tests/test_units_normalizer.py (rt) — LISTADO conforme o pacote de tarefa, não revisado
```

`(rt)` = hash-and-note, computado no momento da leitura em 2026-08-15;
corresponde aos próprios valores `(rt)` do `inventory.md` para esses
caminhos.

---

## 1. `services/units_normalizer.py` — o que é

OBSERVED (`units_normalizer.py:1-14`): um módulo pequeno que fornece (a)
uma única função de guarda, `validate_fio2_fraction`, e (b) um
normalizador baseado em registro, `normalize_value`, "used at the
Gold-layer read boundary (`services.gold_reader`) to convert whatever unit
a source system reports into each parameter's canonical unit." (citação
mantida em inglês, texto literal da docstring). A própria docstring do
módulo declara seu escopo com precisão: apenas fatores multiplicativos
fixos; conversões afins (Fahrenheit→Celsius) são deliberadamente não
suportadas e rejeitadas alto em vez de convertidas incorretamente em
silêncio — uma escolha de design genuinamente boa e consciente do HAZ-0005
(`:9-13`, `:88-93`), revisada mais adiante em §4.

### 1.1 `validate_fio2_fraction` — definida, nunca conectada

OBSERVED (`:25-39`): dispara `ValueError` se `value > 1.0`. OBSERVED (grep
em todo o repositório): esta função **não é importada nem chamada em
nenhum outro lugar em `src/`** — nenhum scorer, nenhum serviço de domínio,
nenhuma rota de API a referencia. É código morto: uma guarda correta que
não protege nada no sistema em produção. **Veredito: REJECT** o estado
atual (não conectado); **TRANSFORM** o conceito — uma guarda de fração de
FiO2 é exatamente a ideia certa, mas precisa ser chamada em toda fronteira
de ingestão/consumo de FiO2, não meramente existir.

### 1.2 `normalize_value` e o registro de unidade canônica

OBSERVED (`:54-94`): `_PARAMETER_REGISTRY` contém **exatamente cinco**
parâmetros: `creatinina`, `fio2`, `lactato_arterial`, `pao2`,
`temperatura`. Cada um mapeia uma `canonical_unit` e um dict `units` de
`{unit_name: factor}`, com `factor: None` reservado para conversões afins
reconhecidas-mas-não-suportadas (usado apenas para `degf`, `:91`).

OBSERVED (`:108-125`): parâmetro desconhecido, unidade não reconhecida, e
`factor is None` todos disparam `UnitNormalizationError` (uma subclasse de
`ValueError`) — a função nunca retorna silenciosamente um número errado
para esses três casos. Este é o modo de falha correto *para a própria
função*; se o **chamador** trata essa exceção como "não avaliado" em vez de
passar adiante o valor original é uma questão do `gold_reader.py`,
respondida em `gold-pipeline-review.md` §2 (resposta curta: a linha
sobrevive com seu valor original, não convertido, e uma flag
`_normalization_error` — não descartada, não bloqueada).

OBSERVED (grep em todo o repositório): `normalize_value` tem **exatamente
um chamador** em `src/`: `gold_reader.py:320`
(`AthenaPoller._normalize_rows`). Nenhum scorer de domínio (`sofa.py`,
`qsofa.py`, os serviços `domain_*.py`) e nenhuma rota de API chama esse
registro diretamente. Seu alcance, portanto, se limita ao que flui pelo
caminho de batch-poll Athena/Gold; valores que entram pelo caminho direto
OLTP/API que o cluster de regras `sinais-vitais` governa (ver
`sinais-vitais-cluster-review.md`) recebem **nenhuma conversão de unidade
ou consciência de unidade de forma alguma** — esses validadores checam
apenas plausibilidade numérica (§1.3 abaixo e o registro de cluster
cruzam esse fio em ambas as direções).

---

## 2. Auditoria de fator de conversão (todos os cinco parâmetros implementados)

Método: cada fator é checado como `valor_na_unidade_de_origem × fator ==
valor_na_unidade_canônica`, contra o conhecimento deste revisor sobre UCUM e
conversões padrão de química clínica (VALIDATION REQUIRED — re-verificar
contra uma referência impressa antes do uso, conforme o front matter
acima).

| # | Parâmetro | Canônico | Unidade de borda → fator | Checagem aritmética | Comparação publicada | Resultado |
|---|---|---|---|---|---|---|
| 1 | `fio2` | `fraction` | `percent`/`%` → ×0,01 | 40 % × 0,01 = 0,40 fração — direção e magnitude corretas | Corresponde a `units-registry.md` §2.1 (`LAW`, SYS-01) e à convenção padrão percentual↔fração de FiO2 | **VERIFICADO** (aritmética + concordância com o documento de design) |
| 2 | `creatinina` | `mg/dL` | `umol/l` → ×0,0113 | 88,4 µmol/L × 0,0113 = 0,999 mg/dL, vs. a identidade de livro-texto 1 mg/dL ≈ 88,4 µmol/L | Corresponde a `units-registry.md` §2.5 (`÷88,42`, ou seja ×0,011310 — uma diferença de arredondamento na 4ª casa significativa, clinicamente irrelevante) | **VERIFICADO**, nota de precisão abaixo |
| 3 | `lactato_arterial` | `mmol/L` | `mg/dl` → ×0,111 | 9,008 mg/dL × 0,111 = 1,0000 mmol/L, vs. PM do lactato 90,08 g/mol ⇒ 1 mmol/L = 9,008 mg/dL (1/9,008 = 0,11101) | Corresponde a `units-registry.md` §2.1 (`×0,111 (÷9,01)`, SYS-03, "~9x legacy chaos") | **VERIFICADO** |
| 4 | `pao2` | `mmHg` | `kpa` → ×7,50062 | Identidade SI padrão 1 kPa = 7,50062 mmHg (1/0,133322) | Corresponde a `units-registry.md` §2.1 | **VERIFICADO** |
| 5 | `temperatura` | `°C` | `degc`/`°c` → ×1,0; `degf` → `None` (rejeitado, não convertido) | Fahrenheit precisa de `(F−32)×5/9`, não um multiplicador — corretamente recusado em vez de aplicado incorretamente | Corresponde a `units-registry.md` §2.7 ("`°F` → (°F−32)×5/9 (afim, null)") | **VERIFICADO** — a única linha onde "sem conversão" é o comportamento *correto* |

**Nota de precisão (linha 2):** `units-registry.md` cita `÷88,42` (⇒
×0,011307...); o `0,0113` implementado difere na 4ª casa significativa
(≈0,06 % de magnitude menor). Clinicamente irrelevante em qualquer valor de
creatinina dentro da faixa de plausibilidade validada (0–20 mg/dL conforme
`RULE-SINAIS-VITAIS-025`), mas nenhuma política de arredondamento/precisão
está documentada em lugar nenhum do módulo — `normalize_value` retorna o
produto de ponto flutuante bruto sem nenhum `round()` explícito —
**VALIDATION REQUIRED**: uma política de precisão/armazenamento nomeada (o
documento de design pede armazenamento `DECIMAL(4,1)` para temperatura,
`:155` de `units-registry.md`, mas `units_normalizer.py` não aplica
nenhum contrato de precisão comparável para nenhum parâmetro que converte).

**Resultado da auditoria de fator de conversão para este registro: 5 de 5
fatores implementados VERIFICADOS** independentemente contra identidades
UCUM/química clínica padrão e contra as próprias citações de design da
equipe legada. **Zero fatores implementados encontrados numericamente
errados.** O defeito deste módulo não é um fator incorreto — é a
**ausência quase-total de cobertura**, detalhada em §3–§4.

---

## 3. Os dois riscos nomeados do pacote de tarefa, respondidos diretamente

### 3.1 FiO2 percentual-vs-fração (risco ~100x, `units-registry.md` SYS-01)

**Corretamente implementado.** `fio2` é registrado com `fraction` como
canônico e ambos `percent` e `%` mapeiam para ×0,01 (`:65-68`). Alimentado
com um valor marcado `unit_canonical="percent"`, `normalize_value` retorna
a fração correta. Este é o único parâmetro no registro em runtime que
corresponde totalmente à sua entrada de design em `units-registry.md`
(`fraction`, LAW, SYS-01). **O risco residual não está na aritmética, mas
na cobertura**: essa conversão só dispara para linhas que passam por
`gold_reader._normalize_rows` **e** já carregam uma tag `unit_canonical`
correta de `"percent"`/`"%"`/`"fraction"`. Nada no conjunto de arquivos
deste módulo garante que toda linha portando FiO2 em todo caminho de
ingestão carregue uma tag de unidade de forma alguma —
`validate_fio2_fraction` (§1.1) é a guarda morta que presumivelmente foi
pensada para reforçar exatamente esse caso e não o faz. **Veredito:
VALIDATE** o fator em si (verificado aritmética e por citação); **REJECT**
a lacuna de cobertura (aplicação em caminho único, guarda secundária
morta) como insuficiente para aposentar a classe de hazard.

### 3.2 Bilirrubina mg/dL-vs-µmol/L (risco ~17x, sofa-review.md D-06)

**Não implementado de forma alguma.** `bilirrubinas` (ou qualquer grafia
de bilirrubina) **não aparece** em `_PARAMETER_REGISTRY` (`:54-94`,
confirmado por leitura direta — as cinco chaves são exaustivas). Isso
apesar de:

- `units-registry.md` §2.5 (parte da **lista de itens deste mesmo
  workstream**) especificar explicitamente a conversão necessária:
  `bilirubina | total bilirubin | mg/dL | µmol/L ×0,05848 (÷17,1) |
  SOFA-liver bands; SYS-07 boundary gaps are threshold bugs`
  (`units-registry.md:131`) — o próprio documento de design da equipe
  legada já nomeou o fator correto e citou a classe de hazard, e o serviço
  em runtime nunca o implementou.
- A revisão independente do workstream de sepsis-scores
  (`docs/05-clinical-safety/legacy-review/sepsis-scores/sofa-review.md`,
  achado D-06) encontrou o hazard idêntico pelo lado da *função de
  scoring*: as faixas de bilirrubina do `sofa.py` são apenas-`mg/dL`
  apesar de uma docstring convidando entrada em `µmol/L`, e "a µmol/L
  value passed as-is over-scores by ~17× (normal 10 µmol/L reads as 10
  'mg/dL' → 3 points)." (citação mantida em inglês, texto literal do
  achado original). **Este registro confirma, do lado da
  normalização-de-unidades, que nenhuma camada do pipeline captura esse
  erro antes que ele alcance o scorer** — não existe nenhuma conversão de
  borda com tag de unidade em nenhum ponto upstream para bilirrubina,
  então um valor em µmol/L entrando pelo caminho Gold/Athena dispararia
  `UnitNormalizationError: Parâmetro desconhecido` em `gold_reader.py`
  (capturado, logado, linha mantida não convertida — ver
  `gold-pipeline-review.md` §2) em vez de ser convertido ou bloqueado, e
  um valor entrando pelo caminho OLTP direto (`RULE-SINAIS-VITAIS-022`,
  limite de plausibilidade `0–30 mg/dL`) não é marcado com unidade de
  forma alguma, e um valor em µmol/L de faixa normal (≈5–21) passa por
  esse limite sem ser detectado como se fosse `mg/dL` — ver
  `sinais-vitais-cluster-review.md` regra 022.

**Veredito: REJECT** o estado atual como clinicamente inseguro por omissão
— este é o achado único mais severo deste workstream. **TRANSFORM**
exigido: implementar a entrada `bilirrubinas`/`bilirubina` usando o fator
exato que `units-registry.md` já especifica (×0,05848, VALIDATION
REQUIRED para re-verificação independente contra uma referência de química
clínica antes de qualquer importação), conectada em todo caminho de
ingestão que possa carregar um valor de bilirrubina, não apenas o poller
Gold/Athena.

---

## 4. Lacuna de cobertura: o registro em runtime vs. seu próprio documento de design

`units-registry.md` §2 cataloga **≈35 parâmetros** com unidades canônicas
nomeadas, conversões de borda citadas, e proveniência de classe de hazard
explícita (`SYS-01` a `SYS-09` mais vários "related unit mislabels", §3).
`units_normalizer.py` implementa **5**. A tabela a seguir lista todo
parâmetro de `units-registry.md` que é clinicamente load-bearing no
próprio conjunto de itens deste workstream (o cluster `sinais-vitais`,
§1.3) ou nomeado como hazard sistêmico em `units-registry.md` §3, cruzado
contra seu status de implementação no registro em runtime.

| Parâmetro (`units-registry.md`) | Canônico de design + fator de borda | Classe de hazard nomeada | Implementado em `units_normalizer.py`? |
|---|---|---|---|
| `bilirubina` | `mg/dL`; µmol/L ×0,05848 | 17× (D-06, este registro §3.2) | **Não** |
| `dose_vasopressor` | `mcg/kg/min`; `mL/h` precisa de um **serviço**, não um fator | SYS-02, ~60× | **Não** (nenhuma entrada de fator fixo, nenhum serviço) |
| `potassio` | `mmol/L`; `mg/dL` ×0,2558 (o próprio documento de design sinaliza "suspected mislabel") | mislabel da RULE-EQUILIBRIO-004 | **Não** |
| `sodio` | `mmol/L`; `mg/dL` ×0,435 (documento de design: "suspected mislabel") | segurança de correção de Δ-Na (CON-0061) | **Não** |
| `hemoglobina` | `g/dL`; rótulo legado `mg/dl` sinalizado como erro de **1000×** | 1000× nomeado em auditoria | **Não** |
| `glicemia` | `mg/dL`; `mmol/L` ×18,016 | nenhum nomeado, mas uma classe de 18× por construção | **Não** |
| `plaquetas` | `10^3/uL` (== `10^9/L`); `/uL`/`/mm^3` ÷1000 | descasamento de escala vs. o limite bruto `/mm3` da `RULE-SINAIS-VITAIS-028` | **Não** |
| `leucocitos` | `10^3/uL`; `/uL`/`/mm^3` ÷1000 | descasamento de escala vs. o limite bruto `/mm3` da `RULE-SINAIS-VITAIS-026` | **Não** |
| `proteina_c_reativa` (PCR) | `mg/L`; `mg/dL` ×10 | "frequent silent 10x error" | **Não** |
| `paco2` | `mmHg`; `kPa` ×7,50062 | direciona a Escala 2 do NEWS2 | **Não** (apenas seu irmão `pao2` está registrado) |
| `peep`, `pressao_plato`, `pressao_inspiratoria` | `cmH2O`; `mbar` ×1,01972 | o próprio documento de design sinaliza desacordo de limites que precisa de ratificação | **Não** |
| `peso` (peso) | `kg`; hazard de parse decimal vírgula/ponto | SYS-09, ~10× (um bug de **parsing**, não de fator de conversão) | **Não** (totalmente fora do escopo deste módulo — nenhum parâmetro de peso existe aqui) |

**Veredito sobre o registro em runtime como um todo: REJECT completude.**
As cinco conversões implementadas são individualmente sólidas (§2), mas o
módulo não pode ser confiado como "o" aplicador de unidades canônicas que
sua própria docstring e o princípio 1 de `units-registry.md` ("Canonical
at every computation and API boundary") exigem — ele aplica essa fronteira
para um em cada sete domínios clínicos e para aproximadamente um em cada
sete parâmetros catalogados. **TRANSFORM**: estender
`_PARAMETER_REGISTRY` para o catálogo completo de `units-registry.md` (ou
um subconjunto nomeado e ratificado) antes que qualquer consumidor tenha
permissão de presumir segurança de unidade apenas pela presença deste
módulo.

---

## 5. `scripts/verify_units.py` — órfão, obsoleto, e internamente divergente do próprio papel que alega

OBSERVED (`:1-7`): a própria docstring do script o chama de "a skeleton —
extend as the canonical unit registry grows" e declara que seu propósito é
validar unidades de limiar declaradas em YAML contra um dict
`CANONICAL_UNITS` (`:15-29`) por extração de regex ingênua de chaves
`unit:` (`:40-55`, explicitamente "naive").

**Não conectado a nada.** OBSERVED (grep em todo o repositório por
`verify_units`): os únicos dois hits fora do próprio arquivo são uma
menção narrativa em `INTENSICARE_TECHNICAL_ASSESSMENT.md` e uma **alegação
inconsistente** dentro de `scripts/validate_alerts.py` (ver próximo
parágrafo) — nenhum workflow de CI, alvo de `Makefile`, ou hook de
pre-commit invoca `scripts/verify_units.py`. O `inventory.md` o descreve
como "source of Gate A"
(`docs/05-clinical-safety/legacy-review/00-inventory/inventory.md:508`);
isso **não é o que o código faz**.

**A alegação é contradita pela implementação real do Gate A.**
`scripts/validate_alerts.py` (de propriedade do workstream de **pathways**
conforme `coverage-map.md` — não revisado em profundidade aqui, citado
apenas para a checagem cruzada) declara em seu próprio comentário
"Canonical unit registry (source: scripts/verify_units.py)"
(`validate_alerts.py:59-60`), mas **não importa `verify_units.py`** — grep
por `import` naquele arquivo não mostra tal importação; ele carrega seu
**próprio** dict `CANONICAL_UNITS`, mantido **separadamente**
(`validate_alerts.py:61-83`), que **divergiu** do de `verify_units.py`:
ele adiciona `irpm` a `respiratory_rate`, `mL/kg/h` a `volume`,
`dias`/`stage`/`dimensionless`/`ciclos/min/L` a várias categorias, e três
categorias inteiramente novas (`events`, `dose_rate`, `position`) ausentes
de `verify_units.py`. Duas cópias mantidas independentemente de "o"
registro canônico, bifurcadas e divergindo, é precisamente o modo de falha
que o princípio 1 de `units-registry.md` existe para prevenir ("There is
no 'it depends on the site'... resolved *before* the value enters the
system") — e isso já aconteceu entre dois arquivos do *mesmo* repositório
legado.

**Baseado em categoria, não em parâmetro — um descasamento de design com
`units-registry.md`.** O `CANONICAL_UNITS["lab"]` de `verify_units.py`
aceita `{"mg/dL", "mmol/L", "mEq/L", "g/dL", "U/L", "ng/mL", "pg/mL"}` como
*todos* canônicos para o único balde `"lab"` (`:23`) — significando que um
valor de lactato declarado `unit: mg/dL` e um declarado `unit: mmol/L`
**ambos passariam** por esse checker, mesmo que `units-registry.md` §2.1
designe exatamente um deles como canônico para `lactato_arterial` (SYS-03,
classe ~9×) e trate o outro como uma entrada de borda que exige conversão.
Um checker em nível de categoria de "esta unidade está escrita
corretamente" é uma garantia materialmente mais fraca que um checker em
nível de parâmetro de "esta é a única unidade canônica", e não teria
capturado nenhum dos defeitos SYS-01/02/03 que `units-registry.md` §3
documenta.

**Veredito: REJECT** o script atual como nem conectado nem estruturalmente
capaz da garantia de unidade-canônica-única-por-parâmetro que o próprio
documento de design do workstream exige. **TRANSFORM** a *intenção*
(verificação de unidade em tempo de build contra um registro canônico,
conforme o princípio 4 de `units-registry.md`, "unit mismatch is a
BUILD-TIME error, not a runtime surprise") — esta é exatamente a ideia
certa e deve sobreviver na V2, reconstruída com chave por parâmetro contra
o registro único, de fato conectada à CI, e deduplicada contra o que quer
que o Gate A do `validate_alerts.py` do workstream de pathways venha a
ser.

---

## 6. `docs/plan/clinical/units-registry.md` — corpus de design, não código implementado

Este documento (item na própria lista deste workstream) é a **própria
proposta de design voltada para o futuro** da equipe legada para um
registro de unidades V2 — ele **não é** código em produção, e conforme
`docs/00-governance/legacy-import-policy.md` §1/§2 é "risk-informed input,
not authority": informativo, não ratificado sob a governança da V2, e
revisado independentemente aqui em vez de confiado ao pé da letra.

**O que ele acerta (OBSERVED, lido por completo — §2.1-2.9, §3):**
- Um design genuinamente de unidade-canônica-única-por-parâmetro
  (princípio 1), distinção conversão-de-borda vs. alias-1:1 (princípio 2),
  e uma exigência de erro-em-tempo-de-build nomeada (princípio 4) —
  endereçando diretamente a classe de falha exata (§5 acima) encontrada ao
  vivo neste repositório.
- Todo fator carrega uma citação ou uma proveniência nomeada ("provenance
  duty", princípio 5): fatores derivados de peso molecular nomeiam o
  analito, classes de hazard sistêmico (SYS-01/02/03/09) cada uma cita os
  IDs de regra legados específicos e uma magnitude aproximada do defeito
  que fecham.
- Ele corrobora independentemente os achados de §3 deste registro para
  FiO2 (SYS-01, "~100x too small") e nomeia o fator de bilirrubina que a
  §3.2 deste registro mostra não estar implementado, mais vários riscos
  ainda não checados em nenhum lugar do conjunto de arquivos de código em
  runtime deste workstream (hemoglobina 1000×, dosagem de vasopressor
  ~60×, parsing de peso ~10×) — ver §4 acima.

**O que exige validação independente antes de qualquer uso:**
- Todo fator de conversão é **VALIDATION REQUIRED** contra uma referência
  impressa de química clínica/UCUM independentemente de quão bem citado
  pareça aqui — este revisor não reobteve fontes externas (front matter
  acima), e o documento é a própria saída não ratificada da equipe legada,
  não uma fonte primária em si.
- Dois fatores são sinalizados pelos próprios autores do documento como
  "⚠ suspected mislabel" (potássio `mg/dL` ×0,2558, sódio `mg/dL` ×0,435,
  `units-registry.md:113-114`) — esses explicitamente **não** estão
  prontos para nenhum uso, incluindo como citação, sem re-derivação
  clínica independente.
- O "ponteiro de registro de máquina" de §4 nomeia
  `docs/plan/_work/units/registry.yaml` como a fonte machine-readable
  autoritativa ("this markdown never overrides it"). Esse arquivo está
  **fora da lista de itens designados deste workstream** (não presente na
  linha WAVE-1B data-quality-and-physiological-calculation do
  `coverage-map.md`); é anotado aqui apenas como um ponteiro para quem
  quer que venha a ser o dono, não revisado.

**Veredito: VALIDATE** o conteúdo do documento como um PROPOSAL de insumo
bem evidenciado para o registro de unidades real da V2 (teto conforme a
política de importação — nenhum artefato legado, por mais bem citado que
seja, pode entrar na V2 sem validação clínica/empírica independente e
aprovação nomeada); **REJECT** tratá-lo como já verdadeiro do sistema em
runtime — §4 acima mostra que a lacuna é grande.

---

## 7. Resumo sob a lente do HAZ-0005 para este registro

| Pergunta | Resposta |
|---|---|
| Unidade não parseável/não reconhecida | `UnitNormalizationError` disparado (alto), não coagido silenciosamente — correto para a própria função (`:114-117`). |
| Valor fora da faixa | Não é trabalho deste módulo — limites de plausibilidade vivem no cluster de regras `sinais-vitais` (registro separado); `normalize_value` só converte unidades, não checa faixa. |
| Conversão falhada (afim, p.ex. °F) | Disparado alto, não silenciosamente aplicado como se fosse multiplicativo (`:120-124`) — a única escolha de design inequivocamente segura sob o HAZ-0005 neste módulo. |
| Parâmetro inteiramente ausente (p.ex. bilirrubina) | Disparado alto do ponto de vista de `normalize_value` — mas porque o parâmetro nunca foi registrado, isso é indistinguível, no ponto de chamada, de "este sistema não sabe que a bilirrubina precisa de conversão de forma alguma", e (conforme `gold-pipeline-review.md` §2) o chamador não descarta a linha — ela flui adiante com seu valor original, não convertido. **Esta é a exposição residual ao HAZ-0005**: a guarda é alta na camada de registro de unidade, mas silenciosa-por-omissão uma camada acima. |

---

## 8. Resumo de vereditos (este registro)

| Artefato | Veredito |
|---|---|
| `units_normalizer.py` — 5 fatores de conversão implementados | **VALIDATE** (verificado aritmética e por citação; VALIDATION REQUIRED para re-verificação externa e aprovação clínica nomeada antes de qualquer importação) |
| `units_normalizer.py` — completude/cobertura do registro | **REJECT** (5 de ~35 parâmetros catalogados no design; bilirrubina, o risco de destaque do próprio workstream, totalmente ausente) |
| `validate_fio2_fraction` | **REJECT** o estado atual (morta, não conectada); **TRANSFORM** o conceito |
| `scripts/verify_units.py` | **REJECT** (órfão, obsoleto, com chave por categoria e não por parâmetro, divergido da cópia de `validate_alerts.py`, descrito incorretamente como "source of Gate A" quando não é); **TRANSFORM** a intenção |
| `docs/plan/clinical/units-registry.md` | **VALIDATE** o conteúdo como insumo de design; **REJECT** qualquer presunção de que já está implementado |

Todos os vereditos: PROPOSAL — AWAITING NAMED CLINICAL REVIEW
(reviewer: rodaquino-OMNI).
