const workspaceVersion = "workspace:*";

function packageFixture(path, name, options = {}) {
  return {
    path,
    manifest: {
      name,
      version: "0.0.0",
      exports: options.exports ?? ".",
      ...(options.dependencies ? { dependencies: options.dependencies } : {})
    },
    sources: options.sources ?? {}
  };
}

function validPackages() {
  return [
    packageFixture("apps/workspace-web", "@hospital/workspace-web", {
      dependencies: {
        "@hospital/api-client": workspaceVersion,
        "@hospital/workspace-contracts": workspaceVersion
      },
      sources: { "src/index.ts": 'import "@hospital/api-client"; import "@hospital/workspace-contracts";\n' }
    }),
    packageFixture("services/tickets", "@hospital/service-tickets", {
      dependencies: {
        "@hospital/ticket-contracts": workspaceVersion,
        "@hospital/ticket-repository": workspaceVersion
      },
      sources: { "src/index.ts": 'import "@hospital/ticket-contracts"; import "@hospital/ticket-repository";\n' }
    }),
    packageFixture("packages/ticket-repository", "@hospital/ticket-repository", {
      dependencies: {
        "@hospital/database-runtime": workspaceVersion,
        "@hospital/ticket-contracts": workspaceVersion
      },
      sources: { "src/index.ts": 'import "@hospital/database-runtime";\n' }
    }),
    packageFixture("packages/database-runtime", "@hospital/database-runtime"),
    packageFixture("packages/workspace-contracts", "@hospital/workspace-contracts", {
      dependencies: { "@hospital/time-core": workspaceVersion, zod: "4.0.0" },
      sources: { "src/index.ts": 'import "@hospital/time-core"; import "zod";\n' }
    }),
    packageFixture("packages/ticket-contracts", "@hospital/ticket-contracts"),
    packageFixture("packages/time-core", "@hospital/time-core"),
    packageFixture("packages/api-client", "@hospital/api-client", {
      exports: { ".": "./src/index.ts", "./public": "./src/public.ts" },
      sources: { "src/index.ts": "export const api = true;\n", "src/public.ts": "export const publicApi = true;\n", "src/internal.ts": "export const internal = true;\n" }
    }),
    packageFixture("packages/ui", "@hospital/ui"),
    packageFixture("services/collaboration", "@hospital/service-collaboration"),
    packageFixture("services/agent-gateway", "@hospital/service-agent-gateway"),
    packageFixture("services/fee", "@hospital/service-fee", { exports: { ".": "./src/index.ts", "./models": "./src/models.ts" }, sources: { "src/index.ts": "export {};\n", "src/models.ts": "export {};\n" } }),
    packageFixture("packages/fee-repository", "@hospital/fee-repository")
  ];
}

function clone(value) {
  return JSON.parse(JSON.stringify(value));
}

const defaultWorkspacePatterns = ["apps/*", "packages/*", "services/*"];

function fixture(name, expectedStatus, expectedCode, mutate = () => {}, workspacePatterns = defaultWorkspacePatterns) {
  const packages = clone(validPackages());
  mutate(packages);
  return { expectedCode, expectedStatus, name, packages, workspacePatterns };
}

function positiveRelation(name, from, to) {
  const definition = fixture(name, "PASS");
  definition.expectedEdge = { from, to };
  return definition;
}

function byPath(packages, path) {
  const result = packages.find((entry) => entry.path === path);
  if (!result) throw new Error(`missing-fixture-package:${path}`);
  return result;
}

