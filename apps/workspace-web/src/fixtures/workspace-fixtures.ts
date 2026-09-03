/** Public-synthetic, deterministic presentation fixtures for MVP-01. */

export const WORKSPACE_SCENARIOS = [
  "normal",
  "empty",
  "loading",
  "error",
  "permission-denied",
] as const;

export type WorkspaceScenario = (typeof WORKSPACE_SCENARIOS)[number];

export type FixtureIcon = "home" | "wrench" | "receipt" | "spark" | "book";

export interface WorkspaceSpace {
  id: `demo-space-${string}`;
  name: string;
  description: string;
  icon: FixtureIcon;
  countLabel: string;
  unreadCount: number;
}

export interface WorkspaceParticipant {
  id: `synthetic-user-${string}`;
  displayName: string;
  role: string;
  initials: string;
}

export type ActivityKind = "user" | "system" | "assignment" | "progress" | "summary";

export interface WorkspaceActivity {
  id: `demo-activity-${string}`;
  kind: ActivityKind;
  actor: string;
  title: string;
  detail: string;
  occurredAt: string;
}

export interface WorkspaceThread {
  id: `demo-thread-${string}`;
  spaceId: WorkspaceSpace["id"];
  title: string;
  subtitle: string;
  status: "in-progress" | "review" | "ready";
  priority: "normal" | "high";
  participants: WorkspaceParticipant[];
  activities: WorkspaceActivity[];
  references: string[];
}

export interface WorkspaceFixture {
  scenario: WorkspaceScenario;
  organizationLabel: string;
  campusLabel: string;
  userLabel: string;
  connectionLabel: string;
  privacyLabel: string;
  spaces: readonly WorkspaceSpace[];
  threads: readonly WorkspaceThread[];
  stateMessage: string;
}

const spaces: readonly WorkspaceSpace[] = [
  { id: "demo-space-my-work", name: "My Work", description: "待处理的协作事项", icon: "home", countLabel: "3 项待跟进", unreadCount: 2 },
  { id: "demo-space-it-support", name: "IT Support", description: "工作台与设备协作", icon: "wrench", countLabel: "2 个事项", unreadCount: 1 },
  { id: "demo-space-fee-confirmation", name: "Fee Confirmation", description: "费用信息整理与确认", icon: "receipt", countLabel: "1 个事项", unreadCount: 0 },
  { id: "demo-space-agent-collaboration", name: "Agent Collaboration", description: "可追溯的 Agent 工作", icon: "spark", countLabel: "2 个运行", unreadCount: 1 },
  { id: "demo-space-knowledge-work", name: "Knowledge Work", description: "知识整理与评审", icon: "book", countLabel: "4 个草稿", unreadCount: 0 },
];

const participants: readonly WorkspaceParticipant[] = [
  { id: "synthetic-user-001", displayName: "Synthetic User", role: "协作发起人", initials: "SU" },
  { id: "synthetic-user-002", displayName: "Demo Coordinator", role: "协调角色（演示）", initials: "DC" },
  { id: "synthetic-user-003", displayName: "Review Partner", role: "评审角色（演示）", initials: "RP" },
];

