import type { WorkspaceFixture } from "../../fixtures/workspace-fixtures";
import type { SyntheticTicket } from "../../capabilities/tickets/ticket-model";
import type { PrototypeThread } from "../threads/thread-model";
import { SYNTHETIC_TICKET_THREAD_ID } from "../../capabilities/tickets/ticket-fixtures";
import { projectSyntheticTicket } from "../../capabilities/tickets/ticket-projection";
import { statusText } from "../threads/ThreadSelector";

export const WORK_GROUPS = ["待处理", "处理中", "待确认", "已关闭"] as const;
export type WorkGroup = (typeof WORK_GROUPS)[number];
export interface WorkbenchItem {
  id: string;
  threadId: string | null;
  spaceId: string;
  title: string;
  description: string;
  statusLabel: string;
  group: WorkGroup;
  participants: string;
  mine: boolean;
  source: string;
  ticket: boolean;
}

export function spaceLabel(label: string) {
  switch (label) {
    case "My Work": return "协作事项";
    case "IT Support": return "信息支持";
    case "Fee Confirmation": return "费用确认";
    case "Agent Collaboration": return "Agent 协作";
    case "Knowledge Work": return "知识工作";
    default: return label;
  }
}

export function ticketGroup(status: SyntheticTicket["status"]): WorkGroup {
  switch (status) {
    case "closed": return "已关闭";
    case "resolved": return "待确认";
    case "draft":
    case "submitted":
    case "triaged": return "待处理";
    default: return "处理中";
  }
}

function threadGroup(status: PrototypeThread["projectedDisplayStatus"]): WorkGroup {
  switch (status) {
    case "in-progress": return "处理中";
    case "review": return "待确认";
    case "ready": return "待处理";
  }
}

function statusLabelForThread(thread: PrototypeThread, ticket: SyntheticTicket, isTicket: boolean) {
  if (isTicket) return `${projectSyntheticTicket(ticket).statusLabel} · v${ticket.version}`;
  const suffix = thread.parentSpaceId === "demo-space-agent-collaboration" ? " · Agent 未接入" : "";
  return `${statusText(thread)}${suffix}`;
}

/** Display-only grouping. Original status and source remain visible; no transition occurs here. */
export function projectWorkbench(fixture: WorkspaceFixture, ticket: SyntheticTicket): WorkbenchItem[] {
  return fixture.threads.map((thread) => {
    const isTicket = thread.id === SYNTHETIC_TICKET_THREAD_ID;
    return {
      id: isTicket ? ticket.id : thread.id,
      threadId: thread.id,
      spaceId: thread.parentSpaceId,
      title: isTicket ? ticket.title : thread.title,
      description: isTicket ? ticket.description : thread.subtitle,
      statusLabel: statusLabelForThread(thread, ticket, isTicket),
      group: isTicket ? ticketGroup(ticket.status) : threadGroup(thread.projectedDisplayStatus),
      participants: (isTicket ? ticket.participants : thread.participants).map((person) => person.displayName).join("、"),
      mine: isTicket || thread.participants.some((person) => person.id === "synthetic-user-001"),
      source: isTicket ? ticket.id : thread.workItem?.sourceReference ?? thread.id,
      ticket: isTicket,
    };
  });
}

export function filterWorkbench(items: readonly WorkbenchItem[], query: string, spaceId: string, mine: boolean) {
  const text = query.trim().toLocaleLowerCase();
  return items.filter((item) => (!spaceId || item.spaceId === spaceId) && (!mine || item.mine) && `${item.title} ${item.description}`.toLocaleLowerCase().includes(text));
}
