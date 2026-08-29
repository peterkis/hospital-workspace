# Prompt — Start HW-04 事件、Inbox、Todo、回放与协同平台

```text
Execute only HW-04.

Read:
- root AGENTS.md
- docs/program/STATUS.md
- docs/program/ROADMAP.md
- docs/program/GATES.md
- docs/governance/MODEL-ROUTING.md
- docs/governance/SOL-ACCEPTANCE-POLICY.md
- docs/program/phases/HW-04-event-collaboration-platform.md
- docs/program/tasks/HW-04.yaml
- applicable architecture, migration, ADR and nested AGENTS files

Workflow:

1. Check dependent Gates, branch, HEAD and worktree.
2. Use Luna for read-only current-state verification, inventories, docs and fixtures.
3. Parent creates a dependency graph and write-path lock table.
4. Freeze decisions and instantiate one standard Work Package per task.
5. Delegate only disjoint bounded implementation/testing work to Terra/Luna.
6. Tasks with primary_owner=parent_codex remain parent-led.
7. Stop on any task stop_if condition.
8. Parent inspects actual integrated diffs and reruns critical tests.
9. Run terra_reviewer; run terra_security where required.
10. For every task, follow acceptance_tier and acceptance_agents from the YAML:
    - high-risk: sol_acceptance;
    - critical architecture/security: sol_architecture_security;
    - critical E2E: declared Sol route;
    - low/medium: no task-level Sol unless explicitly declared.
11. Freeze final result commit/tree and Evidence before each Sol review.
12. Any material change after Sol review invalidates it and requires re-review.
13. After all tasks pass, run phase-level Sol agents: sol_acceptance, sol_phase_gate.
14. sol_phase_gate must review the final integrated phase state.
15. Parent issues PASS/CONDITIONAL/BLOCKED; Sol only recommends.
16. Human decision is additionally required where the phase policy declares it.
17. Update docs/program/STATUS.md only in the Gate commit.
18. Do not begin the next phase, push, merge, close Issues or write external systems without explicit authorization.

Return:
- completed/not completed tasks;
- files changed;
- commands and exact results;
- Terra and Sol acceptance report paths/outcomes;
- evidence paths;
- P0/P1/P2/P3 findings;
- rollback;
- parent Gate decision;
- human decision status where required;
- next suggested Work Package.
```
