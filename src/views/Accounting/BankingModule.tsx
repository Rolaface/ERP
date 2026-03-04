import React, { useState } from "react";
import Table from "../../components/ui/Table/Table";
import type { Column } from "../../components/ui/Table/type";
import {
  FaPlus,
  FaSearch,
  FaFilter,
  FaDownload,
  FaEdit,
  FaArrowUp,
  FaArrowDown,
  FaCheckCircle,
  FaClock,
} from "react-icons/fa";

type Transaction = {
  id: string;
  date: string;
  description: string;
  type: string;
  amount: number;
  account: string;
  status: string;
  category: string;
};

const Banking = () => {
  const [searchTerm, setSearchTerm] = useState("");
  const [filterType, setFilterType] = useState("all");
  const [showFilterDropdown, setShowFilterDropdown] = useState(false);
  const [selectedAccount, setSelectedAccount] = useState("all");

  /* ---------------- DATA ---------------- */

  const bankAccounts = [
    {
      id: "ACC-001",
      name: "HDFC Current Account",
      number: "****1234",
      balance: 1850000,
      type: "Current",
    },
    {
      id: "ACC-002",
      name: "ICICI Savings Account",
      number: "****5678",
      balance: 650000,
      type: "Savings",
    },
    {
      id: "ACC-003",
      name: "Axis Business Account",
      number: "****9012",
      balance: 2150000,
      type: "Business",
    },
  ];

  const stats = [
    { label: "Total Balance", value: "₹46,50,000" },
    { label: "Total Inflow (MTD)", value: "₹18,25,000" },
    { label: "Total Outflow (MTD)", value: "₹12,40,000" },
    { label: "Pending Reconciliation", value: "23" },
  ];

  const transactions: Transaction[] = [
    {
      id: "TXN-001",
      date: "2025-01-10",
      description: "Customer Payment - ABC Corp",
      type: "Credit",
      amount: 125000,
      account: "HDFC Current",
      status: "Cleared",
      category: "Revenue",
    },
    {
      id: "TXN-002",
      date: "2025-01-09",
      description: "Supplier Payment - Tech Services",
      type: "Debit",
      amount: 85000,
      account: "ICICI Savings",
      status: "Cleared",
      category: "Expense",
    },
    {
      id: "TXN-003",
      date: "2025-01-09",
      description: "Office Rent Payment",
      type: "Debit",
      amount: 65000,
      account: "HDFC Current",
      status: "Pending",
      category: "Expense",
    },
    {
      id: "TXN-004",
      date: "2025-01-08",
      description: "Sales Revenue - Invoice #1234",
      type: "Credit",
      amount: 250000,
      account: "Axis Business",
      status: "Cleared",
      category: "Revenue",
    },
  ];

  const filteredTransactions = transactions.filter((txn) => {
    const matchesSearch =
      txn.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
      txn.id.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesType =
      filterType === "all" || txn.type.toLowerCase() === filterType;
    const matchesAccount =
      selectedAccount === "all" || txn.account === selectedAccount;
    return matchesSearch && matchesType && matchesAccount;
  });

  /* ---------------- TABLE COLUMNS ---------------- */

  const columns: Column<Transaction>[] = [
    {
      key: "id",
      header: "Transaction ID",
      render: (row) => (
        <span className="font-mono text-primary text-xs font-semibold">
          {row.id}
        </span>
      ),
    },
    {
      key: "date",
      header: "Date",
    },
    {
      key: "description",
      header: "Description",
      render: (row) => (
        <div>
          <p className="text-xs font-medium">{row.description}</p>
          <p className="text-[10px] text-muted">{row.category}</p>
        </div>
      ),
    },
    {
      key: "account",
      header: "Account",
    },
    {
      key: "type",
      header: "Type",
      render: (row) => (
        <div className="flex items-center gap-1">
          {row.type === "Credit" ? (
            <FaArrowDown className="text-success text-xs" />
          ) : (
            <FaArrowUp className="text-danger text-xs" />
          )}
          <span
            className={`text-xs font-bold ${
              row.type === "Credit" ? "text-success" : "text-danger"
            }`}
          >
            {row.type}
          </span>
        </div>
      ),
    },
    {
      key: "amount",
      header: "Amount",
      align: "right",
      render: (row) => (
        <span
          className={`font-bold ${
            row.type === "Credit" ? "text-success" : "text-danger"
          }`}
        >
          {row.type === "Debit" ? "-" : "+"}₹{row.amount.toLocaleString()}
        </span>
      ),
    },
    {
      key: "status",
      header: "Status",
      render: (row) => (
        <span
          className={`inline-flex items-center gap-1 px-3 py-1 rounded-full text-[10px] font-bold ${
            row.status === "Cleared"
              ? "bg-success text-success"
              : "bg-warning text-warning"
          }`}
        >
          {row.status === "Cleared" ? <FaCheckCircle /> : <FaClock />}
          {row.status}
        </span>
      ),
    },
    {
      key: "id",
      header: "Actions",
      align: "center",
      render: () => (
        <button className="text-primary">
          <FaEdit />
        </button>
      ),
    },
  ];

  return (
    <div className="space-y-6 bg-app p-6">
      {/* Bank Accounts */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {bankAccounts.map((acc) => (
          <div
            key={acc.id}
            className="bg-card border border-theme rounded-xl p-5"
          >
            <p className="text-xs text-muted uppercase mb-1">
              {acc.type} Account
            </p>
            <p className="font-semibold text-main">{acc.name}</p>
            <p className="text-xs text-muted font-mono">{acc.number}</p>
            <p className="text-xl font-bold text-main mt-3">
              ₹{acc.balance.toLocaleString()}
            </p>
          </div>
        ))}
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {stats.map((s, i) => (
          <div key={i} className="bg-card border border-theme rounded-lg p-4">
            <p className="text-xs text-muted">{s.label}</p>
            <p className="text-xl font-bold text-main mt-1">{s.value}</p>
          </div>
        ))}
      </div>

      {/* Filters */}
      <div className="bg-card border border-theme rounded-lg p-4 flex flex-wrap gap-3 justify-between">
        <div className="flex gap-2 flex-wrap">
          <select
            value={selectedAccount}
            onChange={(e) => setSelectedAccount(e.target.value)}
            className="filter-input-refined"
          >
            <option value="all">All Accounts</option>
            {bankAccounts.map((acc) => (
              <option key={acc.id} value={acc.name}>
                {acc.name}
              </option>
            ))}
          </select>

          <div className="relative">
            <FaSearch className="absolute left-3 top-1/2 -translate-y-1/2 text-muted text-xs" />
            <input
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Search transactions..."
              className="pl-9 pr-3 py-2 filter-input-refined"
            />
          </div>

          <div className="relative">
            <button
              onClick={() => setShowFilterDropdown(!showFilterDropdown)}
              className="px-4 py-2 border border-theme rounded-lg bg-card text-main flex items-center gap-2 capitalize"
            >
              <FaFilter /> {filterType}
            </button>

            {showFilterDropdown && (
              <div className="absolute top-full mt-2 bg-card border border-theme rounded-lg z-20">
                {["all", "credit", "debit"].map((t) => (
                  <button
                    key={t}
                    onClick={() => {
                      setFilterType(t);
                      setShowFilterDropdown(false);
                    }}
                    className="block w-full text-left px-4 py-2 row-hover capitalize"
                  >
                    {t}
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
            <FaPlus /> New Transaction
          </button>
        </div>
      </div>

      {/* Table */}
      <Table<Transaction>
        columns={columns}
        data={filteredTransactions}
        emptyMessage="No transactions found matching your criteria."
        showToolbar={false}
      />

      {/* Cash Flow Summary */}
      <div className="bg-card border border-theme rounded-lg p-6">
        <h3 className="text-lg font-semibold text-main mb-4">
          Monthly Cash Flow
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="bg-success rounded-lg p-4 text-center">
            <p className="text-xs">Total Inflow</p>
            <p className="text-xl font-bold">₹18.25L</p>
          </div>
          <div className="bg-danger rounded-lg p-4 text-center">
            <p className="text-xs">Total Outflow</p>
            <p className="text-xl font-bold">₹12.40L</p>
          </div>
          <div className="bg-info rounded-lg p-4 text-center">
            <p className="text-xs">Net Cash Flow</p>
            <p className="text-xl font-bold">₹5.85L</p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Banking;
