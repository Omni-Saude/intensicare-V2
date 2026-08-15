---
doc_id: LGPD-OS16-MINUTA
status: PROPOSAL
owner: UNASSIGNED — VALIDATION REQUIRED (AUTH-PRIVACY-LEGAL não nomeado; BLK-0004, reclassificado por DEC-G0-03)
source: >
  Encomenda OS-16 em docs/08-interoperability/amh-data/ordens-de-servico-amh-2026-08-15.md §5;
  resoluções AQ-3 e AQ-4 em docs/08-interoperability/amh-data/identity-adjudication/adjudicacao-decisoes-2026-08-15.md;
  autorização de redação como SUGESTÃO em docs/00-governance/registers/g0-resolucoes-2026-08-15.md DEC-G0-03;
  evidência técnica lida em Omni-Saude/amh-data-platform@0a07a6f1fab36fb2f5eeee0fcd8e945c95f67116
  (architecture/adrs/ADR-043-indice-de-correspondencia-de-identidade-entre-pjs.md,
  architecture/adrs/ADR-045-formato-do-log-de-consentimento.md,
  docs/plans/amh-020b-portable-subject-ref-design-2026-08-04.md);
  texto legal: Lei nº 13.709/2018 (LGPD)
date_collected: 2026-08-15
collector: engenheiro de privacidade, LGPD e registros (IntensiCare V2, ciclo 1)
transformation: análise redigida a partir dos documentos citados; citações legais por artigo e inciso; nenhuma decisão tomada por agente
confidence: media
last_updated: 2026-08-15
validation_status: VALIDAÇÃO NECESSÁRIA — ratificação por advogado(a) brasileiro(a) qualificado(a) (DEC-G0-03)
---

# Minuta de parecer LGPD — OS-16

> # ⚠️ SUGESTÃO DE AGENTE — sem valor de parecer jurídico
>
> **Este documento não é um parecer jurídico e não pode ser citado como tal, em
> nenhuma parte.** Foi redigido por um agente de engenharia de privacidade como
> **insumo estruturado** para o(a) advogado(a) que emitirá o parecer exigido pelo
> OS-16. **A ratificação por advogados da organização é exigida** — `DEC-G0-03`
> (`docs/00-governance/registers/g0-resolucoes-2026-08-15.md`): *"Agentes redigem
> material jurídico/privacidade apenas como **sugestão**; advogados da organização
> revisarão e aceitarão futuramente."*
>
> Nenhuma afirmação aqui declara conformidade. As expressões "conforme",
> "compliant", "adequado à LGPD" **não aparecem como conclusão** em nenhum ponto
> deste texto, e não podem ser inferidas dele.
>
> Toda posição abaixo é rotulada **PROPOSTA** e é **revogável pelo parecer
> definitivo**, que prevalece integralmente sobre esta minuta em caso de
> divergência.

---

## §0. Como ler este documento

### 0.1 Rótulos epistêmicos

Conforme `docs/00-governance/evidence-notation.md` §2, em pt-BR por `DEC-G0-10`:

| Rótulo | Significado neste documento |
|---|---|
| **FONTE** | Texto legal ou documento citado, reproduzido ou fielmente resumido. Para a LGPD, cita-se artigo e inciso. |
| **OBSERVADO** | Lido diretamente por este especialista, no commit pinado, com caminho@commit declarado. |
| **FONTE (adjudicação)** | Lido pelo especialista de identidade, não por este; fiel, porém de segunda mão. |
| **INFERÊNCIA** | Análise deste especialista, encadeada a FONTE/OBSERVADO explicitamente nomeados. |
| **PROPOSTA** | Posição sugerida, sem efeito vinculante, aguardando o parecer do(a) advogado(a). |

**Nenhuma afirmação deste documento carrega o rótulo `DECIDED`.** As decisões
`AQ-3` e `AQ-4` são do titular nomeado e estão na ata de adjudicação; esta minuta
as toma como **premissa de fato de negócio**, não como conclusão jurídica — o
titular decidiu *qual base legal a organização pretende invocar*; se essa base se
sustenta é exatamente a pergunta feita ao(à) advogado(a).

### 0.2 Objeto

Esta minuta cobre **quatro pontos**, na ordem exigida pelo OS-16:

| Ponto | Objeto | Seção |
|---|---|---|
| **(a)** | Índice de correspondência de identidade entre PJs (ADR-043) — licitude, base legal candidata, salvaguardas mínimas, papéis controlador/operador, riscos | §3 |
| **(b)** | Base legal do loop clínico = tutela da saúde, LGPD art. 11, II, "f" — adequação, limites, e por que consentimento não é a base adequada | §4 |
| **(c)** | Bloqueio de usos secundários — o que fica vedado sem nova base legal, e o que seria preciso para desbloquear | §5 |
| **(d)** | `ie_perm_sms_email` — confirmação de que jamais constitui consentimento LGPD para dados de saúde | §6 |

O que esta minuta **não** cobre está em **§7**, e essa lista é parte substantiva
do documento, não um rodapé.

---

## §1. Fatos e premissas

### 1.1 As pessoas jurídicas envolvidas

**FONTE (adjudicação)** — `adjudicacao-decisoes-2026-08-15.md` §0.1: o titular
nomeado é rodaquino-OMNI, **CEO e acionista principal da OMNI e da AMH**, médico
intensivista.

**OBSERVADO** — `architecture/adrs/ADR-043-indice-de-correspondencia-de-identidade-entre-pjs.md@0a07a6f1`
L12-21: o pedido de negócio é *"unificar a identidade do paciente entre hospital e
operadora"*; antes do ADR-041 *"hospital e operadora viviam no mesmo tenant"*; o
ADR-041 *"tornou `omni` (operadora) um tenant separado"*.

**FONTE (adjudicação)** — `ordens-de-servico-amh-2026-08-15.md` OS-03 e OS-10: a
enumeração autoritativa pós-ADR-041 é de **12 tenants de negócio**, com grão em
**raiz de CNPJ**, incluindo **10 PJs clínicas** e a operadora `omni`.

**INFERÊNCIA** (de ADR-043 L12-21 + OS-10): há, no mínimo, **três naturezas
distintas de agente** no arranjo — (i) PJs prestadoras de serviço de saúde
(hospitais/clínicas), (ii) uma **operadora de plano privado de assistência à
saúde** (`omni`), e (iii) a plataforma de dados (AMH). A distinção entre (i) e
(ii) é juridicamente decisiva e é tratada em §3.

> **Ponto de atenção que a minuta destaca desde já.** O controle societário comum
> — a mesma pessoa natural sendo CEO e acionista principal de OMNI e AMH — é um
> **fato societário**, e a minuta **não assume** que ele produza qualquer efeito
> de unificação para fins de proteção de dados. **INFERÊNCIA:** empresas de um
> mesmo grupo permanecem **controladores distintos** (art. 5º, VI), cada qual com
> sua própria necessidade de base legal e de finalidade declarada; a
> transferência de dados entre elas é **uso compartilhado** (art. 5º, XVI), não
> circulação interna. **Questão Q-01 ao(à) advogado(a).**

### 1.2 O sistema IntensiCare V2

**OBSERVADO** — `docs/11-security-privacy-compliance/privacy-data-map.md` §0: o
IntensiCare V2 *"não tem código, ambiente, banco de dados, usuário nem dado.
**Nenhum dado pessoal foi tratado.**"* Todo o mapa descreve arquitetura
**candidata**.

**FONTE** — `DEC-G0-03`: *"O desenvolvimento prossegue exclusivamente com dados
sintéticos (nenhum dado real, nenhum tratamento de dados pessoais → sem
determinação de base legal pendente nesta fase). … Gatilho obrigatório: parecer
jurídico brasileiro antes de qualquer teste de conformidade com dados reais,
operação sombra ou piloto (G6/G8)."*

**INFERÊNCIA:** o parecer é solicitado **antes** de qualquer tratamento, e não
para regularizar tratamento em curso. Isso é relevante para o(a) advogado(a) em
dois sentidos: (i) não há passivo a sanear; (ii) o parecer tem margem real para
condicionar o desenho — recomendações de arquitetura ainda são exequíveis a custo
baixo, o que deixa de ser verdade depois do G3.

**Uso pretendido do sistema, para fins de enquadramento** (**FONTE** —
`privacy-data-map.md` §2, vocabulário candidato de finalidades): apoio à decisão
clínica em **cuidado crítico** (UTI) — cálculo de escores e limiares a partir de
observações do paciente, geração de alertas e itens de trabalho, e apresentação
ao **profissional de saúde responsável por aquele paciente**, com registro
auditável de quem viu o quê e de que ação tomou. **FONTE** —
`privacy-data-map.md` §5.2, remetendo à regra 15 do prompt de orquestração: a
**autoridade de decisão clínica permanece com humanos responsáveis**; a automação
calcula, resume, roteia e explica, e não expande silenciosamente o uso pretendido.

### 1.3 O identificador de fronteira: `portable_subject_ref` (PSR)

**OBSERVADO** — `docs/plans/amh-020b-portable-subject-ref-design-2026-08-04.md@0a07a6f1`,
Anexo A: `portable_subject_ref` é *"string, obrigatório — `^amh:psr:v1:<uuidv4>$`
(47 chars). **MINTADO** (nunca derivado), opaco, não-reversível, estável em
`{amh_tenant, legal_entity}`"*.

**OBSERVADO** — mesmo documento, §0 princípio 3: *"`sha256` nu de CPF é reversível
(~10⁹ CPFs válidos, GPU-trivial); por isso `cpf_hash` é HMAC-SHA256 com chave de
32 bytes POR TENANT … Qualquer pseudônimo novo deste design herda esse rigor:
nada de digest nu, nada de derivação de espaço pequeno"*.

