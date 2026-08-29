# HW00-01 Instruction Discovery

- Captured: `2026-08-29T13:58:56Z`
- Source commit: `f12e3f4240319b912d2438f263d529530be8f599`
- Source tree: `22555e69d205065521f872fc9dade094f56bd211`
- Result: `PASS`

## Instruction files

Nine `AGENTS.md` files and no `AGENTS.override.md` files were found.

| File | Effective/declared scope |
| --- | --- |
| `AGENTS.md` | Effective repository-root instruction. |
| `docs/program/nested-agents/apps-desktop-shell/AGENTS.md` | Template declaring `apps/desktop-shell/**`. |
| `docs/program/nested-agents/apps-workspace-web/AGENTS.md` | Template declaring `apps/workspace-web/**`. |
| `docs/program/nested-agents/database/AGENTS.md` | Template declaring `database/**`. |
| `docs/program/nested-agents/packages-contracts/AGENTS.md` | Template for pure contract packages. |
| `docs/program/nested-agents/services-agent-gateway/AGENTS.md` | Template declaring `services/agent-gateway/**`. |
| `docs/program/nested-agents/services-collaboration/AGENTS.md` | Template declaring `services/collaboration/**`. |
| `docs/program/nested-agents/services-domain/AGENTS.md` | Template for domain-service paths. |
| `docs/program/nested-agents/services-gateway/AGENTS.md` | Template declaring `services/gateway/**`. |

The eight nested files are stored below `docs/program/nested-agents/**`; they
document future target scopes but are not yet nearest-parent instructions for
runtime roots. No runtime roots exist in this seed.

Root `AGENTS.md` is 22,849 bytes, below the 32 KiB default instruction budget.
It identifies this repository as the single public greenfield Program and fixes
the public-data, authority, migration, model-routing, Gate, Git, and phase rules.

## Project agents

All 14 TOML files parsed successfully.

| Agent | Model | Effort | Sandbox |
| --- | --- | --- | --- |
| `luna_docs` | `gpt-5.6-luna` | medium | workspace-write |
| `luna_explorer` | `gpt-5.6-luna` | medium | read-only |
| `luna_fixtures` | `gpt-5.6-luna` | medium | workspace-write |
| `luna_inventory` | `gpt-5.6-luna` | low | read-only |
| `terra_browser` | `gpt-5.6-terra` | high | workspace-write |
| `terra_contracts` | `gpt-5.6-terra` | high | workspace-write |
| `terra_migrator` | `gpt-5.6-terra` | high | workspace-write |
| `terra_reviewer` | `gpt-5.6-terra` | high | read-only |
| `terra_security` | `gpt-5.6-terra` | max | read-only |
| `terra_tester` | `gpt-5.6-terra` | high | workspace-write |
| `terra_worker` | `gpt-5.6-terra` | high | workspace-write |
| `sol_acceptance` | `gpt-5.6-sol` | xhigh | read-only |
| `sol_architecture_security` | `gpt-5.6-sol` | max | read-only |
| `sol_phase_gate` | `gpt-5.6-sol` | max | read-only |

`.codex/config.toml` enables project agents, limits concurrency to eight, and
keeps the default subagent route on Terra rather than Sol.

## Independent inventory evidence

A read-only `luna_inventory` run independently confirmed the branch, source
commit/tree, clean pre-evidence worktree, 152 tracked paths, nine instruction
files, 14 agent TOMLs, no override, no runtime roots, no Git special modes, and
no prohibited-path candidates. Luna made no files or Git changes and did not
make an acceptance or Gate decision.

## Commands

- `rg --files --hidden --no-ignore -g 'AGENTS.md' -g 'AGENTS.override.md' -g '!.git/**'`
- `python -B -c <tomllib parse of .codex/agents/*.toml>`
- root byte measurement through the filesystem metadata

All commands completed successfully. No access token, local account name,
machine identifier, private configuration, or secret is included in this receipt.
