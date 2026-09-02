#!/usr/bin/env node

import {
  existsSync,
  mkdirSync,
  readFileSync,
  readdirSync,
  realpathSync,
  unlinkSync,
  writeFileSync
} from "node:fs";
import { basename, isAbsolute, resolve, relative, dirname, join, sep } from "node:path";

const NODE_VERSION = "24.18.0";
const PNPM_VERSION = "11.17.0";
const TYPESCRIPT_VERSION = "7.0.2";
const ROOT_DEV_DEPENDENCIES = Object.freeze({
  ajv: "8.20.0",
  "ajv-formats": "3.0.1",
  typescript: TYPESCRIPT_VERSION
});
const QUALITY_SCRIPTS = ["build", "lint", "typecheck", "test", "check", "format:check"];
const PROHIBITED_LOCKFILES = new Set([
  "package-lock.json",
  "npm-shrinkwrap.json",
  "yarn.lock",
  "bun.lock",
  "bun.lockb"
]);
const SKIPPED_DIRECTORIES = new Set([
  ".git",
  "node_modules",
  ".pnpm",
  ".turbo",
  "build",
  "coverage",
  "dist",
  "out"
]);
const FORMAT_FILES = [
  "package.json",
  "pnpm-workspace.yaml",
  ".npmrc",
  ".nvmrc",
  "tsconfig.json",
  "tsconfig.base.json",
  "pnpm-lock.yaml",
  "scripts/governance/check-workspace-contract.mjs",
  "scripts/governance/check-workspace-contract.test.mjs"
];

function fail(errors, message) {
  errors.push(message);
}

function asPosix(value) {
  return value.split(sep).join("/");
}

function readText(file, errors, label) {
  try {
    return readFileSync(file, "utf8");
  } catch (error) {
    fail(errors, `missing-or-unreadable:${label}`);
    return "";
  }
}

function readJson(file, errors, label) {
  const text = readText(file, errors, label);
  if (!text) {
    return null;
  }
  try {
    return JSON.parse(text);
  } catch (error) {
    fail(errors, `invalid-json:${label}`);
    return null;
  }
}

function parseWorkspaceYaml(text, errors) {
  if (text === "packages: []\n") {
    return [];
  }

  const lines = text.split("\n");
  if (lines.at(-1) === "") {
    lines.pop();
  }
  if (lines.shift() !== "packages:") {
    fail(errors, "invalid-workspace-yaml:expected-packages-key");
    return [];
  }

  const patterns = [];
  for (const line of lines) {
    const match = /^  - (?:"([^\"]+)"|'([^']+)')$/.exec(line);
    if (!match) {
      fail(errors, "invalid-workspace-yaml:expected-quoted-package-pattern");
      return [];
    }
    const pattern = match[1] ?? match[2];
    if (pattern.startsWith("/") || pattern.includes("..") || patterns.includes(pattern)) {
      fail(errors, `invalid-workspace-pattern:${pattern}`);
      continue;
    }
    patterns.push(pattern);
  }
  return patterns;
}

function workspaceYaml(patterns) {
  if (patterns.length === 0) {
    return "packages: []\n";
  }
  return `packages:\n${patterns.map((pattern) => `  - \"${pattern}\"`).join("\n")}\n`;
}

function walk(root, visitor) {
  function visit(directory) {
    for (const entry of readdirSync(directory, { withFileTypes: true }).sort((a, b) => a.name.localeCompare(b.name))) {
      if (entry.isDirectory()) {
        if (!SKIPPED_DIRECTORIES.has(entry.name)) {
          visit(join(directory, entry.name));
        }
      } else if (entry.isFile()) {
        visitor(join(directory, entry.name));
      }
    }
  }
  visit(root);
}

function discover(root) {
  const packages = [];
  const locks = [];
  const prohibitedLocks = [];
  walk(root, (file) => {
    const name = file.slice(file.lastIndexOf(sep) + 1);
    const pathFromRoot = asPosix(relative(root, file));
    if (name === "package.json" && pathFromRoot !== "package.json") {
      packages.push(asPosix(relative(root, dirname(file))));
    }
    if (name === "pnpm-lock.yaml") {
      locks.push(pathFromRoot);
    }
    if (PROHIBITED_LOCKFILES.has(name)) {
      prohibitedLocks.push(pathFromRoot);
    }
  });
  return {
    packages: packages.sort(),
    locks: locks.sort(),
    prohibitedLocks: prohibitedLocks.sort()
  };
}

