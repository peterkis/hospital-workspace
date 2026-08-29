# HW-03 — Tauri 可信桌面壳与统一 Workspace Web

## Goal

迁移已经验证的 Tauri/WebView2 安全边界，新建 React/Vite Workspace；桌面与浏览器使用同一不可变远程 SPA 和 BFF，不在 Rust 中托管业务状态或身份 Token。

## Dependencies

`HW-01`, `HW-02`

A dependent phase must be `PASS`. `CONDITIONAL` does not automatically authorize this phase.

## Deliverables

- `apps/desktop-shell` Tauri 2 Trusted Shell
- `apps/workspace-web` React/Vite 基础
- 不可变 Workspace release 与 exact origin/path/label binding
- 三栏/四区布局、路由、Deep Link 和错误遮罩
- Browser/Desktop 同一 UI build
- Tauri T25～T27 核心安全测试迁移

## Out of scope

- 真实业务卡片
- 通用 Tauri 原生桥
- 托盘通知/灵动岛业务正文
- 本地 Python/LLM/数据库

## Phase acceptance

- Tauri 安全场景不减少；若采用可选旧源则附来源收据，否则以新实现测试证据为准
- Remote Workspace capability 默认 none
- Browser/Tauri 加载同一 immutable Workspace release
- Profile、锁屏恢复、换人和退出无跨用户残留
- Deep Link 不能导航任意 URL 或携带敏感正文

## Gates

- G03-1 Tauri 安全实现与测试保真
- G03-2 Remote Workspace 零原生权限
- G03-3 单一同源不可变 release
- G03-4 共享终端 Profile/Resume
- G03-5 Browser/Desktop UI 等价

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
| `HW03-01` | 迁移 Tauri Trust Policy 与 Runtime | `parent_codex` | terra_migrator, terra_tester, terra_security | `critical` | `A` | `sol-architecture-security` | terra_reviewer, terra_security, sol_architecture_security |
| `HW03-02` | 创建 Workspace Web 骨架 | `terra_worker` | luna_fixtures, terra_reviewer | `medium` | `A` | `terra` | terra_reviewer |
| `HW03-03` | 建立 Workspace Release Contract | `terra_contracts` | luna_fixtures, terra_tester | `high` | `B` | `sol-acceptance` | terra_reviewer, sol_acceptance |
| `HW03-04` | 绑定 Workspace WebView 安全策略 | `parent_codex` | terra_tester, terra_security | `critical` | `C` | `sol-architecture-security` | terra_reviewer, terra_security, sol_architecture_security |
| `HW03-05` | 实现安全 Deep Link Intent | `parent_codex` | terra_contracts, terra_tester, terra_security | `high` | `D` | `sol-acceptance` | terra_reviewer, sol_acceptance |
| `HW03-06` | 迁移 Profile、Logout、Switch-Person 与 Trusted Resume | `terra_tester` | terra_migrator, terra_security | `critical` | `E` | `sol-architecture-security` | terra_reviewer, terra_security, sol_architecture_security |
| `HW03-07` | Browser/Desktop Workspace E2E | `terra_browser` | terra_tester, terra_reviewer | `high` | `F` | `sol-acceptance` | terra_reviewer, sol_acceptance |
| `HW03-08` | Desktop/Web Foundation Gate | `parent_codex` | terra_reviewer, terra_security | `critical` | `G` | `sol-phase-gate` | terra_reviewer, terra_security, sol_architecture_security, sol_phase_gate |

## Detailed implementation plan

### HW03-01 — 迁移 Tauri Trust Policy 与 Runtime

| Field | Value |
| --- | --- |
| Primary owner | `parent_codex` |
| Supporting agents | `terra_migrator`, `terra_tester`, `terra_security` |
| Mode | `workspace-write` |
| Parallel group | `A` |
| Risk | `critical` |
| Task dependencies | — |
| Acceptance tier | `sol-architecture-security` |
| Acceptance agents | `terra_reviewer`, `terra_security`, `sol_architecture_security` |
| Required acceptance outcome | `ACCEPT` |

**Allowed paths**

- `apps/desktop-shell/**`
- `docs/migration/**`
- `docs/security/**`

**Objective**

从 legacy 固定 commit 复制并重绑定 Tauri 2、WebView2、Profile、Session termination、trusted resume 和证书策略。

**Implementation steps**

