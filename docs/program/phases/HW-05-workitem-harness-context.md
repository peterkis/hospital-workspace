# HW-05 — 工作项、上下文、卡片协议与 Harness

## Goal

建立以任务和工作项为中心的协作内核：业务线程、活动时间线、结构化卡片、命令回执、Decision/Handoff 和 Harness 完成状态机；领域服务仍是业务真相。

## Dependencies

`HW-03`, `HW-04`

A dependent phase must be `PASS`. `CONDITIONAL` does not automatically authorize this phase.

## Deliverables

- `services/collaboration` work-items/harness/decisions/handoffs 模块
- WorkItem、Thread、Activity、Context、Card/Action Contracts
- Workspace Space/Thread/Timeline/Card/Canvas Runtime
- 用户裁决高于模型推断的 Decision 机制
- 确定性 Projection 和恢复
- synthetic work item 全闭环

## Out of scope

- 真实工单/确费/交班领域
- LLM Agent
- 任意动态 JavaScript 插件
- 客户端本地业务数据库

## Phase acceptance

- WorkItem 只投影领域实例，不覆盖业务状态
- Card Action 具备 command/idempotency/version 且服务端确认完成
- Harness/Decision/Handoff 状态机拒绝非法转换
- 用户批准/拒绝高于模型建议
- Context 按需解析、重新授权且敏感数据不本地持久化

## Gates

- G05-1 WorkItem 非业务真相
- G05-2 Timeline/Projection 可重建
- G05-3 Card Action 幂等与服务端确认
- G05-4 Harness/Decision/Handoff 状态机
- G05-5 Context 最小化与权限

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
| `HW05-01` | 定义 Space、Thread、WorkItem 与 Activity Contracts | `terra_contracts` | luna_fixtures, terra_reviewer | `high` | `A` | `sol-acceptance` | terra_reviewer, sol_acceptance |
| `HW05-02` | 定义 Card、Action 与 Canvas Protocol | `terra_contracts` | luna_fixtures, terra_security | `high` | `A` | `sol-acceptance` | terra_reviewer, sol_acceptance |
| `HW05-03` | 实现 Work Item Projection 与 Query API | `terra_worker` | terra_tester, terra_reviewer | `high` | `B` | `sol-acceptance` | terra_reviewer, sol_acceptance |
| `HW05-04` | 实现 Harness、Decision 与 Handoff 状态机 | `parent_codex` | terra_contracts, terra_tester, terra_reviewer | `critical` | `B` | `sol-architecture-security` | terra_reviewer, terra_security, sol_architecture_security |
| `HW05-05` | 实现 Command Dispatcher 与 Action Receipt | `terra_worker` | terra_tester, terra_security | `high` | `C` | `sol-acceptance` | terra_reviewer, sol_acceptance |
| `HW05-06` | 实现 Context Resolver 与最小化快照 | `terra_worker` | terra_contracts, terra_security | `high` | `C` | `sol-acceptance` | terra_reviewer, sol_acceptance |
| `HW05-07` | 实现 Workspace Space/Thread/Timeline/Card/Canvas Runtime | `terra_worker` | terra_browser, luna_fixtures | `medium` | `D` | `terra` | terra_reviewer |
| `HW05-08` | Synthetic Work Item & Harness E2E | `terra_tester` | luna_fixtures, terra_browser | `high` | `E` | `sol-acceptance` | terra_reviewer, sol_acceptance |
| `HW05-09` | Work Item & Harness Gate | `parent_codex` | terra_reviewer, terra_security | `critical` | `F` | `sol-phase-gate` | terra_reviewer, terra_security, sol_acceptance, sol_phase_gate |

## Detailed implementation plan

### HW05-01 — 定义 Space、Thread、WorkItem 与 Activity Contracts

| Field | Value |
| --- | --- |
| Primary owner | `terra_contracts` |
| Supporting agents | `luna_fixtures`, `terra_reviewer` |
| Mode | `workspace-write` |
| Parallel group | `A` |
| Risk | `high` |
| Task dependencies | — |
| Acceptance tier | `sol-acceptance` |
| Acceptance agents | `terra_reviewer`, `sol_acceptance` |
| Required acceptance outcome | `ACCEPT` |

