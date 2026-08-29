# Target Architecture

## 1. 目标

从传统的：

```text
找系统 → 打开页面 → 找菜单 → 查询待办 → 执行业务
```

转向：

```text
事件主动到人
→ 进入能力空间和业务线程
→ 查看工作项、上下文、参与者和当前状态
→ 通过卡片/Canvas 处理
→ 领域服务提交
→ Outbox/Event 驱动所有投影
```

## 2. 逻辑架构

```text
┌─────────────────────────────────────────────────────┐
│ Tauri Trusted Shell                                 │
│ single instance / tray / privacy / profile / resume │
└───────────────────────┬─────────────────────────────┘
                        │ exact HTTPS immutable path
┌───────────────────────▼─────────────────────────────┐
│ Hospital Workspace Web                              │
│ Spaces / Threads / Timeline / Cards / Canvas        │
│ Inbox / Todo / Agent / Knowledge                    │
└───────────────────────┬─────────────────────────────┘
                        │ same-origin HTTPS + SSE
┌───────────────────────▼─────────────────────────────┐
│ Gateway/BFF                                          │
│ Logto / Identity Adapter / Redis Session / CSRF      │
│ Principal / Authz / Scope / Capability Registry      │
└────────────┬───────────────────────┬─────────────────┘
             │                       │
┌────────────▼─────────────┐  ┌──────▼────────────────┐
│ Collaboration Service   │  │ Hosp Access Service   │
│ Events / Inbox / Todo   │  │ HIS/API anti-corrupt │
│ WorkItems / Harness     │  └───────────────────────┘
│ Decision / Handoff/SSE  │
└────────────┬─────────────┘
             │ events / commands / APIs
┌────────────▼────────────────────────────────────────┐
│ Independent authoritative domain services          │
│ Tickets | Fee | Handover | Knowledge | Agent        │
└────────────┬────────────────────────────────────────┘
             │
┌────────────▼────────────────────────────────────────┐
│ PostgreSQL schemas + Redis + object storage         │
└─────────────────────────────────────────────────────┘
```

## 3. 运行时收敛

为了适合 1～2 人团队，平台能力按运行边界合并，而不是每个模块一个微服务：

- Gateway：身份、Session、BFF、Registry。
- Collaboration：Event、Inbox、Todo、WorkItem、Harness、Decision、Handoff、SSE。
- Hosp Access：医院上游统一访问。
- Agent Gateway：模型、Coordinator/Worker、工具和运行状态。
- 每个业务领域保持独立服务。

如果以后规模证明需要，再从 Collaboration 拆分；不得为“微服务形式”提前增加运维负担。

## 4. 客户端策略

Workspace Web 是同源、不可变发布的 React/Vite SPA：

- 浏览器和 Tauri 使用同一 build；
- 共享 BFF、Cookie Session、权限和 Scope；
- Rust 不托管 Token；
- 服务端可以集中修复 UI；
- 浏览器保留应急和兼容入口。

Tauri 负责应用级体验和系统能力，不负责业务：

- 托盘和单实例；
- 锁屏/睡眠/RDP 隐私；
- WebView2 Profile；
- 安全 Deep Link；
- 受控通知/灵动岛；
- MSI 和版本治理。

## 5. 数据与事务

- PostgreSQL 采用新的 migration lineage。
- Prisma schema 按领域文件拆分并映射到 PostgreSQL named schemas。
- Domain transaction 与 Outbox 同事务。
- Collaboration 只存 Event/Projection，不直接写业务表。
- Redis 是 Session 唯一权威，也可承载短期队列/缓存，但不是业务真相。
- Search index、向量和本地缓存均可重建。

## 6. 一致性

- 领域内：强事务和 optimistic concurrency。
- 跨领域：事件驱动最终一致。
- 传输：at-least-once。
- 消费：eventId/idempotency 去重。
- UI：pending 不是完成，accepted domain event 才完成。
- Replay：按 durable cursor 补偿，不依赖内存 Ring 作为唯一来源。

## 7. 非目标

- 不把所有业务合并成一个后端单体。
- 不把所有业务降格成自然语言聊天。
- 不让 Agent 直接访问数据库或 Shell。
- 不在客户端存储模型密钥、Session Token 或患者数据。
- 不复制旧仓全部代码和历史。
