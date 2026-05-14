import React, { useState, useMemo } from "react";
import { ReceiptText, Wallet } from "lucide-react";
import { usePermission } from "../../hooks/permission/usePermission";
import {
  AppPage,
  AppPageBody,
  AppPageHeader,
  AppTabs,
} from "../../components/ui/app-shell";
import ExpenseHistory from "./expenseManagemetTable";
import ExpenseTypeTable from "./expenseTypeTable";
const ALL_EXPENSE_TABS = [
  {
    id: "expenseHistory",
    label: "Expense History",
    icon: <ReceiptText size={16} strokeWidth={1.75} />,
    module: "Expense History",
    action: "read" as const,
  },
  {
    id: "expenseType",
    label: "Expense Type",
    icon: <ReceiptText size={16} strokeWidth={1.75} />,
    module: "Expense Type",
    action: "read" as const,
  },
];

const ExpenseManagement: React.FC = () => {
  const [activeTab, setActiveTab] = useState("expenseHistory");

  const { can } = usePermission();

  const expenseTabs = useMemo(
    () =>
      ALL_EXPENSE_TABS.filter(
        (t) => !t.module || can(t.module, t.action)
      ),
    [can]
  );

  const resolvedTab =
    expenseTabs.find((t) => t.id === activeTab)?.id ??
    expenseTabs[0]?.id ??
    "expenseHistory";

  const isDashboardTab = resolvedTab === "expenseHistory";

  return (
    <AppPage viewportLocked={isDashboardTab}>
      <AppPageHeader
        title="Expense Management"
        description="Track and manage your expense records"
        icon={<Wallet />}
      />

      <AppTabs
        tabs={expenseTabs}
        activeTab={resolvedTab}
        onChange={(tabId) => setActiveTab(tabId)}
      />

      <AppPageBody viewportLocked={isDashboardTab}>
        {resolvedTab === "expenseHistory" && <ExpenseHistory />}
         {resolvedTab === "expenseType" && <ExpenseTypeTable />}
      </AppPageBody>
    </AppPage>
  );
};

export default ExpenseManagement;