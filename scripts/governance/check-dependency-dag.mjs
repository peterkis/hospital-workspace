#!/usr/bin/env node

import { existsSync, readFileSync, readdirSync, statSync } from "node:fs";
import { dirname, extname, join, relative, resolve, sep } from "node:path";

const SOURCE_EXTENSIONS = new Set([".cjs", ".cts", ".js", ".jsx", ".mjs", ".mts", ".ts", ".tsx"]);
const DISCOVERY_SKIPPED_DIRECTORIES = new Set([".git", "coverage", "dist", "node_modules", "out", "target"]);
const WORKSPACE_FILE_SKIPPED_DIRECTORIES = new Set([".git", "node_modules"]);

function compareCodePoint(left, right) {
  const leftValue = String(left);
  const rightValue = String(right);
  return leftValue === rightValue ? 0 : leftValue < rightValue ? -1 : 1;
}

function sorted(values) {
  return [...values].sort(compareCodePoint);
}

function asPosix(value) {
  return value.split(sep).join("/");
}

function readJson(file, label) {
  try {
    return JSON.parse(readFileSync(file, "utf8"));
  } catch {
    throw new Error(`invalid-json:${label}`);
  }
}

function finding(code, from = "", to = "", detail = "") {
  return { code, detail, from, to };
}

function wildcardMatches(pattern, value) {
  let source = "^";
  for (let index = 0; index < pattern.length; index += 1) {
    const character = pattern[index];
    if (character === "*") {
      if (pattern[index + 1] === "*") {
        index += 1;
        if (pattern[index + 1] === "/") {
          index += 1;
          source += "(?:.*/)?";
        } else {
          source += ".*";
        }
      } else {
        source += "[^/]*";
      }
    } else {
      source += character.replace(/[|\\{}()[\]^$+?.]/g, "\\$&");
    }
  }
  return new RegExp(`${source}$`).test(value);
}

function parseWorkspaceYaml(text) {
  if (text === "packages: []\n") return [];
  const lines = text.split("\n");
  if (lines.at(-1) === "") lines.pop();
  if (lines.shift() !== "packages:") throw new Error("invalid-workspace-yaml:expected-packages-key");
  const patterns = [];
  for (const line of lines) {
    const match = /^  - (?:"([^\"]+)"|'([^']+)')$/.exec(line);
    if (!match) throw new Error("invalid-workspace-yaml:expected-quoted-package-pattern");
    const pattern = match[1] ?? match[2];
    if (pattern.startsWith("/") || pattern.includes("..") || patterns.includes(pattern)) throw new Error(`invalid-workspace-pattern:${pattern}`);
    patterns.push(pattern);
  }
  return patterns;
}

function workspacePatterns(root) {
  try {
    return parseWorkspaceYaml(readFileSync(join(root, "pnpm-workspace.yaml"), "utf8"));
  } catch (error) {
    throw new Error(error?.code === "ENOENT" ? "missing-workspace-yaml" : error.message);
  }
}

function assertExactKeys(value, keys, code) {
  if (!value || typeof value !== "object" || Array.isArray(value) || sorted(Object.keys(value)).join("|") !== sorted(keys).join("|")) throw new Error(code);
}

function assertStringArray(value, code, knownValues = null) {
  if (!Array.isArray(value) || new Set(value).size !== value.length || value.some((entry) => typeof entry !== "string" || entry.length === 0 || (knownValues && !knownValues.has(entry)))) throw new Error(code);
}

