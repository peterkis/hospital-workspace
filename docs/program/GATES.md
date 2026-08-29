# Program Gates

## Status

| Status | Meaning | Next phase |
| --- | --- | --- |
| PASS | All required checks, negative/recovery scenarios, evidence, Terra reviews and declared Sol reports pass | Allowed |
| CONDITIONAL | Only non-security/non-integrity follow-up remains with owner and deadline; required Sol reports still must permit it | Human exception only |
| BLOCKED | Required evidence/review is failed, missing, stale, bound to the wrong commit/tree, or unsupported | Not allowed |

## Never conditional

- identity/session/CSRF;
- authorization/Scope;
- patient/clinical/financial privacy;
- Tauri/WebView2/native permissions;
- data loss or wrong domain state;
- concurrency/idempotency defect;
- migration or rollback without recovery;
- Evidence integrity;
- missing/rejected/blocked required Sol review;
- P0 or P1 finding.

## Acceptance layers

| Layer | Role |
| --- | --- |
| Implementation/self-test | Luna/Terra task agents |
| First independent review | `terra_reviewer` |
| First security review | `terra_security` where required |
| High-risk task acceptance | `sol_acceptance` |
| Critical architecture/security acceptance | `sol_architecture_security` |
| Phase-exit recommendation | `sol_phase_gate` |
| Final engineering Gate | `parent_codex` |
| Pilot/production authorization | named human owner |

Sol reviews are mandatory evidence where declared but do not replace parent/human authority.

## Common Gate sequence

1. Source/branch/worktree.
2. Task scope and path lock.
3. Targeted functional tests.
4. Negative and permission tests.
5. Concurrency/idempotency where relevant.
6. Failure/recovery/rollback.
7. Package lint/typecheck/test/build.
8. Contract/catalog/database/dependency checks.
9. Platform-specific real-environment tests.
10. Parent integrated diff and dependency review.
11. Evidence schema/hash validation and result commit/tree freeze.
12. Independent `terra_reviewer`.
13. `terra_security` where required.
14. All declared task-level `sol_acceptance` / `sol_architecture_security`.
15. All declared phase-level Sol reviews.
16. `sol_phase_gate` returns `PASS_RECOMMENDED`, `CONDITIONAL_RECOMMENDED` or `BLOCKED`.
17. Parent issues `PASS / CONDITIONAL / BLOCKED`.
18. Human decision for PILOT/PRODUCTION.

## Sol validity

A required Sol report is valid only when it:

- uses the configured Sol agent/model or an explicitly user-approved replacement;
- is read-only and independent of implementation;
- cites the final integrated source/result commit or tree digest;
- cites actual diff, tests, raw logs and limitations;
- is rerun after material changes;
- returns the exact required outcome.

If Sol is unavailable, the task/phase is `BLOCKED`; no silent substitution.

## Gate matrix

### HW-00 — 新仓创建与 Clean Foundation

- G00-1 新仓与工具链唯一性
- G00-2 文档、指令和子代理发现
- G00-3 依赖方向与路径所有权
- G00-4 可选来源策略与迁移可追溯
- G00-5 零遗留运行依赖

**Required outcomes**

- 新仓从 clean clone 可 frozen install 并运行 required checks
- 根指令和 Luna/Terra/Sol agents 可被 Codex发现
- 只有一个 lockfile、一个 Program 和一个允许 no-source 模式的 Legacy Source Manifest
- 依赖 DAG/路径所有权/迁移来源负向测试可阻断错误
- 仓库不存在旧 Next UI、旧 migration、旧 Phase scripts 和未登记 legacy copy

**Required Sol phase acceptance**

- Agents: `sol_phase_gate`
- `sol_phase_gate` outcome required for PASS: `PASS_RECOMMENDED`
- Parent final decision: `parent_codex`
- Human decision required: `no`

### HW-01 — 共享契约内核与干净数据库基线

- G01-1 契约纯度与版本化
- G01-2 数据库空基线可重建
- G01-3 repository-only 数据访问
- G01-4 时间、ID、审计与敏感度一致性

**Required outcomes**

- 核心 contracts 纯净、版本化并有无效 fixtures
- 数据库从空库可创建、迁移、seed、重建和恢复
- Redis Session 权威未被数据库模型污染
- raw Prisma 仅 repository 可用，跨 schema 写入被阻断
- 时间、ID、Trace、Audit、Sensitivity 语义统一

**Required Sol phase acceptance**

- Agents: `sol_architecture_security`, `sol_phase_gate`
- `sol_phase_gate` outcome required for PASS: `PASS_RECOMMENDED`
- Parent final decision: `parent_codex`
- Human decision required: `no`

### HW-02 — 人员、组织、身份、Session 与授权主链

- G02-1 身份映射与人员上下文
- G02-2 Redis-only Session
- G02-3 默认拒绝授权与 Scope
- G02-4 Browser/Desktop 同链路
- G02-5 共享终端与故障关闭

**Required outcomes**

