---
id: ADR-0003
title: Grão de tenant da V2, hierarquia organização/facility/unidade/leito e modelo de propriedade de recurso
status: proposed
status_history:
  - status: not-started
    date: 2026-08-14
    by: candidate-architecture and ADR-program engineer (Wave 2)
    note: ID reservado em adr-index.md
  - status: proposed
    date: 2026-08-15
    by: arquiteto de decisões de fronteira e modelo canônico
    note: >
      Redigido em pt-BR (DEC-G0-10) incorporando as restrições DECIDED de 2026-08-15
      (AQ-4, AQ-6) como contorno, o grão AMH pós-ADR-041 como fato externo e as regras
      permanentes da política de identidade (IDP-03/04/05/06/08/09). Opções e drivers
      apenas; NENHUMA decisão é registrada e nenhum agente pode registrá-la.
date: 2026-08-15
owner: >
  UNASSIGNED — VALIDATION REQUIRED (candidatos por decision-rights.md §2:
  AUTH-DATA-PLATFORM — detido por rodaquino-OMNI via DEC-G0-04 — e AUTH-SECURITY,
  interinamente rodaquino-OMNI via DEC-G0-02; a confirmação como dono é ato humano)
approvers:
  - UNASSIGNED — VALIDATION REQUIRED   # role: AUTH-DATA-PLATFORM (DEC-G0-04)
  - UNASSIGNED — VALIDATION REQUIRED   # role: AUTH-SECURITY (fase de desenho, DEC-G0-02)
decision_deadline: >
  UNSET — VALIDATION REQUIRED. Restrição de ordem: este ADR deve ser aceito antes do
  desenho físico de qualquer armazenamento com dado multi-tenant e antes do Gate G6
  (o plano de testes adversariais de isolamento pressupõe o modelo daqui).
deciding_authority_rule: >
  docs/00-governance/decision-rights.md §2, linha "Architecture decisions (ADR
  ratification)" (AUTH-PRODUCT + dono de domínio relevante) combinada com a linha
  "Tenant/MPI identity policy" (AUTH-DATA-PLATFORM em conjunto com AUTH-AMH-OWNER)
  para tudo que toca o grão da fronteira AMH.
independence_check: >
  decision-rights.md §3: quem implementar o enforcement de isolamento (par 2/3 —
  implementador de controle de segurança) NÃO pode aceitar o teste de penetração nem o
  caso de segurança correspondente. Este ADR foi redigido por agente; nenhum agente o
  aprova. O autor não é aprovador.
links:
  drivers:
    domain_invariants: [DOM-0001, DOM-0004, DOM-0007]
    quality_scenarios: [QAS-0014, QAS-0018, QAS-0023, QAS-0027, QAS-0028]
    risks: ["risco de concentração de autoridade — registrado via nota de integração do DEC-G0; ver ADR-0004 §11.2"]
  constrains:
    requirements: ["REQ: pendente de catálogo de requisitos (docs/04-product-requirements ainda não existe)"]
    clinical: ["CLR: pendente do portfólio de vias clínicas (Gate G2)"]
    safety: [SAF-0007, SAF-0008, SAF-0009, SAF-0013, SAF-0026, SAF-0029]
  hazards: [HAZ-0001, HAZ-0002, HAZ-0003, HAZ-0004, HAZ-0013, HAZ-0038]
  tests: ["TST-IDP-03", "TST-IDP-04", "TST-IDP-05", "TST-DOM-0001"]
  validations: ["VAL: pendente do backlog de validação"]
  adrs:
    depends_on: [ADR-0001]
    feeds: [ADR-0004, ADR-0005, ADR-0011, ADR-0015, ADR-0016, ADR-0017, ADR-0018]
  gates: [G3, G6]
  evidence:
    - docs/08-interoperability/amh-data/identity-adjudication/adjudicacao-decisoes-2026-08-15.md
    - docs/08-interoperability/amh-data/identity-adjudication/interim-identity-policy.md
    - docs/08-interoperability/amh-data/ordens-de-servico-amh-2026-08-15.md
    - docs/03-domain/conceptual-model.md
    - docs/03-domain/invariants/DOM-invariants.md
    - docs/05-clinical-safety/hazard-log.md
supersedes: null
superseded_by: null
provenance:
  source_repo: intensicare-V2
  path_or_url: docs/06-architecture/adrs/ADR-0003-tenancy-organizacao-facility-propriedade-de-recurso.md
  commit_sha_or_version: 0c36f03 (HEAD do repositório na redação; este arquivo não está commitado)
  section_or_lines: >
    INTENSICARE_V2_ORCHESTRATOR_PROMPT.md §7.4, §9.1 princípio 2, §9.2, §9.3, §9.4,
    §10 item 3, Gate G6; ata IDN-ADJ-2026-08-15 §2 (AQ-4, AQ-6), §4, §8;
    interim-identity-policy.md (regras marcadas PERMANENTE)
  date_collected: 2026-08-15
  collector: arquiteto de decisões de fronteira e modelo canônico
  transformation: >
    reasoned-from — opções e drivers derivados do prompt, da ata de adjudicação lida em
    disco e dos documentos de identidade/domínio do ciclo 0-1. Este ADR não reverificou
    nenhum artefato AMH; linhas de origem AMH são SOURCE por citação.
  confidence: medium
  owner: UNASSIGNED — VALIDATION REQUIRED
  validation_status: VALIDATION REQUIRED
---

