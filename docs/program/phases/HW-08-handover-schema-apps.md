# HW-08 — 临床交班与声明式轻应用

## Goal

迁移交班为高敏感、多字段、版本化工作项，并建立不执行远程 JavaScript 的 Schema App DSL，承载通知确认、巡检、值班登记等轻量需求。

## Dependencies

`HW-05`, `HW-07`

A dependent phase must be `PASS`. `CONDITIONAL` does not automatically authorize this phase.

## Deliverables

- `services/handover` 与 `handover-contracts`
- 交班 Workspace Capability
- `schema-app-contracts` 与白名单 Renderer
- 签名/版本化 Schema App Release
- 至少一个 synthetic 轻应用
- 临床隐私和并发编辑 Gate

## Out of scope

- 低代码可视化编辑器
- 服务端下发任意 JS/CSS/HTML
- 病历编辑或医嘱执行
- 所有旧小程序一次迁移

## Phase acceptance

- 交班正文按科室/角色/Scope 保护并有版本历史
- 并发修订和确认可审计
- Schema DSL 无任意 JS/HTML/URL 执行能力
- Schema App release 签名、哈希、版本和回滚通过
- 至少一个 synthetic 轻应用完整运行

## Gates

- G08-1 交班领域与临床隐私
- G08-2 并发编辑/确认/版本
- G08-3 Schema DSL 安全
- G08-4 签名发布与回滚
- G08-5 轻应用不绕过领域服务

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
| `HW08-01` | 定义 Handover Contracts 与敏感度模型 | `terra_contracts` | luna_fixtures, terra_security | `critical` | `A` | `sol-architecture-security` | terra_reviewer, terra_security, sol_architecture_security |
| `HW08-02` | 实现 Handover Service | `parent_codex` | terra_worker, terra_tester, terra_security | `critical` | `B` | `sol-architecture-security` | terra_reviewer, terra_security, sol_architecture_security |
| `HW08-03` | 实现 Handover WorkItem 与 Workspace Capability | `terra_worker` | terra_browser, terra_tester | `high` | `C` | `sol-acceptance` | terra_reviewer, sol_acceptance |
| `HW08-04` | 定义 Schema App DSL v1 | `terra_contracts` | luna_fixtures, terra_security | `high` | `A` | `sol-acceptance` | terra_reviewer, sol_acceptance |
| `HW08-05` | 实现 Schema Renderer 与 Data Binding | `terra_worker` | terra_tester, terra_browser | `high` | `D` | `sol-acceptance` | terra_reviewer, sol_acceptance |
| `HW08-06` | 实现 Schema App 签名发布与回滚 | `parent_codex` | terra_worker, terra_tester, terra_security | `critical` | `E` | `sol-architecture-security` | terra_reviewer, terra_security, sol_architecture_security |
| `HW08-07` | 交付首个 Synthetic Schema App | `luna_fixtures` | terra_worker, terra_tester | `medium` | `F` | `terra` | terra_reviewer |
| `HW08-08` | Handover & Schema App Gate | `parent_codex` | terra_reviewer, terra_security | `critical` | `G` | `sol-phase-gate` | terra_reviewer, terra_security, sol_architecture_security, sol_phase_gate |

## Detailed implementation plan

### HW08-01 — 定义 Handover Contracts 与敏感度模型

| Field | Value |
| --- | --- |
| Primary owner | `terra_contracts` |
| Supporting agents | `luna_fixtures`, `terra_security` |
| Mode | `workspace-write` |
| Parallel group | `A` |
| Risk | `critical` |
| Task dependencies | — |
| Acceptance tier | `sol-architecture-security` |
| Acceptance agents | `terra_reviewer`, `terra_security`, `sol_architecture_security` |
| Required acceptance outcome | `ACCEPT` |

**Allowed paths**

- `packages/handover-contracts/**`
- `packages/card-protocol/**`
- `packages/hub-contracts/**`

**Objective**

定义班次、科室、交班条目、风险等级、确认、修订、版本和最小通知投影。

**Implementation steps**

- 区分 shift/session/item/acknowledgement/revision。
- ContextRef 可引用患者/床位/事件，但正文默认高敏感。
- 通知只显示“有交班待处理”，不含患者姓名/诊断。
- 定义并发修订、过期班次和撤回规则。

