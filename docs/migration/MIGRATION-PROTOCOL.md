# Optional Legacy Adoption Protocol

## 0. Source mode

No legacy checkout is required for build, CI or implementation. When `config/local/legacy-source.yaml` is absent, record `sourceMode: none` and implement from the target architecture, contracts, fixtures and acceptance criteria.

Use the remaining steps only when the repository owner deliberately enables an ignored, read-only local source.

## 1. Pin

Record a public-safe source label, a full local commit SHA, exact source path and license/provenance. The local repository path and environment-sensitive details remain outside Git.

## 2. Explore read-only

Map source files, public APIs, tests, generated artifacts, dependencies, sensitive data and behavior worth preserving. Exploration must not mutate the source checkout.

## 3. Approve an exact whitelist

The parent approves exact files or symbols. Directory-wide wildcards are insufficient for high-risk code.

## 4. Copy and adapt

Do not broad cherry-pick and do not copy Git history. Adapt package scope, imports, configuration, contracts, service boundary, database ownership and tests.

## 5. Clean

Remove generated outputs, obsolete UI, old migrations, environment assumptions, certificate/private material and comments that claim obsolete guarantees.

## 6. Validate

Run source hash checks, preserved-behavior tests, new boundary tests, security negative tests, generated-file scans, dependency graph checks and the complete task Gate.

## 7. Receipt

Record source label/commit/path/hash, target path/hash, copied/adapted/rejected files, behavior preserved or changed, tests, reviewer and limitations.

If no optional source is used, a short no-source receipt is sufficient. A task must not become BLOCKED merely because no legacy checkout exists.
