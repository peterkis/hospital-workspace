## Program / Task

- Phase: `HW-xx`
- Work packages: `HWxx-yy`
- Primary owner role:
- Required reviewer roles:

## Purpose

Describe the single observable outcome.

## Scope

### Changed

-

### Explicitly not changed

-

## Person / Event / Work-item impact

- Person or role context:
- Event types:
- Work-item state transitions:
- Cards/commands:
- Context/provenance:

## Authority boundaries

- [ ] Domain service remains authoritative.
- [ ] Client does not become authorization or completion authority.
- [ ] Collaboration/Hub does not directly mutate domain tables.
- [ ] Agent cannot bypass tools, approval or Harness.
- [ ] Tauri/Rust does not receive application credentials.

## Public repository safety

- [ ] Staged diff contains no real hospital name, IP, internal domain, certificate, credential, person/patient data, log, dump or private evidence.
- [ ] Examples use only approved synthetic namespaces.
- [ ] `python tools/validate_repository.py --git-index` passes.

## Identity, Scope and sensitive-data impact

- [ ] No impact
- [ ] Impact and negative tests described below

## Contract / event / schema changes

- [ ] None
- [ ] Versioned contract and fixtures
- [ ] Database migration and recovery plan
- [ ] Event Catalog update
- [ ] State-transition table update

## Legacy migration

- [ ] No legacy code copied
- [ ] Migration Receipt attached with reviewed local-source provenance and public-safe hashes
- [ ] Generated/obsolete files removed
- [ ] No legacy runtime dependency or compatibility layer added

## Validation

- [ ] Targeted tests
- [ ] Negative and recovery tests
- [ ] Lint
- [ ] Typecheck
- [ ] Build
- [ ] Dependency/path ownership checks
- [ ] Contract/event/schema checks
- [ ] Browser/Desktop checks where applicable
- [ ] `git diff --check`
- [ ] Evidence Manifest

Commands and evidence:

## Independent acceptance

- Acceptance tier(s):
- Required acceptance agents:
- [ ] `terra_reviewer` complete
- [ ] `terra_security` complete where required
- [ ] `sol_acceptance` complete where required
- [ ] `sol_architecture_security` complete where required
- [ ] `sol_phase_gate` complete for phase-exit PR
- Final reviewed commit/tree:
- Required outcomes:
- Report paths:

A required Sol report must be rerun after material changes.

## Rollback

-

## Risks / limitations

-
