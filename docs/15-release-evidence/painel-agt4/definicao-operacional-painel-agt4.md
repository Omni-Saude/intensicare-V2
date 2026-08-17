---
doc_id: REL-PAINEL-AGT4-DEF
title: Definição operacional do painel adversarial AGT-4 (Gates G1/G2)
version: 0.1.1-draft
status: PROPOSAL
owner: UNASSIGNED — VALIDATION REQUIRED
responde_a_trilha: >
  docs/15-release-evidence/painel-agt4/trilha/2026-08-15-definicao-operacional-painel-agt4-0.1.0-draft.md
  (execução 1 do painel; resultado MORRE, 3/4; commit 11d33bb) — esta versão
  0.1.1-draft incorpora as 3 refutações fatais e os endurecimentos não-fatais
  ali devolvidos ao autor.
source: >
  docs/00-governance/evidence-notation.md (íntegra);
  docs/00-governance/registers/agentificacao-g1-g2-2026-08-15.md (ata AGT-1..AGT-4, fonte normativa, íntegra, incluindo blocos apensos);
  INTENSICARE_V2_ORCHESTRATOR_PROMPT.md §0.5 (roteamento de modelos), banner [AGENTIFICADO] do Gate G2 e parágrafo do Gate G2 (seção 6, após §6.4), §3 regras 10 e 15 emendadas, item de §20 sobre self-approval emendado;
  docs/14-devsecops-and-delivery/mapa-de-projeto-ate-producao.md linhas 323-367 (fase G2; sprint SPR-G2-1);
  docs/00-governance/registers/decision-register.md entradas GDEC-0010 e GDEC-0011;
  docs/00-governance/registers/risk-register.md entradas RISK-0012 e RISK-0013;
  docs/15-release-evidence/painel-agt4/trilha/2026-08-15-definicao-operacional-painel-agt4-0.1.0-draft.md (refutações consolidadas da execução 1)
date_collected: 2026-08-15
last_updated: 2026-08-15
collector: agente autor (painel AGT-4, sprint SPR-G2-1)
provenance:
  source_repo: intensicare-V2
  path_or_url: ver campo source acima (múltiplos artefatos, todos relativos à raiz do repositório)
  commit_sha_or_version: 11d33bb (trilha da execução 1, lida na íntegra); demais fontes lidas em 01479a905573549f2f7aea7e322af5e6960828ae (branch cycle-5/execucao-agentificada)
  section_or_lines: seções citadas inline, por rótulo, em cada afirmação material
  date_collected: 2026-08-15
  collector: agente autor (painel AGT-4, sprint SPR-G2-1)
  transformation: transcrição e operacionalização de decisões já tomadas (GDEC-0009), com fato (SOURCE) e operacionalização (PROPOSAL/INFERENCE) rotulados inline; nenhuma decisão nova
  confidence: high
  owner: UNASSIGNED — VALIDATION REQUIRED
  validation_status: "VALIDATION REQUIRED — este documento é PROPOSAL; condições de aprovação e vigência em §1.3"
---

# Definição operacional do painel adversarial AGT-4 — versão 0.1.1-draft

PROPOSAL. Este documento **operacionaliza** decisões já tomadas pelo titular
(GDEC-0009, ata `agentificacao-g1-g2-2026-08-15.md`, decisões AGT-3 e AGT-4)
e **não as amplia**: nenhuma afirmação aqui cria regra de promoção além das 7
condições da ata, altera hard gates §6.2, fecha ou abre bloqueador/risco/gate,
nomeia dono humano ou aplica o rótulo DECIDED. Rótulos epistêmicos conforme
`docs/00-governance/evidence-notation.md`; nesta versão, todo enunciado
distingue inline o **fato** (SOURCE/OBSERVADO) da **operacionalização**
(PROPOSAL/INFERENCE), conforme exigido pela refutação fatal 1 da execução 1.
Todo o conteúdo em pt-BR.

Nota sobre o `doc_id`: `REL-PAINEL-AGT4-DEF` é identificador de documento no
estilo já vigente em `docs/15-release-evidence/` (ex.:
`CYCLE-0-FIRST-CYCLE-REPORT`), **não** um novo prefixo da taxonomia de IDs
rastreáveis de `traceability-policy.md` — nenhum prefixo novo é cunhado aqui.

## Histórico de versões

| Versão | Data | O que mudou |
|---|---|---|
| 0.1.0-draft | 2026-08-15 | Primeira redação (autor, SPR-G2-1). Julgada pelo painel na execução 1: **MORRE** (3/4 — revisor, correção-fontes e reprodutibilidade REFUTAM; fail-closed NÃO REFUTA). Trilha: `trilha/2026-08-15-definicao-operacional-painel-agt4-0.1.0-draft.md` (commit `11d33bb`). |
| 0.1.1-draft | 2026-08-15 | Responde à execução 1: (F1) fato × operacionalização rotulados inline em §2.1, §2.3, §3, §6.4; regra categórica de suspensão durante revisita removida; (F2) convenção canônica do `artefato_hash` + pinagem por commit obrigatória (§4.2); (F3) identificador por membro e registro de tentativas de refutação por votante no esquema da trilha (§4.2); todos os endurecimentos não-fatais incorporados (§§1.3, 2.2, 2.3, 3, 4.1, 4.2, 4.3, 5.2, 7, 8.3; citações corrigidas). |

