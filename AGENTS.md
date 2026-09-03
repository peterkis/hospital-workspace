# AGENTS.md — Hospital Workspace

## 0. Repository identity

This repository is the single active **public** greenfield monorepo for **Hospital Workspace**.

- Target repository: `peterkis/hospital-workspace`
- Optional legacy source: configured only in ignored `config/local/legacy-source.yaml`; never required for build or CI.
- Interaction/mechanism reference only: `HirezmingD/Knowe-agent-groupchat@1e584f84734e9db55515ef4391fcb9e9c40399cd`
- Node.js: `24.18.0`
- pnpm: `11.17.0`

An optional owner-controlled legacy checkout may be used locally as a read-only source of selected assets. It is never a submodule, runtime dependency, CI input, compatibility target, or authority for this repository.

Program task IDs use `HW-00` through `HW-12`.


## 0.1 Public repository boundary

Everything tracked in this repository must be assumed world-readable and permanently copyable.

Non-negotiable:

- Never commit real hospital names, logos, employee/person data, patient data, diagnoses, identity numbers, inpatient/outpatient numbers, screenshots, logs, database dumps, backups or production evidence.
- Never commit real internal IP addresses, internal DNS names, server roles, firewall topology, asset identifiers, certificate fingerprints or production endpoint mappings.
- Never commit passwords, tokens, API keys, client secrets, private keys, signing certificates, production certificates, `.env` files or runtime configuration.
- Private runtime configuration lives only under ignored paths such as `config/local/`, `config/private/`, `deploy/private/`, `deploy/targets/`, `certificates/local/`, `certificates/private/`, `branding/private/` and `secrets/`.
- Public examples use `Example Hospital`, `example.internal`, `10.0.0.0/24` and deterministic synthetic identities/data only.
- `.gitignore` is preventive, not a secret vault. Before every commit, review the staged diff and run `python tools/validate_repository.py --git-index`.
- A clean clone without any hospital-specific configuration must pass the repository's current public checks.
- `VITE_*`, `NEXT_PUBLIC_*`, browser bundles and Tauri-to-WebView payloads are public data surfaces and may never contain secrets.
- Security-sensitive deployment details belong in hospital-controlled systems outside GitHub, not in another active source repository.

## 1. Product mission

Build a hospital desktop collaboration workspace organized around:

- people;
- events;
- tasks;
- work items;
- context;
- decisions;
- handoffs;
- knowledge;
- accountable outcomes.

The basic user units are:

```text
我的待办
我的消息
一个报修工单
一笔确费
一次交班
一个科室协作事项
一个 Agent 任务
一个知识整理项目
```

Users should answer:

- What happened?
- Do I need to act?
- What is the current state?
- Who is following up?
- What information or decision is missing?
- What is the final outcome?

Desktop packaging is a delivery surface. Event-driven and work-item-driven coordination is the architecture.

## 2. Core product model

```text
Person / Role / Organization / Context
        |
        v
Capability Space
        |
        v
Thread / Business Instance / Project
        |
        v
Work Item + Activity Timeline
        |
        +--> Structured Card / Canvas
        +--> Decision / Approval
        +--> Handoff
        +--> Agent Run / Task / Artifact
        |
        v
Server-authoritative Command
        |
        v
Domain Transaction + Outbox
        |
        v
Domain Event -> Collaboration Projection
```

Chat is for expression, explanation and collaboration. Chat text is never a deterministic business state transition.

Cards execute registered commands. Domain services own business truth. Collaboration services own events, inbox, todos, work-item projections, decisions and handoffs. The client owns presentation only.

## 3. Target topology

