# Retrospective Maintenance Session

## 范围

本会话使用 `retro`、`writing-for-agents` 和 OpenAI 官方 AGENTS.md 指导，复盘当前会话和
本仓库其他 Codex 会话，并把结论分层到根指令、最近目录指令、review 规则和本索引。

本次只修改治理与复盘文档，不修改产品运行时、依赖、lockfile、MVP 状态或 Gate。

## 当前会话踩坑

### 1. 用内容搜索会话，产生大量假阳性

首次在 session logs 中搜索 `Hospital-Workspace`，命中了许多其他项目会话。原因是每个会话
都可能携带 memory summary、系统指令或历史上下文；“正文提到仓库”不等于该会话属于仓库。

修正：逐个解析 JSONL 的 `session_meta.payload.cwd`。最终只确认两个历史项目会话和当前
会话。以后项目级复盘以 metadata 为主键，标题、summary 和全文搜索只用于二次定位。

### 2. 猜测工具分页上限

首次调用 thread listing 使用 `limit=100`，工具实际最大为 50；首次读取 thread 使用
`turnLimit=100`，实际最大为 10。两次都没有产生有效结果。

修正：调用前读工具 schema；有 cursor 时分页；没有足够分页能力时，使用本地 primary
source 做受限解析。

### 3. 一次读取两份完整 thread，输出被截断

即使 `read_thread` 的 turn 数量合法，一个长工程 turn 仍可包含大量命令、review 和截图
事件。并行读取两个 thread 产生约 15 万 token 的原始结果并被截断。

修正：先列 user turns，再按类别提取 final result、failed command、review finding 和关键
ordinal；不要把未筛选 transcript 送入同一个工具结果。摘要只能导航，结论必须回到 primary
source 校验。

### 4. 活跃 JSONL 的默认文件共享模式失败

`File.OpenText` 无法读取被 Codex 进程持有的 session log，并引发后续 null reader 错误。

修正：用显式 `FileStream` 和 `FileShare.ReadWrite` 只读打开；在 `finally` 中分别检查并关闭
reader/stream。读取失败时不继续使用未初始化对象。

### 5. 失败计数没有语义分类

直接统计 `status=failed` 得到 PR #16 的 68 项和 UI-01 的 32 项，但其中混有预期 TDD
RED、`rg` no-match、remote check pending、被主动停止的 dev server 和真正断言失败。

修正：放弃“失败数量”指标，采用 `COMMON-PITFALLS.md` 的 outcome taxonomy，并回读相关
命令上下文和最终权威状态。

### 6. 超大 `apply_patch` 同时删除和新增同一路径失败

第一次尝试在一个 patch 内同时 `Delete File` 和 `Add File` 替换根 `AGENTS.md`，工具拒绝
同一目标的多重操作。后续分两次操作并立即恢复了文件。

修正：大文件替换前先确认 patch 工具语义。优先用单次 `Update File`；若只能 delete/add，
把完整新内容准备好、连续执行、随后立即检查文件存在、diff 和 instruction byte budget。

## 做对的部分

- 在仓库探索前先查 OpenAI 官方 AGENTS.md 文档，确认 root-to-cwd precedence、nested
  instructions 和 32 KiB 默认预算。
- 用 session metadata 排除假阳性，只复盘真正属于本仓库的会话。
- 让 Luna 分别做 guidance inventory、PR #16 和 UI-01 primary-source 复盘；父代理保留最终
  取舍和编辑责任。
- 没有把 memory summary 当作当前事实；用历史 JSONL、Git commit 和现有测试交叉验证。
- 把机械护栏、review 判断、目录专属规则和历史案例放到不同层，降低 root context load。

## 后续维护约束

- 新增复盘时先登记会话身份、范围和权威源，再提取失败。
- 对工具错误先修工具使用，不把它混入产品缺陷统计。
- 根与最近 nested `AGENTS.md` 的合并字节数保持显著低于默认 32 KiB。
- 每次指令重构都运行 repository validator、Public Safety、Markdown link check 和
  `git diff --check`，并由独立 reviewer 检查是否丢失关键边界。
