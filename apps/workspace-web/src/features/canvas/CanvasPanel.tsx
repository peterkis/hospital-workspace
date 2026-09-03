import { useEffect, useRef } from "react";
import { statusText } from "../threads/ThreadSelector";
import type { PrototypeThread } from "../threads/thread-model";
import { canvasRouteOptionsForThread, registeredCanvasView } from "./canvas-registry";
import "./canvas.css";

export function CanvasPanel({ thread, route, onClose, onOpenRoute }: { thread: PrototypeThread | null; route: string | null; onClose: () => void; onOpenRoute: (route: string, trigger: HTMLButtonElement) => void }) {
  const headingRef = useRef<HTMLHeadingElement>(null);
  useEffect(() => { if (route) headingRef.current?.focus(); }, [route]);
  if (!thread) return <aside aria-label="Context 与 Canvas" className="context-pane"><p className="context-empty">选择一个演示线程后，这里会显示其合成上下文。</p></aside>;
  const View = registeredCanvasView(route);
  return <aside aria-label="Context 与 Canvas" className="context-pane"><div className="context-heading"><div><p className="eyebrow">Context / Canvas</p><h2 ref={headingRef} tabIndex={-1}>{route ? "Canvas 详情" : "当前上下文"}</h2></div><span className="demo-badge">SYNTHETIC</span></div>{route && <button aria-label="关闭 Canvas 详情" className="canvas-close" onClick={onClose} type="button">返回上下文</button>}{!route && <DefaultContext onOpenRoute={onOpenRoute} thread={thread} />}{route && View && <section aria-label="已注册 Canvas 视图" className="canvas-view"><View thread={thread} /></section>}{route && !View && <section aria-label="Unsupported synthetic Canvas" className="canvas-view canvas-unsupported"><h3>未支持的合成 Canvas</h3><p>内部标识 {route} 尚未注册，保持只读且不会导航到其他位置。</p></section>}</aside>;
}

function DefaultContext({ thread, onOpenRoute }: { thread: PrototypeThread; onOpenRoute: (route: string, trigger: HTMLButtonElement) => void }) {
  const routeOptions = canvasRouteOptionsForThread(thread.id);
  return <><section className="context-block"><p className="context-label">状态与优先级</p><div className="status-pairs"><span><b>{statusText(thread)}</b><small>仅演示投影</small></span><span><b>{thread.priority === "high" ? "高优先级（演示）" : "常规优先级（演示）"}</b><small>不触发任何升级</small></span></div></section><section className="context-block"><p className="context-label">参与者</p><ul className="people-list">{thread.participants.map((participant) => <li key={participant.id}><span className="avatar">{participant.initials}</span><span><b>{participant.displayName}</b><small>{participant.role}</small></span></li>)}</ul></section><section className="context-block"><p className="context-label">来源与上下文引用</p><ul className="reference-list">{thread.contextReferences.map((reference) => <li key={reference}><span>↗</span>{reference}</li>)}</ul></section>{routeOptions.length > 0 && <section className="context-block"><p className="context-label">Canvas 视图</p><div className="canvas-route-list">{routeOptions.map((option) => <button key={option.route} onClick={(event) => onOpenRoute(option.route, event.currentTarget)} type="button">{option.label}</button>)}</div></section>}<p className="context-boundary">这里是固定 public-synthetic 上下文，不保存数据，也不代表权威医院状态。</p></>;
}
