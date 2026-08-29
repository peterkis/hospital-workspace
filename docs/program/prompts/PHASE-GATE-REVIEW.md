# Prompt — Phase Gate Review

```text
Review one Hospital Workspace phase at its final integrated result.

Inputs:
- Phase ID: <HW-XX>
- Source commit: <SHA>
- Result commit/tree digest: <SHA/digest>
- Evidence directory: <path>

Workflow:
1. Parent confirms the final diff/evidence is frozen.
2. Run terra_reviewer and terra_security where required.
3. Confirm all task-level acceptance agents/outcomes declared in task YAML.
4. Run the phase-specific Sol agents from acceptance_policy.phase_gate.
5. Run sol_phase_gate last.
6. Parent compares all findings and issues PASS/CONDITIONAL/BLOCKED.
7. Human owner additionally decides pilot/production where required.

A required missing/stale/rejected/blocked Sol report prevents PASS.
Sol never edits code or makes the final Gate decision.
```
