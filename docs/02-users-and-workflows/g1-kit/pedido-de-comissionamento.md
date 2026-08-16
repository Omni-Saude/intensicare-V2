---
doc_id: USR-G1KIT-PEDIDO-COMISSIONAMENTO
title: >
  IntensiCare V2 — Pedido de comissionamento da pesquisa do Gate G1
  (texto para decisão do titular)
status: PROPOSAL
label: PROPOSAL
approver: UNASSIGNED — VALIDATION REQUIRED
approver_roles:
  - AUTH-PRODUCT (financiamento, sítio, cronograma)
  - AUTH-UX (aprovação do protocolo e aceitação futura dos achados)
  - AUTH-CLINSAFETY + AUTH-PRODUCT (rota de VAL-0005: comissionar ou aceitar o risco)
owner: UNASSIGNED — VALIDATION REQUIRED
validation_status: VALIDATION REQUIRED
last_updated: 2026-08-15
provenance:
  source_repo: intensicare-V2
  path_or_url: docs/02-users-and-workflows/g1-kit/pedido-de-comissionamento.md
  commit_sha_or_version: 0c36f03 (HEAD de cycle-1/clinical-content na redação; arquivo novo, não commitado)
  section_or_lines: documento inteiro
  date_collected: 2026-08-15
  collector: líder de pesquisa contextual de UTI (ciclo 2)
  transformation: >
    Síntese decisória dos demais artefatos do kit. Estimativas de esforço são ASSUMIDAS,
    derivadas da amostragem proposta em protocolo-pesquisa-g1.md §4, com premissas
    explicitadas em §3. Nenhum valor monetário é proposto por agente.
  confidence: low
  owner: UNASSIGNED — VALIDATION REQUIRED
  validation_status: VALIDATION REQUIRED
evidence_inputs:
  - repo: intensicare-V2
    path: docs/02-users-and-workflows/g1-validation-backlog.md
    commit: 0c36f03
    lines_used: "83 (VAL-0005 — as duas rotas), 167 (VAL-0035), 200-215 (§J, como o backlog fecha)"
  - repo: intensicare-V2
    path: docs/05-clinical-safety/pathway-portfolio/g2-validation-backlog.md
    commit: 0c36f03
    lines_used: "78-80, 144 (G2-VAL-0023), 151 (G2-VAL-0025)"
  - repo: intensicare-V2
    path: INTENSICARE_V2_ORCHESTRATOR_PROMPT.md
    commit: 0c36f03
    lines_used: "§0.6 item 2 (caminho crítico); §5 Gate G1"
---

# Pedido de comissionamento — pesquisa do Gate G1

**Para:** rodaquino-OMNI, na qualidade de `AUTH-PRODUCT`, `AUTH-UX` e `AUTH-CLINSAFETY`
(interinos, `DEC-G0-01`, `DEC-G0-05`, `GDEC-0003`).
**De:** líder de pesquisa contextual de UTI (agente especialista, ciclo 2).
**Data de redação:** 2026-08-15.
**Natureza:** PROPOSAL. Nenhum agente pode aprovar, decidir ou executar o que segue.

---

## 1. O que está sendo pedido

**Um ato de decisão, com quatro partes.** As quatro podem ser aceitas em conjunto ou
separadamente; a parte (c) é a única com prazo irreversível.

| Parte | O que se pede | Quem decide |
|---|---|---|
| **(a)** | **Aprovar o protocolo** (`protocolo-pesquisa-g1.md` e os guias) como desenho de estudo — não como resultado | `AUTH-UX` |
| **(b)** | **Comissionar a execução**: autorizar a contratação de um moderador/pesquisador externo e a aproximação a sítios candidatos | `AUTH-PRODUCT` + `AUTH-UX` |
| **(c)** | **Priorizar a cápsula de baseline perecível** (`protocolo-baselines-pereciveis.md`) à frente de qualquer demonstração, treinamento ou piloto | `AUTH-PRODUCT` |
| **(d)** | **Registrar a rota de `VAL-0005`**: comissionar observação **ou** aceitar formalmente "usuários não observados" como risco bloqueante, com razão e data | `AUTH-CLINSAFETY` + `AUTH-PRODUCT` |

