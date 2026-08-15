---
id: ADR-0010
title: Backbone de transação/outbox/eventos e garantias de entrega
status: proposed
status_history:
  - status: not-started
    date: 2026-08-14
    by: candidate-architecture and ADR-program engineer (Wave 2)
    note: ID reservado em adr-index.md (§10 item 10 do prompt)
  - status: proposed
    date: 2026-08-15
    by: arquiteto de decisões de runtime e entrega (ciclo 1)
    note: >
      Redigido em pt-BR (DEC-G0-10). Opções, drivers e minuta normativa proposta;
      classes de tecnologia aparecem com critérios de avaliação, jamais como
      seleção (§3 regra 14). NENHUMA decisão é registrada e nenhum agente pode
      registrá-la.
date: 2026-08-15
owner: >
  UNASSIGNED — VALIDATION REQUIRED (candidatos por adr-index.md §3:
  AUTH-PRODUCT e AUTH-OPERATIONS — ambos detidos interinamente por rodaquino-OMNI
  via DEC-G0-01/DEC-G0-06; a confirmação como dono é ato humano, não deste autor)
approvers:
  - UNASSIGNED — VALIDATION REQUIRED   # role: AUTH-PRODUCT (forma do backbone e contrato de entrega)
  - UNASSIGNED — VALIDATION REQUIRED   # role: AUTH-OPERATIONS (operação, DLQ, replay, recuperação)
decision_deadline: >
  UNSET — VALIDATION REQUIRED. Restrição de ordem: os Gates G4 e G7 listam este
  ADR (adr-index.md §5); a fatia vertical G7 exige "durable alert/work item plus
  outbox" demonstrados com testes de crash-point.
deciding_authority_rule: >
  docs/00-governance/decision-rights.md §2, linha "Architecture decisions (ADR
  ratification)". Cláusulas de visibilidade de quarentena/DLQ com consequência
  clínica (B6) exigem adicionalmente AUTH-CLINSAFETY.
independence_check: >
  decision-rights.md §3: quem implementar o backbone NÃO pode verificar
  independentemente os testes de crash-point/replay correspondentes
  (implementador ≠ verificador). Este ADR foi redigido por agente; nenhum agente
  o aprova; o autor não é aprovador.
links:
  drivers:
    domain_invariants: [DOM-0001, DOM-0004, DOM-0005, DOM-0006, DOM-0007, DOM-0009]
    quality_scenarios: [QAS-0004, QAS-0008, QAS-0009, QAS-0015, QAS-0021, QAS-0022, QAS-0023, QAS-0027]
    risks: ["pending risk register IDs — see docs/00-governance/registers/risk-register.md"]
  constrains:
    requirements: ["REQ: pendente de catálogo de requisitos (docs/04-product-requirements ainda não existe)"]
    clinical: ["CLR: pendente do portfólio de vias clínicas (Gate G2)"]
    safety: [SAF-0012, SAF-0013, SAF-0014, SAF-0015, SAF-0016, SAF-0033]
  hazards: [HAZ-0009, HAZ-0011, HAZ-0012, HAZ-0015, HAZ-0016, HAZ-0017, HAZ-0034]
  tests: ["TST-DOM-0005", "TST-DOM-0006", "TST: pendente de arquitetura de teste"]
  validations: ["VAL: pendente do backlog de validação"]
  adrs:
    depends_on: [ADR-0002, ADR-0005]
    feeds: [ADR-0009, ADR-0011, ADR-0020]
  gates: [G4, G7]
  evidence:
    - docs/03-domain/invariants/DOM-invariants.md
    - docs/05-clinical-safety/hazard-log.md
    - docs/11-security-privacy-compliance/threat-model.md
    - docs/08-interoperability/amh-data/contract-v1/eventos-ciclo-de-vida-identidade.md
    - docs/06-architecture/adrs/ADR-0002-modular-monolith-and-extraction-criteria.md
    - docs/06-architecture/adrs/ADR-0005-modelo-canonico-observacao-proveniencia-qualidade-correcao-tempo.md
supersedes: null
superseded_by: null
provenance:
  source_repo: intensicare-V2
  path_or_url: docs/06-architecture/adrs/ADR-0010-backbone-transacao-outbox-eventos-garantias-de-entrega.md
  commit_sha_or_version: 0c36f03 (HEAD do repositório na redação; este arquivo não está commitado)
  section_or_lines: >
    INTENSICARE_V2_ORCHESTRATOR_PROMPT.md §3 regras 9 e 14, §9.1 princípios 5/6,
    §9.4 (outbox transacional + broker/stream durável como classe), §10 item 10,
    §12.1 (semântica de entrega honesta), §12.3 (fronteira de persistência antes
    de ACK), §14 (testes de crash-point/replay/duplicata/ordenação/reconciliação);
    contrato de identidade v1 §3 (at-least-once, ordenação por sujeito)
  date_collected: 2026-08-15
  collector: arquiteto de decisões de runtime e entrega (ciclo 1)
  transformation: >
    reasoned-from — opções derivadas do baseline candidato §9.4 e dos invariantes
    DOM-0005/0006; nenhum benchmark foi executado e nenhum número de desempenho é
    citado como medido.
  confidence: medium
  owner: UNASSIGNED — VALIDATION REQUIRED
  validation_status: VALIDATION REQUIRED
---

# ADR-0010 — Backbone de transação/outbox/eventos e garantias de entrega