function patternMatches(pattern, directory) {
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
  return new RegExp(`${source}$`).test(directory);
}

function nonEmptyString(value) {
  return typeof value === "string" && value.trim().length > 0;
}

function checkScripts(manifest, label, errors, allowNotApplicable) {
  const scripts = manifest.scripts;
  if (!scripts || typeof scripts !== "object" || Array.isArray(scripts)) {
    fail(errors, `missing-scripts:${label}`);
    return;
  }

  const contract = manifest.workspaceContract;
  const notApplicable = contract?.notApplicable;
  if (contract !== undefined && (!contract || typeof contract !== "object" || Array.isArray(contract))) {
    fail(errors, `invalid-workspace-contract:${label}`);
  }
  if (notApplicable !== undefined && (!notApplicable || typeof notApplicable !== "object" || Array.isArray(notApplicable))) {
    fail(errors, `invalid-not-applicable:${label}`);
  }
  if (!allowNotApplicable && notApplicable !== undefined) {
    fail(errors, `root-not-applicable-not-allowed:${label}`);
  }

  for (const [name, command] of Object.entries(scripts)) {
    if (!nonEmptyString(command)) {
      fail(errors, `empty-script:${label}:${name}`);
      continue;
    }
    if (/\b(?:npm|yarn|bun|npx)\b/i.test(command)) {
      fail(errors, `prohibited-package-manager-fallback:${label}:${name}`);
    }
    if (command.includes("--if-present")) {
      fail(errors, `prohibited-if-present:${label}:${name}`);
    }
    if (/(?:^|[^a-z])phase(?:[-_:]?\d+)?(?:$|[^a-z])/i.test(name) || /(?:^|[^a-z])phase(?:[-_:]?\d+)?(?:$|[^a-z])/i.test(command)) {
      fail(errors, `prohibited-legacy-phase-script:${label}:${name}`);
    }
  }

  for (const script of QUALITY_SCRIPTS) {
    const command = scripts[script];
    const rationale = notApplicable?.[script];
    if (command !== undefined && rationale !== undefined) {
      fail(errors, `ambiguous-quality-script:${label}:${script}`);
      continue;
    }
    if (command !== undefined) {
      if (!nonEmptyString(command)) {
        fail(errors, `empty-script:${label}:${script}`);
      }
      continue;
    }
    if (rationale !== undefined) {
      if (!allowNotApplicable || !nonEmptyString(rationale)) {
        fail(errors, `invalid-not-applicable-rationale:${label}:${script}`);
      }
      continue;
    }
    fail(errors, `missing-quality-script:${label}:${script}`);
  }

  if (notApplicable && typeof notApplicable === "object" && !Array.isArray(notApplicable)) {
    for (const [script, rationale] of Object.entries(notApplicable)) {
      if (!QUALITY_SCRIPTS.includes(script)) {
        fail(errors, `unknown-not-applicable-script:${label}:${script}`);
      }
      if (!nonEmptyString(rationale)) {
        fail(errors, `invalid-not-applicable-rationale:${label}:${script}`);
      }
    }
  }
}

function checkRootManifest(rootManifest, errors) {
  if (!rootManifest || typeof rootManifest !== "object" || Array.isArray(rootManifest)) {
    return;
  }
  if (rootManifest.private !== true) {
    fail(errors, "root-must-be-private");
  }
  if (rootManifest.packageManager !== `pnpm@${PNPM_VERSION}`) {
    fail(errors, "root-package-manager-must-be-pnpm-11.17.0");
  }
  if (rootManifest.engines?.node !== NODE_VERSION || rootManifest.engines?.pnpm !== PNPM_VERSION) {
    fail(errors, "root-engines-must-pin-node-and-pnpm");
  }
  const dependencies = ["dependencies", "optionalDependencies", "peerDependencies"];
  for (const field of dependencies) {
    if (rootManifest[field] && Object.keys(rootManifest[field]).length > 0) {
      fail(errors, `root-unapproved-dependencies:${field}`);
    }
  }
  const devDependencies = rootManifest.devDependencies;
  if (
    !devDependencies ||
    Object.keys(devDependencies).length !== Object.keys(ROOT_DEV_DEPENDENCIES).length ||
    Object.entries(ROOT_DEV_DEPENDENCIES).some(([name, version]) => devDependencies[name] !== version)
  ) {
    fail(errors, "root-dev-dependencies-must-match-approved-exact-set");
  }
  checkScripts(rootManifest, "root", errors, false);
}

