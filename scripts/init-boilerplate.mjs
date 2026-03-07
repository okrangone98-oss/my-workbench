import fs from "node:fs";
import path from "node:path";

function parseArg(name, fallback = "") {
  const idx = process.argv.indexOf(`--${name}`);
  if (idx === -1) return fallback;
  return process.argv[idx + 1] ?? fallback;
}

function ensureDir(dirPath) {
  fs.mkdirSync(dirPath, { recursive: true });
}

function writeIfMissing(filePath, content) {
  if (fs.existsSync(filePath)) {
    return false;
  }
  fs.writeFileSync(filePath, content, "utf8");
  return true;
}

const positional = process.argv
  .slice(2)
  .filter((arg) => !arg.startsWith("--"))
  .filter((arg, idx, arr) => !(idx > 0 && arr[idx - 1] === "full"));

const featureName = parseArg("name") || positional[0] || "";
const mode = parseArg("mode", positional[1] || "full");

if (!featureName) {
  console.error("Usage: npm run boilerplate:init -- --name <feature-name> [--mode full|core|skill]");
  process.exit(1);
}

const root = process.cwd();
const safeName = featureName.trim().toLowerCase().replace(/[^a-z0-9-]/g, "-");
if (!safeName) {
  console.error("Invalid feature name.");
  process.exit(1);
}

const created = [];

if (mode === "full" || mode === "core") {
  const coreDir = path.join(root, "packages", "core", "src", "domains");
  ensureDir(coreDir);
  const coreFile = path.join(coreDir, `${safeName}.ts`);
  const coreContent = `export interface ${toPascalCase(safeName)}Input {\n  id: string;\n}\n\nexport interface ${toPascalCase(safeName)}Result {\n  ok: boolean;\n}\n\nexport function run${toPascalCase(safeName)}(\n  _input: ${toPascalCase(safeName)}Input,\n): ${toPascalCase(safeName)}Result {\n  return { ok: true };\n}\n`;
  if (writeIfMissing(coreFile, coreContent)) created.push(coreFile);
}

if (mode === "full" || mode === "skill") {
  const skillDir = path.join(root, "skills", safeName);
  ensureDir(skillDir);
  const skillFile = path.join(skillDir, "SKILL.md");
  const skillContent = `---\nname: ${safeName}\ndescription: Execute ${safeName} workflows with repeatable steps and predictable outputs.\n---\n\n# ${toTitleCase(safeName)}\n\n## Execute workflow\n\n1. Collect required input.\n2. Validate source files and constraints.\n3. Run the workflow and produce structured output.\n4. Record decisions and next actions.\n`;
  if (writeIfMissing(skillFile, skillContent)) created.push(skillFile);
}

const docDir = path.join(root, "docs");
ensureDir(docDir);
const docFile = path.join(docDir, `${safeName}-boilerplate.md`);
const docContent = `# ${toTitleCase(safeName)} Boilerplate\n\n- Created: ${new Date().toISOString()}\n- Mode: ${mode}\n\n## Scope\n\nThis file tracks scaffolded assets for \`${safeName}\`.\n`;
if (writeIfMissing(docFile, docContent)) created.push(docFile);

if (created.length === 0) {
  console.log("No files created (all targets already exist).");
  process.exit(0);
}

console.log("Created files:");
for (const file of created) {
  console.log(`- ${path.relative(root, file)}`);
}

function toPascalCase(name) {
  return name
    .split("-")
    .filter(Boolean)
    .map((p) => p[0].toUpperCase() + p.slice(1))
    .join("");
}

function toTitleCase(name) {
  return name
    .split("-")
    .filter(Boolean)
    .map((p) => p[0].toUpperCase() + p.slice(1))
    .join(" ");
}
