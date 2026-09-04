import { describe, expect, it } from "vitest";
import { createInitialSyntheticTicket } from "./ticket-fixtures";
import { SYNTHETIC_TICKET_STATUSES } from "./ticket-model";
import { projectSyntheticTicket, ticketTimelineActivities } from "./ticket-projection";
import { createSyntheticTicketCommand, syntheticTicketReducer, type SyntheticTicketRuntimeState } from "./ticket-runtime";

// Independent acceptance matrix from MVP-03, not inferred from the implementation table.
const route = [
  ["submit", "reporter", "submitted"], ["triage", "engineer", "triaged"],
  ["assign", "engineer", "assigned"], ["accept", "engineer", "accepted"],
  ["start_progress", "engineer", "in_progress"], ["resolve", "engineer", "resolved"],
  ["confirm_close", "reporter", "closed"], ["reopen", "reporter", "reopened"],
] as const;
function initialState(): SyntheticTicketRuntimeState { return { ticket: createInitialSyntheticTicket(), receiptLedger: [], pendingCommand: null, visibleReceiptCommandId: null }; }
function settle(state: SyntheticTicketRuntimeState) { return syntheticTicketReducer(state, { type: "settle", commandId: state.pendingCommand!.commandId }); }
function stateAt(step: number) {
  let state = initialState();
  for (const [commandType, actor] of route.slice(0, step)) state = settle(syntheticTicketReducer(state, { type: "queue", command: createSyntheticTicketCommand(state.ticket, commandType, actor) }));
  return state;
}

