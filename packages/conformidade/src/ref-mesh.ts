/**
 * Malha de refs — PROJEÇÃO reconstruível, jamais estado primário
 * (DOM-0006; `mapeamento-semantico.md` §6 "Projeção, não estado primário").
 *
 * Semântica implementada, campo a campo com a fonte
 * -------------------------------------------------
 * - **Ordem por `occurred_at`** (contrato §3): a projeção é sempre uma
 *   dobra sobre as transições ordenadas pelo TEMPO DO FATO, nunca pela
 *   ordem de chegada. É por isso que chegada tardia (CTS-04) e ordem
 *   invertida (CTS-05) não regridem estado: a ordem de entrega não entra
 *   no cálculo.
 * - **Correção é revogação carimbada, não reescrita** (`unmerge`/`restore`
 *   via `correction_of`; ADR-0005 M8; ADR-0004 §5.2). Uma transição com
 *   `correction_of` REVOGA a aresta do evento apontado A PARTIR do seu
 *   `occurred_at`; o replay anterior ao carimbo continua enxergando a
 *   aresta como vigente. Isto materializa a exigência de CTS-11 ("o
 *   restore aparece como carimbo e o replay anterior ao carimbo ainda
 *   enxerga a aresta como vigente") e a mitigação de L-12 ("tratar ambos
 *   pela relação `correction_of`, não pelo nome do tipo").
 *
 *   PREMISSA (reversível, GDEC-0015/0017) — **uma transição que carrega
 *   `correction_of` produz REVOGAÇÃO, não uma aresta nova**. O contrato
 *   não diz. As duas leituras possíveis de `unmerge` (`antiga` = agregado
 *   desfeito, `nova` = ref destacada) são: (a) criar a aresta invertida
 *   `antiga → nova`, o que ACRESCENTA aliasing em vez de desfazê-lo e
 *   produz ciclo de resolução com o `merge` que ela desfaz; (b) apenas
 *   revogar o evento apontado, deixando as duas refs de pé. Escolhida (b),
 *   por ser a única compatível com "o split é o desfazimento e não
 *   reescreve histórico" (AMH-020b via ata; ADR-0004 §5.2) e com o
 *   `restore` cujas refs `antiga` e `nova` são IDÊNTICAS na fixture pinada
 *   — sob a leitura (a) o `restore` seria um auto-alias. A ambiguidade é
 *   reportada como questão aberta ao dono AMH (parente de L-12/CONF-Q-09),
 *   NÃO fechada por este harness.
 * - **`erasure` aposenta, não deleta** (`retired`, sucessor `null`
 *   afirmado): a ref continua na malha e continua resolvendo, com estado
 *   explícito.
 * - **Nunca adivinha.** Ciclo de resolução, ref desconhecida ou sujeito em
 *   revisão devolvem CONDIÇÃO EXPLÍCITA — nunca "resolve para si mesma",
 *   nunca "sem dados logo normal" (DOM-0004; HAZ-0005; HAZ-0039).
 *
 * LIMITE DURO: `resolveLocal` é a resolução do CONSUMIDOR sobre envelopes
 * retidos. NÃO é `resolve(ref, as_of)` da AMH (IF-07), que não existe.
 * Comparar esta resolução com ela mesma seria V2 contra V2 — a armadilha
 * que `cenarios-teste-consumidor.md` §1 recusa explicitamente.
 */

export type RefStatus = "ativa" | "retired" | "em-revisao";

export interface RefTransition {
  readonly eventId: string;
  readonly eventType: string;
  readonly from: string;
  /** `null` afirmado = "não há sucessor" (válido só em `erasure`). */
  readonly to: string | null;
  readonly occurredAtUtc: string;
  readonly emittedAtUtc: string;
  /** `event_id` revogado por esta transição, quando houver. */
  readonly correctionOf: string | null;
  readonly amhTenant: string;
  readonly legalEntity: string;
}

