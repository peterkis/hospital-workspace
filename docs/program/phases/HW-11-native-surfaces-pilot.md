# HW-11 — 灵动岛、系统通知、发布硬化与受控试点

## Goal

在 Workspace 主链稳定后，通过一个最小、单向、强校验的 Tauri Surface Bridge 统一托盘、Windows 通知和灵动岛；完成不可变服务端制品、MSI、浏览器/桌面 E2E、无外网发布和受控试点。

## Dependencies

`HW-06`, `HW-07`, `HW-08`, `HW-09`, `HW-10`

A dependent phase must be `PASS`. `CONDITIONAL` does not automatically authorize this phase.

## Deliverables

- `surface-contracts` 与最小 Native Bridge ADR
- Tray/Toast/Island 统一投影与 Deep Link
- Windows MSI 安装/升级/卸载/回滚
- 服务端 immutable release 与 Nginx/systemd
- Browser/Desktop/Anolis 真实验收
- 监控、备份、故障演练和运行手册
- G11-PILOT 决议

## Out of scope

- 通用 Tauri API
- 通知显示患者敏感正文
- 自动全院发布
- 未完成容量/HA 前的生产承诺

## Phase acceptance

- Native Bridge 只有一个最小命令且 exact caller/Rust validation
- Tray/Toast/Island 不暴露患者和财务敏感正文
- MSI、WebView2、不可变服务端制品和回滚有真实证据
- Browser/Desktop/Anolis 环境声明真实
- 安全、恢复、运维和用户体验满足受控试点

## Gates

- G11-1 Native Bridge 最小权限
- G11-2 锁屏/共享终端通知隐私
- G11-3 MSI 与 WebView2 生命周期
- G11-4 Server immutable/no-egress release
- G11-5 故障恢复与受控试点

## Sol acceptance policy

| Scope | Required route |
| --- | --- |
| Low / medium task | `terra_reviewer`; no task-level Sol required |
| High-risk task | `sol_acceptance` after Terra review |
| Critical architecture/security task | `sol_architecture_security` after Terra review/security review |
| Critical task primarily proving E2E/acceptance evidence | `sol_acceptance` |
| Phase exit | `sol_architecture_security`, `sol_phase_gate` |
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
| `HW11-01` | 定义 Surface Event 与隐私策略 | `terra_contracts` | luna_fixtures, terra_security | `critical` | `A` | `sol-architecture-security` | terra_reviewer, terra_security, sol_architecture_security |
| `HW11-02` | 接受并实现最小 Workspace-only Native Bridge | `parent_codex` | terra_worker, terra_tester, terra_security | `critical` | `B` | `sol-architecture-security` | terra_reviewer, terra_security, sol_architecture_security |
| `HW11-03` | 实现 Tray、Windows Toast 与 Island Projection | `terra_worker` | terra_tester, terra_browser | `high` | `C` | `sol-acceptance` | terra_reviewer, sol_acceptance |
| `HW11-04` | 构建 Desktop MSI 与 WebView2 发布闭包 | `parent_codex` | terra_tester, terra_security | `critical` | `D` | `sol-architecture-security` | terra_reviewer, terra_security, sol_architecture_security |
| `HW11-05` | 构建 Server Immutable Release 与 No-Egress 安装 | `parent_codex` | terra_tester, terra_reviewer | `critical` | `D` | `sol-architecture-security` | terra_reviewer, terra_security, sol_architecture_security |
| `HW11-06` | 建立监控、备份、恢复与运行手册 | `terra_worker` | luna_docs, terra_tester | `high` | `E` | `sol-acceptance` | terra_reviewer, sol_acceptance |
| `HW11-07` | 真实 Browser/Desktop/Anolis 受控试点验收 | `terra_tester` | terra_browser, terra_security, terra_reviewer | `critical` | `F` | `sol-acceptance` | terra_reviewer, terra_security, sol_acceptance |
| `HW11-08` | G11-PILOT 人工决议 | `parent_codex` | terra_reviewer, terra_security | `critical` | `G` | `sol-phase-gate` | terra_reviewer, terra_security, sol_architecture_security, sol_phase_gate |

## Detailed implementation plan

### HW11-01 — 定义 Surface Event 与隐私策略

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

- `packages/surface-contracts/**`
- `docs/security/**`

**Objective**

定义可投影到原生表面的最小字段、敏感度、过期、去重和 Deep Link。

**Implementation steps**