```text
Tauri 2 Trusted Shell
  - single instance, tray, lock/resume, profile cleanup
  - no business database
  - no model API key
  - no portal token/cookie custody
  - remote Workspace WebView has zero native permission by default
        |
        v
Hospital Workspace Web
  - React + Vite, immutable same-origin release
  - browser and desktop use the same build
  - spaces, threads, timeline, cards, canvas, agent and knowledge UI
        |
        v
Gateway / BFF
  - Logto, identity adapter, Redis session, CSRF
  - Principal, authorization, Scope, capability registry
        |
        +-----------------------+
        v                       v
Collaboration Service      Hosp Access Service
  events/outbox ingest       controlled hospital upstream access
  inbox/todos/SSE
  work-items/harness
  decisions/handoffs
        |
        +-----------------------+
        v
Independent domain services
  tickets / fee / handover / knowledge / agent-gateway
        |
        v
PostgreSQL 18 + Redis
```

Platform modules may share a runtime only when they share security, scaling and transactional boundaries. Business domains remain independent authoritative services.

## 4. Greenfield rules

Non-negotiable:

- Do not copy the legacy repository wholesale.
- Do not cherry-pick large legacy commits.
- Do not add the legacy repository as a Git submodule.
- Do not preserve old URL, Cookie, API, database, page, deployment or Issue compatibility unless a new accepted ADR explicitly requires it.
- Do not copy legacy `package.json`, lockfiles, root Prisma schema, migrations, seed, Phase scripts, Evidence or GitHub Issues.
- Do not import legacy Next.js UI, `hub-next`, local Agent API keys or generated `.js/.d.ts` files from source directories.
- Every legacy code copy requires an entry in `docs/migration/LEGACY-SOURCE-MANIFEST.yaml` with source commit, source path, target path, hashes, tests and migration mode.
- Git history in the legacy repository is the archive. Dead code does not live in the new runtime tree.

## 5. Knowe adoption boundary

Adopt the ideas:

- group-chat-like Agent collaboration;
- Coordinator and specialized Worker roles;
- deterministic Harness task lifecycle;
- Decision and Handoff traceability;
- user judgment above model inference;
- active/retired and scoped knowledge;
- event replay and Outbox reliability.

Do not adopt:

- Electron as the final shell;
- a Python backend on every clinical workstation;
- JSONL/Markdown as hospital business truth;
- unrestricted terminal, shell, SQL, arbitrary HTTP or filesystem tools;
- client-side model provider API keys;
- local project directory sandbox claims as the hospital security boundary;
- an Agent message claiming a business task is complete.

## 6. Authority matrix

| Concern | Authority |
| --- | --- |
| Authentication | Gateway/BFF + Logto + Identity Adapter |
| Runtime Session | Redis only |
| Person/organization mapping | Identity domain |
| Functional permission | Server-side Authz Core |
| Data Scope | Server-side Scope Resolver |
| Capability metadata | Capability Registry |
| Ticket state | Tickets Service |
| Fee state | Fee Service + upstream HIS truth |
| Handover state | Handover Service |
| Knowledge state | Knowledge Service |
| Agent Run state | Agent Gateway + Harness |
| Event/inbox/todo/work-item projection | Collaboration Service |
| Desktop window/profile/native lifecycle | Tauri Runtime |
| UI display | Workspace projection only |

No client, Agent prompt, notification or Hub message can override an authority above.

## 7. Repository boundaries

Target layout:

```text
apps/
  workspace-web/
  desktop-shell/

services/
  gateway/
  collaboration/
  hosp-access/
  tickets/
  fee/
  handover/
  agent-gateway/
  knowledge/

packages/
  contracts-core/
  event-contracts/
  command-contracts/
  identity-contracts/
  capability-contracts/
  workspace-contracts/
  workitem-contracts/
  harness-contracts/
  card-protocol/
  agent-contracts/
  knowledge-contracts/
  api-client/
  capability-sdk/
  hub-client/
  authz-core/
  database-runtime/
  postgres-core/
  redis-core/
  time-core/
  observability/
  ui/
  testkit/

database/
infrastructure/
scripts/
docs/
evidence/
```

Do not create all target directories up front. A directory enters the repository only when its phase creates a real owner, public contract, tests and build command.

