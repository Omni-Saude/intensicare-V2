---
id: ADR-0002
title: Estratégia de unidade de implantação — baseline de monolito modular e os critérios exigidos para extrair um serviço
status: accepted  # GDEC-0016 (2026-08-16, titular): Opção A — monolito modular com fronteiras impostas
status_history:
  - status: not-started
    date: 2026-08-14
    by: engenheiro de arquitetura candidata e do programa de ADRs (Onda 2)
    note: ID reservado em adr-index.md
  - status: proposed
    date: 2026-08-14
    by: engenheiro de arquitetura candidata e do programa de ADRs (Onda 2)
    note: >
      Opções, direcionadores e a *forma* dos critérios de extração redigidos a partir do
      prompt §9.1 princípio 8 e §9.2. NENHUMA decisão está registrada. Nenhum limiar
      quantitativo de extração é fixado, porque limiares exigem SLOs validados (Gate G1).
date: 2026-08-14
owner: UNASSIGNED — VALIDAÇÃO NECESSÁRIA
approvers:
  - UNASSIGNED — VALIDAÇÃO NECESSÁRIA   # papel candidato: AUTH-PRODUCT
  - UNASSIGNED — VALIDAÇÃO NECESSÁRIA   # papel candidato: AUTH-OPERATIONS
  - UNASSIGNED — VALIDAÇÃO NECESSÁRIA   # papel candidato: AUTH-SECURITY (justificativa de extração por fronteira de segurança)
decision_deadline: NÃO DEFINIDO — VALIDAÇÃO NECESSÁRIA
deciding_authority_rule: >
  docs/00-governance/decision-rights.md §2, linha "Decisões de arquitetura (ratificação
  de ADR)": AUTH-PRODUCT mais o titular de domínio pertinente por tópico — aqui
  AUTH-OPERATIONS (quem carrega a consequência operacional da unidade de implantação) e
  AUTH-SECURITY para qualquer extração justificada por uma fronteira de segurança.
  Agentes podem redigir opções e direcionadores; agentes não podem ratificar sua própria
  proposta de ADR.
independence_check: >
  O autor desta ADR é um preparador e não pode aprovar. Per decision-rights.md §3 par 7
  (titular do pipeline de release ≠ autoridade de go-live), o especialista que mais
  tarde detiver o pipeline de build e implantação (ADR-0022) não pode ser o único
  aprovador de uma mudança de unidade de implantação que seu pipeline motiva.
links:
  drivers:
    domain_invariants: [DOM-0001, DOM-0003, DOM-0005, DOM-0006, DOM-0007]
    quality_scenarios: [QAS-0004, QAS-0008, QAS-0009, QAS-0012, QAS-0014, QAS-0015, QAS-0018, QAS-0020, QAS-0021, QAS-0022, QAS-0023, QAS-0024, QAS-0026, QAS-0027]
    risks: ["IDs pendentes no registro de riscos"]
  constrains:
    requirements: ["REQ: catálogo de requisitos pendente"]
    clinical: ["CLR: não aplicável — esta ADR não vincula nenhum conteúdo clínico"]
    safety: [SAF-0008, SAF-0013, SAF-0015, SAF-0016, SAF-0017, SAF-0018, SAF-0019, SAF-0021, SAF-0023, SAF-0024, SAF-0030]
  hazards: [HAZ-0009, HAZ-0012, HAZ-0013, HAZ-0015, HAZ-0016, HAZ-0017, HAZ-0020, HAZ-0021, HAZ-0022, HAZ-0023, HAZ-0025, HAZ-0033]
  tests: ["TST: arquitetura de testes pendente"]
  validations: ["VAL: backlog de validação pendente"]
  adrs:
    depends_on: [ADR-0001]
    feeds: [ADR-0010, ADR-0011, ADR-0019, ADR-0021, ADR-0022]
  gates: [G4]
  evidence:
    - INTENSICARE_V2_ORCHESTRATOR_PROMPT.md §9.1 princípio 8, §9.2, §9.4, §3 regra 14
    - docs/03-domain/invariants/DOM-invariants.md
    - docs/03-domain/conceptual-model.md
supersedes: null
superseded_by: null
provenance:
  source_repo: intensicare-V2
  path_or_url: docs/06-architecture/adrs/ADR-0002-modular-monolith-and-extraction-criteria.md
  commit_sha_or_version: cb35521 (HEAD do repositório no momento da redação; este arquivo estava não commitado)
  section_or_lines: >
    INTENSICARE_V2_ORCHESTRATOR_PROMPT.md §9.1 (linhas 549-563), §9.2 (linhas 564-578),
    §9.4 (linhas 600-614), §3 regra 14, §10 item 2
  date_collected: 2026-08-14
  collector: engenheiro de arquitetura candidata e do programa de ADRs (Onda 2)
  transformation: reasoned-from
  confidence: média
  owner: UNASSIGNED — VALIDAÇÃO NECESSÁRIA
  validation_status: VALIDAÇÃO NECESSÁRIA
---

# ADR-0002 — Estratégia de unidade de implantação: baseline de monolito modular e critérios de extração de serviço

> Traduzido EN→pt-BR em 2026-08-15 (GDEC-0008 item 8, tranche 2); original EN preservado no histórico git.

> **Status: proposto. Este documento apresenta opções e direcionadores. Não registra NENHUMA decisão.**
> O prompt fornece uma *baseline candidata*, explicitamente "para testar, não para adotar
> cegamente" (o próprio título da §9). Reproduzir essa baseline aqui não é adotá-la.

