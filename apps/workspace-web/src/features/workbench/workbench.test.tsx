import { act, fireEvent, render, screen, within } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import { App } from "../../App";
import { createInitialSyntheticTicket } from "../../capabilities/tickets/ticket-fixtures";
import { SYNTHETIC_TICKET_RECEIPT_DELAY_MS } from "../../capabilities/tickets/ticket-runtime";
import { ticketGroup } from "./workbench-model";

afterEach(() => vi.useRealTimers());
const board = () => within(screen.getByRole("region", { name: "事项看板" }));
const searchEntries = ["Ctrl+K", "Cmd+K", "sidebar"] as const;
function requestWorkbenchSearch(entry: typeof searchEntries[number]) {
  if (entry === "sidebar") {
    fireEvent.click(within(screen.getByRole("navigation", { name: "主要导航" })).getByRole("button", { name: /搜索事项/ }));
  } else {
    fireEvent.keyDown(window, { key: "k", ctrlKey: entry === "Ctrl+K", metaKey: entry === "Cmd+K" });
  }
}

describe("UI-01 workbench", () => {
  it("starts with one light sidebar, four groups and no persistent Context panel", () => {
    render(<App initialScenario="normal" />);
    expect(screen.getByRole("heading", { name: "协作工作台" })).toBeTruthy();
    expect(screen.getAllByRole("complementary")).toHaveLength(1);
    expect(screen.queryByRole("complementary", { name: "Context 与 Canvas" })).toBeNull();
    for (const name of ["待处理", "处理中", "待确认", "已关闭"]) expect(board().getByRole("region", { name })).toBeTruthy();
    expect(screen.getByText("公开合成演示")).toBeTruthy();
  });

  it("suppresses sidebar current-page markers while a thread is active and restores Home on return", () => {
    render(<App initialScenario="normal" />);
    const sidebar = screen.getByRole("complementary", { name: "能力空间" });
    const home = within(sidebar).getByRole("button", { name: "首页" });
    expect(home.getAttribute("aria-current")).toBe("page");

    fireEvent.click(board().getByRole("button", { name: /演示工作站无法输出文档/ }));

    expect(home.getAttribute("aria-current")).toBeNull();
    expect(sidebar.querySelector('[aria-current="page"]')).toBeNull();

    fireEvent.click(screen.getByRole("button", { name: "← 返回工作台" }));
    expect(home.getAttribute("aria-current")).toBe("page");
  });

  it("shares counts, title/description search and space/person filters across views", () => {
    render(<App initialScenario="normal" />);
    const count = board().getAllByRole("button").length;
    fireEvent.click(screen.getByRole("button", { name: "列表" }));
    expect(within(screen.getByRole("region", { name: "事项列表" })).getAllByRole("button")).toHaveLength(count);
    fireEvent.change(screen.getByRole("searchbox", { name: "搜索事项" }), { target: { value: "没有输出结果" } });
    expect(within(screen.getByRole("region", { name: "事项列表" })).getAllByRole("button")).toHaveLength(1);
    fireEvent.click(screen.getByRole("button", { name: "看板" }));
    expect(board().getAllByRole("button")).toHaveLength(1);
    fireEvent.change(screen.getByRole("combobox", { name: "空间过滤" }), { target: { value: "demo-space-knowledge-work" } });
    expect(screen.getByRole("status").textContent).toContain("没有匹配");
    fireEvent.change(screen.getByRole("searchbox", { name: "搜索事项" }), { target: { value: "" } });
    expect(board().getAllByRole("button")).toHaveLength(1);
    fireEvent.change(screen.getByRole("combobox", { name: "空间过滤" }), { target: { value: "" } });
    fireEvent.click(screen.getByRole("button", { name: "我参与的" }));
    expect(board().queryByRole("button", { name: /演示协作指引整理/ })).toBeNull();
    fireEvent.click(screen.getByRole("button", { name: "动态" }));
    expect(screen.getByRole("region", { name: "事项动态" }).textContent).toContain("不是新发生的后端事件");
  });

  it("projects every Ticket status without mutating the source", () => {
    const ticket = createInitialSyntheticTicket();
    for (const status of ["draft", "submitted", "triaged"] as const) expect(ticketGroup(status)).toBe("待处理");
    for (const status of ["assigned", "accepted", "in_progress", "reopened"] as const) expect(ticketGroup(status)).toBe("处理中");
    expect(ticketGroup("resolved")).toBe("待确认");
    expect(ticketGroup("closed")).toBe("已关闭");
    expect(ticket).toEqual(createInitialSyntheticTicket());
  });

  it("returns from the existing Ticket with the same state and stable card focus", () => {
    vi.useFakeTimers();
    render(<App initialScenario="normal" />);
    const trigger = board().getByRole("button", { name: /演示工作站无法输出文档/ });
    const triggerId = trigger.id;
    fireEvent.click(trigger);
    fireEvent.click(screen.getByRole("button", { name: "提交本地合成报修" }));
    act(() => vi.advanceTimersByTime(SYNTHETIC_TICKET_RECEIPT_DELAY_MS));
    fireEvent.click(screen.getByRole("button", { name: "← 返回工作台" }));
    const projected = board().getByRole("button", { name: /演示工作站无法输出文档/ });
    expect(projected.textContent).toContain("已提交（演示） · v2");
    expect(projected.id).toBe(triggerId);
    expect(document.activeElement).toBe(projected);
    fireEvent.click(screen.getByRole("button", { name: "列表" }));
    fireEvent.click(screen.getByRole("button", { name: /演示工作站无法输出文档/ }));
    expect(within(screen.getByRole("region", { name: "Synthetic Ticket experience" })).getByRole("status").textContent).toBe("已提交（演示） · v2");
  });

  it("keeps the layout sample read-only and closes details with focus restoration", () => {
    render(<App initialScenario="normal" />);
    const trigger = board().getByRole("button", { name: /演示协作指引整理/ });
    fireEvent.click(trigger);
    const detail = within(screen.getByRole("region", { name: "事项详情" }));
    expect(document.activeElement).toBe(detail.getByRole("heading", { name: "演示协作指引整理" }));
    expect(detail.getByRole("button", { name: "收藏事项" })).toBeTruthy();
    fireEvent.keyDown(document.activeElement!, { key: "Escape" });
    expect(screen.queryByRole("region", { name: "事项详情" })).toBeNull();
    expect(document.activeElement).toBe(trigger);
    fireEvent.click(trigger);
    fireEvent.click(screen.getByRole("button", { name: "关闭详情" }));
    expect(document.activeElement).toBe(trigger);
  });

  it("supports page-local favorites and filters the shared workbench collection", () => {
    const view = render(<App initialScenario="normal" />);
    const trigger = board().getByRole("button", { name: /演示协作指引整理/ });
    fireEvent.click(trigger);
    fireEvent.click(screen.getByRole("button", { name: "收藏事项" }));
    expect(screen.getByRole("button", { name: /已收藏/ }).textContent).toContain("1");
    fireEvent.click(screen.getByRole("button", { name: /已收藏/ }));
    expect(board().getByRole("button", { name: /演示协作指引整理/ })).toBeTruthy();
    expect(board().queryByRole("button", { name: /演示工作站无法输出文档/ })).toBeNull();
    view.unmount();
    render(<App initialScenario="normal" />);
    expect(screen.getByRole("button", { name: /已收藏/ }).textContent).toContain("0");
  });

  it("clears the search before showing favorites", () => {
    render(<App initialScenario="normal" />);
    fireEvent.click(board().getByRole("button", { name: /演示协作指引整理/ }));
    fireEvent.click(screen.getByRole("button", { name: "收藏事项" }));

    const search = screen.getByRole("searchbox", { name: "搜索事项" }) as HTMLInputElement;
    fireEvent.change(search, { target: { value: "工作站" } });
    expect(board().getByRole("button", { name: /演示工作站无法输出文档/ })).toBeTruthy();

    fireEvent.click(screen.getByRole("button", { name: /已收藏/ }));

    expect(search.value).toBe("");
    expect(board().getByRole("button", { name: /演示协作指引整理/ })).toBeTruthy();
  });

  it.each(["Ctrl+K", "Cmd+K"] as const)("clears favorites before %s global search", (entry) => {
    render(<App initialScenario="normal" />);
    const sidebar = within(screen.getByRole("complementary", { name: "能力空间" }));
    const favorites = sidebar.getByRole("button", { name: /已收藏/ });
    fireEvent.click(favorites);
    expect(favorites.getAttribute("aria-current")).toBe("page");
    expect(screen.getByRole("status").textContent).toContain("没有匹配");

    requestWorkbenchSearch(entry);

    const search = screen.getByRole("searchbox", { name: "搜索事项" }) as HTMLInputElement;
    expect(document.activeElement).toBe(search);
    expect(favorites.getAttribute("aria-current")).toBeNull();
    fireEvent.change(search, { target: { value: "工作站" } });
    expect(board().getByRole("button", { name: /演示工作站无法输出文档/ })).toBeTruthy();
  });

  it("restores focus to the menu button when favorites closes navigation", () => {
    render(<App initialScenario="normal" />);
    const menu = screen.getByText("打开导航", { selector: "button" });
    fireEvent.click(menu);
    const favorites = within(screen.getByRole("complementary", { name: "能力空间" })).getByRole("button", { name: /已收藏/ });
    favorites.focus();

    fireEvent.click(favorites);

    expect(menu.getAttribute("aria-expanded")).toBe("false");
    expect(document.activeElement).toBe(menu);
  });

  it("cancels a pending Ticket when returning home without settling a late transition", () => {
    vi.useFakeTimers();
    render(<App initialScenario="normal" />);
    fireEvent.click(board().getByRole("button", { name: /演示工作站无法输出文档/ }));
    fireEvent.click(screen.getByRole("button", { name: "提交本地合成报修" }));
    fireEvent.click(screen.getByRole("button", { name: "← 返回工作台" }));
    act(() => vi.advanceTimersByTime(SYNTHETIC_TICKET_RECEIPT_DELAY_MS));
    expect(board().getByRole("button", { name: /演示工作站无法输出文档/ }).textContent).toContain("草稿 · v1");
    fireEvent.click(board().getByRole("button", { name: /演示工作站无法输出文档/ }));
    expect(screen.getByText("本地合成命令未被接受")).toBeTruthy();
  });

  it.each(searchEntries)("does not retain a deferred focus request after %s on home", (entry) => {
    render(<App initialScenario="normal" />);
    const search = screen.getByRole("searchbox", { name: "搜索事项" });
    requestWorkbenchSearch(entry);
    expect(document.activeElement).toBe(search);
    requestWorkbenchSearch(entry);
    expect(document.activeElement).toBe(search);

    const trigger = board().getByRole("button", { name: /演示协作指引整理/ });
    fireEvent.click(trigger);
    const heading = within(screen.getByRole("region", { name: "事项详情" })).getByRole("heading", { name: "演示协作指引整理" });
    expect(document.activeElement).toBe(heading);
    fireEvent.keyDown(heading, { key: "Escape" });
    expect(document.activeElement).toBe(trigger);
  });

  it.each(searchEntries)("consumes deferred %s focus after the home input remounts", (entry) => {
    render(<App initialScenario="normal" />);
    fireEvent.click(board().getByRole("button", { name: /本周协作事项整理/ }));
    fireEvent.click(screen.getByRole("button", { name: "进入既有讨论与时间线" }));
    expect(screen.queryByRole("searchbox", { name: "搜索事项" })).toBeNull();

    requestWorkbenchSearch(entry);
    expect(document.activeElement).toBe(screen.getByRole("searchbox", { name: "搜索事项" }));
    const trigger = board().getByRole("button", { name: /演示协作指引整理/ });
    fireEvent.click(trigger);
    const heading = within(screen.getByRole("region", { name: "事项详情" })).getByRole("heading", { name: "演示协作指引整理" });
    expect(document.activeElement).toBe(heading);
    fireEvent.click(screen.getByRole("button", { name: "关闭详情" }));
    expect(document.activeElement).toBe(trigger);
  });

  it("explains Agent/new entry previews and supports search shortcuts and mobile navigation", () => {
    render(<App initialScenario="normal" />);
    fireEvent.click(screen.getByRole("button", { name: /协作助手/ }));
    expect(screen.getByRole("region", { name: "入口说明" }).textContent).toContain("Agent 尚未接入");
    fireEvent.click(screen.getByRole("button", { name: /新建入口预览/ }));
    expect(screen.getByRole("region", { name: "入口说明" }).textContent).toContain("没有提交或保存任何内容");
    fireEvent.keyDown(window, { key: "k", ctrlKey: true });
    expect(document.activeElement).toBe(screen.getByRole("searchbox", { name: "搜索事项" }));
    fireEvent.keyDown(window, { key: "k", metaKey: true });
    expect(document.activeElement).toBe(screen.getByRole("searchbox", { name: "搜索事项" }));
    fireEvent.click(screen.getByText("打开导航", { selector: "button" }));
    expect(document.activeElement).toBe(screen.getByText("关闭侧栏", { selector: "button" }));
    expect(screen.getByText("收起导航", { selector: "button" }).getAttribute("aria-expanded")).toBe("true");
    fireEvent.keyDown(screen.getByRole("complementary", { name: "能力空间" }), { key: "Escape" });
    expect(document.activeElement).toBe(screen.getByText("打开导航", { selector: "button" }));
  });


  const workbenchViews = [
    ["看板", "事项看板"],
    ["列表", "事项列表"],
    ["动态", "事项动态"],
  ] as const;
  const closePaths = ["Escape", "button"] as const;
  const favoriteCases = workbenchViews.flatMap(([mode, region]) => closePaths.map((close) => ({ mode, region, close })));
  const detailRegion = () => within(screen.getByRole("region", { name: "事项详情" }));
  function favoriteAndOpen(mode: string, region: string, title = "演示协作指引整理") {
    fireEvent.click(screen.getByRole("button", { name: mode }));
    const items = () => within(screen.getByRole("region", { name: region }));
    fireEvent.click(items().getByRole("button", { name: new RegExp(title) }));
    fireEvent.click(detailRegion().getByRole("button", { name: "收藏事项" }));
    fireEvent.click(screen.getByRole("button", { name: /已收藏/ }));
    const trigger = items().getByRole("button", { name: new RegExp(title) });
    fireEvent.click(trigger);
    return trigger;
  }
  function closeOpenDetail(close: string) {
    if (close === "Escape") fireEvent.keyDown(document.activeElement!, { key: "Escape" });
    else fireEvent.click(detailRegion().getByRole("button", { name: "关闭详情" }));
  }

  it.each(favoriteCases)("restores focus after the open favorite disappears: $mode / $close", ({ mode, region, close }) => {
    render(<App initialScenario="normal" />);
    const trigger = favoriteAndOpen(mode, region);
    const remove = detailRegion().getByRole("button", { name: "取消收藏事项" });
    remove.focus();
    fireEvent.click(remove);
    expect(document.getElementById(trigger.id)).toBeNull();
    expect(screen.getByRole("status").textContent).toContain("没有匹配");
    expect(document.activeElement).toBe(remove);
    expect(remove.textContent).toBe("收藏事项");

    closeOpenDetail(close);

    const search = screen.getByRole("searchbox", { name: "搜索事项" });
    expect(screen.queryByRole("region", { name: "事项详情" })).toBeNull();
    expect(document.activeElement).toBe(search);
    // A consumed fallback must not steal focus from the next detail.
    requestWorkbenchSearch("sidebar");
    const next = within(screen.getByRole("region", { name: region })).getByRole("button", { name: /演示协作指引整理/ });
    fireEvent.click(next);
    expect(document.activeElement).toBe(detailRegion().getByRole("heading", { name: "演示协作指引整理" }));
    closeOpenDetail(close);
    expect(document.activeElement).toBe(next);
  });

  it.each(workbenchViews)("restores a newly mounted favorite trigger in %s", (mode, region) => {
    render(<App initialScenario="normal" />);
    const original = favoriteAndOpen(mode, region);
    fireEvent.click(detailRegion().getByRole("button", { name: "取消收藏事项" }));
    expect(original.isConnected).toBe(false);
    fireEvent.click(detailRegion().getByRole("button", { name: "收藏事项" }));
    const replacement = document.getElementById(original.id);
    expect(replacement).not.toBeNull();
    expect(replacement).not.toBe(original);
    closeOpenDetail("button");
    expect(document.activeElement).toBe(replacement);
  });

  it.each(workbenchViews)("uses the same missing-trigger fallback after returning from a Thread in %s", (mode, region) => {
    render(<App initialScenario="normal" />);
    const trigger = favoriteAndOpen(mode, region, "本周协作事项整理");
    fireEvent.click(detailRegion().getByRole("button", { name: "取消收藏事项" }));
    expect(document.getElementById(trigger.id)).toBeNull();
    fireEvent.click(detailRegion().getByRole("button", { name: "进入既有讨论与时间线" }));
    expect(screen.queryByRole("searchbox", { name: "搜索事项" })).toBeNull();
    fireEvent.click(screen.getByRole("button", { name: "← 返回工作台" }));
    expect(screen.queryByRole("region", { name: "事项详情" })).toBeNull();
    expect(document.activeElement).toBe(screen.getByRole("searchbox", { name: "搜索事项" }));
  });

  it("falls back when a still-connected item trigger cannot receive focus", () => {
    render(<App initialScenario="normal" />);
    const trigger = board().getByRole("button", { name: /演示协作指引整理/ }) as HTMLButtonElement;
    fireEvent.click(trigger);
    trigger.disabled = true;
    closeOpenDetail("button");
    expect(trigger.isConnected).toBe(true);
    expect(document.activeElement).toBe(screen.getByRole("searchbox", { name: "搜索事项" }));
  });

  it("keeps one current sidebar page when toolbar filters are combined", () => {
    render(<App initialScenario="normal" />);
    const sidebar = screen.getByRole("complementary", { name: "能力空间" });
    const current = () => sidebar.querySelectorAll('[aria-current="page"]');
    const favorites = within(sidebar).getByRole("button", { name: /已收藏/ });
    fireEvent.click(favorites);
    fireEvent.change(screen.getByRole("combobox", { name: "空间过滤" }), { target: { value: "demo-space-it-support" } });
    fireEvent.click(screen.getByRole("button", { name: "我参与的" }));
    expect(current()).toHaveLength(1);
    expect(current()[0]).toBe(favorites);
    fireEvent.click(within(sidebar).getByRole("button", { name: /信息支持/ }));
    fireEvent.click(screen.getByRole("button", { name: "我参与的" }));
    expect(current()).toHaveLength(1);
    expect(current()[0].textContent).toContain("信息支持");
  });
});
