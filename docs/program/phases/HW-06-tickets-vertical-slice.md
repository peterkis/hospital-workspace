# HW-06 — 首个真实垂直切片：信息报修与协作工单

## Goal

以报修作为第一个真实领域，验证多人参与、状态机、图片附件、接单/派单/转派、SLA、Incident 合并、Outbox、Work Item、时间线与桌面触达。

## Dependencies

`HW-05`

A dependent phase must be `PASS`. `CONDITIONAL` does not automatically authorize this phase.

## Deliverables

- `services/tickets` 独立领域服务
- `ticket-contracts` 与状态机
- 受控附件服务与审计
- Ticket Outbox/Event/WorkItem mapping
- Workspace Tickets Capability
- 临床用户与工程师多人 E2E
- 内部信息科 MVP Gate

## Out of scope

- LLM 自动报修正式启用
- ITSM 全量资产管理
- 企业微信替换
- 全院试点

## Phase acceptance

- Ticket 状态机、并发接单、SLA 和 Incident 规则通过
- 附件无 IDOR、路径泄漏和 MIME 绕过
- Ticket/Outbox/Event/WorkItem/Timeline 可重放一致
- 临床用户与工程师在 Workspace 完成闭环
- 只批准信息科内部非生产 MVP

## Gates

- G06-1 Ticket 领域权威与状态机
- G06-2 并发/幂等/SLA
- G06-3 附件与敏感数据安全
- G06-4 WorkItem/Timeline 映射
- G06-5 多用户恢复与内部 MVP

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
| `HW06-01` | 审计并白名单抽取 Legacy Ticket Domain | `terra_migrator` | luna_explorer, terra_reviewer | `high` | `A` | `sol-acceptance` | terra_reviewer, sol_acceptance |
| `HW06-02` | 冻结 Ticket Contracts 与状态机 | `terra_contracts` | luna_fixtures, terra_reviewer | `high` | `A` | `sol-acceptance` | terra_reviewer, sol_acceptance |
| `HW06-03` | 实现 Ticket Service 与数据库模型 | `parent_codex` | terra_worker, terra_tester, terra_security | `critical` | `B` | `sol-architecture-security` | terra_reviewer, terra_security, sol_architecture_security |
| `HW06-04` | 实现 Ticket Outbox、事件与 WorkItem Mapping | `terra_worker` | terra_tester, terra_reviewer | `high` | `B` | `sol-acceptance` | terra_reviewer, sol_acceptance |
| `HW06-05` | 实现受控附件链 | `terra_worker` | terra_tester, terra_security | `critical` | `C` | `sol-architecture-security` | terra_reviewer, terra_security, sol_architecture_security |
| `HW06-06` | 实现 Workspace Tickets Capability | `terra_worker` | terra_browser, luna_fixtures | `medium` | `D` | `terra` | terra_reviewer |
| `HW06-07` | 多人并发、故障与恢复 E2E | `terra_tester` | terra_browser, terra_security | `critical` | `E` | `sol-acceptance` | terra_reviewer, terra_security, sol_acceptance |
| `HW06-08` | 信息科内部 MVP Gate | `parent_codex` | terra_reviewer, terra_security | `critical` | `F` | `sol-phase-gate` | terra_reviewer, terra_security, sol_acceptance, sol_phase_gate |

## Detailed implementation plan

### HW06-01 — 审计并白名单抽取 Legacy Ticket Domain

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

- `docs/migration/tickets/**`
- `services/tickets/**`
- `packages/ticket-contracts/**`

**Objective**

按目标 Ticket 契约重新实现状态机、repository、outbox、附件与测试；若配置可选旧源，仅作需求核对和算法提取，拒绝复制 Next UI、页面会话与旧通知入口。

**Implementation steps**

- 生成调用链和文件分类 KEEP/ADAPT/REFERENCE/REJECT。
- 固定 source commit 和每个迁移文件 hash。
- 抽取领域术语、状态、动作、SLA 和 Incident 规则。
- 将旧 Prisma model 作为需求参考，不复制 migration。
- 记录行为差异和需要重新实现的部分。

**Validation**

- source manifest
- behavior fixture extraction
- no Next/UI import scan

**Acceptance**

- 领域规则来源可追溯
- 新服务未依赖 legacy workspace

