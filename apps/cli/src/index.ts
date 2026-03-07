import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { listAgentNames } from "@my-work-bench/agents";
import {
  classifyProjectCandidate,
  isAssetState,
  type ProjectCandidateStatus,
} from "@my-work-bench/core";

const PROJECT_STATES: ProjectCandidateStatus[] = [
  "source-of-truth",
  "empty-shell",
  "hold",
  "archive",
];

function printHelp(): void {
  console.log("Usage:");
  console.log("  npm run dev:cli");
  console.log("  npm run dev:cli -- classify project <name> <status>");
  console.log("  npm run dev:cli -- classify asset <name> <state>");
  console.log("  npm run dev:cli -- migrate:kodari [rootPath]");
  console.log("");
  console.log("Project status:", PROJECT_STATES.join(", "));
  console.log("Asset state: KEEP, MERGE, MOVE, ARCHIVE, DELETE_CANDIDATE");
}

function runDefault(): void {
  const projects = [
    classifyProjectCandidate("pslms", "empty-shell"),
    classifyProjectCandidate("kodari-manager", "source-of-truth"),
  ];

  console.log("my-work-bench CLI bootstrap");
  console.log("");
  console.log("Agents:", listAgentNames().join(", "));
  console.log("Projects:");
  for (const project of projects) {
    console.log(`- ${project.name}: ${project.status}`);
  }
}

function runClassify(args: string[]): void {
  const [target, name, value] = args;
  if (!target || !name || !value) {
    printHelp();
    return;
  }

  if (target === "project") {
    if (!PROJECT_STATES.includes(value as ProjectCandidateStatus)) {
      console.error(`Invalid project status: ${value}`);
      printHelp();
      process.exitCode = 1;
      return;
    }
    const project = classifyProjectCandidate(name, value as ProjectCandidateStatus);
    console.log(JSON.stringify(project, null, 2));
    return;
  }

  if (target === "asset") {
    if (!isAssetState(value)) {
      console.error(`Invalid asset state: ${value}`);
      printHelp();
      process.exitCode = 1;
      return;
    }
    console.log(
      JSON.stringify(
        {
          name,
          state: value,
        },
        null,
        2,
      ),
    );
    return;
  }

  printHelp();
  process.exitCode = 1;
}

function runMigrateKodari(args: string[]): void {
  const defaultRoot = "G:\\개발_202602\\코다리부장";
  const targetRoot = args[0] || defaultRoot;
  const reportDate = new Date().toISOString().slice(0, 10);
  const appDir = path.dirname(fileURLToPath(import.meta.url));
  const repoRoot = path.resolve(appDir, "..", "..", "..");
  const docsDir = path.join(repoRoot, "docs");
  const reportPath = path.join(docsDir, `kodari-migration-report-${reportDate}.md`);

  const serviceDir = path.join(targetRoot, "src", "core", "services");
  const backendDir = path.join(targetRoot, "backend", "src");
  const skillDir = path.join(targetRoot, ".agent", "skills");

  const serviceFiles = readFileNames(serviceDir);
  const backendFiles = readFileNames(backendDir);
  const skillFolders = readDirectoryNames(skillDir);

  const lines = [
    "# Kodari Migration Report",
    "",
    `- Date: ${reportDate}`,
    `- Root: \`${targetRoot}\``,
    "",
    "## Summary",
    "",
    `- service files: ${serviceFiles.length}`,
    `- backend files: ${backendFiles.length}`,
    `- skill folders: ${skillFolders.length}`,
    "",
    "## Services",
    "",
    ...serviceFiles.map((name) => `- ${name}`),
    "",
    "## Backend",
    "",
    ...backendFiles.map((name) => `- ${name}`),
    "",
    "## Skills",
    "",
    ...skillFolders.map((name) => `- ${name}`),
    "",
    "## Next",
    "",
    "1. Extract task/workflow/storage rules into packages/core.",
    "2. Move external integration logic into packages/integrations.",
    "3. Keep UI code in app layer and avoid domain logic there.",
    "",
  ];

  fs.mkdirSync(docsDir, { recursive: true });
  fs.writeFileSync(reportPath, lines.join("\n"), "utf8");
  console.log(`Created: ${reportPath}`);
}

function readFileNames(targetDir: string): string[] {
  if (!fs.existsSync(targetDir)) return [];
  return fs
    .readdirSync(targetDir, { withFileTypes: true })
    .filter((entry) => entry.isFile())
    .map((entry) => entry.name)
    .sort();
}

function readDirectoryNames(targetDir: string): string[] {
  if (!fs.existsSync(targetDir)) return [];
  return fs
    .readdirSync(targetDir, { withFileTypes: true })
    .filter((entry) => entry.isDirectory())
    .map((entry) => entry.name)
    .sort();
}

function main(): void {
  const [, , command, ...args] = process.argv;
  if (!command) {
    runDefault();
    return;
  }

  if (command === "classify") {
    runClassify(args);
    return;
  }
  if (command === "migrate:kodari") {
    runMigrateKodari(args);
    return;
  }

  printHelp();
  process.exitCode = 1;
}

main();
