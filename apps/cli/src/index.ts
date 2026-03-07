import { listAgentNames } from "@my-work-bench/agents";
import {
  classifyProjectCandidate,
  isAssetState,
  type ProjectCandidateStatus,
} from "@my-work-bench/core";

const PROJECT_STATES: ProjectCandidateStatus[] = [
  "source-of-truth",
  "empty-shell",
  "hold",
  "archive",
];

function printHelp(): void {
  console.log("Usage:");
  console.log("  npm run dev:cli");
  console.log("  npm run dev:cli -- classify project <name> <status>");
  console.log("  npm run dev:cli -- classify asset <name> <state>");
  console.log("");
  console.log("Project status:", PROJECT_STATES.join(", "));
  console.log("Asset state: KEEP, MERGE, MOVE, ARCHIVE, DELETE_CANDIDATE");
}

function runDefault(): void {
  const projects = [
    classifyProjectCandidate("pslms", "empty-shell"),
    classifyProjectCandidate("kodari-manager", "source-of-truth"),
  ];

  console.log("my-work-bench CLI bootstrap");
  console.log("");
  console.log("Agents:", listAgentNames().join(", "));
  console.log("Projects:");
  for (const project of projects) {
    console.log(`- ${project.name}: ${project.status}`);
  }
}

function runClassify(args: string[]): void {
  const [target, name, value] = args;
  if (!target || !name || !value) {
    printHelp();
    return;
  }

  if (target === "project") {
    if (!PROJECT_STATES.includes(value as ProjectCandidateStatus)) {
      console.error(`Invalid project status: ${value}`);
      printHelp();
      process.exitCode = 1;
      return;
    }
    const project = classifyProjectCandidate(name, value as ProjectCandidateStatus);
    console.log(JSON.stringify(project, null, 2));
    return;
  }

  if (target === "asset") {
    if (!isAssetState(value)) {
      console.error(`Invalid asset state: ${value}`);
      printHelp();
      process.exitCode = 1;
      return;
    }
    console.log(
      JSON.stringify(
        {
          name,
          state: value,
        },
        null,
        2,
      ),
    );
    return;
  }

  printHelp();
  process.exitCode = 1;
}

function main(): void {
  const [, , command, ...args] = process.argv;
  if (!command) {
    runDefault();
    return;
  }

  if (command === "classify") {
    runClassify(args);
    return;
  }

  printHelp();
  process.exitCode = 1;
}

main();
