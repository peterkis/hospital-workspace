# Evidence Policy

## Gate states

- PASS: all required checks, negative/recovery scenarios, artifacts, Terra reviews and declared Sol reports pass; `sol_phase_gate` is `PASS_RECOMMENDED`.
- CONDITIONAL: only non-security, non-permission, non-data-integrity follow-up remains.
- BLOCKED: required evidence/review is failed, missing, stale, bound to the wrong result, or unsupported by the environment.

P0/P1, identity, authorization, sensitive data, Tauri security, wrong business state, migration/rollback, evidence integrity and missing/rejected/blocked required Sol acceptance cannot be conditional.

## Risk-proportional task Evidence

Low-risk documentation tasks normally use one implementation commit, required GitHub `checks`, and one read-only Terra review. A committed per-task Evidence directory or per-Markdown SHA-256 manifest is unnecessary unless the task explicitly creates a durable domain, security, migration, database, release, product, or compliance artifact.

Medium-risk implementation tasks require targeted local tests, full required CI, and a Terra review bound to the final PR head SHA or final staged tree. CI artifacts and PR metadata are the normal Evidence. Do not add the reviewer report to the tree being reviewed.

High-risk and critical tasks retain structured Evidence, their declared Terra/Sol routing, rollback, negative and recovery evidence. Identity, authorization, database, Tauri, clinical, financial, migration, rollback and Evidence-integrity gates are never silently reduced by this policy.

Phase Gates use one consolidated phase Evidence set and the required `sol_phase_gate`; they do not copy every low-risk task log into Git. Sol requirements remain unchanged.

CI artifacts, GitHub PR review/comments, and parent-session receipts are valid immutable Evidence only when they bind to the exact head SHA or tree. Reviewer receipts are external by default to prevent a recursive review-the-review-file cycle.

Do not run an identical full test suite both locally and in CI unless the local environment is the actual target environment, CI failed, the reviewed result changed, or the task explicitly requires a second environment.

## Structured Evidence fields

- schema version;
- phase and gate;
- source commit;
- result commit or worktree digest;
- branch;
- environment;
- commands and exit codes;
- CI/PR artifact references instead of committed raw logs where appropriate;
- artifacts and SHA-256;
- negative scenarios;
- rollback/recovery;
- Terra reviewer/security reports;
- required Sol task/architecture/phase reports;
- limitations;
- parent decision and timestamp;
- human decision where required.

## Review receipt truth

Every required external Terra/Sol receipt records:

- exact agent/model;
- review type;
- source and result commit/tree;
- exact result commit/tree binding;
- outcome;
- report path;
- limitations.

A receipt bound to an older commit/tree is stale. Any material code, test, Evidence or rollback change requires re-review.

## Environment truth

- Ubuntu CI does not prove Windows/Tauri/WebView2/MSI or physical Anolis.
- WSL2 does not prove physical Anolis.
- Mock does not prove real upstream HIS.
- File existence does not prove behavior.
- A screenshot does not prove backend state.
- A model summary does not prove a command ran.
- A Sol recommendation does not prove an environment it did not observe.

## Privacy

Evidence uses synthetic or redacted data. It must not contain:

- patient data, employee/person data or identity numbers;
- diagnosis or clinical text, phone, email, or detailed fee;
- Cookie, Token, password, API key, or client secret;
- private key or signing material;
- sensitive internal hostname or network data;
- complete clinical prompt content.

Every structured Evidence manifest records an explicit `CLEAR` result for each of these categories. Static scanning rejects recognizable prohibited content but cannot establish that a string is or is not a real human name; the explicit category result and reviewer accountability remain required.

## Recovery and rollback

For a high- or critical-risk PASS, rollback and recovery each require a PASS receipt/reference, or a documented NOT_APPLICABLE result containing a rationale, applicability boundary, and reviewer confirmation. A NOT_APPLICABLE result is forbidden when the task packet or Gate requires an actual rollback or recovery rehearsal.

## Immutability

Approved evidence is not rewritten. A new source commit, result tree, environment or rerun creates a new evidence run.
