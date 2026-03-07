import type { CreateTaskInput, DashboardTask } from "./task-domain.js";
import { normalizeCreateTaskInput } from "./task-service.js";

export interface TaskRepositoryLike {
  createTask(payload: CreateTaskInput): Promise<DashboardTask>;
  listTasks(): Promise<DashboardTask[]>;
}

export async function createTask(
  repository: TaskRepositoryLike,
  payload: CreateTaskInput,
): Promise<DashboardTask> {
  const normalized = normalizeCreateTaskInput(payload);
  return repository.createTask(normalized);
}

export async function listRecentTasks(
  repository: TaskRepositoryLike,
  limit = 20,
): Promise<DashboardTask[]> {
  const all = await repository.listTasks();
  return all.slice(-limit).reverse();
}
