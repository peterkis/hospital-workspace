import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import {
  createMvpApiClient,
  MVP_API_MAX_RESPONSE_BYTES,
  MVP_API_TIMEOUT_MS,
} from "./mvp-api-client";
import { isMvpApiClientError, type MvpApiClientError } from "./mvp-api-errors";
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
} from "./mvp-api-types";

type FetchLike = (input: RequestInfo | URL, init?: RequestInit) => Promise<Response>;

const reporterBootstrap: MvpBootstrapResponse = {
  synthetic: true,
  boundary: "local-prototype",
  notice: "Synthetic persona presentation only; no authentication, authorization or Session.",
  persona: {
    personaId: "synthetic-persona-reporter",
    displayName: "Synthetic Reporter",
    roles: ["reporter"],
    scopes: ["tickets:read", "tickets:submit", "tickets:close", "tickets:reopen"],
    synthetic: true,
  },
  capabilities: [{
    capabilityId: "tickets",
    label: "Synthetic Tickets",
    actions: ["submit", "confirm_close", "reopen"],
    synthetic: true,
  }],
};

const engineerBootstrap: MvpBootstrapResponse = {
  synthetic: true,
  boundary: "local-prototype",
  notice: "Synthetic persona presentation only; no authentication, authorization or Session.",
  persona: {
    personaId: "synthetic-persona-engineer",
    displayName: "Demo IT Engineer",
    roles: ["engineer"],
    scopes: ["tickets:read", "tickets:triage", "tickets:assign", "tickets:accept", "tickets:progress", "tickets:resolve"],
    synthetic: true,
  },
  capabilities: [{
    capabilityId: "tickets",
    label: "Synthetic Tickets",
    actions: ["triage", "assign", "accept", "start_progress", "resolve"],
    synthetic: true,
  }],
};

const command: MvpCommandRequest = {
  ticketId: "demo-ticket-workstation-output-001",
  action: "submit",
  commandId: "demo-ticket-command-submit-v1-a1",
  idempotencyKey: "demo-ticket-idempotency-submit-v1-a1",
  expectedVersion: 1,
  observedVersion: 1,
  personaId: "synthetic-persona-reporter",
};

function receipt(command: MvpCommandRequest, state: MvpCommandReceipt["state"], reason: MvpCommandReceipt["reason"]): MvpCommandReceipt {
  return {
    commandId: command.commandId,
    idempotencyKey: command.idempotencyKey,
    state,
    expectedVersion: command.expectedVersion,
    observedVersion: command.observedVersion,
    reason,
    synthetic: true,
    boundary: "local-prototype",
    ...(command.correlationId === undefined ? {} : { correlationId: command.correlationId }),
  };
}

function jsonResponse(body: unknown, status = 200, headers: Record<string, string> = {}): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { "Content-Type": "application/json; charset=utf-8", ...headers },
  });
}

async function clientError(promise: Promise<unknown>): Promise<MvpApiClientError> {
  try {
    await promise;
  } catch (error) {
    expect(isMvpApiClientError(error)).toBe(true);
    return error as MvpApiClientError;
  }
  throw new Error("Expected an MvpApiClientError.");
}

let fetchMock = vi.fn<FetchLike>();

const receiptTuples = [
  [200, "accepted", "SYNTHETIC_ENVELOPE_ACCEPTED"],
  [200, "rejected", "PERSONA_ACTION_MISMATCH"],
  [409, "conflict", "VERSION_CONFLICT"],
] as const;

// Independent frozen protocol expectations: reporter / engineer for each action.
const actionExpectations = [
  ["submit", true, false],
  ["triage", false, true],
  ["assign", false, true],
  ["accept", false, true],
  ["start_progress", false, true],
  ["resolve", false, true],
  ["confirm_close", true, false],
  ["reopen", true, false],
] as const;
const receiptCases = actionExpectations.flatMap(([action, reporterAllowed, engineerAllowed]) =>
  (["synthetic-persona-reporter", "synthetic-persona-engineer"] as const).flatMap((personaId) =>
    ([[1, 1, "accepted"], [1, 2, "conflict"], [2, 1, "conflict"]] as const).flatMap(([expectedVersion, observedVersion, allowedState]) => {
      const allowed = personaId === "synthetic-persona-reporter" ? reporterAllowed : engineerAllowed;
      return receiptTuples.map(([status, state, reason]) => ({
        personaId, action, expectedVersion, observedVersion, status, state, reason,
        valid: state === (allowed ? allowedState : "rejected"),
      }));
    }),
  ),
);

