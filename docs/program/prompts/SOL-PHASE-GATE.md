# Prompt — Sol Phase Gate

```text
Perform the independent phase-exit review for <HW-XX>.

Use the configured `sol_phase_gate` agent.

Read:
- root and nested AGENTS.md
- ROADMAP.md, GATES.md and SOL-ACCEPTANCE-POLICY.md
- active phase document and task YAML
- final integrated diff
- all task status and required Terra/Sol acceptance reports
- Evidence Manifest and raw logs
- rollback/recovery evidence
- open risks and limitations

Verify:
1. all task dependencies and task acceptance routes;
2. required Sol reports exist and match the final commit/tree;
3. cross-task outputs do not create duplicate authorities;
4. no legacy compatibility or future-phase scope leaked in;
5. negative/failure/platform/privacy evidence is real;
6. P0/P1 are closed;
7. rollback is executable;
8. PASS contains no stale/NOT_RUN/unsupported evidence.

Do not edit files and do not make the final project decision.

Return using `SOL-PHASE-GATE-REPORT.md` with exactly:
PASS_RECOMMENDED / CONDITIONAL_RECOMMENDED / BLOCKED.
```
