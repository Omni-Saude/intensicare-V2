/**
 * Geradores de identificadores 100% sintéticos — sempre carregam o
 * marcador `SYNTH-`, nunca a forma de um identificador real (ver
 * `docs/14-devsecops-and-delivery/politica-dados-sinteticos.md`).
 */

/** Prefixo obrigatório de qualquer identificador sintético gerado aqui. */
export const SYNTHETIC_MARKER = "SYNTH-" as const;

/**
 * Gera um `portable_subject_ref` (PSR) sintético, no formato
 * `amh:psr:v1:SYNTH-<suffix>` — deliberadamente distinto da forma de um
 * PSR real (`amh:psr:v1:<uuidv4>`), para nunca colidir com uma referência
 * real e para que `scripts/check_forbidden_content.py` nunca precise
 * sinalizá-lo.
 *
 * @param suffix identificador determinístico e não sensível (ex.: `"01"`,
 *   `"patient-a"`); nunca deve conter PHI.
 */
export function generateSyntheticPsr(suffix: string): string {
  return `amh:psr:v1:${SYNTHETIC_MARKER}${suffix}`;
}

/** Gera um identificador de tenant sintético, no mesmo espírito do PSR. */
export function generateSyntheticTenantId(suffix: string): string {
  return `${SYNTHETIC_MARKER}TENANT-${suffix}`;
}