**SOURCE** (`../g1-validation-backlog.md:83`, `VAL-0005`): o Gate G1 oferece exatamente duas
rotas — observação comissionada ou risco bloqueante explicitamente aceito. "Silêncio é a única
opção que o portão não permite."

### 1.1 O que **não** está sendo pedido agora

- Não se pede aprovar a declaração de uso pretendido — ao contrário: **a pesquisa existe para
  testá-la**, e aprová-la antes esvaziaria o teste.
- Não se pede decidir a fronteira pediátrica/neonatal (`VAL-0006`/`VAL-0007`).
- Não se pede escolher um sítio: pede-se autorização para **aproximar-se** de candidatos.
- Não se pede nomear pessoa alguma neste repositório. Nomeações são atos humanos registrados nos
  registros de governança, fora do escopo de escrita deste kit.
- Não se pede nenhum valor monetário definido por agente (§3.4).

---

## 2. Por que agora — e o que se perde por esperar

**SOURCE** (`INTENSICARE_V2_ORCHESTRATOR_PROMPT.md` §0.6, item 2): o G1 é o **segundo item do
caminho crítico** do programa, com a nota "baselines perecíveis G2-VAL-0025/VAL-0035
(irrecuperáveis após go-live)".

**SOURCE** (`../../05-clinical-safety/pathway-portfolio/g2-validation-backlog.md:78-80`): "Every
other item can be closed late at the cost of delay; that one can be closed **only before
deployment, or never**."

**INFERENCE — a assimetria que justifica a urgência:** todo o restante do backlog do G1 tem
custo de atraso **linear** (semanas de calendário). O baseline tem custo de atraso **binário**:
existe ou não existe para sempre. Nenhum orçamento futuro o compra de volta.

### 2.1 O que fica bloqueado sem a parte (a)+(b)

| Bloqueio | Fundamento |
|---|---|
| **Arquitetura de solução não é aprovável** | **SOURCE** (`INTENSICARE_V2_ORCHESTRATOR_PROMPT.md` §5, Gate G1): "Do not approve solution architecture until intended users have been observed or the absence is explicitly accepted as a blocking risk" |
| **36 dos 43 itens do backlog G1 permanecem sem rota de fechamento** | `protocolo-pesquisa-g1.md` §6.1: 19 cobertos + 5 parciais + 12 insumos dependem do estudo; os 7 restantes são atos humanos que a pesquisa não substitui |
| **A declaração de uso pretendido permanece não testada** | `../../01-vision-and-intended-use/intended-use-statement.md` §7, condição 3 |
| **`G2-VAL-0021` e `G2-VAL-0022` (fluxo e compreensão por candidato clínico) não fecham** | Ambos exigem M1/M2/M3 |
| **O portfólio de vias clínicas do G2 continua com 0 candidatos aprovados** | Portas duras 5 e 10 dependem de resposta humana observada e de orçamento de alertas |

### 2.2 O que fica **permanentemente** perdido sem a parte (c)

| Perda | Consequência duradoura |
|---|---|
| Baseline de carga de alarmes e alertas (**B1**) | `G2-VAL-0023` (orçamento de alertas interruptivos) torna-se indemonstrável; SM-04 nunca terá referência |
| Baseline de interrupções (**B2**) | HM-05 (disrupção de fluxo) nunca poderá ser avaliada; a V2 nunca poderá provar que não piorou o ambiente |
| Baseline de fadiga (**B3**) | HM-02 sem referência pré-intervenção |
| Tempo até reconhecimento observado (**B4a**) | SM-01 perde seu único referencial contemporâneo pré-V2 |
| **Falsificabilidade** | **INFERENCE:** sem baseline, nenhuma alegação de melhoria pode ser sustentada **nem refutada**. Um sistema inavaliável é indistinguível, na evidência, de um que funciona e de um que prejudica |

**INFERENCE — o que fecha a janela:** não é o go-live técnico, é a **primeira exposição visível
ao clínico**: uma demonstração na unidade, um treinamento, um piloto de poucos leitos
(`protocolo-baselines-pereciveis.md` §2). A decisão de demonstrar antes de medir é, na prática,
a decisão de abrir mão do baseline — e deve ser registrada nesses termos, se for tomada.

---

## 3. Custo e duração estimados — com premissas explícitas

