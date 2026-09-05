export const syntheticPersonaNames = ["reporter", "engineer"] as const;
export const syntheticPersonaIds = [
  "synthetic-persona-reporter",
  "synthetic-persona-engineer"
] as const;
export const syntheticRoles = ["reporter", "engineer"] as const;
export const syntheticScopes = [
  "tickets:read",
  "tickets:submit",
  "tickets:triage",
  "tickets:assign",
  "tickets:accept",
  "tickets:progress",
  "tickets:resolve",
  "tickets:close",
  "tickets:reopen"
] as const;
export const syntheticTicketActions = [
  "submit",
  "triage",
  "assign",
  "accept",
  "start_progress",
  "resolve",
  "confirm_close",
  "reopen"
] as const;
export const mvpReceiptStates = ["accepted", "rejected", "conflict"] as const;
export const mvpReceiptReasons = [
  "SYNTHETIC_ENVELOPE_ACCEPTED",
  "PERSONA_ACTION_MISMATCH",
  "VERSION_CONFLICT"
] as const;

export type SyntheticPersonaName = (typeof syntheticPersonaNames)[number];
export type SyntheticPersonaId = (typeof syntheticPersonaIds)[number];
export type SyntheticRole = (typeof syntheticRoles)[number];
export type SyntheticScope = (typeof syntheticScopes)[number];
export type SyntheticTicketAction = (typeof syntheticTicketActions)[number];
export type MvpReceiptState = (typeof mvpReceiptStates)[number];
export type MvpReceiptReason = (typeof mvpReceiptReasons)[number];

export type MvpBootstrapResponse = {
  readonly synthetic: true;
  readonly boundary: "local-prototype";
  readonly notice: "Synthetic persona presentation only; no authentication, authorization or Session.";
  readonly persona: {
    readonly personaId: SyntheticPersonaId;
    readonly displayName: "Synthetic Reporter" | "Demo IT Engineer";
    readonly roles: readonly SyntheticRole[];
    readonly scopes: readonly SyntheticScope[];
    readonly synthetic: true;
  };
  readonly capabilities: readonly {
    readonly capabilityId: "tickets";
    readonly label: "Synthetic Tickets";
    readonly actions: readonly SyntheticTicketAction[];
    readonly synthetic: true;
  }[];
};

export type MvpCommandRequest = {
  readonly ticketId: "demo-ticket-workstation-output-001";
  readonly action: SyntheticTicketAction;
  readonly commandId: string;
  readonly idempotencyKey: string;
  readonly expectedVersion: number;
  readonly observedVersion: number;
  readonly personaId: SyntheticPersonaId;
  readonly correlationId?: string;
};

export type MvpCommandReceipt = {
  readonly commandId: string;
  readonly idempotencyKey: string;
  readonly state: MvpReceiptState;
  readonly expectedVersion: number;
  readonly observedVersion: number;
  readonly reason: MvpReceiptReason;
  readonly synthetic: true;
  readonly boundary: "local-prototype";
  readonly correlationId?: string;
};

export type MvpErrorCode =
  | "INVALID_REQUEST"
  | "UNKNOWN_SYNTHETIC_PERSONA"
  | "UNKNOWN_ACTION"
  | "NOT_FOUND"
  | "METHOD_NOT_ALLOWED"
  | "REQUEST_TOO_LARGE"
  | "UNSUPPORTED_MEDIA_TYPE"
  | "INTERNAL_ERROR"
  | "LOCAL_GATEWAY_UNAVAILABLE";

export type MvpErrorEnvelope = {
  readonly code: MvpErrorCode;
  readonly message: string;
  readonly synthetic: true;
  readonly boundary: "local-prototype";
  readonly correlationId?: string;
};
