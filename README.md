# my-workbench

AI 소식을 내 업무의 작은 실험으로 바꾸고, 결과와 학습을 축적하는 개인 작업 벤치.

## AI 소식 실험 노트

웹 첫 화면에서 Threads·기사 원문을 기록하고, 내 관심과 업무에 맞는 실험을 준비할 수 있습니다. 기존 업무 대시보드와 자료 정리 도구는 `오늘의 업무 · 작업 도구` 탭에서 사용합니다.

1. `소식 기록하기`로 제목과 링크를 남기고 원문을 붙여넣거나 TXT·MD·PDF 파일에서 읽습니다. 링크만으로 Threads 게시물을 자동 수집하지 않습니다. 스캔 PDF는 OCR이 필요합니다.
2. 주장, 공식 출처, 직접 확인한 근거와 내 업무에 적용할 문제를 기록합니다. 근거 확인 상태는 사용자가 직접 결정합니다.
3. 소식 1~5개를 선택하고 `내 관심과 기준`을 입력합니다.
4. `무료 AI 연결`에서 개인 OpenRouter 계정을 연결합니다. 선택한 자료를 보내는 데 동의하고 무료 AI로 실험을 추천받습니다. 연결 없이 ChatGPT·Codex 요청문을 복사할 수도 있습니다.
5. 제안을 확인하고 `이 실험 준비하기`로 실험과 성공 기준을 저장합니다. 실제 결과, 소요 시간, 수정 횟수, 배운 개념과 다음 행동을 남깁니다.
6. JSON 백업을 내려받아 G드라이브 개발 작업 폴더에 보관합니다. 다른 브라우저에서는 백업을 복원합니다. 중복 기록은 더 최근 수정본을 유지합니다.

기록과 초안은 이 브라우저에 저장되며 자동 기기 동기화는 없습니다. 원본 파일은 서버에 업로드하지 않지만, AI 추천을 요청하면 선택한 글과 관심 설정이 OpenRouter와 해당 모델 제공자에게 전달됩니다. AI는 인터넷 검색이나 공식 출처 검증을 수행하지 않습니다. 원문과 맞지 않는 AI 인용은 별도로 표시합니다.

### 무료 API 사용

`openrouter/free`만 호출합니다. 요청 전에 공개 모델 목록에서 가격 0을 확인하고, 공급자 가격 상한도 0으로 지정합니다. 유료 모델, 검색 플러그인, 자동 재시도는 사용하지 않습니다. 무료 한도·가용성이 바뀌면 요청을 멈추고 이유를 표시합니다. 실제 선택된 모델명은 결과에 표시합니다.

OpenRouter 계정 연결에는 PKCE S256과 state 검증을 사용합니다. 연결 키는 앱 메모리에만 남고 새로고침 시 사라집니다. 개인 키 임시 입력도 지원하며 localStorage·JSON 백업·GitHub에 키를 저장하지 않습니다. 연결 해제는 앱의 키를 지우고, 발급된 키의 취소는 OpenRouter의 `내 연결 키 관리`에서 합니다.

