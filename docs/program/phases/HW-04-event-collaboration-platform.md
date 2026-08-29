# HW-04 — 事件、Inbox、Todo、回放与协同平台

## Goal

在 `services/collaboration` 按目标契约实现可靠事件存储、Transactional Outbox 接入、用户 Inbox/Todo、SSE 单连接、断线补偿、去重和多表面投影；可选旧源仅用于行为核对。

## Dependencies

`HW-01`, `HW-02`, `HW-03`

A dependent phase must be `PASS`. `CONDITIONAL` does not automatically authorize this phase.

## Deliverables

- `services/collaboration` events/inbox/todos/stream 模块
- `hub-contracts`、`hub-client` 与 Event Catalog
- durable cursor/replay/dedup
- 一个 Workspace SSE 连接
- Outbox producer/relay SDK
- synthetic event-to-inbox-to-UI 闭环

## Out of scope

- 领域业务状态
- Agent Runtime
- WebSocket 替换 SSE
- 灵动岛原生桥

## Phase acceptance

- 所有事件注册、版本化并有 owner/sensitivity
- 领域事务与 Outbox 原子，relay 可恢复且幂等
- Event/Inbox/Todo 可从 durable store 确定性重建
- Workspace 只有一个 SSE 连接，断线后 gap recovery
- 未读、读游标、事件游标语义分离

## Gates

- G04-1 Collaboration 事件行为与测试保真
- G04-2 Event Catalog 与版本化
- G04-3 Outbox/投递/去重
- G04-4 SSE 回放与单连接
- G04-5 Inbox/Todo/未读一致性

## Sol acceptance policy

| Scope | Required route |
| --- | --- |
| Low / medium task | `terra_reviewer`; no task-level Sol required |
| High-risk task | `sol_acceptance` after Terra review |
| Critical architecture/security task | `sol_architecture_security` after Terra review/security review |
| Critical task primarily proving E2E/acceptance evidence | `sol_acceptance` |
| Phase exit | `sol_acceptance`, `sol_phase_gate` |
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
| `HW04-01` | 迁移 Hub 核心资产到 Collaboration Service | `terra_migrator` | luna_inventory, terra_tester, terra_reviewer | `high` | `A` | `sol-acceptance` | terra_reviewer, sol_acceptance |
| `HW04-02` | 建立 Event Catalog 与 Schema Registry | `terra_contracts` | luna_fixtures, terra_reviewer | `high` | `A` | `sol-acceptance` | terra_reviewer, sol_acceptance |
| `HW04-03` | 实现 Transactional Outbox SDK 与 Relay | `terra_worker` | terra_tester, terra_security | `critical` | `B` | `sol-architecture-security` | terra_reviewer, terra_security, sol_architecture_security |
| `HW04-04` | 实现 Durable Event Store、Inbox 与 Todo Projection | `terra_worker` | terra_tester, terra_reviewer | `high` | `B` | `sol-acceptance` | terra_reviewer, sol_acceptance |
| `HW04-05` | 实现 SSE Stream、Cursor 与 Gap Recovery | `terra_worker` | terra_tester, terra_browser | `high` | `C` | `sol-acceptance` | terra_reviewer, sol_acceptance |
| `HW04-06` | 实现 Workspace Inbox/Todo/消息中心基础视图 | `terra_worker` | luna_fixtures, terra_browser | `medium` | `D` | `terra` | terra_reviewer |
| `HW04-07` | Synthetic Event End-to-End | `terra_tester` | luna_fixtures, terra_browser | `high` | `E` | `sol-acceptance` | terra_reviewer, sol_acceptance |
| `HW04-08` | Event Collaboration Gate | `parent_codex` | terra_reviewer, terra_security | `critical` | `F` | `sol-phase-gate` | terra_reviewer, terra_security, sol_acceptance, sol_phase_gate |

## Detailed implementation plan

### HW04-01 — 迁移 Hub 核心资产到 Collaboration Service

| Field | Value |
| --- | --- |
| Primary owner | `terra_migrator` |
| Supporting agents | `luna_inventory`, `terra_tester`, `terra_reviewer` |
| Mode | `workspace-write` |
| Parallel group | `A` |
| Risk | `high` |
| Task dependencies | — |
| Acceptance tier | `sol-acceptance` |
| Acceptance agents | `terra_reviewer`, `sol_acceptance` |
| Required acceptance outcome | `ACCEPT` |

**Allowed paths**

- `services/collaboration/**`
- `packages/hub-contracts/**`
- `packages/hub-client/**`
- `docs/migration/**`

**Objective**

