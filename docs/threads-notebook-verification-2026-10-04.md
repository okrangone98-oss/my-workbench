# AI 소식 실험 노트 검증

## 확인한 결과

- Node 테스트 21개 통과: 기록 복원, 손상된 원본 보존, 잘못된 백업·중복 번호 거부, 최신 기록 병합, 안전한 URL, 원문 없는 요청 거부, AI 출처·인용 검증, 무료 가격 확인, 유료 전환·자동 재시도 없음, PKCE S256·state·키 비저장. 공급자가 콜백 URL에 code만 추가하는 로그인 왕복 검증 포함.
- `VITE_BASE_PATH=/my-workbench/ npm run build` 전체 워크스페이스 빌드 성공. 이후 PDF 정리 메서드와 화면 스타일 수정은 같은 경로의 `npm run build:web`로 다시 검증.
- `npm run lint` 완료. 현재 워크스페이스에는 별도 린트 스크립트가 없어 정적 린트 분석을 수행한 것은 아님.
- 별도 Windows Chromium의 새 브라우저 세션에서 Pages 하위 경로 자산, TXT와 PDF 읽기, 미지원 파일 거부, 기록 추가·수정·새로고침 복원, 완료 전 결과 입력, JSON 백업·중복 없이 병합 복원, AI 추천으로 실험 준비, 무료 한도 오류, 가격 변경 시 중단, 키 비저장, 390px 모바일 가로 넘침 없음, 기존 업무 추가를 실제 실행.
- 공개 OpenRouter 모델 목록에서 `openrouter/free` 입력·출력 가격 0을 확인.
- GitHub Pages를 GitHub Actions 방식으로 활성화.
- 보안 수정판 pdfjs-dist 6.3.289, postcss 8.5.28, nanoid 3.3.19, tsx 4.23.15, esbuild 0.28.2를 기존 허용 버전 범위 안에서 반영. `npm audit`에서 발견된 취약점 0개.
- 수정판으로 Pages 경로의 전체 빌드와 린트 명령을 다시 완료. 로컬 격리 브라우저 검증을 다시 통과했으며 기존 업무 도구의 PDF 읽기도 추가 확인. 실제 배포 사이트도 같은 흐름으로 확인한다.

PDF 보안 권고: [PDF.js 공식 GitHub 권고](https://github.com/mozilla/pdf.js/security/advisories/GHSA-hq66-cqwq-w95j). 로그인 콜백 방식: [OpenRouter 공식 안내](https://openrouter.ai/announcements/privacy-clarity-new-providers-oauth-upgrade-and-gemini-gets-parallel-tools).

## 검증의 범위

AI 응답과 오류는 브라우저 네트워크 모의 응답으로 확인했다. 실제 개인 OpenRouter 로그인·권한 승인과 모델의 실제 추론은 사용자의 계정 연결 후 확인해야 한다. GPT 모델을 무료로 제공한다고 주장하지 않고, 실제 라우팅된 무료 모델명을 표시한다.

기존 사용자 브라우저 데이터를 사용하지 않고 격리된 테스트 기록만 만들었다. PDF 라이브러리 최신 버전은 문서 proxy 대신 loading task의 `destroy()`를 사용해야 하며, 실제 PDF 흐름에서 발견한 오류를 수정하고 재검증했다.
