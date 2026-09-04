import { useRef } from "react";
import type { SyntheticTicket, SyntheticTicketPersona, SyntheticTicketReceipt } from "./ticket-model";
import { projectSyntheticTicket } from "./ticket-projection";
import { createSyntheticTicketCommand } from "./ticket-runtime";
import { nextTransitionFor } from "./ticket-transition-table";

/** Browser-only, public-synthetic, noncanonical, non-authoritative command presentation. */
export function TicketLifecycleCard({ ticket, persona, receipt, receiptLedger, pending, onSubmit, onClearReceipt }: {
  ticket: SyntheticTicket;
  persona: SyntheticTicketPersona;
  receipt?: SyntheticTicketReceipt;
  receiptLedger: readonly SyntheticTicketReceipt[];
  pending: boolean;
  onSubmit: (command: ReturnType<typeof createSyntheticTicketCommand>) => void;
  onClearReceipt: () => void;
}) {
  const actionRef = useRef<HTMLButtonElement>(null);
  const next = nextTransitionFor(ticket.status);
  const projection = projectSyntheticTicket(ticket);
  const isRequiredPersona = next?.actor === persona;
  const attempt = receiptLedger.length + 1;
  const submit = () => next && !pending && isRequiredPersona && onSubmit(createSyntheticTicketCommand(ticket, next.commandType, persona, ticket.version, attempt));
  const simulateConflict = () => next && onSubmit(createSyntheticTicketCommand(ticket, next.commandType, persona, ticket.version - 1, attempt));
  return <section aria-label="本地合成生命周期动作" className="ticket-lifecycle-card"><div><p className="ticket-kicker">下一步本地演示动作</p>{!next && <h3>演示生命周期已停留在重新打开状态</h3>}</div><dl className="ticket-command-details"><div><dt>当前状态</dt><dd>{projection.statusLabel}</dd></div><div><dt>需要角色</dt><dd>{next?.actor === "reporter" ? "Synthetic Reporter" : next?.actor === "engineer" ? "Demo IT Engineer" : "—"}</dd></div><div><dt>期望版本</dt><dd>v{ticket.version}</dd></div></dl>{next && <><button aria-describedby={!isRequiredPersona ? "ticket-role-explanation" : undefined} className="ticket-command" ref={actionRef} aria-disabled={pending || !isRequiredPersona} onClick={submit} type="button">{pending ? "等待本地合成回执" : next.actionLabel}</button>{!isRequiredPersona && <p id="ticket-role-explanation" className="ticket-role-explanation">当前演示角色只能查看；请切换到 {next.actor === "reporter" ? "Synthetic Reporter" : "Demo IT Engineer"} 继续本地展示。</p>}<button className="ticket-simulation-control" disabled={pending || !isRequiredPersona} onClick={simulateConflict} type="button">模拟版本冲突</button></>}{receipt && <ReceiptNotice receipt={receipt} onClear={() => { onClearReceipt(); actionRef.current?.focus(); }} />}</section>;
}

function ReceiptNotice({ receipt, onClear }: { receipt: SyntheticTicketReceipt; onClear: () => void }) {
  const stateLabel = receipt.state === "pending" ? "正在等待本地合成回执" : receipt.state === "accepted" ? "合成命令回执已接受" : receipt.state === "conflict" ? "本地演示版本需要刷新" : "本地合成命令未被接受";
  return <div aria-busy={receipt.state === "pending" || undefined} aria-live="polite" className={`ticket-receipt ${receipt.state}`}><strong>{stateLabel}</strong><p>{receipt.reason}</p>{receipt.state === "conflict" && <p>期望版本 v{receipt.expectedVersion}；当前演示版本 v{receipt.observedVersion}。</p>}{(receipt.state === "conflict" || receipt.state === "rejected") && <button onClick={onClear} type="button">刷新本地演示上下文</button>}{receipt.state === "accepted" && <p>这不表示业务完成、数据保存或任何外部状态变化。</p>}</div>;
}
