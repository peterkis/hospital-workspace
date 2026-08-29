# Person, Event, Work Item and Context Model

## 1. Person-centered entry

The home screen is not an app catalog. It is a projection for the signed-in person:

```text
My Inbox
My Todos
My Active Work
My Recent Threads
My Decisions
My Agent Runs
My Knowledge Reviews
```

`Person` is not the same as an OIDC subject:

- ExternalIdentity authenticates.
- Person represents a hospital individual.
- Employment and membership represent organizational relationships.
- Principal is the request-time authorization snapshot.
- Actor identifies who or what caused an event.

## 2. Event

An Event states that something already happened.

```ts
type EventEnvelopeV1<T> = {
  eventId: string;
  eventType: string;
  schemaVersion: 1;
  aggregate: { type: string; id: string; version: number };
  actor: ActorRef;
  context: ContextRef[];
  correlationId: string;
  causationId?: string;
  traceId: string;
  occurredAt: string;
  recordedAt: string;
  sensitivity: Sensitivity;
  payload: T;
};
```

An Event is immutable. Corrections use a new event.

## 3. Command

A Command requests a state change.

```ts
type CommandEnvelopeV1<T> = {
  commandId: string;
  commandType: string;
  target: { type: string; id: string };
  expectedVersion?: number;
  idempotencyKey: string;
  actor: PrincipalRef;
  context: ContextRef[];
  traceId: string;
  input: T;
};
```

A Command can be accepted, rejected, conflicted, pending or unknown. HTTP success alone is not business completion.

## 4. Work Item

A Work Item answers:

- who owns the next action;
- why it exists;
- what source business instance it references;
- what status is projected;
- what is due;
- which context is needed;
- what decision or information is missing.

It does not own Ticket/Fee/Handover business truth.

## 5. Thread and Activity

A Thread is the durable collaboration timeline for:

- a Ticket;
- a Fee confirmation;
- a Handover session;
- a Department matter;
- an Agent Run;
- a Knowledge Project.

Activity can originate from:

- person;
- system;
- domain service;
- Agent;
- Decision;
- Handoff;
- attachment;
- error/retry.

Every activity preserves its source event or command receipt.

## 6. Context

ContextRef is a typed pointer:

```text
person
organization
campus
department
location
patient
episode
asset
project
knowledge-node
```

Sensitive details are resolved on demand by the owning service after authorization. Context is not copied into every event or local client cache.

## 7. My Todos and My Messages

Inbox and Todo are different:

- Inbox: information delivered to a person.
- Todo: an explicit pending responsibility or decision.
- Work Item: the tracked collaboration unit.
- Domain state: the authoritative business state.

One Event may create an Inbox entry without creating a Todo. A resolved domain event can close a Todo without deleting its history.
