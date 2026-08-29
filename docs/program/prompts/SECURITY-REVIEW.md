# Prompt — Security Review

```text
Perform layered read-only security review of the specified final diff.

1. Run terra_security for concrete implementation-level threat review.
2. If the task/phase matrix declares critical architecture/security acceptance, run sol_architecture_security against the same final commit/tree and evidence.
3. For a phase exit, preserve both reports for sol_phase_gate.

Review:
- identity/session/CSRF/authz/Scope;
- sensitive patient/clinical/financial data;
- domain/database authority;
- command/idempotency/Outbox/replay;
- Tauri/native/certificate/profile/deep-link/IPC;
- Schema App injection;
- Agent tool/prompt injection, approval, cancellation and late results;
- HA/fail-closed/rollback;
- evidence truth.

Do not edit code. Report P0/P1/P2/P3 and untested environments.
A Sol ACCEPT is required where declared but does not replace the parent/human decision.
```
