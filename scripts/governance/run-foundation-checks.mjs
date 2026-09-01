#!/usr/bin/env node

import { existsSync, mkdirSync, realpathSync, unlinkSync, writeFileSync, readFileSync } from "node:fs";
import { dirname, isAbsolute, join, relative, resolve, sep } from "node:path";
import { spawnSync } from "node:child_process";
import { fileURLToPath } from "node:url";

const PLAN = [
  ["pnpm-install", "pnpm", ["install", "--frozen-lockfile"]], ["build", "pnpm", ["run", "build"]], ["lint", "pnpm", ["run", "lint"]], ["typecheck", "pnpm", ["run", "typecheck"]], ["test", "pnpm", ["run", "test"]], ["check", "pnpm", ["run", "check"]], ["format-check", "pnpm", ["run", "format:check"]],
  ["dependency-dag", "node", ["scripts/governance/check-dependency-dag.mjs"]], ["dependency-dag-tests", "node", ["--test", "scripts/governance/check-dependency-dag.test.mjs"]], ["legacy-source-manifest", "node", ["scripts/migration/check-legacy-source-manifest.mjs"]], ["legacy-source-manifest-tests", "node", ["--test", "scripts/migration/check-legacy-source-manifest.test.mjs"]], ["public-validator", "python", ["tools/validate_repository.py", "--git-index"]], ["public-safety", "node", ["scripts/governance/check-public-safety.mjs", "--git-index"]], ["public-safety-tests", "node", ["--test", "scripts/governance/check-public-safety.test.mjs"]], ["evidence-manifest", "node", ["scripts/governance/check-evidence-manifest.mjs", "--template"]], ["evidence-manifest-tests", "node", ["--test", "scripts/governance/check-evidence-manifest.test.mjs"]], ["foundation-runner-tests", "node", ["--test", "scripts/governance/run-foundation-checks.test.mjs"]]
];
const ZERO = "0".repeat(40); const SHA = /^[0-9a-f]{40}$/;
function git(root, args) { return spawnSync("git", ["-c", `safe.directory=${root.split(sep).join("/")}`, "-C", root, ...args], { encoding: "utf8" }); }
function gitObject(root, sha) { const result = git(root, ["cat-file", "-e", `${sha}^{commit}`]); return result.status === 0 && !result.error; }
function eventValue(value) { return typeof value === "string" ? value.toLowerCase() : ""; }
function emptyTree(root) { const result = spawnSync("git", ["-c", `safe.directory=${root.split(sep).join("/")}`, "-C", root, "mktree"], { encoding: "utf8", input: "" }); const tree = result.stdout?.trim(); if (result.status !== 0 || result.error || !SHA.test(tree ?? "")) throw new Error("EMPTY_TREE_CREATION_FAILED"); return tree; }
function changedFileCount(root, args) { const result = spawnSync("git", ["-c", `safe.directory=${root.split(sep).join("/")}`, "-C", root, ...args, "-z"], { encoding: "buffer" }); return result.status === 0 && !result.error ? { error: false, count: [...result.stdout].filter((byte) => byte === 0).length } : { error: true, count: 0 }; }

export function verifyEventDiff(root, environment = process.env) {
  const eventType = environment.GITHUB_EVENT_NAME; const eventPath = environment.GITHUB_EVENT_PATH;
  if (!["pull_request", "push"].includes(eventType)) throw new Error("UNSUPPORTED_GITHUB_EVENT_TYPE");
  if (!eventPath || !existsSync(eventPath)) throw new Error("GITHUB_EVENT_PATH_UNREADABLE");
  let event; try { event = JSON.parse(readFileSync(eventPath, "utf8")); } catch { throw new Error("GITHUB_EVENT_INVALID_JSON"); }
  let base; let head; let mode; let diffArgs; let countArgs;
  if (eventType === "pull_request") {
    base = eventValue(event?.pull_request?.base?.sha); head = eventValue(event?.pull_request?.head?.sha); mode = "three-dot";
    if (!SHA.test(base) || !SHA.test(head)) throw new Error("PULL_REQUEST_DIFF_BINDING_INVALID");
    diffArgs = ["diff", "--check", `${base}...${head}`]; countArgs = ["diff", "--name-only", `${base}...${head}`];
  } else {
    base = eventValue(event?.before); head = eventValue(event?.after);
    if (!SHA.test(head) || (base !== ZERO && !SHA.test(base))) throw new Error("PUSH_DIFF_BINDING_INVALID");
    if (base === ZERO) { const rootTree = emptyTree(root); mode = "empty-tree"; diffArgs = ["diff", "--check", rootTree, head]; countArgs = ["diff", "--name-only", rootTree, head]; }
    else { mode = "two-dot"; diffArgs = ["diff", "--check", `${base}..${head}`]; countArgs = ["diff", "--name-only", `${base}..${head}`]; }
  }
  if (!gitObject(root, head) || (base !== ZERO && !gitObject(root, base))) throw new Error("DIFF_GIT_OBJECT_MISSING");
  const diff = git(root, diffArgs); if (diff.error || diff.status === null) throw new Error("DIFF_COMMAND_DID_NOT_EXECUTE");
  const count = changedFileCount(root, countArgs); if (count.error) throw new Error("DIFF_CHANGED_FILE_COUNT_FAILED");
  return { eventType, base, head, diffMode: mode, changedFileCount: count.count, exitCode: diff.status };
}

