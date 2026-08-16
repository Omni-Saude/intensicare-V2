---
id: LEGREV-EWS-MEWS
title: Registro de revisão legada — MEWS conforme implementado no IntensiCare V1 vs Subbe et al. QJM 2001
label: PROPOSAL
statement: >
  Revisão forense de cada escore, regra e limiar do MEWS implementado no repositório
  legado V1, verificado a partir do código-fonte no pin do ciclo-1, incluindo a
  identificação de QUAL variante do MEWS a V1 implementou e a comparação com a citação
  Subbe 2001 que a própria V1 alega. O veredito é uma PROPOSAL — AWAITING NAMED
  CLINICAL REVIEW (reviewer: rodaquino-OMNI).
provenance:
  source_repo: intensicare (legado V1, READ-ONLY) + intensicare-V2 + academic.oup.com
  path_or_url: /Users/familia/intensicare (ver tabela de citação por arquivo, seção 0)
  commit_sha_or_version: 1dc1ea6cc83f1e01ca7b7ee70a511f3dbc47cd79 (HEAD legado no pin; SHA-256 por arquivo abaixo)
  section_or_lines: referências de linha por citação ao longo do documento
  date_collected: 2026-08-15
  collector: revisor forense de EWS legado (agente da Tarefa 1, ciclo-1); revisor responsável rodaquino-OMNI
  transformation: >
    traduzido EN→pt-BR, tranche 3, GDEC-0008 item 8 (trechos de código verbatim mais
    análise do revisor; resumo da editora verificado online; Tabela 1 primária não
    obtida — paywalled — registrado honestamente na seção 2)
  confidence: alta para observações de código; média para comparação com a tabela publicada (ver seção 2)
  owner: UNASSIGNED — VALIDATION REQUIRED
  validation_status: VALIDATION REQUIRED
links:
  requirements: [SAF-0001, SAF-0002, SAF-0003]
  hazards: [HAZ-0005]
  adrs: []
  tests: []
  pr: null
supersedes: null
superseded_by: null
---

> Traduzido EN→pt-BR em 2026-08-16 (GDEC-0008 item 8, tranche 3); original EN preservado no histórico git.

# MEWS — registro de revisão legada (ciclo 1, Tarefa 1)

> **PROPOSAL — AWAITING NAMED CLINICAL REVIEW (reviewer: rodaquino-OMNI).**
> Este registro revisa; não aprova nada. Vocabulário de veredito conforme
> `docs/00-governance/legacy-import-policy.md` §4. Candidato: **CAND-0002**
> (`docs/05-clinical-safety/pathway-portfolio/candidate-inventory.md`).

## 0. Base de citação — arquivos e hashes

Todos os caminhos legados são relativos a `/Users/familia/intensicare/` no HEAD
`1dc1ea6cc83f1e01ca7b7ee70a511f3dbc47cd79` (2026-08-15). **[pin]** = em
`docs/archive/legacy-provenance/legacy-pin-cycle-1.md`; **[reviewer-hash]** = não
naquele manifesto, hasheado por este revisor em 2026-08-15 (`shasum -a 256`) —
OBSERVED.

