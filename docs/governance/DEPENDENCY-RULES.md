# Dependency Rules

## Allowed

```text
apps/workspace-web
  -> UI, API clients, capability SDK, pure contracts

apps/desktop-shell
  -> Rust trust-policy, surface/deep-link/release contracts

services/*
  -> domain contracts, repositories, observability, infrastructure kernels

repositories
  -> database-runtime

contracts
  -> Zod and pure TypeScript only
```

## Forbidden

- frontend import from `services`, `database`, Prisma, pg or Redis;
- contract import from runtime/framework packages;
- domain service import another domain repository/database model;
- Collaboration import domain repository;
- Agent Gateway import domain repository;
- Gateway write domain tables;
- private deep imports;
- generated source files;
- circular dependencies;
- package alias to legacy `@portal/*`;
- Next.js dependency;
- generic Tauri plugin.

## Enforcement

The governance checker reads:

- pnpm workspace manifests;
- TypeScript import graph;
- package exports;
- path ownership;
- Prisma model access allowlists;
- Legacy Source Manifest.

Negative fixtures are mandatory. A checker that only counts files is insufficient.
