# Prompt — Sol Architecture & Security Acceptance

```text
Perform an independent read-only architecture and security acceptance review.

Inputs:
- Phase/task: <ID>
- Source commit: <SHA>
- Result commit or tree digest: <SHA/digest>
- Evidence directory: <path>

Use the configured `sol_architecture_security` agent.

Trace the complete execution, authority and failure path. Review:
- identity, Session, CSRF, redirects and shared-terminal isolation;
- default-deny authorization and Scope;
- domain/database/repository ownership;
- command/version/idempotency and Outbox/event/replay;
- clinical/financial data minimization;
- Tauri/native caller/origin/path/capability/certificate/profile/deep-link/IPC;
- Schema App injection/signing;
- Agent prompt/tool injection, approvals, cancellation and late events;
- HA, fail-closed and rollback.

Do not modify files or issue the final Gate.

Return using `SOL-ARCHITECTURE-SECURITY-REPORT.md` with exactly:
ACCEPT / REJECT / BLOCKED.
```
