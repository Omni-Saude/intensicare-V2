---
doc_id: IDN-ADJ-2026-08-15
label: OBSERVED
status: ATA DE DECISÃO — registrada por escriba; ratificação de contra-assinatura pendente
owner: rodaquino-OMNI — AUTH-DATA-PLATFORM (lado V2) e autoridade declarada do lado AMH (DEC-G0-04)
source: >
  Decisões do titular nomeado rodaquino-OMNI em 2026-08-15, comunicadas por delegação em
  sessão e transmitidas a este especialista pelo orquestrador de entrega; autoridade
  verificada em docs/00-governance/registers/g0-resolucoes-2026-08-15.md (DEC-G0-04,
  DEC-G0-03, DEC-G0-10). Evidência AMH subjacente pinada em
  Omni-Saude/amh-data-platform@0a07a6f1fab36fb2f5eeee0fcd8e945c95f67116.
date_collected: 2026-08-15
collector: analista de adjudicação de identidade e tenancy AMH (Onda 2), atuando como escriba
transformation: decisões transcritas e estruturadas no formato exigido; nenhuma decisão tomada por agente
confidence: alta quanto ao conteúdo transmitido; média quanto à cadeia de transmissão (ver §0)
last_updated: 2026-08-15
validation_status: >
  Contra-assinatura do titular REGISTRADA em 2026-08-15 (GDEC-0008 item 4; ver
  §0.3) — VALIDAÇÃO NECESSÁRIA remanescente: ratificação jurídica (§8)
---

# Ata de Adjudicação — Identidade, Tenancy e Consentimento AMH×IntensiCare

**Resolve:** `IDN-CONTRA-001` (registro de contradição) e as seis questões `AQ-1`…`AQ-6`
de `IDN-REQ-001`.

**Documentos afetados nesta pasta:**
[`contradiction-record.md`](./contradiction-record.md),
[`interim-identity-policy.md`](./interim-identity-policy.md),
[`adjudication-request-to-amh-owners.md`](./adjudication-request-to-amh-owners.md).

---

## §0. Procedência desta ata e seus limites

Esta seção existe porque a integridade epistêmica do registro depende de o leitor futuro
saber **exatamente como** a decisão chegou até aqui.

### 0.1 Autoridade — VERIFICADA

O titular nomeado é **rodaquino-OMNI**, CEO e acionista principal da OMNI e da AMH, médico
intensivista. A autoridade **não é uma afirmação deste documento**: ela está registrada em
`docs/00-governance/registers/g0-resolucoes-2026-08-15.md`, verificada por este especialista
em 2026-08-15. A entrada **DEC-G0-04** nomeia esta adjudicação de forma literal e antecipada:

> `rodaquino-OMNI assume AUTH-DATA-PLATFORM (lado V2) **e** declara deter a autoridade do
> lado AMH, na qualidade de CEO e acionista principal de ambas as empresas. Consequência
> imediata: as questões de adjudicação AQ-1..AQ-6
> (`docs/08-interoperability/amh-data/identity-adjudication/`) e as contradições C-1..C-4
> tornam-se respondíveis em sessão dedicada, deixando de depender de terceiros.`

Isso fecha as duas lacunas que `IDN-CONTRA-001` §5 registrava como abertas: a autoridade AMH
e a autoridade de identidade da V2 — que são, neste momento, a mesma pessoa.

### 0.2 Por que o rótulo desta ata é `OBSERVED` e não `DECIDED`

Duas razões independentes, ambas vinculantes:

1. `docs/00-governance/evidence-notation.md` §2 (regra 3) reserva o rótulo `DECIDED` à
   autoridade humana nomeada. **Nenhum agente pode auto-aplicá-lo**, nem mesmo quando
   transcreve uma decisão humana legítima.
2. O portão automatizado `scripts/check_doc_conventions.py` **reprova** qualquer documento
   cujo campo de status/rótulo de topo seja literalmente `DECIDED`, e instrui a registrar a
   ratificação no `decision-register.md` primeiro.

