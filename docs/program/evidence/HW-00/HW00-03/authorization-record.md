# HW00-03 authorization record

## Evidence binding

| Field | Value |
| --- | --- |
| Task | `HW00-03` |
| Source main commit | `495cc9de5d7efbf47a42d351916d2aba035cfdb4` |
| Implementation commit | `af9ac63d20e59ddc120fd79d93bb71a995195bf4` |
| Final approved implementation tree | `1a56d921ac9556020f602bf4401105efa4a3d830` |
| Final tree-listing SHA-256 | `d0ae497bb3a517b4453b22c4718f4a8349e00364f139c2e8e68a97809196a874` |
| Branch | `hw/hw-00/hw00-03-dependency-dag` |

## Human path-lock extension

The human owner granted a temporary, one-task path-lock extension for exactly:

- `.github/PATH-OWNERSHIP.yaml`

Authorization type: `human path-lock extension`.

Purpose: synchronize the `scripts/governance/**` owner, reviewer, and risk
mapping between `.github/PATH-OWNERSHIP.yaml`, the effective machine authority,
and `docs/governance/PATH-OWNERSHIP.yaml`, its documented governance mirror.

The extension applies to HW00-03 only. It did not authorize any other `.github`
path, and the canonical task manifest `docs/program/tasks/HW-00.yaml` remained
unchanged.

## Six critical-rule reviewer additions

The human owner authorized appending exactly one reviewer to each existing
critical rule while preserving its owner, original reviewer, risk, paths, and
constraints.

| Existing rule | Reviewer appended |
| --- | --- |
| Gateway / Identity | `architecture-reviewer` |
| Collaboration | `security-reviewer` |
| Agent Gateway | `security-reviewer` |
| Fee | `security-reviewer` |
| Handover | `security-reviewer` |
| Root Toolchain / Workflows | `security-reviewer` |

The authoritative constraint `criticalRequiresTwoReviewRoles: true` was not
weakened, bypassed, or given an exception.

## Contract-owner path correction

The human owner authorized removing exactly:

- `packages/*-contracts/**`

The `contract-owner` rule explicitly retains exactly these contract paths:

- `packages/event-contracts/**`
- `packages/command-contracts/**`
- `packages/capability-contracts/**`
- `packages/workspace-contracts/**`
- `packages/contracts-core/**`
- `packages/card-protocol/**`

The correction narrowed ownership rather than suppressing conflicts. Existing
domain and platform contract authorities remained unchanged. Future
cross-domain contract packages must be explicitly enumerated; an unknown
unowned contract package fails closed.

## Review history

| Stage | Tree | Outcome |
| --- | --- | --- |
| First integrated review | `36d5944208bb603694234394f523ac67f062cdda` | Rejected; three corrections requested |
| Intermediate staged review | `74391e8f647b92994da7db5cbca015fc99c87175` | Rejected; glob-intersection correction requested |
| Final implementation review | `1a56d921ac9556020f602bf4401105efa4a3d830` | `APPROVED` |

Ownership glob conflicts were `11` before the final path correction and `0`
after it.

This authorization record changes no implementation authority, Program status,
task manifest, workflow, Ruleset, product, runtime, database, or Prisma scope.
