/**
 * @intensicare/fixtures-sinteticas
 *
 * Geração de dados 100% sintéticos para desenvolvimento e teste do
 * IntensiCare V2. PREMISSA (reversível, GDEC-0014/0015/0017): dados
 * sintéticos são o default vinculante de desenvolvimento — ver
 * `docs/14-devsecops-and-delivery/politica-dados-sinteticos.md`. Nenhuma
 * função deste pacote gera ou aceita PHI ou identificador real; toda
 * saída carrega o marcador `SYNTH-`.
 *
 * Esta fatia (SPR-G7-2) adiciona `buildG7SyntheticScenario` — o cenário
 * SYNTH completo da fatia vertical (organização, UTI, 4 leitos, 2
 * pacientes, série de sinais vitais e um caso de insumo ausente) — e, na
 * integração da fatia, `loadIntoDatabase(db)` (`load.ts`), que semeia o
 * cenário num banco real usando os repositórios de
 * `@intensicare/persistencia` (arestas workspace agora declaradas).
 */

export const packageVersion = "0.0.0" as const;

export * from "./synthetic-identifiers.js";
export * from "./scenario.js";
export * from "./load.js";
