/**
 * Browser-only, public-synthetic Ticket fixtures for MVP-03.
 *
 * These records are presentation data. They are noncanonical and
 * non-authoritative: no fixture is persisted or sent to a service.
 */
import type { WorkspaceFixture } from "../../fixtures/workspace-fixtures";
import type { PrototypeThread } from "../../features/threads/thread-model";
import type {
  SyntheticAttachmentRef,
  SyntheticSlaProjection,
  SyntheticTicket,
  SyntheticTicketEvent,
  SyntheticTicketParticipant,
} from "./ticket-model";

export const SYNTHETIC_TICKET_ID = "demo-ticket-workstation-output-001" as const;
export const SYNTHETIC_TICKET_THREAD_ID = "demo-thread-ticket-workstation-output" as const;

/** Fixed Asia/Shanghai display timestamps; this fixture has no clock dependency. */
export const SYNTHETIC_TICKET_TIMESTAMPS = {
  draft: "2026-09-04 09:00", submitted: "2026-09-04 09:01", triaged: "2026-09-04 09:03",
  assigned: "2026-09-04 09:05", accepted: "2026-09-04 09:07", in_progress: "2026-09-04 09:09",
  resolved: "2026-09-04 09:11", closed: "2026-09-04 09:13", reopened: "2026-09-04 09:15",
} as const;

export const SYNTHETIC_REPORTER: SyntheticTicketParticipant = {
  id: "synthetic-ticket-person-reporter-001",
  persona: "reporter",
  displayName: "Synthetic Reporter",
  participationLabel: "申报人（演示）",
  joinedAt: SYNTHETIC_TICKET_TIMESTAMPS.draft,
  involvement: "reporting",
};

export const SYNTHETIC_ENGINEER: SyntheticTicketParticipant = {
  id: "synthetic-ticket-person-engineer-001",
  persona: "engineer",
  displayName: "Demo IT Engineer",
  participationLabel: "IT 工程师（演示）",
  joinedAt: SYNTHETIC_TICKET_TIMESTAMPS.assigned,
  involvement: "assigned",
};

export const SYNTHETIC_ATTACHMENT: SyntheticAttachmentRef = {
  assetRef: "demo-asset-ticket-screenshot-001",
  displayName: "synthetic-workstation-screen.png",
  mimeLabel: "image/png（演示标签）",
  sizeLabel: "128 KB（演示标签）",
  presentationState: "合成安全检查已记录",
  sensitivity: "public-synthetic",
};

/** Fixed presentation values shared by the local reducer and views. */
export const SYNTHETIC_TICKET_SLA_BY_STATUS: Record<SyntheticTicket["status"], SyntheticSlaProjection> = {
  draft: { responseTargetLabel: "无", resolutionTargetLabel: "无", presentationState: "SLA 尚未开始（演示）", remainingOrElapsedLabel: "尚未开始", marker: "演示 SLA" },
  submitted: { responseTargetLabel: "首次响应目标：演示 15 分钟", resolutionTargetLabel: "演示 4 小时", presentationState: "等待首次响应（演示）", remainingOrElapsedLabel: "演示剩余 15 分钟", marker: "演示 SLA" },
  triaged: { responseTargetLabel: "首次响应目标：演示 15 分钟", resolutionTargetLabel: "演示 4 小时", presentationState: "等待接单（演示）", remainingOrElapsedLabel: "演示待接单", marker: "演示 SLA" },
  assigned: { responseTargetLabel: "首次响应目标：演示 15 分钟", resolutionTargetLabel: "演示 4 小时", presentationState: "等待接单（演示）", remainingOrElapsedLabel: "演示待接单", marker: "演示 SLA" },
  accepted: { responseTargetLabel: "演示 15 分钟", resolutionTargetLabel: "解决目标：演示 4 小时", presentationState: "已接单（演示）", remainingOrElapsedLabel: "演示剩余 4 小时", marker: "演示 SLA" },
  in_progress: { responseTargetLabel: "演示 15 分钟", resolutionTargetLabel: "解决目标：演示 4 小时", presentationState: "处理中（演示）", remainingOrElapsedLabel: "演示剩余 4 小时", marker: "演示 SLA" },
  resolved: { responseTargetLabel: "已完成响应（演示）", resolutionTargetLabel: "已达到解决目标（演示）", presentationState: "等待申报人确认（演示）", remainingOrElapsedLabel: "等待确认", marker: "演示 SLA" },
  closed: { responseTargetLabel: "已完成响应（演示）", resolutionTargetLabel: "已完成（演示）", presentationState: "合成 SLA 已结束", remainingOrElapsedLabel: "已结束", marker: "演示 SLA" },
  reopened: { responseTargetLabel: "重新响应目标：演示 15 分钟", resolutionTargetLabel: "重新解决目标：演示 4 小时", presentationState: "合成 SLA 已重新进入处理中提示", remainingOrElapsedLabel: "重新处理中", marker: "演示 SLA" },
};

