import { renderCopyToAiGuide, renderFriendlyGuide } from "./friendly-guide.js";

export interface PolicyStructureInput {
  content: string;
  title?: string;
  context?: string;
}

export interface PolicyStructureSection {
  title: string;
  guide: string;
  items: string[];
}

export interface PolicyStructureResult {
  title: string;
  summary: string;
  sections: PolicyStructureSection[];
  nextQuestions: string[];
}

const POLICY_KEYWORDS = {
  citizen: ["시민", "주민", "이용자", "민원", "신청자", "대상자"],
  process: ["절차", "신청", "접수", "처리", "확인", "진행", "안내"],
  constraint: ["예산", "인력", "법령", "시간", "시스템", "권한"],
  risk: ["불편", "복잡", "어렵", "누락", "지연", "오해", "위험"],
};

function splitSentences(content: string): string[] {
  return content
    .replace(/\r\n/g, "\n")
    .split(/[\n.!?。]+/)
    .map((line) => line.trim())
    .filter((line) => line.length > 0);
}

function pickSentences(content: string, keywords: string[]): string[] {
  const matches = splitSentences(content).filter((sentence) => {
    return keywords.some((keyword) => sentence.includes(keyword));
  });

  return matches.slice(0, 4);
}

function fallbackItem(content: string, message: string): string[] {
  const first = splitSentences(content)[0];
  return first ? [first] : [message];
}

export function createPolicyStructure(
  input: PolicyStructureInput,
): PolicyStructureResult {
  const content = input.content.trim();
  const title = input.title?.trim() || "정책 문제 구조화";
  const summary = splitSentences(content).slice(0, 2).join(" ") || "자료 없음";

  const citizenItems = pickSentences(content, POLICY_KEYWORDS.citizen);
  const processItems = pickSentences(content, POLICY_KEYWORDS.process);
  const constraintItems = pickSentences(content, POLICY_KEYWORDS.constraint);
  const riskItems = pickSentences(content, POLICY_KEYWORDS.risk);

  const sections: PolicyStructureSection[] = [
    {
      title: "현상",
      guide: "지금 겉으로 드러난 문제입니다.",
      items: fallbackItem(content, "현재 보이는 문제를 자료에서 더 확인해야 합니다."),
    },
    {
      title: "영향받는 사람",
      guide: "문제의 영향을 받는 시민, 이용자, 담당자입니다.",
      items:
        citizenItems.length > 0
          ? citizenItems
          : ["시민/이용자/담당자 중 누가 영향을 받는지 추가 확인이 필요합니다."],
    },
    {
      title: "운영 과정",
      guide: "문제가 발생하는 절차나 업무 흐름입니다.",
      items:
        processItems.length > 0
          ? processItems
          : ["접수, 처리, 안내, 확인 과정 중 어느 단계의 문제인지 확인해야 합니다."],
    },
    {
      title: "제약 조건",
      guide: "예산, 인력, 법령, 시스템, 시간 같은 현실 조건입니다.",
      items:
        constraintItems.length > 0
          ? constraintItems
          : ["예산, 인력, 법령, 시스템 제약을 별도로 확인해야 합니다."],
    },
    {
      title: "리스크",
      guide: "그대로 두었을 때 생길 수 있는 위험입니다.",
      items:
        riskItems.length > 0
          ? riskItems
          : ["오해, 지연, 민원 증가, 담당자 부담 같은 리스크를 검토해야 합니다."],
    },
    {
      title: "가능한 대안",
      guide: "바로 검토할 수 있는 개선 방향입니다.",
      items: [
        "안내 문구와 신청 절차를 시민 입장에서 다시 쓴다.",
        "진행 상태 확인 지점을 명확히 만든다.",
        "담당자가 반복해서 답하는 질문을 FAQ 또는 체크리스트로 만든다.",
      ],
    },
  ];

  const nextQuestions = [
    "이 문제를 가장 많이 겪는 시민/이용자는 누구인가?",
    "현재 절차에서 가장 오래 걸리거나 헷갈리는 단계는 어디인가?",
    "담당자가 실제로 바꿀 수 있는 부분과 바꿀 수 없는 부분은 무엇인가?",
    "성과를 확인하려면 어떤 지표를 봐야 하는가?",
    "시민에게 먼저 안내해야 할 한 문장은 무엇인가?",
  ];

  return { title, summary, sections, nextQuestions };
}

export function renderPolicyStructureMarkdown(
  result: PolicyStructureResult,
): string {
  return [
    `# ${result.title}`,
    "",
    ...renderFriendlyGuide({
      title: "정책 문제 구조화",
      steps: [
        "먼저 '현상'과 '영향받는 사람'이 맞게 잡혔는지 확인하세요.",
        "'제약 조건'이 비어 있으면 예산, 인력, 법령, 시스템 조건을 추가로 확인하세요.",
        "아래 AI 질문을 복사하면 개선안과 성과지표를 더 구체화할 수 있습니다.",
      ],
      tip: "민원 문장 하나만 넣어도 시작할 수 있지만, 회의 메모나 현장 의견을 같이 넣으면 훨씬 좋아집니다.",
    }),
    "## 핵심 요약",
    "",
    result.summary,
    "",
    ...result.sections.flatMap((section) => [
      `## ${section.title}`,
      "",
      section.guide,
      "",
      ...section.items.map((item) => `- ${item}`),
      "",
    ]),
    "## 추가 확인 질문",
    "",
    ...result.nextQuestions.map((question, index) => `${index + 1}. ${question}`),
    "",
    "## AI에게 이어서 물어볼 질문",
    "",
    ...renderCopyToAiGuide("AI에게 이어서 물어볼 질문"),
    "아래 문제 구조를 바탕으로 시민 입장에서 가장 불편한 지점, 실행 가능한 개선안, 담당자 리스크, 성과지표를 표로 정리해줘.",
    "",
  ].join("\n");
}
