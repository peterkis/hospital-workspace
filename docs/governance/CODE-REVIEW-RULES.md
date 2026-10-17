# Code Review Rules

## Review order

1. unauthorized access, data loss or sensitive leakage;
2. Session, authz, Scope, Tauri and Agent tool boundaries;
3. state machine, concurrency, idempotency and money/time correctness;
4. Outbox, replay, duplicate delivery and stale projections;
5. migration provenance and generated-file contamination;
6. rollback and recovery;
7. missing tests and evidence;
8. dependency direction and maintainability;
9. style only when it hides a real defect.

## First review

`terra_reviewer` and, where required, `terra_security` inspect the final integrated diff.

A finding includes:

- severity;
- file/symbol;
- observable impact;
- reproduction or failing invariant;
- safe direction;
- required test.

## Boundary-change review

For browser transport, source scanners, public-data filters, proxy boundaries,
native bridges, or other deny-by-default controls, review the threat-surface
inventory before the implementation details. Confirm that discovery covers
every production source family and that newly discovered surfaces fail closed.
Prefer syntax-aware inspection and explicit allowlists; a growing set of regex
patches is not evidence of complete coverage.

Focused tests prove only their fixtures. Require independent review against the
final tree and preserve the statement that a static scanner is a regression
guard, not a runtime sandbox.

## UI interaction review

Trace every accepted user-visible requirement to a behavior test, browser
observation, or explicit non-applicability decision. For keyboard and
navigation changes, compare persisted state with the surface actually rendered.
Review search/filter/favorites cleanup, pending cancellation, Escape scope,
sidebar close, focus restoration, accessible name/current state, and
exceptional states as one transition matrix.

## Result and Evidence review

Do not infer a verdict from an exit code alone. Distinguish an expected TDD RED,
no-match search, pending external check, infrastructure failure, test assertion
failure, and test process that never started. Bind screenshots, logs, CI and
review receipts to the exact final commit or tree, and invalidate them after a
material change.

For known examples and recovery patterns, read
`../retrospectives/README.md`.

## Sol independent acceptance

- High-risk tasks require `sol_acceptance`.
- Critical architecture/security tasks require `sol_architecture_security`.
- Every phase requires `sol_phase_gate`.
- The exact route is defined in task YAML.
- Sol reviews are read-only and bound to the final commit/tree.
- Any material change invalidates the Sol report.
- Missing/rejected/blocked required Sol review prevents PASS.

## Authority

Reviewers are advisory. Parent Codex signs the engineering Gate. The named human owner signs pilot/production.

High-risk changes require implementation and acceptance agents to differ.
