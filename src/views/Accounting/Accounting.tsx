import React, { useState, Suspense, lazy, useCallback } from "react";
import { useSearchParams, useNavigate, useLocation } from "react-router-dom";
import {
  BookOpen,
  Scale,
  ArrowDownCircle,
  ArrowUpCircle,
  BarChart3,
  FileBarChart,
  Wallet,
  Repeat 
} from "lucide-react";
import {
  AppPage,
  AppPageBody,
  AppPageHeader,
  AppTabs,
} from "../../components/ui/app-shell";
import AppSkeleton from "../../components/ui/AppSkeleton";

// ─── Lazy Imports ─────────────────────────────────────────────────────────────

const GeneralLedger = lazy(() => import("./GeneralLedger"));
const TrialBalance  = lazy(() => import("./TrialBalance"));
const ProfitLoss    = lazy(() => import("./ProfitLoss"));
const BalanceSheet  = lazy(() => import("./BalanceSheet"));
const CashFlow      = lazy(() => import("./CashFlow"));
const AccountsReceivable = lazy(() => import("./AccountsReceivable"));
const AccountsPayable    = lazy(() => import("./AccountsPayable"));
const Banking            = lazy(() => import("./BankingModule"));

// ─── Tab Definitions ──────────────────────────────────────────────────────────

const iconProps = {
  size: 16,
  strokeWidth: 1.75,
};

const allTabs = [
  {
    id: "gl",
    label: "General Ledger",
    icon: <BookOpen {...iconProps} />,
  },
  {
    id: "trial",
    label: "Trial Balance",
    icon: <Scale {...iconProps} />,
  },
  {
    id: "ar",
    label: "Receivables",
    icon: <ArrowDownCircle {...iconProps} />,
  },
  {
    id: "ap",
    label: "Payables",
    icon: <ArrowUpCircle {...iconProps} />,
  },

  // {
  //   id: "bank",
  //   label: "Banking",
  //   icon: <Landmark {...iconProps} />, 
  // },

  {
    id: "pl",
    label: "Profit & Loss",
    icon: <BarChart3 {...iconProps} />,
  },
  {
    id: "balance",
    label: "Balance Sheet",
    icon: <FileBarChart {...iconProps} />,
  },
  {
    id: "cashflow",
    label: "Cash Flow",
    icon: <Repeat {...iconProps} />,
  },
];

const DEFAULT_TAB = "gl";

// ─── Component ────────────────────────────────────────────────────────────────

const AccountingModule: React.FC = () => {
  const [searchParams] = useSearchParams();
  const navigate       = useNavigate();
  const location       = useLocation();

  const activeTab = searchParams.get("tab") || DEFAULT_TAB;

  const handleTabChange = useCallback(
    (tabId: string) => {
      const newParams = new URLSearchParams(searchParams);
      newParams.set("tab", tabId);
      navigate(`${location.pathname}?${newParams.toString()}`, { replace: true });
    },
    [navigate, location.pathname, searchParams]
  );

  // ── GL sub-tab state (owned here because GeneralLedger receives it as a prop) ──
  const [glSubTab, setGlSubTab]   = useState<string>("chart");
  const [searchTerm, setSearchTerm] = useState<string>("");

  // ─── Tab → Component map ──────────────────────────────────────────────────

  const renderTab = () => {
    switch (activeTab) {
      case "gl":
        return (
          <GeneralLedger
            glSubTab={glSubTab}
            setGlSubTab={setGlSubTab}
            accounts={[]}
            searchTerm={searchTerm}
            setSearchTerm={setSearchTerm}
            selectedFilter="all"
            setSelectedFilter={() => {}}
            showFilterDropdown={false}
            setShowFilterDropdown={() => {}}
            handleFilterSelect={() => {}}
            getFilterLabel={() => "All Accounts"}
            getFilterCount={() => 0}
            journalEntries={[]}
          />
        );

      case "trial":
        return <TrialBalance />;

      case "pl":
        return <ProfitLoss />;

      case "balance":
        return <BalanceSheet />;

      case "ar":
        return <AccountsReceivable />;

      case "ap":
        return <AccountsPayable />;

      case "bank":
        return <Banking />;

      case "cashflow":
        return <CashFlow />;

      default:
        return (
          <GeneralLedger
            glSubTab={glSubTab}
            setGlSubTab={setGlSubTab}
            accounts={[]}
            searchTerm={searchTerm}
            setSearchTerm={setSearchTerm}
            selectedFilter="all"
            setSelectedFilter={() => {}}
            showFilterDropdown={false}
            setShowFilterDropdown={() => {}}
            handleFilterSelect={() => {}}
            getFilterLabel={() => "All Accounts"}
            getFilterCount={() => 0}
            journalEntries={[]}
          />
        );
    }
  };

  // ─── Render ───────────────────────────────────────────────────────────────

  return (
    <AppPage>
      <AppPageHeader
        title="Accounting"
        description="Handle ledgers, reporting, and finance operations in one workflow"
        icon={<Wallet />}
      />
      <AppTabs tabs={allTabs} activeTab={activeTab} onChange={handleTabChange} />
      <AppPageBody>
        <Suspense fallback={<AppSkeleton />}>
          {renderTab()}
        </Suspense>
      </AppPageBody>
    </AppPage>
  );
};

export default AccountingModule;