# UX and Interaction Model

## Primary navigation

The first level is user responsibility, not application names:

- Home
- My Todos
- My Messages
- Active Work
- Decisions
- Agent Runs
- Knowledge Reviews

Capability spaces are available, but the default home is cross-capability.

## Three-pane workspace

```text
Left: Spaces / queues / saved views
Center: Thread activity timeline
Right: Context / Canvas / details
```

A compact header contains identity, current organization/campus, search, connection and privacy state.

## Interaction layers

### Chat

For natural language, explanation, coordination and Agent goals.

### Card

For short, deterministic, auditable actions.

### Canvas

For tables, forms, attachments, comparisons, reports, knowledge and complex workflows.

## Status language

The UI distinguishes:

- submitted;
- processing;
- waiting for user;
- waiting for external system;
- blocked;
- conflict;
- completed;
- failed;
- cancelled.

It never uses a generic success toast when the domain result is unknown.

## Desktop surfaces

- Tray: global availability and unread.
- Toast: short privacy-filtered event.
- Island: priority/progress and one safe action.
- Deep link: opens the exact Thread/Work Item after reauthorization.

## Accessibility

- keyboard-first navigation;
- visible focus;
- screen-reader labels;
- reduced motion;
- high contrast;
- CJK font and density testing;
- no color-only status;
- large list virtualization without focus loss.
