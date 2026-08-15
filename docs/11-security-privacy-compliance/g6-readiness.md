---
id: G6-READINESS-V2
title: Gate G6 (safety/security design) — readiness assessment
label: PROPOSAL
statement: >
  Honest assessment of Gate G6 readiness as of 2026-08-14. Every one of the four G6
  conditions is UNMET, and three of the four are not yet approachable because the roles
  that must satisfy them are unassigned. Nothing is implemented; 66 of 67 threat findings
  are P0/P1 and all are OPEN; adversarial tenant-isolation evidence does not exist and
  cannot currently be produced by anyone; no data flow or processor has been approved
  because none exists and no approver is named. This document states no compliance
  position and grants no approval.
provenance:
  source_repo: intensicare-V2
  path_or_url: docs/11-security-privacy-compliance/g6-readiness.md
  commit_sha_or_version: uncommitted (working tree at cb35521)
  section_or_lines: whole document
  date_collected: 2026-08-14
  collector: healthcare threat-model specialist (Wave 2 specialist agent)
  transformation: >
    G6 conditions quoted from INTENSICARE_V2_ORCHESTRATOR_PROMPT.md lines 770-772 and
    assessed against the artifacts on disk in this repository on 2026-08-14 (hazard log,
    safety requirements, threat model, security controls catalog, privacy data map,
    governance registers, CI policy, AMH dossier). No environment, system, or test result
    was consulted, because none exists.
  confidence: high
  owner: UNASSIGNED — VALIDATION REQUIRED
  validation_status: VALIDATION REQUIRED
links:
  requirements: [SEC-0009, SEC-0040, SAF-0030, SAF-0037]
  hazards: [HAZ-0003, HAZ-0013, HAZ-0014, HAZ-0028, HAZ-0029, HAZ-0034]
  adrs: []
  tests: []
  pr: null
supersedes: null
superseded_by: null
---

# Gate G6 — Safety/Security Design: Readiness Assessment

> **Verdict: NOT READY. Not close. Not blocked on effort — blocked on prerequisites that
> no amount of engineering work can currently satisfy.**
>
> This document grants nothing, approves nothing, and accepts nothing. Its only purpose is
> to state the distance between what G6 requires and where the project actually is, so that
> nobody plans against an optimistic reading.

## 1. What Gate G6 requires

SOURCE, verbatim (`INTENSICARE_V2_ORCHESTRATOR_PROMPT.md:770-772`):

> ### Gate G6 — safety/security design
>
> No production-like pilot until high-severity hazards have implemented and verified
> controls or formally accepted residual risk by authorized humans; threat-model P0/P1
> findings are closed or accepted; tenant isolation has adversarial evidence; and
> privacy/legal owners approve data flows and processors.

Four conditions. **All four are conjunctive** — G6 does not close on three of four.

## 2. Condition-by-condition assessment

### G6.1 — "High-severity hazards have implemented and verified controls or formally accepted residual risk by authorized humans"

| Question | Answer |
|---|---|
| How many hazards are logged? | 40 (`HAZ-0001..HAZ-0040`) |
| How many are high severity (S4/S5)? | The great majority. `hazard-log.md` classes most rows `Unacceptable` pre-control |
| How many have an **implemented** control? | **ZERO.** All 37 `SAF` requirements are `PROPOSAL · NOT-IMPLEMENTED`; all 50 `SEC` controls are `PROPOSAL · NOT-IMPLEMENTED` |
| How many have a **verified** control? | **ZERO.** No test of any kind has been executed against any V2 behaviour, because there is no V2 behaviour |
| How much residual risk has been **formally accepted**? | **ZERO.** Acceptance requires `AUTH-CLINSAFETY` (`BLK-0002`) and `AUTH-SECURITY` (`BLK-0003`) — **both UNASSIGNED** |
| Are the hazard severities themselves signed off? | **No.** `hazard-log.md` §5: "No severity here is signed off. S/L values are PROPOSAL triage estimates" |

**Status: UNMET, and not approachable.** Even a perfect implementation could not satisfy
this condition today, because there is no authorized human to verify or accept anything.

### G6.2 — "Threat-model P0/P1 findings are closed or accepted"

