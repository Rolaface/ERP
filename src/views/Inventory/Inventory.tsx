import React, { useState } from "react";
import { FaBoxOpen, FaBoxes, FaChartBar } from "react-icons/fa";

import Items from "./Items";
import Movements from "./Movements";
import ItemsCategory from "./ItemsCategory";
import Stock from "./Stock";
import Import from "./Import";
import InventoryDashboard from "./InventoryDashboard";

const inventory = {
  name: "Inventory",
  icon: <FaBoxes />,
  defaultTab: "inventorydashboard",
  tabs: [
    { id: "inventorydashboard", name: "Dashboard", icon: <FaChartBar /> },
    { id: "items", name: "Items", icon: <FaBoxOpen /> },
    { id: "itemsCategory", name: "Items Category", icon: <FaBoxOpen /> },
    { id: "stock", name: "Stock", icon: <FaBoxOpen /> },
    { id: "import", name: "Import", icon: <FaBoxOpen /> },
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
  warehouses: [
    {
      id: "WH-001",
      name: "Main Warehouse",
      location: "Lusaka",
      manager: "John Doe",
      items: 450,
      capacity: "90%",
    },
    {
      id: "WH-002",
      name: "Regional Storage",
      location: "Ndola",
      manager: "Sarah Lee",
      items: 310,
      capacity: "75%",
    },
    {
      id: "WH-003",
      name: "Distribution Center",
      location: "Kitwe",
      manager: "Anna Wilson",
      items: 120,
      capacity: "80%",
    },
  ],
};

const Inventory: React.FC = () => {
  const [activeTab, setActiveTab] = useState(inventory.defaultTab);
  const [searchTerm, setSearchTerm] = useState("");

  return (
    <div className="p-6 bg-app">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-2xl font-bold flex items-center gap-2 text-main">
          <span>{inventory.icon}</span> {inventory.name}
        </h2>
      </div>

      {/* Tabs */}
      <div className="flex border-b border-gray-200 mb-4">
        {inventory.tabs.map((tab) => (
          <button
            key={tab.id}
            onClick={() => {
              setActiveTab(tab.id);
              setSearchTerm("");
            }}
            className={`px-4 py-2 font-medium flex items-center gap-2 transition-colors ${
              activeTab === tab.id
                ? "text-primary border-b-2 border-current"
                : "text-muted hover:text-main"
            }`}
          >
            <span>{tab.icon}</span> {tab.name}
          </button>
        ))}
      </div>

      {/* Content */}
      <div className="">
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
      </div>
    </div>
  );
};

export default Inventory;