---

## 1. Contexto e enunciado do problema

SOURCE (`INTENSICARE_V2_ORCHESTRATOR_PROMPT.md` §9, linha 547): *"Comece com esta
baseline candidata porque ela endereça as falhas sistêmicas do assessment. Ratifique ou
substitua cada escolha por meio de ADRs."*

SOURCE (§9.1 princípio 8, linha 561): *"Comece como um monolito modular, a menos que
escala independente, fronteira de segurança, cadência de release, ou isolamento de
falha justifiquem a extração."*

SOURCE (§9.2, linhas 576–578): *"Não divida isso em serviços de rede por default.
Imponha propriedade de módulo, direção de dependência, schemas, portas e testes dentro
de uma única aplicação implantável. Extraia apenas por meio de uma ADR aceita com
gatilho quantitativo, justificativa de fronteira de falha, titular operacional, caminho
de migração e plano de rollback."*

**Pergunta.** O IntensiCare V2 começa como uma única aplicação implantável contendo os
bounded contexts do §9.2 como módulos internos impostos — e, seja qual for a resposta,
o que uma proposta de extração precisa *conter* antes que qualquer módulo possa se
tornar um serviço implantado separadamente?

As duas metades são separáveis e ambas precisam ser respondidas. A segunda metade é,
possivelmente, a mais durável: um programa pode sobreviver a começar com o número
errado de unidades de implantação; ele não sobrevive a extraí-las ad hoc, porque cada
extração não governada acrescenta permanentemente uma partição de rede ao laço de
segurança clínica.

**Fora de escopo:**

- Plataforma de runtime, orquestração, região, residência — ADR-0019.
- O formato do backbone de eventos e suas garantias de entrega — ADR-0010 (uma
  *consequência* desta decisão, não um insumo para ela).
- Separação frontend/BFF — ADR-0021. Um BFF é uma questão distinta de dividir o domínio
  em serviços; confundir as duas é um erro comum e é explicitamente evitado aqui.
- Linguagem, framework, runtime, produto de banco de dados. **Esta ADR é tecnologicamente
  neutra por construção.** SOURCE (prompt §3 regra 14): nenhuma escolha assim pode ser
  herdada do repositório legado.
- A própria lista de módulos. Os onze bounded contexts do §9.2 são o conjunto de
  trabalho; refiná-los é trabalho de domínio, não uma decisão de unidade de implantação.

**Relação com a ADR-0001.** Condicional. As Opções B e C abaixo não são afetadas pela
fronteira AMH; mas se a ADR-0001 fosse aceita como opção (b) — a V2 como um módulo
dentro da fronteira da plataforma AMH — a unidade de implantação seria parcialmente
determinada pelas convenções de plataforma da AMH, em vez de escolhida aqui. Esta ADR,
portanto, **não pode ser aceita antes que a direção da ADR-0001 seja conhecida**, embora
possa ser totalmente redigida e revisada agora.

---

## 2. Evidências e premissas

### 2.1 Evidências

| # | Rótulo | Declaração | Fonte | Confiança |
|---|---|---|---|---|
| E1 | SOURCE | A baseline candidata é um monolito modular; a extração exige uma ADR aceita carregando um gatilho quantitativo, justificativa de fronteira de falha, titular operacional, caminho de migração e plano de rollback. | prompt §9.1 p8, §9.2 | alta |
| E2 | SOURCE | Onze bounded contexts são nomeados, e são explicitamente fronteiras de módulo dentro de uma única aplicação implantável, não serviços por default. | prompt §9.2 | alta |
| E3 | SOURCE | O assessment legado recomenda reter o kernel de segurança determinístico **em vez de** o modelo de tenancy/implantação legado. | prompt §2, linha 74 | alta |
| E4 | SOURCE | "Não escolha microsserviços, Kubernetes, um provedor de nuvem, uma extensão de banco de dados, um broker, ou um modelo de IA porque o repositório legado usava." | prompt §3 regra 14 | alta |
| E5 | SOURCE | Comandos devem ser "idempotentes, seguros para concorrência, autorizados, auditados, e **publicados transacionalmente**" (§9.1 p5), e a topologia candidata nomeia um "outbox transacional mais broker/stream durável" (§9.4). | prompt §9.1 p5, §9.4; DOM-0005 | alta |
| E6 | SOURCE | "Durabilidade precede imediatismo; projeções e visões em tempo real são rebuildáveis" (§9.1 p6); a entrega em tempo real deve derivar de estado durável e replayável (§3 regra 9). | prompt §9.1 p6, §3 r9; DOM-0006 | alta |
| E7 | SOURCE | A propriedade de tenant e encounter são invariantes "da identidade até armazenamento, cache, evento, query, subscription, e auditoria" (§9.1 p2). | prompt §9.1 p2; DOM-0001 | alta |
| E8 | SOURCE | O kernel de segurança determinístico deve ser "isolado de dependências de delivery/UI" (§9.4). **"Isolado" é declarado como uma propriedade de dependência, não uma propriedade de processo ou de rede** — o prompt não diz que o kernel deve ser um serviço separado. | prompt §9.4 | alta |
| E9 | SOURCE | A avaliação deve ser determinística, versionada, replayável e independente de frameworks de UI/infraestrutura (§9.1 p4). | prompt §9.1 p4; DOM-0003 | alta |
| E10 | SOURCE | "Preferir decisões reversíveis e registrar gatilhos de extração/revisita" (§9.1 p11). | prompt §9.1 p11 | alta |
| E11 | INFERENCE | A nomeação de microsserviços e Kubernetes na regra 14 sugere que o sistema legado usava ao menos alguns deles. Isso é uma razão para exigir **justificativa positiva** para tais escolhas — não uma razão para rejeitá-las. Rejeitar uma tecnologia porque o legado a usou é o mesmo erro que adotá-la por essa razão. | reasoned from E4 | média |

