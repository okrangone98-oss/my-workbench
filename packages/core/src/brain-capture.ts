export type BrainCaptureKind =
  | "policy"
  | "planning"
  | "marketing"
  | "meeting"
  | "memo"
  | "general";

export interface BrainCaptureInput {
  title: string;
  body: string;
  kind?: BrainCaptureKind;
  source?: string;
  tags?: string[];
  createdAt?: Date;
}

export interface BrainCaptureRecord {
  id: string;
  title: string;
  kind: BrainCaptureKind;
  source: string | null;
  tags: string[];
  createdAt: string;
  date: string;
  fileName: string;
  relativePath: string;
}

export const BRAIN_CAPTURE_KINDS: Array<{
  kind: BrainCaptureKind;
  koreanName: string;
  description: string;
}> = [
  {
    kind: "policy",
    koreanName: "정책/민원 자료",
    description: "민원, 현장 의견, 정책 아이디어, 시민 서비스 개선 자료",
  },
  {
    kind: "planning",
    koreanName: "사업계획 자료",
    description: "공고문, 사업 아이디어, 제안서 참고자료",
  },
  {
    kind: "marketing",
    koreanName: "마케팅 자료",
    description: "콘텐츠 주제, 브랜드 자료, 고객/페르소나 메모",
  },
  {
    kind: "meeting",
    koreanName: "회의 메모",
    description: "회의록, 결정사항, 후속 작업",
  },
  {
    kind: "memo",
    koreanName: "일반 메모",
    description: "아이디어, 짧은 생각, 임시 기록",
  },
  {
    kind: "general",
    koreanName: "그냥 보관할 자료",
    description: "아직 분류하지 않은 원본 자료",
  },
];

export function isBrainCaptureKind(value: string): value is BrainCaptureKind {
  return BRAIN_CAPTURE_KINDS.some((entry) => entry.kind === value);
}

export function normalizeBrainCaptureKind(value?: string): BrainCaptureKind {
  if (!value) {
    return "general";
  }

  const normalized = value.trim().toLowerCase();
  if (isBrainCaptureKind(normalized)) {
    return normalized;
  }

  const koreanMatch = BRAIN_CAPTURE_KINDS.find((entry) => {
    return entry.koreanName === value.trim();
  });

  return koreanMatch?.kind ?? "general";
}

export function createSafeFileName(value: string): string {
  const cleaned = value
    .trim()
    .replace(/[<>:"/\\|?*\u0000-\u001F]/g, " ")
    .replace(/\s+/g, "-")
    .replace(/-+/g, "-")
    .replace(/^-+|-+$/g, "");

  return (cleaned || "untitled").slice(0, 80);
}

export function createBrainCapture(input: BrainCaptureInput): {
  record: BrainCaptureRecord;
  markdown: string;
} {
  const createdAt = input.createdAt ?? new Date();
  const createdAtIso = createdAt.toISOString();
  const date = createdAtIso.slice(0, 10);
  const kind = input.kind ?? "general";
  const title = input.title.trim() || "제목 없는 자료";
  const tags = (input.tags ?? [])
    .map((tag) => tag.trim())
    .filter((tag) => tag.length > 0);
  const stamp = createdAtIso.replace(/[:.]/g, "-");
  const fileName = `${stamp}-${createSafeFileName(title)}.md`;
  const relativePath = `brain/00_raw/${date}/${fileName}`;
  const id = `${date}-${createSafeFileName(title).toLowerCase()}`;

  const kindLabel =
    BRAIN_CAPTURE_KINDS.find((entry) => entry.kind === kind)?.koreanName ??
    "그냥 보관할 자료";

  const record: BrainCaptureRecord = {
    id,
    title,
    kind,
    source: input.source?.trim() || null,
    tags,
    createdAt: createdAtIso,
    date,
    fileName,
    relativePath,
  };

  const markdown = [
    "---",
    `title: ${JSON.stringify(title)}`,
    `kind: ${kind}`,
    `kindName: ${JSON.stringify(kindLabel)}`,
    `createdAt: ${createdAtIso}`,
    `source: ${JSON.stringify(record.source ?? "")}`,
    `tags: ${JSON.stringify(tags)}`,
    "---",
    "",
    `# ${title}`,
    "",
    "## 분류",
    "",
    `- 종류: ${kindLabel}`,
    `- 출처: ${record.source ?? "없음"}`,
    `- 태그: ${tags.length > 0 ? tags.join(", ") : "없음"}`,
    "",
    "## 원본 자료",
    "",
    input.body.trim(),
    "",
    "## 다음에 AI에게 물어볼 수 있는 질문",
    "",
    "- 이 자료의 핵심 문제와 이해관계자를 정리해줘.",
    "- 이 자료를 바탕으로 다음 행동 3가지를 제안해줘.",
    "- 놓치기 쉬운 리스크와 추가 확인 질문을 뽑아줘.",
    "",
  ].join("\n");

  return { record, markdown };
}

export function renderBrainCaptureKindMenu(): string {
  return [
    "자료를 어떻게 저장할까요?",
    "",
    ...BRAIN_CAPTURE_KINDS.map((entry, index) => {
      return `${index + 1}. ${entry.koreanName} - ${entry.description}`;
    }),
    "",
    "사용 예:",
    '  npm run dev:cli -- brain:capture --kind policy --title "민원 메모" --text "내용"',
    '  Get-Content memo.txt | npm run dev:cli -- brain:capture -- --kind meeting --title "회의 메모"',
  ].join("\n");
}
