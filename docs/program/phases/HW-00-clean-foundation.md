# HW-00 — 新仓创建与 Clean Foundation

## Goal

建立一个没有旧 Phase 脚本、旧 Next.js 门户、旧数据库迁移和旧 Issues 负担的公共 monorepo，并冻结产品使命、工具链、依赖方向、代码所有权、迁移来源与第一组 ADR。

## Dependencies

None

A dependent phase must be `PASS`. `CONDITIONAL` does not automatically authorize this phase.

## Deliverables

- 公共仓库 `peterkis/hospital-workspace`
- 根 `AGENTS.md`、`.codex/` Luna/Terra/Sol 子代理配置
- Node/pnpm/TypeScript 基础、唯一 lockfile、基础 CI
- 目标目录骨架与依赖边界检查器
- Legacy Source Manifest 与 Knowe Adoption Matrix
- ADR-0001～ADR-0007
- F0 Clean Foundation Gate 证据

## Out of scope

- 迁移任何业务应用
- 实现真实登录、Hub、数据库业务模型或 Tauri 原生功能
- 复制旧仓历史脚本、Evidence、Issue 或 migration
- 创建兼容旧 URL、Cookie、API 或数据结构的适配层

## Phase acceptance

- 新仓从 clean clone 可 frozen install 并运行 required checks
- 根指令和 Luna/Terra/Sol agents 可被 Codex发现
- 只有一个 lockfile、一个 Program 和一个允许 no-source 模式的 Legacy Source Manifest
- 依赖 DAG/路径所有权/迁移来源负向测试可阻断错误
- 仓库不存在旧 Next UI、旧 migration、旧 Phase scripts 和未登记 legacy copy

## Gates

- G00-1 新仓与工具链唯一性
- G00-2 文档、指令和子代理发现
- G00-3 依赖方向与路径所有权
- G00-4 可选来源策略与迁移可追溯
- G00-5 零遗留运行依赖

## Sol acceptance policy

| Scope | Required route |
| --- | --- |
| Low / medium task | `terra_reviewer`; no task-level Sol required |
| High-risk task | `sol_acceptance` after Terra review |
| Critical architecture/security task | `sol_architecture_security` after Terra review/security review |
| Critical task primarily proving E2E/acceptance evidence | `sol_acceptance` |
| Phase exit | `sol_phase_gate` |
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
| `HW00-01` | 创建公共仓库、公共数据边界与初始治理 | `parent_codex` | luna_docs, terra_reviewer | `high` | `A` | `sol-acceptance` | terra_reviewer, sol_acceptance |
| `HW00-02` | 固定 Node、pnpm、TypeScript 与 Workspace 合同 | `terra_worker` | luna_inventory, terra_tester | `medium` | `B` | `terra` | terra_reviewer |
| `HW00-03` | 冻结目标目录与依赖 DAG | `terra_contracts` | luna_explorer, terra_reviewer | `medium` | `B` | `terra` | terra_reviewer |
| `HW00-04` | 建立 Legacy Source Manifest | `terra_migrator` | luna_inventory, terra_reviewer | `high` | `C` | `sol-acceptance` | terra_reviewer, sol_acceptance |
| `HW00-05` | 冻结 Knowe 借鉴与排除矩阵 | `luna_docs` | luna_explorer, terra_reviewer | `low` | `C` | `terra` | terra_reviewer |
| `HW00-06` | 创建基础 CI 与证据框架 | `terra_tester` | luna_fixtures, terra_reviewer | `medium` | `D` | `terra` | terra_reviewer |
| `HW00-07` | 接受 Foundation ADR 与 F0 Gate | `parent_codex` | terra_reviewer, terra_security | `critical` | `E` | `sol-phase-gate` | terra_reviewer, terra_security, sol_phase_gate |

## Detailed implementation plan

### HW00-01 — 创建公共仓库、公共数据边界与初始治理

| Field | Value |
| --- | --- |
| Primary owner | `parent_codex` |
| Supporting agents | `luna_docs`, `terra_reviewer` |
| Mode | `workspace-write` |
| Parallel group | `A` |
| Risk | `high` |
| Task dependencies | — |
| Acceptance tier | `sol-acceptance` |
| Acceptance agents | `terra_reviewer`, `sol_acceptance` |
| Required acceptance outcome | `ACCEPT` |

**Allowed paths**

- `README.md`
- `AGENTS.md`
- `.codex/**`
- `docs/**`
- `.github/**`
- `.gitignore`
- `.gitattributes`

