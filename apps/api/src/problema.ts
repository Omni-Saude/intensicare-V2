/**
 * apps/api/src/problema.ts — construção de `application/problem+json`
 * (RFC 9457) para a fatia SPR-G7-2.
 *
 * Módulo próprio para que `auth.ts` e `routes.ts` compartilhem a mesma regra
 * sem import circular.
 */

/**
 * Instância segura para `problem+json` (RFC 9457 §3.1.5).
 *
 * A URL da requisição NÃO pode ser usada: rotas como
 * `/v1/pacientes/:pacienteRef/avaliacoes` carregam o identificador do sujeito
 * no caminho, e ecoá-lo no corpo do erro vaza esse identificador para
 * qualquer camada que registre ou encaminhe a resposta (SAF-0026, SEC-0015;
 * ACHADO-02 da verificação de controles da fatia G7). A URN abaixo identifica
 * a OCORRÊNCIA — que é o que a RFC pede — e é correlacionável com a trilha de
 * auditoria pelo cabeçalho `x-correlation-id`, sem transportar dado do
 * sujeito.
 */
export function instanciaSegura(request: { readonly id: string }): string {
  return `urn:intensicare:requisicao:${request.id}`;
}