Este documento é, portanto, uma **ata**: registro OBSERVADO, por escriba, de decisões tomadas
por humano nomeado. **As decisões em si carregam os metadados `DECIDED`** nos blocos de §2 —
que é onde eles pertencem, e é o mesmo padrão já usado por `GDEC-0003` no
`decision-register.md`. O precedente de forma é o próprio `g0-resolucoes-2026-08-15.md`, que
registra dez decisões humanas sob `status: OBSERVED`.

### 0.3 Limite da cadeia de transmissão — VALIDAÇÃO NECESSÁRIA

As decisões chegaram a este especialista **por intermédio do orquestrador de entrega**, não
diretamente do titular. O conteúdo é consistente com a autoridade registrada em DEC-G0-04 e
com a política de idioma DEC-G0-10, e nada nele contradiz a evidência AMH pinada. Ainda
assim, e por disciplina de registro:

> **Pendência de forma (não de mérito):** recomenda-se que o titular **contra-assine** esta
> ata — ou que estas seis decisões sejam alocadas como entradas `GDEC-nnnn` no
> `decision-register.md` pelo steward de governança, conforme a nota de integração 2 do
> `g0-resolucoes-2026-08-15.md`. Até lá, a ata vale como registro fiel do que foi
> transmitido, e a V2 opera sob ela.

> **Contra-assinatura registrada em 2026-08-15 por decisão escrita do titular
> (GDEC-0008 item 4), transcrita por escriba; a ratificação jurídica (§8) permanece
> pendente do parecer OS-16 (BLK-0014).**

**Nenhuma decisão desta ata foi tomada por agente.** O escriba transcreveu, estruturou,
verificou a autoridade contra o registro e apontou as consequências e pendências.

### 0.4 Política de idioma

Este documento é redigido em **pt-BR** conforme **DEC-G0-10**. Os três documentos irmãos
desta pasta foram escritos em inglês no ciclo 0 e **permanecem válidos como evidência**; eles
recebem seções de decisão em pt-BR **acrescentadas**, sem reescrita do corpo original.

---

## §1. Metadados comuns a todas as seis decisões

```yaml
decided_by: rodaquino-OMNI   # CEO e acionista principal (OMNI e AMH); médico intensivista
decided_date: 2026-08-15
authority_record: docs/00-governance/registers/g0-resolucoes-2026-08-15.md — DEC-G0-04
via: delegação em sessão ("clear paths, technical excellence"), transmitida pelo orquestrador
scribe: analista de adjudicação de identidade e tenancy AMH (Onda 2)
supersession_rule_global: >
  Sujeito a revisão do titular a qualquer momento. Todas as cláusulas de natureza jurídica
  ficam condicionadas a ratificação por advogados da organização ANTES de qualquer
  tratamento de dados reais, operação sombra ou piloto (DEC-G0-03; gatilhos G6/G8).
evidence_pin: Omni-Saude/amh-data-platform@0a07a6f1fab36fb2f5eeee0fcd8e945c95f67116
```

---

## §2. As seis decisões

### AQ-1 — Escopo do MPI — **Opção C**

```yaml
id: AQ-1
status: DECIDED
decided_by: rodaquino-OMNI
decided_date: 2026-08-15
```

**Decisão.** MPI **por tenant** — o **ADR-041 §6 está EM VIGOR** — acrescido de um **índice de
correspondência cross-PJ governado** — o **ADR-043 está EM VIGOR**, e continua **condicionado
ao parecer DPO/jurídico antes do primeiro apply**, exatamente como o próprio ADR-043 exige em
seu cabeçalho (L5–6).

**Fundamento (rationale).** O isolamento por PJ é verificável por construção e não depende de
um portão de consentimento que hoje não tem produtor (ADR-045 L82–84). A correlação entre PJs
continua sendo um objeto próprio, auditável e revogável, em vez de uma propriedade implícita
do identificador. A opção preserva a possibilidade clínica de visão consolidada sem antecipar
o risco regulatório dela.

**Disposições dos artefatos:**

