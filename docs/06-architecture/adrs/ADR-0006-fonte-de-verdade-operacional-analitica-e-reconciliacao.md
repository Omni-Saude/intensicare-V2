---
id: ADR-0006
title: Fonte de verdade operacional versus analítica e reconciliação entre lanes
status: proposed
status_history:
  - status: not-started
    date: 2026-08-14
    by: candidate-architecture and ADR-program engineer (Wave 2)
    note: ID reservado em adr-index.md (§10 item 6 do prompt)
  - status: proposed
    date: 2026-08-15
    by: arquiteto de decisões de runtime e entrega (ciclo 1)
    note: >
      Redigido em pt-BR (DEC-G0-10). Opções, drivers e minuta normativa proposta;
      a alegação histórica "Gold/Athena lento demais para alerta em segundos" é
      tratada como HIPÓTESE A TESTAR com método de medição, jamais como fato.
      NENHUMA decisão é registrada e nenhum agente pode registrá-la.
date: 2026-08-15
owner: >
  UNASSIGNED — VALIDATION REQUIRED (candidatos por adr-index.md §3:
  AUTH-DATA-PLATFORM — detido por rodaquino-OMNI via DEC-G0-04 — e AUTH-CLINSAFETY —
  rodaquino-OMNI via GDEC-0003; a confirmação como dono é ato humano, não deste autor)
approvers:
  - UNASSIGNED — VALIDATION REQUIRED   # role: AUTH-DATA-PLATFORM (DEC-G0-04)
  - UNASSIGNED — VALIDATION REQUIRED   # role: AUTH-CLINSAFETY (cláusulas com consequência clínica: precedência, backfill, divergência)
decision_deadline: >
  UNSET — VALIDATION REQUIRED. Restrição de ordem: docs/07-data-and-provenance
  declara-se deliberadamente vazio até ADR-0005 E ADR-0006 aceitos; o Gate G3
  lista este ADR entre os que precisam estar resolvidos (adr-index.md §5).
deciding_authority_rule: >
  docs/00-governance/decision-rights.md §2, linha "Architecture decisions (ADR
  ratification)"; cláusulas com consequência clínica direta (precedência de
  fato clínico, admissibilidade de backfill, visibilidade de divergência)
  exigem adicionalmente AUTH-CLINSAFETY.
independence_check: >
  decision-rights.md §3: quem implementar a reconciliação entre lanes NÃO pode
  aceitar a evidência de divergência correspondente (par conector ×
  aceitação de conformidade externa). Este ADR foi redigido por agente; nenhum
  agente o aprova; o autor não é aprovador.
links:
  drivers:
    domain_invariants: [DOM-0001, DOM-0002, DOM-0003, DOM-0004, DOM-0006, DOM-0007, DOM-0008, DOM-0009]
    quality_scenarios: [QAS-0001, QAS-0003, QAS-0009, QAS-0010, QAS-0012, QAS-0015, QAS-0019, QAS-0020, QAS-0022, QAS-0023, QAS-0027]
    risks: ["pending risk register IDs — see docs/00-governance/registers/risk-register.md"]
  constrains:
    requirements: ["REQ: pendente de catálogo de requisitos (docs/04-product-requirements ainda não existe)"]
    clinical: ["CLR: pendente do portfólio de vias clínicas (Gate G2)"]
    safety: [SAF-0004, SAF-0011, SAF-0014, SAF-0024, SAF-0031, SAF-0032, SAF-0033, SAF-0036]
  hazards: [HAZ-0008, HAZ-0010, HAZ-0025, HAZ-0030, HAZ-0034, HAZ-0038, HAZ-0039, HAZ-0040, HAZ-0043]
  tests: ["TST-DOM-0002", "TST-DOM-0003", "TST-DOM-0006", "TST: pendente de arquitetura de teste"]
  validations: ["VAL: pendente do backlog de validação"]
  adrs:
    depends_on: [ADR-0001, ADR-0005]
    feeds: [ADR-0008, ADR-0010, ADR-0020]
  gates: [G3]
  evidence:
    - docs/06-architecture/adrs/ADR-0001-amh-platform-boundary.md
    - docs/06-architecture/adrs/ADR-0005-modelo-canonico-observacao-proveniencia-qualidade-correcao-tempo.md
    - docs/08-interoperability/amh-data/compatibility-finding.md
    - docs/08-interoperability/amh-data/four-layer-dossier.md
    - docs/03-domain/invariants/DOM-invariants.md
    - docs/05-clinical-safety/hazard-log.md
supersedes: null
superseded_by: null
provenance:
  source_repo: intensicare-V2
  path_or_url: docs/06-architecture/adrs/ADR-0006-fonte-de-verdade-operacional-analitica-e-reconciliacao.md
  commit_sha_or_version: 0c36f03 (HEAD do repositório na redação; este arquivo não está commitado)
  section_or_lines: >
    INTENSICARE_V2_ORCHESTRATOR_PROMPT.md §2 (evidências 3, 11, 13; alegação legada
    de frescor LEGACY-TA:229-241), §7.0, §7.3, §9.1 princípios 3/4/6, §10 item 6;
    ADR-0001 §2 (E6, E14), §5.2 (P3); ADR-0005 §5.2 (M1-M10); ADR-0008 §4.2 (N5, N6, N8)
  date_collected: 2026-08-15
  collector: arquiteto de decisões de runtime e entrega (ciclo 1)
  transformation: >
    reasoned-from — opções e drivers derivados do prompt, do ADR-0001 e do ADR-0005;
    nenhum artefato AMH foi reverificado (linhas AMH são SOURCE por citação do dossiê).
  confidence: medium
  owner: UNASSIGNED — VALIDATION REQUIRED
  validation_status: VALIDATION REQUIRED
---

# ADR-0006 — Fonte de verdade operacional versus analítica e reconciliação entre lanes

> **Status: `proposed`. Este documento apresenta opções, drivers e uma minuta
> normativa proposta (§5.2). NÃO registra decisão e nada abaixo pode ser citado
> como assentado.** Uma restrição do prompt §7.3 não é alternativa em avaliação:
> *"Never create two ungoverned clinical sources of truth. Define precedence,
> conflict, correction, replay, and reconciliation behavior."* — ela vincula toda
> opção abaixo.