## 1. Objeto e base normativa

### 1.1 Objeto

INFERENCE (a partir das SOURCE de §1.2): definir, de forma executável por
agentes, o mecanismo de independência estrutural **autor ≠ revisor ≠ ≥3
verificadores adversariais** (painel N-de-M) exigido pela decisão AGT-4 e
pela condição 2 da decisão AGT-3, incluindo:

- a composição e as lentes obrigatórias do painel por artefato (§2);
- o roteamento de modelos por membro (§3);
- o esquema da **trilha imutável** (append-only) por artefato/versão (§4);
- o **formato de pré-registro** dos limiares de sombra (§5) — sem fixar
  nenhum limiar agora;
- as condições de exercibilidade que este mecanismo NÃO altera (§6);
- os limites de autoridade de qualquer membro do painel (§7);
- o que este mecanismo não cria (§8).

**Escopo: Gates G1 e G2 somente.** SOURCE (ata, "Honestidade obrigatória",
item 4): "G3, G5, G6, G7 e G8 permanecem com seus donos e critérios atuais —
esta ata trata apenas de G1 e G2." Este documento herda exatamente esse
escopo.

### 1.2 Base normativa (SOURCE)

| Norma | Onde | O que estabelece |
|---|---|---|
| GDEC-0009 / ata AGT-1..AGT-4 | `docs/00-governance/registers/agentificacao-g1-g2-2026-08-15.md` | Fonte normativa vinculante: AGT-3 (autorização permanente sob 7 condições cumulativas) e AGT-4 (painel adversarial N-de-M). Contra-assinada pelo titular (bloco apenso, GDEC-0011 item 1). |
| Banner [AGENTIFICADO] do Gate G2 | `INTENSICARE_V2_ORCHESTRATOR_PROMPT.md`, seção 6, após §6.4 (linhas ~538-554) | O "qualified human committee" — exigido pelo **parágrafo do Gate G2** (seção 6, após o §6.4, linha ~556) — fica substituído, neste escopo, por autorização permanente do titular exercida via painel adversarial N-de-M, sob as condições 1-7 da ata. |
| §3 regra 10 (emendada 2026-08-15) | idem, linha ~286 | "Rule authors may not approve their own clinical content" — transposta para agentes: agente autor ≠ agente revisor ≠ painel adversarial ≥3 lentes; permanece plenamente vigente. |
| §3 regra 15 (emendada 2026-08-15) | idem, linha ~291 | Accountability humana concentra-se no ato da autorização permanente do titular; a decisão clínica à beira do leito permanece humana. |
| §20, item self-approval (emendado 2026-08-15) | idem, linha ~1267 | Entre agentes, "self-approval" = mesmo agente/contexto como autor e aprovador — vedado; a autorização permanente do titular não constitui autoaprovação de agente quando o painel N-de-M é distinto do autor. |
| §0.5 roteamento de modelos | idem, linhas ~135-152 | Verificação adversarial e análise clínica/segurança = tier máximo; tier econômico "nunca para conteúdo clínico". |
| Sprint SPR-G2-1 | `docs/14-devsecops-and-delivery/mapa-de-projeto-ate-producao.md` linhas ~351-353 | Entregável: "Definição operacional do painel + trilha em release-evidence"; DoD inclui trilha imutável gravada e tier econômico excluído de conteúdo clínico. |

### 1.3 Status, aprovação e vigência deste documento

PROPOSAL — duas condições distintas, em dois estágios (resolvendo a tensão
apontada na execução 1 entre a antiga §1.3 e a antiga §8.3):

1. **Condição necessária — aprovação pelo painel:** este documento é o
   **artefato-piloto** do mecanismo que define; um resultado **VIVE** do
   painel de §2 sobre esta versão, com trilha gravada conforme §4 pelo
   orquestrador, é condição necessária para qualquer uso operacional. (A
   execução 1 julgou a 0.1.0-draft: MORRE; esta 0.1.1-draft retorna ao
   painel como nova versão.)
