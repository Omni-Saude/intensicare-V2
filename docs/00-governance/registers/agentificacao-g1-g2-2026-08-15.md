---
doc_id: AGENTIFICACAO-G1-G2-2026-08-15
status: OBSERVED
owner: rodaquino-OMNI — CEO e acionista principal (OMNI e AMH), médico intensivista
source: Decisões em sessão do titular nomeado, 2026-08-15, respondendo a quatro questões estruturadas do orquestrador de entrega (com opções e recomendações); INTENSICARE_V2_ORCHESTRATOR_PROMPT.md §5 (Gate G1), §6 (Gate G2), §3 regras 10/15, §20
date_collected: 2026-08-15
collector: orquestrador de entrega (escriba); decisões do humano nomeado
last_updated: 2026-08-15
---

# Ata — Agentificação dos Gates G1 e G2 (decisões AGT-1..AGT-4)

Registro de decisões tomadas **por humano nomeado** — rodaquino-OMNI, na
qualidade de autoridade constituída (DEC-G0-01..06; GDEC-0004) — em sessão de
2026-08-15, adaptando os Gates G1 e G2 para execução integral por agentes. O
orquestrador apresentou quatro questões com opções e recomendação explícita;
o titular escolheu por escrito. O orquestrador atua como escriba; nenhuma
decisão abaixo foi tomada por agente. Em AGT-3 o titular decidiu **contra** a
recomendação do orquestrador — a divergência está registrada, não suavizada.

## AGT-1 — Evidência do G1: substituto multi-fonte + risco aceito — DECIDIDA

