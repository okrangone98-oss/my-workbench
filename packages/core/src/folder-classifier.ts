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
  return patterns.some((p) => name.includes(p));
}

export function classifyFolderByName(name: string): FolderClassification {
  const lower = name.toLowerCase();

  if (includesAny(lower, ["tmp", "cache", "huggingfacecache"])) {
    return {
      suggestedState: "MOVE",
      suggestedBucket: "review-candidate",
      reason: "cache_or_temp_folder",
    };
  }

  if (includesAny(lower, ["migrated", "wondershare", "archive"])) {
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
    ]) || lower.includes("개발_")
  ) {
    return {
      suggestedState: "KEEP",
      suggestedBucket: "active-project",
      reason: "active_project_workspace",
    };
  }

  if (
    includesAny(lower, ["npki"]) ||
    lower.includes("과거자료") ||
    lower.includes("장기보관자료")
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
