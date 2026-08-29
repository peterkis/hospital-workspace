# Hospital Workspace

Hospital Workspace 是一个面向医院内网场景、但以**公开通用代码**方式建设的桌面协同工作空间。它以人员、事件、任务、工作项和上下文组织工作，而不是让用户先寻找系统和菜单。

> 本仓库公开可见。任何真实医院配置、域名、IP、证书、人员、患者、日志、证据和部署细节都不得提交。

## 用户看到的基本单位

- 我的待办
- 我的消息
- 一个报修工单
- 一笔确费
- 一次交班
- 一个科室协作事项
- 一个 Agent 任务
- 一个知识整理项目

## 产品主链

```text
事件主动到人
→ 形成可跟进的工作项
→ 在线程中呈现状态、参与者、上下文和决策
→ 通过结构化卡片执行确定性动作
→ 领域服务提交事务并产生事件
→ 时间线、待办、通知和原生表面同步更新
```

## 目标技术基线

- Tauri 2 + Rust + WebView2
- React 19 + Vite 8 + TypeScript
- Node.js 24.18.0 + pnpm 11.17.0
- Fastify
- PostgreSQL 18 + Prisma 7
- Redis
- SSE first + durable replay
- Vitest / node:test / Playwright / Rust tests

精确依赖版本将在 `HW-00` Foundation 阶段由唯一 lockfile 固定。

## 公共与私有边界

公开仓库提交：通用源码、契约、Schema、合成测试数据、通用部署模板和文档。

本地忽略：

```text
config/local/
config/private/
runtime-config/
deploy/private/
deploy/targets/
certificates/local/
certificates/private/
branding/private/
secrets/
evidence/private/
```

完整规则见：

- `PUBLIC-DATA-BOUNDARY.md`
- `SECURITY.md`
- `.gitignore`
- 根 `AGENTS.md`

## 当前状态

当前提交是 **Clean Foundation 治理种子**，不是可上线产品。第一阶段只建设工具链、契约边界、CI、公共安全门和最小目录骨架，不迁移业务实现。

## 开始

1. 阅读根 `AGENTS.md`。
2. 阅读 `docs/program/README.md` 与 `docs/program/phases/HW-00-clean-foundation.md`。
3. 只执行当前 Task Packet。
4. 上一阶段 Gate 未通过，不进入下一阶段。
5. 任何真实环境配置均留在 Git 之外。

## License

Public visibility does not grant a general software license. See `COPYRIGHT.md`. A formal open-source license has not yet been selected.
