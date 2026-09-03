# Product-First MVP execution overlay

## Purpose

This overlay creates an early product-feedback loop after the accepted F0
foundation. It sequences a public-synthetic, browser-first MVP-0 from visible
Workspace experience through a two-person Ticket flow and a human Product
Direction Gate.

## Authority and relationship

The canonical `HW-01` through `HW-12` roadmap remains the long-term production
hardening map. The overlay temporarily controls near-term execution order only
while its status is `active`, and only through `MVP-07`. It does not rewrite
phases, tasks, dependencies, gates, architecture, or migration sources. A
prototype subset never completes a canonical task.

## Product-First principles

- Show a coherent Workspace early: navigation, spaces, threads, timeline and
  Context/Canvas have a visible outcome in each slice.
- Use deterministic synthetic data and browser feedback before production
  infrastructure.
- Keep authority explicit: UI state is not business truth; typed commands,
  receipts, versions and domain boundaries remain the target model.
- Preserve the three-column interaction model and keyboard accessibility.
- Make limitations visible and keep every slice bounded by one owning boundary.

## Risk and Evidence

MVP work is public-synthetic and cannot claim pilot or production readiness.
High/critical identity, authorization, database, Outbox, Tauri and sensitive
data boundaries stay on canonical routing and required Sol acceptance. Low and
medium overlay work uses the lean route: one implementation commit, GitHub
checks and one external read-only Terra review. The reviewer receipt remains
external to the reviewed tree; no recursive committed Evidence or per-file
manifest is required for this planning overlay.

## Adoption into the canonical roadmap

Each slice declares `sourceTaskMappings` in
`MVP-EXECUTION-OVERLAY.yaml`. After the Product Direction Gate, the Parent and
human owner select an allowed outcome. Adopted prototype work is reimplemented
or hardened under its mapped canonical task, with canonical tests, risk,
evidence and acceptance; unsuitable work is explicitly deleted. No mapping is
permission to skip a canonical dependency or acceptance route.

## Retirement

The overlay retires when `MVP-07` records one allowed outcome and the Parent and
human owner decide the next route. Only the human owner may retire or replace
it. A retirement decision does not mark any canonical task complete.

The deterministic slice and dependency record is
[`MVP-EXECUTION-OVERLAY.yaml`](MVP-EXECUTION-OVERLAY.yaml); MVP-0 success and
non-goals are defined in [`MVP-ACCEPTANCE.md`](MVP-ACCEPTANCE.md).
