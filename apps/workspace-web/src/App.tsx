import { useCallback, useEffect, useMemo, useReducer, useRef, useState } from "react";
import { CanvasPanel } from "./features/canvas/CanvasPanel";
import { useSyntheticReceiptDelay } from "./features/cards/card-runtime";
import { SpaceList } from "./features/spaces/SpaceList";
import { ActivityTimeline } from "./features/timeline/ActivityTimeline";
import { createWorkspaceRuntime, workspaceRuntimeReducer } from "./features/threads/workspace-runtime";
import { ThreadSelector } from "./features/threads/ThreadSelector";
import { getWorkspaceFixture, type FixtureIcon, type WorkspaceScenario, WORKSPACE_SCENARIOS } from "./fixtures/workspace-fixtures";

const primaryNavigation = [["home", "Home"], ["work", "My Work"], ["messages", "Messages"], ["decisions", "Decisions"], ["agents", "Agent Runs"], ["knowledge", "Knowledge"]] as const;

function scenarioFromLocation(): WorkspaceScenario {
  const requested = new URLSearchParams(window.location.search).get("scenario");
  return WORKSPACE_SCENARIOS.includes(requested as WorkspaceScenario) ? requested as WorkspaceScenario : "normal";
}

function Glyph({ name, size = 18 }: { name: string; size?: number }) {
  const common = { fill: "none", stroke: "currentColor", strokeLinecap: "round" as const, strokeLinejoin: "round" as const, strokeWidth: 1.8 };
  const paths: Record<string, React.ReactNode> = { home: <><path {...common} d="m3 10 9-7 9 7v10H3z" /><path {...common} d="M9 20v-6h6v6" /></>, work: <><rect {...common} x="4" y="4" width="16" height="16" rx="3" /><path {...common} d="m8 12 2.5 2.5L16 9" /></>, messages: <><path {...common} d="M4 5h16v11H8l-4 3z" /><path {...common} d="M8 9h8M8 12h5" /></>, decisions: <><path {...common} d="M12 3 4 7v5c0 5 3.4 8 8 9 4.6-1 8-4 8-9V7z" /><path {...common} d="m9 12 2 2 4-4" /></>, agents: <><rect {...common} x="5" y="5" width="14" height="14" rx="4" /><path {...common} d="M9 12h6M12 9v6M12 2v3M19 12h3" /></>, knowledge: <><path {...common} d="M5 4.5A3.5 3.5 0 0 1 8.5 4H12v15H8.5A3.5 3.5 0 0 0 5 20zM19 4.5A3.5 3.5 0 0 0 15.5 4H12v15h3.5A3.5 3.5 0 0 1 19 20z" /></>, wrench: <><path {...common} d="M14 6a4 4 0 0 0-5 5L4 16l4 4 5-5a4 4 0 0 0 5-5l-3 2-3-3z" /></>, receipt: <><path {...common} d="M6 3h12v18l-3-2-3 2-3-2-3 2z" /><path {...common} d="M9 8h6M9 12h6M9 16h3" /></>, spark: <><path {...common} d="m12 2 1.5 6.5L20 10l-6.5 1.5L12 18l-1.5-6.5L4 10l6.5-1.5z" /></>, book: <><path {...common} d="M5 4h9a3 3 0 0 1 3 3v13H8a3.5 3.5 0 0 0-3 3z" /><path {...common} d="M5 4v16" /></>, search: <><circle {...common} cx="10.5" cy="10.5" r="5.5" /><path {...common} d="m15 15 4.5 4.5" /></>, panel: <><rect {...common} x="3" y="4" width="18" height="16" rx="2" /><path {...common} d="M14 4v16" /></>, close: <path {...common} d="m6 6 12 12M18 6 6 18" />, chevron: <path {...common} d="m8 10 4 4 4-4" /> };
  return <svg aria-hidden="true" className="glyph" height={size} viewBox="0 0 24 24" width={size}>{paths[name] ?? paths.home}</svg>;
}