export interface RefState {
  readonly ref: string;
  readonly status: RefStatus;
  /** Instante do fato que produziu o estado corrente. */
  readonly sinceUtc: string;
}

export interface RefMeshState {
  /** Arestas vigentes em `as_of` (ordenadas por `occurred_at`). */
  readonly effectiveTransitions: readonly RefTransition[];
  /** Transições revogadas por correção até `as_of` (histórico visível). */
  readonly revokedTransitions: readonly RefTransition[];
  /**
   * Transições que carregam `correction_of` — revogam o evento apontado e
   * NÃO produzem aresta (ver PREMISSA no cabeçalho). Ficam visíveis aqui
   * porque são fato carimbado, não ruído descartado.
   */
  readonly revocationTransitions: readonly RefTransition[];
  readonly refs: readonly RefState[];
  readonly asOfUtc: string | null;
}

export type LocalResolution =
  | {
      readonly kind: "resolvida";
      readonly target: string;
      readonly chain: readonly RefTransition[];
    }
  | { readonly kind: "retired"; readonly sinceUtc: string }
  | { readonly kind: "em-revisao"; readonly ref: string }
  | { readonly kind: "desconhecida-no-consumidor"; readonly ref: string }
  | { readonly kind: "ciclo-detectado"; readonly visited: readonly string[] };

function compareByOccurredThenEmitted(a: RefTransition, b: RefTransition): number {
  if (a.occurredAtUtc !== b.occurredAtUtc) {
    return a.occurredAtUtc < b.occurredAtUtc ? -1 : 1;
  }
  if (a.emittedAtUtc !== b.emittedAtUtc) {
    return a.emittedAtUtc < b.emittedAtUtc ? -1 : 1;
  }
  // Empate total: a ordem NÃO é decidida aqui. Quem detecta e quarentena o
  // par é a camada anticorrupção (CTS-06 / CONF-Q-12); ordenar por
  // `eventId` aqui seria escolha arbitrária disfarçada de determinismo,
  // então o comparador declara empate e a dobra segue estável.
  return 0;
}

/**
 * Projeta a malha a partir das transições, opcionalmente até `asOfUtc`
 * (inclusive). `refsEmRevisao` são refs marcadas pela camada
 * anticorrupção (ex.: alcance de reatribuição indefinido — L-10).
 */
