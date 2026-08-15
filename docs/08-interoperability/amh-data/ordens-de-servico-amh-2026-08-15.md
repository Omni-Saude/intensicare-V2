---
doc_id: AMH-ORDENS-DE-SERVICO-2026-08-15
status: PROPOSAL
owner: UNASSIGNED — VALIDATION REQUIRED
source: Resoluções AQ-1..AQ-6 de rodaquino-OMNI (CEO e acionista principal de OMNI e AMH), 2026-08-15, relatadas pelo orquestrador; autoridade AMH estabelecida em docs/00-governance/registers/g0-resolucoes-2026-08-15.md DEC-G0-04; evidência técnica em Omni-Saude/amh-data-platform @ 0a07a6f1fab36fb2f5eeee0fcd8e945c95f67116
date_collected: 2026-08-15
collector: arquiteto de compatibilidade AMH-dados
last_updated: 2026-08-15
---

# Ordens de serviço AMH — decorrentes das resoluções de 2026-08-15

Lista ordenada e completa do trabalho **do lado AMH** que as resoluções AQ-1..AQ-6 implicam. Cada item declara o que fazer, a evidência que o motiva (caminho@commit), o critério de aceitação, as dependências e qual bloqueador da V2 ele libera.

---

## 0. Autoridade, escopo e como ler este documento

### 0.1 Autoridade

**DECIDIDO** — as resoluções AQ-1..AQ-6 foram tomadas por **rodaquino-OMNI**, CEO e acionista principal da OMNI e da AMH, médico intensivista, em **2026-08-15**. A autoridade do lado AMH está registrada em `docs/00-governance/registers/g0-resolucoes-2026-08-15.md` **DEC-G0-04**:

> `rodaquino-OMNI assume AUTH-DATA-PLATFORM (lado V2) **e** declara deter a autoridade do lado AMH, na qualidade de CEO e acionista principal de ambas as empresas.`

Nenhum agente decidiu nada aqui. Este documento é trabalho de **escriba e derivação**: as decisões são DECIDIDAS pelo humano nomeado; as ordens de serviço abaixo são **PROPOSTAS** derivadas delas, sujeitas a aceitação de quem for designado dono de cada frente.

### 0.2 Lacuna de registro — a sinalizar ao steward de governança

**OBSERVADO em 2026-08-15:** o registro `g0-resolucoes-2026-08-15.md` contém as decisões **DEC-G0-01..DEC-G0-10** e registra, em DEC-G0-04, que as questões AQ-1..AQ-6 *"tornam-se respondíveis em sessão dedicada"*. **As resoluções AQ-1..AQ-6 em si não constam desse registro.**

**OBSERVADO — existe ata, e ela não é este documento.** O especialista de identidade lavrou as seis resoluções em [`identity-adjudication/adjudicacao-decisoes-2026-08-15.md`](./identity-adjudication/adjudicacao-decisoes-2026-08-15.md) (`doc_id: IDN-ADJ-2026-08-15`), que é a **ata de referência** das AQ-1..AQ-6. Em caso de divergência entre aquele documento e este, **a ata prevalece quanto ao teor das decisões**; este documento é derivação de engenharia a partir delas.

**VALIDAÇÃO NECESSÁRIA — duas pendências de forma, ambas registradas pela própria ata (§0.3):**

1. As seis resoluções **ainda não estão no `decision-register.md`** — verificado em 2026-08-15: uma busca por `AQ-` naquele registro não retorna entradas. A nota de integração 2 do `g0-resolucoes-2026-08-15.md` prevê a alocação de IDs `GDEC-nnnn` pelo steward de governança.
2. As decisões chegaram aos especialistas **por intermédio do orquestrador**, não diretamente do titular. A ata recomenda **contra-assinatura** do titular.

Até que ambas se resolvam, a V2 opera sob a ata — que é registro fiel do que foi transmitido, e não substitui a ratificação formal. **Isto deve estar fechado antes do G3.**

### 0.3 Escopo e limites

- Estas ordens descrevem trabalho **no repositório AMH**. A V2 **não escreve** no repositório AMH (política de zero escrita, DEC-G0-07). São propostas a serem executadas por quem a AMH designar.
- Nenhuma ordem abaixo autoriza *apply* de DDL, criação de segredo, concessão de acesso, backfill ou tráfego com dado real. Os pontos de parada humanos permanecem válidos.
- **DEC-G0-03** mantém o desenvolvimento **exclusivamente com dados sintéticos**. Nenhuma ordem aqui altera isso.

### 0.4 Disciplina epistêmica

Este documento distingue três origens de evidência, e a distinção é carregada em cada item:

| Rótulo | Significado neste documento |
|---|---|
| **OBSERVADO (dossiê)** | Lido diretamente por este especialista no commit pinado. Rastreável em [`claim-verification-matrix.md`](./claim-verification-matrix.md). |
| **FONTE (adjudicação)** | Lido pelo especialista de identidade, não por este. Rastreável em [`identity-adjudication/`](./identity-adjudication/). Fiel, porém de segunda mão. |
| **DECIDIDO** | Resolução do humano nomeado em 2026-08-15. |

Onde um item depende de arquivo que **este** especialista não leu (notadamente `Patient-amh-profile.json`, `bronze_to_fhir.py`, `ADR-006/039/043/045` e o desenho AMH-020b), o rótulo é **FONTE (adjudicação)** e não OBSERVADO. Isso não enfraquece o item; apenas mantém a cadeia de custódia honesta.

---

## 1. As seis resoluções, como recebidas

| # | Resolução | Efeito de fundo |
|---|---|---|
| **AQ-1 = C** | MPI **por tenant** (ADR-041 §6) + índice de correspondência cross-PJ **separado e governado** (ADR-043). **ADR-006 fica superado.** A linguagem "longitudinal cross-tenant" da IG é **defeito de documentação**. | Encerra a contradição de quatro vias sobre o significado de `amh-mpi-id`. |
| **AQ-2 = B** | `identifier:mpiId` é **autoritativo**; as *extensions* são **rebaixadas** de `1..1`. URL de profile **única** = `fhir.americashealth.com.br`; `amh.health/…/BR*` é **defeito do produtor**. **IG package 1.1.0** a publicar e pinar. | Torna a IG e o produtor consistentes entre si. |
| **AQ-3 = C** | Base legal do **loop clínico** = **tutela da saúde**, LGPD Art. 11, II, "f". **Sem gate de consentimento no loop clínico.** Usos secundários **bloqueados**. `ie_perm_sms_email` **jamais** como consentimento. **Ratificação jurídica antes de dado real.** | Substitui uma ausência por uma decisão declarada. |
| **AQ-4 = A plena** | `portable_subject_ref` (PSR) **obrigatório** como identificador de fronteira do contrato v1. PSR **nativo na V2 desde o dia um**, sintético em `dev`. **SP-1..SP-7** viram itens de trabalho ordenados. Parecer DPO/jurídico é a **única dependência externa**. Ref **independente de encontro**, sempre **qualificada por encontro**. | Dá à fronteira um identificador desenhado para ela. |
| **AQ-5 = A vinculante** | Eventos de **ciclo de vida de identidade** + `resolve(ref, as_of)` **obrigatórios** no contrato v1. **Sem eles o G3 não passa.** | Torna o replay determinístico possível. |
| **AQ-6 = A** | O *bypass* `cross_tenant_authorized` é **deriva documental — não existirá**. Enumeração autoritativa = **12 tenants** pós-ADR-041. CodeSystem/ValueSet e partições HAPI **a corrigir** na IG 1.1.0. | Fecha o modelo de isolamento. |

### 1.1 O que estas decisões mudam no achado de compatibilidade

**INFERÊNCIA.** As seis resoluções eliminam **as quatro contradições da camada 1** registradas no dossiê (C-1 vitais permanece à parte — ver §7.1) e dão **direção DECIDIDA** ao contrato v1. Elas **não** produzem evidência nas camadas 2, 3 e 4. O achado de `compatibility-finding.md` permanece: **candidato a integração; compatibilidade não demonstrada para avaliação de UTI acionável**. O que mudou é que o caminho deixou de estar bloqueado por indefinição e passou a estar bloqueado por **execução** — que é um estado muito melhor, e mensurável.

