---
doc_id: AMH-C1-VITAL-SIGNS-DECISION-PACKAGE
title: Pacote de decisão C-1 — sinais vitais AMH×IntensiCare
status: PROPOSAL
label: PROPOSAL
owner: UNASSIGNED — VALIDATION REQUIRED
decisor_designado: rodaquino-OMNI (CEO e acionista principal de OMNI e AMH; autoridade do lado AMH registrada em DEC-G0-04)
approver_role: AUTH-PRODUCT + AUTH-DATA-PLATFORM (docs/00-governance/authority-model.md)
source: >
  Omni-Saude/amh-data-platform @ 0a07a6f1fab36fb2f5eeee0fcd8e945c95f67116 (leitura SOMENTE
  leitura, via API de conteúdo, no commit pinado);
  INTENSICARE_V2_ORCHESTRATOR_PROMPT.md §0.6 item 4, §7.0, §7.2;
  docs/08-interoperability/amh-data/{open-questions-for-amh-owners.md Q1, compatibility-finding.md §3,
  four-layer-dossier.md C-1, ordens-de-servico-amh-2026-08-15.md §9.1};
  docs/05-clinical-safety/rule-releases/{news2,sofa,gcs}/specification.md
date_collected: 2026-08-15
collector: engenheiro de contrato de sinais clínicos AMH
last_updated: 2026-08-15
provenance:
  source_repo: Omni-Saude/amh-data-platform
  path_or_url: ver §2.7 (quadro de proveniência por arquivo)
  commit_sha_or_version: 0a07a6f1fab36fb2f5eeee0fcd8e945c95f67116
  section_or_lines: ver §2.7
  date_collected: 2026-08-15
  collector: engenheiro de contrato de sinais clínicos AMH
  transformation: >
    Leitura direta dos arquivos no commit pinado (decodificados da API de conteúdo),
    resumida e traduzida para pt-BR; citações verbatim marcadas com crase. Nada foi
    escrito no repositório AMH. Nenhum ambiente foi acessado, nenhum endpoint contatado,
    nenhuma credencial usada.
  confidence: high (para o que foi lido); low (para qualquer projeção de prazo)
  owner: UNASSIGNED — VALIDATION REQUIRED
  validation_status: VALIDATION REQUIRED
links:
  requirements: []
  hazards: [HAZ-0005]
  adrs: [ADR-0001, ADR-0008, ADR-0026]
  tests: []
  pr: null
supersedes: null
superseded_by: null
---

# Pacote de decisão C-1 — sinais vitais

> **Este documento não decide nada.** Ele é o material de apoio para que
> **rodaquino-OMNI** decida a contradição **C-1** em uma sessão. Todo o conteúdo é
> **PROPOSAL**; a recomendação de §5 é uma recomendação, não uma escolha.

---

## 0. Como ler

### 0.1 Rótulos de evidência (`docs/00-governance/evidence-notation.md` §2)

| Rótulo | Uso neste documento |
|---|---|
| **OBSERVADO** | Lido diretamente por **este** especialista no commit pinado `0a07a6f1`, nesta sessão (2026-08-15). Caminho e linha em §2.7. |
| **FONTE (dossiê)** | Lido por outro especialista da V2 e registrado em documento V2; fiel, porém de segunda mão. O documento V2 é citado. |
| **INFERÊNCIA** | Conclusão raciocinada, com as evidências de entrada nomeadas. |
| **PROPOSAL** | Recomendação nova aguardando decisão. |
| **VALIDAÇÃO NECESSÁRIA** | Exige humano nomeado, ambiente ou estudo empírico antes de ser confiável. |

Nenhuma afirmação aqui carrega **DECIDIDO**.

### 0.2 Método desta sessão

Chamadas somente leitura à API de conteúdo do GitHub contra o commit pinado
`0a07a6f1fab36fb2f5eeee0fcd8e945c95f67116`; enumeração da árvore completa
(**3.685 entradas**); e sete buscas de código no repositório. **Nada foi escrito no
repositório AMH.** Nenhum ambiente foi acessado, nenhum endpoint contatado, nenhuma
credencial utilizada. Nenhum dado de paciente foi lido — apenas esquemas, código,
diagramas e ADRs.

### 0.3 O que este pacote NÃO faz

- Não decide C-1, nem propõe marcar C-1 como resolvida.
- Não adjudica qual documento AMH "vale". **Cronologia e inconsistência não são
  autoridade** — um diagrama de maio não é invalidado por um ADR de julho; só o titular
  pode dizer se a intenção sobreviveu.
- Não altera `open-questions-for-amh-owners.md`, `compatibility-finding.md`,
  `candidate-inventory.md`, nenhum registro, nem nenhuma ordem de serviço.
- Não afirma, em lugar nenhum, que sinais vitais **existem** povoados na AMH. Não há
  evidência de camada 3 para isso, e não haveria como haver sem acesso a ambiente.
- Não aprova conteúdo clínico. Os precursores de regra citados permanecem
  **NÃO ACIONÁVEIS**.

---

## 1. Enunciado da decisão

### 1.1 O que está sendo decidido

> **Por qual via, com que prioridade e a que custo a plataforma proverá sinais vitais
> à IntensiCare V2 — ou se a V2 opera sem eles por ora, e até quando.**

A decisão tem quatro faces inseparáveis, e todas as quatro precisam sair da sessão:

| # | Face da decisão | Quem só pode decidir |
|---|---|---|
| **D-a** | **Via**: AMH publica e povoa um profile de sinais vitais; ou a V2 ingere direto de dispositivos/registro; ou ambos com critério de corte; ou nenhum por ora. | Titular (produto + plataforma) |
| **D-b** | **Prioridade relativa**: onde isto entra na fila diante de OS-16 (parecer jurídico), G1 (pesquisa de usuários), OS-01..OS-21 e do ambiente `stg` (orçamento). | Titular |
| **D-c** | **Escopo do "sinais vitais"**: só sinais vitais, ou **toda `Observation` não-laboratorial** (ver §2.3 — o mesmo mecanismo bloqueia GCS, RASS, ACVPU e escalas de beira-leito). | Titular |
| **D-d** | **Consequência aceita**: qual portfólio clínico o titular aceita ter — hoje e na data de revisão — em cada cenário. | Titular |

### 1.2 O que **não** está sendo decidido

**Não se está decidindo se a V2 precisa de sinais vitais. Precisa.** Isto não é uma
preferência de projeto; é aritmética das regras já escritas:

- **INFERÊNCIA (de `docs/05-clinical-safety/rule-releases/news2/specification.md` §2.1 e
  §5.2)**: RULE-NEWS2-0100 tem **sete parâmetros pontuados**, todos sinais vitais ou
  avaliação de consciência à beira do leito, e **qualquer um ausente** leva a regra a
  `not_evaluated` — não a um escore parcial. Sem sinais vitais, o NEWS2 nunca produz
  número algum.
- **INFERÊNCIA (de `rule-releases/sofa/specification.md` §3.1 e §5)**: das seis
  componentes do SOFA, a cardiovascular exige PAM e a neurológica exige GCS+RASS. Sem
  elas, no melhor cenário laboratorial conforme sobram **2 componentes de 6 mais metade
  da renal** — e a própria revisão de SOFA proíbe somar um SOFA parcial só de laboratório
  (`candidate-inventory.md` §8.3).
