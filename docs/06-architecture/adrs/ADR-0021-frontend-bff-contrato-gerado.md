---
id: ADR-0021
title: Estratégia de frontend/BFF e de contrato gerado — camada de apresentação dona da linguagem
status: PROPOSAL
status_history:
  - status: PROPOSAL
    date: 2026-08-16
    by: especialista de UX/frontend (ciclo 6, construção)
    note: >
      ID reservado como not-started em adr-index.md §3. Minuta redigida agora,
      materializando a DIREÇÃO já aceita pelo titular em GDEC-0016 — incluindo a
      MODIFICAÇÃO explícita do titular sobre esta ADR específica (§5) — sob o
      regime de construção GDEC-0013/0015/0017. Ver §5 sobre a distinção entre
      "direção aceita" e "minuta ratificada cláusula a cláusula".
date: 2026-08-16
owner: UNASSIGNED — VALIDAÇÃO NECESSÁRIA
approvers:
  - UNASSIGNED — VALIDAÇÃO NECESSÁRIA   # papel candidato: AUTH-UX (adr-index.md §3)
  - UNASSIGNED — VALIDAÇÃO NECESSÁRIA   # papel candidato: AUTH-PRODUCT (adr-index.md §3)
decision_deadline: NÃO DEFINIDO — VALIDAÇÃO NECESSÁRIA
deciding_authority_rule: >
  docs/00-governance/decision-rights.md §2, linha "Decisões de arquitetura
  (ratificação de ADR)": AUTH-UX mais AUTH-PRODUCT. A modificação do titular em
  GDEC-0016 (§5 abaixo) já fixa o eixo central desta ADR; a ratificação cláusula a
  cláusula da minuta §5.2 permanece um ato humano separado.
independence_check: >
  O autor é preparador, não aprovador. Per decision-rights.md §3, quem implementar
  a camada de apresentação (frontend) não pode ser o único aprovador da regra que
  audita se um ajuste de termo alterou o estado clínico subjacente (par
  implementador × verificador de auditabilidade).
links:
  drivers:
    domain_invariants: [DOM-0001, DOM-0004, DOM-0007]
    quality_scenarios: [QAS-0005, QAS-0006, QAS-0007, QAS-0017, QAS-0028]
    risks: ["IDs pendentes no registro de riscos"]
  constrains:
    requirements: ["REQ: catálogo de requisitos pendente"]
    clinical: ["CLR: não aplicável — esta ADR não gera conteúdo clínico, apenas apresenta o originado no backend"]
    safety: ["SAF: nenhuma referência direta — DOM-0004/0007 já vinculam a apresentação de estado clínico"]
  hazards: [HAZ-0025, HAZ-0037]
  tests: ["TST: arquitetura de testes pendente"]
  validations: ["VAL: backlog de validação pendente"]
  adrs:
    depends_on: [ADR-0011, ADR-0012]
    feeds: []
  gates: [G4]
  evidence:
    - INTENSICARE_V2_ORCHESTRATOR_PROMPT.md §11
    - docs/00-governance/registers/decision-register.md GDEC-0016
    - docs/06-architecture/adrs/ADR-0011-projecoes-de-leitura-e-entrega-tempo-real-autorizada.md §5.2 (P6, P7)
    - docs/06-architecture/adrs/ADR-0029-pt-br-clinical-terminology-validation-process.md
supersedes: null
superseded_by: null
provenance:
  source_repo: intensicare-V2
  path_or_url: docs/06-architecture/adrs/ADR-0021-frontend-bff-contrato-gerado.md
  commit_sha_or_version: 33c749a (HEAD do repositório no momento da redação)
  section_or_lines: >
    INTENSICARE_V2_ORCHESTRATOR_PROMPT.md §11 (linhas 914-953); adr-index.md §3
    linha ADR-0021 (nota de modificação do titular), §4.1 linha ADR-0021;
    GDEC-0016 (decision-register.md, item ADR-0021)
  date_collected: 2026-08-16
  collector: especialista de UX/frontend (ciclo 6, construção)
  transformation: reasoned-from
  confidence: medium
  owner: UNASSIGNED — VALIDAÇÃO NECESSÁRIA
  validation_status: VALIDAÇÃO NECESSÁRIA
