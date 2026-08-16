---
doc_id: REL-PAINEL-AGT4-DEF
title: Definição operacional do painel adversarial AGT-4 (Gates G1/G2)
version: 0.1.0-draft
status: PROPOSAL
owner: UNASSIGNED — VALIDATION REQUIRED (aprovação DESTE artefato-piloto caberá ao próprio painel AGT-4, registrada na trilha pelo orquestrador — ver §1.3)
source: >
  docs/00-governance/evidence-notation.md (íntegra);
  docs/00-governance/registers/agentificacao-g1-g2-2026-08-15.md (ata AGT-1..AGT-4, fonte normativa, íntegra, incluindo blocos apensos);
  INTENSICARE_V2_ORCHESTRATOR_PROMPT.md §0.5 (roteamento de modelos), banner [AGENTIFICADO] do Gate G2 (seção 6, após §6.4), §3 regras 10 e 15 emendadas, item de §20 sobre self-approval emendado;
  docs/14-devsecops-and-delivery/mapa-de-projeto-ate-producao.md linhas 323-367 (fase G2; sprint SPR-G2-1);
  docs/00-governance/registers/decision-register.md entradas GDEC-0010 e GDEC-0011;
  docs/00-governance/registers/risk-register.md entradas RISK-0012 e RISK-0013
date_collected: 2026-08-15
last_updated: 2026-08-15
collector: agente autor (painel AGT-4, sprint SPR-G2-1)
provenance:
  source_repo: intensicare-V2
  path_or_url: ver campo source acima (múltiplos artefatos, todos relativos à raiz do repositório)
  commit_sha_or_version: 01479a905573549f2f7aea7e322af5e6960828ae (estado do working tree na coleta; branch cycle-5/execucao-agentificada)
  section_or_lines: seções citadas inline, por rótulo, em cada afirmação material
  date_collected: 2026-08-15
  collector: agente autor (painel AGT-4, sprint SPR-G2-1)
  transformation: transcrição e operacionalização de decisões já tomadas (GDEC-0009); nenhuma decisão nova
  confidence: high
  owner: UNASSIGNED — VALIDATION REQUIRED
  validation_status: "VALIDATION REQUIRED — este documento é PROPOSAL; sua aprovação como artefato-piloto será do painel AGT-4, registrada na trilha (§4)"
---

# Definição operacional do painel adversarial AGT-4 — versão 0.1.0-draft

PROPOSAL. Este documento **operacionaliza** decisões já tomadas pelo titular
(GDEC-0009, ata `agentificacao-g1-g2-2026-08-15.md`, decisões AGT-3 e AGT-4)
e **não as amplia**: nenhuma afirmação aqui cria regra de promoção além das 7
condições da ata, altera hard gates §6.2, fecha ou abre bloqueador/risco/gate,
nomeia dono humano ou aplica o rótulo DECIDED. Rótulos epistêmicos conforme
`docs/00-governance/evidence-notation.md`. Todo o conteúdo em pt-BR.

Nota sobre o `doc_id`: `REL-PAINEL-AGT4-DEF` é identificador de documento no
estilo já vigente em `docs/15-release-evidence/` (ex.:
`CYCLE-0-FIRST-CYCLE-REPORT`), **não** um novo prefixo da taxonomia de IDs
rastreáveis de `traceability-policy.md` — nenhum prefixo novo é cunhado aqui.

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
| Banner [AGENTIFICADO] do Gate G2 | `INTENSICARE_V2_ORCHESTRATOR_PROMPT.md`, seção 6, após §6.4 (linhas ~538-554) | O "qualified human committee" do §6.4 fica substituído, neste escopo, por autorização permanente do titular exercida via painel adversarial N-de-M, sob as condições 1-7 da ata. |
| §3 regra 10 (emendada 2026-08-15) | idem, linha ~286 | "Rule authors may not approve their own clinical content" — transposta para agentes: agente autor ≠ agente revisor ≠ painel adversarial ≥3 lentes; permanece plenamente vigente. |
| §3 regra 15 (emendada 2026-08-15) | idem, linha ~291 | Accountability humana concentra-se no ato da autorização permanente do titular; a decisão clínica à beira do leito permanece humana. |
| §20, item self-approval (emendado 2026-08-15) | idem, linha ~1267 | Entre agentes, "self-approval" = mesmo agente/contexto como autor e aprovador — vedado; a autorização permanente do titular não constitui autoaprovação de agente quando o painel N-de-M é distinto do autor. |
| §0.5 roteamento de modelos | idem, linhas ~135-152 | Verificação adversarial e análise clínica/segurança = tier máximo; tier econômico "nunca para conteúdo clínico". |
| Sprint SPR-G2-1 | `docs/14-devsecops-and-delivery/mapa-de-projeto-ate-producao.md` linhas ~351-353 | Entregável: "Definição operacional do painel + trilha em release-evidence"; DoD inclui trilha imutável gravada e tier econômico excluído de conteúdo clínico. |

