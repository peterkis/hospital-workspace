/** Public-synthetic, deterministic presentation fixtures for MVP-02. */

import type { PrototypeCardAction, PrototypeCardEnvelope, PrototypeCommandReceiptState } from "../features/cards/card-model";
import type { PrototypeCanvasRoute } from "../features/canvas/canvas-model";
import type { PrototypeParticipant, PrototypeThread, PrototypeWorkItemProjection } from "../features/threads/thread-model";
import type { PrototypeActivity } from "../features/timeline/activity-model";
import type { PrototypeSpace } from "../features/spaces/space-model";

export type { PrototypeCardAction, PrototypeCardEnvelope, PrototypeCommandReceiptState } from "../features/cards/card-model";
export type { PrototypeCanvasRoute } from "../features/canvas/canvas-model";
export type { PrototypeParticipant, PrototypeThread, PrototypeWorkItemProjection } from "../features/threads/thread-model";
export type { PrototypeActivity } from "../features/timeline/activity-model";
export type { PrototypeSpace } from "../features/spaces/space-model";

export const WORKSPACE_SCENARIOS = [
  "normal",
  "empty",
  "loading",
  "error",
  "permission-denied",
] as const;

export type WorkspaceScenario = (typeof WORKSPACE_SCENARIOS)[number];

export type FixtureIcon = PrototypeSpace["iconKey"];
export type WorkspaceSpace = PrototypeSpace;
export type WorkspaceParticipant = PrototypeParticipant;
export type ActivityKind = PrototypeActivity["kind"];
export type WorkspaceActivity = PrototypeActivity;
export type WorkspaceThread = PrototypeThread;

export interface WorkspaceFixture {
  scenario: WorkspaceScenario;
  organizationLabel: string;
  campusLabel: string;
  userLabel: string;
  connectionLabel: string;
  privacyLabel: string;
  spaces: readonly PrototypeSpace[];
  threads: readonly PrototypeThread[];
  stateMessage: string;
}

const spaces: readonly WorkspaceSpace[] = [
  { id: "demo-space-my-work", label: "My Work", description: "待处理的协作事项", iconKey: "home", presentationCount: "3 项待跟进", unreadPresentationCount: 2 },
  { id: "demo-space-it-support", label: "IT Support", description: "工作台与设备协作", iconKey: "wrench", presentationCount: "2 个事项", unreadPresentationCount: 1 },
  { id: "demo-space-fee-confirmation", label: "Fee Confirmation", description: "费用信息整理与确认", iconKey: "receipt", presentationCount: "1 个事项", unreadPresentationCount: 0 },
  { id: "demo-space-agent-collaboration", label: "Agent Collaboration", description: "可追溯的 Agent 工作", iconKey: "spark", presentationCount: "2 个运行", unreadPresentationCount: 1 },
  { id: "demo-space-knowledge-work", label: "Knowledge Work", description: "知识整理与评审", iconKey: "book", presentationCount: "4 个草稿", unreadPresentationCount: 0 },
];

const participants: readonly WorkspaceParticipant[] = [
  { id: "synthetic-user-001", displayName: "Synthetic User", role: "协作发起人", initials: "SU" },
  { id: "synthetic-user-002", displayName: "Demo Coordinator", role: "协调角色（演示）", initials: "DC" },
  { id: "synthetic-user-003", displayName: "Review Partner", role: "评审角色（演示）", initials: "RP" },
];

type WithoutRequiredProvenance<Activity> = Activity extends PrototypeActivity
  ? Omit<Activity, "sourceKind" | "sourceId"> & Partial<Pick<Activity, "sourceKind" | "sourceId">>
  : never;
type ActivitySeed = WithoutRequiredProvenance<PrototypeActivity>;
type ThreadSeed = Omit<PrototypeThread, "activities" | "activityReferences" | "contextReferences"> & {
  activities: readonly ActivitySeed[];
  references: readonly string[];
};