---

# ADR-0021 — Estratégia de frontend/BFF e de contrato gerado

> **Status: accepted (direção GDEC-0016; minuta materializada em construção —
> GDEC-0015).** O titular aceitou, em lote (GDEC-0016, 2026-08-16), a direção
> deste tópico **com uma modificação própria e vinculante**: *"o frontend deve
> melhorar a comunicação e ajustar termos quando necessário, não apenas exibir o
> texto do backend — UX e UI são de primeira classe (os estados clínicos
> continuam originados no backend; a camada de apresentação é dona da
> linguagem)"*. Esta minuta materializa essa direção modificada em cláusulas
> concretas; não é ratificação cláusula a cláusula pelo titular.

## 1. Contexto e enunciado do problema

SOURCE (prompt §11): a experiência deve ser desenhada a partir do trabalho
observado, não de telas legadas; o frontend **nunca deve inventar semântica
clínica**; um único modelo de estado compartilhado vive em domínio/contratos de
API, e tipos de frontend são gerados ou validados a partir dele; estados
obrigatórios cobrem carregamento/vazio/indisponível/proibido/tempo-esgotado,
frescor de dado, validade de avaliação, estados de item de trabalho, conectividade
e sessão; toda tela carrega uma tabela de contrato UI/backend; filtragem,
paginação, agregação e autorização são server-authoritative; nenhum estado
otimista local pode mascarar falha de comando relevante à segurança.

SOURCE (GDEC-0016, modificação do titular): o frontend **deve melhorar a
comunicação e ajustar termos quando necessário** — não é um espelho passivo do
texto do backend. UX/UI são de primeira classe. **Nota do escriba, registrada no
próprio texto da decisão:** ajustes de termo preservam o estado clínico do
backend — essa é a condição de auditabilidade sob a qual a modificação é
concedida.

**A tensão central desta ADR** é resolver essas duas exigências
simultaneamente sem que uma anule a outra: "nunca inventar semântica clínica"
(prompt §11, não-negociável) e "a camada de apresentação é dona da linguagem"
(modificação do titular, vinculante). A resolução proposta (§5.2) é que **o
identificador de estado é do backend; a redação que o representa é do
frontend** — e a auditoria referencia sempre o identificador, nunca o texto.

**Pergunta.** Existe um BFF como serviço separado, ou a camada de tradução mora
dentro de `apps/web`? Como o contrato entre backend e frontend é gerado ou
validado (ADR-0012)? E que regras governam até onde a camada de apresentação pode
ajustar termos sem deixar de ser auditável contra o estado originado no backend?

**Fora de escopo:** a forma do contrato de API em si (ADR-0012, consumido aqui
como insumo); o mecanismo de autorização por push (ADR-0011, consumido como
insumo); o processo de validação terminológica pt-BR em si (ADR-0029, aceita —
esta ADR usa esse processo, não o redefine); autenticação/sessão (ADR-0015).

## 2. Evidência e premissas

### 2.1 Evidência

