#!/usr/bin/env node
import { existsSync, readFileSync, readdirSync } from "node:fs";
import { join, relative, resolve, sep } from "node:path";
import { spawnSync } from "node:child_process";

const SCHEMA = "hospital-workspace.legacy-source.v2";
const SOURCE_MODES = new Set(["none", "optional-local"]);
const MODES = new Set(["COPY_ADAPT", "EXTRACT_ADAPT", "REFERENCE_ONLY", "DO_NOT_MIGRATE"]);
const RISKS = new Set(["low", "medium", "high", "critical"]);
const REQUIRED = ["sourceRequiredForBuild", "sourceRequiredForCI", "sourceRequiredForTests", "sourceRequiredForRuntime", "sourceRequiredForRelease", "sourceRequiredForRollback"];
const FALSE_POLICY = ["gitSubmodule", "gitHistoryImport", "broadCherryPick", "runtimeDependency", "buildDependency", "ciDependency", "testDependency", "releaseDependency", "rollbackDependency"];
const POLICY_KEYS = [...FALSE_POLICY, "readOnly", "localInputIgnored"];
const SKIP = new Set([".git", "node_modules", "coverage", "dist", "build", "out", "target"]);
const TEXT_REFERENCE_PATHS = ["docs/migration/", "docs/program/evidence/", "evidence/"];
const TEXT_REFERENCE_EXTENSIONS = new Set([".log", ".md", ".txt"]);
const MIGRATION_TOOLING_EXCLUSIONS = new Set([
  "scripts/migration/check-legacy-source-manifest.mjs",
  "scripts/migration/check-legacy-source-manifest.test.mjs"
]);
const GOVERNANCE_DETECTOR_EXCLUSIONS = new Set([
  "scripts/governance/check-dependency-dag.mjs",
  "scripts/governance/fixtures/dependency-dag/fixtures.mjs"
]);
const CODE_EXTENSIONS = new Set([".bat", ".cjs", ".cmd", ".cts", ".js", ".jsx", ".mjs", ".mts", ".ps1", ".psm1", ".py", ".rs", ".sh", ".ts", ".tsx"]);
const BUILD_FILENAMES = new Set(["cargo.toml", "dockerfile", "makefile"]);

function compare(a, b) { return String(a) === String(b) ? 0 : String(a) < String(b) ? -1 : 1; }
function sorted(values) { return [...values].sort(compare); }
function stable(value) {
  if (Array.isArray(value)) return value.map(stable);
  if (value && typeof value === "object") return Object.fromEntries(sorted(Object.keys(value)).map((key) => [key, stable(value[key])]));
  return value;
}
function finding(code, path = "", detail = "") { return { code, detail, path }; }
function exactKeys(value, keys, code) {
  if (!value || typeof value !== "object" || Array.isArray(value) || sorted(Object.keys(value)).join("|") !== sorted(keys).join("|")) throw new Error(code);
}
function nonempty(value, code) { if (typeof value !== "string" || value.length === 0) throw new Error(code); return value; }
function publicScalar(value, code) {
  nonempty(value, code);
  if (value.length > 120 || value !== value.trim() || /[\x00-\x1f\x7f]/.test(value) || !/^[A-Za-z0-9](?:[A-Za-z0-9 ._:+()\-]*[A-Za-z0-9)])?$/.test(value) || /^[A-Za-z]:/i.test(value) || /^~/.test(value) || /^(?:file|ftp|git|https?|ssh):/i.test(value) || value.includes("://") || value.includes("@")) throw new Error(code);
  return value;
}
function publicIdentifier(value, code) {
  nonempty(value, code);
  if (!/^[A-Za-z0-9][A-Za-z0-9._-]{0,119}$/.test(value)) throw new Error(code);
  return value;
}
function relativePath(value, code) {
  nonempty(value, code);
  const segments = value.split(/[\\/]/);
  if (value.startsWith("/") || value.startsWith("\\") || /^[A-Za-z]:[\\/]/.test(value) || segments.some((segment) => segment.length === 0 || segment === "." || segment === ".." || segment.includes(":")) || value.includes("\0")) throw new Error(code);
  return value.replaceAll("\\", "/");
}