**Allowed paths**

- `packages/workspace-contracts/**`
- `packages/workitem-contracts/**`

**Objective**

将应用入口改为能力空间，将每笔业务/项目/Agent Run 映射为线程和工作项。

**Implementation steps**

- Space 表示能力或协作范围；Thread 表示业务实例/项目；WorkItem 表示需要跟进的责任单元。
- Activity 是事件的只读投影，保留 provenance。
- WorkItem 引用 source aggregate 和 domainStatus，但不覆盖领域状态。
- 定义 assignee/participants/priority/dueAt/contextRefs/version。
- 提供 ticket/fee/handover/agent/knowledge fixtures。

**Validation**

- schema tests
- cross-domain fixtures
- invalid ownership/status tests

**Acceptance**

- 同一模型可表达用户列出的七类基本单位
- 不把所有事件都误建为 Todo

**Independent acceptance procedure**

- Implementation/testing agents finish and return exact commands, evidence and limitations.
- The parent inspects the actual integrated diff before spawning acceptance agents.
- Run the agents listed in `Acceptance agents` against the same final commit/tree digest.
- Required Sol outcomes are advisory but mandatory evidence for the parent Gate.
- A Sol `REJECT`, `BLOCKED` or missing required report prevents task acceptance.
- Acceptance agents are read-only and never fix the task they review.

**Evidence**

- workitem-contract-snapshot.json
- acceptance report(s) bound to the final source/result commit

**Stop immediately if**

- 需要修改未在 allowed_paths 中声明的路径
- 需要改变已接受 ADR、身份/Session、授权/Scope、TLS、原生权限或数据所有权边界
- 需要新增生产依赖、破坏性数据库操作或对外部系统写入，但任务未明确授权
- 当前工作树包含无法归属的用户修改；若本任务主动采用可选旧源，则该旧源无法绑定固定 commit

### HW05-02 — 定义 Card、Action 与 Canvas Protocol

| Field | Value |
| --- | --- |
| Primary owner | `terra_contracts` |
| Supporting agents | `luna_fixtures`, `terra_security` |
| Mode | `workspace-write` |
| Parallel group | `A` |
| Risk | `high` |
| Task dependencies | `HW01-02`, `HW05-01` |
| Acceptance tier | `sol-acceptance` |
| Acceptance agents | `terra_reviewer`, `sol_acceptance` |
| Required acceptance outcome | `ACCEPT` |

**Allowed paths**

- `packages/card-protocol/**`
- `packages/capability-sdk/**`

**Objective**

让高频业务通过结构化卡片处理，复杂详情通过 Canvas 展开，自然语言只负责表达与协作。

**Implementation steps**

- Card 包含 type/version/data/status/actions/render hints，不携带可执行代码。
- Action 引用已注册 commandType，必须有 commandId/idempotencyKey/expectedVersion。
- Canvas 只能打开已注册 capability route。
- 未知 card/version 降级为不可操作摘要。
- 定义 sensitivity-aware field rendering。

**Validation**

- schema/renderer fixtures
- unknown card
- action replay
- XSS/unsafe URL

**Acceptance**

- 无法通过 card 注入 JS/HTML/任意 endpoint
- 动作只有服务端 accepted event 后完成

**Independent acceptance procedure**

- Implementation/testing agents finish and return exact commands, evidence and limitations.
- The parent inspects the actual integrated diff before spawning acceptance agents.
- Run the agents listed in `Acceptance agents` against the same final commit/tree digest.
- Required Sol outcomes are advisory but mandatory evidence for the parent Gate.
- A Sol `REJECT`, `BLOCKED` or missing required report prevents task acceptance.
- Acceptance agents are read-only and never fix the task they review.

**Evidence**

- card-protocol-catalog.json
- acceptance report(s) bound to the final source/result commit

**Stop immediately if**

- 需要修改未在 allowed_paths 中声明的路径
- 需要改变已接受 ADR、身份/Session、授权/Scope、TLS、原生权限或数据所有权边界
- 需要新增生产依赖、破坏性数据库操作或对外部系统写入，但任务未明确授权
- 当前工作树包含无法归属的用户修改；若本任务主动采用可选旧源，则该旧源无法绑定固定 commit

