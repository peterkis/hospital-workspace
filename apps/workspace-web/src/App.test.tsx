import { act, fireEvent, render, screen, within } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import { App } from "./App";
import { SYNTHETIC_RECEIPT_DELAY_MS } from "./features/cards/card-runtime";
import { WORKSPACE_SCENARIOS, type WorkspaceScenario } from "./fixtures/workspace-fixtures";

function renderScenario(scenario: WorkspaceScenario = "normal") { return render(<App initialScenario={scenario} key={scenario} />); }
afterEach(() => vi.useRealTimers());

describe("MVP-02 workspace composition", () => {
  it("preserves principal shell regions and all five spaces", () => {
    renderScenario();
    expect(screen.getByRole("banner")).toBeTruthy();
    expect(screen.getByRole("navigation", { name: "主要导航" })).toBeTruthy();
    expect(screen.getByRole("main")).toBeTruthy();
    expect(screen.getByRole("complementary", { name: "Context 与 Canvas" })).toBeTruthy();
    expect(screen.getAllByRole("heading", { level: 1 })).toHaveLength(1);
    const spaces = within(screen.getByRole("complementary", { name: "能力空间" }));
    for (const space of ["My Work", "IT Support", "Fee Confirmation", "Agent Collaboration", "Knowledge Work"]) expect(spaces.getByRole("button", { name: new RegExp(space) })).toBeTruthy();
  });

  it("selects a space's first thread and a selected thread changes the visible timeline", () => {
    renderScenario();
    const spaces = within(screen.getByRole("complementary", { name: "能力空间" }));
    fireEvent.click(spaces.getByRole("button", { name: /IT Support/ }));
    expect(screen.getByRole("heading", { name: "共享工作台准备" })).toBeTruthy();
    fireEvent.click(spaces.getByRole("button", { name: /My Work/ }));
    fireEvent.click(screen.getByRole("button", { name: /交接前的背景核对/ }));
    expect(screen.getAllByText("需要确认协作优先级")).toHaveLength(2);
    expect(screen.getByText(/人类判断仍然是权威/)).toBeTruthy();
  });

  it("shows accepted local receipt without claiming business completion", () => {
    vi.useFakeTimers();
    renderScenario();
    const action = screen.getByRole("button", { name: /接受演示分派/ });
    action.focus();
    fireEvent.click(action);
    expect(screen.getByRole("button", { name: /等待合成回执/ }).getAttribute("aria-disabled")).toBe("true");
    expect(document.activeElement).toBe(action);
    expect(screen.getByText(/正在等待合成回执/).getAttribute("aria-busy")).toBe("true");
    act(() => vi.advanceTimersByTime(SYNTHETIC_RECEIPT_DELAY_MS));
    expect(screen.getByText(/accepted synthetic receipt/)).toBeTruthy();
    expect(screen.getByText(/领域事项尚未完成/)).toBeTruthy();
    expect(screen.getAllByText("合成接受回执")).toHaveLength(1);
    expect(document.activeElement).toBe(action);
  });

  it("shows deterministic conflict and deterministic local refresh", () => {
    vi.useFakeTimers();
    renderScenario();
    fireEvent.click(screen.getByRole("button", { name: /交接前的背景核对/ }));
    fireEvent.click(screen.getByRole("button", { name: /提交演示选择/ }));
    act(() => vi.advanceTimersByTime(SYNTHETIC_RECEIPT_DELAY_MS));
    expect(screen.getByText(/合成版本冲突：期望版本 4，当前演示版本 5/)).toBeTruthy();
    fireEvent.click(screen.getByRole("button", { name: "刷新演示上下文" }));
    expect(screen.getByRole("button", { name: /提交演示选择/ })).toBeTruthy();
  });

  it("opens registered Canvas details, focuses its heading, and Escape restores the contextual view", () => {
    renderScenario();
    const detail = screen.getByRole("button", { name: "查看已注册详情" });
    fireEvent.click(detail);
    const heading = screen.getByRole("heading", { name: "Canvas 详情" });
    expect(document.activeElement).toBe(heading);
    expect(screen.getByText(/来源引用/)).toBeTruthy();
    fireEvent.keyDown(window, { key: "Escape" });
    expect(screen.getByRole("heading", { name: "当前上下文" })).toBeTruthy();
    expect(document.activeElement).toBe(detail);
  });

  it("restores focus after a Context trigger is unmounted and remounted", () => {
    renderScenario();
    const contextTrigger = screen.getByRole("button", { name: "查看工作项详情" });
    contextTrigger.focus();
    fireEvent.click(contextTrigger);
    expect(document.activeElement).toBe(screen.getByRole("heading", { name: "Canvas 详情" }));
    fireEvent.keyDown(window, { key: "Escape" });
    const restoredTrigger = screen.getByRole("button", { name: "查看工作项详情" });
    expect(restoredTrigger).not.toBe(contextTrigger);
    expect(document.activeElement).toBe(restoredTrigger);
    fireEvent.click(restoredTrigger);
    fireEvent.click(screen.getByRole("button", { name: "关闭 Canvas 详情" }));
    const closeButtonRestoredTrigger = screen.getByRole("button", { name: "查看工作项详情" });
    expect(closeButtonRestoredTrigger).not.toBe(restoredTrigger);
    expect(document.activeElement).toBe(closeButtonRestoredTrigger);
  });

  it("closes Canvas safely when the invoking focus target is no longer available", () => {
    renderScenario();
    const contextTrigger = screen.getByRole("button", { name: "查看工作项详情" });
    fireEvent.click(contextTrigger);
    contextTrigger.textContent = "已移除的合成触发器";
    fireEvent.keyDown(window, { key: "Escape" });
    expect(screen.getByRole("heading", { name: "当前上下文" })).toBeTruthy();
    expect(document.activeElement).not.toBe(contextTrigger);
  });

  it("keeps all exceptional presentation states", () => {
    for (const scenario of WORKSPACE_SCENARIOS.filter((entry) => entry !== "normal")) {
      const view = renderScenario(scenario);
      expect(screen.getByRole("region", { name: /状态/ })).toBeTruthy();
      view.unmount();
    }
  });

  it("ignores a synthetic receipt after the presentation scenario changes or unmounts", () => {
    vi.useFakeTimers();
    const view = renderScenario();
    fireEvent.click(screen.getByRole("button", { name: /接受演示分派/ }));
    fireEvent.change(screen.getByRole("combobox", { name: "切换演示场景" }), { target: { value: "empty" } });
    act(() => vi.advanceTimersByTime(SYNTHETIC_RECEIPT_DELAY_MS));
    expect(screen.getByRole("region", { name: "空状态" })).toBeTruthy();
    view.unmount();
    act(() => vi.advanceTimersByTime(SYNTHETIC_RECEIPT_DELAY_MS));
    expect(document.body.textContent).not.toContain("accepted synthetic receipt");
  });

  it("renders all timeline variants with visible public-synthetic provenance", () => {
    renderScenario();
    const spaces = within(screen.getByRole("complementary", { name: "能力空间" }));
    expect(screen.getByText("协作消息")).toBeTruthy();
    expect(screen.getAllByText("状态投影").length).toBeGreaterThan(0);
    expect(screen.getByText("结构化卡片")).toBeTruthy();
    fireEvent.click(screen.getByRole("button", { name: /交接前的背景核对/ }));
    expect(screen.getByText("人工判断")).toBeTruthy();
    expect(screen.getByText("冲突或错误")).toBeTruthy();
    fireEvent.click(spaces.getByRole("button", { name: /Agent Collaboration/ }));
    expect(screen.getByText("Agent 提案或更新")).toBeTruthy();
    expect(screen.getAllByText(/来源：/).length).toBeGreaterThan(0);
  });

  it("opens registered knowledge and unregistered Canvas routes through real buttons", () => {
    renderScenario();
    const spaces = within(screen.getByRole("complementary", { name: "能力空间" }));
    fireEvent.click(spaces.getByRole("button", { name: /Knowledge Work/ }));
    fireEvent.click(screen.getByRole("button", { name: "查看知识引用" }));
    expect(screen.getByText(/未代表临床或生产知识/)).toBeTruthy();
    fireEvent.click(screen.getByRole("button", { name: "关闭 Canvas 详情" }));
    fireEvent.click(screen.getByRole("button", { name: "查看未注册 Canvas 回退" }));
    expect(screen.getByRole("region", { name: "Unsupported synthetic Canvas" })).toBeTruthy();
  });
});
