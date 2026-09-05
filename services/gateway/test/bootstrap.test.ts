import assert from "node:assert/strict";
import test from "node:test";

import { buildGatewayApp } from "../src/app.ts";
import {
  mvpBootstrapQuerySchema,
  mvpBootstrapResponseSchema,
  mvpCommandBodySchema,
  mvpCommandReceiptSchema,
  mvpErrorEnvelopeSchema
} from "../src/mvp-schemas.ts";
import {
  mvpReceiptReasons,
  mvpReceiptStates,
  syntheticPersonaIds,
  syntheticPersonaNames,
  syntheticTicketActions
} from "../src/mvp-types.ts";

const healthBody = {
  status: "ok",
  synthetic: true,
  boundary: "local-prototype"
};

test("buildGatewayApp returns isolated Fastify instances", async (t) => {
  const first = buildGatewayApp();
  const second = buildGatewayApp();
  t.after(async () => {
    await Promise.all([first.close(), second.close()]);
  });

  assert.notStrictEqual(first, second);
  first.decorate("mvpTestMarker", { changed: true });
  assert.equal(first.hasDecorator("mvpTestMarker"), true);
  assert.equal(second.hasDecorator("mvpTestMarker"), false);

  const [firstResponse, secondResponse] = await Promise.all([
    first.inject({ method: "GET", url: "/healthz" }),
    second.inject({ method: "GET", url: "/healthz" })
  ]);
  assert.deepEqual(firstResponse.json(), healthBody);
  assert.deepEqual(secondResponse.json(), healthBody);
});

test("GET /healthz returns the exact public-safe response and headers", async (t) => {
  const app = buildGatewayApp();
  t.after(async () => {
    await app.close();
  });

  const response = await app.inject({ method: "GET", url: "/healthz" });
  assert.equal(response.statusCode, 200);
  assert.deepEqual(response.json(), healthBody);
  assert.match(response.headers["content-type"] ?? "", /^application\/json(?:; charset=utf-8)?$/);
  assert.equal(response.headers["cache-control"], "no-store");
  assert.equal(response.headers["x-content-type-options"], "nosniff");
  assert.deepEqual(Object.keys(response.json()).sort(), ["boundary", "status", "synthetic"]);
});

test("HEAD and unknown routes fail with bounded public-safe responses", async (t) => {
  const app = buildGatewayApp();
  t.after(async () => {
    await app.close();
  });

  const head = await app.inject({ method: "HEAD", url: "/healthz" });
  assert.equal(head.statusCode, 404);
  // Fastify inject uses light-my-request as an in-process harness without a
  // socket. The pinned stack may expose the not-found payload for HEAD; the
  // real-listener smoke separately verifies an empty wire response body.
  assert.equal(head.headers["cache-control"], "no-store");
  assert.equal(head.headers["x-content-type-options"], "nosniff");

  const unknown = await app.inject({ method: "GET", url: "/not-registered" });
  assert.equal(unknown.statusCode, 404);
  assert.deepEqual(unknown.json(), {
    code: "NOT_FOUND",
    message: "Route not found.",
    synthetic: true,
    boundary: "local-prototype"
  });
  assert.doesNotMatch(unknown.body, /(?:cwd|hostname|memory|process|dependency|environment|stack)/i);
});

test("future bootstrap and command routes are not active in I01", async (t) => {
  const app = buildGatewayApp();
  t.after(async () => {
    await app.close();
  });

  const bootstrap = await app.inject({
    method: "GET",
    url: "/api/mvp/bootstrap?persona=reporter"
  });
  const command = await app.inject({
    method: "POST",
    url: "/api/mvp/commands",
    payload: {
      ticketId: "demo-ticket-workstation-output-001"
    }
  });

  assert.equal(bootstrap.statusCode, 404);
  assert.equal(command.statusCode, 404);
  assert.equal(bootstrap.json().code, "NOT_FOUND");
  assert.equal(command.json().code, "NOT_FOUND");
});

test("future prototype type constants and JSON Schemas remain frozen", () => {
  assert.deepEqual(syntheticPersonaNames, ["reporter", "engineer"]);
  assert.deepEqual(syntheticPersonaIds, [
    "synthetic-persona-reporter",
    "synthetic-persona-engineer"
  ]);
  assert.equal(syntheticTicketActions.length, 8);
  assert.deepEqual(mvpReceiptStates, ["accepted", "rejected", "conflict"]);
  assert.deepEqual(mvpReceiptReasons, [
    "SYNTHETIC_ENVELOPE_ACCEPTED",
    "PERSONA_ACTION_MISMATCH",
    "VERSION_CONFLICT"
  ]);
  assert.deepEqual(mvpBootstrapQuerySchema.required, ["persona"]);
  assert.equal(mvpBootstrapResponseSchema.additionalProperties, false);
  assert.deepEqual(mvpCommandBodySchema.required, [
    "ticketId",
    "action",
    "commandId",
    "idempotencyKey",
    "expectedVersion",
    "observedVersion",
    "personaId"
  ]);
  assert.equal(mvpCommandReceiptSchema.additionalProperties, false);
  assert.equal(mvpErrorEnvelopeSchema.additionalProperties, false);
});
