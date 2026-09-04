import { describe, expect, it } from "vitest";
import { getWorkspaceFixture } from "../../fixtures/workspace-fixtures";
import {
  SYNTHETIC_ATTACHMENT,
  SYNTHETIC_TICKET_ID,
  SYNTHETIC_TICKET_THREAD_ID,
  composeWorkspaceFixtureWithSyntheticTickets,
  createInitialSyntheticTicket,
  isSyntheticTicketThread,
} from "./ticket-fixtures";

function deepFreeze<T>(value: T): T {
  if (value && typeof value === "object" && !Object.isFrozen(value)) {
    Object.freeze(value);
    for (const child of Object.values(value as object)) deepFreeze(child);
  }
  return value;
}

describe("synthetic Ticket fixtures", () => {
  it("creates the deterministic draft with one initial event", () => {
    const ticket = createInitialSyntheticTicket();
    expect(ticket.id).toBe(SYNTHETIC_TICKET_ID);
    expect(ticket.status).toBe("draft");
    expect(ticket.version).toBe(1);
    expect(ticket.events).toHaveLength(1);
    expect(ticket.attachments).toEqual([SYNTHETIC_ATTACHMENT]);
  });

  it("composes a ticket first while preserving the base fixture", () => {
    const base = getWorkspaceFixture("normal");
    const before = JSON.stringify(base);
    const composed = composeWorkspaceFixtureWithSyntheticTickets(base);
    expect(JSON.stringify(base)).toBe(before);
    expect(composed.threads[0]?.id).toBe(SYNTHETIC_TICKET_THREAD_ID);
    expect(composed.threads.filter((thread) => thread.parentSpaceId === "demo-space-it-support")).toHaveLength(2);
    expect(composed.spaces.find((space) => space.id === "demo-space-it-support")?.presentationCount).toBe("3 个事项");
  });

  it("does not augment exceptional scenarios", () => {
    for (const scenario of ["empty", "loading", "error", "permission-denied"] as const) {
      const base = getWorkspaceFixture(scenario);
      const composed = composeWorkspaceFixtureWithSyntheticTickets(base);
      expect(composed).toBe(base);
      expect(composed.threads).toHaveLength(0);
    }
  });

  it("does not mutate a deeply frozen base fixture", () => {
    const base = deepFreeze(getWorkspaceFixture("normal"));
    expect(() => composeWorkspaceFixtureWithSyntheticTickets(base)).not.toThrow();
    expect(base.threads[2]?.id).toBe("demo-thread-device");
  });

  it("recognizes only the primary synthetic Ticket thread", () => {
    const thread = composeWorkspaceFixtureWithSyntheticTickets(getWorkspaceFixture()).threads[0];
    expect(thread && isSyntheticTicketThread(thread)).toBe(true);
    expect(isSyntheticTicketThread({ ...thread!, id: "demo-thread-device" })).toBe(false);
  });

  it("keeps the attachment reference public and path-free", () => {
    expect(SYNTHETIC_ATTACHMENT.assetRef).toBe("demo-asset-ticket-screenshot-001");
    expect(SYNTHETIC_ATTACHMENT.sensitivity).toBe("public-synthetic");
    expect(JSON.stringify(SYNTHETIC_ATTACHMENT)).not.toMatch(/(file:|https?:|blob:|data:|token|bytes|path)/i);
  });
});