- 迁移 `desktop-runtime` 的 Rust workspace 和测试，重命名 crate/package，不复制历史 Evidence/临时证书/target。
- 保留 exact origin/path/label、remote permission none、InPrivate profile、fail-closed cleanup。
- 把旧 Clinical Spark bindings 替换为新 Workspace Registry contract，不临时放宽。
- 更新命令到 pnpm，但不改安全语义。
- 生成逐文件来源和测试迁移收据。

**Validation**

- cargo test trust-policy
- Windows target cargo check
- legacy-vs-new behavior matrix

**Acceptance**

- 安全测试数量和关键场景不减少
- 不存在 generic shell/fs/http/process plugin

**Independent acceptance procedure**

- Implementation/testing agents finish and return exact commands, evidence and limitations.
- The parent inspects the actual integrated diff before spawning acceptance agents.
- Run the agents listed in `Acceptance agents` against the same final commit/tree digest.
- Required Sol outcomes are advisory but mandatory evidence for the parent Gate.
- A Sol `REJECT`, `BLOCKED` or missing required report prevents task acceptance.
- Acceptance agents are read-only and never fix the task they review.

**Evidence**

- desktop-migration-receipt.json
- rust-test-report.md
- acceptance report(s) bound to the final source/result commit

**Stop immediately if**

- 需要修改未在 allowed_paths 中声明的路径
- 需要改变已接受 ADR、身份/Session、授权/Scope、TLS、原生权限或数据所有权边界
- 需要新增生产依赖、破坏性数据库操作或对外部系统写入，但任务未明确授权
- 当前工作树包含无法归属的用户修改；若本任务主动采用可选旧源，则该旧源无法绑定固定 commit

### HW03-02 — 创建 Workspace Web 骨架

| Field | Value |
| --- | --- |
| Primary owner | `terra_worker` |
| Supporting agents | `luna_fixtures`, `terra_reviewer` |
| Mode | `workspace-write` |
| Parallel group | `A` |
| Risk | `medium` |
| Task dependencies | — |
| Acceptance tier | `terra` |
| Acceptance agents | `terra_reviewer` |
| Required acceptance outcome | `APPROVED` |

**Allowed paths**

- `apps/workspace-web/**`
- `packages/ui/**`
- `packages/workspace-contracts/**`

**Objective**

建立 React 19 + Vite 8 的单一工作空间前端，不复制任何旧 Next.js 页面。

**Implementation steps**

- 建立 App bootstrap、router、error boundary、query client、state boundary、i18n 和 theme tokens。
- 布局包含导航栏、空间列表、主时间线、右侧 Canvas/Context。
- 初始只使用 synthetic fixture，不调用业务 API。
- 支持 Chrome 120 兼容下限和 WebView2。
- 建立 accessibility、keyboard、reduced motion 和 bundle budget。

**Validation**

- unit/component tests
- production build
- a11y smoke
- base path test

**Acceptance**

- 无 Next.js/Prisma/server-only
- 同一 build 可由浏览器与 Tauri 加载

**Independent acceptance procedure**

- Implementation/testing agents finish and return exact commands, evidence and limitations.
- The parent inspects the actual integrated diff before spawning acceptance agents.
- Run the agents listed in `Acceptance agents` against the same final commit/tree digest.
- Required Sol outcomes are advisory but mandatory evidence for the parent Gate.
- A Sol `REJECT`, `BLOCKED` or missing required report prevents task acceptance.
- Acceptance agents are read-only and never fix the task they review.

**Evidence**

- workspace-shell-screenshots
- bundle-report.json
- acceptance report(s) bound to the final source/result commit

**Stop immediately if**

- 需要修改未在 allowed_paths 中声明的路径
- 需要改变已接受 ADR、身份/Session、授权/Scope、TLS、原生权限或数据所有权边界
- 需要新增生产依赖、破坏性数据库操作或对外部系统写入，但任务未明确授权
- 当前工作树包含无法归属的用户修改；若本任务主动采用可选旧源，则该旧源无法绑定固定 commit

### HW03-03 — 建立 Workspace Release Contract

| Field | Value |
| --- | --- |
| Primary owner | `terra_contracts` |
| Supporting agents | `luna_fixtures`, `terra_tester` |
| Mode | `workspace-write` |
| Parallel group | `B` |
| Risk | `high` |
| Task dependencies | `HW03-02` |
| Acceptance tier | `sol-acceptance` |
| Acceptance agents | `terra_reviewer`, `sol_acceptance` |
| Required acceptance outcome | `ACCEPT` |

**Allowed paths**

- `packages/release-contracts/**`
- `apps/workspace-web/scripts/**`
- `services/gateway/src/registry/**`
- `infrastructure/nginx/**`

