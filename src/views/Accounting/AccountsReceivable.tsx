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
  FaExclamationTriangle,
} from "react-icons/fa";

type Invoice = {
  id: string;
  customer: string;
  amount: number;
  due: string;
  status: string;
  days: number;
  overdue: boolean;
};

const AccountsReceivable = () => {
  const [searchTerm, setSearchTerm] = useState("");
  const [filterStatus, setFilterStatus] = useState("all");
  const [showFilterDropdown, setShowFilterDropdown] = useState(false);

  /* -------------------- DATA -------------------- */

  const stats = [
    { label: "Total Outstanding", value: "₹12,45,000" },
    { label: "Overdue Amount", value: "₹3,25,000" },
    { label: "Avg Collection Days", value: "45 days" },
    { label: "Current Month Revenue", value: "₹8,50,000" },
  ];

  const invoices: Invoice[] = [
    {
      id: "INV-001",
      customer: "ABC Corp",
      amount: 125000,
      due: "2025-01-15",
      status: "Pending",
      days: 5,
      overdue: false,
    },
    {
      id: "INV-002",
      customer: "XYZ Ltd",
      amount: 85000,
      due: "2025-01-05",
      status: "Overdue",
      days: -5,
      overdue: true,
    },
    {
      id: "INV-003",
      customer: "Tech Solutions",
      amount: 250000,
      due: "2025-01-25",
      status: "Pending",
      days: 15,
      overdue: false,
    },
    {
      id: "INV-004",
      customer: "Global Industries",
      amount: 175000,
      due: "2025-01-08",
      status: "Overdue",
      days: -2,
      overdue: true,
    },
  ];

  const filteredInvoices = invoices.filter((inv) => {
    const matchesSearch =
      inv.customer.toLowerCase().includes(searchTerm.toLowerCase()) ||
      inv.id.toLowerCase().includes(searchTerm.toLowerCase());

    const matchesFilter =
      filterStatus === "all" || inv.status.toLowerCase() === filterStatus;

    return matchesSearch && matchesFilter;
  });

  /* -------------------- TABLE COLUMNS -------------------- */

  const columns: Column<Invoice>[] = [
    {
      key: "id",
      header: "Invoice ID",
      render: (row) => (
        <span className="font-mono text-primary text-xs font-semibold">
          {row.id}
        </span>
      ),
    },
    {
      key: "customer",
      header: "Customer",
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
      header: "Days",
      render: (row) => (
        <div className="flex items-center gap-1">
          {row.overdue ? (
            <FaExclamationTriangle className="text-danger text-xs" />
          ) : (
            <FaClock className="text-muted text-xs" />
          )}
          <span
            className={`text-xs font-medium ${
              row.overdue ? "text-danger" : "text-muted"
            }`}
          >
            {Math.abs(row.days)} days {row.overdue ? "overdue" : "left"}
          </span>
        </div>
      ),
    },
    {
      key: "status",
      header: "Status",
      render: (row) => (
        <span
          className={`px-3 py-1 rounded-full text-[10px] font-bold ${
            row.status.toLowerCase() === "overdue"
              ? "bg-danger text-danger"
              : "bg-warning text-warning"
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
              placeholder="Search invoices..."
              className="pl-9 pr-3 py-2 filter-input-refined"
            />
          </div>

          <div className="relative">
            <button
              onClick={() => setShowFilterDropdown(!showFilterDropdown)}
              className="px-4 py-2 border border-theme rounded-lg bg-card text-main flex items-center gap-2"
            >
              <FaFilter /> {filterStatus}
            </button>

            {showFilterDropdown && (
              <div className="absolute top-full mt-2 bg-card border border-theme rounded-lg z-20">
                {["all", "pending", "overdue", "paid"].map((s) => (
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
                ))}
              </div>
            )}
          </div>
        </div>

        <div className="flex gap-2">
          <button className="px-4 py-2 bg-app border border-theme rounded-lg flex gap-2 items-center">
            <FaDownload /> Export
          </button>
          <button className="px-4 py-2 bg-primary rounded-lg text-white flex gap-2 items-center">
            <FaPlus /> New Invoice
          </button>
        </div>
      </div>

      {/* Table */}
      <Table<Invoice>
        columns={columns}
        data={filteredInvoices}
        emptyMessage="No invoices found matching your criteria."
        showToolbar={false}
      />

      {/* Aging Summary */}
      <div className="bg-card rounded-lg border border-theme p-6">
        <h3 className="text-lg font-semibold text-main mb-4">
          Aging Report Summary
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
          {["Current", "1–30", "31–60", "61–90", "90+"].map((label) => (
            <div
              key={label}
              className="text-center p-4 bg-app rounded-lg border border-theme"
            >
              <p className="text-xs text-muted mb-1">{label}</p>
              <p className="text-xl font-bold text-main">₹—</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default AccountsReceivable;
