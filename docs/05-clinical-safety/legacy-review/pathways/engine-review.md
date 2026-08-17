---
id: LEGREV-TRILHAS-ENGINE
title: Engine legado de trilhas/pathway — revisão da mecânica de segurança clínica
label: OBSERVED
status: PROPOSAL — AWAITING NAMED CLINICAL REVIEW (reviewer: rodaquino-OMNI)
statement: >
  Revisão source-verified da mecânica do engine de trilhas da V1 com uma lente de
  segurança clínica: carga/compilação, matrícula (enrollment), cadência de
  avaliação, máquina de estados, comportamento de entrada ausente/inválida/obsoleta,
  supressão, entrega de alerta, e o gate de cobertura de vetores false-green.
  Achado decisivo: uma entrada ausente pula silenciosamente seu critério e o
  agregado renderiza "normal" — a forma de falha do HAZ-0005 está presente no
  engine declarativo NOVO e é testada como comportamento pretendido. Veredito
  proposto: SUPERSEDE.
provenance:
  source_repo: intensicare (legado V1, READ-ONLY)
  path_or_url: src/intensicare/services/ (módulos trilhas_* e pathway_*), scripts/, tests/
  commit_sha_or_version: 1dc1ea6cc83f1e01ca7b7ee70a511f3dbc47cd79 (HEAD legado no pin, 2026-08-15)
  section_or_lines: por citação abaixo; SHA-256 por arquivo listado na seção 0
  date_collected: 2026-08-15
  collector: revisor forense de definições de pathway de cuidado legadas (ciclo 1, Tarefa 1)
  transformation: >
    traduzido EN→pt-BR, tranche 3, GDEC-0008 item 8 (lido por completo;
    comportamento rastreado linha a linha; gate false-green reproduzido ao vivo;
    veredito proposto)
  confidence: alta
  owner: UNASSIGNED — VALIDATION REQUIRED
  validation_status: VALIDATION REQUIRED
links:
  hazards: [HAZ-0005, HAZ-0016, HAZ-0021, HAZ-0022, HAZ-0040, HAZ-0043]
supersedes: null
superseded_by: null
---

> Traduzido EN→pt-BR em 2026-08-16 (GDEC-0008 item 8, tranche 3); original EN preservado no histórico git.

# Engine de trilhas / pathway — revisão da mecânica de segurança clínica

## 0. Arquivos revisados e hashes

Todos do manifesto de pin (`docs/archive/legacy-provenance/legacy-pin-cycle-1.md`)
exceto quando marcados "hashed by reviewer" (ausentes do manifesto, hasheados
no momento da leitura, 2026-08-15):

```text
a2ef8717276699bd013ede8eac5d1dc618607e72b76e664c09525ca6c54f4734  src/intensicare/services/trilhas_compiler.py
6c45cb65514c7d6b0c99cb150936f76f337e91a7ecab59d27ad71adc819aaab2  src/intensicare/services/trilhas_engine.py
33db93cf4e3f7b6483ead7fb8a643261700277a5bd7ae1c2f9746f1fa1a9a154  src/intensicare/services/trilhas_evaluator.py
3425e844fbec012a67a60779ca30fd5af0b8d1c517051684ae5f5a1ebe2baabe  src/intensicare/services/trilhas_definitions.py
1edd099ae2bf3ecdccdf4959c0feb73355095e2b1137f65f4e19bd56cd00290b  src/intensicare/services/trilhas_state.py
6dca0013e99a6db21bf92303062bf033c40314a0c79c999896eea3aa04cadd56  src/intensicare/services/domain_trilhas_engine.py
c23a7b427f224c910cd8f234ed7fe6bf0e2e854b521550b04122301e3c71028d  src/intensicare/services/pathway_auto_evaluation.py
220b8bff114d043aeb5cd7bca7a7db3d7c514430dff0ef3271de70078ccd72d3  src/intensicare/services/pathway_definitions_sync.py
ce54b79adc34936467466db488589051a0809428e6a3a5f08fcdd3bbc59f7d0c  src/intensicare/services/pathway_enrollment.py
ebca92edf5bb5d1c3d0cc7bb1ce71aeae696e9d11c478c3ec74e098efd7ebe1f  src/intensicare/services/pathway_repository.py
650bdd8c512fd08e673cde124269dd5c05a214ac07510011d53954cdd738b1cb  src/intensicare/services/sepsis_input_provider.py
dcd1e76e7086106e659dce52e59a374350d8a4a662b63d9959a562dbf32eff64  src/intensicare/services/vitals.py
69e29b7fa1c828548b79bf419feb1a121f8c1d7c95fedc607f63b08af4bec013  src/intensicare/api/v1/pathways.py
68ca230a47b7ad5be991cdfc4319ad1d6a6e6112d14b185506588ebed772a203  _work/alerts/schema/pathway.schema.json
```

