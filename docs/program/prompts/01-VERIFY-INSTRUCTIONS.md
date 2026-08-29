# Prompt — Verify instructions and subagents

```text
Read-only verification.

1. List active AGENTS.md / AGENTS.override.md sources and scope.
2. List custom agents and confirm:
   luna_explorer
   luna_inventory
   luna_docs
   luna_fixtures
   terra_contracts
   terra_worker
   terra_migrator
   terra_tester
   terra_browser
   terra_reviewer
   terra_security
   sol_acceptance
   sol_architecture_security
   sol_phase_gate
3. Ask luna_explorer to summarize the current phase, authority matrix and do-not-migrate rules.
4. Ask terra_reviewer to check instruction truncation, overbroad sandbox settings and whether any implementation agent can make final security/Gate decisions.
5. Ask each Sol agent, in read-only mode, to return its role, permitted outcome vocabulary and prohibited actions without reviewing code.
6. Confirm all Sol agents use model `gpt-5.6-sol`, are read-only, and cannot issue the parent/human final decision.
7. Report unavailable models exactly. Do not silently substitute.
8. Do not modify files.
```
