import React, { useState } from "react";
import Table from "../../components/ui/Table/Table";
import type { Column } from "../../components/ui/Table/type";

/* ─────────────────────────────────────────────
   Types
───────────────────────────────────────────── */
export type JournalEntry = {
  id: string;
  date: string;
  description: string;
  status: string;
  entries: { account: string; debit: number; credit: number }[];
};

export interface JETabProps {
  journalEntries: JournalEntry[];
}

/* ─────────────────────────────────────────────
   Columns
───────────────────────────────────────────── */
const journalColumns: Column<JournalEntry>[] = [
  { key: "id", header: "Entry #", align: "left" },
  { key: "date", header: "Date", align: "left" },
  { key: "description", header: "Description", align: "left" },
  {
    key: "status",
    header: "Status",
    align: "left",
    render: (row: JournalEntry) => (
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

/* ─────────────────────────────────────────────
   JETab Component
───────────────────────────────────────────── */
const JETab: React.FC<JETabProps> = ({ journalEntries }) => {
  const [journalSearch, setJournalSearch] = useState("");

  const filteredEntries = journalEntries.filter(
    (entry) =>
      entry.id.toLowerCase().includes(journalSearch.toLowerCase()) ||
      entry.description.toLowerCase().includes(journalSearch.toLowerCase())
  );

  return (
    <Table<JournalEntry>
      columns={journalColumns}
      data={filteredEntries}
      showToolbar
      enableAdd
      addLabel="+ New Entry"
      searchValue={journalSearch}
      onSearch={setJournalSearch}
      onAdd={() => alert("New Journal Entry")}
      emptyMessage="No journal entries found"
    />
  );
};

export default JETab;