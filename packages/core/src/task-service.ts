import type { CreateTaskInput, DashboardTask } from "./task-domain.js";

export function newTaskId(now = Date.now()): string {
  return `task_${now}`;
}

export function nowIso(date = new Date()): string {
  return date.toISOString();
}

export function normalizeCreateTaskInput(
  payload: CreateTaskInput,
  now = new Date(),
): DashboardTask {
  const title = String(payload.title ?? "").trim();
  if (title.length < 2) {
    throw new Error("title must be at least 2 characters");
  }

  const nowText = nowIso(now);
  return {
    id: payload.id || newTaskId(now.getTime()),
    title,
    owner: payload.owner || "unassigned",
    status: payload.status || "pending",
    progress: Number(payload.progress || 0),
    deadline: payload.deadline || "",
    priority: payload.priority || "normal",
    description: payload.description || "",
    department: payload.department || "",
    detailJson: payload.detailJson || "",
    attachmentUrl: payload.attachmentUrl || "",
    createdAt: payload.createdAt || nowText,
    updatedAt: nowText,
  };
}

export function applyTaskPatch(
  existing: DashboardTask,
  patch: Partial<DashboardTask>,
  now = new Date(),
): DashboardTask {
  const next: DashboardTask = {
    ...existing,
    ...patch,
    title: patch.title ? patch.title.trim() : existing.title,
    updatedAt: nowIso(now),
  };
  if (next.title.length < 2) {
    throw new Error("title must be at least 2 characters");
  }
  return next;
}
