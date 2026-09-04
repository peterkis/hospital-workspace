import type { WorkspaceFixture } from "../../fixtures/workspace-fixtures";
import type { PrototypeCardAction, PrototypeCommandReceiptState } from "../cards/card-model";
import type { PrototypeActivity } from "../timeline/activity-model";

export const PRIMARY_NAVIGATION = ["home", "work", "messages", "decisions", "agents", "knowledge"] as const;
export type PrimaryNavigationId = (typeof PRIMARY_NAVIGATION)[number];

export interface PrototypeReceipt {
  actionId: string;
  commandId: string;
  idempotencyKey: string;
  expectedVersion: number;
  outcome: Exclude<PrototypeCommandReceiptState, "ready" | "pending">;
  status: PrototypeCommandReceiptState;
  threadId: string;
}

export interface WorkspaceRuntimeState {
  activePrimary: PrimaryNavigationId;
  activeCanvasRoute: string | null;
  isPanelOpen: boolean;
  receiptActivities: readonly PrototypeActivity[];
  receipts: Readonly<Record<string, PrototypeReceipt>>;
  selectedSpaceId: string;
  selectedThreadId: string | null;
}

export type WorkspaceRuntimeEvent =
  | { type: "select-primary"; primary: PrimaryNavigationId }
  | { type: "select-space"; fixture: WorkspaceFixture; spaceId: string }
  | { type: "select-thread"; threadId: string }
  | { type: "toggle-panel" }
  | { type: "open-canvas"; route: string }
  | { type: "close-canvas" }
  | { type: "submit-action"; action: PrototypeCardAction; threadId: string }
  | { type: "settle-action"; actionId: string }
  | { type: "refresh-conflict"; actionId: string }
  | { type: "reset"; fixture: WorkspaceFixture };

function firstThreadId(fixture: WorkspaceFixture, spaceId: string) {
  return fixture.threads.find((thread) => thread.parentSpaceId === spaceId)?.id ?? null;
}

export function createWorkspaceRuntime(fixture: WorkspaceFixture): WorkspaceRuntimeState {
  const selectedSpaceId = fixture.spaces[0]?.id ?? "";
  return { activePrimary: "home", activeCanvasRoute: null, isPanelOpen: true, receiptActivities: [], receipts: {}, selectedSpaceId, selectedThreadId: firstThreadId(fixture, selectedSpaceId) };
}

function receiptActivity(receipt: PrototypeReceipt): PrototypeActivity {
  const presentation = receipt.status === "conflict"
    ? { kind: "error" as const, title: "合成版本冲突回执", detail: "演示版本不匹配；请刷新本地演示上下文后再试。", recordedAt: "2026-09-03 09:31" }
    : receipt.status === "rejected"
      ? { kind: "error" as const, title: "合成拒绝回执", detail: "本地模拟拒绝了演示命令；没有建立任何权威结果。", recordedAt: "2026-09-03 09:32" }
      : { kind: "system" as const, title: "合成接受回执", detail: "演示命令已在本地模拟中被接受；这不表示任何领域事项已经完成。", recordedAt: "2026-09-03 09:30" };
  return {
    id: `demo-activity-receipt-${receipt.actionId}`,
    kind: presentation.kind,
    actor: "Local synthetic runtime",
    title: presentation.title,
    detail: presentation.detail,
    recordedAt: presentation.recordedAt,
    sourceKind: "synthetic-command",
    sourceId: receipt.commandId,
    correlationRef: receipt.idempotencyKey,
  };
}

export function workspaceRuntimeReducer(state: WorkspaceRuntimeState, event: WorkspaceRuntimeEvent): WorkspaceRuntimeState {
  switch (event.type) {
    case "select-primary": return { ...state, activePrimary: event.primary };
    case "select-space": return { ...state, selectedSpaceId: event.spaceId, selectedThreadId: firstThreadId(event.fixture, event.spaceId), activeCanvasRoute: null };
    case "select-thread": return { ...state, selectedThreadId: event.threadId, activeCanvasRoute: null };
    case "toggle-panel": return { ...state, isPanelOpen: !state.isPanelOpen };
    case "open-canvas": return { ...state, activeCanvasRoute: event.route, isPanelOpen: true };
    case "close-canvas": return { ...state, activeCanvasRoute: null };
    case "reset": return createWorkspaceRuntime(event.fixture);
    case "submit-action": {
      const existing = Object.values(state.receipts).find((receipt) =>
        receipt.actionId === event.action.actionId ||
        (receipt.commandId === event.action.commandId && receipt.idempotencyKey === event.action.idempotencyKey),
      );
      if (existing) return state;
      const receipt: PrototypeReceipt = { actionId: event.action.actionId, commandId: event.action.commandId, expectedVersion: event.action.expectedVersion, idempotencyKey: event.action.idempotencyKey, outcome: event.action.syntheticOutcome, status: "pending", threadId: event.threadId };
      return { ...state, receipts: { ...state.receipts, [receipt.actionId]: receipt } };
    }
    case "settle-action": {
      const receipt = state.receipts[event.actionId];
      if (!receipt || receipt.status !== "pending") return state;
      const settled = { ...receipt, status: receipt.outcome };
      const alreadyRecorded = state.receiptActivities.some((activity) => activity.sourceId === receipt.commandId && activity.correlationRef === receipt.idempotencyKey);
      return { ...state, receipts: { ...state.receipts, [receipt.actionId]: settled }, receiptActivities: alreadyRecorded ? state.receiptActivities : [...state.receiptActivities, receiptActivity(settled)] };
    }
    case "refresh-conflict": {
      const receipt = state.receipts[event.actionId];
      if (!receipt || receipt.status !== "conflict") return state;
      const { [event.actionId]: ignored, ...remaining } = state.receipts;
      return { ...state, receipts: remaining };
    }
  }
}
