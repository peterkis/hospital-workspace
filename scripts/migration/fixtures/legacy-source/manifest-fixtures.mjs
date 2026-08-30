export const noSourceManifest = {
  schemaVersion: "hospital-workspace.legacy-source.v2",
  sourceMode: "none",
  absencePolicy: "reimplement-from-target-contracts",
  sourceRequiredForBuild: false,
  sourceRequiredForCI: false,
  sourceRequiredForTests: false,
  sourceRequiredForRuntime: false,
  sourceRequiredForRelease: false,
  sourceRequiredForRollback: false,
  policy: {
    gitSubmodule: false,
    gitHistoryImport: false,
    broadCherryPick: false,
    readOnly: true,
    localInputIgnored: true,
    runtimeDependency: false,
    buildDependency: false,
    ciDependency: false,
    testDependency: false,
    releaseDependency: false,
    rollbackDependency: false
  },
  sources: [],
  adoptions: []
};

export function optionalLocalManifest(migrationMode = "COPY_ADAPT") {
  return {
    ...structuredClone(noSourceManifest),
    sourceMode: "optional-local",
    sources: [{
      id: "synthetic-source",
      label: "synthetic-source-label",
      sourceCommit: "aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa",
      sourceHash: "bbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbb",
      sourcePath: "packages/synthetic-source.ts",
      localConfigPath: "config/local/legacy-source.yaml",
      owner: "program-owner",
      license: "Synthetic-Test-License",
      provenance: "synthetic-fixture"
    }],
    adoptions: [{
      id: "synthetic-adoption",
      sourceId: "synthetic-source",
      sourcePath: "packages/synthetic-source.ts",
      sourceHash: "bbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbb",
      targetPath: "packages/target/source.ts",
      migrationMode,
      owner: "program-owner",
      license: "Synthetic-Test-License",
      provenance: "synthetic-fixture",
      receipt: "docs/migration/synthetic-receipt.md",
      risk: "high"
    }]
  };
}

export function optionalLocalPublicScalarManifest() {
  const manifest = optionalLocalManifest();
  manifest.sources[0].label = "Synthetic Legacy Source";
  manifest.sources[0].owner = "Program Owner";
  manifest.sources[0].license = "MIT OR Apache-2.0";
  manifest.sources[0].provenance = "Synthetic Migration Reference";
  manifest.adoptions[0].owner = "Program Owner";
  manifest.adoptions[0].license = "MIT OR Apache-2.0";
  manifest.adoptions[0].provenance = "Synthetic Migration Reference";
  return manifest;
}

