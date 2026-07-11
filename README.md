# my-workbench

개인+회사 디지털 자산 통합 관리 작업본부 저장소.

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

웹앱을 실행하면 `오늘의 업무` 화면에서 아직 끝내지 않은 일을 한눈에 볼 수 있습니다.

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
