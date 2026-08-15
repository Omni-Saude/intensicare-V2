---
doc_id: CONF-V1-MAPEAMENTO-SEGURANCA-TENANT
title: Mapeamento de segurança e contexto de tenant/entidade legal por interface do contrato v1
status: PROPOSAL
owner: UNASSIGNED — VALIDATION REQUIRED
collector: engenheiro de camada anticorrupção e conformidade AMH (ciclo 1)
source: >
  INTENSICARE_V2_ORCHESTRATOR_PROMPT.md §3 regra 6 ("Do not infer tenant, patient, encounter,
  unit, or authorization context from caller-controlled values"), §7.6 e Gate G3;
  docs/08-interoperability/amh-data/contract-v1/contract-manifest.draft.yaml (subject.proibicoes,
  security_classification, security_privacy_responsibilities, purpose_model);
  docs/08-interoperability/amh-data/contract-v1/eventos-ciclo-de-vida-identidade.md §2 e §4.2;
  docs/08-interoperability/amh-data/identity-adjudication/adjudicacao-decisoes-2026-08-15.md
  (AQ-3, AQ-4, AQ-6 — DECIDIDO por rodaquino-OMNI, 2026-08-15);
  docs/08-interoperability/amh-data/contract-inventory.md A7 (contradição C-2, aberta);
  docs/05-clinical-safety/hazard-log.md (HAZ-0001, HAZ-0002, HAZ-0003, HAZ-0013, HAZ-0014, HAZ-0027)
date_collected: 2026-08-15
last_updated: 2026-08-15
---

# Mapeamento de segurança e contexto de tenant — contrato v1

> **Status: PROPOSAL.** Desenho de controle. **Nenhum mecanismo de autenticação, formato de
> credencial, topologia de rede ou produto é escolhido** — a superfície de autenticação da AMH
> está registrada como **CONTRADITÓRIA em três vias** (`contract-inventory.md` A7, contradição
> C-2, **aberta**), e a escolha pertence ao ADR de fronteira. Este documento fixa **o que deve
> ser verdade**, não **com o quê**.

## 1. A regra que governa todo o documento

**SOURCE — regra não-negociável §3.6:** *"Do not infer tenant, patient, encounter, unit, or
authorization context from caller-controlled values."*

**INFERENCE.** Na fronteira AMH×V2 essa regra atua em **três direções distintas**, e confundi-las
é o erro que o legado cometeu:

| Direção | Quem é o "chamador" | O risco concreto |
|---|---|---|
| **D-A — V2 recebe eventos** (IF-01..IF-06) | O produtor (ou quem conseguir se passar por ele) | O envelope **traz** `amh_tenant` e `legal_entity`. Se a V2 confiar neles sem verificação, o tenant vira valor controlado pelo emissor — **HAZ-0003** exatamente (*"tenant context derived from a caller-controlled value"*, com precedente legado **E1**: *"Caller header wins; equality check is tautological"*) |
| **D-B — V2 chama `resolve`** (IF-07) | A própria V2 | Se o escopo enviado vier de parâmetro escolhido por quem disparou a consulta (tela, job, integração), a V2 se torna o veículo do desvio — **HAZ-0013** |
| **D-C — V2 serve seus próprios usuários** | Clínico/operador | O resultado de identidade não pode ampliar o que o usuário já podia ver. Fora do escopo deste documento (é ADR-0017/0018), citado para que a cadeia não tenha buraco |

## 2. Onde vive o contexto autoritativo

**PROPOSAL.** Na V2, o contexto de tenant/entidade legal usado em qualquer decisão é derivado de
**duas fontes, e de nenhuma outra**:

1. **A identidade verificada da origem** (do produtor em D-A; da própria V2 em D-B), estabelecida
   pelo canal — mecanismo por decidir.
2. **A enumeração autoritativa pinada**: os tenants pós-ADR-041 (**DECIDIDO, AQ-6**), **pinados da
   IG 1.1.0** e nunca transcritos (`contract-manifest.draft.yaml`,
   `supported_tenants.enumeracao_autoritativa`; OS-03 critério 4).

**Consequência operacional dura.** A IG 1.1.0 **não existe** e não tem digest
(`ig_dependency.package_digest: null`, `pinned: false`). Portanto **a enumeração autoritativa
ainda não é pinável**, e nenhuma verificação de pertinência de tenant é hoje executável contra
fonte autoritativa. Manter uma lista local editável no lugar dela recriaria o defeito que a
pinagem existe para impedir. **Este é um bloqueio registrado, não contornado.**

## 3. D-A — Verificação na recepção de eventos (IF-01..IF-06)

**PROPOSAL — cinco verificações, todas fail-closed, nesta ordem.** Falha em qualquer uma ⇒ **EC-3**
(rejeição + alarme de segurança), nunca aceitação parcial.

| # | Verificação | Por que existe | Falha ⇒ |
|---|---|---|---|
| **V-1** | **Autenticidade da origem** pelo canal (não pelo conteúdo da mensagem) | Sem ela, todos os campos do envelope são texto de quem quiser enviá-lo | Rejeição; nenhuma mensagem não autenticada entra sequer em quarentena de conteúdo |
| **V-2** | `amh_tenant` e `legal_entity` **pertencem à enumeração pinada** | Impede tenant inventado ou aposentado (ADR-0004 D-11 distingue tenant de negócio de tenant aposentado e da zona técnica) | Rejeição + alarme de deriva |
| **V-3** | O par `{amh_tenant, legal_entity}` **está dentro do escopo autorizado** para aquela origem/lane | É a diferença entre "o emissor disse" e "o emissor pode" — a igualdade que o legado tornou tautológica | Rejeição + alarme de segurança |
| **V-4** | **Coerência interna de escopo**: `subject_ref_antiga` e `subject_ref_nova` pertencem ao **mesmo** par `{amh_tenant, legal_entity}` | O PSR é estável **dentro** desse par (`subject.escopo_de_estabilidade`). Uma transição que cruze o par **uniria históricos clínicos de entidades legais distintas** | Rejeição + alarme de **segurança e de segurança clínica** — ver §3.1 |
| **V-5** | O tenant do envelope **não amplia** escopo: serve para **rotear dentro** do escopo já autorizado, nunca para conceder acesso | Impede que a mensagem seja o próprio mecanismo de autorização | Rejeição |

### 3.1 A regra de maior consequência desta lane

**INFERENCE, de alta consequência.** Um `identity.merge.v1` (ou `alias`) cujas refs pertençam a
pares `{amh_tenant, legal_entity}` diferentes **não é um fato a aplicar**: é uma violação. Aplicá-lo
uniria históricos clínicos entre entidades legais — simultaneamente **HAZ-0003/HAZ-0013**
(divulgação de PHI entre entidades legais) e **HAZ-0027** (histórico clínico erroneamente unido,
com o clínico vendo estabilidade que o registro completo contradiz).

**Postura exigida:** rejeitar, alarmar e **nunca** tratar como caso de negócio a acomodar.
A V2 **não resolve duplicidade** — capacidade que o ADR-0004 §5.2.1 registra como **exclusivamente
AMH** (*"a V2 nunca resolve duplicatas"*).

**DECIDIDO (AQ-6)**, transcrito: *"nenhum bypass cross-tenant existe ou existirá; partição por URL
+ igualdade de claim, sem exceção. A V2 mantém teste negativo que afirma a IMPOSSIBILIDADE do
bypass."* O teste negativo correspondente é CTS-18/CTS-19.

## 4. D-B — Verificação na chamada de `resolve` (IF-07)

| # | Regra | Racional |
|---|---|---|
| **R-1** | O escopo `{amh_tenant, legal_entity}` da chamada vem da **identidade de serviço verificada da V2 e do escopo autorizado**, **jamais** de parâmetro escolhido por quem disparou a consulta | §3.6; **HAZ-0013** |
| **R-2** | `as_of` é **sempre explícito** (nunca omitido) | Determinismo (DOM-0003); ver `mapeamento-semantico.md` §5 |
| **R-3** | A resposta é **vinculada ao escopo do canal**, não ao conteúdo — porque a resposta **não ecoa** escopo (**L-14**) | Sem eco, o payload não é auto-verificável |
| **R-4** | Refs retornadas na cadeia de alias que estejam **fora** do escopo autorizado ⇒ tratar a resposta inteira como **violação de contrato**: descartar, alarmar, **não** usar parcialmente | Defesa em profundidade: a V2 verifica o produtor mesmo quando o produtor deveria ter verificado |
| **R-5** | Negativa fail-closed (EC-6) **nunca** é convertida em resolução "atual" nem em suposição | Contrato §4.1; DOM-0004 |
| **R-6** | Cache **somente** por chave completa `(ref, as_of, escopo)`; nunca por `ref` isolada | Cache por chave parcial é vazamento entre escopos e quebra de determinismo |

**Nota de acoplamento (CONF-Q-01/CONF-Q-02).** Se `resolve` estiver no caminho de leitura clínica,
sua indisponibilidade degrada a avaliação; se for apenas conferência de integridade, degrada a
auditoria. As duas posturas têm consequências de segurança diferentes e **a escolha não é feita
aqui**.

## 5. O que **NUNCA** é aceito do chamador

**PROPOSAL** — lista fechada, verificável por teste negativo. Cada linha é uma proibição
**absoluta**, não uma preferência de desenho.

| # | Nunca aceito | Onde apareceria | Consequência se aceito |
|---|---|---|---|
| **N-01** | Tenant ou entidade legal como **parâmetro, cabeçalho ou campo que determine escopo de acesso** | D-A: envelope usado como autorização; D-B: parâmetro de chamada | **HAZ-0003** — precedente legado literal: *"Caller header wins"* |
| **N-02** | Qualquer indicador de **bypass cross-tenant** (sinalizador, claim, flag, "modo administrativo") | Qualquer interface | **AQ-6** eliminou o bypass documental; reintroduzi-lo por parâmetro anularia a decisão |
| **N-03** | `mpi_id` cru, em qualquer forma, inclusive "opaco-opcional" | Envelope; resposta de `resolve` | **AQ-4/XRD-05** — proibição explícita; presença é violação de contrato (invariante 1) |
| **N-04** | CPF, prontuário ou qualquer identificador de sistema de origem | Envelope; logs; fixtures | Invariante 1; fixture `erasure.identificador-de-fonte-cru.invalid.json` existe **para ser rejeitada** |
| **N-05** | Identidade de paciente derivada de identificador escolhido pelo chamador | D-B e superfícies internas | **HAZ-0001** — precedente legado: busca por `mpi_id` apenas |
| **N-06** | Encontro **inferido** a partir do PSR (ou de proximidade temporal) | Aplicação de transições (L-03) | **HAZ-0002**; a chave é `(tenant, PSR, encontro)` — inferir o encontro é fabricar contexto clínico |
| **N-07** | Unidade, leito ou setor vindos do chamador | Superfícies internas | §3.6 |
| **N-08** | `purpose_of_use` fora do vocabulário fechado (`tratamento` no v1) | Chamada de `resolve`; contexto de consumo | `purpose_model`: *"Qualquer outro propósito é rejeitado fail-closed"* |
| **N-09** | Consentimento derivado de permissão de contato (`ie_perm_sms_email` ou equivalente) | Qualquer inferência de base legal | **DECIDIDO AQ-3**: *"Jamais deriva de `ie_perm_sms_email` ou de qualquer permissão de contato — verificável em teste"* |
| **N-10** | Claims de autorização **autoafirmadas** pelo chamador em vez de validadas pelo emissor de identidade | D-A e D-B | **HAZ-0014** — precedente legado: *"Fail-open identity: IAM validation falls back to local JWT on any error"* |
| **N-11** | Tempo clínico fornecido pelo chamador para substituir tempo ausente | Tradução de envelope | Regra §3-8; **HAZ-0007** |
| **N-12** | Enumeração de tenants vinda de lista local editável em vez do artefato pinado | Verificação V-2 | Recria a "segunda fonte de verdade" que a pinagem existe para impedir |

## 6. Finalidade e base legal na fronteira

**DECIDIDO (AQ-3 = C)**, transcrito do manifesto: base legal de **tutela da saúde** (LGPD Art. 11,
II, "f") para o laço clínico single-tenant em contexto de tratamento; **sem gate de
consentimento** no loop clínico; o gate exigível é **propósito-de-uso + autorização de contexto
profissional**; usos secundários **bloqueados**.

| Consequência para a camada anticorrupção | Regra |
|---|---|
| Vocabulário de propósito é **fechado** e mono-valorado no v1 | Propósito diferente ⇒ rejeição fail-closed (N-08) |
| **Não** existe campo `consent_decision_ref` no envelope (PROPOSAL da minuta, ponto N-6 em negociação) | A camada anticorrupção **não** cria um campo equivalente localmente: fabricar um gate inexistente é o risco que a OS-13 critério 3 manda evitar |
| Ratificação jurídica é **pré-condição de dado real** | **VALIDATION REQUIRED**; até lá, **dados sintéticos exclusivamente** (DEC-G0-03). Nenhum controle descrito aqui autoriza dado real |

## 7. Auditoria, logs e quarentena — sem PHI

**PROPOSAL**, elaborando `security_privacy_responsibilities` do manifesto (*"Toda resolução de ref
e todo consumo de evento são auditáveis por `event_id`/`idempotency_key`; retenção de log:
VALIDATION_REQUIRED"*).

| Superfície | Pode conter | **Não pode conter** |
|---|---|---|
| Trilha de auditoria de eventos | `event_id`, `idempotency_key`, tipo, escopo, tempos, veredicto da verificação | Payload clínico; identificador de fonte; qualquer valor que reconstitua identidade fora da ref opaca |
| Trilha de `resolve` | Quem chamou, quando, qual ref opaca, qual `as_of`, veredicto | idem |
| **Quarentena** | Envelope retido íntegro — **inclusive** o identificador de fonte quando ele for o motivo da rejeição | — |
| Alarmes e métricas | Contagens por classe de erro, por escopo | Refs em texto de alarme que atravesse fronteira de escopo |

**Regra específica da quarentena.** A quarentena é o único lugar que legitimamente reterá um
envelope contendo o que **não deveria** ter atravessado (caso da fixture
`erasure.identificador-de-fonte-cru.invalid.json`). Ela é, portanto, **superfície concentrada de
dado sensível**: acesso segregado, escopo por tenant, e retenção sujeita à mesma determinação
legal pendente (ADR-0005 §7; ADR-0018). **Nada disso é decidido aqui.**

## 8. Testes negativos exigidos

Especificados em [`cenarios-teste-consumidor.md`](./cenarios-teste-consumidor.md): **CTS-18**
(transição cruzando `{amh_tenant, legal_entity}` ⇒ rejeição), **CTS-19** (`resolve` com escopo
não autorizado ⇒ negativa, e a impossibilidade do bypass afirmada como propriedade), **CTS-20**
(identificador de fonte cru no envelope ⇒ rejeição, usando a fixture inválida existente),
**CTS-21** (propósito fora do vocabulário ⇒ rejeição).

**Restrição registrada:** um teste negativo executado apenas contra emulador escrito pela V2
demonstra que **a V2 recusa** — não que **a AMH impede**. A afirmação de impossibilidade exigida
por AQ-6 só é evidência quando executada contra a interface real, em ambiente nomeado (camada 2).

## 9. O que este documento **não** decide

Mecanismo de autenticação e autorização (C-2 permanece **aberta**); formato ou ciclo de vida de
credencial; topologia de rede; criptografia em trânsito/repouso; política de retenção de log;
rota e SLA de resposta a incidente (**VALIDATION REQUIRED** no manifesto); nomeação de qualquer
dono.

## 10. Questões abertas deste documento

| # | Questão | Para quem |
|---|---|---|
| **CONF-Q-15** | Qual mecanismo estabelece a identidade verificada da origem em D-A, por ambiente? (C-2 aberta) | ADR de fronteira + dono AMH |
| **CONF-Q-16** | Enquanto a IG 1.1.0 não existir, contra que artefato a verificação V-2 se faz — ou a lane permanece bloqueada? | Dono AMH + ADR de fronteira |
| **CONF-Q-17** | A AMH garante, do seu lado, que nenhuma transição cruza `{amh_tenant, legal_entity}` — e isso é verificável pelo consumidor? | Dono AMH |
| **CONF-Q-18** | Retenção de log de auditoria e de quarentena, e rota de incidente | Dono AMH + AUTH-PRIVACY-LEGAL (não nomeado) |

---

*Redigido pelo engenheiro de camada anticorrupção e conformidade AMH (ciclo 1). Nenhum mecanismo
de segurança escolhido; nenhuma conformidade declarada; nenhuma decisão registrada; nenhum dono
nomeado. Nada escrito em `contract-v1/`, em ADRs, em registros ou no repositório AMH. Sem PHI,
credenciais, tokens ou identificadores reais.*
