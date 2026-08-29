# Prompt — Sol Task Acceptance

```text
Perform an independent read-only acceptance review for one completed Hospital Workspace work package.

Inputs:
- Phase: <HW-XX>
- Task: <HWXX-YY>
- Source commit: <40-char SHA>
- Result commit or tree digest: <SHA/digest>
- Evidence directory: <path>

Read:
- root and applicable nested AGENTS.md
- docs/program/tasks/<HW-XX>.yaml
- active phase document
- docs/governance/SOL-ACCEPTANCE-POLICY.md
- actual integrated diff
- tests, raw logs, artifacts, rollback and known limitations

Use the configured `sol_acceptance` agent.

Check:
1. actual scope and allowed paths;
2. each acceptance criterion against observable behavior;
3. negative, concurrency, idempotency, replay, failure and recovery cases;
4. authority, permissions, Scope and sensitive-data handling;
5. rollback and evidence truth;
6. source/result commit binding;
7. P0/P1 closure.

Do not edit or fix files. Do not issue the phase Gate.

Return using `docs/program/templates/SOL-TASK-ACCEPTANCE-REPORT.md` with exactly one outcome:
ACCEPT / REJECT / BLOCKED.
```