- **FONTE (dossiê)** — `hard-gate-assessment.md` §7.5 e §7.7: **o portão 4 (elegibilidade
  de insumos) falha para todos os 20 candidatos**, e falha sozinho, independentemente de
  qualquer outro progresso. A contagem de vias acionáveis hoje é **zero**.

**Também não está sendo decidido:** a fronteira de plataforma (ADR-0001 — `proposed`), o
transporte, o tenant piloto, o achado de compatibilidade (permanece *candidato a
integração*), nem qualquer conteúdo clínico. Decidir C-1 **informa** ADR-0001; não o
substitui.

### 1.3 Por que agora

**FONTE** — `INTENSICARE_V2_ORCHESTRATOR_PROMPT.md` §0.6, item 4 do caminho crítico:
`Decisão de produto pendente do titular: sinais vitais (contradição C-1) — exige novo
profile AMH e decisão de produto; nomear tenant piloto.`

**FONTE (dossiê)** — `ordens-de-servico-amh-2026-08-15.md` §9.1: *"mesmo com as 21 ordens
de serviço integralmente executadas, a V2 continua sem sinais vitais da AMH"*. C-1 é a
única das quatro contradições de camada 1 que as resoluções AQ-1..AQ-6 não tocaram
(`open-questions-for-amh-owners.md`, quadro-resumo: Q1 = 🔴 ABERTA — sem alteração).

---

## 2. Evidência

### 2.1 Lado A — as afirmações de sinais vitais (**três** artefatos, não dois)

**OBSERVADO** — `architecture/diagrams/data-flows/data-flow-fhir-clinical.md@0a07a6f1`
(cabeçalho: `Versão 1.0 | Maio 2026`):

- L121, tabela *Mapeamento Tasy → FHIR R4*:
  `| EVOLUCAO_PACIENTE | TASY.EVOLUCAO_PACIENTE | ClinicalImpression ou Observation | ClinicalImpression para notas clínicas livres; Observation para sinais vitais |`
- L140, tabela *Recursos FHIR Suportados por Direção*:
  `| Observation | ✅ (sinais vitais de dispositivos IoT) | ✅ (sinais vitais, resultados) | P95 < 200ms |`

**OBSERVADO** — `architecture/diagrams/c4-component/c4-component-fhir-pipeline.md@0a07a6f1`:

- L95: `| EVOLUCAO_PACIENTE | TASY.EVOLUCAO_PACIENTE | ClinicalImpression ou Observation | ClinicalImpression para texto livre; Observation para sinais vitais estruturados (LOINC code) |`
- **E o mesmo arquivo se contradiz em L25**: o bloco renderizado do *FHIR Mapper Operator*
  lista `• EVOLUCAO_PACIENTE → ClinicalImpression` — **sem ramo de `Observation`**.

**OBSERVADO — terceiro artefato, não registrado no dossiê até aqui.**
`schemas/iceberg/fhir/fhir_observation.sql@0a07a6f1`, a tabela-espelho analítica de
`Observation`:

- Comentário de cabeçalho: `Covers lab results, vital signs, and diagnostic observations from Diagnose.`
- Comentário de coluna: `category_code STRING COMMENT 'Observation.category.code: laboratory|vital-signs|...'`

**Duas qualificações honestas sobre este terceiro artefato**, ambas OBSERVADAS no próprio
arquivo: (i) ele atribui a origem a **Diagnose** — o LIS que, pelo próprio repositório,
`não é ingerido`; e (ii) o arquivo documenta que **esta DDL nunca foi executada**:
`a tabela real foi criada pelo job de espelho (fhir_resource_mirror.py, com createOrReplace
a partir do schema do DataFrame) — a DDL era documentacao, nunca executada.`

**Um comentário de coluna enumerando valores possíveis não é evidência de que algum deles
ocorra.** É intenção declarada, como os diagramas — mas é um terceiro documento
independente afirmando a mesma intenção, e isso importa para a pergunta "a intenção
existiu?".

### 2.2 Lado B — a exclusão estrutural na Implementation Guide

**OBSERVADO** — enumerando `schemas/fhir-profiles/*.json@0a07a6f1`: há **21 arquivos JSON
de nível superior**, dos quais um `CapabilityStatement` e um `ImplementationGuide` —
portanto **19 `StructureDefinition`**, coincidindo exatamente com a contagem registrada no
dossiê. Entre todas, existe **exatamente um profile de `Observation`**:
`Observation-amh-laboratory-profile.json`. **Não há profile de sinais vitais.**

**OBSERVADO** — `schemas/fhir-profiles/Observation-amh-laboratory-profile.json@0a07a6f1`,
elemento `Observation.category` (linhas 76–89):

```json
{ "id": "Observation.category", "path": "Observation.category", "min": 1,
  "mustSupport": true,
  "patternCodeableConcept": { "coding": [
    { "system": "http://terminology.hl7.org/CodeSystem/observation-category",
      "code": "laboratory" } ] } }
```

E, nas linhas 90–99 e 139–143: `Observation.code` com *binding* `extensible` ao ValueSet
`amh-loinc-laboratory`; `Observation.valueQuantity.system` com `fixedUri`
`http://unitsofmeasure.org`. Título e descrição do profile são explicitamente
laboratoriais (`AMH Observation Profile — Laboratory Result`; mapeia
`dbo.exame_resultado` do Diagnose LIS e `TASY.LAUDO_PACIENTE` quando estruturado).

**INFERÊNCIA (de OBSERVADO acima + semântica do FHIR R4 para `pattern[x]`):** em FHIR,
`pattern[x]` impõe que **cada repetição** do elemento satisfaça o padrão, e este elemento
**não está fatiado** (não há `slicing` em `Observation.category` neste profile). Uma
instância conforme a `Observation-amh-laboratory` portanto **não pode** carregar
`category = vital-signs`. **Isto é exclusão estrutural, não lacuna de cobertura.**

**VALIDAÇÃO NECESSÁRIA — uma nuance técnica que muda o custo da opção O1.** Se a intenção
da AMH era fatiar `category` (permitindo mais de uma categoria por instância) e o
`patternCodeableConcept` sem `slicing` foi um efeito não pretendido, então o texto da IG
está errado de um jeito diferente do que o dossiê registra. **Em qualquer das duas
leituras o resultado prático é o mesmo — sinais vitais exigem um profile próprio** —, mas
a leitura correta determina se a correção é uma emenda ao profile existente ou um artefato
novo. É a **questão QD-6** de §6.

### 2.3 O bloqueio é mais amplo do que "sinais vitais" — e isto é decisório

**INFERÊNCIA (de §2.2):** o padrão fixado em `laboratory` exclui **toda** categoria
não-laboratorial do vocabulário HL7 `observation-category`, não apenas `vital-signs`:
`survey`, `exam`, `imaging`, `procedure`, `therapy`, `activity`, `social-history`.

Consequência concreta para as regras já escritas na V2:

- **GCS** (componentes E/V/M) e **RASS** são avaliações de beira-leito — em FHIR seriam
  tipicamente `survey`/`exam`, não `vital-signs`. **Estão igualmente excluídos.**
- **ACVPU** (consciência do NEWS2) — idem.
- **Diurese por intervalo** (componente renal do SOFA) — idem.

**Portanto:** decidir C-1 apenas como "sinais vitais" deixa RULE-GCS-0100 inteiramente
bloqueada e a componente neurológica do SOFA bloqueada, mesmo com O1 executada. **A face
D-c do enunciado (§1.1) não é formalismo — é a diferença entre desbloquear o NEWS2 e
desbloquear o NEWS2 *e* a GCS.**

