import React, { Suspense, useMemo, useState } from "react";
import { PiggyBank, Wallet, ArrowLeftRight, PlusCircle, TrendingUp, Settings2, ClipboardList } from "lucide-react";
import { AppPage, AppPageHeader, AppPageBody } from "../../components/ui/app-shell";
import AppSkeleton from "../../components/ui/AppSkeleton";
import { HrContentFrame, HrPrimaryTabs } from "../hr/components/HrTabLayout";
import { useUrlTab } from "../../hooks/useUrlTab";
import { usePermission } from "../../hooks/permission/usePermission";

import BudgetSetup from "./BudgetSetup";
import Budget from "./Budget/budget";
import CreateBudgetPlan from "./Budget/addBudgetModal";
import BranchBudgetRequest from "./request/request";
import BudgetTransfer from "./Transfer/Transfer";
import SupplementaryBudget from "./Supplementary Budget/SuppBudget";
import Variance from "./Variance/variance";

const BUDGET_BASE_PATH = "/Budget-Management";

const BUDGET_TABS = [
  { id: "setup", label: "Setup", icon: <Settings2 size={14} />, modules: ["Budget Head"] },
  { id: "budget", label: "Budget", icon: <Wallet size={14} />, modules: ["Budget"] },
  { id: "request", label: "Request", icon: <ClipboardList size={14} />, modules: ["Request"] },
  { id: "transfer", label: "Transfer", icon: <ArrowLeftRight size={14} />, modules: ["Budget"] },
  { id: "supplementary", label: "Supplementary Budget", icon: <PlusCircle size={14} />, modules: ["Budget"] },
  { id: "variance", label: "Variance", icon: <TrendingUp size={14} />, modules: ["Budget"] },
];

const BudgetManagement: React.FC = () => {
  const { canAccessAnyOf, permissions, isAdmin } = usePermission();
  const [creating, setCreating] = useState(false);

  const tabs = useMemo(
    () => BUDGET_TABS.filter((t) => canAccessAnyOf(t.modules)),
    [canAccessAnyOf, permissions, isAdmin],
  );

  const [tab, setTab] = useUrlTab({
    tabs,
    defaultTab: tabs[0]?.id ?? BUDGET_TABS[0].id,
    basePath: BUDGET_BASE_PATH,
    pathPrefix: BUDGET_BASE_PATH,
  });

  if (tabs.length === 0) return null;

  return (
    <AppPage>
      <AppPageHeader
        title="Budget Management"
        icon={<PiggyBank size={18} />}
        description="Plan budgets, transfer allocations, add supplementary funds, and track variance"
      />
      <HrPrimaryTabs tabs={tabs} activeTab={tab} onChange={setTab} />
      <AppPageBody>
        <Suspense fallback={<AppSkeleton />}>
          <HrContentFrame>
            {tab === "setup" && <BudgetSetup />}
            {tab === "budget" &&
              (creating ? (
                <CreateBudgetPlan onBack={() => setCreating(false)} />
              ) : (
                <Budget onAddBudget={() => setCreating(true)} onEditBudget={() => setCreating(true)} />
              ))}
            {tab === "request" && <BranchBudgetRequest />}
            {tab === "transfer" && <BudgetTransfer />}
            {tab === "supplementary" && <SupplementaryBudget />}
            {tab === "variance" && <Variance />}
          </HrContentFrame>
        </Suspense>
      </AppPageBody>
    </AppPage>
  );
};

export default BudgetManagement;