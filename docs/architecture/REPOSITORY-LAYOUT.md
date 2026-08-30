# Repository Layout

## 终局结构

```text
hospital-workspace/
├── AGENTS.md
├── README.md
├── package.json
├── pnpm-workspace.yaml
├── pnpm-lock.yaml
├── prisma.config.ts
│
├── .codex/
│   ├── config.toml
│   └── agents/
│
├── apps/
│   ├── workspace-web/
│   └── desktop-shell/
│
├── services/
│   ├── gateway/
│   ├── collaboration/
│   ├── hosp-access/
│   ├── tickets/
│   ├── fee/
│   ├── handover/
│   ├── agent-gateway/
│   └── knowledge/
│
├── packages/
│   ├── contracts-core/
│   ├── event-contracts/
│   ├── command-contracts/
│   ├── identity-contracts/
│   ├── capability-contracts/
│   ├── workspace-contracts/
│   ├── workitem-contracts/
│   ├── harness-contracts/
│   ├── card-protocol/
│   ├── agent-contracts/
│   ├── knowledge-contracts/
│   ├── api-client/
│   ├── capability-sdk/
│   ├── hub-client/
│   ├── authz-core/
│   ├── database-runtime/
│   ├── postgres-core/
│   ├── redis-core/
│   ├── time-core/
│   ├── observability/
│   ├── ui/
│   └── testkit/
│
├── database/
│   ├── prisma/
│   │   ├── schema.prisma
│   │   ├── models/
│   │   └── migrations/
│   └── seed/
│
├── infrastructure/
│   ├── nginx/
│   ├── systemd/
│   ├── windows/
│   ├── postgresql/
│   ├── redis/
│   ├── storage/
│   └── monitoring/
│
├── scripts/
│   ├── governance/
│   ├── migration/
│   ├── release/
│   ├── acceptance/
│   ├── load/
│   └── ops/
│
├── docs/
│   ├── adr/
│   ├── architecture/
│   ├── program/
│   ├── migration/
│   ├── governance/
│   ├── security/
│   ├── ops/
│   └── capacity/
│
└── evidence/
```

## 创建规则

不要在初始提交一次创建全部空目录。每个目录必须同时具备：

- 明确 owner；
- public contract；
- build/test/lint/typecheck；
- 路径所有权；
- 阶段任务；
- 删除/回滚策略。

## 包命名

- NPM scope：`@hospital/*`
- 服务 package：`@hospital/service-<name>`
- contracts：`@hospital/<domain>-contracts`
- 运行时 app：`@hospital/workspace-web`
- SDK/client packages：`@hospital/api-client`、`@hospital/capability-sdk`、`@hospital/hub-client`

Rust crate 使用 `hospital_workspace_*`。

`workspace-sdk` 和 `workspace-ui` 不是当前仓库的兼容名称，也不是应被预创建的目录。计划目录使用本文件列出的
`api-client`、`capability-sdk`、`hub-client` 和 `ui`；任何实际 workspace 仍须由已授权阶段创建。

## 冻结的 repository layer model

目录是计划边界，不是 Foundation 阶段的空骨架。`apps/`、`services/` 和 `packages/` 只有在阶段同时提供 owner、公开契约、质量命令和回滚策略时才能进入工作树。

| Layer | Governed paths | Role | Direct first-party dependency direction |
| --- | --- | --- | --- |
| Applications | `apps/workspace-web`, `apps/desktop-shell` | Browser/Desktop delivery surface | Workspace Web: UI, SDK/client, pure contracts/utilities; Desktop Shell: exact contract/SDK utility seams |
| Platform services | `services/gateway`, `collaboration`, `hosp-access`, `agent-gateway` | Shared platform authority | contracts, approved kernels and own bounded repositories |
| Domain services | `services/tickets`, `fee`, `handover`, `knowledge` | Independent business truth | own repository, contracts, approved kernels |
| Pure contracts | `packages/*-contracts`, `contracts-core`, `card-protocol` | Versioned transport/persistence contracts | pure contracts/utilities; external `zod` only |
| SDK/client | `api-client`, `capability-sdk`, `hub-client` | Client-facing typed integration | pure contracts/utilities; no server/database/native runtime |
| Repositories | `packages/<domain>-repository` | Domain-owned persistence adapters | database runtime, contracts, approved kernels |
| Infrastructure kernels | `postgres-core`, `redis-core`, `observability` | Approved server infrastructure seams | pure contracts/utilities |
| Database runtime | `database-runtime` | Only approved raw database runtime seam | contracts, approved kernels/utilities |
| Pure utilities | `authz-core`, `time-core` | Side-effect-free shared utilities | pure utilities only |
| UI / test support | `ui`, `testkit` | Presentation and test-only support | UI has no server/database/native runtime; React is permitted in UI |

Top-level `database/**` migration assets and `infrastructure/**` deployment assets are not JavaScript workspaces. The machine-readable authority is [DEPENDENCY-POLICY.yaml](../governance/DEPENDENCY-POLICY.yaml); its JSON-compatible YAML format is intentionally strict JSON so the checker adds no parser dependency. The checker reconciles on-disk child manifests with the supported quoted-pattern subset of `pnpm-workspace.yaml`; it neither assumes a manifest is registered nor inspects Git tracking state.

## 源码和生成物

- `src/` 只保存源码。
- `dist/`、`generated/`、`target/`、`.next/`、Playwright trace、证书私钥和临时 Evidence 不进入 Git。
- 不允许 `.ts`、`.js`、`.d.ts` 三份同源文件同时提交。
- 生成文件必须由 build 复现。