function planJson() { return PLAN.map(([id, command, args]) => ({ id, command, args })).concat([{ id: "real-diff-check", command: "git-event-diff", args: ["GITHUB_EVENT_PATH"] }]); }
function within(root, target) { const distance = relative(root, target); return distance === "" || (!isAbsolute(distance) && distance !== ".." && !distance.startsWith(`..${sep}`)); }
function physicalDestination(destination) { const missing = []; let existing = destination; while (!existsSync(existing)) { const parent = dirname(existing); if (parent === existing) throw new Error("REPORT_DIRECTORY_HAS_NO_EXISTING_ANCESTOR"); missing.unshift(existing.slice(parent.length).replace(/^[/\\]+/, "")); existing = parent; } return resolve(realpathSync.native(existing), ...missing); }
function outputDirectory(root, requested) { const projected = physicalDestination(requested); if (within(root, projected)) throw new Error("REPORT_DIRECTORY_MUST_BE_OUTSIDE_REPOSITORY"); mkdirSync(projected, { recursive: true }); const canonical = realpathSync.native(projected); if (within(root, canonical)) throw new Error("REPORT_DIRECTORY_MUST_BE_OUTSIDE_REPOSITORY"); return canonical; }
function ciBinding(root) { const commit = process.env.HW_CI_COMMIT_SHA; const runId = process.env.HW_CI_RUN_ID; const attempt = process.env.HW_CI_RUN_ATTEMPT; if (!SHA.test(commit ?? "") || !/^\d+$/.test(runId ?? "") || !/^\d+$/.test(attempt ?? "")) throw new Error("INVALID_CI_BINDING_ENVIRONMENT"); const head = git(root, ["rev-parse", "HEAD"]); if (head.status !== 0 || head.stdout.trim() !== commit) throw new Error("CI_BINDING_DOES_NOT_MATCH_CHECKED_OUT_HEAD"); return { commitSha: commit, workflowRun: { attempt, id: runId } }; }
function reportPayload(schemaVersion, status, binding, checks, extra = {}) { return { schemaVersion, status, commitSha: binding.commitSha, workflowRun: binding.workflowRun, checks, ...extra }; }
function writeExclusive(directory, entries) { const created = []; try { for (const [name, contents] of entries) { const file = join(directory, name); writeFileSync(file, `${JSON.stringify(contents, null, 2)}\n`, { encoding: "utf8", flag: "wx" }); created.push(file); } } catch (error) { for (const file of created.reverse()) unlinkSync(file); throw error; } }
function parseJsonOutput(id, output) { const line = output.trim().split("\n").filter((entry) => entry.trim().startsWith("{")).at(-1); try { return JSON.parse(line); } catch { return { findings: [{ path: "", rule: `${id}_OUTPUT_INVALID` }], status: "FAIL" }; } }
function options(argv) { let reportDir = null; let list = false; for (let index = 0; index < argv.length; index += 1) { if (argv[index] === "--list") list = true; else if (argv[index] === "--report-dir") reportDir = argv[++index] ?? ""; else throw new Error(`UNKNOWN_ARGUMENT:${argv[index]}`); } if (list && reportDir) throw new Error("LIST_CANNOT_WRITE_REPORTS"); if (!list && !reportDir) throw new Error("REPORT_DIRECTORY_REQUIRED"); return { list, reportDir }; }
function main() { const selected = options(process.argv.slice(2)); if (selected.list) { process.stdout.write(`${JSON.stringify({ schemaVersion: "hospital-workspace.foundation-check-plan.v1", commands: planJson() })}\n`); return; } const root = realpathSync.native(process.cwd()); const binding = ciBinding(root); const checks = []; let publicSafety = null; let evidence = null; const realDiff = verifyEventDiff(root); checks.push({ id: "real-diff-check", status: realDiff.exitCode === 0 ? "PASS" : "FAIL", ...realDiff }); for (const [id, executable, args] of PLAN) { process.stdout.write(`::group::START ${id}\n`); const result = spawnSync(process.platform === "win32" && executable === "pnpm" ? "pnpm.cmd" : executable, args, { cwd: root, encoding: "utf8" }); process.stdout.write(result.stdout ?? ""); process.stderr.write(result.stderr ?? ""); if (result.error) process.stderr.write(`${result.error.message}\n`); process.stdout.write(`::endgroup::\n[foundation-check] END ${id} exit=${result.status ?? "spawn-error"}\n`); checks.push({ id, status: result.status === 0 && !result.error ? "PASS" : "FAIL" }); if (id === "public-safety") publicSafety = parseJsonOutput(id, result.stdout ?? ""); if (id === "evidence-manifest") evidence = parseJsonOutput(id, result.stdout ?? ""); } const status = checks.every((entry) => entry.status === "PASS") ? "PASS" : "FAIL"; const directory = outputDirectory(root, resolve(selected.reportDir)); writeExclusive(directory, [["foundation-check-report.json", reportPayload("hospital-workspace.foundation-check-report.v1", status, binding, checks)], ["public-safety-report.json", reportPayload("hospital-workspace.public-safety-artifact.v1", publicSafety?.status === "PASS" ? "PASS" : "FAIL", binding, [{ id: "public-safety", status: publicSafety?.status ?? "FAIL" }], { findings: publicSafety?.findings ?? [] })], ["evidence-schema-report.json", reportPayload("hospital-workspace.evidence-schema-artifact.v1", evidence?.status === "PASS" ? "PASS" : "FAIL", binding, [{ id: "evidence-manifest", status: evidence?.status ?? "FAIL" }], { findings: evidence?.findings ?? [] })]]); process.exitCode = status === "PASS" ? 0 : 1; }
if (process.argv[1] && resolve(process.argv[1]) === resolve(fileURLToPath(import.meta.url))) { try { main(); } catch (error) { process.stderr.write(`${error.message}\n`); process.exitCode = 1; } }