**Objective**

将 Workspace 静态制品发布到不可变版本路径并由 Capability Registry 指针选择。

**Implementation steps**

- release id 绑定 source commit、lock、assets hashes、minDesktopRuntime。
- 路径形如 `/apps/workspace/<releaseId>/`，禁止 mutable `latest` 作为启动真相。
- Nginx cache headers 区分 immutable assets 与入口。
- 保留上一 approved release，支持原子指针回滚。

**Validation**

- asset closure
- hash tamper
- base/deep-link refresh
- rollback pointer

**Acceptance**

- Tauri 与 Browser 加载同一 releaseId
- 制品不依赖构建机路径

**Independent acceptance procedure**

- Implementation/testing agents finish and return exact commands, evidence and limitations.
- The parent inspects the actual integrated diff before spawning acceptance agents.
- Run the agents listed in `Acceptance agents` against the same final commit/tree digest.
- Required Sol outcomes are advisory but mandatory evidence for the parent Gate.
- A Sol `REJECT`, `BLOCKED` or missing required report prevents task acceptance.
- Acceptance agents are read-only and never fix the task they review.

**Evidence**

- workspace-release-manifest.json
- acceptance report(s) bound to the final source/result commit

**Stop immediately if**

- 需要修改未在 allowed_paths 中声明的路径
- 需要改变已接受 ADR、身份/Session、授权/Scope、TLS、原生权限或数据所有权边界
- 需要新增生产依赖、破坏性数据库操作或对外部系统写入，但任务未明确授权
- 当前工作树包含无法归属的用户修改；若本任务主动采用可选旧源，则该旧源无法绑定固定 commit

### HW03-04 — 绑定 Workspace WebView 安全策略

| Field | Value |
| --- | --- |
| Primary owner | `parent_codex` |
| Supporting agents | `terra_tester`, `terra_security` |
| Mode | `workspace-write` |
| Parallel group | `C` |
| Risk | `critical` |
| Task dependencies | `HW03-01`, `HW03-03` |
| Acceptance tier | `sol-architecture-security` |
| Acceptance agents | `terra_reviewer`, `terra_security`, `sol_architecture_security` |
| Required acceptance outcome | `ACCEPT` |

**Allowed paths**

- `apps/desktop-shell/src-tauri/**`
- `apps/desktop-shell/crates/trust-policy/**`

**Objective**

将 Tauri 窗口精确绑定到 Registry 批准的 Workspace origin/path/release，并保持 remote capability none。

**Implementation steps**

- 窗口创建前安装 WebView2 navigation/download/iframe/new-window guards。
- 只允许自身 HTTPS immutable path 与明确登录跳转。
- 所有 deny 先持久审计再关闭；审计失败 fail-closed。
- Rust 不能读取 Cookie、Token、localStorage 或业务数据。
- 未知 Registry 字段、版本、label、permission 全部拒绝。

**Validation**

- navigation matrix
- wrong origin/path/label
- audit failure
- certificate policy

**Acceptance**

- remote Workspace 无 native command
- 任何安全钩子未就绪时不导航

**Independent acceptance procedure**

- Implementation/testing agents finish and return exact commands, evidence and limitations.
- The parent inspects the actual integrated diff before spawning acceptance agents.
- Run the agents listed in `Acceptance agents` against the same final commit/tree digest.
- Required Sol outcomes are advisory but mandatory evidence for the parent Gate.
- A Sol `REJECT`, `BLOCKED` or missing required report prevents task acceptance.
- Acceptance agents are read-only and never fix the task they review.

**Evidence**

- webview-binding-receipt.json
- acceptance report(s) bound to the final source/result commit

**Stop immediately if**

- 需要修改未在 allowed_paths 中声明的路径
- 需要改变已接受 ADR、身份/Session、授权/Scope、TLS、原生权限或数据所有权边界
- 需要新增生产依赖、破坏性数据库操作或对外部系统写入，但任务未明确授权
- 当前工作树包含无法归属的用户修改；若本任务主动采用可选旧源，则该旧源无法绑定固定 commit

### HW03-05 — 实现安全 Deep Link Intent

| Field | Value |
| --- | --- |
| Primary owner | `parent_codex` |
| Supporting agents | `terra_contracts`, `terra_tester`, `terra_security` |
| Mode | `workspace-write` |
| Parallel group | `D` |
| Risk | `high` |
| Task dependencies | `HW03-04` |
| Acceptance tier | `sol-acceptance` |
| Acceptance agents | `terra_reviewer`, `sol_acceptance` |
| Required acceptance outcome | `ACCEPT` |