> **Status: `proposed`. Este documento apresenta opções, drivers e uma minuta
> normativa proposta (§5.2). NÃO registra decisão.** Duas restrições não são
> alternativas em avaliação: DOM-0006 (*durabilidade precede imediatismo*) e a
> regra §3-9 (entrega em tempo real deriva de estado/eventos duráveis e
> replayáveis). Elas vinculam toda opção abaixo. **Nenhum broker, banco ou
> tecnologia é selecionado aqui** (§3 regra 14) — classes aparecem com critérios.

---

## 1. Contexto e formulação do problema

SOURCE (prompt §9.1 princípio 5): comandos são *"transactionally published"* —
nenhuma mudança de estado sem fato durável publicado correspondente. SOURCE
(§9.4): a topologia candidata nomeia *"transactional outbox plus durable
broker/stream"* como baseline a testar, não a adotar cegamente. SOURCE (§14): a
estratégia de verificação exige *"transaction/outbox crash-point, replay,
duplicate, ordering, and reconciliation tests"*; o Gate G7 exige *"durable alert/
work item plus outbox"* na primeira fatia vertical.

INFERENCE (dos hazards): os modos de falha que este ADR existe para tornar
irrepresentáveis já têm registro: ACK antes de persistência durável e fila
não-durável perdendo fato silenciosamente (HAZ-0012, com precedente legado
"process-local replay store"); entrega duplicada sem chave canônica de
idempotência (HAZ-0009, precedente legado de chave derivada de dados do
paciente); reordenação invertendo a direção clínica do paciente (HAZ-0011);
fan-out process-local que morre com o processo (HAZ-0015/HAZ-0016 via legado).

O ADR-0009 (mesma data) pressupõe publicação transacional das transições (W6); o
ADR-0011 pressupõe eventos duráveis dos quais projeções são rebuildáveis; o
ADR-0006 pressupõe reconciliação sobre um acervo durável. Este ADR é o chão comum
dos três.

**Pergunta.** Como a V2 garante que toda mudança de estado clínico-operacional
(fato admitido, avaliação, alerta, transição de item, auditoria) produza seus
eventos de forma atômica com a transação que a persistiu; com que semântica de
entrega, ordenação, replay, tratamento de veneno e recuperação de crash — sem
escolher tecnologia concreta?

**Fora de escopo** (cada item nomeado):

- Forma canônica do fato e envelope de origem — **ADR-0005**.
- Relação entre lane operacional e analítica — **ADR-0006**.
- Estados e comandos de alerta/item — **ADR-0009** (consome daqui).
- Projeções, tempo real e notificação — **ADR-0011** (consome daqui).
- Contrato de eventos *externos* (AMH×IntensiCare) — pacote de contrato v1 e
  ADR-0013; este ADR trata do backbone **interno** da V2. A semântica externa
  decidida (at-least-once, ordenação por sujeito — AQ-5) entra aqui como
  restrição de compatibilidade, não como decisão deste ADR.
- Seleção de broker/stream/banco — ADR futuro de plataforma com drivers medidos
  (§9.4 critérios; §3 regra 14); aqui somente classes e critérios.
- SLOs de lag/replay e monitoração — **ADR-0020**.

---

## 2. Evidência e premissas

### 2.1 Evidência

**Nota epistêmica única.** Linhas de invariantes, hazards, threats e ADRs são
`SOURCE`/`OBSERVED` por leitura em disco deste autor; alegações legadas são
SOURCE via hazard log/threat model, que citam o assessment; nenhum artefato
legado foi reverificado.

| # | Rótulo | Afirmação | Fonte | Confiança |
|---|---|---|---|---|
| E1 | SOURCE | DOM-0005: efeito + auditoria + publicação na mesma fronteira transacional ("no state change without a correspondingly durable, published fact"); DOM-0006: nada é entregue a humano/sistema sem antes estar durável e replayável. | DOM-invariants.md | alta |
| E2 | SOURCE | *"Define delivery semantics honestly: at-least-once transport requires idempotent consumers; ordering scope and replay window must be explicit."* | prompt §12.1 | alta |
| E3 | SOURCE | *"Never acknowledge durable acceptance before the agreed persistence boundary is met."* | prompt §12.3 | alta |
| E4 | SOURCE | HAZ-0012 (S4, Unacceptable): ACK antes de persistir / fila não-durável descarta fato → avaliação roda sobre registro incompleto com resultado tranquilizador que ninguém sabe estar incompleto; precedente legado sem store-and-forward durável. | hazard-log.md HAZ-0012 | alta |
| E5 | SOURCE | HAZ-0009: entrega duplicada sem chave canônica → fatos duplicados, tendências dobradas, alertas duplicados; precedente legado de chave de fallback derivada do paciente (mensagens distintas tratadas como replay). | hazard-log.md HAZ-0009 | alta |
| E6 | SOURCE | HAZ-0011: entrega fora de ordem → valor superado sobrescreve mais novo; direção clínica invertida. | hazard-log.md HAZ-0011 | alta |
| E7 | SOURCE | THR-0015: qualquer coisa capaz de publicar no tópico/outbox interno (worker comprometido, papel IAM largo, produtor não confiável) forja fato clínico-operacional; o backbone precisa de autorização de produtor. | threat-model.md THR-0015 | alta |
| E8 | SOURCE | Contrato de identidade v1 (fronteira externa, DECIDED AQ-5): at-least-once + ordenação por sujeito + dedup por idempotency_key + equivalência de replay. O backbone interno precisa, no mínimo, **não degradar** essas garantias ao propagá-las. | contract-v1/eventos-ciclo-de-vida-identidade.md §3 | alta |
| E9 | SOURCE | QAS-0008 mede lag de fila e backlog de replay; QAS-0021 mede idempotência/concorrência/publicação transacional; QAS-0022 mede durabilidade-precede-imediatismo (rebuild + chaos de canal). Alvos numéricos VALIDATION REQUIRED. | quality-attribute-scenarios.md | alta |
| E10 | SOURCE | ADR-0002 (proposed): baseline de monólito modular — o backbone atravessa módulos dentro de um deployable; extração futura por ADR com gatilho quantitativo. A forma do backbone não pode pressupor rede entre módulos. | ADR-0002 | alta |
| E11 | SOURCE | DOM-0009/`time-semantics.md`: tempos de evento distinguem tempo do fato × tempo de emissão × tempo de publicação; nenhum tempo é inventado; ordenação clínica usa tempos do modelo, não ordem de chegada. | DOM-invariants.md DOM-0009; ADR-0005 M3/M9 | alta |
| E12 | SOURCE | HAZ-0034: reconciliação pós-downtime indefinida → alertas gerados durante a queda nunca reconciliados; o backbone é o acervo do qual essa reconciliação parte. | hazard-log.md HAZ-0034 | alta |

