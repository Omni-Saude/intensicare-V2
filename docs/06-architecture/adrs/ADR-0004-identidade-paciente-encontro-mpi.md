---
id: ADR-0004
title: Identidade de paciente/encontro, escopo do MPI, identificador de fronteira e semântica de merge/unmerge
status: under-review
status_history:
  - status: not-started
    date: 2026-08-14
    by: engenheiro de arquitetura candidata e do programa de ADRs (Onda 2)
    note: ID reservado em adr-index.md
  - status: proposed
    date: 2026-08-15
    by: engenheiro de arquitetura candidata e do programa de ADRs (Onda 2)
    note: >
      Redigido após a adjudicação das seis posições contraditórias da AMH. Formaliza,
      com o rigor da §10 do prompt, uma direção já decidida em sessão pelo titular.
  - status: under-review
    date: 2026-08-15
    by: engenheiro de arquitetura candidata e do programa de ADRs (Onda 2)
    note: >
      Encaminhado para revisão do titular nomeado. A DIREÇÃO foi decidida por
      rodaquino-OMNI em 2026-08-15; a ACEITAÇÃO deste ADR escrito é ato separado e
      ainda não ocorreu. Nenhum agente marcará `accepted`.
  - status: under-review
    date: 2026-08-15
    by: arquiteto de decisões de fronteira e modelo canônico
    note: >
      REVISÃO (sem mudança de status): a ata IDN-ADJ-2026-08-15 aterrissou em disco e
      foi lida integralmente por este segundo especialista; a reconciliação item a item
      exigida pela condição C2 foi EXECUTADA (ver §5.5). Divergências corrigidas a
      favor da ata: enumeração e semântica de entrega dos eventos de D-08, formato
      pleno do PSR em D-04, base legal com artigo em D-09, derivação de tenant em
      D-03. Acrescidos: §5.2.1 (reatribuição/óbito/alta/duplicata) e o requisito de UI
      vinculante de AQ-1 em §6.2.
date: 2026-08-15
owner: rodaquino-OMNI — CEO e acionista principal (OMNI e AMH), médico intensivista
approvers:
  - rodaquino-OMNI — AUTH-DATA-PLATFORM (lado V2), por DEC-G0-04
  - rodaquino-OMNI — autoridade do lado AMH (AUTH-AMH-OWNER), por DEC-G0-04 e DEC-G0-08
  - UNASSIGNED — VALIDATION REQUIRED — parecer DPO/jurídico brasileiro, exigido apenas
    para o item D-02 (índice cross-PJ) e para qualquer uso com dado real (DEC-G0-03)
decision_deadline: >
  A direção venceu em 2026-08-15. A aceitação deste ADR escrito deve ocorrer ANTES de
  qualquer redação do pacote de contrato AMH×IntensiCare v1, que depende integralmente
  do campo de sujeito aqui definido. Data-calendário: UNSET — a fixar pelo titular.
deciding_authority_rule: >
  docs/00-governance/decision-rights.md §2, linhas "Tenant/MPI identity policy" e "AMH
  contract / boundary acceptance": AUTH-DATA-PLATFORM em conjunto com AUTH-AMH-OWNER.
  Por DEC-G0-04 (docs/00-governance/registers/g0-resolucoes-2026-08-15.md) ambos os
  papéis são detidos pelo mesmo humano nomeado, o que é legítimo para papéis de DECISÃO
  e é registrado explicitamente em §11.2 como concentração de autoridade.
independence_check: >
  Os pares de independência do prompt §4 restringem implementador × verificador e
  permanecem intactos: quem implementar a camada anticorrupção de identidade NÃO pode
  aceitar a evidência de conformidade correspondente, e quem escrever os testes
  negativos de isolamento NÃO pode ser quem os aceita como suficientes. Este ADR foi
  redigido por agente; nenhum agente o aprova.
links:
  drivers:
    domain_invariants: [DOM-0001, DOM-0002, DOM-0003, DOM-0004, DOM-0008, DOM-0009]
    quality_scenarios: [QAS-0007, QAS-0010, QAS-0014, QAS-0018, QAS-0019, QAS-0020, QAS-0025]
    risks: ["risco de concentração de autoridade — a registrar no risk-register conforme nota de integração 3 do DEC-G0"]
  constrains:
    requirements: ["REQ: pendente de catálogo de requisitos (docs/04-product-requirements ainda não existe)"]
    clinical: ["CLR: pendente do portfólio de vias clínicas (Gate G2)"]
    safety: [SAF-0007, SAF-0008, SAF-0009, SAF-0013, SAF-0014, SAF-0019, SAF-0023, SAF-0029, SAF-0032, SAF-0035]
  hazards: [HAZ-0001, HAZ-0002, HAZ-0003, HAZ-0004, HAZ-0008, HAZ-0013, HAZ-0014, HAZ-0027, HAZ-0038]
  tests: ["TST-IDP-03", "TST-IDP-04", "TST-IDP-05", "TST-IDP-06", "TST-IDP-08", "TST-DOM-0001", "TST-DOM-0002", "TST-DOM-0003"]
  validations: ["VAL: pendente do backlog de validação"]
  adrs:
    depends_on: [ADR-0001, ADR-0003]
    feeds: [ADR-0005, ADR-0009, ADR-0013, ADR-0015, ADR-0016, ADR-0018]
  gates: [G3]
  evidence:
    - docs/00-governance/registers/g0-resolucoes-2026-08-15.md
    - docs/08-interoperability/amh-data/identity-adjudication/adjudicacao-decisoes-2026-08-15.md
    - docs/08-interoperability/amh-data/identity-adjudication/contradiction-record.md
    - docs/08-interoperability/amh-data/identity-adjudication/adjudication-request-to-amh-owners.md
    - docs/08-interoperability/amh-data/identity-adjudication/interim-identity-policy.md
    - docs/08-interoperability/amh-data/ordens-de-servico-amh-2026-08-15.md
    - docs/08-interoperability/amh-data/compatibility-finding.md
supersedes: "IDP-02 (regra da política interina de identidade, não um ADR) — ver §10"
superseded_by: null
provenance:
  source_repo: intensicare-V2
  path_or_url: docs/06-architecture/adrs/ADR-0004-identidade-paciente-encontro-mpi.md
  commit_sha_or_version: cb35521 (HEAD do repositório na redação; este arquivo não está commitado)
  section_or_lines: >
    INTENSICARE_V2_ORCHESTRATOR_PROMPT.md §7.4 (linhas 438-452), §7.5, §7.6, §9.3,
    §10 item 4, Gate G3; DEC-G0-04 e DEC-G0-10 do registro de resoluções do Gate G0
  date_collected: 2026-08-15
  collector: engenheiro de arquitetura candidata e do programa de ADRs (Onda 2)
  transformation: >
    formalização — os insumos decididos foram transmitidos pelo orquestrador citando o
    registro de adjudicação de 2026-08-15; o raciocínio, as alternativas rejeitadas e as
    consequências foram redigidos a partir dos documentos de adjudicação lidos em disco.
  confidence: medium
  owner: rodaquino-OMNI
  validation_status: VALIDATION REQUIRED — aceitação do ADR escrito pelo titular
---

# ADR-0004 — Identidade de paciente/encontro, escopo do MPI, identificador de fronteira e semântica de merge/unmerge

> **Status: `under-review`.** A **direção** foi decidida por humano nomeado
> (rodaquino-OMNI) em 2026-08-15; este documento a formaliza com todos os campos
> obrigatórios da §10 do prompt para revisão e aceitação. **Enquanto o status for
> `under-review`, a decisão não está aceita como ADR** — nenhum agente pode marcá-la
> `accepted`, e nada aqui é evidência de implementação ou de verificação.