**Allowed paths**

- `packages/deep-link-contracts/**`
- `apps/desktop-shell/src-tauri/**`
- `apps/workspace-web/src/routing/**`

**Objective**

支持 `hospital-workspace://capability/resource` 唤起，但只传递最小 route intent，不携带敏感正文或任意 URL。

**Implementation steps**

- 定义 allowlisted grammar、长度、字符、capability/version。
- 未登录/锁屏时队列，Trusted Resume 后交给 Workspace router。
- 拒绝 file/http/javascript/traversal/oversize。
- Intent 只引用 resource id，详情由服务端重新授权查询。

**Validation**

- parser property tests
- malformed/fuzz
- locked/resume
- stale user

**Acceptance**

- 无法利用 deep link 绕过 Registry 或权限
- 切换人员后旧 intent 被丢弃

**Independent acceptance procedure**

- Implementation/testing agents finish and return exact commands, evidence and limitations.
- The parent inspects the actual integrated diff before spawning acceptance agents.
- Run the agents listed in `Acceptance agents` against the same final commit/tree digest.
- Required Sol outcomes are advisory but mandatory evidence for the parent Gate.
- A Sol `REJECT`, `BLOCKED` or missing required report prevents task acceptance.
- Acceptance agents are read-only and never fix the task they review.

**Evidence**

- deep-link-matrix.json
- acceptance report(s) bound to the final source/result commit

**Stop immediately if**

- 需要修改未在 allowed_paths 中声明的路径
- 需要改变已接受 ADR、身份/Session、授权/Scope、TLS、原生权限或数据所有权边界
- 需要新增生产依赖、破坏性数据库操作或对外部系统写入，但任务未明确授权
- 当前工作树包含无法归属的用户修改；若本任务主动采用可选旧源，则该旧源无法绑定固定 commit

### HW03-06 — 迁移 Profile、Logout、Switch-Person 与 Trusted Resume

| Field | Value |
| --- | --- |
| Primary owner | `terra_tester` |
| Supporting agents | `terra_migrator`, `terra_security` |
| Mode | `workspace-write` |
| Parallel group | `E` |
| Risk | `critical` |
| Task dependencies | `HW03-01`, `HW02-07` |
| Acceptance tier | `sol-architecture-security` |
| Acceptance agents | `terra_reviewer`, `terra_security`, `sol_architecture_security` |
| Required acceptance outcome | `ACCEPT` |

**Allowed paths**

- `apps/desktop-shell/**`
- `scripts/acceptance/desktop/**`

**Objective**

在新 Gateway/Workspace 上复验旧 T26/T27 的共享终端安全机制。

**Implementation steps**

- 复验 launch-scoped shared InPrivate Profile。
- logout/switch-person 等待服务端 2xx/303 撤销确认；失败保持关闭/遮罩。
- 关闭全部 WebView、确认 BrowserProcessExited、删除 UDF。
- 锁屏、睡眠、RDP 断开、第二实例都进入 Trusted Resume Gate。
- 网络/Redis 暂不可用时遮罩重试，不显示缓存用户。

**Validation**

- lifecycle tests
- forced failure
- stale response
- crash cleanup

**Acceptance**

- 关键 T25/T26/T27 场景完整
- 无跨用户本地状态

**Independent acceptance procedure**

- Implementation/testing agents finish and return exact commands, evidence and limitations.
- The parent inspects the actual integrated diff before spawning acceptance agents.
- Run the agents listed in `Acceptance agents` against the same final commit/tree digest.
- Required Sol outcomes are advisory but mandatory evidence for the parent Gate.
- A Sol `REJECT`, `BLOCKED` or missing required report prevents task acceptance.
- Acceptance agents are read-only and never fix the task they review.

**Evidence**

- desktop-lifecycle-receipt.json
- acceptance report(s) bound to the final source/result commit

**Stop immediately if**

- 需要修改未在 allowed_paths 中声明的路径
- 需要改变已接受 ADR、身份/Session、授权/Scope、TLS、原生权限或数据所有权边界
- 需要新增生产依赖、破坏性数据库操作或对外部系统写入，但任务未明确授权
- 当前工作树包含无法归属的用户修改；若本任务主动采用可选旧源，则该旧源无法绑定固定 commit

### HW03-07 — Browser/Desktop Workspace E2E

