---
status: proposed
date: 2026-09-04
---

# ADR-0010: Adopt the MVP-04 local BFF prototype boundary

## Context and decision

The initial Preflight base was the MVP-03 main commit
`a427fd99067bf593db17ba8e29dd0c981a1c9815`, tree
`11efc1685b4deb95d78e749346f852776e3758c9`. Its candidate staged tree
`c26c0ad7dd2fe2b70dce7a3037fd542e770d5ca6` correctly returned `BLOCKED`
for `MVP04-GOV-01`. This resumed Preflight binds to governance main commit
`62e9724da85651a3f594cb698f5ddb820b0288ec`, tree
`2e25be26d2fe125d30b09a806c81baf4bac79cb6`. The only child workspace is
`apps/workspace-web`. Its synthetic Ticket reducer presently settles a local
timer and updates a browser projection. MVP-04 needs an observable typed HTTP
round trip, without moving Ticket authority into Gateway.

**CHOSEN_TOPOLOGY: A.** Keep the typed client in
`apps/workspace-web/src/platform/api/**`. The browser uses relative
`/api/mvp/*` requests through the Vite development proxy to a loopback Gateway.
Later implementation registers only `services/gateway` (`@hospital/gateway`),
bringing the child workspace count from one to two.

**REJECTED_TOPOLOGIES:** B adds a shared SDK without a present second consumer
and requires unresolved package ownership. C adds a cross-origin browser API
and CORS policy without a product need and diverges from ADR-0002's same-origin
direction. **packages/api-client is intentionally deferred:** one browser
consumer does not justify another workspace yet.

## Same-origin and typed HTTP boundary

The documented development entry is `http://localhost:5173`. Vite binds to
`localhost`, uses a strict port, and proxies only `^/api/mvp/` to the fixed
`http://[::1]:3001` Gateway. Gateway binds only to IPv6 loopback `::1`. Product
source contains neither origin; fetch is confined to the app-local transport
module, with fixed relative targets and no endpoint parameter. No CORS plugin,
wildcard origin, credential forwarding, arbitrary proxy destination or outbound
upstream request is introduced. Vite's own development/HMR transport is outside
browser product source and is not an application WebSocket capability.
The public network scanner rejects numeric IPv4 loopback references. IPv6
loopback is explicit and supported by the current checks; no scanner exemption
or encoded address is introduced. If IPv6 loopback is unavailable, startup
fails; there is no wildcard or alternate-address fallback.

Only three endpoints are planned: process-only `GET /healthz`,
`GET /api/mvp/bootstrap?persona=reporter|engineer`, and
`POST /api/mvp/commands`. Bootstrap returns synthetic persona, role, scope and
Ticket capability presentation. Commands return deterministic synthetic
`accepted`, `rejected` or `conflict` receipts. Unknown and malformed input fails
closed with a bounded, public-safe error. The precise shapes, constraints and
error precedence are in the [preflight](../program/mvp/MVP-04-ARCHITECTURE-PREFLIGHT.md)
and [machine-readable boundary](../program/mvp/MVP-04-PROTOTYPE-BOUNDARY.yaml).

## Authority and persona limits

`reporter` and `engineer` are explicitly selectable synthetic perspectives.
Their roles/scopes are fixed presentation constraints, never authenticated
Principal, real role assignment, server Authz, security Scope or Session.
Every API/UI surface identifies the local synthetic, non-production boundary.

Gateway validates HTTP shape and the fixed persona/action matrix. It compares
the two version numbers submitted by the browser; neither is a server-known
Ticket version. Gateway holds no Ticket aggregate, transition table,
repository, durable receipt/idempotency store, event store, Outbox or Session.
Identical envelopes yield identical receipts without remembering past calls.

