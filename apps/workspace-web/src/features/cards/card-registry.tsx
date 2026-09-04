import type { PrototypeCardEnvelope } from "./card-model";

export type CardRenderer = React.ComponentType<CardRendererProps>;

export interface CardRendererProps {
  card: PrototypeCardEnvelope;
  onOpenCanvas: (route: string, trigger: HTMLButtonElement) => void;
  onSubmit: (actionId: string) => void;
  receiptStatus: (actionId: string) => "ready" | "pending" | "accepted" | "rejected" | "conflict";
  onRefreshConflict: (actionId: string) => void;
}

function CardFields({ card, names }: { card: PrototypeCardEnvelope; names: readonly [string, string][] }) {
  return <dl className="card-fields">{names.map(([field, label]) => <div key={field}><dt>{label}</dt><dd>{card.fields[field] ?? "—"}</dd></div>)}</dl>;
}

function CardAction({ card, props }: { card: PrototypeCardEnvelope; props: CardRendererProps }) {
  const action = card.actions[0];
  if (!action) return null;
  const state = props.receiptStatus(action.actionId);
  const unavailable = state !== "ready";
  const actionStateLabel = state === "ready" ? "合成演示" : state === "pending" ? "等待合成回执" : `合成${state}回执`;
  return <><button aria-disabled={unavailable} className="card-command" onClick={() => { if (!unavailable) props.onSubmit(action.actionId); }} type="button">{action.label}（{actionStateLabel}）</button>{state === "pending" && <div aria-busy="true" aria-live="polite" className="card-receipt pending">正在等待合成回执；这不是网络延迟或业务完成。</div>}{state === "accepted" && <div aria-live="polite" className="card-receipt accepted">已获得 accepted synthetic receipt。它只表示本地模拟接受，领域事项尚未完成，仍需要真实领域事件。</div>}{state === "conflict" && <div aria-live="polite" className="card-receipt conflict">合成版本冲突：期望版本 {action.expectedVersion}，当前演示版本 {action.expectedVersion + 1}。需要刷新本地上下文。<button onClick={() => props.onRefreshConflict(action.actionId)} type="button">刷新演示上下文</button></div>}{state === "rejected" && <div aria-live="polite" className="card-receipt rejected">本地模拟回执已拒绝；未建立任何权威结果。</div>}</>;
}

function WorkItemSummary(props: CardRendererProps) {
  return <><CardFields card={props.card} names={[["projectedStatus", "投影状态"], ["responsible", "表面负责人"], ["nextAction", "下一步说明"], ["priority", "优先级"], ["due", "演示截止"], ["expectedVersion", "期望版本"]]} /><CardAction card={props.card} props={props} /></>;
}

function DecisionRequest(props: CardRendererProps) {
  return <><p className="card-authority">人类判断仍然是权威；此处不能执行真实决定。</p><CardFields card={props.card} names={[["question", "需要判断的问题"], ["requester", "提出者"], ["options", "选项摘要"], ["decisionState", "判断状态"], ["expectedVersion", "期望版本"]]} /><CardAction card={props.card} props={props} /></>;
}

function AgentRunSummary(props: CardRendererProps) {
  return <><p className="card-authority">Agent 提案或更新不是领域完成。</p><CardFields card={props.card} names={[["role", "合成 Agent 角色"], ["goal", "限定目标"], ["proposal", "当前提案"], ["limitations", "限制"], ["status", "展示状态"]]} /></>;
}

export const CARD_REGISTRY: Readonly<Record<"work-item-summary@1" | "decision-request@1" | "agent-run-summary@1", CardRenderer>> = {
  "work-item-summary@1": WorkItemSummary,
  "decision-request@1": DecisionRequest,
  "agent-run-summary@1": AgentRunSummary,
};

export function registeredCardRenderer(card: PrototypeCardEnvelope): CardRenderer | null {
  return CARD_REGISTRY[`${card.cardType}@${card.cardVersion}` as keyof typeof CARD_REGISTRY] ?? null;
}
