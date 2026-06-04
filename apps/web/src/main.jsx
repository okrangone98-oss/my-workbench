import React, { useEffect, useMemo, useState } from "react";
import { createRoot } from "react-dom/client";
import {
  Bot,
  ClipboardCheck,
  Copy,
  Download,
  FileSearch,
  FileText,
  FolderOpen,
  Megaphone,
  Network,
  RotateCcw,
  Save,
  Sparkles,
} from "lucide-react";
import "./styles.css";

const workflows = [
  {
    id: "policy",
    label: "정책 문제 구조화",
    short: "민원, 회의 메모, 현장 의견을 정책 판단 재료로 바꿉니다.",
    icon: Network,
    accent: "lime",
  },
  {
    id: "notice",
    label: "공고문 분석",
    short: "공고문에서 요구사항, 준비자료, 위험요소를 뽑습니다.",
    icon: FileSearch,
    accent: "cyan",
  },
  {
    id: "marketing",
    label: "콘텐츠 아이디어",
    short: "주제를 콘텐츠 후보, 후킹 문장, 성과지표로 정리합니다.",
    icon: Megaphone,
    accent: "coral",
  },
  {
    id: "question",
    label: "AI 질문 만들기",
    short: "복사해서 다른 AI에게 바로 던질 질문을 만듭니다.",
    icon: Bot,
    accent: "violet",
  },
  {
    id: "review",
    label: "AI 답변 검토",
    short: "AI 결과물을 사실성, 논리, 실행 가능성 기준으로 점검합니다.",
    icon: ClipboardCheck,
    accent: "amber",
  },
];

const skillChoices = [
  { value: "policy", label: "정책 문제 구조화" },
  { value: "service", label: "시민 서비스 개선" },
  { value: "planning", label: "사업계획서 준비" },
  { value: "marketing", label: "마케팅 콘텐츠 만들기" },
  { value: "brain", label: "자료 정리와 지식화" },
  { value: "review", label: "AI 답변 검토" },
];

const samples = {
  policy:
    "민원인이 온라인 신청 절차가 너무 복잡하고 처리 상황을 알기 어렵다고 말했습니다. 담당자는 문의 전화가 반복되어 업무가 지연된다고 합니다.",
  notice:
    "지역 소상공인 디지털 전환 지원사업 공고문입니다. 지원대상, 제출서류, 평가기준, 예산, 기간 내용을 여기에 붙여넣으세요.",
  marketing:
    "AI 업무 자동화 컨설팅을 처음 접하는 1인 사업자를 위한 쉬운 콘텐츠",
  question:
    "내가 만들고 싶은 정책 서비스 아이디어나 사업계획서 초안을 붙여넣으세요.",
  review:
    "AI가 작성한 사업계획서 초안, 정책 제안서, 안내문을 붙여넣으세요.",
};

const storageSteps = [
  "PC 자료는 로컬 data 폴더에 보관",
  "모바일 결과는 복사하거나 다운로드",
  "다음 단계는 Google Drive 저장",
];

function lines(content) {
  return content
    .replace(/\r\n/g, "\n")
    .split(/\n|[.!?。]/)
    .map((line) => line.trim())
    .filter(Boolean);
}

function firstLines(content, count = 3) {
  const picked = lines(content).slice(0, count);
  return picked.length ? picked : ["자료를 붙여넣으면 더 구체적인 결과가 나옵니다."];
}

function findByKeywords(content, keywords, fallback) {
  const picked = lines(content)
    .filter((line) => keywords.some((keyword) => line.includes(keyword)))
    .slice(0, 5);
  return picked.length ? picked : [fallback];
}

function bullet(items) {
  return items.map((item) => `- ${item}`).join("\n");
}

function numbered(items) {
  return items.map((item, index) => `${index + 1}. ${item}`).join("\n");
}

