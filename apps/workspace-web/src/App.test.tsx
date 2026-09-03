import { fireEvent, render, screen, within } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { App } from "./App";
import { WORKSPACE_SCENARIOS, type WorkspaceScenario } from "./fixtures/workspace-fixtures";

function renderScenario(scenario: WorkspaceScenario = "normal") {
  return render(<App initialScenario={scenario} key={scenario} />);
}

describe("Visible Workspace Shell", () => {
  it("renders the principal workspace regions and all required spaces", () => {
    renderScenario();
    expect(screen.getByRole("banner")).toBeTruthy();
    expect(screen.getByRole("navigation", { name: "主要导航" })).toBeTruthy();
    expect(screen.getByRole("complementary", { name: "能力空间" })).toBeTruthy();
    expect(screen.getByRole("main")).toBeTruthy();
    expect(screen.getByRole("complementary", { name: "Context 与 Canvas" })).toBeTruthy();
    expect(screen.getAllByRole("heading", { level: 1 })).toHaveLength(1);
    const spaces = within(screen.getByRole("complementary", { name: "能力空间" }));
    for (const space of ["My Work", "IT Support", "Fee Confirmation", "Agent Collaboration", "Knowledge Work"]) {
      expect(spaces.getByRole("button", { name: new RegExp(space) })).toBeTruthy();
    }
  });

  it("changes the visible thread and its context when a space and thread are selected", () => {
    renderScenario();
    const spaces = within(screen.getByRole("complementary", { name: "能力空间" }));
    fireEvent.click(spaces.getByRole("button", { name: /IT Support/ }));
    expect(screen.getByRole("heading", { name: "共享工作台准备" })).toBeTruthy();
    expect(screen.getByText("记录一项合成的工作台准备事项")).toBeTruthy();
    fireEvent.click(spaces.getByRole("button", { name: /My Work/ }));
    fireEvent.click(screen.getByRole("button", { name: /交接前的背景核对/ }));
    expect(screen.getByRole("heading", { name: "交接前的背景核对" })).toBeTruthy();
    expect(screen.getByText("等待人工评审")).toBeTruthy();
  });

  it("offers all deterministic presentation states", () => {
    for (const scenario of WORKSPACE_SCENARIOS.filter((entry) => entry !== "normal")) {
      const view = renderScenario(scenario);
      expect(screen.getByRole("region", { name: /状态/ })).toBeTruthy();
      view.unmount();
    }
  });

  it("opens, closes, and keyboard-closes the Context and Canvas panel", () => {
    renderScenario();
    const toggle = screen.getByRole("button", { name: "关闭 Context 与 Canvas 面板" });
    fireEvent.click(toggle);
    expect(screen.queryByRole("complementary", { name: "Context 与 Canvas" })).toBeNull();
    const reopen = screen.getByRole("button", { name: "打开 Context 与 Canvas 面板" });
    fireEvent.click(reopen);
    expect(screen.getByRole("complementary", { name: "Context 与 Canvas" })).toBeTruthy();
    fireEvent.keyDown(window, { key: "Escape" });
    expect(screen.queryByRole("complementary", { name: "Context 与 Canvas" })).toBeNull();
  });

  it("keeps controls presentation-only and supports visible keyboard focus", () => {
    renderScenario();
    const search = screen.getByRole("searchbox", { name: "全局搜索（仅演示）" });
    search.focus();
    expect(document.activeElement).toBe(search);
    const unavailable = screen.getByRole("button", { name: "演示中不可操作" });
    expect(unavailable.hasAttribute("disabled")).toBe(true);
    expect(screen.getByRole("button", { name: "合成用户菜单（MVP-01 中不可用）" }).hasAttribute("disabled")).toBe(true);
    expect(screen.getByText(/没有业务命令、完成动作、持久化或医院系统连接/)).toBeTruthy();
    expect(screen.queryByText(/操作已完成|命令已执行|已保存/)).toBeNull();
  });

  it("selects a primary responsibility view without claiming a business transition", () => {
    renderScenario();
    fireEvent.click(screen.getByRole("button", { name: "Messages" }));
    expect(screen.getByRole("button", { name: "Messages" }).getAttribute("aria-current")).toBe("page");
    expect(screen.getByRole("heading", { name: "Messages" })).toBeTruthy();
    expect(screen.queryByText(/操作已完成|命令已执行|已保存/)).toBeNull();
  });
});
