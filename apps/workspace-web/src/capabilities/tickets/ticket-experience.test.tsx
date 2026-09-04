import { StrictMode } from "react";
import { act, fireEvent, render, screen, within } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { App } from "../../App";
import { SYNTHETIC_TICKET_RECEIPT_DELAY_MS } from "./ticket-runtime";

const steps = [
  ["提交本地合成报修", "Synthetic Reporter", "已提交（演示）"],
  ["分诊本地合成报修", "Demo IT Engineer", "已分诊（演示）"],
  ["接入演示工程师", "Demo IT Engineer", "已分派（演示）"],
  ["接受演示分派", "Demo IT Engineer", "已接受（演示）"],
  ["开始本地合成处理", "Demo IT Engineer", "处理中（演示）"],
  ["标记演示解决", "Demo IT Engineer", "等待确认（演示）"],
  ["确认本地合成关闭", "Synthetic Reporter", "已关闭（演示）"],
  ["重新打开本地合成展示", "Synthetic Reporter", "已重新打开（演示）"],
] as const;
function ticket() { return within(screen.getByRole("region", { name: "Synthetic Ticket experience" })); }
function openTicket() {
  fireEvent.click(screen.getByRole("button", { name: /IT Support/ }));
  return ticket();
}
function settle() { act(() => vi.advanceTimersByTime(SYNTHETIC_TICKET_RECEIPT_DELAY_MS)); }
function runSteps(count = 8) {
  for (const [label, persona] of steps.slice(0, count)) {
    fireEvent.click(ticket().getByRole("button", { name: new RegExp(`^${persona}`) }));
    fireEvent.click(ticket().getByRole("button", { name: label }));
    settle();
  }
}
beforeEach(() => vi.useFakeTimers());
afterEach(() => vi.useRealTimers());