- 外部身份、Person、Organization、Principal 明确分层
- Browser/Tauri 共用 BFF 和 Redis Session，客户端不持 Token
- 授权默认拒绝且 Scope 失败为 none
- logout/switch-person 撤销 family，Redis/BFF 故障 fail-closed
- Capability Registry 是能力元数据唯一真相

**Required Sol phase acceptance**

- Agents: `sol_architecture_security`, `sol_phase_gate`
- `sol_phase_gate` outcome required for PASS: `PASS_RECOMMENDED`
- Parent final decision: `parent_codex`
- Human decision required: `no`

### HW-03 — Tauri 可信桌面壳与统一 Workspace Web

- G03-1 Tauri 安全实现与测试保真
- G03-2 Remote Workspace 零原生权限
- G03-3 单一同源不可变 release
- G03-4 共享终端 Profile/Resume
- G03-5 Browser/Desktop UI 等价

**Required outcomes**

- Tauri 安全场景不减少；若采用可选旧源则附来源收据，否则以新实现测试证据为准
- Remote Workspace capability 默认 none
- Browser/Tauri 加载同一 immutable Workspace release
- Profile、锁屏恢复、换人和退出无跨用户残留
- Deep Link 不能导航任意 URL 或携带敏感正文

**Required Sol phase acceptance**

- Agents: `sol_architecture_security`, `sol_phase_gate`
- `sol_phase_gate` outcome required for PASS: `PASS_RECOMMENDED`
- Parent final decision: `parent_codex`
- Human decision required: `no`

### HW-04 — 事件、Inbox、Todo、回放与协同平台

- G04-1 Collaboration 事件行为与测试保真
- G04-2 Event Catalog 与版本化
- G04-3 Outbox/投递/去重
- G04-4 SSE 回放与单连接
- G04-5 Inbox/Todo/未读一致性

**Required outcomes**

- 所有事件注册、版本化并有 owner/sensitivity
- 领域事务与 Outbox 原子，relay 可恢复且幂等
- Event/Inbox/Todo 可从 durable store 确定性重建
- Workspace 只有一个 SSE 连接，断线后 gap recovery
- 未读、读游标、事件游标语义分离

**Required Sol phase acceptance**

- Agents: `sol_acceptance`, `sol_phase_gate`
- `sol_phase_gate` outcome required for PASS: `PASS_RECOMMENDED`
- Parent final decision: `parent_codex`
- Human decision required: `no`

### HW-05 — 工作项、上下文、卡片协议与 Harness

- G05-1 WorkItem 非业务真相
- G05-2 Timeline/Projection 可重建
- G05-3 Card Action 幂等与服务端确认
- G05-4 Harness/Decision/Handoff 状态机
- G05-5 Context 最小化与权限

**Required outcomes**

- WorkItem 只投影领域实例，不覆盖业务状态
- Card Action 具备 command/idempotency/version 且服务端确认完成
- Harness/Decision/Handoff 状态机拒绝非法转换
- 用户批准/拒绝高于模型建议
- Context 按需解析、重新授权且敏感数据不本地持久化

**Required Sol phase acceptance**

- Agents: `sol_acceptance`, `sol_phase_gate`
- `sol_phase_gate` outcome required for PASS: `PASS_RECOMMENDED`
- Parent final decision: `parent_codex`
- Human decision required: `no`

### HW-06 — 首个真实垂直切片：信息报修与协作工单

- G06-1 Ticket 领域权威与状态机
- G06-2 并发/幂等/SLA
- G06-3 附件与敏感数据安全
- G06-4 WorkItem/Timeline 映射
- G06-5 多用户恢复与内部 MVP

**Required outcomes**

- Ticket 状态机、并发接单、SLA 和 Incident 规则通过
- 附件无 IDOR、路径泄漏和 MIME 绕过
- Ticket/Outbox/Event/WorkItem/Timeline 可重放一致
- 临床用户与工程师在 Workspace 完成闭环
- 只批准信息科内部非生产 MVP

**Required Sol phase acceptance**

- Agents: `sol_acceptance`, `sol_phase_gate`
- `sol_phase_gate` outcome required for PASS: `PASS_RECOMMENDED`
- Parent final decision: `parent_codex`
- Human decision required: `no`

### HW-07 — 第二个垂直切片：确费与强确定性短流程

- G07-1 Fee 领域与 HIS 边界
- G07-2 金额/状态/幂等
- G07-3 患者最小化与权限
- G07-4 卡片高频体验
- G07-5 事务/Outbox/回写恢复

**Required outcomes**

- Money、HIS authoritative state 和平台回执无歧义
- 重复/并发确认或取消不产生重复业务写入
- HIS unknown result 被诚实保留并可核对
- 患者信息最小化且不进入通知/日志
- 卡片高频处理不绕过服务端权限和状态机

**Required Sol phase acceptance**

- Agents: `sol_acceptance`, `sol_phase_gate`
- `sol_phase_gate` outcome required for PASS: `PASS_RECOMMENDED`
- Parent final decision: `parent_codex`
- Human decision required: `no`

### HW-08 — 临床交班与声明式轻应用

