import { SYNTHETIC_TICKET_TIMESTAMPS } from "./ticket-fixtures";
import type { SyntheticTicketCommandType, SyntheticTicketPersona, SyntheticTicketStatus } from "./ticket-model";

/** Browser-only, public-synthetic, noncanonical, non-authoritative lifecycle transition definitions. */
export interface SyntheticTicketTransition {
  from: SyntheticTicketStatus;
  commandType: SyntheticTicketCommandType;
  actor: SyntheticTicketPersona;
  to: SyntheticTicketStatus;
  actionLabel: string;
  recordedAt: string;
  detail: string;
}

export const SYNTHETIC_TICKET_TRANSITIONS: readonly SyntheticTicketTransition[] = [
  { from: "draft", commandType: "submit", actor: "reporter", to: "submitted", actionLabel: "提交本地合成报修", recordedAt: SYNTHETIC_TICKET_TIMESTAMPS.submitted, detail: "申报人已进入演示提交后的等待分诊状态；参与者仍为申报人。" },
  { from: "submitted", commandType: "triage", actor: "engineer", to: "triaged", actionLabel: "分诊本地合成报修", recordedAt: SYNTHETIC_TICKET_TIMESTAMPS.triaged, detail: "演示工程师完成本地分诊展示，等待演示接单。" },
  { from: "triaged", commandType: "assign", actor: "engineer", to: "assigned", actionLabel: "接入演示工程师", recordedAt: SYNTHETIC_TICKET_TIMESTAMPS.assigned, detail: "演示工程师成为已分派参与者；这是浏览器内展示。" },
  { from: "assigned", commandType: "accept", actor: "engineer", to: "accepted", actionLabel: "接受演示分派", recordedAt: SYNTHETIC_TICKET_TIMESTAMPS.accepted, detail: "演示工程师接受本地分派；解决目标改为演示 4 小时。" },
  { from: "accepted", commandType: "start_progress", actor: "engineer", to: "in_progress", actionLabel: "开始本地合成处理", recordedAt: SYNTHETIC_TICKET_TIMESTAMPS.in_progress, detail: "演示工程师进入本地处理展示状态；没有真实业务执行。" },
  { from: "in_progress", commandType: "resolve", actor: "engineer", to: "resolved", actionLabel: "标记演示解决", recordedAt: SYNTHETIC_TICKET_TIMESTAMPS.resolved, detail: "等待申报人确认；此处不表示任何真实工单已完成。" },
  { from: "resolved", commandType: "confirm_close", actor: "reporter", to: "closed", actionLabel: "确认本地合成关闭", recordedAt: SYNTHETIC_TICKET_TIMESTAMPS.closed, detail: "申报人确认演示展示结束；没有正式关闭任何真实工单。" },
  { from: "closed", commandType: "reopen", actor: "reporter", to: "reopened", actionLabel: "重新打开本地合成展示", recordedAt: SYNTHETIC_TICKET_TIMESTAMPS.reopened, detail: "申报人重新打开演示状态；演示工程师成为下一响应角色。" },
];

export function transitionFor(status: SyntheticTicketStatus, commandType: SyntheticTicketCommandType, actor: SyntheticTicketPersona) {
  return SYNTHETIC_TICKET_TRANSITIONS.find((transition) => transition.from === status && transition.commandType === commandType && transition.actor === actor);
}

export function nextTransitionFor(status: SyntheticTicketStatus) {
  return SYNTHETIC_TICKET_TRANSITIONS.find((transition) => transition.from === status);
}