The browser retains temporary, non-authoritative Ticket projection state. Only
a validated receipt matching the pending command and current local context may
be interpreted by its local reducer. `receipt.accepted` does not mean domain
completed. Production final-state confirmation still requires a domain event,
as in EVENT-COMMAND-PROTOCOL.md. In MVP-05, `services/tickets` will own the
in-memory prototype aggregate, transitions, version and idempotency decisions;
Gateway remains transport. Production authority stays with the independent
domain services under ADR-0004.

## Dependencies and tooling

Plan Fastify as the sole new runtime dependency, with its exact release pin
resolved and reviewed during implementation. Use native Node 24.18.0 erasable
TypeScript, Node's test runner and Fastify injection. Reuse root TypeScript
7.0.2 through pnpm 11.17.0's root script PATH; do not add a TypeScript runner.
An explicit Gateway dev dependency on an exact reviewed Node-24-compatible
`@types/node` release is also required. Type stripping does not provide these
declarations. No frontend dependency is added.

The existing policy permits Fastify but rejects `@types/node` in a
platform-service manifest, including devDependencies. The planned policy delta
is only adding `@types/node` to that layer's allowlist. The existing DAG test's
one-workspace assertion must become an exact two-workspace assertion. Root
quality scripts must explicitly run both workspaces; the workspace checker
validates script presence but does not execute child quality scripts.

## Ownership, review and implementation hold

Gateway remains the critical path of `identity-access-owner`, with
`security-reviewer` and `architecture-reviewer`; this ADR reassigns no owner and
does not downgrade that path. The api-client ownership gap is avoided by
minimal topology; no ownership mutation is required for that package.

`MVP04-GOV-01` is **RESOLVED**. Governance PR
[#13](https://github.com/peterkis/hospital-workspace/pull/13), implementation
commit `970369d613cbb7da0eb2a532479690007b963612`, merged as
`62e9724da85651a3f594cb698f5ddb820b0288ec`. Main CI run `33931625052`
completed successfully on that exact commit. The byte-identical ownership
mirrors now contain exactly one explicit rule for
`docs/governance/DEPENDENCY-POLICY.yaml`: owner `toolchain-owner`, reviewers
`architecture-reviewer`, `supply-chain-reviewer` and `security-reviewer`, risk
`critical`.

The governance PR established who may review a future Dependency Policy change.
It did **not** approve Fastify, `@types/node`, any dependency version, Gateway
implementation, Identity, Session or authorization. The future policy change
remains critical reviewed work and is part of MVP04-I01, not this Preflight.

This ADR is a proposed prototype plan. Preflight disposition is
**READY_FOR_IMPLEMENTATION**, which means only MVP04-I01 becomes eligible after
this resumed Preflight is committed, reviewed through GitHub, merged to main and
main CI succeeds. It does not start MVP-04 or authorize implementation. Both
required read-only Terra reviews bind externally to the final staged tree. No
review receipt is added to the tree it reviews. No Sol route is invoked:
accepted canonical architecture and SECURITY-BOUNDARIES.md require no change.
A discovered need to change either instead requires stopping with
`SOL-ROUTE-REQUIRED`.

## Consequences, security limitations and rollback

The prototype duplicates a tiny transport shape on either side of HTTP.
Runtime conformance and independent fixtures are preferred over a premature
canonical contract package. This does not satisfy HW02-01, HW02-03 or HW05-05.
It offers no real authentication, private-network protection, shared-session
isolation, persistent Ticket truth or multi-browser synchronization.

Only the MVP-04 overlay section is narrowed for app-local transport and its
fixed Vite proxy. The slice remains `not-started`. No product source, manifest,
lock, policy or ownership file is changed by this planning task.

Before implementation, rollback is withdrawal of this planning candidate with
the owner's direction. A later implemented slice can be reverted as one
reviewed change, restoring MVP-03 code, manifest/lock and proxy configuration
together. There is no data migration or recovery claim. Runtime transport
failure must never silently fall back to local acceptance. This is entirely
public-synthetic planning, with no pilot, production or canonical Gate approval.
