# HW-01 — 共享契约内核与干净数据库基线

## Goal

建立事件、命令、身份上下文、敏感度、卡片、ID、时间、审计和数据库运行时的纯内核；数据库从空基线重建，不迁移旧数据或旧 migration。

## Dependencies

`HW-00`

A dependent phase must be `PASS`. `CONDITIONAL` does not automatically authorize this phase.

## Deliverables

- `@hospital/contracts-core`、`event-contracts`、`command-contracts`
- `time-core`、`observability`、`testkit`
- Prisma 7 multi-file/multi-schema 空数据库基线
- 数据库运行时与 repository-only 边界
- synthetic seed 与 rebuild/rollback 门禁

## Out of scope

- 真实身份登录
- 业务领域表
- Hub 或 Work Item 服务
- 从旧数据库导入任何记录

## Phase acceptance

- 核心 contracts 纯净、版本化并有无效 fixtures
- 数据库从空库可创建、迁移、seed、重建和恢复
- Redis Session 权威未被数据库模型污染
- raw Prisma 仅 repository 可用，跨 schema 写入被阻断
- 时间、ID、Trace、Audit、Sensitivity 语义统一

## Gates

- G01-1 契约纯度与版本化
- G01-2 数据库空基线可重建
- G01-3 repository-only 数据访问
- G01-4 时间、ID、审计与敏感度一致性

## Sol acceptance policy

| Scope | Required route |
| --- | --- |
| Low / medium task | `terra_reviewer`; no task-level Sol required |
| High-risk task | `sol_acceptance` after Terra review |
| Critical architecture/security task | `sol_architecture_security` after Terra review/security review |
| Critical task primarily proving E2E/acceptance evidence | `sol_acceptance` |
| Phase exit | `sol_architecture_security`, `sol_phase_gate` |
| Parent final decision | `parent_codex` |
| Human decision required | `No` |

- `sol_acceptance`, `sol_architecture_security` and `sol_phase_gate` are read-only.
- Sol never implements fixes, signs commits, merges, releases or replaces the parent/human authority.
- The Sol report must be bound to the final integrated source/result commit or tree digest.
- If a required Sol model is unavailable, the corresponding acceptance/Gate is `BLOCKED` until the user explicitly changes routing.
- No silent substitution is permitted.

## Subagent execution rules

- Parent Codex reads the active phase and task YAML before spawning agents.
- Read-only mapping runs before implementation.
- Write paths are locked per task; overlapping writers are prohibited.
- Tasks owned by `parent_codex` may use Luna/Terra only for listed supporting work.
- Luna handles narrow inventories/docs/fixtures; Terra handles contracts, implementation, migration, tests and first-line review.
- Sol performs independent high-risk acceptance, architecture/security acceptance and phase-exit recommendation only.
- Subagents never commit, push, open/merge PRs, close Issues or change external systems.
- The parent reviews the actual integrated diff and reruns critical validation before Sol review.
- Any stop condition returns control to the parent.

## Task overview

| ID | Task | Primary | Support | Risk | Group | Acceptance tier | Acceptance agents |
| --- | --- | --- | --- | --- | --- | --- | --- |
| `HW01-01` | 建立 Contracts Core | `terra_contracts` | luna_fixtures, terra_reviewer | `medium` | `A` | `terra` | terra_reviewer |
| `HW01-02` | 建立 Event Envelope 与 Command Envelope | `terra_contracts` | luna_fixtures, terra_reviewer | `high` | `A` | `sol-acceptance` | terra_reviewer, sol_acceptance |
| `HW01-03` | 迁移并净化 time/postgres/redis 基础能力 | `terra_migrator` | luna_inventory, terra_tester | `medium` | `B` | `terra` | terra_reviewer |
| `HW01-04` | 建立 Observability 与 Audit Kernel | `terra_worker` | luna_fixtures, terra_reviewer | `medium` | `B` | `terra` | terra_reviewer |
| `HW01-05` | 创建 Prisma 多文件空基线 | `parent_codex` | terra_contracts, terra_tester, terra_security | `critical` | `C` | `sol-architecture-security` | terra_reviewer, terra_security, sol_architecture_security |
| `HW01-06` | 建立 repository-only 数据访问门 | `terra_worker` | terra_security, terra_reviewer | `high` | `D` | `sol-acceptance` | terra_reviewer, sol_acceptance |
| `HW01-07` | 建立 Testkit 与 deterministic fixtures | `luna_fixtures` | terra_tester | `low` | `D` | `terra` | terra_reviewer |
| `HW01-08` | Core Kernel Gate | `parent_codex` | terra_reviewer, terra_security | `critical` | `E` | `sol-phase-gate` | terra_reviewer, terra_security, sol_architecture_security, sol_phase_gate |

