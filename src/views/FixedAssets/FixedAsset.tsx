import React, { useState } from "react";
import { FaWarehouse, FaChartPie } from "react-icons/fa";
import FixedAssetDashboard from "./FA_Dashboard";
import AssetRegister from "./AssetRegister";
import Assetcategory from "./AssetCategory";
const fixedAssetTabs = [
  { id: "dashboard", name: "Dashboard", icon: <FaChartPie /> },
  { id: "assets", name: "Assets", icon: <FaWarehouse /> },
  { id: "categories", name: "Categories", icon: <FaWarehouse /> },
  { id: "maintenance", name: "Maintenance", icon: <FaWarehouse /> },
];

const FixedAssets: React.FC = () => {
  const [activeTab, setActiveTab] = useState<string>("dashboard");

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b border-gray-200 px-6 py-4">
        <div className="flex items-center justify-between">
          <h1 className="text-2xl font-bold flex items-center gap-3 text-gray-900">
            <FaWarehouse className="text-blue-600" />
           Assets
          </h1>
        </div>
      </div>

      {/* Tabs */}
      <div className="bg-white border-b border-gray-200 px-6">
        <div className="flex gap-1 overflow-x-auto">
          {fixedAssetTabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex items-center gap-2 px-4 py-3 font-medium text-sm whitespace-nowrap transition-all border-b-2 ${
                activeTab === tab.id
                  ? "text-blue-600 border-blue-600"
                  : "text-gray-600 border-transparent hover:text-gray-900 hover:border-gray-300"
              }`}
            >
              <span className="text-lg">{tab.icon}</span>
              {tab.name}
            </button>
          ))}
        </div>
      </div>

      {/* Content */}
      <div className="p-6">
        {activeTab === "dashboard" && <FixedAssetDashboard />}
        {activeTab === "categories" && <Assetcategory />}
        {activeTab === "assets" && <AssetRegister />}
        
      </div>
    </div>
  );
};

export default FixedAssets;
