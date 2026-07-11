import React, { useEffect, useMemo, useRef, useState } from "react";
import { createRoot } from "react-dom/client";
import {
  BarChart3,
  ArrowRight,
  Bot,
  ClipboardCheck,
  Copy,
  Download,
  FileSearch,
  FileText,
  FilePlus2,
  FolderOpen,
  Megaphone,
  Network,
  RotateCcw,
  Save,
  Sparkles,
  Check,
  ChevronDown,
  ExternalLink,
  Pencil,
  Plus,
  Trash2,
  X,
} from "lucide-react";
import "./styles.css";
import {
  createTask,
  deleteTask,
  readTasks,
  sortActiveTasks,
  summarizeTasks,
  updateTask,
  writeTasks,
} from "./workbench-tasks.js";

const workflows = [
  {
    id: "policy",
    label: "문제 정리",
    short: "민원, 회의 메모, 현장 의견을 해결해야 할 쟁점으로 정리합니다.",
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
    id: "plan",
    label: "사업계획서 초안",
    short: "분석된 공고문과 아이디어를 사업계획서 목차와 초안으로 이어갑니다.",
    icon: FilePlus2,
    accent: "amber",
  },
  {
    id: "marketing",
    label: "콘텐츠 아이디어",
    short: "주제를 콘텐츠 후보, 후킹 문장, 성과지표로 정리합니다.",
    icon: Megaphone,
    accent: "coral",
  },
  {
    id: "table",
    label: "표/시트 분석",
    short: "엑셀이나 구글시트에서 복사한 표를 요약하고 간단한 그래프로 봅니다.",
    icon: BarChart3,
    accent: "mint",
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
  { value: "policy", label: "문제 정리" },
  { value: "service", label: "시민 서비스 개선" },
  { value: "planning", label: "사업계획서 준비" },
  { value: "marketing", label: "마케팅 콘텐츠 만들기" },
  { value: "brain", label: "자료 정리와 지식화" },
  { value: "review", label: "AI 답변 검토" },
];

const planFormats = [
  { value: "government", label: "정부지원사업 사업계획서" },
  { value: "policy", label: "정책 제안서" },
  { value: "startup", label: "창업/서비스 사업계획서" },
];

const samples = {
  policy:
    "민원인이 온라인 신청 절차가 너무 복잡하고 처리 상황을 알기 어렵다고 말했습니다. 담당자는 문의 전화가 반복되어 업무가 지연된다고 합니다.",
  notice:
    "지역 소상공인 디지털 전환 지원사업 공고문입니다. 지원대상, 제출서류, 평가기준, 예산, 기간 내용을 여기에 붙여넣으세요.",
  plan:
    "공고문 분석 결과와 내 사업 아이디어를 여기에 붙여넣으세요. 예: 지역 소상공인에게 AI 업무 자동화 교육과 실습 템플릿을 제공한다.",
  marketing:
    "AI 업무 자동화 컨설팅을 처음 접하는 1인 사업자를 위한 쉬운 콘텐츠",
  table:
    "월\t문의\t매출\n1월\t14\t1200000\n2월\t21\t1850000\n3월\t18\t1640000\n4월\t30\t2400000",
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

const workflowMap = [
  { id: "notice", step: "1", label: "공고문 분석" },
  { id: "plan", step: "2", label: "사업계획서 초안" },
  { id: "question", step: "3", label: "AI 보완 질문" },
  { id: "review", step: "4", label: "검토" },
  { id: "table", step: "+", label: "표/성과 분석" },
];

const PROJECT_STORAGE_KEY = "my-workbench:projects";

const taskStatusLabels = {
  todo: "해야 할 일",
  in_progress: "하고 있는 일",
  blocked: "막힌 일",
  done: "완료",
};

const taskStatusOptions = [
  ["todo", "해야 할 일"],
  ["in_progress", "하고 있는 일"],
  ["blocked", "막힌 일"],
  ["done", "완료"],
];

const emptyTaskForm = {
  title: "",
  status: "todo",
  priority: "normal",
  deadline: "",
  projectName: "",
  jiraUrl: "",
  note: "",
};

function formatKoreanDate(date = new Date()) {
  return new Intl.DateTimeFormat("ko-KR", {
    month: "long",
    day: "numeric",
    weekday: "long",
  }).format(date);
}

function formatTaskDate(value) {
  if (!value) return "날짜 없음";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;
  return new Intl.DateTimeFormat("ko-KR", { month: "short", day: "numeric" }).format(date);
}

function readProjects() {
  try {
    return JSON.parse(localStorage.getItem(PROJECT_STORAGE_KEY) || "[]");
  } catch {
    return [];
  }
}

function writeProjects(projects) {
  localStorage.setItem(PROJECT_STORAGE_KEY, JSON.stringify(projects));
}

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

function parseTable(content) {
  const rows = content
    .trim()
    .split(/\r?\n/)
    .map((row) => row.trim())
    .filter(Boolean)
    .map((row) => row.split(row.includes("\t") ? "\t" : ",").map((cell) => cell.trim()));

  if (rows.length < 2) return { headers: [], rows: [], numericColumns: [] };

  const headers = rows[0];
  const dataRows = rows.slice(1).filter((row) => row.some(Boolean));
  const numericColumns = headers
    .map((header, columnIndex) => {
      const values = dataRows
        .map((row) => Number(String(row[columnIndex] || "").replace(/,/g, "")))
        .filter((value) => Number.isFinite(value));

      if (!values.length) return null;
      const sum = values.reduce((total, value) => total + value, 0);
      const average = sum / values.length;
      const max = Math.max(...values);
      const min = Math.min(...values);

      return { header, columnIndex, values, sum, average, max, min };
    })
    .filter(Boolean);

  return { headers, rows: dataRows, numericColumns };
}

function formatNumber(value) {
  return Number.isInteger(value)
    ? value.toLocaleString("ko-KR")
    : value.toLocaleString("ko-KR", { maximumFractionDigits: 2 });
}

async function extractPdfText(file) {
  const pdfjs = await import("pdfjs-dist");
  const worker = await import("pdfjs-dist/build/pdf.worker.mjs?url");
  pdfjs.GlobalWorkerOptions.workerSrc = worker.default;

  const pdf = await pdfjs.getDocument({ data: await file.arrayBuffer() }).promise;
  const pages = [];

  for (let pageNumber = 1; pageNumber <= pdf.numPages; pageNumber += 1) {
    const page = await pdf.getPage(pageNumber);
    const textContent = await page.getTextContent();
    const text = textContent.items
      .map((item) => ("str" in item ? item.str : ""))
      .join(" ")
      .replace(/\s+/g, " ")
      .trim();
    pages.push(`[${pageNumber}쪽]\n${text}`);
  }

  return pages.join("\n\n");
}

function renderPolicy({ title, content }) {
  const subject = title || "문제 정리";
  if (!content.trim()) {
    return `# ${subject}

자료를 붙여넣은 뒤 왼쪽의 [분석하기] 버튼을 누르면 결과가 생성됩니다.

## 지금 할 일
1. 민원, 회의 메모, 현장 의견 같은 자료를 붙여넣거나 파일로 불러옵니다.
2. [분석하기]를 누릅니다.
3. 오른쪽 결과를 복사하거나 다운로드합니다.
`;
  }

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
  if (!content.trim()) {
    return `# ${subject}

공고문을 붙여넣은 뒤 [분석하기] 버튼을 누르세요.

지원대상, 제출서류, 평가기준, 예산, 기간 같은 항목을 뽑아드립니다.
`;
  }

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

function renderPlan({ title, content, planFormat }) {
  const subject = title || "사업계획서 초안";
  const format = planFormats.find((item) => item.value === planFormat);
  if (!content.trim()) {
    return `# ${subject}

공고문 분석 결과와 내 사업 아이디어를 붙여넣고 [분석하기]를 누르세요.

## 추천 흐름
1. 공고문 분석을 먼저 실행합니다.
2. 결과 아래의 [사업계획서 초안으로] 버튼을 누릅니다.
3. 내 아이디어를 조금 더 적고 다시 [분석하기]를 누릅니다.
`;
  }

  if (planFormat === "policy") {
    return `# ${subject}

양식: ${format?.label}

## 1. 제안 배경
${firstLines(content, 3).join(" ")}

## 2. 현황과 문제점
${bullet([
      "현재 제도, 서비스, 현장 운영에서 발생하는 문제를 구체화합니다.",
      "시민, 이용자, 담당자 중 누가 어떤 불편을 겪는지 분리합니다.",
      "반복 민원, 처리 지연, 정보 부족, 접근성 문제를 근거로 제시합니다.",
    ])}

## 3. 정책 목표
${bullet([
      "시민이 더 쉽게 이해하고 이용할 수 있는 서비스 구현",
      "담당자의 반복 업무 감소",
      "처리 과정의 투명성과 예측 가능성 개선",
    ])}

## 4. 추진 과제
${numbered([
      "신청과 안내 절차를 사용자 관점으로 재정리합니다.",
      "반복 문의를 줄이는 FAQ, 체크리스트, 안내문을 만듭니다.",
      "진행 상태 확인 지점을 명확히 합니다.",
      "성과지표를 정해 개선 효과를 기록합니다.",
    ])}

## 5. 기대효과
${bullet(["민원 감소", "처리 시간 단축", "시민 만족도 향상", "담당자 업무 부담 완화"])}

## 6. 추가 보완 필요사항
${numbered([
      "관련 법령과 내부 규정을 확인해야 합니다.",
      "예산과 인력 범위를 확인해야 합니다.",
      "실제 이용자 의견을 추가로 수집해야 합니다.",
    ])}
`;
  }

  if (planFormat === "startup") {
    return `# ${subject}

양식: ${format?.label}

## 1. 서비스 개요
${firstLines(content, 2).join(" ")}

## 2. 고객 문제
${bullet([
      "고객이 현재 어떤 불편을 겪는지 설명합니다.",
      "기존 대안이 왜 충분하지 않은지 정리합니다.",
      "문제가 자주 반복되거나 비용을 만드는 지점을 제시합니다.",
    ])}

## 3. 해결 방법
${bullet([
      "핵심 기능 또는 서비스 제공 방식을 설명합니다.",
      "고객이 처음 접해도 이해하기 쉬운 흐름으로 구성합니다.",
      "자동화와 사람의 검토가 섞이는 지점을 명확히 합니다.",
    ])}

## 4. 수익 모델
${bullet(["무료 체험 또는 기본 기능", "월 구독", "컨설팅/교육 패키지", "고급 분석 또는 템플릿 판매"])}

## 5. 실행 계획
${numbered(["MVP 제작", "초기 사용자 테스트", "콘텐츠와 사례 확보", "유료 전환 실험", "반복 개선"])}

## 6. 핵심 지표
${bullet(["방문자 수", "활성 사용자", "저장/다운로드 수", "문의 전환", "유료 전환"])}
`;
  }

  return `# ${subject}

양식: ${format?.label || "정부지원사업 사업계획서"}

## 1. 사업명
${subject}

## 2. 사업 한 줄 설명
${firstLines(content, 1).join(" ")}

## 3. 사업 필요성
${bullet([
    "공고문에서 요구하는 문제와 현재 현장의 불편을 연결해야 합니다.",
    "대상자가 왜 지금 이 사업을 필요로 하는지 근거를 제시해야 합니다.",
    "가능하면 민원, 수요, 매출, 시간 절감 같은 숫자 근거를 붙이세요.",
  ])}

## 4. 지원 대상 및 수혜자
${bullet(
    findByKeywords(
      content,
      ["대상", "소상공인", "청년", "시민", "고객", "이용자"],
      "지원 대상과 실제 수혜자를 구체적으로 적어야 합니다.",
    ),
  )}

## 5. 세부 실행 계획
${numbered([
    "사전 진단: 대상자의 현재 문제와 준비 수준을 확인합니다.",
    "핵심 실행: 교육, 컨설팅, 도구 제공, 실습 등 주요 활동을 운영합니다.",
    "성과 정리: 참여자 변화, 매출/시간/문의 감소 같은 지표를 기록합니다.",
    "확산: 우수 사례를 콘텐츠나 보고서로 정리해 다음 사업으로 연결합니다.",
  ])}

## 6. 서비스 디자인
### 사용자 여정
${numbered([
    "인지: 대상자가 사업을 알게 되는 접점과 메시지를 설계합니다.",
    "신청: 신청 과정에서 필요한 서류와 입력 항목을 최소화합니다.",
    "진단: 대상자의 현재 수준과 문제를 빠르게 확인합니다.",
    "참여: 교육, 컨설팅, 실습, 템플릿 제공 등 핵심 경험을 제공합니다.",
    "적용: 실제 업무나 생활에 적용하도록 후속 과제를 제시합니다.",
    "성과 확인: 참여 전후 변화를 기록하고 사례를 수집합니다.",
  ])}

### 디자인 원칙
${bullet([
    "초보자도 이해할 수 있는 언어를 사용합니다.",
    "복잡한 절차는 체크리스트와 예시로 바꿉니다.",
    "AI 자동화와 사람의 최종 판단을 분리합니다.",
    "모바일과 PC에서 모두 이어서 볼 수 있게 자료를 저장합니다.",
  ])}

## 7. 서비스 블루프린트
| 단계 | 사용자 행동 | 화면/자료 | 운영자 행동 | 확인 지표 |
| --- | --- | --- | --- | --- |
| 모집 | 공고 확인 | 안내문, 신청서 | 홍보와 문의 응대 | 신청 수 |
| 진단 | 현재 문제 입력 | 진단 질문지 | 문제 유형 분류 | 진단 완료율 |
| 실행 | 교육/실습 참여 | 템플릿, 예시 | 코칭과 피드백 | 참여 완료율 |
| 적용 | 자기 업무에 적용 | 결과물, 체크리스트 | 보완 안내 | 적용 사례 수 |
| 평가 | 만족도 응답 | 설문, 성과표 | 결과 분석 | 만족도, 개선율 |

## 8. 논리모델
| 구분 | 내용 |
| --- | --- |
| 투입 | 예산, 운영 인력, 교육 자료, AI 도구, 협력기관 |
| 활동 | 사전 진단, 교육, 실습, 컨설팅, 후속 점검 |
| 산출 | 참여자 수, 교육 횟수, 제작된 결과물, 상담 건수 |
| 단기 성과 | 이해도 향상, 업무 시간 절감, 도구 활용 증가 |
| 중장기 성과 | 매출/전환 개선, 민원 감소, 지속 가능한 운영 역량 확보 |

## 9. 성과지표 설계
${bullet([
    "투입 지표: 예산 집행률, 운영 인력 투입 시간",
    "과정 지표: 신청 수, 참여율, 완료율, 문의 응답 시간",
    "산출 지표: 결과물 수, 템플릿 활용 수, 컨설팅 완료 건수",
    "성과 지표: 업무 시간 절감률, 만족도, 재참여 의향, 매출/문의 변화",
    "학습 지표: 다음 회차에서 개선할 병목과 사용자 피드백",
  ])}

## 10. 예산 편성 방향
${bullet([
    "인건비 또는 강사비",
    "콘텐츠, 교재, 템플릿 제작비",
    "홍보와 참여자 모집 비용",
    "운영 도구와 소프트웨어 비용",
    "성과 측정과 결과보고 비용",
  ])}

## 11. 핵심 성과지표 후보
${bullet([
    "참여자 수와 완료율",
    "업무 시간 절감",
    "문의 또는 민원 감소",
    "매출, 전환, 방문 등 사업 성과",
    "만족도와 재참여 의향",
  ])}

## 12. 기대효과
${bullet([
    "대상자의 문제 해결 역량 향상",
    "업무 시간 절감",
    "디지털 도구 활용률 증가",
    "지원사업 종료 후에도 활용 가능한 자료 축적",
  ])}

## 13. 리스크와 보완책
${bullet([
    "참여자의 디지털 역량 차이: 난이도별 자료를 제공합니다.",
    "성과 측정의 어려움: 시작 전후 비교 지표를 정합니다.",
    "일회성 교육 위험: 템플릿과 후속 점검을 제공합니다.",
  ])}

## 14. 보완 질문
${numbered([
    "이 사업의 핵심 대상자는 누구인가요?",
    "대상자가 지금 가장 크게 겪는 문제는 무엇인가요?",
    "예산과 기간 안에서 실제로 제공할 수 있는 활동은 무엇인가요?",
    "심사위원이 믿을 수 있는 성과 근거는 무엇인가요?",
  ])}

## AI에게 이어서 물어볼 질문
아래 내용을 바탕으로 정부지원사업 제출용 사업계획서를 더 구체적으로 작성해줘. 항목은 사업명, 사업 필요성, 지원 대상, 목표, 세부 실행계획, 서비스 디자인, 서비스 블루프린트, 논리모델, 성과지표, 예산 편성 방향, 기대효과, 리스크와 보완책으로 나눠줘.

[자료]
${content}
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

function renderTable({ title, content }) {
  const table = parseTable(content);
  const subject = title || "표/시트 분석";

  if (!table.rows.length) {
    return `# ${subject}

## 사용 방법
엑셀이나 구글시트에서 표 영역을 복사한 뒤 왼쪽 입력칸에 붙여넣으세요.

## 예시
월    문의    매출
1월   14     1200000
2월   21     1850000

## AI에게 물어볼 질문
아래 표를 기준으로 추세, 이상치, 개선 기회, 다음에 확인해야 할 질문을 정리해줘.
`;
  }

  const numericSummary = table.numericColumns.length
    ? table.numericColumns
        .map((column) => {
          return `- ${column.header}: 합계 ${formatNumber(column.sum)}, 평균 ${formatNumber(
            column.average,
          )}, 최소 ${formatNumber(column.min)}, 최대 ${formatNumber(column.max)}`;
        })
        .join("\n")
    : "- 숫자 컬럼을 찾지 못했습니다. 숫자에 쉼표나 문자 단위가 섞여 있으면 정리해보세요.";

  return `# ${subject}

## 표 요약
- 컬럼 수: ${table.headers.length}
- 데이터 행 수: ${table.rows.length}
- 숫자 컬럼 수: ${table.numericColumns.length}

## 숫자 컬럼 요약
${numericSummary}

## 먼저 볼 포인트
${bullet([
    "합계와 평균이 높은 컬럼을 기준으로 성과 흐름을 확인하세요.",
    "최대값과 최소값 차이가 큰 컬럼은 원인을 따로 봐야 합니다.",
    "기간별 자료라면 최근 값이 좋아지는지 나빠지는지 추세를 확인하세요.",
    "숫자가 비어 있는 행은 입력 오류인지 실제 결측인지 구분하세요.",
  ])}

## AI에게 이어서 물어볼 질문
아래 표를 분석해서 핵심 추세, 이상치, 원인 가설, 의사결정에 필요한 추가 질문, 다음 행동을 제안해줘.

[표]
${content || "여기에 표를 붙여넣으세요."}
`;
}

function renderQuestion({ title, content, skillValue }) {
  const skill = skillChoices.find((choice) => choice.value === skillValue);
  if (!content.trim()) {
    return `# AI에게 물어볼 질문

자료를 붙여넣고 [분석하기]를 누르면 복사해서 다른 AI에게 보낼 질문을 만들어드립니다.
`;
  }

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
  if (!content.trim()) {
    return `# ${subject}

AI가 만든 답변을 붙여넣고 [분석하기]를 누르세요.

사실성, 논리, 실행 가능성, 사용자 관점, 리스크 기준으로 점검합니다.
`;
  }

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
  const [analyzedContent, setAnalyzedContent] = useState("");
  const [projectName, setProjectName] = useState("");
  const [projects, setProjects] = useState([]);
  const [selectedProjectId, setSelectedProjectId] = useState("");
  const [brand, setBrand] = useState("");
  const [audience, setAudience] = useState("");
  const [purpose, setPurpose] = useState("");
  const [skillValue, setSkillValue] = useState("policy");
  const [planFormat, setPlanFormat] = useState("government");
  const [copied, setCopied] = useState(false);
  const [savedMessage, setSavedMessage] = useState("");
  const [tasks, setTasks] = useState(() => readTasks());
  const [isTaskFormOpen, setIsTaskFormOpen] = useState(false);
  const [editingTaskId, setEditingTaskId] = useState(null);
  const [showCompleted, setShowCompleted] = useState(false);
  const [selectedStatus, setSelectedStatus] = useState("all");
  const [taskForm, setTaskForm] = useState(emptyTaskForm);
  const [taskMessage, setTaskMessage] = useState("");
  const fileInputRef = useRef(null);

  const activeWorkflow = workflows.find((workflow) => workflow.id === activeId);
  const ActiveIcon = activeWorkflow.icon;
  const draftKey = `my-workbench:draft:${activeId}`;

  const result = useMemo(() => {
    if (activeId === "policy") return renderPolicy({ title, content: analyzedContent });
    if (activeId === "notice") return renderNotice({ title, content: analyzedContent });
    if (activeId === "plan") {
      return renderPlan({ title, content: analyzedContent, planFormat });
    }
    if (activeId === "marketing") {
      return renderMarketing({ title, content: analyzedContent, brand, audience });
    }
    if (activeId === "table") return renderTable({ title, content: analyzedContent });
    if (activeId === "question") {
      return renderQuestion({ title, content: analyzedContent, skillValue });
    }
    return renderReview({ title, content: analyzedContent, purpose });
  }, [activeId, analyzedContent, audience, brand, planFormat, purpose, skillValue, title]);

  const taskSummary = useMemo(() => summarizeTasks(tasks), [tasks]);
  const activeTasks = useMemo(() => {
    const sorted = sortActiveTasks(tasks);
    return selectedStatus === "all"
      ? sorted
      : sorted.filter((task) => task.status === selectedStatus);
  }, [selectedStatus, tasks]);
  const completedTasks = useMemo(
    () => tasks.filter((task) => task.status === "done").sort((a, b) => String(b.updatedAt).localeCompare(String(a.updatedAt))),
    [tasks],
  );

  const tablePreview = useMemo(() => {
    return activeId === "table" ? parseTable(analyzedContent) : null;
  }, [activeId, analyzedContent]);

  useEffect(() => {
    setCopied(false);
    setSavedMessage("");
  }, [activeId]);

  useEffect(() => {
    setProjects(readProjects());
  }, []);

  function persistTasks(nextTasks) {
    setTasks(nextTasks);
    writeTasks(nextTasks);
  }

  function openTaskCreator() {
    setEditingTaskId(null);
    setTaskForm(emptyTaskForm);
    setTaskMessage("");
    setIsTaskFormOpen(true);
  }

  function openTaskEditor(task) {
    setEditingTaskId(task.id);
    setTaskForm({
      title: task.title,
      status: task.status,
      priority: task.priority,
      deadline: task.deadline,
      projectName: task.projectName,
      jiraUrl: task.jiraUrl,
      note: task.note,
    });
    setTaskMessage("");
    setIsTaskFormOpen(true);
  }

  function closeTaskForm() {
    setIsTaskFormOpen(false);
    setEditingTaskId(null);
    setTaskForm(emptyTaskForm);
    setTaskMessage("");
  }

  function handleTaskFormChange(event) {
    const { name, value } = event.target;
    setTaskForm((current) => ({ ...current, [name]: value }));
  }

  function handleCreateTask(event) {
    event.preventDefault();
    try {
      const task = createTask(taskForm.title);
      persistTasks([task, ...tasks]);
      closeTaskForm();
    } catch {
      setTaskMessage("할 일 제목을 적어주세요.");
    }
  }

  function handleUpdateTask(event) {
    event.preventDefault();
    try {
      const nextTasks = updateTask(tasks, editingTaskId, taskForm);
      persistTasks(nextTasks);
      closeTaskForm();
    } catch {
      setTaskMessage("할 일 제목을 적어주세요.");
    }
  }

  function handleStatusChange(taskId, status) {
    try {
      persistTasks(updateTask(tasks, taskId, { status }));
    } catch {
      setTaskMessage("업무 상태를 바꾸지 못했습니다.");
    }
  }

  function handleDeleteTask(taskId) {
    if (!window.confirm("이 할 일을 삭제할까요?")) return;
    persistTasks(deleteTask(tasks, taskId));
    if (editingTaskId === taskId) closeTaskForm();
  }

  function saveDraft() {
    localStorage.setItem(
      draftKey,
      JSON.stringify({
        title,
        content,
        analyzedContent,
        brand,
        audience,
        purpose,
        skillValue,
        planFormat,
      }),
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
    setAnalyzedContent(parsed.analyzedContent || parsed.content || "");
    setBrand(parsed.brand || "");
    setAudience(parsed.audience || "");
    setPurpose(parsed.purpose || "");
    setSkillValue(parsed.skillValue || "policy");
    setPlanFormat(parsed.planFormat || "government");
    setSavedMessage("임시 저장 자료를 불러왔습니다.");
  }

  function currentProjectSnapshot(id = selectedProjectId) {
    const now = new Date().toISOString();
    return {
      id: id || `project-${Date.now()}`,
      name: projectName.trim() || title.trim() || "이름 없는 프로젝트",
      updatedAt: now,
      activeId,
      title,
      content,
      analyzedContent,
      result,
      brand,
      audience,
      purpose,
      skillValue,
      planFormat,
    };
  }

  function saveProject() {
    const snapshot = currentProjectSnapshot();
    const nextProjects = [
      snapshot,
      ...projects.filter((project) => project.id !== snapshot.id),
    ].slice(0, 30);

    writeProjects(nextProjects);
    setProjects(nextProjects);
    setSelectedProjectId(snapshot.id);
    setProjectName(snapshot.name);
    setSavedMessage("프로젝트 저장함에 저장했습니다.");
  }

  function loadProject(projectId) {
    const project = projects.find((item) => item.id === projectId);
    if (!project) return;

    setSelectedProjectId(project.id);
    setProjectName(project.name || "");
    setActiveId(project.activeId || "notice");
    setTitle(project.title || project.name || "");
    setContent(project.content || "");
    setAnalyzedContent(project.analyzedContent || "");
    setBrand(project.brand || "");
    setAudience(project.audience || "");
    setPurpose(project.purpose || "");
    setSkillValue(project.skillValue || "policy");
    setPlanFormat(project.planFormat || "government");
    setSavedMessage("프로젝트를 불러왔습니다. 수정 후 다시 저장할 수 있습니다.");
  }

  function deleteProject() {
    if (!selectedProjectId) {
      setSavedMessage("삭제할 프로젝트를 먼저 선택하세요.");
      return;
    }

    const nextProjects = projects.filter((project) => project.id !== selectedProjectId);
    writeProjects(nextProjects);
    setProjects(nextProjects);
    setSelectedProjectId("");
    setSavedMessage("선택한 프로젝트를 삭제했습니다.");
  }

  function openLocalFilePicker() {
    fileInputRef.current?.click();
  }

  async function readLocalFile(event) {
    const file = event.target.files?.[0];
    if (!file) return;

    if (file.type === "application/pdf" || file.name.toLowerCase().endsWith(".pdf")) {
      setSavedMessage("PDF를 읽는 중입니다. 잠시만 기다려주세요.");
      try {
        const text = await extractPdfText(file);
        setContent(text);
        setAnalyzedContent("");
        if (!title) {
          setTitle(file.name.replace(/\.[^.]+$/, ""));
        }
        setSavedMessage(`${file.name} PDF를 불러왔습니다. [분석하기]를 눌러 결과를 생성하세요.`);
      } catch {
        setSavedMessage("PDF 텍스트를 읽지 못했습니다. 스캔 이미지 PDF라면 먼저 OCR이 필요합니다.");
      } finally {
        event.target.value = "";
      }
      return;
    }

    const reader = new FileReader();
    reader.onload = () => {
      const text = String(reader.result || "");
      setContent(text);
      setAnalyzedContent("");
      if (!title) {
        setTitle(file.name.replace(/\.[^.]+$/, ""));
      }
      setSavedMessage(`${file.name} 파일을 불러왔습니다. [분석하기]를 눌러 결과를 생성하세요.`);
      event.target.value = "";
    };
    reader.onerror = () => {
      setSavedMessage("파일을 읽지 못했습니다. txt, md, csv 파일로 다시 시도해보세요.");
      event.target.value = "";
    };
    reader.readAsText(file, "utf-8");
  }

  function fillSample() {
    setContent(samples[activeId]);
    if (!title) setTitle(activeWorkflow.label);
    setSavedMessage("예시를 넣었습니다. [분석하기]를 눌러 결과를 확인하세요.");
  }

  function analyzeNow() {
    setAnalyzedContent(content);
    setSavedMessage(
      content.trim()
        ? "분석했습니다. 오른쪽 결과를 확인하세요."
        : "먼저 자료를 붙여넣어 주세요.",
    );
  }

  function continueToWorkflow(nextId, nextTitle) {
    setActiveId(nextId);
    setTitle(nextTitle || title);
    setContent(result);
    setAnalyzedContent(result);
    setSavedMessage("이전 결과를 다음 단계로 넘겼습니다. 필요한 내용을 보완한 뒤 다시 분석하세요.");
  }

  function resetInput() {
    setTitle("");
    setContent("");
    setAnalyzedContent("");
    setBrand("");
    setAudience("");
    setPurpose("");
    setSkillValue("policy");
    setPlanFormat("government");
    setSavedMessage("입력칸을 비웠습니다.");
  }

  function moveToWorkflow(workflowId) {
    setActiveId(workflowId);
    setSavedMessage("단계를 이동했습니다. 입력 내용을 수정한 뒤 [분석하기]를 누르세요.");
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
        <section className="workbench-home" aria-labelledby="workbench-home-title">
          <div className="workbench-hero">
            <div>
              <p className="workbench-kicker">MY WORKBENCH · PERSONAL COMMAND CENTER</p>
              <h2 id="workbench-home-title">오늘의 업무</h2>
              <p className="workbench-date">{formatKoreanDate()}</p>
              <p className="workbench-intro">지금 해야 할 일부터 차분하게 정리해보세요.</p>
            </div>
            <button className="workbench-primary" onClick={openTaskCreator} type="button">
              <Plus size={18} aria-hidden="true" />
              할 일 추가
            </button>
          </div>

          <div className="workbench-summary" aria-label="업무 요약">
            {[
              ["all", taskSummary.active, "해야 할 일", "아직 끝내지 않은 업무", "summary-blue"],
              ["in_progress", taskSummary.inProgress, "하고 있는 일", "지금 진행 중인 업무", "summary-mint"],
              ["blocked", taskSummary.blocked, "막힌 일", "도움이나 결정이 필요한 업무", "summary-coral"],
              ["done", taskSummary.done, "완료한 일", "끝낸 업무", "summary-violet"],
            ].map(([status, count, label, description, accent]) => (
              <button
                className={`workbench-summary-card ${accent} ${selectedStatus === status ? "selected" : ""}`}
                key={status}
                onClick={() => {
                  if (status === "done") {
                    setSelectedStatus("all");
                    setShowCompleted(true);
                    return;
                  }
                  setSelectedStatus(status);
                }}
                type="button"
              >
                <span>{label}</span>
                <strong>{count}</strong>
                <small>{description}</small>
              </button>
            ))}
          </div>

          {isTaskFormOpen && (
            <form className="workbench-task-form" onSubmit={editingTaskId ? handleUpdateTask : handleCreateTask}>
              <div className="workbench-form-heading">
                <div>
                  <span className="workbench-form-kicker">{editingTaskId ? "업무 수정" : "빠른 등록"}</span>
                  <h3>{editingTaskId ? "업무 내용을 고쳐보세요" : "무엇을 해야 하나요?"}</h3>
                </div>
                <button aria-label="입력 닫기" className="icon-button" onClick={closeTaskForm} type="button">
                  <X size={18} aria-hidden="true" />
                </button>
              </div>
              <label className="workbench-title-field">
                할 일 제목
                <input
                  autoFocus
                  name="title"
                  onChange={handleTaskFormChange}
                  placeholder="예: JIRA 로그인 오류 이슈 확인"
                  value={taskForm.title}
                />
              </label>
              {editingTaskId && (
                <div className="workbench-detail-grid">
                  <label>
                    상태
                    <select name="status" onChange={handleTaskFormChange} value={taskForm.status}>
                      {taskStatusOptions.map(([value, label]) => <option key={value} value={value}>{label}</option>)}
                    </select>
                  </label>
                  <label>
                    우선순위
                    <select name="priority" onChange={handleTaskFormChange} value={taskForm.priority}>
                      <option value="low">낮음</option>
                      <option value="normal">보통</option>
                      <option value="high">높음</option>
                    </select>
                  </label>
                  <label>
                    마감일
                    <input name="deadline" onChange={handleTaskFormChange} type="date" value={taskForm.deadline} />
                  </label>
                  <label>
                    프로젝트
                    <input name="projectName" onChange={handleTaskFormChange} placeholder="예: 고객지원 개선" value={taskForm.projectName} />
                  </label>
                  <label className="workbench-full-field">
                    JIRA 링크
                    <input name="jiraUrl" onChange={handleTaskFormChange} placeholder="https://회사주소.atlassian.net/browse/ABC-123" type="url" value={taskForm.jiraUrl} />
                  </label>
                  <label className="workbench-full-field">
                    메모
                    <textarea name="note" onChange={handleTaskFormChange} placeholder="필요할 때만 메모를 남겨주세요." rows="3" value={taskForm.note} />
                  </label>
                </div>
              )}
              {taskMessage && <p className="workbench-form-message" role="alert">{taskMessage}</p>}
              <div className="workbench-form-actions">
                <button className="workbench-primary" type="submit">
                  <Check size={17} aria-hidden="true" />
                  {editingTaskId ? "변경 저장" : "추가하기"}
                </button>
                <button className="workbench-secondary" onClick={closeTaskForm} type="button">취소</button>
              </div>
            </form>
          )}

          <div className="workbench-task-section">
            <div className="workbench-section-heading">
              <div>
                <span className="workbench-form-kicker">FOCUS LIST</span>
                <h3>{selectedStatus === "all" ? "아직 끝내지 않은 일" : taskStatusLabels[selectedStatus]}</h3>
              </div>
              <button className="workbench-secondary" onClick={openTaskCreator} type="button">
                <Plus size={16} aria-hidden="true" />
                빠르게 추가
              </button>
            </div>

            {activeTasks.length === 0 ? (
              <div className="workbench-empty-state">
                <div className="workbench-empty-icon"><Check size={24} aria-hidden="true" /></div>
                <h3>{selectedStatus === "all" ? "아직 등록한 일이 없습니다" : "이 상태의 업무가 없습니다"}</h3>
                <p>{selectedStatus === "all" ? "오늘 해야 할 일 하나를 적어보면 업무가 선명해집니다." : "다른 상태의 업무를 확인하거나 새 일을 추가해보세요."}</p>
                {selectedStatus === "all" && <button className="workbench-primary" onClick={openTaskCreator} type="button"><Plus size={17} aria-hidden="true" />첫 할 일 추가하기</button>}
              </div>
            ) : (
              <div className="workbench-task-list">
                {activeTasks.map((task) => (
                  <article className={`workbench-task-card status-${task.status}`} key={task.id}>
                    <div className="workbench-task-main">
                      <span className={`workbench-status-badge status-${task.status}`}>{taskStatusLabels[task.status]}</span>
                      <h4>{task.title}</h4>
                      <div className="workbench-task-meta">
                        {task.projectName && <span>{task.projectName}</span>}
                        {task.deadline && <span>마감 {formatTaskDate(task.deadline)}</span>}
                        {task.jiraUrl && <a href={task.jiraUrl} rel="noreferrer" target="_blank"><ExternalLink size={13} aria-hidden="true" />JIRA 열기</a>}
                      </div>
                    </div>
                    <div className="workbench-task-actions">
                      <button onClick={() => handleStatusChange(task.id, "done")} type="button"><Check size={15} aria-hidden="true" />완료</button>
                      {task.status !== "in_progress" && <button onClick={() => handleStatusChange(task.id, "in_progress")} type="button">진행 중</button>}
                      {task.status !== "blocked" && <button onClick={() => handleStatusChange(task.id, "blocked")} type="button">막힘</button>}
                      <button aria-label={`${task.title} 수정`} onClick={() => openTaskEditor(task)} type="button"><Pencil size={14} aria-hidden="true" />수정</button>
                      <button aria-label={`${task.title} 삭제`} className="danger-button" onClick={() => handleDeleteTask(task.id)} type="button"><Trash2 size={14} aria-hidden="true" />삭제</button>
                    </div>
                  </article>
                ))}
              </div>
            )}
          </div>

          {completedTasks.length > 0 && (
            <div className="workbench-completed">
              <button className="workbench-completed-toggle" onClick={() => setShowCompleted((current) => !current)} type="button">
                <span><Check size={16} aria-hidden="true" />완료한 일 {completedTasks.length}개</span>
                <ChevronDown className={showCompleted ? "rotated" : ""} size={18} aria-hidden="true" />
              </button>
              {showCompleted && <div className="workbench-completed-list">{completedTasks.map((task) => <div className="workbench-completed-item" key={task.id}><Check size={15} aria-hidden="true" /><span>{task.title}</span><button onClick={() => handleDeleteTask(task.id)} type="button">삭제</button></div>)}</div>}
            </div>
          )}

          <div className="workbench-ai-bridge">
            <div>
              <span className="workbench-form-kicker">NEXT WORKSPACE</span>
              <h3>AI 작업도 이어서 해보세요</h3>
              <p>자료 정리, AI 질문 만들기, 답변 검토는 아래 작업 공간에서 계속할 수 있습니다.</p>
            </div>
            <ArrowRight size={20} aria-hidden="true" />
          </div>
        </section>

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
            <span>문제 분석</span>
          </div>
          <div>
            <strong>02</strong>
            <span>서비스 설계</span>
          </div>
          <div>
            <strong>03</strong>
            <span>성과 검토</span>
          </div>
        </section>

        <div className="guide-bubble">
          <strong>오늘의 안내</strong>
          <span>{activeWorkflow.short}</span>
        </div>

        <section className="workflow-map" aria-label="사업계획서 작성 흐름">
          {workflowMap.map((item, index) => (
            <React.Fragment key={item.id}>
              <button
                className={activeId === item.id ? "current" : ""}
                onClick={() => moveToWorkflow(item.id)}
                type="button"
              >
                <strong>{item.step}</strong>
                <span>{item.label}</span>
              </button>
              {index < workflowMap.length - 1 && <i aria-hidden="true" />}
            </React.Fragment>
          ))}
        </section>

        <section className="project-vault" aria-label="프로젝트 저장함">
          <div className="project-vault-head">
            <div>
              <strong>프로젝트 저장함</strong>
              <span>자료, 분석 결과, 현재 단계를 한 묶음으로 저장합니다.</span>
            </div>
            <button onClick={saveProject} type="button">
              <Save size={16} aria-hidden="true" />
              프로젝트 저장
            </button>
          </div>
          <div className="project-vault-controls">
            <label>
              프로젝트 이름
              <input
                onChange={(event) => setProjectName(event.target.value)}
                placeholder="예: 2026 소상공인 AI 지원사업"
                value={projectName}
              />
            </label>
            <label>
              저장된 프로젝트
              <select
                onChange={(event) => loadProject(event.target.value)}
                value={selectedProjectId}
              >
                <option value="">프로젝트 선택</option>
                {projects.map((project) => (
                  <option key={project.id} value={project.id}>
                    {project.name}
                  </option>
                ))}
              </select>
            </label>
            <button className="ghost-danger" onClick={deleteProject} type="button">
              삭제
            </button>
          </div>
        </section>

        <section className="storage-strip" aria-label="저장 방식 안내">
          {storageSteps.map((step) => (
            <p key={step}>{step}</p>
          ))}
        </section>

        <div className="workspace-grid">
          <section className="input-panel" aria-label="자료 입력">
            <div className="quick-actions" aria-label="빠른 작업">
              <button className="primary-action" onClick={analyzeNow} type="button">
                <Sparkles size={16} aria-hidden="true" />
                분석하기
              </button>
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
                임시
              </button>
              <button onClick={openLocalFilePicker} type="button">
                <FileText size={16} aria-hidden="true" />
                파일
              </button>
              <button onClick={resetInput} type="button">
                <RotateCcw size={16} aria-hidden="true" />
                비우기
              </button>
            </div>
            <input
              accept=".txt,.md,.csv,.tsv,.json,.pdf,text/*,application/pdf"
              className="file-input"
              onChange={readLocalFile}
              ref={fileInputRef}
              type="file"
            />

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

            {activeId === "plan" && (
              <label>
                어떤 양식으로 작성할까요?
                <select
                  onChange={(event) => setPlanFormat(event.target.value)}
                  value={planFormat}
                >
                  {planFormats.map((format) => (
                    <option key={format.value} value={format.value}>
                      {format.label}
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

            {activeId === "table" && (
              <div className="table-help">
                엑셀이나 구글시트에서 셀 범위를 복사한 뒤 그대로 붙여넣으세요.
                첫 줄은 제목 행으로 인식합니다.
              </div>
            )}
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
            <div className="next-step-panel" aria-label="다음 단계">
              <strong>다음 단계</strong>
              <div>
                {activeId === "notice" && (
                  <>
                    <button
                      onClick={() => continueToWorkflow("plan", "공고문 기반 사업계획서")}
                      type="button"
                    >
                      사업계획서 초안으로
                    </button>
                    <button
                      onClick={() => continueToWorkflow("question", "공고문 분석 후 AI 질문")}
                      type="button"
                    >
                      AI 질문으로
                    </button>
                  </>
                )}
                {activeId === "plan" && (
                  <>
                    <button
                      onClick={() => continueToWorkflow("review", "사업계획서 초안 검토")}
                      type="button"
                    >
                      검토 단계로
                    </button>
                    <button
                      onClick={() => continueToWorkflow("question", "사업계획서 보완 질문")}
                      type="button"
                    >
                      보완 질문 만들기
                    </button>
                  </>
                )}
                {activeId === "policy" && (
                  <button
                    onClick={() => continueToWorkflow("question", "정책 개선 질문")}
                    type="button"
                  >
                    AI 질문으로
                  </button>
                )}
                {activeId === "table" && (
                  <button
                    onClick={() => continueToWorkflow("question", "표 분석 후 AI 질문")}
                    type="button"
                  >
                    더 깊은 분석 질문으로
                  </button>
                )}
                {activeId === "question" && (
                  <button
                    onClick={() => continueToWorkflow("review", "AI 답변 검토")}
                    type="button"
                  >
                    답변 검토로
                  </button>
                )}
                {activeId === "marketing" && (
                  <button
                    onClick={() => continueToWorkflow("review", "콘텐츠 초안 검토")}
                    type="button"
                  >
                    콘텐츠 검토로
                  </button>
                )}
                {activeId === "review" && (
                  <button onClick={() => downloadMarkdown({ activeId, title, result })} type="button">
                    최종 결과 저장
                  </button>
                )}
              </div>
            </div>
            {activeId === "table" && tablePreview?.rows.length > 0 && (
              <div className="table-preview" aria-label="표 미리보기">
                <div className="mini-table-wrap">
                  <table>
                    <thead>
                      <tr>
                        {tablePreview.headers.map((header) => (
                          <th key={header}>{header}</th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {tablePreview.rows.slice(0, 6).map((row, rowIndex) => (
                        <tr key={`${row.join("-")}-${rowIndex}`}>
                          {tablePreview.headers.map((header, columnIndex) => (
                            <td key={`${header}-${columnIndex}`}>
                              {row[columnIndex] || ""}
                            </td>
                          ))}
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>

                <div className="chart-list">
                  {tablePreview.numericColumns.slice(0, 3).map((column) => {
                    const max = Math.max(...column.values, 1);
                    return (
                      <div className="chart-card" key={column.header}>
                        <strong>{column.header}</strong>
                        {column.values.slice(0, 8).map((value, index) => (
                          <div className="bar-row" key={`${column.header}-${index}`}>
                            <span>{index + 1}</span>
                            <div>
                              <i style={{ width: `${Math.max((value / max) * 100, 4)}%` }} />
                            </div>
                            <em>{formatNumber(value)}</em>
                          </div>
                        ))}
                      </div>
                    );
                  })}
                </div>
              </div>
            )}
            <pre>{result}</pre>
          </section>
        </div>
      </section>
    </main>
  );
}

createRoot(document.getElementById("root")).render(<App />);
