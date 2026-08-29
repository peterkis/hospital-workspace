# HW-02 — 人员、组织、身份、Session 与授权主链

## Goal

建立以人员为中心的身份上下文：浏览器与桌面共用 Gateway/BFF、Logto 和 Redis Session；医院人员/组织主数据经 Identity Adapter 进入统一 Principal，权限与数据范围始终在服务端裁决。

## Dependencies

`HW-01`

A dependent phase must be `PASS`. `CONDITIONAL` does not automatically authorize this phase.

## Deliverables

- `services/gateway` 与 Identity Adapter
- Logto Traditional Web/BFF 登录和 Redis-only Session
- Person/Organization/Role/Scope 模型
- `authz-core` 与服务端权限/范围检查
- Browser/Desktop 共用 Session 主链
- 共享终端 logout/switch-person/fail-closed 合同

## Out of scope

- 患者主索引
- 业务权限全量配置 UI
- 原生客户端 Token/Refresh Token 托管
- 生产医院认证接口切换

## Phase acceptance

- 外部身份、Person、Organization、Principal 明确分层
- Browser/Tauri 共用 BFF 和 Redis Session，客户端不持 Token
- 授权默认拒绝且 Scope 失败为 none
- logout/switch-person 撤销 family，Redis/BFF 故障 fail-closed
- Capability Registry 是能力元数据唯一真相

## Gates

- G02-1 身份映射与人员上下文
- G02-2 Redis-only Session
- G02-3 默认拒绝授权与 Scope
- G02-4 Browser/Desktop 同链路
- G02-5 共享终端与故障关闭

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
| `HW02-01` | 定义 Principal、Person 与 Organization Contracts | `terra_contracts` | luna_fixtures, terra_reviewer | `high` | `A` | `sol-acceptance` | terra_reviewer, sol_acceptance |
| `HW02-02` | 迁移并净化医院 Identity Bridge | `terra_migrator` | luna_explorer, terra_tester, terra_security | `high` | `B` | `sol-acceptance` | terra_reviewer, sol_acceptance |
| `HW02-03` | 实现 Gateway/BFF 与 Logto 回调 | `parent_codex` | terra_worker, terra_tester, terra_security | `critical` | `C` | `sol-architecture-security` | terra_reviewer, terra_security, sol_architecture_security |
| `HW02-04` | 实现 Redis-only Session Authority | `parent_codex` | terra_worker, terra_tester, terra_security | `critical` | `C` | `sol-architecture-security` | terra_reviewer, terra_security, sol_architecture_security |
| `HW02-05` | 实现 Authz Core 与 Scope Resolver | `parent_codex` | terra_contracts, terra_tester, terra_security | `critical` | `D` | `sol-architecture-security` | terra_reviewer, terra_security, sol_architecture_security |
| `HW02-06` | 建立 Capability Registry 身份入口 | `terra_worker` | terra_contracts, terra_tester | `medium` | `E` | `terra` | terra_reviewer |
| `HW02-07` | Browser/Desktop Session 等价合同 | `terra_tester` | terra_browser, terra_security | `high` | `F` | `sol-acceptance` | terra_reviewer, sol_acceptance |
| `HW02-08` | Identity & Access Gate | `parent_codex` | terra_reviewer, terra_security | `critical` | `G` | `sol-phase-gate` | terra_reviewer, terra_security, sol_architecture_security, sol_phase_gate |

## Detailed implementation plan

### HW02-01 — 定义 Principal、Person 与 Organization Contracts

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

- `packages/identity-contracts/**`
- `packages/contracts-core/**`
- `database/prisma/models/iam.prisma`

**Objective**

区分外部认证身份、医院人员主数据、组织归属、岗位角色和运行时 Principal。

**Implementation steps**

- 定义 ExternalIdentity、Person、Employment、DepartmentMembership、CampusMembership。
- Principal 只包含授权所需最小字段和版本，不包含密码或上游凭据。
- 定义 identityVersion、authzVersion、organizationVersion。
- 支持人员停用、离岗、调科和多院区归属。
- 提供重复工号、无科室、停用、映射冲突 fixtures。

**Validation**

- contract tests
- mapping conflict fixtures
- schema validation

**Acceptance**

- 外部 identity 与 Person 可独立演进
- Principal 可在每次请求重建/验证

**Independent acceptance procedure**