按目标事件契约实现 Collaboration 服务；若配置可选旧源，只允许提取经白名单审查的 Hub 行为和测试，排除 hub-next、生成物与旧项目假设。

**Implementation steps**

- 建立 source/target mapping，逐文件复制并改名为 `@hospital/*`。
- 将 legacy `hub-service` modules 映射为 events/inbox/todos/stream。
- 删除 Next adapter、旧 Prisma client 引用和旧 appCode 常量。
- 保留现有测试意图，并迁移为新 contracts/testkit。
- 记录未迁移文件和原因。

**Validation**

- source hash verification
- service build/test
- no @portal/no hub-next scan

**Acceptance**

- Collaboration Service 可独立启动
- 迁移代码有 provenance

**Independent acceptance procedure**

- Implementation/testing agents finish and return exact commands, evidence and limitations.
- The parent inspects the actual integrated diff before spawning acceptance agents.
- Run the agents listed in `Acceptance agents` against the same final commit/tree digest.
- Required Sol outcomes are advisory but mandatory evidence for the parent Gate.
- A Sol `REJECT`, `BLOCKED` or missing required report prevents task acceptance.
- Acceptance agents are read-only and never fix the task they review.

**Evidence**

- hub-migration-receipt.json
- acceptance report(s) bound to the final source/result commit

**Stop immediately if**

- 需要修改未在 allowed_paths 中声明的路径
- 需要改变已接受 ADR、身份/Session、授权/Scope、TLS、原生权限或数据所有权边界
- 需要新增生产依赖、破坏性数据库操作或对外部系统写入，但任务未明确授权
- 当前工作树包含无法归属的用户修改；若本任务主动采用可选旧源，则该旧源无法绑定固定 commit

### HW04-02 — 建立 Event Catalog 与 Schema Registry

| Field | Value |
| --- | --- |
| Primary owner | `terra_contracts` |
| Supporting agents | `luna_fixtures`, `terra_reviewer` |
| Mode | `workspace-write` |
| Parallel group | `A` |
| Risk | `high` |
| Task dependencies | `HW01-02` |
| Acceptance tier | `sol-acceptance` |
| Acceptance agents | `terra_reviewer`, `sol_acceptance` |
| Required acceptance outcome | `ACCEPT` |

**Allowed paths**

- `packages/hub-contracts/**`
- `services/collaboration/src/catalog/**`
- `scripts/governance/**`

**Objective**

所有可发布事件必须登记 owner、版本、敏感度、可见性、消费者和兼容策略。

**Implementation steps**

- 定义 catalog entry 与 payload schema registry。
- 未登记 eventType、未知 schemaVersion 或敏感度缺失一律拒绝/隔离。
- 禁止直接把 Event payload 当通知正文。
- 建立 breaking-change 和 consumer inventory 检查。

**Validation**

- catalog checker
- duplicate type/version
- unknown schema
- breaking fixture

**Acceptance**

- 新事件必须先注册
- 旧版本保留明确读策略或正式退役

**Independent acceptance procedure**

- Implementation/testing agents finish and return exact commands, evidence and limitations.
- The parent inspects the actual integrated diff before spawning acceptance agents.
- Run the agents listed in `Acceptance agents` against the same final commit/tree digest.
- Required Sol outcomes are advisory but mandatory evidence for the parent Gate.
- A Sol `REJECT`, `BLOCKED` or missing required report prevents task acceptance.
- Acceptance agents are read-only and never fix the task they review.

**Evidence**

- event-catalog.json
- catalog-check.log
- acceptance report(s) bound to the final source/result commit

**Stop immediately if**

- 需要修改未在 allowed_paths 中声明的路径
- 需要改变已接受 ADR、身份/Session、授权/Scope、TLS、原生权限或数据所有权边界
- 需要新增生产依赖、破坏性数据库操作或对外部系统写入，但任务未明确授权
- 当前工作树包含无法归属的用户修改；若本任务主动采用可选旧源，则该旧源无法绑定固定 commit

### HW04-03 — 实现 Transactional Outbox SDK 与 Relay

| Field | Value |
| --- | --- |
| Primary owner | `terra_worker` |
| Supporting agents | `terra_tester`, `terra_security` |
| Mode | `workspace-write` |
| Parallel group | `B` |
| Risk | `critical` |
| Task dependencies | `HW04-01`, `HW04-02`, `HW01-05` |
| Acceptance tier | `sol-architecture-security` |
| Acceptance agents | `terra_reviewer`, `terra_security`, `sol_architecture_security` |
| Required acceptance outcome | `ACCEPT` |

