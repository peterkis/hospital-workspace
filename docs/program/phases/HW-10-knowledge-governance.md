# HW-10 — 知识整理项目、治理生命周期与 Agent 协作

## Goal

将知识整理作为一类一等工作项：文档、知识节点、关系、来源、版本、院级/院区/科室/项目范围、active/retired 和专家审校均可追溯；Agent 只能提出建议，专家裁决为权威。

## Dependencies

`HW-05`, `HW-09`

A dependent phase must be `PASS`. `CONDITIONAL` does not automatically authorize this phase.

## Deliverables

- `services/knowledge` 与 `knowledge-contracts`
- Knowledge Node/Relation/Source/Version/Review 数据模型
- active/retired 和 hospital/campus/department/project scope
- 知识编译/审校 Harness
- Workspace Knowledge Project Capability
- Coordinator/Worker 知识整理 Agent
- 可选 Hybrid Retrieval 接口与 provenance

## Out of scope

- 直接导入真实病历
- 未经专家审校自动发布临床知识
- 首期复杂全院知识图谱推理
- 将向量库作为知识真相

## Phase acceptance

- 知识节点/关系/版本/来源/scope/active-retired 可追溯
- 未审校建议不能发布为 active
- 专家 Decision 是最终权威
- 检索先授权再排序，retired/draft 默认排除
- 从 synthetic 文档到发布/退役/检索完成全链

## Gates

- G10-1 知识来源/版本/范围
- G10-2 用户审校权威
- G10-3 active/retired 生命周期
- G10-4 Agent 抽取与发布隔离
- G10-5 检索 provenance 与权限

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
| `HW10-01` | 定义 Knowledge Contracts 与生命周期 | `terra_contracts` | luna_fixtures, terra_reviewer | `high` | `A` | `sol-acceptance` | terra_reviewer, sol_acceptance |
| `HW10-02` | 实现 Knowledge Service 与数据库 | `parent_codex` | terra_worker, terra_tester, terra_security | `critical` | `B` | `sol-architecture-security` | terra_reviewer, terra_security, sol_architecture_security |
| `HW10-03` | 实现 Knowledge WorkItem/Harness Mapping | `terra_worker` | terra_tester, terra_reviewer | `high` | `B` | `sol-acceptance` | terra_reviewer, sol_acceptance |
| `HW10-04` | 实现 Workspace Knowledge Project Capability | `terra_worker` | terra_browser, luna_fixtures | `medium` | `C` | `terra` | terra_reviewer |
| `HW10-05` | 实现知识整理 Coordinator／Worker | `terra_worker` | terra_contracts, terra_tester, terra_security | `high` | `D` | `sol-acceptance` | terra_reviewer, sol_acceptance |
| `HW10-06` | 建立派生检索与 Provenance API | `terra_worker` | terra_tester, terra_security | `high` | `E` | `sol-acceptance` | terra_reviewer, sol_acceptance |
| `HW10-07` | 知识治理 E2E 与专家裁决测试 | `terra_tester` | terra_browser, terra_security | `critical` | `F` | `sol-acceptance` | terra_reviewer, terra_security, sol_acceptance |
| `HW10-08` | Knowledge Governance Gate | `parent_codex` | terra_reviewer, terra_security | `critical` | `G` | `sol-phase-gate` | terra_reviewer, terra_security, sol_acceptance, sol_phase_gate |

## Detailed implementation plan

### HW10-01 — 定义 Knowledge Contracts 与生命周期

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

- `packages/knowledge-contracts/**`
- `packages/harness-contracts/**`
- `packages/hub-contracts/**`

**Objective**

定义 KnowledgeProject、SourceDocument、Node、Relation、Claim、Version、Review、Decision 和 Scope。

**Implementation steps**

- Node type 支持 topic/entity/decision/constraint/risk/artifact/lesson/standard。
- 状态包含 draft/in_review/approved/active/retired/rejected。
- scope 支持 hospital/campus/department/project，并有继承/覆盖规则。
- 每个 claim/relation 有 sourceRef、locator、extractor、confidence、review。
- retired 不删除历史，supersedes 链可追踪。

**Validation**

- state/scope tests
- provenance fixtures
- supersede/retire

