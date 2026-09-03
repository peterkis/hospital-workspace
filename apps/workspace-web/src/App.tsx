import { type KeyboardEvent, useEffect, useMemo, useState } from "react";
import {
  getWorkspaceFixture,
  type FixtureIcon,
  type WorkspaceScenario,
  type WorkspaceSpace,
  type WorkspaceThread,
  WORKSPACE_SCENARIOS,
} from "./fixtures/workspace-fixtures";

const primaryNavigation = [
  ["home", "Home"],
  ["work", "My Work"],
  ["messages", "Messages"],
  ["decisions", "Decisions"],
  ["agents", "Agent Runs"],
  ["knowledge", "Knowledge"],
] as const;

type PrimaryNavigationId = (typeof primaryNavigation)[number][0];

function scenarioFromLocation(): WorkspaceScenario {
  const requested = new URLSearchParams(window.location.search).get("scenario");
  return WORKSPACE_SCENARIOS.includes(requested as WorkspaceScenario) ? (requested as WorkspaceScenario) : "normal";
}

function Glyph({ name, size = 18 }: { name: string; size?: number }) {
  const common = { fill: "none", stroke: "currentColor", strokeLinecap: "round" as const, strokeLinejoin: "round" as const, strokeWidth: 1.8 };
  const paths: Record<string, React.ReactNode> = {
    home: <><path {...common} d="m3 10 9-7 9 7v10H3z" /><path {...common} d="M9 20v-6h6v6" /></>,
    work: <><rect {...common} x="4" y="4" width="16" height="16" rx="3" /><path {...common} d="m8 12 2.5 2.5L16 9" /></>,
    messages: <><path {...common} d="M4 5h16v11H8l-4 3z" /><path {...common} d="M8 9h8M8 12h5" /></>,
    decisions: <><path {...common} d="M12 3 4 7v5c0 5 3.4 8 8 9 4.6-1 8-4 8-9V7z" /><path {...common} d="m9 12 2 2 4-4" /></>,
    agents: <><rect {...common} x="5" y="5" width="14" height="14" rx="4" /><path {...common} d="M9 12h6M12 9v6M12 2v3M12 19v3M2 12h3M19 12h3" /></>,
    knowledge: <><path {...common} d="M5 4.5A3.5 3.5 0 0 1 8.5 4H12v15H8.5A3.5 3.5 0 0 0 5 20zM19 4.5A3.5 3.5 0 0 0 15.5 4H12v15h3.5A3.5 3.5 0 0 1 19 20z" /></>,
    wrench: <><path {...common} d="M14 6a4 4 0 0 0-5 5L4 16l4 4 5-5a4 4 0 0 0 5-5l-3 2-3-3z" /></>,
    receipt: <><path {...common} d="M6 3h12v18l-3-2-3 2-3-2-3 2z" /><path {...common} d="M9 8h6M9 12h6M9 16h3" /></>,
    spark: <><path {...common} d="m12 2 1.5 6.5L20 10l-6.5 1.5L12 18l-1.5-6.5L4 10l6.5-1.5z" /></>,
    book: <><path {...common} d="M5 4h9a3 3 0 0 1 3 3v13H8a3 3 0 0 0-3 3z" /><path {...common} d="M5 4v16" /></>,
    search: <><circle {...common} cx="10.5" cy="10.5" r="5.5" /><path {...common} d="m15 15 4.5 4.5" /></>,
    panel: <><rect {...common} x="3" y="4" width="18" height="16" rx="2" /><path {...common} d="M14 4v16" /></>,
    close: <><path {...common} d="m6 6 12 12M18 6 6 18" /></>,
    chevron: <path {...common} d="m8 10 4 4 4-4" />,
  };
  return <svg aria-hidden="true" className="glyph" height={size} viewBox="0 0 24 24" width={size}>{paths[name] ?? paths.home}</svg>;
}

function SpaceIcon({ icon }: { icon: FixtureIcon }) {
  return <Glyph name={icon} size={17} />;
}

function statusText(thread: WorkspaceThread) {
  return thread.status === "in-progress" ? "进行中（演示）" : thread.status === "review" ? "等待评审（演示）" : "已就绪（演示）";
}

function activityLabel(kind: WorkspaceThread["activities"][number]["kind"]) {
  return kind === "user" ? "协作" : kind === "system" ? "状态" : kind === "assignment" ? "分派" : kind === "progress" ? "进展" : "摘要";
}

function StateView({ scenario, message }: { scenario: WorkspaceScenario; message: string }) {
  const label = scenario === "empty" ? "空状态" : scenario === "loading" ? "加载状态" : scenario === "error" ? "演示错误状态" : "演示权限状态";
  return (
    <section aria-label={label} className={`state-view state-${scenario}`}>
      <span className="state-kicker">演示场景</span>
      <h2>{message}</h2>
      <p>{scenario === "loading" ? "此界面没有数据请求，展示仅用于校验加载布局。" : scenario === "error" ? "这是可复现的展示状态，不代表系统故障。" : scenario === "permission-denied" ? "身份、授权和范围检查将在后续服务切片提供。" : "选择其他空间或切换场景以查看壳层布局。"}</p>
    </section>
  );
}

