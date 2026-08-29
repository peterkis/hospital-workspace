# HW-12 — 容量、HA、灰度发布与全院生产

## Goal

基于真实试点指标完成 PostgreSQL、Redis Session、Collaboration SSE、Agent Queue、附件和客户端分发的容量与高可用设计，建立分环灰度、回滚和全院运营治理。

## Dependencies

`HW-11`

A dependent phase must be `PASS`. `CONDITIONAL` does not automatically authorize this phase.

## Deliverables

- 真实负载与容量模型
- PostgreSQL pool/backup/HA
- Redis Session HA
- Collaboration 多实例与 SSE 恢复
- Agent/附件容量和限流
- 客户端与 Workspace release 分环灰度
- 生产运行责任、SLO 和 G12-PRODUCTION

## Out of scope

- 没有试点数据时预先承诺并发规模
- 未经批准的跨院区多租户
- 以增加机器掩盖慢查询或错误架构

## Phase acceptance

- 容量模型来自试点真实指标
- PostgreSQL/Redis HA 不改变数据和 Session 权威
- Collaboration 多实例故障后可回放恢复
- Agent/Knowledge/附件有背压、预算和降级
- 分环发布、版本兼容、回滚和生产责任获人工批准

## Gates

- G12-1 真实容量模型
- G12-2 PostgreSQL/Redis HA
- G12-3 Collaboration/Agent 横向扩展
- G12-4 客户端版本兼容与灰度
- G12-5 全院生产人工批准

## Sol acceptance policy

| Scope | Required route |
| --- | --- |
| Low / medium task | `terra_reviewer`; no task-level Sol required |
| High-risk task | `sol_acceptance` after Terra review |
| Critical architecture/security task | `sol_architecture_security` after Terra review/security review |
| Critical task primarily proving E2E/acceptance evidence | `sol_acceptance` |
| Phase exit | `sol_acceptance`, `sol_architecture_security`, `sol_phase_gate` |
| Parent final decision | `parent_codex` |
| Human decision required | `Yes` |

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
| `HW12-01` | 建立真实负载、容量与成本模型 | `terra_reviewer` | luna_inventory, terra_tester | `high` | `A` | `sol-acceptance` | terra_reviewer, sol_acceptance |
| `HW12-02` | 优化 PostgreSQL Pool、查询与 HA | `parent_codex` | terra_worker, terra_tester, terra_security | `critical` | `B` | `sol-architecture-security` | terra_reviewer, terra_security, sol_architecture_security |
| `HW12-03` | 实现 Redis Session 与 Queue HA | `parent_codex` | terra_worker, terra_tester, terra_security | `critical` | `B` | `sol-architecture-security` | terra_reviewer, terra_security, sol_architecture_security |
| `HW12-04` | Collaboration 多实例与 SSE 横向扩展 | `parent_codex` | terra_worker, terra_tester, terra_reviewer | `critical` | `C` | `sol-architecture-security` | terra_reviewer, terra_security, sol_architecture_security |
| `HW12-05` | Agent、Knowledge 与附件容量治理 | `terra_worker` | terra_tester, terra_security | `high` | `C` | `sol-acceptance` | terra_reviewer, sol_acceptance |
| `HW12-06` | 实现 Server/Workspace/Desktop 分环灰度 | `parent_codex` | terra_worker, terra_tester, terra_security | `critical` | `D` | `sol-architecture-security` | terra_reviewer, terra_security, sol_architecture_security |
| `HW12-07` | 生产 SLO、责任与持续治理 | `luna_docs` | terra_reviewer, terra_security | `high` | `E` | `sol-acceptance` | terra_reviewer, sol_acceptance |
| `HW12-08` | G12-PRODUCTION 最终人工决议 | `parent_codex` | terra_reviewer, terra_security | `critical` | `F` | `sol-phase-gate` | terra_reviewer, terra_security, sol_acceptance, sol_architecture_security, sol_phase_gate |

## Detailed implementation plan

### HW12-01 — 建立真实负载、容量与成本模型

| Field | Value |
| --- | --- |
| Primary owner | `terra_reviewer` |
| Supporting agents | `luna_inventory`, `terra_tester` |
| Mode | `read-only` |
| Parallel group | `A` |
| Risk | `high` |
| Task dependencies | — |
| Acceptance tier | `sol-acceptance` |
| Acceptance agents | `terra_reviewer`, `sol_acceptance` |
| Required acceptance outcome | `ACCEPT` |

