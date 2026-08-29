---
status: accepted
date: 2026-08-24
---

# ADR-0002：Tauri 加载同源不可变 Workspace Web

## 决策

Workspace UI 使用 React/Vite 生成不可变静态 release：

```text
https://<approved-origin>/apps/workspace/<releaseId>/
```

浏览器和 Tauri WebView 使用同一 build、Gateway/BFF、HttpOnly Session、权限和 Scope。

本地 Tauri Shell 只负责窗口、Profile、隐私、托盘、深链和受控原生表面。Rust 不读取 Token/Cookie。

## 拒绝方案

- 本地 `tauri://` 业务 UI + Native Token Bridge；
- Electron；
- 每个业务一个 Remote WebView；
- 在客户端保存 Refresh Token。

## 回滚

Registry/Nginx 指针回到上一 approved Workspace release；Desktop Runtime 不需同步回滚，除非兼容矩阵要求。
