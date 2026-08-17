---
doc_id: API-EVENTS-MCP-PERFIS-FHIR-PLANO
status: PROPOSAL
owner: UNASSIGNED — VALIDAÇÃO NECESSÁRIA
source: >
  docs/06-architecture/adrs/ADR-0013-perfis-fhir-hl7-terminologia-writeback.md
  (accepted — direção GDEC-0016; minuta materializada em construção
  GDEC-0015; F1-F10); docs/06-architecture/adrs/ADR-0001-amh-platform-
  boundary.md (accepted, GDEC-0008 — "a V2 SEMPRE consome dados da AMH;
  nunca ingestão direta"); packages/persistencia/src/migrations/
  0001_init.sql (esquema canônico real desta fatia, OBSERVADO);
  docs/08-interoperability/amh-data/contract-v1/ (contrato de fronteira AMH,
  não reescrito); busca no código-fonte de apps/ e packages/ (nenhuma
  referência a FHIR encontrada, OBSERVADO, 2026-08-16)
date_collected: 2026-08-16
collector: especialista de publicação de contratos como documentação (SPR-G4-4, ciclo 6)
last_updated: 2026-08-16
---

# Plano de perfis FHIR R4 — recursos da fatia SPR-G7-2

PREMISSA (reversível, GDEC-0015/0017): este documento é um **plano**, não um
perfil publicado. ADR-0013 F2 prevê que canônicos de perfil, quando
existirem, vivam em `packages/contratos` — este arquivo antecipa, para os
três recursos que a fatia G7 de fato manipula, o que aquele trabalho
precisaria mapear. Nenhuma alegação de conformidade FHIR é feita ("FHIR
compatible" genérico é proibido — ADR-0013 F1/prompt §20). Nenhuma
alegação de efetividade clínica, conformidade regulatória ou segurança
comprovada é feita. Nenhum dado real foi acessado.

> **NENHUM PERFIL FHIR NEM CÓDIGO FHIR EXISTE IMPLEMENTADO NESTA FATIA.**
> OBSERVADO (2026-08-16): busca em `apps/` e `packages/` não encontrou
> nenhuma referência a FHIR, `StructureDefinition`, ou biblioteca FHIR.

## 1. Por que este plano existe

ADR-0013 F1 proíbe alegação genérica de padrão ("FHIR compatible" sem
versão/perfil/cenário nomeados). Antes que qualquer código FHIR seja escrito,
este plano nomeia — por recurso, restrito ao que a fatia G7 de fato
consome/expõe hoje — o que um perfil precisaria cobrir: campos obrigatórios,
cardinalidade, bindings de terminologia e o que fica **fora** do perfil
(minimização estrutural, ADR-0013 §6 Implicações). Ele não substitui a
autoria formal do perfil (que exige ferramenta/processo próprios, fora do
escopo desta tarefa).

## 2. A fronteira que governa tudo abaixo: ADR-0001

SOURCE (ADR-0001, accepted GDEC-0008, formulação do titular): **"a V2
SEMPRE consome dados da AMH; nunca ingestão direta."** Consequência direta
(ADR-0013 F3): o perfil de **consumo** da V2 é sempre contra o contrato da
lane operacional AMH — a V2 nunca ingere diretamente de EHR, dispositivo ou
interface HL7 v2 de origem. Este plano, portanto, cobre dois papéis FHIR
distintos por recurso, nunca um terceiro:

| Papel | Significado | Quem valida |
|---|---|---|
| **Consumo** | A V2 recebe o recurso já materializado pela fronteira AMH | Contrato AMH×V2 (`docs/08-interoperability/amh-data/contract-v1/`) |
| **Exposição** | A V2 expõe o recurso, na sua forma canônica interna, a um consumidor externo autorizado (ex.: MCP classe L, `politica-mcp.md`; futuro cliente SMART) | Perfil restrito próprio (F2), com SMART/OIDC (F8) |

**Gap declarado:** o contrato AMH×V2 hoje (`contract-v1/`) cobre apenas o
ciclo de vida de **identidade** (PSR) — não cobre ainda o envelope de fatos
clínicos que alimentaria um perfil `Observation` de **consumo**. Isso é
VALIDAÇÃO NECESSÁRIA e não é resolvido por este documento; citado para que
o mapeamento de "Consumo" abaixo não seja lido como se já existisse do lado
AMH.

## 3. Recursos no escopo desta fatia

A tarefa nomeia três: `Observation`, `Encounter`, `Patient`. O mapeamento
abaixo parte do esquema canônico **real** desta fatia
(`packages/persistencia/src/migrations/0001_init.sql`, OBSERVADO) — não de
um esquema hipotético — para que qualquer FHIR futuro tenha algo concreto
para se restringir contra.

### 3.1 `Observation` (papel: exposição — a V2 não recebe FHIR na ingestão desta fatia)

Fonte canônica: tabela `clinical_observations` + `ResultadoAvaliacao`
(`packages/contratos/openapi.yaml`).

| Campo canônico V2 (OBSERVADO) | Candidato a campo FHIR R4 `Observation` | Cardinalidade planejada | Binding de terminologia | Nota |
|---|---|---|---|---|
| `concept` (`clinical_observations.concept`, hoje string livre `SYNTH-CONCEPT-*` em teste; `ParametroClinico` no contrato REST: `FC, FR, PAS, SpO2, Temperatura, NivelConsciencia`) | `Observation.code` | 1..1 | **LOINC** (ADR-0013 F5) — mapeamento concreto `ParametroClinico → LOINC` NÃO existe ainda; PROPOSAL/pendência | O contrato REST já usa um subconjunto ilustrativo (6 parâmetros) explicitamente não-final (`openapi.yaml`: "não é o catálogo final") |
| `source_value` + `source_unit` (`clinical_observations`) | `Observation.valueQuantity.value` / `.unit` | 1..1 (quando presente; `quality='quarantined'` nunca vira `valueQuantity` — vai a `dataAbsentReason`/quarentena, nunca coerção) | **UCUM** como sistema canônico de unidade (ADR-0013 F5, ADR-0005 M5) | `canonical_value`/`canonical_unit` são colunas separadas — preservam o valor de origem com proveniência, nunca sobrescrevem (ADR-0005 M6/M7) |
| `quality` (`valid \| warning \| quarantined \| unknown`) | Sem mapeamento 1:1 direto em `Observation.status`; provável combinação de `Observation.status` (`final`/`preliminary`/`entered-in-error`) + extensão de qualidade | VALIDAÇÃO NECESSÁRIA | — | `quarantined`/`unknown` nunca podem virar um `Observation.status=final` silencioso — coerção é proibida (F6) |
| `provenance` (jsonb: `sourceSystem`, `sourceEnvelopeId`, `transformation`, `mappingVersion`, `collector`) | Candidato a `Observation.meta` / `Provenance` (recurso FHIR separado) | VALIDAÇÃO NECESSÁRIA | — | Corresponde à obrigação de proveniência de ADR-0005; formato FHIR concreto não decidido |
| `observed_at` / `effective_at` (jsonb multi-campo: utc/offset/precisão/valor-fonte/fuso) | `Observation.effectiveDateTime` (ou `effectivePeriod`) | 1..1 | — | O modelo canônico V2 distingue tempo do fato × emissão × recebimento × persistência (ADR-0005 M3/M9); FHIR `effectiveDateTime` é um único instante — qual dos quatro tempos V2 mapeia para ele é VALIDAÇÃO NECESSÁRIA, não decidido aqui |
| `correction_of` (auto-referência) | `Observation.derivedFrom` ou padrão de `Provenance`/versão | VALIDAÇÃO NECESSÁRIA | — | Correção nunca é `UPDATE` (ADR-0005 M8; trigger append-only) — mapeamento FHIR precisa preservar essa semântica, não regredir para sobrescrita |
| `subject_ref` | `Observation.subject` → `Patient` (referência) | 1..1 | — | Sempre a ref opaca `amh:psr:v1:...` da fronteira AMH — nunca identificador de fonte cru (mesma regra do contrato de identidade) |
| `encounter_id` | `Observation.encounter` → `Encounter` (referência) | 1..1 | — | — |

**Fora do perfil restrito (deliberado, F2):** qualquer campo de
`Observation` R4 não usado por esta fatia (ex.: `component`,
`referenceRange`, `interpretation` codificado) fica fora até haver
necessidade demonstrada — perfil restrito, não "genérico compatível".

### 3.2 `Encounter` (papel: exposição/consumo — origem é a AMH via ADR-0001)

Fonte canônica: tabela `encounters`.

| Campo canônico V2 (OBSERVADO) | Candidato a campo FHIR R4 `Encounter` | Cardinalidade planejada | Nota |
|---|---|---|---|
| `id` | `Encounter.id` | 1..1 | — |
| `patient_id` (FK composta `(tenant_id, patient_id)`) | `Encounter.subject` → `Patient` | 1..1 | — |
| `bed_id` (opcional, FK `beds`) | `Encounter.location` | 0..1 | `beds`/`care_units` são tabelas próprias nesta fatia — mapeamento `location.location` vs. hierarquia `care_unit`/`bed` é VALIDAÇÃO NECESSÁRIA |
| `admitted_at` / `discharged_at` (jsonb multi-campo) | `Encounter.period.start` / `.end` | 1..1 / 0..1 | Mesmo gap de "qual dos tempos multi-campo mapeia para o instante único FHIR" do §3.1 |
| — (nenhuma coluna `status` hoje) | `Encounter.status` (`planned \| in-progress \| finished \| ...`) | 1..1 obrigatório em FHIR | **Gap**: o esquema canônico desta fatia não grava status de encontro explicitamente — `discharged_at IS NULL` seria uma inferência implícita de "em curso", não um campo. Fechar isto é PROPOSAL/pendência, não decidido aqui |

### 3.3 `Patient` (papel: consumo — identidade sempre vem da fronteira AMH; nunca criada pela V2)

Fonte canônica: tabela `patient_identities` — deliberadamente mínima nesta
fatia (marcada "SYNTH nesta fatia" no comentário SQL).

| Campo canônico V2 (OBSERVADO) | Candidato a campo FHIR R4 `Patient` | Cardinalidade planejada | Nota |
|---|---|---|---|
| `subject_ref` (`amh:psr:v1:...`, opaco) | `Patient.identifier` (sistema = a fronteira AMH; valor = a ref opaca) | 1..1 | **A V2 nunca cria identidade** — consome a ref opaca já mintada pela AMH (ADR-0001; contrato de identidade N-8, seis tipos de evento de ciclo de vida) |
| — (nenhum nome, CPF, data de nascimento nesta fatia) | `Patient.name`, `Patient.identifier` (CPF), `Patient.birthDate` | **Fora do perfil restrito nesta fatia** | A tabela `patient_identities` desta fatia não carrega nenhum PII/PHI direto — apenas a ref opaca. Se um perfil futuro precisar desses campos, isso é uma extensão de escopo que exige revisão de PHI (ADR-0017/ADR-0018), não uma decisão silenciosa deste plano |

**Nota crítica de minimização:** o perfil `Patient` restrito desta fatia é
deliberadamente o menor possível — a ref opaca e nada mais. Qualquer campo
adicional (nome, CPF, contato) é fora de escopo até uma decisão explícita
que também trate PHI/LGPD (ADR-0017/ADR-0018, ambas `not-started`).

## 4. Terminologia (ADR-0013 F5) — estado desta fatia

| Sistema | Uso planejado | Estado nesta fatia |
|---|---|---|
| **LOINC** | Código de observação (`Observation.code`) | Nenhum mapeamento `ParametroClinico → LOINC` existe em código; o contrato REST usa strings próprias (`FC`, `PAS`, `SpO2`, ...) |
| **UCUM** | Unidade canônica (`Observation.valueQuantity.unit`) | Sistema canônico já é premissa de ADR-0005 M5; unidade concreta por parâmetro não fixada em código nesta fatia (`source_unit` é string livre no esquema) |
| **SNOMED CT** | Achados/condições | **Cláusula adiada de licenciamento** (ADR-0013 F5) — nenhum conteúdo SNOMED nesta fatia; não aplicável a `Observation`/`Encounter`/`Patient` desta fatia (nenhum recurso `Condition` existe) |

## 5. Writeback — não aplicável a esta fatia

ADR-0013 F7: writeback só existe como fluxo individualmente aprovado.
**Nenhum fluxo de writeback está aprovado.** Esta fatia é read/consume-only
em relação à AMH (ADR-0001) e não escreve de volta a nenhum sistema de
origem. Citado aqui apenas para descartar a hipótese, não porque haja
trabalho de writeback em andamento.

## 6. SMART/OIDC (ADR-0013 F8) — não aplicável enquanto não há exposição FHIR real

F8 rege a exposição FHIR da V2 a clientes externos (verificação de
metadados de descoberta, issuer/audience, PKCE, escopos de menor
privilégio). Como nenhuma superfície FHIR está implementada (ver alerta no
topo), F8 é política a aplicar quando a exposição existir — não uma
lacuna desta fatia hoje.

## 7. Conformidade como evidência (ADR-0013 F10, Gate G5)

Nenhum destes três perfis é "pronto" no sentido de F10: nenhum tem testes de
contrato, semântica, segurança, proveniência, replay, falha, carga,
observabilidade ou recuperação executados contra sistema representativo.
Este plano é o insumo de entrada para esse trabalho futuro — não a evidência
em si.

## 8. Pendências consolidadas

1. Mapeamento concreto `ParametroClinico → LOINC` (§3.1) — não existe.
2. Decisão de qual dos quatro tempos multi-campo do modelo canônico
   (observado/efetivo/emitido/recebido) mapeia para o instante único FHIR
   `effectiveDateTime` (§3.1, §3.2) — VALIDAÇÃO NECESSÁRIA.
3. `Encounter.status` não tem coluna correspondente no esquema atual (§3.2)
   — gap de esquema, não de perfil.
4. Contrato AMH×V2 de fatos clínicos (para consumo real de `Observation`)
   não existe ainda — só identidade (§2).
5. Qualquer campo de PII/PHI direto em `Patient` (nome, CPF, nascimento)
   está fora de escopo até revisão explícita de ADR-0017/0018.
6. Ratificação cláusula a cláusula da minuta ADR-0013 pelo titular
   permanece ato humano futuro (GDEC-0016 aceitou apenas a direção em
   lote).

## 9. Autoverificação

Nenhuma alegação de conformidade FHIR é feita ("FHIR compatible" genérico
proibido, F1). Todo campo de esquema canônico citado foi lido diretamente de
`packages/persistencia/src/migrations/0001_init.sql` ou
`packages/contratos/openapi.yaml` antes de ser citado. Nenhum perfil,
`StructureDefinition` ou artefato FHIR concreto é declarado como existente.
Nenhum ADR foi promovido a `accepted`/`DECIDED` no front matter deste
arquivo. Nenhum dado real, CPF formatado ou PSR real aparece neste
documento.