### 2.4 O que o produtor implementado realmente faz — achado novo desta sessão

O dossiê registra explicitamente que `pipelines/batch/fhir/bronze_to_fhir.py` **não havia
sido lido** por nenhum especialista V2 (`ordens-de-servico-amh-2026-08-15.md` §0.4). Foi
lido nesta sessão, no commit pinado.

**OBSERVADO** — `pipelines/batch/fhir/bronze_to_fhir.py@0a07a6f1` (1.118 linhas), que é o
produtor de registro do canal FHIR segundo o ADR-040:

1. **`EVOLUCAO_PACIENTE` produz *apenas* `ClinicalImpression`.** A função `map_clinimp`
   (L~706–745) lê `tasy_hospital_evolucao_paciente`, seleciona `ds_evolucao`, e emite
   `"resourceType": "ClinicalImpression"` com `r["description"] = desc[:10000]`.
   **Não existe ramo de `Observation` a partir de `EVOLUCAO_PACIENTE` no produtor.** O
   registro `REGISTRY` confirma: `"clinimp": {"resource_type": "ClinicalImpression", ...
   "watermark": ("tasy_hospital_evolucao_paciente", "dt_atualizacao")}`.
2. **O único mapeador de `Observation` é laboratorial e de texto livre.** `map_observation`
   (L~766–787) lê `tasy_hospital_paciente_exame` e emite
   `"category": [{"coding": [{... "code": "laboratory"}]}]`,
   `"code": {"text": "Resultado de exame"}` e `r["valueString"] = val[:10000]`.
3. **O próprio código declara o remapeamento**, em comentário verbatim:
   `Remap honesto: a fonte da imagem (EXAME_RESULTADO / Diagnose-LIS) não está no Bronze;
   usamos os resultados por paciente do Tasy (tasy_hospital_paciente_exame)`.
4. **A URL de profile emitida diverge da IG**: o produtor usa
   `OBS_PROFILE = "https://amh.health/fhir/StructureDefinition/BRObservation"`, enquanto o
   canônico da IG é
   `https://fhir.americashealth.com.br/StructureDefinition/Observation-amh-laboratory`.

**INFERÊNCIA — o que isto acrescenta ao dossiê:**

- Sobre **C-1**: quanto ao produtor de registro, `EVOLUCAO_PACIENTE` é tratada como
  **nota clínica de texto livre**, exatamente como a pergunta Q1.3 suspeitava. A resposta
  documental à pergunta *"EVOLUCAO_PACIENTE serve como fonte de vitais estruturados?"* é:
  **como implementada, não.** Extrair vitais dali exigiria processamento de texto livre em
  português — o que é não determinístico e colide com o requisito V2 de avaliação
  determinística e explicável (portão 7; ADR-0007). Isto **não** adjudica a intenção dos
  diagramas: o titular ainda pode dizer que a intenção existe e não foi executada.
- Sobre **C-4**: o caminho de texto livre **não é um plano — está implementado**. A
  contradição de conformidade é mais concreta do que o dossiê pôde registrar. **Isto é
  informação para o dono da OS-20** (fora do escopo de escrita deste especialista;
  reportado no *handoff*).
- Sobre **OS-07** (URLs de profile do produtor): corroborado por leitura direta.

### 2.5 O que o ADR-040 diz — e o que ele **não** diz

**OBSERVADO** — `architecture/adrs/ADR-040-fonte-bronze-para-fhir-e-fatia-clinica-do-lakehouse.md@0a07a6f1`
(91 linhas, `Status: Accepted`, `Data: 2026-07-25`), lido integralmente:

- **A palavra `EVOLUCAO_PACIENTE` não aparece no ADR-040.** Nem `sinais vitais`, nem
  `vital`, nem `IoT`, nem `dispositivo`. **O ADR-040 é silente sobre a intenção de vitais.**
- O que ele diz sobre `Observation` é uma única linha, nas consequências negativas (L67–68):
  `Observation fica bloqueado até os resultados de exame serem ingeridos no Bronze` —
  isto é, ele trata `Observation` **exclusivamente como resultado de exame**.
- Ele declara o canal em lote: `O Bronze é atualizado em batch, então o canal FHIR não é
  near-real-time enquanto o CDC estiver parqueado` (L62–63).
- Ele reivindica `11.451.908` recursos FHIR em `7/8 tipos` (L58) — **sem enumerar quais oito**.

**INFERÊNCIA:** o ADR-040 **não supera** as afirmações de vitais dos diagramas, porque não
as menciona. Ele também **não as confirma**. Quem quiser dizer "a intenção sobreviveu ao
ADR-040" ou "não sobreviveu" está, em ambos os casos, argumentando por silêncio. **Só o
titular pode dizer.** É a questão Q1.5 de §6.

### 2.6 Ingresso de dispositivos / IoT: implementado ou aspiracional?

**OBSERVADO — busca por caminho.** Enumeração completa da árvore (3.685 entradas):
**nenhum** caminho contém `iot`, `device`, `kinesis`, `greengrass`, `mllp` ou `hl7v2` como
token substantivo (o único casamento de substring foi `quim**iot**erapia`, falso positivo).

**OBSERVADO — busca por código** no repositório pinado: `sinais_vitais` → 0 resultados;
`saturacao` → 0; `frequencia_cardiaca` → 0; `pressao_arterial` → 0; `vital_signs` → 0;
`sinal_vital` → 1 resultado, e esse resultado é
`products/dbt/models/bronze/atendimento/bronze_tasy_setor_atendimento.sql` (casamento por
tokenização, não por tabela de sinais vitais); `vital-signs` → 2 resultados, ambos já
tratados (`schemas/iceberg/fhir/fhir_observation.sql` em §2.1 e um `conftest.py` de teste
de contrato do RNDS); `dispositivos` → 3 resultados, um dos quais é o próprio diagrama de
fluxo de dados.

**OBSERVADO — a única menção substantiva a IoT no repositório** está em
`docs/archive/phase2-deferred/docs/reference/maezo-implementation-roadmap.md@0a07a6f1`
L362: `IoT/RFID: integração de eventos de IoT hospitalar (equipamentos, localização de
ativos) como gatilhos de processo.`

**INFERÊNCIA, com três observações que a sustentam:** (i) o caminho do arquivo é
`docs/archive/phase2-deferred/` — arquivado e diferido; (ii) o escopo declarado é
**equipamentos e localização de ativos**, não sinais vitais de pacientes; (iii) não há
nenhum artefato de ingestão de dispositivo na árvore. **O ingresso IoT de sinais vitais é
aspiracional.** Nenhum arquivo lido nesta sessão o descreve como implementado, e a única
aspiração registrada nem sequer é sobre sinais vitais.

**Limite honesto desta afirmação:** é a conclusão de uma busca delimitada em um único
commit de um único repositório. Um sistema de ingestão de dispositivos poderia existir
**fora** deste repositório. O titular saberá; o repositório não diz.

### 2.7 Quadro de proveniência — o que foi lido diretamente

Todos no commit `0a07a6f1fab36fb2f5eeee0fcd8e945c95f67116` do repositório
`Omni-Saude/amh-data-platform`, por leitura somente leitura em 2026-08-15.

