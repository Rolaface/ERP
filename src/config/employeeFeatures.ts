export interface EmployeeCompanyFeatures {
  requireIdentityVerification: boolean;  // Show identity verification modal
  showStatutoryFields: boolean;          // NRC, SSN, NHIMA, TPIN
  showCeilingFields: boolean;            // CeilingYear, CeilingAmount
  statutoryFieldsRequired: boolean;      // Are statutory fields mandatory?
  departments: string[];
}

export const EMPLOYEE_FEATURES: EmployeeCompanyFeatures = {
  requireIdentityVerification: true,
  showStatutoryFields: true,
  showCeilingFields: true,
  statutoryFieldsRequired: true,
  departments: [
  
  ],
};

// Resolver — no company-specific branching anymore
export function getEmployeeFeatures(): EmployeeCompanyFeatures {
  return EMPLOYEE_FEATURES;
}