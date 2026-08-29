# AGENTS.md — Gateway, Identity and Session

## Scope

Applies to `services/gateway/**`.

## Authority

Gateway owns browser/desktop authentication orchestration, HttpOnly Session cookies, CSRF, principal construction, permission and Scope invocation, same-origin BFF routing and logout/switch-person endpoints.

Redis is the runtime Session authority. PostgreSQL may store identity mapping, role/configuration and audit data, but must not become a silent second active Session authority.

## Hard boundaries

- Browser and Desktop use the same Session and BFF chain.
- Tauri/Rust does not receive or inspect tokens.
- Use host-only Secure HttpOnly cookies and explicit CSRF controls.
- Do not expose service-to-service secrets to the frontend.
- Authorization is default deny. Explicit deny is evaluated before allow.
- Ambiguous or failed Scope resolution is `none`.
- A client-hidden button is not authorization.
- Logout/switch-person revokes the complete Session family and returns a bounded server-confirmed result.
- Upstream identity data is normalized through an adapter; domain services do not call the legacy authentication API independently.
- No direct domain-table write from Gateway.
- Sensitive values are never logged or placed in redirect URLs.

## Required tests

- login/callback/state/nonce/PKCE or approved traditional web flow;
- Session creation, rotation, expiry and revocation;
- CSRF;
- Redis unavailable fail-closed;
- permission version invalidation;
- `none/all/restricted` Scope;
- switch-person and shared-terminal behavior;
- open redirect and cookie boundary tests;
- Browser/Desktop equivalence.
