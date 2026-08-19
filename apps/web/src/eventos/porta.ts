/**
 * apps/web/src/eventos/porta.ts
 *
 * PORTAS do consumo de push no navegador — transporte e handshake injetáveis,
 * mais a ponte entre o vocabulário do FIO e o vocabulário da TELA.
 *
 * POR QUE PORTAS. `EventSource` não existe no jsdom, e um comportamento cujo
 * transporte não é injetável só se observa abrindo socket de verdade — o mesmo
 * defeito que a porta `Relogio` (`../estado/relogio.ts`) já fechou para o
 * tempo. Aqui o transporte entra por parâmetro: a máquina pura de `./maquina.ts`
 * nunca vê `EventSource`, e o adaptador real vive em `./adaptadorNavegador.ts`.
 *
 * O QUE ESTE ARQUIVO NÃO FAZ. Não decide autorização (é do backend, ADR-0011
 * P3), não interpreta dado clínico e não redige texto de estado — as descrições
 * em pt-BR já vêm prontas do contrato (`DESCRICAO_ESTADO_CONEXAO`,
 * `DESCRICAO_MOTIVO_ENCERRAMENTO`) e são importadas, nunca reescritas.
 *
 * Rastreio: ADR-0011 P3/P4/P6/P8, ADR-0016 §4.1, contrato comum §10-12
 * (credencial jamais em query string), LAC-L1.
 */
import {
  CAMINHO_FLUXO_EVENTOS,
  CAMINHO_TICKET_EVENTOS,
  type EstadoConexao,
  type TicketEventosResposta,
} from "@intensicare/contratos";
import type { EstadoConectividade } from "../domain/estados.js";

// ---------------------------------------------------------------------------
// Caminhos
// ---------------------------------------------------------------------------

/**
 * Caminhos do gateway de eventos — REEXPORTADOS do contrato, não declarados
 * aqui.
 *
 * ISTO MUDOU. Até a onda anterior este módulo mantinha DUAS cópias literais das
 * rotas, porque `@intensicare/contratos` publicava o vocabulário de mensagens e
 * não exportava constante de rota; a defesa contra deriva era um teste que
 * confrontava a cópia local com `CONTRATO_CLIENTE_EVENTOS`. O contrato passou a
 * exportar as duas constantes e a MONTAR `CONTRATO_CLIENTE_EVENTOS` a partir
 * delas — o que tornou aquele teste circular (comparava a constante consigo
 * mesma). A cópia foi apagada e o teste, substituído: ver a nota no topo de
 * `./porta.test.ts`.
 *
 * O reexport existe para não obrigar cada consumidor deste módulo a importar de
 * dois lugares; a FONTE é uma só.
 */
export { CAMINHO_FLUXO_EVENTOS, CAMINHO_TICKET_EVENTOS };

/**
 * Único parâmetro de consulta que o fluxo aceita. O gateway RECUSA com 400
 * qualquer parâmetro de credencial, tenant ou sujeito (lista
 * `PARAMETROS_PROIBIDOS_NA_QUERY` em `apps/api/src/eventos/stream.ts`); o
 * cursor não é nenhum dos três — é uma sequência opaca e monotônica por tenant
 * (ADR-0011 P4).
 *
 * O cabeçalho `Last-Event-ID` seria o mecanismo nativo, mas o `EventSource` do
 * navegador só o envia na reconexão que ELE mesmo faz — e essa reconexão é
 * inútil aqui, porque o ticket é de USO ÚNICO e já foi consumido (o cookie é
 * expurgado na abertura). Quem reconecta é este cliente, com ticket novo, e o
 * cursor viaja no único lugar que o `EventSource` deixa: a URL.
 */
export const PARAMETRO_CURSOR = "cursor" as const;

/**
 * Monta a URL do fluxo. Fail-closed: cursor que não seja inteiro não negativo
 * é DESCARTADO e a abertura vira replay do início — nunca um salto silencioso
 * para um ponto arbitrário do fluxo (ADR-0011 P4: a lacuna é explícita).
 */
export function montarUrlDoFluxo(cursor: number | null, prefixo = ""): string {
  const caminho = `${prefixo}${CAMINHO_FLUXO_EVENTOS}`;
  if (cursor === null || !Number.isInteger(cursor) || cursor < 0) return caminho;
  return `${caminho}?${PARAMETRO_CURSOR}=${String(cursor)}`;
}

// ---------------------------------------------------------------------------
// Porta de transporte
// ---------------------------------------------------------------------------

/**
 * Um quadro SSE tal como o transporte o observou. `dados` é o corpo `data:`
 * ainda em TEXTO: quem decide se ele é legível é a máquina pura, para que
 * "JSON quebrado" seja uma transição testável e não uma exceção no adaptador.
 */
export interface QuadroRecebido {
  /** Valor do campo `event:` do quadro. */
  readonly nomeDoEvento: string;
  /** Corpo `data:` bruto, sem interpretação. */
  readonly dados: string;
  /** Campo `id:` do quadro, quando presente. */
  readonly id: string | null;
}

/** Assinatura do fluxo aberto — só o que o cliente precisa para desligar. */
export interface FluxoAberto {
  fechar(): void;
}

