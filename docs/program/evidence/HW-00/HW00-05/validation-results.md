# HW00-05 validation results

## Evidence binding

| Field | Value |
| --- | --- |
| Task | `HW00-05` |
| Acceptance tier | `terra` |
| Required acceptance outcome | `APPROVED` |
| Source main commit | `c1d7b7b169dc4409fd0c852c87b60aafe13e76b9` |
| Implementation commit | `ff9fcb9c5aada76e991779236fc8a9ad1ef6dd93` |
| Implementation tree object ID | `fb8129ff4e483d2c336f0b8d1809d5aa1f2a841d` |
| Matrix blob object ID | `04aea85851ac9d979197c4881f57512a17685e4c` |
| Complete implementation diff | `c1d7b7b169dc4409fd0c852c87b60aafe13e76b9..ff9fcb9c5aada76e991779236fc8a9ad1ef6dd93` |
| Branch | `hw/hw-00/hw00-05-knowe-adoption-matrix` |
| Evidence generated | `2026-08-30T23:15:27+08:00` |
| Scope | HW00-05 public Evidence and task closeout only |

## Pre-write stop-condition gate

| Check | Exit/result |
| --- | --- |
| `git rev-parse HEAD` | 0; exact implementation commit above |
| `git rev-parse HEAD^` | 0; exact source main commit above |
| `git merge-base --is-ancestor <source-main> HEAD` | 0 |
| `git rev-list --count <source-main>..HEAD` | 0; `1` commit |
| `git rev-parse HEAD^{tree}` | 0; exact expected implementation tree |
| `git rev-parse HEAD:docs/migration/KNOWE-ADOPTION-MATRIX.md` | 0; exact expected matrix blob |
| `git diff --name-only <source-main>..HEAD` | 0; exactly `docs/migration/KNOWE-ADOPTION-MATRIX.md` |
| `git status --porcelain=v1 --untracked-files=all` | 0; empty before Evidence work |

All Git commands that required repository trust used a command-scoped
`safe.directory` value equal to the current repository root. The implementation
is one commit over source main, and no binding differed.

## Environment

| Item | Result |
| --- | --- |
| Environment | Native Windows PowerShell; local user and machine identifiers omitted |
| Node.js | `24.18.0` |
| pnpm | `11.17.0` |
| TypeScript CLI | `7.0.2` |

## Fixed-source validation

| Exact command or check | Exit/status | Significant result |
| --- | ---: | --- |
| `Get-Command firecrawl -ErrorAction SilentlyContinue` | not found | Firecrawl CLI unavailable |
| HTTP `HEAD` on `https://github.com/HirezmingD/Knowe-agent-groupchat/commit/1e584f84734e9db55515ef4391fcb9e9c40399cd.patch` | 200 | Fixed commit endpoint resolved |
| HTTP `GET` on the pinned raw `README.md` | 200 | 2,588 bytes; required product and quick-start sections present |
| HTTP `GET` on the pinned raw `TECH.md` | 200 | 4,204 bytes; architecture, Harness completion, and privacy sections present |
| HTTP `GET` on the pinned raw `LICENSE` | 200 | 1,069 bytes; MIT license present |
| PowerShell in-memory fixed-SHA codeload verifier using `.NET ZipArchive` | 0 | 65,842,230 bytes, 914 files, 73/73 cited paths present, missing 0; no archive persisted |
| Full-SHA link verifier over all Knowe URLs in the matrix | 0 | 78/78 links use the exact 40-character commit |
| Mutable-reference scan over all Knowe URLs | 0 | `main`, `master`, `latest`, mutable tree, and unpinned reference count 0 |

A read-only support verifier also attempted an unauthenticated GitHub API
metadata request and received HTTP 403 due to rate limiting. That request was
not used as evidence; the independent immutable patch, raw, and codeload
requests above succeeded.

## Matrix structure, Program, architecture, and ownership validation

The deterministic PowerShell verifier parsed Markdown rows by exact table
shape, enumerated Program task IDs from all 13 task YAML files, resolved
architecture document names, and compared landing-map roles with the canonical
ownership file. It exited 1 on any count, enum, missing task, missing document,
or missing role mismatch.

| Check | Exit code | Result |
| --- | ---: | --- |
| Matrix table column/ID validation | 0 | 32 main rows, 25 exclusions, 7 deferrals; total 64 |
| Decision enum/count validation | 0 | `ADOPT_CONCEPT=4`, `ADAPT=26`, `REFERENCE_ONLY=2`, `EXCLUDE=25`, `DEFER=7` |
| Status enum and unresolved-decision validation | 0 | invalid enums 0; unresolved decisions 0 |
| Unique source paths and pinned links | 0 | 73 paths; 78 full-SHA links |
| Program phase/task reference validation | 0 | 42 unique references, all present among 103 tasks; invalid 0 |
| Architecture target/document validation | 0 | all adoption targets populated; missing referenced architecture documents 0 |
| Ownership-role validation | 0 | missing roles 0; conflicting authority assignments 0 |
| Adoption completeness | 0 | target 32/32; valid task 32/32; security boundary 32/32; acceptance evidence 32/32 |
| Exclusion/safe-replacement completeness | 0 | 25/25 exclusions have risk, safe replacement, enforcing architecture, and future acceptance evidence |

The future `packages/surface-contracts/**` ownership gap is explicitly
recorded by the matrix as unassigned and is therefore not counted as a
conflicting assignment. Resolving it requires a separate future governance
authorization.

