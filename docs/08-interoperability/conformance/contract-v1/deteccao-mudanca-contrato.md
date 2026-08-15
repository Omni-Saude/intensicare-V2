---
doc_id: CONF-V1-DETECCAO-MUDANCA-CONTRATO
title: Detecção de mudança e deriva do contrato v1 — sinais, respostas e o que jamais é coagido em silêncio
status: PROPOSAL
owner: UNASSIGNED — VALIDATION REQUIRED
collector: engenheiro de camada anticorrupção e conformidade AMH (ciclo 1)
source: >
  docs/08-interoperability/amh-data/contract-v1/contract-manifest.draft.yaml (manifest_sha256,
  compatibility_policy, deprecation_window, change_notification_route, ig_dependency, fixtures);
  docs/08-interoperability/amh-data/contracts.lock.draft.yaml (accepted:false; contract_v1_draft
  pinned:false digest:null; fhir_package.package_digest:null; terminology_versions_pinned:false;
  required_but_absent); docs/08-interoperability/amh-data/contract-v1/eventos-ciclo-de-vida-identidade.md
  §2 (invariante 6, tolerant reader); docs/06-architecture/quality-attributes/quality-attribute-scenarios.md
  QAS-0013 (Connector contract drift detection — VALIDATION REQUIRED);
  docs/06-architecture/adrs/ADR-0005-modelo-canonico-*.md §8.2 gatilho T3 (proposed);
  INTENSICARE_V2_ORCHESTRATOR_PROMPT.md §7.5, §7.6 e Gate G3
date_collected: 2026-08-15
last_updated: 2026-08-15
---

# Detecção de mudança de contrato — desenho da vigilância de deriva

> **Status: PROPOSAL.** Desenho. **Nenhuma tecnologia, ferramenta, agendador ou formato de
> verificação é escolhido.** O que segue são sinais, respostas e invariantes — o *como* pertence
> ao stack, que não tem ADR.

## 1. O estado honesto: o mecanismo existe no papel e está **inoperante**

**OBSERVADO** em `contracts.lock.draft.yaml` (lock **DRAFT — NOT ACCEPTED**, `accepted: false`):

| Item que a detecção de deriva precisaria comparar | Valor hoje | Consequência |
|---|---|---|
| `contract_v1_draft.digest` | `null`, `pinned: false` | Não há digest de manifesto contra o qual comparar |
| `amh_intensicare_manifest_path` / `_digest` | `null` — *"No manifest exists to digest."* | O artefato de referência **não existe** |
| `fhir_package.package_digest` | `null`, `VALIDATION_REQUIRED` (IG 1.1.0 não publicada) | A enumeração autoritativa de tenants não é pinável |
| `terminology_versions_pinned` | `false` | Versões de terminologia não pinadas |
| `contract_semantic_versions`, `lifecycle_status`, `compatibility_policy` | `null` — *"No contract has been defined."* | Não há política de compatibilidade **vigente**, apenas proposta (`BACKWARD`, PROPOSAL) |

**INFERENCE.** Deriva de contrato só é detectável contra uma **referência pinada**. Nenhuma
referência pinada existe. Portanto: **a V2 hoje não consegue detectar deriva de contrato desta
fronteira** — não por falta de desenho, mas por falta de contrato. Este documento especifica o
que passa a operar **no instante em que o primeiro pin existir**, e registra a lacuna até lá em
vez de simulá-la resolvida.

**QAS-0013** (*Connector contract drift detection*) está registrado com alvo **VALIDATION
REQUIRED** — coerente com o acima.

## 2. Inventário de pins que a detecção exige

**PROPOSAL** — o conjunto mínimo. Cada linha é uma comparação possível **somente** quando o valor
deixa de ser `null`.

| # | Pin | O que passa a ser detectável | Estado |
|---|---|---|---|
| **P-1** | Digest do **manifesto publicado** pela AMH | Qualquer alteração do contrato como um todo | Inexistente |
| **P-2** | Commit produtor AMH que publicou o pacote | Republicação a partir de outro commit | `VALIDATION_REQUIRED` |
| **P-3** | Versão semântica do contrato (`contract_semver`) | Mudança compatível (minor) × incompatível (major) | `null` |
| **P-4** | `event_type_version` esperada por tipo | Envelope versionado adiante do pinado | Declarada na minuta (`"1"`), não pinada |
| **P-5** | Digest de cada **fixture** publicada | Mudança de exemplo canônico (sinal precoce de mudança semântica) | Todos `sha256: null` |
| **P-6** | Digest do pacote IG (`br.com.americashealth.fhir` 1.1.0) | Mudança de profiles/bindings e da **enumeração de tenants** | Inexistente (1.1.0 não publicada) |
| **P-7** | Versões de terminologia | Deriva de código/unidade (HAZ-0032) | Não pinadas |
| **P-8** | Versão da **porta** V2 correspondente | Que versão interna interpretou qual versão externa | Definido por este diretório (§6) |

