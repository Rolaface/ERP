import { Layers, LayoutList } from "lucide-react";
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
    icon: LayoutList,
    description: "Leave duration",
  },
  {
    key: "policy",
    label: "Leave Policy",
    icon: LayoutList,
    description: "Leave rules",
  },
  {
    key: "assign",
    label: "Leave Policy Assignment",
    icon: LayoutList,
    description: "Leave policy assignment",
  },
  {
    key: "holiday",
    label: "Holiday List",
    icon: LayoutList,
    description: "Holiday list management",
  },
  {
    key: "shift",
    label: "Shift Type",
    icon: LayoutList,
    description: "Shift type management",
  },
];
