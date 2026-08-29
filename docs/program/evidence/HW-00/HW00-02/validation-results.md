# HW00-02 validation results

## Evidence binding

| Field | Value |
| --- | --- |
| Source main commit | `4de240423ac52708c4bf290c9f298b43cf88be02` |
| Implementation commit | `de869fb40c56f14e1b4d96c5e49893eef7a0c11a` |
| Implementation tree | `68e591bc74b480ee22cd975d0fb540cd09c8f399` |
| Previously reviewed tree | `68e591bc74b480ee22cd975d0fb540cd09c8f399` |
| Branch | `hw/hw-00/hw00-02-toolchain-contract` |
| Evidence generated | `2026-08-29T23:54:36+08:00` |
| Scope | HW00-02 acceptance and public Evidence closeout only |

The implementation-tree equality gate passed before evidence work began. The
actual implementation diff from `main` contains only the nine paths allowed by
HW00-02 in `docs/program/tasks/HW-00.yaml`.

## Environment and pinned toolchain

| Item | Result |
| --- | --- |
| Environment | Native Windows PowerShell; local identity and machine identifiers omitted |
| Node.js | `24.18.0` |
| pnpm | `11.17.0` |
| TypeScript CLI | `7.0.2` |
| JavaScript lockfile set | `pnpm-lock.yaml` only |
| Registered workspaces | 0, matching the current empty Foundation workspace |

TypeScript 7.0.2 does not provide the legacy programmatic compiler API. A local
module-surface probe exposed only `version` and `versionMajorMinor`; legacy
members such as `createProgram` and `transpileModule` were absent. Future tooling
that requires that API needs a separate compatibility decision.

## Clean-clone and committed-report regeneration

A new local clone was created from the committed branch in a private temporary
directory. The temporary path is intentionally omitted. The clone resolved to
the implementation commit and tree above.

| Command | Exit code | Result |
| --- | ---: | --- |
| `git clone --no-local --quiet --branch hw/hw-00/hw00-02-toolchain-contract <repository> <temporary-clean-clone>` | 0 | PASS |
| `node --version` | 0 | `v24.18.0` |
| `pnpm --version` | 0 | `11.17.0` |
| `pnpm install --frozen-lockfile` | 0 | PASS; lockfile accepted without mutation |
| `pnpm exec tsc --version` | 0 | `Version 7.0.2` |
| `node scripts/governance/check-workspace-contract.mjs --validate --format-check --report-dir <temporary-external-report-dir>` | 0 | PASS; regenerated both JSON reports |
| `pnpm run check` | 0 | PASS; 8 tests passed |

The private temporary raw report copies are not committed. Their SHA-256 values
were `60ce47f845be8e1e1604c25c9e7a8905c79b3a4714aaf73cad92c4e9e925e16c`
for `toolchain-report.json` and
`7e6a9cc6a12276e4e94a37c90e2446be0a649c332229be116193df70d4985229`
for `workspace-inventory.json`. The committed public-safe JSON copies preserve
the same generated content; final public artifact hashes are listed separately.

## Final working-tree validation

The public evidence overlay was written before this rerun. All six canonical
commands, the direct workspace-contract test entry point, repository validation,
and diff whitespace validation completed successfully.

| Command | Exit code | Result |
| --- | ---: | --- |
| `pnpm run build` | 0 | PASS |
| `pnpm run lint` | 0 | PASS |
| `pnpm run typecheck` | 0 | PASS |
| `pnpm run test` | 0 | PASS; 8 tests passed |
| `pnpm run check` | 0 | PASS; integrated canonical chain and 8 tests passed |
| `pnpm run format:check` | 0 | PASS |
| `node --test scripts/governance/check-workspace-contract.test.mjs` | 0 | PASS; 8 tests passed |
| `python tools/validate_repository.py` | 1 | Environment preflight failure: child Git rejected the Administrators-owned checkout before repository validation |
| `python tools/validate_repository.py` with process-scoped Git `safe.directory` | 0 | PASS; schema `hospital-workspace.repository-validation.v2`, working-tree mode, no errors |
| `git diff --check` | 0 | PASS |

The process-scoped Git trust setting affected only the validator process and its
child Git invocation. It did not change global or repository configuration. The
initial exit 1 is retained here rather than hidden; it was an environment trust
failure, not a validation finding.

## Negative coverage

All positive and negative workspace-contract scenarios are enumerated in
`negative-tests.log`. The public log is a deliberate summary and excludes raw
local paths and environment identifiers.

## Known limitations and boundary

- The clean-clone run is local Windows evidence. It does not prove a remote
  GitHub Actions run or another operating system.
- Current GitHub checks validate only the bootstrap repository boundary. Full
  Node/pnpm CI expansion belongs to HW00-06.
- The workspace inventory is intentionally empty because no app, service, or
  package workspace is yet registered.
- TypeScript 7.0.2 CLI validation passes, but its missing legacy programmatic
  compiler API requires a separate compatibility decision before such tooling
  is introduced.
- This closes only HW00-02. Phase HW-00 remains incomplete; HW00-03, HW-01, the
  phase Gate, deployment, pilot, and production are not started or implied.
- HW00-02 is Terra-tier. Sol is not required and was not invoked; no Sol
  acceptance is claimed.
- No implementation files were changed during acceptance closeout. No commit,
  push, PR, merge, release, external-system write, or status-page update is part
  of this work.
