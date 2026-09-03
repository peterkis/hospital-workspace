# MVP-0 acceptance

MVP-0 succeeds only when all of the following are demonstrated and recorded by
the applicable checks:

- the browser app starts with one documented command;
- the user sees a polished, coherent Workspace rather than a developer demo;
- a synthetic Ticket flow completes across reporter and engineer personas;
- the UI never presents local fixture state as production truth;
- all data is public synthetic;
- no hospital integration or credential is required;
- the core flow is keyboard accessible;
- there are no obvious console or runtime errors;
- CI passes; and
- the user can make a Product Direction decision at `MVP-07`.

## Explicit non-goals

MVP-0 does not deliver real SSO, Session security, PostgreSQL, Redis, Outbox
durability, SSE recovery, Tauri, Windows/MSI, Anolis deployment, real
attachment storage, Agent execution, a hospital pilot, or production.

## Acceptance boundary

MVP acceptance is product-direction feedback, not canonical production
acceptance. A slice may be accepted for the overlay while its mapped canonical
task remains incomplete. The Product Direction Gate may return only
`ADOPT_AND_HARDEN`, `REVISE_AND_REPEAT`, or `STOP_AND_REDIRECT`.
