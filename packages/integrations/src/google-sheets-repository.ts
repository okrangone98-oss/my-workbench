import type {
  CreateTaskInput,
  DashboardActivity,
  DashboardSummary,
  DashboardTask,
} from "@my-work-bench/core";
import type { TaskRepository } from "./types.js";

export class GoogleSheetsRepository implements TaskRepository {
  public async listTasks(): Promise<DashboardTask[]> {
    return [];
  }

  public async getTaskById(_taskId: string): Promise<DashboardTask | null> {
    return null;
  }

  public async createTask(payload: CreateTaskInput): Promise<DashboardTask> {
    const now = new Date().toISOString();
    return {
      id: `task_${Date.now()}`,
      owner: "unassigned",
      status: "pending",
      progress: 0,
      deadline: "",
      priority: "normal",
      ...payload,
      title: payload.title.trim(),
      createdAt: now,
      updatedAt: now,
    };
  }

  public async updateTask(
    _taskId: string,
    _patch: Partial<DashboardTask>,
  ): Promise<DashboardTask | null> {
    return null;
  }

  public async getSummary(): Promise<DashboardSummary> {
    return {
      totalTasks: 0,
      completed: 0,
      inProgress: 0,
      urgent: 0,
      averageProgress: 0,
    };
  }

  public async listActivities(_limit = 10): Promise<DashboardActivity[]> {
    return [];
  }

  public async appendActivity(
    _payload: Omit<DashboardActivity, "id" | "createdAt">,
  ): Promise<void> {
    return;
  }
}
