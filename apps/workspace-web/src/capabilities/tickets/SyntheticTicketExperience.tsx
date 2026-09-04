import type { SyntheticTicket, SyntheticTicketPersona, SyntheticTicketReceipt } from "./ticket-model";
import { SYNTHETIC_TICKET_STATUSES } from "./ticket-model";
import { projectSyntheticTicket, SYNTHETIC_TICKET_STATUS_LABELS } from "./ticket-projection";
import type { createSyntheticTicketCommand } from "./ticket-runtime";
import { TicketLifecycleCard } from "./TicketLifecycleCard";
import { TicketPersonaSwitcher } from "./TicketPersonaSwitcher";
import { TicketTimeline } from "./TicketTimeline";
import "./ticket.css";

/** Browser-only, public-synthetic, noncanonical, non-authoritative Ticket workspace presentation. */
export function SyntheticTicketExperience({ ticket, persona, receiptLedger, currentReceipt, pending, onPersonaChange, onSubmit, onClearReceipt }: {
  ticket: SyntheticTicket;
  persona: SyntheticTicketPersona;
  receiptLedger: readonly SyntheticTicketReceipt[];
  currentReceipt?: SyntheticTicketReceipt;
  pending: boolean;
  onPersonaChange: (persona: SyntheticTicketPersona) => void;
  onSubmit: (command: ReturnType<typeof createSyntheticTicketCommand>) => void;
  onClearReceipt: () => void;
}) {
  const projection = projectSyntheticTicket(ticket);
  return <section aria-label="Synthetic Ticket experience" className="synthetic-ticket-experience">
    <header className="ticket-header"><p className="ticket-kicker">PUBLIC-SYNTHETIC · 非生产原型 · Asia/Shanghai</p><dl aria-label="合成工单状态"><div><dt>Ticket</dt><dd>{ticket.id}</dd></div><div><dt>当前状态 · 演示版本</dt><dd role="status">{projection.statusLabel} · v{ticket.version}</dd></div><div><dt>演示角色</dt><dd>{persona === "reporter" ? "Synthetic Reporter" : "Demo IT Engineer"}</dd></div></dl></header>
    <p className="ticket-boundary">此状态仅存在于浏览器运行时，不代表权威业务、保存结果或医院流程。</p>
    <section aria-label="本地队列投影" className="ticket-queue"><span>我的报修 <b>{persona === "reporter" ? "1" : "0"}</b></span><span>待接单 <b>{ticket.status === "triaged" || ticket.status === "assigned" ? "1" : "0"}</b></span><span>处理中 <b>{ticket.status === "accepted" || ticket.status === "in_progress" || ticket.status === "reopened" ? "1" : "0"}</b></span><span>已完成 <b>{ticket.status === "closed" ? "1" : "0"}</b></span></section>
    <ol aria-label="Ticket 生命周期进度" className="ticket-progress">{SYNTHETIC_TICKET_STATUSES.map((status) => { const index = SYNTHETIC_TICKET_STATUSES.indexOf(status); const currentIndex = SYNTHETIC_TICKET_STATUSES.indexOf(ticket.status); const phase = index < currentIndex ? "已完成" : ticket.status === status ? "当前步骤" : "后续步骤"; return <li aria-current={ticket.status === status ? "step" : undefined} aria-label={`${SYNTHETIC_TICKET_STATUS_LABELS[status]}：${phase}`} className={index < currentIndex ? "complete" : ticket.status === status ? "current" : "future"} key={status}><span>{phase} · {SYNTHETIC_TICKET_STATUS_LABELS[status]}</span></li>; })}</ol>
    <TicketPersonaSwitcher onChange={onPersonaChange} persona={persona} />
    <TicketLifecycleCard onClearReceipt={onClearReceipt} onSubmit={onSubmit} pending={pending} persona={persona} receipt={currentReceipt} receiptLedger={receiptLedger} ticket={ticket} />
    <section aria-label="Ticket 支持摘要" className="ticket-support-summary"><div><span>当前表面责任</span><strong>{projection.responsibility}</strong></div><div><span>为何可见</span><strong>作为 IT Support 内的一项公开合成演示</strong></div><div><span>下一角色</span><strong>{projection.nextPersona === "reporter" ? "Synthetic Reporter" : projection.nextPersona === "engineer" ? "Demo IT Engineer" : "无"}</strong></div><div><span>当前演示 SLA</span><strong>{projection.sla.presentationState}</strong></div></section>
    <TicketTimeline receiptLedger={receiptLedger} ticket={ticket} />
  </section>;
}
