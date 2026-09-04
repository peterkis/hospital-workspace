import { useEffect, useRef } from "react";
import type { SyntheticTicket } from "./ticket-model";
import { projectSyntheticTicket, SYNTHETIC_TICKET_STATUS_LABELS } from "./ticket-projection";

export const TICKET_CANVAS_ROUTES = ["ticket-overview", "ticket-lifecycle", "ticket-participants", "ticket-attachment", "ticket-sla"] as const;
/** Browser-only, public-synthetic, noncanonical, non-authoritative fixed section identifier. */
type TicketCanvasRoute = (typeof TICKET_CANVAS_ROUTES)[number];

/** Browser-only, public-synthetic, noncanonical, non-authoritative registered Canvas views. */
export function TicketCanvasPanel({ ticket, route, onClose, onOpenRoute }: { ticket: SyntheticTicket; route: string | null; onClose: () => void; onOpenRoute: (route: TicketCanvasRoute, trigger: HTMLButtonElement) => void }) {
  const headingRef = useRef<HTMLHeadingElement>(null);
  useEffect(() => { if (route) headingRef.current?.focus(); }, [route]);
  const selectedRoute = TICKET_CANVAS_ROUTES.includes(route as TicketCanvasRoute) ? route as TicketCanvasRoute : null;
  return <aside aria-label="Context 与 Canvas" className="context-pane ticket-canvas"><div className="context-heading"><div><p className="eyebrow">Ticket Context / Canvas</p><h2 ref={headingRef} tabIndex={-1}>{selectedRoute ? "Ticket Canvas 详情" : "Ticket 上下文"}</h2></div><span className="demo-badge">SYNTHETIC</span></div>{selectedRoute ? <><button aria-label="关闭 Ticket Canvas 详情" className="canvas-close" onClick={onClose} type="button">返回 Ticket 上下文</button><TicketCanvasView route={selectedRoute} ticket={ticket} /></> : <TicketCanvasIndex onOpenRoute={onOpenRoute} ticket={ticket} />}</aside>;
}

function TicketCanvasIndex({ ticket, onOpenRoute }: { ticket: SyntheticTicket; onOpenRoute: (route: TicketCanvasRoute, trigger: HTMLButtonElement) => void }) {
  const projection = projectSyntheticTicket(ticket);
  return <><section className="context-block"><p className="context-label">当前演示状态</p><p><strong>{projection.statusLabel} · v{ticket.version}</strong></p><p className="context-boundary">固定 public-synthetic Ticket；状态仅存在于浏览器运行时。</p></section><section className="context-block"><p className="context-label">Ticket Canvas</p><div className="canvas-route-list">{[
    ["ticket-overview", "查看 Ticket 概览"], ["ticket-lifecycle", "查看生命周期记录"], ["ticket-participants", "查看合成参与者"], ["ticket-attachment", "查看附件参考"], ["ticket-sla", "查看演示 SLA"],
  ].map(([entryRoute, label]) => <button key={entryRoute} onClick={(event) => onOpenRoute(entryRoute as TicketCanvasRoute, event.currentTarget)} type="button">{label}</button>)}</div></section></>;
}

function TicketCanvasView({ ticket, route }: { ticket: SyntheticTicket; route: TicketCanvasRoute }) {
  const projection = projectSyntheticTicket(ticket);
  if (route === "ticket-overview") return <section aria-label="Ticket 概览" className="canvas-view"><p>合成 Ticket ID：{ticket.id}</p><p>{ticket.title}</p><p>{ticket.description}</p><p>状态：{projection.statusLabel} · v{ticket.version}</p><p>当前表面责任：{projection.responsibility}</p><p>这是公开合成、非权威浏览器展示。</p></section>;
  if (route === "ticket-lifecycle") return <section aria-label="Ticket 生命周期" className="canvas-view"><ol>{ticket.events.map((event) => <li key={event.eventId}>{event.recordedAt} · {event.actor === "reporter" ? "Synthetic Reporter" : "Demo IT Engineer"} · {event.priorStatus ? `${SYNTHETIC_TICKET_STATUS_LABELS[event.priorStatus]} → ` : ""}{SYNTHETIC_TICKET_STATUS_LABELS[event.resultingStatus]} · v{event.resultingVersion}</li>)}</ol></section>;
  if (route === "ticket-participants") return <section aria-label="Ticket 合成参与者" className="canvas-view"><ul>{projection.participants.map((participant) => <li key={participant.id}><strong>{participant.displayName}</strong> · {participant.participationLabel} · 加入于 {participant.joinedAt}</li>)}</ul><p>参与者是演示标签，不声明真实身份。</p><h3>参与变化</h3><ul>{ticket.events.map((event) => <li key={event.eventId}>{event.recordedAt} · {event.detail}</li>)}</ul></section>;
  if (route === "ticket-attachment") return <section aria-label="Ticket 附件参考" className="canvas-view"><p>安全引用：{ticket.attachments[0]?.assetRef}</p><p>{ticket.attachments[0]?.displayName} · {ticket.attachments[0]?.mimeLabel} · {ticket.attachments[0]?.sizeLabel}</p><p>{ticket.attachments[0]?.presentationState}；公开合成引用，未上传实际文件，没有字节、下载或预览。</p></section>;
  return <section aria-label="Ticket 演示 SLA" className="canvas-view"><p>{projection.sla.marker}</p><p>{projection.sla.responseTargetLabel}</p><p>{projection.sla.resolutionTargetLabel}</p><p>{projection.sla.presentationState}</p><p>{projection.sla.remainingOrElapsedLabel}</p><p>非生产 SLA，不进行真实计时。</p></section>;
}
