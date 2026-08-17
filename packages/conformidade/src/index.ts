/**
 * @intensicare/conformidade
 *
 * Harness de conformidade §7.6 EXECUTÁVEL: os 22 cenários dirigidos pelo
 * consumidor (`docs/08-interoperability/conformance/contract-v1/cenarios-teste-consumidor.md`)
 * rodados contra as fixtures sintéticas PINADAS do repositório, mais as
 * verificações de semântica (identidade, encontro, timestamp, unidade,
 * proveniência, replay) que essas fixtures permitem hoje.
 *
 * LIMITE DURO (repetido no README e no relatório gerado): isto **não**
 * demonstra compatibilidade com a AMH, **não** altera o achado
 * "candidato a integração" e **não** move a matriz 47/47. Nenhum dado real
 * é acessado; nenhuma fixture é criada; nenhum cenário é forçado a verde.
 *
 * Nenhuma alegação de efetividade clínica é feita por este pacote.
 */

export const packageVersion = "0.0.0" as const;

export * from "./anticorruption-layer.js";
export * from "./envelope.js";
export * from "./harness.js";
export * from "./pinned-fixtures.js";
export * from "./quarantine.js";
export * from "./ref-mesh.js";
export * from "./report.js";
export * from "./runner.js";
export * from "./scenarios.js";
export * from "./semantic-checks.js";
