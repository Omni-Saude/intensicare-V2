---
id: LGPD-OS16-Q09-RIPD-INDICE-CROSS-PJ
title: RIPD — Relatório de Impacto à Proteção de Dados do índice de correspondência cross-PJ (parecer OS-16, Q-09)
label: PROPOSAL
statement: >
  Minuta de Relatório de Impacto à Proteção de Dados (LGPD, art. 38; art. 5º,
  XVII) do índice de correspondência de identidade entre pessoas jurídicas do
  grupo (ADR-043, lado AMH), exigido pelo parecer jurídico OS-16 (item II,
  condicionante 3; Q-09) como ato PRÉVIO ao primeiro apply do índice. Redigida
  antes de qualquer tratamento de dado real — nenhum dado real foi acessado.
  Este documento é PROPOSAL para aprovação privacy/legal futura; não alega
  conformidade regulatória, não emite juízo jurídico, não fecha gate,
  bloqueador, risco ou hazard, e nada aqui é DECIDED.
provenance:
  source_repo: intensicare-V2
  path_or_url: docs/11-security-privacy-compliance/ripd-indice-cross-pj.md
  commit_sha_or_version: 33c749afd0f4cf82c06202aa3ec8c79702c2cde9 (HEAD de cycle-6/construcao-g7 na redação; este arquivo ainda não commitado)
  section_or_lines: documento inteiro
  date_collected: "2026-08-16"
  collector: especialista de privacidade e conformidade (SPR-G6-7, ciclo 6)
  transformation: >
    consolidação — o conteúdo descritivo e as condicionantes são citações e
    resumos fiéis do parecer OS-16 recebido, da minuta OS-16 (que transcreve o
    ADR-043 da AMH) e da política de identidade interina; o conteúdo novo é a
    formulação dos controles negativos CN-01..CN-10 e a estrutura do RIPD,
    ambos rotulados PROPOSAL. A leitura jurídica pertence ao parecer OS-16.
  confidence: medium
  owner: UNASSIGNED — VALIDATION REQUIRED
  validation_status: VALIDATION REQUIRED
last_updated: "2026-08-16"
links:
  requirements: []
  hazards: []
  adrs: []
  tests: []
  pr: null
supersedes: null
superseded_by: null
---

# RIPD — Relatório de Impacto à Proteção de Dados: índice de correspondência cross-PJ (PROPOSAL)

> **Natureza deste documento.** Minuta de RIPD (LGPD, art. 38; definição no
> art. 5º, XVII) do índice de correspondência de identidade entre PJs do grupo
> (ADR-043, hospedado e operado do lado AMH), redigida para cumprir a
> condicionante 3 do parecer OS-16, item II, com o conteúdo mínimo indicado na
> resposta Q-09: *"descrição do índice, finalidade,
> necessidade/proporcionalidade, riscos aos titulares, salvaguardas e vedações
> do §5º"*. Este documento é **PROPOSAL**: aguarda revisão e aprovação por
> encarregado(a)/DPO, pelo jurídico e pelos controladores envolvidos. Ele
> **não** alega conformidade regulatória, **não** emite juízo jurídico (a
> leitura jurídica é do parecer OS-16, sob os limites das suas seções VII e
> VIII), **não** fecha nenhum gate, bloqueador, risco ou hazard, e **não**
> autoriza tratamento algum. Rótulos epistêmicos conforme
> `docs/00-governance/evidence-notation.md` §2.

PREMISSA (reversível, GDEC-0015/0017): este RIPD adota como conteúdo mínimo o
indicado no parecer OS-16 (Q-09) e formula as vedações do art. 11, §5º como os
controles negativos verificáveis CN-01..CN-10 da seção 8; a formulação vale
como base para construção e testes até aprovação, correção ou rejeição por
privacy/legal e pelo titular.

---

## 0. Estado factual na redação — nenhum dado real foi acessado

OBSERVED (repositório `intensicare-V2` em 2026-08-16):