**Acceptance**

- 任何知识结论可回到来源和专家裁决
- 模型置信度不等于批准

**Independent acceptance procedure**

- Implementation/testing agents finish and return exact commands, evidence and limitations.
- The parent inspects the actual integrated diff before spawning acceptance agents.
- Run the agents listed in `Acceptance agents` against the same final commit/tree digest.
- Required Sol outcomes are advisory but mandatory evidence for the parent Gate.
- A Sol `REJECT`, `BLOCKED` or missing required report prevents task acceptance.
- Acceptance agents are read-only and never fix the task they review.

**Evidence**

- knowledge-contract-snapshot.json
- acceptance report(s) bound to the final source/result commit

**Stop immediately if**

- 需要修改未在 allowed_paths 中声明的路径
- 需要改变已接受 ADR、身份/Session、授权/Scope、TLS、原生权限或数据所有权边界
- 需要新增生产依赖、破坏性数据库操作或对外部系统写入，但任务未明确授权
- 当前工作树包含无法归属的用户修改；若本任务主动采用可选旧源，则该旧源无法绑定固定 commit

### HW10-02 — 实现 Knowledge Service 与数据库

| Field | Value |
| --- | --- |
| Primary owner | `parent_codex` |
| Supporting agents | `terra_worker`, `terra_tester`, `terra_security` |
| Mode | `workspace-write` |
| Parallel group | `B` |
| Risk | `critical` |
| Task dependencies | `HW10-01` |
| Acceptance tier | `sol-architecture-security` |
| Acceptance agents | `terra_reviewer`, `terra_security`, `sol_architecture_security` |
| Required acceptance outcome | `ACCEPT` |

**Allowed paths**

- `services/knowledge/**`
- `database/prisma/models/knowledge.prisma`

**Objective**

实现知识项目、节点、版本、关系、来源、审校和范围查询。

**Implementation steps**

- 新建 knowledge schema/migration。
- 写操作使用 expectedVersion/idempotency，审批/发布走状态机。
- 来源文档只保存受控 assetRef/hash/metadata。
- 权限按 scope、项目成员和审校角色。
- retire/supersede 保留历史与事件。

**Validation**

- service integration
- scope/permission
- version conflict
- retire history
- migration rebuild

**Acceptance**

- 知识服务是权威，向量索引只是派生
- 未审校内容不能标 active

**Independent acceptance procedure**

- Implementation/testing agents finish and return exact commands, evidence and limitations.
- The parent inspects the actual integrated diff before spawning acceptance agents.
- Run the agents listed in `Acceptance agents` against the same final commit/tree digest.
- Required Sol outcomes are advisory but mandatory evidence for the parent Gate.
- A Sol `REJECT`, `BLOCKED` or missing required report prevents task acceptance.
- Acceptance agents are read-only and never fix the task they review.

**Evidence**

- knowledge-service-report.md
- acceptance report(s) bound to the final source/result commit

**Stop immediately if**

- 需要修改未在 allowed_paths 中声明的路径
- 需要改变已接受 ADR、身份/Session、授权/Scope、TLS、原生权限或数据所有权边界
- 需要新增生产依赖、破坏性数据库操作或对外部系统写入，但任务未明确授权
- 当前工作树包含无法归属的用户修改；若本任务主动采用可选旧源，则该旧源无法绑定固定 commit

### HW10-03 — 实现 Knowledge WorkItem/Harness Mapping

| Field | Value |
| --- | --- |
| Primary owner | `terra_worker` |
| Supporting agents | `terra_tester`, `terra_reviewer` |
| Mode | `workspace-write` |
| Parallel group | `B` |
| Risk | `high` |
| Task dependencies | `HW10-02`, `HW05-04` |
| Acceptance tier | `sol-acceptance` |
| Acceptance agents | `terra_reviewer`, `sol_acceptance` |
| Required acceptance outcome | `ACCEPT` |

**Allowed paths**

- `services/collaboration/src/mappings/knowledge/**`

**Objective**

将文档摄取、抽取、审校、批准、发布和退役投影为工作项、Decision、Handoff 和 Todo。

**Implementation steps**

