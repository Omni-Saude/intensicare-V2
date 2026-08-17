---
id: LEGREV-EWS-SHARED
title: Revisão legada de EWS — achados compartilhados entre escores (NEWS2 + MEWS) e disposição dos grep-hits
label: PROPOSAL
statement: >
  Achados comuns aos registros de revisão legada do NEWS2 e do MEWS, follow-ups de
  hazard-log propostos a partir de evidência source-verified, e a disposição de cada
  grep hit em docs/rules para conteúdo NEWS/MEWS/early-warning. PROPOSAL — AWAITING
  NAMED CLINICAL REVIEW (reviewer: rodaquino-OMNI).
provenance:
  source_repo: intensicare (legado V1, READ-ONLY) + intensicare-V2
  path_or_url: https://github.com/Omni-Saude/intensicare (hashes por arquivo em news2-review.md §0 e mews-review.md §0)
  commit_sha_or_version: 1dc1ea6cc83f1e01ca7b7ee70a511f3dbc47cd79 (HEAD legado no pin)
  section_or_lines: referências de linha por citação ao longo do documento
  date_collected: 2026-08-15
  collector: revisor forense de EWS legado (agente da Tarefa 1, ciclo-1); revisor responsável rodaquino-OMNI
  transformation: >
    traduzido EN→pt-BR, tranche 3, GDEC-0008 item 8 (síntese original do revisor entre
    os dois registros de revisão; nenhuma nova alegação de fórmula)
  confidence: alta
  owner: UNASSIGNED — VALIDATION REQUIRED
  validation_status: VALIDATION REQUIRED
links:
  requirements: [SAF-0001, SAF-0002, SAF-0006]
  hazards: [HAZ-0005]
  adrs: []
  tests: []
  pr: null
supersedes: null
superseded_by: null
---

> Traduzido EN→pt-BR em 2026-08-16 (GDEC-0008 item 8, tranche 3); original EN preservado no histórico git.

# Achados compartilhados — revisão legada de EWS (NEWS2 + MEWS)

Citações usam as tabelas de hash em `news2-review.md` §0 e `mews-review.md` §0.
Caminhos legados relativos a `https://github.com/Omni-Saude/intensicare`.

## SF-1 — A camada de alerta EWS orientada a eventos é código morto

OBSERVED: `ews_nrt_runner.py` implementa os quatro alertas EWS projetados
(NEWS2 ≥7 com cruzamento de borda + novo parâmetro vermelho; delta de tendência
NEWS2/MEWS ≥3 em 8h; elevação aguda de SOFA; prontidão para alta) e sua docstring
instrui "Call this from ingest_vitals()" (ews_nrt_runner.py:685), mas nenhum módulo
sob `src/` importa `process_ews_nrt` nem `process_ews_after_vital_insert` — apenas
os testes o fazem (grep, 2026-08-15). O alerting de produção é, portanto,
apenas-limiar-agregado (`alert_engine.py:50-59` via vitals.py:387-408).
Consequências: o tier de escore vermelho publicado do NEWS2 e os alertas de
tendência existem apenas como código inalcançável e YAML de design
(`docs/plan/_work/alerts/early-warning-scores.yaml`). Qualquer alegação V2 de que o
legado "tinha" alerting de escore vermelho ou de tendência é falsa no nível da
fiação (wiring). INFERENCE: testes legados que passam nesse runner são evidência de
intenção apenas e não validam nada sobre o comportamento implantado (consistente com
`legacy-import-policy.md` §3 item 8).

## SF-2 — Identidade de versão e trilhas de ratificação não são confiáveis

OBSERVED: as strings `algorithm_version` não identificam comportamento. O
NEWS2-v3.0.0 foi semeado/ratificado como "O₂ suplementar ativa automaticamente a
Escala 2" (0021_activate_news2_v3_0_0.py:7-12; 0029_ratification_record.py:13-15),
e então o código inverteu esse comportamento (news2.py:118-122, 275-280) com a
string de versão inalterada. `RAT-NEWS2-SCALE-2` está ausente da tabela aprovada em
`docs/audit/fullspectrum/CLINICAL_SIGNOFF.md`; a linha do MEWS
(RAT-MEWS-SUBBE-2001-R2) está aprovada ali, enquanto mews.py:19 ainda carrega
"pending clinical sign-off" — e mews.py:19 / 0039_activate_mews_v3_0_0.py:20-22
discordam de CLINICAL_SIGNOFF.md quanto a esse status. O próprio documento de
sign-off registra que o aprovador é o dono do código sem registro profissional
verificável. INFERENCE: nenhuma ratificação legada pode ser herdada; toda tabela de
faixas e todo limiar que entrar na V2 exige ratificação nova por uma autoridade
clínica nomeada, conforme `evidence-notation.md` §2 regra 3.

