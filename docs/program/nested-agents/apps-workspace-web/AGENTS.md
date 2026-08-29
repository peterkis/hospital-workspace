# AGENTS.md — Workspace Web

## Scope

Applies to `apps/workspace-web/**`.

## Mission

Implement the person-, event-, task-, work-item- and context-centered hospital workspace. The UI may look conversational, but deterministic business state is never owned by chat text.

The primary interaction hierarchy is:

```text
Person Context
  -> Capability Space
  -> Work Queue
  -> Work Item / Collaboration Thread
  -> Activity Timeline
  -> Structured Card / Canvas
  -> Server-authoritative Command
  -> Domain Event
```

## Hard boundaries

- Use React + Vite as a same-origin immutable web release.
- Browser and Tauri/WebView2 must load the same build and use the same Gateway/BFF Session.
- Do not import Prisma, `pg`, Redis, repositories, server-only modules, service secrets or Tauri internals.
- Do not access a domain service through arbitrary URLs. Use approved SDK clients and Capability Registry routes.
- One Workspace runtime owns one Collaboration SSE connection. Capability modules do not create their own live connection.
- Do not persist patient, clinical, fee, ticket, identity or Agent prompt data in `localStorage`, IndexedDB or URL parameters unless an accepted ADR explicitly authorizes a narrowly scoped encrypted cache.
- Optimistic UI may represent `submitting` or `pending`; it must not represent authoritative completion before the server command result or domain event.
- Unknown event, card, action, schema or version is rendered as a non-actionable safe fallback and reported.
- The UI cannot decide authorization. Server-side Gateway/domain service checks identity, role, Scope, current state and resource version.
- No remote JavaScript plugin execution, `eval`, `new Function`, uncontrolled `innerHTML`, arbitrary iframe or arbitrary endpoint.
- Native surface requests are unavailable until the dedicated Native Surface ADR and Gate pass.

## State ownership

Keep distinct:

1. server query cache;
2. durable event/work-item projection;
3. ephemeral UI state;
4. read and unread cursor;
5. in-flight command state;
6. navigation/deep-link intent.

Do not merge them into a single global store.

## Accessibility and performance

- Keyboard navigation, focus restoration, screen-reader names and reduced motion are release requirements.
- Use virtualization only when measured data requires it.
- No unreadable color-only status.
- Long timelines require stable keys, deterministic ordering and bounded rendering.
- The chat metaphor must not hide business state, due dates, owners, permissions or failure states.

## Required validation

- contract fixture and unknown-version tests;
- pure projector/reducer tests;
- pending/accepted/rejected/conflict/forbidden command tests;
- SSE disconnect, gap recovery, duplicate and out-of-order tests;
- keyboard and accessibility checks;
- browser Playwright tests;
- Tauri/WebView2 end-to-end tests for release-critical flows.
