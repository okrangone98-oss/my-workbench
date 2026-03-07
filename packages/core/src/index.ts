export type ProjectCandidateStatus =
  | "source-of-truth"
  | "empty-shell"
  | "hold"
  | "archive";

export interface ProjectCandidate {
  name: string;
  status: ProjectCandidateStatus;
}

export function classifyProjectCandidate(
  name: string,
  status: ProjectCandidateStatus,
): ProjectCandidate {
  return { name, status };
}

export const ASSET_STATES = [
  "KEEP",
  "MERGE",
  "MOVE",
  "ARCHIVE",
  "DELETE_CANDIDATE",
] as const;

export type AssetState = (typeof ASSET_STATES)[number];

export function isAssetState(value: string): value is AssetState {
  return (ASSET_STATES as readonly string[]).includes(value);
}

export * from "./task-domain.js";
export * from "./task-service.js";
export * from "./task-usecases.js";
