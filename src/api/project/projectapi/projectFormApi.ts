import type { ProjectFormOptions } from "../../../types/Project_Management/project_modal/Projectformmodal";

const MOCK_DELAY_MS = 300;

const wait = (ms: number) =>
  new Promise<void>((resolve) => setTimeout(resolve, ms));

const MOCK_OPTIONS: ProjectFormOptions = {
  types: [
    { name: "Internal", description: "Projects run for internal operations" },
    { name: "External", description: "Client billable projects" },
    { name: "Support", description: "Maintenance and support contracts" },
  ],
  templates: [
    { name: "ERP Implementation", type: "External" },
    { name: "API Integration", type: "External" },
    { name: "Internal Migration", type: "Internal" },
    { name: "Mobile App Release", type: "External" },
  ],
  members: [
    { name: "Siddharth Rao", role: "Principal Architect" },
    { name: "Ananya Mishra", role: "DevOps Lead" },
    { name: "Rohan Kulkarni", role: "Lead Integration" },
    { name: "Pooja Tiwari", role: "Product Lead" },
    { name: "Vikram Kapoor", role: "IoT Engineering Lead" },
    { name: "Neha Verma", role: "QA Engineer" },
  ],
  activityTypes: [
    { name: "Development", billingRate: 1800 },
    { name: "Planning", billingRate: 1500 },
    { name: "Testing", billingRate: 1200 },
    { name: "Deployment", billingRate: 2000 },
    { name: "Documentation", billingRate: 800 },
  ],
};

export const fetchProjectFormOptions = async (): Promise<ProjectFormOptions> => {
  await wait(MOCK_DELAY_MS);
  return MOCK_OPTIONS;
};

export const fetchNextProjectCode = async (): Promise<string> => {
  await wait(MOCK_DELAY_MS);
  return "PRJ-0001";
};