The matrix does not name `docs/security/**`. This Evidence therefore makes no
ownership claim for that path.

## No-copy, dependency, and implementation-status validation

| Check | Exit code | Result |
| --- | ---: | --- |
| Complete implementation name/status scan | 0 | one modified Markdown path only |
| Code-bearing path scan | 0 | 0 |
| Source-snippet/fenced-code scan | 0 | 0 copied snippets; 0 fenced-code delimiters |
| Asset path scan | 0 | 0 |
| Test path scan | 0 | 0 |
| Package/lock/workspace/workflow dependency-path scan | 0 | 0 |
| Future-state claim scan | 0 | no row claims implementation; statuses are planned, not-authorized, or excluded |
| `sourceMode: none` check | 0 | unchanged; no sources or adoptions |

No Knowe code, asset, test, package, history, archive, runtime, build, or CI
dependency was copied or introduced.

## Governance, canonical commands, and negative suites

| Exact command | Exit code | Significant result |
| --- | ---: | --- |
| `node scripts/governance/check-dependency-dag.mjs` | 0 | PASS; canonical/mirror ownership `18/18`, workspaces 0, findings 0 |
| `node --test scripts/governance/check-dependency-dag.test.mjs` | 0 | PASS; `86/86` |
| `node scripts/migration/check-legacy-source-manifest.mjs` | 0 | PASS; schema v2, `sourceMode: none`, findings 0 |
| `node --test scripts/migration/check-legacy-source-manifest.test.mjs` | 0 | PASS; `98/98` |
| `pnpm install --frozen-lockfile` | 0 | already up to date; lockfile unchanged |
| `pnpm run build` | 0 | PASS |
| `pnpm run lint` | 0 | PASS |
| `pnpm run typecheck` | 0 | PASS |
| `pnpm run test` | 0 | PASS; workspace-contract suite `8/8` |
| `pnpm run check` | 0 | PASS; integrated canonical chain and `8/8` tests |
| `pnpm run format:check` | 0 | PASS |
| `git diff --check` under process-scoped repository trust | 0 | PASS |

## Repository validator and Git trust event

| Exact command | Exit code | Result |
| --- | ---: | --- |
| `python tools/validate_repository.py` | 1 | Environment preflight failed because child Git rejected the Administrators-owned checkout as an untrusted `safe.directory` |
| Same command with process-scoped `GIT_CONFIG_COUNT=1`, `GIT_CONFIG_KEY_0=safe.directory`, and `GIT_CONFIG_VALUE_0=<current repository root>` | 0 | PASS; repository-validation v2, tracked working-tree mode, errors 0 |

The scoped variables existed only in the validator process and its child Git
process and were removed afterward. Global Git configuration changed: **no**.
Repository Git configuration changed: **no**. The initial exit 1 is preserved;
it was an environment trust preflight failure rather than a repository finding.

Because the validator enumerates Git-tracked paths, the uncommitted Evidence
candidate is additionally checked through a temporary external index populated
from `HEAD` plus only the authorized Evidence paths. The real Git index is not
changed. `python tools/validate_repository.py --git-index`, temporary-index
`git diff --cached --check`, exact path-lock comparison, and focused
credential/local-identity scans must all pass before review and again after
closeout.

## Pre-review Evidence candidate validation

The frozen pre-review candidate contains exactly:

```text
docs/program/evidence/HW-00/HW00-05/matrix-completeness.json
docs/program/evidence/HW-00/HW00-05/source-reference-report.md
docs/program/evidence/HW-00/HW00-05/validation-results.md
```

| Exact command or check | Exit code | Result |
| --- | ---: | --- |
| `git status --porcelain=v1 --untracked-files=all` plus exact set comparison | 0 | only the three authorized pre-review Evidence paths |
| Temporary-index `git diff --cached --check HEAD` | 0 | PASS |
| Temporary-index `python tools/validate_repository.py --git-index` with process-scoped repository trust | 0 | PASS; 205 files, errors 0 |
| Focused credential-assignment `rg --pcre2` scan over the three files | 1 | PASS; no matches |
| Focused private identity/path/network `rg --pcre2` scan over the three files | 1 | PASS; no matches |
| Matrix working-file `git hash-object` and `git diff --exit-code HEAD -- <matrix>` | 0 | exact committed blob; no drift |
| HEAD/tree/blob re-resolution | 0 | all three frozen implementation bindings unchanged |

`rg` exit 1 is the expected no-match result. The temporary index was removed,
the real index remained unchanged, and the global Git trust list was unchanged.

## Rollback and limitations

- The implementation is a single commit whose parent is source main. A code
  rollback would be a separately reviewed Git revert; no rollback was executed.
- The Evidence overlay is uncommitted and can be removed independently without
  changing the committed implementation.
- The source inspection is fixed-commit static evidence. It does not prove
  Knowe runtime behavior or authorize adopting its runtime boundaries.
- Matrix completeness is a deterministic document check plus independent
  review; the repository has no dedicated HW00-05 matrix checker.
- The current repository contains zero child workspaces. Local Windows checks
  do not establish remote CI, Tauri/WebView2, Anolis, deployment, pilot, or
  production evidence.
- This closeout does not complete HW-00, run a phase Gate, invoke Sol, start
  HW00-06/HW00-07/HW-01, or change Program/architecture/governance truth.
- No implementation file is modified, and no commit, push, PR, merge, release,
  deployment, or external-system write is authorized or performed.
