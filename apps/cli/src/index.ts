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
  return JSON.parse(fs.readFileSync(filePath, "utf8").replace(/^\uFEFF/, "")) as T;
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
  console.log("  business:diagnose [businessName]");
  console.log("  skill:menu [number|id]");
  console.log("  brain:capture --kind <kind> --title <title> [--text <text>|--file <path>]");
  console.log("  ai:question <number|id> [--text <text>|--file <path>]");
  console.log("  policy:structure [--title <title>] [--text <text>|--file <path>]");
  console.log("  ai:review [--purpose <purpose>] [--text <text>|--file <path>]");
  console.log("  plan:notice [--title <title>] [--text <text>|--file <path>]");
  console.log("  marketing:ideas --topic <topic> [--brand <brand>] [--audience <audience>]");
  console.log("");
  console.log(`Agents: ${listAgentNames().join(", ")}`);
}

type CliOptions = {
  values: Record<string, string>;
  flags: Set<string>;
  rest: string[];
};

function parseCliOptions(args: string[]): CliOptions {
  const values: Record<string, string> = {};
  const flags = new Set<string>();
  const rest: string[] = [];

  for (let index = 0; index < args.length; index += 1) {
    const arg = args[index];
    if (arg === "--") {
      continue;
    }

    if (!arg.startsWith("--")) {
      rest.push(cleanCliText(arg));
      continue;
    }

    const key = arg.slice(2);
    const next = args[index + 1];
    if (!next || next.startsWith("--")) {
      flags.add(key);
      continue;
    }

    values[key] = cleanCliText(next);
    index += 1;
  }

  return { values, flags, rest };
}

function readStdinIfAvailable(): string {
  if (process.stdin.isTTY) {
    return "";
  }

  return fs.readFileSync(0, "utf8");
}

function readContentFromOptions(options: CliOptions): string {
  if (options.values.text) {
    return options.values.text;
  }

  if (options.values.file) {
    const filePath = path.isAbsolute(options.values.file)
      ? options.values.file
      : path.join(repoRoot, options.values.file);
    return fs.readFileSync(filePath, "utf8");
  }

  return readStdinIfAvailable();
}

function parseTags(value?: string): string[] {
  if (!value) {
    return [];
  }

  return value
    .split(",")
    .map((tag) => tag.trim())
    .filter((tag) => tag.length > 0);
}

function appendJsonIndex<T>(filePath: string, record: T): T[] {
  const existing = fs.existsSync(filePath) ? readJsonFile<T[]>(filePath) : [];
  const next = [...existing, record];
  writeJsonFile(filePath, next);
  return next;
}

function safeFileSlug(value: string): string {
  return value
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9가-힣_-]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 80);
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

async function runBusinessDiagnose(args: string[]): Promise<void> {
  const businessName = cleanCliText(args.join(" ")) || "my-workbench";
  const diagnosis = core.createBusinessAutomationDiagnosis({ businessName });
  const markdown = core.renderBusinessAutomationDiagnosisMarkdown(diagnosis);
  const slug = safeFileSlug(businessName) || "business";
  const reportPath = path.join(
    docsDir,
    `business-diagnosis-${slug}-${todayStamp()}.md`,
  );

  writeTextFile(reportPath, markdown);
  console.log(
    JSON.stringify(
      {
        businessName,
        reportPath,
        opportunities: diagnosis.opportunities.length,
      },
      null,
      2,
    ),
  );
}

async function runSkillMenu(args: string[]): Promise<void> {
  const [choiceValue] = args;
  if (!choiceValue) {
    console.log(core.renderSkillMenu());
    return;
  }

  const choice = core.findSkillMenuChoice(choiceValue);
  if (!choice) {
    console.log(core.renderSkillMenu());
    throw new Error(`unknown skill choice: ${choiceValue}`);
  }

  console.log(core.renderSkillChoiceGuide(choice));
}

async function runBrainCapture(args: string[]): Promise<void> {
  const options = parseCliOptions(args);
  const body = readContentFromOptions(options).trim();

  if (options.flags.has("help") || !body) {
    console.log(core.renderBrainCaptureKindMenu());
    if (!body) {
      console.log("");
      console.log("저장할 자료가 없어서 안내만 보여줬습니다.");
      console.log("자료는 --text, --file, 또는 파이프로 전달할 수 있습니다.");
    }
    return;
  }

  const title =
    options.values.title ||
    options.rest.join(" ").trim() ||
    `자료 ${todayStamp()}`;
  const kind = core.normalizeBrainCaptureKind(options.values.kind);
  const source = options.values.source;
  const tags = parseTags(options.values.tags);
  const capture = core.createBrainCapture({
    title,
    body,
    kind,
    source,
    tags,
  });
  const targetPath = path.join(dataDir, capture.record.relativePath);
  const indexPath = path.join(dataDir, "brain", "index.json");

  writeTextFile(targetPath, capture.markdown);
  appendJsonIndex(indexPath, capture.record);

  console.log(
    [
      "자료를 저장했습니다.",
      "",
      `- 제목: ${capture.record.title}`,
      `- 종류: ${capture.record.kind}`,
      `- 저장 위치: ${targetPath}`,
      "",
      "이제 이렇게 해보세요:",
      "",
      "1. 저장된 자료를 다시 열어 원문이 맞는지 확인하세요.",
      "2. 아래 명령으로 AI에게 물어볼 질문을 만드세요.",
      "3. AI 답변을 받으면 `ai:review`로 검토하세요.",
      "",
      `  npm run dev:cli -- ai:question 5 --file "${targetPath}"`,
    ].join("\n"),
  );
}

