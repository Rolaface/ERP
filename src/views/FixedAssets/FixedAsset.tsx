import React, { useMemo, useCallback } from "react";
import { useSearchParams, useNavigate, useLocation } from "react-router-dom";
import { FaWarehouse, FaChartPie, FaTags, FaList } from "react-icons/fa";

import {
  AppPage,
  AppPageHeader,
  AppPageBody,
  AppTabs,
} from "../../components/ui/app-shell";

// Lazy modules
const FADashboard = React.lazy(() => import("./FA_Dashboard"));
const AssetCategory = React.lazy(() => import("./AssetCategory"));
const FixedAssetList = React.lazy(() => import("./AssetRegister"));

const DEFAULT_TAB = "dashboard";

const allTabs = [
  { id: "dashboard", label: "Dashboard", icon: <FaChartPie /> },
  { id: "category", label: "Asset Category", icon: <FaTags /> },
  { id: "assets", label: "Fixed Assets", icon: <FaList /> },
];

const FixedAssetsModule: React.FC = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const location = useLocation();

  const activeTab = searchParams.get("tab") || DEFAULT_TAB;

  const handleTabChange = useCallback((tabId: string) => {
    const newParams = new URLSearchParams(searchParams);
    newParams.set("tab", tabId);
    navigate(`${location.pathname}?${newParams.toString()}`, { replace: true });
  }, [navigate, location.pathname, searchParams]);

  // Memoized tabs (NO remount issue)
  const tabComponents = useMemo(() => ({
    dashboard: <FADashboard />,
    category: <AssetCategory />,
    assets: <FixedAssetList />,
  }), []);

  const currentTab =
    tabComponents[activeTab as keyof typeof tabComponents] ||
    tabComponents.dashboard;

  return (
    <AppPage>
      <AppPageHeader
        title="Fixed Assets"
        description="Track assets, categories, and financial impact."
        icon={<FaWarehouse />}
      />

      <AppTabs
        tabs={allTabs}
        activeTab={activeTab}
        onChange={handleTabChange}
      />

      <AppPageBody>
        {currentTab}
      </AppPageBody>
    </AppPage>
  );
};

export default FixedAssetsModule;