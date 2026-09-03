import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { getWorkspaceFixture } from "../../fixtures/workspace-fixtures";
import { CanvasPanel } from "./CanvasPanel";
import { registeredCanvasView } from "./canvas-registry";

describe("fixed Canvas registry", () => {
  it("keeps an unregistered internal identifier in a safe fallback", () => {
    render(<CanvasPanel onClose={() => {}} onOpenRoute={() => {}} route="future-demo-route" thread={getWorkspaceFixture().threads[0]} />);
    expect(screen.getByRole("region", { name: "Unsupported synthetic Canvas" })).toBeTruthy();
  });
  it("resolves only the four fixed local Canvas identifiers", () => {
    expect(["work-item-detail", "decision-context", "agent-run-detail", "knowledge-reference"].every((route) => registeredCanvasView(route))).toBe(true);
    expect(registeredCanvasView("future-demo-route")).toBeNull();
  });
  it.each([
    ["decision-context", "人类判断保持权威"],
    ["agent-run-detail", "Agent 输出不是领域完成"],
    ["knowledge-reference", "未代表临床或生产知识"],
  ])("renders the fixed %s view", (route, expected) => {
    render(<CanvasPanel onClose={() => {}} onOpenRoute={() => {}} route={route} thread={getWorkspaceFixture().threads[0]} />);
    expect(screen.getByText(expected, { exact: false })).toBeTruthy();
  });
});