| # | Rótulo | Declaração | Fonte | Confiança |
|---|---|---|---|---|
| E1 | SOURCE | "The frontend must never invent clinical semantics. Define one shared state model in domain/API contracts and generate or validate frontend types from it." | prompt §11 | alta |
| E2 | SOURCE | Estados obrigatórios mínimos cobrem carregamento/vazio/indisponível/proibido/tempo-esgotado/retentando/parcial; frescor (fresh/aging/stale/expired/missing/invalid/conflicted/corrected/superseded); validade de avaliação; estados de item de trabalho; conectividade; sessão. | prompt §11 | alta |
| E3 | SOURCE | Toda tela exige tabela de contrato UI/backend: elemento/ação, objetivo do usuário, API/query/comando autoritativo, estado de domínio, frescor, autorização, comportamento otimista, falha/recuperação, evento de auditoria, teste de aceitação. | prompt §11 | alta |
| E4 | SOURCE | "No local optimistic state that can mask a failed safety-relevant command." | prompt §11 | alta |
| E5 | SOURCE | Explicabilidade: mostrar insumos, insumos ausentes, tempo de fonte, versão de regra, racional e incerteza sem sobrecarregar; anúncios de live-region testados e sinais não dependentes apenas de cor; WCAG 2.2 AA. | prompt §11 | alta |
| E6 | SOURCE (GDEC-0016) | O titular modificou a direção desta ADR: frontend melhora comunicação e ajusta termos quando necessário; UX/UI de primeira classe; estados clínicos originados no backend; camada de apresentação dona da linguagem; ajustes de termo preservam o estado clínico (condição de auditabilidade — nota do escriba). | decision-register.md GDEC-0016 | alta |
| E7 | SOURCE | ADR-0011 P6/P7 (aceitas): o contrato de projeção inclui estado de conexão e frescor por superfície; a projeção entrega o status pronto — "o cliente não o deriva". | ADR-0011 §5.2 | alta |
| E8 | SOURCE | ADR-0029 (aceita): processo de validação de terminologia clínica pt-BR existe e é a fonte normativa de vocabulário para qualquer superfície que fale com o clínico. | ADR-0029 | alta |
| E9 | SOURCE | ADR-0002 (aceita, Opção A): extração de módulo/serviço exige ADR própria com gatilho quantitativo, justificativa de fronteira de falha, titular operacional, caminho de migração e plano de rollback. | ADR-0002 §5.2 | alta |

### 2.2 Premissas

**PREMISSA (reversível, GDEC-0017):** a stack de construção do frontend — React
18 + Vite + TypeScript, pt-BR clínico, WCAG 2.2 AA como requisito de projeto, e
os estados obrigatórios do §11 do prompt como checklist mínima de componente —
está registrada em `docs/06-architecture/premissas-de-construcao.md` pelo agente
de scaffold; esta ADR consome essa premissa sem redecidi-la.

| # | Premissa | Por que é necessária | O que a invalida | Titular |
|---|---|---|---|---|
| A1 | Nenhum microsserviço BFF separado é necessário na fatia inicial — o monolito modular (ADR-0002, E9) ainda não tem justificativa de extração para uma camada de agregação. | Evita comprometer uma segunda unidade de implantação sem os X1-X6 de ADR-0002 §5.2. | Justificativa de extração medida (ADR-0002 X1-X6) para uma camada de agregação HTTP separada. | UNASSIGNED — VALIDAÇÃO NECESSÁRIA |
| A2 | O identificador de estado (enum/código) e o texto de apresentação podem ser mantidos como dois artefatos distintos e testáveis separadamente. | Sustenta a resolução da tensão E1×E6 (§1). | Descoberta de um estado cujo identificador só existe implicitamente no texto — seria defeito de ADR-0009/0011, não desta. | UNASSIGNED — VALIDAÇÃO NECESSÁRIA |

## 3. Direcionadores de decisão

| # | Direcionador | Por que discrimina | Atributo mensurável | Alvo |
|---|---|---|---|---|
| D1 | Camada de apresentação dona da linguagem (E6, vinculante) | Distingue "frontend reescreve copy" de "frontend apenas exibe string do backend" — a segunda contradiz diretamente a modificação do titular | — | Vinculante (GDEC-0016) |
| D2 | Auditabilidade do ajuste de termo (nota do escriba em E6) | Distingue "ajuste de copy referenciando o ID de estado do backend" de "ajuste que perde rastreabilidade ao estado de origem" | QAS-0017 | Vinculante — condição da própria concessão |
| D3 | Nenhuma semântica clínica inventada (E1, vinculante) | Distingue "melhorar comunicação de um estado que o backend já originou" de "o frontend decide um novo estado clínico" | — | Vinculante (prompt §11, não-negociável) |
| D4 | Cobertura dos estados obrigatórios (E2, E3) | Um componente sem os estados mínimos é não-conforme, independentemente de quão bem escrito seja o copy | — | Vinculante (checklist §11) |
| D5 | Nenhum estado otimista mascarando falha de segurança (E4) | Discrimina UX responsiva de UX que engana sobre o resultado de um comando clínico | — | Vinculante (DOM-0005 estendido à UI) |
| D6 | Coerência com o monolito modular (E9, A1) | Um BFF separado sem extração governada reproduz o antipadrão que ADR-0002 existe para prevenir | QAS-0024 | Vinculante por coerência |
| D7 | Acessibilidade e vocabulário pt-BR validado (E5, E8) | Distingue "copy melhorado" de "copy melhorado mas não testado com leitor de tela/terminologia clínica" | — | Vinculante (WCAG 2.2 AA; processo ADR-0029) |

