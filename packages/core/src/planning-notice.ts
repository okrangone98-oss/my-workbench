import { renderCopyToAiGuide, renderFriendlyGuide } from "./friendly-guide.js";

export interface PlanningNoticeInput {
  content: string;
  title?: string;
}

export interface PlanningNoticeResult {
  title: string;
  summary: string;
  requirements: string[];
  evidenceToPrepare: string[];
  risks: string[];
  aiQuestions: string[];
  checklist: string[];
}

function splitLines(content: string): string[] {
  return content
    .replace(/\r\n/g, "\n")
    .split(/\n|[.!?。]/)
    .map((line) => line.trim())
    .filter((line) => line.length > 0);
}

function findLines(content: string, keywords: string[], fallback: string): string[] {
  const matches = splitLines(content).filter((line) => {
    return keywords.some((keyword) => line.includes(keyword));
  });

  return matches.length > 0 ? matches.slice(0, 6) : [fallback];
}

export function analyzePlanningNotice(
  input: PlanningNoticeInput,
): PlanningNoticeResult {
  const content = input.content.trim();
  const title = input.title?.trim() || "사업계획 공고문 분석";
  const lines = splitLines(content);
  const summary = lines.slice(0, 3).join(" ") || "공고문 내용이 없습니다.";

  const requirements = findLines(
    content,
    ["지원", "대상", "자격", "필수", "제출", "선정", "평가", "기간", "예산"],
    "지원 대상, 제출 조건, 평가 기준을 공고문에서 추가로 확인해야 합니다.",
  );

  const evidenceToPrepare = [
    "기관/단체 소개 자료",
    "사업 필요성을 보여주는 현장 문제 또는 수요 자료",
    "대상자 규모와 특성",
    "세부 실행 일정",
    "예산 산출 근거",
    "성과지표와 측정 방법",
  ];

  const risks = [
    "공고문 필수 조건을 빠뜨릴 수 있습니다.",
    "사업 필요성과 실행계획의 논리 연결이 약할 수 있습니다.",
    "성과지표가 추상적이면 평가에서 약해질 수 있습니다.",
    "예산과 실행 일정이 현실적이지 않으면 감점 요인이 될 수 있습니다.",
  ];

  const aiQuestions = [
    "이 공고문의 핵심 요구사항과 평가 기준을 표로 정리해줘.",
    "내 사업 아이디어가 이 공고문에 맞는지 강점과 약점을 분석해줘.",
    "사업 필요성, 대상자, 실행계획, 성과지표를 연결한 사업 논리를 만들어줘.",
    "심사위원 관점에서 부족해 보일 부분과 보완 질문을 뽑아줘.",
  ];

  const checklist = [
    "지원 대상/자격을 확인했다.",
    "제출 서류 목록을 확인했다.",
    "평가 기준을 사업계획서 목차에 반영했다.",
    "사업 필요성의 근거 자료를 준비했다.",
    "예산과 일정이 현실적인지 확인했다.",
    "성과지표를 숫자 또는 확인 가능한 기준으로 썼다.",
  ];

  return {
    title,
    summary,
    requirements,
    evidenceToPrepare,
    risks,
    aiQuestions,
    checklist,
  };
}

export function renderPlanningNoticeMarkdown(
  result: PlanningNoticeResult,
): string {
  return [
    `# ${result.title}`,
    "",
    ...renderFriendlyGuide({
      title: "공고문 분석",
      steps: [
        "먼저 '요구사항 후보'에서 빠뜨리면 안 되는 조건을 확인하세요.",
        "'준비할 자료' 목록을 보며 지금 가진 자료와 없는 자료를 나누세요.",
        "'AI에게 물어볼 질문'을 복사해서 외부 AI에 붙여넣으면 사업 논리를 더 빨리 만들 수 있습니다.",
      ],
      tip: "공고문 원문이 길수록 결과가 좋아집니다. 가능하면 전체 공고문을 붙여넣으세요.",
    }),
    "## 공고문 핵심 요약",
    "",
    result.summary,
    "",
    "## 요구사항 후보",
    "",
    ...result.requirements.map((item) => `- ${item}`),
    "",
    "## 준비할 자료",
    "",
    ...result.evidenceToPrepare.map((item) => `- ${item}`),
    "",
    "## 주의할 리스크",
    "",
    ...result.risks.map((item) => `- ${item}`),
    "",
    "## AI에게 물어볼 질문",
    "",
    ...renderCopyToAiGuide(),
    ...result.aiQuestions.map((item, index) => `${index + 1}. ${item}`),
    "",
    "## 제출 전 체크리스트",
    "",
    ...result.checklist.map((item) => `- [ ] ${item}`),
    "",
  ].join("\n");
}
