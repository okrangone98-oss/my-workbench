import React, { useMemo, useState } from "react";
import { createRoot } from "react-dom/client";
import {
  analyzePlanningNotice,
  createAiQuestionFromSkillValue,
  createMarketingIdeas,
  createPolicyStructure,
  listSkillMenuChoices,
  renderAiReviewMarkdown,
  renderMarketingIdeasMarkdown,
  renderPlanningNoticeMarkdown,
  renderPolicyStructureMarkdown,
  reviewAiOutput,
} from "@my-work-bench/core";
import {
  Bot,
  ClipboardCheck,
  Copy,
  FileSearch,
  FileText,
  Megaphone,
  Network,
  Sparkles,
} from "lucide-react";
import "./styles.css";

const workflows = [
  {
    id: "policy",
    label: "정책 문제 구조화",
    short: "민원, 회의 메모, 현장 의견을 문제 구조로 바꿉니다.",
    icon: Network,
  },
  {
    id: "notice",
    label: "공고문 분석",
    short: "사업계획서 작성 전에 요구사항과 준비자료를 뽑습니다.",
    icon: FileSearch,
  },
  {
    id: "marketing",
    label: "콘텐츠 아이디어",
    short: "인스타, 블로그, 릴스 초안을 빠르게 만듭니다.",
    icon: Megaphone,
  },
  {
    id: "question",
    label: "AI 질문 만들기",
    short: "복사해서 다른 AI에게 물어볼 좋은 질문을 만듭니다.",
    icon: Bot,
  },
  {
    id: "review",
    label: "AI 답변 검토",
    short: "AI가 만든 결과물을 사람이 판단할 체크리스트로 봅니다.",
    icon: ClipboardCheck,
  },
];

const samples = {
  policy:
    "예: 민원인이 온라인 신청 절차가 너무 복잡하고 처리 상황을 알기 어렵다고 말했습니다. 담당자는 문의 전화가 반복되어 업무가 지연된다고 합니다.",
  notice:
    "예: 지역 소상공인 디지털 전환 지원사업 공고문. 지원대상, 제출서류, 평가기준, 예산, 기간 내용을 여기에 붙여넣으세요.",
  marketing:
    "예: AI 업무 자동화 컨설팅을 처음 접하는 1인 사업자를 위한 쉬운 콘텐츠",
  question:
    "예: 내가 만들고 싶은 정책 서비스 아이디어나 사업계획서 초안을 붙여넣으세요.",
  review:
    "예: AI가 작성한 사업계획서 초안, 정책 제안서, 안내문을 붙여넣으세요.",
};

const storageSteps = [
  "PC에서는 G드라이브 작업 폴더의 data/ 아래에 원본과 결과를 저장합니다.",
  "모바일에서는 웹앱에서 결과를 만든 뒤 복사하거나 다운로드해서 Google Drive에 보관합니다.",
  "다음 단계에서 Google Drive 저장 버튼을 붙이면 PC와 모바일 자료를 같은 폴더에서 볼 수 있습니다.",
];

function copyText(value) {
  if (!value) return;
  navigator.clipboard?.writeText(value);
}

