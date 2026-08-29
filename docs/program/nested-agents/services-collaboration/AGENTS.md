# AGENTS.md — Collaboration Platform

## Scope

Applies to `services/collaboration/**`.

## Authority

Collaboration owns durable events, inbox projection, todos, subscriptions, SSE delivery, read state, work-item coordination metadata, Harness execution records, decisions and handoffs. It does not own domain business state.

## Event rules

- At-least-once delivery is assumed.
- Every event has stable ID, type, schema version, source, occurred time, visibility, sensitivity and correlation/causation.
- Domain services write domain state and Outbox in one transaction.
- Collaboration consumers are idempotent.
- Reconnect recovers a durable gap before live delivery.
- Event cursor, read cursor and unread count are separate.
- Unknown versions are quarantined or safely summarized.
- Replays are deterministic and never re-execute domain commands.
- Projections can be rebuilt from authoritative events/snapshots.
- A notification is a projection, not business truth.

## Work-item and Harness rules

- Harness state is deterministic and server-owned.
- Model text or UI messages cannot self-declare completion.
- User decisions are immutable append-only facts that supersede model inference.
- Handoff includes source, target, context reference, expected output, due/timeout and decision provenance.
- Work-item state transitions are validated against registered state tables.
- Collaboration cannot directly mutate Ticket, Fee, Handover or Knowledge domain tables.

## Required tests

- duplicate, gap, out-of-order and replay;
- crash before/after Outbox publication;
- cursor concurrency and retention edge;
- deterministic projection hash;
- invalid state transition;
- user decision superseding Agent suggestion;
- cancellation and late event quarantine;
- sensitive event surface filtering.