| Arquivo | SHA-256 | Manifesto |
|---|---|---|
| `src/intensicare/services/mews.py` | `43f7a8e17a31ea21f61ec53b2bcee68ff64067387c687e23714382f4737e922c` | [pin] |
| `src/intensicare/services/vitals.py` | `dcd1e76e7086106e659dce52e59a374350d8a4a662b63d9959a562dbf32eff64` | [pin] |
| `src/intensicare/services/threshold_resolver.py` | `0b02d8ace9bdc89695eeaa2e08d81b2a72070c27624265190b2005883c20ee6f` | [pin] |
| `src/intensicare/services/dashboard.py` | `ae60425f025bc7387c720dfe2c35fa89b0c2e053d33e2ad81d78828a68ac1489` | [pin] |
| `src/intensicare/services/ews_nrt_runner.py` | `9ad826e9e31be584a17285a721697243e8654d9209ca68b9abec1230ed3c7fe6` | [pin] |
| `src/intensicare/services/deterioration_trend.py` | `61d80a379459f4769d5bf3ab14813f6985a0d00f038f349877d6382b85080870` | [pin] |
| `src/intensicare/models/clinical_score.py` | `fc987ad0d037b1f153451240178dc12ab988a1104d7bc4a88dc460972234ff43` | [pin] |
| `src/intensicare/schemas/vitals.py` | `f6afffd444038f2d1dec19d7047a0013f908d9a7106c52ce9895cbc1ba14308f` | [pin] |
| `alembic/versions/0038_seed_default_threshold_config.py` | `c11d640d1a29aab2d99e39a741d35bceec2a6d688e174db3cbded2bf089c4486` | [pin] |
| `alembic/versions/0007_seed_mews_v1_0_1.py` | `a14d9b244666d7dcf75be32418b828da86627d35ee3965027408e7dbdff966d8` | [reviewer-hash] |
| `alembic/versions/0020_activate_mews_v2_0_0.py` | `a8537f389dce039d707f59202c0df7f960c27c54b65e4ba20e37608600b256eb` | [reviewer-hash] |
| `alembic/versions/0039_activate_mews_v3_0_0.py` | `da08277a162847d121ce8024f78bea2997481416437820265cadeeaaf9465e23` | [reviewer-hash] |
| `src/intensicare/mllp_listener.py` | `2aaf592bf5855205aaf816c04386457ab7ee54158f3d7037df4d30cbb7543d94` | [reviewer-hash] |
| `docs/audit/fullspectrum/CLINICAL_SIGNOFF.md` | `7499a00ddfa6309f0190177d9474ba8e0db781d515bd3cbe72b890e74c178f91` | [reviewer-hash] |
| `tests/test_mews.py` (apenas evidência de intenção) | `a971ffc31f3c9ffffd3cfe861fae82e4914433a1660cf200e622a4f98ae443b6` | [reviewer-hash] |

## 1. Fórmula conforme implementada (OBSERVED, a partir da fonte)

Motor de scoring: `src/intensicare/services/mews.py`. Cinco componentes somados
(`calculate_mews`, mews.py:168-226): frequência cardíaca, PA sistólica,
frequência respiratória, temperatura, AVPU. Constante de versão
`MEWS_VERSION = "MEWS-v3.0.0"` com a nota no código-fonte
"RAT-MEWS-SUBBE-2001-R2 (pending clinical sign-off — ver migração)" (mews.py:19).

Faixas implementadas (OBSERVED nas linhas citadas):

- Frequência cardíaca (mews.py:55-79): `<=39:2, 40-50:1, 51-100:0, 101-110:1, 111-129:2, >=130:3`.
- PA sistólica (mews.py:82-103): `<=70:3, 71-80:2, 81-100:1, 101-199:0, >=200:2`.
- Frequência respiratória (mews.py:106-127): `<=8:2, 9-14:0, 15-20:1, 21-29:2, >=30:3`.
- Temperatura (mews.py:130-148): `<35.0:2, 35.0-38.4:0, >=38.5:2` (valor float
  arredondado para 1 casa decimal primeiro, mews.py:139-141).
- AVPU (mews.py:151-165): `A:0, V:1, P:2, U:3`; **qualquer outra string não-None
  → 0** via `avpu_map.get(upper, 0)` (mews.py:162-164), **sem nenhum marcador de
  ausência**.
- Entradas ausentes: cada `None` retorna 0 mais `"<param>_status": "missing"`
  (mews.py:65-66, 91-92, 115-116, 137-138, 159-160); os status são coletados em
  `missing_components`, e então as chaves de status são apagadas
  (mews.py:207-215); o total é a `soma` dos cinco sub-escores com
  `.get(..., 0)` (mews.py:218-224).
