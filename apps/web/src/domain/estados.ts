/**
 * apps/web/src/domain/estados.ts
 *
 * Identificadores de estado do modelo de UI exigido pelo prompt §11
 * (linhas ~920-927): carregamento, frescor, avaliação, item de trabalho
 * (alerta), conectividade e sessão. Por ADR-0021 F1 ("o identificador é
 * do backend; o texto é do frontend"), estes tipos são o que a API real
 * deverá originar. Integração SPR-G7-2: o contrato real existe
 * (`@intensicare/contratos`) e a tradução do vocabulário do contrato para
 * estes identificadores vive em `../api/clienteHttp.ts` (`mapear*`) —
 * estes tipos seguem sendo a linguagem interna das telas, não uma fonte
 * paralela do contrato. O texto em pt-BR (`./linguagem.ts`) só depende do
 * NOME do identificador, não da sua origem.
 *
 * PREMISSA (reversível, GDEC-0015/0017): os identificadores abaixo cobrem
 * as seis famílias mínimas do prompt §11; apenas o SUBCONJUNTO citado na
 * tarefa (carregando/vazio/indisponível/erro/degradado/dado
 * envelhecendo/dado velho/avaliação não computável) é organicamente
 * demonstrado nesta fatia — as demais famílias completas ficam
 * declaradas no tipo (para não inventar semântica depois) mas não têm
 * necessariamente uma tela dedicada ainda.
 */
import type { BandaRisco as BandaRiscoDoContrato } from "@intensicare/contratos";

/** Estado de carregamento de uma tela ou lista (prompt §11, 1ª família). */
export type EstadoCarregamento =
  | "carregando"
  | "vazio"
  | "indisponivel"
  | "proibido"
  | "tempo_esgotado"
  | "retentando"
  | "parcial"
  | "pronto"
  | "erro";

/** Estado de frescor de um dado de origem (prompt §11, 2ª família). */
export type EstadoFrescor =
  | "atual"
  | "envelhecendo"
  | "desatualizado"
  | "expirado"
  | "ausente"
  | "invalido"
  | "conflitante"
  | "corrigido"
  | "substituido";

/**
 * Estado de validade de uma avaliação clínica (prompt §11, 3ª família).
 * `nao_avaliada` e `invalida` são os estados fail-closed: nunca podem ser
 * confundidos com "normal" (HAZ-0005; ADR-0029 P1).
 */
export type EstadoAvaliacao = "valida" | "parcial" | "nao_avaliada" | "desatualizada" | "invalida";

/** Ciclo de vida de um item de trabalho/alerta (prompt §11, 4ª família). */
export type EstadoItemTrabalho =
  | "nao_atribuido"
  | "atribuido"
  | "reconhecido"
  | "escalado"
  | "sobreposto"
  | "resolvido"
  | "suprimido"
  | "reaberto";

/** Estado de conectividade (prompt §11, 5ª família). */
export type EstadoConectividade =
  | "online"
  | "degradado"
  | "offline"
  | "reconectando"
  | "reproduzindo"
  | "reconciliado";

/**
 * Estado de sessão (prompt §11, 6ª família). Desde ACH-07 há renderização
 * dedicada (`../components/AvisosDeEstado.tsx`), alimentada pelo provedor de
 * sessão (`../api/sessao.ts`) — a autenticação em si continua sendo do
 * backend (ADR-0015 tem direção aceita (GDEC-0016), mas nenhum IdP real foi contratado).
 */
export type EstadoSessao =
  | "ativa"
  | "expirando"
  | "expirada"
  | "recuperada"
  | "trabalho_nao_salvo_protegido";

/**
 * Frescor DA VISÃO — introduzido no ACH-07. Deliberadamente SEPARADO de
 * `EstadoFrescor`: aquele é o frescor do insumo CLÍNICO, computado no backend
 * a partir do tempo clínico de fonte (ADR-0008 N5/SAF-0004) e jamais inferido
 * pelo frontend. Este descreve apenas um fato que o frontend de fato conhece:
 * se o conteúdo em tela veio da última busca bem-sucedida, ou se uma recarga
 * posterior falhou e o que está exibido é anterior a essa falha.
 *
 * Só existem dois valores, e não há gradação — qualquer nuance além disso
 * seria juízo clínico travestido de estado de transporte.
 */
export type FrescorVisao = "atual" | "desatualizado_apos_falha";