| # | Caminho | O que sustenta | Rótulo |
|---|---|---|---|
| E-1 | `architecture/diagrams/data-flows/data-flow-fhir-clinical.md` (L121, L140) | Lado A de C-1: `Observation para sinais vitais`; `✅ (sinais vitais de dispositivos IoT)` | OBSERVADO |
| E-2 | `architecture/diagrams/c4-component/c4-component-fhir-pipeline.md` (L25, L95) | Lado A + auto-inconsistência do próprio arquivo | OBSERVADO |
| E-3 | `schemas/fhir-profiles/` (enumeração, 21 JSON de nível superior = 19 `StructureDefinition` + CapabilityStatement + ImplementationGuide) | Um único profile de `Observation`; nenhum de sinais vitais; nenhum `MedicationAdministration` | OBSERVADO |
| E-4 | `schemas/fhir-profiles/Observation-amh-laboratory-profile.json` (L76–99, L139–143) | `category` fixada em `laboratory`; LOINC extensible; UCUM fixo | OBSERVADO |
| E-5 | `pipelines/batch/fhir/bronze_to_fhir.py` (L~706–830) | `EVOLUCAO_PACIENTE → ClinicalImpression` apenas; `Observation` laboratorial com `valueString`; URL de profile divergente | OBSERVADO |
| E-6 | `architecture/adrs/ADR-040-...md` (integral, 91 linhas) | Silêncio sobre `EVOLUCAO_PACIENTE`, vitais e IoT; `Observation` = exame; canal em lote | OBSERVADO |
| E-7 | `schemas/iceberg/fhir/fhir_observation.sql` (cabeçalho + coluna `category_code`) | Terceiro artefato do lado A; DDL autodeclarada nunca executada | OBSERVADO |
| E-8 | `docs/archive/phase2-deferred/.../maezo-implementation-roadmap.md` (L362) | Única menção substantiva a IoT: arquivada, diferida, sobre ativos | OBSERVADO |
| E-9 | Árvore completa (3.685 entradas) + 7 buscas de código | Ausência de fonte de sinais vitais nomeada em qualquer lugar do repositório | OBSERVADO (busca delimitada) |

**Itens que este especialista NÃO leu e cita de segunda mão:**
`docs/reference/fhir-observation-source-request.md` (bloqueio laboratorial, `0 linhas` em
`PACIENTE_EXAME`), README da AMH (`1 de 4 provisionado`), `partitioning-config.md`,
ADR-041/042/045 — todos **FONTE (dossiê)**, via `compatibility-finding.md`,
`four-layer-dossier.md` e `claim-verification-matrix.md`.

### 2.8 Verificação de contradição com o que os documentos V2 afirmam

Exigência de parada: se a leitura pinada contradissesse os documentos V2, parar de derivar
dessa premissa. **Resultado: nenhuma contradição encontrada.** Cada afirmação V2 sobre C-1
que pôde ser verificada diretamente foi **confirmada**:

| Afirmação V2 | Verificação direta 2026-08-15 |
|---|---|
| `compatibility-finding.md` §3.2: um único profile de `Observation`, com `category` fixada em `laboratory` | **Confirmado** (E-3, E-4) |
| `four-layer-dossier.md` L84: o C4 é auto-inconsistente (mapeador mostra só `ClinicalImpression`) | **Confirmado** (E-2) |
| `open-questions...` Q1: os diagramas afirmam vitais em dois lugares | **Confirmado, e há um terceiro artefato** (E-7) |
| `ordens-de-servico...` §9.1: sinais vitais exigem novo profile + fonte povoada | **Confirmado** (E-3, E-4, E-9) |

**Três acréscimos, nenhum deles uma contradição:** o terceiro artefato do lado A (E-7); o
silêncio integral do ADR-040 sobre vitais e sobre `EVOLUCAO_PACIENTE` (E-6); e o fato de o
caminho de texto livre da C-4 estar **implementado**, não apenas planejado (E-5).

---

## 3. Demanda clínica concreta

### 3.1 Insumos exigidos por cada precursor de regra V2

Fontes: `docs/05-clinical-safety/rule-releases/news2/specification.md` §2.1;
`.../sofa/specification.md` §3.1; `.../gcs/specification.md` §5.1. Códigos LOINC são
**candidatos** nas próprias especificações (o arquiteto de terminologia é o dono do pino);
reproduzidos aqui apenas para tornar a demanda concreta. **Nenhum limiar, banda ou
ponto de corte aparece neste documento.**

#### RULE-NEWS2-0100 — sete parâmetros pontuados + um governado

| # | Insumo | Classe | LOINC cand. | Unidade | O que a AMH tem hoje |
|---|---|---|---|---|---|
| 1 | Frequência respiratória | sinal vital | 9279-1 | `/min` | **nada demonstrado** |
| 2 | SpO2 (oximetria de pulso) | sinal vital | 59408-5 | `%` | **nada demonstrado** |
| 3 | Estado de O2 suplementar (ar × O2) | terapia/registro | derivado de 3151-8 ou dispositivo documentado | booleano | **nada demonstrado** |
| 4 | Pressão arterial sistólica | sinal vital | 8480-6 | `mm[Hg]` | **nada demonstrado** |
| 5 | Pulso | sinal vital | 8867-4 | `/min` | **nada demonstrado** |
| 6 | Consciência ACVPU | avaliação de beira-leito | 67775-7 | token {A,C,V,P,U} | **nada demonstrado** |
| 7 | Temperatura | sinal vital | 8310-5 | `Cel` | **nada demonstrado** |
| G | Atribuição de escala de SpO2 | ordem/flag (não `Observation`) | — | enum | **nada demonstrado** |

**Regra de composição (SOURCE — spec §5.2):** ausência de **qualquer** dos sete →
`not_evaluated`. **Não existe NEWS2 parcial.** Consequência: a regra exige **7 de 7**.

#### RULE-SOFA-0100 — seis componentes, catorze insumos

| # | Insumo | Classe | O que a AMH tem hoje |
|---|---|---|---|
| 1 | Idade | demográfico | `Patient-amh` declarado (camada 1); povoamento **não medido pela V2** |
| 2 | PaO2 arterial | laboratório (gasometria) | bloqueado (OS-20); **nada demonstrado** |
| 3 | FiO2 | ajuste de ventilador/dispositivo | **nada demonstrado**; sem contrato |
| 4 | Estado de suporte respiratório | dispositivo/registro | **nada demonstrado**; sem contrato |
| 5 | Plaquetas | laboratório | bloqueado (OS-20) |
| 6 | Bilirrubina total | laboratório | bloqueado (OS-20) |
| 7 | **PAM** | **sinal vital** | **nada demonstrado** — excluído por §2.2 |
| 8 | Identidade do vasoativo | medicamento | `MedicationRequest`/`MedicationDispense` declarados; **dispensação ≠ administração titulada** |
| 9 | **Taxa de dose do vasoativo** | administração de medicamento | **sem profile `MedicationAdministration` na IG** (E-3) |
| 10 | Peso corporal | medida (categoria `vital-signs` em FHIR) | **nada demonstrado** — excluído por §2.2 |
| 11 | **GCS (E/V/M)** | avaliação de beira-leito | **nada demonstrado** — excluído por §2.3 |
| 12 | RASS (gate de sedação) | avaliação de beira-leito | **nada demonstrado** — excluído por §2.3 |
| 13 | Creatinina | laboratório | bloqueado (OS-20) |
| 14 | Diurese por intervalo | registro de enfermagem | **nada demonstrado**; sem contrato |

#### RULE-GCS-0100 — sete insumos

