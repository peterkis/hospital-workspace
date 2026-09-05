# Gateway

`@hospital/gateway` is the MVP04-I01 local prototype Gateway workspace. It
uses Node 24.18.0 and pnpm 11.17.0, binds only to `[::1]:3001`, and exposes
only `GET /healthz`.

Run it with:

```text
pnpm --filter @hospital/gateway run dev
```

This public-synthetic, non-production prototype is not connected to the
browser yet. Bootstrap/persona and command receipt routes are not implemented.
It provides no Identity, Session, Authz, database, Redis, Ticket authority,
hospital integration, or production-readiness claim.