- Implementation/testing agents finish and return exact commands, evidence and limitations.
- The parent inspects the actual integrated diff before spawning acceptance agents.
- Run the agents listed in `Acceptance agents` against the same final commit/tree digest.
- Required Sol outcomes are advisory but mandatory evidence for the parent Gate.
- A Sol `REJECT`, `BLOCKED` or missing required report prevents task acceptance.
- Acceptance agents are read-only and never fix the task they review.

**Evidence**

- identity-contract-report.md
- acceptance report(s) bound to the final source/result commit

**Stop immediately if**

- 需要修改未在 allowed_paths 中声明的路径
- 需要改变已接受 ADR、身份/Session、授权/Scope、TLS、原生权限或数据所有权边界
- 需要新增生产依赖、破坏性数据库操作或对外部系统写入，但任务未明确授权
- 当前工作树包含无法归属的用户修改；若本任务主动采用可选旧源，则该旧源无法绑定固定 commit

### HW02-02 — 迁移并净化医院 Identity Bridge

| Field | Value |
| --- | --- |
| Primary owner | `terra_migrator` |
| Supporting agents | `luna_explorer`, `terra_tester`, `terra_security` |
| Mode | `workspace-write` |
| Parallel group | `B` |
| Risk | `high` |
| Task dependencies | `HW02-01` |
| Acceptance tier | `sol-acceptance` |
| Acceptance agents | `terra_reviewer`, `sol_acceptance` |
| Required acceptance outcome | `ACCEPT` |

**Allowed paths**

- `services/gateway/src/identity/**`
- `packages/identity-adapter/**`
- `docs/migration/**`

**Objective**

从 legacy 身份桥和 HIS credential authority 中抽取协议、重试、映射和测试，不复制旧 Portal UI 或 Session 表。

**Implementation steps**

- 先生成 legacy execution map 和白名单文件清单。
- 迁移上游认证/人员查询 adapter 接口与 synthetic fake adapter。
- 删除旧 Next request context、页面、JWT/local token 和 PostgreSQL Session 假设。
- 上游凭据只在 Gateway/Identity Adapter 内短时使用并脱敏。
- 记录 source hash、改造差异和未迁移项。

**Validation**

- legacy source verification
- adapter contract tests
- credential redaction tests

**Acceptance**

- 新代码不依赖 `hospital-sso-starter`
- 无旧 UI/Session model 进入新仓

**Independent acceptance procedure**

- Implementation/testing agents finish and return exact commands, evidence and limitations.
- The parent inspects the actual integrated diff before spawning acceptance agents.
- Run the agents listed in `Acceptance agents` against the same final commit/tree digest.
- Required Sol outcomes are advisory but mandatory evidence for the parent Gate.
- A Sol `REJECT`, `BLOCKED` or missing required report prevents task acceptance.
- Acceptance agents are read-only and never fix the task they review.

**Evidence**

- identity-migration-receipt.json
- acceptance report(s) bound to the final source/result commit

**Stop immediately if**

- 需要修改未在 allowed_paths 中声明的路径
- 需要改变已接受 ADR、身份/Session、授权/Scope、TLS、原生权限或数据所有权边界
- 需要新增生产依赖、破坏性数据库操作或对外部系统写入，但任务未明确授权
- 当前工作树包含无法归属的用户修改；若本任务主动采用可选旧源，则该旧源无法绑定固定 commit

### HW02-03 — 实现 Gateway/BFF 与 Logto 回调

| Field | Value |
| --- | --- |
| Primary owner | `parent_codex` |
| Supporting agents | `terra_worker`, `terra_tester`, `terra_security` |
| Mode | `workspace-write` |
| Parallel group | `C` |
| Risk | `critical` |
| Task dependencies | `HW02-01`, `HW02-02` |
| Acceptance tier | `sol-architecture-security` |
| Acceptance agents | `terra_reviewer`, `terra_security`, `sol_architecture_security` |
| Required acceptance outcome | `ACCEPT` |

**Allowed paths**

- `services/gateway/**`
- `packages/api-client/**`
- `database/prisma/models/iam.prisma`
- `database/prisma/models/config.prisma`

**Objective**

建立唯一浏览器/桌面 Web Session 入口，客户端不直接保管 OIDC Token。

**Implementation steps**

- 使用 Logto Traditional Web 客户端和 Authorization Code 流程。
- OIDC Token 只在服务端交换和验证，浏览器获得 host-only HttpOnly Session Cookie。
- Session family、CSRF、rotation、idle/absolute expiry 和 logout 合同明确。
- Gateway 暴露 `/auth/session`、login callback、logout、switch-person 受控接口。
- 所有 redirect/origin/cookie 属性由环境配置和 exact allowlist 决定。

