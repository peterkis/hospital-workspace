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
