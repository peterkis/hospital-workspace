# Luna / Terra / Sol Subagent Orchestration

## Standard flow

```text
Parent reads task and freezes decisions
  -> Luna explorer/inventory
  -> Terra contracts (when needed)
  -> Terra worker/migrator
  -> Luna fixtures and Terra tester
  -> Parent integrates actual diff
  -> Terra reviewer/security
  -> Task-level Sol acceptance declared by matrix
  -> Phase-level Sol acceptance declared by phase policy
  -> sol_phase_gate
  -> Parent issues final Gate
  -> Human approves pilot/production when required
```

## Work package minimum

Every spawn includes:

- task ID;
- one outcome;
- dependencies;
- allowed read paths;
- allowed write paths;
- frozen architecture decisions;
- steps;
- validation;
- evidence;
- acceptance tier;
- acceptance agents;
- required acceptance outcome;
- done criteria;
- stop conditions;
- required return format.

“Implement this phase” is not a valid subagent work package.

## Write locks

The parent maintains:

| Path/glob | Task | Agent | Status |
| --- | --- | --- | --- |
| example | example | example | queued/active/review |

Overlapping files are one writer at a time.

## Acceptance locks

- Sol agents are read-only.
- Sol reviews begin only after the reviewed diff and evidence are frozen.
- A material change invalidates prior Sol reports.
- Task-level Sol reviews may run in parallel only for disjoint immutable task results.
- Only one `sol_phase_gate` runs for a phase.
- The implementation agent cannot act as the acceptance agent.

## Risk routing

| Work type | Route |
| --- | --- |
| Low / medium | Terra first review only |
| High | Terra review → `sol_acceptance` |
| Critical architecture/security | Terra review/security → `sol_architecture_security` |
| Critical E2E/acceptance evidence | Terra review/security → `sol_acceptance` |
| Phase exit | phase-specific Sol agents → `sol_phase_gate` → parent Gate |

## High-risk parent-led work

- identity/session/authz/scope;
- Prisma baseline/migrations/rebuild;
- Tauri/native bridge/certificate/Profile;
- Event/Outbox authority changes;
- Agent Tool Registry;
- fee/clinical safety;
- release/HA/deletion;
- Gate and merge decisions.

Luna/Terra support implementation and first review. Sol independently evaluates the frozen result. None of them own the final parent/human decision.

## Required return

Luna/Terra:

```markdown
## Scope completed
## Files read
## Files changed
## Implementation or findings
## Commands run
## Tests and evidence
## Risks and unresolved
## Parent handoff
```

Sol acceptance reports use the dedicated templates:

- `SOL-TASK-ACCEPTANCE-REPORT.md`
- `SOL-ARCHITECTURE-SECURITY-REPORT.md`
- `SOL-PHASE-GATE-REPORT.md`

## Failure handling

- Model unavailable: report exact routing failure.
- Required Sol unavailable: `BLOCKED`; no silent substitution.
- Path expansion required: stop.
- Dirty user file: stop or exclude.
- Source hash mismatch: stop migration.
- Required environment absent: `NOT_RUN/BLOCKED`.
- P0/P1 discovered: stop implementation and escalate.
- Material change after Sol review: invalidate and rerun the review.