- G08-1 交班领域与临床隐私
- G08-2 并发编辑/确认/版本
- G08-3 Schema DSL 安全
- G08-4 签名发布与回滚
- G08-5 轻应用不绕过领域服务

**Required outcomes**

- 交班正文按科室/角色/Scope 保护并有版本历史
- 并发修订和确认可审计
- Schema DSL 无任意 JS/HTML/URL 执行能力
- Schema App release 签名、哈希、版本和回滚通过
- 至少一个 synthetic 轻应用完整运行

**Required Sol phase acceptance**

- Agents: `sol_architecture_security`, `sol_phase_gate`
- `sol_phase_gate` outcome required for PASS: `PASS_RECOMMENDED`
- Parent final decision: `parent_codex`
- Human decision required: `no`

### HW-09 — Agent Gateway、Coordinator／Worker 与受控协作

- G09-1 Agent Run 与完成状态机
- G09-2 Tool Registry 最小权限
- G09-3 Coordinator/Worker/Handoff
- G09-4 用户审批与取消恢复
- G09-5 模型故障、成本与审计

**Required outcomes**

- Coordinator/Worker 的任务、工具、Handoff 和产物可追溯
- Tool Registry 不含 Shell/SQL/任意 HTTP/文件系统
- 写工具有服务端权限和用户审批
- 取消/重启/晚到/重复审批状态正确
- 首个 Agent 保持建议模式，失败不影响确定性业务

**Required Sol phase acceptance**

- Agents: `sol_acceptance`, `sol_architecture_security`, `sol_phase_gate`
- `sol_phase_gate` outcome required for PASS: `PASS_RECOMMENDED`
- Parent final decision: `parent_codex`
- Human decision required: `no`

### HW-10 — 知识整理项目、治理生命周期与 Agent 协作

- G10-1 知识来源/版本/范围
- G10-2 用户审校权威
- G10-3 active/retired 生命周期
- G10-4 Agent 抽取与发布隔离
- G10-5 检索 provenance 与权限

**Required outcomes**

- 知识节点/关系/版本/来源/scope/active-retired 可追溯
- 未审校建议不能发布为 active
- 专家 Decision 是最终权威
- 检索先授权再排序，retired/draft 默认排除
- 从 synthetic 文档到发布/退役/检索完成全链

**Required Sol phase acceptance**

- Agents: `sol_acceptance`, `sol_phase_gate`
- `sol_phase_gate` outcome required for PASS: `PASS_RECOMMENDED`
- Parent final decision: `parent_codex`
- Human decision required: `no`

### HW-11 — 灵动岛、系统通知、发布硬化与受控试点

- G11-1 Native Bridge 最小权限
- G11-2 锁屏/共享终端通知隐私
- G11-3 MSI 与 WebView2 生命周期
- G11-4 Server immutable/no-egress release
- G11-5 故障恢复与受控试点

**Required outcomes**

- Native Bridge 只有一个最小命令且 exact caller/Rust validation
- Tray/Toast/Island 不暴露患者和财务敏感正文
- MSI、WebView2、不可变服务端制品和回滚有真实证据
- Browser/Desktop/Anolis 环境声明真实
- 安全、恢复、运维和用户体验满足受控试点

**Required Sol phase acceptance**

- Agents: `sol_architecture_security`, `sol_phase_gate`
- `sol_phase_gate` outcome required for PASS: `PASS_RECOMMENDED`
- Parent final decision: `parent_codex`
- Human decision required: `yes`

### HW-12 — 容量、HA、灰度发布与全院生产

- G12-1 真实容量模型
- G12-2 PostgreSQL/Redis HA
- G12-3 Collaboration/Agent 横向扩展
- G12-4 客户端版本兼容与灰度
- G12-5 全院生产人工批准

**Required outcomes**

- 容量模型来自试点真实指标
- PostgreSQL/Redis HA 不改变数据和 Session 权威
- Collaboration 多实例故障后可回放恢复
- Agent/Knowledge/附件有背压、预算和降级
- 分环发布、版本兼容、回滚和生产责任获人工批准

**Required Sol phase acceptance**

- Agents: `sol_acceptance`, `sol_architecture_security`, `sol_phase_gate`
- `sol_phase_gate` outcome required for PASS: `PASS_RECOMMENDED`
- Parent final decision: `parent_codex`
- Human decision required: `yes`


## Evidence truth

- Linux is not Windows.
- Browser is not Tauri/WebView2.
- WSL2 is not physical Anolis.
- Fake HIS is not production HIS.
- Synthetic users are not a clinical pilot.
- A file or screenshot is not proof of behavior.
- A subagent summary is not proof of a command.
- A local UI state is not domain completion.
- A Sol recommendation bound to an older commit is not acceptance of the current result.

## P0/P1

- P0: unauthorized disclosure, irreversible data loss, wrong financial/clinical action, remote native escape, production-critical security failure.
- P1: state-machine, concurrency, idempotency, replay, rollback or major evidence defect.

P0/P1 must be closed before PASS.