---

## 2. Ordem de execução e dependências

```
ONDA A — IG 1.1.0 (sem dependência externa)
  OS-01 ─┐
  OS-02 ─┤
  OS-03 ─┼─► OS-05 (publicar 1.1.0 + digest) ─► V2 pina
  OS-04 ─┘
  OS-06 (ADR-006 superado) — paralelo

ONDA B — produtor e servidor (depende de OS-05)
  OS-07 (URLs de profile) ─┐
  OS-08 (conformidade)  ───┼─► OS-09 (partições HAPI)
                           └─► habilita teste de conformidade V2

ONDA C — PSR / SP-1..SP-7
  OS-10 (SP-2 legal_entity) ─► OS-11 (SP-1 DDL) ─► OS-12 (SP-3 chave interop)
  OS-13 (SP-4 consent_decision_ref) ─► OS-14 (SP-7 tupla beneficiário)
  OS-15 (SP-5 backfill de mint)
  OS-16 (SP-6 parecer DPO/jurídico) ◄── ÚNICA DEPENDÊNCIA EXTERNA

ONDA D — contrato v1 (depende de ONDA C para o campo sujeito)
  OS-17 (eventos de ciclo de vida) ─┐
  OS-18 (resolve(ref, as_of))      ─┼─► OS-19 (pacote de contrato v1)
                                    └─► sem OS-17+OS-18, G3 NÃO PASSA

ONDA E — dados
  OS-20 (Observation via Diagnose/LIS estruturado)
  OS-21 (vocabulário de consent-scope) — DIFERIDO
```

**Caminho crítico:** ONDA A → ONDA B habilita testes de conformidade da V2. ONDA C → ONDA D habilita o contrato v1. **OS-16 (parecer jurídico) é a única dependência fora do controle de engenharia** e deve ser iniciada em paralelo à ONDA A, não ao final — é o item de maior prazo de espera e o único que nenhuma equipe técnica pode acelerar.

---

## 3. ONDA A — Implementation Guide 1.1.0

### OS-01 — Corrigir cardinalidades de identidade nos profiles (AQ-2)

**O quê.** Na IG, tornar `identifier:mpiId` o elemento autoritativo de identidade e **rebaixar as *extensions* de `1..1`**:

| Profile | Elemento | De | Para |
|---|---|---|---|
| `Patient-amh` | `identifier:mpiId` | `0..1` | `1..1` (autoritativo) |
| `Patient-amh` | `extension:mpiId` | `1..1` | `0..1` |
| `Observation-amh-laboratory` | `extension:mpiId` | `1..1` | `0..1` |
| `Observation-amh-laboratory` | `extension:tenantId` | `1..1` | `0..1` |

**Evidência.**
- **OBSERVADO (dossiê)** — `schemas/fhir-profiles/Observation-amh-laboratory-profile.json@0a07a6f1` : diferencial exige `extension:mpiId` `1..1` e `extension:tenantId` `1..1`.
- **FONTE (adjudicação)** — `schemas/fhir-profiles/Patient-amh-profile.json@0a07a6f1` : `extension:mpiId` `1..1`, `identifier:mpiId` `0..1` (AQ-2).
- **FONTE (adjudicação)** — `pipelines/batch/fhir/bronze_to_fhir.py@0a07a6f1` L425-426: `mpi_id` é emitido **apenas como `identifier`**; contagem da string `extension` no arquivo de 1.118 linhas retorna **0**.
- **FONTE (adjudicação)** — ADR-039 L65-67 já nomeia o *identifier* como sistema canônico.

**Critério de aceitação.**
1. Os quatro diferenciais refletem as cardinalidades acima.
2. Um recurso produzido hoje por `bronze_to_fhir.py` **valida** contra os profiles corrigidos (hoje não valida: exige *extensions* que o produtor nunca emite).
3. A IG declara explicitamente que `identifier:mpiId` é o elemento de identidade autoritativo para consumidores externos, e que a *extension*, quando presente, é redundante e nunca conflita.
4. Regra de desempate publicada para o caso de ambos presentes e divergentes — mesmo que a regra seja "divergência é erro de produção, recurso rejeitado".

**Dependências.** Nenhuma.

**Bloqueador V2 que libera.** AQ-2 integral. Desbloqueia toda a suíte de conformidade da V2 (§7.6 do prompt) e é pré-requisito de qualquer consumo de `Observation`.

---

### OS-02 — Remover a linguagem de MPI longitudinal cross-tenant da IG (AQ-1)

**O quê.** Corrigir na IG toda afirmação de que `amh-mpi-id` é chave longitudinal cross-tenant, substituindo-a pela semântica **por tenant** decidida em AQ-1=C, com menção ao índice de correspondência governado do ADR-043 como via **separada** — nunca como propriedade do campo.

**Evidência.**
- **OBSERVADO (dossiê)** — `schemas/fhir-profiles/README.md@0a07a6f1` L257: `├── extension amh-mpi-id: "7c9b3e84-..."        ← chave estável cross-tenant`; e a seção L240 `## Modelo de identidade longitudinal (MPI)`.
- **FONTE (adjudicação)** — mesmo arquivo, L171: `| amh-mpi-id | … | Chave MPI longitudinal cross-tenant |`.
- **OBSERVADO (dossiê)** — `architecture/adrs/ADR-041-grao-do-tenant-fonte-erp-compartilhada.md@0a07a6f1` L123: `### 6. O MPI **NÃO cruza tenants**`; L134: `cross-PJ — nem por bug, nem por permissão mal configurada.`
- **DECIDIDO** — AQ-1=C: a linguagem da IG é **defeito**, não uma quarta posição legítima.

**Critério de aceitação.**
1. Nenhuma ocorrência de "cross-tenant" como propriedade de `amh-mpi-id` permanece na IG.
2. O título da seção e o exemplo trabalhado refletem escopo por tenant.
3. A IG referencia ADR-041 §6 como decisão em vigor e ADR-043 como a via governada e separada.
4. Uma nota de errata registra que a redação anterior era defeito, para que consumidores que leram a 1.0.0 saibam que a mudança é correção e não mudança de rumo.

**Dependências.** Nenhuma. Deve sair na mesma versão de OS-01.

**Bloqueador V2 que libera.** AQ-1. Remove um dos quatro lados da contradição de identidade; junto de OS-06, encerra-a documentalmente.

---

### OS-03 — Corrigir o CodeSystem/ValueSet `amh-tenant` para os 12 tenants pós-ADR-041 (AQ-6)

**O quê.** Atualizar o CodeSystem e o ValueSet `amh-tenant` para a enumeração autoritativa de **12 tenants** do ADR-041, removendo `austa_clinicas` (aposentado como tenant de negócio) e `amh_landing` / zona de pouso (técnica, não de negócio). Atualizar o exemplo trabalhado da IG, que hoje usa justamente o tenant aposentado.

**Evidência.**
- **FONTE (adjudicação)** — `schemas/fhir-profiles/README.md@0a07a6f1` L204: `**amh-tenant:** 10 tenants AMH operacionais (austa_clinicas, omni, etc.)`; L258 usa `amh-tenant-id: "austa_clinicas"`; L213 registra `amh-tenant-id` como elemento codificado de *binding* `required`.
- **OBSERVADO (dossiê)** — `architecture/adrs/ADR-041…md@0a07a6f1` L29: `### 1. O grão é a **raiz de CNPJ** — 12 tenants`; L45: `**10 PJs clínicas**`; L70-74 descreve a zona de pouso como estágio técnico.
- **FONTE (adjudicação)** — ADR-041 L77-78 aposenta `austa_clinicas`; AMH-020b L194-198 torna a proibição invariante verificável (I-8).
- **DECIDIDO** — AQ-6=A: enumeração = 12 tenants pós-ADR-041.

**Critério de aceitação.**
1. O ValueSet enumera exatamente os 12 tenants de negócio do ADR-041, com raiz de CNPJ associada.
2. `austa_clinicas` e `amh_landing` **não** constam como valores válidos.
3. O exemplo trabalhado da IG usa um tenant válido.
4. O artefato é **legível por máquina** e citável por caminho@commit — a V2 precisa pinar a enumeração, não transcrevê-la.
5. Consta o que fazer com recursos históricos carimbados com o tenant aposentado (remapear, marcar, ou excluir) — a V2 precisa saber para não ler ausência como afirmação.

