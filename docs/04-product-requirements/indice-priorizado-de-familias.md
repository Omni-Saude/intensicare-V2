---
doc_id: PROD-REQ-INDICE-PRIORIZADO-FAMILIAS
status: PROPOSAL
owner: UNASSIGNED — VALIDATION REQUIRED
source: >
  docs/05-clinical-safety/safety-requirements.md; docs/05-clinical-safety/hazard-log.md;
  docs/05-clinical-safety/safety-plan.md §3, §6.3, §6.4; docs/03-domain/invariants/DOM-invariants.md;
  docs/06-architecture/quality-attributes/quality-attribute-scenarios.md;
  docs/11-security-privacy-compliance/threat-model.md;
  docs/11-security-privacy-compliance/security-controls-catalog.md;
  docs/01-vision-and-intended-use/intended-use-statement.md;
  docs/01-vision-and-intended-use/non-intended-uses.md;
  docs/02-users-and-workflows/g1-validation-backlog.md;
  docs/05-clinical-safety/pathway-portfolio/{g2-validation-backlog.md,hard-gate-assessment.md,
  candidate-inventory.md,portfolio-method.md,pathway-to-source-matrix.md};
  docs/00-governance/traceability-policy.md §1, §1.1, §2; docs/00-governance/traceability-graph.md;
  docs/00-governance/evidence-notation.md; docs/00-governance/registers/decision-register.md
  (GDEC-0002, GDEC-0015, GDEC-0017); docs/04-product-requirements/README.md (STUB-04)
date_collected: 2026-08-16
collector: especialista de requisitos de produto (SPARK output 7, ciclo 6, MODO CONSTRUÇÃO)
last_updated: 2026-08-16
---

# Índice priorizado das famílias de IDs que hoje funcionam como requisitos de facto

PREMISSA (reversível, GDEC-0015/0017): este índice trata as famílias `SAF-*`, `HAZ-*`,
`THR-*`, `SEC-*`, `DOM-*`, `QAS-*`, `IU-*`/`NIU-*` e `VAL-*` como o substituto de fato de
um catálogo `PRD`/`USR` para fins de leitura e priorização nesta janela de construção; não
cria, ratifica, renumera ou funde nenhum prefixo, não decide a colisão de numeração do
`VAL` nem a pendência de ratificação de `GDEC-0002`, e não substitui o catálogo formal que
`docs/04-product-requirements/README.md` (STUB-04) descreve como devido apenas após o
Gate G1.

## 0. Por que este documento existe, e o que ele não é

`docs/04-product-requirements/README.md` (STUB-04) argumenta que este diretório está
vazio **por desenho**: escrever um catálogo `PRD`/`USR` agora lavaria hipóteses
(`docs/02-users-and-workflows/`) em requisitos, porque nenhum usuário foi observado e o
Gate G1 segue aberto. Esse argumento permanece válido e **não é revisitado aqui**.

O que muda é que, na ausência desse catálogo, sete famílias de identificadores já
existem no repositório, já carregam a palavra "MUST"/"DEVE" em centenas de declarações,
já são citadas por ADRs, pelo contrato AMH, pelo mapa de projeto e pelos registros de
governança, e já funcionam — na prática, não por decisão — como o texto que um leitor
externo (ou um novo agente) procuraria num `PRD`. Fingir que elas não existem não é mais
neutro do que catalogá-las prematuramente; deixaria o leitor sem nenhum mapa do que
**já** pesa como requisito. Este índice é esse mapa: **não define nenhum requisito
novo**, apenas conta, localiza, ordena por prioridade derivada e diz o que falta para
cada família virar catálogo formal.

**Estado factual que este índice preserva, sem alteração, por ser a razão pela qual
nenhuma destas famílias pode hoje ser tratada como catálogo fechado:** vias acionáveis
= **0**; matriz de fontes (§7.2, `docs/08-interoperability/amh-data/pathway-source-matrix/`)
= **47/47 insumos inelegíveis** (fontes evidenciadas = 0); `Observation` da AMH **não
consumível**; achado de compatibilidade AMH = **candidato a integração** (não
demonstrado compatível para avaliação de UTI acionável); safety case = **M0**; nenhum
dado real foi acessado na produção deste índice — apenas os arquivos de código-fonte
listados na proveniência acima. Esse "47/47" é uma contagem **diferente e não
relacionada** ao "47" de `HAZ-0001..HAZ-0047` citado no §3.2 — a coincidência numérica é
acidental e não deve ser lida como correspondência.