### 1.3 Status e aprovação deste documento

PROPOSAL: este documento é o **artefato-piloto** do próprio mecanismo que
define. Sua aprovação não será por assinatura humana por item nem por
autoatribuição de DECIDED (vedado — evidence-notation §2, regra 3): será uma
execução do painel de §2 sobre este documento, com trilha gravada conforme
§4 pelo orquestrador. Até lá, nada aqui é vinculante por si; o que já é
vinculante é a **ata** (GDEC-0009), que este texto apenas transcreve e
operacionaliza.

## 2. Composição do painel por artefato

### 2.1 Papéis (SOURCE: ata AGT-4)

Para **cada artefato clínico ou de gate** (dossiê G1, análise MCDA, avaliação
de hard-gates, vetores CRV, pacote de release §6.4, promoção de via, e este
próprio documento), o painel é composto por, no mínimo, **5 agentes
distintos**:

1. **Autor** (1) — produz o artefato. Não emite veredito e não aprova nada
   (§3.10 transposta; §7).
2. **Revisor** (1) — agente distinto do autor, contexto separado; revisa o
   artefato por inteiro e emite veredito.
3. **Verificadores adversariais** (≥3) — agentes distintos entre si, do
   autor e do revisor, cada um com contexto separado e **lente designada
   diferente**; cada um emite veredito.

"Distintos" e "contextos separados" significam: nenhum membro compartilha a
janela de contexto, o histórico de sessão ou o rascunho de outro membro; cada
verificador recebe o artefato acabado e suas fontes primárias, **não** o
raciocínio do autor nem os vereditos dos demais (para não ancorar).

### 2.2 Lentes mínimas obrigatórias (SOURCE: ata AGT-4; mapa SPR-G2-1)

As três lentes abaixo são obrigatórias em todo painel; cada uma designada a
um verificador diferente:

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

### 2.3 Instrução adversarial e regra de decisão (SOURCE: ata AGT-4)

- Cada revisor e cada verificador recebe **instrução explícita de REFUTAR**:
  sua tarefa é derrubar o artefato, não confirmá-lo. Veredito "NÃO REFUTA"
  sem tentativa documentada de refutação é não-conformante e conta como
  ausência de veredito (quórum, abaixo).
- **Votantes**: revisor + verificadores. O autor **jamais** vota (§3.10
  transposta; §20 emendado).
- **Maioria refuta = artefato MORRE** e volta ao autor, com as refutações
  anexadas. Artefato morto só retorna ao painel em nova versão, com nova
  entrada de trilha (§4).
- **Empate = FAIL-CLOSED**: o artefato NÃO passa (equivale a MORRE para
  efeito de progressão; a trilha registra "MORRE — empate").
- **Ausência de quórum = FAIL-CLOSED**: sem no mínimo 1 revisor e 3
  verificadores com vereditos válidos registrados, o artefato NÃO passa
  ("MORRE — sem quórum"). Não existe passagem por omissão, timeout ou
  "aprovação tácita".
- Resultado **VIVE** exige: quórum completo, zero empate e maioria de
  vereditos NÃO REFUTA — tudo gravado na trilha (§4).

INFERENCE (de RISK-0012): a regra de decisão acima mitiga defeito individual
de agente, mas **não** o modo de falha residual de defeito compartilhado
(mesmo ponto cego de treinamento atravessando todos os membros). A mitigação
disponível é diversidade real de lentes (§2.2) e a sombra medida (condição 5)
— nunca apenas redundância de agentes.

## 3. Roteamento de modelos (SOURCE: prompt §0.5)

