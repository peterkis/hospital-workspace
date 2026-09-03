import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import type { PrototypeActivity } from "./activity-model";
import { ActivityTimeline } from "./ActivityTimeline";

describe("Activity Timeline safe rendering", () => {
  it("shows the synthetic actor for every activity entry", () => {
    const actors = ["Synthetic User", "Demo Coordinator", "Review Partner", "Agent", "Workspace"];
    const activities: PrototypeActivity[] = actors.map((actor, index) => ({
      id: `demo-activity-actor-${index}`,
      kind: index === 3 ? "agent" : index === 0 ? "user" : "system",
      actor,
      title: `合成活动 ${index + 1}`,
      detail: "用于验证活动发起者展示。",
      recordedAt: `2026-09-03 10:0${index}`,
      sourceKind: "fixture",
      sourceId: `demo-activity-actor-${index}`,
    }));

    render(<ActivityTimeline activities={activities} onOpenCanvas={() => {}} onRefreshConflict={() => {}} onSubmit={() => {}} receipts={{}} />);

    for (const actor of actors) expect(screen.getByText(actor)).toBeTruthy();
    expect(screen.getAllByText("发起者")).toHaveLength(actors.length);
  });

  it("renders an unknown fixture activity as a read-only fallback with provenance", () => {
    const activity: PrototypeActivity = {
      id: "demo-activity-unknown-kind",
      kind: "unknown",
      unsupportedKind: "future-activity",
      actor: "Workspace",
      title: "未来活动记录",
      detail: "该活动类型尚未注册，因此仅按文本展示。",
      recordedAt: "2026-09-03 09:40",
      sourceKind: "fixture",
      sourceId: "demo-activity-unknown-kind",
    };

    render(<ActivityTimeline activities={[activity]} onOpenCanvas={() => {}} onRefreshConflict={() => {}} onSubmit={() => {}} receipts={{}} />);

    expect(screen.getByText("未支持的合成活动")).toBeTruthy();
    expect(screen.getByText("未来活动记录")).toBeTruthy();
    expect(screen.queryByRole("button")).toBeNull();
    expect(screen.getByText(/来源：fixture · demo-activity-unknown-kind/)).toBeTruthy();
  });
});