function checkConfig(root, errors) {
  if (readText(join(root, ".nvmrc"), errors, ".nvmrc") !== `${NODE_VERSION}\n`) {
    fail(errors, "nvmrc-must-pin-node-24.18.0");
  }
  if (readText(join(root, ".npmrc"), errors, ".npmrc") !== "engine-strict=true\npackage-manager-strict=true\npackage-manager-strict-version=true\n") {
    fail(errors, "npmrc-must-enforce-pinned-toolchain");
  }

  const base = readJson(join(root, "tsconfig.base.json"), errors, "tsconfig.base.json");
  const config = readJson(join(root, "tsconfig.json"), errors, "tsconfig.json");
  const options = base?.compilerOptions;
  if (options?.target !== "ES2024" || options?.module !== "NodeNext" || options?.moduleResolution !== "NodeNext" || options?.strict !== true || options?.noEmit !== true) {
    fail(errors, "tsconfig-base-must-be-strict-nodenext-noemit");
  }
  if (config?.extends !== "./tsconfig.base.json" || !Array.isArray(config?.files) || config.files.length !== 0) {
    fail(errors, "tsconfig-root-must-extend-base-with-no-root-sources");
  }
}

function checkFormat(root, errors) {
  for (const file of FORMAT_FILES) {
    const absolute = join(root, file);
    const text = readText(absolute, errors, file);
    if (!text) {
      continue;
    }
    if (text.includes("\r") || !text.endsWith("\n") || text.split("\n").some((line) => /[ \t]$/.test(line))) {
      fail(errors, `format-text:${file}`);
      continue;
    }
    if (file.endsWith(".json")) {
      try {
        if (text !== `${JSON.stringify(JSON.parse(text), null, 2)}\n`) {
          fail(errors, `format-json:${file}`);
        }
      } catch (error) {
        fail(errors, `format-json:${file}`);
      }
    }
  }
  const patterns = parseWorkspaceYaml(readText(join(root, "pnpm-workspace.yaml"), errors, "pnpm-workspace.yaml"), errors);
  if (readText(join(root, "pnpm-workspace.yaml"), errors, "pnpm-workspace.yaml") !== workspaceYaml(patterns)) {
    fail(errors, "format-workspace-yaml");
  }
}

function validate(root, formatCheck) {
  const errors = [];
  const rootManifest = readJson(join(root, "package.json"), errors, "package.json");
  checkRootManifest(rootManifest, errors);
  checkConfig(root, errors);

  const workspaceText = readText(join(root, "pnpm-workspace.yaml"), errors, "pnpm-workspace.yaml");
  const patterns = parseWorkspaceYaml(workspaceText, errors);
  const discovery = discover(root);
  if (discovery.locks.length !== 1 || discovery.locks[0] !== "pnpm-lock.yaml") {
    fail(errors, `pnpm-lockfile-set-mismatch:${discovery.locks.join(",") || "none"}`);
  }
  for (const lock of discovery.prohibitedLocks) {
    fail(errors, `prohibited-lockfile:${lock}`);
  }

  for (const pattern of patterns) {
    if (!discovery.packages.some((workspace) => patternMatches(pattern, workspace))) {
      fail(errors, `workspace-pattern-has-no-package:${pattern}`);
    }
  }
  for (const workspace of discovery.packages) {
    if (!patterns.some((pattern) => patternMatches(pattern, workspace))) {
      fail(errors, `unregistered-workspace:${workspace}`);
      continue;
    }
    const manifest = readJson(join(root, workspace, "package.json"), errors, `workspace:${workspace}`);
    if (!manifest || typeof manifest !== "object" || Array.isArray(manifest)) {
      continue;
    }
    if (manifest.packageManager !== undefined && manifest.packageManager !== `pnpm@${PNPM_VERSION}`) {
      fail(errors, `workspace-package-manager-must-be-pnpm-11.17.0:${workspace}`);
    }
    checkScripts(manifest, manifest.name || workspace, errors, true);
  }

  if (formatCheck) {
    checkFormat(root, errors);
  }

  const inventory = {
    schemaVersion: "hospital-workspace.workspace-inventory.v1",
    workspacePatterns: patterns,
    workspaceCount: discovery.packages.length,
    workspaces: discovery.packages
  };
  const toolchain = {
    schemaVersion: "hospital-workspace.toolchain-report.v1",
    node: NODE_VERSION,
    pnpm: PNPM_VERSION,
    typescript: TYPESCRIPT_VERSION,
    javascriptLockfiles: discovery.locks,
    prohibitedLockfiles: discovery.prohibitedLocks
  };
  return { errors, inventory, toolchain };
}

