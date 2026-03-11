import React, { useState } from "react";
import COATab from "./COA";
import JETab, { type JournalEntry } from "./JE";

/*
   Types */
type Account = {
  code: string;
  name: string;
  type: string;
  balance: number;
  parent: string;
  status: string;
  category?: string;
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
  showFilterDropdown: boolean;
  setShowFilterDropdown: (val: boolean) => void;
};

/*
   GeneralLedger — tab shell only */
const GeneralLedger: React.FC<Props> = ({
  glSubTab,
  setGlSubTab,
  searchTerm,
  setSearchTerm,
  journalEntries,
}) => {
  return (
    <div className="p-6 bg-app">
      {/* Sub-tabs */}
      <div className="flex gap-6 border-b border-[var(--border)] mb-6">
        <button
          onClick={() => setGlSubTab("chart")}
          className={`pb-3 border-b-2 text-sm font-medium transition-colors ${
            glSubTab === "chart"
              ? "text-primary border-current"
              : "text-muted hover:text-main border-transparent"
          }`}
        >
          Chart of Accounts
        </button>
        <button
          onClick={() => setGlSubTab("journal")}
          className={`pb-3 border-b-2 text-sm font-medium transition-colors ${
            glSubTab === "journal"
              ? "text-primary border-current"
              : "text-muted hover:text-main border-transparent"
          }`}
        >
          Journal Entries
        </button>
      </div>

      {glSubTab === "chart" ? (
        <COATab searchTerm={searchTerm} setSearchTerm={setSearchTerm} />
      ) : (
        <JETab journalEntries={journalEntries} />
      )}
    </div>
  );
};

export default GeneralLedger;