**Allowed paths**

- `evidence/HW-11/**`
- `docs/capacity/**`
- `scripts/load/**`

**Objective**

根据试点实际测量用户、连接、事件、API、数据库、附件和 Agent 负载，不用猜测代替。

**Implementation steps**

- 定义日常峰值、突发、长连接、批量事件和慢上游模型。
- 区分 2,000 用户目标和未来扩展。
- 列出假设、数据源、置信度和安全余量。
- 估算模型调用成本和降级策略。

**Validation**

- metric source audit
- load model reproducibility

**Acceptance**

- 每个容量数字有来源
- 人工确认假设

**Independent acceptance procedure**

- Implementation/testing agents finish and return exact commands, evidence and limitations.
- The parent inspects the actual integrated diff before spawning acceptance agents.
- Run the agents listed in `Acceptance agents` against the same final commit/tree digest.
- Required Sol outcomes are advisory but mandatory evidence for the parent Gate.
- A Sol `REJECT`, `BLOCKED` or missing required report prevents task acceptance.
- Acceptance agents are read-only and never fix the task they review.

**Evidence**

- capacity-model.json
- acceptance report(s) bound to the final source/result commit

**Stop immediately if**

- 需要修改未在 allowed_paths 中声明的路径
- 需要改变已接受 ADR、身份/Session、授权/Scope、TLS、原生权限或数据所有权边界
- 需要新增生产依赖、破坏性数据库操作或对外部系统写入，但任务未明确授权
- 当前工作树包含无法归属的用户修改；若本任务主动采用可选旧源，则该旧源无法绑定固定 commit

### HW12-02 — 优化 PostgreSQL Pool、查询与 HA

| Field | Value |
| --- | --- |
| Primary owner | `parent_codex` |
| Supporting agents | `terra_worker`, `terra_tester`, `terra_security` |
| Mode | `workspace-write` |
| Parallel group | `B` |
| Risk | `critical` |
| Task dependencies | `HW12-01` |
| Acceptance tier | `sol-architecture-security` |
| Acceptance agents | `terra_reviewer`, `terra_security`, `sol_architecture_security` |
| Required acceptance outcome | `ACCEPT` |

**Allowed paths**

- `packages/postgres-core/**`
- `packages/database-runtime/**`
- `database/**`
- `infrastructure/postgresql/**`
- `scripts/load/db/**`

**Objective**

先优化连接持有、事务和查询，再选择 PgBouncer/复制/故障切换方案。

**Implementation steps**

- 测量 pool wait、transaction duration、slow query 和 lock。
- 修复 N+1/长事务/错误连接生命周期。
- 验证 backup/PITR/failover/RTO/RPO。
- 故障切换保持 migration/repository ownership。
- 不通过无限增大 pool 掩盖问题。

**Validation**

- load/soak
- failover
- consistency
- backup restore

**Acceptance**

- 无不可控 waiter 增长
- 数据一致且可恢复

**Independent acceptance procedure**

- Implementation/testing agents finish and return exact commands, evidence and limitations.
- The parent inspects the actual integrated diff before spawning acceptance agents.
- Run the agents listed in `Acceptance agents` against the same final commit/tree digest.
- Required Sol outcomes are advisory but mandatory evidence for the parent Gate.
- A Sol `REJECT`, `BLOCKED` or missing required report prevents task acceptance.
- Acceptance agents are read-only and never fix the task they review.

**Evidence**

- postgres-ha-receipt.json
- acceptance report(s) bound to the final source/result commit

**Stop immediately if**

- 需要修改未在 allowed_paths 中声明的路径
- 需要改变已接受 ADR、身份/Session、授权/Scope、TLS、原生权限或数据所有权边界
- 需要新增生产依赖、破坏性数据库操作或对外部系统写入，但任务未明确授权
- 当前工作树包含无法归属的用户修改；若本任务主动采用可选旧源，则该旧源无法绑定固定 commit

### HW12-03 — 实现 Redis Session 与 Queue HA

| Field | Value |
| --- | --- |
| Primary owner | `parent_codex` |
| Supporting agents | `terra_worker`, `terra_tester`, `terra_security` |
| Mode | `workspace-write` |
| Parallel group | `B` |
| Risk | `critical` |
| Task dependencies | `HW12-01` |
| Acceptance tier | `sol-architecture-security` |
| Acceptance agents | `terra_reviewer`, `terra_security`, `sol_architecture_security` |
| Required acceptance outcome | `ACCEPT` |