### 2.2 Premissas

A registrar em `assumptions-register.md`; **nenhum ID `ASM` é cunhado aqui**.

| # | Premissa | Por que é necessária | O que a invalida | Dono |
|---|---|---|---|---|
| A1 | O armazenamento operacional da V2 será de classe transacional com transações ACID locais (classe "PostgreSQL-like" do §9.4 — classe, não produto). | O padrão outbox pressupõe atomicidade local entre efeito e registro de saída. | Decisão futura de plataforma por armazenamento sem transação local — reabriria este ADR inteiro. | UNASSIGNED — VALIDATION REQUIRED |
| A2 | O volume interno de eventos da V2 (fatos + avaliações + transições + auditoria) é o de uma plataforma de UTI por tenant, não o de telemetria de alta frequência (dispositivos entram, se entrarem, pelo ingresso com contrato próprio). | Dimensiona as opções sem benchmark; evita superdimensionar por medo. | Portfólio G2 exigindo ingestão de forma de onda/frequência de dispositivo no backbone interno. | UNASSIGNED — VALIDATION REQUIRED |
| A3 | Consumidores internos (projeções, notificação, reconciliação) toleram redelivery e implementam dedup por idempotency_key. | É a contrapartida obrigatória do at-least-once (E2). | Descoberta de consumidor que não possa deduplicar — seria defeito de desenho, não exceção a acomodar. | UNASSIGNED — VALIDATION REQUIRED |
| A4 | Uma janela de replay finita e declarada é suficiente para reconstrução de projeções e reconciliação; replay além da janela usa o acervo canônico (fatos/envelopes ADR-0005), não o log de eventos. | Evita exigir retenção infinita do log; separa "log de integração" de "acervo de verdade". | Exigência de auditoria/regulatória de replay integral pelo log — ADR-0018 decidirá retenção. | UNASSIGNED — VALIDATION REQUIRED |

### 2.3 Hipóteses a testar

| # | Hipótese | Como seria testada | Quem testa | Estado |
|---|---|---|---|---|
| H1 | O relay do outbox (polling ou tailing) sustenta a latência exigida pelo laço com folga sob o volume A2. | Testes de carga na fatia G7 com fixtures sintéticas; percentis de outbox→consumidor. | engenharia de plataforma + verificador independente | UNTESTED |
| H2 | Todos os crash-points enumerados em B5 são reproduzíveis em teste automatizado (não apenas em raciocínio). | Harness de injeção de falha na fatia G7. | idem | UNTESTED |
| H3 | A ordenação por escopo declarado (B3) cobre todos os consumidores reais sem exigir ordem global. | Revisão de consumidores na fatia G7 + testes de reordenação. | idem | UNTESTED |

---

## 3. Direcionadores de decisão e atributos de qualidade mensuráveis

Alvos numéricos: `VALIDATION REQUIRED` — **nenhum é inventado**.

| # | Driver | Por que discrimina | Atributo mensurável | Alvo |
|---|---|---|---|---|
| D1 | **Atomicidade efeito×publicação** (E1): nenhuma janela em que o estado mudou e o evento não existe (nem o inverso) | As opções diferem estruturalmente: outbox fecha a janela por transação local; dual-write a deixa aberta; CDC a fecha por construção no log do banco | QAS-0021; TST-DOM-0005 | Vinculante (DOM-0005) |
| D2 | **Nenhuma perda silenciosa** (E3, E4): ACK só após fronteira de persistência; veneno vai a quarentena visível, jamais descarte | Opções diferem em onde a durabilidade acontece e quantos saltos existem antes dela | QAS-0022, QAS-0008 | Vinculante (DOM-0006; §12.3) |
| D3 | **Dedup e ordenação declaradas** (E2, E5, E6): at-least-once honesto com consumidores idempotentes; ordenação por escopo explícito; janela de replay declarada | Opções diferem em quão natural é manter ordem por escopo (log particionado × fila × tabela) | QAS-0008; TST de reordenação (§14) | Vinculante quanto à *declaração*; valores VALIDATION REQUIRED |
| D4 | **Recuperação de crash comprovável** (§14): todo crash-point tem teste | Opções diferem no número de crash-points e na testabilidade de cada um | QAS-0015, QAS-0022 | VALIDATION REQUIRED |
| D5 | **Simplicidade operacional sob monólito modular** (E10) | Um backbone que exija operar um cluster de streaming desde o dia um contradiz o baseline §9.1-8 sem gatilho quantitativo | QAS-0023, QAS-0027 | VALIDATION REQUIRED |
| D6 | **Segurança do plano de publicação** (E7): produtor autorizado, envelope com tenant/escopo | Opções diferem na superfície de quem consegue "escrever evento" | QAS-0014 (via ADR-0016); THR-0015 | Vinculante (DOM-0001) |
| D7 | **Custo e dependência de serviço gerenciado** (§9.4 critérios) | Sem modelo de custo; registrado como não quantificado | QAS-0027 | VALIDATION REQUIRED |

