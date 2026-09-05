import assert from "node:assert/strict";
import { readdirSync, readFileSync } from "node:fs";
import { dirname, join, relative } from "node:path";
import test from "node:test";
import { fileURLToPath } from "node:url";

const workspaceRoot = join(dirname(fileURLToPath(import.meta.url)), "..");
const sourceRoot = join(workspaceRoot, "src");

function sourceFiles(directory: string): string[] {
  return readdirSync(directory, { withFileTypes: true })
    .flatMap((entry) => {
      const path = join(directory, entry.name);
      return entry.isDirectory() ? sourceFiles(path) : path.endsWith(".ts") ? [path] : [];
    })
    .sort();
}

function moduleSpecifiers(source: string): string[] {
  const found = new Set<string>();
  const patterns = [
    /\b(?:import|export)\s+(?:[^"']*?\s+from\s+)?["']([^"']+)["']/g,
    /\bimport\(\s*["']([^"']+)["']\s*\)/g,
    /\brequire\(\s*["']([^"']+)["']\s*\)/g
  ];
  for (const pattern of patterns) {
    for (const match of source.matchAll(pattern)) {
      if (match[1]) found.add(match[1]);
    }
  }
  return [...found].sort();
}

test("Gateway runtime source stays inside the I01 local inbound-only boundary", () => {
  const files = sourceFiles(sourceRoot);
  const listenSites: string[] = [];

  for (const file of files) {
    const path = relative(workspaceRoot, file).replaceAll("\\", "/");
    const source = readFileSync(file, "utf8");

    for (const specifier of moduleSpecifiers(source)) {
      if (specifier.startsWith(".")) continue;
      assert.equal(specifier, "fastify", `${path}: unapproved runtime import ${specifier}`);
    }

    assert.doesNotMatch(
      source,
      /\b(?:fetch|XMLHttpRequest|WebSocket|EventSource|undici|child_process|worker_threads|Prisma|ioredis|Redis|SQLite|jsonwebtoken|OAuth|OIDC|dotenv)\b/,
      `${path}: forbidden runtime capability`
    );
    assert.doesNotMatch(
      source,
      /\b(?:process\.env|process\.argv|new\s+URL|baseUrl|endpoint)\b/,
      `${path}: arbitrary endpoint or environment configuration`
    );
    assert.doesNotMatch(
      source,
      /["'](?:0\.0\.0\.0|::|localhost|127\.0\.0\.1)["']/,
      `${path}: unsafe or alternate bind host`
    );
    assert.doesNotMatch(
      source,
      /(?:[A-Za-z]:[\\/]Users[\\/]|\/(?:Users|home)\/[^/\\\s]+|\b(?:password|secret|credential|cookie|patient|inpatient|outpatient)\b)/i,
      `${path}: sensitive or local-machine material`
    );
    assert.doesNotMatch(
      source,
      /\b(?:https?:\/\/|[a-z0-9-]+\.(?:local|lan|corp|internal))\b/i,
      `${path}: private hostname or outbound target`
    );

    for (const match of source.matchAll(/\.listen\s*\(/g)) {
      listenSites.push(`${path}:${match.index}`);
    }
  }

  assert.equal(listenSites.length, 1);
  assert.match(listenSites[0] ?? "", /^src\/server\.ts:/);
  const server = readFileSync(join(sourceRoot, "server.ts"), "utf8");
  assert.match(server, /app\.listen\(\{ host: "::1", port: 3001 \}\)/);
});
