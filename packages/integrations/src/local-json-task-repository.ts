import fs from "node:fs";
import path from "node:path";
import {
  applyTaskPatch,
  normalizeCreateTaskInput,
  type CreateTaskInput,
  type DashboardActivity,
  type DashboardSummary,
  type DashboardTask,
} from "@my-work-bench/core";
import type { TaskRepository } from "./types.js";

interface LocalDbShape {
  tasks: DashboardTask[];
  activities: DashboardActivity[];
}

function nowIso(): string {
  return new Date().toISOString();
}

function emptyDb(): LocalDbShape {
  return { tasks: [], activities: [] };
}

export class LocalJsonTaskRepository implements TaskRepository {
  private readonly filePath: string;

  public constructor(filePath: string) {
    this.filePath = filePath;
  }

  public async listTasks(): Promise<DashboardTask[]> {
    return this.readDb().tasks;
  }

  public async getTaskById(taskId: string): Promise<DashboardTask | null> {
    const db = this.readDb();
    return db.tasks.find((task) => task.id === taskId) || null;
  }

  public async createTask(payload: CreateTaskInput): Promise<DashboardTask> {
    const db = this.readDb();
    const task = normalizeCreateTaskInput(payload);
    db.tasks.push(task);
    this.writeDb(db);
    return task;
  }

  public async updateTask(
    taskId: string,
    patch: Partial<DashboardTask>,
  ): Promise<DashboardTask | null> {
    const db = this.readDb();
    const index = db.tasks.findIndex((task) => task.id === taskId);
    if (index === -1) return null;
    db.tasks[index] = applyTaskPatch(db.tasks[index], patch);
    this.writeDb(db);
    return db.tasks[index];
  }

  public async getSummary(): Promise<DashboardSummary> {
    const tasks = this.readDb().tasks;
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
    const progressSum = tasks.reduce((sum, task) => sum + task.progress, 0);
    return {
      totalTasks: tasks.length,
      completed,
      inProgress,
      urgent,
      averageProgress: Math.round(progressSum / tasks.length),
    };
  }

  public async listActivities(limit = 10): Promise<DashboardActivity[]> {
    const activities = this.readDb().activities;
    return activities.slice(-limit).reverse();
  }

  public async appendActivity(
    payload: Omit<DashboardActivity, "id" | "createdAt">,
  ): Promise<void> {
    const db = this.readDb();
    db.activities.push({
      id: `activity_${Date.now()}_${Math.floor(Math.random() * 1000)}`,
      createdAt: nowIso(),
      ...payload,
    });
    this.writeDb(db);
  }

  private readDb(): LocalDbShape {
    if (!fs.existsSync(this.filePath)) {
      return emptyDb();
    }
    try {
      const text = fs.readFileSync(this.filePath, "utf8");
      const parsed = JSON.parse(text) as Partial<LocalDbShape>;
      return {
        tasks: Array.isArray(parsed.tasks) ? parsed.tasks : [],
        activities: Array.isArray(parsed.activities) ? parsed.activities : [],
      };
    } catch {
      return emptyDb();
    }
  }

  private writeDb(db: LocalDbShape): void {
    fs.mkdirSync(path.dirname(this.filePath), { recursive: true });
    fs.writeFileSync(this.filePath, JSON.stringify(db, null, 2), "utf8");
  }
}
