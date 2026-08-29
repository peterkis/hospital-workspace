# License and Provenance

## Repository license status

The repository is public, but no general software license has yet been granted. See root `COPYRIGHT.md`.

## Optional owner-controlled legacy source

A local legacy checkout may be used only when configured in ignored `config/local/legacy-source.yaml`. Every adopted asset requires a Migration Receipt recording a public-safe source label, local source commit/digest, source path, target path, ownership, adaptation, tests and reviewer conclusion.

The legacy source is never a runtime dependency, Git submodule, CI input or broad cherry-pick source.

## Third-party sources

Design references do not authorize code copying. Any copied third-party source requires:

- exact repository and commit;
- source file path;
- license compatibility review;
- preserved notices/attribution;
- target file path and adaptation description;
- tests and independent review.