export interface AberturaDeFluxo {
  /** Cursor durável de retomada; `null` abre do início. */
  readonly cursor: number | null;
  readonly aoAbrir: () => void;
  readonly aoQuadro: (quadro: QuadroRecebido) => void;
  /**
   * Falha de transporte observada pelo adaptador (socket caiu, resposta
   * não-200, `EventSource` em erro). NUNCA carrega o erro bruto: uma exceção de
   * rede pode conter URL e cabeçalho, e nada disso pode chegar à tela ou ao log
   * (contrato comum §10-12).
   */
  readonly aoFalhaDeTransporte: () => void;
}

export type AbrirFluxo = (abertura: AberturaDeFluxo) => FluxoAberto;

// ---------------------------------------------------------------------------
// Porta de handshake (ticket efêmero)
// ---------------------------------------------------------------------------

/**
 * Resultado da emissão do ticket. O VALOR do ticket nunca aparece aqui — ele
 * vem em cookie `HttpOnly` e é, por construção, ilegível ao JavaScript
 * (`TICKET_EVENTOS_COOKIE`, `apps/api/src/eventos/ticket.ts`). Este tipo
 * carrega apenas o que o corpo da resposta declara.
 */
export type ResultadoTicket =
  | { readonly ok: true; readonly resposta: TicketEventosResposta }
  /**
   * `recusado` = o servidor negou (401/403). `indisponivel` = não houve
   * resposta utilizável (rede, 5xx, corpo ilegível). A distinção existe para o
   * cliente decidir se PARA (recusa é decisão do servidor sobre autorização) ou
   * se pode tentar de novo mais tarde — nunca para exibir motivo de negação.
   */
  | { readonly ok: false; readonly motivo: "recusado" | "indisponivel" };

export type EmitirTicket = (sinal: AbortSignal) => Promise<ResultadoTicket>;

// ---------------------------------------------------------------------------
// Porta de reconciliação — a EVIDÊNCIA que autoriza dizer "reconciliado"
// ---------------------------------------------------------------------------

/**
 * FATO DE LEITURA: a projeção autoritativa foi lida COM SUCESSO, e este é o
 * instante da leitura.
 *
 * POR QUE ESTE TIPO EXISTE, e o defeito que ele fecha estruturalmente (ACH-O3-9).
 * A porta de reconciliação admitia `() => void | Promise<void>`. A fiação real
 * (`../App.tsx`) devolvia `void`; o hook fazia `await` sobre `undefined`, que
 * resolve na microtarefa seguinte, e a máquina dava a reconciliação por
 * concluída ANTES de qualquer leitura. A tela então anunciava
 * "Sincronizado — dados reconciliados após reconexão." no exato instante em que
 * o cliente SABE ter perdido um evento — o núcleo de HAZ-0025 e o oposto de
 * SAF-0025.
 *
 * O tipo agora EXIGE a evidência: `void` deixou de ser atribuível, e um
 * chamador que não tenha lido nada só pode devolver `null`. Não é disciplina de
 * quem chama — é erro de compilação.
 *
 * `null` = nenhuma leitura bem-sucedida respondeu a este pedido (falhou, foi
 * cancelada, ou nenhuma tela estava lendo). A lacuna CONTINUA aberta e a tela
 * segue declarando degradação; quem tenta de novo é a releitura periódica de
 * `../estado/recursoRemoto.ts` (ADR-0011 P8).
 */
export interface FatoDeLeitura {
  /**
   * Instante ISO 8601 da leitura BEM-SUCEDIDA. Nunca vazio: string vazia é
   * tratada como ausência de fato pelo redutor (fail-closed).
   */
  readonly obtidoEm: string;
}

/** Releitura da projeção autoritativa. Devolve a EVIDÊNCIA, ou `null`. */
export type ReconciliarPorPolling = () => Promise<FatoDeLeitura | null>;

/** `true` só para um fato de leitura completo — fail-closed. */
export function ehFatoDeLeitura(valor: unknown): valor is FatoDeLeitura {
  if (typeof valor !== "object" || valor === null) return false;
  const { obtidoEm } = valor as { obtidoEm?: unknown };
  return typeof obtidoEm === "string" && obtidoEm !== "";
}

// ---------------------------------------------------------------------------
// Ponte de vocabulário: fio (ADR-0011 P6) → tela (§11, 5ª família)
// ---------------------------------------------------------------------------

/**
 * Tradução dos SEIS estados de conexão do contrato para a 5ª família de
 * estados da tela.
 *
 * Não é duplicação de vocabulário: os dois lados já existiam e são deliberados.
 * O fio mantém os tokens verbatim da cláusula aceita (`EstadoConexao`, ver a
 * nota de idioma em `packages/contratos/src/asyncapi.ts`); a tela usa a família
 * pt-BR de `../domain/estados.ts`, que é anterior a este módulo e tem
 * renderização própria em `../components/AvisosDeEstado.tsx`. O `Record`
 * completo obriga o TypeScript a acusar qualquer estado novo dos dois lados.
 *
 * É POR ESTE MAPA que `reproduzindo` e `reconciliado` deixam de ser catálogo de
 * apresentação e passam a ter origem real (`GaleriaEstados.tsx` documenta que
 * até aqui não tinham transporte que os produzisse).
 */
export const CONECTIVIDADE_POR_ESTADO_CONEXAO: Readonly<
  Record<EstadoConexao, EstadoConectividade>
> = {
  online: "online",
  degraded: "degradado",
  offline: "offline",
  reconnecting: "reconectando",
  replaying: "reproduzindo",
  reconciled: "reconciliado",
};