## 4. Alternativas consideradas

### Opção A — BFF como camada de agregação separada (serviço próprio), com tradução de linguagem embutida no BFF

**Descrição.** Um serviço HTTP dedicado, implantado separadamente do backend
principal, agrega chamadas e também assume a tradução/ajuste de termos antes de
responder à SPA.

**Frente aos direcionadores.** D1/D2/D3 — tecnicamente satisfazíveis, mas D6 é
violado diretamente: E9 exige uma ADR de extração própria (gatilho quantitativo,
titular operacional, plano de rollback) antes de qualquer segunda unidade de
implantação, e nenhuma evidência desse tipo existe hoje.

**Consequências positivas.** Isolamento de processo entre a tradução de
linguagem e o backend de domínio; escala independente se um dia justificada.

**Consequências negativas.** Compromete uma segunda unidade de implantação sem
os X1-X6 exigidos por ADR-0002 — o mesmo erro que aquela ADR nomeadamente
proíbe; introduz um hop de rede adicional no caminho de leitura sem justificativa
medida; custo operacional adicional sem necessidade demonstrada.

**O que precisaria ser verdade.** Uma extração justificada nos termos de ADR-0002
§5.2 — hoje não evidenciada.

**Custo de saída.** Alto — desmontar um serviço BFF depois de escrito significa
fundir sua lógica de volta ao caminho principal.

### Opção B — Camada de apresentação embarcada em `apps/web`, consumindo o contrato gerado (ADR-0012), com tradução/ajuste de termos como módulo de front-end testável e auditável por ID de estado (elaboração da direção aceita e modificada, GDEC-0016)

**Descrição.** Nenhum serviço BFF separado (coerente com A1/E9/D6). `apps/web`
consome diretamente o contrato público gerado a partir de OpenAPI/AsyncAPI
(ADR-0012); tipos de estado são gerados ou validados contra esse contrato (E1).
Um **módulo de apresentação/linguagem** dentro do frontend — não uma camada de
rede separada — mapeia cada identificador de estado originado no backend (por
exemplo, os estados de avaliação de ADR-0008 e os estados de item de trabalho de
ADR-0009 W1) para texto pt-BR clínico melhorado, validado pelo processo ADR-0029.
Toda interação de UI, telemetria e log de auditoria referencia o **identificador
de estado do backend**, nunca a string apresentada — de modo que um ajuste futuro
de copy nunca quebra rastreabilidade (resolve a tensão D1×D3 do §1).

**Frente aos direcionadores.** D1 forte — o módulo de linguagem existe
precisamente para "melhorar a comunicação e ajustar termos" (E6). D2 forte por
construção — auditoria referencia o ID, não o texto (A2). D3 forte — o módulo
**traduz** um identificador que o backend já originou; ele não inventa um estado
novo nem decide quando um estado se aplica. D4/D5 — a mesma disciplina de estados
obrigatórios (E2/E3/E4) se aplica ao módulo de apresentação como a qualquer outro
componente. D6 forte — nenhuma segunda unidade de implantação. D7 — o módulo de
linguagem é exatamente o ponto de acoplamento com o processo ADR-0029 e com
testes de acessibilidade (E5).

**Consequências positivas.** UX/UI de primeira classe (a exigência do titular) é
satisfeita sem violar "nenhuma semântica clínica inventada"; nenhum custo de rede
adicional; coerente com o monolito modular já aceito.

**Consequências negativas.** Exige disciplina de engenharia para não deixar o
módulo de linguagem "vazar" para decisão (por exemplo, suprimir a exibição de um
estado por considerá-lo "pouco importante" seria uma decisão clínica disfarçada
de decisão de copy — precisa de teste específico, §9 V3); um pouco mais de
indireção de código do que exibir a string do backend diretamente.

