# 오늘의 업무 대시보드 Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 기존 AI 작업 화면을 보존하면서, 코딩 초보자가 프로그램을 열자마자 오늘의 미완료 업무를 확인하고 제목 하나로 새 업무를 등록할 수 있는 홈페이지형 대시보드를 추가한다.

**Architecture:** 업무 저장과 정렬·요약 규칙은 `apps/web/src/workbench-tasks.js`의 순수 함수로 분리하고 `localStorage`에 별도 키로 저장한다. React 화면은 `main.jsx`에서 업무 대시보드를 첫 화면으로 렌더링하고 기존 AI 워크플로 화면은 하위 작업 공간으로 유지한다. 스타일은 기존 `styles.css`에 대시보드 전용 클래스와 반응형 규칙을 추가한다.

**Tech Stack:** React 19, JSX, Vite, browser localStorage, Node built-in test runner, existing lucide-react icons.

## Global Constraints

- JIRA를 대체하지 않고 JIRA 링크만 저장한다.
- 첫 입력은 제목 하나로 제한하고 상세 필드는 수정 화면에서만 제공한다.
- 상태는 `todo`, `in_progress`, `blocked`, `done` 네 가지를 사용한다.
- 완료되지 않은 업무 전체를 기본으로 표시하고 완료 업무는 접어서 표시한다.
- 기존 사용자 데이터, 문서, AI 워크플로 화면을 삭제하거나 되돌리지 않는다.
- 첫 버전에는 실제 JIRA API, AI 자연어 업무 생성, Google Drive 동기화, 로그인, 알림을 추가하지 않는다.
- 웹 화면의 사용자 문구는 쉬운 한국어로 작성하고 아이콘만으로 기능을 설명하지 않는다.
- `npm run build:web`가 성공해야 한다.

## 파일 구조

- Create: `apps/web/src/workbench-tasks.js` — 업무 타입에 준하는 기본값, localStorage 입출력, 상태 변경, 정렬, 요약 순수 함수
- Create: `apps/web/src/workbench-tasks.test.js` — Node built-in test runner로 저장 데이터 정규화·정렬·요약·제목 검증 테스트
- Modify: `apps/web/package.json` — 웹 패키지의 순수 함수 테스트 명령 추가
- Modify: `apps/web/src/main.jsx` — 대시보드 상태, 이벤트 핸들러, 추가/수정 UI, 업무 카드와 기존 워크플로 화면 연결
- Modify: `apps/web/src/styles.css` — 홈페이지형 헤더, 요약 카드, 업무 카드, 모달/폼, 빈 상태, 반응형 레이아웃
- Modify: `README.md` — 초보자 관점의 웹 실행 방법과 대시보드 사용법 추가

### Task 1: 업무 저장·정렬·요약 모듈과 테스트

**Files:**
- Create: `apps/web/src/workbench-tasks.js`
- Create: `apps/web/src/workbench-tasks.test.js`
- Modify: `apps/web/package.json`

**Interfaces:**
- `TASK_STORAGE_KEY = "my-workbench:daily-tasks"`
- `createTask(title, now = new Date()) -> WorkbenchTask`
- `normalizeTask(value) -> WorkbenchTask | null`
- `readTasks(storage = window.localStorage) -> WorkbenchTask[]`
- `writeTasks(tasks, storage = window.localStorage) -> void`
- `updateTask(tasks, taskId, patch, now = new Date()) -> WorkbenchTask[]`
- `deleteTask(tasks, taskId) -> WorkbenchTask[]`
- `sortActiveTasks(tasks, now = new Date()) -> WorkbenchTask[]`
- `summarizeTasks(tasks) -> { todo, inProgress, blocked, done, active }`

**Work item shape:**

```js
{
  id: "task-<timestamp>",
  title: "JIRA 로그인 오류 이슈 확인",
  status: "todo",
  priority: "normal",
  deadline: "",
  projectName: "",
  jiraUrl: "",
  note: "",
  progress: 0,
  createdAt: "2026-07-11T00:00:00.000Z",
  updatedAt: "2026-07-11T00:00:00.000Z"
}
```

- [ ] **Step 1: 테스트 명령을 추가한다.**

  In `apps/web/package.json`, add:

  ```json
  "test": "node --test src/workbench-tasks.test.js"
  ```

