import type { LucideIcon } from "lucide-react";
import type { ImportApi } from "../../api/imports/createImportApi";

export interface ImportModuleSubType {
  key: string;
  label: string;
  api?: ImportApi;
}

export interface ImportModuleConfig {
  key: string;
  title: string;
  description: string;
  category: string;
  icon: LucideIcon;
  status: "active" | "soon";
  lastImport?: string;
  api?: ImportApi;
  subTypes?: ImportModuleSubType[];
}