**O que precisaria ser verdade.** A2 (identificador e texto são artefatos
separáveis e testáveis) se sustenta na prática — se um estado não tiver ID
estável e só existir como string, isso é defeito de contrato (ADR-0012), não
desta ADR.

**Custo de saída.** Baixo — o módulo de linguagem é um artefato de frontend
substituível sem afetar o backend ou o contrato.

### Opção C — Backend gera todo o texto final; frontend apenas renderiza (nenhuma camada de tradução)

**Descrição.** O backend é responsável por toda a string apresentada ao usuário;
o frontend não ajusta nada.

**Frente aos direcionadores.** D1 é **diretamente violado** — contradiz a
modificação explícita do titular (E6), que rejeita nomeadamente "apenas exibir o
texto do backend". D3/D4/D5 seriam satisfeitos trivialmente, mas às custas de D1.

**Consequências positivas.** Simplicidade máxima; nenhuma duplicação de
vocabulário.

**Consequências negativas.** **Incompatível com a decisão já aceita do
titular** — listada para que sua rejeição seja honesta e registrada, não
silenciosa; também acopla qualquer melhoria de UX a um redeploy de backend,
elevando o custo de iteração de copy.

**O que precisaria ser verdade.** O titular reverteria sua própria modificação —
não proposto por esta ADR.

**Custo de saída.** Não aplicável — opção não adotável sob a decisão já aceita.

### Opção Z — Adiar; cada tela decide por conta própria se traduz ou exibe o texto do backend

**Descrição.** Nenhuma política registrada; consistência de linguagem e
auditabilidade ficam a critério de quem implementa cada tela.

**Consequências positivas.** Nenhum comprometimento prematuro com a forma do
módulo de linguagem.

**Consequências negativas.** Reproduz o modo de falha que E6 existe para
prevenir: telas heterogêneas, algumas auditáveis por ID e outras não; a primeira
tela implementada vira a convenção de fato, sem revisão.

**Custo do atraso.** Cresce a cada tela escrita sem esta disciplina.

### 4.1 Comparação frente aos direcionadores

| Direcionador | A — BFF separado | B — módulo embarcado em apps/web | C — backend gera texto final | Z — adiar |
|---|---|---|---|---|
| D1 dono da linguagem | Satisfazível, mas viola D6 | Forte | **Violado** | Ad hoc |
| D2 auditabilidade por ID | Satisfazível | Forte por construção | Trivial (nada a auditar) | Não resolvido |
| D3 nenhuma semântica inventada | Satisfazível | Forte | Trivial | Risco alto |
| D4 estados obrigatórios | Satisfazível | Forte | Satisfazível | Ad hoc |
| D5 sem otimismo mascarando falha | Satisfazível | Forte | Satisfazível | Ad hoc |
| D6 coerência com ADR-0002 | **Violado** | Forte | Forte | n/a |
| D7 a11y/pt-BR validado | Satisfazível | Forte (ponto de acoplamento natural) | Satisfazível | Ad hoc |

## 5. Decisão e escopo

**Direção aceita e modificada pelo titular (GDEC-0016, 2026-08-16):** **Opção
B** — nenhum BFF separado; camada de apresentação/linguagem embarcada em
`apps/web`, consumindo o contrato gerado (ADR-0012), dona do texto pt-BR
apresentado, com auditoria sempre referenciando o identificador de estado
originado no backend. Esta é a elaboração direta da modificação do titular
citada em §5.0 acima. A minuta §5.2 materializa essa direção como premissa
reversível de construção (GDEC-0013/0015).

**Escopo vinculado (enquanto premissa de construção):** a ausência de BFF
separado sem ADR de extração própria; a existência de um módulo de linguagem
testável e auditável por ID de estado; a obrigação de que ajustes de termo nunca
alterem o estado clínico subjacente.

**Não vinculado:** a forma exata do contrato de API (ADR-0012); o mecanismo de
push/autorização (ADR-0011); ferramenta concreta de geração de tipos (detalhe de
implementação, não fixado aqui).