function renderPolicy({ title, content }) {
  const subject = title || "정책 문제 구조화";
  return `# ${subject}

## 한 줄 요약
${firstLines(content, 2).join(" ")}

## 문제 구조
### 1. 현재 보이는 문제
${bullet(firstLines(content, 3))}

### 2. 영향을 받는 사람
${bullet(
    findByKeywords(
      content,
      ["민원", "시민", "주민", "이용자", "고객", "담당자"],
      "누가 가장 불편을 겪는지 추가로 확인해야 합니다.",
    ),
  )}

### 3. 운영 과정의 병목
${bullet(
    findByKeywords(
      content,
      ["신청", "처리", "문의", "전화", "접수", "확인", "안내"],
      "어느 절차에서 시간이 오래 걸리거나 반복 문의가 생기는지 확인하세요.",
    ),
  )}

### 4. 제약 조건
- 예산, 인력, 법령, 시스템 권한을 따로 확인하세요.
- 당장 바꿀 수 있는 것과 장기 개선이 필요한 것을 나누세요.

## 다음 질문
${numbered([
    "이 문제를 가장 많이 겪는 사람은 누구인가요?",
    "현재 절차에서 가장 오래 걸리는 단계는 어디인가요?",
    "담당자가 바로 바꿀 수 있는 안내문, 양식, 절차는 무엇인가요?",
    "성과를 확인하려면 어떤 숫자를 보면 좋을까요?",
  ])}

## AI에게 이어서 물어볼 질문
아래 문제를 시민 입장과 운영자 입장으로 나누어 분석하고, 실행 가능한 개선안 3개와 필요한 확인 질문을 제안해줘.

[자료]
${content || "여기에 자료를 붙여넣으세요."}
`;
}

function renderNotice({ title, content }) {
  const subject = title || "공고문 분석";
  return `# ${subject}

## 공고문 요약
${firstLines(content, 3).join(" ")}

## 요구사항 후보
${bullet(
    findByKeywords(
      content,
      ["지원", "대상", "자격", "필수", "제출", "선정", "평가", "기간", "예산"],
      "지원대상, 제출서류, 평가기준, 예산, 기간을 공고문에서 다시 확인하세요.",
    ),
  )}

## 준비할 자료
${bullet([
    "기관 또는 사업자 소개 자료",
    "사업 필요성을 보여주는 현장 문제와 근거",
    "대상 고객 또는 수혜자 설명",
    "실행 일정과 역할 분담",
    "예산 산출 근거",
    "성과지표와 측정 방법",
  ])}

## 주의할 리스크
${bullet([
    "필수 제출서류 누락",
    "공고 목적과 사업 아이디어의 연결 부족",
    "성과지표가 추상적인 상태",
    "예산과 일정이 실제 실행력보다 과한 상태",
  ])}

## AI에게 이어서 물어볼 질문
${numbered([
    "이 공고문의 핵심 요구사항과 평가기준을 표로 정리해줘.",
    "내 사업 아이디어가 이 공고에 맞는지 강점과 약점을 분석해줘.",
    "사업 필요성, 대상자, 실행계획, 성과지표가 연결되도록 사업 논리를 만들어줘.",
    "심사위원 관점에서 부족해 보이는 부분과 보완 질문을 뽑아줘.",
  ])}
`;
}

function renderMarketing({ title, content, brand, audience }) {
  const topic = content || samples.marketing;
  const brandName = brand || "내 브랜드";
  const target = audience || "관심 고객";
  return `# 콘텐츠 아이디어: ${title || topic}

## 기본 설정
- 브랜드: ${brandName}
- 대상: ${target}
- 주제: ${topic}

## 바로 만들 콘텐츠 후보
### 1. 사람들이 가장 많이 막히는 지점
- 형식: 인스타 카드뉴스
- 첫 문장: 대부분 여기서 막힙니다.
- 방향: 초보자가 실수하는 지점을 쉽게 풀어줍니다.

### 2. 전후 비교
- 형식: 릴스 또는 쇼츠
- 첫 문장: 이렇게 바꾸면 일이 훨씬 쉬워집니다.
- 방향: 복잡한 과정을 간단한 변화로 보여줍니다.

### 3. 저장용 체크리스트
- 형식: 블로그 또는 인스타 게시물
- 첫 문장: 나중에 보려고 저장해두세요.
- 방향: 사용자가 따라 할 수 있는 순서로 정리합니다.

### 4. 자주 묻는 질문
- 형식: FAQ 게시물
- 첫 문장: 이 질문을 정말 많이 받습니다.
- 방향: 댓글과 문의로 반복되는 질문을 콘텐츠로 바꿉니다.

## 성과 확인 지표
${bullet(["저장 수", "댓글 질문 수", "프로필 방문", "문의 전환", "다음 콘텐츠로 이어지는 반응"])}

## AI에게 이어서 물어볼 질문
위 주제로 ${target}이 쉽게 이해할 수 있는 콘텐츠 아이디어 10개를 만들고, 각 아이디어마다 첫 문장, 본문 구조, CTA, 해시태그를 제안해줘.
`;
}