## Detailed implementation plan

### HW01-01 — 建立 Contracts Core

| Field | Value |
| --- | --- |
| Primary owner | `terra_contracts` |
| Supporting agents | `luna_fixtures`, `terra_reviewer` |
| Mode | `workspace-write` |
| Parallel group | `A` |
| Risk | `medium` |
| Task dependencies | — |
| Acceptance tier | `terra` |
| Acceptance agents | `terra_reviewer` |
| Required acceptance outcome | `APPROVED` |

**Allowed paths**

- `packages/contracts-core/**`

**Objective**

定义所有跨边界协议共用的 ID、Actor、ContextRef、ScopeRef、Sensitivity、Trace 和版本字段。

**Implementation steps**

- 使用 UUIDv7/稳定字符串标识策略并区分外部业务号。
- 定义 Hospital/Campus/Department/Person/Device/Patient/Episode/Asset/Project ContextRef。
- 定义 sensitivity、visibility、retention 和 redaction hints。
- 所有 transported payload 带 schemaVersion，默认拒绝未知字段。
- 添加边界、非法和序列化 fixtures。

**Validation**

- contract unit tests
- unknown-field tests
- serialization snapshots

**Acceptance**

- 不依赖 React/Fastify/Prisma/Node request
- 可表达人员、组织、患者、资产和项目上下文但不承载业务数据

**Independent acceptance procedure**

- Implementation/testing agents finish and return exact commands, evidence and limitations.
- The parent inspects the actual integrated diff before spawning acceptance agents.
- Run the agents listed in `Acceptance agents` against the same final commit/tree digest.
- Required Sol outcomes are advisory but mandatory evidence for the parent Gate.
- A Sol `REJECT`, `BLOCKED` or missing required report prevents task acceptance.
- Acceptance agents are read-only and never fix the task they review.

**Evidence**

- contract-snapshot.json
- negative-fixtures.log
- acceptance report(s) bound to the final source/result commit

**Stop immediately if**

- 需要修改未在 allowed_paths 中声明的路径
- 需要改变已接受 ADR、身份/Session、授权/Scope、TLS、原生权限或数据所有权边界
- 需要新增生产依赖、破坏性数据库操作或对外部系统写入，但任务未明确授权
- 当前工作树包含无法归属的用户修改；若本任务主动采用可选旧源，则该旧源无法绑定固定 commit

### HW01-02 — 建立 Event Envelope 与 Command Envelope

| Field | Value |
| --- | --- |
| Primary owner | `terra_contracts` |
| Supporting agents | `luna_fixtures`, `terra_reviewer` |
| Mode | `workspace-write` |
| Parallel group | `A` |
| Risk | `high` |
| Task dependencies | `HW01-01` |
| Acceptance tier | `sol-acceptance` |
| Acceptance agents | `terra_reviewer`, `sol_acceptance` |
| Required acceptance outcome | `ACCEPT` |

**Allowed paths**

- `packages/event-contracts/**`
- `packages/command-contracts/**`

**Objective**

冻结 at-least-once 事件与幂等命令协议，为 Outbox、Hub、Work Item 和 Agent 提供共同语义。

**Implementation steps**

- Event 包含 eventId/type/version/aggregate/version/actor/context/correlation/causation/trace/timestamps/sensitivity/payload。
- Command 包含 commandId/type/target/expectedVersion/idempotencyKey/actor/context/input。
- 区分 domain event、projection event、notification event。
- 禁止 Event payload 直接携带秘密或默认通知正文。
- 定义重复、乱序、未知版本和过期命令 fixtures。

**Validation**

- schema tests
- idempotency fixtures
- unknown-version quarantine tests