2. **Condição de vigência — ratificação humana:** mesmo com VIVE, o
   documento permanece PROPOSAL e só entra em **vigência** quando a
   autoridade humana nomeada o ratificar nos registros. SOURCE
   (evidence-notation §2): a tabela (linha DECIDED — "no agent may
   self-apply this label") e a regra de uso 4 vedam a qualquer agente
   aplicar/promover a DECIDED; a regra de uso 3 estabelece que PROPOSAL
   nunca autoexecuta.

Nota sobre o `owner` do front matter: o campo mantém o formato verbatim
`UNASSIGNED — VALIDATION REQUIRED` exigido pela evidence-notation (§2, regra
de uso 7; §3). A expectativa de fluxo de aprovação — painel AGT-4 como
condição necessária, registrada na trilha pelo orquestrador — fica anotada
**aqui**, não no campo `owner`, que não admite anotações.

## 2. Composição do painel por artefato

### 2.1 Papéis

SOURCE (ata AGT-4): para cada artefato clínico ou de gate, **autor**,
**revisor** e **≥3 verificadores adversariais** são "agentes distintos, com
contextos separados e lentes obrigatoriamente diferentes". INFERENCE
(aritmética da ata): mínimo de **5 agentes distintos** por painel. Aplica-se
a dossiê G1, análise MCDA, avaliação de hard-gates, vetores CRV, pacote de
release §6.4, promoção de via — e a este próprio documento.

1. **Autor** (1) — produz o artefato. Não emite veredito e não aprova nada
   (INFERENCE em §2.3; §7).
2. **Revisor** (1) — agente distinto do autor, contexto separado; revisa o
   artefato por inteiro e emite veredito.
3. **Verificadores adversariais** (≥3) — agentes distintos entre si, do
   autor e do revisor, cada um com contexto separado e **lente designada
   diferente**; cada um emite veredito.

PROPOSAL (operacionalização de "distintos" e "contextos separados" — a ata
usa os termos sem os definir): nenhum membro compartilha a janela de
contexto, o histórico de sessão ou o rascunho de outro membro; cada
verificador recebe o artefato acabado e suas fontes primárias, **não** o
raciocínio do autor nem os vereditos dos demais (para não ancorar).

### 2.2 Lentes mínimas obrigatórias

SOURCE (ata AGT-4; mapa SPR-G2-1): as lentes mínimas são "correção clínica
contra fonte primária; segurança/fail-closed; reprodutibilidade de
vetores/dados". PROPOSAL (operacionalização do conteúdo de cada lente): cada
uma designada a um verificador diferente, com o seguinte alcance:

- **(a) Correção clínica contra fonte primária** — o conteúdo clínico é
  conferido contra a diretriz/artigo/fonte citada, não contra memória do
  modelo nem contra outro artefato derivado.
- **(b) Segurança / fail-closed** — comportamento sob entrada ausente,
  inválida, obsoleta ou contraditória; o artefato falha fechado? Enfraquece
  algum dos 11 hard gates §6.2 (vedado — condição 1 da AGT-3; anti-padrão 10)?
- **(c) Reprodutibilidade de vetores/dados** — vetores, contagens, hashes e
  derivações são reexecutáveis/reconferíveis a partir das fontes declaradas;
  proveniência completa por evidence-notation §3.

**Lentes adicionais** são obrigatórias quando o artefato exigir (PROPOSAL,
operacionalização do "lentes obrigatoriamente diferentes" da ata): por
exemplo, privacidade/LGPD para artefatos que tocam dado de paciente;
interoperabilidade AMH para artefatos do contrato v1; fadiga de alarme/UX
para artefatos de alarmística (interage com RISK-0013). Lentes adicionais
acrescentam verificadores (elevando M); nunca substituem as três mínimas.

PROPOSAL (endurecimento, execução 1): painel constituído **sem** as três
lentes mínimas designadas — ou cuja execução termine sem veredito válido de
cada uma delas — resulta em **FAIL-CLOSED** ("MORRE — sem quórum", §2.3);
lente ausente jamais é "dispensada" por agente.

### 2.3 Instrução adversarial e regra de decisão

**Fatos (SOURCE, ata AGT-4):** cada membro julgador recebe "instrução
explícita de REFUTAR"; "**maioria refuta = artefato morre** e volta ao
autor".

**Quem vota (INFERENCE — cadeia citada):** a ata não enumera os votantes.
De (i) ata AGT-4 — papéis distintos autor/revisor/≥3 verificadores; (ii) §3
regra 10 emendada — autor não aprova o próprio conteúdo clínico, regra
transposta a agentes e "plenamente vigente"; e (iii) §20 emendado — entre
agentes, self-approval (mesmo agente autor e aprovador) é vedado — infere-se:
o **autor jamais vota**; **votantes = revisor + verificadores adversariais**;
a "maioria" da ata é a maioria simples dos vereditos válidos dos votantes.

**Operacionalizações (PROPOSAL — não constam da ata; motivadas pelo pacote
de tarefa SPR-G2-1 e pela postura fail-closed do prompt; conservadoras em
direção, conforme reconhecido na própria refutação da execução 1):**

- **Empate = FAIL-CLOSED**: o artefato NÃO passa (equivale a MORRE para
  efeito de progressão; a trilha registra `"MORRE — empate"`).
- **Ausência de quórum = FAIL-CLOSED**: sem, no mínimo, 1 revisor e os 3
  verificadores das lentes mínimas com vereditos válidos registrados, o
  artefato NÃO passa (`"MORRE — sem quórum"`). Não existe passagem por
  omissão, timeout ou "aprovação tácita".
- **Veredito válido** exige tentativa documentada de refutação: veredito
  `NAO_REFUTA` sem tentativa documentada (campo `tentativas_refutacao` ou
  `handoff_ref` na trilha, §4.2) é não-conformante e conta como **ausência
  de veredito** (recai na regra de quórum).
- **Quórum completo** (endurecimento, execução 1): resultado **VIVE** exige
  veredito válido de **100% dos membros designados** — incluindo os
  verificadores de lentes adicionais quando designados (§2.2) — zero empate
  e maioria de vereditos `NAO_REFUTA`, tudo gravado na trilha (§4). Quórum
  mínimo permite apenas concluir FAIL-CLOSED ou MORRE; nunca VIVE parcial.
- Artefato morto só retorna ao painel em **nova versão**, com nova entrada
  de trilha (§4), acompanhada das refutações que motivaram o MORRE.

INFERENCE (de RISK-0012): a regra de decisão acima mitiga defeito individual
de agente, mas **não** o modo de falha residual de defeito compartilhado
(mesmo ponto cego de treinamento atravessando todos os membros). A mitigação
disponível é diversidade real de lentes (§2.2) e a sombra medida (condição 5)
— nunca apenas redundância de agentes.

## 3. Roteamento de modelos

1. SOURCE (prompt §0.5): "análise clínica/segurança/compatibilidade
   profunda; verificação adversarial; ADRs; adjudicações" = **tier máximo de
   raciocínio** (classe Opus). INFERENCE: isso cobre autor, revisor e todos
   os verificadores de qualquer artefato clínico ou de gate no escopo deste
   painel.
2. SOURCE (prompt §0.5; DoD do SPR-G2-1): **tier econômico (classe Haiku)
   JAMAIS participa de conteúdo clínico** — em nenhum papel, nem "só para
   formatar": se o texto é clínico ou decide gate, o tier econômico não o
   toca.
3. SOURCE (ata AGT-4): "os modelos usados integram a trilha imutável do
   artefato" — o modelo/tier de cada membro é registrado na trilha (§4,
   campo obrigatório). PROPOSAL (consequências operacionais — não constam da
   ata): (a) entrada de trilha **sem modelo declarado** por membro é
   não-conformante e o resultado é **FAIL-CLOSED** até correção por nova
   entrada (§4.3); (b) **tier proibido declarado** — tier econômico em
   qualquer papel de conteúdo clínico — torna o veredito desse membro
   inválido e o resultado da execução **FAIL-CLOSED**, espelhando a vedação
   do item 2.
