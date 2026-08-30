# Synthetic Legacy Source Fixtures

`manifest-fixtures.mjs` provides deterministic, public-safe manifests for the
no-source state and schema-valid optional-local cases. Tests materialize each
fixture in a temporary repository so no legacy checkout is needed.

The negative cases cover provenance completeness, prohibited migration modes,
dependency flags, path safety, and repository signatures. They contain no
legacy source code, repository URL, local machine path, credential, or hospital
data.