- Tendência: `compute_trend` compara o último vs o primeiro de ≥2 escores
  consecutivos → increasing/decreasing/stable (mews.py:229-247).

Pontos de chamada em produção (OBSERVED): a ingestão calcula e persiste o MEWS
por linha de sinal vital com tendência/delta vs. o escore anterior
(vitals.py:246-307); o alerting compara o agregado contra os padrões de
`threshold_config` watch=3/urgent=4/critical=5
(0038_seed_default_threshold_config.py:48-59; alert_engine via
vitals.py:391-393); a severidade de leito mapeia o agregado pelas mesmas faixas
com piso "normal" (dashboard.py:44-47, 79-115); a projeção de tendência de
deterioração consome o histórico de MEWS persistido
(deterioration_trend.py:61-66, 193). Os metadados de `missing_components` são
persistidos dentro do JSONB `components` (vitals.py:295-306), mas **nenhum
consumidor os lê** — o motor de alertas, o resolvedor de limiares, o dashboard e
a projeção de tendência leem apenas `score_value` (OBSERVED: alert_engine.py:50-59;
dashboard.py:210-234; deterioration_trend.py).

## 2. Definição publicada autoritativa — identificação da variante

**Não existe um único MEWS canônico.** Resultado da identificação de variante
(OBSERVED → INFERENCE):

1. **A V1 nomeia sua variante explicitamente**: Subbe CP, Kruger M, Rutherford P,
   Gemmel L. *Validation of a modified Early Warning Score in medical
   admissions.* QJM 2001;94(10):521-526 — citado em mews.py:22-25,
   threshold_resolver.py:45, 0038_seed_default_threshold_config.py:54-58
   (DOI `10.1093/qjmed/94.10.521`), e 0039_activate_mews_v3_0_0.py:13-19.
2. **O conjunto de parâmetros corresponde ao de Subbe**: cinco parâmetros (PAS,
   FC, FR, temperatura, AVPU), sem débito urinário — isso exclui as variantes
   estilo Stenhouse, que incluem débito urinário. A variante da V1 é, portanto,
   **CITADA (Subbe 2001), não caseira (home-grown)**, no nível do conjunto de
   parâmetros.
3. **Status de verificação da fonte primária — registrado honestamente.** A
   partir da página da editora (Oxford Academic,
   `https://academic.oup.com/qjmed/article/94/10/521/1558977`, obtida em
   2026-08-15), este revisor verificou: título/autores/periódico/ano; população
   do estudo ("709 medical emergency admissions", unidade de admissões médicas
   agudas de um District General Hospital, ou seja, **internações médicas
   adultas**); e o limiar de desfecho — "Scores of 5 or more were associated
   with increased risk of death (OR 5.4, 95%CI 2.8–10.7), ICU admission (OR
   10.9, 95%CI 2.2–55.6) and HDU admission (OR 3.3, 95%CI 1.2–9.2)" (citação
   mantida em inglês, texto literal da fonte). **A Tabela 1 (as faixas por
   parâmetro) está atrás do paywall do periódico e NÃO pôde ser obtida da fonte
   primária no momento da revisão.** A comparação por parâmetro abaixo,
   portanto, usa a tabela de Subbe 2001 comumente reproduzida, conforme
   transcrita na própria trilha de auditoria do repositório legado (docstrings
   de mews.py:22-25; 0039_activate_mews_v3_0_0.py:13-19), cruzada com o
   conhecimento de domínio deste revisor sobre a transcrição mais citada.
   **VALIDATION REQUIRED: obter o artigo original e verificar a Tabela 1
   célula a célula antes que qualquer especificação V2 cite essas faixas como
   SOURCE.**

