# AGENTS.md — Pure Contract Packages

## Scope

Template for `packages/*-contracts/**` and other pure protocol packages.

## Allowed

- TypeScript types;
- Zod schemas;
- pure normalization helpers;
- state tables;
- fixtures;
- JSON Schema/OpenAPI metadata;
- serialization tests.

## Forbidden

- React;
- Next.js;
- Fastify;
- Tauri;
- Prisma or `pg`;
- Redis;
- request/response objects;
- repositories;
- file/network/database side effects;
- service secrets;
- environment reads.

## Rules

- Version every transported or persisted payload.
- Reject unknown fields by default.
- Separate commands, domain events, projections, cards and display models.
- Define owner, sensitivity and retention metadata.
- Include valid, boundary, invalid and malicious fixtures.
- Avoid exposing database models or UI implementation details.
- Breaking changes require consumer inventory, ADR and explicit cutover/deletion plan.
