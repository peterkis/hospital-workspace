# Hospital Workspace Web

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