**Validation**

- contract/state tests
- redaction
- version conflict

**Acceptance**

- 临床正文不会进入 Hub 通用摘要
- 确认与修订可审计

**Independent acceptance procedure**

- Implementation/testing agents finish and return exact commands, evidence and limitations.
- The parent inspects the actual integrated diff before spawning acceptance agents.
- Run the agents listed in `Acceptance agents` against the same final commit/tree digest.
- Required Sol outcomes are advisory but mandatory evidence for the parent Gate.
- A Sol `REJECT`, `BLOCKED` or missing required report prevents task acceptance.
- Acceptance agents are read-only and never fix the task they review.

**Evidence**

- handover-contract-snapshot.json
- acceptance report(s) bound to the final source/result commit

**Stop immediately if**

- 需要修改未在 allowed_paths 中声明的路径
- 需要改变已接受 ADR、身份/Session、授权/Scope、TLS、原生权限或数据所有权边界
- 需要新增生产依赖、破坏性数据库操作或对外部系统写入，但任务未明确授权
- 当前工作树包含无法归属的用户修改；若本任务主动采用可选旧源，则该旧源无法绑定固定 commit

### HW08-02 — 实现 Handover Service

| Field | Value |
| --- | --- |
| Primary owner | `parent_codex` |
| Supporting agents | `terra_worker`, `terra_tester`, `terra_security` |
| Mode | `workspace-write` |
| Parallel group | `B` |
| Risk | `critical` |
| Task dependencies | `HW08-01` |
| Acceptance tier | `sol-architecture-security` |
| Acceptance agents | `terra_reviewer`, `terra_security`, `sol_architecture_security` |
| Required acceptance outcome | `ACCEPT` |

**Allowed paths**

- `services/handover/**`
- `database/prisma/models/handover.prisma`

**Objective**

实现独立交班服务、版本控制、权限/Scope、Outbox 和审计。

**Implementation steps**

- 新建 handover schema/migration，不复制 legacy migration。
- 按科室/班次/角色验证读取和确认。
- 修订使用 expectedVersion，保留历史版本。
- 正文加密/数据库 TLS/日志脱敏策略明确。
- 锁屏/换人后客户端不得保留正文。

**Validation**

- service integration
- scope matrix
- concurrent edit
- history/audit
- rebuild

**Acceptance**

- 无越权跨科室读取
- 历史修订不可覆盖

**Independent acceptance procedure**

- Implementation/testing agents finish and return exact commands, evidence and limitations.
- The parent inspects the actual integrated diff before spawning acceptance agents.
- Run the agents listed in `Acceptance agents` against the same final commit/tree digest.
- Required Sol outcomes are advisory but mandatory evidence for the parent Gate.
- A Sol `REJECT`, `BLOCKED` or missing required report prevents task acceptance.
- Acceptance agents are read-only and never fix the task they review.

**Evidence**

- handover-service-report.md
- acceptance report(s) bound to the final source/result commit

**Stop immediately if**

- 需要修改未在 allowed_paths 中声明的路径
- 需要改变已接受 ADR、身份/Session、授权/Scope、TLS、原生权限或数据所有权边界
- 需要新增生产依赖、破坏性数据库操作或对外部系统写入，但任务未明确授权
- 当前工作树包含无法归属的用户修改；若本任务主动采用可选旧源，则该旧源无法绑定固定 commit

### HW08-03 — 实现 Handover WorkItem 与 Workspace Capability

| Field | Value |
| --- | --- |
| Primary owner | `terra_worker` |
| Supporting agents | `terra_browser`, `terra_tester` |
| Mode | `workspace-write` |
| Parallel group | `C` |
| Risk | `high` |
| Task dependencies | `HW08-02` |
| Acceptance tier | `sol-acceptance` |
| Acceptance agents | `terra_reviewer`, `sol_acceptance` |
| Required acceptance outcome | `ACCEPT` |

**Allowed paths**

- `services/collaboration/src/mappings/handover/**`
- `apps/workspace-web/src/capabilities/handover/**`

**Objective**

按班次和科室形成空间/线程/工作项，详情在受控 Canvas 中处理。

**Implementation steps**