const threads: readonly ThreadSeed[] = [
  {
    id: "demo-thread-workboard", parentSpaceId: "demo-space-my-work", title: "本周协作事项整理", subtitle: "把待跟进事项收拢到一个清晰的工作节奏", projectedDisplayStatus: "in-progress", priority: "high", participants: [participants[0], participants[1]], references: ["demo-ref-weekly-rhythm", "demo-ref-work-context"],
    activities: [
      { id: "demo-activity-work-01", kind: "user", actor: "Synthetic User", title: "发起了事项整理", detail: "希望确认本周仍需关注的协作事项。", recordedAt: "2026-09-03 09:10" },
      { id: "demo-activity-work-02", kind: "system", actor: "Workspace", title: "已建立演示线程", detail: "这是本地合成内容，不代表任何真实业务状态。", recordedAt: "2026-09-03 09:11" },
      { id: "demo-activity-work-03", kind: "system", actor: "Demo Coordinator", title: "分配给协作角色（演示）", detail: "下一步：整理现有背景并提出待确认问题。", recordedAt: "2026-09-03 09:14" },
      { id: "demo-activity-work-04", kind: "system", actor: "Demo Coordinator", title: "更新了进度说明", detail: "背景梳理已推进，等待人工确认优先级。", recordedAt: "2026-09-03 09:21" },
      { id: "demo-activity-work-05", kind: "system", actor: "Workspace", title: "演示摘要", detail: "当前仅展示界面信息；没有命令执行、持久化或实时同步。", recordedAt: "2026-09-03 09:22" },
    ],
  },
  { id: "demo-thread-handoff", parentSpaceId: "demo-space-my-work", title: "交接前的背景核对", subtitle: "确认信息是否足够清晰", projectedDisplayStatus: "review", priority: "normal", participants: [participants[0], participants[2]], references: ["demo-ref-handoff-notes"], activities: [{ id: "demo-activity-handoff-01", kind: "user", actor: "Synthetic User", title: "补充了背景", detail: "请在演示环境中核对上下文是否完整。", recordedAt: "2026-09-02 16:40" }, { id: "demo-activity-handoff-02", kind: "system", actor: "Workspace", title: "等待人工评审", detail: "此处没有可提交或完成的业务操作。", recordedAt: "2026-09-02 16:42" }] },
  { id: "demo-thread-device", parentSpaceId: "demo-space-it-support", title: "共享工作台准备", subtitle: "记录一项合成的工作台准备事项", projectedDisplayStatus: "in-progress", priority: "normal", participants: [participants[1], participants[2]], references: ["demo-ref-setup-checklist"], activities: [{ id: "demo-activity-device-01", kind: "system", actor: "Workspace", title: "已载入演示事项", detail: "内容用于展示协作结构，不连接设备或服务。", recordedAt: "2026-09-03 08:30" }, { id: "demo-activity-device-02", kind: "system", actor: "Review Partner", title: "留下进度备注", detail: "等待后续切片提供确定性动作。", recordedAt: "2026-09-03 08:35" }] },
  { id: "demo-thread-fee", parentSpaceId: "demo-space-fee-confirmation", title: "费用说明整理（演示）", subtitle: "把待确认信息放在同一上下文中", projectedDisplayStatus: "review", priority: "normal", participants: [participants[0], participants[2]], references: ["demo-ref-fee-example"], activities: [{ id: "demo-activity-fee-01", kind: "user", actor: "Synthetic User", title: "提交了说明草稿", detail: "这里没有金额、账单或真实费用数据。", recordedAt: "2026-09-03 08:05" }, { id: "demo-activity-fee-02", kind: "system", actor: "Workspace", title: "等待人工确认", detail: "费用领域的确定性流程不属于 MVP-02。", recordedAt: "2026-09-03 08:07" }] },
  { id: "demo-thread-agent", parentSpaceId: "demo-space-agent-collaboration", title: "资料整理 Agent 运行", subtitle: "查看一个可追溯的合成运行摘要", projectedDisplayStatus: "ready", priority: "normal", participants: [participants[1], participants[2]], references: ["demo-ref-agent-run"], activities: [{ id: "demo-activity-agent-01", kind: "system", actor: "Workspace", title: "运行已准备（演示）", detail: "没有模型调用、网络请求或工具执行。", recordedAt: "2026-09-02 14:20" }, { id: "demo-activity-agent-02", kind: "system", actor: "Workspace", title: "摘要可供查看", detail: "任何模型文字都不会改变业务状态。", recordedAt: "2026-09-02 14:21" }] },
  { id: "demo-thread-knowledge", parentSpaceId: "demo-space-knowledge-work", title: "知识条目结构草稿", subtitle: "通过来源与状态保持内容可追溯", projectedDisplayStatus: "review", priority: "normal", participants: [participants[0], participants[2]], references: ["demo-ref-knowledge-draft"], activities: [{ id: "demo-activity-knowledge-01", kind: "user", actor: "Synthetic User", title: "准备了结构草稿", detail: "这是公开演示文本，不是临床或治理知识。", recordedAt: "2026-09-01 11:15" }, { id: "demo-activity-knowledge-02", kind: "system", actor: "Workspace", title: "保留来源提示", detail: "正式知识状态需要人工评审与专属服务。", recordedAt: "2026-09-01 11:17" }] },
];