/**
 * IDADE DA VISÃO — segundo eixo do frescor da tela, ortogonal a `FrescorVisao`
 * e introduzido para fechar LAC-L1.
 *
 * POR QUE UM TIPO NOVO, E NÃO UM TERCEIRO VALOR DE `FrescorVisao`. Aquele tipo
 * responde "a última tentativa de leitura FALHOU?"; este responde "quanto tempo
 * faz desde a última leitura BEM-SUCEDIDA?". São perguntas independentes: uma
 * tela pode estar `atual` (nenhuma falha) e mesmo assim exibir conteúdo de
 * horas atrás, porque ninguém clicou em "Atualizar" — que era exatamente o
 * estado do produto antes desta mudança, e é o modo de falha de HAZ-0025
 * ("clinicians trust a frozen board").
 *
 * FRONTEIRA CLÍNICA (o ponto mais delicado deste tipo). `ciclo_perdido` NÃO é
 * um juízo de frescor CLÍNICO: ele não diz que o dado do paciente está velho.
 * Ele diz apenas que a RECARGA AUTOMÁTICA desta tela — cuja cadência é uma
 * premissa reversível de engenharia (`INTERVALO_RECARGA_PADRAO_MS` em
 * `../estado/recursoRemoto.ts`) — deixou de produzir leitura nova. Janelas e
 * horizontes de frescor clínico são conteúdo de rule release (VAL-0023) e
 * permanecem `VALIDATION REQUIRED`; nada aqui os antecipa. O frescor do insumo
 * clínico continua sendo `EstadoFrescor`, originado no backend (ADR-0008 N5,
 * ADR-0011 P7).
 *
 *   - `sem_leitura`   — nenhuma leitura bem-sucedida ocorreu ainda;
 *   - `no_ciclo`      — a última leitura bem-sucedida é mais recente que dois
 *                       intervalos de recarga (a recarga em voo explica a idade);
 *   - `ciclo_perdido` — pelo menos um ciclo inteiro de recarga venceu sem
 *                       produzir leitura bem-sucedida.
 */
export type IdadeVisao = "sem_leitura" | "no_ciclo" | "ciclo_perdido";

/**
 * Banda de risco clínico — **o vocabulário é o do contrato, por alias
 * direto**: `normal`, `atencao`, `alerta`, `critico`
 * (`@intensicare/contratos`, `BandaRisco`). Sempre exibida com rótulo
 * textual, nunca só cor (ADR-0029 lista de ambiguidade proibida; prompt §11
 * "non-color-only cues").
 *
 * POR QUE ISTO DEIXOU DE SER UMA UNIÃO PRÓPRIA. Até HEAD 1eda4f1 a web
 * declarava `"baixo" | "medio" | "alto" | "critico"` e `../api/clienteHttp.ts`
 * traduzia o contrato para essa escala. A tradução era `alerta → alto` — e o
 * contrato ancora `alerta` ao tier *medium* do NEWS2 (RCP 2017 Chart 2;
 * `packages/contratos/src/index.ts:207-213`). O efeito não era estético: a
 * tela apresentava "Risco alto" onde a regra havia dito *medium*, ou seja, o
 * clínico lia UM NÍVEL ACIMA do que a regra disse.
 * `docs/10-ux-and-accessibility/tabela-contrato-ui-backend.md:102` já
 * registrava a divergência e proíbe "tradução manual por tela".
 *
 * O ALIAS É DELIBERADO, e não um `type` reescrito à mão com os mesmos quatro
 * nomes: reescrever permitiria a divergência silenciosa voltar na primeira
 * banda nova do contrato. Com o alias, qualquer mudança do vocabulário do
 * backend quebra o `switch` exaustivo de `./linguagem.ts` em tempo de
 * compilação — que é exatamente a ADR-0021 F1 ("o identificador é do backend;
 * o texto é do frontend") tornada executável. O import é apenas de TIPO:
 * nenhuma aresta de runtime é criada.
 *
 * CUIDADO CONHECIDO (não resolvido aqui): três destes identificadores
 * (`atencao`, `alerta`, `critico`) coincidem, como strings, com valores de
 * `Tom` abaixo. São conceitos distintos — banda é fato clínico do backend,
 * tom é decisão de apresentação — e o TypeScript não distingue duas uniões de
 * literais que se sobrepõem. `./vocabularioDeBanda.test.ts` cobre o risco de
 * conflação pelo lado que importa (o tom de cada banda é uma trava explícita).
 */
export type BandaRisco = BandaRiscoDoContrato;

/**
 * Tom semântico não-dependente de cor isolada: cada tom carrega um
 * rótulo textual curto (glifo) além da cor, para leitores de tela e para
 * usuários com daltonismo. `inconclusivo` é deliberadamente distinto de
 * `neutro` — nunca reaproveita o tom "sem problema" para um estado
 * fail-closed (ADR-0029 P1).
 */
export type Tom =
  | "neutro"
  | "positivo"
  | "informativo"
  | "atencao"
  | "alerta"
  | "critico"
  | "inconclusivo";

/** Lança erro em tempo de execução se um switch exaustivo perder um caso. */
export function casoImpossivel(valor: never, contexto: string): never {
  throw new Error(`Estado não mapeado (${contexto}): ${JSON.stringify(valor)}`);
}