**Allowed paths**

- `packages/redis-core/**`
- `infrastructure/redis/**`
- `services/gateway/src/session/**`
- `services/agent-gateway/src/queue/**`

**Objective**

在不改变 Redis Session 唯一权威和 fail-closed 的前提下实现批准的 HA。

**Implementation steps**

- 评估 Sentinel/Cluster/批准托管方案。
- 验证 Session family、revocation、authz version 和 queue claim。
- 故障时不回退内存/PostgreSQL。
- 处理 split-brain、stale replica、重认证和任务重复。

**Validation**

- failover
- session revoke
- split-brain prevention
- queue dedup

**Acceptance**

- 故障切换不恢复已撤销 Session
- Agent Task 不重复副作用

**Independent acceptance procedure**

- Implementation/testing agents finish and return exact commands, evidence and limitations.
- The parent inspects the actual integrated diff before spawning acceptance agents.
- Run the agents listed in `Acceptance agents` against the same final commit/tree digest.
- Required Sol outcomes are advisory but mandatory evidence for the parent Gate.
- A Sol `REJECT`, `BLOCKED` or missing required report prevents task acceptance.
- Acceptance agents are read-only and never fix the task they review.

**Evidence**

- redis-ha-receipt.json
- acceptance report(s) bound to the final source/result commit

**Stop immediately if**

- 需要修改未在 allowed_paths 中声明的路径
- 需要改变已接受 ADR、身份/Session、授权/Scope、TLS、原生权限或数据所有权边界
- 需要新增生产依赖、破坏性数据库操作或对外部系统写入，但任务未明确授权
- 当前工作树包含无法归属的用户修改；若本任务主动采用可选旧源，则该旧源无法绑定固定 commit

### HW12-04 — Collaboration 多实例与 SSE 横向扩展

| Field | Value |
| --- | --- |
| Primary owner | `parent_codex` |
| Supporting agents | `terra_worker`, `terra_tester`, `terra_reviewer` |
| Mode | `workspace-write` |
| Parallel group | `C` |
| Risk | `critical` |
| Task dependencies | `HW12-01`, `HW12-03` |
| Acceptance tier | `sol-architecture-security` |
| Acceptance agents | `terra_reviewer`, `terra_security`, `sol_architecture_security` |
| Required acceptance outcome | `ACCEPT` |

**Allowed paths**

- `services/collaboration/**`
- `infrastructure/collaboration/**`
- `scripts/load/collaboration/**`

**Objective**

让连接局部、事件共享、重放持久，实例故障不造成事件缺口或未读不一致。

**Implementation steps**

- 连接由实例持有，事件/游标/Inbox 在共享持久层。
- PubSub/stream 只做唤醒，不是唯一事件真相。
- 客户端重连不依赖 sticky correctness。
- 杀死实例后通过 gap recovery 恢复。

**Validation**

- multi-instance load
- kill instance
- duplicate/gap
- unread consistency

**Acceptance**

- 实例故障后最终一致
- 可回滚单实例

**Independent acceptance procedure**

- Implementation/testing agents finish and return exact commands, evidence and limitations.
- The parent inspects the actual integrated diff before spawning acceptance agents.
- Run the agents listed in `Acceptance agents` against the same final commit/tree digest.
- Required Sol outcomes are advisory but mandatory evidence for the parent Gate.
- A Sol `REJECT`, `BLOCKED` or missing required report prevents task acceptance.
- Acceptance agents are read-only and never fix the task they review.

**Evidence**

- collaboration-scale-receipt.json
- acceptance report(s) bound to the final source/result commit

**Stop immediately if**

- 需要修改未在 allowed_paths 中声明的路径
- 需要改变已接受 ADR、身份/Session、授权/Scope、TLS、原生权限或数据所有权边界
- 需要新增生产依赖、破坏性数据库操作或对外部系统写入，但任务未明确授权
- 当前工作树包含无法归属的用户修改；若本任务主动采用可选旧源，则该旧源无法绑定固定 commit

### HW12-05 — Agent、Knowledge 与附件容量治理

| Field | Value |
| --- | --- |
| Primary owner | `terra_worker` |
| Supporting agents | `terra_tester`, `terra_security` |
| Mode | `workspace-write` |
| Parallel group | `C` |
| Risk | `high` |
| Task dependencies | `HW12-01` |
| Acceptance tier | `sol-acceptance` |
| Acceptance agents | `terra_reviewer`, `sol_acceptance` |
| Required acceptance outcome | `ACCEPT` |

