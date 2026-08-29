# Optional Legacy Asset Adoption Matrix

Absence of a legacy checkout never blocks the Program. Every row below is a candidate optimization only; the default fallback is a clean reimplementation from target contracts and tests.

| Legacy asset | Decision | New target | Notes |
| --- | --- | --- | --- |
| `desktop-runtime` | COPY-ADAPT | `apps/desktop-shell` | Preserve security behavior and tests; rebind only |
| `hub-service` | COPY-ADAPT | `services/collaboration` | Keep event/inbox/todo/SSE modules |
| `hub-core/catalog/producer/relay` | EXTRACT-ADAPT | Hub contracts/client/outbox | Remove `hub-next` and generated source files |
| `hosp-access-service` and `hosp-*` | COPY-ADAPT | Hosp Access boundary | Keep controlled upstream access |
| `postgres-core/redis-core/time-core` | COPY-ADAPT | same logical packages | Rename scope, clean generated outputs |
| SSO/Identity code | EXTRACT | Gateway/Identity Adapter | Do not copy Next Portal UI or PostgreSQL Session |
| Permission SDK | EXTRACT | Authz Core | Remove Next-specific adapter |
| Tickets domain | EXTRACT | Tickets Service | Rebuild UI and migrations |
| Fee domain | EXTRACT | Fee Service | Rebuild UI and migrations |
| Smart Service | REFERENCE | Agent Gateway | New Harness/tool architecture |
| Clinical Spark | REFERENCE | Workspace build config | Do not copy product UI |
| Root Prisma schema/migrations | DO NOT COPY | clean `database/` | Requirements only |
| Phase scripts/evidence/issues | DO NOT COPY | new Program/Gates | Legacy archive only |
| Old Next UIs | DO NOT COPY | Workspace capabilities | New interaction model |
| `hub-next` | DO NOT COPY | `hub-client` | Workspace is Vite, not Next |