| Artefato | Disposição decidida |
|---|---|
| **ADR-041 §6** | **EM VIGOR** — é a semântica de escopo do `mpi_id`. |
| **ADR-043** | **EM VIGOR** — o cruzamento existe apenas como índice separado, com role dedicada; primeiro apply segue travado no parecer DPO/jurídico. |
| **ADR-006** | **SUPERSEDED quanto ao escopo de MPI.** Suas demais partes (método determinístico/probabilístico, fila de steward, RB-07) não são objeto desta decisão. |
| **ADR-039** | **Registro histórico.** Não é fonte normativa para a V2. |
| **IG README** — linguagem longitudinal (L171, L240, L244–246, L257) | **DEFEITO DOCUMENTAL** a corrigir no pacote **IG 1.1.0**. |

**Consequência clínica — ACEITA EXPLICITAMENTE.** Um paciente atendido em mais de uma PJ
aparece para a V2 como **sujeitos distintos**, sem reconciliação. A população é medida:
**4.220 pacientes (3,88%)** têm atendimento em mais de uma PJ (ADR-041 L22).

> **Requisito de produto derivado e vinculante:** a **UI da V2 DEVE exibir a limitação** ao
> clínico — em linguagem equivalente a *"registro limitado a esta instituição"*. Esta é uma
> obrigação de segurança clínica, não uma preferência de UX: um registro parcial apresentado
> como completo é um perigo. Encaminhar ao especialista de UX/acessibilidade e ao log de
> perigos (`docs/05-clinical-safety/hazard-log.md`) como entrada nova.

**Regra de supersessão específica.** Reabrir exige decisão do titular **mais** o parecer
DPO/jurídico do ADR-043 anexado; o próprio ADR-041 L145–147 registra que a reabertura é
**redesenho**, não incremento.

---

### AQ-2 — Elemento portador de identidade no fio — **Opção B**

```yaml
id: AQ-2
status: DECIDED
decided_by: rodaquino-OMNI
decided_date: 2026-08-15
```

**Decisão.**

1. **`identifier:mpiId` é o elemento autoritativo.** É o que o produtor efetivamente emite e o
   que o ADR-039 L65–67 já nomeava como sistema canônico.
2. **`extension:mpiId` e `extension:tenantId` são rebaixadas de `1..1`.** O tenant autoritativo
   passa a ser derivado da **partição de URL + claim do token**, não de uma extensão no
   recurso.
3. **Padrão único e autoritativo de URL de profile:** `https://fhir.americashealth.com.br/…`.
   Os carimbos `https://amh.health/fhir/StructureDefinition/BR*` do produtor batch
   (`bronze_to_fhir.py` L319–325, incluindo `OBS_PROFILE` em L325) são **defeito do produtor**,
   a corrigir.
4. **Publicação como pacote IG 1.1.0.** A **V2 pina 1.1.0**.

**Fundamento.** Alinha o contrato ao que o sistema realmente faz e ao mecanismo de isolamento
que realmente vigora (partição por URL com igualdade de claim — `partitioning-config.md`
L34–37, L62–64), em vez de exigir uma extensão que nenhum produtor emite. Elimina de uma vez
a contradição `IDN-C-2` na direção de menor risco: a que não obriga a reescrever 11,4 milhões
de recursos já produzidos.

**Consequência para a V2.** A V2 **não** valida contra `extension:mpiId`; valida contra
`identifier:mpiId` e deriva tenant do par URL/claim. O bloqueio de identidade sobre
`Observation` (cardinalidade `1..1`) **deixa de existir por decisão** — mas ver §6: o
`Observation` **continua não consumível** por três outros motivos.

**Regra de supersessão.** Revisão do titular; ou publicação de um IG que reintroduza
cardinalidade obrigatória em extensão, o que exigiria nova decisão e novo pin.

---

### AQ-3 — Base legal e portão do laço clínico — **Opção C**

```yaml
id: AQ-3
status: DECIDED
decided_by: rodaquino-OMNI
decided_date: 2026-08-15
legal_ratification: PENDENTE — advogados, antes de dados reais (DEC-G0-03)
```

**Decisão.**