- 每个 KnowledgeProject 一个空间/主线程，文档或批次可形成子工作项。
- 审校人收到 Todo；批准/拒绝产生 Decision 活动。
- Agent 建议与专家裁决分层显示。
- 重放可恢复项目进度。

**Validation**

- projection replay
- review assignment
- decision authority

**Acceptance**

- 知识治理过程透明
- 模型结果不会绕过审校

**Independent acceptance procedure**

- Implementation/testing agents finish and return exact commands, evidence and limitations.
- The parent inspects the actual integrated diff before spawning acceptance agents.
- Run the agents listed in `Acceptance agents` against the same final commit/tree digest.
- Required Sol outcomes are advisory but mandatory evidence for the parent Gate.
- A Sol `REJECT`, `BLOCKED` or missing required report prevents task acceptance.
- Acceptance agents are read-only and never fix the task they review.

**Evidence**

- knowledge-workitem-receipt.json
- acceptance report(s) bound to the final source/result commit

**Stop immediately if**

- 需要修改未在 allowed_paths 中声明的路径
- 需要改变已接受 ADR、身份/Session、授权/Scope、TLS、原生权限或数据所有权边界
- 需要新增生产依赖、破坏性数据库操作或对外部系统写入，但任务未明确授权
- 当前工作树包含无法归属的用户修改；若本任务主动采用可选旧源，则该旧源无法绑定固定 commit

### HW10-04 — 实现 Workspace Knowledge Project Capability

| Field | Value |
| --- | --- |
| Primary owner | `terra_worker` |
| Supporting agents | `terra_browser`, `luna_fixtures` |
| Mode | `workspace-write` |
| Parallel group | `C` |
| Risk | `medium` |
| Task dependencies | `HW10-02`, `HW10-03` |
| Acceptance tier | `terra` |
| Acceptance agents | `terra_reviewer` |
| Required acceptance outcome | `APPROVED` |

**Allowed paths**

- `apps/workspace-web/src/capabilities/knowledge/**`

**Objective**

提供文档来源、知识节点、关系、审校队列、版本比较和发布/退役 Canvas。

**Implementation steps**

- 时间线显示摄取、抽取、Agent 建议、专家评论、Decision 和发布。
- Node/Relation 显示来源 locator 和版本差异。
- 审批卡支持 approve/reject/request_changes/retire。
- 按 scope 过滤，未授权节点不可搜索或预览。

**Validation**

- component/a11y
- version diff
- scope privacy
- decision flow

**Acceptance**

- 专家能基于来源审校
- active/retired 状态清晰

**Independent acceptance procedure**

- Implementation/testing agents finish and return exact commands, evidence and limitations.
- The parent inspects the actual integrated diff before spawning acceptance agents.
- Run the agents listed in `Acceptance agents` against the same final commit/tree digest.
- Required Sol outcomes are advisory but mandatory evidence for the parent Gate.
- A Sol `REJECT`, `BLOCKED` or missing required report prevents task acceptance.
- Acceptance agents are read-only and never fix the task they review.

**Evidence**

- knowledge-ui-evidence.md
- acceptance report(s) bound to the final source/result commit

**Stop immediately if**

- 需要修改未在 allowed_paths 中声明的路径
- 需要改变已接受 ADR、身份/Session、授权/Scope、TLS、原生权限或数据所有权边界
- 需要新增生产依赖、破坏性数据库操作或对外部系统写入，但任务未明确授权
- 当前工作树包含无法归属的用户修改；若本任务主动采用可选旧源，则该旧源无法绑定固定 commit

### HW10-05 — 实现知识整理 Coordinator／Worker

| Field | Value |
| --- | --- |
| Primary owner | `terra_worker` |
| Supporting agents | `terra_contracts`, `terra_tester`, `terra_security` |
| Mode | `workspace-write` |
| Parallel group | `D` |
| Risk | `high` |
| Task dependencies | `HW09-03`, `HW10-02` |
| Acceptance tier | `sol-acceptance` |
| Acceptance agents | `terra_reviewer`, `sol_acceptance` |
| Required acceptance outcome | `ACCEPT` |

**Allowed paths**

- `services/agent-gateway/src/scenarios/knowledge/**`
- `services/knowledge/src/agent-tools/**`

**Objective**

