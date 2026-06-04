import { renderFriendlyGuide } from "./friendly-guide.js";

export interface AiReviewInput {
  answer: string;
  purpose?: string;
  source?: string;
}

export interface AiReviewItem {
  area: string;
  check: string;
  status: "needs-review" | "looks-ok";
  note: string;
}

export interface AiReviewResult {
  purpose: string;
  items: AiReviewItem[];
  revisionPrompt: string;
}

function includesAny(value: string, keywords: string[]): boolean {
  return keywords.some((keyword) => value.includes(keyword));
}

export function reviewAiOutput(input: AiReviewInput): AiReviewResult {
  const answer = input.answer.trim();
  const source = input.source?.trim() ?? "";
  const purpose = input.purpose?.trim() || "AI 답변 검토";

  const items: AiReviewItem[] = [
    {
      area: "사실 확인",
      check: "원본 자료에 없는 단정이 있는가?",
      status: source && answer.length > 0 ? "needs-review" : "needs-review",
      note: source
        ? "원본 자료와 대조해서 숫자, 기관명, 법령, 일정이 맞는지 확인하세요."
        : "원본 자료가 없으면 사실 여부를 반드시 별도로 확인해야 합니다.",
    },
    {
      area: "논리",
      check: "문제, 원인, 대안, 기대효과가 연결되어 있는가?",
      status: includesAny(answer, ["원인", "대안", "효과", "목표"])
        ? "looks-ok"
        : "needs-review",
      note: "문제에서 대안으로 바로 뛰지 않고 원인과 제약이 연결되는지 보세요.",
    },
    {
      area: "실행 가능성",
      check: "예산, 인력, 시간, 시스템 제약을 고려했는가?",
      status: includesAny(answer, ["예산", "인력", "시간", "시스템", "담당"])
        ? "looks-ok"
        : "needs-review",
      note: "실행 주체와 필요한 자원이 빠져 있으면 실제 업무로 옮기기 어렵습니다.",
    },
    {
      area: "시민 관점",
      check: "시민/이용자가 이해하기 쉬운 표현인가?",
      status: includesAny(answer, ["시민", "이용자", "주민", "신청자"])
        ? "looks-ok"
        : "needs-review",
      note: "담당자 관점의 표현만 있으면 시민 입장에서 다시 써야 합니다.",
    },
    {
      area: "리스크",
      check: "오해, 민원, 형평성, 개인정보 위험을 표시했는가?",
      status: includesAny(answer, ["리스크", "개인정보", "형평", "오해", "민원"])
        ? "looks-ok"
        : "needs-review",
      note: "정책/서비스 문서는 좋은 점만큼 실패 지점도 중요합니다.",
    },
    {
      area: "다음 행동",
      check: "바로 실행할 다음 단계가 명확한가?",
      status: includesAny(answer, ["다음", "1.", "2.", "3.", "실행"])
        ? "looks-ok"
        : "needs-review",
      note: "회의, 자료 요청, 안내문 수정, 담당자 확인 같은 다음 행동으로 바꾸세요.",
    },
  ];

  const revisionPrompt = [
    "아래 AI 답변을 검토 기준에 맞게 다시 고쳐줘.",
    "",
    "검토 기준:",
    "1. 원본 자료에 없는 단정은 표시하기",
    "2. 문제-원인-대안-성과지표 연결하기",
    "3. 예산/인력/시간/시스템 제약 반영하기",
    "4. 시민이 이해하기 쉬운 표현으로 바꾸기",
    "5. 리스크와 추가 확인 질문을 별도로 쓰기",
    "",
    "[AI 답변]",
    answer || "여기에 AI 답변을 붙여넣으세요.",
  ].join("\n");

  return { purpose, items, revisionPrompt };
}

export function renderAiReviewMarkdown(result: AiReviewResult): string {
  return [
    `# ${result.purpose}`,
    "",
    ...renderFriendlyGuide({
      title: "AI 답변 검토",
      steps: [
        "검토표에서 '검토 필요'로 표시된 줄을 먼저 보세요.",
        "숫자, 날짜, 기관명, 법령은 사람이 직접 확인하세요.",
        "아래 수정 질문을 AI에 다시 붙여넣으면 더 안전한 답변으로 다듬을 수 있습니다.",
      ],
      tip: "AI 답변은 초안입니다. 최종 문서나 시민 안내문에 쓰기 전에는 반드시 사람이 확인해야 합니다.",
    }),
    "## 검토표",
    "",
    "| 영역 | 확인할 것 | 상태 | 메모 |",
    "| --- | --- | --- | --- |",
    ...result.items.map((item) => {
      const status = item.status === "looks-ok" ? "초안상 포함" : "검토 필요";
      return `| ${item.area} | ${item.check} | ${status} | ${item.note} |`;
    }),
    "",
    "## 사람이 최종 확인할 것",
    "",
    "1. 숫자, 날짜, 법령, 기관명",
    "2. 개인정보 또는 민감정보",
    "3. 시민에게 오해될 수 있는 표현",
    "4. 실제 담당자가 실행할 수 있는지",
    "5. 최종 문서에 넣어도 되는 표현인지",
    "",
    "## AI에게 다시 맡길 수정 질문",
    "",
    result.revisionPrompt,
    "",
  ].join("\n");
}
