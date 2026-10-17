# PR #16 Browser Boundary Retrospective

## 范围和结果

本复盘覆盖 MVP04-I02 的 app-local typed client、source-contract 和固定 Vite proxy。
最终 feature head `c70e1cce41ee77fec0647ccb7f044d0de792eac7` 完成当前头审核与 CI，
合并为 `cd1183b875a479c3b29c2f0751b16857180d7dde`。

这只证明公共合成 browser transport/source boundary 的实现和测试。它不证明真实 Gateway
语义、Identity/Authz、数据库、Outbox、Windows/Tauri/WebView2、医院网络或生产安全。

## 主要踩坑

### 1. 词法补丁循环

早期 guard 通过正则逐项阻断，每轮 review 又发现相邻语法：JSX spread、
`createElement`、dynamic tag、computed member、CSS/CSSOM、HTML entry、import trivia、
resource hint、DOM/form API。局部测试持续增长，但完整威胁面没有一开始冻结。

改进：先做 syntax-aware surface inventory，再写 fail-closed allowlist 和 adversarial
fixtures。新增 production surface 时由递归发现器失败，而不是等待 reviewer 猜到入口。

### 2. redirect 错误分类

`redirect: "error"` 会把浏览器拒绝 redirect 与普通网络失败合并为 rejection。最终改为
`redirect: "manual"`，并在读取 header/body 或重试前把 `opaqueredirect`、可见 3xx、
`redirected` 响应隔离为 `INVALID_RESPONSE`。

改进：transport contract 先写错误分类表，覆盖 redirect、timeout、abort、网络失败、
超界 body、错误 content type、未知 code 和 altered message。

### 3. 定向 green 早于独立 review

多次 focused suite 已 green，但独立 review 仍找到可利用的未覆盖 surface。focused green
只证明已有 fixture，不证明 fixture 集合完整。

改进：边界变更必须在最终树上运行独立 correctness/security review；review 后的 material
change 使之前 receipt 失效。

### 4. GitHub API `EOF` 噪声

reply、reaction 或 review 查询曾因 API transport `EOF` 返回非零。部分命令还把 mutation、
review request 和 checks 串在同一次 shell 调用中，使失败来源不清楚。

改进：mutation、权威 read 和辅助 read 分开。对幂等 read 有界重试，并用 PR head、CI、
review 和 unresolved-thread 查询验证 mutation。辅助 reaction 查询不决定 merge。

### 5. 退出码误读

`rg` 无匹配、remote check pending、API `EOF` 和测试断言失败都出现过 exit 1。原始失败
计数不能作为质量指标。

改进：使用 `COMMON-PITFALLS.md` 的 outcome taxonomy，并在 evidence 中保留命令语义。

## 已形成的护栏

- `source-contract.test.ts` 已采用 Vite parser、递归 production surface 和大量负向 fixture。
- Vite proxy 只允许固定 `/api/mvp/` 边界，过滤敏感 request/response headers，并返回固定
  public-safe failure。
- typed client 固定 same-origin target，`credentials: omit`、`cache: no-store`、
  `redirect: manual`、超时和 bounded JSON response。
- 最终合并绑定 exact head，验证 CI、review 和 unresolved threads；本地先 fast-forward
  `main`、核对树，再删除分支。

## 保留局限

- source-contract 是 regression guard，不是安全 sandbox。
- 最后一次 source-only 修正后没有新的 runtime browser smoke；这项历史限制不能回写为
  PASS。
- GitHub 网络故障通过交叉查询缓解，不代表外部服务具备 exactly-once mutation。

## 当前入口

- `apps/workspace-web/AGENTS.md`
- `services/gateway/AGENTS.md`
- `docs/program/mvp/MVP-04-ARCHITECTURE-PREFLIGHT.md`
- `docs/program/mvp/MVP-04-PROTOTYPE-BOUNDARY.yaml`
- `docs/governance/CODE-REVIEW-RULES.md`