### HW05-03 — 实现 Work Item Projection 与 Query API

| Field | Value |
| --- | --- |
| Primary owner | `terra_worker` |
| Supporting agents | `terra_tester`, `terra_reviewer` |
| Mode | `workspace-write` |
| Parallel group | `B` |
| Risk | `high` |
| Task dependencies | `HW05-01`, `HW04-04` |
| Acceptance tier | `sol-acceptance` |
| Acceptance agents | `terra_reviewer`, `sol_acceptance` |
| Required acceptance outcome | `ACCEPT` |

**Allowed paths**

- `services/collaboration/src/modules/work-items/**`
- `database/prisma/models/collab.prisma`

**Objective**

从领域事件确定性投影工作项、参与者、期限和状态，不允许客户端任意创建权威状态。

**Implementation steps**

- Projection handler 按 domain mapping 注册。
- workItem version 与 source aggregate version 分离。
- 支持 assigned/self/department/project 查询和服务端 Scope。
- 事件重放可重建一致状态。
- 手工备注作为 Activity，不修改领域状态。

**Validation**

- projection replay
- scope matrix
- out-of-order/duplicate
- rebuild hash

**Acceptance**

- 同事件集产生相同 work item
- 跨科室查询被拒

**Independent acceptance procedure**

- Implementation/testing agents finish and return exact commands, evidence and limitations.
- The parent inspects the actual integrated diff before spawning acceptance agents.
- Run the agents listed in `Acceptance agents` against the same final commit/tree digest.
- Required Sol outcomes are advisory but mandatory evidence for the parent Gate.
- A Sol `REJECT`, `BLOCKED` or missing required report prevents task acceptance.
- Acceptance agents are read-only and never fix the task they review.

**Evidence**

- workitem-projection-receipt.json
- acceptance report(s) bound to the final source/result commit

**Stop immediately if**

- 需要修改未在 allowed_paths 中声明的路径
- 需要改变已接受 ADR、身份/Session、授权/Scope、TLS、原生权限或数据所有权边界
- 需要新增生产依赖、破坏性数据库操作或对外部系统写入，但任务未明确授权
- 当前工作树包含无法归属的用户修改；若本任务主动采用可选旧源，则该旧源无法绑定固定 commit

### HW05-04 — 实现 Harness、Decision 与 Handoff 状态机

| Field | Value |
| --- | --- |
| Primary owner | `parent_codex` |
| Supporting agents | `terra_contracts`, `terra_tester`, `terra_reviewer` |
| Mode | `workspace-write` |
| Parallel group | `B` |
| Risk | `critical` |
| Task dependencies | `HW05-01`, `HW04-04` |
| Acceptance tier | `sol-architecture-security` |
| Acceptance agents | `terra_reviewer`, `terra_security`, `sol_architecture_security` |
| Required acceptance outcome | `ACCEPT` |

**Allowed paths**

- `services/collaboration/src/modules/harness/**`
- `services/collaboration/src/modules/decisions/**`
- `services/collaboration/src/modules/handoffs/**`
- `packages/harness-contracts/**`

**Objective**

借鉴 Knowe Harness，但用服务端确定性状态机保证任务、裁决、交接和完成留痕。

**Implementation steps**

- Harness 状态：draft/queued/running/waiting_user/blocked/succeeded/failed/cancelled。
- Decision 状态：proposed/pending/approved/rejected/expired/executed。
- Handoff 记录 from/to、理由、上下文、接受/拒绝和证据。
- 用户 approved/rejected 是最高权威；模型建议不能覆盖。
- 完成必须满足 validator，不接受文本声称完成。

**Validation**

- transition table
- invalid transition
- approve/reject race
- cancel/late event
- restart recovery

**Acceptance**

- 每次状态变化产生注册事件
- 决策和交接不可静默丢失

**Independent acceptance procedure**