const threads: readonly WorkspaceThread[] = [
  {
    id: "demo-thread-workboard", spaceId: "demo-space-my-work", title: "本周协作事项整理", subtitle: "把待跟进事项收拢到一个清晰的工作节奏", status: "in-progress", priority: "high", participants: [participants[0], participants[1]], references: ["demo-ref-weekly-rhythm", "demo-ref-work-context"],
    activities: [
      { id: "demo-activity-work-01", kind: "user", actor: "Synthetic User", title: "发起了事项整理", detail: "希望确认本周仍需关注的协作事项。", occurredAt: "2026-09-03 09:10" },
      { id: "demo-activity-work-02", kind: "system", actor: "Workspace", title: "已建立演示线程", detail: "这是本地合成内容，不代表任何真实业务状态。", occurredAt: "2026-09-03 09:11" },
      { id: "demo-activity-work-03", kind: "assignment", actor: "Demo Coordinator", title: "分配给协作角色（演示）", detail: "下一步：整理现有背景并提出待确认问题。", occurredAt: "2026-09-03 09:14" },
      { id: "demo-activity-work-04", kind: "progress", actor: "Demo Coordinator", title: "更新了进度说明", detail: "背景梳理已推进，等待人工确认优先级。", occurredAt: "2026-09-03 09:21" },
      { id: "demo-activity-work-05", kind: "summary", actor: "Workspace", title: "演示摘要", detail: "当前仅展示界面信息；没有命令执行、持久化或实时同步。", occurredAt: "2026-09-03 09:22" },
    ],
  },
  { id: "demo-thread-handoff", spaceId: "demo-space-my-work", title: "交接前的背景核对", subtitle: "确认信息是否足够清晰", status: "review", priority: "normal", participants: [participants[0], participants[2]], references: ["demo-ref-handoff-notes"], activities: [{ id: "demo-activity-handoff-01", kind: "user", actor: "Synthetic User", title: "补充了背景", detail: "请在演示环境中核对上下文是否完整。", occurredAt: "2026-09-02 16:40" }, { id: "demo-activity-handoff-02", kind: "summary", actor: "Workspace", title: "等待人工评审", detail: "此处没有可提交或完成的业务操作。", occurredAt: "2026-09-02 16:42" }] },
  { id: "demo-thread-device", spaceId: "demo-space-it-support", title: "共享工作台准备", subtitle: "记录一项合成的工作台准备事项", status: "in-progress", priority: "normal", participants: [participants[1], participants[2]], references: ["demo-ref-setup-checklist"], activities: [{ id: "demo-activity-device-01", kind: "system", actor: "Workspace", title: "已载入演示事项", detail: "内容用于展示协作结构，不连接设备或服务。", occurredAt: "2026-09-03 08:30" }, { id: "demo-activity-device-02", kind: "progress", actor: "Review Partner", title: "留下进度备注", detail: "等待后续切片提供确定性动作。", occurredAt: "2026-09-03 08:35" }] },
  { id: "demo-thread-fee", spaceId: "demo-space-fee-confirmation", title: "费用说明整理（演示）", subtitle: "把待确认信息放在同一上下文中", status: "review", priority: "normal", participants: [participants[0], participants[2]], references: ["demo-ref-fee-example"], activities: [{ id: "demo-activity-fee-01", kind: "user", actor: "Synthetic User", title: "提交了说明草稿", detail: "这里没有金额、账单或真实费用数据。", occurredAt: "2026-09-03 08:05" }, { id: "demo-activity-fee-02", kind: "summary", actor: "Workspace", title: "等待人工确认", detail: "费用领域的确定性流程不属于 MVP-01。", occurredAt: "2026-09-03 08:07" }] },
  { id: "demo-thread-agent", spaceId: "demo-space-agent-collaboration", title: "资料整理 Agent 运行", subtitle: "查看一个可追溯的合成运行摘要", status: "ready", priority: "normal", participants: [participants[1], participants[2]], references: ["demo-ref-agent-run"], activities: [{ id: "demo-activity-agent-01", kind: "system", actor: "Workspace", title: "运行已准备（演示）", detail: "没有模型调用、网络请求或工具执行。", occurredAt: "2026-09-02 14:20" }, { id: "demo-activity-agent-02", kind: "summary", actor: "Workspace", title: "摘要可供查看", detail: "任何模型文字都不会改变业务状态。", occurredAt: "2026-09-02 14:21" }] },
  { id: "demo-thread-knowledge", spaceId: "demo-space-knowledge-work", title: "知识条目结构草稿", subtitle: "通过来源与状态保持内容可追溯", status: "review", priority: "normal", participants: [participants[0], participants[2]], references: ["demo-ref-knowledge-draft"], activities: [{ id: "demo-activity-knowledge-01", kind: "user", actor: "Synthetic User", title: "准备了结构草稿", detail: "这是公开演示文本，不是临床或治理知识。", occurredAt: "2026-09-01 11:15" }, { id: "demo-activity-knowledge-02", kind: "summary", actor: "Workspace", title: "保留来源提示", detail: "正式知识状态需要人工评审与专属服务。", occurredAt: "2026-09-01 11:17" }] },
];

export function getWorkspaceFixture(scenario: WorkspaceScenario = "normal"): WorkspaceFixture {
  const stateMessage = scenario === "normal" ? "本地演示数据" : scenario === "empty" ? "当前没有可显示的演示事项" : scenario === "loading" ? "正在准备演示内容" : scenario === "error" ? "演示内容暂时不可用" : "当前演示身份没有查看权限";
  return { scenario, organizationLabel: "Example Hospital · Demo Campus", campusLabel: "Synthetic Workspace", userLabel: "Synthetic User", connectionLabel: "本地演示模式", privacyLabel: "隐私状态 · 演示", spaces, threads: scenario === "normal" ? threads : [], stateMessage };
}

export const workspaceFixture = getWorkspaceFixture();
