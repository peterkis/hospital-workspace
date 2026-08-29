# Coordinator / Worker Agent Architecture

## Coordinator

The Coordinator:

- translates a user goal into a bounded plan;
- creates Task Envelopes;
- assigns specialized Workers;
- defines allowed tools and context;
- manages dependencies and resource locks;
- requests user decisions;
- summarizes verified results.

The Coordinator cannot grant itself new permissions or claim a Worker succeeded without evidence.

## Worker

Workers may represent:

- ticket triage;
- document parsing;
- terminology normalization;
- FHIR mapping;
- quality checking;
- knowledge review proposal;
- report generation.

Each Worker has:

- a role description;
- input schema;
- output schema;
- tool allowlist;
- context limit;
- completion validator;
- timeout/retry policy.

## Tool execution

Only provider-native structured tool calls are accepted.

A tool is registered with:

```text
name/version
input/output schema
owner
permission
scope
risk
idempotency
timeout
audit policy
```

No generic Shell, SQL, HTTP, filesystem or browser tool exists in production.

## Approval tiers

| Risk | Behavior |
| --- | --- |
| R0 read-only public/internal | may run after server authorization |
| R1 user-scoped read | may run after server authorization |
| R2 reversible write | explicit user approval |
| R3 high-impact or cross-scope write | enhanced approval or prohibited |
| R4 clinical/financial irreversible | prohibited for autonomous Agent |

## UI

Agent collaboration appears in the same Thread model:

- plan;
- tasks;
- Worker progress;
- tool cards;
- decisions;
- handoffs;
- artifacts;
- result summary;
- limitations.

The UI shows action summaries and evidence, not hidden chain of thought.
