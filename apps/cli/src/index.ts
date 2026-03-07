import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import * as core from "@my-work-bench/core";
import { listAgentNames } from "@my-work-bench/agents";
import { LocalJsonTaskRepository } from "@my-work-bench/integrations";

type ScanBucket =
  | "active-project"
  | "review-candidate"
  | "long-term-archive"
  | "do-not-touch";

type ScanEntry = {
  name: string;
  path: string;
  lastModified: string;
  suggestedState: core.AssetState;
  suggestedBucket: ScanBucket;
  reason: string;
};

type MovePlan = {
  sourcePath: string;
  targetPath: string;
  state: core.AssetState;
  bucket: ScanBucket;
  reason: string;
};

type SkipRecord = MovePlan & {
  skipReason: string;
};

const currentFilePath = fileURLToPath(import.meta.url);
const repoRoot = path.resolve(path.dirname(currentFilePath), "..", "..", "..");
const gDriveRoot = "G:\\";
const dataDir = path.join(repoRoot, "data");
const docsDir = path.join(repoRoot, "docs");
const localDbPath = path.join(dataDir, "tasks.local-db.json");
const organizeLogDir = path.join(gDriveRoot, "정리운영로그");
const defaultKodariPath = path.join(
  gDriveRoot,
  "진행중프로젝트",
  "개인프로젝트",
  "개발_202602",
  "코다리부장",
);

const protectedNames = new Set<string>([
  "$RECYCLE.BIN",
  "System Volume Information",
  "@@trjHD",
  "found.000",
  "과거자료",
  "장기보관자료",
  "정리운영로그",
  "진행중프로젝트",
  "최근3개월검토",
  "my-work-bench",
]);

function ensureDir(targetDir: string): void {
  fs.mkdirSync(targetDir, { recursive: true });
}

function todayStamp(date = new Date()): string {
  return date.toISOString().slice(0, 10);
}

function nowStamp(date = new Date()): string {
  return date.toISOString().replace(/[:]/g, "-");
}

function readJsonFile<T>(filePath: string): T {
  return JSON.parse(fs.readFileSync(filePath, "utf8")) as T;
}

function writeTextFile(filePath: string, content: string): void {
  ensureDir(path.dirname(filePath));
  fs.writeFileSync(filePath, content, "utf8");
}

function writeJsonFile(filePath: string, value: unknown): void {
  writeTextFile(filePath, `${JSON.stringify(value, null, 2)}\n`);
}

function cleanCliText(value: string): string {
  return value.replace(/\^/g, "").trim();
}

function printHelp(): void {
  console.log("my-work-bench CLI");
  console.log("");
  console.log("Commands:");
  console.log("  classify project <name> <status>");
  console.log("  classify asset <name> <KEEP|MERGE|MOVE|ARCHIVE|DELETE_CANDIDATE>");
  console.log("  task:create <title>");
  console.log("  task:list");
  console.log("  task:dashboard");
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

function isProtectedName(name: string): boolean {
  return protectedNames.has(name);
}

function isProtectedPath(targetPath: string): boolean {
  const normalized = path.normalize(targetPath);
  const baseNames = normalized
    .split(path.sep)
    .filter(Boolean)
    .map((value) => value.trim());

  return baseNames.some((value) => protectedNames.has(value));
}

function shouldSkipScanFolder(fullPath: string, name: string): boolean {
  if (
    isProtectedName(name) &&
    ![
      "과거자료",
      "장기보관자료",
      "정리운영로그",
      "진행중프로젝트",
      "최근3개월검토",
    ].includes(name)
  ) {
    return true;
  }

  const normalized = path.normalize(fullPath);
  return (
    normalized === path.normalize(dataDir) ||
    normalized === path.normalize(docsDir)
  );
}

function targetDirForBucket(bucket: ScanBucket): string | null {
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

  return {
    sourcePath: entry.path,
    targetPath: path.join(targetBase, path.basename(entry.path)),
    state: entry.suggestedState,
    bucket: entry.suggestedBucket,
    reason: entry.reason,
  };
}

function isDirectChildOfGDrive(targetPath: string): boolean {
  return path.dirname(path.normalize(targetPath)) === path.normalize(gDriveRoot);
}

function isNestedPath(parentPath: string, childPath: string): boolean {
  const parent = path.normalize(parentPath).toLowerCase();
  const child = path.normalize(childPath).toLowerCase();
  return child.startsWith(`${parent}${path.sep}`) || child === parent;
}

function validateMovePlan(plan: MovePlan): string | null {
  if (!fs.existsSync(plan.sourcePath)) {
    return "source_missing";
  }

  if (!isDirectChildOfGDrive(plan.sourcePath)) {
    return "source_not_root_child";
  }

  if (isProtectedPath(plan.sourcePath)) {
    return "source_protected";
  }

  if (isProtectedName(path.basename(plan.sourcePath))) {
    return "source_protected";
  }

  if (isNestedPath(plan.sourcePath, plan.targetPath)) {
    return "target_inside_source";
  }

  if (fs.existsSync(plan.targetPath)) {
    return "target_exists";
  }

  return null;
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

  return header
    .concat(rows.length > 0 ? rows : ["| none | none | none | none | none |"])
    .join("\n");
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

    console.log(JSON.stringify({ name, state: rawState }, null, 2));
    return;
  }

  throw new Error(`unsupported classify scope: ${scope}`);
}

