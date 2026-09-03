# Hospital Workspace Roadmap

## Program mission

Build a public greenfield monorepo that turns the hospital intranet entry point into a person/event/task/work-item/context-centered desktop collaboration workspace.

The program does not recreate the old portal. It selectively migrates proven assets and rebuilds product interaction around:

```text
Person
→ Events
→ Inbox / Todo
→ Capability Space
→ Business Thread
→ Work Item
→ Card / Canvas / Decision / Handoff
→ Domain Command
→ Domain Event
→ Outcome
```

## Active execution overlay after F0

Product-First MVP-0 is the current near-term execution sequence after the
accepted `F0-CLEAN-FOUNDATION` Gate. The canonical `HW-01` through `HW-12`
roadmap remains the production hardening roadmap and is not rewritten by the
overlay. MVP slices do not mark canonical tasks complete. After `MVP-07`, the
Parent and human owner decide how to re-enter the canonical roadmap.

The overlay is active only through the Product Direction Gate and is
public-synthetic and browser-first. It authorizes no hospital pilot or
production claim. See [`mvp/MVP-EXECUTION-OVERLAY.yaml`](mvp/MVP-EXECUTION-OVERLAY.yaml).

## Sources

- Legacy code whitelist: `optional owner-controlled legacy source configured locally`
- Interaction/mechanism reference: `HirezmingD/Knowe-agent-groupchat@1e584f84734e9db55515ef4391fcb9e9c40399cd`
- Target: `peterkis/hospital-workspace`

## Model and acceptance strategy

- Luna: narrow inventory, docs, fixtures and high-volume support work.
- Terra: implementation, migration, testing and first independent review.
- Sol: high-risk task acceptance, critical architecture/security acceptance and phase-exit recommendation.
- Parent Codex: final integrated decision and Gate.
- Human owner: pilot and production authorization.

Every phase has a mandatory `sol_phase_gate`. Task-level Sol routing is explicit in each task matrix.

## Phase overview

| Phase | Title | Dependencies | Tasks | Final gate | Required Sol phase agents |
| --- | --- | --- | ---: | --- | --- |
| `HW-00` | 新仓创建与 Clean Foundation | — | 7 | G00-5 零遗留运行依赖 | sol_phase_gate |
| `HW-01` | 共享契约内核与干净数据库基线 | HW-00 | 8 | G01-4 时间、ID、审计与敏感度一致性 | sol_architecture_security, sol_phase_gate |
| `HW-02` | 人员、组织、身份、Session 与授权主链 | HW-01 | 8 | G02-5 共享终端与故障关闭 | sol_architecture_security, sol_phase_gate |
| `HW-03` | Tauri 可信桌面壳与统一 Workspace Web | HW-01, HW-02 | 8 | G03-5 Browser/Desktop UI 等价 | sol_architecture_security, sol_phase_gate |
| `HW-04` | 事件、Inbox、Todo、回放与协同平台 | HW-01, HW-02, HW-03 | 8 | G04-5 Inbox/Todo/未读一致性 | sol_acceptance, sol_phase_gate |
| `HW-05` | 工作项、上下文、卡片协议与 Harness | HW-03, HW-04 | 9 | G05-5 Context 最小化与权限 | sol_acceptance, sol_phase_gate |
| `HW-06` | 首个真实垂直切片：信息报修与协作工单 | HW-05 | 8 | G06-5 多用户恢复与内部 MVP | sol_acceptance, sol_phase_gate |
| `HW-07` | 第二个垂直切片：确费与强确定性短流程 | HW-05, HW-06 | 7 | G07-5 事务/Outbox/回写恢复 | sol_acceptance, sol_phase_gate |
| `HW-08` | 临床交班与声明式轻应用 | HW-05, HW-07 | 8 | G08-5 轻应用不绕过领域服务 | sol_architecture_security, sol_phase_gate |
| `HW-09` | Agent Gateway、Coordinator／Worker 与受控协作 | HW-04, HW-05, HW-06 | 8 | G09-5 模型故障、成本与审计 | sol_acceptance, sol_architecture_security, sol_phase_gate |
| `HW-10` | 知识整理项目、治理生命周期与 Agent 协作 | HW-05, HW-09 | 8 | G10-5 检索 provenance 与权限 | sol_acceptance, sol_phase_gate |
| `HW-11` | 灵动岛、系统通知、发布硬化与受控试点 | HW-06, HW-07, HW-08, HW-09, HW-10 | 8 | G11-5 故障恢复与受控试点 | sol_architecture_security, sol_phase_gate |
| `HW-12` | 容量、HA、灰度发布与全院生产 | HW-11 | 8 | G12-5 全院生产人工批准 | sol_acceptance, sol_architecture_security, sol_phase_gate |

Total work packages: **103**.

## Dependency graph

```text
HW-00
  |
  v
HW-01
  |
  +-------> HW-02 ------+
  |                     |
  +-------> HW-03 <-----+
  |                     |
  +-------> HW-04 <-----+
                        |
                        v
                      HW-05
                     /  |  \
                    v   v   v
                 HW-06 HW-07 HW-09
                         |      |
                         v      v
                       HW-08  HW-10
                         \      /
                          \    /
                           v  v
                          HW-11
                            |
                            v
                          HW-12
```

HW-06 and HW-07 may overlap after HW-05 only when write paths and owners are separate. HW-09 may start after HW-05/HW-04, but its first production scenario should wait for the Ticket service boundary.

## Milestones

### M0 — Clean repository

HW-00 PASS. New repo has one Program, one lockfile, one dependency DAG and zero legacy runtime dependency.

### M1 — Platform identity and shell

HW-01 through HW-03 PASS. Browser and Tauri share the same Workspace release and BFF Session.

### M2 — Collaboration kernel

HW-04 and HW-05 PASS. Durable events, inbox, todos, work items, cards, decisions and handoffs operate with synthetic domains.

### M3 — First real value

HW-06 PASS. Ticket workflow demonstrates long-running multi-user collaboration.

### M4 — Deterministic clinical/financial workflows

HW-07 and HW-08 PASS. Fee and Handover prove short high-frequency and high-sensitivity flows.

### M5 — Agent and knowledge collaboration

HW-09 and HW-10 PASS. Agents remain bounded and experts remain authoritative.

### M6 — Controlled pilot

HW-11 PASS and human approval. Native surfaces, MSI, server release, recovery and real-environment evidence exist.

### M7 — Production expansion

HW-12 PASS and human approval. Capacity, HA, rollout rings and operations are accepted.

## Development strategy

- Vertical slices over platform-only breadth.
- Synthetic E2E before a real domain.
- Ticket before autonomous Agent writes.
- Fee before high-volume production.
- Knowledge proposal before clinical publication.
- One source of truth per concern.
- Delete/reject legacy code instead of carrying compatibility.
- Keep Browser fallback throughout Desktop development.
- Terra reviews implementation; Sol accepts declared high-risk results; parent/human retain authority.

## Program completion

The program is complete only when:

- people receive the right event and work item;
- the current owner and state are visible;
- deterministic actions use structured commands;
- domain services remain authoritative;
- Event/Outbox/replay are reliable;
- shared terminals are safe;
- Agents are bounded and auditable;
- knowledge is governed and human-approved;
- Desktop/Browser/Server releases are reproducible and recoverable;
- production capacity and ownership are approved;
- all required Sol phase reports and parent/human decisions are valid for the final commits.
