# Event, Command and Projection Protocol

## Event Catalog

Every published event is registered before production use.

Required catalog fields:

- event type;
- schema version;
- owner;
- payload schema;
- aggregate type;
- default sensitivity;
- allowed visibility;
- consumers;
- compatibility policy;
- retirement status.

## Transactional Outbox

```text
Domain command
  -> validate Principal / Scope / state / version
  -> domain transaction
       - update aggregate
       - insert Outbox event
  -> commit
  -> Relay
  -> Collaboration ingest
  -> Event Store
  -> Inbox/Todo/WorkItem/Activity projections
  -> SSE
```

The Relay may deliver more than once. Consumers deduplicate by eventId.

## Causality

- `traceId`: end-to-end technical trace.
- `correlationId`: business flow or user request.
- `causationId`: event/command that directly caused this event.
- `commandId`: stable command identity.
- `aggregateVersion`: optimistic concurrency and ordering within an aggregate.

## Replay

- Event Store is durable.
- Projection version is recorded.
- A projection can be rebuilt from events.
- Unknown event versions are quarantined.
- Replay never calls external side effects.
- Notifications and Agent tools are not re-executed during replay.

## SSE

- One connection per Workspace session.
- SSE is a live transport, not the archive.
- Client cursor is non-sensitive.
- Reconnect calls a durable gap endpoint.
- `Last-Event-ID` may be used but is not the only recovery mechanism.
- Duplicate events are normal and must be harmless.

## Command receipts

```text
submitted
accepted
rejected
conflict
pending_external
unknown_external_result
completed
```

A domain event, not a local button click, resolves final state.
