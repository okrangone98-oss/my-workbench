export interface BusinessAutomationDiagnosisInput {
  businessName: string;
  createdAt?: string;
}

export interface BusinessAutomationOpportunity {
  area: string;
  painPoint: string;
  automation: string;
  offer: string;
  priority: "high" | "medium" | "low";
}

export interface BusinessAutomationDiagnosis {
  businessName: string;
  createdAt: string;
  positioning: string;
  opportunities: BusinessAutomationOpportunity[];
  ninetyDayPlan: string[];
  avoid: string[];
}

export function createBusinessAutomationDiagnosis(
  input: BusinessAutomationDiagnosisInput,
): BusinessAutomationDiagnosis {
  const businessName = input.businessName.trim() || "unnamed business";

  return {
    businessName,
    createdAt: input.createdAt || new Date().toISOString(),
    positioning:
      "Scattered files, tasks, and content are turned into a small-business operating system with repeatable AI workflows.",
    opportunities: [
      {
        area: "Digital asset cleanup",
        painPoint: "Files, Drive folders, and project references are scattered.",
        automation:
          "Scan assets, classify them, create a review queue, and generate a cleanup report.",
        offer: "AI work cleanup 7-day diagnosis",
        priority: "high",
      },
      {
        area: "Company operations assistant",
        painPoint: "Tasks and follow-ups disappear after meetings or chats.",
        automation:
          "Create weekly task dashboards, owners, deadlines, risks, and next actions.",
        offer: "Small-company ops assistant setup",
        priority: "high",
      },
      {
        area: "Instagram operations",
        painPoint: "Content planning and performance analysis are inconsistent.",
        automation:
          "Generate a 30-day content calendar, caption structure, KPI review, and next-month actions.",
        offer: "Instagram 30-day operations kit",
        priority: "medium",
      },
      {
        area: "Automation consulting",
        painPoint: "AI tools are used manually without a stable workflow.",
        automation:
          "Select three recurring workflows, standardize prompts, and convert them into repeatable operating routines.",
        offer: "4-week AI workflow buildout",
        priority: "medium",
      },
    ],
    ninetyDayPlan: [
      "Weeks 1-2: Fix reliability issues, restore readable Korean content, and verify the CLI.",
      "Weeks 3-4: Package the 7-day diagnosis with templates, sample reports, and pricing.",
      "Weeks 5-8: Build the company ops assistant MVP around weekly reports.",
      "Weeks 9-12: Build the Instagram calendar and performance-report MVP.",
    ],
    avoid: [
      "Do not start with a broad SaaS platform.",
      "Do not automate every external service before selling one packaged workflow.",
      "Do not offer destructive file cleanup without review reports and approval.",
    ],
  };
}

export function renderBusinessAutomationDiagnosisMarkdown(
  diagnosis: BusinessAutomationDiagnosis,
): string {
  const opportunityRows = diagnosis.opportunities.map((item) => {
    return `| ${item.priority} | ${item.area} | ${item.painPoint} | ${item.automation} | ${item.offer} |`;
  });

  return [
    `# Business Automation Diagnosis: ${diagnosis.businessName}`,
    "",
    `- Created at: \`${diagnosis.createdAt}\``,
    "",
    "## Positioning",
    "",
    diagnosis.positioning,
    "",
    "## Monetization Opportunities",
    "",
    "| priority | area | customer pain | automation | sellable offer |",
    "| --- | --- | --- | --- | --- |",
    ...opportunityRows,
    "",
    "## 90-Day Plan",
    "",
    ...diagnosis.ninetyDayPlan.map((item, index) => `${index + 1}. ${item}`),
    "",
    "## Avoid",
    "",
    ...diagnosis.avoid.map((item) => `- ${item}`),
    "",
  ].join("\n");
}