**Validation**

- OIDC callback tests
- CSRF
- open redirect
- cookie attribute
- token leakage scan

**Acceptance**

- Rust/React 不能读取 OIDC Token
- Cookie 不进入 localStorage/URL/log

**Independent acceptance procedure**

- Implementation/testing agents finish and return exact commands, evidence and limitations.
- The parent inspects the actual integrated diff before spawning acceptance agents.
- Run the agents listed in `Acceptance agents` against the same final commit/tree digest.
- Required Sol outcomes are advisory but mandatory evidence for the parent Gate.
- A Sol `REJECT`, `BLOCKED` or missing required report prevents task acceptance.
- Acceptance agents are read-only and never fix the task they review.

**Evidence**

- gateway-auth-report.md
- acceptance report(s) bound to the final source/result commit

**Stop immediately if**

- 需要修改未在 allowed_paths 中声明的路径
- 需要改变已接受 ADR、身份/Session、授权/Scope、TLS、原生权限或数据所有权边界
- 需要新增生产依赖、破坏性数据库操作或对外部系统写入，但任务未明确授权
- 当前工作树包含无法归属的用户修改；若本任务主动采用可选旧源，则该旧源无法绑定固定 commit

### HW02-04 — 实现 Redis-only Session Authority

| Field | Value |
| --- | --- |
| Primary owner | `parent_codex` |
| Supporting agents | `terra_worker`, `terra_tester`, `terra_security` |
| Mode | `workspace-write` |
| Parallel group | `C` |
| Risk | `critical` |
| Task dependencies | `HW02-03`, `HW01-03` |
| Acceptance tier | `sol-architecture-security` |
| Acceptance agents | `terra_reviewer`, `terra_security`, `sol_architecture_security` |
| Required acceptance outcome | `ACCEPT` |

**Allowed paths**

- `services/gateway/src/session/**`
- `packages/redis-core/**`
- `database/prisma/models/iam.prisma`

**Objective**

Session 创建、查询、撤销、换人和权限版本校验全部以 Redis 为唯一运行时权威。

**Implementation steps**

- 定义 opaque session id、family id、principal snapshot version 和 TTL。
- 不创建 PostgreSQL Session/RefreshSession 运行表。
- Redis 不可用时 fail-closed，不回退内存或 PostgreSQL。
- logout/switch-person 撤销 family，防止旧 WebView/标签页复活。
- 实现 concurrent rotate/revoke、stale authz version 和 Redis failover fixtures。

**Validation**

- session lifecycle
- replay/reuse
- Redis unavailable
- family revocation
- concurrency

**Acceptance**

- 唯一 Session authority 明确
- 任何无法确认的会话均不恢复业务 UI

**Independent acceptance procedure**

- Implementation/testing agents finish and return exact commands, evidence and limitations.
- The parent inspects the actual integrated diff before spawning acceptance agents.
- Run the agents listed in `Acceptance agents` against the same final commit/tree digest.
- Required Sol outcomes are advisory but mandatory evidence for the parent Gate.
- A Sol `REJECT`, `BLOCKED` or missing required report prevents task acceptance.
- Acceptance agents are read-only and never fix the task they review.

**Evidence**

- session-authority-receipt.json
- acceptance report(s) bound to the final source/result commit

**Stop immediately if**

- 需要修改未在 allowed_paths 中声明的路径
- 需要改变已接受 ADR、身份/Session、授权/Scope、TLS、原生权限或数据所有权边界
- 需要新增生产依赖、破坏性数据库操作或对外部系统写入，但任务未明确授权
- 当前工作树包含无法归属的用户修改；若本任务主动采用可选旧源，则该旧源无法绑定固定 commit

### HW02-05 — 实现 Authz Core 与 Scope Resolver

| Field | Value |
| --- | --- |
| Primary owner | `parent_codex` |
| Supporting agents | `terra_contracts`, `terra_tester`, `terra_security` |
| Mode | `workspace-write` |
| Parallel group | `D` |
| Risk | `critical` |
| Task dependencies | `HW02-01`, `HW02-04` |
| Acceptance tier | `sol-architecture-security` |
| Acceptance agents | `terra_reviewer`, `terra_security`, `sol_architecture_security` |
| Required acceptance outcome | `ACCEPT` |

