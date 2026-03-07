import fs from "node:fs";
import path from "node:path";
import * as core from "@my-work-bench/core";
import { listAgentNames } from "@my-work-bench/agents";
import { LocalJsonTaskRepository } from "@my-work-bench/integrations";
import { fileURLToPath } from "node:url";

type ScanEntry = {
  name: string;
  path: string;
  lastModified: string;
  suggestedState: core.AssetState;
  suggestedBucket:
    | "active-project"
    | "review-candidate"
    | "long-term-archive"
    | "do-not-touch";
  reason: string;
};

type MovePlan = {
  sourcePath: string;
  targetPath: string;
  state: core.AssetState;
  bucket: ScanEntry["suggestedBucket"];
  reason: string;
};

const currentFilePath = fileURLToPath(import.meta.url);
const repoRoot = path.resolve(path.dirname(currentFilePath), "..", "..", "..");
const gDriveRoot = "G:\\";
const dataDir = path.join(repoRoot, "data");
const docsDir = path.join(repoRoot, "docs");
const localDbPath = path.join(dataDir, "tasks.local-db.json");
const defaultKodariPath = path.join(
  gDriveRoot,
  "진행중프로젝트",
  "개인프로젝트",
  "개발_202602",
  "코다리부장",
);

function ensureDir(targetDir: string): void {
  fs.mkdirSync(targetDir, { recursive: true });
}

function todayStamp(date = new Date()): string {
  return date.toISOString().slice(0, 10);
}

function readJsonFile<T>(filePath: string): T {
  return JSON.parse(fs.readFileSync(filePath, "utf8")) as T;
}

function writeTextFile(filePath: string, content: string): void {
  ensureDir(path.dirname(filePath));
  fs.writeFileSync(filePath, content, "utf8");
}

function printHelp(): void {
  console.log("my-work-bench CLI");
  console.log("");
  console.log("Commands:");
  console.log("  classify project <name> <status>");
  console.log("  classify asset <name> <KEEP|MERGE|MOVE|ARCHIVE|DELETE_CANDIDATE>");
  console.log("  task:create <title>");
  console.log("  task:list");
  console.log("  migrate:kodari [rootPath]");
  console.log("  scan:folders [rootPath]");
  console.log("  apply:scan [state] [--apply] [scanJsonPath]");
  console.log("");
  console.log(`Agents: ${listAgentNames().join(", ")}`);
}

function latestFileByPrefix(prefix: string, extension: string): string | null {
  if (!fs.existsSync(dataDir)) {
    return null;
  }

  const candidates = fs
    .readdirSync(dataDir)
    .filter((name) => name.startsWith(prefix) && name.endsWith(extension))
    .sort();

  if (candidates.length === 0) {
    return null;
  }

  return path.join(dataDir, candidates[candidates.length - 1]);
}

function isSystemFolder(name: string): boolean {
  return [
    "$RECYCLE.BIN",
    "System Volume Information",
    "@@trjHD",
    "found.000",
  ].includes(name);
}

function shouldSkipScanFolder(fullPath: string, name: string): boolean {
  if (isSystemFolder(name)) {
    return true;
  }

  const normalized = path.normalize(fullPath);
  return normalized === path.normalize(dataDir) || normalized === path.normalize(docsDir);
}

function normalizeFolderName(name: string): string {
  const map: Record<string, string> = {
    "개발_202602": "개발_202602",
    "과거자료": "과거자료",
    "장기보관자료": "장기보관자료",
    "정리운영로그": "정리운영로그",
    "진행중프로젝트": "진행중프로젝트",
    "최근3개월검토": "최근3개월검토",
    "공동체 종합시스템_복사본": "공동체 종합시스템_복사본",
  };

  return map[name] ?? name;
}

function targetDirForBucket(bucket: ScanEntry["suggestedBucket"]): string | null {
  if (bucket === "review-candidate") {
    return path.join(gDriveRoot, "최근3개월검토", "자동분류");
  }

  if (bucket === "long-term-archive") {
    return path.join(gDriveRoot, "장기보관자료", "자동분류");
  }

  return null;
}

function buildMovePlan(entry: ScanEntry): MovePlan | null {
  const targetBase = targetDirForBucket(entry.suggestedBucket);
  if (!targetBase) {
    return null;
  }

  const folderName = path.basename(entry.path);
  return {
    sourcePath: entry.path,
    targetPath: path.join(targetBase, folderName),
    state: entry.suggestedState,
    bucket: entry.suggestedBucket,
    reason: entry.reason,
  };
}

