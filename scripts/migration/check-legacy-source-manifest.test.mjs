import assert from "node:assert/strict";
import test from "node:test";
import { mkdtempSync, mkdirSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { dirname, join, resolve } from "node:path";
import { spawnSync } from "node:child_process";
import { negativeManifestCases, noSourceManifest, optionalLocalManifest, optionalLocalPublicScalarManifest } from "./fixtures/legacy-source/manifest-fixtures.mjs";

const repositoryRoot = resolve(import.meta.dirname, "../..");
const checker = join(repositoryRoot, "scripts/migration/check-legacy-source-manifest.mjs");
const dependencyChecker = join(repositoryRoot, "scripts/governance/check-dependency-dag.mjs");
const dependencyPolicy = join(repositoryRoot, "docs/governance/DEPENDENCY-POLICY.yaml");

function write(root, path, text) {
  const file = join(root, path);
  mkdirSync(dirname(file), { recursive: true });
  writeFileSync(file, text, "utf8");
}

function fixtureRoot(manifest = noSourceManifest) {
  const root = mkdtempSync(join(tmpdir(), "hospital-workspace-legacy-source-"));
  write(root, ".gitignore", "config/local/\n");
  write(root, "docs/migration/LEGACY-SOURCE-MANIFEST.yaml", `${JSON.stringify(manifest, null, 2)}\n`);
  if (manifest.sourceMode === "optional-local") {
    const initialized = spawnSync("git", ["init", "-q", root], { encoding: "utf8" });
    if (initialized.status !== 0) throw new Error(initialized.stderr);
    const staged = spawnSync("git", ["-C", root, "add", ".gitignore"], { encoding: "utf8" });
    if (staged.status !== 0) throw new Error(staged.stderr);
  }
  return root;
}

function run(root, manifest = null) {
  const args = [checker, "--root", root];
  if (manifest) args.push("--manifest", manifest);
  return spawnSync(process.execPath, args, { encoding: "utf8" });
}

function result(root, manifest = null) {
  const executed = run(root, manifest);
  return { ...executed, report: JSON.parse(executed.stdout) };
}

function assertPass(root, manifest = null) {
  const executed = result(root, manifest);
  assert.equal(executed.status, 0, executed.stdout);
  assert.equal(executed.report.status, "PASS", executed.stdout);
}

function assertFails(root, predicate) {
  const executed = result(root);
  assert.equal(executed.status, 1, executed.stdout);
  assert.equal(executed.report.status, "FAIL", executed.stdout);
  assert.equal(executed.report.findings.some(predicate), true, executed.stdout);
}

test("active repository no-source manifest is deterministic and valid without a checkout", () => {
  const first = run(repositoryRoot);
  const second = run(repositoryRoot);
  assert.equal(first.status, 0, first.stdout);
  assert.equal(first.stdout, second.stdout);
  assert.deepEqual(JSON.parse(first.stdout), {
    findings: [],
    manifest: { schemaVersion: "hospital-workspace.legacy-source.v2", sourceMode: "none" },
    status: "PASS"
  });
});

test("positive fixtures accept no-source, optional-local, reference-only, and do-not-migrate", () => {
  const manifests = [noSourceManifest, optionalLocalManifest(), optionalLocalPublicScalarManifest(), optionalLocalManifest("REFERENCE_ONLY"), optionalLocalManifest("DO_NOT_MIGRATE")];
  for (const manifest of manifests) {
    const root = fixtureRoot(manifest);
    try { assertPass(root); } finally { rmSync(root, { recursive: true, force: true }); }
  }
});

test("optional-local rejects a local input that is not ignored", () => {
  const root = mkdtempSync(join(tmpdir(), "hospital-workspace-legacy-source-"));
  try {
    write(root, "docs/migration/LEGACY-SOURCE-MANIFEST.yaml", `${JSON.stringify(optionalLocalManifest(), null, 2)}\n`);
    assertFails(root, (entry) => entry.code === "OPTIONAL_LOCAL_CONFIG_NOT_IGNORED");
  } finally { rmSync(root, { recursive: true, force: true }); }
});

test("an ignored untracked local optional-source input is not treated as tracked content", () => {
  const root = fixtureRoot(optionalLocalManifest());
  try {
    write(root, "config/local/legacy-source.yaml", "localPath: ../legacy\n");
    assertPass(root);
  } finally { rmSync(root, { recursive: true, force: true }); }
});

test("optional-local rejects Git ignore negations that re-expose the local source config", () => {
  const root = fixtureRoot(optionalLocalManifest());
  try {
    write(root, ".gitignore", "config/local/\n!config/local/\n!config/local/legacy-source.yaml\n");
    write(root, "config/local/legacy-source.yaml", "localPath: ../legacy\n");
    const staged = spawnSync("git", ["-C", root, "add", ".gitignore"], { encoding: "utf8" });
    assert.equal(staged.status, 0, staged.stderr);
    assertFails(root, (entry) => entry.code === "OPTIONAL_LOCAL_CONFIG_NOT_IGNORED");
  } finally { rmSync(root, { recursive: true, force: true }); }
});

test("optional-local rejects an untracked .gitignore as the ignore authority", () => {
  const root = fixtureRoot(optionalLocalManifest());
  try {
    const unstaged = spawnSync("git", ["-C", root, "rm", "--cached", ".gitignore"], { encoding: "utf8" });
    assert.equal(unstaged.status, 0, unstaged.stderr);
    assertFails(root, (entry) => entry.code === "OPTIONAL_LOCAL_CONFIG_NOT_IGNORED");
  } finally { rmSync(root, { recursive: true, force: true }); }
});

test("optional-local rejects .git/info/exclude as the ignore authority", () => {
  const root = fixtureRoot(optionalLocalManifest());
  try {
    const unstaged = spawnSync("git", ["-C", root, "rm", "--cached", ".gitignore"], { encoding: "utf8" });
    assert.equal(unstaged.status, 0, unstaged.stderr);
    rmSync(join(root, ".gitignore"));
    write(root, ".git/info/exclude", "config/local/\n");
    assertFails(root, (entry) => entry.code === "OPTIONAL_LOCAL_CONFIG_NOT_IGNORED");
  } finally { rmSync(root, { recursive: true, force: true }); }
});

for (const [name, expected, mutate] of negativeManifestCases) {
  test(`negative manifest fixture: ${name}`, () => {
    const manifest = name.startsWith("none-") ? structuredClone(noSourceManifest) : optionalLocalManifest();
    mutate(manifest);
    const root = fixtureRoot(manifest);
    try { assertFails(root, (entry) => entry.code === expected); } finally { rmSync(root, { recursive: true, force: true }); }
  });
}

test("strict JSON-compatible parsing rejects a duplicate object key", () => {
  const root = fixtureRoot();
  try {
    write(root, "docs/migration/LEGACY-SOURCE-MANIFEST.yaml", '{"schemaVersion":"hospital-workspace.legacy-source.v2","schemaVersion":"hospital-workspace.legacy-source.v2"}\n');
    assertFails(root, (entry) => entry.code === "MANIFEST_DUPLICATE_KEY");
  } finally { rmSync(root, { recursive: true, force: true }); }
});

test("optional-local rejects path-bearing identifiers and colon-bearing relative segments", () => {
  const cases = [
    ["OPTIONAL_SOURCE_INVALID_ID", (manifest) => { manifest.sources[0].id = "C:/Synthetic/private-source"; }],
    ["ADOPTION_SOURCE_ID", (manifest) => { manifest.adoptions[0].sourceId = "C:/Synthetic/private-source"; }],
    ["ADOPTION_TARGET_PATH", (manifest) => { manifest.adoptions[0].targetPath = "packages/C:/private"; }]
  ];
  for (const [expected, mutate] of cases) {
    const manifest = optionalLocalManifest();
    mutate(manifest);
    const root = fixtureRoot(manifest);
    try { assertFails(root, (entry) => entry.code === expected); } finally { rmSync(root, { recursive: true, force: true }); }
  }
});

const repositoryCases = [
  ["unregistered legacy copy", "apps/legacy-copy.ts", "export const x = 'LEGACY_SOURCE_COPY';\n", "UNREGISTERED_LEGACY_COPY"],
  ["migration documentation code copy", "docs/migration/adopted.ts", "export const x = 'LEGACY_SOURCE_COPY';\n", "UNREGISTERED_LEGACY_COPY"],
  ["program evidence code copy", "docs/program/evidence/adopted.rs", "const MARKER: &str = \"LEGACY_SOURCE_COPY\";\n", "UNREGISTERED_LEGACY_COPY"],
  ["public evidence code copy", "evidence/adopted.ps1", "$marker = 'LEGACY_SOURCE_COPY'\n", "UNREGISTERED_LEGACY_COPY"],
  ["oversized legacy copy", "packages/padded.ts", "x".repeat(1024 * 1024 + 1) + "LEGACY_SOURCE_COPY\n", "UNREGISTERED_LEGACY_COPY"],
  ["Rust legacy copy", "packages/neutral.rs", "const MARKER: &str = \"LEGACY_SOURCE_COPY\";\n", "UNREGISTERED_LEGACY_COPY"],
  ["portal alias", "packages/a.ts", "import '@portal/legacy';\n", "LEGACY_PORTAL_ALIAS"],
  ["portal alias in standalone declaration", "packages/legacy.d.ts", "import '@portal/legacy';\n", "LEGACY_PORTAL_ALIAS"],
  ["old Phase 01 script", "scripts/phase-01/run.mjs", "export {};\n", "LEGACY_PHASE_01"],
  ["old Phase 02 script", "scripts/phase-02/run.mjs", "export {};\n", "LEGACY_PHASE_02"],
  ["old Next runtime", "pages/index.tsx", "export default null;\n", "LEGACY_NEXT_RUNTIME"],
  ["noncanonical Next Pages route", "apps/old/pages/patient.tsx", "export default null;\n", "LEGACY_NEXT_RUNTIME"],
  ["nested Next configuration", "apps/old/next.config.mjs", "export default {};\n", "LEGACY_NEXT_RUNTIME"],
  ["Next environment declaration", "apps/old/next-env.d.ts", "declare namespace NodeJS {}\n", "LEGACY_NEXT_RUNTIME"],
  ["Next package dependency", "apps/old/package.json", '{"dependencies":{"next":"1.0.0"}}\n', "LEGACY_NEXT_RUNTIME"],
  ["Next package script", "apps/old/package.json", '{"scripts":{"build":"next build"}}\n', "LEGACY_NEXT_RUNTIME"],
  ["Next static import", "apps/old/next-import.ts", 'import { NextResponse } from "next/server";\n', "LEGACY_NEXT_RUNTIME"],
  ["Next require import", "apps/old/next-require.ts", 'const next = require("next/server");\n', "LEGACY_NEXT_RUNTIME"],
  ["Next dynamic import", "apps/old/next-dynamic.ts", 'const next = import("next");\n', "LEGACY_NEXT_RUNTIME"],
  ["canonical Next app entry", "apps/old/app/page.tsx", "export default null;\n", "LEGACY_NEXT_RUNTIME"],
  ["nested Next app page", "apps/old/app/patient/page.tsx", "export default null;\n", "LEGACY_NEXT_RUNTIME"],
  ["old root Prisma migration", "prisma/migrations/0001/init.sql", "-- synthetic\n", "LEGACY_ROOT_PRISMA"],
  ["generated JS beside TS", "packages/a.ts", "export {};\n", "GENERATED_BESIDE_TS"],
  ["tracked local source config", "config/local/legacy-source.yaml", "synthetic\n", "TRACKED_LOCAL_SOURCE_CONFIG"],
  ["Git submodule", ".gitmodules", "[submodule \"synthetic\"]\n", "GIT_SUBMODULE"],
  ["broad cherry-pick marker", "packages/a.ts", "// broadCherryPick\n", "BROAD_CHERRY_PICK"],
  ["imported Git history marker", "packages/a.ts", "// history import\n", "GIT_HISTORY_IMPORT"],
  ["legacy build dependency", "apps/old/package.json", '{"dependencies":{"legacy":"file:../legacy"}}\n', "LEGACY_BUILD_CI_RUNTIME_DEPENDENCY"],
  ["legacy CI dependency", ".github/workflows/check.yml", "run: node config/local/legacy-source.yaml\n", "LEGACY_BUILD_CI_RUNTIME_DEPENDENCY"],
  ["Windows package local dependency", "apps/old/package.json", '{"dependencies":{"legacy":"file:..\\\\legacy"}}\n', "LEGACY_BUILD_CI_RUNTIME_DEPENDENCY"],
  ["Windows workflow local source reference", ".github/workflows/check.yml", "run: node config\\local\\legacy-source.yaml\n", "LEGACY_BUILD_CI_RUNTIME_DEPENDENCY"],
  ["legacy file URI dependency", "apps/old/package.json", '{"dependencies":{"legacy":"file:///legacy"}}\n', "LEGACY_BUILD_CI_RUNTIME_DEPENDENCY"],
  ["network legacy file URI dependency", "apps/old/package.json", '{"dependencies":{"legacy":"file://synthetic-host/share/legacy"}}\n', "LEGACY_BUILD_CI_RUNTIME_DEPENDENCY"],
  ["Cargo Windows legacy dependency", "tools/Cargo.toml", "[dependencies]\nsynthetic = { path = \"..\\legacy\" }\n", "LEGACY_BUILD_CI_RUNTIME_DEPENDENCY"],
  ["Cargo drive legacy dependency", "tools/Cargo.toml", "[dependencies]\nsynthetic = { path = \"C:\\Synthetic\\legacy\" }\n", "LEGACY_BUILD_CI_RUNTIME_DEPENDENCY"],
  ["Cargo root drive legacy dependency", "tools/Cargo.toml", "[dependencies]\nsynthetic = { path = \"C:\\legacy\" }\n", "LEGACY_BUILD_CI_RUNTIME_DEPENDENCY"],
  ["Cargo UNC legacy dependency", "tools/Cargo.toml", "[dependencies]\nsynthetic = { path = \"\\\\synthetic-host\\share\\legacy\" }\n", "LEGACY_BUILD_CI_RUNTIME_DEPENDENCY"],
  ["Cargo POSIX legacy dependency", "tools/Cargo.toml", "[dependencies]\nsynthetic = { path = \"/synthetic/legacy\" }\n", "LEGACY_BUILD_CI_RUNTIME_DEPENDENCY"],
  ["Cargo root POSIX legacy dependency", "tools/Cargo.toml", "[dependencies]\nsynthetic = { path = \"/legacy\" }\n", "LEGACY_BUILD_CI_RUNTIME_DEPENDENCY"],
  ["PowerShell legacy dependency", "scripts/build.ps1", "$legacy = 'config\\local\\legacy-source.yaml'\n", "LEGACY_BUILD_CI_RUNTIME_DEPENDENCY"],
  ["migration script legacy copy", "scripts/migration/adopted.ts", "export const marker = 'LEGACY_SOURCE_COPY';\n", "UNREGISTERED_LEGACY_COPY"],
  ["unrelated governance script legacy copy", "scripts/governance/legacy-copy.ts", "export const marker = 'LEGACY_SOURCE_COPY';\n", "UNREGISTERED_LEGACY_COPY"]
];

test("intentional textual migration policy and public acceptance references remain allowed", () => {
  const root = fixtureRoot();
  try {
    write(root, "docs/migration/policy.md", "Reference marker: LEGACY_SOURCE_COPY\n");
    write(root, "docs/program/evidence/acceptance.txt", "Reference marker: LEGACY_SOURCE_COPY\n");
    write(root, "evidence/public-receipt.log", "Reference marker: LEGACY_SOURCE_COPY\n");
    assertPass(root);
  } finally { rmSync(root, { recursive: true, force: true }); }
});

for (const [name, path, contents, expected] of repositoryCases) {
  test(`negative repository fixture: ${name}`, () => {
    const root = fixtureRoot();
    try {
      write(root, path, contents);
      if (expected === "TRACKED_LOCAL_SOURCE_CONFIG") {
        const initialized = spawnSync("git", ["init", "-q", root], { encoding: "utf8" });
        assert.equal(initialized.status, 0, initialized.stderr);
        const added = spawnSync("git", ["-C", root, "add", "-f", path], { encoding: "utf8" });
        assert.equal(added.status, 0, added.stderr);
      }
      if (expected === "GENERATED_BESIDE_TS") write(root, "packages/a.js", "export {};\n");
      assertFails(root, (entry) => entry.code === expected);
    } finally { rmSync(root, { recursive: true, force: true }); }
  });
}

test("canonical ownership mirror consistency passes and one-sided drift fails in the existing governance checker", () => {
  const root = mkdtempSync(join(tmpdir(), "hospital-workspace-ownership-"));
  try {
    write(root, "pnpm-workspace.yaml", "packages: []\n");
    const canonical = readFileSync(join(repositoryRoot, ".github/PATH-OWNERSHIP.yaml"), "utf8");
    write(root, ".github/PATH-OWNERSHIP.yaml", canonical);
    write(root, "docs/governance/PATH-OWNERSHIP.yaml", canonical);
    const args = [dependencyChecker, "--root", root, "--policy", dependencyPolicy];
    const passing = spawnSync(process.execPath, args, { encoding: "utf8" });
    assert.equal(passing.status, 0, passing.stdout);
    write(root, "docs/governance/PATH-OWNERSHIP.yaml", canonical.replace("program-owner", "different-owner"));
    const drift = spawnSync(process.execPath, args, { encoding: "utf8" });
    assert.equal(drift.status, 1, drift.stdout);
    assert.equal(JSON.parse(drift.stdout).findings.some((entry) => entry.code === "OWNERSHIP_MIRROR_DRIFT"), true, drift.stdout);
  } finally { rmSync(root, { recursive: true, force: true }); }
});

test("registered COPY_ADAPT target may carry the provenance marker but a sibling may not", () => {
  const manifest = optionalLocalManifest();
  manifest.adoptions[0].targetPath = "apps/registered-copy.ts";
  const root = fixtureRoot(manifest);
  try {
    write(root, "apps/registered-copy.ts", "export const marker = 'LEGACY_SOURCE_COPY';\n");
    assertPass(root);
    write(root, "apps/unregistered-copy.ts", "export const marker = 'LEGACY_SOURCE_COPY';\n");
    assertFails(root, (entry) => entry.code === "UNREGISTERED_LEGACY_COPY" && entry.path === "apps/unregistered-copy.ts");
  } finally { rmSync(root, { recursive: true, force: true }); }
});

test("an unreadable tracked Git inventory fails closed", () => {
  const root = fixtureRoot();
  try {
    write(root, ".git", "gitdir: missing-directory\n");
    assertFails(root, (entry) => entry.code === "GIT_TRACKED_INVENTORY_UNREADABLE");
  } finally { rmSync(root, { recursive: true, force: true }); }
});

test("an index-only Gitlink fails even when it has no .gitmodules file or worktree path", () => {
  const root = fixtureRoot();
  try {
    const initialized = spawnSync("git", ["init", "-q", root], { encoding: "utf8" });
    assert.equal(initialized.status, 0, initialized.stderr);
    const added = spawnSync("git", ["-C", root, "update-index", "--add", "--info-only", "--cacheinfo", `160000,${"a".repeat(40)},synthetic-submodule`], { encoding: "utf8" });
    assert.equal(added.status, 0, added.stderr);
    assertFails(root, (entry) => entry.code === "GIT_SUBMODULE" && entry.path === "synthetic-submodule");
  } finally { rmSync(root, { recursive: true, force: true }); }
});

test("an index-only tracked symlink fails without a worktree target", () => {
  const root = fixtureRoot();
  try {
    const initialized = spawnSync("git", ["init", "-q", root], { encoding: "utf8" });
    assert.equal(initialized.status, 0, initialized.stderr);
    const added = spawnSync("git", ["-C", root, "update-index", "--add", "--info-only", "--cacheinfo", `120000,${"b".repeat(40)},synthetic-link`], { encoding: "utf8" });
    assert.equal(added.status, 0, added.stderr);
    assertFails(root, (entry) => entry.code === "TRACKED_SYMLINK" && entry.path === "synthetic-link");
  } finally { rmSync(root, { recursive: true, force: true }); }
});

test("a tracked symlink mode fails without following a materialized worktree path", () => {
  const root = fixtureRoot();
  try {
    const initialized = spawnSync("git", ["init", "-q", root], { encoding: "utf8" });
    assert.equal(initialized.status, 0, initialized.stderr);
    write(root, "synthetic-link", "not followed\n");
    const added = spawnSync("git", ["-C", root, "update-index", "--add", "--info-only", "--cacheinfo", `120000,${"c".repeat(40)},synthetic-link`], { encoding: "utf8" });
    assert.equal(added.status, 0, added.stderr);
    assertFails(root, (entry) => entry.code === "TRACKED_SYMLINK" && entry.path === "synthetic-link");
  } finally { rmSync(root, { recursive: true, force: true }); }
});

test("an index-only tracked legacy local config fails after its worktree file is removed", () => {
  const root = fixtureRoot();
  try {
    const initialized = spawnSync("git", ["init", "-q", root], { encoding: "utf8" });
    assert.equal(initialized.status, 0, initialized.stderr);
    write(root, "config/local/legacy-source.yaml", "localPath: ../legacy\n");
    const added = spawnSync("git", ["-C", root, "add", "-f", "config/local/legacy-source.yaml"], { encoding: "utf8" });
    assert.equal(added.status, 0, added.stderr);
    rmSync(join(root, "config/local/legacy-source.yaml"));
    assertFails(root, (entry) => entry.code === "TRACKED_LOCAL_SOURCE_CONFIG" && entry.path === "config/local/legacy-source.yaml");
  } finally { rmSync(root, { recursive: true, force: true }); }
});

test("an index-only .gitmodules file fails after its worktree file is removed", () => {
  const root = fixtureRoot();
  try {
    const initialized = spawnSync("git", ["init", "-q", root], { encoding: "utf8" });
    assert.equal(initialized.status, 0, initialized.stderr);
    write(root, ".gitmodules", "[submodule \"synthetic\"]\n");
    const added = spawnSync("git", ["-C", root, "add", ".gitmodules"], { encoding: "utf8" });
    assert.equal(added.status, 0, added.stderr);
    rmSync(join(root, ".gitmodules"));
    assertFails(root, (entry) => entry.code === "GIT_SUBMODULE" && entry.path === ".gitmodules");
  } finally { rmSync(root, { recursive: true, force: true }); }
});

test("an untracked materialized .gitmodules file fails in a Git worktree", () => {
  const root = fixtureRoot();
  try {
    const initialized = spawnSync("git", ["init", "-q", root], { encoding: "utf8" });
    assert.equal(initialized.status, 0, initialized.stderr);
    write(root, ".gitmodules", "[submodule \"synthetic\"]\n");
    assertFails(root, (entry) => entry.code === "GIT_SUBMODULE" && entry.path === ".gitmodules");
  } finally { rmSync(root, { recursive: true, force: true }); }
});