- Implementation/testing agents finish and return exact commands, evidence and limitations.
- The parent inspects the actual integrated diff before spawning acceptance agents.
- Run the agents listed in `Acceptance agents` against the same final commit/tree digest.
- Required Sol outcomes are advisory but mandatory evidence for the parent Gate.
- A Sol `REJECT`, `BLOCKED` or missing required report prevents task acceptance.
- Acceptance agents are read-only and never fix the task they review.

**Evidence**

- harness-state-machine-report.md
- acceptance report(s) bound to the final source/result commit

**Stop immediately if**

- 需要修改未在 allowed_paths 中声明的路径
- 需要改变已接受 ADR、身份/Session、授权/Scope、TLS、原生权限或数据所有权边界
- 需要新增生产依赖、破坏性数据库操作或对外部系统写入，但任务未明确授权
- 当前工作树包含无法归属的用户修改；若本任务主动采用可选旧源，则该旧源无法绑定固定 commit

### HW05-05 — 实现 Command Dispatcher 与 Action Receipt

| Field | Value |
| --- | --- |
| Primary owner | `terra_worker` |
| Supporting agents | `terra_tester`, `terra_security` |
| Mode | `workspace-write` |
| Parallel group | `C` |
| Risk | `high` |
| Task dependencies | `HW05-02`, `HW05-04` |
| Acceptance tier | `sol-acceptance` |
| Acceptance agents | `terra_reviewer`, `sol_acceptance` |
| Required acceptance outcome | `ACCEPT` |

**Allowed paths**

- `services/gateway/src/commands/**`
- `services/collaboration/src/modules/command-receipts/**`
- `packages/capability-sdk/**`

**Objective**

统一接收 Workspace 卡片动作、路由到领域服务，并将 pending/accepted/rejected/conflict 回执投影回线程。

**Implementation steps**

- Gateway 验证 CSRF、Principal、capability、action permission 和 payload schema。
- 领域服务再次执行权限/Scope/状态/version 检查。
- Command Receipt 记录 accepted/rejected/conflict，不把 HTTP 200 等同业务完成。
- 重复 commandId 返回原结果。
- 超时后客户端查询 receipt，避免盲目重试。

**Validation**

- double click
- timeout/unknown result
- 403/409
- replay
- stale session

**Acceptance**

- 重复动作不重复写业务
- 错误可诊断且时间线一致

**Independent acceptance procedure**

- Implementation/testing agents finish and return exact commands, evidence and limitations.
- The parent inspects the actual integrated diff before spawning acceptance agents.
- Run the agents listed in `Acceptance agents` against the same final commit/tree digest.
- Required Sol outcomes are advisory but mandatory evidence for the parent Gate.
- A Sol `REJECT`, `BLOCKED` or missing required report prevents task acceptance.
- Acceptance agents are read-only and never fix the task they review.

**Evidence**

- command-receipt-matrix.json
- acceptance report(s) bound to the final source/result commit

**Stop immediately if**

- 需要修改未在 allowed_paths 中声明的路径
- 需要改变已接受 ADR、身份/Session、授权/Scope、TLS、原生权限或数据所有权边界
- 需要新增生产依赖、破坏性数据库操作或对外部系统写入，但任务未明确授权
- 当前工作树包含无法归属的用户修改；若本任务主动采用可选旧源，则该旧源无法绑定固定 commit

### HW05-06 — 实现 Context Resolver 与最小化快照

| Field | Value |
| --- | --- |
| Primary owner | `terra_worker` |
| Supporting agents | `terra_contracts`, `terra_security` |
| Mode | `workspace-write` |
| Parallel group | `C` |
| Risk | `high` |
| Task dependencies | `HW05-01`, `HW02-05` |
| Acceptance tier | `sol-acceptance` |
| Acceptance agents | `terra_reviewer`, `sol_acceptance` |
| Required acceptance outcome | `ACCEPT` |

**Allowed paths**

- `services/gateway/src/context/**`
- `packages/context-contracts/**`
- `apps/workspace-web/src/context/**`

**Objective**

为线程提供人员、组织、位置、患者、资产和项目上下文引用，但每次展示都重新授权并最小化。

**Implementation steps**

- ContextRef 只保存类型/id/version；显示快照由 owner service 解析。
- 患者/临床上下文默认不进入通知或本地缓存。
- Context panel 按 permission/scope 懒加载。
- 版本变化和撤权后旧快照失效。