### 2.2 Premissas

A serem registradas em `docs/00-governance/registers/assumptions-register.md`;
**nenhum ID `ASM` é mintado aqui** (aquele registro é o catálogo de mintagem).

| # | Premissa | Por que é necessária | O que a invalida | Titular |
|---|---|---|---|---|
| A1 | O tamanho, a estrutura e a maturidade operacional da organização de entrega ainda não são conhecidos. | A contagem de unidades de implantação é, em parte, uma questão de team topology; sem fatos sobre o time, qualquer resposta carece de evidência suficiente. | Plano de staffing e modelo operacional se tornarem conhecidos. | UNASSIGNED — VALIDAÇÃO NECESSÁRIA |
| A2 | Carga, contagem de tenants, e perfis de recurso por módulo são desconhecidos e não mensuráveis antes que um sistema exista. | Todo argumento de "escala independente" para extração é hoje infalseável. | Carga medida a partir de um piloto (Gate G8) ou um modelo de capacidade validado. | UNASSIGNED — VALIDAÇÃO NECESSÁRIA |
| A3 | A lista de bounded contexts do §9.2 é um conjunto de módulos de trabalho razoável. | Os critérios de extração são expressos por módulo. | Trabalho de domínio alterando materialmente as fronteiras de contexto. | UNASSIGNED — VALIDAÇÃO NECESSÁRIA |
| A4 | A ADR-0001 não será aceita como opção (b). | Se for, a unidade de implantação é parcialmente da AMH para definir. | ADR-0001 aceita como (b). | UNASSIGNED — VALIDAÇÃO NECESSÁRIA |

---

## 3. Direcionadores de decisão e atributos de qualidade mensuráveis

| # | Direcionador | Por que discrimina | Atributo de qualidade mensurável | Meta |
|---|---|---|---|---|
| D1 | **Integridade transacional do laço de segurança** — um comando deve ser autorizado, aplicado, auditado e seu evento publicado em um único passo atômico (E5, DOM-0005) | Em uma única unidade implantável com um único armazenamento transacional isso é uma transação local mais um outbox. Dividido entre serviços torna-se um problema de consistência distribuída com compensações. Este é o discriminador técnico mais nítido. | QAS-0021, QAS-0004 | VALIDAÇÃO NECESSÁRIA |
| D2 | **Isolamento de falha / blast radius** | A justificativa declarada para extração (E1). Mais unidades = blast radius menor por unidade, mas mais partições dentro do laço clínico, cada uma um novo modo de falha. Ambas as direções carregam consequências de segurança e nenhuma é gratuita. | QAS-0023 | VALIDAÇÃO NECESSÁRIA |
| D3 | **Escala independente** | Uma justificativa de extração explícita (E1). Atualmente infalseável (A2) — nenhum perfil de recurso medido por módulo pode existir antes que o sistema exista. | QAS-0008, QAS-0009 | VALIDAÇÃO NECESSÁRIA |
| D4 | **Aplicabilidade de fronteira de segurança** | Uma justificativa de extração explícita (E1). Algumas fronteiras (por exemplo, custódia de chave, isolamento de tratamento de PHI) podem ser aplicadas de forma mais crível através de uma fronteira de processo/rede do que dentro de um único processo; outras (escopo de tenant, E7/DOM-0001) são aplicadas de forma idêntica em ambos os casos e são *mais difíceis* de manter invariantes através de mais hops. | QAS-0014, QAS-0018 | VALIDAÇÃO NECESSÁRIA (Gate G6) |
| D5 | **Cadência de release independente** | Uma justificativa de extração explícita (E1). Nota a contrapressão: bundles de regra clínica são artefatos de release versionados com sua própria cadeia de aprovação (§6.4) — a independência de cadência pode ser alcançável por meio de versionamento de *artefato*, em vez de separação de *implantação*. | QAS-0026 | VALIDAÇÃO NECESSÁRIA |
| D6 | **Integridade de replay determinístico** (E9, DOM-0003) | O replay deve reproduzir uma avaliação histórica exatamente. Distribuir os insumos do avaliador entre serviços introduz variáveis de ordenação, relógio e falha parcial em um cálculo que precisa ser byte-idêntico no replay. | QAS-0020 | VALIDAÇÃO NECESSÁRIA |
| D7 | **Capacidade operacional e custo** | Cada unidade de implantação adicional acrescenta superfície de on-call, topologia de implantação, custo de observabilidade, e um caminho de restore/DR. A4/A1: a capacidade da organização operante é desconhecida. | QAS-0015, QAS-0012 | VALIDAÇÃO NECESSÁRIA |
| D8 | **Reversibilidade e custo de saída** (E10) | Consolidar serviços de volta é geralmente mais barato do que dividir mal um monolito, mas ambos são custosos. O mais barato de todos é um monolito cujas fronteiras de módulo são *impostas* — a extração então se torna mecânica. Isso torna a **imposição de fronteira** um direcionador em si mesma. | QAS-0024, QAS-0027 | VALIDAÇÃO NECESSÁRIA |
| D9 | **Disponibilidade de evidência para a própria decisão** | As opções diferem em quanta evidência exigem *antes* de serem escolhidas. Escolher uma topologia distribuída agora compromete-se com alegações infalseáveis sobre escala e isolamento (A2). | n/a — meta-direcionador | n/a |

