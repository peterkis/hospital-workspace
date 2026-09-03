import assert from "node:assert/strict";
import { mkdtempSync, mkdirSync, readFileSync, rmSync, unlinkSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { dirname, join, resolve } from "node:path";
import { spawnSync } from "node:child_process";
import test from "node:test";
import { fileURLToPath } from "node:url";
import { fixtures } from "./fixtures/dependency-dag/fixtures.mjs";

const scriptDirectory = dirname(fileURLToPath(import.meta.url));
const checker = resolve(scriptDirectory, "check-dependency-dag.mjs");
const repositoryRoot = resolve(scriptDirectory, "../..");
const policy = resolve(repositoryRoot, "docs/governance/DEPENDENCY-POLICY.yaml");

function write(root, path, contents) {
  const destination = join(root, path);
  mkdirSync(dirname(destination), { recursive: true });
  writeFileSync(destination, contents, "utf8");
}

const fixtureWorkspaceOwnershipRules = [
  { owner: "workspace-frontend-owner", paths: ["apps/workspace-web/**"], reviewers: ["frontend-reviewer"], risk: "high" },
  { owner: "identity-access-owner", paths: ["services/gateway/**", "packages/identity-contracts/**"], reviewers: ["security-reviewer", "architecture-reviewer"], risk: "critical" },
  { owner: "collaboration-owner", paths: ["services/collaboration/**", "packages/collaboration-repository/**", "packages/workitem-contracts/**", "packages/harness-contracts/**"], reviewers: ["event-consistency-reviewer", "security-reviewer"], risk: "critical" },
  { owner: "agent-platform-owner", paths: ["services/agent-gateway/**", "packages/agent-contracts/**"], reviewers: ["agent-security-reviewer", "security-reviewer"], risk: "critical" },
  { owner: "knowledge-governance-owner", paths: ["services/knowledge/**", "packages/knowledge-contracts/**"], reviewers: ["knowledge-reviewer"], risk: "high" },
  { owner: "ticket-domain-owner", paths: ["services/tickets/**", "packages/ticket-repository/**", "packages/ticket-contracts/**"], reviewers: ["domain-reviewer"], risk: "high" },
  { owner: "fee-domain-owner", paths: ["services/fee/**", "packages/fee-repository/**", "packages/fee-contracts/**"], reviewers: ["financial-safety-reviewer", "security-reviewer"], risk: "critical" },
  { owner: "handover-domain-owner", paths: ["services/handover/**", "packages/handover-contracts/**"], reviewers: ["clinical-privacy-reviewer", "security-reviewer"], risk: "critical" },
  { owner: "hosp-access-owner", paths: ["services/hosp-access/**", "packages/hosp-contracts/**"], reviewers: ["integration-security-reviewer"], risk: "high" },
  { owner: "database-owner", paths: ["packages/database-runtime/**"], reviewers: ["data-reviewer", "security-reviewer"], risk: "critical" },
  { owner: "contract-owner", paths: ["packages/event-contracts/**", "packages/command-contracts/**", "packages/capability-contracts/**", "packages/workspace-contracts/**", "packages/contracts-core/**", "packages/card-protocol/**"], reviewers: ["contract-reviewer"], risk: "high" },
  { owner: "sdk-owner", paths: ["packages/api-client/**", "packages/capability-sdk/**", "packages/hub-client/**"], reviewers: ["sdk-reviewer"], risk: "high" },
  { owner: "utility-owner", paths: ["packages/time-core/**", "packages/authz-core/**"], reviewers: ["utility-reviewer"], risk: "high" },
  { owner: "ui-owner", paths: ["packages/ui/**"], reviewers: ["frontend-reviewer"], risk: "high" },
  { owner: "test-support-owner", paths: ["packages/testkit/**"], reviewers: ["test-reviewer"], risk: "high" }
];

function ownershipYaml(options = {}) {
  const rules = [
    { owner: "toolchain-owner", paths: [options.governancePath ?? "scripts/governance/**"], reviewers: options.highReviewers ?? ["architecture-reviewer", "supply-chain-reviewer"], risk: "high" },
    { owner: "critical-owner", paths: ["critical/**"], reviewers: options.criticalReviewers ?? ["security-reviewer", "architecture-reviewer"], risk: "critical" },
    ...(options.includeWorkspaceRules === false ? [] : fixtureWorkspaceOwnershipRules),
    ...(options.extraRules ?? [])
  ];
  if (options.reverseRules) rules.reverse();
  const lines = ["schemaVersion: hospital-workspace.path-ownership.v1", "rules:"];
  for (const rule of rules) {
    lines.push("- paths:");
    for (const path of rule.paths) lines.push(`  - ${path}`);
    lines.push(`  ownerRole: ${rule.owner}`, "  reviewRoles:");
    for (const reviewer of rule.reviewers) lines.push(`  - ${reviewer}`);
    lines.push(`  risk: ${rule.risk}`);
  }
  lines.push("constraints:");
  const constraints = options.reverseConstraints ? ["unmatchedCriticalPathFails", "ownerAndReviewerMustDiffer", "criticalRequiresTwoReviewRoles"] : ["ownerAndReviewerMustDiffer", "criticalRequiresTwoReviewRoles", "unmatchedCriticalPathFails"];
  for (const constraint of constraints) lines.push(`  ${constraint}: true`);
  return `${lines.join("\n")}\n`;
}

function reorderedFormattedOwnershipYaml() {
  const lines = [
    "# ownership mirror with equivalent YAML presentation",
    "constraints: # mapping order is intentionally different",
    "  unmatchedCriticalPathFails: \"true\"",
    "  criticalRequiresTwoReviewRoles: true # inline comment",
    "  ownerAndReviewerMustDiffer: 'true'",
    "",
    "rules:",
    "- risk: \"high\"",
    "  reviewRoles:",
    "  - \"supply-chain-reviewer\"",
    "  - 'architecture-reviewer' # reviewer order differs",
    "  paths:",
    "  - \"scripts/governance/**\"",
    "  ownerRole: \"toolchain-owner\"",
    "",
    "- reviewRoles:",
    "  - \"architecture-reviewer\"",
    "  - \"security-reviewer\"",
    "  ownerRole: 'critical-owner'",
    "  risk: \"critical\"",
    "  paths:",
    "  - 'critical/**'",
    ""
  ];
  for (const rule of fixtureWorkspaceOwnershipRules) {
    lines.push("- paths:");
    for (const path of rule.paths) lines.push(`  - ${path}`);
    lines.push(`  ownerRole: ${rule.owner}`, "  reviewRoles:");
    for (const reviewer of rule.reviewers) lines.push(`  - ${reviewer}`);
    lines.push(`  risk: ${rule.risk}`);
  }
  lines.push("", "schemaVersion: \"hospital-workspace.path-ownership.v1\"", "");
  return lines.join("\r\n");
}

function writeOwnership(root, canonical, mirror = canonical) {
  write(root, ".github/PATH-OWNERSHIP.yaml", canonical);
  write(root, "docs/governance/PATH-OWNERSHIP.yaml", mirror);
}

function ownershipFixture(mutator) {
  const definition = fixtures.find((fixture) => fixture.name === "positive-frontend-sdk-contracts");
  const root = createFixtureRoot(definition);
  try {
    mutator(root);
    return run(root);
  } finally {
    rmSync(root, { recursive: true, force: true });
  }
}

function ownershipOnlyFixture(mutator) {
  const root = mkdtempSync(join(tmpdir(), "hospital-workspace-ownership-"));
  write(root, "pnpm-workspace.yaml", "packages: []\n");
  writeOwnership(root, ownershipYaml({ includeWorkspaceRules: false }));
  try {
    mutator(root);
    return run(root);
  } finally {
    rmSync(root, { recursive: true, force: true });
  }
}

function assertOwnershipFinding(result, code) {
  assert.equal(result.status, 1, result.stdout);
  assert.equal(JSON.parse(result.stdout).findings.some((finding) => finding.code === code), true, result.stdout);
}

function authorityByWorkspace(report) {
  return new Map(report.governedWorkspaceAuthorities.map((entry) => [entry.path, entry.ownerRole]));
}

function createFixtureRoot(definition) {
  const root = mkdtempSync(join(tmpdir(), "hospital-workspace-dependency-dag-"));
  writeOwnership(root, ownershipYaml());
  write(root, "pnpm-workspace.yaml", `packages:\n${definition.workspacePatterns.map((pattern) => `  - "${pattern}"`).join("\n")}\n`);
  for (const packageDefinition of definition.packages) {
    write(root, `${packageDefinition.path}/package.json`, `${JSON.stringify(packageDefinition.manifest, null, 2)}\n`);
    for (const [file, contents] of Object.entries(packageDefinition.sources)) write(root, `${packageDefinition.path}/${file}`, contents);
  }
  return root;
}

function run(root, policyPath = policy) {
  return spawnSync(process.execPath, [checker, "--root", root, "--policy", policyPath], { encoding: "utf8" });
}

const approvedFrontendDependencies = {
  "@testing-library/dom": "10.4.1",
  "@testing-library/react": "16.3.3",
  "@types/react": "19.2.18",
  "@types/react-dom": "19.2.5",
  "@vitejs/plugin-react": "6.1.1",
  jsdom: "30.0.1",
  react: "19.2.8",
  "react-dom": "19.2.8",
  typescript: "7.0.2",
  vite: "8.2.2",
  vitest: "4.1.11"
};

function frontendDependencyFixture(mutator = () => {}) {
  const root = mkdtempSync(join(tmpdir(), "hospital-workspace-frontend-dependencies-"));
  writeOwnership(root, ownershipYaml());
  write(root, "pnpm-workspace.yaml", "packages:\n  - \"apps/workspace-web\"\n");
  const manifest = {
    name: "@hospital/workspace-web",
    version: "0.0.0",
    private: true,
    type: "module",
    dependencies: { react: "19.2.8", "react-dom": "19.2.8" },
    devDependencies: Object.fromEntries(Object.entries(approvedFrontendDependencies).filter(([name]) => name !== "react" && name !== "react-dom"))
  };
  mutator(manifest);
  write(root, "apps/workspace-web/package.json", `${JSON.stringify(manifest, null, 2)}\n`);
  write(root, "apps/workspace-web/src/index.tsx", 'import "react";\n');
  return root;
}

test("current one-workspace repository passes deterministically", () => {
  const first = run(repositoryRoot);
  const second = run(repositoryRoot);
  assert.equal(first.status, 0, first.stdout);
  assert.equal(first.stdout, second.stdout);
  const report = JSON.parse(first.stdout);
  assert.equal(report.status, "PASS");
  assert.equal(report.ownership.canonicalRuleCount > 0, true);
  assert.equal(report.workspaceCount, 1);
  assert.deepEqual(report.workspacePatterns, ["apps/workspace-web"]);
  assert.deepEqual(report.findings, []);
});

test("accepts the exact approved React and Vite frontend dependency set, including devDependencies", () => {
  const root = frontendDependencyFixture();
  try {
    const result = run(root);
    assert.equal(result.status, 0, result.stdout);
    assert.equal(JSON.parse(result.stdout).status, "PASS", result.stdout);
  } finally {
    rmSync(root, { recursive: true, force: true });
  }
});

test("rejects unapproved component, state, and network packages even as frontend devDependencies", () => {
  for (const dependency of ["@radix-ui/react-dialog", "zustand", "axios"]) {
    const root = frontendDependencyFixture((manifest) => {
      manifest.devDependencies[dependency] = "1.0.0";
    });
    try {
      const result = run(root);
      assert.equal(result.status, 1, result.stdout);
      const report = JSON.parse(result.stdout);
      assert.equal(report.findings.some((finding) => finding.code === "FRONTEND_EXTERNAL_DEPENDENCY_NOT_ALLOWED" && finding.to === dependency && finding.detail === "devDependencies"), true, result.stdout);
    } finally {
      rmSync(root, { recursive: true, force: true });
    }
  }
});

test("continues to reject Node, Fastify, Prisma, Redis, and Tauri from frontend source or manifests", () => {
  const cases = [
    { dependency: "fastify", source: null },
    { dependency: "prisma", source: null },
    { dependency: "redis", source: null },
    { dependency: "@tauri-apps/api", source: null },
    { dependency: null, source: 'import "node:fs";\n' }
  ];
  for (const entry of cases) {
    const root = frontendDependencyFixture((manifest) => {
      if (entry.dependency) manifest.dependencies[entry.dependency] = "1.0.0";
    });
    try {
      if (entry.source) write(root, "apps/workspace-web/src/index.tsx", entry.source);
      const result = run(root);
      assert.equal(result.status, 1, result.stdout);
      assert.equal(JSON.parse(result.stdout).findings.some((finding) => finding.code === "FRONTEND_FORBIDDEN_RUNTIME"), true, result.stdout);
    } finally {
      rmSync(root, { recursive: true, force: true });
    }
  }
});

test("rejects unknown dependency policy fields", () => {
  const root = mkdtempSync(join(tmpdir(), "hospital-workspace-dependency-policy-"));
  try {
    const invalidPolicy = JSON.parse(readFileSync(policy, "utf8"));
    invalidPolicy.unrecognized = true;
    const invalidPolicyPath = join(root, "DEPENDENCY-POLICY.yaml");
    writeFileSync(invalidPolicyPath, `${JSON.stringify(invalidPolicy, null, 2)}\n`, "utf8");
    const result = spawnSync(process.execPath, [checker, "--root", root, "--policy", invalidPolicyPath], { encoding: "utf8" });
    assert.equal(result.status, 1, result.stdout);
    assert.equal(JSON.parse(result.stdout).findings[0].code, "CHECKER_CONFIGURATION_ERROR");
  } finally {
    rmSync(root, { recursive: true, force: true });
  }
});

test("rejects unknown nested per-layer policy fields", () => {
  const root = mkdtempSync(join(tmpdir(), "hospital-workspace-dependency-policy-nested-"));
  try {
    const invalidPolicy = JSON.parse(readFileSync(policy, "utf8"));
    invalidPolicy.forbiddenExternalDependenciesByLayer.unrecognized = [];
    const invalidPolicyPath = join(root, "DEPENDENCY-POLICY.yaml");
    writeFileSync(invalidPolicyPath, `${JSON.stringify(invalidPolicy, null, 2)}\n`, "utf8");
    const result = spawnSync(process.execPath, [checker, "--root", root, "--policy", invalidPolicyPath], { encoding: "utf8" });
    assert.equal(result.status, 1, result.stdout);
    assert.equal(JSON.parse(result.stdout).findings[0].code, "CHECKER_CONFIGURATION_ERROR");
  } finally {
    rmSync(root, { recursive: true, force: true });
  }
});

test("allows public subpaths of an explicitly allowed Tauri plugin root", () => {
  const definition = fixtures.find((fixture) => fixture.name === "positive-frontend-sdk-contracts");
  const root = createFixtureRoot(definition);
  try {
    const allowedPolicy = JSON.parse(readFileSync(policy, "utf8"));
    allowedPolicy.allowedTauriPlugins.push("@tauri-apps/plugin-shell");
    const allowedPolicyPath = join(root, "DEPENDENCY-POLICY.yaml");
    writeFileSync(allowedPolicyPath, `${JSON.stringify(allowedPolicy, null, 2)}\n`, "utf8");
    write(root, "apps/workspace-web/src/tauri.ts", 'import "@tauri-apps/plugin-shell/public";\n');
    const result = run(root, allowedPolicyPath);
    assert.equal(result.status, 0, result.stdout);
  } finally {
    rmSync(root, { recursive: true, force: true });
  }
});

test("ownership accepts a canonical authority, valid high mapping, and two critical reviewers", () => {
  const result = ownershipFixture(() => {});
  assert.equal(result.status, 0, result.stdout);
});

test("ownership requires the canonical .github authority", () => {
  const result = ownershipFixture((root) => unlinkSync(join(root, ".github/PATH-OWNERSHIP.yaml")));
  assertOwnershipFinding(result, "OWNERSHIP_CANONICAL_MISSING");
});

test("ownership rejects canonical-mirror reviewer drift", () => {
  const result = ownershipFixture((root) => writeOwnership(root, ownershipYaml(), ownershipYaml({ highReviewers: ["architecture-reviewer", "security-reviewer"] })));
  assertOwnershipFinding(result, "OWNERSHIP_MIRROR_DRIFT");
});

test("ownership rejects canonical-mirror path-set drift", () => {
  const result = ownershipFixture((root) => writeOwnership(root, ownershipYaml(), ownershipYaml({ governancePath: "scripts/other/**" })));
  assertOwnershipFinding(result, "OWNERSHIP_MIRROR_DRIFT");
});

test("ownership ignores rule and constraint YAML ordering differences", () => {
  const result = ownershipFixture((root) => writeOwnership(root, ownershipYaml(), ownershipYaml({ reverseConstraints: true, reverseRules: true })));
  assert.equal(result.status, 0, result.stdout);
});

test("ownership accepts CRLF comments quotes blank lines and mapping/list reordering", () => {
  const result = ownershipFixture((root) => writeOwnership(root, ownershipYaml(), reorderedFormattedOwnershipYaml()));
  assert.equal(result.status, 0, result.stdout);
});

test("ownership parser fails closed on unknown keys duplicate mappings malformed indentation and scalars", () => {
  const invalidInputs = [
    ownershipYaml().replace("  risk: high", "  unknown: high"),
    ownershipYaml().replace("  ownerRole: toolchain-owner", "  ownerRole: toolchain-owner\n  ownerRole: duplicate-owner"),
    ownershipYaml().replace("  risk: high", "    risk: high"),
    ownershipYaml().replace("  ownerRole: toolchain-owner", "  ownerRole: \"unterminated")
  ];
  for (const invalid of invalidInputs) {
    const result = ownershipFixture((root) => writeOwnership(root, invalid));
    assert.equal(result.status, 1, result.stdout);
    assert.equal(JSON.parse(result.stdout).findings[0].code, "CHECKER_CONFIGURATION_ERROR", result.stdout);
  }
});

test("ownership normalizes Windows and POSIX path separators", () => {
  const result = ownershipFixture((root) => writeOwnership(root, ownershipYaml({ governancePath: "scripts\\governance\\**" }), ownershipYaml()));
  assert.equal(result.status, 0, result.stdout);
});

test("ownership rejects duplicate reviewers and owner-reviewer conflicts", () => {
  const result = ownershipFixture((root) => writeOwnership(root, ownershipYaml({ highReviewers: ["toolchain-owner", "toolchain-owner"] })));
  assertOwnershipFinding(result, "OWNERSHIP_DUPLICATE_REVIEWER");
  assertOwnershipFinding(result, "OWNERSHIP_OWNER_REVIEWER_CONFLICT");
});

test("ownership rejects zero and one-reviewer critical rules", () => {
  const zero = ownershipFixture((root) => writeOwnership(root, ownershipYaml({ criticalReviewers: [] })));
  assertOwnershipFinding(zero, "OWNERSHIP_REVIEW_CARDINALITY");
  const one = ownershipFixture((root) => writeOwnership(root, ownershipYaml({ criticalReviewers: ["security-reviewer"] })));
  assertOwnershipFinding(one, "OWNERSHIP_REVIEW_CARDINALITY");
});

test("ownership rejects high review cardinality and invalid scripts governance mapping", () => {
  const high = ownershipFixture((root) => writeOwnership(root, ownershipYaml({ highReviewers: [] })));
  assertOwnershipFinding(high, "OWNERSHIP_REVIEW_CARDINALITY");
  const invalid = ownershipFixture((root) => writeOwnership(root, ownershipYaml({ highReviewers: ["architecture-reviewer"], governancePath: "scripts/governance/**" })));
  assertOwnershipFinding(invalid, "OWNERSHIP_SCRIPTS_GOVERNANCE_INVALID");
});

test("ownership rejects duplicate and conflicting overlapping rules", () => {
  const duplicate = ownershipFixture((root) => writeOwnership(root, ownershipYaml({ extraRules: [{ owner: "toolchain-owner", paths: ["scripts/governance/**"], reviewers: ["architecture-reviewer", "supply-chain-reviewer"], risk: "high" }] })));
  assertOwnershipFinding(duplicate, "OWNERSHIP_DUPLICATE_RULE");
  const overlap = ownershipFixture((root) => writeOwnership(root, ownershipYaml({ extraRules: [{ owner: "other-owner", paths: ["scripts/**"], reviewers: ["security-reviewer"], risk: "high" }] })));
  assertOwnershipFinding(overlap, "OWNERSHIP_CONFLICTING_OVERLAP");
});

test("ownership detects wildcard overlap that escapes fixed sample containment", () => {
  const result = ownershipOnlyFixture((root) => writeOwnership(root, ownershipYaml({ includeWorkspaceRules: false, extraRules: [
    { owner: "source-owner", paths: ["packages/*/src/**"], reviewers: ["security-reviewer"], risk: "high" },
    { owner: "package-owner", paths: ["packages/foo/**"], reviewers: ["architecture-reviewer"], risk: "high" }
  ] })));
  assertOwnershipFinding(result, "OWNERSHIP_CONFLICTING_OVERLAP");
  const overlap = JSON.parse(result.stdout).findings.find((finding) => finding.code === "OWNERSHIP_CONFLICTING_OVERLAP");
  assert.equal(overlap.detail.startsWith("packages/foo/src/"), true, result.stdout);
});

test("ownership overlap intersection is symmetric and avoids disjoint wildcard false positives", () => {
  const symmetric = ownershipOnlyFixture((root) => writeOwnership(root, ownershipYaml({ includeWorkspaceRules: false, extraRules: [
    { owner: "package-owner", paths: ["packages/foo/**"], reviewers: ["architecture-reviewer"], risk: "high" },
    { owner: "source-owner", paths: ["packages/*/src/**"], reviewers: ["security-reviewer"], risk: "high" }
  ] })));
  assertOwnershipFinding(symmetric, "OWNERSHIP_CONFLICTING_OVERLAP");
  const disjoint = ownershipOnlyFixture((root) => writeOwnership(root, ownershipYaml({ includeWorkspaceRules: false, extraRules: [
    { owner: "source-owner", paths: ["packages/*/src/**"], reviewers: ["security-reviewer"], risk: "high" },
    { owner: "test-owner", paths: ["packages/foo/test/**"], reviewers: ["architecture-reviewer"], risk: "high" }
  ] })));
  assert.equal(disjoint.status, 0, disjoint.stdout);
});

test("ownership resolves the frozen contract and specialized contract authorities uniquely", () => {
  const definition = fixtures.find((fixture) => fixture.name === "positive-frontend-sdk-contracts");
  const root = createFixtureRoot(definition);
  const expectedAuthorities = [
    ["packages/event-contracts", "contract-owner"],
    ["packages/command-contracts", "contract-owner"],
    ["packages/capability-contracts", "contract-owner"],
    ["packages/workspace-contracts", "contract-owner"],
    ["packages/contracts-core", "contract-owner"],
    ["packages/card-protocol", "contract-owner"],
    ["packages/identity-contracts", "identity-access-owner"],
    ["packages/workitem-contracts", "collaboration-owner"],
    ["packages/harness-contracts", "collaboration-owner"],
    ["packages/agent-contracts", "agent-platform-owner"],
    ["packages/knowledge-contracts", "knowledge-governance-owner"],
    ["packages/ticket-contracts", "ticket-domain-owner"],
    ["packages/fee-contracts", "fee-domain-owner"],
    ["packages/handover-contracts", "handover-domain-owner"],
    ["packages/hosp-contracts", "hosp-access-owner"]
  ];
  try {
    for (const [path] of expectedAuthorities) {
      if (path === "packages/workspace-contracts" || path === "packages/ticket-contracts") continue;
      const basename = path.slice("packages/".length);
      write(root, `${path}/package.json`, `${JSON.stringify({ exports: ".", name: `@hospital/${basename}`, version: "0.0.0" }, null, 2)}\n`);
    }
    const result = run(root);
    assert.equal(result.status, 0, result.stdout);
    const authorities = authorityByWorkspace(JSON.parse(result.stdout));
    for (const [path, ownerRole] of expectedAuthorities) assert.equal(authorities.get(path), ownerRole, result.stdout);
  } finally {
    rmSync(root, { recursive: true, force: true });
  }
});

test("ownership has no remaining canonical conflict and rejects a reintroduced broad contracts rule", () => {
  const canonical = run(repositoryRoot);
  assert.equal(canonical.status, 0, canonical.stdout);
  assert.equal(JSON.parse(canonical.stdout).findings.filter((finding) => finding.code === "OWNERSHIP_CONFLICTING_OVERLAP").length, 0, canonical.stdout);
  const reintroduced = ownershipFixture((root) => writeOwnership(root, ownershipYaml({ extraRules: [
    { owner: "contract-owner", paths: ["packages/*-contracts/**"], reviewers: ["contract-reviewer"], risk: "high" }
  ] })));
  assertOwnershipFinding(reintroduced, "OWNERSHIP_CONFLICTING_OVERLAP");
  const overlaps = JSON.parse(reintroduced.stdout).findings.filter((finding) => finding.code === "OWNERSHIP_CONFLICTING_OVERLAP");
  assert.equal(overlaps.length > 0, true, reintroduced.stdout);
  assert.equal(overlaps.every((finding) => finding.detail.length > 0), true, reintroduced.stdout);
});

test("ownership fails closed for an unowned governed contract workspace", () => {
  const definition = fixtures.find((fixture) => fixture.name === "positive-frontend-sdk-contracts");
  const root = createFixtureRoot(definition);
  try {
    write(root, "packages/unknown-contracts/package.json", `${JSON.stringify({ exports: ".", name: "@hospital/unknown-contracts", version: "0.0.0" }, null, 2)}\n`);
    const result = run(root);
    assertOwnershipFinding(result, "OWNERSHIP_UNOWNED_GOVERNED_PATH");
    const finding = JSON.parse(result.stdout).findings.find((entry) => entry.code === "OWNERSHIP_UNOWNED_GOVERNED_PATH");
    assert.equal(finding.from, "packages/unknown-contracts", result.stdout);
  } finally {
    rmSync(root, { recursive: true, force: true });
  }
});

test("ownership reports multiple differing authorities for a governed workspace without precedence", () => {
  const result = ownershipFixture((root) => writeOwnership(root, ownershipYaml({ extraRules: [
    { owner: "other-owner", paths: ["packages/api-*/**"], reviewers: ["security-reviewer"], risk: "high" }
  ] })));
  assertOwnershipFinding(result, "OWNERSHIP_CONFLICTING_OVERLAP");
  assertOwnershipFinding(result, "OWNERSHIP_GOVERNED_PATH_CONFLICT");
});

for (const definition of fixtures) {
  test(`dependency fixture: ${definition.name}`, () => {
    const root = createFixtureRoot(definition);
    try {
      const first = run(root);
      const second = run(root);
      assert.equal(first.stdout, second.stdout, "checker output must be deterministic");
      const report = JSON.parse(first.stdout);
      assert.equal(report.status, definition.expectedStatus, first.stdout);
      assert.equal(first.status, definition.expectedStatus === "PASS" ? 0 : 1, first.stdout);
      if (definition.expectedCode) assert.equal(report.findings.some((entry) => entry.code === definition.expectedCode), true, first.stdout);
      if (definition.expectedEdge) assert.equal(report.edges.some((entry) => entry.from === definition.expectedEdge.from && entry.to === definition.expectedEdge.to), true, first.stdout);
    } finally {
      rmSync(root, { recursive: true, force: true });
    }
  });
}
