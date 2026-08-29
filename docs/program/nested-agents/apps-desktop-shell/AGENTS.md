# AGENTS.md — Desktop Trusted Shell

## Scope

Applies to `apps/desktop-shell/**`.

This directory is a privileged Windows/Tauri security boundary. Parent Codex leads any security-significant change. Terra and Luna may explore, implement bounded pure logic, test and review, but cannot independently approve the boundary.

## Invariants

- Rust never reads, stores, logs or exposes Gateway/BFF cookies, access tokens, refresh tokens, localStorage or patient/business data.
- The Workspace web content has no native permission by default.
- No generic shell, filesystem, process, arbitrary HTTP, clipboard, registry, updater or unrestricted window plugin.
- Preserve exact window label, origin and immutable release path binding.
- Preserve launch-scoped shared InPrivate WebView2 profile and fail-closed cleanup.
- Logout and switch-person must be confirmed by the server before profile termination.
- Lock, sleep, RDP disconnect and second-instance activation enter a Trusted Resume gate before revealing content.
- System certificate trust is the default. No global certificate bypass, disabled `webSecurity` or command-line TLS bypass.
- Required security-audit failure is a runtime failure, not a warning.
- Unknown environment, registry policy, navigation, iframe, download, popup or deep-link input is denied.

## Native bridge rule

Any native bridge requires an accepted ADR and all of:

- one exact caller label/origin/path;
- one versioned typed command;
- Rust-side schema and semantic validation;
- strict length and sensitivity rules;
- rate limit and deduplication;
- persistent audit;
- negative and fuzz tests;
- explicit kill switch and rollback.

The bridge must never evolve into generic native access.

## Required validation

- pure Rust policy tests;
- Windows-target `cargo check`;
- real WebView2 lifecycle probes;
- profile and browser-process termination tests;
- lock/resume/switch-person/logout tests;
- certificate and navigation negative matrix;
- MSI install/upgrade/rollback tests where applicable.

Linux-only or mocked results do not prove Windows/WebView2 behavior.