function strictJson(text) {
  let index = 0;
  const spaces = () => { while (/\s/.test(text[index] ?? "")) index += 1; };
  const quoted = () => {
    if (text[index] !== "\"") throw new Error("MANIFEST_INVALID_JSON_COMPATIBLE_YAML");
    const start = index++;
    while (index < text.length) {
      if (text[index] === "\\") { index += 2; continue; }
      if (text[index++] === "\"") {
        try { return JSON.parse(text.slice(start, index)); } catch { throw new Error("MANIFEST_INVALID_JSON_COMPATIBLE_YAML"); }
      }
    }
    throw new Error("MANIFEST_INVALID_JSON_COMPATIBLE_YAML");
  };
  const parseValue = () => {
    spaces();
    if (text[index] === "{") {
      index += 1; spaces();
      const keys = new Set();
      if (text[index] === "}") { index += 1; return; }
      while (true) {
        spaces();
        const key = quoted();
        if (keys.has(key)) throw new Error("MANIFEST_DUPLICATE_KEY");
        keys.add(key); spaces();
        if (text[index++] !== ":") throw new Error("MANIFEST_INVALID_JSON_COMPATIBLE_YAML");
        parseValue(); spaces();
        if (text[index] === "}") { index += 1; return; }
        if (text[index++] !== ",") throw new Error("MANIFEST_INVALID_JSON_COMPATIBLE_YAML");
      }
    }
    if (text[index] === "[") {
      index += 1; spaces();
      if (text[index] === "]") { index += 1; return; }
      while (true) {
        parseValue(); spaces();
        if (text[index] === "]") { index += 1; return; }
        if (text[index++] !== ",") throw new Error("MANIFEST_INVALID_JSON_COMPATIBLE_YAML");
      }
    }
    if (text[index] === "\"") { quoted(); return; }
    const primitive = /^(?:true|false|null|-?(?:0|[1-9]\d*)(?:\.\d+)?(?:[eE][+-]?\d+)?)/.exec(text.slice(index));
    if (!primitive) throw new Error("MANIFEST_INVALID_JSON_COMPATIBLE_YAML");
    index += primitive[0].length;
  };
  parseValue(); spaces();
  if (index !== text.length) throw new Error("MANIFEST_INVALID_JSON_COMPATIBLE_YAML");
  try { return JSON.parse(text); } catch { throw new Error("MANIFEST_INVALID_JSON_COMPATIBLE_YAML"); }
}