function policyFor(file) {
  const policy = readJson(file, "dependency-policy");
  assertExactKeys(policy, ["allowedExternalDependenciesByLayer", "allowedInternalDependencies", "allowedTauriPlugins", "domainRepositoryOwners", "externalAllowlistEnforcedLayers", "firstPartyScope", "forbiddenExternalDependenciesByLayer", "forbiddenSourcePrefixesByLayer", "format", "layers", "limitations", "repositoryOwnership", "schemaVersion"], "invalid-dependency-policy-keys");
  if (policy.schemaVersion !== "hospital-workspace.dependency-policy.v1" || typeof policy.firstPartyScope !== "string" || !policy.firstPartyScope.endsWith("/") || typeof policy.format !== "string") throw new Error("invalid-dependency-policy-header");
  assertStringArray(policy.allowedTauriPlugins, "invalid-dependency-policy-tauri-plugins");
  assertStringArray(policy.limitations, "invalid-dependency-policy-limitations");
  if (!Array.isArray(policy.layers) || policy.layers.length === 0) throw new Error("invalid-dependency-policy-layers");
  const layerIds = new Set();
  for (const layer of policy.layers) {
    assertExactKeys(layer, ["id", "paths"], "invalid-dependency-policy-layer");
    if (typeof layer.id !== "string" || layer.id.length === 0 || layerIds.has(layer.id)) throw new Error("invalid-dependency-policy-layer-id");
    assertStringArray(layer.paths, "invalid-dependency-policy-layer-paths");
    if (layer.paths.length === 0) throw new Error("invalid-dependency-policy-layer-paths");
    layerIds.add(layer.id);
  }
  for (const [name, values, knownValues] of [
    ["allowedExternalDependenciesByLayer", policy.allowedExternalDependenciesByLayer, null],
    ["forbiddenExternalDependenciesByLayer", policy.forbiddenExternalDependenciesByLayer, null],
    ["forbiddenSourcePrefixesByLayer", policy.forbiddenSourcePrefixesByLayer, null],
    ["allowedInternalDependencies", policy.allowedInternalDependencies, layerIds]
  ]) {
    assertExactKeys(values, layerIds, `invalid-dependency-policy-${name}-keys`);
    for (const layerId of layerIds) assertStringArray(values[layerId], `invalid-dependency-policy-${name}`, knownValues);
  }
  assertStringArray(policy.externalAllowlistEnforcedLayers, "invalid-dependency-policy-external-allowlist-enforced-layers", layerIds);
  const enforcedLayers = new Set(policy.externalAllowlistEnforcedLayers);
  if (["contract", "domain-service", "frontend", "platform-service", "pure-utility"].some((layer) => !enforcedLayers.has(layer))) throw new Error("invalid-dependency-policy-external-allowlist-enforced-layers");
  if (!policy.repositoryOwnership || typeof policy.repositoryOwnership !== "object" || Array.isArray(policy.repositoryOwnership) || Object.entries(policy.repositoryOwnership).some(([key, value]) => key.length === 0 || typeof value !== "string" || value.length === 0)) throw new Error("invalid-dependency-policy-repository-ownership");
  assertStringArray(policy.domainRepositoryOwners, "invalid-dependency-policy-domain-repository-owners", new Set(Object.values(policy.repositoryOwnership)));
  return policy;
}

