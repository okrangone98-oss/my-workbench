export interface SkillDefinition {
  name: string;
  purpose: string;
}

export const baseSkills: SkillDefinition[] = [
  {
    name: "asset-classifier",
    purpose: "Classify local and work assets into operational states.",
  },
  {
    name: "project-consolidator",
    purpose: "Identify overlap and propose a single source-of-truth project.",
  },
];
