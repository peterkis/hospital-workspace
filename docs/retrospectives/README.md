# Retrospective Index

本目录记录已经发生过的工程问题、恢复方式和可复用护栏。它不是 Gate
Evidence，也不覆盖当前任务、ADR、源代码或测试的事实。使用结论前先核对当前树。

根 `AGENTS.md` 保持为短入口，目录专属规则放到最近的 `AGENTS.md`，机械规则放到
CI/检查器，判断规则放到 review 文档。这个分层遵循 OpenAI 官方
[AGENTS.md 指导](https://learn.chatgpt.com/docs/agent-configuration/agents-md)：项目指令按
root 到当前目录叠加，最近目录的规则优先，默认合并预算为 32 KiB。

## 会话索引

| 日期 | 范围 | 历史结果 | 复盘 |
| --- | --- | --- | --- |
| 2026-09-07 至 2026-09-16 | PR #16，MVP04-I02 browser transport/source contract | 修复多轮 P2，当前头审核与 CI 通过，合并为 `cd1183b` | [PR16-BROWSER-BOUNDARY.md](PR16-BROWSER-BOUNDARY.md) |
| 2026-09-16 至 2026-09-23 | UI-01 / PR #17 页面化合成工作台 | 首轮 Gate 保留 `BLOCKED`；后续串行诊断、TDD、当前头审核和 CI 通过，合并为 `bdbc185` | [UI01-WORKBENCH.md](UI01-WORKBENCH.md) |
| 2026-10-17 | 本次 retro 与 `AGENTS.md` 分层优化 | 会话发现、工具经济和指令改写过程复盘；未改变产品运行时 | [RETRO-MAINTENANCE.md](RETRO-MAINTENANCE.md) |

跨会话重复模式和执行清单见
[COMMON-PITFALLS.md](COMMON-PITFALLS.md)。

## 按问题检索

| 问题 | 先读 |
| --- | --- |
| 浏览器出口、source-contract、HTML/CSS/JSX 扫描 | PR #16 复盘；`apps/workspace-web/AGENTS.md` |
| `App.tsx` digest 失效 | UI-01 复盘；`apps/workspace-web/AGENTS.md` |
| Vitest 并行超时或 worker 未启动 | UI-01 复盘的“验证状态” |
| Escape、隐藏状态、收藏/搜索、移动端焦点 | UI-01 复盘的“交互状态矩阵” |
| GitHub API `EOF`、review/CI 状态不一致 | PR #16 复盘的“外部状态” |
| 定向测试通过但 Gate 未完成 | COMMON-PITFALLS 的“证据分层” |
| PR 合并和分支清理 | 两份复盘的“保留做法” |
| 会话发现、日志解析、工具输出截断 | 本次 retro 维护复盘 |

## 维护规则

- 记录可复现事实、失败分类、修复模式和证明边界；不粘贴完整会话日志。
- 中间失败不能被后续成功覆盖。并列记录时间、树和环境。
- 新结论若是机械模式，优先进入测试或检查器；若需要跨文件判断，进入
  `docs/governance/CODE-REVIEW-RULES.md`；只有每次都必须遵守的规则进入根
  `AGENTS.md`。
- 复盘文件不得包含本机路径、私有配置、真实医院数据或未脱敏日志。