**Allowed paths**

- `services/agent-gateway/**`
- `services/knowledge/**`
- `infrastructure/storage/**`
- `scripts/load/agent/**`

**Objective**

建立并发、队列、模型预算、索引重建、附件配额和降级。

**Implementation steps**

- 按用户/科室/场景设置 Agent 并发和 Token 预算。
- 队列背压、取消和低优先级延迟。
- 知识索引可重建，附件生命周期/配额/清理。
- 模型不可用时人工/规则降级。

**Validation**

- load/soak
- budget limit
- provider outage
- index rebuild
- storage quota

**Acceptance**

- 高负载不拖垮确定性业务
- 降级可见可审计

**Independent acceptance procedure**

- Implementation/testing agents finish and return exact commands, evidence and limitations.
- The parent inspects the actual integrated diff before spawning acceptance agents.
- Run the agents listed in `Acceptance agents` against the same final commit/tree digest.
- Required Sol outcomes are advisory but mandatory evidence for the parent Gate.
- A Sol `REJECT`, `BLOCKED` or missing required report prevents task acceptance.
- Acceptance agents are read-only and never fix the task they review.

**Evidence**

- agent-knowledge-capacity-report.json
- acceptance report(s) bound to the final source/result commit

**Stop immediately if**

- 需要修改未在 allowed_paths 中声明的路径
- 需要改变已接受 ADR、身份/Session、授权/Scope、TLS、原生权限或数据所有权边界
- 需要新增生产依赖、破坏性数据库操作或对外部系统写入，但任务未明确授权
- 当前工作树包含无法归属的用户修改；若本任务主动采用可选旧源，则该旧源无法绑定固定 commit

### HW12-06 — 实现 Server/Workspace/Desktop 分环灰度

| Field | Value |
| --- | --- |
| Primary owner | `parent_codex` |
| Supporting agents | `terra_worker`, `terra_tester`, `terra_security` |
| Mode | `workspace-write` |
| Parallel group | `D` |
| Risk | `critical` |
| Task dependencies | `HW12-02`, `HW12-03`, `HW12-04` |
| Acceptance tier | `sol-architecture-security` |
| Acceptance agents | `terra_reviewer`, `terra_security`, `sol_architecture_security` |
| Required acceptance outcome | `ACCEPT` |

**Allowed paths**

- `services/gateway/src/registry/releases/**`
- `infrastructure/releases/**`
- `apps/desktop-shell/**`
- `docs/ops/release-rings.md`

**Objective**

分别管理服务端、Workspace 静态 release 和 Desktop Runtime 版本兼容，支持试点/科室/院区分环。

**Implementation steps**

- Capability/Workspace release 声明 min/max Desktop Runtime 和 API contract version。
- Gateway 按 ring 选择 approved release。
- 不兼容组合 fail-closed 并提供升级提示/浏览器降级入口。
- 每环有观察期、自动停止条件和回滚。

**Validation**

- version skew
- ring rollout
- rollback
- offline/stale client

**Acceptance**

- 不可兼容版本不被运行
- 回滚不需重装全部组件

**Independent acceptance procedure**

- Implementation/testing agents finish and return exact commands, evidence and limitations.
- The parent inspects the actual integrated diff before spawning acceptance agents.
- Run the agents listed in `Acceptance agents` against the same final commit/tree digest.
- Required Sol outcomes are advisory but mandatory evidence for the parent Gate.
- A Sol `REJECT`, `BLOCKED` or missing required report prevents task acceptance.
- Acceptance agents are read-only and never fix the task they review.

**Evidence**

- release-ring-receipt.json
- acceptance report(s) bound to the final source/result commit

**Stop immediately if**

- 需要修改未在 allowed_paths 中声明的路径
- 需要改变已接受 ADR、身份/Session、授权/Scope、TLS、原生权限或数据所有权边界
- 需要新增生产依赖、破坏性数据库操作或对外部系统写入，但任务未明确授权
- 当前工作树包含无法归属的用户修改；若本任务主动采用可选旧源，则该旧源无法绑定固定 commit

### HW12-07 — 生产 SLO、责任与持续治理

