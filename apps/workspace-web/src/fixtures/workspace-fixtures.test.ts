import { describe, expect, it } from "vitest";
import { getWorkspaceFixture, WORKSPACE_SCENARIOS } from "./workspace-fixtures";

describe("workspace fixtures", () => {
  it("returns identical deterministic content for the same scenario", () => {
    expect(getWorkspaceFixture()).toEqual(getWorkspaceFixture("normal"));
    expect(JSON.stringify(getWorkspaceFixture("normal"))).toBe(JSON.stringify(getWorkspaceFixture("normal")));
  });

  it("contains the five required public-synthetic spaces", () => {
    expect(getWorkspaceFixture().spaces.map((space) => space.label)).toEqual(["My Work", "IT Support", "Fee Confirmation", "Agent Collaboration", "Knowledge Work"]);
  });

  it("uses stable safe fixture identifiers and no contact or private data", () => {
    const fixture = getWorkspaceFixture();
    const serialized = JSON.stringify(fixture);
    expect(fixture.spaces.every((space) => space.id.startsWith("demo-space-"))).toBe(true);
    expect(fixture.threads.every((thread) => thread.id.startsWith("demo-thread-"))).toBe(true);
    expect(serialized).not.toMatch(/@|https?:\/\/|10\.\d+\.\d+\.\d+|password|token|patient|diagnos/i);
    expect(serialized).toContain("Example Hospital");
    expect(serialized).toContain("Synthetic User");
  });

  it("keeps threads scoped to their selected spaces", () => {
    const fixture = getWorkspaceFixture();
    for (const space of fixture.spaces) {
      expect(fixture.threads.filter((thread) => thread.parentSpaceId === space.id).length).toBeGreaterThan(0);
    }
  });

  it.each(WORKSPACE_SCENARIOS)("supports the %s presentation scenario", (scenario) => {
    const fixture = getWorkspaceFixture(scenario);
    expect(fixture.scenario).toBe(scenario);
    expect(fixture.stateMessage.length).toBeGreaterThan(0);
    if (scenario !== "normal") expect(fixture.threads).toHaveLength(0);
  });

  it("contains presentation-only activities without completion claims", () => {
    const serialized = JSON.stringify(getWorkspaceFixture());
    expect(serialized).not.toMatch(/completed|已完成|已解决|data saved|Ticket updated|Decision executed|Agent task completed/i);
  });

  it("contains deterministic Card and Canvas examples for each MVP-02 thread", () => {
    const fixture = getWorkspaceFixture();
    const cards = fixture.threads.flatMap((thread) => thread.activities.flatMap((activity) => activity.kind === "card" ? [activity.card] : []));
    expect(cards.map((card) => card.cardType)).toEqual(["work-item-summary", "decision-request", "agent-run-summary", "future-demo-card"]);
    expect(cards[0]?.actions[0]?.syntheticOutcome).toBe("accepted");
    expect(cards[1]?.actions[0]?.syntheticOutcome).toBe("conflict");
    expect(cards.map((card) => card.sensitivity)).toEqual(["public-synthetic", "public-synthetic", "public-synthetic", "public-synthetic"]);
    expect(cards.map((card) => card.canvasRoute)).toEqual(["work-item-detail", "decision-context", "agent-run-detail", undefined]);
  });

  it("gives every activity stable synthetic provenance", () => {
    const activities = getWorkspaceFixture().threads.flatMap((thread) => thread.activities);
    expect(activities.length).toBeGreaterThan(0);
    expect(activities.every((activity) => activity.sourceKind && activity.sourceId?.startsWith("demo-activity-"))).toBe(true);
    expect(JSON.stringify(activities)).not.toMatch(/https?:\/\/|javascript:|innerHTML|callback|component|executable/i);
  });

  it("keeps unknown Card data non-actionable", () => {
    const unknownActivity = getWorkspaceFixture().threads.flatMap((thread) => thread.activities).find((activity) => activity.kind === "card" && activity.card.cardType === "future-demo-card");
    const unknown = unknownActivity?.kind === "card" ? unknownActivity.card : undefined;
    expect(unknown?.cardVersion).toBe(9);
    expect(unknown?.actions).toHaveLength(0);
  });

  it("keeps exceptional scenarios deterministic and empty of thread data", () => {
    for (const scenario of ["empty", "loading", "error", "permission-denied"] as const) {
      expect(getWorkspaceFixture(scenario)).toEqual(getWorkspaceFixture(scenario));
      expect(getWorkspaceFixture(scenario).spaces).toHaveLength(5);
      expect(getWorkspaceFixture(scenario).threads).toHaveLength(0);
    }
  });
});