**Allowed paths**

- `packages/outbox-sdk/**`
- `services/collaboration/src/ingest/**`
- `database/prisma/models/collab.prisma`

**Objective**

为所有领域服务提供同事务 Outbox 和可重试 Relay，避免业务成功但事件丢失。

**Implementation steps**

- 定义 outbox row、event envelope、attempt、nextAttemptAt、poison/dead-letter。
- 领域事务内写 aggregate 和 outbox；relay 只在 commit 后发送。
- relay crash-before/after-send、duplicate delivery 和 retry 采用 eventId 幂等。
- 禁止生产者直接调用 Hub HTTP 代替 Outbox。
- 提供 health/lag/backpressure metrics。

**Validation**

- transaction rollback
- crash injection
- duplicate relay
- poison event

**Acceptance**

- 无 ghost event、lost event 或双业务写入
- 故障后可恢复 drain

**Independent acceptance procedure**

- Implementation/testing agents finish and return exact commands, evidence and limitations.
- The parent inspects the actual integrated diff before spawning acceptance agents.
- Run the agents listed in `Acceptance agents` against the same final commit/tree digest.
- Required Sol outcomes are advisory but mandatory evidence for the parent Gate.
- A Sol `REJECT`, `BLOCKED` or missing required report prevents task acceptance.
- Acceptance agents are read-only and never fix the task they review.

**Evidence**

- outbox-failure-receipts.json
- acceptance report(s) bound to the final source/result commit

**Stop immediately if**

- 需要修改未在 allowed_paths 中声明的路径
- 需要改变已接受 ADR、身份/Session、授权/Scope、TLS、原生权限或数据所有权边界
- 需要新增生产依赖、破坏性数据库操作或对外部系统写入，但任务未明确授权
- 当前工作树包含无法归属的用户修改；若本任务主动采用可选旧源，则该旧源无法绑定固定 commit

### HW04-04 — 实现 Durable Event Store、Inbox 与 Todo Projection

| Field | Value |
| --- | --- |
| Primary owner | `terra_worker` |
| Supporting agents | `terra_tester`, `terra_reviewer` |
| Mode | `workspace-write` |
| Parallel group | `B` |
| Risk | `high` |
| Task dependencies | `HW04-02`, `HW04-03` |
| Acceptance tier | `sol-acceptance` |
| Acceptance agents | `terra_reviewer`, `sol_acceptance` |
| Required acceptance outcome | `ACCEPT` |

**Allowed paths**

- `services/collaboration/src/modules/events/**`
- `services/collaboration/src/modules/inbox/**`
- `services/collaboration/src/modules/todos/**`
- `database/prisma/models/collab.prisma`

**Objective**

将领域事件可靠写入事件库，并按人员/角色/范围投影到 Inbox 和 Todo。

**Implementation steps**

- 事件库以 eventId 唯一，保留 aggregateVersion/correlation/causation。
- Projection handler 幂等、可重放、支持版本标记。
- Inbox 与 Todo 分离；Todo 只来自明确 work/decision 状态。
- recipient 解析使用服务端 Principal/Scope，不信任 producer 指定的任意 user。
- 读/未读/归档不改变领域事件。

**Validation**

- projection replay
- recipient authorization
- duplicate/out-of-order
- concurrent read cursor

**Acceptance**

- 同一事件集可确定性重建 Inbox/Todo
- 未读不靠简单序号差

**Independent acceptance procedure**

- Implementation/testing agents finish and return exact commands, evidence and limitations.
- The parent inspects the actual integrated diff before spawning acceptance agents.
- Run the agents listed in `Acceptance agents` against the same final commit/tree digest.
- Required Sol outcomes are advisory but mandatory evidence for the parent Gate.
- A Sol `REJECT`, `BLOCKED` or missing required report prevents task acceptance.
- Acceptance agents are read-only and never fix the task they review.

**Evidence**

- projection-state-hash.json
- acceptance report(s) bound to the final source/result commit

**Stop immediately if**

- 需要修改未在 allowed_paths 中声明的路径
- 需要改变已接受 ADR、身份/Session、授权/Scope、TLS、原生权限或数据所有权边界
- 需要新增生产依赖、破坏性数据库操作或对外部系统写入，但任务未明确授权
- 当前工作树包含无法归属的用户修改；若本任务主动采用可选旧源，则该旧源无法绑定固定 commit

### HW04-05 — 实现 SSE Stream、Cursor 与 Gap Recovery