export function slaForSyntheticTicketStatus(status: SyntheticTicket["status"]): SyntheticSlaProjection {
  return { ...SYNTHETIC_TICKET_SLA_BY_STATUS[status] };
}

function initialEvent(): SyntheticTicketEvent {
  return {
    eventId: "demo-ticket-event-draft-001",
    eventType: "draft_created",
    ticketId: SYNTHETIC_TICKET_ID,
    actor: "reporter",
    priorStatus: null,
    resultingStatus: "draft",
    resultingVersion: 1,
    recordedAt: SYNTHETIC_TICKET_TIMESTAMPS.draft,
    sourceKind: "fixture",
    sourceId: "demo-ticket-fixture-001",
    detail: "公开合成工单草稿已准备；附件仅为安全引用。",
  };
}

export function createInitialSyntheticTicket(): SyntheticTicket {
  return {
    id: SYNTHETIC_TICKET_ID,
    title: "演示工作站无法输出文档",
    description: "公开合成场景：工作站可打开文档，但没有输出结果。",
    status: "draft",
    version: 1,
    reporter: { ...SYNTHETIC_REPORTER },
    assignedEngineer: undefined,
    participants: [{ ...SYNTHETIC_REPORTER }],
    attachments: [{ ...SYNTHETIC_ATTACHMENT }],
    sla: { ...SYNTHETIC_TICKET_SLA_BY_STATUS.draft },
    events: [initialEvent()],
    createdAt: SYNTHETIC_TICKET_TIMESTAMPS.draft,
    lastUpdated: SYNTHETIC_TICKET_TIMESTAMPS.draft,
  };
}

function ticketThread(): PrototypeThread {
  return {
    id: SYNTHETIC_TICKET_THREAD_ID,
    parentSpaceId: "demo-space-it-support",
    title: "演示工作站无法输出文档",
    subtitle: "公开合成场景：工作站可打开文档，但没有输出结果。",
    projectedDisplayStatus: "review",
    priority: "normal",
    participants: [{ id: "synthetic-user-ticket-reporter-001", displayName: "Synthetic Reporter", role: "申报人（演示）", initials: "SR" }],
    activities: [{ id: "demo-activity-ticket-draft-001", kind: "system", actor: "Synthetic Reporter", title: "创建了合成报修草稿", detail: "此线程仅展示公开合成 Ticket；没有真实提交或持久化。", recordedAt: SYNTHETIC_TICKET_TIMESTAMPS.draft, sourceKind: "fixture", sourceId: "demo-ticket-event-draft-001" }],
    activityReferences: ["demo-activity-ticket-draft-001"],
    contextReferences: [SYNTHETIC_TICKET_ID, SYNTHETIC_ATTACHMENT.assetRef],
  };
}

export function isSyntheticTicketThread(thread: PrototypeThread): boolean {
  return thread.id === SYNTHETIC_TICKET_THREAD_ID;
}

export function composeWorkspaceFixtureWithSyntheticTickets(baseFixture: WorkspaceFixture): WorkspaceFixture {
  if (baseFixture.scenario !== "normal") return baseFixture;
  const ticket = ticketThread();
  const spaces = baseFixture.spaces.map((space) => space.id === "demo-space-it-support" ? { ...space, presentationCount: "3 个事项" } : { ...space });
  const threads = [ticket, ...baseFixture.threads.map((thread) => ({ ...thread, participants: [...thread.participants], activities: [...thread.activities], activityReferences: [...thread.activityReferences], contextReferences: [...thread.contextReferences] }))];
  return { ...baseFixture, spaces, threads };
}
