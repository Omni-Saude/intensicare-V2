---
doc_id: CYCLE-1-REVIEW-DECISION-SHEET
title: Ciclo 1 — Folha de decisão da revisão clínica nomeada (98 pontos de decisão)
status: PROPOSAL
owner: rodaquino-OMNI (revisor clínico nomeado, GDEC-0003); autor — orquestrador clínico (ciclo 1)
source: perguntas extraídas verbatim dos artefatos do ciclo 1 (specs §11/§13, ADRs, clinical-kpi-review §8, HANDOFF ciclo-1); recomendações são PROPOSAL do agente
date_collected: 2026-08-15
last_updated: 2026-08-15
provenance:
  source_repo: intensicare-V2
  path_or_url: docs/05-clinical-safety/ (corpus do ciclo 1, commit 63092ed)
  commit_sha_or_version: 63092ed
  section_or_lines: seções de questões abertas de cada artefato (citadas por linha em cada tabela)
  date_collected: 2026-08-15
  collector: orquestrador clínico (ciclo 1) — análise de apoio à decisão
  transformation: perguntas resumidas das seções-fonte; recomendações são análise nova (INFERENCE/PROPOSAL)
  confidence: high
  validation_status: VALIDATION REQUIRED — nenhuma linha decide nada; só o revisor nomeado decide
---

# Ciclo 1 — Folha de decisão da revisão clínica

**Como usar.** Cada linha é um ponto de decisão pendente do ciclo 1, com opções objetivas
e a recomendação do agente (coluna "Rec."). Marque a coluna **Decisão** com
**A** (aceito como recomendado), **M** (modificado — anote o quê) ou **R** (rejeitado),
com data. Nada aqui é DECIDED: uma marcação só vira decisão quando transcrita pelo
titular ao registro/artefato correspondente (evidence-notation §4). As recomendações
são PROPOSAL de agente autor — o autor não aprova nada.

**Prioridade máxima (item irreversível):** KPI-Q10 — comissionar o *baseline
pré-implantação* (G2-VAL-0025/VAL-0035). Perde-se para sempre após go-live.

**Princípios usados nas recomendações** (todos já propostos no corpus): rule 7
(nunca coagir ausência a zero/normal); INV-B (evidência parcial pode escalar, nunca
tranquilizar — ADR-0026); fail-closed por default; fidelidade à fonte primária com
adaptações locais sempre declaradas (ADR-0025); autor ≠ aprovador.

---

## 1. RULE-SOFA 0.1.0 — spec §11 (14 questões)