---

## 4. Alternativas consideradas

### Opção A — Outbox transacional + relay para transporte durável (elaboração do baseline §9.4)

**Descrição.** Toda transação que muda estado grava, na MESMA transação local, o
efeito, a `AuditEvidence` e as linhas de outbox (evento serializado + chave de
idempotência + escopo de ordenação). Um relay (processo próprio dentro do
deployable, conforme E10) lê o outbox comprometido e publica no transporte
durável interno (classe: log/stream durável OU fila durável — critérios em B9),
marcando progresso por cursor durável. Consumidores deduplicam por chave.

**Frente aos drivers.** D1: atomicidade por construção (uma transação local).
D2: durabilidade acontece no armazenamento transacional antes de qualquer
transporte; veneno no relay/consumidor vai a DLQ visível (B6). D3: ordenação por
escopo mantida por sequência de outbox por agregado; at-least-once do relay é
honesto e a dedup é obrigatória. D4: crash-points enumeráveis e testáveis
(commit-sem-publicar → relay reenvia; publicar-sem-marcar → duplicata deduplicada).
D5: o relay é código simples; o transporte pode começar mínimo (ver B9) sem
cluster dedicado. D6: só o relay publica — o produtor é um (THR-0015 mitigado por
construção). D7: custo do transporte adiável até drivers medidos.

**Consequências positivas.** Padrão auditável e amplamente compreendido; separa
"acervo de verdade" (banco) de "log de integração" (transporte), permitindo A4;
compatível com extração futura de módulos (o transporte já existe como costura).

**Consequências negativas.** Latência adicional do relay (polling/tailing) — H1
existe para medi-la; o outbox cresce e exige poda disciplinada (janela A4);
duplicatas são normais e TODO consumidor paga a dedup (A3) — o custo é
distribuído e permanente; duas peças a operar (banco + transporte) mesmo no
mínimo.

**O que precisaria ser verdade.** A1 (transação local) e A3 (consumidores
idempotentes) — ambas já exigidas por invariantes/regras independentes deste ADR.

**Custo de saída.** Baixo-moderado: o contrato de evento sobrevive; troca-se
relay/transporte sob o mesmo contrato.

### Opção B — CDC do log de transações como fonte de eventos (sem tabela de outbox)

**Descrição.** Os eventos são derivados do log de alterações do armazenamento
(captura de dados de alteração), transformados em eventos de domínio por um
processador e publicados no transporte.

**Frente aos drivers.** D1: atomicidade por construção (o log É a transação).
D2: durável por definição. D3: ordem do log é ordem de commit — ordenação por
agregado derivável. D4: crash-points no processador CDC — testáveis, porém o
harness depende de tooling específico do banco. D5: **este é o ponto fraco
honesto**: CDC acopla o contrato de eventos ao esquema físico das tabelas (o
evento vira subproduto do layout de linha) e exige tooling de captura operado
desde o dia um; a tradução linha→evento-de-domínio reintroduz uma camada que o
outbox já é, com menos controle do autor do domínio. D6: idem à A (um produtor).
D7: dependência de tooling de captura da plataforma escolhida — decisão de
tecnologia que este ADR não pode fazer (§3-14), o que torna B **prematura por
definição** enquanto a plataforma não é decidida.

**Consequências positivas.** Elimina a tabela de outbox e sua poda; nenhuma
chance de "esquecer de gravar o evento" (tudo que muda aparece no log).

**Consequências negativas.** Contrato de evento acoplado a esquema físico
(migrações passam a ser mudanças de contrato de evento); tooling específico de
banco antes de haver decisão de banco; eventos de domínio ricos (com intenção do
comando) precisam ser reconstruídos de deltas de linha — perda semântica real.

**O que precisaria ser verdade.** Plataforma de armazenamento decidida com
tooling CDC maduro; disciplina de mapeamento esquema→evento versionada;
tolerância à perda de intenção do comando (mitigável gravando a intenção em
tabela — o que reintroduz o outbox pela porta dos fundos).

**Custo de saída.** Moderado: migrar de B para A é adicionar o outbox e
desligar a captura.

### Opção C — Publicação direta dupla (escrever no banco e publicar no broker, sem outbox)

**Descrição.** O código de comando comita a transação e, em seguida, publica o
evento no transporte (duas escritas, dois sistemas, sem atomicidade).

**Frente aos drivers.** D1: **falha por construção** — a janela entre commit e
publish é exatamente o gap dual-write: crash entre os dois deixa estado sem
evento (projeções cegas, HAZ-0015 estrutural) ou evento sem estado (se a ordem
inverter). Nenhuma quantidade de retry fecha a janela — apenas a estreita.
D2/D4: crash-points não-fecháveis. D5: é a mais simples de escrever — e é assim
que ela entra em bases de código sem decisão.