---

## 4. Alternativas consideradas

### Opção A — Monolito modular com fronteiras impostas (a baseline candidata do prompt)

**Descrição.** Uma única aplicação implantável contendo os bounded contexts do §9.2
como módulos. A imposição é **mecânica, não cultural**: propriedade de módulo, direção
de dependência permitida, schemas/portas por módulo, e testes por módulo, com uma
verificação automatizada que falha o build em uma violação de fronteira. A extração é
possível mais tarde e é governada pelos critérios do §5.2.

**Contra os direcionadores.** D1 mais forte (transação local + outbox); D6 mais forte
(avaliação determinística em processo único); D7 menor superfície operacional; D8
melhor *se e somente se* a imposição for real; D2 mais fraco (um processo = um blast
radius); D3 mais fraco (não é possível escalar um módulo independentemente); D4 misto —
a invariância de tenant é mais fácil aqui, o isolamento de custódia de chave não é.

**Consequências positivas.** A atomicidade do laço de segurança é uma propriedade
local; o replay determinístico não tem variáveis de ordenação distribuída; um único
caminho de restore; um único armazenamento de auditoria; o menor conjunto de coisas que
podem estar parcialmente fora do ar; as fronteiras de módulo podem ser *testadas* em
vez de presumidas; alinha-se com o alerta do E3 contra herdar o modelo de implantação
legado.

**Consequências negativas.** Uma única exaustão de recurso ou falha de memória derruba
o sistema inteiro, incluindo o laço de segurança — o que, para um sistema clínico, é um
hazard exigindo uma resposta explícita de modo degradado (DOM-0007); nenhuma escala
independente; uma única cadência de release para onze contextos, o que se torna um
custo de coordenação à medida que o time cresce; "monolito modular" degrada para
"monolito" em uma ou duas releases se as verificações de fronteira forem consultivas em
vez de bloqueantes — e o prompt §13 regra 13 proíbe depender de gates consultivos para
qualquer coisa que importe.

**O que precisaria ser verdade.** A imposição de fronteira é automatizada e bloqueia o
build desde o primeiro commit; a organização operante consegue aceitar um único blast
radius para o escopo inicial; nenhuma fronteira de segurança no escopo inicial exige
isolamento de processo.

**Custo de saída se escolhida e depois revertida.** Baixo-a-moderado *se* as fronteiras
foram impostas; alto se não foram — que é precisamente o modo de falha contra o qual
esta opção precisa ser desenhada.

**Variante A2 — monolito modular com o kernel de segurança determinístico como um
processo separado.** E8 exige que o kernel seja *isolado de dependências de
delivery/UI*, o que é uma propriedade de direção de dependência satisfazível em
processo. Esta variante isola-o adicionalmente em runtime. *Positivo:* a avaliação de
regras não pode ser sufocada por carga de UI/delivery; a superfície de ataque do kernel
e sua cadência de release (D5) podem ser governadas separadamente, o que importa porque
bundles de regra são artefatos de release assinados. *Negativo:* introduz um hop de
rede no caminho de avaliação, adicionando um modo de falha parcial e complicando
D1/D6; precisa de sua própria meta de disponibilidade. Listada como uma variante, não
uma subopção, porque é um refinamento de uma única fronteira de A, e não uma estratégia
diferente.

### Opção B — Microsserviços desde o início

**Descrição.** Os bounded contexts do §9.2 (ou um subconjunto) são serviços implantados
separadamente desde o início, cada um com seu próprio armazenamento e ciclo de release,
comunicando-se pela rede.

**Contra os direcionadores.** D2 e D3 mais fortes por construção; D4 mais forte para
fronteiras que genuinamente precisam de isolamento de processo; D1 mais fraco
(transações distribuídas ou compensações dentro do caminho de comando clínico); D6
fraco (ordenação e falha parcial entram no caminho de avaliação); D7 maior custo
operacional; D9 mais fraco — compromete-se agora com alegações de escala e isolamento
que A2 diz que ainda não podem ser evidenciadas.

**Consequências positivas.** Fronteiras de falha e de segurança são físicas; escala e
cadência independentes por contexto; força a disciplina de interface cedo; a história
de escala do time é clara se a organização for grande.

**Consequências negativas.** Todo comando clínico que precisa ser atômico (E5) se torna
um problema de consistência distribuída, e o modo de falha é precisamente aquele que o
assessment legado sinalizou — um comando que parece ter tido sucesso enquanto seu
efeito relevante para a segurança não foi publicado; a invariância de tenant/encounter
(E7) precisa ser reprovada a cada hop, e todo hop é um lugar onde ela pode ser perdida;
o replay determinístico precisa reconstruir uma ordenação de insumo distribuída; o
custo operacional é multiplicado antes de haver qualquer necessidade medida; **o prompt
§3 regra 14 proíbe explicitamente escolher isso porque o repositório legado o fez** —
então esta opção exige justificativa positiva e medida que A2 diz que ainda não existe.