# ADR-0003 — Grão de tenant da V2, hierarquia organização/facility/unidade/leito e modelo de propriedade de recurso

> **Status: `proposed`. Este documento apresenta opções, drivers, restrições decididas
> pelo titular e condições de aceitação. NÃO registra decisão sobre o grão de tenant da
> V2 nem sobre o mecanismo de enforcement.** As restrições DECIDED citadas em §2.4 são
> decisões do titular de 2026-08-15 incorporadas como contorno — elas limitam o espaço
> de opções, mas não escolhem entre as opções remanescentes.

---

## 1. Contexto e problema

A V2 é multi-tenant por natureza: o grupo atende por múltiplas pessoas jurídicas (PJs),
e a AMH — fonte candidata de identidade e contexto — particiona seus dados por tenant
com grão de **raiz de CNPJ** (12 tenants de negócio pós-ADR-041; DECIDED em AQ-6). O
prompt §9.1 princípio 2 exige que *"propriedade de tenant e encontro sejam invariantes
da identidade ao armazenamento, cache, evento, consulta, assinatura e auditoria"*
(DOM-0001), e o prompt §10 item 3 exige um ADR para o modelo
tenant/organização/facility/propriedade de recurso.

O que força a pergunta agora: (i) o ADR-0004 (`under-review`) chaveia fatos clínicos por
`(PSR, encontro)` com PSR escopado por `{amh_tenant, legal_entity}` — um grão de tenant
da V2 incompatível com esse escopo criaria re-mapeamento permanente na camada mais
sensível; (ii) o Gate G6 exige testes adversariais de isolamento que **afirmam a
impossibilidade** de acesso cross-tenant (AQ-6) — impossível planejar sem fixar o modelo;
(iii) a primeira fatia vertical (G7) precisará de um armazenamento, e um armazenamento
sem modelo de propriedade decidido resolveria este ADR por omissão (o anti-padrão que o
ADR-0001 §6.2 registra como risco).

**Pergunta.** Qual é o grão de tenant da IntensiCare V2, como ele se relaciona com os 12
tenants AMH pós-ADR-041, como a hierarquia interna
(`Organization → Facility → CareUnit → Bed`) se subordina a ele, e por qual mecanismo a
propriedade de recurso é imposta — invariante — da identidade ao audit?

**Fora de escopo** (cada item nomeado para prevenir deriva):

- Identidade de paciente/encontro, PSR, merge/unmerge — **ADR-0004** (consumido aqui
  como restrição decidida).
- Modelo canônico de observação e chave de fato — **ADR-0005** (consome o resultado
  daqui).
- Mecanismo de autenticação e identidade máquina-a-máquina — **ADR-0015**.
- Modelo de autorização (papéis, propósitos, políticas) e o *detalhe* do enforcement —
  **ADR-0016**. Este ADR fixa o modelo de propriedade e o *requisito* de enforcement
  fail-closed; o ADR-0016 escolhe a política concreta sobre ele.
- Criptografia/chaves — **ADR-0017**; residência/plataforma — **ADR-0019**.
- Escolha de banco de dados ou extensão — proibida aqui por herança (§3 regra 14);
  a alternativa "enforcement classe-RLS" em §4.2 é avaliada como *classe de mecanismo*,
  não como seleção de produto.

---

## 2. Evidência e premissas

### 2.1 Evidência

**Nota epistêmica única.** Este ADR não reverificou artefatos AMH. Linhas de origem AMH
são `SOURCE` por citação dos documentos de adjudicação/dossiê, que registraram suas
próprias verificações `OBSERVED` no commit pinado
`Omni-Saude/amh-data-platform@0a07a6f1fab36fb2f5eeee0fcd8e945c95f67116`.