> **Aviso de proveniência, dito uma vez e válido para todo o documento.** O registro
> `docs/08-interoperability/amh-data/identity-adjudication/adjudicacao-decisoes-2026-08-15.md`
> estava **sendo escrito em paralelo** e **não existia em disco** quando este ADR foi
> redigido. Os insumos decididos abaixo foram transmitidos por escrito pelo orquestrador,
> citando aquele registro e o `g0-resolucoes-2026-08-15.md` (este sim, lido em disco).
> **Ação obrigatória antes da aceitação:** reconciliar item a item a §5 deste ADR contra
> aquele registro quando ele aterrissar. Divergência entre os dois documentos resolve-se
> a favor do registro de adjudicação, e este ADR é corrigido.
>
> **ATUALIZAÇÃO 2026-08-15 (segunda revisão, mesmo dia).** A ata **aterrissou e foi lida
> integralmente em disco** pelo arquiteto de decisões de fronteira e modelo canônico
> (OBSERVED — E16). A reconciliação item a item foi **EXECUTADA**: resultado completo em
> **§5.5**, divergências corrigidas neste texto a favor da ata, conforme a regra acima.
> A condição C2 registra a execução; a confirmação final da reconciliação permanece do
> titular no ato de aceitação.

---

## 1. Contexto e problema

### 1.1 A contradição que este ADR encerra

O prompt §7.4 (linha 440) exige: *"Create a formal contradiction record and owner
decision for the conflict among ADR-006's longitudinal MPI concept, ADR-039's unresolved
MPI/consent debt, ADR-041's tenant-local MPI/root-CNPJ boundary, and the FHIR IG's
longitudinal-MPI language."*

O registro formal foi produzido na Onda 2 e documenta **seis posições AMH mutuamente
incompatíveis sobre o mesmo campo** (`mpi_id` / `amh-mpi-id`), no commit pinado
`0a07a6f1fab36fb2f5eeee0fcd8e945c95f67116` — SOURCE, `contradiction-record.md` §1:

| Posição | Afirmação |
|---|---|
| **P1 — ADR-006** | MPI longitudinal único cross-tenant, com portão de consentimento |
| **P2 — ADR-039** | `amh-mpi-id` é a chave canônica, com débito que bloqueia go-live clínico |
| **P3 — ADR-041 §6** | O MPI é **por tenant** e não cruza PJs |
| **P4 — FHIR IG** | `amh-mpi-id` é chave longitudinal **cross-tenant** estável |
| **P5 — ADR-043** | Índice de correspondência cross-PJ separado, autorizado, sem liberação jurídica |
| **P6 — ADR-042 XRD-05 / AMH-020b** | O identificador de fronteira é um `portable_subject_ref` opaco, por PJ, com propósito vinculado — desenhado, gated, não aplicado |

Cinco eixos de conflito foram isolados (IDN-C-1 escopo do `mpi_id`; IDN-C-2 qual elemento
FHIR carrega identidade e o que o produtor de fato emite; IDN-C-3 qual portão de
consentimento é autoritativo e se falha aberto ou fechado; IDN-C-4 deriva na enumeração
de tenants; IDN-C-5 duas fronteiras de tenant aplicadas em camadas diferentes) e
convertidos em seis perguntas de adjudicação AQ-1…AQ-6.

**Por que era bloqueador e não preocupação de fundo (SOURCE, `contradiction-record.md`
§0 e §4):** a V2 não pode consumir `Patient` nem `Observation` da AMH sem saber qual
semântica se aplica; e o prompt §2 item 7 é explícito — *"V2 must not select one
silently."*

### 1.2 O que mudou em 2026-08-15

**OBSERVED**, `docs/00-governance/registers/g0-resolucoes-2026-08-15.md`, DEC-G0-04:
rodaquino-OMNI assumiu `AUTH-DATA-PLATFORM` **e** declarou deter a autoridade do lado
AMH, na qualidade de CEO e acionista principal de ambas as empresas. A consequência
registrada no próprio documento é exatamente esta: *"as questões de adjudicação AQ-1..AQ-6
… tornam-se respondíveis em sessão dedicada, deixando de depender de terceiros."*

A sessão ocorreu. **A adjudicação está feita.** Este ADR é a forma arquitetural dela.

**Pergunta que este ADR responde:** qual é o modelo de identidade de paciente e encontro
da IntensiCare V2 — escopo do MPI, qual identificador atravessa a fronteira AMH×V2, por
qual tupla a V2 chaveia fatos clínicos, e como merge/unmerge e replay se comportam?

### 1.3 Fora de escopo

- Grão de tenant e modelo de propriedade de recursos — **ADR-0003** (este ADR consome o
  grão AMH de CNPJ raiz como fato externo, não o ratifica como modelo interno da V2).
- Fronteira de plataforma com a AMH — **ADR-0001**, que permanece `proposed`.
- Modelo canônico de observação, proveniência, qualidade, correção e tempo — **ADR-0005**.
- Autenticação e identidade máquina-a-máquina — **ADR-0015**; autorização e isolamento —
  **ADR-0016**. Este ADR reafirma que resolução de identidade **não é** autorização, mas
  não define o mecanismo de autorização.
- Perfis FHIR, terminologia e escrita de volta — **ADR-0013**.
- Elegibilidade de qualquer via clínica — Gate G2.

---

## 2. Evidência e premissas

### 2.1 Evidência

**Nota epistêmica única.** Este ADR **não reverificou** nenhum artefato da AMH. Toda
linha de origem AMH é `SOURCE` porque cita os documentos de adjudicação da Onda 2, que
registraram suas próprias verificações `OBSERVED` no commit pinado. Só o agente que
verificou pode rotular `OBSERVED` (`docs/00-governance/evidence-notation.md` §2).

| # | Rótulo | Afirmação | Fonte | Confiança |
|---|---|---|---|---|
| E1 | OBSERVED | rodaquino-OMNI detém `AUTH-DATA-PLATFORM` e a autoridade do lado AMH; AQ-1…AQ-6 tornam-se respondíveis | `g0-resolucoes-2026-08-15.md` DEC-G0-04 | alta |
| E2 | OBSERVED | Todo material a partir de 2026-08-15 é redigido em pt-BR | `g0-resolucoes-2026-08-15.md` DEC-G0-10 | alta |
| E3 | OBSERVED | Desenvolvimento prossegue **exclusivamente com dados sintéticos**; parecer jurídico brasileiro é gatilho obrigatório antes de qualquer teste com dado real, operação sombra ou piloto | `g0-resolucoes-2026-08-15.md` DEC-G0-03 | alta |
| E4 | SOURCE | Seis posições AMH incompatíveis sobre `mpi_id`; cinco eixos de conflito | `contradiction-record.md` §1–§2 | alta |
| E5 | SOURCE | No perfil `Patient-amh`, `extension:mpiId` é `1..1` e `identifier:mpiId` é `0..1`; o ADR-039 nomeia como canônico justamente o elemento **opcional** | `adjudication-request-to-amh-owners.md` AQ-2 | alta |
| E6 | SOURCE | O produtor em lote emite `mpi_id` **apenas como `identifier`**; a contagem da string `extension` no arquivo do produtor retorna **0** — as extensões obrigatórias `1..1` não são populadas | `adjudication-request-to-amh-owners.md` AQ-2 | alta |
| E7 | SOURCE | `portable_subject_ref` (`amh:psr:v1:<uuidv4>`) está **desenhado com DDL versionado e não aplicado**; sete pontos de parada humanos SP-1…SP-7 seguem abertos, incluindo SP-6 (parecer jurídico do ADR-043) | `adjudication-request-to-amh-owners.md` AQ-4; `interim-identity-policy.md` IDP-02 | alta |
| E8 | SOURCE | O escopo desenhado do PSR é `{amh_tenant, legal_entity, mpi_id}` — *"A MESMA pessoa em outra PJ tem OUTRO ref, de propósito"*; a pergunta fática em aberto era se um ref voltado à IntensiCare seria escopado, qualificado ou independente de encontro | `adjudication-request-to-amh-owners.md` AQ-4; `interim-identity-policy.md` IDP-02 | alta |
| E9 | SOURCE | Semântica de ciclo de vida do AMH-020b: aliases permanecem resolvíveis para sempre; eventos históricos emitidos sob o ref original **não são reescritos**; revogação é **carimbada, não apagada**; apagamento define `status=retired` e anula a coluna de mapeamento, preservando a não-reutilização permanente do ref | `interim-identity-policy.md` IDP-10 | alta |
| E10 | SOURCE | Nenhum mecanismo de entrega desses eventos a um consumidor existe no commit pinado | `interim-identity-policy.md` IDP-10 | alta |
| E11 | SOURCE | Deriva de enumeração de tenants: o IG descreve 10 tenants e usa em exemplo um tenant que o ADR-041 **aposenta**; o ADR-041 fixa o conjunto de negócio em **12**; o AMH-020b torna a proibição um invariante verificável por máquina | `adjudication-request-to-amh-owners.md` AQ-6 | alta |
| E12 | SOURCE | Contradição sobre bypass cross-tenant: o IG descreve exceção por claim `cross_tenant_authorized`; o contrato de particionamento descreve mecanismo sem forma de expressá-la — identificação de tenant é por URL, com negação quando token e URL divergem e referências cross-partition desabilitadas | `adjudication-request-to-amh-owners.md` AQ-6 | alta |
| E13 | SOURCE | `mpi.consent_log` tem **zero produtores** — o portão de consentimento em que o ADR-006 condiciona a federação **não tem dado** | `adjudication-request-to-amh-owners.md` AQ-1/AQ-3 | alta |
| E14 | SOURCE | O `Observation` laboratorial da AMH permanece bloqueado por fonte vazia, e o único perfil de Observation exclui estruturalmente sinais vitais | `compatibility-finding.md` §3 | alta |
| E15 | SOURCE (transmitido) | Insumos decididos em 2026-08-15, transmitidos pelo orquestrador citando o registro de adjudicação ainda não presente em disco | mensagem do orquestrador; ver aviso de proveniência acima | ~~média — pendente de reconciliação~~ → **reconciliada por E16/§5.5** |
| E16 | OBSERVED (revisão 2026-08-15) | A ata `IDN-ADJ-2026-08-15` **existe em disco e foi lida integralmente** por este segundo especialista: seis decisões com metadados DECIDED (decided_by rodaquino-OMNI, 2026-08-15), disposição consolidada dos artefatos AMH (§3), alvo de pinagem IG 1.1.0 **ainda não publicado** (§4), o que as decisões **não** desbloqueiam (§6 — `Observation` segue não consumível por três pernas; vitais seguem indisponíveis) e oito pendências de ratificação (§8), incluindo contra-assinatura da própria ata e o requisito de UI de AQ-1 | `identity-adjudication/adjudicacao-decisoes-2026-08-15.md`, lida em 2026-08-15 | alta |