function frozen(manifest, code) {
  if (!manifest.policy.readOnly || !manifest.policy.localInputIgnored || REQUIRED.some((key) => manifest[key] !== false) || FALSE_POLICY.some((key) => manifest.policy[key] !== false)) throw new Error(code);
}
function parseManifest(path) {
  let manifest;
  try { manifest = strictJson(readFileSync(path, "utf8")); } catch (error) { throw new Error(error.message.startsWith("MANIFEST_") ? error.message : "MANIFEST_INVALID_JSON_COMPATIBLE_YAML"); }
  exactKeys(manifest, ["absencePolicy", "adoptions", "policy", "schemaVersion", "sourceMode", ...REQUIRED, "sources"], "MANIFEST_UNKNOWN_OR_MISSING_FIELD");
  if (manifest.schemaVersion !== SCHEMA || !SOURCE_MODES.has(manifest.sourceMode) || manifest.absencePolicy !== "reimplement-from-target-contracts") throw new Error("MANIFEST_INVALID_HEADER");
  if (REQUIRED.some((key) => typeof manifest[key] !== "boolean")) throw new Error("MANIFEST_INVALID_DEPENDENCY_FLAG");
  exactKeys(manifest.policy, POLICY_KEYS, "MANIFEST_INVALID_POLICY");
  if (POLICY_KEYS.some((key) => typeof manifest.policy[key] !== "boolean")) throw new Error("MANIFEST_INVALID_POLICY");
  if (!Array.isArray(manifest.sources) || !Array.isArray(manifest.adoptions)) throw new Error("MANIFEST_INVALID_LIST");
  frozen(manifest, "MANIFEST_FROZEN_INVARIANT");
  if (manifest.sourceMode === "none") {
    if (manifest.sources.length || manifest.adoptions.length) throw new Error("NONE_MODE_HAS_SOURCE_OR_DEPENDENCY");
  } else validateOptional(manifest);
  return manifest;
}
function validateOptional(manifest) {
  if (manifest.sources.length === 0 || manifest.adoptions.length === 0) throw new Error("OPTIONAL_LOCAL_INVARIANT");
  const hashes = new Map();
  for (const source of manifest.sources) {
    exactKeys(source, ["id", "label", "license", "localConfigPath", "owner", "provenance", "sourceCommit", "sourceHash", "sourcePath"], "OPTIONAL_SOURCE_INVALID_FIELDS");
    const id = publicIdentifier(source.id, "OPTIONAL_SOURCE_INVALID_ID");
    if (hashes.has(id)) throw new Error("OPTIONAL_SOURCE_DUPLICATE_ID");
    publicScalar(source.label, "OPTIONAL_SOURCE_LABEL");
    if (!/^[0-9a-f]{40}$/.test(source.sourceCommit)) throw new Error("OPTIONAL_SOURCE_COMMIT");
    if (!/^[0-9a-f]{64}$/.test(source.sourceHash)) throw new Error("OPTIONAL_SOURCE_HASH");
    relativePath(source.sourcePath, "OPTIONAL_SOURCE_PATH");
    if (source.localConfigPath !== "config/local/legacy-source.yaml") throw new Error("OPTIONAL_SOURCE_LOCAL_CONFIG");
    for (const key of ["owner", "license", "provenance"]) publicScalar(source[key], "OPTIONAL_SOURCE_" + key.toUpperCase());
    hashes.set(id, source.sourceHash);
  }
  const adoptionIds = new Set();
  for (const adoption of manifest.adoptions) {
    exactKeys(adoption, ["id", "license", "migrationMode", "owner", "provenance", "receipt", "risk", "sourceHash", "sourceId", "sourcePath", "targetPath"], "ADOPTION_INVALID_FIELDS");
    const id = publicIdentifier(adoption.id, "ADOPTION_INVALID_ID");
    if (adoptionIds.has(id)) throw new Error("ADOPTION_DUPLICATE_ID");
    adoptionIds.add(id);
    const sourceId = publicIdentifier(adoption.sourceId, "ADOPTION_SOURCE_ID");
    if (!hashes.has(sourceId)) throw new Error("ADOPTION_UNKNOWN_SOURCE");
    if (!MODES.has(adoption.migrationMode)) throw new Error("ADOPTION_INVALID_MODE");
    if (!RISKS.has(adoption.risk)) throw new Error("ADOPTION_RISK");
    if (!/^[0-9a-f]{64}$/.test(adoption.sourceHash) || hashes.get(sourceId) !== adoption.sourceHash) throw new Error("ADOPTION_SOURCE_HASH");
    const sourcePath = relativePath(adoption.sourcePath, "ADOPTION_SOURCE_PATH");
    const targetPath = relativePath(adoption.targetPath, "ADOPTION_TARGET_PATH");
    for (const key of ["owner", "license", "provenance"]) publicScalar(adoption[key], "ADOPTION_" + key.toUpperCase());
    if (!relativePath(adoption.receipt, "ADOPTION_RECEIPT").startsWith("docs/migration/")) throw new Error("ADOPTION_RECEIPT");
    if (["COPY_ADAPT", "EXTRACT_ADAPT"].includes(adoption.migrationMode) && /[*?\[\]{}]/.test(sourcePath + "|" + targetPath)) throw new Error("ADOPTION_GLOB");
  }
}

