# Risk Register

| ID | Risk | Severity | Control | Phase |
| --- | --- | --- | --- | --- |
| R-001 | 新仓再次复制旧仓全部结构 | P1 | 严格 Legacy Source Manifest、DO-NOT-MIGRATE、F0 scan | HW-00 |
| R-002 | 同源远程 UI 被误改为客户端 Token 模式 | P0 | ADR-0002、Rust 无 Token、Gateway Session tests | HW-02/03 |
| R-003 | Remote Workspace 获得通用原生权限 | P0 | capability none、独立 Native Bridge ADR、fuzz | HW-03/11 |
| R-004 | Collaboration 演化为业务大单体 | P1 | 领域权威矩阵、禁止跨 schema 写入 | HW-05+ |
| R-005 | 聊天文本直接改变业务状态 | P0 | Card/Command/Domain Event/Harness validator | HW-05 |
| R-006 | SSE 断线丢失或重复事件 | P1 | durable gap recovery、idempotency、replay | HW-04 |
| R-007 | Inbox、Todo、WorkItem 和领域状态混淆 | P1 | 独立 contracts/projections/review | HW-04/05 |
| R-008 | 共享终端跨用户残留 | P0 | Redis family revoke、InPrivate profile、Trusted Resume | HW-02/03 |
| R-009 | 患者信息进入通知/日志/本地缓存 | P0 | Sensitivity/ContextRef/redaction/negative tests | 全程 |
| R-010 | 原始 Prisma 被跨域直接使用 | P1 | repository-only checker、schema owner | HW-01+ |
| R-011 | Outbox 被直接 HTTP 通知替代 | P1 | producer boundary and failure tests | HW-04+ |
| R-012 | 确费重复或未知结果被当成功 | P0 | idempotency、expectedVersion、HIS correlation | HW-07 |
| R-013 | 工单双接单或状态倒退 | P1 | concurrency/state table | HW-06 |
| R-014 | 交班内容越权或本地残留 | P0 | Scope、lazy context、cache clear | HW-08 |
| R-015 | Schema App 执行任意代码或 URL | P0 | strict DSL、signed release、CSP | HW-08 |
| R-016 | Agent 获取 Shell/SQL/HTTP/文件能力 | P0 | Tool Registry 禁止、red-team | HW-09 |
| R-017 | 模型声称完成绕过 Harness | P1 | validator-based completion | HW-09 |
| R-018 | Agent 取消后晚到结果复活 | P1 | run epoch/cancellation/quarantine | HW-09 |
| R-019 | 知识建议未经专家审校发布 | P0 | human Decision and state gate | HW-10 |
| R-020 | 向量索引跨 Scope 泄漏 | P0 | scope before ranking、rebuild tests | HW-10 |
| R-021 | Native Surface 泄漏敏感正文 | P0 | Surface Contract、generic summary、caller binding | HW-11 |
| R-022 | MSI/Anolis/Release 证据被模拟替代 | P1 | 环境真实性规则 | HW-11 |
| R-023 | 容量和 HA 在无数据时过度设计 | P2 | 试点后真实指标 | HW-12 |
| R-024 | 1–2 人团队被过多微服务拖垮 | P1 | Gateway/Collaboration 平台收敛、阶段创建目录 | 全程 |
| R-025 | Luna/Terra 并发写冲突 | P1 | 路径写锁、最多3写代理、父代理整合 | 全程 |
| R-026 | 缺失或陈旧的 Sol 报告被当作验收 | P1 | task YAML 显式路由、commit/tree 绑定、material-change re-review、phase Gate checker | 全程 |
| R-027 | Sol 被用于实现或替代父/人工决策 | P1 | Sol 全部 read-only；仅输出建议；Parent/Human authority 固化 | 全程 |
| R-028 | Sol 不可用时静默换模型 | P1 | 精确路由错误、验收 BLOCKED、用户显式批准后才可改配置 | 全程 |