### 2.2 Premissas

A registrar em `docs/00-governance/registers/assumptions-register.md`; **nenhum ID `ASM`
é cunhado aqui** (aquele registro é o catálogo de cunhagem do prefixo).

| # | Premissa | Por que é necessária | O que a invalida |
|---|---|---|---|
| A1 | A AMH executará as ordens de serviço decorrentes: publicar a IG 1.1.0, liberar os portões SP-1…SP-7 do PSR e entregar os eventos de ciclo de vida + `resolve(ref, as_of)` | Sem elas o modelo decidido não é **verificável**, embora permaneça decidido | Decisão de priorização da AMH que adie qualquer das três; ausência de orçamento |
| A2 | A fração de pacientes com atendimento em mais de uma PJ é pequena o bastante para que a fragmentação exibida ao clínico seja clinicamente tolerável | Sustenta a consequência aceita em §6.2 | Medição que mostre fração material; entrada de um convênio ou linha de cuidado que atravesse PJs por desenho |
| A3 | O parecer DPO/jurídico brasileiro, quando emitido, não proibirá o índice cross-PJ do ADR-043 | Sustenta o item D-02 como direção | Parecer restritivo — o item D-02 cai sem derrubar os demais |
| A4 | A tutela da saúde é base legal suficiente para o loop clínico primário sob a LGPD, na leitura a ser confirmada pelo jurídico | Sustenta o item D-09 | Parecer jurídico que exija consentimento também no loop assistencial |
| A5 | O escopo `{amh_tenant, legal_entity}` do PSR permanece estável na versão oferecida à IntensiCare | Sustenta o chaveamento `(PSR, encontro)` | Alteração do escopo do ref pela AMH antes da publicação do contrato v1 |

### 2.3 Hipóteses e o que resta testar

A adjudicação encerrou as perguntas **de política**. Ela não produziu — e não podia
produzir — evidência de **implantação**. O que resta é verificação, não decisão:

| # | A verificar | Método | Estado |
|---|---|---|---|
| H1 | A IG 1.1.0 publica `identifier:mpiId` como o elemento autoritativo, com bump de versão de pacote | Leitura do pacote publicado + pin em `contracts.lock` | **NÃO PUBLICADA** |
| H2 | O produtor emite de fato o elemento autoritativo, e a partir de que data | Amostragem em ambiente + testes de conformidade | **NÃO VERIFICADO** (E6: hoje não emite extensão alguma) |
| H3 | O PSR é mintado em produção com os portões SP-1…SP-7 liberados | Registro de liberação de cada SP + emissão observada | **GATED** |
| H4 | Eventos de ciclo de vida e `resolve(ref, as_of)` existem e são consumíveis | Testes de contrato dirigidos pelo consumidor | **INEXISTENTES** (E10) |
| H5 | Não existe bypass cross-tenant em nenhum ambiente implantado | Testes negativos que **afirmam a impossibilidade**, não a ausência | **NÃO EXECUTÁVEL** — sem ambiente |

---

## 3. Direcionadores de decisão e atributos de qualidade mensuráveis

| # | Direcionador | Por que discrimina | Atributo mensurável | Alvo |
|---|---|---|---|---|
| D1 | **Segurança do paciente na atribuição de fatos** — nenhum fato clínico pode ser atribuído à pessoa ou ao episódio errado | Modelos longitudinais unificam pessoas entre PJs e criam a possibilidade de junção indevida; modelos por tenant tornam a junção estruturalmente impossível | QAS-0018; HAZ-0001, HAZ-0002 | VALIDATION REQUIRED (G1) |
| D2 | **Isolamento de tenant como invariante de todas as camadas** (DOM-0001) | Um identificador cujo escopo atravessa PJs move o isolamento de invariante estrutural para regra de aplicação | QAS-0014, QAS-0018 | Zero acesso cross-tenant bem-sucedido — **vinculante, sem orçamento de erro** |
| D3 | **Replay determinístico através de mudanças de identidade** (DOM-0003) | Um merge que a V2 conhece apenas por inferência é reescrita silenciosa de história clínica; sem `as_of` o replay resolve identidade "agora", não "então" | QAS-0020, QAS-0019 | 100% de reprodução — **vinculante** |
| D4 | **Minimização de PHI na fronteira** (§9.1 princípio 12) | Identificadores crus de paciente atravessando a fronteira são PHI de alto valor; um ref opaco não é | QAS-0028 (implicitamente), QAS-0025 | VALIDATION REQUIRED |
| D5 | **Base legal defensável do loop clínico** | Um portão de consentimento sem produtor de dado falha aberto ou trava o loop; a base legal escolhida determina qual | E13; QAS-0007 | VALIDATION REQUIRED (parecer jurídico, G6) |
| D6 | **Custo de saída e acoplamento ao cronograma da AMH** | Chave própria da V2 reduz dependência mas cria migração futura; PSR obrigatório elimina a migração e transfere o cronograma para a AMH | QAS-0027 | VALIDATION REQUIRED |
| D7 | **Continuidade clínica percebida pelo clínico** | O modelo por tenant fragmenta o histórico de um paciente atendido em várias PJs — e isso é visível à beira do leito | QAS-0007, QAS-0017 | VALIDATION REQUIRED (G1/G4, fatores humanos) |
| D8 | **Verificabilidade no Gate G3** | Um modelo elegante que não pode ser testado não passa no G3; eventos de ciclo de vida são o item cuja ausência inviabiliza a certificação do replay | QAS-0020, QAS-0013 | Vinculante para o G3 |

---

## 4. Alternativas consideradas

Todas foram consideradas com consequências honestas antes da adjudicação; cinco foram
**rejeitadas pelo titular em 2026-08-15**. Registrá-las é o que impede que sejam
reabertas por esquecimento — e o que permite auditar a decisão depois.

### Opção A — MPI por tenant + índice cross-PJ governado + PSR obrigatório na fronteira *(SELECIONADA)*

