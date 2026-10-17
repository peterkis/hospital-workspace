# AGENTS.md — Workspace Web

## Scope and authority

Applies to `apps/workspace-web/**`. Read the active overlay/task and the root
instructions first.

Workspace Web is a presentation and interaction surface. It does not own
Ticket, fee, handover, knowledge, identity, authorization, or Agent-run truth.
Pending UI is not completion. Public-synthetic prototype behavior is not a
backend, clinical pilot, or production capability.

## Browser boundary

- Use the same immutable same-origin React/Vite build in browser and Tauri.
- Keep Prisma, `pg`, Redis, repositories, service secrets, Node server modules,
  and Tauri internals out of frontend code.
- Put browser-initiated HTTP clients only under `src/platform/api/`. Use
  registered, literal same-origin targets. Capability, feature, and composition
  code must not create direct or alternate browser transport.
- Keep the fixed Node-side MVP-04 development proxy in `vite.config.ts`, as
  defined by `docs/program/mvp/MVP-04-PROTOTYPE-BOUNDARY.yaml`. Its loopback
  target, route prefix, credential filtering, and public-safe failures remain
  bounded by that contract; this does not authorize arbitrary proxy targets.
- One Workspace runtime owns the Collaboration SSE connection. Capability
  modules do not create their own live connection.
- Do not persist sensitive or business content in URL parameters,
  `localStorage`, IndexedDB, generic notifications, or native payloads.
- Render unknown events, cards, actions, schemas, and versions as safe,
  non-actionable fallbacks.

`src/source-contract.test.ts` is a regression guard, not a runtime sandbox. For
boundary changes, inventory production TypeScript/TSX, HTML, CSS/CSSOM, JSX
bindings, imports, resource properties, DOM mutation, and proxy request/response
headers before implementation. Prefer syntax-aware inspection and explicit
allowlists to incremental regular expressions.

When `App.tsx` or another digest-bound file changes, inspect every affected
dynamic access and update only the reviewed file digest. Never bulk-refresh
hashes to make the test pass.

## UI state and accessibility

- Keep server query/projection, ephemeral UI, cursors, in-flight commands, and
  navigation intent distinct.
- Bind global keyboard handlers to the surface that is actually rendered.
  Hidden state must not change from keys pressed on another page or exceptional
  state.
- For navigation changes, test a state table covering search, space/person
  filters, favorites, detail/thread transitions, Escape, sidebar close, and
  mobile focus restoration.
- Keyboard operation, visible focus, accessible names, contrast, and reduced
  motion are required behavior.

## Validation

Start with the affected test file, then the package lint, typecheck, test, and
build commands. A deliberate TDD RED, an `rg` no-match, a pending remote check,
a test failure, a test that never started, and infrastructure failure are
different outcomes; label them separately in evidence.

If the default parallel Vitest run times out only in long lifecycle tests, keep
the failed result. Diagnose with the affected test in isolation and, when
needed, `--maxWorkers=1`. Do not raise timeouts, add retries, or replace the
required default gate merely to obtain green output.

Focused green tests do not complete a browser/security boundary review. Freeze
the final tree, run the declared full Gate and independent review, and state
what was not run. Browser evidence does not prove Windows, Tauri, WebView2, or
production behavior.

Before repeating a known debugging path, read
`docs/retrospectives/README.md`.
