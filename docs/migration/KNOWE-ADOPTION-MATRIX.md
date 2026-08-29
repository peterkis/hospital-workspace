# Knowe Adoption Matrix

Reference: `HirezmingD/Knowe-agent-groupchat@1e584f84734e9db55515ef4391fcb9e9c40399cd`.

Knowe is an interaction and mechanism reference. The new repository does not depend on Knowe at runtime.

| Knowe idea | Hospital Workspace adoption | Target |
| --- | --- | --- |
| Group-chat Agent team | A unified Thread timeline for people, systems and Agents | Workspace UI |
| Project group | Capability Space / Knowledge Project / Department matter | Workspace + WorkItem |
| Coordinator | Bounded server-side planner and dispatcher | Agent Gateway |
| Worker | Specialized Agent profile with explicit tool allowlist | Agent Gateway |
| Harness | Deterministic Task/Decision/Handoff state machine | Collaboration |
| Approval card | Versioned Card + Command + user Decision | Card Protocol |
| Handoff | Durable actor/task transfer with evidence | Collaboration |
| Independent Agent identity | AgentProfile/Run/Task/Attempt | Agent contracts |
| Knowledge active/retired | Governed node version and scope lifecycle | Knowledge Service |
| Project/global scope | project/department/campus/hospital scope | Knowledge/Authz |
| Event replay | Durable Event Store + replayable projections | Collaboration |
| Outbox | Domain transaction + Outbox + idempotent Relay | Domain services |
| Memory/knowledge sharing | Authorized knowledge project and provenance | Knowledge Service |

## Explicit non-adoption

| Knowe implementation | Reason |
| --- | --- |
| Electron shell | Tauri/WebView2 already has a validated hospital security boundary |
| Python backend on every client | Clinical workstations should not run a privileged Agent backend |
| Local WebSocket as platform bus | Hospital platform uses server-side durable collaboration and SSE first |
| JSONL/Markdown as business truth | Business truth belongs in PostgreSQL domain services |
| Client model API keys | Keys remain in Agent Gateway secret storage |
| Terminal/Shell tool | Prohibited production escape capability |
| Arbitrary filesystem/browser automation | Not required for hospital workflow and too risky |
| Chat records never delete | Retention must follow hospital policy and sensitivity |
| Model result as completion | Harness validators and domain events decide completion |

MIT attribution is required only if source code is actually copied. Conceptual adoption alone does not introduce a runtime dependency.