| # | Insumo | Classe | O que a AMH tem hoje |
|---|---|---|---|
| 1 | Idade | demográfico | como acima |
| 2–4 | Componentes E (9267-6), V (9270-0), M (9268-4) | avaliação de beira-leito | **nada demonstrado** — excluído por §2.3 |
| 5 | GCS total da fonte (9269-2) | avaliação de beira-leito | **nada demonstrado**; e a spec §5.2 **não aceita total nu** para computação |
| 6 | RASS (gate) | avaliação de beira-leito | **nada demonstrado** |
| 7 | Estado de infusão sedativa | administração de medicamento | **sem profile de administração** |

### 3.2 A coluna que importa — "o que a AMH tem hoje"

**OBSERVADO/INFERÊNCIA:** para **todos os 28 insumos** das três tabelas acima, exceto
idade (declarada na camada 1, não medida) e os quatro laboratoriais (declarados e
**bloqueados**), a resposta é a mesma: **nada demonstrado em nenhuma camada de evidência.**
Não há profile, não há fonte nomeada no repositório, não há reivindicação de povoamento.

**Isto não é o mesmo que "a AMH afirma que não tem".** É: nenhum arquivo lido neste ciclo
afirma que tem, e o único profile que poderia carregá-los estrutura-se contra eles.

### 3.3 Consequência — quais candidatos permanecem inelegíveis

**FONTE (V2)** — `hard-gate-assessment.md` §2.4 e §7.5; `pathway-to-source-matrix.yaml`
(`eligible_row_count: 0` em 25 linhas); `candidate-inventory.md` §8.5
(*"Candidates implementable in actionable mode today: 0"*).

**INFERÊNCIA deste especialista, para tornar a consequência dizível em uma frase:** as
vias candidatas dividem-se por **qual classe ausente as bloqueia**, e sinais vitais são
apenas uma das quatro:

| Classe ausente | Quem a desbloqueia | Candidatos cuja elegibilidade depende dela |
|---|---|---|
| **Sinais vitais** (C-1) | esta decisão | NEWS2, MEWS, qSOFA (parcial), SOFA-CV, estabilidade, respiratório (parcial) |
| **Laboratório estruturado** | OS-20 | SOFA (coag/hepática/renal), equilíbrio, sepse, renal, respiratório (PaCO2) |
| **Administração de medicamentos** (sem profile) | **nenhuma ordem existente** | SOFA-CV (dose), sedação, delirium, antimicrobiano, profilaxia |
| **Registro de enfermagem / escalas de beira-leito** | **esta decisão, se D-c = "não-laboratorial"** | GCS, SOFA-CNS, ACVPU do NEWS2, diurese, delirium, nutrição |

**A leitura para o titular:** resolver C-1 na acepção estreita ("só sinais vitais")
desbloqueia **no máximo** o agrupamento de alerta precoce, e somente se a consciência
(ACVPU) e o estado de O2 vierem junto. As demais vias permanecem bloqueadas por classes que
**nenhuma opção deste pacote endereça**. O detalhamento por candidato está em
[`impacto-no-portfolio.md`](./impacto-no-portfolio.md).

---

## 4. Opções

Todas são **PROPOSAL**. Nenhuma esgota o portão 4 (`PROMPT:415` exige semântica, unidade,
tempo, identidade, encontro, proveniência, política de frescor, comportamento de correção
**e** medição de população representativa — nenhuma opção entrega tudo isso sozinha).

### O1 — Novo profile FHIR de sinais vitais na AMH + fonte estruturada povoada

**O quê.** A AMH autora, publica e versiona um profile `Observation` de sinais vitais
(com `category = vital-signs`, `code` vinculado a LOINC de sinais vitais, `valueQuantity`
com UCUM), identifica uma fonte estruturada, a ingere no Bronze, escreve o mapeador no
produtor de registro e **mede** o povoamento por tenant.

**Qual fonte candidata?** Esta é a pergunta que o titular precisa responder, e a evidência
diz o seguinte:

- **`EVOLUCAO_PACIENTE` não serve como está.** OBSERVADO (E-5): o produtor de registro a
  mapeia para `ClinicalImpression.description` — texto livre truncado em 10.000
  caracteres. INFERÊNCIA: extrair vitais dali exigiria PLN sobre texto clínico em
  português, o que é não determinístico e colide com o portão 7 e com o ADR-0007. Se a
  AMH sustentar que `EVOLUCAO_PACIENTE` contém vitais **estruturados** em colunas próprias
  (não em `ds_evolucao`), isso é um fato que só a AMH tem — e mudaria o custo desta opção
  radicalmente.
- **Nenhuma outra fonte de vitais é nomeada no repositório.** OBSERVADO (E-9): zero
  resultados para `sinais_vitais`, `saturacao`, `frequencia_cardiaca`, `pressao_arterial`,
  `vital_signs`. **A fonte não está apenas não-ingerida: está não-identificada na
  documentação da própria plataforma.**

**Esforço.** Duas partes de magnitude muito diferente:
- *Profile e vocabulário*: **pequeno** — uma `StructureDefinition` mais ValueSet, análoga
  à laboratorial existente. Dias de trabalho de um autor de IG.
- *Fonte identificada, ingerida, mapeada e medida*: **grande e não estimável a partir da
  evidência** — inclui identificar a tabela de origem no Tasy, ingeri-la no Bronze,
  escrever o mapeador, garantir conformidade LOINC/UCUM e medir cobertura por tenant.

**Prazo.** **Não derivável da evidência.** O único precedente medível é o caminho
laboratorial: fonte **identificada**, mapeador **escrito**, e ainda assim `aguardando
ingestão no Bronze` desde 2026-07-24 (FONTE — dossiê), sem data em OS-20 em 2026-08-15.
**INFERÊNCIA (limite inferior, deliberadamente não otimista):** uma fonte de vitais que
sequer está identificada não pode chegar antes de uma fonte laboratorial que está
identificada e bloqueada há ≥ 3 semanas. **O1 não pode ser agendada; pode ser iniciada.**

**Pré-requisitos.** Identificação da fonte (ato AMH); OS-05 (publicação da IG com digest —
se a decisão sair antes de 1.1.0 embarcar, o profile pega esse trem; senão, 1.2.0);
OS-08 (produtor conforme); OS-09/ambiente para verificar qualquer coisa; OS-16 para
qualquer trabalho com dado real.

**Riscos.**
1. **Repetir a C-4 com outra roupa** — publicar o profile e povoá-lo com `valueString` ou
   códigos locais não mapeados. O precedente é literal e está implementado (E-5). Mitigação:
   condição de aceitação escrita **antes** — "vitais chegam com LOINC e `valueQuantity`
   UCUM, ou não contam como desbloqueio".
2. **Frescor.** OBSERVADO (E-6): o canal FHIR `não é near-real-time`. Os sinais vitais são
   a classe mais sensível a frescor de todas: RULE-NEWS2-0100 propõe janela de **1 hora**
   para FR, SpO2, pulso e PA. **Um feed de vitais em lote pode ser conforme e ainda assim
   produzir `stale`/`not_evaluated` na maioria das leituras.** Isto é camada 4 e está
   inteiramente não medido.
3. **Ambiente.** Só `dev` existe (FONTE — dossiê). Nada disto é verificável em ambiente
   similar a produção, por ninguém.
4. **Caminho crítico externo.** Coloca todo o valor clínico da V2 atrás de um item de
   trabalho de outra organização, sem data.

**O que O1 NÃO resolve.** Frescor (camada 4); ambiente (Q6); administração de
medicamentos / dose de vasoativo (sem profile); diurese; FiO2 e suporte respiratório;
sinal de suspeita de infecção (qSOFA); e — se D-c ficar na acepção estreita — GCS, RASS e
ACVPU. Não produz, por si, nenhuma evidência de camada 2, 3 ou 4.