Detalhada em §5. Resumo: identidade escopada por tenant (P3/ADR-041 §6), correspondência
cross-PJ existe apenas como índice separado e governado (P5/ADR-043), e o identificador
que atravessa a fronteira é o `portable_subject_ref` opaco (P6/AMH-020b), obrigatório e
não opcional.

**Positivas.** Isolamento por construção, não por regra. Nenhum identificador cru de
paciente entra no domínio clínico da V2. Merges resolvem do lado AMH sem quebrar o
consumidor. O escopo é inequívoco por desenho. Alinha-se ao prompt §7.4 linha 445
(preferir ref portátil opaco quando um contrato AMH autoritativo o fornecer) e à §7.5
(minimizar campos e PHI).

**Negativas.** Fragmenta o paciente multi-PJ (§6.2). Torna a V2 dependente de três
entregas AMH que hoje não existem (H1, H3, H4). Transfere parte do caminho crítico para
fora da engenharia da V2.

### Opção B — MPI longitudinal cross-tenant (P1/ADR-006 + P4/FHIR IG) — **REJEITADA**

Uma chave única por pessoa, atravessando PJs, com portão de consentimento.

**Por que foi rejeitada.** O portão de consentimento em que o próprio ADR-006 condiciona
a federação **não tem produtor de dado** (E13): a `mpi.consent_log` está vazia. Adotar o
modelo longitudinal seria consumir PHI cross-PJ sobre uma base que o ADR de identidade
mais recente da própria AMH registra como pendente de parecer jurídico — a opção de maior
exposição, e a única que transforma o isolamento entre PJs de propriedade estrutural em
promessa de configuração. O ADR-041 §6 já havia rejeitado a identidade longitudinal
cross-PJ do lado AMH; adotá-la do lado V2 criaria divergência entre produtor e consumidor
sobre o significado do mesmo campo.

**O que se perde ao rejeitar.** A visão longitudinal única do paciente. Recuperada, de
forma governada e auditável, pelo índice do ADR-043 quando o parecer jurídico o liberar.

### Opção C — Escopo misto ou deixado em aberto (manter o status quo) — **REJEITADA**

Consumir o campo sem fixar sua semântica, tratando-o conforme o contexto.

**Por que foi rejeitada.** É precisamente o que o prompt §2 item 7 proíbe: *"V2 must not
select one silently."* Um campo com quatro significados candidatos não pode ser pinado em
contrato (`adjudication-request` §"What V2 work is blocked"), e um consumidor que decide
caso a caso terá tomado a decisão de qualquer modo — sem registro, sem revisão e sem
possibilidade de reverter. A adjudicação tornou-se possível em 2026-08-15 (E1); manter o
status quo depois disso seria escolha por omissão.

### Opção D — Chave interna da V2, opaca, mintada pela própria V2 (IDP-02) — **REJEITADA / SUPERADA**

A política interina de identidade (regra IDP-02) previa que a V2 cunhasse sua própria
chave interna, estruturalmente compatível com o PSR, para adotar o ref da AMH depois como
mera mudança de mapeamento na camada anticorrupção.

**Por que foi rejeitada.** A regra existia por uma razão explícita e temporária: *"at the
pinned commit, no such contract is in force"* (IDP-02). Com o PSR agora **obrigatório**
por decisão do titular, a premissa caiu. Manter uma chave interna paralela produziria
duas chaves de sujeito coexistindo — exatamente o tipo de duplicidade que o prompt §7.3
proíbe para fontes de verdade clínicas, com custo permanente de reconciliação, uma
migração futura garantida e uma superfície a mais onde o vínculo tenant/encontro pode ser
perdido. **A chave da V2 é o PSR; não há chave interna paralela.**

**Consequência formal.** IDP-02 é **superada** por este ADR. Ver §10.

**O que se perde ao rejeitar.** Independência de cronograma: sem chave própria, a V2 não
pode persistir fatos clínicos de produção antes de a AMH mintar PSRs. Mitigado pelo item
D-06 (PSR sintético em dev/test) — que preserva integralmente o desenvolvimento, porque o
DEC-G0-03 já restringe esta fase a dados sintéticos.

### Opção E — Loop clínico com portão de consentimento — **REJEITADA**

Exigir decisão de consentimento como pré-condição de cada avaliação clínica.

**Por que foi rejeitada.** A base legal do loop assistencial é a **tutela da saúde**, não
o consentimento. Um portão de consentimento no loop clínico teria dois desfechos, ambos
ruins: falha aberta (portão decorativo, pior do que nenhum) ou falha fechada sobre um log
sem produtores (E13), suspendendo a avaliação de pacientes reais por ausência de dado
administrativo. O que **permanece exigível** é o par propósito-de-uso + contexto
profissional, e o bloqueio de usos secundários — controles que atuam sobre a finalidade,
não sobre a existência do cuidado.

**Ressalva registrada.** Esta é uma leitura jurídica tomada por autoridade de negócio e
clínica, **não por advogado**. O DEC-G0-03 mantém o parecer jurídico brasileiro como
gatilho obrigatório antes de qualquer dado real. Se o parecer divergir, o item D-09 é
reaberto.

### Opção F — Replay limitado a uma janela (AQ-5 opção C) — **REJEITADA**

Tratar identidade como imutável dentro de uma janela, limitar a validade do replay a essa
janela e declarar a limitação no caso de segurança.

**Por que foi rejeitada.** O replay é a base do DOM-0003 e da reconstrução de incidentes.
Uma janela é um limite arbitrário sobre a única capacidade que permite responder "o que o
sistema sabia e concluiu naquele instante" — e o SAF-0019 exige registro imutável de
avaliação, inclusive de por que uma regra **não** disparou. A decisão inverte o ônus:
**os eventos de ciclo de vida e o `resolve(ref, as_of)` passam a ser obrigatórios no
contrato v1**, e a sua ausência **reprova o Gate G3** em vez de degradar silenciosamente
a garantia de replay.

### Opção Z — Adiar a adjudicação — **REJEITADA**

**Por que foi rejeitada.** Adiar era a postura correta enquanto a autoridade AMH era
externa e inalcançável (o registro de contradições dizia exatamente isso). O DEC-G0-04
removeu essa condição. A partir de 2026-08-15, adiar apenas propaga a ambiguidade para o
ADR-0005, o ADR-0013 e o pacote de contrato v1.

### 4.1 Comparação frente aos direcionadores

| Direcionador | A (selecionada) | B longitudinal | D chave interna V2 | E consent no loop | F janela de replay |
|---|---|---|---|---|---|
| D1 atribuição segura | Junção cross-PJ impossível por construção | Junção possível; depende de regra | Igual a A, com uma chave a mais para errar | Neutro | Neutro |
| D2 isolamento | Estrutural | Regra de aplicação | Estrutural | Neutro | Neutro |
| D3 replay | Garantido por eventos + `as_of` | Não resolve | Não resolve sozinho | Neutro | **Degrada por desenho** |
| D4 minimização | Ref opaco na fronteira | Identificador cru trafega | Opaco, mas duplicado | Neutro | Neutro |
| D5 base legal | Tutela da saúde, propósito exigível | Portão sem dado (E13) | Neutro | **Falha aberta ou trava o loop** | Neutro |
| D6 custo de saída / cronograma | Depende de 3 entregas AMH | Menor dependência, maior exposição | Menor dependência, migração garantida | Neutro | Menor dependência |
| D7 continuidade percebida | **Fragmenta multi-PJ** | Visão única | Igual a A | Neutro | Neutro |
| D8 verificabilidade G3 | Verificável quando as entregas aterrissarem | Não verificável (consent sem dado) | Verificável, mas do lado errado da fronteira | Não verificável | Verificável e insuficiente |

---

## 5. Decisão e escopo

> **Direção DECIDIDA por rodaquino-OMNI em 2026-08-15** (CEO e acionista principal de
> OMNI e AMH, médico intensivista), sob DEC-G0-04. **A aceitação deste ADR escrito é ato
> separado e ainda não ocorreu** — o status permanece `under-review` até que o titular
> revise este texto. Nenhum agente participou da decisão; este documento a formaliza.

### 5.1 O modelo decidido