export function projectMesh(
  transitions: readonly RefTransition[],
  options?: { readonly asOfUtc?: string; readonly refsUnderReview?: readonly string[] },
): RefMeshState {
  const asOfUtc = options?.asOfUtc ?? null;
  const underReview = new Set(options?.refsUnderReview ?? []);

  // Deduplicação por `event_id` — IDEMPOTÊNCIA DE EFEITO como segunda
  // defesa (CTS-02): mesmo que a detecção de duplicata na fronteira
  // falhasse, dobrar o MESMO evento duas vezes não pode produzir uma malha
  // diferente. O `event_id` é declarado "nunca reutilizado" pelo contrato,
  // logo é a chave legítima do conjunto de eventos.
  const byEventId = new Map<string, RefTransition>();
  for (const transition of transitions) {
    if (!byEventId.has(transition.eventId)) byEventId.set(transition.eventId, transition);
  }

  const upTo = [...byEventId.values()]
    .filter((t) => asOfUtc === null || t.occurredAtUtc <= asOfUtc)
    .sort(compareByOccurredThenEmitted);

  const revokedEventIds = new Set<string>();
  for (const transition of upTo) {
    if (transition.correctionOf !== null) revokedEventIds.add(transition.correctionOf);
  }

  const effective: RefTransition[] = [];
  const revoked: RefTransition[] = [];
  const revocations: RefTransition[] = [];
  for (const transition of upTo) {
    if (revokedEventIds.has(transition.eventId)) revoked.push(transition);
    else if (transition.correctionOf !== null) revocations.push(transition);
    else effective.push(transition);
  }

  const status = new Map<string, RefState>();
  const touch = (ref: string, sinceUtc: string) => {
    if (!status.has(ref)) status.set(ref, { ref, status: "ativa", sinceUtc });
  };

  for (const transition of effective) {
    touch(transition.from, transition.occurredAtUtc);
    if (transition.to !== null) touch(transition.to, transition.occurredAtUtc);
    if (transition.to === null) {
      // `erasure`: aposenta a ref — nunca deleta, nunca reutiliza.
      status.set(transition.from, {
        ref: transition.from,
        status: "retired",
        sinceUtc: transition.occurredAtUtc,
      });
    }
  }
  // As refs citadas por uma revogação continuam existindo na malha (o fato
  // carimbado é visível), mesmo que a revogação não produza aresta.
  for (const transition of revocations) {
    touch(transition.from, transition.occurredAtUtc);
    if (transition.to !== null) touch(transition.to, transition.occurredAtUtc);
  }
  // Uma revogação de `erasure` (restore) devolve a ref ao estado ativo: a
  // revogação já removeu a aposentadoria de `effective`, então basta não
  // haver `erasure` vigente — garantido pela dobra acima.

  for (const ref of underReview) {
    const previous = status.get(ref);
    status.set(ref, {
      ref,
      status: "em-revisao",
      sinceUtc: previous?.sinceUtc ?? "",
    });
  }

  return {
    effectiveTransitions: effective,
    revokedTransitions: revoked,
    revocationTransitions: revocations,
    refs: [...status.values()].sort((a, b) => (a.ref < b.ref ? -1 : a.ref > b.ref ? 1 : 0)),
    asOfUtc,
  };
}

/**
 * Resolução ponto-no-tempo do CONSUMIDOR (nunca IF-07 da AMH).
 * Devolve sempre condição explícita; nunca adivinha e nunca degrada para
 * "resolução atual" quando `asOf` é histórico.
 */
export function resolveLocal(mesh: RefMeshState, ref: string): LocalResolution {
  const known =
    mesh.refs.some((state) => state.ref === ref) ||
    mesh.revokedTransitions.some((t) => t.from === ref || t.to === ref);
  if (!known) return { kind: "desconhecida-no-consumidor", ref };

  const state = mesh.refs.find((candidate) => candidate.ref === ref);
  if (state?.status === "em-revisao") return { kind: "em-revisao", ref };
  if (state?.status === "retired") return { kind: "retired", sinceUtc: state.sinceUtc };

  const chain: RefTransition[] = [];
  const visited: string[] = [ref];
  let current = ref;

  for (;;) {
    // Auto-aresta (`from === to`) NÃO é aliasing: seguir uma seria fabricar
    // um ciclo a partir de um evento que não move ref alguma.
    const outgoing = mesh.effectiveTransitions
      .filter((t) => t.from === current && t.to !== null && t.to !== t.from)
      .sort(compareByOccurredThenEmitted);
    const latest = outgoing.at(-1);
    if (latest === undefined || latest.to === null) {
      return { kind: "resolvida", target: current, chain };
    }
    if (visited.includes(latest.to)) {
      return { kind: "ciclo-detectado", visited: [...visited, latest.to] };
    }
    chain.push(latest);
    current = latest.to;
    visited.push(current);
  }
}

/** Chave estável de comparação de duas malhas (usada nos testes de replay). */
export function meshFingerprint(mesh: RefMeshState): string {
  const refs = mesh.refs.map((r) => `${r.ref}|${r.status}|${r.sinceUtc}`).join("\n");
  const edges = mesh.effectiveTransitions
    .map((t) => `${t.eventId}|${t.eventType}|${t.from}|${t.to ?? "<null>"}|${t.occurredAtUtc}`)
    .join("\n");
  return `refs:\n${refs}\nedges:\n${edges}`;
}