- 交班待确认产生 Todo，确认/过期关闭。
- 线程展示版本、作者、确认、修订和系统事件。
- 正文只在详情 Canvas 加载，不进入通用 timeline summary。
- 切换线程/锁屏主动清除敏感缓存。

**Validation**

- projection replay
- UI privacy
- switch-person
- concurrent conflict

**Acceptance**

- 护士/医生可完成班次交接
- 敏感正文最小驻留

**Independent acceptance procedure**

- Implementation/testing agents finish and return exact commands, evidence and limitations.
- The parent inspects the actual integrated diff before spawning acceptance agents.
- Run the agents listed in `Acceptance agents` against the same final commit/tree digest.
- Required Sol outcomes are advisory but mandatory evidence for the parent Gate.
- A Sol `REJECT`, `BLOCKED` or missing required report prevents task acceptance.
- Acceptance agents are read-only and never fix the task they review.

**Evidence**

- handover-capability-evidence.md
- acceptance report(s) bound to the final source/result commit

**Stop immediately if**

- 需要修改未在 allowed_paths 中声明的路径
- 需要改变已接受 ADR、身份/Session、授权/Scope、TLS、原生权限或数据所有权边界
- 需要新增生产依赖、破坏性数据库操作或对外部系统写入，但任务未明确授权
- 当前工作树包含无法归属的用户修改；若本任务主动采用可选旧源，则该旧源无法绑定固定 commit

### HW08-04 — 定义 Schema App DSL v1

| Field | Value |
| --- | --- |
| Primary owner | `terra_contracts` |
| Supporting agents | `luna_fixtures`, `terra_security` |
| Mode | `workspace-write` |
| Parallel group | `A` |
| Risk | `high` |
| Task dependencies | — |
| Acceptance tier | `sol-acceptance` |
| Acceptance agents | `terra_reviewer`, `sol_acceptance` |
| Required acceptance outcome | `ACCEPT` |

**Allowed paths**

- `packages/schema-app-contracts/**`

**Objective**

建立声明式 Form/List/Table/Timeline/Detail/Approval 轻应用协议，禁止任意代码和任意 endpoint。

**Implementation steps**

- 组件、字段、验证、数据源和动作均使用白名单 ID。
- Action 只能映射 Capability Registry 注册的 command。
- 禁止 raw HTML、eval、new Function、remote module、inline script/style。
- 定义 sensitivity、permission、scope、minRuntime、schemaVersion。
- 提供 XSS/URL/oversize/fuzz fixtures。

**Validation**

- schema fuzz
- XSS fixtures
- unknown component/action
- arbitrary URL

**Acceptance**

- DSL 无法表达任意代码执行
- 未知内容 fail-closed

**Independent acceptance procedure**

- Implementation/testing agents finish and return exact commands, evidence and limitations.
- The parent inspects the actual integrated diff before spawning acceptance agents.
- Run the agents listed in `Acceptance agents` against the same final commit/tree digest.
- Required Sol outcomes are advisory but mandatory evidence for the parent Gate.
- A Sol `REJECT`, `BLOCKED` or missing required report prevents task acceptance.
- Acceptance agents are read-only and never fix the task they review.

**Evidence**

- schema-app-v1.json
- acceptance report(s) bound to the final source/result commit

**Stop immediately if**

- 需要修改未在 allowed_paths 中声明的路径
- 需要改变已接受 ADR、身份/Session、授权/Scope、TLS、原生权限或数据所有权边界
- 需要新增生产依赖、破坏性数据库操作或对外部系统写入，但任务未明确授权
- 当前工作树包含无法归属的用户修改；若本任务主动采用可选旧源，则该旧源无法绑定固定 commit

### HW08-05 — 实现 Schema Renderer 与 Data Binding

| Field | Value |
| --- | --- |
| Primary owner | `terra_worker` |
| Supporting agents | `terra_tester`, `terra_browser` |
| Mode | `workspace-write` |
| Parallel group | `D` |
| Risk | `high` |
| Task dependencies | `HW08-04`, `HW05-05` |
| Acceptance tier | `sol-acceptance` |
| Acceptance agents | `terra_reviewer`, `sol_acceptance` |
| Required acceptance outcome | `ACCEPT` |

