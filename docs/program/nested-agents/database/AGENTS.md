# AGENTS.md — Database and Migrations

## Scope

Applies to `database/**`.

## Greenfield rule

This repository starts a new migration lineage. Do not copy legacy migrations, test identities, sessions or runtime business data.

## Ownership

- Each schema/domain has one owner.
- Cross-domain reads use contracts or approved read models.
- Cross-domain writes are forbidden.
- Raw Prisma/SQL access is limited to repository/data-access packages.
- Redis is the active Session authority; do not recreate PostgreSQL Session as a second runtime authority.
- Migration files are immutable after merge.
- Seed is deterministic, minimal and contains no real identity or patient data.
- Development reset scripts must refuse production-like environments.

## Required workflow

1. Update model and contract.
2. Generate migration from a clean baseline.
3. Review SQL explicitly.
4. Test empty database replay.
5. Test upgrade from the previous new-repo release when applicable.
6. Test rollback/recovery strategy.
7. Verify least-privilege database roles and search path.
8. Record schema owner and data classification.

## Forbidden

- importing legacy Prisma schema wholesale;
- copying legacy migration history;
- `db push` as production migration;
- destructive migration without backup/recovery approval;
- runtime DDL from application processes;
- unbounded query or cross-schema raw SQL without owner review.