1. A base legal do **laço clínico single-tenant em contexto de tratamento** é a **LGPD
   Art. 11, II, alínea "f" — tutela da saúde**, em procedimento realizado por profissionais
   de saúde / serviços de saúde.
2. **O laço clínico NÃO tem portão de consentimento.** O portão exigível dele é
   **propósito-de-uso + autorização de contexto profissional**.
3. **Consentimento aplica-se apenas a usos secundários** — pesquisa, analytics,
   compartilhamento — que permanecem **BLOQUEADOS** até existir infraestrutura real de
   consentimento.
4. **`ie_perm_sms_email` JAMAIS constitui consentimento** — registrado em definitivo. É
   permissão de contato; usá-la como base legal seria fabricá-la (ADR-045 L104 usa a
   expressão `fabricar base legal`).

**Fundamento.** Exigir consentimento para o laço assistencial imediato descreveria mal a base
legal aplicável e travaria o produto contra uma infraestrutura (`mpi.consent_log`) que hoje
tem **zero produtores** (ADR-045 L82–84). Separar tratamento de uso secundário coloca o
portão onde ele é de fato exigível e mantém os usos secundários bloqueados até haver
infraestrutura — sem inventar base legal para nenhum dos dois.

**Consequência para a V2.** `IDP-07` é **reenquadrada** (não revogada): deixa de ser um portão
de consentimento no caminho clínico e passa a ser (a) portão de **propósito-de-uso + contexto
profissional** no laço clínico, e (b) **bloqueio integral** de usos secundários. O `IDP-08`
(resolução de identidade ≠ autorização) torna-se, por consequência, **o controle primário** do
caminho clínico.

**Regra de supersessão — reforçada.** Esta é a cláusula de maior sensibilidade jurídica da
ata. Por **DEC-G0-03**, material jurídico produzido nesta fase é **sugestão**; a
qualificação da base legal **exige ratificação por advogados brasileiros antes de qualquer
tratamento de dados reais, operação sombra ou piloto** (gatilhos G6/G8). Até lá o
desenvolvimento prossegue **exclusivamente com dados sintéticos**. Registrar como pendência
jurídica de primeira ordem no `blockers-register.md`.

---

### AQ-4 — Identificador de fronteira — **Opção A, plena**

```yaml
id: AQ-4
status: DECIDED
decided_by: rodaquino-OMNI
decided_date: 2026-08-15
```

**Decisão.**

1. O **`portable_subject_ref` (PSR) É o identificador de fronteira OBRIGATÓRIO** do contrato
   AMH×IntensiCare v1.
2. **`IDP-02` fica SUPERSEDED.** A camada anticorrupção da V2 usa o **formato PSR
   nativamente desde o dia um** — **PSRs sintéticos** em dev/test, **mintados pela AMH** em
   produção. **Sem chave interna paralela** a reconciliar depois.
3. **SP-1…SP-7** deixam de ser condições externas indefinidas e viram **itens de trabalho
   AMH ordenados**, tendo o **parecer DPO/jurídico como única dependência externa**.
4. A referência é **independente de encontro**, porém **SEMPRE transmitida qualificada por
   encontro**; a **V2 chaveia fatos clínicos por `(PSR, encontro)`**.

**Fundamento.** Elimina a dívida de migração que a política interina aceitava: uma chave
interna provisória teria de ser reconciliada com a chave AMH mais tarde, justamente na camada
mais sensível do sistema. Adotar o formato definitivo desde o início custa menos e é mais
seguro. A qualificação por encontro dá à V2 o escopo clinicamente significativo sem obrigar a
AMH a mudar o grão de estabilidade do ref (`{amh_tenant, legal_entity}`, AMH-020b L91–99).

**Consequência para a V2.** Nenhum `mpi_id` cru, CPF ou identificador de fonte atravessa a
fronteira da V2 — o que é, além de decisão, o espelho do princípio XRD-05 (ADR-042 L93).
Formato normativo: `amh:psr:v1:<uuidv4>` (AMH-020b §1.1).

**Regra de supersessão.** Revisão do titular. Observação de forma: o parecer DPO/jurídico
continua sendo pré-condição do *apply* dos DDLs (AMH-020b L450–453, SP-1) — a decisão ordena o
trabalho, não dispensa o portão.

