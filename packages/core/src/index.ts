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
