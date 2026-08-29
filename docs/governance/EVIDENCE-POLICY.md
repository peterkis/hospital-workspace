# Evidence Policy

## Gate states

- PASS: all required checks, negative/recovery scenarios, artifacts, Terra reviews and declared Sol reports pass; `sol_phase_gate` is `PASS_RECOMMENDED`.
- CONDITIONAL: only non-security, non-permission, non-data-integrity follow-up remains.
- BLOCKED: required evidence/review is failed, missing, stale, bound to the wrong result, or unsupported by the environment.

P0/P1, identity, authorization, sensitive data, Tauri security, wrong business state, migration/rollback, evidence integrity and missing/rejected/blocked required Sol acceptance cannot be conditional.

## Evidence fields

- schema version;
- phase and gate;
- source commit;
- result commit or worktree digest;
- branch;
- environment;
- commands and exit codes;
- raw logs;
- artifacts and SHA-256;
- negative scenarios;
- rollback/recovery;
- Terra reviewer/security reports;
- required Sol task/architecture/phase reports;
- limitations;
- parent decision and timestamp;
- human decision where required.

## Sol report truth

Every Sol report records:

- exact agent/model;
- review type;
- source and result commit/tree;
- Evidence Manifest hash;
- outcome;
- report path;
- limitations.

A Sol report bound to an older commit/tree is stale. Any material code, test, Evidence or rollback change requires re-review.

## Environment truth

- Ubuntu CI does not prove Windows/Tauri/WebView2/MSI.
- WSL2 does not prove physical Anolis.
- Mock does not prove upstream HIS.
- File existence does not prove behavior.
- A screenshot does not prove backend state.
- A model summary does not prove a command ran.
- A Sol recommendation does not prove an environment it did not observe.

## Privacy

Evidence uses synthetic or redacted data. It must not contain:

- real patient/employee names;
- IDs, diagnosis, phone, email or detailed fee;
- Cookie, Token, password or API key;
- private keys;
- sensitive internal hostnames when not required;
- complete prompts containing clinical data.

## Immutability

Approved evidence is not rewritten. A new source commit, result tree, environment or rerun creates a new evidence run.