function formatPlanMarkdown(
  title: string,
  plans: MovePlan[],
  scanFilePath: string,
  applyMode: boolean,
): string {
  const header = [
    `# ${title}`,
    "",
    `- 기준 스캔 파일: \`${scanFilePath}\``,
    `- 적용 모드: \`${applyMode ? "apply" : "plan"}\``,
    `- 생성일: \`${new Date().toISOString()}\``,
    "",
    "| source | target | state | bucket | reason |",
    "| --- | --- | --- | --- | --- |",
  ];

  const rows = plans.map((plan) => {
    return `| \`${plan.sourcePath}\` | \`${plan.targetPath}\` | \`${plan.state}\` | \`${plan.bucket}\` | \`${plan.reason}\` |`;
  });

  return header.concat(rows.length > 0 ? rows : ["| none | none | none | none | none |"]).join("\n");
}

async function runClassify(args: string[]): Promise<void> {
  const [scope, name, rawState] = args;
  if (!scope || !name || !rawState) {
    throw new Error("classify requires scope, name, and state");
  }

  if (scope === "project") {
    const project = core.classifyProjectCandidate(
      name,
      rawState as core.ProjectCandidateStatus,
    );
    console.log(JSON.stringify(project, null, 2));
    return;
  }

  if (scope === "asset") {
    if (!core.isAssetState(rawState)) {
      throw new Error(`invalid asset state: ${rawState}`);
    }
    console.log(
      JSON.stringify(
        {
          name,
          state: rawState,
        },
        null,
        2,
      ),
    );
    return;
  }

  throw new Error(`unsupported classify scope: ${scope}`);
}

async function runTaskCreate(args: string[]): Promise<void> {
  const title = args.join(" ").trim();
  if (!title) {
    throw new Error("task:create requires a title");
  }

  const repository = new LocalJsonTaskRepository(localDbPath);
  const task = await core.createTask(repository, { title });
  console.log(JSON.stringify(task, null, 2));
}

async function runTaskList(): Promise<void> {
  const repository = new LocalJsonTaskRepository(localDbPath);
  const tasks = await core.listRecentTasks(repository);
  console.log(JSON.stringify(tasks, null, 2));
}

async function runMigrateKodari(args: string[]): Promise<void> {
  const rootPath = args[0] || defaultKodariPath;
  const sourceExists = fs.existsSync(rootPath);
  const reportPath = path.join(
    docsDir,
    `kodari-migration-report-${todayStamp()}.md`,
  );

  const report = [
    `# 코다리부장 이관 리포트 (${todayStamp()})`,
    "",
    `- 기준 경로: \`${rootPath}\``,
    `- 경로 존재 여부: \`${sourceExists ? "exists" : "missing"}\``,
    "",
    "## 기준 판단",
    "",
    "- `packages/core`: 순수 도메인/유스케이스",
    "- `packages/integrations`: 외부 연동 및 저장소 어댑터",
    "- `apps/cli`: 로컬 실행기",
    "",
    "## 다음 단계",
    "",
    "1. backend task 핸들러를 core 유스케이스로 치환",
    "2. sheets/gas/firebase 어댑터 인터페이스 정리",
    "3. 스킬과 CLI 명령 연결",
    "",
  ].join("\n");

  writeTextFile(reportPath, report);
  console.log(JSON.stringify({ rootPath, sourceExists, reportPath }, null, 2));
}

async function runScanFolders(args: string[]): Promise<void> {
  const scanRoot = args[0] || gDriveRoot;
  const entries = fs.readdirSync(scanRoot, { withFileTypes: true });
  const results: ScanEntry[] = [];

  for (const entry of entries) {
    if (!entry.isDirectory()) {
      continue;
    }

    const fullPath = path.join(scanRoot, entry.name);
    if (shouldSkipScanFolder(fullPath, entry.name)) {
      continue;
    }

    try {
      const stats = fs.statSync(fullPath);
      const normalizedName = normalizeFolderName(entry.name);
      const classified = core.classifyFolderByName(normalizedName);

      results.push({
        name: normalizedName,
        path: fullPath,
        lastModified: stats.mtime.toISOString(),
        suggestedState: classified.suggestedState,
        suggestedBucket: classified.suggestedBucket,
        reason: classified.reason,
      });
    } catch {
      continue;
    }
  }

  const stamp = todayStamp();
  const jsonPath = path.join(dataDir, `folder-scan-${stamp}.json`);
  const mdPath = path.join(docsDir, `folder-scan-${stamp}.md`);
  writeTextFile(jsonPath, `${JSON.stringify(results, null, 2)}\n`);

  const markdown = [
    `# 폴더 스캔 결과 (${stamp})`,
    "",
    `- 기준 경로: \`${scanRoot}\``,
    "",
    "| name | state | bucket | reason |",
    "| --- | --- | --- | --- |",
    ...results.map((item) => {
      return `| \`${item.name}\` | \`${item.suggestedState}\` | \`${item.suggestedBucket}\` | \`${item.reason}\` |`;
    }),
    "",
  ].join("\n");
  writeTextFile(mdPath, markdown);

  console.log(JSON.stringify({ scanRoot, count: results.length, jsonPath, mdPath }, null, 2));
}

