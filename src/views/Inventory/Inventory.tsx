import React, { Suspense, lazy, useMemo,useEffect } from "react";
import { useOutletContext, useNavigate, useLocation } from "react-router-dom";
import {
  FaBoxOpen,
  FaBoxes,
  FaTachometerAlt,
  FaWarehouse,
} from "react-icons/fa";
import {
  AppPage,
  AppPageBody,
  AppPageHeader,
  AppTabs,
} from "../../components/ui/app-shell";
import AppSkeleton from "../../components/ui/AppSkeleton";

const Items = lazy(() => import("./Items"));
const Movements = lazy(() => import("./Movements"));
const ItemsCategory = lazy(() => import("./ItemsCategory"));
const WarehouseView = lazy(() => import("./Warehouse"));
const Stock = lazy(() => import("./Stock"));
const Import = lazy(() => import("./Import"));
const TaxTemplate = lazy(() => import("./TaxTemplate"));
const InventoryDashboard = lazy(() => import("./InventoryDashboard"));
const TaxCategory = lazy(() => import("./TaxCategory"));

interface OutletContextType {
  openWarehouseCreate: (initialData?: { parent: string }) => void;
  openWarehouseEdit: (id: string, data?: any) => void;
}

const inventoryTabs = [
  { id: "dashboard", label: "Dashboard", icon: <FaTachometerAlt /> },
  { id: "taxTemplates", label: "Tax Templates", icon: <FaBoxOpen /> },
  { id: "items", label: "Items", icon: <FaBoxOpen /> },
  { id: "itemsCategory", label: "Items Category", icon: <FaBoxOpen /> },
  { id: "warehouse", label: "WareHouse", icon: <FaWarehouse /> },
  { id: "stock", label: "Stock", icon: <FaBoxOpen /> },
  { id: "import", label: "Import", icon: <FaBoxOpen /> },
];

const DEFAULT_TAB = "dashboard";

const Inventory: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { openWarehouseCreate, openWarehouseEdit } = useOutletContext<OutletContextType>();

  const activeTab = useMemo(() => {
    const path = location.pathname;
    const base = "/inventory";
    if (path === base || path === `${base}/`) {
      return DEFAULT_TAB;
    }
    return path.replace(`${base}/`, "") || DEFAULT_TAB;
  }, [location.pathname]);

  useEffect(() => {
    const path = location.pathname;
    if (path === "/inventory" || path === "/inventory/") {
      navigate("/inventory/dashboard", { replace: true });
    }
  }, [location.pathname, navigate]);

  const isDashboardTab = activeTab === "dashboard";

  const handleTabChange = (tabId: string) => {
    navigate(`/inventory/${tabId}`, { replace: true });
  };

  const renderTab = () => {
    switch (activeTab) {
      case "dashboard":
        return <InventoryDashboard />;
      case "items":
        return <Items />;
      case "taxCategory":
        return <TaxCategory />;
      case "itemsCategory":
        return <ItemsCategory />;
      case "warehouse":
        return <WarehouseView openWarehouseCreate={openWarehouseCreate} openWarehouseEdit={openWarehouseEdit} />;
      case "stock":
        return <Stock />;
      case "import":
        return <Import />;
      case "movements":
        return <Movements />;
      case "taxTemplates":
        return <TaxTemplate />;
      default:
        return <InventoryDashboard />;
    }
  };

  return (
    <AppPage viewportLocked={isDashboardTab}>
      <AppPageHeader
        title="Inventory"
        description="Inventory operations and stock visibility within the shared ERP shell."
        icon={<FaBoxes />}
      />
      <AppTabs
        tabs={inventoryTabs}
        activeTab={activeTab}
        onChange={handleTabChange}
      />
      <AppPageBody viewportLocked={isDashboardTab}>
        <Suspense fallback={<AppSkeleton />}>{renderTab()}</Suspense>
      </AppPageBody>
    </AppPage>
  );
};

export default Inventory;
