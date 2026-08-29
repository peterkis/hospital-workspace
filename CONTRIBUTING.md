# Contributing

## Workflow

1. Read `AGENTS.md` and the active `docs/program/tasks/HW-xx.yaml`.
2. Create a branch named `hw/<phase>/<task>-short-name`.
3. Keep changes inside the Task Packet's allowed paths.
4. Use synthetic data only.
5. Run the current required checks and `git diff --check`.
6. Open a Pull Request; do not push directly to `main` after the Ruleset is active.

## Public safety

Never include real hospital names, endpoints, IPs, credentials, certificates, screenshots, logs, evidence, employee data or patient data. Examples must use `Example Hospital`, `example.internal`, `10.0.0.0/24` and deterministic synthetic records.

## Review

High-risk paths require the owner/reviewer roles defined in `.github/PATH-OWNERSHIP.yaml`. Agent reviews are evidence; the human repository owner retains final merge and release authority.
