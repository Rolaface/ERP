import React, { useState } from "react";
import {
  FaBriefcase,
  FaChartPie,
  FaCalendar,
  FaChartBar,
  FaDollarSign,
  FaFileInvoiceDollar,
  FaMoneyCheckAlt,
  FaWarehouse,
  FaUniversity,
} from "react-icons/fa";

// Import existing components (your originals - unchanged)
import GeneralLedger from "./GeneralLedger";
import TrialBalance from "./TrialBalance";
import ProfitLoss from "./ProfitLoss";
import BalanceSheet from "./BalanceSheet";

// Import NEW components
import AccountsReceivable from "./AccountsReceivable";
import AccountsPayable from "./AccountsPayable";
import FixedAssets from "./FixedAssets";
import Banking from "./BankingModule";

// TYPE DEFINITIONS (existing - unchanged)
type Account = {
  code: string;
  name: string;
  type: string;
  balance: number;
  parent: string;
  status: string;
  category?: string;
};

type TrialBalanceAccount = {
  code: string;
  name: string;
  debit: number;
  credit: number;
};

type ProfitLossData = {
  revenue: number;
  expenses: number;
  grossProfit: number;
  operatingExpenses: number;
  netIncome: number;
  activeAccounts: Account[];
};

type BalanceSheetData = {
  assets: number;
  liabilities: number;
  equity: number;
  currentAssets: number;
  fixedAssets: number;
  currentLiabilities: number;
  longTermLiabilities: number;
  activeAccounts: Account[];
};

// Sample Data (existing - unchanged)
const accounts: Account[] = [
  {
    code: "1000",
    name: "Cash",
    type: "Asset",
    balance: 150000,
    parent: "Current Assets",
    status: "active",
    category: "asset",
  },
  {
    code: "1100",
    name: "Petty Cash",
    type: "Asset",
    balance: 5000,
    parent: "Current Assets",
    status: "active",
    category: "asset",
  },
  {
    code: "1200",
    name: "Accounts Receivable",
    type: "Asset",
    balance: 85000,
    parent: "Current Assets",
    status: "active",
    category: "asset",
  },
  {
    code: "1300",
    name: "Prepaid Expenses",
    type: "Asset",
    balance: 10000,
    parent: "Current Assets",
    status: "inactive",
    category: "asset",
  },
  {
    code: "2000",
    name: "Accounts Payable",
    type: "Liability",
    balance: 45000,
    parent: "Current Liabilities",
    status: "inactive",
    category: "liability",
  },
  {
    code: "2500",
    name: "Long-term Debt",
    type: "Liability",
    balance: 180000,
    parent: "Long-term Liabilities",
    status: "active",
    category: "liability",
  },
  {
    code: "3000",
    name: "Owner's Equity",
    type: "Equity",
    balance: 250000,
    parent: "Capital",
    status: "active",
    category: "equity",
  },
  {
    code: "3100",
    name: "Retained Earnings",
    type: "Equity",
    balance: 75000,
    parent: "Capital",
    status: "inactive",
    category: "equity",
  },
];

const trialBalance: TrialBalanceAccount[] = [
  { code: "1000", name: "Cash", debit: 150000, credit: 0 },
  { code: "1100", name: "Petty Cash", debit: 5000, credit: 0 },
  { code: "1200", name: "Accounts Receivable", debit: 85000, credit: 0 },
  { code: "2000", name: "Accounts Payable", debit: 0, credit: 45000 },
  { code: "2500", name: "Long-term Debt", debit: 0, credit: 180000 },
  { code: "3000", name: "Owner's Equity", debit: 0, credit: 250000 },
  { code: "4000", name: "Sales Revenue", debit: 0, credit: 500000 },
  { code: "5000", name: "Cost of Goods Sold", debit: 200000, credit: 0 },
];

const totalDebit = trialBalance.reduce((sum, acc) => sum + acc.debit, 0);
const totalCredit = trialBalance.reduce((sum, acc) => sum + acc.credit, 0);

