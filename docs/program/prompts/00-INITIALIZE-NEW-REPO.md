# Prompt — Verify the initialized public repository

```text
You are verifying the newly initialized public repository peterkis/hospital-workspace.

Read:
- root AGENTS.md;
- PUBLIC-DATA-BOUNDARY.md;
- docs/program/README.md;
- docs/program/GATES.md;
- docs/program/phases/HW-00-clean-foundation.md;
- docs/program/tasks/HW-00.yaml.

Rules:
1. This repository starts from one clean public commit and has no product-history dependency.
2. No legacy source is required. If ignored config/local/legacy-source.yaml is absent, continue in no-source mode and implement from target contracts.
3. Do not create compatibility layers, copy old Git history, or add another active source repository.
4. First perform read-only discovery only.
5. Verify Git branch/HEAD/remotes/status, instruction discovery, public-data boundary, 103-task DAG, current G00 blockers and allowed paths.
6. Do not modify files, add dependencies, commit, push, create PRs, change repository settings or enter HW-01.
7. Return the proposed HW00-02 Task Packet after confirming HW00-01 bootstrap artifacts are already present.
```
