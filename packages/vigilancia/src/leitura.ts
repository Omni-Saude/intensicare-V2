/**
 * Leitura da vigilância sobre a persistência — o que está GRAVADO e pode ser
 * medido (`packages/persistencia/src/`).
 *
 * Duas escolhas deliberadas de projeto:
 *
 * 1. **O executor de consulta é estrutural, não um tipo importado.** Este
 *    módulo declara `ExecutorDeConsulta` com a forma mínima de que precisa; a
 *    `Transaction` de `withTenantTransaction` (`@intensicare/persistencia`) a
 *    satisfaz estruturalmente. Assim a vigilância não acopla ao driver de
 *    banco, e a fronteira de módulo de ADR-0002 continua sendo o que o
 *    `package.json` declara.
 * 2. **A janela NÃO é aplicada em SQL.** Filtrar por `raised_at` no banco
 *    descartaria silenciosamente as linhas cujo instante é ausente — que são
 *    justamente as que a vigilância precisa contar no companheiro de
 *    completude. A janela é aplicada em memória, com o instante ausente
 *    virando balde explícito.
 *
 * Toda função aqui espera rodar dentro de uma transação já escopada por
 * tenant (`withTenantTransaction`): fora desse escopo a RLS nega qualquer
 * linha, e a vigilância veria zero — que é o comportamento correto (nunca um
 * total agregado entre tenants).
 *
 * LACUNAS DE ESQUEMA que esta leitura NÃO contorna por inferência:
 * - `alerts` não carrega atribuição de versão de regra; toda leitura de alerta
 *   sai com `regra: ausente`, e `calcularCargaDeAlarmes` declara o recorte
 *   obrigatório de SM-04 como defeito de relatório. Reconstruir a versão por
 *   proximidade temporal com `evaluation_records` seria inventar atribuição.
 * - `encounters` não registra disposição de alta (vivo/óbito/transferência)
 *   nem a ORIGEM da âncora de alta. Todo episódio sai com `disposicao:
 *   ausente` e âncora de origem `desconhecida` — e KPIR-14, corretamente,
 *   não produz contagem nenhuma contra este esquema.
 */
import type { AlertaObservado, AvaliacaoObservada, OcupacaoObservada } from "./carga-de-alarmes.js";
import type { AvaliacaoParaDeriva, ObservacaoObservada } from "./deriva.js";
import type { EpisodioDeUti } from "./kpir-14.js";
import { type InstanteDeclarado, instanteAusente, instantePresente } from "./tipos.js";
import type { AvaliacaoVersionada } from "./versao-de-regra.js";

/**
 * Forma mínima de um executor de consulta. `Transaction` do PGlite
 * (via `withTenantTransaction`) a satisfaz estruturalmente.
 */
export interface ExecutorDeConsulta {
  query<T>(sql: string, params?: unknown[]): Promise<{ readonly rows: readonly T[] }>;
}

/** Uma avaliação lida serve, ao mesmo tempo, aos três módulos de cálculo. */
export interface AvaliacaoLida
  extends AvaliacaoObservada,
    AvaliacaoVersionada,
    AvaliacaoParaDeriva {}

function instanteDeColunas(
  kind: string | null,
  utc: string | null,
  motivo: string | null,
  rotuloDaColuna: string,
): InstanteDeclarado {
  if (kind === "present" && utc !== null) return instantePresente(utc);
  if (kind === "absent") {
    return instanteAusente(motivo ?? `${rotuloDaColuna}:ausente-sem-motivo-registrado`);
  }
  return instanteAusente(`${rotuloDaColuna}:forma-temporal-nao-reconhecida`);
}

// ---------------------------------------------------------------------------
// Alertas
// ---------------------------------------------------------------------------

interface LinhaDeAlerta {
  alerta_id: string;
  encontro_id: string;
  unidade_id: string | null;
  kind: string | null;
  utc: string | null;
  motivo: string | null;
  severidade: string;
}