| # | Item decidido | AQ que encerra | Posição AMH que prevalece |
|---|---|---|---|
| **D-01** | **MPI por tenant.** A identidade de paciente é escopada ao tenant; não existe identidade de pessoa global inferida pela V2. | AQ-1 | P3 (ADR-041 §6) |
| **D-02** | **Índice cross-PJ governado**, na forma do ADR-043, como **única** via de correspondência entre PJs — **gated em parecer DPO/jurídico** (SP-6). Enquanto o parecer não existir, não há correspondência cross-PJ de espécie alguma. | AQ-1 | P5 (ADR-043) |
| **D-03** | **`identifier:mpiId` é o elemento autoritativo no wire**, com correção da cardinalidade do perfil (extensões `mpiId`/`tenantId` **rebaixadas de `1..1`**) e **bump de pacote — IG 1.1.0** (futura). A V2 valida sobre o identifier e trata a extensão como ausente por desenho. **O tenant autoritativo é derivado da partição de URL + claim do token — nunca de extensão no recurso** (ata AQ-2 item 2); padrão único de URL de profile = `fhir.americashealth.com.br` (carimbos `amh.health/…/BR*` são defeito do produtor, a corrigir — OS-07). | AQ-2 | AQ-2 opção B |
| **D-04** | **O identificador de fronteira é o `portable_subject_ref`, OBRIGATÓRIO**, no formato normativo **`amh:psr:v1:<uuidv4>`** (AMH-020b §1.1, citado pela ata). Nenhum identificador cru — `mpi_id`, CPF, CNS, id de registro de origem ou hash destes — atravessa a fronteira para o domínio clínico da V2. | AQ-4 | P6 (ADR-042 XRD-05 / AMH-020b), opção A estendida à IntensiCare |
| **D-05** | **O PSR é independente de encontro e sempre qualificado por encontro.** A V2 **chaveia fatos clínicos pela tupla `(PSR, encontro)`.** Isto responde a sub-pergunta fática deixada em aberto no AQ-4. | AQ-4 | — (definição nova) |
| **D-06** | **PSR sintético em dev/test; mintado pela AMH em produção.** Nenhum PSR de produção é fabricado pela V2. | AQ-4 | coerente com XRD-05 |
| **D-07** | **Não existe chave interna de sujeito paralela na V2.** IDP-02 é superada. | AQ-4 | — |
| **D-08** | **Eventos de ciclo de vida de identidade e `resolve(ref, as_of)` são cláusulas OBRIGATÓRIAS do contrato v1.** A ata enumera **cinco tipos obrigatórios** — `alias`, `merge`, `unmerge`, `restore`, `erasure` — com **entrega at-least-once e ordenação por sujeito** (ata AQ-5 item 1); a ordem de serviço derivada **OS-17** expõe seis tipos, acrescentando *reassignment* (reatribuição) e detalhando *unmerge/split* — extensão de engenharia compatível, registrada como derivação e não como teor da decisão. `resolve(ref, as_of)` dá resolução ponto-no-tempo (OS-18). **Sem eventos + resolve, o Gate G3 não passa** — *"não se admite janela-teto como paliativo"* (ata). | AQ-5 | AQ-5 opção A vinculante (eventos **e** resolve) |
| **D-09** | **Base legal do loop clínico = tutela da saúde — LGPD Art. 11, II, alínea "f"**, em procedimento realizado por profissionais/serviços de saúde (ata AQ-3 item 1). Sem portão de consentimento no loop assistencial. **Propósito-de-uso + contexto profissional permanecem portões exigíveis.** **Usos secundários bloqueados** até existir infraestrutura real de consentimento. **`ie_perm_sms_email` JAMAIS constitui consentimento — registrado em definitivo** (ata AQ-3 item 4). | AQ-3 | — |
| **D-10** | **Não existe bypass cross-tenant.** Os testes negativos **afirmam a impossibilidade**, não apenas a ausência de ocorrência. | AQ-6 | contrato de particionamento (URL + igualdade de claim) |
| **D-11** | **Enumeração de tenants = 12, pós-ADR-041**, pinada a partir da IG 1.1.0. O tenant aposentado e a zona técnica de aterrissagem não são tenants de negócio. O CodeSystem/ValueSet `amh-tenant` e a tabela de partições HAPI vigentes são **artefatos defasados**, a corrigir na IG 1.1.0 (ata AQ-6 item 3). **Nome do tenant piloto da V2: adiado pelo titular para a redação do contrato** (ata AQ-6 item 4; pendência 8 da ata §8). | AQ-6 | ADR-041 + invariante I-8 do AMH-020b |

### 5.2 Semântica de merge/unmerge adotada (conforme AMH-020b)

SOURCE, E9. A V2 adota a semântica do produtor, sem reinterpretá-la:

| Evento | Comportamento do identificador | Consequência para o replay na V2 |
|---|---|---|
| **Alias** (um ref deixa de ser canônico) | O ref antigo permanece **resolvível para sempre**; nunca é apagado nem reemitido | O replay de um instante passado resolve pelo grafo de aliases **como ele estava naquele instante**, via `resolve(ref, as_of)`; nunca re-chaveia avaliações passadas |
| **Merge** | Aliases do lado AMH; o consumidor não quebra | Avaliações anteriores mantêm o sujeito com que foram computadas; o vínculo aparece na proveniência (DOM-0002) |
| **Unmerge / split** | O sujeito que se separa recebe chave **nova**; a original permanece com o sujeito retido; **eventos históricos não são reescritos** | Avaliações históricas seguem atribuídas como originalmente computadas; correção é matéria de plano de dados, não reescrita de identificador |
| **Restore** (merge desfeito) | A aresta de alias é **revogada por carimbo, nunca apagada** | Replay anterior ao carimbo de revogação ainda enxerga o alias como vigente |
| **Apagamento (LGPD)** | O ref é **aposentado**, nunca reutilizado e nunca apagado; o mapeamento para a identidade de origem é rompido | O replay estrutural permanece possível; o sujeito deixa de ser reidentificável |

**Regra vinculante derivada:** um ref bem-formado porém desconhecido resulta em
`not_evaluated` — nunca em suposição (DOM-0004, SAF-0002). Um ref jamais é reemitido.

### 5.2.1 Eventos correlatos que NÃO são ciclo de vida de identidade (adendo da revisão 2026-08-15)

O prompt §7.4 exige especificar também *duplicata, reatribuição, óbito (deceased) e
alta (discharge)*, com consequências de replay. A distinção abaixo evita que estados de
encontro sejam confundidos com mutações de identidade — cada linha é rotulada:

| Evento | Natureza | Comportamento na V2 | Consequência de replay |
|---|---|---|---|
| **Reatribuição (reassignment)** — um encontro é re-vinculado a outro sujeito após correção de atribuição | Evento de ciclo de vida exposto por **OS-17** (derivação de engenharia sobre AQ-5; a ata enumera cinco tipos, OS-17 seis) — INFERENCE | Consumido como os demais eventos de D-08: ordenado por sujeito, idempotente, jamais reescreve fatos passados; o vínculo `(PSR, encontro)` anterior permanece na proveniência com a correção explícita (DOM-0002) | Avaliações históricas permanecem atribuídas como computadas; `resolve(ref, as_of)` responde a atribuição vigente no instante consultado |
| **Óbito (deceased)** | **Fato clínico-administrativo do encontro/paciente — NÃO é evento de identidade** (PROPOSAL desta revisão; o modelo canônico é ADR-0005) | Flui pela lane normal de fatos com proveniência e tempos próprios; **jamais aposenta ou re-emite o PSR** (a aposentadoria de ref é exclusiva de *erasure* LGPD — E9); o efeito sobre elegibilidade de avaliação é política clínica (ADR-0026/0027), nunca inferência da camada de identidade | Replay vê o óbito como fato datado; avaliações anteriores ao fato permanecem válidas como história |
| **Alta (discharge)** | Transição de estado do **encontro** — não de identidade (PROPOSAL desta revisão) | Fecha o escopo do encontro para novas avaliações conforme política de via; fato chega pela lane de encontro; alerta contra episódio encerrado é o hazard HAZ-0002 | Replay reconstrói o estado do encontro no instante consultado; avaliação pós-alta indevida é detectável por teste (V5/V7) |
| **Duplicata confirmada** | Resolução de duplicidade é **capacidade AMH** (fila de steward do ADR-006, parte não superada — ata §2 AQ-1); **a V2 nunca resolve duplicatas** (IDP-04/IDP-09, permanentes) | Se a AMH resolver, a V2 vê `alias`/`merge` pelo contrato v1; até lá, dois refs = dois sujeitos, estado correto | Sem consequência de replay além da semântica de alias/merge já adotada em §5.2 |

