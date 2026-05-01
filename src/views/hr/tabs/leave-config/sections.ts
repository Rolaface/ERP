import { Layers, LayoutList } from "lucide-react";
import type { AppSetupSection } from "../../../../components/ui/app-shell";

export const SETUP_SECTIONS: AppSetupSection[] = [
  {
    key: "component",
    label: "Leave Type",
    icon: Layers,
    description: "Types of leave",
  },
  {
    key: "structure",
    label: "Leave Period",
    icon: LayoutList,
    description: "Leave duration",
  },
  {
    key: "tax",
    label: "Leave Policy",
    icon: LayoutList,
    description: "Leave rules",
  },
];