**O que precisaria ser verdade.** Divergência de escala por módulo medida, ou uma
fronteira de segurança que não pode ser imposta em processo, ou uma organização já
estruturada em torno de times de serviço independentes — e uma estratégia de transação
distribuída que preserve DOM-0005 e DOM-0003.

**Custo de saída se escolhida e depois revertida.** Alto — consolidar serviços significa
fundir armazenamentos, schemas e históricos operacionais.

### Opção C — Serverless desde o início

**Descrição.** Functions-as-a-service para tratamento de comando, avaliação, projeções
e delivery, com armazenamentos gerenciados e transporte de evento gerenciado.

**Contra os direcionadores.** D3 forte (escala elástica sem planejamento de
capacidade); D7 misto (baixa operação de infraestrutura, alta expertise específica de
plataforma); D1 fraco (a semântica de transação + outbox depende fortemente das
garantias do armazenamento gerenciado); D6 fraco-a-misto (cold starts e invocação
at-least-once colocam semântica de retry/duplicata diretamente no caminho de avaliação
— sobrevivível apenas se a avaliação for rigorosamente idempotente, o que DOM-0005 já
exige de qualquer forma); D8 **mais fraco de todas as opções** — a dependência de
serviço gerenciado e o custo de saída são um critério de avaliação nomeado no prompt
§9.4.

**Consequências positivas.** Nenhuma operação de servidor; custo elástico; força
idempotência e ausência de estado, ambas já exigidas pelo domínio de qualquer forma.

**Consequências negativas.** Acoplamento profundo à semântica transacional, de
ordenação e de identidade de um único provedor, que o prompt §9.4 exige ser avaliada
contra portabilidade e custo de saída; limites de tempo de execução e de payload
convivem mal com replay e backfill; residência e termos de processador (LGPD) tornam-se
determinados pelo provedor (ADR-0019, ADR-0017); observabilidade e replay determinístico
de uma frota de funções é materialmente mais difícil; **escolhê-la agora também seria,
de fato, uma escolha de provedor de nuvem**, para a qual esta ADR não tem autoridade, e
que o prompt §3 regra 14 restringe.

**O que precisaria ser verdade.** Uma decisão de provedor já tomada por motivos
independentes (ADR-0019); volatilidade de carga medida; uma posição de custo de saída
aceita.

**Custo de saída se escolhida e depois revertida.** Alto e específico do provedor.

### Opção Z — Adiar / não fazer nada

**Descrição.** Não registrar nenhuma postura de unidade de implantação. Construir os
módulos de domínio com fronteiras impostas e adiar a questão de empacotamento até que a
fatia vertical do Gate G7 a force.

**Consequências positivas.** Nenhum comprometimento prematuro; o trabalho de imposição
de fronteira — que toda opção precisa — prossegue independentemente; consistente com
D9.

**Consequências negativas.** "Nenhuma postura" não é neutra na prática: o primeiro
artefato implantável que alguém construir se torna a resposta de fato, escolhida por
quem estava implementando naquela semana em vez de por uma autoridade; os critérios de
extração (§5.2) — a metade durável desta ADR — também seriam adiados, deixando a
extração ad hoc não governada nesse ínterim.

**Custo do atraso.** Baixo até o Gate G7; os critérios de extração ausentes são um
custo desde o momento em que um segundo time começa a trabalhar.

### 4.1 Comparação contra os direcionadores

| Direcionador | A — monolito modular | A2 — + processo do kernel | B — microsserviços desde o início | C — serverless desde o início | Z — adiar |
|---|---|---|---|---|---|
| D1 integridade transacional | Mais forte | Forte, um hop adicionado | Mais fraco | Fraco (depende do armazenamento) | Não resolvido |
| D2 isolamento de falha | Mais fraco | Kernel isolado | Mais forte | Forte | Não resolvido |
| D3 escala independente | Mais fraco | Kernel escala separadamente | Mais forte | Mais forte | Não resolvido |
| D4 fronteira de segurança | Misto | Superfície do kernel reduzida | Mais forte onde isolamento de processo é necessário | Dependente do provedor | Não resolvido |
| D5 cadência de release | Uma cadência | Cadência do kernel separável | Por serviço | Por função | Não resolvido |
| D6 determinismo de replay | Mais forte | Forte | Fraco | Fraco-misto | Não resolvido |
| D7 capacidade/custo operacional | Menor superfície | +1 unidade | Maior | Menor infra, maior expertise de plataforma | Não resolvido |
| D8 reversibilidade/saída | Melhor se fronteiras impostas | Similar | Alto custo | Custo mais alto | Preservado |
| D9 evidência disponível agora | Exige menos | Exige menos+ | Exige evidência que não existe (A2) | Exige uma decisão de provedor ainda não tomada | n/a |

---

## 5. Decisão e escopo

> **NENHUMA DECISÃO É REGISTRADA.**
>
> Nem a estratégia de unidade de implantação nem os limiares de extração são decididos
> aqui. A baseline candidata do prompt (opção A) é reproduzida porque a §9 instrui que
> ela seja *testada*, e sua presença não deve ser lida como adoção. Preencher esta
> seção é reservado à autoridade decisora no front matter.

### 5.1 Condições que precisam ser satisfeitas antes que esta ADR possa ser aceita