- [OpenRouter 무료 라우터](https://openrouter.ai/openrouter/free)
- [계정 연결 공식 문서](https://openrouter.ai/docs/guides/overview/auth/oauth)

### 실행과 배포

```bash
npm ci
npm run dev:web
npm test --workspace @my-work-bench/web
npm run build
npm run lint
```

GitHub Pages 주소: https://okrangone98-oss.github.io/my-workbench/

`.github/workflows/pages.yml`이 PR의 테스트와 빌드를 검증하고, main 반영 후 Pages에 배포합니다. Pages의 Source는 GitHub Actions입니다. Node 22를 사용하며 Pages 하위 경로는 `VITE_BASE_PATH=/my-workbench/`로 빌드합니다. 이 값은 공개 경로 설정이며 비밀키를 넣는 변수가 아닙니다. 서버·유료 API·새 의존성 없이 정적 사이트로 운영합니다.

Pages 결과를 로컬에서 볼 때는 빌드와 미리보기 모두 같은 경로를 지정합니다.

```bash
VITE_BASE_PATH=/my-workbench/ npm run build:web
VITE_BASE_PATH=/my-workbench/ npm run preview --workspace @my-work-bench/web
```

## 목표

- 디지털 업무 자산과 흐름의 체계적 관리
- 로컬, Google Drive, GitHub 역할 분리
- 장기 보존 자료와 최근 3개월 자료 구분 관리
- 문서, 프롬프트, 코드, 자동화 자산의 GitHub 중심 정리

## 문서 시작점

- [Docs Index](./docs/README.md)
- [PRD](./docs/PRD.md)
- [정리원칙](./docs/정리원칙.md)
- [자산분류기준](./docs/자산분류기준.md)
- [저장위치기준](./docs/저장위치기준.md)
- [운영절차](./docs/운영절차.md)
- [후속구조확장](./docs/후속구조확장.md)
- [후속작업기준](./docs/후속작업기준.md)
- [자산인벤토리템플릿](./docs/자산인벤토리템플릿.md)
- [최근3개월점검표](./docs/최근3개월점검표.md)
- [삭제후보보고서템플릿](./docs/삭제후보보고서템플릿.md)
- [주간점검로그템플릿](./docs/주간점검로그템플릿.md)
- [G드라이브1차실행계획](./docs/G드라이브1차실행계획.md)
- [프로그램통합제안](./docs/프로그램통합제안.md)
- [프로젝트통합분석_2026-03-07](./docs/프로젝트통합분석_2026-03-07.md)
- [역할기반스킬초안](./docs/역할기반스킬초안.md)
- [코어추출매핑_2026-03-07](./docs/코어추출매핑_2026-03-07.md)
- [민감정보분리전략](./docs/민감정보분리전략.md)
- [G드라이브1차적용결과_2026-03-07](./docs/G드라이브1차적용결과_2026-03-07.md)
- [G드라이브2차적용결과_2026-03-07](./docs/G드라이브2차적용결과_2026-03-07.md)
- [G드라이브3차적용결과_2026-03-07](./docs/G드라이브3차적용결과_2026-03-07.md)
- [로컬 AI 업무본부 통합 설계](./docs/로컬AI업무본부_통합설계_2026-06-04.md)
- [스킬 사용성 원칙](./docs/스킬사용성원칙_한글명령어_객관식.md)
- [프로그램 개발 및 통합 계획](./docs/프로그램개발및통합계획_2026-06-04.md)
- [레포 흡수 매핑](./docs/레포흡수매핑_2026-06-04.md)

## 현재 구조(v1)

```text
my-workbench/
  README.md
  docs/
  apps/
  packages/
  package.json
```

`packages/` includes `core`, `agents`, `skills`, `integrations`.

## CLI quick start

```bash
npm run dev:cli
npm run dev:cli -- classify project kodari-manager source-of-truth
npm run dev:cli -- classify asset tmp DELETE_CANDIDATE
npm run dev:cli -- task:create "정리 운영 점검"
npm run dev:cli -- task:dashboard
npm run dev:cli -- migrate:kodari
npm run dev:cli -- scan:folders G:\
npm run dev:cli -- apply:scan
npm run dev:cli -- apply:scan MOVE -- --apply
npm run dev:cli -- business:diagnose "my-workbench"
npm run dev:cli -- skill:menu
npm run dev:cli -- skill:menu 3
npm run dev:cli -- brain:capture -- --kind policy --title "민원 메모" --text "자료 내용"
npm run dev:cli -- ai:question 1 -- --text "분석할 자료 내용"
npm run dev:cli -- policy:structure -- --title "온라인 신청 민원" --text "민원 내용"
npm run dev:cli -- ai:review -- --purpose "정책 답변 검토" --text "AI 답변"
npm run dev:cli -- plan:notice -- --title "지원사업 공고" --text "공고문 내용"
npm run dev:cli -- marketing:ideas -- --topic "온라인 신청 절차 개선" --brand "정책 서비스"
npm run boilerplate:init -- --name company-ops-assistant --mode full
pwsh -File scripts/apply-g-drive-phase1.ps1
```

CLI 결과에는 처음 쓰는 사람도 따라갈 수 있도록 `안내`, `이렇게 사용하세요`, `다음 행동` 문구를 함께 표시합니다.

## 운영 원칙 요약

1. 삭제보다 분류를 우선한다.
2. 최근 3개월 자료는 전수 점검한다.
3. 장기 보존 원본은 로컬 중심으로 관리한다.
4. 민감정보/API 키/인증 파일은 GitHub에 올리지 않는다.
5. 설명 문서는 한글로 유지한다.

## 다음 액션

1. `G:\` 상위 폴더 인벤토리 작성
2. 최근 3개월 자료 1차 판정
3. 삭제 후보 보고서 누적 작성
4. `코다리부장` 기능을 `core/agents/skills`로 점진 이관
5. 역할 기반 스킬(`skills/`) 표준화

## 초보자용 오늘의 업무 화면

웹앱의 `오늘의 업무 · 작업 도구` 탭에서 아직 끝내지 않은 일을 한눈에 볼 수 있습니다.

```bash
npm install
npm run dev:web
```

브라우저에서 Vite가 알려주는 로컬 주소를 열고 다음 순서로 사용하세요.

1. `할 일 추가`를 누릅니다.
2. 해야 할 일을 제목 하나로 적고 `추가하기`를 누릅니다.
3. 일이 진행되면 `진행 중`, 막히면 `막힘`, 끝나면 `완료`를 누릅니다.
4. 필요한 경우 `수정`에서 프로젝트명, 마감일, 메모, JIRA 링크를 추가합니다.

첫 버전의 업무 목록은 현재 브라우저에 저장됩니다. 아직 JIRA와 자동으로 동기화하지 않으며, JIRA 이슈 링크를 개인 업무에 연결해 사용하는 방식입니다.