按资料解析、术语标准化、FHIR 映射、质量核查、知识审校建议拆分 Agent Worker。

**Implementation steps**

- Coordinator 根据项目模板创建有界任务。
- Worker 只读 Source/Knowledge API，输出 structured proposals 和 provenance。
- 写入 draft proposal 需要工具权限；批准发布必须专家 Decision。
- 失败、低置信、来源冲突进入 blocked/waiting_user。
- Handoff 保留上游来源、假设和未解决问题。

**Validation**

- golden fixtures
- conflicting sources
- low confidence
- expert reject
- cancel/restart

**Acceptance**

- Agent 加速整理但不能自我发布
- 每项建议有来源

**Independent acceptance procedure**

- Implementation/testing agents finish and return exact commands, evidence and limitations.
- The parent inspects the actual integrated diff before spawning acceptance agents.
- Run the agents listed in `Acceptance agents` against the same final commit/tree digest.
- Required Sol outcomes are advisory but mandatory evidence for the parent Gate.
- A Sol `REJECT`, `BLOCKED` or missing required report prevents task acceptance.
- Acceptance agents are read-only and never fix the task they review.

**Evidence**

- knowledge-agent-eval.json
- acceptance report(s) bound to the final source/result commit

**Stop immediately if**

- 需要修改未在 allowed_paths 中声明的路径
- 需要改变已接受 ADR、身份/Session、授权/Scope、TLS、原生权限或数据所有权边界
- 需要新增生产依赖、破坏性数据库操作或对外部系统写入，但任务未明确授权
- 当前工作树包含无法归属的用户修改；若本任务主动采用可选旧源，则该旧源无法绑定固定 commit

### HW10-06 — 建立派生检索与 Provenance API

| Field | Value |
| --- | --- |
| Primary owner | `terra_worker` |
| Supporting agents | `terra_tester`, `terra_security` |
| Mode | `workspace-write` |
| Parallel group | `E` |
| Risk | `high` |
| Task dependencies | `HW10-02` |
| Acceptance tier | `sol-acceptance` |
| Acceptance agents | `terra_reviewer`, `sol_acceptance` |
| Required acceptance outcome | `ACCEPT` |

**Allowed paths**

- `services/knowledge/src/search/**`
- `packages/search-contracts/**`
- `infrastructure/search/**`

**Objective**

提供关键词/向量/关系的混合检索接口，但结果只返回当前用户可见的 active/approved 知识及来源。

**Implementation steps**

- 首期可用 PostgreSQL FTS + pgvector 或批准的独立索引；索引不是权威。
- 索引事件来自 Knowledge Outbox，可重建。
- 查询先执行 scope filter，再排序/rerank。
- 每个结果包含 nodeVersion、sourceRefs、score components。
- draft/retired 默认不进入普通检索。

**Validation**

- index rebuild
- scope leakage
- retired exclusion
- provenance

**Acceptance**

- 删除索引可从权威数据重建
- 无跨 scope 召回

**Independent acceptance procedure**

- Implementation/testing agents finish and return exact commands, evidence and limitations.
- The parent inspects the actual integrated diff before spawning acceptance agents.
- Run the agents listed in `Acceptance agents` against the same final commit/tree digest.
- Required Sol outcomes are advisory but mandatory evidence for the parent Gate.
- A Sol `REJECT`, `BLOCKED` or missing required report prevents task acceptance.
- Acceptance agents are read-only and never fix the task they review.

**Evidence**

- knowledge-search-report.json
- acceptance report(s) bound to the final source/result commit

**Stop immediately if**

- 需要修改未在 allowed_paths 中声明的路径
- 需要改变已接受 ADR、身份/Session、授权/Scope、TLS、原生权限或数据所有权边界
- 需要新增生产依赖、破坏性数据库操作或对外部系统写入，但任务未明确授权
- 当前工作树包含无法归属的用户修改；若本任务主动采用可选旧源，则该旧源无法绑定固定 commit

### HW10-07 — 知识治理 E2E 与专家裁决测试