| # | Condição | Titular | Evidência que a fecharia | Status |
|---|---|---|---|---|
| C1 | A direção da ADR-0001 é conhecida (especificamente, se a opção (b) está viva). | `AUTH-DATA-PLATFORM` | ADR-0001 aceita, ou opção (b) formalmente excluída. | **ABERTA** |
| C2 | Titulares decisores nomeados `AUTH-PRODUCT` e `AUTH-OPERATIONS` existem. | Gate G0 | `authority-model.md` preenchido. | **ABERTA** |
| C3 | O tamanho, a estrutura e a capacidade operacional da organização de entrega são conhecidos (A1). | `AUTH-OPERATIONS` | Staffing e modelo operacional. | **ABERTA** |
| C4 | Metas de atributo de qualidade existem para ao menos D1, D2 e D7 (necessidades validadas do Gate G1). | `AUTH-CLINSAFETY` + `AUTH-OPERATIONS` | Metas em `../quality-attributes/quality-attribute-scenarios.md` deixam de ler `VALIDAÇÃO NECESSÁRIA`. | **ABERTA** |
| C5 | Um mecanismo de imposição de fronteira é especificado e é **bloqueante de build**, não consultivo (prompt §3 regra 13). | Implementador + `AUTH-SECURITY` | Uma verificação automatizada que falha em uma violação de fronteira de módulo, e um teste provando que ela falha. | **ABERTA** |

### 5.2 Critérios de extração — o conteúdo exigido de qualquer futura ADR de extração

SOURCE (prompt §9.2): a extração acontece "apenas por meio de uma ADR aceita com
gatilho quantitativo, justificativa de fronteira de falha, titular operacional, caminho
de migração, e plano de rollback."

PROPOSAL — esta ADR propõe a **forma** que esses cinco elementos devem tomar. Ela não
fixa valores de limiar: um gatilho quantitativo sem um SLO validado a ser rompido é um
número inventado para justificar uma preferência, e o prompt §15.3 exige que SLOs
venham de necessidades validadas de usuário/segurança (Gate G1). **Esta é a metade desta
ADR mais provavelmente durável, independentemente de qual opção seja escolhida — as
Opções A, A2, B e C todas precisam de critérios de extração (ou consolidação)
governados.**

| # | Elemento exigido | O que a ADR de extração precisa conter | O que NÃO é aceitável |
|---|---|---|---|
| X1 | **Gatilho quantitativo** | Uma métrica nomeada, já medida; o SLO ou orçamento que ela rompe; a janela e o ambiente de medição; o percentil; o período de observação mostrando que a ruptura é sustentada, não esporádica; e por que nenhum remédio em processo a resolve. | "Não vai escalar"; uma projeção sem medição; um único incidente; um benchmark sintético que não corresponde a uma necessidade validada; um limiar inventado no mesmo documento que o cita. |
| X2 | **Justificativa de fronteira de falha** | Qual falha está sendo isolada; seu blast radius atual; o blast radius após a extração; os **novos** modos de falha que a partição de rede introduz (timeout, falha parcial, entrega duplicada, ordenação, split-brain); como cada novo modo é detectado e degradado (DOM-0007); e o argumento líquido de segurança, não apenas a alegação de isolamento. | "Microsserviços são mais resilientes"; uma alegação de isolamento que ignora os modos de falha que a extração acrescenta. |
| X3 | **Titular operacional** | Um papel nomeado e responsável pela nova unidade: on-call, SLOs, capacidade, upgrades, ensaio de restore, comando de incidente, e seu próprio runbook. Confirmação de que o titular aceitou a carga. | Um serviço sem dono; "o time de plataforma" sem um papel responsável nomeado; um titular que não foi consultado. |
| X4 | **Caminho de migração** | Como o estado se move (ou é dividido); como a propriedade de tenant/encounter permanece invariante através da mudança (DOM-0001); como comandos em voo, entradas de outbox e alertas não confirmados são tratados; como o replay determinístico de avaliações pré-migração permanece possível (DOM-0003); como a cadeia de auditoria permanece contínua e verificável (DOM-0002); sequenciamento de expand/contract; e o plano de dual-run/verificação. | Um cutover sem dual-run; uma migração que quebra o replay histórico; uma cadeia de auditoria com uma lacuna. |
| X5 | **Plano de rollback** | O gatilho para reverter; quem pode invocá-lo e dentro de qual prazo; como o estado escrito na unidade extraída é reconciliado de volta; a janela máxima de perda de dado; o fallback clínico durante a reversão; e evidência de que o rollback foi **ensaiado**, não apenas escrito. | Um rollback não testado; "reverter a implantação" como um plano de migração de estado. |
| X6 | **Adicional, proposto por esta ADR** | Quais cenários de atributo de qualidade a extração deve melhorar, com o **plano de medição que confirmará ou refutará isso depois do fato**; e uma data de revisita na qual a melhoria alegada é verificada. | Uma extração cujo benefício nunca é medido — a forma mais comum pela qual uma arquitetura acumula serviços injustificados. |

Os mesmos seis elementos devem governar o movimento inverso (**consolidar** duas
unidades em uma), que é uma operação real e subplanejada.

---

## 6. Consequências

Consequências desta ADR existir em estado `proposed`:

### 6.1 Positivas

- A questão de unidade de implantação é explícita, em vez de resolvida pela primeira
  pessoa a escrever um manifesto de implantação.
- Os critérios de extração (§5.2) são utilizáveis **imediatamente** como uma checklist
  de revisão, seja o que for decidido depois — eles não dependem de qual opção é
  escolhida.
- A tensão entre D1/D6 (favorecendo menos unidades) e D2/D3/D4 (favorecendo mais) é
  registrada como uma tensão genuína, em vez de resolvida por preferência.

