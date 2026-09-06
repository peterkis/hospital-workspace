import { createLogger, defineConfig } from "vite";
import react from "@vitejs/plugin-react";

const logger = createLogger();
const logViteError = logger.error;
logger.error = (message, options) => {
  if (message.includes("http proxy error:")) {
    logger.warn("Local prototype Gateway is unavailable.");
    return;
  }
  logViteError(message, options);
};

export default defineConfig({
  base: "./",
  build: {
    outDir: "node_modules/.cache/workspace-web-dist",
  },
  customLogger: logger,
  plugins: [react()],
  server: {
    host: "localhost",
    port: 5173,
    strictPort: true,
    allowedHosts: ["localhost"],
    cors: false,
    proxy: {
      "^/api/mvp/": {
        target: "http://[::1]:3001",
        changeOrigin: false,
        ws: false,
        configure(proxy) {
          proxy.on("proxyReq", (proxyRequest) => {
            for (const headerName of proxyRequest.getHeaderNames()) {
              const normalizedName = headerName.toLowerCase();
              if (normalizedName === "cookie"
                || normalizedName === "authorization"
                || normalizedName === "proxy-authorization"
                || normalizedName.startsWith("x-hospital-")) proxyRequest.removeHeader(headerName);
            }
          });
          proxy.on("error", (_error, _request, response) => {
            if (!("writeHead" in response) || response.headersSent || response.writableEnded) return;
            response.writeHead(502, {
              "Content-Type": "application/json; charset=utf-8",
              "Cache-Control": "no-store",
              "X-Content-Type-Options": "nosniff",
            });
            response.end(JSON.stringify({
              code: "LOCAL_GATEWAY_UNAVAILABLE",
              message: "Local prototype Gateway is unavailable.",
              synthetic: true,
              boundary: "local-prototype",
            }));
          });
        },
      },
    },
  },
  test: {
    environment: "jsdom",
    setupFiles: ["./src/test/setup.ts"],
  },
});
