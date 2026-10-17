# Cross-session Pitfalls and Operating Lessons

## 严重度排序

### P1：先做实现，后补需求或威胁面清单

PR #16 先用词法/正则逐步加固，随后才陆续发现 JSX spread、动态组件、工厂调用、
computed property、CSS/CSSOM、HTML entry 等相邻出口。UI-01 先完成视觉实现，review
才发现明确要求的页面内收藏缺失。

执行要求：动手前列出“必须看见的行为”和“必须拒绝的入口”。每项至少绑定一个
测试、人工检查或明确 `NOT_APPLICABLE`。安全边界从语法结构和完整 surface inventory
开始；UI 从状态转换和可见结果开始。

### P1：把绿灯层级混为一个结论

定向测试通过、包级测试通过、串行诊断通过、默认完整 Gate、远端 CI、独立 review
和目标设备证明是不同层。前两次会话都出现“局部已绿，但完整结论仍未成立”的阶段。

执行要求：报告必须同时写清结果树、命令、是否实际执行到测试、环境和未运行项。
定向 green 只证明定向范围；串行诊断不能抹掉默认并行 Gate 的失败；静态扫描不是运行时
sandbox；browser 不是 Windows/Tauri/WebView2。

### P1：把原始退出码当成工程结论

`exit 1` 可能是预期 TDD RED、`rg` 没有匹配、远端 check 尚未完成、GitHub API
传输失败、测试断言失败、测试 worker 未启动或服务被主动结束。只看退出码会制造无效重跑，
也会把真实故障埋在噪声里。

执行要求：给每次非零结果标注以下一种类型：

| 类型 | 处理 |
| --- | --- |
| `EXPECTED_RED` | 保存失败断言，完成最小修复后转 green |
| `NO_MATCH` | 记录搜索范围；不当作产品失败 |
| `PENDING_EXTERNAL` | 等待同一权威对象；不重复触发 review |
| `INFRA_TRANSIENT` | 有界重试并用另一权威查询验证状态 |
| `TEST_FAILED` | 修复行为；不弱化断言、timeout 或 retry |
| `TEST_NOT_STARTED` | 保留为缺失证据；检查 worker/环境 |
| `INTENTIONAL_STOP` | 说明服务或观察窗口由任务主动结束 |

### P2：用 review 代替最终树冻结

任何 material change 都会使旧 review、截图、哈希或 CI receipt 失效。两次成功合并都依赖
最终 head/tree、当前 CI、resolved discussions 和 exact-head merge 的重新核对。

执行要求：冻结树后再启动最终独立 review；截图、日志和外部 receipt 写入 commit/tree；
变化后重新审核，不把 reviewer receipt 放回被审核树形成递归。

### P2：全局事件处理器只看存储状态，不看可见状态

UI-01 的 Escape handler 曾在首页改变未渲染的 Context 状态。导航还曾保留旧搜索，移动端
关闭侧栏后焦点丢失。

执行要求：事件 handler 用“当前实际渲染 surface”做门；页面转换用状态表覆盖 search、
space/person filter、favorites、detail/thread、Escape、sidebar 和 focus return。

### P2：为通过 source-contract 而刷新哈希

整文件 digest 是 reviewed exception，不是格式缓存。盲目批量刷新会把未审查的动态访问一起
批准。

执行要求：查看实际源码和 AST 例外，只更新发生变化且已审查的文件；在 diff 中解释变化
原因。新 surface 先补 negative fixture，再改变 allowlist。

### P2：把外部 API 噪声当成仓库状态

PR #16 多次遇到 GitHub API `EOF`。reaction 查询失败不等于 review 未通过，成功回复也不
保证 thread 已 resolved。

执行要求：区分辅助查询和权威查询；幂等 read 有界重试；以 PR head、CI rollup、review
结果和 unresolved-thread 查询交叉验证 mutation 结果。

### P3：重复创建已有工作状态

PR #16 会话曾在已有 active goal 时再次创建 goal。该失败没有改变任务，但浪费一个循环。

执行要求：先读当前 goal/branch/session 状态，复用现有对象；外部 mutation 后先验证再重试，
避免重复评论或 review 请求。

### P3：根据正文关键词识别项目会话

memory summary、系统指令和历史上下文会让无关会话也包含仓库名。全文命中不能证明会话
归属。

执行要求：先匹配 session metadata 的工作目录或项目 ID，再用标题/正文定位主题。长日志
按类别和 ordinal 提取，避免一次加载整个 transcript。读取活跃 JSONL 时使用共享只读模式。

### P3：猜测工具分页和 patch 语义

错误的 `limit`/`turnLimit` 会浪费调用；把 delete/add 同一路径放进一个 patch 也会被工具
拒绝。

执行要求：调用前读 schema 和边界；大结果先设计 bounded extraction；大文件替换先验证
patch 操作模型，并在操作后立即检查文件、diff 和字节预算。

## 规则归属

| 结论 | 归属 |
| --- | --- |
| Public data、authority、Gate truth、父/人工权威 | 根 `AGENTS.md` |
| 前端出口、digest、UI 状态、Vitest 诊断 | `apps/workspace-web/AGENTS.md` |
| Gateway/Session/proxy 边界 | `services/gateway/AGENTS.md` |
| surface inventory、dependency、public data pattern | 自动化测试/CI |
| 需求到测试、rendered-state、final-tree evidence 判断 | `docs/governance/CODE-REVIEW-RULES.md` |
| 历史案例、恢复路径、局限 | 本目录 |

## 开工前最小清单

### Browser/source boundary

1. 枚举所有 production TS/TSX/JS/JSX、HTML、CSS 和配置入口。
2. 列出允许的 transport、target、method、header、redirect 和 response behavior。
3. 列出 JSX binding、DOM/resource/CSSOM、import/alias/computed 负向路径。
4. 先写 bypass fixtures，再实现 guard。
5. 最终树执行 targeted、完整 Gate、独立 correctness/security review。

### UI/navigation

1. 从接受的 visible outcome 建 requirement-to-test 表。
2. 写页面/Thread/detail/exceptional state 的可见性矩阵。
3. 对 search、favorites、filters、pending、Escape、sidebar、focus 写状态转换。
4. 用失败行为测试固定 bug，再做最小实现。
5. 分开记录默认并行 Gate 与串行诊断。

### PR completion

1. 冻结并记录 final head/tree。
2. 校验 staged allowlist、Public Safety、required checks。
3. 确认 review 绑定当前 head，讨论全部 resolved。
4. 使用 exact-head merge。
5. `fetch --prune`，本地 `main` fast-forward，核对树后删除 feature branches。
