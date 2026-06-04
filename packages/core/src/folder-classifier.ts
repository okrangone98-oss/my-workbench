import type { AssetState } from "./index.js";

export interface FolderClassification {
  suggestedState: AssetState;
  suggestedBucket:
    | "active-project"
    | "review-candidate"
    | "long-term-archive"
    | "do-not-touch";
  reason: string;
}

function includesAny(name: string, patterns: string[]): boolean {
  return patterns.some((pattern) => name.includes(pattern));
}

export function classifyFolderByName(name: string): FolderClassification {
  const lower = name.toLowerCase();

  if (
    includesAny(lower, ["tmp", "cache", "huggingfacecache", "temp", "임시"])
  ) {
    return {
      suggestedState: "MOVE",
      suggestedBucket: "review-candidate",
      reason: "cache_or_temp_folder",
    };
  }

  if (
    includesAny(lower, ["migrated", "wondershare", "archive", "이관", "보관"])
  ) {
    return {
      suggestedState: "ARCHIVE",
      suggestedBucket: "long-term-archive",
      reason: "legacy_or_migrated_data",
    };
  }

  if (
    includesAny(lower, [
      "my-work-bench",
      "ai",
      "antigravity",
      "yangyang-corp_25",
      "userfolders",
      "개발_202602",
      "진행중프로젝트",
      "양양군",
      "개인자료",
      "docker_data",
      "photoshop 2020",
    ])
  ) {
    return {
      suggestedState: "KEEP",
      suggestedBucket: "active-project",
      reason: "active_project_workspace",
    };
  }

  if (
    includesAny(lower, [
      "npki",
      "과거자료",
      "장기보관자료",
      "정리운영로그",
      "최근3개월검토",
    ])
  ) {
    return {
      suggestedState: "ARCHIVE",
      suggestedBucket: "do-not-touch",
      reason: "sensitive_or_historical_data",
    };
  }

  return {
    suggestedState: "KEEP",
    suggestedBucket: "active-project",
    reason: "default_keep_pending_manual_review",
  };
}