export async function lerAlertas(tx: ExecutorDeConsulta): Promise<readonly AlertaObservado[]> {
  const resultado = await tx.query<LinhaDeAlerta>(
    `select a.id                                as alerta_id,
            a.encounter_id                      as encontro_id,
            l.care_unit_id                      as unidade_id,
            a.raised_at->>'kind'                as kind,
            a.raised_at->'instant'->>'utc'      as utc,
            a.raised_at->'absent'->>'reason'    as motivo,
            a.severity                          as severidade
       from alerts a
       join encounters e on e.tenant_id = a.tenant_id and e.id = a.encounter_id
       left join beds l on l.tenant_id = e.tenant_id and l.id = e.bed_id
      order by a.id`,
  );
  return resultado.rows.map((linha) => ({
    alertaId: linha.alerta_id,
    encontroId: linha.encontro_id,
    unidadeId: linha.unidade_id,
    instante: instanteDeColunas(linha.kind, linha.utc, linha.motivo, "alerts.raised_at"),
    severidade: linha.severidade,
    regra: {
      tipo: "ausente" as const,
      motivo: "alerta-nao-carrega-atribuicao-de-versao-de-regra-no-esquema-atual",
    },
  }));
}

// ---------------------------------------------------------------------------
// Ocupação (encontros)
// ---------------------------------------------------------------------------

interface LinhaDeEncontro {
  encontro_id: string;
  paciente_ref: string;
  unidade_id: string | null;
  adm_kind: string | null;
  adm_utc: string | null;
  adm_motivo: string | null;
  alta_kind: string | null;
  alta_utc: string | null;
  alta_motivo: string | null;
}

const SQL_ENCONTROS = `select e.id                                 as encontro_id,
        p.subject_ref                        as paciente_ref,
        l.care_unit_id                       as unidade_id,
        e.admitted_at->>'kind'               as adm_kind,
        e.admitted_at->'instant'->>'utc'     as adm_utc,
        e.admitted_at->'absent'->>'reason'   as adm_motivo,
        e.discharged_at->>'kind'             as alta_kind,
        e.discharged_at->'instant'->>'utc'   as alta_utc,
        e.discharged_at->'absent'->>'reason' as alta_motivo
   from encounters e
   join patient_identities p on p.tenant_id = e.tenant_id and p.id = e.patient_id
   left join beds l on l.tenant_id = e.tenant_id and l.id = e.bed_id
  order by e.id`;

export async function lerOcupacoes(tx: ExecutorDeConsulta): Promise<readonly OcupacaoObservada[]> {
  const resultado = await tx.query<LinhaDeEncontro>(SQL_ENCONTROS);
  return resultado.rows.map((linha) => ({
    encontroId: linha.encontro_id,
    unidadeId: linha.unidade_id,
    admissao: instanteDeColunas(
      linha.adm_kind,
      linha.adm_utc,
      linha.adm_motivo,
      "encounters.admitted_at",
    ),
    fim:
      linha.alta_kind === "present" && linha.alta_utc !== null
        ? { tipo: "alta" as const, utc: linha.alta_utc }
        : linha.alta_kind === null
          ? // `discharged_at` NULL = sem alta registrada = ainda internado.
            { tipo: "em_curso" as const }
          : {
              tipo: "ausente" as const,
              motivo:
                linha.alta_motivo ?? "encounters.discharged_at:forma-temporal-nao-reconhecida",
            },
  }));
}

// ---------------------------------------------------------------------------
// Avaliações
// ---------------------------------------------------------------------------

interface LinhaDeAvaliacao {
  avaliacao_id: string;
  encontro_id: string;
  status: string;
  kind: string | null;
  utc: string | null;
  motivo: string | null;
  rule_id: string | null;
  rule_version: string | null;
}

export async function lerAvaliacoes(tx: ExecutorDeConsulta): Promise<readonly AvaliacaoLida[]> {
  const resultado = await tx.query<LinhaDeAvaliacao>(
    `select r.id                                as avaliacao_id,
            r.encounter_id                      as encontro_id,
            r.status                            as status,
            r.evaluated_at->>'kind'             as kind,
            r.evaluated_at->'instant'->>'utc'   as utc,
            r.evaluated_at->'absent'->>'reason' as motivo,
            r.kernel_record->>'ruleId'          as rule_id,
            r.kernel_record->>'ruleVersion'     as rule_version
       from evaluation_records r
      order by r.seq`,
  );
  return resultado.rows.map((linha) => ({
    avaliacaoId: linha.avaliacao_id,
    encontroId: linha.encontro_id,
    instante: instanteDeColunas(
      linha.kind,
      linha.utc,
      linha.motivo,
      "evaluation_records.evaluated_at",
    ),
    estadoBruto: linha.status,
    regra:
      linha.rule_id !== null && linha.rule_version !== null
        ? { tipo: "declarada" as const, ruleId: linha.rule_id, ruleVersion: linha.rule_version }
        : {
            tipo: "ausente" as const,
            motivo: "kernel_record-sem-ruleId-ou-ruleVersion",
          },
  }));
}

