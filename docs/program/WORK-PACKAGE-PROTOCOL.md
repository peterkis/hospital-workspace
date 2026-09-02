# Work Package Protocol

## YAML shape

```yaml
id: HWxx-yy
title: ...
primary_owner: terra_worker
supporting_agents: []
execution_mode: workspace-write
parallel_group: A
risk: high
depends_on: []
allowed_paths: []
objective: ...
steps: []
validation: []
acceptance: []
acceptance_tier: sol-acceptance
acceptance_agents:
  - terra_reviewer
  - sol_acceptance
acceptance_outcome: ACCEPT
evidence: []
stop_if: []
```

## Acceptance tiers

| Tier | When | Required route |
| --- | --- | --- |
| `terra` | Low/medium task | Terra reviewer |
| `sol-acceptance` | High-risk or critical E2E task | Terra review, then `sol_acceptance` |
| `sol-architecture-security` | Critical architecture/security task | Terra review/security, then `sol_architecture_security` |
| `sol-phase-gate` | Final task of each phase | Phase-specific Sol list including `sol_phase_gate` |

## Size

A good package:

- changes one owning boundary;
- has one primary behavior;
- has a test entry point;
- can be reviewed in one diff;
- can be reverted;
- does not require the agent to invent architecture;
- has one explicit acceptance route.

Split a package if it changes frontend, database, Session, Tauri and Hub together.

## Parent intake

Before work:

1. Check task dependencies.
2. Check current code, not only planning text.
3. Create path lock.
4. Confirm no user dirty files.
5. Decide which contracts are frozen.
6. Decide exact commands and environments.
7. Confirm the task's acceptance tier and agents.
8. Spawn implementation/testing agents.

After implementation:

1. Inspect actual integrated diff.
2. Reject scope creep.
3. Run critical commands again.
4. Resolve cross-agent semantic conflicts.
5. Run Terra reviewer/security.
6. Freeze result commit/tree digest and Evidence.
7. Run task-level Sol review declared by YAML.
8. Rework and rerun reviews if Sol rejects/blocks.
9. After all tasks pass, run phase-level Sol agents and `sol_phase_gate`.
10. Parent records Evidence and issues final Gate.

## Lean Evidence route

- Low-risk documentation packages normally use one implementation commit, GitHub `checks`, and a read-only Terra receipt bound to the result. Do not require a committed Evidence directory or per-Markdown hash manifest unless the task declares a durable domain, security, migration, database, release, product, or compliance artifact.
- Medium-risk packages use targeted local tests, full CI, and `terra_reviewer` bound to the final PR head SHA or staged tree. CI artifacts and PR metadata are the normal Evidence; the reviewer receipt stays outside the reviewed tree.
- High/critical packages and phase exits retain their declared structured Evidence, rollback/negative/recovery evidence, and Terra/Sol routing. `sol_phase_gate` remains required at phase exit.
- Do not rerun the same full suite locally and remotely without a target-environment, CI-failure, changed-result, or explicit-task reason.

## Independence

- Acceptance agents do not edit the reviewed task.
- Sol reports cite actual code, tests and evidence.
- Sol reports are invalid after material changes.
- Required Sol reports cannot be replaced by worker summaries.
- Parent can reject a Sol recommendation but cannot ignore a missing/rejected/blocked required review and still issue PASS.