describe("synthetic Ticket deterministic reducer", () => {
  it("accepts exactly the ordered lifecycle with one event and one version per transition", () => {
    expect(SYNTHETIC_TICKET_STATUSES).toEqual(["draft", "submitted", "triaged", "assigned", "accepted", "in_progress", "resolved", "closed", "reopened"]);
    let state = initialState();
    for (const [commandType, actor, status] of route) {
      const previous = state;
      const before = JSON.stringify(previous);
      const command = createSyntheticTicketCommand(state.ticket, commandType, actor);
      const pending = syntheticTicketReducer(state, { type: "queue", command });
      expect(pending.ticket).toBe(previous.ticket);
      state = settle(pending);
      expect(JSON.stringify(previous)).toBe(before);
      expect(state.ticket.status).toBe(status);
      expect(state.ticket.version).toBe(previous.ticket.version + 1);
      expect(state.ticket.events).toHaveLength(previous.ticket.events.length + 1);
      expect(state.ticket.events.at(-1)).toMatchObject({ actor, priorStatus: previous.ticket.status, resultingStatus: status, resultingVersion: state.ticket.version, sourceId: command.commandId });
      expect(state.ticket.lastUpdated).toBe(state.ticket.events.at(-1)?.recordedAt);
      expect(state.ticket.lastUpdated > previous.ticket.lastUpdated).toBe(true);
      expect(state.receiptLedger.at(-1)?.state).toBe("accepted");
      expect(syntheticTicketReducer(state, { type: "settle", commandId: command.commandId })).toBe(state);
    }
    expect(state.ticket.version).toBe(9);
    expect(state.ticket.events).toHaveLength(9);
    expect(state).toEqual(stateAt(8));
  });

  for (let step = 0; step <= 8; step += 1) {
    for (const [commandType] of route) for (const actor of ["reporter", "engineer"] as const) {
      if (route[step]?.[0] === commandType && route[step]?.[1] === actor) continue;
      it(`rejects ${SYNTHETIC_TICKET_STATUSES[step]} / ${commandType} / ${actor} without skipping or mutating state`, () => {
        const before = stateAt(step);
        const snapshot = JSON.stringify(before.ticket);
        const command = createSyntheticTicketCommand(before.ticket, commandType, actor, before.ticket.version, 99);
        const after = settle(syntheticTicketReducer(before, { type: "queue", command }));
        expect(after.ticket).toBe(before.ticket);
        expect(JSON.stringify(after.ticket)).toBe(snapshot);
        expect(after.receiptLedger.at(-1)?.state).toBe("rejected");
      });
    }
  }

  it("keeps the entire ticket unchanged on a version conflict and can retry with a new envelope", () => {
    const before = stateAt(3);
    const conflict = settle(syntheticTicketReducer(before, { type: "queue", command: createSyntheticTicketCommand(before.ticket, "accept", "engineer", 1, 10) }));
    expect(conflict.ticket).toBe(before.ticket);
    expect(conflict.receiptLedger.at(-1)).toMatchObject({ state: "conflict", expectedVersion: 1, observedVersion: 4 });
    const refreshed = syntheticTicketReducer(conflict, { type: "clear-receipt" });
    const retried = settle(syntheticTicketReducer(refreshed, { type: "queue", command: createSyntheticTicketCommand(refreshed.ticket, "accept", "engineer", 4, 11) }));
    expect(retried.ticket.status).toBe("accepted");
    expect(retried.ticket.events).toHaveLength(5);
    expect(retried.receiptLedger.at(-2)?.state).toBe("conflict");
  });

  it("blocks command-id-only and key-only replays even after clearing the displayed receipt", () => {
    const accepted = stateAt(1);
    const original = accepted.receiptLedger[0];
    const cleared = syntheticTicketReducer(accepted, { type: "clear-receipt" });
    const validNext = createSyntheticTicketCommand(cleared.ticket, "triage", "engineer");
    for (const replay of [{ ...validNext, commandId: original.commandId }, { ...validNext, idempotencyKey: original.idempotencyKey }]) {
      expect(syntheticTicketReducer(cleared, { type: "queue", command: replay })).toBe(cleared);
    }
    expect(cleared.receiptLedger).toHaveLength(1);
    expect(cleared.visibleReceiptCommandId).toBeNull();
  });

  it("ignores concurrent queue attempts and copies the queued envelope before settlement", () => {
    const before = initialState();
    const command = createSyntheticTicketCommand(before.ticket, "submit", "reporter");
    const pending = syntheticTicketReducer(before, { type: "queue", command });
    const other = createSyntheticTicketCommand(before.ticket, "submit", "reporter", 1, 2);
    expect(syntheticTicketReducer(pending, { type: "queue", command: other })).toBe(pending);
    command.actor = "engineer";
    expect(settle(pending).ticket.status).toBe("submitted");
    expect(syntheticTicketReducer(pending, { type: "settle", commandId: other.commandId })).toBe(pending);
  });

  it("cancels once, keeps its rejection receipt, and ignores late settlement", () => {
    const before = initialState();
    const command = createSyntheticTicketCommand(before.ticket, "submit", "reporter");
    const pending = syntheticTicketReducer(before, { type: "queue", command });
    const cancelled = syntheticTicketReducer(pending, { type: "cancel-pending" });
    expect(cancelled.ticket).toBe(before.ticket);
    expect(cancelled.receiptLedger).toHaveLength(1);
    expect(cancelled.receiptLedger[0].state).toBe("rejected");
    expect(syntheticTicketReducer(cancelled, { type: "settle", commandId: command.commandId })).toBe(cancelled);
    expect(syntheticTicketReducer(cancelled, { type: "cancel-pending" })).toBe(cancelled);
  });

  it("projects participant responsibility and fixed SLA changes at every important boundary", () => {
    expect(stateAt(0).ticket.participants).toHaveLength(1);
    expect(stateAt(1).ticket.participants).toHaveLength(1);
    expect(stateAt(3).ticket.participants[1]).toMatchObject({ involvement: "assigned", joinedAt: "2026-09-04 09:05" });
    expect(stateAt(4).ticket.participants[1].involvement).toBe("active");
    expect(stateAt(5).ticket.participants[1].involvement).toBe("active");
    expect(stateAt(6).ticket.participants[0].involvement).toBe("awaiting-confirmation");
    expect(stateAt(7).ticket.participants.every((p) => p.involvement === "complete")).toBe(true);
    expect(projectSyntheticTicket(stateAt(7).ticket).nextPersona).toBeUndefined();
    expect(projectSyntheticTicket(stateAt(8).ticket).nextPersona).toBe("engineer");
    expect(stateAt(8).ticket.participants[1].involvement).toBe("next-response");
    expect(stateAt(1).ticket.sla.responseTargetLabel).toContain("15 分钟");
    expect(stateAt(4).ticket.sla.resolutionTargetLabel).toContain("4 小时");
    expect(stateAt(6).ticket.sla.presentationState).toContain("等待申报人确认");
    expect(stateAt(7).ticket.sla.presentationState).toBe("合成 SLA 已结束");
    expect(stateAt(8).ticket.sla.presentationState).toContain("重新进入");
  });

  it("keeps attachment, events and receipts in deterministic timestamp order with provenance", () => {
    const state = stateAt(8);
    const activities = ticketTimelineActivities(state.ticket, state.receiptLedger);
    expect(activities).toHaveLength(18);
    expect(activities[1].sourceId).toBe("demo-asset-ticket-screenshot-001");
    expect(activities.map((a) => a.recordedAt)).toEqual(activities.map((a) => a.recordedAt).sort());
    for (const activity of activities) {
      expect(activity.actor).toMatch(/Synthetic Reporter|Demo IT Engineer/);
      expect(activity.sourceId).toMatch(/^demo-/);
      expect(activity.recordedAt).toMatch(/^2026-09-04 09:\d{2}$/);
    }
    expect(activities.at(-1)?.detail).toContain("command.receipt.accepted");
  });
});