**OBSERVADO** — mesmo documento, §1.3: a chave lógica do registry é *"1 ref
`active` por `{amh_tenant, legal_entity, mpi_id}`"*; §1.4: o direito de apagamento
*"não deleta a linha do registry … o job de erasure muda `status=retired` e
**anula a coluna `mpi_id`** — única mutação permitida do mapa"*.

**INFERÊNCIA — e este é o ponto de maior risco de mal-entendido de toda a
minuta.** O PSR é **não-derivável** (é um UUIDv4 mintado, não um digest de
atributo): ninguém o reverte por cálculo, e o desenho merece crédito explícito por
isso. Mas o PSR **é re-associável por consulta**: existe, do lado AMH, uma tabela
de registro que mantém a coluna `mpi_id` ao lado do `subject_ref`. Portanto:

- **o PSR realiza pseudonimização, não anonimização;**
- a "informação adicional mantida separadamente pelo controlador" — expressão do
  **art. 13, §4º** — é exatamente essa tabela;
- **FONTE (art. 13, §4º):** a definição legal de pseudonimização ali dada é
  expressamente **"para os efeitos deste artigo"**, isto é, no contexto de estudos
  em saúde pública realizados por **órgãos de pesquisa**. **INFERÊNCIA:** ela
  **não** é uma cláusula geral de porto seguro e **não se aplica automaticamente**
  ao loop clínico nem ao contrato AMH×IntensiCare;
- **FONTE (art. 5º, III e XI; art. 12, caput):** dado anonimizado é o que "não
  possa ser identificado, considerando a utilização de meios técnicos razoáveis e
  disponíveis"; dados anonimizados só deixam de ser dados pessoais "salvo quando o
  processo … for revertido … ou quando, com esforços razoáveis, puder ser
  revertido". **INFERÊNCIA:** a reversão aqui não exige sequer esforço — exige uma
  consulta a uma tabela existente, sob contrato entre as partes. O PSR **não**
  satisfaz o art. 12.

**PROPOSTA P-PSR-1.** Dados chaveados por PSR devem ser tratados, para todos os
fins, como **dados pessoais**; e, por serem dados referentes à saúde (art. 5º,
II), como **dados pessoais sensíveis** — tanto na AMH quanto na V2. Nenhum
artefato da V2 pode descrever dado chaveado por PSR como "anonimizado",
"desidentificado" ou "não pessoal". **A pseudonimização é medida de segurança e de
minimização (art. 6º, VII e VIII; art. 46), não base legal e não isenção.**

### 1.4 Proveniência dos artefatos AMH lidos para esta minuta

Somente leitura, no commit pinado. **Nada foi escrito no repositório AMH.**

| Artefato | Repositório | Commit | Rótulo |
|---|---|---|---|
| `architecture/adrs/ADR-043-indice-de-correspondencia-de-identidade-entre-pjs.md` | `Omni-Saude/amh-data-platform` | `0a07a6f1fab36fb2f5eeee0fcd8e945c95f67116` | **OBSERVADO** (113 linhas, íntegra) |
| `architecture/adrs/ADR-045-formato-do-log-de-consentimento.md` | `Omni-Saude/amh-data-platform` | `0a07a6f1fab36fb2f5eeee0fcd8e945c95f67116` | **OBSERVADO** (115 linhas, íntegra) |
| `docs/plans/amh-020b-portable-subject-ref-design-2026-08-04.md` | `Omni-Saude/amh-data-platform` | `0a07a6f1fab36fb2f5eeee0fcd8e945c95f67116` | **OBSERVADO** (559 linhas; §0, §1, §5, §7, §8, §9 e Anexo A lidos) |
| `ADR-041` (grão do tenant), `ADR-042` (XRD-05), `ADR-006`, `ADR-039` | `Omni-Saude/amh-data-platform` | idem | **FONTE (adjudicação)** — não lidos por este especialista |

> **Registro de integridade.** O OS-16 solicitava a leitura de ADR-043 e ADR-045
> no commit pinado. **Ambos foram lidos na íntegra.** Não houve necessidade de
> acionar a condição de parada que autorizava proceder apenas com o que a ata
> reporta. O AMH-020b foi lido adicionalmente porque sem ele a análise de
> pseudonimização do PSR (§1.3) seria de segunda mão.

### 1.5 Premissas que a minuta assume e que o parecer precisa confirmar

Cada premissa abaixo, se falsa, **muda a análise**. Estão numeradas para
referência no parecer.

| # | Premissa assumida | Se for falsa |
|---|---|---|
| **P-1** | As PJs clínicas (tenants hospitalares) são **serviços de saúde** e nelas o tratamento ocorre em procedimento realizado por profissionais de saúde. | Cai a hipótese do art. 11, II, "f" para o loop clínico (§4). |
| **P-2** | A `omni` é **operadora de plano privado de assistência à saúde** sujeita à regulação setorial de saúde suplementar. | Muda toda a análise do ponto (a), especialmente quanto ao art. 11, §5º. |
| **P-3** | Cada PJ é **controladora** dos dados de seus pacientes/beneficiários; a AMH atua como plataforma que trata dados por conta delas. | Muda a alocação de papéis (§3.5) e a responsabilidade solidária (art. 42, §1º, II). |
| **P-4** | A OMNI/IntensiCare V2 fornecerá o sistema **a serviços de saúde**, e o profissional que vê o alerta é o responsável pelo paciente naquele serviço. | Se a V2 tratar dados fora de vínculo assistencial, a hipótese "f" não a alcança. |
| **P-5** | Nenhum dado real foi ou será tratado antes do parecer. | Deixaria de ser parecer prévio e passaria a ser saneamento de passivo. |
| **P-6** | O IntensiCare V2 não substitui nem constitui o **prontuário** do paciente; é sistema de apoio à decisão que lê dados e registra sua própria trilha. | Atrairia o regime de prontuário e de guarda documental, **fora do escopo desta minuta** (§7). |
| **P-7** | O índice do ADR-043 e o loop clínico do IntensiCare são **tratamentos distintos, com finalidades distintas**, e a V2 nunca hospeda nem deriva o índice. | Se a V2 consumir correlação cross-PJ, os pontos (a) e (b) deixam de ser separáveis. |

---

## §2. Enquadramento comum a todos os pontos

### 2.1 Dado pessoal × dado pessoal sensível

**FONTE (art. 5º, I):** dado pessoal é "informação relacionada a pessoa natural
identificada ou identificável".

**FONTE (art. 5º, II):** dado pessoal sensível é, entre outros, "**dado referente
à saúde** ou à vida sexual, dado genético ou biométrico, quando vinculado a uma
pessoa natural".

**INFERÊNCIA:** praticamente **todo** o conteúdo funcional do IntensiCare V2 é
dado pessoal sensível — sinais vitais, resultados laboratoriais, escores
calculados, alertas, e o próprio fato da internação em UTI. As consequências
práticas dessa qualificação, e que atravessam os quatro pontos:

1. **O rol do art. 11 é mais estreito que o do art. 7º.** Não existe, para dado
   sensível, hipótese equivalente ao **legítimo interesse** do art. 7º, IX. Isso
   elimina, de saída, a via pela qual analytics e treinamento de modelo costumam
   ser justificados em outros setores. É determinante para o ponto (c) (§5).
2. **A hipótese do art. 11, II, "f" tem a mesma redação da do art. 7º, VIII**,
   mas é a do art. 11 que governa aqui.
3. **A inferência também é dado sensível.** **INFERÊNCIA:** um escore de
   deterioração clínica calculado sobre dados de saúde é, ele próprio, dado
   referente à saúde de pessoa identificável — não é "dado derivado" fora do
   regime. O `privacy-data-map.md` §1 já registra a categoria 4 como
   *"dado de saúde **mais** uma inferência sobre a pessoa **mais** conduta
   profissional atribuída"*.

### 2.2 Os princípios que nenhuma base legal dispensa

**FONTE (art. 6º):** finalidade (I), adequação (II), necessidade (III), livre
acesso (IV), qualidade dos dados (V), transparência (VI), segurança (VII),
prevenção (VIII), não discriminação (IX), responsabilização e prestação de contas
(X).

**INFERÊNCIA:** encontrar a base legal correta é condição **necessária e
insuficiente**. Ainda que o art. 11, II, "f" seja confirmado para o loop clínico,
permanecem exigíveis, entre outros: informação ao titular (art. 9º), atendimento
a direitos (art. 18), registro das operações (art. 37), medidas de segurança
(art. 46), comunicação de incidente (art. 48) e, quando for o caso, encarregado
(art. 41). Esta minuta **não** trata desses itens como resolvidos, e o
`privacy-data-map.md` §4, §7 e §10 registra que nenhum deles tem hoje política
definida na V2.

---

## §3. Ponto (a) — o índice de correspondência cross-PJ do ADR-043

### 3.1 Fatos observados

**OBSERVADO** — `ADR-043@0a07a6f1` L34-46, a estrutura decidida:

> "O cruzamento vive numa estrutura **própria**, que guarda apenas pares:
> `(tenant_a, mpi_id_a) <-> (tenant_b, mpi_id_b) + score + origem + revisor + data`
> … **O que o índice não contém, e é o ponto:** CPF, nome, data de nascimento ou
> qualquer identificador direto. Nem em claro, nem em hash. Ele correlaciona
> identidades **já resolvidas** dentro de cada tenant; não reconstrói a pessoa."

