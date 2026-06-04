# 모바일과 Google Drive 연동 계획

## 결론

모바일 사용까지 생각하면 Google Drive를 활용하는 것이 좋다. 다만 처음부터 모든 파일을 클라우드에 올리기보다, 로컬 저장과 Google Drive 저장을 선택할 수 있게 만드는 방식이 안전하다.

## 왜 필요한가

- 모바일 브라우저는 PC의 `G:\03_개발작업공간\my-work-bench` 폴더에 직접 저장할 수 없다.
- 사용자는 이동 중에도 공고문, 메모, AI 질문, 검토 결과를 보고 싶을 수 있다.
- Google Drive는 무료 사용량이 있고, 문서 공유와 모바일 접근이 쉽다.

## 추천 구조

```text
PC 로컬
  G:\03_개발작업공간\my-work-bench\data
    원본 자료, RAG 문서, 로컬 DB

Google Drive
  My Workbench/
    inbox/          모바일에서 넣은 원본 자료
    results/        웹앱에서 만든 결과
    prompts/        AI에게 물어볼 질문
    projects/       사업/정책/마케팅별 작업 폴더
```

## 개발 순서

1. React 웹앱을 Netlify에 배포한다.
2. 결과 복사와 다운로드 기능을 먼저 안정화한다.
3. Google Drive에 저장할 폴더 구조를 만든다.
4. Google Drive OAuth 로그인과 파일 저장 버튼을 붙인다.
5. PC CLI에서 Google Drive 자료를 로컬 `data/brain/00_raw`로 내려받는 동기화 명령을 만든다.

## 당장 사용할 방식

- PC: 로컬 폴더 저장을 기본으로 사용한다.
- 모바일: Netlify 웹앱에서 결과를 만들고 Google Drive 앱 또는 브라우저에 직접 저장한다.
- 중요한 원본 자료는 민감정보를 지운 뒤 외부 AI나 클라우드에 올린다.

## 나중에 자동화할 버튼

- `Google Drive에 저장`
- `내 Drive 자료 불러오기`
- `오늘 만든 결과 모아보기`
- `PC 로컬 저장소와 동기화`
