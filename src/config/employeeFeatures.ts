export interface EmployeeCompanyFeatures {
  companyCode: string;

  // Identity & Verification
  requireIdentityVerification: boolean; // Show NAPSA verification modal

  // Statutory Fields Visibility
  showStatutoryFields: boolean; // NRC, SSN, NHIMA, TPIN
  showCeilingFields: boolean; // CeilingYear, CeilingAmount

  // Field requirements
  statutoryFieldsRequired: boolean; // Are statutory fields mandatory?

  departments: string[];
}

// ZRA Configuration
export const ZRA_FEATURES: EmployeeCompanyFeatures = {
  companyCode: "ZRA",
  requireIdentityVerification: true,
  showStatutoryFields: true,
  showCeilingFields: true,
  statutoryFieldsRequired: true,
  departments: [
    "Human Resources",
    "Finance / Accounting",
    "Marketing",
    "Sales",
    "Operations",
    "Information Technology (IT)",
    "Customer Service",
    "Research and Development (R&D)",
  ],
};

// ROLA Configuration
export const ROLA_FEATURES: EmployeeCompanyFeatures = {
  companyCode: "COMP-00004", // or 'ROLA'
  requireIdentityVerification: false,
  showStatutoryFields: false,
  showCeilingFields: false,
  statutoryFieldsRequired: false,
  departments: [
    "Human Resources",
    "Finance / Accounting",
    "Marketing",
    "Sales",
    "Operations",
    "Information Technology (IT)",
    "Customer Service",
    "Research and Development (R&D)",
  ],
};

// Resolver
export function getEmployeeFeatures(
  companyCode: string,
): EmployeeCompanyFeatures {
  const raw = String(companyCode ?? "").trim();
  const key = raw.toLowerCase();

  switch (key) {
    case "zra":
      return ZRA_FEATURES;
    case "comp-00004":
    case "rola":
      return ROLA_FEATURES;
    case "comp-00003":
      return ZRA_FEATURES;
    default: {
      if (!(globalThis as any).__unknown_company_warned__) {
        (globalThis as any).__unknown_company_warned__ = new Set<string>();
      }
      const warned: Set<string> = (globalThis as any)
        .__unknown_company_warned__;
      if (!warned.has(key)) {
        warned.add(key);
        console.warn(`Unknown company: ${raw}, defaulting to ZRA`);
      }
      return ZRA_FEATURES;
    }
  }
}
