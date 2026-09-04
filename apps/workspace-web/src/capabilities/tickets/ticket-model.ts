/** Browser-only, public-synthetic, noncanonical, non-authoritative Ticket presentation types. */

export type SyntheticTicketId = `demo-ticket-${string}`;

export const SYNTHETIC_TICKET_STATUSES = [
  "draft",
  "submitted",
  "triaged",
  "assigned",
  "accepted",
  "in_progress",
  "resolved",
  "closed",
  "reopened",
] as const;

/** Browser-only, public-synthetic, noncanonical, non-authoritative status labels. */
export type SyntheticTicketStatus = (typeof SYNTHETIC_TICKET_STATUSES)[number];

/** Browser-only, public-synthetic, noncanonical, non-authoritative presentation personas. */
export type SyntheticTicketPersona = "reporter" | "engineer";

/** Browser-only, public-synthetic, noncanonical, non-authoritative participant projection. */
export interface SyntheticTicketParticipant {
  id: `synthetic-ticket-person-${string}`;
  persona: SyntheticTicketPersona;
  displayName: string;
  participationLabel: string;
  joinedAt: string;
  involvement: "reporting" | "assigned" | "active" | "awaiting-confirmation" | "complete" | "next-response";
}

/** Browser-only, public-synthetic, noncanonical, non-authoritative attachment reference. */
export interface SyntheticAttachmentRef {
  assetRef: `demo-asset-${string}`;
  displayName: string;
  mimeLabel: string;
  sizeLabel: string;
  presentationState: string;
  sensitivity: "public-synthetic";
}

/** Browser-only, public-synthetic, noncanonical, non-authoritative SLA projection. */
export interface SyntheticSlaProjection {
  responseTargetLabel: string;
  resolutionTargetLabel: string;
  presentationState: string;
  remainingOrElapsedLabel: string;
  marker: "演示 SLA";
}

/** Browser-only, public-synthetic, noncanonical, non-authoritative Ticket event. */
export interface SyntheticTicketEvent {
  eventId: `demo-ticket-event-${string}`;
  eventType: string;
  ticketId: SyntheticTicketId;
  actor: SyntheticTicketPersona;
  priorStatus: SyntheticTicketStatus | null;
  resultingStatus: SyntheticTicketStatus;
  resultingVersion: number;
  recordedAt: string;
  sourceKind: "fixture" | "synthetic-command" | "synthetic-projection";
  sourceId: string;
  detail?: string;
}

/** Browser-only, public-synthetic, noncanonical, non-authoritative Ticket presentation record. */
export interface SyntheticTicket {
  id: SyntheticTicketId;
  title: string;
  description: string;
  status: SyntheticTicketStatus;
  version: number;
  reporter: SyntheticTicketParticipant;
  assignedEngineer?: SyntheticTicketParticipant;
  participants: readonly SyntheticTicketParticipant[];
  attachments: readonly SyntheticAttachmentRef[];
  sla: SyntheticSlaProjection;
  events: readonly SyntheticTicketEvent[];
  createdAt: string;
  lastUpdated: string;
}

/** Browser-only, public-synthetic, noncanonical, non-authoritative command labels. */
export type SyntheticTicketCommandType = "submit" | "triage" | "assign" | "accept" | "start_progress" | "resolve" | "confirm_close" | "reopen";

/** Browser-only, public-synthetic, noncanonical, non-authoritative command metadata. */
interface SyntheticTicketCommandEnvelope {
  commandId: `demo-ticket-command-${string}`;
  idempotencyKey: `demo-ticket-idempotency-${string}`;
  expectedVersion: number;
  actor: SyntheticTicketPersona;
  issuedAt: string;
}

/** Browser-only, public-synthetic, noncanonical, non-authoritative discriminated local command. */
export type SyntheticTicketCommand = {
  [CommandType in SyntheticTicketCommandType]: SyntheticTicketCommandEnvelope & { commandType: CommandType };
}[SyntheticTicketCommandType];

/** Browser-only, public-synthetic, noncanonical, non-authoritative local receipt. */
export interface SyntheticTicketReceipt {
  commandId: SyntheticTicketCommand["commandId"];
  idempotencyKey: SyntheticTicketCommand["idempotencyKey"];
  expectedVersion: number;
  observedVersion: number;
  state: "pending" | "accepted" | "rejected" | "conflict";
  reason: string;
  actor: SyntheticTicketPersona;
  recordedAt: string;
  priorStatus: SyntheticTicketStatus;
  resultingStatus?: SyntheticTicketStatus;
}
