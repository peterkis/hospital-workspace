import { describe, expect, it } from "vitest";

const productSources = import.meta.glob<string>(["./App.tsx", "./main.tsx", "./fixtures/**/*.ts", "./features/**/*.ts", "./features/**/*.tsx", "./capabilities/**/*.ts", "./capabilities/**/*.tsx"], {
  eager: true,
  import: "default",
  query: "?raw",
});

const formatSources = import.meta.glob<string>(["./**/*.{ts,tsx}", "../*.{html,json,md,ts}"], {
  eager: true,
  import: "default",
  query: "?raw",
});

describe("MVP-02 browser-source boundary", () => {
  const sourceText = Object.entries(productSources).filter(([path]) => !path.includes(".test.")).map(([, content]) => content).join("\n");

  it("keeps browser code free from persistence, requests, unsafe HTML, and native runtime access", () => {
    expect(sourceText).not.toMatch(/\b(fetch|XMLHttpRequest|WebSocket|EventSource)\b/);
    expect(sourceText).not.toMatch(/\b(localStorage|sessionStorage|indexedDB|serviceWorker)\b/);
    expect(sourceText).not.toMatch(/dangerouslySetInnerHTML|innerHTML|eval\s*\(|new Function/);
    expect(sourceText).not.toMatch(/@tauri-apps|node:|fastify|@prisma\/client|\b(prisma|redis|pg)\b/);
    expect(sourceText).not.toMatch(/\bimport\s*\(|javascript:|https?:\/\/|<iframe|document\.write/);
    expect(sourceText).not.toMatch(/FileReader|FormData|Blob|URL\.createObjectURL|<input[^>]*\btype\s*=\s*["']file|file:\/\/|blob:|data:image/);
    expect(sourceText).not.toMatch(/componentName|executable|callbackFunction/);
    expect(sourceText).not.toMatch(/Math\.random|Date\.now|new Date\s*\(|crypto\.|setInterval\s*\(/);
    const builtins = new Set(["_http_agent", "_http_client", "_http_common", "_http_incoming", "_http_outgoing", "_http_server", "_stream_duplex", "_stream_passthrough", "_stream_readable", "_stream_transform", "_stream_wrap", "_stream_writable", "_tls_common", "_tls_wrap", "assert", "assert/strict", "async_hooks", "buffer", "child_process", "cluster", "console", "constants", "crypto", "dgram", "diagnostics_channel", "dns", "dns/promises", "domain", "events", "fs", "fs/promises", "http", "http2", "https", "inspector", "inspector/promises", "module", "net", "os", "path", "path/posix", "path/win32", "perf_hooks", "process", "punycode", "querystring", "readline", "readline/promises", "repl", "sea", "sqlite", "stream", "stream/consumers", "stream/promises", "stream/web", "string_decoder", "sys", "test", "test/reporters", "timers", "timers/promises", "tls", "trace_events", "tty", "url", "util", "util/types", "v8", "vm", "wasi", "worker_threads", "zlib"]);
    for (const match of sourceText.matchAll(/(?:\bfrom\s*|\bimport\s*|\brequire\s*\(\s*)["']([^"']+)["']/g)) {
      expect(builtins.has(match[1]), `browser import: ${match[1]}`).toBe(false);
    }
    expect(Object.keys(productSources).some((path) => path.includes("/capabilities/tickets/") && !path.includes(".test."))).toBe(true);
  });

  it("uses source formatting with final newlines, no carriage returns, and no trailing whitespace", () => {
    for (const [path, content] of Object.entries(formatSources)) {
      expect(content, path).toMatch(/\n$/);
      expect(content, path).not.toContain("\r");
      expect(content, path).not.toMatch(/[ \t]+$/m);
    }
  });
});