describe("rendered Ticket lifecycle and recovery", () => {
  it("shows all nine steps and every transition with shared persona state, versions and chronological Timeline", () => {
    render(<StrictMode><App initialScenario="normal" /></StrictMode>);
    const scope = openTicket();
    expect(scope.getByRole("button", { name: /^Synthetic Reporter/ }).getAttribute("aria-pressed")).toBe("true");
    expect(within(scope.getByRole("list", { name: "Ticket 生命周期进度" })).getAllByRole("listitem")).toHaveLength(9);
    for (const [index, [label, persona, status]] of steps.entries()) {
      fireEvent.click(scope.getByRole("button", { name: new RegExp(`^${persona}`) }));
      const action = scope.getByRole("button", { name: label });
      action.focus();
      fireEvent.click(action);
      fireEvent.click(action);
      expect(action.getAttribute("aria-disabled")).toBe("true");
      expect(scope.getByRole("status").textContent).toContain(`v${index + 1}`);
      settle();
      expect(scope.getByRole("status").textContent).toBe(`${status} · v${index + 2}`);
      expect(scope.getByRole("listitem", { name: `${status}：当前步骤` })).toBeTruthy();
      expect(scope.getByText("这不表示业务完成、数据保存或任何外部状态变化。")).toBeTruthy();
      const rows = within(scope.getByRole("region", { name: "Ticket Timeline" })).getAllByRole("article");
      expect(rows).toHaveLength(4 + index * 2);
    }
    const timeline = scope.getByRole("region", { name: "Ticket Timeline" });
    const times = Array.from(timeline.querySelectorAll("time"), (element) => element.textContent);
    expect(times).toEqual([...times].sort());
    for (const row of within(timeline).getAllByRole("article")) {
      expect(row.textContent).toMatch(/Synthetic Reporter|Demo IT Engineer/);
      expect(row.textContent).toContain("来源：");
      expect(row.querySelector("time")?.textContent).toMatch(/^2026-09-04/);
    }
    expect(scope.getByRole("listitem", { name: "已关闭（演示）：已完成" })).toBeTruthy();
    expect(scope.getByRole("status").textContent).not.toContain("已关闭");
    expect(scope.getByRole("region", { name: "Ticket 支持摘要" }).textContent).toContain("Demo IT Engineer");
    expect(scope.queryByRole("button", { name: "模拟版本冲突" })).toBeNull();
  });

  it("explains the unavailable role and keeps keyboard focus usable during persona/pending changes", () => {
    render(<App initialScenario="normal" />);
    openTicket();
    const engineer = ticket().getByRole("button", { name: /^Demo IT Engineer/ });
    engineer.focus();
    fireEvent.click(engineer);
    expect(document.activeElement).toBe(engineer);
    const unavailable = ticket().getByRole("button", { name: "提交本地合成报修" });
    expect(unavailable.getAttribute("aria-describedby")).toBe("ticket-role-explanation");
    fireEvent.click(unavailable);
    settle();
    expect(ticket().getByRole("status").textContent).toBe("草稿 · v1");
    fireEvent.click(ticket().getByRole("button", { name: /^Synthetic Reporter/ }));
    unavailable.focus();
    fireEvent.click(unavailable);
    expect(document.activeElement).toBe(unavailable);
    expect(ticket().getByText("正在等待本地合成回执").parentElement?.getAttribute("aria-busy")).toBe("true");
    fireEvent.click(engineer);
    settle();
    expect(ticket().getByRole("status").textContent).toBe("已提交（演示） · v2");
  });

  it("repeats conflict/refresh without losing deduplication history, then accepts the current version", () => {
    render(<App initialScenario="normal" />);
    openTicket();
    for (let attempt = 0; attempt < 2; attempt += 1) {
      fireEvent.click(ticket().getByRole("button", { name: "模拟版本冲突" }));
      settle();
      expect(ticket().getByText("期望版本 v0；当前演示版本 v1。")).toBeTruthy();
      expect(ticket().getByRole("status").textContent).toBe("草稿 · v1");
      fireEvent.click(ticket().getByRole("button", { name: "刷新本地演示上下文" }));
      expect(document.activeElement).toBe(ticket().getByRole("button", { name: "提交本地合成报修" }));
    }
    fireEvent.click(ticket().getByRole("button", { name: "提交本地合成报修" }));
    settle();
    expect(ticket().getByRole("status").textContent).toContain("v2");
    expect(within(ticket().getByRole("region", { name: "Ticket Timeline" })).getAllByRole("heading", { name: "合成版本冲突" })).toHaveLength(2);
  });

  it("cancels on a different Thread and supports rejection, refresh and a new attempt after returning", () => {
    render(<App initialScenario="normal" />);
    openTicket();
    fireEvent.click(ticket().getByRole("button", { name: "提交本地合成报修" }));
    fireEvent.click(screen.getByRole("button", { name: /共享工作台准备/ }));
    settle();
    expect(screen.getByRole("heading", { name: "共享工作台准备" })).toBeTruthy();
    expect(screen.queryByRole("region", { name: "Synthetic Ticket experience" })).toBeNull();
    fireEvent.click(screen.getByRole("button", { name: /演示工作站无法输出文档/ }));
    expect(ticket().getByRole("status").textContent).toBe("草稿 · v1");
    expect(ticket().getByText("本地合成命令未被接受")).toBeTruthy();
    fireEvent.click(ticket().getByRole("button", { name: "刷新本地演示上下文" }));
    fireEvent.click(ticket().getByRole("button", { name: "提交本地合成报修" }));
    settle();
    expect(ticket().getByRole("status").textContent).toContain("v2");
    const timeline = ticket().getByRole("region", { name: "Ticket Timeline" });
    expect(within(timeline).getAllByRole("heading", { name: "合成命令已拒绝" })).toHaveLength(1);
  });

  it.each(["empty", "loading", "error", "permission-denied"])("cancels pending on scenario %s and starts a clean local fixture on return", (scenario) => {
    render(<App initialScenario="normal" />);
    openTicket();
    fireEvent.click(ticket().getByRole("button", { name: "提交本地合成报修" }));
    fireEvent.change(screen.getByRole("combobox", { name: "切换演示场景" }), { target: { value: scenario } });
    settle();
    expect(screen.queryByRole("region", { name: "Synthetic Ticket experience" })).toBeNull();
    expect(screen.getByRole("region", { name: /状态/ })).toBeTruthy();
    fireEvent.change(screen.getByRole("combobox", { name: "切换演示场景" }), { target: { value: "normal" } });
    openTicket();
    expect(ticket().getByRole("status").textContent).toBe("草稿 · v1");
    expect(ticket().queryByText("合成命令回执已接受")).toBeNull();
  });

  it("cleans up the timer on unmount and cannot settle into a newly mounted App", () => {
    const view = render(<App initialScenario="normal" />);
    openTicket();
    fireEvent.click(ticket().getByRole("button", { name: "提交本地合成报修" }));
    view.unmount();
    expect(vi.getTimerCount()).toBe(0);
    settle();
    render(<App initialScenario="normal" />);
    openTicket();
    expect(ticket().getByRole("status").textContent).toBe("草稿 · v1");
  });
});

