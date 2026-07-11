import assert from "node:assert/strict";
import test from "node:test";
import {
  createTask,
  sortActiveTasks,
  summarizeTasks,
  updateTask,
} from "./workbench-tasks.js";

test("title-only creation uses beginner-friendly defaults", () => {
  const task = createTask(
    "  JIRA 이슈 확인  ",
    new Date("2026-07-11T09:00:00.000Z"),
  );
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
  const first = createTask("하나");
  const second = updateTask([createTask("둘째")], "task-ignored", {})[0];
  const tasks = [first, { ...second, status: "blocked" }];
  const summary = summarizeTasks(tasks);
  assert.equal(summary.todo, 1);
  assert.equal(summary.blocked, 1);
  assert.equal(summary.active, 2);
});

test("overdue and blocked active work comes before ordinary recent work", () => {
  const now = new Date("2026-07-11T09:00:00.000Z");
  const ordinary = {
    ...createTask("새 업무", new Date("2026-07-11T08:00:00.000Z")),
    id: "ordinary",
  };
  const overdue = {
    ...createTask("지난 업무", new Date("2026-07-01T08:00:00.000Z")),
    id: "overdue",
    deadline: "2026-07-10",
    priority: "high",
  };
  const blocked = {
    ...createTask("막힌 업무", new Date("2026-07-02T08:00:00.000Z")),
    id: "blocked",
    status: "blocked",
  };
  assert.deepEqual(
    sortActiveTasks([ordinary, overdue, blocked], now).map((task) => task.id),
    ["overdue", "blocked", "ordinary"],
  );
});