export const negativeManifestCases = [
  ["none-with-source", "NONE_MODE_HAS_SOURCE_OR_DEPENDENCY", (manifest) => { manifest.sources = [optionalLocalManifest().sources[0]]; }],
  ["none-with-adoption", "NONE_MODE_HAS_SOURCE_OR_DEPENDENCY", (manifest) => { manifest.adoptions = [optionalLocalManifest().adoptions[0]]; }],
  ["none-requires-build", "MANIFEST_FROZEN_INVARIANT", (manifest) => { manifest.sourceRequiredForBuild = true; }],
  ["none-requires-runtime", "MANIFEST_FROZEN_INVARIANT", (manifest) => { manifest.sourceRequiredForRuntime = true; }],
  ["none-policy-not-read-only", "MANIFEST_FROZEN_INVARIANT", (manifest) => { manifest.policy.readOnly = false; }],
  ["none-policy-local-input-not-ignored", "MANIFEST_FROZEN_INVARIANT", (manifest) => { manifest.policy.localInputIgnored = false; }],
  ["none-declares-source-commit", "MANIFEST_UNKNOWN_OR_MISSING_FIELD", (manifest) => { manifest.sourceCommit = "aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa"; }],
  ["none-declares-local-source-path", "MANIFEST_UNKNOWN_OR_MISSING_FIELD", (manifest) => { manifest.localSourcePath = "C:/private/source"; }],
  ["unknown-source-mode", "MANIFEST_INVALID_HEADER", (manifest) => { manifest.sourceMode = "local"; }],
  ["optional-short-commit", "OPTIONAL_SOURCE_COMMIT", (manifest) => { manifest.sources[0].sourceCommit = "abc"; }],
  ["optional-no-adoption", "OPTIONAL_LOCAL_INVARIANT", (manifest) => { manifest.adoptions = []; }],
  ["optional-missing-label", "OPTIONAL_SOURCE_INVALID_FIELDS", (manifest) => { delete manifest.sources[0].label; }],
  ["optional-label-drive-path", "OPTIONAL_SOURCE_LABEL", (manifest) => { manifest.sources[0].label = "C:/Synthetic/private-source"; }],
  ["optional-owner-unc-path", "OPTIONAL_SOURCE_OWNER", (manifest) => { manifest.sources[0].owner = "\\\\Synthetic\\private-source"; }],
  ["optional-provenance-url", "OPTIONAL_SOURCE_PROVENANCE", (manifest) => { manifest.sources[0].provenance = "https://example.invalid/source"; }],
  ["optional-adoption-owner-email", "ADOPTION_OWNER", (manifest) => { manifest.adoptions[0].owner = "synthetic@example.invalid"; }],
  ["optional-missing-source-hash", "OPTIONAL_SOURCE_INVALID_FIELDS", (manifest) => { delete manifest.sources[0].sourceHash; }],
  ["optional-changed-source-hash", "ADOPTION_SOURCE_HASH", (manifest) => { manifest.adoptions[0].sourceHash = "cccccccccccccccccccccccccccccccccccccccccccccccccccccccccccccccc"; }],
  ["optional-missing-owner", "OPTIONAL_SOURCE_INVALID_FIELDS", (manifest) => { delete manifest.sources[0].owner; }],
  ["optional-missing-license", "ADOPTION_INVALID_FIELDS", (manifest) => { delete manifest.adoptions[0].license; }],
  ["optional-missing-provenance", "OPTIONAL_SOURCE_INVALID_FIELDS", (manifest) => { delete manifest.sources[0].provenance; }],
  ["optional-missing-receipt", "ADOPTION_INVALID_FIELDS", (manifest) => { delete manifest.adoptions[0].receipt; }],
  ["optional-missing-target", "ADOPTION_INVALID_FIELDS", (manifest) => { delete manifest.adoptions[0].targetPath; }],
  ["optional-absolute-source-path", "OPTIONAL_SOURCE_PATH", (manifest) => { manifest.sources[0].sourcePath = "C:/private/source.ts"; }],
  ["optional-copy-source-root", "OPTIONAL_SOURCE_PATH", (manifest) => { manifest.sources[0].sourcePath = "."; }],
  ["optional-copy-target-root", "ADOPTION_TARGET_PATH", (manifest) => { manifest.adoptions[0].targetPath = "."; }],
  ["optional-copy-target-dot-slash", "ADOPTION_TARGET_PATH", (manifest) => { manifest.adoptions[0].targetPath = "./"; }],
  ["optional-path-traversal", "ADOPTION_TARGET_PATH", (manifest) => { manifest.adoptions[0].targetPath = "../escape.ts"; }],
  ["optional-copy-glob", "ADOPTION_GLOB", (manifest) => { manifest.adoptions[0].sourcePath = "packages/[a].ts"; }],
  ["optional-unknown-mode", "ADOPTION_INVALID_MODE", (manifest) => { manifest.adoptions[0].migrationMode = "COPY-ADAPT"; }],
  ["optional-unknown-source", "ADOPTION_UNKNOWN_SOURCE", (manifest) => { manifest.adoptions[0].sourceId = "missing-source"; }],
  ["optional-invalid-risk", "ADOPTION_RISK", (manifest) => { manifest.adoptions[0].risk = "severe"; }],
  ["optional-duplicate-adoption-id", "ADOPTION_DUPLICATE_ID", (manifest) => { manifest.adoptions.push(structuredClone(manifest.adoptions[0])); }],
  ["optional-not-read-only", "MANIFEST_FROZEN_INVARIANT", (manifest) => { manifest.policy.readOnly = false; }],
  ["optional-submodule", "MANIFEST_FROZEN_INVARIANT", (manifest) => { manifest.policy.gitSubmodule = true; }],
  ["optional-broad-cherry-pick", "MANIFEST_FROZEN_INVARIANT", (manifest) => { manifest.policy.broadCherryPick = true; }],
  ["optional-history-import", "MANIFEST_FROZEN_INVARIANT", (manifest) => { manifest.policy.gitHistoryImport = true; }]
];
