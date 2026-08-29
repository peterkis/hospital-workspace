# HW00-01 Validation Results

- Captured: `2026-08-29T13:58:56Z`
- Source commit: `f12e3f4240319b912d2438f263d529530be8f599`
- Source tree: `22555e69d205065521f872fc9dade094f56bd211`
- Task dependency: `depends_on: []` — satisfied
- Pre-Terra result: `PASS`

## Scope and path lock

HW00-01 permits writes to `README.md`, `AGENTS.md`, `.codex/**`, `docs/**`,
`.github/**`, `.gitignore`, and `.gitattributes`.

This closeout narrows the write lock to exactly seven files under
`docs/program/evidence/HW-00/HW00-01/`. No product, dependency, workflow,
Ruleset, repository setting, status projection, later task, or phase file is
within the closeout write lock.

## Public repository boundary

`PUBLIC-DATA-BOUNDARY.md`, root `AGENTS.md`, `.gitignore`, the tracked path list,
and the repository validator were checked. The seed contains only public
governance, architecture, synthetic configuration examples, agent definitions,
and bootstrap validation code. It contains no tracked runtime application roots,
real hospital configuration, private evidence, secrets, logs, screenshots,
dumps, backups, certificates, or production endpoint mapping.

The independent Luna inventory found no prohibited-path candidate, Git special
mode, submodule, generated/build tree, or unexplained working-tree file.

## Local validation

| Check | Result |
| --- | --- |
| Branch is `hw/hw-00/hw00-01-foundation-acceptance` | PASS |
| Pre-evidence worktree clean | PASS |
| HEAD equals remote `main` | PASS |
| Source commit/tree frozen | PASS |
| 152-path initial inventory and digests | PASS |
| Nine instruction files; no override | PASS |
| Root `AGENTS.md` 22,849 bytes, below 32 KiB | PASS |
| Fourteen agent TOMLs parse; Sol pins/read-only posture valid | PASS |
| `python -B tools/validate_repository.py` | PASS, exit 0 |
| `python -B tools/validate_repository.py --git-index` | PASS, exit 0 |
| `git diff --check` before evidence | PASS, exit 0 |
| Remote `checks` on frozen source commit | PASS |
| Active/effective default-branch Ruleset, no bypass | PASS |

Both local repository-validator modes reported:

```text
schemaVersion: hospital-workspace.repository-validation.v2
fileCount: 152
phaseCountExpected: 13
taskCountExpected: 103
customAgentCountExpected: 14
solAgentCountExpected: 3
rootAgentsBytes: 22849
status: PASS
errors: []
```

The current Windows checkout requires command/process-scoped Git trust because
of repository ownership metadata. No persistent or global Git configuration was
changed. The successful remote job is the clean-checkout evidence.

## Evidence truth and limitations

This validates only the HW00-01 public governance bootstrap. It does not prove
HW00-02 toolchain/frozen-install work, HW00-06 full CI, an HW-00 phase Gate,
runtime behavior, migration, pilot, or production readiness. Terra and Sol
outcomes are recorded separately and must bind to the frozen source commit/tree.
