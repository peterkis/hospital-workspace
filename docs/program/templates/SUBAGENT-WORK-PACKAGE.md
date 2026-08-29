# Subagent Work Package

## Metadata

| Field | Value |
| --- | --- |
| Task ID | `HWxx-yy` |
| Parent phase | `HW-xx` |
| Primary owner | `luna_*` / `terra_*` / `parent_codex` |
| Execution mode | `read-only` / `workspace-write` |
| Parallel group | `A` |
| Risk | low / medium / high / critical |
| Acceptance tier | terra / sol-acceptance / sol-architecture-security / sol-phase-gate |
| Acceptance agents | ... |
| Required acceptance outcome | ... |
| Depends on | — |

## Objective

Describe one observable, testable outcome.

## Allowed read paths

- `...`

## Allowed write paths

- `...`

## Inputs and frozen decisions

- ...

## Constraints

- Do not modify paths outside the allowlist.
- Do not add dependencies unless explicitly authorized.
- Do not change public contracts unless this is a contract task.
- Do not create legacy compatibility, dual-read, dual-write or hidden fallback.
- Stop on identity, permission, Scope, TLS, native or destructive data boundary conflicts.
- Acceptance agents are read-only and do not fix the reviewed task.

## Steps

1. ...
2. ...

## Validation

- `...`

## Evidence

- ...

## Implementation done when

- ...

## Independent acceptance

- Freeze final result commit/tree digest and Evidence.
- Run listed Terra review/security agents.
- Run listed Sol acceptance agents.
- A missing, stale, rejected or blocked required acceptance report prevents completion.

## Stop if

- ...

## Required return format

Implementation agents use `SUBAGENT-RETURN.md`. Sol agents use the dedicated Sol report template.