**Dependências.** Nenhuma. Interliga com OS-09 (partições HAPI devem refletir a mesma lista).

**Bloqueador V2 que libera.** AQ-6, parte 1. `amh-tenant-id` tem *binding* `required`: sem ValueSet correto, **nenhum recurso valida** e o escopo por tenant da V2 não tem fundamento.

---

### OS-04 — Remover da IG o texto do *bypass* `cross_tenant_authorized` (AQ-6)

**O quê.** Excluir da IG a descrição do *bypass* por claim `cross_tenant_authorized=true`, e declarar explicitamente que **não existe e não existirá** mecanismo de leitura cross-tenant no canal FHIR.

**Evidência.**
- **FONTE (adjudicação)** — `schemas/fhir-profiles/README.md@0a07a6f1` L279-280: `Exceção: tokens com claim cross_tenant_authorized=true … podem buscar cross-tenant — auditado em mpi.consent_log.`
- **OBSERVADO (dossiê)** — `applications/hapi-fhir/config/partitioning-config.md@0a07a6f1` L34-37 (`É por URL, sempre.`), L62-64 (nega quando token e URL divergem), L79-80 (`allow_references_across_partitions: false`) — o mecanismo descrito **não tem como expressar** o *bypass*.
- **FONTE (adjudicação)** — ADR-045 L82-84: `mpi.consent_log` tem **zero produtores** — a auditoria que o *bypass* invocava não tem dado.
- **DECIDIDO** — AQ-6=A: deriva documental; não existirá.

**Critério de aceitação.**
1. Nenhuma menção ao *bypass* permanece na IG.
2. A IG afirma positivamente o modelo: partição por URL + igualdade de claim, sem exceção.
3. A afirmação é **testável negativamente** — a V2 escreverá teste que assevera a impossibilidade do *bypass* (§7.4 do prompt), e precisa de uma declaração contra a qual testar.

**Dependências.** Nenhuma.

**Bloqueador V2 que libera.** AQ-6, parte 2. Fecha o modelo de ameaça e o desenho de isolamento da V2.

---

### OS-05 — Publicar o package IG **1.1.0** com digest citável

**O quê.** Empacotar, versionar e publicar `br.com.americashealth.fhir` **1.1.0** contendo OS-01..OS-04, com digest criptográfico do artefato publicado, seguindo o padrão de publicação que a AMH já exerceu no manifesto Maezo.

**Evidência.**
- **OBSERVADO (dossiê)** — `schemas/fhir-profiles/README.md@0a07a6f1` L8-11: package `br.com.americashealth.fhir`, **Versão 1.0.0**, FHIR R4 4.0.1, status `active`.
- **OBSERVADO (dossiê)** — `schemas/contracts/maezo/v1/contract-manifest.yaml@0a07a6f1`: padrão de publicação com commit produtor pinado, digests por artefato, fixtures válidas e inválidas, `compatibility_mode`, classificação de segurança, registro de aprovação e IDs de versão no registry.
- **DECIDIDO** — AQ-2=B: "IG package 1.1.0 a publicar e pinar".

**Critério de aceitação.**
1. Package `1.1.0` publicado, com **digest** do artefato (não apenas SHAs de blob por arquivo).
2. Notas de versão listam cada mudança de OS-01..OS-04 e classificam-na como **correção** ou **mudança incompatível**.
3. Política de compatibilidade declarada. **Atenção:** rebaixar `1..1` → `0..1` afrouxa e é compatível para trás; elevar `identifier:mpiId` `0..1` → `1..1` **aperta** e é **incompatível para trás** para qualquer produtor que hoje omita o identifier. Isso precisa estar dito, não descoberto.
4. O digest é citável por commit e pinável no `contracts.lock` da V2.
5. Fixtures sintéticas válidas **e deliberadamente inválidas** acompanham o package, no padrão Maezo (9 fixtures, 3 inválidas).

**Dependências.** OS-01, OS-02, OS-03, OS-04.

**Bloqueador V2 que libera.** É **o artefato que a V2 pina**. Sem ele, `contracts.lock` da V2 não sai de DRAFT — hoje o campo `fhir_package.package_digest` está `null` com status `VALIDATION_REQUIRED`.

---

### OS-06 — Registrar ADR-006 como superado (AQ-1)

**O quê.** Marcar `ADR-006` com status **Superseded**, nomeando ADR-041 §6 e ADR-043 como sucessores, com data e fundamentação. Verificar se `ADR-039` requer nota equivalente quanto à dívida de MPI/consentimento.

**Evidência.**
- **FONTE (adjudicação)** — `architecture/adrs/ADR-006-…md@0a07a6f1` L3 `Status: Accepted`, L14: `atribui um mpi_id único e estável a cada indivíduo, vinculando todos os seus registros cross-tenant.`
- **FONTE (adjudicação)** — o registro de contradição observa que **nenhum dos quatro artefatos está marcado como superado**, e que data posterior não é supersessão.
- **DECIDIDO** — AQ-1=C: ADR-006 fica superado.

**Critério de aceitação.**
1. `ADR-006` traz `Status: Superseded by ADR-041 §6 e ADR-043`, com data 2026-08-15 e autoridade nomeada.
2. ADR-041 e ADR-043 registram reciprocamente o que superam.
3. Uma varredura por ADRs que citam ADR-006 como vigente encontra zero pendências.
4. Regra de supersessão declarada — o que faria revisitar a decisão (por exemplo: parecer jurídico favorável ao índice cross-PJ, ADR-043 §OS-16).

**Dependências.** Nenhuma.

**Bloqueador V2 que libera.** AQ-1. Junto de OS-02, encerra a contradição de identidade de quatro vias.

---

## 4. ONDA B — produtor batch e servidor HAPI

### OS-07 — Corrigir as URLs de profile emitidas pelo produtor batch (AQ-2)

**O quê.** Em `bronze_to_fhir.py`, substituir as URLs `https://amh.health/fhir/StructureDefinition/BR*` pelas URLs canônicas da IG em `https://fhir.americashealth.com.br/StructureDefinition/…`, para os sete tipos afetados.

**Evidência.**
- **FONTE (adjudicação)** — `pipelines/batch/fhir/bronze_to_fhir.py@0a07a6f1` L97: `PATIENT_PROFILE` já usa a URL correta da IG; L319-325: os outros sete tipos são carimbados `https://amh.health/fhir/StructureDefinition/BR*`, incluindo `OBS_PROFILE = ".../BRObservation"`.
- **FONTE (adjudicação)** — ADR-039 L81-83 registra **exatamente esse padrão de URL como defeito já corrigido** no mapper Flink: `era amh.health/.../BRPatient — não batia com a IG → validação falharia`.
- **OBSERVADO (dossiê)** — `schemas/fhir-profiles/README.md@0a07a6f1` L8: URL canônica `https://fhir.americashealth.com.br/ImplementationGuide/amh`.
- **DECIDIDO** — AQ-2=B: URL única = `fhir.americashealth.com.br`; `amh.health/BR*` é defeito do produtor.

**Critério de aceitação.**
1. Todos os oito tipos emitem `meta.profile` com URL da IG publicada.
2. `BRObservation` — que **não é** profile presente na IG — deixa de ser emitido.
3. Teste automatizado assevera que nenhuma URL `amh.health` sobrevive na saída.
4. Declarado o que fazer com os recursos **já gravados** no HAPI com a URL errada: reprocessar, remapear ou marcar. **Este é o ponto mais caro da ordem** — o dossiê registra 11.451.908 recursos como alegação de FONTE (ADR-040 L58-59), e a decisão sobre o corpus histórico determina se a V2 pode consumir o acervo ou apenas o que for produzido a partir da correção.

**Dependências.** OS-05 (a IG precisa estar publicada para haver URL correta a citar).

**Bloqueador V2 que libera.** AQ-2. Sem isto, a suíte de conformidade da V2 valida contra profile inexistente e **falha por construção**.

---

### OS-08 — Conformar o produtor batch aos profiles corrigidos (AQ-2)