---

### O2 — Ingresso direto de dispositivos/monitores na V2

**O quê.** A V2 opera sua própria via de sinais vitais: integração com monitores
multiparamétricos / gateway de dispositivos / captura de registro de enfermagem,
alimentando o armazenamento operacional da própria V2, **contornando a AMH para vitais** e
mantendo a AMH como fonte de contexto (paciente, encontro, condição, medicamento).

**Implicações de fronteira (ADR-0001).**
- **FONTE (V2)** — `ADR-0001-amh-platform-boundary.md` (`proposed`) enumera as opções A
  (consumidor da AMH com armazenamento operacional próprio), B (módulo dentro da AMH),
  C (híbrida com via near-real-time), D e Z. **INFERÊNCIA:** O2 é incompatível com a opção
  B e empurra o ADR-0001 para A ou C. Decidir C-1 por O2 **pré-restringe** o ADR-0001 — o
  titular deve saber que está fazendo isso.
- **FONTE (V2)** — driver D6 do ADR-0001: *"uma única fonte de verdade clínica governada"*.
  O2 cria uma segunda via de dado clínico e, com ela, a obrigação de definir precedência,
  conflito, correção, replay e reconciliação. Não é um detalhe: é o próprio conteúdo do
  driver.

**A implicação decisiva, e é contraintuitiva.** **INFERÊNCIA (de §2 + AQ-4/OS-10..OS-15):**
um monitor emite identidade de **leito/dispositivo**, não identidade de paciente. Ligar um
valor de monitor ao paciente e ao encontro certos exige exatamente a espinha de identidade
que está sendo construída do lado AMH (PSR, eventos de ciclo de vida, `resolve(ref,
as_of)`). **O2 dispensa a AMH para o *valor*, nunca para a *identidade*.** Quem escolher O2
esperando sair do caminho crítico da AMH sairá dele pela metade.

**Esforço.** **Grande, e é engenharia que a V2 controla** — que é justamente o argumento a
favor: protocolo e gateway de dispositivo, ordenação e bufferização, identidade de
dispositivo→leito→encontro, filtragem de artefato (movimento, desconexão, calibração),
armazenamento operacional durável, plantão. Mais: **captura de ACVPU e estado de O2**, que
**não vêm de monitor** (§3.1) — sem um caminho de registro/enfermagem, O2 entrega **5 dos
7** insumos do NEWS2, e 5 de 7 é `not_evaluated`.

**Prazo.** Não estimável sem decisão de escopo e de equipe; mas, ao contrário de O1, é
**agendável** — a dependência é interna.

**Pré-requisitos.** ADR-0001 decidido ou explicitamente pré-restringido; ADR sobre a
segunda fonte de verdade e reconciliação; DEC-G0-03 (só dado sintético) mantém-se até
OS-16; avaliação de uso pretendido e regulatória — ingerir de dispositivos médicos aproxima
a V2 de um papel de sistema de dados de dispositivo, com impacto declarado no
`intended-use-statement.md` e novo perigo a registrar; segurança e isolamento por tenant no
novo ingresso.

**Riscos.** Duas fontes de verdade divergindo em produção; identidade dispositivo→paciente
errada (perigo clínico direto, de gravidade máxima); expansão silenciosa do uso pretendido;
custo operacional permanente; e — se a AMH depois publicar vitais — duplicação permanente.

**O que O2 NÃO resolve.** Nada do laboratório (SOFA continua dependendo de OS-20); nada de
administração de medicamentos; diurese; ambiente da AMH para o contexto; a espinha de
identidade; e não fecha nenhum dos portões 1, 2, 5, 9, 10, 11, que falham por razões de
programa, não de dado.

---

### O3 — Híbrido com critério de corte

**O quê.** A V2 ingere vitais direto no **curto prazo** (O2, possivelmente em escopo
reduzido: um tenant/unidade piloto, com dado sintético até OS-16); a AMH publica o profile
e identifica/ingere a fonte no **médio prazo** (O1); e existe, **escrito antes de começar**,
um critério de corte que determina quando a V2 troca de fonte.

**Critério de corte — PROPOSAL, para o titular ratificar ou substituir.** A troca ocorre
quando **todas** forem verdadeiras, medidas e publicadas:
1. Profile de sinais vitais publicado em package da IG com digest citável e pinado pela V2;
2. Cobertura medida ≥ um limiar acordado por tenant piloto (o número é decisão clínica/
   produto — não proposto aqui);
3. Conformidade de código e unidade medida: percentual de instâncias com LOINC vinculado e
   `valueQuantity` UCUM;
4. **Frescor medido ponta a ponta** dentro da janela da regra que vai consumir (para o
   NEWS2, a janela proposta é de 1 hora — §4/O1 risco 2);
5. Estabilidade por N dias consecutivos em ambiente similar a produção (o que exige que
   tal ambiente exista);
6. Via direta mantida como *fallback* por M meses após a troca, com reconciliação medida
   entre as duas fontes durante a sobreposição.

**Esforço.** O maior dos quatro em regime permanente — é O1 **mais** O2, com um período de
duas vias. Em contrapartida, é o único que **desacopla o cronograma da V2 do da AMH sem
abandonar o alvo estratégico**.

**Prazo.** A parte V2 é agendável; a parte AMH herda a não-estimabilidade de O1. O
critério de corte é o que impede que "não estimável" contamine o cronograma da V2.

**Pré-requisitos.** Todos os de O1 e de O2, mais: o critério de corte **acordado por
escrito antes do início** (senão a via "temporária" torna-se permanente por inércia — é o
modo de falha clássico deste desenho), e um dono nomeado para executar a troca.

**Riscos.** Custo permanente de duas vias; a via temporária virar definitiva; divergência
entre as duas fontes durante a sobreposição (que é também a oportunidade: a sobreposição é
a única chance de **medir** a qualidade do feed AMH contra uma referência); e dispersão de
foco de uma equipe pequena.

**O que O3 NÃO resolve.** Exatamente o que O1 e O2 também não resolvem: laboratório,
administração de medicamentos, diurese, ventilador, sinal de infecção, ambiente, e os
portões de programa (1, 2, 5, 9, 10, 11).

---

### O4 — Diferir: portfólio inicial só com o que dispensa vitais

**O quê.** Não financiar nenhuma via de vitais neste ciclo. Compor o portfólio inicial com
o que não os exige, e revisitar C-1 em data marcada.

**A consequência honesta, dita sem rodeios.**
- **FONTE (V2)** — `candidate-inventory.md` §8.5 e `hard-gate-assessment.md` §7.7:
  **candidatos implementáveis em modo acionável hoje = 0**, de 20 identificados. O portão 4
  falha para todos.
- **INFERÊNCIA:** O4 **não** produz "um portfólio menor". Produz **nenhum portfólio
  clínico**. Não por causa de vitais apenas: o laboratório também está bloqueado até OS-20,
  a administração de medicamentos não tem profile, e as escalas de beira-leito estão
  excluídas pelo mesmo mecanismo de §2.3. Mesmo o candidato de bloqueio mais estreito
  (CAND-0017, equilíbrio hidroeletrolítico, que é puramente laboratorial) depende de OS-20,
  que também não tem data.