**Allowed paths**

- `apps/workspace-web/src/schema-runtime/**`
- `packages/ui/**`
- `packages/capability-sdk/**`

**Objective**

渲染经验证 Schema，并通过受控 API/Command Dispatcher 加载数据和执行动作。

**Implementation steps**

- Renderer 只消费解析后的 typed schema。
- 统一 loading/error/empty/permission/validation。
- 数据源只引用 Registry 名称，不接受 URL。
- 字段敏感度控制显示、缓存和日志。
- 未知组件显示不可操作错误，不猜测。

**Validation**

- component matrix
- CSP/XSS
- permission
- unknown schema
- a11y

**Acceptance**

- 无 direct arbitrary fetch
- Schema App 与内置 Capability 共享身份/事件/卡片体验

**Independent acceptance procedure**

- Implementation/testing agents finish and return exact commands, evidence and limitations.
- The parent inspects the actual integrated diff before spawning acceptance agents.
- Run the agents listed in `Acceptance agents` against the same final commit/tree digest.
- Required Sol outcomes are advisory but mandatory evidence for the parent Gate.
- A Sol `REJECT`, `BLOCKED` or missing required report prevents task acceptance.
- Acceptance agents are read-only and never fix the task they review.

**Evidence**

- schema-renderer-report.md
- acceptance report(s) bound to the final source/result commit

**Stop immediately if**

- 需要修改未在 allowed_paths 中声明的路径
- 需要改变已接受 ADR、身份/Session、授权/Scope、TLS、原生权限或数据所有权边界
- 需要新增生产依赖、破坏性数据库操作或对外部系统写入，但任务未明确授权
- 当前工作树包含无法归属的用户修改；若本任务主动采用可选旧源，则该旧源无法绑定固定 commit

### HW08-06 — 实现 Schema App 签名发布与回滚

| Field | Value |
| --- | --- |
| Primary owner | `parent_codex` |
| Supporting agents | `terra_worker`, `terra_tester`, `terra_security` |
| Mode | `workspace-write` |
| Parallel group | `E` |
| Risk | `critical` |
| Task dependencies | `HW08-04`, `HW02-06` |
| Acceptance tier | `sol-architecture-security` |
| Acceptance agents | `terra_reviewer`, `terra_security`, `sol_architecture_security` |
| Required acceptance outcome | `ACCEPT` |

**Allowed paths**

- `services/gateway/src/registry/schema-apps/**`
- `database/prisma/models/config.prisma`
- `scripts/release/schema-apps/**`

**Objective**

只有经审批、哈希和签名的 immutable Schema App release 才能进入 Registry。

**Implementation steps**

- release 绑定 schema hash、capability、permissions、minRuntime、signer、status。
- 批准前静态校验 DSL、数据源、命令和敏感度。
- Registry 指向 approved release，支持上一版本回滚。
- 未签名、未知 signer、篡改、过期或版本不兼容拒绝。

**Validation**

- tamper/signature
- unknown signer
- rollback
- runtime version mismatch

**Acceptance**

- 无法静默替换轻应用
- 发布和回滚可审计

**Independent acceptance procedure**

- Implementation/testing agents finish and return exact commands, evidence and limitations.
- The parent inspects the actual integrated diff before spawning acceptance agents.
- Run the agents listed in `Acceptance agents` against the same final commit/tree digest.
- Required Sol outcomes are advisory but mandatory evidence for the parent Gate.
- A Sol `REJECT`, `BLOCKED` or missing required report prevents task acceptance.
- Acceptance agents are read-only and never fix the task they review.

**Evidence**

- schema-app-release-receipt.json
- acceptance report(s) bound to the final source/result commit

**Stop immediately if**

- 需要修改未在 allowed_paths 中声明的路径
- 需要改变已接受 ADR、身份/Session、授权/Scope、TLS、原生权限或数据所有权边界
- 需要新增生产依赖、破坏性数据库操作或对外部系统写入，但任务未明确授权
- 当前工作树包含无法归属的用户修改；若本任务主动采用可选旧源，则该旧源无法绑定固定 commit

### HW08-07 — 交付首个 Synthetic Schema App

