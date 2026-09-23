import { useCallback, useEffect, useMemo, useReducer, useRef, useState } from "react";
import { SyntheticTicketExperience } from "./capabilities/tickets/SyntheticTicketExperience";
import { TicketCanvasPanel } from "./capabilities/tickets/TicketCanvasPanel";
import { composeWorkspaceFixtureWithSyntheticTickets, createInitialSyntheticTicket, isSyntheticTicketThread } from "./capabilities/tickets/ticket-fixtures";
import { useSyntheticTicketRuntime } from "./capabilities/tickets/ticket-runtime";
import { CanvasPanel } from "./features/canvas/CanvasPanel";
import { useSyntheticReceiptDelay } from "./features/cards/card-runtime";
import { WorkspaceHome } from "./features/workbench/WorkspaceHome";
import { ActivityTimeline } from "./features/timeline/ActivityTimeline";
import { createWorkspaceRuntime, workspaceRuntimeReducer } from "./features/threads/workspace-runtime";
import { ThreadSelector } from "./features/threads/ThreadSelector";
import { getWorkspaceFixture, type WorkspaceScenario, WORKSPACE_SCENARIOS } from "./fixtures/workspace-fixtures";

function scenarioFromLocation(): WorkspaceScenario {
  const requested = new URLSearchParams(window.location.search).get("scenario");
  return WORKSPACE_SCENARIOS.includes(requested as WorkspaceScenario) ? requested as WorkspaceScenario : "normal";
}

function StateView({ scenario, message }: { scenario: WorkspaceScenario; message: string }) {
  const label = scenario === "empty" ? "空状态" : scenario === "loading" ? "加载状态" : scenario === "error" ? "演示错误状态" : "演示权限状态";
  return <section aria-label={label} className={`state-view state-${scenario}`}><span className="state-kicker">演示场景</span><h2>{message}</h2><p>{scenario === "loading" ? "此界面没有数据请求，展示仅用于校验加载布局。" : scenario === "error" ? "这是可复现的展示状态，不代表系统故障。" : scenario === "permission-denied" ? "身份、授权和范围检查将在后续服务切片提供。" : "选择其他空间或切换场景以查看壳层布局。"}</p></section>;
}