**Independent acceptance procedure**

- Implementation/testing agents finish and return exact commands, evidence and limitations.
- The parent inspects the actual integrated diff before spawning acceptance agents.
- Run the agents listed in `Acceptance agents` against the same final commit/tree digest.
- Required Sol outcomes are advisory but mandatory evidence for the parent Gate.
- A Sol `REJECT`, `BLOCKED` or missing required report prevents task acceptance.
- Acceptance agents are read-only and never fix the task they review.

**Evidence**

- ticket-migration-plan.yaml
- acceptance report(s) bound to the final source/result commit

**Stop immediately if**

- 需要修改未在 allowed_paths 中声明的路径
- 需要改变已接受 ADR、身份/Session、授权/Scope、TLS、原生权限或数据所有权边界
- 需要新增生产依赖、破坏性数据库操作或对外部系统写入，但任务未明确授权
- 当前工作树包含无法归属的用户修改；若本任务主动采用可选旧源，则该旧源无法绑定固定 commit

### HW06-02 — 冻结 Ticket Contracts 与状态机

| Field | Value |
| --- | --- |
| Primary owner | `terra_contracts` |
| Supporting agents | `luna_fixtures`, `terra_reviewer` |
| Mode | `workspace-write` |
| Parallel group | `A` |
| Risk | `high` |
| Task dependencies | `HW06-01` |
| Acceptance tier | `sol-acceptance` |
| Acceptance agents | `terra_reviewer`, `sol_acceptance` |
| Required acceptance outcome | `ACCEPT` |

**Allowed paths**

- `packages/ticket-contracts/**`
- `packages/card-protocol/**`
- `packages/hub-contracts/**`

**Objective**

定义 Ticket、Incident、Participant、AttachmentRef、SLA、命令、事件和卡片协议。

**Implementation steps**

- 状态至少覆盖 draft/submitted/triaged/assigned/accepted/in_progress/resolved/closed/reopened/cancelled。
- 每个 action 指定 actor、前置状态、权限和输出事件。
- Incident 关联 Intake/Ticket，不删除个人申报留痕。
- Attachment 只暴露 assetRef，不暴露路径。
- 事件注册到 Catalog，通知摘要默认无患者信息。

**Validation**

- transition table
- invalid actor/status
- event/card fixtures
- assetRef validation

**Acceptance**

- 所有状态变化只能由命令产生
- 可表达个人工单与公共故障

**Independent acceptance procedure**

- Implementation/testing agents finish and return exact commands, evidence and limitations.
- The parent inspects the actual integrated diff before spawning acceptance agents.
- Run the agents listed in `Acceptance agents` against the same final commit/tree digest.
- Required Sol outcomes are advisory but mandatory evidence for the parent Gate.
- A Sol `REJECT`, `BLOCKED` or missing required report prevents task acceptance.
- Acceptance agents are read-only and never fix the task they review.

**Evidence**

- ticket-contract-snapshot.json
- acceptance report(s) bound to the final source/result commit

**Stop immediately if**

- 需要修改未在 allowed_paths 中声明的路径
- 需要改变已接受 ADR、身份/Session、授权/Scope、TLS、原生权限或数据所有权边界
- 需要新增生产依赖、破坏性数据库操作或对外部系统写入，但任务未明确授权
- 当前工作树包含无法归属的用户修改；若本任务主动采用可选旧源，则该旧源无法绑定固定 commit

### HW06-03 — 实现 Ticket Service 与数据库模型

| Field | Value |
| --- | --- |
| Primary owner | `parent_codex` |
| Supporting agents | `terra_worker`, `terra_tester`, `terra_security` |
| Mode | `workspace-write` |
| Parallel group | `B` |
| Risk | `critical` |
| Task dependencies | `HW06-02` |
| Acceptance tier | `sol-architecture-security` |
| Acceptance agents | `terra_reviewer`, `terra_security`, `sol_architecture_security` |
| Required acceptance outcome | `ACCEPT` |

**Allowed paths**

- `services/tickets/**`
- `database/prisma/models/ticket.prisma`
- `database/migrations/**`

**Objective**

实现独立 Ticket 领域服务、repository、状态机、权限和审计。

**Implementation steps**