**Acceptance**

- 不承诺 exactly-once
- 同一事件可安全重复消费
- 命令冲突显式返回 409/typed conflict

**Independent acceptance procedure**

- Implementation/testing agents finish and return exact commands, evidence and limitations.
- The parent inspects the actual integrated diff before spawning acceptance agents.
- Run the agents listed in `Acceptance agents` against the same final commit/tree digest.
- Required Sol outcomes are advisory but mandatory evidence for the parent Gate.
- A Sol `REJECT`, `BLOCKED` or missing required report prevents task acceptance.
- Acceptance agents are read-only and never fix the task they review.

**Evidence**

- event-command-contract-report.md
- acceptance report(s) bound to the final source/result commit

**Stop immediately if**

- 需要修改未在 allowed_paths 中声明的路径
- 需要改变已接受 ADR、身份/Session、授权/Scope、TLS、原生权限或数据所有权边界
- 需要新增生产依赖、破坏性数据库操作或对外部系统写入，但任务未明确授权
- 当前工作树包含无法归属的用户修改；若本任务主动采用可选旧源，则该旧源无法绑定固定 commit

### HW01-03 — 迁移并净化 time/postgres/redis 基础能力

| Field | Value |
| --- | --- |
| Primary owner | `terra_migrator` |
| Supporting agents | `luna_inventory`, `terra_tester` |
| Mode | `workspace-write` |
| Parallel group | `B` |
| Risk | `medium` |
| Task dependencies | — |
| Acceptance tier | `terra` |
| Acceptance agents | `terra_reviewer` |
| Required acceptance outcome | `APPROVED` |

**Allowed paths**

- `packages/time-core/**`
- `packages/postgres-core/**`
- `packages/redis-core/**`
- `docs/migration/**`

**Objective**

从 legacy 固定 commit 白名单复制三个小包，移除生成物和旧项目假设。

**Implementation steps**

- 逐文件复制源码和测试，不复制 dist、src 下生成 `.js/.d.ts` 或旧 package metadata。
- 统一包名到 `@hospital/*`，固定 public exports。
- Postgres/Redis 连接配置必须支持 TLS、超时、健康和 graceful close。
- Time Core 固定 UTC 存储、Asia/Shanghai 业务显示和可测试 clock。
- 写入迁移收据和 source hashes。

**Validation**

- legacy source hash
- package build/test
- connection config negative tests

**Acceptance**

- 三个包职责单一
- 无对旧 repo 路径或 `@portal/*` 的依赖
- 无真实连接串和默认弱 TLS

**Independent acceptance procedure**

- Implementation/testing agents finish and return exact commands, evidence and limitations.
- The parent inspects the actual integrated diff before spawning acceptance agents.
- Run the agents listed in `Acceptance agents` against the same final commit/tree digest.
- Required Sol outcomes are advisory but mandatory evidence for the parent Gate.
- A Sol `REJECT`, `BLOCKED` or missing required report prevents task acceptance.
- Acceptance agents are read-only and never fix the task they review.

**Evidence**