**O quê.** Garantir que a saída de `bronze_to_fhir.py` satisfaça os profiles da IG 1.1.0: `identifier:mpiId` presente e povoado em todo `Patient`; `amh-tenant-id` com valor do ValueSet corrigido; validação de conformidade executada, não presumida.

**Evidência.**
- **FONTE (adjudicação)** — `bronze_to_fhir.py@0a07a6f1` L425-426 emite `mpi_id` como identifier; nenhuma *extension* é emitida.
- **FONTE (adjudicação)** — ADR-039 L98-99: `estas correções são de contrato/código, provadas por leitura, não por execução` — precedente explícito de correção não verificada em execução.
- **OBSERVADO (dossiê)** — `applications/hapi-fhir/config/partitioning-config.md@0a07a6f1` L22-32 registra cinco chaves de configuração documentadas que o Spring **ignorava em silêncio**: neste repositório, configuração documentada já divergiu do comportamento implantado.

**Critério de aceitação.**
1. Uma amostra representativa da saída **valida** contra o package 1.1.0 usando um validador FHIR, com resultado registrado — não por leitura de código.
2. Taxa de povoamento de `identifier:mpiId` medida e publicada por tenant (não "está no código", e sim "está em N% das linhas").
3. Recursos que não validam vão para quarentena, não para o servidor.
4. O resultado da validação é citável como evidência de **camada 3** para a V2.

**Dependências.** OS-05, OS-07.

**Bloqueador V2 que libera.** AQ-2 e a primeira evidência real de **camada 3** (dado povoado) que o dossiê registra como inexistente.

---

### OS-09 — Atualizar a tabela de partições do HAPI pós-ADR-041 (AQ-6)

**O quê.** Atualizar `partitioning-config.md` para os 12 tenants do ADR-041 e **criar as partições correspondentes**, ou implementar o inicializador ausente, de modo que requisição a tenant válido não falhe.

**Evidência.**
- **OBSERVADO (dossiê)** — `applications/hapi-fhir/config/partitioning-config.md@0a07a6f1` L41-45: tabela lista apenas `tenant_austa_clinicas` e `tenant_omni_saude` como pré-criadas — contra os 12 tenants do ADR-041, e incluindo justamente o tenant aposentado.
- **OBSERVADO (dossiê)** — mesmo arquivo, L89-91: `## Bootstrap — PENDÊNCIA, não está implementado` / `**com.amh.fhir.bootstrap.PartitionInitializer** NÃO EXISTE.`; L99-105: `as partições não são criadas por este servidor` e requisição a tenant sem partição **falha**.
- **DECIDIDO** — AQ-6=A: partições HAPI a corrigir.

**Critério de aceitação.**
1. A tabela do documento reflete os 12 tenants do ADR-041, com nome de partição e raiz de CNPJ.
2. As partições **existem** no ambiente alvo — verificado por consulta, não por documento.
3. `austa_clinicas` tem destino declarado (migrada, aposentada ou mantida como histórico somente-leitura).
4. Requisição a `/fhir/<tenant>/…` para cada um dos 12 tenants não falha por partição ausente.
5. Ou o `PartitionInitializer` passa a existir, ou o procedimento manual de *onboarding* de tenant está escrito e foi executado.

**Dependências.** OS-03 (mesma lista de tenants em ambos os artefatos).

**Bloqueador V2 que libera.** AQ-6 e a primeira evidência de **camada 2** (capacidade implantada) — hoje inexistente no dossiê.

---

## 5. ONDA C — `portable_subject_ref`: SP-1..SP-7

**Contexto.** **DECIDIDO (AQ-4 = A plena):** o PSR é **obrigatório** como identificador de fronteira do contrato v1, é **nativo na V2 desde o dia um** (sintético em `dev`), é **independente de encontro** porém **sempre qualificado por encontro**, e os sete pontos de parada humanos deixam de ser bloqueios indefinidos e passam a ser **itens de trabalho ordenados**.

**FONTE (adjudicação)** — `docs/plans/amh-020b-portable-subject-ref-design-2026-08-04.md@0a07a6f1` L450-453: `**Aplicar qualquer DDL deste design = gate humano DPO/Legal … Este documento e os DDLs versionados NÃO autorizam apply, grant, criação de segredo, backfill nem tráfego.**` — a decisão AQ-4 **ordena e prioriza** os pontos de parada; **não** os dispensa. O *gate* humano permanece; ganha dono, ordem e prazo.

---

### OS-10 — SP-2: tabela `tenant → legal_entity`, incluindo a raiz de CNPJ da `omni`

**O quê.** Produzir a tabela autoritativa `tenant → legal_entity` para os 12 tenants, resolvendo a lacuna registrada: a raiz de CNPJ da operadora `omni` **não consta** do tfvars.

**Evidência.** **FONTE (adjudicação)** — AMH-020b L176 registra a raiz de CNPJ da `omni` como `**NÃO CONSTA no tfvars — exige owner**`. **OBSERVADO (dossiê)** — ADR-041 L29 fixa o grão em raiz de CNPJ; L39 registra 35 raízes de CNPJ entre 49 estabelecimentos.

**Critério de aceitação.** Tabela legível por máquina, com as 12 entradas, cada uma com raiz de CNPJ verificada contra fonte cadastral; a entrada da `omni` preenchida por decisão de *owner* nomeado; consistência com o ValueSet de OS-03 verificada por teste.

**Dependências.** OS-03 (mesma enumeração).

**Bloqueador V2 que libera.** SP-2. É **pré-requisito de todo o restante da ONDA C** — o PSR é escopado por `{amh_tenant, legal_entity}` e não pode ser mintado sem esta tabela.

---

### OS-11 — SP-1: *apply* do DDL e colocação física

**O quê.** Aplicar o DDL do PSR e decidir a colocação física do armazenamento de mapeamento.

**Evidência.** **FONTE (adjudicação)** — AMH-020b L500-506 (SP-1); L450-453 (o *gate* humano).

**Critério de aceitação.** DDL aplicado em `dev` com dado **sintético**; colocação física decidida e registrada; segregação de acesso ao mapeamento declarada (quem lê o par `ref ↔ identidade` e sob qual registro de auditoria); nenhum dado real envolvido, conforme DEC-G0-03.

**Dependências.** OS-10 (SP-2); **OS-16 (parecer DPO/jurídico) antes de qualquer dado real** — em `dev` sintético pode preceder.

**Bloqueador V2 que libera.** SP-1. Habilita a V2 a exercitar o formato `amh:psr:v1:*` contra dado sintético.

---

### OS-12 — SP-3: chave de interoperabilidade

**O quê.** Definir e provisionar a chave de interoperabilidade que sustenta o *minting* do PSR.

**Evidência.** **FONTE (adjudicação)** — AMH-020b L500-506 (SP-3).

**Critério de aceitação.** Chave definida com custódia, rotação e escopo declarados; procedimento de rotação **testado**, não apenas escrito; nenhum material de chave em repositório ou documento — inclusive este.

**Dependências.** OS-11 (SP-1).

**Bloqueador V2 que libera.** SP-3. Sem ela o PSR não é estável nem verificável.

---

### OS-13 — SP-4: forma do `consent_decision_ref`

**O quê.** Definir a forma do `consent_decision_ref` **à luz de AQ-3=C**, em que o loop clínico opera sob tutela da saúde e **não** sob gate de consentimento.

**Evidência.** **FONTE (adjudicação)** — AMH-020b L500-506 (SP-4); ADR-045 L82-84 (`mpi.consent_log` com zero produtores); ADR-045 L106-110 (vocabulário de `scope` partido em dois). **DECIDIDO** — AQ-3=C.

**Critério de aceitação.**
1. Declarado o que o campo carrega **quando a base legal é tutela da saúde e não há decisão de consentimento** — nulo, um marcador de base legal, ou ausente do contrato v1.
2. O campo **jamais** deriva de `ie_perm_sms_email` nem de qualquer campo de permissão de contato — invariante verificável em teste.
3. Se o campo permanecer no contrato v1, sua semântica é declarada de forma que não sugira um gate que não existe.

**Dependências.** OS-16 (o parecer jurídico confirma a base legal); pode ser desenhado antes, ratificado depois, conforme DEC-G0-03.

**Bloqueador V2 que libera.** SP-4 e a seção de privacidade do contrato v1.