function allFiles(root) {
  const files = [];
  function visit(directory) {
    for (const entry of readdirSync(directory, { withFileTypes: true })) {
      if (entry.isDirectory() && SKIP.has(entry.name)) continue;
      const absolute = join(directory, entry.name);
      if (entry.isDirectory()) visit(absolute);
      else if (entry.isFile()) files.push(relative(root, absolute).split(sep).join("/"));
    }
  }
  visit(root);
  return sorted(files);
}
function trackedInventory(root) {
  if (!existsSync(join(root, ".git"))) return { error: null, gitlinks: [], paths: null, symlinks: [] };
  const normalized = root.split(sep).join("/");
  const git = spawnSync("git", ["-c", "safe.directory=" + normalized, "-C", root, "ls-files", "--stage", "-z"], { encoding: "utf8" });
  if (git.status !== 0) return { error: git.stderr.trim() || "git-ls-files-failed", paths: null };
  const paths = new Set();
  const gitlinks = [];
  const symlinks = [];
  for (const record of git.stdout.split("\0").filter(Boolean)) {
    const match = /^(\d{6}) [0-9a-f]{40,64} \d+\t(.+)$/.exec(record);
    if (!match) return { error: "git-ls-files-stage-invalid", paths: null };
    paths.add(match[2]);
    if (match[1] === "160000") gitlinks.push(match[2]);
    if (match[1] === "120000") symlinks.push(match[2]);
  }
  return { error: null, gitlinks: sorted(gitlinks), paths, symlinks: sorted(symlinks) };
}
function textExcluded(path) {
  if (!TEXT_REFERENCE_PATHS.some((prefix) => path.startsWith(prefix))) return false;
  const extension = path.slice(path.lastIndexOf(".")).toLowerCase();
  return TEXT_REFERENCE_EXTENSIONS.has(extension);
}
function contentSurface(path) {
  if (textExcluded(path) || MIGRATION_TOOLING_EXCLUSIONS.has(path) || path.startsWith("scripts/migration/fixtures/") || GOVERNANCE_DETECTOR_EXCLUSIONS.has(path)) return false;
  if (path === "package.json" || path.endsWith("/package.json") || path === "pnpm-workspace.yaml" || path.startsWith(".github/workflows/") || (path.startsWith("config/") && !path.startsWith("config/examples/") && !path.startsWith("config/schema/") && !path.startsWith("config/local/")) || path.startsWith("infrastructure/")) return true;
  const basename = path.slice(path.lastIndexOf("/") + 1).toLowerCase();
  if (BUILD_FILENAMES.has(basename)) return true;
  const extension = path.endsWith(".d.ts") ? ".d.ts" : path.slice(path.lastIndexOf("."));
  return extension === ".d.ts" || CODE_EXTENSIONS.has(extension);
}
function registeredTarget(manifest, path) {
  return manifest?.sourceMode === "optional-local" && manifest.adoptions.some((adoption) => ["COPY_ADAPT", "EXTRACT_ADAPT"].includes(adoption.migrationMode) && (path === adoption.targetPath || path.startsWith(adoption.targetPath + "/")));
}
function nextPath(path) {
  return /(^|\/)next\.config\.[^/]+$/.test(path) || /(^|\/)next-env\.d\.ts$/.test(path) ||
    /(^|\/)pages\/.+\.(?:[cm]?[jt]sx?)$/.test(path) ||
    /(^|\/)app\/(?:[^/]+\/)*(?:default|error|layout|loading|not-found|page|route|template)\.(?:[cm]?[jt]sx?)$/.test(path) || path.toLowerCase().includes("hub-next");
}
function packageHasNext(text) {
  try {
    const json = JSON.parse(text);
    return ["dependencies", "devDependencies", "optionalDependencies", "peerDependencies"].some((key) => json[key] && typeof json[key] === "object" && Object.hasOwn(json[key], "next")) ||
      Object.values(json.scripts ?? {}).some((command) => typeof command === "string" && /(?:^|\s)next(?:\s|$)/.test(command));
  } catch { return false; }
}
function nextImport(text) {
  return /\b(?:from\s*|import\s*)["']next(?:\/[^"']*)?["']/.test(text) ||
    /\brequire\s*\(\s*["']next(?:\/[^"']*)?["']\s*\)/.test(text) ||
    /\bimport\s*\(\s*["']next(?:\/[^"']*)?["']\s*\)/.test(text);
}
function legacyDependency(text) {
  const normalized = text.replaceAll("\\", "/");
  return /(?:file:)?\.\.?\/+[^\s"']*legacy\b|config\/+local\/+legacy-source\.yaml\b|file:(?:[^\s"']*\/)?legacy(?:\/|\b)|(?:^|[\s"'=(])(?:[A-Za-z]:)?\/+(?:[^\s"']*\/)?legacy(?:\/|\b)/i.test(normalized);
}
function ignoredLocalConfig(root) {
  const inventory = trackedInventory(root);
  if (inventory.error || inventory.paths === null) return false;
  const normalized = root.split(sep).join("/");
  const localConfig = "config/local/legacy-source.yaml";
  const checked = spawnSync("git", ["-c", "safe.directory=" + normalized, "-C", root, "check-ignore", "--no-index", "--verbose", "--stdin", "-z"], { encoding: "utf8", input: `${localConfig}\0` });
  if (checked.status !== 0) return false;
  const fields = checked.stdout.split("\0");
  if (fields.at(-1) !== "") return false;
  fields.pop();
  if (fields.length !== 4 || !/^\d+$/.test(fields[1]) || fields[2].length === 0 || fields[2].startsWith("!") || fields[3] !== localConfig) return false;
  const source = fields[0].replaceAll("\\", "/");
  return (source === ".gitignore" || source.endsWith("/.gitignore")) && inventory.paths.has(source);
}
function scan(root, manifest) {
  const findings = [];
  const files = allFiles(root);
  const names = new Set(files);
  const inventory = trackedInventory(root);
  const trackedOrMaterialized = inventory.paths ?? names;
  if (inventory.error) findings.push(finding("GIT_TRACKED_INVENTORY_UNREADABLE", ".git", inventory.error));
  for (const path of inventory.gitlinks ?? []) findings.push(finding("GIT_SUBMODULE", path));
  for (const path of inventory.symlinks ?? []) findings.push(finding("TRACKED_SYMLINK", path));
  if (names.has(".gitmodules") || inventory.paths?.has(".gitmodules")) findings.push(finding("GIT_SUBMODULE", ".gitmodules"));
  if (trackedOrMaterialized.has("config/local/legacy-source.yaml")) findings.push(finding("TRACKED_LOCAL_SOURCE_CONFIG", "config/local/legacy-source.yaml"));
  for (const path of files) {
    const lower = path.toLowerCase();
    if (path.startsWith("scripts/phase-01/")) findings.push(finding("LEGACY_PHASE_01", path));
    if (path.startsWith("scripts/phase-02/")) findings.push(finding("LEGACY_PHASE_02", path));
    if (path === "prisma/schema.prisma" || path.startsWith("prisma/migrations/")) findings.push(finding("LEGACY_ROOT_PRISMA", path));
    if (nextPath(path)) findings.push(finding("LEGACY_NEXT_RUNTIME", path));
    if ((lower.includes("legacy-copy") || lower.includes("legacy_source_copy")) && !registeredTarget(manifest, path)) findings.push(finding("UNREGISTERED_LEGACY_COPY", path));
    const extension = path.endsWith(".d.ts") ? ".d.ts" : path.slice(path.lastIndexOf("."));
    if ((extension === ".js" || extension === ".d.ts") && (names.has(path.slice(0, extension === ".d.ts" ? -5 : -3) + ".ts") || names.has(path.slice(0, extension === ".d.ts" ? -5 : -3) + ".tsx"))) findings.push(finding("GENERATED_BESIDE_TS", path));
    if (!contentSurface(path)) continue;
    const text = readFileSync(join(root, path), "utf8");
    if (/LEGACY_SOURCE_COPY/.test(text) && !registeredTarget(manifest, path)) findings.push(finding("UNREGISTERED_LEGACY_COPY", path));
    if (nextImport(text)) findings.push(finding("LEGACY_NEXT_RUNTIME", path));
    if (/@portal\//.test(text)) findings.push(finding("LEGACY_PORTAL_ALIAS", path));
    if (/\b(?:git\s+cherry-pick|broadCherryPick)\b/.test(text) && !path.endsWith("package.json")) findings.push(finding("BROAD_CHERRY_PICK", path));
    if (/\b(?:filter-repo|git\s+replace|history import)\b/i.test(text)) findings.push(finding("GIT_HISTORY_IMPORT", path));
    if (legacyDependency(text)) findings.push(finding("LEGACY_BUILD_CI_RUNTIME_DEPENDENCY", path));
    if ((path === "package.json" || path.endsWith("/package.json")) && packageHasNext(text)) findings.push(finding("LEGACY_NEXT_RUNTIME", path));
  }
  return findings;
}
function run(root, manifestPath) {
  const findings = [];
  let manifest;
  try { manifest = parseManifest(manifestPath); } catch (error) { findings.push(finding(error.message)); }
  if (manifest?.sourceMode === "optional-local" && !ignoredLocalConfig(root)) findings.push(finding("OPTIONAL_LOCAL_CONFIG_NOT_IGNORED", ".gitignore"));
  findings.push(...scan(root, manifest));
  const report = stable({ findings: findings.sort((a, b) => compare(a.code + "|" + a.path + "|" + a.detail, b.code + "|" + b.path + "|" + b.detail)), manifest: manifest ? { schemaVersion: manifest.schemaVersion, sourceMode: manifest.sourceMode } : null, status: findings.length ? "FAIL" : "PASS" });
  process.stdout.write(JSON.stringify(report) + "\n");
  return findings.length ? 1 : 0;
}
function options(argv) {
  let root = process.cwd(); let manifest = null;
  for (let index = 0; index < argv.length; index += 1) {
    if (argv[index] === "--root") root = argv[++index];
    else if (argv[index] === "--manifest") manifest = argv[++index];
    else throw new Error("USAGE: check-legacy-source-manifest.mjs [--root path] [--manifest path]");
  }
  root = resolve(root);
  return { manifest: manifest ? resolve(manifest) : join(root, "docs/migration/LEGACY-SOURCE-MANIFEST.yaml"), root };
}
try {
  const selected = options(process.argv.slice(2));
  process.exitCode = run(selected.root, selected.manifest);
} catch (error) {
  process.stdout.write(JSON.stringify(stable({ findings: [finding("CHECKER_CONFIGURATION_ERROR", "", error.message)], manifest: null, status: "FAIL" })) + "\n");
  process.exitCode = 1;
}