### 6.2 Negativas

- Adiar a questão de empacotamento deixa uma ambiguidade que a pressão de implementação
  vai resolver por default (a consequência negativa da Opção Z se aplica ao estado
  atual).
- O trabalho de imposição de fronteira (C5) é necessário sob toda opção, mas sem uma ADR
  aceita ele não tem titular e pode não ser financiado — e uma fronteira de módulo não
  imposta é o modo de falha que faz a opção A degradar e a consolidação posterior da
  opção B ficar cara.

### 6.3 Neutras / estruturais

- Nada aqui seleciona uma linguagem, framework, runtime, banco de dados, broker,
  orquestrador ou provedor de nuvem. Qualquer leitura desta ADR como implicando um deles
  é uma leitura equivocada.

---

## 7. Implicações transversais

| Dimensão | Implicação | Rótulo | Papel titular | ID de acompanhamento |
|---|---|---|---|---|
| Segurança clínica | A unidade de implantação determina a atomicidade do laço de segurança (D1) e o blast radius de uma única falha (D2). Sob toda opção, um comando parcialmente falho nunca deve parecer ter tido sucesso (DOM-0005) e o modo degradado deve ser explícito e visível ao clínico (DOM-0007). **HAZ-0015 e HAZ-0020 são os hazards aos quais esta ADR mais diretamente se aplica**, e ambos são hazards de topologia de processo: o hazard log registra o fan-out local-a-processo do predecessor perdendo broadcasts entre processos/pods de modo que um alerta era gerado mas nunca exibido, e múltiplas instâncias de runtime mantendo versões de regra ativas diferentes. Acrescentar unidades de implantação sem a disciplina X1–X6 reproduz exatamente isso. | INFERENCE a partir de E5, E6 | `AUTH-CLINSAFETY` | HAZ-0015, HAZ-0020, HAZ-0012, HAZ-0016, HAZ-0017, HAZ-0023; SAF-0015, SAF-0021, SAF-0017 |
| Segurança (security) | Mais unidades significa mais hops autenticados, cada um dos quais precisa restabelecer identidade confiável e contexto de tenant — e cada um é um lugar onde DOM-0001 pode ser perdido. Menos unidades significa um processo detendo mais privilégio, o que eleva o valor do isolamento em processo e da custódia de chave. | INFERENCE a partir de E7 | `AUTH-SECURITY` | ADR-0016, ADR-0017 |
| Privacidade | Cada unidade que trata PHI expande a superfície sobre a qual minimização, retenção e auditoria precisam ser impostas, incluindo seus logs, traces, caches e backups. | INFERENCE | `AUTH-PRIVACY-LEGAL` | ADR-0017, ADR-0018 |
| Interoperabilidade | Não diretamente afetada — contratos externos (FHIR, HL7, AMH, API) devem ser idênticos sob toda opção. **Se a forma de um contrato externo fosse mudar com a unidade de implantação, isso seria um sinal de mau design**: o contrato está vazando topologia interna. | INFERENCE | `AUTH-DATA-PLATFORM` | ADR-0012, ADR-0013 |
| Acessibilidade | Nenhuma implicação direta. Indireta: mais partições produzem mais estados de falha parcial, e todo estado degradado visível adicional precisa ser anunciado de forma acessível e não apenas por cor (prompt §11). | INFERENCE | `AUTH-UX` | ADR-0021 |
| Operacional | Determina diretamente a superfície de on-call, a topologia de implantação, o custo de observabilidade, a complexidade de DR e os caminhos de restore (D7). Cada unidade precisa de sua própria semântica de prontidão representando *capacidade segura*, não vivacidade de processo (§15.3). | INFERENCE | `AUTH-OPERATIONS` | ADR-0019, ADR-0020 |
| Custo | Custo de infraestrutura, observabilidade e trabalho operacional escala com a contagem de unidades. Nenhum modelo de custo existe; nenhum é inventado aqui. | VALIDAÇÃO NECESSÁRIA | `AUTH-PRODUCT` | pendente |
| Migração | A extração é uma migração de estado com obrigações de registro clínico e continuidade de auditoria (X4), nunca um redeploy. Reverter uma extração é igualmente uma migração. | INFERENCE | `AUTH-OPERATIONS` | ADR-0023 |

---

## 8. Reversibilidade, gatilhos de revisita, kill/rollback

### 8.1 Avaliação de reversibilidade

| Opção | Reversibilidade | O que fica encalhado | Rótulo |
|---|---|---|---|
| A | Alta **se** as fronteiras forem impostas; baixa se não forem — a imposição é todo o argumento de reversibilidade | Nada estrutural, se a extração foi antecipada na fronteira do módulo | INFERENCE |
| A2 | Alta para a fronteira do kernel; igual a A no restante | O contrato de transporte do kernel | INFERENCE |
| B | Baixa — consolidação significa fundir armazenamentos, schemas e históricos operacionais | Infraestrutura e histórico operacional por serviço | INFERENCE |
| C | Mais baixa — semântica específica de provedor permeia o código | Implementação acoplada ao provedor e ferramental operacional | INFERENCE |
| Z | n/a | n/a | INFERENCE |

### 8.2 Gatilhos de revisita