---

### OS-14 — SP-7: tupla de chave do beneficiário

**O quê.** Definir a tupla de chave do beneficiário.

**Evidência.** **FONTE (adjudicação)** — AMH-020b L500-506 (SP-7); L91-99 escopa o ref a `{amh_tenant, legal_entity}`.

**Critério de aceitação.** Tupla definida e sua relação com o PSR clínico declarada; explicitado se o contrato IntensiCare v1 **precisa** dela (o loop de UTI é clínico, não de plano — pode não precisar, e dizer isso é um resultado válido e barato).

**Dependências.** OS-10 (SP-2).

**Bloqueador V2 que libera.** SP-7. Provavelmente **fora** do contrato IntensiCare v1 — confirmar e registrar reduz escopo.

---

### OS-15 — SP-5: backfill de *minting*

**O quê.** Executar o *backfill* de *minting* de PSR para o acervo existente.

**Evidência.** **FONTE (adjudicação)** — AMH-020b L500-506 (SP-5); L339-342: a ref `**nunca morre e nunca é re-mintada**`.

**Critério de aceitação.** *Backfill* executado com contagem medida por tenant; invariante de não-reuso verificada; **em `dev` com dado sintético** enquanto DEC-G0-03 vigorar; procedimento de reexecução idempotente comprovado.

**Dependências.** OS-11, OS-12; **OS-16 antes de qualquer execução sobre dado real**.

**Bloqueador V2 que libera.** SP-5. Determina se a V2 vê PSR em todo o acervo ou apenas nos recursos novos — o que muda o desenho da camada anticorrupção.

---

### OS-16 — SP-6: parecer DPO/jurídico ⚠️ **ÚNICA DEPENDÊNCIA EXTERNA**

**O quê.** Obter o parecer jurídico brasileiro que o ADR-043 exige antes do primeiro *apply*, cobrindo: (a) o índice de correspondência cross-PJ do ADR-043; (b) a base legal de **tutela da saúde**, LGPD Art. 11, II, "f", decidida em AQ-3=C, para o loop clínico; (c) o bloqueio de usos secundários; (d) a confirmação de que `ie_perm_sms_email` não é consentimento.

**Evidência.**
- **FONTE (adjudicação)** — `ADR-043@0a07a6f1` L5-6: `O parecer do DPO/jurídico deve ser anexado a este ADR antes do primeiro apply`.
- **FONTE (adjudicação)** — ADR-045 L99-104: `usá-lo como consentimento LGPD seria fabricar base legal`.
- **DECIDIDO** — AQ-3=C (base legal) e DEC-G0-03: *"parecer jurídico brasileiro antes de qualquer teste de conformidade com dados reais, operação sombra ou piloto (G6/G8)"*; agentes redigem material jurídico **apenas como sugestão**.

**Critério de aceitação.**
1. Parecer emitido por advogado(a) qualificado(a), anexado ao ADR-043, com escopo e data.
2. Cobre os quatro pontos acima, cada um com posição explícita.
3. Declara o que **não** cobre.
4. Registra sob quais condições a posição mudaria.

**Dependências.** **Nenhuma técnica — e é exatamente por isso que deve começar já.** Este é o item de maior prazo de espera de todo o pacote e o único que nenhuma equipe de engenharia pode acelerar.

**Bloqueador V2 que libera.** SP-6; o *gate* de dado real de DEC-G0-03; e o G6/G8. **Nada com dado real acontece sem ele** — nem *backfill*, nem operação sombra, nem piloto.

> **Nota de conformidade.** Agentes (inclusive este) **não** produzem parecer jurídico. Este item registra a necessidade, o escopo e a dependência. A redação é sugestão; a ratificação é de advogados da organização, conforme DEC-G0-03.

---

## 6. ONDA D — contrato AMH×IntensiCare v1

### OS-17 — Expor eventos de ciclo de vida de identidade (AQ-5, **vinculante**)

**O quê.** Publicar a consumidores os eventos de **alias, merge, unmerge/split, restore, reassignment e erasure**. A semântica interna **já está especificada** no desenho AMH-020b: esta ordem é de **exposição, não de invenção**.

**Evidência.**
- **FONTE (adjudicação)** — AMH-020b L372-374: `Notificar o Maezo de aliasing … é decisão de contrato do AMH-030 — **não** é requisito deste design`. A notificação a consumidor foi explicitamente deixada fora; AQ-5 a traz para dentro.
- **FONTE (adjudicação)** — a semântica que a V2 precisa espelhar já existe: L339-342 (ref nunca morre, nunca é re-mintada; consumidor nunca quebra), L388-392 (*split*: histórico não é reescrito), L393-396 (*restore*: revogação é carimbada, não apagada), L118-122 (*erasure*: `status=retired`, ref nunca deletada nem reutilizável).
- **DECIDIDO** — AQ-5=A vinculante: **sem eventos, o G3 não passa.**

**Critério de aceitação.**
1. Os seis tipos de evento são publicados, cada um com: ID de evento, chave de idempotência, tenant/entidade legal, ref opaca antiga e nova, tempo do fato, tempo de emissão, tipo e versão, e vínculo de correção/supersessão.
2. Semântica de ordenação e de entrega declarada (pelo menos uma vez / exatamente uma vez).
3. Latência declarada e **medida**.
4. Fixtures sintéticas para os seis tipos, incluindo casos inválidos.
5. Teste de replay demonstra que um consumidor que processa os eventos reconstrói a visão histórica correta.

**Dependências.** ONDA C (o PSR precisa existir para que haja ref sobre a qual emitir evento).

**Bloqueador V2 que libera.** AQ-5, metade. **Condição declarada de passagem do G3.** Sem isto, um *merge* é reescrita silenciosa de história clínica na V2.

---

### OS-18 — Expor `resolve(ref, as_of)` — resolução ponto-no-tempo (AQ-5, **vinculante**)

**O quê.** Expor resolução de ref **ponto-no-tempo**: `resolve(ref, as_of)` deve responder *"a que isto se referia naquele instante"*, não apenas *"a que se refere agora"*.

**Evidência.**
- **FONTE (adjudicação)** — a opção B de AQ-5 é explícita: uma consulta que só responde "agora" **não sustenta replay**, e a V2 teria de tratar toda avaliação histórica como potencialmente mal atribuída.
- **FONTE (adjudicação)** — AMH-020b L339-342 garante que toda ref já vista continua resolvendo `para sempre` — a base de que `as_of` precisa.
- **DECIDIDO** — AQ-5=A vinculante.

**Critério de aceitação.**
1. A operação aceita `as_of` e retorna a resolução vigente naquele instante.
2. Devolve **também** a cadeia de alias aplicável, para que o consumidor saiba que houve transição.
3. Semântica declarada para `as_of` anterior ao *minting* da ref, e para ref `retired`.
4. Comportamento *fail-closed*: ref desconhecida ou `as_of` fora de janela **nega**, não adivinha.
5. Latência e limites de uso declarados.

**Dependências.** ONDA C; complementa OS-17 (eventos empurram, `resolve` puxa; o G3 exige os dois).

**Bloqueador V2 que libera.** AQ-5, outra metade. Sustenta o replay determinístico da V2.

---

### OS-19 — Criar o pacote de contrato AMH×IntensiCare v1

**O quê.** Criar, no repositório AMH, o pacote de contrato para IntensiCare — caminho proposto `schemas/contracts/intensicare/v1/contract-manifest.yaml` — no padrão do manifesto Maezo, **sem reusar tópicos, payloads ou o envelope de 28 campos do Maezo**.

**Evidência.**
- **OBSERVADO (dossiê)** — `schemas/contracts/@0a07a6f1` contém exatamente `maezo/` e `source-authority/`; **não existe** `intensicare/`. Verificado por enumeração da árvore (3.685 entradas).
- **OBSERVADO (dossiê)** — `schemas/contracts/maezo/v1/contract-manifest.yaml@0a07a6f1`: `AMH-owned — edição SOMENTE em Omni-Saude/amh-data-platform (XRD-04)` — o contrato é de propriedade AMH; a V2 propõe, não coloca.
- **DECIDIDO** — AQ-4 (campo sujeito = PSR), AQ-5 (cláusula de eventos obrigatória), AQ-3 (modelo de finalidade).