**Objective**

初始化新仓，使任何 Agent 在写代码前都能识别产品目标、绿地规则、禁止迁移项和 Gate 流程。

**Implementation steps**

- 创建公共仓库，首次安全提交进入 `main` 后导入并启用 Ruleset，要求 PR 与 `checks`。
- 安装本包的 `AGENTS.md`、`.codex/agents`、Program、ADR 和治理文档。
- 在 README 明确可选旧代码源仅为本地只读迁移输入，不是 Git 子模块或运行依赖。
- 建立 PR 模板、CODEOWNERS 或角色所有权文件；父代理保留最终安全和发布裁决。
- 验证新 Codex 会话能列出根指令与 Luna/Terra/Sol custom agents。

**Validation**

- Codex 指令发现
- TOML/Markdown/YAML/JSON 结构校验
- AGENTS 合并字节预算检查
- 公共仓库 Ruleset、required `checks` 和禁止直接推送人工核对

**Acceptance**

- 仓库为空白绿地状态，无旧业务代码
- 根指令小于默认 32 KiB，并明确新架构唯一 Program
- Luna/Terra/Sol 配置可被 Codex识别

**Independent acceptance procedure**

- Implementation/testing agents finish and return exact commands, evidence and limitations.
- The parent inspects the actual integrated diff before spawning acceptance agents.
- Run the agents listed in `Acceptance agents` against the same final commit/tree digest.
- Required Sol outcomes are advisory but mandatory evidence for the parent Gate.
- A Sol `REJECT`, `BLOCKED` or missing required report prevents task acceptance.
- Acceptance agents are read-only and never fix the task they review.

**Evidence**

- 仓库设置截图/收据
- instruction-discovery.log
- initial-tree.txt
- acceptance report(s) bound to the final source/result commit

**Stop immediately if**

- 需要修改未在 allowed_paths 中声明的路径
- 需要改变已接受 ADR、身份/Session、授权/Scope、TLS、原生权限或数据所有权边界
- 需要新增生产依赖、破坏性数据库操作或对外部系统写入，但任务未明确授权
- 当前工作树包含无法归属的用户修改；若本任务主动采用可选旧源，则该旧源无法绑定固定 commit

### HW00-02 — 固定 Node、pnpm、TypeScript 与 Workspace 合同

| Field | Value |
| --- | --- |
| Primary owner | `terra_worker` |
| Supporting agents | `luna_inventory`, `terra_tester` |
| Mode | `workspace-write` |
| Parallel group | `B` |
| Risk | `medium` |
| Task dependencies | `HW00-01` |
| Acceptance tier | `terra` |
| Acceptance agents | `terra_reviewer` |
| Required acceptance outcome | `APPROVED` |

**Allowed paths**

- `package.json`
- `pnpm-workspace.yaml`
- `pnpm-lock.yaml`
- `.npmrc`
- `.nvmrc`
- `tsconfig*.json`
- `scripts/governance/**`

**Objective**

建立唯一包管理器和最小根命令，避免把旧仓 Phase 01/02 根脚本迁入新仓。

**Implementation steps**

- 固定 Node 24.18.0 和 pnpm 11.17.0；只有一个 `pnpm-lock.yaml`。
- 创建最小 workspace 清单：初始只登记真实存在的 app/service/package。
- 定义 `build`、`lint`、`typecheck`、`test`、`check`、`format:check` 六个 canonical 命令。
- 禁止 npm/yarn/bun lockfile、`--if-present`、空脚本和静默跳过。
- 建立 workspace contract checker，要求每个 workspace 声明质量命令或明确 N/A 依据。

**Validation**

- pnpm install --frozen-lockfile
- workspace inventory
- second-lock negative test
- missing-script negative test

**Acceptance**

- 唯一 lockfile
- 从干净 clone 可 frozen install
- 根命令不含 legacy phase 命名和 npm fallback

**Independent acceptance procedure**

- Implementation/testing agents finish and return exact commands, evidence and limitations.
- The parent inspects the actual integrated diff before spawning acceptance agents.
- Run the agents listed in `Acceptance agents` against the same final commit/tree digest.
- Required Sol outcomes are advisory but mandatory evidence for the parent Gate.
- A Sol `REJECT`, `BLOCKED` or missing required report prevents task acceptance.
- Acceptance agents are read-only and never fix the task they review.

**Evidence**

- toolchain-report.json
- workspace-inventory.json
- negative-tests.log
- acceptance report(s) bound to the final source/result commit

