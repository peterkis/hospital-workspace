#!/usr/bin/env node

import { existsSync, readdirSync, readFileSync } from "node:fs";
import { createHash } from "node:crypto";
import { join, relative, resolve, sep } from "node:path";
import { spawnSync } from "node:child_process";
import { containsProhibitedNetworkReference } from "./public-network-policy.mjs";

const SCHEMA = "hospital-workspace.public-safety-report.v1";
const GLOBAL_ERROR_PATH = "__public_safety__";
const GLOBAL_ERROR_RULE = "PUBLIC_SAFETY_CHECK_ERROR";
const decoder = new TextDecoder("utf-8", { fatal: true });
// Only Git's own metadata is outside the worktree content boundary. Dependency
// directories are ordinary materialized files and must be scanned fail closed.
const SKIP = new Set([".git"]);
const REGULAR_GIT_INDEX_MODES = new Set(["100644", "100755"]);
const INTERNAL_IPV6 = /(?<![0-9a-f:])(?:f[cd][0-9a-f]{2}|fe[89ab][0-9a-f])(?::[0-9a-f]{0,4}){1,7}(?:%[A-Za-z0-9_.-]+)?(?:\/[0-9]{1,3})?(?![0-9a-f:])/i;
const LOG_EXCEPTIONS = new Set(["docs/program/evidence/HW-00/HW00-02/negative-tests.log", "docs/program/evidence/HW-00/HW00-03/boundary-check.log", "docs/program/evidence/HW-00/HW00-04/migration-policy-test.log"]);
const JS_LOCKFILES = new Set(["package-lock.json", "npm-shrinkwrap.json", "yarn.lock", "bun.lock", "bun.lockb"]);
const CERT_EXTENSIONS = new Set([".cer", ".crt", ".csr", ".der", ".jks", ".kdb", ".key", ".keystore", ".p12", ".pem", ".pfx", ".srl"]);
const BLOCKED_PATH_PREFIXES = ["config/local/", "config/private/", "deploy/private/", "deploy/targets/", "certificates/local/", "certificates/private/", "branding/private/", "secrets/"];
const APPROVED_NON_SECRETS = new Set(["clear", "example", "example-value", "synthetic", "synthetic-value", "redacted", "not-a-secret", "<redacted>"]);
const PORTAL_PREFIX = ["@", "portal", "/"].join("");
const LEGACY_COPY_MARKER = ["LEGACY", "SOURCE", "COPY"].join("_");
const ALLOWED_PORTAL_REFERENCE_HASHES = new Map([
  ["docs/governance/DEPENDENCY-RULES.md", new Set(["b8da7a379c56383230ce9fbdd64c3bebe697c00c2c66e6d349016f9ee7fe5562"])],
  ["docs/program/machine/all-work-packages.csv", new Set(["9d8ffe8b2c23aa2b9bddf736749b6952cc9840a2fd87fa33e445a32ca582a273", "939e9491e1ac4bdecf64df6967e938d56abfeae7650bd119e826192912d94939"])],
  ["docs/program/phases/HW-01-core-kernel-database.md", new Set(["8d41b9b3d3e99b7403e04f7a1c5c1e4596b4293bc0fb202a138055b62fe797e2"])],
  ["docs/program/phases/HW-04-event-collaboration-platform.md", new Set(["9da0d696caf3fc3f6c00f91d04531a41e65623b0d1fca1fc84abc08e527a6c05"])],
  ["docs/program/tasks/HW-01.yaml", new Set(["8d41b9b3d3e99b7403e04f7a1c5c1e4596b4293bc0fb202a138055b62fe797e2"])],
  ["docs/program/tasks/HW-04.yaml", new Set(["9da0d696caf3fc3f6c00f91d04531a41e65623b0d1fca1fc84abc08e527a6c05"])],
  ["scripts/governance/check-dependency-dag.mjs", new Set(["7d3a84da3b099a8f9421458326f4fd0536ba8fac120ceefb3a8175490eb66091"])],
  ["scripts/governance/fixtures/dependency-dag/fixtures.mjs", new Set(["1233d9041b25dc91aa95585cab28fc3af1e26f27a2e00d877771cdeb0a79c440", "4179e18b8ba66581478955d01c848d936c6c6acb3fadf0db92b8f09a684f257c"])],
  ["scripts/migration/check-legacy-source-manifest.test.mjs", new Set(["9f82cf4e6e534b1af295b6edfe5796f6ac75eb023a18d07584ccb64870c28498", "17b3e0e6d62b37d7e9ab031621e757db460544ff4624bfa79d50986713863241"])]
]);
const ALLOWED_LEGACY_COPY_REFERENCE_HASHES = new Map([
  ["scripts/migration/check-legacy-source-manifest.mjs", new Set(["9f74672cd3bd72153eb069ee2cba080788889e8fbf612d57a592aa0fa19b0160"])],
  ["scripts/migration/check-legacy-source-manifest.test.mjs", new Set([
    "4ce36467caa1dabdaaa2d810270fa5b4f809f953c0d0ddd111e85eff7723a2eb", "c0272af74ccf6c8687eb5900caac5a3d67db671ed3675fed62ec9aaee5c0a52f",
    "e6882fa9e958466a672794923135e4898ada53f4033ea5b9363cfa4687fdafcb", "af52c725804dbbe88fa3725fb3e894d45fbbf0dbc077c28989db0a5144bc6192",
    "ede5651a4929ef6ddc055d37154d39961f73c3661c6425f46149f42d6e2b901d", "83c4b9d1991d49d826994303ed17b036e063bdef028a9a5a86b137a264d72f3d",
    "1cb580b5559a23fc417b5b7605d6d9ab2d47360e81b66e50998656396c729cb4", "696727f3358dd7eb37f98f8f25de0f3059e08623be6fd92cb70095282067c337",
    "dccdf2f727b62baed2808b0dc57338c58c06204b0f1e7ce3243ebbec875f05ea", "2ce44a4a4b742223ab552d688d2fd15d0df74d488e8e44f9ed4316548b18f8d0",
    "3d33c048412b30c3c5456f9ac44462600439d9ae8e548d56c340d20a73a82e5c", "3046eeac03bd621f12d5970ee20e10d889fb463278f5d23a92d4e5809a483df4",
    "aed9ee8d70224292c80867209e5d9268c65e30068908d1a53240fe29eb4f8d6e"
  ])]
]);
// Exception entries must bind one path, one rule, and the complete blob hash; empty by default is fail closed.
const BLOB_EXCEPTIONS = new Map([
  ["docs/program/templates/EVIDENCE-MANIFEST.schema.json\0CREDENTIAL_ASSIGNMENT_PATTERN", new Set(["0e7cf65026bdb3dadfa55a84fefd34f40a6480d162d1bbc2da08b6879d4a0dfc"])]
]);
function posix(value) { return value.split(sep).join("/"); }
function finding(path, rule) { return { path, rule }; }
function stable(entries) { return [...new Map(entries.map((entry) => [`${entry.path}\0${entry.rule}`, entry])).values()].sort((a, b) => a.path.localeCompare(b.path) || a.rule.localeCompare(b.rule)); }
function git(root, args) { return spawnSync("git", ["-c", `safe.directory=${posix(root)}`, "-C", root, ...args], { encoding: "buffer" }); }
function decode(bytes, path) { try { return decoder.decode(bytes); } catch { const error = new Error("INVALID_UTF8"); error.path = path; throw error; } }
function tracked(root) { const result = git(root, ["ls-files", "--stage", "-z"]); if (result.status !== 0) throw new Error("GIT_INDEX_UNREADABLE"); return decode(result.stdout, "").split("\0").filter(Boolean).map((record) => { const match = /^(\d{6}) ([0-9a-f]{40,64}) \d+\t(.+)$/.exec(record); if (!match) throw new Error("GIT_INDEX_INVALID"); return { mode: match[1], oid: match[2], path: match[3] }; }).sort((a, b) => a.path.localeCompare(b.path)); }
function materialized(root) { const records = []; function visit(directory) { for (const entry of readdirSync(directory, { withFileTypes: true }).sort((a, b) => a.name.localeCompare(b.name))) { const absolute = join(directory, entry.name); const path = posix(relative(root, absolute)); if (directory === root && SKIP.has(entry.name)) continue; if (entry.isDirectory()) visit(absolute); else if (entry.isFile()) records.push({ mode: "100644", path, bytes: readFileSync(absolute) }); else records.push({ mode: "000000", path, unsupported: true }); } } visit(root); return records; }
function blob(root, oid) { const result = git(root, ["cat-file", "blob", oid]); if (result.status !== 0) throw new Error("GIT_BLOB_UNREADABLE"); return result.stdout; }
function sourceSibling(path, paths) { return path.endsWith(".d.ts") ? paths.has(`${path.slice(0, -5)}.ts`) || paths.has(`${path.slice(0, -5)}.tsx`) : path.endsWith(".js") && (paths.has(`${path.slice(0, -3)}.ts`) || paths.has(`${path.slice(0, -3)}.tsx`)); }
function exception(path, rule, bytes) { return BLOB_EXCEPTIONS.get(`${path}\0${rule}`)?.has(createHash("sha256").update(bytes).digest("hex")) === true; }
function binaryControl(text) { return /[\u0000-\u0008\u000B\u000C\u000E-\u001F\u007F]/.test(text); }
function hasUnapprovedReference(path, text, marker, allowedHashes) { const approved = allowedHashes.get(path) ?? new Set(); return text.split(/\r?\n/).some((line) => line.includes(marker) && !approved.has(createHash("sha256").update(line.trim()).digest("hex"))); }
function decodedEscapes(text) { return text.replace(/\\(?:x([0-9A-Fa-f]{2})|u([0-9A-Fa-f]{4})|U([0-9A-Fa-f]{8})|u\{([0-9A-Fa-f]{1,6})\})/g, (_, hex2, hex4, hex8, codePoint) => { const value = Number.parseInt(hex2 ?? hex4 ?? hex8 ?? codePoint, 16); return value <= 0x10ffff ? String.fromCodePoint(value) : _; }); }
function quotedValueAt(text, start) { let index = start; while (/\s/.test(text[index] ?? "")) index += 1; const delimiter = text[index]; if (!['"', "'", "`"].includes(delimiter)) return null; let value = ""; for (index += 1; index < text.length; index += 1) { const character = text[index]; if (character === "\\") { value += character; if (index + 1 < text.length) value += text[++index]; continue; } if (character === delimiter) return { value, end: index + 1 }; value += character; } return null; }
function plainValueAt(text, start) { let index = start; while (/\s/.test(text[index] ?? "")) index += 1; if (['"', "'", "`", "*"].includes(text[index])) return null; const end = (() => { for (let cursor = index; cursor < text.length; cursor += 1) if (["\r", "\n", ";", ",", "}", "]"].includes(text[cursor])) return cursor; return text.length; })(); return text.slice(index, end).replace(/\s+(?:#|\/\/).*$/, "").trim(); }
function typedInitializerValue(text, start) { let depth = 0; let quote = null; for (let index = start; index < text.length; index += 1) { const character = text[index]; if (quote) { if (character === "\\") index += 1; else if (character === quote) quote = null; continue; } if (character === "/" && text[index + 1] === "*") { const end = text.indexOf("*/", index + 2); if (end < 0) return null; index = end + 1; continue; } if (character === "/" && text[index + 1] === "/") { const end = text.indexOf("\n", index + 2); if (end < 0) return null; index = end; continue; } if (["'", '"', "`"].includes(character)) { quote = character; continue; } if (["<", "{", "(", "["].includes(character)) { depth += 1; continue; } if ([">", "}", ")", "]"].includes(character)) { if (depth > 0) depth -= 1; continue; } if (depth === 0 && (character === ";" || character === "\n" || character === "\r")) return null; if (depth === 0 && character === "=") { if (text[index + 1] === ">") { index += 1; continue; } return quotedValueAt(text, index + 1)?.value ?? plainValueAt(text, index + 1); } } return null; }
function credentialAssignment(text, path) {
  const source = decodedEscapes(text); const jsLike = /\.(?:[cm]?[jt]sx?|jsx?)$/i.test(path); const jsonLike = /\.json$/i.test(path); const yamlLike = /\.ya?ml$/i.test(path); const key = "(?:api[_-]?key|apikey|client[_-]?secret|access[_-]?token|refresh[_-]?token|auth[_-]?token|password|passwd|secret|private[_-]?key|signing[_-]?key|cookie[_-]?secret|jwt[_-]?secret)";
  // Only syntaxes that permit it may cross a line. YAML continuations must
  // be indented, so an empty root key cannot borrow a same-indent mapping.
  const spacing = jsonLike ? "\\s*" : jsLike ? "(?:\\s|/\\*[\\s\\S]*?\\*/|//[^\\r\\n]*(?:\\r?\\n|$))*" : yamlLike ? "(?:[ \\t]|\\r?\\n[ \\t]+)*" : "[ \\t]*"; const quotedKey = `(?:[\\\"'\\\`]${key}[\\\"'\\\`])`; const left = `(?:${quotedKey}|\\[${spacing}${quotedKey}${spacing}\\]|${key})`;
  const yamlTagCharacter = "(?:%[0-9A-Fa-f]{2}|[^\\s\\[\\]{},%])"; const yamlVerbatimTagCharacter = "(?:%[0-9A-Fa-f]{2}|[^\\s%>])"; const yamlTag = `!(?:<${yamlVerbatimTagCharacter}+>|${yamlTagCharacter}*)`; const yamlAnchor = "&[^\\s\\[\\]{},]+"; const yamlProperties = `(?:(?:${yamlTag}|${yamlAnchor})${spacing})*`;
  const multiline = new RegExp(`${left}${spacing}(?::|=)${spacing}${yamlProperties}(?:\"\"\"([\\s\\S]*?)\"\"\"|'''([\\s\\S]*?)''')`, "gi");
  for (const match of source.matchAll(multiline)) { const value = (match[1] ?? match[2] ?? "").trim(); if (value && !APPROVED_NON_SECRETS.has(value.toLowerCase())) return true; }
  const quotedValue = "(?:\"((?:\\\\[\\s\\S]|[^\"\\\\])*)\"|'((?:\\\\[\\s\\S]|[^'\\\\])*)'|`((?:\\\\[\\s\\S]|[^`\\\\])*)`)";
  const expression = new RegExp(`${left}${spacing}(?::|=)${spacing}${yamlProperties}${quotedValue}`, "gi"); const typedExpression = new RegExp(`${left}${spacing}:${spacing}[A-Za-z_$][A-Za-z0-9_$<>,.\\[\\]|& ]*${spacing}=${spacing}${quotedValue}`, "gi");
  for (const matcher of [expression, typedExpression]) for (const match of source.matchAll(matcher)) { const value = (match[1] ?? match[2] ?? match[3] ?? "").trim(); if (value && !APPROVED_NON_SECRETS.has(value.toLowerCase())) return true; }
  const yamlTagPrefix = new RegExp(`^${yamlTag}${spacing}`, "i"); const plainExpression = new RegExp(`${left}${spacing}(?<operator>:|=)${spacing}${yamlProperties}(?![\\\"'\\\`*])(?<value>[^\\r\\n;,}\\]]*)`, "gi"); for (const match of source.matchAll(plainExpression)) { let raw = (match.groups?.value ?? "").trimStart(); raw = raw.replace(yamlTagPrefix, "").trimStart(); if (['"', "'", "`", "*"].includes(raw[0]) || /^\\["'`]/.test(raw)) continue; const value = raw.replace(/\s+(?:#|\/\/).*$/, "").trim(); const linePrefix = source.slice(source.lastIndexOf("\n", match.index ?? 0) + 1, match.index ?? 0); if (jsLike && match.groups?.operator === ":" && (/\b(?:const|let|var)\s*$/.test(linePrefix) || value.includes("="))) continue; if (value && !APPROVED_NON_SECRETS.has(value.toLowerCase())) return true; }
  if (jsLike) { const typedStart = new RegExp(`${left}${spacing}[?!]?${spacing}:${spacing}`, "gi"); for (const match of source.matchAll(typedStart)) { const value = typedInitializerValue(source, (match.index ?? 0) + match[0].length); if (value && !APPROVED_NON_SECRETS.has(value.trim().toLowerCase())) return true; } }
  const aliases = new Map(); const anchoredValue = new RegExp(`&([^\\s\\[\\]{},]+)${spacing}(?:${yamlTag}${spacing})*${quotedValue}`, "gi"); for (const match of source.matchAll(anchoredValue)) aliases.set(match[1], { value: (match[2] ?? match[3] ?? match[4] ?? "").trim() }); const anchoredPlain = new RegExp(`&([^\\s\\[\\]{},]+)${spacing}(?:${yamlTag}${spacing})*(?![\\\"'\\\`*])([^\\r\\n;,}\\]]*)`, "gi"); for (const match of source.matchAll(anchoredPlain)) { let raw = (match[2] ?? "").trimStart(); raw = raw.replace(yamlTagPrefix, "").trimStart(); if (['"', "'", "`", "*"].includes(raw[0])) continue; const value = raw.replace(/\s+(?:#|\/\/).*$/, "").trim(); if (value) aliases.set(match[1], { value }); } const anchoredAlias = new RegExp(`&([^\\s\\[\\]{},]+)${spacing}(?:${yamlTag}${spacing})*\\*([^\\s\\[\\]{},]+)`, "gi"); for (const match of source.matchAll(anchoredAlias)) aliases.set(match[1], { alias: match[2] }); const resolveAlias = (name, seen = new Set()) => { if (seen.has(name)) return null; seen.add(name); const entry = aliases.get(name); return entry?.alias ? resolveAlias(entry.alias, seen) : entry?.value ?? null; }; const aliasAssignment = new RegExp(`${left}${spacing}(?::|=)${spacing}\\*([^\\s\\[\\]{},]+)`, "gi"); for (const match of source.matchAll(aliasAssignment)) { const value = resolveAlias(match[1]); if (value === null || (value && !APPROVED_NON_SECRETS.has(value.toLowerCase()))) return true; }
  return false;
}
function scan(root, indexOnly) {
  const records = indexOnly ? tracked(root) : materialized(root); const paths = new Set(records.map((entry) => entry.path)); const findings = [];
  for (const record of records) {
    const path = record.path; const lower = path.toLowerCase(); const name = path.slice(path.lastIndexOf("/") + 1).toLowerCase(); let text; let bytes;
    if (record.unsupported) { findings.push(finding(path, "UNSUPPORTED_WORKTREE_ENTRY")); continue; }
    if (indexOnly && !REGULAR_GIT_INDEX_MODES.has(record.mode)) { findings.push(finding(path, "UNSUPPORTED_GIT_INDEX_MODE")); continue; }
    try { bytes = record.bytes ?? blob(root, record.oid); text = decode(bytes, path); } catch (error) { findings.push(finding(path || error.path || "", error.message === "INVALID_UTF8" ? "INVALID_UTF8" : "TEXT_BLOB_UNREADABLE")); continue; }
    const add = (rule) => { if (!exception(path, rule, bytes)) findings.push(finding(path, rule)); };
    if ((name === ".env" || name.startsWith(".env.")) && name !== ".env.example" && !/^\.env\.[^.]+\.example$/i.test(name)) add("TRACKED_ENV_FILE");
    if (BLOCKED_PATH_PREFIXES.some((prefix) => lower.startsWith(prefix))) add("TRACKED_PRIVATE_RUNTIME_CONFIG");
    if (JS_LOCKFILES.has(name)) add("SECOND_JAVASCRIPT_LOCKFILE"); if (lower.endsWith(".log") && !LOG_EXCEPTIONS.has(path)) add("TRACKED_LOG");
    if (/\.(?:dump|backup|bak)$/i.test(path) || /(?:^|[._-])(?:dump|backup)(?:[._-]|$)/i.test(name) || /(?:^|\/)backup\//i.test(path)) add("TRACKED_DATABASE_DUMP_OR_BACKUP");
    if (CERT_EXTENSIONS.has(path.slice(path.lastIndexOf(".")).toLowerCase())) add("TRACKED_CERTIFICATE_OR_PRIVATE_KEY"); if (/(^|\/)(?:dist|build|coverage|out|target)(?:\/|$)/i.test(path)) add("TRACKED_BUILD_OUTPUT");
    if (sourceSibling(path, paths)) add("GENERATED_SOURCE_BESIDE_TYPESCRIPT"); if (/^scripts\/phase-[0-9]+(?:\/|-)/i.test(path)) add("LEGACY_PHASE_SCRIPT"); if (/(?:^|\/)(?:legacy\/|legacy[-_]copy|legacy-source-copy)/i.test(path)) add("UNREGISTERED_LEGACY_COPY");
    if (binaryControl(text)) add("BINARY_BLOB_UNAPPROVED"); if (/-----BEGIN (?:[A-Z0-9]+ )*PRIVATE KEY(?: BLOCK)?-----/i.test(text)) add("PRIVATE_KEY_MARKER"); if (credentialAssignment(text, path)) add("CREDENTIAL_ASSIGNMENT_PATTERN");
    if (/(?:[A-Za-z]:[\\/]Users[\\/]|\/(?:Users|home)\/[^/\\\s]+)/.test(text)) add("PUBLIC_ABSOLUTE_USER_PROFILE_PATH");
    if (containsProhibitedNetworkReference(text) || /\b(?![a-z0-9.-]*example\.internal\b)[a-z0-9-]+(?:\.[a-z0-9-]+)*\.(?:local|lan|corp|internal)\b/i.test(text) || INTERNAL_IPV6.test(text)) add("PROHIBITED_INTERNAL_NETWORK_REFERENCE");
    if (hasUnapprovedReference(path, text, PORTAL_PREFIX, ALLOWED_PORTAL_REFERENCE_HASHES)) add("LEGACY_PORTAL_ALIAS");
    if (hasUnapprovedReference(path, text, LEGACY_COPY_MARKER, ALLOWED_LEGACY_COPY_REFERENCE_HASHES)) add("UNREGISTERED_LEGACY_COPY");
  }
  return { findings: stable(findings), scannedFileCount: records.length };
}
function options(argv) { let root = process.cwd(); let indexOnly = null; for (let i = 0; i < argv.length; i += 1) { if (argv[i] === "--root") root = argv[++i] ?? ""; else if (argv[i] === "--git-index" && indexOnly !== false) indexOnly = true; else if (argv[i] === "--worktree" && indexOnly !== true) indexOnly = false; else throw new Error(`UNKNOWN_ARGUMENT:${argv[i]}`); } if (!root) throw new Error("MISSING_ROOT"); return { root: resolve(root), indexOnly: indexOnly ?? existsSync(join(resolve(root), ".git")) }; }
try { const selected = options(process.argv.slice(2)); const report = scan(selected.root, selected.indexOnly); process.stdout.write(`${JSON.stringify({ schemaVersion: SCHEMA, status: report.findings.length ? "FAIL" : "PASS", scannedFileCount: report.scannedFileCount, findings: report.findings })}\n`); process.exitCode = report.findings.length ? 1 : 0; } catch { process.stdout.write(`${JSON.stringify({ schemaVersion: SCHEMA, status: "FAIL", scannedFileCount: 0, findings: [{ path: GLOBAL_ERROR_PATH, rule: GLOBAL_ERROR_RULE }] })}\n`); process.exitCode = 1; }
