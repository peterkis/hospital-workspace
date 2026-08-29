# Sol Acceptance Policy

## Purpose

Sol provides an independent, read-only acceptance layer between Terra implementation/review and the parent Codex Gate decision.

It exists to reduce four failure modes:

1. the implementation agent reviewing its own assumptions;
2. locally correct changes violating system-wide authority boundaries;
3. phase evidence being incomplete, stale or bound to the wrong commit;
4. a parent Gate relying only on subagent summaries rather than code and receipts.

## Agents

### `sol_acceptance`

Use for high-risk work packages and critical E2E/acceptance evidence.

It evaluates:

- acceptance criteria against observable behavior;
- negative and edge-case coverage;
- concurrency, idempotency, replay and recovery;
- rollback;
- evidence truth and environment limitations.

Outcome: `ACCEPT`, `REJECT` or `BLOCKED`.

### `sol_architecture_security`

Use for critical architecture/security work:

- identity, Session, authorization and Scope;
- database/repository/data authority;
- Tauri/WebView2/native IPC;
- event/Outbox/replay;
- clinical and financial writes;
- Schema App execution boundary;
- Agent Tool Registry;
- HA, split brain and production release.

Outcome: `ACCEPT`, `REJECT` or `BLOCKED`.

### `sol_phase_gate`

Use exactly once per final integrated phase state, after all declared task reviews are complete.

It checks:

- all work packages and dependencies;
- cross-task consistency;
- required Terra/Sol reports;
- evidence and artifact hashes;
- rollback/recovery;
- P0/P1 closure;
- phase scope and future-phase leakage.

Outcome: `PASS_RECOMMENDED`, `CONDITIONAL_RECOMMENDED` or `BLOCKED`.

## Authority

Sol recommendations are mandatory evidence where declared, but advisory with respect to project authority.

- Parent Codex issues the engineering Gate.
- Human owner issues pilot/production authorization.
- A parent cannot mark PASS when a required Sol report is missing, stale, `REJECT` or `BLOCKED`.
- A parent may reject a Sol `PASS_RECOMMENDED` when other evidence fails.
- A Sol report never authorizes merge, release, data migration or external-system writes.

## Commit binding

Every Sol report records:

- phase/task ID;
- source commit;
- result commit or tree digest;
- reviewed diff range;
- evidence manifest hash;
- model/agent;
- outcome;
- findings;
- untested environments;
- timestamp.

Any material change after review invalidates the report.

## Cost control

Do not run Sol for exploratory, documentation-only, fixture-generation or routine low/medium tasks.

Use:

- Terra for normal first review;
- Sol task review only where the task YAML declares it;
- one Sol phase Gate after integration;
- architecture/security Sol only where the phase/task matrix requires it.

## No silent substitution

The agent files pin `gpt-5.6-sol`. If it is unavailable, acceptance is `BLOCKED` until the user explicitly changes the routing configuration.
