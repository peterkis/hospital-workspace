import { describe, expect, it } from "vitest";
import { getWorkspaceFixture } from "../../fixtures/workspace-fixtures";
import { createWorkspaceRuntime, workspaceRuntimeReducer } from "./workspace-runtime";

describe("prototype workspace runtime", () => {
  it("selects a space's deterministic first thread", () => {
    const fixture = getWorkspaceFixture();
    const next = workspaceRuntimeReducer(createWorkspaceRuntime(fixture), { type: "select-space", fixture, spaceId: "demo-space-it-support" });
    expect(next.selectedThreadId).toBe("demo-thread-device");
  });

  it("does not duplicate a pending or settled command receipt activity", () => {
    const fixture = getWorkspaceFixture();
    const cardActivity = fixture.threads[0].activities.find((activity) => activity.kind === "card");
    const action = cardActivity?.kind === "card" ? cardActivity.card.actions[0] : undefined;
    if (!action) throw new Error("fixture action missing");
    const initial = createWorkspaceRuntime(fixture);
    const pending = workspaceRuntimeReducer(initial, { type: "submit-action", action, threadId: fixture.threads[0].id });
    expect(workspaceRuntimeReducer(pending, { type: "submit-action", action, threadId: fixture.threads[0].id })).toEqual(pending);
    const settled = workspaceRuntimeReducer(pending, { type: "settle-action", actionId: action.actionId });
    expect(settled.receiptActivities).toHaveLength(1);
    expect(workspaceRuntimeReducer(settled, { type: "submit-action", action, threadId: fixture.threads[0].id })).toEqual(settled);
    expect(workspaceRuntimeReducer(settled, { type: "settle-action", actionId: action.actionId }).receiptActivities).toHaveLength(1);
  });

  it("resets all local presentation state for a scenario change", () => {
    const fixture = getWorkspaceFixture();
    const changed = workspaceRuntimeReducer(createWorkspaceRuntime(fixture), { type: "reset", fixture: getWorkspaceFixture("empty") });
    expect(changed.receipts).toEqual({});
    expect(changed.selectedThreadId).toBeNull();
  });

  it("deduplicates the same command and idempotency key even under another action id", () => {
    const fixture = getWorkspaceFixture();
    const cardActivity = fixture.threads[0].activities.find((activity) => activity.kind === "card");
    if (cardActivity?.kind !== "card") throw new Error("fixture Card missing");
    const action = cardActivity.card.actions[0];
    const pending = workspaceRuntimeReducer(createWorkspaceRuntime(fixture), { type: "submit-action", action, threadId: fixture.threads[0].id });
    const duplicate = { ...action, actionId: "synthetic-action-work-duplicate" as const };
    expect(workspaceRuntimeReducer(pending, { type: "submit-action", action: duplicate, threadId: fixture.threads[0].id })).toEqual(pending);
  });

  it("records a rejected simulation as non-authoritative rejection, never acceptance", () => {
    const fixture = getWorkspaceFixture();
    const cardActivity = fixture.threads[0].activities.find((activity) => activity.kind === "card");
    if (cardActivity?.kind !== "card") throw new Error("fixture Card missing");
    const action = { ...cardActivity.card.actions[0], actionId: "synthetic-action-work-rejected" as const, commandId: "synthetic-command-work-rejected" as const, idempotencyKey: "synthetic-idempotency-work-rejected" as const, syntheticOutcome: "rejected" as const };
    const pending = workspaceRuntimeReducer(createWorkspaceRuntime(fixture), { type: "submit-action", action, threadId: fixture.threads[0].id });
    const rejected = workspaceRuntimeReducer(pending, { type: "settle-action", actionId: action.actionId });
    expect(rejected.receipts[action.actionId]?.status).toBe("rejected");
    expect(rejected.receiptActivities[0]?.title).toBe("合成拒绝回执");
    expect(rejected.receiptActivities[0]?.detail).not.toMatch(/接受|完成/);
  });
});
