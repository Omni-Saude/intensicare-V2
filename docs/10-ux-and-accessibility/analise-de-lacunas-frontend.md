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
last_updated: 2026-08-18
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

### LAC-L1 — Não há atualização automática de espécie alguma (a mais grave)

**Não há SSE, não há polling, não há refetch.** Verificado por ausência total de
`EventSource`, `WebSocket`, `setInterval` e biblioteca de dados em
`apps/web/src`; o único `setTimeout` é o tempo-limite de 15 s da requisição. A
grade só muda se alguém clicar em "Atualizar".

Duas consequências que a documentação já antecipa:

- **ADR-0011 P8** define o polling server-authoritative como "o caminho de
  verdade de recuperação de **TODA** superfície" e o push como otimização sobre
  ele. Hoje não existe nem o caminho de verdade — a falta não é de otimização,
  é de fundação.
- **O rótulo de frescor envelhece com a tela.** `frescor` é recomputado pelo
  servidor a cada leitura (ADR-0008 N5: "recomputado na leitura, nunca
  congelado"). Sem releitura, "Dado atual" permanece na tela indefinidamente.
  `FrescorVisao` tem só dois valores — `atual` e `desatualizado_apos_falha` — e
  o segundo exige uma recarga que **falhou**, o que nunca ocorre se nenhuma
  recarga é tentada.

Isto é HAZ-0025 (S5/L4) — *"clinicians trust a frozen board"* — e contraria
SAF-0025: *"The interface MUST never appear healthy when feeds, workers, rules,
identity, or freshness are impaired."*

**Recomendação de sequência.** Antes de qualquer SSE, um relógio de idade da
visão que degrade a tela quando a última leitura bem-sucedida envelhece — é o
`degradado` de ADR-0011 P6 aplicado ao tempo, e não à falha. É barato e fecha a
parte da lacuna que mais se parece com o defeito do sistema legado.

O SSE, quando vier, é caminho curto: o backend já entrega heartbeat, cursor,
replay, backpressure, `instrucao-reconciliacao` e reautorização por evento, com
`DESCRICAO_ESTADO_CONEXAO` e `DESCRICAO_MOTIVO_ENCERRAMENTO` exportados em
pt-BR. Os estados `reproduzindo`/`reconciliado` já existem, traduzidos e
renderizáveis — falta-lhes transporte que os origine.

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

### LAC-L4 — Sem roteamento: sem URL, sem voltar, sem link de plantão

Navegação é um `useState<string|null>` em `App.tsx`. Não há rota, URL por leito,
deep link, histórico do navegador (o "voltar" sai da aplicação), preservação de
contexto no recarregamento, `document.title` dinâmico, gestão de foco na
transição entre telas, nem skip-link.

Três disso são falhas WCAG diretas — 2.4.1 (Bypass Blocks), 2.4.2 (Page Titled)
e, quando a sessão real chegar (ADR-0015), 2.2.1 (Timing Adjustable).

### LAC-L5 — A matriz WCAG cobre 15 de 56 critérios A+AA

`apps/web/src/a11y/matrizAcessibilidade.ts` enumera 15 critérios; a WCAG 2.2
nível A+AA tem 56. A matriz é honesta no que declara, e `declaracaoDeAcessibilidade()`
retorna "NÃO VALIDADA" sob proteção de teste — mas o subconjunto não estava
declarado como subconjunto, e ao menos dois dos ausentes falham hoje (LAC-L4).

**Ação tomada neste ciclo:** o recorte passou a ser explícito no módulo e na
declaração, com teste que verifica a razão 15/56 e teste de não-vacuidade que
impede 2.4.1/2.4.2/2.2.1 de aparecerem como "executado" enquanto a lacuna de
navegação não fechar. A cobertura em si **não** foi ampliada.

Permanece registrada a limitação já conhecida do campo `execucao`, que
conflaciona "a automação rodou" com "a validação manual ocorreu".

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
2. Não fecha HAZ-0046, HAZ-0037, HAZ-0025, HAZ-0023 nem qualquer outro hazard.
   Uma mitigação só conta quando implementada, testada **e validada com
   humanos** (ADR-0004 V10).
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
