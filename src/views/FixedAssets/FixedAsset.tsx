import React, { useMemo, useCallback } from "react";
import { useSearchParams, useNavigate, useLocation } from "react-router-dom";
import {
  LayoutDashboard,
  Layers,
  Package,
  ArrowRightLeft,
  Building2
} from "lucide-react";

import {
  AppPage,
  AppPageHeader,
  AppPageBody,
  AppTabs,
} from "../../components/ui/app-shell";

// Lazy modules
const FADashboard = React.lazy(() => import("./FA_Dashboard"));
const AssetCategory = React.lazy(() => import("./AssetCategory"));
const FixedAssetregister = React.lazy(() => import("./AssetRegister"));
const AssetMovements = React.lazy(() => import("./AssetMovement"));

const DEFAULT_TAB = "dashboard";

const iconProps = {
  size: 16,
  strokeWidth: 1.75,
};

const allTabs = [
  {
    id: "dashboard",
    label: "Dashboard",
    icon: <LayoutDashboard {...iconProps} />,
  },
  {
    id: "category",
    label: "Asset Category",
    icon: <Layers {...iconProps} />, 
  },
  {
    id: "assets",
    label: "Assets",
    icon: <Package {...iconProps} />, 
  },
  {
    id: "assetmovements",
    label: "Asset Movements",
    icon: <ArrowRightLeft {...iconProps} />, 
  },
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


  const tabComponents = useMemo(() => ({
    dashboard: <FADashboard />,
    category: <AssetCategory />,
    assets: <FixedAssetregister />,
    assetmovements: <AssetMovements />,
  }), []);

  const currentTab =
    tabComponents[activeTab as keyof typeof tabComponents] ||
    tabComponents.dashboard;

  return (
    <AppPage>
      <AppPageHeader
        title="Fixed Assets"
        description="Track assets, categories, and financial impact."
        icon={<Building2  />}
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