**Consequências positivas.** Menos uma tabela; menos um relay; latência mínima
no caminho feliz.

**Consequências negativas.** Viola DOM-0005 por construção; o precedente legado
(eventos process-local, HAZ-0015/0016) é a forma degenerada disto. Listada
porque é o default acidental de qualquer implementação apressada — nomeá-la com
suas consequências é a defesa contra adotá-la por omissão.

**O que precisaria ser verdade.** Nada a torna aceitável sob DOM-0005; consta
para registro honesto.

**Custo de saída.** Alto após incidente: os fatos perdidos na janela não se
recuperam.

### Opção D — Event sourcing como armazenamento primário (o log de eventos É a verdade; estado é projeção)

**Descrição.** Nenhuma tabela de estado autoritativa: comandos apensam eventos a
um event store; todo estado (fatos, itens, avaliações) é projeção do log.

**Frente aos drivers.** D1: atomicidade trivial (uma escrita). D2: durável por
definição. D3: ordem por agregado nativa. D4: crash-points reduzidos. D5: **o
custo honesto**: TODO acesso de leitura vira projeção; a curva de modelagem
(upcasting de eventos, versionamento de esquema de evento, snapshots) é paga em
todo o sistema e para sempre; o ADR-0005 já propõe um modelo canônico de fato
imutável com correções explícitas — que entrega os benefícios de auditabilidade
SEM impor projeção universal. D7: exige event store operado como componente
central único.

**Consequências positivas.** Auditabilidade máxima por construção; replay
uniforme; nenhuma dualidade estado×evento.

**Consequências negativas.** Redundante com o modelo ADR-0005 (fato imutável +
envelope retido já dão o replay que DOM-0003 exige); complexidade permanente de
versionamento de evento em TODA consulta; equipe e tooling especializados;
reversão custosa. A sobreposição com ADR-0005 significa que escolher D aqui
reabriria aquele ADR — custo de acoplamento que as demais opções não têm.

**O que precisaria ser verdade.** Que a projeção universal fosse necessária além
do que DOM-0003/0006 já exigem — nenhuma evidência atual sugere isso.

**Custo de saída.** Alto: sair de event sourcing é reconstruir o modelo de
estado inteiro.

### Opção Z — Adiar

**Descrição.** Não fixar o backbone; cada módulo resolve publicação como quiser.

**Consequências positivas.** Nenhum compromisso.

**Consequências negativas.** O G7 exige outbox demonstrado — adiar bloqueia a
fatia vertical; "cada módulo resolve" converge para a Opção C por gravidade
(é a mais fácil de escrever); ADR-0009 W6 e ADR-0011 ficam sem chão.

**Custo do atraso.** Máximo entre os quatro ADRs desta onda: este é o único
listado em **dois** gates (G4 e G7).

### 4.1 Comparação frente aos drivers

| Driver | A — outbox+relay | B — CDC | C — dual-write | D — event sourcing | Z — adiar |
|---|---|---|---|---|---|
| D1 atomicidade | Por construção (transação local) | Por construção (log) | **Janela aberta por construção** | Por construção | Converge para C |
| D2 perda silenciosa | Durável antes do transporte; DLQ visível | Durável; DLQ no processador | Crash-point não-fechável | Durável | Não resolvido |
| D3 dedup/ordenação | Sequência por agregado; dedup obrigatória | Ordem de commit; dedup obrigatória | Sem garantia | Nativa por agregado | Não resolvido |
| D4 crash comprovável | Enumerável e testável | Testável com tooling do banco | Não-fechável | Reduzido | n/a |
| D5 simplicidade sob monólito | Relay simples; transporte mínimo adiável | Tooling de captura desde o dia um; contrato acoplado a esquema | A mais simples — e por isso perigosa | Curva permanente em todo o sistema | n/a |
| D6 produtor autorizado | Um produtor (relay) | Um produtor (processador) | Todo código de comando publica | Um produtor | Difuso |
| D7 custo | Moderado, adiável | Dependente de plataforma não decidida | Baixo até o incidente | Alto e permanente | Zero agora |

---

## 5. Decisão e escopo

> **NENHUMA DECISÃO ESTÁ REGISTRADA.** Este ADR apresenta opções, drivers e a
> minuta §5.2. Preencher esta seção é reservado à autoridade decisora nomeada no
> front matter. A minuta abaixo é o que a aceitação **vincularia** — nada dela
> vige antes.

### 5.1 Condições que devem ser satisfeitas antes da aceitação

| # | Condição | Dono | Evidência que a fecha | Estado |
|---|---|---|---|---|
| C1 | ADR-0005 aceito — o backbone publica eventos sobre fatos/correções cuja forma vem de lá (M1/M3/M9). | titular | Aceitação registrada | ABERTA (0005 `proposed`) |
| C2 | ADR-0002 com direção confirmada (monólito modular) — B9 pressupõe transporte operável dentro de um deployable; extração muda o cálculo D5. | titular | Aceitação registrada ou direção confirmada | ABERTA (0002 `proposed`) |
| C3 | Esquema de envelope interno rascunhado (B8) e conferido contra o envelope externo do contrato v1 — compatibilidade de propagação (E8), não cópia. | autoridade deste ADR + steward do contrato | Nota de conferência | ABERTA |
| C4 | Harness de crash-point especificado (H2) como parte da arquitetura de teste — aceitar sem rota de teste tornaria D4 inverificável. | verificador independente (a nomear) | Especificação de harness registrada | ABERTA |
| C5 | Janela de replay e política de poda do outbox/transporte declaradas (A4) — valores VALIDATION REQUIRED; a *estrutura* da declaração é condição. | AUTH-OPERATIONS | Anexo de retenção ratificado (interage com ADR-0018) | ABERTA |