---

### AQ-5 — Eventos de ciclo de vida de identidade — **Opção A, vinculante**

```yaml
id: AQ-5
status: DECIDED
decided_by: rodaquino-OMNI
decided_date: 2026-08-15
```

**Decisão.** São **cláusulas OBRIGATÓRIAS do contrato v1**:

1. **Eventos de ciclo de vida de identidade** — `alias`, `merge`, `unmerge`, `restore`,
   `erasure` — com entrega **at-least-once** e **ordenação por sujeito**.
2. **Consulta `resolve(ref, as_of)`** — resolução ponto-no-tempo.

**Sem eles, replay afetado por identidade NÃO é certificável e o Gate G3 NÃO passa.**
**Não se admite janela-teto como paliativo.**

**Fundamento.** Um merge que a V2 conheça apenas por inferência é uma reescrita silenciosa da
história clínica. Sem resolução ponto-no-tempo, um replay resolve identidade "como é agora" e
não "como era então" — o que não é replay. A opção B (consulta sem `as_of`) e a opção C
(janela-teto) foram ambas rejeitadas por não sustentarem o caso de segurança.

**Consequência para a V2.** `IDP-10` deixa de ser proposta com ressalva e passa a ser
**requisito contratual vinculante**, com efeito direto no Gate G3. Vínculo com as invariantes
`DOM-0002` (cadeia de proveniência imutável) e `DOM-0003` (avaliação determinística e
replayável).

**Regra de supersessão.** Revisão do titular. Qualquer flexibilização exige reabrir o caso de
segurança do Gate G3, não apenas o contrato.

---

### AQ-6 — Enumeração de tenants e bypass cross-tenant — **Opção A**

```yaml
id: AQ-6
status: DECIDED
decided_by: rodaquino-OMNI
decided_date: 2026-08-15
```

**Decisão.**

1. **`cross_tenant_authorized` é deriva documental.** **NENHUM bypass existirá** em ambiente
   implantado. Os **testes negativos da V2 afirmam a impossibilidade** — não a mera ausência.
2. **Enumeração autoritativa = conjunto pós-ADR-041 (12 tenants de negócio).**
3. O **CodeSystem/ValueSet `amh-tenant`** (IG README L204) e a **tabela de partições do HAPI**
   (`partitioning-config.md` L41–45) são **artefatos defasados**, a corrigir no **IG 1.1.0**.
4. **Tenant piloto da V2:** nome **adiado** para a redação do contrato.

**Fundamento.** Uma role capaz de ler através de PJs é, na prática, um MPI global em tempo de
consulta — exatamente a propriedade que o ADR-043 L49–51 registra ter sido desmontada.
Declará-la inexistente e provar a impossibilidade por teste é coerente com a Opção C do AQ-1.

**Consequência para a V2.** `IDP-05` e `IDP-09` tornam-se **política permanente**. O
`TST-IDP-05` ganha um caso adicional: provar que nenhuma credencial com claim de bypass é
aceita.

**Regra de supersessão.** Revisão do titular; qualquer introdução futura de acesso cross-PJ
passa obrigatoriamente pelo índice do ADR-043 e pelo seu parecer DPO/jurídico — nunca por
claim de token.

---

## §3. Disposição consolidada dos artefatos AMH

