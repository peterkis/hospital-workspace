# AGENTS.md — Domain Services

## Scope

Template for `services/tickets/**`, `services/fee/**`, `services/handover/**`, `services/knowledge/**` and future business domains.

## Authority

Each domain owns its state machine, schema, repository, transaction, validation and business audit. Workspace, Collaboration and Agent Gateway may request commands and render projections, but cannot mutate domain tables directly.

## Write command requirements

Every mutating command:

- authenticates through the approved Gateway/service boundary;
- authorizes function and data Scope server-side;
- validates current state and expected resource version;
- uses stable command ID/idempotency key;
- is safe under retry and duplicate delivery;
- writes domain state and Outbox in one transaction;
- emits a registered versioned domain event;
- records an audit event without leaking sensitive data;
- returns explicit conflict/forbidden/invalid/expired results.

## Data boundaries

- No direct cross-domain writes.
- No UI imports.
- No public Prisma model leakage.
- No arbitrary Hosp/HIS calls outside approved adapters.
- Time and SLA use `time-core`.
- Patient data is minimized in events; notification summaries are generic.
- Repository interfaces are owned by the domain.
- Database migration belongs to the domain schema owner.

## Required tests

- complete state transition table;
- forbidden and empty Scope;
- duplicate command;
- concurrent expected-version conflict;
- transaction rollback;
- Outbox crash/retry;
- consumer dedup;
- audit and redaction;
- contract compatibility;
- service restart recovery.