- 新增 ticket schema，生成新 migration，不复制旧历史。
- API/command handler 只接受 Gateway 传递并可验证的 Principal context。
- 每次写入使用 expectedVersion 和 idempotency。
- repository 仅访问 ticket schema，跨域信息通过 API/ContextRef。
- health、graceful stop、DB/Redis dependency 明确。

**Validation**

- service unit/integration
- database migration/rebuild
- permission/scope
- state table

**Acceptance**

- 服务可独立部署
- Workspace/Collaboration 不直接写 ticket 表

**Independent acceptance procedure**

- Implementation/testing agents finish and return exact commands, evidence and limitations.
- The parent inspects the actual integrated diff before spawning acceptance agents.
- Run the agents listed in `Acceptance agents` against the same final commit/tree digest.
- Required Sol outcomes are advisory but mandatory evidence for the parent Gate.
- A Sol `REJECT`, `BLOCKED` or missing required report prevents task acceptance.
- Acceptance agents are read-only and never fix the task they review.

**Evidence**

- ticket-service-report.md
- acceptance report(s) bound to the final source/result commit

**Stop immediately if**

- 需要修改未在 allowed_paths 中声明的路径
- 需要改变已接受 ADR、身份/Session、授权/Scope、TLS、原生权限或数据所有权边界
- 需要新增生产依赖、破坏性数据库操作或对外部系统写入，但任务未明确授权
- 当前工作树包含无法归属的用户修改；若本任务主动采用可选旧源，则该旧源无法绑定固定 commit

### HW06-04 — 实现 Ticket Outbox、事件与 WorkItem Mapping

| Field | Value |
| --- | --- |
| Primary owner | `terra_worker` |
| Supporting agents | `terra_tester`, `terra_reviewer` |
| Mode | `workspace-write` |
| Parallel group | `B` |
| Risk | `high` |
| Task dependencies | `HW06-03`, `HW04-03`, `HW05-03` |
| Acceptance tier | `sol-acceptance` |
| Acceptance agents | `terra_reviewer`, `sol_acceptance` |
| Required acceptance outcome | `ACCEPT` |

**Allowed paths**

- `services/tickets/src/events/**`
- `services/collaboration/src/mappings/tickets/**`

**Objective**

让工单状态与 Outbox 同事务，并确定性投影为线程、工作项、待办和活动。

**Implementation steps**

- 提交/派单/接单/处理/解决/关闭/重开均产生版本事件。
- 为申报人、工程师和管理员分别计算 Inbox/Todo。
- SLA 超时由幂等 scheduler/worker 产生事件。
- Incident 合并保留原 Ticket/Intake 活动。

**Validation**

- outbox crash
- replay mapping
- recipient scope
- SLA retry

**Acceptance**

- 不丢单、不重复接单
- 重放可恢复相同工作项

**Independent acceptance procedure**

- Implementation/testing agents finish and return exact commands, evidence and limitations.
- The parent inspects the actual integrated diff before spawning acceptance agents.
- Run the agents listed in `Acceptance agents` against the same final commit/tree digest.
- Required Sol outcomes are advisory but mandatory evidence for the parent Gate.
- A Sol `REJECT`, `BLOCKED` or missing required report prevents task acceptance.
- Acceptance agents are read-only and never fix the task they review.

**Evidence**

- ticket-event-workitem-receipt.json
- acceptance report(s) bound to the final source/result commit

**Stop immediately if**

- 需要修改未在 allowed_paths 中声明的路径
- 需要改变已接受 ADR、身份/Session、授权/Scope、TLS、原生权限或数据所有权边界
- 需要新增生产依赖、破坏性数据库操作或对外部系统写入，但任务未明确授权
- 当前工作树包含无法归属的用户修改；若本任务主动采用可选旧源，则该旧源无法绑定固定 commit

### HW06-05 — 实现受控附件链

| Field | Value |
| --- | --- |
| Primary owner | `terra_worker` |
| Supporting agents | `terra_tester`, `terra_security` |
| Mode | `workspace-write` |
| Parallel group | `C` |
| Risk | `critical` |
| Task dependencies | `HW06-03` |
| Acceptance tier | `sol-architecture-security` |
| Acceptance agents | `terra_reviewer`, `terra_security`, `sol_architecture_security` |
| Required acceptance outcome | `ACCEPT` |

**Allowed paths**

