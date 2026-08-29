---
status: accepted
date: 2026-08-24
---

# ADR-0007：单 PostgreSQL、领域 Schema、单迁移谱系与 Repository-only 访问

## 决策

采用 PostgreSQL 18 + Prisma 7 multi-file/multi-schema。

数据库从新仓 0001 migration 开始。模型按 iam/config/audit/collab/ticket/fee/handover/agent/knowledge schema 分组。

Raw Prisma Client 只允许 repository 模块使用。服务不能跨领域 schema 直接写入。

Redis 是 Session 唯一运行时权威；不建立 PostgreSQL Session/RefreshSession 权威表。

## 理由

对 1～2 人团队，单 migration lineage 比多数据库/多迁移器更可维护；路径所有权和 repository 门控制领域边界。
