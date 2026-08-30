# Dependency Rules

## Authority and scope

[DEPENDENCY-POLICY.yaml](DEPENDENCY-POLICY.yaml) is the machine-readable authority for the frozen target layers and allowed edges. It is JSON-compatible YAML and is parsed as strict JSON by `scripts/governance/check-dependency-dag.mjs`; the repository therefore gains no YAML-parser dependency. [REPOSITORY-LAYOUT.md](../architecture/REPOSITORY-LAYOUT.md) explains the human-facing layer model.

Every `@hospital/*` dependency must resolve to an actual first-party workspace and use `workspace:` in every manifest dependency field. The checker parses the same narrow `pnpm-workspace.yaml` subset as the workspace-contract checker (`packages: []` or quoted patterns), rejects an unregistered on-disk child manifest and rejects a registered pattern without a manifest. Every `packages/*-repository` also requires an explicit owner mapping. The current `packages: []` state is a passing result, not a skipped check.

## Allowed directions

```text
frontend -> UI / SDK-client / pure contract / pure utility
service  -> own repository / contract / approved kernel / pure utility
repository -> database-runtime / contract / approved kernel / pure utility
contract -> pure contract / pure utility / external zod
```

Desktop shell has only exact contract/SDK utility seams. Infrastructure kernels, database runtime, UI, SDK/client and test-support packages have their narrower policy edges in the machine policy. `database/**` and `infrastructure/**` are governed assets, not workspace packages.

## Denied edges and source forms

- frontend, SDK/client and UI may not depend on Prisma, `pg`, Redis clients, Fastify, Node/server runtime imports or native Tauri API; React remains permitted for frontend/UI;
- platform and domain services may use server framework/Node APIs, but may not directly depend on Prisma, `pg` or Redis clients; database access stays behind repositories and approved infrastructure kernels;
- domain and platform services may not depend on UI; a domain service may not reach another domain repository or database/model path;
- Collaboration and Agent Gateway may not reach any domain repository;
- contracts and pure utilities use a fail-closed external allowlist (`zod` today); React, Fastify, Tauri, Prisma, `pg`, Redis and Node runtime imports are denied. These restrictions are per-layer: they do not ban legitimate Fastify/Node use in a server service or `@tauri-apps/api` use in Desktop Shell;
- `@portal/*`, unapproved Next.js and unapproved generic `@tauri-apps/plugin-*` dependencies are denied;
- imports must use public package entry points declared by `exports`; `package/src/**` and `package/internal/**` are private;
- relative imports that resolve from one workspace into another are denied;
- committed generated source markers/locations and dependency cycles are denied.

The policy also reserves raw database access for `database-runtime` and domain-owned repositories. Until those workspaces and Prisma models exist, that database rule is policy-and-fixture coverage only; it is not production Prisma enforcement.

## Deterministic enforcement

Run:

```text
node scripts/governance/check-dependency-dag.mjs
node --test scripts/governance/check-dependency-dag.test.mjs
```

The policy's `externalAllowlistEnforcedLayers` is strict and presently requires `frontend`, both service layers, `contract` and `pure-utility`; external package roots are normalized before allow/deny checks, so `zod/v4`, `next/server` and package subpaths follow their owning package policy. The checker discovers on-disk child manifests under `apps/`, `services/` and `packages/`, reconciles them against the workspace patterns, scans statically detectable module specifiers across each workspace, respects `exports`, validates workspace protocol, and runs a depth-first graph cycle algorithm. It also rejects committed `dist/`, `generated/`, `.next/`, `target/`, `src/generated/`, `*.generated.*` and `@generated` artifacts. It emits code-point-sorted JSON patterns, nodes, edges and findings. The dedicated fixtures cover the valid frontend/service/repository/contract edges, permitted layer-specific runtime use, and every denied category with its expected finding code; counting package directories alone is insufficient.
