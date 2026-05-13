import React, { useMemo } from "react";
import COATab from "./COA";
import JETab, { type JournalEntry } from "./JE";
import { FolderTree, BookText } from "lucide-react";
import { usePermission } from "../../hooks/permission/usePermission";

/*
   Types
*/
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
   GeneralLedger — tab shell only
*/
const GeneralLedger: React.FC<Props> = ({
  glSubTab,
  setGlSubTab,
  searchTerm,
  setSearchTerm,
  journalEntries,
}) => {
  const { can } = usePermission();

  const glTabs = useMemo(
    () =>
      [
        {
          id: "chart",
          label: "Chart of Accounts",
          icon: <FolderTree size={16} strokeWidth={1.75} />,
          module: "Account",
          action: "read" as const,
        },
        {
          id: "journal",
          label: "Journal Entries",
          icon: <BookText size={16} strokeWidth={1.75} />,
          module: "Journal Entry",
          action: "read" as const,
        },
      ].filter((tab) => can(tab.module, tab.action)),
    [can]
  );

  return (
    <div className="bg-app">
      {/* Sub-tabs */}
      <div className="flex gap-6 border-b border-[var(--border)] mb-6">
        {glTabs.map((tab) => (
          <button
            key={tab.id}
            onClick={() => setGlSubTab(tab.id)}
            className={`flex items-center gap-2 pb-3 border-b-2 text-sm font-medium transition-colors ${
              glSubTab === tab.id
                ? "text-primary border-current"
                : "text-muted hover:text-main border-transparent"
            }`}
          >
            {tab.icon}
            <span>{tab.label}</span>
          </button>
        ))}
      </div>

      {/* Content */}
      {glSubTab === "journal" ? (
        <JETab journalEntries={journalEntries} />
      ) : (
        <COATab
          searchTerm={searchTerm}
          setSearchTerm={setSearchTerm}
        />
      )}
    </div>
  );
};

export default GeneralLedger;