**OBSERVADO** — L53-62: o pareamento ocorre num **job de matching** que "roda com
role dedicada, fora das roles de tenant", "lê os atributos de matching, produz os
pares e **não persiste** os atributos", e "registra no índice apenas o par, o score
e a proveniência".

**OBSERVADO** — L63-70: "O acesso é governado pela LF-Tag que já existe.
`consent_scope = sharing_amh_internal` já está declarada no Lake Formation … Nenhum
consumidor herda acesso ao índice por ser de um dos tenants pareados: o grant é
explícito e separado."

**OBSERVADO** — L72-79: determinístico por CPF entra com score 1.0; probabilístico
(Splink) "entra como **proposta**, nunca como vínculo", só virando par ativo após
revisão humana no Steward UI, com revisor e data gravados.

**OBSERVADO** — L46-51, o histórico, que é evidência de risco datada: já existiu um
MPI global, "o índice pré-separação com 252 mil golden records de todas as PJs
juntos", e "foi justamente ele que permitiu, **até 2026-07-29**, um agente de
qualquer tenant resolver o `mpi_id` de qualquer outro".

**OBSERVADO** — L99, entre as consequências favoráveis: "**Destrava o agente Tina
(item 7.d), que depende de identificar o beneficiário.**"

**OBSERVADO** — L108-113, o risco que o próprio ADR assume: "Este ADR **autoriza**
a correlação entre PJs. É uma reversão deliberada de uma propriedade que a Onda 5
construiu e testou."

**OBSERVADO** — L3-6, o cabeçalho: "Status: Accepted … Decisor: owner do produto —
**base legal confirmada em 2026-08-03**. **O parecer do DPO/jurídico deve ser
anexado a este ADR antes do primeiro apply.**"

### 3.2 Análise