**Escolha do titular: opção A (recomendada).** A observação humana direta de
usuários deixa de ser exigência de passagem do G1. Passa a valer como
evidência do gate o **dossiê substituto multi-fonte** produzido e verificado
por agentes: literatura de fatores humanos e fluxo de trabalho de UTI,
forense do legado já concluída, dados retrospectivos quando acessíveis, e as
hipóteses clínicas do titular **rotuladas como hipótese de especialista**
(jamais como observação). A ausência de observação direta é registrada como
**risco bloqueante formalmente ACEITO pelo titular** — exatamente a válvula
que o texto original do G1 prevê ("or the absence is explicitly accepted as
a blocking risk"). A observação real de usuários migra para o piloto
supervisionado (G8), onde ocorre por construção.

- **Supersessão:** a restrição de DEC-G0-05 ("o G1 continua exigindo
  participantes clínicos externos") fica **superseded quanto ao G1**; o
  princípio (conhecimento do titular = hipótese, não evidência de observação)
  permanece válido e é incorporado ao rótulo do dossiê.
- **Consequência sobre BLK-0013:** o campo deixa de ser exigência do G1; o
  bloqueador é **reclassificado de G1 para pré-piloto (G8)** — a cobertura
  ética continua obrigatória para qualquer campo futuro.
- **Risco registrado:** RISK-0013 (desenhar para um usuário imaginado).

## AGT-2 — Baselines perecíveis: reconstrução retrospectiva por dados — DECIDIDA

**Escolha do titular: opção A (recomendada).** Os baselines G2-VAL-0025 /
VAL-0035 passam a ser satisfeitos por **baseline retrospectivo derivado de
dados** (histórico Tasy/Gold da AMH, quando acessível): carga de alertas,
proxies de tempo-até-reconhecimento e desfechos, reconstruídos por agentes,
com vieses declarados linha a linha. A captura observacional de campo (B1–B4a
do protocolo) deixa de ser exigida; o protocolo do g1-kit permanece válido
como especificação da variante observacional, caso o titular venha a
comissioná-la antes do piloto.

- A perecibilidade muda de natureza: o que permanece perecível é apenas o
  período **pré-exposição** dos dados retrospectivos — o corte histórico deve
  ser fixado ANTES de qualquer exposição visível a clínicos, e o gatilho de
  perecibilidade do protocolo continua valendo para definir esse corte.
- Qualidade degradada vs. observação direta: ACEITA pelo titular; vieses
  (documentação ≠ realidade; ausência de interrupções/fadiga no dado
  retrospectivo) registrados em RISK-0013.
- Dependência honesta: o baseline retrospectivo depende de acesso a dados
  históricos reais → **continua atrás do parecer OS-16 e de DEC-G0-03** para
  qualquer dado não sintético. Agentificar não encurta essa dependência.

## AGT-3 — Aprovação do G2: 100% agentes, inclusive modo ACIONÁVEL — DECIDIDA

**Escolha do titular: opção B — CONTRA a recomendação do orquestrador** (que
recomendava reter um ato humano único para a promoção sombra→acionável). Fica
constituída **autorização permanente (standing authorization)** para que
agentes executem integralmente o Gate G2 — método de portfólio, pesos MCDA,
hard gates §6.2, pacote de release §6.4 — e promovam vias a modo
**acionável** sem assinatura humana por via, **sob as condições cumulativas
abaixo, que esta ata torna vinculantes**:

1. **Hard gates §6.2 INALTERADOS** — nenhum dos 11 critérios pode ser
   enfraquecido para viabilizar admissão (anti-padrão 10); a contagem
   continua saindo do gate, não de meta;
2. **Independência estrutural entre agentes (AGT-4)** satisfeita e provada em
   trilha imutável por via/versão;
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

- **Supersessão parcial:** §3 regra 15 ("clinical decision authority with
  accountable humans") e §20 ("a required approval would be self-approval")
  ficam emendados NESTE escopo: a autoridade responsável (accountable) passa
  a ser **rodaquino-OMNI por autorização permanente**, exercida através do
  mecanismo agentico condicionado acima — a accountability não desaparece,
  concentra-se no ato desta autorização. §3 regra 10 (autor ≠ aprovador)
  permanece válida, transposta para agentes via AGT-4.
- **Riscos registrados:** RISK-0012 (S5 — conteúdo clínico acionável sem
  aprovação humana por item; reserva jurídica ANVISA/SaMD/CFM/negligência
  reservada a AUTH-PRIVACY-LEGAL em G6/G8, conforme DEC-G0-03). A posição
  contrária do orquestrador fica registrada como INFERENCE divergente.
- **Gatilho de revisita:** primeiro parecer jurídico (OS-16), primeiro evento
  adverso em sombra ou piloto, ou entrada de qualquer segundo revisor clínico
  humano — qualquer um reabre esta decisão.

## AGT-4 — Independência entre agentes: painel adversarial N-de-M — DECIDIDA

**Escolha do titular: opção A (recomendada).** A independência autor ≠
aprovador do §4 é transposta para agentes assim: para cada artefato clínico
ou de gate, **autor**, **revisor** e **≥3 verificadores adversariais** são
agentes distintos, com contextos separados e lentes obrigatoriamente
diferentes (no mínimo: correção clínica contra fonte primária; segurança/
fail-closed; reprodutibilidade de vetores/dados). Instrução explícita de
REFUTAR; **maioria refuta = artefato morre** e volta ao autor. A composição
do painel, os vereditos e os modelos usados integram a trilha imutável do
artefato. Tier econômico jamais participa de conteúdo clínico (§0.5).

## Honestidade obrigatória — o que esta ata NÃO muda

1. A contagem de vias acionáveis hoje continua **0**: o bloqueio é de dados
   (G3/AMH — Observation vazia, sem vitais, sem MedicationAdministration, só
   `dev`), não de humanos. Agentificar G1/G2 remove atos humanos do caminho,
   não cria dados.
2. OS-16 continua sendo o único prazo externo e **ganha ainda mais
   centralidade**: além do dado real, agora também os baselines
   retrospectivos (AGT-2) e a exercibilidade da promoção acionável (AGT-3.4)
   dependem dele.
3. DEC-G0-03 (só dados sintéticos até parecer) permanece integral.
4. G3, G5, G6, G7 e G8 permanecem com seus donos e critérios atuais — esta
   ata trata apenas de G1 e G2.
5. Recomenda-se contra-assinatura do titular sobre esta ata (mesmo padrão da
   ata AQ-1..6), pois as decisões chegaram ao escriba por sessão interativa.

---

> **Nota do escriba (2026-08-15, posterior à ata — GDEC-0010):** o gatilho de
> revisita da AGT-3 — "entrada de qualquer segundo revisor clínico humano" —
> foi **DISPARADO** pela nomeação registrada em GDEC-0010 (Dr. Marcelo
> Villaca Lima, CRM-SP 112678). A revisita da AGT-3 está **ABERTA**, a
> conduzir pelo titular com o revisor nomeado; até sua conclusão, a
> autorização permanece nos termos desta ata — e segue **não exercível** de
> todo modo (condições 3-4). A contra-assinatura recomendada no item 5
> permanece **pendente**.

---

> **Contra-assinatura registrada em 2026-08-15 por decisão escrita do titular
> (GDEC-0011 item 1).** Eu, rodaquino-OMNI (autoridade constituída —
> GDEC-0004; revisor clínico — GDEC-0003), contra-assino as decisões
> AGT-1..AGT-4 desta ata como minhas, incluindo, com ciência expressa, a
> AGT-3 decidida **contra a recomendação do orquestrador** (RISK-0012, S5),
> sob as 7 condições cumulativas e os gatilhos de revisita nela nomeados.
> Regra de supersessão: os próprios gatilhos da ata. — *Transcrito pelo
> escriba por instrução escrita do titular.*
>
> **Revisita da AGT-3 (aberta por GDEC-0010) — CONCLUÍDA em 2026-08-15
> (GDEC-0011 item 2):** AGT-3 **APROVADA** pelo segundo revisor clínico
> nomeado, Dr. Marcelo Villaca Lima (CRM-SP 112678), conforme atestado por
> escrito pelo titular em sessão. A autorização permanece nos termos desta
> ata, agora ratificada também por segundo revisor clínico. Gatilhos
> remanescentes: **primeiro parecer jurídico** (OS-16 — pedido já enviado,
> GDEC-0011 item 3) e **primeiro evento adverso** em sombra/piloto.

---

> **Nota do escriba (2026-08-15, recepção do parecer):** o gatilho de
> revisita **"primeiro parecer jurídico"** foi **DISPARADO** — parecer OS-16
> recebido do Dr. Lucas Alves de Sousa (OAB/GO 45.457), favorável, com
> complementação de forma pendente (critérios OS-16 iii/iv; ver
> `../../11-security-privacy-compliance/lgpd-os16/parecer-os16-2026-08-15-recebido.md`).
> A revisita da AGT-3 está **ABERTA** (segunda revisita, gatilho distinto da
> anterior). Fail-closed até a revisita e a complementação: **a condição 4
> permanece NÃO satisfeita** e DEC-G0-03 permanece integral. Gatilho
> remanescente após esta: primeiro evento adverso em sombra/piloto.

> **Nota do escriba (2026-08-16, complementação recebida):** seções VII/VIII
> do parecer recebidas — critérios de conteúdo da OS-16 **satisfeitos**.
> A **condição 4 está satisfeita no plano jurídico**, sob as condicionantes
> por operação do próprio parecer; a exercibilidade prática segue barrada
> pela **condição 3** (G3 aprovado por via — hoje 0 vias). A **2ª revisita
> desta autorização segue ABERTA**, a conduzir pelo titular (com o 2º
> revisor), tendo o parecer completo como insumo.

> **Nota do escriba (2026-08-16 — GDEC-0012):** a **2ª revisita foi
> CONDUZIDA e a AGT-3 APROVADA** pelo titular em conjunto com o 2º revisor
> clínico (Dr. Marcelo Villaca Lima, CRM-SP 112678), tendo o parecer OS-16
> completo como insumo — autorização mantida nos termos desta ata e das
> condicionantes por operação do parecer. **Gatilho de revisita
> remanescente: primeiro evento adverso em sombra/piloto.** Exercício
> prático segue barrado pela condição 3 (G3 por via) e pelas condições 5-7.
