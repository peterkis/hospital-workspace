# HW00-04 authorization record

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

Before any Evidence file was written, Git resolved the implementation commit
and tree above. The tree exactly equalled the final implementation-only
Terra-reviewed tree, the source commit was the implementation parent and merge
base, and the worktree had no staged, unstaged, or untracked drift.

## Owner no-source decision

The owner decision for HW00-04 is `sourceMode: none`.

- Old local and GitHub legacy source repositories were deliberately removed.
- No authorization exists to recover, search for, reclone, reconstruct, or
  substitute those repositories or their history.
- The implementation fallback is reimplementation from target contracts,
  current architecture, deterministic synthetic fixtures, accepted ADRs, and
  current acceptance criteria.
- No legacy source is required for build, CI, tests, runtime, release, or
  rollback.
- No legacy source was available or used. No legacy code or Git history was
  copied or imported.
- Active `none` mode has no source hash because no source exists; a source hash
  is required only for a future separately authorized optional-local adoption.

## Effective HW00-04 path lock

The canonical HW00-04 implementation paths remained:

- `docs/migration/**`
- `scripts/migration/**`

For HW00-04 only, the owner temporarily extended the implementation path lock
to exactly:

- `.github/PATH-OWNERSHIP.yaml`
- `docs/governance/PATH-OWNERSHIP.yaml`

The extension authorized only one semantically identical high-risk migration
ownership rule in the canonical file and its documentation mirror. All other
rules, owners, reviewers, risks, and constraints remained unchanged.

The complete source-main implementation diff contains exactly ten migration
paths and those two ownership files. The canonical task manifest
`docs/program/tasks/HW-00.yaml` remained unchanged: its source and
implementation Git blob is `ee1808ddbce3e18882ce2cd108281686532e2987` and
its SHA-256 is
`92cca2493323fc7234f9911d82de275e8d236b4e4feab31e7b731d00d52e5234`.

## Acceptance-only authorization

Parent Codex is authorized to write only
`docs/program/evidence/HW-00/HW00-04/**` for this closeout. The authorization
scope is HW00-04 only. It does not authorize implementation changes, status or
task-manifest changes, later HW-00 tasks, HW-01, commits, pushes, pull requests,
Ruleset/workflow changes, releases, deployments, or external-system writes.