function App() {
  const [activeId, setActiveId] = useState("policy");
  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");
  const [brand, setBrand] = useState("");
  const [audience, setAudience] = useState("");
  const [purpose, setPurpose] = useState("");
  const [skillValue, setSkillValue] = useState("1");
  const [copied, setCopied] = useState(false);

  const skillChoices = useMemo(() => listSkillMenuChoices(), []);
  const activeWorkflow = workflows.find((workflow) => workflow.id === activeId);

  const result = useMemo(() => {
    if (activeId === "policy") {
      return renderPolicyStructureMarkdown(
        createPolicyStructure({ title, content }),
      );
    }

    if (activeId === "notice") {
      return renderPlanningNoticeMarkdown(
        analyzePlanningNotice({ title, content }),
      );
    }

    if (activeId === "marketing") {
      return renderMarketingIdeasMarkdown(
        createMarketingIdeas({
          topic: content || samples.marketing,
          brand,
          audience,
        }),
      );
    }

    if (activeId === "question") {
      return (
        createAiQuestionFromSkillValue(skillValue, content, title) ||
        "스킬을 먼저 골라주세요."
      );
    }

    return renderAiReviewMarkdown(
      reviewAiOutput({
        answer: content,
        purpose: purpose || title || "AI 답변 검토",
      }),
    );
  }, [activeId, audience, brand, content, purpose, skillValue, title]);

  const ActiveIcon = activeWorkflow.icon;

  return (
    <main className="app-shell">
      <aside className="sidebar" aria-label="업무 선택">
        <div className="brand">
          <Sparkles size={22} aria-hidden="true" />
          <div>
            <strong>My Workbench</strong>
            <span>나의 AI 업무본부</span>
          </div>
        </div>

        <nav className="workflow-list">
          {workflows.map((workflow) => {
            const Icon = workflow.icon;
            return (
              <button
                className={workflow.id === activeId ? "active" : ""}
                key={workflow.id}
                onClick={() => {
                  setActiveId(workflow.id);
                  setCopied(false);
                }}
                type="button"
                title={workflow.short}
              >
                <Icon size={18} aria-hidden="true" />
                <span>{workflow.label}</span>
              </button>
            );
          })}
        </nav>

        <div className="privacy-note">
          <FileText size={18} aria-hidden="true" />
          <p>
            이 화면은 브라우저에서 바로 계산합니다. 외부 AI에 보내고 싶은
            내용만 직접 복사해서 사용하세요.
          </p>
        </div>
      </aside>

      <section className="work-area">
        <header className="page-header">
          <div>
            <p className="eyebrow">오늘 바로 쓰는 도구</p>
            <h1>
              <ActiveIcon size={28} aria-hidden="true" />
              {activeWorkflow.label}
            </h1>
          </div>
          <button
            className="copy-button"
            onClick={() => {
              copyText(result);
              setCopied(true);
            }}
            type="button"
          >
            <Copy size={17} aria-hidden="true" />
            {copied ? "복사됨" : "결과 복사"}
          </button>
        </header>

        <div className="guide-bubble">
          <strong>이렇게 해보세요</strong>
          <span>{activeWorkflow.short}</span>
        </div>

        <section className="storage-strip" aria-label="저장 방식 안내">
          {storageSteps.map((step) => (
            <p key={step}>{step}</p>
          ))}
        </section>

        <div className="workspace-grid">
          <section className="input-panel" aria-label="자료 입력">
            <label>
              제목 또는 맥락
              <input
                onChange={(event) => setTitle(event.target.value)}
                placeholder="예: 청년 정책 제안서, 소상공인 지원사업"
                value={title}
              />
            </label>

            {activeId === "marketing" && (
              <div className="split-fields">
                <label>
                  브랜드
                  <input
                    onChange={(event) => setBrand(event.target.value)}
                    placeholder="예: 나의 브랜드명"
                    value={brand}
                  />
                </label>
                <label>
                  대상
                  <input
                    onChange={(event) => setAudience(event.target.value)}
                    placeholder="예: 1인 사업자"
                    value={audience}
                  />
                </label>
              </div>
            )}

            {activeId === "question" && (
              <label>
                어떤 스킬로 질문할까요?
                <select
                  onChange={(event) => setSkillValue(event.target.value)}
                  value={skillValue}
                >
                  {skillChoices.map((choice) => (
                    <option key={choice.id} value={String(choice.number)}>
                      {choice.number}. {choice.koreanName}
                    </option>
                  ))}
                </select>
              </label>
            )}

            {activeId === "review" && (
              <label>
                사용 목적
                <input
                  onChange={(event) => setPurpose(event.target.value)}
                  placeholder="예: 제출용 사업계획서 초안 검토"
                  value={purpose}
                />
              </label>
            )}

            <label>
              붙여넣을 자료
              <textarea
                onChange={(event) => setContent(event.target.value)}
                placeholder={samples[activeId]}
                value={content}
              />
            </label>
          </section>

          <section className="result-panel" aria-label="결과">
            <div className="result-header">
              <strong>자동 생성 결과</strong>
              <span>복사해서 문서, 메모, 다른 AI에 바로 붙여넣기</span>
            </div>
            <pre>{result}</pre>
          </section>
        </div>
      </section>
    </main>
  );
}

createRoot(document.getElementById("root")).render(<App />);