## 8. Dependency rules

Allowed direction:

```text
apps -> UI / SDK / pure contracts
services -> repositories / infrastructure / pure contracts
repositories -> database-runtime
database-runtime -> generated Prisma client / postgres-core
contracts -> Zod and pure TypeScript utilities only
desktop-shell -> trust-policy and exact native contracts
```

Forbidden:

- frontend -> Prisma, `pg`, Redis, Node request objects, server-only modules or service secrets;
- pure contract -> React, Fastify, Prisma, database, filesystem or network;
- service -> Workspace UI;
- one domain service -> another domain's database schema;
- Collaboration Service -> direct business table writes;
- Agent Gateway -> direct domain database writes;
- remote Workspace -> generic Tauri shell/filesystem/process/HTTP/window permissions;
- deep imports across package private paths;
- circular workspace dependencies.

## 9. Database rules

- Use PostgreSQL 18 with a new migration lineage starting at the new repository.
- Use Prisma 7 multi-file schema and PostgreSQL named schemas.
- Organize model files by domain.
- Redis is the only runtime Session authority; do not create PostgreSQL Session/RefreshSession authority tables.
- Raw Prisma Client is only available in approved repository modules.
- Service handlers, frontend and contracts cannot import the raw client.
- Each domain writes only its owned schema.
- Cross-domain information travels through APIs, events and ContextRefs, not table joins in application code.
- Seeds are synthetic, deterministic and idempotent.
- No real employee, patient, diagnosis, identity number, token or hospital secret enters fixtures or evidence.
- Every migration requires empty-database replay, backup/recovery impact and rollback/rebuild evidence.

## 10. Identity, authorization and shared terminals

- Browser and Tauri WebView use the same immutable Workspace release, Gateway/BFF, Logto web client and HttpOnly session.
- Rust must not read, persist, log or expose OIDC tokens, portal cookies or localStorage.
- Session creation, rotation, family revocation and authorization-version validation use Redis.
- Redis unavailable means fail closed; never fall back to memory or PostgreSQL.
- Authorization is default deny; explicit deny precedes allow.
- Scope is `none`, `all` or validated `restricted`; ambiguity is `none`.
- The server rechecks permission, Scope, state and resource version on every write.
- Logout and switch-person revoke the whole session family.
- Lock, sleep, remote disconnect and second-instance activation enter Trusted Resume.
- Until resume returns an exact authorized session, the application remains hidden or privacy-masked.
- Switch-person clears the launch-scoped WebView2 profile and sensitive UI state.

## 11. Event, Outbox and projection rules

- Use `EventEnvelopeV1` and registered schemas.
- Every event has a stable `eventId`, event type, schema version, aggregate/version, actor, context, correlation, causation, trace, timestamps, sensitivity and payload.
- Domain state and Outbox are written in one transaction.
- Delivery is at-least-once. Producers, relays and consumers are idempotent.
- Do not claim exactly-once.
- Direct producer-to-Hub calls cannot replace Outbox.
- Collaboration Event Store, Inbox, Todo and Work Item are projections, not domain truth.
- Unknown event versions are rejected or quarantined; never guessed.
- One Workspace session owns one SSE connection. Capabilities cannot create their own.
- Reconnect recovers durable gaps before resuming live delivery.
- Event cursor, read cursor and unread count are separate concepts.
- A notification is a privacy-filtered projection of an event.

## 12. Work Item, Card, Harness and context rules

- A Work Item references a source aggregate and domain status; it does not invent or overwrite domain state.
- Activity Timeline entries preserve event provenance.
- Cards are versioned data and registered actions, not executable code.
- Card actions include `commandId`, `idempotencyKey` and `expectedVersion`.
- Pending UI is not completion. Only an authoritative response/event completes the action.
- Unknown cards render a safe non-actionable fallback.
- Canvas routes resolve only registered capabilities.
- ContextRefs hold type/id/version only. Sensitive display snapshots are resolved on demand and reauthorized.
- Patient and clinical content is not stored in localStorage, URLs, generic notifications or native surface payloads.
- Harness transitions are deterministic and audited.
- Decisions are explicit; user approval/rejection is authoritative.
- Handoffs record sender, receiver, reason, context, acceptance and evidence.
- Model text cannot mark a Harness task complete.