### 5.1 Condições para ratificação formal (cláusula a cláusula, humana)

| # | Condição | Titular | Evidência que a fecha | Estado |
|---|---|---|---|---|
| C1 | ADR-0012 (contrato de API) com direção registrada — o módulo de linguagem depende da forma do contrato existir. | autoridade do ADR-0012 | ADR-0012 com direção registrada | **PARCIALMENTE FECHADA** — direção materializada nesta mesma sessão (ver ADR-0012) |
| C2 | Vocabulário pt-BR inicial dos estados obrigatórios (§1 E2) ratificado via processo ADR-0029. | AUTH-CLINSAFETY + AUTH-UX | Glossário normativo atualizado | ABERTA |
| C3 | Teste específico provando que o módulo de linguagem nunca decide *quando* um estado se aplica — apenas *como* ele é escrito (a fronteira D1×D3). | AUTH-UX + verificador independente | Suite de teste registrada (§9 V3) | ABERTA |

### 5.2 Minuta normativa (o que a construção segue sob GDEC-0015/0017)

**F1 — Identificador é do backend; texto é do frontend.** Todo estado clínico ou
operacional (avaliação, item de trabalho, conectividade, frescor) chega ao
frontend com um identificador estável e versionado, originado no backend (ADR-0008,
ADR-0009, ADR-0011). O módulo de linguagem em `apps/web` mapeia esse
identificador para texto pt-BR apresentado — e **somente** o identificador é
gravado em telemetria, log de auditoria e teste de aceitação (E6, nota do
escriba).

**F2 — Sem BFF separado sem extração governada.** Nenhum serviço HTTP de
agregação/tradução é implantado separadamente de `apps/api`/`apps/web` sem uma
ADR de extração satisfazendo ADR-0002 §5.2 X1-X6 (herda E9/D6).

