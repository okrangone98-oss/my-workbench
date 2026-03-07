import { listAgentNames } from "@my-work-bench/agents";
import { classifyProjectCandidate } from "@my-work-bench/core";

function main(): void {
  const projects = [
    classifyProjectCandidate("pslms", "empty-shell"),
    classifyProjectCandidate("코다리부장", "source-of-truth"),
  ];

  console.log("my-work-bench CLI bootstrap");
  console.log("");
  console.log("Agents:", listAgentNames().join(", "));
  console.log("Projects:");
  for (const project of projects) {
    console.log(`- ${project.name}: ${project.status}`);
  }
}

main();