**Stop immediately if**

- 需要修改未在 allowed_paths 中声明的路径
- 需要改变已接受 ADR、身份/Session、授权/Scope、TLS、原生权限或数据所有权边界
- 需要新增生产依赖、破坏性数据库操作或对外部系统写入，但任务未明确授权
- 当前工作树包含无法归属的用户修改；若本任务主动采用可选旧源，则该旧源无法绑定固定 commit

### HW00-03 — 冻结目标目录与依赖 DAG

| Field | Value |
| --- | --- |
| Primary owner | `terra_contracts` |
| Supporting agents | `luna_explorer`, `terra_reviewer` |
| Mode | `workspace-write` |
| Parallel group | `B` |
| Risk | `medium` |
| Task dependencies | `HW00-01` |
| Acceptance tier | `terra` |
| Acceptance agents | `terra_reviewer` |
| Required acceptance outcome | `APPROVED` |

**Allowed paths**

- `docs/architecture/**`
- `docs/governance/**`
- `scripts/governance/**`
- `packages/**/package.json`
- `apps/**/package.json`
- `services/**/package.json`

**Objective**

把 apps、platform services、domain services、pure contracts、infrastructure 和 database 的依赖方向固化为机器门禁。

**Implementation steps**

- 记录终局目录和 Foundation 阶段允许创建的最小目录。
- 定义 `apps -> sdk/contracts`、`services -> repositories/contracts`、`contracts -> pure utilities`。
- 禁止 frontend 依赖 Prisma/pg/Redis/server-only，禁止 domain service 依赖 UI。
- 禁止跨领域 repository 深层导入和跨 schema 写入。
- 实现依赖图检查与循环检测 fixtures。

**Validation**

- dependency DAG positive/negative fixtures
- workspace protocol scan
- deep-import negative test

**Acceptance**

- 依赖图无环
- 每条禁止边可被自动检测
- 目录不是预创建的大而空框架；只有当前阶段真实需要的 workspace

**Independent acceptance procedure**

- Implementation/testing agents finish and return exact commands, evidence and limitations.
- The parent inspects the actual integrated diff before spawning acceptance agents.
- Run the agents listed in `Acceptance agents` against the same final commit/tree digest.
- Required Sol outcomes are advisory but mandatory evidence for the parent Gate.
- A Sol `REJECT`, `BLOCKED` or missing required report prevents task acceptance.
- Acceptance agents are read-only and never fix the task they review.

**Evidence**

- dependency-graph.json
- boundary-check.log
- acceptance report(s) bound to the final source/result commit

**Stop immediately if**

- 需要修改未在 allowed_paths 中声明的路径
- 需要改变已接受 ADR、身份/Session、授权/Scope、TLS、原生权限或数据所有权边界
- 需要新增生产依赖、破坏性数据库操作或对外部系统写入，但任务未明确授权
- 当前工作树包含无法归属的用户修改；若本任务主动采用可选旧源，则该旧源无法绑定固定 commit

### HW00-04 — 建立 Legacy Source Manifest

| Field | Value |
| --- | --- |
| Primary owner | `terra_migrator` |
| Supporting agents | `luna_inventory`, `terra_reviewer` |
| Mode | `workspace-write` |
| Parallel group | `C` |
| Risk | `high` |
| Task dependencies | `HW00-01` |
| Acceptance tier | `sol-acceptance` |
| Acceptance agents | `terra_reviewer`, `sol_acceptance` |
| Required acceptance outcome | `ACCEPT` |

**Allowed paths**

- `docs/migration/**`
- `scripts/migration/**`

**Objective**

建立可选本地旧代码源的只读迁移边界，任何迁移文件必须记录来源、测试和改造状态。

**Implementation steps**

- 默认登记 sourceMode=none；仅在所有者明确配置可选本地旧源时，登记 source label、完整 commit、source path、target path、license、迁移模式和 owner。
- 对白名单资产分为 COPY-ADAPT、EXTRACT、REFERENCE-ONLY、DO-NOT-MIGRATE。
- 禁止直接 cherry-pick 大提交、复制根 package/lock/Prisma migrations/Phase scripts。
- 定义迁移收据格式，迁移后记录源文件 hash 与目标 diff。
- 建立 manifest checker，未登记 legacy copy 必须失败。

**Validation**

- manifest schema test
- unknown source negative test
- source commit/hash verification

**Acceptance**

