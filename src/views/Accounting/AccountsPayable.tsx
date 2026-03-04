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
  FaClock,
} from "react-icons/fa";

type Bill = {
  id: string;
  vendor: string;
  amount: number;
  due: string;
  status: string;
  days: number;
  priority: string;
};

const AccountsPayable = () => {
  const [searchTerm, setSearchTerm] = useState("");
  const [filterStatus, setFilterStatus] = useState("all");
  const [showFilterDropdown, setShowFilterDropdown] = useState(false);

  /* -------------------- DATA -------------------- */

  const stats = [
    { label: "Total Payables", value: "₹8,75,000" },
    { label: "Due This Week", value: "₹2,15,000" },
    { label: "Avg Payment Days", value: "38 days" },
    { label: "Current Month Expenses", value: "₹6,25,000" },
  ];

  const bills: Bill[] = [
    {
      id: "BILL-001",
      vendor: "Office Supplies Co",
      amount: 45000,
      due: "2025-01-18",
      status: "Approved",
      days: 8,
      priority: "medium",
    },
    {
      id: "BILL-002",
      vendor: "Tech Services Inc",
      amount: 125000,
      due: "2025-01-14",
      status: "Pending",
      days: 4,
      priority: "high",
    },
    {
      id: "BILL-003",
      vendor: "Utilities Provider",
      amount: 35000,
      due: "2025-01-22",
      status: "Scheduled",
      days: 12,
      priority: "low",
    },
    {
      id: "BILL-004",
      vendor: "Equipment Rental",
      amount: 85000,
      due: "2025-01-16",
      status: "Approved",
      days: 6,
      priority: "medium",
    },
    {
      id: "BILL-005",
      vendor: "Marketing Agency",
      amount: 195000,
      due: "2025-01-12",
      status: "Pending",
      days: 2,
      priority: "high",
    },
    {
      id: "BILL-006",
      vendor: "Cleaning Services",
      amount: 25000,
      due: "2025-01-20",
      status: "Approved",
      days: 10,
      priority: "low",
    },
  ];

  const filteredBills = bills.filter((bill) => {
    const matchesSearch =
      bill.vendor.toLowerCase().includes(searchTerm.toLowerCase()) ||
      bill.id.toLowerCase().includes(searchTerm.toLowerCase());

    const matchesFilter =
      filterStatus === "all" || bill.status.toLowerCase() === filterStatus;

    return matchesSearch && matchesFilter;
  });

  /* -------------------- TABLE COLUMNS -------------------- */

  const columns: Column<Bill>[] = [
    {
      key: "id",
      header: "Bill ID",
      render: (row) => (
        <span className="font-mono text-primary text-xs font-semibold">
          {row.id}
        </span>
      ),
    },
    {
      key: "vendor",
      header: "Vendor",
    },
    {
      key: "amount",
      header: "Amount",
      render: (row) => `₹${row.amount.toLocaleString()}`,
    },
    {
      key: "due",
      header: "Due Date",
    },
    {
      key: "days",
      header: "Days Left",
      render: (row) => (
        <div className="flex items-center gap-1">
          <FaClock className="text-muted text-xs" />
          <span
            className={`text-xs font-medium ${
              row.days <= 3
                ? "text-danger"
                : row.days <= 7
                  ? "text-warning"
                  : "text-muted"
            }`}
          >
            {row.days} days
          </span>
        </div>
      ),
    },
    {
      key: "priority",
      header: "Priority",
      render: (row) => (
        <span
          className={`px-3 py-1 rounded-full text-[10px] font-bold capitalize ${
            row.priority === "high"
              ? "bg-danger text-danger"
              : row.priority === "medium"
                ? "bg-warning text-warning"
                : "bg-success text-success"
          }`}
        >
          {row.priority}
        </span>
      ),
    },
    {
      key: "status",
      header: "Status",
      render: (row) => (
        <span
          className={`px-3 py-1 rounded-full text-[10px] font-bold ${
            row.status.toLowerCase() === "approved"
              ? "bg-info text-info"
              : row.status.toLowerCase() === "pending"
                ? "bg-warning text-warning"
                : "bg-primary text-white"
          }`}
        >
          {row.status}
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
          <div key={i} className="bg-card rounded-lg border border-theme p-4">
            <p className="text-xs text-muted">{s.label}</p>
            <p className="text-xl font-bold text-main mt-1">{s.value}</p>
          </div>
        ))}
      </div>

      {/* Toolbar */}
      <div className="bg-card rounded-lg border border-theme p-4 flex flex-wrap gap-3 justify-between">
        <div className="flex gap-2">
          <div className="relative">
            <FaSearch className="absolute left-3 top-1/2 -translate-y-1/2 text-muted text-xs" />
            <input
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Search bills or vendors..."
              className="pl-9 pr-3 py-2 filter-input-refined"
            />
          </div>

          <div className="relative">
            <button
              onClick={() => setShowFilterDropdown(!showFilterDropdown)}
              className="px-4 py-2 border border-theme rounded-lg bg-card text-main flex items-center gap-2 capitalize"
            >
              <FaFilter /> {filterStatus}
            </button>

            {showFilterDropdown && (
              <div className="absolute top-full mt-2 bg-card border border-theme rounded-lg z-20">
                {["all", "pending", "approved", "scheduled", "paid"].map(
                  (s) => (
                    <button
                      key={s}
                      onClick={() => {
                        setFilterStatus(s);
                        setShowFilterDropdown(false);
                      }}
                      className="block w-full text-left px-4 py-2 row-hover capitalize"
                    >
                      {s}
                    </button>
                  ),
                )}
              </div>
            )}
          </div>
        </div>

        <div className="flex gap-2">
          <button className="px-4 py-2 bg-app border border-theme rounded-lg flex gap-2 items-center">
            <FaDownload /> Export
          </button>
          <button className="px-4 py-2 bg-primary rounded-lg text-white flex gap-2 items-center">
            <FaPlus /> New Bill
          </button>
        </div>
      </div>

      {/* Table */}
      <Table<Bill>
        columns={columns}
        data={filteredBills}
        emptyMessage="No bills found matching your criteria."
        showToolbar={false}
      />

      {/* Payment Schedule */}
      <div className="bg-card rounded-lg border border-theme p-6">
        <h3 className="text-lg font-semibold text-main mb-4">
          Payment Schedule - Next 30 Days
        </h3>

        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          {["This Week", "Week 2", "Week 3", "Week 4+"].map((label) => (
            <div
              key={label}
              className="text-center p-4 bg-app rounded-lg border border-theme"
            >
              <p className="text-xs text-muted mb-1">{label}</p>
              <p className="text-xl font-bold text-main">₹—</p>
              <p className="text-xs text-muted mt-1">— bills</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default AccountsPayable;