1. **Conteúdo clínico ou de gate = tier máximo de raciocínio** (classe Opus,
   na taxonomia do §0.5: "análise clínica/segurança/compatibilidade profunda;
   verificação adversarial; ADRs; adjudicações"). Isso cobre autor, revisor e
   todos os verificadores de qualquer artefato do escopo deste painel.
2. **Tier econômico (classe Haiku) JAMAIS participa de conteúdo clínico** —
   em nenhum papel, nem "só para formatar": se o texto é clínico ou decide
   gate, o tier econômico não o toca (§0.5, DoD do SPR-G2-1).
3. **O modelo/tier usado por cada membro é registrado na trilha** (§4, campo
   obrigatório). Entrada de trilha sem modelo declarado por membro é
   não-conformante e o resultado é FAIL-CLOSED até correção por nova entrada.
4. PROPOSAL (operacionalização): quando houver diversidade de modelos
   disponível no runtime, distribuí-la entre verificadores é preferível
   (mitiga parcialmente o defeito compartilhado de RISK-0012); a ausência de
   diversidade não bloqueia o painel, mas deve ficar visível na trilha.

## 4. Esquema da trilha imutável (append-only)

### 4.1 Localização e nome (PROPOSAL, conforme pacote SPR-G2-1)

```
docs/15-release-evidence/painel-agt4/trilha/<data>-<slug-do-artefato>-<versao>.md
```

- `<data>`: ISO `YYYY-MM-DD` da sessão do painel.
- `<slug-do-artefato>`: nome curto, minúsculas, hífens (ex.:
  `definicao-operacional-painel-agt4`).
- `<versao>`: a versão do artefato julgada (ex.: `0.1.0-draft`).

Um arquivo de trilha por execução de painel. Reexecução sobre a mesma versão
(caso raro — ex.: quórum incompleto sanado) gera **novo arquivo** com sufixo
sequencial (`-r2`), nunca edição do existente.

### 4.2 Campos mínimos por entrada (PROPOSAL; satisfaz a condição 2 da AGT-3 — "provada em trilha imutável" — e a AGT-4 — "composição, vereditos e modelos integram a trilha")

```yaml
---
trilha_de: <caminho do artefato julgado, relativo à raiz>
artefato_versao: <versão julgada>
artefato_hash: "sha256:<hash do conteúdo exato julgado>"
data_sessao: <YYYY-MM-DD>
sessao_ou_commit: <identificador da sessão de orquestração e/ou SHA do commit em que o artefato foi lido>
painel:
  - papel: autor            # não vota
    especialidade: <lente/especialidade do pacote de tarefa>
    modelo_tier: <modelo e tier, ex. "classe Opus — tier máximo">
  - papel: revisor
    especialidade: <...>
    modelo_tier: <...>
    veredito: REFUTA | NAO_REFUTA
    justificativa: <1-3 frases; se REFUTA, o defeito concreto>
  - papel: verificador-adversarial
    lente: correcao-clinica-fonte-primaria
    modelo_tier: <...>
    veredito: REFUTA | NAO_REFUTA
    justificativa: <...>
  - papel: verificador-adversarial
    lente: seguranca-fail-closed
    modelo_tier: <...>
    veredito: REFUTA | NAO_REFUTA
    justificativa: <...>
  - papel: verificador-adversarial
    lente: reprodutibilidade-vetores-dados
    modelo_tier: <...>
    veredito: REFUTA | NAO_REFUTA
    justificativa: <...>
  # + lentes adicionais quando exigidas (§2.2)
resultado: VIVE | MORRE
motivo_resultado: maioria | empate (fail-closed) | sem quorum (fail-closed)
corrige_entrada_anterior: null | <caminho da entrada de trilha corrigida>
registrado_por: orquestrador (escriba da trilha; não vota)
---
```

### 4.3 Regra de imutabilidade (PROPOSAL, vinculada à condição 7 da AGT-3)

1. Entradas de trilha **nunca são editadas** após commit — nem para corrigir
   erro de digitação.
2. **Correção = nova entrada** que preenche `corrige_entrada_anterior` com o
   caminho da entrada corrigida e explica a correção; a entrada original
   permanece intacta no histórico.
3. A trilha é **append-only** também no nível do diretório: nenhum arquivo
   sob `trilha/` é removido ou renomeado.
4. INFERENCE: o histórico git do repositório é o substrato de imutabilidade
   disponível hoje; qualquer mecanismo mais forte (ex.: assinatura,
   ancoragem externa) é decisão futura fora do escopo deste documento.
5. Para **promoções** de via (quando exercíveis — §6), a condição 7 da ata
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
pre_registro_de: <id da via + versão do pacote de release>
data_pre_registro: <YYYY-MM-DD — obrigatoriamente ANTERIOR ao início da sombra>
registrado_antes_da_sombra: true   # falso = pré-registro inválido, sombra não inicia
limiares:
  - metrica: taxa-falso-positivo
    valor: <limiar numérico com unidade e definição operacional do numerador/denominador>
    janela_medicao: <janela e granularidade, ex. "janela móvel de N dias, avaliada diariamente">
    fonte: <de onde sai o número — sistema, consulta, baseline que o justifica>
  - metrica: carga-alertas-paciente-dia
    valor: <...>
    janela_medicao: <...>
    fonte: <...>
  - metrica: no-fire-explicado
    valor: <...>
    janela_medicao: <...>
    fonte: <...>
  # + métricas adicionais que o pacote de release da via exigir
acao_em_violacao_em_producao: reversao automatica da via para modo sombra (ata AGT-3, condição 6)
---
```

Regras de uso (PROPOSAL, transcrevendo as condições 5-6 da ata):

- O pré-registro é gravado na trilha (§4) **antes** do primeiro dia de
  sombra; limiar registrado depois de iniciada a sombra é inválido e a
  promoção com base nele é vedada.
- Promoção automática sombra→acionável **só** com métricas dentro dos
  limiares pré-registrados (condição 5) — e ainda assim somente se TODAS as
  demais condições de §6 estiverem satisfeitas.
- **Violação de qualquer limiar em produção = reversão automática da via
  para sombra** (condição 6), com entrada de trilha registrando a reversão.
- Limiares não são editáveis por agente após o pré-registro; recalibração =
  novo pré-registro para nova versão da via, com nova sombra.

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

### 6.3 Revisita da AGT-3 — estados registrados e divergência transcrita (OBSERVADO)

Este documento transcreve, sem resolver, os dois estados documentados:

- **Pacote de tarefa deste sprint** (e o teor da entrada GDEC-0010): a
  nomeação do segundo revisor clínico (Dr. Marcelo Villaca Lima, CRM-SP
  112678) **disparou** o gatilho de revisita da AGT-3; a revisita fica
  **ABERTA** e, até sua conclusão, a ata permanece vigente — e a autorização
  segue não exercível de todo modo (condições 3-4).
- **Ata em disco (fonte normativa), bloco apenso + GDEC-0011 item 2**: a
  revisita aberta por GDEC-0010 consta como **CONCLUÍDA em 2026-08-15** —
  AGT-3 aprovada pelo segundo revisor nomeado, conforme atestado por escrito
  pelo titular; permanecem como **pendências de forma** o aceite formal por
  escrito do próprio nomeado e a verificação independente da credencial
  (GDEC-0010).

INFERENCE: em ambos os estados o efeito prático imediato é o mesmo — a
autorização permanece nos termos da ata e **segue inexercível** (condições
3-4). A divergência entre o pacote de tarefa e o estado em disco é
**transcrita e escalada ao orquestrador** (§7, item 4); nenhum membro do
painel a resolve.

### 6.4 Gatilhos de revisita (SOURCE: ata AGT-3 + bloco apenso)

Gatilhos nomeados na ata: (i) primeiro parecer jurídico (OS-16); (ii)
primeiro evento adverso em sombra ou piloto; (iii) entrada de qualquer
segundo revisor clínico humano — este último já disparado por GDEC-0010
(estado da revisita: §6.3). Gatilhos remanescentes registrados no bloco
apenso da ata: **primeiro parecer OS-16** e **primeiro evento adverso** em
sombra/piloto. Qualquer disparo reabre a AGT-3; enquanto reaberta, nenhuma
promoção é exercida.

### 6.5 O que este documento NÃO autoriza (PROPOSAL — limites explícitos)

Este documento não autoriza, não antecipa e não substitui:

- nenhuma promoção de via a modo acionável (condições 3-4 insatisfeitas);
- nenhum início de período de sombra (exige runtime G7, pré-registro §5 e
  autorização de privacidade/segurança/pesquisa conforme §6.4 do prompt);
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
   - escrever **DECIDED** (evidence-notation §2, regra 3: só a autoridade
     humana nomeada aplica esse rótulo);
   - **fechar ou abrir** bloqueador, risco, hazard ou gate;
   - **nomear dono humano** ou inventar pessoa/aprovação/capacidade para
     satisfazer um rótulo (evidence-notation §2, regra de uso 7);
   - **enfraquecer** hard gate §6.2 ou qualquer critério para viabilizar
     passagem (anti-padrão 10; condição 1 da AGT-3).
3. Veredito do painel decide **apenas** VIVE/MORRE do artefato julgado — não
   decide política, não ratifica proposta como norma, não promove via (a
   promoção tem as 7 condições próprias de §6.1).
4. **Contradição documental** encontrada por qualquer membro (ex.: §6.3) não
   é resolvida pelo membro: é **transcrita** com as duas fontes citadas e
   **escalada ao orquestrador**, que a leva ao titular quando exigir decisão.
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

VALIDATION REQUIRED: este documento torna-se operacionalmente vigente apenas
após (i) execução do painel de §2 sobre ele próprio (artefato-piloto), com
(ii) trilha gravada conforme §4 pelo orquestrador, e permanece PROPOSAL até
que a autoridade competente o ratifique nos registros — nada aqui
autoexecuta.
