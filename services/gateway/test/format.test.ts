import assert from "node:assert/strict";
import { readdirSync, readFileSync } from "node:fs";
import { dirname, join, relative } from "node:path";
import test from "node:test";
import { fileURLToPath } from "node:url";

const workspaceRoot = join(dirname(fileURLToPath(import.meta.url)), "..");

function textFiles(directory: string): string[] {
  return readdirSync(directory, { withFileTypes: true })
    .flatMap((entry) => {
      const path = join(directory, entry.name);
      if (entry.isDirectory()) return textFiles(path);
      return /\.(?:json|md|ts)$/.test(entry.name) ? [path] : [];
    })
    .sort();
}

test("Gateway text and configuration formatting is deterministic", () => {
  const files = textFiles(workspaceRoot);
  for (const file of files) {
    const path = relative(workspaceRoot, file).replaceAll("\\", "/");
    const text = readFileSync(file, "utf8");
    assert.equal(text.includes("\r"), false, `${path}: CRLF is not allowed`);
    assert.equal(text.endsWith("\n"), true, `${path}: final newline is required`);
    assert.equal(text.split("\n").some((line) => /[ \t]$/.test(line)), false, `${path}: trailing whitespace`);
  }

  for (const name of ["package.json", "tsconfig.json"]) {
    const text = readFileSync(join(workspaceRoot, name), "utf8");
    assert.equal(text, `${JSON.stringify(JSON.parse(text), null, 2)}\n`, `${name}: non-canonical JSON`);
  }

  const readme = readFileSync(join(workspaceRoot, "README.md"), "utf8");
  assert.match(readme, /MVP04-I01 local prototype/);
  assert.match(readme, /\[::1\]:3001/);
  assert.match(readme, /Bootstrap\/persona and command receipt routes are not implemented/);
  assert.match(readme, /no Identity, Session, Authz, database, Redis, Ticket authority/);
});