- 仅允许 eventId/type/priority/title/summary/progress/deepLink/expiresAt。
- clinical/financial sensitivity 强制 generic summary。
- 禁止患者名、住院号、诊断、证件、详细费用和任意 HTML/URL。
- 定义锁屏、未登录、换人和 stale event 行为。

**Validation**

- PHI/PII fixtures
- oversize
- deep link
- unknown fields

**Acceptance**

- 任意未验证 payload 被拒
- Surface 不成为业务真相

**Independent acceptance procedure**

- Implementation/testing agents finish and return exact commands, evidence and limitations.
- The parent inspects the actual integrated diff before spawning acceptance agents.
- Run the agents listed in `Acceptance agents` against the same final commit/tree digest.
- Required Sol outcomes are advisory but mandatory evidence for the parent Gate.
- A Sol `REJECT`, `BLOCKED` or missing required report prevents task acceptance.
- Acceptance agents are read-only and never fix the task they review.

**Evidence**

- surface-contract-snapshot.json
- acceptance report(s) bound to the final source/result commit

**Stop immediately if**

- 需要修改未在 allowed_paths 中声明的路径
- 需要改变已接受 ADR、身份/Session、授权/Scope、TLS、原生权限或数据所有权边界
- 需要新增生产依赖、破坏性数据库操作或对外部系统写入，但任务未明确授权
- 当前工作树包含无法归属的用户修改；若本任务主动采用可选旧源，则该旧源无法绑定固定 commit

### HW11-02 — 接受并实现最小 Workspace-only Native Bridge

| Field | Value |
| --- | --- |
| Primary owner | `parent_codex` |
| Supporting agents | `terra_worker`, `terra_tester`, `terra_security` |
| Mode | `workspace-write` |
| Parallel group | `B` |
| Risk | `critical` |
| Task dependencies | `HW11-01`, `HW03-04` |
| Acceptance tier | `sol-architecture-security` |
| Acceptance agents | `terra_reviewer`, `terra_security`, `sol_architecture_security` |
| Required acceptance outcome | `ACCEPT` |

**Allowed paths**

- `docs/adr/**`
- `apps/desktop-shell/src-tauri/**`
- `apps/desktop-shell/src-tauri/capabilities/**`

**Objective**

新增唯一受控 `publish_surface_event`/等价命令，精确绑定 Workspace label/origin/path，并在 Rust 端重新验证。

**Implementation steps**

- 先接受独立 ADR，列出 threat model、rollback 和 kill switch。
- Legacy/其他 remote webview 仍为 permission none。
- Rust 强类型解析、长度/枚举/敏感度/deepLink 验证。
- eventId 去重、速率限制、过期和持久审计。
- 禁止通用 window/fs/http/shell/process/clipboard 能力。

**Validation**

- wrong caller
- legacy webview
- fuzz
- replay
- audit failure
- kill switch

**Acceptance**

- 任何 guard/audit 失败 fail-closed
- 桥接不能执行任意命令

**Independent acceptance procedure**

- Implementation/testing agents finish and return exact commands, evidence and limitations.
- The parent inspects the actual integrated diff before spawning acceptance agents.
- Run the agents listed in `Acceptance agents` against the same final commit/tree digest.
- Required Sol outcomes are advisory but mandatory evidence for the parent Gate.
- A Sol `REJECT`, `BLOCKED` or missing required report prevents task acceptance.
- Acceptance agents are read-only and never fix the task they review.

**Evidence**

- native-bridge-security-receipt.json
- acceptance report(s) bound to the final source/result commit

**Stop immediately if**

- 需要修改未在 allowed_paths 中声明的路径
- 需要改变已接受 ADR、身份/Session、授权/Scope、TLS、原生权限或数据所有权边界
- 需要新增生产依赖、破坏性数据库操作或对外部系统写入，但任务未明确授权
- 当前工作树包含无法归属的用户修改；若本任务主动采用可选旧源，则该旧源无法绑定固定 commit

### HW11-03 — 实现 Tray、Windows Toast 与 Island Projection

| Field | Value |
| --- | --- |
| Primary owner | `terra_worker` |
| Supporting agents | `terra_tester`, `terra_browser` |
| Mode | `workspace-write` |
| Parallel group | `C` |
| Risk | `high` |
| Task dependencies | `HW11-02` |
| Acceptance tier | `sol-acceptance` |
| Acceptance agents | `terra_reviewer`, `sol_acceptance` |
| Required acceptance outcome | `ACCEPT` |

**Allowed paths**

- `apps/desktop-shell/src-tauri/**`
- `apps/workspace-web/src/platform/surfaces/**`

**Objective**

将同一业务事件投影到三种表面，点击后安全唤起对应工作项。

