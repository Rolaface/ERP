export type EmployeeTabId =
  | "personal"
  | "contact"
  | "employment"
  | "compensation"
  | "workSchedule"
  | "leaveSetup"
  | "documents";

export interface EmployeeFieldConfig {
  fieldName: string;
  fieldType:
    | "text-input"
    | "api-select"
    | "static-select"
    | "date-input"
    | "textarea";
  label: string;
  required?: boolean;
  placeholder?: string;
  disabled?: boolean;
  verified?: boolean; // For fields verified from NAPSA

  // For API fields
  apiFunctionName?: string;

  // For static selects
  options?: Array<{ value: string; label: string }>;

  // Layout
  colSpan?: 1 | 2 | 3;
}

export interface EmployeeTabConfig {
  tabId: EmployeeTabId;
  fields: EmployeeFieldConfig[];
  sections?: {
    id: string;
    title: string;
    fields: EmployeeFieldConfig[];
  }[];
}

export interface EmployeeFormCompanyConfig {
  companyCode: string;
  companyName: string;

  // Feature flags
  features: {
    requireIdentityVerification: boolean; // Show verification modal?
    showStatutoryFields: boolean; // Show NRC, NAPSA, etc?
    apiDrivenManagers: boolean; // Get managers from API?
  };

  // Tab configurations
  tabs: {
    personal: EmployeeTabConfig;
    contact: EmployeeTabConfig;
    employment: EmployeeTabConfig;
    // ... other tabs
  };
}