| Artefato AMH (commit pinado) | Disposição decidida | Origem |
|---|---|---|
| `ADR-041` §6 — MPI por tenant | **EM VIGOR** | AQ-1 |
| `ADR-043` — índice cross-PJ | **EM VIGOR**, apply travado no parecer DPO/jurídico | AQ-1 |
| `ADR-006` — MPI longitudinal cross-tenant | **SUPERSEDED quanto a escopo de MPI** | AQ-1 |
| `ADR-039` — chave canônica e dívida | **Registro histórico** | AQ-1 |
| `ADR-042` XRD-05 + `AMH-020b` — PSR | **EM VIGOR e obrigatório** no contrato v1 | AQ-4 |
| `schemas/fhir-profiles/README.md` — linguagem longitudinal | **Defeito documental** → IG 1.1.0 | AQ-1 |
| `Patient-amh` / `Observation-amh-laboratory` — `extension:mpiId 1..1` | **Rebaixada** de `1..1` → IG 1.1.0 | AQ-2 |
| URLs de profile `amh.health/.../BR*` no produtor batch | **Defeito do produtor**, a corrigir | AQ-2 |
| CodeSystem/ValueSet `amh-tenant` (10 tenants, inclui `austa_clinicas`) | **Defasado** → IG 1.1.0 (12 tenants) | AQ-6 |
| Tabela de partições HAPI (`partitioning-config.md` L41–45) | **Defasada**, a corrigir | AQ-6 |
| `cross_tenant_authorized` (IG README L236, L279–280) | **Deriva documental**; nenhum bypass implantado | AQ-6 |
| `mpi.consent_log` — zero produtores (ADR-045 L82–84) | Irrelevante para o laço clínico; **bloqueia usos secundários** | AQ-3 |

---

## §4. Alvo de pinagem

| Item | Valor decidido |
|---|---|
| **Pacote IG alvo** | **1.1.0** — incorpora as correções de AQ-2, AQ-1 (linguagem) e AQ-6 (tenants) |
| **O que a V2 pina** | IG **1.1.0** (não 1.0.0) |
| **Estado atual do 1.1.0** | **AINDA NÃO PUBLICADO** — a V2 não pode pinar o que não existe |
| **Commit AMH de evidência** | `0a07a6f1fab36fb2f5eeee0fcd8e945c95f67116` — permanece a base de evidência histórica; **não** é o alvo de pinagem |
| **Identificador de fronteira** | `portable_subject_ref`, formato `amh:psr:v1:<uuidv4>` |
| **Chave de fato clínico na V2** | par `(PSR, encontro)` |

> **OBSERVAÇÃO DO ESCRIBA — VALIDAÇÃO NECESSÁRIA.** O IG 1.1.0 é, nesta data, um **alvo
> decidido, não um artefato existente**. Até sua publicação e verificação por digest, a V2
> não tem contrato pinável, e o Gate G3 permanece inalcançável por essa via. Isto **não é uma
> objeção à decisão** — é a consequência de calendário que ela cria, e que precisa aparecer
> no cronograma em vez de ser descoberta depois.

---

## §5. Rota de notificação de mudança

A rota decidida é o **documento de ordem de serviço AMH**, em produção **paralela** pelo
especialista do dossiê AMH. Ele carrega, para o lado AMH, os itens de trabalho gerados por
esta ata: publicação do IG 1.1.0, correção do produtor batch, correção do
CodeSystem/ValueSet `amh-tenant` e da tabela de partições, e o ordenamento de SP-1…SP-7.

> **Caminho não fixado aqui de propósito.** O documento ainda não existia no repositório na
> data desta ata (verificado em 2026-08-15). Registrar aqui um caminho presumido criaria uma
> referência quebrada. **Ação para o steward de governança:** ligar esta ata ao documento
> quando ele for publicado.

---

## §6. O que estas decisões **NÃO** desbloqueiam

Esta seção é a mais importante da ata para quem for planejar trabalho a partir dela.

### 6.1 `Observation` continua NÃO CONSUMÍVEL

O AQ-2 resolveu **uma** das quatro pernas do bloqueio de `Observation` registrado em
`IDP-12`. **Três permanecem abertas:**

| # | Perna | Estado após 2026-08-15 |
|---|---|---|
| 1 | **Identidade** — `extension:mpiId 1..1` com quatro significados | **RESOLVIDA POR DECISÃO** (AQ-1 + AQ-2), pendente de implementação AMH e do IG 1.1.0 |
| 2 | **População** — a fonte está vazia (`PACIENTE_EXAME` com zero linhas; Diagnose/LIS não ingerido) | **ABERTA** — nenhuma decisão a resolve; depende de ingestão real e de medição |
| 3 | **Forma** — o plano de desbloqueio registrado emite `code.text` + `valueString`, que não satisfaz o binding LOINC nem a fixação UCUM do profile | **ABERTA** |
| 4 | **Emissão** — o produtor não emite extensões e carimba profile fora do IG | **PARCIALMENTE ENDEREÇADA** (AQ-2 declara defeito e rebaixa a extensão); a correção do carimbo de profile permanece **trabalho AMH não executado** |

