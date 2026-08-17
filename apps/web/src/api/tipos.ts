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
import type { EstadoCarregamento } from "../domain/estados.js";

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
    opcoes?: OpcoesChamada,
  ): Promise<RespostaApi<Alerta>>;
}
