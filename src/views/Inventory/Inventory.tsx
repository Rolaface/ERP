import React, { useState } from "react";
import { useOutletContext } from "react-router-dom";
import {
  FaBoxOpen,
  FaBoxes,
  FaTachometerAlt,
  FaWarehouse,
} from "react-icons/fa";
import Items from "./Items";
import Movements from "./Movements";
import ItemsCategory from "./ItemsCategory";
import WarehouseView from "./Warehouse";
import Stock from "./Stock";
import Import from "./Import";
import TaxTemplate from "./TaxTemplate";
import InventoryDashboard from "./InventoryDashboard";
import TaxCategory from "./TaxCategory";
import {
  AppPage,
  AppPageBody,
  AppPageHeader,
  AppTabs,
} from "../../components/ui/app-shell";

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
        {activeTab === "inventorydashboard" && <InventoryDashboard />}
        {activeTab === "items" && <Items />}
        {activeTab === "taxCategory" && <TaxCategory />}
        {activeTab === "itemsCategory" && <ItemsCategory />}
        {activeTab === "warehouse" && <WarehouseView openWarehouseCreate={openWarehouseCreate} openWarehouseEdit={openWarehouseEdit} />}
        {activeTab === "stock" && <Stock />}
        {activeTab === "import" && <Import />}
        {activeTab === "movements" && <Movements />}
        {activeTab === "taxTemplates" && <TaxTemplate />}
      </AppPageBody>
    </AppPage>
  );
};

export default Inventory;