**Allowed paths**

- `packages/authz-core/**`
- `services/gateway/src/authz/**`
- `database/prisma/models/config.prisma`

**Objective**

以功能权限、数据范围和当前 Principal 版本三层裁决所有请求。

**Implementation steps**

- 定义 capability/action/resource policy model，default deny、explicit deny first。
- Scope 只允许 none/all/restricted，空和解析失败为 none。
- 支持 hospital/campus/department/self/assigned/project 范围。
- 策略发布有 immutable policyReleaseId 和 authzVersion。
- 提供 owner/reviewer 分离的策略 seed 和 negative fixtures。

**Validation**

- permission matrix
- empty/invalid scope
- stale authz version
- deny precedence

**Acceptance**

- 客户端隐藏按钮不是权限边界
- 服务端每次写命令重新裁决

**Independent acceptance procedure**

- Implementation/testing agents finish and return exact commands, evidence and limitations.
- The parent inspects the actual integrated diff before spawning acceptance agents.
- Run the agents listed in `Acceptance agents` against the same final commit/tree digest.
- Required Sol outcomes are advisory but mandatory evidence for the parent Gate.
- A Sol `REJECT`, `BLOCKED` or missing required report prevents task acceptance.
- Acceptance agents are read-only and never fix the task they review.

**Evidence**

- authz-scope-matrix.json
- acceptance report(s) bound to the final source/result commit

**Stop immediately if**

- 需要修改未在 allowed_paths 中声明的路径
- 需要改变已接受 ADR、身份/Session、授权/Scope、TLS、原生权限或数据所有权边界
- 需要新增生产依赖、破坏性数据库操作或对外部系统写入，但任务未明确授权
- 当前工作树包含无法归属的用户修改；若本任务主动采用可选旧源，则该旧源无法绑定固定 commit

### HW02-06 — 建立 Capability Registry 身份入口

| Field | Value |
| --- | --- |
| Primary owner | `terra_worker` |
| Supporting agents | `terra_contracts`, `terra_tester` |
| Mode | `workspace-write` |
| Parallel group | `E` |
| Risk | `medium` |
| Task dependencies | `HW02-05` |
| Acceptance tier | `terra` |
| Acceptance agents | `terra_reviewer` |
| Required acceptance outcome | `APPROVED` |

**Allowed paths**

- `packages/capability-contracts/**`
- `services/gateway/src/registry/**`
- `database/prisma/models/config.prisma`

**Objective**

建立应用/能力注册表，为后续空间、卡片、事件、深链和权限提供唯一元数据源。

**Implementation steps**

- 定义 capability id/version/kind/routes/permissions/events/cards/minRuntime/release。
- Registry 只指向 immutable release，不携带可执行远程 JS。
- 用户可见能力由 Principal+policy+scope 计算。
- Legacy URL 不作为 canonical capability。

**Validation**

- registry schema
- unknown capability
- disabled/version mismatch tests

**Acceptance**

- 不存在第二份静态应用清单
- 未授权 capability 不进入导航

**Independent acceptance procedure**

- Implementation/testing agents finish and return exact commands, evidence and limitations.
- The parent inspects the actual integrated diff before spawning acceptance agents.
- Run the agents listed in `Acceptance agents` against the same final commit/tree digest.
- Required Sol outcomes are advisory but mandatory evidence for the parent Gate.
- A Sol `REJECT`, `BLOCKED` or missing required report prevents task acceptance.
- Acceptance agents are read-only and never fix the task they review.

**Evidence**

- capability-registry-snapshot.json
- acceptance report(s) bound to the final source/result commit

**Stop immediately if**

- 需要修改未在 allowed_paths 中声明的路径
- 需要改变已接受 ADR、身份/Session、授权/Scope、TLS、原生权限或数据所有权边界
- 需要新增生产依赖、破坏性数据库操作或对外部系统写入，但任务未明确授权
- 当前工作树包含无法归属的用户修改；若本任务主动采用可选旧源，则该旧源无法绑定固定 commit

### HW02-07 — Browser/Desktop Session 等价合同

| Field | Value |
| --- | --- |
| Primary owner | `terra_tester` |
| Supporting agents | `terra_browser`, `terra_security` |
| Mode | `workspace-write` |
| Parallel group | `F` |
| Risk | `high` |
| Task dependencies | `HW02-03`, `HW02-04`, `HW02-05` |
| Acceptance tier | `sol-acceptance` |
| Acceptance agents | `terra_reviewer`, `sol_acceptance` |
| Required acceptance outcome | `ACCEPT` |