| # | Questão (resumo) | Opções | Rec. | Fundamento (1 linha) | Decisão |
|---|---|---|---|---|---|
| OQ-1 | Suporte respiratório p/ bandas 3-4: VMI+VNI/CPAP; HFNC? | (a) HFNC excluída (default) (b) HFNC incluída | **a** | Vincent 1996 antecede HFNC; incluir sem fonte seria adaptação não citável; vigiar literatura (SOFA-HFNC é debate aberto) | ☐ |
| OQ-2 | P/F <200 sem suporte → banda máxima satisfeita = 2 | (a) confirmar (b) outra leitura | **a** | Decorre da estrutura das bandas publicadas; não é herança do legado | ☐ |
| OQ-3 | Vasopressor: not_evaluated na 1ª hora de infusão nova, ou tier provisório? | (a) verbatim ≥1h, 1ª hora not_evaluated (b) tier provisório escalável na 1ª hora (adaptação declarada) | **b** | Choque em início de noradrenalina é disfunção CV *agora*; INV-B permite escalar, nunca tranquilizar; a cláusula 1h vira filtro anti-bolus | ☐ |
| OQ-4 | Terapia vasoativa combinada: máximo dos tiers | (a) confirmar max-of-tiers (b) outra | **a** | Convenção padrão; qualquer agente qualificante já define o piso | ☐ |
| OQ-5 | Agentes não tabelados (vasopressina, fenilefrina) | (a) not_evaluated (b) piso CV≥3 sinalizado, mapeamento com fonte = VALIDATION REQUIRED | **b** | Vasopressina em prática ≈ choque refratário a catecolamina; not_evaluated *tranquiliza* indevidamente (viola INV-B) | ☐ |
| OQ-6 | Unidades canônicas mg/dL (bili ÷17,104; creat ÷88,42) | (a) confirmar (b) µmol/L | **a** | Convenção laboratorial brasileira; fatores verificados por dois workstreams independentes | ☐ |
| OQ-7 | Renal: exigir ambos os insumos, ou creatinina-só como parcial declarado? | (a) ambos obrigatórios (b) pior-critério-disponível com flag do critério ausente; ambos ausentes → not_evaluated | **b** | Vincent usa creatinina OU débito urinário (pior); débito horário rigoroso é raro fora de BIC/SVD — exigi-lo mataria o componente sem ganho de segurança | ☐ |
| OQ-8 | GCS sob sedação: confirmar not_evaluated em RASS ≤−3/sedação ativa; decidir caso sedação desconhecida | (a) desconhecido = escora-com-divulgação (default do spec) (b) desconhecido = fail-closed | **b** | RASS ≤−3 sem informação de sedação é indistinguível de sedação profunda; fail-closed conjunto com RULE-GCS OQ-2 e ADR-0028 Q2 (uma só resposta para os três) | ☐ |
| OQ-9 | Janelas de frescor §3.2 + PAM derivada de PAS/PAD como fallback | (a) ratificar janelas + PAM derivada admissível (flag "derivada") (b) ajustar | **a** | Janelas alinhadas à convenção SOFA-diário; PAM=(PAS+2×PAD)/3 é padrão e melhor que ausência | ☐ |
| OQ-10 | Agregação pior-valor-em-24h | (a) ratificar (b) pontual | **a** | Convenção da literatura de SOFA seriado; pontual subestima flutuação | ☐ |
| OQ-11 | Carve-outs: paliativo, disfunção crônica, TSR, ECMO | (a) tudo excluído (b) computar com anotação: paliativo→supressão de escalonamento (HAZ-0044); crônico→limitação documentada; TSR→renal com flag "em TSR"; ECMO→resp. not_evaluated (P/F não interpretável em VV-ECMO) | **b** | Excluir tudo cria not_evaluated permanente sem valor; anotar preserva vigilância com honestidade interpretativa | ☐ |
| OQ-12 | Gate populacional ≥18 + population_unverified | (a) confirmar ≥18; unverified → not_evaluated | **a** | Consistente com ADR-0027 fail-closed; nunca presumir adulto | ☐ |
| OQ-13 | Excluir banda de mortalidade (D-18 legado) | (a) confirmar exclusão | **a** | Sem fonte citável; exibir risco de óbito sem validação é dano potencial puro | ☐ |
| OQ-14 | ΔSOFA fora do escopo 0.1.0 | (a) confirmar; futura release própria com convenção de baseline ratificada | **a** | Sem produtor de baseline evidenciado; Sepsis-3 exige baseline definido | ☐ |

## 2. RULE-NEWS2 0.1.0 — spec §11 (10 questões)