| # | Gatilho | Detecção | Notifica | Ação |
|---|---|---|---|---|
| T1 | Uma ruptura de SLO sustentada e medida, atribuível ao perfil de recurso de um módulo. | QAS-0008, QAS-0009 + telemetria por módulo | `AUTH-OPERATIONS` | Abrir uma ADR de extração atendendo X1–X6 |
| T2 | Uma fronteira de segurança é identificada que comprovadamente não pode ser imposta em processo. | Modelo de ameaça (Gate G6) | `AUTH-SECURITY` | Abrir uma ADR de extração; X2 precisa carregar a justificativa de segurança |
| T3 | Conflito de cadência de release entre contextos se torna um custo de entrega medido. | Métricas de entrega | `AUTH-PRODUCT` | Avaliar versionamento em nível de artefato (D5) **antes** de separação de implantação |
| T4 | Uma falha de processo único causa uma parada clinicamente significativa do laço de segurança. | Registro de incidente | `AUTH-CLINSAFETY` | Reabrir D2; considerar A2 ou extração direcionada |
| T5 | Uma violação de fronteira de módulo alcança a branch principal. | Verificação de fronteira bloqueante de build (C5) | Titular do módulo | Corrigir imediatamente — este é o indicador antecedente de que a opção A está degradando |
| T6 | ADR-0001 aceita como opção (b). | ADR-0001 | `AUTH-PRODUCT` | Reabrir: a unidade de implantação passa a ser parcialmente da AMH para definir |
| T7 | Tamanho ou estrutura da organização de entrega muda materialmente (A1). | Modelo operacional | `AUTH-PRODUCT` | Reavaliar D7 e D5 |

### 8.3 Estratégia de kill switch / rollback

Nada a desligar enquanto `proposed`. Restrição permanente até a aceitação: **nenhum
módulo pode ser extraído para um serviço implantado separadamente sem uma ADR
satisfazendo §5.2 X1–X6.** Uma extração que apareça em um pull request sem tal ADR é um
defeito bloqueante de revisão, e revisores devem tratar "podemos escrever a ADR depois"
como uma rejeição.

Na aceitação, a opção escolhida precisa definir: para A/A2, o que acontece quando a
unidade única (ou o kernel) fica indisponível — o modo degradado visível ao clínico e o
fallback manual; para B/C, kill switches por unidade e o comportamento do laço de
segurança quando qualquer unidade estiver fora do ar.

---

## 9. Método de validação e evidência vinculada

| # | Alegação | Método de validação | Ambiente | IDs vinculados |
|---|---|---|---|---|
| V1 | As fronteiras de módulo são de fato impostas, não aspiracionais. | Verificação automatizada de dependência/fronteira em CI que **falha o build**, mais um fixture deliberadamente violador provando que a verificação dispara. | CI | QAS-0024; SAF-0030; TST: arquitetura de testes pendente |
| V2 | Comandos relevantes para a segurança são atômicos com seus eventos publicados. | Testes de ponto de crash de outbox: matar entre o commit e a publicação, afirmar que nenhum efeito é perdido ou duplicado. | Ambiente de teste | QAS-0021; DOM-0005; HAZ-0009, HAZ-0012, HAZ-0023; SAF-0013, SAF-0015, SAF-0017 |
| V3 | O replay determinístico reproduz avaliações históricas exatamente sob a topologia escolhida. | Testes de replay sobre um corpus registrado; testes de mutação contra o avaliador. | Ambiente de teste | QAS-0020; DOM-0003; HAZ-0020, HAZ-0021; SAF-0019, SAF-0021 |
| V4 | Projeções e visões em tempo real são rebuildáveis a partir de estado durável. | Destruir e reconstruir projeções; comparar contra uma referência; medir tempo de reconstrução. | Ambiente de teste | QAS-0009, QAS-0022; DOM-0006; HAZ-0015, HAZ-0017; SAF-0015, SAF-0016 |
| V5 | A propriedade de tenant/encounter sobrevive a todo hop que a topologia escolhida introduz. | Testes adversariais cross-tenant em cada fronteira. | Ambiente de teste | QAS-0018; DOM-0001; HAZ-0003, HAZ-0013; SAF-0007, SAF-0008 |
| V6 | O modo degradado é explícito e visível ao clínico quando uma unidade está indisponível. | Injeção de falha por unidade + validação de fatores humanos. | Ambientes de teste + usabilidade | QAS-0023; DOM-0007; HAZ-0024, HAZ-0025; SAF-0024, SAF-0025; VAL: backlog de validação pendente |
| V7 | Qualquer extração futura entregou a melhoria alegada. | O plano de medição X6, executado após a data de revisita. | Similar a produção | QAS: por ADR de extração |

---

## 10. Relações de supersessão

- **Supersede:** nenhuma.
- **Superseded by:** nenhuma.
- **Notas de relação:** ADRs de extração individuais **não** supersedem esta — elas são
  governadas *por* ela e precisam citá-la. Apenas uma mudança na própria estratégia de
  baseline, ou nos critérios do §5.2, supersede esta ADR.

---

## 11. Autoverificação contra o gate de completude do template

Todas as seções presentes; quatro alternativas mais uma variante mais adiar; cada uma
com consequências positivas e negativas; direcionadores discriminantes e mapeados a
cenários de atributo de qualidade; **nenhum limiar numérico inventado** — §5.2 X1
recusa explicitamente fixar um; todas as oito linhas transversais presentes;
reversibilidade, gatilhos e kill/rollback presentes; métodos de validação com
placeholders honestos; supersessão presente; **nenhuma tecnologia escolhida**; nenhuma
aprovação fabricada; `adr-index.md` atualizado na mesma mudança.