**Critério de aceitação.**
1. Manifesto criado com: commit produtor AMH, commit consumidor V2, versões semânticas, digests, donos produtor/consumidor, *steward* de dado clínico, classificação de segurança, registro de aprovação, política de compatibilidade, janela de depreciação, rota de notificação de mudança, fixtures válidas e inválidas, tenants e ambientes suportados, SLOs de disponibilidade e frescor, e **exclusões explícitas**.
2. Campo sujeito = **PSR** (AQ-4).
3. Cláusula **obrigatória** de eventos de ciclo de vida de identidade + `resolve(ref, as_of)` (AQ-5).
4. Modelo de finalidade conforme AQ-3=C: tutela da saúde no loop clínico, usos secundários bloqueados.
5. **Exclusões explícitas** listam, no mínimo: sinais vitais e `Observation` laboratorial, enquanto não houver evidência aceita.
6. Dono AMH nomeado.

**Dependências.** OS-05 (package a citar), ONDA C (PSR), OS-17, OS-18.

**Bloqueador V2 que libera.** O pacote de contrato inteiro. É o artefato central do §7.5 do prompt e do G3.

---

## 7. ONDA E — dados

### OS-20 — Popular `Observation` pelo caminho **estruturado** Diagnose/LIS

**O quê.** Financiar e executar a ingestão da fonte **estruturada** Diagnose/LIS (`exame_resultado`), que produz analito/valor/unidade, **em vez** do caminho de texto livre via Tasy `PACIENTE_EXAME`.

**Evidência — e este é um achado do dossiê que a decisão precisa incorporar.**
- **OBSERVADO (dossiê)** — `docs/reference/fhir-observation-source-request.md@0a07a6f1` L45-54: o plano de desbloqueio de registro emite `Observation.code = {text: "Resultado de exame"}` e `Observation.valueString = ds_resultado`.
- **OBSERVADO (dossiê)** — `schemas/fhir-profiles/Observation-amh-laboratory-profile.json@0a07a6f1`: `code` vinculado ao ValueSet `amh-loinc-laboratory`; `valueQuantity.system` fixado em `http://unitsofmeasure.org`.
- **INFERÊNCIA (contradição C-4 do dossiê):** **o plano de desbloqueio de registro produz recurso que NÃO conforma ao profile da própria IG.** Texto livre em `code.text` com carga em `valueString` não é quantidade UCUM com código LOINC. **Nenhuma regra de escore de UTI — NEWS2, MEWS, SOFA, qSOFA, qualquer limiar numérico — consome uma string.**
- **OBSERVADO (dossiê)** — o mesmo documento, L64-69, nomeia a via conforme: Diagnose/LIS estruturado dá `analito/valor/unidade`, permitindo `valueQuantity` com LOINC — e a classifica como `Maior esforço; recomendada para a fase de resultados laboratoriais estruturados`.
- **OBSERVADO (dossiê)** — a IG já mapeia seu único profile de Observation para `bronze_diagnose.diagnose_exame_resultado` — isto é, **a fonte declarada pela própria IG é justamente a que não é ingerida**.

**Critério de aceitação.**
1. Decisão registrada de financiar o caminho **estruturado**; se o caminho de texto livre for executado por motivo de prazo, ele é **explicitamente excluído** do contrato IntensiCare v1 e não conta como desbloqueio.
2. `Observation` produzida **valida** contra o profile 1.1.0: `code` do ValueSet LOINC, `valueQuantity` com UCUM.
3. Cobertura de código LOINC medida e publicada — não "há catálogo", e sim "N% dos resultados têm LOINC".
4. Povoamento medido por tenant, com distribuição de nulos.
5. Vínculo com `Encounter` medido — o profile deixa `encounter` **opcional**, logo o vínculo é questão de dado, não de conformidade.

**Dependências.** OS-05, OS-08.

**Bloqueador V2 que libera.** Metade da restrição dura de portfólio (`compatibility-finding.md` §3). A outra metade — sinais vitais — **permanece aberta** (§7.1 abaixo).

---

### OS-21 — Unificar o vocabulário de `consent-scope` — **DIFERIDO**

**O quê.** Unificar os dois vocabulários de `scope` divergentes. **Diferido por decisão** até que usos secundários sejam desbloqueados.

**Evidência.** **FONTE (adjudicação)** — ADR-045 L106-110: o DDL usa `analytics | research | sharing_amh_internal | external_sharing`; o gate dos agentes usa `treatment | research | billing | ml_training | operational_analytics`. **DECIDIDO** — AQ-3=C: sem gate de consentimento no loop clínico; usos secundários bloqueados.

**Critério de aceitação (quando reativado).** Vocabulário único publicado como CodeSystem/ValueSet; mapeamento dos dois vocabulários legados; nenhum consumidor dependendo de vocabulário não publicado.

**Dependências.** Reativação depende do desbloqueio de usos secundários, que depende de OS-16.

**Bloqueador V2 que libera.** Nenhum no contrato v1 — **é exatamente por isso que pode ser diferido**. Registrado para não ser perdido.

---

## 8. Matriz ordem de serviço → bloqueador V2

| OS | Onda | Resolve | Libera na V2 | Dependência externa |
|---|---|---|---|---|
| OS-01 | A | AQ-2 | Conformidade de profile; consumo de `Observation` | — |
| OS-02 | A | AQ-1 | Contradição de identidade (lado IG) | — |
| OS-03 | A | AQ-6 | Escopo por tenant (*binding* `required`) | — |
| OS-04 | A | AQ-6 | Modelo de ameaça e isolamento | — |
| OS-05 | A | AQ-2 | **Pin do `contracts.lock`** | — |
| OS-06 | A | AQ-1 | Contradição de identidade (lado ADR) | — |
| OS-07 | B | AQ-2 | Suíte de conformidade da V2 | — |
| OS-08 | B | AQ-2 | Primeira evidência de **camada 3** | — |
| OS-09 | B | AQ-6 | Primeira evidência de **camada 2** | — |
| OS-10 | C | AQ-4 (SP-2) | Pré-requisito de toda a ONDA C | *owner* cadastral |
| OS-11 | C | AQ-4 (SP-1) | PSR exercitável em `dev` | OS-16 p/ dado real |
| OS-12 | C | AQ-4 (SP-3) | Estabilidade do PSR | — |
| OS-13 | C | AQ-4 (SP-4) | Seção de privacidade do contrato | OS-16 |
| OS-14 | C | AQ-4 (SP-7) | Escopo do contrato v1 | — |
| OS-15 | C | AQ-4 (SP-5) | Cobertura de PSR no acervo | OS-16 p/ dado real |
| **OS-16** | **C** | **AQ-3 / AQ-4 (SP-6)** | **Todo trabalho com dado real; G6/G8** | ⚠️ **jurídico** |
| OS-17 | D | AQ-5 | **Condição de passagem do G3** | — |
| OS-18 | D | AQ-5 | Replay determinístico | — |
| OS-19 | D | AQ-3/4/5 | Pacote de contrato v1 | — |
| OS-20 | E | — | Metade da restrição de portfólio | — |
| OS-21 | E | AQ-3 | Nada no v1 (diferido) | OS-16 |

---

## 9. O que estas ordens **não** cobrem

Registrado para que a ausência não seja lida como afirmação — o defeito que a própria varredura da Gold descreve.

### 9.1 Sinais vitais (contradição C-1) — **permanece aberta**

As seis resoluções tratam de identidade, tenancy, consentimento e contrato. **Não decidem C-1.** O dossiê registra ambos os lados: os diagramas afirmam `Observation` para sinais vitais e ingresso de dispositivos IoT; a IG tem **um único** profile de Observation, com `category` fixada por padrão em `laboratory` — o que **exclui estruturalmente** sinais vitais de instância conforme.

**Consequência.** Mesmo com todas as 21 ordens executadas, **a V2 continua sem sinais vitais da AMH**. Sinais vitais exigiriam **novo profile** — autorado, publicado, versionado e povoado — mais uma fonte demonstradamente povoada. Isso não é ordem de serviço derivável destas decisões; é **nova decisão de produto**, e é a **Q1** de [`open-questions-for-amh-owners.md`](./open-questions-for-amh-owners.md), que permanece a pergunta de maior valor do dossiê.