const journalEntries = [
  {
    id: "JE-001",
    date: "2025-11-01",
    description: "Sales Invoice #1001",
    status: "Posted",
    entries: [
      { account: "4000 - Sales Revenue", debit: 0, credit: 50000 },
      { account: "1000 - Cash", debit: 50000, credit: 0 },
    ],
  },
  {
    id: "JE-002",
    date: "2025-11-03",
    description: "Purchase Office Supplies",
    status: "Posted",
    entries: [
      { account: "6000 - Office Supplies Expense", debit: 2000, credit: 0 },
      { account: "2000 - Accounts Payable", debit: 0, credit: 2000 },
    ],
  },
  {
    id: "JE-003",
    date: "2025-11-05",
    description: "Payroll - October",
    status: "Draft",
    entries: [
      { account: "6100 - Salaries Expense", debit: 15000, credit: 0 },
      { account: "1000 - Cash", debit: 0, credit: 15000 },
    ],
  },
  {
    id: "JE-004",
    date: "2025-11-07",
    description: "Bank Loan Received",
    status: "Posted",
    entries: [
      { account: "1000 - Cash", debit: 300000, credit: 0 },
      { account: "2500 - Bank Loan", debit: 0, credit: 300000 },
    ],
  },
  {
    id: "JE-005",
    date: "2025-11-08",
    description: "Utility Bills Payment",
    status: "Posted",
    entries: [
      { account: "6200 - Utilities Expense", debit: 1200, credit: 0 },
      { account: "1000 - Cash", debit: 0, credit: 1200 },
    ],
  },
];

const profitLoss: ProfitLossData = {
  revenue: 500000,
  expenses: 200000,
  grossProfit: 300000,
  operatingExpenses: 100000,
  netIncome: 200000,
  activeAccounts: [
    {
      code: "4000",
      name: "Sales Revenue",
      type: "Revenue",
      balance: 500000,
      parent: "Income",
      status: "active",
      category: "income",
    },
    {
      code: "5000",
      name: "Cost of Goods Sold",
      type: "Expense",
      balance: 200000,
      parent: "Cost of Sales",
      status: "active",
      category: "expense",
    },
    {
      code: "6000",
      name: "Operating Expenses",
      type: "Expense",
      balance: 100000,
      parent: "Operating Expenses",
      status: "active",
      category: "expense",
    },
  ],
};

const balanceSheet: BalanceSheetData = {
  assets: 500000,
  liabilities: 300000,
  equity: 200000,
  currentAssets: 200000,
  fixedAssets: 300000,
  currentLiabilities: 100000,
  longTermLiabilities: 200000,
  activeAccounts: [
    {
      code: "1000",
      name: "Cash",
      type: "Asset",
      balance: 150000,
      parent: "Current Assets",
      status: "active",
      category: "asset",
    },
    {
      code: "1100",
      name: "Petty Cash",
      type: "Asset",
      balance: 5000,
      parent: "Current Assets",
      status: "active",
      category: "asset",
    },
    {
      code: "1200",
      name: "Accounts Receivable",
      type: "Asset",
      balance: 45000,
      parent: "Current Assets",
      status: "active",
      category: "asset",
    },
    {
      code: "1300",
      name: "Equipment",
      type: "Asset",
      balance: 300000,
      parent: "Fixed Assets",
      status: "active",
      category: "asset",
    },
    {
      code: "2000",
      name: "Accounts Payable",
      type: "Liability",
      balance: 100000,
      parent: "Current Liabilities",
      status: "active",
      category: "liability",
    },
    {
      code: "2500",
      name: "Long-term Debt",
      type: "Liability",
      balance: 200000,
      parent: "Long-term Liabilities",
      status: "active",
      category: "liability",
    },
    {
      code: "3000",
      name: "Owner's Equity",
      type: "Equity",
      balance: 200000,
      parent: "Capital",
      status: "active",
      category: "equity",
    },
  ],
};

const monthNames: { [key: string]: string } = {
  "01": "January",
  "02": "February",
  "03": "March",
  "04": "April",
  "05": "May",
  "06": "June",
  "07": "July",
  "08": "August",
  "09": "September",
  "10": "October",
  "11": "November",
  "12": "December",
};

// CLEAN Tab Structure - Simple and Direct
const allTabs = [
  { id: "gl", name: "General Ledger", icon: <FaChartPie />, category: "core" },
  {
    id: "trial",
    name: "Trial Balance",
    icon: <FaChartBar />,
    category: "core",
  },
  {
    id: "ar",
    name: "Receivables",
    icon: <FaFileInvoiceDollar />,
    category: "operations",
  },
  {
    id: "ap",
    name: "Payables",
    icon: <FaMoneyCheckAlt />,
    category: "operations",
  },
  {
    id: "fa",
    name: "Fixed Assets",
    icon: <FaWarehouse />,
    category: "operations",
  },
  {
    id: "bank",
    name: "Banking",
    icon: <FaUniversity />,
    category: "operations",
  },
  {
    id: "pl",
    name: "Profit & Loss",
    icon: <FaCalendar />,
    category: "reports",
  },
  {
    id: "balance",
    name: "Balance Sheet",
    icon: <FaDollarSign />,
    category: "reports",
  },
];

