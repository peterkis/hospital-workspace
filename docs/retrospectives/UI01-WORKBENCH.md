# UI-01 Workbench Retrospective

## 范围和结果

UI-01 在现有合成 Ticket runtime 上增加页面化工作台。它没有改变 Ticket authority、
transport、backend、identity、dependency 或 native boundary。

首轮冻结树因完整 suite 的两个 5000 ms lifecycle timeout 进入 `BLOCKED`；唯一诊断复跑
又因 Vitest worker 未启动而没有执行测试。后续会话保留该历史结果，使用定向测试和
`--maxWorkers=1` 诊断，通过 TDD 修复 review 回归，最终 head
`0ae9fd515f24fbf5bc6125f21d9141d6d3a15e92` 的 CI 和 review 通过，合并为
`bdbc1855468064e00be422722923188e63dd6189`。

## 主要踩坑

### 1. required visible outcome 没有先转成测试清单

初版漏掉页面内收藏。review 还发现 mapping/view 分支可维护性问题。后续才补 failing test、
最小实现和重构。

改进：从 accepted slice/prompt 建 requirement-to-test 表。每个可见行为必须有测试、浏览器
检查或明确不适用原因。

### 2. 可见页面和持久 runtime 状态脱节

全局 Escape listener 只看 `runtime.isPanelOpen`，首页未渲染 Context 时仍会把隐藏状态从
open 改为 closed，用户进入普通 Thread 后才看到副作用。

改进：keyboard handler 用实际 rendered-state predicate；exceptional state、home、normal
Thread 分别测试。

### 3. 导航只完成视觉跳转，没有完成状态清理

Favorites handler 曾保留旧 query，导致侧栏显示收藏数量而主区域为空；移动端又直接隐藏
sidebar，没有经统一 close path 恢复 menu trigger focus。后续 review 还补出 stale focus、
错误 `aria-current`、detail unfavorite focus 和对比度问题。

改进：为导航建立 transition matrix：query、space、mine、favorites、detail、pending、
sidebar expanded、active element、return target。共享 close/reset path，不直接改一半状态。

### 4. digest 修复容易变成批量放行

修改 `App.tsx` 使整文件 SHA-256 失效。正确做法是在检查实际 dynamic access 后，只更新
`App.tsx` 对应 digest，并删除过时 exception。

改进：digest failure 是 review 请求，不是自动刷新提示。所有变化必须能在 diff 中解释。

### 5. 并行测试抖动和 Gate 结论混淆

默认并行完整 suite 的长 lifecycle test 超时；独立执行和串行完整 frontend suite 后来通过。
首轮把 `BLOCKED` 保留下来是正确的，因为诊断 pass 还没有替代当时 required Gate。

改进：分开记录 `TEST_FAILED`、`TEST_NOT_STARTED`、targeted pass 和 serial diagnostic pass。
不提升 timeout、不加 retry、不静默替换默认 Gate。

### 6. 浏览器/开发服务故障不是产品结论

会话中出现过 CSS import 的 transient dev-start failure、浏览器连接中断和端口检查无结果。
这些需要诊断，但不能自动升级为代码失败或被忽略为成功。

改进：记录启动是否完成、测试是否开始、观察窗口是否有效、任务端口是否清理。

## 已形成的护栏

- `App.test.tsx` 覆盖首页 Escape 和 exceptional-state visibility。
- `workbench.test.tsx` 覆盖 favorites/search、全局搜索、移动侧栏回焦、detail/focus 和
  navigation state。
- 前端 nested `AGENTS.md` 固定 rendered-state handler、navigation matrix、digest 和
  Vitest diagnostic 规则。
- 最终 PR 使用 current-head review、resolved discussions、CI、exact-head merge、
  fast-forward 和分支清理。

## 证据边界

- 首轮 `BLOCKED` 与后续 PASS 都是真实历史，不能互相覆盖。
- 浏览器截图只证明对应树和视口的展示，不证明 backend/domain state。
- serial Vitest 诊断说明 parallelism 相关性，不单独证明 Windows/WebView2 或生产接受。
- UI-01 始终是 presentation-only synthetic iteration。

## 当前入口

- `apps/workspace-web/AGENTS.md`
- `docs/program/mvp/MVP-EXECUTION-OVERLAY.yaml`
- `docs/governance/CODE-REVIEW-RULES.md`
- `docs/retrospectives/COMMON-PITFALLS.md`