export const fixtures = [
  positiveRelation("positive-frontend-sdk-contracts", "apps/workspace-web", "packages/api-client"),
  positiveRelation("positive-service-repository-contracts", "services/tickets", "packages/ticket-repository"),
  positiveRelation("positive-repository-database-runtime", "packages/ticket-repository", "packages/database-runtime"),
  positiveRelation("positive-contract-pure-utility", "packages/workspace-contracts", "packages/time-core"),
  fixture("positive-frontend-react", "PASS", undefined, (packages) => {
    byPath(packages, "apps/workspace-web").manifest.dependencies.react = "19.0.0";
  }),
  fixture("positive-ui-react", "PASS", undefined, (packages) => {
    byPath(packages, "packages/ui").manifest.dependencies = { react: "19.0.0" };
  }),
  fixture("positive-platform-fastify-node-runtime", "PASS", undefined, (packages) => {
    packages.push(packageFixture("services/gateway", "@hospital/service-gateway", { dependencies: { fastify: "5.0.0" }, sources: { "src/index.ts": 'import "node:fs";\n' } }));
  }),
  fixture("positive-platform-owned-repository", "PASS", undefined, (packages) => {
    packages.push(packageFixture("packages/collaboration-repository", "@hospital/collaboration-repository"));
    byPath(packages, "services/collaboration").manifest.dependencies = { "@hospital/collaboration-repository": workspaceVersion };
  }),
  fixture("positive-contract-zod-subpath", "PASS", undefined, (packages) => {
    byPath(packages, "packages/workspace-contracts").sources["src/index.ts"] += 'import "zod/v4";\n';
  }),
  fixture("positive-pure-utility-zod-subpath", "PASS", undefined, (packages) => {
    byPath(packages, "packages/time-core").manifest.dependencies = { zod: "4.0.0" };
    byPath(packages, "packages/time-core").sources["src/index.ts"] = 'import "zod/v4";\n';
  }),
  fixture("negative-internal-workspace-protocol", "FAIL", "INTERNAL_WORKSPACE_PROTOCOL", (packages) => {
    byPath(packages, "apps/workspace-web").manifest.dependencies["@hospital/api-client"] = "0.0.0";
  }),
  fixture("negative-internal-workspace-not-found", "FAIL", "INTERNAL_WORKSPACE_NOT_FOUND", (packages) => {
    byPath(packages, "apps/workspace-web").manifest.dependencies["@hospital/missing-contracts"] = workspaceVersion;
  }),
  fixture("negative-import-only-internal-workspace-not-found", "FAIL", "INTERNAL_WORKSPACE_NOT_FOUND", (packages) => {
    byPath(packages, "apps/workspace-web").sources["src/index.ts"] += 'import "@hospital/missing-contracts";\n';
  }),
  fixture("negative-cycle", "FAIL", "CIRCULAR_DEPENDENCY", (packages) => {
    const time = byPath(packages, "packages/time-core");
    time.manifest.dependencies = { "@hospital/authz-core": workspaceVersion };
    packages.push(packageFixture("packages/authz-core", "@hospital/authz-core", { dependencies: { "@hospital/time-core": workspaceVersion } }));
  }),
  fixture("negative-frontend-prisma", "FAIL", "FRONTEND_FORBIDDEN_RUNTIME", (packages) => {
    byPath(packages, "apps/workspace-web").manifest.dependencies.prisma = "7.0.0";
  }),
  fixture("negative-frontend-fastify", "FAIL", "FRONTEND_FORBIDDEN_RUNTIME", (packages) => {
    byPath(packages, "apps/workspace-web").manifest.dependencies.fastify = "5.0.0";
  }),
  fixture("negative-frontend-express", "FAIL", "FRONTEND_EXTERNAL_DEPENDENCY_NOT_ALLOWED", (packages) => {
    byPath(packages, "apps/workspace-web").manifest.dependencies.express = "5.0.0";
  }),
  fixture("negative-frontend-pg", "FAIL", "FRONTEND_FORBIDDEN_RUNTIME", (packages) => {
    byPath(packages, "apps/workspace-web").manifest.dependencies.pg = "8.0.0";
  }),
  fixture("negative-frontend-redis", "FAIL", "FRONTEND_FORBIDDEN_RUNTIME", (packages) => {
    byPath(packages, "apps/workspace-web").manifest.dependencies.redis = "5.0.0";
  }),
  fixture("negative-frontend-node-runtime-import", "FAIL", "FRONTEND_FORBIDDEN_RUNTIME", (packages) => {
    byPath(packages, "apps/workspace-web").sources["src/index.ts"] += 'import "node:http";\n';
  }),
  fixture("negative-frontend-database-runtime", "FAIL", "FRONTEND_FORBIDDEN_RUNTIME", (packages) => {
    byPath(packages, "apps/workspace-web").manifest.dependencies["@hospital/database-runtime"] = workspaceVersion;
  }),
  fixture("negative-frontend-service-implementation", "FAIL", "FRONTEND_FORBIDDEN_RUNTIME", (packages) => {
    byPath(packages, "apps/workspace-web").manifest.dependencies["@hospital/service-tickets"] = workspaceVersion;
  }),
  fixture("negative-domain-service-ui", "FAIL", "SERVICE_UI_DEPENDENCY", (packages) => {
    byPath(packages, "services/tickets").manifest.dependencies["@hospital/ui"] = workspaceVersion;
  }),
  fixture("negative-cross-domain-repository", "FAIL", "CROSS_DOMAIN_REPOSITORY", (packages) => {
    byPath(packages, "services/tickets").manifest.dependencies["@hospital/fee-repository"] = workspaceVersion;
  }),
  fixture("negative-collaboration-domain-repository", "FAIL", "PLATFORM_DOMAIN_REPOSITORY", (packages) => {
    byPath(packages, "services/collaboration").manifest.dependencies = { "@hospital/ticket-repository": workspaceVersion };
  }),
  fixture("negative-agent-gateway-domain-repository", "FAIL", "PLATFORM_DOMAIN_REPOSITORY", (packages) => {
    byPath(packages, "services/agent-gateway").manifest.dependencies = { "@hospital/ticket-repository": workspaceVersion };
  }),
  fixture("negative-gateway-non-owner-repository", "FAIL", "NON_OWNER_REPOSITORY_DEPENDENCY", (packages) => {
    packages.push(packageFixture("services/gateway", "@hospital/service-gateway", { dependencies: { "@hospital/ticket-repository": workspaceVersion } }));
  }),
  fixture("negative-contract-fastify", "FAIL", "CONTRACT_FORBIDDEN_RUNTIME", (packages) => {
    byPath(packages, "packages/workspace-contracts").manifest.dependencies.fastify = "5.0.0";
  }),
  fixture("negative-contract-react", "FAIL", "CONTRACT_FORBIDDEN_RUNTIME", (packages) => {
    byPath(packages, "packages/workspace-contracts").manifest.dependencies.react = "19.0.0";
  }),
  fixture("negative-contract-react-subpath", "FAIL", "CONTRACT_FORBIDDEN_RUNTIME", (packages) => {
    byPath(packages, "packages/workspace-contracts").sources["src/index.ts"] += 'import "react/jsx-runtime";\n';
  }),
  fixture("negative-contract-tauri", "FAIL", "CONTRACT_FORBIDDEN_RUNTIME", (packages) => {
    byPath(packages, "packages/workspace-contracts").manifest.dependencies["@tauri-apps/api"] = "2.0.0";
  }),
  fixture("negative-contract-prisma", "FAIL", "CONTRACT_FORBIDDEN_RUNTIME", (packages) => {
    byPath(packages, "packages/workspace-contracts").manifest.dependencies.prisma = "7.0.0";
  }),
  fixture("negative-contract-prisma-subpath", "FAIL", "CONTRACT_FORBIDDEN_RUNTIME", (packages) => {
    byPath(packages, "packages/workspace-contracts").sources["src/index.ts"] += 'import "@prisma/client/runtime";\n';
  }),
  fixture("negative-contract-pg", "FAIL", "CONTRACT_FORBIDDEN_RUNTIME", (packages) => {
    byPath(packages, "packages/workspace-contracts").manifest.dependencies.pg = "8.0.0";
  }),
  fixture("negative-contract-redis", "FAIL", "CONTRACT_FORBIDDEN_RUNTIME", (packages) => {
    byPath(packages, "packages/workspace-contracts").manifest.dependencies.redis = "5.0.0";
  }),
  fixture("negative-contract-node-runtime-import", "FAIL", "CONTRACT_FORBIDDEN_RUNTIME", (packages) => {
    byPath(packages, "packages/workspace-contracts").sources["src/index.ts"] += 'import "node:fs";\n';
  }),
  fixture("negative-pure-utility-runtime", "FAIL", "PURE_UTILITY_FORBIDDEN_RUNTIME", (packages) => {
    byPath(packages, "packages/time-core").manifest.dependencies = { react: "19.0.0" };
  }),
  fixture("negative-pure-utility-node-runtime", "FAIL", "PURE_UTILITY_FORBIDDEN_RUNTIME", (packages) => {
    byPath(packages, "packages/time-core").sources["src/index.ts"] = 'import "node:fs";\n';
  }),
  fixture("negative-sdk-server-runtime", "FAIL", "BROWSER_REACHABLE_FORBIDDEN_RUNTIME", (packages) => {
    byPath(packages, "packages/api-client").manifest.dependencies = { fastify: "5.0.0" };
  }),
  fixture("negative-ui-server-runtime", "FAIL", "BROWSER_REACHABLE_FORBIDDEN_RUNTIME", (packages) => {
    byPath(packages, "packages/ui").sources["src/index.ts"] = 'import "@tauri-apps/api";\n';
  }),
  fixture("negative-service-raw-database", "FAIL", "SERVICE_RAW_DATABASE_DEPENDENCY", (packages) => {
    byPath(packages, "services/tickets").manifest.dependencies.pg = "8.0.0";
  }),
  fixture("negative-domain-service-react", "FAIL", "SERVICE_EXTERNAL_DEPENDENCY_NOT_ALLOWED", (packages) => {
    byPath(packages, "services/tickets").manifest.dependencies.react = "19.0.0";
  }),
  fixture("negative-platform-service-react", "FAIL", "SERVICE_EXTERNAL_DEPENDENCY_NOT_ALLOWED", (packages) => {
    byPath(packages, "services/collaboration").manifest.dependencies = { react: "19.0.0" };
  }),
  fixture("negative-service-sdk-client", "FAIL", "FORBIDDEN_LAYER_DEPENDENCY", (packages) => {
    byPath(packages, "services/tickets").manifest.dependencies["@hospital/api-client"] = workspaceVersion;
  }),
  fixture("negative-private-deep-import", "FAIL", "PRIVATE_DEEP_IMPORT", (packages) => {
    byPath(packages, "apps/workspace-web").sources["src/index.ts"] += 'import "@hospital/api-client/src/internal";\n';
  }),
  fixture("negative-public-entrypoint", "FAIL", "PUBLIC_ENTRYPOINT_VIOLATION", (packages) => {
    byPath(packages, "apps/workspace-web").sources["src/index.ts"] += 'import "@hospital/api-client/private";\n';
  }),
  fixture("negative-root-export-not-declared", "FAIL", "PUBLIC_ENTRYPOINT_VIOLATION", (packages) => {
    byPath(packages, "packages/api-client").manifest.exports = { "./public": "./src/public.ts" };
  }),
  fixture("negative-relative-cross-workspace", "FAIL", "RELATIVE_CROSS_WORKSPACE_IMPORT", (packages) => {
    byPath(packages, "apps/workspace-web").sources["src/index.ts"] += 'import "../../../packages/api-client/src/index";\n';
  }),
  fixture("negative-relative-directory-cross-workspace", "FAIL", "RELATIVE_CROSS_WORKSPACE_IMPORT", (packages) => {
    byPath(packages, "apps/workspace-web").sources["index.ts"] = 'require("../../packages/api-client");\n';
  }),
  fixture("negative-legacy-portal-alias", "FAIL", "LEGACY_PORTAL_ALIAS", (packages) => {
    byPath(packages, "apps/workspace-web").manifest.dependencies["@portal/legacy"] = "1.0.0";
  }),
  fixture("negative-import-only-legacy-portal-alias", "FAIL", "LEGACY_PORTAL_ALIAS", (packages) => {
    byPath(packages, "apps/workspace-web").sources["src/index.ts"] += 'import "@portal/legacy";\n';
  }),
  fixture("negative-nextjs", "FAIL", "UNAPPROVED_NEXTJS", (packages) => {
    byPath(packages, "apps/workspace-web").manifest.dependencies.next = "16.0.0";
  }),
  fixture("negative-import-only-nextjs", "FAIL", "UNAPPROVED_NEXTJS", (packages) => {
    byPath(packages, "apps/workspace-web").sources["src/index.ts"] += 'import "next";\n';
  }),
  fixture("negative-import-only-nextjs-subpath", "FAIL", "UNAPPROVED_NEXTJS", (packages) => {
    byPath(packages, "apps/workspace-web").sources["src/index.ts"] += 'import "next/server";\n';
  }),
  fixture("negative-tauri-plugin", "FAIL", "UNAPPROVED_TAURI_PLUGIN", (packages) => {
    byPath(packages, "apps/workspace-web").manifest.dependencies["@tauri-apps/plugin-shell"] = "2.0.0";
  }),
  fixture("negative-import-only-tauri-plugin", "FAIL", "UNAPPROVED_TAURI_PLUGIN", (packages) => {
    byPath(packages, "apps/workspace-web").sources["src/index.ts"] += 'import "@tauri-apps/plugin-shell";\n';
  }),
  fixture("negative-generated-source", "FAIL", "COMMITTED_GENERATED_SOURCE", (packages) => {
    byPath(packages, "packages/api-client").sources["src/generated/client.ts"] = "export const generated = true;\n";
  }),
  fixture("negative-root-artifact", "FAIL", "COMMITTED_GENERATED_SOURCE", (packages) => {
    byPath(packages, "packages/api-client").sources["dist/client.js"] = "export const generated = true;\n";
  }),
  fixture("negative-cross-domain-database-model", "FAIL", "CROSS_DOMAIN_DATABASE_MODEL", (packages) => {
    byPath(packages, "services/tickets").sources["src/index.ts"] += 'import "@hospital/service-fee/models";\n';
  }),
  fixture("negative-undeclared-workspace-import", "FAIL", "UNDECLARED_WORKSPACE_IMPORT", (packages) => {
    delete byPath(packages, "apps/workspace-web").manifest.dependencies["@hospital/api-client"];
  }),
  fixture("negative-unregistered-workspace-manifest", "FAIL", "UNREGISTERED_WORKSPACE_MANIFEST", (packages) => {
    packages.push(packageFixture("packages/testkit", "@hospital/testkit"));
  }, ["apps/*", "packages/api-client", "packages/database-runtime", "packages/fee-repository", "packages/ticket-contracts", "packages/ticket-repository", "packages/time-core", "packages/ui", "packages/workspace-contracts", "services/agent-gateway", "services/collaboration", "services/fee", "services/tickets"]),
  fixture("negative-workspace-pattern-without-manifest", "FAIL", "WORKSPACE_PATTERN_WITHOUT_MANIFEST", () => {}, [...defaultWorkspacePatterns, "packages/not-created"]),
  fixture("negative-unclassified-workspace", "FAIL", "UNCLASSIFIED_WORKSPACE", (packages) => {
    packages.push(packageFixture("packages/unclassified", "@hospital/unclassified"));
  }),
  fixture("negative-unowned-repository", "FAIL", "UNOWNED_REPOSITORY", (packages) => {
    packages.push(packageFixture("packages/unowned-repository", "@hospital/unowned-repository"));
  })
];
