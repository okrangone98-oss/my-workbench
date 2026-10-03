export const TASK_STORAGE_KEY = "my-workbench:daily-tasks";

const VALID_STATUSES = new Set(["todo", "in_progress", "blocked", "done"]);
const VALID_PRIORITIES = new Set(["low", "normal", "high"]);

function storageOrDefault(storage) {
  if (storage) return storage;
  if (typeof window !== "undefined" && window.localStorage) {
    return window.localStorage;
  }
  return null;
}

function isoNow(date) {
  return date.toISOString();
}

function taskId(date) {
  return `task-${date.getTime()}-${Math.random().toString(36).slice(2, 8)}`;
}

function cleanTitle(title) {
  const value = String(title ?? "").trim();
  if (value.length < 2) {
    throw new Error("할 일 제목을 적어주세요.");
  }
  return value;
}

function defaultTaskFields() {
  return {
    status: "todo",
    priority: "normal",
    deadline: "",
    projectName: "",
    jiraUrl: "",
    note: "",
    progress: 0,
  };
}

export function createTask(title, now = new Date()) {
  const createdAt = isoNow(now);
  return {
    id: taskId(now),
    title: cleanTitle(title),
    ...defaultTaskFields(),
    createdAt,
    updatedAt: createdAt,
  };
}

export function normalizeTask(value) {
  if (!value || typeof value !== "object") return null;
  try {
    const title = cleanTitle(value.title);
    const status = VALID_STATUSES.has(value.status) ? value.status : "todo";
    const priority = VALID_PRIORITIES.has(value.priority) ? value.priority : "normal";
    return {
      id: String(value.id || `task-${Date.now()}`),
      title,
      status,
      priority,
      deadline: String(value.deadline || ""),
      projectName: String(value.projectName || ""),
      jiraUrl: String(value.jiraUrl || ""),
      note: String(value.note || ""),
      progress: Number.isFinite(Number(value.progress)) ? Number(value.progress) : 0,
      createdAt: String(value.createdAt || new Date().toISOString()),
      updatedAt: String(value.updatedAt || value.createdAt || new Date().toISOString()),
    };
  } catch {
    return null;
  }
}

export function readTasks(storage) {
  const target = storageOrDefault(storage);
  if (!target) return [];
  try {
    const parsed = JSON.parse(target.getItem(TASK_STORAGE_KEY) || "[]");
    return Array.isArray(parsed) ? parsed.map(normalizeTask).filter(Boolean) : [];
  } catch {
    return [];
  }
}

export function writeTasks(tasks, storage) {
  const target = storageOrDefault(storage);
  if (!target) return;
  target.setItem(TASK_STORAGE_KEY, JSON.stringify(tasks.map(normalizeTask).filter(Boolean)));
}

export function updateTask(tasks, taskIdValue, patch, now = new Date()) {
  return tasks.map((task) => {
    if (task.id !== taskIdValue) return task;
    const next = { ...task, ...patch };
    return {
      ...next,
      title: cleanTitle(next.title),
      status: VALID_STATUSES.has(next.status) ? next.status : task.status,
      priority: VALID_PRIORITIES.has(next.priority) ? next.priority : task.priority,
      updatedAt: isoNow(now),
    };
  });
}

export function deleteTask(tasks, taskIdValue) {
  return tasks.filter((task) => task.id !== taskIdValue);
}

function isOverdue(task, today) {
  return Boolean(task.deadline) && task.deadline < today;
}

export function sortActiveTasks(tasks, now = new Date()) {
  const today = now.toISOString().slice(0, 10);
  return tasks
    .filter((task) => task.status !== "done")
    .map((task, index) => ({ task, index }))
    .sort((left, right) => {
      const a = left.task;
      const b = right.task;
      const overdueDifference = Number(isOverdue(b, today)) - Number(isOverdue(a, today));
      if (overdueDifference) return overdueDifference;
      const blockedDifference = Number(b.status === "blocked") - Number(a.status === "blocked");
      if (blockedDifference) return blockedDifference;
      const priorityDifference = Number(b.priority === "high") - Number(a.priority === "high");
      if (priorityDifference) return priorityDifference;
      const createdDifference = String(a.createdAt).localeCompare(String(b.createdAt));
      return createdDifference || left.index - right.index;
    })
    .map(({ task }) => task);
}

export function summarizeTasks(tasks) {
  const todo = tasks.filter((task) => task.status === "todo").length;
  const inProgress = tasks.filter((task) => task.status === "in_progress").length;
  const blocked = tasks.filter((task) => task.status === "blocked").length;
  const done = tasks.filter((task) => task.status === "done").length;
  return { todo, inProgress, blocked, done, active: todo + inProgress + blocked };
}
