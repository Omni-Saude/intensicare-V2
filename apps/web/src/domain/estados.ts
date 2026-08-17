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
 * backend (ADR-0015, `not-started`).
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
 * Banda de risco clínico — sempre exibida com rótulo textual, nunca só
 * cor (ADR-0029 lista de ambiguidade proibida; prompt §11 "non-color-only
 * cues"). Quatro faixas, no espírito da "clear four-tier prioritization"
 * citada no prompt §11 como padrão útil a preservar.
 */
export type BandaRisco = "baixo" | "medio" | "alto" | "critico";

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