| Question | Answer |
|---|---|
| Does a threat model exist? | Yes, as of today: `threat-model.md`, 67 threats across 12 trust boundaries |
| How many are P0? | **27** |
| How many are P1? | **39** |
| How many P0/P1 are **closed**? | **ZERO.** Closing requires an implemented, verified control; none exists |
| How many are **accepted**? | **ZERO.** `AUTH-SECURITY` is UNASSIGNED (`BLK-0003`); no agent may accept (`evidence-notation.md` §2 rule 3) |
| Has the threat model been reviewed by anyone? | **No.** It was authored by an agent today and has had no human review. `PROMPT:201` requires the verifier not be the implementer |
| Is the priority triage itself validated? | **No** — `VALIDATION REQUIRED`, `threat-model.md` §5 |

**Status: UNMET.** 66 of 67 findings are in the G6-gating bands. Note that the *concentration*
in P0/P1 is a property of a system with zero controls, not a claim that all 66 are equally
urgent — but it does mean this condition cannot be partially satisfied by triage alone.

### G6.3 — "Tenant isolation has adversarial evidence"

| Question | Answer |
|---|---|
| Does tenant isolation exist? | **No.** No code, no datastore, no row-level enforcement. SEC-0009 is `PROPOSAL` |
| Is there adversarial evidence? | **NONE. Zero tests of any kind have been run** |
| Could adversarial testing be performed today, by anyone? | **No** — and this is the part most likely to be underestimated. There is no V2 system to test. There is also no production-like environment on the AMH side: `DOSSIER` records `1 de 4 provisionado. Só dev existe`, and states plainly that Layer 2 verification in a production-like environment "**cannot currently be performed at all, by anyone, regardless of access**" (`RISK-0004`) |
| Is the *definition* of correct tenant behaviour settled? | **No.** `IDN-CONTRA` records five unresolved identity/tenant axes, and IDN-C-5 records two AMH documents describing two different tenant-enforcement mechanisms for the same server — one advertising a `cross_tenant_authorized` bypass the other cannot express (`threat-model.md` §2.1) |
| Is the datastore chosen? | **No.** The candidate topology hedges: row-level enforcement "**if** the selected technology supports it" (`PROMPT:605`) |

**Status: UNMET, and structurally blocked.** You cannot write an adversarial test for a
boundary whose correct behaviour is contradicted in the upstream platform's own
documentation. **This is the longest-lead G6 item and should be treated as such.**

### G6.4 — "Privacy/legal owners approve data flows and processors"

| Question | Answer |
|---|---|
| Is there a privacy/legal owner? | **No.** `AUTH-PRIVACY-LEGAL` is `UNASSIGNED — VALIDATION REQUIRED` (`BLK-0004`) |
| How many data flows are approved? | **ZERO.** `privacy-data-map.md` §8 approval register is empty |
| How many processors are inventoried? | **ZERO.** `privacy-data-map.md` §6 is empty — no cloud provider, no model provider, no notification provider, no observability vendor has been selected |
| Is LGPD applicability determined? | **No — and it is not this project's or any agent's determination to make.** `VALIDATION REQUIRED`, reserved to Brazilian legal specialists (`PROMPT:766`) |
| Is a legal basis established for any purpose? | **No.** And on current evidence V2 **cannot obtain a reliable consent decision at all**: AMH's ADR-045 records zero producers into the consent log, and using the available contact-permission field as consent *"seria fabricar base legal"* (`IDP-07`) |
| Is residency determined? | **No.** No platform ADR exists |
| Is retention determined? | **No.** Every retention cell in `privacy-data-map.md` §4 reads `PLACEHOLDER — NOT SET` |

**Status: UNMET, and not approachable.** Not only is nothing approved — there is no approver,
nothing to approve, and no determination of what approval would even need to establish.

## 3. Summary

| G6 condition | Required | Actual | Gap |
|---|---|---|---|
| **G6.1** hazard controls implemented + verified, or residual risk accepted | Implemented, verified, or accepted by authorized humans | 0 implemented · 0 verified · 0 accepted · **no authorized human exists** | **TOTAL** |
| **G6.2** threat-model P0/P1 closed or accepted | 66 findings closed or accepted | 0 closed · 0 accepted · **no accepter exists** · model itself unreviewed | **TOTAL** |
| **G6.3** tenant isolation has adversarial evidence | Adversarial evidence | **NONE** · no system to test · **no production-like environment exists on either side** · correct behaviour contradicted upstream | **TOTAL** |
| **G6.4** privacy/legal approve flows and processors | Approved flows + processors | 0 flows approved · **0 processors inventoried** · **no approver exists** · no legal determination | **TOTAL** |

