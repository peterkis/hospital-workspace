import {
  mvpErrorCodes,
  mvpReceiptReasons,
  mvpReceiptStates,
  syntheticPersonaIds,
  syntheticPersonaNames,
  syntheticRoles,
  syntheticScopes,
  syntheticTicketActions,
  type MvpBootstrapResponse,
  type MvpCommandReceipt,
  type MvpCommandRequest,
  type MvpErrorEnvelope,
  type SyntheticPersonaName,
} from "./mvp-api-types";
import {
  createMvpApiClientError,
  isMvpApiClientError,
  type MvpApiClientErrorCode,
} from "./mvp-api-errors";

export const MVP_API_TIMEOUT_MS = 5_000;
export const MVP_API_MAX_RESPONSE_BYTES = 8_192;

const bootstrapNotice = "Synthetic persona presentation only; no authentication, authorization or Session.";
const commandIdPattern = /^demo-ticket-command-[a-z0-9_-]+$/;
const idempotencyKeyPattern = /^demo-ticket-idempotency-[a-z0-9_-]+$/;
const correlationIdPattern = /^synthetic-correlation-[a-z0-9-]+$/;
const errorStatuses = {
  INVALID_REQUEST: 400,
  UNKNOWN_SYNTHETIC_PERSONA: 400,
  UNKNOWN_ACTION: 400,
  NOT_FOUND: 404,
  METHOD_NOT_ALLOWED: 405,
  REQUEST_TOO_LARGE: 413,
  UNSUPPORTED_MEDIA_TYPE: 415,
  INTERNAL_ERROR: 500,
  LOCAL_GATEWAY_UNAVAILABLE: 502,
} as const satisfies Record<(typeof mvpErrorCodes)[number], number>;
const errorMessages = {
  INVALID_REQUEST: "Invalid synthetic request.",
  UNKNOWN_SYNTHETIC_PERSONA: "Unknown synthetic persona.",
  UNKNOWN_ACTION: "Unknown synthetic action.",
  NOT_FOUND: "Route not found.",
  METHOD_NOT_ALLOWED: "Method not allowed.",
  REQUEST_TOO_LARGE: "Request too large.",
  UNSUPPORTED_MEDIA_TYPE: "Unsupported media type.",
  INTERNAL_ERROR: "Gateway request failed.",
  LOCAL_GATEWAY_UNAVAILABLE: "Local prototype Gateway is unavailable.",
} as const satisfies Record<(typeof mvpErrorCodes)[number], string>;

const expectedPersona = {
  reporter: {
    personaId: "synthetic-persona-reporter",
    displayName: "Synthetic Reporter",
    roles: ["reporter"],
    scopes: ["tickets:read", "tickets:submit", "tickets:close", "tickets:reopen"],
    actions: ["submit", "confirm_close", "reopen"],
  },
  engineer: {
    personaId: "synthetic-persona-engineer",
    displayName: "Demo IT Engineer",
    roles: ["engineer"],
    scopes: ["tickets:read", "tickets:triage", "tickets:assign", "tickets:accept", "tickets:progress", "tickets:resolve"],
    actions: ["triage", "assign", "accept", "start_progress", "resolve"],
  },
} as const;

type UnknownRecord = Record<string, unknown>;

