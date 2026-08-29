# HW-09 — Agent Gateway、Coordinator／Worker 与受控协作

## Goal

将 Agent 作为服务端受控 Capability 接入工作项和 Harness：Coordinator 负责任务拆解与汇总，Worker 执行专门任务，所有工具、审批、Handoff、产物和完成状态由系统约束。

## Dependencies

`HW-04`, `HW-05`, `HW-06`

A dependent phase must be `PASS`. `CONDITIONAL` does not automatically authorize this phase.

## Deliverables

- `services/agent-gateway`
- `agent-contracts`、Run/Task/Attempt/Tool/Approval 模型
- Coordinator/Worker Runtime
- 受控 Tool Registry 与权限风险分级
- Harness/Decision/Handoff 集成
- Workspace Agent 协作空间
- 首个低风险报修分诊或知识整理 Agent

## Out of scope

- 客户端本地 Python Agent
- 任意 Shell/SQL/HTTP/文件系统工具
- 自主执行高风险临床/财务写操作
- 模型文本直接改变业务状态

## Phase acceptance

- Coordinator/Worker 的任务、工具、Handoff 和产物可追溯
- Tool Registry 不含 Shell/SQL/任意 HTTP/文件系统
- 写工具有服务端权限和用户审批
- 取消/重启/晚到/重复审批状态正确
- 首个 Agent 保持建议模式，失败不影响确定性业务

## Gates

- G09-1 Agent Run 与完成状态机
- G09-2 Tool Registry 最小权限
- G09-3 Coordinator/Worker/Handoff
- G09-4 用户审批与取消恢复
- G09-5 模型故障、成本与审计

## Sol acceptance policy

| Scope | Required route |
| --- | --- |
| Low / medium task | `terra_reviewer`; no task-level Sol required |
| High-risk task | `sol_acceptance` after Terra review |
| Critical architecture/security task | `sol_architecture_security` after Terra review/security review |
| Critical task primarily proving E2E/acceptance evidence | `sol_acceptance` |
| Phase exit | `sol_acceptance`, `sol_architecture_security`, `sol_phase_gate` |
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
| `HW09-01` | 定义 Agent Run、Task、Attempt 与 Approval Contracts | `terra_contracts` | luna_fixtures, terra_reviewer | `critical` | `A` | `sol-architecture-security` | terra_reviewer, terra_security, sol_architecture_security |
| `HW09-02` | 建立 Agent Gateway 服务与 Provider Boundary | `terra_worker` | terra_tester, terra_security | `high` | `B` | `sol-acceptance` | terra_reviewer, sol_acceptance |
| `HW09-03` | 实现 Coordinator／Worker 编排 | `parent_codex` | terra_worker, terra_tester, terra_reviewer | `critical` | `B` | `sol-architecture-security` | terra_reviewer, terra_security, sol_architecture_security |
| `HW09-04` | 实现受控 Tool Registry 与 Risk Policy | `parent_codex` | terra_contracts, terra_tester, terra_security | `critical` | `C` | `sol-architecture-security` | terra_reviewer, terra_security, sol_architecture_security |
| `HW09-05` | 集成 Harness、Decision、Handoff 与 Outbox | `terra_worker` | terra_tester, terra_reviewer | `high` | `C` | `sol-acceptance` | terra_reviewer, sol_acceptance |
| `HW09-06` | 实现 Workspace Agent Team UI | `terra_worker` | terra_browser, luna_fixtures | `medium` | `D` | `terra` | terra_reviewer |
| `HW09-07` | 首个低风险 Agent：报修分诊建议 | `terra_worker` | luna_fixtures, terra_tester, terra_security | `high` | `E` | `sol-acceptance` | terra_reviewer, sol_acceptance |
| `HW09-08` | Agent Red-Team 与 Gate | `parent_codex` | terra_reviewer, terra_security | `critical` | `F` | `sol-phase-gate` | terra_reviewer, terra_security, sol_acceptance, sol_architecture_security, sol_phase_gate |

## Detailed implementation plan

### HW09-01 — 定义 Agent Run、Task、Attempt 与 Approval Contracts

| Field | Value |
| --- | --- |
| Primary owner | `terra_contracts` |
| Supporting agents | `luna_fixtures`, `terra_reviewer` |
| Mode | `workspace-write` |
| Parallel group | `A` |
| Risk | `critical` |
| Task dependencies | — |
| Acceptance tier | `sol-architecture-security` |
| Acceptance agents | `terra_reviewer`, `terra_security`, `sol_architecture_security` |
| Required acceptance outcome | `ACCEPT` |

**Allowed paths**

