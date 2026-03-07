# 코다리부장 코어 추출 진행상황 (2026-03-08)

## 이번 단계

- `server.js`의 task 생성/수정 입력 규칙을 `packages/core`로 정리
- `localStore.js`의 활동 로그 메시지 규칙을 `packages/core`로 정리
- 대시보드 요약 계산을 `packages/core`로 정리
- 로컬 CLI에서 `task:dashboard`로 요약/활동 조회 가능하게 연결

## 추출된 공통 로직

- `normalizeCreateTaskInput`
- `applyTaskPatch`
- `buildTaskCreatedActivity`
- `buildTaskUpdatedActivity`
- `calculateDashboardSummary`
- `createTaskWithActivity`
- `updateTaskWithActivity`
- `getDashboardSnapshot`

## 다음 이관 대상

1. `backend/src/server.js`의 `/api/tasks`, `/api/tasks/:taskId`, `/api/dashboard/summary`
2. `backend/src/googleSheets.js`의 row 매핑 규칙
3. `src/core/services/DashboardService.ts`의 DTO를 `packages/core` 타입으로 치환

## 판단

- 저장소(`integrations`)는 데이터 입출력만 담당
- 활동 로그와 요약 계산은 `core` 유스케이스에서 담당
- 이 방향이 맞아야 이후 CLI, 로컬 앱, 웹앱이 같은 규칙을 공유할 수 있음