## SF-3 — Follow-up de hazard-log proposto: coerção de entrada inválida (além do HAZ-0005)

O HAZ-0005 cobre entradas *ausentes*. A revisão de fonte encontrou dois caminhos
*presentes-mas-inválidos* que coagem para o valor mais tranquilizador sem nenhum
marcador:

1. AVPU do MEWS: qualquer token que não seja A/V/P/U → 0 silenciosamente
   (`avpu_map.get(upper, 0)`, mews.py:162-164). Alcançável com o token ACVPU
   admitido pelo schema "C" (schemas/vitals.py:13): nova confusão pontua 0 no MEWS
   enquanto pontua 3 no NEWS2 a partir do mesmo payload.
2. AVPU HL7 MLLP: valores AVPU de OBX fora de A/V/P/U — incluindo "C" — são
   parseados para `None` (mllp_listener.py:200-204), que então pontua 0 em ambos
   os instrumentos. Dependente de caminho: o mesmo estado do paciente pontua
   diferente conforme a rota de ingestão.

PROPOSAL: registrar como novo hazard (token clínico inválido/não mapeável coagido
para o polo tranquilizador, inconsistência por rota) vinculado ao HAZ-0005 e à
semântica da família HAZ-0032 em `evaluation-status-semantics.md` §3.5 (estado
"invalid" — "um código não mapeável ... NÃO DEVE ser rebaixado (downgraded)").
Owner: UNASSIGNED — VALIDATION REQUIRED.

## SF-4 — Limiares configuráveis não têm piso clínico

OBSERVED: `threshold_config` resolve leito ≻ unidade ≻ tenant
(threshold_resolver.py:50-117); mutações são auditadas
(threshold_resolver.py:120-150), mas nada limita os valores que um operador pode
definir. A mitigação de segurança de facto para o tier de escore vermelho ausente
(NEWS2 watch=3 capturando qualquer parâmetro único pontuando 3, news2-review.md
D-6) desaparece silenciosamente se qualquer escopo elevar `watch_threshold`.
PROPOSAL para a V2: limiares de alerting vinculados a níveis de disparo publicados
são conteúdo clínico que exige o mesmo controle de mudança que tabelas de faixas —
configurabilidade, se mantida, precisa de pisos declarados e sign-off clínico por
mudança.

## SF-5 — Sem política de frescor ou completude na fronteira de scoring (VAL-0023)

OBSERVED: ambos os scorers pontuam quaisquer campos que coexistam em uma linha
`vital_sign`; não há janela de frescor por entrada, nem política de completude,
nem lógica de carry-forward em nenhum ponto do caminho de scoring (news2.py,
mews.py, vitals.py). A única lógica de staleness na família EWS vive nas buscas
de tendência/baseline do runner não conectado (janelas de 8h/24h,
ews_nrt_runner.py:481-531) e nos campos `staleness_max` do YAML de design que nada
aplica (early-warning-scores.yaml). Este é o insumo legado concreto para o
VAL-0023: frescor/invalidação precisa ser especificado por entrada e por escore na
V2; não há política legada a importar.

## SF-6 — Fronteira de instrumento adulto não é aplicada (VAL-0006 / VAL-0007)

OBSERVED: não existe nenhum gating de idade, gravidez ou ambiente de cuidado em
nenhum dos dois caminhos de scoring; o schema de ingestão não carrega nenhum campo
de data de nascimento ou idade (schemas/vitals.py:16-88), de modo que a aplicação
populacional não é sequer expressável nessa fronteira. SOURCE (relatório RCP 2017,
§2): o NEWS2 é "projetado para uso em pacientes com 16 anos ou mais e não é
recomendado para uso em crianças com menos de 16 anos nem durante a gravidez".
SOURCE (resumo da editora): a coorte do MEWS de Subbe 2001 é de internações
médicas adultas. Ambos alimentam as perguntas BLOCKING VAL-0006 e VAL-0007, sem
alteração.