- [ ] **Step 2: 실패 테스트를 작성한다.**

  In `apps/web/src/workbench-tasks.test.js`, cover these exact cases:

  ```js
  import assert from "node:assert/strict";
  import test from "node:test";
  import { createTask, sortActiveTasks, summarizeTasks, updateTask } from "./workbench-tasks.js";

  test("title-only creation uses beginner-friendly defaults", () => {
    const task = createTask("  JIRA 이슈 확인  ", new Date("2026-07-11T09:00:00.000Z"));
    assert.equal(task.title, "JIRA 이슈 확인");
    assert.equal(task.status, "todo");
    assert.equal(task.priority, "normal");
    assert.equal(task.deadline, "");
  });

  test("short or empty titles are rejected", () => {
    assert.throws(() => createTask(" "), /할 일 제목/);
    assert.throws(() => createTask("가"), /할 일 제목/);
  });

  test("summary counts each status", () => {
    const tasks = [
      createTask("하나"),
      updateTask([createTask("둘")], "task-ignored", {}).at(0),
    ].filter(Boolean);
    tasks[1] = { ...tasks[1], status: "blocked" };
    const summary = summarizeTasks(tasks);
    assert.equal(summary.todo, 1);
    assert.equal(summary.blocked, 1);
    assert.equal(summary.active, 2);
  });

  test("overdue and blocked active work comes before ordinary recent work", () => {
    const now = new Date("2026-07-11T09:00:00.000Z");
    const ordinary = { ...createTask("새 업무", new Date("2026-07-11T08:00:00.000Z")), id: "ordinary" };
    const overdue = { ...createTask("지난 업무", new Date("2026-07-01T08:00:00.000Z")), id: "overdue", deadline: "2026-07-10", priority: "high" };
    const blocked = { ...createTask("막힌 업무", new Date("2026-07-02T08:00:00.000Z")), id: "blocked", status: "blocked" };
    assert.deepEqual(sortActiveTasks([ordinary, overdue, blocked], now).map((task) => task.id), ["overdue", "blocked", "ordinary"]);
  });
  ```

  Use a small fixed `now` value in every ordering assertion so the test does not depend on the machine clock.

- [ ] **Step 3: 테스트가 예상대로 실패하는지 확인한다.**

  Run: `npm test --workspace @my-work-bench/web`

  Expected: FAIL because `workbench-tasks.js` does not yet export the required functions.

- [ ] **Step 4: 최소 구현을 작성한다.**

  Implement `WorkbenchTask` defaults, title trimming, a two-character minimum, safe JSON parsing, immutable update/delete helpers, and active sorting in `workbench-tasks.js`. Sort active tasks in this order: overdue deadline, `blocked`, `high` priority, oldest `createdAt`; preserve `done` tasks only for summary and completed rendering. Use `storage.getItem`/`storage.setItem` so the module can be tested with a fake storage object.

- [ ] **Step 5: 테스트와 빌드를 통과시킨다.**

  Run: `npm test --workspace @my-work-bench/web`

  Expected: all task-module tests PASS.

  Run: `npm run build:web`

  Expected: Vite build completes successfully.

- [ ] **Step 6: 커밋한다.**

  ```bash
  git add apps/web/package.json apps/web/src/workbench-tasks.js apps/web/src/workbench-tasks.test.js
  git commit -m "Add workbench task storage helpers"
  ```

### Task 2: 홈페이지형 대시보드 화면과 업무 동작

**Files:**
- Modify: `apps/web/src/main.jsx`

**Interfaces:**
- Import the Task 1 functions from `./workbench-tasks.js`.
- Maintain `tasks`, `isTaskFormOpen`, `editingTaskId`, `showCompleted`, `selectedStatus`, and `taskForm` state inside `App`.
- Add handlers `handleCreateTask`, `handleUpdateTask`, `handleDeleteTask`, `handleStatusChange`, and `openTaskEditor` that update React state and call `writeTasks`.

- [ ] **Step 1: Add dashboard state and load tasks.**

  Initialize tasks with `readTasks()` inside the existing `App` component. Use a lazy `useState` initializer so localStorage is read only on initial render. Keep the existing project state and AI workflow state intact.

- [ ] **Step 2: Add quick-add behavior.**

  Add a title-only form with `type="text"`, a Korean placeholder such as `예: 오늘 확인할 일을 적어보세요`, and a submit button labeled `추가하기`. On submit, call `createTask`, prepend the new task, persist with `writeTasks`, close the form, and reset the input. If the title is empty or too short, show the exact message `할 일 제목을 적어주세요.` without throwing an uncaught error.

- [ ] **Step 3: Add task status and detail handlers.**

  Use immutable updates through `updateTask`. The status buttons must map to Korean labels:

  ```js
  const statusLabels = {
    todo: "해야 할 일",
    in_progress: "하고 있는 일",
    blocked: "막힌 일",
    done: "완료",
  };
  ```

  The editor must expose title, status, deadline, priority, project name, JIRA URL, and note. Save through `updateTask`; cancel must leave the original task unchanged. Delete must require `window.confirm("이 할 일을 삭제할까요?")` before persistence.

