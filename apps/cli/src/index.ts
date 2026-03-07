import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { listAgentNames } from "@my-work-bench/agents";
import * as core from "@my-work-bench/core";
import { LocalJsonTaskRepository } from "@my-work-bench/integrations";

const PROJECT_STATES: core.ProjectCandidateStatus[] = [
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
  console.log("  npm run dev:cli -- scan:folders [rootPath]");
  console.log("  npm run dev:cli -- task:create <title>");
  console.log("  npm run dev:cli -- task:list");
  console.log("");
  console.log("Project status:", PROJECT_STATES.join(", "));
  console.log("Asset state: KEEP, MERGE, MOVE, ARCHIVE, DELETE_CANDIDATE");
}

function getRepoRoot(): string {
  const appDir = path.dirname(fileURLToPath(import.meta.url));
  return path.resolve(appDir, "..", "..", "..");
}

function runDefault(): void {
  const projects = [
    core.classifyProjectCandidate("pslms", "empty-shell"),
    core.classifyProjectCandidate("kodari-manager", "source-of-truth"),
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
    if (!PROJECT_STATES.includes(value as core.ProjectCandidateStatus)) {
      console.error(`Invalid project status: ${value}`);
      printHelp();
      process.exitCode = 1;
      return;
    }
    const project = core.classifyProjectCandidate(
      name,
      value as core.ProjectCandidateStatus,
    );
    console.log(JSON.stringify(project, null, 2));
    return;
  }

  if (target === "asset") {
    if (!core.isAssetState(value)) {
      console.error(`Invalid asset state: ${value}`);
      printHelp();
      process.exitCode = 1;
      return;
    }
    console.log(JSON.stringify({ name, state: value }, null, 2));
    return;
  }

  printHelp();
  process.exitCode = 1;
}

function runMigrateKodari(args: string[]): void {
  const defaultRoot = "G:\\진행중프로젝트\\개인프로젝트\\개발_202602\\코다리부장";
  const targetRoot = args[0] || defaultRoot;
  const reportDate = new Date().toISOString().slice(0, 10);
  const repoRoot = getRepoRoot();
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

function runScanFolders(args: string[]): void {
  const targetRoot = args[0] || "G:\\";
  if (!fs.existsSync(targetRoot)) {
    console.error(`scan root not found: ${targetRoot}`);
    process.exitCode = 1;
    return;
  }

  const repoRoot = getRepoRoot();
  const docsDir = path.join(repoRoot, "docs");
  const dataDir = path.join(repoRoot, "data");
  const stamp = new Date().toISOString().slice(0, 10);
  const jsonPath = path.join(dataDir, `folder-scan-${stamp}.json`);
  const mdPath = path.join(docsDir, `folder-scan-${stamp}.md`);

  const dirs = fs
    .readdirSync(targetRoot, { withFileTypes: true })
    .filter((entry) => entry.isDirectory())
    .map((entry) => {
      const fullPath = path.join(targetRoot, entry.name);
      try {
        const stat = fs.statSync(fullPath);
        const classified = core.classifyFolderByName(entry.name);
        return {
          name: entry.name,
          path: fullPath,
          lastModified: stat.mtime.toISOString(),
          ...classified,
        };
      } catch {
        return null;
      }
    })
    .filter((item): item is NonNullable<typeof item> => item !== null)
    .sort((a, b) => a.name.localeCompare(b.name));

  fs.mkdirSync(dataDir, { recursive: true });
  fs.mkdirSync(docsDir, { recursive: true });
  fs.writeFileSync(jsonPath, JSON.stringify(dirs, null, 2), "utf8");

  const mdLines = [
    "# Folder Scan Report",
    "",
    `- Date: ${stamp}`,
    `- Root: \`${targetRoot}\``,
    "",
    "| Name | Path | Last Modified | Suggested State | Bucket | Reason |",
    "|---|---|---|---|---|---|",
    ...dirs.map(
      (d) =>
        `| ${d.name} | \`${d.path}\` | ${d.lastModified} | ${d.suggestedState} | ${d.suggestedBucket} | ${d.reason} |`,
    ),
    "",
  ];
  fs.writeFileSync(mdPath, mdLines.join("\n"), "utf8");

  console.log(`Created: ${jsonPath}`);
  console.log(`Created: ${mdPath}`);
}

function getLocalTaskRepository(): LocalJsonTaskRepository {
  const repoRoot = getRepoRoot();
  const dbPath = path.join(repoRoot, "data", "tasks.local-db.json");
  return new LocalJsonTaskRepository(dbPath);
}

async function runTaskCreate(args: string[]): Promise<void> {
  const title = (args[0] || "").trim();
  if (!title) {
    console.error("task:create requires a title.");
    process.exitCode = 1;
    return;
  }
  const repository = getLocalTaskRepository();
  const task = await core.createTask(repository, { title });
  await repository.appendActivity({
    type: "task_created",
    message: `Task created: ${task.title}`,
    actor: "cli",
  });
  console.log(JSON.stringify(task, null, 2));
}

async function runTaskList(): Promise<void> {
  const repository = getLocalTaskRepository();
  const tasks = await core.listRecentTasks(repository, 20);
  if (tasks.length === 0) {
    console.log("No tasks yet.");
    return;
  }
  console.log(JSON.stringify(tasks, null, 2));
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

async function main(): Promise<void> {
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
  if (command === "scan:folders") {
    runScanFolders(args);
    return;
  }
  if (command === "task:create") {
    await runTaskCreate(args);
    return;
  }
  if (command === "task:list") {
    await runTaskList();
    return;
  }

  printHelp();
  process.exitCode = 1;
}

main().catch((error: unknown) => {
  const message = error instanceof Error ? error.message : String(error);
  console.error(message);
  process.exitCode = 1;
});