**Implementation steps**

- Rust 只处理通用显示，不理解 Fee/Ticket/Handover 业务字段。
- 同 eventId 更新/去重，不重复轰炸用户。
- 锁屏/非当前用户降级或隐藏。
- 点击通过 validated deep link，重新检查 Session/permission。
- Workspace 前台时可抑制冗余系统通知。

**Validation**

- surface mapping
- lock/switch user
- click route
- duplicate/update
- rate limit

**Acceptance**

- 三表面状态一致
- 跨用户零残留

**Independent acceptance procedure**

- Implementation/testing agents finish and return exact commands, evidence and limitations.
- The parent inspects the actual integrated diff before spawning acceptance agents.
- Run the agents listed in `Acceptance agents` against the same final commit/tree digest.
- Required Sol outcomes are advisory but mandatory evidence for the parent Gate.
- A Sol `REJECT`, `BLOCKED` or missing required report prevents task acceptance.
- Acceptance agents are read-only and never fix the task they review.

**Evidence**

- native-surface-evidence.md
- acceptance report(s) bound to the final source/result commit

**Stop immediately if**

- 需要修改未在 allowed_paths 中声明的路径
- 需要改变已接受 ADR、身份/Session、授权/Scope、TLS、原生权限或数据所有权边界
- 需要新增生产依赖、破坏性数据库操作或对外部系统写入，但任务未明确授权
- 当前工作树包含无法归属的用户修改；若本任务主动采用可选旧源，则该旧源无法绑定固定 commit

### HW11-04 — 构建 Desktop MSI 与 WebView2 发布闭包

| Field | Value |
| --- | --- |
| Primary owner | `parent_codex` |
| Supporting agents | `terra_tester`, `terra_security` |
| Mode | `workspace-write` |
| Parallel group | `D` |
| Risk | `critical` |
| Task dependencies | `HW03-08`, `HW11-03` |
| Acceptance tier | `sol-architecture-security` |
| Acceptance agents | `terra_reviewer`, `terra_security`, `sol_architecture_security` |
| Required acceptance outcome | `ACCEPT` |

**Allowed paths**

- `apps/desktop-shell/**`
- `infrastructure/windows/**`
- `scripts/release/desktop/**`

**Objective**

生成 x64 per-machine MSI，验证 WebView2 最低版本、安装、升级、卸载、回滚和 Profile 清理。

**Implementation steps**

- 固定 product/upgrade code、版本和 source/lock/artifact hash。
- WebView2 Evergreen/离线安装策略明确。
- 安装/升级不保留错误用户 Profile 或过期 binding。
- 卸载不删除服务器数据；本地缓存/Profile 按政策清理。
- 不将 Linux cargo check 冒充真实 Windows 验收。

**Validation**

- Windows build
- MSI install/upgrade/downgrade/uninstall
- WebView2 missing/old
- rollback

**Acceptance**

- 产物可重建且 hash 可验证
- 旧版本可回滚

**Independent acceptance procedure**

- Implementation/testing agents finish and return exact commands, evidence and limitations.
- The parent inspects the actual integrated diff before spawning acceptance agents.
- Run the agents listed in `Acceptance agents` against the same final commit/tree digest.
- Required Sol outcomes are advisory but mandatory evidence for the parent Gate.
- A Sol `REJECT`, `BLOCKED` or missing required report prevents task acceptance.
- Acceptance agents are read-only and never fix the task they review.

**Evidence**

- MSI-lifecycle-receipt.json
- acceptance report(s) bound to the final source/result commit

**Stop immediately if**

- 需要修改未在 allowed_paths 中声明的路径
- 需要改变已接受 ADR、身份/Session、授权/Scope、TLS、原生权限或数据所有权边界
- 需要新增生产依赖、破坏性数据库操作或对外部系统写入，但任务未明确授权
- 当前工作树包含无法归属的用户修改；若本任务主动采用可选旧源，则该旧源无法绑定固定 commit

### HW11-05 — 构建 Server Immutable Release 与 No-Egress 安装

| Field | Value |
| --- | --- |
| Primary owner | `parent_codex` |
| Supporting agents | `terra_tester`, `terra_reviewer` |
| Mode | `workspace-write` |
| Parallel group | `D` |
| Risk | `critical` |
| Task dependencies | `HW10-08` |
| Acceptance tier | `sol-architecture-security` |
| Acceptance agents | `terra_reviewer`, `terra_security`, `sol_architecture_security` |
| Required acceptance outcome | `ACCEPT` |

**Allowed paths**

