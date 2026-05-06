import { Briefcase, Building2, Layers, UserRoundCog } from "lucide-react";
import type { AppSetupSection } from "../../../../../components/ui/app-shell";

export const EMPLOYEE_SECTIONS: AppSetupSection[] = [
  {
    key: "department",
    label: "Department",
    icon: Building2,
    description: "Teams and hierarchy",
  },
  {
    key: "designation",
    label: "Designation",
    icon: Briefcase,
    description: "Role classification",
  },
  {
    key: "grade",
    label: "Grade",
    icon: Layers,
    description: "Employee bands",
  },
  {
    key: "employeeType",
    label: "Employee Type",
    icon: UserRoundCog,
    description: "Employment categories",
  },
];
