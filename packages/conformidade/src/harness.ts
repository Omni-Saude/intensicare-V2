/**
 * Vocabulário de resultado do harness §7.6 e as regras — explícitas — que
 * transformam verificações em veredito.
 *
 * Regra de veredito (declarada porque veredito implícito é veredito
 * inflado)
 * ---------------------------------------------------------------------
 * Cada cenário é decomposto nas cláusulas do seu "então". Uma cláusula é:
 *
 * - **VERIFICAÇÃO (`check`)** quando é obrigação do CONSUMIDOR — o sujeito
 *   deste harness. Verificações são EXECUTADAS contra as fixtures pinadas
 *   e produzem `passou`/`falhou`, ou `nao-executavel` quando o insumo
 *   necessário não existe (fixture ausente, interface `resolve`
 *   inexistente, manifesto não publicado).
 * - **LIMITAÇÃO (`limitation`)** quando é obrigação/comportamento do
 *   PRODUTOR (a AMH), ou quando o comportamento vive em outro pacote da
 *   V2. Limitação NÃO é cláusula satisfeita: é cláusula declaradamente
 *   fora do alcance desta execução, listada para que ninguém a leia como
 *   provada.
 *
 * Veredito do cenário:
 * - `falhou` se QUALQUER verificação executada falhou;
 * - `passou` somente se TODAS as verificações foram executadas e passaram;
 * - `nao-executavel` se ALGUMA verificação não pôde ser executada — um
 *   cenário parcialmente executado **não passa**.
 *
 * Cobertura, independente do veredito:
 * - `integral` — todas as verificações executadas e nenhuma limitação;
 * - `parcial` — alguma verificação executada, mas há verificação bloqueada
 *   ou limitação declarada;
 * - `nenhuma` — nenhuma verificação executada.
 */

export type CheckStatus = "passou" | "falhou" | "nao-executavel";

export type ScenarioVerdict = CheckStatus;

export type Coverage = "integral" | "parcial" | "nenhuma";

/** Causa enumerada de bloqueio — nunca texto livre no lugar da causa. */
export type BlockingCause =
  | "amh-indisponivel"
  | "fixture-ausente"
  | "interface-inexistente"
  | "campo-inexistente-no-contrato"
  | "manifesto-nao-publicado"
  | "fora-do-escopo-deste-pacote";

export interface CheckResult {
  readonly id: string;
  /** Cláusula do "então" do cenário, em pt-BR, como está na fonte. */
  readonly assertion: string;
  readonly status: CheckStatus;
  /** O que foi OBSERVADO na execução (ou por que não pôde ser observado). */
  readonly evidence: string;
  readonly blockedBy?: BlockingCause;
}

export interface ScenarioLimitation {
  readonly cause: BlockingCause;
  readonly statement: string;
}

export interface ScenarioMetadata {
  readonly id: string;
  readonly title: string;
  readonly interfaces: readonly string[];
  readonly fixtures: readonly string[];
  /** Linha da matriz de cobertura do §7.6 que este cenário atende. */
  readonly requirement: string;
  readonly hazards: readonly string[];
}

export interface ScenarioResult extends ScenarioMetadata {
  readonly verdict: ScenarioVerdict;
  readonly coverage: Coverage;
  readonly checks: readonly CheckResult[];
  readonly limitations: readonly ScenarioLimitation[];
}

export function passed(id: string, assertion: string, evidence: string): CheckResult {
  return { id, assertion, status: "passou", evidence };
}

export function failed(id: string, assertion: string, evidence: string): CheckResult {
  return { id, assertion, status: "falhou", evidence };
}

export function blocked(
  id: string,
  assertion: string,
  blockedBy: BlockingCause,
  evidence: string,
): CheckResult {
  return { id, assertion, status: "nao-executavel", evidence, blockedBy };
}

/**
 * Verificação booleana com evidência OBRIGATÓRIA nos dois ramos: um
 * `expect` que só descreve o caminho feliz esconde o que aconteceu quando
 * falha.
 */
export function check(
  id: string,
  assertion: string,
  condition: boolean,
  observed: string,
): CheckResult {
  return condition ? passed(id, assertion, observed) : failed(id, assertion, observed);
}

export function verdictOf(checks: readonly CheckResult[]): ScenarioVerdict {
  if (checks.some((c) => c.status === "falhou")) return "falhou";
  if (checks.length === 0) return "nao-executavel";
  if (checks.some((c) => c.status === "nao-executavel")) return "nao-executavel";
  return "passou";
}

export function coverageOf(
  checks: readonly CheckResult[],
  limitations: readonly ScenarioLimitation[],
): Coverage {
  const executed = checks.filter((c) => c.status !== "nao-executavel");
  if (executed.length === 0) return "nenhuma";
  if (executed.length === checks.length && limitations.length === 0) return "integral";
  return "parcial";
}

/** Rótulo de exibição do veredito (pt-BR), fiel à causa do bloqueio. */
export function verdictLabel(result: ScenarioResult): string {
  if (result.verdict === "passou") return "PASSOU";
  if (result.verdict === "falhou") return "FALHOU";
  const causes = new Set<BlockingCause>();
  for (const c of result.checks) if (c.blockedBy) causes.add(c.blockedBy);
  const dependsOnAmh =
    causes.has("amh-indisponivel") ||
    causes.has("fixture-ausente") ||
    causes.has("interface-inexistente") ||
    causes.has("campo-inexistente-no-contrato") ||
    causes.has("manifesto-nao-publicado");
  return dependsOnAmh ? "NÃO EXECUTÁVEL SEM AMH" : "NÃO EXECUTÁVEL (dependência fora deste pacote)";
}

export const CAUSE_LABELS: Readonly<Record<BlockingCause, string>> = Object.freeze({
  "amh-indisponivel": "AMH indisponível (nenhum sandbox pinado, nenhum ambiente alcançável)",
  "fixture-ausente": "fixture ausente no pacote de contrato (§5 de cenarios-teste-consumidor.md)",
  "interface-inexistente": "interface não existe (IF-07 `resolve(ref, as_of)` não foi exposta)",
  "campo-inexistente-no-contrato":
    "o contrato v1 não carrega o campo (exclusão deliberada, registrada na contabilidade de perda)",
  "manifesto-nao-publicado":
    "manifesto de contrato não publicado (`manifest_sha256: null`, `pinned: false`)",
  "fora-do-escopo-deste-pacote":
    "comportamento vive em outro pacote da V2 (registrado como pendência, não como satisfeito)",
});