Hasheado pelo revisor (ausente do manifesto de pin):

```text
b8a38ebe4cb21894dafb913c0c28df223eda21555e0dbcdc54b2ef8e1fc37eb7  scripts/check_vector_coverage.py
22daccfb33d4be7f6708ae0b3e44f2d1fa635cf9e3d442e0e45ff55b98ae4c41  scripts/validate_alerts.py
dbb8409f9300653e8d6bda746a1940e694e910de2e590302d82045777a5cc574  tests/test_trilhas_evaluator.py
8d7e5557db0cd8e92077f87fc3be2e76b7e129b8b9e006432170023415e77017  tests/test_sepse_yaml_parity.py
90db49b70cee4822790af8027f58088d523c3c1665a54455dc6e822d6544469a  tests/test_trilhas_compiler.py
409f363d356311514b605df0876ffb0a1e9ec1f2d15017e7b42342778453e42c  docs/plan/_work/alerts/aki.yaml
51336b4cdce32905270b7dcb241824083c4003142527a8d7b71e6e576dbab06b  docs/plan/_work/alerts/correlation-engine.yaml
712d9ccde209d099f80c4d5abb11e77e33564e03f347f931a363537c1031e9b8  docs/plan/_work/alerts/early-warning-scores.yaml
0de2f4e7218d1acdd2c2c83ff8a25435bda5f996e577f073f3b9988f9e4085f3  docs/plan/_work/alerts/electrolyte.yaml
ed09ce34e5e7dde099cff41d8821d642021083a431f5c302ca3a2de173496190  docs/plan/_work/alerts/hemodynamics.yaml
b5f0371333331b8ee45d4e4355902fa9da14773282c375f8d1dd959ad659a627  docs/plan/_work/alerts/neuro-sedation.yaml
ee403fbe4d63d694993ac4858f83f8bc3cc920cbe413f3323b3e6c8fae6fc992  docs/plan/_work/alerts/pharmaco-interaction.yaml
7186652bccffce6a99f1e8d5722913683c7009c875adaa15b1207715ea7634af  docs/plan/_work/alerts/respiratory.yaml
6d79efcb164b7989f9c3992a9f2647b9ea213cb329bef837681ad85bbaf0e5de  docs/plan/_work/alerts/sepsis.yaml
```

## 1. Arquitetura: três runtimes coexistindo

OBSERVED — no commit fixado, três runtimes de pathway coexistem:

1. **TrilhasEngine** (`trilhas_engine.py`) — "stateless declarative rule
   engine… Replaces the imperative PathwayStore" (linhas 1-6). Carrega
   `_work/alerts/pathways/*.yaml`, pré-compila predicados, avalia via
   TrilhasEvaluator, emite registros `AlertFiring` carimbados com
   `definition_version` + `content_hash` (ADR-0020/021).
2. **PathwayStore** (`trilhas_state.py`) — deprecado, máquina de estados em
   memória ("Migration deadline: 2026-09-01", linha 16) ainda conectada como
   o store padrão via `domain_trilhas_engine._default_store` (linha 111) — e
   ainda o que o próprio `TrilhasEngine.get_patient_pathways` delega
   (`trilhas_engine.py:213-234`): o engine *novo* responde "em quais
   pathways este paciente está" a partir do store *em memória, deprecado*.
3. **pathway_enrollment.py + pathway_repository.py** — a porta apoiada em
   Postgres das regras da máquina de estados (o caminho real de
   matrícula/avaliação em produção), que relê o engine YAML privadamente
   para classificação de severidade (`pathway_enrollment.py:641-681`).

INFERENCE: três runtimes sobre um único conjunto de conteúdo, cada um com
semânticas de dado ausente diferentes (ver §4), reproduzem o hazard de
runtime duplo que a avaliação legada já sinalizava (linha CAND-0006 do
candidate-inventory, `LEGACY-TA:719-727`).

## 2. Validação de carga e tempo de compilação

