# AGENTS.md — Gateway, Identity and Session

## Scope and authority

Applies to `services/gateway/**`. Read the active task, accepted identity and
security ADRs, and root instructions first.

Gateway owns browser/desktop authentication orchestration, HttpOnly Session
cookies, CSRF, principal construction, permission and Scope invocation,
same-origin BFF routing, and logout/switch-person endpoints. Redis is the only
runtime Session authority.

## Hard boundaries

- Browser and Desktop use the same Session and BFF chain. Tauri/Rust does not
  receive or inspect tokens.
- Use host-only Secure HttpOnly cookies and explicit CSRF controls.
- Authorization is default deny; explicit deny precedes allow. Failed or
  ambiguous Scope is `none`.
- Logout and switch-person revoke the complete Session family and return a
  bounded server-confirmed result.
- Normalize upstream identity through an adapter. Domain services do not call
  legacy authentication independently.
- Gateway does not write domain tables or expose service credentials to the
  frontend. Sensitive values never enter logs or redirect URLs.
- Synthetic persona, role, Scope, or receipt values in the MVP prototype are
  presentation constraints, not real identity, Session, Authz, or domain
  completion.

## Required validation

Test request/response bounds and public-safe failures for prototype routes. For
canonical identity work, add login/callback, state/nonce/PKCE, Session
creation/rotation/expiry/revocation, CSRF, Redis fail-closed, permission-version,
`none/all/restricted` Scope, switch-person, open-redirect, cookie-boundary, and
Browser/Desktop-equivalence tests declared by the task.

Bind proxy and transport evidence to the exact final tree. An ancillary GitHub
API or reaction lookup failure is not authoritative review state; retry
idempotent reads and verify CI, head SHA, and unresolved discussions through an
independent authoritative query.