| Field | Value |
| --- | --- |
| Primary owner | `luna_fixtures` |
| Supporting agents | `terra_worker`, `terra_tester` |
| Mode | `workspace-write` |
| Parallel group | `F` |
| Risk | `medium` |
| Task dependencies | `HW08-05`, `HW08-06` |
| Acceptance tier | `terra` |
| Acceptance agents | `terra_reviewer` |
| Required acceptance outcome | `APPROVED` |

**Allowed paths**

- `examples/schema-apps/**`
- `apps/workspace-web/e2e/schema-apps/**`

**Objective**

用非敏感的设备巡检或通知确认验证 DSL，不迁移旧业务。

**Implementation steps**

- 定义表单、列表、状态和确认动作。
- 通过测试域服务/fixture command，不使用任意 endpoint。
- 覆盖版本更新和回滚。
- 生产 Registry 仅在明确批准时启用。

**Validation**

- schema validation
- E2E
- upgrade/rollback
- production absence

**Acceptance**

- 完整轻应用不新增前端工程
- 无敏感真实数据

**Independent acceptance procedure**

- Implementation/testing agents finish and return exact commands, evidence and limitations.
- The parent inspects the actual integrated diff before spawning acceptance agents.
- Run the agents listed in `Acceptance agents` against the same final commit/tree digest.
- Required Sol outcomes are advisory but mandatory evidence for the parent Gate.
- A Sol `REJECT`, `BLOCKED` or missing required report prevents task acceptance.
- Acceptance agents are read-only and never fix the task they review.

**Evidence**

- schema-app-demo-evidence.md
- acceptance report(s) bound to the final source/result commit

**Stop immediately if**

- 需要修改未在 allowed_paths 中声明的路径
- 需要改变已接受 ADR、身份/Session、授权/Scope、TLS、原生权限或数据所有权边界
- 需要新增生产依赖、破坏性数据库操作或对外部系统写入，但任务未明确授权
- 当前工作树包含无法归属的用户修改；若本任务主动采用可选旧源，则该旧源无法绑定固定 commit

### HW08-08 — Handover & Schema App Gate

| Field | Value |
| --- | --- |
| Primary owner | `parent_codex` |
| Supporting agents | `terra_reviewer`, `terra_security` |
| Mode | `read-only` |
| Parallel group | `G` |
| Risk | `critical` |
| Task dependencies | `HW08-02`, `HW08-03`, `HW08-05`, `HW08-06`, `HW08-07` |
| Acceptance tier | `sol-phase-gate` |
| Acceptance agents | `terra_reviewer`, `terra_security`, `sol_architecture_security`, `sol_phase_gate` |
| Required acceptance outcome | `PASS_RECOMMENDED` |

**Allowed paths**

- `services/handover/**`
- `apps/workspace-web/src/capabilities/handover/**`
- `packages/schema-app-contracts/**`
- `apps/workspace-web/src/schema-runtime/**`

**Objective**

确认高敏临床场景和轻应用扩展都未突破安全边界。

**Implementation steps**

- 复核临床隐私、并发、DSL、签名、CSP、Registry 和 rollback。
- 签发 G08。

**Validation**

- full handover/schema suite
- security review

**Acceptance**

- P0/P1 为零
- 轻应用只用于批准的低风险场景

**Independent acceptance procedure**

- Implementation/testing agents finish and return exact commands, evidence and limitations.
- The parent inspects the actual integrated diff before spawning acceptance agents.
- Run the agents listed in `Acceptance agents` against the same final commit/tree digest.
- Required Sol outcomes are advisory but mandatory evidence for the parent Gate.
- A Sol `REJECT`, `BLOCKED` or missing required report prevents task acceptance.
- Acceptance agents are read-only and never fix the task they review.

**Evidence**

- G08-gate-decision.md
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
docs/program/phases/HW-08-handover-schema-apps.md and docs/program/tasks/HW-08.yaml.

Execute only HW-08. Use Luna for narrow discovery/docs/fixtures, Terra for bounded implementation/testing/review,
and the task matrix's Sol route for independent acceptance. Run the phase-level Sol Gate agents only after the
final integrated diff and evidence are frozen. Parent Codex makes the final Gate decision.
Do not begin the next phase, push, merge, release or change external systems without explicit authorization.
```