| Field | Value |
| --- | --- |
| Primary owner | `terra_worker` |
| Supporting agents | `terra_tester`, `terra_browser` |
| Mode | `workspace-write` |
| Parallel group | `C` |
| Risk | `high` |
| Task dependencies | `HW04-04`, `HW02-04` |
| Acceptance tier | `sol-acceptance` |
| Acceptance agents | `terra_reviewer`, `sol_acceptance` |
| Required acceptance outcome | `ACCEPT` |

**Allowed paths**

- `services/collaboration/src/modules/stream/**`
- `packages/hub-client/**`
- `apps/workspace-web/src/platform/events/**`

**Objective**

使用一个 same-origin SSE 连接传输实时投影，并在断线后从 durable API 补齐缺口。

**Implementation steps**

- SSE 发送 eventId/cursor，不承诺全局连续 seq。
- 客户端保存非敏感 cursor，重连先调用 gap endpoint 再进入 live。
- 心跳、退避、Session 失效、visibility pause/resume 明确。
- 多个 capability 共享一个连接，不自行创建 EventSource。
- at-least-once 下客户端以 eventId/dedupKey 幂等。

**Validation**

- single connection assertion
- disconnect/gap/replay
- 401/session revoked
- duplicate/out-of-order

**Acceptance**

- 杀掉连接后状态最终一致
- 无重复 UI 活动

**Independent acceptance procedure**

- Implementation/testing agents finish and return exact commands, evidence and limitations.
- The parent inspects the actual integrated diff before spawning acceptance agents.
- Run the agents listed in `Acceptance agents` against the same final commit/tree digest.
- Required Sol outcomes are advisory but mandatory evidence for the parent Gate.
- A Sol `REJECT`, `BLOCKED` or missing required report prevents task acceptance.
- Acceptance agents are read-only and never fix the task they review.

**Evidence**

- sse-recovery-receipt.json
- acceptance report(s) bound to the final source/result commit

**Stop immediately if**

- 需要修改未在 allowed_paths 中声明的路径
- 需要改变已接受 ADR、身份/Session、授权/Scope、TLS、原生权限或数据所有权边界
- 需要新增生产依赖、破坏性数据库操作或对外部系统写入，但任务未明确授权
- 当前工作树包含无法归属的用户修改；若本任务主动采用可选旧源，则该旧源无法绑定固定 commit

### HW04-06 — 实现 Workspace Inbox/Todo/消息中心基础视图

| Field | Value |
| --- | --- |
| Primary owner | `terra_worker` |
| Supporting agents | `luna_fixtures`, `terra_browser` |
| Mode | `workspace-write` |
| Parallel group | `D` |
| Risk | `medium` |
| Task dependencies | `HW04-05` |
| Acceptance tier | `terra` |
| Acceptance agents | `terra_reviewer` |
| Required acceptance outcome | `APPROVED` |

**Allowed paths**

- `apps/workspace-web/src/features/inbox/**`
- `apps/workspace-web/src/features/todos/**`
- `packages/ui/**`

**Objective**

以人员为中心显示“我的消息”和“我的待办”，不暴露底层系统菜单。

**Implementation steps**

- 统一消息、待办、优先级、来源 capability、状态和深链。
- 敏感摘要按 visibility/sensitivity 降级。
- 读/未读、批量标记、过滤和搜索通过服务端 API。
- 大列表虚拟化和键盘导航。

**Validation**

- component tests
- a11y
- 1k/10k fixture performance
- redaction

**Acceptance**

- 用户可以从待办直达目标工作项
- 锁屏/通知列表不泄漏敏感正文

**Independent acceptance procedure**

- Implementation/testing agents finish and return exact commands, evidence and limitations.
- The parent inspects the actual integrated diff before spawning acceptance agents.
- Run the agents listed in `Acceptance agents` against the same final commit/tree digest.
- Required Sol outcomes are advisory but mandatory evidence for the parent Gate.
- A Sol `REJECT`, `BLOCKED` or missing required report prevents task acceptance.
- Acceptance agents are read-only and never fix the task they review.

**Evidence**

- inbox-todo-ui-report.md
- acceptance report(s) bound to the final source/result commit

**Stop immediately if**

- 需要修改未在 allowed_paths 中声明的路径
- 需要改变已接受 ADR、身份/Session、授权/Scope、TLS、原生权限或数据所有权边界
- 需要新增生产依赖、破坏性数据库操作或对外部系统写入，但任务未明确授权
- 当前工作树包含无法归属的用户修改；若本任务主动采用可选旧源，则该旧源无法绑定固定 commit

### HW04-07 — Synthetic Event End-to-End

