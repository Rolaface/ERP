import { Layers, LayoutList } from "lucide-react";
import type { AppSetupSection } from "../../../../components/ui/app-shell";

export const SETUP_SECTIONS: AppSetupSection[] = [
  {
    key: "component",
    label: "Salary Components",
    icon: Layers,
    description: "Earnings & deductions",
  },
  {
    key: "structure",
    label: "Salary Structures",
    icon: LayoutList,
    description: "Component groupings",
  },
  {
    key: "tax",
    label: "Tax Configurations",
    icon: LayoutList,
    description: "Tax rules and settings",
  },
];