function normalizeOwnershipPath(value) {
  if (typeof value !== "string" || value.length === 0) throw new Error("invalid-ownership-path");
  const normalized = value.replaceAll("\\", "/").replace(/\/{2,}/g, "/").replace(/^\.\//, "");
  if (normalized.startsWith("/") || normalized.includes("..") || normalized.length === 0) throw new Error("invalid-ownership-path");
  return normalized;
}

function parseOwnershipYaml(text, label) {
  const lines = text.replaceAll("\r\n", "\n").split("\n").map((line) => stripOwnershipComment(line).replace(/[ \t]+$/, "")).filter((line) => line.trim().length > 0);
  let index = 0;
  const topLevel = {};
  const rules = [];
  const constraints = {};
  while (index < lines.length) {
    if (/^\s/.test(lines[index])) throw new Error(`invalid-ownership-top-level:${label}`);
    const [key, value] = ownershipMapping(lines[index++], label);
    if (Object.hasOwn(topLevel, key)) throw new Error(`invalid-ownership-top-level:${label}`);
    topLevel[key] = true;
    if (key === "schemaVersion") {
      if (ownershipScalar(value, label) !== "hospital-workspace.path-ownership.v1") throw new Error(`invalid-ownership-schema:${label}`);
      continue;
    }
    if (key === "rules") {
      if (value !== "") throw new Error(`invalid-ownership-rules:${label}`);
      while (index < lines.length && lines[index].startsWith("- ")) rules.push(parseOwnershipRule(lines, () => index, (next) => { index = next; }, label));
      continue;
    }
    if (key === "constraints") {
      if (value !== "") throw new Error(`invalid-ownership-constraints:${label}`);
      while (index < lines.length && /^  [A-Za-z]/.test(lines[index])) {
        const [constraint, rawValue] = ownershipMapping(lines[index++].slice(2), label);
        if (Object.hasOwn(constraints, constraint)) throw new Error(`invalid-ownership-constraints:${label}`);
        const parsed = ownershipScalar(rawValue, label);
        if (parsed !== "true" && parsed !== "false") throw new Error(`invalid-ownership-constraints:${label}`);
        constraints[constraint] = parsed === "true";
      }
      continue;
    }
    throw new Error(`invalid-ownership-top-level:${label}`);
  }
  assertExactKeys(topLevel, ["schemaVersion", "rules", "constraints"], `invalid-ownership-schema:${label}`);
  assertExactKeys(constraints, ["criticalRequiresTwoReviewRoles", "ownerAndReviewerMustDiffer", "unmatchedCriticalPathFails"], `invalid-ownership-constraints:${label}`);
  if (rules.length === 0) throw new Error(`invalid-ownership-rules:${label}`);
  const canonicalConstraints = Object.fromEntries(sorted(Object.keys(constraints)).map((key) => [key, constraints[key]]));
  return { constraints: canonicalConstraints, rules: rules.sort((left, right) => compareCodePoint(JSON.stringify(left), JSON.stringify(right))) };
}

function stripOwnershipComment(line) {
  let quote = null;
  for (let index = 0; index < line.length; index += 1) {
    const character = line[index];
    if (!quote && character === "#") return line.slice(0, index);
    if ((character === "'" || character === '"') && (!quote || quote === character)) quote = quote ? null : character;
  }
  return line;
}

function ownershipMapping(line, label) {
  const match = /^([A-Za-z][A-Za-z0-9]*):(.*)$/.exec(line);
  if (!match) throw new Error(`invalid-ownership-mapping:${label}`);
  return [match[1], match[2].trimStart()];
}

function ownershipScalar(value, label) {
  if (value.length === 0) throw new Error(`invalid-ownership-scalar:${label}`);
  if (value.startsWith('"')) {
    try {
      const parsed = JSON.parse(value);
      if (typeof parsed !== "string") throw new Error("not-string");
      return parsed;
    } catch {
      throw new Error(`invalid-ownership-scalar:${label}`);
    }
  }
  if (value.startsWith("'")) {
    if (!value.endsWith("'") || value.length < 2) throw new Error(`invalid-ownership-scalar:${label}`);
    return value.slice(1, -1).replaceAll("''", "'");
  }
  if (/\s|['"]/.test(value)) throw new Error(`invalid-ownership-scalar:${label}`);
  return value;
}

function parseOwnershipRule(lines, getIndex, setIndex, label) {
  let index = getIndex();
  const fields = {};
  let activeList = null;
  function addField(line) {
    const [key, value] = ownershipMapping(line, label);
    if (!(["ownerRole", "paths", "reviewRoles", "risk"].includes(key)) || Object.hasOwn(fields, key)) throw new Error(`invalid-ownership-rule:${label}`);
    if (["paths", "reviewRoles"].includes(key)) {
      if (value !== "") throw new Error(`invalid-ownership-rule:${label}`);
      fields[key] = [];
      activeList = key;
    } else {
      fields[key] = ownershipScalar(value, label);
      activeList = null;
    }
  }
  addField(lines[index++].slice(2));
  while (index < lines.length && /^  /.test(lines[index])) {
    const line = lines[index];
    if (line.startsWith("  - ")) {
      if (!activeList) throw new Error(`invalid-ownership-rule:${label}`);
      fields[activeList].push(ownershipScalar(line.slice(4), label));
    } else if (/^  [A-Za-z]/.test(line)) {
      addField(line.slice(2));
    } else {
      throw new Error(`invalid-ownership-rule:${label}`);
    }
    index += 1;
  }
  setIndex(index);
  assertExactKeys(fields, ["ownerRole", "paths", "reviewRoles", "risk"], `invalid-ownership-rule:${label}`);
  if (fields.paths.length === 0 || !["low", "high", "critical"].includes(fields.risk) || !/^[^\s]+$/.test(fields.ownerRole) || fields.reviewRoles.some((role) => !/^[^\s]+$/.test(role))) throw new Error(`invalid-ownership-rule:${label}`);
  const paths = fields.paths.map(normalizeOwnershipPath);
  if (new Set(paths).size !== paths.length) throw new Error(`invalid-ownership-rule:${label}`);
  return { ownerRole: fields.ownerRole, paths: sorted(paths), reviewRoles: sorted(fields.reviewRoles), risk: fields.risk };
}

function ownershipFrom(root, path, label) {
  const file = join(root, path);
  if (!existsSync(file)) return null;
  return parseOwnershipYaml(readFileSync(file, "utf8"), label);
}

function ownershipRulesConflict(left, right) {
  return left.ownerRole !== right.ownerRole || left.risk !== right.risk || JSON.stringify(left.reviewRoles) !== JSON.stringify(right.reviewRoles);
}

function globAutomaton(pattern) {
  const transitions = new Map();
  const epsilon = new Map();
  let node = 0;
  let nextNode = 1;
  const addTransition = (from, label, to) => {
    const current = transitions.get(from) ?? [];
    current.push({ label, to });
    transitions.set(from, current);
  };
  const addEpsilon = (from, to) => {
    const current = epsilon.get(from) ?? [];
    current.push(to);
    epsilon.set(from, current);
  };
  for (let index = 0; index < pattern.length; index += 1) {
    if (pattern[index] !== "*") {
      const next = nextNode++;
      addTransition(node, pattern[index], next);
      node = next;
      continue;
    }
    const doubleStar = pattern[index + 1] === "*";
    if (!doubleStar) {
      const next = nextNode++;
      addEpsilon(node, next);
      addTransition(node, "NONSLASH", node);
      node = next;
      continue;
    }
    index += 1;
    if (pattern[index + 1] === "/") {
      index += 1;
      const next = nextNode++;
      const loop = nextNode++;
      addEpsilon(node, next);
      addTransition(node, "ANY", loop);
      addTransition(loop, "ANY", loop);
      addTransition(loop, "/", next);
      node = next;
      continue;
    }
    const next = nextNode++;
    addEpsilon(node, next);
    addTransition(node, "ANY", node);
    node = next;
  }
  return { accept: node, epsilon, start: 0, transitions };
}

function epsilonClosure(automaton, states) {
  const result = new Set(states);
  const pending = sorted(states);
  while (pending.length > 0) {
    const state = pending.shift();
    for (const next of automaton.epsilon.get(state) ?? []) {
      if (!result.has(next)) {
        result.add(next);
        pending.push(next);
      }
    }
  }
  return sorted(result);
}

function acceptsLabel(label, character) {
  return label === "ANY" || (label === "NONSLASH" && character !== "/") || label === character;
}

function transitionForCharacter(automaton, states, character) {
  const next = new Set();
  for (const state of states) for (const transition of automaton.transitions.get(state) ?? []) if (acceptsLabel(transition.label, character)) next.add(transition.to);
  return epsilonClosure(automaton, next);
}

function overlapCharacters(left, leftStates, right, rightStates) {
  const literals = new Set(["/", "a"]);
  for (const state of [...leftStates, ...rightStates]) {
    for (const transition of left.transitions.get(state) ?? []) if (transition.label !== "ANY" && transition.label !== "NONSLASH") literals.add(transition.label);
    for (const transition of right.transitions.get(state) ?? []) if (transition.label !== "ANY" && transition.label !== "NONSLASH") literals.add(transition.label);
  }
  return sorted(literals).filter((character) => transitionForCharacter(left, leftStates, character).length > 0 && transitionForCharacter(right, rightStates, character).length > 0);
}

function ownershipPatternsIntersect(leftPattern, rightPattern) {
  const left = globAutomaton(leftPattern);
  const right = globAutomaton(rightPattern);
  const initial = { left: epsilonClosure(left, [left.start]), right: epsilonClosure(right, [right.start]), witness: "" };
  const queue = [initial];
  const visited = new Set([`${initial.left.join(",")}|${initial.right.join(",")}`]);
  while (queue.length > 0) {
    const current = queue.shift();
    if (current.left.includes(left.accept) && current.right.includes(right.accept)) return { intersects: true, witness: current.witness };
    for (const character of overlapCharacters(left, current.left, right, current.right)) {
      const next = { left: transitionForCharacter(left, current.left, character), right: transitionForCharacter(right, current.right, character), witness: `${current.witness}${character}` };
      const key = `${next.left.join(",")}|${next.right.join(",")}`;
      if (!visited.has(key)) {
        visited.add(key);
        queue.push(next);
      }
    }
  }
  return { intersects: false, witness: "" };
}

function validateOwnership(root, findings) {
  const canonical = ownershipFrom(root, ".github/PATH-OWNERSHIP.yaml", "canonical");
  const mirror = ownershipFrom(root, "docs/governance/PATH-OWNERSHIP.yaml", "mirror");
  if (!canonical) {
    findings.push(finding("OWNERSHIP_CANONICAL_MISSING", ".github/PATH-OWNERSHIP.yaml"));
    return { authority: null, canonicalRuleCount: 0, mirrorRuleCount: mirror?.rules.length ?? 0 };
  }
  if (!mirror) {
    findings.push(finding("OWNERSHIP_MIRROR_MISSING", "docs/governance/PATH-OWNERSHIP.yaml"));
  } else if (JSON.stringify(canonical) !== JSON.stringify(mirror)) {
    findings.push(finding("OWNERSHIP_MIRROR_DRIFT", ".github/PATH-OWNERSHIP.yaml", "docs/governance/PATH-OWNERSHIP.yaml"));
  }
  for (const rule of canonical.rules) {
    if (new Set(rule.reviewRoles).size !== rule.reviewRoles.length) findings.push(finding("OWNERSHIP_DUPLICATE_REVIEWER", rule.ownerRole, rule.paths.join(",")));
    if (canonical.constraints.ownerAndReviewerMustDiffer && rule.reviewRoles.includes(rule.ownerRole)) findings.push(finding("OWNERSHIP_OWNER_REVIEWER_CONFLICT", rule.ownerRole, rule.paths.join(",")));
    const minimumReviewers = rule.risk === "critical" ? 2 : rule.risk === "high" ? 1 : 0;
    if (rule.reviewRoles.length < minimumReviewers) findings.push(finding("OWNERSHIP_REVIEW_CARDINALITY", rule.risk, rule.paths.join(",")));
  }
  const governanceRule = canonical.rules.find((rule) => rule.paths.includes("scripts/governance/**"));
  if (!governanceRule) findings.push(finding("OWNERSHIP_SCRIPTS_GOVERNANCE_MISSING", "scripts/governance/**"));
  else if (governanceRule.ownerRole !== "toolchain-owner" || governanceRule.risk !== "high" || !governanceRule.reviewRoles.includes("architecture-reviewer") || !governanceRule.reviewRoles.includes("supply-chain-reviewer")) findings.push(finding("OWNERSHIP_SCRIPTS_GOVERNANCE_INVALID", "scripts/governance/**"));
  for (let leftIndex = 0; leftIndex < canonical.rules.length; leftIndex += 1) {
    for (let rightIndex = leftIndex + 1; rightIndex < canonical.rules.length; rightIndex += 1) {
      const left = canonical.rules[leftIndex];
      const right = canonical.rules[rightIndex];
      for (const leftPath of left.paths) for (const rightPath of right.paths) {
        if (leftPath === rightPath) findings.push(finding("OWNERSHIP_DUPLICATE_RULE", leftPath));
        else if (ownershipRulesConflict(left, right)) {
          const intersection = ownershipPatternsIntersect(leftPath, rightPath);
          if (intersection.intersects) findings.push(finding("OWNERSHIP_CONFLICTING_OVERLAP", leftPath, rightPath, intersection.witness));
        }
      }
    }
  }
  return { authority: canonical, canonicalRuleCount: canonical.rules.length, mirrorRuleCount: mirror?.rules.length ?? 0 };
}

function resolveGovernedWorkspaces(records, ownership, findings) {
  if (!ownership) return [];
  const resolved = [];
  for (const record of records) {
    const governedPath = `${record.path}/package.json`;
    const matches = ownership.rules.filter((rule) => rule.paths.some((pattern) => wildcardMatches(pattern, governedPath)));
    if (matches.length === 0) {
      findings.push(finding("OWNERSHIP_UNOWNED_GOVERNED_PATH", record.path));
      continue;
    }
    const signatures = new Set(matches.map((rule) => JSON.stringify({ ownerRole: rule.ownerRole, reviewRoles: rule.reviewRoles, risk: rule.risk })));
    if (signatures.size > 1) {
      findings.push(finding("OWNERSHIP_GOVERNED_PATH_CONFLICT", record.path, sorted(signatures).join("|")));
      continue;
    }
    resolved.push({ ownerRole: matches[0].ownerRole, path: record.path });
  }
  return resolved.sort((left, right) => compareCodePoint(left.path, right.path));
}

function walk(root, visitor, skippedDirectories) {
  if (!existsSync(root)) return;
  for (const entry of readdirSync(root, { withFileTypes: true }).sort((left, right) => compareCodePoint(left.name, right.name))) {
    const path = join(root, entry.name);
    if (entry.isDirectory()) {
      if (!skippedDirectories.has(entry.name)) walk(path, visitor, skippedDirectories);
    } else if (entry.isFile()) {
      visitor(path);
    }
  }
}

function discoverPackages(root, policy) {
  const records = [];
  for (const folder of ["apps", "packages", "services"]) {
    walk(join(root, folder), (file) => {
      if (file.endsWith(`${sep}package.json`)) {
        const directory = dirname(file);
        const path = asPosix(relative(root, directory));
        const manifest = readJson(file, `manifest:${path}`);
        const layer = policy.layers.find((candidate) => candidate.paths.some((pattern) => wildcardMatches(pattern, path)))?.id;
        records.push({ directory, layer, manifest, path });
      }
    }, DISCOVERY_SKIPPED_DIRECTORIES);
  }
  return records.sort((left, right) => compareCodePoint(left.path, right.path));
}

function workspaceFiles(record) {
  const files = [];
  walk(record.directory, (file) => files.push(file), WORKSPACE_FILE_SKIPPED_DIRECTORIES);
  return sorted(files);
}

function sourceSpecifiers(file) {
  const text = readFileSync(file, "utf8");
  const found = new Set();
  const patterns = [
    /\b(?:import|export)\s+(?:[^"']*?\s+from\s+)?["']([^"']+)["']/g,
    /\brequire\(\s*["']([^"']+)["']\s*\)/g,
    /\bimport\(\s*["']([^"']+)["']\s*\)/g
  ];
  for (const pattern of patterns) for (const match of text.matchAll(pattern)) found.add(match[1]);
  return sorted(found);
}

function dependencyEntries(manifest) {
  const entries = [];
  for (const field of ["dependencies", "devDependencies", "optionalDependencies", "peerDependencies"]) {
    const values = manifest[field];
    if (!values || typeof values !== "object" || Array.isArray(values)) continue;
    for (const [name, version] of Object.entries(values)) entries.push({ field, name, version: String(version) });
  }
  return entries.sort((left, right) => compareCodePoint(`${left.name}\u0000${left.field}`, `${right.name}\u0000${right.field}`));
}

function declaresDependency(record, packageName) {
  return dependencyEntries(record.manifest).some((entry) => entry.name === packageName);
}

function packageForSpecifier(specifier, byName) {
  return sorted(byName.keys()).map((name) => ({ name, record: byName.get(name) })).find(({ name }) => specifier === name || specifier.startsWith(`${name}/`)) ?? null;
}

function subpath(specifier, packageName) {
  return specifier === packageName ? "." : `.${specifier.slice(packageName.length)}`;
}

function hasPublicExport(manifest, requestedSubpath) {
  const exportsField = manifest.exports;
  if (exportsField === undefined) return requestedSubpath === ".";
  if (typeof exportsField === "string") return requestedSubpath === ".";
  if (!exportsField || typeof exportsField !== "object" || Array.isArray(exportsField)) return false;
  const isSubpathMap = Object.keys(exportsField).some((key) => key.startsWith("."));
  if (requestedSubpath === ".") return isSubpathMap ? Object.prototype.hasOwnProperty.call(exportsField, ".") : true;
  return isSubpathMap && Object.prototype.hasOwnProperty.call(exportsField, requestedSubpath);
}

function domainFor(record, policy) {
  if (record.layer === "domain-service") return record.path.slice("services/".length);
  if (record.layer === "repository") {
    const base = record.path.slice("packages/".length).replace(/-repository$/, "");
    return policy.repositoryOwnership[base] ?? null;
  }
  return null;
}

function packageRoot(specifier) {
  if (specifier.startsWith("node:")) return specifier;
  if (specifier.startsWith("@")) {
    const parts = specifier.split("/");
    return parts.length >= 2 ? `${parts[0]}/${parts[1]}` : specifier;
  }
  return specifier.split("/")[0];
}

function isForbiddenSpecifier(layer, specifier, policy) {
  if (!layer) return false;
  const root = packageRoot(specifier);
  return (policy.forbiddenExternalDependenciesByLayer[layer] ?? []).includes(root) || (policy.forbiddenSourcePrefixesByLayer[layer] ?? []).some((prefix) => specifier.startsWith(prefix));
}

function externalAllowlistViolation(record, specifier, policy) {
  if (!record.layer || !policy.externalAllowlistEnforcedLayers.includes(record.layer)) return null;
  if (specifier.startsWith("node:")) return null;
  const root = packageRoot(specifier);
  if (root.startsWith("@tauri-apps/plugin-") && policy.allowedTauriPlugins.includes(root)) return null;
  if (policy.allowedExternalDependenciesByLayer[record.layer].includes(root)) return null;
  if (record.layer === "contract") return "CONTRACT_EXTERNAL_DEPENDENCY_NOT_ALLOWED";
  if (record.layer === "pure-utility") return "PURE_UTILITY_EXTERNAL_DEPENDENCY_NOT_ALLOWED";
  if (record.layer === "frontend") return "FRONTEND_EXTERNAL_DEPENDENCY_NOT_ALLOWED";
  return "SERVICE_EXTERNAL_DEPENDENCY_NOT_ALLOWED";
}

function validateEdge(policy, from, target, specifier, findings) {
  if (!from.layer || !target.layer) return;
  if (from.layer === "frontend" && ["database-runtime", "domain-service", "infrastructure-kernel", "platform-service", "repository"].includes(target.layer)) {
    findings.push(finding("FRONTEND_FORBIDDEN_RUNTIME", from.path, target.path, specifier));
    return;
  }
  if (["domain-service", "platform-service"].includes(from.layer) && target.layer === "ui") {
    findings.push(finding("SERVICE_UI_DEPENDENCY", from.path, target.path, specifier));
    return;
  }
  if (from.layer === "domain-service" && target.layer === "repository" && domainFor(from, policy) !== domainFor(target, policy)) {
    findings.push(finding("CROSS_DOMAIN_REPOSITORY", from.path, target.path, specifier));
    return;
  }
  const targetOwner = domainFor(target, policy);
  if (["services/collaboration", "services/agent-gateway"].includes(from.path) && target.layer === "repository" && policy.domainRepositoryOwners.includes(targetOwner)) {
    findings.push(finding("PLATFORM_DOMAIN_REPOSITORY", from.path, target.path, specifier));
    return;
  }
  if (["domain-service", "platform-service"].includes(from.layer) && target.layer === "repository" && targetOwner && from.path !== `services/${targetOwner}`) {
    findings.push(finding("NON_OWNER_REPOSITORY_DEPENDENCY", from.path, target.path, specifier));
    return;
  }
  if (!(policy.allowedInternalDependencies[from.layer] ?? []).includes(target.layer)) findings.push(finding("FORBIDDEN_LAYER_DEPENDENCY", from.path, target.path, specifier));
}

function packageContaining(records, path) {
  return records.find((record) => path === record.directory || path.startsWith(`${record.directory}${sep}`)) ?? null;
}

function relativeTarget(file, specifier) {
  const candidate = resolve(dirname(file), specifier);
  const candidates = [candidate, ...[".ts", ".tsx", ".mts", ".cts", ".js", ".mjs", ".cjs"].map((extension) => `${candidate}${extension}`), ...["index.ts", "index.tsx", "index.mts", "index.js", "index.mjs"].map((name) => join(candidate, name))];
  const fileTarget = candidates.find((path) => existsSync(path) && statSync(path).isFile());
  if (fileTarget) return fileTarget;
  return existsSync(candidate) && statSync(candidate).isDirectory() ? candidate : null;
}

function generatedSource(file, record) {
  const path = asPosix(relative(record.directory, file));
  return /(^|\/)(\.next|dist|generated|target)(\/|$)/.test(path) || path.startsWith("src/generated/") || /\.generated\.[^.]+$/.test(path) || /@generated\b/i.test(readFileSync(file, "utf8"));
}

function detectCycles(records, edges) {
  const adjacency = new Map(records.map((record) => [record.path, []]));
  for (const edge of edges) adjacency.get(edge.from.path)?.push(edge.to.path);
  for (const values of adjacency.values()) values.sort(compareCodePoint);
  const visiting = new Set();
  const visited = new Set();
  const stack = [];
  const cycles = new Set();
  function visit(node) {
    if (visiting.has(node)) {
      cycles.add([...stack.slice(stack.indexOf(node)), node].join(" -> "));
      return;
    }
    if (visited.has(node)) return;
    visiting.add(node);
    stack.push(node);
    for (const next of adjacency.get(node) ?? []) visit(next);
    stack.pop();
    visiting.delete(node);
    visited.add(node);
  }
  for (const node of sorted(adjacency.keys())) visit(node);
  return sorted(cycles);
}

function checkUniversalSpecifier(record, specifier, detail, policy, findings) {
  const root = packageRoot(specifier);
  if (specifier.startsWith("@portal/")) findings.push(finding("LEGACY_PORTAL_ALIAS", record.path, specifier, detail));
  if (root === "next" || root.startsWith("@next/")) findings.push(finding("UNAPPROVED_NEXTJS", record.path, specifier, detail));
  if (root.startsWith("@tauri-apps/plugin-") && !policy.allowedTauriPlugins.includes(root)) findings.push(finding("UNAPPROVED_TAURI_PLUGIN", record.path, specifier, detail));
  if (isForbiddenSpecifier(record.layer, specifier, policy)) {
    const code = record.layer === "contract" ? "CONTRACT_FORBIDDEN_RUNTIME" : record.layer === "frontend" ? "FRONTEND_FORBIDDEN_RUNTIME" : ["sdk-client", "ui"].includes(record.layer) ? "BROWSER_REACHABLE_FORBIDDEN_RUNTIME" : ["domain-service", "platform-service"].includes(record.layer) ? "SERVICE_RAW_DATABASE_DEPENDENCY" : record.layer === "pure-utility" ? "PURE_UTILITY_FORBIDDEN_RUNTIME" : "FORBIDDEN_RUNTIME_DEPENDENCY";
    findings.push(finding(code, record.path, specifier, detail));
  }
}

function validate(root, policy) {
  const findings = [];
  const ownership = validateOwnership(root, findings);
  const patterns = workspacePatterns(root);
  const records = discoverPackages(root, policy);
  const governedWorkspaceAuthorities = resolveGovernedWorkspaces(records, ownership.authority, findings);
  for (const pattern of patterns) if (!records.some((record) => wildcardMatches(pattern, record.path))) findings.push(finding("WORKSPACE_PATTERN_WITHOUT_MANIFEST", pattern));
  for (const record of records) if (!patterns.some((pattern) => wildcardMatches(pattern, record.path))) findings.push(finding("UNREGISTERED_WORKSPACE_MANIFEST", record.path));
  const byName = new Map();
  for (const record of records) {
    if (!record.layer) findings.push(finding("UNCLASSIFIED_WORKSPACE", record.path));
    if (record.layer === "repository" && !domainFor(record, policy)) findings.push(finding("UNOWNED_REPOSITORY", record.path));
    if (typeof record.manifest.name !== "string" || !record.manifest.name.startsWith(policy.firstPartyScope)) findings.push(finding("INVALID_FIRST_PARTY_PACKAGE_NAME", record.path));
    else if (byName.has(record.manifest.name)) findings.push(finding("DUPLICATE_PACKAGE_NAME", record.path, byName.get(record.manifest.name).path));
    else byName.set(record.manifest.name, record);
  }
  const edges = [];
  for (const record of records) {
    for (const entry of dependencyEntries(record.manifest)) {
      checkUniversalSpecifier(record, entry.name, entry.field, policy, findings);
      if (!entry.name.startsWith(policy.firstPartyScope)) {
        const code = externalAllowlistViolation(record, entry.name, policy);
        if (code) findings.push(finding(code, record.path, entry.name, entry.field));
      }
      const target = byName.get(entry.name);
      if (!entry.name.startsWith(policy.firstPartyScope)) continue;
      if (!target) findings.push(finding("INTERNAL_WORKSPACE_NOT_FOUND", record.path, entry.name, entry.field));
      else {
        if (!entry.version.startsWith("workspace:")) findings.push(finding("INTERNAL_WORKSPACE_PROTOCOL", record.path, entry.name, entry.version));
        edges.push({ from: record, to: target });
        validateEdge(policy, record, target, entry.name, findings);
      }
    }
    for (const file of workspaceFiles(record)) {
      const filePath = asPosix(relative(root, file));
      if (generatedSource(file, record)) findings.push(finding("COMMITTED_GENERATED_SOURCE", record.path, filePath));
      if (!SOURCE_EXTENSIONS.has(extname(file))) continue;
      for (const specifier of sourceSpecifiers(file)) {
        checkUniversalSpecifier(record, specifier, filePath, policy, findings);
        if (!specifier.startsWith(policy.firstPartyScope) && !specifier.startsWith(".") && !specifier.startsWith("/")) {
          const code = externalAllowlistViolation(record, specifier, policy);
          if (code) findings.push(finding(code, record.path, specifier, filePath));
        }
        if (specifier.startsWith(".") || specifier.startsWith("/")) {
          const targetPath = relativeTarget(file, specifier);
          const owner = targetPath ? packageContaining(records, targetPath) : null;
          if (owner && owner !== record) findings.push(finding("RELATIVE_CROSS_WORKSPACE_IMPORT", record.path, owner.path, filePath));
          continue;
        }
        if (!specifier.startsWith(policy.firstPartyScope)) continue;
        const targetPackage = packageForSpecifier(specifier, byName);
        if (!targetPackage) {
          findings.push(finding("INTERNAL_WORKSPACE_NOT_FOUND", record.path, specifier, filePath));
          continue;
        }
        const requestedSubpath = subpath(specifier, targetPackage.name);
        if (requestedSubpath !== "." && /(^|\/)(src|internal)(\/|$)/.test(requestedSubpath.slice(2))) {
          findings.push(finding("PRIVATE_DEEP_IMPORT", record.path, specifier, filePath));
          continue;
        }
        if (!hasPublicExport(targetPackage.record.manifest, requestedSubpath)) {
          findings.push(finding("PUBLIC_ENTRYPOINT_VIOLATION", record.path, specifier, filePath));
          continue;
        }
        if (record.layer === "domain-service" && targetPackage.record.layer === "domain-service" && domainFor(record, policy) !== domainFor(targetPackage.record, policy) && /(^|\/)(models|prisma)(\/|$)/.test(requestedSubpath.slice(2))) {
          findings.push(finding("CROSS_DOMAIN_DATABASE_MODEL", record.path, targetPackage.record.path, specifier));
          continue;
        }
        if (!declaresDependency(record, targetPackage.name)) {
          findings.push(finding("UNDECLARED_WORKSPACE_IMPORT", record.path, targetPackage.name, filePath));
          continue;
        }
        edges.push({ from: record, to: targetPackage.record });
        validateEdge(policy, record, targetPackage.record, specifier, findings);
      }
    }
  }
  for (const cycle of detectCycles(records, edges)) findings.push(finding("CIRCULAR_DEPENDENCY", cycle));
  const canonicalFindings = findings.sort((left, right) => compareCodePoint(JSON.stringify(left), JSON.stringify(right)));
  const canonicalEdges = sorted(new Set(edges.map((edge) => `${edge.from.path}\u0000${edge.to.path}`))).map((edge) => {
    const [from, to] = edge.split("\u0000");
    return { from, to };
  });
  return {
    schemaVersion: "hospital-workspace.dependency-dag-report.v1",
    status: canonicalFindings.length === 0 ? "PASS" : "FAIL",
    workspacePatterns: sorted(patterns),
    ownership: { canonicalRuleCount: ownership.canonicalRuleCount, mirrorRuleCount: ownership.mirrorRuleCount },
    governedWorkspaceAuthorities,
    workspaceCount: records.length,
    workspaces: records.map((record) => ({ layer: record.layer ?? null, name: record.manifest.name ?? null, path: record.path })),
    edges: canonicalEdges,
    findings: canonicalFindings
  };
}

function parseArgs(argv) {
  const options = { policy: null, root: process.cwd() };
  for (let index = 0; index < argv.length; index += 1) {
    const argument = argv[index];
    if (argument !== "--policy" && argument !== "--root") throw new Error(`unknown-argument:${argument}`);
    const value = argv[index + 1];
    if (!value) throw new Error(`missing-value:${argument}`);
    options[argument.slice(2)] = value;
    index += 1;
  }
  options.root = resolve(options.root);
  options.policy = resolve(options.policy ?? join(options.root, "docs/governance/DEPENDENCY-POLICY.yaml"));
  return options;
}

function main() {
  try {
    const options = parseArgs(process.argv.slice(2));
    const report = validate(options.root, policyFor(options.policy));
    process.stdout.write(`${JSON.stringify(report, null, 2)}\n`);
    return report.status === "PASS" ? 0 : 1;
  } catch (error) {
    process.stdout.write(`${JSON.stringify({ schemaVersion: "hospital-workspace.dependency-dag-report.v1", status: "FAIL", findings: [finding("CHECKER_CONFIGURATION_ERROR", "", "", error.message)] }, null, 2)}\n`);
    return 1;
  }
}

process.exitCode = main();