### 5.3 Escopo do que este ADR vincula

**Vincula:** o modelo de identidade de sujeito e encontro da V2; o campo de sujeito do
pacote de contrato AMH×IntensiCare v1; a chave de todo fato clínico persistido; a
semântica de ciclo de vida de identidade; a postura de base legal do loop clínico; o
conjunto de tenants usado em escopo e em testes negativos.

**Não vincula:** transporte, perfis FHIR além do elemento de identidade, mecanismo de
autenticação, modelo de autorização, esquema físico, grão interno de tenant da V2,
elegibilidade de vias clínicas.

### 5.4 Condições para que este ADR passe a `accepted`

| # | Condição | Responsável | Estado |
|---|---|---|---|
| C1 | O titular revisa **este texto** e o aceita (a direção já está decidida; a aceitação do ADR escrito é o ato pendente) | rodaquino-OMNI | **ABERTA** |
| C2 | Reconciliação item a item da §5.1 contra `adjudicacao-decisoes-2026-08-15.md` quando este aterrissar | orquestrador + este autor | **EXECUTADA 2026-08-15** pelo arquiteto de decisões de fronteira e modelo canônico (ver §5.5); divergências corrigidas a favor da ata; **confirmação do titular pendente no ato de aceitação** |
| C3 | Registro da decisão no `decision-register.md` com ID `GDEC-nnnn`, evitando colisão (nota de integração 2 do DEC-G0) | steward de governança | **ABERTA** |
| C4 | Atualização de `interim-identity-policy.md` marcando IDP-02 como superada por ADR-0004 (o dono daquele documento executa; este ADR não edita fora do seu escopo) | analista de adjudicação de identidade AMH | **ABERTA** |
| C5 | Registro do risco de concentração de autoridade no `risk-register.md` | steward de governança | **ABERTA** |

**Aceitar este ADR não torna o modelo verificado.** As condições de verificação estão em
§9 e dependem de entregas da AMH que ainda não existem.

### 5.5 Reconciliação executada contra a ata (2026-08-15)

**OBSERVED (este revisor).** Cada item de §5.1 foi confrontado com o teor exato da ata
`IDN-ADJ-2026-08-15` §2. Regra aplicada: **a ata prevalece**; divergência = correção
neste texto, registrada abaixo.

| Item | AQ da ata | Resultado da reconciliação |
|---|---|---|
| D-01 | AQ-1 | **CONFERE** — MPI por tenant; ADR-041 §6 em vigor |
| D-02 | AQ-1 | **CONFERE** — índice ADR-043 em vigor, apply travado no parecer DPO/jurídico; reabertura = redesenho (ADR-041 L145–147, citado pela ata) |
| D-03 | AQ-2 | **COMPLETADO** — acrescidos, do teor da ata: rebaixamento das extensões de `1..1`, derivação do tenant autoritativo por partição de URL + claim (item 2 da ata), padrão único de URL de profile (item 3) |
| D-04 | AQ-4 | **CORRIGIDO (forma)** — formato pleno `amh:psr:v1:<uuidv4>`; teor inalterado |
| D-05 | AQ-4 | **CONFERE** — ref independente de encontro, sempre qualificada; chave `(PSR, encontro)` literal na ata (item 4) |
| D-06 | AQ-4 | **CONFERE** — sintético em dev/test, mintado pela AMH em produção (item 2) |
| D-07 | AQ-4 | **CONFERE** — *"sem chave interna paralela"* literal; IDP-02 superseded |
| D-08 | AQ-5 | **CORRIGIDO** — a ata enumera **cinco** tipos obrigatórios (`alias`, `merge`, `unmerge`, `restore`, `erasure`) com **at-least-once + ordenação por sujeito**, que faltavam; a lista anterior de seis tipos era a de OS-17 (derivação), agora distinguida como tal; *"não se admite janela-teto"* incorporado |
| D-09 | AQ-3 | **COMPLETADO** — artigo legal (LGPD Art. 11, II, "f") e a cláusula definitiva sobre `ie_perm_sms_email` acrescidos do teor da ata |
| D-10 | AQ-6 | **CONFERE** — deriva documental; testes afirmam impossibilidade |
| D-11 | AQ-6 | **COMPLETADO** — artefatos defasados (CodeSystem/partições HAPI) e o adiamento do nome do tenant piloto acrescidos |
| §5.2 | AQ-5 / E9 | **CONFERE** com a semântica AMH-020b citada pela ata; §5.2.1 acrescido para cobrir reatribuição/óbito/alta/duplicata exigidos pelo prompt §7.4, com rótulos honestos (derivação/PROPOSAL, não teor da ata) |
| §6.2 | AQ-1 | **COMPLETADO** — o **requisito de produto vinculante** da ata (*"a UI da V2 DEVE exibir a limitação — 'registro limitado a esta instituição'"*) estava sub-representado como mitigação genérica; agora citado com fonte (ver §6.2) |

**Itens da ata sem correspondência prévia neste ADR, agora registrados:** alvo de
pinagem IG 1.1.0 *ainda não publicado* (ata §4 — já coberto por H1); pendências de
ratificação da própria ata (§8), em particular a contra-assinatura do titular
(pendência 1) — precondição de forma que este ADR herda e que aparece no gatilho T7.

---

## 6. Consequências

### 6.1 Positivas

- **A ambiguidade central acabou.** O campo de sujeito do contrato v1 pode ser escrito;
  o ADR-0005, o ADR-0013 e o ADR-0015 deixam de depender de uma incógnita.
- **O isolamento entre PJs passa a ser propriedade estrutural**, não promessa de
  configuração: refs diferentes por PJ tornam a junção indevida impossível por construção,
  e não apenas proibida (D1, D2).
- **Nenhum identificador cru de paciente entra no domínio clínico da V2** — reduz
  materialmente a superfície de PHI em logs, eventos, caches, URLs e quarentena (D4).
- **Uma única chave de sujeito**, não duas: elimina a migração futura e a reconciliação
  permanente que a Opção D imporia.
- **O replay deixa de ser uma esperança e vira requisito contratual** (D-08): a
  garantia do DOM-0003 passa a ter um mecanismo nomeado, com `as_of`.
- **A postura de base legal é explícita e revisável**, em vez de um portão decorativo
  sobre um log vazio.

### 6.2 Negativas — incluindo uma consequência clínica aceita

- **Fragmentação do paciente multi-PJ, visível ao clínico.** Um paciente atendido em mais
  de uma PJ do grupo aparecerá como sujeitos distintos, com históricos separados. À beira
  do leito, isso significa que um clínico pode não ver, na V2, um atendimento anterior do
  mesmo paciente em outra PJ. **Esta consequência é conhecida, foi explicitada e é aceita
  pela autoridade decisora, que é médico intensivista** — a alternativa (Opção B) foi
  julgada de exposição maior. A população afetada é medida: **4.220 pacientes (3,88%)**
  com atendimento em mais de uma PJ (ADR-041 L22, citado pela ata). **Mitigações
  obrigatórias:** (i) **requisito de produto derivado e VINCULANTE (ata AQ-1):** *"a UI
  da V2 DEVE exibir a limitação ao clínico — em linguagem equivalente a 'registro
  limitado a esta instituição'. Esta é uma obrigação de segurança clínica, não uma
  preferência de UX"* — a interface **não pode** sugerir completude longitudinal que não
  possui; a ausência precisa ser visível, não presumida (DOM-0004, SAF-0005). A ata
  encaminha este requisito ao especialista de UX/acessibilidade e ao
  `hazard-log.md` **como entrada nova — ainda não cunhada** (pendência 6 da ata §8;
  nenhum ID de hazard é inventado aqui); (ii) o índice cross-PJ do ADR-043, quando
  liberado juridicamente, restitui a correspondência de forma governada; (iii) **item de
  validação do Gate G1/G4**: apresentar a fragmentação a clínicos em cenário simulado e
  medir se ela é compreendida como fragmentação e não como ausência de história.