### 9.2 Ambientes (Q6) — permanece aberta

**FONTE (dossiê)** — apenas `dev` está provisionado; `stg`, `prod` e `dr` não existem. O G3 exige testes em ambiente **similar a produção**. Nenhuma ordem acima cria ambiente; OS-09 opera no que existe. Enquanto isso não mudar, **a condição de ambiente do G3 não pode ser satisfeita por ninguém** — decisão de orçamento, registrada no README da AMH como `Negócio / orçamento`.

### 9.3 Camada 4 (aptidão operacional) — intocada

Nenhuma ordem mede latência ponta a ponta, completude, ordenação, disponibilidade, replay ou recuperação do canal FHIR. ADR-040 declara o canal `não é near-real-time`; a distribuição real de frescor segue **não medida**.

### 9.4 Corpus histórico

OS-07 levanta a questão dos recursos já gravados com URL de profile incorreta, mas **a decisão sobre o acervo é da AMH**. Ela determina se a V2 consome os 11,4 milhões de recursos alegados ou apenas o que for produzido após a correção — diferença material para *backfill*, desfechos e reconciliação.

---

## 10. Estado após execução integral

**INFERÊNCIA.** Se as 21 ordens forem concluídas e aceitas:

| Camada de evidência | Antes (2026-08-14) | Depois das 21 ordens |
|---|---|---|
| 1 — Contrato declarado | Estabelecida, **4 contradições** | Estabelecida, **C-1 permanece**; C-2/C-3/C-4 encerradas |
| 2 — Capacidade implantada | **Sem evidência** | Parcial em `dev` (OS-09) |
| 3 — Dado povoado | **Sem evidência observada** | Parcial e **medida** (OS-08, OS-20) |
| 4 — Aptidão operacional | **Sem evidência** | **Ainda sem evidência** |

**O achado de compatibilidade não muda para "compatível".** Muda de *"bloqueado por indefinição"* para *"bloqueado por execução e por ambiente"*. O relatório permanente segue sendo `candidato a integração`, e a avaliação clínica permanece **não acionante** até o G3.

---

## 11. Ordens de serviço comissionadas em 2026-08-15 (GDEC-0008)