**Allowed paths**

- `services/gateway/test/**`
- `scripts/acceptance/identity/**`
- `docs/security/**`

**Objective**

用 synthetic 身份证明浏览器和 Tauri WebView 获取相同 Principal、policy、scope 和撤销行为。

**Implementation steps**

- 先使用普通浏览器和受控 WebView fixture，不要求完成正式桌面 UI。
- 覆盖 login/session/unauthorized/logout/switch-person/lock resume。
- 对比 principalId、identityVersion、authzVersion、policyReleaseId、scope。
- Redis/BFF 暂不可用时保持隐私遮罩/拒绝，不恢复旧用户。

**Validation**

- browser acceptance
- webview session probe
- failure matrix

**Acceptance**

- 两类客户端无第二套 token/session
- 共享终端不跨用户残留

**Independent acceptance procedure**

- Implementation/testing agents finish and return exact commands, evidence and limitations.
- The parent inspects the actual integrated diff before spawning acceptance agents.
- Run the agents listed in `Acceptance agents` against the same final commit/tree digest.
- Required Sol outcomes are advisory but mandatory evidence for the parent Gate.
- A Sol `REJECT`, `BLOCKED` or missing required report prevents task acceptance.
- Acceptance agents are read-only and never fix the task they review.

**Evidence**

- identity-primary-chain-receipt.json
- acceptance report(s) bound to the final source/result commit

**Stop immediately if**

- 需要修改未在 allowed_paths 中声明的路径
- 需要改变已接受 ADR、身份/Session、授权/Scope、TLS、原生权限或数据所有权边界
- 需要新增生产依赖、破坏性数据库操作或对外部系统写入，但任务未明确授权
- 当前工作树包含无法归属的用户修改；若本任务主动采用可选旧源，则该旧源无法绑定固定 commit

### HW02-08 — Identity & Access Gate

| Field | Value |
| --- | --- |
| Primary owner | `parent_codex` |
| Supporting agents | `terra_reviewer`, `terra_security` |
| Mode | `read-only` |
| Parallel group | `G` |
| Risk | `critical` |
| Task dependencies | `HW02-03`, `HW02-04`, `HW02-05`, `HW02-06`, `HW02-07` |
| Acceptance tier | `sol-phase-gate` |
| Acceptance agents | `terra_reviewer`, `terra_security`, `sol_architecture_security`, `sol_phase_gate` |
| Required acceptance outcome | `PASS_RECOMMENDED` |

**Allowed paths**

- `services/gateway/**`
- `packages/identity-*/**`
- `packages/authz-core/**`
- `database/prisma/models/iam.prisma`
- `database/prisma/models/config.prisma`

**Objective**

确认人员中心、Session、权限和 Scope 可以作为所有后续服务的唯一入口。

**Implementation steps**

- 复核 token/cookie/CSRF/redirect/session/authz/scope/registry。
- 扫描 PostgreSQL Session、localStorage token、客户端 secret 和隐式 allow。
- 执行 Redis/Identity upstream failure drills。
- 签发 G02。

**Validation**

- full identity suite
- security scan
- failure drills
- independent review

**Acceptance**

- P0/P1 为零
- 允许 Workspace 与平台服务接入真实 Principal

**Independent acceptance procedure**

- Implementation/testing agents finish and return exact commands, evidence and limitations.
- The parent inspects the actual integrated diff before spawning acceptance agents.
- Run the agents listed in `Acceptance agents` against the same final commit/tree digest.
- Required Sol outcomes are advisory but mandatory evidence for the parent Gate.
- A Sol `REJECT`, `BLOCKED` or missing required report prevents task acceptance.
- Acceptance agents are read-only and never fix the task they review.

**Evidence**

- G02-gate-decision.md
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
docs/program/phases/HW-02-identity-person-context.md and docs/program/tasks/HW-02.yaml.

Execute only HW-02. Use Luna for narrow discovery/docs/fixtures, Terra for bounded implementation/testing/review,
and the task matrix's Sol route for independent acceptance. Run the phase-level Sol Gate agents only after the
final integrated diff and evidence are frozen. Parent Codex makes the final Gate decision.
Do not begin the next phase, push, merge, release or change external systems without explicit authorization.
```