**Four of four UNMET. Three of four are not merely unmet but currently unapproachable**,
because the blocking item is a named human, not a piece of work.

**What this means practically:** `PROMPT:770` conditions a *production-like pilot* on G6.
Nothing in this repository is close to a pilot — there is no code. The honest reading is not
"G6 is failing"; it is **"G6 has not started, and four of its prerequisites are outside
engineering's control."** The value of stating it now is that G6.3 and G6.4 have very long
lead times and will otherwise be discovered late.

## 4. What does exist, stated accurately

Recorded so this document is not read as "nothing has been done" — a fair amount has, none
of it a G6 condition:

| Artifact | State | G6 relevance |
|---|---|---|
| `hazard-log.md` — 40 hazards, 6 tagged `joint` | PROPOSAL, all OPEN | **Input** to G6.1, not satisfaction of it |
| `safety-requirements.md` — 37 `SAF` | PROPOSAL, none implemented | Input to G6.1 |
| `threat-model.md` — 67 `THR`, 12 boundaries | PROPOSAL, all OPEN, unreviewed | **Creates** G6.2's list; does not satisfy it |
| `security-controls-catalog.md` — 50 `SEC` | PROPOSAL / NOT-IMPLEMENTED | Input to G6.1 and G6.2 |
| `privacy-data-map.md` | Skeleton; every legal cell `VALIDATION REQUIRED` | **Frames** G6.4's questions; answers none |
| AMH four-layer dossier + contradiction record | Layer 1 substantially established; Layers 2–4 **NO EVIDENCE** | Bounds what G6.3 can test and when |
| Two blocking docs-gates CI jobs, actions SHA-pinned | Real and running | Good practice; **not enforced** — branch protection unconfigured (THR-0055) |

**Nothing above is a control. Nothing above has been verified. Nothing above has been
accepted.**

## 5. Ordered unblock list

Ordered by **dependency**, not by effort. Items 1–4 are not engineering work, and every
later item depends on them.

### Tier 0 — Prerequisites no engineering can substitute for

1. **Name `AUTH-SECURITY`** (`BLK-0003`). Without this role, no threat finding can ever be
   closed or accepted and G6.2 is permanently unsatisfiable. **Blocks: G6.1, G6.2.**
2. **Name `AUTH-PRIVACY-LEGAL`** (`BLK-0004`), with access to Brazilian legal/regulatory
   specialists. **Blocks: G6.4 entirely, plus every `VALIDATION REQUIRED` cell in
   `privacy-data-map.md`.**
3. **Name `AUTH-CLINSAFETY`** (`BLK-0002`). Required for hazard severity sign-off and
   residual-risk acceptance. **Blocks: G6.1.**
4. **Name `AUTH-DATA-PLATFORM` and establish contact with `AUTH-AMH-OWNER`** (`BLK-0005`,
   `BLK-0010`). Required to resolve the AMH contradictions that define what tenant isolation
   even means at TB-05. **Blocks: G6.3.**

### Tier 1 — Resolve the definitional contradictions (cannot start before Tier 0 item 4)

5. **Resolve the three-way authentication contradiction (C-2)** — CapabilityStatement vs.
   HAPI README vs. the implemented authorizer (`threat-model.md` §2.1). Decisive empirical
   test: retrieve the live `/fhir/<tenant>/metadata` and establish whether
   `lambda-authorizer-fhir` is in the request path and with what issuer/audience/JWKS.
   **Unblocks:** THR-0018, THR-0022, THR-0027, THR-0046; a designable TB-05.
6. **Get an explicit AMH answer on IDN-C-5** — does a `cross_tenant_authorized` bypass exist
   in the deployed server, and can any V2 credential reach it? **Unblocks:** THR-0018;
   part of G6.3.
7. **Adjudicate the identity/tenant/consent contradiction record** (`IDN-CONTRA`, five axes).
   **Unblocks:** `SAF-0009`'s blocked status and SEC-0001's inherited block; THR-0003,
   THR-0020, THR-0048.

### Tier 2 — Decisions that fix the shape of the controls (parallelizable with Tier 1)

8. **ADR 16 — authorization and tenant isolation enforcement**, with SEC-0009 as a driver and
   **storage-level enforcement as a datastore selection criterion**, not a property to be
   discovered afterwards (`PROMPT:605` currently hedges).
9. **ADR 15 — authentication/session and machine-to-machine identity**, with
   THR-0021..THR-0027 as explicit inputs. TB-06's far side is currently undecided.