describe("Ticket Canvas and safe projections", () => {
  it.each([
    ["查看 Ticket 概览", "Ticket 概览"], ["查看生命周期记录", "Ticket 生命周期"],
    ["查看合成参与者", "Ticket 合成参与者"], ["查看附件参考", "Ticket 附件参考"], ["查看演示 SLA", "Ticket 演示 SLA"],
  ])("opens %s, focuses the heading, and restores the remounted trigger after both close paths", (buttonName, regionName) => {
    render(<App initialScenario="normal" />);
    openTicket();
    const trigger = screen.getByRole("button", { name: buttonName });
    fireEvent.click(trigger);
    expect(screen.getByRole("region", { name: regionName })).toBeTruthy();
    expect(document.activeElement).toBe(screen.getByRole("heading", { name: "Ticket Canvas 详情" }));
    fireEvent.keyDown(window, { key: "Escape" });
    const restored = screen.getByRole("button", { name: buttonName });
    expect(restored).not.toBe(trigger);
    expect(document.activeElement).toBe(restored);
    fireEvent.click(restored);
    fireEvent.click(screen.getByRole("button", { name: "关闭 Ticket Canvas 详情" }));
    expect(document.activeElement).toBe(screen.getByRole("button", { name: buttonName }));
  });

  it("preserves Ticket state and Canvas heading focus across the shell panel toggle", () => {
    render(<App initialScenario="normal" />);
    openTicket(); runSteps(1);
    fireEvent.click(screen.getByRole("button", { name: "查看 Ticket 概览" }));
    fireEvent.click(screen.getByRole("button", { name: "关闭 Context 与 Canvas 面板" }));
    expect(screen.queryByRole("region", { name: "Ticket 概览" })).toBeNull();
    fireEvent.click(screen.getByRole("button", { name: "打开 Context 与 Canvas 面板" }));
    expect(document.activeElement).toBe(screen.getByRole("heading", { name: "Ticket Canvas 详情" }));
    expect(screen.getByRole("region", { name: "Ticket 概览" }).textContent).toContain("v2");
  });

  it("shows participant changes, ordered lifecycle history and non-production SLA", () => {
    render(<App initialScenario="normal" />);
    openTicket(); runSteps(3);
    fireEvent.click(screen.getByRole("button", { name: "查看合成参与者" }));
    expect(screen.getByRole("region", { name: "Ticket 合成参与者" }).textContent).toContain("已分派工程师");
    fireEvent.keyDown(window, { key: "Escape" });
    for (const [label, persona] of steps.slice(3)) {
      fireEvent.click(ticket().getByRole("button", { name: new RegExp(`^${persona}`) }));
      fireEvent.click(ticket().getByRole("button", { name: label })); settle();
    }
    fireEvent.click(screen.getByRole("button", { name: "查看合成参与者" }));
    expect(screen.getByRole("region", { name: "Ticket 合成参与者" }).textContent).toContain("下一响应工程师");
    fireEvent.keyDown(window, { key: "Escape" });
    fireEvent.click(screen.getByRole("button", { name: "查看生命周期记录" }));
    const events = within(screen.getByRole("region", { name: "Ticket 生命周期" })).getAllByRole("listitem");
    expect(events).toHaveLength(9);
    events.forEach((event, index) => expect(event.textContent).toContain(`v${index + 1}`));
    expect(events.at(-1)?.textContent).toContain("已重新打开");
    fireEvent.keyDown(window, { key: "Escape" });
    fireEvent.click(screen.getByRole("button", { name: "查看演示 SLA" }));
    const sla = screen.getByRole("region", { name: "Ticket 演示 SLA" });
    expect(sla.textContent).toContain("非生产 SLA");
    expect(sla.textContent).toContain("重新进入");
  });

  it("renders attachment metadata without a file input, image, link or upload/download action", () => {
    render(<App initialScenario="normal" />);
    openTicket();
    fireEvent.click(screen.getByRole("button", { name: "查看附件参考" }));
    const attachment = screen.getByRole("region", { name: "Ticket 附件参考" });
    expect(attachment.textContent).toContain("demo-asset-ticket-screenshot-001");
    expect(attachment.textContent).toContain("未上传实际文件");
    expect(attachment.textContent).toContain("没有字节、下载或预览");
    expect(attachment.querySelector("input, a, img, button")).toBeNull();
    expect(ticket().queryByRole("button", { name: /上传|下载/ })).toBeNull();
  });
});
