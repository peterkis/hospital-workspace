# Legacy Source Migration Protocol

## Active no-source state

`LEGACY-SOURCE-MANIFEST.yaml` is the authoritative current-state manifest. Its
only active schema is `hospital-workspace.legacy-source.v2`. The active
`sourceMode: none` state requires empty `sources` and `adoptions`; no local
checkout is required for build, CI, tests, runtime, release, rollback, or
implementation. The required fallback is
`reimplement-from-target-contracts`.

Do not search for, restore, clone, or substitute deliberately absent legacy
sources. A later optional-local source needs a new human decision before any
adoption can be approved.

## Optional-local prerequisites

Optional-local is schema-valid only as an ignored local input and is read-only,
non-submodule, and independent of build, CI, tests, runtime, release, and
rollback. It must provide a public-safe source label, a full 40-character Git
commit, source path and SHA-256 hash, owner, license, provenance, target path,
and accepted migration receipt. The local checkout location stays only in
ignored local configuration.

Public-safe metadata scalars (`label`, `owner`, `license`, and `provenance`)
must be 1–120 ASCII characters, begin alphanumerically, end alphanumerically or
with `)`, and use only letters, digits, internal spaces, `.`, `_`, `:`, `+`,
`-`, `(`, or `)`. They must not be paths, URLs or remote schemes, file schemes,
emails, control text, or whitespace-padded identifiers.

Never copy a repository wholesale, import its Git history, broad-cherry-pick,
or make it a build, CI, test, runtime, release, or rollback dependency.

## Canonical migration modes

The exact, case-sensitive enum is:

- `COPY_ADAPT`: copy an approved, exact source asset and adapt it to the target
  architecture.
- `EXTRACT_ADAPT`: extract an approved bounded behavior or symbol and adapt it.
- `REFERENCE_ONLY`: retain a non-code reference candidate only; it is not an
  approved or active migration.
- `DO_NOT_MIGRATE`: record an explicit exclusion.

Aliases, including `COPY-ADAPT`, `EXTRACT`, `REFERENCE`, and `DO_NOT_COPY`, are
invalid. High-risk copy or extract adoptions may not use wildcards.

## Receipt and validation

Every optional adoption needs a receipt that records copied, changed, rejected,
and unverified items, source and target hashes, behavior/tests, reviewer result,
and limitations. The deterministic checker validates declarations, consistency,
ownership mirror, and deterministic static repository signatures. It does not
open an optional local source, recompute source or target hashes, compare
behavior, or prove security-behavior preservation. Those checks require the
future authorized migration receipt and review.
