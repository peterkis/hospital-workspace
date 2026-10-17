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

## Workspace Web instruction-discovery cases

For each proposed change below, list the root-to-owning-directory instruction
chain, its combined byte count, the accepted boundary source, and the applicable
transport rule. This is a read-only semantic check: report a conflict instead of
moving code or weakening the boundary to satisfy an instruction.

| Proposed change | Expected instructions | Required interpretation |
| --- | --- | --- |
| Browser client under `apps/workspace-web/src/platform/api/` | Root `AGENTS.md`, then `apps/workspace-web/AGENTS.md` | Browser-initiated HTTP stays in `src/platform/api/` and uses registered literal same-origin targets. |
| Fixed development proxy in `apps/workspace-web/vite.config.ts` | Root `AGENTS.md`, then `apps/workspace-web/AGENTS.md` | The Node-side proxy stays in `vite.config.ts` under `docs/program/mvp/MVP-04-PROTOTYPE-BOUNDARY.yaml`; the browser-client location rule does not relocate it. Verify the fixed loopback target/prefix, credential filtering, and bounded public-safe failures. |

Pass only when both cases resolve without an instruction/accepted-boundary
conflict and the combined instruction chain fits the configured byte budget.
