# HW00-03 validation results

## Evidence binding

| Field | Value |
| --- | --- |
| Task | `HW00-03` |
| Source main commit | `495cc9de5d7efbf47a42d351916d2aba035cfdb4` |
| Implementation commit | `af9ac63d20e59ddc120fd79d93bb71a995195bf4` |
| Implementation tree | `1a56d921ac9556020f602bf4401105efa4a3d830` |
| Tree-listing SHA-256 | `d0ae497bb3a517b4453b22c4718f4a8349e00364f139c2e8e68a97809196a874` |
| Branch | `hw/hw-00/hw00-03-dependency-dag` |
| Evidence generated | `2026-08-30T08:57:43+08:00` |
| Scope | HW00-03 acceptance and public Evidence closeout only |

Before any Evidence file was written, Git resolved the implementation commit
and tree above, the canonical 180-entry tree listing matched the supplied
SHA-256, and the working tree/index contained no implementation drift. The
source commit is simultaneously the implementation parent, `origin/main`, and
the merge base. The diff contains exactly the nine authorized implementation
files.

## Dependency and ownership validation

| Command or check | Exit code | Result |
| --- | ---: | --- |
| `node scripts/governance/check-dependency-dag.mjs` | 0 | PASS; actual child workspaces `0`, nodes `0`, edges `0`, findings `0`; ownership rules `17/17`; conflicts `0` |
| `node --test scripts/governance/check-dependency-dag.test.mjs` | 0 | PASS; complete DAG suite `86/86` |
| Ownership test filter | 0 | PASS; ownership suite `18/18` |
| Workspace-protocol test filter | 0 | PASS; workspace protocol `1/1` |
| Deep-import/public-exports test filter | 0 | PASS; `3/3` |
| Cycle-detection test filter | 0 | PASS; `1/1` |
| Implementation path-lock comparison | 0 | PASS; exactly nine authorized implementation paths |
| Evidence path-lock comparison | 0 | PASS; only `docs/program/evidence/HW-00/HW00-03/**` |
| Forbidden-path scan | 0 | PASS |

The complete suite contains 64 synthetic dependency graphs: 10 positive and 54
negative. Every negative graph produced its intended finding code on two
deterministic checker runs. `boundary-check.log` enumerates every fixture and
the ownership-policy scenarios.

## Canonical repository validation

| Command | Exit code | Result |
| --- | ---: | --- |
| `pnpm install --frozen-lockfile` | 0 | PASS; lockfile unchanged |
| `pnpm run build` | 0 | PASS |
| `pnpm run lint` | 0 | PASS |
| `pnpm run typecheck` | 0 | PASS |
| `pnpm run test` | 0 | PASS; workspace-contract suite `8/8` |
| `pnpm run check` | 0 | PASS |
| `pnpm run format:check` | 0 | PASS |
| `python tools/validate_repository.py` | 0 | PASS; working-tree mode |
| `python tools/validate_repository.py --git-index` | 0 | PASS; exact temporary Evidence index used for closeout validation |
| `git diff --check` | 0 | PASS for the committed implementation and complete temporary-index Evidence diff |

Git trust for the Administrators-owned checkout was supplied only through
command-scoped or process-scoped configuration. No global or repository Git
configuration was changed. Private local paths and identities are omitted from
the public evidence.

## Review history and corrections

| Tree | Review result | Correction |
| --- | --- | --- |
| `36d5944208bb603694234394f523ac67f062cdda` | Rejected | External frontend/service package fail-closed enforcement, directory-relative workspace crossing, and canonical ownership synchronization |
| `74391e8f647b92994da7db5cbca015fc99c87175` | Rejected | Sound wildcard-language ownership intersection |
| `1a56d921ac9556020f602bf4401105efa4a3d830` | `APPROVED` | No remaining implementation finding |

The ownership correction reduced conflicting glob intersections from `11` to
`0`, synchronized the canonical and mirror files, retained the authorized six
critical reviewer additions, and replaced the broad contract wildcard with six
explicit contract-owner paths.

## Rollback

The implementation is a single commit whose parent is the expected source main
commit. A rollback is therefore the normal Git revert of implementation commit
`af9ac63d20e59ddc120fd79d93bb71a995195bf4`; no database, runtime state,
migration, dependency, lockfile, or external-system rollback is required.

The uncommitted Evidence overlay can be removed independently without changing
the committed implementation. No destructive rollback was performed during
this closeout.

## Limitations and boundary

- There are currently zero actual child workspaces. No child workspace was
  invented for Evidence.
- Prisma/database enforcement is currently policy and synthetic-fixture proof,
  not production database implementation proof.
- Static analysis covers recognizable module specifiers.
- Dynamic loading requires later runtime-specific enforcement.
- The ownership YAML parser intentionally supports the frozen narrow schema and
  fails closed on unknown or malformed structures.
- Required GitHub CI integration of this new dependency-DAG checker belongs to
  HW00-06. This task does not claim a remote CI run.
- This is task-level Terra acceptance for HW00-03 only. Sol is not required,
  was not invoked, and is not claimed.
- Phase HW-00 remains incomplete. HW00-04, HW00-05, HW00-06, HW-01, the phase
  Gate, deployment, pilot, and production are not started or implied.
- `docs/program/STATUS.md`, `docs/program/tasks/HW-00.yaml`, and
  `work-package-tracker.csv` were not modified.
- No commit, push, PR, merge, release, external-system write, or public Evidence
  outside this authorized directory is part of the closeout.