function renderQuestion({ title, content, skillValue }) {
  const skill = skillChoices.find((choice) => choice.value === skillValue);
  return `# AI에게 물어볼 질문

## 목적
${skill?.label || "업무 정리"}

## 요청
아래 자료를 바탕으로 문제의 구조, 핵심 쟁점, 선택 가능한 대안, 추가 확인 질문, 바로 실행할 다음 행동을 정리해줘.

## 맥락
${title || "맥락을 입력하지 않았습니다."}

## 자료
${content || "여기에 자료를 붙여넣으세요."}

## 답변 형식
1. 핵심 요약
2. 문제 구조 또는 사업 논리
3. 선택 가능한 대안
4. 리스크
5. 추가 확인 질문
6. 바로 실행할 다음 행동
`;
}

function renderReview({ title, content, purpose }) {
  const subject = purpose || title || "AI 답변 검토";
  return `# ${subject}

## 먼저 볼 것
${bullet([
    "숫자, 날짜, 기관명, 법령명이 맞는가?",
    "문제와 해결책이 논리적으로 연결되는가?",
    "예산, 인력, 일정, 권한을 고려했는가?",
    "시민이나 고객이 이해하기 쉬운 표현인가?",
    "개인정보나 민감한 표현이 포함되어 있지 않은가?",
  ])}

## 검토 메모
${firstLines(content, 4).join("\n")}

## 수정용 질문
아래 AI 답변을 사실성, 논리, 실행 가능성, 사용자 관점, 리스크 기준으로 검토하고 수정안을 제안해줘.

[AI 답변]
${content || "여기에 AI 답변을 붙여넣으세요."}
`;
}

function copyText(value) {
  if (!value) return;
  navigator.clipboard?.writeText(value);
}

