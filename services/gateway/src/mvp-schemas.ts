const syntheticPersonaIds = [
  "synthetic-persona-reporter",
  "synthetic-persona-engineer"
] as const;
const syntheticTicketActions = [
  "submit",
  "triage",
  "assign",
  "accept",
  "start_progress",
  "resolve",
  "confirm_close",
  "reopen"
] as const;
const syntheticScopes = [
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

const commandIdSchema = {
  type: "string",
  pattern: "^demo-ticket-command-[a-z0-9_-]+$",
  maxLength: 128
} as const;

const idempotencyKeySchema = {
  type: "string",
  pattern: "^demo-ticket-idempotency-[a-z0-9_-]+$",
  maxLength: 128
} as const;

const versionSchema = {
  type: "integer",
  minimum: 0,
  maximum: 1_000_000
} as const;

const correlationIdSchema = {
  type: "string",
  pattern: "^synthetic-correlation-[a-z0-9-]+$",
  maxLength: 64
} as const;

export const mvpBootstrapQuerySchema = {
  type: "object",
  properties: {
    persona: { type: "string", enum: ["reporter", "engineer"] }
  },
  required: ["persona"],
  additionalProperties: false
} as const;

export const mvpBootstrapResponseSchema = {
  type: "object",
  properties: {
    synthetic: { type: "boolean", const: true },
    boundary: { type: "string", const: "local-prototype" },
    notice: {
      type: "string",
      const: "Synthetic persona presentation only; no authentication, authorization or Session."
    },
    persona: {
      type: "object",
      properties: {
        personaId: { type: "string", enum: syntheticPersonaIds },
        displayName: {
          type: "string",
          enum: ["Synthetic Reporter", "Demo IT Engineer"]
        },
        roles: {
          type: "array",
          items: { type: "string", enum: ["reporter", "engineer"] },
          minItems: 1,
          maxItems: 1,
          uniqueItems: true
        },
        scopes: {
          type: "array",
          items: { type: "string", enum: syntheticScopes },
          minItems: 1,
          maxItems: 6,
          uniqueItems: true
        },
        synthetic: { type: "boolean", const: true }
      },
      required: ["personaId", "displayName", "roles", "scopes", "synthetic"],
      additionalProperties: false
    },
    capabilities: {
      type: "array",
      items: {
        type: "object",
        properties: {
          capabilityId: { type: "string", const: "tickets" },
          label: { type: "string", const: "Synthetic Tickets" },
          actions: {
            type: "array",
            items: { type: "string", enum: syntheticTicketActions },
            minItems: 1,
            maxItems: 5,
            uniqueItems: true
          },
          synthetic: { type: "boolean", const: true }
        },
        required: ["capabilityId", "label", "actions", "synthetic"],
        additionalProperties: false
      },
      minItems: 1,
      maxItems: 1
    }
  },
  required: ["synthetic", "boundary", "notice", "persona", "capabilities"],
  additionalProperties: false
} as const;

export const mvpCommandBodySchema = {
  type: "object",
  properties: {
    ticketId: { type: "string", const: "demo-ticket-workstation-output-001" },
    action: { type: "string", enum: syntheticTicketActions },
    commandId: commandIdSchema,
    idempotencyKey: idempotencyKeySchema,
    expectedVersion: versionSchema,
    observedVersion: versionSchema,
    personaId: { type: "string", enum: syntheticPersonaIds },
    correlationId: correlationIdSchema
  },
  required: [
    "ticketId",
    "action",
    "commandId",
    "idempotencyKey",
    "expectedVersion",
    "observedVersion",
    "personaId"
  ],
  additionalProperties: false
} as const;

export const mvpCommandReceiptSchema = {
  type: "object",
  properties: {
    commandId: commandIdSchema,
    idempotencyKey: idempotencyKeySchema,
    state: {
      type: "string",
      enum: ["accepted", "rejected", "conflict"]
    },
    expectedVersion: versionSchema,
    observedVersion: versionSchema,
    reason: {
      type: "string",
      enum: [
        "SYNTHETIC_ENVELOPE_ACCEPTED",
        "PERSONA_ACTION_MISMATCH",
        "VERSION_CONFLICT"
      ]
    },
    synthetic: { type: "boolean", const: true },
    boundary: { type: "string", const: "local-prototype" },
    correlationId: correlationIdSchema
  },
  required: [
    "commandId",
    "idempotencyKey",
    "state",
    "expectedVersion",
    "observedVersion",
    "reason",
    "synthetic",
    "boundary"
  ],
  additionalProperties: false
} as const;

export const mvpErrorEnvelopeSchema = {
  type: "object",
  properties: {
    code: {
      type: "string",
      enum: [
        "INVALID_REQUEST",
        "UNKNOWN_SYNTHETIC_PERSONA",
        "UNKNOWN_ACTION",
        "NOT_FOUND",
        "METHOD_NOT_ALLOWED",
        "REQUEST_TOO_LARGE",
        "UNSUPPORTED_MEDIA_TYPE",
        "INTERNAL_ERROR",
        "LOCAL_GATEWAY_UNAVAILABLE"
      ]
    },
    message: { type: "string", minLength: 1, maxLength: 128 },
    synthetic: { type: "boolean", const: true },
    boundary: { type: "string", const: "local-prototype" },
    correlationId: correlationIdSchema
  },
  required: ["code", "message", "synthetic", "boundary"],
  additionalProperties: false
} as const;