- Além disso, os portões 1, 2, 5, 9, 10 e 11 falham para **todos** os candidatos por razões
  de programa (sem uso pretendido aprovado, sem dono clínico nomeado, sem fluxo observado,
  sem linha de base, sem financiamento de vigilância). **Nenhum insumo conserta isso.**

**Esforço.** Nenhum, na frente de vitais. O trabalho do ciclo passa a ser: OS-16, G1,
espinha de identidade, contrato v1, ADRs 0001/0003/0005+, e a fatia vertical G7 com dado
sintético — que é exatamente o caminho crítico §0.6 sem o item 4.

**Prazo.** Imediato, por definição.

**Riscos.**
1. **Linhas de base perecíveis.** FONTE (`INTENSICARE_V2_ORCHESTRATOR_PROMPT.md` §0.6 item
   2): G2-VAL-0025 e VAL-0035 são **irrecuperáveis após o go-live**. Adiar não é neutro no
   tempo.
2. **Diferir sem data é abandonar com outro nome.** Um O4 sem gatilho de revisão escrito é
   indistinguível de desistir da avaliação clínica.
3. Risco de programa: gastar o fôlego do projeto em infraestrutura sem nenhuma
   demonstração clínica, o que corrói o argumento de continuidade.

**O que O4 NÃO resolve.** C-1, integralmente. Ele a adia — legitimamente, se e somente se
vier com data e gatilho.

---

### 4.5 Comparação em uma tela

| | **O1** AMH profile+fonte | **O2** ingresso direto V2 | **O3** híbrido | **O4** diferir |
|---|---|---|---|---|
| Esforço V2 | baixo (consumo) | alto | alto | nenhum |
| Esforço AMH | alto e não estimável | nenhum | alto e não estimável | nenhum |
| Agendável pela V2 | **não** | sim | parcialmente | sim |
| Frescor compatível com janela de 1 h | **improvável** (canal em lote) | provável | sim, na via direta | n/a |
| Fonte de verdade | única | **duas** | duas, com corte | única |
| Pré-restringe ADR-0001 | não | **sim** (exclui opção B) | **sim** | não |
| Entrega ACVPU / estado de O2 | talvez (depende da fonte) | **só com caminho de registro** | idem | não |
| Vias acionáveis ao fim | 0 (faltam outros portões) | 0 | 0 | 0 |
| Desbloqueia GCS/RASS | só se D-c = não-laboratorial | sim (é registro V2) | sim | não |

**A última linha não é ironia.** Nenhuma opção, sozinha ou combinada, produz uma via
clínica acionável, porque o portão 4 não é o único que falha. As opções diferem em
**quantos candidatos passam a ser potencialmente elegíveis** quando os demais portões
fecharem — e em **quem controla o cronograma**.

---

## 5. Recomendação

> **PROPOSAL — recomenda-se O3 (híbrido com critério de corte), com o escopo da face D-c
> fixado em "Observações não-laboratoriais", não apenas "sinais vitais".**

### 5.1 Racional

1. **C-1 está no caminho crítico e, do lado AMH, é hoje inagendável.** OBSERVADO (E-9): a
   fonte de vitais não está identificada em lugar nenhum do repositório da plataforma. O1
   sozinha coloca **todo** o valor clínico da V2 atrás de um item sem fonte identificada e
   sem data, cujo precedente mais próximo (laboratório, com fonte identificada) está parado
   há semanas.
2. **O2 sozinha abandona o ativo estratégico e não escapa da AMH.** O corpus de contexto
   (Patient, Encounter, Condition, Medication) é real e é a metade afirmativa do achado de
   compatibilidade. E a identidade continua vindo da AMH de qualquer forma (§4/O2).
3. **O4 sozinha entrega zero e queima linhas de base perecíveis** sem prazo de retorno.
4. **O3 é o único desenho em que o cronograma da V2 depende do que a V2 controla, sem
   descartar o alvo.** O1 é um subconjunto estrito de O3: nada do investimento AMH é
   perdido.
5. **O escopo "não-laboratorial" custa quase nada a mais e vale muito.** OBSERVADO (§2.3):
   é o mesmo `patternCodeableConcept` que bloqueia vitais, GCS, RASS, ACVPU e diurese.
   Corrigir de uma vez evita que o NEWS2 seja desbloqueado sem sua sétima entrada — e a
   RULE-NEWS2-0100 não computa sem ela.
6. **A sobreposição é a única oportunidade de medir a AMH.** Enquanto as duas vias
   coexistirem, a V2 pode medir cobertura, conformidade e frescor do feed AMH **contra uma
   referência**, gerando exatamente a evidência de camadas 3 e 4 que hoje não existe para
   ninguém. Isto é benefício, não só custo.

### 5.2 Confiança — limite inferior, declarado

| Sobre o quê | Confiança | Por quê |
|---|---|---|
| Que a **forma** O3 é preferível a O1/O2/O4 isoladas | **média** | Repousa em fatos verificados (fonte não identificada; canal em lote; identidade permanece AMH) mais um juízo de programa que depende de capacidade de equipe e orçamento que **este especialista não conhece**. |
| Que O1 **sozinha** não é agendável hoje | **alta** | OBSERVADO: fonte não identificada no repositório; precedente laboratorial parado sem data. |
| Qualquer **prazo** para qualquer opção | **nenhuma** | Nenhuma data é derivável da evidência. Este documento não oferece uma, e desconfie de quem oferecer sem apontar a fonte. |
| Que o escopo deva ser "não-laboratorial" | **alta** | Decorre diretamente da leitura do profile (E-4) e das especificações de GCS/NEWS2. |
| Que O3 produza uma via acionável no horizonte deste ciclo | **nenhuma** | Os portões 1, 2, 5, 9, 10 e 11 falham por razões de programa, não de dado. |

### 5.3 O que tornaria esta recomendação errada

**Declarado deliberadamente, para que o titular possa derrubá-la em uma frase:**

- **Se existir uma tabela de sinais vitais do Tasy já no Bronze** (o repositório não a
  nomeia, mas o titular sabe o que há no lago), o custo de O1 desaba e **O1 passa a ser a
  recomendação**: via única, contrato governado, sem segunda fonte de verdade. É a
  **questão 1** de §6, e é a primeira que deve ser respondida.
- **Se não houver equipe para operar um ingresso de dispositivos com plantão**, O2 e O3
  tornam-se indefensáveis por segurança operacional, e a escolha honesta é **O1 + O4**:
  financiar O1 e declarar francamente que não há portfólio clínico até ela chegar.
- **Se o uso pretendido aprovado excluir dado de dispositivo**, O2 e O3 caem por conformidade.

### 5.4 O que a recomendação **não** muda

O achado de compatibilidade permanece **candidato a integração; não demonstrado compatível
para avaliação de UTI acionável**. Nenhum precursor de regra deixa de ser **NÃO ACIONÁVEL**.
Nenhum candidato é admitido. O portão G3 continua distante e continua exigindo ambiente
similar a produção que não existe.

---

## 6. Questões numeradas ao titular

### 6.1 As cinco perguntas originais da Q1 (traduzidas, com o que esta sessão acrescentou)

