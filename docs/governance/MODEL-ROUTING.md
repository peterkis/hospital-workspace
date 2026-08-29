# Luna / Terra / Sol / Parent Model Routing

## Parent Codex

Use the parent for:

- architecture ambiguity;
- database baseline and migrations;
- identity/session/authz;
- Tauri/native permissions;
- cross-service integration;
- destructive deletion;
- final diff integration;
- Gate, PR, merge and release decisions.

Recommended model: current GPT-5.6 Sol-capable Codex parent.

## Luna

Use Luna for fast, narrow, high-volume work:

- inventories;
- path and symbol mapping;
- source hashes;
- documentation and manifests;
- deterministic fixtures;
- repetitive case generation;
- log summarization.

Luna does not approve high-risk tasks or phase Gates.

## Terra

Use Terra when implementation judgment and edge-case reasoning matter:

- pure contract implementation;
- bounded feature implementation;
- legacy code adaptation;
- integration/failure tests;
- browser debugging;
- correctness review;
- first-line security review.

Terra is the default implementation and first-review layer. Terra does not issue final phase Gates.

## Sol

Sol is an independent read-only acceptance layer.

| Agent | Model | Effort | Purpose | Required result |
| --- | --- | --- | --- | --- |
| `sol_acceptance` | `gpt-5.6-sol` | `xhigh` | Completed high-risk task acceptance and critical E2E evidence | `ACCEPT` |
| `sol_architecture_security` | `gpt-5.6-sol` | `max` | Critical architecture/security/data/native/Agent/HA boundaries | `ACCEPT` |
| `sol_phase_gate` | `gpt-5.6-sol` | `max` | Whole-phase integrated Gate recommendation | `PASS_RECOMMENDED` |

Sol never:

- implements or fixes code;
- modifies evidence;
- signs commits;
- makes the final architecture/security decision;
- issues the final Gate;
- pushes, merges, releases or changes external systems.

The parent Codex makes the final engineering decision. HW-11 pilot and HW-12 production additionally require the named human owner.

## Task acceptance routing

| Task risk/type | First review | Required Sol route |
| --- | --- | --- |
| Low / medium | `terra_reviewer` | None at task level |
| High | `terra_reviewer` | `sol_acceptance` |
| Critical architecture/security | `terra_reviewer` + `terra_security` | `sol_architecture_security` |
| Critical E2E/acceptance evidence | `terra_reviewer` + `terra_security` | `sol_acceptance` |
| Final phase Gate | Terra review/security | Phase-specific Sol list including `sol_phase_gate` |

The exact route is recorded in every task YAML as:

```yaml
acceptance_tier: sol-acceptance
acceptance_agents:
  - terra_reviewer
  - sol_acceptance
acceptance_outcome: ACCEPT
```

## Phase Gate routing

Every phase requires `sol_phase_gate`. Additional Sol review:

| Phase | Required Sol phase agents |
| --- | --- |
| HW-00 | `sol_phase_gate` |
| HW-01 | `sol_architecture_security`, `sol_phase_gate` |
| HW-02 | `sol_architecture_security`, `sol_phase_gate` |
| HW-03 | `sol_architecture_security`, `sol_phase_gate` |
| HW-04 | `sol_acceptance`, `sol_phase_gate` |
| HW-05 | `sol_acceptance`, `sol_phase_gate` |
| HW-06 | `sol_acceptance`, `sol_phase_gate` |
| HW-07 | `sol_acceptance`, `sol_phase_gate` |
| HW-08 | `sol_architecture_security`, `sol_phase_gate` |
| HW-09 | all three Sol agents |
| HW-10 | `sol_acceptance`, `sol_phase_gate` |
| HW-11 | `sol_architecture_security`, `sol_phase_gate` |
| HW-12 | all three Sol agents |

## Concurrency

- maximum 8 total subagent threads;
- maximum 3 write agents;
- Sol agents are read-only and normally start after the final diff/evidence is frozen;
- task-level Sol reviews may run in parallel only when reviewing disjoint tasks and immutable commits;
- run one `sol_phase_gate` at a time;
- one writer for root manifest/lockfile;
- one writer for Prisma schema/migration;
- one writer for Event Catalog;
- one writer for a state machine;
- one writer for Tauri capability/security files.

## Independence

A Sol review must:

- inspect the final integrated diff, not an isolated worker branch unless the task explicitly ends there;
- use the same source/result commit or tree digest recorded in Evidence;
- not be performed by an agent that implemented the task;
- cite exact code, tests, logs and limitations;
- be rerun after any material code/evidence change.

## Failure and unavailable model

A Luna/Terra worker stops when:

- authority/security decision is unresolved;
- an unapproved dependency is needed;
- source provenance fails;
- allowed paths are insufficient;
- destructive data or external-system write is required;
- tests expose P0/P1 behavior.

If a required Sol model is unavailable:

- record the exact routing error;
- mark the task or phase acceptance `BLOCKED`;
- do not silently substitute Terra, Luna or another model;
- only the user may explicitly approve a routing change.