- `infrastructure/nginx/**`
- `infrastructure/systemd/**`
- `scripts/release/server/**`
- `docs/ops/**`

**Objective**

为 Gateway、Collaboration、Hosp Access、Tickets、Fee、Handover、Agent、Knowledge 和 Workspace 静态制品建立不可变发布与回滚。

**Implementation steps**

- 每个 bundle 绑定 commit/lock/files/ABI/Prisma/health/stop。
- 目标机无 registry egress、不在线安装依赖。
- systemd/Nginx 指针只在 health 通过后切换。
- previous release 回滚不重建数据库；迁移有独立恢复策略。
- Secret scan、无逃逸 symlink/绝对路径和文件 mode 校验。

**Validation**

- offline assemble
- bundle closure
- health/stop
- rollback
- secret/symlink scan

**Acceptance**

- 删除构建机 store 后仍可运行
- 各服务可独立回滚且版本兼容矩阵明确

**Independent acceptance procedure**

- Implementation/testing agents finish and return exact commands, evidence and limitations.
- The parent inspects the actual integrated diff before spawning acceptance agents.
- Run the agents listed in `Acceptance agents` against the same final commit/tree digest.
- Required Sol outcomes are advisory but mandatory evidence for the parent Gate.
- A Sol `REJECT`, `BLOCKED` or missing required report prevents task acceptance.
- Acceptance agents are read-only and never fix the task they review.

**Evidence**

- server-release-manifest-set.json
- acceptance report(s) bound to the final source/result commit

**Stop immediately if**

- 需要修改未在 allowed_paths 中声明的路径
- 需要改变已接受 ADR、身份/Session、授权/Scope、TLS、原生权限或数据所有权边界
- 需要新增生产依赖、破坏性数据库操作或对外部系统写入，但任务未明确授权
- 当前工作树包含无法归属的用户修改；若本任务主动采用可选旧源，则该旧源无法绑定固定 commit

### HW11-06 — 建立监控、备份、恢复与运行手册

| Field | Value |
| --- | --- |
| Primary owner | `terra_worker` |
| Supporting agents | `luna_docs`, `terra_tester` |
| Mode | `workspace-write` |
| Parallel group | `E` |
| Risk | `high` |
| Task dependencies | `HW11-05` |
| Acceptance tier | `sol-acceptance` |
| Acceptance agents | `terra_reviewer`, `sol_acceptance` |
| Required acceptance outcome | `ACCEPT` |

**Allowed paths**

- `packages/observability/**`
- `docs/ops/**`
- `scripts/ops/**`
- `infrastructure/monitoring/**`

**Objective**

让 1～2 人团队能定位 Session、SSE、Outbox、DB、Redis、Agent、Desktop 和业务故障。

**Implementation steps**

- 定义 SLI/SLO、dashboard、alert 和 correlation fields。
- 覆盖 Session failure、SSE lag、Outbox age、projection lag、DB pool、Redis、Agent queue、desktop crash。
- 备份/恢复 PostgreSQL、配置、知识附件和 release registry。
- 编写证书、WebView2、MSI、Nginx/systemd、rollback 手册。
- 执行桌面演练，不只写文档。

**Validation**

- alert fixtures
- backup restore
- runbook drill
- failure triage

**Acceptance**

- 核心故障有可操作手册和恢复证据
- 告警不包含敏感正文

**Independent acceptance procedure**

- Implementation/testing agents finish and return exact commands, evidence and limitations.
- The parent inspects the actual integrated diff before spawning acceptance agents.
- Run the agents listed in `Acceptance agents` against the same final commit/tree digest.
- Required Sol outcomes are advisory but mandatory evidence for the parent Gate.
- A Sol `REJECT`, `BLOCKED` or missing required report prevents task acceptance.
- Acceptance agents are read-only and never fix the task they review.

**Evidence**

- ops-readiness-report.md
- acceptance report(s) bound to the final source/result commit

**Stop immediately if**

- 需要修改未在 allowed_paths 中声明的路径
- 需要改变已接受 ADR、身份/Session、授权/Scope、TLS、原生权限或数据所有权边界
- 需要新增生产依赖、破坏性数据库操作或对外部系统写入，但任务未明确授权
- 当前工作树包含无法归属的用户修改；若本任务主动采用可选旧源，则该旧源无法绑定固定 commit

### HW11-07 — 真实 Browser/Desktop/Anolis 受控试点验收