function parseArgs(argv) {
  const options = { root: process.cwd(), formatCheck: false, reportDir: null };
  for (let index = 0; index < argv.length; index += 1) {
    const argument = argv[index];
    if (argument === "--validate") {
      continue;
    }
    if (argument === "--format-check") {
      options.formatCheck = true;
      continue;
    }
    if (argument === "--root" || argument === "--report-dir") {
      const value = argv[index + 1];
      if (!value) {
        throw new Error(`missing-value:${argument}`);
      }
      options[argument === "--root" ? "root" : "reportDir"] = value;
      index += 1;
      continue;
    }
    throw new Error(`unknown-argument:${argument}`);
  }
  options.root = resolve(options.root);
  if (options.reportDir) {
    options.reportDir = resolve(options.reportDir);
  }
  return options;
}

function isRootOrDescendant(root, destination) {
  const rootToDestination = relative(root, destination);
  return rootToDestination === "" || (!isAbsolute(rootToDestination) && !rootToDestination.startsWith(`..${sep}`) && rootToDestination !== "..");
}

function physicalDestination(destination) {
  const missing = [];
  let existingAncestor = destination;
  while (!existsSync(existingAncestor)) {
    const parent = dirname(existingAncestor);
    if (parent === existingAncestor) {
      throw new Error("report-directory-has-no-existing-ancestor");
    }
    missing.unshift(basename(existingAncestor));
    existingAncestor = parent;
  }
  return resolve(realpathSync.native(existingAncestor), ...missing);
}

function writeReports(root, reportDir, inventory, toolchain) {
  const projectedReportDir = physicalDestination(reportDir);
  if (isRootOrDescendant(root, projectedReportDir)) {
    throw new Error("report-directory-must-be-outside-root");
  }
  mkdirSync(projectedReportDir, { recursive: true });
  const canonicalReportDir = realpathSync.native(projectedReportDir);
  if (isRootOrDescendant(root, canonicalReportDir)) {
    throw new Error("report-directory-must-be-outside-root");
  }
  const outputs = [
    { name: "workspace-inventory.json", contents: `${JSON.stringify(inventory, null, 2)}\n` },
    { name: "toolchain-report.json", contents: `${JSON.stringify(toolchain, null, 2)}\n` }
  ];
  for (const output of outputs) {
    if (existsSync(join(canonicalReportDir, output.name))) {
      throw new Error(`report-output-already-exists:${output.name}`);
    }
  }

  const created = [];
  let currentOutput;
  try {
    for (const output of outputs) {
      currentOutput = output;
      const outputPath = join(canonicalReportDir, output.name);
      writeFileSync(outputPath, output.contents, { encoding: "utf8", flag: "wx" });
      created.push(outputPath);
    }
  } catch (error) {
    for (const outputPath of created.reverse()) {
      unlinkSync(outputPath);
    }
    if (error?.code === "EEXIST") {
      throw new Error(`report-output-already-exists:${currentOutput.name}`);
    }
    throw error;
  }
}

function main() {
  let options;
  try {
    options = parseArgs(process.argv.slice(2));
    options.root = realpathSync.native(options.root);
  } catch (error) {
    process.stdout.write(`${JSON.stringify({ status: "FAIL", errors: [error.message] }, null, 2)}\n`);
    return 1;
  }
  const result = validate(options.root, options.formatCheck);
  if (result.errors.length > 0) {
    process.stdout.write(`${JSON.stringify({ status: "FAIL", errors: result.errors.sort() }, null, 2)}\n`);
    return 1;
  }
  try {
    if (options.reportDir) {
      writeReports(options.root, options.reportDir, result.inventory, result.toolchain);
    }
  } catch (error) {
    process.stdout.write(`${JSON.stringify({ status: "FAIL", errors: [error.message] }, null, 2)}\n`);
    return 1;
  }
  process.stdout.write(`${JSON.stringify({ status: "PASS", inventory: result.inventory, toolchain: result.toolchain }, null, 2)}\n`);
  return 0;
}

process.exitCode = main();
