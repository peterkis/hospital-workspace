import type { PrototypeThread } from "../threads/thread-model";
import { REGISTERED_CANVAS_ROUTES, type PrototypeCanvasRoute } from "./canvas-model";

export interface CanvasViewProps { thread: PrototypeThread; }

function WorkItemDetail({ thread }: CanvasViewProps) {
  const projection = thread.workItem;
  return <><p>来源引用：{projection?.sourceReference ?? thread.contextReferences[0] ?? "—"}</p><p>表面负责人：{projection?.responsibleParticipantId ?? "—"}</p><p>投影版本：{projection?.version ?? "—"}</p><p>下一步说明：{projection?.visibilityReason ?? "当前没有工作项投影。"}</p><p>最近记录：{thread.activities.slice(-2).map((activity) => activity.title).join("；")}</p></>;
}
function DecisionContext({ thread }: CanvasViewProps) { return <><p>判断问题：先整理哪一项演示背景？</p><p>选项：背景摘要 / 事项分组</p><p>提出者：Demo Coordinator</p><p>人类判断保持权威；本地按钮不执行真实决定。</p><p>相关合成引用：{thread.contextReferences.join("，")}</p></>; }
function AgentRunDetail({ thread }: CanvasViewProps) { return <><p>限定目标：整理公开演示背景</p><p>Agent 角色：资料整理 Agent（演示）</p><p>提案：建议按主题分组</p><p>约束与限制：没有模型调用、网络或工具执行。</p><p>Agent 输出不是领域完成。</p><p>引用：{thread.contextReferences.join("，")}</p></>; }
function KnowledgeReference({ thread }: CanvasViewProps) { return <><p>合成来源引用：{thread.contextReferences.join("，")}</p><p>评审状态：演示草稿，未代表临床或生产知识。</p></>; }

export const CANVAS_REGISTRY: Readonly<Record<PrototypeCanvasRoute, React.ComponentType<CanvasViewProps>>> = { "work-item-detail": WorkItemDetail, "decision-context": DecisionContext, "agent-run-detail": AgentRunDetail, "knowledge-reference": KnowledgeReference };
export function registeredCanvasView(route: string | null) { return route && REGISTERED_CANVAS_ROUTES.includes(route as PrototypeCanvasRoute) ? CANVAS_REGISTRY[route as PrototypeCanvasRoute] : null; }

export interface CanvasRouteOption { label: string; route: string; }
const CONTEXT_ROUTE_OPTIONS: Readonly<Record<string, readonly CanvasRouteOption[]>> = {
  "demo-thread-workboard": [{ label: "查看工作项详情", route: "work-item-detail" }],
  "demo-thread-handoff": [{ label: "查看判断上下文", route: "decision-context" }],
  "demo-thread-agent": [{ label: "查看 Agent 运行详情", route: "agent-run-detail" }],
  "demo-thread-knowledge": [
    { label: "查看知识引用", route: "knowledge-reference" },
    { label: "查看未注册 Canvas 回退", route: "future-demo-route" },
  ],
};

export function canvasRouteOptionsForThread(threadId: string): readonly CanvasRouteOption[] {
  return CONTEXT_ROUTE_OPTIONS[threadId] ?? [];
}
