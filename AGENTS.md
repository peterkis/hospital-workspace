# AGENTS.md — Hospital Workspace

## Repository contract

This is the single active public greenfield monorepo for Hospital Workspace:
`peterkis/hospital-workspace`. Treat every tracked byte as world-readable and
permanently copyable. The product is an event- and work-item-centered hospital
collaboration workspace; desktop packaging is a delivery surface, not business
authority.

Use the Node.js and pnpm versions pinned by `package.json` and CI. Program task
IDs are `HW-00` through `HW-12`.

## Always-on safety boundaries

- Track only generic source, public architecture, and deterministic synthetic
  data. Read `PUBLIC-DATA-BOUNDARY.md` before adding fixtures, screenshots,
  logs, Evidence, deployment examples, or configuration.
- Keep real hospital names, logos, people, patients, diagnoses, identifiers,
  internal endpoints, network topology, credentials, certificates, dumps,
  backups, screenshots, and production Evidence outside Git.
- Treat browser bundles, `VITE_*`, `NEXT_PUBLIC_*`, and Tauri-to-WebView
  payloads as public surfaces. Store private runtime configuration only in
  ignored local/private paths.
- Before every commit, review the staged diff and run
  `python tools/validate_repository.py --git-index`.
- Keep this repository greenfield. Do not wholesale-copy or submodule a legacy
  repository, import its history or generated output, or create compatibility
  behavior without an accepted ADR. A selected legacy copy requires a complete
  `docs/migration/LEGACY-SOURCE-MANIFEST.yaml` entry.
- The optional legacy checkout is read-only local input. It is never required
  for build, CI, test, runtime, release, or rollback.

## Authority boundaries

- Gateway/BFF plus Logto and the identity adapter own authentication. Redis is
  the only runtime Session authority. Redis or Scope uncertainty fails closed.
- Server-side Authz and Scope are rechecked on every write. Client state,
  hidden controls, chat text, prompts, notifications, and model output never
  grant authority.
- Each domain service owns its business state. Collaboration owns events,
  inbox, todos, work-item projections, decisions, handoffs, and replay; it does
  not write domain tables. Work Items and timelines are projections.
- Cards invoke registered, versioned commands with idempotency and expected
  version. Pending UI is not completion; an authoritative response or event is.
- Domain state and Outbox are one transaction. Delivery is at-least-once;
  producers, relays, and consumers are idempotent. Never claim exactly-once.
- Context references carry type, ID, and version. Resolve sensitive display on
  demand with fresh authorization; do not put clinical or financial content in
  URLs, local storage, generic notifications, or native payloads.
- Hospital Agents run in `services/agent-gateway`. Default tools are read-only;
  no shell, SQL, arbitrary HTTP, direct database, client filesystem, or browser
  automation. Risky writes require server authorization and user approval.
- `apps/desktop-shell` is privileged. Remote Workspace has zero native
  permission by default. Any native bridge needs an accepted ADR, exact caller
  binding, strict versioned payload, Rust validation, filtering, limits, audit,
  negative tests, kill switch, and rollback.

Read the detailed boundaries in:

- `docs/architecture/TARGET-ARCHITECTURE.md`
- `docs/architecture/DOMAIN-BOUNDARIES.md`
- `docs/architecture/SECURITY-BOUNDARIES.md`
- `docs/architecture/EVENT-COMMAND-PROTOCOL.md`
- `docs/architecture/HARNESS-STATE-MACHINE.md`
- `docs/architecture/AGENT-COORDINATOR-WORKER.md`
- `docs/architecture/KNOWLEDGE-GOVERNANCE.md`

Architecture documents describe target policy until an accepted phase creates
an implementation owner and evidence. Never infer implemented or
production-ready capability from a document.

## Instruction and task discovery

For every task, read in this order:

1. this file;
2. `docs/program/STATUS.md`;
3. `docs/program/README.md` and `docs/program/ROADMAP.md`;
4. `docs/program/GATES.md`;
5. while active, `docs/program/mvp/MVP-EXECUTION-OVERLAY.yaml`;
6. the active phase document and task YAML;
7. applicable accepted ADRs, architecture, migration, and governance docs;
8. the nearest nested `AGENTS.md` for every changed path.

If code, an accepted ADR, a task packet, or the overlay conflict, stop and
surface the conflict. Do not silently choose one source or rewrite policy.

Use this routing index:

| Work | Required source |
| --- | --- |
| Public data or Evidence content | `PUBLIC-DATA-BOUNDARY.md`, `docs/governance/EVIDENCE-POLICY.md` |
| Dependency or repository layout | `docs/governance/DEPENDENCY-RULES.md`, `docs/governance/DEPENDENCY-POLICY.yaml` |
| Legacy adoption | `docs/migration/MIGRATION-PROTOCOL.md`, `docs/migration/DO-NOT-MIGRATE.md` |
| Model routing or delegation | `docs/governance/MODEL-ROUTING.md`, `docs/program/SUBAGENT-ORCHESTRATION.md` |
| Review | `docs/governance/CODE-REVIEW-RULES.md` |
| Gate or Evidence decision | `docs/program/GATES.md`, `docs/governance/EVIDENCE-POLICY.md` |
| Repeated failure or known trap | `docs/retrospectives/README.md` |

