import type { PrototypeCardEnvelope } from "../cards/card-model";

interface PrototypeActivityBase {
  id: `demo-activity-${string}`;
  actor: string;
  title: string;
  detail: string;
  recordedAt: string;
  sourceKind: "fixture" | "synthetic-command" | "synthetic-projection";
  sourceId: string;
  correlationRef?: string;
}

/** Prototype-local, read-only presentation records; none owns domain truth. */
export type PrototypeActivity =
  | (PrototypeActivityBase & { kind: "user" })
  | (PrototypeActivityBase & { kind: "system" })
  | (PrototypeActivityBase & { kind: "agent" })
  | (PrototypeActivityBase & { kind: "decision" })
  | (PrototypeActivityBase & { kind: "card"; card: PrototypeCardEnvelope })
  | (PrototypeActivityBase & { kind: "error" })
  | (PrototypeActivityBase & { kind: "unknown"; unsupportedKind: string });
