import React, {lazy, useMemo, useEffect, useCallback } from "react";
import { useOutletContext, useNavigate, useLocation } from "react-router-dom";
import {
  LayoutDashboard,
  Package,
  Boxes,
  Percent,
  Warehouse,
  Layers,
  Upload,
} from "lucide-react";
import {
  AppPage,
  AppPageBody,
  AppPageHeader,
  AppTabs,
} from "../../components/ui/app-shell";


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

const iconProps = {
  size: 16,
  strokeWidth: 1.75,
};

const inventoryTabs = [
  {
    id: "dashboard",
    label: "Dashboard",
    icon: <LayoutDashboard {...iconProps} />,
  },
  {
    id: "taxTemplates",
    label: "Tax Templates",
    icon: <Percent  {...iconProps} />, 
  },
  {
    id: "items",
    label: "Items",
    icon: <Package {...iconProps} />, 
  },
  {
    id: "itemsCategory",
    label: "Item Group",
    icon: <Layers {...iconProps} />,
  },
  {
    id: "warehouse",
    label: "Warehouse",
    icon: <Warehouse {...iconProps} />,
  },
  {
    id: "stock",
    label: "Stock",
    icon: <Boxes {...iconProps} />, 
  },
  {
    id: "import",
    label: "Import",
    icon: <Upload {...iconProps} />, 
  },
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

  const handleTabChange = useCallback((tabId: string) => {
    navigate(`/inventory/${tabId}`, { replace: true });
  }, [navigate]);

  // Stable tab components - NO remounting on tab switch
  const tabComponents = useMemo(() => ({
    dashboard: <InventoryDashboard />,
    items: <Items />,
    taxCategory: <TaxCategory />,
    itemsCategory: <ItemsCategory />,
    warehouse: <WarehouseView openWarehouseCreate={openWarehouseCreate} openWarehouseEdit={openWarehouseEdit} />,
    stock: <Stock />,
    import: <Import />,
    movements: <Movements />,
    taxTemplates: <TaxTemplate />,
  }), [openWarehouseCreate, openWarehouseEdit]);

  const currentTabComponent = tabComponents[activeTab as keyof typeof tabComponents] || <InventoryDashboard />;

  return (
    <AppPage viewportLocked={isDashboardTab}>
      <AppPageHeader
        title="Inventory"
        description="Track, manage, and optimize inventory in one unified workflow."
          icon={<Boxes size={20} strokeWidth={1.75} />}
      />
      <AppTabs
        tabs={inventoryTabs}
        activeTab={activeTab}
        onChange={handleTabChange}
      />
      <AppPageBody viewportLocked={isDashboardTab}>
        {currentTabComponent}
      </AppPageBody>
    </AppPage>
  );
};

export default Inventory;