| # | Questão (resumo) | Opções | Rec. | Fundamento | Decisão |
|---|---|---|---|---|---|
| N-1 | Faixa 16-17 anos (RCP permite ≥16; V2 propõe ≥18) | (a) excluir (<18 → not_evaluated) (b) admitir 16-17 | **a** | Coerência com fronteira adulto-UTI (VAL-0006/0007) e um único gate etário no produto; revisitar se escopo adolescente abrir | ☐ |
| N-2 | Gravidez sem documentação | (a) sem doc ⇒ escora com anotação "gravidez não verificada"; gravidez documentada → not_evaluated (instrumento não validado; usar instrumento obstétrico) (b) fail-closed p/ coortes definidas | **a** | Fail-closed universal aniquila disponibilidade sem fonte de gravidez evidenciada; gravidez *conhecida* é a exclusão que importa | ☐ |
| N-3 | Metas de cuidado (HAZ-0044): gatear avaliação, exibição ou só anotar? | (a) computar sempre; suprimir só o *escalonamento* sob ordem de limitação documentada, com razão visível (b) gatear avaliação | **a** | O escore continua clinicamente informativo em conforto; o dano do HAZ-0044 está no acionamento, não no número | ☐ |
| N-4 | ACVPU: sem mapeamento GCS→ACVPU; anotação de sedação obrigatória em todo insumo de consciência? | (a) confirmar ambos (sem mapeamento; anotação obrigatória) | **a** | ACVPU é avaliação observada própria; alinhado a ADR-0028 Q4 | ☐ |
| N-5 | Janelas de frescor (1h/8h contínuos; 4h/24h intermitentes) + adaptação UTI de instrumento de enfermaria | (a) ratificar (b) substituir números | **a** | Cadência de UTI é mais densa que a da enfermaria da RCP; uso é advisory-only dentro do intended use proposto | ☐ |
| N-6 | Cadência de reconfirmação da ordem Scale-2 | (a) persistente no encontro; reconfirmação solicitada a cada 7 dias (não bloqueante, não expira sozinha) (b) expiração automática | **a** | Expiração silenciosa recriaria flip de escala sem ordem — o defeito legado invertido | ☐ |
| N-7 | Arredondamento em meio-passo exato | (a) arredondar para a banda *mais anormal* (b) half-away-from-zero | **a** | Único caso prático é temperatura; INV-B: empate resolve para vigilância, nunca para tranquilidade | ☐ |
| N-8 | Alguma política parcial futura para NEWS2? | (a) nunca — all-or-not_evaluated permanente (parâmetro-vermelho isolado já escala via INV-B) | **a** | RCP não define parcial; INV-B já cobre o único caso clinicamente urgente | ☐ |
| N-9 | Faixas de plausibilidade (§2.1) | (a) ratificar como v0.1, calibrar em shadow (b) substituir | **a** | Fail-closed em implausível; números marcados VALIDATION REQUIRED | ☐ |
| N-10 | Tolerância p/ duplicatas conflitantes | (a) tabela proposta: FC ±5 bpm, PAS ±10 mmHg, FR ±3 irpm, SpO2 ±3 p.p., T ±0,3 °C — dentro→pior valor; fora→invalid (VALIDATION REQUIRED) | **a** | Dentro da tolerância de dispositivo, o pior valor vigia; fora, é conflito real e não se escolhe às cegas | ☐ |

## 3. RULE-GCS 0.1.0 — spec §13 (10 questões)

| # | Questão (resumo) | Opções | Rec. | Fundamento | Decisão |
|---|---|---|---|---|---|
| G-1 | Vocabulário NT suficiente? | (a) acrescentar "barreira linguística" e "surdez" ao NT verbal; manter demais | **a** | Ambos invalidam V sem invalidar E/M; glasgowcomascale.org trata como não testável | ☐ |
| G-2 | Sedação desconhecida: escora-com-divulgação ou bloquear? | (a) escorar c/ divulgação (b) **fail-closed** (`sedation_state_unknown`), valendo junto p/ RULE-SOFA OQ-8 e ADR-0028 Q2 | **b** | Resposta única para os três artefatos; ver SOFA OQ-8 — RASS presente ≥−2 destrava a maioria dos casos reais | ☐ |
| G-3 | Condições de sedation_confounded + "coma não sedado escora" | (a) confirmar | **a** | RASS ≤−3 + exposição sedativa = confundido; coma estrutural sem sedação é achado real e deve pontuar | ☐ |
| G-4 | BNM ativo → três componentes NT | (a) confirmar | **a** | Sob bloqueio neuromuscular nada além de pupilas é testável | ☐ |
| G-5 | Frescor: 12h/24h; RASS 1h; contemporaneidade 30 min | (a) ratificar (quita VAL-0023 p/ GCS) | **a** | Alinhado ao RULE-SOFA; componentes de momentos distintos não somam | ☐ |
| G-6 | Total-apenas da fonte rejeitado p/ computação | (a) manter rejeição (exibição c/ proveniência apenas) (b) aceitar c/ divulgação | **a** | Total sem componentes não permite NT nem auditoria — é o modelo legado que se está rejeitando | ☐ |
| G-7 | Convenção "E4 V-NT(IOT) M6"; "10T" só apresentação | (a) confirmar | **a** | Guidance verbatim do emissor | ☐ |
| G-8 | Gate ≥18 + population_unverified | (a) confirmar | **a** | Consistente com ADR-0027 | ☐ |
| G-9 | Sem banda de severidade em 0.1.0 | (a) confirmar | **a** | Banda exigiria fonte nomeada própria | ☐ |
| G-10 | Sem mapeamento GCS→ACVPU (dois lados) | (a) confirmar; decisão futura pertence ao ADR-0028 + revisão conjunta das duas regras | **a** | Espelha RULE-NEWS2 N-4 | ☐ |