| Field | Value |
| --- | --- |
| Primary owner | `terra_browser` |
| Supporting agents | `terra_tester`, `terra_reviewer` |
| Mode | `workspace-write` |
| Parallel group | `F` |
| Risk | `high` |
| Task dependencies | `HW03-02`, `HW03-04`, `HW03-06` |
| Acceptance tier | `sol-acceptance` |
| Acceptance agents | `terra_reviewer`, `sol_acceptance` |
| Required acceptance outcome | `ACCEPT` |

**Allowed paths**

- `apps/workspace-web/e2e/**`
- `scripts/acceptance/desktop/**`
- `evidence/HW-03/**`

**Objective**

证明两个客户端看到相同 release、Principal、权限、基础导航和错误遮罩。

**Implementation steps**

- 使用 synthetic identity 和 isolation environment。
- Chrome 和真实 Tauri/WebView2 分别登录、导航、锁屏恢复、退出。
- 捕获 console/network/page error、窗口和 session receipts。
- Linux 浏览器结果不能替代 Windows WebView2。

**Validation**

- Playwright browser
- Windows Tauri probe
- session equality

**Acceptance**

- 两端行为一致
- 证据无秘密或患者数据

**Independent acceptance procedure**

- Implementation/testing agents finish and return exact commands, evidence and limitations.
- The parent inspects the actual integrated diff before spawning acceptance agents.
- Run the agents listed in `Acceptance agents` against the same final commit/tree digest.
- Required Sol outcomes are advisory but mandatory evidence for the parent Gate.
- A Sol `REJECT`, `BLOCKED` or missing required report prevents task acceptance.
- Acceptance agents are read-only and never fix the task they review.

**Evidence**

- browser-desktop-e2e-receipt.json
- acceptance report(s) bound to the final source/result commit

**Stop immediately if**

- 需要修改未在 allowed_paths 中声明的路径
- 需要改变已接受 ADR、身份/Session、授权/Scope、TLS、原生权限或数据所有权边界
- 需要新增生产依赖、破坏性数据库操作或对外部系统写入，但任务未明确授权
- 当前工作树包含无法归属的用户修改；若本任务主动采用可选旧源，则该旧源无法绑定固定 commit

### HW03-08 — Desktop/Web Foundation Gate

| Field | Value |
| --- | --- |
| Primary owner | `parent_codex` |
| Supporting agents | `terra_reviewer`, `terra_security` |
| Mode | `read-only` |
| Parallel group | `G` |
| Risk | `critical` |
| Task dependencies | `HW03-04`, `HW03-05`, `HW03-06`, `HW03-07` |
| Acceptance tier | `sol-phase-gate` |
| Acceptance agents | `terra_reviewer`, `terra_security`, `sol_architecture_security`, `sol_phase_gate` |
| Required acceptance outcome | `PASS_RECOMMENDED` |

**Allowed paths**

- `apps/desktop-shell/**`
- `apps/workspace-web/**`
- `packages/deep-link-contracts/**`
- `packages/release-contracts/**`

**Objective**

确认桌面化只改变载体和原生体验，不创建第二套身份或扩大远程权限。

**Implementation steps**

- 审查 Tauri、WebView2、release、deep link、session、a11y 和 evidence。
- 扫描 token custody、native plugins、mutable URL、旧 Mini App bindings。
- 签发 G03。

**Validation**

- full Rust/TS/browser/desktop checks
- security review

**Acceptance**

- P0/P1 为零
- 允许后续平台事件和业务能力进入 Workspace

**Independent acceptance procedure**

- Implementation/testing agents finish and return exact commands, evidence and limitations.
- The parent inspects the actual integrated diff before spawning acceptance agents.
- Run the agents listed in `Acceptance agents` against the same final commit/tree digest.
- Required Sol outcomes are advisory but mandatory evidence for the parent Gate.
- A Sol `REJECT`, `BLOCKED` or missing required report prevents task acceptance.
- Acceptance agents are read-only and never fix the task they review.

**Evidence**

- G03-gate-decision.md
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
docs/program/phases/HW-03-desktop-web-shell.md and docs/program/tasks/HW-03.yaml.

Execute only HW-03. Use Luna for narrow discovery/docs/fixtures, Terra for bounded implementation/testing/review,
and the task matrix's Sol route for independent acceptance. Run the phase-level Sol Gate agents only after the
final integrated diff and evidence are frozen. Parent Codex makes the final Gate decision.
Do not begin the next phase, push, merge, release or change external systems without explicit authorization.
```
