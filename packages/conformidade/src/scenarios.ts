/**
 * Os 22 cenários CTS-01..CTS-22 de
 * `docs/08-interoperability/conformance/contract-v1/cenarios-teste-consumidor.md`
 * transformados de especificação em texto em SUÍTE EXECUTÁVEL contra as
 * fixtures pinadas do repositório.
 *
 * O que NÃO foi feito aqui, de propósito
 * --------------------------------------
 * - Nenhuma fixture nova foi criada. Cenário cuja fixture o §5 do harness
 *   lista como ausente é reportado `nao-executavel` com a causa — jamais
 *   satisfeito com um envelope AMH fabricado por nós.
 * - Nenhum emulador da AMH foi escrito. `cenarios-teste-consumidor.md` §1
 *   é explícito: um emulador escrito pela V2 a partir da minuta da V2
 *   executaria V2 contra V2 e "todos os cenários passariam", provando
 *   apenas consistência interna.
 * - Nenhum cenário foi forçado a verde. Variações de ENTREGA (duplicar,
 *   atrasar, inverter ordem, entregar em lote) são técnica sancionada pelo
 *   próprio harness (CTS-02, CTS-04, CTS-05, CTS-12) e não fabricam
 *   payload algum: o envelope entregue é byte a byte a fixture pinada.
 */
import {
  AnticorruptionLayer,
  type ConsumptionContext,
  type DeliveryOutcome,
  MAPPING_VERSION,
  type Scope,
} from "./anticorruption-layer.js";
import { parseEnvelope, requiredString } from "./envelope.js";
import {
  blocked,
  type CheckResult,
  check,
  coverageOf,
  type ScenarioLimitation,
  type ScenarioMetadata,
  type ScenarioResult,
  verdictOf,
} from "./harness.js";
import { fixtureByName, type PinnedFixtureSet } from "./pinned-fixtures.js";
import { formatReason } from "./quarantine.js";
import { meshFingerprint, projectMesh, resolveLocal } from "./ref-mesh.js";

/** Escopo sintético das fixtures pinadas — nenhum tenant real é citado. */
export const SYNTHETIC_SCOPE: Scope = {
  amhTenant: "SYNTH-TENANT-A",
  legalEntity: "SYNTH-LE-00000001",
};

export const DEFAULT_CONTEXT: ConsumptionContext = {
  purpose: "tratamento",
  authorizedScopes: [SYNTHETIC_SCOPE],
  legalBasisSource: "contrato-de-tratamento",
};

/**
 * Atraso de transporte usado quando o cenário não especifica outro.
 * PREMISSA (reversível, GDEC-0015/0017): 1 s é PARÂMETRO DO HARNESS para
 * que o instante de recebimento (gerado pela V2) seja distinto do instante
 * de emissão (da fonte) e a confusão entre os dois seja detectável. Não é
 * latência declarada nem medida da AMH.
 */
const DEFAULT_TRANSPORT_DELAY_MS = 1_000;

const HOUR_MS = 3_600_000;

interface DeliveryPlan {
  readonly fileName: string;
  readonly delayMs?: number;
  /** Instante de recebimento fixo (usado no lote histórico do backfill). */
  readonly receivedAtUtc?: string;
}

interface HarnessContext {
  readonly fixtures: PinnedFixtureSet;
}

function rawOf(context: HarnessContext, fileName: string): string {
  return fixtureByName(context.fixtures, fileName).raw;
}

function fieldOf(context: HarnessContext, fileName: string, field: string): string {
  const value = requiredString(parseEnvelope(rawOf(context, fileName)), field);
  if (value === undefined) {
    throw new Error(
      `Fixture pinada "${fileName}" não carrega "${field}" como string — ` +
        `o harness não substitui campo ausente por valor inventado.`,
    );
  }
  return value;
}

function newLayer(options?: {
  readonly context?: ConsumptionContext;
  readonly laneDelayThresholdMs?: number;
  readonly durableJournalFails?: boolean;
}): AnticorruptionLayer {
  return new AnticorruptionLayer({
    context: options?.context ?? DEFAULT_CONTEXT,
    ...(options?.laneDelayThresholdMs === undefined
      ? {}
      : { laneDelayThresholdMs: options.laneDelayThresholdMs }),
    ...(options?.durableJournalFails === undefined
      ? {}
      : { durableJournalFails: options.durableJournalFails }),
  });
}

/** Entrega envelopes pinados; o instante de recebimento é gerado pela V2. */
function deliverAll(
  layer: AnticorruptionLayer,
  context: HarnessContext,
  plans: readonly DeliveryPlan[],
): readonly DeliveryOutcome[] {
  return plans.map((plan) => {
    const raw = rawOf(context, plan.fileName);
    const emittedAt = fieldOf(context, plan.fileName, "emitted_at");
    const receivedAtUtc =
      plan.receivedAtUtc ??
      new Date(Date.parse(emittedAt) + (plan.delayMs ?? DEFAULT_TRANSPORT_DELAY_MS)).toISOString();
    return layer.deliver({ raw, receivedAtUtc });
  });
}

function outcomeKinds(outcomes: readonly DeliveryOutcome[]): string {
  return outcomes.map((o) => o.kind).join(", ");
}

function quarantineTokenOf(outcome: DeliveryOutcome | undefined): string {
  return outcome !== undefined && outcome.kind === "quarentenado"
    ? formatReason(outcome.reason)
    : `<nenhuma quarentena: veredito de entrega foi "${outcome?.kind ?? "ausente"}">`;
}

const VALID_FIXTURES_CHRONOLOGICAL = [
  "alias.valid.json",
  "merge.valid.json",
  "unmerge.valid.json",
  "erasure.valid.json",
  "restore.valid.json",
  "reassignment.valid.json",
] as const;

interface ScenarioDefinition extends ScenarioMetadata {
  readonly run: (context: HarnessContext) => {
    readonly checks: readonly CheckResult[];
    readonly limitations: readonly ScenarioLimitation[];
  };
}

const AMH_LIMITATION: ScenarioLimitation = {
  cause: "amh-indisponivel",
  statement:
    "nada aqui evidencia o que a AMH EMITE ou IMPEDE: o produtor não foi exercitado, " +
    "nenhum ambiente foi alcançado e nenhum dado real foi acessado.",
};