// Main component
const AccountingModule: React.FC = () => {
  const [activeTab, setActiveTab] = useState<string>("gl");
  const [glSubTab, setGlSubTab] = useState<string>("chart");
  const [searchTerm, setSearchTerm] = useState<string>("");
  const [selectedFilter, setSelectedFilter] = useState<string>("all");
  const [showFilterDropdown, setShowFilterDropdown] = useState<boolean>(false);
  const [reportPeriod, setReportPeriod] = useState<string>("monthly");
  const [reportYear, setReportYear] = useState<string>("2024");
  const [reportMonth, setReportMonth] = useState<string>("11");

  const getFilterLabel = (): string => {
    const labels: { [key: string]: string } = {
      all: "All Accounts",
      active: "Active Accounts",
      inactive: "Inactive Accounts",
      asset: "Asset Accounts",
      liability: "Liability Accounts",
      equity: "Equity Accounts",
      income: "Income Accounts",
      expense: "Expense Accounts",
    };
    return labels[selectedFilter] || "All Accounts";
  };

  const getFilterCount = (filter: string): number => {
    if (filter === "all") return accounts.length;
    if (filter === "active")
      return accounts.filter((a) => a.status === "active").length;
    if (filter === "inactive")
      return accounts.filter((a) => a.status === "inactive").length;
    if (filter === "asset")
      return accounts.filter((a) => a.category === "asset").length;
    if (filter === "liability")
      return accounts.filter((a) => a.category === "liability").length;
    if (filter === "equity")
      return accounts.filter((a) => a.category === "equity").length;
    if (filter === "income")
      return accounts.filter((a) => a.category === "income").length;
    if (filter === "expense")
      return accounts.filter((a) => a.category === "expense").length;
    return 0;
  };

  const handleFilterSelect = (filter: string): void => {
    setSelectedFilter(filter);
    setShowFilterDropdown(false);
  };

  return (
    <div className="p-6 bg-app ">
      {/* Header */}

      <div className="flex items-center justify-between mb-6">
        <h2 className="text-2xl font-bold flex items-center gap-2 text-main">
          <FaBriefcase />
          Accounting
        </h2>
      </div>

      {/* Clean Single-Row Tabs */}
      <div className="flex border-b border-gray-200 mb-4">
        {allTabs.map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`px-4 py-2 font-medium flex items-center gap-2 transition-colors  ${
              activeTab === tab.id
                ? "text-primary border-b-2 border-current"
                : "text-muted hover:text-main"
            }`}
          >
            <span className="text-lg">{tab.icon}</span>
            {tab.name}
          </button>
        ))}
      </div>

      {/* Content */}
      <div>
        {activeTab === "gl" && (
          <GeneralLedger
            glSubTab={glSubTab}
            setGlSubTab={setGlSubTab}
            accounts={accounts}
            searchTerm={searchTerm}
            setSearchTerm={setSearchTerm}
            selectedFilter={selectedFilter}
            setSelectedFilter={setSelectedFilter}
            showFilterDropdown={showFilterDropdown}
            setShowFilterDropdown={setShowFilterDropdown}
            handleFilterSelect={handleFilterSelect}
            getFilterLabel={getFilterLabel}
            getFilterCount={getFilterCount}
            journalEntries={journalEntries}
          />
        )}
        {activeTab === "trial" && (
          <TrialBalance
            trialBalance={trialBalance}
            totalDebit={totalDebit}
            totalCredit={totalCredit}
            reportMonth={reportMonth}
            reportYear={reportYear}
            setReportMonth={setReportMonth}
            setReportYear={setReportYear}
            monthNames={monthNames}
          />
        )}
        {activeTab === "pl" && (
          <ProfitLoss
            profitLoss={profitLoss}
            reportPeriod={reportPeriod}
            setReportPeriod={setReportPeriod}
            reportYear={reportYear}
            setReportYear={setReportYear}
            reportMonth={reportMonth}
            setReportMonth={setReportMonth}
            monthNames={monthNames}
          />
        )}
        {activeTab === "balance" && (
          <BalanceSheet
            balanceSheet={balanceSheet}
            reportYear={reportYear}
            setReportYear={setReportYear}
            monthNames={monthNames}
            profitLoss={profitLoss}
          />
        )}

        {/* NEW MODULES */}
        {activeTab === "ar" && <AccountsReceivable />}
        {activeTab === "ap" && <AccountsPayable />}
        {activeTab === "fa" && <FixedAssets />}
        {activeTab === "bank" && <Banking />}
      </div>
    </div>
  );
};

export default AccountingModule;