const errorStatusCases = [
  ["INVALID_REQUEST", 400],
  ["UNKNOWN_SYNTHETIC_PERSONA", 400],
  ["UNKNOWN_ACTION", 400],
  ["NOT_FOUND", 404],
  ["METHOD_NOT_ALLOWED", 405],
  ["REQUEST_TOO_LARGE", 413],
  ["UNSUPPORTED_MEDIA_TYPE", 415],
  ["INTERNAL_ERROR", 500],
  ["LOCAL_GATEWAY_UNAVAILABLE", 502],
] as const;

function errorEnvelope(code: string) {
  return { code, message: "Untrusted server detail.", synthetic: true, boundary: "local-prototype" };
}

beforeEach(() => {
  fetchMock = vi.fn<FetchLike>();
  vi.stubGlobal("fetch", fetchMock);
});

afterEach(() => {
  vi.useRealTimers();
  vi.unstubAllGlobals();
  vi.restoreAllMocks();
});

describe("MVP browser API client", () => {
  describe.each(["readBootstrap", "sendCommand"] as const)("%s redirect quarantine", (method) => {
    const invoke = () => method === "readBootstrap"
      ? createMvpApiClient().readBootstrap("reporter")
      : createMvpApiClient().sendCommand(command);

    it("classifies browser redirect semantics as INVALID_RESPONSE", async () => {
      const opaqueRedirect = { type: "opaqueredirect", status: 0, body: null, headers: new Headers() } as Response;
      fetchMock.mockImplementation(async (_input, options) => {
        if (options?.redirect === "error") throw new TypeError("Synthetic fetch failure.");
        if (options?.redirect === "manual") return opaqueRedirect;
        throw new Error("Unexpected redirect mode.");
      });
      expect((await clientError(invoke())).code).toBe("INVALID_RESPONSE");
      expect(fetchMock).toHaveBeenCalledTimes(1);
      expect(fetchMock.mock.calls[0][1]?.redirect).toBe("manual");
    });

    it("quarantines opaqueredirect before inspecting headers, body, URL or JSON", async () => {
      const forbiddenRead = vi.fn(() => { throw new Error("Private redirect detail."); });
      const parseJson = vi.spyOn(JSON, "parse");
      const response = {
        type: "opaqueredirect",
        status: 0,
        get body() { return forbiddenRead(); },
        get headers() { return forbiddenRead(); },
        get url() { return forbiddenRead(); },
      } as unknown as Response;
      fetchMock.mockResolvedValue(response);
      expect(await clientError(invoke())).toEqual({
        name: "MvpApiClientError",
        code: "INVALID_RESPONSE",
        message: "The local prototype returned an invalid response.",
      });
      expect(forbiddenRead).not.toHaveBeenCalled();
      expect(parseJson).not.toHaveBeenCalled();
      expect(fetchMock).toHaveBeenCalledTimes(1);
    });

    it.each([300, 301, 302, 303, 307, 308, 399])("quarantines exposed HTTP %s without reading or resending", async (status) => {
      const response = new Response("Synthetic redirect body.", {
        status,
        headers: { "Content-Type": "application/json", Location: "https://example.invalid/synthetic-redirect-target" },
      });
      const readBody = vi.spyOn(response.body!, "getReader");
      const readHeader = vi.spyOn(response.headers, "get");
      fetchMock.mockResolvedValue(response);
      expect(await clientError(invoke())).toEqual({
        name: "MvpApiClientError",
        code: "INVALID_RESPONSE",
        message: "The local prototype returned an invalid response.",
      });
      expect(readBody).not.toHaveBeenCalled();
      expect(readHeader).not.toHaveBeenCalled();
      expect(fetchMock).toHaveBeenCalledTimes(1);
    });

    it("rejects redirected=true even with a valid final response", async () => {
      const body = method === "readBootstrap" ? reporterBootstrap : receipt(command, "accepted", "SYNTHETIC_ENVELOPE_ACCEPTED");
      const response = jsonResponse(body);
      Object.defineProperty(response, "redirected", { value: true });
      const readBody = vi.spyOn(response.body!, "getReader");
      fetchMock.mockResolvedValue(response);
      expect((await clientError(invoke())).code).toBe("INVALID_RESPONSE");
      expect(readBody).not.toHaveBeenCalled();
      expect(fetchMock).toHaveBeenCalledTimes(1);
    });

    it("keeps an ordinary network TypeError distinct as UNAVAILABLE", async () => {
      fetchMock.mockRejectedValue(new TypeError("Synthetic fetch failure."));
      expect(await clientError(invoke())).toEqual({
        name: "MvpApiClientError",
        code: "UNAVAILABLE",
        message: "The local prototype service is unavailable.",
      });
      expect(fetchMock).toHaveBeenCalledTimes(1);
    });
  });

  describe("error envelope correlation", () => {
    const idA = "synthetic-correlation-request-a";
    const idB = "synthetic-correlation-request-b";

    it.each([
      ["command", idA, idB, "INVALID_RESPONSE"],
      ["command", undefined, idA, "INVALID_RESPONSE"],
      ["reporter", undefined, idA, "INVALID_RESPONSE"],
      ["command", idA, idA, "UNAVAILABLE"],
      ["command", idA, undefined, "UNAVAILABLE"],
      ["command", undefined, undefined, "UNAVAILABLE"],
      ["command", "invalid-request-id", idA, "INVALID_RESPONSE"],
      ["command", idA, null, "INVALID_RESPONSE"],
      ["command", idA, "", "INVALID_RESPONSE"],
      ["command", idA, 123, "INVALID_RESPONSE"],
      ["command", idA, "invalid-response-id", "INVALID_RESPONSE"],
      ["command", idA, `synthetic-correlation-${"a".repeat(44)}`, "INVALID_RESPONSE"],
      ["reporter", undefined, undefined, "UNAVAILABLE"],
      ["reporter", undefined, "invalid-response-id", "INVALID_RESPONSE"],
      ["engineer", undefined, undefined, "UNAVAILABLE"],
      ["engineer", undefined, idA, "INVALID_RESPONSE"],
      ["engineer", undefined, "invalid-response-id", "INVALID_RESPONSE"],
    ] as const)("checks %s request correlation %s against error echo %s", async (method, requestId, responseId, expectedCode) => {
      const body = { ...errorEnvelope("NOT_FOUND"), ...(responseId === undefined ? {} : { correlationId: responseId }) };
      fetchMock.mockResolvedValue(jsonResponse(body, 404));
      const client = createMvpApiClient();
      const error = await clientError(method === "command"
        ? client.sendCommand({ ...command, ...(requestId === undefined ? {} : { correlationId: requestId }) })
        : client.readBootstrap(method));
      expect(error.code).toBe(expectedCode);
      expect(error).toEqual({
        name: "MvpApiClientError",
        code: expectedCode,
        message: expectedCode === "UNAVAILABLE"
          ? "The local prototype service is unavailable."
          : "The local prototype returned an invalid response.",
        ...(expectedCode === "UNAVAILABLE" ? { status: 404 } : {}),
      });
      expect(JSON.stringify(error)).not.toMatch(/synthetic-correlation|Untrusted server detail|stack|cause/);
      expect(fetchMock).toHaveBeenCalledTimes(1);
    });

    it.each([
      [500, {}],
      [404, { synthetic: false }],
      [404, { boundary: "production" }],
      [404, { extra: true }],
    ] as const)("does not let matching correlation bypass status %s or malformed envelope %j", async (status, fields) => {
      fetchMock.mockResolvedValue(jsonResponse({ ...errorEnvelope("NOT_FOUND"), correlationId: idA, ...fields }, status));
      expect((await clientError(createMvpApiClient().sendCommand({ ...command, correlationId: idA }))).code).toBe("INVALID_RESPONSE");
      expect(fetchMock).toHaveBeenCalledTimes(1);
    });

    it.each([idA, idB])("checks pending error echo %s against the sent snapshot", async (responseId) => {
      const mutableCommand = { ...command, correlationId: idA };
      let resolveFetch: (response: Response) => void = () => {};
      fetchMock.mockImplementation(() => new Promise<Response>((resolve) => { resolveFetch = resolve; }));
      const pending = clientError(createMvpApiClient().sendCommand(mutableCommand));
      mutableCommand.correlationId = idB;
      expect(Object.isFrozen(mutableCommand)).toBe(false);
      expect(mutableCommand.correlationId).toBe(idB);
      expect(JSON.parse(String(fetchMock.mock.calls[0][1]?.body))).toEqual({ ...command, correlationId: idA });
      resolveFetch(jsonResponse({ ...errorEnvelope("NOT_FOUND"), correlationId: responseId }, 404));
      expect((await pending).code).toBe(responseId === idA ? "UNAVAILABLE" : "INVALID_RESPONSE");
      expect(fetchMock).toHaveBeenCalledTimes(1);
    });

    it.each([false, true])("isolates reverse-order concurrent error echoes (swapped=%s)", async (swapped) => {
      const resolvers: ((response: Response) => void)[] = [];
      fetchMock.mockImplementation(() => new Promise<Response>((resolve) => { resolvers.push(resolve); }));
      const client = createMvpApiClient();
      const pendingA = clientError(client.sendCommand({ ...command, correlationId: idA }));
      const pendingB = clientError(client.sendCommand({ ...command, correlationId: idB }));
      expect(fetchMock.mock.calls.map(([, options]) => JSON.parse(String(options?.body)).correlationId)).toEqual([idA, idB]);
      resolvers[1](jsonResponse({ ...errorEnvelope("NOT_FOUND"), correlationId: swapped ? idA : idB }, 404));
      expect((await pendingB).code).toBe(swapped ? "INVALID_RESPONSE" : "UNAVAILABLE");
      resolvers[0](jsonResponse({ ...errorEnvelope("NOT_FOUND"), correlationId: swapped ? idB : idA }, 404));
      expect((await pendingA).code).toBe(swapped ? "INVALID_RESPONSE" : "UNAVAILABLE");
      expect(fetchMock).toHaveBeenCalledTimes(2);
    });

    it("preserves the exact uncorrelated Vite 502 envelope for a correlated command", async () => {
      fetchMock.mockResolvedValue(jsonResponse({
        code: "LOCAL_GATEWAY_UNAVAILABLE",
        message: "Local prototype Gateway is unavailable.",
        synthetic: true,
        boundary: "local-prototype",
      }, 502));
      expect(await clientError(createMvpApiClient().sendCommand({ ...command, correlationId: idA }))).toEqual({
        name: "MvpApiClientError",
        code: "UNAVAILABLE",
        message: "The local prototype service is unavailable.",
        status: 502,
      });
      expect(fetchMock).toHaveBeenCalledTimes(1);
    });

    it.each([
      [200, "accepted", "SYNTHETIC_ENVELOPE_ACCEPTED", 1],
      [409, "conflict", "VERSION_CONFLICT", 2],
    ] as const)("keeps HTTP %s receipts strict when the requested correlation is missing", async (status, state, reason, observedVersion) => {
      const sent = { ...command, observedVersion, correlationId: idA };
      fetchMock.mockResolvedValue(jsonResponse(receipt({ ...command, observedVersion }, state, reason), status));
      expect((await clientError(createMvpApiClient().sendCommand(sent))).code).toBe("INVALID_RESPONSE");
      expect(fetchMock).toHaveBeenCalledTimes(1);
    });
  });

  it.each(receiptCases)("checks $personaId $action versions $expectedVersion/$observedVersion against $state", async ({
    personaId, action, expectedVersion, observedVersion, status, state, reason, valid,
  }) => {
    const caseCommand = { ...command, personaId, action, expectedVersion, observedVersion };
    const body = receipt(caseCommand, state, reason);
    fetchMock.mockResolvedValue(jsonResponse(body, status));
    const result = createMvpApiClient().sendCommand(caseCommand);
    if (valid) await expect(result).resolves.toEqual(body);
    else expect((await clientError(result)).code).toBe("INVALID_RESPONSE");
    expect(fetchMock).toHaveBeenCalledTimes(1);
  });

  describe.each(["readBootstrap", "sendCommand"] as const)("%s error mapping", (method) => {
    const invoke = () => method === "readBootstrap"
      ? createMvpApiClient().readBootstrap("reporter")
      : createMvpApiClient().sendCommand(command);

    it.each(errorStatusCases.flatMap(([code, expectedStatus]) =>
      [400, 404, 405, 413, 415, 500, 502, 418, 200, 409].map((status) => ({ code, expectedStatus, status })),
    ))("validates $code with HTTP $status", async ({ code, expectedStatus, status }) => {
      fetchMock.mockResolvedValue(jsonResponse(errorEnvelope(code), status));
      const error = await clientError(invoke());
      expect(error.code).toBe(status === expectedStatus ? "UNAVAILABLE" : "INVALID_RESPONSE");
      expect(error.message).toBe(status === expectedStatus
        ? "The local prototype service is unavailable."
        : "The local prototype returned an invalid response.");
      expect(error.status).toBe(status === expectedStatus ? status : undefined);
      expect(JSON.stringify(error)).not.toContain("Untrusted server detail.");
      expect(fetchMock).toHaveBeenCalledTimes(1);
    });

    it.each([400, 404, 405, 413, 415, 500, 502, 200, 409])("rejects unknown error code at HTTP %s", async (status) => {
      fetchMock.mockResolvedValue(jsonResponse(errorEnvelope("UNKNOWN_CODE"), status));
      expect((await clientError(invoke())).code).toBe("INVALID_RESPONSE");
      expect(fetchMock).toHaveBeenCalledTimes(1);
    });

    it.each([204, 205, 304])("rejects bodyless HTTP %s", async (status) => {
      const response = new Response(null, { status, headers: { "Content-Type": "application/json" } });
      fetchMock.mockResolvedValue(response);
      expect((await clientError(invoke())).code).toBe("INVALID_RESPONSE");
      expect(fetchMock).toHaveBeenCalledTimes(1);
    });
  });

  it.each([
    ["personaId", "synthetic-persona-unknown", "UNKNOWN_SYNTHETIC_PERSONA"],
    ["action", "unknown_action", "UNKNOWN_ACTION"],
  ] as const)("rejects receipts for unknown %s but preserves valid 400 classification", async (field, value, code) => {
    const unknownCommand = { ...command, [field]: value } as MvpCommandRequest;
    for (const [status, state, reason] of receiptTuples) {
      fetchMock.mockResolvedValueOnce(jsonResponse(receipt(unknownCommand, state, reason), status));
      expect((await clientError(createMvpApiClient().sendCommand(unknownCommand))).code).toBe("INVALID_RESPONSE");
    }
    fetchMock.mockResolvedValueOnce(jsonResponse(errorEnvelope(code), 400));
    expect((await clientError(createMvpApiClient().sendCommand(unknownCommand))).code).toBe("UNAVAILABLE");
    expect(fetchMock).toHaveBeenCalledTimes(4);
  });

  it.each(["sent", "mutated"] as const)("validates the %s receipt against the sent snapshot during caller mutation", async (responseSource) => {
    const mutableCommand = { ...command, correlationId: "synthetic-correlation-before" };
    const sent = { ...mutableCommand };
    let resolveFetch: (response: Response) => void = () => {};
    fetchMock.mockImplementation(() => new Promise<Response>((resolve) => { resolveFetch = resolve; }));
    const pending = createMvpApiClient().sendCommand(mutableCommand);
    expect(JSON.parse(String(fetchMock.mock.calls[0][1]?.body))).toEqual(sent);
    Object.assign(mutableCommand, {
      commandId: "demo-ticket-command-after",
      idempotencyKey: "demo-ticket-idempotency-after",
      expectedVersion: 2,
      observedVersion: 3,
      personaId: "synthetic-persona-engineer",
      action: "triage",
      correlationId: "synthetic-correlation-after",
    });
    expect(Object.isFrozen(mutableCommand)).toBe(false);
    const body = responseSource === "sent"
      ? receipt(sent, "accepted", "SYNTHETIC_ENVELOPE_ACCEPTED")
      : receipt(mutableCommand, "conflict", "VERSION_CONFLICT");
    resolveFetch(jsonResponse(body, responseSource === "sent" ? 200 : 409));
    if (responseSource === "sent") await expect(pending).resolves.toEqual(body);
    else expect((await clientError(pending)).code).toBe("INVALID_RESPONSE");
    expect(fetchMock).toHaveBeenCalledTimes(1);
  });

  it.each([
    ["action", "triage"],
    ["personaId", "synthetic-persona-engineer"],
  ] as const)("keeps sent %s semantics when only that caller field changes", async (field, value) => {
    const mutableCommand = { ...command };
    let resolveFetch: (response: Response) => void = () => {};
    fetchMock.mockImplementation(() => new Promise<Response>((resolve) => { resolveFetch = resolve; }));
    const pending = createMvpApiClient().sendCommand(mutableCommand);
    Object.assign(mutableCommand, { [field]: value });
    const body = receipt(command, "accepted", "SYNTHETIC_ENVELOPE_ACCEPTED");
    resolveFetch(jsonResponse(body));
    await expect(pending).resolves.toEqual(body);
    expect(JSON.parse(String(fetchMock.mock.calls[0][1]?.body))).toEqual(command);
    expect(fetchMock).toHaveBeenCalledTimes(1);
  });

  it("rejects an accepted receipt for an allowed action with unequal versions", async () => {
    const staleCommand = { ...command, observedVersion: 2 };
    fetchMock.mockResolvedValue(jsonResponse({
      ...receipt(command, "accepted", "SYNTHETIC_ENVELOPE_ACCEPTED"),
      observedVersion: 2,
    }));
    expect((await clientError(createMvpApiClient().sendCommand(staleCommand))).code).toBe("INVALID_RESPONSE");
    expect(fetchMock).toHaveBeenCalledTimes(1);
  });

  it("rejects a NOT_FOUND envelope carried by HTTP 500", async () => {
    fetchMock.mockResolvedValue(jsonResponse({
      code: "NOT_FOUND",
      message: "Route not found.",
      synthetic: true,
      boundary: "local-prototype",
    }, 500));
    expect((await clientError(createMvpApiClient().readBootstrap("reporter"))).code).toBe("INVALID_RESPONSE");
    expect(fetchMock).toHaveBeenCalledTimes(1);
  });

  it("calls the reporter bootstrap literal once with fixed GET options and parses the descriptor", async () => {
    fetchMock.mockResolvedValue(jsonResponse(reporterBootstrap));
    await expect(createMvpApiClient().readBootstrap("reporter")).resolves.toEqual(reporterBootstrap);
    expect(fetchMock).toHaveBeenCalledTimes(1);
    const [target, options] = fetchMock.mock.calls[0];
    expect(target).toBe("/api/mvp/bootstrap?persona=reporter");
    expect(options).toMatchObject({
      method: "GET",
      headers: { Accept: "application/json" },
      credentials: "omit",
      redirect: "manual",
      cache: "no-store",
      mode: "same-origin",
    });
    expect(options?.signal).toBeInstanceOf(AbortSignal);
    expect(options?.body).toBeUndefined();
  });

  it("calls the engineer bootstrap literal once and parses the descriptor", async () => {
    fetchMock.mockResolvedValue(jsonResponse(engineerBootstrap));
    await expect(createMvpApiClient().readBootstrap("engineer")).resolves.toEqual(engineerBootstrap);
    expect(fetchMock).toHaveBeenCalledTimes(1);
    expect(fetchMock.mock.calls[0][0]).toBe("/api/mvp/bootstrap?persona=engineer");
  });

  it("calls the command literal once with fixed POST options and an exact JSON body", async () => {
    const accepted = receipt(command, "accepted", "SYNTHETIC_ENVELOPE_ACCEPTED");
    fetchMock.mockResolvedValue(jsonResponse(accepted));
    await expect(createMvpApiClient().sendCommand(command)).resolves.toEqual(accepted);
    expect(fetchMock).toHaveBeenCalledTimes(1);
    const [target, options] = fetchMock.mock.calls[0];
    expect(target).toBe("/api/mvp/commands");
    expect(options).toMatchObject({
      method: "POST",
      headers: { Accept: "application/json", "Content-Type": "application/json" },
      credentials: "omit",
      redirect: "manual",
      cache: "no-store",
      mode: "same-origin",
    });
    expect(JSON.parse(String(options?.body))).toEqual(command);
    expect(options?.signal).toBeInstanceOf(AbortSignal);
  });

  it("rejects a valid bootstrap for the wrong requested persona", async () => {
    fetchMock.mockResolvedValue(jsonResponse(engineerBootstrap));
    expect((await clientError(createMvpApiClient().readBootstrap("reporter"))).code).toBe("INVALID_RESPONSE");
  });

  it("rejects an extra bootstrap response property", async () => {
    fetchMock.mockResolvedValue(jsonResponse({ ...reporterBootstrap, extra: true }));
    expect((await clientError(createMvpApiClient().readBootstrap("reporter"))).code).toBe("INVALID_RESPONSE");
  });

  it.each([
    ["synthetic", { ...reporterBootstrap, synthetic: false }],
    ["boundary", { ...reporterBootstrap, boundary: "production" }],
  ])("rejects the wrong %s marker", async (_marker, body) => {
    fetchMock.mockResolvedValue(jsonResponse(body));
    expect((await clientError(createMvpApiClient().readBootstrap("reporter"))).code).toBe("INVALID_RESPONSE");
  });

  it.each(["text/html", "text/plain", "application/octet-stream"])("rejects the unrelated %s content type", async (contentType) => {
    fetchMock.mockResolvedValue(new Response(JSON.stringify(reporterBootstrap), { status: 200, headers: { "Content-Type": contentType } }));
    expect((await clientError(createMvpApiClient().readBootstrap("reporter"))).code).toBe("INVALID_RESPONSE");
  });

  it("rejects invalid JSON without exposing the body", async () => {
    fetchMock.mockResolvedValue(new Response("private-garbage{", { status: 200, headers: { "Content-Type": "application/json" } }));
    const error = await clientError(createMvpApiClient().readBootstrap("reporter"));
    expect(error.code).toBe("INVALID_RESPONSE");
    expect(JSON.stringify(error)).not.toContain("private-garbage");
  });

  it("rejects a declared Content-Length above 8192 before applying JSON", async () => {
    fetchMock.mockResolvedValue(jsonResponse(reporterBootstrap, 200, { "Content-Length": String(MVP_API_MAX_RESPONSE_BYTES + 1) }));
    expect((await clientError(createMvpApiClient().readBootstrap("reporter"))).code).toBe("INVALID_RESPONSE");
  });

  it("rejects an actual UTF-8 response body above 8192 bytes", async () => {
    fetchMock.mockResolvedValue(new Response(`"${"界".repeat(MVP_API_MAX_RESPONSE_BYTES)}"`, { status: 200, headers: { "Content-Type": "application/json" } }));
    expect((await clientError(createMvpApiClient().readBootstrap("reporter"))).code).toBe("INVALID_RESPONSE");
  });

  it("maps a network rejection to one sanitized UNAVAILABLE error without retry", async () => {
    fetchMock.mockRejectedValue(new Error("connect ECONNREFUSED secret-host:3001"));
    const error = await clientError(createMvpApiClient().readBootstrap("reporter"));
    expect(error).toEqual({
      name: "MvpApiClientError",
      code: "UNAVAILABLE",
      message: "The local prototype service is unavailable.",
    });
    expect(JSON.stringify(error)).not.toMatch(/ECONNREFUSED|secret-host|3001/);
    expect(fetchMock).toHaveBeenCalledTimes(1);
  });

  it("turns the fixed 5000 ms deadline into TIMEOUT and makes no retry", async () => {
    vi.useFakeTimers();
    fetchMock.mockImplementation(() => new Promise<Response>(() => {}));
    const caller = new AbortController();
    const removeListener = vi.spyOn(caller.signal, "removeEventListener");
    const pending = clientError(createMvpApiClient().readBootstrap("reporter", caller.signal));
    await vi.advanceTimersByTimeAsync(MVP_API_TIMEOUT_MS);
    expect((await pending).code).toBe("TIMEOUT");
    expect(fetchMock).toHaveBeenCalledTimes(1);
    expect(vi.getTimerCount()).toBe(0);
    expect(removeListener).toHaveBeenCalledWith("abort", expect.any(Function));
  });

  it("turns caller AbortSignal into CANCELLED and cleans the deadline timer", async () => {
    vi.useFakeTimers();
    fetchMock.mockImplementation(() => new Promise<Response>(() => {}));
    const caller = new AbortController();
    const pending = clientError(createMvpApiClient().readBootstrap("reporter", caller.signal));
    caller.abort();
    expect((await pending).code).toBe("CANCELLED");
    expect(vi.getTimerCount()).toBe(0);
    expect(fetchMock).toHaveBeenCalledTimes(1);
  });

  it("does not start fetch for an already-cancelled caller", async () => {
    const caller = new AbortController();
    caller.abort();
    expect((await clientError(createMvpApiClient().readBootstrap("reporter", caller.signal))).code).toBe("CANCELLED");
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it("cleans the deadline timer after a successful response", async () => {
    vi.useFakeTimers();
    fetchMock.mockResolvedValue(jsonResponse(reporterBootstrap));
    await createMvpApiClient().readBootstrap("reporter");
    expect(vi.getTimerCount()).toBe(0);
  });

  it("caller cancellation wins and prevents a late success", async () => {
    let resolveFetch: (response: Response) => void = () => {};
    fetchMock.mockImplementation(() => new Promise<Response>((resolve) => {
      resolveFetch = resolve;
    }));
    const caller = new AbortController();
    const pending = clientError(createMvpApiClient().readBootstrap("reporter", caller.signal));
    caller.abort();
    expect((await pending).code).toBe("CANCELLED");
    resolveFetch(jsonResponse(reporterBootstrap));
    await Promise.resolve();
    expect(fetchMock).toHaveBeenCalledTimes(1);
  });

  it.each([
    [200, "accepted", "SYNTHETIC_ENVELOPE_ACCEPTED", command],
    [200, "rejected", "PERSONA_ACTION_MISMATCH", { ...command, action: "triage" }],
    [409, "conflict", "VERSION_CONFLICT", { ...command, observedVersion: 2 }],
  ] as const)("returns a valid %s %s receipt", async (status, state, reason, caseCommand) => {
    const body = receipt(caseCommand, state, reason);
    fetchMock.mockResolvedValue(jsonResponse(body, status));
    await expect(createMvpApiClient().sendCommand(caseCommand)).resolves.toEqual(body);
  });

  it.each([
    [200, "conflict", "VERSION_CONFLICT"],
    [409, "accepted", "SYNTHETIC_ENVELOPE_ACCEPTED"],
    [409, "rejected", "PERSONA_ACTION_MISMATCH"],
  ] as const)("rejects inconsistent HTTP %s plus %s", async (status, state, reason) => {
    fetchMock.mockResolvedValue(jsonResponse(receipt(command, state, reason), status));
    expect((await clientError(createMvpApiClient().sendCommand(command))).code).toBe("INVALID_RESPONSE");
  });

  it.each([
    ["commandId", "demo-ticket-command-other-v1-a1"],
    ["idempotencyKey", "demo-ticket-idempotency-other-v1-a1"],
    ["expectedVersion", 2],
    ["observedVersion", 2],
  ] as const)("rejects a receipt %s mismatch", async (field, value) => {
    fetchMock.mockResolvedValue(jsonResponse({ ...receipt(command, "accepted", "SYNTHETIC_ENVELOPE_ACCEPTED"), [field]: value }));
    expect((await clientError(createMvpApiClient().sendCommand(command))).code).toBe("INVALID_RESPONSE");
  });

  it("rejects missing, mismatched and unexpected receipt correlation", async () => {
    const correlatedCommand = { ...command, correlationId: "synthetic-correlation-command-001" };
    for (const body of [
      receipt(command, "accepted", "SYNTHETIC_ENVELOPE_ACCEPTED"),
      { ...receipt(command, "accepted", "SYNTHETIC_ENVELOPE_ACCEPTED"), correlationId: "synthetic-correlation-other-001" },
    ]) {
      fetchMock.mockResolvedValueOnce(jsonResponse(body));
      expect((await clientError(createMvpApiClient().sendCommand(correlatedCommand))).code).toBe("INVALID_RESPONSE");
    }
    fetchMock.mockResolvedValueOnce(jsonResponse({ ...receipt(command, "accepted", "SYNTHETIC_ENVELOPE_ACCEPTED"), correlationId: "synthetic-correlation-unexpected-001" }));
    expect((await clientError(createMvpApiClient().sendCommand(command))).code).toBe("INVALID_RESPONSE");
  });

  it("returns a receipt with an exactly matching optional correlation", async () => {
    const correlationId = "synthetic-correlation-command-001";
    const correlatedCommand = { ...command, correlationId };
    const body = { ...receipt(command, "accepted", "SYNTHETIC_ENVELOPE_ACCEPTED"), correlationId };
    fetchMock.mockResolvedValue(jsonResponse(body));
    await expect(createMvpApiClient().sendCommand(correlatedCommand)).resolves.toEqual(body);
  });

  it("sanitizes a valid bounded server error envelope into UNAVAILABLE", async () => {
    const serverError = {
      code: "NOT_FOUND",
      message: "Route not found.",
      synthetic: true,
      boundary: "local-prototype",
    } as const;
    fetchMock.mockResolvedValue(jsonResponse(serverError, 404));
    const error = await clientError(createMvpApiClient().readBootstrap("reporter"));
    expect(error).toEqual({
      name: "MvpApiClientError",
      code: "UNAVAILABLE",
      message: "The local prototype service is unavailable.",
      status: 404,
    });
    expect(JSON.stringify(error)).not.toContain("Route not found.");
  });

  it("discards arbitrary bounded server error text instead of exposing it to client state", async () => {
    fetchMock.mockResolvedValue(jsonResponse({
      code: "NOT_FOUND",
      message: "Sensitive-looking upstream token detail.",
      synthetic: true,
      boundary: "local-prototype",
    }, 404));
    const error = await clientError(createMvpApiClient().readBootstrap("reporter"));
    expect(error).toEqual({
      name: "MvpApiClientError",
      code: "UNAVAILABLE",
      message: "The local prototype service is unavailable.",
      status: 404,
    });
    expect(JSON.stringify(error)).not.toMatch(/upstream|token|detail/i);
  });

  it("does not propagate HTML proxy garbage into a usable value or error", async () => {
    fetchMock.mockResolvedValue(new Response("<html>private proxy details</html>", { status: 502, headers: { "Content-Type": "text/html" } }));
    const error = await clientError(createMvpApiClient().readBootstrap("reporter"));
    expect(error.code).toBe("INVALID_RESPONSE");
    expect(JSON.stringify(error)).not.toContain("private proxy details");
  });

  it("rejects an untyped invalid persona without silently selecting engineer", async () => {
    expect((await clientError(createMvpApiClient().readBootstrap("admin" as "reporter"))).code).toBe("INVALID_RESPONSE");
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it("freezes the browser-local wire declarations to the accepted Gateway shape", () => {
    expect(Object.keys(createMvpApiClient())).toEqual(["readBootstrap", "sendCommand"]);
    expect(syntheticPersonaNames).toEqual(["reporter", "engineer"]);
    expect(syntheticPersonaIds).toEqual(["synthetic-persona-reporter", "synthetic-persona-engineer"]);
    expect(syntheticRoles).toEqual(["reporter", "engineer"]);
    expect(syntheticScopes).toEqual(["tickets:read", "tickets:submit", "tickets:triage", "tickets:assign", "tickets:accept", "tickets:progress", "tickets:resolve", "tickets:close", "tickets:reopen"]);
    expect(syntheticTicketActions).toEqual(["submit", "triage", "assign", "accept", "start_progress", "resolve", "confirm_close", "reopen"]);
    expect(mvpReceiptStates).toEqual(["accepted", "rejected", "conflict"]);
    expect(mvpReceiptReasons).toEqual(["SYNTHETIC_ENVELOPE_ACCEPTED", "PERSONA_ACTION_MISMATCH", "VERSION_CONFLICT"]);
    expect(mvpErrorCodes).toEqual(["INVALID_REQUEST", "UNKNOWN_SYNTHETIC_PERSONA", "UNKNOWN_ACTION", "NOT_FOUND", "METHOD_NOT_ALLOWED", "REQUEST_TOO_LARGE", "UNSUPPORTED_MEDIA_TYPE", "INTERNAL_ERROR", "LOCAL_GATEWAY_UNAVAILABLE"]);
    expect(Object.keys(reporterBootstrap).sort()).toEqual(["boundary", "capabilities", "notice", "persona", "synthetic"]);
    expect(Object.keys(command).sort()).toEqual(["action", "commandId", "expectedVersion", "idempotencyKey", "observedVersion", "personaId", "ticketId"]);
  });
});