## 13. Agent rules

Hospital Agents run in `services/agent-gateway`.

Default posture:

- no shell;
- no SQL;
- no arbitrary HTTP;
- no direct database access;
- no client filesystem;
- no browser automation;
- no local workstation model API keys;
- no patient context unless explicitly authorized and minimized;
- read-only tools by default;
- provider-native structured tool calls only;
- service-side permission and Scope on every tool;
- user approval for risky writes;
- cancellation quarantines late results;
- every Run, Task, Attempt, ToolCall, Approval, Decision, Handoff and Artifact is auditable.

Coordinator:

- creates bounded Task Envelopes;
- defines goals, inputs, tools, dependencies and validators;
- may not invent Worker results;
- summarizes with evidence references.

Worker:

- has a dedicated role and allowlist;
- cannot expand its own tools or Scope;
- returns structured result, artifacts, limitations and handoff.

## 14. Knowledge governance rules

- Knowledge Service is the authority; search indexes and embeddings are derived.
- Every node, relation and claim has source provenance and version.
- Statuses include draft, in-review, approved, active, retired and rejected.
- Scopes include hospital, campus, department and project.
- Retired knowledge remains historically traceable.
- Agent extraction creates proposals only.
- Human expert Decision is required for active/published clinical or governance knowledge.
- Ordinary retrieval excludes draft, rejected and retired content unless a privileged review workflow explicitly asks for it.
- Search applies authorization and Scope before ranking and returns provenance.

## 15. Tauri and native surface rules

`apps/desktop-shell` is a privileged security boundary.

Preserve:

- exact origin/path/label binding;
- remote capability `none` by default;
- hidden `about:blank` until security hooks are armed;
- download/iframe/new-window/navigation denial;
- system certificate trust as the default;
- launch-scoped shared InPrivate Profile;
- fail-closed audit and cleanup;
- Trusted Resume;
- no generic native plugins.

A native bridge requires:

1. an accepted ADR;
2. exact Workspace caller binding;
3. a versioned strict payload;
4. Rust-side revalidation;
5. sensitivity filtering;
6. rate limiting, deduplication and expiry;
7. persistent audit;
8. negative/fuzz tests;
9. a kill switch and rollback.

Native surfaces never receive patient names, diagnoses, inpatient numbers, identity numbers or detailed fee data.

## 16. Codex parent and subagent model routing

The parent Codex agent owns:

- ambiguous architecture;
- security and identity decisions;
- database baseline and destructive changes;
- Tauri/native boundaries;
- cross-service integration;
- final diff review;
- full Gate execution;
- PR, merge, release and user reporting.

Use project agents in `.codex/agents/`.

### Luna

Use Luna for fast, narrow, repeatable or high-volume work:

- code/path inventories;
- fixture generation;
- documentation and manifests;
- repetitive contract examples;
- source hash/provenance checks;
- log summarization.

### Terra

Use Terra for work requiring stronger judgment:

- contract implementation;
- bounded feature implementation;
- legacy asset adaptation;
- integration/failure testing;
- browser reproduction;
- correctness review;
- first-line security review.

### Sol

Sol is an independent read-only acceptance layer, not an implementation worker.

Use:

- `sol_acceptance` for completed high-risk work packages and critical E2E/acceptance evidence;
- `sol_architecture_security` for critical identity, authorization, database, event, Tauri, clinical/financial, Agent-tool, release and HA boundaries;
- `sol_phase_gate` after all task outputs, tests, evidence and Terra reviews are frozen.

Required Sol outcomes:

- task acceptance: `ACCEPT`;
- architecture/security acceptance: `ACCEPT`;
- phase exit recommendation: `PASS_RECOMMENDED`.

A Sol report is mandatory evidence where the task/phase matrix requires it, but Sol never makes the final architecture, security, migration, release or Gate decision. The parent Codex remains the final engineering decision owner; pilot/production also require the named human owner.

Luna, Terra and Sol never commit, push, open/merge PRs, release, close Issues or change external systems unless the user explicitly authorizes the parent to do so.

If a configured model is unavailable, report the exact routing error. A required Sol review becomes `BLOCKED`; do not silently substitute another model while claiming it was Luna, Terra or Sol.

## 17. Delegation rules

Before spawning an agent, the parent defines:

- task ID;
- objective;
- dependencies;
- allowed read paths;
- allowed write paths;
- frozen decisions;
- validation commands;
- evidence;
- completion criteria;
- stop conditions.

Parallel work:

- read-only agents may run in parallel;
- write agents may run in parallel only with disjoint files;
- maximum concurrent write agents: 3;
- maximum total subagents: 8;
- Sol acceptance agents are read-only and normally run after implementation threads complete; run at most one `sol_phase_gate` per phase;
- root manifest, lockfile, Prisma schema, Tauri capability, event catalog and shared state machines have one writer at a time.

Subagents do not:

- commit;
- push;
- open or merge PRs;
- close Issues;
- alter repository settings;
- write external systems;
- expand scope.

Required return:

1. completed scope;
2. files read;
3. files changed;
4. implementation/findings;
5. commands and exact result;
6. tests/evidence;
7. risks/unresolved;
8. parent handoff.

## 18. Change workflow

Before editing:

1. Read root and nearest nested instruction files.
2. Read the active `docs/program/phases/HW-xx-*.md` and task YAML.
3. Confirm branch, HEAD and worktree.
4. Inspect current owning code and tests.
5. Freeze allowed paths and commands.
6. Verify dependencies and prior Gate.
7. Stop on authority or security conflicts.

During editing:

- make the smallest complete change;
- keep unrelated files untouched;
- do not reformat the repository;
- do not add speculative abstractions;
- do not add dependencies without explicit rationale and lock review;
- do not add compatibility, dual-read, dual-write or hidden fallback;
- do not weaken assertions;
- do not fabricate evidence;
- do not call unapproved external services.

After editing:

1. targeted tests;
2. package lint/typecheck/test/build;
3. contract/catalog/boundary/database checks;
4. negative and recovery tests;
5. `git diff --check`;
6. complete integrated diff review by the parent;
7. independent Terra review and Terra security review where required;
8. task-level `sol_acceptance` or `sol_architecture_security` where declared in the task matrix;
9. phase-level `sol_phase_gate` and any additional required Sol phase review;
10. parent full Gate and evidence decision;
11. human pilot/production decision where required.

## 19. Testing expectations

Required where applicable:

- contract valid/invalid fixtures;
- state-transition tables;
- permission and Scope negative tests;
- idempotency and concurrent expected-version conflicts;
- Outbox crash-before/after-send;
- duplicate/out-of-order/replay;
- Session revoke and Redis fail-closed;
- context redaction and cache absence;
- Browser Playwright;
- real Windows Tauri/WebView2/MSI;
- no-egress Anolis release;
- backup/restore and rollback;
- Agent prompt/tool injection;
- knowledge provenance and scope;
- accessibility, keyboard and performance.

Linux-only results do not prove Windows/WebView2/MSI. WSL2 or Mock results do not prove physical Anolis.

## 20. Gate and evidence rules

Gate states:

- `PASS`: all required checks, negative/recovery scenarios, evidence, Terra reviews and declared Sol acceptance reports pass; `sol_phase_gate` returned `PASS_RECOMMENDED`.
- `CONDITIONAL`: only non-security, non-permission, non-data-integrity follow-up remains with owner and deadline; a required Sol `REJECT`, `BLOCKED` or missing report cannot be conditional.
- `BLOCKED`: any required check/evidence/review is failed, missing, stale, bound to the wrong commit/tree, or unsupported by the environment.

