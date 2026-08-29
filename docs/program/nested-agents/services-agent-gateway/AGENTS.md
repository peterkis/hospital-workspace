# AGENTS.md — Agent Gateway

## Scope

Applies to `services/agent-gateway/**`.

## Mission

Provide server-side Coordinator/Worker collaboration with a deterministic Harness. The Agent system advises, decomposes, executes approved tools and records evidence; it does not become an uncontrolled operating system or a source of clinical truth.

## Default tool posture

Forbidden by default:

- generic shell;
- raw SQL;
- arbitrary HTTP;
- direct database access;
- unrestricted browser automation;
- client filesystem;
- arbitrary code execution;
- unrestricted email or external messaging;
- patient context without explicit minimized authorization.

Allowed tools are versioned, typed, risk-classified adapters to approved hospital services.

## Execution rules

- Only provider-native structured tool calls can request tools.
- Plain text, Markdown, XML or JSON-like text never triggers execution.
- Every run/task/attempt/tool call is bound to principal, Scope, correlation, risk and audit.
- Read-only tools are default.
- Risky writes enter `waiting_approval`.
- Approval is exactly-once, expires and is checked again before execution.
- Cancellation prevents late provider/tool events from reviving the run.
- Harness, not the model, determines completed/failed/blocked/waiting states.
- Provider keys and prompts remain server-side.
- Agent results identify evidence, uncertainty and provenance.
- No chain-of-thought storage or display is required; store concise rationale and evidence instead.

## Coordinator/Worker rules

- Coordinator decomposes and assigns; Workers execute bounded tasks.
- Workers cannot expand their tool set or Scope.
- Cross-domain work uses Handoff records, not hidden shared mutable memory.
- User decisions override Agent inference.
- Domain service remains authoritative for every business mutation.

## Required tests

- fake text tool-call injection;
- unknown tool;
- wrong Scope;
- replay and idempotency;
- approval race and expiry;
- cancellation with late response;
- provider timeout and restart recovery;
- prompt/tool-output injection;
- sensitive data minimization;
- audit completeness and redaction.
