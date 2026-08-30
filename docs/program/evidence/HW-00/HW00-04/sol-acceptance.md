# HW00-04 Sol acceptance

Outcome: `ACCEPT`

| Field | Value |
| --- | --- |
| Task | `HW00-04` |
| Acceptance tier | `sol-acceptance` |
| Agent | `sol_acceptance` |
| Model | `gpt-5.6-sol` |
| Reasoning effort | `xhigh` |
| Review mode | Read-only, independent |
| Review completed | `2026-08-30T18:13:37+08:00` |
| Source main commit | `0926cc8b62d2c008e6fca202e81b052cb31c0531` |
| Implementation commit | `7a9b02e5a1bc6b1e55b251bd230c970dcf52142a` |
| Implementation tree | `7889b878cb8d8b747660ed0f50a549a18fc90315` |
| Complete diff range | `0926cc8b62d2c008e6fca202e81b052cb31c0531..7a9b02e5a1bc6b1e55b251bd230c970dcf52142a` |
| Complete diff SHA-256 | `3899ead97ed6b076d9bf7ef75f6966018113098df622a1503273482edacfb3c6` |
| Implementation tree-listing SHA-256 | `b304cfded77126f32f4315fcfab22d4198f6f4c3ec54da2d671cba5bb208e077` |
| Evidence candidate Git tree | `01e6dac6ca0754f1057adb1a28cd9c2cccd61abb` |
| Evidence candidate digest | `79eb87c1846c28a3eb8d56c3a01d055565b76805676354e6ba1927c41c35a121` |
| Terra report SHA-256 | `5dddc914cd87969e5d962ef5d1f53c3757e6dd4274a7fcd6e2ad3db754572eed` |

The configured Sol route was available and used without substitution. The
reviewer independently verified that all five candidate component hashes, the
candidate digest/tree, the complete-diff hash, the implementation tree-listing
hash, and the Terra report hash matched their frozen values. The candidate
worktree blobs remained identical to the Terra-reviewed inputs.

## Findings

| Severity | Count | Disposition |
| --- | ---: | --- |
| P0 | 0 | None |
| P1 | 0 | None |
| P2 | 0 | None |
| P3 | 1 | The unchanged task prose retains older hyphenated labels. This is disclosed and non-blocking because the active protocol/checker define and enforce the exact underscore enum and the negative fixture rejects the alias. |

No open P0 or P1 remains.

## Required acceptance assessment

1. No-source semantics are unambiguous: the active manifest requires
   `sourceMode: none`, empty sources/adoptions, and false dependency/import
   flags; the checker rejects violations.
2. Absence of legacy source does not block the Program. Target-contract
   reimplementation is the required fallback.
3. No hidden build, CI, test, runtime, release, or rollback dependency exists.
   The implementation diff is limited to ten migration paths and the exact
   two-file ownership extension.
4. No recovery, search, reclone, reconstruction, substitution, or source-
   history path was introduced. Git access is limited to repository inventory
   and ignore-policy inspection.
5. Future optional-local mode is strict, ignored, read-only, non-submodule,
   independent of build/CI/tests/runtime/release/rollback, and bound to public-
   safe provenance, full commit, hash, exact paths, owner/license, and receipt.
   Its current proof is synthetic only.
6. Unregistered-copy controls fail closed for declared signatures, unreadable
   Git inventory, symlinks, Gitlinks, `.gitmodules`, local configuration,
   generated contamination, and registered-target boundaries.
7. `ASSET-ADOPTION-MATRIX.md` contains historical reference candidates only
   and represents no approved or active migration.
8. Evidence records the required state, every positive and negative fixture,
   exact commands and exit codes, rollback, public-data boundary, and honest
   limitations.
9. Terra's `APPROVED` outcome and every immutable binding remained valid.

## Independent command results

| Command or check | Result |
| --- | --- |
| Git source/tree/merge-base/path/status checks | PASS; 12 authorized implementation paths; real index and tracked worktree clean |
| Raw complete-diff and recursive tree-listing hashes | Exact match |
| Candidate components, digest, worktree blobs, and Git tree | Exact match |
| Active migration checker twice | Exit `0/0`; byte-identical PASS, zero findings |
| Migration fixture suite | Exit 0; `98/98` |
| Dependency checker | Exit 0; ownership `18/18`, findings 0 |
| Implementation and candidate diff checks | Exit `0/0` |
| Required `source-state.json` verifier | Exit 0 |
| Public-safety scan of candidate and Terra report | PASS; no private URL, absolute local/profile path, email, IP, credential, machine identifier, or hospital identifier |

Git trust was supplied only command-scoped after the checkout ownership safety
boundary refused unscoped access. No persistent Git configuration changed.

## Limitations and rollback

This proves active no-source state and deterministic synthetic policy behavior
on native Windows. It does not prove a future optional checkout, source or
target hash recomputation, copied behavior, security equivalence, remote CI,
deployment, pilot, or production behavior. Migration-checker CI wiring remains
HW00-06 scope.

Rollback is a reviewed revert of implementation commit
`7a9b02e5a1bc6b1e55b251bd230c970dcf52142a`; the Evidence overlay is
independently removable. No database, runtime, source-repository, deployment,
or external-system rollback is involved.

This `ACCEPT` is mandatory task evidence but advisory to Parent Codex. It does
not complete HW-00, run `sol_phase_gate`, authorize a later task, or authorize
commit, push, PR, merge, release, deployment, pilot, production, or external
mutation. The reviewer changed no file, Git state/configuration, or external
system.

Final Sol outcome: `ACCEPT`.
