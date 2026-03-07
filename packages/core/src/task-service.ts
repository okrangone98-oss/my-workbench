import type {
  CreateTaskInput,
  DashboardActivity,
  DashboardSummary,
  DashboardTask,
} from "./task-domain.js";

export function newTaskId(now = Date.now()): string {
  return `task_${now}`;
}

export function nowIso(date = new Date()): string {
  return date.toISOString();
}

export function normalizeTaskProgress(value: unknown): number {
  return Number(value || 0);
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
    progress: normalizeTaskProgress(payload.progress),
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
    progress:
      patch.progress === undefined
        ? normalizeTaskProgress(existing.progress)
        : normalizeTaskProgress(patch.progress),
    updatedAt: nowIso(now),
  };
  if (next.title.length < 2) {
    throw new Error("title must be at least 2 characters");
  }
  return next;
}

export function buildTaskCreatedActivity(
  task: Pick<DashboardTask, "title" | "owner">,
  now = new Date(),
): Omit<DashboardActivity, "id"> {
  return {
    type: "task_created",
    message: `업무 등록: ${task.title}`,
    actor: task.owner || "unassigned",
    createdAt: nowIso(now),
  };
}

export function buildTaskUpdatedActivity(
  task: Pick<DashboardTask, "title" | "status" | "owner">,
  now = new Date(),
): Omit<DashboardActivity, "id"> {
  return {
    type: "task_updated",
    message: `업무 업데이트: ${task.title} (${task.status})`,
    actor: task.owner || "system",
    createdAt: nowIso(now),
  };
}

export function calculateDashboardSummary(
  tasks: DashboardTask[],
): DashboardSummary {
  if (tasks.length === 0) {
    return {
      totalTasks: 0,
      completed: 0,
      inProgress: 0,
      urgent: 0,
      averageProgress: 0,
    };
  }

  const completed = tasks.filter((task) => task.status === "completed").length;
  const inProgress = tasks.filter(
    (task) => task.status === "in-progress",
  ).length;
  const urgent = tasks.filter((task) => task.priority === "urgent").length;
  const progressSum = tasks.reduce(
    (sum, task) => sum + normalizeTaskProgress(task.progress),
    0,
  );

  return {
    totalTasks: tasks.length,
    completed,
    inProgress,
    urgent,
    averageProgress: Math.round(progressSum / tasks.length),
  };
}