async function runApplyScan(args: string[]): Promise<void> {
  let stateFilter: core.AssetState | null = null;
  let applyMode = false;
  let scanPathArg: string | null = null;

  for (const arg of args) {
    if (arg === "--apply") {
      applyMode = true;
      continue;
    }

    if (core.isAssetState(arg)) {
      stateFilter = arg;
      continue;
    }

    if (arg.endsWith(".json")) {
      scanPathArg = path.isAbsolute(arg) ? arg : path.join(repoRoot, arg);
    }
  }

  const scanFilePath =
    scanPathArg || latestFileByPrefix("folder-scan-", ".json");
  if (!scanFilePath || !fs.existsSync(scanFilePath)) {
    throw new Error("folder scan json not found");
  }

  const scanEntries = readJsonFile<ScanEntry[]>(scanFilePath);
  const filtered = scanEntries.filter((entry) => {
    if (entry.suggestedBucket === "do-not-touch") {
      return false;
    }
    if (!stateFilter) {
      return entry.suggestedState === "MOVE" || entry.suggestedState === "ARCHIVE";
    }
    return entry.suggestedState === stateFilter;
  });

  const plans = filtered
    .map((entry) => buildMovePlan(entry))
    .filter((entry): entry is MovePlan => entry !== null)
    .filter((plan) => fs.existsSync(plan.sourcePath));

  const stamp = todayStamp();
  const docName = applyMode
    ? `apply-scan-result-${stamp}.md`
    : `apply-scan-plan-${stamp}.md`;
  const docPath = path.join(docsDir, docName);

  const applied: MovePlan[] = [];
  const skipped: Array<MovePlan & { skipReason: string }> = [];

  for (const plan of plans) {
    if (!applyMode) {
      continue;
    }

    if (fs.existsSync(plan.targetPath)) {
      skipped.push({ ...plan, skipReason: "target_exists" });
      continue;
    }

    ensureDir(path.dirname(plan.targetPath));
    fs.renameSync(plan.sourcePath, plan.targetPath);
    applied.push(plan);
  }

  const markdown = formatPlanMarkdown(
    applyMode ? "Apply Scan Result" : "Apply Scan Plan",
    applyMode ? applied : plans,
    scanFilePath,
    applyMode,
  );

  const skippedBlock =
    skipped.length === 0
      ? ""
      : `\n\n## Skipped\n\n| source | target | reason |\n| --- | --- | --- |\n${skipped
          .map(
            (item) =>
              `| \`${item.sourcePath}\` | \`${item.targetPath}\` | \`${item.skipReason}\` |`,
          )
          .join("\n")}\n`;

  writeTextFile(docPath, markdown + skippedBlock);
  console.log(
    JSON.stringify(
      {
        scanFilePath,
        applyMode,
        stateFilter,
        planCount: plans.length,
        appliedCount: applied.length,
        skippedCount: skipped.length,
        docPath,
      },
      null,
      2,
    ),
  );
}

async function main(): Promise<void> {
  ensureDir(dataDir);
  ensureDir(docsDir);

  const [command, ...args] = process.argv.slice(2);
  if (!command) {
    printHelp();
    return;
  }

  if (command === "classify") {
    await runClassify(args);
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

  if (command === "migrate:kodari") {
    await runMigrateKodari(args);
    return;
  }

  if (command === "scan:folders") {
    await runScanFolders(args);
    return;
  }

  if (command === "apply:scan") {
    await runApplyScan(args);
    return;
  }

  throw new Error(`unknown command: ${command}`);
}

main().catch((error: unknown) => {
  const message = error instanceof Error ? error.message : String(error);
  console.error(message);
  process.exitCode = 1;
});