- [ ] **Step 4: Render the dashboard before the existing AI workspace.**

  Add a top-level `workbench-home` section immediately inside the main work area. Render:

  - header with `오늘의 업무`, current Korean date, and `할 일 추가` button;
  - four summary cards for todo, in-progress, blocked, and done;
  - active tasks sorted by `sortActiveTasks`;
  - empty state with `첫 할 일 추가하기` when no active tasks exist;
  - collapsed completed section controlled by `showCompleted`;
  - a compact link on task cards when `jiraUrl` exists.

  Preserve the existing project vault, workflow map, input panel, result panel, and their handlers below the dashboard. Add a small text link or section label that makes it clear the AI workflows remain available as the next workspace area.

- [ ] **Step 5: Run the web build and inspect the rendered structure.**

  Run: `npm run build:web`

  Expected: build succeeds with no JSX or import errors.

  Run: `npm run dev:web`

  Then verify manually in the browser: an empty state appears on first load, a title-only task can be added, refresh preserves it, each status changes the summary count, the editor saves a JIRA URL, and delete requires confirmation.

- [ ] **Step 6: Commit the dashboard behavior.**

  ```bash
  git add apps/web/src/main.jsx
  git commit -m "Add today workbench dashboard interactions"
  ```

### Task 3: Homepage visual design and responsive layout

**Files:**
- Modify: `apps/web/src/styles.css`

**Interfaces:**
- Add styles under dedicated `.workbench-home`, `.workbench-summary`, `.workbench-task-card`, `.workbench-task-form`, and `.workbench-completed` namespaces so existing AI workflow styles are not unintentionally changed.

- [ ] **Step 1: Add desktop visual hierarchy.**

  Style the dashboard with a soft page background, wide centered content, rounded cards, one strong accent color for `할 일 추가`, readable dark text, and status-colored badges that also include text. Make the first viewport show the header, summary cards, and the beginning of the task list without requiring horizontal scrolling.

- [ ] **Step 2: Add task interaction states.**

  Provide visible hover/focus states, keyboard focus outlines, disabled submit styling, compact action buttons, and a clear blocked status treatment. Ensure text and icon buttons have at least a comfortable click target and are not distinguished by color alone.

- [ ] **Step 3: Add responsive rules.**

  At the existing 960px breakpoint, move summary cards to a flexible 2-column grid and stack dashboard content. At the existing 620px breakpoint, use one-column cards, full-width quick-add form controls, wrap action buttons, and keep JIRA links readable without overflow.

- [ ] **Step 4: Run the build and browser visual check.**

  Run: `npm run build:web`

  Expected: build succeeds.

  In the browser, check desktop and narrow mobile viewport widths. Confirm that the main CTA is visually obvious, cards do not overlap, status text remains readable, and the existing AI workspace remains usable below the dashboard.

- [ ] **Step 5: Commit the visual layer.**

  ```bash
  git add apps/web/src/styles.css
  git commit -m "Style today workbench dashboard homepage"
  ```

### Task 4: Beginner documentation and final verification

**Files:**
- Modify: `README.md`

- [ ] **Step 1: Document the beginner quick start.**

  Add a short section explaining `npm install`, `npm run dev:web`, opening the local URL, adding a task by title, changing its status, and optionally attaching a JIRA link. State clearly that first-version data is stored in the browser and is not yet synchronized with JIRA.

- [ ] **Step 2: Run focused tests.**

  Run: `npm test --workspace @my-work-bench/web`

  Expected: all task helper tests PASS.

- [ ] **Step 3: Run the web build.**

  Run: `npm run build:web`

  Expected: Vite build completes successfully.

- [ ] **Step 4: Run the repository lint command.**

  Run: `npm run lint`

  Expected: the command completes without introducing new lint errors. If an existing workspace has no lint script, record that outcome rather than adding an unrelated lint setup.

- [ ] **Step 5: Run the final manual acceptance checklist.**

  Verify all of the following in a fresh browser session:

  1. The page opens with the homepage-style `오늘의 업무` dashboard.
  2. `할 일 추가` is easy to find and accepts a title-only task.
  3. Empty and too-short titles show a Korean validation message.
  4. Refresh preserves tasks through localStorage.
  5. Summary cards count todo, in-progress, blocked, and done tasks correctly.
  6. Active tasks remain visible; completed tasks are collapsed by default.
  7. Edit saves project name, priority, deadline, note, and JIRA URL.
  8. JIRA links open in a new browser tab and do not require API credentials.
  9. Delete asks for confirmation.
  10. Desktop and mobile layouts remain usable.
  11. Existing AI workflows still render and remain selectable.

- [ ] **Step 6: Commit documentation and final verification notes.**

  ```bash
  git add README.md
  git commit -m "Document beginner workbench dashboard usage"
  ```

