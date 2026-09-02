import assert from "node:assert/strict";
import { existsSync, linkSync, mkdtempSync, mkdirSync, readFileSync, rmSync, symlinkSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { dirname, join, resolve } from "node:path";
import { spawnSync } from "node:child_process";
import test from "node:test";
import { fileURLToPath } from "node:url";

const checker = resolve(dirname(fileURLToPath(import.meta.url)), "check-workspace-contract.mjs");
const repositoryRoot = resolve(dirname(fileURLToPath(import.meta.url)), "../..");
const qualityScripts = {
  build: "node --version",
  lint: "node --version",
  typecheck: "node --version",
  test: "node --version",
  check: "node --version",
  "format:check": "node --version"
};

function write(root, relativePath, contents) {
  const destination = join(root, relativePath);
  mkdirSync(dirname(destination), { recursive: true });
  writeFileSync(destination, contents, "utf8");
}

function manifest(overrides = {}) {
  return {
    name: "@fixture/root",
    version: "0.0.0",
    private: true,
    packageManager: "pnpm@11.17.0",
    engines: { node: "24.18.0", pnpm: "11.17.0" },
    scripts: qualityScripts,
    devDependencies: { ajv: "8.20.0", "ajv-formats": "3.0.1", typescript: "7.0.2" },
    ...overrides
  };
}

function createFixture(setup = () => {}) {
  const root = mkdtempSync(join(tmpdir(), "hospital-workspace-contract-"));
  write(root, "package.json", `${JSON.stringify(manifest(), null, 2)}\n`);
  write(root, "pnpm-workspace.yaml", "packages: []\n");
  write(root, ".npmrc", "engine-strict=true\npackage-manager-strict=true\npackage-manager-strict-version=true\n");
  write(root, ".nvmrc", "24.18.0\n");
  write(root, "tsconfig.base.json", `${JSON.stringify({ compilerOptions: { target: "ES2024", module: "NodeNext", moduleResolution: "NodeNext", strict: true, noEmit: true } }, null, 2)}\n`);
  write(root, "tsconfig.json", `${JSON.stringify({ extends: "./tsconfig.base.json", files: [] }, null, 2)}\n`);
  write(root, "pnpm-lock.yaml", "lockfileVersion: '9.0'\n");
  setup(root);
  return root;
}

function run(root, ...args) {
  return spawnSync(process.execPath, [checker, "--root", root, ...args], { encoding: "utf8" });
}

function withFixture(setup, assertion) {
  const root = createFixture(setup);
  try {
    assertion(root);
  } finally {
    rmSync(root, { recursive: true, force: true });
  }
}

test("accepts the initial empty workspace and emits deterministic reports", () => {
  withFixture(() => {}, (root) => {
    const reportDir = mkdtempSync(join(tmpdir(), "hospital-workspace-report-"));
    try {
      const result = run(root, "--report-dir", reportDir);
      assert.equal(result.status, 0, result.stdout);
      const report = JSON.parse(result.stdout);
      assert.equal(report.status, "PASS");
      assert.equal(report.inventory.workspaceCount, 0);
      const inventoryPath = join(reportDir, "workspace-inventory.json");
      const inventory = readFileSync(inventoryPath, "utf8");
      assert.equal(JSON.parse(inventory).workspaceCount, 0);
      assert.equal(JSON.parse(readFileSync(join(reportDir, "toolchain-report.json"), "utf8")).typescript, "7.0.2");
      const rerun = run(root, "--report-dir", reportDir);
      assert.notEqual(rerun.status, 0);
      assert.match(rerun.stdout, /report-output-already-exists:workspace-inventory\.json/);
      assert.equal(readFileSync(inventoryPath, "utf8"), inventory);
    } finally {
      rmSync(reportDir, { recursive: true, force: true });
    }
  });
});

test("writes reports outside the repository and rejects a repository descendant", () => {
  const reportDir = mkdtempSync(join(tmpdir(), "hospital-workspace-repository-report-"));
  try {
    const result = run(repositoryRoot, "--report-dir", reportDir);
    assert.equal(result.status, 0, result.stdout);
    assert.equal(existsSync(join(reportDir, "workspace-inventory.json")), true);
    const insideRoot = join(repositoryRoot, "workspace-contract-report");
    const rejected = run(repositoryRoot, "--report-dir", insideRoot);
    assert.notEqual(rejected.status, 0);
    assert.match(rejected.stdout, /report-directory-must-be-outside-root/);
    assert.equal(existsSync(insideRoot), false);
  } finally {
    rmSync(reportDir, { recursive: true, force: true });
  }
});

test("rejects a report path through a reparse-point ancestor", (t) => {
  const root = createFixture((fixtureRoot) => mkdirSync(join(fixtureRoot, "inside")));
  const outside = mkdtempSync(join(tmpdir(), "hospital-workspace-reparse-"));
  const redirect = join(outside, "redirect");
  const inside = join(root, "inside");
  try {
    try {
      symlinkSync(inside, redirect, process.platform === "win32" ? "junction" : "dir");
    } catch (error) {
      if (error?.code === "EPERM" || error?.code === "EACCES") {
        t.skip(`directory reparse-point creation unavailable: ${error.code}`);
        return;
      }
      throw error;
    }
    const redirectedReport = join(redirect, "report");
    const result = run(root, "--report-dir", redirectedReport);
    assert.notEqual(result.status, 0);
    assert.match(result.stdout, /report-directory-must-be-outside-root/);
    assert.equal(existsSync(join(inside, "report")), false);
    assert.equal(existsSync(join(inside, "report", "workspace-inventory.json")), false);
    assert.equal(existsSync(join(inside, "report", "toolchain-report.json")), false);
  } finally {
    rmSync(root, { recursive: true, force: true });
    rmSync(outside, { recursive: true, force: true });
  }
});

test("rejects hard-linked pre-existing report outputs without changing sentinels", () => {
  const root = createFixture();
  try {
    for (const outputName of ["workspace-inventory.json", "toolchain-report.json"]) {
      const reportDir = mkdtempSync(join(tmpdir(), "hospital-workspace-hard-link-report-"));
      const sentinelPath = join(root, `sentinel-${outputName}`);
      const sentinel = `sentinel:${outputName}\n`;
      writeFileSync(sentinelPath, sentinel, "utf8");
      linkSync(sentinelPath, join(reportDir, outputName));
      try {
        const result = run(root, "--report-dir", reportDir);
        assert.notEqual(result.status, 0);
        assert.match(result.stdout, new RegExp(`report-output-already-exists:${outputName.replace(".", "\\.")}`));
        assert.equal(readFileSync(sentinelPath, "utf8"), sentinel);
        const otherOutput = outputName === "workspace-inventory.json" ? "toolchain-report.json" : "workspace-inventory.json";
        assert.equal(existsSync(join(reportDir, otherOutput)), false);
      } finally {
        rmSync(reportDir, { recursive: true, force: true });
      }
    }
  } finally {
    rmSync(root, { recursive: true, force: true });
  }
});

test("rejects a second JavaScript lockfile", () => {
  withFixture((root) => write(root, "yarn.lock", "# prohibited\n"), (root) => {
    const result = run(root);
    assert.notEqual(result.status, 0);
    assert.match(result.stdout, /prohibited-lockfile:yarn\.lock/);
  });
});

test("requires the exact approved root development dependency set", () => {
  for (const devDependencies of [
    { typescript: "7.0.2" },
    { ajv: "^8.20.0", "ajv-formats": "3.0.1", typescript: "7.0.2" },
    { ajv: "8.20.0", "ajv-formats": "3.0.1", typescript: "7.0.2", unexpected: "1.0.0" }
  ]) {
    const root = createFixture((fixtureRoot) => {
      write(fixtureRoot, "package.json", `${JSON.stringify(manifest({ devDependencies }), null, 2)}\n`);
    });
    try {
      const result = run(root);
      assert.notEqual(result.status, 0, result.stdout);
      assert.match(result.stdout, /root-dev-dependencies-must-match-approved-exact-set/);
    } finally {
      rmSync(root, { recursive: true, force: true });
    }
  }
});

test("rejects a registered workspace with a missing quality script", () => {
  withFixture((root) => {
    write(root, "pnpm-workspace.yaml", "packages:\n  - \"packages/*\"\n");
    const scripts = { ...qualityScripts };
    delete scripts.lint;
    write(root, "packages/example/package.json", `${JSON.stringify({ name: "@fixture/example", version: "0.0.0", scripts }, null, 2)}\n`);
  }, (root) => {
    const result = run(root);
    assert.notEqual(result.status, 0);
    assert.match(result.stdout, /missing-quality-script:@fixture\/example:lint/);
  });
});

test("accepts a non-empty workspace N/A rationale and rejects an empty one", () => {
  withFixture((root) => {
    write(root, "pnpm-workspace.yaml", "packages:\n  - \"packages/*\"\n");
    const scripts = { ...qualityScripts };
    delete scripts.build;
    write(root, "packages/example/package.json", `${JSON.stringify({ name: "@fixture/example", version: "0.0.0", scripts, workspaceContract: { notApplicable: { build: "Contract-only package has no build artifact." } } }, null, 2)}\n`);
  }, (root) => {
    assert.equal(run(root).status, 0);
    const scripts = { ...qualityScripts };
    delete scripts.build;
    write(root, "packages/example/package.json", `${JSON.stringify({ name: "@fixture/example", version: "0.0.0", scripts, workspaceContract: { notApplicable: { build: "" } } }, null, 2)}\n`);
    const result = run(root);
    assert.notEqual(result.status, 0);
    assert.match(result.stdout, /invalid-not-applicable-rationale:@fixture\/example:build/);
  });
});

test("rejects fallbacks, --if-present, and empty scripts", () => {
  withFixture((root) => {
    const scripts = { ...qualityScripts, build: "npm run build", lint: "pnpm run lint --if-present", test: "", "phase:01": "node phase-01" };
    write(root, "package.json", `${JSON.stringify(manifest({ scripts }), null, 2)}\n`);
  }, (root) => {
    const result = run(root);
    assert.notEqual(result.status, 0);
    assert.match(result.stdout, /prohibited-package-manager-fallback:root:build/);
    assert.match(result.stdout, /prohibited-if-present:root:lint/);
    assert.match(result.stdout, /empty-script:root:test/);
    assert.match(result.stdout, /prohibited-legacy-phase-script:root:phase:01/);
  });
});