export function App({ initialScenario }: { initialScenario?: WorkspaceScenario }) {
  const [scenario, setScenario] = useState<WorkspaceScenario>(initialScenario ?? scenarioFromLocation());
  const fixture = useMemo(() => getWorkspaceFixture(scenario), [scenario]);
  const [activePrimary, setActivePrimary] = useState<PrimaryNavigationId>("home");
  const [selectedSpaceId, setSelectedSpaceId] = useState(fixture.spaces[0].id);
  const [selectedThreadId, setSelectedThreadId] = useState<string | null>(fixture.threads[0]?.id ?? null);
  const [isPanelOpen, setPanelOpen] = useState(true);

  useEffect(() => {
    setSelectedSpaceId(fixture.spaces[0].id);
    setSelectedThreadId(fixture.threads[0]?.id ?? null);
  }, [fixture]);

  useEffect(() => {
    const closeOnEscape = (event: globalThis.KeyboardEvent) => {
      if (event.key === "Escape") setPanelOpen(false);
    };
    window.addEventListener("keydown", closeOnEscape);
    return () => window.removeEventListener("keydown", closeOnEscape);
  }, []);

  const selectedSpace = fixture.spaces.find((space) => space.id === selectedSpaceId) ?? fixture.spaces[0];
  const visibleThreads = fixture.threads.filter((thread) => thread.spaceId === selectedSpaceId);
  const selectedThread = visibleThreads.find((thread) => thread.id === selectedThreadId) ?? visibleThreads[0] ?? null;

  function selectSpace(space: WorkspaceSpace) {
    setSelectedSpaceId(space.id);
    setSelectedThreadId(fixture.threads.find((thread) => thread.spaceId === space.id)?.id ?? null);
  }

  function selectThread(thread: WorkspaceThread) {
    setSelectedThreadId(thread.id);
  }

  function onScenarioChange(value: WorkspaceScenario) {
    setScenario(value);
  }

  function handleThreadKeyDown(event: KeyboardEvent<HTMLButtonElement>, thread: WorkspaceThread) {
    if (event.key === "Enter" || event.key === " ") {
      event.preventDefault();
      selectThread(thread);
    }
  }

  return (
    <div className="workspace-shell">
      <header className="workspace-header">
        <div className="identity-lockup">
          <span className="mark" aria-hidden="true"><span /></span>
          <div>
            <p className="eyebrow">{fixture.organizationLabel}</p>
            <h1>Hospital Workspace</h1>
          </div>
        </div>
        <label className="global-search">
          <span className="sr-only">全局搜索（仅演示）</span>
          <Glyph name="search" size={16} />
          <input aria-label="全局搜索（仅演示）" placeholder="搜索空间、事项或上下文" type="search" />
          <kbd>⌘ K</kbd>
        </label>
        <div className="header-status" aria-label="演示状态">
          <span className="status-dot" aria-hidden="true" />
          <span>{fixture.connectionLabel}</span>
          <span className="privacy-chip">{fixture.privacyLabel}</span>
          <button aria-label="合成用户菜单（MVP-01 中不可用）" className="user-menu" disabled title="MVP-01 不提供身份菜单或认证功能" type="button">{fixture.userLabel}<Glyph name="chevron" size={15} /></button>
        </div>
      </header>

      <div className={`workspace-grid ${isPanelOpen ? "panel-open" : "panel-closed"}`}>
        <nav aria-label="主要导航" className="primary-rail">
          <div className="rail-rule" />
          {primaryNavigation.map(([id, label]) => (
            <button aria-current={activePrimary === id ? "page" : undefined} aria-label={label} className={activePrimary === id ? "rail-item active" : "rail-item"} key={id} onClick={() => setActivePrimary(id)} type="button">
              <Glyph name={id} size={19} />
              <span>{label}</span>
            </button>
          ))}
          <div className="rail-footnote">MVP-01<br />演示壳层</div>
        </nav>

        <aside aria-label="能力空间" className="space-pane">
          <div className="pane-heading">
            <div>
              <p className="eyebrow">Capabilities</p>
              <h2>{activePrimary === "home" ? "空间" : primaryNavigation.find(([id]) => id === activePrimary)?.[1]}</h2>
            </div>
            {import.meta.env.DEV && <select aria-label="切换演示场景" className="scenario-select" onChange={(event) => onScenarioChange(event.target.value as WorkspaceScenario)} value={scenario}>
              {WORKSPACE_SCENARIOS.map((entry) => <option key={entry} value={entry}>{entry}</option>)}
            </select>}
          </div>
          <div className="space-list">
            {fixture.spaces.map((space) => (
              <button aria-pressed={selectedSpaceId === space.id} className={selectedSpaceId === space.id ? "space-item selected" : "space-item"} key={space.id} onClick={() => selectSpace(space)} type="button">
                <span className="space-icon"><SpaceIcon icon={space.icon} /></span>
                <span className="space-copy"><strong>{space.name}</strong><small>{space.description}</small></span>
                <span className="space-count" aria-label={`${space.unreadCount} 条演示未读`}>{space.countLabel}</span>
              </button>
            ))}
          </div>
          <p className="pane-disclaimer">所有计数和内容均为固定合成演示数据，不代表实时工作项。</p>
        </aside>

        <main className="timeline-pane">
          <div className="timeline-header">
            <div>
              <p className="eyebrow">{selectedSpace?.name ?? "Workspace"}</p>
              <h2>{selectedThread?.title ?? fixture.stateMessage}</h2>
              <p className="thread-subtitle">{selectedThread?.subtitle ?? "展示空间、线程和上下文之间的关系。"}</p>
            </div>
            <button aria-expanded={isPanelOpen} aria-label={isPanelOpen ? "关闭 Context 与 Canvas 面板" : "打开 Context 与 Canvas 面板"} className="panel-toggle" onClick={() => setPanelOpen((open) => !open)} type="button">
              <Glyph name={isPanelOpen ? "close" : "panel"} size={17} />
              <span>{isPanelOpen ? "收起上下文" : "打开上下文"}</span>
            </button>
          </div>
          {scenario === "normal" && selectedThread ? (
            <>
              <div aria-label="演示线程列表" className="thread-strip">
                {visibleThreads.map((thread) => (
                  <button aria-pressed={thread.id === selectedThread.id} className={thread.id === selectedThread.id ? "thread-tab selected" : "thread-tab"} key={thread.id} onClick={() => selectThread(thread)} onKeyDown={(event) => handleThreadKeyDown(event, thread)} type="button">
                    <span>{thread.title}</span><small>{statusText(thread)}</small>
                  </button>
                ))}
              </div>
              <section aria-label="活动时间线" className="activity-timeline">
                <div className="timeline-label"><span>Activity</span><span>固定演示记录 · 无实时连接</span></div>
                {selectedThread.activities.map((activity) => (
                  <article className="activity-row" key={activity.id}>
                    <div aria-hidden="true" className={`activity-pin ${activity.kind}`} />
                    <div className="activity-main">
                      <div className="activity-meta"><span>{activityLabel(activity.kind)}</span><time>{activity.occurredAt}</time></div>
                      <h3>{activity.title}</h3>
                      <p>{activity.detail}</p>
                      <small>{activity.actor}</small>
                    </div>
                  </article>
                ))}
              </section>
              <section aria-label="演示说明" className="summary-note">
                <span className="summary-symbol">i</span>
                <div><strong>演示摘要</strong><p>此壳层只呈现固定界面状态；没有业务命令、完成动作、持久化或医院系统连接。</p></div>
              </section>
            </>
          ) : <StateView message={fixture.stateMessage} scenario={scenario} />}
        </main>

        {isPanelOpen && (
          <aside aria-label="Context 与 Canvas" className="context-pane">
            <div className="context-heading"><div><p className="eyebrow">Context / Canvas</p><h2>当前上下文</h2></div><span className="demo-badge">SYNTHETIC</span></div>
            {selectedThread ? <>
              <section className="context-block"><p className="context-label">状态与优先级</p><div className="status-pairs"><span><b>{statusText(selectedThread)}</b><small>仅演示标签</small></span><span><b>{selectedThread.priority === "high" ? "高优先级（演示）" : "常规优先级（演示）"}</b><small>不触发任何升级</small></span></div></section>
              <section className="context-block"><p className="context-label">参与者</p><ul className="people-list">{selectedThread.participants.map((participant) => <li key={participant.id}><span className="avatar">{participant.initials}</span><span><b>{participant.displayName}</b><small>{participant.role}</small></span></li>)}</ul></section>
              <section className="context-block"><p className="context-label">最近引用</p><ul className="reference-list">{selectedThread.references.map((reference) => <li key={reference}><span>↗</span>{reference}</li>)}</ul></section>
            </> : <p className="context-empty">选择一个演示线程后，这里会显示其合成上下文。</p>}
            <section className="canvas-placeholder"><div className="canvas-grid" aria-hidden="true" /><p className="context-label">Canvas</p><h3>详细表单与确定性动作将在后续 MVP 切片提供</h3><p>此处不保存数据，也不代表任何权威医院状态。</p><button disabled title="MVP-01 演示中尚不可用" type="button">演示中不可操作</button></section>
          </aside>
        )}
      </div>
    </div>
  );
}
