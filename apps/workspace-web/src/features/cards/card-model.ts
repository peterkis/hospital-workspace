import type { PrototypeCanvasRoute } from "../canvas/canvas-model";

/** Prototype-local Card presentation types. They are not a canonical protocol. */
export type PrototypeCommandReceiptState = "ready" | "pending" | "accepted" | "rejected" | "conflict";

export interface PrototypeCardAction {
  actionId: `synthetic-action-${string}`;
  label: string;
  commandType: string;
  commandId: `synthetic-command-${string}`;
  idempotencyKey: `synthetic-idempotency-${string}`;
  expectedVersion: number;
  syntheticOutcome: Exclude<PrototypeCommandReceiptState, "ready" | "pending">;
}

export interface PrototypeCardEnvelope {
  cardId: `demo-card-${string}`;
  cardType: string;
  cardVersion: number;
  title: string;
  presentationStatus: string;
  sensitivity: "public-synthetic";
  fields: Readonly<Record<string, string>>;
  actions: readonly PrototypeCardAction[];
  canvasRoute?: PrototypeCanvasRoute;
}