const workItemCard: PrototypeCardEnvelope = {
  cardId: "demo-card-work-item-summary",
  cardType: "work-item-summary",
  cardVersion: 1,
  title: "本周协作事项摘要",
  presentationStatus: "ready",
  sensitivity: "public-synthetic",
  fields: { projectedStatus: "待跟进", responsible: "Demo Coordinator", nextAction: "整理背景并确认优先级", priority: "high", due: "演示截止 · 2026-09-05", expectedVersion: "3" },
  actions: [{ actionId: "synthetic-action-work-accept", label: "接受演示分派", commandType: "work-item.accept-demo", commandId: "synthetic-command-work-accept", idempotencyKey: "synthetic-idempotency-work-accept", expectedVersion: 3, syntheticOutcome: "accepted" }],
  canvasRoute: "work-item-detail",
};

const decisionCard: PrototypeCardEnvelope = {
  cardId: "demo-card-decision-request",
  cardType: "decision-request",
  cardVersion: 1,
  title: "需要确认协作优先级",
  presentationStatus: "review",
  sensitivity: "public-synthetic",
  fields: { question: "先整理哪一项演示背景？", requester: "Demo Coordinator", options: "背景摘要 / 事项分组", decisionState: "等待人工判断", expectedVersion: "4" },
  actions: [{ actionId: "synthetic-action-decision-choose", label: "提交演示选择", commandType: "decision.choose-demo", commandId: "synthetic-command-decision-choose", idempotencyKey: "synthetic-idempotency-decision-choose", expectedVersion: 4, syntheticOutcome: "conflict" }],
  canvasRoute: "decision-context",
};

const agentCard: PrototypeCardEnvelope = {
  cardId: "demo-card-agent-run-summary",
  cardType: "agent-run-summary",
  cardVersion: 1,
  title: "资料整理 Agent 运行摘要",
  presentationStatus: "proposal",
  sensitivity: "public-synthetic",
  fields: { role: "资料整理 Agent（演示）", goal: "整理公开演示背景", proposal: "建议按主题分组", limitations: "没有模型调用、网络或工具执行", status: "仅供查看" },
  actions: [],
  canvasRoute: "agent-run-detail",
};

const unknownCard: PrototypeCardEnvelope = {
  cardId: "demo-card-unknown-v9",
  cardType: "future-demo-card",
  cardVersion: 9,
  title: "未支持的演示卡片",
  presentationStatus: "unsupported",
  sensitivity: "public-synthetic",
  fields: {},
  actions: [],
};

