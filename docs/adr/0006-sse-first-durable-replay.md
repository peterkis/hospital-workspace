---
status: accepted
date: 2026-08-24
---

# ADR-0006：SSE First 与 Durable Replay

## 决策

Workspace 初期使用一个 same-origin SSE 连接。

SSE 只传输实时投影；Event Store/Inbox 是持久来源。断线后先 gap recovery，再恢复 live。传输为 at-least-once，消费必须幂等。

## 拒绝方案

- 因为桌面化直接改 WebSocket；
- 只依赖内存 Ring；
- 将 seq 差值当未读；
- 声称 exactly-once。

WebSocket 只有在测量证明双向实时需求时通过新 ADR 引入。
