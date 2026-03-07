import type {
  CreateTaskInput,
  DashboardActivity,
  DashboardSummary,
  DashboardTask,
} from "./task-domain.js";
import {
  buildTaskCreatedActivity,
  buildTaskUpdatedActivity,
  calculateDashboardSummary,
  normalizeCreateTaskInput,
} from "./task-service.js";

export interface TaskRepositoryLike {
  createTask(payload: CreateTaskInput): Promise<DashboardTask>;
  listTasks(): Promise<DashboardTask[]>;
}

export interface DashboardRepositoryLike extends TaskRepositoryLike {
  updateTask(
    taskId: string,
    patch: Partial<DashboardTask>,
  ): Promise<DashboardTask | null>;
  listActivities(limit?: number): Promise<DashboardActivity[]>;
  appendActivity(
    payload: Omit<DashboardActivity, "id" | "createdAt">,
  ): Promise<void>;
}

export async function createTask(
  repository: TaskRepositoryLike,
  payload: CreateTaskInput,
): Promise<DashboardTask> {
  const normalized = normalizeCreateTaskInput(payload);
  return repository.createTask(normalized);
}

export async function createTaskWithActivity(
  repository: DashboardRepositoryLike,
  payload: CreateTaskInput,
): Promise<DashboardTask> {
  const task = await createTask(repository, payload);
  const activity = buildTaskCreatedActivity(task);
  await repository.appendActivity(activity);
  return task;
}

export async function updateTaskWithActivity(
  repository: DashboardRepositoryLike,
  taskId: string,
  patch: Partial<DashboardTask>,
): Promise<DashboardTask | null> {
  const task = await repository.updateTask(taskId, patch);
  if (!task) {
    return null;
  }
  const activity = buildTaskUpdatedActivity(task);
  await repository.appendActivity(activity);
  return task;
}

export async function listRecentTasks(
  repository: TaskRepositoryLike,
  limit = 20,
): Promise<DashboardTask[]> {
  const all = await repository.listTasks();
  return all.slice(-limit).reverse();
}

export async function getDashboardSnapshot(
  repository: DashboardRepositoryLike,
  activityLimit = 10,
): Promise<{ summary: DashboardSummary; activities: DashboardActivity[] }> {
  const [tasks, activities] = await Promise.all([
    repository.listTasks(),
    repository.listActivities(activityLimit),
  ]);

  return {
    summary: calculateDashboardSummary(tasks),
    activities,
  };
}
