import Fastify from "fastify";

const healthResponseSchema = {
  type: "object",
  properties: {
    status: { type: "string", const: "ok" },
    synthetic: { type: "boolean", const: true },
    boundary: { type: "string", const: "local-prototype" }
  },
  required: ["status", "synthetic", "boundary"],
  additionalProperties: false
} as const;

export function buildGatewayApp() {
  const app = Fastify({
    logger: false,
    trustProxy: false,
    bodyLimit: 4096,
    requestTimeout: 5000,
    exposeHeadRoutes: false,
    ajv: {
      customOptions: {
        coerceTypes: false,
        removeAdditional: false,
        useDefaults: false
      }
    }
  });

  app.addHook("onSend", async (_request, reply, payload) => {
    reply.header("Cache-Control", "no-store");
    reply.header("X-Content-Type-Options", "nosniff");
    return payload;
  });

  app.get(
    "/healthz",
    {
      schema: {
        response: {
          200: healthResponseSchema
        }
      }
    },
    async () => ({
      status: "ok",
      synthetic: true,
      boundary: "local-prototype"
    })
  );

  app.setNotFoundHandler(async (_request, reply) => {
    await reply.code(404).send({
      code: "NOT_FOUND",
      message: "Route not found.",
      synthetic: true,
      boundary: "local-prototype"
    });
  });

  app.setErrorHandler(async (_error, _request, reply) => {
    await reply.code(500).send({
      code: "INTERNAL_ERROR",
      message: "Gateway request failed.",
      synthetic: true,
      boundary: "local-prototype"
    });
  });

  return app;
}
