import React, { useState, useMemo } from "react";
import { CreditCard } from "lucide-react";
import { usePermission } from "../../hooks/permission/usePermission";
import {
  AppPage,
  AppPageBody,
  AppPageHeader,
  AppTabs,
} from "../../components/ui/app-shell";
import ExpenseHistory from "./expenseManagemetTable";
import ExpenseTypeTable from "./expenseTypeTable";
import EmployeeAdvanceTable from "./employeeAdvanceTable";
const ALL_EXPENSE_TABS = [
  {
    id: "expenseType",
    label: "Expense Type",
    icon: <CreditCard size={16} strokeWidth={1.75} />,
    module: "Expense Claim Type",
    action: "read" as const,
  },
  {
    id: "expenseHistory",
    label: "Expense Claim",
    icon: <CreditCard size={16} strokeWidth={1.75} />,
    module: "Expense Claim",
    action: "read" as const,
  },
  {
    id: "advance",
    label: "Employee Advance",
    icon: <CreditCard size={16} strokeWidth={1.75} />,
    module: "Employee Advance",
    action: "read" as const,
  },
  
];

const ExpenseManagement: React.FC = () => {
  const [activeTab, setActiveTab] = useState("expenseType");

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
        icon={<CreditCard />}
      />  

      <AppTabs
        tabs={expenseTabs}
        activeTab={resolvedTab}
        onChange={(tabId) => setActiveTab(tabId)}
      />

      <AppPageBody viewportLocked={isDashboardTab}>
        {resolvedTab === "expenseType" && <ExpenseTypeTable />}
        {resolvedTab === "expenseHistory" && <ExpenseHistory />}
        {resolvedTab === "advance" && <EmployeeAdvanceTable />}
      </AppPageBody>
    </AppPage>
  );
};

export default ExpenseManagement;