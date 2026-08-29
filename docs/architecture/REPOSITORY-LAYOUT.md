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

Rust crate 使用 `hospital_workspace_*`。

## 源码和生成物

- `src/` 只保存源码。
- `dist/`、`generated/`、`target/`、`.next/`、Playwright trace、证书私钥和临时 Evidence 不进入 Git。
- 不允许 `.ts`、`.js`、`.d.ts` 三份同源文件同时提交。
- 生成文件必须由 build 复现。