## SF-7 — Intenção documentada contradiz a implementação em dados ausentes

OBSERVED: `VitalSignResponse` documenta `mews_score`/`news2_score` como "None se
dados insuficientes" (schemas/vitals.py:98-101), mas a implementação nunca retorna
None para dados insuficientes — ela retorna o inteiro coagido a zero
(news2-review.md §5, mews-review.md §5). O próprio contrato de API do sistema
legado declara o comportamento seguro enquanto o código faz o inseguro. Esta é
confirmação independente, em nível de fonte, da caracterização do HAZ-0005 como
"violação confirmada de intenção documentada".

## SF-8 — Disposição de cada grep hit em docs/rules (registro de completude)

`grep -ril "news\|mews\|early warning" docs/rules` (2026-08-15) retornou os
arquivos abaixo (todos [pin] no manifesto do ciclo-1). Cada um foi revisado quanto
a conter regras NEWS2/MEWS no escopo deste registro:

| Hit | Conteúdo | Disposição |
|---|---|---|
| `docs/rules/AUDIT-REPORT.md`, `docs/rules/ESCALATIONS.md` | Índice de auditoria/escalonamento; usa NEWS2/MEWS como âncoras publicadas para verificar *outras* regras | Apenas contexto; nenhuma regra de implementação NEWS2/MEWS. |
| `docs/rules/clinical-scoring/RULE-PIORA-CLINICA-001/-002/-003/-004/-005/-008/-009` e `docs/rules/alert-threshold/RULE-PIORA-CLINICA-010` | O sub-escore graduado proprietário "piora clínica", *comparado com* NEWS2 Escala 1/Escala 2/CVPU pelos extratores legados; RULE-PIORA-CLINICA-010 documenta sua violação de parâmetro-único-vermelho | **Fora de escopo aqui — um instrumento proprietário distinto, não NEWS2/MEWS.** Seus defeitos referenciados ao NEWS2 (p.ex. inversão de sinal de SpO2, lacuna de cobertura 81-87%, red-downgrade-por-sobrescrita) pertencem à tarefa de revisão da piora-clinica. Nenhuma lógica de scoring NEWS2/MEWS é implementada nessas regras. |
| `docs/rules/clinical-scoring/RULE-SEPSE-028/-029/-032/-035` | Critérios de rastreio de sepse citando limiares do NEWS2 como referências de suporte | Fora de escopo — revisão de regras de sepse. Nenhuma lógica NEWS2/MEWS implementada. |
| `docs/rules/extraction/phase1/BE-06.yaml`, `phase2/catalog/{sepse,piora-clinica}.yaml`, `phase3*/{sepse,piora-clinica}-batch*.yaml`, `phase1/phase1-summaries.json` | Planilhas de extração para as famílias de regras acima | Mesmas disposições de seus arquivos de regra. |

INFERENCE: as únicas *implementações* de NEWS2/MEWS no repositório legado são
`services/news2.py` e `services/mews.py` (mais seus pontos de chamada revisados nos
dois registros de revisão). Nenhuma fonte de implementação ficou sem localizar; a
condição de parada ("SOURCE NOT LOCATED") não foi disparada para nenhuma regra
revisada.

## SF-9 — Itens que esta revisão não conseguiu verificar (registrados honestamente)

1. "Esclarecimento de dezembro de 2022" do RCP: não encontrado nas páginas de
   recursos do RCP no momento da coleta (news2-review.md §2). Não citado;
   VALIDATION REQUIRED se for necessário.
2. Valores de célula da Tabela 1 de Subbe 2001: fonte primária paywalled,
   verificada apenas em nível de resumo (mews-review.md §2.3). VALIDATION
   REQUIRED bloqueante antes que qualquer especificação V2 rotule as faixas do
   MEWS como SOURCE.
3. `EWSScoreSnapshot.news2_components` (ews_nrt_runner.py:54) é declarado mas
   nunca populado — campo morto menor, anotado para completude.