### 5.2 Minuta normativa proposta (PROPOSAL — o que a aceitação vincularia)

Cláusulas marcadas ◆ têm consequência clínica direta e exigem AUTH-CLINSAFETY.

**B1 — Fronteira transacional única.** Todo comando que muda estado grava efeito,
`AuditEvidence` e registro(s) de saída de evento **na mesma transação local**
(DOM-0005). Não existe caminho de mudança de estado fora dessa fronteira; a
existência de um é defeito, não variação.

**B2 — At-least-once + consumidores idempotentes.** A entrega interna é
at-least-once, declarada como tal (E2); TODO consumidor deduplica por
`idempotency_key` estável entre redeliveries. A chave deriva do fato/comando —
**jamais** de heurística sobre dados do paciente (precedente negativo HAZ-0009).
Exactly-once não é prometido nem presumido.

**B3 — Ordenação por escopo declarado.** Cada tipo de evento declara seu escopo
de ordenação (por item de trabalho, por encontro, por sujeito `(PSR, encontro)` —
espelhando o contrato externo E8). Dentro do escopo, a ordem de consumo é a ordem
de sequência do backbone; **entre escopos nenhuma ordem global é prometida**.
Ordenação *clínica* usa os tempos do modelo (M3), nunca ordem de chegada
(HAZ-0011; E11).

**B4 — Janela de replay declarada.** O backbone sustenta replay por janela
declarada e medida (valores VALIDATION REQUIRED — C5); consumidor que processe o
fluxo desde o início da janela reconstrói estado equivalente (equivalência de
replay, espelhando E8). Reconstrução além da janela parte do acervo canônico
(fatos/envelopes ADR-0005), não do log de integração (A4).

**B5 — Crash-points enumerados e testados.** No mínimo, com teste automatizado
cada (§14): (i) crash após commit e antes de publicar → relay republica, consumidor
deduplica; (ii) crash após publicar e antes de marcar progresso → duplicata
deduplicada; (iii) crash do consumidor no meio do lote → reconsumo idempotente;
(iv) indisponibilidade do transporte → outbox acumula com visibilidade de lag
(QAS-0008), nada é perdido nem ACKado prematuramente (E3); (v) restauração de
backup → reconciliação declarada de outbox × transporte × consumidores
(HAZ-0034/E12).

**B6 — DLQ/quarentena visível.** ◆ Mensagem inconsumível (veneno) após política
declarada de retry vai a fila de quarentena **durável e visível**, com razão
codificada e alarme operacional — jamais descarte silencioso, jamais loop
infinito que bloqueie o escopo de ordenação. Quarentena com potencial impacto
clínico (evento de alerta/avaliação) é sinal visível a operadores E a clínicos
no nível apropriado (DOM-0007; paralelo estrutural de DOM-0004: veneno não vira
silêncio). Reprocessamento de quarentena é ato auditado.

**B7 — ACK na fronteira de persistência.** ◆ Nenhuma confirmação de aceitação
durável — interna ou a fonte externa — antes de a fronteira de persistência
acordada ser atingida (E3; HAZ-0012). Para o ingresso, isso significa: envelope
retido durável (M1) ANTES de ACK à fonte.

**B8 — Envelope interno mínimo.** Todo evento interno carrega: id do evento,
tipo+versão, chave de idempotência, escopo de ordenação + sequência, tenant e
escopo de recurso (DOM-0001), referência ao fato/comando de origem (jamais o
payload clínico completo quando referência basta — minimização), tempos
conforme `time-semantics.md` (fato × emissão × publicação — nenhum inventado,
E11), correlação/causalidade, e marcador de replay. O esquema é versionado; a
evolução segue a política de compatibilidade do ADR-0012.

**B9 — Classes de transporte com critérios (SEM seleção).** A publicação usa um
transporte durável interno. Classes candidatas: (i) **log/stream durável
particionado** — favorece B3/B4 nativos, custa operação de cluster; (ii) **fila
durável transacional** — simples, ordenação por escopo exige disciplina extra;
(iii) **o próprio armazenamento transacional como transporte mínimo inicial**
(consumidores leem o outbox com cursores) — menor custo operacional sob E10,
com gatilho declarado de saída quando lag/volume medidos excederem limiar
(VALIDATION REQUIRED). A seleção é de ADR de plataforma futuro, contra os
critérios do §9.4 (capacidade do operador, custo total, modos de falha,
residência, dependência de gerenciado, custo de saída) **com medição** — jamais
por herança (§3-14).

**B10 — Produtor autorizado.** Somente o relay publica no transporte (THR-0015);
produtores adicionais exigem emenda deste ADR. Consumidores autenticam-se e leem
somente escopos autorizados por tenant (DOM-0001; imposição via ADR-0016).

### 5.3 Escopo do que a aceitação vincularia

**Vincula:** a fronteira transacional, a semântica de entrega/ordenação/replay,
os crash-points testáveis, a quarentena visível, o envelope interno e a regra de
produtor único — para todo evento interno da V2, em todo tenant e ambiente.