## 4. ADR-0007 — ciclo de vida de bundle (§11.3, 5 questões)

| # | Questão | Opções | Rec. | Fundamento | Decisão |
|---|---|---|---|---|---|
| A7-1 | Autor≠aprovador permanente mesmo com um só clínico? | (a) permanente, sem processo de exceção (b) exceção registrada p/ ciclo 1 | **a** | Conteúdo do ciclo 1 é autorado por agentes — o titular PODE aprová-lo; a exceção só seria necessária para conteúdo que o titular editar, e aí um 2º revisor é o controle certo | ☐ |
| A7-2 | "Mais sensível" definido por campo ou só por banda? | (a) tabela por campo no schema do bundle (banda→escala mais cedo; cooldown→menor; rate limit→maior) (b) só bandas | **a** | "Tighten" tem direção diferente por tipo de campo; sem tabela, o envelope é inaplicável | ☐ |
| A7-3 | Cadência default de aposentadoria/revisão | (a) 24 meses OU atualização de diretriz (o que vier antes); override por bundle (b) sem default | **a** | Vigilância do ADR-0025 já monitora as fontes; 24m é teto de segurança | ☐ |
| A7-4 | Assinatura dupla × ADR-0022 (custódia de chaves) | (a) manter alvo de contra-assinatura; slots agnósticos de mecanismo; custódia → ADR-0022 | **a** | Não bloquear o schema numa decisão de infraestrutura ainda não iniciada | ☐ |
| A7-5 | Autorização de shadow-mode: mesma autoridade? | (a) mesma autoridade clínica, instância de decisão própria + co-autorização privacidade/segurança (Gate G2) | **a** | Shadow toca dados reais → exige as pré-condições do G2 além da clínica | ☐ |

## 5. ADR-0008 — semântica de status (§12, 6 questões)

| # | Questão | Opções | Rec. | Fundamento | Decisão |
|---|---|---|---|---|---|
| A8-1 | Precedência P-a (invalid>not_evaluated>stale>partial>valid) vs P-b | **P-a** | — | "Stale" pressupõe conclusão válida anterior; sob incompletude ela nunca existiu | ☐ |
| A8-2 | Opção C-com-default-A vs A pura | **C-com-default-A** | — | Permite parciais ratificados por classe (ex.: renal creatinina-só, intervalo NT) sem abrir parcial genérico | ☐ |
| A8-3 | "conflicted": razão de invalid ou 6º estado? | (a) razão de invalid (b) 6º estado | **a** | Evita explosão de vocabulário; a razão fica visível na exibição | ☐ |
| A8-4 | Stale→not_evaluated no horizonte de expiração (2 limiares/insumo) | (a) confirmar | **a** | Valor velho demais não é "velho", é ausente | ☐ |
| A8-5 | Parâmetro-vermelho escala com total not_evaluated | (a) confirmar (já decidido em INV-B/ADR-0026) | **a** | Coerência entre os dois ADRs acoplados | ☐ |
| A8-6 | Redação pt-BR dos cinco estados | (a) válido / parcial / não avaliado / desatualizado / inválido → glossário ADR-0029 | **a** | "Não avaliado" nunca com vocabulário tranquilizador (lição HAZ-0005) | ☐ |

