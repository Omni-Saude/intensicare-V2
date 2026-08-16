/**
 * @intensicare/vigilancia — vigilância contínua (SPR-OC-1, fase 10 do §17),
 * na parte que é CÓDIGO e pode ser exercida com dados sintéticos.
 *
 * Quatro instrumentos:
 * - `carga-de-alarmes` — carga por paciente-dia e por unidade (SM-04/KPIR-03):
 *   a métrica que o programa mais precisa vigiar, porque alerta demais mata a
 *   atenção clínica.
 * - `deriva` — mudança na distribuição dos insumos e na taxa de status
 *   não-computável ao longo do tempo (fonte degradando; §2.2.3).
 * - `versao-de-regra` — qual versão avaliou o quê, e mistura de versões numa
 *   janela (ADR-0025, HAZ-0020).
 * - `kpir-14` — "altas vivas da UTI" (K-8/GDEC-0007), com as salvaguardas da
 *   própria definição tornadas estruturais.
 *
 * LIMITE, repetido aqui porque é a coisa mais fácil de perder: nenhum dado
 * real existe. Isto é instrumentação exercida contra dados sintéticos, não
 * vigilância em operação — a vigilância de verdade depende de MG-G8-PROD.
 * Nenhuma alegação de efetividade clínica, conformidade regulatória ou
 * segurança comprovada é feita por este pacote, e nada aqui fecha gate,
 * bloqueador, risco, hazard, ADR ou OS.
 */
export const packageVersion = "0.0.0" as const;

export * from "./carga-de-alarmes.js";
export * from "./deriva.js";
export * from "./kpir-14.js";
export * from "./leitura.js";
export * from "./tipos.js";
export * from "./versao-de-regra.js";