Identity, authorization, sensitive data, Tauri security, data loss, wrong business state, rollback, evidence integrity and P0/P1 findings cannot be conditional.

Evidence binds:

- source commit;
- result commit/tree digest;
- environment;
- command and exit status;
- raw log;
- artifact hashes;
- negative scenarios;
- rollback;
- Terra reviewer/security reports;
- required Sol task/architecture/phase reports;
- limitations;
- parent decision;
- human decision where required.

Do not rewrite approved evidence. Create a new evidence run.

## 20.1 Risk-proportional Evidence handling

- Low-risk documentation work normally has one implementation commit. GitHub `checks` and one read-only Terra review bound to the result are sufficient; do not create a committed task Evidence directory or per-Markdown SHA-256 manifest unless the task creates a durable domain, security, migration, database, release, product, or compliance artifact.
- Medium-risk implementation work requires targeted local tests, full required CI, and a Terra review bound to the final PR head SHA or final staged tree. CI artifacts and PR metadata are the normal Evidence. Reviewer receipts are external to the reviewed Git tree.
- High-risk, critical, migration, database, security, identity, authorization, Tauri, clinical, financial, rollback and Evidence-integrity work retains its task-declared structured Evidence and Terra/Sol route. This rule never weakens those gates.
- Phase Gates use one consolidated phase Evidence set and the required `sol_phase_gate`; do not duplicate every low-risk task log in Git.
- A CI artifact, GitHub PR review/comment, or parent-session receipt is immutable Evidence only when bound to the exact head SHA/tree. A review receipt must not be added to the same tree it reviews.
- Do not run an identical full suite both locally and remotely unless the local environment is the target, CI failed, the reviewed result changed, or the task explicitly requires a second environment.

## 21. Git and PR rules

- Do not work directly on `main`.
- Branch format: `hw/<phase>/<task>-short-name`.
- Do not use `git add .`, `git add -A` or `git add --all`.
- Stage reviewed paths only.
- Commits and PRs include HW task IDs.
- Contract, database, identity, authorization, Tauri, event catalog, Agent tool or deletion changes require explicit owner review.
- Once the public GitHub Ruleset is active, required checks must not be bypassed. Before activation, treat the same checks as a procedural hard gate.
- Review the actual diff and evidence; subagent summaries are not merge approval.
- No automatic Issue closure unless the parent/user explicitly authorizes it.

## 22. Program source of truth

Read:

- `docs/program/ROADMAP.md`
- active `docs/program/phases/HW-xx-*.md`
- active `docs/program/tasks/HW-xx.yaml`
- `docs/program/GATES.md`
- `docs/architecture/TARGET-ARCHITECTURE.md`
- `docs/migration/LEGACY-SOURCE-MANIFEST.yaml`
- accepted ADRs.

If current code conflicts with a plan, stop and surface the conflict. Do not silently implement the document or silently rewrite the architecture.

## 23. Product-First MVP execution overlay

After F0 and while the MVP overlay is active:

- Parent reads `docs/program/mvp/MVP-EXECUTION-OVERLAY.yaml` before choosing the next task.
- Parent executes only the current MVP slice; do not mechanically start `HW01-01`.
- No high/critical canonical boundary is downgraded to an MVP shortcut.
- Low/medium MVP slices use one commit, CI and one external read-only Terra review.
- Do not create recursive committed Evidence for the overlay.
- Only the human owner may retire or replace the overlay.

Carry forward P2-F0-01 exactly: owner `toolchain-owner`; due `2026-09-16`;
required before `2026-09-23`; migrate four Node20-declaring Actions to reviewed
Node24-native full-SHA pins. This maintenance item does not block MVP-01 and
must not be silently deferred.
