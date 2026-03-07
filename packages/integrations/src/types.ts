import type {
  CreateTaskInput,
  DashboardActivity,
  DashboardSummary,
  DashboardTask,
} from "@my-work-bench/core";

export interface TaskRepository {
  listTasks(): Promise<DashboardTask[]>;
  getTaskById(taskId: string): Promise<DashboardTask | null>;
  createTask(payload: CreateTaskInput): Promise<DashboardTask>;
  updateTask(
    taskId: string,
    patch: Partial<DashboardTask>,
  ): Promise<DashboardTask | null>;
  getSummary(): Promise<DashboardSummary>;
  listActivities(limit?: number): Promise<DashboardActivity[]>;
  appendActivity(
    payload: Omit<DashboardActivity, "id" | "createdAt">,
  ): Promise<void>;
}

export interface UploadFileInput {
  originalName: string;
  mimeType: string;
  buffer: Uint8Array;
}

export interface UploadResult {
  fileName: string;
  publicUrl: string;
}

export interface FileStorageGateway {
  uploadFile(input: UploadFileInput): Promise<UploadResult>;
}