OBSERVED (`trilhas_engine.py:105-144, 273-382`):

- YAML carregado com `yaml.safe_load`; **o schema JSON
  (`pathway.schema.json`) não é aplicado no momento da carga** — a
  conformidade com o schema é uma preocupação apenas em tempo de CI.
  Arquivos não parseáveis/sem dict/sem id são pulados com um WARNING
  (`_load_file:279-297`) — uma pathway apagada ou malformada desaparece
  silenciosamente do portfólio em runtime.
- Compilação de predicado por critério na carga; **política híbrida
  fail-fast**: qualquer falha de compilação de predicado desativa a pathway
  inteira (nunca avaliação parcial de uma pathway clínica — linhas 317-353,
  registrado em `load_failures` público), e zero pathways ativas dispara
  `RuntimeError` no boot (linhas 133-144). Isso é engenharia de segurança
  real e bem pensada.
- **Mas ambos os consumidores em produção neutralizam o fail-fast**: o
  `_get_engine` da API captura qualquer exceção de inicialização e recorre
  ao catálogo seed legado de 4 pathways (`api/v1/pathways.py:100-114`,
  "using legacy catalog"), e o
  `pathway_enrollment._get_trilhas_engine` captura e degrada a severidade
  para `"normal"` (`pathway_enrollment.py:655-681`, docstring: "a
  definitions-load hiccup must degrade _determine_severity to its 'normal'
  fallback"). Um boot que deveria falhar alto, em vez disso, serve conteúdo
  obsoleto ou respostas de severidade normal.
- A validação do compilador (`trilhas_compiler.py`) é genuinamente forte:
  sem eval/exec (AST + mapa de operadores, linhas 1-46); continuidade de
  faixas aplicada — sem lacunas/sobreposições, a última faixa deve alcançar
  +inf (linhas 372-389); aridade do combinador NOT aplicada; campos
  temporais validados. Os gates de CI A/B/C
  (`scripts/validate_alerts.py`) rerodam a partição de faixas pelo
  compilador real e checam strings de unidade e as duas fachadas de
  rationale. Inteligência preservada que vale a pena carregar como ideias.
- Os conjuntos de faixas cobrem apenas `[limite inferior mais baixo, +inf)`
  — um valor abaixo da faixa mais baixa não bate com nenhuma faixa e avalia
  `met=False, severity normal` (`trilhas_compiler.py:577-593`). Ver §4 para
  a consequência clínica.
- Content addressing: `compute_content_hash` (SHA-256 de JSON canônico,
  `trilhas_compiler.py:54-74`). OBSERVED por recomputação: os valores
  `pathway.content_hash` declarados das doze YAMLs correspondem ao hash
  computado sobre o arquivo excluindo o campo `content_hash` — os hashes
  são reais, não placeholders (a docstring de
  `pathway_definitions_sync.py:16-23` alegando "every YAML definition ships
  with a fake placeholder content_hash" está **obsoleta** no commit
  fixado). A sincronização no boot recomputa e persiste o hash real e loga
  discrepâncias sem bloquear (`pathway_definitions_sync.py:95-121`).

## 3. Gatilhos de matrícula e cadência de avaliação

OBSERVED:

- **A matrícula é exclusivamente manual** (API POST →
  `pathway_enrollment.enroll_patient`; começa em `initial`, severidade
  `normal`; ativo-duplicado protegido por índice único parcial com
  fallback de corrida, linhas 190-224). Não existe nenhum gatilho de
  matrícula automática em nenhum lugar. A checagem de elegibilidade
  (`check_pathway_eligibility`, `domain_trilhas_engine.py:184-362`) é
  consultiva, existe para apenas 4 dos 12 slugs (Regras 15-18), e **o
  padrão é elegível**: sem dados do paciente — "Elegibilidade presumida";
  com dados não correspondentes — "Sem contraindicações automáticas
  identificadas. Elegível mediante avaliação clínica."
- **Cadência de avaliação**: o `evaluation.mode` do YAML
  (micro-batch/near-real-time/hybrid) é parseado (`trilhas_engine.py:315`)
  e consumido por **nada** — nenhum scheduler existe. Os gatilhos reais são
  exatamente dois: (a) melhor-esforço após toda ingestão de vitais
  (`services/vitals.py:415-423` →
  `pathway_auto_evaluation.evaluate_enrolled_pathways`, exceções
  engolidas: "NUNCA derruba a ingestão"), e (b) PUT manual de critérios.
  Consequência: pathways cujas entradas não são vitais (7 de 12 têm zero
  entradas auto-alimentadas — ver revisões por pathway) só são avaliadas se
  um humano fizer PUT de valores; os temporizadores de bundle da sepse só
  avançam quando uma avaliação por acaso é disparada — um alerta de
  antibiótico da hora-1 vencido não dispara em um paciente sem vitais
  novos.
- Fonte de entrada: um builder genérico fornece 9 chaves (pam, fc, fr,
  temp, spo2, vasopressor_dose, creatinina, debito_urinario, rass_score) a
  partir das linhas persistidas MAIS RECENTES **sem janela de frescor**
  (`pathway_auto_evaluation.py:113-158`); a sepse tem um provider dedicado
  (`sepsis_input_provider.build_sepsis_inputs`) que a docstring do módulo
  registra como tendo tido **"ZERO callers in the live codebase"** antes
  que a re-auditoria da Dim A o conectasse
  (`pathway_auto_evaluation.py:1-10`).

## 4. Comportamento de entrada ausente, inválida e obsoleta — as linhas decisivas

OBSERVED, sob a lente do HAZ-0005:

1. **Entrada ausente → pulo silencioso → normal.**
   `trilhas_compiler._lookup` dispara `KeyError` para uma chave ausente
   (linhas 717-729); `TrilhasEvaluator.evaluate_pathway` a captura e dá
   `continue` no critério em nível DEBUG (`trilhas_evaluator.py:388-397`);
   `build_alert` calcula `overall_severity = "normal"` sobre zero disparos
   ativos (`trilhas_evaluator.py:472-481`). **Um paciente sem dados e um
   paciente verificado normal produzem a mesma saída.** Não existe nenhum
   estado `not_evaluated` em nenhum lugar — o vocabulário de severidade é
   fechado em `normal|watch|urgent|critical`
   (`trilhas_evaluator.py:293-298`; schema CON-SEED-11). Testado como
   PRETENDIDO: `tests/test_trilhas_evaluator.py:437-449` afirma que entrada
   ausente → sem disparo.
2. **Amplificação de composto.** Compostos avaliam todos os sub-predicados
   sem short-circuit (`trilhas_compiler.py:629-641`); um `KeyError` de
   QUALQUER sub-entrada se propaga e mata o critério INTEIRO — incluindo um
   OR cujo outro ramo está satisfeito. A suíte de paridade da V1 documenta
   isso e preenche entradas com padrões neutros ("PAM=999…") para evitá-lo
   (`tests/test_sepse_yaml_parity.py:118-131`). Vetor clínico: choque
   séptico silenciado por um booleano ausente (`sepse-review.md` §4).
3. **Entrada inválida → normal.** Valores não numéricos em avaliação de
   limiar/graduada/temporal retornam `met=False, severity normal`
   (`trilhas_compiler.py:532-543, 565-575, 681-696`) — uma falha de tipo
   detectada é coagida para o estado mais tranquilizador (forma de
   proibição P-1/P-2, `evaluation-status-semantics.md` §4).
4. **Abaixo-da-faixa-mais-baixa → normal.** A guarda `matched_band is None`
   retorna normal (`trilhas_compiler.py:584-593`). Vetores ao vivo: FiO2
   registrada como fração (`respiratorio-review.md` §7); débito urinário
   alimentado em mL/dia contra um conjunto de faixas em mL/kg/h
   (`renal-review.md` §7). **Unidades nunca são checadas no momento da
   avaliação** — o Gate A valida *strings* de unidade contra um registro
   apenas em tempo de CI.
5. **Entrada obsoleta → tratada como atual.** Não existe nenhum conceito de
   frescor/obsolescência no compilador, avaliador, engine, ou
   auto-avaliação (consultas de "linha mais recente", sem limite de idade).
   Os catálogos de alerta de domínio (conjunto docs/plan) declaram campos
   `staleness_max` — o pipeline de pathway não implementa nada do tipo.
6. **A semântica da camada de matrícula difere por runtime.** (a) A Regra
   10 em memória deprecada: severidade = razão atendido/total — menos
   atendido ⇒ MAIS severo, então critérios nunca-avaliados inflam a
   severidade (`trilhas_state.py:633-658`); (b) a porta Postgres chama isso
   explicitamente de "a P0 clinical-safety bug (gatekeeper G-S2)" e a
   substitui por classificação em faixas dos critérios avaliados onde
   **critérios pendentes são excluídos e tudo-pendente ⇒ "normal"**
   (`pathway_enrollment.py:63-71, 684-782`) — a correção remove o
   falso-crítico e instala o falso-normal; (c) o avaliador declarativo
   renderiza ausência como normal conforme o item 1. Três runtimes, três
   respostas erradas diferentes para "o que significa ausência", nenhuma
   expressável como `not_evaluated`.
7. **Erro de avaliação → pulo/normal.** Falha de compilação de predicado no
   momento da avaliação → critério pulado (`trilhas_evaluator.py:376-385`);
   a auto-avaliação envolve cada matrícula em try/except registrando
   `outcome.error`, mas continuando (`pathway_auto_evaluation.py:331-341`);
   o hook de vitais engole tudo (`services/vitals.py:415-423`). Nenhum erro
   de avaliação é jamais exposto a um consumidor clínico.

## 5. Máquina de estados

OBSERVED (`pathway_enrollment.py:250-410`; porta das Regras 3-14 de
`trilhas_state.py`):

- Os estados são ordenados, apenas para frente; regra de avanço: **se
  TODOS os critérios da pathway forem atendidos, avança exatamente um
  estado** por avaliação (linhas 340-355). Os critérios são globais à
  pathway — não escopados por estado; a facilidade `auto_advance` do
  schema (condições por estado, temporizadores) é usada por **zero** YAMLs
  e ignorada pela máquina de estados. Estado terminal ⇒
  `status=completed`.
- **"Met" carrega significados opostos nas duas camadas ativas.** No
  avaliador declarativo, met = condição detectada (digna de alerta). Na
  máquina de estados de matrícula, met = meta alcançada (progresso rumo à
  `alta`). A ponte de auto-avaliação inverte apenas resultados graduados
  ("met = severity == normal", `pathway_auto_evaluation.py:166-190`) e
  passa boolean/composite/temporal inalterados — então, para a sepse v4,
  "choque séptico presente" conta como um critério *met* empurrando a
  matrícula rumo à resolução, e via classificação booleana de
  `_determine_severity` um booleano de compliance verdadeiro lê severidade
  `urgent` (`profilaxia-review.md` §7). A colisão de semântica está
  documentada na própria docstring da ponte.
- Tendência: qualquer histórico de transição ⇒ "improving"
  (`pathway_enrollment.py:785-816`) — uma matrícula com uma única transição
  é rotulada melhorando para sempre ("worsening" é inalcançável: as
  transições são apenas para frente).
- Recomendações: textos diretivos em pt-BR hardcoded selecionados por nome
  de pathway + severidade (`pathway_enrollment.py:819-1019`), incluindo
  instruções operacionais ("Considerar… posição prona se P/F < 150",
  "iniciar cristaloide 30 mL/kg", "PSV 5-7 cmH₂O ou tubo T por 30-120
  min"). INFERENCE: instruções clínicas diretivas geradas pelo sistema,
  vinculadas a uma severidade cujo cálculo trata ausência como normal —
  risco de fronteira consultivo-vs-diretivo (adjacente ao HAZ-0044;
  VAL-0011).
- Mudanças de estado publicam um evento WebSocket `pathway.updated` de
  melhor-esforço; falha de publicação é engolida
  (`pathway_enrollment.py:587-628`).

## 6. Supressão e entrega de alerta

OBSERVED:

- Supressão (`trilhas_evaluator.py:84-286`): cooldown por (mpi, pathway,
  critério) + limite de taxa por hora, apoiado em Redis com **fallback
  silencioso em memória por processo** quando o Redis está indisponível
  (linhas 108-120) — o estado de supressão então diverge entre workers
  (alertas duplicados, ou supressão desigual; forma do HAZ-0022). Os
  disparos suprimidos são carregados no registro, mas **excluídos de
  `overall_severity` e do escore** (linhas 469-481): durante uma janela de
  cooldown, uma condição crítica persistente pode agregar para `normal`.
- **Entrega de alerta: a saída do engine declarativo não vai a lugar
  nenhum.** Os únicos pontos de chamada em produção de
  `TrilhasEngine.evaluate` são dois blocos de "validation pass
  (non-blocking)" que **logam** os disparos e os descartam
  (`api/v1/pathways.py:713, 796-817`: `logger.info("TrilhasEngine produced
  %d alert(s)…")`). Sem persistência, sem notificação, sem roteamento.
  INFERENCE: as doze definições de pathway, seus conjuntos de faixas e
  configurações de supressão constituem uma capacidade de alerting que é
  exibida (catálogo, matrícula, endpoints de progresso), mas **não
  consegue alcançar um clínico** — a forma estrutural do "capability
  incapable of evaluating anything" do HAZ-0043, aqui "capability
  incapable of delivering anything."

## 7. O gate de cobertura de vetores false-green (candidate-inventory 1.1h) — localizado e explicado

OBSERVED — `scripts/check_vector_coverage.py` (SHA-256 §0):

- O gate varre `docs/plan/_work/alerts/*.yaml` (linha 24) — os nove
  **catálogos de alerta de domínio**, NÃO as doze YAMLs de pathway.
- `load_all_catalogs` (linhas 39-49): um arquivo sem uma chave de topo
  `alert_groups` recebe um WARNING no stderr e é **pulado da lista de
  catálogo** — isso não reprova o gate.
- OBSERVED no HEAD fixado: todas as nove YAMLs de domínio usam uma chave de
  topo `alerts:` e nenhuma contém `alert_groups` (contagem de grep 0 em
  cada uma; hashes §0). Então todo arquivo é pulado, `total = 0`,
  `missing = []`, `no_condition = []`.
- `main` (linhas 114-145) imprime WARNINGS de limiar ("Expected >= 50
  alerts, found 0", "Expected >= 266 vectors, found 0") que **não são
  falhas**, e então, porque `missing` e `no_condition` estão vazios,
  imprime `✅ PASSED: All 0 alerts have test vectors and conditions.` e
  retorna código de saída **0**.
- Reproduzido ao vivo em 2026-08-15:
  `python3 scripts/check_vector_coverage.py` no HEAD fixado imprime
  exatamente isso e sai com 0.

INFERENCE: a condição de sucesso do gate é vacuamente satisfazível — um
descasamento de chave estrutural entre o gate e seus dados converte "nada
foi validado" em um check verde. O "False-green gate; validates nothing" da
avaliação legada (candidate-inventory 1.1h) é confirmado a partir da fonte e
da execução. Lição de design para a V2: gates de cobertura DEVEM falhar em
população-zero (piso de denominador como erro rígido, não warning), e o
desvio de schema entre validador e conteúdo deve ele próprio ser uma falha.

## 8. O que vale a pena preservar (inteligência, não código)

INFERENCE — candidatos a inteligência preservada para o manifesto de
migração (apenas ideias; a política padrão de não-copiar de
`legacy-import-policy.md` §1 se aplica):

1. Modelo de conteúdo declarativo: pathway-como-dado com predicados
   tipados (threshold/graded/boolean/composite/temporal), schema, e bloco
   de evidência por definição.
2. Compilador AST sem eval com aplicação de partição de faixas em tempo de
   build (lacunas/sobreposições impossíveis de carregar).
3. Definições content-addressed (SHA-256 de JSON canônico) carimbadas em
   todo disparo para rastreabilidade; espelho de BD no boot com log de
   desvio de hash.
4. Predicados temporais determinísticos (duração computada upstream; sem
   relógio no predicado).
5. Desativação fail-fast da pathway inteira em falha de compilação +
   recusa de boot em zero definições ativas (a política — desde que os
   consumidores não a neutralizem).
6. Disciplina de teste de paridade com oráculo (os 31 vetores golden da
   sepse v4 com xfails limitados e documentados).

## 9. Veredito

**PROPOSAL — AWAITING NAMED CLINICAL REVIEW (reviewer: rodaquino-OMNI):
SUPERSEDE** (o engine, os três runtimes, como um todo). Racional: o engine
não tem nenhuma álgebra na qual "não avaliado" seja representável — ausência,
invalidez, obsolescência, erro de avaliação e supressão todos colapsam em
`normal` ou em silêncio; a máquina de estados e o avaliador atribuem
significados opostos a "met"; a elegibilidade tem padrão elegível; a
cadência declarada não é implementada; e a saída de alerta não é entregue.
Essas são propriedades arquiteturais, não bugs a corrigir — o contrato de
status de avaliação da V2 (`evaluation-status-semantics.md`) é o desenho
substituto. Os itens de §8 devem ser carregados adiante como ideias
documentadas no manifesto de migração. Não é DECIDED; nada aqui autoriza
importação ou reuso.
