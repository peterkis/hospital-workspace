import { describe, expect, it } from "vitest";
import { getWorkspaceFixture, WORKSPACE_SCENARIOS } from "./workspace-fixtures";

describe("workspace fixtures", () => {
  it("returns identical deterministic content for the same scenario", () => {
    expect(getWorkspaceFixture()).toEqual(getWorkspaceFixture("normal"));
    expect(JSON.stringify(getWorkspaceFixture("normal"))).toBe(JSON.stringify(getWorkspaceFixture("normal")));
  });

  it("contains the five required public-synthetic spaces", () => {
    expect(getWorkspaceFixture().spaces.map((space) => space.name)).toEqual(["My Work", "IT Support", "Fee Confirmation", "Agent Collaboration", "Knowledge Work"]);
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
      expect(fixture.threads.filter((thread) => thread.spaceId === space.id).length).toBeGreaterThan(0);
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
    expect(serialized).not.toMatch(/completed|已完成|已解决|command|idempotency|authoritative/i);
  });
});