## 6. ADR-0026 — política de insumo ausente por classe (§12, 6 questões)

| # | Questão | Opções | Rec. | Fundamento | Decisão |
|---|---|---|---|---|---|
| A26-1 | Ratificar INV-B (assimetria escalar-nunca-tranquilizar) + salvaguardas de carga de alarme | (a) ratificar; medição em shadow como pré-condição de qualquer ativação | **a** | O risco simétrico (mais alarme) é mensurável; o assimétrico (falsa tranquilidade) já matou a confiança no V1 | ☐ |
| A26-2 | Componentes classe-2 exibíveis sem total; nomeação | (a) exibir como "Disfunção orgânica — componentes (X/6 avaliáveis)", linhagem SOFA no detalhe; nunca número somado | **a** | Informação real sem fabricar um "SOFA" que não existe | ☐ |
| A26-3 | Adotar GCS NT + convenção de total-com-NT | (a) adotar (= RULE-GCS) | **a** | Já especificado e fonte-verificado | ☐ |
| A26-4 | SIRS no portfólio? | (a) REJECT standalone; papel só como componente de composto sob VALIDATE próprio (b) manter | **a** | Especificidade pobre; Sepsis-3 abandonou SIRS como critério definidor | ☐ |
| A26-5 | Baselines Δ-escore: quem verifica literatura de carry-forward | (a) diferir ΔSOFA (OQ-14); verificação → metodologista de evidência quando ativado | **a** | Papel ainda não ativado; não bloquear 0.1.0 | ☐ |
| A26-6 | Lógica trivalente (Kleene) p/ todos os predicados | (a) ratificar engine-wide | **a** | Ausente=desconhecido, nunca falso — mata a família inteira de silent-no-fire do motor de trilhas | ☐ |

## 7. ADR-0025 — edições canônicas (7 questões)

| # | Questão | Opções | Rec. | Fundamento | Decisão |
|---|---|---|---|---|---|
| A25-1 | Ratificar as 4 linhas de edição canônica | (a) ratificar (NEWS2=RCP 2017; SOFA=Vincent 1996 via Sepsis-3; qSOFA=Singer 2016+restrição SSC 2021; MEWS=Subbe 2001 condicional) | **a** | Todas verificadas ao vivo exceto MEWS (condicional declarada) | ☐ |
| A25-2 | Assunção NEWS2/MEWS enquanto G2 pende | (a) assumir SUPERSEDE do MEWS pelo NEWS2; registro MEWS dormente (b) manter ambos | **a** | Sobreposição total de insumos, citação mais fraca, dois EWS = alarmes correlatos (PROMPT §6.3 penaliza) | ☐ |
| A25-3 | Verificação da Tabela 1 do Subbe | (a) moot sob A25-2; se MEWS voltar, tarefa do metodologista de evidência | **a** | Não gastar esforço em instrumento dormente | ☐ |
| A25-4 | qSOFA: GCS<15 vs ≤13 | (a) GCS<15 (definição do JAMA/Singer 2016), nota sobre a derivação de Seymour (≤13) | **a** | Fidelidade ao artigo definidor; <15 é mais sensível (INV-B-compatível) | ☐ |
| A25-5 | Restrição SSC-2021 (sem qSOFA isolado) vinculante? | (a) aceitar como vinculante no portfólio | **a** | Recomendação forte da diretriz vigente; o V1 standalone já levou REJECT | ☐ |
| A25-6 | Registro no adr-index (C7/C9) | (a) já concluído na integração do ciclo 1 — confirmar | **a** | Índice atualizado; próximo livre ADR-0030 | ☐ |
| A25-7 | Checagem regulatória brasileira (ANVISA/CFM/MS) agora ou depois? | (a) comissionar agora como ordem de serviço paralela (enquadramento SaMD) (b) diferir | **a** | Barata, paralela, e pode reformatar exigências de release antes que se cristalize arquitetura | ☐ |

## 8. ADR-0027 — gating etário/populacional (§11.1, 7 questões)