// ---------------------------------------------------------------------------
// Observações (insumos)
// ---------------------------------------------------------------------------

interface LinhaDeObservacao {
  observacao_id: string;
  encontro_id: string;
  conceito: string;
  qualidade: string;
  unidade_canonica: string | null;
  clin_kind: string | null;
  clin_utc: string | null;
  clin_motivo: string | null;
  rec_kind: string | null;
  rec_utc: string | null;
  rec_motivo: string | null;
}

export async function lerObservacoes(
  tx: ExecutorDeConsulta,
): Promise<readonly ObservacaoObservada[]> {
  const resultado = await tx.query<LinhaDeObservacao>(
    `select o.id                                as observacao_id,
            o.encounter_id                      as encontro_id,
            o.concept                           as conceito,
            o.quality                           as qualidade,
            o.canonical_unit                    as unidade_canonica,
            o.effective_at->>'kind'             as clin_kind,
            o.effective_at->'instant'->>'utc'   as clin_utc,
            o.effective_at->'absent'->>'reason' as clin_motivo,
            o.received_at->>'kind'              as rec_kind,
            o.received_at->'instant'->>'utc'    as rec_utc,
            o.received_at->'absent'->>'reason'  as rec_motivo
       from clinical_observations o
      order by o.id`,
  );
  return resultado.rows.map((linha) => ({
    observacaoId: linha.observacao_id,
    encontroId: linha.encontro_id,
    conceito: linha.conceito,
    qualidade: linha.qualidade,
    unidadeCanonica: linha.unidade_canonica,
    tempoClinico: instanteDeColunas(
      linha.clin_kind,
      linha.clin_utc,
      linha.clin_motivo,
      "clinical_observations.effective_at",
    ),
    instanteDeJanela: instanteDeColunas(
      linha.rec_kind,
      linha.rec_utc,
      linha.rec_motivo,
      "clinical_observations.received_at",
    ),
  }));
}

// ---------------------------------------------------------------------------
// Episódios de UTI (KPIR-14)
// ---------------------------------------------------------------------------

/**
 * Motivo único e literal da lacuna de esquema para KPIR-14. Exportado para
 * que o teste possa afirmar a lacuna pelo nome, em vez de por uma substring
 * frágil.
 */
export const MOTIVO_DISPOSICAO_NAO_REGISTRADA =
  "esquema-de-persistencia-nao-registra-disposicao-de-alta-viva-obito-ou-transferencia" as const;

/**
 * Lê episódios de UTI a partir de `encounters`. O esquema atual NÃO registra
 * disposição de alta nem origem da âncora: cada episódio sai, portanto, com
 * `disposicao: ausente` e âncora de origem `desconhecida`. A consequência é
 * intencional e correta — KPIR-14 computado sobre esta leitura devolve
 * `DC(KPIR-14)` = 100% e contagem zero em toda variante, em vez de um número
 * fabricado a partir de dado que não existe.
 */
export async function lerEpisodiosDeUti(tx: ExecutorDeConsulta): Promise<readonly EpisodioDeUti[]> {
  const resultado = await tx.query<LinhaDeEncontro>(SQL_ENCONTROS);
  return resultado.rows.map((linha) => ({
    episodioId: linha.encontro_id,
    pacienteRef: linha.paciente_ref,
    unidadeId: linha.unidade_id,
    admissaoUtc: linha.adm_kind === "present" ? linha.adm_utc : null,
    ancoraDeAlta:
      linha.alta_kind === "present" && linha.alta_utc !== null
        ? { tipo: "presente" as const, utc: linha.alta_utc, origem: "desconhecida" as const }
        : {
            tipo: "ausente" as const,
            motivo: linha.alta_motivo ?? "encounters.discharged_at-nulo-ou-forma-nao-reconhecida",
          },
    disposicao: { tipo: "ausente" as const, motivo: MOTIVO_DISPOSICAO_NAO_REGISTRADA },
  }));
}
