---
status: accepted
date: 2026-09-03
---

# ADR-0009: Adopt Product-First MVP Execution Overlay

## Context

`F0-CLEAN-FOUNDATION` is accepted as `PASS`. Its gate decision records the
accepted foundation, zero P0/P1 findings, one non-blocking P2 maintenance item,
and that `HW-01` is not started. The canonical roadmap contains 103 work
packages across `HW-01` through `HW-12` and remains the valid long-term
production hardening map. Its dependency order delays a visible product loop
until the Workspace/runtime work in `HW-03`/`HW-05` and the first real value
milestone in `HW-06`.

The human owner requires earlier product feedback. This is an execution-order
decision, not a change to the target architecture or a production shortcut.

## Decision

Adopt the Product-First MVP execution overlay in
`docs/program/mvp/MVP-EXECUTION-OVERLAY.yaml`. The overlay is active only until
the `MVP-07` Product Direction Gate. For MVP-0, its sequence temporarily
supersedes the near-term order of the canonical roadmap.

The canonical 103-package roadmap is not deleted, renumbered, or rewritten.
An MVP prototype subset never marks a canonical task `DONE`. Prototype code
must later be explicitly adopted, hardened, or deleted through the mapped
canonical task. MVP-0 is public-synthetic and browser-first; it authorizes no
hospital pilot and makes no production claim.

Identity, authorization, database, Outbox, Tauri, and sensitive-data work that
is high or critical risk continues through its canonical task routing and
required Sol acceptance. No MVP slice may downgrade or bypass such a boundary.

## Alternatives considered

1. Continue directly with `HW-01`: preserves the current sequence but delays
   product feedback until the later runtime and Ticket phases.
2. Rewrite the canonical roadmap: rejected because it would destroy the
   production hardening map and its historical dependency reasoning.
3. Use an untracked prototype plan: rejected because the execution change
   needs a versioned, reviewable and reversible authority.

## Authority, security and data impact

The program roadmap and accepted ADRs remain authoritative for production
architecture, task completion, security boundaries and gates. The overlay is
authoritative only for near-term MVP-0 execution order. MVP data and personas
are public synthetic fixtures in a browser-first prototype. No real hospital
data, credentials, private configuration, production identity, authoritative
database, or hospital integration is introduced.

## Migration and adoption

Each overlay slice maps to existing canonical tasks. After `MVP-07`, the Parent
and human owner choose `ADOPT_AND_HARDEN`, `REVISE_AND_REPEAT`, or
`STOP_AND_REDIRECT`. Adopted work is re-entered through the mapped canonical
tasks with their original risk, dependency, evidence and acceptance routes.

## Validation

Before acceptance, validate YAML parsing, referenced task IDs, dependency
acyclicity and uniqueness, public-safety and repository checks, `git diff
--check`, and the path lock. The low-risk documentation route is one
implementation commit, GitHub checks, and one external read-only
`terra_reviewer` receipt bound to the final result. No committed task Evidence
directory or per-file SHA manifest is created.

## Rollback

Before commit, abandon the uncommitted documentation candidate. After the
single implementation commit, revert it through the protected Pull Request
path. Do not rewrite accepted F0 evidence or published history. Retiring the
overlay requires the human owner; no product slice is started by this ADR.

## Status

Accepted as an execution overlay. It is not a production, pilot, identity,
database, security, or phase Gate decision.
