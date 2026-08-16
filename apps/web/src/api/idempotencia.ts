/**
 * apps/web/src/api/idempotencia.ts
 *
 * Geração de chave de idempotência no lado do cliente — mesma convenção
 * de cabeçalho de `apps/api` (`Idempotency-Key`, ver
 * `CABECALHO_IDEMPOTENCIA` em `./tipos.ts`). Separado de
 * `./clienteMock.ts` de propósito: esta é uma preocupação da camada de
 * API compartilhada pelo cliente HTTP real (`./clienteHttp.ts`) e pelo
 * mock, não uma função de mock.
 */

/** Gera uma chave de idempotência sintética estável para uma ação de UI. */
export function gerarChaveIdempotencia(prefixo: string): string {
  return `SYNTH-idem-${prefixo}-${Math.random().toString(36).slice(2, 10)}`;
}