**F3 — O módulo de linguagem nunca decide, apenas comunica.** O módulo de
linguagem pode reescrever, simplificar, adicionar contexto ou tom a um texto —
**nunca** pode suprimir a exibição de um estado, promover severidade, ou inferir
um estado que o backend não originou (D3; espelha ADR-0011 P7 "nenhuma projeção,
gateway ou cliente promove status" estendido à camada de apresentação).

**F4 — Cobertura obrigatória de estados.** Todo componente que representa estado
clínico ou operacional implementa, no mínimo, as famílias de estado do prompt
§11 (carregamento/vazio/indisponível/proibido/tempo-esgotado/retentando/parcial;
frescor; validade de avaliação; item de trabalho; conectividade; sessão) — a
ausência de um estado obrigatório é defeito bloqueante de revisão, não uma
melhoria futura.

**F5 — Nenhum otimismo que mascare falha de segurança.** Ações de comando
relevantes à segurança (reconhecer, suprimir, sobrepor — ADR-0009 W1) nunca
mostram sucesso otimista antes da confirmação do backend; falha de comando é
sempre visível, nunca engolida por um estado de UI que já avançou (E4; herda
ADR-0009 W11 para operações em grupo).

**F6 — Tabela de contrato UI/backend por tela.** Toda tela/interação nova cria a
tabela do prompt §11 (elemento/ação, objetivo, API/comando autoritativo, estado
de domínio, frescor, autorização, comportamento otimista, falha/recuperação,
evento de auditoria, teste de aceitação) como artefato de revisão, não como
documentação posterior.

**F7 — Acessibilidade e validação de linguagem como gate, não como polimento.**
Todo componente de estado passa por WCAG 2.2 AA automatizado mais validação
manual representativa (leitor de tela, teclado, zoom/reflow, movimento reduzido,
alvo de toque — E5); todo texto novo do módulo de linguagem passa pelo processo
ADR-0029 antes de ir a produção.

**F8 — Explicabilidade sem sobrecarga.** Onde clinicamente relevante, a UI expõe
insumos, insumos ausentes, tempo de fonte, versão de regra, racional e incerteza
(E5) — o módulo de linguagem decide *como* apresentar essa informação de forma
compreensível, nunca *se* ela é omitida.

### 5.3 Escopo do que a aceitação vincularia

**Vincula:** a ausência de BFF separado sem extração governada (F2); a separação
identificador×texto e sua auditabilidade (F1); os limites do módulo de linguagem
(F3); a cobertura de estados obrigatórios (F4); a proibição de otimismo mascarando
falha de segurança (F5); a tabela de contrato por tela (F6); acessibilidade e
validação de linguagem como gate (F7).

**Não vincula:** a forma do contrato de API (ADR-0012); o mecanismo de push
(ADR-0011); ferramenta concreta de geração de tipos ou biblioteca de componentes.

## 6. Consequências

### 6.1 Positivas

- A modificação do titular (E6) ganha uma implementação concreta que não
  contradiz "nenhuma semântica clínica inventada" (E1) — a tensão declarada em
  §1 é resolvida por construção (F1), não por preferência.
- Nenhuma segunda unidade de implantação é comprometida sem os critérios de
  extração já aceitos em ADR-0002.
- A auditoria de "o ajuste de termo preservou o estado clínico" (condição da
  própria concessão do titular) tem um mecanismo testável (F1, C3), não apenas
  uma promessa.

### 6.2 Negativas

- Exige disciplina contínua de engenharia (F3) para impedir que o módulo de
  linguagem "decida por conta própria" — um risco real que precisa de teste
  dedicado (C3), não apenas de boa intenção.
- Vocabulário pt-BR inicial (C2) ainda não está ratificado — telas construídas
  antes disso usam texto provisório sujeito a revisão.

### 6.3 Neutras/estruturais

- Nada aqui seleciona biblioteca de componentes, gerenciador de estado de
  frontend ou ferramenta de geração de tipos além da premissa de stack já
  registrada.

## 7. Implicações transversais

| Dimensão | Implicação | Rótulo | Papel titular | ID de acompanhamento |
|---|---|---|---|---|
| Segurança clínica | F1/F3 impedem que um ajuste de copy altere silenciosamente o significado clínico de um estado; F5 impede que otimismo de UI mascare falha de comando de segurança. | INFERENCE de E4, E6 | AUTH-CLINSAFETY | QAS-0017 |
| Segurança (security) | Nenhuma implicação direta nova — autorização permanece server-side (herda ADR-0011 P3); o módulo de linguagem não decide acesso. | INFERENCE | AUTH-SECURITY | ADR-0016 |
| Privacidade (LGPD, minimização) | Explicabilidade (F8) e cache/telemetria de frontend devem minimizar PHI exibida além do necessário; limpeza de cache sensível a privacidade é um padrão a validar, não um dado. | VALIDATION REQUIRED | AUTH-PRIVACY-LEGAL (não nomeado) | QAS-0028 |
| Interoperabilidade | O frontend consome exclusivamente o contrato gerado de ADR-0012 — nenhum acoplamento a esquema interno. | INFERENCE | AUTH-DATA-PLATFORM | ADR-0012 |
| Acessibilidade | F7 torna WCAG 2.2 AA e validação de tecnologia assistiva gate de todo componente de estado — a implicação central desta ADR. | SOURCE (E5) | AUTH-UX | pendente (backlog de validação) |
| Operacional | O módulo de linguagem e a tabela de contrato por tela (F6) tornam-se artefato de revisão obrigatório em todo PR de UI. | INFERENCE | AUTH-OPERATIONS | pendente |
| Custo | Nenhum modelo de custo existe; o módulo de linguagem adiciona superfície de teste (mitigado por reuso entre telas). | VALIDATION REQUIRED | AUTH-PRODUCT | pendente |
| Migração | Se um BFF separado for extraído no futuro (ADR-0002 X1-X6), o módulo de linguagem migra com ele sem mudar seu contrato de entrada (o identificador de estado). | INFERENCE | AUTH-OPERATIONS | ADR-0002 |

## 8. Reversibilidade, gatilhos de revisita, kill/rollback

### 8.1 Avaliação de reversibilidade

| Opção | Reversibilidade | O que fica encalhado | Rótulo |
|---|---|---|---|
| A | Baixa a partir daqui — exigiria a extração que esta ADR evita | Nenhuma infraestrutura de BFF existe para desmontar | INFERENCE |
| B | Alta — o módulo de linguagem é substituível sem afetar contrato ou backend | Vocabulário já validado (reaproveitável, não perdido) | INFERENCE |
| C | Não aplicável — incompatível com decisão já aceita | n/a | INFERENCE |
| Z | n/a — custo de opção crescente por tela implementada sem a disciplina | n/a | INFERENCE |

### 8.2 Gatilhos de revisita

| # | Gatilho | Detecção | Notifica | Ação |
|---|---|---|---|---|
| T1 | Teste C3 (módulo de linguagem decide, não apenas comunica) falha | Suite de teste dedicada | AUTH-UX, AUTH-CLINSAFETY | Bloquear merge; corrigir F3 |
| T2 | Justificativa de extração medida para BFF surge (ADR-0002 X1-X6) | Registro de extração | AUTH-PRODUCT | Reabrir F2; avaliar Opção A com critérios completos |
| T3 | Vocabulário pt-BR ratificado (C2) | Registro ADR-0029 | AUTH-UX | Substituir texto provisório pelo vocabulário ratificado |
| T4 | Achado de acessibilidade P0/P1 em auditoria manual | Relatório de auditoria | AUTH-UX | Bloquear promoção da tela afetada até corrigido |

### 8.3 Kill switch / rollback

Nada a desligar em `proposed`/construção. Restrição permanente: nenhuma tela vai
a produção sem F1 (identificador auditável), F4 (estados obrigatórios) e F5
(sem otimismo mascarando falha) implementados e testados — ausência de qualquer
um dos três é defeito bloqueante de revisão.

## 9. Método de validação e evidência vinculada

| # | Alegação | Método de validação | Ambiente | IDs vinculados |
|---|---|---|---|---|
| V1 | Telemetria/auditoria referencia o identificador de estado, nunca o texto apresentado. | Teste de componente: alterar o texto do módulo de linguagem, afirmar que o evento de auditoria é inalterado. | Teste | E6; QAS-0017 |
| V2 | O módulo de linguagem nunca suprime, promove severidade, ou infere estado não originado no backend. | Teste de propriedade sobre o mapeamento identificador→texto: nenhuma transformação pode remover ou adicionar um identificador. | Teste | D3; ADR-0011 P7 |
| V3 | Todo componente de estado cobre as famílias obrigatórias do §11. | Checklist automatizada de cobertura de estado por componente. | CI | prompt §11; QAS-0007 |
| V4 | Falha de comando relevante à segurança é sempre visível, nunca mascarada por estado otimista. | Teste de injeção de falha de comando + asserção de UI. | Teste | E4; QAS-0017 |
| V5 | WCAG 2.2 AA automatizado mais validação manual representativa. | Automação de acessibilidade + sessão com usuários de tecnologia assistiva. | Teste + validação de usabilidade | E5; backlog de validação pendente |

## 10. Relações de supersessão

- **Supersede:** nenhuma.
- **Superseded by:** nenhuma.
- **Notas de relação:** elabora diretamente a modificação do titular registrada em
  GDEC-0016 para este tópico; consome ADR-0011 (P6/P7) e ADR-0012 (contrato) como
  insumos; não alimenta nenhuma outra ADR de piso (adr-index §4.1 lista "—" na
  coluna "Alimenta" da linha ADR-0021).

## 11. Autoverificação contra o gate de completude do template

Campos de identidade presentes; três alternativas mais adiar (A/B/C/Z), com C
honestamente marcada como incompatível com decisão já aceita e A com D6
violado; direcionadores mapeados a QAS existentes; **nenhum limiar numérico
inventado**; oito linhas transversais presentes; reversibilidade, gatilhos e
kill/rollback presentes; validação com IDs reais; supersessão declarada;
**nenhuma tecnologia de biblioteca selecionada além da premissa de construção já
registrada por outro agente**; nenhuma aprovação fabricada; `adr-index.md`
**não** foi tocado por este autor (fora do escopo de escrita desta tarefa).
