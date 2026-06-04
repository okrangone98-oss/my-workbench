import React, { useEffect, useMemo, useState } from "react";
import { createRoot } from "react-dom/client";
import {
  BarChart3,
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
  { value: "policy", label: "정책 문제 구조화" },
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

function renderPolicy({ title, content }) {
  const subject = title || "정책 문제 구조화";
  if (!content.trim()) {
    return `# ${subject}

자료를 붙여넣은 뒤 왼쪽의 [분석하기] 버튼을 누르면 결과가 생성됩니다.

## 지금 할 일
1. 민원, 회의 메모, 현장 의견 같은 자료를 붙여넣습니다.
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

## 6. 예산 편성 방향
${bullet([
    "인건비 또는 강사비",
    "콘텐츠, 교재, 템플릿 제작비",
    "홍보와 참여자 모집 비용",
    "운영 도구와 소프트웨어 비용",
    "성과 측정과 결과보고 비용",
  ])}

## 7. 성과지표
${bullet([
    "참여자 수와 완료율",
    "업무 시간 절감",
    "문의 또는 민원 감소",
    "매출, 전환, 방문 등 사업 성과",
    "만족도와 재참여 의향",
  ])}

## 8. 기대효과
${bullet([
    "대상자의 문제 해결 역량 향상",
    "업무 시간 절감",
    "디지털 도구 활용률 증가",
    "지원사업 종료 후에도 활용 가능한 자료 축적",
  ])}

## 9. 리스크와 보완책
${bullet([
    "참여자의 디지털 역량 차이: 난이도별 자료를 제공합니다.",
    "성과 측정의 어려움: 시작 전후 비교 지표를 정합니다.",
    "일회성 교육 위험: 템플릿과 후속 점검을 제공합니다.",
  ])}

## 10. 보완 질문
${numbered([
    "이 사업의 핵심 대상자는 누구인가요?",
    "대상자가 지금 가장 크게 겪는 문제는 무엇인가요?",
    "예산과 기간 안에서 실제로 제공할 수 있는 활동은 무엇인가요?",
    "심사위원이 믿을 수 있는 성과 근거는 무엇인가요?",
  ])}

## AI에게 이어서 물어볼 질문
아래 내용을 바탕으로 정부지원사업 제출용 사업계획서를 더 구체적으로 작성해줘. 항목은 사업명, 사업 필요성, 지원 대상, 목표, 세부 실행계획, 예산 편성 방향, 성과지표, 기대효과, 리스크와 보완책으로 나눠줘.

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
  const [brand, setBrand] = useState("");
  const [audience, setAudience] = useState("");
  const [purpose, setPurpose] = useState("");
  const [skillValue, setSkillValue] = useState("policy");
  const [planFormat, setPlanFormat] = useState("government");
  const [copied, setCopied] = useState(false);
  const [savedMessage, setSavedMessage] = useState("");

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

  const tablePreview = useMemo(() => {
    return activeId === "table" ? parseTable(analyzedContent) : null;
  }, [activeId, analyzedContent]);

  useEffect(() => {
    setCopied(false);
    setSavedMessage("");
  }, [activeId]);

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
            <span>자료 분석</span>
          </div>
          <div>
            <strong>02</strong>
            <span>초안 작성</span>
          </div>
          <div>
            <strong>03</strong>
            <span>검토와 저장</span>
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