- `services/tickets/src/attachments/**`
- `packages/asset-contracts/**`
- `infrastructure/storage/**`

**Objective**

支持报修图片和文件，同时防止路径泄漏、MIME 欺骗、跨工单访问和长期公开 URL。

**Implementation steps**

- 创建 upload intent、size/MIME/hash 校验和短时 assetRef。
- 存储可先用 MinIO/S3-compatible；生产 URL 由服务端授权流式或短时签名。
- 文件名归一化，病毒扫描接口保留，失败 quarantine。
- 下载每次验证 Ticket 权限/Scope。
- 事件/日志只记录 assetRef 和安全 metadata。

**Validation**

- malicious filename
- MIME mismatch
- oversize
- cross-ticket IDOR
- replay

**Acceptance**

- 不存在任意文件读写和公开永久链接
- 审计可追踪上传/查看

**Independent acceptance procedure**

- Implementation/testing agents finish and return exact commands, evidence and limitations.
- The parent inspects the actual integrated diff before spawning acceptance agents.
- Run the agents listed in `Acceptance agents` against the same final commit/tree digest.
- Required Sol outcomes are advisory but mandatory evidence for the parent Gate.
- A Sol `REJECT`, `BLOCKED` or missing required report prevents task acceptance.
- Acceptance agents are read-only and never fix the task they review.

**Evidence**

- attachment-security-report.json
- acceptance report(s) bound to the final source/result commit

**Stop immediately if**

- 需要修改未在 allowed_paths 中声明的路径
- 需要改变已接受 ADR、身份/Session、授权/Scope、TLS、原生权限或数据所有权边界
- 需要新增生产依赖、破坏性数据库操作或对外部系统写入，但任务未明确授权
- 当前工作树包含无法归属的用户修改；若本任务主动采用可选旧源，则该旧源无法绑定固定 commit

### HW06-06 — 实现 Workspace Tickets Capability

| Field | Value |
| --- | --- |
| Primary owner | `terra_worker` |
| Supporting agents | `terra_browser`, `luna_fixtures` |
| Mode | `workspace-write` |
| Parallel group | `D` |
| Risk | `medium` |
| Task dependencies | `HW06-02`, `HW06-04`, `HW06-05` |
| Acceptance tier | `terra` |
| Acceptance agents | `terra_reviewer` |
| Required acceptance outcome | `APPROVED` |

**Allowed paths**

- `apps/workspace-web/src/capabilities/tickets/**`
- `packages/ui/**`

**Objective**

用空间、队列、线程、卡片和 Canvas 取代旧报修网页。

**Implementation steps**

- 空间包含我的报修、待接单、处理中、本科室、已完成。
- 每张工单一个线程，时间线显示参与者、状态、附件和系统事件。
- 卡片支持提交、补充、接单、转派、进展、解决、确认/重开。
- 复杂详情和附件在右侧 Canvas。
- 冲突/过期/越权有明确刷新和说明。

**Validation**

- component tests
- a11y
- deep link
- 403/409/expired
- attachment E2E

**Acceptance**

- 用户不离开 Workspace 完成报修闭环
- UI 只展示服务端允许动作

**Independent acceptance procedure**

- Implementation/testing agents finish and return exact commands, evidence and limitations.
- The parent inspects the actual integrated diff before spawning acceptance agents.
- Run the agents listed in `Acceptance agents` against the same final commit/tree digest.
- Required Sol outcomes are advisory but mandatory evidence for the parent Gate.
- A Sol `REJECT`, `BLOCKED` or missing required report prevents task acceptance.
- Acceptance agents are read-only and never fix the task they review.

**Evidence**

- tickets-capability-evidence.md
- acceptance report(s) bound to the final source/result commit

**Stop immediately if**

- 需要修改未在 allowed_paths 中声明的路径
- 需要改变已接受 ADR、身份/Session、授权/Scope、TLS、原生权限或数据所有权边界
- 需要新增生产依赖、破坏性数据库操作或对外部系统写入，但任务未明确授权
- 当前工作树包含无法归属的用户修改；若本任务主动采用可选旧源，则该旧源无法绑定固定 commit

### HW06-07 — 多人并发、故障与恢复 E2E

