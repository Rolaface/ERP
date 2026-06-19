import React, { useState, Suspense, lazy, useMemo, useCallback } from "react";
import {
  BookOpen, Scale, ArrowDownCircle, ArrowUpCircle,
  BarChart3, FileBarChart, Wallet, Repeat
} from "lucide-react";
import {
  AppPage, AppPageBody, AppPageHeader, AppTabs,
} from "../../components/ui/app-shell";
import AppSkeleton from "../../components/ui/AppSkeleton";
import { usePermission } from "../../hooks/permission/usePermission";
import { useUrlTab } from "../../hooks/useUrlTab";
import GLView from "./glview";                              

const GeneralLedger      = lazy(() => import("./GeneralLedger"));
const TrialBalance       = lazy(() => import("./TrialBalance"));
const ProfitLoss         = lazy(() => import("./ProfitLoss"));
const BalanceSheet       = lazy(() => import("./BalanceSheet"));
const CashFlow           = lazy(() => import("./CashFlow"));
const AccountsReceivable = lazy(() => import("./AccountsReceivable"));
const AccountsPayable    = lazy(() => import("./AccountsPayable"));
const Banking            = lazy(() => import("./BankingModule"));

const iconProps = { size: 16, strokeWidth: 1.75 };

const allTabs = [
  { id: "gl",       label: "General Ledger", icon: <BookOpen {...iconProps} />,       module: null, action: "read" as const },
  { id: "trial",    label: "Trial Balance",  icon: <Scale {...iconProps} />,          module: "Account", action: "report" as const },
  { id: "ar",       label: "Receivables",    icon: <ArrowDownCircle {...iconProps} />, module:"Account", action: "report" as const },
  { id: "ap",       label: "Payables",       icon: <ArrowUpCircle {...iconProps} />,  module: "Account", action: "report" as const },
  { id: "pl",       label: "Profit & Loss",  icon: <BarChart3 {...iconProps} />,      module: "Account", action: "report" as const },
  { id: "balance",  label: "Balance Sheet",  icon: <FileBarChart {...iconProps} />,   module: "Account", action: "report" as const },
  { id: "cashflow", label: "Cash Flow",      icon: <Repeat {...iconProps} />,         module: "Account", action: "report" as const },
];

const DEFAULT_TAB = "gl";

const AccountingModule: React.FC = () => {
  const { can } = usePermission();

  const accountingTabs = useMemo(
    () => allTabs.filter((tab) => !tab.module || can(tab.module, tab.action)),
    [can]
  );

  const fallbackTab = accountingTabs[0]?.id ?? DEFAULT_TAB;
  const [resolvedTab, handleTabChange] = useUrlTab({
    tabs: accountingTabs,
    defaultTab: fallbackTab,
    basePath: "/accounting",
  });

  const [glSubTab, setGlSubTab]     = useState<string>("chart");
  const [searchTerm, setSearchTerm] = useState<string>("");

  // ── Ledger drill-down ───────────────────────────────────────────────────
  const [ledgerAccount, setLedgerAccount] = useState<string | null>(null);

  const handleViewLedger = useCallback((accountName: string) => {
    setLedgerAccount(accountName);
  }, []);

  const handleLedgerBack = useCallback(() => {
    setLedgerAccount(null);
  }, []);

  // ── Tab renderer ────────────────────────────────────────────────────────
  const glProps = {
    glSubTab, setGlSubTab,
    accounts: [],
    searchTerm, setSearchTerm,
    selectedFilter: "all",
    setSelectedFilter: () => {},
    showFilterDropdown: false,
    setShowFilterDropdown: () => {},
    handleFilterSelect: () => {},
    getFilterLabel: () => "All Accounts",
    getFilterCount: () => 0,
    journalEntries: [],
    onViewLedger: handleViewLedger,                       
  };

  const renderTab = () => {
    switch (resolvedTab) {
      case "gl":       return <GeneralLedger {...glProps} />;
      case "trial":    return <TrialBalance />;
      case "pl":       return <ProfitLoss />;
      case "balance":  return <BalanceSheet />;
      case "ar":       return <AccountsReceivable />;
      case "ap":       return <AccountsPayable />;
      case "bank":     return <Banking />;
      case "cashflow": return <CashFlow />;
      default:         return <GeneralLedger {...glProps} />;
    }
  };

  return (
    <AppPage>
      <AppPageHeader
        title="Accounting"
        description="Handle ledgers, reporting, and finance operations in one workflow"
        icon={<Wallet />}
      />
      <AppTabs
        tabs={accountingTabs}
        activeTab={resolvedTab}
        onChange={(tab) => {
          setLedgerAccount(null);                          
          handleTabChange(tab);
        }}
      />
      <AppPageBody>
        <Suspense fallback={<AppSkeleton />}>
          {ledgerAccount ? (
            <GLView account={ledgerAccount} onBack={handleLedgerBack} />
          ) : (
            renderTab()
          )}
        </Suspense>
      </AppPageBody>
    </AppPage>
  );
};

export default AccountingModule;