| Field | Value |
| --- | --- |
| Primary owner | `terra_tester` |
| Supporting agents | `luna_fixtures`, `terra_browser` |
| Mode | `workspace-write` |
| Parallel group | `E` |
| Risk | `high` |
| Task dependencies | `HW04-03`, `HW04-05`, `HW04-06` |
| Acceptance tier | `sol-acceptance` |
| Acceptance agents | `terra_reviewer`, `sol_acceptance` |
| Required acceptance outcome | `ACCEPT` |

**Allowed paths**

- `services/collaboration/test/**`
- `apps/workspace-web/e2e/**`
- `packages/testkit/**`
- `evidence/HW-04/**`

**Objective**

在没有真实业务领域前走通 command fixture→outbox→event→inbox/todo→SSE→UI→read。

**Implementation steps**

- 创建仅测试启用的 synthetic producer。
- 覆盖成功、重复、乱序、延迟、poison、断线和 Session 撤销。
- 证明刷新后从 durable state 重建。
- 生产构建不包含测试端点/seed。

**Validation**

- full E2E
- failure injection
- production absence scan

**Acceptance**

- 闭环可重复
- 测试能力不进入 production registry

**Independent acceptance procedure**

- Implementation/testing agents finish and return exact commands, evidence and limitations.
- The parent inspects the actual integrated diff before spawning acceptance agents.
- Run the agents listed in `Acceptance agents` against the same final commit/tree digest.
- Required Sol outcomes are advisory but mandatory evidence for the parent Gate.
- A Sol `REJECT`, `BLOCKED` or missing required report prevents task acceptance.
- Acceptance agents are read-only and never fix the task they review.

**Evidence**

- synthetic-event-e2e.json
- acceptance report(s) bound to the final source/result commit

**Stop immediately if**

- 需要修改未在 allowed_paths 中声明的路径
- 需要改变已接受 ADR、身份/Session、授权/Scope、TLS、原生权限或数据所有权边界
- 需要新增生产依赖、破坏性数据库操作或对外部系统写入，但任务未明确授权
- 当前工作树包含无法归属的用户修改；若本任务主动采用可选旧源，则该旧源无法绑定固定 commit

### HW04-08 — Event Collaboration Gate

| Field | Value |
| --- | --- |
| Primary owner | `parent_codex` |
| Supporting agents | `terra_reviewer`, `terra_security` |
| Mode | `read-only` |
| Parallel group | `F` |
| Risk | `critical` |
| Task dependencies | `HW04-03`, `HW04-04`, `HW04-05`, `HW04-07` |
| Acceptance tier | `sol-phase-gate` |
| Acceptance agents | `terra_reviewer`, `terra_security`, `sol_acceptance`, `sol_phase_gate` |
| Required acceptance outcome | `PASS_RECOMMENDED` |

**Allowed paths**

- `services/collaboration/**`
- `packages/hub-*/**`
- `packages/outbox-sdk/**`
- `apps/workspace-web/src/platform/events/**`

**Objective**

确认事件平台可靠且只是投影/传输层，不拥有业务真相。

**Implementation steps**

- 审查 Catalog、Outbox、Event Store、Inbox/Todo、SSE、replay、redaction。
- 查找 producer 直发、客户端多连接、exactly-once 虚假承诺和越权 recipient。
- 签发 G04。

**Validation**

- full collaboration suite
- replay state hash
- security review

**Acceptance**

- P0/P1 为零
- 允许 Work Item 与领域服务接入

**Independent acceptance procedure**

- Implementation/testing agents finish and return exact commands, evidence and limitations.
- The parent inspects the actual integrated diff before spawning acceptance agents.
- Run the agents listed in `Acceptance agents` against the same final commit/tree digest.
- Required Sol outcomes are advisory but mandatory evidence for the parent Gate.
- A Sol `REJECT`, `BLOCKED` or missing required report prevents task acceptance.
- Acceptance agents are read-only and never fix the task they review.

**Evidence**

- G04-gate-decision.md
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
7. Run the phase-level Sol agents: `sol_acceptance`, `sol_phase_gate`.
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
docs/program/phases/HW-04-event-collaboration-platform.md and docs/program/tasks/HW-04.yaml.

Execute only HW-04. Use Luna for narrow discovery/docs/fixtures, Terra for bounded implementation/testing/review,
and the task matrix's Sol route for independent acceptance. Run the phase-level Sol Gate agents only after the
final integrated diff and evidence are frozen. Parent Codex makes the final Gate decision.
Do not begin the next phase, push, merge, release or change external systems without explicit authorization.
```