- `packages/agent-contracts/**`
- `packages/harness-contracts/**`
- `packages/hub-contracts/**`

**Objective**

将自然语言消息、Agent 计划、任务、工具调用、等待、阻塞、审批、产物和完成状态严格分离。

**Implementation steps**

- 定义 AgentProfile、Run、Task、Attempt、ToolCall、Approval、Artifact、Result。
- 状态沿用 Harness 且每个转换有 actor/reason/version。
- 模型 `final` 文本不能直接置 Run succeeded；validator/Harness 决定。
- Approval 绑定具体 ToolCall/command/影响/过期。
- 提供取消、超时、晚到、重启、重复审批 fixtures。

**Validation**

- state transition
- invalid completion
- approval race
- late event

**Acceptance**

- 契约能表达 Coordinator/Worker
- 用户裁决优先且不可被模型覆盖

**Independent acceptance procedure**

- Implementation/testing agents finish and return exact commands, evidence and limitations.
- The parent inspects the actual integrated diff before spawning acceptance agents.
- Run the agents listed in `Acceptance agents` against the same final commit/tree digest.
- Required Sol outcomes are advisory but mandatory evidence for the parent Gate.
- A Sol `REJECT`, `BLOCKED` or missing required report prevents task acceptance.
- Acceptance agents are read-only and never fix the task they review.

**Evidence**

- agent-contract-snapshot.json
- acceptance report(s) bound to the final source/result commit

**Stop immediately if**

- 需要修改未在 allowed_paths 中声明的路径
- 需要改变已接受 ADR、身份/Session、授权/Scope、TLS、原生权限或数据所有权边界
- 需要新增生产依赖、破坏性数据库操作或对外部系统写入，但任务未明确授权
- 当前工作树包含无法归属的用户修改；若本任务主动采用可选旧源，则该旧源无法绑定固定 commit

### HW09-02 — 建立 Agent Gateway 服务与 Provider Boundary

| Field | Value |
| --- | --- |
| Primary owner | `terra_worker` |
| Supporting agents | `terra_tester`, `terra_security` |
| Mode | `workspace-write` |
| Parallel group | `B` |
| Risk | `high` |
| Task dependencies | `HW09-01` |
| Acceptance tier | `sol-acceptance` |
| Acceptance agents | `terra_reviewer`, `sol_acceptance` |
| Required acceptance outcome | `ACCEPT` |

**Allowed paths**

- `services/agent-gateway/**`
- `database/prisma/models/agent.prisma`
- `packages/agent-contracts/**`

**Objective**

建立模型调用、Run 持久化、队列、恢复、取消和成本计量，模型密钥只在服务端。

**Implementation steps**

- 实现 Fastify control API 与 worker runtime。
- Provider Adapter 支持 OpenAI-compatible，配置和密钥只在服务端 secret store。
- Run/Task/Attempt 持久化，重启后恢复 queued/running/waiting_user。
- Token/latency/error/cost 计量写入审计，不记录敏感 prompt 全文。
- 健康、graceful shutdown、backpressure 和并发限额。

**Validation**

- provider fake
- timeout/retry
- restart recovery
- cancel
- secret scan

**Acceptance**

- 客户端无模型 API Key
- 服务重启不丢审批/状态

**Independent acceptance procedure**

- Implementation/testing agents finish and return exact commands, evidence and limitations.
- The parent inspects the actual integrated diff before spawning acceptance agents.
- Run the agents listed in `Acceptance agents` against the same final commit/tree digest.
- Required Sol outcomes are advisory but mandatory evidence for the parent Gate.
- A Sol `REJECT`, `BLOCKED` or missing required report prevents task acceptance.
- Acceptance agents are read-only and never fix the task they review.

**Evidence**

- agent-gateway-runtime-report.md
- acceptance report(s) bound to the final source/result commit

**Stop immediately if**

- 需要修改未在 allowed_paths 中声明的路径
- 需要改变已接受 ADR、身份/Session、授权/Scope、TLS、原生权限或数据所有权边界
- 需要新增生产依赖、破坏性数据库操作或对外部系统写入，但任务未明确授权
- 当前工作树包含无法归属的用户修改；若本任务主动采用可选旧源，则该旧源无法绑定固定 commit

### HW09-03 — 实现 Coordinator／Worker 编排

| Field | Value |
| --- | --- |
| Primary owner | `parent_codex` |
| Supporting agents | `terra_worker`, `terra_tester`, `terra_reviewer` |
| Mode | `workspace-write` |
| Parallel group | `B` |
| Risk | `critical` |
| Task dependencies | `HW09-01`, `HW09-02` |
| Acceptance tier | `sol-architecture-security` |
| Acceptance agents | `terra_reviewer`, `terra_security`, `sol_architecture_security` |
| Required acceptance outcome | `ACCEPT` |