**Não vincula:** tecnologia de transporte ou armazenamento (B9 — classes e
critérios apenas); contrato de eventos externos (pacote v1/ADR-0013); retenção
de longo prazo e legal hold (ADR-0018); SLOs de lag (ADR-0020); a forma dos
eventos de domínio específicos (cada contexto os define sob B8).

---

## 6. Consequências

Consequências **da existência deste ADR em `proposed`**.

### 6.1 Positivas

- ADR-0009 (W6) e ADR-0011 ganham o chão transacional que pressupõem; a fatia G7
  ganha a lista de crash-points que precisa demonstrar.
- A Opção C (dual-write) fica nomeada com consequências — a defesa registrada
  contra o default acidental.
- A classe (iii) de B9 dá um caminho de menor custo operacional coerente com o
  monólito modular, com gatilho de saída declarado em vez de compromisso com
  cluster prematuro.

### 6.2 Negativas

- O custo permanente da dedup em todo consumidor (A3/B2) é assumido e
  distribuído — dito em vez de escondido.
- Sem decisão de plataforma, H1 (latência do relay) não pode ser medida — a
  aceitação estrutural conviverá com um driver de latência não quantificado até
  a fatia G7.

### 6.3 Neutras / estruturais

- Nada aqui decide broker, banco ou biblioteca (§3-14).
- Nada aqui altera o contrato externo v1 — apenas exige compatibilidade de
  propagação (C3).

---

## 7. Implicações transversais

| Dimensão | Implicação | Rótulo | Papel responsável | IDs |
|---|---|---|---|---|
| Segurança clínica | B6/B7 decidem se um fato clínico pode ser perdido ou preso em silêncio entre o ingresso e a avaliação — HAZ-0012 é o objeto direto; quarentena visível é a contraparte de transporte de DOM-0004. | INFERENCE de E4 | AUTH-CLINSAFETY | HAZ-0009, HAZ-0011, HAZ-0012, HAZ-0034; SAF-0012, SAF-0013, SAF-0014, SAF-0033 |
| Segurança | Produtor único autorizado (B10) fecha THR-0015; envelope com tenant/escopo sustenta a imposição de isolamento em consumo (ADR-0016); DLQ contém potencialmente PHI e herda os controles de acesso do ADR-0017/0018. | INFERENCE | AUTH-SECURITY | THR-0015; ADR-0016, ADR-0017 |
| Privacidade (LGPD) | B8 minimiza payload (referência em vez de cópia clínica); DLQ e outbox são superfícies de retenção de PHI com política do ADR-0018; nenhuma conformidade declarada. | VALIDATION REQUIRED | AUTH-PRIVACY-LEGAL (não nomeado) | ADR-0018; QAS-0028 |
| Interoperabilidade | O backbone propaga sem degradar as garantias do contrato externo (E8/C3); o contrato de eventos internos é versionado sob a política do ADR-0012. | SOURCE E8 | AUTH-DATA-PLATFORM | ADR-0012, ADR-0013 |
| Acessibilidade | Sem implicação direta. Indireta: lag/quarentena visíveis (B6, QAS-0008) precisam alcançar a UI como estado degradado perceptível sem depender de cor (via ADR-0011/0021). | INFERENCE | AUTH-UX | ADR-0021 |
| Operacional | Relay, lag de outbox, DLQ, poda por janela e reconciliação pós-restauração viram deveres operacionais com dono de plantão; QAS-0008/0015 são os cenários de medição. | INFERENCE | AUTH-OPERATIONS | ADR-0020; QAS-0008, QAS-0015 |
| Custo | Classe (iii) de B9 minimiza custo inicial; a migração futura para log/stream tem custo de transição real; **nenhum modelo de custo existe e nenhum número é inventado**. | VALIDATION REQUIRED | AUTH-PRODUCT | QAS-0027 |
| Migração | A janela de replay (B4) e o acervo canônico (A4) definem como projeções e consumidores são reconstruídos em migrações de esquema/plataforma; importação legada (ADR-0023) NÃO entra pelo backbone — entra pela ingestão governada (ADR-0006 F7). | INFERENCE | AUTH-OPERATIONS | ADR-0023; QAS-0009 |

---

## 8. Reversibilidade, gatilhos de revisita, kill/rollback

### 8.1 Avaliação de reversibilidade

| Item | Reversibilidade | O que fica encalhado ao reverter | Rótulo |
|---|---|---|---|
| Opção A (outbox+relay) | Alta: o contrato de evento sobrevive à troca de relay/transporte | Tabela de outbox e cursores | INFERENCE |
| Opção B (CDC) | Moderada: desligar captura e adicionar outbox | Pipeline de captura e mapeamentos | INFERENCE |
| Opção C (dual-write) | Alta tecnicamente, mas os fatos perdidos na janela **não se recuperam** | A lacuna do histórico | INFERENCE |
| Opção D (event sourcing) | Baixa: sair reconstrói o modelo de estado | O event store e todos os projetores | INFERENCE |
| B9 classe (iii) → (i)/(ii) | Planejada por construção (gatilho declarado) | Cursores de leitura direta | INFERENCE |

### 8.2 Gatilhos de revisita

