# F0 Clean Foundation Gate decision

`F0-CLEAN-FOUNDATION = PASS`

| Field | Value |
| --- | --- |
| Program/phase | Hospital Workspace / `HW-00` |
| Task | `HW00-07` |
| Repository | `peterkis/hospital-workspace` (public) |
| Branch | `hw/hw-00/hw00-07-f0-gate` |
| Accepted main commit | `2736393ca5d38081282270f29b01b2b0f9f671df` |
| Accepted main tree | `ad695394f9d70bafec95dfd12eb559c7604d2385` |
| Parent decision owner | `parent_codex` |
| Decision time | `2026-09-02T08:29:38.5615280Z` |
| P0 / P1 | `0 / 0` |
| P2 / P3 | `1 / 0` |

## Reviewed PR, CI, and governance identities

| Evidence | Result |
| --- | --- |
| PR #6 | Merged; head `de4273983c40db265bc86afdd87fd56203b87d41`; tree `e4f65cdb3fe5f335da2fc6828a31d413e5935d31`; merge `9e1a392fcfc643ad00ae5352bb3b57799b077be4`; 6/6 review threads resolved |
| PR #7 | Merged; head `a016c4b1b735e201f49d5429375e9aebefc4cb3e`; tree `ad695394f9d70bafec95dfd12eb559c7604d2385`; merge `2736393ca5d38081282270f29b01b2b0f9f671df`; 1/1 review thread resolved |
| Main CI | Workflow/job `checks`; run `33600028132`; event `push`; status `completed`; conclusion `success`; head is the accepted main commit |
| Sanitized Artifact | ID `9834843477`; name `checks-reports-2736393ca5d38081282270f29b01b2b0f9f671df-33600028132-1`; SHA-256 `86c94702a0a8d72dfc95da67662e3b2d24a348ee07894573898f07ab4431007c`; exactly three parseable public-safe PASS JSON reports |
| Main Ruleset | `Protect main`, ID `21804174`; active; strict required context `checks`; Pull Request and thread resolution required; no bypass actor |

HW00-01 through HW00-06 and HW00-06R-03 are ancestors of the accepted main
commit. The committed HW00-01 through HW00-05 Evidence, PR #6/#7 receipts, and
the accepted main push CI form the consolidated lean phase Evidence set. Raw
GitHub Actions logs are not copied into Git.

## Gate check matrix

| Gate area | Result | Acceptance basis |
| --- | --- | --- |
| A. Repository foundation | PASS | One public repository and default `main`; one Program; one `pnpm-lock.yaml`; Node `24.18.0`; pnpm `11.17.0`; no npm/yarn/bun lock; frozen install and canonical commands passed in required hosted CI |
| B. Instructions and agents | PASS | Root instructions valid; exactly 4 Luna, 7 Terra, and 3 Sol project agents; every Sol route read-only; explicit exact model routing; Evidence validation rejects silent substitution |
| C. Public safety | PASS | Current main Git-index Public Safety and repository validation pass over 218 files; repository secrets count is zero; private paths are ignored and untracked; no prohibited hospital/person/patient/credential/certificate/network data found |
| D. Architecture, dependency, ownership | PASS | Target layout remains policy-only; dependency DAG is acyclic; negative fixtures pass; canonical and mirror ownership are byte-identical at 18/18 rules; zero child workspaces is recorded honestly; no placeholder product root exists |
| E. Legacy and external source | PASS | `sourceMode: none`; empty sources/adoptions; no submodule, history import, broad copy, compatibility runtime, or old source dependency; Knowe remains fixed-commit reference-only and no source, asset, test, or dependency was copied |
| F. CI integrity | PASS | Workflow/job remain `checks`; five remote Actions are full-SHA pinned; checkout credentials are not persisted; permissions are `contents: read`; no `pull_request_target` or repository secret; real PR/push ranges and every required governance checker run remotely; sanitized reports are present and parseable |
| G. Evidence semantics | PASS | Schema and semantic tests prevent PASS/CONDITIONAL evidence gaps, preserve negative outcomes, require exact model bindings and trusted source/result/tree identities, permit truthful missing receipts only for genuine BLOCKED decisions, and retain high/critical rollback/recovery treatment |
| H. Known Node Action warning | PASS with P2 | Complete required workflow passed while GitHub forced the four Node20-declaring Actions onto Node24; no insecure opt-out or failed check exists; maintenance is explicitly owned and dated below |

## Required independent reviews

| Agent | Model | Required outcome | Actual outcome | Findings |
| --- | --- | --- | --- | --- |
| `terra_reviewer` | `gpt-5.6-terra` | `APPROVED` | `APPROVED` | P0=0, P1=0, P2=1, P3=0 |
| `terra_security` | `gpt-5.6-terra` | `APPROVED` | `APPROVED` | P0=0, P1=0, P2=1, P3=0 |
| `sol_phase_gate` | `gpt-5.6-sol` | `PASS_RECOMMENDED` | `PASS_RECOMMENDED` | P0=0, P1=0, P2=1, P3=0 |

No model substitution occurred. All agents were read-only and bound their
outcomes to the accepted commit/tree and frozen pre-review manifest SHA-256
`16b1965c3adb8b774b21b0dfbd26d530d5c44a6e9b1cb4d4a3b15f3c5ef8aabc`.

## P2 maintenance disposition

`P2-F0-01` is non-blocking. The annotation names
`actions/checkout`, `actions/setup-node`, `actions/setup-python`, and
`actions/upload-artifact`. They remain immutable full-SHA pins, the entire run
succeeded under forced Node24, and no insecure Node20 opt-out exists.

- Owner: `toolchain-owner`
- Due: `2026-09-16`
- External deadline: GitHub Node20 removal on `2026-09-23`
- Required follow-up: replace the four pins with reviewed Node24-native Action
  majors and obtain successful required CI before the external deadline

The workflow is intentionally unchanged by this Gate.

## Rollback, recovery, and limitations

Rollback and recovery rehearsal are not applicable to this documentation-only
Gate. The uncommitted four-path candidate can be abandoned without changing
accepted main; any later committed correction uses the protected Pull Request
path. No published history is erased.

F0 PASS means only that the public greenfield repository foundation is accepted
and product-first MVP re-planning may begin. It does not mean that identity,
authorization, domain/database models, Outbox or event runtime, Agent runtime,
or Tauri exists. It does not establish Windows/WebView2/MSI or physical Anolis
testing, a real hospital integration, a pilot approval, or production approval.
HW-01 is not started by this decision.

## Parent rationale

All required Gate checks and exact model-bound reviews passed; P0 and P1 are
zero; the only open finding is the owned, dated, non-blocking P2 maintenance
item; and no Evidence-integrity conflict remains. Parent Codex therefore accepts
the independent recommendations and issues `F0-CLEAN-FOUNDATION = PASS`.
