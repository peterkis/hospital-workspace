# Hospital Workspace Program

## Read order

1. Repository root `AGENTS.md`
2. `ROADMAP.md`
3. `GATES.md`
4. `../governance/MODEL-ROUTING.md`
5. `../governance/SOL-ACCEPTANCE-POLICY.md`
6. active phase document
7. active phase task YAML
8. applicable architecture, migration and ADR documents
9. nearest nested `AGENTS.md`

## Task IDs

The new repository uses `HW-00` through `HW-12`. Legacy Phase and Issue numbers are not active tasks.

## Parent/subagent split

- Parent Codex: architecture, security, database, native, integration and final Gate.
- Terra: contracts, implementation, migration, integration tests, first-line review and security review.
- Luna: inventory, exploration, fixtures, docs, hashes and repetitive cases.
- Sol: independent high-risk acceptance, architecture/security acceptance and phase Gate recommendation.

Sol is read-only. Required Sol reviews are recorded in each task YAML through `acceptance_tier`, `acceptance_agents` and `acceptance_outcome`.

## Acceptance chain

```text
Luna/Terra implementation support
  -> targeted and failure tests
  -> parent integrated diff review
  -> Terra reviewer/security
  -> declared task-level Sol acceptance
  -> declared phase-level Sol reviews
  -> sol_phase_gate
  -> parent PASS/CONDITIONAL/BLOCKED
  -> human pilot/production decision where required
```

A missing, stale, rejected or blocked required Sol report prevents task/phase acceptance. Sol never replaces the parent or human authority.

## Current phase

A repository implementation must explicitly record the current phase and last PASS Gate in `docs/program/STATUS.md`. The package does not pre-mark any Gate as passed.

## No background assumptions

No legacy source is required. Knowe is pinned only as a public interaction/mechanism reference. If the owner enables an optional local legacy source, its full commit must be recorded in ignored local configuration and in a migration receipt; absence of that source never blocks implementation from the target contracts.