function isRecord(value: unknown): value is UnknownRecord {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function hasExactKeys(value: UnknownRecord, required: readonly string[], optional: readonly string[] = []): boolean {
  const allowed = new Set([...required, ...optional]);
  const keys = Object.keys(value);
  return required.every((key) => Object.hasOwn(value, key))
    && keys.every((key) => allowed.has(key));
}

function isOneOf<T extends string>(value: unknown, allowed: readonly T[]): value is T {
  return typeof value === "string" && allowed.includes(value as T);
}

function isExactStringArray(value: unknown, expected: readonly string[], allowed: readonly string[]): boolean {
  return Array.isArray(value)
    && value.length === expected.length
    && value.length === new Set(value).size
    && value.every((entry, index) => typeof entry === "string" && allowed.includes(entry) && entry === expected[index]);
}

function isBoundedString(value: unknown, pattern: RegExp, maximumLength: number): value is string {
  return typeof value === "string" && value.length <= maximumLength && pattern.test(value);
}

function isVersion(value: unknown): value is number {
  return Number.isInteger(value) && Number(value) >= 0 && Number(value) <= 1_000_000;
}

function isCorrelationId(value: unknown): value is string {
  return isBoundedString(value, correlationIdPattern, 64);
}

function isBootstrapResponse(value: unknown, persona: SyntheticPersonaName): value is MvpBootstrapResponse {
  if (!isRecord(value) || !hasExactKeys(value, ["synthetic", "boundary", "notice", "persona", "capabilities"])) return false;
  if (value.synthetic !== true || value.boundary !== "local-prototype" || value.notice !== bootstrapNotice) return false;
  if (!isRecord(value.persona) || !hasExactKeys(value.persona, ["personaId", "displayName", "roles", "scopes", "synthetic"])) return false;

  const expected = expectedPersona[persona];
  if (value.persona.personaId !== expected.personaId
    || value.persona.displayName !== expected.displayName
    || value.persona.synthetic !== true
    || !isExactStringArray(value.persona.roles, expected.roles, syntheticRoles)
    || !isExactStringArray(value.persona.scopes, expected.scopes, syntheticScopes)) return false;

  if (!Array.isArray(value.capabilities) || value.capabilities.length !== 1 || !isRecord(value.capabilities[0])) return false;
  const capability = value.capabilities[0];
  return hasExactKeys(capability, ["capabilityId", "label", "actions", "synthetic"])
    && capability.capabilityId === "tickets"
    && capability.label === "Synthetic Tickets"
    && capability.synthetic === true
    && isExactStringArray(capability.actions, expected.actions, syntheticTicketActions);
}

function isCommandReceipt(value: unknown): value is MvpCommandReceipt {
  if (!isRecord(value) || !hasExactKeys(value, [
    "commandId",
    "idempotencyKey",
    "state",
    "expectedVersion",
    "observedVersion",
    "reason",
    "synthetic",
    "boundary",
  ], ["correlationId"])) return false;

  return isBoundedString(value.commandId, commandIdPattern, 128)
    && isBoundedString(value.idempotencyKey, idempotencyKeyPattern, 128)
    && isOneOf(value.state, mvpReceiptStates)
    && isVersion(value.expectedVersion)
    && isVersion(value.observedVersion)
    && isOneOf(value.reason, mvpReceiptReasons)
    && value.synthetic === true
    && value.boundary === "local-prototype"
    && (value.correlationId === undefined || isCorrelationId(value.correlationId));
}

function isErrorEnvelope(value: unknown): value is MvpErrorEnvelope {
  if (!isRecord(value) || !hasExactKeys(value, ["code", "message", "synthetic", "boundary"], ["correlationId"])) return false;
  return isOneOf(value.code, mvpErrorCodes)
    && value.message === errorMessages[value.code]
    && value.synthetic === true
    && value.boundary === "local-prototype"
    && (value.correlationId === undefined || isCorrelationId(value.correlationId));
}

function invalidResponse(): never {
  throw createMvpApiClientError("INVALID_RESPONSE");
}

function hasJsonContentType(response: Response): boolean {
  const contentType = response.headers.get("content-type");
  return contentType !== null && /^application\/json(?:\s*;\s*charset=utf-8)?\s*$/i.test(contentType);
}

async function readBoundedJson(response: Response): Promise<unknown> {
  if (!hasJsonContentType(response)) invalidResponse();

  const contentLength = response.headers.get("content-length");
  if (contentLength !== null) {
    if (!/^\d+$/.test(contentLength)) invalidResponse();
    if (Number(contentLength) > MVP_API_MAX_RESPONSE_BYTES) invalidResponse();
  }

  const reader = response.body?.getReader();
  if (!reader) invalidResponse();
  const chunks: Uint8Array[] = [];
  let byteLength = 0;
  try {
    while (true) {
      const chunk = await reader.read();
      if (chunk.done) break;
      byteLength += chunk.value.byteLength;
      if (byteLength > MVP_API_MAX_RESPONSE_BYTES) {
        try {
          await reader.cancel();
        } catch {
          // Cancellation is best effort after the response is already rejected.
        }
        invalidResponse();
      }
      chunks.push(chunk.value);
    }
  } finally {
    reader.releaseLock();
  }

  const bytes = new Uint8Array(byteLength);
  let offset = 0;
  for (const chunk of chunks) {
    bytes.set(chunk, offset);
    offset += chunk.byteLength;
  }

  let text: string;
  try {
    text = new TextDecoder("utf-8", { fatal: true }).decode(bytes);
  } catch {
    invalidResponse();
  }
  if (text.trim().length === 0) invalidResponse();
  try {
    return JSON.parse(text) as unknown;
  } catch {
    invalidResponse();
  }
}

function unavailableFromEnvelope(status: number, envelope: unknown, expectedCorrelationId: string | undefined): never {
  if (!isErrorEnvelope(envelope)) invalidResponse();
  if (errorStatuses[envelope.code] !== status) invalidResponse();
  // Error echoes are optional (including proxy failures), but must belong to this request when present.
  if (Object.hasOwn(envelope, "correlationId")
    && (!isCorrelationId(expectedCorrelationId) || envelope.correlationId !== expectedCorrelationId)) invalidResponse();
  throw createMvpApiClientError("UNAVAILABLE", { status });
}

function rejectRedirectResponse(response: Response): void {
  if (response.type === "opaqueredirect"
    || response.redirected
    || (response.status >= 300 && response.status < 400)) invalidResponse();
}

async function parseBootstrapResponse(response: Response, persona: SyntheticPersonaName): Promise<MvpBootstrapResponse> {
  rejectRedirectResponse(response);
  const body = await readBoundedJson(response);
  if (response.status !== 200) {
    if (response.status >= 200 && response.status < 300) invalidResponse();
    unavailableFromEnvelope(response.status, body, undefined);
  }
  if (!isBootstrapResponse(body, persona)) invalidResponse();
  return body;
}

function receiptMatchesCommand(receipt: MvpCommandReceipt, command: MvpCommandRequest): boolean {
  const persona = Object.values(expectedPersona).find((entry) => entry.personaId === command.personaId);
  if (!persona || !isOneOf(command.action, syntheticTicketActions)) return false;
  const expectedState = !isOneOf(command.action, persona.actions)
    ? "rejected"
    : command.expectedVersion !== command.observedVersion ? "conflict" : "accepted";
  return receipt.commandId === command.commandId
    && receipt.idempotencyKey === command.idempotencyKey
    && receipt.expectedVersion === command.expectedVersion
    && receipt.observedVersion === command.observedVersion
    && receipt.correlationId === command.correlationId
    && receipt.state === expectedState;
}

function receiptMatchesStatus(receipt: MvpCommandReceipt, status: number): boolean {
  if (status === 200) {
    return (receipt.state === "accepted" && receipt.reason === "SYNTHETIC_ENVELOPE_ACCEPTED")
      || (receipt.state === "rejected" && receipt.reason === "PERSONA_ACTION_MISMATCH");
  }
  return status === 409 && receipt.state === "conflict" && receipt.reason === "VERSION_CONFLICT";
}

async function parseCommandResponse(response: Response, command: MvpCommandRequest): Promise<MvpCommandReceipt> {
  rejectRedirectResponse(response);
  const body = await readBoundedJson(response);
  if (response.status !== 200 && response.status !== 409) {
    if (response.status >= 200 && response.status < 300) invalidResponse();
    unavailableFromEnvelope(response.status, body, command.correlationId);
  }
  if (!isCommandReceipt(body) || !receiptMatchesCommand(body, command) || !receiptMatchesStatus(body, response.status)) invalidResponse();
  return body;
}

async function withDeadline<T>(operation: (signal: AbortSignal) => Promise<T>, callerSignal?: AbortSignal): Promise<T> {
  if (callerSignal?.aborted) throw createMvpApiClientError("CANCELLED");

  const controller = new AbortController();
  let interruptionCode: MvpApiClientErrorCode | undefined;
  let rejectInterruption: (reason: unknown) => void = () => {};
  const interruption = new Promise<never>((_resolve, reject) => {
    rejectInterruption = reject;
  });
  const interrupt = (code: "TIMEOUT" | "CANCELLED") => {
    if (interruptionCode !== undefined) return;
    interruptionCode = code;
    rejectInterruption(createMvpApiClientError(code));
    controller.abort();
  };
  const timer = globalThis.setTimeout(() => interrupt("TIMEOUT"), MVP_API_TIMEOUT_MS);
  const cancel = () => interrupt("CANCELLED");
  callerSignal?.addEventListener("abort", cancel, { once: true });

  try {
    return await Promise.race([
      operation(controller.signal).catch((error: unknown) => {
        if (isMvpApiClientError(error)) throw error;
        throw createMvpApiClientError(interruptionCode ?? "UNAVAILABLE");
      }),
      interruption,
    ]);
  } finally {
    globalThis.clearTimeout(timer);
    callerSignal?.removeEventListener("abort", cancel);
  }
}

export interface MvpApiClient {
  readBootstrap(persona: SyntheticPersonaName, signal?: AbortSignal): Promise<MvpBootstrapResponse>;
  sendCommand(command: MvpCommandRequest, signal?: AbortSignal): Promise<MvpCommandReceipt>;
}

export function createMvpApiClient(): MvpApiClient {
  return {
    async readBootstrap(persona, signal) {
      if (!isOneOf(persona, syntheticPersonaNames)) invalidResponse();
      return withDeadline(async (requestSignal) => {
        const options: RequestInit = {
          method: "GET",
          headers: { Accept: "application/json" },
          credentials: "omit",
          redirect: "manual",
          cache: "no-store",
          mode: "same-origin",
          signal: requestSignal,
        };
        const response = persona === "reporter"
          ? await fetch("/api/mvp/bootstrap?persona=reporter", options)
          : await fetch("/api/mvp/bootstrap?persona=engineer", options);
        return parseBootstrapResponse(response, persona);
      }, signal);
    },

    async sendCommand(command, signal) {
      const request: MvpCommandRequest = {
        ticketId: command.ticketId,
        action: command.action,
        commandId: command.commandId,
        idempotencyKey: command.idempotencyKey,
        expectedVersion: command.expectedVersion,
        observedVersion: command.observedVersion,
        personaId: command.personaId,
        ...(command.correlationId === undefined ? {} : { correlationId: command.correlationId }),
      };
      const body = JSON.stringify(request);
      return withDeadline(async (requestSignal) => {
        const response = await fetch("/api/mvp/commands", {
          method: "POST",
          headers: { Accept: "application/json", "Content-Type": "application/json" },
          body,
          credentials: "omit",
          redirect: "manual",
          cache: "no-store",
          mode: "same-origin",
          signal: requestSignal,
        });
        return parseCommandResponse(response, request);
      }, signal);
    },
  };
}