| Field | Value |
| --- | --- |
| Primary owner | `terra_tester` |
| Supporting agents | `terra_browser`, `terra_security` |
| Mode | `workspace-write` |
| Parallel group | `E` |
| Risk | `critical` |
| Task dependencies | `HW06-04`, `HW06-06` |
| Acceptance tier | `sol-acceptance` |
| Acceptance agents | `terra_reviewer`, `terra_security`, `sol_acceptance` |
| Required acceptance outcome | `ACCEPT` |

**Allowed paths**

- `services/tickets/test/**`
- `apps/workspace-web/e2e/tickets/**`
- `evidence/HW-06/**`

**Objective**

验证临床用户、两个工程师、管理员在并发、断线和服务故障下的一致性。

**Implementation steps**

- 两个工程师同时接单，只允许一个成功。
- relay/Hub 中断、客户端断线、服务重启、附件中断。
- 切换人员、锁屏、撤权和跨科室访问。
- 最终领域状态、工作项和时间线 hash 对账。

**Validation**

- multi-user Playwright
- race tests
- failure injection
- replay hash

**Acceptance**

- 无双接单、状态倒退或跨用户泄漏
- 故障后最终一致

**Independent acceptance procedure**

- Implementation/testing agents finish and return exact commands, evidence and limitations.
- The parent inspects the actual integrated diff before spawning acceptance agents.
- Run the agents listed in `Acceptance agents` against the same final commit/tree digest.
- Required Sol outcomes are advisory but mandatory evidence for the parent Gate.
- A Sol `REJECT`, `BLOCKED` or missing required report prevents task acceptance.
- Acceptance agents are read-only and never fix the task they review.

**Evidence**

- ticket-multiuser-e2e.json
- acceptance report(s) bound to the final source/result commit

**Stop immediately if**

- 需要修改未在 allowed_paths 中声明的路径
- 需要改变已接受 ADR、身份/Session、授权/Scope、TLS、原生权限或数据所有权边界
- 需要新增生产依赖、破坏性数据库操作或对外部系统写入，但任务未明确授权
- 当前工作树包含无法归属的用户修改；若本任务主动采用可选旧源，则该旧源无法绑定固定 commit

### HW06-08 — 信息科内部 MVP Gate

| Field | Value |
| --- | --- |
| Primary owner | `parent_codex` |
| Supporting agents | `terra_reviewer`, `terra_security` |
| Mode | `read-only` |
| Parallel group | `F` |
| Risk | `critical` |
| Task dependencies | `HW06-03`, `HW06-05`, `HW06-07` |
| Acceptance tier | `sol-phase-gate` |
| Acceptance agents | `terra_reviewer`, `terra_security`, `sol_acceptance`, `sol_phase_gate` |
| Required acceptance outcome | `PASS_RECOMMENDED` |

**Allowed paths**

- `services/tickets/**`
- `apps/workspace-web/src/capabilities/tickets/**`
- `services/collaboration/**`

**Objective**

确认第一个真实领域证明新架构可用，但不等于医院试点。

**Implementation steps**

- 复核状态机、并发、附件、权限、Outbox、WorkItem、UI 和恢复。
- 评估信息科小范围 synthetic/非生产内部试用。
- 签发 G06-MVP。

**Validation**

- full ticket suite
- security review
- MVP usability checklist

**Acceptance**

- P0/P1 为零
- 只批准内部非患者敏感 MVP

**Independent acceptance procedure**

- Implementation/testing agents finish and return exact commands, evidence and limitations.
- The parent inspects the actual integrated diff before spawning acceptance agents.
- Run the agents listed in `Acceptance agents` against the same final commit/tree digest.
- Required Sol outcomes are advisory but mandatory evidence for the parent Gate.
- A Sol `REJECT`, `BLOCKED` or missing required report prevents task acceptance.
- Acceptance agents are read-only and never fix the task they review.

**Evidence**

- G06-MVP-gate-decision.md
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
docs/program/phases/HW-06-tickets-vertical-slice.md and docs/program/tasks/HW-06.yaml.

Execute only HW-06. Use Luna for narrow discovery/docs/fixtures, Terra for bounded implementation/testing/review,
and the task matrix's Sol route for independent acceptance. Run the phase-level Sol Gate agents only after the
final integrated diff and evidence are frozen. Parent Codex makes the final Gate decision.
Do not begin the next phase, push, merge, release or change external systems without explicit authorization.
```