Transcrição de Subbe 2001 mais citada, usada para comparação (rótulo: INFERENCE
+ VALIDATION REQUIRED, conforme acima): PAS ≤70:3, 71-80:2, 81-100:1, 101-199:0,
≥200:2 · FC <40:2, 41-50:1, 51-100:0, 101-110:1, 111-129:2, ≥130:3 · FR <9:2,
9-14:0, 15-20:1, 21-29:2, ≥30:3 · Temp <35:2, 35-38.4:0, ≥38.5:2 · AVPU
Alerta:0, Voz:1, Dor:2, Não responsivo:3.

## 3. Análise de discrepâncias — implementado vs. variante publicada (alegada)

Fiel à tabela de comparação em §2: PAS (exata); FR (`<=8` ≡ `<9` para entradas
inteiras); temperatura de 3 faixas (exata, incluindo a borda exclusiva <35.0:
35.0 em si pontua 0 — mews.py:142-147); escada AVPU A/V/P/U (exata); faixas de
FC 51-100/101-110/111-129/≥130 (exatas).

Discrepâncias e desvios (M-1 … M-7):

| # | Item | Implementado | Publicado (Subbe 2001, conforme §2) | Avaliação |
|---|---|---|---|---|
| M-1 | Entradas ausentes | Cada `None` contribui 0; metadados gerados e depois efetivamente descartados (ver §5) | O instrumento presume um conjunto de observações completo; não há regra publicada para entradas ausentes | **Coerção a zero — HAZ-0005.** Defeito mais grave; ver §5. |
| M-2 | Token AVPU desconhecido | Qualquer string não-A/V/P/U → **0, silenciosamente, sem marcador** (mews.py:162-164) | Não existe essa categoria | **Coerção de entrada inválida para o valor mais tranquilizador.** Concretamente alcançável: a API admite ACVPU `"C"` (schemas/vitals.py:13), então um paciente registrado com confusão nova pontua consciência 0 no MEWS (enquanto o NEWS2 pontua o mesmo token como 3). Contraste: o scorer do NEWS2 falha *alto* (não-"A" → 3); o do MEWS falha *tranquilizador*. |
| M-3 | FC exatamente 40 | `<=39:2`, `40-50 → 1` (mews.py:29-30, 67-70) | A tabela publicada tem uma lacuna: "<40" vs "41-50"; 40 não é coberto | Resolução deliberada da lacuna (40→1, a faixa mais branda), documentada em 0039_activate_mews_v3_0_0.py:16-19. Defensável, mas é uma **interpretação institucional, não conteúdo publicado** — deve ser declarada em qualquer especificação V2. |
| M-4 | Limiares de escalonamento | watch=3 / urgent=4 / critical=5, atribuídos a Subbe: "MEWS >=5 associated ... >=4 is the response-trigger threshold" (0038_seed_default_threshold_config.py:14-17, 50-58) | Verificado a partir do resumo: **≥5** é o limiar de associação validado. Não há "gatilho de resposta ≥4" nem watch=3 na fonte primária | **Atribuição incorreta.** Os cortes 4 e 3 são adições institucionais vestindo uma citação de Subbe. A direção é conservadora (alerta mais precoce), mas a alegação de proveniência é falsa e não deve ser importada como "ancorada em evidência". |
| M-5 | Regras de tendência | `compute_trend` primeiro-vs-último de ≥2 amostras (mews.py:229-247); ALERT-EWS-TREND delta ≥3 em 8h (ews_nrt_runner.py:322-356, não conectado; early-warning-scores.yaml) | Não faz parte de Subbe 2001 | Caseiro/UNCITED. O alerta de delta ≥3 é código morto (o runner não tem chamador em produção); a tendência/delta persistidos (vitals.py:255-277) são conteúdo de UI ativo. VALIDAR se desejado na V2. |
| M-6 | Gating populacional | Nenhum (nenhuma checagem de idade/gravidez/ambiente em nenhum ponto do caminho) | População do estudo: internações médicas adultas | Saída fora da população produzida silenciosamente. Alimenta VAL-0006/VAL-0007. |
| M-7 | Documentação da faixa de escore | Docstring alega faixa total "(0-15)" (mews.py:189) | O total máximo alcançável é 14 (PAS 3 + FC 3 + FR 3 + Temp 2 + AVPU 3) | Erro de documentação menor; indica que a faixa nunca foi derivada das faixas implementadas. |

