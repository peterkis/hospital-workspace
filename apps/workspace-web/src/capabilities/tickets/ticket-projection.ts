import type { SyntheticTicket, SyntheticTicketParticipant, SyntheticTicketPersona, SyntheticTicketStatus } from "./ticket-model";
import { nextTransitionFor } from "./ticket-transition-table";
import type { PrototypeActivity } from "../../features/timeline/activity-model";
import type { SyntheticTicketReceipt } from "./ticket-model";

export const SYNTHETIC_TICKET_STATUS_LABELS: Readonly<Record<SyntheticTicketStatus, string>> = {
  draft: "草稿", submitted: "已提交（演示）", triaged: "已分诊（演示）", assigned: "已分派（演示）", accepted: "已接受（演示）", in_progress: "处理中（演示）", resolved: "等待确认（演示）", closed: "已关闭（演示）", reopened: "已重新打开（演示）",
};

export function participantsForTicket(ticket: SyntheticTicket): readonly SyntheticTicketParticipant[] {
  const engineer = ticket.assignedEngineer;
  if (!engineer) return [{ ...ticket.reporter, participationLabel: "申报人（演示）", involvement: "reporting" }];
  if (ticket.status === "assigned") return [ticket.reporter, { ...engineer, participationLabel: "已分派工程师（演示）", involvement: "assigned" }];
  if (ticket.status === "accepted" || ticket.status === "in_progress") return [ticket.reporter, { ...engineer, participationLabel: "处理中工程师（演示）", involvement: "active" }];
  if (ticket.status === "resolved") return [{ ...ticket.reporter, participationLabel: "等待确认的申报人（演示）", involvement: "awaiting-confirmation" }, { ...engineer, participationLabel: "已提供解决说明（演示）", involvement: "complete" }];
  if (ticket.status === "closed") return [{ ...ticket.reporter, participationLabel: "已确认申报人（演示）", involvement: "complete" }, { ...engineer, participationLabel: "已完成工程师（演示）", involvement: "complete" }];
  return [{ ...ticket.reporter, participationLabel: "重新申报人（演示）", involvement: "reporting" }, { ...engineer, participationLabel: "下一响应工程师（演示）", involvement: "next-response" }];
}

export function projectSyntheticTicket(ticket: SyntheticTicket) {
  const next = nextTransitionFor(ticket.status);
  const nextPersona = ticket.status === "closed" ? undefined : ticket.status === "reopened" ? "engineer" : next?.actor;
  return {
    statusLabel: SYNTHETIC_TICKET_STATUS_LABELS[ticket.status],
    participants: participantsForTicket(ticket),
    sla: ticket.sla,
    nextAction: next?.actionLabel ?? "演示生命周期已停留在重新打开状态",
    nextPersona: nextPersona as SyntheticTicketPersona | undefined,
    responsibility: ticket.status === "resolved" ? "Synthetic Reporter（等待演示确认）" : ticket.status === "closed" ? "没有待处理演示角色" : next?.actor === "reporter" ? "Synthetic Reporter" : "Demo IT Engineer",
  };
}

export function ticketTimelineActivities(ticket: SyntheticTicket, receipts: readonly SyntheticTicketReceipt[]): PrototypeActivity[] {
  const actorLabel = (actor: SyntheticTicketPersona) => actor === "reporter" ? "Synthetic Reporter" : "Demo IT Engineer";
  const eventActivity = (event: SyntheticTicket["events"][number]): PrototypeActivity => ({
    id: `demo-activity-${event.eventId}`, kind: "system", actor: actorLabel(event.actor),
    title: `${event.priorStatus ? `${SYNTHETIC_TICKET_STATUS_LABELS[event.priorStatus]} → ` : ""}${SYNTHETIC_TICKET_STATUS_LABELS[event.resultingStatus]}`,
    detail: `${event.eventType} · v${event.resultingVersion} · ${event.detail ?? ""}`,
    recordedAt: event.recordedAt, sourceKind: event.sourceKind, sourceId: event.sourceId,
  });
  const rows: PrototypeActivity[] = ticket.events.filter((event) => !receipts.some((receipt) => receipt.commandId === event.sourceId)).map(eventActivity);
  for (const attachment of ticket.attachments) rows.push({
    id: `demo-activity-${attachment.assetRef}`, kind: "system", actor: actorLabel("reporter"),
    title: "记录了合成附件参考", detail: `attachment.reference · 状态未改变。${attachment.displayName} · ${attachment.presentationState}；未上传实际文件，没有字节或下载。`,
    recordedAt: ticket.createdAt, sourceKind: "fixture", sourceId: attachment.assetRef,
  });
  for (const receipt of receipts) {
    const event = ticket.events.find((entry) => entry.sourceId === receipt.commandId);
    if (event) rows.push(eventActivity(event));
    rows.push({
      id: `demo-activity-receipt-${receipt.commandId}`, kind: receipt.state === "rejected" || receipt.state === "conflict" ? "error" : "system", actor: actorLabel(receipt.actor),
      title: receipt.state === "accepted" ? "合成命令回执已接受" : receipt.state === "conflict" ? "合成版本冲突" : receipt.state === "rejected" ? "合成命令已拒绝" : "等待合成命令回执",
      detail: `command.receipt.${receipt.state} · ${receipt.resultingStatus ? SYNTHETIC_TICKET_STATUS_LABELS[receipt.resultingStatus] : `${SYNTHETIC_TICKET_STATUS_LABELS[receipt.priorStatus]}，状态未改变`}。${receipt.reason}`,
      recordedAt: receipt.recordedAt, sourceKind: "synthetic-command", sourceId: receipt.commandId, correlationRef: receipt.idempotencyKey,
    });
  }
  return rows.sort((a, b) => a.recordedAt < b.recordedAt ? -1 : a.recordedAt > b.recordedAt ? 1 : 0);
}
