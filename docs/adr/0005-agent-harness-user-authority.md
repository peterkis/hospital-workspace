---
status: accepted
date: 2026-08-24
---

# ADR-0005：Agent 使用 Coordinator／Worker，但 Harness 和用户裁决为权威

## 决策

Agent Gateway 在服务端运行。Coordinator 创建有界任务，Worker 使用最小工具集合。

Harness 管理状态、Attempt、Decision、Handoff、取消和完成验证。

用户 approval/rejection 高于模型推断。模型文本不能触发未注册工具或设置任务成功。

## 禁止

Shell、SQL、任意 HTTP、客户端文件系统、浏览器自动化、直接数据库和客户端 API Key。