Histórico de versões (OBSERVED): v1.0.1 → v2.0.0 → v3.0.0 corrigiu faixas
anteriormente infladas (FC/FR/hipotermia: 0007_seed_mews_v1_0_1.py:8-11) e depois
a tabela de temperatura e a borda FC-40 (0039_activate_mews_v3_0_0.py:8-19). O
`MEWS-v3.0.0` é registrado como **aprovado** em
`docs/audit/fullspectrum/CLINICAL_SIGNOFF.md` (linha RAT-MEWS-SUBBE-2001-R2,
"APROVADO", 2026-07-12) — mas esse mesmo documento registra que o aprovador é o
dono do código do repositório, autodeclarado como intensivista, sem registro
profissional/institucional verificável, e recomenda contra-assinatura formal para
uso regulatório (CLINICAL_SIGNOFF.md, "Nota de identidade e limites"). INFERENCE:
a trilha de ratificação do MEWS é mais coerente que a do NEWS2, mas ainda não
atende à barra de autoridade nomeada da V2 (`evidence-notation.md` §2 regra 3).

Unidades: FC bpm, PAS mmHg, FR incursões/min, temperatura °C ao longo de todo o
código (schemas/vitals.py:35-42) — consistente com o instrumento; nenhuma
conversão de unidade ocorre no scorer (um valor em °F seria classificado em
faixas de °C sem erro; os limites do schema de ingestão 25.0-45.0 °C mitigam
apenas na fronteira da API, schemas/vitals.py:38).

## 4. Avaliações obrigatórias específicas do NEWS2 — nota de aplicabilidade

Escala 1/Escala 2, o scoring de O2 suplementar e o tier de escore vermelho são
construções do NEWS2 e não têm contrapartida no MEWS; o MEWS conforme
implementado não contém nenhum componente relacionado a oxigênio
(OBSERVED, arquivo mews.py inteiro). A questão de mapeamento de consciência
análoga à do NEWS2 é a M-2 acima. Gatilho agregado: limiar do estudo ≥5 vs.
configurável implementado 3/4/5 — ver M-4; o mesmo risco de override sem piso se
aplica (threshold_resolver.py:50-117).

## 5. Coerção a zero do HAZ-0005 — rastreamento por entrada (OBSERVED a partir da fonte)

| Entrada | Caminho de entrada ausente | Comportamento | Veredito |
|---|---|---|---|
| heart_rate | mews.py:65-66 `return {"heart_rate": 0, "heart_rate_status": "missing"}` | 0 + marcador | **coagido a zero** (marcador descartado adiante) |
| systolic_bp | mews.py:91-92 | 0 + marcador | **coagido a zero** (marcador descartado) |
| respiratory_rate | mews.py:115-116 | 0 + marcador | **coagido a zero** (marcador descartado) |
| temperature | mews.py:137-138 | 0 + marcador | **coagido a zero** (marcador descartado) |
| avpu (None) | mews.py:159-160 | 0 + marcador | **coagido a zero** (marcador descartado) |
| avpu (token não mapeado) | mews.py:162-164 `avpu_map.get(upper, 0)` | 0, **sem nenhum marcador** | **entrada inválida coagida** — estritamente pior que o caminho None |

