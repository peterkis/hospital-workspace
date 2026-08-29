---
status: accepted
date: 2026-08-29
---

# ADR-0008：单一公共活动仓库与私有配置外部化

## 决策

`peterkis/hospital-workspace` 是唯一活动开发仓库，并以 Public 方式创建，以便在 GitHub Free 下使用服务端 Rulesets 和 Required Status Checks。

医院环境配置不进入第二个活动源码仓库，而是通过 Git 忽略路径、服务器/终端文件系统和操作系统凭据存储外部化。

## 不变量

- 公共仓库的 clean clone 不依赖任何医院私有配置即可通过当前公共检查。
- 真实域名、IP、证书、凭据、人员/患者数据、日志、Evidence 和部署拓扑永不提交。
- `.gitignore` 只是预防措施；提交前必须执行公共边界检查和 staged diff 审查。
- 不建立公私双仓同步、Submodule、Subtree 或私有 Overlay 源码仓库。
- 可选旧代码源只通过本地忽略配置读取，不是 CI 或运行依赖。

## 后果

- 一个仓库、一个 Issue/PR/CI/Ruleset/lockfile，降低 1～2 人团队维护复杂度。
- 所有公开文档和测试数据必须使用合成值。
- 医院部署由 Git 外部受控配置完成。