async function runAiQuestion(args: string[]): Promise<void> {
  const options = parseCliOptions(args);
  const [skillValue] = options.rest;
  if (!skillValue || options.flags.has("help")) {
    console.log(core.renderAiQuestionGuide());
    return;
  }

  const content = readContentFromOptions(options);
  const context = options.values.context;
  const question = core.createAiQuestionFromSkillValue(
    skillValue,
    content,
    context,
  );

  if (!question) {
    console.log(core.renderAiQuestionGuide());
    throw new Error(`unknown skill choice: ${skillValue}`);
  }

  console.log(question);
}

async function runPolicyStructure(args: string[]): Promise<void> {
  const options = parseCliOptions(args);
  const content = readContentFromOptions(options);
  if (options.flags.has("help") || !content.trim()) {
    console.log("정책/민원/서비스 자료를 문제 구조로 정리합니다.");
    console.log("");
    console.log("사용 예:");
    console.log(
      '  npm run dev:cli -- policy:structure -- --title "온라인 신청 민원" --text "민원 내용"',
    );
    console.log(
      '  npm run dev:cli -- policy:structure -- --file "data/brain/00_raw/..."',
    );
    return;
  }

  const result = core.createPolicyStructure({
    title: options.values.title,
    content,
    context: options.values.context,
  });

  console.log(core.renderPolicyStructureMarkdown(result));
}

async function runAiReview(args: string[]): Promise<void> {
  const options = parseCliOptions(args);
  const answer = readContentFromOptions(options);
  if (options.flags.has("help") || !answer.trim()) {
    console.log("AI가 만든 답변을 사람이 검토할 수 있는 표로 바꿉니다.");
    console.log("");
    console.log("사용 예:");
    console.log(
      '  npm run dev:cli -- ai:review -- --purpose "정책 답변 검토" --text "AI 답변"',
    );
    console.log('  npm run dev:cli -- ai:review -- --file "ai-answer.md"');
    return;
  }

  const result = core.reviewAiOutput({
    answer,
    purpose: options.values.purpose,
    source: options.values.source,
  });

  console.log(core.renderAiReviewMarkdown(result));
}

async function runPlanNotice(args: string[]): Promise<void> {
  const options = parseCliOptions(args);
  const content = readContentFromOptions(options);
  if (options.flags.has("help") || !content.trim()) {
    console.log("공고문이나 사업 안내문에서 요구사항, 준비자료, 체크리스트를 뽑습니다.");
    console.log("");
    console.log("사용 예:");
    console.log(
      '  npm run dev:cli -- plan:notice -- --title "청년 지원사업" --text "공고문 내용"',
    );
    console.log('  npm run dev:cli -- plan:notice -- --file "notice.md"');
    return;
  }

  const result = core.analyzePlanningNotice({
    title: options.values.title,
    content,
  });

  console.log(core.renderPlanningNoticeMarkdown(result));
}

async function runMarketingIdeas(args: string[]): Promise<void> {
  const options = parseCliOptions(args);
  const topic = options.values.topic || options.rest.join(" ");
  if (options.flags.has("help") || !topic.trim()) {
    console.log("마케팅 콘텐츠 아이디어, 캡션 방향, 해시태그를 만듭니다.");
    console.log("");
    console.log("사용 예:");
    console.log(
      '  npm run dev:cli -- marketing:ideas -- --topic "온라인 신청 절차 개선" --brand "정책 서비스"',
    );
    return;
  }

  const result = core.createMarketingIdeas({
    topic,
    brand: options.values.brand,
    audience: options.values.audience,
    tone: options.values.tone,
  });

  console.log(core.renderMarketingIdeasMarkdown(result));
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

  if (command === "business:diagnose") {
    await runBusinessDiagnose(args);
    return;
  }

  if (command === "skill:menu") {
    await runSkillMenu(args);
    return;
  }

  if (command === "brain:capture") {
    await runBrainCapture(args);
    return;
  }

  if (command === "ai:question") {
    await runAiQuestion(args);
    return;
  }

  if (command === "policy:structure") {
    await runPolicyStructure(args);
    return;
  }

  if (command === "ai:review") {
    await runAiReview(args);
    return;
  }

  if (command === "plan:notice") {
    await runPlanNotice(args);
    return;
  }

  if (command === "marketing:ideas") {
    await runMarketingIdeas(args);
    return;
  }

  throw new Error(`unknown command: ${command}`);
}

main().catch((error: unknown) => {
  const message = error instanceof Error ? error.message : String(error);
  console.error(message);
  process.exitCode = 1;
});
