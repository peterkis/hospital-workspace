# Technology Stack

## 固定 Foundation 基线

| 层 | 选择 |
| --- | --- |
| Node.js | `24.18.0` |
| Package manager | `pnpm@11.17.0` |
| Frontend | React 19 + Vite 8 + TypeScript |
| Desktop | Tauri 2 + Rust 2021 + WebView2 |
| API services | Fastify 5 |
| Contracts | TypeScript + Zod |
| Database | PostgreSQL 18 |
| ORM/Migrations | Prisma 7 multi-file + multi-schema |
| Session/ephemeral | Redis |
| Realtime | SSE first + durable replay |
| Object storage | S3-compatible/MinIO |
| Tests | Vitest, node:test, Playwright, Rust tests |
| Observability | Pino + OpenTelemetry-compatible interfaces |
| Identity | Logto OSS + Hospital Identity Adapter |
| Authorization | server-side Authz Core + Scope Resolver |

精确依赖版本在 HW-00/HW-01 由 lockfile 固定。不要从旧仓直接复制版本矩阵。

## 关键选择理由

### Vite 而非 Next.js

Workspace 是一个长期运行、API 驱动的客户端：

- 不需要每个领域独立 SSR/RSC；
- 浏览器和 Tauri 共用静态 build；
- 减少 Server Action、standalone tracing 和多 Next release；
- BFF 和服务端逻辑明确留在 Gateway/Services。

### SSE first

当前需求以服务器向客户端推送事件为主：

- 更简单；
- 可通过 same-origin BFF；
- 和 durable gap recovery 配合；
- 不因“桌面化”自动引入 WebSocket。

只有实时双向协作、连接规模或延迟数据证明需要时才新建 ADR。

### Prisma 7 multi-file

- 继续复用团队既有 Prisma 经验；
- schema 文件可按领域拆分；
- PostgreSQL named schema 形成逻辑所有权；
- 单迁移谱系适合小团队；
- repository-only checker 防止跨领域随意访问。

### Tauri remote same-origin Workspace

- 浏览器和桌面同一 UI；
- 复用 BFF/HttpOnly Session；
- Rust 不持有 Token；
- 服务端集中更新；
- 仍能提供托盘、通知、灵动岛、深链和系统生命周期。

## 禁止替代

未经 ADR 不得改为：

- Electron + 本地 Python 后端；
- 客户端 SQLite/JSONL 业务数据库；
- GraphQL 作为默认平台协议；
- WebSocket 取代 SSE；
- Kubernetes 作为初始部署必需；
- 多仓微服务；
- 客户端 OIDC Refresh Token；
- 任意动态微前端 JavaScript。