> **Conclusão explícita:** **`Observation` da AMH NÃO é consumível pela V2** nesta data.
> Nenhuma via clínica que dependa de observação laboratorial ou de sinal vital pode ser
> declarada elegível. Uma regra de limiar numérico não consome `valueString`, e nenhuma regra
> consome um fato que não existe na fonte.

### 6.2 Demais itens que permanecem bloqueados

- **Usos secundários** (pesquisa, analytics, compartilhamento) — bloqueados por AQ-3 até
  existir infraestrutura real de consentimento.
- **Primeiro apply do índice ADR-043** — travado no parecer DPO/jurídico (AQ-1).
- **Apply dos DDLs de PSR** — SP-1, portão DPO/Legal (AQ-4).
- **Qualquer tratamento de dados reais** — travado em ratificação jurídica (DEC-G0-03).
- **Gate G3** — inalcançável: exige contrato publicado e pinável (IG 1.1.0 inexistente),
  ambiente verificável e dados populados. Camadas 2, 3 e 4 de evidência seguem sem
  observação.
- **Sinais vitais** — nenhuma decisão desta ata os torna disponíveis; a questão Q1 do dossiê
  segue aberta.

---

## §7. Efeitos nos documentos desta pasta

| Documento | Efeito |
|---|---|
| [`contradiction-record.md`](./contradiction-record.md) | `IDN-C-1`…`IDN-C-5` recebem seções **"Resolução (2026-08-15)"** em pt-BR; corpo em inglês preservado |
| [`interim-identity-policy.md`](./interim-identity-policy.md) | `IDP-02` SUPERSEDED; `IDP-07` reenquadrada; `IDP-12` re-baselineada; demais regras classificadas em **permanente** × **interina** |
| [`adjudication-request-to-amh-owners.md`](./adjudication-request-to-amh-owners.md) | Perguntas **respondidas**; o documento permanece como registro do pedido e da evidência que o fundamentou. Seu valor residual é servir de insumo à ordem de serviço AMH (§5) |

---

## §8. Ratificações e pendências que esta ata **não** fecha

| # | Pendência | Responsável | Gatilho |
|---|---|---|---|
| 1 | Contra-assinatura desta ata / alocação de IDs `GDEC-nnnn` | titular + steward de governança | integração dos registros |
| 2 | Ratificação jurídica da base legal do AQ-3 | advogados da organização | antes de dados reais (G6/G8), DEC-G0-03 |
| 3 | Parecer DPO/jurídico do ADR-043 | DPO/Legal AMH | antes do primeiro apply do índice |
| 4 | Portão DPO/Legal dos DDLs de PSR (SP-1) e demais SP-2…SP-7 | DPO/Legal + owner + stewards + Security Lead AMH | antes de apply, grant, segredo, backfill ou tráfego |
| 5 | Publicação e verificação por digest do IG 1.1.0 | AMH | antes de qualquer pin da V2 |
| 6 | Requisito de UI "registro limitado a esta instituição" (AQ-1) | AUTH-UX + segurança clínica | antes do Gate G2/G4 |
| 7 | Ratificação da taxonomia de IDs `IDN`/`IDP` (`GDEC-0002`) | steward de governança | integração dos registros |
| 8 | Nome do tenant piloto da V2 (AQ-6) | titular | redação do contrato |

---

*Ata registrada pelo analista de adjudicação de identidade e tenancy AMH (Onda 2), atuando
como escriba. Nenhuma decisão foi tomada por agente. Nada foi escrito no repositório AMH.
Nenhum dado pessoal, credencial ou segredo aparece neste documento. A autoridade do titular
foi verificada contra `docs/00-governance/registers/g0-resolucoes-2026-08-15.md` (DEC-G0-04)
antes do registro.*
