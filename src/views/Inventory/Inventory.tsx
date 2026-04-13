import React, { useState, Suspense, lazy } from "react";
import { useOutletContext } from "react-router-dom";
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
import PageLoader from "../../components/ui/PageLoader";
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

const Inventory: React.FC = () => {
  const [activeTab, setActiveTab] = useState("inventorydashboard");
  const isDashboardTab = activeTab === "inventorydashboard";
  const { openWarehouseCreate, openWarehouseEdit } = useOutletContext<OutletContextType>();

  const inventoryTabs = [
    { id: "inventorydashboard", label: "Dashboard", icon: <FaTachometerAlt /> },
    { id: "taxTemplates", label: "Tax Templates", icon: <FaBoxOpen /> },
    { id: "items", label: "Items", icon: <FaBoxOpen /> },
    { id: "itemsCategory", label: "Items Category", icon: <FaBoxOpen /> },
    { id: "warehouse", label: "WareHouse", icon: <FaWarehouse /> },
    { id: "stock", label: "Stock", icon: <FaBoxOpen /> },
    { id: "import", label: "Import", icon: <FaBoxOpen /> },
  ];

  const renderTab = () => {
    switch (activeTab) {
      case "inventorydashboard":
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
        return null;
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
        onChange={(tabId) => {
          setActiveTab(tabId);
        }}
      />
      <AppPageBody viewportLocked={isDashboardTab}>
        <Suspense fallback={<AppSkeleton />}>{renderTab()}</Suspense>
      </AppPageBody>
    </AppPage>
  );
};

export default Inventory;