| # | Rótulo | Afirmação | Fonte | Confiança |
|---|---|---|---|---|
| E1 | OBSERVED | A ata de adjudicação registra AQ-6 = A (DECIDED, rodaquino-OMNI, 2026-08-15): enumeração autoritativa = **12 tenants de negócio pós-ADR-041**; `cross_tenant_authorized` é **deriva documental — nenhum bypass existirá**; testes negativos da V2 **afirmam a impossibilidade**; nome do tenant piloto **adiado** para a redação do contrato. | ata `IDN-ADJ-2026-08-15` §2 AQ-6 | alta |
| E2 | SOURCE | O grão AMH é **raiz de CNPJ** (ADR-041); o MPI não cruza PJs (ADR-041 §6, em vigor por AQ-1); o mecanismo implantado descrito é partição por URL com igualdade obrigatória entre claim de token e tenant da URL, referências cross-partition desabilitadas. | `interim-identity-policy.md` IDP-05; `adjudicacao-decisoes-2026-08-15.md` §3 | alta |
| E3 | OBSERVED | AQ-4 = A plena (DECIDED): o PSR é escopado por `{amh_tenant, legal_entity}`; a V2 chaveia fatos clínicos por `(PSR, encontro)`. Consequência direta para este ADR: **todo fato clínico da V2 já nasce com escopo de tenant AMH embutido na sua chave de sujeito**. | ata §2 AQ-4 | alta |
| E4 | SOURCE | Regras **PERMANENTES** da política de identidade (rebaselinada 2026-08-15): IDP-03 (escopo por tenant e encontro), IDP-04 (**nunca** cruzar PJ por CPF ou identificador coincidente), IDP-05 (tenant derivado do servidor — URL + claim — nunca do cliente), IDP-06 (identidade não verificável ⇒ `not_evaluated`), IDP-08 (resolução de identidade ≠ autorização; controle primário do laço clínico), IDP-09 (a V2 nunca constrói correlação cross-PJ). | `interim-identity-policy.md` (tabela de rebaseline, L50–58) | alta |
| E5 | SOURCE | DOM-0001 exige que todo recurso, registro, entrada de cache, evento, resultado de consulta, assinatura e entrada de auditoria seja atribuível a exatamente **um** tenant (e, onde aplicável, um encontro), sem que camada alguma possa derrubar, alargar ou re-derivar essa propriedade silenciosamente. | `DOM-invariants.md` DOM-0001 | alta |
| E6 | SOURCE | O modelo conceitual do ciclo 0 já estrutura `Organization → Facility → CareUnit → Bed` e `Organization ↔ Membership ↔ User/Practitioner/Role/Purpose` — hierarquia interna candidata, sem grão decidido. | `conceptual-model.md` §1–§2; prompt §9.3 | alta |
| E7 | SOURCE | O prompt §9.4 lista como topologia candidata *"PostgreSQL-class transactional operational store with row-level tenant enforcement **if the selected technology supports it**"* — um candidato condicional a ratificar, não uma seleção. | prompt §9.4 | alta |
| E8 | SOURCE | O hazard de derivar contexto de tenant de valor controlado pelo chamador é **E1 — ocorrido** no legado ("Caller header wins; equality check is tautological; core facts lack tenant"); vazamento cross-tenant por consulta/cache/projeção sem escopo é HAZ-0013, também com ocorrência legada. | `hazard-log.md` HAZ-0003, HAZ-0013 | alta |
| E9 | SOURCE | A correspondência cross-PJ existe **apenas** como índice separado e governado (ADR-043), gated em parecer DPO/jurídico (AQ-1); um paciente multi-PJ aparece como sujeitos distintos — consequência clínica aceita explicitamente pelo titular. | ata §2 AQ-1 | alta |
| E10 | SOURCE | A tabela autoritativa `tenant → legal_entity` (12 entradas, raiz de CNPJ verificada) é a ordem de serviço **OS-10** (SP-2) — pré-requisito de toda a onda C do PSR; a raiz de CNPJ da `omni` **não consta** do tfvars e exige owner. | `ordens-de-servico-amh-2026-08-15.md` OS-10 | alta |
| E11 | SOURCE | O CodeSystem/ValueSet `amh-tenant` vigente (1.0.0) está **defasado** (10 tenants, inclui tenant aposentado); a enumeração correta de 12 só será pinável na **IG 1.1.0, ainda não publicada**. | ata §2 AQ-6, §4 | alta |

### 2.2 Premissas

A registrar em `docs/00-governance/registers/assumptions-register.md`; **nenhum ID `ASM`
é cunhado aqui** (aquele registro é o catálogo de cunhagem do prefixo).

| # | Premissa | Por que é necessária | O que a invalida | Dono |
|---|---|---|---|---|
| A1 | A enumeração de 12 tenants pós-ADR-041 permanece estável até a publicação da IG 1.1.0 e é o conjunto que a V2 pina. | Toda opção de grão referencia esse conjunto. | Aquisição/fusão/reestruturação societária que altere as raízes de CNPJ; nova decisão do titular. | UNASSIGNED — VALIDATION REQUIRED |
| A2 | O escopo inicial da V2 é **um** tenant piloto (nome adiado pelo titular — ata §8 item 8), com desenho multi-tenant desde o dia um. | Dimensiona o custo de cada opção sem reduzir o requisito de isolamento. | Decisão de piloto multi-tenant simultâneo. | UNASSIGNED — VALIDATION REQUIRED |
| A3 | A hierarquia interna facility/unidade/leito é necessária para roteamento clínico, filas e visibilidade (bed grid), mas **não** é fronteira de isolamento de segurança — a fronteira é o tenant. | Separa a pergunta de isolamento (tenant) da pergunta de organização clínica (facility/unidade). | Requisito validado (G1/G4) de isolamento *duro* por facility — p.ex. facilities do mesmo tenant proibidas de se ver por contrato. | UNASSIGNED — VALIDATION REQUIRED |
| A4 | A tabela `tenant → legal_entity` (OS-10) será entregue pela AMH antes de qualquer persistência de fato clínico com PSR. | O PSR é escopado por `{amh_tenant, legal_entity}`; sem a tabela o escopo não é verificável. | Priorização AMH que a adie; nesse caso a V2 permanece em dados sintéticos com tabela sintética. | UNASSIGNED — VALIDATION REQUIRED |

### 2.3 Hipóteses a testar

| # | Hipótese | Como seria testada | Quem testa | Estado |
|---|---|---|---|---|
| H1 | O grão raiz-de-CNPJ da AMH é suficiente e não-ambíguo para o escopo clínico da V2 (nenhum caso de uso aprovado exige visão cross-PJ no laço vivo). | Portfólio G2 + inquérito contextual: verificar se alguma via aprovada exige dado de outra PJ. | Portfolio optimizer + intended-use analyst | UNTESTED |
| H2 | O isolamento por tenant é imponível fail-closed em todas as camadas nomeadas por DOM-0001 sem custo proibitivo de latência/operação. | Protótipo de enforcement + testes adversariais TST-DOM-0001/TST-IDP-05. | Tenant-isolation engineer (implementa) + verificador independente | UNTESTED |
| H3 | Nenhuma consulta, view, índice, cache ou caminho de assinatura permite junção cross-PJ por identificador coincidente. | TST-IDP-04 (dois sujeitos sintéticos em tenants distintos com CPF compartilhado jamais ligados). | idem | UNTESTED |