**Allowed paths**

- `services/agent-gateway/src/orchestration/**`
- `packages/agent-contracts/**`

**Objective**

借鉴 Knowe 的项目经理和专门成员，但由确定性 Runtime 管理任务依赖、并发、Handoff 和汇总。

**Implementation steps**

- Coordinator 只能创建有界 Task Envelope，指定目标、输入、工具权限、完成条件和依赖。
- Worker 有独立 profile/context budget/tool allowlist，但不拥有业务权限之外的能力。
- 并行 Task 只在依赖和资源互斥时启动。
- Handoff 进入 Collaboration Harness，接受/拒绝/返工留痕。
- Coordinator 汇总引用 Worker artifacts/evidence，不伪造执行结果。

**Validation**

- task DAG
- cycle detection
- handoff reject/rework
- worker failure
- parallel resource lock

**Acceptance**

- Agent 团队可协作但无法绕过系统任务状态
- 每个结果可追溯到 Worker/Attempt

**Independent acceptance procedure**

- Implementation/testing agents finish and return exact commands, evidence and limitations.
- The parent inspects the actual integrated diff before spawning acceptance agents.
- Run the agents listed in `Acceptance agents` against the same final commit/tree digest.
- Required Sol outcomes are advisory but mandatory evidence for the parent Gate.
- A Sol `REJECT`, `BLOCKED` or missing required report prevents task acceptance.
- Acceptance agents are read-only and never fix the task they review.

**Evidence**

- agent-orchestration-report.md
- acceptance report(s) bound to the final source/result commit

**Stop immediately if**

- 需要修改未在 allowed_paths 中声明的路径
- 需要改变已接受 ADR、身份/Session、授权/Scope、TLS、原生权限或数据所有权边界
- 需要新增生产依赖、破坏性数据库操作或对外部系统写入，但任务未明确授权
- 当前工作树包含无法归属的用户修改；若本任务主动采用可选旧源，则该旧源无法绑定固定 commit

### HW09-04 — 实现受控 Tool Registry 与 Risk Policy

| Field | Value |
| --- | --- |
| Primary owner | `parent_codex` |
| Supporting agents | `terra_contracts`, `terra_tester`, `terra_security` |
| Mode | `workspace-write` |
| Parallel group | `C` |
| Risk | `critical` |
| Task dependencies | `HW09-02`, `HW02-05` |
| Acceptance tier | `sol-architecture-security` |
| Acceptance agents | `terra_reviewer`, `terra_security`, `sol_architecture_security` |
| Required acceptance outcome | `ACCEPT` |

**Allowed paths**

- `services/agent-gateway/src/tools/**`
- `packages/tool-contracts/**`
- `database/prisma/models/config.prisma`

**Objective**

只允许模型通过 provider-native structured tool calls 调用批准的医院 API 工具。

**Implementation steps**

- 工具定义 name/version/input/output/owner/permission/scope/risk/idempotency。
- 禁止 generic shell、SQL、arbitrary HTTP、filesystem、browser automation。
- read 工具默认最小 Scope；write 工具必须服务端权限并按 risk 进入用户审批。
- 模型文本、XML、Markdown JSON 不能触发工具执行。
- Tool result 作为不可信输入，防 prompt/tool injection。

**Validation**

- fake text tool call
- unknown tool
- scope deny
- approval required
- result injection
- replay

**Acceptance**

- 无通用逃逸工具
- 所有 ToolCall 绑定 Principal/Run/Trace/Audit

**Independent acceptance procedure**

- Implementation/testing agents finish and return exact commands, evidence and limitations.
- The parent inspects the actual integrated diff before spawning acceptance agents.
- Run the agents listed in `Acceptance agents` against the same final commit/tree digest.
- Required Sol outcomes are advisory but mandatory evidence for the parent Gate.
- A Sol `REJECT`, `BLOCKED` or missing required report prevents task acceptance.
- Acceptance agents are read-only and never fix the task they review.

**Evidence**

- tool-registry-risk-matrix.json
- acceptance report(s) bound to the final source/result commit

**Stop immediately if**

- 需要修改未在 allowed_paths 中声明的路径
- 需要改变已接受 ADR、身份/Session、授权/Scope、TLS、原生权限或数据所有权边界
- 需要新增生产依赖、破坏性数据库操作或对外部系统写入，但任务未明确授权
- 当前工作树包含无法归属的用户修改；若本任务主动采用可选旧源，则该旧源无法绑定固定 commit

