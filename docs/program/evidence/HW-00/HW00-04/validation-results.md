# HW00-04 validation results

## Evidence binding

| Field | Value |
| --- | --- |
| Task | `HW00-04` |
| Source main commit | `0926cc8b62d2c008e6fca202e81b052cb31c0531` |
| Implementation commit | `7a9b02e5a1bc6b1e55b251bd230c970dcf52142a` |
| Implementation tree | `7889b878cb8d8b747660ed0f50a549a18fc90315` |
| Final implementation Terra-reviewed tree | `7889b878cb8d8b747660ed0f50a549a18fc90315` |
| Complete diff range | `0926cc8b62d2c008e6fca202e81b052cb31c0531..7a9b02e5a1bc6b1e55b251bd230c970dcf52142a` |
| Complete diff SHA-256 | `3899ead97ed6b076d9bf7ef75f6966018113098df622a1503273482edacfb3c6` |
| Implementation tree-listing SHA-256 | `b304cfded77126f32f4315fcfab22d4198f6f4c3ec54da2d671cba5bb208e077` |
| Branch | `hw/hw-00/hw00-04-legacy-source-manifest` |
| Evidence generated | `2026-08-30T17:47:07+08:00` |
| Scope | HW00-04 acceptance and public Evidence closeout only |

The Evidence-candidate digest is computed only after this report and the other
pre-acceptance artifacts are final. Because those artifacts form the digest
input, they do not self-reference the digest. Both independent review reports
bind to the resulting candidate digest and exact component hashes.

## Pre-write stop-condition gate

| Check | Result |
| --- | --- |
| Current branch | PASS; exact authorized HW00-04 branch |
| Source main, implementation parent, and merge base | PASS; all resolve to the source commit above |
| Implementation commit and tree | PASS; resolved directly from Git |
| Final implementation Terra-reviewed tree equality | PASS; exact equality |
| Complete implementation path lock | PASS; exactly 12 paths, no missing or extra path |
| Ownership extension | PASS; exact rule added identically to canonical and mirror files |
| Canonical task manifest | PASS; identical Git blob at source and implementation commits |
| Pre-Evidence worktree | PASS; no staged, unstaged, or untracked drift |
| Forbidden implementation paths | PASS; no change |

## Environment

| Item | Result |
| --- | --- |
| Environment | Native Windows PowerShell; local identity and machine identifiers omitted |
| Node.js | `24.18.0` |
| pnpm | `11.17.0` |
| TypeScript CLI | `7.0.2` |

## Migration and dependency validation

| Command | Exit code | Result |
| --- | ---: | --- |
| `node --check scripts/migration/check-legacy-source-manifest.mjs` | 0 | PASS |
| `node --check scripts/migration/check-legacy-source-manifest.test.mjs` | 0 | PASS |
| `node scripts/migration/check-legacy-source-manifest.mjs` | 0 | PASS; schema `hospital-workspace.legacy-source.v2`, mode `none`, findings `0` |
| Repeat active checker and compare output bytes | 0 | PASS; second exit 0 and output byte-identical |
| `node --test scripts/migration/check-legacy-source-manifest.test.mjs` | 0 | PASS; complete suite `98/98` |
| `node scripts/governance/check-dependency-dag.mjs` | 0 | PASS; ownership `18/18`, workspaces `0`, findings `0` |
| `node --test scripts/governance/check-dependency-dag.test.mjs` | 0 | PASS; complete suite `86/86` |
| Exact required-field verifier for `source-state.json` | 0 | PASS |

## Six canonical root commands and repository validation

| Command | Exit code | Result |
| --- | ---: | --- |
| `pnpm install --frozen-lockfile` | 0 | PASS; lockfile unchanged |
| `pnpm run build` | 0 | PASS |
| `pnpm run lint` | 0 | PASS |
| `pnpm run typecheck` | 0 | PASS |
| `pnpm run test` | 0 | PASS; workspace-contract suite `8/8` |
| `pnpm run check` | 0 | PASS; integrated canonical chain and `8/8` tests |
| `pnpm run format:check` | 0 | PASS |
| `python tools/validate_repository.py` with process-scoped Git trust | 0 | PASS; schema `hospital-workspace.repository-validation.v2`, working-tree mode, no errors |
| `git diff --check` | 0 | PASS |
| Temporary-index `python tools/validate_repository.py --git-index` | 0 | PASS; exact five-file pre-acceptance Evidence candidate, 198 indexed files, no errors |
| Temporary-index `git diff --cached --check` | 0 | PASS; exact five-file candidate |

The process-scoped Git trust setting affected only the validator process and
its child Git invocation. It changed no global or repository configuration.
The real Git index was not changed. The pre-acceptance candidate consists of
exactly `.gitignore`, `authorization-record.md`,
`migration-policy-test.log`, `source-state.json`, and
`validation-results.md`. Its SHA-256 component manifest is sorted by those
relative filenames; the SHA-256 of that manifest is the Evidence-candidate
digest recorded by both acceptance reports. Acceptance reports, final task
status, and the final artifact manifest are outputs and therefore are not
self-referential candidate inputs.

## Fixture coverage

Every positive and negative fixture is recorded in
`migration-policy-test.log` with its exact test name and final suite result.

## Rollback

The implementation is one commit whose parent is the source main commit. Its
code rollback is a normal reviewed Git revert of implementation commit
`7a9b02e5a1bc6b1e55b251bd230c970dcf52142a`; no database, runtime, deployment,
legacy source, or external-system rollback is involved.

The uncommitted Evidence overlay can be removed independently without changing
the committed implementation. No destructive rollback was performed.

## Evidence truth and limitations

- No legacy source was available or used, and no legacy code or Git history was
  copied.
- No source hash is required in active `none` mode.
- The adoption matrix contains historical reference candidates only; it
  represents no approved or active migration.
- Optional-local behavior is proved only by deterministic synthetic fixtures;
  no optional checkout was accessed and source or target hashes were not
  recomputed.
- The checker provides deterministic static enforcement. It does not prove
  future copied behavior or security equivalence; a future adoption requires a
  new owner decision, source binding, receipt, tests, and review.
- Migration-checker CI wiring belongs to HW00-06. This task does not claim a
  remote CI run.
- The unchanged canonical task prose retains earlier hyphenated human-readable
  migration labels. The active protocol and checker freeze the unambiguous
  underscore enum and reject aliases; changing the task manifest was outside
  this closeout and was not needed for the accepted task semantics.
- HW00-04 closeout does not complete phase HW-00, run `sol_phase_gate`, start
  HW00-05/HW00-06/HW00-07 or HW-01, or imply deployment, pilot, or production
  readiness.
- No implementation, Program status, canonical task manifest, tracker,
  workflow, Ruleset, package, workspace, lockfile, product, runtime, database,
  or Prisma file is modified by this closeout.
- No commit, push, PR, merge, release, or external-system write is included.
