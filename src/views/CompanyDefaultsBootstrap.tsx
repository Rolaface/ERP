import { useEffect } from "react";
import { useCompanyDefaultsStore } from "../store/Companydefaultsstore";
import { useAuth } from "../context/AuthContext";

const CompanyDefaultsBootstrap: React.FC = () => {
  const fetchDefaults = useCompanyDefaultsStore((s) => s.fetchDefaults);
  const isHydrated    = useCompanyDefaultsStore((s) => s.isHydrated);
  const { isAuthenticated, loading: authLoading } = useAuth();

  useEffect(() => {
    if (isHydrated && isAuthenticated && !authLoading) {
      fetchDefaults();
    }
  }, [isHydrated, isAuthenticated, authLoading]);

  return null;
};

export default CompanyDefaultsBootstrap;