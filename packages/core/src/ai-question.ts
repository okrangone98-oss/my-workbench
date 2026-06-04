import {
  findSkillMenuChoice,
  renderSkillMenu,
  type SkillMenuChoice,
} from "./skill-catalog.js";
import { renderFriendlyGuide } from "./friendly-guide.js";

export interface AiQuestionInput {
  skill: SkillMenuChoice;
  content: string;
  context?: string;
}

export function createAiQuestion(input: AiQuestionInput): string {
  const trimmedContent = input.content.trim();
  const context = input.context?.trim();

  return [
    ...renderFriendlyGuide({
      title: "AI 질문 만들기",
      steps: [
        "아래 내용을 통째로 복사하세요.",
        "ChatGPT, Claude, Gemini 중 편한 AI에 붙여넣으세요.",
        "답변을 받으면 `ai:review`로 검토하면 더 안전합니다.",
      ],
      tip: "민감정보가 들어 있다면 외부 AI에 붙여넣기 전에 이름, 연락처, 계좌번호 등을 지우세요.",
    }),
    "아래 자료를 바탕으로 답변해줘.",
    "",
    "## 목적",
    "",
    input.skill.koreanName,
    "",
    "## 요청",
    "",
    input.skill.aiQuestionPrompt,
    "",
    ...(context
      ? ["## 추가 맥락", "", context, ""]
      : []),
    "## 자료",
    "",
    trimmedContent || "[여기에 자료를 붙여넣으세요]",
    "",
    "## 답변 형식",
    "",
    "1. 핵심 요약",
    "2. 문제 구조 또는 논리 구조",
    "3. 가능한 선택지",
    "4. 리스크",
    "5. 추가로 확인해야 할 질문",
    "6. 바로 실행할 다음 행동",
    "",
  ].join("\n");
}

export function renderAiQuestionGuide(): string {
  return [
    "AI에게 어떤 질문을 만들까요?",
    "",
    renderSkillMenu(),
    "",
    "사용 예:",
    '  npm run dev:cli -- ai:question 1 --text "민원 내용"',
    '  npm run dev:cli -- ai:question planning-copilot --file data/brain/00_raw/2026-06-04/example.md',
  ].join("\n");
}

export function createAiQuestionFromSkillValue(
  skillValue: string,
  content: string,
  context?: string,
): string | null {
  const skill = findSkillMenuChoice(skillValue);
  if (!skill) {
    return null;
  }

  return createAiQuestion({ skill, content, context });
}