A soma ignora os marcadores por completo: `score_total = int(components.get("heart_rate", 0)
+ ...)` (mews.py:218-224). Com todas as entradas ausentes, a função retorna
`(0, {"algorithm_version": "MEWS-v3.0.0", "missing_components": [...5 itens]})` —
e a suíte de testes legada afirma exatamente isso como comportamento pretendido
(`test_calculate_mews_all_missing`: "Sem nenhum dado, score deve ser 0",
tests/test_mews.py:239-245; evidência de intenção, não de autoridade). O 0 é
persistido como um `ClinicalScore` real (vitals.py:295-307), classificado abaixo
de watch → contribuição de severidade "normal" (dashboard.py:84-90), com piso em
um leito `"normal"` (dashboard.py:114-115). Diferente do NEWS2, o MEWS *gera* os
metadados honestos — o defeito é que **nenhum consumidor os eleva a um contrato
de status**, que é precisamente o achado citado no HAZ-0005 ("Os metadados não
são elevados a um contrato de status de avaliação").

**Linhas decisivas: mews.py:218-224 (soma sobre zeros) e mews.py:162-164
(AVPU inválido silencioso → 0).** O HAZ-0005 é CONFIRMED para o MEWS nas cinco
entradas, mais um caminho de entrada inválida agravante que o hazard log ainda
não itemiza (proposto como achado compartilhado — ver `shared-findings.md` SF-3).

## 6. Veredito clínico — PROPOSAL — AWAITING NAMED CLINICAL REVIEW (reviewer: rodaquino-OMNI)

**Veredito: VALIDATE** (conforme `legacy-import-policy.md` §4). Racional
(INFERENCE a partir de §§2–5): as tabelas de faixas implementadas são
internamente coerentes e consistentes com a variante Subbe 2001 que a V1 alega —
este é o scorer *melhor transcrito* na família EWS legada — mas (a) as faixas
por parâmetro ainda não podem ser rastreadas até a fonte primária paywalled
(verificação em nível SOURCE pendente); (b) os limiares de escalonamento 3/4 são
mal atribuídos a Subbe (M-4); (c) os caminhos de coerção a zero e de AVPU
inválido silencioso tornam a implementação insegura como construída (§5); e
(d) no nível de portfólio, o CAND-0002 tem "VERY HIGH overlap with CAND-0001
(NEWS2)" e é "o caso mais claro do inventário ... para o passo
remove-one-and-recheck" (linha CAND-0002 de candidate-inventory.md) — então se o
MEWS deve existir na V2 é uma decisão de portfólio ainda em aberto. Se a decisão
de portfólio remover o MEWS, a classificação terminal correta é **SUPERSEDE**
(pela trilha do NEWS2), documentada para contexto; este registro deliberadamente
não antecipa essa decisão.

Elementos propostos para sobreviver a uma especificação V2 *se* o CAND-0002
prosseguir:

- As tabelas de faixas de cinco parâmetros de Subbe — RETAIN como conteúdo
  publicado **após** a verificação da Tabela 1 na fonte primária (VALIDATION
  REQUIRED bloqueante, §2.3), com a resolução da lacuna FC-40 declarada como
  decisão institucional (M-3).
- O limiar de associação de desfecho ≥5 com sua citação verificada — RETAIN.
- A ideia de marcadores de ausência por componente — TRANSFORM para o contrato
  de status de avaliação da V2 (`evaluation-status-semantics.md`): os
  marcadores devem *comandar o status*, nunca coexistir com uma soma 0.

Elementos propostos como REJECT: o fallback silencioso `avpu_map.get(upper, 0)`
(M-2); a atribuição a "Subbe" em watch=3/urgent=4 (M-4 — os limiares só podem
ser mantidos como parâmetros institucionais declarados); a soma sobre
componentes coagidos a zero (§5).

Pré-requisitos bloqueantes para a V2 (VALIDATION REQUIRED): verificação da
Tabela 1 na fonte primária; decisão de portfólio sobre a sobreposição
NEWS2-vs-MEWS (CAND-0001/0002); gating populacional (VAL-0006/VAL-0007);
janelas de frescor (VAL-0023 — a V1 pontua uma linha de sinal vital
atomicamente, sem política de frescor por entrada); re-ratificação por
autoridade clínica nomeada (o sign-off legado não atende a
`evidence-notation.md` §2 regra 3).