| Field | Value |
| --- | --- |
| Primary owner | `terra_tester` |
| Supporting agents | `terra_browser`, `terra_security` |
| Mode | `workspace-write` |
| Parallel group | `F` |
| Risk | `critical` |
| Task dependencies | `HW10-03`, `HW10-04`, `HW10-05`, `HW10-06` |
| Acceptance tier | `sol-acceptance` |
| Acceptance agents | `terra_reviewer`, `terra_security`, `sol_acceptance` |
| Required acceptance outcome | `ACCEPT` |

**Allowed paths**

- `services/knowledge/test/**`
- `apps/workspace-web/e2e/knowledge/**`
- `evidence/HW-10/**`

**Objective**

从 synthetic 文档到 Agent 建议、专家修改、批准、发布、检索、退役和 supersede 完成全链。

**Implementation steps**

- 包含来源冲突、低置信、错误抽取、专家拒绝和版本竞争。
- 验证 scope、撤权、日志和通知脱敏。
- 索引中断后恢复重建。
- 比较 Agent proposal 与最终专家版本。

**Validation**

- multi-role E2E
- search privacy
- index rebuild
- decision audit

**Acceptance**

- 专家权威可证明
- 历史和来源完整

**Independent acceptance procedure**

- Implementation/testing agents finish and return exact commands, evidence and limitations.
- The parent inspects the actual integrated diff before spawning acceptance agents.
- Run the agents listed in `Acceptance agents` against the same final commit/tree digest.
- Required Sol outcomes are advisory but mandatory evidence for the parent Gate.
- A Sol `REJECT`, `BLOCKED` or missing required report prevents task acceptance.
- Acceptance agents are read-only and never fix the task they review.

**Evidence**

- knowledge-governance-e2e.json
- acceptance report(s) bound to the final source/result commit

**Stop immediately if**

- 需要修改未在 allowed_paths 中声明的路径
- 需要改变已接受 ADR、身份/Session、授权/Scope、TLS、原生权限或数据所有权边界
- 需要新增生产依赖、破坏性数据库操作或对外部系统写入，但任务未明确授权
- 当前工作树包含无法归属的用户修改；若本任务主动采用可选旧源，则该旧源无法绑定固定 commit

### HW10-08 — Knowledge Governance Gate

| Field | Value |
| --- | --- |
| Primary owner | `parent_codex` |
| Supporting agents | `terra_reviewer`, `terra_security` |
| Mode | `read-only` |
| Parallel group | `G` |
| Risk | `critical` |
| Task dependencies | `HW10-02`, `HW10-05`, `HW10-06`, `HW10-07` |
| Acceptance tier | `sol-phase-gate` |
| Acceptance agents | `terra_reviewer`, `terra_security`, `sol_acceptance`, `sol_phase_gate` |
| Required acceptance outcome | `PASS_RECOMMENDED` |

**Allowed paths**

- `services/knowledge/**`
- `services/agent-gateway/src/scenarios/knowledge/**`
- `apps/workspace-web/src/capabilities/knowledge/**`

**Objective**

确认知识资产可持续增长且可治理，不把 LLM 输出直接当临床知识。

**Implementation steps**

- 审查来源、版本、scope、审校、Agent、检索、retire 和审计。
- 签发 G10。

**Validation**

- full knowledge suite
- red-team
- security review

**Acceptance**

- P0/P1 为零
- 只批准 synthetic/非临床生产知识试点

**Independent acceptance procedure**

- Implementation/testing agents finish and return exact commands, evidence and limitations.
- The parent inspects the actual integrated diff before spawning acceptance agents.
- Run the agents listed in `Acceptance agents` against the same final commit/tree digest.
- Required Sol outcomes are advisory but mandatory evidence for the parent Gate.
- A Sol `REJECT`, `BLOCKED` or missing required report prevents task acceptance.
- Acceptance agents are read-only and never fix the task they review.

**Evidence**

- G10-gate-decision.md
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
docs/program/phases/HW-10-knowledge-governance.md and docs/program/tasks/HW-10.yaml.

Execute only HW-10. Use Luna for narrow discovery/docs/fixtures, Terra for bounded implementation/testing/review,
and the task matrix's Sol route for independent acceptance. Run the phase-level Sol Gate agents only after the
final integrated diff and evidence are frozen. Parent Codex makes the final Gate decision.
Do not begin the next phase, push, merge, release or change external systems without explicit authorization.
```
