# Prompt — Integrated Diff Review

```text
Integrate completed bounded work packages for the active phase.

1. Collect actual diffs, task returns, tests and evidence.
2. Reject out-of-scope paths, duplicate abstractions, hidden fallback and authority drift.
3. Resolve semantic conflicts.
4. Rerun critical commands on the integrated state.
5. Freeze result commit/tree digest and Evidence.
6. Run terra_reviewer and terra_security where required.
7. Run each task's declared Sol acceptance route.
8. If any required review rejects/blocks, return work to a new bounded implementation task; acceptance agents do not fix it.
9. After all task acceptances pass, run the phase-specific Sol agents and sol_phase_gate.
10. Parent issues final Gate and records all reports.

Do not commit/push/merge/release unless explicitly authorized.
```