| # | Questão | Opções | Rec. | Fundamento | Decisão |
|---|---|---|---|---|---|
| A27-1 | ≥18 produto-wide vs ≥16 por instrumento | (a) ≥18 produto-wide; pisos por instrumento registrados, inativos | **a** | Um gate, uma verdade; coerente com N-1 | ☐ |
| A27-2 | Gravidez: fail-closed vs flagged | (a) = N-2 (anotação se não documentada; exclusão por instrumento se documentada e não validado) | **a** | Uma só política de gravidez no produto | ☐ |
| A27-3 | Care-setting no mesmo locus de enforcement? | (a) sim — mesmo gate pré-avaliação | **a** | Um choke point testável (prova por call-graph + CRVs adversariais) | ☐ |
| A27-4 | 4 carve-outs IU-07 | (a) obstétrica→fora (instrumentos próprios); ECMO/TSR→dentro c/ flags por componente; pós-cardíaca→dentro c/ anotação; paliativo→dentro, escalonamento suprimido (HAZ-0044) | **a** | Espelha SOFA OQ-11/N-3; nenhuma exclusão silenciosa | ☐ |
| A27-5 | Ponto único de avaliação (A4) verdadeiro? | (a) verificação de engenharia no primeiro slice; assumir p/ design | **a** | Verificável estaticamente; não é decisão clínica | ☐ |
| A27-6 | Híbrido A+B+C: ADR próprio? | (a) adotar híbrido como emenda deste ADR, sem ADR novo | **a** | O híbrido é refinamento, não decisão nova | ☐ |
| A27-7 | Teto de prevalência de not_evaluated | (a) sem teto agora; obrigação de medição + revisão em shadow | **a** | Número inventado hoje seria fabricação; a medição é o que falta | ☐ |

## 9. ADR-0028 — confusão por sedação (§11.1, 8 questões)

| # | Questão | Opções | Rec. | Fundamento | Decisão |
|---|---|---|---|---|---|
| A28-1 | Gatilho: disjunção (REV-NS-01) vs conjunção-com-exposição (SOFA-spec) | (a) conjunção: RASS ≤−3 **e** exposição sedativa → confundido; coma sem sedação escora | **a** | A disjunção rotularia coma estrutural como confundido — falso negativo de gravidade | ☐ |
| A28-2 | Sedação desconhecida | (a) escorar c/ divulgação (b) **fail-closed** (uma resposta p/ GCS+SOFA, ver G-2/OQ-8) | **b** | RASS ≥−2 presente resolve a maioria; o resto é indistinguível de sedação profunda | ☐ |
| A28-3 | Parcial por intervalo (NT contribui faixa completa) | (a) aceitar como única forma de parcial ratificado classe-4→2 | **a** | Não fabrica valor; decide só o que é decidível no intervalo | ☐ |
| A28-4 | NEWS2/MEWS consciência sob sedação | (a) escore marcado "confundido", nunca valid sem qualificação; sem supressão | **a** | ACVPU sedado é estado real (direção do erro = mais alarme, aceitável por INV-B) | ☐ |
| A28-5 | Limiar RASS −3 vs −4 | (a) −3 (PADIS) (b) −4 (precedente CAM-ICU) | **a** | −3 é mais conservador (marca mais confusão); o −4 do CAM-ICU serve a outra pergunta (avaliabilidade de delirium) | ☐ |
| A28-6 | Último GCS pré-sedação: exibição | (a) display-only, idade máx. 72h, timestamp visível | **a** | Contexto útil; nunca entra em cômputo | ☐ |
| A28-7 | Frescor GCS 12h/24h; RASS 1h | (a) ratificar (= G-5) | **a** | Coerência entre artefatos | ☐ |
| A28-8 | Exibição "E4 V-NT M6" + redação pt-BR ("não testável — NT") | (a) ratificar; entrada de glossário via ADR-0029 | **a** | = G-7 | ☐ |

## 10. ADR-0029 — terminologia pt-BR (6 questões)

