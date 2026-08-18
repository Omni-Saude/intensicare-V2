/**
 * apps/web/src/api/tipos.ts
 *
 * Porta do cliente de API desta fatia. Integração SPR-G7-2: a INTEGRAÇÃO
 * PENDENTE anterior foi resolvida — `apps/web` agora declara
 * `@intensicare/contratos` como dependência de workspace e importa dele o
 * envelope de erro RFC 9457 e o cabeçalho de idempotência; os espelhos
 * locais duplicados foram removidos. `ProblemaLocal` sobrevive apenas como
 * ALIAS do tipo do contrato, para não quebrar consumidores existentes.
 */
import { IDEMPOTENCY_KEY_HEADER, type ProblemDetails } from "@intensicare/contratos";
import type { Alerta, ItemGradeLeito } from "../domain/clinico.js";
import type { EstadoCarregamento, EstadoItemTrabalho } from "../domain/estados.js";

/** Nome do cabeçalho de idempotência — re-export do contrato real. */
export const CABECALHO_IDEMPOTENCIA = IDEMPOTENCY_KEY_HEADER;

/** Alias do envelope de erro RFC 9457 do contrato real (`@intensicare/contratos`). */
export type ProblemaLocal = ProblemDetails;

/**
 * Envelope de resposta do cliente mock. `estadoCarregamento` é sempre o
 * identificador de estado (ADR-0021 F1) que a UI usa para decidir o que
 * renderizar; `dados`/`problema` carregam o conteúdo associado.
 */
export interface RespostaApi<T> {
  estadoCarregamento: EstadoCarregamento;
  dados: T | null;
  problema: ProblemaLocal | null;
  /**
   * Contexto de um conflito de concorrência otimista (HTTP 412 — ADR-0009
   * W3), quando houver. Deliberadamente NÃO é um décimo valor da família de
   * carregamento do §11: o conflito pertence ao item de trabalho, não ao
   * carregamento da tela. Sem estes dois campos o clínico saberia que falhou,
   * mas não contra o quê — e W3 exige que a redecisão seja humana e
   * informada, nunca última-escrita-vence silenciosa.
   */
  conflito?: ConflitoVersao | null;
}

/** Estado corrente do recurso no servidor, para redecisão humana (ADR-0009 W3). */
export interface ConflitoVersao {
  readonly versaoAtual: number;
  readonly estadoAtual: EstadoItemTrabalho;
}

/**
 * Modo de demonstração — permite às telas (e à revisão humana) forçar
 * cada estado de carregamento exigido pela tarefa, já que um cliente
 * mock em memória não produz falhas de rede organicamente. Isto é uma
 * ferramenta de revisão/demonstração HONESTA e rotulada como tal na UI —
 * nunca é apresentada como comportamento real de produção.
 */
export type ModoDemonstracao = Extract<
  EstadoCarregamento,
  "carregando" | "vazio" | "indisponivel" | "erro" | "pronto"
>;

export interface OpcoesChamada {
  /** Força o resultado da chamada para fins de demonstração/teste. */
  forcarResultado?: ModoDemonstracao;
  /** Atraso simulado (ms) antes de resolver — default pequeno; 0 em testes. */
  atrasoMs?: number;
  /**
   * Sinal de cancelamento (ACH-07). Toda implementação da porta DEVE
   * repassá-lo à operação de I/O subjacente — no cliente HTTP, ao próprio
   * `fetch`, para que o cancelamento seja REAL (a conexão é encerrada) e não
   * uma flag que descarta o resultado depois de recebê-lo. O cancelamento é
   * observável no próprio sinal (`sinal.aborted`, `sinal.reason`).
   */
  sinal?: AbortSignal;
}

/**
 * Opções do comando de reconhecimento. `versaoVista` é OBRIGATÓRIA e é a
 * razão de este tipo existir separado: ADR-0009 W3 exige que o `If-Match`
 * carregue a versão que o ator humano VIU quando decidiu — não a versão
 * corrente no servidor.
 *
 * A diferença decide se o controle funciona. Lendo a versão corrente no
 * instante do envio, o cliente adota em silêncio qualquer mudança feita por
 * outro clínico entre a renderização e a confirmação: o 412 nunca acontece, a
 * "última-escrita-vence silenciosa" que W3 proíbe volta pela porta dos fundos
 * (HAZ-0023), e a `AuditEvidence` de W6 grava uma "versão vista" que ninguém
 * viu. Exigir o parâmetro aqui torna a omissão um erro de compilação.
 */
export interface OpcoesReconhecer extends OpcoesChamada {
  readonly versaoVista: number;
}

/** Porta do cliente de API consumida pelas telas desta fatia. */
export interface ClienteApiIntensiCare {
  listarGradeLeitos(opcoes?: OpcoesChamada): Promise<RespostaApi<ItemGradeLeito[]>>;
  obterAvaliacaoPaciente(
    leitoId: string,
    opcoes?: OpcoesChamada,
  ): Promise<RespostaApi<ItemGradeLeito>>;
  reconhecerAlerta(
    alertaId: string,
    chaveIdempotencia: string,
    opcoes: OpcoesReconhecer,
  ): Promise<RespostaApi<Alerta>>;
}