export const SCENARIOS: readonly ScenarioDefinition[] = [
  // ---------------------------------------------------------------------
  {
    id: "CTS-01",
    title: "Linha de base: evento válido é aplicado com proveniência completa",
    interfaces: ["IF-01"],
    fixtures: ["alias.valid.json"],
    requirement: "linha de base do envelope (§7.6)",
    hazards: ["HAZ-0012", "DOM-0002"],
    run: (context) => {
      const layer = newLayer();
      const [outcome] = deliverAll(layer, context, [{ fileName: "alias.valid.json" }]);
      const durabilityLayer = newLayer({ durableJournalFails: true });
      const [failedOutcome] = deliverAll(durabilityLayer, context, [
        { fileName: "alias.valid.json" },
      ]);
      const occurredAt = fieldOf(context, "alias.valid.json", "occurred_at");
      const provenance = layer.provenance[0];

      return {
        checks: [
          check(
            "CTS-01.C1",
            "o envelope é persistido imutável ANTES de qualquer reconhecimento (HAZ-0012)",
            layer.journal.length === 1 &&
              layer.journal[0]?.sha256 ===
                fixtureByName(context.fixtures, "alias.valid.json").sha256 &&
              failedOutcome?.kind === "nao-durabilizado" &&
              failedOutcome.acknowledged === false &&
              durabilityLayer.journal.length === 0,
            `journal=${layer.journal.length} entrada(s), sha256 idêntico ao da fixture pinada; ` +
              `com journal durável falhando: veredito="${failedOutcome?.kind}", ` +
              `acknowledged=${String(failedOutcome?.acknowledged)}, journal=${durabilityLayer.journal.length}`,
          ),
          check(
            "CTS-01.C2",
            "a transição é aplicada com `occurred_at` como tempo do fato (nunca 'agora')",
            outcome?.kind === "aplicado" && outcome.transition.occurredAtUtc === occurredAt,
            `veredito="${outcome?.kind}"; occurred_at aplicado=` +
              `${outcome?.kind === "aplicado" ? outcome.transition.occurredAtUtc : "n/d"}; ` +
              `occurred_at da fixture=${occurredAt}`,
          ),
          check(
            "CTS-01.C3",
            "a proveniência registra event_id, idempotency_key, versão de contrato, versão de " +
              "mapeamento e `quality: unknown` explícito (perda L-02)",
            provenance !== undefined &&
              provenance.eventId.length > 0 &&
              provenance.idempotencyKey.length > 0 &&
              provenance.contractEventTypeVersion === "1" &&
              provenance.mappingVersion === MAPPING_VERSION &&
              provenance.sourceQuality === "unknown" &&
              provenance.pinnedContractManifestDigest === null &&
              provenance.receivedAtUtc !== provenance.emittedAtUtc,
            provenance === undefined
              ? "nenhuma proveniência foi produzida"
              : `event_id=${provenance.eventId}; contrato v${provenance.contractEventTypeVersion}; ` +
                  `mapeamento=${provenance.mappingVersion}; quality=${provenance.sourceQuality}; ` +
                  `digest de manifesto pinado=null (nenhum manifesto publicado); ` +
                  `tempos de fonte e de pipeline em campos distintos ` +
                  `(emitted=${provenance.emittedAtUtc}, received=${provenance.receivedAtUtc})`,
          ),
          check(
            "CTS-01.C4",
            "nenhum fato clínico passado é re-chaveado",
            layer.mesh().refs.length === 2 &&
              layer.provenance[0]?.derivedScopeRule.includes("L-03") === true,
            `a projeção contém ${layer.mesh().refs.length} ref(s) e NENHUM fato clínico — ` +
              `a camada não conhece fato clínico, logo re-chavear é impossível por construção; ` +
              `alcance derivado declarado na proveniência (perda L-03)`,
          ),
        ],
        limitations: [AMH_LIMITATION],
      };
    },
  },
  // ---------------------------------------------------------------------
  {
    id: "CTS-02",
    title: "Duplicata: redelivery exata não altera o estado",
    interfaces: ["IF-01..IF-06"],
    fixtures: ["alias.valid.json (entregue duas vezes)"],
    requirement: "duplicate (§7.6)",
    hazards: ["HAZ-0009"],
    run: (context) => {
      const baseline = newLayer();
      deliverAll(baseline, context, [{ fileName: "alias.valid.json" }]);

      const layer = newLayer();
      const outcomes = deliverAll(layer, context, [
        { fileName: "alias.valid.json" },
        { fileName: "alias.valid.json" },
      ]);

      // A chave é a DO CONTRATO: dois eventos que compartilham as MESMAS
      // refs mas têm `idempotency_key` distintas NÃO são deduplicados.
      const sharedRefsLayer = newLayer();
      const sharedOutcomes = deliverAll(sharedRefsLayer, context, [
        { fileName: "merge.valid.json" },
        { fileName: "unmerge.valid.json" },
      ]);

      const duplicatedFold = projectMesh([...layer.transitions, ...layer.transitions]);

      return {
        checks: [
          check(
            "CTS-02.C1",
            "a segunda entrega é deduplicada",
            outcomes[0]?.kind === "aplicado" && outcomes[1]?.kind === "deduplicado",
            `vereditos: ${outcomeKinds(outcomes)}`,
          ),
          check(
            "CTS-02.C2",
            "o estado da malha é idêntico ao de CTS-01",
            meshFingerprint(layer.mesh()) === meshFingerprint(baseline.mesh()),
            "impressão da malha após a redelivery é idêntica à da entrega única",
          ),
          check(
            "CTS-02.C3",
            "a duplicata é contada como operação normal, não como incidente",
            layer.quarantine.length === 0,
            `quarentena=${layer.quarantine.length} entrada(s) após a redelivery`,
          ),
          check(
            "CTS-02.C4",
            "idempotência de EFEITO como segunda defesa: aplicar a mesma transição duas vezes " +
              "produziria o mesmo estado",
            meshFingerprint(duplicatedFold) === meshFingerprint(layer.mesh()),
            "dobra da projeção sobre a lista de transições duplicada produz a mesma malha",
          ),
          check(
            "CTS-02.C5",
            "a chave usada é a DO CONTRATO, jamais derivada de dado do paciente",
            sharedOutcomes.every((o) => o.kind === "aplicado") &&
              sharedRefsLayer.transitions.length === 2,
            `merge e unmerge compartilham as mesmas refs e chaves de idempotência distintas: ` +
              `vereditos ${outcomeKinds(sharedOutcomes)} — nenhum foi deduplicado, logo a chave ` +
              `não é derivada do sujeito (HAZ-0009)`,
          ),
        ],
        limitations: [AMH_LIMITATION],
      };
    },
  },
  // ---------------------------------------------------------------------
  {
    id: "CTS-03",
    title: "`idempotency_key` igual em tenant distinto não é duplicata",
    interfaces: ["IF-01..IF-06"],
    fixtures: ["alias.valid.json + variante com `amh_tenant` distinto [FIXTURE AUSENTE F-1]"],
    requirement: "duplicate (§7.6)",
    hazards: ["HAZ-0013", "HAZ-0012"],
    run: () => ({
      checks: [
        blocked(
          "CTS-03.C1",
          "dois eventos com a mesma `idempotency_key` em escopos distintos são AMBOS aplicados",
          "fixture-ausente",
          "a fixture F-1 (mesma chave em tenant distinto) não existe no pacote de contrato; " +
            "fabricá-la seria inventar um evento da AMH para fazer o cenário passar. " +
            "OBSERVADO no código: a chave de dedup implementada é " +
            "`{amh_tenant, legal_entity, idempotency_key}` — mas isso é asserção sobre a V2, " +
            "não execução deste cenário, que exige o par de eventos que a fixture forneceria.",
        ),
      ],
      limitations: [AMH_LIMITATION],
    }),
  },
  // ---------------------------------------------------------------------
  {
    id: "CTS-04",
    title: "Atraso: chegada tardia é degradação visível, não silêncio",
    interfaces: ["IF-01..IF-06"],
    fixtures: ["merge.valid.json (entrega retardada)"],
    requirement: "delay (§7.6)",
    hazards: ["HAZ-0010", "HAZ-0017", "HAZ-0025", "DOM-0007"],
    run: (context) => {
      const delayMs = 6 * HOUR_MS;
      const layer = newLayer({ laneDelayThresholdMs: 60_000 });
      const [outcome] = deliverAll(layer, context, [{ fileName: "merge.valid.json", delayMs }]);
      const occurredAt = fieldOf(context, "merge.valid.json", "occurred_at");
      const health = layer.laneHealth();

      return {
        checks: [
          check(
            "CTS-04.C1",
            "o evento é aplicado na sua posição por `occurred_at` (nunca 'agora')",
            outcome?.kind === "aplicado" &&
              outcome.transition.occurredAtUtc === occurredAt &&
              outcome.provenance.receivedAtUtc !== occurredAt,
            `occurred_at aplicado=${outcome?.kind === "aplicado" ? outcome.transition.occurredAtUtc : "n/d"}; ` +
              `recebido em ${outcome?.kind === "aplicado" ? outcome.provenance.receivedAtUtc : "n/d"} ` +
              `(${delayMs / HOUR_MS} h depois) — o instante de recebimento não entrou na ordenação`,
          ),
          check(
            "CTS-04.C2",
            "a idade e o atraso da lane são expostos como sinal operacional",
            health.maxObservedDelayMs === delayMs,
            `atraso máximo observado=${health.maxObservedDelayMs} ms (limiar do harness=${health.thresholdMs} ms; ` +
              `${health.thresholdProvenance})`,
          ),
          check(
            "CTS-04.C3",
            "a saúde da lane NÃO é reportada como normal enquanto o atraso persistir",
            health.status === "degradada",
            `estado da lane="${health.status}"`,
          ),
        ],
        limitations: [
          AMH_LIMITATION,
          {
            cause: "amh-indisponivel",
            statement:
              "medir latência REAL é camada 4 e exige o produtor; o limiar usado é parâmetro do " +
              "harness porque a AMH não declarou latência (OS-17 crit. 3, VALIDATION_REQUIRED).",
          },
        ],
      };
    },
  },
  // ---------------------------------------------------------------------
  {
    id: "CTS-05",
    title: "Fora de ordem: evento antigo após evento novo não regride estado",
    interfaces: ["IF-01..IF-06"],
    fixtures: ["alias.valid.json", "merge.valid.json", "unmerge.valid.json"],
    requirement: "out-of-order (§7.6)",
    hazards: ["HAZ-0011", "DOM-0006"],
    run: (context) => {
      const chronological = newLayer();
      deliverAll(chronological, context, [
        { fileName: "alias.valid.json" },
        { fileName: "merge.valid.json" },
      ]);
      const inverted = newLayer();
      deliverAll(inverted, context, [
        { fileName: "merge.valid.json" },
        { fileName: "alias.valid.json" },
      ]);

      // Par do MESMO sujeito (merge e unmerge operam sobre bbbb0001/bbbb0002).
      const sameSubjectChrono = newLayer();
      deliverAll(sameSubjectChrono, context, [
        { fileName: "merge.valid.json" },
        { fileName: "unmerge.valid.json" },
      ]);
      const sameSubjectInverted = newLayer();
      deliverAll(sameSubjectInverted, context, [
        { fileName: "unmerge.valid.json" },
        { fileName: "merge.valid.json" },
      ]);

      const mergeOccurredAt = fieldOf(context, "merge.valid.json", "occurred_at");
      const historicView = sameSubjectInverted.mesh(mergeOccurredAt);
      const replay = projectMesh(inverted.transitions);

      return {
        checks: [
          check(
            "CTS-05.C1",
            "a projeção é reconstruída incluindo t1 na sua posição; o estado final é idêntico ao " +
              "da ordem cronológica",
            meshFingerprint(inverted.mesh()) === meshFingerprint(chronological.mesh()),
            "entrega invertida (merge → alias) produz impressão de malha idêntica à cronológica",
          ),
          check(
            "CTS-05.C2",
            "nenhum valor mais novo é sobrescrito por um mais velho (par do MESMO sujeito)",
            meshFingerprint(sameSubjectInverted.mesh()) ===
              meshFingerprint(sameSubjectChrono.mesh()),
            "entrega invertida do par merge/unmerge (mesmas refs) converge para a mesma malha; " +
              `o unmerge chegado antes ficou em retenção pendente até o alvo de correction_of chegar ` +
              `(pendentes agora=${sameSubjectInverted.pending.length})`,
          ),
          check(
            "CTS-05.C3",
            "a visão histórica anterior ao carimbo continua enxergando a aresta como vigente",
            historicView.effectiveTransitions.length === 1 &&
              historicView.effectiveTransitions[0]?.eventType === "identity.merge.v1",
            `malha em as_of=${mergeOccurredAt} tem ${historicView.effectiveTransitions.length} ` +
              `aresta vigente do tipo ${historicView.effectiveTransitions[0]?.eventType ?? "n/d"}`,
          ),
          check(
            "CTS-05.C4",
            "o resultado é idêntico ao de um replay completo",
            meshFingerprint(replay) === meshFingerprint(inverted.mesh()),
            "replay da lista de transições retidas reproduz a malha corrente byte a byte",
          ),
        ],
        limitations: [
          AMH_LIMITATION,
          {
            cause: "amh-indisponivel",
            statement:
              "as duas fixtures que o cenário nomeia (alias e merge) são de SUJEITOS DISTINTOS; " +
              "a cláusula 'mesmo sujeito' foi exercitada com o par merge/unmerge, também pinado.",
          },
        ],
      };
    },
  },
  // ---------------------------------------------------------------------
  {
    id: "CTS-06",
    title: "Empate total de tempos: fail-closed em vez de escolha arbitrária",
    interfaces: ["IF-01..IF-06"],
    fixtures: ["dois eventos com `occurred_at` E `emitted_at` idênticos [FIXTURE AUSENTE F-2]"],
    requirement: "out-of-order (§7.6)",
    hazards: ["HAZ-0011", "DOM-0004"],
    run: () => ({
      checks: [
        blocked(
          "CTS-06.C1",
          "o par empatado é quarentenado com alarme; nenhuma ordem é escolhida arbitrariamente",
          "fixture-ausente",
          "a fixture F-2 (empate de `occurred_at` E `emitted_at` no mesmo sujeito) não existe. " +
            "Ela expõe a lacuna CONF-Q-12 do contrato (o desempate declarado é 'ordem de emissão " +
            "do produtor', que o envelope não carrega) — inventá-la aqui esconderia a lacuna " +
            "em vez de registrá-la.",
        ),
      ],
      limitations: [AMH_LIMITATION],
    }),
  },
  // ---------------------------------------------------------------------
  {
    id: "CTS-07",
    title: "Evento inválido: sem chave de idempotência",
    interfaces: ["IF-01"],
    fixtures: ["alias.missing-idempotency-key.invalid.json"],
    requirement: "evento inválido (§7.6)",
    hazards: ["HAZ-0009", "DOM-0004"],
    run: (context) => {
      const layer = newLayer();
      const [outcome] = deliverAll(layer, context, [
        { fileName: "alias.missing-idempotency-key.invalid.json" },
      ]);
      const fixture = fixtureByName(context.fixtures, "alias.missing-idempotency-key.invalid.json");

      return {
        checks: [
          check(
            "CTS-07.C1",
            "a mensagem é quarentenada com a razão correta (invariante 2)",
            outcome?.kind === "quarentenado" && outcome.reason.token === "missing_idempotency_key",
            `razão registrada: ${quarantineTokenOf(outcome)}`,
          ),
          check(
            "CTS-07.C2",
            "a mensagem NÃO é aplicada",
            layer.transitions.length === 0,
            `transições aplicadas=${layer.transitions.length}`,
          ),
          check(
            "CTS-07.C3",
            "a mensagem NÃO é descartada e o envelope íntegro é retido",
            layer.journal.length === 1 && layer.journal[0]?.sha256 === fixture.sha256,
            `envelope retido com sha256 idêntico ao da fixture pinada (${fixture.sha256.slice(0, 12)}…)`,
          ),
          check(
            "CTS-07.C4",
            "a contagem de quarentena sobe e é visível",
            layer.quarantine.length === 1 &&
              (layer.quarantineCountsByToken().missing_idempotency_key ?? 0) === 1,
            `contagem por razão: ${JSON.stringify(layer.quarantineCounts())}; ` +
              `por token: ${JSON.stringify(layer.quarantineCountsByToken())}`,
          ),
        ],
        limitations: [AMH_LIMITATION],
      };
    },
  },
  // ---------------------------------------------------------------------
  {
    id: "CTS-08",
    title: "Evento inválido: `merge` com ref nova igual à antiga",
    interfaces: ["IF-02"],
    fixtures: ["merge.ref-nova-igual-antiga.invalid.json"],
    requirement: "evento inválido (§7.6)",
    hazards: ["HAZ-0027"],
    run: (context) => {
      const layer = newLayer();
      const [outcome] = deliverAll(layer, context, [
        { fileName: "merge.ref-nova-igual-antiga.invalid.json" },
      ]);
      return {
        checks: [
          check(
            "CTS-08.C1",
            "a mensagem é quarentenada (invariante 3) e alarmada",
            outcome?.kind === "quarentenado" && outcome.reason.token === "merge_refs_identical",
            `razão registrada: ${quarantineTokenOf(outcome)}`,
          ),
          check(
            "CTS-08.C2",
            "evento sem efeito é defeito do produtor, jamais no-op silenciosamente absorvido",
            layer.transitions.length === 0 && layer.quarantine.length === 1,
            `transições=${layer.transitions.length}; quarentena=${layer.quarantine.length} ` +
              "(absorver em silêncio produziria 0 e 0)",
          ),
        ],
        limitations: [AMH_LIMITATION],
      };
    },
  },
  // ---------------------------------------------------------------------
  {
    id: "CTS-09",
    title: "Evento inválido: emissão anterior ao fato",
    interfaces: ["IF-03"],
    fixtures: ["unmerge.emissao-antes-do-fato.invalid.json"],
    requirement: "evento inválido (§7.6)",
    hazards: ["HAZ-0026"],
    run: (context) => {
      const layer = newLayer();
      const [outcome] = deliverAll(layer, context, [
        { fileName: "unmerge.emissao-antes-do-fato.invalid.json" },
      ]);
      const raw = rawOf(context, "unmerge.emissao-antes-do-fato.invalid.json");
      const journaled = layer.journal[0]?.raw;
      // Observação de contraste: a MESMA camada, com a fixture de campo
      // ausente, produz outro token — a distinção é observada, não afirmada.
      const contrastLayer = newLayer();
      const [missingFieldOutcome] = deliverAll(contrastLayer, context, [
        { fileName: "alias.missing-idempotency-key.invalid.json" },
      ]);

      return {
        checks: [
          check(
            "CTS-09.C1",
            "a mensagem é quarentenada (invariante 4)",
            outcome?.kind === "quarentenado" && outcome.reason.token === "emitted_before_occurred",
            `razão registrada: ${quarantineTokenOf(outcome)}`,
          ),
          check(
            "CTS-09.C2",
            "jamais se 'corrige' invertendo campos nem se substitui tempo algum",
            journaled === raw && layer.transitions.length === 0,
            "envelope retido byte a byte idêntico à fixture; nenhuma transição aplicada",
          ),
          check(
            "CTS-09.C3",
            "a razão distingue TEMPO IMPLAUSÍVEL de CAMPO AUSENTE",
            quarantineTokenOf(outcome) !== quarantineTokenOf(missingFieldOutcome),
            `tempo implausível ⇒ "${quarantineTokenOf(outcome)}"; campo ausente ⇒ ` +
              `"${quarantineTokenOf(missingFieldOutcome)}" — tokens observados são distintos ` +
              "(ADR-0008 N5: tempo implausível ⇒ quarentena, com razão própria)",
          ),
        ],
        limitations: [AMH_LIMITATION],
      };
    },
  },
  // ---------------------------------------------------------------------
  {
    id: "CTS-10",
    title: "Correção e supersessão, incluindo referência pendente",
    interfaces: ["IF-04"],
    fixtures: ["erasure.valid.json", "restore.valid.json"],
    requirement: "correction (§7.6)",
    hazards: ["HAZ-0008", "HAZ-0022"],
    run: (context) => {
      const layer = newLayer();
      deliverAll(layer, context, [
        { fileName: "erasure.valid.json" },
        { fileName: "restore.valid.json" },
      ]);
      const erasureEventId = fieldOf(context, "erasure.valid.json", "event_id");
      const erasureOccurredAt = fieldOf(context, "erasure.valid.json", "occurred_at");
      const restoreOccurredAt = fieldOf(context, "restore.valid.json", "occurred_at");
      const erasureRef = fieldOf(context, "erasure.valid.json", "subject_ref_antiga");

      const between = layer.mesh(`${restoreOccurredAt.slice(0, 10)}T13:00:00Z`);
      const after = layer.mesh();
      const resolutionBetween = resolveLocal(between, erasureRef);
      const resolutionAfter = resolveLocal(after, erasureRef);

      // Referência pendente: o `restore` sozinho aponta um `correction_of`
      // que o consumidor nunca viu.
      const pendingLayer = newLayer();
      const [pendingOutcome] = deliverAll(pendingLayer, context, [
        { fileName: "restore.valid.json" },
      ]);
      const overdue = pendingLayer.markOverduePendingUnderReview(
        new Date(Date.parse(restoreOccurredAt) + 48 * HOUR_MS).toISOString(),
        24 * HOUR_MS,
      );

      return {
        checks: [
          check(
            "CTS-10.C1",
            "o evento corrigido permanece recuperável (nada é sobrescrito nem apagado)",
            layer.journal.length === 2 &&
              after.revokedTransitions.some((t) => t.eventId === erasureEventId),
            `journal retém ${layer.journal.length} envelopes; o evento ${erasureEventId} aparece ` +
              "como REVOGADO na projeção — visível, não removido",
          ),
          check(
            "CTS-10.C2",
            "a relação de correção é explícita e datada",
            after.revocationTransitions.some(
              (t) => t.correctionOf === erasureEventId && t.occurredAtUtc === restoreOccurredAt,
            ),
            `revogação carimbada em ${restoreOccurredAt}, apontando ${erasureEventId} ` +
              `(fato original em ${erasureOccurredAt})`,
          ),
          check(
            "CTS-10.C3",
            "o passado não é reescrito: o replay anterior ao carimbo enxerga o estado anterior",
            resolutionBetween.kind === "retired" && resolutionAfter.kind === "resolvida",
            `resolução do consumidor entre erasure e restore="${resolutionBetween.kind}"; ` +
              `depois do restore="${resolutionAfter.kind}"`,
          ),
          check(
            "CTS-10.C4",
            "`correction_of` apontando evento nunca visto fica em retenção pendente, NÃO aplicado",
            pendingOutcome?.kind === "retencao-pendente" && pendingLayer.transitions.length === 0,
            `veredito="${pendingOutcome?.kind}"; transições aplicadas=${pendingLayer.transitions.length}`,
          ),
          check(
            "CTS-10.C5",
            "se não resolver, o sujeito é marcado como identidade em revisão",
            overdue.length === 1 && pendingLayer.subjectsUnderReview.length === 1,
            `retenções vencidas=${overdue.length}; sujeitos em revisão=${pendingLayer.subjectsUnderReview.length}`,
          ),
        ],
        limitations: [
          AMH_LIMITATION,
          {
            cause: "fixture-ausente",
            statement:
              "a fixture F-3 (`correction_of` apontando evento INEXISTENTE) não existe; a condição " +
              "foi produzida por ORDEM DE ENTREGA (restore antes de erasure). O consumidor não " +
              "consegue distinguir 'nunca existirá' de 'ainda não chegou' — não há número de " +
              "sequência nem marca d'água (§7.3 da matriz de erro), e essa indistinção é o achado.",
          },
          {
            cause: "fora-do-escopo-deste-pacote",
            statement:
              "a cláusula 'dispara nova avaliação, a anterior é marcada como superada e os alertas " +
              "são reconciliados' não foi executada: não existe avaliação clínica implementada " +
              "(kernel-clinico sem regra; 0 vias acionáveis) e a reconciliação vive na máquina de " +
              "estados do ADR-0009 (apps/api). Registrado como pendência, não como satisfeito.",
          },
        ],
      };
    },
  },
  // ---------------------------------------------------------------------
  {
    id: "CTS-11",
    title: "Merge/unmerge com replay: equivalência malha ⇔ `resolve`",
    interfaces: ["IF-02", "IF-03", "IF-07"],
    fixtures: ["merge.valid.json", "unmerge.valid.json", "restore.valid.json"],
    requirement: "merge/unmerge com replay (§7.6)",
    hazards: ["HAZ-0027", "DOM-0002", "DOM-0003"],
    run: (context) => {
      // O replay LOCAL é executado e reportado como EVIDÊNCIA — não como
      // aprovação: a cláusula do cenário é a equivalência com IF-07.
      const layer = newLayer();
      deliverAll(
        layer,
        context,
        VALID_FIXTURES_CHRONOLOGICAL.map((fileName) => ({ fileName })),
      );
      const first = meshFingerprint(projectMesh(layer.transitions));
      const second = meshFingerprint(projectMesh([...layer.transitions].reverse()));

      return {
        checks: [
          blocked(
            "CTS-11.C1",
            "para todo `t`, o estado derivado dos eventos com `occurred_at <= t` coincide com a " +
              "resposta de `resolve(ref, as_of=t)`",
            "interface-inexistente",
            "IF-07 `resolve(ref, as_of)` não foi exposta pela AMH (a própria minuta registra " +
              "'a operação ponto-no-tempo não existe'). Comparar a malha com a resolução LOCAL " +
              "do consumidor seria V2 contra V2 — a armadilha que §1 do harness recusa. " +
              "OBSERVADO como evidência colateral: o replay local é determinístico e " +
              `independente da ordem (${first === second ? "impressões idênticas" : "IMPRESSÕES DIVERGENTES"}).`,
          ),
          blocked(
            "CTS-11.C2",
            "a cadeia de alias retornada cruza, por `event_id`, exatamente com os eventos recebidos",
            "interface-inexistente",
            "não há resposta de `resolve` com que cruzar; o esquema de resposta sequer existe " +
              "(CONF-Q-10, fixture ausente F-7).",
          ),
        ],
        limitations: [AMH_LIMITATION],
      };
    },
  },
  // ---------------------------------------------------------------------
  {
    id: "CTS-12",
    title: "*Backfill* de eventos de identidade",
    interfaces: ["IF-01..IF-06"],
    fixtures: ["as seis fixtures válidas, entregues em lote histórico"],
    requirement: "backfill (§7.6)",
    hazards: ["DOM-0006"],
    run: (context) => {
      const incremental = newLayer();
      deliverAll(
        incremental,
        context,
        VALID_FIXTURES_CHRONOLOGICAL.map((fileName) => ({ fileName })),
      );

      // Lote histórico: TODOS recebidos no mesmo instante, muito depois dos
      // fatos, com uma redelivery dentro do lote.
      const batchInstant = "2026-08-20T00:00:00.000Z";
      const batch = newLayer();
      const batchOutcomes = deliverAll(batch, context, [
        ...VALID_FIXTURES_CHRONOLOGICAL.map((fileName) => ({
          fileName,
          receivedAtUtc: batchInstant,
        })),
        { fileName: "merge.valid.json", receivedAtUtc: batchInstant },
      ]);

      return {
        checks: [
          check(
            "CTS-12.C1",
            "o resultado do lote é idêntico ao do processamento incremental",
            meshFingerprint(batch.mesh()) === meshFingerprint(incremental.mesh()),
            "impressões de malha idênticas: o instante de RECEBIMENTO (gerado pela V2) não " +
              "influencia a projeção, que é dobrada por `occurred_at`",
          ),
          check(
            "CTS-12.C2",
            "duplicatas do lote são deduplicadas",
            batchOutcomes.filter((o) => o.kind === "deduplicado").length === 1,
            `vereditos do lote: ${outcomeKinds(batchOutcomes)}`,
          ),
          check(
            "CTS-12.C3",
            "o *backfill* cobre apenas eventos de IDENTIDADE (dado clínico está fora do v1)",
            batch.transitions.every((t) => t.eventType.startsWith("identity.")),
            `${batch.transitions.length} transições aplicadas, todas de tipo identity.*; ` +
              `${batch.quarantine.length} quarentena(s) — inclui o reassignment retido por ` +
              "alcance indefinido (perda L-10)",
          ),
        ],
        limitations: [
          AMH_LIMITATION,
          {
            cause: "fora-do-escopo-deste-pacote",
            statement:
              "a cláusula 'o backfill não produz alertas retroativos como se os fatos fossem novos' " +
              "não foi executada: não há motor de alerta neste pacote (ADR-0009 vive em apps/api).",
          },
        ],
      };
    },
  },
  // ---------------------------------------------------------------------
  {
    id: "CTS-13",
    title: "`erasure` / *tombstone*: aposentadoria não é deleção",
    interfaces: ["IF-06", "IF-07"],
    fixtures: ["erasure.valid.json"],
    requirement: "erasure / tombstone (§7.6)",
    hazards: ["DOM-0002"],
    run: (context) => {
      const layer = newLayer();
      const [outcome] = deliverAll(layer, context, [{ fileName: "erasure.valid.json" }]);
      const ref = fieldOf(context, "erasure.valid.json", "subject_ref_antiga");
      const envelope = parseEnvelope(rawOf(context, "erasure.valid.json"));
      const mesh = layer.mesh();
      const resolution = resolveLocal(mesh, ref);
      const refState = mesh.refs.find((r) => r.ref === ref);

      return {
        checks: [
          check(
            "CTS-13.C1",
            "a ref é marcada `retired`",
            refState?.status === "retired",
            `estado da ref na malha="${refState?.status ?? "ausente"}"`,
          ),
          check(
            "CTS-13.C2",
            "a ref não é deletada nem reutilizada e continua resolvendo no consumidor",
            resolution.kind === "retired" &&
              layer.journal.length === 1 &&
              mesh.refs.some((r) => r.ref === ref),
            `resolução local="${resolution.kind}"; a ref permanece na malha e o envelope permanece ` +
              "no journal append-only",
          ),
          check(
            "CTS-13.C3",
            "o `null` é interpretado como 'não há sucessor' e nunca confundido com campo ausente",
            envelope.subjectRefNova.kind === "null-asserted" &&
              outcome?.kind === "aplicado" &&
              outcome.transition.to === null,
            `estado do campo subject_ref_nova="${envelope.subjectRefNova.kind}" ` +
              "(três estados distintos: present / null-asserted / absent — perda L-08)",
          ),
          check(
            "CTS-13.C4",
            "a V2 não implementa deleção local por conta própria",
            layer.journal.length === 1,
            "a camada não expõe operação de deleção: o journal é append-only e a aposentadoria " +
              "é um ESTADO na projeção, não a remoção de um registro",
          ),
        ],
        limitations: [
          AMH_LIMITATION,
          {
            cause: "interface-inexistente",
            statement:
              "a garantia de que a AMH continua respondendo `resolve` para a ref aposentada é do " +
              "PRODUTOR (IF-07) e não foi verificada — a resolução exercida acima é a do consumidor " +
              "sobre envelopes retidos.",
          },
          {
            cause: "fora-do-escopo-deste-pacote",
            statement:
              "o que a V2 faz com seus PRÓPRIOS envelopes e fatos retidos após um `erasure` não é " +
              "decidido por este contrato (política de retenção: ADR-0018 + determinação legal " +
              "pendente).",
          },
        ],
      };
    },
  },
  // ---------------------------------------------------------------------
  {
    id: "CTS-14",
    title: "`resolve` com `as_of` anterior ao *minting* da ref",
    interfaces: ["IF-07"],
    fixtures: ["ref de alias.valid.json com `as_of` anterior [FIXTURE AUSENTE F-7]"],
    requirement: "resolve as_of pré-minting (§7.6)",
    hazards: ["HAZ-0005", "HAZ-0039", "DOM-0004"],
    run: () => ({
      checks: [
        blocked(
          "CTS-14.C1",
          "a resposta carrega a condição explícita `nao-mintada-em-as_of`",
          "interface-inexistente",
          "IF-07 não existe e não há esquema de resposta (CONF-Q-10; fixture ausente F-7). " +
            "OBSERVADO no consumidor: a resolução local devolve " +
            "`desconhecida-no-consumidor` — deliberadamente um token DIFERENTE, porque o " +
            "consumidor não sabe quando a ref foi mintada; afirmar `nao-mintada-em-as_of` seria " +
            "inventar conhecimento que só a AMH tem.",
        ),
      ],
      limitations: [AMH_LIMITATION],
    }),
  },
  // ---------------------------------------------------------------------
  {
    id: "CTS-15",
    title: "`resolve` sobre ref `retired`",
    interfaces: ["IF-07"],
    fixtures: ["ref de erasure.valid.json [FIXTURE AUSENTE F-7 para a resposta]"],
    requirement: "resolve sobre ref retired (§7.6)",
    hazards: ["HAZ-0005", "HAZ-0039", "HAZ-0021"],
    run: () => ({
      checks: [
        blocked(
          "CTS-15.C1",
          "a resposta carrega `status: retired` e a data do fato",
          "interface-inexistente",
          "IF-07 não existe; nenhuma resposta de `resolve` pode ser exercitada (fixture ausente F-7).",
        ),
        blocked(
          "CTS-15.C2",
          "com `as_of` anterior à aposentadoria, a resolução vigente naquele instante é devolvida",
          "interface-inexistente",
          "idem — a propriedade equivalente foi exercida na resolução LOCAL em CTS-10.C3, o que " +
            "não substitui a verificação contra o produtor.",
        ),
      ],
      limitations: [AMH_LIMITATION],
    }),
  },
  // ---------------------------------------------------------------------
  {
    id: "CTS-16",
    title: "*Downtime* do consumidor, recuperação e detecção de lacuna",
    interfaces: ["IF-01..IF-07"],
    fixtures: ["sequência das seis válidas, com interrupção no meio"],
    requirement: "downtime e recuperação (§7.6)",
    hazards: ["HAZ-0012", "HAZ-0025", "HAZ-0043"],
    run: (context) => {
      const layer = newLayer({ durableJournalFails: true });
      const [outcome] = deliverAll(layer, context, [{ fileName: "alias.valid.json" }]);
      return {
        checks: [
          check(
            "CTS-16.C1",
            "nenhuma mensagem é reconhecida sem persistência durável",
            outcome?.kind === "nao-durabilizado" &&
              outcome.acknowledged === false &&
              layer.journal.length === 0,
            `com a persistência durável falhando: veredito="${outcome?.kind}", ` +
              `acknowledged=${String(outcome?.acknowledged)}, journal=${layer.journal.length}`,
          ),
          blocked(
            "CTS-16.C2",
            "a conferência de integridade malha × `resolve(ref, as_of)` é executada para os " +
              "sujeitos afetados",
            "interface-inexistente",
            "IF-07 é o ÚNICO mecanismo de detecção de lacuna disponível (§7.3: o envelope não " +
              "carrega número de sequência nem marca d'água) e não existe.",
          ),
          blocked(
            "CTS-16.C3",
            "quando um evento foi definitivamente perdido, a divergência com `resolve` detecta a lacuna",
            "interface-inexistente",
            "sem IF-07, uma lacuna é INVISÍVEL por inspeção — este é um achado estrutural do " +
              "contrato, não uma limitação do harness.",
          ),
        ],
        limitations: [
          AMH_LIMITATION,
          {
            cause: "amh-indisponivel",
            statement:
              "a recuperação após indisponibilidade real (camadas 2/4) exige ambiente alcançável; " +
              "só `dev` está provisionado e o manifesto registra que a condição de ambiente " +
              "similar a produção do G3 NÃO pode ser satisfeita com dev apenas.",
          },
        ],
      };
    },
  },
  // ---------------------------------------------------------------------
  {
    id: "CTS-17",
    title: "Deriva: versão desconhecida, campo obrigatório removido, campo novo",
    interfaces: ["IF-00", "IF-01..IF-06"],
    fixtures: ["variantes de alias.valid.json [FIXTURES AUSENTES F-5]"],
    requirement: "drift detection (§7.6)",
    hazards: ["HAZ-0032", "QAS-0013"],
    run: (context) => {
      const layer = newLayer();
      const [outcome] = deliverAll(layer, context, [{ fileName: "alias.valid.json" }]);
      const envelope = parseEnvelope(rawOf(context, "alias.valid.json"));

      return {
        checks: [
          check(
            "CTS-17.C1",
            "campo adicional desconhecido (D3) é ACEITO, RETIDO e CONTADO — *tolerant reader* " +
              "significa não falhar, não significa não notar",
            outcome?.kind === "aplicado" &&
              envelope.unknownFields.includes("_fixture") &&
              layer.unknownFieldCount === 1 &&
              outcome.provenance.retainedUnknownFields.includes("_fixture"),
            `campos desconhecidos observados=${JSON.stringify(envelope.unknownFields)}; ` +
              `contagem acumulada=${layer.unknownFieldCount}; retidos na proveniência da tradução`,
          ),
          blocked(
            "CTS-17.C2",
            "evento com `event_type_version` desconhecida (D2) é quarentenado e alarmado",
            "fixture-ausente",
            "fixture F-5 (variante de versão desconhecida) não existe no pacote de contrato.",
          ),
          blocked(
            "CTS-17.C3",
            "evento SEM campo obrigatório do envelope mínimo em lane antes válida (D4) é " +
              "quarentenado com alarme alto",
            "fixture-ausente",
            "fixture F-5 (variante com campo obrigatório removido) não existe. A fixture " +
              "`alias.missing-idempotency-key.invalid.json` exercita a INVARIANTE 2 (CTS-07), " +
              "não a DERIVA D4 — a distinção é 'lane antes válida que passou a omitir o campo', " +
              "que exige o histórico da lane.",
          ),
          blocked(
            "CTS-17.C4",
            "sufixo de `event_type` e `event_type_version` discordantes (L-09) ⇒ quarentena",
            "fixture-ausente",
            "fixture F-5 (variante discordante) não existe.",
          ),
        ],
        limitations: [AMH_LIMITATION],
      };
    },
  },
  // ---------------------------------------------------------------------
  {
    id: "CTS-18",
    title: "Transição cruzando `{amh_tenant, legal_entity}` é rejeitada",
    interfaces: ["IF-01..IF-06"],
    fixtures: ["merge.valid.json com refs de escopos distintos [FIXTURE AUSENTE F-6]"],
    requirement: "tenant-isolation (§7.6)",
    hazards: ["HAZ-0003", "HAZ-0013", "HAZ-0027"],
    run: () => ({
      checks: [
        blocked(
          "CTS-18.C1",
          "a transição que cruza escopos é rejeitada fail-closed com alarme de segurança e de " +
            "segurança clínica",
          "fixture-ausente",
          "a fixture F-6 não existe — todas as dez fixtures pinadas estão no MESMO escopo " +
            "(SYNTH-TENANT-A / SYNTH-LE-00000001). Fabricar um envelope cruzando escopos seria " +
            "inventar o evento AMH de maior consequência de segurança justamente para vê-lo " +
            "recusado. A verificação da FUNÇÃO de recusa existe como teste unitário do pacote, " +
            "que é asserção sobre a V2, não execução deste cenário.",
        ),
      ],
      limitations: [
        AMH_LIMITATION,
        {
          cause: "amh-indisponivel",
          statement:
            "a afirmação de que a AMH IMPEDE a transição cruzada exige camada 2 e é indemonstrável " +
            "pelo lado consumidor.",
        },
      ],
    }),
  },
  // ---------------------------------------------------------------------
  {
    id: "CTS-19",
    title: "`resolve` fora do escopo autorizado: negativa e impossibilidade de *bypass*",
    interfaces: ["IF-07"],
    fixtures: ["— (teste negativo de autorização)"],
    requirement: "negative-auth (§7.6)",
    hazards: ["HAZ-0013", "HAZ-0014"],
    run: () => ({
      checks: [
        blocked(
          "CTS-19.C1",
          "a operação nega com condição explícita quando se tenta resolver ref de outro escopo",
          "interface-inexistente",
          "não há operação `resolve` a chamar. AQ-6 exige teste negativo afirmando a " +
            "IMPOSSIBILIDADE do bypass — demonstrável apenas contra a interface real.",
        ),
        blocked(
          "CTS-19.C2",
          "se a resposta contiver qualquer ref fora do escopo autorizado, a resposta inteira é " +
            "descartada e alarmada (defesa em profundidade R-4)",
          "interface-inexistente",
          "não há resposta a inspecionar.",
        ),
      ],
      limitations: [AMH_LIMITATION],
    }),
  },
  // ---------------------------------------------------------------------
  {
    id: "CTS-20",
    title: "Identificador de fonte cru no envelope é rejeitado",
    interfaces: ["IF-06"],
    fixtures: ["erasure.identificador-de-fonte-cru.invalid.json"],
    requirement: "evento inválido / política de dados (§7.6)",
    hazards: ["HAZ-0001"],
    run: (context) => {
      const layer = newLayer();
      const [outcome] = deliverAll(layer, context, [
        { fileName: "erasure.identificador-de-fonte-cru.invalid.json" },
      ]);
      const quarantineEntry = layer.quarantine[0];

      return {
        checks: [
          check(
            "CTS-20.C1",
            "a mensagem é rejeitada e alarmada como violação de contrato E de política de dados",
            outcome?.kind === "quarentenado" &&
              outcome.reason.token === "raw_source_identifier_present",
            `razão registrada: ${quarantineTokenOf(outcome)} (qualificador = NOME do campo)`,
          ),
          check(
            "CTS-20.C2",
            "nunca é 'aceita ignorando o campo extra' — a proibição é de CONTEÚDO, e a regra de " +
              "*tolerant reader* não a cobre",
            layer.transitions.length === 0,
            `transições aplicadas=${layer.transitions.length} (aceitar-e-ignorar produziria 1)`,
          ),
          check(
            "CTS-20.C3",
            "o envelope é retido em quarentena de ACESSO SEGREGADO",
            quarantineEntry?.segregated === true && layer.journal.length === 1,
            `entrada de quarentena marcada segregada=${String(quarantineEntry?.segregated)}`,
          ),
          check(
            "CTS-20.C4",
            "o VALOR do identificador não é reproduzido em relatório",
            outcome?.kind === "quarentenado" &&
              outcome.reason.qualifier === "raw_source_identifier",
            "o qualificador da razão carrega apenas o NOME do campo; nenhum caminho deste " +
              "harness copia o valor para o relatório",
          ),
        ],
        limitations: [AMH_LIMITATION],
      };
    },
  },
  // ---------------------------------------------------------------------
  {
    id: "CTS-21",
    title: "Propósito fora do vocabulário fechado é rejeitado",
    interfaces: ["transversal IF-01..IF-07"],
    fixtures: ["— (contexto de consumo)"],
    requirement: "negative-auth / propósito (§7.6)",
    hazards: ["AQ-3", "DEC-G0-03"],
    run: (context) => {
      const researchLayer = newLayer({
        context: { ...DEFAULT_CONTEXT, purpose: "pesquisa" },
      });
      const [researchOutcome] = deliverAll(researchLayer, context, [
        { fileName: "alias.valid.json" },
      ]);

      const contactPermissionLayer = newLayer({
        context: { ...DEFAULT_CONTEXT, legalBasisSource: "ie_perm_sms_email" },
      });
      const [contactOutcome] = deliverAll(contactPermissionLayer, context, [
        { fileName: "alias.valid.json" },
      ]);

      return {
        checks: [
          check(
            "CTS-21.C1",
            "consumo sob qualquer propósito que não `tratamento` é rejeitado fail-closed",
            researchOutcome?.kind === "recusado" &&
              researchOutcome.reason.token === "purpose_not_permitted" &&
              researchOutcome.acknowledged === false &&
              researchLayer.journal.length === 0,
            `veredito="${researchOutcome?.kind}"; nada foi consumido (journal=${researchLayer.journal.length})`,
          ),
          check(
            "CTS-21.C2",
            "a base legal JAMAIS deriva de `ie_perm_sms_email` ou de qualquer permissão de contato",
            contactOutcome?.kind === "recusado" &&
              contactOutcome.reason.token === "legal_basis_from_contact_permission" &&
              contactPermissionLayer.journal.length === 0,
            `veredito="${contactOutcome?.kind}"; razão=` +
              `${contactOutcome?.kind === "recusado" ? formatReason(contactOutcome.reason) : "n/d"}`,
          ),
        ],
        limitations: [
          AMH_LIMITATION,
          {
            cause: "fora-do-escopo-deste-pacote",
            statement:
              "a verificação cobre a camada anticorrupção deste harness; que TODO caminho de " +
              "consumo do produto seja mono-propósito é asserção sobre apps/api e não foi executada.",
          },
        ],
      };
    },
  },
  // ---------------------------------------------------------------------
  {
    id: "CTS-22",
    title: "Pin do contrato: digest divergente reprova o pacote inteiro",
    interfaces: ["IF-00"],
    fixtures: ["— (requer manifesto publicado)"],
    requirement: "drift detection (§7.6)",
    hazards: [],
    run: (context) => ({
      checks: [
        blocked(
          "CTS-22.C1",
          "quando o digest calculado diverge do pinado, o PACOTE INTEIRO é rejeitado e a lane " +
            "para visivelmente",
          "manifesto-nao-publicado",
          "nenhum manifesto de contrato existe: `contract-manifest.draft.yaml` traz " +
            "`manifest_sha256: null`, `pinned: false`, `aceito: false`. " +
            "OBSERVADO como evidência colateral: este harness pina LOCALMENTE as " +
            `${context.fixtures.fixtures.length} fixtures do repositório por SHA-256 e reprova a ` +
            "execução inteira se qualquer digest divergir — o que é OUTRA coisa, e não substitui " +
            "o pin do pacote publicado pela AMH.",
        ),
      ],
      limitations: [AMH_LIMITATION],
    }),
  },
];

