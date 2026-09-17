# Hospital Workspace Web

UI-01 adds a page-oriented collaboration workbench: one light sidebar, board,
list and projection-summary views, title/description search, space and synthetic
participant filters. Counts use the displayed collection. Ctrl+K / Cmd+K focuses
search. The small-screen navigation button retains access to every space.

The existing Ticket card opens the original local Ticket experience. Returning
to the workbench retains the same aggregate and shows its current status;
leaving the thread cancels pending work through the existing cancellation key.
Board groups are display-only and never execute transitions or drag writes.
Other cards open a nonmodal read-only detail region; Escape or Close restores
the originating card. Existing discussions, provenance, registered Canvas
views and exceptional scenarios remain reachable.

Agent entry and new-item entry explain that they are not connected. Today's
schedule is a fixed example. The additional closed item is a read-only layout
sample. Favorites can be toggled from item details and are kept only in the
current page session; refresh clears them. No new draft submission or calendar
access is implemented. Refresh discards local demonstration state.

UI-01 does not start MVP04-I03 through I06: App does not consume the HTTP
client, Gateway still has health only, and bootstrap/command handlers, real
identity, authorization, persistence, Agent execution and multi-user sync are
not implemented. No hospital, Windows/Tauri or production acceptance is implied.

MVP-01 is a browser-only, public-synthetic presentation shell. It does not
connect to hospital systems, authenticate a person, persist data, deliver live
events, or execute domain actions.

From the repository root, start only this workspace:

```text
pnpm run dev:workspace
```

The development server includes a scenario selector. A deterministic scenario
can also be selected with the `scenario` query parameter:

```text
?scenario=normal
?scenario=empty
?scenario=loading
?scenario=error
?scenario=permission-denied
```

The query parameter changes presentation fixtures only. It is not an identity,
authorization, or business-state input.