| # | Questão | Opções | Rec. | Fundamento | Decisão |
|---|---|---|---|---|---|
| A29-1 | SNOMED CT Brasil: licenciamento não verificado | (a) prosseguir LOINC/UCUM-only; comissionar verificação | **a** | Nenhum fato de licenciamento pode ser presumido | ☐ |
| A29-2 | 2º revisor de linguagem necessário? | (a) não na fase sintética; obrigatório antes de qualquer exposição a clínico real | **a** | Proporcionalidade: o risco de linguagem só se materializa com usuários | ☐ |
| A29-3 | Tradução retroativa DEC-G0-10: paralela ou bloqueante? | (a) paralela, não bloqueante; traduzir na próxima revisão material de cada doc | **a** | Corpus EN do ciclo 0/1 é evidência válida; bloquear não compra segurança | ☐ |
| A29-4 | Pinagem de terminologia (ADR-0013 not-started) | (a) semear ADR-0013 só com versões LOINC/UCUM no próximo ciclo | **a** | Desbloqueia o passo de consistência sem esperar FHIR completo | ☐ |
| A29-5 | CI string-lint: dono | (a) backlog do engenheiro de supply-chain/CI; não agora | **a** | Ferramenta sem strings ativas ainda não protege nada | ☐ |
| A29-6 | Escopo: texto MCP/erros de API? | (a) incluir todo texto visível a clínico (incl. MCP/alertas); excluir erros de API de desenvolvedor | **a** | O critério é quem lê, não onde vive | ☐ |

## 11. clinical-kpi-review.md §8 (12 questões)

| # | Questão | Opções | Rec. | Fundamento | Decisão |
|---|---|---|---|---|---|
| K-1 | Ratificar mapeamento de verdictos (34+31) | (a) ratificar | **a** | 0 cálculos legados importados; base forense completa | ☐ |
| K-2 | TF-002 direção + composto de transfusão | (a) direção restritiva (alerta em transfusão ACIMA do gatilho restritivo sem indicação documentada); composto suspenso | **a** | Alinha à prática restritiva (TRICC/diretriz); o V1 estava invertido | ☐ |
| K-3 | Censo crítico: exibição | (a) contagens separadas com igual proeminência ("X críticos avaliados + Y não avaliáveis"); nunca combinadas | **a** | Combinar reconstrói o HAZ-0005 como KPI | ☐ |
| K-4 | Pisos numéricos (fração válida mín., n mín., janelas) | (a) partida: fração válida 70%, n≥30 p/ taxas; calibrar em shadow (VALIDATION REQUIRED) | **a** | Valores de partida declarados são revisáveis; ausência de piso não é | ☐ |
| K-5 | Banding NEWS2 + janelas de staleness p/ KPIs | (a) reutilizar as janelas do RULE-NEWS2 (1h/8h) | **a** | Uma fonte de verdade para frescor | ☐ |
| K-6 | Dia 7-às-7 vs civil; fuso; âncoras LOS | (a) dia civil 00:00-24:00 no fuso do sítio; LOS ancorado em timestamps documentados de admissão/alta; convenção censitária local = decisão de sítio | **a** | Simplicidade auditável; 7-7 só se o censo institucional exigir | ☐ |
| K-7 | Quais dos 31 conceitos reentram + prioridade | (a) nenhum no ciclo 2; reentrada individual só quando existir fonte de dados própria; infecção/SMR por último (exigem ajuste de risco) | **a** | Reentrar sem fonte recriaria indicadores fabricados | ☐ |
| K-8 | 6 macro-nomes (incl. "vidas_salvas") | (a) DROP definitivo (fórmulas Tasy inverificáveis; "vidas salvas" não é KPI mensurável) (b) perseguir fórmulas | **a** | Custo alto, valor clínico nulo, risco reputacional | ☐ |
| K-9 | Rubrica de deterioração + base legal | (a) comissionar junto à pesquisa G1; pré-registrar | **a** | Sem rubrica pré-registrada o desfecho é inauditável | ☐ |
| K-10 | **Baseline pré-implantação (IRREVERSÍVEL)** | (a) **comissionar AGORA** (G2-VAL-0025/VAL-0035) (b) adiar | **a** | Perdido para sempre após go-live; nada tecnicamente o bloqueia | ☐ |
| K-11 | Admissibilidade de parcial por KPI | (a) nenhum parcial em v1; DC(K) já expõe incompletude | **a** | Parcial em KPI é o denominador-que-encolhe com outro nome | ☐ |
| K-12 | Canal independente de detecção de contenção | (a) diferir até existir fonte; manter documentação-based com viés anotado | **a** | Sem fonte, "independente" seria ficção | ☐ |

