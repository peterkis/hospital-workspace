import { buildGatewayApp } from "./app.ts";

const app = buildGatewayApp();
let closing: Promise<void> | undefined;

function closeGateway(): Promise<void> {
  closing ??= app.close().catch(() => {
    process.stderr.write("Gateway shutdown failed.\n");
    process.exitCode = 1;
  });
  return closing;
}

async function startGateway(): Promise<void> {
  try {
    await app.listen({ host: "::1", port: 3001 });
  } catch {
    process.stderr.write("Gateway startup failed.\n");
    process.exitCode = 1;
    await closeGateway();
    return;
  }

  process.once("SIGINT", () => {
    void closeGateway();
  });
  process.once("SIGTERM", () => {
    void closeGateway();
  });
}

await startGateway();
