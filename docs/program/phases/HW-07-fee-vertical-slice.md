# HW-07 — 第二个垂直切片：确费与强确定性短流程

## Goal

以确费验证高频、短事务、金额与患者最小信息、严格权限、幂等确认/取消和卡片单击处理，证明聊天界面不会弱化确定性业务控制。

## Dependencies

`HW-05`, `HW-06`

A dependent phase must be `PASS`. `CONDITIONAL` does not automatically authorize this phase.

## Deliverables

- `services/fee` 独立领域服务
- `fee-contracts`、金额/时间语义
- HIS/Hosp Access Adapter
- Fee Outbox/Event/WorkItem mapping
- Workspace Fee Capability
- 并发、重复点击、过期、权限和脱敏 E2E

## Out of scope

- 替换 HIS 财务真相
- 离线确费
- Agent 自动确认费用
- 全量费用报表

## Phase acceptance

- Money、HIS authoritative state 和平台回执无歧义
- 重复/并发确认或取消不产生重复业务写入
- HIS unknown result 被诚实保留并可核对
- 患者信息最小化且不进入通知/日志
- 卡片高频处理不绕过服务端权限和状态机

## Gates

- G07-1 Fee 领域与 HIS 边界
- G07-2 金额/状态/幂等
- G07-3 患者最小化与权限
- G07-4 卡片高频体验
- G07-5 事务/Outbox/回写恢复

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
| `HW07-01` | 审计并抽取 Legacy Fee Domain | `terra_migrator` | luna_explorer, terra_reviewer | `high` | `A` | `sol-acceptance` | terra_reviewer, sol_acceptance |
| `HW07-02` | 冻结 Fee Contracts 与状态机 | `terra_contracts` | luna_fixtures, terra_reviewer | `high` | `A` | `sol-acceptance` | terra_reviewer, sol_acceptance |
| `HW07-03` | 实现 Fee Service 与 Hosp Access Adapter | `parent_codex` | terra_worker, terra_tester, terra_security | `critical` | `B` | `sol-architecture-security` | terra_reviewer, terra_security, sol_architecture_security |
| `HW07-04` | 实现 Fee Outbox 与 WorkItem Mapping | `terra_worker` | terra_tester, terra_reviewer | `high` | `B` | `sol-acceptance` | terra_reviewer, sol_acceptance |
| `HW07-05` | 实现 Workspace Fee Capability | `terra_worker` | terra_browser, luna_fixtures | `medium` | `C` | `terra` | terra_reviewer |
| `HW07-06` | 确费安全、并发与恢复 E2E | `terra_tester` | terra_browser, terra_security | `critical` | `D` | `sol-acceptance` | terra_reviewer, terra_security, sol_acceptance |
| `HW07-07` | Fee Vertical Slice Gate | `parent_codex` | terra_reviewer, terra_security | `critical` | `E` | `sol-phase-gate` | terra_reviewer, terra_security, sol_acceptance, sol_phase_gate |

## Detailed implementation plan

### HW07-01 — 审计并抽取 Legacy Fee Domain

| Field | Value |
| --- | --- |
| Primary owner | `terra_migrator` |
| Supporting agents | `luna_explorer`, `terra_reviewer` |
| Mode | `workspace-write` |
| Parallel group | `A` |
| Risk | `high` |
| Task dependencies | — |
| Acceptance tier | `sol-acceptance` |
| Acceptance agents | `terra_reviewer`, `sol_acceptance` |
| Required acceptance outcome | `ACCEPT` |

**Allowed paths**

- `docs/migration/fee/**`
- `services/fee/**`
- `packages/fee-contracts/**`

**Objective**

按目标 Fee 契约重新实现业务规则、HIS Adapter 与测试；若配置可选旧源，仅作需求核对和算法提取，不复制 Next 页面、Radix 组件、Mock 数据与旧 Hub UI。

**Implementation steps**

- 绘制 list/detail/confirm/cancel/error 调用链。
- 区分 authoritative HIS 状态、平台记录和 UI-only formatting。
- 冻结金额、业务号、患者最小字段和时间语义。
- 登记迁移文件与拒绝文件。

**Validation**

- source manifest
- behavior fixtures
- no Next/UI import

**Acceptance**

- 领域需求可追溯
- 新服务无旧页面依赖

**Independent acceptance procedure**

- Implementation/testing agents finish and return exact commands, evidence and limitations.
- The parent inspects the actual integrated diff before spawning acceptance agents.
- Run the agents listed in `Acceptance agents` against the same final commit/tree digest.
- Required Sol outcomes are advisory but mandatory evidence for the parent Gate.
- A Sol `REJECT`, `BLOCKED` or missing required report prevents task acceptance.
- Acceptance agents are read-only and never fix the task they review.

