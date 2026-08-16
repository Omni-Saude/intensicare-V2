/**
 * Forma de instante clínico aceita pelos repositórios deste pacote.
 *
 * Integração SPR-G7-2: a duplicação local registrada como PENDÊNCIA na
 * fatia anterior foi removida — a aresta workspace com
 * `@intensicare/dominio` agora existe (`pnpm-lock.yaml` atualizado), e o
 * tipo canônico `TemporalValue` (ADR-0005 M3; DOM-0009) é importado
 * diretamente do domínio. `TemporalValueInput` permanece exportado como
 * alias para não quebrar chamadores existentes deste pacote.
 */
import type { TemporalValue } from "@intensicare/dominio";

export type { TemporalValue } from "@intensicare/dominio";

/** Alias de compatibilidade — mesmo tipo de `@intensicare/dominio`. */
export type TemporalValueInput = TemporalValue;
