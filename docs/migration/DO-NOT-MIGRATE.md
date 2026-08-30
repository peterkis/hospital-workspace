# Do Not Migrate

The following must not enter the new repository except as a textual reference in migration documentation:

- legacy root `package.json`;
- legacy `pnpm-lock.yaml`;
- legacy `pnpm-workspace.yaml`;
- `scripts/phase-01`;
- `scripts/phase-02`;
- historical Evidence and machine-specific receipts;
- old GitHub Issue content as active tasks;
- old Phase plans;
- old root Prisma schema, migrations and seeds;
- PostgreSQL Session/RefreshSession authority models;
- Next.js application pages, layouts and Server Actions;
- old Portal landing page and application menu;
- `hub-next`;
- old deployment bundle/process topology;
- `.next`, `dist`, `generated`, `target`, test output and certificate private keys;
- `.js`/`.d.ts` generated beside `.ts` source;
- real data, credentials, `.env`, tokens, hostnames or certificates;
- Agent tool code with Shell, SQL, arbitrary HTTP, filesystem or browser automation;
- dynamic remote JavaScript plugin mechanisms;
- compatibility aliases for old app codes or URLs unless a new ADR approves them.

These exclusions apply even if a future owner authorizes an optional-local
source. The active no-source state has no source checkout, code adoption, or
history import.

If a later task needs one of these items, stop and require a new migration decision.
