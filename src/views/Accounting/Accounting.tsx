import React, { useState, Suspense, lazy, useCallback } from "react";
import { useSearchParams, useNavigate, useLocation } from "react-router-dom";
import {
  FaBriefcase,
  FaChartPie,
  FaChartBar,
  FaCalendar,
  FaDollarSign,
  FaFileInvoiceDollar,
  FaMoneyCheckAlt,
  FaWarehouse,
  FaUniversity,
} from "react-icons/fa";
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

const allTabs = [
  { id: "gl",       label: "General Ledger", icon: <FaChartPie /> },
  { id: "trial",    label: "Trial Balance",  icon: <FaChartBar /> },
  { id: "ar",       label: "Receivables",    icon: <FaFileInvoiceDollar /> },
  { id: "ap",       label: "Payables",       icon: <FaMoneyCheckAlt /> },
  { id: "bank",     label: "Banking",        icon: <FaUniversity /> },
  { id: "pl",       label: "Profit & Loss",  icon: <FaCalendar /> },
  { id: "balance",  label: "Balance Sheet",  icon: <FaDollarSign /> },
  { id: "cashflow", label: "Cash Flow",      icon: <FaBriefcase /> },
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
        description="Core ledgers, reports, and finance operations in the shared ERP layout."
        icon={<FaBriefcase />}
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