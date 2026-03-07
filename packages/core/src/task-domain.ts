export type TaskStatus = "completed" | "in-progress" | "pending";
export type TaskPriority = "normal" | "urgent";

export interface DashboardTask {
  id: string;
  title: string;
  owner: string;
  status: TaskStatus;
  progress: number;
  deadline: string;
  priority: TaskPriority;
  description?: string;
  department?: string;
  detailJson?: string;
  attachmentUrl?: string;
  createdAt?: string;
  updatedAt?: string;
}

export interface DashboardSummary {
  totalTasks: number;
  completed: number;
  inProgress: number;
  urgent: number;
  averageProgress: number;
}

export interface DashboardActivity {
  id: string;
  type: string;
  message: string;
  actor: string;
  createdAt: string;
}

export type DashboardActivityType =
  | "task_created"
  | "task_updated"
  | "file_uploaded"
  | "system";

export interface SystemStatus {
  dataSource: string;
  firebaseEnabled: boolean;
  warnings: string[];
}

export type CreateTaskInput = Partial<DashboardTask> & { title: string };

export function validateTaskTitle(input: CreateTaskInput): string | null {
  const title = String(input.title ?? "").trim();
  if (title.length < 2) {
    return "title must be at least 2 characters";
  }
  return null;
}
