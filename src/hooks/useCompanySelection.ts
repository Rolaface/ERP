import { useState, useEffect } from "react";

export function useCompanySelection() {
  const [companyCode, setCompanyCode] = useState<string>(() => {
    // Priority 1: Environment variable
    const envCompany = import.meta.env.VITE_COMPANY_ID; // for Vite
    // const envCompany = process.env.REACT_APP_COMPANY_CODE; // for CRA

    if (envCompany) {
      return envCompany;
    }

    // Priority 2: localStorage (backup)
    const stored = localStorage.getItem("VITE_COMPANY_ID");
    if (stored) {
      return stored;
    }

    // Priority 3: Default
    return "DASH";
  });

  // Sync to localStorage
  useEffect(() => {
    localStorage.setItem("VITE_COMPANY_ID", companyCode);
  }, [companyCode]);

  return {
    companyCode,
    setCompanyCode, // For future when auth provides it
  };
}