function enrichActivities(activityList: readonly ActivitySeed[]): PrototypeActivity[] {
  return activityList.map((activity) => ({
    ...activity,
    sourceKind: activity.sourceKind ?? "fixture",
    sourceId: activity.sourceId ?? activity.id,
  })) as PrototypeActivity[];
}

const enrichedThreads: readonly WorkspaceThread[] = threads.map((thread) => {
  const activityExtras: ActivitySeed[] = [];
  if (thread.id === "demo-thread-workboard") activityExtras.push({ id: "demo-activity-work-card", kind: "card", actor: "Workspace", title: workItemCard.title, detail: "结构化演示对象；本地动作可产生合成回执。", recordedAt: "2026-09-03 09:23", card: workItemCard });
  if (thread.id === "demo-thread-handoff") {
    activityExtras.push({ id: "demo-activity-decision-request", kind: "decision", actor: "Demo Coordinator", title: "提出一个待人工判断的问题", detail: "人类判断仍是权威；选择会在演示中遇到版本冲突。", recordedAt: "2026-09-03 09:23" });
    activityExtras.push({ id: "demo-activity-decision-card", kind: "card", actor: "Demo Coordinator", title: decisionCard.title, detail: "人类判断仍是权威；版本冲突需要刷新演示上下文。", recordedAt: "2026-09-03 09:24", card: decisionCard });
    activityExtras.push({ id: "demo-activity-decision-conflict", kind: "error", actor: "Workspace", title: "演示版本冲突", detail: "当前上下文较旧；请刷新合成上下文后再试。没有任何业务状态被改变。", recordedAt: "2026-09-03 09:25" });
  }
  if (thread.id === "demo-thread-agent") {
    activityExtras.push({ id: "demo-activity-agent-update", kind: "agent", actor: "资料整理 Agent（演示）", title: "提出了一个整理建议", detail: "这是 Agent proposal；需要人工判断，不代表业务完成。", recordedAt: "2026-09-02 14:22" });
    activityExtras.push({ id: "demo-activity-agent-card", kind: "card", actor: "Workspace", title: agentCard.title, detail: "Agent 提案不代表业务完成。", recordedAt: "2026-09-02 14:23", card: agentCard });
  }
  if (thread.id === "demo-thread-knowledge") activityExtras.push({ id: "demo-activity-unknown-card", kind: "card", actor: "Workspace", title: unknownCard.title, detail: "此卡片类型或版本尚未注册，保持只读。", recordedAt: "2026-09-01 11:18", card: unknownCard });
  const activities = enrichActivities([...thread.activities, ...activityExtras]);
  return {
    ...thread,
    activities,
    activityReferences: activities.map((activity) => activity.id),
    contextReferences: thread.references,
    workItem: thread.id === "demo-thread-workboard" ? {
      responsibleParticipantId: "synthetic-user-002",
      visibilityReason: "该事项需要协作角色继续跟进",
      projectedStatus: "in-progress",
      dueLabel: "演示截止 · 2026-09-05",
      sourceReference: "demo-ref-work-context",
      version: 3,
    } : undefined,
  };
});

export function getWorkspaceFixture(scenario: WorkspaceScenario = "normal"): WorkspaceFixture {
  const stateMessage = scenario === "normal" ? "本地演示数据" : scenario === "empty" ? "当前没有可显示的演示事项" : scenario === "loading" ? "正在准备演示内容" : scenario === "error" ? "演示内容暂时不可用" : "当前演示身份没有查看权限";
  return { scenario, organizationLabel: "Example Hospital · Demo Campus", campusLabel: "Synthetic Workspace", userLabel: "Synthetic User", connectionLabel: "本地演示模式", privacyLabel: "隐私状态 · 演示", spaces, threads: scenario === "normal" ? enrichedThreads : [], stateMessage };
}

export const workspaceFixture = getWorkspaceFixture();
