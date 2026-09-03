import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { StructuredCard } from "./StructuredCard";

const noOp = () => {};
describe("fixed Card registry", () => {
  it("only registers the three compiled MVP-02 card renderers", async () => {
    const { CARD_REGISTRY } = await import("./card-registry");
    expect(Object.keys(CARD_REGISTRY)).toEqual(["work-item-summary@1", "decision-request@1", "agent-run-summary@1"]);
  });
  it("renders unknown cards as a non-actionable safe fallback", () => {
    render(<StructuredCard card={{ cardId: "demo-card-test", cardType: "future", cardVersion: 9, title: "Future", presentationStatus: "unsupported", sensitivity: "public-synthetic", fields: {}, actions: [] }} onOpenCanvas={noOp} onRefreshConflict={noOp} onSubmit={noOp} receiptStatus={() => "ready"} />);
    expect(screen.getByRole("region", { name: "Unsupported synthetic card" })).toBeTruthy();
    expect(screen.queryByRole("button")).toBeNull();
  });
  it("renders an unsupported version of a known Card type as the same safe fallback", () => {
    render(<StructuredCard card={{ cardId: "demo-card-version", cardType: "work-item-summary", cardVersion: 99, title: "Old", presentationStatus: "unsupported", sensitivity: "public-synthetic", fields: {}, actions: [] }} onOpenCanvas={noOp} onRefreshConflict={noOp} onSubmit={noOp} receiptStatus={() => "ready"} />);
    expect(screen.getByText(/版本 99 尚未注册/)).toBeTruthy();
    expect(screen.queryByRole("button")).toBeNull();
  });
});