---

## 1. Contexto e formulação do problema

SOURCE (prompt §7.0, hipóteses 2 e 3): a hipótese de partida do programa propõe que
a V2 seja dona do seu estado operacional crítico de segurança (avaliações, alertas,
auditoria, replay) e que as saídas Gold/Athena/Iceberg da AMH sirvam reconciliação,
backfill, desfechos, vigilância de qualidade e analytics — *"not the live safety
loop"*. SOURCE (prompt §7.3): essa mesma seção exige testar *"the assessment's
historical claim that Gold/Athena-style availability may be too slow for a
seconds-level alert objective"* e, se a alegação persistir verdadeira, definir duas
lanes explícitas — operacional durável e analítica/reconciliação — com precedência,
conflito, correção, replay e reconciliação definidos.

INFERENCE (de ADR-0001 §5.2 e ADR-0005 §1): o ADR-0001 encaminhou ao titular a
proposta P3 ("saídas Gold/analíticas servem reconciliação/backfill/desfechos —
nunca o laço vivo; precedência, conflito, correção e replay entre lanes são matéria
do ADR-0006") e o ADR-0005 propôs a forma canônica do fato clínico com correção
explícita e envelope retido. Este ADR é o lugar reservado para a *mecânica* entre
lanes que ambos delegam. Sem ele: `docs/07-data-and-provenance` permanece bloqueado
(declara-se vazio até ADR-0005/0006 aceitos), o Gate G3 tem uma pendência de
resolução (adr-index.md §5) e o ADR-0008 — já aceito — referencia um comportamento
de correção/chegada tardia (N6) cuja origem entre lanes ninguém definiu.

**Pergunta.** Qual lane é a fonte de verdade dos fatos e estados que o laço de
segurança consome e produz; que papel exatamente a lane analítica desempenha; e que
regras de precedência, conflito, correção, replay e reconciliação governam a
relação entre as duas — de modo que jamais existam duas fontes clínicas de verdade
não governadas?

**Fora de escopo** (cada item nomeado):

- Se a lane near-real-time AMH existe ou será construída — propriedade de fronteira
  do **ADR-0001** (opções A/C/D). Este ADR define a relação operacional×analítica
  sob *qualquer* opção de fronteira que mova dados clínicos (ver §4.2).
- A forma canônica do fato, correção e conflito no nível do registro — **ADR-0005**
  (consumido como insumo).
- Semântica dos cinco estados de avaliação e transições de atualidade —
  **ADR-0008** (aceito; consumido como restrição).
- Mecânica de publicação transacional, entrega e replay de *eventos* — **ADR-0010**.
- Projeções de leitura e entrega em tempo real — **ADR-0011**.
- Política de importação legada e migração — **ADR-0023** (o backfill governado
  daqui cita a política de lá, não a substitui).
- SLOs, monitoramento e DR das lanes — **ADR-0020**.

---

## 2. Evidência e premissas

### 2.1 Evidência

**Nota epistêmica única.** Nenhum artefato AMH foi reverificado por este ADR; toda
linha de origem AMH é `SOURCE` por citação do dossiê da Onda 1, do
`compatibility-finding.md` ou de ADRs anteriores que os citam. Somente a leitura
dos documentos V2 em disco é `OBSERVED` deste autor.

| # | Rótulo | Afirmação | Fonte | Confiança |
|---|---|---|---|---|
| E1 | SOURCE | *"Never create two ungoverned clinical sources of truth. Define precedence, conflict, correction, replay, and reconciliation behavior."* | prompt §7.3 | alta |
| E2 | SOURCE | Alegação histórica a testar: o legado registrou a contradição não resolvida entre frescor batch da AMH e objetivo de latência de alerta em segundos (`LEGACY-TA:229-241`); o prompt manda **testar** a alegação, não presumi-la. | prompt §2 (evidência do assessment), §7.3 | alta |
| E3 | SOURCE | O produtor FHIR AMH atual é batch-first a partir do Bronze Iceberg; CDC/MSK/Flink está estacionado; o próprio ADR-040 AMH declara o caminho **não** near-real-time; o frescor fim-a-fim é **inteiramente não medido**. | prompt §2 evidência 3; ADR-0001 E6 | alta |
| E4 | SOURCE | Varredura medida na Gold AMH: 21 tabelas vazias e 21 com colunas de negócio 100% nulas; *"a present schema and successful query can still return misleading absence"*. | prompt §2 evidência 11; HAZ-0039 | alta |
| E5 | SOURCE | 52.452 linhas clínicas referenciando encontros ausentes por skew de ingestão — presença referencial e ordenação precisam ser medidas e reconciliadas. | prompt §2 evidência 13; HAZ-0038 | alta |
| E6 | SOURCE | Camada 4 (aptidão operacional) da AMH permanece **sem evidência**: nenhuma medição de latência, completude, ordenação, disponibilidade, replay ou recuperação existe; apenas `dev` está provisionado. | ADR-0001 E2, E7, E19 | alta |
| E7 | SOURCE | O modelo canônico proposto (ADR-0005 §5.2): fato imutável com correção explícita (M1), chave `(tenant, PSR, encontro)` (M2), tempos distintos preservados (M3), duas dimensões de status jamais colapsadas (M4), checagens contínuas de aptidão (M10). | ADR-0005 §5.2 | alta |
| E8 | SOURCE | ADR-0008 (aceito, GDEC-0007): correção ou chegada tardia **nunca** reescreve status passado — dispara nova avaliação; avaliação anterior fica superseded com relação explícita; alertas derivados são reconciliados pela máquina do ADR-0009, jamais retirados silenciosamente (N6). Idade de insumo computa do tempo clínico de fonte (N5). | ADR-0008 §4.2 N5, N6 | alta |
| E9 | SOURCE | *"Durability precedes immediacy; projections and real-time views are rebuildable"* (§9.1 princípio 6); DOM-0006 exige que toda entrega derive de estado durável e replayável. | prompt §9.1; DOM-invariants.md DOM-0006 | alta |
| E10 | SOURCE | HAZ-0030: via aprovada que exige reconhecimento em segundos sobre lane exclusivamente batch não alcança a janela acionável (S4/L4, Unacceptable); SAF-0031 proíbe via acionável sobre lane que não cumpre o orçamento declarado. | hazard-log.md HAZ-0030 | alta |
| E11 | SOURCE | HAZ-0034: reconciliação pós-downtime indefinida deixa o registro clínico silenciosamente incompleto/divergente; alertas gerados durante a queda nunca são reconciliados. | hazard-log.md HAZ-0034 | alta |
| E12 | SOURCE | QAS-0010 define o cenário mensurável "Reconciliation divergence between operational and analytical lanes"; alvo numérico VALIDATION REQUIRED. | quality-attribute-scenarios.md QAS-0010 | alta |
| E13 | OBSERVED | O contrato de identidade v1 (minuta) exige `resolve(ref, as_of)` determinístico e equivalência de replay por sujeito — a reconstrução histórica afetada por identidade é certificável apenas com essas capacidades (AQ-5, DECIDED). | contract-v1/eventos-ciclo-de-vida-identidade.md §3-§4 | alta |

### 2.2 Premissas

A registrar em `docs/00-governance/registers/assumptions-register.md`; **nenhum ID
`ASM` é cunhado aqui** (o registro é o catálogo de cunhagem daquele prefixo).

| # | Premissa | Por que é necessária | O que a invalida | Dono |
|---|---|---|---|---|
| A1 | O portfólio aprovado (G2) exigirá ao menos uma via com necessidade de frescor que precise ser confrontada com medição de lane (não decidível de antemão). | Sem ela, o driver D1 não discriminaria. | G2 aprovar portfólio exclusivamente de vias sem sensibilidade a frescor — improvável, mas possível. | UNASSIGNED — VALIDATION REQUIRED |
| A2 | A lane analítica AMH continuará existindo e acessível para leitura de reconciliação sob qualquer opção de fronteira do ADR-0001 que mova dados clínicos. | As opções A e B pressupõem a lane analítica como insumo de reconciliação. | Decisão de fronteira que exclua acesso analítico; contrato AMH sem cláusula de leitura analítica. | UNASSIGNED — VALIDATION REQUIRED |
| A3 | A retenção da lane operacional V2 (envelopes + fatos, ADR-0005 M1) é suficiente para replay do laço sem depender da retenção AMH. | Sustenta F5 da minuta; sem ela o replay do laço dependeria de um acervo externo não governado pela V2. | Política de retenção V2 (ADR-0018) que exija expurgo antes do horizonte de replay exigido. | UNASSIGNED — VALIDATION REQUIRED |
| A4 | Divergência entre lanes é tecnicamente mensurável por amostragem/checksum por classe de dado sem mover PHI além do mínimo. | Sustenta F6/QAS-0010. | Evidência de que a comparação exija replicação integral de PHI para a lane analítica de comparação. | UNASSIGNED — VALIDATION REQUIRED |

### 2.3 Hipóteses a testar

A primeira linha é a exigência explícita do prompt §7.3 — a alegação histórica
entra aqui como **hipótese com método**, não como fato herdado.

| # | Hipótese | Como seria testada | Quem testa | Estado |
|---|---|---|---|---|
| H1 | **"Disponibilidade estilo Gold/Athena é lenta demais para objetivo de alerta em segundos."** | (i) G1 valida a necessidade de latência (alvo deixa de ser palpite); (ii) medição de camada 4 em ambiente nomeado: percentis de frescor fim-a-fim fonte→disponível-para-consulta da lane analítica, por classe de insumo; (iii) comparação alvo×medida. A alegação só vira fato com (i)+(ii); só é refutada com (i)+(ii) também. | platform reliability + arquiteto de compatibilidade AMH | **UNTESTED** — sem ambiente (E6) e sem alvo G1; nada pode ser concluído hoje |
| H2 | A divergência operacional×analítica em regime permanente é limitada e explicável (skew de ingestão, janela de batch), não estrutural. | Relatórios de reconciliação contínuos (QAS-0010) por classe de dado, em ambiente com dado representativo. | idem | UNTESTED |
| H3 | O backfill analítico→operacional pode ser expresso 100% como importação governada pelo modelo canônico (proveniência de importação explícita), sem canal lateral. | Teste de importação com fixtures sintéticas; contabilidade de perda §7.6. | engenheiro de importação (ADR-0023) | UNTESTED |

---

## 3. Direcionadores de decisão e atributos de qualidade mensuráveis

Alvos numéricos: `VALIDATION REQUIRED` (Gate G1) — **nenhum é inventado**. Drivers
com alvo estrutural vinculante por invariante/regra não-negociável estão indicados.

| # | Driver | Por que discrimina | Atributo mensurável | Alvo |
|---|---|---|---|---|
| D1 | **Latência do laço de segurança** — o laço lê a fonte que consegue sustentar a janela clínica | As opções diferem em qual lane alimenta a avaliação viva; E3/E10 mostram que a lane analítica atual é batch e não medida | QAS-0001, QAS-0003 | VALIDATION REQUIRED (G1) |
| D2 | **Unicidade governada da verdade clínica** (E1) | As opções diferem em quantos lugares aceitam escrita clínica autoritativa e sob que governo; a opção C (dupla autoridade) existe exatamente para expor esse eixo | QAS-0019 | Vinculante — prompt §7.3 |
| D3 | **Replay determinístico do laço** (DOM-0003) | Replay refém de acervo externo não governado ≠ replay sustentado por envelopes retidos próprios (A3) | QAS-0020 | 100% de reprodução — vinculante (invariante) |
| D4 | **Divergência de reconciliação mensurável e visível** | Uma relação entre lanes sem medição contínua reedita HAZ-0034/HAZ-0039 (divergência e vazio silenciosos) | QAS-0010, QAS-0009 | VALIDATION REQUIRED |
| D5 | **Degradação explícita por lane** (DOM-0007) | "Lane analítica indisponível" e "lane operacional degradada" precisam ser estados distintos e visíveis; opções diferem em quantos modos degradados existem e onde aparecem | QAS-0012, QAS-0023 | Vinculante (invariante) |
| D6 | **Propagação de correção entre lanes** (DOM-0002; E8) | Correção descoberta na reconciliação precisa de um caminho governado de volta ao laço; opções diferem em se esse caminho existe por construção ou por improviso | QAS-0019; TST-DOM-0002 | Vinculante (invariante) |
| D7 | **Custo de duplicação e operação** | Duas lanes custam armazenamento, computação de reconciliação e operação; uma lane só custa menos — e o trade-off deve ser dito honestamente. Nenhum modelo de custo existe. | QAS-0027 | VALIDATION REQUIRED |

**Excluído como não discriminante:** "ambas as lanes usam dados clínicos", "ambas
podem ser consultadas". SOURCE (prompt §7.2): sucesso de consulta não é evidência
de aptidão.

---

## 4. Alternativas consideradas

### Opção A — Lane operacional V2 como fonte de verdade do laço; lane analítica AMH para reconciliação, backfill, desfechos e vigilância (elaboração da hipótese §7.0 h2/h3)

**Descrição.** A lane operacional durável da V2 (fatos canônicos ADR-0005 +
avaliações + alertas/itens de trabalho + auditoria) é a única fonte autoritativa
para o laço de segurança. A lane analítica (Gold/Athena/Iceberg AMH) jamais
alimenta avaliação viva; serve reconciliação contínua com divergência medida,
backfill via importação governada, medição de desfechos, vigilância de qualidade e
analytics. Precedência, conflito, correção e replay conforme a minuta §5.2.

**Frente aos drivers.** D1: o laço lê apenas armazenamento operacional local —
o teto de latência interno é da V2; o frescor de *ingresso* continua herdado da
fronteira (ADR-0001), o que esta opção isola mas não resolve. D2: um único ponto de
escrita clínica autoritativa; a lane analítica é somente-leitura para o laço.
D3: replay sustentado por envelopes e fatos próprios (A3). D4: a reconciliação é
obrigação de primeira classe com QAS-0010 como cenário. D5: dois modos degradados
distintos, ambos explícitos. D6: correção descoberta na reconciliação entra como
fato de correção com proveniência própria (M1/M8), disparando N6. D7: paga o custo
integral de duas lanes + reconciliação contínua.

**Consequências positivas.** Satisfaz E1 por construção (uma autoridade, um uso
declarado para a outra lane); o laço não herda indisponibilidade analítica; a
alegação H1, verdadeira ou falsa, não muda a segurança do desenho — muda apenas a
utilidade da lane analítica como *fonte de ingresso* futura.

**Consequências negativas.** Custo integral de reconciliação contínua (D7);
divergência residual entre lanes é permanente e precisa de gestão, não de negação;
o valor da lane analítica depende de dados populados que hoje não existem (E4) —
reconciliar contra vazio produz relatórios vazios com aparência de saúde
(HAZ-0039), o que exige as checagens de aptidão M10 também na reconciliação.

**O que precisaria ser verdade.** A2 e A3; e que o custo D7 seja aceito como preço
dos vinculantes D2/D3.

**Custo de saída.** Moderado: a lane operacional sobrevive a qualquer refinamento;
o que se abandona é a tubulação de reconciliação.

### Opção B — Lane analítica como autoridade; lane operacional como cache de trabalho

**Descrição.** A verdade clínica autoritativa mora na plataforma analítica
(Gold/Athena-style); o laço V2 materializa um cache operacional de curto prazo
para trabalhar, mas resolução de dúvida, auditoria e replay apontam para o acervo
analítico.

**Frente aos drivers.** D1: o laço herda o frescor da lane analítica — hoje batch,
não medido (E3); se H1 se confirmar, esta opção é estruturalmente incapaz de
sustentar via acionável em segundos (E10). D2: uma autoridade — ponto forte
honesto desta opção. D3: replay refém da retenção, do versionamento e da semântica
de um acervo externo que a V2 não governa (viola A3; DOM-0003 fica por contrato,
não por construção). D4: a "reconciliação" desaparece como conceito (não há duas
verdades) — mas reaparece como validação do cache, com os mesmos custos. D5: a
degradação analítica vira degradação do laço inteiro. D6: correção segue o ciclo
do acervo analítico (batch), atrasando N6. D7: o mais barato em duplicação.

**Consequências positivas.** Elimina a divergência entre verdades por definição;
menor custo de armazenamento; um único modelo de governo de dado.

**Consequências negativas.** Acopla a disponibilidade e a latência do laço de
segurança a uma plataforma externa cujo ambiente não-dev **não existe** (E6);
auditoria e replay clínicos dependem de retenção alheia; a fronteira de tenancy e
autorização do laço passa a ser imposta fora da V2 (DOM-0001 por contrato);
contradiz a hipótese h2 do §7.0 — que é hipótese, não decisão, mas cuja rejeição
exigiria evidência que hoje não existe em nenhuma camada (E6).

**O que precisaria ser verdade.** H1 refutada com medição (lane analítica atende a
necessidade G1); ambiente production-like AMH existente; contrato de retenção,
replay e disponibilidade com força de SLO medido; aceitação de que o registro
operacional do laço (ações humanas, auditoria) ainda precisaria viver na V2 — ou
seja, mesmo esta opção não elimina a lane operacional para *estados de trabalho*,
apenas para *fatos clínicos*.

**Custo de saída.** Alto: migrar a autoridade de volta exige reconstituir na V2 um
acervo com proveniência que nunca foi capturada localmente.

### Opção C — Dupla autoridade sincronizada (escrita clínica válida nas duas lanes, sincronização bidirecional)

**Descrição.** Ambas as lanes aceitam escrita clínica autoritativa; um mecanismo de
sincronização propaga em ambas as direções e resolve conflitos por regra.

**Frente aos drivers.** D1: boa no papel (cada consumidor lê a lane mais próxima).
D2: **é exatamente a configuração que E1 proíbe criar de forma não governada** — e
governá-la exige resolver conflito bidirecional permanente, o problema mais difícil
das três opções. D3: replay precisa de uma ordem total entre escritas de duas
origens — irrealizável sem relógio/consenso comum (DOM-0009 proíbe inventar
tempos). D4: a reconciliação vira arbitragem contínua de conflito, não medição.
D5/D6: cada modo degradado dobra (split-brain — THR-0059 é o cenário de ameaça
correspondente). D7: o mais caro em operação.

**Consequências positivas.** Nenhum consumidor espera pela outra lane; escrita
local sempre disponível.

**Consequências negativas.** Conflito bidirecional é permanente e clinicamente
perigoso (duas verdades divergentes exibíveis a clínicos distintos ao mesmo
tempo); a resolução automática de conflito clínico contraria a autoridade humana
(regra §3-15) ou exige fila humana de arbitragem permanente; custo e superfície de
falha máximos. Está listada porque o espaço de opções a contém e omiti-la seria
silêncio — não porque tenha defensores neste programa.

**O que precisaria ser verdade.** Um requisito de escrita clínica local em ambas
as lanes que nenhuma evidência atual sugere existir.

**Custo de saída.** Alto: desmontar sincronização bidirecional após dado real
exige adjudicar todo o histórico divergente.

### Opção Z — Adiar

**Descrição.** Não fixar a relação entre lanes; cada consumidor decide caso a caso.

**Consequências positivas.** Nenhum compromisso antes de medição de camada 4.

**Consequências negativas.** `docs/07` permanece bloqueado (depende de 0005 E
0006); o G3 mantém pendência; "caso a caso" é precisamente como nascem duas fontes
não governadas — a primeira equipe que precisar de um backfill improvisará um
canal lateral, decidindo por omissão (mesmo mecanismo de deriva já registrado no
ADR-0001 §6.2).

**Custo do atraso.** Cresce até o primeiro armazenamento real (G7); depois vira
migração + adjudicação de histórico.

### 4.1 Comparação frente aos drivers

Células qualitativas, com rótulo de evidência; **sem pontuação numérica** (pesos
não ratificados).

| Driver | A — operacional única p/ laço | B — analítica autoritativa | C — dupla autoridade | Z — adiar |
|---|---|---|---|---|
| D1 latência | Teto interno próprio; ingresso herdado da fronteira (INFERENCE) | Herda batch não medido (E3); incompatível com E10 se H1 confirmar | Boa no papel; custo em D2/D3 | Não resolvido |
| D2 unicidade | Uma autoridade por construção | Uma autoridade por construção | Configuração que E1 proíbe sem governo pesado | Deriva por omissão |
| D3 replay | Por construção (A3) | Por contrato com acervo externo | Exige ordem total inexistente | Não resolvido |
| D4 divergência | Medida como obrigação (QAS-0010) | Vira validação de cache | Vira arbitragem contínua | Invisível |
| D5 degradação | Dois modos explícitos | Degradação analítica = laço inteiro | Modos dobrados, split-brain (THR-0059) | Não resolvido |
| D6 correção | Caminho governado (M8+N6) | No ciclo batch do acervo | Bidirecional permanente | Não resolvido |
| D7 custo | Custo integral de duas lanes | O mais barato | O mais caro | Zero agora, migração depois |

### 4.2 Condicionalidade de fronteira (obrigatória enquanto ADR-0001 é `proposed`)

SOURCE (ADR-0001 §8.3): nenhum ADR dependente pode ser aceito com pressuposto
rígido de fronteira. Registro explícito:

- Sob **ADR-0001 opção A** (consumidor) e **D-3** (A com opção contratada sobre C):
  as opções A e B daqui permanecem ambas formuláveis; a minuta §5.2 aplica-se sem
  alteração.
- Sob **ADR-0001 opção C** (duas lanes AMH, operacional NRT + analítica): a "lane
  operacional" daqui continua sendo o armazenamento V2; a lane NRT AMH é *fonte de
  ingresso*, não fonte de verdade — a minuta se aplica.
- Sob **ADR-0001 opção B** (módulo interno AMH): a lane operacional passaria a
  viver dentro da plataforma AMH; a *relação* operacional×analítica proposta aqui
  sobrevive, mas o dono da imposição muda — a aceitação deste ADR sob essa
  fronteira exigiria revisão das cláusulas F1/F5.
- Sob **ADR-0001 opção D-1** (sinais fora da AMH): a lane analítica AMH cobre
  apenas o subconjunto de dados vindo da AMH; a reconciliação por classe de dado
  (F6) precisa declarar cobertura por fonte.

---

## 5. Decisão e escopo

> **NENHUMA DECISÃO ESTÁ REGISTRADA.** Este ADR apresenta opções, drivers e a
> minuta §5.2. Preencher esta seção é reservado à autoridade decisora nomeada no
> front matter. A minuta abaixo é o que a aceitação **vincularia** — nada dela
> vige antes.

### 5.1 Condições que devem ser satisfeitas antes da aceitação

| # | Condição | Dono | Evidência que a fecha | Estado |
|---|---|---|---|---|
| C1 | ADR-0001 aceito, OU aceitação deste ADR explicitamente condicionada por opção de fronteira conforme §4.2. | titular (AUTH-DATA-PLATFORM + AUTH-AMH-OWNER) | Aceitação registrada de 0001, ou cláusula condicional na aceitação daqui | ABERTA (0001 `proposed`) |
| C2 | ADR-0005 aceito — a minuta consome M1/M2/M3/M8/M10 como forma do fato. | titular | Aceitação registrada | ABERTA (0005 `proposed`) |
| C3 | Reconciliação declarada com o texto **aceito** do ADR-0008 (N5 base de tempo; N6 correção/supersessão; N8 dimensões) — verificação cruzada, não redecisão. | autoridade decisora deste ADR | Nota de reconciliação na aceitação | ABERTA |
| C4 | H1 com método registrado e rota de medição definida (ambiente nomeado + alvo G1), OU aceitação registrando explicitamente que decide *estrutura* sob H1 não testada e que o gatilho T1 governa a revisita. | AUTH-DATA-PLATFORM | Registro do método/rota, ou cláusula explícita na aceitação | ABERTA — hoje nem ambiente nem alvo existem (E6) |
| C5 | Cobertura da reconciliação por classe de dado declarada (o que é comparado, com que frequência, com que amostragem) — sem número inventado; janelas VALIDATION REQUIRED. | AUTH-DATA-PLATFORM + AUTH-CLINSAFETY | Anexo de cobertura ratificado | ABERTA |
| C6 | Política de importação legada/backfill (ADR-0023) com direção registrada, para que F7 cite a política e não a improvise. | AUTH-PRODUCT + AUTH-CLINSAFETY | ADR-0023 aceito ou direção registrada | ABERTA (0023 `not-started`) |

### 5.2 Minuta normativa proposta (PROPOSAL — o que a aceitação vincularia)

Cada cláusula F-x é individualmente aceitável, emendável ou rejeitável. Cláusulas
marcadas ◆ têm consequência clínica direta e exigem AUTH-CLINSAFETY.

**F1 — Autoridade do laço.** ◆ A lane operacional durável da V2 é a única fonte de
verdade para o laço de segurança: fatos canônicos admitidos (ADR-0005), registros
de avaliação, alertas/itens de trabalho, ações humanas e auditoria. Nenhuma
avaliação viva lê a lane analítica. (Deriva da hipótese §7.0 h2/h3 — que a
aceitação desta cláusula ratificaria *para este escopo*, sem decidir a fronteira
do ADR-0001.)

**F2 — Papel da lane analítica.** A lane analítica serve exclusivamente:
reconciliação (F6), backfill governado (F7), medição de desfechos, vigilância de
qualidade e analytics sob propósito aprovado. Uso adicional exige emenda deste ADR
— jamais adoção tácita.

**F3 — Precedência.** ◆ Para todo fato consumido pelo laço, a versão admitida na
lane operacional prevalece para decisão em tempo real. Divergência detectada com a
lane analítica **nunca** substitui silenciosamente o fato operacional: ela produz
um registro de divergência visível e, quando a análise confirmar erro operacional,
uma **correção explícita** (M8) com proveniência da reconciliação — que dispara
nova avaliação via N6, jamais edição retroativa.

**F4 — Conflito.** ◆ Conflito entre lanes é uma espécie de `Conflict` do modelo
canônico (M1): explícito, visível, nunca auto-resolvido por regra silenciosa.
Enquanto não resolvido, a avaliação que dependa do fato conflitante segue o
ADR-0008 (razão `conflicting_inputs` → `invalid`), nunca a escolha silenciosa de
uma das versões.

**F5 — Replay.** O replay determinístico do laço (DOM-0003) é sustentado
integralmente pela lane operacional: envelopes retidos (M1), fatos imutáveis,
tabelas versionadas (ADR-0007) e `resolve(ref, as_of)` do contrato de identidade
(E13). A lane analítica não é requisito de replay do laço; usá-la como fonte de
replay exigiria emenda com contrato de retenção externo.

**F6 — Reconciliação contínua e medida.** ◆ A divergência operacional×analítica é
medida continuamente por classe de dado (cobertura conforme C5), com janelas e
limiares `VALIDATION REQUIRED` — nenhum número aqui. Resultado de reconciliação é
artefato durável e auditável. Violação com impacto de segurança é visível a
clínicos e operadores (DOM-0007; M10). **Reconciliar contra fonte vazia/100%-nula
não é "zero divergência"** — é violação de aptidão (HAZ-0039): o relatório declara
cobertura efetiva, não apenas diferenças.

**F7 — Backfill governado.** ◆ Todo backfill analítico→operacional entra pela
ingestão canônica como importação governada: proveniência de importação explícita,
mapeamento com contabilidade de perda (§7.6), política do ADR-0023, e jamais
escrita direta no armazenamento operacional por canal lateral. Fato backfilled é
distinguível de fato de fluxo normal pela proveniência — para sempre.

**F8 — Uma verdade governada.** Toda cópia derivada de dado clínico na V2 é ou
(i) projeção rebuildável (DOM-0006; ADR-0011), ou (ii) importação governada (F7).
Qualquer armazenamento que aceite escrita clínica autoritativa fora da lane
operacional é não-conforme com este ADR — a existência dele é defeito, não
variação.

**F9 — Degradação por lane.** ◆ "Lane analítica indisponível/atrasada" e "lane
operacional degradada" são estados distintos, explícitos e visíveis nos níveis
componente/dado/fluxo (DOM-0007). Indisponibilidade analítica **não** degrada o
laço; atraso de reconciliação além da janela declarada é sinal operacional visível
— nunca silêncio.

**F10 — Teste permanente da alegação de frescor.** A alegação H1 permanece
hipótese com método (C4) até medição em ambiente nomeado contra alvo G1. Se
refutada (lane analítica atende a necessidade validada), o gatilho T1 reabre a
*fronteira de ingresso* (ADR-0001 T5/T7) — **não** as cláusulas F1-F9, cuja
justificativa (D2/D3/D6) independe da latência analítica.

### 5.3 Escopo do que a aceitação vincularia

**Vincula:** o papel de cada lane; precedência, conflito, correção, replay,
reconciliação e backfill entre elas; a proibição de escrita clínica autoritativa
fora da lane operacional; a visibilidade de degradação por lane.

**Não vincula:** a fronteira com a AMH (ADR-0001); a forma do fato (ADR-0005); a
mecânica de outbox/eventos (ADR-0010); projeções (ADR-0011); SLOs e monitoramento
(ADR-0020); tecnologia de armazenamento ou consulta de qualquer lane (§3 regra 14
— classes e critérios pertencem ao §9.4, seleção a ADRs próprios com drivers
medidos).

---

## 6. Consequências

Como nenhuma opção foi escolhida, estas são consequências **da existência deste
ADR em `proposed`**.

### 6.1 Positivas

- A exigência do §7.3 (precedência/conflito/correção/replay/reconciliação) deixa
  de ser um parágrafo de prompt e vira cláusulas nomeadas (F1-F10) que o titular
  pode aceitar, emendar ou rejeitar uma a uma.
- A alegação histórica de frescor ganha método de teste registrado (H1/C4) em vez
  de circular como fato herdado — exatamente o que o prompt §7.3 manda fazer.
- O ADR-0010 pode ser redigido sobre uma relação de lanes nomeada; o G3 ganha um
  dos seus cinco ADRs pendentes em forma decidível.

### 6.2 Negativas

- O driver D7 (custo de duas lanes + reconciliação) segue sem modelo de custo — a
  autoridade decidirá com um driver não quantificado, e isso é dito em vez de
  escondido.
- A minuta assume a existência futura de dado analítico populado para reconciliar;
  hoje a Gold medida contém vazios extensos (E4) — o valor de F6 é diferido até
  haver o que comparar, e um período inicial de "reconciliação vazia" pode passar
  falsa impressão de saúde se F6 não for implementada com declaração de cobertura.

### 6.3 Neutras / estruturais

- Nada aqui torna consumível qualquer dado AMH (as três pernas de `Observation`
  seguem abertas — ADR-0001 E17); a relação entre lanes existe para quando houver
  fonte elegível e para fixtures sintéticas desde já.
- Nada aqui decide transporte, broker, banco ou motor de consulta.

---

## 7. Implicações transversais

| Dimensão | Implicação | Rótulo | Papel responsável | IDs |
|---|---|---|---|---|
| Segurança clínica | F3/F4/F6 decidem se divergência entre lanes pode alcançar um clínico como verdade única silenciosa; F1 impede que o laço herde frescor batch não medido como se fosse aceitável (HAZ-0030). Reconciliação vazia lida como saúde reeditaria HAZ-0039. | INFERENCE de E4, E10 | AUTH-CLINSAFETY | HAZ-0030, HAZ-0034, HAZ-0038, HAZ-0039, HAZ-0040; SAF-0031, SAF-0033 |
| Segurança | Duas lanes = duas superfícies de acesso a PHI com posturas distintas; a leitura analítica para reconciliação precisa de identidade de carga de trabalho, escopo e auditoria próprios (ADR-0015/0016); THR-0046 (indisponibilidade/mudança de modelo AMH) e THR-0059 (split-brain pós-outage) são os cenários de ameaça diretamente pertinentes. | INFERENCE | AUTH-SECURITY | THR-0046, THR-0059; ADR-0016, ADR-0017 |
| Privacidade (LGPD) | O uso analítico é vinculado a propósito (AQ-3: usos secundários bloqueados até ratificação); a comparação de reconciliação deve minimizar PHI (A4); nenhuma conformidade é declarada. | VALIDATION REQUIRED | AUTH-PRIVACY-LEGAL (não nomeado) | ADR-0018; QAS-0028 |
| Interoperabilidade | A lane analítica é consumida por contrato pinado (manifesto v1/IG 1.1.0 futura), nunca por leitura de esquema interno; deriva de contrato analítico entra na detecção QAS-0013. | SOURCE §7.5/§7.6 | AUTH-DATA-PLATFORM | ADR-0013; QAS-0013 |
| Acessibilidade | Estados de degradação por lane (F9) precisam ser perceptíveis sem depender de cor e anunciados a tecnologia assistiva quando alcançam a UI (prompt §11). | INFERENCE | AUTH-UX | ADR-0021 |
| Operacional | Reconciliação contínua, relatórios de divergência, reprocessamento de backfill e reconciliação pós-downtime (HAZ-0034) tornam-se deveres operacionais de primeira classe com dono de plantão. | INFERENCE | AUTH-OPERATIONS | ADR-0020; QAS-0009, QAS-0010, QAS-0015 |
| Custo | Armazenamento duplicado por classe de dado + computação de reconciliação; **nenhum modelo de custo existe e nenhum número é inventado** (D7). | VALIDATION REQUIRED | AUTH-PRODUCT | QAS-0027 |
| Migração | F7 fixa que backfill/importação passam pelo modelo canônico com proveniência de importação — o alvo de migração do ADR-0023 fica definido por referência, não por improviso. | INFERENCE | AUTH-OPERATIONS | ADR-0023 |

---

## 8. Reversibilidade, gatilhos de revisita, kill/rollback

### 8.1 Avaliação de reversibilidade

| Item | Reversibilidade | O que fica encalhado ao reverter | Rótulo |
|---|---|---|---|
| Opção A (operacional p/ laço + analítica p/ reconciliação) | Alta para refinamento (a lane operacional sobrevive); moderada para inversão A→B (exigiria contrato externo de retenção/replay que não existe) | Tubulação de reconciliação e relatórios | INFERENCE |
| Opção B (analítica autoritativa) | Baixa na direção B→A após dado real: proveniência local nunca capturada não se reconstitui | O histórico de proveniência | INFERENCE |
| Opção C (dupla autoridade) | Baixa: desmontar sincronização bidirecional exige adjudicar histórico divergente | O histórico divergente | INFERENCE |
| Z (adiar) | n/a — custo de opção crescente até G7 | n/a | INFERENCE |

### 8.2 Gatilhos de revisita

| # | Gatilho | Detecção | Notificar | Ação |
|---|---|---|---|---|
| T1 | H1 medida em ambiente nomeado contra alvo G1 (confirmada OU refutada) | Medição camada 4; registro G1 | AUTH-DATA-PLATFORM, AUTH-CLINSAFETY | Fechar C4 em definitivo; se refutada, reabrir a fronteira de ingresso (ADR-0001 T5/T7) — F1-F9 permanecem salvo emenda |
| T2 | Divergência de reconciliação medida acima da tolerância (quando definida) | QAS-0010 | AUTH-DATA-PLATFORM | Reabrir F3/F6; investigar causa antes de qualquer mudança de precedência |
| T3 | Emenda/supersessão do ADR-0005 que toque M1/M2/M3/M8 ou do ADR-0008 que toque N5/N6/N8 | Registro de decisão | autoridade deste ADR | Reconciliar F3/F4/F5 (C2/C3) |
| T4 | ADR-0001 aceito (qualquer opção) | Registro de decisão | autoridade deste ADR | Executar a verificação condicional §4.2; sob opção B de fronteira, revisar F1/F5 |
| T5 | Nova fonte clínica não-AMH aprovada (D-1) | Registro de portfólio/contrato | AUTH-DATA-PLATFORM | Estender cobertura de reconciliação por fonte (C5); jamais criar segunda autoridade |
| T6 | Proposta de qualquer escrita clínica fora da lane operacional (o "canal lateral") | Revisão de arquitetura/PR | autoridade deste ADR | Tratar como não-conformidade F8 — não como variação a acomodar |

### 8.3 Kill switch / rollback

Enquanto `proposed`, não há mecanismo a desligar. Na aceitação, os controles
estruturais propostos são: (i) a **reconciliação pode ser suspensa** por decisão
operacional registrada sem afetar o laço (F9 garante que a suspensão é visível,
não silenciosa); (ii) o **backfill tem kill switch próprio** — importação
governada pode ser interrompida por classe de dado, e o que já entrou permanece
distinguível pela proveniência (F7), permitindo supersessão em massa por correção
(M8), nunca delete; (iii) **não existe rollback que apague fatos** — reversão de
relação entre lanes é sempre aditiva, e essa ausência de delete é registrada como
propriedade, não como falta.

---

## 9. Método de validação e evidência vinculada

| # | Afirmação a validar | Método | Ambiente | IDs vinculados |
|---|---|---|---|---|
| V1 | Nenhuma avaliação viva lê a lane analítica (F1) | Teste de arquitetura/estático: nenhum caminho do avaliador alcança adaptador analítico; teste de integração com lane analítica desligada — o laço opera | Teste (sintético) | DOM-0006; QAS-0022; TST: pendente de arquitetura de teste |
| V2 | Divergência injetada entre lanes produz registro visível e jamais substituição silenciosa (F3/F4) | Fixtures com divergência deliberada; asserção de Conflict/registro + status ADR-0008 correto | Teste | DOM-0002; TST-DOM-0002; QAS-0010, QAS-0019 |
| V3 | Correção originada na reconciliação dispara nova avaliação e reconciliação de alertas — nunca edição (F3+N6) | Teste de fluxo correção→N6→ADR-0009 | Teste | HAZ-0008; SAF-0014; QAS-0019 |
| V4 | Replay do laço 100% local — sem chamada à lane analítica (F5) | Replay com lane analítica inacessível; reprodução campo a campo | Teste | DOM-0003; TST-DOM-0003; QAS-0020 |
| V5 | Reconciliação contra fonte vazia/100%-nula reporta violação de aptidão, não "zero divergência" (F6) | Checagens de aptidão contra fixtures vazias | Teste | HAZ-0039; SAF-0033; QAS-0010 |
| V6 | Backfill entra apenas pela importação governada com proveniência distinta (F7/F8) | Teste de importação + checagem estática de ausência de canal lateral de escrita | Teste + CI | DOM-0002; QAS-0019; ADR-0023 (política) |
| V7 | Indisponibilidade analítica não degrada o laço e é visível como estado próprio (F9) | Injeção de falha na lane analítica; asserção de estado degradado explícito e laço operante | Teste | DOM-0007; TST-DOM-0006 (rebuild); QAS-0012, QAS-0023 |
| V8 | H1: percentis de frescor da lane analítica contra alvo G1 | Sondas fim-a-fim medidas em ambiente nomeado | **Production-like — hoje inexistente (E6)** | QAS-0001, QAS-0003; HAZ-0030; SAF-0031 |

**Disciplina de marcadores.** Todos os IDs DOM/HAZ/SAF/QAS/THR/TST-DOM citados
foram lidos dos catálogos existentes em `docs/03-domain/`, `docs/05-clinical-safety/`,
`docs/06-architecture/quality-attributes/` e
`docs/11-security-privacy-compliance/threat-model.md` antes da citação. `REQ:` e
`TST:` (geral) permanecem marcadores literais — os catálogos não existem.
**Nenhum ID foi inventado.**

---

## 10. Relações de supersessão

- **Supera:** nenhum ADR.
- **Superado por:** nenhum.
- **Notas de relação:** o `adr-index.md` §4.1 lista este ADR como alimentando o
  ADR-0008, que foi **aceito antes** deste existir (2026-08-15, GDEC-0007). Isso é
  legítimo — a tabela descreve ordem de *aceitação* ideal, não de redação — mas
  impõe a C3: a aceitação daqui reconcilia com o texto aceito de lá, e qualquer
  incompatibilidade descoberta é resolvida por emenda registrada do titular, nunca
  por leitura harmonizante silenciosa. Supersessão parcial por lane, fonte, tenant
  ou classe de dado é permitida e jamais generalizada de resultado parcial.

---

## 11. Autoverificação contra o gate de completude do template

Todos os campos do §10 do prompt presentes; três alternativas + adiar, cada uma
com consequências positivas E negativas honestas (a Opção C existe para expor o
anti-padrão, e isso é dito); drivers discriminantes ligados a QAS, vinculantes
distinguidos de mensuráveis-futuros; **nenhum alvo numérico inventado**; oito
linhas transversais presentes; reversibilidade, gatilhos e kill/rollback
presentes; validação com IDs reais verificados e marcadores honestos; supersessão
declarada; **nenhuma tecnologia selecionada**; nenhuma aprovação fabricada; nenhum
dono nomeado por este autor; decisões do titular citadas com fonte e data (AQ-3,
AQ-5, GDEC-0007); condicionalidade de fronteira registrada (§4.2) conforme
ADR-0001 §8.3 exige. **Nota da janela concorrente:** `adr-index.md` NÃO foi
atualizado por este autor — a linha de índice vai no handoff para integração
posterior (restrição de escrita da sessão).
