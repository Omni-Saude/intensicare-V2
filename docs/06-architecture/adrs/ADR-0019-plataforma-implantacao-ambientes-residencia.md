---
id: ADR-0019
title: Plataforma de implantação, ambientes próprios da V2, residência de dado no Brasil e fronteiras de rede
status: PROPOSAL
status_history:
  - status: PROPOSAL
    date: 2026-08-16
    by: especialista de plataforma/DevSecOps (ciclo 6, construção)
    note: >
      ID reservado como not-started em adr-index.md §3. Minuta redigida agora,
      materializando a DIREÇÃO já aceita pelo titular em GDEC-0016, sob o regime
      de construção GDEC-0013/0015/0017. Ver §5 sobre a distinção entre "direção
      aceita" e "minuta ratificada cláusula a cláusula".
date: 2026-08-16
owner: UNASSIGNED — VALIDAÇÃO NECESSÁRIA
approvers:
  - UNASSIGNED — VALIDAÇÃO NECESSÁRIA   # papel candidato: AUTH-OPERATIONS (adr-index.md §3)
  - UNASSIGNED — VALIDAÇÃO NECESSÁRIA   # papel candidato: AUTH-PRIVACY-LEGAL (driver de residência; DEC-G0-03 mantém este papel não preenchido)
decision_deadline: NÃO DEFINIDO — VALIDAÇÃO NECESSÁRIA
deciding_authority_rule: >
  docs/00-governance/decision-rights.md §2, linha "Decisões de arquitetura
  (ratificação de ADR)": AUTH-OPERATIONS mais AUTH-PRIVACY-LEGAL para o driver de
  residência. AUTH-PRIVACY-LEGAL permanece deliberadamente não preenchida
  (DEC-G0-03) até parecer jurídico brasileiro — esta ADR não presume tal parecer
  nem declara conformidade LGPD (regra dura desta tarefa).
independence_check: >
  O autor é preparador, não aprovador. Per decision-rights.md §3, quem detiver o
  pipeline de build/deploy (ADR-0022) não pode ser o único aprovador da escolha de
  plataforma que seu próprio pipeline promoverá.
links:
  drivers:
    domain_invariants: [DOM-0001, DOM-0007]
    quality_scenarios: [QAS-0012, QAS-0015, QAS-0027, QAS-0028, QAS-0029]
    risks: ["IDs pendentes no registro de riscos"]
  constrains:
    requirements: ["REQ: catálogo de requisitos pendente"]
    clinical: ["CLR: não aplicável — esta ADR não vincula conteúdo clínico"]
    safety: ["SAF: nenhuma referência direta — modo degradado por indisponibilidade de ambiente é DOM-0007"]
  hazards: [HAZ-0028, HAZ-0034]
  tests: ["TST: arquitetura de testes pendente"]
  validations: ["VAL: backlog de validação pendente"]
  adrs:
    depends_on: [ADR-0001, ADR-0002]
    feeds: [ADR-0017, ADR-0020, ADR-0022]
  gates: [G6, G8]
  evidence:
    - INTENSICARE_V2_ORCHESTRATOR_PROMPT.md §15.2
    - docs/06-architecture/adrs/ADR-0001-amh-platform-boundary.md §5 (formulação do titular)
    - docs/06-architecture/adrs/ADR-0002-modular-monolith-and-extraction-criteria.md (accepted, Opção A)
    - docs/11-security-privacy-compliance/threat-model.md THR-0060
