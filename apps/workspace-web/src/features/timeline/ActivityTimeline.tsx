import { StructuredCard } from "../cards/StructuredCard";
import type { PrototypeReceipt } from "../threads/workspace-runtime";
import type { PrototypeActivity } from "./activity-model";
import "./timeline.css";

const labels: Record<string, string> = { user: "协作消息", system: "状态投影", agent: "Agent 提案或更新", decision: "人工判断", card: "结构化卡片", error: "冲突或错误" };

export function ActivityTimeline({ activities, receipts, onOpenCanvas, onSubmit, onRefreshConflict }: {
  activities: readonly PrototypeActivity[];
  receipts: Readonly<Record<string, PrototypeReceipt>>;
  onOpenCanvas: (route: string, trigger: HTMLButtonElement) => void;
  onSubmit: (actionId: string) => void;
  onRefreshConflict: (actionId: string) => void;
}) {
  return <section aria-label="活动时间线" className="activity-timeline"><div className="timeline-label"><span>Activity</span><span>固定演示记录 · 无实时连接</span></div>{activities.map((activity) => {
    const label = labels[activity.kind] ?? "未支持的合成活动";
    return <article className={`activity-row ${labels[activity.kind] ? activity.kind : "unknown"}`} key={activity.id}><div aria-hidden="true" className={`activity-pin ${labels[activity.kind] ? activity.kind : "unknown"}`} /><div className="activity-main"><div className="activity-meta"><span>{label}</span><time>{activity.recordedAt}</time></div><div className="activity-actor"><span>发起者</span><strong>{activity.actor}</strong></div><h3>{activity.title}</h3><p>{activity.detail}</p>{activity.kind === "agent" && <p className="activity-note">这是 Agent 提案或更新，不是领域完成。</p>}{activity.kind === "decision" && <p className="activity-note">人类判断保持权威。</p>}{activity.kind === "error" && <p className="activity-note">恢复路径：刷新本地演示上下文后重试。</p>}{activity.kind === "card" && <StructuredCard card={activity.card} onOpenCanvas={onOpenCanvas} onRefreshConflict={onRefreshConflict} onSubmit={onSubmit} receiptStatus={(actionId) => receipts[actionId]?.status ?? "ready"} />}<small>来源：{activity.sourceKind} · {activity.sourceId}{activity.correlationRef ? ` · ${activity.correlationRef}` : ""}</small></div></article>;
  })}</section>;
}
