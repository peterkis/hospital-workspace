# License and Provenance

## Repository license status

The repository is public, but no general software license has yet been granted. See root `COPYRIGHT.md`.

## Optional owner-controlled legacy source

A local legacy checkout is currently intentionally absent. The active manifest
uses `sourceMode: none`; no source is required for build, CI, tests, runtime,
release, or rollback. The public no-source receipt records that decision.

Only after a new human decision may an optional local checkout be configured in
ignored `config/local/legacy-source.yaml`. Every adopted asset then requires a
Migration Receipt recording a public-safe source label, full source
commit/digest, source path/hash, target path, ownership, license/provenance,
adaptation, tests, reviewer conclusion, and limitations.

The legacy source is never a runtime dependency, Git submodule, CI input or broad cherry-pick source.

## Third-party sources

Design references do not authorize code copying. Any copied third-party source requires:

- exact repository and commit;
- source file path;
- license compatibility review;
- preserved notices/attribution;
- target file path and adaptation description;
- tests and independent review.
