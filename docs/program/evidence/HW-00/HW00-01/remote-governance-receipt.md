# HW00-01 Remote Governance Receipt

- Captured: `2026-08-29T13:58:56Z`
- Repository: `peterkis/hospital-workspace`
- Repository URL: <https://github.com/peterkis/hospital-workspace>
- Visibility: `PUBLIC`
- Default branch: `main`
- Default-branch commit: `f12e3f4240319b912d2438f263d529530be8f599`
- Result: `PASS`

## Ruleset

The repository-level branch Ruleset `Protect main` is active and applies to the
default branch. GitHub reports the effective rule set for `main`.

| Property | Observed value |
| --- | --- |
| Ruleset ID | `21804174` |
| Enforcement | `active` |
| Target | branch / `~DEFAULT_BRANCH` |
| Bypass actors | none |
| Branch deletion | blocked |
| Non-fast-forward update | blocked |
| Pull request rule | required; review threads must be resolved |
| Required status context | `checks` |
| Status-check policy | strict |

The imported live rule matches the checked-in policy recipe on the required
HW00-01 controls: default-branch targeting, active enforcement, no bypass,
pull-request workflow, deletion/non-fast-forward protection, and strict
`checks`. No repository setting was changed during acceptance closeout.

## Workflow and check run

GitHub reports one active workflow:

- Name: `checks`
- Path: `.github/workflows/checks.yml`
- State: `active`

The check run bound to the frozen source commit completed successfully:

- Workflow run: <https://github.com/peterkis/hospital-workspace/actions/runs/33254745854>
- Event: `push`
- Branch: `main`
- Head SHA: `f12e3f4240319b912d2438f263d529530be8f599`
- Job/check name: `checks`
- Status: `completed`
- Conclusion: `success`

The job log shows an Ubuntu clean checkout of the same commit and a successful
`python tools/validate_repository.py --git-index` result with 152 files,
13 phases, 103 tasks, 14 custom agents, three Sol agents, 22,849 root-instruction
bytes, and no reported errors.

## Verification interface and limitation

Read-only GitHub repository, branch, Ruleset, effective-branch-rule, workflow,
run, and check-run API queries were used. Authentication material was neither
printed nor recorded. No direct-push negative probe was attempted because the
closeout forbids external mutation; effective enforcement and the empty bypass
list are the acceptance evidence.
