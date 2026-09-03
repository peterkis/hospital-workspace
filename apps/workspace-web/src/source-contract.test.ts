import { describe, expect, it } from "vitest";

const productSources = import.meta.glob<string>(["./App.tsx", "./main.tsx", "./fixtures/**/*.ts", "./features/**/*.ts", "./features/**/*.tsx"], {
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
    expect(sourceText).not.toMatch(/componentName|executable|callbackFunction/);
  });

  it("uses source formatting with final newlines, no carriage returns, and no trailing whitespace", () => {
    for (const [path, content] of Object.entries(formatSources)) {
      expect(content, path).toMatch(/\n$/);
      expect(content, path).not.toContain("\r");
      expect(content, path).not.toMatch(/[ \t]+$/m);
    }
  });
});
