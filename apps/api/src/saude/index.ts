/**
 * apps/api/src/saude — prontidão operacional e observabilidade da API.
 *
 * Ponto único de importação para a fiação em `apps/api/src/index.ts`
 * (aplicada pelo orquestrador — ver handoff).
 *
 * O QUE ESTE MÓDULO NÃO É — leia antes de citá-lo como evidência
 * ---------------------------------------------------------------
 * SOURCE (prompt §20): nunca "accept an infrastructure render, health
 * endpoint, test count, sign-off document, or model-generated report as
 * sufficient release evidence". Este módulo separa liveness/readiness/startup
 * e liga o avaliador e a telemetria que já existiam em
 * `@intensicare/observabilidade`. Ele NÃO torna a plataforma pronta e NÃO
 * altera nenhum fato do estado duro (0 vias clínicas acionáveis, 47/47
 * inelegíveis, safety case M0, nenhum dado real).
 *
 * Continuam inexistentes, exatamente como o cabeçalho de
 * `packages/observabilidade/src/index.ts` declara: exportador/coletor real
 * (ADR-0019), propagação multi-instância do kill switch, agendador real de
 * sondas, SLO medido em ambiente real, ensaio de restore, exercício de DR e
 * treinamento de suporte. Nenhum alvo numérico de latência, disponibilidade
 * ou frescor foi decidido aqui: todos permanecem VALIDATION REQUIRED (Gate
 * G1). Ligar a fiação não mede nenhum deles.
 */
export * from "./avaliador.js";
export * from "./inicializacao.js";
export * from "./portas.js";
export * from "./rotas.js";
export * from "./telemetria.js";