---

## 3. Drivers de decisão e atributos de qualidade mensuráveis

Alvos numéricos: `VALIDATION REQUIRED` até o G1/G6 — **nenhum alvo é inventado aqui**.
Exceção: o alvo de D1 é estrutural e já vinculante por decisão do titular (AQ-6).

| # | Driver | Por que discrimina | Atributo mensurável | Alvo |
|---|---|---|---|---|
| D1 | **Isolamento entre PJs como propriedade estrutural** (DOM-0001; AQ-6) | As opções diferem em onde a fronteira de isolamento cai (raiz de CNPJ vs facility vs grupo) e, em §4.2, em quantas camadas a impõem | QAS-0018, QAS-0014 | **Zero acesso cross-tenant possível — vinculante; testes afirmam impossibilidade** (AQ-6) |
| D2 | **Alinhamento com o grão da fronteira AMH** | Grão V2 ≠ grão AMH cria re-mapeamento permanente na camada anticorrupção e um lugar a mais para errar atribuição (HAZ-0001/0002); grão igual herda a fragmentação multi-PJ aceita em AQ-1 | QAS-0013 (deriva de contrato), QAS-0025 | VALIDATION REQUIRED |
| D3 | **Fail-closed quando contexto de tenant falta ou diverge** | Opções de enforcement diferem em *onde* a falta é detectada (aplicação, banco, ambas) e portanto em quantos caminhos podem escapar | QAS-0014 | Nenhuma requisição sem contexto verificado é servida — vinculante por IDP-05/IDP-06 (política permanente) |
| D4 | **Expressividade clínica intra-tenant** (facility/unidade/leito para roteamento, filas, bed grid) | Um grão de tenant grosso demais sem hierarquia interna rica não roteia alerta ao lugar certo (HAZ-0004, HAZ-0018); um grão fino demais fragmenta a operação | QAS-0023; cenários de roteamento do ADR-0009 | VALIDATION REQUIRED (G1/G4) |
| D5 | **Verificabilidade adversarial no G6** | O plano de testes de penetração precisa de uma fronteira declarada e de um conjunto enumerado de tenants para afirmar impossibilidade | QAS-0014, QAS-0018 | VALIDATION REQUIRED (G6) |
| D6 | **Reversibilidade** (§9.1 princípio 11) | Mudar grão de tenant depois de existir dado é migração de chave com custódia de registro clínico; as opções diferem no custo dessa reversão | QAS-0027 | VALIDATION REQUIRED |
| D7 | **Minimização de PHI e postura de privacidade** | A fronteira de tenant é também fronteira de finalidade LGPD entre PJs distintas (controladoras distintas); um grão que agrupe PJs mistura responsáveis legais | QAS-0028 | VALIDATION REQUIRED (AUTH-PRIVACY-LEGAL, G6) |

---

## 4. Alternativas consideradas

Duas perguntas separáveis, cada uma com suas alternativas: **§4.1 o grão** e **§4.2 o
enforcement**. Aceitação pode combinar uma opção de cada.

### 4.1 Grão de tenant da V2

#### Opção A — Tenant V2 = tenant AMH (raiz de CNPJ, 12 pós-ADR-041), espelhado 1:1

**Descrição.** O tenant da V2 é a mesma unidade que o tenant AMH: a raiz de CNPJ. A
enumeração é pinada da IG 1.1.0 (12 tenants; E11). A hierarquia
`Organization → Facility → CareUnit → Bed` vive **dentro** do tenant como estrutura
clínico-operacional (A3), não como fronteira de isolamento. Propriedade de recurso:
todo recurso carrega `tenant_id` verificado; fatos clínicos carregam adicionalmente o
encontro via chave `(PSR, encontro)` (E3), que já embute o tenant no escopo do PSR.

**Frente aos drivers.** D1: a fronteira coincide com a fronteira jurídica (PJ) e com a
do produtor — um único conceito a isolar. D2: alinhamento máximo; zero re-mapeamento de
grão na fronteira; herda conscientemente a fragmentação multi-PJ aceita em AQ-1 (E9).
D3: o contexto verificável (par URL/claim na fronteira; contexto de sessão na V2) mapeia
1:1 para o tenant. D4: exige que facility/unidade/leito sejam **atributos ricos** dentro
do tenant — o trabalho clínico-organizacional não desaparece, muda de lugar. D5:
conjunto enumerado, 12 valores, testável por enumeração completa. D6: reversível para a
Opção B por subdivisão (cara, mas aditiva); ir para grão mais grosso seria redesenho.
D7: cada tenant é uma controladora distinta — fronteiras legais e técnicas coincidem.

**Positivas.** Um só vocabulário de tenant no ecossistema; testes negativos da V2 e da
AMH afirmam a mesma fronteira; o PSR já nasce escopado ao mesmo grão (E3); nenhuma
tradução de grão na camada anticorrupção.

**Negativas.** Facilities do mesmo tenant compartilham fronteira de isolamento — a
separação entre hospitais da mesma PJ é autorização (ADR-0016), não tenancy; a V2 fica
acoplada à estabilidade societária do grupo (A1): reestruturação de CNPJ vira migração
de tenant; a fragmentação multi-PJ aparece na V2 exatamente como na AMH.