1. **O primeiro apply do índice não ocorreu.** O ADR-043 (AMH) condiciona o
   primeiro apply ao parecer DPO/jurídico; o parecer OS-16 foi recebido e
   acrescentou condicionantes cumulativas — entre elas **este RIPD prévio** —
   que ainda não estão satisfeitas (parecer OS-16, item II; "Análise de
   conformidade ATUALIZADA", efeito 1).
2. **Nenhum dado real foi acessado** por qualquer trilha do IntensiCare V2.
   Todo dado no repositório e na fatia de construção G7 é **sintético**,
   marcado `SYNTH-`, e o CI de conteúdo proibido
   (`scripts/check_forbidden_content.py`) reprova padrões de CPF formatado e
   de PSR real em todo o corpo documental.
3. Este RIPD é, portanto, **anterior ao tratamento que descreve**: ele avalia
   um desenho decidido em ADR e condicionado por parecer, não uma operação em
   curso. É exatamente a ordem que o art. 38 pressupõe e que o parecer exigiu
   ("RIPD **prévio** ao primeiro apply").

---

## 1. Exigência que este documento atende

SOURCE (`docs/11-security-privacy-compliance/lgpd-os16/parecer-os16-2026-08-15-recebido.md`,
item II, condicionantes — verbatim, condicionante 3):

> "**RIPD prévio** ao primeiro apply, com o conteúdo mínimo que indico no
> item VI (Q-09)"

SOURCE (mesmo arquivo, item VI, Q-09):

> "Sim, RIPD prévio: descrição do índice, finalidade,
> necessidade/proporcionalidade, riscos aos titulares, salvaguardas e vedações
> do §5º."

SOURCE (mesmo arquivo, "Análise de conformidade ATUALIZADA", efeito 5): o
"RIPD do índice" é listado como trabalho novo criado pelas condicionantes do
parecer.

INFERENCE (das três fontes): o RIPD exigido tem sete blocos — descrição
(seção 2), finalidade (seção 3), base legal (seção 4),
necessidade/proporcionalidade (seção 5), riscos aos titulares (seção 6),
salvaguardas (seção 7) e as vedações do §5º formuladas de modo verificável
(seção 8). Este documento segue essa estrutura.

---

## 2. Descrição do tratamento

### 2.1 O que é o índice

SOURCE (`docs/11-security-privacy-compliance/lgpd-os16/minuta-parecer-os-16.md`
§3.1, transcrevendo `ADR-043@0a07a6f1` L34-46):

> "O cruzamento vive numa estrutura **própria**, que guarda apenas pares:
> `(tenant_a, mpi_id_a) <-> (tenant_b, mpi_id_b) + score + origem + revisor + data`
> … **O que o índice não contém, e é o ponto:** CPF, nome, data de nascimento
> ou qualquer identificador direto. Nem em claro, nem em hash. Ele correlaciona
> identidades **já resolvidas** dentro de cada tenant; não reconstrói a
> pessoa."

O índice é, portanto, uma tabela de correspondência mínima: cada linha afirma
que a identidade `mpi_id_a`, resolvida dentro do tenant `tenant_a`, e a
identidade `mpi_id_b`, resolvida dentro do tenant `tenant_b`, referem-se à
mesma pessoa natural, com escore de confiança, origem do pareamento
(determinístico ou probabilístico), revisor humano (quando aplicável) e data.

### 2.2 Onde vive e quem acessa

SOURCE (minuta §3.1, de ADR-043 L53-70): o pareamento ocorre num **job de
matching** que "roda com role dedicada, fora das roles de tenant", "lê os
atributos de matching, produz os pares e **não persiste** os atributos"; o
acesso é governado por grant explícito e separado no Lake Formation — "Nenhum
consumidor herda acesso ao índice por ser de um dos tenants pareados".

SOURCE (parecer OS-16, item II, condicionante 5): "acesso ao índice restrito,
registrado e segregado do lago analítico".

O índice vive **exclusivamente do lado AMH**. Ele não é hospedado, copiado,
cacheado nem derivado por nenhum outro sistema do grupo — em particular, não
pelo IntensiCare V2 (ver §2.6).

### 2.3 Como um par nasce, vive e é revogado

SOURCE (minuta §3.1, de ADR-043 L72-79): pareamento **determinístico** entra
com escore 1.0; pareamento **probabilístico** (Splink) "entra como
**proposta**, nunca como vínculo", e só se torna par ativo após **revisão
humana** no Steward UI, com revisor e data gravados.

SOURCE (parecer OS-16, item II, condicionante 4; Q-10): a revogação de
correspondência se dá por **tombamento carimbado** — registro de revogação com
data e autor — e não por exclusão física da linha, para preservar
auditabilidade (arts. 6º, X, e 37): "exclusão física destrói a trilha
exigível".

### 2.4 Agentes de tratamento e papéis (a formalizar em instrumento próprio)

SOURCE (parecer OS-16, Q-02): alocação de papéis **por operação**, em anexo
próprio do instrumento do art. 39 — "PJs clínicas = controladoras do
prontuário; operadora = controladora dos dados de plano; AMH = operadora
(infraestrutura de dados); V2 = operadora no laço clínico".

SOURCE (parecer OS-16, item II, condicionante 2): **instrumento escrito entre
os controladores** envolvidos (PJs clínicas, operadora e AMH), com alocação de
papéis por operação, **antes do primeiro apply**.

OBSERVED (parecer OS-16, seção VII): a **redação** do instrumento do art. 39 e
do instrumento entre controladores está expressamente **fora** do que o
parecer cobre — o parecer afirma a exigência, não elabora os textos. Esses
instrumentos são pré-condição independente deste RIPD e permanecem pendentes.

### 2.5 Categorias de dados e titulares afetados

SOURCE (parecer OS-16, item II, condicionante 1; Q-05): o par de
correspondência é **dado pessoal sensível**, "por revelar vínculo
assistencial" — quando um dos tenants é PJ clínica e o outro é a operadora, a
existência do par afirma que determinada pessoa é simultaneamente paciente
daquele prestador e beneficiária daquele plano. Aplica-se o regime do art. 11
**por inteiro**.

Titulares afetados: pacientes das PJs clínicas do grupo que também são
beneficiários da operadora, e em especial a população com atendimento em mais
de uma PJ. SOURCE (`docs/08-interoperability/amh-data/identity-adjudication/interim-identity-policy.md`,
IDP-03, citando ADR-041 L22): a população multi-PJ medida é de **4.220
pacientes (3,88%)**.

Dados contidos no índice: pares `(tenant, mpi_id)`, escore, origem, revisor,
data — e os registros de tombamento de revogação. **Não** contém CPF, nome,
data de nascimento nem qualquer identificador direto, em claro ou em hash
(§2.1); os atributos usados pelo job de matching **não são persistidos**
(§2.2).

### 2.6 Relação com o IntensiCare V2 — tratamentos distintos, separação por desenho

SOURCE (minuta §1, premissa P-7): "O índice do ADR-043 e o loop clínico do
IntensiCare são **tratamentos distintos, com finalidades distintas**, e a V2
nunca hospeda nem deriva o índice."

SOURCE (interim-identity-policy.md, IDP-09 — situação após 2026-08-15:
**política permanente**): "A V2 nunca constrói, hospeda, importa, cacheia ou
deriva estrutura de correspondência cross-PJ. Se um dia houver contexto
cross-PJ, ele chega por interface AMH mediada, purpose-bound e filtrada —
nunca por claim de token, nunca por join local."

SOURCE (interim-identity-policy.md, IDP-04 — política permanente): a V2 jamais
faz join, correlação, deduplicação ou inferência de mesmidade entre PJs,
tenants ou partições com base em CPF, CNS, nome, data de nascimento, nome da
mãe, telefone, endereço, ou qualquer combinação ou hash — **mesmo quando os
valores estão presentes e são idênticos**. SOURCE (IDP-03 — política
permanente): a V2 chaveia fatos clínicos pelo par `(PSR, encontro)` dentro de
um único tenant, e nenhuma superfície pode sugerir completude entre
instituições.

O laço clínico da V2 tem condicionante própria no parecer (item III.1; Q-15):
caráter consultivo documentado e verificável. Caráter consultivo dos escores e
alertas: documentado e com plano de verificação em
`docs/11-security-privacy-compliance/evidencia-carater-consultivo.md` (EC-R1;
trilha de revisão humana do ADR-0009 W1–W12; mapeamento EC-M1..M10), conforme
condicionante do parecer OS-16, item III.1 e Q-15.

INFERENCE (de P-7 + IDP-03/04/09): a separação entre o índice e o laço clínico
não é promessa operacional — é propriedade de desenho com regras permanentes e
verificação prevista dos dois lados. Este RIPD descreve o tratamento do
índice; o laço clínico tem a sua própria trilha de evidência e não é objeto
deste relatório.

---

## 3. Finalidade

SOURCE (parecer OS-16, item II): a criação e a manutenção do índice são
lícitas "**para a finalidade exclusiva de continuidade assistencial** do mesmo
paciente entre pessoas jurídicas do grupo — **e somente para ela**".

SOURCE (parecer OS-16, Q-06): base e finalidade devem ser registradas "em
emenda ao ADR-043 (que hoje não nomeia artigo)" — ato do lado AMH, pendente.

SOURCE (parecer OS-16, Q-14): a ausência, no art. 11, de equivalente ao art.
7º, §7º, é lida como **restritiva** — "nova finalidade, nova base". Qualquer
uso do índice fora da continuidade assistencial exige base legal própria,
avaliação própria e novo RIPD; e há usos que **nenhuma** base legal autoriza
(seção 8).

---

## 4. Base legal

SOURCE (parecer OS-16, item II): **art. 11, II, "f" (tutela da saúde)**, para
a finalidade exclusiva de continuidade assistencial, sob **condicionantes
cumulativas**: (1) regime integral do art. 11 por se tratar de dado sensível;
(2) instrumento escrito entre controladores antes do primeiro apply; (3) RIPD
prévio — este documento; (4) revogação por tombamento carimbado; (5) acesso
restrito, registrado e segregado do lago analítico.

SOURCE (parecer OS-16, Q-01): o controle societário comum **não** converte a
circulação entre PJs em "circulação interna": "há uso compartilhado entre
controladores distintos (art. 5º, XVI)". Cada controlador responde pela sua
parte, e a alocação de papéis é a do §2.4.

Registro de honestidade epistêmica: OBSERVED — a minuta técnica (§3.3,
PROPOSTA A-1) havia sustentado que a hipótese "f" era duvidosa para o índice
enquanto estrutura permanente; o **parecer**, que é a leitura jurídica
competente, concluiu pela licitude sob a "f" **na forma minimalista decidida e
sob as condicionantes acima**. Este RIPD adota a conclusão do parecer e
preserva a divergência da minuta como parte da trilha de análise — ela é
insumo para os gatilhos de revisita (seção 11), não posição deste documento.

---

## 5. Necessidade e proporcionalidade

1. **Adequação.** INFERENCE (de §2.5): existe população mensurada — 4.220
   pacientes (3,88%) com atendimento em mais de uma PJ — cujo cuidado se
   fragmenta entre instituições. A correspondência de identidade é o meio
   técnico que permite, quando e se autorizado por interface mediada, dar
   continuidade assistencial a essa população.
2. **Minimização.** SOURCE (§2.1-2.2): o índice guarda **apenas** pares e
   metadados de pareamento; não contém identificador direto, em claro ou em
   hash; os atributos de matching não são persistidos; correlaciona
   identidades já resolvidas em vez de reconstruir a pessoa. INFERENCE (minuta
   §3.2.1): isso é medida de minimização, não descaracterização — o par
   permanece dado pessoal (sensível), e é assim que este RIPD o trata.
3. **Alternativas consideradas.**
   - **MPI global** (rejeitado): SOURCE (minuta §3.1, de ADR-043 L46-51) — já
     existiu um índice pré-separação com 252 mil golden records de todas as
     PJs, que permitiu, até 2026-07-29, que um agente de qualquer tenant
     resolvesse o `mpi_id` de qualquer outro. O desenho atual existe para
     **não** recriar essa propriedade.
   - **Correlação sob demanda, por caso** (registrada): SOURCE (minuta §3.3,
     PROPOSTA A-4) — correlação disparada por profissional de saúde no curso
     de um atendimento, sem persistência além do necessário, teria perfil de
     risco distinto. O parecer aceitou a forma minimalista decidida (índice
     permanente com salvaguardas); a alternativa fica registrada como opção de
     redução de risco a reavaliar nos gatilhos da seção 11.
   - **Não fazer nada**: mantém a fragmentação do cuidado da população
     multi-PJ; não elimina o risco, apenas o desloca para o paciente.
4. **Proporcionalidade do acesso.** SOURCE (§2.2): role dedicada, grant
   explícito e separado, sem herança por tenant, segregação do lago analítico,
   acesso registrado. O universo de consumidores autorizados nasce vazio e só
   cresce por decisão explícita e auditável.

---

## 6. Riscos aos titulares

Consolidados da minuta §3.6 (R-a1..R-a7) e do parecer; a numeração abaixo é
local deste RIPD. Avaliação qualitativa; nenhuma probabilidade é estimada
contra ambiente real, porque nenhum ambiente com dado real existe (seção 0).

| # | Risco ao titular | Fonte | Salvaguardas/controles que respondem |
|---|---|---|---|
| RT-1 | **Desvio de finalidade para seleção de riscos**: a mesma estrutura que liga histórico assistencial a beneficiário permitiria precificar risco; o desvio pode ocorrer sem decisão formal — basta um novo consumidor com grant. | minuta R-a1; art. 11, §5º | CN-01, CN-09; S-1, S-6 (seções 7-8) |
| RT-2 | **Recriação do MPI global**: um índice mal governado converge para a propriedade que já existiu e foi desmontada (resolução cross-tenant irrestrita). | minuta R-a2; ADR-043 L46-51 | CN-02, CN-04; S-4 |
| RT-3 | **Falso positivo cross-PJ**: atribuição de identidade errada entre PJs — dano de privacidade **e** perigo clínico simultâneos, pois sistemas clínicos chaveiam fatos por sujeito. | minuta R-a3; ADR-043 RB-07 | CN-05; S-8 (taxa medida, desfazimento, notificação) |
| RT-4 | **Governança nominal**: acesso governado por tag de escopo de consentimento cujo registro subjacente tinha zero produtores na evidência examinada. | minuta R-a4; ADR-045 L82-86 | S-1, S-10; instrumento do art. 39 (§2.4) |
| RT-5 | **Contaminação silenciosa da V2**: se a resolução de identidade a montante passar a depender do índice, um par errado entraria na V2 como fato clínico do paciente errado, sem que a V2 tenha como saber. | minuta R-a5 | CN-02, CN-03; IDP-03/04/09 (§2.6) |
| RT-6 | **Ausência de instrumento entre controladores**: responsabilidade solidária sem alocação negociada (art. 42, §1º, II). | minuta R-a6 | condicionante 2 do parecer (§2.4); CN-10 |
| RT-7 | **Concentração de autoridade**: a mesma pessoa decide pelos dois lados do grupo, removendo o atrito que normalmente atua como controle entre controladores distintos. | minuta R-a7; DEC-G0-04 | aprovação privacy/legal externa deste RIPD (seção 10); trilhas de auditoria CN-06, CN-07 |
| RT-8 | **Incidente/vazamento do índice**: cada par revela vínculo assistencial (dado sensível); exposição do índice expõe o vínculo de toda a população pareada. | INFERENCE de §2.5 + art. 46/48 | S-6; CN-07, CN-08; segregação (condicionante 5) |
| RT-9 | **Opacidade para o titular**: o titular pode desconhecer que a correlação existe e não saber como exercer direitos sobre ela. | minuta S-9; art. 9º | seção 9; S-9 |

---

## 7. Salvaguardas

**Já decididas no desenho (SOURCE: ADR-043 via minuta §3.1; creditadas pela
minuta §3.4 e mantidas):** estrutura separada e mínima; ausência de
identificador direto (em claro ou hash); não persistência dos atributos de
matching; job com role dedicada fora das roles de tenant; grant explícito e
separado, sem herança; determinístico primeiro; probabilístico apenas como
proposta, com revisão humana obrigatória, revisor e data gravados.

**Exigidas pelo parecer como condicionantes cumulativas (SOURCE: parecer
OS-16, item II):** instrumento escrito entre controladores antes do primeiro
apply; este RIPD prévio; revogação por tombamento carimbado; acesso restrito,
registrado e segregado do lago analítico.

**Sugeridas pela minuta (§3.4, S-1..S-10) e adotadas por este RIPD como plano
de salvaguardas a implementar antes ou junto do primeiro apply (PROPOSAL):**
finalidade declarada por tipo de par (S-1); ROPA contemplando o índice como
tratamento autônomo (S-2); vedação técnica e contratual de exportação — em
especial para a V2 (S-4, espelhando o controle SEC-0010 da V2); trilha de
acesso — quem leu, quando, para qual finalidade, sobre qual par (S-6); prazo
de retenção e critério de término, inclusive para pares revogados (S-7); taxa
de falso positivo medida, com procedimento de desfazimento e notificação dos
consumidores afetados (S-8); informação ao titular (S-9); instrução formal
escrita de cada controlador à AMH (S-10, art. 39).

**Do lado da V2 (SOURCE: §2.6):** IDP-03, IDP-04 e IDP-09 como políticas
permanentes; caráter consultivo do laço clínico documentado e com plano de
verificação em `evidencia-carater-consultivo.md` (citação integral no §2.6);
CI de conteúdo proibido reprovando CPF formatado e PSR real em todo o corpo
documental (`scripts/check_forbidden_content.py`).

---

## 8. Vedações do art. 11, §5º como controles negativos verificáveis

SOURCE (minuta §3.2.5 — texto legal): art. 11, §5º: "É vedado às **operadoras
de planos privados de assistência à saúde** o tratamento de dados de saúde
para a prática de **seleção de riscos** na contratação de qualquer modalidade,
assim como na contratação e exclusão de beneficiários."

SOURCE (parecer OS-16, item II — verbatim): "o §5º **incide** sobre a
operadora do grupo (Q-07). Fica **vedado em definitivo** — e essa vedação deve
ser tecnicamente verificável (**controle negativo testável**) — qualquer uso
do índice ou de dado de saúde para **seleção de risco, subscrição,
precificação, elegibilidade ou exclusão** de beneficiários, ainda que houvesse
consentimento."

Registro de forma (OBSERVED, transcrição do parecer): o marcador
`[CONFIRMAR/AJUSTAR]` permaneceu no título da vedação no texto emitido; o
conteúdo foi mantido integralmente e não foi alterado na complementação —
leitura registrada pelo escriba: ratificado por conduta. Este RIPD trata a
vedação como vigente na sua integralidade.

INFERENCE (do texto legal + parecer): a vedação é **proibição objetiva de
finalidade** — não é afastável por consentimento nem por qualquer base legal.
Um RIPD que a listasse apenas como princípio não atenderia ao parecer, que
exige verificabilidade técnica. Os controles abaixo formulam, cada um: (a) o
**enunciado negativo** — o que o sistema NUNCA faz; (b) a **verificação** —
como se testa ou audita; (c) **onde a verificação vive** (AMH, V2 ou
instrumento contratual); (d) o **estado na redação**. PROPOSAL: a lista
CN-01..CN-10 é a operacionalização proposta; a suficiência é juízo de
privacy/legal, não deste documento.

**Estado geral na redação (OBSERVED):** nenhuma das verificações foi executada
contra ambiente com dado real, porque tal ambiente não existe e o primeiro
apply não ocorreu (seção 0). Hoje todos os controles estão trivialmente
satisfeitos por inexistência do tratamento; a obrigação é mantê-los
verificáveis — e verificados — a partir do primeiro apply. As verificações do
lado AMH são atos do lado AMH (política de zero escrita da V2 no repositório
AMH); este RIPD as formula para constarem do instrumento entre controladores.

### CN-01 — Seleção de risco, subscrição, precificação, elegibilidade, exclusão

- **Nunca:** o índice, qualquer derivado seu ou qualquer dado de saúde é usado
  para seleção de risco, subscrição, precificação, elegibilidade, contratação
  ou exclusão de beneficiários — ainda que houvesse consentimento.
- **Verificação:** (i) inventário vivo de consumidores do índice, cada grant
  com finalidade declarada por escrito (S-1) e verificada contra a lista
  vedada antes da concessão; (ii) auditoria periódica: nenhum grant a role,
  sistema ou função de subscrição, precificação, atuária, comercial ou de
  elegibilidade da operadora — a existência de um único grant dessa classe é
  achado reprovável, independentemente de uso; (iii) trilha de leitura (CN-07)
  permite reconstruir a finalidade de cada acesso; acesso sem finalidade
  declarada é tratado como incidente (art. 48).
- **Onde vive:** AMH (grants e trilha) + instrumento entre controladores
  (proibição expressa e sanção).
- **Estado:** verificação não exercida — sem apply, universo de grants vazio.

### CN-02 — Exportação do índice

- **Nunca:** o índice ou qualquer derivado sai da role dedicada — em especial,
  **nunca** para o IntensiCare V2, para o lago analítico ou para qualquer
  cópia, cache, extrato ou relatório fora do perímetro segregado.
- **Verificação:** lado AMH — vedação técnica (nenhum caminho de exportação na
  role; segregação do lago — condicionante 5) e contratual (S-4); lado V2 —
  inspeção de repositório e CI provando que não existe tabela, cache, endpoint
  ou estrutura de correspondência cross-PJ em nenhuma camada da V2 (IDP-09;
  teste negativo a manter na esteira da fatia G7).
- **Onde vive:** AMH + V2 + instrumento contratual (SEC-0010 espelhado).
- **Estado:** lado V2 verificável desde já por inspeção do repositório
  (OBSERVED: não existe estrutura de correspondência na V2); lado AMH pendente
  de formalização.

### CN-03 — Correlação paralela na V2

- **Nunca:** a V2 constrói, deriva ou infere correspondência entre PJs por
  conta própria — nenhum join, deduplicação ou inferência de mesmidade por
  CPF, CNS, nome, data de nascimento, nome da mãe, telefone, endereço,
  combinação ou hash desses valores, **mesmo quando presentes e idênticos**
  nos dois lados.
- **Verificação:** IDP-04 (política permanente) com obrigação de teste
  negativo; revisão de código na esteira de CI; a V2 chaveia fatos clínicos
  por `(PSR, encontro)` em um único tenant (IDP-03), de modo que não existe
  chave global de pessoa sobre a qual correlacionar.
- **Onde vive:** V2 (código, CI, testes).
- **Estado:** política permanente registrada; testes negativos a implementar
  na fatia G7 (VALIDATION REQUIRED).

### CN-04 — Acesso herdado

- **Nunca:** um consumidor lê o índice por pertencer a um dos tenants
  pareados; todo acesso exige grant explícito, separado e nominal.
- **Verificação:** teste negativo de acesso com credencial de role de tenant
  (deve falhar); auditoria da lista de grants contra a lista de roles de
  tenant — interseção obrigatoriamente vazia.
- **Onde vive:** AMH.
- **Estado:** desenho decidido no ADR-043; verificação pendente de ambiente.

### CN-05 — Vínculo sem revisão humana

- **Nunca:** um par de origem probabilística torna-se vínculo ativo sem
  revisão humana registrada (revisor e data).
- **Verificação:** consulta de integridade contínua — contagem de pares ativos
  com origem probabilística e sem revisor/data deve ser **zero**; teste do
  pipeline provando que a proposta não transita a ativo sem o ato humano.
- **Onde vive:** AMH.
- **Estado:** desenho decidido; verificação pendente de ambiente.

### CN-06 — Exclusão física de correspondência

- **Nunca:** revogação por exclusão física de linha; toda revogação é
  tombamento carimbado com data e autor (condicionante 4; Q-10).
- **Verificação:** privilégio de DELETE negado às roles de operação sobre a
  tabela do índice; teste negativo (tentativa de DELETE falha); auditoria: o
  histórico de correspondências, incluídas as revogadas, permanece
  reconstruível (arts. 6º, X, e 37).
- **Onde vive:** AMH.
- **Estado:** exigido pelo parecer; implementação e teste pendentes.

### CN-07 — Leitura sem rastro

- **Nunca:** uma leitura do índice sem registro de quem leu, quando, para qual
  finalidade e sobre qual par (S-6).
- **Verificação:** inexistência de caminho de leitura fora do ponto
  instrumentado (revisão de arquitetura); amostragem periódica conciliando
  acessos de infraestrutura com a trilha; sem trilha de leitura não se
  dimensiona incidente (art. 48) — a ausência de log é, ela mesma, um achado.
- **Onde vive:** AMH.
- **Estado:** exigido (condicionante 5 + S-6); implementação pendente.

### CN-08 — Identificador direto no índice

- **Nunca:** o índice contém CPF, CNS, nome, data de nascimento ou qualquer
  identificador direto — em claro ou em hash — nem atributos de matching
  persistidos.
- **Verificação:** schema fechado (somente as colunas do §2.1 e o tombamento
  do CN-06); scanner periódico de conteúdo sobre a estrutura (na V2, a classe
  análoga de controle já roda em CI: `check_forbidden_content.py`); revisão do
  job de matching provando que os atributos lidos não são gravados.
- **Onde vive:** AMH (V2 mantém o análogo documental em CI).
- **Estado:** desenho decidido; scanner AMH pendente; análogo V2 OBSERVED
  rodando em CI.

### CN-09 — Vantagem econômica (art. 11, §4º, cumulado)

- **Nunca:** comunicação ou uso compartilhado do índice ou de dado de saúde
  dele derivado com objetivo de obter vantagem econômica, fora das ressalvas
  do próprio art. 11, §4º (prestação de serviços de saúde em benefício do
  titular, portabilidade a pedido, transações decorrentes da prestação).
- **Verificação:** mesma malha do CN-01 (finalidade declarada por grant +
  trilha de leitura); o instrumento entre controladores lista taxativamente as
  finalidades permitidas — tudo que não está listado está vedado por default
  (fail-closed de finalidade).
- **Onde vive:** AMH + instrumento contratual.
- **Estado:** pendente do instrumento (§2.4).

### CN-10 — Apply antes das condicionantes

- **Nunca:** primeiro apply do índice antes de satisfeitas, cumulativamente:
  instrumento escrito entre controladores (condicionante 2); RIPD aprovado por
  privacy/legal (condicionante 3 — este documento, hoje PROPOSAL); tombamento
  carimbado implementado (condicionante 4); acesso restrito, registrado e
  segregado implementado (condicionante 5). E **nunca** tratamento de dado
  real na V2 fora das trilhas autorizadas: o default do regime vigente é dado
  exclusivamente sintético marcado `SYNTH-`.
- **Verificação:** checklist de pré-condições anexado ao ato de apply, com
  evidência por item; do lado V2, o CI de conteúdo proibido reprova CPF
  formatado e PSR real em qualquer material do repositório — prova contínua de
  que nenhum dado real entrou na base documental e de fixtures.
- **Onde vive:** AMH (ato de apply) + V2 (CI) + governança (checklist).
- **Estado:** OBSERVED — o apply não ocorreu; nenhum dado real foi acessado;
  CI ativo.

---

## 9. Direitos dos titulares

1. **Informação (art. 9º; S-9).** O titular deve ser informado da existência
   da correlação, da finalidade exclusiva (seção 3) e de como exercer direitos
   sobre ela. Meio e texto: a definir pelos controladores no instrumento do
   §2.4 — pendente.
2. **Confirmação e acesso (art. 18, I e II).** O titular pode confirmar se
   existe par ativo que o envolva e acessá-lo; a rota de atendimento é dos
   controladores, com apoio operacional da AMH.
3. **Correção e desfazimento (art. 18, III; art. 6º, V).** Par falso positivo
   é inexatidão: o desfazimento segue o procedimento de S-8, com notificação
   dos consumidores afetados e medição de taxa.
4. **Eliminação vs. auditabilidade (art. 18, VI; arts. 6º, X, e 37).** SOURCE
   (parecer OS-16, condicionante 4; Q-10): a revogação de correspondência é
   por tombamento carimbado, não por exclusão física, "para preservar
   auditabilidade". O atendimento a pedidos de eliminação é avaliado caso a
   caso pelos controladores à luz dessa condicionante — este RIPD registra a
   tensão e a resolução adotada pelo parecer, sem inovar sobre ela.
5. **Revisão de decisão (art. 20).** O pareamento probabilístico nunca decide
   sozinho (CN-05: revisão humana obrigatória); no laço clínico, o caráter
   consultivo documentado (§2.6) é o que, na leitura do parecer (Q-15), afasta
   a incidência autônoma do art. 20. Nenhuma das duas afirmações é juízo deste
   documento — ambas são do parecer, sob os limites dele.

---

## 10. O que este RIPD não estabelece — e as aprovações que exige

- **Não é aprovação.** Status PROPOSAL. Torna-se eficaz como RIPD apenas
  quando revisado e aprovado por encarregado(a)/DPO e jurídico, e assumido
  pelos controladores identificados no instrumento do §2.4. O próprio parecer
  OS-16 (seção VII) declara: "RIPD — exigido, não elaborado" — a elaboração é
  esta minuta; a aprovação não existe.
- **Não emite juízo jurídico.** Base legal, incidência do §5º e enquadramentos
  são do parecer OS-16, sob as condições e limites das suas seções VII e VIII.
- **Não alega conformidade regulatória, efetividade clínica nem segurança
  comprovada.** As verificações da seção 8 estão formuladas, não executadas
  contra ambiente real (que não existe).
- **Não fecha gate, bloqueador, risco ou hazard, e não autoriza o apply.** O
  primeiro apply permanece condicionado ao conjunto cumulativo do parecer
  (CN-10), do qual este documento é apenas um item — e ainda não aprovado.
- **Não presume aprovação humana.** Owner: `UNASSIGNED — VALIDATION REQUIRED`.

---

## 11. Gatilhos de revisita deste RIPD

| # | Gatilho | Fonte |
|---|---|---|
| G-1 | Qualquer condição de revisão do parecer OS-16 (seção VIII): regulamentação/decisão da ANPD sobre grupos econômicos em saúde, art. 11 ou art. 20; mudança material da arquitetura examinada; início efetivo de tratamento de dado real; decurso de 24 meses; incidente de segurança envolvendo os dados examinados | parecer OS-16 §VIII |
| G-2 | Emenda ao ADR-043 (lado AMH) — inclusive a emenda exigida pela Q-06 nomeando artigo e finalidade | parecer OS-16 Q-06 |
| G-3 | Celebração do instrumento entre controladores e do instrumento do art. 39 — o RIPD deve ser conciliado com a alocação final de papéis | parecer OS-16 Q-02/Q-08 |
| G-4 | Primeiro apply do índice: as verificações da seção 8 saem de "formuladas" para "exigíveis"; RIPD passa a operação em curso e deve ser reavaliado | parecer OS-16 item II |
| G-5 | Mudança do desenho do índice (novas colunas, novo consumidor, nova origem de pareamento, ou migração para correlação sob demanda — PROPOSTA A-4) | minuta §3.3/§3.7 |
| G-6 | Aprovação, correção ou rejeição deste RIPD por privacy/legal (encerra a PREMISSA do preâmbulo) | GDEC-0015/0017 |
