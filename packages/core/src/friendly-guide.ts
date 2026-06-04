export interface FriendlyGuideInput {
  title: string;
  steps: string[];
  tip?: string;
}

export function renderFriendlyGuide(input: FriendlyGuideInput): string[] {
  return [
    "> 안내",
    ">",
    ...input.steps.map((step, index) => `> ${index + 1}. ${step}`),
    ...(input.tip ? [">", `> 팁: ${input.tip}`] : []),
    "",
  ];
}

export function renderCopyToAiGuide(questionLabel = "AI에게 물어볼 질문"): string[] {
  return [
    "> 이렇게 사용하세요",
    ">",
    `> 아래의 '${questionLabel}' 부분을 복사해서 ChatGPT, Claude, Gemini 중 편한 AI에 붙여넣으세요.`,
    "> 답변을 받으면 `ai:review`로 한 번 더 검토하면 안전합니다.",
    "",
  ];
}