10. **ADR 22 — supply chain** (pinning, SBOM, signing, provenance, deploy-by-digest), with
    THR-0050..THR-0056 as inputs. This one is unusual: **it can largely be satisfied before
    the application stack exists**, and it protects everything built afterwards.
11. **ADR 14 — MCP exposure** (or an explicit decision to defer MCP entirely). Deferral is a
    legitimate and cheap answer to seven P0/P1 threats.
12. **ADR 7 — rule bundle format, signing, approval, activation, rollback** (THR-0034..THR-0038).
13. **ADR 17, 18, 20** — key management; audit integrity and retention; observability, backup,
    restore, DR.

### Tier 3 — Immediately actionable, low cost, do not wait

14. **Configure branch protection** (`branch-protection-request.md`, status BLOCKED). The two
    existing gates run but do not block a merge — **THR-0055 in the present tense, in this
    repository, today.** This is the cheapest item on the entire list and it protects every
    later gate.
15. **Adopt SEC-0040 as policy now**: every safety/security gate is blocking from the moment
    it is introduced, and a gate that validates zero cases fails.
16. **Adopt the SEC-0046 prohibition now**: no PHI to any model provider until all five
    `PROMPT:736` controls exist and are approved. It costs nothing today and prevents the
    hardest-to-reverse privacy event.
17. **Adopt the SEC-0010 / `IDP-09` prohibition now**: V2 builds no cross-PJ correspondence
    structure. Cheap as a constraint, extremely expensive to unwind later.
18. **Get this threat model independently reviewed** (`PROMPT:201`). It has been read by no
    human.
19. **Amend `traceability-policy.md` §1 by ADR to add the `THR` prefix**
    (`threat-model.md` §11 item 1).

### Tier 4 — Requires a running system (cannot start before G7's vertical slice)

20. **Adversarial tenant-isolation campaign** by someone who did not implement the isolation —
    queries, caches, projections, topics, subscriptions, exports, error codes, timing
    (SEC-0009). **This is G6.3 and it has the longest lead time on the list.**
21. **Penetration test** with independent acceptance (`PROMPT:201`, `PROMPT:802`).
22. **Restore, rollback, and key-loss recovery drills** with an independent verifier
    (SEC-0048, `PROMPT:204`).
23. **Injection, exfiltration, confused-deputy, chaining, cross-tenant-inference test suite**
    for any MCP surface (SEC-0041, `PROMPT:741`) — only if item 11 admits MCP.
24. **Re-run this threat model as STRIDE-per-element** against the ratified architecture
    (`threat-model.md` §10 gap T-1), and again before G7 and G8.

### Tier 5 — Environment prerequisites outside V2's control

25. **A production-like environment must be funded and built** — on the AMH side, `stg`, `prod`
    and `dr` do not exist (`RISK-0004`; AMH's own README assigns this to `Negócio / orçamento`).
    Until then, G6.3's adversarial evidence and G3's compatibility evidence are both
    unobtainable **by anyone**. Any plan assuming production-like conformance testing is
    available on request is planning against a resource that does not exist.

## 6. Critical path

**INFERENCE (from §5's dependency ordering):**

```text
Name AUTH-SECURITY + AUTH-PRIVACY-LEGAL + AUTH-CLINSAFETY   (Tier 0 — not engineering work)
  → Resolve AMH auth + identity contradictions               (Tier 1 — needs AMH owners)
    → ADR 15 / 16 / 22                                       (Tier 2)
      → G7 vertical slice with isolation implemented         (separate gate)
        → Adversarial tenant-isolation campaign              (Tier 4 = G6.3)
          → Threat findings closed or accepted               (G6.2)
            → G6
```

**The two items that will dominate the schedule are the ones with no engineering content at
all: naming humans (Tier 0) and provisioning a production-like environment (Tier 5).** Both
should start immediately and neither is on any engineer's backlog today.

## 7. What this document does NOT do

1. It does not close, open, or conditionally pass Gate G6.
2. It does not accept any residual risk, any threat finding, or any hazard.
3. It does not approve any data flow, processor, control, or design.
4. It states no compliance position, for any framework, and cannot be cited as one.
5. It does not name any human, and no agent may fill any `AUTH-*` role.
6. Its assessment is dated **2026-08-14** and describes the working tree at `cb35521` plus
   uncommitted Wave 1/Wave 2 artifacts. It must be re-run at each gate and whenever an
   `AUTH-*` role is staffed.
