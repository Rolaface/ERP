import {
  Layers,
  CalendarRange,
  FileText,
  UserCheck,
  Calendar,
  Clock,
} from "lucide-react";
import type { AppSetupSection } from "../../../../components/ui/app-shell";

export const SETUP_SECTIONS: AppSetupSection[] = [
  {
    key: "type",
    label: "Leave Type",
    icon: Layers,
    description: "Types of leave",
  },
  {
    key: "period",
    label: "Leave Period",
    icon: CalendarRange,
    description: "Leave duration",
  },
  {
    key: "policy",
    label: "Leave Policy",
    icon: FileText,
    description: "Leave rules",
  },
  {
    key: "assign",
    label: "Leave Policy Assignment",
    icon: UserCheck,
    description: "Leave policy assignment",
  },
  {
    key: "holiday",
    label: "Holiday List",
    icon: Calendar,
    description: "Holiday list management",
  },
  {
    key: "shift",
    label: "Shift Type",
    icon: Clock,
    description: "Shift type management",
  },
];