function createDownloadName(activeId, title) {
  const date = new Date().toISOString().slice(0, 10);
  const cleanTitle = (title || activeId)
    .trim()
    .replace(/[\\/:*?"<>|]/g, "")
    .replace(/\s+/g, "-")
    .slice(0, 40);

  return `my-workbench-${date}-${cleanTitle || activeId}.md`;
}

function downloadMarkdown({ activeId, title, result }) {
  const blob = new Blob([result], { type: "text/markdown;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = createDownloadName(activeId, title);
  document.body.appendChild(link);
  link.click();
  link.remove();
  URL.revokeObjectURL(url);
}

function App() {
  const [activeId, setActiveId] = useState("policy");
  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");
  const [brand, setBrand] = useState("");
  const [audience, setAudience] = useState("");
  const [purpose, setPurpose] = useState("");
  const [skillValue, setSkillValue] = useState("policy");
  const [copied, setCopied] = useState(false);
  const [savedMessage, setSavedMessage] = useState("");

  const activeWorkflow = workflows.find((workflow) => workflow.id === activeId);
  const ActiveIcon = activeWorkflow.icon;
  const draftKey = `my-workbench:draft:${activeId}`;

  const result = useMemo(() => {
    if (activeId === "policy") return renderPolicy({ title, content });
    if (activeId === "notice") return renderNotice({ title, content });
    if (activeId === "marketing") {
      return renderMarketing({ title, content, brand, audience });
    }
    if (activeId === "question") {
      return renderQuestion({ title, content, skillValue });
    }
    return renderReview({ title, content, purpose });
  }, [activeId, audience, brand, content, purpose, skillValue, title]);

  useEffect(() => {
    setCopied(false);
    setSavedMessage("");
  }, [activeId]);

  function saveDraft() {
    localStorage.setItem(
      draftKey,
      JSON.stringify({ title, content, brand, audience, purpose, skillValue }),
    );
    setSavedMessage("브라우저에 임시 저장했습니다.");
  }

  function loadDraft() {
    const saved = localStorage.getItem(draftKey);
    if (!saved) {
      setSavedMessage("불러올 임시 저장 자료가 없습니다.");
      return;
    }

    const parsed = JSON.parse(saved);
    setTitle(parsed.title || "");
    setContent(parsed.content || "");
    setBrand(parsed.brand || "");
    setAudience(parsed.audience || "");
    setPurpose(parsed.purpose || "");
    setSkillValue(parsed.skillValue || "policy");
    setSavedMessage("임시 저장 자료를 불러왔습니다.");
  }

  function fillSample() {
    setContent(samples[activeId]);
    if (!title) setTitle(activeWorkflow.label);
    setSavedMessage("예시를 넣었습니다. 그대로 바꿔서 써보세요.");
  }

  function resetInput() {
    setTitle("");
    setContent("");
    setBrand("");
    setAudience("");
    setPurpose("");
    setSkillValue("policy");
    setSavedMessage("입력칸을 비웠습니다.");
  }

  return (
    <main className={`app-shell accent-${activeWorkflow.accent}`}>
      <aside className="sidebar" aria-label="업무 선택">
        <div className="brand">
          <span className="brand-mark">MW</span>
          <div>
            <strong>My Workbench</strong>
            <span>AI 업무본부</span>
          </div>
        </div>

        <nav className="workflow-list">
          {workflows.map((workflow) => {
            const Icon = workflow.icon;
            return (
              <button
                className={workflow.id === activeId ? "active" : ""}
                key={workflow.id}
                onClick={() => setActiveId(workflow.id)}
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
            브라우저에서 바로 계산합니다. 외부 AI에 보낼 내용만 직접 복사해서
            사용하세요.
          </p>
        </div>
      </aside>

      <section className="work-area">
        <header className="page-header">
          <div>
            <p className="eyebrow">WORKBENCH LIVE</p>
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

        <section className="studio-strip" aria-label="작업 흐름">
          <div>
            <strong>01</strong>
            <span>자료 붙여넣기</span>
          </div>
          <div>
            <strong>02</strong>
            <span>구조화하기</span>
          </div>
          <div>
            <strong>03</strong>
            <span>복사 또는 저장</span>
          </div>
        </section>

        <div className="guide-bubble">
          <strong>오늘의 안내</strong>
          <span>{activeWorkflow.short}</span>
        </div>

        <section className="storage-strip" aria-label="저장 방식 안내">
          {storageSteps.map((step) => (
            <p key={step}>{step}</p>
          ))}
        </section>

        <div className="workspace-grid">
          <section className="input-panel" aria-label="자료 입력">
            <div className="quick-actions" aria-label="빠른 작업">
              <button onClick={fillSample} type="button">
                <Sparkles size={16} aria-hidden="true" />
                예시
              </button>
              <button onClick={saveDraft} type="button">
                <Save size={16} aria-hidden="true" />
                저장
              </button>
              <button onClick={loadDraft} type="button">
                <FolderOpen size={16} aria-hidden="true" />
                불러오기
              </button>
              <button onClick={resetInput} type="button">
                <RotateCcw size={16} aria-hidden="true" />
                비우기
              </button>
            </div>

            {savedMessage && <p className="status-message">{savedMessage}</p>}

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
                    placeholder="예: 내 브랜드명"
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
                어떤 관점으로 질문할까요?
                <select
                  onChange={(event) => setSkillValue(event.target.value)}
                  value={skillValue}
                >
                  {skillChoices.map((choice) => (
                    <option key={choice.value} value={choice.value}>
                      {choice.label}
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
              <div>
                <strong>자동 생성 결과</strong>
                <span>복사하거나 Markdown 파일로 저장할 수 있습니다.</span>
              </div>
              <button
                className="download-button"
                onClick={() => downloadMarkdown({ activeId, title, result })}
                type="button"
              >
                <Download size={16} aria-hidden="true" />
                다운로드
              </button>
            </div>
            <pre>{result}</pre>
          </section>
        </div>
      </section>
    </main>
  );
}

createRoot(document.getElementById("root")).render(<App />);