### HW09-05 — 集成 Harness、Decision、Handoff 与 Outbox

| Field | Value |
| --- | --- |
| Primary owner | `terra_worker` |
| Supporting agents | `terra_tester`, `terra_reviewer` |
| Mode | `workspace-write` |
| Parallel group | `C` |
| Risk | `high` |
| Task dependencies | `HW09-03`, `HW09-04`, `HW05-04` |
| Acceptance tier | `sol-acceptance` |
| Acceptance agents | `terra_reviewer`, `sol_acceptance` |
| Required acceptance outcome | `ACCEPT` |

**Allowed paths**

- `services/agent-gateway/src/harness/**`
- `services/collaboration/src/mappings/agents/**`

**Objective**

将 Agent Run 投影到线程、工作项、审批卡片和活动时间线。

**Implementation steps**

- Run/Task/Tool/Approval 状态变化产生 Event/Outbox。
- waiting_user 产生 Todo 和 Approval Card。
- approve/reject exactly-once；过期和撤权后不可执行。
- 取消 Run 阻止晚到工具结果复活。
- Artifact 只保存受控引用、hash、provenance 和 sensitivity。

**Validation**

- approve/reject race
- cancel late result
- restart waiting
- outbox replay

**Acceptance**

- Agent 状态与 Workspace 时间线一致
- 每个批准可审计

**Independent acceptance procedure**

- Implementation/testing agents finish and return exact commands, evidence and limitations.
- The parent inspects the actual integrated diff before spawning acceptance agents.
- Run the agents listed in `Acceptance agents` against the same final commit/tree digest.
- Required Sol outcomes are advisory but mandatory evidence for the parent Gate.
- A Sol `REJECT`, `BLOCKED` or missing required report prevents task acceptance.
- Acceptance agents are read-only and never fix the task they review.

**Evidence**

- agent-harness-e2e.json
- acceptance report(s) bound to the final source/result commit

**Stop immediately if**

- 需要修改未在 allowed_paths 中声明的路径
- 需要改变已接受 ADR、身份/Session、授权/Scope、TLS、原生权限或数据所有权边界
- 需要新增生产依赖、破坏性数据库操作或对外部系统写入，但任务未明确授权
- 当前工作树包含无法归属的用户修改；若本任务主动采用可选旧源，则该旧源无法绑定固定 commit

### HW09-06 — 实现 Workspace Agent Team UI

| Field | Value |
| --- | --- |
| Primary owner | `terra_worker` |
| Supporting agents | `terra_browser`, `luna_fixtures` |
| Mode | `workspace-write` |
| Parallel group | `D` |
| Risk | `medium` |
| Task dependencies | `HW09-05` |
| Acceptance tier | `terra` |
| Acceptance agents | `terra_reviewer` |
| Required acceptance outcome | `APPROVED` |

**Allowed paths**

- `apps/workspace-web/src/capabilities/agents/**`

**Objective**

提供类似群聊的 Agent 协作界面，但清晰展示任务、成员、状态、工具、审批、产物和错误。

**Implementation steps**

- Agent Space 显示 Coordinator/Worker 成员和能力。
- 自然语言输入创建 Run 草案；用户确认目标/范围后启动。
- 时间线显示任务拆解、进度、Handoff、审批和结果摘要。
- 不展示或依赖隐藏思维链，只展示可审计计划/行动摘要。
- 支持取消、重试、查看证据和产物。

**Validation**

- component/a11y
- approval UI
- cancel/retry
- long run reconnect

**Acceptance**

- 用户能知道谁在做什么、等待什么和为何完成
- 无误导性“已完成”

**Independent acceptance procedure**

- Implementation/testing agents finish and return exact commands, evidence and limitations.
- The parent inspects the actual integrated diff before spawning acceptance agents.
- Run the agents listed in `Acceptance agents` against the same final commit/tree digest.
- Required Sol outcomes are advisory but mandatory evidence for the parent Gate.
- A Sol `REJECT`, `BLOCKED` or missing required report prevents task acceptance.
- Acceptance agents are read-only and never fix the task they review.

**Evidence**

- agent-team-ui-evidence.md
- acceptance report(s) bound to the final source/result commit

**Stop immediately if**

- 需要修改未在 allowed_paths 中声明的路径
- 需要改变已接受 ADR、身份/Session、授权/Scope、TLS、原生权限或数据所有权边界
- 需要新增生产依赖、破坏性数据库操作或对外部系统写入，但任务未明确授权
- 当前工作树包含无法归属的用户修改；若本任务主动采用可选旧源，则该旧源无法绑定固定 commit

### HW09-07 — 首个低风险 Agent：报修分诊建议