**Validation**

- authorization matrix
- stale context
- redaction
- cache absence

**Acceptance**

- 跨用户/科室不能复用敏感上下文
- 线程可解释当前处理对象

**Independent acceptance procedure**

- Implementation/testing agents finish and return exact commands, evidence and limitations.
- The parent inspects the actual integrated diff before spawning acceptance agents.
- Run the agents listed in `Acceptance agents` against the same final commit/tree digest.
- Required Sol outcomes are advisory but mandatory evidence for the parent Gate.
- A Sol `REJECT`, `BLOCKED` or missing required report prevents task acceptance.
- Acceptance agents are read-only and never fix the task they review.

**Evidence**

- context-security-report.md
- acceptance report(s) bound to the final source/result commit

**Stop immediately if**

- 需要修改未在 allowed_paths 中声明的路径
- 需要改变已接受 ADR、身份/Session、授权/Scope、TLS、原生权限或数据所有权边界
- 需要新增生产依赖、破坏性数据库操作或对外部系统写入，但任务未明确授权
- 当前工作树包含无法归属的用户修改；若本任务主动采用可选旧源，则该旧源无法绑定固定 commit

### HW05-07 — 实现 Workspace Space/Thread/Timeline/Card/Canvas Runtime

| Field | Value |
| --- | --- |
| Primary owner | `terra_worker` |
| Supporting agents | `terra_browser`, `luna_fixtures` |
| Mode | `workspace-write` |
| Parallel group | `D` |
| Risk | `medium` |
| Task dependencies | `HW05-02`, `HW05-03`, `HW05-05`, `HW05-06` |
| Acceptance tier | `terra` |
| Acceptance agents | `terra_reviewer` |
| Required acceptance outcome | `APPROVED` |

**Allowed paths**

- `apps/workspace-web/src/features/spaces/**`
- `apps/workspace-web/src/features/threads/**`
- `apps/workspace-web/src/features/timeline/**`
- `apps/workspace-web/src/features/cards/**`
- `apps/workspace-web/src/features/canvas/**`

**Objective**

完成新产品的核心交互骨架：用户围绕工作项处理，不围绕系统菜单跳转。

**Implementation steps**

- 左侧空间/队列，中间线程时间线，右侧 Context/Canvas。
- 时间线统一显示用户、系统、Agent、决策、附件和错误活动。
- Card Registry 编译期注册；Capability Route 与 Registry 一致。
- 支持 deep link、刷新重建、键盘和无障碍。
- 大线程采用分页/虚拟化，不把全部历史加载到内存。

**Validation**

- component/e2e
- a11y
- deep link refresh
- long timeline performance

**Acceptance**

- 可用 synthetic fixtures 完成完整动作
- UI 不自行创造业务完成状态

**Independent acceptance procedure**

- Implementation/testing agents finish and return exact commands, evidence and limitations.
- The parent inspects the actual integrated diff before spawning acceptance agents.
- Run the agents listed in `Acceptance agents` against the same final commit/tree digest.
- Required Sol outcomes are advisory but mandatory evidence for the parent Gate.
- A Sol `REJECT`, `BLOCKED` or missing required report prevents task acceptance.
- Acceptance agents are read-only and never fix the task they review.

**Evidence**

- workspace-runtime-evidence.md
- acceptance report(s) bound to the final source/result commit

**Stop immediately if**

- 需要修改未在 allowed_paths 中声明的路径
- 需要改变已接受 ADR、身份/Session、授权/Scope、TLS、原生权限或数据所有权边界
- 需要新增生产依赖、破坏性数据库操作或对外部系统写入，但任务未明确授权
- 当前工作树包含无法归属的用户修改；若本任务主动采用可选旧源，则该旧源无法绑定固定 commit

### HW05-08 — Synthetic Work Item & Harness E2E

| Field | Value |
| --- | --- |
| Primary owner | `terra_tester` |
| Supporting agents | `luna_fixtures`, `terra_browser` |
| Mode | `workspace-write` |
| Parallel group | `E` |
| Risk | `high` |
| Task dependencies | `HW05-04`, `HW05-05`, `HW05-07` |
| Acceptance tier | `sol-acceptance` |
| Acceptance agents | `terra_reviewer`, `sol_acceptance` |
| Required acceptance outcome | `ACCEPT` |