## 12. Portfólio, gates e reconciliações (7 pontos)

| # | Item | Opções | Rec. | Fundamento | Decisão |
|---|---|---|---|---|---|
| P-1 | Ratificar movimentos de gate §7 (G3/G6/G7/G8 FAIL→PARTIAL; G4 FAIL; contagem acionável 0) | (a) ratificar como revisados | **a** | PARTIAL nunca conta para admissão (definição no próprio §7) | ☐ |
| P-2 | CAND-0010..0020 identificados-não-admitidos | (a) reconhecer como inventariados | **a** | Fecha INV-GAP-1 sem admitir nada | ☐ |
| P-3 | Colisão de namespace CRV (SOFA/NEWS2 = 01xx) | (a) prefixo por regra (CRV-SOFA-…, CRV-NEWS2-…, CRV-GCS-…); steward renumera na próxima revisão | **a** | Fix estrutural; impossibilita a próxima colisão | ☐ |
| P-4 | Idioma misto (ADR-0027/0028 + corpus forense em EN) | (a) traduzir os 2 ADRs na próxima revisão material; corpus forense permanece EN como evidência | **a** | = A29-3; tradução de evidência não gera segurança | ☐ |
| P-5 | Contradição de licença do legado (AGPLv3 boilerplate × "Proprietary") | (a) encaminhar ao parecer jurídico (G6/G8, OS-16); nenhum código copiado → sem ação imediata | **a** | Conclusão jurídica é reservada; a exposição atual é zero por re-derivação | ☐ |
| P-6 | Verdicto OSMS BLOQUEADO (polaridade booleana trilhas) | (a) atribuir ao workstream de engine do próximo ciclo | **a** | Exige ruling de engine, não clínico | ☐ |
| P-7 | Repos upstream não montados (NL-1: ahlabs-trilhas@8166c07e, trilhas-frontend) | (a) solicitar montagem read-only no próximo ciclo p/ re-verificação amostral das 959 citações | **a** | Fecha a única ressalva de proveniência sistêmica do corpus | ☐ |

---

## Resumo executivo das recomendações (para leitura em 2 minutos)

1. **Uma resposta única de sedação** (SOFA OQ-8 = GCS G-2 = ADR-0028 A28-2): RASS
   pareado obrigatório; RASS ≥−2 → testável; RASS ≤−3 com sedação ativa ou
   desconhecida → `sedation_confounded`/`not_evaluated`; coma documentadamente não
   sedado escora. *Deliberadamente mais estrita que o default "escora-com-divulgação"
   dos specs* — é a única divergência material entre esta folha e o corpus.
2. **INV-B em todo lugar**: 1ª hora de vasopressor escala (OQ-3b), agente não tabelado
   pisa em CV≥3 (OQ-5b), empates arredondam para o anormal (N-7), parâmetro-vermelho
   escala com total não avaliado.
3. **Sem parciais genéricos**: só os três parciais *nomeados* — renal
   pior-critério-disponível (OQ-7b), intervalo-NT (A28-3), componentes classe-2 sem
   total (A26-2).
4. **Portfólio enxuto**: MEWS dormente (SUPERSEDE), SIRS standalone REJECT, qSOFA
   nunca isolado, banda de mortalidade excluída, 31 indicadores mortos, "vidas_salvas"
   DROP.
5. **O único item com relógio**: K-10 — comissionar o baseline pré-implantação agora.

*Autor: orquestrador clínico (ciclo 1). Esta folha não decide nada; cada linha aguarda
a marcação do revisor nomeado e a transcrição correspondente ao registro/artefato.*