**O que precisaria ser verdade.** A3 (facility não precisa ser fronteira dura) e H1 (o
escopo clínico aprovado cabe dentro de uma PJ).

**Custo de saída.** Migração de chave de tenant sobre toda base — alto após existir
dado; baixo antes.

#### Opção B — Tenant V2 = facility (hospital), mais fino que o grão AMH (n:1)

**Descrição.** Cada facility é um tenant V2; um tenant AMH agrega n tenants V2. A camada
anticorrupção mapeia `{amh_tenant, legal_entity}` → conjunto de facilities.

**Frente aos drivers.** D1: fronteira mais fina que a jurídica — isola também
intra-PJ; mas o isolamento *entre PJs* passa a depender de um mapeamento n:1 correto,
adicionando um modo de falha (mapeamento errado = vazamento entre PJs). D2:
desalinhamento estrutural: o PSR é escopado por PJ (E3), então **o mesmo PSR atravessa
tenants V2 distintos da mesma PJ** — a chave de sujeito deixa de embutir o tenant V2, e
IDP-03 precisa de re-derivação por facility. D3: contexto de facility não existe no
contrato AMH; teria de ser derivado de `Encounter`/localização — derivação, não
verificação. D4: máxima expressividade — facility é nativa. D5: conjunto maior e menos
estável que 12; enumeração via cadastro, não via IG pinada. D6: reversão para A é
agregação (barata); manter é caro. D7: PJs continuam separadas, mas por transitividade
do mapeamento.

**Positivas.** Isolamento intra-PJ por construção; roteamento e operação por hospital
naturais; um incidente de configuração num hospital não expõe outro da mesma PJ.

**Negativas.** Quebra o alinhamento com o escopo do PSR (E3) — o custo aparece na
camada mais sensível; o mapeamento n:1 é um artefato de segurança adicional a governar;
a enumeração de tenants deixa de ser pinável de artefato AMH; contradiz a economia de A2
(um piloto, um tenant).

**O que precisaria ser verdade.** A3 invalidada — um requisito *validado* de isolamento
duro entre facilities da mesma PJ (contratual, regulatório ou de segurança), que hoje
não existe em nenhum documento lido.

**Custo de saída.** Moderado (agregação de tenants), mas com re-chaveamento de tudo que
usou facility como escopo de segurança.

#### Opção C — Tenant único de grupo, com PJ como atributo

**Descrição.** Um único tenant V2 para o grupo econômico; a PJ é coluna/atributo de
filtragem.

