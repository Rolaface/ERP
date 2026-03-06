import React, { useState } from "react";
import Table from "../../components/ui/Table/Table";
import type { Column } from "../../components/ui/Table/type";

type Account = {
  code: string;
  name: string;
  type: string;
  balance: number;
  parent: string;
  status: string;
  category?: string;
};

type JournalEntry = {
  id: string;
  date: string;
  description: string;
  status: string;
  entries: { account: string; debit: number; credit: number }[];
};

type Props = {
  glSubTab: string;
  setGlSubTab: (tab: string) => void;
  accounts: Account[];
  searchTerm: string;
  setSearchTerm: (val: string) => void;
  selectedFilter: string;
  setSelectedFilter: (filter: string) => void;
  handleFilterSelect: (filter: string) => void;
  getFilterLabel: () => string;
  getFilterCount: (filter: string) => number;
  journalEntries: JournalEntry[];
};

const GeneralLedger: React.FC<Props> = ({
  glSubTab,
  setGlSubTab,
  accounts,
  searchTerm,
  setSearchTerm,
  selectedFilter,
  setSelectedFilter,
  handleFilterSelect,
  getFilterLabel,
  getFilterCount,
  journalEntries,
}) => {
  const [journalFilter, setJournalFilter] = useState("all");

  const filteredAccounts = accounts
    .filter((acc) => {
      if (selectedFilter === "all") return true;
      if (selectedFilter === "active") return acc.status === "active";
      if (selectedFilter === "inactive") return acc.status === "inactive";
      return acc.category === selectedFilter;
    })
    .filter(
      (a) =>
        a.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        a.code.includes(searchTerm),
    );

  const filteredJournalEntries = journalEntries.filter((entry) => {
    if (journalFilter === "all") return true;
    return entry.status.toLowerCase() === journalFilter;
  });

  /* -------------------- TABLE COLUMNS -------------------- */

  const accountColumns: Column<Account>[] = [
    { key: "code", header: "Account Code" },
    { key: "name", header: "Account Name" },
    {
      key: "type",
      header: "Type",
      render: (row) => (
        <span className="px-2 py-1 rounded bg-info text-info text-[10px] font-bold">
          {row.type}
        </span>
      ),
    },
    {
      key: "balance",
      header: "Balance",
      align: "right",
      render: (row) => row.balance.toLocaleString(),
    },
    { key: "parent", header: "Parent Account" },
    {
      key: "status",
      header: "Status",
      render: (row) => (
        <span
          className={`px-2 py-1 rounded-full text-[10px] font-bold ${
            row.status === "active"
              ? "bg-success text-success"
              : "bg-danger text-danger"
          }`}
        >
          {row.status}
        </span>
      ),
    },
  ];

  const journalColumns: Column<JournalEntry>[] = [
    { key: "id", header: "Entry #" },
    { key: "date", header: "Date" },
    { key: "description", header: "Description" },
    {
      key: "status",
      header: "Status",
      render: (row) => (
        <span
          className={`px-2 py-1 rounded-full text-[10px] font-bold ${
            row.status.toLowerCase() === "posted"
              ? "bg-success text-success"
              : "bg-warning text-warning"
          }`}
        >
          {row.status}
        </span>
      ),
    },
  ];

  return (
    <div className="p-6 bg-app">
      {/* Tabs */}
      <div className="flex gap-6 border-b border-theme mb-6">
        <button
          onClick={() => setGlSubTab("chart")}
          className={`pb-3 border-b-2 ${
            glSubTab === "chart"
              ? "text-primary border-current"
              : "text-muted hover:text-main"
          }`}
        >
          Chart of Accounts
        </button>
        <button
          onClick={() => setGlSubTab("journal")}
          className={`pb-3 border-b-2 ${
            glSubTab === "journal"
              ? "text-primary border-current"
              : "text-muted hover:text-main"
          }`}
        >
          Journal Entries
        </button>
      </div>

      {glSubTab === "chart" ? (
        <Table<Account>
          columns={accountColumns}
          data={filteredAccounts}
          showToolbar
          enableAdd
          addLabel="+ Add Account"
          searchValue={searchTerm}
          onSearch={setSearchTerm}
          onAdd={() => alert("Add Account")}
          emptyMessage="No accounts found"
        />
      ) : (
        <Table<JournalEntry>
          columns={journalColumns}
          data={filteredJournalEntries}
          showToolbar
          enableAdd
          addLabel="+ New Entry"
          onAdd={() => alert("New Journal Entry")}
          emptyMessage="No journal entries found"
        />
      )}
    </div>
  );
};

export default GeneralLedger;