## 3. Sinais de deriva

| ID | Sinal | Como aparece | Detectável hoje? |
|---|---|---|---|
| **D1** | **Digest do manifesto diverge do pin** | Verificação de pin falha | Não (sem pin) |
| **D2** | **Versão de evento desconhecida** | `event_type_version` ≠ pinada, ou `event_type` com sufixo `.vN` novo | Sim, contra a minuta — como sinal, não como conformidade |
| **D3** | **Campo adicional desconhecido aparece** | *Tolerant reader* aceita a mensagem; o contador de campos desconhecidos sobe | Sim |
| **D4** | **Campo obrigatório do envelope mínimo desaparece** | Invariante do envelope falha em mensagens **antes válidas** | Sim |
| **D5** | **Digest de fixture diverge** | Exemplo canônico mudou sem mudança de versão | Não (digests `null`) |
| **D6** | **Versão/digest do pacote IG muda** | Novo pacote publicado (gatilho **T3** do ADR-0005) | Não (1.1.0 inexistente) |
| **D7** | **Enumeração de tenants muda** | Tenant novo, removido ou renomeado na IG pinada | Não |
| **D8** | **Divergência manifesto × artefato publicado** | O manifesto descreve o que o artefato não é | Não |
| **D9** | **Deriva semântica sem sinal de esquema** | O campo continua igual; **o significado muda** (p.ex. `occurred_at` passa a ser tempo de ingestão; `merge` passa a implicar re-chaveamento) | **Não por inspeção** — ver §5 |
| **D10** | **Tipo de evento não contratado chega** | P.ex. `identity.reassignment.v1` se o titular confirmar cinco tipos (CONF-Q-08/N-8) | Sim |
| **D11** | **Comportamento de `resolve` muda** | Condição nova de negativa; janela de `as_of` encolhe; cadeia de alias muda de forma | Parcial — só por teste, não por esquema |

## 4. Resposta por sinal

**Três regras invioláveis, antes da tabela:**

1. **Jamais coerção silenciosa.** Nenhuma deriva é "acomodada" traduzindo o novo para o velho.
2. **Jamais auto-aceitação.** Nenhuma versão nova entra em uso por detecção automática; entrar
   em uso é ato humano com registro (a rota de notificação é o ponto **N-5**, ainda aberto).
3. **Jamais afrouxar para destravar.** Reduzir a verificação para que mensagens voltem a passar é
   o modo de falha que o ADR-0005 nomeia no gatilho T5 (*quarentena não é afrouxada para
   "destravar" via*) e que **HAZ-0031** descreve na forma de gate que valida nada.

| Sinal | Resposta imediata | Estado da lane | Escalonamento |
|---|---|---|---|
| **D1** | Pacote **rejeitado inteiro** — divergência entre manifesto e pin é defeito de publicação (`compatibility_policy`: *"consumidor rejeita o pacote"*) | Lane parada, **visível** | Dono consumidor + dono AMH |
| **D2** | Mensagem **quarentenada**; não interpretada | Lane opera para versões pinadas; contagem de quarentena visível | Alarme de deriva |
| **D3** | Mensagem **aceita** (invariante 6), campo **retido e contado**; alarme informativo agregado | Lane normal | Revisão de contrato — campo novo pode ser mudança compatível **anunciada** ou **não anunciada**; a segunda é falha de processo |
| **D4** | Mensagem **quarentenada** (EC-2) | Lane degradada, visível | **Alarme alto**: remoção de campo é mudança **incompatível** que exigiria major + janela de depreciação |
| **D5** | Pacote sob suspeita; reverificação exigida | Lane parada até esclarecimento | Dono AMH |
| **D6/D7** | Reverificação completa do mapeamento; enumeração de tenants **não** é atualizada automaticamente | Lane parada para o escopo afetado | Gatilho T3 do ADR-0005 |
| **D8** | Pacote rejeitado | Lane parada | Defeito de publicação |
| **D9** | Ver §5 — não há resposta automática possível | — | — |
| **D10** | Evento **quarentenado**, jamais interpretado por analogia | Lane normal para os tipos contratados | Confirmação do titular (N-8) |
| **D11** | Resultado de `resolve` inesperado ⇒ **não usar**; marcar sujeitos afetados como identidade em revisão | Consulta degradada, visível | Dono AMH |

**Degradação sempre visível.** Nenhuma resposta acima pode manter a lane reportando saúde normal
— **HAZ-0025** é exatamente o modo de falha oposto (*a lane degrada e o readiness continua
verde*), e **DOM-0007** exige que violações com impacto de segurança sejam visíveis a clínicos e
operadores.

## 5. Deriva semântica (D9) — o limite honesto da detecção

**INFERENCE.** Nenhuma verificação de esquema, digest ou versão detecta uma mudança de
**significado** com forma idêntica. Três exemplos concretos nesta fronteira:

- `occurred_at` passar a carregar tempo de ingestão em vez do tempo do fato — quebraria a
  ordenação por sujeito e o `as_of`, sem alterar um byte de esquema;
- `merge` passar a implicar re-chaveamento de fatos passados no lado AMH — contradiria
  *"eventos históricos não são reescritos"* sem mudar o envelope;
- a janela de retenção de `resolve` encolher — mudaria o conjunto de `as_of` respondíveis sem
  aviso de esquema.

**O que detecta isso, e só isso:**

1. **Testes de contrato dirigidos pelo consumidor**, executados contra a interface real
   (`cenarios-teste-consumidor.md`), incluindo a **equivalência replay ⇔ `resolve`** (CTS-11) —
   que é uma asserção **semântica**, não estrutural;
2. **Relatórios de reconciliação** que provem ausência de perda silenciosa e de coerção semântica
   (§7.6), comparando o que entrou com o que foi projetado;
3. **A rota humana de notificação de mudança** — que permanece **VALIDATION REQUIRED** (ponto
   N-5): *nenhum endereço ou canal é registrado por agente*.

**Consequência registrada:** enquanto (1) não puder rodar contra a interface real (camada 2
inexistente) e (3) não existir, **a deriva semântica desta fronteira é indetectável**. Isso é uma
restrição do estado do mundo, não um item a marcar como resolvido.

## 6. Correspondência entre versões de porta e versões de contrato

**PROPOSAL.** A camada anticorrupção mantém uma tabela de correspondência explícita — o artefato
que torna auditável "que versão interna interpretou qual versão externa".

| Porta V2 | Versão da porta | Versão de contrato AMH aceita | Manifesto pinado | Estado |
|---|---|---|---|---|
| `PORTA-CONTRATO` | — | — | — | **Sem pin** |
| `PORTA-EVT-IDENT` | — | — | — | **Sem contrato aceito** |
| `PORTA-RESOLVE` | — | — | — | **Sem contrato aceito** |

**Todas as células estão deliberadamente vazias.** Preenchê-las com valores plausíveis fabricaria
a aparência de uma integração versionada que não existe. A tabela é a forma; o conteúdo nasce com
o primeiro pin.

**Regras de convivência (PROPOSAL, coerentes com `compatibility_policy: BACKWARD`):**

- Mudança **compatível** (campo opcional novo, cardinalidade afrouxada): a porta **não** muda de
  versão; o campo novo é retido, contado e submetido a revisão de mapeamento.
- Mudança **incompatível** (campo removido, cardinalidade apertada, semântica de ref ou de tempo
  alterada): exige **nova versão de porta**, **período de convivência** e **janela de
  depreciação** — cujos valores são `null` / `VALIDATION_REQUIRED` (ponto N-4). Sem esses valores,
  **não há como planejar a convivência**, e isso é registrado como bloqueio.
- Duas versões de porta podem coexistir; **uma versão de porta jamais reinterpreta silenciosamente
  mensagens de outra versão de contrato**.

## 7. Cadência de verificação

**PROPOSAL** — o *quando*, sem o *como*:

| Momento | Verificação |
|---|---|
| Ao iniciar o consumidor | Pin do manifesto, do pacote IG e das fixtures (P-1, P-5, P-6) |
| Por mensagem | Versão, invariantes de envelope, campos desconhecidos (D2, D3, D4, D10) |
| Periodicamente | Reverificação de pin (detecta republicação sob mesmo identificador) e **conferência de integridade** malha × `resolve` (§7.3 da matriz de erro) |
| A cada release da V2 | Reexecução completa dos cenários de `cenarios-teste-consumidor.md` |
| Em gatilho externo | Publicação de nova IG (T3), notificação de mudança pela rota N-5, decisão do titular sobre N-8 |

Nenhuma frequência numérica é fixada: dependeria de limites de uso de `resolve`
(`resolve_latency_e_limites: null`) e de janela de depreciação (`null`). **Inventar números aqui
fabricaria evidência de camada 4.**

## 8. Questões abertas deste documento

| # | Questão | Para quem |
|---|---|---|
| **CONF-Q-19** | Qual a janela de depreciação e o período de convivência de versões? (N-4) | Dono AMH |
| **CONF-Q-20** | Qual a rota humana de notificação de mudança e quem a recebe? (N-5) | Donos AMH e consumidor |
| **CONF-Q-21** | O manifesto publicado carregará digests de fixture (P-5)? | Dono AMH |
| **CONF-Q-22** | Republicação sob o mesmo identificador de versão é permitida (e, se sim, como o consumidor a detecta além do digest)? | Dono AMH |

---

*Redigido pelo engenheiro de camada anticorrupção e conformidade AMH (ciclo 1). Nenhuma ferramenta
ou tecnologia escolhida; nenhuma frequência ou janela inventada; nenhuma decisão registrada. Nada
escrito em `contract-v1/`, em ADRs, em registros ou no repositório AMH. Sem PHI, credenciais ou
identificadores reais.*