async function runTaskCreate(args: string[]): Promise<void> {
  const title = cleanCliText(args.join(" "));
  if (!title) {
    throw new Error("task:create requires a title");
  }

  const repository = new LocalJsonTaskRepository(localDbPath);
  const task = await core.createTaskWithActivity(repository, { title });
  console.log(JSON.stringify(task, null, 2));
}

async function runTaskList(): Promise<void> {
  const repository = new LocalJsonTaskRepository(localDbPath);
  const tasks = await core.listRecentTasks(repository);
  console.log(JSON.stringify(tasks, null, 2));
}

async function runTaskDashboard(): Promise<void> {
  const repository = new LocalJsonTaskRepository(localDbPath);
  const snapshot = await core.getDashboardSnapshot(repository, 6);
  console.log(JSON.stringify(snapshot, null, 2));
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
    "- `packages/core`: 순수 도메인과 유스케이스",
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
      const classified = core.classifyFolderByName(entry.name);

      results.push({
        name: entry.name,
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

  results.sort((a, b) => a.name.localeCompare(b.name, "ko"));

  const stamp = todayStamp();
  const jsonPath = path.join(dataDir, `folder-scan-${stamp}.json`);
  const mdPath = path.join(docsDir, `folder-scan-${stamp}.md`);
  writeJsonFile(jsonPath, results);

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

  const scanFilePath = scanPathArg || latestFileByPrefix("folder-scan-", ".json");
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

  const allPlans = filtered
    .map((entry) => buildMovePlan(entry))
    .filter((entry): entry is MovePlan => entry !== null);

  const eligiblePlans: MovePlan[] = [];
  const skipped: SkipRecord[] = [];

  for (const plan of allPlans) {
    const validationError = validateMovePlan(plan);
    if (validationError) {
      skipped.push({ ...plan, skipReason: validationError });
      continue;
    }
    eligiblePlans.push(plan);
  }

  const stamp = todayStamp();
  const docName = applyMode
    ? `apply-scan-result-${stamp}.md`
    : `apply-scan-plan-${stamp}.md`;
  const docPath = path.join(docsDir, docName);

  const applied: MovePlan[] = [];
  for (const plan of eligiblePlans) {
    if (!applyMode) {
      continue;
    }

    ensureDir(path.dirname(plan.targetPath));
    fs.renameSync(plan.sourcePath, plan.targetPath);
    applied.push(plan);
  }

  const logPayload = {
    runAt: new Date().toISOString(),
    scanFilePath,
    applyMode,
    stateFilter,
    eligibleCount: eligiblePlans.length,
    appliedCount: applied.length,
    skippedCount: skipped.length,
    applied,
    skipped,
  };

  writeJsonFile(path.join(dataDir, `apply-scan-log-${nowStamp()}.json`), logPayload);

  const markdown = formatPlanMarkdown(
    applyMode ? "Apply Scan Result" : "Apply Scan Plan",
    applyMode ? applied : eligiblePlans,
    scanFilePath,
    applyMode,
  );

  const safetyRules = [
    "## Safety Rules",
    "",
    "- `G:\\` 바로 아래 1depth 폴더만 이동한다.",
    "- 보호 폴더(`과거자료`, `장기보관자료`, `정리운영로그`, `진행중프로젝트`, `최근3개월검토`, `my-work-bench`)는 이동하지 않는다.",
    "- 대상 경로가 이미 존재하면 건너뛴다.",
    "- 대상 경로가 소스 경로 내부이면 건너뛴다.",
    "",
  ].join("\n");

  const skippedBlock =
    skipped.length === 0
      ? ""
      : `\n\n## Skipped\n\n| source | target | reason |\n| --- | --- | --- |\n${skipped
          .map(
            (item) =>
              `| \`${item.sourcePath}\` | \`${item.targetPath}\` | \`${item.skipReason}\` |`,
          )
          .join("\n")}\n`;

  writeTextFile(docPath, `${markdown}\n\n${safetyRules}${skippedBlock}`);

  if (applyMode && applied.length > 0) {
    ensureDir(organizeLogDir);
    const operationLogPath = path.join(
      organizeLogDir,
      `apply-scan-${nowStamp()}.log`,
    );
    const lines = applied.map((plan) => {
      return `[${new Date().toISOString()}] moved ${plan.sourcePath} -> ${plan.targetPath}`;
    });
    writeTextFile(operationLogPath, `${lines.join("\n")}\n`);
  }

  console.log(
    JSON.stringify(
      {
        scanFilePath,
        applyMode,
        stateFilter,
        planCount: eligiblePlans.length,
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

  if (command === "task:dashboard") {
    await runTaskDashboard();
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
