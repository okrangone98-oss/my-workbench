import { renderCopyToAiGuide, renderFriendlyGuide } from "./friendly-guide.js";

export interface MarketingIdeasInput {
  topic: string;
  brand?: string;
  audience?: string;
  tone?: string;
}

export interface MarketingIdea {
  title: string;
  format: string;
  hook: string;
  captionSeed: string;
}

export interface MarketingIdeasResult {
  topic: string;
  brand: string;
  audience: string;
  tone: string;
  ideas: MarketingIdea[];
  hashtags: string[];
  reviewMetrics: string[];
  aiPrompt: string;
}

function subjectParticle(value: string): string {
  const last = value.trim().charCodeAt(value.trim().length - 1);
  if (!Number.isFinite(last) || last < 0xac00 || last > 0xd7a3) {
    return "가";
  }

  return (last - 0xac00) % 28 === 0 ? "가" : "이";
}

export function createMarketingIdeas(
  input: MarketingIdeasInput,
): MarketingIdeasResult {
  const topic = input.topic.trim() || "오늘의 주제";
  const brand = input.brand?.trim() || "내 브랜드";
  const audience = input.audience?.trim() || "관심 고객";
  const tone = input.tone?.trim() || "친근하고 신뢰감 있는 톤";

  const ideas: MarketingIdea[] = [
    {
      title: `${topic}에서 사람들이 가장 많이 놓치는 것`,
      format: "인스타 카드뉴스",
      hook: "대부분 여기서 막힙니다.",
      captionSeed: `${audience}${subjectParticle(audience)} ${topic}을 더 쉽게 이해하도록 핵심 실수를 정리합니다.`,
    },
    {
      title: `${topic} 전/후 비교`,
      format: "릴스/쇼츠",
      hook: "이렇게 바꾸면 훨씬 쉬워집니다.",
      captionSeed: `복잡한 과정을 간단한 전/후 비교로 보여줍니다.`,
    },
    {
      title: `${topic} 체크리스트`,
      format: "저장 유도 게시물",
      hook: "나중에 보려고 저장해두세요.",
      captionSeed: `바로 따라할 수 있는 체크리스트를 제공합니다.`,
    },
    {
      title: `${topic} 자주 묻는 질문`,
      format: "FAQ 게시물",
      hook: "가장 많이 받은 질문만 모았습니다.",
      captionSeed: `댓글이나 문의로 반복되는 질문을 쉬운 말로 답합니다.`,
    },
    {
      title: `${topic} 실제 사례`,
      format: "스토리텔링 게시물",
      hook: "실제로 이런 상황이 있었습니다.",
      captionSeed: `구체적인 사례로 신뢰를 만들고 다음 행동을 안내합니다.`,
    },
  ];

  const hashtags = [
    "#업무자동화",
    "#AI활용",
    "#콘텐츠기획",
    "#문제해결",
    "#서비스개선",
  ];

  const reviewMetrics = [
    "저장 수",
    "댓글 질문 수",
    "프로필 방문",
    "문의 전환",
    "다음 콘텐츠 아이디어로 이어진 반응",
  ];

  const aiPrompt = [
    "아래 조건으로 인스타그램/블로그/쇼츠 콘텐츠 아이디어를 더 발전시켜줘.",
    "",
    `주제: ${topic}`,
    `브랜드: ${brand}`,
    `대상 고객: ${audience}`,
    `톤: ${tone}`,
    "",
    "요청:",
    "1. 콘텐츠 아이디어 10개",
    "2. 각 아이디어의 첫 문장 hook",
    "3. 캡션 초안",
    "4. 해시태그",
    "5. 업로드 후 확인할 성과지표",
  ].join("\n");

  return {
    topic,
    brand,
    audience,
    tone,
    ideas,
    hashtags,
    reviewMetrics,
    aiPrompt,
  };
}

export function renderMarketingIdeasMarkdown(
  result: MarketingIdeasResult,
): string {
  return [
    `# 마케팅 콘텐츠 아이디어: ${result.topic}`,
    "",
    ...renderFriendlyGuide({
      title: "콘텐츠 아이디어",
      steps: [
        "먼저 마음에 드는 아이디어 1개만 고르세요.",
        "첫 문장을 그대로 써도 되고, 내 말투에 맞게 조금 바꾸세요.",
        "더 많은 초안이 필요하면 아래 AI 질문을 복사해서 외부 AI에 붙여넣으세요.",
      ],
      tip: "처음부터 완벽한 게시물을 만들기보다 저장 수나 댓글을 보고 다음 콘텐츠를 개선하는 흐름이 좋습니다.",
    }),
    "## 기본 설정",
    "",
    `- 브랜드: ${result.brand}`,
    `- 대상 고객: ${result.audience}`,
    `- 톤: ${result.tone}`,
    "",
    "## 콘텐츠 아이디어",
    "",
    ...result.ideas.flatMap((idea, index) => [
      `### ${index + 1}. ${idea.title}`,
      "",
      `- 형식: ${idea.format}`,
      `- 첫 문장: ${idea.hook}`,
      `- 캡션 방향: ${idea.captionSeed}`,
      "",
    ]),
    "## 추천 해시태그",
    "",
    result.hashtags.join(" "),
    "",
    "## 업로드 후 볼 지표",
    "",
    ...result.reviewMetrics.map((metric) => `- ${metric}`),
    "",
    "## AI에게 이어서 물어볼 질문",
    "",
    ...renderCopyToAiGuide("AI에게 이어서 물어볼 질문"),
    result.aiPrompt,
    "",
  ].join("\n");
}