**Evidence**

- fee-migration-plan.yaml
- acceptance report(s) bound to the final source/result commit

**Stop immediately if**

- 需要修改未在 allowed_paths 中声明的路径
- 需要改变已接受 ADR、身份/Session、授权/Scope、TLS、原生权限或数据所有权边界
- 需要新增生产依赖、破坏性数据库操作或对外部系统写入，但任务未明确授权
- 当前工作树包含无法归属的用户修改；若本任务主动采用可选旧源，则该旧源无法绑定固定 commit

### HW07-02 — 冻结 Fee Contracts 与状态机

| Field | Value |
| --- | --- |
| Primary owner | `terra_contracts` |
| Supporting agents | `luna_fixtures`, `terra_reviewer` |
| Mode | `workspace-write` |
| Parallel group | `A` |
| Risk | `high` |
| Task dependencies | `HW07-01` |
| Acceptance tier | `sol-acceptance` |
| Acceptance agents | `terra_reviewer`, `sol_acceptance` |
| Required acceptance outcome | `ACCEPT` |

**Allowed paths**

- `packages/fee-contracts/**`
- `packages/card-protocol/**`
- `packages/hub-contracts/**`

**Objective**

定义 Fee Item/Batch/Confirmation、Money、患者摘要、命令、事件、错误和卡片。

**Implementation steps**

- 状态覆盖 pending/confirming/confirmed/cancelling/cancelled/rejected/expired/failed。
- Money 使用整数最小货币单位或明确 Decimal 语义，禁止浮点。
- 命令带 expectedVersion/idempotency/HIS correlation。
- 患者姓名等敏感字段不进入通知摘要。
- 定义 HIS 已处理、超时未知结果和重复提交 fixtures。

**Validation**

- money/time tests
- state table
- idempotency
- redaction

**Acceptance**

- 金额与状态无歧义
- 未知结果不被前端视为成功

**Independent acceptance procedure**

- Implementation/testing agents finish and return exact commands, evidence and limitations.
- The parent inspects the actual integrated diff before spawning acceptance agents.
- Run the agents listed in `Acceptance agents` against the same final commit/tree digest.
- Required Sol outcomes are advisory but mandatory evidence for the parent Gate.
- A Sol `REJECT`, `BLOCKED` or missing required report prevents task acceptance.
- Acceptance agents are read-only and never fix the task they review.

**Evidence**

- fee-contract-snapshot.json
- acceptance report(s) bound to the final source/result commit

**Stop immediately if**

- 需要修改未在 allowed_paths 中声明的路径
- 需要改变已接受 ADR、身份/Session、授权/Scope、TLS、原生权限或数据所有权边界
- 需要新增生产依赖、破坏性数据库操作或对外部系统写入，但任务未明确授权
- 当前工作树包含无法归属的用户修改；若本任务主动采用可选旧源，则该旧源无法绑定固定 commit

### HW07-03 — 实现 Fee Service 与 Hosp Access Adapter

| Field | Value |
| --- | --- |
| Primary owner | `parent_codex` |
| Supporting agents | `terra_worker`, `terra_tester`, `terra_security` |
| Mode | `workspace-write` |
| Parallel group | `B` |
| Risk | `critical` |
| Task dependencies | `HW07-02` |
| Acceptance tier | `sol-architecture-security` |
| Acceptance agents | `terra_reviewer`, `terra_security`, `sol_architecture_security` |
| Required acceptance outcome | `ACCEPT` |

**Allowed paths**

- `services/fee/**`
- `database/prisma/models/fee.prisma`
- `packages/hosp-contracts/**`

**Objective**

实现独立确费服务，HIS 访问全部经过受控 Hosp Access/Adapter，平台不伪造 HIS 真相。

**Implementation steps**

- 创建新 fee schema 和 migration。
- 实现 list/detail/confirm/cancel use cases 与 repository。
- 上游请求使用 correlation/idempotency 并分类 timeout/unknown/definitive failure。
- 平台状态保存命令和回执，不替代 HIS authoritative status。
- 服务端权限/Scope/患者最小化和审计。

**Validation**

- service integration
- fake HIS
- timeout/unknown
- permission/scope
- migration rebuild

**Acceptance**

- Workspace 不直接调用 HIS
- 服务重试不重复确费

**Independent acceptance procedure**

- Implementation/testing agents finish and return exact commands, evidence and limitations.
- The parent inspects the actual integrated diff before spawning acceptance agents.
- Run the agents listed in `Acceptance agents` against the same final commit/tree digest.
- Required Sol outcomes are advisory but mandatory evidence for the parent Gate.
- A Sol `REJECT`, `BLOCKED` or missing required report prevents task acceptance.
- Acceptance agents are read-only and never fix the task they review.