## 1. Metodologia

**Regra de contagem:** cada número abaixo foi obtido por `grep`/contagem direta nos
arquivos-fonte citados nesta revisão (2026-08-16), não copiado de um total declarado em
prosa por outro documento. Onde a contagem direta diverge de um total citado em outro
lugar do repositório (por exemplo, um título de arquivo desatualizado), a divergência é
registrada explicitamente na família correspondente — este índice não silencia a
divergência nem a resolve.

**Regra de "família":** um prefixo de ID conta como família se (a) aparece em formato
`<PREFIXO>-<dígitos>` de forma repetida e enumerável num ou mais arquivos-fonte
identificáveis, e (b) cada item carrega uma declaração normativa (MUST/DEVE, proibição,
ou obrigação de detecção) e não apenas uma referência cruzada solta.

**Critério de prioridade ("prioridade derivada de severidade/gate", conforme
solicitado):** duas régua distintas são citadas, uma por família, nunca misturadas sem
dizer qual está em uso:

- **Régua de severidade/prioridade de risco** — para famílias que já têm uma escala
  própria: `SAF-*`/`HAZ-*` usam `S1..S5` × `L1..L5` → classe de risco
  (`safety-plan.md` §6.3); `THR-*` usa bandas `P0/P1/P2` (`threat-model.md` §3); `SEC-*`
  herda prioridade por cobertura de `THR` (`security-controls-catalog.md` §13, "todo
  controle rastreia a pelo menos uma ameaça; toda ameaça tem pelo menos um controle").
  Nestas quatro famílias, prioridade = fração de itens no nível mais alto da régua
  própria, e o gate que essa régua trava é nomeado explicitamente (`safety-plan.md` §3,
  Gate **G6** — "high-severity hazards must have implemented and verified controls or
  formally accepted residual risk... threat-model P0/P1 closed or accepted").
- **Régua de posição no grafo de rastreabilidade** — para famílias sem escala S/L/P
  própria: `DOM-*` prioriza por "direciona" (`traceability-graph.md` regra 3: `DOM` →
  `ADR`, ou seja, toda decisão de arquitetura deveria citar um `DOM` que a restringe);
  `QAS-*` prioriza por qual princípio de arquitetura opera (`§9.1` do prompt, 12
  princípios, com `DOM-0001..DOM-0007` cobrindo os 7 primeiros 1:1); `IU-*`/`NIU-*`
  priorizam por posição de gate (Gate **G1**, o gate mais a montante — nada abaixo dele
  é sequer elegível a virar `PRD`, per STUB-04); `VAL-*` prioriza por qual item de
  fechamento de gate rastreia, mas com prioridade rebaixada pela colisão de numeração
  declarada no §3.8.

A ordem final abaixo é **PROPOSAL/INFERENCE deste agente**, não uma decisão ratificada —
nenhum comitê revisou esta ordenação.

## 2. Tabela-resumo priorizada

| # | Família | Contagem real | Arquivo-fonte principal | Formato de ID | Gate que governa | Estado de validação (resumo) |
|---|---|---|---|---|---|---|
| 1 | `SAF-*` | **42** (`SAF-0001`..`SAF-0042`, sequência completa) | `docs/05-clinical-safety/safety-requirements.md` | `SAF-NNNN`, ratificado (`traceability-policy.md` §1) | **G6** (controlador) | 100% `PROPOSAL`/`VALIDATION REQUIRED`; 0 implementado, 0 verificado, 0 aceito |
| 2 | `HAZ-*` | **47** (`HAZ-0001`..`HAZ-0047`) | `docs/05-clinical-safety/hazard-log.md` | `HAZ-NNNN`, ratificado | **G1** (escala de severidade) → **G6** (fechamento) | 100% `OPEN`; 40/47 (85%) classe `S4`/`S5` |
| 3 | `THR-*` | **83** (67 ciclo 0 + 16 extensão ciclo 1, `THR-0001`..`THR-0083`) | `docs/11-security-privacy-compliance/threat-model.md` | `THR-NNNN`, **pendente de ratificação** (`GDEC-0002`) | **G6** | 100% `OPEN`; 32/83 (39%) banda `P0` |
| 4 | `SEC-*` | **59** (`SEC-0001`..`SEC-0059`; título do arquivo ainda diz `SEC-0001..SEC-0050`) | `docs/11-security-privacy-compliance/security-controls-catalog.md` | `SEC-NNNN`, ratificado | **G6** | 100% `PROPOSAL`; `TST: UNASSIGNED` em todos |
| 5 | `DOM-*` | **9** (`DOM-0001`..`DOM-0009`) | `docs/03-domain/invariants/DOM-invariants.md` | `DOM-NNNN`, ratificado | direciona ADRs (regra 3 do grafo); sem gate numérico próprio | 100% `PROPOSAL`, aguardando ratificação para virar `DECIDED` |
| 6 | `QAS-*` | **29** (`QAS-0001`..`QAS-0029`) | `docs/06-architecture/quality-attributes/quality-attribute-scenarios.md` | `QAS-NNNN`, **document-local, não é ID de `traceability-policy.md`** | **G1** (alvo numérico) + **G3** (medição) | 100% `VALIDATION REQUIRED`; 0 alvo numérico declarado (deliberado) |
| 7 | `IU-*` | **28** identificadores distintos (10 cabeçalhos de topo `IU-01..IU-11`, exceto `IU-08`/`IU-12` só como subitens; + 18 subletras) | `docs/01-vision-and-intended-use/intended-use-statement.md` | `IU-NN[a-z]`, 2 dígitos, **document-local** | **G1** (é o objeto que o `MG-G1` aprova) | 1 marcado 🚩 `BLOCKING DECISION` (`IU-06`); restante `PROPOSAL`/`VALIDATION REQUIRED` |
| 8 | `NIU-*` | **15** identificadores distintos (10 cabeçalhos `NIU-01..NIU-10` + 5 subletras em `NIU-04`) | `docs/01-vision-and-intended-use/non-intended-uses.md` | `NIU-NN[a-z]`, 2 dígitos, **document-local** | **G1** | `PROPOSAL`; lista negativa companheira de `IU-*` |
| 9 | `VAL-*` | **43** num cluster + **40** identificadores distintos noutro cluster, **faixas colidentes** (`VAL-0001`..`VAL-0041`~`0043` reaproveitado por dois autores) | `docs/02-users-and-workflows/g1-validation-backlog.md` (43) **e** `docs/05-clinical-safety/pathway-portfolio/*` (40, 5 arquivos) | `VAL-NNNN`, ratificado no §1 **mas sem registro central** | **G1**/**G2** (cada item fecha um ponto de gate distinto) | Colisão de numeração **não resolvida**; auto-sinalizada pela própria autora do cluster G1 |

**Nota de leitura da tabela:** as contagens de `VAL-*` **não devem ser somadas** (43 + 40
≠ 83 itens reais) — são dois espaços de numeração que reusam a mesma faixa
`VAL-0001..VAL-00xx` de forma independente, exatamente o cenário que
`traceability-policy.md` §2 regra 4 proíbe ("two specialists must not mint IDs for the
same prefix concurrently without coordinating through a shared register"). Ver §3.8.

## 3. Famílias, em ordem de prioridade

### 3.1 `SAF-*` — Requisitos de segurança clínica

- **Contagem real:** 42 cabeçalhos `### SAF-NNNN` em
  `docs/05-clinical-safety/safety-requirements.md`, sequência `SAF-0001`..`SAF-0042`
  sem lacuna — confere com o título do próprio arquivo ("SAF-0001..SAF-0042").
- **Papel no ciclo de vida:** é o ponto terminal declarado do processo de hazard: "every
  hazard must terminate in a `SAF-xxxx` requirement, and every `SAF-xxxx` requirement
  must terminate in a blocking automated gate or a named human acceptance — never in a
  document" (`safety-plan.md`, racional do §3). Cada `SAF` nomeia barreira (`ELIM`/
  `PREV`/`DET`/`MIT`/`PROC`), hazards-pai (§I do próprio arquivo) e método de
  verificação — a forma mais próxima de um requisito testável que existe hoje no
  repositório.
- **Prioridade (critério citado):** régua de severidade — dos 42, aqueles ligados a
  hazards `S4`/`S5` (40 de 47 hazards, ver §3.2) herdam a regra de barreira única do
  §6.4 do `safety-plan.md` ("an S4/S5 hazard may not rely on `PROC` alone... may not
  rely on a single barrier"). Uma exceção **declarada e não contornada** existe:
  `HAZ-0045` (S5) tem, do lado da V2, apenas `SAF-0042` (`DET`), porque a barreira
  preventiva pertence à governança do índice ADR-043 e ao parecer OS-16, fora desta
  organização de software (`safety-requirements.md` §I, nota após a tabela).
- **Estado de validação:** every requirement is status `PROPOSAL`, owner
  `UNASSIGNED — VALIDATION REQUIRED`, verification `NOT PERFORMED` — citação literal do
  próprio arquivo. Nenhum tem ADR, contrato, teste ou implementação associada
  (`safety-requirements.md` §J).
- **Gatilho de formalização (G1/MG-G1 conforme STUB-04):** o próprio arquivo já responde
  isto para si — vira catálogo aceito apenas em **G6** ("the controlling gate for this
  plan"), que por sua vez pressupõe que **G1** tenha fechado (harm definitions tied to
  the validated care setting) e **G2** (portfólio de pathways aprovado) tenha fornecido
  o `CLR` que hoje não existe como catálogo (`traceability-graph.md` linha `CLR`). Até
  lá, `SAF-*` permanece o candidato mais forte a virar a seção de segurança clínica de
  um futuro `PRD`, mas não é ele.

### 3.2 `HAZ-*` — Log de hazards clínicos (seed)

- **Contagem real:** 47 linhas `**HAZ-NNNN**` em
  `docs/05-clinical-safety/hazard-log.md`, `HAZ-0001`..`HAZ-0047` — confere com o
  título ("Forty-seven hazards"). Distribuição de severidade contada diretamente na
  tabela: **26** `S4`, **14** `S5`, 7 `S3` (nenhum `S1`/`S2`); classe de risco: **36**
  `Unacceptable`, 11 `Undesirable`.
- **Papel no ciclo de vida:** é o insumo do qual `SAF-*` deriva (§I de
  `safety-requirements.md`, tabela hazard → controles candidatos) e o objeto que
  `threat-model.md` referencia via links `HAZ` em cada linha `THR` — é o ponto de
  junção entre o domínio clínico e o domínio de segurança/privacidade.
- **Prioridade (critério citado):** régua de severidade própria (`safety-plan.md`
  §6.3): `S` × `L` → classe de risco. 40/47 (85%) hazards estão em `S4`/`S5`, o que os
  torna todos sujeitos à regra de barreira única do §6.4. O exit criterion do Gate
  **G1** nomeia explicitamente "Intended-use-scoped hazard set; severity scale
  ratified" como o artefato de segurança devido (`safety-plan.md` §3) — ou seja, `HAZ-*`
  é a família cuja *ratificação da escala*, não apenas o preenchimento das linhas, é o
  próprio critério de saída do Gate G1 do lado de segurança.
- **Estado de validação:** todo hazard é `OPEN`, todo owner `UNASSIGNED`, toda
  severidade/probabilidade é `PROPOSAL` — "Nothing was downgraded. No hazard in this
  file is closed, accepted, or verified" (front matter do próprio arquivo).
- **Gatilho de formalização:** o mesmo Gate **G1** cujo critério de saída é "severity
  scale ratified" fecha esta família como catálogo formal; **G2** (per-pathway hazard
  analysis) e **G3** (likelihoods re-estimados contra feeds medidos da AMH) a refinam
  antes de **G6** poder fechar qualquer hazard individual.

### 3.3 `THR-*` — Modelo de ameaças

- **Contagem real:** **83** identificadores distintos `THR-NNNN` em
  `docs/11-security-privacy-compliance/threat-model.md`: 67 do ciclo 0
  (`THR-0001`..`THR-0067`, tabela "Total" §5) + 16 da extensão de ciclo 1 sobre o
  contrato AMH (`THR-0068`..`THR-0083`, tabela "Total desta extensão" §12). O front
  matter do próprio arquivo já foi atualizado para "83 ameaças, TODAS OPEN"; **a linha
  7 do mesmo front matter e `traceability-graph.md` linha `THR` ainda citam "67" — essa
  divergência é do arquivo-fonte e de outro documento, não deste índice, e é registrada
  aqui em vez de silenciada.**
- **Papel no ciclo de vida:** é o par de segurança/privacidade de `HAZ-*` — cada linha
  liga um `HAZ` (harm clínico) a um `SEC` candidato (controle) com banda de prioridade
  própria; a extensão de ciclo 1 cobre especificamente a superfície nova do contrato
  AMH (lane de eventos de identidade, `resolve(ref, as_of)`, PSR como pseudônimo).
- **Prioridade (critério citado):** bandas `P0`/`P1`/`P2` definidas em `threat-model.md`
  §3 ("Priority definitions"). Contagem exata por banda, somando as duas tabelas de
  totais do arquivo: **P0 = 32** (27 + 5), **P1 = 50** (39 + 11), **P2 = 1** (1 + 0).
  `P0`/`P1` são ambas "G6-gating" por definição da própria banda — ou seja, 82 das 83
  ameaças (99%) travam o Gate **G6** até fechadas ou aceitas.
- **Estado de validação:** todo `THR` é `Status = OPEN`, `Owner = UNASSIGNED`,
  "priority PROPOSAL... no finding here is closed, accepted, or verified" (front
  matter). "the priority assignment has had no independent review" — `AUTH-SECURITY` é
  `UNASSIGNED` (`BLK-0003`, citado no próprio arquivo).
- **Gatilho de formalização:** `traceability-policy.md` §1.1 item 6 marca `THR` como
  **pendente de ratificação formal** — vira prefixo de taxonomia apenas com
  `GDEC-0002`. Como catálogo de requisito de fato (independente da ratificação de
  prefixo), fecha via Gate **G6**, na mesma cláusula que governa `SAF-*`/`HAZ-*`
  ("threat-model P0/P1 closed or accepted").

### 3.4 `SEC-*` — Catálogo de controles de segurança

- **Contagem real:** **59** cabeçalhos `### SEC-NNNN`/`#### SEC-NNNN` em
  `docs/11-security-privacy-compliance/security-controls-catalog.md`,
  `SEC-0001`..`SEC-0059`. **O título do próprio documento diz "SEC-0001..SEC-0050"** —
  os nove controles `SEC-0051`..`SEC-0059` foram acrescentados depois sem atualizar o
  título; `traceability-graph.md` também cita "50" (mesma desatualização, arquivo
  diferente). Este índice usa a contagem direta (59), não o título desatualizado.
- **Papel no ciclo de vida:** é o par de segurança de `SAF-*` — mesma disciplina de
  "declaração testável, não aspiracional" (§0 do catálogo), mesma regra de
  independência implementador ≠ verificador. Cada controle rastreia a pelo menos uma
  ameaça `THR`; cada ameaça tem pelo menos um controle candidato (§13, "Threat →
  control coverage").
- **Prioridade (critério citado):** prioridade herdada por cobertura — um `SEC` que
  cobre um `THR` banda `P0` herda a urgência de fechamento de Gate **G6** desse `THR`.
  Nenhuma banda de prioridade própria existe no catálogo de controles; a régua é
  sempre a do `THR` que ele endereça (ver §3.3).
- **Estado de validação:** todo controle é `PROPOSAL`; `Verification` nomeia o método
  mas declara "**None has been executed**"; `TST` não é cunhado aqui deliberadamente —
  "every entry reads `TST: UNASSIGNED`" (§0 do catálogo).
- **Gatilho de formalização:** mesmo caminho de `SAF-*` — Gate **G6** ("security
  acceptance... three distinct humans", `safety-plan.md` §3) é quem aceitaria um
  `SEC` como controle implementado e verificado, não apenas candidato.

### 3.5 `DOM-*` — Invariantes de domínio

- **Contagem real:** **9** (`DOM-0001`..`DOM-0009`) em
  `docs/03-domain/invariants/DOM-invariants.md` — confere com o índice interno do
  próprio arquivo (§"Index").
- **Papel no ciclo de vida:** são as únicas declarações verdadeiramente arquiteturais
  desta lista — "statements that must hold true across the whole conceptual model,
  independent of any future physical schema, storage technology, or service topology"
  (racional do próprio arquivo). Diferente de `SAF`/`HAZ`/`THR`/`SEC`, não nasceram de
  um hazard individual; nasceram dos 12 princípios de arquitetura do prompt §9.1 (as
  primeiras 7 têm correspondência 1:1 com `DOM-0001`..`DOM-0007`, e `DOM-0008`/`0009`
  vêm de §7.6/§3 regra 8).
- **Prioridade (critério citado):** régua de posição no grafo, não de severidade —
  `traceability-graph.md` regra 3: `DOM` → "direciona" → `ADR`. Na prática já observada,
  ADRs aceitas citam `DOM` como restrição (`traceability-graph.md` linha `ADR`: "7
  `accepted` (`GDEC-0007`)"). Isso torna `DOM-*`, apesar de ter só 9 itens, a família
  com maior alcance por item: uma violação de `DOM-0001` (posse de tenant) invalida
  potencialmente qualquer ADR de armazenamento, cache, evento, query ou auditoria já
  aceita.
- **Estado de validação:** "Every entry is a **PROPOSAL**... and requires ratification
  by the accountable architecture and safety authorities before it can be treated as
  **DECIDED**" (racional do próprio arquivo). Cada invariante já nomeia sua futura
  `TST-DOM-xxxx`, mas nenhuma foi cunhada ainda.
- **Gatilho de formalização:** o próprio arquivo nomeia o mecanismo — ratificação pelas
  "accountable architecture and safety authorities", sem gate numérico próprio citado.
  Por transitividade (regra 3 do grafo), qualquer requisito `PRD`/`NFR` que viole um
  `DOM` já ratificado seria rejeitável antes mesmo de chegar a uma ADR — o que faz de
  `DOM-*` um pré-filtro natural para qualquer catálogo `PRD` futuro, não apenas um
  insumo dele.

### 3.6 `QAS-*` — Cenários de atributo de qualidade

- **Contagem real:** **29** (`QAS-0001`..`QAS-0029`) em
  `docs/06-architecture/quality-attributes/quality-attribute-scenarios.md` — confere
  com o índice interno §1.4. Divisão declarada no próprio arquivo: `QAS-0001`..`0016`
  derivam da lista de SLOs de operabilidade (§15.3 do prompt, b1–b10); `QAS-0017`..
  `0023` mapeiam 1:1 para `DOM-0001`..`DOM-0007`; `QAS-0024`..`0028` mapeiam para os
  princípios de arquitetura 8–12; `QAS-0029` deriva do parágrafo de fechamento de
  readiness do §15.3.
- **Papel no ciclo de vida:** é a camada "o que medir e sob quais condições" — cada
  cenário usa a forma padrão estímulo/ambiente/resposta/medida, mas **nenhum valor
  numérico de alvo aparece em nenhum dos 29, deliberadamente** ("a plausible-looking
  number here would be read downstream as a requirement... more damaging than an
  admitted blank", §Introdução do próprio arquivo).
- **Prioridade (critério citado):** régua de posição — o subconjunto `QAS-0017`..
  `0023` herda a prioridade de `DOM-*` (ligação 1:1 com invariantes já em uso por
  ADRs aceitas); o restante depende de seis pré-requisitos hoje **todos ausentes**
  (§1.3 do próprio arquivo: P1 "Validated user/safety needs" via Gate G1 — absent; P2
  portfólio aprovado via Gate G2 — absent; P3 ambiente AMH alcançável via Gate G3 —
  absent; P4 ambiente production-like — absent; P5 instrumentação — not built; P6
  pontos de tempo distintos — modelado em `DOM-0009`, não implementado).
- **Estado de validação:** "Every target below reads `VALIDATION REQUIRED`" — status do
  próprio arquivo, sem exceção.
- **Gatilho de formalização (G1/MG-G1 conforme STUB-04):** dupla pendência, ambas
  citadas pelo próprio arquivo: (a) Gate **G1** fornece o "quanto" que falta a cada
  cenário ("Gate G1 supplies *how much*"); (b) o prefixo `QAS` em si está **pendente de
  ratificação** (`traceability-policy.md` §1 item 4) com duas opções não decididas —
  Opção A (converter cada cenário 1:1 em `NFR-xxxx` quando o catálogo de requisitos
  existir) ou Opção B (ratificar `QAS` como prefixo permanente). O próprio arquivo já
  registra essa resolução como responsabilidade do orquestrador, não deste índice.

### 3.7 `IU-*` / `NIU-*` — Uso pretendido e usos explicitamente não pretendidos

- **Contagem real:**
  - `IU-*`: **28** identificadores distintos em
    `docs/01-vision-and-intended-use/intended-use-statement.md` — 10 cabeçalhos de
    nível de seção (`IU-01`..`IU-07`, `IU-09`..`IU-11`; **`IU-08` e `IU-12` não têm
    cabeçalho próprio**, aparecem só como subletras em tabela) + 18 subletras
    (`IU-04a`..`f`, `IU-08a`..`c`, `IU-12a`..`i`).
  - `NIU-*`: **15** identificadores distintos em
    `docs/01-vision-and-intended-use/non-intended-uses.md` — 10 cabeçalhos
    (`NIU-01`..`NIU-10`) + 5 subletras (`NIU-04a`..`e`).
  - Ambos em formato de 2 dígitos sem zero-padding de 4 dígitos — não conformam ao
    formato `<PREFIX>-<NNNN>` de `traceability-policy.md` §2 regra 1, e ambos são
    citados por `traceability-policy.md` §1.1 item 6 como "document-local labels, not
    yet assigned stable sequential IDs; counts were not centrally tracked at
    verification time" — as contagens acima são, portanto, a primeira contagem central
    registrada para estas duas famílias.
- **Papel no ciclo de vida:** juntas, são o par que **define** o objeto que o Gate G1
  aprova — `IU-*` afirma o que a V2 se propõe a fazer (problema, população, ambiente,
  fronteira "advisory"), `NIU-*` afirma o que a V2 explicitamente não faz (10
  exclusões, de "não é substituto de julgamento clínico" a "não aprovado para nenhum
  uso, a partir de 2026-08-14"). São, estruturalmente, o par PRD/USR mais próximo já
  escrito — mas como hipótese e limite, não como requisito aceito.
- **Prioridade (critério citado):** régua de posição de gate — Gate **G1** é o mais a
  montante de todos os gates listados em `safety-plan.md` §3; nenhuma outra família
  deste índice é elegível a virar catálogo formal antes que o objeto que `IU-*`/`NIU-*`
  descrevem seja aprovado (`MG-G1`, o marco humano de gate G1 citado em
  `mapa-de-projeto-ate-producao.md`, fora do escopo de escrita deste documento). Dentro
  da família, `IU-06` carrega a marcação mais forte do repositório para uma única
  entrada — 🚩 **BLOCKING DECISION** (populações pediátrica e neonatal) — o que a
  coloca acima de qualquer outro item de `IU-*`/`NIU-*` nesta ordenação interna.
- **Estado de validação:** ambos os arquivos são `status: PROPOSAL`. Vários subitens
  carregam `VALIDATION REQUIRED` explícito (por exemplo, a fronteira `IU-08b`/`IU-08c`
  entre enfermeiro de beira-leito e coordenador é rotulada "a hypothesis about how ICU
  work is divided in the pilot site, not an observation").
- **Gatilho de formalização:** o mesmo Gate **G1**, fechado pelo ato humano `MG-G1`
  (aprovação nominal do uso pretendido pelo aprovador nomeado) — precondição que STUB-04
  já nomeia ("Gate G1 passes (observed workflows + named intended-use approver)").
  Adicionalmente, o **formato** de ID (2 dígitos, sem zero-padding) precisaria de uma
  decisão própria de formato antes de qualquer renumeração para `<PREFIX>-<NNNN>`,
  como já ocorre com `IDP`/`IDN` (`traceability-policy.md` §1.1 item 5) — este índice
  não propõe essa renumeração.

### 3.8 `VAL-*` — Itens de validação humana/externa

- **Contagem real — colisão de numeração declarada, não uma contagem única:**
  - Cluster 1: **43** identificadores `VAL-0001`..`VAL-0043` em
    `docs/02-users-and-workflows/g1-validation-backlog.md`.
  - Cluster 2: **40** identificadores distintos (faixa `VAL-0001`..`VAL-0041`,
    lacunas internas) somando os 4 arquivos de
    `docs/05-clinical-safety/pathway-portfolio/` que citam `VAL`
    (`g2-validation-backlog.md`, `hard-gate-assessment.md`, `candidate-inventory.md`,
    `portfolio-method.md`, `pathway-to-source-matrix.md`).
  - Os dois clusters **reusam a mesma faixa numérica de forma independente** — `VAL-0001`
    em `g1-validation-backlog.md` e `VAL-0001` no cluster de `pathway-portfolio/` **não
    são o mesmo item**. Este índice não tenta resolver qual `VAL-0001` é "o" `VAL-0001`;
    apenas confirma, por leitura direta dos dois clusters, que a colisão descrita em
    `traceability-policy.md` §1.1 item 6 é real e observável hoje, não apenas um risco
    teórico.
- **Papel no ciclo de vida:** é a família de "o que só um humano ou um sistema externo
  pode fechar" — cada linha nomeia um ato humano nomeado (aprovação de uso pretendido,
  comissionamento de observação, revisão de acessibilidade por tecnologia assistiva
  etc.), nunca um teste automatizado. `g1-validation-backlog.md` marca explicitamente
  seus próprios IDs como provisórios: "renumbered by the traceability owner before
  ratification. IDs here are provisional."
- **Prioridade (critério citado):** régua de posição de gate — cada `VAL` está ligado a
  um item de fechamento de um gate específico (G1 no cluster 1; G2, via
  `hard-gate-assessment.md`, no cluster 2). Dentro do cluster 1, ao menos um item já
  tem rota de fechamento registrada por decisão do titular (`VAL-0005`: "risco aceito"
  via `RISK-0013` + pedido §6, fechamento formal remanescente no `MG-G1`); a maioria
  permanece `ATO-HUMANO` sem data.
- **Estado de validação:** por definição de família, todo item é
  `VALIDATION REQUIRED` até o ato humano nomeado ocorrer — não há um estado
  intermediário "verificado por agente" que se aplique a `VAL`.
- **Gatilho de formalização:** dois gatilhos independentes, nenhum decidido por este
  índice: (a) resolução da colisão — `traceability-policy.md` §1.1 item 6 nomeia como
  mitigação candidata um "registro mestre `VAL`" a ser decidido por quem ratificar a
  taxonomia (`GDEC-0002`); (b) fechamento por gate — cada item individual fecha quando
  seu `MG-G1`/`MG-G2` correspondente ocorre. Até (a) acontecer, `VAL-*` é a família
  **menos** utilizável como catálogo estável apesar de ter, somadas sem deduplicar, o
  maior número bruto de linhas (83) de todas as nove famílias deste índice — razão
  pela qual fica em último lugar nesta priorização, não pelo tamanho, mas pela
  ausência de uma fonte única da verdade.

## 4. O que este índice não faz

Não cria nenhum `PRD`/`USR`. Não ratifica `THR`/`QAS`/`IU`/`NIU` na taxonomia de
`traceability-policy.md` — isso é `GDEC-0002`, decisão humana pendente, não revisitada
aqui. Não resolve a colisão de numeração `VAL`. Não corrige os títulos desatualizados de
`threat-model.md` (linha 7, "sixty-seven") nem de `security-controls-catalog.md`
("SEC-0001..SEC-0050") nem de `traceability-graph.md` (contagens de `THR`/`SEC`
desatualizadas para 67/50) — esses são defeitos menores nos próprios arquivos-fonte,
fora do escopo de escrita desta tarefa, e ficam registrados aqui como achado, não como
correção. Não afirma efetividade clínica, conformidade regulatória ou segurança
comprovada de nenhuma família. Não fecha, aceita ou verifica nenhum `SAF`, `HAZ`, `THR`,
`SEC`, `DOM`, `QAS`, `IU`, `NIU` ou `VAL` individual. Não presume aprovação humana de
nenhum item listado.

## 5. Proveniência

| Elemento | Fonte |
|---|---|
| Todas as contagens de §2/§3 | leitura direta dos arquivos-fonte listados no front matter, 2026-08-16 |
| Escalas S/L, classe de risco, Gates G0–G8 | `docs/05-clinical-safety/safety-plan.md` §3, §6.3, §6.4 |
| Bandas de prioridade `THR` (P0/P1/P2) e totais por banda | `docs/11-security-privacy-compliance/threat-model.md` §3, §5, §12 |
| Regra de cobertura `SEC`↔`THR` | `docs/11-security-privacy-compliance/security-controls-catalog.md` §0, §13 |
| Regra "`DOM` direciona `ADR`" | `docs/00-governance/traceability-graph.md` §2 (diagrama), regra 3 |
| Pendências de ratificação `THR`/`QAS`/`IDP`/`IDN`, colisão `VAL` | `docs/00-governance/traceability-policy.md` §1.1 |
| Formato `<PREFIX>-<NNNN>` e regra de não-concorrência de cunhagem | `docs/00-governance/traceability-policy.md` §2 regras 1 e 4 |
| Racional "não escrever `PRD`/`USR` agora" | `docs/04-product-requirements/README.md` (STUB-04) |
| `MG-G1` como ato humano de fechamento do Gate G1 | `docs/02-users-and-workflows/dossie-substituto-multi-fonte-g1.md` §6 (citação de leitura; arquivo não alterado por este índice) |
| Estado factual "0 vias / 47/47 / M0 / candidato a integração" | `docs/15-release-evidence/cycle-5-execution-report.md` (citação de leitura) |