> **Todas as quantidades abaixo são ASSUMIDAS.** São derivadas da amostragem proposta em
> `protocolo-pesquisa-g1.md` §4.2 e da duração de `protocolo-pesquisa-g1.md` §4.3. Não há
> cotação, proposta de fornecedor ou histórico de projeto por trás delas. Devem ser tratadas
> como ordem de grandeza para decisão, e substituídas por cotação real antes de contratar.

### 3.1 Premissas

| # | Premissa | Se falsa, o efeito é |
|---|---|---|
| P1 | 2 unidades, em 1 ou 2 instituições | Cada unidade adicional soma ~30 pessoa-dias |
| P2 | Um pesquisador principal em dedicação alta, com apoio de segundo observador em parte das janelas | Menos apoio → sem calibração inter-observador → B1/B2 perdem defensabilidade |
| P3 | Rota ética resolvida em 6 a 14 semanas | Se exigir dois comitês, some 4–8 semanas |
| P4 | Sítio acessível sem deslocamento aéreo recorrente | Deslocamento aéreo altera materialmente o custo não-pessoal |
| P5 | **Sem gravação de áudio ou vídeo** (proibida pelo protocolo) | Elimina custo de transcrição; aumenta o tempo de anotação em campo |
| P6 | Estímulo de M3 em baixa fidelidade (papel/tela estática), produzido pela equipe de pesquisa | Se exigir protótipo interativo, some ~10 pessoa-dias de design |
| P7 | M5 com 3 usuários reais de TA disponíveis | Se indisponíveis, `VAL-0033` fica NÃO TESTADO e o custo cai — mas o item não fecha |
| P8 | Sem custo de licença de instrumento de fadiga | Se o instrumento escolhido for licenciado, some o custo da licença |

### 3.2 Esforço estimado — estudo completo

| Perfil | Pessoa-dias (ASSUMIDO) | Fases |
|---|:--:|---|
| Pesquisador/moderador principal | ~100 | F0 (10), F1 (20), F2 (40), F3 (10), F4 (5), F5 (15) |
| Observador secundário | ~20 | Calibração + janelas de B1/B2 |
| Apoio administrativo e de submissão ética | ~10 | F0 |
| Consultor clínico de realismo dos cenários | ~4 | F3 (revisão, não aceitação) |
| Especialista em acessibilidade / apoio a M5 | ~5 | F3 |
| **Total** | **~139 pessoa-dias** | — |

**Duração de calendário estimada:** **4 a 7 meses** do comissionamento à entrega final,
dominada por P3 (rota ética) e pela disponibilidade de plantões noturnos e de fim de semana.

### 3.3 Esforço estimado — cápsula mínima de baseline (opção B do §4)

| Perfil | Pessoa-dias (ASSUMIDO) |
|---|:--:|
| Pesquisador principal (preparação 5 + campo 12 + relatório 3) | ~20 |
| Observador secundário (calibração) | ~3 |
| Apoio de submissão ética | ~5 |
| **Total** | **~28 pessoa-dias** |

**Duração de calendário:** **3 a 6 semanas após a autorização ética**, sendo a autorização o
único item fora do controle do programa. Escopo: 1 unidade, componentes B1, B2, B4a (e B3 se
houver instrumento aceito), 12 horas de observação contada.

### 3.4 Custo monetário — fórmula, não cifra

```
Custo total = Σ_perfil (pessoa-dias × diária do perfil)
            + deslocamento e hospedagem
            + compensação de participantes (nº de sessões fora de escala × valor uniforme)
            + materiais impressos e insumos de campo
            + eventual licença de instrumento (P8)
```

