import type { LucideIcon } from "lucide-react";

export type ImportCategory = "General" | "Logistics" | "Finance" | "HR";
export type ImportStatus = "active" | "soon";

// Standard shape every module's upload endpoint should resolve to.
// If your APIs return something different, normalize it to this in
// the module's own api file rather than changing this type everywhere.
export interface ImportUploadResult {
  status_code: number;
  message?: string;
  data?: { importedCount?: number };
}

// Every "active" module must supply these two functions. Each module
// points at its own API file (customersApi, suppliersApi, etc.) — the
// UI and the hook never need to know which backend endpoint is behind them.
export interface ImportModuleHandlers {
  downloadTemplate: () => Promise<Blob>;
  uploadFile: (file: File) => Promise<ImportUploadResult>;
}

export interface ImportModuleConfig {
  key: string; // stable slug, also used as the upload target + template filename
  title: string;
  description: string;
  category: ImportCategory;
  icon: LucideIcon;
  status: ImportStatus;
  lastImport?: string;
  // Only required when status === "active". "Coming soon" modules
  // simply omit this — no handlers means the buttons stay disabled.
  handlers?: ImportModuleHandlers;
}