import { useEffect, useRef, useState, type ReactNode } from "react";
import type { WorkspaceFixture, WorkspaceSpace } from "../../fixtures/workspace-fixtures";
import type { SyntheticTicket } from "../../capabilities/tickets/ticket-model";
import { filterWorkbench, projectWorkbench, spaceLabel, type WorkbenchItem } from "./workbench-model";
import { readonlyWorkbenchSamples } from "./workbench-fixtures";
import { WorkspaceSidebar } from "./WorkspaceSidebar";
import { WorkItemBoard } from "./WorkItemBoard";
import { WorkItemList } from "./WorkItemList";
import { WorkItemDetail } from "./WorkItemDetail";
import "./workbench.css";

type WorkbenchSelect = (item: WorkbenchItem, trigger: HTMLButtonElement) => void;

function renderWorkbenchView(mode: string, items: readonly WorkbenchItem[], spaces: readonly WorkspaceSpace[], onSelect: WorkbenchSelect): ReactNode {
  switch (mode) {
    case "看板": return <WorkItemBoard items={items} onSelect={onSelect} spaces={spaces} />;
    case "列表": return <WorkItemList items={items} onSelect={onSelect} spaces={spaces} />;
    default: return <section aria-label="事项动态" className="wb-activity"><p>当前合成投影摘要；进入既有讨论查看来源活动。以下不是新发生的后端事件。</p>{items.map((item) => <article key={item.id}><span>{item.statusLabel} · {item.participants}</span><button id={`wb-activity-${item.id}`} onClick={(event) => onSelect(item, event.currentTarget)} type="button">{item.title}</button><small>来源：{item.source}</small></article>)}</section>;
  }
}