| # | Gatilho | Detecção | Notificar | Ação |
|---|---|---|---|---|
| T1 | Lag medido do relay/outbox excede o limiar declarado (quando definido) sob carga real | QAS-0008 | AUTH-OPERATIONS | Executar a migração de classe de transporte prevista em B9 — decisão de plataforma com medição, não improviso |
| T2 | ADR-0002 revertido (extração de serviço aceita com gatilho quantitativo) | Registro de decisão | autoridade deste ADR | Reavaliar D5/B9: o transporte vira costura entre deployables |
| T3 | A2 invalidada (ingestão de alta frequência exigida no backbone interno) | Registro do portfólio G2 | autoridade deste ADR | Reabrir B9 com drivers de volume medidos |
| T4 | Taxa de quarentena/DLQ acima do esperado em operação | Monitoração B6 | AUTH-OPERATIONS + AUTH-CLINSAFETY | Investigar contrato/mapeamento antes de qualquer afrouxamento de validação |
| T5 | Emenda do ADR-0005 tocando M1/M3/M9 ou do contrato externo tocando §3 (ordenação/entrega) | Registro de decisão | autoridade deste ADR | Reconciliar B3/B8 (C1/C3) |
| T6 | ADR-0018 fixar retenção incompatível com a janela A4/C5 | Aceitação do ADR-0018 | autoridade deste ADR | Reconciliar B4/C5 |

### 8.3 Kill switch / rollback

Enquanto `proposed`, não há mecanismo a desligar. Na aceitação, os controles
estruturais propostos: (i) **pausa de relay** — a publicação pode ser pausada por
decisão operacional registrada; o outbox acumula durável e **o lag é visível**
(DOM-0007) — nada é perdido, o efeito é atraso explícito, jamais silêncio;
(ii) **pausa por consumidor** — um consumidor defeituoso é pausado sem afetar os
demais escopos; retomada por cursor; (iii) **não existe rollback que apague
eventos publicados** — correção é evento compensatório/supersessão (coerente com
M8/N6), nunca deleção; (iv) se o transporte falhar catastroficamente, a
reconstrução parte do acervo canônico + outbox (B4/B5-v), com reconciliação
declarada — o modo de recuperação é parte do desenho, não descoberta de
incidente (HAZ-0034).

---

## 9. Método de validação e evidência vinculada

| # | Afirmação a validar | Método | Ambiente | IDs vinculados |
|---|---|---|---|---|
| V1 | Nenhuma janela efeito-sem-evento nem evento-sem-efeito em nenhum crash-point de B5 | Harness de injeção de falha nos cinco crash-points; verificação de paridade estado×eventos | Teste (sintético) | TST-DOM-0005; DOM-0005; QAS-0021 |
| V2 | Redelivery não duplica efeito em nenhum consumidor | Testes de propriedade com redelivery forçada | Teste | HAZ-0009; SAF-0013; QAS-0021 |
| V3 | Reordenação entre escopos não corrompe estado; dentro do escopo a ordem é mantida | Testes de reordenação (§14) | Teste | HAZ-0011; SAF-0014; QAS-0008 |
| V4 | Nenhum ACK antes da fronteira de persistência; queda pós-ACK não perde fato | Testes de crash no ingresso com fixtures | Teste | HAZ-0012; SAF-0012, SAF-0015; B7 |
| V5 | Veneno vai a quarentena visível com razão; escopo não bloqueia; reprocessamento auditado | Fixtures de mensagem malformada/inconsumível | Teste | B6; DOM-0007; SAF-0016 |
| V6 | Projeções reconstroem estado equivalente por replay dentro da janela | Rebuild completo + comparação (com ADR-0011) | Teste | TST-DOM-0006; DOM-0006; QAS-0009, QAS-0022 |
| V7 | Somente o relay publica; produtor não autorizado falha fechado | Testes adversariais de publicação | Teste | THR-0015; DOM-0001; QAS-0014 (via ADR-0016) |
| V8 | Recuperação pós-restauração de backup reconcilia outbox × transporte × consumidores sem lacuna silenciosa | Game-day de restauração (§14) | Ambiente de teste dedicado | HAZ-0034; SAF-0036 (via ADR-0020); QAS-0015 |

**Disciplina de marcadores.** Todos os IDs DOM/HAZ/SAF/QAS/THR/TST-DOM citados
foram lidos dos catálogos existentes antes da citação; `REQ:`/`VAL:` permanecem
marcadores literais. **Nenhum ID foi inventado.**

---

## 10. Relações de supersessão

- **Supera:** nenhum ADR.
- **Superado por:** nenhum.
- **Notas de relação:** dependência declarada de ADR-0002/0005 (C1/C2);
  alimenta ADR-0009/0011/0020. A futura seleção de transporte (B9) será um ADR
  próprio que **complementa** este sem supersedê-lo — este fixa contrato e
  garantias; aquele fixará tecnologia contra drivers medidos. Supersessão
  parcial por ambiente é permitida e jamais generalizada.

---

## 11. Autoverificação contra o gate de completude do template

Todos os campos do §10 do prompt presentes; quatro alternativas + adiar (C e D
existem para expor o default acidental e a sobre-engenharia, com consequências
honestas nos dois sentidos); drivers discriminantes ligados a QAS; **nenhum alvo
numérico inventado** (janelas/limiares VALIDATION REQUIRED); oito linhas
transversais presentes; reversibilidade, gatilhos e kill/rollback presentes;
validação com IDs reais verificados; supersessão declarada; **nenhuma tecnologia
selecionada** (B9 traz classes com critérios e gatilho, não escolha); nenhuma
aprovação fabricada; nenhum dono nomeado. **Nota da janela concorrente:**
`adr-index.md` NÃO foi atualizado por este autor — linha de índice no handoff.