**Frente aos drivers.** D1: **falha o alvo vinculante.** Isolamento entre PJs vira regra
de aplicação (filtro), não propriedade estrutural — exatamente a propriedade que AQ-6
manda desmontar (*"uma role capaz de ler através de PJs é, na prática, um MPI global em
tempo de consulta"* — ata, fundamento de AQ-6) e que IDP-04/IDP-09 (permanentes)
proíbem. D7: mistura controladoras LGPD distintas num mesmo espaço de dados.

**Positivas** (registradas com honestidade): simplicidade operacional máxima; nenhuma
migração em reestruturação societária; visão consolidada trivial.

**Negativas.** Incompatível com AQ-6/IDP-04/IDP-09 sem re-decisão do titular; junção
cross-PJ deixa de ser impossível e passa a ser um bug à espera; testes negativos não
podem "afirmar impossibilidade" de algo que o esquema permite.

**O que precisaria ser verdade.** O titular reverter AQ-6 e as regras permanentes — com
parecer jurídico favorável à consolidação. Nenhum sinal disso existe; a opção é listada
porque omiti-la esconderia o trade-off, não porque seja viável hoje.

**Custo de saída.** Máximo: separar dados co-mingled de PJs distintas é o pior caso de
migração com custódia legal.

#### Opção Z — Adiar

**Descrição.** Não fixar grão; seguir desenho com "tenant" abstrato.

**Positivas.** Nenhum compromisso antes do ADR-0001 aceito; barato enquanto não há
armazenamento.

**Negativas.** O ADR-0004 (`under-review`) **já** chaveia fatos por `(PSR, encontro)`
com escopo de PJ embutido — adiar aqui contradiz o que já está encaminhado à aceitação;
o plano de testes do G6 não pode ser escrito; a primeira fatia vertical (G7) decidiria
por omissão.

**Custo do atraso.** Sobe abruptamente no primeiro armazenamento (G7) — igual ao
ADR-0001 §4 Opção Z, e antes disso já bloqueia o plano de G6.

### 4.2 Enforcement da propriedade de recurso (mecanismo, avaliado — não pressuposto)

SOURCE (E7): o prompt §9.4 nomeia enforcement em linha (classe-RLS) como **candidato
condicional**. Regra §3-14: nenhuma tecnologia por herança. As alternativas abaixo são
**classes de mecanismo**; a seleção de produto/tecnologia pertence ao ADR de plataforma
de dados, com drivers mensuráveis próprios.

| Alternativa | Descrição | Positivas | Negativas |
|---|---|---|---|
| E-a — Enforcement só na aplicação | Toda consulta/escrita passa por camada de escopo obrigatória no código (repositórios/ports com `tenant_id` verificado compulsório) | Portátil entre tecnologias; testável em unidade; sem dependência de feature de banco | Um caminho de código que escape da camada (consulta ad-hoc, ferramenta operacional, job) fura o isolamento — o modo de falha de HAZ-0013 (E8); exige disciplina permanente |
| E-b — Enforcement só no armazenamento (classe-RLS) | O armazenamento nega por política linhas fora do tenant da sessão | Vale também para acesso operacional/ad-hoc; um só ponto de verdade | Condicional à tecnologia (E7 — ainda não selecionada); políticas mal escritas são silenciosas; não cobre caches, eventos, projeções e canais em tempo real — que DOM-0001 também nomeia |
| E-c — Defesa em profundidade: aplicação + armazenamento + testes negativos contínuos | Camada de aplicação obrigatória, política no armazenamento onde a tecnologia ratificada suportar, e suíte adversarial (TST-DOM-0001, TST-IDP-03/04/05) executada continuamente afirmando impossibilidade em **todas** as superfícies de DOM-0001 (storage, cache, evento, consulta, assinatura, audit) | Nenhum mecanismo único é ponto único de falha; cobre as superfícies que E-b não alcança; alinha com o teste-que-afirma-impossibilidade de AQ-6 | Custo de implementação e de manutenção dobrado; risco de divergência entre as duas políticas (mitigável por geração a partir de fonte única — decisão de implementação futura) |

INFERÊNCIA honesta: E-c é a única classe que cobre todas as superfícies de DOM-0001,
mas afirmá-la "vencedora" aqui seria decidir — a comparação fica registrada para a
autoridade, e a *seleção de tecnologia* que a viabiliza permanece futura.

### 4.3 Comparação frente aos drivers (grão)

| Driver | A — raiz de CNPJ 1:1 | B — facility | C — tenant único | Z — adiar |
|---|---|---|---|---|
| D1 isolamento estrutural | Coincide com PJ e com produtor | Mais fino, mas isolamento entre PJs vira transitivo ao mapeamento | **Falha o alvo vinculante (AQ-6)** | Não resolvido |
| D2 alinhamento AMH/PSR | Máximo — mesmo grão do PSR | PSR atravessa tenants V2 — desalinhado na chave de sujeito | n/a (grão nem existe) | Não resolvido |
| D3 fail-closed | Contexto verificável 1:1 | Contexto derivado, não verificado no contrato | Filtro, não contexto | Não resolvido |
| D4 expressividade clínica | Via hierarquia interna (trabalho a fazer) | Nativa | Nativa, sem fronteira | n/a |
| D5 verificabilidade G6 | Enumeração de 12, pinada (IG 1.1.0) | Enumeração cadastral, maior e mutável | Não pode afirmar impossibilidade | Bloqueia o plano G6 |
| D6 reversibilidade | Subdivisão possível (cara) | Agregação possível (moderada) | Pior caso | Zero agora, alto no G7 |
| D7 privacidade | Fronteira legal = técnica | Legal por transitividade | Controladoras misturadas | Não resolvido |

---

## 5. Decisão e escopo

> **NENHUMA DECISÃO ESTÁ REGISTRADA.** Este ADR apresenta opções e drivers. Preencher
> esta seção é reservado à autoridade decisora nomeada no front matter
> (`AUTH-DATA-PLATFORM` + `AUTH-SECURITY`; para o que toca o grão da fronteira, em
> conjunto com `AUTH-AMH-OWNER` — papéis detidos por rodaquino-OMNI via DEC-G0-04 e
> DEC-G0-02, cuja confirmação como aprovadores deste ADR é ato do titular).

Na aceitação, esta seção deve declarar: a opção de grão (§4.1) e a classe de
enforcement (§4.2) escolhidas; o escopo preciso (módulos, tenants, ambientes); o que
explicitamente **não** vincula (em particular, que a seleção de tecnologia de
armazenamento permanece futura); data e fundamentação.

### 5.1 Condições que devem ser satisfeitas antes da aceitação

| # | Condição | Dono | Evidência que a fecha | Estado |
|---|---|---|---|---|
| C1 | Direção do ADR-0001 conhecida (a fronteira determina se o grão AMH é consumido direta ou indiretamente). | titular | ADR-0001 aceito, ou aceitação conjunta | ABERTA |
| C2 | Reconciliação com o ADR-0004: o grão aceito aqui deve ser compatível com a chave `(PSR, encontro)` e com o escopo `{amh_tenant, legal_entity}` do PSR (nota 5 do `adr-index.md` §7 exige exatamente esta reconciliação). | autoridade decisora | Declaração de compatibilidade na aceitação de ambos | ABERTA |
| C3 | Enumeração de 12 tenants pinável: IG 1.1.0 publicada com CodeSystem/ValueSet corrigido (OS-03/OS-05), ou registro explícito de que a V2 opera com enumeração transcrita provisória até lá. | AMH (OS-03/OS-05) | Pacote publicado com digest, ou registro da provisoriedade | ABERTA (E11) |
| C4 | Tabela `tenant → legal_entity` (OS-10) disponível — ou sintética equivalente para dev, registrada como tal. | AMH / owner cadastral | Tabela legível por máquina | ABERTA (E10) |
| C5 | Nome do tenant piloto decidido pelo titular (ata §8 item 8). | rodaquino-OMNI | Registro da decisão | ABERTA |
| C6 | Esboço do plano de testes adversariais de isolamento (G6) revisado contra o modelo aqui aceito. | tenant-isolation engineer + verificador independente | Plano ligado a TST-DOM-0001/TST-IDP-03/04/05 | ABERTA |

---

## 6. Consequências

Como nenhuma opção foi escolhida, estas são consequências **da existência deste ADR em
`proposed`**, não de uma decisão.

### 6.1 Positivas

- O espaço de opções de grão e de enforcement está enumerado com as restrições DECIDED
  do titular embutidas — a aceitação pode ser cláusula a cláusula.
- O ADR-0005 (chave de fato), o ADR-0016 (autorização) e o plano do G6 ganham um objeto
  concreto contra o qual declarar condicionalidade.
- A proibição permanente de junção cross-PJ (IDP-04/IDP-09) e o fail-closed (IDP-05/06)
  ficam ancorados num ADR de arquitetura, não apenas na política de identidade.

### 6.2 Negativas

- Trabalho dependente carrega condicionais até a aceitação; o primeiro armazenamento
  (G7) resolveria o grão por omissão se este ADR estagnar — risco a registrar.
- A comparação §4.2 pode ser lida como preferência por E-c; o texto marca a inferência
  como registrada-para-a-autoridade, mas o risco de leitura apressada existe.

### 6.3 Neutras / estruturais

- Nada aqui altera o achado vigente (`integration candidate`) nem torna consumível
  qualquer dado AMH.
- Nada aqui seleciona banco, extensão, broker ou nuvem (§3 regra 14).

---

## 7. Implicações transversais

| Dimensão | Implicação | Rótulo | Papel responsável | IDs |
|---|---|---|---|---|
| Segurança clínica | Propriedade errada de recurso é atribuição errada de fato/alerta (paciente, episódio, unidade, leito errados). A fragmentação multi-PJ herdada de AQ-1 precisa ser exibida como limitação, nunca como completude (requisito de UI vinculante da ata AQ-1). | INFERENCE de E8, E9 | AUTH-CLINSAFETY | HAZ-0001, HAZ-0002, HAZ-0004, HAZ-0038; SAF-0009, SAF-0029 |
| Segurança | A fronteira de tenant é a fronteira de ameaça primária; contexto jamais derivado do cliente (IDP-05); testes afirmam impossibilidade (AQ-6); enforcement multi-camada é decisão desta ADR-família com verificação independente (G6). | SOURCE de E1, E4, E8 | AUTH-SECURITY | HAZ-0003, HAZ-0013; SAF-0007, SAF-0008, SAF-0013; ADR-0016 |
| Privacidade (LGPD) | Tenants = controladoras distintas; o grão decide onde passa a fronteira de finalidade e de minimização; nenhuma conformidade é declarada — parecer brasileiro é gatilho obrigatório (DEC-G0-03). | VALIDATION REQUIRED | AUTH-PRIVACY-LEGAL (não nomeado) | SAF-0026; ADR-0017, ADR-0018 |
| Interoperabilidade | O grão aceito determina o mapeamento tenant na camada anticorrupção; a enumeração é pinada da IG 1.1.0 (C3); nenhum header de partição do cliente é aceito ou enviado. | SOURCE de E2, E11 | AUTH-DATA-PLATFORM | ADR-0013; QAS-0013, QAS-0025 |
| Acessibilidade | A limitação "registro limitado a esta instituição" (AQ-1) deve ser perceptível sem depender de cor e anunciada a tecnologia assistiva. | INFERENCE | AUTH-UX | SAF-0034 (via ADR-0004 §6.2); ADR-0021 |
| Operacional | Onboarding/offboarding de tenant vira procedimento operacional de primeira classe (o precedente AMH: partições não criadas fazem requisição falhar — comportamento correto, fail-closed, que a V2 também deve exibir); reestruturação societária é cenário operacional a ensaiar. | INFERENCE de E2 | AUTH-OPERATIONS | SAF-0024; ADR-0020 |
| Custo | E-c (defesa em profundidade) tem custo de implementação e verificação contínua maior; nenhum modelo de custo existe e nenhum número é inventado aqui. | VALIDATION REQUIRED | AUTH-PRODUCT | — |
| Migração | Mudar grão após existir dado é migração de chave com custódia de registro clínico — o principal motivo para decidir antes do G7; a Opção C teria o pior caso de separação de dados co-mingled. | INFERENCE | AUTH-OPERATIONS | ADR-0023 |

---

## 8. Reversibilidade, gatilhos de revisita, kill/rollback

### 8.1 Avaliação de reversibilidade

| Opção | Reversibilidade | O que fica encalhado ao reverter | Rótulo |
|---|---|---|---|
| A — raiz de CNPJ 1:1 | Moderada antes de dado; baixa depois (migração de chave de tenant) | Escopos, políticas e testes pinados na enumeração de 12 | INFERENCE |
| B — facility | Moderada (agregação), com re-chaveamento do que usou facility como segurança | O mapeamento n:1 e suas auditorias | INFERENCE |
| C — tenant único | Mínima — separar dados co-mingled de PJs é o pior caso | Praticamente toda a base | INFERENCE |
| E-a/E-b/E-c (enforcement) | Alta entre classes antes de dado real; a suíte adversarial é reaproveitável em qualquer classe | Políticas específicas do mecanismo abandonado | INFERENCE |
| Z — adiar | n/a — valor de opção preservado a custo crescente | n/a | INFERENCE |

### 8.2 Gatilhos de revisita

| # | Gatilho | Detecção | Notificar | Ação |
|---|---|---|---|---|
| T1 | Publicação da IG 1.1.0 com o ValueSet de 12 tenants (OS-03/OS-05) | Detecção de deriva de contrato (QAS-0013) | AUTH-DATA-PLATFORM | Pinar; fechar C3 |
| T2 | Alteração societária que mude o conjunto de raízes de CNPJ (invalida A1) | Notificação AMH / governança | titular | Reavaliar enumeração e migração de tenant |
| T3 | Parecer DPO/jurídico do ADR-043 emitido | Registro de governança | titular | Habilita índice cross-PJ **fora** do laço vivo; NÃO reabre o grão — correlação continua sendo objeto separado (AQ-1) |
| T4 | Requisito validado (G1/G4) de isolamento duro por facility (invalida A3) | Registros G1/G4 | autoridade decisora | Reabrir §4.1 com a Opção B como candidata séria |
| T5 | Qualquer ambiente implantado revelar mecanismo de bypass cross-tenant | Testes negativos contínuos | AUTH-SECURITY | **Parada** — modelo de isolamento falseado; reabrir este ADR e o G6 (mesmo gatilho T6 do ADR-0004) |
| T6 | Tenant piloto nomeado pelo titular | Registro da decisão | orquestrador | Fechar C5; dimensionar onboarding |

### 8.3 Kill switch / rollback

Enquanto `proposed`, não há mecanismo a desligar. Restrições vigentes que funcionam como
controle: (i) nenhum armazenamento multi-tenant é criado antes da aceitação — criá-lo
seria decidir por omissão; (ii) desenvolvimento só com dados sintéticos (DEC-G0-03), de
modo que nenhum erro de escopo alcança dado real; (iii) na aceitação, o modelo deve
definir o kill switch operacional: como um tenant é **suspenso** (fail-closed, com
estado clínico visível como degradado — DOM-0007) sem afetar os demais, por quem e em
quanto tempo. Um modelo de tenancy sem suspensão por tenant deve registrar essa ausência
como risco.

---

## 9. Método de validação e evidência vinculada

| # | Afirmação a validar | Método | Ambiente | IDs vinculados |
|---|---|---|---|---|
| V1 | Todo recurso, cache, evento, consulta, assinatura e entrada de auditoria carrega exatamente um tenant verificado; despido dele, é rejeitado em todas as camadas | Testes de propriedade adversariais por camada | Teste (dados sintéticos) | TST-DOM-0001, TST-IDP-03; DOM-0001; QAS-0018 |
| V2 | Dois sujeitos sintéticos em tenants distintos com identificador de pessoa coincidente jamais são ligados por consulta, view, índice ou cache | Teste negativo de isolamento | Teste | TST-IDP-04; IDP-04/IDP-09; HAZ-0013 |
| V3 | Tenant do token ≠ tenant do contexto → negado; header de partição do cliente → rejeitado; tenant sem provisionamento → falha em vez de default; **nenhuma credencial com claim de bypass é aceita** (caso adicional de AQ-6) | Teste negativo que afirma impossibilidade | Ambiente nomeado | TST-IDP-05; HAZ-0003; SAF-0007 |
| V4 | Contexto de tenant ausente/inverificável ⇒ nenhum dado servido e estado explícito (nunca resposta vazia lida como normal) | Testes fail-closed + inspeção de estados de UI degradados | Teste | IDP-05, IDP-06; DOM-0004, DOM-0007; QAS-0014 |
| V5 | A hierarquia facility/unidade/leito roteia alertas ao destino correto dentro do tenant | Cenários de roteamento (com ADR-0009) | Teste | HAZ-0004, HAZ-0018; REQ: pendente de catálogo de requisitos |
| V6 | O enforcement escolhido em §4.2 cobre todas as superfícies de DOM-0001, verificado por suíte executada continuamente | Suíte adversarial contínua em CI + ambiente | CI + ambiente de teste | TST: pendente de arquitetura de testes (suíte contínua); QAS-0014, QAS-0018 |

**Disciplina de marcadores.** IDs `TST-IDP-*` e `TST-DOM-*` foram lidos de
`interim-identity-policy.md` e `DOM-invariants.md`; HAZ/SAF/QAS citados existem nos
catálogos de `docs/05-clinical-safety/` e `docs/06-architecture/quality-attributes/`.
`REQ:` permanece marcador literal — o catálogo de requisitos não existe (regra do
HANDOFF: placeholders permanecem até docs/04 pós-G1). **Nenhum ID foi inventado.**

---

## 10. Relações de supersessão

- **Supera:** nenhum.
- **Superado por:** nenhum.
- **Notas de relação:** consome AQ-4/AQ-6 (DECIDED, 2026-08-15) como restrições e as
  regras PERMANENTES da `interim-identity-policy.md` como política incorporada;
  a aceitação deste ADR e a do ADR-0004 devem declarar compatibilidade mútua (C2 —
  exigência registrada no `adr-index.md` §7 nota 5). Supersessão parcial por tenant,
  ambiente ou modo de operação é permitida e jamais generalizada de resultado parcial.

---

## 11. Autoverificação contra o gate de completude do template

Todos os campos da §10 do prompt presentes; três alternativas de grão + adiar, e três
classes de enforcement, todas com consequências positivas E negativas; drivers
discriminantes ligados a QAS; **nenhum alvo numérico inventado** (o único alvo
vinculante — zero cross-tenant — é decisão citada do titular, com fonte e data); oito
linhas transversais; reversibilidade, gatilhos e kill/rollback presentes; validação com
IDs reais e marcadores honestos; supersessão declarada; **nenhuma tecnologia
selecionada** (classe-RLS avaliada como alternativa condicional, conforme E7);
nenhuma aprovação fabricada; nenhum dono nomeado por este autor; `adr-index.md`
atualizado na mesma mudança.