| Field | Value |
| --- | --- |
| Primary owner | `luna_docs` |
| Supporting agents | `terra_reviewer`, `terra_security` |
| Mode | `workspace-write` |
| Parallel group | `E` |
| Risk | `high` |
| Task dependencies | `HW12-01` |
| Acceptance tier | `sol-acceptance` |
| Acceptance agents | `terra_reviewer`, `sol_acceptance` |
| Required acceptance outcome | `ACCEPT` |

**Allowed paths**

- `docs/ops/**`
- `docs/governance/**`
- `infrastructure/monitoring/**`

**Objective**

明确 1～2 人团队可持续维护的值守、升级、审计、风险、数据保留和变更流程。

**Implementation steps**

- 定义服务/客户端 SLO、告警优先级和响应责任。
- 制定月度容量、权限、证书、依赖、模型和知识审校复核。
- 高风险变更 owner/reviewer 分离。
- 记录停机和 Web fallback 策略。

**Validation**

- runbook tabletop
- on-call scenario
- governance audit

**Acceptance**

- 运行责任明确
- 计划不依赖单个 Agent 或个人隐性知识

**Independent acceptance procedure**

- Implementation/testing agents finish and return exact commands, evidence and limitations.
- The parent inspects the actual integrated diff before spawning acceptance agents.
- Run the agents listed in `Acceptance agents` against the same final commit/tree digest.
- Required Sol outcomes are advisory but mandatory evidence for the parent Gate.
- A Sol `REJECT`, `BLOCKED` or missing required report prevents task acceptance.
- Acceptance agents are read-only and never fix the task they review.

**Evidence**

- production-operations-charter.md
- acceptance report(s) bound to the final source/result commit

**Stop immediately if**

- 需要修改未在 allowed_paths 中声明的路径
- 需要改变已接受 ADR、身份/Session、授权/Scope、TLS、原生权限或数据所有权边界
- 需要新增生产依赖、破坏性数据库操作或对外部系统写入，但任务未明确授权
- 当前工作树包含无法归属的用户修改；若本任务主动采用可选旧源，则该旧源无法绑定固定 commit

### HW12-08 — G12-PRODUCTION 最终人工决议

| Field | Value |
| --- | --- |
| Primary owner | `parent_codex` |
| Supporting agents | `terra_reviewer`, `terra_security` |
| Mode | `read-only` |
| Parallel group | `F` |
| Risk | `critical` |
| Task dependencies | `HW12-02`, `HW12-03`, `HW12-04`, `HW12-05`, `HW12-06`, `HW12-07` |
| Acceptance tier | `sol-phase-gate` |
| Acceptance agents | `terra_reviewer`, `terra_security`, `sol_acceptance`, `sol_architecture_security`, `sol_phase_gate` |
| Required acceptance outcome | `PASS_RECOMMENDED` |

**Allowed paths**

- `evidence/**`
- `docs/program/**`
- `docs/ops/**`
- `docs/capacity/**`

**Objective**

核对所有试点、容量、HA、发布、恢复、安全和运营证据，给出全院生产 GO/NO-GO 建议。

**Implementation steps**

- 关闭所有 expansion blockers。
- 确认压测代表真实模型而非空转。
- 确认 HA 未改变 Session/业务权威。
- 人工签署并定义推广环和回滚条件。

**Validation**

- evidence audit
- independent security/operations review

**Acceptance**

- P0/P1 为零
- 医院授权负责人签署后方可全院推广

**Independent acceptance procedure**

- Implementation/testing agents finish and return exact commands, evidence and limitations.
- The parent inspects the actual integrated diff before spawning acceptance agents.
- Run the agents listed in `Acceptance agents` against the same final commit/tree digest.
- Required Sol outcomes are advisory but mandatory evidence for the parent Gate.
- A Sol `REJECT`, `BLOCKED` or missing required report prevents task acceptance.
- Acceptance agents are read-only and never fix the task they review.

**Evidence**

- G12-PRODUCTION-gate-decision.md
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
7. Run the phase-level Sol agents: `sol_acceptance`, `sol_architecture_security`, `sol_phase_gate`.
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
docs/program/phases/HW-12-scale-ha-production.md and docs/program/tasks/HW-12.yaml.

Execute only HW-12. Use Luna for narrow discovery/docs/fixtures, Terra for bounded implementation/testing/review,
and the task matrix's Sol route for independent acceptance. Run the phase-level Sol Gate agents only after the
final integrated diff and evidence are frozen. Parent Codex makes the final Gate decision.
Do not begin the next phase, push, merge, release or change external systems without explicit authorization.
```
