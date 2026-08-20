---
doc_id: 10-ux-analise-de-lacunas-frontend
title: >
  Análise de lacunas de frontend, UI e UX — oito defeitos de correção
  verificados e corrigidos, e nove lacunas de escopo registradas com
  rastreabilidade
status: PROPOSAL
label: PROPOSAL
owner: UNASSIGNED — VALIDATION REQUIRED
collector: análise de lacunas de frontend/UX (leitura de código + confronto normativo)
source: >
  apps/web/src/** e apps/web/e2e/** lidos integralmente;
  INTENSICARE_V2_ORCHESTRATOR_PROMPT.md §11 (linhas 933-972);
  ADR-0008 N3/N5/N7, ADR-0009 W1-W12, ADR-0011 P6/P7/P8, ADR-0021 F1-F8/V1-V5,
  ADR-0026 INV-B, ADR-0029 P1-P9;
  SAF-0005, SAF-0024, SAF-0025, SAF-0034, SAF-0040;
  QAS-0017, QAS-0023, QAS-0028;
  HAZ-0001, HAZ-0002, HAZ-0005, HAZ-0023, HAZ-0025, HAZ-0037, HAZ-0043, HAZ-0046;
  docs/10-ux-and-accessibility/ (os cinco artefatos de SPR-G4-3);
  packages/contratos/openapi.yaml, asyncapi.yaml, src/index.ts, src/asyncapi.ts
date_collected: 2026-08-18
last_updated: 2026-08-19
addenda:
  - "§0 (2026-08-18): aviso de que a tabela dos oito LAC-D* é da PRIMEIRA rodada e não contém os achados da quarta onda"
  - "LAC-L1 (2026-08-18): conferência de obsolescência contra apps/web/README.md + quarto defeito da fiação (tempestade de requisição)"
  - "§5 (2026-08-18): ACH-O3-9 a ACH-O3-14 — seis achados de apresentação da quarta onda adversarial"
  - "§6 (2026-08-18): três pendências humanas criadas pelos fechos de §5, sem dono e sem DECIDED"
  - "LAC-L4/LAC-L5 (2026-08-19): correção de citação cruzada desatualizada — `ADR-0015` não está mais `not-started` (direção aceita GDEC-0016; minuta materializada GDEC-0015); 2.2.1 permanece corretamente FORA da matriz, mas pela ausência de sessão real/IdP contratado, não por pendência de aceite do ADR. Critérios de aceite pré-estagiados em `criterios-de-aceite-wcag-2-2-1-timing-adjustable.md`"
  - "LAC-L3 (2026-08-19): correção datada — a divergência de `BandaRisco` (tipo) fechou no código (`mapearBanda` removido, `BandaRisco` alias direto do contrato); a frase de abertura sobre enums REST 'não verificados contra nada' também estava desatualizada (Parte F1/G3 acrescentadas a `check_contratos.mjs`: 258 verificações, eram 209; 99 casos de autoteste, eram 35); `Frescor` (3×9) e ausência de geração de código a partir do contrato seguem abertas"
provenance:
  source_repo: intensicare-V2
  path_or_url: docs/10-ux-and-accessibility/analise-de-lacunas-frontend.md
  commit_sha_or_version: 7eef8c0 (base de leitura; correções aplicadas em branch de trabalho)
  section_or_lines: documento inteiro
  date_collected: 2026-08-18
  collector: análise de lacunas de frontend/UX
  transformation: >
    compilado — cada defeito reproduzido por leitura do arquivo citado e
    convertido em teste que falha no commit-base antes de existir correção;
    cada lacuna confrontada com a cláusula normativa que a nomeia
  confidence: high
  owner: UNASSIGNED — VALIDATION REQUIRED
  validation_status: VALIDATION REQUIRED
---

# Análise de lacunas de frontend, UI e UX

> **Rótulos locais:** os identificadores `LAC-*` usados abaixo são **IDs
> documento-locais, pendentes de ratificação em
> `docs/00-governance/traceability-policy.md` §1.1** — mesmo regime dos rótulos
> `RLI-*` e `IA-*` dos documentos irmãos. Nenhum prefixo novo de taxonomia é
> cunhado.
>
> **Estado factual preservado (inalterado por este trabalho):** 0 vias
> acionáveis; 47/47 vias inelegíveis; `Observation` da AMH não consumível;
> relação com a AMH = candidato a integração; safety case em M0; nenhum dado
> real acessado. Nenhum gate foi aprovado, nenhum `MG-*` foi satisfeito e
> nenhum hazard foi fechado por este documento.

## 0. O que esta análise encontrou, e por que importa

O frontend da fatia SPR-G7-2 é honesto no que declara. A galeria de estados
rotula o que não tem transporte real; a declaração de acessibilidade diz "NÃO
VALIDADA" e há teste impedindo que diga outra coisa; a guarda de build reprova
marcadores sintéticos. Esse cuidado é real e foi preservado.

O achado desta análise é que, **por baixo dessa honestidade declarada, havia
oito defeitos de correção** — comportamento implementado que contraria cláusula
vinculante já aceita. Não são lacunas de escopo. São afirmações que a tela fazia
e que o backend não sustentava, ou o inverso: informação que o backend produzia
e a tela descartava.

A distinção é o ponto. Uma lacuna de escopo é visível: falta a tela de
escalonamento, e todo mundo sabe. Um defeito destes é invisível justamente
porque o teste que o denunciaria não existia — três dos oito viviam em caminhos
que **nenhum teste da fatia percorria**.

| # | Defeito | Cláusula contrariada | Disposição |
|---|---|---|---|
| LAC-D1 | `If-Match` carregava a versão corrente, não a vista | ADR-0009 W3/W6; HAZ-0023 | **CORRIGIDO** |
| LAC-D2 | Racional do backend descartado no mapeamento | ADR-0008 N3; ADR-0021 F3/F8; ADR-0026 INV-B | **CORRIGIDO** |
| LAC-D3 | Cliente derivava severidade que o backend não emitiu | ADR-0011 P7; ADR-0021 F3; QAS-0017 | **CORRIGIDO** |
| LAC-D4 | Detalhe perdia o conteúdo na falha de recarga | SAF-0025; WF-05; e HAZ-0001/0002 no caminho inverso | **CORRIGIDO** |
| LAC-D5 | Motivo do bloqueio inalcançável por tecnologia assistiva | SAF-0034; HAZ-0037 | **CORRIGIDO** |
| LAC-D6 | Versão de regra literal no cliente | ADR-0021 F8 | **CORRIGIDO** |
| LAC-D7 | Linha de alerta sem referência de paciente | IA-N10; HAZ-0001/0002 | **CORRIGIDO** |
| LAC-D8 | Divulgação temporária e obrigação permanente fundidas | ADR-0004 §6.2; HAZ-0046; RLI-5 | **CORRIGIDO** |

**Adendo 2026-08-18 (fim da sessão) — uma SEGUNDA leva de achados existe, e
não está nesta tabela.** A tabela acima é o registro fechado dos **oito**
defeitos `LAC-D*` da primeira rodada e **não foi alterada**: mexer nela
falsificaria a contagem que o próprio texto abaixo afirma. Uma quarta onda de
revisão adversarial, posterior, produziu mais seis achados de apresentação —
`ACH-O3-9` a `ACH-O3-14` —, registrados em **§5**, com as pendências humanas
que eles criaram em **§6**. Entre eles está `ACH-O3-12`, cujo alcance medido
é maior que o de qualquer `LAC-D*`: *"✓ Dado atual." era o rótulo de **cada**
cartão da UTI, sempre, a partir de zero evidência.* Quem estiver contando
defeitos deste frontend precisa somar §1 e §5, e nem essa soma pode ser lida
como convergência (§3 item 1).

## 1. Os oito defeitos

### LAC-D1 — A concorrência otimista estava anulada

`apps/web/src/api/clienteHttp.ts` relia a projeção da grade **no instante do
envio** para extrair a versão do `If-Match`. O comentário acima da linha
afirmava "a versão vista (If-Match) vem da projeção corrente — concorrência
otimista de ponta a ponta". O código fazia o oposto do que a frase descreve.

ADR-0009 W3 exige "token de versão obrigatório; conflito → falha explícita com
estado corrente e autor da mudança vencedora; **jamais** última-escrita-vence
silenciosa". A versão que satisfaz W3 é a que o **ator humano viu** quando
decidiu. Lendo a versão corrente, o cliente adotava em silêncio qualquer mudança
feita por outro clínico entre a renderização e a confirmação. Três consequências:

1. **O 412 era inalcançável pela UI.** O conflito que W3 existe para expor nunca
   ocorria — a última-escrita-vence voltava pela porta dos fundos (HAZ-0023).
2. **A `AuditEvidence` de W6 gravava uma "versão vista" que ninguém viu** — o
   rastro ficava falso na única coluna que liga o registro à decisão humana.
3. O `?? 0` fabricava `If-Match: 0` quando o alerta sumia da grade (resolvido
   por outro plantonista, por exemplo): um token de concorrência inventado sobre
   um recurso desconhecido.

Nenhum teste percorria este caminho. `clienteHttp.test.ts` cobria apenas os
mapeadores puros; o dublê não produzia 412; o E2E não chega ao comando porque a
API não emite alerta sem bundle assinado. **Verde vácuo da classe que as
revisões adversariais anteriores vinham caçando.**

**Correção.** A porta passou a exigir `versaoVista` (`OpcoesReconhecer`), de
modo que omiti-la é erro de compilação. A releitura da grade foi removida.
Ausência de versão é recusa com 428, nunca valor fabricado. O dublê passou a
**produzir 412** de verdade — um dublê que só conhece o caminho feliz não prova
que a UI trata o conflito, prova que o conflito nunca acontece. E a máquina de
estados ganhou fase `conflito` própria, que exibe o estado corrente e **não
oferece "tentar novamente"**: repetir às cegas reintroduziria a escrita que o
conflito interrompeu.

### LAC-D2 — A UI descartava a explicabilidade que o backend produz

O contrato entrega quatro campos que `mapearAvaliacao` não lia — e que o tipo de
UI nem declarava:

| Campo | Comentário normativo no contrato |
|---|---|
| `motivos` | "Razões legíveis por máquina (vocabulário da spec §5.2/ADR-0008 N3)" |
| `anotacoes` | "**Anotações obrigatórias visíveis** (N-2/N-3/N-4/N-6), em pt-BR" |
| `explicacao` | "Explicação agregada em pt-BR (spec §7) — **sempre presente**" |
| `parametroVermelho` | "Parâmetro vermelho (pontuação 3 isolada) entre insumos válidos (INV-B)" |

E, no lugar das razões codificadas, o estado fail-closed exibia um parágrafo
**redigido pelo frontend**. Ou seja: no estado clinicamente mais crítico que o
produto tem, a camada de apresentação não apenas omitia o racional do backend —
escrevia um substituto genérico. ADR-0021 F3 proíbe exatamente isso, e F8 é
explícita em que o módulo de linguagem decide *como* apresentar o racional,
nunca *se* ele aparece.

O descarte de `parametroVermelho` tem consequência própria: por INV-B/IA-N4, um
parâmetro isolado no extremo escala **mesmo com o total `nao_avaliada`**, e a
arquitetura de informação exige que "a UI exiba as duas informações sem que uma
esconda a outra". Descartado, o sinal ficava invisível justamente quando não há
escore para carregá-lo.

**Correção.** Os quatro campos passaram a ser mapeados, declarados e
renderizados. As anotações e razões do backend são agora a substância do bloco
fail-closed; o texto do frontend virou moldura. `parametroVermelho` ganhou sinal
próprio, coexistente com o estado fail-closed.

### LAC-D3 — O cliente fabricava severidade

`severidade: mapearBanda(entrada.banda) ?? "alto"`, em dois pontos. O contrato
garante `banda: null` sempre que o status não é `valido`; o `??` convertia "o
backend não atribuiu banda" em "severidade alta".

A direção é conservadora, e é por isso que passa despercebida. A regra, porém, é
categórica — ADR-0011 P7: "nenhuma projeção, gateway ou **cliente** promove
status […] **A projeção entrega o status pronto — o cliente não o deriva.**" E o
efeito na tela é o inverso do pretendido: no painel de alertas, um item sem
avaliação computável ficava **indistinguível** de um item genuinamente grave.
QAS-0017 manda contar como zero os "UI states where safety state is absent"; a
contagem era maior que zero.

**Correção.** `Alerta.severidade` passou a `BandaRisco | null`. Ausência de
banda é declarada como ausência, em tom `inconclusivo` — nunca um nível da
escala.

### LAC-D4 — O detalhe perdia o conteúdo, e o rótulo afirmava exibi-lo

`EstadoTela` só renderiza filhos em `pronto`/`parcial`. `GradeLeitos` compensava
com um bloco de dado desatualizado **fora** do wrapper. `DetalhePaciente` não
tinha esse bloco. Numa recarga que falhava, o `RotuloFrescorVisao` anunciava
"conteúdo anterior a essa falha" e abaixo não havia conteúdo nenhum: a tela
afirmava o que não mostrava.

**O caminho que expõe este defeito expôs um risco inverso e maior.** O hook
preserva o dado anterior numa recarga que falha (invariante I2 — "a tela calma
sem dado é proibida"), e o refetch do detalhe é disparado por troca de
`leitoId`. Corrigir ingenuamente — passar a renderizar o conteúdo preservado —
faria a tela exibir **o paciente anterior sob o cabeçalho do leito novo**, que é
atribuição errada, o dano-raiz de HAZ-0001/HAZ-0002. A navegação atual não
alcança esse caminho (grade↔detalhe desmonta o componente), mas nada o impede
assim que houver navegação direta entre leitos.

**Correção.** O conteúdo desatualizado passou a ser exibido com o mesmo
tratamento de `GradeLeitos`, **sob guarda de identidade**: só sobrevive à falha
o item que pertence a este leito. Há teste para as duas metades — a preservação
dentro da identidade e a recusa de atravessá-la.

### LAC-D5 — O motivo do bloqueio era inalcançável

O botão de reconhecer, bloqueado por falta de conexão, somava dois problemas:
usava `disabled` (que o retira da ordem de foco) e um `aria-describedby`
apontando para um `id` **inexistente no DOM**. Quem navega por teclado ou leitor
de tela não encontrava o botão nem descobria por que o comando havia sumido —
contra SAF-0034 e HAZ-0037, e contra o modelo de estados §6 ("comandos
bloqueados […] **com aviso explícito**").

**Correção.** `aria-disabled` no lugar de `disabled`, preservando a
focabilidade, e o elemento de motivo passou a existir. O cenário E2E de offline
foi reescrito para provar as três coisas: o botão anuncia-se indisponível,
continua focável, e o alvo do `aria-describedby` existe e explica.

### LAC-D6 — Versão de regra literal no cliente

`versaoRegra: "RULE-NEWS2@0.2.0"` estava escrito à mão no mapeador da grade.
ADR-0021 F8 exige versão de regra como rastreabilidade da explicação; uma
constante no cliente acerta por coincidência e passa a mentir em silêncio na
primeira troca de bundle.

**Correção.** A projeção da grade **não publica** o campo, então a superfície
deixou de afirmar versão: `versaoRegra` passou a `string | null` e o rótulo só
aparece quando o valor veio do backend. A ausência do campo na projeção fica
registrada como lacuna de contrato (LAC-L3), não maquiada na UI.

### LAC-D7 — A linha de alerta não carregava o paciente

O painel identificava o item apenas pelo leito. `Alerta.pacienteRef` existia no
tipo e era populado — nunca exibido. IA-N10, derivada de HAZ-0001/HAZ-0002,
exige que "a referência de paciente é parte **irremovível** da linha do alerta".
O leito é precisamente o que muda numa transferência.

**Correção.** A referência pseudonimizada passou a compor a linha, com a
minimização de QAS-0028 (apenas o sufixo, nunca a referência inteira, nunca
nome).

### LAC-D8 — Divulgação temporária e obrigação permanente no mesmo elemento

`BannerContexto` era uma string estática única que fundia:

- **"dados 100% sintéticos; não é produção"** — temporária, sai quando a fatia
  deixar as fixtures;
- **"Registro limitado a esta instituição"** — permanente e vinculante:
  ADR-0004 §6.2, derivada da ata AQ-1, registra que *"a UI da V2 DEVE exibir a
  limitação ao clínico […] Esta é uma obrigação de segurança clínica, não uma
  preferência de UX"*, mitigando HAZ-0046 (S4/L4, Unacceptable; população
  exposta medida em 4.220 pacientes).

Quem removesse a primeira levaria a segunda junto — uma obrigação permanente
saindo de carona com uma divulgação transitória. Além disso, **RLI-5 não era
atendido**: sem identificador estável, a telemetria não conseguia provar a
exibição sem depender da redação, e o teste V1 da ADR-0021 ("alterar o texto não
altera o evento") não era aplicável.

**Correção.** Dois elementos irmãos e independentes, cada um com identificador
estável (`data-divulgacao`), com teste que prova a exibição **pelo
identificador** e prova que um não contém o outro. Os textos seguem provisórios
até o processo ADR-0029 (condição C2 ABERTA).

## 2. Lacunas de escopo — registradas, não corrigidas

### LAC-L1 — Atualização automática: CORRIGIDA (SSE fiado, polling resiliente) — três defeitos achados e corrigidos na fiação

**Permanece registrada em §2, por continuidade de numeração e de citação
cruzada** — mesmo regime já usado em LAC-L4/LAC-L5 (uma entrada desta seção
pode registrar "correção" sem mudar de seção nem de identificador).

**Estado que motivou o registro original (histórico — não é mais o estado
atual):** não havia SSE, não havia polling, não havia refetch. Verificado, à
época, por ausência total de `EventSource`, `WebSocket`, `setInterval` e
biblioteca de dados em `apps/web/src`; o único `setTimeout` era o tempo-limite
de 15 s da requisição. A grade só mudava se alguém clicasse em "Atualizar", o
rótulo de frescor envelhecia com a tela sem nunca declarar isso, e a
"Recomendação de sequência" registrada aqui pedia, no mínimo, um relógio de
idade da visão antes de qualquer SSE. Isto era `HAZ-0025` (S5/L4) — *"clinicians
trust a frozen board"* — e contrariava `SAF-0025`: *"The interface MUST never
appear healthy when feeds, workers, rules, identity, or freshness are
impaired."*

**Correção (2026-08-18).**

- **Polling autoritativo ganhou cadência resiliente.** À releitura periódica
  que já fechava a "Recomendação de sequência" somaram-se **jitter** (±20% —
  `FRACAO_DE_JITTER=0.2`, para que N abas do mesmo plantão não relancem no
  mesmo instante) e **espaçamento progressivo após falhas consecutivas**
  (`FALHAS_ATE_ESPACAR=2`, `FATOR_DE_ESPACAMENTO=2`, `ESPACAMENTO_MAXIMO=8` —
  `estado/cadenciaDeRecarga.ts`), mais releitura imediata no retorno da aba a
  primeiro plano (`estado/visibilidade.ts`, Page Visibility). **Nenhum destes
  números é limiar clínico** — são premissas reversíveis de ENGENHARIA
  (GDEC-0015/0017), no mesmo regime de `INTERVALO_RECARGA_PADRAO_MS`;
  `VAL-0023` (janela/alvo de frescor como conteúdo de rule release) segue
  `VALIDATION REQUIRED`, e nenhum agente os decidiu.
- **O backoff aparece na tela**, e não em silêncio: `RotuloCadenciaRecarga`
  (`components/AvisosDeEstado.tsx`) declara a cadência espaçada por falha e a
  aba oculta — espaçar sem declarar seria a mesma classe de falha que
  `HAZ-0025`/`SAF-0025` que este item existe para fechar.
- **Transporte SSE real existe e está fiado na árvore** (`apps/web/src/eventos/**`,
  uma única conexão por aba, montada em `App.tsx` — a casca documenta por que
  precisa ser ali: "duas telas montando `useFluxoDeEventos` abririam dois
  fluxos e queimariam dois tickets"). Antes desta sessão o módulo existia com
  testes verdes e **zero consumidores** — código morto verde; agora tem
  consumidor real.
- **`reproduzindo` e `reconciliado` passaram a ter transporte real que os
  origina.** A nota de honestidade em `estado/conectividade.ts` e
  `components/GaleriaEstados.tsx`, que dizia o oposto ("esta fatia NÃO tem
  canal de eventos em tempo real"), já foi corrigida no próprio código; este
  parágrafo é o documento acompanhando essa correção, não anunciando uma nova.
  O que continua valendo, sem mudança: o push **nunca** traz dado clínico —
  ele diz QUE releia, quem lê é a projeção autoritativa (P7/P8); e replay
  finito não é chamado de "tempo real" (anti-padrão 11).
- `apps/web` está em **423 testes** (era 373) e **38** E2E — contagem por
  arquivo (número de declarações `it(`/`test(` de nível superior), não uma
  execução da suíte por este agente (ver NÃO TESTADO no handoff desta sessão).

**Três defeitos que a fiação revelou — nenhum previsto no registro original,
todos reproduzidos E corrigidos na mesma rodada:**

1. **`POST /v1/eventos/ticket` saía anônimo do lado do cliente.** A sessão
   desta fatia é um *bearer* em memória, não um cookie, e o emissor de ticket
   confiava só em `credentials: "include"`. **O servidor não é complacente —
   dito com todas as letras para que ninguém leia isto como falha de
   autorização do backend:** ele **exige** sessão
   (`apps/api/src/eventos/stream.ts`, `verificarSessao` → 401 sem ela). O
   defeito era inteiramente do cliente, que não anexava `Authorization` ao
   pedido do ticket; sem correção, o push pararia sempre com
   `ticket-recusado` — explicando o motivo, mas nunca funcionando. Corrigido
   em `eventos/adaptadorNavegador.ts`: a credencial da sessão agora atravessa
   o handshake.
2. **`EventSource` ausente derrubava a aplicação inteira — o achado mais
   grave dos três.** A construção de `EventSource` lançava de dentro do
   efeito de abertura; a exceção subia pela árvore React e derrubava com ela
   o **polling**, que é o caminho de verdade de `ADR-0011` P8 e **não
   depende de push nenhum**. Uma otimização de push matando a recuperação
   sobre a qual ela se apoia é exatamente a inversão que P8 proíbe. Corrigido
   com `try/catch` ao redor da construção do transporte: a falha é reportada
   como falha de TRANSPORTE, e a máquina reage como reagiria a qualquer
   queda — reconecta se há política anunciada, ou para declarando o motivo —
   nunca em silêncio.
3. **O sinal de push era tratado como nova tentativa do usuário.** Isso levava
   a tela a `retentando`, estado em que `EstadoTela` não renderiza filhos:
   **a grade inteira desmontava a cada evento do servidor.** Um teste de
   navegador chegou a não conseguir clicar em "Tentar novamente" porque o
   botão era destacado do DOM entre a tentativa e o clique. Corrigido
   distinguindo releitura de ROTINA (push, retorno da aba) de recarga
   EXPLÍCITA do usuário (`estado/recursoRemoto.ts::reconciliar`, invariante
   I6: nada visível muda ao INICIAR uma releitura de rotina — só o resultado
   dela muda a tela).

Nenhum dos três foi antecipado no registro original desta lacuna: os três só
apareceram quando o transporte foi de fato ligado na árvore de UI — o
argumento, já conhecido de LAC-D1/D4, a favor de fiar cedo sob teste
adversarial em vez de deixar para depois.

**Verificação de obsolescência (2026-08-18, fim da sessão) — este documento
foi conferido contra as duas passagens corrigidas em `apps/web/README.md`.**
Um agente corrigiu naquele README duas afirmações que haviam ficado
obsoletas: que `reproduzindo`/`reconciliado` "não são produzidos por
transporte real" e que "esta fatia não tem SSE". **Resultado da conferência
neste arquivo: as mesmas afirmações NÃO estão presentes aqui como estado
corrente.** Elas aparecem em dois lugares, ambos já datados e rotulados:

- no parágrafo *"Estado que motivou o registro original (histórico — não é
  mais o estado atual)"* acima — é registro histórico explicitamente marcado
  como tal, e **deve permanecer**: apagá-lo seria reescrita silenciosa do
  que se sabia à época;
- no quarto marcador de "Correção (2026-08-18)" acima, que já **descreve a
  correção daquela nota de honestidade** em vez de repetir a afirmação.

Nenhuma edição de conteúdo foi necessária em LAC-L1 por conta disso; esta
nota registra que a conferência foi feita, e quando, para que a pergunta não
precise ser refeita do zero. **Fora da fronteira deste agente, e portanto
apenas relatado:** `apps/web/README.md` ainda contém, em "Outras pendências
registradas", um marcador que começa com "Sem SSE/push (ADR-0011 P4
pendente)" — texto que contradiz o parágrafo corrigido do mesmo arquivo. É
arquivo fora de `docs/**`; fica no handoff para quem tem a fronteira.

**Quarto defeito que a fiação revelou — TEMPESTADE DE REQUISIÇÃO, registrado
agora porque não estava nesta lista.** A máquina de push já suprimia, de
propósito, a releitura por evento durante o catch-up (`replaying`): ela sai
**uma única vez**, quando o servidor declara `online` (anti-tempestade,
`ADR-0011` P5). **A fiação desfazia isso.** A tela recebia
`eventos.sinalDeReleitura + pedidosDeReconciliacao`, e o primeiro contador
avança a **cada** evento de dados — inclusive durante o catch-up. Resultado
medido: **6 requisições para um catch-up de 5 eventos; 1 depois da
correção** (5 durante o replay, mais a legítima da transição para `online`).

Os dois contadores se sobrepõem e não medem a mesma coisa: um mede **sinais
recebidos do fio**, o outro mede **pedidos que a máquina de fato decidiu
fazer**. Somá-los reintroduzia, na camada de fiação, exatamente a rajada que
a camada de máquina existe para evitar — e em silêncio, porque nenhuma das
duas camadas estava errada isoladamente. Corrigido: desce só o contador de
**pedidos**; `sinalDeReleitura` permanece como observabilidade
(`apps/web/src/App.tsx:189-197`). Fixado por teste no nível da árvore fiada
(`apps/web/src/eventos/fiacaoNaArvore.test.tsx:279-313`, *"o catch-up
inteiro produz UMA releitura NA TELA, não uma por evento"*), com asserção nos
dois lados: nenhuma releitura durante a rajada, e **exatamente uma** — não
"pelo menos uma" — depois de `online`.

Isto é da mesma família dos três acima e reforça a mesma conclusão: **o
defeito não estava em nenhuma das duas camadas, mas na costura entre elas**,
e só um teste que monta a árvore inteira o alcança. Ver `ACH-O3-14` (§5.6),
que é o achado sobre a defesa que deveria tê-lo pego.

### LAC-L2 — A UI não consegue dizer que a regra está em modo sombra

`RegistroDeAvaliacao` (com `modo`, `acionavel`, `rotuloPt`, proveniência de
bundle, `motivoRecusa`) é gravado no outbox e **deliberadamente omitido** do
mapa `OUTBOX_TO_CONTRACT_EVENT` e de toda resposta HTTP. O frontend não tem,
pela API, forma alguma de saber que a avaliação é consultiva-em-sombra e não
acionável. O único sinal indireto é `/v1/readyz` em 503 — que o web não consome.

Isto viola **QAS-0023** de forma mensurável: *"count of degradations with no
user-visible representation (**must be zero**)"*. Hoje a contagem é ≥ 1, e é a
degradação mais estrutural do sistema. Também toca o §11 ("no unfinished
capability presented as operational").

**A correção não cabe em `apps/web`** — exige o backend publicar o modo de
despacho. Registrado aqui como lacuna de contrato.

### LAC-L3 — Os tipos REST são escritos à mão, sem gate de deriva

`packages/contratos/src/index.ts` (376 linhas) espelha `openapi.yaml` (1.380
linhas) manualmente; não há geração. E `scripts/check_contratos.mjs` confronta
os três lados **apenas dos enums de evento** — os enums REST (`StatusAvaliacao`,
`BandaRisco`, `Frescor`, `EstadoItemTrabalho`) não são verificados contra nada.

ADR-0021 exige contrato de UI "gerado a partir de, ou **validado contra**, o
contrato de API". Nenhuma das duas condições vale para a superfície REST. Duas
divergências já registradas em `tabela-contrato-ui-backend.md` §5 seguem
abertas, agora com consequência verificada:

- **`BandaRisco`**: contrato `normal/atencao/alerta/critico` × web
  `baixo/medio/alto/critico`, reconciliados por `mapearBanda` — a "tradução
  manual por tela" que aquele documento proíbe. E a tradução **desloca o
  vocabulário**: o `alerta` do contrato (RCP *medium*) vira `alto` na tela.
- **`Frescor`**: contrato com 3 valores; o §11 exige 9. A UI declara os 9 e
  recebe 3.
- **`EntradaGradeLeitos`** não publica versão de regra nem racional — a causa da
  correção de LAC-D6. Pela mesma ausência, a **descrição** do alerta na grade
  continua sendo uma frase escrita no cliente (`ResumoItemTrabalho` só traz
  `id`, `estado` e `versao`, sem `motivo`). Foi mantida por ser divulgação
  consultiva e não afirmação clínica — mas é da mesma família de LAC-D2 e
  **deve sair assim que a projeção publicar o motivo**. Registrado aqui para
  não sobreviver por esquecimento; o caminho do detalhe do paciente, que tem o
  campo, já usa o motivo do backend.

> **Correção (2026-08-19, especialista de consistência documental e
> rastreabilidade).** Duas metades deste item mudaram de estado desde que foi
> escrito; uma não mudou.
>
> **A tradução de `BandaRisco` fechou.** `apps/web/src/domain/estados.ts` não
> declara mais a escala própria `baixo/medio/alto/critico`; `BandaRisco` é
> hoje **alias direto** de `@intensicare/contratos`, e `mapearBanda` — o
> tradutor que convertia `alerta` (tier *medium* do NEWS2, RCP 2017 Chart 2)
> em `alto` — foi **apagado** (ausência coberta por teste dedicado em
> `apps/web/src/api/clienteHttp.test.ts` e
> `apps/web/src/domain/vocabularioDeBanda.test.ts`). A mesma correção foi
> registrada, na mesma data, em `tabela-contrato-ui-backend.md` §5 item 3 e em
> `modelo-de-estados-obrigatorios.md` §7 item 2.
>
> **A frase de abertura deste item também ficou desatualizada.** "Os enums
> REST (...) não são verificados contra nada" não é mais verdade:
> `scripts/check_contratos.mjs` ganhou, na mesma linha de trabalho, a Parte F1
> (`StatusAvaliacao`, `BandaRisco`, `Frescor`, `EstadoItemTrabalho`
> confrontados byte a byte contra `openapi.yaml`) e a Parte G3 (a FORMA de
> sete pares interface×schema REST, incluindo `EntradaGradeLeitos` e
> `ResumoItemTrabalho`) — o próprio script cita este achado como a razão da
> mudança ("achado LAC-L3 / tabela-contrato-ui-backend.md §5"). Medido por
> este agente executando diretamente `node scripts/check_contratos.mjs` e
> `node scripts/check_contratos.mjs autoteste`: **258 verificações** (era
> 209) e **99 casos** de autoteste (eram 35).
>
> **O que NÃO fechou — `LAC-L3` continua ABERTA.** `ADR-0021` exige "gerado a
> partir de, OU validado contra"; só a segunda metade avançou.
> `packages/contratos/src/index.ts` continua escrito à mão, sem geração
> alguma a partir de `openapi.yaml`. `Frescor` continua com **3** valores no
> contrato (`packages/contratos/src/index.ts:414`) contra **9** exigidos pelo
> §11 — confirmado nesta correção, inalterado. O terceiro marcador acima
> (ausência de `versaoRegra`/`motivo` em `EntradaGradeLeitos`/
> `ResumoItemTrabalho`) segue **inalterado**, também confirmado por leitura
> direta do arquivo na mesma data. Nenhuma ADR foi promovida a
> `implemented`/`verified` por esta nota.

### LAC-L4 — Roteamento: CORRIGIDO nesta rodada, exceto 2.2.1 (Timing Adjustable)

**Permanece registrada em §2, por continuidade de numeração e de citação
cruzada** — não porque ainda seja, em substância, uma lacuna não corrigida.
Mesmo regime já usado em LAC-L5 (uma entrada desta seção pode registrar "ação
tomada"/"correção" sem mudar de seção nem de identificador).

**Estado que motivou o registro original (histórico — não é mais o estado
atual):** a navegação era um `useState<string|null>` em `App.tsx`. Não havia
rota, URL por leito, deep link, histórico do navegador (o "voltar" saía da
aplicação), preservação de contexto no recarregamento, `document.title`
dinâmico, gestão de foco na transição entre telas, nem skip-link. Três disso
eram falhas WCAG diretas — 2.4.1 (Bypass Blocks), 2.4.2 (Page Titled) e,
quando a sessão real chegar (ADR-0015), 2.2.1 (Timing Adjustable).

**Correção (2026-08-18).** Passaram a existir: URL por leito
(`/leitos/:leitoId`, `roteamento/rotas.ts`), deep link, recarregamento que
preserva contexto (a rota é derivada da URL a cada montagem, não de estado de
aplicação), histórico do navegador de fato — o "voltar" volta para a grade e
**não sai mais da aplicação** —, `document.title` dinâmico e distinto por tela
(WCAG 2.4.2, `roteamento/tituloDocumento.ts`), gestão de foco na transição
entre telas (`roteamento/foco.ts`: move o foco ao `<main>` a cada navegação,
nunca na primeira pintura nem num re-render por recarga automática), skip-link
como primeiro nó focável do documento, visível ao receber foco (WCAG 2.4.1,
`components/LinkPular.tsx`), e rota desconhecida como **estado explícito** que
preserva a URL na barra de endereço em vez de redirecionar em silêncio
(`components/TelaEnderecoNaoReconhecido.tsx`). Implementado com **History API
nativa, sem nenhuma dependência de runtime nova** — instalar biblioteca de
rotas seria decisão de cadeia de suprimentos (ADR-0022), não desta camada, e
duas telas não a exigem.

Permanece aberto **apenas 2.2.1** (Timing Adjustable): depende de sessão real
com expiração por tempo ajustável, e o provedor de sessão desta fatia é
sintético e não expira — `ADR-0015` segue `not-started`, ato do titular. Nada
nesta correção pode encerrá-lo.

> **Correção (2026-08-19, especialista de consistência documental e
> rastreabilidade).** `ADR-0015` não está mais `not-started`: a direção
> (Opção A, verificador OIDC próprio) foi aceita pelo titular em `GDEC-0016`
> (2026-08-16), e a minuta foi materializada no mesmo dia (`GDEC-0015`;
> `adr-index.md:106`). O que segue verdadeiro e não muda com esta correção:
> nenhuma sessão real existe nesta fatia — o emissor sintético (`dev-issuer`)
> não expira por tempo (`ADR-0015` §4.1) —, então não há temporização a
> ajustar, e 2.2.1 permanece corretamente FORA da matriz. O ato pendente do
> titular não é aceitar o ADR (já aceito); é a contratação de um IdP real
> (gatilho T2, `ADR-0015` §7). Critérios de aceite para quando isso ocorrer
> estão pré-estagiados, como `PROPOSAL`, em
> `criterios-de-aceite-wcag-2-2-1-timing-adjustable.md`.

**Achado que a implementação produziu, registrado com todas as letras.** A
navegação direta entre leitos — que passou a existir com esta correção —
**teria introduzido atribuição errada de paciente** (`HAZ-0001`/`HAZ-0002`) se
não tivesse sido corrigida na mesma rodada. `DetalhePaciente` preserva o dado
anterior numa recarga que falha (invariante I2), e uma troca de leito por URL
não desmonta o componente — é a MESMA instância React, ao contrário da
navegação grade↔detalhe anterior. A guarda de identidade já existente
suprimia corretamente o *conteúdo* do leito anterior, mas os **rótulos**
(`RotuloFrescorVisao`, `RotuloIdadeVisao` — frescor, idade da visão,
conectividade) continuavam sob o cabeçalho do leito novo, afirmando recência
com o carimbo de tempo do leito anterior: um rótulo dizendo "conteúdo anterior
a essa falha" sobre uma tela sem conteúdo nenhum, ou "última leitura
bem-sucedida há N s" atribuída ao leito errado. Foi **reproduzido em vermelho
antes da correção** e fixado por teste dedicado
(`components/atribuicaoEntreLeitos.test.tsx`, dois casos: a supressão
cross-leito dos rótulos E a preservação intacta dentro do mesmo leito, I2). É
exatamente o risco que o próprio LAC-D4 antecipava — *"a navegação atual não
alcança esse caminho (grade↔detalhe desmonta o componente), mas nada o impede
assim que houver navegação direta entre leitos"* — vale dizer que a
antecipação se confirmou.

### LAC-L5 — A matriz WCAG cobre 16 de 55 critérios A+AA, mais 1 AAA como alvo

`apps/web/src/a11y/matrizAcessibilidade.ts` enumera **17** critérios (14 mais
2.4.1/2.4.2, ver "Correção" abaixo — antes eram 15); a WCAG 2.2 nível A+AA tem
55 (a REC de 05-out-2023 removeu 4.1.1 Parsing e acrescentou 9 critérios — 2
nível A, 4 nível AA, 3 nível AAA). Dos 17 enumerados na matriz, **16** são
A+AA e 1 (2.3.3, alvo AAA já decidido em
`docs/10-ux-and-accessibility/arquitetura-de-informacao.md` §2.2) é AAA — por
isso ficam **39** critérios A+AA fora do recorte (55 − 16), não 38. A matriz é
honesta no que declara, e `declaracaoDeAcessibilidade()` retorna "NÃO
VALIDADA" sob proteção de teste — mas o subconjunto não estava declarado como
subconjunto quando este item foi registrado, e ao menos dois dos ausentes
falhavam naquele momento (LAC-L4).

**Correção (2026-08-18) — dois dos ausentes deixaram de faltar, porque o
comportamento passou a existir primeiro.** LAC-L4 fechou o roteamento (URL por
leito, skip-link, título dinâmico) e, com ele, o comportamento que 2.4.1
(Bypass Blocks) e 2.4.2 (Page Titled) exigem — `criteriosAeAANaoEnumerados()`
caiu de 41 para 39, e é por isso que a conta acima não é mais "14 de 55" nem
"41 fora do recorte". Os dois critérios **entraram na matriz como
`execucao: "executado"`, já com pendência de validação manual declarada**
(`cobertura` inclui `manual_obrigatorio` nos dois): a automação prova que o
atalho é o primeiro ponto de tabulação do documento e ativa por Enter, e que o
`document.title` muda por tela, é distinto e carrega a divulgação de contexto
— mas **não** prova que o bloco pulado é o que de fato atrapalha, nem que o
título descreve tópico e propósito de forma útil; isso é juízo de quem usa.
Consequência direta: a lista de critérios que exigem validação humana
(`criteriosQueExigemValidacaoManual()`) passou de **cinco para sete** — eram
2.1.1, 2.4.3, 2.4.7, 2.4.11 e 4.1.3; agora inclui também 2.4.1 e 2.4.2.
**2.2.1 (Timing Adjustable) continua sozinho, ausente da matriz**: depende de
sessão real, que esta fatia não tem (`ADR-0015`, `not-started`) — marcá-lo
executado seria alegar cobertura sobre um componente inexistente. Há teste
dedicado que barra especificamente essa regressão em qualquer direção
(`a11y/acessibilidade.test.tsx`: um caso prova que 2.2.1 segue ausente da
matriz, outro prova que 2.4.1/2.4.2 só podem estar `executado` com a
pendência manual presa ao rótulo).

> **Correção (2026-08-19, especialista de consistência documental e
> rastreabilidade).** "`ADR-0015`, `not-started`" acima está desatualizado —
> ver a correção equivalente registrada em LAC-L4 (§ imediatamente anterior)
> para a fonte e o alcance exato da correção. A ausência de 2.2.1 da matriz
> continua correta e o teste dedicado continua exigindo essa ausência; o que
> mudou é apenas o rótulo de bookkeeping do ADR, não a substância clínica ou
> técnica da lacuna.

**Ação tomada em rodada anterior (preservada; o alcance do teste descrito
mudou como consequência da correção acima).** O recorte passou a ser
explícito no módulo e na declaração, com enumeração literal dos 55 critérios
A+AA em `CRITERIOS_WCAG_22_A_E_AA` — da qual `TOTAL_CRITERIOS_WCAG_22_AA` é
**derivado**, nunca digitado. O teste que então afirmava a AUSÊNCIA conjunta
de 2.4.1/2.4.2/2.2.1 na matriz passou, com o fechamento de dois deles, a se
dividir: um caso continua provando que **2.2.1** segue ausente (estopim de
regressão, caso ele um dia entre como "executado" sem sessão real para
justificá-lo), e um caso novo prova que **2.4.1/2.4.2** só podem estar
presentes com a pendência manual amarrada ao rótulo. A cobertura em si, além
desses dois critérios, **não** foi ampliada nesta rodada.

Correção de rodada anterior: o total de 56 e a razão 15/56 citados numa versão
anterior deste documento estavam errados (56 contava 4.1.1 Parsing, removido
na WCAG 2.2) e o teste que dizia "verificar a razão" não verificava o valor do
total — mutar `TOTAL_CRITERIOS_WCAG_22_AA` para 999 ainda passava. Achado por
revisão adversarial independente sobre o PR #8; fechado com a derivação acima.

Permanece registrada a limitação já conhecida do campo `execucao`, que
conflaciona "a automação rodou" com "a validação manual ocorreu" — e agora se
aplica a sete critérios em vez de cinco.

### LAC-L6 — Superfícies de workflow: 1 de 7 comandos tem endpoint

A máquina de `WorkItem` define 7 comandos (`assign`, `acknowledge`, `escalate`,
`override`, `resolve`, `suppress`, `reopen`). **Só `acknowledge` tem rota.** Não
há listagem nem detalhe de alerta, não há timers de escalada (ADR-0009 W5), não
há agrupamento (IA-N7..N11), não há dimensão de entrega (IA-N11), não há fila da
unidade nem suporte a passagem de plantão.

Quatro estados de item (`sobreposto`, `suprimido`, `resolvido`, `reaberto`) e
cinco de frescor existem na UI **apenas na galeria**: a cobertura de estados da
ADR-0021 F4 é, para eles, vácua — renderizável, nunca alcançável.

A lacuna é primariamente de backend. Vale dizê-lo com todas as letras: **nenhuma
tela de escalonamento é construível hoje sem inventar o comando** — e inventar
seria o oposto do que ADR-0021 F1/F3 permitem.

### LAC-L7 — Sem design system, sem tokens, i18n pela metade

`estilo.css` global de 412 linhas, cores em hex literal repetido, `:root` sem
custom properties, seis blocos de `prefers-color-scheme: dark` sem inversão
sistemática — e vários seletores, incluindo os `.badge-tom--*` que sustentam o
requisito não-só-cor, **sem variante escura**. Contraste declarado como
"conferido à mão". `prefers-reduced-motion` sem `!important`, vulnerável a
especificidade futura.

`linguagem.ts` centraliza as strings de estado com switch exaustivo — meia
camada de i18n, sem chave, sem locale, sem fallback. O restante do texto é
literal em JSX, e também na camada de API e no módulo de estado. Nenhum `Intl.*`:
todos os instantes aparecem como ISO 8601 cru numa interface clínica.

### LAC-L8 — Uma segunda implementação de NEWS2 vive no frontend

`apps/web/src/domain/news2.ts` reimplementa a tabela de pontos e
`calcularBandaRisco`. Está honestamente rotulada como ilustrativa e alimenta
apenas o dublê — mas é uma segunda fonte de semântica clínica dentro de
`apps/web`, exatamente o que ADR-0021 F3 proíbe, à espera de um import
descuidado. **Deve morrer junto com o cliente mock**, e não sobreviver a ele.

### LAC-L9 — O que continua sendo ato humano

VAL-0027 (o clínico interpreta `não avaliado` como "olhe isto"), VAL-0029 (o que
ele precisa para **discordar** com confiança), VAL-0031 (compreensão dos termos
pt-BR), VAL-0033 (usuário de tecnologia assistiva completa toda tarefa do laço
de segurança — piso de 3 participantes reais, jamais simulado). Todos
`UNASSIGNED`.

As condições **C2** (vocabulário pt-BR via ADR-0029) e **C3** (teste provando
que o módulo de linguagem não decide *quando* um estado se aplica) da ADR-0021
seguem **ABERTAS** — e C3 é da alçada da engenharia, não do titular. MG-G4 é
pré-requisito duro de entrada do G8.

## 3. O que esta análise não afirma

1. Não afirma que o frontend está correto — afirma que oito defeitos nomeados
   foram corrigidos e que nove lacunas nomeadas permanecem. Nada indica que a
   taxa de achado tenha convergido; a rodada anterior de revisões adversariais
   registrou explicitamente que **não convergiu**.
   **Emenda 2026-08-18 (fim da sessão):** a frase acima fica como está, e a
   evidência a favor dela só aumentou. Aos oito defeitos de §1 somam-se agora
   **seis** de §5 (`ACH-O3-9` a `ACH-O3-14`), achados por uma quarta onda
   adversarial que **refutou** as três teses que lhe foram apresentadas, sobre
   uma branch com `pnpm verify` **exit 0** e **1.883 testes**. É o **sexto**
   ciclo consecutivo em que a taxa de achado não converge. Ler a soma "8 + 6"
   como progresso rumo a zero seria exatamente o erro que este item proíbe.
2. Não fecha HAZ-0046, HAZ-0037, HAZ-0025, HAZ-0023 nem qualquer outro hazard.
   Uma mitigação só conta quando implementada, testada **e validada com
   humanos** (ADR-0004 V10). **Emenda 2026-08-18:** isto vale integralmente
   para os fechos de §5 — `ACH-O3-9` toca o **núcleo** de `HAZ-0025` e não o
   fecha; `ACH-O3-10`/`ACH-O3-11`/`ACH-O3-12` tocam `QAS-0023`/`QAS-0017` e
   não os fecham. Reduzem exposição medida, e é só isso.
3. Não declara acessibilidade validada. A automação encontra uma fração das
   barreiras reais; LAC-D5 é prova disso — um `aria-describedby` apontando para
   o vazio atravessou toda a automação existente, incluindo axe em navegador
   real com contraste ligado.
4. Não aprova gate algum e não altera o estado de nenhum `MG-*`.
5. Não decide terminologia clínica. Todo texto novo é provisório e rotulado como
   tal até o processo ADR-0029.

## 4. Ligações

- `modelo-de-estados-obrigatorios.md` — LAC-D2/D3 tocam §2 (estados de
  avaliação); LAC-D5 toca §6 (conectividade); LAC-L1 toca §6 inteiro.
- `tabela-contrato-ui-backend.md` §5 — a divergência 5 ("o cliente não
  transporta o token de versão") era LAC-D1; as divergências 3 e 4 permanecem
  abertas em LAC-L3.
- `arquitetura-de-informacao.md` — IA-N10 (LAC-D7), IA-N4 (LAC-D2), IA-N7..N11
  (LAC-L6), §2.2 (LAC-L4/L5).
- `requisito-registro-limitado-instituicao.md` — RLI-2/RLI-5 (LAC-D8); RLI-7
  permanece dependência humana.
- `service-blueprint.md` §3 — F1/F2/F6/F10 são os pontos de falha que LAC-D3,
  LAC-D4, LAC-D1 e LAC-L1 tocam respectivamente.

## 5. Achados da quarta onda de revisão adversarial (2026-08-18) — `ACH-O3-9` a `ACH-O3-14`

**Por que estes achados moram aqui, e por que numa seção nova.** Todos os
seis são de **apresentação** — o que a tela afirma, quando cala e o que ela
prova sobre si mesma —, que é a matéria deste documento. Ficam numa seção
nova, e não dentro de §1 ou §2, por dois motivos: §1 é o registro fechado dos
**oito** defeitos `LAC-D*` da primeira rodada (mexer na tabela dele
falsificaria a contagem que ele afirma), e §2 é de **lacunas de escopo**, que
não é o que estes são. As seções §3 e §4 mantêm sua numeração intacta.

**A onda que os produziu.** Três revisores adversariais somente-leitura, com
lentes distintas, contra árvore congelada. Os três **refutaram** a tese que
lhes foi apresentada. Isso ocorreu sobre uma branch com `pnpm verify`
**exit 0** e **1.883 testes** (medição do orquestrador, máquina ociosa — este
agente não executou nenhuma suíte). Pelo sexto ciclo consecutivo, **a taxa de
achado deste repositório não convergiu**; §3 item 1 já dizia isso e continua
verdadeiro.

**Identificadores.** `ACH-O3-9` a `ACH-O3-14` são **documento-locais,
pendentes de ratificação em `docs/00-governance/traceability-policy.md`
§1.1** — mesmo regime dos rótulos `LAC-*` declarado no topo deste documento.
**Nenhum prefixo novo de taxonomia é cunhado.**

| ID | Achado | Cláusula tocada | Disposição |
|---|---|---|---|
| `ACH-O3-9` | "Sincronizado" afirmado com a releitura **ainda em voo** | HAZ-0025 (núcleo); SAF-0025; ADR-0011 P8 | **FECHADO** (estruturalmente) |
| `ACH-O3-10` | Push permanentemente morto produzia **zero pixels** | QAS-0023; ADR-0011 P6 | **FECHADO** |
| `ACH-O3-11` | Precedência **invertida**: o pior estado do fio calava, o mais brando falava | QAS-0023; ADR-0008 N3 | **FECHADO** |
| `ACH-O3-12` | "✓ Dado atual." em **todo** cartão da grade, a partir de zero evidência | ADR-0011 P7; QAS-0017 | **FECHADO na engenharia**; ordem e ausência de selo pendem de ratificação clínica (§6.1, §6.2) |
| `ACH-O3-13` | Duas cadências contraditórias afirmadas ao mesmo tempo | ADR-0008 N3 | **FECHADO** |
| `ACH-O3-14` | Os testes provavam o **dublê**, não o produto | ADR-0021 V1; §3 item 1 | **FECHADO** |

### 5.1 `ACH-O3-9` — FECHADO: "Sincronizado" com a releitura ainda em voo

A tela afirmava **"Sincronizado — dados reconciliados após reconexão."** no
instante em que o cliente **sabe** ter perdido um evento, com a releitura
**ainda em voo**. A causa era de assinatura, não de lógica: a porta de
reconciliação devolvia `void`, e `await undefined` resolve **na microtarefa
seguinte** — a máquina dava a reconciliação por concluída **antes de qualquer
requisição sair**.

Isto é o **núcleo de `HAZ-0025`** (*"clinicians trust a frozen board"*) e o
oposto exato de `SAF-0025` (*"the interface MUST never appear healthy when
feeds, workers, rules, identity, or freshness are impaired"*). Não era
questão de desempenho; era veracidade.

**Fecho estrutural, e a distinção importa.** A porta **não aceita mais
`void`**: quem não leu nada só pode devolver `null`, e devolver outra coisa é
**erro de compilação** (`apps/web/src/eventos/porta.ts:146`;
`apps/web/src/estado/reconciliacaoObservada.ts`). `reconciliado` passou a
exigir um **fato de leitura** — uma leitura bem-sucedida da projeção,
iniciada **depois** do pedido —, não um contador incrementado. Um fecho que
depende de o próximo autor lembrar da regra não é um fecho; este depende do
compilador.

### 5.2 `ACH-O3-10` — FECHADO: push permanentemente morto produzia zero pixels

Um push que abriu, recebeu o primeiro quadro do servidor e **caiu antes da
primeira pulsação** não produzia **pixel algum** na tela clínica. Duas causas
somadas: a guarda de prova de vida estava sobre o predicado errado
(`pulsacoesRecebidas === 0`), e `motivoDeParada` **não era consumido por
superfície alguma** — a razão da parada existia no estado e não chegava a
lugar nenhum.

Violação **mensurável** de `QAS-0023`: *"count of degradations with no
user-visible representation (**must be zero**)"*. A contagem medida era
**≥ 1**.

**Fecho:** a prova de vida passou a ser **fluxo aberto / primeiro quadro do
servidor**, não a primeira pulsação (`apps/web/src/eventos/maquina.ts:261-304`).
Parada explícita — `ticket-recusado`, `sem-politica-de-reconexao` — passou a
contar como degradação declarada: ela é **definitiva** (a máquina não
ressuscita por evento atrasado), e a tela deixa de ter push sem voltar a tê-lo
sem nova montagem. `desmontado` é a única parada excluída, porque ali não há
tela para declarar coisa alguma.

### 5.3 `ACH-O3-11` — FECHADO: a precedência estava invertida

Antes da primeira pulsação, `offline` e `reconnecting` do fio eram **mudos**,
enquanto `replaying` — informativo, menos grave — **exibia banner**. O mesmo
estado de fio afirmava coisas diferentes conforme já ter chegado, ou não, uma
pulsação: os dois piores estados calavam e o mais brando falava.

**Fecho:** `degraded` é declaração do **servidor** de que a entrega está
atrasada e vale **mesmo antes da primeira pulsação**; os estados informativos
(`replaying`, `reconciled`) têm representação **própria**, e não como
degradação — degradá-los apagaria os dois únicos estados que este transporte
origina, porque `degradado` tem precedência sobre a promoção. E agora isso
vale em **toda** janela, não só depois da primeira pulsação
(`maquina.ts:279-304`).

### 5.4 `ACH-O3-12` — FECHADO NA ENGENHARIA (pré-existente, não desta sessão): "✓ Dado atual." em todo cartão, a partir de nada

**Este é o achado de maior alcance dos seis, e foi subdimensionado como
"caso de borda" antes de ser medido.**

Duas falhas na mesma função (`ORDEM_SEVERIDADE_FRESCOR`,
`apps/web/src/domain/clinico.ts:143-191`):

1. a lista **omitia `ausente` e `invalido`** — os dois piores estados.
   `indexOf` devolve `-1` para o que não está na lista, e `-1 > 0` é
   **sempre falso**: os dois piores frescores **nunca elevavam a
   severidade**, exatamente ao contrário do que a função existe para fazer;
2. **lista vazia devolvia `"atual"`** — frescor afirmado a partir de zero
   contribuições.

**Por que não é borda.** A projeção da grade é um resumo e publica
`contribuicoes: []` para **TODO** leito (`mapearEntradaGrade`,
`apps/web/src/api/clienteHttp.ts`). Combinado com a falha 2, isso significa
que **"✓ Dado atual." era o rótulo de CADA cartão da UTI, sempre, desde a
primeira pintura, a partir de evidência nenhuma.** Não é um valor errado num
caso raro; é o caminho comum. É **cliente promovendo status**, contra
`ADR-0011` P7 (*"nenhuma projeção, gateway ou cliente promove status"*), e
toca `QAS-0017`.

**Fecho na engenharia — e só a direção foi decisão de engenharia.** Frescor
desconhecido por esta versão da interface passou a ser tratado como **o pior
possível**, nunca descartado em silêncio (`clinico.ts:180-188`); e lista
vazia passou a devolver **`null`** — *nada é afirmado* —, com o consumidor
renderizando nada (`apps/web/src/components/CartaoLeito.tsx:22`). Não
afirmar é o resultado correto quando não há evidência: a ausência de
afirmação é fail-closed, a afirmação otimista não.

**O que NÃO foi decidido por engenharia, e permanece pendente de ratificação
clínica:** a **ordem relativa** exibida (§6.1) e a **ausência de selo de
frescor em todo cartão da grade** (§6.2). Ver §6.

### 5.5 `ACH-O3-13` — FECHADO: duas cadências contraditórias na mesma tela

`RotuloIdadeVisao` imprimia **sempre** o intervalo **base** ("Releitura
automática a cada 30 s"), enquanto, três linhas abaixo,
`RotuloCadenciaRecarga` declarava o backoff em vigor ("ESPAÇADA — 8× o
intervalo normal, agora a cada 4 min"). Duas descrições divergentes **do
mesmo fato**, simultaneamente na tela — o padrão que `ADR-0008` N3 proíbe, e
que este mesmo código cita ao proibi-lo em outro lugar.

**Fecho: uma frase por fato.** A correção **não** foi repetir o número nos
dois lugares (seriam duas fontes a manter em acordo, e a próxima divergência
seria questão de tempo): quando a cadência sai do regime, quem a declara é
`RotuloCadenciaRecarga`, com o fator e a razão — e o outro rótulo **cala**
(`apps/web/src/components/AvisosDeEstado.tsx:86-100`).

### 5.6 `ACH-O3-14` — FECHADO: os testes provavam o dublê, não o produto

**Este é o achado sobre a defesa, e é o mais importante dos seis para quem lê
resultado de teste deste repositório.**

O dublê de teste devolvia `Promise`; a **fiação real** devolvia `void`. Os
testes exercitavam o dublê e passavam — provando uma propriedade do **dublê**,
não do produto. Consequência direta: **esta era a defesa que deveria ter
pego o `ACH-O3-9`, e ela não podia**, porque nunca tocou o objeto que tinha o
defeito.

**Fecho:** asserção no nível da **árvore fiada** — o teste monta a árvore
real e observa o que o produto faz
(`apps/web/src/eventos/fiacaoNaArvore.test.tsx`). Junto com ele, quatro
famílias de verde vácuo foram fechadas na mesma passagem:

| Padrão encontrado | Por que passava sem provar nada |
|---|---|
| `rejects.toThrow()` **sem tipo** | qualquer rejeição satisfaz, inclusive a errada — a identidade do erro passou a ser a asserção (`adaptadorNavegador.test.ts:403`) |
| meta-teste de cobertura que só **contava elementos de array** | contava o registro, não o teste; passou a confrontar os **títulos registrados** (`maquina.test.ts:910`) |
| laço **sem guarda de não-vacuidade** | laço sobre lista vazia é verde; a contagem virou asserção explícita |
| teste cujo **nome prometia mais que a asserção** | ex.: nome dizia "limitado à fração declarada" sem impor teto algum (`cadenciaDeRecarga.test.ts:51,156`) |

Um teste removido também foi **removido explicitamente e com razão escrita**
(`cadenciaDeRecarga.test.ts:186`), em vez de silenciosamente esquecido —
apagar teste sem deixar rastro é como um verde vácuo nasce.

**Ligação com o método.** Este achado é a face de tela do achado de método
registrado em `docs/14-devsecops-and-delivery/ci-policy.md` §5: uma defesa
que só foi exercitada contra a entrada que o próprio autor imaginou não é
defesa, é amostra.

### 5.7 O que a §5 NÃO afirma

1. **Nenhum hazard foi fechado.** `ACH-O3-9` toca o núcleo de `HAZ-0025` e
   `ACH-O3-10`/`ACH-O3-11`/`ACH-O3-12` tocam `QAS-0023`/`QAS-0017` — e
   **nenhum deles fecha nada disso**. Reduzem exposição medida, e é só isso
   que este documento pode escrever. `HAZ-0025`, `SAF-0025`, `QAS-0023`,
   `HAZ-0001` e `HAZ-0002` seguem abertos. Uma mitigação só conta quando
   implementada, testada **e validada com humanos** (`ADR-0004` V10).
2. **Acessibilidade continua NÃO VALIDADA.** `VAL-0033` é ato humano, com
   piso de 3 participantes reais, jamais simulado. Nada em §5 a aproxima.
3. **Nenhum gate foi aprovado, nenhum `MG-*` alterado, nenhuma ADR promovida
   a `implemented`/`verified`.**
4. **Estado factual duro inalterado:** 0 vias clínicas acionáveis; 47/47
   inelegíveis; `Observation` da AMH não consumível; safety case **M0**;
   nenhum dado real acessado.
5. **Nenhum texto clínico novo foi redigido** por estes fechos, e nenhuma
   taxonomia foi decidida. Onde havia texto a escolher, ver §6.

## 6. O que passou a ser ato humano por causa deste trabalho (2026-08-18)

Três pendências **novas ou recém-nomeadas**, todas **sem dono, sem
`DECIDED`**. Elas existem porque os fechos de §5 tornaram explícita uma
escolha que antes estava implícita num defeito — o que é progresso, mas
transfere a escolha para quem tem autoridade sobre ela. Estas somam-se a
LAC-L9 (`VAL-0027`, `VAL-0029`, `VAL-0031`, `VAL-0033`, `ADR-0021` C2/C3),
que permanece válida sem alteração.

### 6.1 Ordem de severidade de frescor exibida ao clínico — PROVISÓRIA

A ordem hoje em vigor (`ORDEM_SEVERIDADE_FRESCOR`,
`apps/web/src/domain/clinico.ts:143-153`) é:

```text
atual < corrigido < substituido < conflitante < envelhecendo
      < desatualizado < expirado < ausente < invalido
```

**O que foi decisão de engenharia, e apenas isto:** a **direção** —
fail-closed, isto é, o desconhecido é tratado como o pior e a lista vazia não
afirma nada (§5.4). Essa direção é derivável de `ADR-0011` P7 e de
`SAF-0025`, e não exige juízo clínico.

**O que NÃO foi decidido, e é o que está pendente:** a **ordem relativa**
entre os nove estados. Que `conflitante` seja pior que `substituido`, ou que
`expirado` seja pior que `desatualizado`, é afirmação sobre o que compromete
mais uma decisão à beira do leito — juízo clínico, não de engenharia
(Contrato de Agentes §3: "taxonomia de razões de status" está fora da
autoridade de qualquer agente).

> *Quem decide:* a autoridade clínica que ratifica a taxonomia de frescor —
> matéria de `ADR-0029` (vocabulário pt-BR) e do §11 do prompt, que define os
> nove estados sem ordená-los por gravidade. *Que evidência fecharia:* a
> ordem ratificada por escrito, com a justificativa clínica de cada
> comparação que não for óbvia, mais teste que trave a ordem contra
> regressão. *Efeito bloqueante hoje:* nenhum gate; mas todo rótulo de
> frescor exibido carrega uma ordenação que ninguém ratificou.
> `owner: UNASSIGNED — VALIDATION REQUIRED`.

### 6.2 Ausência de selo de frescor em TODO cartão da grade — aceitável ou não?

Consequência direta do fecho de `ACH-O3-12`: como a projeção da grade publica
`contribuicoes: []` para todo leito, e como afirmar frescor a partir de nada
deixou de ser permitido, **nenhum cartão da grade exibe selo de frescor
hoje**.

**Não afirmar é correto** — antes se afirmava "✓ Dado atual." a partir de
nada, o que era pior em todos os aspectos. Mas "correto" aqui significa
"honesto", não "suficiente": falta decidir se a **ausência** é aceitável numa
tela clínica de UTI, onde o clínico varre a grade justamente para saber onde
olhar.

**As duas saídas não são equivalentes, e a diferença é de contrato:**

| Saída | O que exige | Quem decide |
|---|---|---|
| A ausência é aceitável na grade; o frescor por insumo vive só no detalhe | nada de novo — é o estado atual, ratificado | autoridade clínica/UX |
| A grade deve exibir frescor | a **projeção** passa a publicar frescor por leito — **mudança de contrato** (`packages/contratos`, projeção da grade), não de tela | dono de `ADR-0011` (forma da projeção) + autoridade clínica |

Registrar isso como escolha aberta é deliberado: um agente que "resolvesse"
pela saída A por ela ser a mais barata estaria decidindo conteúdo de tela
clínica por conveniência de escopo.

> *Quem decide:* autoridade clínica/UX quanto à suficiência, e o dono de
> `ADR-0011` se a saída for mudar a projeção. *Que evidência fecharia:*
> decisão registrada; se for a saída B, o contrato de projeção atualizado
> mais teste provando que o cliente **não** deriva o frescor que recebe
> (`ADR-0011` P7). *Efeito bloqueante hoje:* nenhum gate; é lacuna de
> informação na tela primária. `owner: UNASSIGNED — VALIDATION REQUIRED`.

### 6.3 Texto para "entrega em tempo quase-real interrompida em definitivo"

O fecho de `ACH-O3-10` fez a parada definitiva do push virar degradação
declarada — e, com isso, ela precisa de **texto**. Hoje ela **reusa o texto
genérico de `degradado`**, que descreve uma condição transitória e é, por
isso, impreciso para uma condição que **não se resolve sozinha**: a tela não
volta a ter push sem nova montagem.

Escrever a frase certa é **redigir texto clínico normativo**, explicitamente
fora da autoridade de qualquer agente (Contrato de Agentes §3). `ADR-0029`
condição **C2** (vocabulário pt-BR) segue **ABERTA**, e é onde esta pendência
se resolve.

> *Quem decide:* o processo de `ADR-0029` (C2), com a autoridade clínica que
> ratifica vocabulário de estado. *Que evidência fecharia:* o texto
> ratificado para a condição "entrega em tempo quase-real interrompida em
> definitivo", distinto do texto de degradação transitória, mais teste
> provando que as duas condições não compartilham a mesma frase. *Efeito
> bloqueante hoje:* `ADR-0029` C2 não pode ser fechada; a tela declara a
> degradação (`QAS-0023` na direção certa) com precisão menor que a
> devida. `owner: UNASSIGNED — VALIDATION REQUIRED`.

### 6.4 Provenance de §5 e §6

| Campo | Valor |
|---|---|
| `label` | `OBSERVED` para todo achado de §5 e para a ordem transcrita em §6.1 (leitura direta dos arquivos citados linha a linha por este agente); `INFERENCE` para a leitura de impacto sobre `QAS-0023`/`QAS-0017`; `VALIDATION REQUIRED` para as três pendências de §6 |
| `source_repo` | `intensicare-V2` |
| `path_or_url` | `apps/web/src/domain/clinico.ts`; `apps/web/src/eventos/maquina.ts`, `porta.ts`, `useFluxoDeEventos.ts`, `fiacaoNaArvore.test.tsx`, `maquina.test.ts`, `adaptadorNavegador.test.ts`; `apps/web/src/estado/reconciliacaoObservada.ts`, `cadenciaDeRecarga.test.ts`; `apps/web/src/components/AvisosDeEstado.tsx`, `CartaoLeito.tsx`; `apps/web/src/App.tsx` |
| `commit_sha_or_version` | `700b13e` (base); correções desta sessão lidas no working tree da branch `codex/lacunas-frontend-a11y` |
| `section_or_lines` | `clinico.ts:143-191`; `maquina.ts:261-304`; `porta.ts:146`; `App.tsx:189-197`; `fiacaoNaArvore.test.tsx:279-313`; `AvisosDeEstado.tsx:86-100`; `CartaoLeito.tsx:22` |
| `date_collected` | 2026-08-18 |
| `collector` | agente de consistência documental e rastreabilidade (esta sessão) |
| `transformation` | achados relatados por três revisores adversariais somente-leitura e **reproduzidos por leitura do código atual** por este agente antes de serem escritos; citações entre aspas são cópia literal do código, do teste ou da cláusula normativa |
| `confidence` | high para os achados e seus fechos (leitura direta); medium para o alcance clínico de §5.4 (a renderização foi lida, o efeito sobre a decisão à beira do leito **não** foi validado com humano algum) |
| `owner` | UNASSIGNED — VALIDATION REQUIRED |
| `validation_status` | VALIDATION REQUIRED |
