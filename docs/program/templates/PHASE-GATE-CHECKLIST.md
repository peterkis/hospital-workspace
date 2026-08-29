# Phase Gate Checklist

## Source

- [ ] Correct phase and task manifests loaded.
- [ ] Dependencies are PASS.
- [ ] Branch, HEAD and worktree recorded.
- [ ] No unknown user changes.
- [ ] Final result commit/tree digest is frozen before acceptance review.

## Scope

- [ ] Actual diff is within allowed paths.
- [ ] No legacy compatibility or hidden fallback.
- [ ] No unregistered legacy copy.
- [ ] No unrelated dependency or formatting changes.
- [ ] No future-phase scope was imported.

## Quality

- [ ] Targeted tests.
- [ ] Negative tests.
- [ ] Permission/Scope tests.
- [ ] Concurrency/idempotency tests where applicable.
- [ ] Failure/recovery/rollback tests.
- [ ] Lint/typecheck/test/build.
- [ ] Contract/catalog/database/dependency checks.
- [ ] `git diff --check`.

## Platform

- [ ] Browser evidence where applicable.
- [ ] Windows Tauri/WebView2/MSI where applicable.
- [ ] Physical/approved Anolis where applicable.
- [ ] Environment limitations stated.

## Security and privacy

- [ ] Secrets scan.
- [ ] Sensitive-data scan.
- [ ] Tauri/native boundary.
- [ ] Agent tool boundary.
- [ ] Audit/redaction.

## Terra review

- [ ] `terra_reviewer` completed.
- [ ] `terra_security` completed where required.
- [ ] Reports are bound to the final result commit/tree digest.

## Sol task acceptance

- [ ] Every task's declared `acceptance_agents` ran.
- [ ] High-risk tasks received `sol_acceptance`.
- [ ] Critical architecture/security tasks received `sol_architecture_security`.
- [ ] Critical E2E tasks received the declared Sol route.
- [ ] Required outcomes are present.
- [ ] Material changes after review triggered re-review.

## Sol phase acceptance

- [ ] All phase-specific Sol agents ran.
- [ ] `sol_phase_gate` ran against the final integrated diff/evidence.
- [ ] `sol_phase_gate` returned `PASS_RECOMMENDED` for PASS.
- [ ] Sol reports contain no unresolved REJECT/BLOCKED.
- [ ] Sol unavailability was not silently substituted.

## Evidence

- [ ] Manifest validates.
- [ ] Commands and exit codes exist.
- [ ] Raw logs exist.
- [ ] Artifact hashes exist.
- [ ] Negative scenarios exist.
- [ ] Rollback evidence exists.
- [ ] Terra and Sol reports exist.
- [ ] P0 = 0.
- [ ] P1 = 0.

## Decision

- [ ] Parent PASS
- [ ] Parent CONDITIONAL
- [ ] Parent BLOCKED
- [ ] Human pilot/production approval recorded where required
