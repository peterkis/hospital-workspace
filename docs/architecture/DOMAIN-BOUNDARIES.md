# Domain and Service Boundaries

## Gateway

Owns:

- login/callback/logout/switch-person;
- Redis Session;
- CSRF;
- Principal;
- Authz and Scope;
- Capability Registry;
- same-origin BFF routes;
- command ingress and context resolution.

Does not own:

- Ticket/Fee/Handover state;
- Event Store;
- Agent Run;
- Knowledge content.

## Collaboration Service

Owns:

- Event Store;
- Catalog enforcement;
- Inbox and Todo projections;
- SSE and replay;
- Work Item projections;
- Harness;
- Decisions;
- Handoffs;
- command receipts.

Does not write domain tables, import a domain repository or decide whether a Fee or Ticket transition is valid. It consumes registered contracts, commands and events; its projections never become domain truth.

## Hosp Access

Owns controlled access to HIS and other upstream services:

- credentials and transport;
- timeout/retry/circuit policy;
- request/response contracts;
- audit and redaction;
- fake upstream for tests.

Domain services decide business meaning.

## Tickets

Owns Ticket, Incident, participants, SLA, attachments and state machine.

## Fee

Owns platform-side fee commands and receipts. The upstream HIS remains authoritative for the clinical/financial source state.

## Handover

Owns shift sessions, items, revisions and acknowledgements.

## Agent Gateway

Owns provider calls, Run/Task/Attempt, Coordinator/Worker, Tool Registry, Approval integration, cost and cancellation.

It cannot write domain databases or import domain repositories. Domain effects travel through server-authorized commands/events and retain the owning domain's state and authorization checks.

## Knowledge

Owns sources, nodes, relations, versions, reviews, scope, active/retired and publication state. Search indexes are derived.

## Database ownership

| PostgreSQL schema | Owner |
| --- | --- |
| `iam` | Gateway/Identity |
| `config` | Gateway/Registry/Authz |
| `audit` | shared audit repositories |
| `collab` | Collaboration |
| `ticket` | Tickets |
| `fee` | Fee |
| `handover` | Handover |
| `agent` | Agent Gateway |
| `knowledge` | Knowledge |

Cross-domain reads and writes use APIs/events, not raw table access.

## Repository boundary

Each persistence adapter is an owner-bound package named `packages/<owner>-repository`; for example, `packages/ticket-repository` is owned by `services/tickets`. A service may depend only on its own repository. Neither another domain service, Collaboration nor Agent Gateway may import a domain repository or its database/model paths. Platform-owned adapters such as `collaboration-repository`, `agent-repository`, `gateway-repository` and `hosp-access-repository` remain limited to their matching platform service; they never create a cross-domain database seam. Repositories may reach `database-runtime`, pure contracts and explicitly approved kernels; services do not reach raw database runtime as a substitute.

The DAG checker records this before database workspaces exist. Its Prisma/model checks are fixture-backed policy enforcement at this stage, not a claim that a future production Prisma implementation is already inspected.