supersedes: null
superseded_by: null
provenance:
  source_repo: intensicare-V2
  path_or_url: docs/06-architecture/adrs/ADR-0019-plataforma-implantacao-ambientes-residencia.md
  commit_sha_or_version: 33c749a (HEAD do repositório no momento da redação)
  section_or_lines: >
    INTENSICARE_V2_ORCHESTRATOR_PROMPT.md §15.2 (linhas 1099-1117); ADR-0001 §5
    (formulação do titular "a V2 SEMPRE consome dados da AMH; nunca ingestão
    direta"); adr-index.md §3 linha ADR-0019, §4.1 linha ADR-0019; GDEC-0016/0017
  date_collected: 2026-08-16
  collector: especialista de plataforma/DevSecOps (ciclo 6, construção)
  transformation: reasoned-from
  confidence: medium
  owner: UNASSIGNED — VALIDAÇÃO NECESSÁRIA
  validation_status: VALIDAÇÃO NECESSÁRIA
---

# ADR-0019 — Plataforma de implantação, ambientes próprios, residência de dado e fronteiras de rede

> **Status: accepted (direção GDEC-0016; minuta materializada em construção —
> GDEC-0015).** O titular aceitou, em lote (GDEC-0016, 2026-08-16), a *direção*
> deste tópico. Esta minuta materializa essa direção para permitir construção
> imediata; não é ratificação cláusula a cláusula. **Nenhuma alegação de
> conformidade LGPD/ANVISA é feita aqui** — residência de dado é tratada como
> *driver de arquitetura*, não como prova de conformidade (regra dura desta
> tarefa; SOURCE prompt §13: "Do not state compliance").

## 1. Contexto e enunciado do problema

SOURCE (prompt §15.2): definir ambientes de desenvolvimento, preview efêmero,
integração/conformidade, staging, shadow, piloto e produção conforme necessário;
usar infraestrutura como código somente após a ADR de plataforma; separar
tenants/contas/projetos e segredos apropriadamente; o pipeline deve promover o
artefato idêntico por ambiente, com rollback/roll-forward rápido.

INFERENCE (de ADR-0001 §5, aceita com a formulação do titular "a V2 SEMPRE
consome dados da AMH; nunca ingestão direta"): a V2 não é um módulo hospedado
dentro da fronteira de plataforma da AMH — ela é uma plataforma própria que
consome dados da AMH por contrato externo. Isso torna esta ADR responsável por
**ambientes que a V2 possui e opera**, não por convenções herdadas de uma
plataforma de terceiros.

INFERENCE (de ADR-0002, aceita Opção A — monolito modular): a unidade de
implantação inicial é um único artefato implantável por ambiente — a estratégia
de plataforma desta ADR promove esse artefato único através dos ambientes
definidos abaixo (§15.2 item 10), não uma frota heterogênea de serviços.

**Pergunta.** Que classe de plataforma, quais ambientes nomeados, que driver de
residência de dado e que fronteiras de rede a V2 opera — de modo que o driver
LGPD de manter dado clínico em território brasileiro seja uma propriedade da
arquitetura desde o primeiro ambiente, e não uma migração posterior?

**Fora de escopo:** seleção de provedor de nuvem específico (nenhuma evidência de
avaliação de fornecedor existe — regra §3-14 proíbe herdar escolha do legado sem
justificativa medida); gestão de chave e PHI pesquisável (ADR-0017, que depende
desta); SLOs/DR (ADR-0020); build/assinatura de artefato (ADR-0022, que depende
desta); a própria fronteira AMH (ADR-0001, já aceita e consumida aqui como
insumo).

## 2. Evidência e premissas

### 2.1 Evidência

| # | Rótulo | Declaração | Fonte | Confiança |
|---|---|---|---|---|
| E1 | SOURCE | Ambientes: dev, preview efêmero, integração/conformidade, staging, shadow, piloto, produção "conforme necessário". IaC apenas após a ADR de plataforma. | prompt §15.2 | alta |
| E2 | SOURCE | Pipeline deve: construir artefato mínimo não-root; gerar SBOM/assinatura (ADR-0022); implantar por digest em ambiente efêmero; rodar migrações com estratégia de rollback; promover o artefato idêntico por ambiente; suportar rollback/roll-forward rápido, kill switch de regra, isolamento de conector, reconciliação. | prompt §15.2 itens 3-11 | alta |
| E3 | SOURCE | "Never deploy `latest`, placeholder secrets, unpinned actions, or environment-specific builds." Configuração tipada, namespaced, validada no startup, fail-closed para identidade/chaves/regras/dependências. | prompt §15.2 | alta |
| E4 | SOURCE | ADR-0001 (aceita): a V2 sempre consome dados da AMH via contrato externo; nunca ingestão direta — a V2 opera sua própria fronteira de plataforma. | ADR-0001 §5 | alta |
| E5 | SOURCE | ADR-0002 (aceita, Opção A): unidade de implantação inicial é um monolito modular único, com fronteiras de módulo impostas mecanicamente. | ADR-0002 §5, front matter | alta |
| E6 | SOURCE | THR-0060 (P1): restaurar backup/snapshot/exportação de evidência em ambiente inferior, máquina de desenvolvedor ou região não aprovada é, além de exposição de PHI, "um evento de residência de dado cuja significância legal é VALIDATION REQUIRED". | threat-model.md THR-0060 | alta |
| E7 | SOURCE | HAZ-0028 (P0): PHI/identificadores em log/trace/métrica/exportação/backup cruzam fronteira de residência para um sistema com controle mais fraco. | hazard-log.md HAZ-0028 | alta |
| E8 | SOURCE | Nenhuma determinação jurídica LGPD/ANVISA existe; `AUTH-PRIVACY-LEGAL` permanece deliberadamente não preenchida até parecer jurídico brasileiro (DEC-G0-03). | decision-register.md DEC-G0-03 | alta |

### 2.2 Premissas

**PREMISSA (reversível, GDEC-0017):** a stack de construção — Node.js 22 LTS,
monorepo pnpm workspaces (pnpm 9), persistência de classe PostgreSQL com PGlite
(`@electric-sql/pglite`) em dev/teste e Postgres real reservado para ambientes
futuros, `apps/api` e `apps/web` como os dois artefatos implantáveis do monolito
modular — está registrada em `docs/06-architecture/premissas-de-construcao.md`
pelo agente de scaffold; esta ADR consome essa premissa sem redecidi-la.

| # | Premissa | Por que é necessária | O que a invalida | Titular |
|---|---|---|---|---|
| A1 | Nenhum ambiente de produção-similar existe hoje do lado V2 nem do lado AMH (E2 do ADR-0001 já registra isso para a AMH). | Todo ambiente descrito abaixo é aspiracional até provisionado. | Provisionamento real de qualquer ambiente nomeado. | UNASSIGNED — VALIDAÇÃO NECESSÁRIA |
| A2 | Um provedor de nuvem com data center ou região no Brasil é tecnicamente disponível para a classe de carga desta V2 (compute + Postgres-classe + objeto). | Sustenta o driver de residência sem inventar um fornecedor específico. | Ausência de opção viável de região brasileira para a classe de carga necessária. | UNASSIGNED — VALIDAÇÃO NECESSÁRIA |
| A3 | O time operante inicial é pequeno (INFERENCE de ADR-0002 A1/D7) — a contagem de ambientes simultâneos mantidos deve começar mínima (dev + CI efêmero) e crescer por necessidade, não por completude de checklist. | Evita comprometer capacidade operacional inexistente. | Plano de staffing conhecido que mude a capacidade operante. | UNASSIGNED — VALIDAÇÃO NECESSÁRIA |

## 3. Direcionadores de decisão

| # | Direcionador | Por que discrimina | Atributo mensurável | Alvo |
|---|---|---|---|---|
| D1 | Residência de dado no Brasil como driver arquitetural (E6, E7, E8) | Distingue "região desde o primeiro ambiente que toca dado real/sintético representativo" de "residência como migração futura" — a segunda opção reabre THR-0060 a cada promoção | QAS-0028 | Vinculante como driver; nenhuma alegação de conformidade |
| D2 | Coerência com o monolito modular (E5) | Um único artefato promovido identicamente por ambiente (E2 item 10) é mais barato de operar do que uma frota heterogênea | QAS-0027 | Vinculante por coerência com ADR-0002 |
| D3 | Fronteiras de rede e segredo por ambiente/tenant (E1, E3) | Distingue "segredo namespaced e fail-closed" de "segredo compartilhado entre ambientes" (precedente negativo do assessment legado) | QAS-0014 | VALIDAÇÃO NECESSÁRIA (mecanismo em ADR-0016/0017) |
| D4 | Promoção do artefato idêntico + rollback/roll-forward (E2) | Distingue "mesmo binário/imagem promovido por digest" de "build específico de ambiente" — a segunda é proibida por E3 | QAS-0026 | Vinculante |
| D5 | Capacidade operacional real (A3) | Mais ambientes nomeados sem dono é dívida, não capacidade (INFERENCE de ADR-0002 D7) | QAS-0029 | VALIDAÇÃO NECESSÁRIA |
| D6 | Reversibilidade de plataforma (A2) | Comprometer-se com um único fornecedor sem avaliação medida eleva o custo de saída — mas adiar residência também tem custo (D1) | QAS-0027 | VALIDAÇÃO NECESSÁRIA |
| D7 | Custo | Mais ambientes/regiões = mais custo de infraestrutura e observabilidade; nenhum modelo de custo existe. | — | VALIDAÇÃO NECESSÁRIA |

## 4. Alternativas consideradas

### Opção A — Ambientes V2 próprios em plataforma com residência de dado no Brasil, artefato único promovido por digest, fronteiras de rede e segredo segregadas por ambiente/tenant (elaboração da direção aceita GDEC-0016)

**Descrição.** A V2 opera seus próprios ambientes nomeados (dev local, CI
efêmero por PR, integração/conformidade, staging, shadow, piloto, produção — cada
um provisionado por necessidade real, não por completude de checklist, per A3).
A classe de plataforma escolhida — sem nomear fornecedor específico nesta ADR —
compromete-se contratualmente a manter o processamento e a persistência de dado
clínico (real ou sintético representativo) em território brasileiro, tratando
isso como *requisito de seleção de fornecedor futuro* (ADR de plataforma
concreto, se necessário) e não como afirmação de conformidade LGPD já obtida.
Segredos e configuração são namespaced por ambiente e por tenant, tipados,
validados no startup, fail-closed (E3). O artefato implantável único do monolito
modular (E5) é promovido por digest idêntico através dos ambientes (E2 item 10);
nenhum build é específico de ambiente.

**Frente aos direcionadores.** D1 forte — residência é requisito de seleção
desde o início, não retrofit. D2 forte — um artefato, promovido identicamente.
D3 forte em estrutura; mecanismo concreto fica com ADR-0016/0017. D4 forte por
construção (digest + IaC pós-esta-ADR). D5 — mitigado por A3 (crescer por
necessidade). D6 — mantém-se neutro quanto a fornecedor, preservando
reversibilidade até haver avaliação medida. D7 permanece VALIDATION REQUIRED,
dito honestamente.

**Consequências positivas.** THR-0060/HAZ-0028 (residência e exposição por
promoção para ambiente inferior/região errada) tornam-se detectáveis desde o
primeiro ambiente real, porque "região correta" é parte da definição de ambiente,
não uma auditoria posterior; nenhuma dependência de convenções de plataforma de
terceiros (coerente com E4).

**Consequências negativas.** Nenhum fornecedor está nomeado — a decisão concreta
de "qual nuvem, qual região exata" permanece um ADR ou anexo futuro, o que
significa que esta ADR, sozinha, não é suficiente para provisionar infraestrutura
real; exige que qualquer avaliação de fornecedor futura traga residência Brasil
como critério não-negociável, o que pode eliminar opções de menor custo.

**O que precisaria ser verdade.** A2 (opção viável de região brasileira existe
para a classe de carga necessária); a organização aceita não nomear fornecedor
até uma avaliação medida.

**Custo de saída.** Baixo-moderado: a estrutura de ambientes e a disciplina de
promoção por digest sobrevivem a qualquer escolha de fornecedor; o que se perde
ao trocar de fornecedor é o trabalho de IaC específico, não a decisão em si.

### Opção B — Reutilizar a plataforma/ambientes da AMH para a V2

**Descrição.** A V2 seria implantada dentro da infraestrutura e convenções de
ambiente já operadas pela AMH.

**Frente aos direcionadores.** D1 — a residência passaria a depender de decisão
já tomada (ou não) pela AMH, fora do controle desta ADR. D2 — contradiz
diretamente E4: ADR-0001 já foi aceita com a formulação do titular de que a V2
**nunca** faz ingestão direta e sempre consome a AMH por contrato — hospedar a V2
dentro da fronteira de plataforma da AMH é a "opção (b)" que a própria aceitação
de ADR-0001 tratou como a mais estrita a ser superada, não adotada. D5 — capacidade
operacional AMH é desconhecida do lado V2 (compatibility-finding.md registra
ambiente `dev`-apenas do lado AMH).

**Consequências positivas.** Potencial reuso de infraestrutura já paga.

**Consequências negativas.** **Diretamente incompatível com a direção já aceita
de ADR-0001** — não é uma alternativa viva, é listada para que sua rejeição seja
honesta e registrada, não silenciosa.

**O que precisaria ser verdade.** ADR-0001 seria reaberta e revertida — não
proposto por esta ADR.

**Custo de saída.** Não aplicável — opção não adotável sob a decisão já aceita.

### Opção Z — Adiar; provisionar infraestrutura ad hoc por necessidade imediata, sem ADR de plataforma

**Descrição.** Nenhuma postura de plataforma registrada; cada ambiente é criado
pela primeira pessoa que precisar dele.

**Consequências positivas.** Nenhum comprometimento prematuro com região ou
classe de plataforma.

**Consequências negativas.** THR-0060 (restauração em região não aprovada) e
HAZ-0028 (PHI cruzando fronteira de residência) tornam-se prováveis por omissão —
exatamente o modo de falha que esta ADR existe para prevenir; IaC "após a ADR de
plataforma" (E1) não tem onde ancorar.

**Custo do atraso.** Cresce a cada ambiente provisionado sem a disciplina de
residência — reverter significa migrar dado já em repouso na região errada.

### 4.1 Comparação frente aos direcionadores

| Direcionador | A — ambientes V2 próprios, residência BR | B — dentro da AMH | Z — adiar |
|---|---|---|---|
| D1 residência | Requisito de seleção desde o início | Fora do controle desta ADR | Por omissão, provável violação |
| D2 coerência com ADR-0002 | Forte | Contradiz ADR-0001 aceita | Não resolvido |
| D3 segregação de rede/segredo | Estrutura forte, mecanismo em 0016/0017 | Herdada da AMH, fora do controle V2 | Ausente |
| D4 promoção por digest | Vinculante | Depende de convenção AMH | Ad hoc |
| D5 capacidade operacional | Mitigada por crescimento por necessidade | Desconhecida (AMH `dev`-apenas) | Ilimitada sem dono |
| D6 reversibilidade | Neutra quanto a fornecedor | Acoplada à AMH | Preservada, mas sem estrutura |
| D7 custo | VALIDATION REQUIRED, dito | VALIDATION REQUIRED | Zero agora, alto depois |

## 5. Decisão e escopo

**Direção aceita (GDEC-0016, 2026-08-16):** **Opção A** — ambientes V2 próprios,
residência de dado no Brasil como driver de seleção de plataforma (não como
alegação de conformidade), artefato único promovido por digest, fronteiras de
rede/segredo segregadas por ambiente e tenant. A minuta §5.2 materializa essa
direção como premissa reversível de construção (GDEC-0013/0015): implementação
prossegue sem aguardar ratificação cláusula a cláusula.

**Escopo vinculado (enquanto premissa de construção):** a existência e nomeação
dos ambientes; o driver de residência para qualquer avaliação futura de
fornecedor; a disciplina de artefato único promovido por digest; a segregação
estrutural de segredo/rede por ambiente e tenant.

**Não vinculado:** o fornecedor de nuvem concreto ou região exata (nenhuma
seleção é feita aqui); gestão de chave (ADR-0017); SLOs/DR (ADR-0020);
build/assinatura (ADR-0022); qualquer alegação de conformidade LGPD/ANVISA.

### 5.1 Condições para ratificação formal (cláusula a cláusula, humana)

| # | Condição | Titular | Evidência que a fecha | Estado |
|---|---|---|---|---|
| C1 | Parecer jurídico brasileiro sobre residência/LGPD determina se o driver D1, como formulado, é suficiente ou exige cláusula contratual específica (processador, sub-processador, transferência internacional). | AUTH-PRIVACY-LEGAL (não nomeado, DEC-G0-03) | Parecer registrado | ABERTA — deliberadamente fora do alcance de agente (DEC-G0-03) |
| C2 | Avaliação medida de ao menos duas opções de fornecedor com região no Brasil, contra D2-D7. | AUTH-OPERATIONS | Anexo de avaliação de fornecedor | ABERTA |
| C3 | Capacidade operacional real (staffing) conhecida — condiciona quantos ambientes além de dev/CI são sustentáveis (A3/D5). | AUTH-OPERATIONS | Modelo operacional registrado | ABERTA |

### 5.2 Minuta normativa (o que a construção segue sob GDEC-0015/0017)

**P1 — Ambientes mínimos de construção.** Sob o regime de construção (G7 ainda
não fechado), apenas dois ambientes são mantidos: **desenvolvimento local**
(PGlite in-process, sem dado real) e **CI efêmero por PR/branch** (mesma
persistência de classe PostgreSQL, dados exclusivamente `SYNTH-`). Staging,
shadow, piloto e produção são nomeados e reservados nesta ADR, mas **não
provisionados** até C3 fechar e até haver evidência de que o time operante os
sustenta (E1 "conforme necessário"; A3).

**P2 — Residência como requisito de seleção, não alegação.** Qualquer avaliação
futura de fornecedor de nuvem (C2) trata "processamento e persistência de dado
clínico em território brasileiro" como critério eliminatório, não como um dos
vários pesos. Nenhuma declaração de conformidade LGPD é feita por este ADR ou por
qualquer artefato de construção até C1 fechar.

**P3 — Artefato único por digest.** O pipeline (ADR-0022) constrói exatamente um
artefato implantável do monolito modular por commit; a promoção entre ambientes
referencia o mesmo digest — nunca rebuild específico de ambiente (E3).

**P4 — Configuração tipada, namespaced, fail-closed.** Toda configuração de
ambiente (URL de banco, segredo, flag de rule bundle) é validada no startup;
ausência de configuração obrigatória falha o boot — nunca degrada silenciosamente
para um default inseguro (E3; DOM-0007 aplicado à camada de plataforma).

**P5 — Segregação por ambiente e tenant.** Segredos e credenciais são namespaced
por ambiente; nenhum segredo de produção é acessível de um ambiente inferior. A
segregação por tenant dentro de um mesmo ambiente é matéria de ADR-0016
(autorização/isolamento) — esta ADR apenas exige que a fronteira de ambiente não
seja o único controle.

**P6 — IaC apenas após esta ADR.** Qualquer infraestrutura como código
introduzida a partir de agora cita esta ADR como sua premissa de plataforma (E1)
— nenhum ambiente é provisionado por script ad hoc fora dessa disciplina.

**P7 — Rollback/roll-forward e reconciliação.** Todo ambiente além de
desenvolvimento local declara sua estratégia de rollback/roll-forward e
reconciliação pós-indisponibilidade antes de receber tráfego real (E2 item 11;
HAZ-0034) — não é um anexo posterior.

### 5.3 Escopo do que a aceitação vincularia

**Vincula:** a lista de ambientes nomeados e sua ordem de provisionamento por
necessidade (P1); residência como critério eliminatório de fornecedor (P2);
artefato único por digest (P3); configuração fail-closed (P4); segregação
estrutural de segredo (P5); disciplina de IaC pós-ADR (P6).

**Não vincula:** fornecedor/região concreta; conformidade LGPD/ANVISA; gestão de
chave (ADR-0017); SLOs numéricos (ADR-0020).

## 6. Consequências

### 6.1 Positivas

- Residência de dado deixa de ser uma migração futura e vira critério de seleção
  desde o primeiro ADR de plataforma real — reduz a probabilidade de reproduzir
  THR-0060/HAZ-0028.
- O regime de construção ganha uma resposta explícita para "onde os dois
  ambientes mínimos (dev/CI) rodam" sem comprometer a organização com um
  fornecedor não avaliado.

### 6.2 Negativas

- Nenhuma infraestrutura de staging/shadow/piloto/produção existe ainda — a fatia
  G7 e qualquer demonstração além de dev/CI dependem de C2/C3 fecharem primeiro.
- D3 (segregação de rede) permanece estrutural até ADR-0016/0017 fixarem
  mecanismo — um gap explícito, não escondido.

### 6.3 Neutras/estruturais

- Nada aqui seleciona fornecedor, região exata, ou produto de banco de dados além
  da premissa de classe já registrada (PGlite dev/teste).

## 7. Implicações transversais

| Dimensão | Implicação | Rótulo | Papel titular | ID de acompanhamento |
|---|---|---|---|---|
| Segurança clínica | Ambiente de produção-similar inexistente (A1) significa que nenhuma validação de latência/carga real do laço de segurança pode ocorrer ainda — condição já registrada como pendência estrutural, não escondida. | INFERENCE | AUTH-CLINSAFETY | ADR-0020 |
| Segurança (security) | Segregação de segredo por ambiente (P5) é pré-condição para qualquer gestão de chave (ADR-0017); ambiente inferior nunca acessa segredo de produção. | INFERENCE de E3 | AUTH-SECURITY | ADR-0017 |
| Privacidade (LGPD) | Residência é driver de seleção (P2), não alegação de conformidade; parecer jurídico (C1) permanece obrigação externa e não é presumido. | VALIDATION REQUIRED | AUTH-PRIVACY-LEGAL (não nomeado) | HAZ-0028; THR-0060 |
| Interoperabilidade | Nenhum impacto direto — contratos externos (ADR-0012/0013) são idênticos sob qualquer ambiente. | INFERENCE | AUTH-DATA-PLATFORM | ADR-0012 |
| Acessibilidade | Nenhuma implicação direta de plataforma; indireta via disponibilidade de ambiente de teste com tecnologia assistiva (ADR-0021 depende de um ambiente existir). | INFERENCE | AUTH-UX | ADR-0021 |
| Operacional | Define diretamente a lista de ambientes, a disciplina de promoção por digest e a exigência de rollback declarado (P7) antes de qualquer ambiente real receber tráfego. | INFERENCE | AUTH-OPERATIONS | ADR-0020, ADR-0022 |
| Custo | Nenhum modelo de custo existe (D7); mais ambientes/regiões escalam custo — nenhum número é inventado. | VALIDATION REQUIRED | AUTH-OPERATIONS | pendente |
| Migração | Se um fornecedor futuro não atender à residência (C2), migrar dado já em repouso é a própria falha que P2 existe para prevenir. | INFERENCE | AUTH-OPERATIONS | pendente |

## 8. Reversibilidade, gatilhos de revisita, kill/rollback

### 8.1 Avaliação de reversibilidade

| Opção | Reversibilidade | O que fica encalhado | Rótulo |
|---|---|---|---|
| A | Alta enquanto nenhum fornecedor está nomeado; moderada após C2 fechar e infraestrutura real existir | Configuração de IaC específica de fornecedor, uma vez escrita | INFERENCE |
| B | Não aplicável — incompatível com ADR-0001 aceita | n/a | INFERENCE |
| Z | n/a — custo de opção crescente até o primeiro ambiente real | n/a | INFERENCE |

### 8.2 Gatilhos de revisita

| # | Gatilho | Detecção | Notifica | Ação |
|---|---|---|---|---|
| T1 | Parecer jurídico LGPD (C1) emitido | Registro de parecer | AUTH-PRIVACY-LEGAL, AUTH-OPERATIONS | Fechar C1; revisar P2 contra o texto do parecer |
| T2 | Avaliação de fornecedor concluída (C2) | Anexo de avaliação | AUTH-OPERATIONS | Selecionar fornecedor em ADR/anexo próprio; esta ADR permanece a premissa, não a escolha final |
| T3 | Terceiro ambiente (além de dev/CI) demandado pela fatia G7/G8 | Plano de gate | AUTH-OPERATIONS | Provisionar sob P1-P7; confirmar C3 primeiro |
| T4 | Restauração/exportação de evidência detectada fora da região aprovada (THR-0060) | Auditoria/alerta operacional | AUTH-SECURITY, AUTH-PRIVACY-LEGAL | Tratar como incidente — nunca como variação aceitável |

### 8.3 Kill switch / rollback

Nada a desligar em `proposed`/construção com apenas dev/CI provisionados.
Restrição permanente: nenhum ambiente além de dev/CI recebe dado real ou
sintético representativo de escala até declarar sua própria estratégia de
rollback/roll-forward e reconciliação (P7) — um ambiente sem essa declaração é
defeito bloqueante de revisão.

## 9. Método de validação e evidência vinculada

| # | Alegação | Método de validação | Ambiente | IDs vinculados |
|---|---|---|---|---|
| V1 | O artefato promovido é byte-idêntico (mesmo digest) entre ambientes. | Comparação de digest no pipeline; teste de promoção. | CI + ambiente efêmero | QAS-0026; ADR-0022 |
| V2 | Boot falha (fail-closed) quando configuração obrigatória está ausente. | Teste de inicialização com configuração incompleta. | Teste | QAS-0029 |
| V3 | Segredo de um ambiente não é acessível de outro. | Teste adversarial de acesso cross-ambiente. | Ambiente de teste | QAS-0014; HAZ-0028 |
| V4 | Nenhuma exportação/backup alcança região fora da aprovada. | Auditoria de destino de exportação/backup contra a lista de regiões aprovadas (quando C2 fechar). | Ambiente real (futuro) | THR-0060; HAZ-0028 |

## 10. Relações de supersessão

- **Supersede:** nenhuma.
- **Superseded by:** nenhuma.
- **Notas de relação:** consome a direção já aceita de ADR-0001 (V2 nunca
  hospedada dentro da fronteira AMH) e de ADR-0002 (monolito modular) como
  insumos fixos; alimenta ADR-0017 (chave), ADR-0020 (SLO/DR) e ADR-0022
  (build/supply chain).

## 11. Autoverificação contra o gate de completude do template

Campos de identidade presentes; três alternativas (A/B/Z) com consequências
positivas e negativas honestas — B é rejeitada por incompatibilidade com decisão
já aceita, e isso é dito explicitamente em vez de omitido; direcionadores mapeados
a QAS existentes; **nenhum limiar numérico inventado**; **nenhuma alegação de
conformidade LGPD/ANVISA feita**; **nenhum fornecedor de nuvem selecionado**; oito
linhas transversais presentes; reversibilidade, gatilhos e kill/rollback
presentes; validação com IDs reais; supersessão declarada; nenhuma aprovação
fabricada; `adr-index.md` **não** foi tocado por este autor (fora do escopo de
escrita desta tarefa).
