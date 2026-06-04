export type SkillCategory =
  | "policy"
  | "planning"
  | "marketing"
  | "knowledge"
  | "operations"
  | "review";

export interface SkillMenuChoice {
  id: string;
  number: number;
  koreanName: string;
  plainDescription: string;
  category: SkillCategory;
  internalCommand: string;
  userInputs: string[];
  outputs: string[];
  nextActions: string[];
  aiQuestionPrompt: string;
}

export const SKILL_MENU_CHOICES: SkillMenuChoice[] = [
  {
    id: "policy-structure",
    number: 1,
    koreanName: "정책 문제 구조화",
    plainDescription:
      "민원, 회의 메모, 현장 의견을 문제-원인-이해관계자-대안-리스크로 나눕니다.",
    category: "policy",
    internalCommand: "policy:structure",
    userInputs: ["민원 내용", "회의 메모", "현장 의견", "정책 아이디어"],
    outputs: ["문제 구조표", "추가 확인 질문", "대안 비교표"],
    nextActions: [
      "자료를 그대로 붙여넣습니다.",
      "빠진 이해관계자가 있는지 확인합니다.",
      "생성된 질문을 AI에게 붙여넣습니다.",
    ],
    aiQuestionPrompt:
      "아래 자료를 현상, 원인, 이해관계자, 제약조건, 가능한 대안, 리스크, 추가 확인 질문으로 나누어 정리해줘.",
  },
  {
    id: "service-improvement",
    number: 2,
    koreanName: "시민 서비스 개선",
    plainDescription:
      "시민이 서비스를 이용하는 과정을 단계별로 보고 불편 지점과 개선안을 찾습니다.",
    category: "policy",
    internalCommand: "service:journey",
    userInputs: ["서비스 절차", "민원 사례", "신청서", "안내문"],
    outputs: ["시민 여정 지도", "운영 흐름표", "개선 우선순위"],
    nextActions: [
      "현재 절차를 순서대로 붙여넣습니다.",
      "시민 입장에서 헷갈리는 표현을 표시합니다.",
      "개선 전/후 흐름을 비교합니다.",
    ],
    aiQuestionPrompt:
      "아래 시민 서비스 절차를 시민 여정 관점에서 분석하고, 불편 지점, 담당자 병목, 개선 우선순위를 정리해줘.",
  },
  {
    id: "planning-copilot",
    number: 3,
    koreanName: "사업계획서 도우미",
    plainDescription:
      "공고문과 아이디어를 바탕으로 질문, 논리 구조, 초안, 제출 점검표를 만듭니다.",
    category: "planning",
    internalCommand: "plan:start",
    userInputs: ["공고문", "사업 아이디어", "기관 소개", "참고자료"],
    outputs: ["공고문 요구사항", "AI 질문", "사업계획서 목차", "제출 체크리스트"],
    nextActions: [
      "공고문 전문을 붙여넣습니다.",
      "내가 하고 싶은 사업 아이디어를 짧게 적습니다.",
      "AI 답변을 다시 붙여넣어 초안을 조립합니다.",
    ],
    aiQuestionPrompt:
      "아래 공고문과 사업 아이디어를 바탕으로 사업 필요성, 대상자, 목표, 세부 실행계획, 성과지표, 리스크, 보완 질문을 정리해줘.",
  },
  {
    id: "marketing-ops",
    number: 4,
    koreanName: "마케팅 콘텐츠 만들기",
    plainDescription:
      "브랜드 정보와 주제를 바탕으로 인스타, 블로그, 쇼츠용 콘텐츠 초안을 만듭니다.",
    category: "marketing",
    internalCommand: "marketing:ideas",
    userInputs: ["오늘 주제", "브랜드 설명", "고객 유형", "참고 콘텐츠"],
    outputs: ["콘텐츠 아이디어", "캡션 초안", "해시태그", "성과 기록 항목"],
    nextActions: [
      "오늘 다룰 주제를 한 문장으로 적습니다.",
      "원하는 톤을 고릅니다.",
      "업로드 후 성과를 기록합니다.",
    ],
    aiQuestionPrompt:
      "아래 브랜드 정보와 주제를 바탕으로 인스타그램 콘텐츠 아이디어 10개, 추천 캡션, 해시태그, 업로드 후 확인할 성과지표를 만들어줘.",
  },
  {
    id: "brain-capture",
    number: 5,
    koreanName: "자료 붙여넣고 정리하기",
    plainDescription:
      "복사한 자료를 원본으로 저장하고, 나중에 찾기 쉽게 요약과 태그를 만듭니다.",
    category: "knowledge",
    internalCommand: "brain:capture",
    userInputs: ["복사한 글", "링크", "메모", "파일 경로"],
    outputs: ["원본 저장 위치", "요약", "태그", "다음에 물어볼 질문"],
    nextActions: [
      "자료를 있는 그대로 붙여넣습니다.",
      "개인/회사/정책/마케팅 중 성격을 고릅니다.",
      "필요하면 AI에게 요약을 맡깁니다.",
    ],
    aiQuestionPrompt:
      "아래 자료를 핵심 요약, 키워드 태그, 연결 가능한 프로젝트, 다음에 확인할 질문으로 정리해줘.",
  },
  {
    id: "ai-output-review",
    number: 6,
    koreanName: "AI 답변 검토하기",
    plainDescription:
      "AI가 만든 답변을 사실성, 실행 가능성, 시민 관점, 리스크 기준으로 점검합니다.",
    category: "review",
    internalCommand: "ai:review",
    userInputs: ["AI 답변", "원본 자료", "사용 목적"],
    outputs: ["수정 필요 목록", "위험 표현", "빠진 질문", "개선 초안"],
    nextActions: [
      "AI 답변을 붙여넣습니다.",
      "이 답변을 어디에 쓸지 적습니다.",
      "검토 결과를 보고 사람이 최종 수정합니다.",
    ],
    aiQuestionPrompt:
      "아래 AI 답변을 사실성, 논리, 실행 가능성, 시민 관점, 민감 표현, 빠진 이해관계자 기준으로 검토하고 수정 제안을 해줘.",
  },
];

