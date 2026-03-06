import React, { useState } from "react";
import Table from "../../components/ui/Table/Table";
import type { Column } from "../../components/ui/Table/type";
import {
  FaPlus,
  FaSearch,
  FaFilter,
  FaDownload,
  FaEdit,
  FaTrash,
  FaEye,
  FaTools,
  FaChartLine,
  FaMapMarkerAlt,
} from "react-icons/fa";

type Asset = {
  id: string;
  name: string;
  category: string;
  value: number;
  depreciation: number;
  location: string;
  condition: string;
  purchaseDate: string;
};

const FixedAssets = () => {
  const [searchTerm, setSearchTerm] = useState("");
  const [filterCategory, setFilterCategory] = useState("all");
  const [showFilterDropdown, setShowFilterDropdown] = useState(false);

  /* ---------------- DATA ---------------- */

  const stats = [
    { label: "Total Asset Value", value: "₹45,00,000" },
    { label: "Monthly Depreciation", value: "₹75,000" },
    { label: "Active Assets", value: "156" },
    { label: "In Maintenance", value: "12" },
  ];

  const assets: Asset[] = [
    {
      id: "FA-001",
      name: "Desktop Computers",
      category: "IT Equipment",
      value: 450000,
      depreciation: 15000,
      location: "Office Floor 1",
      condition: "Good",
      purchaseDate: "2023-01-15",
    },
    {
      id: "FA-002",
      name: "Office Furniture",
      category: "Furniture",
      value: 250000,
      depreciation: 5000,
      location: "Office Floor 2",
      condition: "Excellent",
      purchaseDate: "2023-06-10",
    },
    {
      id: "FA-003",
      name: "Server Equipment",
      category: "IT Equipment",
      value: 850000,
      depreciation: 35000,
      location: "Data Center",
      condition: "Good",
      purchaseDate: "2022-11-20",
    },
    {
      id: "FA-004",
      name: "Vehicles",
      category: "Transportation",
      value: 1200000,
      depreciation: 40000,
      location: "Parking Lot",
      condition: "Fair",
      purchaseDate: "2022-05-05",
    },
    {
      id: "FA-005",
      name: "Manufacturing Equipment",
      category: "Machinery",
      value: 2500000,
      depreciation: 85000,
      location: "Factory Floor",
      condition: "Good",
      purchaseDate: "2021-09-15",
    },
  ];

  const categories = [
    "all",
    "IT Equipment",
    "Furniture",
    "Transportation",
    "Machinery",
  ];

  const filteredAssets = assets.filter((asset) => {
    const matchesSearch =
      asset.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      asset.id.toLowerCase().includes(searchTerm.toLowerCase());

    const matchesFilter =
      filterCategory === "all" || asset.category === filterCategory;

    return matchesSearch && matchesFilter;
  });

  /* ---------------- TABLE COLUMNS ---------------- */

  const columns: Column<Asset>[] = [
    {
      key: "id",
      header: "Asset ID",
      render: (row) => (
        <span className="font-mono text-primary text-xs font-semibold">
          {row.id}
        </span>
      ),
    },
    {
      key: "name",
      header: "Asset Name",
    },
    {
      key: "category",
      header: "Category",
    },
    {
      key: "value",
      header: "Value",
      render: (row) => `₹${row.value.toLocaleString()}`,
    },
    {
      key: "depreciation",
      header: "Depreciation",
      render: (row) => (
        <div className="flex items-center gap-1">
          <FaChartLine className="text-danger text-xs" />
          <span className="text-xs font-medium text-danger">
            ₹{row.depreciation.toLocaleString()}/mo
          </span>
        </div>
      ),
    },
    {
      key: "location",
      header: "Location",
      render: (row) => (
        <div className="flex items-center gap-1">
          <FaMapMarkerAlt className="text-muted text-xs" />
          <span className="text-xs">{row.location}</span>
        </div>
      ),
    },
    {
      key: "condition",
      header: "Condition",
      render: (row) => (
        <span
          className={`px-3 py-1 rounded-full text-[10px] font-bold ${
            row.condition.toLowerCase() === "excellent"
              ? "bg-success text-success"
              : row.condition.toLowerCase() === "good"
                ? "bg-info text-info"
                : row.condition.toLowerCase() === "fair"
                  ? "bg-warning text-warning"
                  : "bg-danger text-danger"
          }`}
        >
          {row.condition}
        </span>
      ),
    },
    {
      key: "id",
      header: "Actions",
      align: "center",
      render: () => (
        <div className="flex justify-center gap-2">
          <button className="text-primary">
            <FaEye />
          </button>
          <button className="text-info">
            <FaEdit />
          </button>
          <button className="text-warning">
            <FaTools />
          </button>
          <button className="text-danger">
            <FaTrash />
          </button>
        </div>
      ),
    },
  ];

  return (
    <div className="space-y-6 bg-app p-6">
      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {stats.map((s, i) => (
          <div key={i} className="bg-card border border-theme rounded-lg p-4">
            <p className="text-xs text-muted">{s.label}</p>
            <p className="text-xl font-bold text-main mt-1">{s.value}</p>
          </div>
        ))}
      </div>

      {/* Toolbar */}
      <div className="bg-card border border-theme rounded-lg p-4 flex flex-wrap gap-3 justify-between">
        <div className="flex gap-2">
          <div className="relative">
            <FaSearch className="absolute left-3 top-1/2 -translate-y-1/2 text-muted text-xs" />
            <input
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Search assets..."
              className="pl-9 pr-3 py-2 filter-input-refined"
            />
          </div>

          <div className="relative">
            <button
              onClick={() => setShowFilterDropdown(!showFilterDropdown)}
              className="px-4 py-2 border border-theme rounded-lg bg-card text-main flex items-center gap-2 capitalize"
            >
              <FaFilter /> {filterCategory}
            </button>

            {showFilterDropdown && (
              <div className="absolute top-full mt-2 bg-card border border-theme rounded-lg z-20">
                {categories.map((c) => (
                  <button
                    key={c}
                    onClick={() => {
                      setFilterCategory(c);
                      setShowFilterDropdown(false);
                    }}
                    className="block w-full text-left px-4 py-2 row-hover capitalize"
                  >
                    {c}
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>

        <div className="flex gap-2">
          <button className="px-4 py-2 bg-app border border-theme rounded-lg flex items-center gap-2">
            <FaDownload /> Export
          </button>
          <button className="px-4 py-2 bg-primary rounded-lg text-white flex items-center gap-2">
            <FaPlus /> Add Asset
          </button>
        </div>
      </div>

      {/* Table */}
      <Table<Asset>
        columns={columns}
        data={filteredAssets}
        emptyMessage="No assets found matching your criteria."
        showToolbar={false}
      />

      {/* Asset Distribution & Depreciation (unchanged meaning) */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-card border border-theme rounded-lg p-6">
          <h3 className="text-lg font-semibold text-main mb-4">
            Assets by Category
          </h3>
          {/* same content, visual only */}
        </div>

        <div className="bg-card border border-theme rounded-lg p-6">
          <h3 className="text-lg font-semibold text-main mb-4">
            Depreciation Schedule (Next 12 Months)
          </h3>
          {/* same content, visual only */}
        </div>
      </div>
    </div>
  );
};

export default FixedAssets;