- migration-receipts/*.json
- package-test.log
- acceptance report(s) bound to the final source/result commit

**Stop immediately if**

- 需要修改未在 allowed_paths 中声明的路径
- 需要改变已接受 ADR、身份/Session、授权/Scope、TLS、原生权限或数据所有权边界
- 需要新增生产依赖、破坏性数据库操作或对外部系统写入，但任务未明确授权
- 当前工作树包含无法归属的用户修改；若本任务主动采用可选旧源，则该旧源无法绑定固定 commit

### HW01-04 — 建立 Observability 与 Audit Kernel

| Field | Value |
| --- | --- |
| Primary owner | `terra_worker` |
| Supporting agents | `luna_fixtures`, `terra_reviewer` |
| Mode | `workspace-write` |
| Parallel group | `B` |
| Risk | `medium` |
| Task dependencies | `HW01-01` |
| Acceptance tier | `terra` |
| Acceptance agents | `terra_reviewer` |
| Required acceptance outcome | `APPROVED` |

**Allowed paths**

- `packages/observability/**`
- `packages/audit-contracts/**`

**Objective**

统一 trace、correlation、structured log、audit actor/action/result 和脱敏。

**Implementation steps**

- 定义 Pino/OpenTelemetry 适配接口，业务包不直接绑定 transport。
- 所有命令和事件贯穿 trace/correlation/causation。
- Audit 记录 allow/deny、变更前后摘要和 resourceVersion，不记录秘密或完整患者正文。
- 提供 log redaction 和 test capture。

**Validation**

- redaction tests
- trace propagation fixtures
- audit schema tests

**Acceptance**

- 日志可关联但不能反向暴露 Session/Token/患者敏感正文
- 测试可断言审计而不依赖外部 collector

**Independent acceptance procedure**

- Implementation/testing agents finish and return exact commands, evidence and limitations.
- The parent inspects the actual integrated diff before spawning acceptance agents.
- Run the agents listed in `Acceptance agents` against the same final commit/tree digest.
- Required Sol outcomes are advisory but mandatory evidence for the parent Gate.
- A Sol `REJECT`, `BLOCKED` or missing required report prevents task acceptance.
- Acceptance agents are read-only and never fix the task they review.

**Evidence**

- observability-contract-report.md
- acceptance report(s) bound to the final source/result commit

**Stop immediately if**

- 需要修改未在 allowed_paths 中声明的路径
- 需要改变已接受 ADR、身份/Session、授权/Scope、TLS、原生权限或数据所有权边界
- 需要新增生产依赖、破坏性数据库操作或对外部系统写入，但任务未明确授权
- 当前工作树包含无法归属的用户修改；若本任务主动采用可选旧源，则该旧源无法绑定固定 commit

### HW01-05 — 创建 Prisma 多文件空基线

| Field | Value |
| --- | --- |
| Primary owner | `parent_codex` |
| Supporting agents | `terra_contracts`, `terra_tester`, `terra_security` |
| Mode | `workspace-write` |
| Parallel group | `C` |
| Risk | `critical` |
| Task dependencies | `HW01-01`, `HW01-03` |
| Acceptance tier | `sol-architecture-security` |
| Acceptance agents | `terra_reviewer`, `terra_security`, `sol_architecture_security` |
| Required acceptance outcome | `ACCEPT` |

**Allowed paths**

- `database/**`
- `packages/database-runtime/**`
- `prisma.config.ts`

**Objective**

建立全新的单迁移谱系和按领域文件拆分的 PostgreSQL schema，只包含 Foundation 所需的 iam/config/audit 元数据。

**Implementation steps**

- 使用 Prisma 7 GA，多文件 schema 目录和 PostgreSQL multi-schema。
- 初始仅创建 `iam`、`config`、`audit`，不复制 legacy migrations/schema。
- Session 不进入 PostgreSQL 权威表；Redis 为运行时 Session 权威。
- 生成 client 输出到 generated 目录且不提交。
- 建立空库 create/migrate/seed/reset/backup-restore 的明确命令。

**Validation**

- prisma validate/generate
- empty database migrate
- migration replay twice
- rollback/rebuild rehearsal

**Acceptance**

- 新 migration 从 0001 开始
- 没有 feedback/handover/ticket/legacy session 表
- 所有 seed 为 synthetic 且幂等

**Independent acceptance procedure**

- Implementation/testing agents finish and return exact commands, evidence and limitations.
- The parent inspects the actual integrated diff before spawning acceptance agents.
- Run the agents listed in `Acceptance agents` against the same final commit/tree digest.
- Required Sol outcomes are advisory but mandatory evidence for the parent Gate.
- A Sol `REJECT`, `BLOCKED` or missing required report prevents task acceptance.
- Acceptance agents are read-only and never fix the task they review.

**Evidence**

- database-baseline-report.md
- migration-hashes.json
- rebuild-receipt.json
- acceptance report(s) bound to the final source/result commit

**Stop immediately if**

- 需要修改未在 allowed_paths 中声明的路径
- 需要改变已接受 ADR、身份/Session、授权/Scope、TLS、原生权限或数据所有权边界
- 需要新增生产依赖、破坏性数据库操作或对外部系统写入，但任务未明确授权
- 当前工作树包含无法归属的用户修改；若本任务主动采用可选旧源，则该旧源无法绑定固定 commit

### HW01-06 — 建立 repository-only 数据访问门

| Field | Value |
| --- | --- |
| Primary owner | `terra_worker` |
| Supporting agents | `terra_security`, `terra_reviewer` |
| Mode | `workspace-write` |
| Parallel group | `D` |
| Risk | `high` |
| Task dependencies | `HW01-05` |
| Acceptance tier | `sol-acceptance` |
| Acceptance agents | `terra_reviewer`, `sol_acceptance` |
| Required acceptance outcome | `ACCEPT` |

**Allowed paths**

- `packages/database-runtime/**`
- `scripts/governance/**`
- `docs/governance/**`

**Objective**

限制原始 Prisma Client 只在明确 repository 模块中使用，防止服务跨领域直接写表。

**Implementation steps**

- database-runtime 只导出受控 factory 和 transaction context。
- 前端和 contracts 永远不能 import database-runtime。
- 服务只有 `src/repositories/**` 可 import 原始 client。
- 建立模型访问 allowlist 和跨 schema 写入静态检查。
- 提供绕过 fixtures。

**Validation**

- boundary positive/negative tests
- deep import scan
- cross-schema write fixture

**Acceptance**

- 所有数据访问有 owner
- 任意 service handler 直接调用 Prisma 被阻断

**Independent acceptance procedure**

- Implementation/testing agents finish and return exact commands, evidence and limitations.
- The parent inspects the actual integrated diff before spawning acceptance agents.
- Run the agents listed in `Acceptance agents` against the same final commit/tree digest.
- Required Sol outcomes are advisory but mandatory evidence for the parent Gate.
- A Sol `REJECT`, `BLOCKED` or missing required report prevents task acceptance.
- Acceptance agents are read-only and never fix the task they review.

**Evidence**

- repository-boundary-report.json
- acceptance report(s) bound to the final source/result commit

**Stop immediately if**

- 需要修改未在 allowed_paths 中声明的路径
- 需要改变已接受 ADR、身份/Session、授权/Scope、TLS、原生权限或数据所有权边界
- 需要新增生产依赖、破坏性数据库操作或对外部系统写入，但任务未明确授权
- 当前工作树包含无法归属的用户修改；若本任务主动采用可选旧源，则该旧源无法绑定固定 commit

### HW01-07 — 建立 Testkit 与 deterministic fixtures

| Field | Value |
| --- | --- |
| Primary owner | `luna_fixtures` |
| Supporting agents | `terra_tester` |
| Mode | `workspace-write` |
| Parallel group | `D` |
| Risk | `low` |
| Task dependencies | `HW01-01`, `HW01-02`, `HW01-04` |
| Acceptance tier | `terra` |
| Acceptance agents | `terra_reviewer` |
| Required acceptance outcome | `APPROVED` |

**Allowed paths**

- `packages/testkit/**`

**Objective**

提供 synthetic 人员、组织、上下文、命令、事件、时钟和失败注入，避免各服务重复造 Mock。

**Implementation steps**

- 固定 UUID/time/trace factories。
- 生成敏感/非敏感 fixture 和 redaction assertions。
- 提供 Postgres/Redis integration harness 接口。
- 提供 duplicate/out-of-order/timeout/concurrency helpers。

**Validation**

- testkit self-tests
- seed determinism hash

**Acceptance**

- 同 seed 产生相同 fixture
- 不含真实医院/患者/员工数据

**Independent acceptance procedure**

- Implementation/testing agents finish and return exact commands, evidence and limitations.
- The parent inspects the actual integrated diff before spawning acceptance agents.
- Run the agents listed in `Acceptance agents` against the same final commit/tree digest.
- Required Sol outcomes are advisory but mandatory evidence for the parent Gate.
- A Sol `REJECT`, `BLOCKED` or missing required report prevents task acceptance.
- Acceptance agents are read-only and never fix the task they review.

**Evidence**

- testkit-fixture-catalog.md
- acceptance report(s) bound to the final source/result commit

**Stop immediately if**

- 需要修改未在 allowed_paths 中声明的路径
- 需要改变已接受 ADR、身份/Session、授权/Scope、TLS、原生权限或数据所有权边界
- 需要新增生产依赖、破坏性数据库操作或对外部系统写入，但任务未明确授权
- 当前工作树包含无法归属的用户修改；若本任务主动采用可选旧源，则该旧源无法绑定固定 commit

### HW01-08 — Core Kernel Gate

| Field | Value |
| --- | --- |
| Primary owner | `parent_codex` |
| Supporting agents | `terra_reviewer`, `terra_security` |
| Mode | `read-only` |
| Parallel group | `E` |
| Risk | `critical` |
| Task dependencies | `HW01-02`, `HW01-04`, `HW01-05`, `HW01-06`, `HW01-07` |
| Acceptance tier | `sol-phase-gate` |
| Acceptance agents | `terra_reviewer`, `terra_security`, `sol_architecture_security`, `sol_phase_gate` |
| Required acceptance outcome | `PASS_RECOMMENDED` |

**Allowed paths**

- `packages/**`
- `database/**`
- `prisma.config.ts`
- `scripts/governance/**`

**Objective**

确认共享内核足够小、纯、版本化，数据库是新谱系且无跨域捷径。

**Implementation steps**

- 复核 contracts、events、commands、audit、time、DB 和 repository 门。
- 检查源目录生成物、旧包名、旧 migration 和真实数据。
- 运行空库重建、负向边界和证据校验。
- 签发 G01。

**Validation**

- pnpm check
- database rebuild
- contract fixtures
- security review

**Acceptance**

- P0/P1 为零
- 允许进入身份和平台服务开发

**Independent acceptance procedure**

- Implementation/testing agents finish and return exact commands, evidence and limitations.
- The parent inspects the actual integrated diff before spawning acceptance agents.
- Run the agents listed in `Acceptance agents` against the same final commit/tree digest.
- Required Sol outcomes are advisory but mandatory evidence for the parent Gate.
- A Sol `REJECT`, `BLOCKED` or missing required report prevents task acceptance.
- Acceptance agents are read-only and never fix the task they review.

**Evidence**

- G01-gate-decision.md
- acceptance report(s) bound to the final source/result commit

**Stop immediately if**

- 需要修改未在 allowed_paths 中声明的路径
- 需要改变已接受 ADR、身份/Session、授权/Scope、TLS、原生权限或数据所有权边界
- 需要新增生产依赖、破坏性数据库操作或对外部系统写入，但任务未明确授权
- 当前工作树包含无法归属的用户修改；若本任务主动采用可选旧源，则该旧源无法绑定固定 commit


## Phase Gate flow

1. Complete all task dependencies and implementation work packages.
2. Run targeted, negative, permission, concurrency, replay, failure and rollback tests as applicable.
3. Run package and repository canonical checks.
4. Parent inspects the final integrated diff and evidence.
5. Run `terra_reviewer`; run `terra_security` where required.
6. Run every task-level Sol acceptance declared in the task matrix.
7. Run the phase-level Sol agents: `sol_architecture_security`, `sol_phase_gate`.
8. `sol_phase_gate` must return `PASS_RECOMMENDED` for a phase `PASS`.
9. Parent Codex issues `PASS / CONDITIONAL / BLOCKED`; Sol does not issue the final Gate.
10. Human approval is additionally required for pilot/production phases where declared.
11. Do not begin the next phase automatically.

## Gate evidence minimum

- final source commit/result commit or tree digest;
- all required Terra and Sol reports;
- exact commands, exit codes and raw logs;
- artifacts and SHA-256;
- negative/failure/recovery scenarios;
- rollback evidence;
- environment limitations;
- P0/P1 disposition;
- parent Gate decision;
- human decision where required.

## Suggested start prompt

```text
Read root AGENTS.md, docs/program/ROADMAP.md, docs/program/GATES.md,
docs/program/phases/HW-01-core-kernel-database.md and docs/program/tasks/HW-01.yaml.

Execute only HW-01. Use Luna for narrow discovery/docs/fixtures, Terra for bounded implementation/testing/review,
and the task matrix's Sol route for independent acceptance. Run the phase-level Sol Gate agents only after the
final integrated diff and evidence are frozen. Parent Codex makes the final Gate decision.
Do not begin the next phase, push, merge, release or change external systems without explicit authorization.
```