/** Executa um cenário e computa veredito e cobertura pelas regras de `harness.ts`. */
export function runScenario(
  definition: ScenarioDefinition,
  fixtures: PinnedFixtureSet,
): ScenarioResult {
  const { checks, limitations } = definition.run({ fixtures });
  return {
    id: definition.id,
    title: definition.title,
    interfaces: definition.interfaces,
    fixtures: definition.fixtures,
    requirement: definition.requirement,
    hazards: definition.hazards,
    checks,
    limitations,
    verdict: verdictOf(checks),
    coverage: coverageOf(checks, limitations),
  };
}

/**
 * Executa os 22 cenários. Se o pin local das fixtures divergir, NENHUM
 * cenário é executado: todos falham com a divergência como razão — mesma
 * postura fail-closed que CTS-22 exige do pacote de contrato (e declarada,
 * no relatório, como coisa distinta dele).
 */
export function runAllScenarios(fixtures: PinnedFixtureSet): readonly ScenarioResult[] {
  if (fixtures.status === "divergente") {
    return SCENARIOS.map((definition) => {
      const failure: CheckResult[] = [
        {
          id: `${definition.id}.PIN`,
          assertion: "o conjunto de fixtures pinadas está íntegro antes de qualquer execução",
          status: "falhou",
          evidence: `pin local REPROVADO: ${fixtures.divergences.join(" | ")}`,
        },
      ];
      return {
        id: definition.id,
        title: definition.title,
        interfaces: definition.interfaces,
        fixtures: definition.fixtures,
        requirement: definition.requirement,
        hazards: definition.hazards,
        checks: failure,
        limitations: [
          {
            cause: "amh-indisponivel" as const,
            statement:
              "execução abortada pelo pin: um cenário rodado contra fixture adulterada produziria " +
              "veredito sem valor.",
          },
        ],
        verdict: "falhou" as const,
        coverage: "nenhuma" as const,
      };
    });
  }
  return SCENARIOS.map((definition) => runScenario(definition, fixtures));
}