4. PROPOSAL (operacionalização): quando houver diversidade de modelos
   disponível no runtime, distribuí-la entre verificadores é preferível
   (mitiga parcialmente o defeito compartilhado de RISK-0012); a ausência de
   diversidade não bloqueia o painel, mas deve ficar visível na trilha.

## 4. Esquema da trilha imutável (append-only)

### 4.1 Localização e nome (PROPOSAL, conforme pacote SPR-G2-1)

```text
docs/15-release-evidence/painel-agt4/trilha/<data>-<slug-do-artefato>-<versao>.md
```

- `<data>`: ISO `YYYY-MM-DD` da sessão do painel.
- `<slug-do-artefato>`: derivação determinística — **basename do arquivo do
  artefato julgado, sem a extensão** (ex.: o artefato
  `docs/15-release-evidence/painel-agt4/definicao-operacional-painel-agt4.md`
  tem slug `definicao-operacional-painel-agt4`). Nenhum slug é inventado.
- `<versao>`: a versão do artefato julgada (ex.: `0.1.0-draft`).

Um arquivo de trilha por execução de painel. **Reexecução sobre a mesma
versão** recebe sufixo sequencial `-rN` (N ≥ 2) imediatamente **após a
versão e antes de `.md`** (ex.:
`2026-08-15-definicao-operacional-painel-agt4-0.1.0-draft-r2.md`), nunca
edição do arquivo existente. PROPOSAL — **lista fechada de causas que
admitem reexecução da mesma versão** (endurecimento, execução 1):

- (a) execução anterior FAIL-CLOSED por **ausência de quórum** (§2.3);
- (b) execução anterior FAIL-CLOSED por **veredito inválido** (sem tentativa
  documentada, sem modelo declarado, ou tier proibido — §2.3, §3.3);
- (c) **defeito de registro** da própria entrada, sanado pela via de
  correção de §4.3 (nova entrada com `corrige_entrada_anterior`).

**MORRE por maioria ou por empate NÃO admite reexecução** da mesma versão:
exige nova versão do artefato, que volta ao autor.

### 4.2 Campos mínimos por entrada