export function listSkillMenuChoices(): SkillMenuChoice[] {
  return SKILL_MENU_CHOICES;
}

export function findSkillMenuChoice(value: string): SkillMenuChoice | null {
  const normalized = value.trim().toLowerCase();
  const numeric = Number.parseInt(normalized, 10);

  return (
    SKILL_MENU_CHOICES.find((choice) => {
      return (
        choice.number === numeric ||
        choice.id === normalized ||
        choice.internalCommand === normalized ||
        choice.koreanName.toLowerCase() === normalized
      );
    }) ?? null
  );
}

export function renderSkillMenu(): string {
  return [
    "무엇을 하시겠어요?",
    "",
    ...SKILL_MENU_CHOICES.map((choice) => {
      return `${choice.number}. ${choice.koreanName} - ${choice.plainDescription}`;
    }),
    "",
    "사용법:",
    "  npm run dev:cli -- skill:menu",
    "  npm run dev:cli -- skill:menu 3",
    "  npm run dev:cli -- skill:menu policy-structure",
  ].join("\n");
}

export function renderSkillChoiceGuide(choice: SkillMenuChoice): string {
  return [
    `${choice.number}. ${choice.koreanName}`,
    "",
    choice.plainDescription,
    "",
    `내부 명령: ${choice.internalCommand}`,
    "",
    "준비할 자료:",
    ...choice.userInputs.map((input) => `- ${input}`),
    "",
    "만들어지는 결과:",
    ...choice.outputs.map((output) => `- ${output}`),
    "",
    "다음 행동:",
    ...choice.nextActions.map((action, index) => `${index + 1}. ${action}`),
    "",
    "AI에게 물어볼 질문:",
    "",
    choice.aiQuestionPrompt,
  ].join("\n");
}
