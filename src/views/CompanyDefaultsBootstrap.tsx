import { useEffect } from "react";
import { useCompanyDefaultsStore } from "../store/Companydefaultsstore";

const CompanyDefaultsBootstrap: React.FC = () => {
  const fetchDefaults = useCompanyDefaultsStore((s) => s.fetchDefaults);
  const isHydrated    = useCompanyDefaultsStore((s) => s.isHydrated);

  useEffect(() => {
    if (isHydrated) fetchDefaults();
  }, [isHydrated]);

  return null;
};

export default CompanyDefaultsBootstrap;