| Field | Value |
| --- | --- |
| Primary owner | `terra_worker` |
| Supporting agents | `luna_fixtures`, `terra_tester`, `terra_security` |
| Mode | `workspace-write` |
| Parallel group | `E` |
| Risk | `high` |
| Task dependencies | `HW09-04`, `HW09-06` |
| Acceptance tier | `sol-acceptance` |
| Acceptance agents | `terra_reviewer`, `sol_acceptance` |
| Required acceptance outcome | `ACCEPT` |

**Allowed paths**

- `services/agent-gateway/src/scenarios/ticket-triage/**`
- `apps/workspace-web/src/capabilities/agents/**`
- `services/tickets/src/agent-tools/**`

**Objective**

用只读/建议模式验证 Agent 团队，不自动创建或改变工单。

**Implementation steps**

- 输入最小化报修文本和已授权上下文。
- Coordinator 可分派分类、紧急度、补充问题 Worker。
- 输出结构化建议卡，由用户确认后通过 Ticket Service 命令执行。
- 模型/Provider 失败时回退规则分类或人工流程。
- 建立 golden dataset 和误判/漏判指标。

**Validation**

- golden eval
- provider failure
- malicious prompt
- user reject
- audit

**Acceptance**

- 未达到质量阈值保持建议模式
- AI 失败不影响报修留痕

**Independent acceptance procedure**

- Implementation/testing agents finish and return exact commands, evidence and limitations.
- The parent inspects the actual integrated diff before spawning acceptance agents.
- Run the agents listed in `Acceptance agents` against the same final commit/tree digest.
- Required Sol outcomes are advisory but mandatory evidence for the parent Gate.
- A Sol `REJECT`, `BLOCKED` or missing required report prevents task acceptance.
- Acceptance agents are read-only and never fix the task they review.

**Evidence**

- ticket-triage-agent-eval.json
- acceptance report(s) bound to the final source/result commit

**Stop immediately if**

- 需要修改未在 allowed_paths 中声明的路径
- 需要改变已接受 ADR、身份/Session、授权/Scope、TLS、原生权限或数据所有权边界
- 需要新增生产依赖、破坏性数据库操作或对外部系统写入，但任务未明确授权
- 当前工作树包含无法归属的用户修改；若本任务主动采用可选旧源，则该旧源无法绑定固定 commit

### HW09-08 — Agent Red-Team 与 Gate

| Field | Value |
| --- | --- |
| Primary owner | `parent_codex` |
| Supporting agents | `terra_reviewer`, `terra_security` |
| Mode | `read-only` |
| Parallel group | `F` |
| Risk | `critical` |
| Task dependencies | `HW09-03`, `HW09-04`, `HW09-05`, `HW09-07` |
| Acceptance tier | `sol-phase-gate` |
| Acceptance agents | `terra_reviewer`, `terra_security`, `sol_acceptance`, `sol_architecture_security`, `sol_phase_gate` |
| Required acceptance outcome | `PASS_RECOMMENDED` |

**Allowed paths**

- `services/agent-gateway/**`
- `packages/agent-contracts/**`
- `packages/tool-contracts/**`
- `apps/workspace-web/src/capabilities/agents/**`

**Objective**

确认 Agent 能提高协作效率但无法获得超越人员和业务服务的权限。

**Implementation steps**

- 红队 prompt injection、tool injection、越权、数据外泄、取消/晚到、重复审批、模型幻觉完成。
- 审查成本、日志、敏感 prompt 和 Provider 配置。
- 签发 G09。

**Validation**

- red-team suite
- full agent E2E
- security review

**Acceptance**

- P0/P1 为零
- 只批准低风险建议场景

**Independent acceptance procedure**

- Implementation/testing agents finish and return exact commands, evidence and limitations.
- The parent inspects the actual integrated diff before spawning acceptance agents.
- Run the agents listed in `Acceptance agents` against the same final commit/tree digest.
- Required Sol outcomes are advisory but mandatory evidence for the parent Gate.
- A Sol `REJECT`, `BLOCKED` or missing required report prevents task acceptance.
- Acceptance agents are read-only and never fix the task they review.

**Evidence**

- G09-gate-decision.md
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
docs/program/phases/HW-09-agent-collaboration.md and docs/program/tasks/HW-09.yaml.

Execute only HW-09. Use Luna for narrow discovery/docs/fixtures, Terra for bounded implementation/testing/review,
and the task matrix's Sol route for independent acceptance. Run the phase-level Sol Gate agents only after the
final integrated diff and evidence are frozen. Parent Codex makes the final Gate decision.
Do not begin the next phase, push, merge, release or change external systems without explicit authorization.
```