**Evidence**

- fee-service-report.md
- acceptance report(s) bound to the final source/result commit

**Stop immediately if**

- 需要修改未在 allowed_paths 中声明的路径
- 需要改变已接受 ADR、身份/Session、授权/Scope、TLS、原生权限或数据所有权边界
- 需要新增生产依赖、破坏性数据库操作或对外部系统写入，但任务未明确授权
- 当前工作树包含无法归属的用户修改；若本任务主动采用可选旧源，则该旧源无法绑定固定 commit

### HW07-04 — 实现 Fee Outbox 与 WorkItem Mapping

| Field | Value |
| --- | --- |
| Primary owner | `terra_worker` |
| Supporting agents | `terra_tester`, `terra_reviewer` |
| Mode | `workspace-write` |
| Parallel group | `B` |
| Risk | `high` |
| Task dependencies | `HW07-03` |
| Acceptance tier | `sol-acceptance` |
| Acceptance agents | `terra_reviewer`, `sol_acceptance` |
| Required acceptance outcome | `ACCEPT` |

**Allowed paths**

- `services/fee/src/events/**`
- `services/collaboration/src/mappings/fee/**`

**Objective**

将待确费、确认、取消、冲突、过期和未知结果投影到人员待办和时间线。

**Implementation steps**

- 业务记录与 Outbox 同事务。
- 待办 recipient 按科室/角色/本人 Scope 解析。
- confirmed/cancelled 关闭对应 Todo；unknown 保持待核查。
- 重放不重复创建工作项。

**Validation**

- outbox crash
- recipient scope
- replay
- unknown result

**Acceptance**

- 无 ghost confirmation
- 工作项与 HIS/平台状态可解释

**Independent acceptance procedure**

- Implementation/testing agents finish and return exact commands, evidence and limitations.
- The parent inspects the actual integrated diff before spawning acceptance agents.
- Run the agents listed in `Acceptance agents` against the same final commit/tree digest.
- Required Sol outcomes are advisory but mandatory evidence for the parent Gate.
- A Sol `REJECT`, `BLOCKED` or missing required report prevents task acceptance.
- Acceptance agents are read-only and never fix the task they review.

**Evidence**

- fee-event-workitem-receipt.json
- acceptance report(s) bound to the final source/result commit

**Stop immediately if**

- 需要修改未在 allowed_paths 中声明的路径
- 需要改变已接受 ADR、身份/Session、授权/Scope、TLS、原生权限或数据所有权边界
- 需要新增生产依赖、破坏性数据库操作或对外部系统写入，但任务未明确授权
- 当前工作树包含无法归属的用户修改；若本任务主动采用可选旧源，则该旧源无法绑定固定 commit

### HW07-05 — 实现 Workspace Fee Capability

| Field | Value |
| --- | --- |
| Primary owner | `terra_worker` |
| Supporting agents | `terra_browser`, `luna_fixtures` |
| Mode | `workspace-write` |
| Parallel group | `C` |
| Risk | `medium` |
| Task dependencies | `HW07-02`, `HW07-04` |
| Acceptance tier | `terra` |
| Acceptance agents | `terra_reviewer` |
| Required acceptance outcome | `APPROVED` |

**Allowed paths**

- `apps/workspace-web/src/capabilities/fee/**`

**Objective**

提供待确费队列、单笔卡片、批次/明细 Canvas 和确认/取消动作。

**Implementation steps**

- 默认卡片只显示最小必要患者和金额摘要。
- 详情按权限懒加载并在离开时清除内存引用。
- 点击后显示 pending，accepted event 后才显示完成。
- 双击、过期、409、HIS unknown 有明确状态。
- 支持键盘快速处理但高风险动作可二次确认。

**Validation**

- component/a11y
- double click
- 403/409/unknown
- sensitive memory/log scan

**Acceptance**

- 高频操作步骤减少
- 不会因聊天文本“确认”直接写业务

**Independent acceptance procedure**

- Implementation/testing agents finish and return exact commands, evidence and limitations.
- The parent inspects the actual integrated diff before spawning acceptance agents.
- Run the agents listed in `Acceptance agents` against the same final commit/tree digest.
- Required Sol outcomes are advisory but mandatory evidence for the parent Gate.
- A Sol `REJECT`, `BLOCKED` or missing required report prevents task acceptance.
- Acceptance agents are read-only and never fix the task they review.

**Evidence**

- fee-capability-evidence.md
- acceptance report(s) bound to the final source/result commit

**Stop immediately if**

