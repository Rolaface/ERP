import React, { Suspense, useMemo, useState } from "react";
import {
  PiggyBank,
  Wallet,
  Eye,
  ArrowLeftRight,
  PlusCircle,
  TrendingUp,
  Settings2,
} from "lucide-react";
import {
  AppPage,
  AppPageHeader,
  AppPageBody,
} from "../../components/ui/app-shell";
import AppSkeleton from "../../components/ui/AppSkeleton";
import { HrContentFrame, HrPrimaryTabs } from "../hr/components/HrTabLayout";
import { useUrlTab } from "../../hooks/useUrlTab";
import { usePermission } from "../../hooks/permission/usePermission";
import Budget from "../BudgetManagement/Budget/budget";
import BudgetHeadTable from "./budgethead/budgetHead";
import BudgetSetup from "./BudgetSetup";
import BranchBudgetRequest from "./request/request";

import CreateBudget from "../BudgetManagement/Budget/addBudgetModal";




const TabPlaceholder: React.FC<{ title: string }> = ({ title }) => (
  <div className="flex h-64 items-center justify-center rounded-xl border border-dashed border-[var(--border)] text-sm text-muted">
    {title} content goes here
  </div>
);

// ─── Config ──────────────────────────────────────────────────────────────────

const BUDGET_BASE_PATH = "/Budget-Management";


const BUDGET_TABS = [
  { id: "setup", label: "Setup", icon: <Settings2 size={14} />, modules: ["Budget Head"] },
  { id: "budget", label: "Budget", icon: <Wallet size={14} />, modules: ["Budget"] },
  { id: "request", label: "Request", icon: <Settings2 size={14} />, modules: ["Request"] },
  { id: "transfer", label: "Transfer", icon: <ArrowLeftRight size={14} />, modules: ["Budget"] },
  { id: "supplementary", label: "Supplementary Budget", icon: <PlusCircle size={14} />, modules: ["Budget"] },
  { id: "variance", label: "Variance", icon: <TrendingUp size={14} />, modules: ["Budget"] },
];

// ─── Page ────────────────────────────────────────────────────────────────────

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
{tab === "request" && <BranchBudgetRequest/>}
{tab === "budget" &&
  (creating ? (
    <CreateBudget
  onBack={() => setCreating(false)}
  workflowName="Tier 2 Ledger Policy"
/>
  ) : (
    <Budget onAddBudget={() => setCreating(true)} />
  ))}


            {tab === "transfer" && <TabPlaceholder title="Transfer" />}
            {tab === "supplementary" && <TabPlaceholder title="Supplementary Budget" />}
            {tab === "variance" && <TabPlaceholder title="Variance" />}
          </HrContentFrame>
        </Suspense>
      </AppPageBody>
    </AppPage>
  );
};

export default BudgetManagement;