function StateView({ scenario, message }: { scenario: WorkspaceScenario; message: string }) {
  const label = scenario === "empty" ? "空状态" : scenario === "loading" ? "加载状态" : scenario === "error" ? "演示错误状态" : "演示权限状态";
  return <section aria-label={label} className={`state-view state-${scenario}`}><span className="state-kicker">演示场景</span><h2>{message}</h2><p>{scenario === "loading" ? "此界面没有数据请求，展示仅用于校验加载布局。" : scenario === "error" ? "这是可复现的展示状态，不代表系统故障。" : scenario === "permission-denied" ? "身份、授权和范围检查将在后续服务切片提供。" : "选择其他空间或切换场景以查看壳层布局。"}</p></section>;
}

export function App({ initialScenario }: { initialScenario?: WorkspaceScenario }) {
  const [scenario, setScenario] = useState<WorkspaceScenario>(initialScenario ?? scenarioFromLocation());
  const fixture = useMemo(() => getWorkspaceFixture(scenario), [scenario]);
  const [runtime, dispatch] = useReducer(workspaceRuntimeReducer, fixture, createWorkspaceRuntime);
  const canvasTriggerRef = useRef<HTMLButtonElement | null>(null);
  const shouldRestoreCanvasFocusRef = useRef(false);
  const settle = useCallback((actionId: string) => dispatch({ type: "settle-action", actionId }), []);
  const closeCanvas = useCallback(() => { shouldRestoreCanvasFocusRef.current = true; dispatch({ type: "close-canvas" }); }, []);
  useSyntheticReceiptDelay(runtime.receipts, scenario, settle);

  useEffect(() => { dispatch({ type: "reset", fixture }); }, [fixture]);
  useEffect(() => {
    if (runtime.activeCanvasRoute || !shouldRestoreCanvasFocusRef.current) return;
    shouldRestoreCanvasFocusRef.current = false;
    const previousTrigger = canvasTriggerRef.current;
    const trigger = previousTrigger?.isConnected ? previousTrigger : Array.from(document.querySelectorAll<HTMLButtonElement>("button")).find((button) => button.textContent === previousTrigger?.textContent);
    trigger?.focus();
    canvasTriggerRef.current = trigger ?? null;
  }, [runtime.activeCanvasRoute]);
  useEffect(() => {
    const closeOnEscape = (event: globalThis.KeyboardEvent) => { if (event.key === "Escape") runtime.activeCanvasRoute ? closeCanvas() : runtime.isPanelOpen && dispatch({ type: "toggle-panel" }); };
    window.addEventListener("keydown", closeOnEscape);
    return () => window.removeEventListener("keydown", closeOnEscape);
  }, [closeCanvas, runtime.activeCanvasRoute, runtime.isPanelOpen]);

  const selectedSpace = fixture.spaces.find((space) => space.id === runtime.selectedSpaceId) ?? fixture.spaces[0];
  const visibleThreads = fixture.threads.filter((thread) => thread.parentSpaceId === runtime.selectedSpaceId);
  const selectedThread = visibleThreads.find((thread) => thread.id === runtime.selectedThreadId) ?? visibleThreads[0] ?? null;
  const activities = selectedThread ? [...selectedThread.activities, ...runtime.receiptActivities.filter((activity) => Object.values(runtime.receipts).some((receipt) => receipt.commandId === activity.sourceId && receipt.threadId === selectedThread.id))] : [];
  const openCanvas = (route: string, trigger: HTMLButtonElement) => { canvasTriggerRef.current = trigger; dispatch({ type: "open-canvas", route }); };
  const submitAction = (actionId: string) => { if (!selectedThread) return; const cardActivity = selectedThread.activities.find((activity) => activity.kind === "card" && activity.card.actions.some((action) => action.actionId === actionId)); const card = cardActivity?.kind === "card" ? cardActivity.card : undefined; const action = card?.actions.find((entry) => entry.actionId === actionId); if (action) dispatch({ type: "submit-action", action, threadId: selectedThread.id }); };

  return <div className="workspace-shell"><header className="workspace-header"><div className="identity-lockup"><span className="mark" aria-hidden="true"><span /></span><div><p className="eyebrow">{fixture.organizationLabel}</p><h1>Hospital Workspace</h1></div></div><label className="global-search"><span className="sr-only">全局搜索（仅演示）</span><Glyph name="search" size={16} /><input aria-label="全局搜索（仅演示）" placeholder="搜索空间、事项或上下文" type="search" /><kbd>⌘ K</kbd></label><div className="header-status" aria-label="演示状态"><span className="status-dot" aria-hidden="true" /><span>{fixture.connectionLabel}</span><span className="privacy-chip">{fixture.privacyLabel}</span><button aria-label="合成用户菜单（演示中不可用）" className="user-menu" disabled type="button">{fixture.userLabel}<Glyph name="chevron" size={15} /></button></div></header><div className={`workspace-grid ${runtime.isPanelOpen ? "panel-open" : "panel-closed"}`}><nav aria-label="主要导航" className="primary-rail"><div className="rail-rule" />{primaryNavigation.map(([id, label]) => <button aria-current={runtime.activePrimary === id ? "page" : undefined} aria-label={label} className={runtime.activePrimary === id ? "rail-item active" : "rail-item"} key={id} onClick={() => dispatch({ type: "select-primary", primary: id })} type="button"><Glyph name={id} size={19} /><span>{label}</span></button>)}<div className="rail-footnote">MVP-02<br />合成运行时</div></nav><aside aria-label="能力空间" className="space-pane"><div className="pane-heading"><div><p className="eyebrow">Capabilities</p><h2>{runtime.activePrimary === "home" ? "空间" : primaryNavigation.find(([id]) => id === runtime.activePrimary)?.[1]}</h2></div>{import.meta.env.DEV && <select aria-label="切换演示场景" className="scenario-select" onChange={(event) => setScenario(event.target.value as WorkspaceScenario)} value={scenario}>{WORKSPACE_SCENARIOS.map((entry) => <option key={entry} value={entry}>{entry}</option>)}</select>}</div><SpaceList onSelect={(spaceId) => dispatch({ type: "select-space", fixture, spaceId })} renderIcon={(icon: FixtureIcon) => <Glyph name={icon} size={17} />} selectedSpaceId={runtime.selectedSpaceId} spaces={fixture.spaces} /><p className="pane-disclaimer">所有计数和内容均为固定合成演示数据，不代表实时工作项。</p></aside><main className="timeline-pane"><div className="timeline-header"><div><p className="eyebrow">{selectedSpace?.label ?? "Workspace"}</p><h2>{selectedThread?.title ?? fixture.stateMessage}</h2><p className="thread-subtitle">{selectedThread?.subtitle ?? "展示空间、线程和上下文之间的关系。"}</p></div><button aria-expanded={runtime.isPanelOpen} aria-label={runtime.isPanelOpen ? "关闭 Context 与 Canvas 面板" : "打开 Context 与 Canvas 面板"} className="panel-toggle" onClick={() => dispatch({ type: "toggle-panel" })} type="button"><Glyph name={runtime.isPanelOpen ? "close" : "panel"} size={17} /><span>{runtime.isPanelOpen ? "收起上下文" : "打开上下文"}</span></button></div>{scenario === "normal" && selectedThread ? <><ThreadSelector onSelect={(threadId) => dispatch({ type: "select-thread", threadId })} selectedThreadId={selectedThread.id} threads={visibleThreads} /><ActivityTimeline activities={activities} onOpenCanvas={openCanvas} onRefreshConflict={(actionId) => dispatch({ type: "refresh-conflict", actionId })} onSubmit={submitAction} receipts={runtime.receipts} /><section aria-label="演示说明" className="summary-note"><span className="summary-symbol">i</span><div><strong>演示摘要</strong><p>此运行时只呈现确定性本地界面状态；没有后端、持久化、医院系统连接或权威业务完成。</p></div></section></> : <StateView message={fixture.stateMessage} scenario={scenario} />}</main>{runtime.isPanelOpen && <CanvasPanel onClose={closeCanvas} onOpenRoute={openCanvas} route={runtime.activeCanvasRoute} thread={selectedThread} />}</div></div>;
}
