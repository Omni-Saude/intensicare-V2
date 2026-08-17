/**
 * apps/api/src/eventos/chave-escopada.ts — `TenantScopedKey` materializada.
 *
 * ADR-0016 §4.1 (aceito, GDEC-0016) exige, verbatim: "chaves de cache,
 * **nomes de canal SSE** e chaves de idempotência são construídas por um
 * tipo `TenantScopedKey`, tornando **impossível por tipo** produzir chave
 * sem tenant". Este módulo é essa materialização para o canal SSE.
 *
 * O que "impossível por tipo" significa aqui, com precisão:
 *
 * - `TenantId` é um tipo de marca (branded). Nenhuma `string` do chamador
 *   é atribuível a ele — nem `request.query.tenantId`, nem um cabeçalho,
 *   nem um campo de corpo (regra dura §3-6 do prompt; ADR-0011 P2/P3).
 * - O ÚNICO ponto do código que produz um `TenantId` é
 *   `criarContextoVerificado`, em `./porta.ts` — a fronteira de
 *   verificação de sessão. Não existe segunda porta de entrada.
 * - `ChaveEscopadaPorTenant` só se constrói a partir de um
 *   `ContextoVerificado`. Logo, nenhuma função de leitura, canal ou fila
 *   deste diretório pode ser chamada sem um tenant verificado.
 *
 * A prova está em `./chave-escopada.test.ts`, com asserções `@ts-expect-error`
 * que FALHAM o `pnpm typecheck` caso a marca deixe de valer.
 */

/** Marca nominal de `TenantId` — nunca exportada, nunca construível fora daqui. */
declare const marcaTenantId: unique symbol;

/**
 * Identificador de tenant JÁ VERIFICADO. Uma `string` comum não é
 * atribuível a este tipo.
 */
export type TenantId = string & { readonly [marcaTenantId]: "TenantId" };

/** Marca nominal da chave escopada. */
declare const marcaChaveEscopada: unique symbol;

/**
 * Chave escopada por tenant — usada como nome de canal SSE e como escopo
 * de toda leitura durável desta conexão.
 */
export interface ChaveEscopadaPorTenant {
  readonly [marcaChaveEscopada]: "ChaveEscopadaPorTenant";
  /** Tenant verificado a que a chave pertence. */
  readonly tenantId: TenantId;
  /** Recurso escopado (ex.: `eventos-stream`). */
  readonly recurso: string;
  /** Representação textual estável — `tenant:<id>|recurso:<r>`. */
  readonly valor: string;
}

/**
 * ÚNICO construtor de `TenantId` no processo. Chamado exclusivamente por
 * `criarContextoVerificado` (`./porta.ts`), isto é, pela fronteira de
 * verificação de sessão. Qualquer outro chamador é violação de fronteira e
 * deve ser reprovado em revisão — o tipo impede o acidente, não a
 * subversão deliberada.
 *
 * @internal
 */
export function marcarTenantVerificado(tenantIdBruto: string): TenantId {
  const limpo = tenantIdBruto.trim();
  if (limpo === "") {
    throw new Error("Tenant verificado não pode ser vazio (fail-closed, ADR-0011 P2).");
  }
  return limpo as TenantId;
}

/**
 * Constrói a chave escopada do canal de eventos. Repare na assinatura: não
 * existe sobrecarga que aceite `string` — é o tipo que impede o canal sem
 * tenant, não uma convenção de nomenclatura.
 */
export function criarChaveEscopada(
  contexto: { readonly tenantId: TenantId },
  recurso: string,
): ChaveEscopadaPorTenant {
  const recursoLimpo = recurso.trim();
  if (recursoLimpo === "") {
    throw new Error("Recurso escopado não pode ser vazio (fail-closed).");
  }
  return {
    tenantId: contexto.tenantId,
    recurso: recursoLimpo,
    valor: `tenant:${contexto.tenantId}|recurso:${recursoLimpo}`,
  } as ChaveEscopadaPorTenant;
}

/** Recurso do canal de eventos em tempo real. */
export const RECURSO_CANAL_EVENTOS = "eventos-stream" as const;

/**
 * Verificação fail-closed de escopo de envelope: ADR-0016 §4.1 manda que o
 * consumidor **reescope a partir do envelope, jamais confiando no escopo
 * do produtor**. Retorna `false` quando o evento não pertence à chave —
 * caso em que a assinatura é encerrada com `escopo-divergente`, nunca
 * filtrada em silêncio.
 */
export function envelopePertenceAChave(
  chave: ChaveEscopadaPorTenant,
  envelopeTenantId: string,
): boolean {
  return envelopeTenantId === (chave.tenantId as string);
}