**INFERÊNCIA 3.2.1 — o índice é tratamento de dados pessoais.** Ainda que não
contenha identificador direto, cada par correlaciona duas identidades **já
resolvidas** a pessoas naturais dentro de cada tenant, e a resolução está
disponível a quem detém os MPIs. A ausência de CPF/nome no índice é **medida de
minimização**, e boa — não é descaracterização. Aplica-se o art. 5º, I ("pessoa
natural identificada ou **identificável**") e o art. 12, caput (reversão "com
esforços razoáveis").

**INFERÊNCIA 3.2.2 — o índice trata dado pessoal sensível.** Não pelo conteúdo das
colunas, mas pelo que a existência do par **significa**: quando `tenant_a` é uma PJ
hospitalar e `tenant_b` é a operadora, o par afirma que determinada pessoa é
simultaneamente paciente daquele prestador e beneficiária daquele plano. Isso é
informação referente à saúde vinculada a pessoa identificável (art. 5º, II).
**Questão Q-05.**

**INFERÊNCIA 3.2.3 — a finalidade do índice não é a mesma do loop clínico, e isso
decide a base legal.** O art. 11, II, "f" exige que o tratamento se dê
**"exclusivamente, em procedimento realizado por profissionais de saúde, serviços
de saúde ou autoridade sanitária"**. Um job de correlação cadastral entre
pessoas jurídicas, executado por role técnica dedicada, com revisão por *steward*
de dados, **não se apresenta** como procedimento realizado por profissional de
saúde. **INFERÊNCIA:** a hipótese "f" é, no mínimo, **duvidosa** para o índice
enquanto tal — e a menção do L99 a destravar um agente que "depende de identificar
o beneficiário" sugere finalidade **administrativa/negocial**, não assistencial.

**INFERÊNCIA 3.2.4 — o índice é uso compartilhado entre controladores.** **FONTE
(art. 5º, XVI):** uso compartilhado abrange "comunicação, difusão, transferência
internacional, interconexão de dados pessoais ou tratamento compartilhado de bancos
de dados pessoais … entre entes privados". **INFERÊNCIA:** interconectar os bancos
de identidade de duas PJs distintas é precisamente interconexão. Cada controlador
envolvido precisa de base legal própria para a sua parte, e não basta que **uma**
delas a tenha.

**INFERÊNCIA 3.2.5 — as duas vedações específicas do art. 11 são o núcleo do
risco.**

- **FONTE (art. 11, §4º):** "É vedada a comunicação ou o uso compartilhado entre
  controladores de dados pessoais sensíveis referentes à saúde **com objetivo de
  obter vantagem econômica**", ressalvadas hipóteses ligadas à prestação de
  serviços de saúde, assistência farmacêutica e assistência à saúde, "em benefício
  dos interesses dos titulares", e para permitir portabilidade a pedido do titular
  ou as transações financeiras e administrativas decorrentes da prestação desses
  serviços.
- **FONTE (art. 11, §5º):** "É vedado às **operadoras de planos privados de
  assistência à saúde** o tratamento de dados de saúde para a prática de **seleção
  de riscos** na contratação de qualquer modalidade, assim como na contratação e
  exclusão de beneficiários."
- **FONTE (art. 11, §3º):** a ANPD pode vedar ou regulamentar a comunicação ou uso
  compartilhado de dados sensíveis de saúde entre controladores com objetivo de
  vantagem econômica.

**INFERÊNCIA:** o índice do ADR-043 é exatamente a estrutura que torna
tecnicamente possível ligar histórico assistencial hospitalar a um beneficiário de
plano. **A vedação do art. 11, §5º não é afastável por consentimento** — é
proibição objetiva de finalidade. Portanto, mesmo que se encontre base legal para
criar o índice, **existe um conjunto de usos do índice que permanece vedado em
qualquer hipótese.** Esta é, na avaliação desta minuta, **a questão jurídica mais
relevante de todo o OS-16**, e ela não aparece no texto do ADR-043.

**INFERÊNCIA 3.2.6 — o eixo de consentimento que governa o acesso não tem dado
por trás.** O ADR-043 §3 governa o acesso pela LF-Tag `consent_scope =
sharing_amh_internal`. **OBSERVADO** — `ADR-045@0a07a6f1` L82-86: "**Não existe
escritor.** Nenhum `INSERT INTO mpi.consent_log` no repositório inteiro … A tabela
tem 14 consumidores … e **zero produtores**." **INFERÊNCIA:** a tag existe, o
mecanismo de *grant* existe, e o **fato** que a tag pretende representar — a
decisão do titular — não é produzido por ninguém. Uma etiqueta de escopo de
consentimento sobre um repositório sem registro de consentimento **descreve uma
governança que ainda não é exercida**. Isso não invalida o desenho; muda o que se
pode afirmar sobre ele hoje.

**INFERÊNCIA 3.2.7 — "base legal confirmada" sem hipótese nomeada.** O cabeçalho
do ADR-043 registra que a base legal foi confirmada em 2026-08-03 pelo owner do
produto, **sem nomear artigo, inciso ou alínea**, e ao mesmo tempo condiciona o
primeiro *apply* ao parecer do DPO/jurídico. **INFERÊNCIA:** as duas afirmações são
tensas entre si; a segunda é a que a organização efetivamente honrou (o *apply* não
ocorreu). Para o(a) advogado(a), o registro relevante é: **não há hipótese legal
declarada para o índice**, e é isso que o parecer precisa suprir. **Questão Q-06.**

**INFERÊNCIA 3.2.8 — o pareamento probabilístico é também questão de qualidade de
dado.** **FONTE (art. 6º, V):** princípio da qualidade dos dados — "exatidão,
clareza, relevância e atualização". Um par falso-positivo entre PJs
**atribui a uma pessoa a identidade de outra**. O ADR-043 §4 já reconhece o custo
("o RB-07 … existe porque esse erro já aconteceu dentro de um tenant; entre PJs o
custo é maior") e responde com revisão humana obrigatória. **INFERÊNCIA:** essa
salvaguarda é adequada em espécie; o que falta declarar é a **taxa aceitável, a
medição e o procedimento de desfazimento**, que são exigências do art. 6º, V e do
art. 18, III (correção).

### 3.3 Posição sugerida — ponto (a)

> **PROPOSTA A-1 (posição principal).** **Não é possível, com a evidência
> disponível, sustentar a licitude do índice de correspondência cross-PJ sob a
> hipótese do art. 11, II, "f".** A hipótese "f" está desenhada para o tratamento
> que ocorre *dentro* do procedimento assistencial; o índice é operação de
> correlação cadastral entre pessoas jurídicas, com finalidade que o próprio ADR
> descreve como incluindo identificação de **beneficiário**. **Sugere-se que o
> parecer NÃO estenda a base do loop clínico ao índice**, e que trate o índice
> como tratamento autônomo, com finalidade própria, base própria e registro
> próprio.

> **PROPOSTA A-2 (bases candidatas a examinar, em ordem de plausibilidade
> aparente).** Nenhuma é afirmada; são as hipóteses que a minuta sugere que o
> parecer aprecie e **descarte expressamente as que não couberem**:
>
> | Hipótese | Onde poderia caber | Objeção que o parecer precisa vencer |
> |---|---|---|
> | **Art. 11, II, "a"** — cumprimento de obrigação legal ou regulatória | Obrigações setoriais de saúde suplementar exigíveis da operadora | Uma obrigação regulatória concreta precisa ser **nomeada**; obrigação genérica não é base. E ela justificaria o dado exigido pela norma, não a correlação irrestrita. |
> | **Art. 11, II, "d"** — exercício regular de direitos, inclusive em contrato | Relação contratual prestador × operadora × beneficiário | "Em contrato" não significa "porque há um contrato": é preciso identificar o direito exercido e por quem. Risco de leitura elástica. |
> | **Art. 11, II, "f"** — tutela da saúde | Apenas se o cruzamento for **executado a pedido e no curso de um procedimento assistencial concreto**, sob responsabilidade de profissional de saúde | O índice, como estrutura permanente e pré-computada, não tem essa forma. Ver PROPOSTA A-4. |
> | **Art. 11, I** — consentimento específico e destacado | Correlação como serviço optativo ao titular | Hoje **impraticável**: não há escritor de consentimento (ADR-045 L82-86). E não afasta a vedação do art. 11, §5º. |
> | **Art. 11, II, "e"** — proteção da vida ou incolumidade física | Situação de emergência concreta | Não sustenta estrutura permanente; é hipótese de evento. |

> **PROPOSTA A-3 (vedações que nenhuma base legal supera).** Sugere-se que o
> parecer **declare expressamente**, como limite absoluto:
> (i) o índice, seus derivados e qualquer produto dele **não podem ser usados para
> seleção de riscos, precificação, contratação ou exclusão de beneficiários**
> (art. 11, §5º); (ii) não podem sustentar comunicação ou uso compartilhado de
> dados de saúde entre controladores **com objetivo de vantagem econômica**, fora
> das ressalvas do art. 11, §4º.

> **PROPOSTA A-4 (alternativa de desenho a considerar antes de decidir a base).**
> Uma correlação **sob demanda, por caso, disparada por profissional de saúde no
> curso de um atendimento**, com registro do solicitante, do paciente e da
> justificativa, e sem persistência do par além do necessário, teria perfil de
> risco **substancialmente distinto** do de um índice permanente pré-computado —
> e aproximaria o tratamento da forma que a hipótese "f" descreve. **INFERÊNCIA:**
> vale ao(à) advogado(a) considerar se a resposta ao ponto (a) deve ser "sob quais
> condições" em vez de "sim/não", porque a diferença entre as duas formas é
> desenho de engenharia ainda não implementado, e portanto ainda barato de mudar.

### 3.4 Salvaguardas mínimas sugeridas — ponto (a)

**PROPOSTA.** Condições que a minuta sugere que o parecer exija **antes do
primeiro apply**, além das já previstas no ADR-043 (que a minuta credita e
mantém: estrutura separada, ausência de identificador direto, não persistência dos
atributos de *matching*, role dedicada, *grant* explícito, determinístico primeiro,
revisão humana no probabilístico).

| # | Salvaguarda adicional sugerida | Fundamento |
|---|---|---|
| **S-1** | **Finalidade declarada por tipo de par**, em registro próprio, antes da primeira execução; proibição de uso para finalidade não declarada. | art. 6º, I e II; art. 37 |
| **S-2** | **Registro das operações de tratamento** (ROPA) contemplando o índice como tratamento autônomo, com controlador(es) identificado(s). | art. 37 |
| **S-3** | **Relatório de impacto (RIPD)** elaborado antes do primeiro *apply*. O índice reúne dado sensível, cruzamento entre controladores, decisão apoiada por algoritmo e histórico documentado de falha de isolamento — é o caso típico. | art. 38; art. 5º, XVII |
| **S-4** | **Vedação técnica e contratual de exportação** do índice ou de qualquer derivado para fora da role dedicada — em especial para a V2. Já é política da V2 (`privacy-data-map.md` §5.4, controle SEC-0010) e deve ser espelhada do lado AMH. | art. 6º, I; art. 46 |
| **S-5** | **Revogação carimbada, não apagada.** O ADR-043 registra "revogar um consentimento é apagar linha do índice" (L98). Sugere-se substituir por revogação com marcação e data, preservando a trilha de que a correlação existiu. O próprio AMH-020b adota esse padrão em outra tabela: "a revogação é carimbada, não apagada" (§5.4). | art. 6º, X; art. 37 |
| **S-6** | **Trilha de acesso ao índice** — quem leu, quando, para qual finalidade, sobre qual par. Sem log de leitura não se dimensiona incidente. | art. 46; art. 48 |
| **S-7** | **Prazo de retenção dos pares** declarado, e critério de término (art. 15) — inclusive para pares revogados e para pares cujo *score* deixou de ser sustentado. | art. 15; art. 16 |
| **S-8** | **Taxa de falso-positivo medida e publicada**, com procedimento de desfazimento e de notificação dos consumidores afetados. | art. 6º, V; art. 18, III |
| **S-9** | **Informação ao titular** sobre a existência da correlação e sobre como exercer direitos a respeito dela. | art. 9º; art. 18 |
| **S-10** | **Instrução formal escrita** de cada controlador envolvido para a AMH executar o cruzamento — sem a qual o executor estaria decidindo a finalidade por conta própria (ver §3.5). | art. 39; art. 5º, VI e VII |

### 3.5 Papéis controlador/operador entre as PJs

**INFERÊNCIA, e é uma inferência que a minuta considera de alta relevância
prática.** A questão não se resolve por quem hospeda a tabela.

- **FONTE (art. 5º, VI):** controlador é "a quem competem as decisões referentes ao
  tratamento".
- **FONTE (art. 5º, VII):** operador é quem "realiza o tratamento … em nome do
  controlador".
- **FONTE (art. 39):** "O operador deverá realizar o tratamento segundo as
  instruções fornecidas pelo controlador".

**INFERÊNCIA:** o job de *matching* do ADR-043 **decide a finalidade** — ele
determina que duas bases sejam interconectadas, com qual critério e com qual
limiar. Quem toma essa decisão atua como **controlador** daquela operação, ainda
que a operação rode em infraestrutura de terceiro. Três configurações possíveis, e
o parecer precisa escolher uma:

| Configuração | Descrição | Consequência |
|---|---|---|
| **C-i** | Cada PJ é controladora e instrui formalmente a AMH; a AMH é **operadora** do cruzamento. | Exige instrução documentada de **cada** PJ (art. 39) e base legal **em cada** PJ. Uma operadora não pode criar correlação por iniciativa própria. |
| **C-ii** | A AMH é **controladora** do índice, com finalidade própria. | Exige base legal própria da AMH perante os titulares e informação a eles (art. 9º); e enfrenta o art. 11, §4º, se houver vantagem econômica. |
| **C-iii** | PJs e AMH são **controladores conjuntos** da operação de correlação. | Exige repartição documentada de responsabilidades; **FONTE (art. 42, §1º, II):** os controladores diretamente envolvidos respondem **solidariamente** pelos danos. |

**PROPOSTA A-5.** Sugere-se que o parecer **nomeie expressamente a configuração** e
liste, para ela, os instrumentos contratuais necessários. **INFERÊNCIA:** hoje o
arranjo não é nenhuma das três de forma declarada — é uma capacidade técnica
construída antes da alocação de papéis, o que é a ordem inversa da que o art. 37 e
o art. 39 pressupõem. **Questão Q-08.**

### 3.6 Riscos — ponto (a)

| # | Risco | Evidência |
|---|---|---|
| **R-a1** | **Desvio de finalidade para seleção de riscos.** A estrutura que liga histórico assistencial a beneficiário é a mesma que permitiria precificar risco. O desvio pode ocorrer sem que ninguém o decida: basta um novo consumidor com *grant*. | art. 11, §5º; ADR-043 L99 |
| **R-a2** | **Recriação do MPI global.** O ADR-043 descarta explicitamente o MPI global porque ele já existiu e permitiu, até 2026-07-29, que um agente de qualquer tenant resolvesse o `mpi_id` de outro. Um índice mal governado converge para a mesma propriedade. | ADR-043 L46-51 |
| **R-a3** | **Falso-positivo cross-PJ.** Atribuição de identidade errada entre PJs — dano de privacidade **e** perigo clínico simultâneos, já que a V2 chaveia fatos clínicos por sujeito. | ADR-043 L72-79 (RB-07) |
| **R-a4** | **Governança nominal.** Acesso governado por tag de escopo de consentimento cujo registro subjacente tem zero produtores. | ADR-045 L82-86 |
| **R-a5** | **Contaminação silenciosa da V2.** Se a resolução de identidade a montante passar a depender do índice, um par errado entra na V2 como fato clínico do paciente errado, **sem que a V2 tenha como saber**. A V2 não hospeda o índice — e ainda assim é afetada por ele. | INFERÊNCIA de ADR-043 §4 + AQ-4 |
| **R-a6** | **Ausência de instrumento entre controladores.** Sem instrução formal e sem repartição de papéis, a responsabilidade civil tende à solidariedade sem que as partes tenham negociado a alocação. | art. 42, §1º, II |
| **R-a7** | **Concentração de autoridade.** A mesma pessoa decide pelos dois lados. Isso agiliza a decisão e **remove o atrito que normalmente funciona como controle** entre controladores distintos. | DEC-G0-04; registrado como risco pelo próprio `g0-resolucoes` |

### 3.7 Condições sob as quais a posição do ponto (a) mudaria

1. **Se P-2 for falsa** (a `omni` não for operadora de plano de saúde): o art. 11,
   §5º deixa de incidir e o núcleo do risco muda de natureza.
2. **Se for nomeada obrigação legal ou regulatória concreta** que exija a
   correlação: a hipótese do art. 11, II, "a" passa a ser sustentável **nos limites
   dessa obrigação**.
3. **Se o desenho migrar de índice permanente para correlação sob demanda** no
   curso de procedimento assistencial (PROPOSTA A-4): a análise da hipótese "f"
   muda materialmente.
4. **Se passar a existir infraestrutura real de consentimento** (escritor,
   evidência, revogação, vocabulário único): abre-se a via do art. 11, I para os
   usos que a admitam — **exceto** os vedados pelo art. 11, §5º, que permanecem
   vedados.
5. **Se a ANPD editar regulamentação** sob o art. 11, §3º: a análise deve ser
   refeita.
6. **Se o índice passar a conter, ou permitir reconstruir, identificador direto**:
   toda a análise de minimização cai e o risco sobe de patamar.

---

## §4. Ponto (b) — base legal do loop clínico: art. 11, II, "f"

### 4.1 A decisão de negócio que se submete à análise

**FONTE (adjudicação)** — `adjudicacao-decisoes-2026-08-15.md` §2, AQ-3 = Opção C:

1. base legal do laço clínico *single-tenant* em contexto de tratamento = **LGPD
   art. 11, II, alínea "f" — tutela da saúde**, em procedimento realizado por
   profissionais de saúde / serviços de saúde;
2. **o laço clínico não tem portão de consentimento**; o portão exigível é
   **propósito-de-uso + autorização de contexto profissional**;
3. consentimento aplica-se apenas a **usos secundários**, que permanecem
   **bloqueados**;
4. `ie_perm_sms_email` **jamais** constitui consentimento.

**FONTE (adjudicação)** — mesma seção, `legal_ratification: PENDENTE — advogados,
antes de dados reais (DEC-G0-03)`. **INFERÊNCIA:** a própria ata classifica esta
como "a cláusula de maior sensibilidade jurídica" e a submete a ratificação. Esta
minuta a trata, portanto, como **hipótese a ser examinada**, não como premissa.

### 4.2 Texto legal

**FONTE (art. 11, II, "f"):** o tratamento de dados pessoais sensíveis poderá
ocorrer, sem fornecimento de consentimento do titular, nas hipóteses em que for
indispensável para "**tutela da saúde, exclusivamente, em procedimento realizado
por profissionais de saúde, serviços de saúde ou autoridade sanitária**".

Três elementos, e cada um é uma condição:

| Elemento do texto | O que exige | Como se apresenta no IntensiCare |
|---|---|---|
| **"tutela da saúde"** | a finalidade do tratamento é a proteção da saúde do titular | Detecção precoce de deterioração clínica em UTI, para o paciente cujos dados são tratados. **INFERÊNCIA: encaixe forte.** |
| **"indispensável"** (caput do inciso II) | não basta ser útil | Exige justificar **cada categoria de dado** como necessária ao cálculo/alerta. **INFERÊNCIA: encaixe condicionado à minimização efetiva** — ver §4.4. |
| **"exclusivamente, em procedimento realizado por profissionais de saúde, serviços de saúde ou autoridade sanitária"** | o tratamento ocorre **dentro** de procedimento conduzido por esses agentes | **INFERÊNCIA: é aqui que mora a única dúvida séria.** Ver §4.3. |

### 4.3 A questão central: quem realiza o procedimento

**INFERÊNCIA.** O IntensiCare V2 é software fornecido por uma pessoa jurídica que,
em si, não presta assistência à saúde. A hipótese "f" não fala em "software de
apoio"; fala em procedimento realizado por profissionais ou serviços de saúde. Há
duas leituras possíveis, e o parecer precisa escolher:

- **Leitura 1 — a V2 é instrumento do serviço de saúde.** O tratamento ocorre
  **no** procedimento assistencial; o serviço de saúde é o controlador; a V2 (ou a
  OMNI) atua como **operadora** (art. 5º, VII; art. 39), tratando os dados sob
  instrução do serviço de saúde e para a finalidade que este determinou. A base
  legal do art. 11, II, "f" é **do serviço de saúde**, e a V2 se apoia nela por ser
  operadora. **INFERÊNCIA: é a leitura que melhor descreve o uso pretendido** — o
  alerta é entregue ao profissional responsável pelo paciente naquele serviço, e a
  V2 não decide sobre o cuidado.
- **Leitura 2 — a V2 é controladora própria.** Se a V2 determinar finalidades
  próprias (por exemplo, medir o desempenho das suas regras, melhorar o produto,
  ou agregar dados entre instituições), ela é controladora **quanto a essas
  finalidades**, e precisa de base legal própria — que, para dado sensível, não
  será o legítimo interesse, porque ele não existe no art. 11.

**INFERÊNCIA:** as duas leituras **não são excludentes**: é possível — e provável —
que a V2 seja **operadora no loop clínico** e **controladora** de qualquer uso
secundário que venha a pretender. Essa divisão é a razão de o ponto (c) existir
como ponto separado. **Questão Q-11.**

### 4.4 Limites da hipótese "f" — o que ela **não** autoriza

**PROPOSTA B-2.** Sugere-se que o parecer enuncie os limites de forma explícita,
porque a experiência prática é que a base legal é invocada com escopo maior do que
o texto suporta:

1. **Não autoriza tratamento fora do vínculo assistencial concreto.** Um
   profissional que não é responsável por aquele paciente não está, quanto a ele,
   em "procedimento". Daí a exigência de **portão de propósito-de-uso + contexto
   profissional** já decidida em AQ-3, item 2, que a minuta considera acertada e
   sugere que o parecer confirme como **condição**, não como conveniência.
2. **Não autoriza retenção indefinida.** **FONTE (art. 15, I):** o tratamento
   termina quando a finalidade é alcançada ou os dados deixam de ser necessários.
   Prazos de guarda derivados de obrigação de prontuário são **outra** base (art.
   16, I) e **outro** regime — fora do escopo desta minuta (§7).
3. **Não autoriza comunicação a terceiros.** Operadores exigem contrato e
   instrução (art. 39); outros controladores exigem base própria e enfrentam o art.
   11, §4º.
4. **Não autoriza uso secundário.** Ver §5. **INFERÊNCIA:** o art. 11 **não**
   possui cláusula equivalente à do art. 7º, §7º (tratamento posterior para novas
   finalidades). A ausência é significativa e sugere-se que o parecer se pronuncie
   sobre ela. **Questão Q-14.**
5. **Não dispensa os princípios do art. 6º**, a informação ao titular (art. 9º), os
   direitos do art. 18, o ROPA (art. 37), a segurança (art. 46) e a comunicação de
   incidente (art. 48).
6. **Não resolve o art. 20.** **FONTE (art. 20, caput):** direito à revisão de
   decisões "tomadas **unicamente** com base em tratamento automatizado … que
   afetem seus interesses". **INFERÊNCIA:** o desenho do IntensiCare mantém a
   decisão clínica com humano responsável, o que é o argumento de que o art. 20 não
   é acionado; mas isso é **conclusão jurídica**, e esta minuta não a afirma —
   registra que o desenho foi feito para sustentá-la e pede confirmação.
   **Questão Q-15.**
7. **Não cobre dados de profissionais de saúde.** A trilha de auditoria é
   simultaneamente registro de responsabilização clínica e **conjunto de dados de
   monitoramento de trabalhadores**, com regime próprio (`privacy-data-map.md`
   §5.3). **Fora do escopo desta minuta** (§7).

### 4.5 Por que o consentimento **não** é a base adequada no loop clínico

Esta é uma pergunta expressa do OS-16, e a minuta a responde com cinco fundamentos
independentes — cada um bastaria; juntos, a conclusão parece robusta.

**INFERÊNCIA B-i — a lei não exige consentimento onde há hipótese própria.** O art.
11, II arrola hipóteses de tratamento **"sem fornecimento de consentimento do
titular"**. Onde a alínea "f" incide, exigir consentimento **acrescenta um requisito
que a lei não impôs**.

**INFERÊNCIA B-ii — o consentimento seria inválido por falta de liberdade e de
inequivocidade.** **FONTE (art. 5º, XII):** consentimento é "manifestação **livre**,
**informada** e **inequívoca**". **FONTE (art. 8º, §3º):** é vedado o tratamento
mediante vício de consentimento. **INFERÊNCIA:** o cenário de uso é a UTI —
paciente frequentemente sedado, intubado, com rebaixamento de consciência ou sob a
pressão de uma internação crítica. Nesse contexto, "livre e informada" é, na melhor
hipótese, frágil, e a coleta recairia sobre representantes em momento de forte
estresse.

**INFERÊNCIA B-iii — o consentimento é revogável, e a função é de segurança.**
**FONTE (art. 8º, §5º):** o consentimento pode ser revogado a qualquer momento, por
procedimento gratuito e facilitado. **INFERÊNCIA:** um sistema de detecção precoce
de deterioração clínica que possa ser **desligado para um paciente específico por
ato administrativo** cria um estado em que a equipe pode acreditar estar coberta
por uma rede de segurança que, para aquele leito, não existe. Esse é um **perigo
clínico**, não um inconveniente de produto, e sugere-se que ele conste do parecer
como fundamento próprio. Entrada proposta ao `hazard-log.md` (ver handoff).

**INFERÊNCIA B-iv — consentimento como base sugere uma escolha que não existe.**
**FONTE (art. 9º, §3º):** quando o tratamento é condição para o fornecimento do
serviço, o titular deve ser informado **com destaque** disso. **INFERÊNCIA:**
apresentar como opcional um tratamento que ocorrerá de todo modo — porque é parte
do cuidado — é informação enganosa ao titular, e degrada o valor do consentimento
onde ele **de fato** é necessário (usos secundários, §5).

**INFERÊNCIA B-v — não há infraestrutura de consentimento, e improvisá-la seria
fabricar base legal.** **OBSERVADO** — `ADR-045@0a07a6f1` L82-86: zero produtores no
`consent_log`. **OBSERVADO** — L99-104: o único campo de permissão que chega ao lago
é de **contato**, e "usá-lo como consentimento LGPD seria fabricar base legal".
**INFERÊNCIA:** um portão de consentimento no caminho clínico seria hoje ou
**fail-open** (portão que sempre libera, e portanto não é portão) ou **fail-closed**
(portão que bloqueia todo cuidado). Nenhum dos dois é aceitável, e o segundo é
perigoso.

### 4.6 Posição sugerida — ponto (b)

> **PROPOSTA B-1.** Sugere-se que o parecer **confirme a hipótese do art. 11, II,
> "f" como base legal candidata adequada** para o tratamento de dados pessoais
> sensíveis no **loop clínico** do IntensiCare V2 — entendido estritamente como:
> avaliação de dados de um paciente sob cuidado, num serviço de saúde, para
> apresentação a profissional de saúde responsável por aquele paciente, no curso da
> assistência — **condicionada** a: (i) confirmação das premissas P-1 e P-4; (ii)
> alocação expressa de papéis (§4.3); (iii) implementação verificável do portão de
> propósito-de-uso e contexto profissional; (iv) minimização efetiva, sustentando a
> exigência de indispensabilidade; (v) atendimento dos deveres do §4.4, item 5.

> **PROPOSTA B-3.** Sugere-se que o parecer aprecie se a alínea **"e"** do art. 11,
> II — *proteção da vida ou da incolumidade física do titular ou de terceiro* — deve
> ser invocada **cumulativamente** com a "f" para situações de risco iminente, ou se
> a "f" basta. **INFERÊNCIA:** a resposta importa porque, em degradação de sistema
> ou em contexto em que o vínculo profissional-paciente ainda não esteja registrado,
> a "f" pode ser mais difícil de demonstrar do que a "e". **Questão Q-12.**

> **PROPOSTA B-4 (posição sobre o consentimento).** Sugere-se que o parecer
> **afaste expressamente o consentimento como base do loop clínico**, pelos cinco
> fundamentos de §4.5, e que registre que a decisão de não usar consentimento no
> caminho clínico **não** é uma redução de proteção ao titular: ela desloca a
> proteção para onde ela é efetiva — finalidade declarada e verificada, contexto
> profissional, minimização, trilha de acesso e bloqueio de uso secundário.

### 4.7 Condições sob as quais a posição do ponto (b) mudaria

1. **Se P-1 ou P-4 forem falsas** (o tratamento não ocorrer em serviço de saúde, ou
   o destinatário do alerta não for o profissional responsável): a hipótese "f"
   deixa de se sustentar como está.
2. **Se a V2 assumir finalidades próprias sobre os mesmos dados**: passa a ser
   controladora quanto a elas, e a "f" não as cobre (§5).
3. **Se o portão de propósito-de-uso não for implementado como controle
   verificável** — servidor derivando a finalidade, e não campo enviado pelo
   cliente: a condição (iii) da PROPOSTA B-1 não é cumprida.
4. **Se o sistema passar a produzir decisão que dispense a intervenção humana**:
   o art. 20 passa a ser questão central e não periférica.
5. **Se a ANPD emitir orientação sobre a alínea "f"** que restrinja ou amplie o
   entendimento: refazer.
6. **Se o tratamento envolver menores de idade**: incide o art. 14, com regime
   próprio — **não analisado nesta minuta** (§7).

---

## §5. Ponto (c) — bloqueio de usos secundários

### 5.1 O que se entende por uso secundário

**INFERÊNCIA:** qualquer tratamento dos mesmos dados para finalidade **distinta** da
assistência ao paciente de quem os dados são. O `privacy-data-map.md` §2 registra o
vocabulário candidato de finalidades e, ao final, uma lista de finalidades
"explicitamente fora de escopo salvo aprovação separada e específica": pesquisa
secundária; treinamento de modelos de qualquer tipo; analytics comercial;
benchmarking entre organizações; qualquer correlação cross-PJ; qualquer divulgação
a provedor de modelo.

**OBSERVADO** — `ADR-045@0a07a6f1` L106-113: o vocabulário de `scope` está **partido
em dois** — o DDL usa `analytics | research | sharing_amh_internal |
external_sharing`; o gate dos agentes usa `treatment | research | billing |
ml_training | operational_analytics`, com *default* `"treatment"` que o mapeamento do
Maezo "nem aceita". **INFERÊNCIA:** enquanto os vocabulários não convergirem, não é
possível nem sequer **nomear** de forma unívoca a finalidade de um acesso — o que
inviabiliza demonstrar limitação de finalidade (art. 6º, I) por evidência.

### 5.2 Por que o bloqueio é a posição correta hoje

**INFERÊNCIA C-i — o art. 11 não tem legítimo interesse.** Para dado pessoal comum,
o art. 7º, IX permitiria discutir analytics sob legítimo interesse com teste de
balanceamento. **Para dado sensível essa hipótese não existe.** As portas do art. 11
para uso secundário são estreitas e cada uma tem requisito próprio:

| Uso secundário | Porta possível | Requisito que hoje não está satisfeito |
|---|---|---|
| **Pesquisa científica** | art. 11, II, "c" — estudos por **órgão de pesquisa** | **FONTE (art. 5º, XVIII):** órgão de pesquisa é entidade pública ou pessoa jurídica de direito privado **sem fins lucrativos**. **INFERÊNCIA:** uma empresa com fins lucrativos não é órgão de pesquisa; a alínea "c" não a alcança diretamente. Restaria consentimento (art. 11, I) e/ou parceria com instituição que se qualifique — além do regime ético de pesquisa, **fora do escopo** (§7). |
| **Analytics operacional / qualidade assistencial** | eventualmente art. 11, II, "f", se estritamente interno ao próprio serviço de saúde e voltado à qualidade do cuidado que ele presta | **INFERÊNCIA:** é a zona cinzenta mais relevante do ponto (c). Depende de quem trata, para quem, e se o resultado retorna ao cuidado. **Questão Q-16.** |
| **Analytics comercial / benchmarking entre instituições** | nenhuma aparente | Envolve uso compartilhado entre controladores; art. 11, §4º e §3º. |
| **Treinamento de modelos (ML)** | art. 11, I (consentimento específico e destacado) ou anonimização efetiva (art. 12) | Não há infraestrutura de consentimento (ADR-045); e PSR **não é** anonimização (§1.3). |
| **Desenvolvimento de produto** | nenhuma, com dado real | **FONTE — `DEC-G0-03`:** desenvolvimento exclusivamente com dados sintéticos. |
| **Seleção de risco / precificação / contratação de beneficiário** | **nenhuma, em nenhuma hipótese** | **FONTE (art. 11, §5º):** vedação objetiva às operadoras. Não desbloqueável por consentimento. |

**INFERÊNCIA C-ii — a anonimização não é a saída fácil que costuma parecer.** Séries
temporais fisiológicas de UTI, com data/hora, unidade e desfecho, são altamente
singularizantes. **FONTE (art. 12, caput):** dado anonimizado deixa de ser pessoal
"salvo quando … com esforços razoáveis, puder ser revertido". **PROPOSTA:** nenhuma
afirmação de anonimização deve ser aceita sem **metodologia documentada e teste de
reidentificação**; e a substituição de identificadores por PSR **não** é
anonimização (§1.3).

### 5.3 Posição sugerida — ponto (c)

> **PROPOSTA C-1.** Sugere-se que o parecer **confirme o bloqueio** e o enuncie na
> forma positiva: *"os dados tratados sob o art. 11, II, 'f' no loop clínico do
> IntensiCare V2 não podem ser utilizados para nenhuma finalidade distinta da
> assistência ao próprio titular, salvo mediante base legal específica, declarada e
> ratificada para aquela finalidade, previamente ao tratamento."*

> **PROPOSTA C-2 (o que fica vedado, lista explícita).** Sem nova base legal:
> pesquisa secundária; treinamento, ajuste fino ou avaliação de modelos com dado
> real; analytics comercial; benchmarking entre organizações; painéis de gestão que
> excedam o necessário ao cuidado; envio de qualquer categoria clínica a provedor de
> modelo; qualquer exportação para ambiente não produtivo; qualquer correlação
> cross-PJ; e **qualquer uso relacionado a seleção de risco ou a contratação e
> exclusão de beneficiários — este último vedado em definitivo, e não meramente
> bloqueado**.

> **PROPOSTA C-3 (o que seria preciso para desbloquear).** Para **cada** finalidade
> secundária, cumulativamente: (i) finalidade específica declarada por escrito, com
> controlador identificado; (ii) hipótese do art. 11 nomeada e sustentada para
> **aquela** finalidade; (iii) verificação de que não incide o art. 11, §4º ou §5º;
> (iv) RIPD (art. 38); (v) minimização e prazo de retenção próprios; (vi)
> informação ao titular (art. 9º) e via de exercício de direitos (art. 18); (vii)
> instrumentos contratuais com quem tratar (art. 39); (viii) registro em ROPA (art.
> 37); e — quando a via for o consentimento — (ix) infraestrutura real de
> consentimento: escritor, evidência, escopo específico e destacado, revogação
> gratuita e facilitada, e **vocabulário de escopo único** (a divergência do ADR-045
> L106-113 é pré-requisito técnico do desbloqueio, e é o objeto da OS-21, hoje
> diferida).

> **PROPOSTA C-4 (o bloqueio precisa ser controle, não frase).** Sugere-se que o
> parecer condicione a posição à existência de **controle técnico verificável**:
> propósito-de-uso obrigatório e derivado no servidor em toda requisição e em todo
> registro de auditoria; ausência de *grant* de finalidade secundária em qualquer
> ambiente; e teste negativo que asseste a impossibilidade — não a mera ausência —
> de leitura por consumidor de finalidade secundária. **INFERÊNCIA:** um bloqueio
> que depende de ninguém pedir acesso não é um bloqueio.

### 5.4 Condições sob as quais a posição do ponto (c) mudaria

1. **Se surgir infraestrutura real de consentimento** com evidência e revogação:
   abre-se a via do art. 11, I para os usos que a admitam.
2. **Se houver parceria formal com órgão de pesquisa** qualificado pelo art. 5º,
   XVIII: abre-se a discussão da alínea "c", ainda sujeita ao regime ético de
   pesquisa (fora do escopo, §7).
3. **Se for demonstrada anonimização efetiva**, com metodologia e teste de
   reidentificação: o tratamento sai do âmbito da LGPD por força do art. 12 —
   ônus alto e que a minuta sugere não presumir vencido.
4. **Se o uso secundário for reclassificado como interno à própria tutela da
   saúde** (ex.: monitoramento de qualidade do cuidado prestado pelo próprio
   serviço, com retorno ao cuidado): a análise muda — e é o pedido da Q-16.
5. **Se a ANPD regulamentar o art. 11, §3º**: refazer.
6. **Nada** desbloqueia o uso vedado pelo art. 11, §5º.

---

## §6. Ponto (d) — `ie_perm_sms_email` jamais é consentimento LGPD

### 6.1 Fatos

**OBSERVADO** — `ADR-045@0a07a6f1` L99-104:

> "A origem do consentimento continua sendo decisão de negócio + DPO. A tabela
> `CONSENTIMENTO_LGPD` mencionada em `docs/reference/tasy-views-fhir-mapping.html`
> **não está em nenhuma lista de ingestão**. O único campo de permissão que chega ao
> lake é `ie_perm_sms_email` (`silver_tasy_pessoa_fisica`), que é **permissão de
> CONTATO, não consentimento de finalidade** — usá-lo como consentimento LGPD seria
> **fabricar base legal**."

**OBSERVADO** — `ADR-045@0a07a6f1` L82-86: `mpi.consent_log` tem 14 consumidores e
**zero produtores**; a API do Maezo tem apenas rotas de leitura.

**FONTE (adjudicação)** — AQ-3, item 4: *"`ie_perm_sms_email` **JAMAIS** constitui
consentimento — registrado em definitivo."*

### 6.2 Análise

**INFERÊNCIA D-i — finalidade diversa.** **FONTE (art. 5º, XII):** consentimento é
manifestação "para uma **finalidade determinada**". **FONTE (art. 8º, §4º):** "O
consentimento deverá referir-se a finalidades determinadas, e as autorizações
genéricas para o tratamento de dados pessoais **serão nulas**." A finalidade
determinada de uma permissão de contato é **ser contatado por SMS ou e-mail**. Usá-la
para autorizar tratamento de dado de saúde é usar uma manifestação de vontade para
finalidade sobre a qual o titular não se manifestou — o que, além de não constituir
consentimento, **viola os princípios da finalidade e da adequação** (art. 6º, I e II).

**INFERÊNCIA D-ii — falta o requisito qualificado do dado sensível.** **FONTE (art.
11, I):** para dado sensível, o consentimento deve ser "de forma **específica e
destacada**, para finalidades específicas". Um campo booleano de cadastro de ERP não
é específico nem destacado quanto a tratamento de dados de saúde.

**INFERÊNCIA D-iii — o ônus da prova não pode ser cumprido.** **FONTE (art. 8º,
caput):** o consentimento "deverá ser fornecido por escrito ou por outro meio que
demonstre a manifestação de vontade do titular". **FONTE (art. 8º, §2º):** "Cabe ao
controlador o **ônus da prova** de que o consentimento foi obtido em conformidade
com o disposto nesta Lei." **INFERÊNCIA:** um indicador booleano, sem texto
apresentado, sem data, sem canal e sem evidência associada, **não demonstra**
manifestação de vontade alguma. Não há como produzir a prova que o art. 8º, §2º
exige.

**INFERÊNCIA D-iv — não há revogação.** **FONTE (art. 8º, §5º):** revogação a
qualquer momento, por procedimento gratuito e facilitado. **INFERÊNCIA:** não existe
via pela qual o titular revogue algo que ele não concedeu, e a alteração do campo de
permissão de contato não teria o efeito de cessar tratamento clínico algum.

**INFERÊNCIA D-v — a inversão do sinal é igualmente indevida.** **INFERÊNCIA:** se o
campo não pode **autorizar**, ele tampouco pode **negar**: bloquear tratamento
assistencial porque um titular optou por não receber SMS seria atribuir ao campo um
significado que ele não tem, na direção oposta, com potencial dano clínico. O campo
deve ser **irrelevante** para o loop clínico, e não "interpretado com cautela".

### 6.3 Posição sugerida — ponto (d)

> **PROPOSTA D-1.** Sugere-se que o parecer **confirme, sem ressalva**, que
> `ie_perm_sms_email` — ou qualquer campo de permissão de canal de contato — **não
> constitui, em nenhuma hipótese, consentimento LGPD para tratamento de dados
> pessoais sensíveis referentes à saúde**, por violar simultaneamente os arts. 5º,
> XII; 8º, caput, §2º, §4º e §5º; 11, I; e 6º, I e II.

> **PROPOSTA D-2 (invariantes técnicos derivados, a exigir do contrato v1).**
> (i) O campo **não é lido** pela V2 e não atravessa a fronteira do contrato;
> (ii) `consent_decision_ref` **jamais** deriva dele nem de qualquer campo de
> permissão de contato — invariante verificável em teste, exatamente como já
> exigido no critério de aceitação 2 da OS-13;
> (iii) o campo **não gateia**, em nenhuma direção, o loop clínico;
> (iv) qualquer futuro `consent_decision_ref` referencia **evidência de
> consentimento** (identificador de evento, escopo, data, canal, texto
> apresentado), e sua ausência é representada como **ausência**, nunca como negativa
> nem como autorização.

> **PROPOSTA D-3.** Sugere-se que o parecer registre que **os cinco documentos que
> hoje ensinam a escrever no `consent_log` com colunas inexistentes** (**OBSERVADO**
> — `ADR-045@0a07a6f1` L88-97) sejam corrigidos **antes** de qualquer captação real
> de consentimento: um procedimento de revogação que falha por erro de SQL no
> momento em que é acionado é falha de atendimento a direito do titular (art. 18),
> não apenas defeito de documentação.

### 6.4 Condições sob as quais a posição do ponto (d) mudaria

**PROPOSTA:** **nenhuma configuração deste campo o converte em consentimento
válido.** A posição só mudaria se **outro** artefato passasse a existir — uma captação
de consentimento específica, destacada, evidenciada, datada, com escopo declarado e
revogação operante — que seria **um novo campo com nova semântica**, e não este. Um
eventual carregamento futuro da tabela `CONSENTIMENTO_LGPD` (hoje não ingerida,
**OBSERVADO** — ADR-045 L99-101) deveria ser avaliado **de novo e por inteiro**, sem
herdar nada desta análise.

---

## §7. O QUE ESTA MINUTA NÃO COBRE

Registrado de forma explícita para que a ausência não seja lida como afirmação. Cada
item abaixo é **matéria não analisada**, e sobre nenhum deles esta minuta permite
extrair qualquer conclusão — nem positiva, nem negativa.

### 7.1 Regulação sanitária e de produto

1. **ANVISA / software como dispositivo médico (SaMD)** — enquadramento,
   classificação de risco, necessidade de registro/notificação, requisitos de ciclo
   de vida e de pós-mercado. **Não analisado.** É determinação regulatória distinta
   da proteção de dados e pode impor requisitos que alteram o desenho.
2. **Certificação de sistemas de registro eletrônico em saúde** e requisitos
   técnicos correlatos. **Não analisado.**

### 7.2 Prontuário, prática profissional e guarda documental

3. **Normas do Conselho Federal de Medicina sobre prontuário** — incluindo prazos de
   guarda, requisitos de registro eletrônico e responsabilidade sobre o registro
   clínico (a vigência e a redação atual das resoluções aplicáveis devem ser
   verificadas pelo(a) advogado(a)). **Não analisado.** A premissa P-6 assume que a
   V2 **não** é prontuário; se essa premissa cair, todo o regime de retenção muda.
4. **Normas de conselhos de outras profissões de saúde** (enfermagem, farmácia,
   fisioterapia) quanto a registro e responsabilidade. **Não analisado.**
5. **Sigilo profissional** e suas relações com o acesso de terceiros ao dado
   clínico. **Não analisado.**

### 7.3 Saúde suplementar

6. **Regulação da ANS aplicável à operadora** — incluindo obrigações de troca de
   informações em saúde suplementar e seus padrões. **Não analisado**, embora seja
   candidato natural a fundamentar a hipótese do art. 11, II, "a" no ponto (a).

### 7.4 Instrumentos contratuais e terceiros

7. **Contratos com operadores** (art. 39) — cláusulas de tratamento, subcontratação,
   auditoria, notificação de incidente, devolução e eliminação. **Não redigidos nem
   analisados.**
8. **Instrumento entre controladores** para o índice do ADR-043 e para o contrato
   AMH×IntensiCare. **Não analisado.**
9. **Contratos com as instituições de saúde** usuárias e as obrigações de proteção de
   dados neles previstas. **Não analisados.**

### 7.5 Transferência internacional e infraestrutura

10. **Transferência internacional de dados** (arts. 33 a 36). **Não analisada.**
    **OBSERVADO** — `privacy-data-map.md` §5.1: nenhum provedor de nuvem, região,
    serviço gerenciado ou provedor de modelo foi selecionado. A análise é
    **impossível** hoje e **obrigatória** antes da escolha de plataforma.
11. **Localização/residência de dados**, se exigível. **Não analisada.**
12. **Provedores de modelo de linguagem** e o regime do envio de qualquer dado a
    eles. **Não analisado**; a V2 mantém, como proposta, vedação integral
    (`privacy-data-map.md` §5.5).

### 7.6 Outras matérias de proteção de dados não analisadas aqui

13. **Dados de crianças e adolescentes** (art. 14). **Não analisado.**
14. **Titulares falecidos** e o regime de seus dados. **Não analisado.**
15. **Dados de profissionais de saúde e monitoramento de trabalhadores** —
    a trilha de auditoria é também um conjunto de dados sobre a equipe.
    **Não analisado**; regime trabalhista e sindical não considerado.
16. **Relatório de impacto (RIPD)** — esta minuta **não é** RIPD, não substitui um, e
    não pode ser citada como tal, no todo ou em parte. Ela **sugere** que um seja
    elaborado (S-3, C-3).
17. **Registro das operações de tratamento (ROPA, art. 37)** — inexistente; não
    elaborado aqui.
18. **Encarregado (art. 41)** — não nomeado; a minuta não opina sobre necessidade ou
    perfil.
19. **Plano de resposta a incidentes e comunicação** (art. 48) e seus prazos e
    limiares. **Não analisado.**
20. **Prazos de retenção concretos** para qualquer categoria. **Não fixados.**
21. **Direitos do titular** — fluxo, prazos, verificação de identidade e exceções
    aplicáveis a registro clínico. **Não desenhados.**
22. **Decisões automatizadas (art. 20)** — apenas sinalizado como questão (Q-15), não
    analisado.
23. **Responsabilidade civil, sanções administrativas e sua dosimetria.**
    **Não analisadas.**
24. **Regime ético de pesquisa com seres humanos** (sistema CEP/CONEP), caso a via de
    pesquisa venha a ser explorada. **Não analisado**, e é adicional à LGPD, não
    alternativo a ela.
25. **Direito da concorrência** em arranjos de compartilhamento entre PJs do mesmo
    grupo econômico. **Não analisado.**
26. **Vedação de discriminação em outros regimes** (consumidor, saúde suplementar)
    além do art. 6º, IX e do art. 11, §5º. **Não analisada.**

### 7.7 Limites de método desta minuta

27. Esta minuta é redigida por **agente de engenharia**, sem habilitação para emitir
    parecer jurídico. Ela **não** pesquisou jurisprudência, precedentes
    administrativos da ANPD, nem doutrina.
28. A evidência técnica é **pinada em um único commit** e pode estar desatualizada em
    relação ao estado atual da plataforma AMH.
29. Quatro artefatos AMH relevantes (ADR-006, ADR-039, ADR-041, ADR-042) são
    **FONTE (adjudicação)** e **não** foram lidos por este especialista.
30. O `privacy-data-map.md` do ciclo 0 tem lacunas que este trabalho expôs; elas
    estão listadas no *handoff* como **entradas propostas**, e o mapa **não** foi
    editado.

---

## §8. Questões numeradas ao(à) advogado(a)

As questões estão agrupadas por ponto. As marcadas **[CRÍTICA]** são as que, se
respondidas negativamente, invalidam o desenho em curso — e por isso deveriam vir
primeiro, ainda que em parecer preliminar.

### Transversais

| # | Questão |
|---|---|
| **Q-01** | **[CRÍTICA]** O controle societário comum entre OMNI e AMH produz **algum** efeito para fins de LGPD? Em particular: a transferência de dados entre PJs do grupo é uso compartilhado entre controladores (art. 5º, XVI) ou pode ser tratada como circulação interna? |
| **Q-02** | Qual a alocação correta de papéis (controlador, operador, controladores conjuntos) entre: as PJs clínicas, a operadora `omni`, a AMH e a OMNI/IntensiCare V2 — **por operação**, e não em bloco? |
| **Q-03** | Dados chaveados por `portable_subject_ref` são dados pessoais para a V2? A análise de §1.3 (pseudonimização, não anonimização; art. 13, §4º inaplicável fora do art. 13) procede? |
| **Q-04** | Há alguma obrigação de proteção de dados que recaia sobre a V2 **antes** de qualquer tratamento de dado real — por exemplo, ROPA, encarregado, ou política — ou todas se iniciam com o primeiro tratamento? |

### Ponto (a) — índice cross-PJ

| # | Questão |
|---|---|
| **Q-05** | O par `(tenant_a, mpi_id_a) ↔ (tenant_b, mpi_id_b)`, sem identificador direto, é dado pessoal? É dado pessoal **sensível**, considerando que a existência do par revela relação assistencial e vínculo com plano? |
| **Q-06** | **[CRÍTICA]** Qual hipótese do art. 11 sustenta a criação e a manutenção do índice, e para **qual finalidade declarada**? O ADR-043 registra "base legal confirmada" sem nomear artigo. |
| **Q-07** | **[CRÍTICA]** O art. 11, §5º incide sobre a `omni`? Em caso positivo, quais usos do índice ficam vedados **em definitivo**, independentemente de consentimento, e como essa vedação deve ser tornada verificável? |
| **Q-08** | Que instrumentos são exigíveis entre as PJs e a AMH para que o cruzamento seja lícito (instrução do art. 39, acordo entre controladores, repartição de responsabilidades)? |
| **Q-09** | O índice, tal como desenhado, exige RIPD antes do primeiro *apply*? Se sim, com qual conteúdo mínimo? |
| **Q-10** | A revogação por **exclusão física** da linha do índice (ADR-043 L98) é adequada, ou deve ser substituída por revogação carimbada, à luz dos arts. 6º, X e 37? |

### Ponto (b) — loop clínico

| # | Questão |
|---|---|
| **Q-11** | **[CRÍTICA]** A V2 é operadora do serviço de saúde no loop clínico (Leitura 1, §4.3), ou controladora própria? A resposta muda quem detém a base do art. 11, II, "f". |
| **Q-12** | A alínea "e" do art. 11, II deve ser invocada cumulativamente com a "f" para situações de risco iminente? |
| **Q-13** | O que caracteriza, juridicamente, "procedimento realizado por profissionais de saúde" para efeito da alínea "f" quando parte do tratamento é executada por software fornecido por terceiro? |
| **Q-14** | O art. 11 admite tratamento posterior para nova finalidade, à maneira do art. 7º, §7º, ou a ausência de dispositivo equivalente é intencional e restritiva? |
| **Q-15** | O art. 20 é acionado por escores e alertas do IntensiCare, considerando que a decisão clínica permanece com profissional responsável? Que evidência precisa existir para sustentar a resposta? |

### Ponto (c) — usos secundários

| # | Questão |
|---|---|
| **Q-16** | **[CRÍTICA]** Análise de qualidade do cuidado, feita pelo próprio serviço de saúde sobre seus próprios pacientes, com resultado retornando ao cuidado, está dentro da alínea "f" ou é uso secundário que exige nova base? |
| **Q-17** | Que requisitos de anonimização a organização precisaria demonstrar para que um conjunto de dados de UTI saísse do âmbito da LGPD pelo art. 12? Teste de reidentificação é exigível? |
| **Q-18** | Sendo a OMNI empresa com fins lucrativos, há via pela qual a alínea "c" do art. 11, II possa ser acionada — por exemplo, em parceria com instituição qualificada como órgão de pesquisa? |
| **Q-19** | Qual a forma mínima aceitável de um registro de consentimento (conteúdo, evidência, prova, revogação) para que ele sirva de base a uso secundário de dado de saúde? |

### Ponto (d) — `ie_perm_sms_email`

| # | Questão |
|---|---|
| **Q-20** | Confirma-se, sem ressalva, que a permissão de contato não constitui consentimento LGPD para dado de saúde? |
| **Q-21** | A **ausência** do campo, ou o valor negativo dele, pode produzir **algum** efeito jurídico sobre o loop clínico — ou o campo deve ser tratado como integralmente irrelevante? |
| **Q-22** | Há risco em **manter** o campo acessível no lago sem uso, ou a recomendação deve ser de segregação explícita? |

### Sobre o próprio parecer

| # | Questão |
|---|---|
| **Q-23** | O parecer pode ser emitido em **duas etapas** — preliminar cobrindo (b) e (d), e definitivo cobrindo (a) e (c) — sem prejuízo à sua utilidade? Ver justificativa de caminho crítico em `pedido-de-parecer.md`. |
| **Q-24** | Que documentos adicionais o(a) advogado(a) precisa receber, além dos anexos listados, para emitir com segurança? |
| **Q-25** | Sob quais condições o parecer deve ser **revisitado** por decurso de prazo, independentemente de mudança de fato? |

---

## §9. Encerramento

**PROPOSTA.** Esta minuta é insumo. Sugere-se que o parecer definitivo, ao ser
emitido: (i) seja anexado ao ADR-043 no repositório AMH, conforme o próprio ADR
exige em seu cabeçalho (L5-6); (ii) seja registrado no `decision-register.md` da V2
com ID `GDEC-nnnn` pelo steward de governança; (iii) tenha suas condições convertidas
em requisitos rastreáveis e testes; e (iv) declare sua própria regra de revisão.

**Nada nesta minuta foi decidido.** Nenhum artefato fora de
`docs/11-security-privacy-compliance/lgpd-os16/` foi alterado. Nada foi escrito no
repositório AMH. Este documento não contém dado pessoal, dado de paciente,
credencial, segredo nem identificador real.

---

*Preparado pelo engenheiro de privacidade, LGPD e registros do IntensiCare V2, em
2026-08-15, sob a autorização de redação como sugestão de `DEC-G0-03`. Rótulos
conforme `docs/00-governance/evidence-notation.md`. Idioma pt-BR conforme
`DEC-G0-10`.*
