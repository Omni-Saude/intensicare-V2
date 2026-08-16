/**
 * @intensicare/observabilidade
 *
 * Vocabulário de telemetria compatível com OpenTelemetry (sem SDK externo),
 * redação de PHI imposta pelo tipo, kill switch e modo degradado explícitos, e
 * sondas sintéticas de segurança ponta a ponta. Materializa a direção do
 * ADR-0020 (aceita em GDEC-0016) na parte que não exige ambiente da AMH nem
 * ato humano.
 *
 * O QUE ESTE PACOTE NÃO É — leia antes de citá-lo como evidência
 * ---------------------------------------------------------------
 * SOURCE (prompt §20): nunca "accept an infrastructure render, health
 * endpoint, test count, sign-off document, or model-generated report as
 * sufficient release evidence". Este pacote é código instrumentável e
 * testado; ele NÃO é prontidão operacional demonstrada. Especificamente,
 * continuam inexistentes: exportador/coletor real (ADR-0019), propagação
 * multi-instância do kill switch, agendador real de sondas, SLO medido em
 * ambiente real, ensaio de restore, exercício de DR e treinamento de suporte.
 * O estado item a item está em `docs/13-operations-and-reliability/`.
 *
 * Fronteira de módulo (ADR-0002): este pacote depende SOMENTE de
 * `@intensicare/dominio`. Ele não conhece persistência nem API — quem instrumenta
 * não conhece o instrumentado além do vocabulário de domínio.
 *
 * Nenhuma alegação de efetividade clínica, conformidade regulatória ou
 * segurança comprovada é feita por este pacote.
 */

export const packageVersion = "0.0.0" as const;

export * from "./degradation.js";
export * from "./in-memory.js";
export * from "./instrumentation.js";
export * from "./kill-switch.js";
export * from "./metric-catalog.js";
export * from "./probes.js";
export * from "./readiness.js";
export * from "./redaction.js";
export * from "./telemetry.js";