PROPOSAL (esquema; satisfaz a condição 2 da AGT-3 — "provada em trilha
imutável" — e a AGT-4 — "composição, vereditos e modelos integram a
trilha" — com os campos de verificabilidade exigidos pela execução 1).

**Convenção canônica do hash (refutação fatal 2):** `artefato_hash` =
**sha256 dos bytes do arquivo inteiro, tal como armazenado no repositório**
(equivalente a `shasum -a 256 <arquivo>`), no estado exato julgado pelo
painel. Nenhuma outra convenção (hash de trecho, hash normalizado, hash de
corpo sem front matter) é válida. **Pinagem por commit é OBRIGATÓRIA**: o
campo `commit_artefato` registra o SHA do commit cujo conteúdo do arquivo
corresponde exatamente aos bytes hasheados; quando o julgamento ocorre sobre
working tree pré-commit, a entrada só se completa quando esse commit existir
(artefato commitado junto da entrada) e o campo o registrar — campo vazio ou
"e/ou" invalida a entrada.

```yaml
---
trilha_de: "docs/<caminho do artefato julgado, relativo à raiz>"
artefato_versao: "<versão julgada, ex. 0.1.0-draft>"
artefato_hash: "sha256:<64 caracteres hex — convenção canônica acima>"
commit_artefato: "<SHA do commit que contém exatamente os bytes hasheados — OBRIGATÓRIO>"
data_sessao: "<YYYY-MM-DD>"
sessao: "<identificador da sessão de orquestração — OBRIGATÓRIO>"
painel:
  - papel: "autor"                    # não vota (INFERENCE §2.3)
    id_membro: "<identificador único do membro: agente/sessão/pacote de tarefa — OBRIGATÓRIO>"
    especialidade: "<especialidade do pacote de tarefa>"
    modelo_tier: "<modelo e tier, ex. classe Opus — tier máximo>"
  - papel: "revisor"
    id_membro: "<...>"
    especialidade: "<...>"
    modelo_tier: "<...>"
    veredito: "REFUTA | NAO_REFUTA"
    justificativa: "<1-3 frases; se REFUTA, o defeito concreto>"
    tentativas_refutacao: "<resumo das tentativas documentadas de refutação>"
    handoff_ref: "<caminho/âncora do handoff integral — obrigatório se o resumo acima for condensado>"
  - papel: "verificador-adversarial"
    lente: "correcao-clinica-fonte-primaria"
    id_membro: "<...>"
    modelo_tier: "<...>"
    veredito: "REFUTA | NAO_REFUTA"
    justificativa: "<...>"
    tentativas_refutacao: "<...>"
    handoff_ref: "<...>"
  - papel: "verificador-adversarial"
    lente: "seguranca-fail-closed"
    id_membro: "<...>"
    modelo_tier: "<...>"
    veredito: "REFUTA | NAO_REFUTA"
    justificativa: "<...>"
    tentativas_refutacao: "<...>"
    handoff_ref: "<...>"
  - papel: "verificador-adversarial"
    lente: "reprodutibilidade-vetores-dados"
    id_membro: "<...>"
    modelo_tier: "<...>"
    veredito: "REFUTA | NAO_REFUTA"
    justificativa: "<...>"
    tentativas_refutacao: "<...>"
    handoff_ref: "<...>"
  # + lentes adicionais quando exigidas (§2.2) — contam para o quórum completo
resultado: "VIVE | MORRE"
motivo_resultado: "maioria | empate (fail-closed) | sem quorum ou veredito invalido (fail-closed)"
corrige_entrada_anterior: "null | <caminho da entrada de trilha corrigida>"
registrado_por: "orquestrador (escriba da trilha; não vota)"
---
```

Notas do esquema (PROPOSAL, execução 1):

- **Verificabilidade por sessão futura** (refutação fatal 3): `id_membro`
  identifica cada agente de forma única (sessão/pacote de tarefa);
  `tentativas_refutacao` (ou `handoff_ref` para o handoff integral) registra
  o que cada votante efetivamente tentou refutar. Sem esses campos, a
  condição 2 da AGT-3 ("independência provada em trilha") não é verificável
  a posteriori por quem não participou da sessão. Pelo menos um dos dois
  campos deve estar substantivamente preenchido por votante; caso contrário
  o veredito é inválido (§2.3).
- **Front matter do arquivo de trilha**: o bloco acima é o **payload** da
  entrada e vai no **corpo** do arquivo (bloco YAML cercado ou bloco `---`
  do corpo); o arquivo de trilha carrega, no topo, o front matter de
  governança exigido por `check_doc_conventions.py` (doc_id, status, owner,
  source, datas, collector), como na entrada da execução 1.
- **Escalares citados**: valores string do payload entre aspas, como no
  exemplo — evita reinterpretação de tipos por parsers YAML.

### 4.3 Regra de imutabilidade (PROPOSAL, vinculada à condição 7 da AGT-3)

1. Entradas de trilha **nunca são editadas** após commit — nem para corrigir
   erro de digitação.
2. **Correção = nova entrada** que preenche `corrige_entrada_anterior` com o
   caminho da entrada corrigida e explica a correção; a entrada original
   permanece intacta no histórico.
3. A trilha é **append-only** também no nível do diretório: nenhum arquivo
   sob `trilha/` é removido ou renomeado.
4. **Conferência obrigatória no consumo** (endurecimento, execução 1):
   qualquer sessão que consuma um resultado **VIVE** recomputa o sha256 pela
   convenção canônica (§4.2) sobre os bytes do artefato em `commit_artefato`
   e confere contra `artefato_hash`; divergência ⇒ o VIVE **não se aplica**
   àquele conteúdo, que é tratado como não julgado (FAIL-CLOSED).
5. INFERENCE: o histórico git do repositório é o substrato de imutabilidade
   disponível hoje; qualquer mecanismo mais forte (ex.: assinatura,
   ancoragem externa) é decisão futura fora do escopo deste documento.
6. Para **promoções** de via (quando exercíveis — §6), a condição 7 da ata
   exige registro imutável de "versão, evidência, painel, data" — o esquema
   de §4.2 cobre esses campos; o registro de promoção referencia
   adicionalmente o pacote de release §6.4 da via.

## 5. Formato de pré-registro de limiares de sombra

**NENHUM limiar é fixado neste documento.** Este §5 define apenas o
**formato** que o SPR-G2-4 usará, por via/versão, ANTES do início de qualquer
período de sombra (SOURCE: ata AGT-3, condição 5; mapa SPR-G2-1/SPR-G2-4).

### 5.1 Métricas obrigatórias (SOURCE: ata AGT-3, condição 5)

Cada pré-registro cobre, no mínimo, as três métricas nomeadas na ata:

1. **Taxa de falso-positivo**;
2. **Carga de alertas por paciente-dia**;
3. **No-fire explicado** (casos em que a via não dispara, com explicação
   válida emitida).

### 5.2 Esquema por via/versão (PROPOSAL)

```yaml
---
pre_registro_de: "<id da via + versão do pacote de release>"
data_pre_registro: "<YYYY-MM-DD — obrigatoriamente ANTERIOR ao início da sombra>"
registrado_antes_da_sombra: true   # false = pré-registro inválido, sombra não inicia
limiares:
  - metrica: "taxa-falso-positivo"
    valor: "<limiar numérico com unidade e definição operacional do numerador/denominador>"
    janela_medicao: "<janela e granularidade, ex. janela móvel de N dias, avaliada diariamente>"
    fonte: "<de onde sai o número — sistema, consulta, baseline que o justifica>"
  - metrica: "carga-alertas-paciente-dia"
    valor: "<...>"
    janela_medicao: "<...>"
    fonte: "<...>"
  - metrica: "no-fire-explicado"
    valor: "<...>"
    janela_medicao: "<...>"
    fonte: "<...>"
  # + métricas adicionais que o pacote de release da via exigir
acao_em_violacao_em_producao: "reversao automatica da via para modo sombra (ata AGT-3, condicao 6)"
---
```

Nota de forma (PROPOSAL): como em §4.2, o bloco acima é payload — gravado no
**corpo** de uma entrada de trilha (§4), com escalares citados; o arquivo
carrega front matter de governança próprio.

Regras de uso (transcrevendo as condições 5-6 da ata; a mecânica de registro
é PROPOSAL):

- O pré-registro é gravado na trilha (§4) **antes** do primeiro dia de
  sombra; limiar registrado depois de iniciada a sombra é inválido e a
  promoção com base nele é vedada.
- SOURCE (condição 5): promoção automática sombra→acionável **só** com
  métricas dentro dos limiares pré-registrados — e ainda assim somente se
  TODAS as demais condições de §6 estiverem satisfeitas.
- SOURCE (condição 6): **violação de qualquer limiar em produção = reversão
  automática da via para sombra**; PROPOSAL: a reversão gera entrada de
  trilha própria.
- PROPOSAL: limiares não são editáveis por agente após o pré-registro;
  recalibração = novo pré-registro para nova versão da via, com nova sombra.

INFERENCE (de AGT-2 e RISK-0013): os valores futuros desses limiares
dependerão de baselines retrospectivos derivados de dados (AGT-2), que por
sua vez dependem do parecer OS-16 e de DEC-G0-03 — mais uma razão pela qual
nenhum valor pode ser honestamente fixado hoje.

## 6. Condições de exercibilidade — e o que este documento NÃO autoriza

### 6.1 As 7 condições cumulativas da AGT-3 (SOURCE: ata, transcrição)

A autorização permanente para agentes executarem integralmente o Gate G2 e
promoverem vias a modo acionável existe **sob as condições cumulativas
abaixo, que a ata torna vinculantes** (transcritas; numeração da ata):

1. **Hard gates §6.2 INALTERADOS** — nenhum dos 11 critérios pode ser
   enfraquecido para viabilizar admissão (anti-padrão 10); a contagem
   continua saindo do gate, não de meta;
2. **Independência estrutural entre agentes (AGT-4)** satisfeita e provada
   em trilha imutável por via/versão;
3. **G3 aprovado para os insumos daquela via** — dados reais elegíveis,
   populados e medidos (camadas 2/3/4); sem G3, nada é acionável, por
   construção;
4. **Ratificação jurídica de dado real previamente satisfeita** (parecer
   OS-16 / DEC-G0-03) — a autorização existe desde já, mas só se torna
   **exercível** quando o gate jurídico independente passar;
5. **Período de sombra obrigatório com desempenho medido** contra limiares
   pré-registrados no pacote de release (taxa de falso-positivo, carga de
   alertas/paciente-dia, no-fire explicado) — promoção automática só com
   métricas dentro dos limiares;
6. **Kill switch e rollback testados** antes da primeira promoção; qualquer
   violação de limiar em produção reverte a via para sombra automaticamente;
7. **Registro imutável** de cada promoção (versão, evidência, painel, data)
   em release-evidence.

### 6.2 Estado de exercibilidade hoje (fatos estabelecidos — não re-derivados)

- A promoção acionável é **inexercível hoje**: as condições **3 e 4** não
  estão satisfeitas (nenhum G3 por via aprovado; parecer OS-16 pendente —
  pedido enviado, GDEC-0011 item 3, relógio correndo).
- Contagem de vias acionáveis = **0**; **47/47 insumos inelegíveis**;
  `Observation` da AMH **não consumível**; safety case em **M0**.
- SOURCE (ata, "Honestidade obrigatória", item 1): agentificar G1/G2 remove
  atos humanos do caminho, **não cria dados** — o bloqueio é de dados
  (G3/AMH), não de humanos.

### 6.3 Revisita da AGT-3 — estados registrados e arbitragem (OBSERVADO)

- **GDEC-0010** (nomeação do 2º revisor clínico, Dr. Marcelo Villaca Lima,
  CRM-SP 112678) **disparou** o gatilho de revisita da AGT-3; a revisita
  ficou **ABERTA** por essa nomeação, permanecendo a ata vigente e a
  autorização não exercível de todo modo (condições 3-4). O pacote de tarefa
  deste sprint refletia esse estado.
- **Ata em disco (fonte normativa), bloco apenso + GDEC-0011 item 2**: a
  revisita aberta por GDEC-0010 consta como **CONCLUÍDA em 2026-08-15** —
  AGT-3 aprovada pelo segundo revisor nomeado, conforme atestado por escrito
  pelo titular; permanecem como **pendências de forma** o aceite formal por
  escrito do próprio nomeado e a verificação independente da credencial
  (GDEC-0010).
- **Arbitragem registrada** (trilha da execução 1, nota do orquestrador,
  commit `11d33bb`): a divergência pacote-de-tarefa × disco, escalada pelo
  autor na 0.1.0-draft, foi arbitrada **antes** do despacho dos votantes —
  **o estado em disco prevalece** (GDEC-0011 item 2 é posterior e do
  titular; o pacote estava defasado). Este documento transcreve a
  arbitragem; não a fez.

INFERENCE: em ambos os estados o efeito prático imediato é o mesmo — a
autorização permanece nos termos da ata e **segue inexercível pelas
condições 3-4**.

### 6.4 Gatilhos de revisita

SOURCE (ata AGT-3): gatilhos nomeados — (i) primeiro parecer jurídico
(OS-16); (ii) primeiro evento adverso em sombra ou piloto; (iii) entrada de
qualquer segundo revisor clínico humano — e "qualquer um reabre esta
decisão". O gatilho (iii) já disparou (GDEC-0010) e a revisita
correspondente consta como concluída (§6.3). SOURCE (bloco apenso da ata):
gatilhos remanescentes — **primeiro parecer OS-16** e **primeiro evento
adverso** em sombra/piloto.

Sobre o efeito de uma revisita aberta (correção da execução 1 — a 0.1.0
enunciava aqui uma regra categórica de suspensão que a fonte não contém):
SOURCE (nota do escriba na ata; GDEC-0010) — durante a revisita aberta por
GDEC-0010, "a autorização permanece nos termos desta ata" e seguia **não
exercível** pelas **condições 3-4**, não por suspensão. A fonte **não
estabelece** regra geral de suspensão de promoções durante revisitas
futuras, e este documento **não cria** tal regra (vedado — §7 e
decisions_prohibited do pacote): o efeito de cada reabertura sobre a
exercibilidade é matéria da própria revisita, conduzida pelo titular.

### 6.5 O que este documento NÃO autoriza (PROPOSAL — limites explícitos)

Este documento não autoriza, não antecipa e não substitui:

- nenhuma promoção de via a modo acionável (condições 3-4 insatisfeitas);
- nenhum início de período de sombra (exige runtime G7, pré-registro §5 e
  autorização de privacidade/segurança/pesquisa conforme o parágrafo do
  Gate G2 do prompt — seção 6, após §6.4);
- nenhum consumo de dado real (DEC-G0-03 integral: só dados sintéticos até o
  parecer OS-16);
- nenhuma alteração dos hard gates §6.2, dos donos/critérios de G3, G5, G6,
  G7, G8, nem de qualquer decisão do titular;
- nenhuma regra de promoção além das 7 condições transcritas em §6.1.

## 7. Independência e limites de autoridade dos membros

Transposição da §3 regra 10 ("Rule authors may not approve their own
clinical content") para agentes, conforme emenda de 2026-08-15 e ata AGT-4:

1. **Autor ≠ revisor ≠ verificadores**, sempre, por artefato — agentes
   distintos, contextos separados (§2.1). Entre agentes, "self-approval" =
   mesmo agente/contexto como autor e aprovador — **vedado** (§20 emendado).
   A autorização permanente do titular não constitui autoaprovação de agente
   quando o painel N-de-M é distinto do autor (idem).
2. Nenhum membro do painel — em nenhum papel — pode:
   - escrever **DECIDED** (evidence-notation §2: tabela, linha DECIDED —
     "no agent may self-apply this label" — e regra de uso 4: nenhum agente
     promove item próprio a DECIDED; só a autoridade humana nomeada aplica
     esse rótulo);
   - **fechar ou abrir** bloqueador, risco, hazard ou gate;
   - **nomear dono humano** ou inventar pessoa/aprovação/capacidade para
     satisfazer um rótulo (evidence-notation §2, regra de uso 7);
   - **enfraquecer** hard gate §6.2 ou qualquer critério para viabilizar
     passagem (anti-padrão 10; condição 1 da AGT-3).
3. Veredito do painel decide **apenas** VIVE/MORRE do artefato julgado — não
   decide política, não ratifica proposta como norma, não promove via (a
   promoção tem as 7 condições próprias de §6.1).
4. **Contradição documental** encontrada por qualquer membro não é resolvida
   pelo membro: é **transcrita** com as duas fontes citadas e **escalada ao
   orquestrador**, que a leva ao titular quando exigir decisão. (Precedente
   executado: a divergência de §6.3 foi transcrita pelo autor na 0.1.0-draft
   e arbitrada pelo orquestrador na trilha da execução 1 — não pelo autor.)
5. A accountability humana permanece a do titular, concentrada no ato da
   autorização permanente (§3 regra 15 emendada; RISK-0012 registra o risco
   residual dessa concentração, S5).

## 8. Proveniência e limitações honestas

### 8.1 O que este mecanismo NÃO cria (INFERENCE, de ata "Honestidade obrigatória" + RISK-0012/0013 + fatos estabelecidos)

- **Dados**: o painel julga artefatos; não popula `Observation`, não cria
  sinais vitais, não torna elegível nenhum dos 47/47 insumos hoje
  inelegíveis. O bloqueio do G2 é de dados (G3/AMH), e assim permanece.
- **Ambientes**: não provisiona runtime (G7), homologação ou produção; sem
  runtime não há sombra, e sem sombra não há condição 5 satisfeita.
- **Pareceres**: não substitui o parecer jurídico OS-16 (condição 4), o
  parecer de privacidade, nem qualquer validação humana exigida por
  VALIDATION REQUIRED em outros artefatos.
- **Observação de usuários reais**: a evidência substituta do G1 (AGT-1) e
  os baselines retrospectivos (AGT-2) carregam os vieses aceitos e
  registrados em RISK-0013; o painel não os elimina — apenas os mantém
  declarados.

### 8.2 Limitação estrutural do próprio painel (INFERENCE, de RISK-0012)

Redundância de agentes não elimina defeito compartilhado (mesmo ponto cego de
treinamento, mesma fonte contaminada, mesma má-interpretação de diretriz
atravessando autor, revisor e verificadores). As mitigações disponíveis são:
diversidade real de lentes (§2.2), diversidade de modelos quando disponível
(§3.4), sombra medida contra limiares pré-registrados (§5) e os gatilhos de
revisita (§6.4). O risco residual é S5 e pertence ao titular por força da
própria autorização (RISK-0012).

### 8.3 Validação pendente deste documento

VALIDATION REQUIRED — em coerência com §1.3 (dois estágios): (i) **condição
necessária**: execução do painel de §2 sobre esta versão (artefato-piloto)
com resultado VIVE e trilha gravada conforme §4 pelo orquestrador; (ii)
**condição de vigência**: ratificação pela autoridade humana nomeada nos
registros — até ela, este documento permanece PROPOSAL e nada aqui
autoexecuta (evidence-notation §2, regra de uso 3).