- **Dependência de três ordens de serviço da AMH.** IG 1.1.0 (H1), liberação dos portões
  SP-1…SP-7 do PSR (H3) e eventos de ciclo de vida + `resolve(ref, as_of)` (H4).
  **Enquanto essas três não aterrissarem, o modelo decidido não pode ser verificado — e,
  portanto, o Gate G3 não pode passar.** Decidido não é implantado; implantado não é
  verificado.
- **Sem chave própria, a V2 não persiste fatos clínicos de produção antes do PSR.** Não
  bloqueia esta fase (DEC-G0-03 restringe tudo a dados sintéticos), mas passa a ser
  caminho crítico para a operação sombra.
- **Concentração de autoridade.** O mesmo humano decide pelos dois lados da fronteira.
  Legítimo para papéis de decisão e registrado no DEC-G0; ainda assim, remove a fricção
  que uma contraparte externa naturalmente exerceria sobre um contrato de integração.
  Os pares implementador × verificador continuam valendo e são a mitigação real.
- **O item D-09 é uma leitura jurídica sem advogado.** Registrada como tal; reaberta se o
  parecer divergir.

### 6.3 Neutras / estruturais

- Nada aqui torna consumível o `Observation` da AMH: os bloqueios de fonte vazia e de
  forma (E14) são independentes e permanecem. Este ADR remove **um** dos quatro
  bloqueadores do consumo de Observation, não os quatro.
- A relação com a AMH segue reportada como `integration candidate` até o Gate G3.

---

## 7. Implicações transversais

| Dimensão | Implicação | Rótulo | Papel responsável | IDs |
|---|---|---|---|---|
| **Segurança clínica** | Atribuição de fato ao paciente/episódio errado é o dano-raiz que este modelo endereça; a fragmentação multi-PJ introduz um risco novo, de história incompleta lida como história ausente | INFERENCE de E4, §6.2 | AUTH-CLINSAFETY | HAZ-0001, HAZ-0002, HAZ-0004, HAZ-0027, HAZ-0038; SAF-0009, SAF-0029 |
| **Segurança** | Contexto de tenant é derivado do servidor e verificado, nunca asserido pelo cliente; ausência de bypass é afirmada por teste negativo; resolução de identidade **não** concede acesso | SOURCE de E12 + prompt §7.4 | AUTH-SECURITY | HAZ-0003, HAZ-0013, HAZ-0014; SAF-0007, SAF-0008; ADR-0015, ADR-0016 |
| **Privacidade (LGPD)** | Base legal do loop = tutela da saúde; propósito-de-uso e contexto profissional exigíveis; usos secundários bloqueados; ref opaco minimiza PHI na fronteira. **Nenhuma conformidade é declarada** — parecer brasileiro é gatilho obrigatório (DEC-G0-03) | VALIDATION REQUIRED | AUTH-PRIVACY-LEGAL (não nomeado) | SAF-0026; ADR-0017, ADR-0018 |
| **Interoperabilidade** | Consumidor valida sobre `identifier:mpiId`, pinado na IG 1.1.0; campo de sujeito do contrato v1 = `amh:psr:v1`; enumeração de 12 tenants pinada; nenhuma reutilização do contrato Maezo | SOURCE de E5, E11 + prompt §7.5 | AUTH-DATA-PLATFORM | ADR-0013; QAS-0013, QAS-0025 |
| **Acessibilidade** | A fragmentação multi-PJ e o estado `not_evaluated` por ref desconhecido precisam ser perceptíveis **sem depender de cor** e anunciados a tecnologia assistiva | INFERENCE | AUTH-UX | SAF-0005, SAF-0034; ADR-0021 |
| **Operacional** | Novo dever operacional: consumir e ordenar eventos de ciclo de vida, detectar lacunas nessa sequência e degradar de forma explícita quando `resolve(ref, as_of)` estiver indisponível | INFERENCE de D-08 | AUTH-OPERATIONS | SAF-0024, SAF-0025; ADR-0020 |
| **Custo** | Custo AMH: IG 1.1.0, liberação SP-1…SP-7, construção dos eventos e do endpoint de resolução. Custo V2: camada anticorrupção de identidade e suíte de testes negativos. **Nenhum modelo de custo existe; nenhum número é inventado aqui** | VALIDATION REQUIRED | AUTH-PRODUCT | — |
| **Migração** | Sem chave interna paralela, não há migração de chave a fazer — este é o principal ganho de migração da Opção A. Em contrapartida, qualquer fato sintético chaveado por PSR de desenvolvimento precisa de re-chaveamento ao entrar em produção, o que deve ser tratado como descarte, não como migração | INFERENCE | AUTH-OPERATIONS | ADR-0023 |

---

## 8. Reversibilidade, gatilhos de revisão, kill/rollback

### 8.1 Avaliação de reversibilidade

| Item decidido | Reversibilidade | O que fica encalhado ao reverter |
|---|---|---|
| D-01 MPI por tenant | **Moderada** — passar a longitudinal é aditivo (agrega correspondência); voltar de longitudinal para por-tenant seria muito mais caro | Nada estrutural; a correspondência entra como camada |
| D-02 índice cross-PJ | **Alta** — é um componente separado e governado, ligável e desligável | O índice e seu registro de auditoria |
| D-03 `identifier:mpiId` | **Alta** — mudança de validação e de pin de pacote | Suítes de conformidade pinadas na versão anterior |
| D-04/D-05 PSR + `(PSR, encontro)` | **Baixa** — é a chave de todo fato clínico persistido | Toda a base de fatos clínicos: reverter é migração de chave, com custódia de registro clínico e continuidade de auditoria |
| D-07 sem chave interna | **Baixa**, mesma razão | idem |
| D-08 eventos + `as_of` | **Alta** para adicionar; **baixa** para remover sem perder a certificação do replay | A garantia de replay |
| D-09 base legal | **Alta** no desenho, **baixa** depois de dado real | Registros tratados sob a base anterior |
| D-10/D-11 isolamento e tenants | **Alta** — pin e testes | Testes negativos pinados |

### 8.2 Gatilhos de revisão

| # | Gatilho | Detecção | Notificar | Ação |
|---|---|---|---|---|
| T1 | **Parecer DPO/jurídico emitido** (favorável ou não) sobre o ADR-043 / SP-6 | Registro de governança | rodaquino-OMNI | Habilita ou derruba D-02; se contrariar a base legal, reabre D-09 |
| T2 | **Portões SP-1…SP-7 do PSR liberados** (qualquer um deles) | Notificação de mudança AMH | AUTH-DATA-PLATFORM | Avança H3; reavalia o cronograma de D-06 |
| T3 | **Publicação da IG 1.1.0** | Detecção de deriva de contrato (QAS-0013) | AUTH-DATA-PLATFORM | Pinar o pacote; verificar H1 e H2; confirmar a enumeração de 12 tenants (D-11) |
| T4 | **Crescimento da fração multi-PJ** acima do que sustenta a premissa A2 | Medição de coorte quando houver dado | rodaquino-OMNI (autoridade clínica) | Reabre a ponderação entre D-01 e a Opção B; acelera D-02 |
| T5 | Produtor AMH passa a emitir `extension:mpiId` além do identifier, ou os dois divergem | Testes de conformidade | AUTH-DATA-PLATFORM | Definir precedência explícita (a AQ-2 opção C previa a pergunta) |
| T6 | Qualquer ambiente implantado revelar um claim de bypass cross-tenant | Testes negativos (D-10) | AUTH-SECURITY | **Parada** — o modelo de isolamento estaria falseado; reabrir D-10 e o Gate G6 |
| T7 | Aterrissagem do `adjudicacao-decisoes-2026-08-15.md` divergente da §5.1 | Reconciliação C2 | orquestrador | Corrigir este ADR a favor do registro |
| T8 | Entrada de um segundo humano com papel AUTH-* | Registro de governança | steward de governança | Reduzir a concentração de autoridade em §6.2 |