**Allowed paths**

- `services/collaboration/test/**`
- `apps/workspace-web/e2e/**`
- `evidence/HW-05/**`

**Objective**

走通创建工作项、指派、动作、Decision、Handoff、完成、断线恢复和事件重放。

**Implementation steps**

- 使用 synthetic domain，不进入 production registry。
- 覆盖批准/拒绝竞争、转派、超时、取消、late event。
- 刷新/重启后从事件重建。
- 对比 browser/desktop。

**Validation**

- multi-user E2E
- failure injection
- projection rebuild

**Acceptance**

- 状态机和 UI 一致
- 每个决策/交接都有 provenance

**Independent acceptance procedure**

- Implementation/testing agents finish and return exact commands, evidence and limitations.
- The parent inspects the actual integrated diff before spawning acceptance agents.
- Run the agents listed in `Acceptance agents` against the same final commit/tree digest.
- Required Sol outcomes are advisory but mandatory evidence for the parent Gate.
- A Sol `REJECT`, `BLOCKED` or missing required report prevents task acceptance.
- Acceptance agents are read-only and never fix the task they review.

**Evidence**

- synthetic-harness-e2e.json
- acceptance report(s) bound to the final source/result commit

**Stop immediately if**

- 需要修改未在 allowed_paths 中声明的路径
- 需要改变已接受 ADR、身份/Session、授权/Scope、TLS、原生权限或数据所有权边界
- 需要新增生产依赖、破坏性数据库操作或对外部系统写入，但任务未明确授权
- 当前工作树包含无法归属的用户修改；若本任务主动采用可选旧源，则该旧源无法绑定固定 commit

### HW05-09 — Work Item & Harness Gate

| Field | Value |
| --- | --- |
| Primary owner | `parent_codex` |
| Supporting agents | `terra_reviewer`, `terra_security` |
| Mode | `read-only` |
| Parallel group | `F` |
| Risk | `critical` |
| Task dependencies | `HW05-03`, `HW05-04`, `HW05-05`, `HW05-06`, `HW05-08` |
| Acceptance tier | `sol-phase-gate` |
| Acceptance agents | `terra_reviewer`, `terra_security`, `sol_acceptance`, `sol_phase_gate` |
| Required acceptance outcome | `PASS_RECOMMENDED` |

**Allowed paths**

- `services/collaboration/**`
- `packages/*workitem*/**`
- `packages/card-protocol/**`
- `packages/harness-contracts/**`
- `apps/workspace-web/**`

**Objective**

确认工作项/群聊/Harness 是可靠协作层而不是新业务大单体。

**Implementation steps**

- 审查 projection、command、card、decision、handoff、context 和 UI。
- 查找客户端状态权威、动态代码、敏感缓存和跨域写入。
- 签发 G05。

**Validation**

- full work/harness suite
- state replay
- security review

**Acceptance**

- P0/P1 为零
- 允许真实领域接入

**Independent acceptance procedure**

- Implementation/testing agents finish and return exact commands, evidence and limitations.
- The parent inspects the actual integrated diff before spawning acceptance agents.
- Run the agents listed in `Acceptance agents` against the same final commit/tree digest.
- Required Sol outcomes are advisory but mandatory evidence for the parent Gate.
- A Sol `REJECT`, `BLOCKED` or missing required report prevents task acceptance.
- Acceptance agents are read-only and never fix the task they review.

**Evidence**

- G05-gate-decision.md
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
docs/program/phases/HW-05-workitem-harness-context.md and docs/program/tasks/HW-05.yaml.

Execute only HW-05. Use Luna for narrow discovery/docs/fixtures, Terra for bounded implementation/testing/review,
and the task matrix's Sol route for independent acceptance. Run the phase-level Sol Gate agents only after the
final integrated diff and evidence are frozen. Parent Codex makes the final Gate decision.
Do not begin the next phase, push, merge, release or change external systems without explicit authorization.
```