| # | Pergunta | O que esta sessão acrescenta |
|---|---|---|
| **Q1.1** | Existe **hoje**, em qualquer ambiente, algum feed povoado de `Observation` de sinais vitais? Sob qual profile, em quais tenants, povoado como? | OBSERVADO: nenhum profile capaz de carregá-lo existe (E-3, E-4); nenhuma fonte é nomeada no repositório (E-9). |
| **Q1.2** | Se não, está planejado? Sob qual profile, sistema de códigos (LOINC?), vínculo de unidade (UCUM?) e frescor-alvo? | O frescor-alvo é a parte que costuma ficar de fora e é a que decide se o NEWS2 computa (janela proposta de 1 h × canal em lote, E-6). |
| **Q1.3** | `EVOLUCAO_PACIENTE` é fonte realista de vitais estruturados, ou é nota clínica livre que os diagramas superprometeram? | OBSERVADO (E-5): o produtor de registro a mapeia **só** para `ClinicalImpression.description`, texto livre. **Há colunas estruturadas de vitais nessa tabela do Tasy que o produtor ignora?** |
| **Q1.4** | O ingresso de vitais por dispositivo/IoT chegou a ser implementado, ou é aspiracional? | OBSERVADO (E-8, E-9): nenhum artefato de ingestão na árvore; a única menção substantiva a IoT está **arquivada**, **diferida** e trata de **equipamentos e localização de ativos**, não de vitais. |
| **Q1.5** | Os diagramas de maio/2026 devem ser lidos como intenção corrente, ou como superados pelo ADR-040? | OBSERVADO (E-6): **o ADR-040 é silente** — não menciona vitais, IoT nem `EVOLUCAO_PACIENTE`. Argumentar por superação **ou** por sobrevivência é, nos dois casos, argumentar por silêncio. |

### 6.2 As decisões de produto que cada opção implica

| # | Questão | Vinculada a |
|---|---|---|
| **QD-1** | Qual das quatro opções — O1, O2, O3, O4 — é a escolhida? (face **D-a**) | todas |
| **QD-2** | Onde isto entra na fila diante de OS-16, G1, OS-01..OS-21 e do orçamento do ambiente `stg`? (face **D-b**) | todas |
| **QD-3** | O escopo é "sinais vitais" ou **"toda `Observation` não-laboratorial"** (incluindo GCS, RASS, ACVPU, diurese)? (face **D-c**) | O1, O3 |
| **QD-4** | O titular aceita, explicitamente, que o portfólio clínico acionável seja **zero** até que a opção escolhida entregue **e** os portões de programa fechem? (face **D-d**) | todas |
| **QD-5** | Qual tenant/unidade é o piloto? (§0.6 item 4 pede nomeá-lo; ADR-041 registra 12 tenants com dado clínico, Austa Hospital = 89,2% dos encontros — FONTE, dossiê) | todas |
| **QD-6** | A `category` do profile laboratorial deveria ter sido **fatiada**? Isto é, o `patternCodeableConcept` sem `slicing` foi intencional? (§2.2) | O1, O3 |
| **QD-7** | Se O2 ou O3: aceita-se pré-restringir o **ADR-0001**, excluindo a opção B (módulo dentro da AMH)? | O2, O3 |
| **QD-8** | Se O2 ou O3: quem é o dono operacional da via de dispositivos (plantão, DR, restauração)? Existe essa capacidade? | O2, O3 |
| **QD-9** | Se O2 ou O3: qual o caminho de captura de **ACVPU e estado de O2 suplementar**, que **não vêm de monitor**? Sem ele, o NEWS2 continua `not_evaluated`. | O2, O3 |
| **QD-10** | Se O3: o critério de corte proposto em §4/O3 é aceito? Quais são os números dos itens 2, 4 e 5 (cobertura, frescor, dias)? | O3 |
| **QD-11** | Qual condição de aceitação escrita impede que "vitais desbloqueados" chegue como `valueString` — repetindo a C-4 já **implementada** (E-5)? | O1, O3 |
| **QD-12** | Se O4: qual a **data** e qual o **gatilho** de revisão? (Sem eles, O4 é abandono com outro nome.) | O4 |
| **QD-13** | Quem é o **steward de dado clínico** do lado AMH para um contrato de sinais vitais? (permanece aberto dentro de Q4 → OS-19) | O1, O3 |

---

## 7. Regra de supersessão

Este pacote deve ser **revisitado e possivelmente descartado** se qualquer uma das
condições abaixo ocorrer:

| # | Gatilho | Efeito |
|---|---|---|
| **S-1** | O titular responde **Q1.1** afirmativamente, ou nomeia uma fonte estruturada de vitais já presente no Bronze. | §4/O1 e §5 são **reescritos**: O1 passa a ser a recomendação. Esta é a supersessão mais provável. |
| **S-2** | A AMH publica um profile de `Observation` de sinais vitais em qualquer versão da IG. | O lado B de C-1 muda; §2.2 e §3 devem ser re-verificados no novo commit. |
| **S-3** | O commit pinado `0a07a6f1` deixa de ser a referência (nova evidência aceita em outro commit). | **Toda** a §2 deve ser re-verificada. Nenhuma conclusão daqui sobrevive à troca de commit sem re-leitura. |
| **S-4** | O ADR-0001 é decidido. | §4/O2 e §4/O3 devem ser reescritos contra a fronteira decidida, não contra opções. |
| **S-5** | OS-20 entrega laboratório estruturado conforme. | O quadro de §3.3 muda de composição; o peso relativo de C-1 no portfólio aumenta. |
| **S-6** | Um ambiente similar a produção passa a existir. | Camadas 2–4 tornam-se verificáveis; os riscos de frescor de §4/O1 tornam-se **mensuráveis** em vez de argumentados. |
| **S-7** | O uso pretendido aprovado exclui (ou passa a exigir) dado de dispositivo. | O2 e O3 caem, ou tornam-se obrigatórias. |
| **S-8** | Descobre-se sistema de ingestão de dispositivos **fora** do repositório `amh-data-platform`. | §2.6 está errada quanto ao fato; a conclusão sobre O2 muda de "construir" para "integrar". |

**Cadência mínima na ausência de gatilho:** revisitar a cada ciclo de trabalho, junto com a
re-pinagem do commit de evidência (ASM-0002).

---

## 8. Referências cruzadas

- [`open-questions-for-amh-owners.md`](../open-questions-for-amh-owners.md) — Q1 original e
  o estado pós-adjudicação (Q1 = 🔴 ABERTA).
- [`compatibility-finding.md`](../compatibility-finding.md) §3.2 — a restrição dura de
  portfólio.
- [`four-layer-dossier.md`](../four-layer-dossier.md) — C-1 e as quatro camadas.
- [`ordens-de-servico-amh-2026-08-15.md`](../ordens-de-servico-amh-2026-08-15.md) §9.1 — o
  que as 21 ordens não cobrem; OS-20.
- [`impacto-no-portfolio.md`](./impacto-no-portfolio.md) — efeito de O1–O4 por candidato.
- `docs/05-clinical-safety/rule-releases/{news2,sofa,gcs}/specification.md` — os insumos.
- `docs/05-clinical-safety/pathway-portfolio/{candidate-inventory,hard-gate-assessment,pathway-to-source-matrix.yaml}` —
  candidatos e portões (**referenciados, não alterados**).
- `docs/06-architecture/adrs/ADR-0001-amh-platform-boundary.md` — fronteira (`proposed`).

---

*Preparado pelo engenheiro de contrato de sinais clínicos AMH em 2026-08-15, por inspeção
somente leitura no commit pinado `0a07a6f1fab36fb2f5eeee0fcd8e945c95f67116`. Nada foi
escrito no repositório AMH. Nenhum ambiente foi acessado. Não há PHI, credenciais, tokens,
endereços de endpoint nem identificadores reais neste documento. Nenhuma contradição foi
adjudicada; nenhuma decisão foi tomada.*
