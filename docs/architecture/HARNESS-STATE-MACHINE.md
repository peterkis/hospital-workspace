# Harness, Decision and Handoff State Machine

## Harness purpose

Harness provides deterministic task mechanics around flexible human and Agent behavior.

It guarantees:

- every task has an envelope;
- every attempt is recorded;
- every status transition is valid;
- every user decision is durable;
- every handoff is traceable;
- completion is validated;
- restart and replay preserve state.

## Task states

```text
draft
  -> queued
  -> running
      -> waiting_user
      -> blocked
      -> succeeded
      -> failed
      -> cancelled
```

Only registered transitions are allowed.

## Completion

A task is `succeeded` only when:

- required outputs exist;
- validators pass;
- mandatory decisions are approved;
- required child tasks are complete;
- no blocking error remains.

An Agent sentence such as “completed” is only content.

## Decision states

```text
proposed -> pending -> approved/rejected/expired
approved -> executed
```

Approval binds:

- exact action/tool/command;
- impact summary;
- actor;
- scope;
- expected version;
- expiry;
- evidence.

## Handoff

A Handoff records:

- source actor/task;
- target actor/task;
- reason;
- context references;
- completed work;
- pending work;
- assumptions;
- evidence/artifacts;
- accepted/rejected/requested changes.

## Cancellation

Cancellation:

- changes the authoritative state;
- signals active workers/tools;
- rejects new side effects;
- quarantines late results;
- preserves partial artifacts and audit.