**Nenhum valor é proposto por agente.** As diárias por perfil e o valor uniforme de
compensação são decisões de `AUTH-PRODUCT` (`plano-de-recrutamento-e-etica.md` §10).
**INFERENCE:** publicar aqui uma cifra inventada daria a uma estimativa sem base a aparência de
orçamento — o padrão de falha que o programa registra no sistema legado ("targets, not
demonstrated service levels").

### 3.5 Custo de não fazer

| Item | Custo |
|---|---|
| Baselines perecíveis | **Irrecuperável.** Não tem preço porque não tem mercado |
| Retrabalho de arquitetura desenhada sobre fluxo hipotético | Não estimado; historicamente a maior fonte de retrabalho em software clínico |
| Risco de repetir o padrão do sistema legado | **SOURCE** (`../user-research-plan.md` §1): o legado chegou a protótipo avançado com "no stakeholder interviews or observed ICU workflow studies performed" |

---

## 4. As opções de decisão

| Opção | Conteúdo | Consequência imediata |
|---|---|---|
| **A — Comissionar o estudo completo** | Aprova (a), (b), (c) e registra (d) como "observação comissionada" | Rota do G1 aberta; baseline preservado; ~139 pessoa-dias |
| **B — Cápsula primeiro** | Aprova (a) e (c); comissiona apenas a cápsula de baseline agora; decide (b) depois | **Preserva o irrecuperável** ao menor custo; o G1 permanece aberto quanto aos demais 35 itens |
| **C — Aceitar o risco** | Registra (d) como "ausência de observação aceita como risco bloqueante", com razão e data, no `risk-register` | Permitido pelo portão; **o baseline é perdido de todo modo**; toda alegação futura de eficácia fica sem referência |
| **D — Revisar antes de decidir** | Devolve o protocolo com pontos a alterar | Nenhum custo; **a janela do baseline continua correndo** |

**PROPOSAL do especialista — e apenas isso: uma proposta.** A opção **B** domina C e D quanto ao
item perecível, a um custo de ordem de grandeza inferior ao do estudo completo, e mantém aberta
a escolha entre A e C para o restante. **INFERENCE:** B é a única opção que não consome uma
decisão irreversível enquanto as demais decisões amadurecem.

**Ressalva de honestidade:** mesmo a opção B depende do item aberto que este kit **não** pode
resolver — a cobertura jurídica/ética da pesquisa com participantes humanos
(`plano-de-recrutamento-e-etica.md` §11, itens 1 e 2). Comissionar sem resolvê-lo não acelera
nada: apenas antecipa a contratação para depois esperar mesmo assim.

---

## 5. Dependências que o titular pode destravar imediatamente, sem custo

| # | Ação | Efeito |
|---|---|---|
| 1 | Estender explicitamente o escopo do parecer jurídico já previsto em `DEC-G0-03` (OS-16) para cobrir **pesquisa com participantes humanos**, e não apenas dado assistencial real | Remove o bloqueio nº 1 de `plano-…` §11 — hoje o maior do caminho crítico |
| 2 | Determinar que nenhuma demonstração, treinamento ou piloto ocorra em unidade candidata a baseline até a conclusão da cápsula | Preserva a janela perecível a custo zero |
| 3 | Autorizar a **aproximação** (não a contratação) a sítios candidatos | Permite iniciar §2.3 do plano de recrutamento em paralelo à decisão orçamentária |
| 4 | Declarar que não moderará nem participará, e que aceitará os achados como `AUTH-UX` | Fixa a independência exigida por `DEC-G0-05` antes do campo, não depois |
| 5 | Pré-registrar `VAL-0036` (definição de deterioração e rubrica de adjudicação) | Preserva a possibilidade futura de **B4b**, que morre de credibilidade se pré-registrada depois dos resultados |

**INFERENCE:** as cinco ações são de decisão, não de execução, e nenhuma depende de orçamento.
As ações 2 e 5 são as de maior retorno por unidade de esforço em todo o kit.

---

## 6. Bloco de resposta — preenchido por decisão do humano nomeado

> **Nenhum agente pode preencher, sugerir preenchimento ou registrar como preenchido qualquer
> campo abaixo** por iniciativa própria. — **Nota de proveniência (2026-08-15):** o bloco abaixo
> foi preenchido pelo escriba por **transcrição de instrução escrita, item a item, do titular
> nomeado** em sessão de 2026-08-15 (mesmo padrão de GDEC-0007/GDEC-0008: decisão humana,
> transcrição de agente), à luz de GDEC-0008 item 3 e GDEC-0009 (ata
> `../../00-governance/registers/agentificacao-g1-g2-2026-08-15.md`, AGT-1/AGT-2). O registro
> mestre permanece o decision-register.

```text
DECISÃO SOBRE O PEDIDO DE COMISSIONAMENTO DA PESQUISA G1

Decidido por (nome):        rodaquino-OMNI (titular nomeado)
Papéis exercidos:           AUTH-PRODUCT, AUTH-UX, AUTH-CLINSAFETY —
                            interinos (GDEC-0004; revisor clínico GDEC-0003)
Data (AAAA-MM-DD):          2026-08-15

(a) Aprovar o protocolo como desenho:        [x] sim  [ ] sim com alterações  [ ] não
    (GDEC-0008 item 3)
(b) Comissionar a execução:                  [x] sim  [ ] parcial  [ ] não
    (no escopo agentificado — GDEC-0009: dossiê substituto multi-fonte +
    baseline retrospectivo; campo = variante observacional opcional,
    pré-piloto)
(c) Priorizar a cápsula de baseline:         [x] sim  [ ] não
    (via retrospectiva — AGT-2: corte histórico fixado ANTES de qualquer
    exposição visível a clínicos)
(d) Rota de VAL-0005:                        [ ] observação comissionada
                                             [x] risco bloqueante aceito
    (AGT-1; RISK-0013)

Opção escolhida:            [ ] A   [ ] B   [ ] C   [ ] D
    (nenhuma das quatro na forma original: rota GDEC-0009 — equivalente a
    C para a observação direta, com substituto multi-fonte + baseline
    retrospectivo comissionados; A/B permanecem disponíveis como variante
    observacional opcional pré-piloto)

Razão (obrigatória, em detalhe suficiente para que um revisor futuro
avalie se ela ainda se sustenta):
Decisão ditada por escrito pelo titular nesta sessão: comissionamento
mantido integralmente no escopo agentificado de GDEC-0009 — o dossiê
substituto multi-fonte (AGT-1) e o baseline retrospectivo com corte
histórico pré-exposição (AGT-2) satisfazem a evidência do G1; o campo
observacional permanece opcional, pré-piloto, gateado em ética
(BLK-0013). A ausência de observação direta é aceita como risco
bloqueante formal (RISK-0013), exatamente a válvula prevista pelo texto
do Gate G1.

Regra de supersessão (o que obrigaria a revisitar esta decisão):
Gatilhos nomeados na ata GDEC-0009: primeiro parecer jurídico (OS-16),
primeiro evento adverso em sombra/piloto, ou entrada de segundo revisor
clínico humano; adicionalmente, o comissionamento da variante
observacional antes do piloto reabre os itens (c)/(d).

Se (d) = risco aceito, reconhecimento expresso:
[x] Reconheço que os baselines VAL-0035 / G2-VAL-0025 serão
    permanentemente perdidos a partir da primeira exposição visível
    a clínicos, e que nenhuma alegação futura de melhoria ou de
    não-piora poderá ser sustentada nem refutada.
    (Mitigação parcial por AGT-2: o baseline retrospectivo com corte
    pré-exposição preserva as dimensões derivadas de dados; os
    componentes observacionais — interrupções, fadiga — permanecem
    perdíveis; vieses declarados em RISK-0013.)

Alterações exigidas ao protocolo (se houver):
Nenhuma. O kit passa a valer como especificação da variante
observacional opcional (GDEC-0009/AGT-1).

Registro: decisão registrada em
docs/00-governance/registers/decision-register.md (GDEC-0008 item 3;
GDEC-0009) e risk-register.md (RISK-0013 — rota de risco aceito).
```

---

## 7. Referências cruzadas

- `protocolo-pesquisa-g1.md` — o desenho que se pede aprovar; §6 mapeia os 43 itens.
- `guias-de-observacao-e-entrevista.md` — os instrumentos prontos para uso.
- `protocolo-baselines-pereciveis.md` — a parte com prazo irreversível.
- `plano-de-recrutamento-e-etica.md` — §11, a lista do que precisa estar fechado antes do campo.
- `../g1-validation-backlog.md` — `VAL-0005` (as duas rotas), `VAL-0035`, §J.
- `../../05-clinical-safety/pathway-portfolio/g2-validation-backlog.md` — `G2-VAL-0023`, `G2-VAL-0025`.
- `../../00-governance/registers/decision-register.md`, `../../00-governance/registers/risk-register.md` — onde a decisão é registrada (fora do escopo de escrita deste kit).