export function App({ initialScenario }: { initialScenario?: WorkspaceScenario }) {
  const [threadActive, setThreadActive] = useState(false);
  const threadHeadingRef = useRef<HTMLHeadingElement>(null);
  const threadContainerRef = useRef<HTMLDivElement>(null);
  const canvasTriggerIndex = useRef(-1);
  const [scenario, setScenario] = useState<WorkspaceScenario>(initialScenario ?? scenarioFromLocation());
  const baseFixture = useMemo(() => getWorkspaceFixture(scenario), [scenario]);
  const fixture = useMemo(() => composeWorkspaceFixtureWithSyntheticTickets(baseFixture), [baseFixture]);
  const threadVisible = threadActive && scenario === "normal";
  const [runtime, dispatch] = useReducer(workspaceRuntimeReducer, fixture, createWorkspaceRuntime);
  const onHome = useCallback(() => { setThreadActive(false); dispatch({ type: "select-thread", threadId: "" }); }, []);
  const initialTicket = useMemo(() => createInitialSyntheticTicket(), []);
  const ticketRuntime = useSyntheticTicketRuntime(initialTicket, scenario, runtime.selectedThreadId ?? "no-thread");
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
    const trigger = previousTrigger?.isConnected ? previousTrigger : threadContainerRef.current?.querySelectorAll<HTMLButtonElement>(".context-pane .canvas-route-list button").item(canvasTriggerIndex.current);
    trigger?.focus();
    canvasTriggerRef.current = trigger ?? null;
  }, [runtime.activeCanvasRoute]);
  useEffect(() => {
    if (!threadVisible) return;
    const closeOnEscape = (event: globalThis.KeyboardEvent) => { if (event.key === "Escape") runtime.activeCanvasRoute ? closeCanvas() : runtime.isPanelOpen && dispatch({ type: "toggle-panel" }); };
    window.addEventListener("keydown", closeOnEscape);
    return () => window.removeEventListener("keydown", closeOnEscape);
  }, [closeCanvas, runtime.activeCanvasRoute, runtime.isPanelOpen, threadVisible]);

  useEffect(() => { if (threadVisible) threadHeadingRef.current?.focus(); }, [runtime.selectedThreadId, threadVisible]);

  const selectedSpace = fixture.spaces.find((space) => space.id === runtime.selectedSpaceId) ?? fixture.spaces[0];
  const visibleThreads = fixture.threads.filter((thread) => thread.parentSpaceId === runtime.selectedSpaceId);
  const selectedThread = visibleThreads.find((thread) => thread.id === runtime.selectedThreadId) ?? visibleThreads[0] ?? null;
  const selectedTicketThread = selectedThread !== null && isSyntheticTicketThread(selectedThread);
  const activities = selectedThread ? [...selectedThread.activities, ...runtime.receiptActivities.filter((activity) => Object.values(runtime.receipts).some((receipt) => receipt.commandId === activity.sourceId && receipt.threadId === selectedThread.id))] : [];
  const openCanvas = (route: string, trigger: HTMLButtonElement) => { canvasTriggerRef.current = trigger; canvasTriggerIndex.current = Array.from(threadContainerRef.current?.querySelectorAll<HTMLButtonElement>(".context-pane .canvas-route-list button") ?? []).indexOf(trigger); dispatch({ type: "open-canvas", route }); };
  const submitAction = (actionId: string) => { if (!selectedThread) return; const cardActivity = selectedThread.activities.find((activity) => activity.kind === "card" && activity.card.actions.some((action) => action.actionId === actionId)); const card = cardActivity?.kind === "card" ? cardActivity.card : undefined; const action = card?.actions.find((entry) => entry.actionId === actionId); if (action) dispatch({ type: "submit-action", action, threadId: selectedThread.id }); };
  const ticketView = <SyntheticTicketExperience currentReceipt={ticketRuntime.currentReceipt} onClearReceipt={ticketRuntime.clearReceipt} onPersonaChange={ticketRuntime.setPersona} onSubmit={ticketRuntime.submit} pending={ticketRuntime.pendingCommand !== null} persona={ticketRuntime.persona} receiptLedger={ticketRuntime.receiptLedger} ticket={ticketRuntime.ticket} />;
  const enterThread = (threadId: string) => {
    const thread = fixture.threads.find((entry) => entry.id === threadId);
    if (!thread) return;
    if (thread.parentSpaceId !== runtime.selectedSpaceId) dispatch({ type: "select-space", fixture, spaceId: thread.parentSpaceId });
    dispatch({ type: "select-thread", threadId });
    setThreadActive(true);
  };
  const scenarioControl = import.meta.env.DEV && <select aria-label="切换演示场景" className="scenario-select" onChange={(event) => setScenario(event.target.value as WorkspaceScenario)} value={scenario}>{WORKSPACE_SCENARIOS.map((entry) => <option key={entry} value={entry}>{entry}</option>)}</select>;
  return <WorkspaceHome exceptionalState={<StateView message={fixture.stateMessage} scenario={scenario} />} fixture={fixture} onHome={onHome} onThread={enterThread} scenarioControl={scenarioControl} threadActive={threadActive} ticket={ticketRuntime.ticket}><div className={`wb-thread-layout ${runtime.isPanelOpen ? "wb-with-context" : ""}`} ref={threadContainerRef}><main className="timeline-pane"><div className="timeline-header"><div><p className="eyebrow">{selectedSpace?.label ?? "Workspace"}</p><h1 ref={threadHeadingRef} tabIndex={-1}>{selectedThread?.title ?? fixture.stateMessage}</h1><p className="thread-subtitle">{selectedThread?.subtitle}</p></div><button aria-expanded={runtime.isPanelOpen} aria-label={runtime.isPanelOpen ? "关闭 Context 与 Canvas 面板" : "打开 Context 与 Canvas 面板"} className="panel-toggle" onClick={() => dispatch({ type: "toggle-panel" })} type="button">{runtime.isPanelOpen ? "收起上下文" : "打开上下文"}</button></div>{selectedThread && <><ThreadSelector onSelect={(threadId) => dispatch({ type: "select-thread", threadId })} selectedThreadId={selectedThread.id} threads={visibleThreads} />{selectedTicketThread ? ticketView : <><ActivityTimeline activities={activities} onOpenCanvas={openCanvas} onRefreshConflict={(actionId) => dispatch({ type: "refresh-conflict", actionId })} onSubmit={submitAction} receipts={runtime.receipts} /><section aria-label="演示说明" className="summary-note"><span className="summary-symbol">i</span><div><strong>演示摘要</strong><p>此运行时只呈现确定性本地界面状态；没有后端、持久化、医院系统连接或权威业务完成。</p></div></section></>}</>}</main>{runtime.isPanelOpen && (selectedTicketThread ? <TicketCanvasPanel onClose={closeCanvas} onOpenRoute={openCanvas} route={runtime.activeCanvasRoute} ticket={ticketRuntime.ticket} /> : <CanvasPanel onClose={closeCanvas} onOpenRoute={openCanvas} route={runtime.activeCanvasRoute} thread={selectedThread} />)}</div></WorkspaceHome>;
}