- 需要修改未在 allowed_paths 中声明的路径
- 需要改变已接受 ADR、身份/Session、授权/Scope、TLS、原生权限或数据所有权边界
- 需要新增生产依赖、破坏性数据库操作或对外部系统写入，但任务未明确授权
- 当前工作树包含无法归属的用户修改；若本任务主动采用可选旧源，则该旧源无法绑定固定 commit

### HW07-06 — 确费安全、并发与恢复 E2E

| Field | Value |
| --- | --- |
| Primary owner | `terra_tester` |
| Supporting agents | `terra_browser`, `terra_security` |
| Mode | `workspace-write` |
| Parallel group | `D` |
| Risk | `critical` |
| Task dependencies | `HW07-03`, `HW07-05` |
| Acceptance tier | `sol-acceptance` |
| Acceptance agents | `terra_reviewer`, `terra_security`, `sol_acceptance` |
| Required acceptance outcome | `ACCEPT` |

**Allowed paths**

- `services/fee/test/**`
- `apps/workspace-web/e2e/fee/**`
- `evidence/HW-07/**`

**Objective**

验证重复点击、并发用户、HIS 超时、Hub 中断、切换人员和撤权。

**Implementation steps**

- 两个用户同时处理同一费用。
- HIS 成功但响应丢失、平台重试、最终核对。
- Outbox/Hub 中断后恢复。
- 锁屏/通知/日志无敏感泄漏。

**Validation**

- race tests
- fake HIS fault matrix
- replay
- privacy scan

**Acceptance**

- 不重复收费/确认
- 未知状态诚实保留
- 最终一致

**Independent acceptance procedure**

- Implementation/testing agents finish and return exact commands, evidence and limitations.
- The parent inspects the actual integrated diff before spawning acceptance agents.
- Run the agents listed in `Acceptance agents` against the same final commit/tree digest.
- Required Sol outcomes are advisory but mandatory evidence for the parent Gate.
- A Sol `REJECT`, `BLOCKED` or missing required report prevents task acceptance.
- Acceptance agents are read-only and never fix the task they review.

**Evidence**

- fee-e2e-receipt.json
- acceptance report(s) bound to the final source/result commit

**Stop immediately if**

- 需要修改未在 allowed_paths 中声明的路径
- 需要改变已接受 ADR、身份/Session、授权/Scope、TLS、原生权限或数据所有权边界
- 需要新增生产依赖、破坏性数据库操作或对外部系统写入，但任务未明确授权
- 当前工作树包含无法归属的用户修改；若本任务主动采用可选旧源，则该旧源无法绑定固定 commit

### HW07-07 — Fee Vertical Slice Gate

| Field | Value |
| --- | --- |
| Primary owner | `parent_codex` |
| Supporting agents | `terra_reviewer`, `terra_security` |
| Mode | `read-only` |
| Parallel group | `E` |
| Risk | `critical` |
| Task dependencies | `HW07-03`, `HW07-04`, `HW07-06` |
| Acceptance tier | `sol-phase-gate` |
| Acceptance agents | `terra_reviewer`, `terra_security`, `sol_acceptance`, `sol_phase_gate` |
| Required acceptance outcome | `PASS_RECOMMENDED` |

**Allowed paths**

- `services/fee/**`
- `apps/workspace-web/src/capabilities/fee/**`
- `services/collaboration/src/mappings/fee/**`

**Objective**

确认新交互提高效率但没有牺牲财务和患者安全。

**Implementation steps**

- 复核 Money、HIS 边界、幂等、权限、脱敏、UI 和恢复。
- 签发 G07。

**Validation**

- full fee suite
- security review
- workflow usability

**Acceptance**

- P0/P1 为零
- 允许进入交班和轻应用

**Independent acceptance procedure**

- Implementation/testing agents finish and return exact commands, evidence and limitations.
- The parent inspects the actual integrated diff before spawning acceptance agents.
- Run the agents listed in `Acceptance agents` against the same final commit/tree digest.
- Required Sol outcomes are advisory but mandatory evidence for the parent Gate.
- A Sol `REJECT`, `BLOCKED` or missing required report prevents task acceptance.
- Acceptance agents are read-only and never fix the task they review.

**Evidence**

- G07-gate-decision.md
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
docs/program/phases/HW-07-fee-vertical-slice.md and docs/program/tasks/HW-07.yaml.

Execute only HW-07. Use Luna for narrow discovery/docs/fixtures, Terra for bounded implementation/testing/review,
and the task matrix's Sol route for independent acceptance. Run the phase-level Sol Gate agents only after the
final integrated diff and evidence are frozen. Parent Codex makes the final Gate decision.
Do not begin the next phase, push, merge, release or change external systems without explicit authorization.
```