As três ordens abaixo foram **comissionadas** pelo titular (rodaquino-OMNI) em sessão
de 2026-08-15, registradas em
`docs/00-governance/registers/decision-register.md` **GDEC-0008** — OS-22 pelo item 2
("primeira pergunta da sessão: existe tabela de vitais do Tasy já no Bronze?"); OS-23 e
OS-24 pelo item 6 ("Abrir AGORA as novas OS/perguntas Q11+ ao lado AMH para
`MedicationAdministration` (BLK-0012) e contrato de ordem clínica (BLK-0016)"). Mesma
disciplina epistêmica de §0.4 acima: **DECIDIDO** refere-se exclusivamente à decisão do
titular de comissionar o trabalho; o conteúdo técnico de cada ordem é **PROPOSAL**, a
executar e aceitar por quem o lado AMH designar. Nenhum agente decidiu nada aqui.

Owner de todas as três: **lado AMH — rodaquino-OMNI (autoridade AMH, DEC-G0-04)**.
Status: **ABERTA**.

---

### OS-22 — Sonda: tabela de vitais do Tasy já povoada no Bronze? (GDEC-0008 item 2 — ordem de execução zero)

**O quê.** Verificar, no lago Bronze da AMH, se já existe uma tabela de origem Tasy com
sinais vitais estruturados (não `EVOLUCAO_PACIENTE`/texto livre — ver
`vital-signs-decision/pacote-decisao-c1-sinais-vitais.md` §2.4, E-5) já ingerida e
povoada, ainda que não mapeada para FHIR. Esta é a **primeira** pergunta a responder da
sessão de decisão de C-1 e a **ordem de execução zero**: seu resultado dispara,
**automaticamente e sem novo ciclo de decisão**, a re-ponderação de C-1 para O1-first
(GDEC-0008 item 2; gatilho S-1 do pacote de decisão, §7).

**Evidência que motiva a sonda.** OBSERVADO (dossiê) —
`vital-signs-decision/pacote-decisao-c1-sinais-vitais.md` §2.6 e §5.3: busca por código
e por caminho no commit pinado `0a07a6f1` não encontrou nenhuma fonte de vitais
nomeada (`sinais_vitais`, `saturacao`, `frequencia_cardiaca`, `pressao_arterial`,
`vital_signs` → 0 resultados cada). **O repositório não nomeia a fonte — o titular pode
saber o que há no lago que o repositório não documenta** (§5.3: *"o repositório não a
nomeia, mas o titular sabe o que há no lago"*).

**Deliverable — exatamente o que a sonda precisa responder:**
1. **Nome(s) da(s) tabela(s)** no Bronze (schema.tabela), se existir(em) mais de uma
   fonte candidata (por exemplo, monitor multiparamétrico, prontuário estruturado,
   registro de enfermagem).
2. **Contagem de linhas** por tabela e, se possível, por tenant.
3. **Inventário de colunas e unidades**: quais parâmetros (FR, SpO2, PAS/PAD, FC,
   temperatura, outros) têm coluna própria estruturada (não texto livre), e em qual
   unidade bruta a fonte grava o valor — necessário para avaliar conformidade UCUM
   antes de qualquer mapeamento.
4. **Cobertura de datas**: janela temporal coberta (`data mínima` – `data máxima`), e se
   a ingestão está corrente ou parada (equivalente ao que o caminho laboratorial já
   registra como "aguardando ingestão desde 2026-07-24").
5. **Declaração negativa explícita**, se aplicável: se nenhuma tabela existir, dizer
   isso é uma resposta válida e encerra a sonda sem acionar a re-ponderação.

**Critério de aceitação.**
1. Resposta às cinco perguntas do deliverable, citável por caminho/tabela — não por
   memória ou afirmação sem fonte.
2. Se **positiva**: a resposta é suficiente, por si, para a V2 tratar C-1 como
   re-ponderada para O1-first (GDEC-0008 item 2) — nenhuma nova sessão de decisão é
   necessária; o pacote de decisão C-1 é atualizado por escriba na sequência
   (`vital-signs-decision/`, gatilho S-1).
3. Se **negativa**: registrada como tal, sem re-ponderação; C-1 permanece em O3 híbrido
   como decidido.
4. Nenhum dado de paciente é lido ou citado nesta sonda — apenas metadados de schema
   (nomes de tabela/coluna, contagens, cobertura de datas). Nenhum dado real é
   necessário para responder às cinco perguntas.

**Dependências.** Nenhuma técnica — é por isso que é a ordem de execução zero.

**Bloqueador V2 que libera.** Nenhum `BLK-*` diretamente; determina a via de C-1
(O1-first vs. O3 híbrido como decidido) sem exigir novo ciclo de decisão do titular.

---

### OS-23 — Profile `MedicationAdministration` + fonte povoada para infusão vasoativa e sedativa (BLK-0012)

**O quê.** Autorar, publicar (na IG, junto de uma futura versão) e identificar/ingerir a
fonte povoada de um profile FHIR `MedicationAdministration` cobrindo (a) infusão de
agente vasoativo — identidade do agente, **taxa de dose titulada** em µg/kg/min,
horário de início e término, via de administração; e (b) infusão sedativa — contexto de
exposição (agente, início/término, status ativo/inativo) suficiente para o **gate de
sedação** de GCS e SOFA.

**Por que agora (consumidores nomeados, não genéricos).**
- **RULE-SOFA-0100 §4.4** (Cardiovascular/SOFA-CV): insumo #9, "taxa de dose do
  vasoativo" — hoje **sem profile `MedicationAdministration` na IG** (E-3 do pacote de
  decisão C-1); a componente CV do SOFA fica no piso de presença do agente, nunca no
  tier titulado, sem esta classe.
- **ADR-0028** (política de confundimento sedação/avaliação neurológica): a política
  fail-closed de RASS/GCS — "RASS ≤−3 com sedação ativa OU desconhecida →
  confundido/não avaliado" (GDEC-0007, prioridade 1) — exige **saber se há exposição
  sedativa ativa**. Sem esta classe, o estado de exposição sedativa é sempre
  **desconhecido**, e a política fail-closed do próprio ADR-0028 força o resultado a
  confundido/não avaliado mesmo quando RASS foi medido e é ≥ −2 — o gate nunca abre.
- **BLK-0012** (`docs/00-governance/registers/blockers-register.md`): sete candidatos do
  portfólio (SOFA, sepse, estabilidade hemodinâmica, sedação, profilaxia,
  antimicrobiano, delirium) e a **RULE-GCS inteira** (via GCS-07, gate sedativo
  fail-closed) permanecem bloqueados por esta lacuna de classe, independentemente de
  qualquer decisão de C-1.

**Deliverable.**
1. `StructureDefinition` de `MedicationAdministration` (ou dois profiles, se a AMH
   preferir separar vasoativo de sedativo), com `medication` vinculado a ATC/RxNorm
   candidatos já citados em `rule-releases/sofa/specification.md` (C01CA03, C01CA24,
   C01CA04, C01CA07 e sinônimos), `dosage.rateQuantity` em µg/kg/min (ou taxa bruta +
   peso separado, com política de conversão declarada), `effectivePeriod` (início/fim),
   e `route` (via de administração).
2. Fonte de origem identificada (tabela Tasy ou outra) que carregue taxa **titulada**,
   não apenas prescrição/dispensação (`MedicationRequest`/`MedicationDispense` já
   existem e **não bastam** — dispensação ≠ administração titulada, per
   `impacto-no-portfolio.md` §1, classe D).
3. Ingestão no Bronze, mapeador no produtor de registro, e povoamento **medido** por
   tenant — mesmo padrão de honestidade de medição exigido pela OS-08 (não "está no
   código", e sim "está em N% das linhas").

**Critério de aceitação.**
1. Profile publica `dosage.rateQuantity` com UCUM e vínculo de código ao vocabulário
   ATC/RxNorm pinado (dono do pino: arquiteto de terminologia, fora desta ordem).
2. Amostra representativa da saída valida contra o profile, com resultado registrado —
   não por leitura de código (mesmo padrão da OS-08 crit. 1).
3. Declarado explicitamente se a fonte cobre infusão vasoativa, sedativa, ou ambas —
   parcial é uma resposta válida, desde que seja **dita**, não descoberta.
4. Condição de aceitação escrita **antes** de qualquer entrega: taxa chega como
   `valueQuantity`/`rateQuantity` com UCUM e código do vocabulário pinado, ou não conta
   como desbloqueio — mesma mitigação já registrada para C-1 (QD-11, "repetir a C-4 com
   outra roupa").

**Dependências.** Nenhuma técnica externa a este item; independe de C-1 e de OS-22.

**Bloqueador V2 que libera.** `BLK-0012` — parcial ou integralmente, conforme cobertura
declarada no critério de aceitação item 3.

---

### OS-24 — Contrato de ordem clínica (não-`Observation`) — primeiros consumidores: escala SpO2 e limitação terapêutica (BLK-0016)

**O quê.** Definir, do lado AMH, um contrato de **ordem/flag clínico atribuível** —
distinto de `Observation` — para contexto clínico que não é uma medida, mas uma decisão
de cuidado registrada com autor, horário e indicação. Nenhuma correção de profile
`Observation`, sob qualquer leitura de C-1 (escopo estreito ou amplo), alcança esta
classe.

**Primeiros consumidores nomeados (não genéricos).**
1. **Atribuição de escala-alvo de SpO2 (NEWS2 Scale-2)** — `RULE-NEWS2 §3.2` ("Governed
   input"): a linha G da tabela de insumos do NEWS2 já declara explicitamente que este é
   "**um recurso de ordem/flag, não uma `Observation`**", com **Scale-1 como default
   seguro** documentado na fonte na ausência de atribuição. O contrato precisa expor
   quem atribuiu, quando, com qual indicação, e como a atribuição é
   revogada/reconfirmada (cadência de reconfirmação já é ponto sinalizado em
   `specification.md` linha ~594).
2. **Ordem de limitação terapêutica / objetivos de cuidado** — consumida por
   `RULE-SOFA` e `RULE-NEWS2` (supressão de escalonamento) e sinalizada em `RULE-GCS`;
   é o controle candidato de **HAZ-0044** (`hazard-log.md`: "a pathway generates an
   escalation work item for a patient under palliative care, a treatment-limitation
   order, or other documented goals-of-care restriction... technically correct by the
   rule and clinically wrong for this patient"). Sem este contrato, o sistema não tem
   como saber que uma escalada é clinicamente errada para aquele paciente
   especificamente.

**Perguntas Q11+ ao lado AMH (candidatas ao quadro de**
`open-questions-for-amh-owners.md`**, a integrar por quem o titular designar):**

| # | Pergunta |
|---|---|
| **Q11** | Existe, em qualquer camada do Tasy ou da plataforma AMH, um registro estruturado de atribuição de escala-alvo de SpO2 (ou equivalente clínico) — com autor, horário e indicação — ou essa decisão hoje só existe em prontuário de texto livre? |
| **Q12** | Existe registro estruturado de ordem de limitação terapêutica / diretiva de cuidado (ex.: "não reanimar", "conforto", "objetivos de cuidado paliativo") no Tasy? Em qual tabela, e com qual granularidade (por encontro? por episódio? reversível?) |
| **Q13** | Se essas ordens existem estruturadas no Tasy, elas chegam a algum canal de exportação hoje (FHIR, batch, ou outro), ou estão inteiramente fora do escopo dos pipelines já mapeados por este dossiê (`bronze_to_fhir.py`, schemas/fhir-profiles/)? |
| **Q14** | Qual é o modelo de revogação/expiração dessas ordens na fonte — uma ordem de limitação terapêutica é reafirmada periodicamente, ou permanece vigente até cancelamento explícito? A V2 precisa desta semântica para não tratar silêncio como ausência de restrição nem como restrição permanente indevida. |
| **Q15** | Existe, hoje, qualquer mecanismo (manual ou sistêmico) pelo qual uma decisão de escala de SpO2 ou de limitação terapêutica seja comunicada a um sistema externo à AMH? Se sim, qual, e pode servir de precedente para este contrato? |

**Deliverable.** Não é um profile FHIR `Observation` — é uma definição de recurso de
**ordem/flag** (por exemplo, `ServiceRequest`, `Flag`, ou `Consent`/`Provenance` para o
componente de limitação terapêutica — a escolha de recurso FHIR é do lado AMH, com
critérios de atribuição, revogação e proveniência declarados) mais a identificação de
onde a fonte já vive no Tasy (se viver) e como alcança a plataforma.

**Critério de aceitação.**
1. Respostas a Q11-Q15, cada uma citável por caminho/tabela quando aplicável, ou
   declaração negativa explícita quando a fonte não existir.
2. Se a fonte existir: contrato de recurso definido, com autor, horário, indicação e
   modelo de revogação declarados para os dois consumidores nomeados.
3. Se a fonte não existir: registrado como tal — ausência documentada não é lida como
   afirmação de existência futura, mesma disciplina do restante deste dossiê.
4. Nenhuma escolha de recurso FHIR é presumida por esta ordem; a AMH propõe, a V2
   avalia contra RULE-NEWS2 §3.2 e o controle candidato de HAZ-0044.

**Dependências.** Nenhuma técnica externa; independe de OS-22 e OS-23.

**Bloqueador V2 que libera.** `BLK-0016` — parcial ou integralmente, conforme cobertura
declarada no critério de aceitação item 3.

---

*Ordens OS-22..OS-24 comissionadas por decisão do titular (GDEC-0008, itens 2 e 6,
2026-08-15) e redigidas por escriba de governança. Nenhum agente decidiu mérito
clínico, técnico ou de produto nesta seção. Nada foi escrito no repositório AMH. Sem
PHI, credenciais, tokens ou identificadores reais.*

---

*Preparado pelo arquiteto de compatibilidade AMH-dados. As resoluções AQ-1..AQ-6 são DECIDIDAS por rodaquino-OMNI em 2026-08-15; as ordens de serviço derivadas são PROPOSTAS. Nada foi escrito no repositório AMH. Sem PHI, credenciais ou tokens.*
