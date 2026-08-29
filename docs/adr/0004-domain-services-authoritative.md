---
status: accepted
date: 2026-08-24
---

# ADR-0004：领域服务是业务状态唯一权威

## 决策

Tickets、Fee、Handover、Knowledge 和 Agent Run 由各自服务拥有。

Collaboration 只拥有 Event、Inbox、Todo、WorkItem Projection、Harness、Decision 和 Handoff。

客户端、Hub、通知、聊天和 Agent 不能直接修改领域表或宣称业务完成。

## 一致性

领域内强事务和 optimistic concurrency；跨领域 Outbox 事件最终一致。
