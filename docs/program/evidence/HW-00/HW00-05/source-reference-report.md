# HW00-05 source reference report

## Binding

| Field | Value |
| --- | --- |
| Task | `HW00-05` |
| Hospital Workspace source main commit | `c1d7b7b169dc4409fd0c852c87b60aafe13e76b9` |
| HW00-05 implementation commit | `ff9fcb9c5aada76e991779236fc8a9ad1ef6dd93` |
| Implementation tree object ID | `fb8129ff4e483d2c336f0b8d1809d5aa1f2a841d` |
| Matrix blob object ID | `04aea85851ac9d979197c4881f57512a17685e4c` |
| Knowe repository | `HirezmingD/Knowe-agent-groupchat` |
| Exact Knowe commit | `1e584f84734e9db55515ef4391fcb9e9c40399cd` |
| License | MIT |
| Source verification date | `2026-08-30` |
| Unique pinned source paths inspected | 73 |
| Pinned full-SHA source links | 78 |
| Mutable branch/latest references | 0 |

Knowe was used only as an architecture, interaction, and mechanism reference.
It is not Hospital Workspace legacy source, architecture authority, a Git
submodule, or a build, CI, test, runtime, release, or rollback dependency.

## Verification method and result

- `Get-Command firecrawl -ErrorAction SilentlyContinue` found no Firecrawl CLI.
- The immutable commit patch endpoint returned HTTP 200.
- Pinned raw `README.md`, `TECH.md`, and `LICENSE` requests returned HTTP 200
  with 2,588, 4,204, and 1,069 bytes respectively.
- The fixed-commit codeload ZIP was downloaded into a process-memory byte array
  and inspected with an in-memory .NET `ZipArchive`. It contained 914 files;
  all 73 cited paths existed and the missing-path count was zero.
- The 65,842,230-byte archive was not written to disk. No Knowe checkout,
  archive, source file, or temporary extract was persisted inside the target
  repository.
- README product/quick-start sections, TECH architecture/Harness/privacy
  sections, the MIT license, and the named modules and symbols below were
  inspected at the fixed commit. Observations in the matrix are paraphrases.

One unauthenticated GitHub API metadata probe by a read-only support verifier
returned HTTP 403 because of rate limiting and was not used as evidence. The
immutable commit patch, pinned raw files, and fixed-SHA codeload requests all
succeeded independently.

The pinned source contains a client API-key entry surface, but the inspected
state shows the backend does not return the stored key. Hospital Workspace does
not adopt either the entry flow or any browser credential custody/authority;
server-only provider secrets remain the governing replacement. Generic build
tool packages whose names contain `plugin` are not a remotely loaded plugin
module, and no such remote module was found in the cited runtime paths.

## Inspected sections, symbols, and modules

| Catalog | Inspection focus |
| --- | --- |
| `S-01` | README introduction, Agent-team/customization/one-sentence/quick-start sections; TECH architecture, Harness completion, development, verification, configuration, installer, and privacy sections; MIT license |
| `S-02` | Electron main/preload/tray/updater boundaries and bundled Python launcher |
| `S-03` | App, chat stream, conversation list, project modal, and stream bubble |
| `S-04` | roster/add-Agent UI and Agent/local identity storage |
| `S-05` | engine orchestration, roles, and Worker gateway runtime |
| `S-06` | Harness contracts, completion, projections, envelope store, Worker completion, and approval gate |
| `S-07` | approval card, handoff, and file/artifact card |
| `S-08` | event specification/validation, frontend envelope, Hub emit/broadcast/sequence |
| `S-09` | JSONL event path/load and Hub replay |
| `S-10` | SQLite database, TaskRun CAS snapshots, and separate Harness store |
| `S-11` | fake/DeepSeek adapters, Agent loop, provider streaming, and configuration |
| `S-12` | tool registry schema/execution, provider call normalization, text protocol, and tool ledger |
| `S-13` | knowledge graph/assets/API, memory manager, and knowledge UI |
| `S-14` | file/workspace/browser/web/terminal/delete operations and context menu |
| `S-15` | token usage, pricing, and usage display |
| `S-16` | reasoning/system/activity UI and socket transport |
| `S-17` | unit/E2E/desktop tests and Electron release configuration |
| `S-18` | package scripts/dependencies, native/bridge/capability boundaries, frontend state/store, and model-binding UI |

## Exact 73-path inventory

```text
backend/agent_identity.py
backend/agents/deepseek.py
backend/agents/fake.py
backend/browser_tools.py
backend/capabilities.py
backend/config.py
backend/contract.py
backend/delete_ops.py
backend/engine.py
backend/file_ops.py
backend/gate.py
backend/handoff.py
backend/hub.py
backend/identity_store.py
backend/knowe_core/agent_loop.py
backend/knowe_core/provider_client.py
backend/knowe_core/tool_protocol.py
backend/knowe_core/tool_registry.py
backend/knowe_harness/completion.py
backend/knowe_harness/contracts.py
backend/knowe_harness/projections.py
backend/knowe_harness/store.py
backend/knowe_storage/_sqlite.py
backend/knowe_storage/task_run_repository.py
backend/knowledge_api.py
backend/knowledge_assets.py
backend/knowledge_graph.py
backend/memory_manager.py
backend/persist.py
backend/roles.py
backend/run_backend.py
backend/runtime.py
backend/terminal_tools.py
backend/tests/test_e2e.py
backend/tests/test_unit.py
backend/token_pricing.py
backend/token_usage.py
backend/tool_ledger.py
backend/web_tools.py
backend/worker_completion.py
backend/worker_gateway_runtime.py
backend/workspace_layout.py
electron-builder.yml
electron.vite.config.ts
electron/main.ts
electron/preload.ts
electron/previewNavigation.test.ts
electron/trayCard.ts
electron/trayCardPreload.ts
electron/updater.ts
LICENSE
package.json
README.md
src/app/App.tsx
src/components/AddAgentsPopover.tsx
src/components/ApprovalCard.tsx
src/components/ChatStream.tsx
src/components/ContextMenu.tsx
src/components/ConvList.tsx
src/components/FileCard.tsx
src/components/KnowledgeView.tsx
src/components/ModelBindingModule.tsx
src/components/NewProjectModal.tsx
src/components/ReasoningPanel.tsx
src/components/RosterPanel.tsx
src/components/StreamBubble.tsx
src/components/SystemLine.tsx
src/components/TokenUsagePanel.tsx
src/contract/envelope.ts
src/store/state.ts
src/store/store.ts
src/transport/socket.ts
TECH.md
```

## No-copy and dependency result

| Measure | Count/result |
| --- | ---: |
| Copied source files | 0 |
| Copied source snippets | 0 |
| Copied assets | 0 |
| Copied tests | 0 |
| Runtime dependency | none |
| Build dependency | none |
| CI dependency | none |

The complete implementation diff changes only
`docs/migration/KNOWE-ADOPTION-MATRIX.md`. It introduces no code-bearing file,
asset, test, package manifest, lockfile, workspace declaration, workflow, or
source archive. The matrix contains no fenced source block and uses only short
identifiers plus paraphrased observations.
