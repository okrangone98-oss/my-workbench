const AGENT_NAMES = [
  "asset-classifier",
  "project-consolidator",
  "company-ops-assistant",
  "personal-ops-assistant",
  "document-standardizer",
] as const;

export function listAgentNames(): readonly string[] {
  return AGENT_NAMES;
}