- 所有实际采用的旧资产可追溯；无旧源时有明确 no-source 记录
- 新仓不依赖旧仓运行时或 Git 子模块
- 本地 W0 治理提交不是新仓构建依赖

**Independent acceptance procedure**

- Implementation/testing agents finish and return exact commands, evidence and limitations.
- The parent inspects the actual integrated diff before spawning acceptance agents.
- Run the agents listed in `Acceptance agents` against the same final commit/tree digest.
- Required Sol outcomes are advisory but mandatory evidence for the parent Gate.
- A Sol `REJECT`, `BLOCKED` or missing required report prevents task acceptance.
- Acceptance agents are read-only and never fix the task they review.

**Evidence**

- LEGACY-SOURCE-MANIFEST.yaml
- migration-policy-test.log
- acceptance report(s) bound to the final source/result commit

**Stop immediately if**

- 需要修改未在 allowed_paths 中声明的路径
- 需要改变已接受 ADR、身份/Session、授权/Scope、TLS、原生权限或数据所有权边界
- 需要新增生产依赖、破坏性数据库操作或对外部系统写入，但任务未明确授权
- 当前工作树包含无法归属的用户修改；若本任务主动采用可选旧源，则该旧源无法绑定固定 commit

### HW00-05 — 冻结 Knowe 借鉴与排除矩阵

| Field | Value |
| --- | --- |
| Primary owner | `luna_docs` |
| Supporting agents | `luna_explorer`, `terra_reviewer` |
| Mode | `workspace-write` |
| Parallel group | `C` |
| Risk | `low` |
| Task dependencies | `HW00-01` |
| Acceptance tier | `terra` |
| Acceptance agents | `terra_reviewer` |
| Required acceptance outcome | `APPROVED` |

**Allowed paths**

- `docs/migration/KNOWE-ADOPTION-MATRIX.md`
- `docs/architecture/**`

**Objective**

只借鉴 Knowe 的群聊协作、Coordinator/Worker、Harness、Handoff、用户裁决、知识生命周期和事件回放思想，不复制其不适合医院生产的运行边界。

**Implementation steps**

- 把每个借鉴点映射到 Hospital Workspace 的具体模块与阶段。
- 明确不采用 Electron、客户端 Python 后端、JSONL 业务真相、任意 Shell/文件工具和客户端模型 API Key。
- 记录 Knowe 固定 commit 和 MIT 来源，仅在实际复制代码时才触发许可证归属流程。
- 将群聊定义为业务投影和协作界面，而不是数据库或状态机。

**Validation**

- 文档链接与 commit 校验
- adoption/exclusion pair completeness

**Acceptance**

- 每项借鉴都有 Hospital Workspace 落点
- 每项高风险机制都有明确排除或安全替代

**Independent acceptance procedure**

- Implementation/testing agents finish and return exact commands, evidence and limitations.
- The parent inspects the actual integrated diff before spawning acceptance agents.
- Run the agents listed in `Acceptance agents` against the same final commit/tree digest.
- Required Sol outcomes are advisory but mandatory evidence for the parent Gate.
- A Sol `REJECT`, `BLOCKED` or missing required report prevents task acceptance.
- Acceptance agents are read-only and never fix the task they review.

**Evidence**

- KNOWE-ADOPTION-MATRIX.md
- source-reference-report.md
- acceptance report(s) bound to the final source/result commit

**Stop immediately if**

- 需要修改未在 allowed_paths 中声明的路径
- 需要改变已接受 ADR、身份/Session、授权/Scope、TLS、原生权限或数据所有权边界
- 需要新增生产依赖、破坏性数据库操作或对外部系统写入，但任务未明确授权
- 当前工作树包含无法归属的用户修改；若本任务主动采用可选旧源，则该旧源无法绑定固定 commit

### HW00-06 — 创建基础 CI 与证据框架

| Field | Value |
| --- | --- |
| Primary owner | `terra_tester` |
| Supporting agents | `luna_fixtures`, `terra_reviewer` |
| Mode | `workspace-write` |
| Parallel group | `D` |
| Risk | `medium` |
| Task dependencies | `HW00-02`, `HW00-03` |
| Acceptance tier | `terra` |
| Acceptance agents | `terra_reviewer` |
| Required acceptance outcome | `APPROVED` |

**Allowed paths**

- `.github/workflows/**`
- `scripts/governance/**`
- `docs/program/templates/**`
- `evidence/**`

**Objective**

让新仓从第一个提交开始具备可阻断的构建、契约、边界、证据和密钥检查。

**Implementation steps**

