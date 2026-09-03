import type { PrototypeActivity } from "../timeline/activity-model";

export interface PrototypeParticipant {
  id: `synthetic-user-${string}`;
  displayName: string;
  role: string;
  initials: string;
}

/** Answers only who appears responsible and why this projected item is visible. */
export interface PrototypeWorkItemProjection {
  responsibleParticipantId: PrototypeParticipant["id"];
  visibilityReason: string;
  projectedStatus: "in-progress" | "review" | "ready";
  dueLabel: string;
  sourceReference: string;
  version: number;
}

/** Prototype-local thread projection; it never owns Ticket, Fee, Handover, or other domain truth. */
export interface PrototypeThread {
  id: `demo-thread-${string}`;
  parentSpaceId: `demo-space-${string}`;
  title: string;
  subtitle: string;
  participants: readonly PrototypeParticipant[];
  priority: "normal" | "high";
  projectedDisplayStatus: "in-progress" | "review" | "ready";
  activities: readonly PrototypeActivity[];
  activityReferences: readonly PrototypeActivity["id"][];
  contextReferences: readonly string[];
  workItem?: PrototypeWorkItemProjection;
}
