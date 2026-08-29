---
status: accepted
date: 2026-08-24
---

# ADR-0003：以人员、事件、任务、工作项和上下文为基本模型

## 决策

主界面默认围绕 My Inbox、My Todos、Active Work、Decisions、Agent Runs 和 Knowledge Reviews。

业务实例进入 Thread；需要跟进的责任进入 Work Item；Activity 是事件投影；ContextRef 是受控引用。

不以应用菜单作为默认首页，不把聊天记录当状态数据库。

## 后果

所有领域必须发布版本事件，并提供 WorkItem/Card 映射。UI 可以跨领域统一，但领域服务仍保持独立。
