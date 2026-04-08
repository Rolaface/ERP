import React, { useState } from "react";
import { FaBoxOpen, FaBoxes, FaTachometerAlt, FaWarehouse  } from "react-icons/fa";
import Items from "./Items";
import Movements from "./Movements";
import ItemsCategory from "./ItemsCategory";
import WarehouseView from "./Warehouse";
import Stock from "./Stock";
import Import from "./Import";
import TaxTemplate from "./TaxTemplate";
import InventoryDashboard from "./InventoryDashboard";
import {
  AppPage,
  AppPageBody,
  AppPageHeader,
  AppTabs,
} from "../../components/ui/app-shell";

const inventory = {
  name: "Inventory",
  icon: <FaBoxes />,
  defaultTab: "inventorydashboard",
  tabs: [
    { id: "inventorydashboard", label: "Dashboard", icon: <FaTachometerAlt  /> },
    { id: "taxTemplates",label : "Tax Templates", icon: <FaBoxOpen /> },
    { id: "items", label: "Items", icon: <FaBoxOpen /> },
    { id: "itemsCategory", label: "Items Category", icon: <FaBoxOpen /> },
    { id: "warehouse", label: "WareHouse", icon: <FaWarehouse /> },
    { id: "stock", label: "Stock", icon: <FaBoxOpen /> },
    { id: "import", label: "Import", icon: <FaBoxOpen /> },
  ],
  products: [
    {
      id: "PR-001",
      name: "Laptop Pro 14",
      category: "Electronics",
      stock: 120,
      minStock: 50,
      price: 1500,
      supplier: "TechSupply Co",
    },
    {
      id: "PR-002",
      name: "Office Chair",
      category: "Furniture",
      stock: 85,
      minStock: 30,
      price: 250,
      supplier: "Office Solutions",
    },
    {
      id: "PR-003",
      name: "Printer Ink",
      category: "Supplies",
      stock: 200,
      minStock: 100,
      price: 45,
      supplier: "Equipment Plus",
    },
  ],
};

const Inventory: React.FC = () => {
  const [activeTab, setActiveTab] = useState(inventory.defaultTab);
  const [searchTerm, setSearchTerm] = useState("");
  const isDashboardTab = activeTab === "inventorydashboard";

  return (
    <AppPage viewportLocked={isDashboardTab}>
      <AppPageHeader
        title={inventory.name}
        description="Inventory operations and stock visibility within the shared ERP shell."
        icon={inventory.icon}
      />
      <AppTabs
        tabs={inventory.tabs}
        activeTab={activeTab}
        onChange={(tabId) => {
          setActiveTab(tabId);
          setSearchTerm("");
        }}
      />
      <AppPageBody viewportLocked={isDashboardTab}>
        {activeTab === "inventorydashboard" && <InventoryDashboard />}
        {activeTab === "items" && (
          <Items
            products={inventory.products}
            searchTerm={searchTerm}
            setSearchTerm={setSearchTerm}
            onAdd={() => {}}
          />
        )}
        {activeTab === "itemsCategory" && (
          <ItemsCategory
            products={inventory.products}
            searchTerm={searchTerm}
            setSearchTerm={setSearchTerm}
            onAdd={() => {}}
          />
        )}
        {activeTab === "warehouse" && (
          <WarehouseView
            products={inventory.products}
            searchTerm={searchTerm}
            setSearchTerm={setSearchTerm}
            onAdd={() => {}}
          />
        )}
        {activeTab === "stock" && (
          <Stock
            products={inventory.products}
            searchTerm={searchTerm}
            setSearchTerm={setSearchTerm}
            onAdd={() => {}}
          />
        )}
        {activeTab === "import" && (
          <Import
            products={inventory.products}
            searchTerm={searchTerm}
            setSearchTerm={setSearchTerm}
            onAdd={() => {}}
          />
        )}
        {activeTab === "movements" && <Movements onAdd={() => {}} />}
         {activeTab === "taxTemplates" && (
          <TaxTemplate onAdd={() => {}} />
        )}

      </AppPageBody>
    </AppPage>
  );
};

export default Inventory;