### 8.3 Kill switch / rollback

Enquanto `under-review`, não há o que desligar. As restrições vigentes são:

1. **Nenhum fato clínico de produção é persistido antes de a AMH mintar PSRs** (D-06).
   Este é, na prática, o kill switch: sem PSR de produção, não há base a reverter.
2. **Nenhuma correspondência cross-PJ existe antes do parecer jurídico** (D-02). O
   componente nasce desligado.
3. **Nenhum uso secundário é habilitado** (D-09).
4. Se o Gate G3 for tentado sem os eventos de ciclo de vida, a resposta correta é
   **reprovar o gate** (D-08) — não conceder compatibilidade parcial "com ressalva de
   replay". Uma ressalva aqui seria exatamente o tipo de gate consultivo que o prompt §3
   regra 13 proíbe e que o SAF-0030 rejeita.

---

## 9. Método de validação e evidência vinculada

| # | Afirmação a validar | Método | Ambiente | IDs vinculados |
|---|---|---|---|---|
| V1 | O elemento autoritativo chega populado, na versão pinada | Testes de contrato dirigidos pelo consumidor contra a IG 1.1.0 pinada, com fixtures válidas **e negativas deliberadas** | Ambiente AMH nomeado (**inexistente hoje além de dev**) | QAS-0025, QAS-0013; H1, H2 |
| V2 | Nenhum identificador cru de paciente atravessa a fronteira nem aparece em log, traço, evento, cache, URL ou quarentena | Varredura automatizada de padrões + inspeção de contrato; contagem alvo **zero** | CI + ambiente de teste | SAF-0026; QAS-0028 |
| V3 | Dois sujeitos sintéticos em tenants distintos que compartilhem um identificador de pessoa **nunca** são ligados por nenhuma consulta, view, índice ou caminho de cache | Teste negativo de isolamento | Teste (dados sintéticos) | TST-IDP-04; DOM-0001; HAZ-0013 |
| V4 | Tenant do token ≠ tenant da URL → rejeitado; header de partição do cliente → rejeitado; referência cross-partition → rejeitada; tenant sem partição → falha em vez de assumir padrão | Teste negativo de isolamento que **afirma a impossibilidade** | Ambiente nomeado | TST-IDP-05; D-10; HAZ-0003, HAZ-0014; SAF-0007 |
| V5 | Uma referência de sujeito despida da sua qualificação `(PSR, encontro)` é rejeitada em **todas** as camadas: armazenamento, cache, evento, consulta, assinatura e auditoria | Testes de propriedade adversariais por camada | Teste | TST-IDP-03, TST-DOM-0001; DOM-0001; QAS-0018 |
| V6 | Um ref bem-formado porém desconhecido produz `not_evaluated` com motivo contado e registrado — nunca um valor, nunca um não-disparo silencioso | Vetores de referência com motivo de não-disparo | Teste | TST-IDP-06; DOM-0004; SAF-0002, SAF-0019; HAZ-0021 |
| V7 | **Replay determinístico através de merge/unmerge**: uma avaliação histórica reproduz-se campo a campo resolvendo identidade **como estava naquele instante**, e não "agora" | Testes de replay sobre corpus com merge, unmerge, restore e apagamento, usando `resolve(ref, as_of)` | Teste + contrato | TST-DOM-0003; DOM-0003; QAS-0020; D-08 |
| V8 | Correções e aliases não sobrescrevem história; a revogação é carimbada e permanece visível | Testes de proveniência e correção | Teste | TST-DOM-0002; DOM-0002; QAS-0019; HAZ-0008, HAZ-0027; SAF-0014 |
| V9 | Identidade resolvida com propósito insuficiente é **negada** — provando que resolução e autorização são decisões independentes | Teste de autorização negativa | Teste | TST-IDP-08; DOM-0005; SAF-0009; D-09 |
| V10 | A fragmentação multi-PJ é compreendida pelo clínico como fragmentação, e não como ausência de história | Validação de fatores humanos em cenário simulado | Ambiente de usabilidade | VAL: pendente do backlog de validação; QAS-0017; §6.2 |

**Disciplina de marcadores.** `docs/05-clinical-safety/hazard-log.md` e
`safety-requirements.md` existem e são citados por ID real. O catálogo de requisitos
(`docs/04-product-requirements/`) **não existe**, portanto `REQ:` permanece marcador
literal. Os IDs `TST-IDP-*` e `TST-DOM-*` foram **lidos** de
`interim-identity-policy.md` e de `DOM-invariants.md`, não inventados aqui.

---

## 10. Relações de supersessão

- **Supera:** **IDP-02** — regra da política interina de identidade
  (`docs/08-interoperability/amh-data/identity-adjudication/interim-identity-policy.md`)
  que determinava chave interna de sujeito mintada pela V2. A premissa explícita daquela
  regra (*"at the pinned commit, no such contract is in force"*) caiu com D-04.
  **Nota de escopo:** IDP-02 é uma regra de política, não um ADR; a marcação de
  supersessão **naquele arquivo** cabe ao seu dono (condição C4), porque este ADR não
  edita fora de `docs/06-architecture/`.
- **Afeta sem superar:** IDP-01 (não selecionar modelo silenciosamente) — **cumprida**
  por este ADR, que é a seleção explícita que ela exigia. IDP-03, IDP-04, IDP-05, IDP-06,
  IDP-08, IDP-09 e IDP-11 permanecem vigentes e ganham base decidida. IDP-10 é absorvida
  em §5.2. IDP-07 é **modificada** por D-09 quanto ao loop clínico (o portão exigível
  passa a ser propósito + contexto profissional) e permanece vigente quanto a usos
  secundários e a falhar fechado.
- **Superado por:** nenhum.
- **Relação com o ADR-0001:** este ADR **melhora a linha de base de evidência** do
  ADR-0001 sem decidi-lo — a incerteza de identidade deixou de ser uma incógnita da
  fronteira. O ADR-0001 permanece `proposed`.

---

## 11. Autoverificação e registros de honestidade

### 11.1 Contra a lista de completude do template

Todos os campos obrigatórios da §10 do prompt presentes; seis alternativas além da
selecionada, cada uma com consequências positivas e negativas e com o que se perde ao
rejeitá-la; direcionadores discriminantes ligados a cenários de qualidade mensuráveis;
**nenhum alvo numérico inventado**; oito linhas de implicação transversal; reversibilidade,
gatilhos e kill/rollback presentes; método de validação com IDs reais de HAZ/SAF/TST/DOM e
marcadores literais onde o catálogo não existe; supersessão declarada; **nenhuma
tecnologia, nuvem, banco, broker ou framework escolhido**; nenhuma aprovação fabricada.

### 11.2 Registros de honestidade — o que um revisor deve olhar com desconfiança

1. **Concentração de autoridade.** Um único humano decide pelos dois lados de uma
   fronteira de integração. Legítimo e registrado (DEC-G0-04), mas remove a fricção que
   uma contraparte externa exerceria. Mitigação real: os pares implementador × verificador.
2. **O registro de adjudicação não foi lido pelo autor original** — ver o aviso de
   proveniência no topo. **Resolvido em 2026-08-15:** a ata foi lida em disco por um
   segundo especialista e a reconciliação C2 foi executada (§5.5). O que resta ao
   revisor humano: confirmar a reconciliação no ato de aceitação, e notar que a própria
   ata ainda aguarda contra-assinatura do titular (ata §0.3 e §8 pendência 1).
3. **Item D-09 é leitura jurídica sem advogado**, tomada por autoridade de negócio e
   clínica. DEC-G0-03 mantém o parecer como gatilho obrigatório.
4. **A consequência clínica de §6.2 foi aceita, não eliminada.** O paciente multi-PJ
   aparecerá fragmentado ao clínico. A aceitação por um intensivista é a melhor forma
   disponível de aceitação — não é uma prova de que o risco seja pequeno. V10 existe
   justamente para medi-lo.
5. **Decidido ≠ implantado ≠ verificado.** Três entregas AMH inexistentes separam este
   ADR de qualquer alegação de compatibilidade.