- 建立 Ubuntu required `checks`，执行 frozen install、build、lint、typecheck、test、governance。
- 建立 secret scan、生成物污染、源目录 `.js/.d.ts` 污染和 lockfile 唯一性检查。
- 创建 Evidence Manifest JSON Schema，PASS 禁止包含 NOT_RUN/FAIL。
- 定义 Windows/Tauri 和 Anolis 验收为独立环境门，不能由 Linux 冒充。
- 建立 gate decision 与 rollback receipt 模板。

**Validation**

- CI dry run/static validation
- evidence schema positive/negative tests
- secret fixture negative test

**Acceptance**

- required checks 可在空骨架中稳定通过
- 未执行平台测试不会被标为 PASS
- 证据不允许真实患者数据或秘密

**Independent acceptance procedure**

- Implementation/testing agents finish and return exact commands, evidence and limitations.
- The parent inspects the actual integrated diff before spawning acceptance agents.
- Run the agents listed in `Acceptance agents` against the same final commit/tree digest.
- Required Sol outcomes are advisory but mandatory evidence for the parent Gate.
- A Sol `REJECT`, `BLOCKED` or missing required report prevents task acceptance.
- Acceptance agents are read-only and never fix the task they review.

**Evidence**

- CI run
- evidence-schema-report.json
- secret-scan-report.json
- acceptance report(s) bound to the final source/result commit

**Stop immediately if**

- 需要修改未在 allowed_paths 中声明的路径
- 需要改变已接受 ADR、身份/Session、授权/Scope、TLS、原生权限或数据所有权边界
- 需要新增生产依赖、破坏性数据库操作或对外部系统写入，但任务未明确授权
- 当前工作树包含无法归属的用户修改；若本任务主动采用可选旧源，则该旧源无法绑定固定 commit

### HW00-07 — 接受 Foundation ADR 与 F0 Gate

| Field | Value |
| --- | --- |
| Primary owner | `parent_codex` |
| Supporting agents | `terra_reviewer`, `terra_security` |
| Mode | `read-only` |
| Parallel group | `E` |
| Risk | `critical` |
| Task dependencies | `HW00-02`, `HW00-03`, `HW00-04`, `HW00-05`, `HW00-06` |
| Acceptance tier | `sol-phase-gate` |
| Acceptance agents | `terra_reviewer`, `terra_security`, `sol_phase_gate` |
| Required acceptance outcome | `PASS_RECOMMENDED` |

**Allowed paths**

- `AGENTS.md`
- `.codex/**`
- `docs/**`
- `.github/**`
- `package.json`
- `pnpm-workspace.yaml`
- `pnpm-lock.yaml`
- `scripts/governance/**`

**Objective**

独立确认新仓是干净目标架构，而不是旧仓的第二份复制。

**Implementation steps**

- 复核 ADR-0001～0007、Source Manifest、目录 DAG、模型路由和风险登记。
- 检查是否出现 Next.js、旧 migration、旧 phase scripts、旧 URL/Cookie 兼容或未登记 legacy copy。
- 核对 GitHub checks、证据真实性和 rollback。
- 签发 `F0-CLEAN-FOUNDATION=PASS/BLOCKED`。

**Validation**

- 全仓 governance
- git diff --check
- dependency graph
- manifest audit

**Acceptance**

- P0/P1 为零
- F0 仅代表允许开始迁移基础资产，不代表试点或生产

**Independent acceptance procedure**

- Implementation/testing agents finish and return exact commands, evidence and limitations.
- The parent inspects the actual integrated diff before spawning acceptance agents.
- Run the agents listed in `Acceptance agents` against the same final commit/tree digest.
- Required Sol outcomes are advisory but mandatory evidence for the parent Gate.
- A Sol `REJECT`, `BLOCKED` or missing required report prevents task acceptance.
- Acceptance agents are read-only and never fix the task they review.

**Evidence**

- F0-gate-decision.md
- independent-review.md
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
7. Run the phase-level Sol agents: `sol_phase_gate`.
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
docs/program/phases/HW-00-clean-foundation.md and docs/program/tasks/HW-00.yaml.

Execute only HW-00. Use Luna for narrow discovery/docs/fixtures, Terra for bounded implementation/testing/review,
and the task matrix's Sol route for independent acceptance. Run the phase-level Sol Gate agents only after the
final integrated diff and evidence are frozen. Parent Codex makes the final Gate decision.
Do not begin the next phase, push, merge, release or change external systems without explicit authorization.
```
