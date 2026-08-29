# Security Boundaries

## Trust zones

1. Managed workstation OS and Tauri binary.
2. Remote same-origin Workspace Web.
3. Gateway/BFF and platform services.
4. Domain services.
5. PostgreSQL/Redis/object storage.
6. Hospital upstream systems.
7. External/internal model providers.

## Browser/Desktop

- Remote Workspace has no generic native permission.
- Rust does not read web Session or model keys.
- Exact origin/path/label and immutable release.
- CSP, download/iframe/new-window/navigation denial.
- InPrivate launch-scoped Profile.
- Lock/resume privacy gate.
- Deep links are references, not data.

## Data

- minimum necessary display;
- server-side Scope;
- no patient data in generic notifications;
- no sensitive localStorage;
- no real data in tests/evidence;
- structured log redaction;
- object access authorized each time;
- database TLS and backup protection.

## Agent

- no generic escape tools;
- untrusted prompt and tool result;
- provider secrets server-side;
- user approval for writes;
- cancellation and late-result quarantine;
- audit and cost limits;
- no chain-of-thought dependency.

## Supply chain

- exact Node/pnpm;
- one lockfile;
- lifecycle allowlist;
- dependency review;
- signed/hash-bound releases;
- no-egress server assembly;
- MSI and WebView2 lifecycle;
- secret and generated-file scans.

## Fail closed

Fail closed for:

- unknown identity;
- Redis Session unavailable;
- invalid Scope;
- unknown capability/card/event/tool;
- native caller mismatch;
- audit failure on required security event;
- certificate mismatch;
- unsupported client/release version;
- unverified migration source.
