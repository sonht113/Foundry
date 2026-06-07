#!/usr/bin/env node

import { execSync } from "child_process";
import { existsSync, readFileSync, writeFileSync } from "fs";
import { resolve, dirname } from "path";
import { fileURLToPath } from "url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const root = resolve(__dirname, "..");

const PACKAGES = [
  { name: "@foundry/electron", file: "apps/electron/package.json" },
  { name: "@foundry/mcp-server", file: "apps/mcp-server/package.json" },
  { name: "@foundry/database", file: "packages/database/package.json" },
  { name: "@foundry/domain", file: "packages/domain/package.json" },
  { name: "@foundry/shared", file: "packages/shared/package.json" },
];

const MCP_SERVER_TS = "apps/mcp-server/src/server.ts";
const CHANGELOG = "CHANGELOG.md";

function main() {
  const version = process.argv[2];
  if (!version) {
    console.error("Usage: node scripts/bump.js <version>");
    console.error("Example: node scripts/bump.js 0.2.0");
    process.exit(1);
  }

  if (!/^\d+\.\d+\.\d+$/.test(version)) {
    console.error("Version must be semver (e.g. 0.2.0)");
    process.exit(1);
  }

  const oldVersion = JSON.parse(
    readFileSync(resolve(root, "apps/electron/package.json"), "utf-8")
  ).version;

  if (version === oldVersion) {
    console.error(`Already at version ${version}`);
    process.exit(1);
  }

  console.log(`Bumping from ${oldVersion} → ${version}\n`);

  for (const pkg of PACKAGES) {
    const path = resolve(root, pkg.file);
    const json = JSON.parse(readFileSync(path, "utf-8"));
    json.version = version;
    writeFileSync(path, JSON.stringify(json, null, 2) + "\n");
    console.log(`  ✓ ${pkg.name} → ${version}`);
  }

  const serverPath = resolve(root, MCP_SERVER_TS);
  let serverContent = readFileSync(serverPath, "utf-8");
  const versionRegex = /version:\s*"[^"]+"/;
  const replaced = serverContent.replace(versionRegex, `version: "${version}"`);
  if (replaced !== serverContent) {
    writeFileSync(serverPath, replaced);
    console.log(`  ✓ MCP server hardcoded version → ${version}`);
  }

  const changelogPath = resolve(root, CHANGELOG);
  if (existsSync(changelogPath)) {
    let changelog = readFileSync(changelogPath, "utf-8");
    const placeholder = "## [Unreleased]";
    const today = new Date().toISOString().split("T")[0];
    if (changelog.includes(placeholder)) {
      changelog = changelog.replace(
        placeholder,
        `## [Unreleased]\n\n## [${version}] - ${today}`
      );
      writeFileSync(changelogPath, changelog);
      console.log(`  ✓ CHANGELOG.md → tagged ${version}`);
    }
  }

  console.log("\nDone! Next steps:");
  console.log(`  git add -A && git commit -m "chore: bump to ${version}"`);
  console.log(`  git tag v${version}`);
  console.log(`  git push origin main --tags`);
}

main();