| Field | Value |
| --- | --- |
| Primary owner | `terra_tester` |
| Supporting agents | `terra_browser`, `terra_security`, `terra_reviewer` |
| Mode | `workspace-write` |
| Parallel group | `F` |
| Risk | `critical` |
| Task dependencies | `HW11-04`, `HW11-05`, `HW11-06` |
| Acceptance tier | `sol-acceptance` |
| Acceptance agents | `terra_reviewer`, `terra_security`, `sol_acceptance` |
| Required acceptance outcome | `ACCEPT` |

**Allowed paths**

- `scripts/acceptance/pilot/**`
- `evidence/HW-11/**`
- `docs/ops/**`

**Objective**

在授权环境验证信息科、一个临床病区和工程师组的真实主链路。

**Implementation steps**

- Windows Chrome + Tauri/WebView2 使用同一 BFF/Session/Workspace release。
- 两台目标 Anolis 或批准生产相似主机执行 no-egress、systemd/Nginx、rollback。
- 验证 Ticket、Fee、Handover、Agent 建议、Knowledge synthetic 场景。
- 执行 Redis/Postgres/Hub/网络/证书/客户端升级故障演练。
- 收集可用性、步骤减少、延迟、内存、崩溃和用户反馈。

**Validation**

- real environment receipts
- failure matrix
- privacy scan
- usability metrics

**Acceptance**

- 不得以 WSL2/Mock 替代声明
- P0=0，P1=0 才可建议试点

**Independent acceptance procedure**

- Implementation/testing agents finish and return exact commands, evidence and limitations.
- The parent inspects the actual integrated diff before spawning acceptance agents.
- Run the agents listed in `Acceptance agents` against the same final commit/tree digest.
- Required Sol outcomes are advisory but mandatory evidence for the parent Gate.
- A Sol `REJECT`, `BLOCKED` or missing required report prevents task acceptance.
- Acceptance agents are read-only and never fix the task they review.

**Evidence**

- pilot-dossier.json
- acceptance report(s) bound to the final source/result commit

**Stop immediately if**

- 需要修改未在 allowed_paths 中声明的路径
- 需要改变已接受 ADR、身份/Session、授权/Scope、TLS、原生权限或数据所有权边界
- 需要新增生产依赖、破坏性数据库操作或对外部系统写入，但任务未明确授权
- 当前工作树包含无法归属的用户修改；若本任务主动采用可选旧源，则该旧源无法绑定固定 commit

### HW11-08 — G11-PILOT 人工决议

| Field | Value |
| --- | --- |
| Primary owner | `parent_codex` |
| Supporting agents | `terra_reviewer`, `terra_security` |
| Mode | `read-only` |
| Parallel group | `G` |
| Risk | `critical` |
| Task dependencies | `HW11-02`, `HW11-04`, `HW11-05`, `HW11-07` |
| Acceptance tier | `sol-phase-gate` |
| Acceptance agents | `terra_reviewer`, `terra_security`, `sol_architecture_security`, `sol_phase_gate` |
| Required acceptance outcome | `PASS_RECOMMENDED` |

**Allowed paths**

- `evidence/HW-11/**`
- `docs/program/**`
- `docs/ops/**`

**Objective**

综合安全、发布、恢复、功能、性能和用户体验证据，给出 GO/NO-GO 建议，最终由医院负责人签署。

**Implementation steps**

- 核对每个 required evidence 与环境。
- 确认 inherited risks、owner、期限和回退。
- 签发 PASS/CONDITIONAL/BLOCKED；安全和数据问题不能 CONDITIONAL。

**Validation**

- evidence audit
- independent review

**Acceptance**

- 人工签署前不推广
- G11 不等于全院生产批准

**Independent acceptance procedure**

- Implementation/testing agents finish and return exact commands, evidence and limitations.
- The parent inspects the actual integrated diff before spawning acceptance agents.
- Run the agents listed in `Acceptance agents` against the same final commit/tree digest.
- Required Sol outcomes are advisory but mandatory evidence for the parent Gate.
- A Sol `REJECT`, `BLOCKED` or missing required report prevents task acceptance.
- Acceptance agents are read-only and never fix the task they review.

**Evidence**

- G11-PILOT-gate-decision.md
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
docs/program/phases/HW-11-native-surfaces-pilot.md and docs/program/tasks/HW-11.yaml.

Execute only HW-11. Use Luna for narrow discovery/docs/fixtures, Terra for bounded implementation/testing/review,
and the task matrix's Sol route for independent acceptance. Run the phase-level Sol Gate agents only after the
final integrated diff and evidence are frozen. Parent Codex makes the final Gate decision.
Do not begin the next phase, push, merge, release or change external systems without explicit authorization.
```