export function WorkspaceHome({ fixture, ticket, children, threadActive, onThread, onHome, scenarioControl, exceptionalState }: { fixture: WorkspaceFixture; ticket: SyntheticTicket; children: ReactNode; threadActive: boolean; onThread: (threadId: string) => void; onHome: () => void; scenarioControl: ReactNode; exceptionalState: ReactNode }) {
  const [query, setQuery] = useState("");
  const [spaceId, setSpaceId] = useState("");
  const [mine, setMine] = useState(false);
  const [favoritesOnly, setFavoritesOnly] = useState(false);
  const [favoriteIds, setFavoriteIds] = useState<ReadonlySet<string>>(() => new Set());
  const [mode, setMode] = useState("看板");
  const [expanded, setExpanded] = useState(false);
  const [selected, setSelected] = useState<WorkbenchItem | null>(null);
  const [notice, setNotice] = useState("");
  const searchRef = useRef<HTMLInputElement>(null);
  const menuRef = useRef<HTMLButtonElement>(null);
  const noticeRef = useRef<HTMLHeadingElement>(null);
  const triggerId = useRef("");
  const restore = useRef(false);
  const focusSearch = useRef(false);
  const items = fixture.scenario === "normal" ? [...projectWorkbench(fixture, ticket), ...readonlyWorkbenchSamples] : [];
  const filtered = filterWorkbench(items, query, spaceId, mine);
  const visible = favoritesOnly ? filtered.filter((item) => favoriteIds.has(item.id)) : filtered;
  const goHome = () => { setSelected(null); setNotice(""); onHome(); };
  const closeSidebar = () => { setExpanded(false); menuRef.current?.focus(); };
  const search = () => { goHome(); setFavoritesOnly(false); setExpanded(false); focusSearch.current = searchRef.current === null; searchRef.current?.focus(); };
  useEffect(() => {
    if (!threadActive && focusSearch.current) { searchRef.current?.focus(); focusSearch.current = false; }
    if (!threadActive && restore.current) { document.getElementById(triggerId.current)?.focus(); restore.current = false; }
  }, [threadActive, selected]);
  useEffect(() => { if (notice) noticeRef.current?.focus(); }, [notice]);
  useEffect(() => {
    const shortcut = (event: globalThis.KeyboardEvent) => {
      if ((event.ctrlKey || event.metaKey) && event.key.toLowerCase() === "k") { event.preventDefault(); onHome(); setSelected(null); setNotice(""); setExpanded(false); focusSearch.current = searchRef.current === null; searchRef.current?.focus(); }
    };
    window.addEventListener("keydown", shortcut);
    return () => window.removeEventListener("keydown", shortcut);
  }, [onHome]);
  const select = (item: WorkbenchItem, trigger: HTMLButtonElement) => {
    triggerId.current = trigger.id;
    setNotice("");
    if (item.ticket && item.threadId) onThread(item.threadId);
    else setSelected(item);
  };
  const toggleFavorite = (itemId: string) => setFavoriteIds((current) => {
    const next = new Set(current);
    if (next.has(itemId)) next.delete(itemId);
    else next.add(itemId);
    return next;
  });
  const closeDetail = () => { restore.current = true; setSelected(null); };
  const detail = selected && <WorkItemDetail favorite={favoriteIds.has(selected.id)} item={selected} onClose={closeDetail} onThread={onThread} onToggleFavorite={() => toggleFavorite(selected.id)} />;
  const homeContent = fixture.scenario === "normal" ? <>{detail}{visible.length === 0 && <p className="wb-empty" role="status">没有匹配的事项。请调整搜索或空间筛选。</p>}{renderWorkbenchView(mode, visible, fixture.spaces, select)}</> : exceptionalState;
  const homePage = <main className="wb-page"><div className="wb-page-heading"><span aria-hidden="true" className="wb-page-icon">▦</span><div><h1>协作工作台</h1><p>让事项、讨论与交付，在一处协同。</p></div></div><div className="wb-summary" aria-live="polite"><span><strong>{visible.length}</strong> 个展示事项</span><span><strong>{visible.filter((item) => item.group === "待处理").length}</strong> 待处理</span><span><strong>{visible.filter((item) => item.group === "待确认").length}</strong> 待确认</span></div><div className="wb-toolbar"><div aria-label="事项视图" className="wb-views" role="group">{["看板", "列表", "动态"].map((entry) => <button aria-pressed={mode === entry} key={entry} onClick={() => { setSelected(null); setMode(entry); }} type="button">{entry}</button>)}</div><div className="wb-tools"><input aria-label="搜索事项" onChange={(event) => { setSelected(null); setQuery(event.target.value); }} placeholder="搜索事项…" ref={searchRef} type="search" value={query} /><select aria-label="空间过滤" onChange={(event) => { setSelected(null); setSpaceId(event.target.value); }} value={spaceId}><option value="">全部空间</option>{fixture.spaces.map((space) => <option key={space.id} value={space.id}>{spaceLabel(space.label)}</option>)}</select><button aria-pressed={mine} onClick={() => { setSelected(null); setMine(!mine); }} type="button">我参与的</button><button className="wb-new" onClick={() => setNotice("新建入口预览：本轮不创建新工单。现有演示工单可从看板进入；没有提交或保存任何内容。")} type="button">＋ 新建入口预览</button></div></div>{notice && <section className="wb-notice" aria-label="入口说明"><h2 ref={noticeRef} tabIndex={-1}>入口说明</h2><p>{notice}</p><button onClick={() => { setNotice(""); searchRef.current?.focus(); }} type="button">关闭说明</button></section>}{homeContent}<div className="wb-footer"><span>本页为本地合成预览 · 刷新后恢复初始状态</span>{scenarioControl}</div></main>;
  const showThread = threadActive && fixture.scenario === "normal";
  return <div className="wb-shell" onKeyDown={(event) => { if (event.key === "Escape" && expanded) { event.stopPropagation(); closeSidebar(); } }}><WorkspaceSidebar expanded={expanded} favoriteCount={favoriteIds.size} favoritesOnly={favoritesOnly} items={items} mine={mine} onAgent={() => { goHome(); setExpanded(false); setNotice("Agent 尚未接入：没有模型调用、后台任务或工具执行。可在 Agent 协作空间查看固定合成提案。"); }} onClose={closeSidebar} onFavorites={() => { goHome(); setFavoritesOnly(true); setSpaceId(""); setMine(false); setQuery(""); if (expanded) closeSidebar(); }} onNavigate={(id, onlyMine) => { goHome(); setFavoritesOnly(false); setSpaceId(id); setMine(onlyMine); setQuery(""); if (expanded) closeSidebar(); }} onSearch={search} spaceId={spaceId} spaces={fixture.spaces} /><div className="wb-main"><header className="wb-topbar"><div><button aria-controls="wb-sidebar" aria-expanded={expanded} className="wb-menu" onClick={() => setExpanded(!expanded)} ref={menuRef} type="button">{expanded ? "收起导航" : "打开导航"}</button><span>工作空间 / {showThread ? "事项上下文" : "协作工作台"}</span></div><span className="wb-demo">公开合成演示</span></header>{showThread ? <><div className="wb-back"><button onClick={() => { restore.current = true; goHome(); }} type="button">← 返回工作台</button>{scenarioControl}</div>{children}</> : homePage}</div></div>;
}
