/**
 * apps/api/src/regras/index.ts — composição do registro de regras e fachadas
 * TIPADAS de despacho (achado §6.4, P1).
 *
 * A rota nunca escolhe regra por `if`: chama `despacharNews2` ou
 * `despacharGcs`, e cada uma resolve a MESMA tabela por identidade+versão.
 * As duas fachadas existem só para dar tipo à entrada e à saída — NEWS2 e
 * GCS têm insumos e resultados estruturalmente distintos, e é exatamente
 * assim que "nenhum campo de um contamina o outro" fica imposto pelo
 * compilador, não prometido em prosa.
 */
import type { ClinicalRuleSwitchboard } from "@intensicare/observabilidade";
import type { News2TestVector } from "@intensicare/rule-bundle";
import { type PortaDeBundle, portaDeBundleAusente } from "./bundle.js";
import {
  CHAVE_GCS,
  criarProvedorGcs,
  IDENTIDADE_GCS,
  type InsumoGcs,
  type SaidaGcs,
} from "./gcs.js";
import { CHAVE_NEWS2, criarProvedorNews2, type InsumoNews2, type SaidaNews2 } from "./news2.js";
import type { ContextoDespacho, Despacho } from "./registro.js";
import { RegistroDeRegras } from "./registro.js";

export * from "./bundle.js";
export * from "./exposicao.js";
export * from "./gcs.js";
export * from "./news2.js";
export * from "./registro.js";
export * from "./tipos.js";

/**
 * Motivo padrão da ausência de artefato para o RULE-GCS: `rule-bundle` só
 * constrói manifesto do NEWS2. Ver handoff — o export
 * `buildGcsBundleManifest` é pedido ao dono daquele pacote; montá-lo aqui
 * exigiria redigir uso pretendido, evidência, responsabilidade e estado de
 * validação, que é conteúdo normativo clínico/de governança.
 */
export const MOTIVO_GCS_SEM_BUNDLE =
  "@intensicare/rule-bundle não expõe construtor de manifesto para RULE-GCS " +
  "(só buildNews2BundleManifest); sem artefato verificável não há despacho — fail-closed (ADR-0007)";

export interface OpcoesComposicaoDeRegras {
  readonly news2: {
    readonly porta: PortaDeBundle;
    readonly vetores?: readonly News2TestVector[] | undefined;
  };
  /** Ausente ⇒ porta `bundle_ausente` (estado real do repositório hoje). */
  readonly gcs?: { readonly porta: PortaDeBundle } | undefined;
  readonly quadroDeChaves?: ClinicalRuleSwitchboard | undefined;
}

/** Monta o registro com as duas vias registradas de forma independente. */
export function montarRegistroDeRegras(opcoes: OpcoesComposicaoDeRegras): RegistroDeRegras {
  const registro = new RegistroDeRegras({ quadroDeChaves: opcoes.quadroDeChaves });
  registro.registrar(
    criarProvedorNews2({ porta: opcoes.news2.porta, vetores: opcoes.news2.vetores }),
  );
  registro.registrar(
    criarProvedorGcs({
      porta: opcoes.gcs?.porta ?? portaDeBundleAusente(IDENTIDADE_GCS, MOTIVO_GCS_SEM_BUNDLE),
    }),
  );
  return registro;
}

export function despacharNews2(
  registro: RegistroDeRegras,
  insumo: InsumoNews2,
  contexto: ContextoDespacho,
): Despacho<SaidaNews2> {
  return registro.despachar<InsumoNews2, SaidaNews2>(CHAVE_NEWS2, insumo, contexto);
}

export function despacharGcs(
  registro: RegistroDeRegras,
  insumo: InsumoGcs,
  contexto: ContextoDespacho,
): Despacho<SaidaGcs> {
  return registro.despachar<InsumoGcs, SaidaGcs>(CHAVE_GCS, insumo, contexto);
}