## Change workflow

Before editing:

1. Confirm branch, HEAD, worktree, active task/overlay, prior Gate, dependencies,
   allowed paths, validation commands, and stop conditions.
2. Work on `hw/<phase>/<task>-short-name`, never directly on `main`.
3. Preserve unrelated and uncommitted user work. Stop if a required path is
   dirty and cannot be safely excluded.
4. Freeze one writer for the root manifest/lockfile, Prisma schema/migration,
   Tauri capabilities, event catalog, and shared state machines.

During editing, make the smallest complete change. Do not add speculative
abstractions, dependencies without rationale and lock review, compatibility
paths, dual-read/write, hidden fallbacks, weakened assertions, fabricated
Evidence, or unapproved external calls.

After editing:

1. Run targeted behavior and negative/recovery tests appropriate to the change.
2. Run the owning package's lint, typecheck, test, and build commands.
3. Run applicable contract, catalog, dependency, database, and boundary checks.
4. Run `git diff --check` and review the complete integrated diff.
5. Stage an explicit reviewed path allowlist. Never use `git add .`, `-A`, or
   `--all`.
6. Apply the review and acceptance route declared by the task and risk policy.

Use `package.json`, package manifests, and CI as the command authority. Do not
duplicate an identical full suite locally and remotely unless the local host is
the target environment, CI failed, the reviewed result changed, or the task
requires a second environment.

## Delegation and acceptance

The parent owns ambiguous architecture, security/identity, database baseline,
Tauri/native boundaries, cross-service integration, destructive operations,
the final integrated diff, Gate, PR, merge, release, and user report.

Use the configured agents in `.codex/agents/` and follow
`docs/program/SUBAGENT-ORCHESTRATION.md`. Every spawn packet includes task ID,
one objective, dependencies, read/write paths, frozen decisions, validation,
evidence, completion criteria, stop conditions, and return format. Maximum:
eight total agents, three disjoint write agents.

Subagents do not commit, push, open/merge PRs, release, close Issues, change
repository settings, or write external systems. The parent performs those
actions only when the user authorizes them.

Luna handles narrow inventory, fixtures, docs, hashes, and log summarization.
Terra handles bounded implementation, contracts, migration, integration/failure
testing, browser reproduction, correctness review, and first-line security
review. Sol is an independent read-only acceptance layer. Required Sol routing
comes from task/phase policy; if that model is unavailable, report the exact
error and mark the acceptance `BLOCKED`. Never substitute another model while
claiming a Sol result.

## Review, Gate, and Evidence truth

- Mechanical formatting, dependency, generated-file, and public-data rules
  belong in deterministic checks. Judgment rules belong in
  `docs/governance/CODE-REVIEW-RULES.md`.
- Bind CI, reviews, screenshots, logs, artifacts, rollback, and Evidence to the
  exact final commit or tree. Any material change invalidates older receipts.
- Preserve intermediate `RED`, `FAIL`, `NOT_RUN`, and `BLOCKED` results. A later
  pass is a new run, not a rewrite of history.
- `PASS` requires every declared check, negative/recovery scenario, Evidence,
  Terra review, required Sol report, and `sol_phase_gate=PASS_RECOMMENDED`.
  Critical security, permission, data integrity, state, rollback, Evidence,
  P0/P1, or required-Sol failures are never `CONDITIONAL`.
- A browser test is not Tauri/WebView2/MSI proof. Linux is not Windows. WSL2 is
  not physical Anolis. Mock or synthetic behavior is not hospital integration,
  clinical pilot, or production readiness. A screenshot or model summary does
  not prove behavior.

Low-risk documentation work normally uses one implementation commit, required
GitHub `checks`, and one external read-only Terra review. Medium implementation
work uses targeted local tests, required CI, and final-head/tree Terra review.
High/critical, identity, authorization, database, Tauri, clinical, financial,
migration, rollback, and Evidence-integrity work keeps its declared structured
Evidence and Terra/Sol route.

## Product-First MVP overlay

While the overlay is active, it controls near-term order only. Execute only the
current slice or an explicitly authorized supplemental iteration. A prototype
subset never completes a canonical task and never weakens identity,
authorization, database, Outbox, Tauri, or sensitive-data boundaries. Only the
human owner may retire or replace the overlay.

Carry forward `P2-F0-01` exactly: owner `toolchain-owner`; due `2026-09-16`;
required before `2026-09-23`; migrate the four Node20-declaring Actions to
reviewed Node24-native full-SHA pins. It does not block MVP-01 and must not be
silently deferred.
